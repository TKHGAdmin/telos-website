# Bug Report Schema

The Telos Bug Hunter emits one Markdown report per day at `agent/reports/YYYY-MM-DD.md`. The `run.py` orchestrator parses these files to build the daily email, so field names and order matter.

## File-level frontmatter

Every report starts with a YAML frontmatter block:

```yaml
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
run_status: ok | partial | error
---
```

- `date` — the UTC date of the run, matches the filename.
- `focus` — today's rotation, matches the focus area exhausted by the run.
- `bugs_found` — count of `## Bug` blocks below. `0` is valid and expected on quiet days.
- `run_status` — `ok` for a clean run, `partial` if some checks were skipped or the environment was incomplete, `error` if the hunt could not complete.

## Body

If `bugs_found: 0`, the body reads:

```
No bugs found today.

<one-paragraph summary of what was checked and why nothing surfaced>
```

Otherwise, each bug is a level-2 heading followed by fixed fields:

```
## Bug <N> — <short title>

- **ID**: `YYYY-MM-DD-<n>`
- **Severity**: P0 | P1 | P2 | P3
- **Area**: <page / endpoint / module>
- **File**: `<path>:<line>` (or `<path>` if range spans many)
- **Category**: functional | visual-ux | performance | security

**Summary**

<one to three sentences stating the defect>

**Reproduction / evidence**

<steps to reproduce, or the exact code excerpt and why it's wrong>

**Suggested fix**

<the minimum change needed, no more>
```

Bug IDs are strictly sequential within a day: `2026-08-26-1`, `2026-08-26-2`, etc.

## Optional trailing section

The report may end with a `## Notes` section for context that isn't a bug (e.g. "P0 backlog item X still unresolved", "scan skipped Y because Z"). The parser ignores this section but Thomas may read it.
