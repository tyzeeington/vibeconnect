# VibeConnect - Deployment Preparation Checklist

**Created:** January 21, 2026
**Branch:** `claude/prepare-deployment-HsoUy`
**Status:** Backend deployed, final configuration needed

---

## 🎯 Deployment Status Overview

### ✅ Already Deployed
- **Backend API**: Railway (`https://vibeconnect-production.up.railway.app`)
- **PostgreSQL Database**: Railway (connected)
- **Core Features**: 12/13 tasks completed (92%)

### ⚠️ Deployment Blockers
1. Smart contracts not deployed (needs Base Sepolia ETH)
2. Frontend not deployed (Vercel configuration issues)
3. JWT secret not set on Railway
4. Database migrations pending
5. Redis not deployed (chat sessions in RAM)

---

## 📋 Critical Pre-Deployment Tasks

### Task 1: Generate and Set JWT Secret Key 🔴 CRITICAL
**Priority:** CRITICAL | **Time:** 5 minutes | **Status:** ⏳ Pending

**Why:** Backend authentication requires JWT secret, currently missing from Railway environment.

**Steps:**
```bash
# 1. Generate secure JWT secret
cd backend
python scripts/generate_jwt_secret.py

# Output will be: SECRET_KEY=<your-generated-key>

# 2. Add to Railway:
# - Go to Railway dashboard
# - Select your backend service
# - Click "Variables" tab
# - Add new variable:
#   Name: SECRET_KEY
#   Value: <paste generated key>
# - Click "Add"
# - Railway will automatically redeploy

# 3. Verify deployment
curl https://vibeconnect-production.up.railway.app/health
```

**Documentation:** `backend/docs/JWT_SETUP.md`

---

### Task 2: Deploy Redis for Chat Sessions 🔴 HIGH
**Priority:** HIGH | **Time:** 10 minutes | **Status:** ⏳ Pending

**Why:** Chat sessions currently stored in RAM, will reset on restart.

**Steps:**
```bash
# 1. Add Redis to Railway:
# - In Railway dashboard, click "New"
# - Select "Database"
# - Choose "Redis"
# - Railway will auto-provision

# 2. Connect Redis to backend:
# - Railway automatically adds REDIS_URL variable
# - Verify variable exists in backend service

# 3. Redeploy backend (automatic)

# 4. Test Redis connection:
curl -X POST https://vibeconnect-production.up.railway.app/api/chat/start \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "0x123..."}'
```

**Code:** Redis integration already implemented in `backend/app/services/session_service.py`

---

### Task 3: Run Database Migrations 🟠 HIGH
**Priority:** HIGH | **Time:** 15 minutes | **Status:** ⏳ Pending

**Why:** New features (expired matches, device tokens, profile pictures) need schema updates.

**Migration Files:**
1. `backend/migrations/002_add_expired_status.sql` - Adds EXPIRED status to matches
2. `backend/migrations/003_add_device_token.sql` - Adds push notification support
3. `backend/migrations/003_add_profile_picture.sql` - Adds profile picture storage

**Steps:**

**Option A: Railway Dashboard (Recommended)**
```bash
# 1. Get Railway PostgreSQL connection details
# Railway Dashboard → Database → Connect → Copy connection string

# 2. For each migration file, copy contents and execute:
# - Go to Railway Dashboard
# - Click on PostgreSQL database
# - Click "Query" tab
# - Paste migration SQL
# - Click "Execute"

# Migration order:
# 1. 002_add_expired_status.sql
# 2. 003_add_device_token.sql
# 3. 003_add_profile_picture.sql
```

**Option B: Railway CLI**
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Link to project
railway link

# 4. Connect to database
railway run psql $DATABASE_URL

# 5. Run migrations
\i backend/migrations/002_add_expired_status.sql
\i backend/migrations/003_add_device_token.sql
\i backend/migrations/003_add_profile_picture.sql

# 6. Verify
\d+ matches
\d+ user_profiles
```

**Verification:**
```sql
-- Check EXPIRED status exists
SELECT enumlabel
FROM pg_enum
WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'matchstatus');
-- Should show: pending, accepted, rejected, expired

