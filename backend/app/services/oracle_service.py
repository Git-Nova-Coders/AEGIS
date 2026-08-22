"""
AEGIS Parametric Oracle Service
Generates verified cryptographic event payloads, validates policy triggers,
and submits settlement triggers to the autonomous smart contract layer.
"""

import hashlib
import json
import secrets
import time
from backend.app.schemas.models import OracleEventRequest, OracleEventResponse
from backend.app.services.policy_service import policy_service


class OracleService:
    """Simulated decentralized oracle node for AEGIS health risk triggers."""

    ORACLE_NODE_ADDRESS = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7"

    @classmethod
    def process_oracle_event(cls, request: OracleEventRequest) -> OracleEventResponse:
        policy = policy_service.get_policy(request.policy_id)
        if not policy:
            raise ValueError(f"Policy {request.policy_id} does not exist.")

        now = int(time.time())
        event_id = f"ORACLE-EVT-{secrets.token_hex(6).upper()}"

        # Cryptographic event signature simulation
        event_payload = f"{event_id}:{request.policy_id}:{request.observed_risk_probability}:{request.observed_confidence}:{now}:{cls.ORACLE_NODE_ADDRESS}"
        signature = "0x" + hashlib.sha256(event_payload.encode()).hexdigest()

        # Autonomous condition verification against policy rules
        risk_met = request.observed_risk_probability >= policy["risk_threshold"]
        conf_met = request.observed_confidence >= policy["confidence_threshold"]
        is_active = policy["status"] == "ACTIVE" and not policy["paid_out"]
        not_expired = now <= policy["end_time"]

        conditions_satisfied = risk_met and conf_met and is_active and not_expired

        payout_executed = False
        payout_tx_hash = None
        message = ""

        if conditions_satisfied:
            # Smart contract verifies & releases funds
            settled_policy = policy_service.execute_payout(request.policy_id, event_id)
            payout_executed = True
            payout_tx_hash = settled_policy["payout_tx_hash"]
            message = (
                f"AUTONOMOUS PAYOUT SETTLED: Observed risk ({request.observed_risk_probability:.1%}) >= Threshold ({policy['risk_threshold']:.1%}) "
                f"and Confidence ({request.observed_confidence:.1%}) >= Threshold ({policy['confidence_threshold']:.1%}). "
                f"${settled_policy['coverage_amount']:,.2f} released to {policy['wallet_address']}."
            )
        else:
            reasons = []
            if not risk_met:
                reasons.append(f"Risk {request.observed_risk_probability:.1%} < Threshold {policy['risk_threshold']:.1%}")
            if not conf_met:
                reasons.append(f"Confidence {request.observed_confidence:.1%} < Threshold {policy['confidence_threshold']:.1%}")
            if not is_active:
                reasons.append("Policy is already paid out or inactive")
            if not not_expired:
                reasons.append("Policy has expired")
            message = f"TRIGGER REJECTED BY CONTRACT RULES: {', '.join(reasons)}."

        return OracleEventResponse(
            event_id=event_id,
            policy_id=request.policy_id,
            event_type=request.event_type,
            observed_risk_probability=request.observed_risk_probability,
            observed_confidence=request.observed_confidence,
            timestamp=now,
            signature=signature,
            condition_met=conditions_satisfied,
            payout_executed=payout_executed,
            payout_tx_hash=payout_tx_hash,
            settlement_message=message,
        )
