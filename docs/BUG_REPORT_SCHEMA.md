# Bug Report Schema

Every daily report file at `agent/reports/YYYY-MM-DD.md` must follow this exact structure. The `run.py` orchestrator (or any downstream reader) depends on the layout being predictable.

---

## File Naming

`agent/reports/YYYY-MM-DD.md` — ISO date, one file per run.

## Required Frontmatter

Every report begins with a YAML frontmatter block:

```yaml
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bug_count: <integer>
model: claude-opus-4-7
---
```

## Required Sections (in order)

1. `# Telos Bug Hunter — YYYY-MM-DD`
2. `## Summary` — one paragraph, plain English. State the focus, whether anything real was found, and the top-line takeaway.
3. `## Bugs` — one `###` subsection per bug, or a single line "No bugs found." if empty.

## Bug Entry Format

Each `###` subsection follows this exact layout:

```markdown
### BUG-YYYY-MM-DD-NN: <short title>

- **Severity**: P0 | P1 | P2 | P3
- **Area**: <page, endpoint, or subsystem>
- **File**: `<path>:<line>` (or multiple, comma-separated)
- **Introduced**: `<git short sha>` (if known) — otherwise "unknown"

**What's wrong**

<1-3 sentences describing the defect precisely.>

**Reproduction / evidence**

<Exact steps, or the code excerpt with line references, that make the bug observable.>

**Impact**

<Who is affected and how. Be concrete.>

**Suggested fix**

<Minimal, targeted change. Do not write the code — describe it.>
```

- `NN` is a zero-padded index (`01`, `02`, ...) unique within the day.
- Never use em dashes anywhere in the report (hyphens only).
- Never inline images or binary data.
- If no bugs found, omit the `### BUG-...` subsections entirely and put "No bugs found." under `## Bugs`.

## Optional Trailing Sections

- `## Notes` — anything the hunter wants to record that isn't a bug (e.g. a pattern that might be a bug but couldn't be verified this run).
- `## Skipped` — candidate issues explicitly excluded (with a one-liner reason) so future runs can see prior judgment calls.

## Hard Rules

- Never fabricate. Zero-bug is a valid report.
- Never repeat a bug reported in the last 14 days unless the prior one was closed (denied or fixed). If recurring after a fix, reference the prior bug ID.
- Never break the frontmatter or section order — the parser depends on it.
- Redact any secret discovered: `sk-live-REDACTED`, etc.
