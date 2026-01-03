# Implementation Plan: Ecclesia Mobile App (Expo)

## Overview

This implementation plan breaks down the mobile app development into discrete, manageable tasks. Each task builds on previous ones, starting with project setup, then core services, screens, and finally APK building. The plan follows a mobile-first approach with proper testing at each stage.

## Tasks

- [x] 1. Set up Expo project and dependencies
  - Initialize new Expo project with TypeScript
  - Install required dependencies (React Navigation, Axios, Secure Store, etc.)
  - Configure project structure and environment variables
  - Set up Firebase configuration for mobile
  - _Requirements: 3.1, 4.1_

- [x] 2. Create API client and authentication service
  - [x] 2.1 Implement APIClient with Axios
    - Create HTTP client with interceptors for auth tokens
    - Handle request/response formatting
    - Implement error handling
    - _Requirements: 3.1, 3.2_

  - [ ]* 2.2 Write property test for API client
    - **Property 6: API requests include authentication token**
    - **Validates: Requirements 3.4**

  - [x] 2.3 Implement AuthService
    - Create login/register methods
    - Implement token storage using Expo SecureStore
    - Add session management
    - _Requirements: 3.2, 3.3_

  - [ ]* 2.4 Write property test for authentication
    - **Property 3: Login with valid credentials succeeds**
    - **Property 4: Login with invalid credentials fails**
    - **Validates: Requirements 2.2, 2.3, 2.4**

- [x] 3. Implement navigation structure
  - [x] 3.1 Set up React Navigation
    - Configure navigation containers
    - Create navigation stacks (Auth, App, Splash)
    - Implement authentication state management
    - _Requirements: 5.1, 5.2, 5.3_

  - [ ]* 3.2 Write property test for navigation
    - **Property 7: Navigation prevents unauthorized access**
    - **Validates: Requirements 5.2**

- [x] 4. Build splash screen with animation
  - [x] 4.1 Create SplashScreen component
    - Display Ecclesia logo
    - Implement zoom animation (0.5x to 1x scale over 1 second)
    - Add loading indicator
    - Auto-transition after 3 seconds
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 4.2 Write property test for splash screen
    - **Property 1: Splash screen animation completes**
    - **Property 2: Logo zoom animation is smooth**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.5**

- [x] 5. Build login screen
  - [x] 5.1 Create LoginScreen component
    - Email and password input fields
    - Login button with loading state
    - Error message display
    - Registration link
    - Connect to AuthService
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

  - [ ]* 5.2 Write unit tests for login screen
    - Test form validation
    - Test error handling
    - Test navigation on success
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 6. Build registration screen
  - [x] 6.1 Create RegisterScreen component
    - Church name, email, password fields
    - Register button with loading state
    - Error message display
    - Login link
    - Connect to AuthService
    - _Requirements: 2.6_

  - [ ]* 6.2 Write unit tests for registration screen
    - Test form validation
    - Test error handling
    - Test navigation on success
    - _Requirements: 2.6_

- [x] 7. Checkpoint - Ensure all screens render correctly
  - Verify splash screen displays and animates
  - Verify login screen displays correctly
  - Verify registration screen displays correctly
  - Test navigation between screens

- [x] 8. Implement secure token storage
  - [x] 8.1 Set up Expo SecureStore
    - Configure secure storage for tokens
    - Implement token retrieval on app launch
    - Handle storage errors gracefully
    - _Requirements: 3.3_

  - [ ]* 8.2 Write property test for token storage
    - **Property 5: Authentication token is securely stored**
    - **Validates: Requirements 3.3, 3.4**

- [x] 9. Implement session persistence
  - [x] 9.1 Add session recovery logic
    - Check for stored token on app launch
    - Validate token with backend
    - Auto-login if token is valid
    - Navigate to dashboard if authenticated
    - _Requirements: 3.3, 3.4_

  - [ ]* 9.2 Write integration test for session persistence
    - Test token retrieval and validation
    - Test auto-login flow
    - _Requirements: 3.3, 3.4_

- [x] 10. Implement logout functionality
  - [x] 10.1 Add logout logic
    - Clear stored token
    - Clear session data
    - Navigate to login screen
    - _Requirements: 5.3_

  - [ ]* 10.2 Write property test for logout
    - **Property 8: Logout clears authentication state**
    - **Validates: Requirements 5.3**

- [x] 11. Checkpoint - Ensure authentication flow works end-to-end
  - Test complete login flow
  - Test session persistence
  - Test logout flow
  - Test error handling

- [x] 12. Adapt dashboard for mobile
  - [x] 12.1 Create mobile-optimized dashboard
    - Adapt existing dashboard components for mobile
    - Implement bottom tab navigation
    - Optimize layout for small screens
    - _Requirements: 5.1_

  - [ ]* 12.2 Write integration tests for dashboard
    - Test navigation between tabs
    - Test data loading
    - _Requirements: 5.1_

- [x] 13. Configure Expo for APK building
  - [x] 13.1 Set up app.json configuration
    - Configure app name, icon, splash screen
    - Set up Android-specific settings
    - Configure permissions
    - _Requirements: 4.1, 4.2_

  - [x] 13.2 Generate app icon and splash image
    - Create icon (192x192 PNG)
    - Create splash image (1080x1920 PNG)
    - Add to project assets
    - _Requirements: 4.1_

- [x] 14. Build APK for Android
  - [x] 14.1 Build APK using Expo
    - Run `eas build --platform android`
    - Configure build settings
    - Generate signed APK
    - _Requirements: 4.1, 4.2, 4.3_

  - [x] 14.2 Test APK on Android device
    - Install APK on test device
    - Test splash screen animation
    - Test login flow
    - Test dashboard navigation
    - _Requirements: 4.4_

- [x] 15. Final checkpoint - Ensure APK is production-ready
  - Verify all screens work correctly
  - Verify animations are smooth
  - Verify API communication works
  - Verify error handling works
  - Test on multiple Android devices

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- APK building requires Expo account and EAS CLI setup
