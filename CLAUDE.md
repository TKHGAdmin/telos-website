# Telos Fitness Website

## Tech Stack
- Pure HTML/CSS/JavaScript (no framework, no build step)
- Hosted on Vercel (static site + serverless functions)
- Production URL: https://www.telosathleticclub.com
- Local dev: `npx serve -l 3000 .` (do NOT use `-s` flag - SPA mode breaks multi-page routing)
- Database: Upstash Redis (via Vercel Marketplace) for dashboard data

## Project Structure
```
/
├── index.html              # Homepage (hero, how it works, about, pricing features, quiz, testimonials, FAQ)
├── pricing.html            # Quiz-gated pricing page (actual prices shown after quiz completion)
├── protein-calculator.html # Standalone tool page
├── hyrox-predictor.html    # Standalone tool page
├── resources.html          # Blog hub with category filters
├── thomas.html             # Business dashboard (password-protected, noindex, 9 tabs incl. Client Portal)
├── client-dashboard.html   # Client portal (PWA, self-contained, dark minimal UI)
├── manifest.json           # PWA manifest for client portal (standalone mode, no URL bar)
├── blog/                   # 23 SEO-optimized articles (training, nutrition, recovery, mindset)
├── css/style.css           # Shared stylesheet (dark theme, gold accent #C9A84C)
├── js/main.js              # Shared interactivity (nav, scroll animations, tilt, cursor, counters)
├── js/quiz.js              # Execution Score Quiz logic (index.html + pricing.html)
├── sw.js                   # Service worker (push notifications, caching)
├── images/                 # Profile photos, app icons (PNG), brand assets
├── api/                    # Vercel Serverless Functions
│   ├── lib/
│   │   ├── auth.js         # Admin session cookie auth (HMAC-signed, timing-safe password check, 7-day expiry)
│   │   ├── client-auth.js  # Client auth (PBKDF2 hashing, client session tokens)
│   │   └── redis.js        # Upstash Redis REST client (no npm deps)
│   ├── submit-quiz.js      # Public: stores quiz submissions (called from quiz.js)
│   ├── submit-email.js     # Public: stores email captures (protein-calc + hyrox)
│   ├── cron/               # Vercel Cron Jobs (require CRON_SECRET)
│   │   ├── weekly-summary.js   # Monday 9am ET: weekly summary email to active clients
│   │   └── engagement-check.js # Daily: reminder email to clients inactive 3+ days
│   ├── client/             # Client portal endpoints (require client session cookie)
│   │   ├── login.js        # POST: email+password login, set telos_client_session cookie
│   │   ├── logout.js       # POST: clear client session cookie
│   │   ├── me.js           # GET: client profile
│   │   ├── daily-log.js    # GET/POST: daily check-in logs (8 fields)
│   │   ├── nutrition-plan.js   # GET: coach-set nutrition plan
│   │   ├── nutrition-log.js    # GET/POST: daily nutrition entries
│   │   ├── mindset.js      # GET: coach-set mindset content
│   │   ├── resources.js    # GET: coach-set resources
│   │   ├── five-four-five.js   # GET/POST: 545 Method (goals, routine, daily tasks)
│   │   ├── training-program.js # GET: coach-set training program
│   │   ├── training-log.js     # GET/POST: workout completion tracking + ?mode=recent&limit=N for history
│   │   ├── food-search.js      # GET: Open Food Facts search proxy (no API key needed)
│   │   ├── sidemenu.js         # GET: client side menu config (returns defaults if none set)
│   │   ├── reset-password.js   # POST: password reset via Resend email
│   │   ├── modules.js      # GET: learning modules list
│   │   ├── module.js        # GET: single module content
│   │   ├── module-progress.js  # GET/POST: module completion tracking
│   │   ├── notify.js        # POST: send push notification to client (admin-triggered)
│   │   ├── push-subscribe.js   # POST: register push subscription
│   │   ├── push-unsubscribe.js # POST: remove push subscription
│   │   ├── send-email.js   # POST: admin-triggered email to client(s)
│   │   ├── activity-log.js  # GET/POST: activity tracking (walk, run, cycling, etc.)
│   │   ├── supplements.js   # GET: coach-set supplement plan
│   │   └── supplement-log.js # GET/POST: daily supplement completion tracking
│   └── dashboard/          # All require admin session cookie auth
│       ├── login.js        # POST: validate password, set session cookie
│       ├── logout.js       # POST: clear session cookie
│       ├── stats.js        # GET: aggregate lead metrics
│       ├── submissions.js  # GET: quiz submissions (paginated)
│       ├── emails.js       # GET: email captures (paginated, filterable)
│       ├── pipeline.js     # CRUD: lead pipeline (6 stages)
│       ├── clients.js      # CRUD: client roster (4 tiers) + portal fields + duplicate email check
│       ├── client-portal.js # CRUD: manage client portal (credentials, nutrition, mindset, resources, training, sidemenu, 545, logs)
│       ├── revenue.js      # GET/POST: MRR, goal tracking
│       ├── content.js      # CRUD: content calendar
│       ├── adspend.js      # CRUD: manual ad spend tracking
│       ├── analytics.js    # GET: Vercel Web Analytics proxy (uses verifySession from lib/auth)
│       ├── modules.js      # CRUD: learning modules management
│       ├── upload-video.js  # POST: upload video to Vercel Blob
│       └── delete-video.js  # DELETE: remove video from Vercel Blob
├── vercel.json             # cleanUrls, CORS headers, function config
└── .vercel/                # Vercel project config
```

