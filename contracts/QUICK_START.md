# Quick Start - Deploy to Base Sepolia

## TL;DR - 5 Minute Deployment

### 1. Install & Configure (2 min)

```bash
cd contracts/
npm install

# Edit .env file - add your private key
nano .env
# PRIVATE_KEY=your_key_here (no 0x prefix)
```

### 2. Get Testnet ETH (1 min)

Visit: https://www.coinbase.com/faucets/base-sepolia-faucet
- Paste your wallet address
- Receive 0.1 ETH instantly

### 3. Check Balance (10 sec)

```bash
npm run check-balance
```

Expected: `✅ Sufficient balance for deployment!`

### 4. Deploy (2 min)

```bash
npm run deploy:base-sepolia
```

### 5. Copy Contract Addresses

The script outputs addresses - copy them:
```
ProfileNFT deployed to: 0x...
ConnectionNFT deployed to: 0x...
PesoBytes deployed to: 0x...
```

---

## Post-Deployment Checklist

### Update Backend

Edit `/backend/.env`:
```bash
BASE_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=same_as_deployment_wallet
PROFILE_NFT_CONTRACT=0x...
CONNECTION_NFT_CONTRACT=0x...
PESOBYTES_CONTRACT=0x...
```

Copy ABIs:
```bash
cp artifacts/contracts/ProfileNFT.sol/ProfileNFT.json ../backend/app/abis/
cp artifacts/contracts/ConnectionNFT.sol/ConnectionNFT.json ../backend/app/abis/
cp artifacts/contracts/PesoBytes.sol/PesoBytes.json ../backend/app/abis/
```

### Update Frontend

Create `/frontend/.env.local`:
```bash
NEXT_PUBLIC_PROFILE_NFT_ADDRESS=0x...
NEXT_PUBLIC_CONNECTION_NFT_ADDRESS=0x...
NEXT_PUBLIC_PESOBYTES_ADDRESS=0x...
```

### Verify Contracts (Optional but Recommended)

Get Basescan API key: https://basescan.org/myapikey

Add to `/contracts/.env`:
```bash
BASESCAN_API_KEY=your_key
```

Run verification:
```bash
npx hardhat verify --network baseSepolia 0xPROFILE_NFT_ADDRESS
npx hardhat verify --network baseSepolia 0xCONNECTION_NFT_ADDRESS
npx hardhat verify --network baseSepolia 0xPESOBYTES_ADDRESS 100000000
```

---

## Troubleshooting

### "Insufficient funds" error
Get more ETH: https://www.coinbase.com/faucets/base-sepolia-faucet

### "Invalid private key" error
- Remove `0x` prefix from private key
- Check it's exactly 64 hex characters

### Can't connect to network
- Check internet connection
- Try public RPC: `BASE_RPC_URL=https://sepolia.base.org`

---

## What Gets Deployed?

1. **ProfileNFT** - User profile NFTs (soulbound, one per user)
2. **ConnectionNFT** - Connection memory NFTs (links two users)
3. **PesoBytes** - Reward token (100M initial supply to deployer)

All contracts are deployed with **you as the owner**, meaning only your backend (using the same private key) can mint NFTs and award tokens.

---

## Next Steps

1. ✅ Deployed contracts
2. ✅ Updated backend `.env`
3. ✅ Copied ABIs to backend
4. ✅ Updated frontend `.env.local`
5. ⏭️ Test minting from backend
6. ⏭️ Test frontend wallet connection
7. ⏭️ Verify contracts on Basescan

---

## Need Help?

See full guide: `DEPLOYMENT_GUIDE.md`

**Faucets:**
- Coinbase: https://www.coinbase.com/faucets/base-sepolia-faucet
- Alchemy: https://www.alchemy.com/faucets/base-sepolia

**Explorers:**
- View contracts: https://sepolia.basescan.org

**Resources:**
- Base Docs: https://docs.base.org
- Hardhat Docs: https://hardhat.org/docs
