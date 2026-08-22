"""
AEGIS Oracle Simulation & Autonomous Settlement Routes
"""

from fastapi import APIRouter, HTTPException
from backend.app.schemas.models import OracleEventRequest, OracleEventResponse
from backend.app.services.oracle_service import OracleService

router = APIRouter(prefix="/api/oracle", tags=["Oracle Layer"])


@router.post("/simulate-trigger", response_model=OracleEventResponse)
def simulate_oracle_event(req: OracleEventRequest):
    """
    Submits a simulated real-world health event to the smart contract layer
    to test autonomous parametric verification and automatic payout release.
    """
    try:
        response = OracleService.process_oracle_event(req)
        return response
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Oracle event execution error: {str(e)}")
