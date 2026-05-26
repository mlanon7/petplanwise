# CLAUDE.md — PetPlanWise

This file is the working context for any AI assistant editing the repo. Read it before touching anything.

---

## What this is

**PetPlanWise** is a calculator-first content site for U.S. dog and cat ownership-cost estimation. Interactive calculators return **low / typical / high** cost ranges across monthly, annual, first-year, and lifetime horizons, prefilled by species × size × age × lifestyle × location × breed. A library of vet-procedure and condition-cost guides answers the specific "how much does X cost" queries owners actually search.

- **Live:** https://petplanwise.com
- **Repo:** https://github.com/mlanon7/petplanwise
- **Owner:** Martin Lashgari (also runs ElectrifyCost and a family of cost-calculator sites)
- **Launched:** May 2026 (days-old domain — cold-start SEO posture)

### The deliberate market position

- **No funnel.** No email gate, no contact form, no vet/insurance lead marketplace. Trust + SEO first; monetization layered in later.
- **Source-cited.** Cost ranges trace to primary sources (NAPHIA, BLS CPI veterinary series, AAHA/AAFP, AVDC, AVMA, Banfield, CareCredit). Listed at `/sources/`; cost CSVs carry per-row `source_url` + `last_reviewed`.
- **Planning ranges, not quotes.** Estimates are calibrated to public benchmarks. Every surface disclaims "verify with your vet / current provider terms."

### Why the differentiation matters

Competitors fall into three buckets: (1) insurance-affiliate funnels (Pawlicy, Pet Insurance Review) that gate everything behind a quote form; (2) editorial cost pages (Forbes Advisor, GoodRx Pets, PetMD) with no interactive calculator; (3) procedure-cost calculators (vetcostcalc.com, vety.com) that match our model most directly. PetPlanWise's edge is **interactive lifetime calculators + transparent sourcing + breed/condition specificity + no funnel**.

---

## Tech stack

- **Pure static HTML/CSS/vanilla JS — NO build step, NO framework, NO bundler.** Every page is hand-authored HTML or emitted by a one-shot Node script in `scripts/`. Vercel serves the files verbatim.
- **CSV-first data** — every numeric input lives in `assets/data/csv/*.csv` (19 files). Loaded at runtime by `csv-loader-<VERSION>.js` into `window.PETCOST_DATA`. NO duplicate numbers in JS.
- **Cache-bust by dated filename** — CSS/JS assets are renamed on each deploy (`layout-YYYYMMDD<letter>.js`) and referenced via `?v=<VERSION>`. This is the single most important convention in the repo (see "The cache-bust pattern" below). There is no content-hashing because there is no build.
- **Vercel** — static deploy from `main`, ~30s. Clean URLs, redirects, immutable `/assets/*` cache (1 year). Config in `vercel.json`. Apex `petplanwise.com` serves; `www` 308-redirects to it.
- **sharp** (`devDependencies`) — image optimization for breed hero photos (`optimize-breed-heroes.js`, mozjpeg q82 / webp q78).
- **Google Sheets sync** — `scripts/sync-from-sheets.js` / `push-to-sheets.js` round-trip the CSVs to a Sheet for non-engineer editing (see `docs/google-sheets-setup.md`).
- **Analytics:** GA4 (`G-SDLMQMD34D`) with a consent banner — loads only after Accept. PLUS **Ahrefs Web Analytics** (cookieless, GDPR-safe, key in `layout-<V>.js`) which loads for all visitors un-gated. Both injected from `layout-<V>.js`.
- **Ahrefs MCP** — connected, but the authenticated plan returns `Insufficient plan` for API calls. Use the Ahrefs **web dashboard** for rank tracking / site audit / keyword data; the MCP tools won't return data on the current plan. Keyword research in-session is done via the free Google Autocomplete harvest (see `.claude/commands/keyword-research.md`).

---

## Page inventory (328 built pages as of 2026-05-21)

The site grew from a handful of calculators to 328 HTML pages via **programmatic-SEO dimensions**. Understand these before adding pages:

| Dimension | URL shape | Count | Source |
|---|---|---|---|
| **Breed pages** | `/breeds/<slug>-cost/` | 71 | generators in `scripts/` + `breeds.csv` |
| **Breed × State** | `/breeds/<slug>-cost-in-<state>/` | 150 | programmatic generator |
| **Guides** | `/guides/<topic>/` | 60 | one-shot generators (e.g. `add-condition-guides.js`) |
| **State hubs** | `/states/<state>-pet-cost/` | 25 | programmatic |
| **Calculators** | `/dog-cost-calculator/`, `/cat-cost-calculator/`, `/vet-bill-calculator/`, `/emergency-vet-cost-calculator/`, `/pet-insurance-vs-savings/` | 5 | hand-authored |
| **Interactive tools** | `/compare/`, `/find-my-breed/` | 2 | **self-contained** (inline style+script) |
| **Embed** | `/embed/cost-calculator/` | 1 | iframe-able widget (robots-disallowed) |
| **Standalone** | `/`, `/about/`, `/sources/`, `/methodology` via `/about/`, `/privacy/`, `/terms/`, `/editorial-standards/`, `/affiliate-disclosure/`, `/contact/` | ~10 | hand-authored |

