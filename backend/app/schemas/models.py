"""
AEGIS Pydantic Data Models & Request/Response Schemas
"""

from typing import List, Optional
from pydantic import BaseModel, Field


class HealthProfileRequest(BaseModel):
    age_group: str = Field(default="35-44", description="Age category: 18-24, 25-34, 35-44, 45-54, 55-64, 65+")
    sex: str = Field(default="Male", description="Sex: Male or Female")
    bmi: float = Field(default=27.5, ge=12.0, le=70.0, description="Body Mass Index in kg/m²")
    smoking_status: str = Field(
        default="Never smoked",
        description="Smoking status: Never smoked, Former smoker, Current smoker (some days), Current smoker (every day)"
    )
    diabetes: int = Field(default=0, ge=0, le=1, description="Diagnosed diabetes (0 or 1)")
    heart_disease: int = Field(default=0, ge=0, le=1, description="History of heart attack or coronary disease (0 or 1)")
    stroke: int = Field(default=0, ge=0, le=1, description="History of stroke (0 or 1)")
    asthma: int = Field(default=0, ge=0, le=1, description="Diagnosed asthma (0 or 1)")
    copd: int = Field(default=0, ge=0, le=1, description="Diagnosed COPD / Emphysema (0 or 1)")
    kidney_disease: int = Field(default=0, ge=0, le=1, description="Diagnosed kidney disease (0 or 1)")
    arthritis: int = Field(default=0, ge=0, le=1, description="Diagnosed arthritis / joint condition (0 or 1)")
    physical_activity: int = Field(default=1, ge=0, le=1, description="Regular exercise in past 30 days (0 or 1)")
    education_level: str = Field(default="College Graduate (4+ yrs)", description="Education level")
    income_level: str = Field(default="$50k - $75k", description="Income bracket")
    insurance_type: str = Field(default="Employer / Union", description="Current insurance type")
    personal_doctor: str = Field(default="Yes, only one", description="Has personal doctor")
    medical_cost_barrier: int = Field(default=0, ge=0, le=1, description="Unable to afford doctor in past 12m (0 or 1)")


class RiskPredictionResponse(BaseModel):
    risk_probability: float
    risk_score: float
    risk_category: str
    confidence: float
    contributing_factors: List[str]
    model_version: str


class PremiumCalculationRequest(BaseModel):
    risk_probability: float = Field(..., ge=0.0, le=1.0)
    coverage_amount: float = Field(default=5000.0, gt=0)
    duration_months: int = Field(default=12, ge=1, le=60)
    risk_category: Optional[str] = "MODERATE"


class PremiumBreakdown(BaseModel):
    expected_loss: float
    risk_loading: float
    operational_margin: float
    base_annual_premium: float
    total_premium: float
    monthly_installment: float
    duration_months: int
    coverage_amount: float
    risk_probability: float


class PolicyCreateRequest(BaseModel):
    wallet_address: str
    holder_name: Optional[str] = "Anonymous Policyholder"
    coverage_amount: float
    premium_amount: float
    duration_months: int
    risk_probability: float
    risk_threshold: float = Field(default=0.75, ge=0.0, le=1.0)
    confidence_threshold: float = Field(default=0.85, ge=0.0, le=1.0)
    health_profile: Optional[dict] = None


class PolicyRecord(BaseModel):
    policy_id: str
    wallet_address: str
    holder_name: str
    coverage_amount: float
    premium_amount: float
    duration_months: int
    start_time: int
    end_time: int
    risk_threshold: float
    confidence_threshold: float
    initial_risk_probability: float
    status: str  # ACTIVE, TRIGGERED, PAID_OUT, EXPIRED
    paid_out: bool
    payout_amount: Optional[float] = 0.0
    payout_tx_hash: Optional[str] = None
    created_tx_hash: str
    oracle_event_id: Optional[str] = None


class OracleEventRequest(BaseModel):
    policy_id: str
    event_type: str = Field(default="HEALTH_RISK_TRIGGER")
    observed_risk_probability: float = Field(..., ge=0.0, le=1.0)
    observed_confidence: float = Field(..., ge=0.0, le=1.0)
    event_description: Optional[str] = "Simulated verified qualifying medical diagnosis / biomarker event"


class OracleEventResponse(BaseModel):
    event_id: str
    policy_id: str
    event_type: str
    observed_risk_probability: float
    observed_confidence: float
    timestamp: int
    signature: str
    condition_met: bool
    payout_executed: bool
    payout_tx_hash: Optional[str] = None
    settlement_message: str
