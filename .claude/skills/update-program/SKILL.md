---
name: update-program
description: Propose changes to the training program from the last weeks of reviews and the knowledge base, then apply them to program/ja and program/en after approval. Use every 12 weeks, after repeated stalls, or when the user wants to change the split or add/remove body parts.
---

# Update the program

## Steps

1. Read `program/ja/current.md`, `goals.md`, the last 4–12 files in `reviews/`, and the knowledge pages the change touches.
2. Run `node scripts/review.mjs` for the current week.
3. Propose a change list. For each item give: what changes, why (log data), and which knowledge claim supports it (page and grade). Keep lifts that are still progressing. Change only what is stalled or off-target.
4. Wait for approval. The user decides the split and which body parts are trained. Currently legs are excluded by choice; present leg options only if asked or if the user brings it up.
5. Exercises, sets, reps, RIR, rest and phases live in `program/plan.json` (the workout screen renders from it; set `start` to the first training day). Rationale, the weekly fractional set table (primary 1, secondary 0.5, mapping in `data/exercises.json`) and nutrition live in `program/ja/current.md`, mirrored to `program/en/current.md`. Update `valid_from`, and add any new exercise ids to `data/exercises.json` with both names.
6. Run `npm run lint`, `npm test` (checks plan.json against the exercise map and the per-session volume ceiling) and `npm run build`.

Commit the program change separately from log or knowledge changes.
