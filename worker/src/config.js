// Worker ayarları (docs/LLM.md). Key ve PIN burada değil: wrangler secret (OPENAI_API_KEY, APP_PIN).
export const PATH = '/v1/reading';
export const KINDS = ['daily', 'ask', 'weekly'];
// Sağlayıcı: OpenAI Chat Completions (Mehmet'in mevcut hesabı). Küçük model (Luna) günlük sentez ve bülten için,
// orta model (Terra) soru için. Kimlikleri platform.openai.com/docs/models sayfasındaki model ID ile doğrula; farklıysa burada değiştir.
export const MODELS = { daily: 'gpt-5.6-luna', weekly: 'gpt-5.6-luna', ask: 'gpt-5.6-terra' };
export const UPSTREAM = { url: 'https://api.openai.com/v1/chat/completions', maxTokens: 400, timeoutMs: 20000 };
export const LIMITS = { bodyBytes: 8192, questionChars: 500, perIpPerDay: 60, globalPerDay: 800, counterTtlSec: 2 * 86400 };
export const CACHE_TTL_SEC = { daily: 36 * 3600, weekly: 8 * 86400 }; // ask cache'siz
// Test döneminde kapalı: her istek yeni cevap üretir. Ekip büyüyünce true yap (maliyet ve tekrar için).
export const CACHE_ENABLED = false;
export const PERIOD_RE = /^(\d{4}-\d{2}-\d{2}|\d{4}-W\d{2})$/;
// Sesler: uygulamadaki data/tr/voices.json ile aynı anahtarlar (test eşitliği kontrol eder).
export const PERSONAS = ['polyanna', 'ya_olmazsa', 'sert', 'nurten', 'muneccim'];
export const DEFAULT_PERSONA = 'sert';
