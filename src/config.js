// Tüm ayarlanabilir sayılar ve seçimler burada. Kodun geri kalanında sihirli sayı yok.

export const EPHEMERIS = {
  // true: Moshier hesabı (SEFLG_MOSEPH). Gezegen/Ay efemeris dosyaları vendor paketinden çıkarıldı
  // (bkz. scripts/repack-swisseph-data.js); fark < 0,001°, bizim için önemsiz. false: SEFLG_SWIEPH, dosya ister.
  useMoshier: true,
  // Swiss Ephemeris ev sistemi harfi: 'P' Placidus, 'W' Whole Sign, 'K' Koch, 'E' Eşit.
  houseSystem: 'P',
};

// Haritada hesaplanan gök cisimleri; anahtarlar src/astro/engine.js'teki BODY_CONSTANTS ile eşleşir.
export const BODIES = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'chiron',
];
