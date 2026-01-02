# VibeConnect Backend - Security Update Installation Guide

## Quick Start

### 1. Install New Dependencies

```bash
cd /home/user/vibeconnect/backend
pip install -r requirements.txt
```

This will install:
- `slowapi>=0.1.9` - Rate limiting
- `redis>=5.0.0` - Rate limit storage (optional)
- `bleach>=6.1.0` - HTML sanitization

### 2. Update Environment Variables

Add or update these in your `.env` file:

```bash
# CRITICAL: Change this to a strong random secret in production!
SECRET_KEY=your-super-secret-key-change-me-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Set to 'production' in production
ENVIRONMENT=development

# Optional: Redis for distributed rate limiting
# REDIS_URL=redis://localhost:6379
```

Generate a secure SECRET_KEY:
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

### 3. Verify Installation

```bash
# Test that all modules load correctly
python3 -c "from app.middleware.security import limiter; print('✅ Security modules loaded')"

# Or start the server
uvicorn main:app --reload
```

### 4. Test the Security Features

**Test Rate Limiting:**
```bash
# Should get rate limited after 10 requests
for i in {1..15}; do
  echo "Request $i:"
  curl -X POST http://localhost:8000/api/auth/wallet-login \
    -H "Content-Type: application/json" \
    -d '{"wallet_address":"0x742d35Cc6634C0532925a3b844Bc454e4438f44e","signature":"0x123","message":"test"}' \
    -w "\nHTTP Status: %{http_code}\n\n"
  sleep 0.5
done
```

**Test Security Headers:**
```bash
curl -I http://localhost:8000/health
# Should see security headers in response
```

**Test Authentication:**
```bash
# This should fail (no auth token)
curl http://localhost:8000/api/profiles/me

# Get a token first, then:
curl http://localhost:8000/api/profiles/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## What's New

### New Files Created:
- `/backend/app/middleware/__init__.py`
- `/backend/app/middleware/security.py` - Rate limiting & security headers
- `/backend/app/dependencies.py` - Authentication dependencies
- `/backend/app/utils/__init__.py`
- `/backend/app/utils/validation.py` - Input validation & sanitization
- `/backend/SECURITY.md` - Complete security documentation
- `/backend/SECURITY_IMPLEMENTATION_SUMMARY.md` - Implementation details

### Modified Files:
- `/backend/requirements.txt` - Added security dependencies
- `/backend/main.py` - Added security middleware & improved CORS
- `/backend/app/routers/auth.py` - Added rate limiting & validation
- `/backend/app/routers/profiles.py` - Added auth, rate limiting & sanitization
- `/backend/app/routers/matches.py` - Added rate limiting
- `/backend/app/routers/connections.py` - Added rate limiting
- `/backend/app/routers/events.py` - Added rate limiting & validation

## Breaking Changes

⚠️ These endpoints now REQUIRE authentication (JWT Bearer token):

- `GET /api/profiles/me`
- `PUT /api/profiles/update`
- `PUT /api/profiles/socials`

Update your frontend to include the JWT token:
```javascript
const response = await fetch('/api/profiles/me', {
  headers: {
    'Authorization': `Bearer ${jwtToken}`
  }
});
```

## Production Deployment

### Railway/Vercel/Heroku:

1. Set environment variables:
```bash
ENVIRONMENT=production
SECRET_KEY=<strong-random-secret>
DATABASE_URL=<your-postgres-url>
```

2. If using multiple instances, add Redis:
```bash
REDIS_URL=<your-redis-url>
```

3. Ensure HTTPS is enabled (should be automatic on most platforms)

4. Update CORS origins in code if needed

### Monitoring:

Check logs for these patterns:
- `Rate limit exceeded` - Someone hitting rate limits
- `Invalid authentication` - Failed login attempts
- `HTTP 400/401/403` - Validation/auth failures

## Troubleshooting

**Issue: "ModuleNotFoundError: No module named 'slowapi'"**
```bash
# Solution: Install dependencies
pip install -r requirements.txt
```

**Issue: "Rate limiting not working"**
```bash
# Check that limiter is configured in main.py
# For distributed systems, configure Redis
```

**Issue: "CORS errors in browser"**
```bash
# Update allowed_origins in main.py
# Make sure ENVIRONMENT is set correctly
```

**Issue: "JWT authentication fails"**
```bash
# Verify SECRET_KEY is set
# Check token is being sent in Authorization header
# Verify token hasn't expired
```

## Next Steps

1. ✅ Install dependencies
2. ✅ Update environment variables
3. ✅ Test locally
4. ⬜ Update frontend to use new authentication
5. ⬜ Deploy to staging
6. ⬜ Run security tests
7. ⬜ Deploy to production
8. ⬜ Monitor logs for issues

## Support

For questions or issues:
- Check `/backend/SECURITY.md` for detailed documentation
- Review `/backend/SECURITY_IMPLEMENTATION_SUMMARY.md` for what changed
- Check API docs: `http://localhost:8000/docs`

## Rollback (if needed)

If you need to rollback:
```bash
git checkout HEAD~1 -- backend/
pip install -r requirements.txt
```

Note: This will remove all security features. Only do this in emergencies.
