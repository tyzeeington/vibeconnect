# Post-Deployment Checklist

Use this checklist after deploying contracts to ensure all integration steps are completed.

## Contract Deployment ✅

- [ ] All 3 contracts deployed successfully
- [ ] `deployment-addresses.json` file created
- [ ] Contract addresses recorded:
  - ProfileNFT: `0x_____________________`
  - ConnectionNFT: `0x_____________________`
  - PesoBytes: `0x_____________________`
- [ ] Deployer wallet address: `0x_____________________`
- [ ] Deployment date: `____-__-__`

## Contract Verification 🔍

- [ ] Basescan API key obtained (https://basescan.org/myapikey)
- [ ] ProfileNFT verified on Basescan
  - Link: `https://sepolia.basescan.org/address/0x...`
- [ ] ConnectionNFT verified on Basescan
  - Link: `https://sepolia.basescan.org/address/0x...`
- [ ] PesoBytes verified on Basescan
  - Link: `https://sepolia.basescan.org/address/0x...`
- [ ] All contracts show ✅ green checkmark on Basescan

## Backend Integration 🔧

### Environment Variables

Edit `/backend/.env`:

- [ ] `BASE_RPC_URL` set to RPC endpoint
  - Using: [ ] Public RPC [ ] Alchemy [ ] Infura [ ] Other: __________
- [ ] `PRIVATE_KEY` set (same as deployment wallet)
- [ ] `PROFILE_NFT_CONTRACT` set to deployed address
- [ ] `CONNECTION_NFT_CONTRACT` set to deployed address
- [ ] `PESOBYTES_CONTRACT` set to deployed address

### ABIs

- [ ] ABIs copied to `/backend/app/abis/`
  - Method: [ ] Manual copy [ ] `./scripts/copy-abis.sh`
- [ ] `ProfileNFT.json` exists in `/backend/app/abis/`
- [ ] `ConnectionNFT.json` exists in `/backend/app/abis/`
- [ ] `PesoBytes.json` exists in `/backend/app/abis/`

### Testing

- [ ] Backend service restarted
- [ ] Web3 service loads successfully (no errors in logs)
- [ ] Test script confirms connection to Base Sepolia
- [ ] Test NFT minting works (optional dry run)

## Frontend Integration 🎨

### Environment Variables

Create `/frontend/.env.local`:

- [ ] `NEXT_PUBLIC_PROFILE_NFT_ADDRESS` set
- [ ] `NEXT_PUBLIC_CONNECTION_NFT_ADDRESS` set
- [ ] `NEXT_PUBLIC_PESOBYTES_ADDRESS` set
- [ ] `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` set (if using WalletConnect)

### Configuration

- [ ] Contract addresses added to frontend config
- [ ] Network set to Base Sepolia (ChainID: 84532)
- [ ] ABIs copied to `/frontend/lib/abis/` (if needed)
- [ ] Frontend builds without errors

### Testing

- [ ] Frontend runs in development mode
- [ ] Wallet connection works
- [ ] Correct network detected (Base Sepolia)
- [ ] Contract interactions work (read functions)

## Documentation 📝

- [ ] Contract addresses shared with team
- [ ] Basescan links shared with team
- [ ] Deployment notes added to project docs
- [ ] Team notified of deployment completion

## Security Review 🔒

- [ ] Private key stored securely (password manager, not in Git)
- [ ] `.env` files NOT committed to Git (check `.gitignore`)
- [ ] Deployment wallet separated from personal funds
- [ ] Only authorized team members have access to private key
- [ ] Contract ownership confirmed (check on Basescan)

## Monitoring & Alerts (Optional) 📊

- [ ] Block explorer bookmarked for each contract
- [ ] Event monitoring set up (ProfileMinted, ConnectionMinted, etc.)
- [ ] Gas usage tracked
- [ ] Transaction alerts configured
- [ ] Error logging enabled

## Production Readiness (Future) 🚀

For future mainnet deployment:

- [ ] Security audit scheduled/completed
- [ ] Multi-sig wallet considered for contract ownership
- [ ] Timelock mechanisms reviewed
- [ ] Emergency pause functionality tested
- [ ] Gas optimization reviewed
- [ ] Mainnet RPC provider selected
- [ ] Mainnet deployment budget allocated
- [ ] Mainnet deployment plan documented

---

## Quick Test Commands

### Backend Test (Python)

```python
# Test Web3 connection
from app.services.web3_service import web3_service

print(f"Connected: {web3_service.w3.is_connected()}")
print(f"Block: {web3_service.w3.eth.block_number}")
print(f"ProfileNFT: {web3_service.profile_nft_address}")
print(f"ConnectionNFT: {web3_service.connection_nft_address}")
print(f"PesoBytes: {web3_service.pesobytes_address}")
```

### Frontend Test (Browser Console)

```javascript
// Check environment variables
console.log(process.env.NEXT_PUBLIC_PROFILE_NFT_ADDRESS);
console.log(process.env.NEXT_PUBLIC_CONNECTION_NFT_ADDRESS);
console.log(process.env.NEXT_PUBLIC_PESOBYTES_ADDRESS);
```

### Hardhat Test

```bash
# Check balance
npm run check-balance

# Verify on Basescan
npx hardhat verify --network baseSepolia 0xYOUR_ADDRESS
```

---

## Troubleshooting

### Backend can't connect to contracts
1. Check RPC URL is correct
2. Verify contract addresses are checksummed
3. Ensure ABIs are in the correct directory
4. Restart backend service

### Frontend wallet won't connect
1. Verify Base Sepolia is added to MetaMask
2. Check chainId is 84532
3. Ensure sufficient testnet ETH for gas

### Verification failed
1. Wait 1-2 minutes after deployment
2. Check Basescan API key is valid
3. Verify constructor arguments (PesoBytes: 100000000)
4. Try manual verification on Basescan UI

---

## Resources

- **Deployment Guide:** [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)
- **Quick Start:** [QUICK_START.md](./QUICK_START.md)
- **Base Sepolia Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.coinbase.com/faucets/base-sepolia-faucet

---

**Completion Date:** _______________
**Completed By:** _______________
**Sign-off:** _______________
