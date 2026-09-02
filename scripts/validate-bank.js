#!/usr/bin/env node
// Metin bankası bütünlük kontrolü: alanlar, uzunluk, yasak kelime, barnum, çift ve eksik anahtar.
// Kullanım: node scripts/validate-bank.js [--strict]   (--strict: eksik anahtar da hata sayılır)
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { BODIES, SIGN_KEYS, MOON_PHASE_IDS, BANK, TRANSIT, RETRO } from '../src/config.js';

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', 'tr');
const strict = process.argv.includes('--strict');
const L = BANK.limits;
const HOUSES = Array.from({ length: 12 }, (_, i) => `h${i + 1}`);
const ASPECT_NAMES = ['conjunction', 'sextile', 'square', 'trine', 'opposition'];
// Natal haritada oluşamayan açılar (Merkür Güneş'ten en çok 28°, Venüs 47° uzaklaşır): natal alanı null olmalı.
export const IMPOSSIBLE_NATAL = new Set([
  'sun_sextile_mercury', 'sun_square_mercury', 'sun_trine_mercury', 'sun_opposition_mercury',
  'sun_sextile_venus', 'sun_square_venus', 'sun_trine_venus', 'sun_opposition_venus',
  'mercury_square_venus', 'mercury_trine_venus', 'mercury_opposition_venus',
]);

function cross(bodies, suffixes) {
  return bodies.flatMap((b) => suffixes.map((s) => `${b}_${s}`));
}
function aspectKeys() {
  const keys = [];
  for (let i = 0; i < BODIES.length; i += 1) {
    for (let j = i + 1; j < BODIES.length; j += 1) for (const a of ASPECT_NAMES) keys.push(`${BODIES[i]}_${a}_${BODIES[j]}`);
  }
  return keys;
}
const text = (max) => ({ type: 'string', max });
const RETRO_TEXT_KEYS = ['start', 'mid', 'end', 'shadow_pre', 'shadow_post', 'countdown'];
function transitKeys() {
  return TRANSIT.transitingBodies.flatMap((t) => ASPECT_NAMES.flatMap((a) => TRANSIT.textTargets.map((n) => `t_${t}_${a}_n_${n}`)));
}
const SPECS = {
  'planets-signs': { keys: cross([...BODIES, 'asc'], SIGN_KEYS), fields: { title: text(L.title), hook: text(L.hook), body: text(L.body), scene: text(L.scene), barnum: { type: 'barnum' } } },
  'planets-houses': { keys: cross(BODIES, HOUSES), fields: { hook: text(L.hook), body: text(L.body), scene: text(L.scene), barnum: { type: 'barnum' } } },
  aspects: { keys: aspectKeys(), fields: { natal: text(L.natal), synastry: text(L.synastry), barnum: { type: 'barnum' } } },
  archetypes: { keys: SIGN_KEYS, fields: { title: text(L.title), emblem: text(L.title), lines: { type: 'lines', count: 3, max: L.archetypeLine }, meeting: text(L.scene), mail: text(L.scene), crisis: text(L.scene), barnum: { type: 'barnum' } } },
  moon: { keys: cross(MOON_PHASE_IDS.map((p) => `phase_${p}`), SIGN_KEYS), fields: { line: text(L.line), barnum: { type: 'barnum' } } },
  transits: { keys: transitKeys(), fields: { v: { type: 'lines', count: 3, max: L.transit }, advice: text(L.advice), barnum: { type: 'barnum' } } },
  retro: { keys: RETRO.bodies.flatMap((b) => RETRO_TEXT_KEYS.map((k) => `${b}_${k}`)), fields: { v: { type: 'lines', count: 3, max: L.line }, barnum: { type: 'barnum' } } },
  'ui-copy': { keys: null, fields: null, noBanned: true },
};

function checkField(value, spec) {
  if (spec.type === 'barnum') return typeof value === 'number' && value >= 0 && value <= BANK.barnumMax ? null : `barnum 0–${BANK.barnumMax} arası sayı olmalı`;
  if (spec.type === 'lines') {
    if (!Array.isArray(value) || value.length !== spec.count) return `${spec.count} satırlık dizi olmalı`;
    const bad = value.find((v) => typeof v !== 'string' || !v.trim() || v.length > spec.max);
    return bad === undefined ? null : `satır boş ya da ${spec.max} karakteri aşıyor`;
  }
  if (typeof value !== 'string' || !value.trim()) return 'boş';
  if (value.length > spec.max) return `${value.length} karakter > ${spec.max}`;
  return null;
}

function bannedIn(entry) {
  const blob = JSON.stringify(entry).toLocaleLowerCase('tr');
  return BANK.bannedWords.filter((w) => blob.includes(w));
}

function validateFile(name, spec) {
  const path = join(dir, `${name}.json`);
  if (!existsSync(path)) return { errors: [], missing: spec.keys ?? [], count: 0, absent: true };
  const data = JSON.parse(readFileSync(path, 'utf8'));
  const errors = [];
  for (const [key, entry] of Object.entries(data)) {
    if (spec.keys && !spec.keys.includes(key)) errors.push(`${name}:${key} beklenmeyen anahtar`);
    if (spec.fields) {
      for (const [field, fspec] of Object.entries(spec.fields)) {
        if (name === 'aspects' && field === 'natal' && IMPOSSIBLE_NATAL.has(key)) {
          if (entry?.natal !== null) errors.push(`${name}:${key}.natal natal haritada oluşamaz, null olmalı`);
          continue;
        }
        const problem = checkField(entry?.[field], fspec);
        if (problem) errors.push(`${name}:${key}.${field} ${problem}`);
      }
    } else if (typeof entry !== 'string' || !entry.trim()) errors.push(`${name}:${key} boş`);
    if (!spec.noBanned) for (const w of bannedIn(entry)) errors.push(`${name}:${key} yasak kelime: "${w}"`);
  }
  const missing = spec.keys ? spec.keys.filter((k) => !(k in data)) : [];
  return { errors, missing, count: Object.keys(data).length };
}

let totalErrors = 0;
let totalMissing = 0;
for (const [name, spec] of Object.entries(SPECS)) {
  const r = validateFile(name, spec);
  totalErrors += r.errors.length;
  totalMissing += r.missing.length;
  const expected = spec.keys ? `/${spec.keys.length}` : '';
  console.log(`${name}: ${r.absent ? 'dosya yok' : `${r.count}${expected} kayıt`}, ${r.errors.length} hata, ${r.missing.length} eksik`);
  for (const e of r.errors) console.log(`  ✗ ${e}`);
  if (strict) for (const m of r.missing.slice(0, 20)) console.log(`  ○ eksik: ${m}`);
}
console.log(`toplam: ${totalErrors} hata, ${totalMissing} eksik anahtar${strict ? ' (strict)' : ''}`);
process.exit(totalErrors > 0 || (strict && totalMissing > 0) ? 1 : 0);
