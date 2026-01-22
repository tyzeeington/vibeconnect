"""
Admin Events Router
Endpoints for managing and syncing events from external sources
"""

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from app.database import get_db
from app.services.external_events import EDMTrainService, get_event_service
from app.middleware.security import limiter

router = APIRouter()


class SyncEventsRequest(BaseModel):
    source: str = "edmtrain"  # "edmtrain" or "posh"
    city: Optional[str] = None
    state: Optional[str] = None
    max_events: int = 50


class SyncEventsResponse(BaseModel):
    status: str
    events_synced: int
    message: str


@router.post("/sync", response_model=SyncEventsResponse)
@limiter.limit("5/hour")  # Limit to prevent API abuse
async def sync_events_from_external(
    request: Request,
    sync_request: SyncEventsRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """
    Sync events from external sources (EDMTrain, Posh, etc.)

    This endpoint fetches events from external APIs and adds them to the database.

    Args:
        sync_request: Configuration for event sync
        db: Database session

    Returns:
        Sync status and number of events added

    Example:
        POST /api/admin/events/sync
        {
            "source": "edmtrain",
            "city": "New York",
            "state": "NY",
            "max_events": 50
        }

    Note:
        - Requires valid API key for the selected source
        - Set EDMTRAIN_API_KEY environment variable for EDMTrain
        - Get EDMTrain API key at: https://edmtrain.com/developer-api
    """
    try:
        if sync_request.source.lower() == "edmtrain":
            service = EDMTrainService()

            # Check if API key is configured
            if not service.api_key:
                return SyncEventsResponse(
                    status="error",
                    events_synced=0,
                    message=(
                        "EDMTrain API key not configured. "
                        "Get your key at https://edmtrain.com/developer-api "
                        "and set EDMTRAIN_API_KEY environment variable"
                    )
                )

            events_synced = await service.sync_events_to_database(
                db=db,
                city=sync_request.city,
                state=sync_request.state,
                max_events=sync_request.max_events
            )

            return SyncEventsResponse(
                status="success",
                events_synced=events_synced,
                message=f"Successfully synced {events_synced} events from EDMTrain"
            )

        elif sync_request.source.lower() == "posh":
            return SyncEventsResponse(
                status="error",
                events_synced=0,
                message=(
                    "Posh API integration not yet implemented. "
                    "Contact Posh support for API access: ragel@posh.vip"
                )
            )

        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unknown event source: {sync_request.source}. Supported: edmtrain, posh"
            )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync events: {str(e)}"
        )


@router.get("/locations")
@limiter.limit("20/hour")
async def get_edmtrain_locations(
    request: Request,
    city: Optional[str] = None,
    state: Optional[str] = None
):
    """
    Get available locations from EDMTrain

    Args:
        city: Filter by city name
        state: Filter by state abbreviation

    Returns:
        List of available EDMTrain locations

    Example:
        GET /api/admin/events/locations?state=NY
    """
    try:
        service = EDMTrainService()

        if not service.api_key:
            raise HTTPException(
                status_code=400,
                detail=(
                    "EDMTrain API key not configured. "
                    "Get your key at https://edmtrain.com/developer-api "
                    "and set EDMTRAIN_API_KEY environment variable"
                )
            )

        locations = await service.get_locations(city=city, state=state)
        return {
            "success": True,
            "count": len(locations),
            "locations": locations
        }

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch locations: {str(e)}")
