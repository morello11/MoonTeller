# Yol haritası — adım kapıları

> Kaynak: proje rehberinin 9. bölümü. `CLAUDE.md` bölüm 0–3 her oturumda okunur; bu dosya ilgili adımda okunur.

## 9. Yol haritası — adım kapıları

Her adım: hedef → bitti sayılma şartı → Mehmet'ten gereken. Kapı geçilmeden sonraki adım açılmaz.

**Adım 0 — İskelet ve yayın**
Repo yapısı (bölüm 3), LICENSE, README, `.gitattributes`, `.nojekyll`, `.gitignore`; `vendor/swisseph` kopyası + VENDOR.md;
`scripts/repack-swisseph-data.js` çalıştırılıp sonuç commit'lenir; `src/config.js` (yalnızca bu adımın gerektirdikleri:
`EPHEMERIS_FLAGS`, `HOUSE_SYSTEM:'P'`, `DEFAULT_TZ`, `UNKNOWN_TIME_HOUR:12`, cisim listesi); `src/astro/engine.js` ince
sarmalayıcı (`loadEngine()` tembel ve tek örnek, `computePositions(jdUT, bodies)`, `computeHouses(jdUT, lat, lon)`);
`index.html` + `style.css` (sadece değişken iskeleti) + `src/main.js`: hash router iskeleti, 6 rota "yakında" der,
bir "Motor testi" düğmesi WASM'ı tembel yükler, bugünün Güneş ve Ay boylamını ve `swe.version()`'ı yazar.
`tests/engine.test.js`: bölüm 6'daki regresyon değerleri.
Bu adımda YOK: `time.js`, zaman testleri, altın haritalar, aspekt/Ay/retro, ürün özelliği. Hepsi Adım 1 ve sonrası.
Verilmiş kararlar (yeniden sorulmaz): cisim kümesi 10 gezegen + Gerçek Düğüm + Chiron; Placidus varsayılan;
`.data` seçeneği (b) — `seasnam.txt` atılır; `.se1` kırpma + Moshier deneyi olumluysa o kullanılır.
Bitti: `node --test` yeşil; `git ls-files | xargs du -ch` ile ilk yükleme < 3 MB; headless tarayıcıda konsol hatasız;
**GitHub Pages linki telefonda açılıyor ve Motor testi düğmesi değer yazıyor** (asıl kapı bu, headless yetmez).
Mehmet (telefondan): GitHub'da repo → Settings → Pages → Build and deployment: Source = "Deploy from a branch",
Branch = `main`, klasör `/ (root)` → Save. 1–3 dakika sonra `https://<kullanıcı>.github.io/<repo>/` açılır.
Claude Code linki `README.md`'ye yazar.

**Adım 1 — Motor ve doğrulama**
`time.js` (Intl ile yerel → UT), `aspects.js`, `moon.js`, `time.test.js`, `aspects.test.js`, `moon.test.js`,
`golden-charts.test.js`, `.gitignore`'da `tests/private.local.json`.
Bitti: `node --test` yeşil; 3 harita astro.com toleranslarında; bölüm 6'daki zaman testleri geçti.
Mehmet: astro.com'dan kendi haritasının değerlerini verir (`tests/private.local.json`), 2 uydurma doğum verisi için de çıktı alır.

**Adım 2 — Onboarding ve Haritam**
Profil formu (tarih, saat / "bilmiyorum", il seçici, yurt dışı için enlem-boylam + tz), `store.js`, usturlap çarkı,
Büyük Üçlü kartları, yerleşim tablosu, aspekt ızgarası, Şüpheci Şerhi anahtarı (şimdilik ham veri gösterir), açılış animasyonu.
Bitti: kendi haritan telefonda güzel görünüyor; saat yokken evler gizli ve damga var; profil yenilemede kalıyor.

**Adım 3 — Metin bankası (natal)**
Ton rehberi + 5 örnek → onay → planets-signs, archetypes, aspects, moon, ui-copy; `validate-bank.js`; `compose.js`.
Haritam'da her yerleşimin metni, Kozmik Ekip Rolü kartı.
Bitti: validator sıfır hata; hiçbir yerleşim boş metin göstermiyor; Mehmet 10 rastgele metni okuyup tonu onaylıyor.

**Adım 4 — Bugün**
Transit hesabı + puanlama, günün üç şeyi, Ay evresi/burcu/boşlukta, Merkür Retro Deploy Sayacı, Toplantı Saati Skoru,
transits.json + retro.json, Canlı Gökyüzü.
Bitti: Bugün sekmesi bir günde tutarlı (yenileyince değişmiyor), ertesi gün değişiyor; Ay boşlukta saatleri astro-seek
ile çapraz kontrol edildi.

**Adım 5 — Ofis**
Paylaşım linki (`#p=` base64url profil), QR, içe aktarma; Ofis listesi; Sinastri Matrisi; Kıyasla sayfası;
Bugün Kime Bulaşma; Yıldızname Kartı (PNG); haftanın çifti.
Bitti: iki telefon arasında link ile profil aktarımı çalışıyor; matris 5+ kişide okunabilir; PNG WhatsApp'ta düzgün.

**Adım 6 — Worker ve LLM**
`worker/` (index.js, wrangler.toml, README), `llm/client.js`, Sor sekmesi, Bugün sentezi (ayardan açılır), Pazartesi bülteni.
Bitti: PIN'siz istek 401; limit aşımı 429 ve banka düşüş; Sor cevabı geliyor; Worker kapalıyken uygulama bozulmuyor.
Mehmet: bölüm 8'deki 4 madde.

**Adım 6b — Yorumcu** (Mehmet'in kararı: sohbet kutusu ve PIN kalktı; docs/LLM.md son bölüm)
Mühürler ve birincil barlar (Haritam, Bugün, Plan, Kıyasla), takvim yaprağı, seçim sayfası, Yorumcu sekmesi, Ayarlar tek satır;
Worker sözleşmesi `comment` + hedef + odak; `sor.js` kalkar.
Bitti: her hedef yerel Worker'la yaprak açıyor; ses değişince açık yapraklar yeniden yazılıyor; 429 "sınır", Worker kapalı
"meşgul" ve sayfalar bozulmuyor; Worker ayarsızken mühür yok; Mehmet telefonda Haritam ve Bugün'de yorumlatıp onaylıyor.

**Adım 7 — Cila**
PWA (manifest, ikon, ana ekrana ekle), performans (WASM önbellek, natal cache), erişilebilirlik turu, boş/hata durumları,
README, sürüm etiketi v1.0.
Bitti: telefonda "ana ekrana ekle" çalışıyor; ilk açılış < 3 s (4G); Lighthouse erişilebilirlik ≥ 90.
