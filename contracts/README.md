# VibeConnect Smart Contracts

Smart contracts for the VibeConnect platform on Base blockchain.

## Overview

VibeConnect uses three smart contracts to power its social connection features:

### 1. ProfileNFT (ERC721)
- **Purpose:** Represents a user's on-chain identity
- **Features:**
  - Soulbound (non-transferable)
  - One profile per wallet address
  - Stores metadata URI (IPFS link to profile data)
  - Only owner can mint
- **File:** `contracts/ProfileNFT.sol`

### 2. ConnectionNFT (ERC721)
- **Purpose:** Commemorates connections between users at events
- **Features:**
  - Links two wallet addresses
  - Stores event ID, timestamp, compatibility score
  - Both users can query the connection
  - Only owner can mint
- **File:** `contracts/ConnectionNFT.sol`

### 3. PesoBytes (ERC20)
- **Purpose:** Reward token for making authentic connections
- **Features:**
  - Standard ERC20 token
  - 18 decimals
  - Max supply: 1 billion tokens
  - Rewards: 10 PESO per connection, +5 for 90+ compatibility
  - Mint/burn capabilities
- **File:** `contracts/PesoBytes.sol`

## Quick Links

- **🚀 Quick Start:** [QUICK_START.md](./QUICK_START.md)
- **📖 Full Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **🔗 Network:** Base Sepolia Testnet (ChainID: 84532)
- **🔍 Block Explorer:** https://sepolia.basescan.org

## Project Structure

```
contracts/
├── contracts/              # Solidity smart contracts
│   ├── ProfileNFT.sol     # User profile NFT
│   ├── ConnectionNFT.sol  # Connection memory NFT
│   └── PesoBytes.sol      # Reward token
├── scripts/               # Deployment & utility scripts
│   ├── deploy.js          # Main deployment script
│   └── check-balance.js   # Check wallet balance
├── artifacts/             # Compiled contract artifacts (generated)
├── cache/                 # Hardhat cache (generated)
├── .env                   # Environment variables (DO NOT COMMIT)
├── .env.example           # Example environment variables
├── hardhat.config.js      # Hardhat configuration
├── package.json           # NPM dependencies & scripts
├── DEPLOYMENT_GUIDE.md    # Comprehensive deployment guide
├── QUICK_START.md         # Quick deployment reference
└── README.md              # This file
```

## Prerequisites

- Node.js v18+ or v20+
- npm v9+
- MetaMask or another Web3 wallet
- Base Sepolia testnet ETH

## Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env and add your PRIVATE_KEY
nano .env
```

## Available Scripts

```bash
# Compile contracts
npm run compile

# Check wallet balance on Base Sepolia
npm run check-balance

# Deploy to Base Sepolia testnet
npm run deploy:base-sepolia

# Deploy to Base mainnet (production)
npm run deploy:base

# Verify contracts on Basescan
npm run verify:base-sepolia [CONTRACT_ADDRESS]

# Run tests
npm test

# Start local Hardhat node
npm run node

# Deploy to local node
npm run deploy:local
```

## Deployment

### 1. Get Testnet ETH

Visit the Coinbase faucet to get free Base Sepolia ETH:
- https://www.coinbase.com/faucets/base-sepolia-faucet

You need approximately 0.05-0.1 ETH for deploying all contracts.

### 2. Configure Environment

Edit `.env` and add your private key:

```bash
PRIVATE_KEY=your_private_key_here  # No 0x prefix
BASE_RPC_URL=https://sepolia.base.org  # Or use Alchemy/Infura
BASESCAN_API_KEY=your_basescan_api_key  # Optional, for verification
```

### 3. Deploy

```bash
# Check you have sufficient balance
npm run check-balance

