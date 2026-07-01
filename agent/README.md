# Bug Hunter Agent — Working Directory

This directory is the agent's private scratchpad. Contents:

- `memory/focus-rotation.json` — which of the four focus areas today's run covers (functional / visual / performance / security). Rotated at end of each run.
- `memory/learnings.md` — patterns observed across runs; false-positive traps to avoid; confirmed real-bug patterns to hunt harder for.
- `memory/decisions.jsonl` — one JSON line per approved/denied/fixed bug. Fed back into the agent so it can learn from Thomas' judgments.
- `reports/YYYY-MM-DD.md` — one report per run. Schema in `docs/BUG_REPORT_SCHEMA.md`.

The agent may read anything in the repo but only writes here (plus new report files under `reports/`).
