# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this schema. The `run.py` orchestrator parses these files to build the email digest, so deviations break the pipeline.

## File header (YAML frontmatter)

```yaml
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
bugs_found: <integer>
---
```

## Body sections

### 1. Summary

A 1-3 sentence plain-English summary of what was checked and what was found. If zero bugs, say so plainly.

### 2. Bugs

Zero or more bug entries. Each bug uses this exact structure:

```markdown
### BUG-YYYYMMDD-NN — <short title>

- **Severity:** P0 | P1 | P2 | P3
- **Area:** <file or feature, e.g. `api/client/login.js` or "Client Dashboard - Nutrition tab">
- **Status:** new | recurring (if recurring, reference prior BUG ID)

**What's wrong**
<1-3 sentences describing the defect.>

**Repro / Evidence**
<Exact steps, file:line refs, or code excerpts. Must be actionable — a developer should be able to verify in under 2 minutes.>

**Suggested fix**
<1-2 sentences. Optional but encouraged.>
```

Bug IDs use the format `BUG-YYYYMMDD-NN` where NN is a zero-padded sequence within the day (01, 02, ...).

### 3. Areas explored

A bullet list of the files / features / endpoints that were inspected today. Helps Thomas see coverage and prevents the agent from rehashing the same surface every day.

### 4. Notes for tomorrow

Optional. Anything the next run should follow up on (e.g. "didn't get to test the hyrox predictor edge cases").

## Rules

1. **No bugs ≠ empty file.** Even on a zero-bug day, the file MUST have frontmatter, summary, and "Areas explored."
2. **No prose padding.** Skip flowery language. Senior-engineer voice.
3. **No fabricated severity.** P0 means real harm to users or data. Don't inflate.
4. **No duplicate IDs.** Bug IDs are append-only across the lifetime of the agent.
