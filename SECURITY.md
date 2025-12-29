# Security Best Practices

## Secret Management

This project uses encrypted secret storage to safely work with AI assistants without exposing sensitive credentials.

### How It Works

1. **Encryption Key**: A unique encryption key is generated and stored in `~/.vibeconnect-key` (in your home directory)
2. **Encrypted Storage**: Secrets are encrypted and stored in `.encrypted/secrets.json`
3. **Local Decryption**: When you need to use secrets, they're decrypted locally to generate `.env` files
4. **AI-Safe**: The `.encrypted/secrets.json` file contains only encrypted data and is safe to view by AI assistants

### First-Time Setup

Run the setup script to encrypt your secrets:

```bash
node scripts/encrypt-secrets.js setup
```

This will:
1. Prompt you for all required secrets (API keys, database URLs, etc.)
2. Encrypt them with a locally-generated key
3. Save encrypted versions to `.encrypted/secrets.json`
4. Generate all necessary `.env` files

### Daily Usage

When you pull the project or switch machines:

```bash
# Decrypt and regenerate .env files
node scripts/encrypt-secrets.js decrypt
```

### Updating Secrets

When you need to change a secret (like rotating an API key):

```bash
# Re-run setup to update all secrets
node scripts/encrypt-secrets.js setup
```

Or manually edit `.encrypted/secrets.json` (encrypted values) and regenerate:

```bash
node scripts/encrypt-secrets.js decrypt
```

### Verify Your Secrets

To see your current secrets (partially masked):

```bash
node scripts/encrypt-secrets.js show
```

---

## What NOT to Commit

**NEVER commit these files to git:**
- `.env`, `.env.local`, or any file ending in `.env`
- `~/.vibeconnect-key` (encryption key)
- Private keys or API keys in any form

**Safe to commit:**
- `.encrypted/secrets.json` (encrypted secrets)
- `.env.example` (template files)
- `deployment-addresses.json` (contract addresses are public)

---

## Working with AI Assistants

When working with AI assistants like Claude Code:

✅ **Safe to show:**
- `.encrypted/secrets.json` - Contains only encrypted data
- `.env.example` - Template files
- Code and configuration files

❌ **Never show:**
- `.env` files - Contains actual secrets
- Output from `encrypt-secrets.js show` - Contains decrypted secrets
- Your encryption key file

### If You Accidentally Expose a Secret

1. **Immediately rotate the secret** (generate a new API key, change password, etc.)
2. Update using `node scripts/encrypt-secrets.js setup`
3. If it was committed to git, consider the repository compromised and rotate ALL secrets

---

## Key Storage Location

Your encryption key is stored at: `~/.vibeconnect-key`

**Important:**
- This file is outside the project directory for extra safety
- Back it up somewhere secure (password manager, encrypted backup)
- If you lose this file, you'll need to re-enter all secrets via `setup`

---

## Multi-Machine Setup

Working on multiple machines? Here's how:

**Option 1: Share encrypted secrets (Recommended)**
1. Commit `.encrypted/secrets.json` to git
2. On new machine, run `node scripts/encrypt-secrets.js setup`
3. Each machine has its own encryption key, but stores the same secrets

**Option 2: Share encryption key (Advanced)**
1. Copy `~/.vibeconnect-key` to your other machine (securely!)
2. Pull the repo with `.encrypted/secrets.json`
3. Run `node scripts/encrypt-secrets.js decrypt`

---

## Contract Deployment Security

When deploying smart contracts:

1. **Use a dedicated deployment wallet** - Not your personal wallet
2. **Test on Sepolia first** - Never deploy untested contracts to mainnet
3. **Verify contracts** - Use Basescan verification after deployment
4. **Limit testnet funds** - Only keep enough ETH for deployment

### Creating a Deployment Wallet

```bash
# In hardhat console
npx hardhat console --network baseSepolia
const wallet = ethers.Wallet.createRandom()
console.log("Address:", wallet.address)
console.log("Private Key:", wallet.privateKey)
```

Save the private key to your encrypted secrets:
```bash
node scripts/encrypt-secrets.js setup
# Enter the private key when prompted
```

---

## Emergency Procedures

### Secret Exposed to AI Assistant

1. Immediately end the conversation or delete the message
2. Rotate the exposed secret immediately
3. Update encrypted secrets: `node scripts/encrypt-secrets.js setup`
4. Review recent activity for any unauthorized usage

### Encryption Key Lost

1. Run `node scripts/encrypt-secrets.js setup` to create new key
2. Re-enter all secrets when prompted
3. Verify all services work with new credentials

### Git Committed Secrets

1. **DO NOT** just delete the commit - secrets remain in git history
2. Rotate ALL secrets immediately
3. Consider using tools like `git-filter-repo` to rewrite history
4. Re-encrypt with `node scripts/encrypt-secrets.js setup`

---

## Additional Security Measures

### API Rate Limiting
- Set up rate limits on your OpenAI API key
- Use separate API keys for dev/prod

### Database Security
- Use strong passwords for PostgreSQL
- Limit database user permissions
- Enable SSL for remote connections

### Smart Contract Security
- Use OpenZeppelin audited contracts
- Test thoroughly before mainnet deployment
- Consider a professional audit for production

### Environment Isolation
- Use different credentials for development and production
- Never use production credentials in development
- Keep production deployment keys completely separate
