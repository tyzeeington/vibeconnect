# Enhanced Matches/Connections Feed API Documentation

## Overview

This document describes the enhanced matches/connections feed endpoints added to the VibeConnect backend API.

## Changes Summary

### Database Changes
- **Added EXPIRED status** to `MatchStatus` enum (pending, accepted, rejected, expired)
- **Migration file created**: `/backend/migrations/002_add_expired_status.sql`

### API Enhancements

#### 1. Enhanced MatchResponse Model
The `MatchResponse` model now includes additional fields:
- `event_name`: Name of the event venue
- `created_at`: When the match was created (ISO 8601 format)
- `expires_at`: When the match expires (ISO 8601 format, nullable)
- `is_expired`: Boolean indicating if the match has expired
- `time_remaining_hours`: Hours remaining before expiration (nullable)

---

## New Endpoints

### 1. GET `/api/matches/` - Unified Matches Endpoint with Filtering & Sorting

**Description**: Get all matches for a user with advanced filtering, sorting, and pagination.

**Query Parameters**:
- `wallet_address` (required): User's wallet address
- `status` (optional): Filter by match status
  - Values: `pending`, `accepted`, `rejected`, `expired`
- `event_id` (optional): Filter by specific event ID
- `sort` (optional): Sort order (default: `newest`)
  - Values: `newest`, `compatibility`, `expiring_soon`
- `limit` (optional): Maximum results (default: 50, max: 100)
- `offset` (optional): Pagination offset (default: 0)

**Example Requests**:
```bash
# Get all pending matches
GET /api/matches/?wallet_address=0x123...&status=pending

# Get accepted matches sorted by compatibility
GET /api/matches/?wallet_address=0x123...&status=accepted&sort=compatibility

# Get matches for a specific event
GET /api/matches/?wallet_address=0x123...&event_id=venue_123_2024-01-15

# Get expiring matches (sorted by expiration time)
GET /api/matches/?wallet_address=0x123...&status=pending&sort=expiring_soon

# Pagination example
GET /api/matches/?wallet_address=0x123...&limit=20&offset=40
```

**Response**: Array of `MatchResponse` objects

**Features**:
- Automatically checks for and marks expired matches
- Supports multiple filter combinations
- Pagination for large result sets
- Flexible sorting options

---

### 2. GET `/api/matches/mutual-connections` - Get Mutual Connections

**Description**: Get the count and list of mutual connections between two users.

**Query Parameters**:
- `user_a_wallet` (required): First user's wallet address
- `user_b_wallet` (required): Second user's wallet address

**Example Request**:
```bash
GET /api/matches/mutual-connections?user_a_wallet=0x123...&user_b_wallet=0x456...
```

**Response**:
```json
{
  "user_a_wallet": "0x123...",
  "user_b_wallet": "0x456...",
  "mutual_connections_count": 5,
  "mutual_connections": [
    "0x789...",
    "0xabc...",
    "0xdef...",
    "0x012...",
    "0x345..."
  ]
}
```

**Use Cases**:
- Display mutual connections when viewing a match
- Calculate social proof for new connections
- Build connection graphs and network visualizations

---

### 3. GET `/api/matches/{match_id}/follow-all` - Follow All Social Links

**Description**: Get all social media links for a match (used for "Follow All" button). Returns social profiles only if the connection has been accepted and the requester has access.

**Path Parameters**:
- `match_id` (required): The match ID

**Query Parameters**:
- `requester_wallet` (required): Wallet address of the requester

**Example Request**:
```bash
GET /api/matches/123/follow-all?requester_wallet=0x123...
```

**Response** (Success - Connection Accepted):
```json
{
  "match_id": 123,
  "connection_id": 45,
  "other_user_wallet": "0x456...",
  "other_user_username": "alice_web3",
  "social_profiles": {
    "instagram": "@alice.crypto",
    "twitter": "@aliceweb3",
    "linkedin": "alice-crypto",
    "spotify": "alicecrypto"
  },
  "can_access": true,
  "message": "Social profiles unlocked through your connection"
}
```

**Response** (No Access):
```json
{
  "match_id": 123,
  "connection_id": null,
  "other_user_wallet": "0x456...",
  "other_user_username": "alice_web3",
  "social_profiles": {},
  "can_access": false,
  "message": "Social profiles are only available for accepted connections"
}
```

**Access Rules**:
1. Requester must be part of the match
2. Match must have status `ACCEPTED`
3. A connection must exist between the users
4. Respects privacy settings (public vs connection_only)

---

## Enhanced Existing Endpoints

### GET `/api/matches/pending` (Deprecated)
- Now includes expiration information in response
- Automatically updates expired matches to `EXPIRED` status
- **Recommendation**: Migrate to `/api/matches/?status=pending`

### GET `/api/matches/history` (Deprecated)
- Now includes enhanced match information
- **Recommendation**: Migrate to `/api/matches/`

---

## Expiration Logic

### 72-Hour Expiration Check
All endpoints that return matches now:
1. Check for expired pending matches (where `expires_at < now()`)
2. Automatically update expired matches from `PENDING` to `EXPIRED` status
3. Include expiration information in responses

### Calculating Time Remaining
```javascript
// Frontend example
const hoursRemaining = match.time_remaining_hours;
const daysRemaining = Math.floor(hoursRemaining / 24);
const hoursOnly = Math.floor(hoursRemaining % 24);

console.log(`${daysRemaining}d ${hoursOnly}h remaining`);
```

---

## Sorting Options Explained

### 1. `newest` (Default)
Sorts by `created_at` descending - newest matches first.

