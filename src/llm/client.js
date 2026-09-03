// Worker istemcisi: zaman aşımı, hata → neden kodu. Asla fırlatmaz; UI bankaya düşer. PIN yok (Origin + günlük tavan Worker'da).
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

// kind: 'comment' | 'weekly'; chart: özet; focus: hedef verisi; date: gün ya da hafta anahtarı.
export async function askWorker(kind, chart, { target = '', focus = {}, followup = '', date = '', persona = LLM.defaultVoice, fetchImpl = globalThis.fetch, timeoutMs = LLM.timeoutMs, url = LLM.workerUrl } = {}) {
  if (!workerConfigured(url)) return fail('no_url');
  const body = JSON.stringify({ kind, target, followup, chart, focus, date, persona, lang: 'tr' });
  if (new TextEncoder().encode(body).length > LLM.bodyMax) return fail('too_big');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchImpl(`${url.replace(/\/$/, '')}${LLM.path}`, {
      method: 'POST', body, signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
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
