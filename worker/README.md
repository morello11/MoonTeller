# Yıldızname Worker

Tek dosyalık Cloudflare Worker: tarayıcı → Worker → Anthropic Messages API. Key yalnızca Worker secret'ında durur;
tarayıcıya ve repoya hiç girmez. Gövde loglanmaz. Ayrıntı: `docs/LLM.md`.

## Bir kez kurulum (Mehmet)

1. **Cloudflare hesabı** (ücretsiz plan yeter): https://dash.cloudflare.com/sign-up
2. **Claude Console hesabı**, küçük kredi (örn. 5 $), bir API key: https://platform.claude.com — key'i kimseye, sohbete,
   repoya yapıştırma; yalnızca aşağıdaki `wrangler secret put` ile gir.
3. Bilgisayarda (Node 18+ kurulu olmalı):

```
npm i -g wrangler
wrangler login
cd worker
wrangler kv namespace create CACHE        # dönen id'yi wrangler.toml'daki KV_ID_BURAYA yerine yaz
wrangler secret put ANTHROPIC_API_KEY     # sorunca key'i yapıştır
wrangler secret put APP_PIN               # ekibin ortak PIN'i (4–8 hane), sorunca yaz
wrangler deploy                           # sonunda Worker URL'sini basar: https://yildizname.<hesap>.workers.dev
```

4. Worker URL'sini `src/config.js` içinde `LLM.workerUrl` alanına yaz, commit'le. Ekipteki herkes Ayarlar sekmesinden PIN'i
   bir kez girer.

`wrangler.toml` içindeki `ALLOWED_ORIGINS` GitHub Pages adresinle eşleşmeli (`https://<kullanıcı>.github.io`).

## Sözleşme

`POST /v1/reading`, başlık `X-App-Pin`, gövde `{ kind: "daily"|"ask"|"weekly", chart: {...özet...}, question?, date, lang }`.
Cevap `{ text, cached, kind }`. Hatalar: 401 PIN, 403 origin, 400 gövde, 413 boyut, 429 limit (IP/gün 60, global/gün 800),
502 üst akış, 503 key yok. `daily` ve `weekly` KV'de cache'lenir (36 saat / 8 gün); `ask` cache'siz.

## İşletme

- **Kill switch:** `wrangler secret put APP_PIN` ile PIN'i değiştir; eski PIN'le gelen her şey 401 olur.
- **Canlı log:** `wrangler tail` (gövde yazılmaz; yalnızca durum kodları).
- **Maliyet:** Haiku 4.5 günlük sentez ≈ 0,0025 $/istek; Sor (Sonnet 5) ≈ 0,01 $/soru. 20 kişi × 30 gün ≈ 1,5 $/ay.
  Güncel fiyat: https://platform.claude.com/docs/en/about-claude/pricing
- **Yerelde deneme (key'siz):** kök dizinde `node scripts/worker-local.js` → sahte üst akışla 8787 portunda; `LLM.workerUrl`
  geçici olarak `http://localhost:8787` yapılır.
