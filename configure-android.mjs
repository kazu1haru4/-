import fs from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
let manifest = await fs.readFile(manifestPath, 'utf8');

const permissions = [
  '<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />',
  '<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />',
  '<uses-feature android:name="android.hardware.location.gps" android:required="false" />'
];

for (const permission of permissions) {
  const tagName = permission.match(/<(?:uses-permission|uses-feature)\s+android:name="([^"]+)"/)?.[1];
  if (tagName && !manifest.includes(`android:name="${tagName}"`)) {
    manifest = manifest.replace(/<application\b/, `    ${permission}\n    <application`);
  }
}

await fs.writeFile(manifestPath, manifest, 'utf8');
console.log('Android location permissions added to AndroidManifest.xml.');
