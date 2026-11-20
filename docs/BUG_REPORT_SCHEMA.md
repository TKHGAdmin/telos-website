# Bug Report Schema

This is the contract the Telos Bug Hunter uses when writing daily reports to `agent/reports/YYYY-MM-DD.md`. The orchestrator (`run.py`) parses these files for email delivery, so field names and order must match.

Reports are plain Markdown with a required front-matter header and one `## Finding` block per issue.

---

## Front matter

```
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
findings: <integer>
highest_severity: P0 | P1 | P2 | P3 | none
---
```

- `date`: run date in ISO 8601 (matches the filename).
- `focus`: today's rotation bucket.
- `findings`: total number of `## Finding` blocks in this file.
- `highest_severity`: highest severity across all findings, or `none` for a zero-bug report.

---

## Zero-bug report

```
---
date: 2026-11-20
focus: Functional
findings: 0
highest_severity: none
---

# Daily Bug Hunt — 2026-11-20

No actionable bugs found during today's Functional review.

## What was checked

- <bullet list of files / flows audited>

## Why nothing was reported

- <one-sentence explanation for each candidate issue that was excluded>
```

---

## One or more findings

```
---
date: YYYY-MM-DD
focus: ...
findings: <n>
highest_severity: ...
---

# Daily Bug Hunt — YYYY-MM-DD

<optional one-paragraph summary>

## Finding 1 — <short title>

- **Severity:** P0 | P1 | P2 | P3
- **File(s):** `path/to/file.js:line` (and additional files/lines as needed)
- **Category:** correctness | validation | security | performance | accessibility | ux | data-integrity | other

### Repro / trace

<step-by-step reproduction or code trace that shows the bug is real>

### Impact

<who it affects, how, and how often>

### Suggested fix

<short description of the minimal change that resolves it>

---

## Finding 2 — <short title>

(same structure)
```

### Required fields on every finding

| Field | Required | Notes |
|---|---|---|
| `Severity` | yes | one of P0 / P1 / P2 / P3 |
| `File(s)` | yes | at least one `path:line` reference |
| `Category` | yes | kebab-case slug |
| `Repro / trace` | yes | enough detail that a developer can confirm without re-reading the agent's chain of thought |
| `Impact` | yes | concrete user / developer effect |
| `Suggested fix` | yes | directional, not prescriptive |

### Optional fields

- `Known-related issue:` — reference a prior report ID if this is recurring
- `Confidence:` — `high` by default; use `medium` only if the agent is deliberately flagging an uncertain finding
