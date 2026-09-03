# Yıldızname Worker

Küçük bir Cloudflare Worker: tarayıcı → Worker → OpenAI Chat Completions. Key yalnızca Worker secret'ında durur;
tarayıcıya ve repoya hiç girmez. Gövde loglanmaz. Ayrıntı: `docs/LLM.md`.

## Kurulum yolu 1: tarayıcıdan, kurulumsuz (önerilen)

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker** → ad `yildizname` → **Deploy** (örnek kodla).
2. Açılan sayfada **Edit code**: editördeki her şeyi sil, `worker/dist/worker.js` dosyasının tamamını yapıştır → **Deploy**.
3. **Settings → Variables and Secrets**:
   - `ALLOWED_ORIGINS` (tür: Text) = `https://morello11.github.io,http://localhost:8080`
   - `OPENAI_API_KEY` (tür: **Secret**) = yeni OpenAI key'i
4. **Storage & Databases → KV** → **Create** → ad `CACHE`. Sonra Worker'ın **Settings → Bindings → Add → KV namespace**:
   Variable name `CACHE`, namespace `CACHE` → Deploy.
5. Worker adresi Overview'da yazar: `https://yildizname.<hesap>.workers.dev`. Bunu `src/config.js` içindeki `LLM.workerUrl` alanına
   yaz (Claude Code'a söylemen yeter).

`worker/src/` değişince `node scripts/bundle-worker.js` ile `dist/worker.js` yeniden üretilir ve yapıştırma tekrarlanır.

## Kurulum yolu 2: wrangler ile (PC'ye repo klonu gerekir)

1. **Cloudflare hesabı** (ücretsiz plan yeter): https://dash.cloudflare.com/sign-up
2. **OpenAI Platform hesabı**, küçük kredi (örn. 5 $), bir API key: https://platform.openai.com/api-keys — key'i kimseye,
   sohbete, repoya yapıştırma; yalnızca aşağıdaki `wrangler secret put` ile gir. Bir yere yapıştırdıysan o key'i iptal et,
   yenisini oluştur.
3. Bilgisayarda (Node 18+ kurulu olmalı):

```
npm i -g wrangler
wrangler login
cd worker
wrangler kv namespace create CACHE        # dönen id'yi wrangler.toml'daki KV_ID_BURAYA yerine yaz
wrangler secret put OPENAI_API_KEY        # sorunca key'i yapıştır
wrangler deploy                           # sonunda Worker URL'sini basar: https://yildizname.<hesap>.workers.dev
```

4. Worker URL'sini `src/config.js` içinde `LLM.workerUrl` alanına yaz, commit'le. Başka ayar yok; mühürler çalışır.

`wrangler.toml` içindeki `ALLOWED_ORIGINS` GitHub Pages adresinle eşleşmeli (`https://<kullanıcı>.github.io`).

## Sözleşme

`POST /v1/reading`, gövde `{ kind: "comment"|"weekly", target, followup?, chart: {...özet...}, focus: {...}, date, persona?, lang }`.
`target`: `chart` `placement` `aspect` `today` `transit` `plan` `pair` `pairaspect`; `followup`: `harder` `example` `howto`.
`persona` beş sesten biri (`polyanna`, `ya_olmazsa`, `sert`, `nurten`, `muneccim`); yoksa `sert`.
Cevap `{ text, cached, kind, target }`. Hatalar: 403 origin, 400 gövde/hedef, 413 boyut, 429 limit (IP/gün 60, global/gün 800),
502 üst akış, 503 key ya da KV bağlaması yok. KV cache `worker/src/config.js` `CACHE_ENABLED` ile açılır (test döneminde kapalı;
uygulama tarafındaki `src/config.js` `LLM.cacheResults` ile birlikte açılır).

## İşletme

- **Kill switch:** Cloudflare'da `OPENAI_API_KEY` secret'ını sil (ya da OpenAI'da key'i kapat); Worker 503 döner, uygulama
  bankayla çalışmaya devam eder. PIN yok; koruma Origin allowlist + günlük tavanlar.
- **Canlı log:** `wrangler tail` (gövde yazılmaz; yalnızca durum kodları).
- **Modeller:** `src/config.js` içindeki `MODELS` (`comment`, `weekly`) ve hedef başına `MAX_TOKENS`. Adları
  https://platform.openai.com/docs/models sayfasından güncelleyebilirsin; fiyat https://openai.com/api/pricing
- **Maliyet (kaba):** tek yorum ≈ 1.2k giriş + 150–400 çıkış token; birkaç kişilik ekipte ayda birkaç dolar.
- **Yerelde deneme (key'siz):** kök dizinde `node scripts/worker-local.js` → sahte üst akışla 8787 portunda; `LLM.workerUrl`
  geçici olarak `http://localhost:8787` yapılır.
