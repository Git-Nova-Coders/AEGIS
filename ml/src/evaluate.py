"""
AEGIS ML Evaluation & Calibration Module
Computes classification metrics, calibration curves, Brier scores,
applies probability calibration (Isotonic/Sigmoid), and generates SHAP explainability.
"""

import json
import logging
from pathlib import Path
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
import shap
from sklearn.calibration import CalibratedClassifierCV, calibration_curve
from sklearn.metrics import (
    accuracy_score,
    average_precision_score,
    brier_score_loss,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from ml.src.config import (
    MODELS_DIR,
    REPORTS_DIR,
    RANDOM_STATE,
    TARGET_NAME,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def evaluate_model(
    model,
    X: pd.DataFrame | np.ndarray,
    y: pd.Series | np.ndarray,
    model_name: str = "Model",
    threshold: float = 0.5,
) -> dict:
    """Computes comprehensive evaluation metrics including ROC-AUC, PR-AUC, Brier score."""
    y_pred_proba = model.predict_proba(X)[:, 1]
    y_pred = (y_pred_proba >= threshold).astype(int)

    roc_auc = float(roc_auc_score(y, y_pred_proba))
    pr_auc = float(average_precision_score(y, y_pred_proba))
    brier = float(brier_score_loss(y, y_pred_proba))
    acc = float(accuracy_score(y, y_pred))
    prec = float(precision_score(y, y_pred, zero_division=0))
    rec = float(recall_score(y, y_pred, zero_division=0))
    f1 = float(f1_score(y, y_pred, zero_division=0))
    cm = confusion_matrix(y, y_pred).tolist()

    metrics = {
        "model_name": model_name,
        "roc_auc": round(roc_auc, 4),
        "pr_auc": round(pr_auc, 4),
        "brier_score": round(brier, 4),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "threshold": threshold,
        "confusion_matrix": cm,
    }

    logger.info(
        f"[{model_name}] ROC-AUC: {roc_auc:.4f} | PR-AUC: {pr_auc:.4f} | Brier: {brier:.4f} | F1: {f1:.4f} | Rec: {rec:.4f}"
    )
    return metrics


def calibrate_model(
    base_model,
    X_train: pd.DataFrame,
    y_train: pd.Series,
    X_val: pd.DataFrame,
    y_val: pd.Series,
    method: str = "isotonic",
) -> CalibratedClassifierCV:
    """
    Applies probability calibration (Isotonic Regression or Platt Sigmoid)
    using pre-fitted base model on validation split.
    """
    logger.info(f"Calibrating model using {method} calibration on validation data...")
    # Using cv='prefit' since base_model is already fitted on training data
    calibrated_clf = CalibratedClassifierCV(estimator=base_model, method=method, cv="prefit")
    calibrated_clf.fit(X_val, y_val)
    return calibrated_clf


def plot_calibration_curves(
    models_dict: dict,
    X_test: pd.DataFrame,
    y_test: pd.Series,
    save_path: Path = None,
):
    """Plots reliability diagrams (calibration curves) for comparing models."""
    plt.figure(figsize=(9, 7))
    plt.plot([0, 1], [0, 1], "k:", label="Perfect Calibration (y = x)")

    for name, model in models_dict.items():
        y_prob = model.predict_proba(X_test)[:, 1]
        brier = brier_score_loss(y_test, y_prob)
        prob_true, prob_pred = calibration_curve(y_test, y_prob, n_bins=10, strategy="uniform")
        plt.plot(prob_pred, prob_true, "s-", label=f"{name} (Brier={brier:.4f})")

    plt.xlabel("Mean Predicted Probability", fontsize=11)
    plt.ylabel("Fraction of Positives (Empirical Risk)", fontsize=11)
    plt.ylim([-0.05, 1.05])
    plt.xlim([-0.05, 1.05])
    plt.title("AEGIS Reliability Diagram — Probability Calibration Comparison", fontsize=13, fontweight="bold")
    plt.legend(loc="upper left")
    plt.grid(True, linestyle="--", alpha=0.6)
    plt.tight_layout()

    if save_path:
        save_path.parent.mkdir(parents=True, exist_ok=True)
        plt.savefig(save_path, dpi=300)
        logger.info(f"Saved calibration curve plot to {save_path}")
    plt.close()


def generate_shap_summary(
    model_pipeline,
    X_sample: pd.DataFrame,
    feature_names: list[str],
    save_path: Path = None,
):
    """Generates SHAP summary plot for model explainability."""
    try:
        # Extract underlying classifier and preprocessor
        if hasattr(model_pipeline, "named_steps"):
            preprocessor = model_pipeline.named_steps["preprocessor"]
            classifier = model_pipeline.named_steps["classifier"]
            X_trans = preprocessor.transform(X_sample)
            transformed_feature_names = preprocessor.get_feature_names_out()
        else:
            classifier = model_pipeline
            X_trans = X_sample
            transformed_feature_names = feature_names

        # Tree explainer for tree models or Linear explainer
        explainer = shap.Explainer(classifier, X_trans)
        shap_values = explainer(X_trans)

        plt.figure(figsize=(10, 8))
        shap.summary_plot(
            shap_values.values if hasattr(shap_values, "values") else shap_values,
            X_trans,
            feature_names=transformed_feature_names,
            show=False,
            max_display=15,
        )
        plt.title("AEGIS AI Risk Factors — SHAP Feature Impact Summary", fontsize=13, fontweight="bold")
        plt.tight_layout()

        if save_path:
            save_path.parent.mkdir(parents=True, exist_ok=True)
            plt.savefig(save_path, dpi=300, bbox_inches="tight")
            logger.info(f"Saved SHAP summary plot to {save_path}")
        plt.close()
    except Exception as e:
        logger.warning(f"SHAP explanation plot skipped or encountered error: {e}")
