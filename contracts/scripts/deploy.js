const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying AEGIS Smart Contract with account:", deployer.address);

  const oracleNodeAddress = "0x89205A3A3b2A69De6Dbf7f01ED13B2108B2c43e7";
  const initialPoolLiquidity = hre.ethers.parseEther("10.0");

  const AegisInsurance = await hre.ethers.getContractFactory("AegisInsurance");
  const contract = await AegisInsurance.deploy(oracleNodeAddress, {
    value: initialPoolLiquidity,
  });

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();

  console.log("AegisInsurance successfully deployed to:", contractAddress);
  console.log("Authorized Oracle Node:", oracleNodeAddress);
  console.log("Initial Pool Balance:", hre.ethers.formatEther(initialPoolLiquidity), "ETH");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
