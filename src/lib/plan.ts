import plan from '../../program/plan.json';
import exercises from '../../data/exercises.json';
import type { Lang } from './i18n';

export type DayId = 'A' | 'B';
export type Phase = (typeof plan.phases)[number];
export type PlanExercise = {
  id: string;
  sets: number;
  reps: string;
  type: 'compound' | 'isolation';
  rest: number;
  extra?: number;
  note?: Record<Lang, string>;
};

export { plan };
export const days = plan.days as Record<DayId, PlanExercise[]>;

export const exerciseName = (id: string, lang: Lang) =>
  (exercises as unknown as Record<string, Record<Lang, string>>)[id]?.[lang] ?? id;

export const setsFor = (ex: PlanExercise, phase: Phase) =>
  'ramp' in phase && phase.ramp ? Math.min(plan.rampSets, ex.sets) : ex.sets + ('extra' in phase && phase.extra ? (ex.extra ?? 0) : 0);

export const phaseForWeek = (week: number) => plan.phases.find((p) => p.weeks.includes(week)) ?? plan.phases.at(-1)!;

/** 1-based program week for a date; 0 before the start, > plan.weeks after the end. */
export const weekFor = (date: Date) => {
  const start = new Date(`${plan.start}T00:00:00`);
  const days = Math.floor((date.getTime() - start.getTime()) / 86400000);
  return days < 0 ? 0 : Math.floor(days / 7) + 1;
};

export const fmtRest = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
