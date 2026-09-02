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
