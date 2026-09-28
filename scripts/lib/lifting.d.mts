export const BAR_KG: number;
export const PLATES_KG: number[];
export function platesFor(target: number, bar?: number, plates?: number[]): { perSide: number[]; loaded: number };
export function warmups(work: number, opts?: { barbell?: boolean; step?: number }): { kg: number; reps: number }[];
