const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const networkName = hre.network.name;
  console.log(`Deploying VibeConnect contracts to ${networkName}...`);

  // Get deployer account
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  console.log("Account balance:", (await deployer.provider.getBalance(deployer.address)).toString());
  
  // 1. Deploy ProfileNFT
  console.log("\n1. Deploying ProfileNFT...");
  const ProfileNFT = await hre.ethers.getContractFactory("ProfileNFT");
  const profileNFT = await ProfileNFT.deploy();
  await profileNFT.waitForDeployment();
  const profileNFTAddress = await profileNFT.getAddress();
  console.log("ProfileNFT deployed to:", profileNFTAddress);
  
  // 2. Deploy ConnectionNFT
  console.log("\n2. Deploying ConnectionNFT...");
  const ConnectionNFT = await hre.ethers.getContractFactory("ConnectionNFT");
  const connectionNFT = await ConnectionNFT.deploy();
  await connectionNFT.waitForDeployment();
  const connectionNFTAddress = await connectionNFT.getAddress();
  console.log("ConnectionNFT deployed to:", connectionNFTAddress);
  
  // 3. Deploy PesoBytes (with 100M initial supply)
  console.log("\n3. Deploying PesoBytes token...");
  const initialSupply = 100_000_000; // 100 million tokens
  const PesoBytes = await hre.ethers.getContractFactory("PesoBytes");
  const pesoBytes = await PesoBytes.deploy(initialSupply);
  await pesoBytes.waitForDeployment();
  const pesoBytesAddress = await pesoBytes.getAddress();
  console.log("PesoBytes deployed to:", pesoBytesAddress);
  console.log("Initial supply:", initialSupply, "PESO");
  
  // Save deployment addresses
  const deploymentData = {
    network: hre.network.name,
    deployer: deployer.address,
    contracts: {
      ProfileNFT: profileNFTAddress,
      ConnectionNFT: connectionNFTAddress,
      PesoBytes: pesoBytesAddress
    },
    deployedAt: new Date().toISOString()
  };
  
  fs.writeFileSync(
    "deployment-addresses.json",
    JSON.stringify(deploymentData, null, 2)
  );
  
  console.log("\n✅ All contracts deployed successfully!");
  console.log("\nDeployment addresses saved to deployment-addresses.json");
  console.log("\nNext steps:");
  console.log("1. Update backend/.env with these contract addresses:");
  console.log(`   PROFILE_NFT_CONTRACT=${profileNFTAddress}`);
  console.log(`   CONNECTION_NFT_CONTRACT=${connectionNFTAddress}`);
  console.log(`   PESOBYTES_CONTRACT=${pesoBytesAddress}`);
  const explorerName = networkName.includes('base') ? 'Basescan' : 'PolygonScan';
  console.log(`\n2. Verify contracts on ${explorerName}:`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${profileNFTAddress}`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${connectionNFTAddress}`);
  console.log(`   npx hardhat verify --network ${hre.network.name} ${pesoBytesAddress} ${initialSupply}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
