from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import math

from app.database import get_db
from app.models import Event, EventCheckIn

router = APIRouter()

class CheckInRequest(BaseModel):
    event_id: str
    latitude: float
    longitude: float

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
async def check_in(request: CheckInRequest):
    """
    Check into an event
    """
    # TODO: Create event if doesn't exist
    # TODO: Create check-in record
    return {"status": "checked_in", "event_id": request.event_id}

@router.post("/checkout")
async def check_out(event_id: str):
    """
    Check out of an event
    """
    # TODO: Update check-in record with checkout time
    return {"status": "checked_out", "event_id": event_id}

@router.get("/active", response_model=List[EventResponse])
async def get_active_events(
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
