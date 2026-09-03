import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import handler from '../worker/src/index.js';
import { BANNED, VOICES, COMMON, userMessage } from '../worker/src/prompts.js';
import { LIMITS, PERSONAS, TARGETS, FOLLOWUPS, MODELS, MAX_TOKENS, CACHE_ENABLED } from '../worker/src/config.js';
import { BANK, LLM } from '../src/config.js';

const ORIGIN = 'https://ornek.github.io';
let store; let kv; let env; let upstreamCalls; let upstreamStatus; let logged;
const CHART = { timeKnown: true, asc: 'Aslan', placements: [{ body: 'Güneş', sign: 'Akrep', house: 4 }], aspects: [{ a: 'Mars', aspect: 'kare', b: 'Satürn', orb: 1.2 }] };
const FOCUS = { body: 'Güneş', sign: 'Akrep', house: 4 };
const BODY = { kind: 'comment', target: 'placement', chart: CHART, focus: FOCUS, date: '2026-09-02', lang: 'tr' };

beforeEach(() => {
  store = new Map(); upstreamCalls = 0; upstreamStatus = 200; logged = [];
  kv = { get: async (k) => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } };
  env = { OPENAI_API_KEY: 'k', ALLOWED_ORIGINS: `${ORIGIN},http://localhost:8080`, CACHE: kv };
  globalThis.fetch = async (url, init) => {
    upstreamCalls += 1;
    logged.push(JSON.parse(init.body));
    if (upstreamStatus !== 200) return new Response('{}', { status: upstreamStatus });
    return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: 'Yorum metni.' }, finish_reason: 'stop' }] }), { status: 200 });
  };
});

function req({ origin = ORIGIN, body = BODY, method = 'POST', path = '/v1/reading', ip = '1.2.3.4', raw } = {}) {
  const headers = { 'Content-Type': 'application/json', 'CF-Connecting-IP': ip };
  if (origin) headers.Origin = origin;
  return new Request(`https://w.test${path}`, { method, headers, body: method === 'POST' ? (raw ?? JSON.stringify(body)) : undefined });
}

test('izinli origin → 200 (PIN yok), cevap ve CORS başlığı', async () => {
  const res = await handler.fetch(req(), env);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Access-Control-Allow-Origin'), ORIGIN);
  assert.deepEqual(await res.json(), { text: 'Yorum metni.', cached: false, kind: 'comment', target: 'placement' });
  assert.equal(logged[0].messages[0].role, 'system');
  assert.equal(logged[0].max_completion_tokens, MAX_TOKENS.placement);
  assert.equal(logged[0].model, MODELS.comment);
});

test('yanlış origin → 403; OPTIONS → 204; yanlış yol → 404; key yok → 503', async () => {
  assert.equal((await handler.fetch(req({ origin: 'https://kotu.test' }), env)).status, 403);
  assert.equal((await handler.fetch(req({ method: 'OPTIONS' }), env)).status, 204);
  assert.equal((await handler.fetch(req({ path: '/baska' }), env)).status, 404);
  assert.equal((await handler.fetch(req(), { ...env, OPENAI_API_KEY: '' })).status, 503);
});

test('doğrulama: 413 gövde, 400 bozuk JSON / kind / target / followup / date / persona / focus boyutu', async () => {
  assert.equal((await handler.fetch(req({ raw: 'x'.repeat(LIMITS.bodyBytes + 1) }), env)).status, 413);
  assert.equal((await handler.fetch(req({ raw: '{bozuk' }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { ...BODY, kind: 'ask' } }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { ...BODY, target: 'gizli' } }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { ...BODY, followup: 'sor' } }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { ...BODY, date: 'dün' } }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { ...BODY, persona: 'gercek_kisi' } }), env)).status, 400);
  assert.equal((await handler.fetch(req({ body: { ...BODY, focus: { x: 'y'.repeat(LIMITS.focusBytes) } } }), env)).status, 400);
  assert.equal(upstreamCalls, 0);
});

