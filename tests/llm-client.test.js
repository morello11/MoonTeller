import { test } from 'node:test';
import assert from 'node:assert/strict';
import { askWorker, workerConfigured } from '../src/llm/client.js';

const URL_ = 'https://w.test';
const summary = { placements: [] };
const respond = (status, body) => async () => new Response(JSON.stringify(body ?? {}), { status });

test('URL ya da PIN yoksa istek atmadan neden döner', async () => {
  assert.equal(workerConfigured(''), false);
  assert.deepEqual(await askWorker('daily', summary, { pin: '1', url: '' }), { ok: false, reason: 'no_url' });
  assert.deepEqual(await askWorker('daily', summary, { pin: '', url: URL_ }), { ok: false, reason: 'no_pin' });
});

test('200 → metin; 401/429/503/500 → nedenler; ağ hatası → offline; asla fırlatmaz', async () => {
  const ok = await askWorker('ask', summary, { pin: '1', url: URL_, question: 's', fetchImpl: respond(200, { text: 'Cevap', cached: false }) });
  assert.deepEqual(ok, { ok: true, text: 'Cevap', cached: false });
  assert.equal((await askWorker('ask', summary, { pin: '1', url: URL_, fetchImpl: respond(401) })).reason, 'unauthorized');
  assert.equal((await askWorker('ask', summary, { pin: '1', url: URL_, fetchImpl: respond(429) })).reason, 'limited');
  assert.equal((await askWorker('ask', summary, { pin: '1', url: URL_, fetchImpl: respond(503) })).reason, 'offline');
  assert.equal((await askWorker('ask', summary, { pin: '1', url: URL_, fetchImpl: respond(500) })).reason, 'error');
  assert.equal((await askWorker('ask', summary, { pin: '1', url: URL_, fetchImpl: respond(200, { text: '' }) })).reason, 'error');
  assert.equal((await askWorker('ask', summary, { pin: '1', url: URL_, fetchImpl: async () => { throw new TypeError('ağ'); } })).reason, 'offline');
});

test('zaman aşımı → offline; başlık ve gövde doğru', async () => {
  let seen;
  const slow = (input, init) => new Promise((_, reject) => { seen = { input, init }; init.signal.addEventListener('abort', () => reject(new DOMException('abort', 'AbortError'))); });
  const r = await askWorker('daily', summary, { pin: '4321', url: `${URL_}/`, date: '2026-09-02', fetchImpl: slow, timeoutMs: 20 });
  assert.equal(r.reason, 'offline');
  assert.equal(seen.input, `${URL_}/v1/reading`);
  assert.equal(seen.init.headers['X-App-Pin'], '4321');
  assert.deepEqual(JSON.parse(seen.init.body), { kind: 'daily', chart: summary, question: '', date: '2026-09-02', lang: 'tr' });
});
