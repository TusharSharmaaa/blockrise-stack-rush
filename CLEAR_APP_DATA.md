# How to Clear App Data for Testing

## Method 1: Using Android Device Settings (Easiest)

### On Android Device/Emulator:

1. **Open Settings** on your Android device/emulator
2. Go to **Apps** (or **Application Manager**)
3. Find and tap on **BlockRise** (or your app name)
4. Tap **Storage** (or **Storage & cache**)
5. Tap **Clear Storage** (or **Clear Data**)
6. Confirm by tapping **OK**

This will clear all app data including:
- Game progress
- Ad watch counters
- Coins
- Unlocked levels
- All saved preferences

## Method 2: Using ADB Command (For Emulator/Connected Device)

If you have ADB installed and your device/emulator is connected:

```bash
# List all packages to find your app
adb shell pm list packages | grep blockrise

# Clear app data (replace with your actual package name)
adb shell pm clear com.yourpackage.blockrise

# Or if you know the exact package name:
adb shell pm clear io.ionic.starter
```

## Method 3: Uninstall and Reinstall

1. **Uninstall the app** from your device/emulator
2. **Rebuild and reinstall**:
   ```bash
   npm run build
   npx cap sync android
   npx cap run android
   ```

## Method 4: Using Android Studio

1. Open Android Studio
2. Go to **Tools** → **Device Manager**
3. Select your device/emulator
4. Click the **Settings** icon (⚙️)
5. Go to **Advanced** → **Wipe Data**
6. Or use **File Explorer** to manually delete app data folders

## Method 5: Programmatic Reset (For Development)

You can add a reset function in your app for testing. The app already has a `resetProgress` function in `useGameProgress.ts`.

To use it programmatically, you can add a debug button or use the browser console:

```javascript
// In browser console (if using web version)
localStorage.clear();

// For Capacitor Preferences, you'd need to call:
// await Preferences.clear(); // This clears ALL preferences
```

## Method 6: Clear Specific Data via ADB

```bash
# Clear only app data (keeps app installed)
adb shell pm clear com.yourpackage.blockrise

# Or manually delete shared preferences
adb shell run-as com.yourpackage.blockrise
rm -rf shared_prefs/
exit
```

## Quick Test Reset Script

Create a file `clear-data.sh`:

```bash
#!/bin/bash
echo "Clearing app data..."
adb shell pm clear io.ionic.starter
echo "App data cleared! Rebuild and reinstall:"
echo "npm run build && npx cap sync android && npx cap run android"
```

Make it executable:
```bash
chmod +x clear-data.sh
./clear-data.sh
```

## Verify Data is Cleared

After clearing, when you open the app:
- ✅ Should start at Level 1
- ✅ Should have 100 coins (starting bonus)
- ✅ Should show 0/3 Ads and 0/6 in counters
- ✅ No unlocked levels except Level 1
- ✅ All progress reset

## Important Notes

⚠️ **Warning**: Clearing app data will:
- Delete ALL game progress
- Reset all counters
- Remove all unlocked levels
- Clear coins and achievements
- Reset all settings

💡 **Tip**: For testing, you might want to create a test build with a "Reset Progress" button in the Settings screen for easier testing.

---

**Recommended for Testing**: Use **Method 1** (Android Settings) as it's the easiest and most reliable way to clear all app data.