-- Check new columns exist
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'user_profiles'
  AND column_name IN ('device_token', 'profile_picture_cid');
```

---

### Task 4: Deploy Smart Contracts to Base Sepolia 🟠 HIGH
**Priority:** HIGH | **Time:** 1-2 hours | **Status:** ⏳ Needs testnet ETH

**Why:** NFT minting won't work without deployed contracts.

**Prerequisites:**
- Base Sepolia ETH (from faucet)
- Deployment wallet with private key

**Steps:**

**4.1. Get Base Sepolia Testnet ETH**
```bash
# Visit one of these faucets:
# 1. Coinbase Faucet (recommended): https://www.coinbase.com/faucets/base-sepolia-faucet
# 2. Alchemy: https://www.alchemy.com/faucets/base-sepolia
# 3. Base Official: https://docs.base.org/docs/tools/network-faucets/

# Request 0.5 ETH to your deployment wallet address
# Check balance on BaseScan: https://sepolia.basescan.org/address/<your-wallet>
```

**4.2. Configure Deployment**
```bash
cd contracts

# Create .env file
cp .env.example .env

# Edit .env and add:
# PRIVATE_KEY=<your-deployment-wallet-private-key>
# BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
# BASESCAN_API_KEY=<optional-for-verification>
```

**4.3. Install Dependencies**
```bash
npm install
```

**4.4. Deploy Contracts**
```bash
# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia

# Expected output:
# ProfileNFT deployed to: 0x...
# ConnectionNFT deployed to: 0x...
# PesoBytes deployed to: 0x...

# Save these addresses!
```

**4.5. Verify Contracts (Optional)**
```bash
# Verify each contract on BaseScan
npx hardhat verify --network baseSepolia <PROFILE_NFT_ADDRESS>
npx hardhat verify --network baseSepolia <CONNECTION_NFT_ADDRESS>
npx hardhat verify --network baseSepolia <PESOBYTES_ADDRESS>
```

**4.6. Copy ABIs**
```bash
# Copy contract ABIs to backend and frontend
chmod +x scripts/copy-abis.sh
./scripts/copy-abis.sh

# This copies:
# - artifacts/contracts/*.sol/*.json → backend/app/abis/
# - artifacts/contracts/*.sol/*.json → frontend/src/abis/
```

**4.7. Update Railway Environment**
```bash
# Add to Railway backend environment variables:
PROFILE_NFT_CONTRACT=<ProfileNFT address>
CONNECTION_NFT_CONTRACT=<ConnectionNFT address>
PESOBYTES_CONTRACT=<PesoBytes address>
BASE_RPC_URL=https://sepolia.base.org

# Railway will auto-redeploy
```

**4.8. Test NFT Minting**
```bash
# Test profile NFT mint
curl -X POST https://vibeconnect-production.up.railway.app/api/profiles/ \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x123...",
    "interests": ["music", "art"],
    "vibe": "chill",
    "social_profiles": {"instagram": "@test"}
  }'

# Check transaction on BaseScan
# Verify NFT appears in wallet
```

**Documentation:**
- `contracts/DEPLOYMENT_CHECKLIST.md`
- `contracts/DEPLOYMENT_GUIDE.md`
- `contracts/DEPLOY_NOW.md`

---

### Task 5: Fix Frontend Deployment on Vercel 🟠 HIGH
**Priority:** HIGH | **Time:** 30 minutes | **Status:** ⏳ Pending

**Why:** Users need web interface to access the app.

**Current Issue:** Vercel build configuration needs adjustment for monorepo structure.

**Steps:**

**5.1. Check Current Frontend Build**
```bash
cd frontend

# Test build locally
npm install
npm run build

# If errors, fix them first
npm run lint
```

**5.2. Deploy to Vercel**
```bash
# Option A: Vercel CLI (Recommended)
npm i -g vercel
cd frontend
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set root directory: frontend
# - Override build command: npm run build
# - Override output directory: .next

