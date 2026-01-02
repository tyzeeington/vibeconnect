# Events Discovery Page - Map Integration Setup Guide

## Overview

The Events Discovery Page (`/events`) now features a comprehensive map integration using Mapbox GL JS. This document explains how to set up the map feature and what functionality is available.

## Features Implemented

### Core Features
- **Interactive Map View**: Full-featured map using Mapbox with dark theme
- **Split-Screen Layout**: Desktop shows both map and list side-by-side
- **Mobile-Responsive**: Toggle between map and list view on mobile devices
- **User Location Detection**: Automatically detects and shows user's location
- **Event Markers**: Interactive markers for each event on the map
- **Radius Filtering**: Adjustable radius slider (1-50km) to filter nearby events
- **Event Type Filtering**: Filter events by category (Music, Art, Sports, Food, Networking)
- **Multiple Sort Options**: Sort by nearest, soonest, or most popular
- **Search Functionality**: Search events by name, type, or description
- **Click Interactions**: Click markers to highlight events and scroll to them in the list
- **Distance Display**: Shows distance from user to each event
- **Loading States**: Proper loading indicators while fetching data
- **Error Handling**: Graceful degradation when map token is unavailable

### Map-Specific Features
- **User Location Marker**: Animated marker showing current position
- **Event Markers**: Emoji-based markers for different event types
- **Selected Event Highlight**: Animated bounce effect on selected markers
- **Map Controls**: Zoom, rotation, and geolocation controls
- **Auto-Center**: Centers map on user location

### Graceful Degradation
The app **works without a Mapbox token**:
- Shows a clear warning banner with setup instructions
- Event list view remains fully functional
- All filtering, sorting, and search features work
- Check-in functionality works normally
- Map area shows a friendly message with link to get Mapbox token

## Setup Instructions

### 1. Install Dependencies

```bash
cd frontend
npm install
```

This will install:
- `react-map-gl@^7.1.7` - React wrapper for Mapbox GL JS
- `mapbox-gl@^3.1.2` - Mapbox GL JS library
- `@types/mapbox-gl@^3.1.0` - TypeScript type definitions

### 2. Get Mapbox API Token

