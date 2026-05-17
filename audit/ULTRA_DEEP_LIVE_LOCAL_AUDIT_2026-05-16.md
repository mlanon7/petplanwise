# PetPlanWise Ultra Deep Live + Local Audit

Audit date: 2026-05-16  
Local folder audited: `D:\MY WEBSITES\pet costs\petcost-bill`  
Live site audited: `https://www.petplanwise.com/`  
Purpose: release-quality audit for a calculator-first passive SEO site about U.S. dog, cat, vet-bill, and pet-insurance costs.

## 1. Executive Summary

PetPlanWise is now much stronger than the earlier versions. The site is live, the calculators load, the sitemap index resolves, the local calculator tests pass, the breed library is expanded to 54 breeds, and the live site has no obvious broken internal links, missing titles, missing meta descriptions, missing canonicals, or JSON-LD parse failures in the sitemap crawl.

That said, this is not yet a "set it and forget it" passive asset. The next round should focus on accuracy, source traceability, performance, legal clarity, and deployment hygiene. The biggest findings are:

- **Local/live mismatch:** live HTML references `20260516c` CSS/JS assets, while the local project references `20260516a` and does not contain the `20260516c` files. The local folder may not be the exact source of the deployed site.
- **Lifetime calculator logic can overstate senior/premium scenarios:** lifetime cost multiplies the currently selected annual cost by the pet's full average lifespan. A selected senior pet is treated as senior for every projected year.
- **Images are far too heavy:** local image assets total about **363.77 MB**. Some live breed pages load 3 MB+ hero images.
- **Three text assets contain NUL bytes:** `assets/css/site.css`, `assets/data/csv/breed-images.csv`, and `docs/seed-google-sheet.md`. The CSS still works because the NUL bytes are at the end, but this should not be shipped.
- **`breed-images.csv` is corrupted/incomplete:** 532 NUL bytes, 39 usable image rows, and missing rows for multiple breed slugs even though the site has 54 breed pages.
- **Affiliate disclosure blocks are misleading:** several CTAs say "affiliate partner" and "Sponsored" while linking to internal informational pages.
- **Some guide source links are malformed:** several generated guide pages put human notes inside the `href`, such as `https://www.vin.com/ (Veterinary Information Network)`.
- **Cost CSVs lack row-level source metadata:** the current numbers are directionally plausible, but not auditable enough for a YMYL-adjacent cost/insurance site.
- **Compare page is useful but still too self-contained:** it has inline CSS/JS, dynamic image markup without dimensions/fallback, and should be better linked from homepage/category surfaces.
- **Scaled-content risk remains:** 150 breed-state pages can work, but only if each page has real local/breed-specific value and not just variable substitution.

Recommendation: **do not add many more pages until the data, image, performance, and deployment-sync issues are fixed.** The site already has enough page volume. The highest ROI now is making the existing pages more trustworthy, faster, and less obviously generated.

## 2. What Was Verified

### Local Checks

- `npm test`
- public HTML inventory excluding `.git`, `.claude`, and `node_modules`
- raw HTML inventory including hidden tool folders
- metadata audit
- canonical audit
- H1 audit
- JSON-LD parse/type audit
- sitemap-vs-route audit
- internal asset/link audit
- external source link pattern audit
- image tag and image file-size audit
- CSV row/header inspection
- NUL-byte scan
- calculator scenario sanity checks
- compare page inspection
- affiliate block inspection
- `.gitignore`, `robots.txt`, and `vercel.json` inspection

### Live Checks

- fetched `https://www.petplanwise.com/`
- fetched `robots.txt`
- fetched `sitemap.xml`
- fetched all child sitemaps
- crawled 291 live sitemap URLs
- checked live status codes
- checked live metadata
- checked live schema parseability
- checked live long titles/descriptions
- checked live hidden-folder probes
- checked live asset availability
- checked live home, breeds, compare, dog calculator, and selected breed pages
- opened live site in the in-app browser and checked homepage, compare page, and dog calculator visible state

## 3. Current Health Snapshot

### Local Project

```text
Public HTML pages excluding .claude/.git/node_modules: 293
Raw recursive HTML pages including .claude: 586
Calculator tests: 21 passed, 0 failed
Broken internal links/assets in local public HTML crawl: 0
Missing local title tags: 0
Missing local meta descriptions: 0
Missing local canonicals: 0
Missing local H1s / multiple H1 issues: 0
JSON-LD parse errors: 0
Sitemap public URL mismatch: 0 missing, 0 extra
Pages missing local og:image: /404.html and /embed/cost-calculator/
Pages without local JSON-LD: /404.html, /affiliate-disclosure/, /embed/cost-calculator/, /embed/, /privacy/, /sources/, /terms/
Long titles over 65 chars: 116
Long/short descriptions outside preferred range: 12
Image assets: 713 files, about 363.77 MB total
```

### Live Site

