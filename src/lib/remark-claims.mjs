import { visit, SKIP } from 'unist-util-visit';
import { toString } from 'mdast-util-to-string';

// Graded claims and author–year citations for knowledge pages.
//
// `> [!A] claim text` → <blockquote class="claim" data-grade="A" id="claim-1"> with a visible
// label (letter + certainty wording), so the grade never depends on colour alone.
// Grades: A = consistent meta-analyses, B = one meta-analysis or several RCTs,
// C = few RCTs / observational, D = expert opinion or mechanistic inference.
//
// "(Morton 2018)" in prose → a link to the matching entry in the references list, which gets
// an id and back-links to every place it was cited.
const MARKER = /^\[!([ABCD])\]\s*/;

// Certainty wording follows GRADE's tested phrasing (Santesso 2020): high / probably / may / very uncertain.
export const LABELS = {
  en: { A: 'Strong evidence', B: 'Probably true', C: 'May be true', D: 'Uncertain, inference' },
  ja: { A: '強い根拠', B: 'おそらく正しい', C: '可能性がある', D: '不確か・推論' },
};

const REF_HEADINGS = new Set(['references', '参考文献']);
// "Chen TC et al. 2012." / "Murphy C, Koehler K. 2022." / "ACSM. 2009." / "Schoenfeld BJ et al. 2019a."
const REF_HEAD = /^([A-Z][\p{L}'’-]+)\.?(?:\s+([A-Z]{1,3}))?[^]*?\s(\d{4}[a-z]?)\./u;
// "Morton 2018", "Chen TC 2012", "Murphy & Koehler 2022", "Hong & Kim 2018", "Refalo 2025b"
const CITE = /\b([A-Z][\p{L}'’-]+)(?:\s+([A-Z]{1,3}))?(?:\s+&\s+[A-Z][\p{L}'’-]+)?(?:\s+et al\.)?\s+(\d{4}[a-z]?)\b/gu;

const langOf = (file) => (/[\\/]ja[\\/]/.test(file.path ?? '') ? 'ja' : 'en');

function referenceIndex(tree) {
  const refs = [];
  let inRefs = false;
  for (const node of tree.children) {
    if (node.type === 'heading') inRefs = node.depth === 2 && REF_HEADINGS.has(toString(node).trim().toLowerCase());
    else if (inRefs && node.type === 'list') refs.push(node);
  }
  const keys = new Map();
  const dupes = new Set();
  const entries = [];
  for (const list of refs)
    list.children.forEach((item) => {
      const n = entries.length + 1;
      const text = toString(item);
      entries.push({ n, item, text });
      const m = text.match(REF_HEAD);
      if (!m) return;
      const [, surname, initials, year] = m;
      for (const key of [`${surname} ${year}`, initials && `${surname} ${initials} ${year}`].filter(Boolean)) {
        if (keys.has(key) && keys.get(key) !== n) dupes.add(key);
        else keys.set(key, n);
      }
    });
  for (const k of dupes) keys.delete(k);
  return { keys, entries, lists: new Set(refs) };
}

export default function remarkClaims() {
  return (tree, file) => {
    const lang = langOf(file);
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    const claims = [];

    visit(tree, 'blockquote', (node) => {
      const para = node.children[0];
      const text = para?.type === 'paragraph' ? para.children[0] : null;
      if (text?.type !== 'text') return;
      const m = text.value.match(MARKER);
      if (!m) return;
      const grade = m[1];
      text.value = text.value.slice(m[0].length);
      counts[grade] += 1;
      const id = `claim-${claims.length + 1}`;
      claims.push({ id, grade, text: toString(para) });
      node.data = {
        ...node.data,
        hProperties: { className: ['claim'], 'data-grade': grade, id },
      };
      node.children.unshift({
        type: 'claimLabel',
        data: {
          hName: 'p',
          hProperties: { className: ['claim-label'] },
          hChildren: [
            { type: 'element', tagName: 'span', properties: { className: ['claim-letter'] }, children: [{ type: 'text', value: grade }] },
            { type: 'text', value: LABELS[lang][grade] },
          ],
        },
      });
      return SKIP;
    });

    const { keys, entries, lists } = referenceIndex(tree);
    const citedFrom = new Map();
    if (keys.size) {
      visit(tree, (node, _i, parent) => {
        if (lists.has(node) || node.type === 'link' || node.type === 'heading' || node.type === 'code') return SKIP;
        if (node.type !== 'text' || !parent) return;
        const parts = [];
        let last = 0;
        for (const m of node.value.matchAll(CITE)) {
          const [whole, surname, initials, year] = m;
          const n = (initials && keys.get(`${surname} ${initials} ${year}`)) || keys.get(`${surname} ${year}`);
          if (!n) continue;
          const uses = (citedFrom.get(n) ?? 0) + 1;
          citedFrom.set(n, uses);
          if (m.index > last) parts.push({ type: 'text', value: node.value.slice(last, m.index) });
          parts.push({
            type: 'link',
            url: `#ref-${n}`,
            title: entries[n - 1].text,
            data: { hProperties: { className: ['cite'], id: `cite-${n}-${uses}` } },
            children: [{ type: 'text', value: whole }],
          });
          last = m.index + whole.length;
        }
        if (!parts.length) return;
        if (last < node.value.length) parts.push({ type: 'text', value: node.value.slice(last) });
        const idx = parent.children.indexOf(node);
        parent.children.splice(idx, 1, ...parts);
        return idx + parts.length;
      });
    }
    for (const { n, item } of entries) {
      item.data = { ...item.data, hProperties: { id: `ref-${n}` } };
      const uses = citedFrom.get(n) ?? 0;
      if (!uses) continue;
      const para = item.children.at(-1);
      const backs = Array.from({ length: uses }, (_, i) => ({
        type: 'link',
        url: `#cite-${n}-${i + 1}`,
        data: { hProperties: { className: ['backref'], 'aria-label': lang === 'ja' ? `本文の引用箇所 ${i + 1} へ戻る` : `Back to citation ${i + 1}` } },
        children: [{ type: 'text', value: '↩' }],
      }));
      para.children.push({ type: 'text', value: ' ' }, ...backs.flatMap((b, i) => (i ? [{ type: 'text', value: ' ' }, b] : [b])));
    }

    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.claimCounts = counts;
    file.data.astro.frontmatter.claims = claims;
  };
}
