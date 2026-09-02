# Yıldızname — Claude Code proje rehberi

> Ofis arkadaşlarıyla geyik için, GitHub Pages'te çalışan, Co-Star tarzı ama daha zengin
> ve daha dürüst bir astroloji uygulaması. Sahibi: Mehmet. Arayüz ve metinler Türkçe, kod İngilizce.
> "Yıldızname" Osmanlı'daki yıldız-fal kitaplarının adı; çalışma adı, sonradan değişebilir.

---

## 0. Claude Code — önce bunu yap

1. Bu dosyanın tamamını oku. **Bütünlük kontrolü:** dosya 11 bölümden oluşur ve en altta "Şu an: Adım 0" satırıyla biter.
   Bölüm 11 ya da o satır yoksa dosya kesik gelmiştir: Mehmet'e söyle, varsayımla plan yapma.
2. Dosya bilerek uzun. İlk işin onu bölmek:
   - Bölüm 0–3 `CLAUDE.md`'de kalır (kısa tutulur, her oturumda okunur).
   - Bölüm 4 → `docs/VISION.md`, 5 → `docs/DESIGN.md`, 6 → `docs/ENGINE.md`, 7 → `docs/TEXTBANK.md`,
     8 → `docs/LLM.md`, 9 → `docs/ROADMAP.md`, 10–11 → `docs/REVIEW.md`.
   - `CLAUDE.md`'nin sonuna "Şu an: Adım 0" satırı ve docs listesini ekle. Her adımda ilgili docs dosyasını oku.
3. Plan modunda Adım 0'ın planını çıkar (dosya listesi, komutlar, Mehmet'ten istediklerin). Onay almadan kod yazma.
4. Her adım bitince dur: "Adım N bitti, kontrol et" de. Mehmet adım adım ilerlemek istiyor; sonraki adımın işini öne yığma,
   "bu arada şunu da yaptım" yok.
