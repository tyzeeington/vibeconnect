# VibeConnect Backend Security Implementation

## Overview
This document describes the security measures implemented in the VibeConnect backend API to protect against common vulnerabilities and ensure safe operation.

## Security Features Implemented

### 1. Rate Limiting

Rate limiting has been implemented using `slowapi` to prevent abuse and protect against DoS attacks.

#### Rate Limits by Endpoint Category:

**Authentication Endpoints:**
- `/api/auth/wallet-login`: 10 requests/minute per IP
- `/api/auth/challenge/{wallet_address}`: 20 requests/minute per IP

**Profile Endpoints:**
- `/api/profiles/onboard`: 5 requests/hour per IP (profile creation)
- `/api/profiles/me`: 100 requests/hour per IP
- `/api/profiles/update`: 30 requests/hour per IP
- `/api/profiles/socials`: 30 requests/hour per IP (updates)
- `/api/profiles/socials/{wallet_address}`: 100 requests/hour per IP
- `/api/profiles/{wallet_address}`: 100 requests/hour per IP
- `/api/profiles/onboarding-questions`: 100 requests/hour per IP

**Match Endpoints:**
- All match endpoints: Default rate limiting applies (1000/hour per IP)

**Connection Endpoints:**
- All connection endpoints: Default rate limiting applies (1000/hour per IP)

**Event Endpoints:**
- All event endpoints: Default rate limiting applies (1000/hour per IP)

#### Rate Limit Response:
When rate limit is exceeded, the API returns:
```json
{
  "error": "Rate limit exceeded",
  "message": "Too many requests. Please try again later.",
  "retry_after": "60 seconds"
}
```
HTTP Status Code: 429 (Too Many Requests)

### 2. Authentication & Authorization

#### JWT-Based Authentication:
- All sensitive endpoints now require JWT Bearer token authentication
- Tokens are validated using the `get_current_user` dependency
- Tokens contain wallet address and user ID in the payload
- Token expiration is enforced (default: 30 minutes)

#### Protected Endpoints:
The following endpoints now require authentication:
- `GET /api/profiles/me` - Get own profile
- `PUT /api/profiles/update` - Update own profile
- `PUT /api/profiles/socials` - Update social profiles
- `GET /api/profiles/socials/{wallet_address}` - View social profiles (optional auth for privacy)

#### Profile Requirements:
Some endpoints require a complete user profile:
- Uses `require_profile` dependency
- Returns 403 if user hasn't completed onboarding

### 3. Input Validation & Sanitization

Comprehensive input validation has been implemented to prevent injection attacks and data corruption.

#### Validation Functions:

**Wallet Address Validation:**
- Format: `0x` + 40 hexadecimal characters
- Automatically converts to lowercase for consistency
- Rejects invalid formats

**Text Sanitization:**
- Removes HTML tags using `bleach` library
- Configurable maximum length limits
- Removes null bytes and dangerous characters
- Used for: bio, onboarding responses, usernames

**Social Media Handle Validation:**
- Platform-specific rules:
  - Instagram: max 30 chars, alphanumeric + periods + underscores
  - Twitter/X: max 15 chars, alphanumeric + underscores
  - LinkedIn: min 3 chars, alphanumeric + hyphens
  - Spotify/TikTok/YouTube: general alphanumeric pattern
- Removes @ prefix automatically
- Rejects invalid characters

**Dimension Value Validation:**
- Must be numeric (float)
- Range: 0-100
- Used for personality dimensions

**Coordinate Validation:**
- Latitude: -90 to 90
- Longitude: -180 to 180
- Must be numeric

**Event ID Validation:**
- Alphanumeric + hyphens + underscores only
- Maximum length: 100 characters

### 4. Security Headers

All API responses include security headers via `SecurityHeadersMiddleware`:

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(self), microphone=(), camera=()
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'
```

### 5. CORS Configuration

CORS is configured with environment-specific rules:

**Development:**
- Allows all origins (for easier testing)
- Includes localhost:3000 (web) and localhost:19006 (Expo)

**Production:**
- Restrictive whitelist:
  - `https://vibeconnect.vercel.app`
  - `https://vibeconnect-*.vercel.app` (preview deployments)
- Credentials enabled for authenticated requests
- Limited methods: GET, POST, PUT, DELETE, OPTIONS
- Preflight cache: 1 hour

### 6. Request Logging & Monitoring

`RequestLoggingMiddleware` logs all requests for security auditing:

**Logged Information:**
- HTTP method and path
- Client IP address
- Response status code
- Processing time
- Errors and exceptions

**Log Levels:**
- INFO: Normal requests
- WARNING: 4xx/5xx responses, rate limit violations
- ERROR: Exceptions and failures

### 7. Privacy Controls

Social profile visibility is enforced:
- **Public**: Anyone can view
- **Connection Only**: Only users with accepted connections can view
- Unauthenticated users cannot view private profiles
- Authentication required message returned when appropriate

## Security Dependencies

