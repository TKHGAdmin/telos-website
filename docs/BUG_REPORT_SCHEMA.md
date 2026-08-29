# Bug Report Schema

The Telos Bug Hunter agent writes one Markdown file per run at `agent/reports/YYYY-MM-DD.md`.
This schema is the parser contract. Do not change without also updating `run.py`.

## File name

`agent/reports/YYYY-MM-DD.md` (UTC date of the run).

## Required top matter

```
# Telos Bug Hunt — YYYY-MM-DD

- **Focus**: Functional | Visual/UX | Performance | Security
- **Findings**: N
- **Status**: findings | clean
```

`Status: clean` means zero real bugs. `Status: findings` means one or more entries below.

## Per-finding block

Repeat once per bug, most-severe first. Numbering starts at 1.

```
## Bug 1 — <one-line title>

- **Severity**: P0 | P1 | P2 | P3
- **Area**: functional | visual | performance | security
- **File**: <repo-relative path>:<line>
- **Verified**: yes | needs-live-test
- **Duplicate-of**: <bug-id from prior report, or "none">

**Evidence**
```language
<2-6 lines of code>
```

**Impact**
<1-3 sentences on who this hurts and how>

**Suggested fix**
<one sentence>
```

## Zero-finding report

When `Status: clean`, omit all `## Bug N` blocks and add:

```
## Notes

<one paragraph on what was covered and why nothing rose to the reporting bar>
```

## Rules

- Every finding must have an exact `file:line` citation.
- `Verified: needs-live-test` findings must be P2 or lower.
- If a bug is a duplicate of a still-unresolved prior finding, reference its bug ID
  (e.g. `2026-08-22 Bug 3`) rather than re-describing it in full.
- No em dashes in report body; use `-`.
- Keep the whole file under 1500 words.
