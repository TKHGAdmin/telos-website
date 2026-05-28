# Bug Report Schema

The Telos Bug Hunter writes one Markdown file per day at `agent/reports/YYYY-MM-DD.md`. The format below is the contract the email parser depends on. Do not deviate.

## File layout

````markdown
# Telos Bug Hunt — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** <integer count>
**Approval target:** <e.g. "high precision, conservative">

## Summary
<1-3 sentences. State the focus area, the headline finding (if any), and whether anything is urgent. If zero bugs, say so plainly.>

---

## Bug <ID>: <Short Title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <e.g. client-dashboard, /api/submit-quiz, thomas.html Pipeline tab>
- **Files:** <path:line[, path:line]>
- **Status:** new | recurring (see <prior-id>)

### What's wrong
<2-4 sentences describing the bug.>

### Repro / Evidence
<Exact steps, or a code excerpt with `path:line` references. Be concrete.>

### Suggested fix
<1-3 sentences. Specific. Reference exact files and lines where possible.>

### Why this matters
<1 sentence on user/developer impact.>

---

<repeat for each bug>

## Notes for tomorrow
<Optional. Patterns spotted, follow-ups to investigate, files you didn't get to.>
````

## ID format

`YYYYMMDD-NN` where `NN` is a zero-padded 2-digit sequence within the day. Example: `20260528-01`.

## Hard requirements

1. The first line MUST be `# Telos Bug Hunt — YYYY-MM-DD`.
2. The metadata block (Focus / Findings / Approval target) MUST appear before the Summary.
3. Each bug MUST start with `## Bug <ID>:` and include the Severity/Area/Files/Status block.
4. Severity values are exactly `P0`, `P1`, `P2`, or `P3` — no other strings.
5. Use plain hyphens, never em dashes.
6. If `Findings: 0`, omit all `## Bug` sections and write a one-paragraph Summary explaining what was checked.
