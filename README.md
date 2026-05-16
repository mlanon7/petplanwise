# PetPlanWise.com

A static, calculator-first SEO site for U.S. dog and cat owners. Pure HTML / CSS / vanilla JS — no build step, no framework. Deploys to Vercel, Netlify, Cloudflare Pages, or GitHub Pages with zero configuration.

## What's inside

- **5 calculators** — dog cost, cat cost, vet bill, emergency vet, insurance vs savings
- **43 SEO guides** — pillar cost guides (avg cost dog/cat, puppy/kitten first year), procedure cost guides (dental, spay/neuter, vaccines, x-rays, surgery), insurance comparison guides, hidden-costs, senior pet, decision-tree guides, breed-cluster guides
- **54 base breed pages + 150 breed-in-state variants** — dogs (Lab, GSD, Goldendoodle, Frenchie, Vizsla, Saint Bernard, Belgian Malinois, doodle line-up, etc.) and cats (Maine Coon, Persian, Siamese, Ragdoll, Bengal, Savannah, Russian Blue, etc.)
- **25 state pages** with state-prefilled calculators (CA, TX, FL, NY, OH, NJ, MA, MI, GA, IL, NC, PA, VA, WA, AZ, MD, CO, IN, MN, MO, NV, OK, OR, TN, WI)
- **Legal & about** — methodology, sources, affiliate disclosure, editorial standards, privacy (GDPR/CCPA-ready with cookie banner), terms, contact

Every calculator and guide page ships with FAQ schema, BreadcrumbList schema, SoftwareApplication or Article schema, OG tags, and a unique title + meta description.

## Quick start

```bash
# Recommended — zero-dependency Node http server (built-ins only)
node local-server.js
# or
npx serve .
# or
python3 -m http.server 8080
```

`node local-server.js` serves the project on `http://localhost:4173/` with
proper MIME types for `.html`, `.js`, `.css`, `.csv`, `.json`, `.svg`, etc.,
permissive CORS for local dev, and clean-URL fallback. No `npm install`
required — only Node's built-in `http`/`fs`/`path`. Override the port with
`PORT=8080 node local-server.js`.

## Deploying to Vercel

```bash
# Option A — CLI
npm i -g vercel
vercel
vercel --prod

# Option B — Git
# 1. Push this folder to a GitHub repo
# 2. In Vercel, "New Project" → import the repo
# 3. Framework preset: "Other"  (no build needed)
# 4. Output directory: leave empty (root)
# 5. Deploy
```

`vercel.json` already configures clean URLs, trailing slash, immutable asset caching, and basic security headers.

## Deploying to Git

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin git@github.com:YOUR-USERNAME/petplanwise.git
git push -u origin main
```

Once on GitHub, you can:
- **Vercel**: import the repo (recommended)
- **Cloudflare Pages**: connect repo, no build
- **GitHub Pages**: enable Pages → branch: main → folder: `/`
- **Netlify**: drag the folder onto netlify.com or connect the repo

## Editing the cost data

All cost data lives as **CSV files** under `/assets/data/csv/`. CSVs are the
sole source of truth — no numbers are duplicated in JavaScript modules.

```
assets/data/csv/
  base-costs.csv             — annual cost ranges by category
  first-year-one-time.csv    — first-year one-time costs
  life-expectancy.csv        — years of life used in lifetime calc
  emergency-fund.csv         — suggested emergency-fund targets
  size-multipliers.csv       — dog-size factors
  age-multipliers.csv        — puppy/kitten/adult/senior factors
  lifestyle-multipliers.csv  — basic/standard/premium factors
  state-multipliers.csv      — per-state cost-of-living factor
  state-adjusted-categories.csv — categories that scale with state
  city-multipliers.csv       — metro-level overrides
  breeds.csv                 — breed profile rows
  procedures.csv             — vet procedure cost ranges
  emergency-keys.csv         — subset shown in emergency calc
  insurance-ranges.csv       — NAPHIA premium ranges
  insurance-monthly-premium.csv — per-stage premium ranges
  insurance-defaults.csv     — default deductible / reimbursement / limit
  breed-images.csv           — image attribution and source URLs
