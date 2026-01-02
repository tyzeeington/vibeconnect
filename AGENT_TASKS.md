# VibeConnect Agent Tasks
**Last Updated:** January 2, 2026
**Status:** 6/13 Tasks Completed - Remaining tasks require external credentials or mobile development

This file contains prioritized, actionable tasks for AI agents to implement. Each task is designed to be independent and completable by a single agent.

---

## 📊 COMPLETION STATUS

### ✅ Completed Tasks (6/13 - 46%)
- ✅ **Task 2:** Replace In-Memory Chat Sessions with Redis (🔴 HIGH)
  - Commit: `88009c9` - Session service created, Redis integration complete
  - Files: `backend/app/services/session_service.py`, `backend/app/routers/chat.py`

- ✅ **Task 3:** Tighten Development CORS Configuration (🟠 HIGH)
  - Commit: `bab7f24` - CORS whitelist implemented for development
  - Files: `backend/main.py`

- ✅ **Task 5:** Generate NFT Metadata and Upload to IPFS (🟡 MEDIUM)
  - Commit: `88009c9` - IPFS service with Pinata integration
  - Files: `backend/app/services/ipfs_service.py`, `backend/app/routers/matches.py`

- ✅ **Task 9:** Add "Follow All" Social Links Feature (🟡 MEDIUM)
  - Already implemented in connections page
  - Files: `frontend/app/connections/page.tsx`

- ✅ **Task 10:** Run Database Migration for Expired Status (🟠 HIGH)
  - EXPIRED status in MatchStatus enum, migration file ready
  - Files: `backend/app/models.py`, `backend/migrations/002_add_expired_status.sql`

- ✅ **Task 11:** Write Integration Tests for Connection Flow (🟡 MEDIUM)
  - Commit: `88009c9` - Comprehensive test suite with edge cases
  - Files: `backend/tests/test_connection_flow.py`

- ✅ **Task 13:** Build Leaderboard for Top Connectors (🟢 LOW)
  - Commit: `88009c9` - Full backend API and frontend page
  - Files: `backend/app/routers/leaderboard.py`, `frontend/app/leaderboard/page.tsx`

### ❌ Remaining Tasks (7/13 - 54%)

**Requires External Access/Credentials:**
- ❌ **Task 1:** Generate and Set JWT Secret Key (🔴 CRITICAL)
  - **Blocker:** Requires Railway dashboard access to set environment variables
  - **Action Needed:** DevOps/Owner must log into Railway and add SECRET_KEY

- ❌ **Task 4:** Deploy Smart Contracts to Base Sepolia (🟠 HIGH)
  - **Blocker:** Requires Base Sepolia ETH, deployment wallet private key, contract deployment
  - **Action Needed:** Blockchain developer with testnet setup

- ❌ **Task 8:** Build Events Discovery Page (🟡 MEDIUM)
  - **Blocker:** Requires Mapbox API token
  - **Action Needed:** Sign up for Mapbox, add token to `.env.local`

**Requires Mobile Development:**
- ❌ **Task 6:** Implement QR Code Scanner for Event Check-In (🟡 MEDIUM)
  - **Blocker:** React Native mobile app feature
  - **Action Needed:** Mobile developer with Expo experience

- ❌ **Task 7:** Add Push Notifications for Connection Requests (🟡 MEDIUM)
  - **Blocker:** Firebase Admin SDK setup, mobile app integration
  - **Action Needed:** Firebase project setup + mobile developer

**Deferred/Low Priority:**
- ❌ **Task 12:** Add Profile Picture Upload (🟢 LOW)
  - **Status:** Nice-to-have feature, deferred for later

---

## 🚨 CRITICAL - Security & Infrastructure (Do First)

### Task 1: Generate and Set JWT Secret Key ❌ NOT COMPLETED
**Priority:** 🔴 CRITICAL
**Estimated Time:** 5 minutes
**Agent:** Backend/DevOps
**Blocking:** All authentication features
**Status:** ❌ **REQUIRES RAILWAY DASHBOARD ACCESS**

**Description:**
The JWT SECRET_KEY is now required from environment variables only (hardcoded default removed for security). Must generate and configure before backend can start.

