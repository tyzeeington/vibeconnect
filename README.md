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

## 📊 Current Status

**Last Updated:** January 2, 2026

### ✅ Deployed & Working
- **Backend API**: Deployed on Railway at `https://vibeconnect-production.up.railway.app`
- **Database**: PostgreSQL on Railway with all tables configured
- **Security**: Critical vulnerabilities fixed (JWT secret hardcoding removed)
- **GitHub**: Public repository with automated workflows
- **API Features**: Authentication, AI onboarding, events, matching, connections all implemented

### 🔧 Production Features Implemented
- ✅ Wallet authentication with signature verification (JWT)
- ✅ AI-powered personality profiling (5 core dimensions)
- ✅ Event check-in/check-out with proximity tracking
- ✅ Post-event matching algorithm with compatibility scoring
- ✅ Connection requests (accept/reject flow)
- ✅ Web3 integration for NFT minting
- ✅ Social profiles management (public/connection-only visibility)
- ✅ Rate limiting on critical endpoints
- ✅ Security headers and CORS configuration

### 🚧 In Progress
- **Frontend**: Next.js app built, experiencing Vercel deployment issues (needs reconfiguration)
- **Smart Contracts**: Compiled and ready, awaiting deployment to Base Sepolia
- **Mobile App**: React Native app scaffolded with basic wallet integration

### 🔐 Security Score: B+ (Good)
- Post-security audit with critical issues resolved
- See `SECURITY_AUDIT_REPORT.md` for detailed security analysis

---

## 🚨 Current Roadblocks

### Critical Priority 🔴
1. **JWT Secret Key Configuration**
   - Status: Code fixed, but Railway env var must be set
   - Impact: Backend will crash without this
   - Action: Generate secure key and add to Railway
   - Time: 5 minutes
   - Fix: `python -c "import secrets; print(secrets.token_urlsafe(64))"`

### High Priority 🟠
2. **In-Memory Session Storage**
   - Issue: Chat sessions stored in RAM, not production-ready
   - Impact: Data loss on restart, no horizontal scaling
   - Solution: Replace with Redis-backed storage
   - Time: 2-3 hours
   - See: `AGENT_TASKS.md` Task #2

3. **Development CORS Configuration**
   - Issue: Development mode allows ALL origins (`"*"`)
   - Impact: Security risk if deployed with DEBUG=True
   - Solution: Whitelist only localhost origins
   - Time: 15 minutes
   - See: `AGENT_TASKS.md` Task #3

4. **Smart Contract Deployment**
   - Blocker: Need Base Sepolia testnet ETH
   - Impact: NFT functionality unavailable
   - Solution: Get testnet ETH from faucet, deploy contracts
   - Time: 1-2 hours
   - See: `contracts/DEPLOY_NOW.md`

5. **Frontend Deployment**
   - Issue: Vercel configuration issues
   - Impact: No public-facing web app
   - Solution: Redeploy Vercel project with correct root directory
   - Time: 30 minutes

### Medium Priority 🟡
6. **Database Migration**: `002_add_expired_status.sql` not yet run on Railway
7. **IPFS Metadata**: Using placeholder URIs for NFTs
8. **Testing**: Integration tests need expansion

---

## 🚀 Future Roadmap

### Month 1 - January 2026 (Foundation)
**Focus: Deploy infrastructure, implement core features**

**Week 1: Deployment** *(In Progress)*
- [ ] Fix Vercel frontend deployment
- [ ] Deploy smart contracts to Base Sepolia
- [ ] Set JWT secret key in Railway
- [ ] Implement Redis session storage
- [ ] Run database migration for expired status

**Week 2: Backend Completion**
- [ ] Generate and upload NFT metadata to IPFS
- [ ] Add push notifications for connection requests
- [ ] Expand integration test coverage
- [ ] Add profile picture upload

**Week 3: Frontend Features**
- [ ] Build events discovery page with map view
- [ ] Enhance connections feed with filters
- [ ] Add "Follow All" social links feature
- [ ] Implement leaderboard for top connectors

