# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this layout. The orchestrator's email parser depends on it.

## Frontmatter

```yaml
---
date: YYYY-MM-DD
focus: functional | visual | performance | security
findings: <integer count>
runtime_minutes: <integer or "n/a">
---
```

## Body

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** <focus>
**Findings:** <count>

## Summary

<one paragraph: what was checked, headline result. If zero findings, say so plainly.>

## Findings

### [<SEVERITY>] <bug-id> — <short title>

- **File:** `path/to/file.ext:LINE` (or multiple)
- **Severity:** P0 | P1 | P2 | P3
- **Status:** new | recurring (link to prior report if recurring)

**What's wrong**
<2-4 sentences explaining the defect.>

**Repro**
<Numbered steps OR exact code snippet with line refs.>

**Suggested fix**
<1-3 sentences. Optional. Skip if obvious.>

---

(repeat per finding)

## Checked but clean

- <area 1>
- <area 2>

## Notes for next run

<Optional. Patterns spotted, follow-ups, areas to revisit.>
```

## Bug ID format

`YYYYMMDD-NN` where NN is a 2-digit zero-padded counter for that day's report (01, 02, ...).

## Severity definitions

- **P0** — Breaks core functionality or exposes user data. Login broken, payment fails, secret in client bundle.
- **P1** — Degrades experience for many users. Form validation broken, mobile layout collapsed, IDOR.
- **P2** — Affects some users or edge cases. Safari-only glitch, missing empty state, minor a11y gap.
- **P3** — Minor polish / tech debt. Deprecated API, small perf win, typo.

## Hard requirements

- One H1 (`# Telos Bug Hunter — date`)
- Each finding starts with `### [P0|P1|P2|P3]` exactly
- Each finding has File / Severity / Status fields in that order
- Zero-finding reports omit the `## Findings` section entirely and instead include `## Findings\n\nNone today.`
