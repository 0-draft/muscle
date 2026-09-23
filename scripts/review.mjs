#!/usr/bin/env node
// Weekly review: parses log/ and prints a markdown summary for the week ending on --end (default today).
// Usage: node scripts/review.mjs [--end YYYY-MM-DD] [--root DIR]
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { SET, isExercise, tokyoDate } from './lib/log-format.mjs';

const arg = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

// --root lets tests point the script at a fixture tree with its own log/ and data/.
const ROOT = arg('root') ? resolve(arg('root')) : new URL('..', import.meta.url).pathname;
const exercises = JSON.parse(readFileSync(join(ROOT, 'data/exercises.json'), 'utf8'));
const PLANNED_SESSIONS = 2;
// 2-day restart program aims for 8–12 fractional sets per muscle; above 20 adds little (knowledge/volume-frequency).
const TARGET = { min: 8, max: 20 };
const day = (s) => new Date(`${s}T00:00:00Z`);
const iso = (d) => d.toISOString().slice(0, 10);
const addDays = (d, n) => new Date(d.getTime() + n * 86400000);

const end = day(arg('end') ?? tokyoDate());
const weekStart = addDays(end, -6);
const inRange = (d, from, to) => d >= from && d <= to;

// ---- body ----
const body = existsSync(join(ROOT, 'log/body.csv'))
  ? readFileSync(join(ROOT, 'log/body.csv'), 'utf8')
      .trim()
      .split('\n')
      .slice(1)
      .filter(Boolean)
      .map((l) => {
        const [date, w, waist] = l.split(',');
        return { date: day(date), weight: w ? Number(w) : null, waist: waist ? Number(waist) : null };
      })
      .sort((a, b) => a.date - b.date)
  : [];
// Bodyweight sets use the most recent weigh-in on or before the session, so gaining weight
// doesn't inflate this week's pull-up e1RM against earlier weeks.
const weightOn = (date) => [...body].reverse().find((b) => b.weight && b.date <= date)?.weight ?? body.find((b) => b.weight)?.weight ?? 0;
const avgWeight = (from, to) => {
  const xs = body.filter((b) => b.weight && inRange(b.date, from, to)).map((b) => b.weight);
  return xs.length ? { avg: xs.reduce((a, b) => a + b, 0) / xs.length, n: xs.length } : null;
};

// ---- training ----
const sessions = [];
const problems = [];
const dir = join(ROOT, 'log/training');
for (const f of existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.txt')).sort() : []) {
  let cur = null;
  readFileSync(join(dir, f), 'utf8')
    .split('\n')
    .forEach((raw, i) => {
      const line = raw.trim();
      if (!line || line.startsWith('#')) return;
      const head = line.match(/^(\d{4}-\d{2}-\d{2})\s*(.*)$/);
      if (head) {
        cur = { date: day(head[1]), name: head[2], lifts: [] };
        sessions.push(cur);
        return;
      }
      const [id, ...tokens] = line.split(/\s+/);
      if (!cur) return problems.push(`${f}:${i + 1} exercise before any session header`);
      if (!isExercise(exercises, id)) problems.push(`${f}:${i + 1} unknown exercise id "${id}" (add it to data/exercises.json)`);
      const sets = [];
      for (const tok of tokens) {
        const m = tok.match(SET);
        if (!m) {
          problems.push(`${f}:${i + 1} can't read set "${tok}"`);
          continue;
        }
        const [, load, reps, rir] = m;
        const kg = load.startsWith('bw') ? weightOn(cur.date) + Number(load.split('+')[1] ?? 0) : Number(load);
        sets.push({ kg, reps: Number(reps), rir: rir === undefined ? null : Number(rir) });
      }
      cur.lifts.push({ id, sets });
    });
}

// Epley with reps-in-reserve added back; a set without RIR is treated as taken to failure (conservative).
const e1rm = (s) => s.kg * (1 + (s.reps + (s.rir ?? 0)) / 30);
const bestE1rm = (id, from, to) => {
  const xs = sessions
    .filter((s) => inRange(s.date, from, to))
    .flatMap((s) => s.lifts.filter((l) => l.id === id).flatMap((l) => l.sets.map(e1rm)));
  return xs.length ? Math.max(...xs) : null;
};

