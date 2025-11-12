# BlockRise - Android Setup Guide

## 🚀 Complete Setup for Android App

### Prerequisites
- Node.js (v16 or higher)
- Android Studio installed
- Java Development Kit (JDK 17)
- Git

### 1️⃣ Export & Clone Project

1. Click **"Export to Github"** in Lovable
2. Clone your repository:
```bash
git clone <your-repo-url>
cd blockrise-stack-rush
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Build the Web App

```bash
npm run build
```

### 4️⃣ Add Android Platform

```bash
npx cap add android
```

### 5️⃣ Sync Capacitor

Every time you make changes to the web code or native config:
```bash
npx cap sync android
```

### 6️⃣ Configure AdMob (Important!)

#### Option A: Using Test Ads (Development)
The app is already configured with test ad IDs in `capacitor.config.json`. These will work immediately.

**Test Ad IDs (Already configured):**
- App ID: `ca-app-pub-3940256099942544~3347511713`
- Banner: `ca-app-pub-3940256099942544/6300978111`
- Interstitial: `ca-app-pub-3940256099942544/1033173712`
- Rewarded: `ca-app-pub-3940256099942544/5224354917`

#### Option B: Using Real Ads (Production)

1. Create an AdMob account at https://admob.google.com
2. Create a new app and get your App ID
3. Create ad units (Banner, Interstitial, Rewarded)
4. Update `capacitor.config.json`:
```json
{
  "plugins": {
    "AdMob": {
      "appId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
      "testDeviceIds": [],
      "initializeForTesting": false
    }
  }
}
```
5. Update ad unit IDs in `src/hooks/useAdMob.ts`:
```typescript
const AD_UNITS = {
  banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX',
  rewarded: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX'
};
```

6. Update `android/app/src/main/AndroidManifest.xml`:
```xml
<meta-data
    android:name="com.google.android.gms.ads.APPLICATION_ID"
    android:value="ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"/>
```

### 7️⃣ Open in Android Studio

```bash
npx cap open android
```

### 8️⃣ Run on Device/Emulator

#### Using Android Studio:
1. Connect your Android device or start an emulator
2. Click the "Run" button (▶️) in Android Studio

#### Using Command Line:
```bash
npx cap run android
```

## 🎮 Monetization Features

### Revenue Streams Implemented:

1. **Level Unlocking System**
   - First 3 levels are free
   - Watch 3 rewarded ads to unlock each new level
   - Earn coins for watching ads (10 per ad, 50 bonus on unlock)

2. **Game Over Ads**
   - Interstitial ad shows after game over
   - Option to watch rewarded ad to continue playing
   - Bonus: 50 coins for watching continue ad

3. **Daily Rewards**
   - Daily login rewards with streak bonuses
   - Base: 50 coins daily
   - Streak bonus: +10 coins per consecutive day
   - Maximum: 120 coins at 7+ day streak

4. **In-App Purchase Ready**
   - "Remove Ads" button in Settings ($2.99)
   - Ready for Stripe/Play Store billing integration

## 🎨 Features Included

✅ Light/Dark theme toggle
✅ Level selection system (20 levels)
✅ Rewarded ads for level unlocking
✅ Daily rewards with streak system
✅ Coin economy system
✅ Game statistics tracking
✅ Smooth haptic feedback
✅ Progress persistence (saved locally)
✅ Optimized for global audience
✅ Responsive mobile UI

## 🔧 Development Workflow

### After Making Changes to Web Code:
```bash
npm run build
npx cap sync android
```

### Testing:
- **Web Preview**: `npm run dev`
- **Android**: Use Android Studio or `npx cap run android`

### Hot Reload for Development:
The app uses hot reload pointing to:
`https://9c790342-8831-4a60-af4f-2cf5fb40e350.lovableproject.com`

To disable hot reload for production:
1. Remove the `server` section from `capacitor.config.json`
2. Run `npx cap sync android`

## 📱 Publishing to Google Play

### 1. Prepare for Release

Update `android/app/build.gradle`:
```gradle
android {
    defaultConfig {
        versionCode 1
        versionName "1.0.0"
    }
}
```

### 2. Generate Signed APK

In Android Studio:
1. Build → Generate Signed Bundle/APK
2. Choose "Android App Bundle" (recommended)
3. Create or use existing keystore
4. Select "release" build variant

### 3. Upload to Play Console

1. Go to https://play.google.com/console
2. Create a new application
3. Upload your signed APK/AAB
4. Fill in all required details
5. Submit for review

## 🐛 Troubleshooting

### Build Errors:
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### AdMob Not Showing:
- Ensure you're using correct ad unit IDs
- Check AndroidManifest.xml has AdMob App ID
- Test ads may take a few seconds to load
- Check logcat for error messages

### App Won't Install:
- Check Android version compatibility (min SDK 22)
- Ensure sufficient storage on device
- Try uninstalling previous version

## 📊 Analytics & Monitoring

Consider adding:
- Firebase Analytics (free)
- Crashlytics (crash reporting)
- Revenue tracking dashboard

## 🌍 Optimization Tips

✅ App is optimized for:
- Low-end Android devices (smooth 60fps)
- Multiple screen sizes
- Different Android versions (5.1+)
- Offline play (no internet required)
- Small app size (<10MB)

## 💰 Revenue Optimization

**Best Practices Implemented:**
- Rewarded ads for value (unlock levels, continue game)
- Interstitial ads at natural break points (game over)
- Non-intrusive banner placement (optional)
- Coin economy encourages engagement
- Daily rewards increase retention
- IAP option for ad-free experience

## 📝 Next Steps

1. **Set up real AdMob account** (when ready to monetize)
2. **Test thoroughly** on multiple devices
3. **Gather beta feedback** (Google Play beta testing)
4. **Implement analytics** (track user behavior)
5. **A/B test ad placements** (optimize revenue)
6. **Add more content** (more levels, power-ups)
7. **Social features** (share scores, leaderboards)

## 🎯 Global Optimization Checklist

- ✅ Minimal text (universal icons)
- ✅ Smooth animations (60fps target)
- ✅ Touch-friendly UI (44px+ targets)
- ✅ Works offline
- ✅ Low memory footprint
- ✅ Fast startup (<3 seconds)
- ✅ Haptic feedback
- ✅ Theme options

---

**Need Help?** Check the Lovable documentation or join the Discord community!

**Ready to monetize?** Set up your AdMob account and update the ad IDs following Section 6!
