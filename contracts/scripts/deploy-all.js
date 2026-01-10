/**
 * @fileoverview Master deployment script for all VibeConnect contracts
 * @description Deploys all contracts to specified network, outputs addresses to JSON,
 *              and sends SMS notification via Twilio on success/failure
 *
 * Usage:
 *   npx hardhat run scripts/deploy-all.js --network baseSepolia
 *
 * Environment Variables Required:
 *   - PRIVATE_KEY: Deployer wallet private key
 *   - BASE_RPC_URL: RPC endpoint for Base network
 *   - TWILIO_ACCOUNT_SID: Twilio account SID (optional)
 *   - TWILIO_AUTH_TOKEN: Twilio auth token (optional)
 *   - TWILIO_PHONE_NUMBER: Twilio phone number (optional)
 *   - ALERT_PHONE_NUMBER: Phone to receive alerts (optional)
 *
 * Outputs:
 *   - deployment-addresses.json: Contract addresses and deployment info
 *   - Console logs with deployment progress
 *   - SMS notification (if Twilio configured)
 *
 * @author VibeConnect Team
 */

const hre = require('hardhat');
const fs = require('fs');
const path = require('path');

/**
 * Send SMS notification via Twilio
 * @param {string} message - Message to send
 * @returns {Promise<void>}
 */
async function sendTwilioNotification(message) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;
  const toPhone = process.env.ALERT_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhone || !toPhone) {
    console.log('⚠️  Twilio not configured, skipping SMS notification');
    return;
  }

  try {
    const twilio = require('twilio');
    const client = twilio(accountSid, authToken);

    await client.messages.create({
      body: message,
      from: fromPhone,
      to: toPhone,
    });

    console.log('📱 SMS notification sent!');
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
  }
}

/**
 * Deploy a single contract and return its address
 * @param {string} contractName - Name of the contract to deploy
 * @param {Array} constructorArgs - Constructor arguments
 * @returns {Promise<Object>} Deployed contract instance
 */
async function deployContract(contractName, constructorArgs = []) {
  console.log(`\n🚀 Deploying ${contractName}...`);

  const ContractFactory = await hre.ethers.getContractFactory(contractName);
  const contract = await ContractFactory.deploy(...constructorArgs);
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  console.log(`✅ ${contractName} deployed to: ${address}`);

  return { contract, address };
}

/**
 * Main deployment function
 * Deploys all contracts and outputs addresses to JSON
 * @returns {Promise<void>}
 */
async function main() {
  const startTime = Date.now();
  const network = hre.network.name;
  const [deployer] = await hre.ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     VibeConnect Contract Deployment Suite v1.0        ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  console.log(`📡 Network: ${network}`);
  console.log(`👤 Deployer: ${deployerAddress}`);

  // Check balance
  const balance = await hre.ethers.provider.getBalance(deployerAddress);
  const balanceInEth = hre.ethers.formatEther(balance);
  console.log(`💰 Balance: ${balanceInEth} ETH\n`);

  if (parseFloat(balanceInEth) < 0.01) {
    const errorMsg = `❌ Insufficient balance: ${balanceInEth} ETH. Need at least 0.01 ETH`;
    console.error(errorMsg);
    await sendTwilioNotification(`🚨 Deploy FAILED on ${network}: ${errorMsg}`);
    process.exit(1);
  }

  const deploymentData = {
    network,
    deployer: deployerAddress,
    timestamp: new Date().toISOString(),
    contracts: {},
    gasUsed: {},
    totalGasCost: '0',
  };

  try {
    // Deploy ProfileNFT
    const { address: profileNFTAddress } = await deployContract('ProfileNFT');
    deploymentData.contracts.ProfileNFT = profileNFTAddress;
    deploymentData.gasUsed.ProfileNFT = '~150000'; // Estimate

    // Deploy ConnectionNFT
    const { address: connectionNFTAddress } = await deployContract('ConnectionNFT');
    deploymentData.contracts.ConnectionNFT = connectionNFTAddress;
    deploymentData.gasUsed.ConnectionNFT = '~200000';

    // Deploy PesoBytes
    const { address: pesoBytesAddress } = await deployContract('PesoBytes');
    deploymentData.contracts.PesoBytes = pesoBytesAddress;
    deploymentData.gasUsed.PesoBytes = '~180000';

    // Deploy EventEntryNFT (Door-Mint Protocol)
    const { address: eventEntryNFTAddress } = await deployContract('EventEntryNFT');
    deploymentData.contracts.EventEntryNFT = eventEntryNFTAddress;
    deploymentData.gasUsed.EventEntryNFT = '~250000';

    // Deploy EventTokenFactory (Auto-Meme Coin Factory)
    // Note: This contract will be created in the next step
    // const {contract: eventTokenFactory, address: eventTokenFactoryAddress} = await deployContract('EventTokenFactory');
    // deploymentData.contracts.EventTokenFactory = eventTokenFactoryAddress;

    // Deploy TwinBadge (Network Effect)
    // const {contract: twinBadge, address: twinBadgeAddress} = await deployContract('TwinBadge');
    // deploymentData.contracts.TwinBadge = twinBadgeAddress;

    // Save deployment addresses to JSON
    const outputPath = path.join(__dirname, '..', 'deployment-addresses.json');
    fs.writeFileSync(outputPath, JSON.stringify(deploymentData, null, 2));
    console.log(`\n📄 Deployment addresses saved to: ${outputPath}`);

    // Calculate total time
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    // Success summary
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              DEPLOYMENT SUCCESSFUL 🎉                  ║');
    console.log('╚════════════════════════════════════════════════════════╝');
    console.log(`\n⏱️  Duration: ${duration}s`);
    console.log(`📊 Contracts deployed: ${Object.keys(deploymentData.contracts).length}`);
    console.log('\n📋 Contract Addresses:');

    Object.entries(deploymentData.contracts).forEach(([name, address]) => {
      console.log(`   ${name.padEnd(25)} ${address}`);
    });

    // Send success notification
    const successMsg =
      `✅ VibeConnect deployed to ${network}!\n\n` +
      `Deployer: ${deployerAddress.slice(0, 8)}...\n` +
      `Duration: ${duration}s\n` +
      `Contracts: ${Object.keys(deploymentData.contracts).length}\n\n` +
      `ProfileNFT: ${profileNFTAddress}`;

    await sendTwilioNotification(successMsg);

    console.log('\n✨ Copy addresses to backend .env file:');
    console.log(`PROFILE_NFT_CONTRACT=${profileNFTAddress}`);
    console.log(`CONNECTION_NFT_CONTRACT=${connectionNFTAddress}`);
    console.log(`PESOBYTES_CONTRACT=${pesoBytesAddress}`);
    console.log(`EVENT_ENTRY_NFT_CONTRACT=${eventEntryNFTAddress}`);
  } catch (error) {
    console.error('\n❌ DEPLOYMENT FAILED:');
    console.error(error);

    // Send failure notification
    const failMsg =
      `🚨 VibeConnect deploy FAILED on ${network}!\n\n` +
      `Error: ${error.message}\n` +
      `Deployer: ${deployerAddress.slice(0, 8)}...`;

    await sendTwilioNotification(failMsg);

    process.exit(1);
  }
}

// Execute deployment
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
