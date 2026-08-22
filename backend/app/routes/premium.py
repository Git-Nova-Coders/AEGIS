"""
AEGIS Dynamic Actuarial Pricing Routes
"""

from fastapi import APIRouter, HTTPException
from backend.app.schemas.models import PremiumCalculationRequest, PremiumBreakdown
from backend.app.services.pricing_service import ActuarialPricingService

router = APIRouter(prefix="/api", tags=["Dynamic Premium Engine"])


@router.post("/calculate-premium", response_model=PremiumBreakdown)
def calculate_insurance_premium(req: PremiumCalculationRequest):
    """
    Dynamically computes expected loss, variance risk loading, operational margin, and total premium.
    """
    try:
        breakdown = ActuarialPricingService.calculate_premium(
            risk_probability=req.risk_probability,
            coverage_amount=req.coverage_amount,
            duration_months=req.duration_months,
            risk_category=req.risk_category or "MODERATE",
        )
        return PremiumBreakdown(**breakdown)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Premium calculation failed: {str(e)}")
