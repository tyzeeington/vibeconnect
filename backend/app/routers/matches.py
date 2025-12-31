from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import or_

from ..database import get_db
from ..models import Match, User, Event, MatchStatus

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
async def respond_to_match(request: RespondToMatchRequest):
    """
    Accept or reject a match
    
    If both users accept, create a Connection and mint NFT
    """
    # TODO: Update match status
    # TODO: If both accepted, create Connection and mint NFT
    return {"status": "accepted" if request.accept else "rejected"}

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
