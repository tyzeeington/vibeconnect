from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from pydantic import BaseModel
from typing import List, Dict, Optional
from datetime import datetime, timedelta

from app.database import get_db
from app.models import Match, MatchStatus, Connection, User, Event, UserProfile
from app.services.web3_service import web3_service
from app.middleware.security import limiter
from app.dependencies import get_current_user, get_optional_user
from app.utils.validation import validate_wallet_address

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
    event_name: str | None
    status: str
    created_at: str
    expires_at: str | None
    is_expired: bool
    time_remaining_hours: float | None

class RespondToMatchRequest(BaseModel):
    match_id: int
    wallet_address: str
    accept: bool

class MutualConnectionsResponse(BaseModel):
    user_a_wallet: str
    user_b_wallet: str
    mutual_connections_count: int
    mutual_connections: List[str]  # List of wallet addresses

class SocialLinksResponse(BaseModel):
    match_id: int
    connection_id: int | None
    other_user_wallet: str
    other_user_username: str | None
    social_profiles: Dict[str, str]
    can_access: bool
    message: str | None

# Helper function to calculate expiration info
def calculate_expiration_info(match: Match):
    """Calculate if match is expired and time remaining"""
    is_expired = False
    time_remaining_hours = None

    if match.expires_at:
        now = datetime.utcnow()
        if now > match.expires_at:
            is_expired = True
            time_remaining_hours = 0.0
        else:
            time_delta = match.expires_at - now
            time_remaining_hours = time_delta.total_seconds() / 3600

    return is_expired, time_remaining_hours

# Helper function to build MatchResponse
def build_match_response(match: Match, current_user_id: int, db: Session) -> MatchResponse:
    """Build a MatchResponse object from a Match"""
    # Determine which user is the "other" user
    if match.user_a_id == current_user_id:
        other_user = db.query(User).filter(User.id == match.user_b_id).first()
    else:
        other_user = db.query(User).filter(User.id == match.user_a_id).first()

    if not other_user:
        return None

    # Get the event
    event = db.query(Event).filter(Event.id == match.event_id).first()
    event_id_str = event.event_id if event else "unknown"
    event_name = event.venue_name if event else None

    # Calculate expiration info
    is_expired, time_remaining_hours = calculate_expiration_info(match)

    return MatchResponse(
        match_id=match.id,
        user_id=other_user.id,
        username=other_user.username,
        wallet_address=other_user.wallet_address,
        compatibility_score=match.compatibility_score,
        dimension_alignment=match.dimension_alignment or {},
        proximity_overlap_minutes=match.proximity_overlap_minutes,
        event_id=event_id_str,
        event_name=event_name,
        status=match.status.value,
        created_at=match.created_at.isoformat() if match.created_at else "",
        expires_at=match.expires_at.isoformat() if match.expires_at else None,
        is_expired=is_expired,
        time_remaining_hours=round(time_remaining_hours, 2) if time_remaining_hours is not None else None
    )

@router.get("/pending", response_model=List[MatchResponse])
@limiter.limit("100/hour")
async def get_pending_matches(request: Request, wallet_address: str, db: Session = Depends(get_db)):
    """
    Get pending matches for a user after an event
    (Deprecated: Use /matches/?status=pending instead)
    """
    # Get the user by wallet address
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for expired matches and update their status
    now = datetime.utcnow()
    expired_matches = db.query(Match).filter(
        Match.status == MatchStatus.PENDING,
        Match.expires_at.isnot(None),
        Match.expires_at < now,
        or_(Match.user_a_id == user.id, Match.user_b_id == user.id)
    ).all()

    for match in expired_matches:
        match.status = MatchStatus.EXPIRED

    if expired_matches:
        db.commit()

    # Query all pending matches where user is either user_a or user_b
    matches = db.query(Match).filter(
        Match.status == MatchStatus.PENDING,
        or_(Match.user_a_id == user.id, Match.user_b_id == user.id)
    ).all()

    # Format the response using helper function
    match_responses = []
    for match in matches:
        response = build_match_response(match, user.id, db)
        if response:
            match_responses.append(response)

    return match_responses

