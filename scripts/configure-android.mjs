
import fs from 'node:fs/promises';
import path from 'node:path';

const manifestPath = path.join(
  process.cwd(),
  'android',
  'app',
  'src',
  'main',
  'AndroidManifest.xml'
);

let manifest = await fs.readFile(manifestPath, 'utf8');

const permissions = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION'
];

for (const permission of permissions) {
  const declaration = `<uses-permission android:name="${permission}" />`;

  if (!manifest.includes(permission)) {
    manifest = manifest.replace(
      '<application',
      `    ${declaration}\n    <application`
    );
  }
}

await fs.writeFile(manifestPath, manifest, 'utf8');

console.log('Android location permissions configured.');
