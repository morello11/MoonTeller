# vendor/swisseph

- Kaynak: `swisseph-wasm` npm paketi, sürüm **0.0.4** (https://github.com/prolaxu/swisseph-wasm), Swiss Ephemeris 2.10.03. Lisans GPL-3.0-or-later.
- Alınanlar: `src/swisseph.js`, `wsam/` (loader, wasm, data), `QUICK_REFERENCE.md`, `DOCUMENTATION.md`, `LICENSE`, `package.json`.
  `examples/` ve `types/` alınmadı. Klasör adı `wsam` upstream'in yazımı; sarmalayıcı bu yolu sabit kodladığı için değiştirilmedi.
- Değişiklik: `wsam/swisseph.data` içinden 9,9 MB'lık `seasnam.txt` (asteroit isim listesi) çıkarıldı ve `wsam/swisseph.js`'teki
  dosya tablosu buna göre güncellendi. Script: `scripts/repack-swisseph-data.js`. Başka değişiklik yok.
- Sürüm yükseltirken: yeni tarball'dan aynı dosyaları kopyala, scripti tekrar çalıştır, `node --test tests/` ile altın değerleri doğrula.
