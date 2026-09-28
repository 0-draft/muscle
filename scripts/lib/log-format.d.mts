export const DATE: RegExp;
export const SET: RegExp;
export const DAY: RegExp;
export const isRealDate: (s: string) => boolean;
export const normalizeLift: (line: string) => string;
export const tokyoDate: (d?: Date) => string;
export const isExercise: (exercises: unknown, id: string) => boolean;
export function checkLiftLine(line: string, exercises: unknown): string | null;
export function parseBody(text: string): { weight: number; waist: number | null } | null;
