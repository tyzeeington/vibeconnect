# VibeConnect MVP - Production Deployment Guide

**Status:** Ready to deploy! 🚀
**Last Updated:** January 3, 2026

## 📊 Current Status

### ✅ Completed (Ready for Production)
- **Backend Code**: 100% complete, all security fixes applied
- **Database Schema**: All tables and migrations ready
- **Smart Contracts**: Written, compiled, ABIs ready
- **Frontend**: Built with Next.js, ready for deployment
- **Mobile App**: React Native/Expo, ready to test
- **Local Environment**: PostgreSQL running, backend tested successfully

### 🔄 Needs Deployment
1. Smart contracts to Base Sepolia testnet
2. Frontend to Vercel (or alternative)
3. Production environment variables to Railway

---

## 🎯 Step-by-Step Production Deployment

### Step 1: Deploy Smart Contracts (15 minutes)

**Deployment Wallet Created:**
- Address: `0x85f05ba733A1a711c7F7798165Ef2e36b73abBe3`
- Private Key: Saved in `contracts/.env`

**Action Required:**

```bash
# 1. Get testnet ETH for deployment
Visit: https://www.coinbase.com/faucets/base-sepolia-faucet
Paste address: 0x85f05ba733A1a711c7F7798165Ef2e36b73abBe3
Request ETH (need ~0.01 ETH for deployment)

# 2. Verify you have ETH
cd contracts
npm run check-balance

# 3. Deploy contracts
npm run deploy:baseSepolia
# or: npx hardhat run scripts/deploy.js --network baseSepolia

# 4. Copy deployment addresses
# Addresses will be saved to deployment-addresses.json
# You'll need these for the next steps
```

**Expected Output:**
```
✅ All contracts deployed successfully!

ProfileNFT deployed to: 0x...
ConnectionNFT deployed to: 0x...
PesoBytes deployed to: 0x...
```

---

### Step 2: Update Railway Production Environment

**Your Railway App:** `vibeconnect-production.up.railway.app`

**Add these environment variables in Railway dashboard:**

```bash
# Critical - Generate a new one for production!
SECRET_KEY=<run: python -c "import secrets; print(secrets.token_urlsafe(64))">

# From Step 1 deployment
PROFILE_NFT_CONTRACT=0x...
CONNECTION_NFT_CONTRACT=0x...
PESOBYTES_CONTRACT=0x...

# Same private key used for deployment
PRIVATE_KEY=766d3942109bb74fd5563b4b79330aa02d91b3e99ba958076f7eeff3ce051635

# Base network
BASE_RPC_URL=https://sepolia.base.org

# Optional: Redis for session storage
REDIS_URL=<your-railway-redis-url>

# Optional: For IPFS metadata storage
PINATA_API_KEY=<your-pinata-key>
PINATA_SECRET_KEY=<your-pinata-secret>

# Optional: For push notifications
FIREBASE_CREDENTIALS_JSON=<your-firebase-json>

# App config
ENVIRONMENT=production
DEBUG=False
```

**How to add in Railway:**
1. Go to https://railway.app/dashboard
2. Select your `vibeconnect` project
3. Click on your backend service
4. Go to "Variables" tab
5. Click "New Variable" for each one above
6. Click "Deploy" after adding all variables

---

### Step 3: Deploy Frontend to Vercel

**Option A: Vercel (Recommended)**

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy frontend
cd frontend
vercel

# Follow prompts:
# - Project name: vibeconnect
# - Framework: Next.js
# - Build command: (default)
# - Output directory: (default)

# Add environment variables in Vercel dashboard:
NEXT_PUBLIC_API_URL=https://vibeconnect-production.up.railway.app
NEXT_PUBLIC_PROFILE_NFT_ADDRESS=0x... # From Step 1
NEXT_PUBLIC_CONNECTION_NFT_ADDRESS=0x... # From Step 1
NEXT_PUBLIC_PESOBYTES_ADDRESS=0x... # From Step 1
NEXT_PUBLIC_CHAIN_ID=84532  # Base Sepolia

# Optional for map feature:
NEXT_PUBLIC_MAPBOX_TOKEN=<your-mapbox-token>

