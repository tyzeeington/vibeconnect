from fastapi import APIRouter, Depends, HTTPException, status, Request
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import math

from app.database import get_db
from app.models import Event, EventCheckIn, User
from app.middleware.security import limiter
from app.utils.validation import validate_coordinates, validate_event_id

router = APIRouter()

class CheckInRequest(BaseModel):
    event_id: str
    user_id: int  # In production, this would come from JWT token
    latitude: float
    longitude: float
    venue_name: str = "Unknown Venue"  # Optional venue name for event creation

class CheckOutRequest(BaseModel):
    user_id: int
    event_id: str

class EventResponse(BaseModel):
    event_id: str
    venue_name: str
    latitude: float
    longitude: float
    attendees_count: int

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two GPS coordinates in kilometers using Haversine formula
    """
    R = 6371  # Earth's radius in kilometers

    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi/2)**2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

    return R * c

@router.post("/checkin")
@limiter.limit("60/hour")
async def check_in(req: Request, request: CheckInRequest, db: Session = Depends(get_db)):
    """
    Check into an event

    Creates the event if it doesn't exist and records the user's check-in
    """
    # Validate inputs
    validated_event_id = validate_event_id(request.event_id)
    validate_coordinates(request.latitude, request.longitude)

    # Verify user exists
    user = db.query(User).filter(User.id == request.user_id).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

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
            status_code=status.HTTP_400_BAD_REQUEST,
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
@limiter.limit("60/hour")
async def check_out(req: Request, request: CheckOutRequest, db: Session = Depends(get_db)):
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
@limiter.limit("100/hour")
async def get_active_events(
    request: Request,
    latitude: float,
    longitude: float,
    radius_km: float = 5.0,
    db: Session = Depends(get_db)
):
    """
    Get active events near a location within specified radius

    Args:
        latitude: User's current latitude
        longitude: User's current longitude
        radius_km: Search radius in kilometers (default: 5.0)
        db: Database session

    Returns:
        List of active events within the specified radius with attendee counts
    """
    # Validate coordinates
    validate_coordinates(latitude, longitude)

    # Query all events
    all_events = db.query(Event).all()

    # Filter events within radius
    nearby_events = []
    for event in all_events:
        distance = haversine_distance(latitude, longitude, event.latitude, event.longitude)
        if distance <= radius_km:
            # Count active attendees (checked in but not checked out)
            active_attendees = db.query(EventCheckIn).filter(
                EventCheckIn.event_id == event.id,
                EventCheckIn.check_out_time.is_(None)
            ).count()

            nearby_events.append(EventResponse(
                event_id=event.event_id,
                venue_name=event.venue_name,
                latitude=event.latitude,
                longitude=event.longitude,
                attendees_count=active_attendees
            ))

    return nearby_events
