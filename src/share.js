// Paylaşım linki: profil ↔ base64url JSON. Saf mantık (DOM yok); TextEncoder/atob/btoa Node ve tarayıcıda var.
import { SHARE, HOUSE_SYSTEMS, DEFAULT_TZ } from './config.js';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Gerçek takvim günü mü (30 Şubat gibi kaymalar reddedilir).
function validDate(text) {
  if (!DATE_RE.test(text ?? '')) return false;
  const d = new Date(`${text}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === text;
}

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(text) {
  const padded = text.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (text.length % 4)) % 4);
  const binary = atob(padded);
  return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
}

const round = (n) => Number(Number(n).toFixed(SHARE.coordDecimals));

// Kimlik (id) ve oluşturma zamanı taşınmaz; alan kısaltmaları link kısa kalsın diye.
export function encodeProfile(profile) {
  const payload = {
    v: SHARE.version, n: profile.name, d: profile.date, t: profile.time ?? null, tz: profile.tz,
    p: profile.place ?? '', la: round(profile.lat), lo: round(profile.lon), hs: profile.houseSystem,
  };
  return toBase64Url(JSON.stringify(payload));
}

function validTz(tz) {
  try { new Intl.DateTimeFormat('en-US', { timeZone: tz }); return true; } catch { return false; }
}

function validate(p) {
  if (!p || typeof p !== 'object' || p.v !== SHARE.version) throw new Error('Link bozuk ya da eski sürüm.');
  const name = String(p.n ?? '').trim();
  if (!name || name.length > SHARE.nameMax) throw new Error('Linkteki ad eksik ya da çok uzun.');
  if (!validDate(p.d)) throw new Error('Linkteki doğum tarihi geçersiz.');
  if (p.t !== null && p.t !== undefined && !TIME_RE.test(p.t)) throw new Error('Linkteki doğum saati geçersiz.');
  if (typeof p.tz !== 'string' || !validTz(p.tz)) throw new Error('Linkteki saat dilimi geçersiz.');
  const lat = Number(p.la); const lon = Number(p.lo);
  if (!(Math.abs(lat) <= 90) || !(Math.abs(lon) <= 180)) throw new Error('Linkteki konum geçersiz.');
  return { name, date: p.d, time: p.t ?? null, tz: p.tz || DEFAULT_TZ, place: String(p.p ?? ''), lat, lon, houseSystem: HOUSE_SYSTEMS.includes(p.hs) ? p.hs : undefined };
}

// Dönüş: normalizeProfile'a verilecek alanlar (id yok). Hata: Error (mesaj kullanıcıya gösterilir).
export function decodeProfile(encoded) {
  let parsed;
  try { parsed = JSON.parse(fromBase64Url(String(encoded ?? ''))); } catch { throw new Error('Link bozuk ya da eski sürüm.'); }
  return validate(parsed);
}

export function shareUrl(baseUrl, profile) {
  return `${baseUrl}#${SHARE.param}=${encodeProfile(profile)}`;
}

// "#p=..." → kodlanmış metin; değilse null.
export function parseShareHash(hash) {
  const prefix = `#${SHARE.param}=`;
  return typeof hash === 'string' && hash.startsWith(prefix) && hash.length > prefix.length ? hash.slice(prefix.length) : null;
}
