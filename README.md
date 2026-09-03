# Yıldızname

Ofis arkadaşlarıyla geyik için, tarayıcıda çalışan, eğlenceli ama dürüst bir astroloji uygulaması.
Gökyüzü hesabı Swiss Ephemeris (WebAssembly) ile yerelde yapılır; sunucu yok, hesap yok, veri toplanmaz.

## Açmak

Statik dosyalardır; herhangi bir HTTP sunucusu yeter (`file://` ile WASM yüklenmez):

```
python3 -m http.server 8080
# http://localhost:8080
```

Testler: `node --test` (Node 22+; `tests/*.test.js` otomatik bulunur).

Sor sekmesi ve LLM sentezi isteğe bağlı bir Cloudflare Worker ister; kurulum `worker/README.md`. Worker yoksa uygulama metin bankasıyla tam çalışır.

## Yayın (GitHub Pages)

Build yok; `main` dalı kök dizinden olduğu gibi yayınlanır. Bir kez ayarlanır:

1. Bu dalı `main`'e birleştir.
2. GitHub'da repo → **Settings** → **Pages**.
3. **Build and deployment** → Source: **Deploy from a branch**; Branch: **main**, klasör: **/ (root)** → **Save**.
4. **Actions** sekmesinde "pages build and deployment" işi yeşil olunca (1–2 dk) site şurada:
   `https://morello11.github.io/MoonTeller/`
5. Telefonda aç, **Motor testi**'ne bas; Güneş boylamı ve "Swiss Ephemeris 2.10.03" görünmeli.

Sonraki her `main` push'u aynı işi tetikler; ek ayar gerekmez. `.nojekyll` dosyası Jekyll'in `vendor/` gibi klasörleri atlamasını önler.

## Notlar

- Doğum bilgileri yalnızca tarayıcının `localStorage`'ında durur; repoya kişisel veri girilmez.
- Lisans: GPL-3.0 (bkz. `LICENSE`). Swiss Ephemeris ve `swisseph-wasm` sarmalayıcısı da GPL'dir; sabitlenmiş kopya `vendor/swisseph/` altındadır.
