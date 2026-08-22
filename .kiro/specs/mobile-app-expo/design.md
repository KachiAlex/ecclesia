# Design Document - Ecclesia Mobile App (Expo)

## Overview

This design describes the architecture and implementation approach for building the Ecclesia Church App as a native mobile application using Expo and React Native. The app will feature an animated splash screen with logo zoom effects, followed by a login flow that connects to the existing Next.js backend API. The design prioritizes code reuse from the web app while adapting components for mobile-specific interactions.

## Architecture

The mobile app follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         Presentation Layer              │
│  (Screens, Components, Navigation)      │
├─────────────────────────────────────────┤
│         Business Logic Layer            │
│  (Auth Service, API Client)             │
├─────────────────────────────────────────┤
│         Data Layer                      │
│  (Secure Storage, AsyncStorage)         │
├─────────────────────────────────────────┤
│         Backend API                     │
│  (Next.js Backend - Existing)           │
└─────────────────────────────────────────┘
```

### Key Design Decisions

1. **Expo over React Native CLI**: Faster development, easier APK building, no need for Android SDK setup
2. **Reuse Web Components**: Adapt existing React components from web app where possible
3. **Secure Token Storage**: Use Expo SecureStore for authentication tokens
4. **API Client**: Create a shared API client that works with both web and mobile
5. **Navigation**: Use React Navigation for mobile-optimized screen transitions

## Components and Interfaces

### Screen Components

#### 1. SplashScreen
- Displays Ecclesia logo with zoom animation
- Shows loading indicator
- Auto-transitions to LoginScreen after animation completes
- Duration: 3 seconds total (1s animation + 1s hold + 1s fade)

```typescript
interface SplashScreenProps {
  onAnimationComplete: () => void
}
```

#### 2. LoginScreen
- Email and password input fields
- Login button
- Registration link
- Error message display
- Loading state during authentication

```typescript
interface LoginScreenProps {
  onLoginSuccess: (user: User) => void
  onNavigateToRegister: () => void
}
```

#### 3. RegisterScreen
- Church name, email, password fields
- Register button
- Login link
- Error handling

```typescript
interface RegisterScreenProps {
  onRegisterSuccess: (user: User) => void
  onNavigateToLogin: () => void
}
```

#### 4. DashboardScreen
- Reuses existing dashboard components from web app
- Mobile-optimized layout
- Bottom tab navigation

### Services

#### AuthService
- Handles login/registration API calls
- Manages token storage and retrieval
- Provides session management

```typescript
interface AuthService {
  login(email: string, password: string): Promise<AuthResponse>
  register(data: RegisterData): Promise<AuthResponse>
  logout(): Promise<void>
  getStoredToken(): Promise<string | null>
  setToken(token: string): Promise<void>
}
```

#### APIClient
- Centralized HTTP client for all API requests
- Automatically includes authentication tokens
- Handles error responses

```typescript
interface APIClient {
  get(endpoint: string): Promise<any>
  post(endpoint: string, data: any): Promise<any>
  setAuthToken(token: string): void
}
```

## Data Models

### User
```typescript
interface User {
  id: string
  email: string
  name: string
  role: 'ADMIN' | 'MEMBER' | 'LEADER'
  churchId: string
}
```

### AuthResponse
```typescript
interface AuthResponse {
  user: User
  token: string
  refreshToken?: string
}
```

### RegisterData
```typescript
interface RegisterData {
  churchName: string
  email: string
  password: string
  plan: 'basic' | 'pro'
}
```

## Navigation Structure

```
RootNavigator
├── SplashStack
│   └── SplashScreen
├── AuthStack
│   ├── LoginScreen
│   └── RegisterScreen
└── AppStack
    ├── DashboardScreen
    ├── MeetingsScreen
    ├── SurveysScreen
    └── SettingsScreen
```

The navigation automatically switches between stacks based on authentication state.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Splash screen animation completes
*For any* app launch, the splash screen animation should complete within 3 seconds and transition to the login screen
**Validates: Requirements 1.1, 1.2, 1.3, 1.5**

### Property 2: Logo zoom animation is smooth
*For any* splash screen display, the logo should animate from 0.5x scale to 1x scale smoothly over 1 second
**Validates: Requirements 1.2**

### Property 3: Login with valid credentials succeeds
*For any* valid email and password combination, the login request should succeed and return a valid authentication token
**Validates: Requirements 2.2, 2.3**

### Property 4: Login with invalid credentials fails
*For any* invalid email or password combination, the login request should fail and display an error message
**Validates: Requirements 2.4**

### Property 5: Authentication token is securely stored
*For any* successful login, the authentication token should be stored securely in device storage and retrievable on subsequent app launches
**Validates: Requirements 3.3, 3.4**

### Property 6: API requests include authentication token
*For any* authenticated API request, the request should include the authentication token in the Authorization header
**Validates: Requirements 3.4**

### Property 7: Navigation prevents unauthorized access
*For any* unauthenticated user, navigation to protected screens should be prevented and the user should be redirected to the login screen
**Validates: Requirements 5.2**

### Property 8: Logout clears authentication state
*For any* logout action, the authentication token should be removed from storage and the user should be navigated to the login screen
**Validates: Requirements 5.3**

## Error Handling

### Network Errors
- Display "Unable to connect to server" message
- Provide retry button
- Log error for debugging

### Authentication Errors
- Display specific error messages (invalid credentials, account locked, etc.)
- Clear sensitive data from form
- Provide password reset link

### Storage Errors
- Gracefully handle secure storage failures
- Fall back to in-memory storage if needed
- Log errors for debugging

## Testing Strategy

### Unit Testing
- Test AuthService login/logout logic
- Test APIClient request formatting
- Test token storage and retrieval
- Test navigation state management

### Integration Testing
- Test complete login flow from splash screen to dashboard
- Test registration flow
- Test logout and session clearing
- Test API communication with backend

### Property-Based Testing
Property-based tests will verify that the app behaves correctly across various scenarios:
- Different network conditions
- Various authentication states
- Multiple screen transitions
- Token expiration and refresh

Each property-based test will run a minimum of 100 iterations to ensure comprehensive coverage.

Property-based tests will be tagged with comments referencing the specific correctness properties from this design document using the format: '**Feature: mobile-app-expo, Property {number}: {property_text}**'

### Manual Testing
- Test on physical Android devices
- Test on iOS devices (if building for iOS)
- Test with slow network conditions
- Test with expired tokens
- Test app backgrounding and resuming
