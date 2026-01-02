# JWT Secret Key Setup Guide

**Status:** This is a CRITICAL configuration step for VibeConnect Backend
**Priority:** 🔴 CRITICAL
**Time to Complete:** 5-10 minutes

## Overview

The VibeConnect backend uses JWT (JSON Web Tokens) for secure authentication. This guide walks you through generating and setting up the `SECRET_KEY` environment variable required for JWT signing.

**Why is this needed?**
- JWT signing requires a cryptographically secure secret key
- The secret must be kept private and never committed to version control
- Without it, the backend cannot issue or verify authentication tokens
- This blocks all user authentication and login functionality

---

## Quick Start (5 Minutes)

### Step 1: Generate the Secret

Run the generation script:

```bash
cd backend
python scripts/generate_jwt_secret.py
```

This will output:
1. A secure 64-character random string
2. Step-by-step instructions for adding it to your environment
3. Security best practices
4. Troubleshooting guide

**Example output:**
```
======================================================================
JWT SECRET KEY GENERATION INSTRUCTIONS
======================================================================

STEP 1: Copy the secret key below
----------------------------------------------------------------------

[YOUR_GENERATED_SECRET_KEY_HERE]

----------------------------------------------------------------------

STEP 2: Add to Your Environment
...
```

### Step 2: Add to Railway (Production)

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select **vibeconnect** project
3. Click **backend** service
4. Go to **Variables** tab
5. Click **Add Variable**
6. Enter:
   - **NAME:** `SECRET_KEY`
   - **VALUE:** (paste the generated key)
7. Click **Save**
8. Railway will automatically restart the backend with the new variable

### Step 3: Verify It Works

```bash
# Check backend health
curl https://vibeconnect-production.up.railway.app/health

# Expected response (200 OK):
# {"status": "healthy"}
```

### Step 4: Test Authentication

1. Go to the VibeConnect frontend
2. Try wallet login
3. Verify you receive a JWT token
4. Check that `/api/profiles/me` works with the token

---

## Detailed Setup Instructions

### For Local Development

#### Option A: Using .env File (Recommended)

1. Create `.env` in the `backend` directory:

```bash
cd backend
touch .env
```

2. Add the SECRET_KEY to `.env`:

```env
# JWT Configuration
SECRET_KEY=<your_generated_secret_key_here>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Other required variables
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
ENVIRONMENT=development
```

3. Add to `.gitignore` to prevent accidental commits:

```bash
# .gitignore
.env
.env.local
.env.*.local
```

4. Restart the backend:

```bash
cd backend
python main.py
```

#### Option B: Environment Variable

```bash
export SECRET_KEY="<your_generated_secret_key_here>"
python backend/main.py
```

#### Option C: Docker

If using Docker, add to your `docker-compose.yml`:

```yaml
services:
  backend:
    environment:
      - SECRET_KEY=<your_generated_secret_key_here>
      - DATABASE_URL=postgresql://...
```

### For Production Deployment

#### Railway (Recommended)

1. **Via Dashboard (Easiest):**
   - Go to Railway Dashboard → vibeconnect → backend → Variables
   - Add `SECRET_KEY` variable
   - Railway encrypts it at rest

2. **Via Railway CLI:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Select project and add variable
railway variable add SECRET_KEY <your_secret_key>
```

3. **Verification:**

```bash
# Check variables are set
railway variable list

# View logs
railway logs
```

#### Other Deployment Platforms

**AWS Lambda / EC2:**
```bash
# Set environment variables
aws lambda update-function-configuration \
  --function-name vibeconnect-backend \
  --environment Variables={SECRET_KEY=your_secret_key}
```

**Heroku:**
```bash
heroku config:set SECRET_KEY=<your_secret_key> -a vibeconnect
```

**Google Cloud Run:**
```bash
gcloud run deploy vibeconnect-backend \
  --set-env-vars SECRET_KEY=<your_secret_key>
