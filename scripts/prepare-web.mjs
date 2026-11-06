import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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
console.log('Friend Chat web files copied into www/.');
