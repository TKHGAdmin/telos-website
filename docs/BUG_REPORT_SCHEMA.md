# Bug Report Schema

The daily bug-hunter agent writes reports to `agent/reports/YYYY-MM-DD.md`. The parser depends on the structure below. Do not deviate.

## Filename

`agent/reports/YYYY-MM-DD.md` — one report per day. If a report already exists for today, append; do not overwrite.

## Frontmatter (required)

```yaml
---
date: YYYY-MM-DD
focus: functional|visual|performance|security
bug_count: N
p0: N
p1: N
p2: N
p3: N
---
```

## Sections

### `# Summary`

Two or three sentences. Plain English. What you looked at and the headline finding.
If zero bugs were found, state that here and stop — do not fabricate content.

### `# Bugs`

One `## BUG-YYYYMMDD-NN — <short title>` heading per bug. `NN` is a two-digit sequence starting at `01` within the day.

Each bug block MUST contain:

```
- **Severity:** P0 | P1 | P2 | P3
- **File(s):** `path/to/file.js:line-line` (or `line` for a single line)
- **Repro:** one-sentence trigger
- **Effect:** what a real user or dev experiences
- **Fix hint:** one-sentence suggested direction (optional but preferred)
```

Followed by an evidence code block if useful.

### `# Notes` (optional)

Anything the reviewer should know that isn't a bug: infrastructure state, blockers, areas skipped and why.

## Rules

1. Never invent line numbers. If uncertain, omit and note the function name.
2. Cross-reference recurring bugs by prior BUG-ID and mark "still unresolved".
3. Do not include stylistic preferences or "code could be cleaner".
4. Redact any real secret you find: `sk-REDACTED`, `Bearer REDACTED`, etc.
5. If focus for the day yielded nothing, the report is still required — with `bug_count: 0` and a brief Summary.
