# VibeConnect

**Blockchain-powered platform for authentic event connections**

Connect with people you vibe with at events - no awkward phone number exchanges, just organic connections captured and tokenized on-chain.

## 🎯 The Vision

Make connection organic again. Walk into an event, be fully present, and let the platform capture authentic vibes. After the event, discover people you aligned with based on proximity, intentions, and your 5 core dimensions.

## 🧬 The 5 Core Dimensions

Every user is profiled across:
1. **Goals** - What you're building toward
2. **Intuition** - How you make decisions  
3. **Philosophy** - Your worldview
4. **Expectations** - What you want from connections
5. **Leisure Time** - How you recharge

## 🏗️ Architecture

```
vibeconnect/
├── backend/           # FastAPI + Python
│   ├── main.py
│   ├── app/
│   │   ├── models.py          # SQLAlchemy database models
│   │   ├── database.py        # DB connection
│   │   ├── config.py          # Settings
│   │   ├── routers/           # API endpoints
│   │   └── services/
│   │       ├── ai_service.py       # OpenAI personality analysis
│   │       ├── matching_service.py # Compatibility algorithm
│   │       └── web3_service.py     # Polygon blockchain
│   └── requirements.txt
├── contracts/         # Solidity smart contracts
│   ├── ProfileNFT.sol         # User identity NFTs (soulbound)
│   ├── ConnectionNFT.sol      # Connection memory NFTs
│   ├── PesoBytes.sol          # ERC20 reward token
│   ├── hardhat.config.js
│   └── scripts/deploy.js
└── mobile/            # React Native (coming soon)
```

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- PostgreSQL
- Node.js 18+

### Secure Setup (Recommended)

We use encrypted secret storage to safely work with AI assistants:

```bash
# Run the automated setup script
./scripts/setup-dev.sh
```

This will:
1. Generate an encryption key (stored in `~/.vibeconnect-key`)
2. Prompt you for all API keys and secrets
3. Encrypt and store them securely
4. Generate all `.env` files

**Important**: Your secrets are encrypted locally. The encryption key never leaves your machine, and encrypted values are safe to share with AI assistants.

See [SECURITY.md](SECURITY.md) for detailed security practices.

### Manual Setup (Alternative)

If you prefer to set up manually:
- OpenAI API key
- Alchemy/Infura Polygon RPC endpoint

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your API keys and database URL

# Run database migrations (after setting up PostgreSQL)
# You'll need to create the database first:
# createdb vibeconnect

# Start the server
python main.py
```

API will be running at `http://localhost:8000`
- Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### 2. Smart Contracts Setup

```bash
cd contracts

# Install dependencies
npm install

# Setup environment
cp ../.env.example .env
# Add your PRIVATE_KEY and POLYGON_RPC_URL

# Compile contracts
npm run compile

# Deploy to Polygon Mumbai testnet
npm run deploy:mumbai

# After deployment, copy contract addresses to backend/.env
```

## 📊 Database Models

**User** → Basic account (wallet address)
**UserProfile** → 5 dimensions + intentions
**Event** → Venue/location data
**EventCheckIn** → User checked into event
**Match** → Potential connection between users
**Connection** → Confirmed connection (both accepted)

## 🤖 AI Matching System

### Initial Profile Building
1. User completes conversational onboarding
2. OpenAI GPT-4 analyzes responses
3. Assigns scores (0-100) to 5 dimensions
4. Identifies multi-faceted intentions

### Match Calculation
```python
# Compatibility factors:
- Dimension alignment (weighted by importance)
- Intention overlap (shared goals)
- Proximity overlap (time spent near each other)
- Learning from past acceptances/rejections

# Output: 0-100 compatibility score
```

### Profile Refinement
After 10+ connections, AI refines your profile based on who you ACTUALLY connect with vs who you say you want to connect with.

## 🔗 Blockchain Integration

### ProfileNFT (Soulbound)
- One per user, non-transferable
- Represents your on-chain identity
- Metadata stored on IPFS

### ConnectionNFT
- Minted when two users mutually accept
- Co-owned memory of the connection
- Includes compatibility score, event data

### PesoBytes Token ($PESO)
- ERC20 token on Polygon
- Earned for making authentic connections
- 10 PESO base reward + bonus for high compatibility (90+)
- Can be used for premium features (future)

## 🎮 User Flow

1. **Sign up** → Connect wallet, AI onboarding chat
2. **Check in** → Tap once when arriving at event
3. **Be present** → Put phone away, vibe
4. **Post-event** → App shows top 5 matches
5. **Connect** → Accept/reject, if mutual → ConnectionNFT mints
6. **Earn** → Receive $PESO tokens for authentic connections

## 📱 API Endpoints (Core)

