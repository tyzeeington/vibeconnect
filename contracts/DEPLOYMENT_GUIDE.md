# VibeConnect Smart Contracts - Deployment Guide

## Overview

This guide covers deploying the VibeConnect smart contracts to Base Sepolia testnet.

### Contracts to Deploy

1. **ProfileNFT** - Soulbound NFT representing user profiles (non-transferable)
2. **ConnectionNFT** - NFT representing connections between users at events
3. **PesoBytes** - ERC20 reward token for making connections

---

## Contract Architecture & Dependencies

### Contract Relationships

```
┌─────────────────┐
│   ProfileNFT    │ ← Soulbound (cannot be transferred)
│  (Independent)  │ ← One per user
└─────────────────┘

┌─────────────────┐
│  ConnectionNFT  │ ← Records mutual connections
│  (Independent)  │ ← Links two user addresses
└─────────────────┘

┌─────────────────┐
│   PesoBytes     │ ← ERC20 reward token
│  (Independent)  │ ← Awards for connections
└─────────────────┘
```

### Deployment Order

**✅ All contracts are independent** - they can be deployed in any order:
- No constructor dependencies between contracts
- Each contract is self-contained
- Backend service interacts with all three separately

**Recommended deployment order:**
1. ProfileNFT (simplest, validates deployment setup)
2. ConnectionNFT (core feature)
3. PesoBytes (reward system)

### Contract Details

#### 1. ProfileNFT.sol
- **Type:** ERC721 (NFT)
- **Purpose:** User identity/profile on-chain
- **Key Features:**
  - Soulbound (non-transferable after mint)
  - One profile per wallet address
  - Only contract owner can mint
  - Stores metadata URI (IPFS link to profile data)
- **Constructor Args:** None
- **Initial Supply:** 0 (minted on-demand)

#### 2. ConnectionNFT.sol
- **Type:** ERC721 (NFT)
- **Purpose:** Commemorate connections between users
- **Key Features:**
  - Records both user addresses
  - Stores event ID, timestamp, compatibility score
  - Only contract owner can mint
  - Both users can view the connection
- **Constructor Args:** None
- **Initial Supply:** 0 (minted when users connect)

#### 3. PesoBytes.sol
- **Type:** ERC20 (Fungible Token)
- **Purpose:** Reward users for making connections
- **Key Features:**
  - Standard ERC20 with mint/burn
  - 18 decimals (standard)
  - Max supply: 1 billion tokens
  - Owner can award rewards
  - Rewards: 10 PESO per connection, +5 for 90+ compatibility
- **Constructor Args:**
  - `initialSupply` - Number of tokens to mint to deployer (in whole units)
  - Example: `100000000` = 100 million PESO tokens
- **Initial Supply:** 100,000,000 PESO (configured in deploy.js)

---

## Prerequisites

### 1. Development Environment

Ensure you have the following installed:
```bash
node -v    # Should be v18+ or v20+
npm -v     # Should be v9+ or v10+
```

### 2. Install Dependencies

```bash
cd contracts/
npm install
```

This installs:
- Hardhat (Ethereum development environment)
- OpenZeppelin contracts (secure smart contract library)
- Ethers.js v6 (blockchain interaction library)
- Hardhat Toolbox (verification, testing tools)

### 3. Create Deployment Wallet

**Option A: Create New Wallet (Recommended)**

Use a dedicated wallet for deployments (not your personal wallet):

```bash
# Generate new wallet using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# This outputs a private key - save it securely!
```

Then import this private key into MetaMask:
1. MetaMask > Account Icon > Import Account
2. Paste the private key
3. Copy the new wallet address

**Option B: Use Existing Wallet**

Export private key from MetaMask:
1. MetaMask > Account Details > Export Private Key
2. Enter password
3. Copy private key (without 0x prefix)

⚠️ **Security Best Practices:**
- Use a fresh wallet for deployments
- Never use a wallet holding significant funds
- Never commit private keys to Git
- Store private keys in password manager

### 4. Get Base Sepolia Testnet ETH

Your deployment wallet needs testnet ETH to pay for gas fees.

**Recommended Amount:** 0.05-0.1 ETH (more than enough for all 3 contracts)

**Testnet Faucets:**

1. **Coinbase Faucet** (Easiest - no login required)
   - URL: https://www.coinbase.com/faucets/base-sepolia-faucet
   - Amount: 0.1 ETH per day
   - Just paste your wallet address

