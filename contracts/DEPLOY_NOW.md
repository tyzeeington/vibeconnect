# Deploy Now - Immediate Action Guide

## ⚡ Ready to Deploy? Follow These Steps

### Prerequisites Checklist

- [ ] Node.js installed (`node -v` shows v18+)
- [ ] In `/home/user/vibeconnect/contracts` directory
- [ ] Dependencies installed (`npm install`)

### 3-Step Deployment

#### Step 1: Get Testnet ETH (2 minutes)

1. Go to: **https://www.coinbase.com/faucets/base-sepolia-faucet**
2. Paste your wallet address
3. Click "Send me ETH"
4. Wait for confirmation (~10 seconds)

#### Step 2: Configure Private Key (1 minute)

```bash
# Edit the .env file
nano .env

# Add your private key (no 0x prefix):
PRIVATE_KEY=your_64_character_private_key_here

# Save and exit: Ctrl+X, then Y, then Enter
```

#### Step 3: Deploy (2 minutes)

```bash
# Check you have enough ETH
npm run check-balance

# Deploy all contracts
npm run deploy:base-sepolia
```

**Expected output:**
```
✅ All contracts deployed successfully!

ProfileNFT deployed to: 0x...
ConnectionNFT deployed to: 0x...
PesoBytes deployed to: 0x...
```

---

## 📋 What to Do With Contract Addresses

### 1. Update Backend (.env)

```bash
cd ../backend
nano .env

# Add these lines (use your addresses from deployment):
BASE_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=same_private_key_as_deployment
PROFILE_NFT_CONTRACT=0x...
CONNECTION_NFT_CONTRACT=0x...
PESOBYTES_CONTRACT=0x...
```

### 2. Copy ABIs to Backend

```bash
cd ../contracts
./scripts/copy-abis.sh
```

### 3. Update Frontend (.env.local)

```bash
cd ../frontend
nano .env.local

# Add these lines:
NEXT_PUBLIC_PROFILE_NFT_ADDRESS=0x...
NEXT_PUBLIC_CONNECTION_NFT_ADDRESS=0x...
NEXT_PUBLIC_PESOBYTES_ADDRESS=0x...
```

---

## ✅ Verify Contracts (Optional but Recommended)

```bash
cd ../contracts

# Get Basescan API key from: https://basescan.org/myapikey
# Add to .env:
nano .env
# BASESCAN_API_KEY=your_key_here

# Verify each contract:
npx hardhat verify --network baseSepolia 0xYOUR_PROFILE_NFT_ADDRESS
npx hardhat verify --network baseSepolia 0xYOUR_CONNECTION_NFT_ADDRESS
npx hardhat verify --network baseSepolia 0xYOUR_PESOBYTES_ADDRESS 100000000
```

---

## ❓ Common Issues

### "Insufficient funds"
→ Get more ETH from faucet: https://www.coinbase.com/faucets/base-sepolia-faucet

### "Invalid private key"
→ Ensure no `0x` prefix, exactly 64 hex characters

### "Cannot connect to network"
→ Check internet connection, try again in 1 minute

---

## 📚 Need More Help?

- **Quick Guide:** [QUICK_START.md](QUICK_START.md)
- **Full Guide:** [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- **Checklist:** [POST_DEPLOYMENT_CHECKLIST.md](POST_DEPLOYMENT_CHECKLIST.md)

---

## 🎯 Success Criteria

You're done when:
- ✅ All 3 contracts deployed (see addresses in output)
- ✅ `deployment-addresses.json` file exists
- ✅ Backend `.env` updated with addresses
- ✅ ABIs copied to backend
- ✅ Frontend `.env.local` updated

**Total time:** ~10-15 minutes

---

**Need to deploy?** Start with Step 1 above! 🚀
