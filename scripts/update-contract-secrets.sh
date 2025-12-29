#!/bin/bash

# Quick script to update contract deployment secrets
# This helps you add the private key and fix the RPC URL

echo "🔧 Update Contract Deployment Secrets"
echo "======================================"
echo ""

CONTRACTS_ENV="/Users/darthvader/startup/vibeconnect/contracts/.env"

echo "Current configuration:"
echo "----------------------"
grep "BASE_RPC_URL" "$CONTRACTS_ENV" || echo "BASE_RPC_URL not found"
grep "PRIVATE_KEY" "$CONTRACTS_ENV" | sed 's/=.*/=***/' || echo "PRIVATE_KEY not found"
echo ""

echo "Deployment Wallet Address: 0x6cAd2AA6B9b3E66c01f6B955971fe8FBf0a702c2"
echo "Deployment Wallet Private Key: 0xddf6da6519acbbbc7318683085f8323701164b35a6f227bc2d6bfe141be1fd77"
echo ""

read -p "Do you want to update the .env file with the deployment wallet? (yes/no): " confirm

if [ "$confirm" != "yes" ] && [ "$confirm" != "y" ]; then
    echo "Update cancelled."
    exit 0
fi

echo ""
echo "What's your Alchemy API key for Base Sepolia?"
echo "(It's the part after 'v2/' in your RPC URL)"
read -p "Alchemy API Key: " alchemy_key

if [ -z "$alchemy_key" ]; then
    echo "No API key provided. Exiting."
    exit 1
fi

# Update the .env file
cat > "$CONTRACTS_ENV" << EOF
# Auto-generated from encrypted secrets
# To update: run "node scripts/encrypt-secrets.js setup"

PRIVATE_KEY=0xddf6da6519acbbbc7318683085f8323701164b35a6f227bc2d6bfe141be1fd77
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/${alchemy_key}
BASESCAN_API_KEY=
EOF

echo ""
echo "✅ Updated contracts/.env"
echo ""
echo "Next steps:"
echo "1. Get testnet ETH for: 0x6cAd2AA6B9b3E66c01f6B955971fe8FBf0a702c2"
echo "   Visit: https://www.coinbase.com/faucets/base-sepolia-faucet"
echo ""
echo "2. Check your balance:"
echo "   cd contracts && npx hardhat run scripts/check-balance.js --network baseSepolia"
echo ""
echo "3. Deploy contracts:"
echo "   cd contracts && npx hardhat run scripts/deploy.js --network baseSepolia"