test('hedef başına token tavanı, odak bloğu ve devam görevi kullanıcı mesajında', async () => {
  await handler.fetch(req({ body: { ...BODY, target: 'today', focus: { date: '2026-09-02', moon: { sign: 'Boğa', phase: 'Dolunay' }, transits: [{ a: 'Mars', aspect: 'kare', b: 'Güneş', orb: 0.5 }] }, followup: 'harder' } }), env);
  assert.equal(logged[0].max_completion_tokens, MAX_TOKENS.today);
  const user = logged[0].messages[1].content;
  assert.match(user, /Odak, bugün 2026-09-02/);
  assert.match(user, /Mars kare Güneş/);
  assert.match(user, /daha sert/);
  const weekly = userMessage({ kind: 'weekly', target: 'weekly', followup: '', chart: { ...CHART, weekly: { week: '2026-W36', days: [], pair: null, watch: null, teamSize: 2 } }, focus: {} });
  assert.match(weekly, /Pazartesi bültenini/);
});

test('cache (açıksa ikinci istek üst akışa gitmez; kapalıysa gider); farklı hedef/devam ayrı anahtar', async () => {
  await handler.fetch(req(), env);
  const second = await (await handler.fetch(req(), env)).json();
  assert.equal(second.cached, CACHE_ENABLED);
  assert.equal(upstreamCalls, CACHE_ENABLED ? 1 : 2);
  const before = upstreamCalls;
  await handler.fetch(req({ body: { ...BODY, followup: 'example' } }), env);
  assert.equal(upstreamCalls, before + 1);
});

test('IP limiti → 429 ve Retry-After; global tavan → 429', async () => {
  store.set('ip:1.2.3.4:' + new Date().toISOString().slice(0, 10), String(LIMITS.perIpPerDay));
  const res = await handler.fetch(req(), env);
  assert.equal(res.status, 429);
  assert.equal(res.headers.get('Retry-After'), '3600');
  store.set('global:' + new Date().toISOString().slice(0, 10), String(LIMITS.globalPerDay));
  assert.equal((await handler.fetch(req({ ip: '9.9.9.9' }), env)).status, 429);
});

test('üst akış 500 → 502, mesaj sızdırmaz; gövde konsola yazılmaz', async () => {
  upstreamStatus = 500;
  const logs = [];
  const orig = console.log; console.log = (...a) => logs.push(a.join(' '));
  try {
    const res = await handler.fetch(req({ body: { ...BODY, focus: { body: 'gizliOdak', sign: 'Akrep', house: 1 } } }), env);
    assert.equal(res.status, 502);
    assert.ok(!JSON.stringify(await res.json()).includes('gizliOdak'));
  } finally { console.log = orig; }
  assert.ok(!logs.some((l) => l.includes('gizliOdak')));
});

test('listeler uygulamayla aynı: klişe, sesler, hedefler, devamlar; system prompt ortak kuralları ve sesi taşıyor', async () => {
  assert.deepEqual(BANNED, BANK.bannedWords);
  assert.deepEqual(PERSONAS, LLM.voices);
  assert.deepEqual(TARGETS, LLM.targets);
  assert.deepEqual(FOLLOWUPS, LLM.followups.map(([k]) => k));
  const voices = JSON.parse(readFileSync(new URL('../data/tr/voices.json', import.meta.url), 'utf8'));
  assert.deepEqual(Object.keys(voices), PERSONAS);
  assert.deepEqual(Object.keys(VOICES), PERSONAS);
  for (const p of PERSONAS) assert.match(VOICES[p], /^Sesin: /);
  await handler.fetch(req({ body: { ...BODY, persona: 'nurten' } }), env);
  const system = logged[0].messages[0].content;
  assert.ok(system.includes(COMMON));
  assert.match(system, /hesap yapma/);
  assert.match(system, /Nurten Abla/);
});

test('tek dosya paketi (dist) güncel ve çalışıyor', async () => {
  const dist = readFileSync(new URL('../worker/dist/worker.js', import.meta.url), 'utf8');
  assert.ok(!/^import /m.test(dist), 'dist içinde import kalmış');
  for (const name of ['config', 'prompts', 'guard', 'index']) {
    const src = readFileSync(new URL(`../worker/src/${name}.js`, import.meta.url), 'utf8');
    const body = src.split('\n').filter((l) => !l.startsWith('import ')).join('\n').replace(/^export (const|function|class|async function) /gm, '$1 ').trim();
    assert.ok(dist.includes(body), `dist eski: worker/src/${name}.js değişmiş, node scripts/bundle-worker.js çalıştır`);
  }
  const bundled = (await import('../worker/dist/worker.js')).default;
  assert.equal((await bundled.fetch(req({ origin: 'https://kotu.test' }), env)).status, 403);
});