**The 8 legacy cat breeds** (bengal, british-shorthair, maine-coon, persian, ragdoll, scottish-fold, siamese, sphynx) use the `<slug>-cat-cost/` directory pattern. Everything else uses `<slug>-cost/`. Helper map: `CAT_LEGACY_DASH_CAT` in `/compare/index.html` and `/find-my-breed/index.html`.

---

## How the engine works (`assets/js/calculator-<V>.js`)

Annual cost is a product of multipliers read from the CSVs:

```
annual = base × sizeMult × ageMult × lifestyleMult × locationMult × breedMult
```

where `base` comes from `base-costs.csv` per category (food, vet, grooming, preventives, etc.), and the multipliers come from `breeds.csv`, `state-multipliers.csv`, `city-multipliers.csv`, and the size/age/lifestyle tables.

### Lifetime is PHASE-WEIGHTED, not stage-multiplied

This is the biggest accuracy win in the engine and must not regress. Selecting `senior` does **not** project senior-level annual costs across the full lifespan. Instead the engine computes annual cost separately for the **puppy/kitten + adult + senior** phases and **sums** them:

```
lifetime ≈ puppyAnnual × puppyYears + adultAnnual × adultYears + seniorAnnual × seniorYears + oneTimeCosts
```

The regression guard lives in `tests/calculator.test.js` (a senior selection must not inflate lifetime to the old `annual × fullLifespan` value). See `.claude/lessons/04-phase-weighted-lifetime.md`.

Returns monthly / annual / first-year / lifetime / emergency-fund views. Insurance toggle adds NAPHIA-aligned premiums from `insurance-monthly-premium.csv`.

---

## Critical data sources & review cadence

Cost claims are YMYL-adjacent. These sources drift and must be re-checked — a stale number is a trust bug, not a cosmetic one.

| Source | Drives | Drift risk |
|---|---|---|
| **NAPHIA State of the Industry** | insurance premiums (`insurance-monthly-premium.csv`) | annual (new SOI each year) |
| **BLS CPI — veterinary services** | cost-inflation signal | monthly release; trend not level |
| **CareCredit FAQ** | financing APR on `/guides/pet-insurance-vs-carecredit/` | **changes without notice — burned us once (26.99% → 32.99%)** |
| **AAHA / AAFP guidelines** | vaccine schedules, life-stage bloodwork cadence | every few years |
| **AVDC / AVMA / Banfield** | procedure cost ranges (`procedures.csv`) | periodic |

Every cost-bearing CSV row carries `source_url` + `last_reviewed`. When you change a number, bump `last_reviewed`. Any page that asserts a specific dollar/percent finance figure must show a "checked YYYY-MM" date. See `.claude/lessons/10-finance-figures-go-stale.md` and `.claude/commands/refresh-sources.md`.

---

## Commands

```bash
# Local dev server (static, port 4173)
npm run dev          # = node local-server.js
# Alternative zero-config static server (port 4180), cache disabled so edits show on refresh
npx --yes http-server -p 4180 -c-1 --silent

# Calculator test suite — 23 assertions; run before shipping any calculator/CSV change
npm test             # = node tests/calculator.test.js

# Cache-bust after ANY CSS/JS change (see the pattern section below)
node scripts/bump-cache-bust.js

# CSV <-> Google Sheets round-trip (non-engineer data editing)
npm run sync         # pull edits from the Sheet into CSVs
npm run push         # push CSVs up to the Sheet

# Breed hero photos
npm run audit-photos                       # find far/blurry/missing heroes
node scripts/optimize-breed-heroes.js      # re-encode from hero-original.jpg
```

There is **no build** and **no CI gate** — `git push origin HEAD:main` deploys directly via Vercel. The test suite and cache-bust are manual discipline, not enforced. Treat them as mandatory anyway.

---

## Editing conventions

### Numbers go in CSVs, not in code

If you need to change a cost, a multiplier, a premium, a lifespan — **edit the CSV** in `assets/data/csv/`, not the JS. The runtime reads CSVs via `csv-loader-<V>.js`; the tests read them via `fs.readFileSync`. Both must see the same data. Exception: per-widget UI defaults (the `data-stage="adult"` attribute, etc.) are HTML, not data.

### Every cost CSV row carries `source_url` + `last_reviewed`

