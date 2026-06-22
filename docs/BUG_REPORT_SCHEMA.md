# Bug Report Schema

Reports are written to `agent/reports/YYYY-MM-DD.md`. The parser in `run.py` reads them, so the format must be exact.

## File header

```
# Telos Bug Hunt — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Run mode:** scheduled | manual
**Findings:** N (P0: x, P1: y, P2: z, P3: w)
```

## Zero-finding report

If no bugs were found, the body is:

```
## Summary

No new bugs detected. Surfaces inspected: <bulleted list of files/areas/checks performed>.

## Notes

<optional one-paragraph note on what was looked at and ruled out>
```

That's it. No padding, no fabricated finds. Exit with a clean summary.

## With findings

Each finding is its own H2 block with the fields below — all required.

```
## [P0|P1|P2|P3] <Short title (max 80 chars)>

**ID:** YYYY-MM-DD-N            (N = 1-indexed within the day)
**Surface:** <file path or URL>
**Lines:** <e.g. shop.js:120-145, or "N/A">
**Status:** new | recurring (prior: <prior ID>)

### What's wrong
<2-4 sentence description of the bug in plain English>

### Why it matters
<1-2 sentences on user/developer impact>

### Repro
<numbered steps OR pointer to the exact code path>

### Suggested fix
<concrete change — code snippet, file diff, or 1-3 sentence description>

---
```

## Tail

After all findings:

```
## Inspected this run

- <surface 1>
- <surface 2>

## Notes for next run

<optional one-paragraph note for self / future Claude>
```

## Hard rules

- Severity must be one of P0/P1/P2/P3 — no other labels.
- ID format is strict: `YYYY-MM-DD-N`.
- Every finding includes all sections (What's wrong / Why it matters / Repro / Suggested fix).
- Use `---` between findings.
- No em dashes anywhere in reports — use hyphens.
