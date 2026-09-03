// Worker ayarları (docs/LLM.md). Key ve PIN burada değil: wrangler secret (ANTHROPIC_API_KEY, APP_PIN).
export const PATH = '/v1/reading';
export const KINDS = ['daily', 'ask', 'weekly'];
export const MODELS = { daily: 'claude-haiku-4-5', weekly: 'claude-haiku-4-5', ask: 'claude-sonnet-5' };
export const UPSTREAM = { url: 'https://api.anthropic.com/v1/messages', version: '2023-06-01', maxTokens: 400, timeoutMs: 20000 };
export const LIMITS = { bodyBytes: 8192, questionChars: 500, perIpPerDay: 60, globalPerDay: 800, counterTtlSec: 2 * 86400 };
export const CACHE_TTL_SEC = { daily: 36 * 3600, weekly: 8 * 86400 }; // ask cache'siz
export const PERIOD_RE = /^(\d{4}-\d{2}-\d{2}|\d{4}-W\d{2})$/;
