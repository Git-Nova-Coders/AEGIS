"""
AEGIS AI Risk Assessment Routes
"""

from fastapi import APIRouter, HTTPException
from backend.app.schemas.models import HealthProfileRequest, RiskPredictionResponse
from ml.src.predict import AegisRiskEngine

router = APIRouter(prefix="/api", tags=["AI Risk Engine"])
risk_engine = AegisRiskEngine()


@router.post("/predict-risk", response_model=RiskPredictionResponse)
def predict_health_risk(profile: HealthProfileRequest):
    """
    Predicts calibrated health risk probability, category, confidence, and SHAP factor breakdown.
    """
    try:
        result = risk_engine.predict_risk(profile.model_dump())
        return RiskPredictionResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Risk prediction failed: {str(e)}")
