# CLAUDE.md - AI Assistant Guide for VibeConnect

**Last Updated:** January 1, 2026
**Purpose:** Comprehensive guide for AI assistants working with the VibeConnect codebase

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Repository Structure](#repository-structure)
3. [Tech Stack](#tech-stack)
4. [Development Setup](#development-setup)
5. [Architecture & Data Flow](#architecture--data-flow)
6. [Key Files & Patterns](#key-files--patterns)
7. [Database Schema](#database-schema)
8. [API Endpoints](#api-endpoints)
9. [Frontend Structure](#frontend-structure)
10. [Mobile App Structure](#mobile-app-structure)
11. [Smart Contracts](#smart-contracts)
12. [Security Practices](#security-practices)
13. [Common Development Tasks](#common-development-tasks)
14. [Testing Guidelines](#testing-guidelines)
15. [Deployment](#deployment)
16. [AI Assistant Conventions](#ai-assistant-conventions)

---

## Project Overview

**VibeConnect** is a blockchain-powered platform for authentic event connections. Users check into events, stay present, and afterward discover compatible connections based on AI-analyzed personality dimensions.

### Core Concept

- **5 Core Dimensions**: Goals, Intuition, Philosophy, Expectations, Leisure Time
- **AI-Powered Matching**: OpenAI GPT-4 analyzes user personalities and calculates compatibility
- **Blockchain Verification**: Connections are minted as NFTs on Base blockchain
- **Token Rewards**: Users earn $PESO tokens for authentic connections

### User Flow

1. **Onboarding**: Connect wallet → AI personality chat → Profile creation
2. **Event Check-In**: Tap to check in → Be present (phone away) → Check out
3. **Post-Event**: View matches → Accept/Reject → Mutual acceptance mints NFT
4. **Rewards**: Earn $PESO tokens for successful connections

---

## Repository Structure

```
vibeconnect/
├── backend/                    # FastAPI Python backend
│   ├── app/
│   │   ├── models.py          # SQLAlchemy database models
│   │   ├── database.py        # Database connection
│   │   ├── config.py          # Settings & environment variables
│   │   ├── auth_utils.py      # JWT & wallet authentication
│   │   ├── routers/           # API route handlers
│   │   │   ├── auth.py        # Wallet authentication endpoints
│   │   │   ├── profiles.py    # User profile management
│   │   │   ├── events.py      # Event check-in/out
│   │   │   ├── matches.py     # Match viewing/responding
│   │   │   └── connections.py # Confirmed connections
│   │   └── services/
│   │       ├── ai_service.py       # OpenAI personality analysis
│   │       ├── matching_service.py # Compatibility algorithm
│   │       └── web3_service.py     # Blockchain interaction
│   ├── migrations/            # Database migration scripts
│   ├── main.py               # FastAPI app entry point
│   └── requirements.txt      # Python dependencies
│
├── contracts/                 # Solidity smart contracts
│   ├── contracts/
│   │   ├── ProfileNFT.sol    # Soulbound identity NFTs
│   │   ├── ConnectionNFT.sol # Connection memory NFTs
│   │   └── PesoBytes.sol     # ERC20 reward token
│   ├── scripts/
│   │   └── deploy.js         # Deployment script
│   ├── hardhat.config.js     # Hardhat configuration
│   └── package.json          # Node dependencies
│
├── frontend/                  # Next.js 16 web app
│   ├── app/                  # App Router directory
│   │   ├── layout.tsx        # Root layout with RainbowKit
│   │   ├── page.tsx          # Landing page
│   │   ├── providers.tsx     # Web3 providers setup
│   │   ├── onboarding/       # AI personality chat
│   │   ├── profile/          # User profile view
│   │   ├── events/           # Events list
│   │   ├── connections/      # Connections feed
│   │   └── components/       # Shared components
│   ├── lib/
│   │   └── wagmi.ts          # Wagmi/Viem configuration
│   ├── public/               # Static assets
│   └── package.json
│
├── mobile/                    # React Native Expo app
│   ├── src/
│   │   ├── context/
│   │   │   └── WalletContext.tsx  # WalletConnect integration
│   │   └── (future screens)
│   ├── App.tsx               # Main app component
│   ├── app.json              # Expo configuration
│   └── package.json
│
├── scripts/                   # Development utilities
│   ├── encrypt-secrets.js    # Secret encryption tool
│   ├── setup-dev.sh          # Automated dev setup
│   └── update-contract-secrets.sh
│
├── .encrypted/                # Encrypted secrets storage
│   ├── secrets.json          # Encrypted secrets (SAFE to share)
│   └── secrets.example.json  # Template
│
├── ARCHITECTURE.md           # System architecture diagrams
├── DEPLOYMENT.md             # Deployment guide
├── SECURITY.md               # Security best practices
├── TODO.md                   # Current development tasks
├── README.md                 # Main project README
└── CLAUDE.md                 # This file
```

---

## Tech Stack

### Backend
- **Framework**: FastAPI 0.110+
- **Database**: PostgreSQL + SQLAlchemy 2.0
- **Authentication**: JWT + Wallet signature verification
- **AI**: OpenAI API (GPT-4)
- **Blockchain**: Web3.py for Base chain interaction
- **Server**: Uvicorn ASGI server

### Smart Contracts
- **Language**: Solidity 0.8+
- **Framework**: Hardhat 2.19
- **Libraries**: OpenZeppelin Contracts 5.0
- **Network**: Base (Coinbase L2) - Sepolia testnet, mainnet
- **Tools**: Ethers.js for deployment

### Frontend (Web)
- **Framework**: Next.js 16.1 (App Router)
- **Language**: TypeScript 5
- **Styling**: TailwindCSS 4
- **Web3**: RainbowKit 2.2 + Wagmi 2.19 + Viem 2.21
- **State**: React Query (TanStack Query 5.90)
- **HTTP**: Axios 1.13

### Mobile
- **Framework**: React Native via Expo ~54.0
- **Language**: TypeScript 5.9
- **Web3**: WalletConnect 2.23
- **Storage**: AsyncStorage 2.1
- **Location**: Expo Location 19.0

### Development Tools
- **Package Manager**: npm
- **Linting**: ESLint 9 (frontend)
- **Type Checking**: TypeScript strict mode
- **Testing**: pytest (backend), Hardhat test (contracts)

---

## Development Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL 14+
- Git

### First-Time Setup

#### 1. Clone Repository
```bash
git clone <repository-url>
cd vibeconnect
```

#### 2. Encrypted Secrets Setup (RECOMMENDED)
```bash
# Run automated setup script
./scripts/setup-dev.sh

# This will:
# - Generate encryption key (~/.vibeconnect-key)
# - Prompt for API keys and secrets
# - Encrypt and store them
# - Generate .env files for all components
```

**Important**: Encrypted secrets in `.encrypted/secrets.json` are SAFE to share with AI assistants. The encryption key (`~/.vibeconnect-key`) should NEVER be shared.

#### 3. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup database
createdb vibeconnect
# Run migrations in migrations/ folder if any

# Start server
python main.py
# Access at http://localhost:8000
# API docs at http://localhost:8000/docs
```

#### 4. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev
# Access at http://localhost:3000
```

#### 5. Smart Contracts Setup
```bash
cd contracts

# Install dependencies
npm install

# Compile contracts
npm run compile

# Deploy to Base Sepolia testnet (requires Base Sepolia ETH)
npm run deploy:base-sepolia

# After deployment, update backend/.env with contract addresses
```

#### 6. Mobile App Setup
```bash
cd mobile

# Install dependencies
npm install

# Start Expo dev server
npm start

# Scan QR code with Expo Go app
```

### Environment Variables

Required environment variables are managed through the encrypted secrets system. Key variables include:

**Backend** (`backend/.env`):
- `DATABASE_URL`: PostgreSQL connection string
- `OPENAI_API_KEY`: OpenAI API key for personality analysis
- `BASE_RPC_URL`: Base blockchain RPC endpoint
- `PROFILE_NFT_CONTRACT`: Deployed ProfileNFT address
- `CONNECTION_NFT_CONTRACT`: Deployed ConnectionNFT address
- `PESOBYTES_CONTRACT`: Deployed PesoBytes token address
- `SECRET_KEY`: JWT signing secret

**Contracts** (`contracts/.env`):
- `PRIVATE_KEY`: Deployment wallet private key
- `BASE_SEPOLIA_RPC_URL`: Base Sepolia RPC
- `BASE_RPC_URL`: Base mainnet RPC

**Frontend** (uses public env vars, no .env file typically needed):
- RPC URLs and contract addresses configured in `lib/wagmi.ts`

---

## Architecture & Data Flow

### High-Level Architecture

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Frontend  │◄───────►│   Backend   │◄───────►│  PostgreSQL │
│  (Next.js)  │  REST   │  (FastAPI)  │   SQL   │  Database   │
└─────────────┘         └─────────────┘         └─────────────┘
       │                       │
       │                       │
       ▼                       ▼
┌─────────────┐         ┌─────────────┐
│    Base     │         │  OpenAI API │
│ Blockchain  │         │   (GPT-4)   │
│  (Web3)     │         │  AI Service │
└─────────────┘         └─────────────┘
```

### Data Flow for Key Operations

#### Profile Creation
1. User completes AI chat in frontend/mobile
2. Frontend sends responses to `/api/chat/message`
3. Backend sends to OpenAI GPT-4 for analysis
4. AI returns personality scores (0-100) for 5 dimensions
5. Profile saved to PostgreSQL
6. (Future) ProfileNFT minted on Base

#### Event Check-In
1. User taps "Check In" at event location
2. Frontend captures GPS coordinates, sends to `/api/events/checkin`
3. Backend creates `EventCheckIn` record with timestamp
4. Returns confirmation to frontend

#### Post-Event Matching
1. After event ends, backend runs matching algorithm
2. For each user pair: calculate compatibility score
   - Dimension alignment (40% weight)
   - Intention overlap (30% weight)
   - Proximity/time overlap (20% weight)
   - ML learning factor (10% weight)
3. Create `Match` records with scores
4. Users view matches via `/api/matches/pending`

#### Connection Acceptance
1. User A accepts match → status updated in database
2. User B accepts match → both accepted
3. Backend mints `ConnectionNFT` on Base blockchain
4. Backend transfers $PESO tokens (10 base + 5 bonus if score ≥ 90)
5. `Connection` record created with NFT ID and tx hash

---

## Key Files & Patterns

### Backend Patterns

#### Database Models (`backend/app/models.py`)
- **Pattern**: SQLAlchemy ORM with declarative base
- **Conventions**:
  - Use `__tablename__` for table names (snake_case)
  - Include `created_at` and `updated_at` timestamps
  - Use relationships for foreign keys
  - Enums for status fields (e.g., `MatchStatus`)

```python
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String, unique=True, index=True, nullable=False)
    # ... relationships
    profile = relationship("UserProfile", back_populates="user", uselist=False)
```

#### API Routes (`backend/app/routers/*.py`)
- **Pattern**: FastAPI router with dependency injection
- **Conventions**:
  - Use Pydantic models for request/response validation
  - Dependency injection for database sessions
  - Consistent error handling with HTTP status codes
  - Document endpoints with docstrings

```python
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/api/profiles", tags=["profiles"])

@router.get("/me")
def get_my_profile(db: Session = Depends(get_db)):
    """Get authenticated user's profile"""
    # Implementation
```

#### Services (`backend/app/services/*.py`)
- **Pattern**: Service layer for business logic
- **Conventions**:
  - Keep routes thin, logic in services
  - Services handle external API calls (OpenAI, Web3)
  - Return structured data, let routes handle HTTP responses

### Frontend Patterns

#### Next.js App Router (`frontend/app/`)
- **Pattern**: File-based routing with App Router
- **Conventions**:
  - `page.tsx` for route pages
  - `layout.tsx` for shared layouts
  - `'use client'` directive for client components
  - Server components by default when possible

```tsx
'use client';

import { useAccount } from 'wagmi';

export default function ProfilePage() {
  const { address, isConnected } = useAccount();
  // Component logic
  return (
    <div>
      {/* JSX */}
    </div>
  );
}
```

#### Styling
- **Pattern**: TailwindCSS utility classes
- **Conventions**:
  - Use gradient backgrounds: `bg-gradient-to-br from-purple-900 via-blue-900 to-black`
  - Purple/blue theme colors: `purple-600`, `blue-600`
  - Responsive design: use `sm:`, `md:`, `lg:` prefixes
  - Hover states: `hover:bg-purple-700`

#### Web3 Integration
- **Pattern**: RainbowKit + Wagmi + Viem
- **Configuration**: `lib/wagmi.ts`
- **Conventions**:
  - Use `useAccount()` for wallet status
  - Use `useContractRead/Write()` for contract calls
  - Wrap app with providers in `app/providers.tsx`

### Smart Contract Patterns

#### Solidity Structure
- **Pattern**: OpenZeppelin inheritance
- **Conventions**:
  - Use OpenZeppelin contracts for standards (ERC721, ERC20)
  - Implement access control (Ownable)
  - Emit events for all state changes
  - Use SafeMath (built-in Solidity 0.8+)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ProfileNFT is ERC721, Ownable {
    // Implementation
}
```

---

## Database Schema

### Core Tables

#### `users`
- `id`: Primary key
- `wallet_address`: Unique, indexed (blockchain address)
- `username`: Unique, nullable
- `profile_nft_id`: NFT token ID (nullable)
- `created_at`, `updated_at`: Timestamps

#### `user_profiles`
- `id`: Primary key
- `user_id`: Foreign key → users (one-to-one)
- **5 Dimensions** (Float 0-100):
  - `goals`: What you're building toward
  - `intuition`: How you make decisions
  - `philosophy`: Your worldview
  - `expectations`: What you want from connections
  - `leisure_time`: How you recharge
- `intentions`: JSON array (multi-faceted goals)
- `bio`: Text
- `interests`: JSON array
- **Social Profiles**:
  - `social_profiles`: JSON object `{"instagram": "@handle", ...}`
  - `social_visibility`: "public" or "connection_only"
- **AI Learning**:
  - `total_connections`: Integer
  - `acceptance_rate`: Float 0-1
  - `profile_confidence`: Float 0-1 (how refined)

#### `events`
- `id`: Primary key
- `event_id`: Unique identifier (venue_id + timestamp)
- `venue_name`: Text
- `latitude`, `longitude`: GPS coordinates
- `event_type`: concert, bar, restaurant, etc.
- `start_time`, `end_time`: DateTime (nullable)

#### `event_check_ins`
- `id`: Primary key
- `user_id`: Foreign key → users
- `event_id`: Foreign key → events
- `check_in_time`: DateTime (when arrived)
- `check_out_time`: DateTime (when left, nullable)
- `latitude`, `longitude`: GPS at check-in

#### `matches`
- `id`: Primary key
- `event_id`: Foreign key → events
- `user_a_id`, `user_b_id`: Foreign keys → users
- `compatibility_score`: Float 0-100
- `proximity_overlap_minutes`: Integer
- `dimension_alignment`: JSON (breakdown by dimension)
- `status`: Enum (PENDING, ACCEPTED, REJECTED)
- `user_a_responded_at`, `user_b_responded_at`: DateTime

#### `connections`
- `id`: Primary key
- `match_id`: Foreign key → matches
- `user_a_id`, `user_b_id`: Foreign keys → users
- `event_id`: Foreign key → events
- `connection_nft_id`: Blockchain NFT token ID
- `transaction_hash`: Blockchain tx hash
- `ipfs_metadata_uri`: IPFS URI for NFT metadata
- `pesobytes_earned`: Integer (tokens earned)
- `created_at`: DateTime

---

## API Endpoints

### Authentication
- `POST /api/auth/wallet-login`: Wallet signature verification → JWT token
- `POST /api/auth/refresh`: Refresh JWT token

### Profiles
- `POST /api/profiles/onboard`: Create profile with AI analysis
- `GET /api/profiles/me`: Get authenticated user's profile
- `PUT /api/profiles/update`: Update profile dimensions/intentions
- `PUT /api/profiles/socials`: Update social media profiles
- `GET /api/profiles/socials/{wallet_address}`: Get user's social profiles (respects privacy)

### Events
- `GET /api/events/active`: Get active events near location
- `POST /api/events/checkin`: Check into event
- `POST /api/events/checkout`: Check out of event
- `GET /api/events/{event_id}`: Get event details

### Matches
- `GET /api/matches/pending`: Get pending matches for user
- `POST /api/matches/respond`: Accept or reject a match
- `GET /api/matches/history`: Past matches

### Connections
- `GET /api/connections`: Get confirmed connections
- `GET /api/connections/{id}`: Get connection details
- `GET /api/connections/{id}/nft`: Get NFT metadata

### AI Chat (Onboarding)
- `POST /api/chat/start`: Start AI personality conversation
- `POST /api/chat/message`: Send message, get AI response
- `POST /api/chat/complete`: Complete onboarding, create profile

---

## Frontend Structure

### Key Pages

#### Landing Page (`app/page.tsx`)
- Hero section with gradient background
- Connect wallet button (RainbowKit)
- Navigation to onboarding/profile/events
- Features showcase

#### Onboarding (`app/onboarding/page.tsx`)
- AI conversational chat interface
- Progress through 5 dimensions
- Personality trait visualization
- Profile creation confirmation

#### Profile Page (`app/profile/page.tsx`)
- Display 5 dimensions (radar chart or bars)
- Show intentions as tags
- Stats: connections made, $PESO earned
- Edit profile button

#### Events Page (`app/events/page.tsx`)
- List of active events nearby
- Event cards: venue, time, attendees
- Check-in button
- Past events history

#### Connections Page (`app/connections/page.tsx`)
- Pending matches feed
- Match cards: compatibility score, dimensions, accept/reject
- Accepted connections list
- Social profiles (if unlocked)
- "Follow All" button

### Web3 Configuration (`lib/wagmi.ts`)
```typescript
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { base, baseSepolia } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'VibeConnect',
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID',
  chains: [base, baseSepolia],
  // ...
});
```

### Root Layout (`app/layout.tsx`)
- Wraps app with RainbowKit providers
- Includes global styles
- PWA manifest link
- Font configuration

---

## Mobile App Structure

### Current State
- Basic Expo React Native app
- WalletConnect integration in `src/context/WalletContext.tsx`
- Main UI in `App.tsx`

### Planned Screens (see TODO.md)
- HomeScreen
- ProfileScreen
- EventsScreen
- EventDetailScreen
- CheckInScreen (QR scanner)
- ConnectionsScreen
- ConnectionDetailScreen
- CreateProfileScreen (AI onboarding)

### Navigation
- Will use React Navigation (not yet implemented)
- Bottom tabs: Home, Events, Connections, Profile
- Stack navigation for detail screens

### WalletConnect Integration
```tsx
import { WalletProvider } from './src/context/WalletContext';

export default function App() {
  return (
    <WalletProvider>
      {/* App content */}
    </WalletProvider>
  );
}
```

---

## Smart Contracts

### ProfileNFT.sol (Soulbound Token)
- **Purpose**: One per user, non-transferable identity NFT
- **Key Functions**:
  - `mint(address user)`: Mint profile NFT (owner only)
  - `tokenURI(uint256 tokenId)`: Returns IPFS metadata
- **Features**:
  - Soulbound (overrides transfer functions)
  - ERC721 standard
  - Metadata stored on IPFS

### ConnectionNFT.sol
- **Purpose**: Co-owned memory of connection between two users
- **Key Functions**:
  - `mintConnection(address userA, address userB, uint256 score, uint256 eventId)`: Mint connection NFT
  - `getConnection(uint256 tokenId)`: Get connection details
- **Features**:
  - Both users are co-owners
  - Stores compatibility score, event ID
  - Metadata includes event context

### PesoBytes.sol (ERC20 Token)
- **Purpose**: Reward token for making authentic connections
- **Key Functions**:
  - `distributeReward(address userA, address userB, uint256 score)`: Distribute tokens
  - Standard ERC20: `transfer`, `balanceOf`, etc.
- **Reward Structure**:
  - Base reward: 10 PESO per connection
  - Bonus: +5 PESO if compatibility score ≥ 90
  - Both users receive equal reward

### Deployment

**Testnet** (Base Sepolia):
```bash
cd contracts
npm run deploy:base-sepolia
# Copy contract addresses to backend/.env
```

**Mainnet** (Base):
```bash
npm run deploy:base
# Verify on Basescan
npx hardhat verify --network base <CONTRACT_ADDRESS>
```

---

## Security Practices

### Secret Management

**CRITICAL**: This project uses encrypted secret storage to work safely with AI assistants.

#### Safe to Share with AI
✅ `.encrypted/secrets.json` - Contains only encrypted values
✅ `.env.example` - Template files
✅ Code, configuration files
✅ Deployed contract addresses

#### NEVER Share with AI
❌ `.env` files - Contains actual secrets
❌ `~/.vibeconnect-key` - Encryption key
❌ Private keys, API keys in plain text
❌ Output from decrypt commands

### Secret Workflow

```bash
# Initial setup
./scripts/setup-dev.sh

# Update secrets
node scripts/encrypt-secrets.js setup

# Regenerate .env files
node scripts/encrypt-secrets.js decrypt

# View secrets (masked)
node scripts/encrypt-secrets.js show
```

### If Secret Exposed

1. **Immediately rotate** the exposed secret (new API key, new password)
2. Update: `node scripts/encrypt-secrets.js setup`
3. If committed to git, consider repository compromised → rotate ALL secrets
4. Never use `git revert` - secrets remain in history

### Smart Contract Security

- Use dedicated deployment wallet (not personal wallet)
- Test on Sepolia before mainnet
- Verify contracts on Basescan
- Limit testnet wallet funds
- Consider professional audit before mainnet launch

---

## Common Development Tasks

### Adding a New API Endpoint

1. **Define Pydantic models** in route file or `app/schemas.py`
2. **Create route handler** in `app/routers/{resource}.py`
3. **Add business logic** to service if complex
4. **Test** with FastAPI docs (`/docs`) or curl
5. **Update** this documentation

Example:
```python
# app/routers/profiles.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from pydantic import BaseModel

router = APIRouter(prefix="/api/profiles", tags=["profiles"])

class UpdateProfileRequest(BaseModel):
    bio: str

@router.put("/bio")
def update_bio(request: UpdateProfileRequest, db: Session = Depends(get_db)):
    # Implementation
    return {"success": True}
```

### Adding a Frontend Page

1. **Create page file**: `frontend/app/{route}/page.tsx`
2. **Add 'use client'** if using hooks/state
3. **Import components**: RainbowKit, Wagmi hooks, etc.
4. **Style with Tailwind**
5. **Link from navigation**

Example:
```tsx
// frontend/app/settings/page.tsx
'use client';

import { useAccount } from 'wagmi';

export default function SettingsPage() {
  const { address } = useAccount();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 to-black p-8">
      <h1 className="text-4xl font-bold text-white mb-6">Settings</h1>
      {/* Content */}
    </div>
  );
}
```

### Running Database Migrations

```bash
cd backend

# Create migration script in migrations/
# Example: migrations/002_add_new_field.sql

# Apply migration manually with psql
psql vibeconnect < migrations/002_add_new_field.sql

# Or use Alembic (if integrated in future)
alembic upgrade head
```

### Deploying Smart Contracts

```bash
cd contracts

# Ensure .env has PRIVATE_KEY and RPC_URL

# Deploy to testnet
npm run deploy:base-sepolia

# Verify on BaseScan
npx hardhat verify --network baseSepolia <CONTRACT_ADDRESS>

# Update backend/.env with new addresses
# Update frontend/lib/wagmi.ts with new addresses
```

### Testing Locally

**Backend**:
```bash
cd backend
pytest
# Or test specific file
pytest tests/test_matching.py
```

**Frontend**:
```bash
cd frontend
npm run lint
npm run build  # Check for build errors
```

**Contracts**:
```bash
cd contracts
npx hardhat test
npx hardhat test --grep "ProfileNFT"  # Test specific contract
```

---

## Testing Guidelines

### Backend Testing
- Use `pytest` for unit and integration tests
- Mock external services (OpenAI, Web3)
- Test database operations with test database
- Test authentication flows
- Test matching algorithm edge cases

### Frontend Testing
- Test wallet connection flows manually
- Test responsive design on mobile/desktop
- Test with different wallets (Coinbase Wallet, MetaMask)
- Test error states (no wallet, wrong network)

### Smart Contract Testing
- Write Hardhat tests in JavaScript/TypeScript
- Test access control (only owner can mint)
- Test edge cases (zero address, duplicate mints)
- Test gas usage
- Test events are emitted correctly

### Integration Testing
- Test full user flows end-to-end
- Test at real events with multiple users
- Test NFT minting on testnet
- Monitor gas costs
- Test API rate limits

---

## Deployment

### Current Deployment Status (as of Jan 2026)
- **Backend**: Not yet deployed (local only)
- **Frontend**: Not yet deployed (local only)
- **Contracts**: Not yet deployed to testnet
- **Database**: Local PostgreSQL only

### Deployment Plan

#### Backend Deployment (Railway/Render Recommended)

**Railway**:
```bash
# Install CLI
npm i -g @railway/cli

# Login
railway login

# Initialize
cd backend
railway init

# Add PostgreSQL
railway add postgresql

# Set environment variables via Railway dashboard
# DATABASE_URL, OPENAI_API_KEY, BASE_RPC_URL, etc.

# Deploy
railway up
```

#### Frontend Deployment (Vercel Recommended)

**Vercel**:
```bash
# Install CLI
npm i -g vercel

# Deploy
cd frontend
vercel

# Production deployment
vercel --prod
```

Update environment variables in Vercel dashboard if needed.

#### Database Migration (Production)
1. Create managed PostgreSQL instance (Railway, Supabase, etc.)
2. Run migrations from `backend/migrations/`
3. Update `DATABASE_URL` in backend environment
4. Test connection

#### Smart Contracts (Base Mainnet)
1. Ensure deployment wallet has real ETH on Base
2. Update `.env` with mainnet RPC
3. Deploy: `npm run deploy:base`
4. Verify on BaseScan
5. Update backend/frontend with mainnet addresses
6. Test thoroughly before using

---

## AI Assistant Conventions

### When Working on This Codebase

#### DO:
- ✅ Use encrypted secrets (`scripts/encrypt-secrets.js`)
- ✅ Read existing code before creating new files
- ✅ Follow established patterns (see Key Files & Patterns)
- ✅ Update TODO.md as tasks are completed
- ✅ Test changes locally before committing
- ✅ Use TypeScript strict mode
- ✅ Write descriptive commit messages
- ✅ Document new endpoints/features
- ✅ Ask clarifying questions if requirements unclear

#### DON'T:
- ❌ Never commit `.env` files
- ❌ Never request or display unencrypted secrets
- ❌ Don't create duplicate functionality (check existing code first)
- ❌ Don't use outdated dependencies
- ❌ Don't skip testing
- ❌ Don't break existing functionality
- ❌ Don't ignore security best practices
- ❌ Don't deploy to mainnet without thorough testing

### Code Style

**Python** (Backend):
- Follow PEP 8
- Use type hints
- Docstrings for functions/classes
- Keep functions focused and small
- Use services for business logic

**TypeScript** (Frontend/Mobile):
- Use explicit types (avoid `any`)
- Functional components with hooks
- Extract reusable components
- Keep components under 200 lines
- Use async/await over promises

**Solidity** (Contracts):
- Follow Solidity style guide
- Use OpenZeppelin when possible
- Emit events for state changes
- Add NatSpec comments
- Optimize gas usage

### Git Workflow

1. **Branch naming**: `feature/description` or `fix/description`
2. **Commits**: Clear, descriptive messages
   - Good: "Add social profiles API endpoint with privacy controls"
   - Bad: "Update code"
3. **Pull requests**: Include description, testing notes
4. **Never force push** to main branch

### Communication with User

- Ask clarifying questions if task is ambiguous
- Explain what you're doing and why
- Surface potential issues or tradeoffs
- Suggest improvements when relevant
- Provide testing instructions

### Current Development Priorities (Jan 2026)

From `TODO.md`, current priorities are:
1. **Social Profiles UI** - Frontend/backend integration
2. **Enhanced Connections Feed** - Improved UX
3. **Mobile Navigation** - React Navigation setup
4. **Profile Creation Screen** - AI onboarding flow
5. **Deploy Smart Contracts** - Base Sepolia testnet

See `TODO.md` for detailed task breakdown.

---

## Quick Reference

### Start Development Servers

```bash
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python main.py

# Terminal 2 - Frontend
cd frontend
npm run dev

# Terminal 3 - Mobile (optional)
cd mobile
npm start
```

### Important URLs
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- Frontend: http://localhost:3000
- Base Sepolia Explorer: https://sepolia.basescan.org
- Base Mainnet Explorer: https://basescan.org

### Key Commands

```bash
# Backend
python main.py                    # Start server
pytest                            # Run tests
pip freeze > requirements.txt     # Update deps

# Frontend
npm run dev                       # Dev server
npm run build                     # Build production
npm run lint                      # Lint code

# Contracts
npm run compile                   # Compile Solidity
npm run deploy:base-sepolia       # Deploy testnet
npx hardhat test                  # Run tests

# Mobile
npm start                         # Expo dev server
npm run android                   # Android emulator
npm run ios                       # iOS simulator
```

### Environment Files

- `backend/.env` - Backend secrets (generated from encrypted)
- `contracts/.env` - Contract deployment keys (generated)
- `frontend/` - No .env needed (uses public config)
- `.encrypted/secrets.json` - Encrypted secrets (SAFE to share)
- `~/.vibeconnect-key` - Encryption key (NEVER share)

---

## Additional Resources

- **Architecture**: See `ARCHITECTURE.md` for detailed diagrams
- **Security**: See `SECURITY.md` for security practices
- **Deployment**: See `DEPLOYMENT.md` for deployment guide
- **Tasks**: See `TODO.md` for current development tasks
- **Main README**: See `README.md` for project overview

### External Documentation
- FastAPI: https://fastapi.tiangolo.com
- Next.js: https://nextjs.org/docs
- RainbowKit: https://rainbowkit.com
- Wagmi: https://wagmi.sh
- Hardhat: https://hardhat.org
- OpenZeppelin: https://docs.openzeppelin.com
- Base: https://docs.base.org

---

## Changelog

### 2026-01-01
- Initial CLAUDE.md creation
- Documented full repository structure
- Added comprehensive development guides
- Included security practices for AI assistant collaboration

---

**Questions or Issues?**

If you encounter issues or have questions:
1. Check this documentation first
2. Review `ARCHITECTURE.md`, `SECURITY.md`, `DEPLOYMENT.md`
3. Check `TODO.md` for known issues/planned work
4. Ask the human developer for clarification

**Remember**: When in doubt, ask before making major changes!
