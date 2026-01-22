"""
External Events Service
Fetches events from external APIs like EDMTrain, Posh, etc.
"""

import httpx
import os
from typing import List, Dict, Optional
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Event


class EDMTrainService:
    """Service for fetching events from EDMTrain API"""

    BASE_URL = "https://edmtrain.com/api"

    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize EDMTrain service

        Args:
            api_key: EDMTrain API key (get from https://edmtrain.com/developer-api)
                    If not provided, will try to load from environment variable EDMTRAIN_API_KEY
        """
        self.api_key = api_key or os.getenv("EDMTRAIN_API_KEY")

    async def fetch_events_by_location(
        self,
        location_id: Optional[int] = None,
        city: Optional[str] = None,
        state: Optional[str] = None,
        include_electronic: bool = True,
        festival_only: bool = False
    ) -> List[Dict]:
        """
        Fetch events from EDMTrain by location

        Args:
            location_id: EDMTrain location ID
            city: City name (e.g., "New York")
            state: State abbreviation (e.g., "NY")
            include_electronic: Include electronic music events
            festival_only: Only return festivals

        Returns:
            List of event dictionaries

        Note:
            Requires valid EDMTrain API key. Apply at https://edmtrain.com/developer-api
        """
        if not self.api_key:
            raise ValueError(
                "EDMTrain API key not configured. "
                "Get your key at https://edmtrain.com/developer-api "
                "and set EDMTRAIN_API_KEY environment variable"
            )

        params = {
            "client": self.api_key,
            "includeElectronicGenreInd": "true" if include_electronic else "false",
            "festivalInd": "true" if festival_only else "false"
        }

        if location_id:
            params["locationIds"] = location_id
        if city:
            params["city"] = city
        if state:
            params["state"] = state

        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.BASE_URL}/events", params=params)
            response.raise_for_status()
            data = response.json()

            if not data.get("success", False):
                raise Exception(f"EDMTrain API error: {data.get('message', 'Unknown error')}")

            return data.get("data", [])

    async def get_locations(self, city: Optional[str] = None, state: Optional[str] = None) -> List[Dict]:
        """
        Get available locations from EDMTrain

        Args:
            city: Filter by city name
            state: Filter by state abbreviation

        Returns:
            List of location dictionaries
        """
        if not self.api_key:
            raise ValueError("EDMTrain API key not configured")

        params = {"client": self.api_key}
        if city:
            params["city"] = city
        if state:
            params["state"] = state

        async with httpx.AsyncClient() as client:
            response = await client.get(f"{self.BASE_URL}/locations", params=params)
            response.raise_for_status()
            data = response.json()

            if not data.get("success", False):
                raise Exception(f"EDMTrain API error: {data.get('message', 'Unknown error')}")

            return data.get("data", [])

    def convert_to_vibeconnect_event(self, edmtrain_event: Dict) -> Dict:
        """
        Convert EDMTrain event format to VibeConnect event format

        Args:
            edmtrain_event: Event data from EDMTrain API

        Returns:
            Event dictionary compatible with VibeConnect Event model
        """
        # EDMTrain event structure (example):
        # {
        #   "id": 12345,
        #   "name": "Event Name",
        #   "date": "2026-01-25",
        #   "link": "https://edmtrain.com/...",
        #   "venue": {
        #     "name": "Venue Name",
        #     "location": "City, State",
        #     "latitude": 40.7128,
        #     "longitude": -74.0060
        #   },
        #   "ages": "21+",
        #   ...
        # }

        venue = edmtrain_event.get("venue", {})

        return {
            "event_id": f"edmtrain_{edmtrain_event.get('id')}",
            "venue_name": venue.get("name", "Unknown Venue"),
            "latitude": venue.get("latitude", 0.0),
            "longitude": venue.get("longitude", 0.0),
            "event_type": "Music",  # EDMTrain is music-focused
            "start_time": datetime.fromisoformat(edmtrain_event.get("date")) if edmtrain_event.get("date") else None,
            "end_time": None,  # EDMTrain doesn't always provide end time
        }

    async def sync_events_to_database(
        self,
        db: Session,
        city: str = None,
        state: str = None,
        max_events: int = 50
    ) -> int:
        """
        Fetch events from EDMTrain and sync to database

        Args:
            db: Database session
            city: City to fetch events for
            state: State to fetch events for
            max_events: Maximum number of events to sync

        Returns:
            Number of events synced
        """
        try:
            events_data = await self.fetch_events_by_location(city=city, state=state)
            synced_count = 0

            for edmtrain_event in events_data[:max_events]:
                event_dict = self.convert_to_vibeconnect_event(edmtrain_event)

                # Check if event already exists
                existing_event = db.query(Event).filter(
                    Event.event_id == event_dict["event_id"]
                ).first()

                if not existing_event:
                    event = Event(**event_dict, created_at=datetime.utcnow())
                    db.add(event)
                    synced_count += 1

            db.commit()
            return synced_count

        except Exception as e:
            db.rollback()
            raise Exception(f"Failed to sync events from EDMTrain: {str(e)}")


class PoshService:
    """Service for fetching events from Posh API"""

    # NOTE: Posh API documentation is not publicly available
    # This is a placeholder for future implementation
    # Contact Posh support (ragel@posh.vip) for API access

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("POSH_API_KEY")

    async def fetch_events(self) -> List[Dict]:
        """
        Fetch events from Posh API

        Note:
            Posh API documentation is not publicly available.
            Contact Posh support for API access: ragel@posh.vip
        """
        raise NotImplementedError(
            "Posh API integration not yet implemented. "
            "Contact Posh support for API access: ragel@posh.vip"
        )


# Factory function to get the appropriate service
def get_event_service(service_name: str = "edmtrain"):
    """
    Get external event service by name

    Args:
        service_name: Name of the service ("edmtrain" or "posh")

    Returns:
        Event service instance
    """
    if service_name.lower() == "edmtrain":
        return EDMTrainService()
    elif service_name.lower() == "posh":
        return PoshService()
    else:
        raise ValueError(f"Unknown event service: {service_name}")
