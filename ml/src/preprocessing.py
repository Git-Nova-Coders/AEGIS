"""
AEGIS Data Preprocessing Pipeline
Loads raw CDC BRFSS 2024 data, applies codebook transformations, validates anti-leakage rules,
and generates clean datasets for training, evaluation, and downstream inference.
"""

import logging
from pathlib import Path
import numpy as np
import pandas as pd
import pyreadstat
from sklearn.model_selection import train_test_split

from ml.src.config import (
    RAW_DATA_PATH,
    PROCESSED_DATA_DIR,
    RANDOM_STATE,
    TARGET_RAW_COL,
    TARGET_NAME,
    LEAKAGE_VARS,
    RAW_FEATURE_COLS,
    ALL_MODEL_FEATURES,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


def load_raw_data(raw_path: Path = RAW_DATA_PATH) -> pd.DataFrame:
    """Loads required columns from the raw BRFSS XPT file using pyreadstat."""
    cols_to_load = list(set([TARGET_RAW_COL] + RAW_FEATURE_COLS))
    logger.info(f"Loading {len(cols_to_load)} columns from {raw_path}...")
    df, meta = pyreadstat.read_xport(str(raw_path), usecols=cols_to_load)
    logger.info(f"Raw data loaded successfully. Shape: {df.shape}")
    return df


def audit_data_leakage(df: pd.DataFrame, feature_cols: list[str]) -> list[str]:
    """Ensures no leakage variables are present in candidate features."""
    leaked = [col for col in feature_cols if col in LEAKAGE_VARS or col == TARGET_RAW_COL]
    if leaked:
        raise ValueError(f"DATA LEAKAGE DETECTED! Excluded variables found in features: {leaked}")
    logger.info("Anti-leakage audit PASSED: No target proxy variables present in feature set.")
    return feature_cols


def clean_brfss_data(raw_df: pd.DataFrame) -> pd.DataFrame:
    """
    Cleans raw CDC BRFSS variables into human-interpretable, standardized fields.
    Adheres strictly to the 2024 CDC BRFSS Codebook.
    """
    logger.info("Starting BRFSS codebook cleaning and transformation...")

    # 1. Filter target: Keep only valid _PHYS14D (1.0, 2.0, 3.0)
    valid_target_mask = raw_df[TARGET_RAW_COL].isin([1.0, 2.0, 3.0])
    df = raw_df[valid_target_mask].copy()
    logger.info(f"Filtered invalid/missing target rows. Kept {len(df):,} / {len(raw_df):,} rows.")

    # Target definition: 1.0 or 2.0 -> 0 (Lower Risk), 3.0 -> 1 (Higher Risk)
    df[TARGET_NAME] = (df[TARGET_RAW_COL] == 3.0).astype(int)

    # 2. Demographic & Biometrics
    # _AGE_G: 1-6
    age_map = {
        1.0: "18-24",
        2.0: "25-34",
        3.0: "35-44",
        4.0: "45-54",
        5.0: "55-64",
        6.0: "65+",
    }
    df["age_group"] = df["_AGE_G"].map(age_map).fillna("Unknown")

    # SEXVAR: 1=Male, 2=Female
    sex_map = {
        1.0: "Male",
        2.0: "Female",
    }
    df["sex"] = df["SEXVAR"].map(sex_map).fillna("Unknown")

    # _BMI5: Implied 2 decimal places (divide by 100)
    # Missing is coded as 9999 or NaN
    raw_bmi = df["_BMI5"] / 100.0
    # Realistic BMI bounds [12.0, 70.0]
    valid_bmi = raw_bmi.where((raw_bmi >= 12.0) & (raw_bmi <= 70.0))
    median_bmi = valid_bmi.median()
    df["bmi"] = valid_bmi.fillna(median_bmi).round(1)

    # _SMOKER3: 1=Everyday, 2=Someday, 3=Former, 4=Never
    smoker_map = {
        1.0: "Current smoker (every day)",
        2.0: "Current smoker (some days)",
        3.0: "Former smoker",
        4.0: "Never smoked",
    }
    df["smoking_status"] = df["_SMOKER3"].map(smoker_map).fillna("Unknown")

    # 3. Chronic Health Conditions (Binary: 1=Yes, 0=No/Other)
    df["diabetes"] = (df["DIABETE4"] == 1.0).astype(int)
    df["heart_attack"] = (df["CVDINFR4"] == 1.0).astype(int)
    df["coronary_disease"] = (df["CVDCRHD4"] == 1.0).astype(int)
    df["heart_disease_composite"] = ((df["CVDINFR4"] == 1.0) | (df["CVDCRHD4"] == 1.0)).astype(int)
    df["stroke"] = (df["CVDSTRK3"] == 1.0).astype(int)
    df["asthma"] = (df["ASTHMA3"] == 1.0).astype(int)
    df["copd"] = (df["CHCCOPD3"] == 1.0).astype(int)
    df["kidney_disease"] = (df["CHCKDNY2"] == 1.0).astype(int)
    df["arthritis"] = (df["HAVARTH4"] == 1.0).astype(int)

    # 4. Lifestyle & Healthcare Access
    # EXERANY2: 1=Yes, 2=No
    df["physical_activity"] = (df["EXERANY2"] == 1.0).astype(int)

    # MEDCOST1: 1=Yes (Could not afford doctor), 2=No
    df["medical_cost_barrier"] = (df["MEDCOST1"] == 1.0).astype(int)

    # EDUCA: Education level 1-6
    educa_map = {
        1.0: "Never attended / Kindergarten",
        2.0: "Elementary (Grades 1-8)",
        3.0: "Some High School (Grades 9-11)",
        4.0: "High School Graduate / GED",
        5.0: "Some College / Tech School",
        6.0: "College Graduate (4+ yrs)",
    }
    df["education_level"] = df["EDUCA"].map(educa_map).fillna("Unknown")

    # INCOME3: Income categories 1-11
    income_map = {
        1.0: "< $10k",
        2.0: "$10k - $15k",
        3.0: "$15k - $20k",
        4.0: "$20k - $25k",
        5.0: "$25k - $35k",
        6.0: "$35k - $50k",
        7.0: "$50k - $75k",
        8.0: "$75k - $100k",
        9.0: "$100k - $150k",
        10.0: "$150k - $200k",
        11.0: "$200k+",
    }
    df["income_level"] = df["INCOME3"].map(income_map).fillna("Unknown")

    # PRIMINS2: Primary Insurance Source
    ins_map = {
        1.0: "Employer / Union",
        2.0: "Private / Self-purchased",
        3.0: "Medicare",
        4.0: "Medigap",
        5.0: "Medicaid",
        6.0: "CHIP",
        7.0: "Military / VA / TRICARE",
        8.0: "Indian Health Service",
        9.0: "State Sponsored",
        10.0: "Other Government",
        88.0: "No Coverage",
    }
    df["insurance_type"] = df["PRIMINS2"].map(ins_map).fillna("Unknown")

    # PERSDOC3: Personal Doctor
    doc_map = {
        1.0: "Yes, only one",
        2.0: "More than one",
        3.0: "No personal doctor",
    }
    df["personal_doctor"] = df["PERSDOC3"].map(doc_map).fillna("Unknown")

    # Select final standardized columns
    final_cols = ALL_MODEL_FEATURES + [TARGET_NAME]
    clean_df = df[final_cols].copy()

    logger.info(f"Data cleaning complete. Clean shape: {clean_df.shape}")
    logger.info(f"Target distribution:\n{clean_df[TARGET_NAME].value_counts(normalize=True).round(4) * 100}%")

    return clean_df


def split_data(
    df: pd.DataFrame,
    test_size: float = 0.15,
    val_size: float = 0.15,
    random_state: int = RANDOM_STATE,
) -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Splits cleaned DataFrame into Stratified Train, Validation, and Test sets."""
    logger.info(f"Splitting data: Train {1.0 - test_size - val_size:.0%}, Val {val_size:.0%}, Test {test_size:.0%}")

    # First split off test set
    train_val_df, test_df = train_test_split(
        df,
        test_size=test_size,
        stratify=df[TARGET_NAME],
        random_state=random_state,
    )

    # Next split train and val
    relative_val_size = val_size / (1.0 - test_size)
    train_df, val_df = train_test_split(
        train_val_df,
        test_size=relative_val_size,
        stratify=train_val_df[TARGET_NAME],
        random_state=random_state,
    )

    logger.info(f"Split sizes: Train={len(train_df):,}, Val={len(val_df):,}, Test={len(test_df):,}")
    return train_df, val_df, test_df


def run_pipeline() -> tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame]:
    """Runs complete preprocessing pipeline and saves processed data."""
    PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    raw_df = load_raw_data()
    audit_data_leakage(raw_df, RAW_FEATURE_COLS)
    clean_df = clean_brfss_data(raw_df)

    # Save cleaned sample and full dataset in parquet format
    parquet_path = PROCESSED_DATA_DIR / "aegis_cleaned_brfss.parquet"
    clean_df.to_parquet(parquet_path, index=False)
    logger.info(f"Saved full cleaned dataset to {parquet_path}")

    # Save small CSV sample for lightweight inspection / frontend mock
    sample_path = PROCESSED_DATA_DIR / "aegis_sample_1000.csv"
    clean_df.sample(n=1000, random_state=RANDOM_STATE).to_csv(sample_path, index=False)
    logger.info(f"Saved 1,000-row sample to {sample_path}")

    train_df, val_df, test_df = split_data(clean_df)

    # Save splits
    train_df.to_parquet(PROCESSED_DATA_DIR / "train.parquet", index=False)
    val_df.to_parquet(PROCESSED_DATA_DIR / "val.parquet", index=False)
    test_df.to_parquet(PROCESSED_DATA_DIR / "test.parquet", index=False)
    logger.info("Saved train, val, and test parquet splits.")

    return train_df, val_df, test_df


if __name__ == "__main__":
    run_pipeline()
