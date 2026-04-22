# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this schema exactly. The email parser depends on it.

---

## Required structure

```markdown
# Telos Bug Hunter Report - YYYY-MM-DD

**Focus:** <Functional | Visual/UX | Performance | Security>
**Findings:** N
**Approval rate (last 30 days):** N% (M approved / K decided)

---

## Summary

<One paragraph. What was scanned, headline conclusions. Max 3 sentences.>

---

## Bugs

### BUG-YYYYMMDD-01 | P<0-3> | <Short Title>

- **Severity:** P<0-3>
- **Area:** <api | admin | client-portal | marketing | blog | cron | build | deps>
- **File(s):** `path/to/file.js:LINE` (one per line)
- **Status:** new

**Description**

<2-4 sentences: what's wrong, why it matters, who it affects.>

**Reproduction**

1. Step one
2. Step two
3. Observed vs expected

**Suggested fix**

<1-3 sentences or a minimal diff sketch. Do NOT write code for Thomas - he decides.>

---

### BUG-YYYYMMDD-02 | ...

(repeat block)

---

## Zero-finding reports

If no bugs were found, omit the "## Bugs" section entirely and replace with:

```markdown
## No bugs found today

<One paragraph: what you scanned, why confidence is high that today is clean.>
```

---

## Rules

1. **Bug IDs** are `BUG-YYYYMMDD-NN` where NN is zero-padded (01, 02, ...).
2. **Severity** values: `P0`, `P1`, `P2`, `P3` — no other values.
3. **Status** is always `new` in a fresh report. Thomas updates to `approved`/`denied`/`fixed` out-of-band in `agent/memory/decisions.jsonl`.
4. **File(s)** MUST use `path:line` format so links render in editors.
5. **Area** must be one of: `api`, `admin`, `client-portal`, `marketing`, `blog`, `cron`, `build`, `deps`.
6. No emojis. No sign-off. No attachments.
7. Max 5 bugs per report. If you find more, keep the 5 highest-severity/highest-confidence.
