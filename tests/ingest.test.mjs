import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const fresh = () => {
  const dir = mkdtempSync(join(tmpdir(), 'ingest-'));
  cpSync('tests/fixtures/basic/data', join(dir, 'data'), { recursive: true });
  cpSync('tests/fixtures/basic/log', join(dir, 'log'), { recursive: true });
  return dir;
};
const ingest = (dir, title, body) =>
  spawnSync('node', ['scripts/ingest.mjs', '--root', dir], { encoding: 'utf8', env: { ...process.env, ISSUE_TITLE: title, ISSUE_BODY: body } });

test('appends a training session to the month file', () => {
  const dir = fresh();
  const r = ingest(dir, '[log] 2026-10-01 B', 'bench 60x10 60x10@3\r\n# note\npulldown 50x12 bw+5x8@2\n');
  assert.equal(r.status, 0, r.stdout);
  assert.equal(readFileSync(join(dir, 'log/training/2026-10.txt'), 'utf8'), '2026-10-01 B\nbench 60x10 60x10@3\npulldown 50x12 bw+5x8@2\n');
});

test('appends to an existing month file without merging lines', () => {
  const dir = fresh();
  writeFileSync(join(dir, 'log/training/2026-09.txt'), '2026-09-01 A\nbench 50x10');
  assert.equal(ingest(dir, '[log] 2026-09-24 A', 'bench 60x10').status, 0);
  assert.equal(readFileSync(join(dir, 'log/training/2026-09.txt'), 'utf8'), '2026-09-01 A\nbench 50x10\n2026-09-24 A\nbench 60x10\n');
});

test('rejects unknown exercises, bad sets and bad dates without writing', () => {
  const dir = fresh();
  const before = readFileSync(join(dir, 'log/training/2026-09.txt'), 'utf8');
  for (const [title, body, msg] of [
    ['[log] 2026-09-24 A', 'squat 100x5', /unknown exercise id "squat"/],
    ['[log] 2026-09-24 A', 'bench 60xx10', /can't read set "60xx10"/],
    ['[log] 2026-02-30 A', 'bench 60x10', /not a valid date/],
    ['[log] 2026-09-24 A; rm -rf /', 'bench 60x10', /Title must be/],
    ['[log] 2026-09-24 A', '', /no exercise lines/],
  ]) {
    const r = ingest(dir, title, body);
    assert.equal(r.status, 1, title);
    assert.match(r.stdout, msg);
  }
  assert.equal(readFileSync(join(dir, 'log/training/2026-09.txt'), 'utf8'), before);
});

test('records weight and waist, replacing the same date and keeping rows sorted', () => {
  const dir = fresh();
  assert.equal(ingest(dir, '[weight] 2026-09-13', '70.1').status, 0);
  assert.equal(ingest(dir, '[weight] 2026-09-13', '70.3, 80.5').status, 0);
  const rows = readFileSync(join(dir, 'log/body.csv'), 'utf8').trim().split('\n');
  assert.equal(rows[0], 'date,weight_kg,waist_cm');
  assert.deepEqual(rows.filter((r) => r.startsWith('2026-09-13')), ['2026-09-13,70.3,80.5']);
  assert.deepEqual(rows.slice(1), [...rows.slice(1)].sort());
});

test('rejects implausible weights', () => {
  const dir = fresh();
  for (const body of ['7', 'seventy', '70.2, 9']) assert.equal(ingest(dir, '[weight] 2026-09-24', body).status, 1, body);
});
