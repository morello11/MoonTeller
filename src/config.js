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

// --- Aspektler (docs/ENGINE.md, orb tablosu) ---
export const ASPECTS = [
  { name: 'conjunction', angle: 0 },
  { name: 'sextile', angle: 60 },
  { name: 'square', angle: 90 },
  { name: 'trine', angle: 120 },
  { name: 'opposition', angle: 180 },
];

// Orb (derece): natal / transit / sinastri.
export const ORBS = {
  conjunction: { natal: 8, transit: 3, synastry: 6 },
  opposition: { natal: 8, transit: 3, synastry: 6 },
  square: { natal: 7, transit: 3, synastry: 5 },
  trine: { natal: 7, transit: 2.5, synastry: 5 },
  sextile: { natal: 5, transit: 2, synastry: 4 },
};
export const LUMINARIES = ['sun', 'moon'];
export const ORB_LUMINARY_BONUS = 1;       // Güneş veya Ay taraf ise
export const ORB_TRANSIT_MOON_BONUS = 1;   // transit eden Ay ise, ayrıca
export const ANGLES = ['asc', 'mc'];        // aspekt hesabına katılan açılar

// Retro bayrağı hesaplanmayan cisimler (Güneş/Ay hiç geri gitmez, Düğüm zaten çoğunlukla geri).
export const NON_RETROGRADE_BODIES = ['sun', 'moon', 'trueNode'];

// --- Evler ---
export const HOUSE_SYSTEMS = ['P', 'W', 'O']; // Placidus, Whole Sign, Porphyry
export const PLACIDUS_MAX_LATITUDE = 60;     // üstünde Placidus çöker → Whole Sign

// --- Ay ---
export const MOON_PHASES_TR = [
  'Yeni Ay', 'Hilal', 'İlk Dördün', 'Şişkin Ay',
  'Dolunay', 'Küçülen Şişkin Ay', 'Son Dördün', 'Küçülen Hilal',
];
// Ay boşlukta taraması: adım ve Ay'ın aspekt yaptığı cisimler.
export const VOID_OF_COURSE = {
  stepMinutes: 10,
  bodies: ['sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'],
};
