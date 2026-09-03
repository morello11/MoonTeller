// Haritam: yorum kartları (banka metinleri). HTML üreten saf fonksiyonlar.
import { SIGNS_TR } from '../../astro/chart.js';
import { BODY_GLYPHS, BODY_NAMES_TR, ASPECT_GLYPHS, ASPECT_NAMES_TR, HARD_ASPECTS } from '../glyphs.js';
import { esc, card } from '../components.js';
import { barnumLabel } from '../../text/bank.js';
import { sealedRow } from '../commentary-html.js';

export function barnumBadge(score) {
  if (typeof score !== 'number') return '';
  return `<span class="barnum" title="Barnum puanı: bu metin ne kadar herkese uyar">${esc(barnumLabel(score))}</span>`;
}

function readingBody(entry, house, bank) {
  if (!entry) return `<p class="muted">${esc(bank.copy('reading_missing'))}</p>`;
  let html = `<p class="hook">${esc(entry.hook)}</p><p>${esc(entry.body)}</p><p class="scene">${esc(entry.scene)}</p>${barnumBadge(entry.barnum)}`;
  if (house) {
    html += `<p class="hook house-hook">${esc(house.hook)}</p><p>${esc(house.body)}</p><p class="scene">${esc(house.scene)}</p>${barnumBadge(house.barnum)}`;
  }
  return html;
}

function placementTitle(item) {
  const houseLabel = item.houseNumber ? ` · ${item.houseNumber}. ev` : '';
  return `${BODY_GLYPHS[item.body]} ${esc(BODY_NAMES_TR[item.body])} · ${esc(SIGNS_TR[item.sign])}${houseLabel}`;
}

// Gezegene dokununca gösterilen kutu.
export function selectedReading(item, bank) {
  if (!item) return `<p class="muted">${esc(bank.copy('reading_tap_hint'))}</p>`;
  return `<h3>${placementTitle(item)}</h3>${readingBody(item.entry, item.house, bank)}`;
}

export function archetypeCard(archetype, bank) {
  const e = archetype.entry;
  if (!e) return card(bank.copy('reading_role_title'), `<p class="muted">${esc(bank.copy('reading_missing'))}</p>`);
  const lines = e.lines.map((l) => `<li>${esc(l)}</li>`).join('');
  const rows = [e.meeting, e.mail, e.crisis].map((t) => `<p class="scene">${esc(t)}</p>`).join('');
  const body = `<p class="role-title">${esc(e.title)} <span class="muted">· ${esc(e.emblem)} · ${esc(SIGNS_TR[archetype.sign])}</span></p>`
    + `<ul class="role-lines">${lines}</ul>${rows}${barnumBadge(e.barnum)}`;
  return card(bank.copy('reading_role_title'), body, 'role-card');
}

export function bigThreeReadings(items, bank) {
  const blocks = items.map((item) => `<section class="reading"><h3>${placementTitle(item)}</h3>${readingBody(item.entry, null, bank)}</section>`);
  return card(bank.copy('reading_big3_title'), blocks.join(''));
}

export function placementReadings(items, state) {
  const bank = state.bank;
  const blocks = items.map((item) => sealedRow(state, 'placement', item.body, `${bank.copy('yorumcu_yorumlat')}: ${BODY_NAMES_TR[item.body]} ${SIGNS_TR[item.sign]}`,
    `<details class="reading"><summary>${placementTitle(item)}</summary>${readingBody(item.entry, item.house, bank)}</details>`));
  return card(bank.copy('reading_placements_title'), blocks.join(''));
}

export function aspectReadings(items, state) {
  const bank = state.bank;
  const blocks = items.map(({ aspect, key, entry }) => {
    const cls = HARD_ASPECTS.includes(aspect.aspect) ? 'hard' : 'soft';
    const name = `${BODY_NAMES_TR[aspect.a]} ${ASPECT_NAMES_TR[aspect.aspect]} ${BODY_NAMES_TR[aspect.b]}`;
    const title = `<span class="asp ${cls}">${ASPECT_GLYPHS[aspect.aspect]}</span> ${esc(name)} <span class="muted num">orb ${aspect.orb.toFixed(1)}°</span>`;
    return sealedRow(state, 'aspect', key, `${bank.copy('yorumcu_yorumlat')}: ${name}`, `<details class="reading"><summary>${title}</summary><p>${esc(entry.natal)}</p>${barnumBadge(entry.barnum)}</details>`);
  });
  return card(bank.copy('reading_aspects_title'), blocks.join(''));
}
