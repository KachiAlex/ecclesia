# Ecclesia Mobile App - Setup Guide

## ✅ Task 1 Complete: Expo Project Setup

The Expo mobile app project has been initialized with all necessary dependencies and configuration.

## 📁 Project Structure

```
mobile/
├── src/
│   ├── App.tsx                 # Root app component with navigation
│   ├── screens/
│   │   ├── SplashScreen.tsx    # Animated splash screen with logo zoom
│   │   ├── LoginScreen.tsx     # Login form
│   │   ├── RegisterScreen.tsx  # Registration form
│   │   └── DashboardScreen.tsx # Dashboard (placeholder)
│   ├── services/
│   │   ├── api-client.ts       # HTTP client with auth interceptors
│   │   └── auth-service.ts     # Authentication service
│   ├── store/
│   │   └── auth-store.ts       # Zustand auth state management
│   └── types/
│       └── index.ts            # TypeScript type definitions
├── app.json                    # Expo configuration
├── package.json                # Dependencies
├── tsconfig.json               # TypeScript configuration
├── index.ts                    # Entry point
└── .env.example                # Environment variables template
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd mobile
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and set your API URL:
```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### 3. Start the Development Server

```bash
npm start
```

This will start the Expo development server. You'll see a QR code in the terminal.

### 4. Run on Android

Option A: Using Expo Go (easiest for testing)
```bash
npm run android
```

Option B: Using Android Emulator
- Make sure Android Emulator is running
- Press `a` in the Expo CLI

### 5. Run on iOS (Mac only)

```bash
npm run ios
```

## 📱 Features Implemented

### ✅ Splash Screen
- Animated logo with zoom effect (0.5x → 1x scale)
- 3-second total duration
- Auto-transition to login screen
- Loading indicator display

### ✅ Login Screen
- Email and password input fields
- Error handling and display
- Loading state during authentication
- Link to registration screen
- Connected to backend API

### ✅ Registration Screen
- Church name, email, password fields
- Plan selection (Basic/Pro)
- Error handling
- Link back to login screen
- Connected to backend API

### ✅ Dashboard Screen
- Displays user information
- Shows church details
- Logout functionality
- Placeholder for future features

### ✅ Authentication Services
- API client with Axios
- Secure token storage using Expo SecureStore
- Auth service with login/register/logout
- Zustand state management
- Automatic token inclusion in requests

## 🔧 Configuration

### app.json
- App name: "Ecclesia"
- Package: "com.ecclesia.app"
- Permissions: INTERNET, CAMERA, RECORD_AUDIO
- Plugins: expo-secure-store

### Environment Variables
- `EXPO_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000)

## 📦 Dependencies

### Core
- `expo`: ^50.0.0
- `react`: ^18.2.0
- `react-native`: ^0.73.0

### Navigation
- `@react-navigation/native`: ^6.1.9
- `@react-navigation/stack`: ^6.3.20
- `@react-navigation/bottom-tabs`: ^6.5.11

### State Management
- `zustand`: ^4.4.1

### HTTP Client
- `axios`: ^1.6.2

### Security
- `expo-secure-store`: ^12.3.1

### UI/UX
- `react-native-reanimated`: ^3.6.0
- `expo-splash-screen`: ^0.26.4

## 🔐 Security Features

- Secure token storage using Expo SecureStore
- Automatic token refresh on 401 errors
- Request interceptors for auth headers
- Secure logout with token clearing

## 🧪 Testing

### Manual Testing
1. Start the app with `npm start`
2. Test splash screen animation
3. Test login with valid/invalid credentials
4. Test registration flow
5. Test logout functionality

### Next Steps
- Implement property-based tests (Task 2.2)
- Implement unit tests (Task 5.2, 6.2)
- Implement integration tests (Task 9.2, 12.2)

## 📝 Next Task

**Task 2: Create API client and authentication service**

The API client and auth service have already been created in this setup:
- `src/services/api-client.ts` - HTTP client with interceptors
- `src/services/auth-service.ts` - Authentication service

Next, you can proceed to:
- Task 2.2: Write property tests for API client
- Task 2.4: Write property tests for authentication

## 🐛 Troubleshooting

### Port Already in Use
If port 19000 is already in use:
```bash
npm start -- --port 19001
```

### Clear Cache
```bash
npm start -- --clear
```

### Reset Node Modules
```bash
rm -rf node_modules
npm install
```

### Emulator Issues
- Make sure Android Emulator is running before starting the app
- Check that `adb` is in your PATH
- Restart the emulator if connection fails

## 📚 Resources

- [Expo Documentation](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [Zustand](https://github.com/pmndrs/zustand)
- [Axios](https://axios-http.com)
- [Expo SecureStore](https://docs.expo.dev/modules/securestore)

## ✨ What's Next

After completing the setup, you can:

1. **Customize the UI** - Update colors, fonts, and layouts
2. **Add More Screens** - Implement dashboard features
3. **Connect to Backend** - Update API endpoints
4. **Build APK** - Generate production APK for distribution
5. **Add Tests** - Implement property-based and unit tests

---

**Status**: ✅ Task 1 Complete
**Next Task**: Task 2 - Create API client and authentication service (already done!)
**Estimated Time to APK**: 2-3 days for MVP
