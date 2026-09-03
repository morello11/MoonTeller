// Koruma katmanı: Origin, boyut, doğrulama, KV sayaçları, hash. Saf yardımcılar (KV nesnesi enjekte edilir). PIN yok.
import { KINDS, TARGETS, FOLLOWUPS, LIMITS, PERIOD_RE, PERSONAS, DEFAULT_PERSONA } from './config.js';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin',
  };
}

// İzinli origin listesi env.ALLOWED_ORIGINS (virgülle). Eşleşmiyorsa null.
export function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') ?? '';
  const list = String(env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.includes(origin) ? origin : null;
}

export async function readBody(request) {
  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > LIMITS.bodyBytes) throw new HttpError(413, 'Gövde çok büyük.');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > LIMITS.bodyBytes) throw new HttpError(413, 'Gövde çok büyük.');
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'Gövde JSON değil.'); }
}

const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// Dönüş: { kind, target, followup, chart, focus, period, persona }. Fazla alanlar atılır.
export function validate(payload) {
  if (!isObject(payload) || !KINDS.includes(payload.kind)) throw new HttpError(400, 'kind geçersiz.');
  if (!isObject(payload.chart) || !Array.isArray(payload.chart.placements)) throw new HttpError(400, 'chart eksik.');
  const period = String(payload.date ?? '');
  if (!PERIOD_RE.test(period)) throw new HttpError(400, 'date geçersiz.');
  const persona = payload.persona ?? DEFAULT_PERSONA;
  if (!PERSONAS.includes(persona)) throw new HttpError(400, 'persona geçersiz.');
  const target = payload.kind === 'weekly' ? 'weekly' : payload.target;
  if (payload.kind === 'comment' && !TARGETS.includes(target)) throw new HttpError(400, 'target geçersiz.');
  const followup = payload.followup ? String(payload.followup) : '';
  if (followup && !FOLLOWUPS.includes(followup)) throw new HttpError(400, 'followup geçersiz.');
  const focus = isObject(payload.focus) ? payload.focus : {};
  if (new TextEncoder().encode(JSON.stringify(focus)).length > LIMITS.focusBytes) throw new HttpError(400, 'focus çok büyük.');
  return { kind: payload.kind, target, followup, chart: payload.chart, focus, period, persona };
}

// KV aynı anahtara saniyede bir yazım kabul eder; aynı anda gelen birkaç istekte yazım hatası isteği düşürmesin (sayaç kaba).
async function bump(kv, key) {
  const count = Number(await kv.get(key)) + 1;
  try { await kv.put(key, String(count), { expirationTtl: LIMITS.counterTtlSec }); } catch { /* sayaç bu istekte artmaz */ }
  return count;
}

// Önce IP, sonra global günlük sayaç; aşımda 429. Sıra önemli: sınırı aşmış tek bir IP global tavanı yiyemesin.
export async function rateLimit(kv, ip, day) {
  const perIp = await bump(kv, `ip:${ip}:${day}`);
  if (perIp > LIMITS.perIpPerDay) throw new HttpError(429, 'Bugünlük bu kadar; yarın devam.');
  const global = await bump(kv, `global:${day}`);
  if (global > LIMITS.globalPerDay) throw new HttpError(429, 'Günlük tavan doldu, yarın.');
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