```text
Live sitemap URLs crawled: 291
Live status codes: 291 x 200
Missing live titles: 0
Missing live meta descriptions: 0
Missing live canonicals: 0
Missing live og:image: 0
Live H1 issues: 0
Live JSON-LD parse errors: 0
Live pages without JSON-LD: /affiliate-disclosure/, /privacy/, /sources/, /terms/, /embed/
Live long titles over 65 chars: 116
Live long descriptions over 160 chars or under 80 chars: 11
Live external source links without rel consistency: 32
Live hidden probe /.claude/settings.local.json: 307 -> /
Live hidden probe /_research/: 307 -> /
Live hidden probe /.git/config: 308 -> /.git/config/
Live hidden probe /.git/config/: 404
```

## 4. Critical Finding: Local and Live Are Not Fully In Sync

Severity: P0  
Evidence:

- Local HTML references:
  - `/assets/css/site.css?v=20260516a`
  - `/assets/data/csv-loader-20260516a.js`
  - `/assets/js/layout-20260516a.js`
  - `/assets/js/calculator-20260516a.js`
- Live HTML references:
  - `/assets/css/site.css?v=20260516c`
  - `/assets/data/csv-loader-20260516c.js`
  - `/assets/js/layout-20260516c.js`
  - `/assets/js/calculator-20260516c.js`
- Live `20260516c` assets return 200.
- Live `20260516a` assets return 404.
- Local folder only contains `20260516a` files.

Why this matters:

- The local folder may not be the exact deployment source.
- Future edits could revert live fixes.
- Audits may flag local-only issues that have already been fixed live, or miss live-only issues.
- The other AI could patch the wrong asset version.

Required fix:

- Before any further implementation, decide the source of truth.
- If Vercel deployed from a different folder/branch, pull or copy that exact version back into `D:\MY WEBSITES\pet costs\petcost-bill`.
- Ensure local HTML and local assets use the same version family as live.
- Add a pre-deploy check that confirms every asset URL in every HTML file exists locally before deployment.

Acceptance criteria:

- Local `index.html` and live `index.html` reference the same asset version.
- Local `assets/js` contains the exact deployed calculator/layout files.
- Local `npm test` runs against the same files users receive.

## 5. Calculator Accuracy Audit

### What Is Working

The local calculator test suite passes:

```text
RESULT: 21 passed, 0 failed
```

Validated behavior:

- data loads
- breeds load
- cities load
- emergency scenarios load
- lifestyle multipliers order correctly
- dog and cat baseline scenarios are in reasonable ranges
- age multipliers increase puppy/senior vet costs
- breed risk multipliers affect high-risk breeds
- Manhattan city multiplier is higher than Texas
- insurance toggle increases annual cost
- lifetime totals are larger than annual totals

### Important Accuracy Problem: Lifetime Projection Uses Current Stage For Full Lifespan

Severity: P0/P1  
File: `assets/js/calculator.js`  
Relevant logic:

```js
var lifetime = {
  low: annual.low * years + oneTime.low,
  typical: annual.typical * years + oneTime.typical,
  high: annual.high * years + oneTime.high
};
```

Problem:

- The calculator first builds an `annual` estimate based on the selected stage.
- Then it multiplies that same annual estimate by the pet's full average lifespan.
- If the user selects `senior`, the calculator projects senior-level annual costs across the entire average life.
- If the user selects `premium`, it assumes premium lifestyle for every year.
- If the user selects Manhattan/NYC, it assumes that city multiplier across every year.

Examples from local engine:

```text
Medium adult dog, TX, standard, no insurance:
Annual typical: $2,101
Lifetime typical: $26,547

Giant senior dog, Manhattan, premium, with insurance:
Annual typical: $8,105
Lifetime typical: $74,277
High lifetime: $213,616

Senior cat, NY, premium, with insurance:
Annual typical: $3,328
Lifetime typical: $50,703
High lifetime: $114,556
```

Why this is risky:

- Synchrony/CareCredit lifetime studies are commonly cited around broad dog/cat lifetime ranges, not extreme stage-specific projections.
- A senior pet should not be modeled as senior from birth unless the label clearly says "projected cost if current annual spending continues for X years."
- This may make the calculator look inaccurate for high-cost edge cases.

Recommended fix:

Add two separate lifetime modes:

1. **Full-lifetime estimate**
   - weighted puppy/kitten, adult, senior phases
   - use breed/size average lifespan
   - one-time first-year costs only once
   - apply insurance premiums by phase if selected

2. **From-now estimate**
   - based on current selected age stage
   - use remaining-years assumptions
   - label clearly as "projected remaining cost"

Acceptance criteria:

- Selecting senior should not multiply senior annual costs by the full average lifespan unless the UI explicitly says "if this annual cost continues for the full projection period."
- Lifetime figures should be benchmarked against Synchrony/CareCredit lifetime ranges and flagged when they exceed reasonable national ranges.
- Add tests for puppy, adult, and senior lifetime behavior.

### Insurance Calculator Logic

