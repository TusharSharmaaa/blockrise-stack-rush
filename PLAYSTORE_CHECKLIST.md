# Android Play Store Launch Checklist

## ✅ Phase 1 - Completed
- [x] Sound system integrated
- [x] Power-ups functional in gameplay
- [x] Achievement tracking connected
- [x] Error boundaries added
- [x] Haptic feedback working

## 🎵 Sound Files Needed
You need to add these audio files to `public/sounds/`:
1. **move.mp3** - Block movement sound
2. **rotate.mp3** - Block rotation sound
3. **drop.mp3** - Block drop sound
4. **line-clear.mp3** - Line clear effect
5. **level-up.mp3** - Level progression
6. **game-over.mp3** - Game over sound
7. **achievement.mp3** - Achievement unlock
8. **coin.mp3** - Coin collection
9. **powerup.mp3** - Power-up activation
10. **bg-music.mp3** - Background music loop

**Free Sound Resources:**
- https://freesound.org/
- https://opengameart.org/
- https://mixkit.co/free-sound-effects/game/

## 📱 App Store Assets Needed

### Icons (Android)
- **512x512** - Hi-res icon for Play Store
- **192x192** - App launcher icon
- **96x96** - Smaller launcher icon
- **48x48** - Notification icon

### Screenshots (Prepare 2-8 screenshots)
- **Phone**: 1080x1920 or 1080x2340
- **Tablet**: 1200x1920 or 2048x2732
- Show: Gameplay, Level Select, Shop, Achievements

### Feature Graphic
- **1024x500** - Hero banner for Play Store

### Promo Video (Optional)
- 30 seconds max
- Show gameplay highlights

## 🔧 Technical Setup

### 1. AdMob Setup
```bash
# Replace test IDs in src/hooks/useAdMob.ts with real IDs
banner: 'ca-app-pub-XXXXX/XXXXX',
interstitial: 'ca-app-pub-XXXXX/XXXXX',
rewarded: 'ca-app-pub-XXXXX/XXXXX'
```

### 2. Build App
```bash
# Export to GitHub (use Export button in Lovable)
# Clone your repo locally
git clone YOUR_REPO_URL
cd YOUR_PROJECT

# Install dependencies
npm install

# Add Android platform
npx cap add android

# Update dependencies
npx cap update android

# Build the web assets
npm run build

# Sync with Android
npx cap sync android

# Open in Android Studio
npx cap open android
```

### 3. Android Studio Configuration
1. **Update package name** in `android/app/build.gradle`:
   ```gradle
   applicationId "com.yourcompany.blockrise"
   ```

2. **Update version** in `android/app/build.gradle`:
   ```gradle
   versionCode 1
   versionName "1.0.0"
   ```

3. **Add app icon**: Place icons in `android/app/src/main/res/mipmap-*`

4. **Generate signed APK/AAB**:
   - Build → Generate Signed Bundle/APK
   - Create keystore (SAVE IT SECURELY!)
   - Build release AAB

## 📝 Play Store Listing

### App Details
- **Title**: BlockRise: Stack Rush (max 50 chars)
- **Short Description**: Stack, clear, and rise to the top! (max 80 chars)
- **Full Description**: Write 2-3 paragraphs highlighting:
  - 50 challenging levels
  - Addictive puzzle gameplay
  - Power-ups and achievements
  - Daily rewards
  - Compete on leaderboards

### Categories
- **Primary**: Puzzle
- **Secondary**: Casual

### Content Rating
- Fill out questionnaire (likely: Everyone or Everyone 10+)

### Pricing
- **Free** with ads and IAP

## 🔐 Required Policies

### Privacy Policy
You MUST host a privacy policy. Include:
- Data collected (scores, username, city)
- AdMob data collection
- User rights
- Contact information

**Host on**: GitHub Pages, your website, or use a generator like:
- https://www.privacypolicygenerator.info/
- https://app-privacy-policy-generator.firebaseapp.com/

### Data Safety Form
Declare in Play Console:
- User data collected
- How it's used
- If it's shared
- Security practices

## ✅ Pre-Launch Checklist
- [ ] App signed with release key
- [ ] Tested on multiple devices
- [ ] All screenshots ready
- [ ] Privacy policy published
- [ ] AdMob account created & linked
- [ ] Real Ad Unit IDs configured
- [ ] App content rated
- [ ] Target audience selected
- [ ] Store listing complete
- [ ] AAB file uploaded

## 🚀 Launch Steps
1. Upload AAB to Play Console
2. Complete store listing
3. Set up pricing & distribution
4. Submit for review (typically 1-3 days)
5. Monitor reviews after launch

## 📊 Post-Launch
- Monitor crash reports in Play Console
- Track analytics in AdMob
- Respond to user reviews
- Plan updates based on feedback

---

## 🆘 Need Help?

**Capacitor Docs**: https://capacitorjs.com/docs/android
**Play Console Help**: https://support.google.com/googleplay/android-developer
**AdMob Setup**: https://admob.google.com/home/get-started/

Good luck with your launch! 🎉
