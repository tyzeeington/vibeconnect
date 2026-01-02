# VibeConnect Smart Contracts - Deployment Checklist

Complete guide for deploying ProfileNFT, ConnectionNFT, and PesoBytes contracts to Base Sepolia testnet.

---

## Prerequisites Checklist

### Development Environment
- [ ] Node.js v18+ installed (`node -v`)
- [ ] npm v9+ installed (`npm -v`)
- [ ] Git installed
- [ ] In `/home/user/vibeconnect/contracts` directory

### Install Dependencies
```bash
cd /home/user/vibeconnect/contracts
npm install
```
- [ ] Dependencies installed successfully
- [ ] No errors in npm install output

### Create Deployment Wallet

**Option A: Generate New Wallet (Recommended)**
```bash
# Generate random private key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
- [ ] Private key generated (64 hex characters)
- [ ] Private key saved securely (password manager)
- [ ] Imported to MetaMask
- [ ] Wallet address copied

**Option B: Export Existing Wallet**
- [ ] Private key exported from MetaMask (without 0x prefix)
- [ ] Private key saved securely

**Security Checklist:**
- [ ] Using dedicated deployment wallet (not personal wallet)
- [ ] Private key stored in password manager
- [ ] Wallet contains only testnet funds

### Get Base Sepolia Testnet ETH

**Required Amount:** 0.05-0.1 ETH

**Recommended Faucet:**
1. Visit: https://www.coinbase.com/faucets/base-sepolia-faucet
2. Paste your wallet address
3. Click "Send me ETH"
4. Wait ~30 seconds for confirmation

**Alternative Faucets:**
- Alchemy: https://www.alchemy.com/faucets/base-sepolia
- Superchain: https://app.optimism.io/faucet

**Verification:**
- [ ] Received testnet ETH
- [ ] Balance shows 0.05+ ETH in MetaMask
- [ ] Transaction confirmed on https://sepolia.basescan.org

### Configure Environment Variables

Edit `/home/user/vibeconnect/contracts/.env`:

```bash
# Required - Deployment wallet private key (no 0x prefix)
PRIVATE_KEY=your_64_character_private_key_here

# Optional - RPC endpoint (defaults to public RPC if not set)
BASE_RPC_URL=https://sepolia.base.org

# Optional - For contract verification (highly recommended)
BASESCAN_API_KEY=your_basescan_api_key_here
```

**Get Basescan API Key (Optional but Recommended):**
1. Sign up: https://basescan.org/register
2. Navigate to: https://basescan.org/myapikey
3. Create new API key
4. Copy and paste into .env

**Configuration Checklist:**
- [ ] `.env` file created (copy from `.env.example` if needed)
- [ ] `PRIVATE_KEY` added (no 0x prefix, 64 characters)
- [ ] `BASE_RPC_URL` set (or using default)
- [ ] `BASESCAN_API_KEY` added (optional)
- [ ] `.env` file NOT committed to Git

### Verify Setup

**Check wallet balance:**
```bash
npm run check-balance
```

Expected output:
```
Wallet address: 0x1234...
Balance: 0.1 ETH
✅ Sufficient balance for deployment!
```

**Compile contracts:**
```bash
npm run compile
```

Expected output:
```
Compiled 15 Solidity files successfully
```

**Pre-Deployment Verification:**
- [ ] Balance check shows sufficient ETH (0.05+)
- [ ] Wallet address displayed correctly
- [ ] Contracts compiled without errors
- [ ] No warnings or errors in terminal

---

## Deployment Steps

### Step 1: Deploy All Contracts

```bash
npm run deploy:base-sepolia
```

**Deployment Process:**
1. Connects to Base Sepolia network
2. Deploys ProfileNFT contract
3. Deploys ConnectionNFT contract
4. Deploys PesoBytes contract (100M initial supply)
5. Saves addresses to `deployment-addresses.json`
6. Displays verification commands

**Expected Time:** 2-3 minutes

**Expected Output:**
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
```

