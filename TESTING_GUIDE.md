# Testing Guide for AI Profile Creation

## Backend API Testing

### Prerequisites
1. Ensure backend is running: `cd backend && uvicorn main:app --reload`
2. Have valid `.env` file with `OPENAI_API_KEY` set
3. Database is running and migrations are applied

### Test Endpoints

#### 1. Test `/api/chat/start` - Start Chat Session
```bash
curl -X POST http://localhost:8000/api/chat/start \
  -H "Content-Type: application/json" \
  -d '{"wallet_address": "0x1234567890abcdef"}'
```

Expected Response:
```json
{
  "session_id": "0x1234567890abcdef_1234567890.123",
  "message": "Hi! I'm here to help build your VibeConnect profile...",
  "current_dimension": "goals",
  "dimension_index": 0,
  "total_dimensions": 5,
  "is_complete": false,
  "progress_percentage": 0.0
}
```

#### 2. Test `/api/chat/message` - Send Message
```bash
curl -X POST http://localhost:8000/api/chat/message \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x1234567890abcdef",
    "session_id": "SESSION_ID_FROM_START",
    "message": "I want to build a successful startup and help people connect better"
  }'
```

Expected Response:
```json
{
  "session_id": "SESSION_ID",
  "message": "Thanks for sharing! How do you typically make important decisions?...",
  "current_dimension": "intuition",
  "dimension_index": 1,
  "total_dimensions": 5,
  "is_complete": false,
  "progress_percentage": 20.0
}
```

#### 3. Test `/api/chat/complete` - Complete Profile Creation
```bash
curl -X POST http://localhost:8000/api/chat/complete \
  -H "Content-Type: application/json" \
  -d '{
    "wallet_address": "0x1234567890abcdef",
    "session_id": "SESSION_ID_FROM_START"
  }'
```

Expected Response:
```json
{
  "success": true,
  "profile_id": 123,
  "dimensions": {
    "goals": 75,
    "intuition": 60,
    "philosophy": 85,
    "expectations": 50,
    "leisure_time": 90
  },
  "intentions": ["build_together", "deep_conversation"],
  "insights": "Brief summary of their vibe"
}
```

#### 4. Test `/api/chat/dimensions` - Get Dimensions
```bash
curl -X GET http://localhost:8000/api/chat/dimensions
```

Expected Response:
```json
{
  "dimensions": [
    {
      "key": "goals",
      "label": "Goals",
      "question": "Let's start! What are your main goals in life right now?..."
    },
    ...
  ],
  "total": 5
}
```

#### 5. Test `/api/chat/session/{session_id}` - Delete Session
```bash
curl -X DELETE "http://localhost:8000/api/chat/session/SESSION_ID?wallet_address=0x1234567890abcdef"
```

### Full Flow Test
1. Start a chat session with POST `/api/chat/start`
2. Send 5 messages (one for each dimension) with POST `/api/chat/message`
3. Complete the profile with POST `/api/chat/complete`
4. Verify profile was created in database
5. Check that AI analysis returned valid dimension scores (0-100)

### Error Cases to Test
- Invalid wallet address format
- Session not found
- Wallet mismatch for session
- Completing session before all questions answered
- Profile already exists for wallet

## Frontend Web Testing

### Manual Testing Steps

1. **Navigate to Chat Page**
   - Go to `http://localhost:3000/chat`
   - Should see "Connect Your Wallet" if not connected

2. **Connect Wallet**
   - Click "Connect Wallet" button
   - Connect MetaMask or WalletConnect
   - Should see welcome screen with "Let's Begin" button

3. **Start Profile Creation**
   - Click "Let's Begin"
   - Should see first question appear
   - Progress bar should show 0/5

4. **Answer Questions**
   - Type answer in text field
   - Click "Send" or press Enter
   - Verify message appears in chat
   - AI response should appear after delay
   - Progress bar should update (1/5, 2/5, etc.)
   - Dimension badges should show completion status