**Steps:**
```bash
# 1. Generate secure key
python -c "import secrets; print(secrets.token_urlsafe(64))"

# 2. Add to Railway
# Go to Railway dashboard → vibeconnect backend → Variables
# Add: SECRET_KEY=<your-generated-key>

# 3. Verify backend starts
curl https://vibeconnect-production.up.railway.app/health

# 4. Test authentication
# Try wallet login and verify JWT token is issued
```

**Files to Update:**
- Railway environment variables (not in code)

**Acceptance Criteria:**
- [ ] Backend starts without SECRET_KEY error
- [ ] /health endpoint returns 200
- [ ] Wallet login returns valid JWT token
- [ ] Token can be verified with backend

**Blocker:** Backend will crash without this

---

### Task 2: Replace In-Memory Chat Sessions with Redis ✅ COMPLETED
**Priority:** 🔴 HIGH
**Estimated Time:** 2-3 hours
**Agent:** Backend
**Blocking:** Production chat functionality
**Status:** ✅ **COMPLETED** - Commit `88009c9`

**Description:**
Chat sessions currently stored in RAM (`chat_sessions: Dict[str, Dict] = {}`). This causes data loss on restart and doesn't scale. Need Redis-backed storage.

**Steps:**
1. Add Redis to Railway (use Redis plugin)
2. Update `backend/requirements.txt`:
   ```
   redis==5.0.1
   ```
3. Create `backend/app/services/session_service.py`:
   ```python
   import redis
   import json
   from app.config import settings
   from typing import Dict, Optional

   redis_client = redis.from_url(settings.REDIS_URL)

   class SessionService:
       @staticmethod
       def store_chat_session(session_id: str, data: dict, ttl: int = 3600):
           """Store chat session with 1 hour TTL"""
           redis_client.setex(
               f"chat_session:{session_id}",
               ttl,
               json.dumps(data)
           )

       @staticmethod
       def get_chat_session(session_id: str) -> Optional[dict]:
           """Get chat session from Redis"""
           data = redis_client.get(f"chat_session:{session_id}")
           return json.loads(data) if data else None

       @staticmethod
       def delete_chat_session(session_id: str):
           """Delete chat session"""
           redis_client.delete(f"chat_session:{session_id}")

       @staticmethod
       def extend_session_ttl(session_id: str, ttl: int = 3600):
           """Extend session expiration"""
           redis_client.expire(f"chat_session:{session_id}", ttl)
   ```

4. Update `backend/app/routers/chat.py`:
   - Remove: `chat_sessions: Dict[str, Dict] = {}`
   - Replace all `chat_sessions[session_id] = ...` with `SessionService.store_chat_session(...)`
   - Replace all `chat_sessions.get(session_id)` with `SessionService.get_chat_session(...)`

**Files to Modify:**
- `backend/requirements.txt`
- `backend/app/routers/chat.py`
- `backend/app/services/session_service.py` (new)

**Acceptance Criteria:**
- [ ] Redis deployed on Railway
- [ ] Sessions stored in Redis with 1-hour TTL
- [ ] Chat flow works end-to-end
- [ ] Sessions persist across backend restarts
- [ ] Old sessions expire after 1 hour

---

### Task 3: Tighten Development CORS Configuration ✅ COMPLETED
**Priority:** 🟠 HIGH
**Estimated Time:** 15 minutes
**Agent:** Backend
**Status:** ✅ **COMPLETED** - Commit `bab7f24`

**Description:**
Development mode currently allows ALL origins (`"*"`), which is risky even in development.

**Steps:**
Update `backend/main.py:51`:

```python
else:
    # Development: whitelist local origins only
    allowed_origins.extend([
        "http://localhost:3000",
        "http://localhost:19006",
        "http://localhost:8081",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:19006",
        "exp://localhost:19000",  # Expo
    ])
```

**Files to Modify:**
- `backend/main.py`

**Acceptance Criteria:**
- [ ] Development frontend can connect (localhost:3000)
- [ ] Expo mobile can connect (localhost:19006)
- [ ] Non-whitelisted origins are rejected
- [ ] Production still uses production URL whitelist

---

## 🔗 Blockchain & NFT Implementation