# Option B: GitHub Integration
# - Go to vercel.com
# - Import GitHub repo
# - Configure:
#   Root Directory: frontend
#   Build Command: npm run build
#   Output Directory: .next
```

**5.3. Configure Environment Variables on Vercel**
```bash
# In Vercel Dashboard → Settings → Environment Variables

NEXT_PUBLIC_API_URL=https://vibeconnect-production.up.railway.app
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a3daa77487c8eb6cc5f861ef4d01f6fa
NEXT_PUBLIC_PROFILE_NFT_CONTRACT=<from-contract-deployment>
NEXT_PUBLIC_CONNECTION_NFT_CONTRACT=<from-contract-deployment>
NEXT_PUBLIC_PESOBYTES_CONTRACT=<from-contract-deployment>
```

**5.4. Update Backend CORS**
```bash
# After Vercel deployment, get your URL (e.g., vibeconnect.vercel.app)
# Update backend/main.py CORS settings to include it

# This should already be in production mode, verify:
# Railway environment has: ENVIRONMENT=production
# And FRONTEND_URL=https://<your-vercel-url>
```

**5.5. Test Frontend**
```bash
# Visit your Vercel URL
# Test:
# 1. Wallet connection
# 2. Profile creation
# 3. Event check-in
# 4. Matching flow
```

---

## 🎯 Optional Enhancements

### Task 6: Enable Firebase Push Notifications (Optional)
**Priority:** MEDIUM | **Time:** 1 hour | **Status:** ⏳ Optional

**Why:** Better user engagement with real-time notifications.

**Steps:**
```bash
# 1. Create Firebase project:
# - Go to https://console.firebase.google.com
# - Click "Add project"
# - Name: "VibeConnect"

# 2. Download credentials:
# - Project Settings → Service Accounts
# - Generate new private key
# - Download JSON file

# 3. Add to Railway:
# - Upload firebase-credentials.json to Railway
# - Or add FIREBASE_CREDENTIALS environment variable with JSON content

# 4. Redeploy backend

# 5. Test notification:
curl -X POST https://vibeconnect-production.up.railway.app/api/matches/test-notification \
  -H "Authorization: Bearer <token>"
```

**Documentation:** `backend/docs/FIREBASE_SETUP.md`

---

### Task 7: Add Mapbox Token for Events Map (Optional)
**Priority:** MEDIUM | **Time:** 15 minutes | **Status:** ⏳ Optional

**Why:** Enable interactive event discovery map.

**Steps:**
```bash
# 1. Sign up for Mapbox:
# - Go to https://www.mapbox.com
# - Create free account (50k map loads/month free)

# 2. Get access token:
# - Dashboard → Access Tokens
# - Copy default public token

# 3. Add to Vercel:
# - Vercel Dashboard → Settings → Environment Variables
# - Add: NEXT_PUBLIC_MAPBOX_TOKEN=<your-token>

# 4. Redeploy frontend

