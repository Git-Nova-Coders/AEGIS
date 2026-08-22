"""
AEGIS ML Pipeline Unit Tests
Tests preprocessing, anti-leakage audit, calibration, and prediction consistency.
"""

import pytest
import numpy as np
import pandas as pd
from pathlib import Path

from ml.src.config import ALL_MODEL_FEATURES, MODELS_DIR
from ml.src.predict import AegisRiskEngine
from ml.src.preprocessing import audit_data_leakage


def test_anti_leakage_audit():
    """Verifies that audit catches prohibited leakage variables."""
    safe_features = ["_AGE_G", "SEXVAR", "_BMI5"]
    assert audit_data_leakage(pd.DataFrame(), safe_features) == safe_features

    leaked_features = ["_AGE_G", "PHYSHLTH"]
    with pytest.raises(ValueError, match="DATA LEAKAGE DETECTED"):
        audit_data_leakage(pd.DataFrame(), leaked_features)


def test_risk_engine_predictions():
    """Verifies that AegisRiskEngine produces calibrated, bounded risk predictions."""
    engine = AegisRiskEngine()

    healthy_profile = {
        "age_group": "25-34",
        "sex": "Female",
        "bmi": 21.5,
        "smoking_status": "Never smoked",
        "diabetes": 0,
        "heart_disease": 0,
        "stroke": 0,
        "asthma": 0,
        "copd": 0,
        "kidney_disease": 0,
        "arthritis": 0,
        "physical_activity": 1,
    }

    result = engine.predict_risk(healthy_profile)
    assert "risk_probability" in result
    assert "confidence" in result
    assert "risk_category" in result
    assert 0.0 <= result["risk_probability"] <= 1.0
    assert 0.70 <= result["confidence"] <= 1.0
    assert result["risk_category"] in ["LOW", "MODERATE", "HIGH", "VERY_HIGH"]
    assert result["risk_probability"] < 0.20  # Healthy should be low risk

    high_risk_profile = {
        "age_group": "65+",
        "sex": "Male",
        "bmi": 36.0,
        "smoking_status": "Current smoker (every day)",
        "diabetes": 1,
        "heart_disease": 1,
        "stroke": 1,
        "copd": 1,
        "kidney_disease": 1,
        "arthritis": 1,
        "physical_activity": 0,
    }
    result_hr = engine.predict_risk(high_risk_profile)
    assert result_hr["risk_probability"] > result["risk_probability"]
    assert result_hr["risk_category"] in ["HIGH", "VERY_HIGH"]


def test_confidence_bounds():
    """Verifies confidence calculation never exceeds [0.70, 0.99]."""
    for p in np.linspace(0, 1, 101):
        conf = AegisRiskEngine.calculate_confidence(p)
        assert 0.70 <= conf <= 0.99
