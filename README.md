# muscle

Hypertrophy research notes with every claim graded by the strength of its evidence, plus a personal training log that an AI agent reviews each week.

- Site: English at `/`, Japanese at `/ja/`
- Knowledge pages: `knowledge/{en,ja}/`
- Current program: `program/{en,ja}/current.md`
- Log format: `log/README.md`

## Workflow

| When | What | How |
| --- | --- | --- |
| During a session | Follow the workout, tick sets, rest timer | Program page on your phone (add it to the home screen) |
| After each session | Log sets | "Log this session" on the program page → Submit the issue |
| Every morning | Log body weight | "Log weight" on the program page → Submit the issue |
| Monday 07:00 JST | Numbers for last week | Automatic `[review]` issue |
| Weekly | Written review with advice | Claude Code: `/weekly-review` |
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
