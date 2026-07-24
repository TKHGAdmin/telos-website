# Telos Bug Hunter — Learnings

Rolling knowledge base. Compress older entries when this file exceeds 2000 lines.

## Codebase orientation

- Stack: pure HTML/CSS/JS, no build step, Vercel static + serverless functions.
- Data: Upstash Redis via REST (no npm SDK).
- Two dashboards are self-contained (thomas.html, client-dashboard.html) — they do NOT load main.js or the shared stylesheet.
- Auth cookies: admin uses `telos_dash_session` (2-part token, SameSite=Strict), client uses `telos_client_session` (3-part token, SameSite=None; Partitioned for Whop iframe).
- Clean URLs (`vercel.json` cleanUrls). Internal links must not carry `.html`.
- CSS version string on `<link>` tags is a manual cache-buster; bump on every style.css change.

## False-positive patterns to avoid

_(Populated by denials. Empty on first run.)_

## Confirmed real-bug patterns

_(Populated by approvals. Empty on first run.)_

## Notes from run 001 (2026-07-24, Functional focus)

- Bootstrap run. No memory files existed, no prior reports. Created scaffold.
- Recent commits (`f5cb8c4` back through `ad1427a`) are heavy on shop/product/cart work — an area worth extra scrutiny in the next few runs while it's still settling.
- `.claude/` is a directory that already existed at repo root — do not touch.
