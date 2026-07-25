# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this exact structure. The email parser depends on it.

## Structure

```markdown
# Telos Bug Hunt — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Findings:** N
**Approval-ready:** yes | no

## Summary

One paragraph. What was hunted, how many findings by severity, headline take.

## Findings

### [ID] P0/P1/P2/P3 — Short title

- **File:** `path/to/file.js:LINE`
- **Category:** correctness | security | perf | ux | a11y | dead-code
- **Failure scenario:** Concrete inputs / state -> observed wrong behavior.
- **Suggested fix:** One sentence.
- **Confidence:** high | medium
- **Recurring:** no | yes (see YYYY-MM-DD #ID)

(repeat per finding, most severe first)

## Notes

Anything context-worthy for Thomas that isn't a finding (e.g. "checked shop.html end-to-end, nothing broken"). Optional.
```

## Rules

- IDs are `YYYYMMDD-N` (e.g. `20260725-1`). One per finding, sequential.
- If zero findings: keep the header block, set `Findings: 0`, write a one-sentence Summary, omit the `## Findings` section.
- Severity per Agent Instructions.
- Never quote a full secret. Redact as `sk-...REDACTED`.
- Never modify application code — reports are advisory.
