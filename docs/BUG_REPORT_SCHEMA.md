# Bug Report Schema

Daily reports written by the Telos Bug Hunter agent at `agent/reports/YYYY-MM-DD.md`.

## File Format

```markdown
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
bugs_found: <integer>
agent_run: <integer>     # sequential run number
---

# Bug Report - YYYY-MM-DD

**Focus area today:** <focus>

## Summary
<1-3 sentence summary of what was hunted and the headline findings.>

## Bugs

### Bug 1 - <Severity> - <Short title>

**ID:** <YYYY-MM-DD>-<n>
**Severity:** P0 | P1 | P2 | P3
**Area:** <feature / file / flow>
**File:** `path/to/file.ext:line_or_range`

**What's wrong**
<Plain description of the bug.>

**How to reproduce**
1. ...
2. ...
3. ...

**Why it matters**
<Who's affected and what they experience.>

**Suggested fix**
<Concrete pointer or code sketch. Optional.>

---

### Bug 2 - ...

(repeat per bug)

## Zero-bug runs

If no bugs were found:

> No actionable bugs found today. Areas inspected: <list>. Next focus: <area>.
```

## Rules

- One Markdown file per day at `agent/reports/YYYY-MM-DD.md`.
- Frontmatter is required.
- Bug IDs are `<date>-<n>` starting at 1, zero-padded if desired.
- Severity is exactly one of `P0`, `P1`, `P2`, `P3` (see agent prompt for definitions).
- Use `file:line` references so the user can jump straight to the source.
- Never include code from outside the repo, never include secrets.
