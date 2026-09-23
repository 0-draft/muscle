---
name: research
description: Research one hypertrophy / nutrition / recovery / habit topic from the peer-reviewed literature and write or update its knowledge page in both languages with graded, PubMed-verified claims. Use for "research X", "update the protein page", "is there new evidence on Y".
---

# Research a topic

Goal: a knowledge page whose every claim is graded and traceable to a real, verified paper.

## Steps

1. Read `knowledge/ja/<slug>.md` and `knowledge/en/<slug>.md` if they exist, plus `/grades` rules in `src/lib/i18n.ts` (`gradesRules`).
2. Delegate the literature search to the `researcher` subagent. Ask for meta-analyses, systematic reviews and RCTs first, position stands next. Require a PMID or DOI for every claim, checked against PubMed E-utilities (`esummary`) or the publisher page, and anything unchecked marked UNVERIFIED. Prefer studies in trained lifters.
3. Drop every UNVERIFIED citation. Never write a PMID you have not seen resolve.
4. Grade each claim:
   - A: several meta-analyses / systematic reviews agree
   - B: one meta-analysis, or several RCTs
   - C: a few RCTs or observational studies only
   - D: expert opinion or mechanistic inference
   - Downgrade one step when evidence is only from untrained people and the claim is applied to trained lifters.
5. Write the Japanese page first (`knowledge/ja/<slug>.md`), then the English one (`knowledge/en/<slug>.md`) with identical structure, claim letters, numbers and references.

## Page format

```markdown
---
title: <title>
summary: <one sentence, the practical answer>
area: training | nutrition | recovery | adherence
order: <number; training 1-9, nutrition 10-19, recovery 20-29, adherence 30-39>
last_reviewed: <YYYY-MM-DD today>
---

## 結論 / Bottom line

<what to do, with numbers for a 70 kg lifter>

## <sub-topic>

> [!B] <one claim, one sentence or two>

<supporting detail with (Author Year) citations>

## 参考文献 / References

1. Author AB et al. YYYY. Title. *Journal*. [PMID nnnnnnnn](https://pubmed.ncbi.nlm.nih.gov/nnnnnnnn/)
```

- A claim block is a blockquote starting with `[!A]`..`[!D]`. The site turns these into plates.
- Reference lines must keep the `N. Surname Initials ... YYYY. ... [PMID n]` shape; `scripts/verify-refs.mjs` parses it.
- Papers without a PMID use `[doi:...](https://doi.org/...)`.

## Verify before finishing

```bash
npx --yes markdownlint-cli2 "knowledge/**/*.md"
npm run build
```

`node scripts/verify-refs.mjs` needs network to NCBI. If the sandbox blocks it, say so; CI runs it on every push.

If a conclusion changed, say what changed and which paper changed it in the commit message body.
