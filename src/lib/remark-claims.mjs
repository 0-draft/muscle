import { visit } from 'unist-util-visit';

// `> [!A] claim text` → <blockquote class="claim" data-grade="A">.
// Grades: A = consistent meta-analyses, B = single meta-analysis or several RCTs,
// C = few RCTs / observational, D = expert opinion or mechanistic inference.
const MARKER = /^\[!([ABCD])\]\s*/;

export default function remarkClaims() {
  return (tree, file) => {
    const counts = { A: 0, B: 0, C: 0, D: 0 };
    visit(tree, 'blockquote', (node) => {
      const para = node.children[0];
      const text = para?.type === 'paragraph' ? para.children[0] : null;
      if (text?.type !== 'text') return;
      const m = text.value.match(MARKER);
      if (!m) return;
      const grade = m[1];
      text.value = text.value.slice(m[0].length);
      counts[grade] += 1;
      node.data = {
        ...node.data,
        hProperties: { className: ['claim'], 'data-grade': grade },
      };
    });
    file.data.astro ??= {};
    file.data.astro.frontmatter ??= {};
    file.data.astro.frontmatter.claimCounts = counts;
  };
}