2. **Alchemy Faucet** (Free Alchemy account required)
   - URL: https://www.alchemy.com/faucets/base-sepolia
   - Create account at https://www.alchemy.com
   - Paste wallet address

3. **Superchain Faucet** (Alternative)
   - URL: https://app.optimism.io/faucet
   - May require GitHub verification

**Bridge from other testnets (if you have Sepolia ETH):**
- Use Base Bridge: https://bridge.base.org/

### 5. Get RPC Provider (Optional but Recommended)

While you can use public RPCs, a dedicated RPC provider is faster and more reliable.

**Alchemy (Recommended - Free tier available):**

1. Sign up: https://www.alchemy.com
2. Create new app:
   - Chain: Base
   - Network: Base Sepolia
3. Copy your API URL: `https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

**Alternatives:**
- Infura: https://infura.io
- QuickNode: https://www.quicknode.com
- Public RPC: `https://sepolia.base.org` (free but slower)

### 6. Get Basescan API Key (Optional - for verification)

Contract verification makes your code public and verifiable on BaseScan.

1. Create account: https://basescan.org/register
2. Navigate to: https://basescan.org/myapikey
3. Create new API key
4. Copy the key

---

## Configuration

### 1. Set Up Environment Variables

Edit the `.env` file in the `/contracts` directory:

```bash
# Copy from example (already created)
# File: /contracts/.env

# Add your private key (without 0x prefix)
PRIVATE_KEY=abc123def456...

# Optional: Add your Alchemy RPC URL (or use default public RPC)
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY

# Optional: Add Basescan API key for verification
BASESCAN_API_KEY=ABC123DEF456...
```

**Environment Variable Details:**

| Variable | Required | Description |
|----------|----------|-------------|
| `PRIVATE_KEY` | ✅ Yes | Your deployment wallet's private key (no 0x prefix) |
| `BASE_RPC_URL` | ⚠️ Optional | RPC endpoint (defaults to public: `https://sepolia.base.org`) |
| `BASESCAN_API_KEY` | ⚠️ Optional | For contract verification (highly recommended) |

### 2. Verify Configuration

Check that your wallet has sufficient funds:

```bash
npm run check-balance
```

Expected output:
```
🔍 Checking balance on baseSepolia...
Wallet address: 0x1234...
Balance: 0.1 ETH
✅ Sufficient balance for deployment!
```

If balance is 0 or too low, revisit Step 4 (Get testnet ETH).

---

## Deployment Process

### Step 1: Compile Contracts

```bash
npm run compile
```

This:
- Compiles all Solidity contracts
- Generates ABIs (Application Binary Interface)
- Creates artifacts in `/artifacts` directory
- Checks for compilation errors

Expected output:
```
Compiled 15 Solidity files successfully
```

### Step 2: Deploy to Base Sepolia

```bash
npm run deploy:base-sepolia
```

This script will:
1. Connect to Base Sepolia network
2. Deploy ProfileNFT contract
3. Deploy ConnectionNFT contract
4. Deploy PesoBytes contract (100M initial supply)
5. Save addresses to `deployment-addresses.json`
6. Print verification commands

**Deployment time:** ~2-3 minutes (waiting for confirmations)

**Expected output:**
```
Deploying VibeConnect contracts to baseSepolia...
Deploying with account: 0x1234...
Account balance: 100000000000000000

1. Deploying ProfileNFT...
ProfileNFT deployed to: 0xABCD1234...

2. Deploying ConnectionNFT...
ConnectionNFT deployed to: 0xEF567890...

3. Deploying PesoBytes token...
PesoBytes deployed to: 0x12345678...
Initial supply: 100000000 PESO

✅ All contracts deployed successfully!

Deployment addresses saved to deployment-addresses.json

Next steps:
1. Update backend/.env with these contract addresses:
   PROFILE_NFT_CONTRACT=0xABCD1234...
   CONNECTION_NFT_CONTRACT=0xEF567890...
   PESOBYTES_CONTRACT=0x12345678...

2. Verify contracts on Basescan:
   npx hardhat verify --network baseSepolia 0xABCD1234...
   npx hardhat verify --network baseSepolia 0xEF567890...
   npx hardhat verify --network baseSepolia 0x12345678... 100000000
```

### Step 3: Save Contract Addresses

The deployment script automatically creates `deployment-addresses.json`:

