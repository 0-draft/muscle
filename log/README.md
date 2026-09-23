# Log format

Keep each entry under 30 seconds. Log the session before you leave the gym floor, and weigh in after the morning bathroom trip.

## Training: `log/training/YYYY-MM.txt`

One block per session. A header line with the date and day name, then one line per exercise.

```text
2026-09-24 pushA
bench 80x8 80x8 80x7@1
incline_db 30x10 30x10 30x9@1
cable_fly 15x15 15x14@0
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
