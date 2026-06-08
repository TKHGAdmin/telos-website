# Bug Report Schema

This document defines the contract for daily reports written by the Telos Bug Hunter agent. The downstream emailer / parser depends on this format being stable.

## File location

`agent/reports/YYYY-MM-DD.md` — one report per UTC day.

## Top-level structure

```markdown
# Telos Bug Hunt — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** <N>
**Run notes:** <one-line summary, e.g. "3 findings, all in shop/product flow">

---

## Summary

<2-3 sentence executive summary. If zero findings, say so plainly here.>

---

## Findings

<one `### Finding` block per bug, in P0 -> P3 order>

---

## Areas explored

<short bulleted list of files/flows the agent looked at, for transparency>
```

## Per-finding block

Each finding follows this exact format. Fields are case-sensitive and must appear in this order so the parser can extract them deterministically.

```markdown
### Finding <ID>: <P0|P1|P2|P3> — <Title>

- **Location:** `<file path>:<line(s)>` (or `<file path>` if line-level isn't applicable)
- **Confidence:** <high | medium>
- **Category:** <functional | visual | ux | a11y | performance | security | seo | tech-debt>

**Description**

<1-3 paragraphs explaining what is wrong and why it matters.>

**Reproduction / Evidence**

<numbered or bulleted steps, or a code excerpt, that lets Thomas verify in under a minute.>

**Suggested fix**

<a concrete, minimal change. Code snippets if helpful. Do NOT apply the fix — only describe it.>
```

## ID format

`TLS-YYYYMMDD-NN` where `NN` is a zero-padded counter starting at `01` per day.

Example: `TLS-20260608-01`, `TLS-20260608-02`.

## Severity definitions

| Severity | Definition |
|---|---|
| **P0** | Breaks core functionality or exposes user data. |
| **P1** | Degrades experience for many users. |
| **P2** | Affects some users or edge cases. |
| **P3** | Minor polish / tech debt worth flagging. |

## Zero-finding day

If the agent finds no real bugs, the report must still be written, with `**Findings:** 0` and an honest summary. The `## Findings` section may be empty (no `### Finding` blocks). The parser must accept this.

## Rules

1. The parser splits on `### Finding ` (with trailing space). Do not use that exact prefix elsewhere.
2. Field labels (`**Location:**`, `**Confidence:**`, `**Category:**`) must be exact - no variants.
3. No HTML in the report. Markdown only.
4. No emojis.
5. File paths are relative to the repo root (no leading `/`).
