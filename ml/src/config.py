"""
AEGIS ML Configuration
Centralized configuration for dataset paths, feature definitions, target mapping, and model parameters.
"""

from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
RAW_DATA_PATH = DATA_DIR / "raw" / "LLCP2024.XPT"
RAW_CODEBOOK_PATH = DATA_DIR / "raw" / "USCODE24_LLCP_082125.HTML"
PROCESSED_DATA_DIR = DATA_DIR / "processed"
MODELS_DIR = BASE_DIR / "ml" / "models"
REPORTS_DIR = BASE_DIR / "ml" / "reports"

# Random Seed
RANDOM_STATE = 42

# Target Variable Definition
TARGET_RAW_COL = "_PHYS14D"
TARGET_NAME = "high_risk_physical_health"

# Leakage audit: Variables that MUST be excluded from feature inputs
LEAKAGE_VARS = [
    "_PHYS14D",  # Target itself
    "PHYSHLTH",  # Direct source of _PHYS14D
    "_RFHLTH",   # Binary general health derived from GENHLTH
    "POORHLTH",  # Directly dependent on PHYSHLTH
    "GENHLTH",   # Self-reported overall health status (proxy)
]

# Raw BRFSS features to extract
RAW_FEATURE_COLS = [
    "_AGE_G",    # Six-level imputed age category (1-6)
    "SEXVAR",    # Sex (1=Male, 2=Female)
    "_BMI5",     # Body Mass Index (continuous, implied 2 decimals)
    "_SMOKER3",  # Smoker status (1=Everyday, 2=Someday, 3=Former, 4=Never, 9=Unknown)
    "DIABETE4",  # Diabetes diagnosis (1=Yes, 2=Gestational, 3=No, 4=Pre-diabetes)
    "CVDINFR4",  # Ever diagnosed with myocardial infarction / heart attack (1=Yes, 2=No)
    "CVDCRHD4",  # Ever diagnosed with angina / coronary heart disease (1=Yes, 2=No)
    "CVDSTRK3",  # Ever diagnosed with stroke (1=Yes, 2=No)
    "ASTHMA3",   # Ever told had asthma (1=Yes, 2=No)
    "CHCCOPD3",  # Ever diagnosed with COPD / emphysema / chronic bronchitis (1=Yes, 2=No)
    "CHCKDNY2",  # Ever told had kidney disease (1=Yes, 2=No)
    "HAVARTH4",  # Ever told had arthritis (1=Yes, 2=No)
    "EXERANY2",  # Exercise / physical activity in past 30 days (1=Yes, 2=No)
    "EDUCA",     # Education level (1-6, 9=Refused)
    "INCOME3",   # Income level (1-11, 77/99=Refused/Unknown)
    "PRIMINS2",  # Primary health insurance source (1-10, 88=None, 77/99=Unknown)
    "PERSDOC3",  # Personal doctor (1=Yes one, 2=More than one, 3=No, 7/9=Unknown)
    "MEDCOST1",  # Could not see doctor due to cost in past 12m (1=Yes, 2=No)
]

# Standardized Feature Names for Clean DataFrame
NUMERIC_FEATURES = [
    "bmi",
]

CATEGORICAL_FEATURES = [
    "age_group",
    "sex",
    "smoking_status",
    "education_level",
    "income_level",
    "insurance_type",
    "personal_doctor",
]

BINARY_FEATURES = [
    "diabetes",
    "heart_attack",
    "coronary_disease",
    "heart_disease_composite",
    "stroke",
    "asthma",
    "copd",
    "kidney_disease",
    "arthritis",
    "physical_activity",
    "medical_cost_barrier",
]

ALL_MODEL_FEATURES = NUMERIC_FEATURES + CATEGORICAL_FEATURES + BINARY_FEATURES

# Risk Categorization Thresholds (scientifically calibrated)
RISK_THRESHOLDS = {
    "LOW": (0.0, 0.20),
    "MODERATE": (0.20, 0.45),
    "HIGH": (0.45, 0.70),
    "VERY_HIGH": (0.70, 1.0),
}
