// Worker ayarları (docs/LLM.md). Key burada değil: wrangler secret OPENAI_API_KEY. PIN yok (Adım 6b kararı).
export const PATH = '/v1/reading';
export const KINDS = ['comment', 'weekly'];
// Yorumlanabilir hedefler: uygulama hesaplar, model anlatır. Anahtarlar src/config.js LLM.targets ile aynı.
export const TARGETS = ['chart', 'placement', 'aspect', 'today', 'transit', 'plan', 'pair', 'pairaspect'];
// Hazır devamlar (serbest soru yok). src/config.js LLM.followups ile aynı.
export const FOLLOWUPS = ['harder', 'example', 'howto'];
// Sağlayıcı: OpenAI Chat Completions. Küçük model her iş için yeter; ID'yi platform.openai.com/docs/models'tan doğrula.
export const MODELS = { comment: 'gpt-5.6-luna', weekly: 'gpt-5.6-luna' };
// reasoningEffort: düşünen modellerde (gpt-5.x) düşünme payını kısar; hız ve maliyet. Model parametreyi reddederse (400) Worker onsuz
// bir kez daha dener. Düşünmeyen model kullanılırsa null yap.
export const UPSTREAM = { url: 'https://api.openai.com/v1/chat/completions', timeoutMs: 20000, reasoningEffort: 'low' };
// Çıktı tavanı hedefe göre. max_completion_tokens düşünme tokenlarını da kapsar: metin bütçesi (Türkçe ≈ 2,5 karakter/token,
// 80 kelime ≈ 250 token) + düşünme payı. Tavan düşük kalırsa içerik boş gelir ("Cevap tavana takıldı."). Metin uzunluğunu prompt'taki
// kelime bütçesi belirler; tavana takılırsa son cümlede kesilir (index.js trimToSentence).
export const MAX_TOKENS = { placement: 1200, aspect: 1200, transit: 1200, plan: 1200, pairaspect: 1200, chart: 1600, today: 1600, pair: 1600, weekly: 2000 };
export const LIMITS = { bodyBytes: 8192, focusBytes: 2048, perIpPerDay: 60, globalPerDay: 800, counterTtlSec: 2 * 86400 };
export const CACHE_TTL_SEC = { comment: 36 * 3600, weekly: 8 * 86400 };
// Test döneminde kapalı: her istek yeni cevap üretir. Ekip büyüyünce true yap (maliyet ve tekrar için).
export const CACHE_ENABLED = false;
export const PERIOD_RE = /^(\d{4}-\d{2}-\d{2}|\d{4}-W\d{2})$/;
// Sesler: uygulamadaki data/tr/voices.json ile aynı anahtarlar (test eşitliği kontrol eder).
export const PERSONAS = ['polyanna', 'ya_olmazsa', 'sert', 'nurten', 'muneccim'];
export const DEFAULT_PERSONA = 'sert';
