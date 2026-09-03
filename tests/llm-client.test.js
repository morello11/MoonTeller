import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askWorker, workerConfigured } from '../src/llm/client.js';

const URL_ = 'https://w.test';
const chart = { placements: [] };
const respond = (status, body) => async () => new Response(JSON.stringify(body ?? {}), { status });

test('URL yoksa istek atmadan neden döner', async () => {
  assert.equal(workerConfigured(''), false);
  assert.deepEqual(await askWorker('comment', chart, { url: '' }), { ok: false, reason: 'no_url' });
});

test('200 → metin; 429/503/500 → nedenler; ağ hatası → offline; asla fırlatmaz', async () => {
  const ok = await askWorker('comment', chart, { url: URL_, target: 'chart', fetchImpl: respond(200, { text: 'Cevap', cached: false }) });
  assert.deepEqual(ok, { ok: true, text: 'Cevap', cached: false });
  assert.equal((await askWorker('comment', chart, { url: URL_, fetchImpl: respond(429) })).reason, 'limited');
  assert.equal((await askWorker('comment', chart, { url: URL_, fetchImpl: respond(503) })).reason, 'offline');
  assert.equal((await askWorker('comment', chart, { url: URL_, fetchImpl: respond(500) })).reason, 'error');
  assert.equal((await askWorker('comment', chart, { url: URL_, fetchImpl: respond(200, { text: '' }) })).reason, 'error');
  assert.equal((await askWorker('comment', chart, { url: URL_, fetchImpl: async () => { throw new TypeError('ağ'); } })).reason, 'offline');
});

test('zaman aşımı → offline; gövde hedef, odak, devam ve ses taşıyor; PIN başlığı yok', async () => {
  let seen;
  const slow = (input, init) => new Promise((_, reject) => { seen = { input, init }; init.signal.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError'))); });
  const r = await askWorker('comment', chart, { url: `${URL_}/`, target: 'aspect', focus: { a: 'Mars' }, followup: 'harder', date: '2026-09-02', persona: 'nurten', fetchImpl: slow, timeoutMs: 20 });
  assert.equal(r.reason, 'offline');
  assert.equal(seen.input, `${URL_}/v1/reading`);
  assert.equal(seen.init.headers['X-App-Pin'], undefined);
  assert.deepEqual(JSON.parse(seen.init.body), { kind: 'comment', target: 'aspect', followup: 'harder', chart, focus: { a: 'Mars' }, date: '2026-09-02', persona: 'nurten', lang: 'tr' });
});
