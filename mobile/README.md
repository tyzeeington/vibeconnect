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

- **Wallet Connection**: WalletConnect v2 integration with persistent sessions
- **Event Check-in**: Camera & location access for QR code scanning
- **Proximity Matching**: Background location tracking during events
- **AI Profile**: Same conversational onboarding as web
- **Social Profiles**: Aggregate Instagram, Twitter, LinkedIn, Spotify (unlocked after connection)
- **Push Notifications**: Connection requests & match notifications
- **Offline Mode**: Cache data for offline viewing with AsyncStorage

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
├── App.tsx                        # Main entry point with WalletProvider
├── app.json                       # Expo configuration
├── assets/                        # Images, fonts, icons
├── src/
│   ├── context/
│   │   └── WalletContext.tsx     # Wallet state management
│   ├── services/
│   │   ├── api.ts                # Backend API client
│   │   └── walletConnect.ts      # WalletConnect v2 service
│   ├── screens/                  # App screens (to be added)
│   ├── components/               # Reusable components (to be added)
│   ├── hooks/                    # Custom React hooks (to be added)
│   └── navigation/               # Navigation setup (to be added)
```

## API Integration

Backend URL: `https://vibeconnect-production.up.railway.app`

All API calls use the same endpoints as the web app.

## Environment

Configuration in `app.json` under `extra`:
- `apiUrl`: Backend API URL
- `walletConnectProjectId`: WalletConnect Project ID

## Wallet Integration

The app uses WalletConnect v2 for wallet connections:

- **WalletContext**: React context for managing wallet state
- **Session Persistence**: AsyncStorage keeps users logged in
- **Auto-reconnect**: Restores wallet session on app launch
- **Current State**: Simulated connection for development (tap "Connect Wallet")

To enable real wallet connections:
1. Implement QR code scanner for WalletConnect URI
2. Or use deep linking to connect with mobile wallets
3. Handle signing requests for NFT minting

## Next Steps

- [x] WalletConnect integration (simulated)
- [x] Backend API client
- [x] Wallet session persistence
- [ ] Add navigation (React Navigation)
- [ ] Build profile creation screen
- [ ] Build event check-in with QR scanner
- [ ] Implement push notifications
- [ ] Add location-based matching
- [ ] Build connections feed screen
- [ ] Add social profiles management
- [ ] Add NFT viewing
- [ ] Implement $PESO wallet display

## Tech Stack

- **Framework**: Expo SDK 54
- **Language**: TypeScript
- **Wallet**: WalletConnect v2 (@walletconnect/web3wallet, @walletconnect/core)
- **Storage**: AsyncStorage for session persistence
- **Location**: expo-location
- **Camera**: expo-camera (to be added)
- **Networking**: axios
- **Navigation**: React Navigation (to be added)
- **State Management**: React Context API

## License

Proprietary - VibeConnect
