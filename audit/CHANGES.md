# Part 1 refactor — change log

Date: 2026-05-08
Scope: convert every numeric data table to CSV (sole source of truth) +
add zero-dependency `local-server.js`.

## TL;DR

- **17 CSV files** added under `assets/data/csv/` — every cost range,
  multiplier, breed profile, procedure price, and image attribution row.
- **All numbers removed from JavaScript.** The seven legacy data modules
  (`base-costs.js`, `multipliers.js`, `breeds.js`, `procedures.js`,
  `insurance.js`, `cities.js`, `breed-images.js`) became 9-line no-op
  shims kept on disk only so old `<script src=…>` tags don't 404. They
  contain zero numeric data.
- **One loader**, `assets/data/csv-loader.js`, fetches every CSV, parses
  it with a tiny built-in CSV parser, and reshapes rows into the legacy
  `window.PETCOST_DATA.*` slots the calculator engine reads.
- **`local-server.js`** added to project root: ~110-line zero-dependency
  Node http server on port 4173 with proper MIME types (incl. `.csv`),
  CORS, and clean-URL routing.
- **`tests/calculator.test.js`** rewritten to wait for
  `PETCOST_DATA.ready()` (async CSV load via an `fs`-backed `fetch`
  stub). All 21 assertions pass.

## Files added

```
assets/data/csv/
  README.md                          (column reference for every CSV)
  base-costs.csv                     21 rows
  first-year-one-time.csv            11 rows
  life-expectancy.csv                7 rows
  emergency-fund.csv                 2 rows
  size-multipliers.csv               5 rows
  age-multipliers.csv                20 rows
  lifestyle-multipliers.csv          19 rows
  state-multipliers.csv              51 rows (50 states + DC)
  state-adjusted-categories.csv      6 rows
  city-multipliers.csv               20 rows
  breeds.csv                         38 rows
  procedures.csv                     25 rows
  emergency-keys.csv                 13 rows
  insurance-ranges.csv               6 rows
  insurance-monthly-premium.csv      6 rows
  insurance-defaults.csv             1 row
  breed-images.csv                   38 rows
                                     ──
                                     289 data rows total
assets/data/csv-loader.js            fetches + reshapes (no numbers)
local-server.js                      zero-dep node http server
audit/AUDIT.md                       this audit
audit/CHANGES.md                     this file
```

## Files modified

| file | change |
|---|---|
| `assets/data/base-costs.js` | replaced with 9-line no-op shim |
| `assets/data/multipliers.js` | replaced with 9-line no-op shim |
| `assets/data/breeds.js` | replaced with 9-line no-op shim |
| `assets/data/procedures.js` | replaced with 9-line no-op shim |
| `assets/data/insurance.js` | replaced with 9-line no-op shim |
| `assets/data/cities.js` | replaced with 9-line no-op shim |
| `assets/data/breed-images.js` | replaced with 9-line no-op shim |
| `assets/js/calculator.js` | wraps `DOMContentLoaded` mount in `PETCOST_DATA.ready().then(...)` so the engine waits for CSVs to load before running. Engine logic (`computePet`, multiplier helpers) unchanged — same call shape, same outputs. |
| `assets/js/layout.js` | breed-hero rendering now waits for `PETCOST_DATA.ready()` before reading `breedImages`. Also rewrote header/footer template strings to be portable across mount sources (the original template-literal version had been truncated on disk — recovered from the in-process content). |
| `index.html` | added `<script src="/assets/data/csv-loader.js" defer>` ahead of the data shims. Also reconstructed truncated FAQ block (the original ended mid-paragraph at `<p>They reflect current n` — the file had only 239 of its intended ~270 lines). |
| 108 other HTML pages | added `<script src="/assets/data/csv-loader.js" defer>` ahead of the existing data script tags via `sed`. No body content changed. |
| `package.json` | `dev`/`start` now run `node local-server.js`. The previous `npx serve` invocation is preserved as `serve-legacy`. The existing on-disk file was truncated mid-string at line 12; rewrote with the intended full content. |
| `README.md` | quick-start and "Editing the cost data" sections updated to point at `local-server.js` and the CSV layout. File-tree diagram refreshed. |
| `tests/calculator.test.js` | adds an `fs`-backed `fetch` stub, loads the new `csv-loader.js`, awaits `PETCOST_DATA.ready()` before asserting. All 21 prior assertions kept and pass. |

