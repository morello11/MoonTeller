# Gözden geçirme: girişimci dokunuşları ve mimar düzeltmeleri

> Kaynak: proje rehberinin 10–11. bölümü. `CLAUDE.md` bölüm 0–3 her oturumda okunur; bu dosya ilgili adımda okunur.

## 10. Girişimci son dokunuşları

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

## 11. Mimar bakışı — nokta atışı düzeltmeler

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
