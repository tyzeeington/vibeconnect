"""
FastAPI dependencies for authentication and authorization
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.models import User
from app.auth_utils import decode_access_token

# Security scheme for JWT Bearer tokens
security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    Dependency to get the current authenticated user from JWT token

    Args:
        credentials: HTTP Bearer token from Authorization header
        db: Database session

    Returns:
        User object for the authenticated user

    Raises:
        HTTPException: If token is invalid or user not found
    """
    token = credentials.credentials

    # Decode and verify token
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get wallet address from token
    wallet_address: str = payload.get("sub")
    if not wallet_address:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Get user from database
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(HTTPBearer(auto_error=False)),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    Dependency to get the current user if authenticated, otherwise None
    Useful for endpoints that have different behavior for authenticated vs unauthenticated users

    Args:
        credentials: Optional HTTP Bearer token
        db: Database session

    Returns:
        User object if authenticated, None otherwise
    """
    if not credentials:
        return None

    try:
        token = credentials.credentials
        payload = decode_access_token(token)
        if not payload:
            return None

        wallet_address: str = payload.get("sub")
        if not wallet_address:
            return None

        user = db.query(User).filter(User.wallet_address == wallet_address).first()
        return user
    except Exception:
        return None


def require_profile(user: User = Depends(get_current_user)) -> User:
    """
    Dependency that requires the user to have a profile

    Args:
        user: Current authenticated user

    Returns:
        User object with profile

    Raises:
        HTTPException: If user doesn't have a profile
    """
    if not user.profile:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Profile required. Please complete onboarding first."
        )
    return user
