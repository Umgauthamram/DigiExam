const hre = require("hardhat");

async function main() {
  const ExamStorage = await hre.ethers.getContractFactory("ExamStorage");
  const examStorage = await ExamStorage.deploy();

  await examStorage.waitForDeployment();

  console.log(`ExamStorage deployed to: ${await examStorage.getAddress()}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