**Deployment Checklist:**
- [ ] All 3 contracts deployed successfully
- [ ] No errors during deployment
- [ ] `deployment-addresses.json` file created
- [ ] Contract addresses displayed in output

### Step 2: Record Contract Addresses

Copy the addresses from the deployment output or from `deployment-addresses.json`:

**Contract Addresses:**
```
ProfileNFT:      0x_______________________________________
ConnectionNFT:   0x_______________________________________
PesoBytes:       0x_______________________________________
Deployer:        0x_______________________________________
Deployment Date: ____-__-__
```

**Record Keeping:**
- [ ] Addresses copied to this checklist
- [ ] Addresses saved in team documentation
- [ ] `deployment-addresses.json` backed up
- [ ] Team notified of deployment

### Step 3: Verify Contracts on Basescan (Highly Recommended)

**Why Verify?**
- Makes source code public and transparent
- Adds green checkmark on Basescan
- Allows users to read/interact with contracts directly
- Easier debugging

**Verification Commands:**

```bash
# Verify ProfileNFT
npx hardhat verify --network baseSepolia 0xYOUR_PROFILE_NFT_ADDRESS

# Verify ConnectionNFT
npx hardhat verify --network baseSepolia 0xYOUR_CONNECTION_NFT_ADDRESS

# Verify PesoBytes (note the constructor argument: 100000000)
npx hardhat verify --network baseSepolia 0xYOUR_PESOBYTES_ADDRESS 100000000
```

**Verification Checklist:**
- [ ] ProfileNFT verified (shows ✅ on Basescan)
- [ ] ConnectionNFT verified (shows ✅ on Basescan)
- [ ] PesoBytes verified (shows ✅ on Basescan)
- [ ] All contracts show "Contract Source Code Verified" badge

**View Verified Contracts:**
- [ ] ProfileNFT: `https://sepolia.basescan.org/address/0xYOUR_ADDRESS`
- [ ] ConnectionNFT: `https://sepolia.basescan.org/address/0xYOUR_ADDRESS`
- [ ] PesoBytes: `https://sepolia.basescan.org/address/0xYOUR_ADDRESS`

**Common Verification Issues:**
- "Already verified" - Skip, contract is already public
- "Invalid API key" - Check `BASESCAN_API_KEY` in `.env`
- "Compilation mismatch" - Ensure you ran `npm run compile` before deploying
- "Wrong constructor args" - For PesoBytes, use `100000000` (no quotes)

---

## Post-Deployment Configuration

### Backend Integration

#### 1. Update Backend Environment Variables

Edit `/home/user/vibeconnect/backend/.env`:

```bash
# Base Network Configuration
BASE_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=same_private_key_as_deployment

# Contract Addresses (from deployment)
PROFILE_NFT_CONTRACT=0xYOUR_PROFILE_NFT_ADDRESS
CONNECTION_NFT_CONTRACT=0xYOUR_CONNECTION_NFT_ADDRESS
PESOBYTES_CONTRACT=0xYOUR_PESOBYTES_ADDRESS
```

**Important Notes:**
- Use the **same private key** as deployment (backend needs owner privileges)
- Backend must be owner to mint NFTs and award tokens
- Consider using same RPC URL for consistency

**Backend .env Checklist:**
- [ ] `BASE_RPC_URL` set to Base Sepolia RPC
- [ ] `PRIVATE_KEY` set (same as deployment wallet)
- [ ] `PROFILE_NFT_CONTRACT` address added
- [ ] `CONNECTION_NFT_CONTRACT` address added
- [ ] `PESOBYTES_CONTRACT` address added
- [ ] All addresses start with `0x`
- [ ] No extra spaces or newlines in `.env`

#### 2. Copy Contract ABIs to Backend

**Automated Method (Recommended):**
```bash
cd /home/user/vibeconnect/contracts
./scripts/copy-abis.sh
```

