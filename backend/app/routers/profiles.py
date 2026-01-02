from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Dict
from pydantic import BaseModel

from app.database import get_db
from app.models import User, UserProfile
from app.services.ai_service import analyze_onboarding_responses, generate_conversational_onboarding
from app.middleware.security import limiter
from app.dependencies import get_current_user, get_optional_user, require_profile
from app.utils.validation import (
    sanitize_text,
    validate_wallet_address,
    sanitize_social_profiles,
    validate_dimension_value
)

router = APIRouter()

# Pydantic schemas for request/response
class ProfileCreate(BaseModel):
    wallet_address: str
    onboarding_responses: str  # User's text responses to onboarding questions
    
class ProfileUpdate(BaseModel):
    goals: float | None = None
    intuition: float | None = None
    philosophy: float | None = None
    expectations: float | None = None
    leisure_time: float | None = None
    intentions: List[str] | None = None
    bio: str | None = None
    interests: List[str] | None = None

class SocialProfilesUpdate(BaseModel):
    social_profiles: Dict[str, str]  # {"instagram": "@handle", "twitter": "@handle", etc.}
    social_visibility: str = "connection_only"  # "public" or "connection_only"

class ProfileResponse(BaseModel):
    id: int
    wallet_address: str
    username: str | None
    dimensions: Dict[str, float]
    intentions: List[str]
    bio: str | None
    total_connections: int
    profile_confidence: float
    
    class Config:
        from_attributes = True

@router.get("/onboarding-questions")
@limiter.limit("100/hour")
async def get_onboarding_questions(request: Request):
    """
    Get conversational onboarding questions for new users
    """
    questions = await generate_conversational_onboarding()
    return {
        "questions": questions,
        "instructions": "Answer these questions naturally. We'll use AI to build your personality profile."
    }

