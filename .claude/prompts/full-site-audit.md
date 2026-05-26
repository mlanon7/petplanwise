# Prompt: Full site audit

Drop this into any AI assistant (Claude, ChatGPT, Manus, Gemini) for a comprehensive 3rd-party audit. Self-contained. For routine in-session checks, use the `/audit-site` command instead.

**Critical:** audit the **live URL** (`https://petplanwise.com`) or have the model `git pull` the main checkout first. Do NOT audit a stale local folder — see `.claude/lessons/09-audit-the-live-state.md`.

---

## The audit brief

```
You are auditing a newly-launched pet-cost website. This is a real production
site for the founder, who needs an honest, source-cited, decision-grade report
— not marketing copy. Use the live web for every claim and cite working URLs.
Sanity-check your inventory counts against the live site before reporting; if
your numbers look old, you're on a stale snapshot — stop and re-fetch.

## 1. Site context
- URL: https://petplanwise.com  (canonical host is the apex; www 308s to it)
- Domain age: launched May 2026 (cold-start)
- Built with: pure static HTML/CSS/vanilla JS, NO build, deployed on Vercel
- Topic: U.S. dog & cat ownership-cost calculators + vet/condition cost guides
- Positioning: source-backed planning ranges, no email gate, no lead funnel.
  Differentiation: interactive lifetime calculators + transparent sourcing +
  breed/condition specificity.
- Primary sources that matter for accuracy: NAPHIA (premiums), BLS CPI vet
  services (inflation), AAHA/AAFP (schedules), AVDC/AVMA/Banfield (procedures),
  CareCredit FAQ (financing APR — verify it's current; it drifts).
- Monetization: GA4 + Ahrefs Web Analytics live; insurance affiliate planned
  (CTAs currently point to the internal calculator, not a partner). No display
  ads yet (threshold ~10K sessions).
- Sitemap: https://petplanwise.com/sitemap.xml (index → 6 children) — crawl it.

## 2. Work streams (in order)

### Stream 1 — Calculator accuracy (highest priority)
For the 5 calculators (dog cost, cat cost, vet bill, emergency vet, insurance
vs savings): run low / typical / high scenarios; record inputs and the
monthly/annual/first-year/lifetime/emergency-fund outputs. Verify the LIFETIME
figure is phase-weighted (puppy+adult+senior summed), NOT current-stage ×
full lifespan. Cross-check ranges vs published data (AVMA, Synchrony/CareCredit
lifetime-cost studies, Rover, NAPHIA). Severity: P0 ships wrong number, P1
misleading, P2 within ~10%, P3 stylistic.

### Stream 2 — Content quality
Crawl 6-8 representative pages. Flag AI-slop tells ("in today's landscape",
"comprehensive", "let's dive in", "robust", "leverage"). Every guide needs a
reviewer block + Sources; every cost claim should trace to a source. Confirm
the FAQ schema phrasings match real search queries.

### Stream 3 — SEO posture
Sitemap index well-formed + child lastmods current; robots.txt allows
GPTBot/ClaudeBot; per-page title (≤65 RENDERED chars — note &amp; inflates),
meta description (≤160), canonical = apex (200, not a redirect); JSON-LD
present (BreadcrumbList + FAQPage + Article on guides; ItemList on hubs);
internal linking (guides → related guides + calculator; breed-state → siblings).
Core Web Vitals: flag LCP>2.5s (heavy hero images are the usual culprit).

### Stream 4 — Accessibility
Contrast, one H1/page + heading order, keyboard nav + focus rings, aria-live on
calculator results, alt text on hero images, prefers-reduced-motion.

### Stream 5 — Bug sweep
Console errors on 10 pages; calculator updates without flicker; breed-state
pages prefill the right state; mobile nav opens AND is tappable (regression
guard — see the backdrop-filter stacking-context bug); sitemap count matches.

### Stream 6 — Data + trust
CSV cost rows carry source_url + last_reviewed; finance figures (CareCredit
APR) show a "checked" date and match the current source; no NUL-corrupted CSVs;
no tracked junk files (hero-old.jpg, *.tmp, *.clean).

### Stream 7 — Live vs local diff
If given both: pages live but not in repo (stale deploy), in repo but not live
(cache stale — check the cache-bust version), or different versions (CDN lag).

### Stream 8 — Strategic
Top-3 wins for the next 30 days; top-3 for 90; pivot risks if traffic doesn't
ramp; competitive moat vs vetcostcalc.com, vety.com, GoodRx Pets, PetMD,
Forbes Advisor. Is it defensible?

## 3. Report format
Per stream: 2-3 sentence summary + a table (Finding | Severity | URL | Fix),
every claim cited. Overall: executive summary (top-3 P0 / P1 / strategic),
a prioritized P0→P3 punch list, and a 6/12/18-month traffic+revenue trajectory.

## 4. Skip
Don't audit /audit/ historical files. Don't audit scripts/ unless a bug is
visible live. Don't propose UI redesigns — the design system is established.

Begin.
```

---

## How to use

- **ChatGPT / Claude.ai / Gemini / Manus:** paste verbatim; output → `audit/AUDIT_YYYY-MM-DD.md`.
- **Inside Claude Code:** prefer the `/audit-site` command (faster, in-repo).
- **Adapting to a sibling niche** (firstyearcost, parentcarecost): swap the source canon (NAPHIA/AAHA → the new niche's primary sources), the calculator list, and the competitor set. The 8-stream structure, severity scale, and "verify-it's-not-stale" guard are niche-neutral.
