// Haritam: yerleşim tablosu ve aspekt ızgarası (HTML üreten saf fonksiyonlar).
import { SIGNS_TR } from '../../astro/chart.js';
import { BODY_GLYPHS, BODY_NAMES_TR, ASPECT_GLYPHS, ASPECT_NAMES_TR, HARD_ASPECTS, formatDeg } from '../glyphs.js';
import { esc } from '../components.js';
import { signIndex, degreeInSign } from '../../astro/chart.js';

function placementRow(p, hasHouses) {
  const house = hasHouses && p.house ? p.house : '—';
  const retro = p.retrograde ? '<span class="retro" title="retro">℞</span>' : '';
  return `<tr><td><span class="glyph">${BODY_GLYPHS[p.body]}</span> ${esc(BODY_NAMES_TR[p.body])}${retro}</td>`
    + `<td>${esc(SIGNS_TR[p.sign])}</td><td class="num">${formatDeg(p.deg)}</td><td class="num">${house}</td></tr>`;
}

function angleRow(body, lon) {
  return `<tr><td><span class="glyph">${BODY_GLYPHS[body]}</span> ${esc(BODY_NAMES_TR[body])}</td>`
    + `<td>${esc(SIGNS_TR[signIndex(lon)])}</td><td class="num">${formatDeg(degreeInSign(lon))}</td><td class="num">—</td></tr>`;
}

export function placementsTable(chart) {
  const hasHouses = Boolean(chart.houses);
  const rows = chart.positions.map((p) => placementRow(p, hasHouses));
  if (hasHouses) rows.push(angleRow('asc', chart.houses.asc), angleRow('mc', chart.houses.mc));
  return `<div class="table-wrap"><table class="placements"><thead><tr><th>Cisim</th><th>Burç</th><th>Derece</th><th>Ev</th></tr></thead>`
    + `<tbody>${rows.join('')}</tbody></table></div>`;
}

// Üçgen matris: satır i (1..n-1) × sütun j (0..i-1).
export function aspectGrid(chart) {
  const bodies = [...chart.positions.map((p) => p.body), ...chart.angles.map((a) => a.body)];
  const lookup = new Map(chart.aspects.map((a) => [`${a.a}|${a.b}`, a]));
  const cell = (row, col) => {
    const a = lookup.get(`${col}|${row}`) ?? lookup.get(`${row}|${col}`);
    if (!a) return '<td></td>';
    const cls = HARD_ASPECTS.includes(a.aspect) ? 'hard' : 'soft';
    const title = `${BODY_NAMES_TR[row]} ${ASPECT_NAMES_TR[a.aspect]} ${BODY_NAMES_TR[col]}, orb ${a.orb.toFixed(1)}°`;
    return `<td class="asp ${cls}" title="${esc(title)}">${ASPECT_GLYPHS[a.aspect]}</td>`;
  };
  const rows = bodies.slice(1).map((row, i) => {
    const cells = bodies.slice(0, i + 1).map((col) => cell(row, col)).join('');
    return `<tr><th>${BODY_GLYPHS[row]}</th>${cells}</tr>`;
  });
  const head = `<tr><th></th>${bodies.slice(0, -1).map((b) => `<th>${BODY_GLYPHS[b]}</th>`).join('')}</tr>`;
  return `<div class="table-wrap"><table class="aspect-grid"><thead>${head}</thead><tbody>${rows.join('')}</tbody></table></div>`;
}

export function aspectList(chart) {
  const items = [...chart.aspects].sort((a, b) => b.strength - a.strength).map((a) => {
    const cls = HARD_ASPECTS.includes(a.aspect) ? 'hard' : 'soft';
    return `<li><span class="asp ${cls}">${ASPECT_GLYPHS[a.aspect]}</span> ${esc(BODY_NAMES_TR[a.a])} ${esc(ASPECT_NAMES_TR[a.aspect])} `
      + `${esc(BODY_NAMES_TR[a.b])} <span class="muted num">orb ${a.orb.toFixed(1)}°${a.applying ? ' · yaklaşan' : ''}</span></li>`;
  });
  return `<ol class="aspect-list">${items.join('')}</ol>`;
}
