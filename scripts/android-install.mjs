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
    console.log('✅ Build completed successfully. The APK is ready in: android/app/build/outputs/apk/debug/');
    console.log('💡 To install when device is connected:');
    console.log('   1. Connect your device via USB and enable USB debugging');
    console.log('   2. Run: npm run android:install');
    console.log('   3. Or open Android Studio and install from there');
    process.exit(0);
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
  console.error('❌ Error during installation:', error.message);
  if (error.message.includes('command not found') || error.message.includes('adb')) {
    console.error('💡 Make sure Android SDK platform-tools are in your PATH');
  }
  process.exit(1);
}