## Business Dashboard (/thomas)
- **Password-protected**: Uses `DASHBOARD_PASSWORD` env var + HMAC-signed session cookies (timing-safe comparison)
- **Self-contained**: thomas.html has all CSS/JS inline, does NOT load main.js or style.css
- **9 tabs**: Overview, Pipeline, Clients, Revenue, Leads, Analytics, Content, Ad Spend, Client Portal
- **Data stored in Upstash Redis**: Quiz submissions, email captures, pipeline leads, clients, content, ad spend
- **Quiz/email forms POST to API**: quiz.js and tool pages send data to /api/submit-quiz and /api/submit-email (non-blocking, silent fail)
- **Pipeline stages**: new, contacted, consultation, proposal, closed_won, closed_lost
- **Client tiers**: rebuild ($1,497), growth ($1,997), lifestyle ($2,497), lifestyle_plus ($6,997)
- **Client Portal sub-tabs**: Nutrition Plan, Training, Mindset, Resources, Supplements, Side Menu, 545 Method, Client Logs
- **Training editor**: 7-day accordion, each day has exercises with name/sets/reps/weight/rest/notes/videoUrl
- **Side Menu editor**: Toggle built-in items (Growth/Community/Calls/Resources) on/off, add custom items (link or content panel)
- **Analytics tab**: Requires VERCEL_API_TOKEN env var for Vercel Web Analytics data

## Client Dashboard (/client-dashboard)
- **Email/password auth**: Coach creates client credentials via /thomas Client Portal tab
- **PWA standalone mode**: manifest.json + apple-mobile-web-app-capable meta tags - no URL bar when added to homescreen
- **Self-contained**: client-dashboard.html has all CSS/JS inline, does NOT load main.js or style.css
- **5 bottom tabs** (minimal navigation, active tab shows gold bar indicator):
  - **Home**: Execution score ring, today's checklist (up to 6 items: routine, tasks, training, check-in, nutrition, supplements), KPI cards, macro gauges, training CTA, 7-day trend, 30-day heatmap, activity feed. FAB button (bottom-right gold circle) with popup menu for Quick Actions: Daily Check-in, Log Food, Add Activity.
  - **545 Method**: The 545 personal growth framework - 5 long-term goals, 4-step morning routine, 5 daily tasks. Sub-tabs: Today, Goals, Routine, History. Today sub-tab auto-saves on every interaction (no save button).
  - **Nutrition**: Full nutrition hub with daily macro summary rings (cal/protein/carbs/fat), meals grouped by type (Breakfast/Lunch/Dinner/Snack), weekly nutrition trends bar chart, supplements tracking with daily checkboxes, hydration tracker with quick-add buttons. Food search and manual entry happen via full-screen modal (opened from FAB or "Add Food" button).
  - **Training**: Coach-programmed weekly training with day pills (Mon-Sun). Features: exercise cards with set/rep tracking, progress bar (X of Y sets), rest timer (circular countdown, auto-starts on set completion), previous workout comparison ("Last: 185x8"), workout completion celebration (confetti + auto-save), actual weight/reps input per set
  - **Profile**: Client name, tier, member since, change password, sign out
