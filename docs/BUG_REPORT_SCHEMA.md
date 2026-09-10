# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this schema exactly. The email parser depends on it.

## Frontmatter

```yaml
---
date: YYYY-MM-DD
focus: functional | visual_ux | performance | security
findings_count: <integer>
---
```

## Body sections

Exactly these sections, in this order:

### 1. Summary

Two sentences max. What you looked at, and the headline result.

### 2. Findings

Zero or more findings. If zero, write "No findings today." and skip to Notes.

Each finding is:

```
#### [P0|P1|P2|P3] <short title>

- **Location:** `path/to/file.ext:LINE` (or route, or Redis key)
- **What's wrong:** one sentence.
- **Why it matters:** one sentence — user or developer impact.
- **Repro / evidence:** exact steps, or a code excerpt (fenced), or the URL that reproduces it.
- **Suggested fix:** one to three sentences. Do not include a patch — Thomas decides.
- **Confidence:** high | medium
```

Order findings most-severe first (P0 before P1, etc.), then most-confident first within a severity.

### 3. Notes

Optional. Anything that isn't a finding but is worth a line: things you couldn't test, areas skipped, questions for Thomas.

## Rules

- No em dashes. Use hyphens.
- No emojis in the report body.
- Every finding must have every field. If a field doesn't apply, write "N/A".
- Confidence "medium" means: I'm reasonably sure but couldn't fully verify. Anything below medium should be excluded, not reported.
- Do not include a "Fabricated" or "Speculative" section — if you're not sure, leave it out.
