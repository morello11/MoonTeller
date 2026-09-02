# Metin bankası

> Kaynak: proje rehberinin 7. bölümü. `CLAUDE.md` bölüm 0–3 her oturumda okunur; bu dosya ilgili adımda okunur.

## 7. Metin bankası

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

## Ek (Adım 3, Mehmet'in üç ölçütü)

1. **Uluslararası düzeyde doğruluk.** Gezegen, burç, ev ve aspekt anlamları Batı astrolojisinin yerleşik geleneğiyle
   uyumlu olacak; aşağıdaki tablolar kaynak. Uydurma iddia, "bilimsel" kılıf, kesin gelecek yok. Dış gezegenlerin
   (Uranüs, Neptün, Plüton) asalet tabloları modern ve tartışmalı; metinde asalet yalnızca yedi klasik gezegen için anılır.
2. **Basitlik ve anlaşılırlık.** Cümle başına tek fikir. Jargon ilk geçişte parantez içinde bir cümleyle açıklanır
   ("Ay burada düşüşte sayılır (gelenekte en zor çalıştığı yer)"). Okuyan astroloji bilmiyor sayılır.
3. **Kalite ve zenginlik.** Her kayıtta neden-sonuç var (burç + element + nitelik → davranış → ofis sahnesi). İki kayıt aynı
   sahneyi kullanmaz. Güçlü ve zor yanı birlikte söylenir; övgü ya da suçlama tek başına yok.

### Doğruluk kaynakları

**Element ve nitelik**
| | Öncü (başlatır) | Sabit (sürdürür) | Değişken (uyarlar) |
|---|---|---|---|
| Ateş (eylem, cesaret) | Koç | Aslan | Yay |
| Toprak (madde, düzen) | Oğlak | Boğa | Başak |
| Hava (fikir, ilişki) | Terazi | Kova | İkizler |
| Su (duygu, sezgi) | Yengeç | Akrep | Balık |

**Yöneticilik ve asalet (klasik yedi gezegen)**
| Gezegen | Anlattığı | Yönettiği (evi) | Yücelme | Zararı | Düşüş |
|---|---|---|---|---|---|
| Güneş | kimlik, canlılık, amaç | Aslan | Koç | Kova | Terazi |
| Ay | duygu, ihtiyaç, alışkanlık | Yengeç | Boğa | Oğlak | Akrep |
| Merkür | düşünce, dil, öğrenme | İkizler, Başak | Başak | Yay, Balık | Balık |
| Venüs | değer, zevk, yakınlaşma | Boğa, Terazi | Balık | Koç, Akrep | Başak |
| Mars | eylem, istek, öfke | Koç, Akrep | Oğlak | Terazi, Boğa | Yengeç |
| Jüpiter | genişleme, anlam, şans | Yay, Balık | Yengeç | İkizler, Başak | Oğlak |
| Satürn | sınır, disiplin, zaman | Oğlak, Kova | Terazi | Yengeç, Aslan | Koç |
Modern yöneticilikler: Uranüs → Kova (yenilik, kopuş), Neptün → Balık (hayal, çözülme), Plüton → Akrep (dönüşüm, güç).
Kuzey Düğüm: gelişme yönü (burç anlatılır, asalet yok). Chiron: yara ve ustalık (burç anlatılır, asalet yok).
Yükselen: dış görünüş, ilk izlenim, hayata giriş biçimi; burcun yöneticisi haritanın "sahibi"dir.

**Evler (ofis diliyle, yasak konulara girmeden)**
1 benlik ve görünüş · 2 kaynaklar ve değer verdiği şeyler · 3 iletişim, öğrenme, yakın çevre · 4 kök, ev, iç dünya ·
5 yaratıcılık, oyun, sahne · 6 günlük iş, düzen, hizmet · 7 bire bir ilişki, ortaklık · 8 derinlik, dönüşüm, ortak kaynaklar ·
9 uzaklar, anlam, yüksek öğrenme · 10 kariyer, kamu önündeki rol · 11 gruplar, arkadaşlar, ağlar · 12 geri çekilme, görünmeyen, dinlenme.
Yasak: 2. ve 8. evde para tavsiyesi, 4. evde aile tavsiyesi, 5. ve 7. evde ilişki krizi tavsiyesi, 6. evde sağlık. Mizaç anlatılır, akıl verilmez.

**Aspektler**
kavuşum 0° birleşme ve yoğunluk · altmışlık 60° fırsat, çaba ister · kare 90° sürtünme ve büyüme · üçgen 120° akış, yetenek, tembelliğe açık ·
karşıt 180° gerilim, başkası üzerinden farkındalık. Kare ve karşıt "kötü" değil "çalıştıran"; üçgen "iyi" değil "kolay".
