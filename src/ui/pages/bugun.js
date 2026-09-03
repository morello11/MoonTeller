// Bugün sayfası: Ay, günün üç şeyi, retro sayacı, plan skoru, canlı gökyüzü, şerh.
import { PLAN_SCORE, TODAY } from '../../config.js';
import { SIGNS_TR, degreeInSign } from '../../astro/chart.js';
import { julianDayUT } from '../../astro/engine.js';
import { localToUT } from '../../astro/time.js';
import { evaluatePlan } from '../../astro/transits.js';
import { liveSky } from '../../astro/sky.js';
import { workerConfigured } from '../../llm/client.js';
import { esc, card, serhBox } from '../components.js';
import { BODY_GLYPHS, BODY_NAMES_TR, ASPECT_NAMES_TR, formatDeg } from '../glyphs.js';
import { moonCard, threeCard, retroCard, formatLocalTime } from './bugun-cards.js';

function dateHeading(dateISO, tz) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d, 12));
  return new Intl.DateTimeFormat('tr-TR', { timeZone: tz, weekday: 'short', day: 'numeric', month: 'long' }).format(date);
}

function planForm(bank, defaultValue) {
  const options = Object.entries(PLAN_SCORE.types).map(([k, t]) => `<option value="${k}">${esc(t.label)}</option>`).join('');
  return `<form id="plan-form" class="form plan-form"><p class="muted">${esc(bank.copy('bugun_plan_hint'))}</p>`
    + `<label class="field"><span>Tarih ve saat</span><input name="when" type="datetime-local" value="${esc(defaultValue)}" required></label>`
    + `<label class="field"><span>Plan türü</span><select name="type">${options}</select></label>`
    + `<p class="actions"><button type="submit" class="button">${esc(bank.copy('bugun_plan_button'))}</button></p></form><div id="plan-result"></div>`;
}

function planResult(result, bank) {
  const reasons = result.reasons.map((r) => `<li>${esc(r.label)} <span class="num ${r.delta < 0 ? 'hard' : 'soft'}">${r.delta > 0 ? '+' : ''}${r.delta}</span></li>`).join('');
  return `<div class="plan-score score-${result.verdict}"><span class="score-num">${result.score}</span><span class="score-verdict">${esc(bank.copy(`bugun_plan_verdict_${result.verdict}`))}</span></div>`
    + `<ul class="reasons">${reasons || '<li class="muted">Gökyüzünde itiraz yok.</li>'}</ul><p class="scene">${esc(result.footer)}</p>`;
}

function skyCard(sky, bank) {
  const rows = sky.bodies.map((b) => {
    const state = b.visible ? bank.copy('bugun_sky_visible') : b.aboveHorizon ? bank.copy('bugun_sky_above') : bank.copy('bugun_sky_below');
    return `<tr><td><span class="glyph">${BODY_GLYPHS[b.body]}</span> ${esc(BODY_NAMES_TR[b.body])}${b.retrograde ? '<span class="retro">℞</span>' : ''}</td>`
      + `<td>${esc(SIGNS_TR[b.sign])} <span class="num">${formatDeg(b.deg)}</span></td><td class="${b.visible ? 'soft' : 'muted'}">${esc(state)}</td></tr>`;
  }).join('');
  const note = sky.isNight ? bank.copy('bugun_sky_night') : bank.copy('bugun_sky_day');
  return card(bank.copy('bugun_sky_title'), `<p class="muted small">${esc(note)}</p><div class="table-wrap"><table class="placements"><tbody>${rows}</tbody></table></div>`);
}

function serhRows(daily, ctx) {
  const rows = [
    ['Hesap anı', `${daily.dateISO} 12:00 ${ctx.tz} → JD ${ctx.jdNoon.toFixed(4)}`],
    ['Canlı gökyüzü konumu', `${TODAY.label} ${TODAY.lat}° K, ${TODAY.lon}° D`],
    ['Ay boşlukta (UT)', `${formatLocalTime(daily.voc.start, 'UTC')} – ${formatLocalTime(daily.voc.end, 'UTC')}${daily.voc.hasExact ? '' : ' (burçta tam aspekt yok)'}`],
    ['Seed', String(daily.seed)],
  ];
  for (const t of daily.transits.slice(0, 12)) {
    rows.push([`${BODY_NAMES_TR[t.a]} ${ASPECT_NAMES_TR[t.aspect]} ${BODY_NAMES_TR[t.b]}`, `orb ${t.orb.toFixed(2)}°, güç ${t.strength.toFixed(2)}, puan ${t.score.toFixed(3)}`]);
  }
  return rows;
}

// Ayardan açılır; Worker ayarlıysa sayfa boyandıktan sonra doldurulur (UI bekletilmez).
function synthesisCard(state) {
  if (!state.settings.dailySynthesis || !workerConfigured()) return '';
  return card(state.bank.copy('bugun_synthesis_title'), `<p id="synthesis" class="muted">${esc(state.bank.copy('bugun_synthesis_busy'))}</p>`);
}

function fillSynthesis(root, state, actions) {
  const el = root.querySelector('#synthesis');
  if (!el) return () => {};
  let alive = true;
  actions.llm('daily').then((r) => {
    if (!alive) return;
    el.textContent = r.ok ? r.text : state.bank.copy('bugun_synthesis_none');
    el.classList.toggle('muted', !r.ok);
  });
  return () => { alive = false; };
}

function localNowValue(tz) {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date()).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}

export function render(state) {
  const { daily, bank } = state;
  const ctx = daily.ctx;
  const sky = liveSky(ctx.jdNow, TODAY.lat, TODAY.lon);
  return `<div class="bugun ${state.settings.showSerh ? 'serh-on' : ''}" id="bugun">`
    + `<section class="page-head"><h1>${esc(dateHeading(daily.dateISO, ctx.tz))}</h1></section>`
    + moonCard(daily, ctx, bank)
    + threeCard(daily, bank)
    + synthesisCard(state)
    + retroCard(state.retro, ctx, bank)
    + card(bank.copy('bugun_plan_title'), planForm(bank, localNowValue(ctx.tz)))
    + skyCard(sky, bank)
    + serhBox(serhRows(daily, ctx), state.settings.showSerh, bank.copy('bugun_serh_title'), bank.copy('serh_hint'))
    + `<p class="muted small">${esc(bank.copy('disclaimer'))}</p></div>`;
}

export function mount(root, state, actions) {
  const form = root.querySelector('#plan-form');
  const out = root.querySelector('#plan-result');
  const ctx = state.daily.ctx;
  const onSubmit = (e) => {
    e.preventDefault();
    const [date, time] = form.elements.when.value.split('T');
    const jd = julianDayUT(localToUT(date, time, ctx.tz));
    out.innerHTML = planResult(evaluatePlan(jd, form.elements.type.value), state.bank);
  };
  form.addEventListener('submit', onSubmit);
  const stopSynthesis = fillSynthesis(root, state, actions);
  root.querySelector('.serh')?.addEventListener('toggle', (e) => {
    actions.setSerh(e.target.open);
    root.querySelector('#bugun').classList.toggle('serh-on', e.target.open);
  });
  return () => { form.removeEventListener('submit', onSubmit); stopSynthesis(); };
}