5. **Test Skip Functionality**
   - Click "Skip" button on any question
   - Should proceed to next question
   - Progress should still update

6. **Test Restart**
   - Click "Restart" button
   - Should clear chat and start over

7. **Complete All Questions**
   - Answer all 5 dimensions
   - Should see personality summary
   - Should see confirmation buttons

8. **Confirm Profile Creation**
   - Click "Confirm & Create Profile"
   - Should redirect to profile page

### Features to Verify
- ✅ Progress indicator shows 5 dimensions
- ✅ Dimension badges change color when completed
- ✅ Skip button works for each dimension
- ✅ Personality summary displayed before confirmation
- ✅ Confirmation step before profile creation
- ✅ Error messages display properly
- ✅ Chat history persists in localStorage
- ✅ Responsive design works on mobile

## Mobile App Testing

### Prerequisites
1. Have Expo development environment set up
2. Backend running with proper CORS configuration
3. Mobile app configured with correct API_URL in `app.config.js`

### Testing Steps

1. **Install Dependencies**
   ```bash
   cd mobile
   npm install
   ```

2. **Run App**
   ```bash
   npx expo start
   ```

3. **Connect Wallet**
   - Use WalletConnect in app
   - Verify wallet address appears

4. **Navigate to Create Profile**
   - Tap "Create Profile" button
   - Should see welcome screen

5. **Test Chat Flow**
   - Tap "Let's Begin"
   - Verify first question appears
   - Type answer and send
   - Verify typing indicator appears
   - Verify AI response appears
   - Check progress bar updates
   - Check dimension badges update

6. **Test Features**
   - ✅ Skip button functionality
   - ✅ Restart functionality (with confirmation)
   - ✅ Error handling (test with backend down)
   - ✅ Offline storage (chat history persists)
   - ✅ Typing indicators show during processing
   - ✅ Scroll to bottom on new messages
   - ✅ Keyboard behavior (doesn't cover input)

7. **Complete Profile**
   - Answer all questions
   - Verify personality summary
   - Tap "Confirm & Create"
   - Should navigate to profile screen

### AsyncStorage Testing
- Close app mid-conversation
- Reopen app
- Navigate back to Create Profile
- Verify chat history is restored
- Verify can continue from where left off

## Integration Testing

### End-to-End Test Flow

1. **Web App → Backend → Database**
   - Create profile on web app
   - Verify API calls in network tab
   - Check database for created profile
   - Verify dimension scores are saved

2. **Mobile App → Backend → Database**
   - Create profile on mobile app
   - Verify API calls in logs
   - Check database for created profile
   - Verify personality data matches responses

3. **Cross-Platform Consistency**
   - Create profile with same wallet on web
   - Try to create again on mobile
   - Should see "Profile already exists" error

## Performance Testing

- Test with multiple concurrent users
- Measure response times for AI analysis
- Test session cleanup (old sessions removed)
- Test with very long text responses (500 char limit)

## Security Testing

- Test with invalid session IDs
- Test accessing other user's sessions
- Test SQL injection in responses
- Test XSS in chat messages
- Verify wallet signature verification (when implemented)

## Known Limitations

1. **Session Storage**: Currently in-memory (will be lost on server restart)
   - For production: Move to Redis or database

2. **No Rate Limiting**: Users can spam the API
   - For production: Add rate limiting per wallet address

3. **No Authentication**: Using wallet address directly
   - For production: Add JWT or signature verification

4. **OpenAI Dependency**: Requires OpenAI API key
   - Add fallback for when API is down
   - Consider caching common responses

## Success Criteria

- ✅ All 5 dimensions are captured
- ✅ AI generates meaningful personality scores
- ✅ Profile is created in database
- ✅ User experience is smooth and conversational
- ✅ Error handling works properly
- ✅ Chat history persists across page reloads
- ✅ Mobile app has feature parity with web app