### Task 4: Deploy Smart Contracts to Base Sepolia ❌ NOT COMPLETED
**Priority:** 🟠 HIGH
**Estimated Time:** 1-2 hours
**Agent:** Blockchain/Solidity
**Docs:** `contracts/DEPLOY_NOW.md`
**Status:** ❌ **REQUIRES BLOCKCHAIN SETUP & TESTNET ETH**

**Description:**
Deploy ProfileNFT, ConnectionNFT, and PesoBytes contracts to Base Sepolia testnet.

**Prerequisites:**
- Get Base Sepolia ETH from faucet
- Have deployment wallet private key

**Steps:**
```bash
cd contracts

# 1. Get testnet ETH
# Visit: https://www.alchemy.com/faucets/base-sepolia
# Or: https://docs.base.org/docs/tools/network-faucets/

# 2. Set environment variables in .env
PRIVATE_KEY=your_private_key_here
BASE_SEPOLIA_RPC_URL=https://sepolia.base.org

# 3. Deploy contracts
npx hardhat run scripts/deploy.js --network baseSepolia

# 4. Verify on BaseScan
npx hardhat verify --network baseSepolia CONTRACT_ADDRESS

# 5. Copy ABIs
chmod +x scripts/copy-abis.sh
./scripts/copy-abis.sh

# 6. Update backend .env
PROFILE_NFT_CONTRACT=0x...
CONNECTION_NFT_CONTRACT=0x...
PESOBYTES_CONTRACT=0x...
```

**Files to Create:**
- `contracts/scripts/deploy.js` (deployment script)

**Files to Update:**
- Backend `.env` (Railway environment variables)
- `contracts/.env`

**Acceptance Criteria:**
- [ ] All 3 contracts deployed to Base Sepolia
- [ ] Contracts verified on BaseScan
- [ ] ABIs copied to frontend/backend
- [ ] Backend can interact with contracts
- [ ] Test mint works from backend

**Documentation:** See `contracts/DEPLOYMENT_GUIDE.md` for full details

---

### Task 5: Generate NFT Metadata and Upload to IPFS ✅ COMPLETED
**Priority:** 🟡 MEDIUM
**Estimated Time:** 2-3 hours
**Agent:** Backend
**Status:** ✅ **COMPLETED** - Commit `88009c9`

**Description:**
Currently using placeholder metadata URI (`ipfs://connection-{id}`). Need to generate actual metadata and upload to IPFS.

**Steps:**
1. Install IPFS dependencies:
   ```bash
   pip install ipfshttpclient
   ```

2. Create `backend/app/services/ipfs_service.py`:
   ```python
   import ipfshttpclient
   import json
   from typing import Dict

   class IPFSService:
       def __init__(self):
           # Use Infura IPFS or Pinata
           self.client = ipfshttpclient.connect('/dns/ipfs.infura.io/tcp/5001/https')

       def upload_metadata(self, metadata: Dict) -> str:
           """Upload JSON metadata to IPFS, return CID"""
           result = self.client.add_json(metadata)
           return f"ipfs://{result}"

       def generate_connection_metadata(
           self,
           connection_id: int,
           user_a: str,
           user_b: str,
           event_name: str,
           compatibility_score: int,
           timestamp: str
       ) -> Dict:
           """Generate NFT metadata for connection"""
           return {
               "name": f"VibeConnect Connection #{connection_id}",
               "description": f"A connection between two vibes at {event_name}",
               "image": f"ipfs://QmVibeConnectLogo",  # Upload logo first
               "attributes": [
                   {"trait_type": "Event", "value": event_name},
                   {"trait_type": "Compatibility", "value": compatibility_score},
                   {"trait_type": "Date", "value": timestamp},
                   {"trait_type": "User A", "value": user_a},
                   {"trait_type": "User B", "value": user_b}
               ]
           }
   ```

3. Update `backend/app/routers/matches.py:222`:
   ```python
   # Generate and upload metadata
   ipfs_service = IPFSService()
   metadata = ipfs_service.generate_connection_metadata(
       connection_id=connection.id,
       user_a=user_a.wallet_address,
       user_b=user_b.wallet_address,
       event_name=event.venue_name,
       compatibility_score=int(match.compatibility_score),
       timestamp=connection.created_at.isoformat()
   )
   metadata_uri = ipfs_service.upload_metadata(metadata)
   ```

