// Worker'a giden yerleşim özeti. Doğum tarihi/saati/yeri ve ad burada YOK; yalnızca burç/ev/aspekt etiketleri. Saf mantık.
import { LLM, MOON_PHASES_TR, TODAY } from '../config.js';
import { SIGNS_TR, signIndex } from '../astro/chart.js';
import { BODY_NAMES_TR, ASPECT_NAMES_TR } from '../ui/glyphs.js';
import { dailyTransits } from '../astro/transits.js';
import { computePositions, julianDayUT } from '../astro/engine.js';
import { localToUT } from '../astro/time.js';
import { moonPhase } from '../astro/moon.js';
import { isoWeekKey } from '../astro/team.js';
import { pairKey } from '../astro/aspects.js';
import { synastryScore, topAspects } from '../astro/synastry.js';
import { archetypeSign } from '../astro/archetype.js';
import { signKey } from '../text/bank.js';

const ONE_DECIMAL = 10;
const DAY_MS = 86400000;
const WEEK_DAYS = 7;

const label = (aspect) => ({ a: BODY_NAMES_TR[aspect.a], aspect: ASPECT_NAMES_TR[aspect.aspect], b: BODY_NAMES_TR[aspect.b], orb: Math.round(aspect.orb * ONE_DECIMAL) / ONE_DECIMAL });

const bigThreeLabels = (chart) => {
  const sign = (body) => SIGNS_TR[chart.positions.find((p) => p.body === body).sign];
  const parts = [`Güneş ${sign('sun')}`, `Ay ${sign('moon')}`];
  if (chart.houses) parts.push(`Yükselen ${SIGNS_TR[signIndex(chart.houses.asc)]}`);
  return parts;
};

// Yorumlanacak parçanın odak verisi. ctx: { chart, daily, bank, team, data }; focusKey hedefe göre anahtar.
// Dönüş: { chart: özet, focus, sent: "Ne gördü?" satırı }. Doğum verisi ve (pair dışında) ad yok.
// sent, gidenin tamamını söyler: odak + her istekte giden harita özeti (yerleşim ve açı sayısı).
export function commentPayload(target, focusKey, ctx) {
  const focus = FOCUS_BUILDERS[target]?.(focusKey, ctx);
  if (!focus) throw new Error(`Odak kurulamadı: ${target}:${focusKey}`);
  const chart = chartSummary(ctx.chart);
  return { chart, focus, sent: `${describeFocus(target, focus)} · harita özeti (${chart.placements.length} yerleşim, ${chart.aspects.length} açı)` };
}

const FOCUS_BUILDERS = {
  chart: (_, { chart, bank }) => ({
    bigThree: bigThreeLabels(chart),
    aspects: [...chart.aspects].sort((x, y) => y.strength - x.strength).slice(0, LLM.chartAspects).map(label),
    archetype: bank?.get('archetypes', signKey(archetypeSign(chart)))?.title ?? '',
  }),
  placement: (body, { chart }) => {
    if (body === 'asc') return chart.houses ? { body: 'Yükselen', sign: SIGNS_TR[signIndex(chart.houses.asc)], house: null } : null;
    const p = chart.positions.find((x) => x.body === body);
    return p ? { body: BODY_NAMES_TR[p.body], sign: SIGNS_TR[p.sign], house: p.house ?? null } : null;
  },
  aspect: (key, { chart }) => { const a = chart.aspects.find((x) => pairKey(x) === key); return a ? label(a) : null; },
  today: (_, { chart, daily }) => dailySummary(chart, daily).daily,
  transit: (index, { daily }) => { const t = daily.topThree[Number(index)]; return t ? { ...label(t.transit), date: daily.dateISO } : null; },
  plan: (_, { data }) => data ?? null,
  pair: (key, { team }) => pairFocus(key, team),
  pairaspect: (key, { team }) => {
    const [idA, idB, aBody, aspectName, bBody] = key.split(':');
    const a = team?.members.find((m) => m.id === idA); const b = team?.members.find((m) => m.id === idB);
    if (!a || !b) return null;
    const hit = synastryScore(a.chart, b.chart).aspects.find((x) => x.a === aBody && x.aspect === aspectName && x.b === bBody);
    return hit ? { a: a.profile.name, b: b.profile.name, aspect: label(hit) } : null;
  },
};

