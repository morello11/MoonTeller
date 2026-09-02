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

## Notlar

- Doğum bilgileri yalnızca tarayıcının `localStorage`'ında durur; repoya kişisel veri girilmez.
- Lisans: GPL-3.0 (bkz. `LICENSE`). Swiss Ephemeris ve `swisseph-wasm` sarmalayıcısı da GPL'dir; sabitlenmiş kopya `vendor/swisseph/` altındadır.
