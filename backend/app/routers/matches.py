from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime

from app.database import get_db
from app.models import Match, MatchStatus, Connection, User, Event
from app.services.web3_service import web3_service

router = APIRouter()

class MatchResponse(BaseModel):
    match_id: int
    user_id: int
    username: str | None
    wallet_address: str
    compatibility_score: float
    dimension_alignment: Dict[str, float]
    proximity_overlap_minutes: int
    event_id: str
    status: str

class RespondToMatchRequest(BaseModel):
    match_id: int
    wallet_address: str
    accept: bool

@router.get("/pending", response_model=List[MatchResponse])
async def get_pending_matches(wallet_address: str, db: Session = Depends(get_db)):
    """
    Get pending matches for a user after an event
    """
    # Get the user by wallet address
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Query all pending matches where user is either user_a or user_b
    matches = db.query(Match).filter(
        Match.status == MatchStatus.PENDING,
        or_(Match.user_a_id == user.id, Match.user_b_id == user.id)
    ).all()

    # Format the response
    match_responses = []
    for match in matches:
        # Determine which user is the "other" user
        if match.user_a_id == user.id:
            other_user = db.query(User).filter(User.id == match.user_b_id).first()
        else:
            other_user = db.query(User).filter(User.id == match.user_a_id).first()

        if not other_user:
            continue

        # Get the event
        event = db.query(Event).filter(Event.id == match.event_id).first()
        event_id_str = event.event_id if event else "unknown"

        match_responses.append(MatchResponse(
            match_id=match.id,
            user_id=other_user.id,
            username=other_user.username,
            wallet_address=other_user.wallet_address,
            compatibility_score=match.compatibility_score,
            dimension_alignment=match.dimension_alignment or {},
            proximity_overlap_minutes=match.proximity_overlap_minutes,
            event_id=event_id_str,
            status=match.status.value
        ))

    return match_responses

@router.post("/respond")
async def respond_to_match(request: RespondToMatchRequest, db: Session = Depends(get_db)):
    """
    Accept or reject a match

    If both users accept, create a Connection and mint NFT
    """
    # Get the match
    match = db.query(Match).filter(Match.id == request.match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Get the user
    user = db.query(User).filter(User.wallet_address == request.wallet_address).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Determine if the user is user_a or user_b
    is_user_a = match.user_a_id == user.id
    is_user_b = match.user_b_id == user.id

    if not is_user_a and not is_user_b:
        raise HTTPException(status_code=403, detail="User is not part of this match")

    # Check if user has already responded
    if is_user_a and match.user_a_responded_at:
        raise HTTPException(status_code=400, detail="You have already responded to this match")
    if is_user_b and match.user_b_responded_at:
        raise HTTPException(status_code=400, detail="You have already responded to this match")

    # Update match based on response
    current_time = datetime.utcnow()

    if is_user_a:
        match.user_a_accepted = request.accept
        match.user_a_responded_at = current_time
    else:
        match.user_b_accepted = request.accept
        match.user_b_responded_at = current_time

    # If user rejected, mark match as rejected
    if not request.accept:
        match.status = MatchStatus.REJECTED
        db.commit()
        return {
            "status": "rejected",
            "message": "Match rejected"
        }

    # User accepted - check if both users have accepted
    if match.user_a_accepted and match.user_b_accepted:
        # Both accepted! Create Connection and mint NFT
        match.status = MatchStatus.ACCEPTED

        # Get both users and event details
        user_a = db.query(User).filter(User.id == match.user_a_id).first()
        user_b = db.query(User).filter(User.id == match.user_b_id).first()
        event = db.query(Event).filter(Event.id == match.event_id).first()

        # Create Connection
        connection = Connection(
            match_id=match.id,
            user_a_id=match.user_a_id,
            user_b_id=match.user_b_id,
            event_id=match.event_id,
            pesobytes_earned=15 if match.compatibility_score >= 90 else 10
        )
        db.add(connection)
        db.commit()
        db.refresh(connection)

        # Mint NFT (async operation)
        # TODO: Generate metadata URI with connection details
        metadata_uri = f"ipfs://connection-{connection.id}"  # Placeholder

        nft_result = await web3_service.mint_connection_nft(
            user_a_address=user_a.wallet_address,
            user_b_address=user_b.wallet_address,
            event_id=event.event_id,
            metadata_uri=metadata_uri
        )

        if nft_result:
            connection.connection_nft_id = nft_result['token_id']
            connection.transaction_hash = nft_result['transaction_hash']
            connection.ipfs_metadata_uri = metadata_uri
            db.commit()

            return {
                "status": "connected",
                "message": "Match accepted! Connection created and NFT minted.",
                "connection": {
                    "id": connection.id,
                    "nft_id": connection.connection_nft_id,
                    "transaction_hash": connection.transaction_hash,
                    "pesobytes_earned": connection.pesobytes_earned
                }
            }
        else:
            # NFT minting failed, but connection is still created
            db.commit()
            return {
                "status": "connected",
                "message": "Match accepted! Connection created (NFT minting pending).",
                "connection": {
                    "id": connection.id,
                    "pesobytes_earned": connection.pesobytes_earned
                }
            }
    else:
        # Only one user has accepted so far
        db.commit()
        return {
            "status": "pending",
            "message": "Match accepted. Waiting for the other user to respond."
        }

@router.get("/history", response_model=List[MatchResponse])
async def get_match_history(wallet_address: str, db: Session = Depends(get_db)):
    """
    Get all past matches (accepted and rejected)
    """
    # Get the user by wallet address
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Query all matches where user is either user_a or user_b
    matches = db.query(Match).filter(
        or_(Match.user_a_id == user.id, Match.user_b_id == user.id)
    ).all()

    # Format the response
    match_responses = []
    for match in matches:
        # Determine which user is the "other" user
        if match.user_a_id == user.id:
            other_user = db.query(User).filter(User.id == match.user_b_id).first()
        else:
            other_user = db.query(User).filter(User.id == match.user_a_id).first()

        if not other_user:
            continue

        # Get the event
        event = db.query(Event).filter(Event.id == match.event_id).first()
        event_id_str = event.event_id if event else "unknown"

        match_responses.append(MatchResponse(
            match_id=match.id,
            user_id=other_user.id,
            username=other_user.username,
            wallet_address=other_user.wallet_address,
            compatibility_score=match.compatibility_score,
            dimension_alignment=match.dimension_alignment or {},
            proximity_overlap_minutes=match.proximity_overlap_minutes,
            event_id=event_id_str,
            status=match.status.value
        ))

    return match_responses