- **Hamburger menu** (top-left): Opens side drawer with modular items - Growth (mindset), Community (Whop), Book a Call (Calendly, tier-specific), Resources. Coach can add custom items via admin Side Menu tab.
- **Design philosophy**: Direct, clean, minimal, professional. No decorative glows/gradients/shadows. Flat dark backgrounds, gold for brand accents only, red-to-green spectrum for all data/progress, sharp corners (12px radius). Typography-driven hierarchy. Data-first layout. No emojis in data displays.
- **Execution Score**: Calculated from routine done (25%) + tasks done (10% each, max 50%) + daily log (25%)
- **Nutrition Score**: Separate ring - 40% for logging meals + 60% for macro compliance against coach targets
- **Password reset**: Client can request reset email via Resend API
- **Everfit removed**: Training is now fully in-app (no external Everfit dependency)

## Client Dashboard - Redis Keys
```
client:{id}                              # Client record (includes portalEnabled, passwordHash, passwordSalt)
client_email:{normalizedEmail}           # Email-to-ID lookup for login (unique enforced)
password_reset:{token}                   # Reset token (1hr TTL)
client_dailylog:{clientId}:{YYYY-MM-DD}  # Daily check-in log
client_dailylogs_index:{clientId}        # ZSET of logged dates
client_nutrition_plan:{clientId}         # Coach-set nutrition plan
client_nutrition_log:{clientId}:{date}   # Client daily nutrition entry
client_nutrition_logs_index:{clientId}   # ZSET of nutrition log dates
client_mindset:{clientId}               # Coach-set mindset content
client_resources:{clientId}             # Coach-set resources
client_545_goals:{clientId}             # Client's 5 long-term goals
client_545_routine:{clientId}           # Client's 4-step morning routine
client_545_daily:{clientId}:{date}      # Daily 545 tasks + routine completion
client_545_index:{clientId}             # ZSET of 545 daily dates
client_training_program:{clientId}      # Coach-set weekly training program
client_training_log:{clientId}:{date}   # Client workout completion log
client_training_logs_index:{clientId}   # ZSET of training log dates
client_sidemenu:{clientId}              # Coach-set side menu configuration
client_supplement_plan:{clientId}       # Coach-set supplement list
client_supplement_log:{clientId}:{YYYY-MM-DD}  # Daily supplement completion
client_supplement_logs_index:{clientId} # ZSET of supplement log dates
client_activity_log:{clientId}:{YYYY-MM-DD}    # Daily activity log (array of activities)
client_activity_logs_index:{clientId}   # ZSET of activity dates
```

## Environment Variables (Vercel)
```
DASHBOARD_PASSWORD              # Login password for /thomas
SESSION_SECRET                  # 64-char hex for cookie signing (shared by admin + client auth)
UPSTASH_REDIS_REST_KV_REST_API_URL    # Auto-provisioned by Vercel Marketplace
UPSTASH_REDIS_REST_KV_REST_API_TOKEN  # Auto-provisioned by Vercel Marketplace
SITE_URL                        # https://www.telosathleticclub.com
VERCEL_API_TOKEN                # (optional) For analytics tab
RESEND_API_KEY                  # Resend API for client password reset + engagement emails
CRON_SECRET                     # Required for cron endpoints (Vercel auto-injects as auth header)
VAPID_PUBLIC_KEY                # (optional) For push notifications
VAPID_PRIVATE_KEY               # (optional) For push notifications
BLOB_READ_WRITE_TOKEN           # For Vercel Blob video uploads
```