`breeds.csv`, `base-costs.csv`, `procedures.csv`, `state-multipliers.csv`, `city-multipliers.csv`, `insurance-monthly-premium.csv` all have these columns. Don't drop them. Bump `last_reviewed` when you change a value.

### The cache-bust pattern (read this twice)

Every CSS/JS asset is renamed on each deploy to a date-keyed filename and referenced via `?v=<VERSION>` (format `YYYYMMDD<letter>`, e.g. `20260516z`). Vercel caches `/assets/*` as `immutable, max-age=31536000` — **without a new URL, browsers and the CDN keep the old file for a year.** This has bitten us repeatedly.

To bump after any CSS/JS change:

1. Edit `scripts/bump-cache-bust.js` — update **`OLD_V`, `NEW_V`, the `RENAMES` array, AND the `replacements` array.** All four must agree.
2. Run `node scripts/bump-cache-bust.js`. It renames the three JS files (`layout`, `calculator`, `csv-loader`), rewrites every `?v=<OLD>` → `?v=<NEW>` across all HTML, and force-updates any `hero.{jpg,svg,png,webp}?v=*` via a regex sweep (so swapped photos invalidate CDN cache too).

See `.claude/lessons/01-cache-bust-four-places.md`.

### Hero photos — write BOTH `hero.jpg` AND `hero-original.jpg`

Each breed dir has `hero.jpg` (optimized ~200 KB), `hero.webp`, `hero-original.jpg` (full-quality source), and `credit.json`. **`optimize-breed-heroes.js` re-encodes `hero.jpg` FROM `hero-original.jpg`.** If you swap `hero.jpg` without also overwriting `hero-original.jpg`, the next optimize run silently reverts your swap. Always write both. Pattern: `scripts/swap-corgi-boston-heroes.js`. See `.claude/lessons/02-hero-original-revert-trap.md`.

### Calculator widgets mount via data-attributes

Pages embed a calculator with `<div data-calculator="dog" data-breed="slug" data-stage="adult">`. The engine in `calculator-<V>.js` scans for these on load and renders. New pages follow this pattern; don't hand-instantiate.

### `compare/` and `find-my-breed/` are self-contained

Both have inline `<style>` and inline `<script>` by deliberate convention. Don't externalize without reason. Note: they reference `hero.jpg?v=<VERSION>` with a cache-buster — the `bump-cache-bust.js` regex sweep keeps these in sync.

### Bulk changes go in a one-shot script

If you're touching more than ~2 pages the same way (new breeds, new guides, a sweep), write a one-shot Node script in `scripts/`, run it, and commit **both the script and the result**. Templates: `add-condition-guides.js` (14 guides from a data array), `add-twelve-breeds.js`, `add-price-keyword.js`. Don't hand-edit at scale.

### Don't add npm dependencies casually

The only runtime is the browser; the only dev dep is `sharp`. Adding deps means lockfile churn for a site that has no build. If you genuinely need one, justify it.

### Don't write CLAUDE.md, README.md, or other docs unless asked

The site is the product. Repo docs are working memory for contributors. Default to NOT creating new markdown unless requested.

---

## SEO + monetization posture

### SEO

- Sitemap **index** at `/sitemap.xml` → 6 child sitemaps (~294 URLs): core, calculators, breeds, states, guides, breed-state. Keep child `lastmod` and the index `lastmod` in sync when a section changes.
- Verified in Google Search Console as a **sc-domain** property.
- JSON-LD on content pages: `BreadcrumbList` + `FAQPage` + `Article` (guides), `BreadcrumbList` + `FAQPage` (breed pages), `ItemList` + `CollectionPage` (hubs).
- FAQ schema uses the **exact** "how much…" phrasings from GSC/autocomplete — that's how people search.
- Canonical host is the **apex** (`petplanwise.com`); `www` 308-redirects to it. Canonicals everywhere point to apex.
- Content strategy is **GSC-driven and specific**: the more specific the query, the better a young domain ranks. See `docs/CONTENT-PLAN.md`.

### Monetization (as of 2026-05)

- **Active:** GA4 + Ahrefs Web Analytics. Affiliate disclosure page exists.
- **Wired but not live:** insurance-affiliate CTAs currently point to the internal `/pet-insurance-vs-savings/` calculator, NOT a partner link. Swap in a real affiliate URL only once a program is approved.
- **Plan:** insurance affiliate first (highest intent on condition/vet-cost pages), retail affiliate later. **No display ads until ~10K monthly sessions.**

### What NOT to add without explicit user approval

- Lead-capture / quote forms, email gates, newsletter pop-ups
- Insurance lead-marketplace widgets
- Display ads before the traffic threshold
- More breeds / pages / guides without GSC data showing demand (the standing rule below)

