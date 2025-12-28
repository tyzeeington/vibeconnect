from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List

router = APIRouter()

class ConnectionResponse(BaseModel):
    connection_id: int
    other_user_wallet: str
    other_user_username: str | None
    event_id: str
    compatibility_score: float
    connection_nft_id: int | None
    transaction_hash: str | None
    pesobytes_earned: int
    created_at: str

class NFTMetadata(BaseModel):
    token_id: int
    metadata_uri: str
    user_a: str
    user_b: str
    event_id: str
    compatibility_score: float
    timestamp: int

@router.get("/", response_model=List[ConnectionResponse])
async def get_my_connections(wallet_address: str):
    """
    Get all confirmed connections for a user
    """
    # TODO: Query connections where user is userA or userB
    return []

@router.get("/{connection_id}/nft", response_model=NFTMetadata)
async def get_connection_nft(connection_id: int):
    """
    Get NFT metadata for a connection
    """
    # TODO: Query connection and fetch on-chain data
    return None
