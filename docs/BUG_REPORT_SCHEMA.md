# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` must conform to this schema. The email/notification pipeline parses these files - deviations will break delivery.

## File name

`agent/reports/YYYY-MM-DD.md` - ISO date, one file per run.

## Front matter

Every report starts with a YAML block:

```yaml
---
date: YYYY-MM-DD
focus: Functional | Visual/UX | Performance | Security
bugs_found: <integer>
zero_bug_report: true | false
---
```

## Body

### If `bugs_found == 0`

Body is a single paragraph starting with `**No bugs found.**` followed by a short (1-3 sentence) note on what was scanned. Nothing else. Do not pad.

### If `bugs_found > 0`

For each bug, use this exact structure. Order bugs by severity (P0 first).

```markdown
## BUG-YYYYMMDD-NN: <short title>

- **Severity**: P0 | P1 | P2 | P3
- **Category**: <category slug, e.g. functional, visual, perf, security>
- **File(s)**: `path/to/file.ext:line` (comma-separated if multiple)
- **Reproduction**: <exact steps or trace>
- **Impact**: <who is affected and how>
- **Suggested fix**: <one-sentence recommendation>
- **Confidence**: high | medium
```

Rules:
- Bug ID format: `BUG-YYYYMMDD-NN` where `NN` is a zero-padded index starting at `01` per report.
- Never include `low` confidence bugs. Withhold them.
- `File(s)` must reference real, existing files. Use `path:line` where line is known.
- Never include secrets in the report - redact them (`sk-REDACTED`).

## After the last bug

Add a short trailing section:

```markdown
---

### Scan summary

- <what areas were scanned>
- <any areas skipped and why>
- <duplicates against last 14 days: none | list of BUG-IDs>
```

## Example (zero-bug)

```markdown
---
date: 2026-07-08
focus: Functional
bugs_found: 0
zero_bug_report: true
---

**No bugs found.** Scanned api/submit-chs-application.js, api/lib/auth.js, api/lib/client-auth.js, api/cron/*, api/client/login.js, shop.html and product.html Shopify integration. No new functional defects surfaced.
```
