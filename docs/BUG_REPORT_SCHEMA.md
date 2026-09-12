# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this schema exactly. The `run.py` orchestrator parses these fields — deviation breaks the email.

## Header (required)

```markdown
# Telos Bug Hunter — YYYY-MM-DD

- **Focus:** Functional | Visual/UX | Performance | Security
- **Findings:** N
- **Status:** OK | Findings to review | Blocked
```

## Zero-finding report

If no bugs were found, write:

```markdown
## Summary

No bugs found today. Focus area: <area>. Areas covered: <list>.
Approach: <one sentence>.
```

Stop there. Do not pad.

## Findings

For each finding, use this block verbatim:

```markdown
## Finding <n> — <one-line title>

- **ID:** BUG-YYYY-MM-DD-<n>
- **Severity:** P0 | P1 | P2 | P3
- **Area:** <focus area>
- **File(s):** `path/to/file.ext:LINE` (repeat as needed)

### Repro / Trace
<numbered steps OR exact code path>

### Expected vs Actual
- **Expected:** <one sentence>
- **Actual:** <one sentence>

### User Impact
<one to three sentences>

### Suggested Fix
<one to three sentences OR a small code snippet>

### Confidence
High | Medium
```

## Footer (required)

```markdown
---

## Meta

- **Report generated:** <ISO 8601 timestamp UTC>
- **Prior 7-day recurrence check:** <"none" or list of prior BUG-IDs referenced>
- **Notes for tomorrow:** <optional short line>
```

## Rules

1. Only High or Medium confidence findings. Never report Low confidence.
2. Severity is defined in `AGENTS.md` — do not invent new levels.
3. Never post the same file:line twice in one report — merge into one finding.
4. Cite specific line numbers using `path:LINE` format so links work in the email client.
5. Redact any secret value: `sk-...REDACTED`.