function pairFocus(key, team, n = 3) {
  const [idA, idB] = key.split(':');
  const a = team?.members.find((m) => m.id === idA); const b = team?.members.find((m) => m.id === idB);
  if (!a || !b) return null;
  const r = synastryScore(a.chart, b.chart);
  return { a: a.profile.name, b: b.profile.name, score: r.score, aspects: topAspects(r.aspects, () => true, n).map(label) };
}

const asp = (x) => `${x.a} ${x.aspect} ${x.b}`;
// "Ne gördü?" için tek satır: Worker'a giden odak.
export function describeFocus(target, f) {
  switch (target) {
    case 'chart': return `${f.bigThree.join(' · ')} · ${f.aspects.length} açı · rol ${f.archetype}`;
    case 'placement': return `${f.body} ${f.sign}${f.house ? ` ${f.house}. ev` : ''}`;
    case 'aspect': case 'transit': return `${asp(f)} (orb ${f.orb}°)`;
    case 'today': return `${f.date}: Ay ${f.moon.sign}, ${f.moon.phase} · ${f.transits.map(asp).join(' · ')}`;
    case 'plan': return `${f.type}, ${f.when} · skor ${f.score} (${f.verdict})`;
    case 'pair': return `${f.a} & ${f.b} · ${f.score} · ${f.aspects.map(asp).join(' · ')}`;
    case 'pairaspect': return `${f.a} ${f.aspect.a} ${f.aspect.aspect} ${f.b} ${f.aspect.b}`;
    default: return '';
  }
}

export function chartSummary(chart) {
  const aspects = [...chart.aspects].sort((x, y) => y.strength - x.strength).slice(0, LLM.summaryAspects).map(label);
  return {
    timeKnown: chart.timeKnown,
    asc: chart.houses ? SIGNS_TR[signIndex(chart.houses.asc)] : null,
    placements: chart.positions.map((p) => ({ body: BODY_NAMES_TR[p.body], sign: SIGNS_TR[p.sign], house: p.house ?? null })),
    aspects,
  };
}

// daily: composeDaily çıktısı.
export function dailySummary(chart, daily) {
  return {
    ...chartSummary(chart),
    daily: {
      date: daily.dateISO,
      moon: { phase: MOON_PHASES_TR[daily.moon.phase.index], sign: SIGNS_TR[daily.moon.sign] },
      transits: daily.topThree.map((t) => label(t.transit)),
    },
  };
}

function addDays(dateISO, n) {
  const [y, m, d] = dateISO.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d) + n * DAY_MS).toISOString().slice(0, 10);
}

function weekStart(dateISO) {
  const [y, m, d] = dateISO.split('-').map(Number);
  const day = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % WEEK_DAYS; // Pazartesi 0
  return addDays(dateISO, -day);
}

function daySummary(chart, dateISO) {
  const jd = julianDayUT(localToUT(dateISO, '12:00', TODAY.tz));
  const [sun, moon] = computePositions(jd, ['sun', 'moon']);
  const transits = dailyTransits(chart, jd).slice(0, LLM.weeklyTransitsPerDay).map(label);
  return { date: dateISO, moon: { phase: MOON_PHASES_TR[moonPhase(sun.lon, moon.lon).index], sign: SIGNS_TR[signIndex(moon.lon)] }, transits };
}

// team: ensureTeam çıktısı ({ members, weekPair, contagion }) ya da null. Adlar yalnızca bülten için (ekip zaten biliyor).
export function weeklySummary(chart, team, dateISO) {
  const start = weekStart(dateISO);
  const days = Array.from({ length: LLM.weeklyDays }, (_, i) => daySummary(chart, addDays(start, i)));
  const nameOf = (id) => team?.members.find((m) => m.id === id)?.profile.name ?? '';
  const pair = team?.weekPair ? { a: nameOf(team.weekPair.a), b: nameOf(team.weekPair.b), score: team.weekPair.score } : null;
  const top = team?.contagion?.[0];
  const watch = top ? { name: nameOf(top.id), transit: `${BODY_NAMES_TR[top.top.a]} ${ASPECT_NAMES_TR[top.top.aspect]} ${BODY_NAMES_TR[top.top.b]}` } : null;
  return { ...chartSummary(chart), weekly: { week: isoWeekKey(dateISO), days, pair, watch, teamSize: team?.members.length ?? 1 } };
}
