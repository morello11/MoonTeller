// Burç aritmetiği. Saf mantık.

export const SIGNS_TR = [
  'Koç', 'Boğa', 'İkizler', 'Yengeç', 'Aslan', 'Başak',
  'Terazi', 'Akrep', 'Yay', 'Oğlak', 'Kova', 'Balık',
];

const FULL_CIRCLE = 360;
const SIGN_SPAN = FULL_CIRCLE / SIGNS_TR.length;

export function normalizeDegrees(deg) {
  return ((deg % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
}

export function signIndex(lon) {
  return Math.floor(normalizeDegrees(lon) / SIGN_SPAN);
}

export function degreeInSign(lon) {
  return normalizeDegrees(lon) % SIGN_SPAN;
}

export function signName(lon) {
  return SIGNS_TR[signIndex(lon)];
}
