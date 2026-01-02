# Firebase Cloud Messaging Setup Guide

This guide explains how to set up Firebase Cloud Messaging (FCM) for push notifications in VibeConnect.

## Overview

VibeConnect uses Firebase Cloud Messaging to send push notifications to users when they receive:
- New connection requests from other users
- Acceptance of their connection requests

The system is designed to work gracefully without Firebase credentials, making it suitable for development environments where notifications aren't required.

## Prerequisites

1. A Google account
2. Access to the [Firebase Console](https://console.firebase.google.com/)
3. Your VibeConnect project running

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select an existing project
3. Follow the setup wizard:
   - Enter your project name (e.g., "VibeConnect")
   - Enable Google Analytics (optional but recommended)
   - Choose or create a Google Analytics account
4. Click "Create project"

## Step 2: Add Android App (Optional)

If you're deploying to Android:

1. In your Firebase project, click the Android icon
2. Register your app:
   - **Android package name**: Use your app's package name (e.g., `com.vibeconnect.app`)
   - **App nickname**: "VibeConnect Android" (optional)
   - **Debug signing certificate SHA-1**: Get this by running `expo credentials:manager` (optional for development)
3. Download the `google-services.json` file
4. Place it in your mobile app's root directory (for Expo, this is handled automatically)

## Step 3: Add iOS App (Optional)

If you're deploying to iOS:

1. In your Firebase project, click the iOS icon
2. Register your app:
   - **iOS bundle ID**: Use your app's bundle identifier (e.g., `com.vibeconnect.app`)
   - **App nickname**: "VibeConnect iOS" (optional)
3. Download the `GoogleService-Info.plist` file
4. Follow the Expo-specific setup instructions

## Step 4: Generate Service Account Key

This is the critical step for backend integration:

1. In Firebase Console, go to **Project Settings** (click the gear icon)
2. Navigate to the **Service Accounts** tab
3. Click **Generate New Private Key**
4. Confirm by clicking **Generate Key**
5. Save the downloaded JSON file securely - this contains sensitive credentials!

## Step 5: Configure Backend Environment Variables

You have two options for providing Firebase credentials to the backend:

### Option A: Using a File Path (Recommended for Production)

1. Save the service account JSON file to a secure location on your server
2. Add the file path to your `.env` file:

```bash
FIREBASE_CREDENTIALS_PATH=/path/to/your/serviceAccountKey.json
```

### Option B: Using JSON String (Recommended for Docker/Cloud Deployments)

1. Convert the JSON file to a single-line string
2. Add it to your `.env` file:

```bash
FIREBASE_CREDENTIALS_JSON='{"type":"service_account","project_id":"your-project",...}'
```

**Important**: For Option B, make sure to:
- Use single quotes around the JSON string
- Keep the entire JSON on one line
- Escape any special characters if necessary

## Step 6: Run Database Migration

Apply the migration to add the `device_token` field to user profiles:

```bash
cd backend
psql $DATABASE_URL < migrations/003_add_device_token.sql
```

Or if using a different database tool:

```sql
-- Run the contents of backend/migrations/003_add_device_token.sql
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS device_token VARCHAR(512) NULL;
CREATE INDEX IF NOT EXISTS idx_user_profiles_device_token ON user_profiles(device_token);
```

## Step 7: Verify Setup

1. Restart your backend server:

```bash
cd backend
python main.py
```

2. Check the logs for Firebase initialization:
   - ✅ Success: `Firebase Admin SDK initialized from file` or `Firebase Admin SDK initialized from JSON`
   - ⚠️ Warning: `Firebase credentials not found. Push notifications disabled.`
   - ❌ Error: `Error initializing Firebase Admin SDK: [error details]`

## Step 8: Configure Mobile App

The mobile app automatically handles push notifications if Expo is properly configured:

1. Install dependencies:

```bash
cd mobile
npm install
```

2. For Expo development:
   - Notifications will work in the Expo Go app on physical devices
   - iOS Simulator and Android Emulator have limited notification support

3. For production builds, configure your `app.json`:

```json
{
  "expo": {
    "android": {
      "googleServicesFile": "./google-services.json"
    },
    "ios": {
      "googleServicesFile": "./GoogleService-Info.plist"
    },
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#FF231F7C",
      "androidMode": "default",
      "androidCollapsedTitle": "#{unread_notifications} new notifications"
    }
  }
}
```

## Testing Notifications

### Test 1: Verify Device Token Registration

1. Open the mobile app and connect your wallet
2. Check the app logs for: `Device token registered with backend`
3. Verify in the database:

```sql
SELECT wallet_address, device_token
FROM user_profiles
WHERE device_token IS NOT NULL;
```

### Test 2: Send a Test Notification

You can test notifications manually using the Firebase Console:

1. Go to **Cloud Messaging** in Firebase Console
2. Click **Send your first message**
3. Enter a notification title and text
4. Click **Send test message**
5. Enter your device's FCM token (get this from app logs: `Expo Push Token: ExponentPushToken[...]`)
6. Click **Test**

### Test 3: End-to-End Connection Request

1. Create two user accounts
2. Have them both check into the same event
3. When one user accepts the match, the other should receive a push notification

## Troubleshooting

### Notifications Not Sending

**Check 1: Firebase Credentials**
```bash
# Verify environment variable is set
echo $FIREBASE_CREDENTIALS_PATH
# OR
echo $FIREBASE_CREDENTIALS_JSON
```

**Check 2: Device Token**
```sql
-- Verify device tokens are being stored
SELECT COUNT(*) FROM user_profiles WHERE device_token IS NOT NULL;
```

**Check 3: Backend Logs**
- Look for: `Successfully sent notification: [message_id]`
- Or: `Error sending notification: [error]`

### Permission Denied

If you see `Permission denied` errors:
1. Verify the service account has the "Firebase Cloud Messaging Admin" role
2. Ensure the service account key file is readable by the application
3. Check that the JSON is valid (use a JSON validator)

### Invalid Token Errors

If you see `Invalid registration token`:
- The device token may have expired
- User may have uninstalled the app
- The notification service automatically handles this gracefully

### iOS Notifications Not Working

For iOS in development:
- Notifications don't work in the iOS Simulator
- Use a physical device for testing
- Ensure you've configured APNs in Firebase (Project Settings > Cloud Messaging)

## Security Best Practices

1. **Never commit the service account JSON file to version control**
   - Add it to `.gitignore`
   - Use environment variables in production

2. **Restrict service account permissions**
   - Only grant the minimum required permissions
   - Use Firebase's built-in service account

3. **Rotate credentials regularly**
   - Generate new service account keys periodically
   - Revoke old keys after updating

4. **Use different projects for development and production**
   - Separate Firebase projects prevent accidental notifications to production users

## Development Without Firebase

The notification system is designed to work gracefully without Firebase:

1. No environment variables needed for local development
2. The backend will log: `Warning: Firebase credentials not found`
3. Notification sending will return `false` but won't crash
4. All other features work normally

This allows developers to work on the app without needing Firebase credentials.

## Additional Resources

- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Expo Notifications Documentation](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review backend logs for detailed error messages
3. Verify all environment variables are set correctly
4. Test with the Firebase Console's "Send test message" feature
