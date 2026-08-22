# Mobile App Implementation Reference

## What's Been Built

### Core Services

#### API Client (`mobile/src/services/api-client.ts`)
- Axios-based HTTP client
- Automatic auth token injection
- Request/response interceptors
- 401 error handling
- Secure token storage with Expo SecureStore
- Methods: `get()`, `post()`, `put()`, `delete()`

#### Auth Service (`mobile/src/services/auth-service.ts`)
- `login(email, password)` - Authenticate user
- `register(churchName, email, password, plan)` - Create new account
- `logout()` - Clear session
- `getStoredToken()` - Retrieve saved token
- `validateToken()` - Check token validity

#### Auth Store (`mobile/src/store/auth-store.ts`)
- Zustand state management
- Global auth state: `user`, `token`, `isLoading`, `isAuthenticated`, `error`
- Actions: `login()`, `register()`, `logout()`, `restoreToken()`, `clearError()`
- Automatic session recovery on app launch

### Screens

#### Splash Screen (`mobile/src/screens/SplashScreen.tsx`)
- Logo zoom animation (0.5x → 1x over 1 second)
- Loading indicator
- Auto-transition after 3 seconds
- Fade-out effect

#### Login Screen (`mobile/src/screens/LoginScreen.tsx`)
- Email input field
- Password input field
- Form validation
- Loading state
- Error display
- Link to registration
- Connected to auth store

#### Register Screen (`mobile/src/screens/RegisterScreen.tsx`)
- Church name input
- Email input
- Password input
- Plan selection (Basic/Pro toggle)
- Form validation
- Error display
- Link back to login
- Connected to auth store

#### Dashboard Screen (`mobile/src/screens/DashboardScreen.tsx`)
- User information display
- Church details
- User role
- Logout button
- Responsive card layout

### Navigation (`mobile/src/App.tsx`)
- React Navigation setup
- Stack navigator
- Conditional rendering based on auth state
- Splash → Login → Register → Dashboard flow
- Smooth transitions

## API Endpoints Expected

The app expects these endpoints on your backend:

```
POST /api/auth/login
  Request: { email, password }
  Response: { user, token, refreshToken? }

POST /api/auth/register
  Request: { churchName, email, password, plan }
  Response: { user, token, refreshToken? }

POST /api/auth/logout
  Request: {}
  Response: {}

GET /api/auth/me
  Response: { user }
```

## Environment Variables

```
EXPO_PUBLIC_API_URL=http://localhost:3000
```

## Dependencies

```json
{
  "expo": "^50.0.0",
  "react": "^18.2.0",
  "react-native": "^0.73.0",
  "@react-navigation/native": "^6.1.9",
  "@react-navigation/stack": "^6.3.20",
  "axios": "^1.6.2",
  "zustand": "^4.4.1",
  "expo-secure-store": "^12.3.1",
  "expo-splash-screen": "^0.26.4",
  "expo-status-bar": "^1.11.1"
}
```

## File Structure

```
mobile/
├── src/
│   ├── App.tsx                    # Root component with navigation
│   ├── index.ts                   # Entry point
│   ├── screens/
│   │   ├── SplashScreen.tsx
│   │   ├── LoginScreen.tsx
│   │   ├── RegisterScreen.tsx
│   │   └── DashboardScreen.tsx
│   ├── services/
│   │   ├── api-client.ts
│   │   └── auth-service.ts
│   ├── store/
│   │   └── auth-store.ts
│   └── types/
│       └── index.ts
├── assets/
│   └── logo.png                   # Placeholder logo
├── app.json                       # Expo config
├── package.json
├── tsconfig.json
├── index.ts
└── .env.example
```

## How It Works

### App Startup Flow
1. App loads and calls `SplashScreen.preventAutoHideAsync()`
2. App.tsx calls `restoreToken()` to check for saved session
3. If token exists and is valid, user goes to Dashboard
4. If no token or invalid, user goes to Login
5. Splash screen hides after bootstrap completes

### Login Flow
1. User enters email/password on LoginScreen
2. Clicks "Login" button
3. `login()` action called in auth store
4. API client sends POST to `/api/auth/login`
5. Token stored in SecureStore
6. User state updated in store
7. Navigation automatically switches to Dashboard

### Registration Flow
1. User enters church name, email, password, plan
2. Clicks "Register" button
3. `register()` action called in auth store
4. API client sends POST to `/api/auth/register`
5. Token stored in SecureStore
6. User state updated in store
7. Navigation automatically switches to Dashboard

### Logout Flow
1. User clicks "Logout" on Dashboard
2. `logout()` action called
3. API client sends POST to `/api/auth/logout`
4. Token cleared from SecureStore
5. User state cleared
6. Navigation switches back to Login

### Token Management
- Tokens automatically included in all API requests via interceptor
- If 401 error received, token is cleared
- Tokens persisted in Expo SecureStore (encrypted on device)
- Session recovered on app restart if token still valid

## Customization Points

### Change API URL
Edit `mobile/.env.local`:
```
EXPO_PUBLIC_API_URL=https://your-api.com
```

### Customize Colors
Edit screen StyleSheets:
- Primary color: `#3b82f6` (blue)
- Text color: `#1f2937` (dark gray)
- Border color: `#d1d5db` (light gray)
- Error color: `#ef4444` (red)

### Add More Screens
1. Create new screen in `mobile/src/screens/`
2. Import in `App.tsx`
3. Add to Stack.Navigator
4. Update navigation logic

### Extend Dashboard
Add more cards or sections to `DashboardScreen.tsx` to display:
- Church information
- Recent activities
- Statistics
- Quick actions
- Settings

## Testing

### Manual Testing
1. Start dev server: `npm start -- --port 8082`
2. Open on Android: `npm run android`
3. Test login with valid credentials
4. Test registration with new church
5. Test logout
6. Close and reopen app to test session persistence

### Test Credentials
Use your backend's test credentials or create test accounts

## Troubleshooting

### Port Already in Use
```bash
npm start -- --port 8083
```

### Clear Cache
```bash
npm start -- --clear
```

### Reset Everything
```bash
rm -rf node_modules
npm install
npm start -- --clear
```

### Token Not Persisting
- Check that Expo SecureStore is working
- Verify backend returns token in response
- Check that `setAuthToken()` is called after login

### API Requests Failing
- Verify `EXPO_PUBLIC_API_URL` is correct
- Check backend is running
- Verify CORS is configured on backend
- Check network connectivity

## Next Steps

1. **Task 13**: Configure Expo for APK building
   - Set up app icons
   - Configure splash screen
   - Set up Android permissions

2. **Task 14**: Build APK
   - Run `eas build --platform android`
   - Test on Android device
   - Generate signed APK

3. **Future Enhancements**
   - Add more dashboard features
   - Implement push notifications
   - Add offline support
   - Add more screens (meetings, groups, etc.)
   - Implement biometric authentication

