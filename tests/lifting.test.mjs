import { test } from 'node:test';
import assert from 'node:assert/strict';
import { platesFor, warmups } from '../scripts/lib/lifting.mjs';
import { personalRecords, tonnage } from '../scripts/lib/log-data.mjs';

test('loads a barbell with the fewest plates per side', () => {
  assert.deepEqual(platesFor(100), { perSide: [25, 15], loaded: 100 });
  assert.deepEqual(platesFor(62.5), { perSide: [20, 1.25], loaded: 62.5 });
  assert.deepEqual(platesFor(20), { perSide: [], loaded: 20 });
  assert.deepEqual(platesFor(101), { perSide: [25, 15], loaded: 100 }, 'rounds down when the load cannot be hit');
});

test('warm-up ramp climbs below the working weight', () => {
  assert.deepEqual(warmups(80), [
    { kg: 20, reps: 10 },
    { kg: 40, reps: 8 },
    { kg: 55, reps: 4 },
    { kg: 67.5, reps: 2 },
  ]);
  assert.deepEqual(warmups(30), [
    { kg: 20, reps: 8 },
    { kg: 25, reps: 2 },
  ], 'light barbell work never goes below the bar and skips duplicate loads');
  assert.deepEqual(warmups(0), []);
});

test('personal records need a baseline and a real improvement', () => {
  const d = (s) => new Date(`${s}T00:00:00Z`);
  const sessions = [
    { date: d('2026-09-24'), lifts: [{ id: 'bench', sets: [{ kg: 60, reps: 10, rir: 3 }] }] },
    { date: d('2026-09-27'), lifts: [{ id: 'bench', sets: [{ kg: 60, reps: 10, rir: 3 }] }] },
    { date: d('2026-10-01'), lifts: [{ id: 'bench', sets: [{ kg: 62.5, reps: 10, rir: 2 }, { kg: 50, reps: 5 }] }] },
  ];
  const prs = personalRecords(sessions);
  assert.equal(prs.length, 1);
  assert.equal(prs[0].id, 'bench');
  assert.equal(prs[0].set.kg, 62.5);
  assert.equal(tonnage(sessions[2]), 62.5 * 10 + 50 * 5);
});
