# Bug Report Schema

Each report is a Markdown file at `agent/reports/YYYY-MM-DD.md`.

## Required front matter

```markdown
# Telos Bug Hunter — YYYY-MM-DD

- **Focus area:** functional | visual-ux | performance | security
- **Findings:** N (P0: n, P1: n, P2: n, P3: n)
- **Scope reviewed:** short list of files/areas inspected
```

## Finding block (repeat per bug)

Use a level-2 heading per finding. Give each a stable ID `YYYY-MM-DD-NN`.

```markdown
## [SEVERITY] YYYY-MM-DD-NN — Short title

- **ID:** YYYY-MM-DD-NN
- **Severity:** P0 | P1 | P2 | P3
- **Area:** functional | visual-ux | performance | security
- **Location:** path/to/file.ext:LINE (one or more)
- **Summary:** one or two sentences stating the defect.
- **Repro / evidence:** concrete steps or a code citation showing the issue.
- **Impact:** who it affects and how.
- **Suggested fix:** one or two sentences, non-prescriptive.
- **Confidence:** high | medium
- **Decision:** _(filled in later by Thomas: approved | denied | fixed)_
```

## Zero-bug report

If the hunt found nothing, write:

```markdown
# Telos Bug Hunter — YYYY-MM-DD

- **Focus area:** ...
- **Findings:** 0
- **Scope reviewed:** ...

No reportable issues today.
```

## Rules

- IDs are permanent. Reference `YYYY-MM-DD-NN` in `decisions.jsonl` and later reports.
- Severity P0 reserved for data exposure / core functionality breaks.
- Never fabricate — a zero-bug day is honest.
