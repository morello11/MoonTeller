// Koruma katmanı: Origin, PIN, boyut, doğrulama, KV sayaçları, hash. Saf yardımcılar (KV nesnesi enjekte edilir).
import { KINDS, LIMITS, PERIOD_RE } from './config.js';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-App-Pin', 'Access-Control-Max-Age': '86400', Vary: 'Origin',
  };
}

// İzinli origin listesi env.ALLOWED_ORIGINS (virgülle). Eşleşmiyorsa null.
export function allowedOrigin(request, env) {
  const origin = request.headers.get('Origin') ?? '';
  const list = String(env.ALLOWED_ORIGINS ?? '').split(',').map((s) => s.trim()).filter(Boolean);
  return list.includes(origin) ? origin : null;
}

export function checkPin(request, env) {
  const pin = request.headers.get('X-App-Pin') ?? '';
  if (!env.APP_PIN || pin !== env.APP_PIN) throw new HttpError(401, 'PIN yok ya da yanlış.');
}

export async function readBody(request) {
  const declared = Number(request.headers.get('Content-Length') ?? 0);
  if (declared > LIMITS.bodyBytes) throw new HttpError(413, 'Gövde çok büyük.');
  const text = await request.text();
  if (new TextEncoder().encode(text).length > LIMITS.bodyBytes) throw new HttpError(413, 'Gövde çok büyük.');
  try { return JSON.parse(text); } catch { throw new HttpError(400, 'Gövde JSON değil.'); }
}

const isObject = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);

// Dönüş: { kind, chart, question, period }. Fazla alanlar atılır.
export function validate(payload) {
  if (!isObject(payload) || !KINDS.includes(payload.kind)) throw new HttpError(400, 'kind geçersiz.');
  if (!isObject(payload.chart) || !Array.isArray(payload.chart.placements)) throw new HttpError(400, 'chart eksik.');
  const question = typeof payload.question === 'string' ? payload.question.trim() : '';
  if (payload.kind === 'ask' && !question) throw new HttpError(400, 'Soru boş.');
  if (question.length > LIMITS.questionChars) throw new HttpError(400, `Soru ${LIMITS.questionChars} karakteri aşıyor.`);
  const period = String(payload.date ?? '');
  if (payload.kind !== 'ask' && !PERIOD_RE.test(period)) throw new HttpError(400, 'date geçersiz.');
  return { kind: payload.kind, chart: payload.chart, question, period };
}

async function bump(kv, key) {
  const count = Number(await kv.get(key)) + 1;
  await kv.put(key, String(count), { expirationTtl: LIMITS.counterTtlSec });
  return count;
}

// IP başına ve global günlük sayaç; aşımda 429.
export async function rateLimit(kv, ip, day) {
  const global = await bump(kv, `global:${day}`);
  if (global > LIMITS.globalPerDay) throw new HttpError(429, 'Günlük tavan doldu, yarın.');
  const perIp = await bump(kv, `ip:${ip}:${day}`);
  if (perIp > LIMITS.perIpPerDay) throw new HttpError(429, 'Bugünlük bu kadar; yarın devam.');
}

export async function sha256(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}