Current premium assumptions:

```csv
dog adult typical: $62/month
cat adult typical: $32/month
dog senior typical: $105/month
cat senior typical: $60/month
```

These are directionally aligned with NAPHIA accident-and-illness premium benchmarks. Keep them, but label them as **typical accident-and-illness policy premiums**, not all pet insurance products.

Recommended improvements:

- Add row-level source fields to `insurance-monthly-premium.csv`.
- Add reimbursement math examples:
  - bill amount
  - deductible
  - reimbursement %
  - annual limit
  - out-of-pocket
- Add warning that premiums vary by ZIP, breed, age, reimbursement %, deductible, and annual limit.
- Add neutral language: insurance can reduce large-bill risk but does not always save money in expected-value terms.

### Procedure Calculator Data

Current `procedures.csv` has 25 rows. Ranges are generally plausible, but several rows are too broad or too merged:

- `spay_neuter` combines dog/cat, male/female, low-cost clinic/private practice, and complication cases into one range.
- `dental_cleaning` combines dog/cat and extraction/no-extraction scenarios.
- `vaccines` combines puppy/kitten series and adult boosters.
- `xray` says "single view" but many real bills are 2-3 views plus exam/sedation.
- `foreign_object`, `hbc`, `bloat_gdv`, and `ivdd_surgery` are plausible but need stronger source notes and disclaimers.

Recommended rows to add:

- dog_spay
- dog_neuter
- cat_spay
- cat_neuter
- puppy_vaccine_series
- kitten_vaccine_series
- adult_dog_vaccine_visit
- adult_cat_vaccine_visit
- dental_cleaning_no_extractions
- dental_cleaning_with_extractions
- dental_extraction_simple
- dental_extraction_surgical
- er_exam_only
- er_exam_with_diagnostics
- hospitalization_per_day
- euthanasia_private
- cremation_private

## 6. Data and CSV Audit

### CSV Files Present

The project now uses editable CSV under `assets/data/csv/`, which is the right architecture for a static calculator site.

Important files:

- `base-costs.csv`
- `breeds.csv`
- `breed-traits.csv`
- `breed-images.csv`
- `state-multipliers.csv`
- `city-multipliers.csv`
- `procedures.csv`
- `insurance-monthly-premium.csv`
- `life-expectancy.csv`
- `reviewer.csv`

### CSV Problems

#### 6.1 NUL Bytes In CSV

Severity: P0/P1  
File: `assets/data/csv/breed-images.csv`

Evidence:

```text
File size: 6,730 bytes
NUL bytes: 532
Usable rows imported: 39
Expected breed rows: 54
```

Why this matters:

- NUL bytes are a corruption signal.
- CSV parsers can behave inconsistently.
- Google Sheets import/export may break.
- Any image-driven UI depending on this file can silently miss breeds.

Required fix:

- Regenerate `breed-images.csv` cleanly from the actual public breed page hero/gallery data.
- Remove all NUL bytes.
- Ensure exactly one valid row for every breed slug.
- Add a test: `breed-images.csv` row count must match `breeds.csv` breed count.

#### 6.2 Missing Breed Image Rows

The current CSV image map is missing rows for multiple breeds, including:

- `goldendoodle`
- `labradoodle`
- `bernedoodle`
- `cavapoo`
- `shiba-inu`
- `belgian-malinois`
- `havanese`
- `maltese`
- `vizsla`
- `saint-bernard`
- `american-shorthair`
- `savannah-cat`
- `russian-blue`
- `norwegian-forest-cat`
- `abyssinian`
- `munchkin`

Note: public breed pages appear to have hero/gallery files, so the missing CSV rows are likely a data-sync problem rather than a missing-image problem.

#### 6.3 Blank Line In `breeds.csv`

Severity: P2  
File: `assets/data/csv/breeds.csv`

Evidence:

- blank line at line 40
- blank final line at EOF is fine; internal blank line is not

Risk:

- Some parsers treat the blank line as an empty breed row.
- My simple Node parse counted 55 rows even though PowerShell grouped 54 valid breeds.

Fix:

- Remove the internal blank line.
- Add CSV linting for blank lines and empty first-column values.

#### 6.4 Missing Row-Level Source Metadata

Severity: P1  
Affected files:

- `base-costs.csv`
- `procedures.csv`
- `insurance-monthly-premium.csv`
- `state-multipliers.csv`
- `city-multipliers.csv`
- `life-expectancy.csv`
- `breeds.csv`

Current issue:

- Numbers exist, but rows do not state where they came from.
- A global sources page is not enough for a cost calculator.

Recommended columns:

```csv
source_id,source_url,source_name,last_reviewed,confidence,method_note
```

Example:

```csv
dog,insurance,300,744,1200,naphia_2025,https://naphia.org/industry-data/,NAPHIA,2026-05,high,adult accident-and-illness annualized from monthly benchmark
```

Acceptance criteria:

