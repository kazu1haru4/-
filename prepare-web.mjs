import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dest = path.join(root, 'www');
const excluded = new Set([
  '.git', '.github', '.vscode', 'node_modules', 'www', 'android', 'ios',
  '.gradle', '.idea', 'scripts'
]);

await fs.rm(dest, { recursive: true, force: true });
await fs.mkdir(dest, { recursive: true });

async function copyTree(from, to) {
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    if (excluded.has(entry.name)) continue;
    const src = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    if (entry.isDirectory()) {
      await fs.mkdir(target, { recursive: true });
      await copyTree(src, target);
    } else if (entry.isFile()) {
      await fs.copyFile(src, target);
    }
  }
}

await copyTree(root, dest);

// Android APK用のネイティブ機能ブリッジをwww内に生成する。
// 元のWeb版HTMLは変更せず、APKにコピーしたHTMLだけに読み込ませる。
await build({
  entryPoints: [path.join(root, 'scripts', 'capacitor-native-bridge.js')],
  bundle: true,
  platform: 'browser',
  format: 'iife',
  target: ['es2020'],
  outfile: path.join(dest, 'capacitor-native-bridge.js')
});

for (const fileName of ['chat.html', 'profile.html', 'friends.html']) {
  const filePath = path.join(dest, fileName);
  let html;
  try {
    html = await fs.readFile(filePath, 'utf8');
  } catch {
    continue;
  }

  const scriptTag = '<script src="./capacitor-native-bridge.js"></script>';
  if (!html.includes(scriptTag)) {
    if (html.includes('</body>')) {
      html = html.replace('</body>', `  ${scriptTag}\n</body>`);
    } else {
      html += `\n${scriptTag}\n`;
    }
    await fs.writeFile(filePath, html, 'utf8');
  }
}

console.log('Friend Chat web files copied into www/ and Android native bridge bundled.');
