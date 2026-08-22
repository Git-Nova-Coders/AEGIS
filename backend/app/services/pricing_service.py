"""
AEGIS Actuarial Dynamic Pricing Service
Calculates mathematically sound, risk-adjusted insurance premiums
using Expected Loss, Standard-Deviation Risk Loading, and Operational Margins.
"""

import math
from ml.src.config import RISK_THRESHOLDS


class ActuarialPricingService:
    """Actuarial pricing engine for dynamic parametric insurance quoting."""

    # Actuarial parameters
    VARIANCE_LOADING_LAMBDA = 0.12  # Capital buffer for loss variance
    OPERATIONAL_MARGIN_MU = 0.035   # 3.5% operational and underwriting overhead
    MINIMUM_ANNUAL_FLOOR = 25.0     # Minimum annual premium floor

    @classmethod
    def calculate_premium(
        cls,
        risk_probability: float,
        coverage_amount: float,
        duration_months: int = 12,
        risk_category: str = "MODERATE",
    ) -> dict:
        """
        Calculates dynamic insurance premium breakdown.

        Mathematical Formulation:
        1. Expected Loss (Pure Premium):
           E[Loss] = P(Risk) * Coverage

        2. Risk Variance Loading (Actuarial Standard Deviation Principle):
           StdDev = sqrt(P * (1 - P)) * Coverage
           Risk_Loading = StdDev * Lambda

        3. Operational & Protocol Margin:
           Operational_Margin = Coverage * Mu

        4. Base Annual Premium:
           Annual_Premium = max(E[Loss] + Risk_Loading + Operational_Margin, Floor)

        5. Term Adjusted Total Premium:
           Total_Premium = Annual_Premium * (duration_months / 12)
        """
        # Ensure valid probability bounds
        p = max(0.001, min(0.999, risk_probability))
        cov = max(100.0, float(coverage_amount))
        months = max(1, int(duration_months))

        # 1. Pure Expected Loss
        expected_loss = p * cov

        # 2. Risk Variance Loading
        variance_std = math.sqrt(p * (1.0 - p)) * cov
        risk_loading = variance_std * cls.VARIANCE_LOADING_LAMBDA

        # 3. Operational & protocol maintenance margin
        operational_margin = cov * cls.OPERATIONAL_MARGIN_MU

        # 4. Base annual premium
        base_annual = expected_loss + risk_loading + operational_margin
        base_annual = max(base_annual, cls.MINIMUM_ANNUAL_FLOOR)

        # 5. Term scaling
        total_premium = base_annual * (months / 12.0)
        monthly_installment = total_premium / months

        return {
            "expected_loss": round(expected_loss, 2),
            "risk_loading": round(risk_loading, 2),
            "operational_margin": round(operational_margin, 2),
            "base_annual_premium": round(base_annual, 2),
            "total_premium": round(total_premium, 2),
            "monthly_installment": round(monthly_installment, 2),
            "duration_months": months,
            "coverage_amount": round(cov, 2),
            "risk_probability": round(p, 4),
        }
