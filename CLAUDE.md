# Telos Fitness Website

## Tech Stack
- Pure HTML/CSS/JavaScript (no framework, no build step)
- Hosted on Vercel (static site)
- Production URL: https://www.telosathleticclub.com
- Local dev: `npx serve -l 3000 .` (do NOT use `-s` flag - SPA mode breaks multi-page routing)

## Project Structure
```
/
├── index.html              # Homepage (hero, how it works, about, pricing features, quiz, testimonials, FAQ)
├── pricing.html            # Quiz-gated pricing page (actual prices shown after quiz completion)
├── protein-calculator.html # Standalone tool page
├── hyrox-predictor.html    # Standalone tool page
├── resources.html          # Blog hub with category filters
├── blog/                   # 23 SEO-optimized articles (training, nutrition, recovery, mindset)
├── css/style.css           # Shared stylesheet (dark theme, gold accent #C9A84C)
├── js/main.js              # Shared interactivity (nav, scroll animations, tilt, cursor, counters)
├── js/quiz.js              # Execution Score Quiz logic (index.html + pricing.html)
├── images/                 # ig-profile.png, thomas.jpeg
├── vercel.json             # cleanUrls: true
└── .vercel/                # Vercel project config
```

## Important Conventions
- **Clean URLs**: All internal links use clean URLs without `.html` extension (e.g., `protein-calculator` not `protein-calculator.html`). Vercel's `cleanUrls: true` handles this.
- **No em dashes**: Use hyphens `-` everywhere, never `—` or `–`
- **CSS cache busting**: Stylesheet references use `?v=N` query param. Bump the version on all pages when changing style.css.
- **main.js on all pages**: Every page loads `js/main.js` for nav, hamburger, scroll animations. Tool pages have their own inline `<script>` for page-specific logic but must NOT duplicate hamburger/nav handlers (main.js handles it).
- **body.page-load-anim**: Only index.html has this class. The fade-in animation is opt-in, not global - prevents blank pages on other routes.
- **Blog articles**: Live in `/blog/` directory. Each is a standalone HTML file with inline `<style>`, Schema.org JSON-LD, and full SEO meta tags. Nav links use `../` prefix.
- **CSS .visible class**: Only scoped to `.animate-on-scroll.visible` in shared CSS. Tool pages use bare `.visible` for their results sections - never add global `.visible` rules.
- **Pricing page gating**: `pricing.html` shows an Execution Score Quiz overlay before revealing prices. Quiz completion stores `telosQuizCompleted` in localStorage. The quiz runs on both index.html (inline) and pricing.html (overlay) via the same `quiz.js` with context detection.
- **Pricing page CSS**: All pricing-page styles are inline `<style>` (prefixed `p-` classes like `.p-card`, `.p-featured`). Do NOT add pricing styles to shared `style.css`.
- **Homepage vs pricing page**: Homepage `#pricing` section shows tier features without dollar amounts. `pricing.html` shows actual prices ($1,497 / $1,997 / $2,497 / $6,997) with a 3-month/6-month toggle.

## Design System
- **Colors**: bg #080808, card #111111, text #F2EFE9, gold #C9A84C
- **Fonts**: Bebas Neue (display), Outfit (headings), DM Sans (body), Space Mono (mono/labels)
- **Dark theme**: Everything is dark mode, gold accent

## External Services
- Calendly (per tier):
  - Rebuild: `https://calendly.com/tkern-y-m5/1on1consultation`
  - Growth: `https://calendly.com/tkern-y-m5/1-1-consultation-call-clone`
  - Lifestyle: `https://calendly.com/tkern-y-m5/1-1-growth-consultation-call-clone`
  - Lifestyle+: `https://calendly.com/tkern-y-m5/1-1-lifestyle-consultation-call-clone`
- Whop: `https://whop.com/telosfitness` (community), `https://whop.com/checkout/plan_4XhPpAYVD2xQl` (Rebuild tier)
- Instagram: @tomgetshybrid, @telos_fitness
- Email: telosfitnessllc@gmail.com

## Deployment
```bash
vercel deploy --prod
```