- Every number used in a calculator can be traced to a source, blended-source method, or explicit editorial estimate.
- Pages can show "last reviewed" and "source note" dynamically from data.

## 7. Source Accuracy Against Reliable References

The site's broad cost direction is plausible, but the source trail must be made tighter.

### Reliable Source Anchors To Keep

- AVMA U.S. pet ownership statistics: ownership household counts and veterinary spending context.
- NAPHIA industry data / 2025 report: pet insurance premium averages and market growth.
- BLS CPI: inflation context for veterinary services and pet services.
- Synchrony/CareCredit Lifetime of Care: lifetime cost range context.
- AAHA/AAFP/AVMA/AVDC: care-standard context, not exact pricing.
- Merck Veterinary Manual, VCA, AAHA, specialty colleges: medical explainer support.

### Claims That Need Softening Or Better Sourcing

1. **"Accurate estimates"**
   - Better: "planning estimates" or "source-aligned estimates."
   - Exact bills vary heavily by clinic, ZIP, urgency, comorbidity, and pet size.

2. **"Real veterinary clinic pricing"**
   - If no proprietary clinic dataset exists, say "published veterinary cost ranges, public surveys, and market benchmarks."

3. **"Cost-optimal"**
   - Appears in dental meta description.
   - Better: "often cost-effective" or "usually the best prevention strategy."

4. **"U.S. vet costs have risen ~60% since 2014"**
   - Keep only if the exact CPI calculation is documented.
   - Add dates, CPI series, and formula.

5. **Breed behavior scoring**
   - The compare page correctly notes breed explains a limited share of behavior variation, but trait scores still need source IDs per row or at least a methodology file.

6. **Breed health-cost multipliers**
   - Health risk multipliers are useful, but should be labeled editorial estimates informed by breed predispositions, not precise actuarial factors.

## 8. SEO Audit

### What Is Working

Local and live crawls show:

- no missing titles
- no missing descriptions
- no missing canonicals
- no H1 count problems
- no JSON-LD parse errors
- no broken internal links in public local crawl
- live sitemap has 291 URLs and all returned 200
- duplicate title/description checks were clean
- canonical self-reference checks were clean
- FAQ schema exists on 113 pages
- Breadcrumb schema exists on 284 pages

### SEO Problems To Fix

#### 8.1 Long Titles

Severity: P2  
Count: 116 titles over 65 characters.

Examples:

- `/breeds/cavalier-king-charles-cost/` - 77 chars
- `/breeds/labrador-retriever-cost-in-north-carolina/` - 78 chars
- `/guides/hidden-pet-costs/` - 81 chars
- `/guides/why-are-vet-bills-so-expensive-in-2026/` - 80 chars

Fix:

- Do not obsess over every long title, but shorten templates where easy.
- Breed-state template can become:
  - `{Breed} Cost in {State} (2026) | PetPlanWise`
  - or `{Breed} in {State}: Cost Guide (2026)`

#### 8.2 Long Meta Descriptions

Severity: P2  
Count: 11 live descriptions outside preferred range.

High-priority examples:

- `/guides/pet-insurance-vs-carecredit/` - 242 chars
- `/guides/why-are-vet-bills-so-expensive-in-2026/` - 241 chars
- `/guides/adopt-vs-buy-dog-cost/` - 201 chars
- `/guides/pet-er-vs-wait-decision-guide/` - 185 chars

Fix:

- Rewrite to 135-155 characters.
- Avoid stuffing full cost ranges into the meta description.
- Keep the click intent clear.

#### 8.3 Pages Without Schema

Live pages without JSON-LD:

- `/affiliate-disclosure/`
- `/privacy/`
- `/sources/`
- `/terms/`
- `/embed/`

Fix:

- Add `WebPage` schema to legal pages.
- Add `CollectionPage` or `WebPage` schema to `/embed/`.
- Keep legal schema simple; do not overdo it.

#### 8.4 FAQ Strategy

The site has a lot of FAQ schema. That is fine, but visible FAQ value matters more than rich-result expectations. Google limits FAQ rich results mainly to authoritative government/health domains, so FAQs should be written for user clarity, not schema chasing.

Recommended:

- Keep visible FAQs.
- Avoid repeating identical FAQ blocks across programmatic pages.
- Add 3-5 unique FAQs on each important breed/state/procedure page.
- Do not add FAQ schema to pages where the FAQ is thin or duplicated.

## 9. Live Site / Deployment Audit

### What Is Good

- Live sitemap index resolves.
- All 291 sitemap URLs returned HTTP 200.
- Live hidden `.claude` URL redirects to `/`.
- Live `_research/` redirects to `/`.
- Live `.git/config/` returns 404.
- Live metadata is cleaner than local in some areas, including `og:image`.

### Remaining Deployment Concerns

1. **Robots does not disallow `.claude/` or `.git/`**
   - Redirects exist in Vercel, but robots should also disallow:
     - `/.claude/`
     - `/.git/`
     - `/docs/` if docs are not intended for public users
     - `/breed_images/` if source image storage should not be public

