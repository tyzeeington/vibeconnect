#!/usr/bin/env python3
"""
Generate JWT Secret Key for VibeConnect Backend

This script generates a secure random secret key suitable for JWT signing.
Use this to create environment variables for the backend deployment.

Security Note:
- This script is safe to run locally and share with team members
- NEVER commit the generated key to version control
- NEVER share the generated key in chat messages or public channels
- Use Railway dashboard or .env file management to store the secret
"""

import secrets
import sys
from pathlib import Path


def generate_jwt_secret(length: int = 64) -> str:
    """
    Generate a secure random JWT secret key.

    Args:
        length: Length of the secret key (default: 64 characters)
                Railway typically requires 32+ characters for security

    Returns:
        A URL-safe random string suitable for JWT signing
    """
    return secrets.token_urlsafe(length)


def print_instructions():
    """Print setup instructions for the user."""
    print("\n" + "=" * 70)
    print("JWT SECRET KEY GENERATION INSTRUCTIONS")
    print("=" * 70 + "\n")

    print("STEP 1: Copy the secret key below")
    print("-" * 70)
    secret_key = generate_jwt_secret()
    print(f"\n{secret_key}\n")
    print("-" * 70)

    print("\nSTEP 2: Add to Your Environment")
    print("-" * 70)
    print("\nChoose ONE of the following options:\n")

    print("Option A: Railway Dashboard (RECOMMENDED)")
    print("  1. Go to https://railway.app/dashboard")
    print("  2. Select the 'vibeconnect' project")
    print("  3. Click the 'backend' service")
    print("  4. Go to the 'Variables' tab")
    print("  5. Click 'Add Variable'")
    print("  6. Set NAME: SECRET_KEY")
    print("  7. Set VALUE: <paste the key above>")
    print("  8. Click 'Save'")
    print("  9. The backend will automatically restart with the new variable\n")

    print("Option B: Local Development (.env file)")
    print("  1. Create/edit backend/.env")
    print("  2. Add: SECRET_KEY=<paste the key above>")
    print("  3. Save and restart the backend server\n")

    print("Option C: Environment Variable (Terminal)")
    print("  export SECRET_KEY=\"<paste the key above>\"")
    print("  then run: python main.py\n")

    print("STEP 3: Verify It Works")
    print("-" * 70)
    print("\nAfter adding the secret, verify the backend starts successfully:\n")
    print("  curl https://vibeconnect-production.up.railway.app/health\n")
    print("  Expected response:")
    print('    {"status": "healthy"}')
    print("    Status code: 200\n")

    print("STEP 4: Test Authentication")
    print("-" * 70)
    print("\nTest that JWT tokens are being issued correctly:\n")
    print("  1. Try wallet login via the frontend")
    print("  2. Check that you receive a valid JWT token")
    print("  3. Use the token to call protected endpoints")
    print("  4. Verify /api/profiles/me returns your profile\n")

    print("SECURITY BEST PRACTICES")
    print("=" * 70)
    print("""
1. NEVER commit this script's output to version control
   ✗ DO NOT add the key to Git
   ✗ DO NOT share it in Slack/Discord/GitHub comments
   ✗ DO NOT email the key to anyone

2. Use secure secret management:
   ✓ Use Railway's Variables feature (encrypted at rest)
   ✓ Use environment variables in CI/CD
   ✓ Use .env with .gitignore for local development
   ✓ Use a secrets manager (e.g., HashiCorp Vault) for enterprises

3. Rotate secrets regularly:
   ✓ Generate a new secret periodically (e.g., quarterly)
   ✓ Update existing tokens when rotating secrets
   ✓ Invalidate old tokens if compromised

4. Monitoring:
   ✓ Watch for failed authentication attempts
   ✓ Monitor for unusual token usage patterns
   ✓ Check logs for SECRET_KEY related errors

5. If compromised:
   ✓ Immediately generate a new secret
   ✓ Update all deployment environments
   ✓ Invalidate existing tokens
   ✓ Review logs for unauthorized access
""")

    print("\nTROUBLESHOOTING")
    print("=" * 70)
    print("""
Issue: "SECRET_KEY environment variable not found"
  -> Make sure you've set the variable in Railway or .env
  -> Restart the backend service after setting it
  -> Check the variable name is exactly 'SECRET_KEY' (case-sensitive)

Issue: "Backend crashes after adding SECRET_KEY"
  -> Check the SECRET_KEY doesn't have special formatting issues
  -> Ensure the key is properly URL-encoded if copy-pasted
  -> Check logs: railway logs backend -n 50

Issue: "Cannot get JWT token in frontend"
  -> Verify backend returns 200 from /health endpoint
  -> Check /api/auth/challenge/{wallet_address} works
  -> Verify /api/auth/wallet-login accepts your signature
  -> Check browser console for error messages

Need help?
  -> Check backend/SECURITY.md for JWT details
  -> See backend/INSTALLATION.md for setup guide
  -> Review AGENT_TASKS.md Task 1 for context
""")


def main():
    """Main entry point."""
    if len(sys.argv) > 1 and sys.argv[1] in ('--help', '-h'):
        print(__doc__)
        return 0

    try:
        print_instructions()
        return 0
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
