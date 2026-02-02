# VibeConnect Copilot Instructions

## Project Overview

**VibeConnect** is a blockchain-powered event-based social platform that captures authentic connections between people at events. Users create profiles based on 5 core dimensions (Goals, Intuition, Philosophy, Expectations, Leisure Time), check into events, and receive AI-matched connection recommendations post-event.

**Tech Stack:**
- **Frontend**: Next.js 18+ with RainbowKit (Web3 wallet integration)
- **Backend**: FastAPI (Python 3.11) with PostgreSQL
- **Blockchain**: Base Sepolia testnet with Hardhat + Solidity smart contracts
- **Mobile**: React Native/Expo (scaffolded)
- **AI**: OpenAI GPT-4 for personality profiling
- **Deployment**: Vercel (frontend), Railway (backend), GitHub Actions

---

## Architecture Essentials

### Data Flow
1. **Onboarding**: User connects wallet → AI conversational interview → GPT-4 scores 5 dimensions → Mint ProfileNFT
2. **Events**: User checks in (GPS + timestamp) → Stays at event → Checks out → System calculates proximity overlap
3. **Matching**: Algorithm compares dimension proximity + intention alignment → Generates compatibility scores → Creates Match records
4. **Connections**: Recipients accept/reject matches → Connection record created → NFT minted on successful connection

### Core Models ([backend/app/models.py](backend/app/models.py#L1-L80))
- **User**: Wallet address (unique), profile relationships, check-ins, matches
- **UserProfile**: 5 dimensions (0-100 floats), intentions (JSON), social profiles, device token for push notifications
- **Event**: Venue info, GPS coordinates, check-in/check-out tracking
- **Match**: User A ↔ User B pairing with status (pending/accepted/rejected/expired), compatibility score
- **MatchStatus**: Enum with PENDING, ACCEPTED, REJECTED, EXPIRED states

### Service Boundaries
- **[ai_service.py](backend/app/services/ai_service.py)**: OpenAI integration for GPT-4 dimension scoring
- **[matching_service.py](backend/app/services/matching_service.py)**: Proximity + dimension-based match algorithm
- **[web3_service.py](backend/app/services/web3_service.py)**: NFT minting, contract interactions via Web3.py
- **[ipfs_service.py](backend/app/services/ipfs_service.py)**: Profile picture uploads to IPFS via Pinata API
- **[session_service.py](backend/app/services/session_service.py)**: Redis-backed chat session storage (NOT in-memory)
- **[notification_service.py](backend/app/services/notification_service.py)**: Firebase FCM push notifications

### Critical Patterns

**Authentication**: JWT tokens from wallet signature verification (see [backend/app/auth_utils.py](backend/app/auth_utils.py))
- Backend expects signed messages from wallet, generates JWT, returns token
- No traditional passwords; signature proves wallet ownership

**Environment**: Development requires Redis (`redis://localhost:6379`); use `REDIS_URL` env var
- Session data must persist across restarts (critical for chat flows)
- No in-memory storage in production

**Web3 Integration**: All NFT minting happens post-event matching
- Contract ABIs stored in [backend/app/abis/](backend/app/abis/) (auto-generated from Solidity)
- Private key required only for backend NFT minting (optional for testing)

---

## Key Development Workflows

### Local Setup
```bash
# Root repo setup
npm install  # Installs workspaces: frontend, mobile, contracts

# Backend start
cd backend && pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# Frontend start
cd frontend && npm run dev

# Database
# Use Railway PostgreSQL (production) or local Docker: docker run -d postgres:14

# Redis (required for session storage)
redis-server  # or: docker run -d redis
```

### Demo Mode (Fastest Way to Test)
```bash
npm run demo:party  # Spins up full stack with 50 test users + seeded event
# Creates: local Hardhat node, deployed contracts, test wallets, backend, frontend
```

### Testing
```bash
# Backend unit tests
cd backend && pytest tests/

# Backend integration tests (connection flow)
pytest tests/test_connection_flow.py -v

# Contract tests
cd contracts && npm test

# Frontend component tests (if available)
cd frontend && npm test
```

### API Endpoints (v1)
```
POST   /api/v1/auth/verify       # Wallet signature verification
POST   /api/v1/chat/start        # Begin profile onboarding chat
POST   /api/v1/chat/message      # Send chat message
POST   /api/v1/chat/complete     # Finalize profile + mint NFT

POST   /api/v1/events/check-in   # Enter event with GPS
POST   /api/v1/events/check-out  # Leave event

POST   /api/v1/matches/compute   # Trigger matching algorithm for event
GET    /api/v1/matches/my-matches # Get pending matches for user

POST   /api/v1/connections/accept    # Accept connection match
POST   /api/v1/connections/reject    # Reject connection match
GET    /api/v1/connections/active    # List confirmed connections

GET    /api/v1/profiles/<wallet>     # Get user profile (social visibility rules)
PATCH  /api/v1/profiles/me           # Update profile dimensions/intentions
POST   /api/v1/profiles/picture      # Upload profile picture to IPFS

GET    /api/v1/leaderboard          # Top connectors ranked by connection count
```

