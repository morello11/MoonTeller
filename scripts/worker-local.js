#!/usr/bin/env node
// Geliştirme: Worker handler'ını Node'da 8787 portunda koşturur. Bellek içi KV, sahte üst akış (key gerekmez).
// Kullanım: node scripts/worker-local.js [--port 8787] [--upstream-fail]
import { createServer } from 'node:http';
import handler from '../worker/src/index.js';

const args = process.argv.slice(2);
const opt = (name, fallback) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : fallback; };
const PORT = Number(opt('--port', 8787));
const FAIL = args.includes('--upstream-fail');

const store = new Map();
const kv = { get: async (k) => store.get(k) ?? null, put: async (k, v) => { store.set(k, v); } };
const env = { OPENAI_API_KEY: 'sahte', ALLOWED_ORIGINS: 'http://localhost:8080,http://127.0.0.1:8080', CACHE: kv };

// Sahte OpenAI: sesi, odak satırını ve varsa ek görevi yankılayan kısa bir "yorum".
const realFetch = globalThis.fetch;
globalThis.fetch = async (url, init) => {
  if (!String(url).includes('api.openai.com')) return realFetch(url, init);
  if (FAIL) return new Response('{"error":"sahte hata"}', { status: 500 });
  const body = JSON.parse(init.body);
  const voice = body.messages[0].content.match(/Sesin: ([^,.]+)/)?.[1] ?? '?';
  const lines = body.messages[1].content.split('\n');
  const focus = (lines.find((l) => l.startsWith('Odak') || l.startsWith('Hafta')) ?? lines[0]).slice(0, 120);
  const extra = lines.find((l) => l.startsWith('Ek görev'))?.slice(0, 40) ?? '';
  const text = `[SAHTE ${body.model} · ${voice}] ${focus}${extra ? ` | ${extra}` : ''}\n\nBu bir yerel deneme cevabıdır, gerçek model değil. Astroloji bilimsel bir yöntem değildir.`;
  return new Response(JSON.stringify({ choices: [{ message: { role: 'assistant', content: text }, finish_reason: 'stop' }] }), { status: 200, headers: { 'content-type': 'application/json' } });
};

createServer(async (req, res) => {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const request = new Request(`http://localhost:${PORT}${req.url}`, { method: req.method, headers: req.headers, body: chunks.length ? Buffer.concat(chunks) : undefined });
  const out = await handler.fetch(request, env);
  res.writeHead(out.status, Object.fromEntries(out.headers));
  res.end(Buffer.from(await out.arrayBuffer()));
}).listen(PORT, () => console.log(`worker-local: http://localhost:${PORT}${FAIL ? '  (üst akış hep 500)' : ''}`));
