// Tüm ayarlanabilir sayılar ve seçimler burada. Kodun geri kalanında sihirli sayı yok.

// Swiss Ephemeris bayrak adları; engine.js bunları motor örneğinden çözer, sayı burada durmaz.
// SEFLG_MOSEPH: Moshier hesabı (gezegen/Ay efemeris dosyaları vendor paketinden çıkarıldı, fark < 0,001°).
// Dosyalı hesap istenirse 'SEFLG_SWIEPH' yaz ve scripts/repack-swisseph-data.js'teki DROP listesini küçült.
export const EPHEMERIS_FLAGS = ['SEFLG_MOSEPH', 'SEFLG_SPEED'];

// Ev sistemi harfi: 'P' Placidus (varsayılan), 'W' Whole Sign, 'O' Porphyry.
export const HOUSE_SYSTEM = 'P';

export const DEFAULT_TZ = 'Europe/Istanbul';

// Doğum saati bilinmiyorsa hesapta varsayılan yerel saat.
export const UNKNOWN_TIME_HOUR = 12;

// Haritada hesaplanan gök cisimleri; anahtarlar src/astro/engine.js'teki BODY_CONSTANTS ile eşleşir.
export const BODIES = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'chiron',
];