---

## Critical Implementation Details

### AI Dimension Scoring
- **Flow**: User answers 5 conversational questions → GPT-4 analyzes responses → Returns JSON with scores
- **Output Format**: `{"goals": 75, "intuition": 60, "philosophy": 85, "expectations": 50, "leisure_time": 90}`
- **Scale**: 0–100 (50 = neutral, 100 = strongly aligned with dimension)
- **Edge Case**: GPT-4 sometimes returns invalid JSON; always validate and retry with fallback defaults

### Matching Algorithm
1. **Proximity**: Calculate GPS distance between check-in points; threshold ~500m
2. **Dimension Compatibility**: For each dimension, calculate absolute difference (max 100); invert to score
3. **Intention Overlap**: If both users share intentions (e.g., "deep_conversation"), boost score by 10%
4. **Final Score**: Average of dimension scores + intention boost = compatibility (0–100)
5. **Threshold**: Only create Match if score ≥ 60 to avoid spam

### CORS & Security
- **Development**: Whitelist only `localhost:3000`, `localhost:3001` (not `"*"`)
- **Production**: Set `DEBUG=False` to disable detailed error logs
- **Rate Limiting**: Critical endpoints (auth, matching) use SlowAPI with default 60 req/min

### NFT Minting Logic
- **ProfileNFT**: Minted on first profile completion; one per wallet (soulbound)
- **ConnectionNFT**: Minted when both users accept connection; metadata includes both wallets + timestamp
- **Contract Interaction**: See [backend/app/services/web3_service.py](backend/app/services/web3_service.py) for minting patterns

### Database Migrations
- Located in [backend/migrations/](backend/migrations/)
- Run manually: `psql $DATABASE_URL < migrations/001_*.sql`
- Check migration status: `SELECT * FROM schema_migrations;` (if using migration tool)
- **Important**: `002_add_expired_status.sql` adds EXPIRED status to matches (run before production matching)

---

## Common Patterns to Follow

**Error Handling**: Use Pydantic models for request validation; return standardized error responses:
```json
{"error": "Invalid input", "detail": "wallet_address must be hex string"}
```

**Async/Await**: Backend is async-first; use `async def` for I/O-bound operations (DB, API calls)

**Web3 Transactions**: Always wrap in try/catch; gas estimation can fail on testnet. See [web3_service.py](backend/app/services/web3_service.py#L1) for patterns.

**Chat Sessions**: Store in Redis using wallet_address + timestamp as key (not in-memory). Expire after 1 hour of inactivity.

**Social Profiles**: Visibility controlled by `social_visibility` field ("public" vs. "connection_only"); filter results in profile endpoint.

---

## Files to Know

| File | Purpose |
|------|---------|
| [backend/app/main.py](backend/app/main.py) | FastAPI app initialization, middleware setup |
| [backend/app/routers/](backend/app/routers/) | API endpoint handlers (auth, chat, events, matches, connections) |
| [backend/app/services/](backend/app/services/) | Business logic (AI, matching, Web3, IPFS, notifications) |
| [contracts/contracts/](contracts/contracts/) | Solidity contracts (ProfileNFT, ConnectionNFT, PesoBytes, etc.) |
| [frontend/app/](frontend/app/) | Next.js pages + components |
| [AGENT_TASKS.md](AGENT_TASKS.md) | Prioritized tasks for AI implementation (12/13 complete) |
| [SECURITY_AUDIT_REPORT.md](SECURITY_AUDIT_REPORT.md) | Security findings (JWT hardcoding, CORS issues—all fixed) |
| [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) | Production deployment steps (Vercel, Railway, Base Sepolia) |

---

## Deployment Checklist

✅ Before merging to `main`:
1. Run `pytest tests/test_connection_flow.py` (integration tests pass)
2. Run backend linting: `black app/ && isort app/` 
3. Update `.env.example` if adding new env variables
4. Verify CORS whitelist is development-only

✅ Before production deployment:
1. Generate JWT_SECRET_KEY: `python backend/scripts/generate_jwt_secret.py`
2. Set `DEBUG=False` in production environment
3. Run database migration `002_add_expired_status.sql` on Railway
4. Deploy contracts to Base Sepolia (if not already done): `cd contracts && npm run deploy:base-sepolia`
5. Update contract addresses in backend .env
6. Verify Redis is running on production (or use Railway Redis addon)

---

## Troubleshooting Quick Ref

**Backend won't start**: Check `SECRET_KEY` env variable is set (required, no default)

**Chat session lost**: Redis not running or connection refused; verify `REDIS_URL` and redis-server status

**NFT minting fails**: Private key missing or invalid; check BASE_RPC_URL and contract addresses match deployment

**Matching returns no results**: Check GPS coordinates are within 500m + at least one matching dimension >= 60 score

**Frontend shows blank**: Verify backend URL in frontend .env matches deployed API endpoint
