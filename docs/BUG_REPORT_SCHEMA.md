# Bug Report Schema

Each daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this schema.
The email dispatcher parses this format — deviations break the pipeline.

## File name

`agent/reports/YYYY-MM-DD.md` — one file per run, ISO date.

## Top matter

```markdown
# Telos Bug Hunter Report — YYYY-MM-DD

**Focus:** Functional | Visual/UX | Performance | Security
**Bugs found:** N
**Highest severity:** P0 | P1 | P2 | P3 | none
```

## Zero-bug report

When nothing is found:

```markdown
## No bugs found

Ran <focus> checks against <areas>. Nothing actionable surfaced.

<optional: one sentence on what was inspected>
```

Then stop. Do not pad.

## Bug entries

One `## Bug N — <one-line title>` heading per finding. Body fields, in this order:

```markdown
## Bug 1 — <one-line title>

**Severity:** P0 | P1 | P2 | P3
**Area:** <path or feature, e.g. api/client/login.js or Client Dashboard: Training tab>
**File(s):** `<repo-relative path>:<line>` (repeat as needed)

### What's wrong
<2-4 sentences describing the defect concretely>

### How to reproduce
1. <step>
2. <step>
3. <observed vs expected>

### Suggested fix
<1-3 sentences — a specific change, not a vague direction>

### Confidence
<one line: what makes you sure this is real, and what would prove you wrong>
```

## Footer

```markdown
---

**Approval:** reply APPROVE 1,3 or DENY 2 to feed decisions.jsonl.
```

## Hard requirements

- ISO date in file name.
- Focus line matches one of the four categories.
- Every bug has all six fields (Severity, Area, File(s), What's wrong, How to reproduce, Suggested fix, Confidence).
- File paths are repo-relative, not absolute.
- Bug numbers start at 1 and are contiguous.
- No emoji, no marketing copy, no filler.