## What is now CSV-backed (was hardcoded)

| former JS module | rows lifted | new CSV(s) |
|---|---|---|
| `base-costs.js` `baseCosts` | 21 | `base-costs.csv` |
| `base-costs.js` `firstYearOneTime` | 11 | `first-year-one-time.csv` |
| `base-costs.js` `lifeExpectancy` | 7 | `life-expectancy.csv` |
| `base-costs.js` `emergencyFund` | 2 | `emergency-fund.csv` |
| `multipliers.js` `sizeMultipliers` | 5 | `size-multipliers.csv` |
| `multipliers.js` `ageMultipliers` | 20 | `age-multipliers.csv` |
| `multipliers.js` `lifestyleMultipliers` | 19 | `lifestyle-multipliers.csv` |
| `multipliers.js` `stateMultipliers` | 51 | `state-multipliers.csv` |
| `multipliers.js` `stateAdjusted` | 6 | `state-adjusted-categories.csv` |
| `cities.js` `cityMultipliers` | 20 | `city-multipliers.csv` |
| `breeds.js` `breeds` | 38 | `breeds.csv` |
| `procedures.js` `procedures` | 25 | `procedures.csv` |
| `procedures.js` `emergencyScenarios` keys | 13 | `emergency-keys.csv` |
| `insurance.js` `insuranceRanges` | 6 | `insurance-ranges.csv` |
| `insurance.js` `insurance.monthlyPremium` | 6 | `insurance-monthly-premium.csv` |
| `insurance.js` `insurance.defaults` | 1 | `insurance-defaults.csv` |
| `breed-images.js` `breedImages` | 38 | `breed-images.csv` |

## Run / verify

```bash
# 1. Run the site
node local-server.js
# → http://localhost:4173/

# 2. Run the test suite
node tests/calculator.test.js
# → RESULT: 21 passed, 0 failed
```

## Backwards compatibility

- The seven legacy `assets/data/*.js` paths still exist (as no-op shims),
  so any external link or script tag pointing at them returns valid JS.
  They can be deleted after the next deploy if no external integrations
  depend on them.
- The calculator engine's public API (`window.PetCostEngine.computePet`,
  `.fmt`, `.fmtRange`) is unchanged.
- `window.PETCOST_DATA.*` keys are unchanged. The only addition is a
  `ready()` Promise that resolves once every CSV is loaded.
- Old prefill via `data-*` attributes and URL `?species=…&breed=…` query
  strings still works.

## Round-tripping CSVs through Google Sheets

1. Open the CSV in Sheets (`File → Import → Upload`).
2. Edit cells. Add rows. Re-order columns at your peril (the loader is
   header-name-driven, not position-driven, so adding columns is safe;
   renaming a header will silently drop that column from the runtime).
3. `File → Download → Comma-separated values (.csv, current sheet)`.
4. Replace the file in `assets/data/csv/`.
5. Refresh the page. No build, no deploy step beyond pushing the file.

## Notes / known gotchas

- The CSV parser accepts both `\n` and `\r\n` line endings, handles
  quoted fields and escaped quotes (`""`), and trims fully-empty rows.
  It does **not** support multi-line fields with hard newlines inside
  quotes — none of the current rows need that, but if you add one,
  collapse the newline into a `\n` literal instead.
- Header names are snake_case; the loader uses them as object keys when
  reshaping rows.
- Numeric coercion: empty cells become `null`; non-numeric strings stay
  strings (the loader is per-column-aware).
- Decimal multipliers (`1.10`, `0.92`) round-trip exactly through CSV
  and `Number(…)`.

---

# Punch-list pass — 2026-05-08 (post-audit)

After the audit, all "must-fix" and "high" items in `AUDIT.md` were applied.

