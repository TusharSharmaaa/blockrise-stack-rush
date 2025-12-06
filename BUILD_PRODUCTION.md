# Building Production AAB for Google Play Store

This guide will help you build a production-ready Android App Bundle (AAB) file for upload to Google Play Console.

## Prerequisites

✅ **Keystore configured** - Your `android/keystore.properties` file is already set up  
✅ **Version configured** - Current version: `1.4.0` (versionCode: 4)

## Quick Build Command

Run this single command to build your production AAB:

```bash
npm run android:build:release
```

## Step-by-Step Process

### 1. Build Web Assets
```bash
npm run build
```
This compiles your React/Vite app into optimized production files in the `dist/` folder.

### 2. Sync with Capacitor
```bash
npx cap sync android
```
This copies your web assets to the Android project and ensures all plugins are properly configured.

### 3. Ensure Native Ad Plugin
```bash
node scripts/ensure-native-ad-plugin.mjs
```
This ensures the AdMob plugin is properly configured.

### 4. Build Release AAB
```bash
cd android
./gradlew bundleRelease
cd ..
```

## Output Location

After building, your production AAB file will be located at:

```
android/app/build/outputs/bundle/release/app-release.aab
```

## Uploading to Google Play Console

1. **Go to Google Play Console**
   - Navigate to your app → Production → Create new release

2. **Upload the AAB file**
   - Click "Upload" or drag and drop the `app-release.aab` file
   - Location: `android/app/build/outputs/bundle/release/app-release.aab`

3. **Review the release**
   - Check version code (should be 4)
   - Check version name (should be 1.4.0)
   - Review release notes if needed

4. **Save and submit**
   - Save the release
   - Submit for review

## Important Notes

⚠️ **Version Code**: Each upload to Play Store must have a unique, incrementing version code.  
   - Current: `4`
   - Next release should be: `5` (update in `android/app/build.gradle`)

⚠️ **Version Name**: This is the user-facing version (e.g., "1.4.0")  
   - Current: `1.4.0`
   - Update as needed for semantic versioning

⚠️ **Keystore Security**: 
   - Your keystore file and passwords are stored in `android/keystore.properties`
   - **NEVER commit this file to version control** (it should be in `.gitignore`)
   - Keep backups of your keystore file in a secure location
   - If you lose your keystore, you cannot update your app on Play Store!

## Troubleshooting

### Build Fails with Signing Error
- Check that `android/keystore.properties` exists and has correct paths
- Verify keystore file exists at the specified location
- Check that passwords are correct

### Build Succeeds but AAB is Missing
- Check `android/app/build/outputs/bundle/release/` directory
- Try cleaning the build: `cd android && ./gradlew clean && ./gradlew bundleRelease`

### Version Code Already Used
- Increment `versionCode` in `android/app/build.gradle`
- Each Play Store upload requires a unique, higher version code

## Next Steps After Upload

1. ✅ Upload AAB to Play Console
2. ✅ Complete store listing (if not done)
3. ✅ Set countries/regions for distribution
4. ✅ Submit for Google review
5. ✅ Wait for approval (typically 1-3 days)
6. ✅ Publish to production

---

**Good luck with your release! 🚀**