# Map will automatically enable when token is present
```

**Documentation:** `frontend/EVENTS_MAP_SETUP.md`

---

## 🚀 Deployment Execution Order

**Phase 1: Critical Backend Setup (30 minutes)**
1. ✅ Generate and add JWT secret to Railway
2. ✅ Deploy Redis on Railway
3. ✅ Run database migrations (all 3 files)
4. ✅ Verify backend health check

**Phase 2: Blockchain Setup (1-2 hours)**
5. ✅ Get Base Sepolia ETH from faucet
6. ✅ Deploy smart contracts
7. ✅ Verify contracts on BaseScan
8. ✅ Copy ABIs and update Railway environment
9. ✅ Test NFT minting

**Phase 3: Frontend Deployment (30 minutes)**
10. ✅ Fix any frontend build issues
11. ✅ Deploy to Vercel
12. ✅ Configure environment variables
13. ✅ Update backend CORS for Vercel URL
14. ✅ Test full end-to-end flow

**Phase 4: Optional Enhancements (1-2 hours)**
15. ⏸️ Set up Firebase push notifications
16. ⏸️ Add Mapbox token for events map
17. ⏸️ Configure custom domain
18. ⏸️ Set up monitoring (Sentry, LogRocket)

---

## ✅ Deployment Verification Checklist

After completing all tasks, verify:

### Backend Health
- [ ] `/health` endpoint returns 200 OK
- [ ] JWT authentication works
- [ ] Redis connection active
- [ ] Database migrations applied
- [ ] CORS allows frontend domain

### Smart Contracts
- [ ] All 3 contracts deployed to Base Sepolia
- [ ] Contracts verified on BaseScan
- [ ] ABIs copied to backend/frontend
- [ ] Test mint succeeds
- [ ] Transaction visible on BaseScan

### Frontend
- [ ] Build succeeds without errors
- [ ] Deployed on Vercel
- [ ] Environment variables set
- [ ] Can connect wallet
- [ ] Can create profile
- [ ] Can check into events
- [ ] Can see matches

### End-to-End Flow
- [ ] User A creates profile → NFT minted
- [ ] User B creates profile → NFT minted
- [ ] Both check into event
- [ ] Match generated (73%+ compatibility)
- [ ] User A accepts → Connection created
- [ ] Connection NFT minted
- [ ] Both users receive $PESO
- [ ] Social profiles visible

---

## 🆘 Troubleshooting

### Backend Issues

**JWT Secret Error**
```bash
# Error: SECRET_KEY environment variable not set
# Solution: Complete Task 1
```

**Redis Connection Error**
```bash
# Error: REDIS_URL not found
# Solution: Complete Task 2, verify Redis deployed on Railway
```

**Database Migration Fails**
```bash
# Error: type "matchstatus" already exists
# Solution: Migration already run, skip or check current schema
```

### Contract Deployment Issues

**Insufficient Funds**
```bash
# Error: insufficient funds for gas
# Solution: Get more Base Sepolia ETH from faucet
```

**Network Error**
```bash
# Error: network baseSepolia not found
# Solution: Check hardhat.config.js has baseSepolia network configured
```

**ABI Copy Fails**
```bash
# Solution: Manually copy from artifacts/contracts/<ContractName>.sol/<ContractName>.json
# to backend/app/abis/ and frontend/src/abis/
```

### Frontend Issues

**Build Fails**
```bash
# Check errors in build log
npm run lint
npm run type-check

# Common fixes:
# - Update environment variables
# - Clear .next directory
# - Reinstall dependencies
```

**API Connection Error**
```bash
# Error: CORS policy blocked
# Solution: Update backend CORS in main.py to include Vercel URL
# Verify NEXT_PUBLIC_API_URL is correct
```

---

## 📊 Post-Deployment Monitoring

### Key Metrics to Watch

**Backend**
- Response times (p50, p95, p99)
- Error rate (should be < 1%)
- Database connection pool usage
- Redis memory usage

**Smart Contracts**
- Gas costs per transaction
- NFT mint success rate
- $PESO distribution

**Frontend**
- Page load times
- Wallet connection success rate
- User flow completion rate

### Recommended Tools
- Railway Logs (built-in)
- Vercel Analytics (built-in)
- BaseScan for contract monitoring
- Optional: Sentry for error tracking
- Optional: LogRocket for session replay

---

## 🎉 Success Criteria

Deployment is successful when:

✅ All backend endpoints return 2xx responses
✅ Database migrations applied without errors
✅ Redis sessions persist across backend restarts
✅ All 3 smart contracts deployed and verified
✅ NFT minting works on Base Sepolia
✅ Frontend deployed and accessible
✅ Wallet connection works
✅ Full connection flow works end-to-end
✅ No critical errors in logs

---

## 📚 Additional Resources

- **Backend Deployment**: `DEPLOYMENT_GUIDE.md`
- **Contract Deployment**: `contracts/DEPLOYMENT_CHECKLIST.md`
- **Security**: `SECURITY_AUDIT_REPORT.md`
- **Testing**: `TESTING_GUIDE.md`
- **API Reference**: `API_REFERENCE.md`

---

**Ready to deploy?** Follow the execution order above, starting with Phase 1.

For questions or issues, refer to the troubleshooting section or check the relevant documentation files.