```

---

## Security Best Practices

### DO's ✓

- **Generate a new secret using the provided script**
  ```bash
  python scripts/generate_jwt_secret.py
  ```

- **Use Railway's encrypted Variables feature**
  - Secrets are encrypted at rest
  - Only accessible to authorized team members
  - Audit logs track access

- **Store locally in .env (development only)**
  - Add `.env` to `.gitignore`
  - Never commit secrets to version control
  - Use `.env.example` for reference

- **Rotate secrets periodically**
  - Generate new key quarterly or after team changes
  - Update all environments
  - Old tokens will still work until they expire

- **Monitor for unauthorized access**
  - Check authentication logs
  - Alert on failed token verifications
  - Review Railway logs regularly

- **Use different secrets for different environments**
  ```
  Development: dev_secret_xxxx
  Staging:     staging_secret_xxxx
  Production:  prod_secret_xxxx
  ```

### DON'Ts ✗

- **Never commit the secret to version control**
  ```bash
  # BAD - Don't do this!
  echo "SECRET_KEY=xyz" >> .env
  git add .env
  git commit
  ```

- **Never share in public channels**
  - No Slack messages
  - No GitHub comments
  - No Discord/email

- **Never paste in GitHub issues or PRs**
  - Secrets are indexed by search engines
  - Anyone with repo access can see it
  - Compromises account security

- **Never log or print the secret**
  ```python
  # BAD
  print(f"Using secret: {secret_key}")
  logger.info(f"SECRET_KEY={secret_key}")
  ```

- **Never reuse secrets across environments**
  - Each environment needs its own key
  - Compromising one doesn't affect others

- **Never hardcode defaults in code**
  - Always use environment variables
  - Raise error if SECRET_KEY not set

---

## JWT Token Details

### Token Format

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIweGFi...LCJleHAiOjE2Nzc4OTAwMDB9.
oMnzw8H4pFpGzf...
```

### Token Payload

```json
{
  "sub": "0xabc123...",           // wallet address
  "user_id": 42,                  // database user ID
  "exp": 1677890000,              // expiration timestamp
  "iat": 1677888800,              // issued at timestamp
  "type": "access"                // token type
}
```

### Token Lifetime

- **Default:** 30 minutes
- **Configurable:** Via `ACCESS_TOKEN_EXPIRE_MINUTES` in `.env`
- **After expiration:** Frontend must call `/api/auth/refresh` for new token

### Verification

Backend verifies JWT tokens using the SECRET_KEY:

```python
# Token is signed with SECRET_KEY
# Backend uses same SECRET_KEY to verify signature
# If SECRET_KEY changes, old tokens become invalid

import jwt
from app.config import settings

payload = jwt.decode(
    token,
    settings.SECRET_KEY,
    algorithms=[settings.ALGORITHM]  # HS256
)
```

---

## Troubleshooting

### Backend Won't Start: "SECRET_KEY environment variable not found"

**Cause:** SECRET_KEY is not set in the environment

**Solution:**
1. Check `.env` file exists and contains `SECRET_KEY`
2. Check variable is set in Railway dashboard
3. Verify exact variable name: `SECRET_KEY` (case-sensitive)
4. Restart the backend service

```bash
# Local development
python -c "import os; print('SECRET_KEY' in os.environ)"  # Should print True

# Railway
railway variable list  # Should show SECRET_KEY
```

### "Invalid or expired token" Error

**Cause:** Token signature verification failed

**Possible Reasons:**
1. Different SECRET_KEY in backend vs. where token was issued
2. Token expired (30 minute default lifetime)
3. Malformed token format

**Solution:**
```bash
# Check if backend has same SECRET_KEY
railway variable list

# Verify token in debugger
# Use https://jwt.io to decode (doesn't verify signature)

# Check token lifetime
export TOKEN="your_jwt_token"
python -c "import jwt; import json; print(json.dumps(jwt.decode('$TOKEN', options={'verify_signature': False}), indent=2))"
```

### Frontend Can't Get Login Token

**Checklist:**
1. Is backend running?
   ```bash
   curl http://localhost:8000/health
   ```

2. Can you reach `/api/auth/challenge` endpoint?
   ```bash
   curl http://localhost:8000/api/auth/challenge/0xabc123
   ```

3. Check backend logs for errors:
   ```bash
   # Local development
   # Check terminal output

   # Railway
   railway logs backend -n 50 --follow
   ```

4. Verify database is accessible
5. Check CORS configuration allows frontend

### Token Works but Endpoints Return 401

**Cause:** Token format invalid or not being sent correctly

**Solution:**
1. Check token is sent with `Authorization` header:
   ```bash
   curl -H "Authorization: Bearer YOUR_TOKEN" \
        http://localhost:8000/api/profiles/me
   ```