2. **`breed_images/` and `docs/` may be public**
   - Because `outputDirectory` is `.`, everything in the repo can be deployed unless blocked.
   - This increases bloat and exposes internal/source assets.

3. **No automated deploy audit**
   - Add a `npm run audit` script that crawls the built static folder and fails on:
     - missing assets
     - missing metadata
     - broken internal links
     - schema parse errors
     - NUL bytes
     - public hidden folders
     - invalid external hrefs
     - image files above size thresholds

## 10. Visual / UI Audit

### What Improved

- Homepage is calculator-first.
- Visual design is more restrained and credible than earlier versions.
- Breed pages now have photos.
- Breed hub has image cards.
- Compare page is a strong engagement feature.
- No popups or email gates.
- Top navigation now includes Compare via injected layout.

### UI Problems / Opportunities

1. **Hero images on breed pages are too heavy**
   - Some hero images are 3 MB+.
   - This will hurt mobile UX and Core Web Vitals.
   - Convert to WebP/AVIF and serve responsive sizes.

2. **Homepage should surface Compare more clearly**
   - The nav has Compare, but the homepage category grid does not have a dedicated compare card.
   - Add "Compare Breeds" as a visible card or CTA near the breed category.

3. **Compare page should feel more app-like**
   - Move inline CSS/JS to real files.
   - Add URL parameters:
     - `/compare/?a=french-bulldog&b=bulldog`
   - Add popular comparison chips.
   - Add fallback images.
   - Add loading/error states for CSV fetch failures.

4. **State pages need more visual value**
   - State pages can feel dry if they are just text and tables.
   - Add state cost driver chips:
     - high vet labor market
     - urban/rural spread
     - emergency clinic density
     - parasite/climate risk where source-backed

5. **Breed-state pages need stronger differentiation**
   - Add local context blocks.
   - Add "why this state changes the estimate."
   - Add links to parent breed, parent state, and compare page.

6. **Trust strip is better, but claims need precision**
   - "Source-Aligned" is safer than "Veterinarian Reviewed."
   - Keep this direction.
   - Replace "real veterinary clinic pricing" unless the site truly has clinic pricing data.

7. **Font loading**
   - Inter looks modern.
   - Consider self-hosting or using system font fallback for privacy/performance.
   - Current Google Fonts dependency is acceptable but not ideal.

## 11. Image / Performance Audit

### Local Image Weight

Evidence:

```text
Image files: 713
Total image size: about 363.77 MB
Largest examples:
- breeds/poodle-cost/gallery/03.png: 3.57 MB
- breeds/australian-shepherd-cost/hero.jpg: 3.56 MB
- breeds/great-dane-cost/gallery/04.jpg: 3.37 MB
- breeds/doberman-cost/hero.jpg: 3.29 MB
- breeds/maine-coon-cat-cost/hero.jpg: 3.07 MB
- breeds/siamese-cat-cost/hero.jpg: 2.86 MB
```

### Live Page Weight Examples

```text
Homepage estimated HTML + referenced assets: ~0.21 MB
/compare/ estimated HTML + referenced assets: ~0.23 MB
/breeds/australian-shepherd-cost/ estimated load: ~3.72 MB
/breeds/maine-coon-cat-cost/ estimated load: ~3.24 MB
```

This is the biggest UX/performance issue.

Required fixes:

- Generate responsive hero images:
  - 480w
  - 768w
  - 1200w
- Convert to WebP or AVIF.
- Keep hero image target under 250 KB where possible.
- Use `srcset` and `sizes`.
- Lazy-load gallery images below the fold.
- Keep one high-quality source image outside deploy if needed, but deploy optimized derivatives only.
- Exclude `breed_images/` from deployment if it is a source working folder.

Acceptance criteria:

- No above-the-fold breed hero image over 350 KB.
- No deployed source image folder over a reasonable threshold.
- Lighthouse/LCP improves on breed pages.

## 12. Accessibility Audit

Automated local checks found:

- 0 empty accessible-name buttons
- 0 unlabeled visible inputs
- 927 `<details>` elements all have `<summary>`
- H1 count is clean

Remaining accessibility work:

- Run keyboard-only testing on:
  - homepage calculator
  - dog calculator
  - cat calculator
  - vet bill calculator
  - emergency calculator
  - insurance calculator
  - compare page
  - mobile nav
- Ensure result tabs announce selected state correctly.
- Ensure calculator result updates are announced politely to screen readers.
- Ensure compare trait bars have text values, not only visual widths.
- Confirm focus rings are visible on cream backgrounds.
- Add `prefers-reduced-motion` coverage for gallery hover/lightbox effects.

## 13. Legal / Affiliate / Monetization Audit

### Affiliate Disclosure Problem

Severity: P1  
Examples:

- `dog-cost-calculator/index.html`
- `cat-cost-calculator/index.html`
- `emergency-vet-cost-calculator/index.html`
- `pet-insurance-vs-savings/index.html`

