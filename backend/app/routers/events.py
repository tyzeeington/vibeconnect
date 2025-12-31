from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import Event, EventCheckIn, User

router = APIRouter()

class CheckInRequest(BaseModel):
    event_id: str
    user_id: int  # In production, this would come from JWT token
    latitude: float
    longitude: float
    venue_name: str = "Unknown Venue"  # Optional venue name for event creation

class EventResponse(BaseModel):
    event_id: str
    venue_name: str
    latitude: float
    longitude: float
    attendees_count: int

@router.post("/checkin")
async def check_in(request: CheckInRequest, db: Session = Depends(get_db)):
    """
    Check into an event

    Creates the event if it doesn't exist and records the user's check-in
    """
    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Create event if doesn't exist
    event = db.query(Event).filter(Event.event_id == request.event_id).first()
    if not event:
        event = Event(
            event_id=request.event_id,
            venue_name=request.venue_name,
            latitude=request.latitude,
            longitude=request.longitude,
            created_at=datetime.utcnow()
        )
        db.add(event)
        db.commit()
        db.refresh(event)

    # Check if user already has an active check-in (no check-out time)
    existing_checkin = db.query(EventCheckIn).filter(
        EventCheckIn.user_id == request.user_id,
        EventCheckIn.event_id == event.id,
        EventCheckIn.check_out_time.is_(None)
    ).first()

    if existing_checkin:
        raise HTTPException(
            status_code=400,
            detail="User already checked into this event. Please check out first."
        )

    # Create check-in record
    check_in_record = EventCheckIn(
        user_id=request.user_id,
        event_id=event.id,
        latitude=request.latitude,
        longitude=request.longitude,
        check_in_time=datetime.utcnow()
    )
    db.add(check_in_record)
    db.commit()
    db.refresh(check_in_record)

    return {
        "status": "checked_in",
        "event_id": request.event_id,
        "check_in_id": check_in_record.id,
        "check_in_time": check_in_record.check_in_time.isoformat()
    }

@router.post("/checkout")
async def check_out(event_id: str):
    """
    Check out of an event
    """
    # TODO: Update check-in record with checkout time
    return {"status": "checked_out", "event_id": event_id}

@router.get("/active", response_model=List[EventResponse])
async def get_active_events(latitude: float, longitude: float, radius_km: float = 5.0):
    """
    Get active events near a location
    """
    # TODO: Query events within radius
    return []
