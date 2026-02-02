# VibeConnect Smart Contracts - Deployment Status

## Deployment Session: 2026-02-02

### Summary

This document summarizes the smart contract deployment preparation for Base Sepolia testnet.

---

## Completed Tasks

### 1. Environment Setup
- Created `.env` file from `.env.example`
- Generated deployment wallet:
  - **Address:** `0xbF9D5769364922F5DC8e9393c8fc3561E428452D`
  - **Network:** Base Sepolia (ChainID 84532)
  - Private key configured in `/home/user/vibeconnect/contracts/.env`

### 2. Dependencies Installed
- All npm dependencies installed successfully
- OpenZeppelin Contracts v5.0.0
- Hardhat v2.19.0
- solc-js v0.8.20

### 3. Contracts Compiled
All 6 Solidity contracts compiled successfully using solc-js:

| Contract | Status | Description |
|----------|--------|-------------|
| ProfileNFT.sol | Compiled | Soulbound user profile NFT |
| ConnectionNFT.sol | Compiled | Soulbound connection NFT between users |
| PesoBytes.sol | Compiled | ERC20 reward token |
| EventEntryNFT.sol | Compiled | Door-mint protocol NFT for events |
| EventToken.sol | Compiled | Event-specific ERC20 token |
| EventTokenFactory.sol | Compiled | Factory for creating event tokens |

**Artifacts location:** `/home/user/vibeconnect/contracts/artifacts/contracts/`

### 4. ABIs Copied to Backend
All contract ABIs copied to `/home/user/vibeconnect/backend/app/abis/`:
- ProfileNFT.json
- ConnectionNFT.json
- PesoBytes.json
- EventEntryNFT.json
- EventToken.json
- EventTokenFactory.json

### 5. Configuration Files Updated
- **Backend:** `/home/user/vibeconnect/backend/.env` - Created with deployment wallet and RPC config
- **Frontend:** `/home/user/vibeconnect/frontend/.env.local` - Created with NEXT_PUBLIC_ contract vars

---

## Pending Tasks (Require Network Access)

### 1. Get Testnet ETH
The deployment wallet needs testnet ETH before deploying.

**Faucet URLs:**
- Coinbase Faucet: https://www.coinbase.com/faucets/base-sepolia-faucet
- Alchemy Faucet: https://www.alchemy.com/faucets/base-sepolia

**Send ETH to:** `0xbF9D5769364922F5DC8e9393c8fc3561E428452D`

**Recommended amount:** 0.1 ETH (for deploying all contracts with buffer)

### 2. Deploy Contracts
Once wallet is funded, run from the contracts directory:

```bash
cd /home/user/vibeconnect/contracts

# Option 1: Deploy core contracts (ProfileNFT, ConnectionNFT, PesoBytes)
npm run deploy:base-sepolia

# Option 2: Deploy all contracts including Event contracts
npm run deploy:sepolia
```

### 3. Update Contract Addresses
After deployment, update these files with actual deployed addresses:

**Backend (`/home/user/vibeconnect/backend/.env`):**
```
PROFILE_NFT_CONTRACT=0x<deployed_address>
CONNECTION_NFT_CONTRACT=0x<deployed_address>
PESOBYTES_CONTRACT=0x<deployed_address>
EVENT_ENTRY_NFT_CONTRACT=0x<deployed_address>
EVENT_TOKEN_FACTORY_CONTRACT=0x<deployed_address>
```

**Frontend (`/home/user/vibeconnect/frontend/.env.local`):**
```
NEXT_PUBLIC_PROFILE_NFT_CONTRACT=0x<deployed_address>
NEXT_PUBLIC_CONNECTION_NFT_CONTRACT=0x<deployed_address>
NEXT_PUBLIC_PESOBYTES_CONTRACT=0x<deployed_address>
NEXT_PUBLIC_EVENT_ENTRY_NFT_CONTRACT=0x<deployed_address>
NEXT_PUBLIC_EVENT_TOKEN_FACTORY_CONTRACT=0x<deployed_address>
```

### 4. Verify Contracts on Basescan
After deployment, verify contracts for public access:

```bash
cd /home/user/vibeconnect/contracts

# Verify ProfileNFT (no constructor args)
npx hardhat verify --network baseSepolia <PROFILE_NFT_ADDRESS>

# Verify ConnectionNFT (no constructor args)
npx hardhat verify --network baseSepolia <CONNECTION_NFT_ADDRESS>

# Verify PesoBytes (has constructor arg: initial supply)
npx hardhat verify --network baseSepolia <PESOBYTES_ADDRESS> 100000000

# Verify EventEntryNFT (no constructor args)
npx hardhat verify --network baseSepolia <EVENT_ENTRY_NFT_ADDRESS>
```

**Note:** Requires `BASESCAN_API_KEY` in `.env` (get from https://basescan.org/apis)

---

## Network Details

| Property | Value |
|----------|-------|
| Network Name | Base Sepolia Testnet |
| Chain ID | 84532 |
| RPC URL | https://sepolia.base.org |
| Block Explorer | https://sepolia.basescan.org |
| Currency | ETH (Sepolia) |

---

## Deployment Script Details

### deploy.js (npm run deploy:base-sepolia)
Deploys core contracts:
1. ProfileNFT - No constructor args
2. ConnectionNFT - No constructor args
3. PesoBytes - Constructor arg: `100000000` (100M initial supply)

### deploy-all.js (npm run deploy:sepolia)
Deploys all contracts including:
1. ProfileNFT
2. ConnectionNFT
3. PesoBytes
4. EventEntryNFT

Outputs deployment addresses to `deployment-addresses.json`

---

## Files Modified/Created

| File | Action | Purpose |
|------|--------|---------|
| `/contracts/.env` | Created | Environment variables for deployment |
| `/contracts/artifacts/` | Created | Compiled contract artifacts |
| `/backend/.env` | Created | Backend configuration |
| `/backend/app/abis/*.json` | Updated | Contract ABIs for backend |
| `/frontend/.env.local` | Created | Frontend configuration |
| `/contracts/DEPLOYMENT_STATUS.md` | Created | This status document |

---

## Troubleshooting

### Network Connection Issues
If deployment fails with network errors:
1. Check RPC URL is correct in `.env`
2. Try alternative RPC: `https://base-sepolia-rpc.publicnode.com`
3. Ensure wallet has sufficient ETH

### Compilation Issues
If Hardhat compilation fails:
1. Contracts were compiled with solc-js directly
2. Artifacts are in `/contracts/artifacts/contracts/`
3. Use `npm run compile` after network is available

### Balance Check
Check wallet balance before deploying:
```bash
npm run check-balance
```

---

## Contact

For deployment support, see:
- DEPLOYMENT_GUIDE.md - Full deployment guide
- DEPLOYMENT_CHECKLIST.md - Pre-deployment checklist
- QUICK_START.md - Quick start instructions