```json
{
  "network": "baseSepolia",
  "deployer": "0x1234...",
  "contracts": {
    "ProfileNFT": "0xABCD1234...",
    "ConnectionNFT": "0xEF567890...",
    "PesoBytes": "0x12345678..."
  },
  "deployedAt": "2025-01-01T12:00:00.000Z"
}
```

**📋 Copy these addresses** - you'll need them for the next steps.

---

## Post-Deployment Steps

### 1. Verify Contracts on Basescan

Contract verification makes your source code public and allows users to read/interact with contracts directly on Basescan.

```bash
# Verify ProfileNFT
npx hardhat verify --network baseSepolia 0xYOUR_PROFILE_NFT_ADDRESS

# Verify ConnectionNFT
npx hardhat verify --network baseSepolia 0xYOUR_CONNECTION_NFT_ADDRESS

# Verify PesoBytes (note the constructor argument)
npx hardhat verify --network baseSepolia 0xYOUR_PESOBYTES_ADDRESS 100000000
```

**Common verification issues:**

1. **"Already verified"** - Contract is already verified, skip this step
2. **"API key not set"** - Add `BASESCAN_API_KEY` to `.env`
3. **"Compilation settings mismatch"** - Ensure you compiled with same settings
4. **"Invalid constructor arguments"** - Check PesoBytes uses `100000000`

Verified contracts show a ✅ green checkmark on Basescan with "Contract Source Code Verified" badge.

**View your contracts on Basescan:**
- ProfileNFT: `https://sepolia.basescan.org/address/0xYOUR_ADDRESS`
- ConnectionNFT: `https://sepolia.basescan.org/address/0xYOUR_ADDRESS`
- PesoBytes: `https://sepolia.basescan.org/address/0xYOUR_ADDRESS`

### 2. Copy Contract ABIs to Backend

The backend needs contract ABIs to interact with the smart contracts.

```bash
# From the /contracts directory
cp artifacts/contracts/ProfileNFT.sol/ProfileNFT.json ../backend/app/abis/
cp artifacts/contracts/ConnectionNFT.sol/ConnectionNFT.json ../backend/app/abis/
cp artifacts/contracts/PesoBytes.sol/PesoBytes.json ../backend/app/abis/
```

The ABIs contain the interface definition (functions, events, parameters) needed to interact with contracts.

### 3. Update Backend Environment Variables

Edit `/backend/.env`:

```bash
# Update these with your deployed contract addresses
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_API_KEY
PRIVATE_KEY=your_deployment_wallet_private_key
PROFILE_NFT_CONTRACT=0xYOUR_PROFILE_NFT_ADDRESS
CONNECTION_NFT_CONTRACT=0xYOUR_CONNECTION_NFT_ADDRESS
PESOBYTES_CONTRACT=0xYOUR_PESOBYTES_ADDRESS
```

**Important:**
- Use the **same private key** as deployment wallet (contract owner)
- Backend needs owner privileges to mint NFTs and award tokens
- Consider using same Alchemy RPC URL for consistency

### 4. Update Backend Web3 Service

The backend's `web3_service.py` is already configured to use these environment variables.

Verify the service loads all ABIs correctly:

```bash
cd ../backend
python -c "from app.services.web3_service import web3_service; print('✅ Web3 service loaded successfully')"
```

If there are errors:
- Check ABI files exist in `/backend/app/abis/`
- Verify `.env` variables are set
- Check network connectivity to RPC URL

### 5. Update Frontend Configuration

The frontend needs contract addresses and ABIs for user interactions.

**Option A: Environment Variables (Recommended)**

Create `/frontend/.env.local`:

```bash
# Contract addresses
NEXT_PUBLIC_PROFILE_NFT_ADDRESS=0xYOUR_PROFILE_NFT_ADDRESS
NEXT_PUBLIC_CONNECTION_NFT_ADDRESS=0xYOUR_CONNECTION_NFT_ADDRESS
NEXT_PUBLIC_PESOBYTES_ADDRESS=0xYOUR_PESOBYTES_ADDRESS

# WalletConnect Project ID (if using)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

**Option B: Hardcoded Config File**

Create `/frontend/lib/contracts.ts`:

```typescript
// Contract addresses on Base Sepolia
export const CONTRACTS = {
  ProfileNFT: '0xYOUR_PROFILE_NFT_ADDRESS',
  ConnectionNFT: '0xYOUR_CONNECTION_NFT_ADDRESS',
  PesoBytes: '0xYOUR_PESOBYTES_ADDRESS',
} as const;