2. Verify token has not expired:
   ```python
   import jwt
   from datetime import datetime

   payload = jwt.decode(token, options={"verify_signature": False})
   exp_time = datetime.fromtimestamp(payload['exp'])
   print(f"Token expires at: {exp_time}")
   ```

3. Check backend logs for specific error

---

## Verification Checklist

After setting up the SECRET_KEY, verify everything is working:

- [ ] Backend starts without errors
- [ ] `curl http://localhost:8000/health` returns 200
- [ ] `/api/auth/challenge/{wallet_address}` returns a message to sign
- [ ] Wallet login returns a valid JWT token
- [ ] Protected endpoints like `/api/profiles/me` work with token
- [ ] Token expires after 30 minutes
- [ ] New token can be obtained with another login
- [ ] Invalid tokens are rejected with 401

---

## Secret Rotation

### When to Rotate

- Quarterly security refresh
- After suspected compromise
- After team member departure
- Before major security update

### How to Rotate

1. **Generate new secret:**
   ```bash
   python scripts/generate_jwt_secret.py
   ```

2. **Update all environments:**
   ```bash
   # Production
   railway variable update SECRET_KEY new_secret_key

   # Staging
   # (Update staging deployment)

   # Local development
   # Update .env file
   ```

3. **Restart services:**
   - Railway auto-restarts
   - Local: restart backend manually
   - Other platforms: deploy or restart containers

4. **Monitor for issues:**
   - Check logs for authentication errors
   - Verify token issuance works
   - Test login flow end-to-end

5. **Gradual rollout (for production):**
   - Deploy to staging first
   - Test thoroughly
   - Monitor for 24 hours
   - Then deploy to production

**Note:** Old tokens remain valid until they expire (30 min default). You don't need to invalidate them unless there's a security incident.

---

## Environment Variables Reference

### Required Variables

```env
# JWT - CRITICAL, must be set before backend starts
SECRET_KEY=<generate_using_script>  # 64+ character random string
ALGORITHM=HS256                     # JWT signing algorithm (don't change)
ACCESS_TOKEN_EXPIRE_MINUTES=30      # Token lifetime in minutes

# Database
DATABASE_URL=postgresql://user:pass@host:5432/vibeconnect

# Redis
REDIS_URL=redis://localhost:6379

# Environment
ENVIRONMENT=production              # production or development
DEBUG=False                          # Don't enable in production
```

### Optional Variables

```env
# OpenAI (for chat features)
OPENAI_API_KEY=sk_xxx

# Web3 / Blockchain
BASE_RPC_URL=https://...
PRIVATE_KEY=<never_set_in_env>
```

---

## Related Documentation

- **SECURITY.md** - Comprehensive security features overview
- **INSTALLATION.md** - Full backend installation guide
- **AGENT_TASKS.md** - Task status and priorities
- **DEPLOYMENT_CHECKLIST.md** - Pre-deployment verification

---

## FAQ

**Q: Is the generated secret secure?**
A: Yes. It uses Python's `secrets.token_urlsafe()` which is cryptographically secure and suitable for production use.

**Q: Can I use a simple password instead?**
A: Not recommended. JWT secrets should be cryptographically random. A simple password can be brute-forced in seconds.

**Q: Do I need to share the secret with team members?**
A: No. Only the deployment system (Railway, etc.) needs it. Team members don't need the actual secret value.

**Q: What if the secret is compromised?**
A: Generate a new one immediately using the script, update all environments, and monitor logs for suspicious activity.

**Q: Can I have the same secret in dev and production?**
A: Technically yes, but it's not recommended. Use different secrets for different environments.

**Q: How long should the secret be?**
A: The script generates 64 characters, which is plenty. Minimum 32 characters recommended.

**Q: Can I change SECRET_KEY after it's set?**
A: Yes, generate a new one and update the environment variable. Old tokens will become invalid once they expire.

---

## Support

For issues or questions:
1. Check the **Troubleshooting** section above
2. Review logs: `railway logs backend -n 100 --follow`
3. Check status page: https://railway.app/status
4. See **SECURITY.md** for JWT implementation details
5. Contact team lead or ops

---

**Last Updated:** January 2, 2026
**Version:** 1.0
**Severity:** CRITICAL
