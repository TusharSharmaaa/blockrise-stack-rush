import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';

const pluginsFile = resolve('android', 'app', 'src', 'main', 'assets', 'capacitor.plugins.json');
const nativeEntry = {
  pkg: 'native-ad',
  classpath: 'com.blockrise.stackrush.ads.NativeAdPlugin',
};

try {
  const contents = readFileSync(pluginsFile, 'utf8');
  const parsed = JSON.parse(contents);

  const exists = parsed.some(
    (plugin) => plugin.pkg === nativeEntry.pkg || plugin.classpath === nativeEntry.classpath,
  );

  if (!exists) {
    parsed.push(nativeEntry);
    writeFileSync(pluginsFile, JSON.stringify(parsed, null, 2));
    console.log('NativeAd plugin entry added to capacitor.plugins.json');
  } else {
    console.log('NativeAd plugin entry already present');
  }
} catch (error) {
  console.error('Failed to ensure NativeAd plugin entry:', error);
  process.exit(1);
}

