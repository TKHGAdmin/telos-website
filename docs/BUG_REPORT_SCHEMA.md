# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this structure. The parser in `run.py` (and the approve/deny workflow) depends on it.

## File location

`agent/reports/YYYY-MM-DD.md` — one file per daily run, dated in UTC.

## Required top-matter

```markdown
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Findings:** N (P0: n, P1: n, P2: n, P3: n)
**Status:** findings | zero-bugs | blocked

---
```

- `Focus` matches today's rotation slot (see `agent/memory/focus-rotation.json`).
- `Findings` counts must match the actual sections below.
- `Status`:
  - `findings` — one or more real bugs reported
  - `zero-bugs` — honest zero-finding day (valid and preferred over padding)
  - `blocked` — could not run (e.g., missing infra, env, permissions); include a Blocker section

## Finding sections

Each finding is a second-level heading with a stable ID:

```markdown
## BUG-YYYYMMDD-NN - <P0|P1|P2|P3> - <short title>

**Category:** auth | validation | data-integrity | routing | caching | cron | frontend | api | a11y | perf | security | other
**File:** `relative/path.ext:LINE`
**Status:** new | recurring (see BUG-YYYYMMDD-NN)

### Evidence
<1-3 sentences pointing at the exact code or behavior that is wrong>

### Reproduction
<concrete steps or trace showing the failure; cite file:line>

### Impact
<who is affected, what they see, how often>

### Suggested fix
<one or two sentences; a fix hint, not a patch>

---
```

- IDs are `BUG-YYYYMMDD-NN` where `NN` is zero-padded per-day sequence.
- `Status: recurring` means the same bug was reported in a prior run and is still unresolved; include the prior ID.
- Severities MUST be one of `P0 P1 P2 P3`.

## Zero-bugs day

If nothing qualifies through triage, use:

```markdown
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus:** <focus>
**Findings:** 0
**Status:** zero-bugs

No reportable issues. Explored: <1-line of what was checked>.
```

## Blocker day

If the run could not complete (e.g., bootstrap missing, env var not set, repo in bad state):

```markdown
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus:** <focus or "n/a">
**Findings:** 0
**Status:** blocked

### Blocker
<what stopped the run, what is needed to unblock>
```

## Hard rules

- Do not include style preferences, "could be cleaner", or speculative issues.
- Do not duplicate findings from the last 14 days unless marking `Status: recurring`.
- Redact secrets if encountered: `sk-ant-REDACTED`, `whsec_REDACTED`, etc.
- Report only the Telos Fitness web platform at this repo. Other Thomas projects are out of scope.