**Manual Method:**
```bash
cd /home/user/vibeconnect/contracts
cp artifacts/contracts/ProfileNFT.sol/ProfileNFT.json ../backend/app/abis/
cp artifacts/contracts/ConnectionNFT.sol/ConnectionNFT.json ../backend/app/abis/
cp artifacts/contracts/PesoBytes.sol/PesoBytes.json ../backend/app/abis/
```

**ABI Files Checklist:**
- [ ] `/backend/app/abis/ProfileNFT.json` exists
- [ ] `/backend/app/abis/ConnectionNFT.json` exists
- [ ] `/backend/app/abis/PesoBytes.json` exists
- [ ] All JSON files are valid (can open and read)

#### 3. Test Backend Integration

**Python test script:**
```python
from app.services.web3_service import web3_service

# Check connection
print(f"Connected: {web3_service.w3.is_connected()}")
print(f"Current block: {web3_service.w3.eth.block_number}")

# Check contract addresses
print(f"ProfileNFT: {web3_service.profile_nft_address}")
print(f"ConnectionNFT: {web3_service.connection_nft_address}")
print(f"PesoBytes: {web3_service.pesobytes_address}")
```

**Backend Testing Checklist:**
- [ ] Web3 service loads without errors
- [ ] Connected to Base Sepolia (is_connected = True)
- [ ] All contract addresses loaded correctly
- [ ] ABIs loaded successfully (no None values)
- [ ] Backend restarts without errors

### Frontend Integration

#### 1. Create Frontend Environment File

Create `/home/user/vibeconnect/frontend/.env.local`:

```bash
# Contract Addresses
NEXT_PUBLIC_PROFILE_NFT_ADDRESS=0xYOUR_PROFILE_NFT_ADDRESS
NEXT_PUBLIC_CONNECTION_NFT_ADDRESS=0xYOUR_CONNECTION_NFT_ADDRESS
NEXT_PUBLIC_PESOBYTES_ADDRESS=0xYOUR_PESOBYTES_ADDRESS

# Network Configuration
NEXT_PUBLIC_CHAIN_ID=84532

# WalletConnect (if using)
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

**Frontend .env Checklist:**
- [ ] `.env.local` file created
- [ ] All contract addresses added (with `NEXT_PUBLIC_` prefix)
- [ ] `NEXT_PUBLIC_CHAIN_ID` set to 84532 (Base Sepolia)
- [ ] WalletConnect ID added (if using)

#### 2. Copy ABIs to Frontend (if needed)

```bash
cd /home/user/vibeconnect/contracts
mkdir -p ../frontend/lib/abis
cp artifacts/contracts/ProfileNFT.sol/ProfileNFT.json ../frontend/lib/abis/
cp artifacts/contracts/ConnectionNFT.sol/ConnectionNFT.json ../frontend/lib/abis/
cp artifacts/contracts/PesoBytes.sol/PesoBytes.json ../frontend/lib/abis/
```

**Frontend ABI Checklist:**
- [ ] ABIs copied to `/frontend/lib/abis/` (if needed by frontend)
- [ ] Frontend imports ABIs correctly
- [ ] No import errors

#### 3. Verify Frontend Build

```bash
cd /home/user/vibeconnect/frontend
npm run build
```

**Frontend Testing Checklist:**
- [ ] Frontend builds without errors
- [ ] Environment variables loaded correctly
- [ ] Can connect wallet on Base Sepolia
- [ ] Correct network detected (ChainID: 84532)

---

## Testing & Verification

### Contract Interaction Tests

**Test Profile NFT Minting (Backend):**
```python
# Test minting a profile NFT
result = await web3_service.mint_profile_nft(
    wallet_address="0xTEST_ADDRESS",
    metadata_uri="ipfs://test-metadata-uri"
)
print(f"Profile NFT minted: {result}")
```

**Test Connection NFT Minting (Backend):**
```python
# Test minting a connection NFT
result = await web3_service.mint_connection_nft(
    user_a_address="0xADDRESS_A",
    user_b_address="0xADDRESS_B",
    event_id="test-event-123",
    metadata_uri="ipfs://connection-metadata",
    compatibility_score=95
)
print(f"Connection NFT minted: {result}")
```

**Test PesoBytes Award (Backend):**
```python
# Test awarding PesoBytes
result = await web3_service.award_pesobytes(
    to_address="0xRECIPIENT_ADDRESS",
    amount=10  # 10 PESO tokens
)
print(f"PesoBytes awarded: {result}")
```

**Testing Checklist:**
- [ ] Profile NFT minting works
- [ ] Connection NFT minting works (with compatibility score)
- [ ] PesoBytes reward distribution works
- [ ] Frontend can read contract data
- [ ] Frontend wallet connects to Base Sepolia
- [ ] End-to-end flow tested (profile → connection → rewards)

### Monitor Transactions

**View on Basescan:**
- [ ] View deployed contracts on Basescan
- [ ] Check transaction history for each contract
- [ ] Verify minting transactions appear
- [ ] Check event logs (ProfileMinted, ConnectionMinted, etc.)

**Block Explorer Links:**
```
ProfileNFT:    https://sepolia.basescan.org/address/0xYOUR_ADDRESS
ConnectionNFT: https://sepolia.basescan.org/address/0xYOUR_ADDRESS
PesoBytes:     https://sepolia.basescan.org/address/0xYOUR_ADDRESS
```

---

## Security Review

### Private Key Security
- [ ] Private key stored in password manager
- [ ] `.env` files NOT committed to Git
- [ ] `.gitignore` includes `.env` and `.env.local`
- [ ] Only authorized team members have access
- [ ] Deployment wallet separated from personal funds

### Contract Ownership
- [ ] Deployer address recorded
- [ ] Backend uses same private key (has owner privileges)
- [ ] Contract ownership verified on Basescan
- [ ] Consider multi-sig wallet for production

### Smart Contract Security
- [ ] Using OpenZeppelin contracts (battle-tested)
- [ ] Contracts verified on Basescan (source code public)
- [ ] ProfileNFT is soulbound (non-transferable)
- [ ] Max supply enforced on PesoBytes
- [ ] Security audit planned for mainnet

---

## Documentation & Communication

### Team Communication
- [ ] Contract addresses shared with team
- [ ] Basescan links shared with team
- [ ] Deployment date/time recorded
- [ ] Team notified of successful deployment
- [ ] Known issues communicated

### Update Project Documentation
- [ ] Contract addresses added to project README
- [ ] API documentation updated
- [ ] User guides updated (if applicable)
- [ ] Deployment notes archived

---

## Known Issues & Recommendations

### Backend Service Updates Needed

**Issue 1: Missing compatibility_score parameter**
- File: `/backend/app/services/web3_service.py`
- Function: `mint_connection_nft()`
- Fix: Add `compatibility_score: int` parameter
- Priority: HIGH - Must fix before testing

**Issue 2: ABIs not loaded**
- File: `/backend/app/services/web3_service.py`
- Lines: 31-33
- Fix: Change `None` to `self._load_abi('ContractName.json')`
- Priority: HIGH - Must fix before integration

**Issue 3: PesoBytes reward logic**
- Backend uses `transfer()` instead of `awardConnectionReward()`
- Consider using contract's reward function for automatic bonuses
- Priority: MEDIUM - Current code works but misses features

**Known Issues Checklist:**
- [ ] Backend `compatibility_score` parameter added
- [ ] Backend ABI loading fixed
- [ ] PesoBytes reward logic reviewed/updated
- [ ] All fixes tested

---

## Deployment Costs

### Gas Cost Summary

| Contract | Deployment Gas | Cost @ 0.5 Gwei |
|----------|----------------|-----------------|
| ProfileNFT | ~2,000,000 | ~0.001 ETH |
| ConnectionNFT | ~2,500,000 | ~0.00125 ETH |
| PesoBytes | ~1,500,000 | ~0.00075 ETH |
| **Total** | **~6,000,000** | **~0.003 ETH** |

**Operation Costs:**

| Operation | Gas | Cost @ 0.5 Gwei |
|-----------|-----|-----------------|
| Mint Profile NFT | ~150,000 | ~0.000075 ETH |
| Mint Connection NFT | ~200,000 | ~0.0001 ETH |
| Award PesoBytes | ~60,000 | ~0.00003 ETH |

**Actual Costs:**
- [ ] Deployment cost recorded: __________ ETH
- [ ] Total gas used: __________

---

## Network Information

### Base Sepolia Testnet

| Parameter | Value |
|-----------|-------|
| Network Name | Base Sepolia |
| Chain ID | 84532 |
| Currency | ETH |
| RPC URL | https://sepolia.base.org |
| Block Explorer | https://sepolia.basescan.org |
| Bridge | https://bridge.base.org/ |

### Add to MetaMask

1. Visit: https://chainlist.org/chain/84532
2. Click "Add to MetaMask"
3. Approve network addition

---

## Troubleshooting

### Common Issues

**Error: Insufficient funds**
- Solution: Get more ETH from https://www.coinbase.com/faucets/base-sepolia-faucet
- Need: ~0.05 ETH for deployment

**Error: Invalid private key**
- Ensure no `0x` prefix in `.env`
- Check it's exactly 64 hex characters
- Verify no spaces or newlines

**Error: Network connection failed**
- Check internet connection
- Try different RPC URL (Alchemy/Infura)
- Wait 1-2 minutes and retry

**Error: Verification failed**
- Ensure `BASESCAN_API_KEY` is set
- Wait a few minutes after deployment
- Check constructor arguments (PesoBytes: 100000000)

**Backend can't interact with contracts**
- Check RPC connection: `web3_service.w3.is_connected()`
- Verify contract addresses in `.env`
- Ensure ABIs are in `/backend/app/abis/`
- Check private key matches deployer (has owner role)

---

## Resources

### Documentation
- **Comprehensive Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Quick Start:** [QUICK_START.md](./QUICK_START.md)
- **Post-Deployment:** [POST_DEPLOYMENT_CHECKLIST.md](./POST_DEPLOYMENT_CHECKLIST.md)

### External Links
- **Base Docs:** https://docs.base.org
- **Base Sepolia Faucet:** https://www.coinbase.com/faucets/base-sepolia-faucet
- **Block Explorer:** https://sepolia.basescan.org
- **Hardhat Docs:** https://hardhat.org/docs
- **OpenZeppelin:** https://docs.openzeppelin.com/contracts

---

## Completion Sign-Off

### Deployment Summary
```
Deployment Date:     ____-__-__
Deployed By:         _________________
Network:             Base Sepolia (ChainID: 84532)
Total Cost:          _______ ETH

