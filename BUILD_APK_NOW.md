# Build APK Now - Quick Start

## 🚀 Choose Your Build Method

### ⭐ RECOMMENDED: EAS Cloud Build

**Fastest and most reliable. Builds on Expo's servers.**

```bash
cd mobile
eas build --platform android --profile preview
```

**What happens:**
1. Uploads project to Expo servers
2. Builds APK in the cloud
3. Returns download link when complete
4. Monitor progress: https://expo.dev/accounts/kachianietie/projects/ecclesia-church-app/builds

**Time:** 15-30 minutes  
**Advantage:** No local resource usage, automatic signing

---

### Alternative: Local Gradle Build

**Builds on your machine. Takes longer but works offline.**

```bash
cd mobile/android
./gradlew.bat assembleDebug
```

**What happens:**
1. Downloads dependencies (first time only)
2. Compiles React Native code
3. Builds APK locally
4. Saves to: `mobile/android/app/build/outputs/apk/debug/app-debug.apk`

**Time:** 30-60+ minutes (first build)  
**Advantage:** Full control, works offline after first build

---

### Alternative: Android Studio

**Use the IDE for building.**

1. Open `mobile/android` in Android Studio
2. Click: Build > Build Bundle(s) / APK(s) > Build APK(s)
3. Wait for build to complete
4. APK saved to: `mobile/android/app/build/outputs/apk/`

**Time:** 30-60 minutes

---

## 📱 Install APK

### After Build Completes

**Option 1: Via ADB (if Android SDK installed)**
```bash
adb install app-debug.apk
```

**Option 2: Via File Manager**
1. Transfer APK to Android device
2. Open file manager
3. Tap APK file
4. Follow installation prompts

**Option 3: Via Email**
1. Email APK to yourself
2. Download on Android device
3. Open and install

---

## ✅ Test App

After installation, verify these work:

1. ✅ App launches
2. ✅ Splash screen shows with animation
3. ✅ Login screen appears
4. ✅ Can enter email/password
5. ✅ Can navigate to registration
6. ✅ Can select church and plan
7. ✅ Can submit registration
8. ✅ Dashboard displays
9. ✅ Can logout
10. ✅ Returns to login

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Build hangs | Use EAS Cloud Build instead |
| Out of memory | `export GRADLE_OPTS="-Xmx2048m"` |
| Build fails | `./gradlew.bat clean` then retry |
| APK won't install | Ensure Android 6.0+, check storage |

---

## 📊 Build Time Comparison

| Method | Time | Difficulty |
|--------|------|-----------|
| EAS Cloud | 15-30 min | Easy ⭐ |
| Gradle Local | 30-60 min | Medium |
| Android Studio | 30-60 min | Medium |

---

## 🎯 Recommended Path

1. **Run EAS build:**
   ```bash
   cd mobile
   eas build --platform android --profile preview
   ```

2. **Monitor progress:**
   - Visit: https://expo.dev/accounts/kachianietie/projects/ecclesia-church-app/builds
   - Wait for build to complete (15-30 minutes)

3. **Download APK:**
   - Click download link from EAS dashboard
   - Or use `eas build --platform android --profile preview` to get download link

4. **Install on device:**
   - Transfer APK to Android device
   - Open file manager and tap APK
   - Follow installation prompts

5. **Test app:**
   - Launch app
   - Go through testing checklist
   - Report any issues

---

## 📞 Need Help?

- **EAS Build Issues:** Check https://expo.dev/accounts/kachianietie/projects/ecclesia-church-app/builds
- **Local Build Issues:** Run `./gradlew.bat clean` and retry
- **App Issues:** Check backend API is running and API URL is correct

---

## ✨ Status

✅ App fully implemented  
✅ Ready to build  
✅ All features working  

**Start building now!** 🚀

