from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
from datetime import datetime

from app.database import get_db
from app.models import User, UserProfile
from app.services.ai_service import analyze_onboarding_responses
from app.services.session_service import SessionService

router = APIRouter()

class ChatStartRequest(BaseModel):
    wallet_address: str

class ChatMessageRequest(BaseModel):
    wallet_address: str
    session_id: str
    message: str
    dimension: Optional[str] = None

class ChatCompleteRequest(BaseModel):
    wallet_address: str
    session_id: str

class ChatResponse(BaseModel):
    session_id: str
    message: str
    current_dimension: Optional[str] = None
    dimension_index: int
    total_dimensions: int
    is_complete: bool
    progress_percentage: float

class ProfileCreatedResponse(BaseModel):
    success: bool
    profile_id: int
    dimensions: Dict[str, float]
    intentions: List[str]
    insights: str

DIMENSIONS = [
    {
        "key": "goals",
        "label": "Goals",
        "question": "Let's start! What are your main goals in life right now? What are you working toward or building?",
        "follow_up": "Thanks for sharing! "
    },
    {
        "key": "intuition",
        "label": "Intuition",
        "question": "How do you typically make important decisions? Do you trust your gut feelings, analyze data, or something else?",
        "follow_up": "Interesting! "
    },
    {
        "key": "philosophy",
        "label": "Philosophy",
        "question": "What's your philosophy or outlook on life? What principles guide how you live?",
        "follow_up": "I appreciate that perspective! "
    },
    {
        "key": "expectations",
        "label": "Expectations",
        "question": "What do you look for in meaningful connections? What matters most to you in relationships?",
        "follow_up": "That makes sense! "
    },
    {
        "key": "leisure_time",
        "label": "Leisure",
        "question": "How do you spend your free time? What activities energize or fulfill you?",
        "follow_up": "Great! "
    }
]

@router.post("/start", response_model=ChatResponse)
async def start_chat_session(
    request: ChatStartRequest,
    db: Session = Depends(get_db)
):
    """
    Start a new chat session for profile creation
    """
    # Check if user already has a profile
    existing_user = db.query(User).filter(
        User.wallet_address == request.wallet_address
    ).first()

    if existing_user and existing_user.profile:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Profile already exists for this wallet"
        )

    # Create session
    session_id = f"{request.wallet_address}_{datetime.now().timestamp()}"
    session_data = {
        "wallet_address": request.wallet_address,
        "current_dimension_index": 0,
        "responses": {},
        "started_at": datetime.now().isoformat()
    }

    # Store session in Redis with 1 hour TTL
    SessionService.store_chat_session(session_id, session_data, ttl=3600)

    return ChatResponse(
        session_id=session_id,
        message=f"Hi! I'm here to help build your VibeConnect profile. I'll ask you questions about 5 key dimensions of your personality. Ready to start?\n\n{DIMENSIONS[0]['question']}",
        current_dimension=DIMENSIONS[0]['key'],
        dimension_index=0,
        total_dimensions=len(DIMENSIONS),
        is_complete=False,
        progress_percentage=0.0
    )

@router.post("/message", response_model=ChatResponse)
async def send_chat_message(
    request: ChatMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Send a message in the chat session and get the next question
    """
    # Get session from Redis
    session = SessionService.get_chat_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or expired"
        )

    # Verify wallet matches session
    if session["wallet_address"] != request.wallet_address:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to chat session"
        )

    current_index = session["current_dimension_index"]
    current_dimension = DIMENSIONS[current_index]

    # Save the user's response
    session["responses"][current_dimension["key"]] = request.message.strip()

    # Move to next dimension
    next_index = current_index + 1

    if next_index < len(DIMENSIONS):
        # More questions to ask
        session["current_dimension_index"] = next_index
        next_dimension = DIMENSIONS[next_index]

        # Update session in Redis
        SessionService.store_chat_session(request.session_id, session, ttl=3600)

        progress = ((next_index) / len(DIMENSIONS)) * 100

        return ChatResponse(
            session_id=request.session_id,
            message=f"{current_dimension['follow_up']}{next_dimension['question']}",
            current_dimension=next_dimension['key'],
            dimension_index=next_index,
            total_dimensions=len(DIMENSIONS),
            is_complete=False,
            progress_percentage=progress
        )
    else:
        # All questions answered
        # Update session in Redis
        SessionService.store_chat_session(request.session_id, session, ttl=3600)

        progress = 100.0

        return ChatResponse(
            session_id=request.session_id,
            message="Perfect! I have all the information I need. Let me analyze your responses and create your personality profile...",
            current_dimension=None,
            dimension_index=len(DIMENSIONS),
            total_dimensions=len(DIMENSIONS),
            is_complete=True,
            progress_percentage=progress
        )

@router.post("/complete", response_model=ProfileCreatedResponse)
async def complete_chat_session(
    request: ChatCompleteRequest,
    db: Session = Depends(get_db)
):
    """
    Complete the chat session and create the user profile with AI analysis
    """
    # Get session from Redis
    session = SessionService.get_chat_session(request.session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found or expired"
        )

    # Verify wallet matches session
    if session["wallet_address"] != request.wallet_address:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized access to chat session"
        )

    # Check if all dimensions were answered
    if len(session["responses"]) < len(DIMENSIONS):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not all questions have been answered"
        )

    # Format responses for AI analysis
    responses_text = "\n\n".join([
        f"{dim['label']}: {session['responses'].get(dim['key'], 'No response')}"
        for dim in DIMENSIONS
    ])

    # Analyze with AI
    ai_analysis = await analyze_onboarding_responses(responses_text)

    # Create user if doesn't exist
    existing_user = db.query(User).filter(
        User.wallet_address == request.wallet_address
    ).first()

    if not existing_user:
        user = User(wallet_address=request.wallet_address)
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user = existing_user

        # Double-check they don't have a profile
        if user.profile:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile already exists"
            )

    # Create profile
    profile = UserProfile(
        user_id=user.id,
        goals=ai_analysis['dimensions']['goals'],
        intuition=ai_analysis['dimensions']['intuition'],
        philosophy=ai_analysis['dimensions']['philosophy'],
        expectations=ai_analysis['dimensions']['expectations'],
        leisure_time=ai_analysis['dimensions']['leisure_time'],
        intentions=ai_analysis.get('intentions', []),
        bio=ai_analysis.get('insights', ''),
        profile_confidence=0.3  # Initial confidence
    )

    db.add(profile)
    db.commit()
    db.refresh(profile)

    # Clean up session from Redis
    SessionService.delete_chat_session(request.session_id)

    return ProfileCreatedResponse(
        success=True,
        profile_id=profile.id,
        dimensions={
            'goals': profile.goals,
            'intuition': profile.intuition,
            'philosophy': profile.philosophy,
            'expectations': profile.expectations,
            'leisure_time': profile.leisure_time
        },
        intentions=profile.intentions,
        insights=profile.bio
    )

@router.get("/dimensions")
async def get_dimensions():
    """
    Get the list of personality dimensions
    """
    return {
        "dimensions": [
            {
                "key": dim["key"],
                "label": dim["label"],
                "question": dim["question"]
            }
            for dim in DIMENSIONS
        ],
        "total": len(DIMENSIONS)
    }

@router.delete("/session/{session_id}")
async def delete_chat_session(session_id: str, wallet_address: str):
    """
    Delete/cancel a chat session
    """
    session = SessionService.get_chat_session(session_id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat session not found"
        )

    if session["wallet_address"] != wallet_address:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Unauthorized"
        )

    SessionService.delete_chat_session(session_id)
    return {"success": True, "message": "Session deleted"}