These violate the brand position or the cold-start discipline. Treat any such request as a deliberate pivot, not a routine task.

---

## Audit history (in repo, at `/audit/`)

- `AUDIT.md` — initial deep audit
- `POST_REVISION_AUDIT_2026-05-08.md` — pass 2
- `ULTRA_DEEP_LIVE_LOCAL_AUDIT_2026-05-16.md` — GPT live+local pass (drove the May-16 hygiene sprint)
- `CODEX_FULL_SITE_AUDIT_2026-05-21.md` — Codex pass (NOTE: run against a stale local checkout; ~half its P0/P1 were already fixed live — verify findings against the worktree before acting)
- `CHANGES.md` — change log

When starting a task, read the most-recent audit for context. **Audit the live URL or the worktree, not a stale local checkout** — see `.claude/lessons/09-audit-the-live-state.md`.

---

## Recent commits worth knowing about

| SHA | Summary |
|---|---|
| `3a5b6b1` | Audit fixes: CareCredit APR 26.99%→32.99% + remove 40 deployable junk files |
| `69a095f2` | Add Ahrefs Web Analytics (cookieless) + cache bump y→z |
| `1cb1414` | Add 14 condition/procedure cost guides via `add-condition-guides.js` (content-plan Tiers 1–3) |
| `3df4099` | Add 3 new vet-cost guides (sedation dog/cat, vet-visit-without-insurance) |
| `bb77699` | SEO: add "price" keyword to all 71 breed pages (data-driven from GSC) |
| `a23d4fc` | Add data-driven vet-cost content plan (`docs/CONTENT-PLAN.md`) |
| `8c73183` | Big sprint: P0/P1 audit fixes, meta cleanup, source notes, +5 breeds |
| `75248bc` | Fix mobile nav unclickable bug: escape header `backdrop-filter` stacking context |
| `94cbb7c` | Wire click/keyboard handler to every dropdown, not just the first |
| `eeb6736` | Fix dropdown hover gap: invisible bridge so menu stays open |
| `f1fb9a5` | Strip NUL bytes + regenerate `breed-images.csv` |
| `6883bf6` | Add `/find-my-breed/` — 5-step breed-match quiz |
| `082b87f` | Add the first CLAUDE.md |

Content roadmap + GSC analysis: `docs/CONTENT-PLAN.md` (Tiers 1–3 shipped; Tier 4 deferred; geographic play gated on state-page differentiation).

---

## When a change doesn't show up

Almost always the cache-bust, not your edit. In order:

1. Did you change CSS/JS? Then you MUST run `node scripts/bump-cache-bust.js` — otherwise the CDN serves the old `/assets/*` for a year.
2. Verify the live HTML references the new version: `curl -sL https://petplanwise.com/ | grep -o 'layout-[a-z0-9]*\.js'` should show the current `<V>`.
3. Swapped a hero photo but it reverted? You only wrote `hero.jpg`, not `hero-original.jpg` (the optimize script reverted it).
4. Photo still stale on `/compare/` or `/find-my-breed/`? Those build `hero.jpg?v=` URLs in JS — confirm the cache-bust sweep updated them.
5. Still old after a correct bump? Give Vercel ~30s, then hard-refresh / check in incognito (browser cache, not the deploy).

See `.claude/lessons/01-cache-bust-four-places.md`.

---

## When indexing fails

GSC indexing is operational. If discovery is slow or a sitemap shows errors:

1. Verify `/sitemap.xml` is an index pointing to 6 children, and that the changed child's `lastmod` AND the index's `lastmod` for it are current (a stale index `lastmod` makes Google skip re-reading the child).
2. Re-submit `sitemap.xml` in GSC → Sitemaps. Watch the **Discovered URLs** count (~294), not the "6 sitemaps" number.
3. For new pages, use URL Inspection → Request Indexing (rate-limited ~10/day). Prioritize: highest-value new guides, then breed pages.
4. Confirm canonicals resolve to a **200** (apex), not a redirect — a canonical pointing at a redirecting URL is the #1 cause of "canonical points to redirect" audit errors. See `.claude/lessons/06-apex-www-canonical.md`.

---

## Disclaimers in code

The site's E-E-A-T position depends on these staying visible:
- Every calculator/guide: "planning estimates / cost ranges, not a vet quote — verify with your vet."
- Every guide: a reviewer block ("Fact-checked by PetPlanWise Editorial · no individual veterinarian endorsement") + a Sources list.
- Finance pages: a "checked YYYY-MM" date next to any APR/premium figure.
- `/affiliate-disclosure/`, `/editorial-standards/`, `/about/` carry the methodology + no-DVM-endorsement language.

If you edit one of these surfaces, keep the disclaimers. They're load-bearing.

---

Last reviewed: 2026-05-21.
