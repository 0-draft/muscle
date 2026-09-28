import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

const run = (...args) =>
  execFileSync('node', ['scripts/review.mjs', '--root', 'tests/fixtures/basic', ...args], { encoding: 'utf8' });

test('counts sessions and fractional sets for the week', () => {
  const out = run('--end', '2026-09-23');
  assert.match(out, /Sessions logged: 1 \/ 2 planned/);
  // bench: 2 sets chest (the unreadable-set line adds a bench entry with 0 sets), pulldown: 3 sets back, 1.5 biceps
  assert.match(out, /\| back \| 3\.0 \| below range \|/);
  assert.match(out, /\| chest \| 2\.0 \| below range \|/);
  assert.match(out, /\| biceps \| 1\.5 \|/);
  assert.match(out, /\| triceps \| 1\.0 \|/);
});

test('averages body weight by week and reports the weekly change', () => {
  const out = run('--end', '2026-09-23');
  assert.match(out, /7-day average: 70\.50 kg \(2 readings\)/);
  assert.match(out, /Change from last week: \+0\.40 kg/);
  assert.match(out, /Last waist measurement: 81 cm on 2026-09-18/);
});

test('e1RM counts reps in reserve and flags a trend against the prior two weeks', () => {
  const out = run('--end', '2026-09-23');
  // 82.5 × (1 + 9/30) = 107.25 vs 80 × (1 + 10/30) = 106.67: +0.55% clears the 0.5% noise band
  assert.match(out, /\| Bench press \| 107\.3 \| 106\.7 \| up \(PR window\) \|/);
  // bodyweight sets use the latest weigh-in: (70.6 + 5) × (1 + 8/30) = 95.8
  assert.match(out, /\| Lat pulldown \| 95\.8 \| – \| new \|/);
});

test('reports unknown exercises and unreadable sets', () => {
  const out = run('--end', '2026-09-23');
  assert.match(out, /unknown exercise id "typo"/);
  assert.match(out, /can't read set "80xx8"/);
});

test('an empty week says so instead of failing', () => {
  const out = run('--end', '2026-08-01');
  assert.match(out, /Sessions logged: 0 \/ 2 planned/);
  assert.match(out, /No weigh-ins this week/);
  assert.match(out, /no sessions logged/);
});

test('an empty lifts table says so instead of printing only a header', () => {
  const out = run('--end', '2026-08-01');
  assert.match(out, /\| – \| – \| – \| no sessions logged \|/);
});

test('weeks before the program start do not count as missed sessions', () => {
  // start 2026-09-14: the week before 09-15..09-21 is 09-08..09-14, which begins before the start
  assert.doesNotMatch(run('--end', '2026-09-21'), /two weeks running/);
  // 09-28..10-04 and 10-05..10-11 are both inside the program with no sessions
  assert.match(run('--end', '2026-10-11'), /two weeks running/);
});
