from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from pydantic import BaseModel
from typing import List, Literal
from datetime import datetime, timedelta

from app.database import get_db
from app.models import User, UserProfile, Connection

router = APIRouter()


class LeaderboardEntry(BaseModel):
    rank: int
    wallet_address: str
    username: str | None
    total_connections: int
    total_pesobytes: int
    latest_connection_date: str | None
    profile_exists: bool


class LeaderboardResponse(BaseModel):
    leaderboard: List[LeaderboardEntry]
    total_users: int
    time_period: str
    updated_at: str


@router.get("/", response_model=LeaderboardResponse)
async def get_leaderboard(
    db: Session = Depends(get_db),
    sort_by: Literal["connections", "pesobytes"] = Query(
        default="connections",
        description="Sort by total connections or total PESOBytes earned"
    ),
    time_period: Literal["all_time", "monthly", "weekly"] = Query(
        default="all_time",
        description="Time period for leaderboard"
    ),
    limit: int = Query(default=100, ge=1, le=500, description="Number of top users to return")
):
    """
    Get leaderboard of top connectors.

    - **sort_by**: Sort by 'connections' (connection count) or 'pesobytes' (total PESO earned)
    - **time_period**: Filter by 'all_time', 'monthly', or 'weekly'
    - **limit**: Number of top users to return (max 500)
    """

    # Calculate date filter based on time period
    date_filter = None
    if time_period == "weekly":
        date_filter = datetime.utcnow() - timedelta(days=7)
    elif time_period == "monthly":
        date_filter = datetime.utcnow() - timedelta(days=30)

    # Build query to aggregate user stats
    # We need to join User with Connection to count connections and sum PESOBytes
    query = db.query(
        User.id,
        User.wallet_address,
        User.username,
        func.count(Connection.id).label('total_connections'),
        func.sum(Connection.pesobytes_earned).label('total_pesobytes'),
        func.max(Connection.created_at).label('latest_connection_date')
    ).outerjoin(
        Connection,
        or_(Connection.user_a_id == User.id, Connection.user_b_id == User.id)
    )

    # Apply time period filter
    if date_filter:
        query = query.filter(Connection.created_at >= date_filter)

    # Group by user
    query = query.group_by(User.id, User.wallet_address, User.username)

    # Sort by connections or pesobytes
    if sort_by == "connections":
        query = query.order_by(desc('total_connections'))
    else:  # sort_by == "pesobytes"
        query = query.order_by(desc('total_pesobytes'))

    # Limit results
    query = query.limit(limit)

    # Execute query
    results = query.all()

    # Get total number of users with at least one connection
    total_users_query = db.query(func.count(func.distinct(User.id))).join(
        Connection,
        or_(Connection.user_a_id == User.id, Connection.user_b_id == User.id)
    )

    if date_filter:
        total_users_query = total_users_query.filter(Connection.created_at >= date_filter)

    total_users = total_users_query.scalar() or 0

    # Check which users have profiles
    user_ids = [result[0] for result in results]
    profiles = db.query(UserProfile.user_id).filter(UserProfile.user_id.in_(user_ids)).all()
    profile_user_ids = {p[0] for p in profiles}

    # Build leaderboard entries
    leaderboard = []
    for rank, result in enumerate(results, start=1):
        user_id, wallet, username, connections, pesobytes, latest_date = result

        leaderboard.append(LeaderboardEntry(
            rank=rank,
            wallet_address=wallet,
            username=username,
            total_connections=connections or 0,
            total_pesobytes=int(pesobytes) if pesobytes else 0,
            latest_connection_date=latest_date.isoformat() if latest_date else None,
            profile_exists=user_id in profile_user_ids
        ))

    return LeaderboardResponse(
        leaderboard=leaderboard,
        total_users=total_users,
        time_period=time_period,
        updated_at=datetime.utcnow().isoformat()
    )


@router.get("/user/{wallet_address}", response_model=dict)
async def get_user_rank(
    wallet_address: str,
    db: Session = Depends(get_db),
    sort_by: Literal["connections", "pesobytes"] = Query(default="connections"),
    time_period: Literal["all_time", "monthly", "weekly"] = Query(default="all_time")
):
    """
    Get a specific user's rank and stats on the leaderboard.
    """

    # Find the user
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    if not user:
        return {
            "found": False,
            "message": "User not found"
        }

    # Calculate date filter
    date_filter = None
    if time_period == "weekly":
        date_filter = datetime.utcnow() - timedelta(days=7)
    elif time_period == "monthly":
        date_filter = datetime.utcnow() - timedelta(days=30)

    # Get user's stats
    user_stats_query = db.query(
        func.count(Connection.id).label('total_connections'),
        func.sum(Connection.pesobytes_earned).label('total_pesobytes'),
        func.max(Connection.created_at).label('latest_connection_date')
    ).filter(
        or_(Connection.user_a_id == user.id, Connection.user_b_id == user.id)
    )

    if date_filter:
        user_stats_query = user_stats_query.filter(Connection.created_at >= date_filter)

    user_stats = user_stats_query.first()
    total_connections = user_stats[0] or 0
    total_pesobytes = int(user_stats[1]) if user_stats[1] else 0

    # Calculate rank
    # Count how many users have more connections/pesobytes
    rank_query = db.query(
        User.id,
        func.count(Connection.id).label('total_connections'),
        func.sum(Connection.pesobytes_earned).label('total_pesobytes')
    ).outerjoin(
        Connection,
        or_(Connection.user_a_id == User.id, Connection.user_b_id == User.id)
    )

    if date_filter:
        rank_query = rank_query.filter(Connection.created_at >= date_filter)

    rank_query = rank_query.group_by(User.id)

    all_users = rank_query.all()

    # Sort and find rank
    if sort_by == "connections":
        all_users.sort(key=lambda x: x[1] or 0, reverse=True)
        user_rank = next((i + 1 for i, u in enumerate(all_users) if u[0] == user.id), None)
    else:
        all_users.sort(key=lambda x: x[2] or 0, reverse=True)
        user_rank = next((i + 1 for i, u in enumerate(all_users) if u[0] == user.id), None)

    return {
        "found": True,
        "rank": user_rank,
        "wallet_address": user.wallet_address,
        "username": user.username,
        "total_connections": total_connections,
        "total_pesobytes": total_pesobytes,
        "latest_connection_date": user_stats[2].isoformat() if user_stats[2] else None,
        "total_users": len(all_users)
    }


# Helper to fix the or_ import
from sqlalchemy import or_