Current pattern:

- Disclosure says: "The link below is an affiliate partner."
- CTA is often an internal informational link such as:
  - `/guides/puppy-first-year-cost/`
  - `/pet-insurance-vs-savings/`
  - `/about/`

Why this is bad:

- It creates confusion.
- It looks like internal pages are paid affiliate links.
- It weakens trust before monetization even starts.

Fix:

- For internal CTAs, remove "affiliate partner" language.
- Use:
  - "Disclosure: This site may earn from affiliate links when we add partner recommendations. This internal guide is not a paid placement."
- When real affiliate links are added:
  - put disclosure immediately before the recommendation
  - use `rel="sponsored nofollow noopener"`
  - clearly label ads vs editorial links

### Current Monetization Readiness

Not ready for heavy ads yet.

Do first:

1. Fix calculator lifetime logic.
2. Fix image performance.
3. Fix affiliate placeholder language.
4. Add analytics events.
5. Add row-level source metadata.
6. Improve breed-state uniqueness.

Then monetize with:

- pet insurance affiliate comparisons
- emergency savings / insurance calculator CTAs
- Chewy/Amazon starter-kit content only where relevant
- ads only after speed and traffic stabilize

## 14. Content Audit

### Strengths

- Good page breadth:
  - 54 breed pages
  - 150 breed-state pages
  - 25 state pages
  - 43 guide pages
  - 5 calculator pages
  - compare tool
- Strong calculator-first positioning.
- Cost pages have clear commercial intent.
- Guides cover procedure, ownership, insurance, and emergency topics.

### Content Risks

1. **Scaled-content risk**
   - 150 breed-state pages are useful only if differentiated.
   - Do not expand to 500+ pages until uniqueness is improved.

2. **Too many exact numbers without inline support**
   - Cost content must show sources near tables.
   - Global sources page is not enough.

3. **Medical caution**
   - Emergency and procedure guides should repeat:
     - not veterinary advice
     - call a vet/ER for urgent symptoms
     - cost should not delay emergency care

4. **Pet insurance neutrality**
   - Keep insurance guidance neutral.
   - Avoid implying insurance is always financially optimal.

5. **Missing mixed-breed pages**
   - Add:
     - `/breeds/mixed-breed-dog-cost/`
     - `/breeds/domestic-shorthair-cat-cost/`
   - These are likely more useful to real owners than many rare pedigreed breeds.

## 15. Breed Coverage Audit

Current breed CSV:

- 40 dog breeds
- 14 cat breeds

This is enough for launch. Recommended second wave:

### Dog Breeds To Add

1. German Shorthaired Pointer
2. Pembroke Welsh Corgi
3. English Springer Spaniel
4. Miniature American Shepherd
5. Shetland Sheepdog
6. Basset Hound
7. Collie
8. Great Pyrenees
9. Bichon Frise
10. West Highland White Terrier
11. Mixed-Breed Dog

### Cat Breeds To Add

1. Exotic Shorthair
2. Devon Rex
3. Siberian Cat
4. Burmese
5. Oriental Shorthair
6. Domestic Shorthair / Mixed-Breed Cat

Do not add more until image/data/source automation is clean.

## 16. Compare Page Audit

Page: `/compare/`  
File: `compare/index.html`

What works:

- Live page loads.
- No browser console errors found in quick browser pass.
- Trait comparison is useful.
- Cost comparison connects back to calculator value.
- Source/methodology note is visible.
- Uses `breed-traits.csv`.

Issues:

1. Inline CSS and JS:
   - one large `<style>`
   - one large `<script>`
   - makes maintenance harder

2. Dynamic image without dimensions:
   - `'<div class="cmp-breed-photo"><img src="' + img + '" alt="' + escapeHtml(breed.name) + '" loading="eager"></div>'`
   - needs fallback image
   - needs dimensions or CSS aspect-ratio

3. No shareable query state:
   - selected breeds should persist in the URL

4. Homepage does not strongly promote compare:
   - nav has Compare, but homepage category section should include a compare entry

5. Trait scoring needs stronger source mapping:
   - `breed-traits.csv` has no per-row source IDs
   - methodology is good but not enough for every claim

Recommended fixes:

- Move compare CSS to `assets/css/compare.css`.
- Move compare JS to `assets/js/compare.js`.
- Add query params:
  - `?a=labrador-retriever&b=golden-retriever`
- Add popular comparison chips.
- Add fallback image.
- Add SoftwareApplication/WebApplication schema.
- Add CSV columns or separate notes for trait source/method.

## 17. Link Audit

### Internal Links

Local public crawl:

- broken internal references: 0

Live sitemap crawl:

- all 291 sitemap URLs returned 200

### External Links

Problems:

- 32 external source links lack consistent `rel`.
- Several generated guide source links are malformed.

Malformed examples:

