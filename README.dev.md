# VibeConnect - Developer Guide

Welcome to the VibeConnect development environment! This guide will get you up and running in minutes.

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- PostgreSQL 14+
- Redis (optional, for caching)
- MetaMask or compatible Web3 wallet

### One-Command Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/vibeconnect.git
cd vibeconnect

# Install all dependencies
npm install

# Set up environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
cp contracts/.env.example contracts/.env
cp mobile/.env.example mobile/.env

# Edit .env files with your keys (see Environment Setup below)
```

## 🎪 Demo Mode: `yarn demo:party`

**Spin up a fully functional local event in 15 seconds!**

```bash
yarn demo:party
```

This command will:

1. ✅ Start a local Hardhat blockchain node
2. ✅ Deploy all contracts to localhost
3. ✅ Create a demo event "Demo Party 2026"
4. ✅ Mint 50 fake attendee NFTs
5. ✅ Seed database with test users
6. ✅ Start backend API on `http://localhost:8000`
7. ✅ Start frontend on `http://localhost:3000`
8. ✅ Output QR code for mobile app testing

**What you get:**

- 50 pre-minted event entry NFTs
- Test wallets with funded ETH
- Live API endpoints
- Interactive frontend
- QR codes for mobile testing

## 📁 Project Structure

```
vibeconnect/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── routers/      # API endpoints (versioned /api/v1/)
│   │   ├── services/     # Business logic
│   │   ├── models.py     # Database models
│   │   └── main.py       # FastAPI app entry
│   ├── requirements.txt
│   └── requirements-dev.txt
│
├── contracts/        # Solidity smart contracts
│   ├── contracts/
│   │   ├── EventEntryNFT.sol       # Door-Mint Protocol
│   │   ├── EventTokenFactory.sol   # Auto-Meme Coin Factory
│   │   ├── ProfileNFT.sol          # User profiles
│   │   ├── ConnectionNFT.sol       # Connections
│   │   ├── PesoBytes.sol           # Reward token
│   │   └── TwinBadge.sol           # Network effect badges
│   ├── test/             # Comprehensive test suite
│   ├── scripts/          # Deployment scripts
│   └── hardhat.config.js
│
├── frontend/         # Next.js web app
│   ├── app/              # App router pages
│   ├── components/       # React components
│   ├── lib/              # Utilities (Wagmi config, etc.)
│   └── package.json
│
├── mobile/           # React Native Expo app
│   ├── src/
│   │   ├── screens/      # App screens
│   │   ├── components/   # Reusable components
│   │   └── utils/        # Haptics, sounds, etc.
│   └── package.json
│
└── scripts/          # Utility scripts
    └── demo-party.js     # Demo mode script
```

## 🔧 Environment Setup

### Backend (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/vibeconnect

# OpenAI (for AI profile analysis)
OPENAI_API_KEY=your_openai_api_key

# Blockchain
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY
PRIVATE_KEY=your_deployer_private_key

# Contracts (auto-filled after deployment)
PROFILE_NFT_CONTRACT=0x...
CONNECTION_NFT_CONTRACT=0x...
EVENT_ENTRY_NFT_CONTRACT=0x...

# Gasless Relay (optional)
GELATO_RELAY_API_KEY=your_gelato_key

# IPFS (Pinata)
PINATA_API_KEY=your_pinata_key
PINATA_SECRET_KEY=your_pinata_secret

# Printful (for merch)
PRINTFUL_API_KEY=your_printful_key
PRINTFUL_SANDBOX_MODE=true

# JWT Secret
SECRET_KEY=$(python -c "import secrets; print(secrets.token_urlsafe(64))")
```

### Contracts (.env)

```bash
PRIVATE_KEY=your_private_key
BASE_RPC_URL=https://base-sepolia.g.alchemy.com/v2/YOUR_KEY

# Optional: Twilio for deploy notifications
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
ALERT_PHONE_NUMBER=+1234567890
```

## 🧪 Testing

### Smart Contracts

```bash
cd contracts

# Run all tests
npm test

# Run specific test file
npx hardhat test test/EventEntry.stress.test.js

# Run with coverage
npm run test:coverage

# Run the LEGENDARY 1000 ticket simulation
npx hardhat test test/EventEntry.stress.test.js --grep "1000"
```

**The 1000 Ticket Test:**

- Mints 1000 NFTs
- Simulates 700 claims
- Burns 300 unclaimed after 24 hours
- Verifies supply drops correctly
- **IF THIS TEST BREAKS, THE BRANCH DIES IN HELL** 💀

### Backend (Python)

```bash
cd backend

# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest

# Lint and format
black .
isort .
flake8 .
```

### Frontend

```bash
cd frontend

# Run Next.js in dev mode
npm run dev

# Type check
npm run type-check

# Lint
npm run lint

# Format
npm run format
```

## 🚢 Deployment

### Deploy to Base Sepolia

```bash
cd contracts

# Deploy all contracts
npm run deploy:sepolia

# Output will be saved to deployment-addresses.json
# SMS notification sent via Twilio (if configured)
```

**What happens:**

1. Deploys all contracts
2. Saves addresses to `deployment-addresses.json`
3. Sends SMS to `ALERT_PHONE_NUMBER` with status
4. Outputs addresses for copying to backend `.env`

**Gas Requirements:**

- Minimum balance: 0.01 ETH
- Average total cost: ~0.005 ETH

### Verify Contracts

```bash
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>
```

## 🔍 Code Quality

### Pre-Commit Hooks

Every commit runs:

- ✅ ESLint + Prettier for JS/TS
- ✅ Black + isort + flake8 for Python
- ✅ Solhint for Solidity
- ✅ Commit message format validation

**Commit Message Format:**

```
type(scope?): subject

Types: feat, fix, docs, style, refactor, perf, test, chore, build, ci, revert

Examples:
  ✅ feat: add gasless minting
  ✅ fix(nft): resolve confetti animation
  ✅ chore: update dependencies
  ❌ added stuff (WILL BE REJECTED)
```

### Manual Linting

```bash
# Lint everything
npm run lint

# Format everything
npm run format

# Format check (CI mode)
npm run format:check
```

## 📚 API Documentation

### Versioned Endpoints

All API endpoints are versioned under `/api/v1/`:

```
http://localhost:8000/api/v1/auth/login
http://localhost:8000/api/v1/profiles/me
http://localhost:8000/api/v1/events/active
http://localhost:8000/api/v1/matches/pending
```

### Auto-Generated Swagger Docs

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Open Swagger UI
open http://localhost:8000/docs

# Open ReDoc
open http://localhost:8000/redoc
```

## 🎨 Feature Implementation Status

### ✅ Completed

- [x] Profile NFTs (soulbound)
- [x] Connection NFTs (co-owned)
- [x] PesoBytes (ERC20 rewards)
- [x] Event check-in/check-out
- [x] Matching algorithm
- [x] AI profile analysis

### 🚧 In Progress

- [ ] Door-Mint Protocol (EventEntryNFT)
- [ ] Auto-Meme Coin Factory
- [ ] Tiered Merch Drop (Printful)
- [ ] Wallet-as-Memory UI
- [ ] Passive Network Effect (twin badges)
- [ ] UX Dopamine (haptics + sounds)

## 🐛 Error Handling

### Proper HTTP Status Codes

The API uses descriptive error messages with correct status codes:

```python
# ❌ OLD (bad):
raise HTTPException(status_code=500, detail="Error")

# ✅ NEW (good):
raise HTTPException(
    status_code=402,  # Payment Required
    detail="Insufficient gas — refill or go home"
)
```

### Gas Errors

```json
{
  "status_code": 402,
  "detail": "Insufficient gas — refill or go home",
  "gas_required": "0.005 ETH",
  "current_balance": "0.001 ETH"
}
```

## 🔗 Useful Commands

```bash
# Monorepo root commands
npm run lint              # Lint all workspaces
npm run format            # Format all files
npm run demo:party        # Start demo mode
npm run deploy:sepolia    # Deploy to Base Sepolia

# Contract commands
cd contracts
npm run compile           # Compile contracts
npm test                  # Run tests
npm run lint              # Lint Solidity
npm run deploy:sepolia    # Deploy to testnet

# Backend commands
cd backend
uvicorn app.main:app --reload     # Start API
python -m pytest                   # Run tests
black . && isort .                 # Format code

# Frontend commands
cd frontend
npm run dev              # Start Next.js
npm run build            # Build for production
npm run type-check       # TypeScript check

# Mobile commands
cd mobile
npm start                # Start Expo
npm run android          # Run on Android
npm run ios              # Run on iOS
```

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/vibeconnect/issues)
- **Docs**: [Full Documentation](https://docs.vibeconnect.xyz)
- **Discord**: [Community Server](https://discord.gg/vibeconnect)

## 📄 License

MIT © VibeConnect Team

---

**Built with ❤️ by developers who hate fluff and love real scarcity.**
