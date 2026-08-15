# Bug Report Schema

The Telos Bug Hunter agent emits one Markdown file per run at
`agent/reports/YYYY-MM-DD.md`. The `run.py` orchestrator parses these files
to email Thomas a rendered digest. Any deviation from this schema breaks
the parser.

## File layout

```
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Bugs found:** <integer>
**Approval-rate target:** >= 70%

## Summary

<Two-to-four sentence executive summary. If zero bugs found, say so plainly
and explain what was checked.>

---

## Findings

### <ID> — <Short imperative title>

- **Severity:** P0 | P1 | P2 | P3
- **File(s):** `path/to/file.js:LINE` (comma-separated; one or more)
- **Category:** <functional | visual | performance | security>
- **Confidence:** high | medium

**What is wrong**

<One paragraph. Concrete. Point at the exact behavior or code fragment.>

**Why it matters**

<Who is affected and how. One or two sentences.>

**Reproduction / evidence**

<Numbered steps to reproduce, or a code excerpt with a caret, or a curl
command. Enough for Thomas to verify in under two minutes.>

**Suggested fix**

<One paragraph. What to change. Not a patch — a direction. Keep it short.>

---
```

Repeat the `### <ID> — <Title>` block for every finding. Separate findings
with a `---` rule.

## ID format

`YYYYMMDD-NN` where `NN` is a two-digit sequence starting at `01`. Example:
`20260815-01`, `20260815-02`.

## Rules for the parser

- The `# Telos Bug Hunter — YYYY-MM-DD` header must be the first line.
- `**Focus:**` and `**Bugs found:**` must appear before the first `---`.
- Each finding starts with `### <ID> — <Title>` (mdash between them).
- Every finding must include the four bold fields (Severity, File(s),
  Category, Confidence) as a single tight list.
- The four subsection headers (**What is wrong**, **Why it matters**,
  **Reproduction / evidence**, **Suggested fix**) are required and appear
  in that order.
- Do not use emojis in reports.
- Do not include speculative "might be" or "could be" findings — Triage
  gate excludes those.

## Zero-bug report

```
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** Functional
**Bugs found:** 0
**Approval-rate target:** >= 70%

## Summary

Reviewed <list of files/areas>. No reportable bugs found. Notes appended
to learnings.md.

---
```
