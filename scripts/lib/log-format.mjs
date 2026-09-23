// Shared log grammar for review.mjs (reading) and ingest.mjs (writing from issues).
// Training: "YYYY-MM-DD <day>" header, then "<exercise_id> <set> <set> ..." lines.
// Set token: 80x8, 80x7@1, bwx12, bw+10x8.
export const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const SET = /^(bw(?:\+[\d.]+)?|[\d.]+)x(\d+)(?:@(\d+(?:\.\d+)?))?$/;
export const DAY = /^[A-Za-z0-9_-]{1,12}$/;

export const isRealDate = (s) => DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

/**
 * Undo what a Japanese phone keyboard does to "60x10 60x9@2": full-width digits and letters,
 * "×" or "*" for x, "、" or "," between sets, full-width "＠".
 */
export const normalizeLift = (line) =>
  line
    .normalize('NFKC')
    .replace(/[×✕✖*]/g, 'x')
    .replace(/(\d)\s*[xX]\s*(\d)/g, '$1x$2')
    .replace(/\s*@\s*/g, '@')
    .replace(/[、,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Local calendar date (YYYY-MM-DD) in the lifter's timezone. */
export const tokyoDate = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo' }).format(d);

/** True only for real exercise entries (not "$comment", not Object.prototype keys like "constructor"). */
export const isExercise = (exercises, id) =>
  Object.hasOwn(exercises, id) && !id.startsWith('$') && Array.isArray(exercises[id]?.primary);

/** Validate one exercise line. Returns an error string or null. */
export function checkLiftLine(line, exercises) {
  const [id, ...tokens] = line.trim().split(/\s+/);
  if (!isExercise(exercises, id)) return `unknown exercise id "${id}" (see data/exercises.json)`;
  if (!tokens.length) return `"${id}" has no sets`;
  const bad = tokens.find((t) => !SET.test(t));
  return bad ? `can't read set "${bad}" in "${id}"` : null;
}

/** Body line: "70.2" or "70.2,82" (weight kg, optional waist cm). */
export function parseBody(text) {
  const m = text.normalize('NFKC').trim().match(/^(\d{2,3}(?:\.\d{1,2})?)(?:\s*[,、\s]\s*(\d{2,3}(?:\.\d{1,2})?))?$/);
  if (!m) return null;
  const weight = Number(m[1]);
  const waist = m[2] ? Number(m[2]) : null;
  if (weight < 30 || weight > 250 || (waist !== null && (waist < 40 || waist > 200))) return null;
  return { weight, waist };
}