- `guides/cat-acl-surgery-cost/index.html`
  - `href='https://www.vin.com/ (Veterinary Information Network)'`
- `guides/dog-allergy-testing-cost/index.html`
  - `href='https://www.acvd.org/ (American College of Veterinary Dermatologists)'`
- `guides/pet-mri-ct-cost/index.html`
  - `href='https://www.acvr.org/ (American College of Veterinary Radiology)'`

Fix:

- Keep `href` as the clean URL only.
- Put the organization name in anchor text.
- Add `target="_blank" rel="noopener"` to external neutral source links.
- Use `rel="sponsored nofollow noopener"` only for paid/affiliate links.

## 18. Technical SEO / Structured Data

Schema type counts in local crawl:

```text
BreadcrumbList: 284
FAQPage: 113
Article: 193
CollectionPage: 4
ItemList: 4
SoftwareApplication: 6
ContactPage: 1
WebSite: 1
```

Recommendations:

- Add Organization schema once site owner info is stable.
- Add WebPage schema to legal pages.
- Add dateModified to articles if not already present consistently.
- Ensure Article schema author/reviewer matches real editorial process.
- Do not use fake veterinarian/reviewer claims.
- Validate schema with Google Rich Results Test after major changes.

## 19. Security / Privacy / Headers

Good:

- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- no email gate
- no obvious tracking in the audited static HTML

Needs improvement:

- Add robots disallow/redirect coverage for:
  - `/.claude/`
  - `/.git/`
  - `/breed_images/` if not intended public
  - `/docs/` if internal
- Consider adding:
  - `Content-Security-Policy`
  - `X-Frame-Options` or CSP `frame-ancestors`, except where embed page is intentionally frameable
- If analytics are added, update privacy policy and cookie/consent logic as needed.

## 20. Performance Priority List

1. Optimize breed hero images.
2. Exclude source image folders from deployment.
3. Remove NUL bytes from CSS/CSV/docs.
4. Self-host or system-font Inter if performance becomes an issue.
5. Move compare inline CSS/JS to assets so it can cache.
6. Add image dimensions and `srcset`.
7. Add a script that fails if any public page references an image above a chosen threshold.
8. Add caching for immutable versioned assets.
9. Reduce old compatibility JS shims once confirmed unnecessary.
10. Run Lighthouse on homepage, breed page, compare page, dog calculator.

## 21. Ranked Fix List For The Other AI

### P0 - Fix Before More Content

1. **Resolve local/live mismatch**
   - Sync the local folder with the exact deployed `20260516c` asset set or redeploy from the audited local `20260516a` set.
   - Acceptance: local and live HTML reference the same asset versions.

2. **Fix lifetime projection logic**
   - Add full-lifetime phase weighting and from-now projection mode.
   - Acceptance: senior selections no longer imply senior cost for full lifespan unless clearly labeled.

3. **Clean NUL-byte files**
   - `assets/css/site.css`
   - `assets/data/csv/breed-images.csv`
   - `docs/seed-google-sheet.md`
   - Acceptance: NUL-byte scan returns 0.

4. **Regenerate `breed-images.csv`**
   - one row per breed
   - no blank/corrupt rows
   - source URL/license/author/dimensions included
   - Acceptance: 54 valid breed image rows.

5. **Fix affiliate placeholder language**
   - remove "affiliate partner" wording from internal-only CTA blocks.
   - Acceptance: no internal link is described as an affiliate partner link.

6. **Optimize deployed images**
   - convert hero images to WebP/AVIF
   - add responsive sizes
   - exclude source folders
   - Acceptance: no hero image over 350 KB.

7. **Fix malformed external source links**
   - clean `href`
   - add anchor text
   - add `rel="noopener"`
   - Acceptance: no `href` contains spaces plus parenthetical source names.

8. **Add row-level source metadata**
   - cost, procedure, insurance, state/city multipliers.
   - Acceptance: every calculator number has source/method fields.

### P1 - High Impact

9. Add `npm run audit`.
10. Add CSV linting.
11. Add asset existence/version audit.
12. Add image-size audit.
13. Add external link audit.
14. Move compare CSS/JS out of HTML.
15. Add compare URL parameters.
16. Add compare fallback images and dimensions.
17. Add compare card on homepage.
18. Add Organization schema.
19. Add WebPage schema to legal pages.
20. Shorten worst meta descriptions.
21. Shorten title templates where easy.
22. Add mixed-breed dog page.
23. Add domestic shorthair cat page.
24. Add missing high-demand breed pages only after asset/data cleanup.
25. Strengthen breed-state uniqueness.
26. Add state-specific methodology notes.
27. Add "what changes this estimate" to calculator result cards.
28. Add visible "last reviewed" dates everywhere costs appear.
29. Add source notes under every major cost table.
30. Add analytics events after privacy policy is updated.

### P2 - Polish

