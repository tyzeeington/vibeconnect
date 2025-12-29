const hre = require("hardhat");

async function main() {
  const networkName = hre.network.name;
  console.log(`\n🔍 Checking balance on ${networkName}...`);

  try {
    const [deployer] = await hre.ethers.getSigners();
    console.log("Wallet address:", deployer.address);

    const balance = await deployer.provider.getBalance(deployer.address);
    const balanceInEth = hre.ethers.formatEther(balance);

    console.log("Balance:", balanceInEth, "ETH");

    if (parseFloat(balanceInEth) === 0) {
      console.log("\n❌ No ETH in wallet!");
      console.log("\nGet testnet ETH from:");
      console.log("  • Coinbase Faucet: https://www.coinbase.com/faucets/base-sepolia-faucet");
      console.log("  • Alchemy Faucet: https://www.alchemy.com/faucets/base-sepolia");
      console.log(`\nSend ETH to: ${deployer.address}`);
    } else if (parseFloat(balanceInEth) < 0.01) {
      console.log("\n⚠️  Low balance! You may need more ETH for deployment.");
      console.log("Recommended: At least 0.1 ETH for deploying all contracts");
    } else {
      console.log("\n✅ Sufficient balance for deployment!");
    }
  } catch (error) {
    console.error("\n❌ Error checking balance:");
    console.error(error.message);

    if (error.message.includes("invalid BigNumber")) {
      console.log("\n💡 Tip: Make sure your PRIVATE_KEY is set in .env");
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
