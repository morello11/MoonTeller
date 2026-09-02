# Ürün vizyonu

> Kaynak: proje rehberinin 4. bölümü. `CLAUDE.md` bölüm 0–3 her oturumda okunur; bu dosya ilgili adımda okunur.

## 4. Ürün vizyonu

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
**Karar (Adım 3):** "Ofis" çerçevesi orta yola çekildi. Ürün dili "Ekip"; metinlerde iş sahneleri azınlık, gündelik hayat çoğunluk.
Ayrıntı `docs/TEXTBANK.md` sonunda.