#### Sign Up for Mapbox (Free Tier)
1. Go to [https://www.mapbox.com/](https://www.mapbox.com/)
2. Click "Start for free" or "Sign up"
3. Create an account (free tier includes 50,000 map loads/month)

#### Get Your Access Token
1. After signing in, go to [https://account.mapbox.com/](https://account.mapbox.com/)
2. Navigate to "Access tokens" section
3. You'll see a **Default public token** - copy this
4. Or create a new token:
   - Click "Create a token"
   - Give it a name (e.g., "VibeConnect Development")
   - Select the following scopes:
     - ✓ `styles:read`
     - ✓ `fonts:read`
     - ✓ `datasets:read`
   - Click "Create token"
   - Copy the token (it starts with `pk.`)

### 3. Configure Environment Variables

#### Create .env.local file
```bash
cd frontend
cp .env.local.example .env.local
```

#### Edit .env.local
```bash
# Open in your editor
nano .env.local  # or vim, code, etc.
```

Add your Mapbox token:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbGV4YW1wbGUifQ.example_token_here
```

**Important Notes:**
- The token MUST start with `pk.` (public token)
- The variable MUST be prefixed with `NEXT_PUBLIC_` to be accessible in the browser
- Never commit `.env.local` to git (it's already in `.gitignore`)

### 4. Restart Development Server

```bash
npm run dev
```

The development server must be restarted for environment variables to take effect.

### 5. Verify Setup

1. Navigate to [http://localhost:3000/events](http://localhost:3000/events)
2. Connect your wallet
3. If the token is configured correctly:
   - You'll see an interactive map
   - Event markers will appear
   - Your location will show with a blue pulsing marker
   - No warning banner will appear

4. If the token is NOT configured:
   - You'll see a yellow warning banner at the top
   - Map area will show "Map Unavailable" message
   - Event list will still work perfectly
   - All features except map visualization work

## Usage Guide

### Desktop View
- **Left Side**: Scrollable list of events with details
- **Right Side**: Interactive map with markers
- Click an event in the list to highlight it on the map
- Click a marker on the map to highlight the event in the list

### Mobile View
- Toggle between "List" and "Map" views using buttons at the top
- All functionality works the same in both views

### Filtering Events
1. **Radius Slider**: Drag to adjust search radius (1-50km)
2. **Event Type**: Dropdown to filter by category
3. **Sort By**: Choose nearest, soonest, or most popular
4. **Search**: Type to search event names, types, or descriptions

### Interacting with Events
- Click "Check In" to check into an event (requires wallet connection)
- Click an event card to select it and see it on the map
- Click a map marker to select the event and scroll to it in the list
- Distance from your location is shown on each event card

### Map Controls
- **Navigation Control** (top-right): Zoom and rotate
- **Geolocate Control** (top-right): Re-center on your location
- **Mouse/Touch**: Drag to pan, scroll/pinch to zoom

## Technical Details

### Architecture
- **Dynamic Imports**: Map components use `next/dynamic` to avoid SSR issues
- **Client-Side Only**: Map rendering happens only in browser
- **Responsive Design**: Tailwind CSS with mobile-first approach
- **State Management**: React hooks for local state
- **Distance Calculation**: Haversine formula for accurate km calculations

### Performance Optimizations
- Lazy loading of map components
- Efficient filtering and sorting
- Debounced search (searches as you type)
- Minimal re-renders with proper React dependencies

### Error Handling
- Location permission denied: Falls back to NYC coordinates
- No Mapbox token: Shows warning and disables map
- API errors: Falls back to mock data for development
- Failed check-ins: Shows user-friendly error messages

### Accessibility
- Keyboard navigation support
- ARIA labels on interactive elements
- High contrast text for readability
- Focus indicators on all interactive elements

## API Integration

### Expected Backend Endpoints

#### GET /api/events/active
Returns all active events:
```json
[
  {
    "id": 1,
    "event_id": "event-001",
    "venue_name": "Brooklyn Warehouse Party",
    "event_type": "Music",
    "start_time": "2025-01-15T20:00:00",
    "end_time": "2025-01-16T02:00:00",
    "latitude": 40.7128,
    "longitude": -74.0060,
    "attendee_count": 24,
    "description": "Underground house music party"
  }
]
```

#### POST /api/events/checkin
Check into an event:
```json
{
  "wallet_address": "0x...",
  "event_id": "event-001"
}
```

## Troubleshooting

### Map Not Showing
1. **Check .env.local exists**: `ls -la frontend/.env.local`
2. **Verify token format**: Should start with `pk.`
3. **Restart dev server**: `npm run dev`
4. **Check browser console**: Look for Mapbox-related errors
5. **Verify token is valid**: Test at [https://account.mapbox.com/](https://account.mapbox.com/)

### Location Not Working
1. **Check browser permissions**: Allow location access when prompted
2. **Use HTTPS in production**: Geolocation requires secure context
3. **Check browser console**: Look for geolocation errors
4. **Fallback works**: App defaults to NYC if location denied

### Events Not Loading
1. **Check backend is running**: Visit `http://localhost:8000/health`
2. **Check API_URL**: Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. **Mock data works**: App shows sample events if API fails

### TypeScript Errors
1. **Install type definitions**: `npm install @types/mapbox-gl`
2. **Clear cache**: `rm -rf .next && npm run dev`
3. **Check TypeScript version**: Should be `^5.0.0`

## Production Deployment

### Environment Variables
Add to your hosting platform (Vercel, Railway, etc.):
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.com
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_production_token
```

### Mapbox Token Security
- **Public tokens are safe**: The `pk.` prefix indicates a public token
- **Set URL restrictions**: In Mapbox dashboard, restrict token to your domain
- **Monitor usage**: Check Mapbox dashboard for usage statistics
- **Free tier limits**: 50,000 map loads/month (refreshes monthly)

### Performance Tips
- Enable Mapbox GL JS CSS in production build
- Use map style caching
- Consider lazy loading the entire events page
- Monitor Mapbox API usage in dashboard

## Future Enhancements

Potential improvements for later:
- [ ] Add map clustering for many events
- [ ] Custom map markers with event images
- [ ] Draw radius circle on map
- [ ] Add directions to events
- [ ] Save favorite events
- [ ] Show event density heatmap
- [ ] Add map style switcher (light/dark/satellite)
- [ ] Event creation from map click
- [ ] Real-time event updates
- [ ] AR view for nearby events

## Support

### Resources
- [Mapbox GL JS Docs](https://docs.mapbox.com/mapbox-gl-js/)
- [react-map-gl Docs](https://visgl.github.io/react-map-gl/)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

### Common Issues
- **CORS errors**: Check backend CORS configuration
- **Rate limiting**: Mapbox free tier has usage limits
- **Token expired**: Regenerate token in Mapbox dashboard

---

**Last Updated**: January 2, 2026
**Version**: 1.0.0
**Status**: Ready for development use