const weekSessions = sessions.filter((s) => inRange(s.date, weekStart, end));
const muscleSets = {};
for (const s of weekSessions)
  for (const l of s.lifts) {
    if (!isExercise(exercises, l.id)) continue;
    const ex = exercises[l.id];
    for (const m of ex.primary) muscleSets[m] = (muscleSets[m] ?? 0) + l.sets.length;
    for (const m of ex.secondary) muscleSets[m] = (muscleSets[m] ?? 0) + 0.5 * l.sets.length;
  }

// ---- output ----
const out = [];
const fmt = (n, d = 1) => (n === null ? '–' : n.toFixed(d));
out.push(`# Weekly review ${iso(weekStart)} to ${iso(end)}`, '');

out.push('## Logging', '');
const weighIns = body.filter((b) => b.weight && inRange(b.date, weekStart, end)).length;
out.push(`- Sessions logged: ${weekSessions.length} / ${PLANNED_SESSIONS} planned`);
out.push(`- Weigh-ins: ${weighIns} / 7`);
const prevSessions = sessions.filter((s) => inRange(s.date, addDays(weekStart, -7), addDays(weekStart, -1))).length;
if (weekSessions.length < PLANNED_SESSIONS && prevSessions < PLANNED_SESSIONS)
  out.push('- Fewer sessions than planned two weeks running. Worth checking whether the schedule still fits.');
out.push('');

out.push('## Body weight', '');
const thisW = avgWeight(weekStart, end);
const prevW = avgWeight(addDays(weekStart, -7), addDays(weekStart, -1));
if (thisW) {
  out.push(`- 7-day average: ${fmt(thisW.avg, 2)} kg (${thisW.n} readings)`);
  if (prevW) {
    const diff = thisW.avg - prevW.avg;
    out.push(`- Change from last week: ${diff >= 0 ? '+' : ''}${fmt(diff, 2)} kg (${fmt((diff / prevW.avg) * 100, 2)}% per week)`);
  }
} else out.push('- No weigh-ins this week.');
const waist = [...body].reverse().find((b) => b.waist);
if (waist) out.push(`- Last waist measurement: ${waist.waist} cm on ${iso(waist.date)}`);
out.push('');

out.push('## Weekly sets per muscle', '', `Secondary muscles count as 0.5 per set. Target range is ${TARGET.min}–${TARGET.max}.`, '');
out.push('| Muscle | Sets | Status |', '| --- | --- | --- |');
for (const [m, n] of Object.entries(muscleSets).sort((a, b) => b[1] - a[1])) {
  const status = n < TARGET.min ? 'below range' : n > TARGET.max ? 'above range' : 'in range';
  out.push(`| ${m} | ${fmt(n)} | ${status} |`);
}
if (!Object.keys(muscleSets).length) out.push('| – | 0 | no sessions logged |');
out.push('');

out.push('## Lifts', '', 'Best estimated 1RM this week vs the two weeks before. e1RM = load × (1 + (reps + RIR) / 30).', '');
out.push('| Exercise | This week | Previous 2 weeks | Trend |', '| --- | --- | --- | --- |');
const ids = [...new Set(weekSessions.flatMap((s) => s.lifts.map((l) => l.id)))];
for (const id of ids) {
  const now = bestE1rm(id, weekStart, end);
  const before = bestE1rm(id, addDays(weekStart, -14), addDays(weekStart, -1));
  let trend = 'new';
  if (before !== null && now !== null) trend = now > before * 1.005 ? 'up (PR window)' : now < before * 0.97 ? 'down' : 'flat';
  out.push(`| ${isExercise(exercises, id) ? exercises[id].en : id} | ${fmt(now)} | ${fmt(before)} | ${trend} |`);
}
out.push('');

if (problems.length) {
  out.push('## Log problems', '');
  for (const p of problems) out.push(`- ${p}`);
  out.push('');
}

process.stdout.write(out.join('\n'));
