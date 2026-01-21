# 🗺️ Mapbox Integration Guide

Your VibeConnect events page **already has full Mapbox integration built in**! You just need to add your API token.

## ✅ What's Already Built

Your `/events` page includes:

- **Interactive dark-themed map** (perfect for the vibe aesthetic)
- **User location marker** (blue pulsing dot)
- **Event markers** (emoji-based, by event type)
- **Click interactions** (click marker → shows event details)
- **Navigation controls** (zoom, rotate, compass)
- **Geolocate button** (track user location in real-time)
- **Responsive design** (list/map toggle on mobile)
- **Proximity filtering** (radius slider with live updates)

## 🔧 Setup Steps

### 1. Get Your Mapbox Token

You've already signed up! Now get your token:

1. Go to https://account.mapbox.com/access-tokens/
2. Copy your **Default public token** (starts with `pk.`)
3. Or create a new token with these scopes:
   - `styles:read`
   - `fonts:read`
   - `datasets:read`

### 2. Add Token to Local Environment

Replace the placeholder in `.env.local`:

```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=a3daa77487c8eb6cc5f861ef4d01f6fa
NEXT_PUBLIC_MAPBOX_TOKEN=pk.YOUR_ACTUAL_TOKEN_HERE
```

### 3. Add Token to Vercel (Production)

When you deploy to Vercel:

**Option A: Vercel Dashboard**
1. Go to your project → Settings → Environment Variables
2. Add new variable:
   - **Name**: `NEXT_PUBLIC_MAPBOX_TOKEN`
   - **Value**: `pk.YOUR_ACTUAL_TOKEN_HERE`
   - **Environments**: Production, Preview, Development
3. Redeploy

**Option B: Vercel CLI**
```bash
cd frontend
vercel env add NEXT_PUBLIC_MAPBOX_TOKEN
# Paste your token when prompted
vercel --prod
```

### 4. Restart Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

### 5. Test the Map

1. Open http://localhost:3000/events
2. Connect your wallet
3. Allow location access when prompted
4. You should see:
   - Dark map centered on your location
   - Blue pulsing marker (you)
   - Event markers (emojis) scattered around
   - Click any marker to highlight the event

## 🎨 Map Features

### Visual Style
- **Theme**: `mapbox://styles/mapbox/dark-v11` (perfectly matches your purple gradient aesthetic)
- **Markers**: Emoji-based (🎵 music, 🤝 networking, 🎨 art, ⚽ sports, 🍽️ food)
- **Animations**: Pulsing user location, bouncing selected event

### Interactions
- **Click event marker** → Highlights event in list + shows popup
- **Click event card** → Centers map on that event
- **Drag/zoom** → Standard map navigation
- **Geolocate button** (top-right) → Recenter on your location

### Filtering
All filters work with the map in real-time:
- **Radius slider** → Updates visible events instantly
- **Event type** → Filters map markers
- **Search** → Filters both list and map
- **Sort** → Reorders list (map shows all in radius)

## 🌍 Map Behavior

### User Location
```
Blue pulsing marker = Your location
- Auto-requests location on page load
- Falls back to NYC if denied
- Geolocate button to re-center
```

### Event Markers
```
Emoji markers = Events
- Size increases on hover
- Bounces + pulses when selected
- Shows distance from you
```

### Mobile Responsive
```
Mobile: Toggle between List / Map view
Desktop: Split view (both visible)
```

## 🔒 Token Best Practices

### Public Token (Safe for Frontend)
✅ Use `pk.` tokens in frontend code
✅ These are **meant to be public**
✅ Restrict by URL in Mapbox dashboard:
   - Add: `localhost:3000`
   - Add: `*.vercel.app`
   - Add: `vibeconnect.app` (when you have custom domain)

### URL Restrictions (Optional but Recommended)
1. Go to https://account.mapbox.com/access-tokens/
2. Click your token
3. Under "URL restrictions", add:
   ```
   http://localhost:3000/*
   https://*.vercel.app/*
   https://vibeconnect.app/*
   ```
4. This prevents other sites from using your token

## 🧪 Testing Checklist

After adding your token:

- [ ] Map loads without errors
- [ ] Your location shows as blue marker
- [ ] Event markers appear at correct locations
- [ ] Clicking marker highlights event in list
- [ ] Clicking event card centers map
- [ ] Geolocate button re-centers on you
- [ ] Radius slider updates visible events
- [ ] Mobile list/map toggle works
- [ ] No console errors

## 🐛 Troubleshooting

### Map Shows "Map Unavailable"
- Check that `NEXT_PUBLIC_MAPBOX_TOKEN` is set in `.env.local`
- Ensure token starts with `pk.`
- Restart dev server after adding token

### Location Shows "Location access denied"
- Browser blocked location access
- Try clicking the geolocate button (top-right of map)
- Or allow location in browser settings

### Map Loads but No Events
- Check that events have valid latitude/longitude
- Increase radius slider to 50km
- Check browser console for API errors

### Token Error / 401 Unauthorized
- Token might be expired or invalid
- Generate a new token at https://account.mapbox.com/
- Make sure token has `styles:read` scope

## 🌟 Future Enhancements

Once basic map is working, you can add:

1. **Heat Maps**: Show event density by area
2. **Cluster Markers**: Group nearby events when zoomed out
3. **Route Planning**: "Get directions to event"
4. **3D Buildings**: For urban events
5. **Custom Markers**: Upload custom event icons
6. **Live Updates**: WebSocket to show new events in real-time

## 📚 Mapbox Documentation

- **React Integration**: https://visgl.github.io/react-map-gl/
- **Styles**: https://docs.mapbox.com/api/maps/styles/
- **Markers**: https://visgl.github.io/react-map-gl/docs/api-reference/marker
- **Controls**: https://visgl.github.io/react-map-gl/docs/api-reference/navigation-control

---

**Your map is ready to go!** Just add the token and watch your events come to life on a beautiful, interactive map. 🗺️✨