**Use Case**: Default feed view, showing most recent activity.

### 2. `compatibility`
Sorts by `compatibility_score` descending - highest compatibility first.

**Use Case**: Finding best potential connections, quality over recency.

### 3. `expiring_soon`
Sorts by `expires_at` ascending - matches expiring soonest first.

**Use Case**: Urgency view, prompting users to respond before expiration.

---

## Privacy & Security

### Social Profiles Access
- Social profiles are protected by privacy settings
- `connection_only` visibility requires an accepted connection
- `public` visibility allows anyone to view
- The `/follow-all` endpoint enforces these rules

### Authorization
- All endpoints require the requester's wallet address
- Users can only view matches they're part of
- Social profiles are only shared with connected users (unless public)

---

## Pagination Best Practices

### Standard Pagination Pattern
```bash
# Page 1 (first 50 results)
GET /api/matches/?wallet_address=0x123...&limit=50&offset=0

# Page 2 (next 50 results)
GET /api/matches/?wallet_address=0x123...&limit=50&offset=50

# Page 3 (next 50 results)
GET /api/matches/?wallet_address=0x123...&limit=50&offset=100
```

### Infinite Scroll Pattern
```javascript
// Frontend example
let offset = 0;
const limit = 20;

async function loadMoreMatches() {
  const response = await fetch(
    `/api/matches/?wallet_address=${wallet}&limit=${limit}&offset=${offset}`
  );
  const matches = await response.json();

  // Append to UI
  appendMatchesToFeed(matches);

  // Update offset for next load
  offset += limit;
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid status. Must be one of: pending, accepted, rejected, expired"
}
```

### 403 Forbidden
```json
{
  "detail": "You are not part of this match"
}
```

### 404 Not Found
```json
{
  "detail": "User not found"
}
```

---

## Migration Guide

### From `/matches/pending` to `/matches/?status=pending`

**Old**:
```javascript
const response = await fetch(
  `/api/matches/pending?wallet_address=${wallet}`
);
```

**New**:
```javascript
const response = await fetch(
  `/api/matches/?wallet_address=${wallet}&status=pending&sort=expiring_soon`
);
```

### Benefits
- More flexible filtering
- Sorting options
- Pagination support
- Consistent API patterns

---

## Frontend Integration Examples

### Example 1: Connections Feed with Tabs
```javascript
// Pending tab
const pending = await fetch(
  `/api/matches/?wallet_address=${wallet}&status=pending&sort=expiring_soon`
);

// Accepted tab
const accepted = await fetch(
  `/api/matches/?wallet_address=${wallet}&status=accepted&sort=newest`
);

// Expired tab
const expired = await fetch(
  `/api/matches/?wallet_address=${wallet}&status=expired&sort=newest`
);
```

### Example 2: Event-Specific Matches
```javascript
const eventMatches = await fetch(
  `/api/matches/?wallet_address=${wallet}&event_id=${eventId}&sort=compatibility`
);
```

### Example 3: Follow All Button
```javascript
async function handleFollowAll(matchId) {
  const response = await fetch(
    `/api/matches/${matchId}/follow-all?requester_wallet=${wallet}`
  );
  const data = await response.json();

  if (data.can_access) {
    // Open all social links
    Object.entries(data.social_profiles).forEach(([platform, handle]) => {
      const link = generateDeepLink(platform, handle);
      window.open(link, '_blank');
    });
  } else {
    alert(data.message);
  }
}
```

### Example 4: Expiration Countdown Timer
```javascript
function renderExpirationTimer(match) {
  if (!match.is_expired && match.time_remaining_hours) {
    const hours = Math.floor(match.time_remaining_hours);
    const minutes = Math.floor((match.time_remaining_hours % 1) * 60);

    return `${hours}h ${minutes}m remaining`;
  } else if (match.is_expired) {
    return 'EXPIRED';
  }
  return null;
}
```

---

## Database Migration

To apply the database changes:

```bash
# PostgreSQL
psql -U your_user -d vibeconnect_db -f backend/migrations/002_add_expired_status.sql

# Or using your ORM/migration tool
```

---

## Testing Checklist

- [ ] Test filtering by each status (pending, accepted, rejected, expired)
- [ ] Test filtering by event_id
- [ ] Test each sorting option (newest, compatibility, expiring_soon)
- [ ] Test pagination with different limit/offset values
- [ ] Test expiration logic (create match with past expires_at)
- [ ] Test mutual connections with various scenarios
- [ ] Test follow-all with accepted vs pending matches
- [ ] Test privacy controls for social profiles
- [ ] Test error cases (invalid status, non-existent event, etc.)
- [ ] Test concurrent requests and race conditions

---

## Performance Considerations

1. **Indexing**: Ensure database indexes on:
   - `matches.status`
   - `matches.created_at`
   - `matches.expires_at`
   - `matches.event_id`
   - `matches.user_a_id`, `matches.user_b_id`

2. **Caching**: Consider caching:
   - Mutual connections counts (they don't change often)
   - Social profiles (invalidate on profile update)

3. **Pagination**: Always use pagination for production to avoid large result sets

---

## Future Enhancements

Potential improvements for future iterations:

1. **Real-time Updates**: WebSocket support for live match updates
2. **Batch Operations**: Endpoint to accept/reject multiple matches
3. **Analytics**: Endpoint for match statistics and insights
4. **Recommendations**: ML-powered match recommendations
5. **Notifications**: Push notifications for expiring matches
6. **Search**: Full-text search across matches by username or event
