# vendor/swisseph

- Kaynak: `swisseph-wasm` npm paketi, sürüm **0.0.4** (https://github.com/prolaxu/swisseph-wasm), Swiss Ephemeris 2.10.03. Lisans GPL-3.0-or-later.
- Alınanlar: `src/swisseph.js`, `wsam/` (loader, wasm, data), `QUICK_REFERENCE.md`, `DOCUMENTATION.md`, `LICENSE`, `package.json`.
  `examples/` ve `types/` alınmadı. Klasör adı `wsam` upstream'in yazımı; sarmalayıcı bu yolu sabit kodladığı için değiştirilmedi.
- Değişiklik: `wsam/swisseph.data` (12,1 MB) içinden `seasnam.txt` (asteroit isim listesi, 9,9 MB), `sepl_18.se1` (gezegenler) ve
  `semo_18.se1` (Ay) çıkarıldı; kalan 362 KB (`seas_18.se1` Chiron için, `sefstars.txt`, `seorbel.txt`, `seleapsec.txt`).
  `wsam/swisseph.js`'teki dosya tablosu buna göre güncellendi. Script: `scripts/repack-swisseph-data.js`. Başka değişiklik yok.
- Sonuç: gezegen/Ay konumları Moshier hesabıyla (`SEFLG_MOSEPH`, `src/config.js`) gelir. 1960–2050 arasında 12 cisim için
  Swiss Ephemeris dosyalı hesaba göre en büyük fark 0,0035° (Gerçek Düğüm), gezegenlerde < 0,001°.
- Sürüm yükseltirken: yeni tarball'dan aynı dosyaları kopyala, scripti tekrar çalıştır, `node --test` ile doğrula.