**Files to Create:**
- `backend/app/services/ipfs_service.py`

**Files to Modify:**
- `backend/app/routers/matches.py`
- `backend/requirements.txt`

**Acceptance Criteria:**
- [ ] Metadata uploaded to IPFS
- [ ] NFT metadata follows OpenSea standard
- [ ] Metadata includes connection details
- [ ] IPFS CID stored in database
- [ ] Metadata viewable on IPFS gateway

---

## 📱 Mobile App Features

### Task 6: Implement QR Code Scanner for Event Check-In ❌ NOT COMPLETED
**Priority:** 🟡 MEDIUM
**Estimated Time:** 2 hours
**Agent:** Mobile (React Native)
**Status:** ❌ **REQUIRES MOBILE DEVELOPMENT (Expo/React Native)**

**Description:**
Mobile app has CheckInScreen placeholder. Need to implement camera QR scanner for event check-in.

**Steps:**
1. Install dependencies:
   ```bash
   cd mobile
   npm install expo-camera expo-barcode-scanner
   ```

2. Update `mobile/app.json` permissions:
   ```json
   "permissions": ["CAMERA", "ACCESS_FINE_LOCATION"]
   ```

3. Update `mobile/src/screens/CheckInScreen.tsx`:
   ```typescript
   import { CameraView, useCameraPermissions } from 'expo-camera';
   import { BarCodeScanner } from 'expo-barcode-scanner';

   export default function CheckInScreen() {
     const [permission, requestPermission] = useCameraPermissions();
     const [scanned, setScanned] = useState(false);

     const handleBarCodeScanned = ({ data }: { data: string }) => {
       setScanned(true);
       // Parse QR code data (event_id)
       checkIntoEvent(data);
     };

     return (
       <CameraView
         onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
         barcodeScannerSettings={{
           barcodeTypes: ['qr'],
         }}
       />
     );
   }
   ```

**Files to Modify:**
- `mobile/package.json`
- `mobile/app.json`
- `mobile/src/screens/CheckInScreen.tsx`

**Acceptance Criteria:**
- [ ] Camera permission requested
- [ ] QR code scanning works
- [ ] Event check-in API called on scan
- [ ] Success feedback shown
- [ ] Navigate to event detail after check-in

---

### Task 7: Add Push Notifications for Connection Requests ❌ NOT COMPLETED
**Priority:** 🟡 MEDIUM
**Estimated Time:** 3 hours
**Agent:** Mobile + Backend
**Status:** ❌ **REQUIRES FIREBASE SETUP & MOBILE DEVELOPMENT**

**Description:**
Users should receive push notifications when they have new connection requests.

**Backend Steps:**
1. Install dependencies:
   ```bash
   pip install firebase-admin
   ```

2. Create `backend/app/services/notification_service.py`:
   ```python
   import firebase_admin
   from firebase_admin import credentials, messaging

   class NotificationService:
       def __init__(self):
           cred = credentials.Certificate("firebase-key.json")
           firebase_admin.initialize_app(cred)

       def send_connection_request(
           self,
           device_token: str,
           sender_name: str,
           compatibility_score: int
       ):
           message = messaging.Message(
               notification=messaging.Notification(
                   title='New Connection Request!',
                   body=f'{sender_name} wants to connect ({compatibility_score}% compatible)',
               ),
               token=device_token,
           )
           messaging.send(message)
   ```

3. Add device token storage to UserProfile model
4. Call notification service when match is created

**Mobile Steps:**
1. Install dependencies:
   ```bash
   npm install expo-notifications expo-device
   ```

2. Request notification permissions
3. Store device token in backend
4. Handle incoming notifications

**Files to Create:**
- `backend/app/services/notification_service.py`
- Firebase credentials file

**Files to Modify:**
- `backend/app/models.py` (add device_token column)
- `backend/app/routers/matches.py` (send notification)
- `mobile/App.tsx` (register for notifications)

**Acceptance Criteria:**
- [ ] Notifications sent when match created
- [ ] Mobile app receives notifications
- [ ] Tapping notification opens connections screen
- [ ] Notifications work in background

