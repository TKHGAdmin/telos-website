# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` follows this exact structure.
The parser (in `run.py`) is strict — deviations break email delivery.

---

## Front matter

The file starts with a YAML block:

```yaml
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
findings_count: <int>
p0: <int>
p1: <int>
p2: <int>
p3: <int>
---
```

## Body sections (in this order)

### `# Telos Bug Hunter — <date>`

Top-level heading with the ISO date.

### `## Summary`

One paragraph. State the focus for the day, how many findings, and the highest severity. If zero findings, say so plainly ("Clean run. Nothing to report.") and skip the Findings section entirely.

### `## Findings` (only when count > 0)

One `### <SEV> — <short-title>` subsection per finding, ordered most-severe first (P0 → P3).

Each finding contains, in order:

- **File** — relative path with `:line` anchor (e.g. `api/client/module.js:63`).
- **Failure scenario** — one to three sentences: concrete inputs / state that lead to wrong behavior.
- **Why it matters** — one sentence: who is affected, what breaks for them.
- **Suggested fix** — one to three sentences OR a small code sketch inside a triple-backtick block.

Use exactly those four bold labels — the parser matches them.

### `## Notes`

Optional free-form notes: patterns noticed, areas explored, known-issues intentionally skipped.

---

## Severity rubric

| Severity | Definition |
|---|---|
| P0 | Core functionality broken OR user data exposed |
| P1 | Degrades experience for many users |
| P2 | Affects some users or edge cases |
| P3 | Minor polish / tech debt |

## Rules

1. One report per day. Never overwrite the previous day.
2. Zero findings is honest — never pad.
3. Every finding must have all four labeled sub-fields.
4. Never include secrets verbatim — redact.
5. Reference prior report IDs (`2026-08-19#F2`) when re-flagging an unresolved issue.
