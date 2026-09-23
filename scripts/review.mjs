#!/usr/bin/env node
// Weekly review: parses log/ and prints a markdown summary for the week ending on --end (default today).
// Usage: node scripts/review.mjs [--end YYYY-MM-DD] [--root DIR]
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { isExercise, tokyoDate } from './lib/log-format.mjs';
import { addDays, day, e1rm, inRange, iso, muscleSets as countMuscleSets, readBody, readTraining } from './lib/log-data.mjs';

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
const end = day(arg('end') ?? tokyoDate());
const weekStart = addDays(end, -6);

// ---- body ----
const body = readBody(ROOT);
const avgWeight = (from, to) => {
  const xs = body.filter((b) => b.weight && inRange(b.date, from, to)).map((b) => b.weight);
  return xs.length ? { avg: xs.reduce((a, b) => a + b, 0) / xs.length, n: xs.length } : null;
};

// ---- training ----
const { sessions, problems } = readTraining(ROOT, exercises, body);

const bestE1rm = (id, from, to) => {
  const xs = sessions
    .filter((s) => inRange(s.date, from, to))
    .flatMap((s) => s.lifts.filter((l) => l.id === id).flatMap((l) => l.sets.map(e1rm)));
  return xs.length ? Math.max(...xs) : null;
};

const weekSessions = sessions.filter((s) => inRange(s.date, weekStart, end));
const muscleSets = countMuscleSets(weekSessions, exercises);

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
