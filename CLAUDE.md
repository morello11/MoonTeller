# Yıldızname — Claude Code proje rehberi

> Ofis arkadaşlarıyla geyik için, GitHub Pages'te çalışan, Co-Star tarzı ama daha zengin
> ve daha dürüst bir astroloji uygulaması. Sahibi: Mehmet. Arayüz ve metinler Türkçe, kod İngilizce.
> "Yıldızname" Osmanlı'daki yıldız-fal kitaplarının adı; çalışma adı, sonradan değişebilir.

---

## 0. Claude Code — her oturumda

1. Bu dosyanın tamamını oku. Sonra "Şu an" satırındaki adımın ilgili `docs/` dosyasını oku.
2. Her adımın planını plan modunda çıkar (dosya listesi, komutlar, Mehmet'ten istediklerin). Onay almadan kod yazma.
3. Her adım bitince dur: "Adım N bitti, kontrol et" de. Mehmet adım adım ilerlemek istiyor; sonraki adımın işini öne yığma,
   "bu arada şunu da yaptım" yok.
4. Emin olmadığın API imzasını tahmin etme; `vendor/swisseph/QUICK_REFERENCE.md` ve `DOCUMENTATION.md`'ye bak.
5. Adım bitince buradaki "Şu an" satırını güncelle.

## 1. Değişmez kurallar

- Sadelik > zekilik. Framework yok, bundler yok, build adımı yok. Vanilla JS (ES modules), tek `index.html`, tek `style.css`.
  GitHub Pages `main` dalını olduğu gibi yayınlar.
- `src/astro/` ve `src/text/` saf mantık: DOM yok, `window` yok, `fetch` yok. Node ile test edilebilir olmalı
  (ileride Worker tarafında da aynen çalışsın).
- Sihirli sayı yok: orb'lar, ağırlıklar, ev sistemi, ton seviyesi, limitler, cache süreleri hep `src/config.js`'de.
- Dosya 300 satırı geçiyorsa böl. Fonksiyon 40 satırı geçiyorsa böl.
- Repo herkese açık olacak. Repo'ya kişisel veri (doğum tarihi/saati/yeri, isim) ve API key girmek yasak.
  Profiller tarayıcıda (localStorage), paylaşım linkle, key yalnızca Cloudflare Worker secret'ında.
- Deterministik çıktı: aynı kişi + aynı gün = aynı metin. Seed = hash(profileId + yerel tarih).
- Bilinmeyen doğum saati desteklenir: evler ve Yükselen gizlenir, hesapta 12:00 varsayılır, ekranda "saat bilinmiyor" damgası.
- Ürün astrolojiye inandırmaya çalışmaz; eğlenceli ve dürüsttür. Her yorumun altında gerçek gökyüzü verisi açılabilir (Şüpheci Şerhi).
- Sağlık, para, aile, ilişki krizi konularında tavsiye verilmez; metin bankası ve LLM prompt'ları bunu yasaklar.
- Commit mesajı Türkçe ve kısa: `Adım 2: harita çarkı SVG`.

## 2. Teknik yığın

| Katman | Seçim | Not |
|---|---|---|
| Efemeris | Swiss Ephemeris WASM — `prolaxu/swisseph-wasm` | GPL; açık kaynak hobi projesinde serbest. `/vendor/swisseph/` altına kopyalanır, sürüm sabitlenir (v0.0.4). CDN `@main` import'u yasak (kırılır). |
| Motor API | `new SwissEph()` → `await swe.initSwissEph()` → `swe.julday(y,m,d,utHours)` → `swe.calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH \| swe.SEFLG_SPEED)` | Dönüş `Float64Array[lon, lat, dist, lonSpeed, latSpeed, distSpeed]`. Evler: `swe.houses(jd, lat, lon, 'P')` → `{ cusps: Float64Array(13) (1..12 kullanılır), ascmc: Float64Array(10) (0=ASC, 1=MC) }`. Efemeris dosyası gömülü değilse `SEFLG_MOSEPH` (Moshier) kullan; fark bizim için önemsiz. |
| Zaman | Tarayıcı `Intl` API, IANA `Europe/Istanbul` | 2016 öncesi yaz saati dahil tarihsel kurallar. Kütüphane ekleme. Yurt dışı doğum için IANA seçici. |
| Yerler | `data/cities-tr.json` (81 il, enlem/boylam) | Elle enlem/boylam girişi de var. İlçe v2. |
| Grafik | Harita çarkı elle çizilmiş SVG; paylaşım kartı Canvas → PNG | Grafik kütüphanesi yok. |
| Depolama | `localStorage`: `yn:profiles`, `yn:settings`, `yn:cache` | Repo'da veri yok. |
| Sunucu | Yok. Tek istisna: Cloudflare Worker (LLM proxy + cache), Adım 6 | Ücretsiz plan yeter. |
| Test | `node --test` (kök `package.json` sadece `type: module` ve `test` scripti için; Node 22 dizin argümanını kabul etmiyor) | Ek test kütüphanesi yok. |
| Yayın | GitHub Pages, `main` dalı, kök dizin | Özel alan adı v2. |

Boyut hedefi: ilk yükleme (WASM dahil) < 3 MB (Adım 0 sonunda ≈ 1 MB: gezegen/Ay efemeris dosyaları atıldı, Moshier kullanılıyor); WASM tembel (lazy) yüklenir, tarayıcı cache'ler; natal hesap bir kez yapılıp saklanır.

## 3. Repo yapısı

```
yildizname/
  index.html            tek sayfa, hash router (#/haritam, #/bugun, #/ofis, #/kiyasla, #/sor, #/ayarlar)
  style.css             tek dosya, CSS değişkenleri docs/DESIGN.md'den
  CLAUDE.md
  README.md             kısa: ne, nasıl açılır, lisans
  package.json          sadece type: module + test scripti; bağımlılık yok, build yok
  LICENSE               GPL-3.0 (Swiss Ephemeris uyumu için zorunlu)
  docs/                 VISION, DESIGN, ENGINE, TEXTBANK, LLM, ROADMAP, REVIEW
  src/
    main.js             başlangıç, router, sayfa yükleme
    config.js           tüm ayarlanabilir sayılar
    store.js            localStorage okuma/yazma, profil şeması, migration
    astro/              (saf mantık, DOM yok)
      engine.js         SwissEph sarmalayıcı: gezegenler, evler, açılar, retro bayrağı
      time.js           yerel → UTC (Intl), Julian Day yardımcıları
      aspects.js        aspekt tespiti (natal / transit / sinastri orb tabloları)
      scoring.js        transit sıralaması, sinastri skoru, toplantı skoru
      moon.js           Ay evresi, Ay burcu, Ay boşlukta (void of course)
      retrograde.js     Merkür (ve diğer) retro aralıkları
      archetype.js      haritadan ofis arketipi seçimi
    text/               (saf mantık)
      bank.js           JSON bankasını yükler, seed'li varyant seçer, tekrarları önler
      compose.js        yerleşim + aspekt listesinden okunur metin kurar
    ui/
      wheel.js          SVG harita çarkı (uygulamanın kahramanı)
      components.js     küçük ortak parçalar (sekme çubuğu, damga, şerh kutusu)
      share.js          link üretimi (#p=...), QR, PNG kart
      pages/            onboarding.js haritam.js bugun.js ofis.js kiyasla.js sor.js ayarlar.js
    llm/
      client.js         Worker'a istek, zaman aşımı, bank'a düşüş
  data/
    tr/                 planets-signs.json planets-houses.json aspects.json transits.json
                        moon.json archetypes.json retro.json ui-copy.json
    cities-tr.json
  vendor/
    swisseph/           sabitlenmiş kopya (src/, wsam/, QUICK_REFERENCE.md, DOCUMENTATION.md, LICENSE)
  scripts/
    validate-bank.js    metin bankası bütünlük kontrolü
  tests/
    time.test.js  engine.test.js  aspects.test.js  moon.test.js  golden-charts.test.js
  worker/
    src/index.js  wrangler.toml  README.md   (Adım 6'da oluşturulur)
  assets/
    icons/  manifest.json
```

Not: paketin WASM klasörünün adı upstream'de `wsam/` (yazım hatası ama sarmalayıcı `../wsam/` yolunu sabit kodluyor);
klasör adı olduğu gibi korunur.

---

## Şu an: Adım 0 bitti; bitti şartı Mehmet'te (GitHub Pages linki telefonda açılıyor)

Adımın tanımı `docs/ROADMAP.md`'de. Docs dosyaları (her adımda ilgilisini oku):

| Dosya | İçerik | Kaynak bölüm |
|---|---|---|
| `docs/VISION.md` | ürün vizyonu, sayfalar, ton | 4 |
| `docs/DESIGN.md` | görsel dil, CSS değişkenleri, çark | 5 |
| `docs/ENGINE.md` | astroloji motoru, hesap kuralları | 6 |
| `docs/TEXTBANK.md` | metin bankası şeması ve kuralları | 7 |
| `docs/LLM.md` | Worker, prompt'lar, güvenlik | 8 |
| `docs/ROADMAP.md` | adımlar ve tanımı-bitti ölçütleri | 9 |
| `docs/REVIEW.md` | gözden geçirme ve kalite listesi | 10–11 |
