"""
AEGIS Backend API Integration Tests
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_predict_risk_endpoint():
    payload = {
        "age_group": "45-54",
        "sex": "Male",
        "bmi": 29.4,
        "smoking_status": "Former smoker",
        "diabetes": 0,
        "heart_disease": 1,
        "stroke": 0,
        "asthma": 0,
        "copd": 0,
        "kidney_disease": 0,
        "arthritis": 1,
        "physical_activity": 0
    }
    response = client.post("/api/predict-risk", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "risk_probability" in data
    assert "risk_score" in data
    assert "confidence" in data
    assert "risk_category" in data
    assert "contributing_factors" in data
    assert len(data["contributing_factors"]) > 0


def test_calculate_premium_endpoint():
    payload = {
        "risk_probability": 0.35,
        "coverage_amount": 10000.0,
        "duration_months": 12,
        "risk_category": "MODERATE"
    }
    response = client.post("/api/calculate-premium", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["expected_loss"] == 3500.0
    assert data["total_premium"] > data["expected_loss"]
    assert data["monthly_installment"] > 0


def test_policy_creation_and_oracle_settlement():
    # 1. Create Policy
    create_payload = {
        "wallet_address": "0x71C...3a9",
        "holder_name": "Test User",
        "coverage_amount": 5000.0,
        "premium_amount": 350.0,
        "duration_months": 12,
        "risk_probability": 0.25,
        "risk_threshold": 0.70,
        "confidence_threshold": 0.80
    }
    create_res = client.post("/api/policies", json=create_payload)
    assert create_res.status_code == 200
    policy = create_res.json()
    policy_id = policy["policy_id"]
    assert policy["status"] == "ACTIVE"
    assert not policy["paid_out"]

    # 2. Simulate Oracle Trigger (Exceeding Thresholds)
    oracle_payload = {
        "policy_id": policy_id,
        "event_type": "HEALTH_RISK_TRIGGER",
        "observed_risk_probability": 0.88,
        "observed_confidence": 0.94,
        "event_description": "Verified acute health risk escalation"
    }
    oracle_res = client.post("/api/oracle/simulate-trigger", json=oracle_payload)
    assert oracle_res.status_code == 200
    oracle_data = oracle_res.json()
    assert oracle_data["condition_met"] is True
    assert oracle_data["payout_executed"] is True
    assert oracle_data["payout_tx_hash"] is not None

    # 3. Verify Policy Status in Ledger
    get_res = client.get(f"/api/policies/{policy_id}")
    assert get_res.status_code == 200
    updated_policy = get_res.json()
    assert updated_policy["status"] == "PAID_OUT"
    assert updated_policy["paid_out"] is True
