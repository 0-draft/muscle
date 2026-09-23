# Log format

Keep each entry under 30 seconds. Log the session before you leave the gym floor, and weigh in after the morning bathroom trip.

## The fast way: from the site

- **Session**: on the program page, type what you lifted into each exercise's log field, then press "Log this session". A prefilled GitHub issue opens; press Submit.
- **Weight**: on the program page, enter your weight (and waist every 4 weeks), press "Log weight", then Submit.

`.github/workflows/ingest.yml` validates the issue with `scripts/ingest.mjs`, appends it to the files below, commits, and closes the issue. If something is wrong (unknown exercise id, unreadable set), it comments on the issue instead and writes nothing. Only issues from people with write access are processed.

Every Monday at 07:00 JST, `.github/workflows/weekly-review.yml` posts last week's numbers as a `[review]` issue assigned to you.

## Editing the files directly

## Training: `log/training/YYYY-MM.txt`

One block per session. A header line with the date and day name, then one line per exercise.

```text
2026-09-24 A
bench 80x8 80x8 80x7@1
incline_db 30x10 30x10 30x9@1
cs_row 50x12 50x11@2
cable_lateral 7.5x20 7.5x18 7.5x16 7.5x15@0
# lines starting with # are notes
```

- Exercise ids come from `data/exercises.json`. Add a new id there before using it.
- Each set is `loadxreps`. `@n` sets the reps in reserve for that set. Writing RIR on the last set only is fine.
- Bodyweight movements use `bw` as the load, for example `bwx12`. Weighted pull-ups use `bw+10x8`.
- A missed session gets no block. The weekly review counts it without judgement.

## Body: `log/body.csv`

```text
date,weight_kg,waist_cm
2026-09-24,70.2,
```

Weigh daily, same conditions. Measure the waist at the navel, relaxed, every 4 weeks. Leave it blank on other days.