**Week 4: Mobile App**
- [ ] Implement QR code scanner for event check-in
- [ ] Build navigation with React Navigation
- [ ] Create profile creation screen (AI onboarding)
- [ ] Add push notifications

### Month 2 - February 2026 (User Experience)
**Focus: Testing at real events, UI/UX refinement**

- [ ] Test at real events in NYC
- [ ] Gather user feedback on matching algorithm
- [ ] Responsive mobile design improvements
- [ ] Real-time notifications
- [ ] User dashboard with stats
- [ ] Profile editing and management
- [ ] Bug fixes from field testing

### Month 3 - March 2026 (Launch)
**Focus: Production deployment and public launch**

**Production Prep:**
- [ ] Deploy contracts to Base mainnet
- [ ] Production database setup
- [ ] Monitoring and logging (Sentry)
- [ ] Load testing and optimization
- [ ] Professional smart contract audit
- [ ] Security penetration testing

**Launch:**
- [ ] Soft launch with friends and early adopters
- [ ] **Public launch at DJ set** 🎧
- [ ] Press release and social media campaign
- [ ] Bug bounty program
- [ ] Community building

### Future Features (Post-Launch)
- Biometric integration (smart rings for automatic proximity)
- Group connections (multiple people vibing together)
- Event organizer analytics dashboard
- Connection NFT marketplace
- PSYWEB ecosystem integration
- Reputation system based on connection quality
- DAO governance for platform decisions

---

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
│   │       └── web3_service.py     # Blockchain integration
│   └── requirements.txt
├── contracts/         # Solidity smart contracts
│   ├── ProfileNFT.sol         # User identity NFTs (soulbound)
│   ├── ConnectionNFT.sol      # Connection memory NFTs
│   ├── PesoBytes.sol          # ERC20 reward token
│   ├── hardhat.config.js
│   └── scripts/deploy.js
├── frontend/          # Next.js web app
│   ├── app/                   # App router pages
│   ├── components/            # React components
│   └── lib/                   # Utilities and config
└── mobile/            # React Native + Expo
    ├── src/
    │   ├── screens/           # App screens
    │   ├── navigation/        # Navigation config
    │   └── services/          # API integration
    └── App.tsx
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

## ✅ Recent Achievements

### December 2024 - January 2026
- [x] Backend API deployed to Railway
- [x] PostgreSQL database configured on Railway
- [x] AI personality analysis service implemented
- [x] Matching algorithm with compatibility scoring
- [x] Smart contracts written and compiled (ProfileNFT, ConnectionNFT, PesoBytes)
- [x] **Switched to Base chain** (from Polygon)
- [x] Frontend web app with Next.js 16 + TypeScript
- [x] Wallet connection with RainbowKit + WalletConnect
- [x] Mobile app scaffolded with React Native + Expo
- [x] **Critical security audit completed** (JWT secret fix, CORS hardening)
- [x] Social profiles system with privacy controls
- [x] Rate limiting on critical endpoints
- [x] Security headers and middleware
- [x] Wallet signature verification
- [x] Connection request system (accept/reject)
- [x] Event check-in/check-out with proximity tracking

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

## 💡 Documentation & Resources

### Project Documentation
- **Architecture**: See `ARCHITECTURE.md` for system design
- **Security**: See `SECURITY_AUDIT_REPORT.md` for security analysis
- **Tasks**: See `AGENT_TASKS.md` for detailed implementation tasks
- **API Reference**: See `API_REFERENCE.md` for complete API documentation
- **Deployment**: See `DEPLOYMENT_GUIDE.md` for production deployment
- **Testing**: See `TESTING_GUIDE.md` for testing strategies

### Quick Links
- **Backend API**: https://vibeconnect-production.up.railway.app
- **API Docs**: https://vibeconnect-production.up.railway.app/docs
- **GitHub**: https://github.com/tyzeeington/vibeconnect
- **Base Sepolia Explorer**: https://sepolia.basescan.org
- **Base Faucet**: https://www.alchemy.com/faucets/base-sepolia

## 📄 License

MIT

## 🤝 Contributing

This is SPY's project. Hit me up if you want to collaborate.

---

**Built with 💜 for authentic human connection in a digital world**
