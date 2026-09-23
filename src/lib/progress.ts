// Build-time view of log/: what the workout screen needs (last session, bests) and what the
// progress page shows (PRs, weekly sets, e1RM history, body weight). Reads the same files and
// uses the same maths as scripts/review.mjs.
import exercises from '../../data/exercises.json';
import { e1rm, iso, muscleSets, personalRecords, readBody, readTraining, tonnage } from '../../scripts/lib/log-data.mjs';

type SetRow = { kg: number; reps: number; rir: number | null; bw?: boolean };
type Session = { date: Date; name: string; lifts: { id: string; sets: SetRow[] }[] };

// MUSCLE_LOG_ROOT points the build at another tree (e.g. e2e/fixtures/demo) to design against sample data.
const ROOT = process.env.MUSCLE_LOG_ROOT ? new URL(`file://${process.cwd()}/${process.env.MUSCLE_LOG_ROOT}/`).pathname : new URL('../../', import.meta.url).pathname;
const body = readBody(ROOT) as { date: Date; weight: number | null; waist: number | null }[];
const { sessions } = readTraining(ROOT, exercises, body) as { sessions: Session[] };

export type ExerciseMemory = {
  last?: { date: string; sets: { kg: number; reps: number; rir: number | null; bw: boolean }[] };
  bestE1rm?: number;
};

/** Per exercise: the last logged session's sets and the best e1RM ever, for prefill and live PRs. */
export function exerciseMemory(): Record<string, ExerciseMemory> {
  const out: Record<string, ExerciseMemory> = {};
  for (const s of sessions)
    for (const l of s.lifts) {
      if (!l.sets.length) continue;
      const m = (out[l.id] ??= {});
      // For bodyweight lifts the screen edits the added load, so store kg minus body weight.
      m.last = {
        date: iso(s.date),
        sets: l.sets.map((x) => ({ kg: x.bw ? Math.round((x.kg - bwAt(s.date)) * 10) / 10 : x.kg, reps: x.reps, rir: x.rir, bw: !!x.bw })),
      };
      const best = Math.max(...l.sets.map(e1rm));
      m.bestE1rm = Math.max(m.bestE1rm ?? 0, best);
    }
  return out;
}

function bwAt(date: Date) {
  return [...body].reverse().find((b) => b.weight && b.date <= date)?.weight ?? body.find((b) => b.weight)?.weight ?? 0;
}

export const allSessions = () => sessions;
export const allBody = () => body;
export const prs = () => personalRecords(sessions) as { date: Date; id: string; e1rm: number; set: SetRow; previous: number }[];
export const sessionTonnage = (s: Session) => tonnage(s) as number;
export const setsPerMuscle = (from: Date, to: Date) =>
  muscleSets(sessions.filter((s) => s.date >= from && s.date <= to), exercises) as Record<string, number>;
export { e1rm, iso };

/** Best e1RM per session for one exercise, with PR flags (first session is the baseline). */
export function e1rmHistory(id: string) {
  const out: { date: Date; value: number; pr: boolean }[] = [];
  let best = 0;
  for (const s of sessions) {
    const l = s.lifts.find((x) => x.id === id);
    if (!l || !l.sets.length) continue;
    const value = Math.max(...l.sets.map(e1rm));
    out.push({ date: s.date, value, pr: best > 0 && value > best * 1.005 });
    best = Math.max(best, value);
  }
  return out;
}

/** Records board rows: best e1RM ever per exercise, with the set and date it came from. */
export function recordsBoard() {
  const best = new Map<string, { value: number; set: SetRow; date: Date }>();
  for (const s of sessions)
    for (const l of s.lifts)
      for (const set of l.sets) {
        const value = e1rm(set);
        const cur = best.get(l.id);
        if (!cur || value > cur.value) best.set(l.id, { value, set, date: s.date });
      }
  return [...best.entries()].map(([id, r]) => ({ id, ...r })).sort((a, b) => b.value - a.value);
}

/** 7-day trailing average of body weight at each weigh-in. */
export function weightTrend() {
  const pts = body.filter((b) => b.weight !== null) as { date: Date; weight: number }[];
  return pts.map((p) => {
    const win = pts.filter((q) => q.date <= p.date && q.date > new Date(p.date.getTime() - 7 * 86400000));
    return { date: p.date, weight: p.weight, avg: win.reduce((a, q) => a + q.weight, 0) / win.length };
  });
}

export const totalTonnage = () => sessions.reduce((t, s) => t + tonnage(s), 0) as number;
export const lastSessionDate = () => sessions.at(-1)?.date ?? null;
