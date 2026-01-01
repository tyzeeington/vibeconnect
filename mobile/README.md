# VibeConnect Mobile App

Native iOS & Android app built with Expo and React Native.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npx expo start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Run in web browser (for testing)
npm run web
```

## Features

- **Wallet Connection**: WalletConnect v2 integration
- **Event Check-in**: Camera & location access for QR code scanning
- **Proximity Matching**: Background location tracking during events
- **AI Profile**: Same conversational onboarding as web
- **Push Notifications**: Connection requests & match notifications
- **Offline Mode**: Cache data for offline viewing

## Development

### Prerequisites
- Node.js 18+
- Expo CLI
- iOS: Xcode 14+ and iOS Simulator
- Android: Android Studio and Android Emulator

### Testing on Device

1. Install Expo Go app from App Store / Play Store
2. Scan QR code from `npx expo start`
3. App runs on your physical device

### Building for Production

```bash
# Configure EAS Build
npx expo install eas-cli
npx eas build:configure

# Build for iOS
npx eas build --platform ios

# Build for Android
npx eas build --platform android

# Submit to App Store
npx eas submit --platform ios

# Submit to Google Play
npx eas submit --platform android
```

## Architecture

```
mobile/
├── App.tsx                 # Main entry point
├── app.json               # Expo configuration
├── assets/                # Images, fonts, icons
├── src/
│   ├── screens/          # App screens
│   ├── components/       # Reusable components
│   ├── services/         # API & wallet services
│   ├── hooks/            # Custom React hooks
│   └── navigation/       # Navigation setup
```

## API Integration

Backend URL: `https://vibeconnect-production.up.railway.app`

All API calls use the same endpoints as the web app.

## Environment

Configuration in `app.json` under `extra`:
- `apiUrl`: Backend API URL
- `walletConnectProjectId`: WalletConnect Project ID

## Next Steps

- [ ] Implement full WalletConnect integration
- [ ] Add navigation (React Navigation)
- [ ] Build event check-in with QR scanner
- [ ] Implement push notifications
- [ ] Add location-based matching
- [ ] Build connections feed
- [ ] Add NFT viewing
- [ ] Implement $PESO wallet

## Tech Stack

- **Framework**: Expo SDK 52
- **Language**: TypeScript
- **Wallet**: WalletConnect v2
- **Location**: expo-location
- **Camera**: expo-camera
- **Networking**: axios
- **Navigation**: React Navigation (to be added)

## License

Proprietary - VibeConnect
