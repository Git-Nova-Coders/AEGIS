# AEGIS REST API Specification

Base URL: `http://localhost:8000` (or configured deployment host)
Interactive Swagger Documentation: `http://localhost:8000/docs`

---

## 1. AI Risk Engine

### `POST /api/predict-risk`
Evaluates demographic, biometric, and chronic disease indicators to output a calibrated health impairment risk assessment.

**Request Payload**:
```json
{
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
```

**Response Payload**:
```json
{
  "risk_probability": 0.5679,
  "risk_score": 56.79,
  "risk_category": "HIGH",
  "confidence": 0.8420,
  "contributing_factors": [
    "+ History of Cardiovascular / Heart Disease",
    "+ Diagnosed Arthritis / Joint Disorder",
    "+ Former Tobacco Smoking History"
  ],
  "model_version": "v1.0.0-calibrated"
}
```

---

## 2. Dynamic Actuarial Pricing

### `POST /api/calculate-premium`
Computes dynamic actuarial premiums using Expected Loss + Variance Risk Loading.

**Request Payload**:
```json
{
  "risk_probability": 0.5679,
  "coverage_amount": 10000.0,
  "duration_months": 12,
  "risk_category": "HIGH"
}
```

**Response Payload**:
```json
{
  "expected_loss": 5679.00,
  "risk_loading": 594.44,
  "operational_margin": 350.00,
  "base_annual_premium": 6623.44,
  "total_premium": 6623.44,
  "monthly_installment": 551.95,
  "duration_months": 12,
  "coverage_amount": 10000.0,
  "risk_probability": 0.5679
}
```

---

## 3. On-Chain Policy Ledger

### `POST /api/policies`
Creates and registers a new parametric health insurance policy on the ledger.

### `GET /api/policies`
Returns all active and settled policies on the protocol ledger.

### `GET /api/policies/{policy_id}`
Retrieves specific policy information by Policy ID.

---

## 4. Oracle Simulation Layer

### `POST /api/oracle/simulate-trigger`
Submits a signed simulated real-world health event to the smart contract layer.

**Request Payload**:
```json
{
  "policy_id": "AEGIS-POL-0001",
  "event_type": "HEALTH_RISK_TRIGGER",
  "observed_risk_probability": 0.94,
  "observed_confidence": 0.97,
  "event_description": "Qualifying Acute Cardiovascular Biomarker Escalation"
}
```

**Response Payload**:
```json
{
  "event_id": "ORACLE-EVT-7A4F2C",
  "policy_id": "AEGIS-POL-0001",
  "event_type": "HEALTH_RISK_TRIGGER",
  "observed_risk_probability": 0.94,
  "observed_confidence": 0.97,
  "timestamp": 1724335800,
  "signature": "0x3b82f6...",
  "condition_met": true,
  "payout_executed": true,
  "payout_tx_hash": "0x9533b0ed...",
  "settlement_message": "AUTONOMOUS PAYOUT SETTLED: $10,000.00 released to 0x71C..."
}
```
