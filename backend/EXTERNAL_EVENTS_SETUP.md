# External Events Integration Setup

This guide explains how to integrate external event sources (EDMTrain, Posh) into VibeConnect.

## Overview

VibeConnect can pull real event data from external APIs to populate the events map with:
- **EDMTrain**: Electronic music concerts, festivals, and raves
- **Posh**: Nightlife and social events (coming soon)

## EDMTrain Integration

### 1. Get Your API Key

1. Visit https://edmtrain.com/developer-api
2. Review the API documentation at https://edmtrain.com/api-documentation
3. Review the API Terms of Use at https://edmtrain.com/api-terms-of-use
4. Apply for a Client API Key using the form on the developer page

**Important Terms:**
- For each event displayed, you must provide users with the event link from the API's response, unmodified
- Cached data should not be older than 24 hours when displayed

### 2. Configure Your Environment

Add your EDMTrain API key to your backend `.env` file:

```bash
# EDMTrain API Configuration
EDMTRAIN_API_KEY=your_api_key_here
```

### 3. Sync Events to Database

Use the admin API endpoint to sync events from EDMTrain:

**Endpoint:** `POST /api/admin/events/sync`

**Example Request:**
```bash
curl -X POST "http://localhost:8000/api/admin/events/sync" \
  -H "Content-Type: application/json" \
  -d '{
    "source": "edmtrain",
    "city": "New York",
    "state": "NY",
    "max_events": 50
  }'
```

**Example Response:**
```json
{
  "status": "success",
  "events_synced": 42,
  "message": "Successfully synced 42 events from EDMTrain"
}
```

**Parameters:**
- `source`: Event source ("edmtrain" or "posh")
- `city`: City name (optional, e.g., "New York")
- `state`: State abbreviation (optional, e.g., "NY")
- `max_events`: Maximum number of events to sync (default: 50)

### 4. Get Available Locations

To find available EDMTrain locations:

**Endpoint:** `GET /api/admin/events/locations`

**Example Request:**
```bash
curl "http://localhost:8000/api/admin/events/locations?state=NY"
```

**Example Response:**
```json
{
  "success": true,
  "count": 5,
  "locations": [
    {
      "id": 123,
      "city": "New York",
      "state": "NY",
      "country": "United States"
    },
    ...
  ]
}
```

## Posh Integration (Coming Soon)

Posh API integration is planned but not yet implemented.

**To request access to Posh API:**
- Contact: ragel@posh.vip
- Reference: https://docs.posh.vip

## Event Data Structure

### EDMTrain Event Conversion

EDMTrain events are automatically converted to VibeConnect format:

| EDMTrain Field | VibeConnect Field | Notes |
|----------------|-------------------|-------|
| `id` | `event_id` | Prefixed with "edmtrain_" |
| `venue.name` | `venue_name` | Venue name |
| `venue.latitude` | `latitude` | GPS coordinate |
| `venue.longitude` | `longitude` | GPS coordinate |
| `date` | `start_time` | Event start time |
| - | `event_type` | Always "Music" for EDMTrain |

### Database Schema

Events are stored in the `events` table with the following structure:

```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY,
    event_id VARCHAR UNIQUE,           -- e.g., "edmtrain_12345"
    venue_name VARCHAR NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL,
    event_type VARCHAR,                -- "Music", "Art", "Sports", "Food", "Networking"
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    created_at TIMESTAMP
);
```

## API Rate Limits

### Admin Endpoints

- **Sync Events:** 5 requests per hour
- **Get Locations:** 20 requests per hour

These limits prevent abuse and ensure compliance with external API terms.

## Best Practices

### 1. Regular Sync Schedule

Set up a cron job or background task to sync events daily:

```python
from app.services.external_events import EDMTrainService
from app.database import SessionLocal

async def daily_event_sync():
    db = SessionLocal()
    service = EDMTrainService()

    # Sync events for major cities
    cities = [
        ("New York", "NY"),
        ("Los Angeles", "CA"),
        ("Chicago", "IL"),
        ("Miami", "FL"),
    ]

    for city, state in cities:
        try:
            count = await service.sync_events_to_database(
                db=db,
                city=city,
                state=state,
                max_events=50
            )
            print(f"Synced {count} events for {city}, {state}")
        except Exception as e:
            print(f"Error syncing {city}: {e}")

    db.close()
```

