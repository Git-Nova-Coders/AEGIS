"""
AEGIS Live End-to-End System Verification Script
"""

import json
import urllib.request

def run_verification():
    print("=== 1. Testing Vite Frontend Server on http://127.0.0.1:5173/ ===")
    req = urllib.request.Request("http://127.0.0.1:5173/")
    with urllib.request.urlopen(req) as resp:
        html = resp.read().decode("utf-8")
        assert '<div id="root"></div>' in html
        print("Vite Server: OK (Status 200, HTML container verified)")

    print("\n=== 2. Testing FastAPI Backend on http://127.0.0.1:8000/health ===")
    with urllib.request.urlopen("http://127.0.0.1:8000/health") as resp:
        data = json.loads(resp.read().decode())
        print("Backend Health:", data)
        assert data["status"] == "healthy"

    print("\n=== 3. Testing AI Risk Engine Endpoint (/api/predict-risk) ===")
    senior_profile = {
        "age_group": "55-64",
        "sex": "Male",
        "bmi": 34.2,
        "smoking_status": "Current smoker (every day)",
        "diabetes": 1,
        "heart_disease": 1,
        "stroke": 0,
        "asthma": 0,
        "copd": 1,
        "kidney_disease": 1,
        "arthritis": 1,
        "physical_activity": 0
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/predict-risk",
        data=json.dumps(senior_profile).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        risk_res = json.loads(resp.read().decode())
        print(f"Risk Prob: {risk_res['risk_probability']:.1%} | Score: {risk_res['risk_score']} | Category: {risk_res['risk_category']} | Confidence: {risk_res['confidence']:.1%}")
        print("Factors:", risk_res["contributing_factors"])

    print("\n=== 4. Testing Actuarial Pricing Endpoint (/api/calculate-premium) ===")
    quote_payload = {
        "risk_probability": risk_res["risk_probability"],
        "coverage_amount": 10000.0,
        "duration_months": 12,
        "risk_category": risk_res["risk_category"]
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/calculate-premium",
        data=json.dumps(quote_payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        quote_res = json.loads(resp.read().decode())
        print(f"Expected Loss: ${quote_res['expected_loss']:,.2f} | Risk Loading: ${quote_res['risk_loading']:,.2f} | Total Premium: ${quote_res['total_premium']:,.2f}")

    print("\n=== 5. Testing Policy Creation on Ledger (/api/policies) ===")
    mint_payload = {
        "wallet_address": "0x71C83a9eB85124Bf9116e2518a221f414F5e3a9B",
        "holder_name": "Anshu Research Account",
        "coverage_amount": 10000.0,
        "premium_amount": quote_res["total_premium"],
        "duration_months": 12,
        "risk_probability": risk_res["risk_probability"],
        "risk_threshold": 0.80,
        "confidence_threshold": 0.85
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/policies",
        data=json.dumps(mint_payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        policy_res = json.loads(resp.read().decode())
        policy_id = policy_res["policy_id"]
        print(f"Policy Created: {policy_id} (Status: {policy_res['status']})")
        print(f"Tx Hash: {policy_res['created_tx_hash']}")

    print("\n=== 6. Testing Autonomous Oracle Event Settlement (/api/oracle/simulate-trigger) ===")
    oracle_payload = {
        "policy_id": policy_id,
        "event_type": "HEALTH_RISK_TRIGGER",
        "observed_risk_probability": 0.94,
        "observed_confidence": 0.97,
        "event_description": "Qualifying Acute Hospitalization & High Health-Risk Escalation"
    }
    req = urllib.request.Request(
        "http://127.0.0.1:8000/api/oracle/simulate-trigger",
        data=json.dumps(oracle_payload).encode(),
        headers={"Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req) as resp:
        oracle_res = json.loads(resp.read().decode())
        print(f"Condition Met: {oracle_res['condition_met']} | Payout Executed: {oracle_res['payout_executed']}")
        print(f"Settlement Message: {oracle_res['settlement_message']}")
        print(f"Payout Tx Hash: {oracle_res['payout_tx_hash']}")
        assert oracle_res["payout_executed"] is True

    print("\n=== 7. Verifying On-Chain Policy Ledger Status ===")
    with urllib.request.urlopen(f"http://127.0.0.1:8000/api/policies/{policy_id}") as resp:
        updated_pol = json.loads(resp.read().decode())
        print(f"Policy ID: {policy_id} | Status: {updated_pol['status']} | Paid Out: {updated_pol['paid_out']}")
        assert updated_pol["paid_out"] is True

    print("\n=======================================================")
    print(">>> COMPLETE AEGIS FULL-STACK PROTOCOL VERIFIED! <<<")
    print("=======================================================")

if __name__ == "__main__":
    run_verification()
