// Tüm ayarlanabilir sayılar ve seçimler burada. Kodun geri kalanında sihirli sayı yok.

export const EPHEMERIS = {
  // true: gömülü efemeris dosyaları yerine Moshier hesabı (dosya gerekmez; fark bizim için önemsiz).
  useMoshier: false,
  // Swiss Ephemeris ev sistemi harfi: 'P' Placidus, 'W' Whole Sign, 'K' Koch, 'E' Eşit.
  houseSystem: 'P',
};

// Haritada hesaplanan gök cisimleri; anahtarlar src/astro/engine.js'teki BODY_CONSTANTS ile eşleşir.
export const BODIES = [
  'sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn',
  'uranus', 'neptune', 'pluto', 'trueNode', 'chiron',
];

export const TIME = {
  defaultTimeZone: 'Europe/Istanbul',
  // Doğum saati bilinmiyorsa hesapta varsayılan yerel saat.
  unknownTimeHour: 12,
};
