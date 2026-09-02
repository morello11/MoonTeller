// Haritam sayfası: çark, Büyük Üçlü, yerleşimler, aspektler, Şüpheci Şerhi.
import { MOON_BOUNDARY_WARN_DEG, WHEEL } from '../../config.js';
import { SIGNS_TR, degreeInSign, signIndex } from '../../astro/chart.js';
import { renderWheel } from '../wheel.js';
import { card, stamp, serhBox, esc } from '../components.js';
import { BODY_GLYPHS, BODY_NAMES_TR, formatDeg } from '../glyphs.js';
import { placementsTable, aspectGrid, aspectList } from './haritam-tables.js';
import { composeNatal } from '../../text/compose.js';
import { selectedReading, archetypeCard, bigThreeReadings, placementReadings, aspectReadings } from './haritam-text.js';

const SIGN_SPAN = 30;
const HOURS_IN_DAY = 24;
const MINUTES = 60;

function bodyOf(chart, body) {
  return chart.positions.find((p) => p.body === body);
}

// Saat yoksa ve Ay burç sınırına yakınsa (docs/REVIEW.md 5).
function moonWarning(chart) {
  if (chart.timeKnown) return '';
  const moon = bodyOf(chart, 'moon');
  const near = moon.deg < MOON_BOUNDARY_WARN_DEG ? -1 : moon.deg > SIGN_SPAN - MOON_BOUNDARY_WARN_DEG ? 1 : 0;
  if (!near) return '';
  const other = SIGNS_TR[(moon.sign + near + 12) % 12];
  return `<p class="notice">Saat bilinmediği için Ay burcun ${esc(SIGNS_TR[moon.sign])} ya da ${esc(other)} olabilir; öğlen varsayımıyla ${esc(SIGNS_TR[moon.sign])} gösteriliyor.</p>`;
}

function bigThree(chart) {
  const sun = bodyOf(chart, 'sun');
  const moon = bodyOf(chart, 'moon');
  const item = (glyph, name, value, sub) => `<div class="big3-item"><span class="glyph">${glyph}</span><span class="big3-name">${esc(name)}</span>`
    + `<strong>${esc(value)}</strong><span class="muted">${esc(sub)}</span></div>`;
  const asc = chart.houses
    ? item(BODY_GLYPHS.asc, 'Yükselen', SIGNS_TR[signIndex(chart.houses.asc)], formatDeg(degreeInSign(chart.houses.asc)))
    : item(BODY_GLYPHS.asc, 'Yükselen', '—', 'saat gerekli');
  return `<div class="big3">${item(BODY_GLYPHS.sun, 'Güneş', SIGNS_TR[sun.sign], formatDeg(sun.deg))}`
    + `${item(BODY_GLYPHS.moon, 'Ay', SIGNS_TR[moon.sign], formatDeg(moon.deg))}${asc}</div>`;
}

function utLabel(chart) {
  const frac = chart.jdUT + 0.5;
  const dayFrac = frac - Math.floor(frac);
  const h = Math.floor(dayFrac * HOURS_IN_DAY);
  const m = Math.round((dayFrac * HOURS_IN_DAY - h) * MINUTES);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} UT`;
}

function serhRows(profile, chart, engineVersion) {
  const rows = [
    ['Hesap anı', `${profile.date} ${profile.time ?? '12:00 (varsayım)'} ${profile.tz} → ${utLabel(chart)}`],
    ['Julian Day (UT)', chart.jdUT.toFixed(5)],
    ['Konum', `${profile.lat.toFixed(2)}° K, ${profile.lon.toFixed(2)}° D (${profile.place || 'elle'})`],
    ['Ev sistemi', chart.houseSystem ? { P: 'Placidus', W: 'Whole Sign', O: 'Porphyry' }[chart.houseSystem] : 'yok (saat bilinmiyor)'],
    ['Motor', `Swiss Ephemeris ${engineVersion}, tropikal zodyak, Moshier hesabı`],
  ];
  for (const p of chart.positions) rows.push([BODY_NAMES_TR[p.body], `${p.lon.toFixed(4)}°, hız ${p.speed.toFixed(4)}°/gün`]);
  return rows;
}

function selectedInfo(state, body) {
  const item = body ? state.reading.placements.find((p) => p.body === body) : null;
  return selectedReading(item, state.bank);
}

export function render(state) {
  const { profile, chart, settings, bank } = state;
  state.reading = composeNatal(chart, bank);
  const r = state.reading;
  const sun = bodyOf(chart, 'sun');
  const moon = bodyOf(chart, 'moon');
  const head = `<section class="page-head"><h1>${esc(profile.name)}</h1><p class="muted">${BODY_GLYPHS.sun} ${esc(SIGNS_TR[sun.sign])} · ${BODY_GLYPHS.moon} ${esc(SIGNS_TR[moon.sign])}`
    + `${chart.houses ? ` · ${BODY_GLYPHS.asc} ${esc(SIGNS_TR[signIndex(chart.houses.asc)])}` : ''} ${chart.timeKnown ? '' : stamp('saat bilinmiyor')}</p></section>`;
  const wheelClass = state.wheelAnimated ? 'wheel-wrap' : 'wheel-wrap settling';
  const serhClass = settings.showSerh ? 'haritam serh-on' : 'haritam';
  return `<div class="${serhClass}" id="haritam">` + head
    + `<div class="${wheelClass}" id="wheel-wrap">${renderWheel(chart)}</div>`
    + `<div class="selected" id="selected">${selectedInfo(state, null)}</div>`
    + moonWarning(chart)
    + card('Büyük Üçlü', bigThree(chart))
    + archetypeCard(r.archetype, bank)
    + bigThreeReadings(r.bigThree, bank)
    + placementReadings(r.placements, bank)
    + aspectReadings(r.aspects, bank)
    + card('Yerleşimler', placementsTable(chart))
    + card('Aspektler', aspectGrid(chart) + aspectList(chart))
    + serhBox(serhRows(profile, chart, state.engineVersion), settings.showSerh, bank.copy('serh_summary'), bank.copy('serh_hint'))
    + `<p class="muted small">${esc(bank.copy('disclaimer'))}</p>`
    + `<p class="actions"><a class="button secondary" href="#/onboarding">${esc(bank.copy('edit_profile'))}</a></p></div>`;
}

function onPlanetActivate(root, state) {
  return (event) => {
    const planet = event.target.closest('.wheel-planet');
    if (!planet) return;
    if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    root.querySelectorAll('.wheel-planet.active').forEach((el) => el.classList.remove('active'));
    planet.classList.add('active');
    root.querySelector('#selected').innerHTML = selectedInfo(state, planet.dataset.body);
    root.querySelector('#selected').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  };
}

export function mount(root, state, actions) {
  const wrap = root.querySelector('#wheel-wrap');
  if (!state.wheelAnimated) {
    requestAnimationFrame(() => requestAnimationFrame(() => wrap.classList.remove('settling')));
    state.wheelAnimated = true;
  }
  const handler = onPlanetActivate(root, state);
  root.addEventListener('click', handler);
  root.addEventListener('keydown', handler);
  root.querySelector('.serh')?.addEventListener('toggle', (e) => {
    actions.setSerh(e.target.open);
    root.querySelector('#haritam').classList.toggle('serh-on', e.target.open);
  });
  return () => { root.removeEventListener('click', handler); root.removeEventListener('keydown', handler); };
}

export const settleMs = WHEEL.settleMs;
