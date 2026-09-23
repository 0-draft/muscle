// Shared log grammar for review.mjs (reading) and ingest.mjs (writing from issues).
// Training: "YYYY-MM-DD <day>" header, then "<exercise_id> <set> <set> ..." lines.
// Set token: 80x8, 80x7@1, bwx12, bw+10x8.
export const DATE = /^\d{4}-\d{2}-\d{2}$/;
export const SET = /^(bw(?:\+[\d.]+)?|[\d.]+)x(\d+)(?:@(\d+(?:\.\d+)?))?$/;
export const DAY = /^[A-Za-z0-9_-]{1,12}$/;

export const isRealDate = (s) => DATE.test(s) && !Number.isNaN(Date.parse(`${s}T00:00:00Z`)) && new Date(`${s}T00:00:00Z`).toISOString().startsWith(s);

/** Validate one exercise line. Returns an error string or null. */
export function checkLiftLine(line, exercises) {
  const [id, ...tokens] = line.trim().split(/\s+/);
  if (!exercises[id]) return `unknown exercise id "${id}" (see data/exercises.json)`;
  if (!tokens.length) return `"${id}" has no sets`;
  const bad = tokens.find((t) => !SET.test(t));
  return bad ? `can't read set "${bad}" in "${id}"` : null;
}

/** Body line: "70.2" or "70.2,82" (weight kg, optional waist cm). */
export function parseBody(text) {
  const m = text.trim().match(/^(\d{2,3}(?:\.\d{1,2})?)(?:\s*[,\s]\s*(\d{2,3}(?:\.\d)?))?$/);
  if (!m) return null;
  const weight = Number(m[1]);
  const waist = m[2] ? Number(m[2]) : null;
  if (weight < 30 || weight > 250 || (waist !== null && (waist < 40 || waist > 200))) return null;
  return { weight, waist };
}
