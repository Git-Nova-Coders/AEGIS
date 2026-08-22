const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("AegisInsurance Smart Contract", function () {
  let contract;
  let owner, oracle, policyHolder, otherAccount;

  const BPS_DENOMINATOR = 10000;
  const coverageAmount = ethers.parseEther("1.0");
  const premiumAmount = ethers.parseEther("0.05");
  const durationSeconds = 30 * 86400; // 30 days
  const riskThresholdBps = 8000; // 80.00%
  const confidenceThresholdBps = 8500; // 85.00%
  const initialRiskBps = 2500; // 25.00%

  beforeEach(async function () {
    [owner, oracle, policyHolder, otherAccount] = await ethers.getSigners();

    const AegisInsurance = await ethers.getContractFactory("AegisInsurance");
    contract = await AegisInsurance.deploy(oracle.address, {
      value: ethers.parseEther("10.0"), // Fund pool with 10 ETH
    });
  });

  describe("Policy Creation", function () {
    it("Should mint a new policy and emit PolicyCreated event", async function () {
      await expect(
        contract.connect(policyHolder).createPolicy(
          coverageAmount,
          durationSeconds,
          riskThresholdBps,
          confidenceThresholdBps,
          initialRiskBps,
          { value: premiumAmount }
        )
      )
        .to.emit(contract, "PolicyCreated")
        .withArgs(
          1,
          policyHolder.address,
          coverageAmount,
          premiumAmount,
          await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1),
          await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1 + durationSeconds),
          riskThresholdBps,
          confidenceThresholdBps
        );

      const policy = await contract.getPolicy(1);
      expect(policy.policyHolder).to.equal(policyHolder.address);
      expect(policy.coverageAmountWei).to.equal(coverageAmount);
      expect(policy.paidOut).to.equal(false);
    });

    it("Should reject policy creation if premium is zero", async function () {
      await expect(
        contract.connect(policyHolder).createPolicy(
          coverageAmount,
          durationSeconds,
          riskThresholdBps,
          confidenceThresholdBps,
          initialRiskBps,
          { value: 0 }
        )
      ).to.be.revertedWith("AEGIS: Premium must be deposited");
    });
  });

  describe("Oracle Settlement & Autonomous Payout", function () {
    beforeEach(async function () {
      await contract.connect(policyHolder).createPolicy(
        coverageAmount,
        durationSeconds,
        riskThresholdBps,
        confidenceThresholdBps,
        initialRiskBps,
        { value: premiumAmount }
      );
    });

    it("Should execute automatic payout when criteria are met", async function () {
      const eventHash = ethers.keccak256(ethers.toUtf8Bytes("QUALIFYING_CARDIAC_EVENT"));
      const observedRiskBps = 9200; // 92.00% >= 80.00%
      const observedConfidenceBps = 9500; // 95.00% >= 85.00%

      const initialBalance = await ethers.provider.getBalance(policyHolder.address);

      await expect(
        contract.connect(oracle).submitOracleData(
          1,
          observedRiskBps,
          observedConfidenceBps,
          eventHash
        )
      )
        .to.emit(contract, "AutomaticPayoutExecuted")
        .withArgs(1, policyHolder.address, coverageAmount, await ethers.provider.getBlock("latest").then((b) => b.timestamp + 1));

      const policy = await contract.getPolicy(1);
      expect(policy.paidOut).to.equal(true);

      const finalBalance = await ethers.provider.getBalance(policyHolder.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should reject oracle submission from unauthorized caller", async function () {
      const eventHash = ethers.keccak256(ethers.toUtf8Bytes("UNAUTHORIZED_EVENT"));
      await expect(
        contract.connect(otherAccount).submitOracleData(1, 9500, 9500, eventHash)
      ).to.be.revertedWith("AEGIS: Unauthorized oracle caller");
    });

    it("Should not release payout if observed risk is below threshold", async function () {
      const eventHash = ethers.keccak256(ethers.toUtf8Bytes("MILD_EVENT"));
      const observedRiskBps = 6000; // 60.00% < 80.00%
      const observedConfidenceBps = 9500;

      await contract.connect(oracle).submitOracleData(
        1,
        observedRiskBps,
        observedConfidenceBps,
        eventHash
      );

      const policy = await contract.getPolicy(1);
      expect(policy.paidOut).to.equal(false);
    });
  });
});