@router.post("/respond")
@limiter.limit("100/hour")
async def respond_to_match(req: Request, request: RespondToMatchRequest, db: Session = Depends(get_db)):
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
            metadata_uri=metadata_uri,
            compatibility_score=int(match.compatibility_score)
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
@limiter.limit("100/hour")
async def get_match_history(request: Request, wallet_address: str, db: Session = Depends(get_db)):
    """
    Get all past matches (accepted and rejected)
    (Deprecated: Use /matches/ instead)
    """
    # Get the user by wallet address
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Query all matches where user is either user_a or user_b
    matches = db.query(Match).filter(
        or_(Match.user_a_id == user.id, Match.user_b_id == user.id)
    ).all()

    # Format the response using helper function
    match_responses = []
    for match in matches:
        response = build_match_response(match, user.id, db)
        if response:
            match_responses.append(response)

    return match_responses

@router.get("/", response_model=List[MatchResponse])
@limiter.limit("100/hour")
async def get_matches(
    request: Request,
    wallet_address: str,
    status: Optional[str] = Query(None, description="Filter by status: pending, accepted, rejected, expired"),
    event_id: Optional[str] = Query(None, description="Filter by event ID"),
    sort: Optional[str] = Query("newest", description="Sort by: newest, compatibility, expiring_soon"),
    limit: Optional[int] = Query(50, ge=1, le=100, description="Maximum number of results"),
    offset: Optional[int] = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(get_db)
):
    """
    Get all matches for a user with filtering, sorting, and pagination

    Query Parameters:
    - status: Filter by match status (pending, accepted, rejected, expired)
    - event_id: Filter by specific event
    - sort: Sort order (newest, compatibility, expiring_soon)
    - limit: Maximum number of results (default 50, max 100)
    - offset: Number of results to skip for pagination (default 0)
    """
    # Get the user by wallet address
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check for expired matches and update their status
    now = datetime.utcnow()
    expired_matches = db.query(Match).filter(
        Match.status == MatchStatus.PENDING,
        Match.expires_at.isnot(None),
        Match.expires_at < now,
        or_(Match.user_a_id == user.id, Match.user_b_id == user.id)
    ).all()

    for match in expired_matches:
        match.status = MatchStatus.EXPIRED

    if expired_matches:
        db.commit()

    # Build base query
    query = db.query(Match).filter(
        or_(Match.user_a_id == user.id, Match.user_b_id == user.id)
    )

    # Apply status filter
    if status:
        status_upper = status.upper()
        if status_upper == "PENDING":
            query = query.filter(Match.status == MatchStatus.PENDING)
        elif status_upper == "ACCEPTED":
            query = query.filter(Match.status == MatchStatus.ACCEPTED)
        elif status_upper == "REJECTED":
            query = query.filter(Match.status == MatchStatus.REJECTED)
        elif status_upper == "EXPIRED":
            query = query.filter(Match.status == MatchStatus.EXPIRED)
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid status. Must be one of: pending, accepted, rejected, expired"
            )

    # Apply event filter
    if event_id:
        event = db.query(Event).filter(Event.event_id == event_id).first()
        if event:
            query = query.filter(Match.event_id == event.id)
        else:
            # Return empty list if event not found
            return []

    # Apply sorting
    if sort == "newest":
        query = query.order_by(Match.created_at.desc())
    elif sort == "compatibility":
        query = query.order_by(Match.compatibility_score.desc())
    elif sort == "expiring_soon":
        # Sort by expires_at ascending (soonest first), nulls last
        query = query.order_by(Match.expires_at.asc().nullslast())
    else:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid sort. Must be one of: newest, compatibility, expiring_soon"
        )

    # Apply pagination
    matches = query.offset(offset).limit(limit).all()

    # Format the response using helper function
    match_responses = []
    for match in matches:
        response = build_match_response(match, user.id, db)
        if response:
            match_responses.append(response)

    return match_responses

