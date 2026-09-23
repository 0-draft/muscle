// Gym-floor arithmetic, shared by the workout screen and tests.

export const BAR_KG = 20;
export const PLATES_KG = [25, 20, 15, 10, 5, 2.5, 1.25];

/**
 * Plates per side to load a barbell to `target` kg. Greedy works for this plate set.
 * Returns { perSide: number[], loaded: number } where loaded may be below target if it can't be hit.
 */
export function platesFor(target, bar = BAR_KG, plates = PLATES_KG) {
  let side = Math.max(0, (target - bar) / 2);
  const perSide = [];
  for (const p of plates)
    while (side + 1e-9 >= p) {
      perSide.push(p);
      side -= p;
    }
  return { perSide, loaded: bar + 2 * perSide.reduce((a, b) => a + b, 0) };
}

const roundTo = (x, step) => Math.round(x / step) * step;

/**
 * Warm-up ramp to a working weight for a compound lift: a few sets of falling reps at rising load,
 * never close to failure. Barbell loads round to 2.5 kg, dumbbells/machines to `step`.
 */
export function warmups(work, { barbell = true, step = 2.5 } = {}) {
  if (!(work > 0)) return [];
  const bar = barbell ? BAR_KG : 0;
  const ramp = [
    [0.5, 8],
    [0.7, 4],
    [0.85, 2],
  ];
  const sets = [];
  if (barbell && work >= 40) sets.push({ kg: BAR_KG, reps: 10 });
  for (const [pct, reps] of ramp) {
    const kg = Math.max(bar, roundTo(work * pct, step));
    if (kg < work && !sets.some((s) => s.kg === kg)) sets.push({ kg, reps });
  }
  return sets;
}
