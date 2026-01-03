# APK Build Checklist

## Pre-Build Verification

### Prerequisites
- [ ] Expo account created (https://expo.dev)
- [ ] EAS CLI installed (`npm install -g eas-cli`)
- [ ] Node.js 16+ installed (`node --version`)
- [ ] Git installed (`git --version`)
- [ ] Internet connection available

### Project Setup
- [ ] `mobile/` directory exists
- [ ] `package.json` has all dependencies
- [ ] `app.json` is properly configured
- [ ] `eas.json` is created
- [ ] `tsconfig.json` is configured
- [ ] `.env.local` has API URL set

### Assets
- [ ] `mobile/assets/icon.png` exists (192x192)
- [ ] `mobile/assets/splash.png` exists (1080x1920)
- [ ] `mobile/assets/adaptive-icon.png` exists
- [ ] `mobile/assets/favicon.png` exists
- [ ] `mobile/assets/logo.png` exists

### Code Quality
- [ ] No TypeScript errors (`npm run type-check` if available)
- [ ] No console errors in dev server
- [ ] All screens render correctly
- [ ] Navigation works properly
- [ ] Authentication flow works
- [ ] No missing imports or dependencies

### Configuration
- [ ] App name: "Ecclesia"
- [ ] Package name: "com.ecclesia.app"
- [ ] Version: 1.0.0
- [ ] Version code: 1
- [ ] Permissions configured
- [ ] Adaptive icon configured
- [ ] Splash screen configured

---

## Build Process

### Step 1: Install EAS CLI
```bash
npm install -g eas-cli
```
- [ ] Command executed successfully
- [ ] Version displayed: `eas --version`

### Step 2: Login to Expo
```bash
eas login
```
- [ ] Browser opened for authentication
- [ ] Successfully logged in
- [ ] Credentials saved locally

### Step 3: Navigate to Mobile Directory
```bash
cd mobile
```
- [ ] Current directory is `mobile/`
- [ ] Can see `app.json` and `eas.json`

### Step 4: Build APK
```bash
eas build --platform android --profile preview
```
- [ ] Build started successfully
- [ ] Build ID displayed
- [ ] Build progress visible in terminal

### Step 5: Monitor Build
- [ ] Build status shows "Building"
- [ ] No errors in build logs
- [ ] Build completes successfully
- [ ] Build status shows "Finished"

### Step 6: Download APK
- [ ] Build marked as "Finished"
- [ ] Download link provided
- [ ] APK file downloaded successfully
- [ ] File size is reasonable (50-80 MB)

---

## Post-Build Testing

### Installation
- [ ] Android device connected via USB
- [ ] USB debugging enabled on device
- [ ] ADB recognizes device (`adb devices`)
- [ ] APK installed successfully (`adb install`)

### App Launch
- [ ] App icon appears on home screen
- [ ] App launches without crashing
- [ ] Splash screen displays
- [ ] Splash animation plays (3 seconds)
- [ ] Transitions to login screen

### Login Screen
- [ ] Screen displays correctly
- [ ] Email input field works
- [ ] Password input field works
- [ ] Login button is clickable
- [ ] Registration link works

### Registration Screen
- [ ] Screen displays correctly
- [ ] Church name input works
- [ ] Email input works
- [ ] Password input works
- [ ] Plan selection works (Basic/Pro)
- [ ] Register button works
- [ ] Back to login link works

### Authentication
- [ ] Can enter valid credentials
- [ ] Loading state displays during login
- [ ] Error message displays for invalid credentials
- [ ] Successful login navigates to dashboard
- [ ] Token is stored securely

### Dashboard
- [ ] Dashboard displays user information
- [ ] User name shows correctly
- [ ] User email shows correctly
- [ ] User role displays
- [ ] Church ID displays
- [ ] Logout button is visible

### Logout
- [ ] Logout button is clickable
- [ ] Logout clears session
- [ ] Returns to login screen
- [ ] Can login again after logout

### Session Persistence
- [ ] Close app completely
- [ ] Reopen app
- [ ] Should go directly to dashboard (if logged in)
- [ ] User information persists
- [ ] Token is still valid

### Error Handling
- [ ] Invalid credentials show error
- [ ] Network errors handled gracefully
- [ ] Loading states display correctly
- [ ] Error messages are clear

### Performance
- [ ] App launches quickly (< 3 seconds)
- [ ] Animations are smooth
- [ ] No lag during navigation
- [ ] No memory leaks
- [ ] Battery usage is reasonable

---

## Troubleshooting Checklist

### Build Fails
- [ ] Check internet connection
- [ ] Verify Expo login: `eas whoami`
- [ ] Check app.json syntax (valid JSON)
- [ ] Review build logs for errors
- [ ] Try clearing cache: `eas build --platform android --profile preview --clear-cache`

### Installation Fails
- [ ] Check Android version (5.0+)
- [ ] Check device storage space
- [ ] Uninstall previous version first
- [ ] Try different USB cable
- [ ] Enable USB debugging on device

### App Crashes
- [ ] Check backend API is running
- [ ] Verify API URL in `.env.local`
- [ ] Check device logs: `adb logcat`
- [ ] Review app console for errors
- [ ] Check network connectivity

### Login Fails
- [ ] Verify backend endpoints exist
- [ ] Check API response format
- [ ] Verify credentials are correct
- [ ] Check network connectivity
- [ ] Review API logs for errors

### Session Not Persisting
- [ ] Check SecureStore is working
- [ ] Verify token is being stored
- [ ] Check token validation endpoint
- [ ] Review auth store logic
- [ ] Check device storage permissions

---

## Documentation Checklist

- [ ] Read `APK_BUILD_GUIDE.md`
- [ ] Read `MOBILE_APP_APK_READY.md`
- [ ] Read `MOBILE_APP_IMPLEMENTATION_REFERENCE.md`
- [ ] Understand build process
- [ ] Know troubleshooting steps
- [ ] Have support resources bookmarked

---

## Final Verification

### Before Submitting to Play Store
- [ ] All features tested and working
- [ ] No crashes or errors
- [ ] Performance is acceptable
- [ ] UI is responsive
- [ ] All screens display correctly
- [ ] Navigation works smoothly
- [ ] Error handling works
- [ ] Loading states display
- [ ] Session persistence works
- [ ] Logout works correctly

### App Store Requirements
- [ ] App icon provided (192x192)
- [ ] Splash screen provided (1080x1920)
- [ ] App description written
- [ ] Privacy policy created
- [ ] Terms of service created
- [ ] Screenshots prepared
- [ ] Version number set
- [ ] Build number incremented

---

## Sign-Off

- [ ] All checks completed
- [ ] No issues found
- [ ] Ready for production
- [ ] Ready for Play Store submission

**Date**: _______________
**Tester**: _______________
**Status**: ✅ APPROVED FOR RELEASE

---

## Notes

```
_________________________________________________________________

_________________________________________________________________

_________________________________________________________________

_________________________________________________________________
```

---

## Quick Reference

### Essential Commands
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK
cd mobile
eas build --platform android --profile preview

# Install APK
adb install path/to/app.apk

# View logs
adb logcat

# List connected devices
adb devices
```

### Important Files
- `mobile/app.json` - App configuration
- `mobile/eas.json` - Build configuration
- `mobile/.env.local` - Environment variables
- `mobile/package.json` - Dependencies

### Useful Links
- Expo: https://expo.dev
- EAS Build: https://docs.expo.dev/build/
- Android Dev: https://developer.android.com
- React Native: https://reactnative.dev

---

**Status**: Ready for APK Building
**Next Step**: Run `eas build --platform android --profile preview`

