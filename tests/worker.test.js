import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import handler from '../worker/src/index.js';
import { readFileSync } from 'node:fs';
import { BANNED, VOICES, COMMON } from '../worker/src/prompts.js';
import { LIMITS, PERSONAS, MODELS } from '../worker/src/config.js';
import { BANK, LLM } from '../src/config.js';

const ORIGIN = 'https://ornek.github.io';
let store; let kv; let env; let upstreamCalls; let upstreamStatus; let logged;
const CHART = { timeKnown: true, asc: 'Aslan', placements: [{ body: 'Güneş', sign: 'Akrep', house: 4 }], aspects: [{ a: 'Mars', aspect: 'kare', b: 'Satürn', orb: 1.2 }], daily: { date: '2026-09-02', moon: { phase: 'Dolunay', sign: 'Boğa' }, transits: [] } };

beforeEach(() => {
  store = new Map(); upstreamCalls = 0; upstreamStatus = 200; logged = [];
  kv = { get: async (k) => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } };
  env = { APP_PIN: '1234', OPENAI_API_KEY: 'k', ALLOWED_ORIGINS: `${ORIGIN},http://localhost:8080`, CACHE: kv };
  globalThis.fetch = async (url, init) => {
    upstreamCalls += 1;
    logged.push(JSON.parse(init.body));
    if (upstreamStatus !== 200) return new Response('{}', { status: upstreamStatus });
    return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'Yorum metni.' }, finish_reason: 'stop' }] }), { status: 200 });
  };
});

function req({ origin = ORIGIN, pin = '1234', body = { kind: 'daily', chart: CHART, date: '2026-09-02', lang: 'tr' }, method = 'POST', path = '/v1/reading', ip = '1.2.3.4', raw } = {}) {
  const headers = { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip };
  if (origin) headers.Origin = origin;
  if (pin) headers['X-App-Pin'] = pin;
  return new Request(`https://w.test${path}`, { method, headers, body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined });
}

test('izinli origin + PIN → 200, cevap ve CORS başlığı', async () => {
  const res = await handler.fetch(req(), env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  const data = await res.json();
  assert.deepEqual(data, { text: 'Yorum metni.', cached: false, kind: 'daily' });
});

test('PIN yok → 401, yanlış PIN → 401', async () => {
  assert.equal((await handler.fetch(req({ pin: '' }), env)).status, 401);
  assert.equal((await handler.fetch(req({ pin: '9999' }), env)).status, 401);
  assert.equal(upstreamCalls, 0);
});

test('yanlış origin → 403; OPTIONS → 204; yanlış yol → 404; key yok → 503', async () => {
  assert.equal((await handler.fetch(req({ origin: 'https://kotu.test' }), env)).status, 403);
  assert.equal((await handler.fetch(req({ method: 'OPTIONS' }), env)).status, 204);
  assert.equal((await handler.fetch(req({ path: '/baska' }), env)).status, 404);
  assert.equal((await handler.fetch(req(), { ...env, OPENAI_API_KEY: '' })).status, 503);
});

test('gövde sınırı → 413; bozuk gövde/kind/soru → 400', async () => {
  assert.equal((await handler.fetch(req({ raw: 'x'.repeat(LIMITS.bodyBytes + 1) }), env)).status, 413);
  assert.equal((await handler.fetch(req({ raw: '{bozuk' }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { kind: 'yok', chart: CHART } }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { kind: 'ask', chart: CHART, question: '' } }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { kind: 'ask', chart: CHART, question: 's'.repeat(LIMITS.questionChars + 1) } }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { kind: 'daily', chart: CHART, date: 'dün' } }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { kind: 'daily', chart: CHART, date: '2026-09-02', persona: 'gercek_kisi' } }), env)).status, 400);
});

test('daily cache: ikinci istek üst akışa gitmez; ask cache\'siz', async () => {
  await handler.fetch(req(), env);
  const second = await (await handler.fetch(req(), env)).json();
  assert.equal(second.cached, true);
  assert.equal(upstreamCalls, 1);
  const ask = { kind: 'ask', chart: CHART, question: 'Bugün deploy yapayım mı?' };
  await handler.fetch(req({ body: ask }), env); await handler.fetch(req({ body: ask }), env);
  assert.equal(upstreamCalls, 3);
  assert.match(logged[1].messages[1].content, /Soru \(kullanıcı verisi\)/);
  assert.equal(logged[1].model, MODELS.ask);
  assert.equal(logged[0].model, MODELS.daily);
});

test('IP limiti → 429 ve Retry-After; global tavan → 429', async () => {
  store.set('ip:1.2.3.4:' + new Date().toISOString().slice(0, 10), String(LIMITS.perIpPerDay));
  const res = await handler.fetch(req({ body: { kind: 'ask', chart: CHART, question: 'x' } }), env);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), '3600');
  store.set('global:' + new Date().toISOString().slice(0, 10), String(LIMITS.globalPerDay));
  assert.equal((await handler.fetch(req({ ip: '9.9.9.9', body: { kind: 'ask', chart: CHART, question: 'x' } }), env)).status, 429);
});

test('üst akış 500 → 502, mesaj sızdırmaz; gövde konsola yazılmaz', async () => {
  upstreamStatus = 500;
  const logs = [];
  const orig = console.log; console.log = (...a) => logs.push(a.join(' '));
  try {
    const res = await handler.fetch(req({ body: { kind: 'ask', chart: CHART, question: 'gizli soru' } }), env);
    assert.equal(res.status, 502);
    assert.ok(!JSON.stringify(await res.json()).includes('gizli'));
  } finally { console.log = orig; }
  assert.ok(!logs.some((l) => l.includes('gizli')));
});

test('klişe listesi uygulamayla aynı; system prompt ortak kuralları ve sesi taşıyor', async () => {
  assert.deepEqual(BANNED, BANK.bannedWords);
  await handler.fetch(req(), env);
  const system = logged[0].messages[0];
  assert.equal(system.role, 'system');
  assert.match(system.content, /hesap yapma/);
  assert.match(system.content, /Sesin: Sert Uygulama/);
  assert.ok(system.content.includes(COMMON));
  assert.equal(logged[0].max_completion_tokens, 400);
});

test('sesler: Worker listesi uygulama ve voices.json ile aynı; her sesin kartı var; persona cache anahtarına giriyor', async () => {
  const voices = JSON.parse(readFileSync(new URL('../data/tr/voices.json', import.meta.url), 'utf8'));
  assert.deepEqual(PERSONAS, LLM.voices);
  assert.deepEqual(Object.keys(voices), PERSONAS);
  assert.deepEqual(Object.keys(VOICES), PERSONAS);
  for (const p of PERSONAS) assert.match(VOICES[p], /^Sesin: /);
  await handler.fetch(req({ body: { kind: 'daily', chart: CHART, date: '2026-09-02', persona: 'nurten' } }), env);
  await handler.fetch(req({ body: { kind: 'daily', chart: CHART, date: '2026-09-02', persona: 'muneccim' } }), env);
  assert.equal(upstreamCalls, 2); // nurten ve muneccim ayrı cache anahtarı
  assert.match(logged[0].messages[0].content, /Nurten Abla/);
  assert.match(logged[1].messages[0].content, /Müneccimbaşı/);
});
