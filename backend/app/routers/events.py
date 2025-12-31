from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime

from app.database import get_db
from app.models import EventCheckIn, Event, User

router = APIRouter()

class CheckInRequest(BaseModel):
    event_id: str
    latitude: float
    longitude: float

class CheckOutRequest(BaseModel):
    user_id: int
    event_id: str

class EventResponse(BaseModel):
    event_id: str
    venue_name: str
    latitude: float
    longitude: float
    attendees_count: int

@router.post("/checkin")
async def check_in(request: CheckInRequest):
    """
    Check into an event
    """
    # TODO: Create event if doesn't exist
    # TODO: Create check-in record
    return {"status": "checked_in", "event_id": request.event_id}

@router.post("/checkout")
async def check_out(request: CheckOutRequest, db: Session = Depends(get_db)):
    """
    Check out of an event
    Updates the check-in record with the current checkout time
    """
    # Find the event by event_id
    event = db.query(Event).filter(Event.event_id == request.event_id).first()
    if not event:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Event with id {request.event_id} not found"
        )

    # Find the active check-in record (where check_out_time is NULL)
    check_in = db.query(EventCheckIn).filter(
        EventCheckIn.user_id == request.user_id,
        EventCheckIn.event_id == event.id,
        EventCheckIn.check_out_time.is_(None)
    ).first()

    if not check_in:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No active check-in found for user {request.user_id} at event {request.event_id}"
        )

    # Update check-in record with checkout time
    check_in.check_out_time = datetime.utcnow()
    db.commit()
    db.refresh(check_in)

    return {
        "status": "checked_out",
        "event_id": request.event_id,
        "user_id": request.user_id,
        "check_in_time": check_in.check_in_time.isoformat(),
        "check_out_time": check_in.check_out_time.isoformat()
    }

@router.get("/active", response_model=List[EventResponse])
async def get_active_events(latitude: float, longitude: float, radius_km: float = 5.0):
    """
    Get active events near a location
    """
    # TODO: Query events within radius
    return []
