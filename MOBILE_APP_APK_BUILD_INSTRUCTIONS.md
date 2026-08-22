# Mobile App APK Build Instructions

## Current Status
✅ Expo project fully configured and running
✅ TypeScript configuration fixed (removed expo/tsconfig extends)
✅ Dev server running successfully
✅ All screens implemented (Splash, Login, Register, Dashboard)
✅ Authentication flow complete
✅ Assets configured (icon, splash, adaptive-icon)

## Testing the App

### Option 1: Test in Expo Go (Fastest)
1. Download Expo Go app on your Android device
2. Run `npm start` in the mobile directory
3. Scan the QR code with Expo Go
4. App will load and you can test the full flow

### Option 2: Build APK for Distribution

#### Prerequisites
- EAS CLI installed: `eas --version` ✅ (already installed)
- Expo account (free tier available)
- Android device or emulator

#### Steps to Build APK

1. **Link to EAS Project** (one-time setup):
   ```bash
   cd mobile
   eas init
   ```
   - Follow the prompts to create/link an EAS project
   - This will update app.json with your projectId

2. **Build APK**:
   ```bash
   npm run build:android
   ```
   Or for preview build (faster):
   ```bash
   eas build --platform android --profile preview
   ```

3. **Download APK**:
   - Build will complete on EAS servers (5-15 minutes)
   - Download link will be provided in terminal
   - APK will be ready to install on Android device

#### Alternative: Local Build (Requires Android SDK)
If you have Android SDK installed locally:
```bash
eas build --platform android --local
```

## App Features Ready to Test

### Splash Screen
- Logo with zoom animation (0.5x → 1x over 1 second)
- Automatically transitions to login after 2 seconds

### Login Flow
- Email/password validation
- Connects to backend API
- Secure token storage using Expo SecureStore

### Registration
- Church name input
- Plan selection (Basic/Pro/Enterprise)
- User account creation

### Dashboard
- Displays user info and church name
- Shows authenticated user details
- Logout functionality

## Configuration Files

### app.json
- App name: "Ecclesia"
- Package: "com.ecclesia.app"
- Permissions: INTERNET, CAMERA, RECORD_AUDIO, ACCESS_NETWORK_STATE
- Icon and splash configured

### eas.json
- Preview build: APK format
- Production build: App Bundle format

### Environment Variables
Update `mobile/src/services/api-client.ts` if needed:
- API_URL: Points to your backend

## Next Steps

1. **Create EAS Account** (if not already done):
   - Visit https://expo.dev
   - Sign up for free account
   - Run `eas init` to link project

2. **Build and Test**:
   - Run `npm run build:android`
   - Wait for build to complete
   - Download and install APK on Android device

3. **Test Full Flow**:
   - Launch app
   - See splash screen animation
   - Login with test credentials
   - Verify dashboard displays correctly
   - Test logout

## Troubleshooting

### "Invalid UUID appId" Error
- Run `eas init` to properly link the project
- Ensure you're logged in: `eas login`

### Build Fails
- Check internet connection
- Verify app.json is valid JSON
- Ensure all required fields are set

### App Won't Start
- Check that backend API is accessible
- Verify API_URL in api-client.ts
- Check console logs in Expo Go for errors

## Dev Server Status
✅ Running on: `npm start` in mobile directory
- Accessible via Expo Go app
- Hot reload enabled
- TypeScript compilation working
