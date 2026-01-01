# VibeConnect Development TODOs

## 1. Social Profiles UI (Frontend + Backend Integration)

### Frontend Web App
- [ ] Create `/frontend/app/profile/social/page.tsx` - Social profiles management page
- [ ] Add form inputs for social media handles (Instagram, Twitter, LinkedIn, Spotify, TikTok, YouTube)
- [ ] Implement privacy toggle (Public vs Connection-Only visibility)
- [ ] Add validation for social media handle formats (e.g., @username)
- [ ] Create API integration to save social profiles to backend
- [ ] Add "Social Profiles" button/link in navigation
- [ ] Display user's social profiles on their profile page
- [ ] Show social profiles on connections page (only if unlocked)
- [ ] Add "Follow All" button after mutual connection accepts

### Backend API
- [ ] Test `/profiles/socials` PUT endpoint with real data
- [ ] Test `/profiles/socials/{wallet_address}` GET endpoint with privacy checks
- [ ] Verify visibility logic works correctly (public vs connection_only)
- [ ] Add validation for social media handle formats
- [ ] Run database migration `migrations/001_add_social_profiles.sql` if not applied

### Mobile App
- [ ] Create `/mobile/src/screens/SocialProfilesScreen.tsx`
- [ ] Build form UI for adding social media handles
- [ ] Add privacy toggle component
- [ ] Integrate with `api.ts` service (updateSocialProfiles, getSocialProfiles)
- [ ] Add navigation to Social Profiles screen from profile

---

## 2. Deploy Smart Contracts (Blockchain)

### Smart Contract Setup
- [ ] Review contracts in `/contracts/src/` (ProfileNFT.sol, ConnectionNFT.sol, PesoBytes.sol)
- [ ] Create deployment script `/contracts/scripts/deploy.ts`
- [ ] Get Base Sepolia testnet ETH from faucet
- [ ] Configure `.env` in contracts folder with private key and RPC URL
- [ ] Deploy ProfileNFT contract to Base Sepolia
- [ ] Deploy ConnectionNFT contract to Base Sepolia
- [ ] Deploy PesoBytes contract to Base Sepolia
- [ ] Verify contracts on BaseScan
- [ ] Update backend `.env` with deployed contract addresses
- [ ] Update frontend contract addresses in configuration

### Backend Integration
- [ ] Test contract interaction from backend (`app/services/blockchain.py`)
- [ ] Implement NFT minting when connections are accepted
- [ ] Add contract event listeners for NFT mints
- [ ] Update database with NFT token IDs after minting

### Frontend Integration
- [ ] Update contract ABIs in `/frontend/app/contracts/`
- [ ] Test minting flow from frontend
- [ ] Display minted NFTs on profile page
- [ ] Add NFT viewing functionality

---

## 3. Mobile Navigation (React Navigation)

### Setup
- [ ] Install React Navigation dependencies in `/mobile/`
  - `@react-navigation/native`
  - `@react-navigation/native-stack`
  - `@react-navigation/bottom-tabs`
  - `react-native-screens`
  - `react-native-safe-area-context`
- [ ] Create `/mobile/src/navigation/AppNavigator.tsx`
- [ ] Set up Stack Navigator for main app flow
- [ ] Set up Bottom Tab Navigator for authenticated users

### Screens to Create
- [ ] `/mobile/src/screens/HomeScreen.tsx` - Main landing (current App.tsx content)
- [ ] `/mobile/src/screens/ProfileScreen.tsx` - User profile view
- [ ] `/mobile/src/screens/EventsScreen.tsx` - Events list
- [ ] `/mobile/src/screens/EventDetailScreen.tsx` - Single event detail
- [ ] `/mobile/src/screens/CheckInScreen.tsx` - QR code scanner for check-in
- [ ] `/mobile/src/screens/ConnectionsScreen.tsx` - Connections feed
- [ ] `/mobile/src/screens/ConnectionDetailScreen.tsx` - Single connection detail
- [ ] `/mobile/src/screens/CreateProfileScreen.tsx` - AI onboarding flow

### Navigation Flow
- [ ] Move current App.tsx content to HomeScreen
- [ ] Update App.tsx to use AppNavigator
- [ ] Add bottom tabs: Home, Events, Connections, Profile
- [ ] Implement stack navigation for detail screens
- [ ] Add navigation guards (require wallet connection)
- [ ] Test deep linking with `vibeconnect://` scheme

---

## 4. Profile Creation Screen (AI Onboarding)

### Backend API
- [ ] Test `/chat/start` endpoint for AI conversation
- [ ] Test `/chat/message` endpoint for personality analysis
- [ ] Test `/chat/complete` endpoint for profile creation
- [ ] Verify personality trait extraction works correctly