5. Emin olmadığın API imzasını tahmin etme; `vendor/swisseph/QUICK_REFERENCE.md` ve `DOCUMENTATION.md`'ye bak.

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
| Efemeris | Swiss Ephemeris WASM — `prolaxu/swisseph-wasm` v0.0.4 (Swiss Ephemeris 2.10.03) | GPL; açık kaynak hobi projesinde serbest. npm tarball'ından `/vendor/swisseph/` altına kopyalanır: `src/swisseph.js` + `wsam/{swisseph.js, swisseph.wasm, swisseph.data}` (klasör adı upstream'de `wsam`, öyle kalır; sarmalayıcı `../wsam/` yolunu sabit kullanır). CDN `@main` import'u yasak. |
| .data paketi | Upstream 12 MB: içindeki `seasnam.txt` (9,9 MB asteroit isim listesi) gereksiz | `scripts/repack-swisseph-data.js` ile `seasnam.txt` atılır, `wsam/swisseph.js` içindeki `files:[{filename,start,end}]` offset tablosu güncellenir (tek seferlik, sonuç commit'lenir, script repoda kalır). Ek deney: `seas_18.se1` (Chiron) hariç `.se1`'ler de atılıp gezegenler Moshier'e düşürülebilirse toplam ≈ 0,9 MB; olmazsa ≈ 2,8 MB ile devam. Loader `.data`'yı koşulsuz yükler; tamamen atılamaz. |
| Motor API (doğrulandı) | `const swe = new SwissEph(); await swe.initSwissEph();` `swe.julday(y,m,d,utHours)`; `swe.calc_ut(jd, swe.SE_MOON, swe.SEFLG_SWIEPH \| swe.SEFLG_SPEED)` → `Float64Array[lon, lat, dist, lonSpeed, ...]`; `swe.houses(jd, lat, lon, 'P')` → `{cusps: Float64Array(13), ascmc: Float64Array(10)}` (`ascmc[0]` ASC, `ascmc[1]` MC); `swe.version()` | Init ≈ 190 ms. Chiron `seas_18.se1` sayesinde çalışır. MOSEPH ile SWIEPH farkı Ay'da 0,00002° — bizim için sıfır. `swe.` çağrıları yalnızca `src/astro/engine.js` içinde yaşar. |
| Zaman | Tarayıcı `Intl` API, IANA `Europe/Istanbul` | 2016 öncesi yaz saati dahil tarihsel kurallar. Kütüphane ekleme. Yurt dışı doğum için IANA seçici. |
| Yerler | `data/cities-tr.json` (81 il, enlem/boylam) | Elle enlem/boylam girişi de var. İlçe v2. |
| Grafik | Harita çarkı elle çizilmiş SVG; paylaşım kartı Canvas → PNG | Grafik kütüphanesi yok. |
| Depolama | `localStorage`: `yn:profiles`, `yn:settings`, `yn:cache` | Repo'da veri yok. |
| Sunucu | Yok. Tek istisna: Cloudflare Worker (LLM proxy + cache), Adım 6 | Ücretsiz plan yeter. |
| Test | `node --test tests/` | Ek test kütüphanesi yok. |
| Yayın | GitHub Pages, `main` dalı, kök dizin | Özel alan adı v2. |

Boyut hedefi: ilk yükleme (WASM dahil) < 3 MB; WASM tembel (lazy) yüklenir, tarayıcı cache'ler; natal hesap bir kez yapılıp saklanır.

## 3. Repo yapısı

```
yildizname/
  index.html            tek sayfa, hash router (#/haritam, #/bugun, #/ofis, #/kiyasla, #/sor, #/ayarlar)
  style.css             tek dosya, CSS değişkenleri docs/DESIGN.md'den
  CLAUDE.md
  README.md             kısa: ne, nasıl açılır, lisans
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
    swisseph/           sabitlenmiş kopya: src/swisseph.js, wsam/{swisseph.js, swisseph.wasm, swisseph.data},
                        QUICK_REFERENCE.md, DOCUMENTATION.md, LICENSE, package.json (sürüm kanıtı),
                        VENDOR.md (kaynak, sürüm, ne değiştirildi — 5 satır). examples/ ve types/ alınmaz.
  scripts/
    repack-swisseph-data.js   .data'yı gereksiz dosyalar olmadan yeniden paketler (tek seferlik)
    validate-bank.js          metin bankası bütünlük kontrolü
  tests/
    engine.test.js  time.test.js  aspects.test.js  moon.test.js  golden-charts.test.js
    private.local.json        Mehmet'in altın haritası — .gitignore'da, repoya girmez
  worker/
    src/index.js  wrangler.toml  README.md   (Adım 6'da oluşturulur)
  assets/
    icons/  manifest.json
  .gitattributes        *.wasm *.data *.se1 binary
  .nojekyll             GitHub Pages dosyaları Jekyll'den geçirmesin
  .gitignore            tests/private.local.json, node_modules/, .DS_Store
```
Boş dosya ya da placeholder oluşturulmaz; bir dosya ancak işi geldiğinde yaratılır.

---

## 4. Ürün vizyonu (→ docs/VISION.md)

### Tek cümle
Ofisin kendi Co-Star'ı: herkesin haritası telefonunda, günün transitleri sabah tek cümle, kim kiminle "kare"
tek bakışta; ve her yorumun altında "aslında gökyüzünde ne oluyor" şerhi.

### Kimin için
10–30 kişilik bir ofis. Kimse uygulama kurmak istemiyor: link + telefon tarayıcısı, 40 saniyede harita.
Bir kişi (Mehmet) yönetir; diğerleri sadece linki açar.

### Pazardan ne alıyoruz, neyi yapmıyoruz
| Uygulama | Alınan iyi yön | Bizde nasıl |
|---|---|---|
| Co-Star | Kısa, sert, arkadaş ağzı bildirimler; arkadaş haritalarını karşılaştırma; gerçek efemeris | Ton rehberi (docs/TEXTBANK.md), Ofis sekmesi, Swiss Ephemeris |
| The Pattern | İlişki dinamiği metinleri, zaman çizelgesi hissi | Sinastri "iş arkadaşı" dilinde; transit zaman çizelgesi v2 |
| Chani | Ay evresi merkezli günlük ritim | "Bugün" sekmesi Ay ile başlar |
| Sanctuary | Canlı astrologa soru sorma | "Sor" sekmesi (LLM, Worker üzerinden) |
| astro.com / TimePassages | Şeffaf veri, ev sistemi seçimi, aspekt ızgarası | Ayarlar'da ev sistemi; Haritam'da yerleşim tablosu + aspekt ızgarası |

Yapmadıklarımız: hesap/üyelik, sunucu veritabanı, bildirim altyapısı, ödeme, sosyal ağ. Bunlar projeyi öldürür.

### 10 özgün özellik (öncelik sırasıyla)
1. **Ofis Sinastri Matrisi** — herkes × herkes uyum ısı haritası. Hücreye dokun → o ikilinin en güçlü 3 aspekti.
2. **Bugün Kime Bulaşma** — o gün transitleri sert olan arkadaşların listesi: "uzak dur / kahve ısmarla / mail atma".
3. **Toplantı Saati Skoru** — tarih-saat gir → elektif skor (Ay boşlukta mı, Merkür retro mu, Ay burcu) → "ertele / yap" hükmü.
4. **Merkür Retro Deploy Sayacı** — bir sonraki retroya geri sayım, retro günleri takvimi, "bugün deploy yapma" bandı.
5. **Kozmik Ekip Rolü** — haritadan ofis arketipi kartı: unvan, amblem, "toplantıdaki hali", "mail üslubu", "kriz refleksi".
6. **Şüpheci Şerhi** — açılınca her yorumun altında: gerçek astronomik veri (derece, hız), "Barnum puanı" (bu cümle kaç burca uyar),
   ve bir satır bilim ("Merkür geri gitmiyor, yörünge perspektifi"). Sahibinin inancı bu; ürünün dürüstlük kası.
7. **Yıldızname Kartı** — paylaşılabilir PNG: çark + Büyük Üçlü + arketip + günün cümlesi. WhatsApp gruba atılır.
8. **Canlı Gökyüzü** — şu anki gezegen konumları, Ay evresi, bu gece çıplak gözle görülebilecek gezegenler (doğuş/batış).
9. **Yıldızlara Sor** — soru sor, harita özetiyle LLM cevaplasın; Co-Star'ın ücretli özelliğinin bedava hali.
10. **Pazartesi Bülteni** — haftanın transitleri, Ay evreleri, "haftanın çifti", "haftanın dikkat edeni"; tek dokunuşla kopyala.

### v2 park yeri (şimdi yapılmaz)
Doğum günü gökyüzü posteri, Uyum Düellosu (kazanan ilanı), transit zaman çizelgesi, Vedik/sidereal anahtarı,
ilçe seçimi, İngilizce, gündüz teması, özel alan adı, servis worker ile tam çevrimdışı.

---

## 5. Tasarım sistemi (→ docs/DESIGN.md)

### Konsept: "Rasathane"
Mor galaksi ve yıldız tozu klişesi yok. İlham: 1577 İstanbul Rasathanesi (Takiyüddin), usturlap, zîc tabloları,
muvakkithane. Yani: mürekkep gecesi üzerine pirinç çizgiler, kazınmış derece çentikleri, kâğıt hissinde okuma kartları.
Cesaret tek yerde harcanır: **harita çarkı bir usturlap gibi çizilir**; geri kalan her şey sessiz ve disiplinli.

### Renk (CSS değişkenleri)
```
--murekkep:  #101B33   zemin (gece mavisi mürekkep; tam siyah değil)
--derin:     #182645   panel/kart zemini
--pirinc:    #C8A24A   çizgi, çentik, gezegen sembolü, vurgu (küçük metinde kullanılmaz)
--fildisi:   #EFE6D2   ana metin
--kizil:     #B4452B   sert aspekt (kare/karşıt), retro, uyarı
--verdigris: #4E8C7A   uyumlu aspekt (üçgen/altmışlık), olumlu
--sis:       rgba(239,230,210,.55)  ikincil metin
```
Kontrast kuralı: pirinç yalnızca çizgi/ikon/başlık (≥20px); gövde metni her zaman fildişi.

### Tipografi
- Başlık ve sayılar: **Fraunces** (Google Fonts, Türkçe karakter var), tabular-nums.
- Arayüz ve gövde: **Manrope**.
- Ölçek: 12 / 14 / 16 / 20 / 28 / 40. Satır uzunluğu ≤ 70 karakter (Türkçe kelimeler uzun). Gövde satır yüksekliği 1.55.
- Yasak: tümü-büyük-harf etiketler, tek kelimesi renkli başlıklar, her başlığın üstünde küçük "eyebrow" etiketi,
  küçük etiketlerde monospace.
- Font yüklenmezse: Georgia / system-ui geri düşüş; sayfa hiç beklemez (`font-display: swap`).

### Yerleşim
Mobil önce, tek sütun, sola hizalı metin. Alt sekme çubuğu 5 sekme: **Haritam · Bugün · Ofis · Sor · Ayarlar**
(Kıyasla, Ofis'in içinden açılır). Masaüstünde aynı düzen 480px genişlikte ortalanır; ayrı masaüstü tasarımı yok.

```
HARİTAM                          BUGÜN                            OFİS
┌──────────────────────┐         ┌──────────────────────┐         ┌──────────────────────┐
│ Mehmet · Koç ☉ Yay ☽ │         │ Çar 2 Eyl · Ay ♏ 🌒   │         │ Ofis (14 kişi)  [+]  │
│                      │         │ "Ay boşlukta 14:10–  │         │ ┌──┬──┬──┬──┬──┐     │
│   ╭────────────╮     │         │  17:42, imza atma"   │         │ │  │▓▓│░░│▓▓│  │ ısı │
│   │  usturlap  │     │         │──────────────────────│         │ ├──┼──┼──┼──┼──┤ mat.│
│   │   çarkı    │     │         │ Günün üç şeyi        │         │ │▓▓│  │░░│  │▓▓│     │
│   ╰────────────╯     │         │ 1 ♂ □ ☿  "..."       │         │ └──┴──┴──┴──┴──┘     │
│ Büyük Üçlü kartları  │         │ 2 ♀ △ ☽  "..."       │         │ Bugün kime bulaşma   │
│ Yerleşimler (tablo)  │         │ 3 ♄ ☌ ASC "..."      │         │ • Ayşe — Mars kare   │
│ Aspekt ızgarası      │         │ ☿ retro sayacı       │         │ • Kerem — Ay boşluk  │
│ [Şerh: açık/kapalı]  │         │ Toplantı saati skoru │         │ Haftanın çifti       │
└──────────────────────┘         └──────────────────────┘         └──────────────────────┘
```

### Harita çarkı (kahraman)
- Dış halka: 360 çentik (her 5° uzun, her 30° burç sınırı), burç sembolleri pirinç.
- Orta halka: evler (ince çizgi), ASC/MC kalın.
- İç alan: gezegen sembolleri, aspekt çizgileri (uyumlu verdigris ince, sert kızıl ince; orb sıkılaştıkça opaklık artar).
- Sembol üst üste binerse radyal kaydırma (basit çakışma çözümü), etiketler dışa taşmaz.
- Dokun → o gezegenin yorumu açılır; başka bir şeye dokunana kadar kalır.

### Hareket
Tek orkestre an: Haritam ilk açılışta gezegenler yerlerine 900 ms'de oturur, bir kez. `prefers-reduced-motion` açıksa hiç.
Bunun dışında hareket yalnızca kullanıcı eylemine cevap (aç/kapat, kopyalandı). Kartlarda hover efekti, kayan giriş animasyonu yok.

### Metin tonu (arayüz)
Cümle düzeni, düz fiil, kısa. Buton ne yapıyorsa onu söyler: "Haritamı çıkar", "Linki kopyala", "Kartı indir".
Hata suçlamaz, çözüm söyler: "Doğum saati boşsa evler hesaplanamaz — saat gir ya da 'bilmiyorum' işaretle."
Boş ekran davettir: "Ofiste henüz kimse yok. Linkini paylaş, harita geldikçe burası dolar."

### Kalite tabanı (söylemeden yapılır)
Telefonda tek elle kullanım (hedefler ≥ 44px), görünür klavye odağı, kontrast AA, Türkçe karakterler her fontta,
JS hata verirse sayfa boş kalmaz (yakalanır, mesaj gösterir).

---

## 6. Hesap motoru spesifikasyonu (→ docs/ENGINE.md)

Piyasadaki her uygulama aynı dört adımı yapar: gezegen boylamları → açılar/evler → aspektler → yorum. Biz de öyle.
Zodyak: tropikal (Batı standardı). Sidereal v2.

### Girdi (profil şeması, `store.js`)
```
{ id, name, date:"1990-07-15", time:"14:30"|null, tz:"Europe/Istanbul", place:"İzmir", lat:38.42, lon:27.14,
  houseSystem:"P"|"W"|"O", createdAt }
```

### Adımlar
1. **Zaman**: yerel tarih-saat + IANA tz → UTC (Intl ile, `time.js`) → Julian Day (`swe.julday`). Saat yoksa 12:00 yerel.
2. **Cisimler**: Güneş, Ay, Merkür, Venüs, Mars, Jüpiter, Satürn, Uranüs, Neptün, Plüton, Gerçek Kuzey Düğüm, Chiron.
   Her biri: `lon` (0–360), `speed`, `retro = speed < 0` (Güneş/Ay/Düğüm hariç), `sign = floor(lon/30)`, `deg = lon % 30`.
3. **Açılar ve evler** (saat varsa): ASC, MC, 12 ev cusp'ı. Varsayılan **Placidus** (`"P"`, astro.com ile doğrulama kolay),
   seçenekler Whole Sign (`"W"`) ve Porphyry (`"O"`, Co-Star'ın varsayılanı). Ev ataması: Whole Sign'da burç bazlı;
   diğerlerinde cusp aralığı, 360° sarmalını unutma.
4. **Aspektler**: 5 majör — 0 kavuşum, 60 altmışlık, 90 kare, 120 üçgen, 180 karşıt. Bir çift için yalnızca en yakın aspekt
   döner (orb'lar örtüşmesin). `strength = 1 - orb/maxOrb` (0..1). Applying/separating: hız farkından.
5. **Transitler**: hedef gün yerel 12:00 için cisimler hesaplanır, natal noktalarla aspektlenir, puanlanır, ilk 3 seçilir.
   "Şu an" görünümleri (Canlı Gökyüzü, Ay boşlukta) ayrıca gerçek zamanla hesaplanır.
6. **Ay**: evre açısı = (Ay − Güneş) mod 360 → 8 evre + aydınlanma %; Ay burcu; **Ay boşlukta**: Ay bulunduğu burcu terk
   edene kadar hiçbir majör aspekt tam olmuyorsa. Uygulama: 10 dakikalık adımlarla burç sonuna kadar tarayıp Ay–gezegen
   açılarının tam anlarını kontrol et (basit, yeterli).
7. **Retro aralıkları**: ±1 yıl içinde Merkür hızının işaret değiştirdiği anlar (günlük adım + ikiye bölme, ±1 saat hassasiyet).
   Yılda bir hesaplanır, `yn:cache`'te saklanır. Aynı fonksiyon Venüs/Mars için de çalışır.
8. **Sinastri**: A natal × B natal aspektleri (sinastri orb'ları). Skor 0–100: aspekt katkıları (uyumlu +, sert −,
   Güneş/Ay/Venüs/Mars ağırlıklı) %70 + Büyük Üçlü element/nitelik uyumu %30. Yanına açıklanabilir 3 madde.
   Etiketler iş-arkadaşı dilinde: "toplantıda birbirini tamamlar", "aynı projede kıvılcım çıkar", "mail'de dikkat".
9. **Toplantı skoru** (elektif, şaka dozunda): 0–100. Ay boşlukta −40, Merkür retro −25, Ay–Satürn sert −15,
   Ay–Jüpiter uyumlu +15, Mars–Merkür sert −10, Ay burcunun elementi toplantı türüne göre ±10. Hüküm tek satır;
   alt satır her zaman: "Gerçek işi yine de yap."
10. **Arketip**: 12 arketip, anahtar = "baskın burç": Güneş 3, Ay 2, ASC 2, Merkür 1, Mars 1 ağırlıklı oylama;
    beraberlikte Güneş kazanır. Saat yoksa ASC oy vermez.

### Orb tablosu (`config.js`, derece)
| Aspekt | Natal | Transit | Sinastri |
|---|---|---|---|
| Kavuşum 0° | 8 | 3 | 6 |
| Karşıt 180° | 8 | 3 | 6 |
| Kare 90° | 7 | 3 | 5 |
| Üçgen 120° | 7 | 2.5 | 5 |
| Altmışlık 60° | 5 | 2 | 4 |
Güneş veya Ay taraf ise +1°. Transitte Ay için +1° daha. Bunlar sektörde yaygın aralıkların ortası; tartışmalı, değiştirilebilir.

### Transit puanı
`puan = strength × wTransit × wNatal × wAspect`
- wTransit: Güneş 1.0, Ay 0.6, Merkür 0.7, Venüs 0.8, Mars 0.9, Jüpiter 0.8, Satürn 1.0, Uranüs 0.7, Neptün 0.6, Plüton 0.7
- wNatal: Güneş 1.0, Ay 1.0, ASC 1.0, MC 0.8, Merkür/Venüs/Mars 0.8, dış gezegenler 0.5, Düğüm/Chiron 0.4
- wAspect: kavuşum 1.0, karşıt 0.9, kare 0.9, üçgen 0.7, altmışlık 0.5
"Bugün kime bulaşma" = sert aspekt puanlarının toplamı eşik üstünde olan profiller.

### Doğrulama (Adım 1 kapısı)
`tests/golden-charts.test.js`: Mehmet astro.com'dan 3 harita çıkarır (kendi haritası + 2 uydurma doğum verisi;
uydurmalar repo'ya girebilir, kendi haritası girmez — test dosyası kendi haritasını `tests/private.local.json`'dan okur,
o dosya `.gitignore`'da). Tolerans: gezegen boylamı ±0.02°, ASC/MC ±0.2°, ev cusp'ları ±0.5°.
Zaman testleri: 1990-07-15 12:00 İstanbul = 09:00 UTC (yaz saati +3), 1990-01-15 12:00 = 10:00 UTC (+2),
2020-07-15 12:00 = 09:00 UTC (kalıcı +3). Bunlar geçmeden Adım 2 başlamaz.

Regresyon değerleri (kişisel veri değil; motorun kendi çıktısı, Node 22'de doğrulandı): 2000-01-01 12:00 UT
(`julday` = 2451545.0), İstanbul 41.01 K / 28.98 D, Placidus → Ay 223.3238° (hız 12.0213°/gün), ASC 60.27°, MC 307.04°.
Bunlar `engine.test.js`'in sabit değerleridir; astro.com karşılaştırması bağımsız doğrulamadır, ikisi farklı iştir.

---

## 7. Metin bankası (→ docs/TEXTBANK.md)

Uygulamanın asıl sermayesi. Hesap "çözülmüş problem"; Co-Star'ı Co-Star yapan ton. Bankayı Claude Code kendisi yazar
(runtime LLM gerekmez), JSON olarak repo'ya girer, her batch `scripts/validate-bank.js`'den geçer.

### Dosyalar ve kapsam
| Dosya | Anahtar | Adet | Alanlar |
|---|---|---|---|
| planets-signs.json | `sun_aries` … `chiron_pisces`, `asc_aries` … | 12 cisim × 12 = 144 + 12 | title, hook, body, office, barnum |
| planets-houses.json | `mars_h7` | 12 × 12 = 144 | hook, body, office, barnum |
| aspects.json | `mars_square_mercury` (cisim sırası sabit: index küçük olan önce) | 55 çift × 5 = 275 | natal, synastry, barnum |
| transits.json | `t_saturn_square_n_moon` | 10 transit × 5 aspekt × 11 natal = 550 | v: [3 varyant], advice, barnum |
| moon.json | `phase_full_scorpio` | 8 × 12 = 96 | line (tek cümle) |
| archetypes.json | `aries` … `pisces` | 12 | title, emblem, lines[3], meeting, mail, crisis |
| retro.json | `mercury_start`, `mercury_mid`, `mercury_end`, `mercury_shadow` | ~20 | v: [varyantlar] |
| ui-copy.json | arayüz metinleri | — | boş durumlar, hatalar, damgalar |

`barnum`: yazar tahmini 0–1 (0 = çok spesifik, 1 = herkese uyar). Şüpheci Şerhi bunu "bu cümle 12 burcun ~7'sine uyar" diye gösterir.

### Ton rehberi (`docs/TEXTBANK.md` içinde, her batch'te okunur)
- İkinci tekil şahıs, bugünün İstanbul Türkçesi, ofis arkadaşı ağzı. Co-Star'ın kısalığı + Türk ofis mizahı.
- hook 1–2 cümle (vurucu), body 2–4 cümle (neden), office 1 cümle (bugün ofiste nasıl görünür).
- Sivri ama zalim değil: bu metni haritanın sahibi de, masadaki arkadaşı da okuyacak. Aşağılama, beden, sağlık, para,
  aile, ayrılık yok.
- Klişe yasak listesi: "evren sana", "enerjini", "yıldızlar diyor ki", "kozmik", "ruhun", "titreşim", "manifest".
- Spesifik ol: cümle 12 burcun hepsine uyuyorsa yeniden yaz. Somut ofis sahneleri kullan (toplantı, mail, deploy, kahve
  makinesi, mesai bitimi, Slack/Teams, Pazartesi).
- Transit varyantları birbirinin eş anlamlısı olmasın; farklı sahne, farklı açı.

### Üretim usulü
1. Şema ve 5 örnek kayıt önce yazılır, Mehmet tonu onaylar.
2. Batch = 40–60 kayıt, dosya dosya. Her batch sonrası `node scripts/validate-bank.js`: eksik anahtar, boş alan,
   uzunluk sınırı (hook ≤ 140, body ≤ 420 karakter), yasak kelime, çift anahtar. Geçince commit.
3. Sıra: planets-signs → archetypes → aspects → moon → (Adım 4'te) transits, retro.
4. Çeşitlilik: `bank.js` varyantı seed ile seçer ve son 7 günde gösterilenleri (`yn:cache`) tekrar etmez.

---

## 8. LLM ve Worker (→ docs/LLM.md)

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

---

## 9. Yol haritası — adım kapıları (→ docs/ROADMAP.md)

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

**Adım 7 — Cila**
PWA (manifest, ikon, ana ekrana ekle), performans (WASM önbellek, natal cache), erişilebilirlik turu, boş/hata durumları,
README, sürüm etiketi v1.0.
Bitti: telefonda "ana ekrana ekle" çalışıyor; ilk açılış < 3 s (4G); Lighthouse erişilebilirlik ≥ 90.

---

## 10. Girişimci son dokunuşları (→ docs/REVIEW.md, birinci yarı)

Bunlar "özellik" değil, ürünün elde tutulma sebepleri. Adım 7'de ve sonrasında.
- **İsim ve işaret**: Yıldızname. Logo tek çizgi bir usturlap "rete"si (örümcek ağı gibi işaretçi). Uygulama ikonu mürekkep zemin, pirinç rete.
- **40 saniyelik onboarding**: 3 alan, "saatimi bilmiyorum" tek dokunuş, il listesi arama kutulu. Bitince çark yerleşir — ilk "vay" anı budur.
- **Sabah ritüeli**: bildirim altyapısı yok; onun yerine ana ekrana ekle + açılışta tek cümle (Ay + günün 1. transiti) kilit ekranı gibi.
- **Ton seçici** (Ayarlar): Nazik / Co-Star / Acımasız. Aynı bankadan `office` alanı ve hook sertliği değişir. Herkes dozunu seçer.
- **Paylaşım döngüsü**: Yıldızname Kartı ve Pazartesi Bülteni tek dokunuşla kopyalanır; ofis WhatsApp grubu dağıtım kanalı olur.
- **Doğum günü**: o gün Güneş dönüşü (solar return) ekranı — "yılın gökyüzü" mini kartı ve ofisten kutlama linki.
- **Easter egg'ler**: Merkür retroda "Deploy" yazısı titrer; 13. Cuma damgası; Ay boşluktayken "imza atma" bandı.
- **Şerh kültürü**: Şüpheci Şerhi kapalıyken bile küçük bir "i" var; dürüstlük güveni artırır, geyiği azaltmaz.
- **Boş durumlar satar**: "Ofiste henüz kimse yok" ekranı QR ile gelir; ilk 3 kişi girince matris canlanır.
- **Sürüm notları uygulama içinde**: Ayarlar'ın altında 3 satırlık "Yeni ne var" — kullanıcı geri gelsin diye.

---

## 11. Mimar bakışı — nokta atışı düzeltmeler (→ docs/REVIEW.md, ikinci yarı)

Projenin son haline dışarıdan bakıldı; aşağıdaki düzeltmeler yukarıdaki bölümlere **işlendi**. Claude Code bunları
"uyulacak kararlar" olarak okur, yeniden tartışmaz.

1. **Repo halka açık → kişisel veri sıfır.** GitHub Pages ücretsiz planda açık repo ister. Profiller yalnızca tarayıcıda,
   aktarım linkle, Worker'a yalnızca yerleşim özeti gider. Mehmet'in altın haritası `tests/private.local.json`, `.gitignore`'da.
2. **CDN `@main` kırılganlığı.** Efemeris kütüphanesi vendor'a kopyalanır, sürüm sabitlenir. Dış bağımlılık: yalnızca Google Fonts
   (o da düşerse sistem fontu).
3. **Upstream paketi 12 MB, 10 MB'ı asteroit isim listesi.** Loader `.data`'yı koşulsuz istiyor; çözüm yeniden paketleme
   (bölüm 2). Hedef ≈ 0,9 MB, en kötü ≈ 2,8 MB. Tembel yükleme; natal hesap bir kez yapılıp `yn:cache`'e yazılır; sekmeler
   arasında yeniden hesap yok. GitHub Pages `max-age=600` verir ama ETag ile 304 döner, yeniden indirme olmaz.
   Tam çevrimdışı (service worker) v2 — şimdi karmaşıklık katma. Git LFS gerekmez.
4. **Zaman dilimi tuzağı.** 1985–2016 arası Türkiye yaz saati; test zorunlu. Yurt dışı doğum için IANA seçici. Sunucu saati değil,
   telefonun saati kullanılır; "Bugün" İstanbul yerel tarihidir, UTC değil.
5. **Öğlen varsayımı Ay'ı ±6° kaydırır.** Saat yoksa ve Ay burç sınırına 6° içindeyse ekranda "Ay burcun X ya da Y olabilir"
   uyarısı; metin iki burcu da hafif gösterir.
6. **Ev sistemi kargaşası.** Varsayılan Placidus (doğrulama için), Ayarlar'da Whole Sign ve Porphyry. Ev metinleri sistemden bağımsız.
   Enlem > 60° ise Placidus çöker → otomatik Whole Sign.
7. **Orb örtüşmesi.** Çift başına tek (en yakın) aspekt. Minör aspektler yok — banka şişmesin, çark okunabilsin.
8. **Determinizm.** Varyant seçimi `hash(profileId + tarih)`; test edilebilir, "yenileyince değişti" şikâyeti olmaz.
9. **Tekrar hissi.** 3 varyant + 7 gün tekrar etmeme; Ay satırı her gün değişir (evre × burç), bu da tazelik verir.
10. **Barnum dürüstlüğü.** Her metnin `barnum` alanı zorunlu; validator 0.9 üstünü reddeder (o cümle herkese uyuyordur, yeniden yaz).
11. **Worker kötüye kullanım.** Origin + PIN + IP limiti + global tavan + kill switch. Bunlardan biri olmadan deploy yok.
12. **LLM hesap yapmaz.** Prompt "listede olmayanı uydurma" der; çıktı düz metin, 400 token tavan; cevaptan sayı ayıklama yapılmaz.
13. **Retro taraması pahalı olabilir.** Yılda bir hesap, cache; UI hiçbir zaman tarama beklemez (önce banka, sonra sayaç güncellenir).
14. **Kontrast.** Pirinç küçük metinde AA'yı geçmez → yalnızca çizgi/ikon/başlık. Gövde daima fildişi. Hard/soft aspekt rengi
    tek başına anlam taşımaz; sembol + metin de var (renk körlüğü).
15. **Router ve durum.** Hash router + tek `state` nesnesi; sayfa modülleri `render(state)` ve `mount()` dışında bir şey dışa açmaz.
    Global olay dinleyicisi çöplüğü olmasın: sayfa değişince eskisi `unmount()` ile temizlenir.
16. **Test disiplini.** `src/astro/` her dışa açık fonksiyon için en az bir test; UI için test yok, telefonda elle kontrol listesi
    (`docs/ROADMAP.md` kapıları).
17. **Lisans.** Swiss Ephemeris GPL → repo GPL-3.0. Mehmet ileride kapalı/ticari isterse motor `astronomy-engine`'e (MIT) geçer,
    ev hesabı elle yazılır; `engine.js` tek sarmalayıcı olduğu için değişim tek dosyada kalır. Bu yüzden sarmalayıcı dışına
    `swe.` sızmaz.
18. **Kapsam disiplini.** Bölüm 4'teki "v2 park yeri" v1'de dokunulmaz. Yeni fikir gelirse park yerine yazılır, koda değil.
19. **Metin bankası gözden geçirmesi bir kişide.** Ton onayını Mehmet verir; Claude Code onaysız batch üretmez (Adım 3 kapısı).
20. **Ölçü: "ofisteki en az meraklı kişi bile 40 saniyede haritasını görür."** Her tasarım kararı bu cümleye vurulur.

---

## Claude Code'a ilk mesaj (Mehmet kopyalar)

```
git pull. CLAUDE.md'nin tam hali repoda; baştan sona oku, bölüm 0'daki bütünlük kontrolünü yap. Sonra:
1) Bölüm 0'daki talimatla dosyayı docs/ altına böl ve CLAUDE.md'yi kısalt,
2) Daha önce çıkardığın Adım 0 planını docs/ROADMAP.md'deki Adım 0 tanımına ve "verilmiş kararlar"a göre güncelle,
   plan modunda göster: oluşturacağın dosyalar, çalıştıracağın komutlar, benden istediklerin,
3) Onayımı bekle. Kod yazma.
```

Şu an: Adım 0
