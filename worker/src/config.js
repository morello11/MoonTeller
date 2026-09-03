// Worker ayarları (docs/LLM.md). Key ve PIN burada değil: wrangler secret (OPENAI_API_KEY, APP_PIN).
export const PATH = '/v1/reading';
export const KINDS = ['daily', 'ask', 'weekly'];
// Sağlayıcı: OpenAI Chat Completions (Mehmet'in mevcut hesabı). Model adları platform.openai.com/docs/models'tan güncellenebilir;
// küçük model günlük sentez ve bülten için, büyük model soru için.
export const MODELS = { daily: 'gpt-4o-mini', weekly: 'gpt-4o-mini', ask: 'gpt-4o' };
export const UPSTREAM = { url: 'https://api.openai.com/v1/chat/completions', maxTokens: 400, timeoutMs: 20000 };
export const LIMITS = { bodyBytes: 8192, questionChars: 500, perIpPerDay: 60, globalPerDay: 800, counterTtlSec: 2 * 86400 };
export const CACHE_TTL_SEC = { daily: 36 * 3600, weekly: 8 * 86400 }; // ask cache'siz
export const PERIOD_RE = /^(\d{4}-\d{2}-\d{2}|\d{4}-W\d{2})$/;
// Sesler: uygulamadaki data/tr/voices.json ile aynı anahtarlar (test eşitliği kontrol eder).
export const PERSONAS = ['polyanna', 'ya_olmazsa', 'sert', 'nurten', 'muneccim'];
export const DEFAULT_PERSONA = 'sert';
