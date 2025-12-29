# VibeConnect Deployment Guide

This guide will walk you through deploying VibeConnect to production.

## Architecture

- **Frontend**: Next.js on Vercel
- **Backend**: FastAPI on Railway
- **Database**: PostgreSQL on Railway
- **Blockchain**: Base Sepolia (testnet)

## Prerequisites

1. GitHub account
2. Vercel account (sign up at vercel.com)
3. Railway account (sign up at railway.app)

---

## Step 1: Push to GitHub

```bash
# Create a new repository on GitHub (vibeconnect)
# Then run:

git add .
git commit -m "Initial commit - VibeConnect platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/vibeconnect.git
git push -u origin main
```

---

## Step 2: Deploy Backend to Railway

1. Go to https://railway.app
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `vibeconnect` repository
5. Railway will auto-detect the Python backend

### Configure Environment Variables on Railway:

Click on your service → Variables → Add these:

```
DATABASE_URL=<Railway will auto-provide this when you add PostgreSQL>
OPENAI_API_KEY=<your-openai-key>
BASE_RPC_URL=<your-alchemy-base-rpc-url>
SECRET_KEY=<generate-a-secure-random-key>
PRIVATE_KEY=<optional-for-now>
```

### Add PostgreSQL Database:

1. Click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically set `DATABASE_URL` in your backend service

### Get Your Backend URL:

After deployment, Railway gives you a URL like:
`https://vibeconnect-backend-production.up.railway.app`

**Save this URL** - you'll need it for the frontend!

---

## Step 3: Deploy Frontend to Vercel

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js

### Configure Build Settings:

- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

### Configure Environment Variables on Vercel:

```
NEXT_PUBLIC_API_URL=https://your-railway-backend-url.up.railway.app
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a3daa77487c8eb6cc5f861ef4d01f6fa
```

Replace `your-railway-backend-url` with the URL from Step 2.

### Deploy:

Click "Deploy" and Vercel will build your frontend!

Your frontend URL will be: `https://vibeconnect.vercel.app` (or similar)

---

## Step 4: Update CORS in Backend

After deployment, update the backend CORS settings to allow your Vercel domain:

In `backend/main.py`, update:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://vibeconnect.vercel.app",  # Your Vercel URL
        "http://localhost:3000"  # Keep for local dev
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

Commit and push this change - Railway will auto-deploy!

---

## Step 5: Test Your Deployment

1. Visit your Vercel URL (e.g., `https://vibeconnect.vercel.app`)
2. Connect your wallet
3. Try creating a profile
4. Verify the AI analysis works

---

## Step 6: Custom Domain (Optional)

### For Vercel (Frontend):
1. Go to Project Settings → Domains
2. Add your custom domain (e.g., `vibeconnect.app`)
3. Follow DNS configuration instructions

### For Railway (Backend):
1. Go to Service Settings → Domains
2. Add custom domain (e.g., `api.vibeconnect.app`)
3. Configure DNS

---

## Environment Variables Reference

### Backend (Railway)

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | ✅ Yes (auto-provided) |
| `OPENAI_API_KEY` | OpenAI API key for personality analysis | ✅ Yes |
| `BASE_RPC_URL` | Alchemy Base RPC endpoint | ✅ Yes |
| `SECRET_KEY` | JWT secret key | ✅ Yes |
| `PRIVATE_KEY` | Wallet private key for contract deployment | ⚠️ Later |
| `PROFILE_NFT_CONTRACT` | Deployed ProfileNFT address | ⚠️ After deployment |
| `CONNECTION_NFT_CONTRACT` | Deployed ConnectionNFT address | ⚠️ After deployment |
| `PESOBYTES_CONTRACT` | Deployed PesoBytes address | ⚠️ After deployment |

### Frontend (Vercel)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_API_URL` | Railway backend URL | ✅ Yes |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID | ✅ Yes |

---

## Troubleshooting

### Backend won't start
- Check Railway logs for errors
- Verify all environment variables are set
- Ensure PostgreSQL database is connected

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check CORS settings in backend
- Look at browser console for errors

### Database connection issues
- Check `DATABASE_URL` is set
- Verify Railway PostgreSQL is running
- Check database connection in Railway logs

---

## Security Checklist

Before going live:

- [ ] Change `SECRET_KEY` to a strong random value
- [ ] Update CORS to only allow your domain
- [ ] Never commit `.env` files
- [ ] Keep encryption key (`~/.vibeconnect-key`) backed up
- [ ] Use separate wallets for testnet and mainnet
- [ ] Enable Vercel password protection for beta testing

---

## Next Steps After Deployment

1. Deploy smart contracts to Base Sepolia
2. Update backend with contract addresses
3. Test full flow end-to-end
4. Invite beta testers
5. Set up monitoring (Sentry, LogRocket)
6. Plan mainnet deployment

---

## Support

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Next.js Docs: https://nextjs.org/docs
- FastAPI Docs: https://fastapi.tiangolo.com

**Need help?** Check the project README or create an issue on GitHub.
