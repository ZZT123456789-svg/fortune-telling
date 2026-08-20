import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const output = join(root, 'dist');
const staticEntries = [
  'index.html',
  'library.html',
  'payment.html',
  'assets',
  'css',
  'data',
  'js'
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const entry of staticEntries) {
  await cp(join(root, entry), join(output, entry), { recursive: true });
}

console.log(`Built ${staticEntries.length} static entries in dist/`);
