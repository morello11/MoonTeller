# Yorumcu portreleri — üretim promptları (Adım 7 görsel katmanı)

Beş kurgusal yorumcu için tek seri gibi duran küçük portreler. Mehmet bunları bir görüntü modeliyle (ChatGPT "Create image",
GPT Image ya da benzeri) üretir; dosyalar `assets/voices/<anahtar>.png` olarak repoya konur, uygulama seçim sayfasında büyük,
yaprak başlığında yuvarlak küçük gösterir. Renk ve amblem katmanı portre olmasa da çalışır.

## Teslim formatı
- Beş dosya: `polyanna.png`, `ya_olmazsa.png`, `sert.png`, `nurten.png`, `muneccim.png` → `assets/voices/`
- Kare, 1024×1024 (küçültme ve sıkıştırma repoda yapılır; 512 ve 96 px türevleri üretilir).
- Büst (omuz üstü), baş yüksekliğin ~%60'ı, hafif sola dönük, bakış izleyiciye. Arka plan düz eski kâğıt; sahne yok.
- Metin, harf, logo, çerçeve yok. Gerçek bir kişiye, ünlüye ya da dizi karakterine benzemez.

## Ortak üslup bloğu (her prompt'un başına aynen)
> Vintage engraved illustration, fine crosshatch etching lines, printed on aged ivory paper (#EFE6D2). Ink is deep night-blue
> (#101B33) with one accent color and small brass (#C8A24A) details. Bust portrait, square 1:1, head about 60% of the frame,
> turned slightly left, eyes toward the viewer, calm studio light from the upper left. Flat paper background, no scene, no
> text, no letters, no logo, no frame. Fictional character; must not resemble any real person, celebrity or TV character.
> Same line weight and same head size as the other portraits in this series.

Tek oturumda üretip "aynı üslupla devam et" demek seriyi tutarlı kılar.

## 1. Polyanna — iyimser (`polyanna.png`)
> [ortak blok] A woman in her early thirties, bright open face, small confident smile (not a grin), short curly hair,
> knitted cardigan with the collar slightly open. Accent color warm sun yellow (#E0B84A): a small eight-pointed star pin on
> the collar and a faint yellow wash on the cheeks. She looks like someone who has just found the good side of bad news.

## 2. Ya Olmazsa? — tedbirli (`ya_olmazsa.png`)
> [ortak blok] A person in their forties, gentle and caring but slightly worried expression, thin round glasses, a wool
> scarf wrapped twice, hair neatly combed. Accent color slate blue-grey (#6B7A99): a small folded umbrella hooked over one
> shoulder and a blue-grey wash on the scarf. Kind eyes; they are about to say "if I were you".

## 3. Sert Uygulama — uygulamanın kendi sesi (`sert.png`)
Yüz yok: bu ses uygulamanın kendisi. Portre yerine mühür.
> Vintage engraved illustration on aged ivory paper (#EFE6D2), square 1:1. A single square brass seal (#C8A24A) stamped
> firmly onto the paper, slightly off-axis, ink in deep night-blue (#101B33), a small ink smudge at one corner. Inside the
> square: one bold, minimal square mark, nothing else. No letters, no text, no face, no frame. Centered, plenty of paper
> around it. Same line weight as the portrait series.

İstersen yüzlü seçenek: > [ortak blok] A young person of indeterminate gender, plain dark crew-neck shirt, very short hair,
> neutral unsmiling face, direct gaze, no accessories. Accent color brass (#C8A24A) only as a thin square outline behind the
> head. Minimal, almost no shading.

## 4. Nurten Abla — mahalle ablası (`nurten.png`)
> [ortak blok] A woman around sixty, warm knowing smile with one eyebrow slightly raised, hair in a loose bun, a cardigan
> over a patterned house dress, holding a small tulip-shaped Turkish tea glass in one hand. Accent color brick red
> (#B4452B): the tea and a red wash on the cardigan. She looks like she already knows what the neighbors did.

## 5. Müneccimbaşı — saray müneccimi (`muneccim.png`)
> [ortak blok] An elderly man with a long grey beard, tall Ottoman court turban (kavuk) with a small crescent ornament,
> a kaftan with a faint star pattern, holding a brass astrolabe near his chest, a wry, secretly amused smile. Accent color
> verdigris green (#4E8C7A): the kaftan wash and the crescent. Historical costume, fictional person, not a specific
> historical figure.

## Repoda (Adım 7 hazırlık)
Beş portre `assets/voices/<anahtar>.jpg` (512×512, JPEG 0.82; toplam ≈ 0,3 MB) olarak repoda; `data/tr/voices.json` `portrait` alanı yolu
tutar, boş bırakılırsa amblem görünür. Kaynaklar sohbet kaydından kurtarıldı; Müneccimbaşı sıkı kadrajlı ilk sürüm.

## Repoya koyma (yenisi gelirse)
GitHub'da repo → `assets/voices/` (yoksa "Add file → Create new file" ile `assets/voices/.keep` açılır) → "Upload files" →
beş PNG → dal `claude/yildizname-setup-8px7xs` (ya da `main`; Claude Code çeker). Sonra Claude Code görselleri küçültür,
seçim sayfası ve yaprak başlığına bağlar (Adım 7).
