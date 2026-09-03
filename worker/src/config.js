// Worker ayarları (docs/LLM.md). Key burada değil: wrangler secret OPENAI_API_KEY. PIN yok (Adım 6b kararı).
export const PATH = '/v1/reading';
export const KINDS = ['comment', 'weekly'];
// Yorumlanabilir hedefler: uygulama hesaplar, model anlatır. Anahtarlar src/config.js LLM.targets ile aynı.
export const TARGETS = ['chart', 'placement', 'aspect', 'today', 'transit', 'plan', 'pair', 'pairaspect'];
// Hazır devamlar (serbest soru yok). src/config.js LLM.followups ile aynı.
export const FOLLOWUPS = ['harder', 'example', 'howto'];
// Sağlayıcı: OpenAI Chat Completions. Küçük model her iş için yeter; ID'yi platform.openai.com/docs/models'tan doğrula.
export const MODELS = { comment: 'gpt-5.6-luna', weekly: 'gpt-5.6-luna' };
export const UPSTREAM = { url: 'https://api.openai.com/v1/chat/completions', timeoutMs: 20000 };
// Çıktı tavanı hedefe göre: tek öğe kısa, gruplar orta, bülten uzun (yaklaşık 1 token ≈ 3 Türkçe karakter).
export const MAX_TOKENS = { placement: 260, aspect: 260, transit: 260, plan: 260, pairaspect: 260, chart: 420, today: 420, pair: 420, weekly: 520 };
export const LIMITS = { bodyBytes: 8192, focusBytes: 2048, perIpPerDay: 60, globalPerDay: 800, counterTtlSec: 2 * 86400 };
export const CACHE_TTL_SEC = { comment: 36 * 3600, weekly: 8 * 86400 };
// Test döneminde kapalı: her istek yeni cevap üretir. Ekip büyüyünce true yap (maliyet ve tekrar için).
export const CACHE_ENABLED = false;
export const PERIOD_RE = /^(\d{4}-\d{2}-\d{2}|\d{4}-W\d{2})$/;
// Sesler: uygulamadaki data/tr/voices.json ile aynı anahtarlar (test eşitliği kontrol eder).
export const PERSONAS = ['polyanna', 'ya_olmazsa', 'sert', 'nurten', 'muneccim'];
export const DEFAULT_PERSONA = 'sert';
