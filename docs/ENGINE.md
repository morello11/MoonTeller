# Hesap motoru spesifikasyonu

> Kaynak: proje rehberinin 6. bölümü. `CLAUDE.md` bölüm 0–3 her oturumda okunur; bu dosya ilgili adımda okunur.

## 6. Hesap motoru spesifikasyonu

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