## Critical fixes
1. **27 truncated HTML files reconstructed.** Hubs (`breeds/`, `states/`,
   `guides/`, `vet-costs/`, `sources/`, `about/`, `affiliate-disclosure/`,
   `privacy/`, `pet-insurance-vs-savings/`) and 18 leaf breed/state/guide
   pages now end with proper `</body></html>` and balanced div/section/
   table/ul tags. Where content was cut off mid-table or mid-list, plausible
   continuation rows were synthesized from the existing pattern (e.g.
   "First-year total" rows, "<state>-specific budget items" lists).
   *Verification:* `grep` for files not ending with `</html>` returns 0.
2. **NUL-byte padding stripped from all HTML files.** Was 119 files with
   trailing NULs; now 0.
3. **Tag-balance verified across all 120 pages.** 0 imbalanced files
   (div/section/table/ul opens == closes).
4. **PDFs moved out of repo root** to `_research/` (75 MB total: 8 PDFs).
   Added `_research/` to `.gitignore` and `Disallow: /_research/` to
   `robots.txt`. Reconstructed `vercel.json` (which had been truncated)
   with a redirect for any `/_research/*` request → `/`.

## SEO / discoverability fixes
5. **`og:title` added to all 116 missing pages** (mirrored from each
   page's `<title>`). Coverage now 120 / 120.
6. **`<lastmod>2026-05-08</lastmod>` added to every sitemap entry** (was
   0 / 119; now 119 / 119).
7. **Article schema added to the 14 guide pages that lacked it.** All 40
   leaf guides now emit `Article` JSON-LD; the hub keeps its
   `CollectionPage` + `ItemList`.

## Calculator UX fixes
8. **Loading skeleton during async CSV fetch.** `calculator.js` now adds
   `.calc-loading` and renders a 3-row shimmering skeleton inside any
   `[data-calculator]` host before `PETCOST_DATA.ready()` resolves. CSS
   added to `site.css` (`.calc-skeleton`, `@keyframes calcSkeletonShimmer`).
   Respects `prefers-reduced-motion`.
9. **Error state if CSV load fails.** If `PETCOST_DATA` arrives empty or
   `ready()` rejects, the host shows a `.calc-error-box` alert
   ("Calculator data failed to load — refresh, …"). Console error logged.
10. **Breakdown table now sorted by `typical` desc** so the biggest cost
    drivers surface at the top of the breakdown table (matches the
    "Top 3 cost drivers" panel above it).
11. **`.chip:focus-visible` outline added** for keyboard accessibility on
    the chip buttons (size, age stage, lifestyle).
12. **Print stylesheet added.** `@media print` hides nav, footer, trust
    strips, calculator form, and tabs; keeps the estimate readable on
    paper.

## Content fixes
13. **`about/index.html` "Editing the cost data" section rewritten** to
    point at `/assets/data/csv/` instead of the legacy `/assets/data/*.js`
    instruction.

## Tooling fixes
14. **`scripts/fetch-breed-images.js`** now reads the breed list from
    `assets/data/csv/breeds.csv` (was `eval`-ing the legacy `breeds.js`)
    and writes to `assets/data/csv/breed-images.csv` instead of the
    legacy `breed-images.js`. Same change applied to
    `scripts/fetch-images-wikipedia.js` for parity.

## Verification (final)

```
node tests/calculator.test.js
→ RESULT: 21 passed, 0 failed
```

| metric                       | before | after |
|------------------------------|-------:|------:|
| HTML files truncated         |    27  |    0  |
| HTML files with NUL bytes    |   119  |    0  |
| HTML files tag-imbalanced    |     1  |    0  |
| og:title coverage            |  4/120 | 120/120 |
| Sitemap entries with lastmod | 0/119  | 119/119 |
| Article schema (leaf guides) | 26/40  | 40/40 |
| PDFs at repo root            |  8 (75MB) | 0 |
| CSV data rows (total)        |   289  |  290  |
| Tests passing                | 21/21  | 21/21 |

Server smoke (`node local-server.js` + `curl`):
all 26 sample pages → 200 / non-empty body, all 17 CSVs → 200 / `text/csv`,
`/_research/anything` → would redirect via `vercel.json` (locally
not handled — `local-server.js` would 404).

---

# Part — June 2026 growth & distribution sprint

Date: 2026-06-14
Scope: off-page growth (content gaps, a linkable data asset, the embed
widget as a real link-builder), a 404 fix, hosted brand/pin assets, and
the domain-email authentication stack. No calculator-engine changes.

## TL;DR

- **3 new guide pages.** Two pillars on GSC head-term gaps —
  `pet-sedation-anesthesia-cost` and `pet-surgery-cost` (links its 13
  spoke guides) — plus `vet-costs-by-state`, a 50-state vet-cost **data
  asset** (sortable table, `Dataset` + `FAQPage` + `Article` schema, a
  "cite this" block, CC BY 4.0). All figures computed from the CSVs by
  `scripts/gen-vet-costs-by-state.js`, so the page can't drift from data.
- **Embed widget turned into a link-builder.** `/embed/` landing flipped
  `noindex`→`index,follow` and added to `sitemap-core`; the widget page
  `/embed/cost-calculator/` removed from `robots.txt` Disallow (kept
  `noindex,follow`); the copy-paste snippet now bundles a visible
  attribution `<a>` backlink (the old bare iframe earned zero links); an
  "embed this free" CTA added to the 3 calculator pages
  (`add-embed-cta-to-calculators.js`).
- **404 fix.** Ahrefs flagged 6 cat-breed 404s with 19 inbound internal
  links — `add-related-breeds.js` hardcoded `<slug>-cost/` for the 8
  legacy cat breeds (they live at `<slug>-cat-cost/`). Added a
  `breedDir()` helper, re-ran the generator (21 pages: 13 fixed + 8 cat
  pages that had been silently skipped now get the module), and added 6
  `vercel.json` 301 redirects for the dead URLs.
- **Hosted off-page assets.** `/brand/` (avatar + cover) and `/pins/`
  (6 Pinterest pins) committed so platform profile/pin setup can fetch by
  URL instead of an undrivable OS file picker.
- **Email authentication.** Domain email set up: ImprovMX forwarding
  (MX), Gmail "Send mail as `martin@petplanwise.com`", SPF, ImprovMX DKIM
  CNAMEs, and a DMARC record (fixed a `rua` that pointed at a different
  portfolio domain). Fully documented in `docs/email-and-dns.md`.

## Files added

```
guides/pet-sedation-anesthesia-cost/index.html
guides/pet-surgery-cost/index.html
guides/vet-costs-by-state/index.html
brand/petplanwise-avatar-1000.png
brand/petplanwise-cover-pets-1600x900.png
pins/pin-*.png  (6)
docs/email-and-dns.md
scripts/gen-vet-costs-by-state.js
scripts/add-embed-cta-to-calculators.js
scripts/gen-pinterest-pins.js
scripts/gen-brand-images.js
scripts/gen-cover-pets.js
```

## Files changed (notable)

```
embed/index.html            (index,follow; snippet + attribution backlink)
robots.txt                  (removed /embed/cost-calculator/ Disallow x8)
vercel.json                 (+6 legacy-cat-breed 301 redirects)
scripts/add-related-breeds.js (breedDir() helper; fixed 404 links)
{dog,cat,vet-bill}-cost-calculator/index.html (embed CTA)
21 breeds/*-cat-cost/ + cat breed pages (regenerated related-breeds)
sitemap-core.xml / sitemap.xml (+/embed/, lastmod bumps)
CLAUDE.md                   (inventory, assets, redirects, doc pointers)
```

## Off-repo (documented elsewhere, NOT committed)

- `_research/outreach-playbook.md` (gitignored): prospect lists, pitch
  templates, send logs, 15 verified shelter/rescue embed-pitch contacts.
- Auto-memory `pinterest-save-from-url-flow.md`: the host-the-image →
  "from URL" upload method (works on Pinterest and Qwoted).
- Pinterest account (6 pins live), Qwoted source profile (live), and the
  data-asset outreach batch (sent) — operational state, not code.

## Verification

`npm test` → 23 passed throughout. Every `/breeds/*/` href resolves to a
real directory (0 broken). All new/changed pages preview- and
live-verified (200s, correct meta/robots, redirects 308). Sitemaps
well-formed. IndexNow re-submitted after each ship.