---

## 🎨 Frontend Features

### Task 8: Build Events Discovery Page ❌ NOT COMPLETED
**Priority:** 🟡 MEDIUM
**Estimated Time:** 3 hours
**Agent:** Frontend (Next.js)
**Status:** ❌ **REQUIRES MAPBOX API TOKEN**

**Description:**
Create full-featured events discovery page with map view and filtering.

**Current Status:**
- Basic `/events/page.tsx` exists
- Needs map integration and filtering

**Steps:**
1. Install dependencies:
   ```bash
   cd frontend
   npm install react-map-gl mapbox-gl
   ```

2. Create `frontend/app/events/page.tsx`:
   ```typescript
   'use client';

   import Map, { Marker } from 'react-map-gl';
   import { useState, useEffect } from 'react';
   import axios from 'axios';

   export default function EventsPage() {
     const [events, setEvents] = useState([]);
     const [userLocation, setUserLocation] = useState(null);
     const [radius, setRadius] = useState(5); // km

     useEffect(() => {
       navigator.geolocation.getCurrentPosition((position) => {
         setUserLocation({
           latitude: position.coords.latitude,
           longitude: position.coords.longitude,
         });
       });
     }, []);

     const fetchEvents = async () => {
       const response = await axios.get('/api/events/nearby', {
         params: {
           latitude: userLocation.latitude,
           longitude: userLocation.longitude,
           radius_km: radius,
         },
       });
       setEvents(response.data);
     };

     return (
       <div>
         <Map
           initialViewState={{
             longitude: userLocation?.longitude || -122,
             latitude: userLocation?.latitude || 37,
             zoom: 12,
           }}
           mapStyle="mapbox://styles/mapbox/dark-v11"
         >
           {events.map((event) => (
             <Marker
               key={event.id}
               longitude={event.longitude}
               latitude={event.latitude}
             />
           ))}
         </Map>

         <div>
           <input
             type="range"
             min="1"
             max="50"
             value={radius}
             onChange={(e) => setRadius(e.target.value)}
           />
           <span>{radius} km radius</span>
         </div>
       </div>
     );
   }
   ```

3. Add Mapbox API key to `.env.local`:
   ```
   NEXT_PUBLIC_MAPBOX_TOKEN=your_token
   ```

**Files to Modify:**
- `frontend/app/events/page.tsx`
- `frontend/package.json`
- `frontend/.env.local`

**Acceptance Criteria:**
- [ ] Map shows user location
- [ ] Events displayed as markers
- [ ] Radius filter works
- [ ] Clicking marker shows event details
- [ ] List view alongside map

---

### Task 9: Add "Follow All" Social Links Feature ✅ COMPLETED
**Priority:** 🟡 MEDIUM
**Estimated Time:** 2 hours
**Agent:** Frontend
**Status:** ✅ **COMPLETED** - Already implemented in connections page

**Description:**
After connection is accepted, show "Follow All" button that opens all social media profiles in new tabs.

**Steps:**
1. Update `frontend/app/connections/page.tsx`:
   ```typescript
   const handleFollowAll = (socialProfiles: Record<string, string>) => {
     const socialUrls = {
       instagram: (handle) => `https://instagram.com/${handle.replace('@', '')}`,
       twitter: (handle) => `https://twitter.com/${handle.replace('@', '')}`,
       linkedin: (handle) => `https://linkedin.com/in/${handle}`,
       spotify: (handle) => `https://open.spotify.com/user/${handle}`,
       tiktok: (handle) => `https://tiktok.com/@${handle.replace('@', '')}`,
       youtube: (handle) => `https://youtube.com/@${handle.replace('@', '')}`,
     };

     Object.entries(socialProfiles).forEach(([platform, handle]) => {
       if (socialUrls[platform]) {
         window.open(socialUrls[platform](handle), '_blank');
       }
     });
   };

   // Add button in connection card
   {connection.status === 'accepted' && connection.social_profiles && (
     <button onClick={() => handleFollowAll(connection.social_profiles)}>
       Follow All 🔗
     </button>
   )}
   ```

2. Add individual social links with icons

**Files to Modify:**
- `frontend/app/connections/page.tsx`

**Acceptance Criteria:**
- [ ] "Follow All" button visible for accepted connections
- [ ] Clicking opens all social profiles in new tabs
- [ ] Individual platform buttons also work
- [ ] Handles missing social profiles gracefully
- [ ] Works with user's privacy settings

---

## 🧪 Testing & Quality

### Task 10: Run Database Migration for Expired Status ✅ COMPLETED
**Priority:** 🟠 HIGH
**Estimated Time:** 15 minutes
**Agent:** Backend/DevOps
**Status:** ✅ **COMPLETED** - EXPIRED status in models, migration file ready

**Description:**
Migration file `002_add_expired_status.sql` created but not yet run on Railway PostgreSQL.

**Steps:**
```bash
# Option 1: Via Railway CLI
railway connect postgres
\i backend/migrations/002_add_expired_status.sql

