// Worker istemcisi: zaman aşımı, PIN başlığı, hata → neden kodu. Asla fırlatmaz; UI bankaya düşer.
import { LLM } from '../config.js';

const fail = (reason) => ({ ok: false, reason });

export function workerConfigured(url = LLM.workerUrl) {
  return typeof url === 'string' && /^https?:\/\//.test(url);
}

function reasonFor(status) {
  if (status === 401) return 'unauthorized';
  if (status === 429) return 'limited';
  if (status === 503) return 'offline';
  return 'error';
}

// kind: 'daily' | 'ask' | 'weekly'; summary: src/llm/summary.js çıktısı; date: gün ya da hafta anahtarı.
export async function askWorker(kind, summary, { pin, question = '', date = '', fetchImpl = globalThis.fetch, timeoutMs = LLM.timeoutMs, url = LLM.workerUrl } = {}) {
  if (!workerConfigured(url)) return fail('no_url');
  if (!pin) return fail('no_pin');
  const body = JSON.stringify({ kind, chart: summary, question, date, lang: 'tr' });
  if (new TextEncoder().encode(body).length > LLM.bodyMax) return fail('too_big');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${url.replace(/\/$/, '')}${LLM.path}`, {
      method: 'POST', body, signal: controller.signal,
      headers: { 'Content-Type': 'application/json', 'X-App-Pin': pin },
    });
    if (!res.ok) return fail(reasonFor(res.status));
    const data = await res.json();
    if (typeof data.text !== 'string' || !data.text) return fail('error');
    return { ok: true, text: data.text, cached: Boolean(data.cached) };
  } catch {
    return fail('offline');
  } finally {
    clearTimeout(timer);
  }
}
