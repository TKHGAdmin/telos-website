# Bug Report Schema

Every daily report emitted by the Telos Bug Hunter must conform to this schema. `run.py` parses reports on this contract; deviations break the email pipeline.

## File location

`agent/reports/YYYY-MM-DD.md` (UTC date of the run).

## Required top-of-file metadata

```
# Telos Bug Report - YYYY-MM-DD

- Focus: <Functional | Visual/UX | Performance | Security>
- Findings: <integer>
- Approvals to date: <integer or "n/a">
```

## Zero-finding report

If nothing was found, the body is a single paragraph after the metadata:

```
No new issues surfaced this run. Areas inspected: <short list>.
```

Do not pad. A zero-finding report is honest and valid.

## Finding block

Each finding is a level-2 heading followed by fixed key-value fields. All fields required. Order matters.

```
## [P0|P1|P2|P3] <short title>

- ID: <YYYY-MM-DD-###>  (### is 001-999, unique within the day)
- File: <repo-relative path>:<line-or-range>
- Category: <correctness | ui-layout | accessibility | perf | security | dead-link | api-mismatch | data-integrity | other>
- Discovered via: <static-read | grep | live-fetch | lint | audit | manual-trace>

**What's wrong**
<1-3 sentences. Concrete, reproducible.>

**Impact**
<Who is affected and how. Not theoretical.>

**Reproduction**
<Exact steps or line references a developer can follow.>

**Suggested fix**
<Short, specific. Not "refactor everything".>
```

## Severity rubric

- **P0** - breaks core functionality or exposes user data. Login broken, payment fails, secret in client bundle.
- **P1** - degrades experience for many users. Form validation broken, mobile layout collapsed, slow checkout.
- **P2** - affects some users or edge cases. Safari-only glitch, missing empty state, minor accessibility gap.
- **P3** - polish or tech debt worth flagging. Deprecated API, typo, minor perf.

## Hard rules

1. No fabricated bugs. High precision > high volume.
2. No re-reporting of items in the last 14 days unless flagged "still unresolved" with prior ID.
3. No stylistic preferences. Only defects.
4. Redact any leaked secret before writing to the report.
5. Keep each finding under ~200 words. Terse and actionable.
