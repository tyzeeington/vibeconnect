from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserProfile
from app.services.web3_service import web3_service
from app.auth_utils import create_access_token
from app.middleware.security import limiter
from app.utils.validation import validate_wallet_address

router = APIRouter()

class WalletLoginRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/wallet-login", response_model=TokenResponse)
@limiter.limit("10/minute")
async def wallet_login(request_obj: Request, request: WalletLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with wallet signature

    Flow:
    1. Frontend requests a challenge message
    2. User signs message with their wallet
    3. Backend verifies signature
    4. Returns JWT token
    """
    # Validate wallet address format
    validated_wallet = validate_wallet_address(request.wallet_address)

    # Verify the wallet signature
    is_valid = web3_service.verify_wallet_signature(
        wallet_address=validated_wallet,
        signature=request.signature,
        message=request.message
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid wallet signature"
        )

    # Get or create user
    user = db.query(User).filter(User.wallet_address == validated_wallet).first()

    if not user:
        # Create new user
        user = User(wallet_address=validated_wallet)
        db.add(user)
        db.commit()
        db.refresh(user)

        # Create default profile
        profile = UserProfile(user_id=user.id)
        db.add(profile)
        db.commit()

    # Generate JWT token
    access_token = create_access_token(
        data={"sub": user.wallet_address, "user_id": user.id}
    )

    return TokenResponse(
        access_token=access_token,
        token_type="bearer"
    )

@router.get("/challenge/{wallet_address}")
@limiter.limit("20/minute")
async def get_challenge(request: Request, wallet_address: str):
    """
    Get a challenge message for wallet to sign
    """
    import time
    # Validate wallet address format
    validated_wallet = validate_wallet_address(wallet_address)

    message = f"Sign this message to authenticate with VibeConnect. Timestamp: {int(time.time())}"
    return {"message": message, "wallet_address": validated_wallet}
