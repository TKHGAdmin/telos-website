# Bug Report Schema

The daily bug-hunter report MUST conform to this schema so `run.py` can parse it
into an email and feed approve/deny decisions back into `decisions.jsonl`.

## File location

`agent/reports/YYYY-MM-DD.md` — one report per UTC date.

## Required structure

```markdown
# Telos Bug Report - YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** <integer count>
**Time spent:** ~<minutes> min

## Summary

<1-3 sentence summary. If zero findings, say "No actionable bugs found.">

---

## Bug <N>: <short title>

- **ID:** `<YYYY-MM-DD>-<N>` (1-indexed, monotonic)
- **Severity:** P0 | P1 | P2 | P3
- **Confidence:** high | medium
- **Area:** <e.g. api/dashboard/clients.js, js/quiz.js, client-dashboard.html>
- **File(s):** path/to/file.js:LINE
- **Status:** new | recurring (prior: <YYYY-MM-DD>-<N>)

### What's wrong

<1-2 sentences>

### Reproduce

1. <Step>
2. <Step>
3. <Step>

### Fix sketch

<1-3 sentences proposing how to fix. Optional.>

---

(repeat for each bug)
```

## Rules

1. Bug IDs are `YYYY-MM-DD-<N>` so a denial can be expressed as
   `{"id": "2026-06-24-1", "decision": "deny", "reason": "intended"}`.
2. Severity / Confidence values are case-sensitive (P0..P3, high|medium).
3. Headers and bold field labels must match exactly — the parser keys off them.
4. If zero findings: keep the header block, set `Findings: 0`, and write the
   summary line only. No empty bug sections.
5. Never include secrets in the report — redact as `REDACTED`.
6. The full bug list is wrapped in `---` separators on either side; the parser
   splits on `^---$` to enumerate findings.
