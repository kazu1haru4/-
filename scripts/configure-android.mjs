
import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();

const manifestPath = path.join(
  root,
  'android',
  'app',
  'src',
  'main',
  'AndroidManifest.xml'
);

const resDir = path.join(
  root,
  'android',
  'app',
  'src',
  'main',
  'res'
);

const iconPath = path.join(root, 'icon-512.png');

// AndroidManifest.xml の位置情報権限設定
let manifest = await fs.readFile(manifestPath, 'utf8');

const permissions = [
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.ACCESS_FINE_LOCATION'
];

for (const permission of permissions) {
  const declaration =
    `<uses-permission android:name="${permission}" />`;

  if (!manifest.includes(permission)) {
    manifest = manifest.replace(
      '<application',
      `    ${declaration}\n    <application`
    );
  }
}

await fs.writeFile(manifestPath, manifest, 'utf8');

// 既存のフレンドチャットアイコンを確認
const iconBuffer = await fs.readFile(iconPath);

const pngSignature = Buffer.from([
  0x89, 0x50, 0x4e, 0x47,
  0x0d, 0x0a, 0x1a, 0x0a
]);

if (!iconBuffer.subarray(0, 8).equals(pngSignature)) {
  throw new Error('icon-512.png is not a valid PNG file.');
}

// Android用ランチャーアイコンを配置
const densities = [
  'mdpi',
  'hdpi',
  'xhdpi',
  'xxhdpi',
  'xxxhdpi'
];

for (const density of densities) {
  const mipmapDir = path.join(
    resDir,
    `mipmap-${density}`
  );

  await fs.mkdir(mipmapDir, { recursive: true });

  await fs.copyFile(
    iconPath,
    path.join(mipmapDir, 'ic_launcher.png')
  );

  await fs.copyFile(
    iconPath,
    path.join(mipmapDir, 'ic_launcher_round.png')
  );
}

// デフォルトのAdaptive Icon設定を除去し、
// 上で配置した既存PNGをランチャーに使用する
const adaptiveDir = path.join(
  resDir,
  'mipmap-anydpi-v26'
);

for (const name of [
  'ic_launcher.xml',
  'ic_launcher_round.xml'
]) {
  await fs.rm(
    path.join(adaptiveDir, name),
    { force: true }
  );
}

console.log('Android location permissions configured.');
console.log('Friend Chat launcher icons configured.');