```
POST /api/auth/wallet-login        # Authenticate with wallet signature
POST /api/profiles/onboard          # Create profile with AI analysis
GET  /api/profiles/me               # Get your profile
PUT  /api/profiles/update           # Update dimensions/intentions

POST /api/events/checkin            # Check into event
POST /api/events/checkout           # Check out of event
GET  /api/events/active             # Get active events near you

GET  /api/matches/pending           # Get your pending matches
POST /api/matches/respond           # Accept/reject a match
GET  /api/matches/history           # Past matches

GET  /api/connections               # Your confirmed connections
GET  /api/connections/:id/nft       # Get NFT metadata
```

## 🔧 Development Roadmap

### ✅ Completed (December 2024)
- [x] Backend API structure
- [x] Database models (PostgreSQL)
- [x] AI personality analysis service
- [x] Matching algorithm implementation
- [x] Smart contracts (ProfileNFT, ConnectionNFT, PesoBytes)
- [x] **Switched to Base chain** (from Polygon)
- [x] Frontend web app with Next.js + TypeScript
- [x] Wallet connection with RainbowKit
- [x] Backend server running (http://localhost:8000)
- [x] Frontend dev server running (http://localhost:3000)

### Month 1 - January 2025 (Foundation)
**Smart Contracts & Infrastructure**
- [ ] Get WalletConnect Project ID
- [ ] Get Base Sepolia testnet ETH
- [ ] Deploy contracts to Base Sepolia testnet
- [ ] Verify contracts on Basescan
- [ ] Update backend/.env with deployed contract addresses

**Backend API Implementation**
- [ ] Implement wallet authentication endpoint
- [ ] Implement profile onboarding with AI analysis
- [ ] Implement event check-in/check-out endpoints
- [ ] Implement matching endpoint (post-event)
- [ ] Implement connection acceptance/rejection endpoints
- [ ] Add Web3 integration for NFT minting
- [ ] Testing with mock data

**Frontend Core Features**
- [ ] Profile creation flow with AI chat
- [ ] Profile view page
- [ ] Events list page
- [ ] Event detail page with check-in button

### Month 2 - February 2025 (User Experience)
**Frontend Complete Build**
- [ ] Event check-in/out flow
- [ ] Post-event matches feed UI
- [ ] Accept/reject match interactions
- [ ] Connection NFT minting confirmation
- [ ] User dashboard (stats, connections, $PESO balance)
- [ ] Responsive mobile web design

**Testing & Refinement**
- [ ] End-to-end testing with test accounts
- [ ] Test at real events in NYC
- [ ] Gather user feedback
- [ ] UI/UX improvements based on feedback
- [ ] Performance optimization

**Optional: Mobile App**
- [ ] Consider React Native mobile app
- [ ] Or optimize PWA for mobile install

### Month 3 - March 2025 (Launch)
**Production Deployment**
- [ ] Deploy contracts to Base mainnet
- [ ] Set up production database (hosted PostgreSQL)
- [ ] Deploy backend to production (Vercel/Railway/Render)
- [ ] Deploy frontend to production (Vercel)
- [ ] Configure production environment variables
- [ ] Set up monitoring and logging

**Launch Preparation**
- [ ] Create landing/marketing page
- [ ] Prepare social media announcements
- [ ] Bug fixes and polish
- [ ] Security audit of smart contracts
- [ ] Final testing on mainnet

**Go Live**
- [ ] Soft launch with small group
- [ ] Launch at your next DJ set 🎧
- [ ] Public announcement
- [ ] Gather initial user feedback
- [ ] Iterate based on real usage

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Smart contract tests
cd contracts
npx hardhat test
```

## 🌐 Environment Variables

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/vibeconnect

# OpenAI
OPENAI_API_KEY=sk-...

# Polygon
POLYGON_RPC_URL=https://polygon-mumbai.g.alchemy.com/v2/...
PRIVATE_KEY=0x...

# Contracts (after deployment)
PROFILE_NFT_CONTRACT=0x...
CONNECTION_NFT_CONTRACT=0x...
PESOBYTES_CONTRACT=0x...

# JWT
SECRET_KEY=your-secret-key
```

## 🎨 Tech Stack

**Backend:** FastAPI, PostgreSQL, SQLAlchemy, OpenAI API, Web3.py
**Blockchain:** Solidity, Hardhat, OpenZeppelin, **Base** (Coinbase L2)
**Frontend:** Next.js 16, TypeScript, TailwindCSS, RainbowKit, Wagmi, Viem
**AI:** GPT-4, scikit-learn

## 💡 Future Features

- Biometric integration (smart rings for automatic connection detection)
- Group connections (multiple people vibing together)
- Event organizer tools (analytics, featured connections)
- Connection marketplace (trade/gift connection NFTs)
- Integration with PSYWEB ecosystem
- Reputation system based on connection quality

## 📄 License

MIT

## 🤝 Contributing

This is SPY's project. Hit me up if you want to collaborate.

---

**Built with 💜 for authentic human connection in a digital world**
