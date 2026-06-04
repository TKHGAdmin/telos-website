# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must conform to this schema. The orchestrator parses these files; deviations break the email pipeline.

## File location
`agent/reports/YYYY-MM-DD.md` — one file per run, dated in UTC.

## Top-level structure

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Run started:** <ISO 8601 timestamp>
**Bugs found:** <integer>
**Approval rate (last 30 days):** <percent or "n/a">

## Summary
<2-4 sentence summary of what was scanned and the headline finding. If zero bugs, say so plainly.>

## Findings

<Zero or more findings, each in the format below. Omit this section entirely if zero bugs found.>

### BUG-YYYYMMDD-NN — <short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <module/path, e.g., `api/client/login.js` or `client-dashboard.html`>
- **Reproducible:** Yes | No (explain if No)
- **First seen:** <YYYY-MM-DD or "today">

**What's wrong:**
<1-3 sentences describing the bug.>

**Evidence:**
<Code excerpt with `file:line` reference, or curl/fetch result, or screenshot path.>

**Why it matters:**
<Who is affected and what breaks for them.>

**Suggested fix:**
<Optional. One line if obvious; omit if non-trivial.>

## Areas scanned
- <bullet list of files / paths / live URLs inspected>

## Notes for next run
<Optional. What to look at tomorrow, false-positive patterns to skip, etc.>
```

## Rules

1. **Bug IDs** are `BUG-YYYYMMDD-NN` where `NN` is a 2-digit sequence starting at `01` per day.
2. **Severity** must be one of `P0`, `P1`, `P2`, `P3` — case-sensitive.
3. **Focus** must match one of the four rotation values exactly.
4. **Approval rate** is computed from `agent/memory/decisions.jsonl` over the last 30 days. Use `n/a` if there are fewer than 5 decisions on record.
5. **Zero-bug days** still produce a report file with `Bugs found: 0` and an explicit "no findings" line in Summary. Omit the Findings section entirely.
6. **No HTML, no emojis, no decorative formatting** outside the markdown structure above.
