# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must follow this exact schema. The email pipeline parses these files with a simple regex/YAML front-matter parser — do not add extra top-level fields, and do not rename sections.

---

## File front matter (required)

```yaml
---
date: YYYY-MM-DD
focus: functional | visual-ux | performance | security
bugs_found: <integer>
status: bugs-found | zero-findings
---
```

- `date` must match the filename.
- `focus` must be one of the four rotation values (kebab-case).
- `bugs_found` is the total count of findings in the report (0 if none).
- `status` is `zero-findings` if `bugs_found == 0`, else `bugs-found`.

---

## Body sections

### 1. Summary (required, always)

A single paragraph (1-4 sentences) covering:
- what focus area was hunted today
- headline result (X bugs found, or clean run)
- any noteworthy context (e.g., "unable to run npm audit — no lockfile")

### 2. Findings (required if `bugs_found > 0`)

Repeat this exact block once per bug. Bugs are ordered most-severe first (P0 → P3).

```markdown
### BUG-YYYYMMDD-N — <short title>

- **Severity**: P0 | P1 | P2 | P3
- **Category**: functional | visual-ux | performance | security
- **Location**: `path/to/file.js:LINE` (or `path/to/file.js:START-END` for ranges; multiple locations comma-separated)
- **Live URL** (optional): `https://...` — only if the bug is reproducible on the live site

**What's wrong**
One or two sentences describing the defect.

**Why it matters**
Concrete impact — who's affected, when, and how bad. If security, describe the attack.

**Repro / evidence**
Numbered steps or code excerpt that proves the bug. Include line numbers and code snippets. Redact any secrets as `sk-...-REDACTED`.

**Suggested fix**
One paragraph (or a short code diff) with a concrete direction. Do not attempt to apply it.
```

`BUG-YYYYMMDD-N` — the date matches the report date, `N` is a 1-indexed counter unique within the day.

### 3. Zero-findings note (required if `bugs_found == 0`)

Under a `### Nothing to report` heading, write 1-2 sentences confirming the hunt ran to completion and honestly turned up nothing worth Thomas's attention. Do not pad. Do not manufacture a bug.

### 4. Coverage notes (optional)

Under `### Coverage notes`, briefly list what you looked at that did *not* yield findings. Bullets are fine. Purpose: gives Thomas confidence the hunt was real, and helps the next day's agent avoid re-treading the same ground.

### 5. Recurring / carried-over (required if any prior open bug re-surfaced)

Under `### Still unresolved`, list any prior bug IDs that reappeared today (`BUG-YYYYMMDD-N — one-line status`). Do not re-report their full detail; just cross-reference.

---

## Constraints

- Do not include a bug that lacks a concrete `Location`.
- Do not add sections not listed above. The parser will ignore them, but consistency matters for review speed.
- Keep total report length under ~800 lines. If you have more findings than that, raise the severity bar for the day.
