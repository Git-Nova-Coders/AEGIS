# AEGIS System Architecture & Protocol Design

## 1. System Overview
**AEGIS** is an AI-native autonomous parametric health insurance protocol designed to eliminate administrative claims processing, claims adjusters, and payment friction through a decentralized, algorithmic pipeline.

```mermaid
flowchart TB
    subgraph Client Layer
        Web[React + Vite Frontend Dashboard]
        Wallet[Web3 Wallet / Provider]
    end

    subgraph API & Compute Layer
        API[FastAPI Backend Gateway]
        RiskEngine[AI Risk Engine - LightGBM Calibrated]
        PricingEngine[Actuarial Dynamic Pricing Engine]
        OracleNode[Decentralized Oracle Simulator]
    end

    subgraph Blockchain Layer
        Contract[AegisInsurance.sol Smart Contract]
        Ledger[On-Chain Policy Registry & Payout Pool]
    end

    Web <-->|REST API| API
    Wallet <-->|Ethers.js / Web3| Contract
    API --> RiskEngine
    API --> PricingEngine
    API --> OracleNode
    OracleNode -->|Signed Cryptographic Telemetry| Contract
    Contract --> Ledger
    Contract -->|Automatic Payout| Wallet
```

---

## 2. Component Responsibilities

| Component | Technology | Primary Function |
| :--- | :--- | :--- |
| **Frontend Web App** | React 18, Vite, Vanilla CSS | Interactive risk assessment, policy configuration, dynamic quoting, trigger simulation console, and on-chain ledger. |
| **Backend API** | Python 3.13, FastAPI, Pydantic | REST gateway connecting ML inference, dynamic actuarial pricing formulas, and oracle dispatch. |
| **AI Risk Engine** | Scikit-Learn, LightGBM, SHAP | Preprocessing pipeline and Platt-calibrated model estimating physical health impairment risk ($P \in [0, 1]$) with defensible confidence ($0.70-0.99$). |
| **Actuarial Pricing Engine** | Python | Mathematical expected loss calculation with variance risk loading ($\lambda = 0.12$) and operational margin ($\mu = 0.035$). |
| **Smart Contract Layer** | Solidity 0.8.20 | Autonomous parametric policy ledger enforcing independent trigger verification and non-reentrant payouts. |
| **Oracle Service** | Python, SHA-256 Signatures | External event validation node bridging verified medical telemetry into smart contract method calls. |

---

## 3. End-to-End State Machine

```mermaid
stateDiagram-v2
    [*] --> Inactive: Applicant visits AEGIS
    Inactive --> Assessed: Submit Health Profile (AI Risk Engine)
    Assessed --> Quoted: Compute Actuarial Dynamic Premium
    Quoted --> Active: Deposit Premium & Mint Policy On-Chain
    
    state Active {
        [*] --> Monitoring
        Monitoring --> TriggerReceived: Oracle Submits Telemetry
        TriggerReceived --> Verifying: Smart Contract Audit
        Verifying --> Monitoring: Conditions Not Satisfied (Rejected)
    }

    Active --> PaidOut: Risk >= Threshold AND Conf >= Threshold (Settled)
    Active --> Expired: block.timestamp > endTime
    PaidOut --> [*]
    Expired --> [*]
```
