import { execSync } from 'child_process';
import { resolve } from 'path';
import { checkConnectedDevices } from './check-device.mjs';

const androidDir = resolve('android');

try {
  // Check if device is connected
  console.log('Checking for connected Android devices...');
  const devices = checkConnectedDevices();

  if (devices.length === 0) {
    console.log('⚠️  No Android device connected.');
    console.log('');
    console.log('💡 To connect a device:');
    console.log('   1. Connect your Android device via USB');
    console.log('   2. Enable USB debugging on your device:');
    console.log('      - Go to Settings > About phone');
    console.log('      - Tap "Build number" 7 times');
    console.log('      - Go back to Settings > Developer options');
    console.log('      - Enable "USB debugging"');
    console.log('   3. Accept the USB debugging prompt on your device');
    console.log('   4. Run this command again: npm run android:install');
    console.log('');
    console.log('💡 Alternative: Use an Android emulator');
    console.log('   - Open Android Studio');
    console.log('   - Start an emulator from AVD Manager');
    console.log('   - Run: npm run android:install');
    process.exit(1);
  }

  console.log(`✅ Found ${devices.length} device(s): ${devices.join(', ')}`);
  console.log('Installing APK...');
  
  // Install APK
  execSync('./gradlew installDebug', { 
    cwd: androidDir,
    stdio: 'inherit'
  });

  console.log('Launching app...');
  
  // Launch app
  execSync('adb shell am start -n com.blockrise.stackrush/.MainActivity', {
    stdio: 'inherit'
  });

  console.log('✅ App installed and launched successfully!');
} catch (error) {
  if (error.status === 1 || error.exitCode === 1) {
    // Gradle or adb command failed - error already shown
    process.exit(1);
  }
  console.error('❌ Error during installation:', error.message);
  process.exit(1);
}