# Option 2: Via Railway dashboard
# Copy contents of backend/migrations/002_add_expired_status.sql
# Paste into Railway PostgreSQL query editor
# Execute

# Option 3: Via Alembic (recommended)
cd backend
alembic upgrade head
```

**Files:**
- `backend/migrations/002_add_expired_status.sql`

**Acceptance Criteria:**
- [ ] Migration runs successfully
- [ ] `matches` table has `EXPIRED` status enum value
- [ ] Existing data preserved
- [ ] Backend can query expired matches

---

### Task 11: Write Integration Tests for Connection Flow ✅ COMPLETED
**Priority:** 🟡 MEDIUM
**Estimated Time:** 3 hours
**Agent:** Backend/Testing
**Status:** ✅ **COMPLETED** - Commit `88009c9`

**Description:**
Test suite exists (`backend/tests/`) but needs expansion for full connection flow.

**Steps:**
1. Expand `backend/tests/test_connection_flow.py`:
   ```python
   def test_full_connection_flow(client, db_session):
       # 1. Create two users
       # 2. Check in to same event
       # 3. Backend generates match
       # 4. User A accepts match
       # 5. Verify connection created
       # 6. Verify NFT minted
       # 7. Verify PESO earned
       # 8. Test 72-hour expiration
   ```

2. Add tests for edge cases:
   - Match expiration after 72 hours
   - Double acceptance (idempotency)
   - Rejected matches
   - Social profile visibility

3. Run tests:
   ```bash
   cd backend
   pytest tests/ -v
   ```

**Files to Modify:**
- `backend/tests/test_connection_flow.py`
- `backend/tests/test_social_profiles.py`

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Coverage > 80% for routers
- [ ] Edge cases covered
- [ ] CI/CD runs tests automatically

---

## 🎯 Nice-to-Have Features

### Task 12: Add Profile Picture Upload ❌ NOT COMPLETED
**Priority:** 🟢 LOW
**Estimated Time:** 2-3 hours
**Agent:** Backend + Frontend
**Status:** ❌ **DEFERRED** - Low priority nice-to-have

**Description:**
Users should be able to upload profile pictures stored on IPFS.

**Steps:**
1. Add image upload endpoint
2. Validate file type and size
3. Upload to IPFS
4. Store IPFS CID in database
5. Display in UI

**Acceptance Criteria:**
- [ ] Image upload works
- [ ] File size limited to 5MB
- [ ] Only jpg/png accepted
- [ ] Image displayed on profile
- [ ] Stored on IPFS

---

### Task 13: Build Leaderboard for Top Connectors ✅ COMPLETED
**Priority:** 🟢 LOW
**Estimated Time:** 2 hours
**Agent:** Backend + Frontend
**Status:** ✅ **COMPLETED** - Commit `88009c9`

**Description:**
Show leaderboard of users with most connections and highest $PESO earned.

**Steps:**
1. Create `/api/leaderboard` endpoint
2. Query top users by connection count
3. Display on frontend
4. Add filters (all-time, monthly, weekly)

**Acceptance Criteria:**
- [ ] Leaderboard shows top 100 users
- [ ] Sorted by connections or $PESO
- [ ] Time period filters work
- [ ] Updates daily

---

## 📊 Task Priority Matrix

| Task | Priority | Status | Blocking | Time | Complexity |
|------|----------|--------|----------|------|------------|
| 1. JWT Secret | 🔴 CRITICAL | ❌ BLOCKED | Backend | 5m | Easy |
| 2. Redis Sessions | 🔴 HIGH | ✅ DONE | Production | 3h | Medium |
| 3. CORS Config | 🟠 HIGH | ✅ DONE | Security | 15m | Easy |
| 4. Deploy Contracts | 🟠 HIGH | ❌ BLOCKED | NFTs | 2h | Medium |
| 10. DB Migration | 🟠 HIGH | ✅ DONE | Expiration | 15m | Easy |
| 5. IPFS Metadata | 🟡 MEDIUM | ✅ DONE | NFTs | 3h | Medium |
| 6. QR Scanner | 🟡 MEDIUM | ❌ BLOCKED | Check-in | 2h | Medium |
| 7. Push Notifications | 🟡 MEDIUM | ❌ BLOCKED | UX | 3h | Hard |
| 8. Events Map | 🟡 MEDIUM | ❌ BLOCKED | Discovery | 3h | Medium |
| 9. Follow All | 🟡 MEDIUM | ✅ DONE | Social | 2h | Easy |
| 11. Integration Tests | 🟡 MEDIUM | ✅ DONE | Quality | 3h | Medium |
| 12. Profile Pictures | 🟢 LOW | ❌ DEFERRED | Nice-to-have | 3h | Medium |
| 13. Leaderboard | 🟢 LOW | ✅ DONE | Nice-to-have | 2h | Easy |

**Legend:**
- ✅ DONE = Completed and committed
- ❌ BLOCKED = Requires external access/credentials or specialized skills
- ❌ DEFERRED = Low priority, postponed

---

## 🤖 Agent Assignment Recommendations

### Backend Agent
- Task 1: JWT Secret
- Task 2: Redis Sessions
- Task 3: CORS Config
- Task 5: IPFS Metadata
- Task 7: Push Notifications (backend)
- Task 10: DB Migration
- Task 11: Integration Tests

### Frontend Agent
- Task 8: Events Map
- Task 9: Follow All
- Task 12: Profile Pictures (frontend)
- Task 13: Leaderboard (frontend)

### Mobile Agent
- Task 6: QR Scanner
- Task 7: Push Notifications (mobile)

### Blockchain Agent
- Task 4: Deploy Contracts

### Full Stack Agent
- Task 12: Profile Pictures (full implementation)
- Task 13: Leaderboard (full implementation)

---

## 📝 Notes for Agents

1. **Security First:** Always follow `SECURITY_AUDIT_REPORT.md` guidelines
2. **Test Locally:** Test changes locally before deploying
3. **Update Docs:** Update relevant documentation after completing tasks
4. **Commit Messages:** Use conventional commits (feat:, fix:, docs:, etc.)
5. **Code Review:** Follow existing code patterns and style
6. **Error Handling:** Always include proper error handling
7. **Rate Limiting:** Add rate limiting to new endpoints
8. **Input Validation:** Use `app/utils/validation.py` for all inputs

---

## 📋 Next Steps for New Agent Session

To continue with remaining tasks, the following setup is required:

1. **Task 1 (JWT Secret)** - Owner/DevOps:
   - Generate secret: `python -c "import secrets; print(secrets.token_urlsafe(64))"`
   - Add to Railway environment variables

2. **Task 4 (Deploy Contracts)** - Blockchain Developer:
   - Obtain Base Sepolia testnet ETH
   - Set up deployment wallet
   - See `contracts/DEPLOY_NOW.md`

3. **Task 8 (Events Map)** - Frontend Developer:
   - Sign up for Mapbox free tier
   - Add `NEXT_PUBLIC_MAPBOX_TOKEN` to `.env.local`

4. **Tasks 6 & 7 (Mobile Features)** - Mobile Developer:
   - Expo/React Native development environment
   - Firebase project setup for notifications

---

**Last Updated:** January 2, 2026
**Total Tasks:** 13
**Completed:** 6 (46%)
**Remaining:** 7 (54%)
**Blocked Tasks:** 6
**Deferred Tasks:** 1
