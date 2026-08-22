"""
AEGIS On-Chain Policy Ledger Routes
"""

from typing import List
from fastapi import APIRouter, HTTPException
from backend.app.schemas.models import PolicyCreateRequest, PolicyRecord
from backend.app.services.policy_service import policy_service

router = APIRouter(prefix="/api", tags=["Policy Management"])


@router.post("/policies", response_model=PolicyRecord)
def create_policy(request: PolicyCreateRequest):
    """
    Creates and records a new parametric health insurance policy on the ledger.
    """
    try:
        policy = policy_service.create_policy(request)
        return PolicyRecord(**policy)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Policy creation failed: {str(e)}")


@router.get("/policies", response_model=List[PolicyRecord])
def get_all_policies():
    """
    Returns all active and settled policies on the ledger.
    """
    policies = policy_service.get_all_policies()
    return [PolicyRecord(**p) for p in policies]


@router.get("/policies/{policy_id}", response_model=PolicyRecord)
def get_policy(policy_id: str):
    """
    Retrieves specific policy information by Policy ID.
    """
    policy = policy_service.get_policy(policy_id)
    if not policy:
        raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
    return PolicyRecord(**policy)
