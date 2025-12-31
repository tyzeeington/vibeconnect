from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict

from app.database import get_db
from app.models import Match, User, Event, MatchStatus

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
async def get_pending_matches(
    wallet_address: str,
    db: Session = Depends(get_db)
):
    """
    Get pending matches for a user after an event
    """
    # Get the user
    user = db.query(User).filter(User.wallet_address == wallet_address).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Query matches where status = pending and user is either user_a or user_b
    pending_matches = db.query(Match).filter(
        Match.status == MatchStatus.PENDING,
        ((Match.user_a_id == user.id) | (Match.user_b_id == user.id))
    ).all()

    # Build response list
    results = []
    for match in pending_matches:
        # Determine which user is the "other" user
        if match.user_a_id == user.id:
            other_user = match.user_b
        else:
            other_user = match.user_a

        # Get event information
        event = match.event

        results.append(MatchResponse(
            match_id=match.id,
            user_id=other_user.id,
            username=other_user.username,
            wallet_address=other_user.wallet_address,
            compatibility_score=match.compatibility_score,
            dimension_alignment=match.dimension_alignment,
            proximity_overlap_minutes=match.proximity_overlap_minutes,
            event_id=event.event_id,
            status=match.status.value
        ))

    return results

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
async def get_match_history(wallet_address: str):
    """
    Get all past matches (accepted and rejected)
    """
    # TODO: Query all matches for user
    return []
