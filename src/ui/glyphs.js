// Unicode glifler ve Türkçe adlar. U+FE0E: emoji değil metin olarak çiz.
const TEXT = '︎';

export const SIGN_GLYPHS = ['♈', '♉', '♊', '♋', '♌', '♍', '♎', '♏', '♐', '♑', '♒', '♓'].map((g) => g + TEXT);

export const BODY_GLYPHS = {
  sun: '☉' + TEXT, moon: '☽' + TEXT, mercury: '☿' + TEXT, venus: '♀' + TEXT, mars: '♂' + TEXT,
  jupiter: '♃' + TEXT, saturn: '♄' + TEXT, uranus: '♅' + TEXT, neptune: '♆' + TEXT, pluto: '♇' + TEXT,
  trueNode: '☊' + TEXT, chiron: '⚷' + TEXT, asc: 'AC', mc: 'MC',
};

export const BODY_NAMES_TR = {
  sun: 'Güneş', moon: 'Ay', mercury: 'Merkür', venus: 'Venüs', mars: 'Mars', jupiter: 'Jüpiter',
  saturn: 'Satürn', uranus: 'Uranüs', neptune: 'Neptün', pluto: 'Plüton', trueNode: 'Kuzey Düğüm',
  chiron: 'Chiron', asc: 'Yükselen', mc: 'Gökortası',
};

export const ASPECT_GLYPHS = { conjunction: '☌', sextile: '⚹', square: '□', trine: '△', opposition: '☍' };
export const ASPECT_NAMES_TR = { conjunction: 'kavuşum', sextile: 'altmışlık', square: 'kare', trine: 'üçgen', opposition: 'karşıt' };
export const HARD_ASPECTS = ['square', 'opposition'];

const MINUTES = 60;

// 13.694 → "13°41′"
export function formatDeg(deg) {
  const whole = Math.floor(deg);
  const minutes = Math.floor((deg - whole) * MINUTES);
  return `${whole}°${String(minutes).padStart(2, '0')}′`;
}