31. Self-host fonts or use system stack.
32. Add richer empty/loading states.
33. Add keyboard QA notes.
34. Add print/share estimate UI.
35. Add "save this estimate" localStorage feature.
36. Add popular comparison links.
37. Add internal links from breed pages to compare pairs.
38. Add better state hub visuals.
39. Add mobile screenshots to QA workflow.
40. Create a deploy checklist.

## 22. Copy-Paste Prompt For The Other AI

```markdown
You are improving the static PetPlanWise website in:

`D:\MY WEBSITES\pet costs\petcost-bill`

Read this audit first:

`audit/ULTRA_DEEP_LIVE_LOCAL_AUDIT_2026-05-16.md`

Important: do not regenerate the whole site. Make targeted fixes only. Preserve the static HTML/CSS/vanilla JS architecture and CSV data model.

First, verify whether this local folder exactly matches the live site at `https://www.petplanwise.com/`. The live site currently references `20260516c` assets, while the local folder references `20260516a`. Do not patch blindly until this source-of-truth mismatch is resolved.

Ship these P0 fixes first:

1. Resolve local/live asset version mismatch.
2. Fix lifetime calculator logic so senior/premium/current-location costs are not multiplied across a full lifetime without clear labeling.
3. Remove NUL bytes from `assets/css/site.css`, `assets/data/csv/breed-images.csv`, and `docs/seed-google-sheet.md`.
4. Regenerate `breed-images.csv` so every breed has a valid row with source URL, author, license, width, height, and approved status.
5. Fix affiliate disclosure blocks so internal links are not described as affiliate partner links.
6. Optimize breed hero/gallery images and exclude source image folders from deployment.
7. Fix malformed external source links where organization notes are inside the `href`.
8. Add row-level source metadata to cost CSVs.

Then add:

- `npm run audit`
- CSV linting
- asset version/existence checks
- image-size checks
- metadata/schema/link checks
- compare page URL params
- compare page fallback images
- externalized compare CSS/JS
- source notes under cost tables

Before final response, verify:

- `npm test`
- full static audit passes
- live/local asset versions match
- no NUL bytes
- no broken internal links
- no malformed external links
- no missing title/description/canonical/H1
- no JSON-LD parse errors
- all sitemap URLs return 200
- no hero image above the agreed threshold
- calculator lifetime edge cases are fixed

Return:

- files changed
- files added
- tests/checks run
- before/after metrics
- remaining open questions
```

## 23. Reliable Source List For Content Updates

Use these as anchor sources when revising cost claims:

- AVMA U.S. pet ownership statistics: `https://www.avma.org/resources-tools/reports-statistics/us-pet-ownership-statistics`
- NAPHIA industry data: `https://naphia.org/industry-data/`
- NAPHIA 2025 State of the Industry: `https://naphia.org/news/naphia-news/soi-report-2025/`
- APPA industry trends and stats: `https://americanpetproducts.org/industry-trends-and-stats`
- BLS CPI data: `https://www.bls.gov/cpi/data.htm`
- BLS CPI release tables: `https://www.bls.gov/news.release/cpi.t02.htm`
- Synchrony lifetime care study: `https://www.synchrony.com/contenthub/newsroom/new-synchrony-study-finds-nearly-8-out-of-10-pet-owners.html`
- CareCredit veterinary cost library: `https://www.carecredit.com/vetmed/costs/`
- CareCredit emergency vet cost guide: `https://www.carecredit.com/well-u/pet-care/emergency-vet-visit-cost-and-veterinary-financing/`
- AAHA guidelines: `https://www.aaha.org/`
- AAFP cat owner/veterinary resources: `https://catvets.com/`
- AVDC dental resources: `https://avdc.org/`
- Merck Veterinary Manual: `https://www.merckvetmanual.com/`
- VCA pet health library: `https://vcahospitals.com/know-your-pet`
- C-BARQ: `https://vetapps.vet.upenn.edu/cbarq/`
- Morrill et al. 2022 Science paper: `https://www.science.org/doi/10.1126/science.abk0639`
- AKC breed profiles: `https://www.akc.org/dog-breeds/`
- CFA cat breed profiles: `https://cfa.org/breeds/`
- Google helpful content: `https://developers.google.com/search/docs/fundamentals/creating-helpful-content`
- Google image SEO: `https://developers.google.com/search/docs/appearance/google-images`
- Google FAQ structured data: `https://developers.google.com/search/docs/appearance/structured-data/faqpage`
- FTC endorsement guides: `https://www.ftc.gov/business-guidance/resources/ftcs-endorsement-guides`
- ADA web guidance: `https://www.ada.gov/resources/web-guidance/`

## 24. Final Judgment

PetPlanWise is viable and already has enough content to start gathering traffic. The next step should not be mass page expansion. The next step should be **trust and speed hardening**:

- fix lifetime math
- sync local/live assets
- clean corrupted files
- optimize images
- make every cost row source-traceable
- clean affiliate language
- clean source links
- add automated audits

Once those are done, the site will be much better positioned as a passive SEO asset with future affiliate and ad monetization.
