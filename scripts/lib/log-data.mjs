// Reads log/ into plain data. Shared by scripts/review.mjs and the site (at build time), so the
// weekly numbers and the progress pages can never disagree.
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { SET, isExercise } from './log-format.mjs';

export const day = (s) => new Date(`${s}T00:00:00Z`);
export const iso = (d) => d.toISOString().slice(0, 10);
export const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
export const inRange = (d, from, to) => d >= from && d <= to;

/** log/body.csv → [{ date, weight, waist }] sorted by date. */
export function readBody(root) {
  const file = join(root, 'log/body.csv');
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8')
    .trim()
    .split('\n')
    .slice(1)
    .filter(Boolean)
    .map((l) => {
      const [date, w, waist] = l.split(',');
      return { date: day(date), weight: w ? Number(w) : null, waist: waist ? Number(waist) : null };
    })
    .sort((a, b) => a.date - b.date);
}

/** Most recent weigh-in on or before a date (falls back to the first weigh-in, then 0). */
export const weightOn = (body, date) =>
  [...body].reverse().find((b) => b.weight && b.date <= date)?.weight ?? body.find((b) => b.weight)?.weight ?? 0;

/** log/training/*.txt → { sessions: [{ date, name, lifts: [{ id, sets: [{ kg, reps, rir }] }] }], problems }. */
export function readTraining(root, exercises, body = []) {
  const sessions = [];
  const problems = [];
  const dir = join(root, 'log/training');
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
          // Bodyweight sets use the weigh-in on or before the session, so gaining weight
          // doesn't inflate this week's pull-up e1RM against earlier weeks.
          const kg = load.startsWith('bw') ? weightOn(body, cur.date) + Number(load.split('+')[1] ?? 0) : Number(load);
          sets.push({ kg, reps: Number(reps), rir: rir === undefined ? null : Number(rir), bw: load.startsWith('bw') });
        }
        cur.lifts.push({ id, sets });
      });
  }
  sessions.sort((a, b) => a.date - b.date);
  return { sessions, problems };
}

/** Epley with reps-in-reserve added back; a set without RIR counts as taken to failure (conservative). */
export const e1rm = (s) => s.kg * (1 + (s.reps + (s.rir ?? 0)) / 30);

/** Fractional sets per muscle (primary 1, secondary 0.5) over the given sessions. */
export function muscleSets(sessions, exercises) {
  const out = {};
  for (const s of sessions)
    for (const l of s.lifts) {
      if (!isExercise(exercises, l.id)) continue;
      const ex = exercises[l.id];
      for (const m of ex.primary) out[m] = (out[m] ?? 0) + l.sets.length;
      for (const m of ex.secondary) out[m] = (out[m] ?? 0) + 0.5 * l.sets.length;
    }
  return out;
}

/** Load moved in a session (kg × reps over every set; bodyweight sets use the logged body weight). */
export const tonnage = (session) => session.lifts.reduce((t, l) => t + l.sets.reduce((u, s) => u + s.kg * s.reps, 0), 0);

/**
 * Walk sessions in order and mark e1RM personal records per exercise. A first-ever session sets a
 * baseline, not a PR. Returns [{ date, id, e1rm, set, previous }] for every PR.
 */
export function personalRecords(sessions) {
  const best = new Map();
  const prs = [];
  for (const s of sessions)
    for (const l of s.lifts) {
      if (!l.sets.length) continue;
      const top = l.sets.reduce((a, b) => (e1rm(b) > e1rm(a) ? b : a));
      const value = e1rm(top);
      const prev = best.get(l.id);
      if (prev !== undefined && value > prev * 1.005) prs.push({ date: s.date, id: l.id, e1rm: value, set: top, previous: prev });
      if (prev === undefined || value > prev) best.set(l.id, value);
    }
  return prs;
}
