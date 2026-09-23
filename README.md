# muscle

Hypertrophy research notes with every claim graded by the strength of its evidence, plus a personal training log that an AI agent reviews each week.

- Site: English at `/`, Japanese at `/ja/`
- Knowledge pages: `knowledge/{en,ja}/`
- Current program: `program/{en,ja}/current.md`
- Log format: `log/README.md`

## Workflow

| When | What | How |
| --- | --- | --- |
| After each session | Log sets | Append to `log/training/YYYY-MM.txt` (GitHub mobile works) |
| Every morning | Log body weight | Append to `log/body.csv` |
| Weekly | Review | Claude Code: `/weekly-review` |
| Every 12 weeks or on stalls | Adjust the program | `/update-program` |
| Monthly or on a question | Research a topic | `/research <topic>` |

## Development

```bash
npm install
npm run dev
npm run build
node scripts/review.mjs --end 2026-09-30
node scripts/verify-refs.mjs
```
