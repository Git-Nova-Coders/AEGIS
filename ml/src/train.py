"""
AEGIS Model Training and Comparison Pipeline
Trains and compares Logistic Regression, Random Forest, XGBoost, and LightGBM models.
Performs probability calibration, evaluates on held-out test split, and serializes best artifacts.
"""

import json
import logging
from pathlib import Path
import joblib
import lightgbm as lgb
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline

from ml.src.config import (
    ALL_MODEL_FEATURES,
    MODELS_DIR,
    PROCESSED_DATA_DIR,
    RANDOM_STATE,
    REPORTS_DIR,
    TARGET_NAME,
)
from ml.src.evaluate import (
    calibrate_model,
    evaluate_model,
    generate_shap_summary,
    plot_calibration_curves,
)
from ml.src.features import build_preprocessor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def load_splits() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Loads parquet train, val, and test splits."""
    train_df = pd.read_parquet(PROCESSED_DATA_DIR / "train.parquet")
    val_df = pd.read_parquet(PROCESSED_DATA_DIR / "val.parquet")
    test_df = pd.read_parquet(PROCESSED_DATA_DIR / "test.parquet")
    logger.info(f"Loaded splits: Train={len(train_df):,}, Val={len(val_df):,}, Test={len(test_df):,}")
    return train_df, val_df, test_df


def train_and_compare_models():
    """Main training workflow."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    train_df, val_df, test_df = load_splits()

    X_train = train_df[ALL_MODEL_FEATURES]
    y_train = train_df[TARGET_NAME]

    X_val = val_df[ALL_MODEL_FEATURES]
    y_val = val_df[TARGET_NAME]

    X_test = test_df[ALL_MODEL_FEATURES]
    y_test = test_df[TARGET_NAME]

    # Class imbalance ratio
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos = neg_count / pos_count
    logger.info(f"Class distribution in Train: 0={neg_count:,}, 1={pos_count:,} (Ratio={scale_pos:.2f})")

    # Define Candidate Classifiers
    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000,
            C=1.0,
            class_weight="balanced",
            random_state=RANDOM_STATE,
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_split=20,
            class_weight="balanced",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        ),
        "LightGBM": lgb.LGBMClassifier(
            n_estimators=250,
            learning_rate=0.05,
            max_depth=6,
            num_leaves=31,
            scale_pos_weight=scale_pos,
            n_jobs=-1,
            random_state=RANDOM_STATE,
            verbose=-1,
        ),
        "XGBoost": xgb.XGBClassifier(
            n_estimators=250,
            learning_rate=0.05,
            max_depth=5,
            scale_pos_weight=scale_pos,
            eval_metric="logloss",
            n_jobs=-1,
            random_state=RANDOM_STATE,
        ),
    }

    # Fit preprocessor on X_train
    preprocessor = build_preprocessor()
    logger.info("Fitting feature preprocessor...")
    X_train_trans = preprocessor.fit_transform(X_train)
    X_val_trans = preprocessor.transform(X_val)
    X_test_trans = preprocessor.transform(X_test)

    # Save preprocessor artifact
    joblib.dump(preprocessor, MODELS_DIR / "preprocessor.joblib")
    logger.info("Saved preprocessor to ml/models/preprocessor.joblib")

    fitted_models = {}
    validation_metrics = []

    # Train each baseline model
    for name, clf in models.items():
        logger.info(f"--- Training {name} ---")
        clf.fit(X_train_trans, y_train)
        fitted_models[name] = clf

        # Evaluate on validation set
        metrics = evaluate_model(clf, X_val_trans, y_val, model_name=name)
        validation_metrics.append(metrics)

    # Perform Probability Calibration on Top Models (XGBoost and LightGBM)
    logger.info("--- Performing Probability Calibration (Isotonic & Sigmoid) ---")
    calibrated_models = {}

    for base_name in ["XGBoost", "LightGBM"]:
        base_clf = fitted_models[base_name]

        # Isotonic calibration
        cal_iso = calibrate_model(base_clf, X_train_trans, y_train, X_val_trans, y_val, method="isotonic")
        cal_iso_name = f"{base_name} (Calibrated Isotonic)"
        calibrated_models[cal_iso_name] = cal_iso
        metrics_iso = evaluate_model(cal_iso, X_test_trans, y_test, model_name=cal_iso_name)
        validation_metrics.append(metrics_iso)

        # Sigmoid calibration
        cal_sig = calibrate_model(base_clf, X_train_trans, y_train, X_val_trans, y_val, method="sigmoid")
        cal_sig_name = f"{base_name} (Calibrated Sigmoid)"
        calibrated_models[cal_sig_name] = cal_sig
        metrics_sig = evaluate_model(cal_sig, X_test_trans, y_test, model_name=cal_sig_name)
        validation_metrics.append(metrics_sig)

    # Combine all models for test evaluation & calibration plotting
    all_models_for_test = {**fitted_models, **calibrated_models}
    test_metrics = []
    for name, clf in all_models_for_test.items():
        m = evaluate_model(clf, X_test_trans, y_test, model_name=name)
        test_metrics.append(m)

    # Save Comparison Metrics
    comparison_results = {
        "validation_metrics": validation_metrics,
        "test_metrics": test_metrics,
    }
    with open(REPORTS_DIR / "model_comparison.json", "w") as f:
        json.dump(comparison_results, f, indent=2)
    logger.info(f"Saved model metrics comparison to {REPORTS_DIR / 'model_comparison.json'}")

    # Plot and save calibration curves on Test split
    plot_calibration_curves(
        models_dict={
            "XGBoost (Uncalibrated)": fitted_models["XGBoost"],
            "XGBoost (Isotonic)": calibrated_models["XGBoost (Calibrated Isotonic)"],
            "LightGBM (Isotonic)": calibrated_models["LightGBM (Calibrated Isotonic)"],
            "Logistic Regression": fitted_models["Logistic Regression"],
        },
        X_test=X_test_trans,
        y_test=y_test,
        save_path=REPORTS_DIR / "calibration_curves.png",
    )

    # Identify Best Model by Lowest Brier Score + High ROC-AUC on Test
    sorted_models = sorted(test_metrics, key=lambda x: (x["brier_score"], -x["roc_auc"]))
    best_model_name = sorted_models[0]["model_name"]
    best_clf = all_models_for_test[best_model_name]
    logger.info(f"Selected Best Model: {best_model_name}")

    # Create end-to-end Inference Pipeline (Preprocessor + Classifier)
    full_pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("classifier", best_clf),
        ]
    )

    # Save Best Model Artifacts
    joblib.dump(full_pipeline, MODELS_DIR / "best_calibrated_model.joblib")
    joblib.dump(fitted_models["XGBoost"], MODELS_DIR / "xgboost_raw.joblib")
    joblib.dump(fitted_models["LightGBM"], MODELS_DIR / "lightgbm_raw.joblib")
    joblib.dump(fitted_models["Logistic Regression"], MODELS_DIR / "logistic_regression.joblib")
    joblib.dump(fitted_models["Random Forest"], MODELS_DIR / "random_forest.joblib")
    logger.info(f"Saved production pipeline to {MODELS_DIR / 'best_calibrated_model.joblib'}")

    # Generate SHAP Explainability Plot on a representative sample
    logger.info("Generating SHAP summary for best model explainability...")
    sample_explain = X_test.sample(n=1000, random_state=RANDOM_STATE)
    generate_shap_summary(
        model_pipeline=Pipeline([("preprocessor", preprocessor), ("classifier", fitted_models["XGBoost"])]),
        X_sample=sample_explain,
        feature_names=ALL_MODEL_FEATURES,
        save_path=REPORTS_DIR / "shap_summary.png",
    )

    return comparison_results


if __name__ == "__main__":
    train_and_compare_models()