@router.get("/mutual-connections", response_model=MutualConnectionsResponse)
@limiter.limit("100/hour")
async def get_mutual_connections(
    request: Request,
    user_a_wallet: str = Query(..., description="First user's wallet address"),
    user_b_wallet: str = Query(..., description="Second user's wallet address"),
    db: Session = Depends(get_db)
):
    """
    Get the count and list of mutual connections between two users

    Returns the number of connections that both users share in common.
    """
    # Get both users
    user_a = db.query(User).filter(User.wallet_address == user_a_wallet).first()
    user_b = db.query(User).filter(User.wallet_address == user_b_wallet).first()

    if not user_a:
        raise HTTPException(status_code=404, detail=f"User {user_a_wallet} not found")
    if not user_b:
        raise HTTPException(status_code=404, detail=f"User {user_b_wallet} not found")

    # Get all connections for user A
    user_a_connections = db.query(Connection).filter(
        or_(Connection.user_a_id == user_a.id, Connection.user_b_id == user_a.id)
    ).all()

    # Get all connections for user B
    user_b_connections = db.query(Connection).filter(
        or_(Connection.user_a_id == user_b.id, Connection.user_b_id == user_b.id)
    ).all()

    # Extract connected user IDs for each user
    user_a_connected_ids = set()
    for conn in user_a_connections:
        if conn.user_a_id == user_a.id:
            user_a_connected_ids.add(conn.user_b_id)
        else:
            user_a_connected_ids.add(conn.user_a_id)

    user_b_connected_ids = set()
    for conn in user_b_connections:
        if conn.user_a_id == user_b.id:
            user_b_connected_ids.add(conn.user_b_id)
        else:
            user_b_connected_ids.add(conn.user_a_id)

    # Find mutual connections
    mutual_ids = user_a_connected_ids & user_b_connected_ids

    # Get wallet addresses for mutual connections
    mutual_wallets = []
    if mutual_ids:
        mutual_users = db.query(User).filter(User.id.in_(mutual_ids)).all()
        mutual_wallets = [u.wallet_address for u in mutual_users]

    return MutualConnectionsResponse(
        user_a_wallet=user_a_wallet,
        user_b_wallet=user_b_wallet,
        mutual_connections_count=len(mutual_ids),
        mutual_connections=mutual_wallets
    )

@router.get("/{match_id}/follow-all", response_model=SocialLinksResponse)
@limiter.limit("100/hour")
async def get_follow_all_links(
    request: Request,
    match_id: int,
    requester_wallet: str = Query(..., description="Wallet address of the requester"),
    db: Session = Depends(get_db)
):
    """
    Get all social media links for a match (Follow All action)

    Returns social profiles if:
    1. The match has been accepted (both users accepted)
    2. A connection exists between the users
    3. The requester is part of this match
    """
    # Get the match
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match:
        raise HTTPException(status_code=404, detail="Match not found")

    # Get the requester
    requester = db.query(User).filter(User.wallet_address == requester_wallet).first()
    if not requester:
        raise HTTPException(status_code=404, detail="Requester not found")

    # Verify requester is part of this match
    if requester.id != match.user_a_id and requester.id != match.user_b_id:
        raise HTTPException(status_code=403, detail="You are not part of this match")

    # Determine the other user
    if requester.id == match.user_a_id:
        other_user = db.query(User).filter(User.id == match.user_b_id).first()
    else:
        other_user = db.query(User).filter(User.id == match.user_a_id).first()

    if not other_user:
        raise HTTPException(status_code=404, detail="Other user not found")

    # Check if there's an accepted connection
    connection = db.query(Connection).filter(
        Connection.match_id == match_id
    ).first()

    # Get other user's profile
    other_profile = db.query(UserProfile).filter(UserProfile.user_id == other_user.id).first()

    # Determine if social links can be accessed
    can_access = False
    message = None
    social_profiles = {}

    if not other_profile:
        message = "User has not set up their profile yet"
    elif match.status != MatchStatus.ACCEPTED or not connection:
        message = "Social profiles are only available for accepted connections"
    else:
        # Check visibility settings
        if other_profile.social_visibility == "public":
            can_access = True
            social_profiles = other_profile.social_profiles or {}
        elif other_profile.social_visibility == "connection_only":
            # Connection exists, so unlock social profiles
            can_access = True
            social_profiles = other_profile.social_profiles or {}
            message = "Social profiles unlocked through your connection"
        else:
            message = "Social profiles are not available"

    return SocialLinksResponse(
        match_id=match_id,
        connection_id=connection.id if connection else None,
        other_user_wallet=other_user.wallet_address,
        other_user_username=other_user.username,
        social_profiles=social_profiles,
        can_access=can_access,
        message=message
    )