### Frontend Web App
- [ ] Review existing `/frontend/app/chat/page.tsx`
- [ ] Enhance UI/UX for conversational flow
- [ ] Add progress indicator (5 dimensions: Goals, Intuition, Philosophy, Expectations, Leisure)
- [ ] Show dimension completion badges
- [ ] Add "Skip" option for each dimension
- [ ] Display generated personality summary
- [ ] Add confirmation step before profile creation

### Mobile App
- [ ] Create `/mobile/src/screens/CreateProfileScreen.tsx`
- [ ] Build chat UI with message bubbles
- [ ] Implement typing indicators
- [ ] Add API integration with `/chat/*` endpoints
- [ ] Show dimension progress (5 core dimensions)
- [ ] Add personality trait visualization
- [ ] Navigate to profile after completion
- [ ] Add profile creation to "Create Profile" button in App.tsx

### Shared Improvements
- [ ] Add error handling for API failures
- [ ] Add offline queue for messages
- [ ] Store chat history in localStorage/AsyncStorage
- [ ] Add ability to restart personality quiz

---

## 5. Enhanced Connections Feed

### Backend Features
- [ ] Add filtering endpoints:
  - `/matches/?status=pending`
  - `/matches/?status=accepted`
  - `/matches/?event_id={id}`
- [ ] Add sorting options (newest, highest compatibility, expiring soon)
- [ ] Implement connection expiration check (72 hours)
- [ ] Add endpoint to get mutual connections count
- [ ] Create endpoint for "Follow All" action (returns all social links)

### Frontend Web App
- [ ] Update `/frontend/app/connections/page.tsx` with filters
- [ ] Add tabs: All, Pending, Accepted, Expired
- [ ] Show countdown timer for pending matches (72 hours)
- [ ] Display social profiles for accepted connections
- [ ] Add "Follow All" button for accepted connections
- [ ] Show compatibility score breakdown (dimension-by-dimension)
- [ ] Add event context (which event you met at)
- [ ] Implement infinite scroll/pagination
- [ ] Add search functionality (by name, event, score)

### Mobile App
- [ ] Create `/mobile/src/screens/ConnectionsScreen.tsx`
- [ ] Build connection cards with compatibility scores
- [ ] Add filter chips (Pending, Accepted, Expired)
- [ ] Show timer for expiring matches
- [ ] Display unlocked social profiles after acceptance
- [ ] Add "Follow All" deep links to social apps
- [ ] Show event location and date
- [ ] Add pull-to-refresh
- [ ] Implement connection detail view

### Social Integration
- [ ] Create deep links for social platforms:
  - Instagram: `instagram://user?username={handle}`
  - Twitter: `twitter://user?screen_name={handle}`
  - LinkedIn: `linkedin://profile/{handle}`
  - Spotify: `spotify://user/{handle}`
- [ ] Add "Copy Handle" functionality
- [ ] Show verified badge if social handle exists
- [ ] Add privacy controls preview

---

## Cross-Cutting Tasks

### Testing
- [ ] Write unit tests for social profiles API
- [ ] Write integration tests for connection flow
- [ ] Test mobile app on physical device
- [ ] Test PWA installation on iOS and Android
- [ ] Test wallet connection flow end-to-end
- [ ] Load test backend with concurrent users

### DevOps
- [ ] Set up staging environment on Railway/Vercel
- [ ] Add environment variables to Railway for contract addresses
- [ ] Configure CORS for production domains
- [ ] Set up error tracking (Sentry or similar)
- [ ] Add analytics (PostHog or Mixpanel)
- [ ] Set up monitoring and alerts

### Documentation
- [ ] Update API documentation with new endpoints
- [ ] Document smart contract deployment process
- [ ] Create user guide for social profiles feature
- [ ] Add developer setup guide for new contributors
- [ ] Document mobile app development workflow

### Security
- [ ] Audit smart contracts for vulnerabilities
- [ ] Review API authentication/authorization
- [ ] Add rate limiting to sensitive endpoints
- [ ] Implement CSRF protection
- [ ] Add input sanitization for social handles
- [ ] Review privacy controls implementation

---

## Priority Order Recommendation

1. **Social Profiles UI** - Quick win, high user value, builds on existing backend
2. **Enhanced Connections Feed** - Makes the core feature more compelling
3. **Mobile Navigation** - Unlocks all other mobile features
4. **Profile Creation Screen** - Critical onboarding experience
5. **Deploy Smart Contracts** - Enables NFT functionality (can be done in parallel)

---

## Notes for Agent Development

- Each section can be assigned to a separate agent
- Agents should check existing code before creating new files
- Follow established patterns (styling, API structure, file organization)
- Test integrations between components
- Update this TODO file as tasks are completed
- Add new subtasks as they're discovered during development
