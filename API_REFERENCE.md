# VibeConnect API Reference

**Base URL (Production)**: `https://vibeconnect-production.up.railway.app`
**Base URL (Local)**: `http://localhost:8000`

**Version**: 1.0
**Last Updated**: January 1, 2026

## Table of Contents

- [Authentication](#authentication)
- [Profiles API](#profiles-api)
- [Chat/AI Onboarding API](#chatai-onboarding-api)
- [Events API](#events-api)
- [Matches API](#matches-api)
- [Connections API](#connections-api)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Authentication

VibeConnect uses wallet-based authentication with JWT tokens.

### POST `/auth/wallet-login`

Authenticate with wallet signature and receive JWT token.

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "signature": "0x...",
  "message": "Sign in to VibeConnect"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Status Codes:**
- `200 OK` - Successfully authenticated
- `401 Unauthorized` - Invalid signature
- `400 Bad Request` - Missing required fields

---

### GET `/auth/challenge/{wallet_address}`

Get a challenge message for wallet signature.

**Parameters:**
- `wallet_address` (path) - Ethereum wallet address

**Response:**
```json
{
  "challenge": "Sign in to VibeConnect with nonce: 1234567890"
}
```

---

## Profiles API

Manage user profiles and personality dimensions.

### GET `/profiles/onboarding-questions`

Get the list of AI onboarding questions.

**Response:**
```json
{
  "questions": [
    {
      "dimension": "goals",
      "question": "What are your goals in life?"
    },
    {
      "dimension": "intuition",
      "question": "How do you make decisions?"
    }
  ]
}
```

---

### POST `/profiles/onboard`

Create a new profile with AI personality analysis.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "answers": {
    "goals": "I want to build meaningful connections and grow my network",
    "intuition": "I rely on gut feelings and first impressions",
    "philosophy": "Life is about experiences and human connection",
    "expectations": "I value authenticity and deep conversations",
    "leisure_time": "Music festivals, art galleries, DJ sets"
  }
}
```

**Response:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "username": "User_742d35",
  "bio": "Music lover seeking authentic connections",
  "goals": 85,
  "intuition": 72,
  "philosophy": 90,
  "expectations": 78,
  "leisure_time": 88,
  "intentions": ["networking", "creative", "social"],
  "profile_nft_id": null,
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### GET `/profiles/me`

Get the authenticated user's profile.

**Headers:**
- `Authorization: Bearer {token}`

**Response:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "username": "User_742d35",
  "bio": "Music lover seeking authentic connections",
  "goals": 85,
  "intuition": 72,
  "philosophy": 90,
  "expectations": 78,
  "leisure_time": 88,
  "intentions": ["networking", "creative", "social"],
  "profile_nft_id": "12345",
  "social_profiles": {
    "instagram": "@vibeconnector",
    "twitter": "@vibeconnect",
    "linkedin": "vibeconnect",
    "spotify": "vibeconnect",
    "visibility": "public"
  },
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### PUT `/profiles/update`

Update user profile dimensions and intentions.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "bio": "Updated bio",
  "goals": 90,
  "intuition": 75,
  "philosophy": 85,
  "expectations": 80,
  "leisure_time": 92,
  "intentions": ["networking", "learning", "creative"]
}
```

**Response:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "username": "User_742d35",
  "bio": "Updated bio",
  "goals": 90,
  "intuition": 75,
  "philosophy": 85,
  "expectations": 80,
  "leisure_time": 92,
  "intentions": ["networking", "learning", "creative"],
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### GET `/profiles/{wallet_address}`

Get another user's public profile.

**Parameters:**
- `wallet_address` (path) - User's wallet address

**Response:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "username": "User_742d35",
  "bio": "Music lover seeking authentic connections",
  "goals": 85,
  "intuition": 72,
  "philosophy": 90,
  "expectations": 78,
  "leisure_time": 88,
  "intentions": ["networking", "creative", "social"],
  "profile_nft_id": "12345",
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

### PUT `/profiles/socials`

Update social media profiles.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "instagram": "@vibeconnector",
  "twitter": "@vibeconnect",
  "linkedin": "vibeconnect",
  "spotify": "vibeconnect",
  "tiktok": "@vibeconnect",
  "youtube": "vibeconnect",
  "visibility": "connection_only"
}
```

**Response:**
```json
{
  "message": "Social profiles updated successfully",
  "visibility": "connection_only"
}
```

**Visibility Options:**
- `public` - Visible to everyone
- `connection_only` - Only visible to confirmed connections

---

### GET `/profiles/socials/{wallet_address}`

Get social profiles for a user (respects privacy settings).

**Headers:**
- `Authorization: Bearer {token}` (optional)

**Parameters:**
- `wallet_address` (path) - User's wallet address

**Response:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "instagram": "@vibeconnector",
  "twitter": "@vibeconnect",
  "linkedin": "vibeconnect",
  "spotify": "vibeconnect",
  "tiktok": "@vibeconnect",
  "youtube": "vibeconnect",
  "visibility": "public"
}
```

**Privacy Notes:**
- If `visibility` is `public`, anyone can see social profiles
- If `visibility` is `connection_only`, only mutual connections can see them
- Returns `403 Forbidden` if not authorized to view

---

## Chat/AI Onboarding API

Interactive AI-powered personality analysis.

### POST `/chat/start`

Start a new AI onboarding conversation.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "session_id": "sess_abc123",
  "message": "Hey! I'm here to get to know you better. Let's start with your goals - what are you working toward in life?",
  "current_dimension": "goals",
  "progress": {
    "goals": false,
    "intuition": false,
    "philosophy": false,
    "expectations": false,
    "leisure_time": false
  }
}
```

---

### POST `/chat/message`

Send a message in an ongoing AI conversation.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "session_id": "sess_abc123",
  "message": "I want to build meaningful connections and grow my network in the music industry"
}
```

**Response:**
```json
{
  "session_id": "sess_abc123",
  "message": "That's awesome! So you're focused on creative connections. Now, let's talk about intuition - how do you typically make decisions?",
  "current_dimension": "intuition",
  "progress": {
    "goals": true,
    "intuition": false,
    "philosophy": false,
    "expectations": false,
    "leisure_time": false
  },
  "extracted_data": {
    "goals": 85
  }
}
```

---

### POST `/chat/complete`

Complete the AI onboarding and create profile.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "session_id": "sess_abc123",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
}
```

**Response:**
```json
{
  "profile": {
    "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "username": "User_742d35",
    "bio": "AI-generated bio based on conversation",
    "goals": 85,
    "intuition": 72,
    "philosophy": 90,
    "expectations": 78,
    "leisure_time": 88,
    "intentions": ["networking", "creative", "social"]
  },
  "message": "Profile created successfully!"
}
```

---

### GET `/chat/dimensions`

Get information about the 5 personality dimensions.

**Response:**
```json
{
  "dimensions": [
    {
      "name": "goals",
      "description": "What you're building toward",
      "example_questions": ["What are your goals in life?", "What drives you?"]
    },
    {
      "name": "intuition",
      "description": "How you make decisions",
      "example_questions": ["How do you make decisions?", "Gut feeling or data?"]
    },
    {
      "name": "philosophy",
      "description": "Your worldview",
      "example_questions": ["What's your philosophy?", "What do you believe in?"]
    },
    {
      "name": "expectations",
      "description": "What you want from connections",
      "example_questions": ["What do you want from connections?", "Ideal relationship?"]
    },
    {
      "name": "leisure_time",
      "description": "How you recharge",
      "example_questions": ["How do you spend leisure time?", "Hobbies?"]
    }
  ]
}
```

---

### DELETE `/chat/session/{session_id}`

Delete a chat session.

**Headers:**
- `Authorization: Bearer {token}`

**Parameters:**
- `session_id` (path) - Chat session ID

**Response:**
```json
{
  "message": "Session deleted successfully"
}
```

---

## Events API

Manage event check-ins and proximity tracking.

### POST `/events/checkin`

Check into an event.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "event_id": "evt_123",
  "latitude": 40.7589,
  "longitude": -73.9851
}
```

**Response:**
```json
{
  "message": "Checked in successfully",
  "event_id": "evt_123",
  "check_in_time": "2026-01-01T20:00:00Z"
}
```

---

### POST `/events/checkout`

Check out of an event.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "event_id": "evt_123"
}
```

**Response:**
```json
{
  "message": "Checked out successfully",
  "event_id": "evt_123",
  "check_out_time": "2026-01-01T23:30:00Z",
  "duration_minutes": 210
}
```

---

### GET `/events/active`

Get list of active events nearby.

**Headers:**
- `Authorization: Bearer {token}` (optional)

**Query Parameters:**
- `latitude` (optional) - User's current latitude
- `longitude` (optional) - User's current longitude
- `radius_km` (optional, default: 10) - Search radius in kilometers

**Response:**
```json
{
  "events": [
    {
      "event_id": "evt_123",
      "venue_name": "Brooklyn Warehouse",
      "latitude": 40.7589,
      "longitude": -73.9851,
      "start_time": "2026-01-01T20:00:00Z",
      "end_time": "2026-01-02T02:00:00Z",
      "attendee_count": 45,
      "distance_km": 2.3
    }
  ]
}
```

---

## Matches API

Manage post-event matching and compatibility.

### GET `/matches/pending`

Get pending matches for the authenticated user.

**Headers:**
- `Authorization: Bearer {token}`

**Query Parameters:**
- `event_id` (optional) - Filter by specific event
- `min_score` (optional) - Minimum compatibility score (0-100)

**Response:**
```json
{
  "matches": [
    {
      "match_id": "match_456",
      "other_user": {
        "wallet_address": "0x8ba1f109551bd432803012645ac136ddd64dba72",
        "username": "User_8ba1f1",
        "bio": "Tech enthusiast and music lover"
      },
      "compatibility_score": 87,
      "dimension_alignment": {
        "goals": 85,
        "intuition": 90,
        "philosophy": 82,
        "expectations": 88,
        "leisure_time": 90
      },
      "shared_intentions": ["networking", "creative"],
      "event": {
        "event_id": "evt_123",
        "venue_name": "Brooklyn Warehouse",
        "date": "2026-01-01"
      },
      "proximity_overlap_minutes": 180,
      "created_at": "2026-01-02T03:00:00Z",
      "expires_at": "2026-01-05T03:00:00Z"
    }
  ]
}
```

---

### POST `/matches/respond`

Accept or reject a match.

**Headers:**
- `Authorization: Bearer {token}`

**Request Body:**
```json
{
  "match_id": "match_456",
  "wallet_address": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "response": "accept"
}
```

**Response Options:**

**If accepted but waiting for other user:**
```json
{
  "message": "Match accepted. Waiting for other user's response.",
  "status": "pending"
}
```

**If mutual acceptance:**
```json
{
  "message": "Mutual match! Connection created.",
  "status": "connected",
  "connection": {
    "connection_id": "conn_789",
    "nft_minted": true,
    "peso_earned": 15,
    "transaction_hash": "0x..."
  }
}
```

**If rejected:**
```json
{
  "message": "Match rejected",
  "status": "rejected"
}
```

**Response Values:**
- `accept` - Accept the match
- `reject` - Reject the match

---

### GET `/matches/history`

Get match history (accepted/rejected).

**Headers:**
- `Authorization: Bearer {token}`

**Query Parameters:**
- `status` (optional) - Filter by status: `accepted`, `rejected`, `expired`
- `limit` (optional, default: 50) - Number of results
- `offset` (optional, default: 0) - Pagination offset

**Response:**
```json
{
  "matches": [
    {
      "match_id": "match_456",
      "other_user": {
        "wallet_address": "0x8ba1f109551bd432803012645ac136ddd64dba72",
        "username": "User_8ba1f1"
      },
      "compatibility_score": 87,
      "status": "accepted",
      "responded_at": "2026-01-02T04:00:00Z"
    }
  ],
  "total": 25,
  "limit": 50,
  "offset": 0
}
```

---

### GET `/matches/`

Get all matches (pending + history).

**Headers:**
- `Authorization: Bearer {token}`

**Query Parameters:**
- `status` (optional) - Filter by status
- `event_id` (optional) - Filter by event
- `sort` (optional) - Sort by: `score`, `date`, `expiring`
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "matches": [
    {
      "match_id": "match_456",
      "other_user": {
        "wallet_address": "0x8ba1f109551bd432803012645ac136ddd64dba72",
        "username": "User_8ba1f1",
        "bio": "Tech enthusiast"
      },
      "compatibility_score": 87,
      "status": "pending",
      "event": {
        "event_id": "evt_123",
        "venue_name": "Brooklyn Warehouse"
      },
      "created_at": "2026-01-02T03:00:00Z"
    }
  ],
  "total": 100,
  "limit": 50,
  "offset": 0
}
```

---

### GET `/matches/mutual-connections`

Get count of mutual connections with another user.

**Headers:**
- `Authorization: Bearer {token}`

**Query Parameters:**
- `other_wallet` - The other user's wallet address

**Response:**
```json
{
  "mutual_connections": 5,
  "connections": [
    {
      "wallet_address": "0x123...",
      "username": "User_123"
    }
  ]
}
```

---

### GET `/matches/{match_id}/follow-all`

Get social media links for a matched user (after mutual acceptance).

**Headers:**
- `Authorization: Bearer {token}`

**Parameters:**
- `match_id` (path) - Match ID

**Response:**
```json
{
  "social_profiles": {
    "instagram": "https://instagram.com/vibeconnector",
    "twitter": "https://twitter.com/vibeconnect",
    "linkedin": "https://linkedin.com/in/vibeconnect",
    "spotify": "https://open.spotify.com/user/vibeconnect",
    "tiktok": "https://tiktok.com/@vibeconnect",
    "youtube": "https://youtube.com/@vibeconnect"
  },
  "deep_links": {
    "instagram": "instagram://user?username=vibeconnector",
    "twitter": "twitter://user?screen_name=vibeconnect",
    "spotify": "spotify://user/vibeconnect"
  }
}
```

---

## Connections API

Manage confirmed connections and NFTs.

### GET `/connections/`

Get all confirmed connections.

**Headers:**
- `Authorization: Bearer {token}`

**Query Parameters:**
- `event_id` (optional) - Filter by event
- `sort` (optional) - Sort by: `date`, `score`
- `limit` (optional, default: 50)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "connections": [
    {
      "connection_id": "conn_789",
      "other_user": {
        "wallet_address": "0x8ba1f109551bd432803012645ac136ddd64dba72",
        "username": "User_8ba1f1",
        "bio": "Tech enthusiast"
      },
      "compatibility_score": 87,
      "event": {
        "event_id": "evt_123",
        "venue_name": "Brooklyn Warehouse",
        "date": "2026-01-01"
      },
      "nft": {
        "token_id": "12345",
        "contract_address": "0x...",
        "metadata_uri": "ipfs://..."
      },
      "peso_earned": 15,
      "created_at": "2026-01-02T04:00:00Z"
    }
  ],
  "total": 50,
  "limit": 50,
  "offset": 0
}
```

---

### GET `/connections/{connection_id}/nft`

Get NFT metadata for a specific connection.

**Headers:**
- `Authorization: Bearer {token}`

**Parameters:**
- `connection_id` (path) - Connection ID

**Response:**
```json
{
  "token_id": "12345",
  "contract_address": "0x...",
  "name": "VibeConnect Memory #12345",
  "description": "Connection NFT between User_742d35 and User_8ba1f1",
  "image": "ipfs://...",
  "attributes": [
    {
      "trait_type": "Compatibility Score",
      "value": 87
    },
    {
      "trait_type": "Event",
      "value": "Brooklyn Warehouse"
    },
    {
      "trait_type": "Date",
      "value": "2026-01-01"
    },
    {
      "trait_type": "Goals Alignment",
      "value": 85
    },
    {
      "trait_type": "Intuition Alignment",
      "value": 90
    }
  ],
  "owners": [
    "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "0x8ba1f109551bd432803012645ac136ddd64dba72"
  ]
}
```

---

## Error Handling

All API endpoints return errors in the following format:

```json
{
  "detail": "Error message describing what went wrong"
}
```

### Common HTTP Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request parameters
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Not authorized to access resource
- `404 Not Found` - Resource not found
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### Example Error Response

```json
{
  "detail": "Profile not found for wallet address"
}
```

---

## Rate Limiting

**Current Limits:**
- 100 requests per minute per IP address
- 1000 requests per hour per authenticated user

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1704153600
```