### 2. Event Deduplication

The sync service automatically prevents duplicate events by checking `event_id` before insertion.

### 3. Cache Management

- Events are cached in the database
- Frontend caches active events for the user's location
- Sync events at least once per day to comply with EDMTrain terms (24-hour cache limit)

### 4. Error Handling

If EDMTrain API key is not configured, the sync endpoint will return:

```json
{
  "status": "error",
  "events_synced": 0,
  "message": "EDMTrain API key not configured. Get your key at https://edmtrain.com/developer-api and set EDMTRAIN_API_KEY environment variable"
}
```

## Frontend Integration

Events from external sources are automatically included in the `/api/events/active` endpoint response.

**No frontend changes required** - the map will display both:
- Manually created events (user check-ins)
- Synced events from EDMTrain

## Testing

### 1. Verify API Key Configuration

```bash
# Check if API key is set
echo $EDMTRAIN_API_KEY

# Test locations endpoint
curl http://localhost:8000/api/admin/events/locations
```

### 2. Test Event Sync

```bash
# Sync events for New York
curl -X POST "http://localhost:8000/api/admin/events/sync" \
  -H "Content-Type: application/json" \
  -d '{"source": "edmtrain", "city": "New York", "state": "NY", "max_events": 10}'
```

### 3. Verify Events in Database

```bash
# Check events in database
psql $DATABASE_URL -c "SELECT event_id, venue_name, event_type, start_time FROM events WHERE event_id LIKE 'edmtrain_%' LIMIT 10;"
```

### 4. Test Frontend Display

1. Navigate to `/events` in your browser
2. Allow location access
3. Events from EDMTrain should appear on the map
4. Events should show "Music" as the event type

## Troubleshooting

### Issue: "EDMTrain API key not configured"

**Solution:** Add `EDMTRAIN_API_KEY` to your `.env` file and restart the backend server.

### Issue: "Failed to sync events: 403 Forbidden"

**Solution:** Your API key may be invalid or expired. Verify at https://edmtrain.com/developer-api

### Issue: No events showing on map

**Check:**
1. Events were successfully synced (check database)
2. User location is enabled in browser
3. Radius filter is large enough (default: 10km)
4. Events are within the user's location radius

### Issue: Duplicate events appearing

**Solution:** Events are deduplicated by `event_id`. If you see duplicates, they may be from different sources or have different IDs.

## Production Deployment

### Environment Variables

Add to your Railway/Vercel environment:

```bash
EDMTRAIN_API_KEY=your_production_api_key
```

### Automated Sync

Set up a scheduled task to sync events daily:

**Railway:** Use cron jobs or scheduled tasks
**Vercel:** Use Vercel Cron Jobs with a serverless function

Example Vercel cron job (`api/cron/sync-events.ts`):

```typescript
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'edmtrain',
        city: 'New York',
        state: 'NY',
        max_events: 50
      })
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
  }
}
```

Add to `vercel.json`:

```json
{
  "crons": [{
    "path": "/api/cron/sync-events",
    "schedule": "0 0 * * *"
  }]
}
```

## API Reference

### EDMTrain API Documentation

- **Base URL:** https://edmtrain.com/api
- **Docs:** https://edmtrain.com/api-documentation
- **Developer Portal:** https://edmtrain.com/developer-api
- **Terms:** https://edmtrain.com/api-terms-of-use

### Posh API Documentation

- **Base URL:** TBD
- **Docs:** https://docs.posh.vip
- **Contact:** ragel@posh.vip

## Support

For issues with:
- **EDMTrain API:** Contact EDMTrain support via their website
- **Posh API:** Contact ragel@posh.vip
- **VibeConnect Integration:** Open an issue on the GitHub repository
