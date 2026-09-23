# muscle

Evidence-graded hypertrophy notes plus a personal training log. The site (Astro, GitHub Pages) renders `knowledge/` and `program/` in English (default, `/`) and Japanese (`/ja/`).

## Layout

- `knowledge/{ja,en}/<slug>.md`: one topic per file, graded claims (`> [!A]`..`> [!D]`), PMID-backed references. Japanese is written first; English mirrors it exactly.
- `program/{ja,en}/current.md`: the program in effect.
- `log/`: training log (`training/YYYY-MM.txt`) and `body.csv`. Format in `log/README.md`.
- `data/exercises.json`: exercise id → muscles (primary 1 set, secondary 0.5).
- `goals.md`: process and outcome goals the weekly review checks.
- `reviews/`: weekly reviews written by the `weekly-review` skill.
- `scripts/review.mjs`: log parser and weekly summary. `scripts/verify-refs.mjs`: checks every PMID against PubMed.

## Rules

- Never add a citation you have not seen resolve on PubMed or the publisher's page. `verify-refs` runs in CI.
- The lifter: 172 cm, ~70 kg. Trained 3–4 years (4 days/week, chest+shoulders ×2, back+arms ×2), then stopped for 3–4 years. Restarting in 2026-09 at 2 days/week, goal: build muscle. Small appetite, suspects he's a hardgainer. Legs are excluded by choice; don't push them into the program.
- Reviews are informational, never scolding. Judge body weight only by the 7-day average.
- Verify with `npx --yes markdownlint-cli2 "**/*.md" "#node_modules"` and `npm run build` before calling anything done.
