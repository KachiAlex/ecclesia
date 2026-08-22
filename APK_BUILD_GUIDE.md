# Ecclesia Mobile App - APK Build Guide

## Prerequisites

Before building the APK, ensure you have:

1. **Expo Account** - Create at https://expo.dev
2. **EAS CLI** - Install with `npm install -g eas-cli`
3. **Node.js** - Version 16 or higher
4. **Git** - For version control

## Step 1: Install EAS CLI

```bash
npm install -g eas-cli
```

Verify installation:
```bash
eas --version
```

## Step 2: Login to Expo

```bash
eas login
```

This will open a browser to authenticate with your Expo account.

## Step 3: Initialize EAS Project

Navigate to the mobile directory:
```bash
cd mobile
```

Initialize EAS:
```bash
eas build:configure
```

This will:
- Create `eas.json` configuration file
- Set up your project for building
- Configure Android build settings

## Step 4: Configure eas.json

The `eas.json` file should look like this:

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk"
      }
    },
    "preview2": {
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "aab"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

## Step 5: Build APK

### Option A: Build Preview APK (Recommended for Testing)

```bash
eas build --platform android --profile preview
```

This creates an APK file that can be installed directly on Android devices.

### Option B: Build Production APK

```bash
eas build --platform android --profile production
```

This creates an AAB (Android App Bundle) for Google Play Store.

## Step 6: Monitor Build Progress

The build process will:
1. Upload your code to EAS servers
2. Compile the React Native code
3. Generate the APK file
4. Upload to your Expo account

You can monitor progress in the terminal or at https://expo.dev/builds

## Step 7: Download APK

Once the build completes:

1. Go to https://expo.dev/builds
2. Find your build in the list
3. Click "Download" to get the APK file
4. Or use the link provided in the terminal

## Step 8: Install on Android Device

### Option A: Using ADB (Android Debug Bridge)

```bash
adb install path/to/ecclesia-app.apk
```

### Option B: Manual Installation

1. Transfer APK to your Android device
2. Open file manager
3. Tap the APK file
4. Follow installation prompts

### Option C: Using Expo Go

1. Scan the QR code from the build output
2. Open in Expo Go app
3. Test the app

## Step 9: Test the APK

After installation:

1. Open the Ecclesia app
2. Test splash screen animation
3. Test login screen
4. Test registration
5. Test logout
6. Verify all features work

## Troubleshooting

### Build Fails with "Project not initialized"

```bash
eas build:configure
```

### Build Fails with "Invalid credentials"

```bash
eas logout
eas login
```

### Build Fails with "Android SDK not found"

This is handled by EAS servers, but ensure your `app.json` is properly configured.

### APK Installation Fails

- Ensure Android version is 5.0 or higher
- Check device storage space
- Try uninstalling previous version first

### App Crashes on Launch

- Check that backend API is running
- Verify `EXPO_PUBLIC_API_URL` is correct
- Check device logs: `adb logcat`

## Build Configuration Details

### app.json Settings

```json
{
  "android": {
    "package": "com.ecclesia.app",
    "versionCode": 1,
    "permissions": [
      "INTERNET",
      "CAMERA",
      "RECORD_AUDIO",
      "ACCESS_NETWORK_STATE"
    ]
  }
}
```

### eas.json Settings

```json
{
  "build": {
    "preview": {
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      }
    }
  }
}
```

## Build Profiles

### Preview Profile
- Builds APK for testing
- Faster build time
- Can be installed directly on devices
- Good for development and testing

### Production Profile
- Builds AAB for Google Play Store
- Optimized for distribution
- Requires signing with production key
- Required for app store submission

## Signing Configuration

For production builds, you'll need:

1. **Keystore file** - Contains signing keys
2. **Keystore password** - Protects the keystore
3. **Key alias** - Name of the signing key
4. **Key password** - Protects the key

EAS can manage this for you or you can provide your own.

## Continuous Builds

To automate builds on every push:

1. Connect your GitHub repository to EAS
2. Configure build triggers in `eas.json`
3. Builds will run automatically on push

## Build Limits

**Free Tier**:
- 30 builds per month
- 1 concurrent build

**Paid Plans**:
- Unlimited builds
- Multiple concurrent builds
- Priority support

## Next Steps

1. **Test APK** - Install and test on Android device
2. **Gather Feedback** - Get user feedback on functionality
3. **Iterate** - Make improvements based on feedback
4. **Submit to Play Store** - When ready for production

## Resources

- [Expo Documentation](https://docs.expo.dev)
- [EAS Build Documentation](https://docs.expo.dev/build/introduction/)
- [Android Development](https://developer.android.com)
- [React Native Documentation](https://reactnative.dev)

## Support

For issues:
1. Check Expo documentation
2. Review build logs in Expo dashboard
3. Check Android device logs with `adb logcat`
4. Visit Expo forums or GitHub issues

---

**Status**: Ready to build APK
**Next**: Run `eas build --platform android --profile preview`

