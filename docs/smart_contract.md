# AEGIS Smart Contract Technical Reference

## Contract: `AegisInsurance.sol`
- **Compiler Version**: Solidity `^0.8.20`
- **License**: MIT
- **Design Paradigm**: Autonomous Parametric Policy Settlement with Circuit Breaker & Anti-Reentrancy Guards.

---

## 1. Data Structures

```solidity
enum PolicyStatus {
    ACTIVE,
    TRIGGERED,
    PAID_OUT,
    EXPIRED,
    CANCELLED
}

struct Policy {
    uint256 policyId;
    address payable policyHolder;
    uint256 coverageAmountWei;
    uint256 premiumAmountWei;
    uint256 startTime;
    uint256 endTime;
    uint256 riskThresholdBps;       // e.g. 8000 = 80.00%
    uint256 confidenceThresholdBps; // e.g. 8500 = 85.00%
    uint256 initialRiskBps;
    PolicyStatus status;
    bool paidOut;
}
```

---

## 2. Core Methods

### `createPolicy`
```solidity
function createPolicy(
    uint256 _coverageAmountWei,
    uint256 _durationSeconds,
    uint256 _riskThresholdBps,
    uint256 _confidenceThresholdBps,
    uint256 _initialRiskBps
) external payable returns (uint256)
```
- Mints a new policy on-chain, stores parametric trigger thresholds, and sets expiration timestamps.
- Requires `msg.value > 0` (deposited premium).

### `submitOracleData`
```solidity
function submitOracleData(
    uint256 _policyId,
    uint256 _observedRiskBps,
    uint256 _observedConfidenceBps,
    bytes32 _eventHash
) external onlyOracle whenNotPaused nonReentrant
```
- Authenticates oracle caller.
- Independently evaluates:
  $$\text{ObservedRiskBps} \ge \text{Policy.riskThresholdBps} \quad \land \quad \text{ObservedConfidenceBps} \ge \text{Policy.confidenceThresholdBps}$$
- Automatically invokes `_executePayoutInternal(_policyId)` upon satisfaction.

---

## 3. Security & Safety Circuit Breakers

1. **Reentrancy Protection**: Custom low-level `_reentrancyStatus` mutex guard.
2. **Oracle Authentication (`onlyOracle`)**: Rejects arbitrary external or frontend calls.
3. **Emergency Circuit Breaker (`togglePause`)**: Protocol owner can halt operations during abnormal market conditions.
4. **Duplicate Payout Prohibition**: Hard state assertion `!policy.paidOut` prevents double-claim exploits.
5. **Basis Point Precision (BPS)**: All percentages use fixed-point arithmetic ($10,000\text{ BPS} = 100.00\%$) to prevent floating-point rounding vulnerabilities.
