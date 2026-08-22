# APK Build - Alternative Methods

The Gradle build is taking too long due to dependency resolution and compilation. Here are alternative methods to build the APK:

## Method 1: Use Expo Development Build (Recommended - Fastest)

This creates a development APK that's easier to build:

```bash
cd mobile

# Install expo-dev-client
npm install expo-dev-client

# Update app.json to include dev-client plugin
# Add this to app.json plugins array:
# ["expo-dev-client"]

# Build with EAS
eas build --platform android --profile preview
```

**Pros:**
- Faster build process
- Easier debugging
- Hot reload support

**Cons:**
- Larger APK size
- For development only

---

## Method 2: Use Expo's Cloud Build (Current Approach)

The build is running but taking time. To monitor:

1. Visit: https://expo.dev/accounts/kachianietie/projects/ecclesia-church-app/builds
2. Check the build status
3. Once complete, download the APK

**Estimated time:** 15-30 minutes depending on server load

---

## Method 3: Local Build with Android Studio

If you have Android Studio installed:

```bash
cd mobile

# Generate native code
npx expo prebuild --platform android --clean

# Open in Android Studio
# File > Open > mobile/android

# Build from Android Studio:
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

**Requirements:**
- Android Studio installed
- Android SDK configured
- Java Development Kit (JDK) installed

---

## Method 4: Use React Native CLI

Alternative to Expo:

```bash
# Create new React Native project
npx react-native init EcclesiaApp

# Copy src files from mobile/src to new project
# Configure manually

# Build APK
cd android
./gradlew assembleRelease
```

---

## Method 5: Use Gradle Directly (Fastest if SDK is set up)

```bash
cd mobile/android

# Build debug APK (faster)
./gradlew.bat assembleDebug

# Build release APK (slower, optimized)
./gradlew.bat assembleRelease
```

**Output location:**
- Debug: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## Method 6: Use Gradle Daemon (Faster Subsequent Builds)

```bash
cd mobile/android

# Start Gradle daemon
./gradlew.bat --daemon assembleDebug

# Subsequent builds will be faster
./gradlew.bat assembleDebug
```

---

## Recommended Path Forward

### For Quick Testing (5-10 minutes)
Use **Method 1** (Expo Development Build) - fastest option

### For Production APK (15-30 minutes)
Use **Method 2** (EAS Cloud Build) - currently running, just wait

### For Local Development (30-60 minutes first time)
Use **Method 3** (Android Studio) - best for debugging

### For Fastest Builds (if SDK installed)
Use **Method 5** (Gradle Direct) - fastest once set up

---

## Current Status

The EAS build is currently running. You can:

1. **Wait for it to complete** (check status at https://expo.dev/accounts/kachianietie/projects/ecclesia-church-app/builds)
2. **Try Method 1** (Expo Dev Build) for faster alternative
3. **Try Method 5** (Gradle Direct) if you have Android SDK installed

---

## Troubleshooting

### Build takes too long
- Gradle daemon helps with subsequent builds
- First build always takes longer (downloading dependencies)
- Use `--daemon` flag to speed up

### Out of memory errors
- Increase Gradle heap: `export GRADLE_OPTS="-Xmx2048m"`
- Or edit `gradle.properties`: `org.gradle.jvmargs=-Xmx2048m`

### Build fails with dependency errors
- Clear Gradle cache: `./gradlew.bat clean`
- Update dependencies: `npm install`
- Try again

### APK won't install
- Ensure Android version compatibility (min SDK 23)
- Check device storage space
- Try uninstalling previous version first

---

## Next Steps

1. **Check EAS build status** (if still running)
2. **Or try Method 1** (Expo Dev Build) for faster alternative
3. **Or try Method 5** (Gradle Direct) if you have Android SDK

Once APK is built:
- Transfer to Android device
- Install: `adb install app-debug.apk`
- Or manually install via file manager
- Launch and test all features

---

## Questions?

- **EAS Build stuck?** Check logs at https://expo.dev/accounts/kachianietie/projects/ecclesia-church-app/builds
- **Gradle issues?** Try `./gradlew.bat clean` then rebuild
- **Dependencies?** Run `npm install` to ensure all packages are installed
