---
name: weekly-review
description: Summarize the last 7 days of training and body-weight logs against goals.md and the current program, and write reviews/YYYY-Www.md. Use for "weekly review", "how was this week", "check my log".
---

# Weekly review

This is the feedback step that makes logging worth doing. Keep the tone informational: say what the data shows, never scold.

## Steps

1. Run `node scripts/review.mjs --end <YYYY-MM-DD>` (default: today). It prints logging completeness, the 7-day weight average and weekly change, fractional sets per muscle, and e1RM trends.
2. If it lists log problems (unknown exercise id, unreadable set), fix obvious typos in `log/` and mention what you changed. Ask before guessing anything ambiguous.
3. Read `goals.md` and `program/ja/current.md` (2 days/week restart program; check which phase the week falls in).
4. Write `reviews/<ISO year>-W<ISO week>.md` in Japanese:

   ```markdown
   # 週次レビュー YYYY-Www

   ## 良かったこと

   <PRs and lifts trending up. Always include at least one if the data has any.>

   ## 数字

   <the script output tables, trimmed>

   ## 気になること

   <only items the data supports; see rules below>

   ## 来週やること

   <at most 3 concrete actions>
   ```

## Rules for "気になること"

- Body weight: judge only the 7-day average. Compare the weekly rate against the plan (lean bulk +0.25–0.5% of body weight per week, see `knowledge/ja/energy-balance.md`). Never comment on a single day's reading.
- A lift is stalled only when it has been flat for 2 consecutive weeks. First suggestion is sleep and food. Second is dropping one set or swapping the exercise.
- A muscle outside 8–20 weekly sets is worth mentioning only if it is off-plan, not because of a missed session. Weeks 1–2 of the restart are deliberately lower.
- A single missed session or weigh-in is not an issue. Two weeks running below plan is worth one neutral line.
- Every 4 weeks, remind to measure the waist if `log/body.csv` has no waist value in the last 28 days.

## Setting outcome goals (first review after the ramp-in)

If `goals.md` still says the outcome goals are "Not set yet" and the program is in week 3 or later (`program/plan.json` start date):

1. Take each main lift's best e1RM from weeks 1–2 as its baseline (bench, incline_db, cs_row, cable_row, pulldown, pullup).
2. Propose a 12-week target for each: after a long layoff, strength comes back fast, so +10–15% e1RM on compounds is realistic; say it is a target, not a prediction.
3. Replace the "to be set" strength line in `goals.md` with the numbers, and put the week-1 waist in the waist line if it was logged.
4. Include the `goals.md` change in the same pull request and call it out in the PR body.

Link any claim to its knowledge page (`knowledge/ja/<slug>.md`) instead of re-arguing the evidence.
