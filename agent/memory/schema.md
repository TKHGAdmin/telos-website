# Bug Report Schema

The canonical `docs/BUG_REPORT_SCHEMA.md` is missing from the repo. Until Thomas commits it, each daily report follows the schema below so the parser/email pipeline has a stable contract.

## File location
`agent/reports/YYYY-MM-DD.md`

## Required structure

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus**: Functional | Visual/UX | Performance | Security
**Findings**: N
**Scope read**: short list of dirs/files touched

---

## Summary

One or two sentences. If zero bugs, say so plainly.

---

## Findings

### [P0|P1|P2|P3] <id>: <one-line title>

- **File**: `path/to/file.js:line`
- **Category**: auth | injection | rate-limiting | auth-weakness | data-integrity | performance | a11y | ...
- **Observed**: What the code does today (quote the offending lines if short).
- **Why it's wrong**: Concrete failure scenario — inputs / conditions → bad outcome.
- **Fix sketch**: One short sentence or a 2–4 line patch idea. Not a full PR.
- **Confidence**: high | medium

(repeat for each finding; order by severity then confidence)

---

## Not reported (deliberately excluded)

Short bulleted list of candidate issues examined and rejected, with a one-line reason each. Helps future runs avoid re-flagging and gives Thomas a window into the triage.
```

## Finding ID convention

`YYYYMMDD-NN` — e.g. `20261123-01`. Monotonic within the day. Re-use the same ID in `decisions.jsonl` when Thomas approves/denies.