```

Edit any CSV in Excel / Numbers / Google Sheets, save as CSV, refresh the
page. No build required. The runtime fetches each CSV via `assets/data/csv-loader.js`
and reshapes rows into `window.PETCOST_DATA.*` for the calculator engine.

See [`assets/data/csv/README.md`](assets/data/csv/README.md) for the column
reference.

### Add a new state multiplier

Append a row to `assets/data/csv/state-multipliers.csv`:

```csv
state,multiplier
PR,0.95
```

### Add a new breed

Append a row to `assets/data/csv/breeds.csv` matching the existing column
order, then create `/breeds/<slug>-cost/index.html` using
`breeds/labrador-retriever-cost/index.html` as a template — change title,
meta, content, and the `data-breed="<slug>"` attribute on the `<div
data-calculator="dog">`.

### Add a new vet procedure

Append a row to `assets/data/csv/procedures.csv`:

```csv
key,name,low,typical,high,species,emergency_note
acupuncture,Acupuncture session,60,100,180,any,
```

It will automatically appear in the Vet Bill Calculator.

## Mounting calculators on a new page

Drop a div with a `data-calculator="..."` attribute and include the data files + scripts:

```html
<!-- The calculator -->
<div data-calculator="dog" data-size="large" data-stage="adult" data-state="CA"></div>

<!-- Required scripts (in this order) -->
<script src="/assets/data/csv-loader.js" defer></script>
<script src="/assets/js/layout.js" defer></script>
<script src="/assets/js/calculator.js" defer></script>
```

Available calculator types:
- `general` — homepage primary calculator (handles both dog and cat)
- `dog` — dog-specific
- `cat` — cat-specific
- `vet-bill` — line-item vet bill builder
- `emergency` — emergency vet scenarios
- `insurance` — insurance vs savings

Prefill via data attributes: `data-species`, `data-size`, `data-stage`, `data-state`, `data-lifestyle`, `data-indoor`.

## Wiring up real affiliate links

Each affiliate CTA on the site is a placeholder block:

```html
<div class="affiliate">
  <div>
    <span class="affiliate-tag">Affiliate placeholder</span>
    <h3>Compare pet insurance options</h3>
    <p>...</p>
  </div>
  <a class="btn" href="/pet-insurance-vs-savings/">Run the math</a>
</div>
```

To swap in a real affiliate URL: change the `<a class="btn" href="...">` and remove the `affiliate-tag` placeholder label. Add `rel="sponsored nofollow"` per FTC + Google guidance:

```html
<a class="btn" href="https://your-affiliate-url" rel="sponsored nofollow" target="_blank">Get a quote</a>
```

## File structure

```
.
├── index.html
├── vercel.json
├── package.json
├── robots.txt
├── sitemap.xml
├── README.md
├── assets/
│   ├── css/site.css
│   ├── js/
│   │   ├── layout.js
│   │   └── calculator.js
│   └── data/
│       ├── csv-loader.js          (loads + reshapes the CSVs at runtime)
│       └── csv/                    (CSV source of truth, edit in a spreadsheet)
│           ├── base-costs.csv
│           ├── first-year-one-time.csv
│           ├── life-expectancy.csv
│           ├── emergency-fund.csv
│           ├── size-multipliers.csv
│           ├── age-multipliers.csv
│           ├── lifestyle-multipliers.csv
│           ├── state-multipliers.csv
│           ├── state-adjusted-categories.csv
│           ├── city-multipliers.csv
│           ├── breeds.csv
│           ├── procedures.csv
│           ├── emergency-keys.csv
│           ├── insurance-ranges.csv
│           ├── insurance-monthly-premium.csv
│           ├── insurance-defaults.csv
│           ├── breed-images.csv
│           └── README.md
├── dog-cost-calculator/index.html
├── cat-cost-calculator/index.html
├── vet-bill-calculator/index.html
├── emergency-vet-cost-calculator/index.html
├── pet-insurance-vs-savings/index.html
├── about/index.html
├── sources/index.html
├── affiliate-disclosure/index.html
├── privacy/index.html
├── terms/index.html
├── guides/
│   ├── average-cost-of-owning-a-dog/index.html
│   ├── average-cost-of-owning-a-cat/index.html
│   ├── puppy-first-year-cost/index.html
│   ├── kitten-first-year-cost/index.html
│   ├── emergency-vet-visit-cost/index.html
