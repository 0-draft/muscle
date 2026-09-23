#!/usr/bin/env node
// Turns a "[log] ..." or "[weight] ..." issue into a log entry. Reads ISSUE_TITLE / ISSUE_BODY from
// the environment, appends to log/, and prints a one-line summary. Exits 1 with a reason on bad input.
// Usage: ISSUE_TITLE='[log] 2026-09-24 A' ISSUE_BODY='bench 60x10 60x10@3' node scripts/ingest.mjs [--root DIR]
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { DAY, checkLiftLine, isRealDate, parseBody } from './lib/log-format.mjs';

const i = process.argv.indexOf('--root');
const ROOT = i > -1 ? resolve(process.argv[i + 1]) : new URL('..', import.meta.url).pathname;
const title = (process.env.ISSUE_TITLE ?? '').trim();
const body = (process.env.ISSUE_BODY ?? '').replace(/\r/g, '');

const fail = (msg) => {
  console.log(msg);
  process.exit(1);
};

const training = title.match(/^\[log\]\s+(\S+)\s+(\S+)$/);
const weigh = title.match(/^\[weight\]\s+(\S+)$/);

if (training) {
  const [, date, day] = training;
  if (!isRealDate(date)) fail(`"${date}" is not a valid date (YYYY-MM-DD).`);
  if (!DAY.test(day)) fail(`"${day}" is not a valid day name.`);
  const exercises = JSON.parse(readFileSync(join(ROOT, 'data/exercises.json'), 'utf8'));
  const lines = body
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'));
  if (!lines.length) fail('The issue body has no exercise lines.');
  const errors = lines.map((l) => checkLiftLine(l, exercises)).filter(Boolean);
  if (errors.length) fail(errors.join('\n'));
  const file = join(ROOT, 'log/training', `${date.slice(0, 7)}.txt`);
  mkdirSync(join(ROOT, 'log/training'), { recursive: true });
  const prefix = existsSync(file) && !readFileSync(file, 'utf8').endsWith('\n') ? '\n' : '';
  appendFileSync(file, `${prefix}${date} ${day}\n${lines.join('\n')}\n`);
  console.log(`Logged ${lines.length} exercises for ${date} ${day} in log/training/${date.slice(0, 7)}.txt`);
} else if (weigh) {
  const [, date] = weigh;
  if (!isRealDate(date)) fail(`"${date}" is not a valid date (YYYY-MM-DD).`);
  const entry = parseBody(body.split('\n').find((l) => l.trim() && !l.trim().startsWith('#')) ?? '');
  if (!entry) fail('Write the weight in kg, optionally followed by the waist in cm, e.g. "70.2" or "70.2, 82".');
  const file = join(ROOT, 'log/body.csv');
  const rows = existsSync(file) ? readFileSync(file, 'utf8').trim().split('\n') : ['date,weight_kg,waist_cm'];
  const kept = rows.filter((r, n) => n === 0 || !r.startsWith(`${date},`));
  kept.push(`${date},${entry.weight},${entry.waist ?? ''}`);
  const [head, ...data] = kept;
  writeFileSync(file, [head, ...data.sort()].join('\n') + '\n');
  console.log(`Logged ${entry.weight} kg${entry.waist ? `, waist ${entry.waist} cm` : ''} for ${date}`);
} else {
  fail('Title must be "[log] YYYY-MM-DD <day>" or "[weight] YYYY-MM-DD".');
}
