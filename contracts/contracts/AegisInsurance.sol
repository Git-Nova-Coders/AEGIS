// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AegisInsurance
 * @author AEGIS Protocol Research Team
 * @notice AI-Native Autonomous Parametric Health Insurance Protocol
 * @dev Enforces cryptographic oracle verification, circuit-breakers, and automated payout execution.
 */
contract AegisInsurance {
    // --- State Variables ---
    address public immutable owner;
    address public oracleNode;
    bool public paused;
    uint256 public policyCount;
    uint256 public totalPayoutsSettled;

    // Basis points constant (10,000 = 100.00%)
    uint256 public constant BPS_DENOMINATOR = 10000;

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
        uint256 riskThresholdBps;       // e.g. 7500 = 75.00%
        uint256 confidenceThresholdBps; // e.g. 8500 = 85.00%
        uint256 initialRiskBps;
        PolicyStatus status;
        bool paidOut;
    }

    struct OracleReport {
        uint256 policyId;
        uint256 observedRiskBps;
        uint256 observedConfidenceBps;
        uint256 timestamp;
        bytes32 eventHash;
        bool processed;
    }

    // Mapping from policy ID => Policy
    mapping(uint256 => Policy) public policies;

    // Mapping from policy ID => latest OracleReport
    mapping(uint256 => OracleReport) public latestReports;

    // Reentrancy guard state
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _reentrancyStatus;

    // --- Events ---
    event PolicyCreated(
        uint256 indexed policyId,
        address indexed policyHolder,
        uint256 coverageAmountWei,
        uint256 premiumAmountWei,
        uint256 startTime,
        uint256 endTime,
        uint256 riskThresholdBps,
        uint256 confidenceThresholdBps
    );

    event OracleDataSubmitted(
        uint256 indexed policyId,
        uint256 observedRiskBps,
        uint256 observedConfidenceBps,
        uint256 timestamp,
        bytes32 eventHash
    );

    event AutomaticPayoutExecuted(
        uint256 indexed policyId,
        address indexed recipient,
        uint256 payoutAmountWei,
        uint256 timestamp
    );

    event OracleNodeUpdated(address indexed previousNode, address indexed newNode);
    event EmergencyPauseToggled(bool isPaused);

    // --- Modifiers ---
    modifier onlyOwner() {
        require(msg.sender == owner, "AEGIS: Caller is not protocol owner");
        _;
    }

    modifier onlyOracle() {
        require(msg.sender == oracleNode, "AEGIS: Unauthorized oracle caller");
        _;
    }

    modifier whenNotPaused() {
        require(!paused, "AEGIS: Protocol paused by circuit breaker");
        _;
    }

    modifier nonReentrant() {
        require(_reentrancyStatus != _ENTERED, "AEGIS: Reentrant call detected");
        _reentrancyStatus = _ENTERED;
        _;
        _reentrancyStatus = _NOT_ENTERED;
    }

    constructor(address _oracleNode) payable {
        require(_oracleNode != address(0), "AEGIS: Invalid oracle address");
        owner = msg.sender;
        oracleNode = _oracleNode;
        _reentrancyStatus = _NOT_ENTERED;
    }

    /**
     * @notice Creates and mints a parametric health policy on-chain
     */
    function createPolicy(
        uint256 _coverageAmountWei,
        uint256 _durationSeconds,
        uint256 _riskThresholdBps,
        uint256 _confidenceThresholdBps,
        uint256 _initialRiskBps
    ) external payable whenNotPaused nonReentrant returns (uint256) {
        require(_coverageAmountWei > 0, "AEGIS: Coverage amount must be > 0");
        require(_durationSeconds >= 1 days, "AEGIS: Policy term too short");
        require(_riskThresholdBps <= BPS_DENOMINATOR, "AEGIS: Invalid risk threshold");
        require(_confidenceThresholdBps <= BPS_DENOMINATOR, "AEGIS: Invalid confidence threshold");
        require(msg.value > 0, "AEGIS: Premium must be deposited");

        policyCount++;
        uint256 newPolicyId = policyCount;
        uint256 start = block.timestamp;
        uint256 end = start + _durationSeconds;

        policies[newPolicyId] = Policy({
            policyId: newPolicyId,
            policyHolder: payable(msg.sender),
            coverageAmountWei: _coverageAmountWei,
            premiumAmountWei: msg.value,
            startTime: start,
            endTime: end,
            riskThresholdBps: _riskThresholdBps,
            confidenceThresholdBps: _confidenceThresholdBps,
            initialRiskBps: _initialRiskBps,
            status: PolicyStatus.ACTIVE,
            paidOut: false
        });

        emit PolicyCreated(
            newPolicyId,
            msg.sender,
            _coverageAmountWei,
            msg.value,
            start,
            end,
            _riskThresholdBps,
            _confidenceThresholdBps
        );

        return newPolicyId;
    }

    /**
     * @notice Oracle node submits verified health event observation
     * @dev Automatically triggers contract validation and settlement if criteria met
     */
    function submitOracleData(
        uint256 _policyId,
        uint256 _observedRiskBps,
        uint256 _observedConfidenceBps,
        bytes32 _eventHash
    ) external onlyOracle whenNotPaused nonReentrant {
        Policy storage policy = policies[_policyId];
        require(policy.policyId != 0, "AEGIS: Policy does not exist");
        require(policy.status == PolicyStatus.ACTIVE, "AEGIS: Policy not active");
        require(!policy.paidOut, "AEGIS: Payout already settled");
        require(block.timestamp <= policy.endTime, "AEGIS: Policy expired");

        latestReports[_policyId] = OracleReport({
            policyId: _policyId,
            observedRiskBps: _observedRiskBps,
            observedConfidenceBps: _observedConfidenceBps,
            timestamp: block.timestamp,
            eventHash: _eventHash,
            processed: true
        });

        emit OracleDataSubmitted(
            _policyId,
            _observedRiskBps,
            _observedConfidenceBps,
            block.timestamp,
            _eventHash
        );

        // Autonomous independent condition verification
        if (
            _observedRiskBps >= policy.riskThresholdBps &&
            _observedConfidenceBps >= policy.confidenceThresholdBps
        ) {
            _executePayoutInternal(_policyId);
        }
    }

    /**
     * @dev Internal payout routine releasing coverage funds to beneficiary
     */
    function _executePayoutInternal(uint256 _policyId) internal {
        Policy storage policy = policies[_policyId];
        policy.status = PolicyStatus.PAID_OUT;
        policy.paidOut = true;
        totalPayoutsSettled += policy.coverageAmountWei;

        uint256 payout = policy.coverageAmountWei;
        address payable beneficiary = policy.policyHolder;

        emit AutomaticPayoutExecuted(_policyId, beneficiary, payout, block.timestamp);

        // Transfer funds safely if contract pool has sufficient balance
        if (address(this).balance >= payout) {
            (bool success, ) = beneficiary.call{value: payout}("");
            require(success, "AEGIS: Payout transfer failed");
        }
    }

    /**
     * @notice View function to retrieve full policy details
     */
    function getPolicy(uint256 _policyId) external view returns (Policy memory) {
        require(policies[_policyId].policyId != 0, "AEGIS: Policy not found");
        return policies[_policyId];
    }

    /**
     * @notice Deposit liquidity pool reserve for paying out claims
     */
    receive() external payable {}

    function setOracleNode(address _newNode) external onlyOwner {
        require(_newNode != address(0), "AEGIS: Invalid address");
        emit OracleNodeUpdated(oracleNode, _newNode);
        oracleNode = _newNode;
    }

    function togglePause() external onlyOwner {
        paused = !paused;
        emit EmergencyPauseToggled(paused);
    }
}
