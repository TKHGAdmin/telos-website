# Bug Report Schema

Every daily report at `agent/reports/YYYY-MM-DD.md` MUST follow this exact structure. The email reporter and (future) dashboard parser depend on it.

## File naming

`agent/reports/YYYY-MM-DD.md` - ISO date of the run, in America/New_York time.

## Top of file (frontmatter)

```markdown
---
date: 2026-04-16
focus: functional
bugs_found: 3
scan_duration_seconds: 412
commit_scanned: abc123def456
---

# Telos Bug Hunter - 2026-04-16

**Focus:** Functional
**Bugs found:** 3 (1 P0, 1 P1, 1 P3)
**Commit scanned:** `abc123de`
```

## Each bug (repeat per finding)

```markdown
## BUG-2026-04-16-001

- **Severity:** P0
- **Status:** pending-review
- **Area:** Checkout / Payment
- **File(s):** `src/components/Checkout.tsx:142-168`
- **First seen:** 2026-04-16

### What's wrong

The `handleSubmit` function in Checkout.tsx calls the Stripe API without awaiting the response, then immediately navigates to the success page. If the payment fails, the user sees a success confirmation for a charge that never happened.

### How to reproduce

1. Add an item to cart and proceed to checkout
2. Enter a test card that will decline (e.g., `4000 0000 0000 0002`)
3. Click "Place Order"
4. Observe: user is routed to `/order-confirmed` despite the decline

### Suggested fix

Await the Stripe promise and branch on result:
```tsx
const result = await stripe.confirmPayment(...);
if (result.error) { showError(result.error); return; }
navigate('/order-confirmed');
```

### Evidence

- Code reference: `src/components/Checkout.tsx` lines 142-168
- Related: no error handling for Stripe failures anywhere in the checkout flow
```

## Required fields per bug

| Field | Required | Notes |
|---|---|---|
| `BUG-YYYY-MM-DD-NNN` heading | Yes | NNN is zero-padded 3-digit sequence, per-day |
| Severity | Yes | P0, P1, P2, or P3 - nothing else |
| Status | Yes | Always `pending-review` on first report |
| Area | Yes | Functional grouping: "Auth", "Checkout", "Booking", etc. |
| File(s) | Yes | With line numbers when applicable |
| First seen | Yes | Date in ISO format |
| What's wrong | Yes | 2-4 sentences, plain English |
| How to reproduce | Yes | Numbered steps OR code trace |
| Suggested fix | Yes | Concrete - code snippet when possible |
| Evidence | Yes | Links, line refs, scanner output |

## Zero-bugs day

When no bugs are found:

```markdown
---
date: 2026-04-16
focus: performance
bugs_found: 0
scan_duration_seconds: 287
commit_scanned: abc123def456
---

# Telos Bug Hunter - 2026-04-16

**Focus:** Performance
**Bugs found:** 0
**Commit scanned:** `abc123de`

No new issues found in today's performance scan.

## What I checked

- Bundle size (main.js: 247KB, within budget of 300KB)
- Lighthouse performance score on `/`, `/workouts`, `/book`: 94, 91, 89
- Image optimization: all images in `/public` are under 200KB
- No new render-blocking scripts since last performance scan (2026-04-12)

## Notes for tomorrow

Next focus: security. Will prioritize `npm audit` and scanning for hardcoded credentials.
```

## Recurring bugs

If a bug is still unresolved after 3+ days, reference the original ID:

```markdown
## BUG-2026-04-19-001 (recurring - originally BUG-2026-04-16-001)

- **Severity:** P0
- **Status:** pending-review
- **Recurring since:** 2026-04-16 (4 days)

Still present as of this scan. No commits have touched `src/components/Checkout.tsx` since original report.
```

After 7 days unresolved, auto-escalate severity one step (P2 → P1, P1 → P0).
