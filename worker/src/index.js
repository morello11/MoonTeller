// Yıldızname yorumcu proxy'si: POST /v1/reading → OpenAI Chat Completions. Key yalnızca secret'ta, gövde loglanmaz. PIN yok;
// koruma Origin allowlist + IP/gün + global/gün tavanı.
import { PATH, MODELS, UPSTREAM, MAX_TOKENS, CACHE_TTL_SEC, CACHE_ENABLED } from './config.js';
import { systemPrompt, userMessage } from './prompts.js';
import { HttpError, corsHeaders, allowedOrigin, readBody, validate, rateLimit, sha256 } from './guard.js';

function json(body, status, headers) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } });
}

// Tavana takılan cevap (finish_reason length) son cümle sonunda kesilir; yarım cümle kullanıcıya gitmez.
function trimToSentence(text) {
  const end = Math.max(text.lastIndexOf('.'), text.lastIndexOf('!'), text.lastIndexOf('?'));
  return end > 0 ? text.slice(0, end + 1) : text;
}

// OpenAI Chat Completions: system + user mesajı, max_completion_tokens; cevap choices[0].message.content. Dönüş { text, cut }.
async function callUpstream(env, kind, target, persona, content) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), UPSTREAM.timeoutMs);
  try {
    const res = await fetch(UPSTREAM.url, {
      method: 'POST', signal: controller.signal,
      headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODELS[kind], max_completion_tokens: MAX_TOKENS[target] ?? MAX_TOKENS.chart,
        messages: [{ role: 'system', content: systemPrompt(persona) }, { role: 'user', content }],
      }),
    });
    if (!res.ok) throw new HttpError(502, `Üst akış ${res.status}.`);
    const data = await res.json();
    const choice = data.choices?.[0] ?? {};
    const message = choice.message ?? {};
    if (message.refusal) throw new HttpError(502, 'Model bu isteği reddetti.');
    const cut = choice.finish_reason === 'length';
    const text = String(message.content ?? '').trim();
    if (!text) throw new HttpError(502, 'Boş cevap.');
    return { text: cut ? trimToSentence(text) : text, cut };
  } catch (err) {
    if (err instanceof HttpError) throw err;
    throw new HttpError(502, err.name === 'AbortError' ? 'Üst akış zaman aşımı.' : 'Üst akışa ulaşılamadı.');
  } finally {
    clearTimeout(timer);
  }
}

async function reading(request, env) {
  const payload = validate(await readBody(request));
  const day = new Date().toISOString().slice(0, 10);
  await rateLimit(env.CACHE, request.headers.get('CF-Connecting-IP') ?? 'yok', day);
  const cacheable = CACHE_ENABLED;
  const cacheKey = cacheable ? `${payload.kind}:${payload.target}:${payload.followup}:${payload.persona}:${await sha256(JSON.stringify([payload.chart, payload.focus]))}:${payload.period}` : null;
  if (cacheKey) {
    const hit = await env.CACHE.get(cacheKey);
    if (hit) return { text: hit, cached: true, kind: payload.kind, target: payload.target };
  }
  const { text, cut } = await callUpstream(env, payload.kind, payload.target, payload.persona, userMessage(payload));
  if (cacheKey && !cut) await env.CACHE.put(cacheKey, text, { expirationTtl: CACHE_TTL_SEC[payload.kind] });
  return { text, cached: false, kind: payload.kind, target: payload.target };
}

async function handle(request, env) {
  const origin = allowedOrigin(request, env);
  if (!origin) return json({ error: 'Origin izinli değil.' }, 403, {});
  const cors = corsHeaders(origin);
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method !== 'POST' || new URL(request.url).pathname !== PATH) return json({ error: 'Yok.' }, 404, cors);
  if (!env.OPENAI_API_KEY || !env.CACHE) return json({ error: 'Worker kapalı.' }, 503, cors); // key ya da KV bağlaması eksik
  try {
    return json(await reading(request, env), 200, cors);
  } catch (err) {
    if (!(err instanceof HttpError)) console.error('yorumcu:', err.name, err.message); // gövde asla loglanmaz
    const status = err instanceof HttpError ? err.status : 500;
    const extra = status === 429 ? { 'Retry-After': '3600' } : {};
    return json({ error: err instanceof HttpError ? err.message : 'Bir şey ters gitti.' }, status, { ...cors, ...extra });
  }
}

export default { fetch: handle };
