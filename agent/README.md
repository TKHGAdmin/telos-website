# Telos Bug Hunter

Scheduled QA agent for the Telos Fitness web platform.

## Layout

- `memory/learnings.md` — accumulated knowledge across runs
- `memory/decisions.jsonl` — approval/denial record per past finding, one JSON object per line
- `memory/focus-rotation.json` — today's focus and the next scheduled rotation
- `reports/YYYY-MM-DD.md` — one report per run, Markdown, schema below
- `BUG_REPORT_SCHEMA.md` — the report contract

The agent only reads application code. It only writes under `agent/`.