## Important Conventions
- **Clean URLs**: All internal links use clean URLs without `.html` extension (e.g., `protein-calculator` not `protein-calculator.html`). Vercel's `cleanUrls: true` handles this.
- **No em dashes**: Use hyphens `-` everywhere, never `---` or `--`
- **CSS cache busting**: Stylesheet references use `?v=N` query param. Bump the version on all pages when changing style.css.
- **main.js on all public pages**: Every public marketing page loads `js/main.js` for nav, hamburger, scroll animations. Dashboards (thomas.html, client-dashboard.html) are self-contained and do NOT load main.js. Tool pages have their own inline `<script>` for page-specific logic but must NOT duplicate hamburger/nav handlers (main.js handles it).
- **body.page-load-anim**: Only index.html has this class. The fade-in animation is opt-in, not global - prevents blank pages on other routes.
- **Blog articles**: Live in `/blog/` directory. Each is a standalone HTML file with inline `<style>`, Schema.org JSON-LD, and full SEO meta tags. Nav links use `../` prefix.
- **CSS .visible class**: Only scoped to `.animate-on-scroll.visible` in shared CSS. Tool pages use bare `.visible` for their results sections - never add global `.visible` rules.
- **Pricing page gating**: `pricing.html` shows an Execution Score Quiz overlay before revealing prices. Quiz completion stores `telosQuizCompleted` in localStorage. The quiz runs on both index.html (inline) and pricing.html (overlay) via the same `quiz.js` with context detection.
- **Pricing page CSS**: All pricing-page styles are inline `<style>` (prefixed `p-` classes like `.p-card`, `.p-featured`). Do NOT add pricing styles to shared `style.css`.
- **Homepage vs pricing page**: Homepage `#pricing` section shows tier features without dollar amounts. `pricing.html` shows actual prices ($1,497 / $1,997 / $2,497 / $6,997) with a 3-month/6-month toggle.
- **Client dashboard CSS**: All client-dashboard styles are inline `<style>` in client-dashboard.html. Do NOT add styles to shared `style.css`. Same pattern as thomas.html.
- **Client dashboard navigation**: 5 bottom tabs (Home, 545, Nutrition, Train, Profile). Hamburger menu (top-left) opens side drawer for Growth, Community, Calls, Resources + coach-custom items. Home tab has FAB button (gold circle, bottom-right) with popup menu for Daily Check-in, Log Food, Add Activity. Daily Check-in is a full-screen modal (not a tab). Nutrition tab has macro rings, grouped meals, weekly chart, supplements, hydration.
- **Client dashboard design**: Direct, clean, minimal. No decorative glows/gradients. Flat solid backgrounds (#131316 cards on #060608 bg). Gold (#C9A84C) for brand accents only (logo, tabs, buttons), red-to-green spectrum for all data/progress. Sharp 12px radius. No emojis in data. Typography-driven hierarchy using Outfit (headings/labels) and DM Sans (body).
- **Client auth cookies**: Client sessions use `telos_client_session` cookie (separate from admin's `telos_dash_session`). Token format: `{clientId}.{expiry}.{signature}` (3 parts vs admin's 2 parts). Cookie uses `SameSite=None; Partitioned` to support Whop iframe embedding. Admin cookie stays `SameSite=Strict` (never embedded).
- **Client Login nav link**: All 28 public pages (5 root + 23 blog) have a "Client Login" link before "Book a Call" in both desktop and mobile navs. Blog pages use `../client-dashboard` href.
- **CSS version**: Currently `?v=15` on all pages. Bump when changing style.css.
- **Training features**: Rest timer (circular countdown, parses "90s"/"2min"/"1:30"), progress bar, previous workout comparison (fetches last 14 logs), workout completion celebration with confetti + auto-save.
- **FAB button (Home tab)**: Floating action button visible only on Home tab. CSS default is `display:none`; JS must set `display:'block'` (not empty string `''`) to show it. The FAB opens a popup with 3 modals: Daily Check-in, Food Search, Add Activity. All modals use class `.modal-panel` with `.open` to show (z-index 500). FAB is z-index 210, backdrop z-index 205.
- **Food search**: Open Food Facts API proxy at /api/client/food-search.js. No API key needed. Recent foods stored in localStorage (`telos_recent_foods`, max 20). Food search UI is now in a full-screen modal (not inline in a tab).
- **Supplements system**: Coach sets supplement plans per client via admin portal "Supplements" sub-tab. Client sees checkboxes on Nutrition tab that auto-save on toggle. Stored in `client_supplement_plan:{clientId}` (coach plan) and `client_supplement_log:{clientId}:{date}` (daily completion). Checkbox state resets daily.
- **Activity logging**: Clients log activities (walk, run, cycling, etc.) via FAB "Add Activity" modal. Stored as array per day in `client_activity_log:{clientId}:{date}`. Activities appear in Home tab activity feed.
- **Side menu modular system**: Coach manages per-client via admin. Built-in items: growth/community/calls/resources. Custom items: type "link" (opens URL) or "panel" (shows HTML content). Stored in `client_sidemenu:{clientId}`. Falls back to all 4 built-ins if no config set.
- **Service worker**: `sw.js` at root handles push notifications and static asset caching. Cache name: `telos-v1`. Bump cache name when updating cached assets.
- **App icons are PNG**: All icon references use PNG format (not SVG). When adding new icon references, always use the PNG files in `/images/`.

## App Icons
- **Format**: PNG (metallic gold on black, score ring motif)
- **Files**:
  - `images/telos-icon-192.png` - PWA manifest (192x192)
  - `images/telos-icon-512.png` - PWA manifest (512x512)
  - `images/telos-icon-1024.png` - Full resolution / App Store (1024x1024)
  - `images/apple-touch-icon.png` - iOS homescreen (180x180)
- **References**: manifest.json (192/512/1024), client-dashboard.html (apple-touch-icon), sw.js (cache + notification icon)
- **Old SVG icons** (`telos-icon-192.svg`, `telos-icon-512.svg`) are deprecated - no longer referenced anywhere. Safe to delete.

## Design System
- **Colors**: bg #060608, card #131316, card-elevated #1a1a1f, text #F4F1EC, text-muted #b8b8bf, text-dim #8a8a94, text-faint #505058, gold #C9A84C, gold-hover #d4b55a, green #34d399, red #ef5350, blue #42a5f5 (protein macro only), orange #fbbf24
- **Client dashboard color rules**: Gold is brand-only (logo, active tab, buttons, pills) - never on data/charts. All progress/scores use red-to-green spectrum: great #34d399, good #a3e635, mid #fbbf24, low #ef5350. Training uses green (not cyan). Macro bars: amber (cal), blue (protein), green (carbs), red (fat). Eliminated: cyan #22d3ee, purple #ab47bc.
- **Metallic gold palette** (used in app icon and premium UI elements): light #D7C391, mid #B9A05F, shadow #8C733C, dark #64502A
- **Fonts**: Bebas Neue (display numbers), Outfit (headings + labels), DM Sans (body text), Space Mono (monospace data in admin)
- **Dark theme**: Minimal, professional, no decorative effects. Solid colors, flat shadows, sharp corners.
- **Card radius**: 12px
- **Card shadow**: `0 1px 4px rgba(0,0,0,0.3)` - single subtle shadow, no layered effects
- **Borders**: `rgba(255,255,255,0.07)` - subtle but visible
- **Design references**: WHOOP (data-forward daily metrics, score rings), Strava (activity feed, competitive energy), Whop (structured course content)

## External Services
- Calendly (per tier):
  - Rebuild: `https://calendly.com/tkern-y-m5/1on1consultation`
  - Growth: `https://calendly.com/tkern-y-m5/1-1-consultation-call-clone`
  - Lifestyle: `https://calendly.com/tkern-y-m5/1-1-growth-consultation-call-clone`
  - Lifestyle+: `https://calendly.com/tkern-y-m5/1-1-lifestyle-consultation-call-clone`
- Whop: `https://whop.com/telosfitness` (community), `https://whop.com/checkout/plan_4XhPpAYVD2xQl` (Rebuild tier)
- Open Food Facts: `https://world.openfoodfacts.org/cgi/search.pl` (food database, free, no key)
- Instagram: @tomgetshybrid, @telos_fitness
- Email: telosfitnessllc@gmail.com

## Cron Jobs (vercel.json)
- `api/cron/weekly-summary` - Monday 2pm UTC (9am ET): sends weekly summary email to each active client with portal enabled
- `api/cron/engagement-check` - Daily 3pm UTC: sends reminder email to clients inactive 3+ days
- Both require `CRON_SECRET` env var (fail closed if not set)
- Both require `RESEND_API_KEY` for email delivery (gracefully skip if not set)

## Known Limitations
- **Whop iframe on Safari/iOS**: Client portal login does not work when embedded in Whop on Safari or the Whop iOS app. Safari blocks all third-party cookies regardless of SameSite settings. Clients on iOS should use the direct URL (telosathleticclub.com/client-dashboard) or the PWA homescreen shortcut. A future fix would be switching to token-based auth via localStorage + Authorization header for iframe contexts.
- **Bug crawl P1-P3 backlog**: A comprehensive bug crawl was run (April 2026). P0s are fixed. Remaining P1-P3 items are documented in the git history (commit 7fa38ff plan file). Key items: tool pages missing main.js, .html extensions in internal links, todayStr() UTC timezone bug in client dashboard streaks, SW cache version bump needed.

## Deployment
```bash
vercel deploy --prod
```