export const CHAIN_ID = 84532; // Base Sepolia
```

**Copy ABIs to Frontend:**

```bash
# From /contracts directory
mkdir -p ../frontend/lib/abis
cp artifacts/contracts/ProfileNFT.sol/ProfileNFT.json ../frontend/lib/abis/
cp artifacts/contracts/ConnectionNFT.sol/ConnectionNFT.json ../frontend/lib/abis/
cp artifacts/contracts/PesoBytes.sol/PesoBytes.json ../frontend/lib/abis/
```

### 6. Test Contract Interactions

**Test from Backend:**

```python
# Test script: test_contracts.py
from app.services.web3_service import web3_service

# Check connection
print(f"Connected to network: {web3_service.w3.is_connected()}")
print(f"Current block: {web3_service.w3.eth.block_number}")

# Check contract addresses
print(f"ProfileNFT: {web3_service.profile_nft_address}")
print(f"ConnectionNFT: {web3_service.connection_nft_address}")
print(f"PesoBytes: {web3_service.pesobytes_address}")
```

**Test Minting (Optional):**

```python
# Mint a test profile NFT
result = await web3_service.mint_profile_nft(
    wallet_address="0xTEST_ADDRESS",
    metadata_uri="ipfs://test-metadata-uri"
)
print(f"Minted NFT: {result}")
```

---

## Deployment Checklist

Use this checklist to ensure all deployment steps are completed:

### Pre-Deployment
- [ ] Node.js v18+ installed
- [ ] Dependencies installed (`npm install`)
- [ ] Deployment wallet created
- [ ] Private key saved securely
- [ ] Testnet ETH received (0.05-0.1 ETH)
- [ ] `.env` file configured with PRIVATE_KEY
- [ ] Balance checked (`npm run check-balance`)
- [ ] Contracts compiled successfully (`npm run compile`)

### Deployment
- [ ] Deployed to Base Sepolia (`npm run deploy:base-sepolia`)
- [ ] Deployment successful (all 3 contracts)
- [ ] `deployment-addresses.json` created
- [ ] Contract addresses copied/saved

### Verification
- [ ] ProfileNFT verified on Basescan
- [ ] ConnectionNFT verified on Basescan
- [ ] PesoBytes verified on Basescan
- [ ] All contracts show ✅ on Basescan

### Backend Integration
- [ ] ABIs copied to `/backend/app/abis/`
- [ ] Backend `.env` updated with contract addresses
- [ ] Backend `.env` updated with BASE_RPC_URL
- [ ] Backend `.env` updated with PRIVATE_KEY
- [ ] Web3 service loads successfully
- [ ] Test contract interaction works

### Frontend Integration
- [ ] Frontend `.env.local` created with addresses
- [ ] ABIs copied to `/frontend/lib/abis/` (if needed)
- [ ] Contract configuration file created (if using)
- [ ] Frontend builds successfully
- [ ] Wallet connection works on testnet

### Documentation
- [ ] Deployment addresses documented
- [ ] Team notified of new contract addresses
- [ ] Basescan links shared with team
- [ ] Deployment date/time recorded

---

## Network Information

### Base Sepolia Testnet

| Parameter | Value |
|-----------|-------|
| Network Name | Base Sepolia |
| Chain ID | 84532 |
| Currency Symbol | ETH |
| RPC URL (Public) | https://sepolia.base.org |
| Block Explorer | https://sepolia.basescan.org |
| Bridge | https://bridge.base.org/ |

### Add Base Sepolia to MetaMask

1. Visit: https://chainlist.org/chain/84532
2. Click "Add to MetaMask"
3. Approve the network addition

Or manually:
1. MetaMask > Networks > Add Network
2. Enter details from table above
3. Save

---

## Troubleshooting

### Deployment Fails

**Error: Insufficient funds**
```
Error: sender doesn't have enough funds to send tx
```
**Solution:** Get more testnet ETH from faucets

**Error: Invalid private key**
```
Error: invalid hexlify value
```
**Solution:**
- Ensure private key has no `0x` prefix in `.env`
- Check private key is 64 characters (hex)
- Verify no extra spaces or newlines

**Error: Network connection failed**
```
Error: could not detect network
```
**Solution:**
- Check internet connection
- Try different RPC URL
- Use Alchemy/Infura instead of public RPC

### Verification Fails

**Error: Already verified**
```
Error: Contract already verified
```
**Solution:** Skip verification - contract is already public

**Error: Compilation mismatch**
```
Error: Compilation settings do not match
```
**Solution:**
- Ensure you ran `npm run compile` before deploying
- Clear Hardhat cache: `npx hardhat clean`
- Recompile and redeploy

**Error: Invalid constructor arguments (PesoBytes only)**
```
Error: Constructor arguments mismatch
```
**Solution:**
- Verify you're using `100000000` (100 million)
- Check deployment script's `initialSupply` value
- Format: `npx hardhat verify --network baseSepolia ADDRESS 100000000`

### Contract Interaction Issues

**Backend can't interact with contracts**

1. Check RPC connection:
```python
print(web3_service.w3.is_connected())  # Should be True
```

2. Check contract addresses are set:
```python
print(web3_service.profile_nft_address)  # Should be 0x...
```

3. Check ABIs are loaded:
```python
print(web3_service.connection_nft_abi is not None)  # Should be True
```

4. Verify private key matches deployer (has owner role)

**Frontend can't read contracts**

1. Check you're connected to Base Sepolia (ChainID: 84532)
2. Verify contract addresses in environment variables
3. Check ABIs are properly imported
4. Ensure wallet is connected

### Gas Issues

**Error: Transaction underpriced**
```
Error: transaction underpriced
```
**Solution:** Network is congested, wait a few minutes and retry

**Error: Gas estimation failed**
```
Error: cannot estimate gas
```
**Solution:**
- Check contract addresses are correct
- Verify you're calling the right function
- Ensure parameters are valid (e.g., not minting to address(0))

---

## Gas Cost Estimates

Approximate gas costs on Base Sepolia (costs may vary):

| Contract | Deployment Gas | Cost (at 0.5 Gwei) |
|----------|----------------|---------------------|
| ProfileNFT | ~2,000,000 | ~0.001 ETH |
| ConnectionNFT | ~2,500,000 | ~0.00125 ETH |
| PesoBytes | ~1,500,000 | ~0.00075 ETH |
| **Total** | ~6,000,000 | **~0.003 ETH** |

**Minting gas costs:**

| Operation | Gas | Cost (at 0.5 Gwei) |
|-----------|-----|---------------------|
| Mint Profile NFT | ~150,000 | ~0.000075 ETH |
| Mint Connection NFT | ~200,000 | ~0.0001 ETH |
| Award PesoBytes | ~60,000 | ~0.00003 ETH |

Base Sepolia typically has very low gas prices (~0.1-1 Gwei), making it extremely cheap for testing.

---

## Next Steps After Deployment

1. **Test the full user flow:**
   - Create profile → Mint ProfileNFT
   - Make connection → Mint ConnectionNFT
   - Award rewards → Transfer PesoBytes

2. **Set up monitoring:**
   - Monitor contract events (ProfileMinted, ConnectionMinted, etc.)
   - Track gas usage and optimize if needed
   - Set up alerts for failed transactions

3. **Plan for mainnet:**
   - Security audit (recommended for production)
   - Update RPC URLs to Base mainnet
   - Update block explorer links to basescan.org (not sepolia)
   - Consider multi-sig wallet for contract ownership

4. **Documentation:**
   - Update API docs with contract addresses
   - Create user guide for NFT features
   - Document reward economics

---

## Additional Resources

### Base Documentation
- Base Docs: https://docs.base.org
- Base Sepolia Faucet: https://www.coinbase.com/faucets/base-sepolia-faucet
- Base Bridge: https://bridge.base.org

### Development Tools
- Hardhat Docs: https://hardhat.org/docs
- OpenZeppelin Contracts: https://docs.openzeppelin.com/contracts
- Ethers.js Docs: https://docs.ethers.org/v6/

### Block Explorers
- Base Sepolia: https://sepolia.basescan.org
- Base Mainnet: https://basescan.org

### Community & Support
- Base Discord: https://discord.gg/buildonbase
- Hardhat Discord: https://discord.gg/hardhat
- Stack Exchange: https://ethereum.stackexchange.com

---

## Support

If you encounter issues:

1. Check this troubleshooting guide
2. Review Hardhat documentation
3. Check Base documentation
4. Ask in Base Discord community

For VibeConnect-specific questions, contact the development team.

---

**Last Updated:** 2025-01-01
**Network:** Base Sepolia Testnet
**Hardhat Version:** 2.19.0
**Solidity Version:** 0.8.20
