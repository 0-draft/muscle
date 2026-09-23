import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const plan = JSON.parse(readFileSync('program/plan.json', 'utf8'));
const exercises = JSON.parse(readFileSync('data/exercises.json', 'utf8'));

test('every planned exercise exists in data/exercises.json with both names', () => {
  for (const [day, list] of Object.entries(plan.days))
    for (const ex of list) {
      assert.ok(exercises[ex.id], `${day}: unknown exercise ${ex.id}`);
      assert.ok(exercises[ex.id].en && exercises[ex.id].ja, `${ex.id} needs en and ja names`);
    }
});

test('phases cover every program week exactly once', () => {
  const weeks = plan.phases.flatMap((p) => p.weeks).sort((a, b) => a - b);
  assert.deepEqual(weeks, Array.from({ length: plan.weeks }, (_, i) => i + 1));
});

test('every phase has labels, notes and RIR for both exercise types in both languages', () => {
  for (const p of plan.phases) {
    for (const lang of ['en', 'ja']) assert.ok(p.label[lang] && p.note[lang], `${p.id} ${lang}`);
    assert.ok(p.rir.compound && p.rir.isolation, p.id);
  }
});

test('no single session gives one muscle more than ~11 fractional sets', () => {
  // Per-session ceiling from Remmert 2025 (preprint); the restart program should stay well under it.
  for (const [day, list] of Object.entries(plan.days)) {
    const perMuscle = {};
    for (const ex of list) {
      const n = ex.sets + (ex.extra ?? 0);
      for (const m of exercises[ex.id].primary) perMuscle[m] = (perMuscle[m] ?? 0) + n;
      for (const m of exercises[ex.id].secondary) perMuscle[m] = (perMuscle[m] ?? 0) + n / 2;
    }
    for (const [m, n] of Object.entries(perMuscle)) assert.ok(n <= 11, `${day} ${m}: ${n}`);
  }
});
