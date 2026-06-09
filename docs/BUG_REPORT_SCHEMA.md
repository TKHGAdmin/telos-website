# Bug Report Schema

This file is the contract the Telos Bug Hunter writes against and the
email/parser reads from. Do not edit casually.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per run, ISO date in the filename.

## File header (required)

```
# Telos Bug Hunter Report - YYYY-MM-DD

- **Focus area**: Functional | Visual/UX | Performance | Security
- **Run started**: ISO timestamp
- **Findings**: N bugs (M P0, M P1, M P2, M P3)
```

## Zero-finding report

If the run produces no findings, the file body is exactly:

```
No new bugs found today. Investigated: <one-line scope of what was checked>.
```

Nothing else. Do not pad.

## Bug entry format

Each bug is a heading-2 block in the following exact structure:

```
## [SEVERITY] Short title in sentence case

**ID**: bug-YYYY-MM-DD-NN
**Status**: new
**File(s)**: `path/one.js:LINE`, `path/two.js:LINE-LINE`
**Category**: functional | ux | performance | security
**Confidence**: high | medium

### What's wrong
1-3 sentences. State the defect plainly. No hedging.

### How to reproduce
Either numbered repro steps OR a code excerpt with `path:line` references.

### Why it matters
1-2 sentences on user/business impact. Quantify if possible
(e.g. "every inactive client gets ~N spam emails/week").

### Suggested fix
1-3 sentences. The smallest change that resolves the defect.
Do not write the patch — just describe the approach.
```

## Rules

- Severity in the heading uses brackets: `[P0]`, `[P1]`, `[P2]`, `[P3]`.
- IDs are sequential within a day, zero-padded to 2 digits.
- File references use `path:line` or `path:start-end` (no URLs).
- Confidence is `high` (you traced it end-to-end) or `medium` (likely but
  not fully verified). Do not include low-confidence findings.
- No emoji. No marketing tone. No "great work" framing.
