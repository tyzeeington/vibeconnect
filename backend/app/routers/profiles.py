from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from pydantic import BaseModel

from app.database import get_db
from app.models import User, UserProfile
from app.services.ai_service import analyze_onboarding_responses, generate_conversational_onboarding

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
async def get_onboarding_questions():
    """
    Get conversational onboarding questions for new users
    """
    questions = await generate_conversational_onboarding()
    return {
        "questions": questions,
        "instructions": "Answer these questions naturally. We'll use AI to build your personality profile."
    }

@router.post("/onboard", response_model=ProfileResponse)
async def create_profile(
    profile_data: ProfileCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new user profile using AI analysis of onboarding responses
    """
    # Check if user already exists
    existing_user = db.query(User).filter(
        User.wallet_address == profile_data.wallet_address
    ).first()
    
    if existing_user and existing_user.profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists for this wallet"
        )
    
    # Analyze responses with AI
    ai_analysis = await analyze_onboarding_responses(profile_data.onboarding_responses)
    
    # Create user if doesn't exist
    if not existing_user:
        user = User(wallet_address=profile_data.wallet_address)
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
async def get_my_profile(
    wallet_address: str,  # In production, get this from JWT token
    db: Session = Depends(get_db)
):
    """
    Get the current user's profile
    """
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    
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

@router.put("/update", response_model=ProfileResponse)
async def update_profile(
    wallet_address: str,  # In production, get this from JWT token
    updates: ProfileUpdate,
    db: Session = Depends(get_db)
):
    """
    Update user's profile dimensions and intentions
    """
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    
    if not user or not user.profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found"
        )
    
    profile = user.profile
    
    # Update only provided fields
    if updates.goals is not None:
        profile.goals = updates.goals
    if updates.intuition is not None:
        profile.intuition = updates.intuition
    if updates.philosophy is not None:
        profile.philosophy = updates.philosophy
    if updates.expectations is not None:
        profile.expectations = updates.expectations
    if updates.leisure_time is not None:
        profile.leisure_time = updates.leisure_time
    if updates.intentions is not None:
        profile.intentions = updates.intentions
    if updates.bio is not None:
        profile.bio = updates.bio
    if updates.interests is not None:
        profile.interests = updates.interests
    
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

@router.get("/{wallet_address}", response_model=ProfileResponse)
async def get_user_profile(
    wallet_address: str,
    db: Session = Depends(get_db)
):
    """
    Get any user's public profile by wallet address
    """
    user = db.query(User).filter(User.wallet_address == wallet_address).first()
    
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