@router.post("/onboard", response_model=ProfileResponse)
@limiter.limit("5/hour")
async def create_profile(
    request: Request,
    profile_data: ProfileCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new user profile using AI analysis of onboarding responses
    """
    # Validate and sanitize inputs
    validated_wallet = validate_wallet_address(profile_data.wallet_address)
    sanitized_responses = sanitize_text(profile_data.onboarding_responses, max_length=5000)

    # Check if user already exists
    existing_user = db.query(User).filter(
        User.wallet_address == validated_wallet
    ).first()
    
    if existing_user and existing_user.profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists for this wallet"
        )
    
    # Analyze responses with AI
    ai_analysis = await analyze_onboarding_responses(sanitized_responses)
    
    # Create user if doesn't exist
    if not existing_user:
        user = User(wallet_address=validated_wallet)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user = existing_user
    
    # Create profile
    profile = UserProfile(
        user_id=user.id,
        goals=ai_analysis['dimensions']['goals'],
        intuition=ai_analysis['dimensions']['intuition'],
        philosophy=ai_analysis['dimensions']['philosophy'],
        expectations=ai_analysis['dimensions']['expectations'],
        leisure_time=ai_analysis['dimensions']['leisure_time'],
        intentions=ai_analysis['intentions'],
        bio=ai_analysis.get('insights', ''),
        profile_confidence=0.3  # Initial confidence, will improve with connections
    )
    
    db.add(profile)
    db.commit()
    db.refresh(profile)
    
    return ProfileResponse(
        id=profile.id,
        wallet_address=user.wallet_address,
        username=user.username,
        dimensions={
            'goals': profile.goals,
            'intuition': profile.intuition,
            'philosophy': profile.philosophy,
            'expectations': profile.expectations,
            'leisure_time': profile.leisure_time
        },
        intentions=profile.intentions,
        bio=profile.bio,
        total_connections=profile.total_connections,
        profile_confidence=profile.profile_confidence
    )

@router.get("/me", response_model=ProfileResponse)
@limiter.limit("100/hour")
async def get_my_profile(
    request: Request,
    current_user: User = Depends(require_profile),
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile (requires authentication)
    """
    profile = current_user.profile

    return ProfileResponse(
        id=profile.id,
        wallet_address=current_user.wallet_address,
        username=current_user.username,
        dimensions={
            'goals': profile.goals,
            'intuition': profile.intuition,
            'philosophy': profile.philosophy,
            'expectations': profile.expectations,
            'leisure_time': profile.leisure_time
        },
        intentions=profile.intentions,
        bio=profile.bio,
        total_connections=profile.total_connections,
        profile_confidence=profile.profile_confidence
    )

@router.put("/update", response_model=ProfileResponse)
@limiter.limit("30/hour")
async def update_profile(
    request: Request,
    updates: ProfileUpdate,
    current_user: User = Depends(require_profile),
    db: Session = Depends(get_db)
):
    """
    Update user's profile dimensions and intentions (requires authentication)
    """
    profile = current_user.profile
    
    # Update only provided fields with validation
    if updates.goals is not None:
        profile.goals = validate_dimension_value(updates.goals, "goals")
    if updates.intuition is not None:
        profile.intuition = validate_dimension_value(updates.intuition, "intuition")
    if updates.philosophy is not None:
        profile.philosophy = validate_dimension_value(updates.philosophy, "philosophy")
    if updates.expectations is not None:
        profile.expectations = validate_dimension_value(updates.expectations, "expectations")
    if updates.leisure_time is not None:
        profile.leisure_time = validate_dimension_value(updates.leisure_time, "leisure_time")
    if updates.intentions is not None:
        profile.intentions = updates.intentions
    if updates.bio is not None:
        profile.bio = sanitize_text(updates.bio, max_length=500)
    if updates.interests is not None:
        profile.interests = updates.interests
    
    db.commit()
    db.refresh(profile)

    return ProfileResponse(
        id=profile.id,
        wallet_address=current_user.wallet_address,
        username=current_user.username,
        dimensions={
            'goals': profile.goals,
            'intuition': profile.intuition,
            'philosophy': profile.philosophy,
            'expectations': profile.expectations,
            'leisure_time': profile.leisure_time
        },
        intentions=profile.intentions,
        bio=profile.bio,
        total_connections=profile.total_connections,
        profile_confidence=profile.profile_confidence
    )

@router.get("/{wallet_address}", response_model=ProfileResponse)
@limiter.limit("100/hour")
async def get_user_profile(
    request: Request,
    wallet_address: str,
    db: Session = Depends(get_db)
):
    """
    Get any user's public profile by wallet address
    """
    # Validate wallet address
    validated_wallet = validate_wallet_address(wallet_address)

    user = db.query(User).filter(User.wallet_address == validated_wallet).first()
    
    if not user or not user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    profile = user.profile
    
    return ProfileResponse(
        id=profile.id,
        wallet_address=user.wallet_address,
        username=user.username,
        dimensions={
            'goals': profile.goals,
            'intuition': profile.intuition,
            'philosophy': profile.philosophy,
            'expectations': profile.expectations,
            'leisure_time': profile.leisure_time
        },
        intentions=profile.intentions,
        bio=profile.bio,
        total_connections=profile.total_connections,
        profile_confidence=profile.profile_confidence
    )

@router.put("/socials")
@limiter.limit("30/hour")
async def update_social_profiles(
    request: Request,
    socials: SocialProfilesUpdate,
    current_user: User = Depends(require_profile),
    db: Session = Depends(get_db)
):
    """
    Update user's social media profiles (requires authentication)
    """
    profile = current_user.profile

    # Validate visibility setting
    if socials.social_visibility not in ["public", "connection_only"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="social_visibility must be 'public' or 'connection_only'"
        )

    # Sanitize social profiles
    sanitized_profiles = sanitize_social_profiles(socials.social_profiles)

    # Update social profiles
    profile.social_profiles = sanitized_profiles
    profile.social_visibility = socials.social_visibility

    db.commit()
    db.refresh(profile)

    return {
        "success": True,
        "social_profiles": profile.social_profiles,
        "social_visibility": profile.social_visibility
    }

@router.get("/socials/{wallet_address}")
@limiter.limit("100/hour")
async def get_social_profiles(
    request: Request,
    wallet_address: str,
    current_user: User = Depends(get_optional_user),
    db: Session = Depends(get_db)
):
    """
    Get user's social profiles (respecting visibility settings)
    Returns social profiles only if:
    1. Visibility is public, OR
    2. Requester has an accepted connection with this user
    """
    # Validate wallet address
    validated_wallet = validate_wallet_address(wallet_address)

    user = db.query(User).filter(User.wallet_address == validated_wallet).first()

    if not user or not user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )

    profile = user.profile

    # Check visibility
    if profile.social_visibility == "public":
        return {
            "social_profiles": profile.social_profiles,
            "visibility": "public"
        }

    # Check if requester has accepted connection
    from app.models import Connection

    if not current_user:
        # No authenticated user, can only see public profiles
        return {
            "social_profiles": {},
            "visibility": "connection_only",
            "unlocked": False,
            "message": "Authentication required to view private social profiles"
        }
    
    connection = db.query(Connection).filter(
        (
            (Connection.user_a_id == user.id) &
            (Connection.user_b_id == current_user.id)
        ) | (
            (Connection.user_b_id == user.id) &
            (Connection.user_a_id == current_user.id)
        )
    ).first()

    if connection:
        return {
            "social_profiles": profile.social_profiles,
            "visibility": "connection_only",
            "unlocked": True
        }

    return {
        "social_profiles": {},
        "visibility": "connection_only",
        "unlocked": False,
        "message": "Connect with this user to unlock their social profiles"
    }
