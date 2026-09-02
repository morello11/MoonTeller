# LLM ve Worker

> Kaynak: proje rehberinin 8. bölümü. `CLAUDE.md` bölüm 0–3 her oturumda okunur; bu dosya ilgili adımda okunur.

## 8. LLM ve Worker

### İş bölümü
Deterministik olan her şey tarayıcıda hesaplanır: yerleşimler, aspektler, skorlar, Ay, retro. LLM yalnızca dil üretir;
**LLM'e sayı hesaplattırılmaz, gezegen konumu sorulmaz.** LLM'in üç işi:
- **Sor**: kullanıcının sorusu + harita özeti → 120–200 kelimelik cevap (cache yok).
- **Bugün sentezi** (isteğe bağlı): günün 3 transiti + Ay → tek paragraf (kişi + gün başına cache).
- **Pazartesi bülteni**: haftanın transitleri + ofis listesi özeti → bülten (kişi + hafta başına cache).
Worker yoksa ya da hata verirse uygulama tam çalışır: metin bankası devreye girer, Sor sekmesi "şu an kapalı" der.

### Neden Worker
Tarayıcıdan doğrudan API çağrısı teknik olarak mümkün ama key herkese açılır; repo da açık. Bu yüzden key yalnızca
Cloudflare Worker secret'ında durur, tarayıcı Worker'a konuşur. Worker = tek dosya, ücretsiz plan, "sunucu kurulumu" bundan ibaret.

### Mehmet'in yapacakları (bir kez, Adım 6'da; Claude Code adım adım yönlendirir)
1. Cloudflare hesabı aç (ücretsiz plan).
2. Claude Platform (Console) hesabı aç, küçük bir kredi yükle (örn. 5 $), bir API key oluştur.
   Güncel bilgi: https://platform.claude.com/docs/en/api/overview
3. Bilgisayarda: `npm i -g wrangler` → `wrangler login` → `cd worker` →
   `wrangler kv namespace create CACHE` (dönen id `wrangler.toml`'a) →
   `wrangler secret put ANTHROPIC_API_KEY` → `wrangler secret put APP_PIN` (ofisin ortak PIN'i) → `wrangler deploy`.
4. Dönen Worker URL'sini `src/config.js`'e (`llm.workerUrl`) yaz. PIN'i Ayarlar sekmesinden bir kez girer herkes.
Key'i Claude Code'a, sohbete, repo'ya asla yapıştırma; sadece `wrangler secret put` ile gir.

### Worker sözleşmesi (`worker/src/index.js`)
- `POST /v1/reading` gövde: `{ kind:"daily"|"ask"|"weekly", chart:{...}, question?, date, lang:"tr" }`
  `chart` yalnızca yerleşim özetidir (burç, ev, aspekt listesi, Ay evresi). **Doğum tarihi/saati/yeri Worker'a gitmez.**
- Kontroller: `Origin` allowlist (GitHub Pages adresi + localhost), `X-App-Pin` === `APP_PIN`, gövde ≤ 8 KB,
  soru ≤ 500 karakter, IP başına günlük 60 istek (KV sayaç), global günlük tavan 800 (KV) — dolunca 429, istemci bankaya düşer.
- Cache (KV): `daily:{chartHash}:{YYYY-MM-DD}` TTL 36 saat; `weekly:{chartHash}:{ISO hafta}` TTL 8 gün; `ask` cache'siz.
- Modeller (`config`): daily/weekly → `claude-haiku-4-5`; ask → `claude-sonnet-5`. 20 saniye zaman aşımı.
- Üst akış: `POST https://api.anthropic.com/v1/messages`, başlıklar `x-api-key`, `anthropic-version: 2023-06-01`,
  `content-type: application/json`; gövde `{ model, max_tokens: 400, system, messages:[{role:"user", content}] }`;
  cevap `content[0].text`. Başlık/sürüm değişmiş olabilir; deploy'dan önce dokümandan doğrula.
- System prompt sunucuda sabittir; istemci sadece veri yollar, talimat yollayamaz. Hiçbir gövde loglanmaz.
- Kill switch: `APP_PIN`'i değiştirmek her şeyi anında kapatır.

### Prompt iskeleti (system, Türkçe)
"Sen Yıldızname'nin sesisin: ofis arkadaşı gibi konuşan, kısa, sivri ama nazik bir astroloji yorumcusu.
Sana verilen yerleşim ve aspekt listesini yorumla; hesap yapma, listede olmayan bir gezegen konumu uydurma.
Sağlık, para, aile, ayrılık tavsiyesi verme. Klişe yasak: [liste]. 120–200 kelime, düz metin, başlık yok, madde yok.
Sonunda astrolojinin bilimsel bir yöntem olmadığını hatırlatan tek kısa cümle ekle, vaaz verme."

### Maliyet (kaba)
Haiku 4.5: 1 $/M giriş, 5 $/M çıkış. Günlük sentez ≈ 1.2k giriş + 250 çıkış ≈ 0.0025 $; 20 kişi × 30 gün ≈ 1.5 $/ay,
cache ile daha az. Sor (Sonnet 5) ≈ soru başına ~0.01 $. Fiyatlar değişir: https://platform.claude.com/docs/en/about-claude/pricing
