import { execSync } from 'child_process';

/**
 * Check if Android device is connected
 * Returns array of device IDs if connected, empty array otherwise
 */
export function checkConnectedDevices() {
  try {
    const devicesOutput = execSync('adb devices', { 
      encoding: 'utf8', 
      stdio: ['ignore', 'pipe', 'pipe'],
      timeout: 5000
    });
    
    const devices = devicesOutput
      .split('\n')
      .filter(line => line.includes('device') && !line.includes('List'))
      .map(line => line.split('\t')[0])
      .filter(id => id && id.trim());
    
    return devices;
  } catch (error) {
    if (error.message.includes('command not found') || error.message.includes('adb')) {
      console.error('❌ ADB command not found. Make sure Android SDK platform-tools are in your PATH.');
      console.error('💡 Install Android SDK platform-tools or add them to your PATH.');
    } else {
      console.error('❌ Error checking for devices:', error.message);
    }
    return [];
  }
}

/**
 * Wait for device to be connected (with timeout)
 */
export function waitForDevice(timeoutMs = 30000) {
  console.log('Waiting for device to be connected...');
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    const devices = checkConnectedDevices();
    if (devices.length > 0) {
      console.log(`✅ Device connected: ${devices.join(', ')}`);
      return true;
    }
    // Wait a bit before checking again
    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    sleep(1000);
  }
  
  return false;
}

