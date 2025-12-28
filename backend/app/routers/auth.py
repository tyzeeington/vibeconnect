from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

router = APIRouter()

class WalletLoginRequest(BaseModel):
    wallet_address: str
    signature: str
    message: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

@router.post("/wallet-login", response_model=TokenResponse)
async def wallet_login(request: WalletLoginRequest):
    """
    Authenticate user with wallet signature
    
    Flow:
    1. Frontend requests a challenge message
    2. User signs message with their wallet
    3. Backend verifies signature
    4. Returns JWT token
    """
    # TODO: Implement wallet signature verification with web3_service
    # TODO: Generate JWT token
    # For now, return placeholder
    return TokenResponse(
        access_token="placeholder_token",
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
