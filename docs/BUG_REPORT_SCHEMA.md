# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this exact schema.
The `run.py` orchestrator parses these files; deviations break the email pipeline.

## File layout

```
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** <integer count>
**Approval-ready:** yes | no  (yes if there is at least one P0 or P1)

## Summary

<One paragraph (2-4 sentences). Plain-English recap of what was hunted and what
was found. If zero bugs, say so plainly and note what was checked.>

## Findings

<Zero or more findings, each in the exact block below. Order by severity
(P0 first). If zero findings, replace this whole section with the single
line: `No bugs found today.`>

### BUG-YYYYMMDD-NN — <short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <e.g. api/dashboard/pipeline.js, client-dashboard.html, chs form>
- **File(s):** `path/to/file.js:LINE` (repeat as needed)
- **Reproduction:** <numbered steps or a code trace pointing to exact lines>
- **Impact:** <who is affected and how>
- **Recommendation:** <suggested fix, one or two sentences>
- **Confidence:** high | medium

## Notes

<Optional. Anything Thomas should know that isn't a finding: patterns
observed, areas skipped and why, follow-ups suggested for next rotation.>
```

## Rules

1. Bug IDs are `BUG-YYYYMMDD-NN`, zero-padded, starting at `01`.
2. Severity must be one of `P0`, `P1`, `P2`, `P3` — see AGENT.md for definitions.
3. Confidence must be `high` or `medium`. If it would be `low`, exclude the finding.
4. The `Approval-ready` line must be `yes` if and only if any finding is P0 or P1.
5. Zero-bug reports still include every header (Focus, Findings, Approval-ready,
   Summary, Findings) — Findings section body becomes `No bugs found today.`
