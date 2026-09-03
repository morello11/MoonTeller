# Tasarım sistemi

> Kaynak: proje rehberinin 5. bölümü. `CLAUDE.md` bölüm 0–3 her oturumda okunur; bu dosya ilgili adımda okunur.

## 5. Tasarım sistemi

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

Yorumcu yaprağı (Adım 6b, style.css sonundaki blok): --kagit #EFE6D2 kâğıt zemin, --kagit-murekkep #101B33 kâğıt üstü metin,
--kizil-kagit #9A3A22 damga; --m70/--m50/--m35/--m15/--m12/--m05 mürekkebin kâğıt üstü tonları; --pirinc-08 seçili satır;
--ayirici satır ayırıcı; --perde seçim perdesi; --ease ortak eğri; --yaprak-golge pirinç ofset gölge.
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
Mobil önce, tek sütun, sola hizalı metin. Alt sekme çubuğu 5 sekme: **Haritam · Bugün · Ekip · Sor · Ayarlar**
(Kıyasla, Ekip'in içinden açılır; sekme adı Adım 3 kararıyla "Ofis"ten "Ekip"e çevrildi). Masaüstünde aynı düzen 480px genişlikte ortalanır; ayrı masaüstü tasarımı yok.

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
