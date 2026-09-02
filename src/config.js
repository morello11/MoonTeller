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

// --- Depolama ---
export const STORAGE_KEYS = { profiles: 'yn:profiles', settings: 'yn:settings', cache: 'yn:cache' };
export const SCHEMA_VERSION = 1;

// Saat bilinmiyorsa (12:00 varsayımı) Ay burç sınırına bu kadar yakınsa "X ya da Y olabilir" uyarısı.
export const MOON_BOUNDARY_WARN_DEG = 6;

// --- Harita çarkı (SVG, viewBox 0 0 size size) ---
export const WHEEL = {
  size: 360,
  outerRadius: 176,        // burç halkası dış kenarı
  signRingInner: 150,      // burç halkası iç kenarı (çentikler buradan dışa)
  houseRingInner: 118,     // ev halkası iç kenarı
  planetRadius: 102,       // gezegen glifleri (ilk halka)
  planetRingStep: 15,      // çakışmada bir iç halkaya kayma
  planetRings: 3,
  planetMinSeparationDeg: 9,
  aspectRadius: 58,        // aspekt çizgilerinin uç çemberi
  tick: { minor: 3, five: 6, sign: 26 },
  glyphSize: 15,
  signGlyphSize: 14,
  houseNumberSize: 9,
  settleMs: 900,           // açılış animasyonu (docs/DESIGN.md: tek orkestre an)
};

export const TAP_TARGET_PX = 44;

// --- Metin bankası (docs/TEXTBANK.md) ---
export const SIGN_KEYS = [
  'aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo',
  'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces',
];
// MOON_PHASES_TR ile aynı sırada.
export const MOON_PHASE_IDS = ['new', 'crescent', 'first_quarter', 'gibbous', 'full', 'disseminating', 'last_quarter', 'balsamic'];
export const BANK = {
  files: ['planets-signs', 'planets-houses', 'aspects', 'archetypes', 'moon', 'ui-copy'],
  limits: { title: 40, hook: 140, body: 420, office: 160, natal: 420, synastry: 420, line: 160, archetypeLine: 140 },
  barnumMax: 0.9,
  // Klişe yasağı (docs/TEXTBANK.md). ui-copy.json hariç, küçük harfe indirilmiş metinde aranır.
  bannedWords: ['evren sana', 'enerjini', 'yıldızlar diyor ki', 'kozmik', 'ruhun', 'titreşim', 'manifest'],
};