**When rate limited:**
```json
{
  "detail": "Rate limit exceeded. Try again in 45 seconds."
}
```

---

## Webhooks (Coming Soon)

Future support for webhooks to receive real-time notifications:
- New match created
- Match accepted
- Connection NFT minted
- $PESO tokens distributed

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Initialize client
const client = new VibeConnectClient({
  baseURL: 'https://vibeconnect-production.up.railway.app',
  token: 'your-jwt-token'
});

// Get profile
const profile = await client.profiles.getMe();

// Check into event
await client.events.checkin({
  wallet_address: '0x...',
  event_id: 'evt_123',
  latitude: 40.7589,
  longitude: -73.9851
});

// Get pending matches
const matches = await client.matches.getPending();

// Accept match
await client.matches.respond({
  match_id: 'match_456',
  wallet_address: '0x...',
  response: 'accept'
});
```

### Python

```python
from vibeconnect import VibeConnectClient

# Initialize client
client = VibeConnectClient(
    base_url='https://vibeconnect-production.up.railway.app',
    token='your-jwt-token'
)

# Get profile
profile = client.profiles.get_me()

# Check into event
client.events.checkin(
    wallet_address='0x...',
    event_id='evt_123',
    latitude=40.7589,
    longitude=-73.9851
)

# Get pending matches
matches = client.matches.get_pending()

# Accept match
client.matches.respond(
    match_id='match_456',
    wallet_address='0x...',
    response='accept'
)
```

---

## Interactive API Documentation

Visit the interactive API documentation at:
- **Production**: https://vibeconnect-production.up.railway.app/docs
- **Local**: http://localhost:8000/docs

The interactive docs allow you to:
- Test all endpoints directly in your browser
- See request/response schemas
- Authenticate and try authenticated endpoints
- View detailed parameter descriptions

---

## Support

For API support:
- **GitHub Issues**: https://github.com/tyzeeington/vibeconnect/issues
- **Documentation**: https://github.com/tyzeeington/vibeconnect
- **Email**: support@vibeconnect.app (coming soon)

---

**Built with FastAPI** | **Powered by OpenAI** | **Secured by Base**
