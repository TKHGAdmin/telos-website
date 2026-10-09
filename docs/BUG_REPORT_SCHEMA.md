# Bug Report Schema

Each daily report lives at `agent/reports/YYYY-MM-DD.md` and MUST follow this layout. `run.py` or the email layer parses it; break the layout and the run will fail silently.

## Top-level structure

```markdown
# Telos Bug Hunter — YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** <N>
**Approval rate (trailing 30d):** <X%  |  n/a if no decisions yet>

## Summary

<One paragraph. If zero bugs, say so plainly and briefly describe what you checked.>

## Findings

<Zero or more `### Finding` blocks, in severity order (P0 → P3). If none, omit this section.>
```

## Per-finding block

Every finding uses this exact shape:

```markdown
### Finding N — <P0|P1|P2|P3> — <Short title>

**Area:** <short area tag, e.g. `api/dashboard/login`, `client-dashboard.html`, `shop.js`>
**Severity:** <P0|P1|P2|P3>
**Status:** new
**ID:** <YYYY-MM-DD-NN>

**What's wrong**
<2-4 sentences stating the defect, in plain English.>

**Where**
<Repo-relative path(s) and line number(s). Use `file:line` form.>

**Repro / Evidence**
<Minimum steps to reproduce, or the specific code excerpt that proves it. Keep code blocks tight.>

**Impact**
<Who it affects and what breaks for them. One or two sentences.>

**Suggested fix**
<One paragraph or a short bullet list. Be concrete; name the function / file / change.>

**Confidence:** <High | Medium | Low>
```

## Severity definitions

| Severity | When to use |
|---|---|
| **P0** | Breaks core functionality for all users OR exposes secrets / user data |
| **P1** | Degrades experience for many users OR enables a credible attack with low attacker effort |
| **P2** | Edge case or theoretical issue; limited blast radius |
| **P3** | Minor polish, tech debt, or defense-in-depth |

## Rules

1. Severity order inside the Findings section is strict: P0 first, then P1, P2, P3.
2. `ID` is `YYYY-MM-DD-NN` where NN is zero-padded ordinal (01, 02, …) within that day.
3. `Status` is always `new` when the agent writes it. The decision loop (approval/denial) updates it externally in `agent/memory/decisions.jsonl`.
4. Zero findings is valid. In that case, the Findings section is omitted entirely and the Summary explains what was checked.
5. No marketing fluff. No emojis. Direct, factual language.
