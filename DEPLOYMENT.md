# VibeConnect Deployment Guide

## 🎯 3-Month Launch Plan

### Month 1: Backend + Smart Contracts (January 2025)
**Goal:** Get the core infrastructure running

#### Week 1: Local Development Setup
```bash
# 1. Clone and setup backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# 2. Setup PostgreSQL
createdb vibeconnect
psql vibeconnect

# 3. Configure environment
cp .env.example .env
# Edit .env with your keys:
# - DATABASE_URL
# - OPENAI_API_KEY
# - POLYGON_RPC_URL (get from Alchemy)

# 4. Test the server
python main.py
# Visit http://localhost:8000/docs
```

#### Week 2: Smart Contracts
```bash
# 1. Setup Hardhat
cd contracts
npm install

# 2. Get Polygon Mumbai testnet MATIC
# Visit https://faucet.polygon.technology/
# Send test MATIC to your wallet

# 3. Deploy contracts
npm run deploy:mumbai

# 4. Update backend .env with contract addresses
# Copy from deployment-addresses.json
```

#### Week 3: Implement API Endpoints
- Complete auth router (wallet signature verification)
- Complete events router (check-in/out logic)
- Complete matches router (matching algorithm integration)
- Complete connections router (NFT minting)

#### Week 4: Testing
- Test AI personality analysis
- Test matching algorithm with mock data
- Test NFT minting on Mumbai testnet
- Manual API testing with Postman/curl

### Month 2: Mobile App (February 2025)
**Goal:** Build the user-facing app

#### Week 1: React Native Setup
```bash
# 1. Initialize React Native project
npx react-native init VibeConnectApp
cd VibeConnectApp

# 2. Install dependencies
npm install @react-navigation/native
npm install @walletconnect/react-native-compat
npm install ethers
npm install axios

# 3. Setup WalletConnect
# Follow: https://docs.walletconnect.com/
```

#### Week 2: Core Screens
- Wallet connection screen
- Onboarding flow (AI chat)
- Profile screen (5 dimensions + intentions)
- Event check-in screen
- Match feed (swipe to accept/reject)

#### Week 3: Blockchain Integration
- Connect to Polygon
- Read profile NFT
- Display connection NFTs
- Show $PESO balance

#### Week 4: Testing at Real Events
- Test at 2-3 events in NYC
- Get feedback from 10-20 users
- Fix bugs and UX issues

### Month 3: Launch (March 2025)
**Goal:** Production deployment and public launch

#### Week 1: Mainnet Deployment
```bash
# 1. Deploy contracts to Polygon mainnet
npm run deploy:polygon

# 2. Update production backend with mainnet addresses

# 3. Deploy backend to cloud
# Options:
# - Railway.app (easiest)
# - Render.com
# - DigitalOcean
# - AWS/GCP (if you want more control)
```

#### Week 2: Final Polish
- UI/UX improvements
- Performance optimization
- Error handling
- Analytics setup (Mixpanel/Amplitude)

#### Week 3: Beta Launch
- Launch to friends and NYC scene
- Get 100 users on the platform
- Host a launch event (your DJ set?)
- Collect feedback

#### Week 4: Public Launch
- Submit to App Store / Play Store
- Social media announcement
- Press release (if desired)
- Monitor and iterate

## 🚀 Quick Deploy Commands

### Backend (Railway.app - Recommended)
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
cd backend
railway init

# 4. Add PostgreSQL
railway add postgresql

# 5. Set environment variables
railway variables set OPENAI_API_KEY=sk-...
railway variables set POLYGON_RPC_URL=https://...
# ... set all other variables

# 6. Deploy
railway up
```

### Smart Contracts (Polygon Mainnet)
```bash
cd contracts

# 1. Ensure you have real MATIC in your deployment wallet

# 2. Update .env with mainnet RPC
POLYGON_RPC_URL=https://polygon-mainnet.g.alchemy.com/v2/YOUR_KEY

# 3. Deploy
npm run deploy:polygon

# 4. Verify on PolygonScan
npx hardhat verify --network polygon <CONTRACT_ADDRESS>
```

## 🔧 Production Checklist

### Security
- [ ] Never commit .env files
- [ ] Use environment variables for all secrets
- [ ] Enable CORS only for your domains
- [ ] Add rate limiting to API
- [ ] Implement proper JWT authentication
- [ ] Audit smart contracts (if budget allows)

### Monitoring
- [ ] Setup error tracking (Sentry)
- [ ] Setup uptime monitoring (UptimeRobot)
- [ ] Setup analytics (Mixpanel)
- [ ] Database backups configured
- [ ] Log aggregation (LogTail, Papertrail)

### Performance
- [ ] Database indexes on frequently queried fields
- [ ] Redis caching for hot data
- [ ] CDN for static assets
- [ ] API response time < 200ms
- [ ] Mobile app bundle size < 50MB

### Legal
- [ ] Privacy policy
- [ ] Terms of service
- [ ] GDPR compliance (if serving EU users)
- [ ] Age verification (13+ or 18+?)

## 📊 Success Metrics

### Month 1
- API endpoints functional
- Smart contracts deployed to testnet
- 100% unit test coverage

### Month 2
- Mobile app working end-to-end
- 10 beta testers providing feedback
- 50+ test connections made

### Month 3
- 100+ active users
- 500+ connections made
- 5,000+ $PESO distributed
- App Store/Play Store approved

## 🆘 Troubleshooting

### "Database connection failed"
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in .env
- Create database: `createdb vibeconnect`

### "OpenAI API error"
- Verify API key is valid
- Check account has credits
- Review rate limits

### "Contract deployment failed"
- Ensure you have MATIC in deployment wallet
- Check RPC URL is correct
- Increase gas limit in hardhat.config.js

### "React Native build error"
- Clear cache: `npx react-native start --reset-cache`
- Clean build: `cd android && ./gradlew clean`
- Reinstall: `rm -rf node_modules && npm install`

## 📞 Need Help?

- OpenAI API: https://platform.openai.com/docs
- Polygon: https://docs.polygon.technology/
- Hardhat: https://hardhat.org/docs
- FastAPI: https://fastapi.tiangolo.com/
- React Native: https://reactnative.dev/docs

Good luck! You got this 🚀
