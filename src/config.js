// Tüm ayarlanabilir sayılar ve seçimler burada. Kodun geri kalanında sihirli sayı yok.

// Swiss Ephemeris bayrak adları; engine.js bunları motor örneğinden çözer, sayı burada durmaz.
// SEFLG_MOSEPH: Moshier hesabı (gezegen/Ay efemeris dosyaları vendor paketinden çıkarıldı, fark < 0,001°).
// Dosyalı hesap istenirse 'SEFLG_SWIEPH' yaz ve scripts/repack-swisseph-data.js'teki DROP listesini küçült.
export const EPHEMERIS_FLAGS = ['SEFLG_MOSEPH', 'SEFLG_SPEED'];

// Ev sistemi harfi: 'P' Placidus (varsayılan), 'W' Whole Sign, 'O' Porphyry.
export const HOUSE_SYSTEM = 'P';

export const DEFAULT_TZ = 'Europe/Istanbul';
// "Bugün" ve Canlı Gökyüzü: telefonun saati, İstanbul yerel tarihi ve İstanbul ufku (docs/REVIEW.md 4). Doğum yeri değil.
export const TODAY = { tz: DEFAULT_TZ, lat: 41.01, lon: 28.98, label: 'İstanbul' };

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
  files: ['planets-signs', 'planets-houses', 'aspects', 'archetypes', 'moon', 'transits', 'retro', 'team', 'ui-copy'],
  limits: { title: 40, hook: 140, body: 420, scene: 160, natal: 420, synastry: 420, line: 160, archetypeLine: 140, transit: 200, advice: 120 },
  // Transit varyantları tek başına günün metni olur: en az bu kadar karakter, tam cümle.
  transitMin: 60,
  barnumMax: 0.9,
  // Klişe yasağı (docs/TEXTBANK.md). ui-copy.json hariç, küçük harfe indirilmiş metinde aranır.
  bannedWords: ['evren sana', 'enerjini', 'yıldızlar diyor ki', 'kozmik', 'ruhun', 'titreşim', 'manifest'],
};

// --- Arketip ve kompozisyon (docs/ENGINE.md 10, docs/TEXTBANK.md) ---
export const ARCHETYPE_WEIGHTS = { sun: 3, moon: 2, asc: 2, mercury: 1, mars: 1 }; // saat yoksa asc oy vermez
export const COMPOSE = { topAspects: 6 };
export const BANK_URL = 'data/tr/';

// --- Transitler ve Bugün (docs/ENGINE.md 5–9) ---
export const TRANSIT_WEIGHTS = {
  transit: { sun: 1.0, moon: 0.6, mercury: 0.7, venus: 0.8, mars: 0.9, jupiter: 0.8, saturn: 1.0, uranus: 0.7, neptune: 0.6, pluto: 0.7 },
  natal: { sun: 1.0, moon: 1.0, asc: 1.0, mc: 0.8, mercury: 0.8, venus: 0.8, mars: 0.8, jupiter: 0.5, saturn: 0.5, uranus: 0.5, neptune: 0.5, pluto: 0.5, trueNode: 0.4, chiron: 0.4 },
  aspect: { conjunction: 1.0, opposition: 0.9, square: 0.9, trine: 0.7, sextile: 0.5 },
};
export const TRANSIT = {
  transitingBodies: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto'],
  // Metin bankasında (transits.json) hedefi olan natal noktalar; diğerleri puanlanır ama "günün üç şeyi"ne seçilmez.
  textTargets: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc'],
  topCount: 3,
  localHour: 12, // "Bugün" hesap anı: hedef günün yerel öğlesi
};
// Plan Saati Skoru (docs/ENGINE.md 9; şaka dozunda). 0–100.
export const PLAN_SCORE = {
  base: 75,
  voidOfCourse: -40,
  mercuryRetro: -25,
  moonSaturnHard: -15,
  moonJupiterSoft: 15,
  marsMercuryHard: -10,
  elementFit: 10,
  verdicts: [[60, 'yap'], [40, 'olur'], [0, 'ertele']],
  // Plan türü → Ay burcunun elementi: uyan +elementFit, uymayan −elementFit.
  types: {
    toplanti: { label: 'Toplantı', good: 'air', bad: 'water' },
    bulusma: { label: 'Buluşma', good: 'fire', bad: 'earth' },
    yolculuk: { label: 'Yolculuk', good: 'fire', bad: 'water' },
    imza: { label: 'İmza / sözleşme', good: 'earth', bad: 'fire' },
    sunum: { label: 'Sunum', good: 'fire', bad: 'water' },
    deploy: { label: 'Deploy', good: 'earth', bad: 'air' },
  },
  footer: 'Gerçek işi yine de yap.',
};
export const ELEMENTS = ['fire', 'earth', 'air', 'water']; // burç index % 4
// Retro taraması (docs/REVIEW.md 13): yılda bir hesaplanır, cache'te tutulur.
export const RETRO = {
  bodies: ['mercury', 'venus', 'mars'],
  scanDaysBefore: 400,
  scanDaysAfter: 400,
  stepDays: 1,
  bisectPrecisionDays: 1 / 24,
  cacheNamespace: 'retro',
};
// Canlı Gökyüzü: çıplak gözle görülebilirlik yaklaşımı (doğuş/batış v2).
export const SKY = {
  nakedEye: ['mercury', 'venus', 'mars', 'jupiter', 'saturn'],
  minAltitudeDeg: 5,
  minSunElongationDeg: 15,
  nightSunAltitudeDeg: -6, // sivil alacakaranlık
};
export const DAILY_REPEAT_DAYS = 7;
// Retro metin evreleri: başlangıç/bitişe bu kadar gün kala 'start'/'end', arası 'mid'.
export const RETRO_PHASE_EDGE_DAYS = 3;

