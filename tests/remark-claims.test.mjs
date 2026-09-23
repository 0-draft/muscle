import { test } from 'node:test';
import assert from 'node:assert/strict';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import remarkClaims from '../src/lib/remark-claims.mjs';

const render = async (md, path = 'knowledge/en/x.md') => {
  const file = await unified().use(remarkParse).use(remarkClaims).use(remarkRehype).use(rehypeStringify).process({ value: md, path });
  const fm = file.data.astro.frontmatter;
  return { html: String(file), counts: fm.claimCounts, claims: fm.claims };
};

test('turns graded blockquotes into labelled claims and strips the marker', async () => {
  const { html, counts, claims } = await render('> [!A] Strong claim.\n\n> [!C] Weak claim.\n\n> [!C] Another.');
  assert.match(html, /<blockquote class="claim" data-grade="A" id="claim-1">/);
  assert.match(html, /<p class="claim-label"><span class="claim-letter">A<\/span>Strong evidence<\/p>\s*<p>Strong claim\.<\/p>/);
  assert.doesNotMatch(html, /\[!/);
  assert.deepEqual(counts, { A: 1, B: 0, C: 2, D: 0 });
  assert.deepEqual(claims.map((c) => [c.id, c.grade, c.text]), [
    ['claim-1', 'A', 'Strong claim.'],
    ['claim-2', 'C', 'Weak claim.'],
    ['claim-3', 'C', 'Another.'],
  ]);
});

test('labels claims in Japanese on ja pages', async () => {
  const { html } = await render('> [!B] 主張。', 'knowledge/ja/x.md');
  assert.match(html, /<span class="claim-letter">B<\/span>おそらく正しい/);
});

test('links author–year citations to the reference list and back', async () => {
  const md = [
    'Plateau near 1.6 g/kg (Morton 2018; Murphy & Koehler 2022). Also Chen TC 2012, but "Chen 2012" is ambiguous.',
    '',
    '## References',
    '',
    '1. Morton RW et al. 2018. Title. *J*. [PMID 1](https://pubmed.ncbi.nlm.nih.gov/1/)',
    '2. Murphy C, Koehler K. 2022. Title. *J*. [PMID 2](https://pubmed.ncbi.nlm.nih.gov/2/)',
    '3. Chen TC et al. 2012. Title. *J*. [PMID 3](https://pubmed.ncbi.nlm.nih.gov/3/)',
    '4. Chen HL et al. 2012. Title. *J*. [PMID 4](https://pubmed.ncbi.nlm.nih.gov/4/)',
  ].join('\n');
  const { html } = await render(md);
  assert.match(html, /<a href="#ref-1"[^>]*class="cite" id="cite-1-1">Morton 2018<\/a>/);
  assert.match(html, /<a href="#ref-2"[^>]*>Murphy &#x26; Koehler 2022<\/a>/);
  assert.match(html, /<a href="#ref-3"[^>]*>Chen TC 2012<\/a>/);
  assert.match(html, /"Chen 2012" is ambiguous/);
  assert.match(html, /<li id="ref-1">.*<a href="#cite-1-1" class="backref"/);
  assert.doesNotMatch(html, /<li id="ref-4">.*backref/);
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
