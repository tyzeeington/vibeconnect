from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, UserProfile
from app.services.web3_service import web3_service
from app.auth_utils import create_access_token

router = APIRouter()

class WalletLoginRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/wallet-login", response_model=TokenResponse)
async def wallet_login(request: WalletLoginRequest, db: Session = Depends(get_db)):
    """
    Authenticate user with wallet signature

    Flow:
    1. Frontend requests a challenge message
    2. User signs message with their wallet
    3. Backend verifies signature
    4. Returns JWT token
    """
    # Verify the wallet signature
    is_valid = web3_service.verify_wallet_signature(
        wallet_address=request.wallet_address,
        signature=request.signature,
        message=request.message
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid wallet signature"
        )

    # Get or create user
    user = db.query(User).filter(User.wallet_address == request.wallet_address.lower()).first()

    if not user:
        # Create new user
        user = User(wallet_address=request.wallet_address.lower())
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
async def get_challenge(wallet_address: str):
    """
    Get a challenge message for wallet to sign
    """
    import time
    message = f"Sign this message to authenticate with VibeConnect. Timestamp: {int(time.time())}"
    return {"message": message}