Contract Addresses:
  ProfileNFT:        0x_______________________________________
  ConnectionNFT:     0x_______________________________________
  PesoBytes:         0x_______________________________________

Deployer Address:    0x_______________________________________

Verification Status:
  ProfileNFT:        [ ] Verified
  ConnectionNFT:     [ ] Verified
  PesoBytes:         [ ] Verified

Integration Status:
  Backend:           [ ] Complete
  Frontend:          [ ] Complete
  Testing:           [ ] Complete
```

### Final Checklist
- [ ] All contracts deployed successfully
- [ ] All contracts verified on Basescan
- [ ] Backend environment configured
- [ ] Backend ABIs copied
- [ ] Backend tested and working
- [ ] Frontend environment configured
- [ ] Frontend builds successfully
- [ ] End-to-end testing complete
- [ ] Team notified
- [ ] Documentation updated

**Deployment Status:** [ ] COMPLETE

**Signed Off By:** _________________ **Date:** ____-__-__

---

**Total Estimated Time:** 30-40 minutes
- Prerequisites: 10-15 minutes
- Deployment: 2-3 minutes
- Configuration: 10-15 minutes
- Testing: 5-10 minutes

**Network:** Base Sepolia Testnet (ChainID: 84532)
**Solidity:** 0.8.20
**Hardhat:** 2.19.0
**OpenZeppelin:** 5.0.0
