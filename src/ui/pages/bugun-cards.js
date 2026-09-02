// Bugün: Ay, günün üç şeyi, retro sayacı kartları (HTML üreten saf fonksiyonlar).
import { SIGNS_TR } from '../../astro/chart.js';
import { MOON_PHASES_TR } from '../../config.js';
import { BODY_GLYPHS, BODY_NAMES_TR, ASPECT_GLYPHS, ASPECT_NAMES_TR, HARD_ASPECTS, SIGN_GLYPHS } from '../glyphs.js';
import { esc, card, stamp } from '../components.js';
import { barnumBadge } from './haritam-text.js';

const PERCENT = 100;
const DAY_MS = 86400000;
const JD_UNIX_EPOCH = 2440587.5;

export function jdToDate(jd) {
  return new Date((jd - JD_UNIX_EPOCH) * DAY_MS);
}

export function formatLocalTime(jd, tz) {
  return new Intl.DateTimeFormat('tr-TR', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(jdToDate(jd));
}

export function formatLocalDate(jd, tz) {
  return new Intl.DateTimeFormat('tr-TR', { timeZone: tz, day: 'numeric', month: 'short' }).format(jdToDate(jd));
}

// Pencere bugünle kesişiyorsa saat aralığı, yoksa yok mesajı.
function vocLine(daily, dayStartJd, dayEndJd, tz, bank) {
  const { voc } = daily;
  const overlaps = voc.start < dayEndJd && voc.end > dayStartJd;
  if (!overlaps) return `<p class="muted">${esc(bank.copy('bugun_voc_none'))}</p>`;
  const start = voc.start <= dayStartJd ? '00:00' : formatLocalTime(voc.start, tz);
  const end = voc.end >= dayEndJd ? '24:00' : formatLocalTime(voc.end, tz);
  return `<p class="band">${esc(bank.copy('bugun_voc_band', { start, end }))}</p>`;
}

export function moonCard(daily, ctx, bank) {
  const m = daily.moon;
  const head = `<p class="moon-head"><span class="glyph">${SIGN_GLYPHS[m.sign]}</span> Ay ${esc(SIGNS_TR[m.sign])} · ${esc(MOON_PHASES_TR[m.phase.index])}`
    + ` <span class="muted num">%${Math.round(m.phase.illumination * PERCENT)} ${esc(bank.copy('bugun_illumination'))}</span></p>`;
  const line = m.line ? `<p class="hook">${esc(m.line)}</p>${barnumBadge(m.barnum)}` : '';
  return card(bank.copy('bugun_moon_title'), head + line + vocLine(daily, ctx.dayStartJd, ctx.dayEndJd, ctx.tz, bank));
}

function transitTitle(t) {
  const cls = HARD_ASPECTS.includes(t.aspect) ? 'hard' : 'soft';
  return `<span class="glyph">${BODY_GLYPHS[t.a]}</span> <span class="asp ${cls}">${ASPECT_GLYPHS[t.aspect]}</span> <span class="glyph">${BODY_GLYPHS[t.b]}</span>`
    + ` ${esc(BODY_NAMES_TR[t.a])} ${esc(ASPECT_NAMES_TR[t.aspect])} ${esc(BODY_NAMES_TR[t.b])} <span class="muted num">orb ${t.orb.toFixed(1)}°${t.applying ? ' · yaklaşan' : ''}</span>`;
}

export function threeCard(daily, bank) {
  const items = daily.topThree.map((item, i) => `<section class="reading"><h3>${i + 1}. ${transitTitle(item.transit)}</h3>`
    + `<p class="hook">${esc(item.text)}</p><p class="scene">${esc(item.advice)}</p>${barnumBadge(item.barnum)}</section>`).join('');
  return card(bank.copy('bugun_three_title'), items || `<p class="muted">${esc(bank.copy('reading_missing'))}</p>`);
}

function retroLine(bank, key, seed, vars) {
  const entry = bank.get('retro', key);
  if (!entry) return '';
  const text = entry.v[seed % entry.v.length].replace(/\{(\w+)\}/g, (_, n) => String(vars[n] ?? ''));
  return `<p>${esc(text)}</p>${barnumBadge(entry.barnum)}`;
}

// status: retroStatus çıktısı (+ shadow), body 'mercury'.
export function retroCard(retro, ctx, bank) {
  const { status, shadow } = retro;
  let body = '';
  if (status.current) {
    const days = Math.ceil(status.daysLeft);
    body += `<p class="band band-hot">${esc(bank.copy('bugun_retro_now', { days }))} ${esc(bank.copy('bugun_retro_deploy'))}</p>`;
    body += retroLine(bank, days <= 3 ? 'mercury_end' : status.daysLeft > (status.current.end - status.current.start) - 3 ? 'mercury_start' : 'mercury_mid', ctx.seed, {});
  } else if (status.next) {
    const days = Math.ceil(status.daysUntil);
    const inPreShadow = shadow?.preStart && ctx.jdNow >= shadow.preStart;
    const inPostShadow = status.previous && retro.previousShadow?.postEnd && ctx.jdNow <= retro.previousShadow.postEnd;
    body += `<p>${esc(bank.copy('bugun_retro_next', { days, start: formatLocalDate(status.next.start, ctx.tz), end: formatLocalDate(status.next.end, ctx.tz) }))}</p>`;
    if (inPreShadow) body += retroLine(bank, 'mercury_shadow_pre', ctx.seed, {});
    else if (inPostShadow) body += retroLine(bank, 'mercury_shadow_post', ctx.seed, {});
    else body += retroLine(bank, 'mercury_countdown', ctx.seed, { days });
  }
  if (shadow?.preStart && shadow?.postEnd) {
    body += `<p class="muted small">${esc(bank.copy('bugun_retro_shadow', { pre: formatLocalDate(shadow.preStart, ctx.tz), post: formatLocalDate(shadow.postEnd, ctx.tz) }))}</p>`;
  }
  return card(bank.copy('bugun_retro_title'), body + (status.current ? stamp('deploy yapma') : ''), status.current ? 'retro-on' : '');
}