New packages added to `requirements.txt`:
```
slowapi>=0.1.9      # Rate limiting
redis>=5.0.0        # Rate limit storage (optional, uses in-memory by default)
bleach>=6.1.0       # HTML sanitization
```

## Configuration

### Environment Variables

Ensure these are set in production:

```bash
# Security
SECRET_KEY=<strong-random-secret>      # For JWT signing
ENVIRONMENT=production                  # Enables strict CORS

# Redis (optional, for distributed rate limiting)
REDIS_URL=redis://localhost:6379       # For rate limiter storage
```

### JWT Configuration

In `app/config.py`:
```python
SECRET_KEY: str                        # Must be changed in production!
ALGORITHM: str = "HS256"               # JWT signing algorithm
ACCESS_TOKEN_EXPIRE_MINUTES: int = 30  # Token lifetime
```

## Usage Examples

### Authenticated Request

```bash
# Get authentication token
curl -X POST http://localhost:8000/api/auth/wallet-login \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
    "signature": "0x...",
    "message": "Sign this message..."
  }'

# Use token in subsequent requests
curl -X GET http://localhost:8000/api/profiles/me \
  -H "Authorization: Bearer <token>"
```

### Social Profile Update with Validation

```bash
curl -X PUT http://localhost:8000/api/profiles/socials \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "social_profiles": {
      "instagram": "vibeconnect",
      "twitter": "vibeconnect",
      "linkedin": "vibe-connect"
    },
    "social_visibility": "connection_only"
  }'
```

## Testing Security Features

### Test Rate Limiting

```bash
# This will be rate limited after 10 requests
for i in {1..15}; do
  curl -X POST http://localhost:8000/api/auth/wallet-login \
    -H "Content-Type: application/json" \
    -d '{"wallet_address": "0x123...", "signature": "0x...", "message": "..."}'
  echo "Request $i"
done
```

### Test Input Validation

```bash
# This will be rejected (invalid wallet format)
curl -X GET http://localhost:8000/api/auth/challenge/invalid-address

# This will be rejected (XSS attempt in bio)
curl -X PUT http://localhost:8000/api/profiles/update \
  -H "Authorization: Bearer <token>" \
  -d '{"bio": "<script>alert('XSS')</script>"}'
```

## Security Best Practices

### For Developers:

1. **Never commit secrets**: Use environment variables for sensitive data
2. **Validate all inputs**: Use validation functions for user-provided data
3. **Use authentication**: Apply `Depends(get_current_user)` to protected endpoints
4. **Set appropriate rate limits**: Consider endpoint sensitivity when setting limits
5. **Log security events**: Use `security_logger` for important security events
6. **Test security features**: Write tests for authentication, validation, and rate limiting

### For Deployment:

1. **Change SECRET_KEY**: Use a strong, random secret in production
2. **Enable HTTPS**: Always use TLS/SSL in production
3. **Configure Redis**: Use Redis for distributed rate limiting in production
4. **Monitor logs**: Set up log aggregation and monitoring
5. **Regular updates**: Keep security dependencies up to date
6. **Backup data**: Regular database backups
7. **Firewall rules**: Restrict database access to application servers only

## Known Limitations & Future Improvements

### Current Limitations:
1. In-memory rate limiting (not distributed) - use Redis in production
2. No CSRF token validation (stateless API, relies on JWT)
3. No request signing for webhook/callback endpoints
4. No automated vulnerability scanning

### Recommended Improvements:
1. **Add Redis for rate limiting**: For multi-instance deployments
2. **Implement request signing**: For external API integrations
3. **Add API key authentication**: For service-to-service communication
4. **Implement 2FA**: For high-value operations
5. **Add SQL injection protection**: Use parameterized queries (already done via SQLAlchemy)
6. **Implement rate limiting by user**: Track authenticated user rates separately
7. **Add audit logging**: Detailed audit trail for compliance
8. **Security scanning**: Regular dependency vulnerability scans
9. **Penetration testing**: Regular security audits

## Security Incident Response

If a security issue is discovered:

1. **Document the issue**: Write down what happened, when, and who was affected
2. **Contain the breach**: Take immediate action to prevent further damage
3. **Notify stakeholders**: Inform relevant parties (users, team, authorities)
4. **Investigate**: Determine root cause and extent of impact
5. **Remediate**: Fix the vulnerability and deploy patches
6. **Review and improve**: Update security measures to prevent recurrence
7. **Post-mortem**: Document lessons learned

## Compliance Considerations

- **GDPR**: Users can delete their profiles (right to be forgotten)
- **Data minimization**: Only collect necessary information
- **Encryption**: Use HTTPS in transit, consider encryption at rest
- **Access controls**: Implement proper authorization checks
- **Audit trails**: Log important security events

## Contact

For security concerns or to report vulnerabilities, please contact:
- Email: security@vibeconnect.app
- Create a private security advisory on GitHub

## Changelog

### v1.0.0 (2026-01-01)
- Initial security implementation
- Added rate limiting with slowapi
- Implemented JWT authentication
- Added input validation and sanitization
- Configured security headers
- Enhanced CORS configuration
- Added request logging middleware
