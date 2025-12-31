from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import or_

from app.database import get_db
from app.models import Connection, User, Event, Match

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
async def get_my_connections(
    wallet_address: str,
    db: Session = Depends(get_db)
):
    """
    Get all confirmed connections for a user
    """
    # Get the user by wallet address
    user = db.query(User).filter(User.wallet_address == wallet_address).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Query connections where user is userA or userB
    connections = db.query(Connection).filter(
        or_(
            Connection.user_a_id == user.id,
            Connection.user_b_id == user.id
        )
    ).all()

    # Build response for each connection
    result = []
    for conn in connections:
        # Determine who the "other user" is
        other_user_id = conn.user_b_id if conn.user_a_id == user.id else conn.user_a_id

        # Get the other user's data
        other_user = db.query(User).filter(User.id == other_user_id).first()

        # Get the event data
        event = db.query(Event).filter(Event.id == conn.event_id).first()

        # Get compatibility score from the match
        match = db.query(Match).filter(Match.id == conn.match_id).first()
        compatibility_score = match.compatibility_score if match else 0.0

        result.append(ConnectionResponse(
            connection_id=conn.id,
            other_user_wallet=other_user.wallet_address if other_user else "",
            other_user_username=other_user.username if other_user else None,
            event_id=event.event_id if event else "",
            compatibility_score=compatibility_score,
            connection_nft_id=conn.connection_nft_id,
            transaction_hash=conn.transaction_hash,
            pesobytes_earned=conn.pesobytes_earned,
            created_at=conn.created_at.isoformat() if conn.created_at else ""
        ))

    return result

@router.get("/{connection_id}/nft", response_model=NFTMetadata)
async def get_connection_nft(connection_id: int):
    """
    Get NFT metadata for a connection
    """
    # TODO: Query connection and fetch on-chain data
    return None
