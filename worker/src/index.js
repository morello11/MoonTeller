// Yıldızname LLM proxy: POST /v1/reading → OpenAI Chat Completions. Key yalnızca secret'ta, gövde loglanmaz.
import { PATH, MODELS, UPSTREAM, CACHE_TTL_SEC } from './config.js';
import { systemPrompt, userMessage } from './prompts.js';
import { HttpError, corsHeaders, allowedOrigin, checkPin, readBody, validate, rateLimit, sha256 } from './guard.js';

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}

// OpenAI Chat Completions: system + user mesajı, max_completion_tokens; cevap choices[0].message.content.
async function callUpstream(env, kind, persona, content) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM.timeoutMs);
  try {
    const res = await fetch(UPSTREAM.url, {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODELS[kind], max_completion_tokens: UPSTREAM.maxTokens,
        messages: [{ role: 'system', content: systemPrompt(persona) }, { role: 'user', content }],
      }),
    });
    if (!res.ok) throw new HttpError(502, `Üst akış ${res.status}.`);
    const data = await res.json();
    const message = data.choices?.[0]?.message ?? {};
    if (message.refusal) throw new HttpError(502, 'Model bu isteği reddetti.');
    const text = String(message.content ?? '').trim();
    if (!text) throw new HttpError(502, 'Boş cevap.');
    return text;
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, err.name === 'AbortError' ? 'Üst akış zaman aşımı.' : 'Üst akışa ulaşılamadı.');
  } finally {
    clearTimeout(timer);
  }
}

async function reading(request, env) {
  checkPin(request, env);
  const payload = validate(await readBody(request));
  const day = new Date().toISOString().slice(0, 10);
  await rateLimit(env.CACHE, request.headers.get('CF-Connecting-IP') ?? 'yok', day);
  const cacheKey = payload.kind === 'ask' ? null : `${payload.kind}:${payload.persona}:${await sha256(JSON.stringify(payload.chart))}:${payload.period}`;
  if (cacheKey) {
    const hit = await env.CACHE.get(cacheKey);
    if (hit) return { text: hit, cached: true, kind: payload.kind };
  }
  const text = await callUpstream(env, payload.kind, payload.persona, userMessage(payload));
  if (cacheKey) await env.CACHE.put(cacheKey, text, { expirationTtl: CACHE_TTL_SEC[payload.kind] });
  return { text, cached: false, kind: payload.kind };
}

async function handle(request, env) {
  const origin = allowedOrigin(request, env);
  if (!origin) return json({ error: 'Origin izinli değil.' }, 403, {});
  const cors = corsHeaders(origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST' || new URL(request.url).pathname !== PATH) return json({ error: 'Yok.' }, 404, cors);
  if (!env.OPENAI_API_KEY) return json({ error: 'Worker kapalı.' }, 503, cors);
  try {
    return json(await reading(request, env), 200, cors);
  } catch (err) {
    const status = err instanceof HttpError ? err.status : 500;
    const extra = status === 429 ? { 'Retry-After': '3600' } : {};
    return json({ error: err instanceof HttpError ? err.message : 'Bir şey ters gitti.' }, status, { ...cors, ...extra });
  }
}

export default { fetch: handle };
