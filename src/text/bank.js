// Metin bankası erişimi: JSON dosyaları → kayıt; seed'li varyant seçimi; Barnum etiketi. Saf mantık.
import { SIGN_KEYS } from '../config.js';

const SIGN_COUNT = 12;
const FNV_OFFSET = 2166136261;
const FNV_PRIME = 16777619;

// Deterministik 32 bit hash (FNV-1a). Seed = hash(profileId + yerel tarih).
export function hashSeed(text) {
  let hash = FNV_OFFSET;
  for (const ch of String(text)) {
    hash ^= ch.codePointAt(0);
    hash = Math.imul(hash, FNV_PRIME) >>> 0;
  }
  return hash >>> 0;
}

// Varyant seçimi: seed'e göre, son gösterilenleri (recent) mümkünse atlayarak.
export function pickVariant(variants, seed, recent = []) {
  if (!variants.length) return null;
  const start = seed % variants.length;
  for (let i = 0; i < variants.length; i += 1) {
    const candidate = variants[(start + i) % variants.length];
    if (!recent.includes(candidate)) return candidate;
  }
  return variants[start];
}

const ORDINAL_SUFFIX = { 1: "'ine", 2: "'sine", 3: "'üne", 4: "'üne", 5: "'ine", 6: "'sına", 7: "'sine", 8: "'ine", 9: "'una", 10: "'una", 11: "'ine", 12: "'sine" };

// 0..1 → "12 burcun 7'sine uyar" (Şüpheci Şerhi).
export function barnumLabel(score) {
  const n = Math.min(SIGN_COUNT, Math.max(1, Math.round(score * SIGN_COUNT)));
  return `12 burcun ${n}${ORDINAL_SUFFIX[n]} uyar`;
}

export function signKey(signIndex) {
  return SIGN_KEYS[signIndex];
}

// files: { 'planets-signs': {...}, 'planets-houses': {...}, aspects, archetypes, moon, 'ui-copy' }
export function createBank(files) {
  return {
    get(file, key) {
      return files[file]?.[key] ?? null;
    },
    has(file, key) {
      return Boolean(files[file]?.[key]);
    },
    copy(key, vars = {}) {
      const text = files['ui-copy']?.[key] ?? key;
      return text.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? ''));
    },
  };
}
