from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List, Dict

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
async def get_pending_matches(wallet_address: str):
    """
    Get pending matches for a user after an event
    """
    # TODO: Query matches where status = pending
    # TODO: Use matching_service to calculate compatibility
    return []

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
