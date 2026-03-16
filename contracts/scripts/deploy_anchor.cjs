const hre = require("hardhat");

async function main() {
  const adminKeys = await hre.ethers.getSigners();
  const sequencer = process.env.PUBLIC_ADDRESS || adminKeys[0].address;
  const dummyZkVerifier = "0x0000000000000000000000000000000000000000";

  console.log("Preparing deployment to Base Sepolia...");
  console.log("-----------------------------------------");
  console.log("Authorized Sequencer Address:", sequencer);

  const AnchorFactory = await hre.ethers.getContractFactory("BotCashAnchor");
  const anchor = await AnchorFactory.deploy(sequencer, dummyZkVerifier);

  await anchor.waitForDeployment();
  const contractAddress = await anchor.getAddress();

  console.log("\n=========================================");
  console.log("BotCash L1 Anchor DEPLOYED!");
  console.log("Contract Address:", contractAddress);
  console.log("Network:", hre.network.name);
  console.log("=========================================");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
