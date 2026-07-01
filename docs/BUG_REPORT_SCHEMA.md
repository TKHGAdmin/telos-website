# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this exact structure. The email dispatcher and future dashboards parse against it — deviate and the report will be silently dropped.

## File name

`agent/reports/YYYY-MM-DD.md` (UTC date, zero-padded).

## Front matter (YAML)

```yaml
---
date: 2026-07-01
focus: functional          # one of: functional | visual | performance | security
bugs_found: 3              # integer; 0 is valid and expected on quiet days
run_status: ok             # ok | partial | error
---
```

## Body

### 1. Summary section

```markdown
## Summary

One or two sentences. What did you look at, what did you find. If zero bugs, say
"Zero bugs to report today." and stop — do not pad.
```

### 2. Findings section (skip entirely if bugs_found == 0)

For each bug, a single H3 block in **descending severity** order:

```markdown
### BUG-YYYYMMDD-NN — <severity> — <one-line title>

- **File**: `path/to/file.js:LINE`
- **Severity**: P0 | P1 | P2 | P3
- **Category**: functional | visual | performance | security
- **First seen**: YYYY-MM-DD (today, unless recurring — then the earliest date it was reported)
- **Status**: new | recurring
- **Confidence**: high | medium

**What's wrong**
1-3 sentences describing the defect.

**Reproduce**
Numbered steps or a code excerpt sufficient for Thomas to see it himself.

**Suggested fix**
1-3 sentences. Optional. Skip if unclear.
```

`NN` is a two-digit ordinal within the day (`01`, `02`, ...). BUG IDs are stable — if the same bug reappears, keep the original ID and set `Status: recurring`.

### 3. Coverage note (always present)

```markdown
## Coverage

- Areas inspected: (bullet list)
- Areas skipped and why: (bullet list)
```

Keeps runs auditable: if a whole subsystem is silent for a week, this shows whether it was checked or ignored.

## Hard rules

- No em dashes (project convention).
- Never inline secrets — redact to `REDACTED` and flag P0.
- Do not add sections beyond the three above; the parser rejects unknown headings.
- Keep each finding under 250 words. Longer means unclear thinking.
