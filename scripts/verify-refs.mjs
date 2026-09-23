#!/usr/bin/env node
// Checks every PubMed reference in knowledge/**: the PMID must exist, the first author's surname
// and the year in our reference line must match PubMed, and the paper must not be retracted.
// Catches mistyped or invented PMIDs and papers retracted after we cited them.
// Usage: node scripts/verify-refs.mjs
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const files = ['knowledge', 'program'].flatMap((top) =>
  readdirSync(join(ROOT, top), { recursive: true })
    .filter((f) => f.endsWith('.md'))
    .map((f) => join(top, f)),
);

// Reference lines look like: `1. Morton RW et al. 2018. Title... [PMID 28698222](...)`
const REF = /^\s*\d+\.\s+(.+?)\s+(\d{4})[a-z]?\.\s.*\[PMID (\d+)\]/;
const refs = [];
for (const f of files)
  readFileSync(join(ROOT, f), 'utf8')
    .split('\n')
    .forEach((line, i) => {
      const m = line.match(REF);
      if (m) refs.push({ where: `${f}:${i + 1}`, authors: m[1], year: m[2], pmid: m[3] });
    });

const pmids = [...new Set(refs.map((r) => r.pmid))];
const summaries = {};
for (let i = 0; i < pmids.length; i += 150) {
  const ids = pmids.slice(i, i + 150).join(',');
  const res = await fetch(`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&retmode=json&id=${ids}`);
  if (!res.ok) throw new Error(`PubMed returned ${res.status}`);
  Object.assign(summaries, (await res.json()).result);
  await new Promise((r) => setTimeout(r, 400)); // stay under NCBI's 3 requests/second
}

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const failures = [];
for (const r of refs) {
  const s = summaries[r.pmid];
  if (!s || s.error) {
    failures.push(`${r.where} PMID ${r.pmid} not found in PubMed`);
    continue;
  }
  if ((s.pubtype ?? []).includes('Retracted Publication'))
    failures.push(`${r.where} PMID ${r.pmid} has been RETRACTED: "${s.title}". Remove or replace the claims that rely on it.`);
  const surname = norm(s.sortfirstauthor ?? s.authors?.[0]?.name ?? '').split(' ')[0];
  // Epub-ahead-of-print can put the print year one later than the epub year.
  const years = [s.pubdate, s.epubdate].map((d) => (d ?? '').slice(0, 4)).filter(Boolean);
  if (surname && !norm(r.authors).includes(surname))
    failures.push(`${r.where} PMID ${r.pmid}: first author on PubMed is "${s.sortfirstauthor}", reference says "${r.authors}"`);
  if (years.length && !years.some((y) => Math.abs(Number(y) - Number(r.year)) <= 1))
    failures.push(`${r.where} PMID ${r.pmid}: PubMed year ${years.join('/')}, reference says ${r.year}`);
}

console.log(`Checked ${refs.length} references (${pmids.length} unique PMIDs) in ${files.length} files.`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
console.log('All PMIDs match.');