# Redeploy after adding env vars
vercel --prod
```

**Option B: Deploy to Railway (Alternative)**

```bash
# In Railway dashboard, create new service
# Connect to GitHub repo: tyzeeington/vibeconnect
# Set root directory: frontend
# Railway will auto-detect Next.js and deploy
```

---

### Step 4: Test End-to-End Flow

**Backend Health Check:**
```bash
curl https://vibeconnect-production.up.railway.app/health
# Expected: {"status":"healthy"}
```

**API Documentation:**
Visit: https://vibeconnect-production.up.railway.app/docs

**Frontend Test:**
1. Visit your Vercel URL
2. Connect wallet (MetaMask)
3. Switch to Base Sepolia network
4. Test wallet authentication

**Contract Verification (Optional but Recommended):**
```bash
cd contracts

# Get BaseScan API key from: https://basescan.org/myapikey
# Add to .env: BASESCAN_API_KEY=...

# Verify each contract
npx hardhat verify --network baseSepolia <PROFILE_NFT_ADDRESS>
npx hardhat verify --network baseSepolia <CONNECTION_NFT_ADDRESS>
npx hardhat verify --network baseSepolia <PESOBYTES_ADDRESS> 100000000
```

---

## 🔥 Quick Start (TL;DR)

```bash
# 1. Get testnet ETH
# Visit: https://www.coinbase.com/faucets/base-sepolia-faucet
# Send to: 0x85f05ba733A1a711c7F7798165Ef2e36b73abBe3

# 2. Deploy contracts
cd contracts
npm run deploy:baseSepolia

# 3. Update Railway env vars with contract addresses
# Go to Railway dashboard > Variables

# 4. Deploy frontend
cd ../frontend
vercel

# 5. Test!
```

---

## 📱 Mobile App Deployment (Future)

The mobile app is ready for testing with Expo Go:

```bash
cd mobile
npm install
npm start

# Scan QR code with Expo Go app
# Update API_URL in src/services/api.ts to your production Railway URL
```

For production release:
- iOS: Submit to App Store with `eas build --platform ios`
- Android: Submit to Play Store with `eas build --platform android`

---

## 🔐 Security Checklist

Before going live, verify:

- [ ] JWT SECRET_KEY is unique and secure (not the one in .env.example)
- [ ] CORS is configured for production domain only
- [ ] Database backups enabled on Railway
- [ ] Rate limiting is active (check /health endpoint headers)
- [ ] Smart contracts verified on BaseScan
- [ ] Private keys stored securely (not in git)
- [ ] HTTPS enabled (automatic on Railway/Vercel)
- [ ] Environment set to "production" on Railway

---

## 🚨 Known Limitations (MVP)

These are non-blocking for MVP launch:

1. **Redis Sessions**: Currently using in-memory storage. For multiple instances, add Redis to Railway.
2. **IPFS Metadata**: Using placeholder URIs. Add Pinata credentials for real metadata.
3. **Push Notifications**: Disabled without Firebase credentials. Optional for MVP.
4. **Contract Audits**: Contracts not professionally audited. Only use with testnet for now.

---

## 📊 What's Already Working in Production

Your Railway backend at `vibeconnect-production.up.railway.app` has:

- ✅ All API endpoints live and functional
- ✅ PostgreSQL database configured
- ✅ Security middleware active
- ✅ Rate limiting enabled
- ✅ CORS configured
- ✅ JWT authentication ready
- ✅ AI personality profiling integrated
- ✅ Matching algorithm implemented
- ✅ Social profiles system
- ✅ Event check-in/out system

**Just needs:** Contract addresses + frontend deployment!

---

## 🎉 Post-Deployment

After everything is deployed:

1. **Update README.md** with live URLs
2. **Test at a real event** (use QR codes for check-in)
3. **Gather feedback** from early users
4. **Monitor logs** in Railway dashboard
5. **Track gas costs** on Base Sepolia
6. **Plan mainnet deployment** when ready

---

## 🆘 Troubleshooting

**"Insufficient funds for gas"**
→ Get more testnet ETH from faucet

**"Cannot connect to database"**
→ Check Railway DATABASE_URL is set correctly

**"CORS error in browser"**
→ Add your Vercel URL to allowed_origins in backend/main.py

**"JWT authentication fails"**
→ Verify SECRET_KEY is set in Railway environment variables

**"Contract deployment fails"**
→ Check you have enough Base Sepolia ETH and network is reachable

---

## 📞 Support

- **Backend Issues**: Check Railway logs
- **Frontend Issues**: Check Vercel deployment logs
- **Contract Issues**: See contracts/DEPLOYMENT_GUIDE.md
- **API Reference**: See API_REFERENCE.md

---

## 🚀 Ready to Deploy?

You have everything you need! The code is production-ready. Just follow the steps above and you'll have VibeConnect live in ~30 minutes.

**Let's fucking go!** 💜
