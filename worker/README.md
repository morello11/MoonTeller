# Yıldızname Worker

Küçük bir Cloudflare Worker: tarayıcı → Worker → OpenAI Chat Completions. Key yalnızca Worker secret'ında durur;
tarayıcıya ve repoya hiç girmez. Gövde loglanmaz. Ayrıntı: `docs/LLM.md`.

## Kurulum yolu 1: tarayıcıdan, kurulumsuz (önerilen)

1. https://dash.cloudflare.com → **Workers & Pages** → **Create** → **Create Worker** → ad `yildizname` → **Deploy** (örnek kodla).
2. Açılan sayfada **Edit code**: editördeki her şeyi sil, `worker/dist/worker.js` dosyasının tamamını yapıştır → **Deploy**.
3. **Settings → Variables and Secrets**:
   - `ALLOWED_ORIGINS` (tür: Text) = `https://morello11.github.io,http://localhost:8080`
   - `OPENAI_API_KEY` (tür: **Secret**) = yeni OpenAI key'i
   - `APP_PIN` (tür: **Secret**) = ekibin ortak PIN'i
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
wrangler secret put APP_PIN               # ekibin ortak PIN'i (4–8 hane), sorunca yaz
wrangler deploy                           # sonunda Worker URL'sini basar: https://yildizname.<hesap>.workers.dev
```

4. Worker URL'sini `src/config.js` içinde `LLM.workerUrl` alanına yaz, commit'le. Ekipteki herkes Ayarlar sekmesinden PIN'i
   bir kez girer.

`wrangler.toml` içindeki `ALLOWED_ORIGINS` GitHub Pages adresinle eşleşmeli (`https://<kullanıcı>.github.io`).

## Sözleşme

`POST /v1/reading`, başlık `X-App-Pin`, gövde `{ kind: "daily"|"ask"|"weekly", chart: {...özet...}, question?, date, persona?, lang }`.
`persona` beş sesten biri (`polyanna`, `ya_olmazsa`, `sert`, `nurten`, `muneccim`); yoksa `sert`.
Cevap `{ text, cached, kind }`. Hatalar: 401 PIN, 403 origin, 400 gövde, 413 boyut, 429 limit (IP/gün 60, global/gün 800),
502 üst akış, 503 key yok. `daily` ve `weekly` KV'de cache'lenir (36 saat / 8 gün); `ask` cache'siz.

## İşletme

- **Kill switch:** `wrangler secret put APP_PIN` ile PIN'i değiştir; eski PIN'le gelen her şey 401 olur.
- **Canlı log:** `wrangler tail` (gövde yazılmaz; yalnızca durum kodları).
- **Modeller:** `src/config.js` içindeki `MODELS`; küçük model (günlük, bülten) ve büyük model (soru). Adları
  https://platform.openai.com/docs/models sayfasından güncelleyebilirsin; fiyat https://openai.com/api/pricing
- **Maliyet (kaba):** günlük sentez küçük modelle istek başına bir sentin altında; soru büyük modelle birkaç sent.
  20 kişi × 30 gün, cache ile ayda birkaç dolar.
- **Yerelde deneme (key'siz):** kök dizinde `node scripts/worker-local.js` → sahte üst akışla 8787 portunda; `LLM.workerUrl`
  geçici olarak `http://localhost:8787` yapılır.
