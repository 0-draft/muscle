import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkClaims from '../src/lib/remark-claims.mjs';

const render = async (md) => {
  const file = await unified().use(remarkParse).use(remarkClaims).use(remarkRehype).use(rehypeStringify).process(md);
  return { html: String(file), counts: file.data.astro.frontmatter.claimCounts };
};

test('turns graded blockquotes into claims and strips the marker', async () => {
  const { html, counts } = await render('> [!A] Strong claim.\n\n> [!C] Weak claim.\n\n> [!C] Another.');
  assert.match(html, /<blockquote class="claim" data-grade="A">\s*<p>Strong claim\.<\/p>/);
  assert.doesNotMatch(html, /\[!/);
  assert.deepEqual(counts, { A: 1, B: 0, C: 2, D: 0 });
});

test('leaves ordinary blockquotes and unknown grades alone', async () => {
  const { html, counts } = await render('> Just a quote.\n\n> [!E] Not a grade.');
  assert.doesNotMatch(html, /class="claim"/);
  assert.match(html, /\[!E\] Not a grade\./);
  assert.deepEqual(counts, { A: 0, B: 0, C: 0, D: 0 });
});

test('every knowledge page has the same claim grades in both languages', async () => {
  const { readdirSync, readFileSync } = await import('node:fs');
  const grades = (p) => [...readFileSync(p, 'utf8').matchAll(/^> \[!([ABCD])\]/gm)].map((m) => m[1]).join('');
  const ja = readdirSync('knowledge/ja').sort();
  assert.deepEqual(readdirSync('knowledge/en').sort(), ja, 'en and ja have the same files');
  for (const f of ja) assert.equal(grades(`knowledge/en/${f}`), grades(`knowledge/ja/${f}`), f);
});
