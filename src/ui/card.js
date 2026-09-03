// Yıldızname Kartı: çark SVG + Büyük Üçlü + rol + günün cümlesi → Canvas → PNG blob; paylaş ya da indir.
import { CARD } from '../config.js';
import { renderWheel } from './wheel.js';
import { SIGNS_TR, signIndex } from '../astro/chart.js';
import { archetypeSign } from '../astro/archetype.js';
import { signKey } from '../text/bank.js';
import { BODY_GLYPHS } from './glyphs.js';

const COLORS = { ink: '#101B33', brass: '#C8A24A', ivory: '#EFE6D2', mist: 'rgba(239,230,210,.55)', line: 'rgba(200,162,74,.35)', red: '#B4452B', green: '#4E8C7A' };
const FONT_TITLE = 'Fraunces, Georgia, serif';
const FONT_BODY = 'Manrope, system-ui, sans-serif';
const SVG_NS = 'http://www.w3.org/2000/svg';
// Çark CSS'i sayfadan gelmez; görsele gömülür.
const WHEEL_STYLE = `.wheel-ring{fill:none;stroke:${COLORS.line};stroke-width:.8}.tick{stroke:${COLORS.brass};stroke-width:.6;opacity:.7}`
  + `.tick-five{stroke-width:.9;opacity:.9}.tick-sign{stroke-width:1.2;opacity:1}.sign-glyph,.planet-glyph,.house-number,.retro-mark{fill:${COLORS.brass};text-anchor:middle;dominant-baseline:central;font-family:${FONT_BODY}}`
  + `.house-number{fill:${COLORS.mist}}.house-line{stroke:${COLORS.line};stroke-width:.8}.house-axis{stroke:${COLORS.brass};stroke-width:1.6}.degree-mark{stroke:${COLORS.brass};stroke-width:1}`
  + `.aspect{stroke-width:.9}.aspect-soft{stroke:${COLORS.green}}.aspect-hard{stroke:${COLORS.red}}.wheel-planet{transform:translate(var(--x),var(--y))}.hit{fill:transparent}.retro-mark{font-size:8px;fill:${COLORS.red}}`;

function wheelImage(chart) {
  const svg = renderWheel(chart).replace('<svg ', `<svg xmlns="${SVG_NS}" `).replace('>', `><style>${WHEEL_STYLE}</style>`);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Çark görseli çizilemedi.'));
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  });
}

// Kelime kaydırma: satır başına en çok maxChars.
export function wrapLines(text, maxChars = CARD.maxLineChars) {
  const lines = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (line && (line + ' ' + word).length > maxChars) { lines.push(line); line = word; } else line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  return lines;
}

function bigThree(chart) {
  const sign = (body) => SIGNS_TR[chart.positions.find((p) => p.body === body).sign];
  const parts = [`${BODY_GLYPHS.sun} ${sign('sun')}`, `${BODY_GLYPHS.moon} ${sign('moon')}`];
  if (chart.houses) parts.push(`AC ${SIGNS_TR[signIndex(chart.houses.asc)]}`);
  return parts.join('   ·   ');
}

function todayLine(state) {
  const d = state.daily;
  if (d?.topThree?.[0]) return d.topThree[0].text;
  return d?.moon?.line ?? '';
}

function drawText(ctx, text, x, y, { size, font, color, align = 'center' }) {
  ctx.font = `${size}px ${font}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function drawLines(ctx, lines, x, y, opts) {
  lines.forEach((l, i) => drawText(ctx, l, x, y + i * opts.size * CARD.lineHeight, opts));
  return y + lines.length * opts.size * CARD.lineHeight;
}

export async function makeCardBlob(state) {
  const { chart, profile, bank } = state;
  const { width, height, margin, wheelSize } = CARD;
  const [img] = await Promise.all([wheelImage(chart), document.fonts?.ready ?? Promise.resolve()]);
  const canvas = document.createElement('canvas');
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = COLORS.ink; ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = COLORS.line; ctx.lineWidth = 2; ctx.strokeRect(margin / 2, margin / 2, width - margin, height - margin);
  const cx = width / 2;
  let y = margin + CARD.fontTitle;
  drawText(ctx, profile.name, cx, y, { size: CARD.fontTitle, font: FONT_TITLE, color: COLORS.ivory });
  y += CARD.fontBody * CARD.lineHeight;
  drawText(ctx, bigThree(chart), cx, y, { size: CARD.fontBody, font: FONT_BODY, color: COLORS.brass });
  ctx.drawImage(img, cx - wheelSize / 2, y + margin / 2, wheelSize, wheelSize);
  y += margin / 2 + wheelSize + CARD.fontBody * CARD.lineHeight;
  const role = bank.get('archetypes', signKey(archetypeSign(chart)));
  if (role) drawText(ctx, `${role.title} · ${role.emblem}`, cx, y, { size: CARD.fontBody, font: FONT_TITLE, color: COLORS.brass });
  y += CARD.fontBody * CARD.lineHeight;
  drawLines(ctx, wrapLines(todayLine(state)).slice(0, 4), cx, y, { size: CARD.fontSmall, font: FONT_BODY, color: COLORS.ivory });
  drawText(ctx, 'Yıldızname · geyik, karar aracı değil', cx, height - margin, { size: CARD.fontSmall * 0.8, font: FONT_BODY, color: COLORS.mist });
  return new Promise((resolve, reject) => canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG üretilemedi.'))), 'image/png'));
}

// Telefonda Paylaş menüsü (WhatsApp), yoksa indirme.
export async function shareBlob(blob) {
  const file = new File([blob], CARD.fileName, { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) { await navigator.share({ files: [file], title: 'Yıldızname' }); return 'shared'; }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = CARD.fileName; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return 'downloaded';
}
