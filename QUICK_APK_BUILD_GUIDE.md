# Quick APK Build Guide

## Choose Your Method

### 🚀 Option 1: EAS Cloud Build (Fastest - Recommended)

```bash
cd mobile
eas build --platform android --profile preview
```

**Time:** 15-30 minutes  
**Monitor:** https://expo.dev/accounts/kachianietie/projects/ecclesia-church-app/builds

---

### 🔨 Option 2: Local Gradle Build

```bash
cd mobile/android
./gradlew.bat assembleDebug
```

**Time:** 30-60+ minutes (first build)  
**Output:** `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

---

### 📱 Option 3: Android Studio

1. Open `mobile/android` in Android Studio
2. Build > Build Bundle(s) / APK(s) > Build APK(s)
3. Wait for completion

**Time:** 30-60 minutes  
**Output:** `mobile/android/app/build/outputs/apk/`

---

## Install APK

### Via ADB
```bash
adb install app-debug.apk
```

### Via File Manager
1. Transfer APK to device
2. Open file manager
3. Tap APK
4. Install

---

## Test App

- [ ] App launches
- [ ] Splash screen shows
- [ ] Login screen appears
- [ ] Can enter credentials
- [ ] Can register
- [ ] Dashboard displays
- [ ] Can logout

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Build too slow | Use EAS Cloud Build instead |
| Out of memory | Increase Gradle heap: `export GRADLE_OPTS="-Xmx2048m"` |
| Build fails | Run `./gradlew.bat clean` then retry |
| APK won't install | Ensure Android 6.0+, check storage space |

---

## Status

✅ App fully implemented  
✅ Native code generated  
✅ Ready to build  

**Choose a method above and start building!**