// --- Ekip (Adım 5): paylaşım linki, sinastri, bulaşma, haftanın çifti, kart ---
// Link: #p=<base64url JSON>. Doğum bilgisi linkte taşınır, sunucuya gitmez (hash parçası istek dışında kalır).
export const SHARE = { param: 'p', version: 1, nameMax: 40, coordDecimals: 4 };
// Sinastri (docs/ENGINE.md 8): aspekt katkıları %70 + Büyük Üçlü element/nitelik uyumu %30.
export const SYNASTRY = {
  bodies: ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'asc'],
  wBody: { sun: 1.0, moon: 1.0, venus: 0.9, mars: 0.9, asc: 0.8, mercury: 0.7, jupiter: 0.6, saturn: 0.6, uranus: 0.4, neptune: 0.4, pluto: 0.4 },
  // İşaretli katkı: uyumlu +, sert −. Kavuşum uyumlu sayılır; taraflardan biri conjunctionHard'daysa sert.
  wAspect: { conjunction: 1.0, trine: 0.8, sextile: 0.5, square: -0.8, opposition: -0.6 },
  conjunctionHard: { bodies: ['mars', 'saturn', 'pluto'], weight: -0.5 },
  aspectDamping: 1,          // az sayıda zayıf aspekt skoru uçlara savurmasın
  aspectShare: 0.7,
  bigThreeShare: 0.3,
  bigThree: ['sun', 'moon', 'asc'],
  elementSame: 1, elementCompatible: 0.5, modalitySame: 0.5, // çift başına en çok 1.5
  compatibleElements: { fire: 'air', air: 'fire', earth: 'water', water: 'earth' },
  topCount: 3,
  labels: [[60, 'high'], [45, 'mid'], [0, 'low']],
};
// Bugün kime bulaşma: hızlı cisimlerin (günden güne değişen) sert transit puan toplamı eşik üstünde olan üyeler.
// Yavaş gezegenler (Jüpiter–Plüton) aylarca aynı açıda kalır, "bugün" listesine girmez; Ay saatlik değişir, o da girmez.
export const CONTAGION = { hardAspects: ['square', 'opposition'], transitingBodies: ['sun', 'mercury', 'venus', 'mars'], threshold: 0.9, maxCount: 5 };
// Haftanın çifti: en yüksek skorlu ilk `candidates` çiftten ISO hafta seed'iyle biri.
export const WEEK_PAIR = { candidates: 3 };
export const TEAM_MAX = 30;
// Yıldızname Kartı (PNG, dikey; WhatsApp'ta tam görünür).
export const CARD = {
  width: 1080, height: 1350, margin: 72, wheelSize: 720,
  fontTitle: 64, fontBody: 40, fontSmall: 30, lineHeight: 1.3, maxLineChars: 42,
  fileName: 'yildizname-kart.png',
};
