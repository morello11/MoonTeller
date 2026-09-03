// Worker'a giden yerleşim özeti. Doğum tarihi/saati/yeri ve ad burada YOK; yalnızca burç/ev/aspekt etiketleri. Saf mantık.
import { LLM, MOON_PHASES_TR, TODAY } from '../config.js';
import { SIGNS_TR, signIndex } from '../astro/chart.js';
import { BODY_NAMES_TR, ASPECT_NAMES_TR } from '../ui/glyphs.js';
import { dailyTransits } from '../astro/transits.js';
import { computePositions, julianDayUT } from '../astro/engine.js';
import { localToUT } from '../astro/time.js';
import { moonPhase } from '../astro/moon.js';
import { isoWeekKey } from '../astro/team.js';

const ONE_DECIMAL = 10;
const DAY_MS = 86400000;
const WEEK_DAYS = 7;

const label = (aspect) => ({ a: BODY_NAMES_TR[aspect.a], aspect: ASPECT_NAMES_TR[aspect.aspect], b: BODY_NAMES_TR[aspect.b], orb: Math.round(aspect.orb * ONE_DECIMAL) / ONE_DECIMAL });

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
