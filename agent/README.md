# Terminex Bug Hunter — agent/ directory

This directory is owned by the Terminex Bug Detector scheduled task. It holds the agent's reports and persistent memory. No application code lives here.

## Layout

```
agent/
├── README.md                   this file
├── memory/
│   ├── focus-rotation.json     today's focus (functional → visual-ux → performance → security)
│   ├── learnings.md            accumulated knowledge + false-positive patterns
│   └── decisions.jsonl         JSONL log of which past bugs were approved / denied / fixed
└── reports/
    └── YYYY-MM-DD.md           daily bug report (one file per run)
```

## Report schema (used until `docs/BUG_REPORT_SCHEMA.md` is published)

Each daily report at `agent/reports/YYYY-MM-DD.md` has this structure:

```markdown
# Bug Report YYYY-MM-DD

- **Focus:** functional | visual-ux | performance | security
- **Bugs found:** N
- **Zero-bug day:** yes | no

## Summary

One-paragraph overview of what was scanned and what was found.

## Findings

### [P0|P1|P2|P3] BUG-YYYY-MM-DD-NN — <one-line title>

- **File:** `path/to/file.ext:LINE`
- **Category:** (e.g. dead-link, api-mismatch, logic-error)
- **Description:** What is wrong.
- **Failure scenario:** Concrete steps a user takes → the wrong behavior they see.
- **Suggested fix:** One-sentence suggestion (optional).

(repeat per finding)

## Notes for next run

Patterns observed, areas not yet explored, candidate focus adjustments.
```

If zero bugs are found, the **Findings** section is a single line: `No bugs found this run.`

## Hard rules

- Never modify application code. Only write under `agent/memory/` and `agent/reports/`.
- Never fabricate a bug to look productive. A zero-bug report is valid.
- Never report the same bug twice across the last 14 days.
- Secrets discovered must be redacted in the report and marked P0.
