#!/usr/bin/env node
// worker/src/*.js → worker/dist/worker.js: Cloudflare panelindeki editöre yapıştırılacak tek dosya (bundler yok; import/export satırları sadeleştirilir).
// Kullanım: node scripts/bundle-worker.js   (worker/src değişince yeniden çalıştır, sonucu commit'le)
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'worker');
const ORDER = ['config.js', 'prompts.js', 'guard.js', 'index.js']; // bağımlılık sırası

function strip(source) {
  return source
    .split('\n')
    .filter((line) => !/^import .* from '\.\/[a-z]+\.js';$/.test(line))
    .map((line) => line.replace(/^export default \{ fetch: handle \};$/, 'export default { fetch: handle };').replace(/^export (const|function|class|async function) /, '$1 '))
    .join('\n');
}

const parts = ORDER.map((name) => `// ---- ${name} ----\n${strip(readFileSync(join(root, 'src', name), 'utf8')).trim()}`);
const out = `// Yıldızname Worker — tek dosya (scripts/bundle-worker.js üretir; elle düzenleme, kaynak worker/src/).\n\n${parts.join('\n\n')}\n`;
mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist', 'worker.js'), out);
console.log(`worker/dist/worker.js yazıldı (${out.length} karakter)`);
