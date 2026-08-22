"""
AEGIS Policy Store & Blockchain Sync Service
Handles policy state lifecycle, minting, on-chain ledger emulation, and automatic payout execution.
"""

import hashlib
import json
import secrets
import time
from pathlib import Path
from typing import Dict, List, Optional

from backend.app.schemas.models import PolicyCreateRequest, PolicyRecord


class PolicyService:
    """Manages active on-chain and simulated parametric insurance policies."""

    def __init__(self, storage_file: Path = Path("data/processed/policies_ledger.json")):
        self.storage_file = storage_file
        self.policies: Dict[str, dict] = {}
        self._load_policies()

    def _load_policies(self):
        if self.storage_file.exists():
            try:
                with open(self.storage_file, "r", encoding="utf-8") as f:
                    self.policies = json.load(f)
            except Exception:
                self.policies = {}
        else:
            self.policies = {}

    def _save_policies(self):
        self.storage_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.storage_file, "w", encoding="utf-8") as f:
            json.dump(self.policies, f, indent=2)

    def create_policy(self, request: PolicyCreateRequest) -> dict:
        policy_counter = len(self.policies) + 1
        policy_id = f"AEGIS-POL-{policy_counter:04d}"
        now = int(time.time())
        duration_seconds = request.duration_months * 30 * 86400
        end_time = now + duration_seconds

        # Generate cryptographic simulated on-chain transaction hash
        raw_hash_input = f"{policy_id}:{request.wallet_address}:{now}:{secrets.token_hex(8)}"
        created_tx_hash = "0x" + hashlib.sha256(raw_hash_input.encode()).hexdigest()

        policy_data = {
            "policy_id": policy_id,
            "wallet_address": request.wallet_address,
            "holder_name": request.holder_name or "Anonymous Policyholder",
            "coverage_amount": round(request.coverage_amount, 2),
            "premium_amount": round(request.premium_amount, 2),
            "duration_months": request.duration_months,
            "start_time": now,
            "end_time": end_time,
            "risk_threshold": round(request.risk_threshold, 4),
            "confidence_threshold": round(request.confidence_threshold, 4),
            "initial_risk_probability": round(request.risk_probability, 4),
            "status": "ACTIVE",
            "paid_out": False,
            "payout_amount": 0.0,
            "payout_tx_hash": None,
            "created_tx_hash": created_tx_hash,
            "oracle_event_id": None,
            "health_profile": request.health_profile or {},
        }

        self.policies[policy_id] = policy_data
        self._save_policies()
        return policy_data

    def get_policy(self, policy_id: str) -> Optional[dict]:
        return self.policies.get(policy_id)

    def get_all_policies(self) -> List[dict]:
        # Return sorted by newest first
        return sorted(list(self.policies.values()), key=lambda x: x["start_time"], reverse=True)

    def execute_payout(self, policy_id: str, oracle_event_id: str) -> dict:
        policy = self.policies.get(policy_id)
        if not policy:
            raise ValueError(f"Policy {policy_id} not found.")

        if policy["paid_out"] or policy["status"] == "PAID_OUT":
            raise ValueError(f"Policy {policy_id} has already settled a payout.")

        now = int(time.time())
        payout_hash_input = f"PAYOUT:{policy_id}:{policy['wallet_address']}:{policy['coverage_amount']}:{now}"
        payout_tx_hash = "0x" + hashlib.sha256(payout_hash_input.encode()).hexdigest()

        policy["status"] = "PAID_OUT"
        policy["paid_out"] = True
        policy["payout_amount"] = policy["coverage_amount"]
        policy["payout_tx_hash"] = payout_tx_hash
        policy["oracle_event_id"] = oracle_event_id
        policy["settled_at"] = now

        self.policies[policy_id] = policy
        self._save_policies()
        return policy


# Singleton instance
policy_service = PolicyService()