# Deploy all contracts
npm run deploy:base-sepolia
```

The script will:
1. Deploy ProfileNFT
2. Deploy ConnectionNFT
3. Deploy PesoBytes (100M initial supply)
4. Save addresses to `deployment-addresses.json`
5. Print next steps

### 4. Verify Contracts (Recommended)

```bash
npx hardhat verify --network baseSepolia 0xYOUR_PROFILE_NFT_ADDRESS
npx hardhat verify --network baseSepolia 0xYOUR_CONNECTION_NFT_ADDRESS
npx hardhat verify --network baseSepolia 0xYOUR_PESOBYTES_ADDRESS 100000000
```

### 5. Update Backend & Frontend

After deployment, update the contract addresses:

**Backend (`/backend/.env`):**
```bash
BASE_RPC_URL=https://sepolia.base.org
PRIVATE_KEY=same_as_deployment
PROFILE_NFT_CONTRACT=0x...
CONNECTION_NFT_CONTRACT=0x...
PESOBYTES_CONTRACT=0x...
```

**Frontend (`/frontend/.env.local`):**
```bash
NEXT_PUBLIC_PROFILE_NFT_ADDRESS=0x...
NEXT_PUBLIC_CONNECTION_NFT_ADDRESS=0x...
NEXT_PUBLIC_PESOBYTES_ADDRESS=0x...
```

**Copy ABIs to Backend:**
```bash
./scripts/copy-abis.sh
# Or manually:
cp artifacts/contracts/ProfileNFT.sol/ProfileNFT.json ../backend/app/abis/
cp artifacts/contracts/ConnectionNFT.sol/ConnectionNFT.json ../backend/app/abis/
cp artifacts/contracts/PesoBytes.sol/PesoBytes.json ../backend/app/abis/
```

## Contract Addresses

After deployment, contract addresses are saved in `deployment-addresses.json`:

```json
{
  "network": "baseSepolia",
  "deployer": "0x...",
  "contracts": {
    "ProfileNFT": "0x...",
    "ConnectionNFT": "0x...",
    "PesoBytes": "0x..."
  },
  "deployedAt": "2025-01-01T12:00:00.000Z"
}
```

## Network Configuration

### Base Sepolia Testnet

| Parameter | Value |
|-----------|-------|
| Network Name | Base Sepolia |
| Chain ID | 84532 |
| Currency | ETH |
| RPC URL | https://sepolia.base.org |
| Explorer | https://sepolia.basescan.org |

### Base Mainnet (Production)

| Parameter | Value |
|-----------|-------|
| Network Name | Base |
| Chain ID | 8453 |
| Currency | ETH |
| RPC URL | https://mainnet.base.org |
| Explorer | https://basescan.org |

## Security

### Private Keys
- **NEVER** commit `.env` file to Git
- Use a dedicated deployment wallet (not your personal wallet)
- Store private keys securely (password manager, hardware wallet)
- The deployment wallet becomes the contract owner

### Contract Ownership
- All contracts use OpenZeppelin's `Ownable` pattern
- Only the owner (deployer) can:
  - Mint ProfileNFTs
  - Mint ConnectionNFTs
  - Award PesoBytes rewards
- Backend uses the same private key to execute these operations

### Recommendations for Production
- Security audit before mainnet deployment
- Consider multi-signature wallet for ownership
- Implement timelock for critical operations
- Set up monitoring for all contract events

## Development

### Compile Contracts

```bash
npm run compile
```

This generates:
- Contract artifacts in `artifacts/`
- ABIs for integration
- TypeChain types (if configured)

### Run Tests

```bash
npm test
```

### Local Development

Start a local Hardhat node:
```bash
npm run node
```

In another terminal, deploy to local network:
```bash
npm run deploy:local
```

## Gas Costs

Approximate deployment costs on Base Sepolia:

| Contract | Gas Used | Cost (0.5 Gwei) |
|----------|----------|-----------------|
| ProfileNFT | ~2M | ~0.001 ETH |
| ConnectionNFT | ~2.5M | ~0.00125 ETH |
| PesoBytes | ~1.5M | ~0.00075 ETH |
| **Total** | **~6M** | **~0.003 ETH** |

Base has extremely low gas fees, making it cost-effective for NFT operations.

## Troubleshooting

### Common Issues

1. **Insufficient funds**
   - Get more ETH from: https://www.coinbase.com/faucets/base-sepolia-faucet

2. **Invalid private key**
   - Ensure no `0x` prefix in `.env`
   - Check it's 64 hex characters

3. **Network connection failed**
   - Check internet connection
   - Try different RPC URL (Alchemy, Infura)

4. **Verification failed**
   - Ensure `BASESCAN_API_KEY` is set
   - Wait a few minutes after deployment
   - Check constructor arguments match deployment

See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for detailed troubleshooting.

## Documentation

- **Quick Start Guide:** [QUICK_START.md](./QUICK_START.md) - Get up and running in 5 minutes
- **Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) - Comprehensive deployment documentation
- **Hardhat Docs:** https://hardhat.org/docs
- **OpenZeppelin:** https://docs.openzeppelin.com/contracts
- **Base Docs:** https://docs.base.org

## Resources

### Faucets
- Coinbase: https://www.coinbase.com/faucets/base-sepolia-faucet
- Alchemy: https://www.alchemy.com/faucets/base-sepolia

### Block Explorers
- Base Sepolia: https://sepolia.basescan.org
- Base Mainnet: https://basescan.org

### RPC Providers
- Alchemy: https://www.alchemy.com
- Infura: https://infura.io
- Public RPC: https://sepolia.base.org

### Community
- Base Discord: https://discord.gg/buildonbase
- Base Twitter: https://twitter.com/base

## License

MIT

## Support

For questions or issues:
1. Check [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) troubleshooting section
2. Review Hardhat/OpenZeppelin documentation
3. Ask in Base Discord community
4. Contact VibeConnect development team

---

**Network:** Base Sepolia Testnet
**Solidity:** 0.8.20
**OpenZeppelin:** 5.0.0
**Hardhat:** 2.19.0
