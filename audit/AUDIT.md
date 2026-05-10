# petcost-bill — full project audit

Date: 2026-05-08
Scope: post-CSV-refactor full audit covering project structure, content,
sources, UI/SEO, accessibility, dead code, and a verify-everything-still-
works section. Findings are tagged **[severity]** and grouped by area;
the prioritized punch list is at the end.

Severity legend
- 🔴 **critical** — broken on a production deploy, or breaks calculator,
  or harms credibility/SEO badly.
- 🟠 **high** — visible to users / search engines; not fatal but should
  be fixed before next launch.
- 🟡 **medium** — quality issue; do soon.
- 🟢 **low / nice-to-have** — polish, future work.

---

## 1. Project type & shape

Pure-static SEO site. 120 HTML files, no framework, vanilla JS, single
22 KB CSS. Designed for zero-build deploy on Vercel/Netlify/Pages.

| section | files |
|---|---|
| top-level (`index.html`, calculators, legal) | 11 |
| `breeds/<slug>/` | 38 + 1 hub |
| `states/<slug>/` | 25 + 1 hub |
| `guides/<slug>/` | 39 + 1 hub |
| `vet-costs/` | 1 (hub only — see §2) |
| `404.html` | 1 |
| sitemap entries | 119 |

`vercel.json` configures clean URLs, trailing slash, and asset cache
headers. `package.json` (post-refactor) wires `npm run dev` to
`node local-server.js`. `tests/calculator.test.js` is the only test
target and covers the math engine (21 assertions, all passing — see §10).

The dataset is now CSV-first under `assets/data/csv/` (17 files, 289
data rows). The runtime path: `csv-loader.js` → fetch each CSV → parse
→ reshape into `window.PETCOST_DATA.*` → `calculator.js` waits for
`PETCOST_DATA.ready()` → mounts. See `CHANGES.md` for the diff list.

---

## 2. Content gaps and pages worth adding

### 🔴 Empty `/vet-costs/` hub
`vet-costs/` ships only `index.html` — there are **no per-procedure
detail pages under `/vet-costs/`**. The hub links instead point to
`/guides/<slug>/`. The two information architectures collide:
- The site has 25 procedure-cost guides under `/guides/` (e.g.
  `/guides/dog-vaccine-cost/`, `/guides/dog-bloodwork-cost/`).
- The marketing on the homepage says "Vet procedure costs" with a card
  pointing at `/vet-costs/` — which lands on a hub that links back into
  `/guides/`.

**Recommendation:** Pick one. Either (a) rename the hub label to "Vet
cost guides" and let `/vet-costs/` redirect or 301-merge into
`/guides/`, or (b) keep `/vet-costs/` and create real per-procedure
pages there, deprecating the matching `/guides/<x>-cost/` slugs with
301s. Option (a) is easier and preserves existing URL equity.
*Location:* `vet-costs/index.html`, `index.html` homepage card list.

### 🟠 Breed coverage skews toy/pop, missing some workhorses
38 breeds covered. Missing notable ones with U.S. search volume:
Vizsla, Weimaraner, Brittany, Shetland Sheepdog, Saint Bernard, English
Springer Spaniel, Russian Blue (cat), American Shorthair (cat), Devon
Rex (cat). For each, ~150 lines of HTML (template clone) plus a row in
`breeds.csv`. *Recommendation:* add at least American Shorthair (one of
the most popular U.S. cats) and Vizsla.

### 🟠 No "puppy or kitten cost calculator" landing page
The math is in the calculator engine via the `puppy`/`kitten` age stage,
but there's no dedicated deep-link page (e.g.
`/puppy-cost-calculator/`). `/guides/puppy-first-year-cost/` is close,
but it's an article, not a calculator landing. *Recommendation:* add
`/puppy-cost-calculator/` and `/kitten-cost-calculator/` as light
templates with the calculator pre-set to `data-stage="puppy"` /
`data-stage="kitten"` and species-pinned.

### 🟡 No "monthly cost" / "lifetime cost" landing pages
Same idea — `/monthly-pet-cost-calculator/` and
`/lifetime-pet-cost-calculator/` would catch a different intent ("how
much per month?") and currently have no targeted entry.

### 🟡 Missing senior-pet content
There's `senior-dog-cost` under guides, but no senior-cat, no
senior-pet-emergency budget guide. Senior pets drive a disproportionate
share of vet spend; this is a high-intent gap.

### 🟢 Dental/preventive content is concentrated; no dewormer / heartworm guide
Add `/guides/heartworm-prevention-cost/` and
`/guides/flea-tick-prevention-cost/` — these are recurring spend items
that the homepage calc bundles into `preventatives` but never explains.

---

## 3. FAQ source quality — recommended authoritative URLs

The site already cites AVMA, NAPHIA, BLS CPI, AAHA, ASPCA, Banfield,
Synchrony — the right list. But the FAQ blocks on individual pages are
mostly bare prose with no source link. Recommend adding a "Source:"
inline link for any number that appears in a FAQ answer.

### Sources to add to `sources/index.html` and inline cites

Authoritative, government / association / peer-reviewed:

- **AVMA — U.S. Pet Ownership and Demographics Sourcebook**
  https://www.avma.org/resources-tools/reports-statistics/us-pet-ownership-statistics
  *(already cited — keep using as the primary "% of households" stat)*
- **AVMA — Veterinary Service Price Index** (member content)
  https://www.avma.org/resources-tools/reports-statistics
  *(use for "vet inflation outpaces general CPI" claims)*
- **U.S. BLS — CPI Detailed Report, "Veterinary services" series**
  https://www.bls.gov/news.release/cpi.t02.htm
  *(deeper than the headline CPI link — actual numeric series)*
- **U.S. BLS — Consumer Expenditure Survey, "Pets, pet products, services"**
  https://www.bls.gov/cex/tables.htm
  *(authoritative for "average U.S. household spends $X on pets")*
- **NAPHIA — State of the Industry 2024**
  https://naphia.org/industry-data/
  *(already cited — direct to the report, not the homepage)*
- **AVMA — AVMA Pet Insurance Plans white paper**
  https://www.avma.org/resources/pet-owners/petcare/pet-insurance
  *(better than the generic insurance industry quote for "is insurance
  worth it" framing)*
- **AAHA 2022 Canine Vaccination Guidelines**
  https://www.aaha.org/resources/2022-aaha-canine-vaccination-guidelines/
  *(already cited — anchor specific links to "core vs non-core")*
- **AAHA/AAFP 2020 Feline Vaccination Guidelines**
  https://www.aaha.org/resources/2020-aahaaafp-feline-vaccination-guidelines/
- **AVDC — Veterinary Dentistry Position Statements**
  https://avdc.org/AVDC/Resources/POSITION-STATEMENTS/avdc.org
- **WSAVA Global Dental Guidelines**
  https://wsava.org/global-guidelines/global-dental-guidelines/
  *(international peer source for dental claims)*
- **CDC — Healthy Pets, Healthy People (zoonotic, vaccination context)**
  https://www.cdc.gov/healthy-pets/
  *(government source for "vaccinate against rabies" type claims)*
- **FDA-CVM (Center for Veterinary Medicine)**
  https://www.fda.gov/animal-veterinary
  *(authoritative on Rx pet meds and food safety)*
- **ASPCA Animal Poison Control Center**
  https://www.aspca.org/pet-care/animal-poison-control
  *(use for the "toxin ingestion" emergency procedure copy — number
  888-426-4435 already in the data)*
- **Synchrony / CareCredit — Lifetime of Care studies (cats and dogs)**
  https://www.carecredit.com/well-u/pet-care/lifetime-of-care-study/
  *(already cited — pin to the per-pet PDF, not the landing page)*
- **Banfield — State of Pet Health (annual)**
  https://www.banfield.com/state-of-pet-health
  *(already cited — link to the most recent year's report PDF
  specifically)*
- **Cornell Feline Health Center**
  https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center
  *(peer-reviewed for cat-specific health claims, e.g. HCM, FIP, dental)*
- **Cornell Riney Canine Health Center**
  https://www.vet.cornell.edu/departments-centers-and-institutes/riney-canine-health-center
- **OFA — Orthopedic Foundation for Animals (hip dysplasia screening)**
  https://ofa.org/
  *(already cited — anchor breed-specific risk paragraphs)*
- **Penn HIP**
  https://antechimagingservices.com/antechweb/penn-hip
- **JAVMA / AVMA Open** (peer-reviewed veterinary research)
  https://avmajournals.avma.org/
  *(use to back any "study found X% of breed Y has condition Z" line)*

### 🟠 FAQ answers cite numbers without sources
Spot check: `dog-cost-calculator/index.html` FAQ says "$1,200–$4,500
per year." That's defensible against AVMA/ASPCA/Synchrony, but the FAQ
doesn't say so. *Recommendation:* add a parenthetical "(Synchrony
Lifetime of Care, 2024)" or similar to every FAQ that quotes a number.

### 🟡 No reviewer credential
The homepage shows "Reviewed by Pet Cost Editorial Team" — a real DVM
review (or an explicit "fact-checked against AVMA/NAPHIA, no clinical
review" disclaimer) is more honest. Either way, surface it on every
breed/state/guide, not just home.

### 🟡 Some breed `notes` make medical claims without inline citation
`breeds.csv` notes for Cavalier King Charles ("Mitral valve disease and
syringomyelia are common breed risks") and Boxer ("Cancer-prone breed.
Brachycephalic features and cardiac issues") are correct but unsourced.
Cite OFA, AKC Canine Health Foundation, or AVMA in the rendered breed
page.

---

## 4. Visual / UI issues

### 🟠 No loading state during CSV fetch
The calculator now waits for `PETCOST_DATA.ready()`. On a cold cache it
takes ~0.1–0.3 s to fetch 17 small CSVs. During that window the
calculator host element is empty — users see nothing. *Recommendation:*
inject a skeleton "Loading…" placeholder inside `[data-calculator]` in
`calculator.js` before the await. ~10 lines of code.

### 🟡 No error state if a CSV fails to fetch
`csv-loader.js` rejects on a 404 / 500. Right now `calculator.js`
catches the rejection and mounts anyway with an empty data set, which
silently shows wrong numbers (mostly $0 / NaN). *Recommendation:* on
catch, show "Calculator data failed to load — refresh, or check the
console." This protects against a broken deploy.

### 🟡 Result table is unsorted
`renderPetResults` renders the breakdown rows in the engine's input
order (food, treats, …). Top-3 drivers are shown above the table, but
within the table itself the ordering is arbitrary. Sorting by `typical`
descending mirrors what users care about.

### 🟡 City multiplier UI shows planning-disclaimer once per render
Each re-render appends a "City and state multipliers are planning
adjustments…" note. That's fine, but on a large viewport with the
breakdown expanded it pushes the breakdown table off-screen.
*Recommendation:* render the disclaimer once, inside a `<details>`
with a "What's a planning multiplier?" summary.

### 🟢 No print stylesheet
Users can "Print" the estimate (button is in `result-actions`) but
`site.css` has no `@media print` block. The header/footer/nav print
unnecessarily.

### 🟢 Trust-strip on homepage is a long single line
On narrow viewports it likely wraps oddly because each `<span>` has no
`word-spacing` or `gap`. Quick CSS pass.

---

## 5. SEO

### 🔴 `og:title` missing on 116/120 pages
Only 4 pages set `<meta property="og:title">`. Every other page falls
back to the URL as the OG title in social embeds. The 109 pages that
were updated by the legacy template build only set
`og:image`/`og:description`/`twitter:title`/`twitter:image` —
`og:title` was forgotten.

**Fix:** add `<meta property="og:title" content="$TITLE">` to every page
just below the existing `og:image` block. A `find . -name "*.html"
-exec sed -i …` one-liner can mirror the existing `<title>` tag value
into an `og:title` meta. 5 minutes.

### 🟠 `sitemap.xml` has no `<lastmod>` entries
Google's docs say `lastmod` is one of the more useful fields. None of
the 119 entries has one. *Recommendation:* add `<lastmod>2026-05-08</lastmod>`
(or per-file mtime) to every entry. The `scripts/replace-domain.js`
helper could be extended to refresh these.

### 🟠 `robots.txt` is bare
Missing `Disallow:` lines for the large PDF guides at the project root
(see §6) and missing `User-agent: *` separation if you ever want to
block specific bots later. Currently fine but minimal.

### 🟠 No `Article` schema on guide pages
26 of 39 guide pages emit `Article` schema; the remaining 13 don't.
Consistency matters — Google Search Console will flag inconsistent
markup.

### 🟡 `breeds/index.html` has no `<h1>`
The hub page is missing the H1. SEO and accessibility hit. Likely
because the file is **truncated** — see §8.

### 🟡 BreadcrumbList present on 112 of 120 pages
Eight pages missing it. Identify with
`grep -L '"@type": *"BreadcrumbList"' --include="*.html" -r .`.

### 🟡 Canonical absent on 1 page (`404.html`)
That's intentional / acceptable for a 404 page, but worth confirming.

### 🟢 OG image is a single static asset for the whole site
`https://yourpetbill.com/assets/og-image.png` is shared by every page.
Per-page OG images (e.g. with the breed's hero photo) would lift
social-share CTR. Low priority.

---

## 6. Repository hygiene / dead code / large assets

### 🔴 Six large PDFs sitting at the project root
They're being served at `/CFPGuide23-en.pdf`, `/Dog-Book.pdf`, etc.
Most of these are 3–8 MB; the "Essential cat and dog nutrition booklet"
is **44 MB**. Total: ~75 MB sitting in the deployed site root. They're
also presumably not yours — they're third-party PDFs (Baker Institute,
veterinary training manuals).

```
912K  BakerInstitute-CRPInfrographic-01102018_2.pdf
8.3M  CFPGuide23-en.pdf
6.2M  CLIENT-TRAINING-MANUAL.pdf
3.4M  CatOwnersHandbook2020-B.pdf
6.0M  Dog-Book.pdf
 44M  Essential cat and dog nutrition booklet V2 - electronic version.pdf
235K  Guide-to-introducing-your-cat-to-new-dog.pdf
130K  Introducing-Dogs-and-Cats-1.pdf
```

**Recommendation:** move these out of the repo (research-only material
should live elsewhere). If they're meant to be linked from the site,
move to `/assets/docs/` and add `Disallow: /assets/docs/` to robots if
they're internal-only. Better: drop them entirely and link to the
publishers' canonical URLs from `sources/`.

### 🟠 27 HTML files truncated mid-content
**This is pre-existing** (not caused by the refactor — index.html was
already 239 lines ending mid-paragraph at "They reflect current n").
Browsers render them anyway because HTML is forgiving, but pages will
be missing footer content, schema, sometimes major sections.

Affected files:
```
about/index.html
affiliate-disclosure/index.html
breeds/index.html                   ← hub
breeds/australian-shepherd-cost/index.html
breeds/bulldog-cost/index.html
breeds/chihuahua-cost/index.html
breeds/dachshund-cost/index.html
breeds/french-bulldog-cost/index.html
breeds/german-shepherd-cost/index.html
breeds/golden-retriever-cost/index.html
breeds/labrador-retriever-cost/index.html
breeds/maine-coon-cat-cost/index.html
breeds/pitbull-cost/index.html
breeds/poodle-cost/index.html
breeds/rottweiler-cost/index.html
guides/dog-dental-cleaning-cost/index.html
guides/index.html                   ← hub
pet-insurance-vs-savings/index.html
privacy/index.html
sources/index.html
states/arizona-pet-cost/index.html
states/georgia-pet-cost/index.html
states/illinois-pet-cost/index.html
states/index.html                   ← hub
states/north-carolina-pet-cost/index.html
states/pennsylvania-pet-cost/index.html
vet-costs/index.html                ← hub
```

`index.html` was the 28th — it's been reconstructed and rewritten as
part of this refactor.

**Reproduce:**
```bash
for f in $(find . -name "*.html"); do
  end=$(tr -d '\0' < "$f" | tail -c 30 | tr -d '\n')
  case "$end" in
    *'</html>'*) ;;
    *) echo "TRUNCATED: $f → ...$end" ;;
  esac
done
```

**Recommendation:** rerun whatever build/sync script wrote these files
or (if hand-edited) finish each file's footer + sitemap. `breeds/index.html`,
`states/index.html`, `guides/index.html`, `vet-costs/index.html`,
`sources/index.html`, and `about/index.html` are the most urgent —
they're hubs / SEO-critical.

### 🟠 93 HTML files have NUL-byte padding after `</html>`
Pre-existing. Browsers strip trailing nulls and render fine, but: (a)
network bytes wasted, (b) some static-site-generators / CDNs error on
non-UTF-8 bytes, (c) text-tooling and grep complain ("binary file
matches"). *Reproduce:* `grep -lrI --include="*.html" $'\x00' .` →
returns 119 files (93 trailing-null + 26 truncated-mid-with-nulls).
*Fix:* `for f in $(grep -lrI --include="*.html" $'\x00' .); do
  tr -d '\0' < "$f" > "$f.clean" && mv "$f.clean" "$f"; done`.

### 🟡 `assets/data/*.js` shims can be deleted post-deploy
After at least one deploy, the seven `assets/data/*.js` shim files (9
lines each, no data) can be removed and the corresponding `<script
src=…>` tags pruned from the 109 HTML pages. Quick sed.

### 🟡 `serve.bat` and `serve.ps1` both call `npx serve`
Now redundant with `local-server.js`. Either delete them or update them
to call `node local-server.js`. The `.bat` falls back to Python /PHP
which is reasonable cover for non-Node environments.

### 🟢 `scripts/fetch-breed-images.js` references `assets/data/breeds.js`
That file is now a shim. The script reads breed slugs by `eval`-ing
the legacy module. Switch it to read from
`assets/data/csv/breeds.csv` directly via the same parser.

---

## 7. Accessibility

### 🟠 Calculator chips are buttons but lack a visible focus ring (CSS to verify)
`calculator.js` outputs `<button class="chip" role="radio">` for each
size/stage/lifestyle option. Make sure `.chip:focus-visible` has an
outline rule in `site.css` (didn't read the CSS in detail). If absent,
keyboard-only users won't see which option they're on.

### 🟠 The hero "Calculate the real cost" H1 is fine, but every page's H1 should be unique
Run `grep -h '<h1' --include="*.html" -r . | sort | uniq -c` to verify
no duplicates across hub vs leaf pages.

### 🟡 Breed page hero `<figure>`/`<figcaption>` is good, but `<img loading=lazy decoding=async>` doesn't include `width`/`height` for some entries with `width: 0`
None of the current breed-images CSV rows have `width=0`, but if a row
ever does (or is left blank), `loading=lazy` plus a missing dimension
causes layout shift (CLS). Loader treats blank as `null`; `layout.js`
falls back to `1200`/`700`. Fine for now, just be aware.

### 🟡 `aria-live="polite"` on result panel is good, but the panel re-renders fully on every input change, which causes screen readers to re-announce the whole estimate
*Recommendation:* split aria-live into the headline (re-announce) and
the breakdown table (don't).

### 🟢 Skip-to-content link is present (good).

---

## 8. Bugs / dead code / broken artifacts

### 🔴 `package.json` was truncated on disk pre-refactor
Original ended at line 12 mid-string ("node scripts/r"). Node refused
to load a script directory because of the malformed JSON. **Fixed in
this refactor** — see CHANGES.md.

### 🔴 `assets/js/calculator.js` and `assets/js/layout.js` were truncated on disk pre-refactor
calculator.js was 82 lines (vs 671 intended); layout.js was 140 lines
(vs 230 intended). Both rewritten with full content + the new async
data-load wait.

### 🟠 27 HTML files truncated mid-content (see §6).

### 🟡 `serve-legacy` script in `package.json` runs `npx --yes serve -l 8080 .`
That fetches and runs an arbitrary version of `serve` from npm on
every dev start. Not malicious, but means each dev session pulls
several MB. With `local-server.js` now first-class, the legacy script
exists only for fallback — keep or remove.

### 🟢 `assets/og-image.svg` and `og-image.png` both ship — make sure CDNs serve PNG (some social sites don't render SVG OG).
Already configured as PNG in meta tags. SVG is unused in OG.

---

## 9. Per-page SEO meta-spotchecks

| page | title | desc | canonical | og:image | og:title | issue |
|---|:-:|:-:|:-:|:-:|:-:|---|
| `/` | ✅ | ✅ | ✅ | ✅ | ✅ | clean |
| `/dog-cost-calculator/` | ✅ | ✅ | ✅ | ✅ | ❌ | add og:title |
| `/breeds/` | ✅ | ✅ | ✅ | ✅ | ❌ | **truncated, no h1, og:title missing** |
| `/states/` | ✅ | ✅ | ✅ | ✅ | ❌ | **truncated, og:title missing** |
| `/guides/` | ✅ | ✅ | ✅ | ✅ | ❌ | **truncated** |
| `/vet-costs/` | ✅ | ✅ | ✅ | ✅ | ❌ | **truncated, hub-with-no-children** |
| `/sources/` | ✅ | ✅ | ✅ | ✅ | ❌ | **truncated** |
| `/about/` | ✅ | ✅ | ✅ | ✅ | ❌ | **truncated**, references old `/assets/data/*.js` editing flow (now CSVs) |

`about/index.html` mentions "The dataset lives in `/assets/data/*.js`."
That copy is now stale — update to `/assets/data/csv/*.csv`.

---

## 10. Verify-everything-still-works (post-refactor)

### Build
No build step. `npm run build` echoes "No build step. Fully static."
✅ Pass.

### Tests
```
node tests/calculator.test.js
```
Result: **21 passed, 0 failed**. ✅

Coverage:
- engine surface (`computePet` exists, `PETCOST_DATA` populated)
- 38 breeds loaded (from CSV)
- 20 cities loaded (from CSV)
- 13 emergency scenarios loaded (from CSV)
- insurance compat shape preserved
- lifestyle ordering: basic ($1,390) < standard ($2,101) < premium
  ($3,388); premium > 1.4× basic
- Medium adult TX standard monthly $175 in [100, 300]
- Medium adult TX standard annual $2,101 in [1,200, 4,000]
- Giant senior NY premium > 2× medium adult standard
- Cat adult CA indoor monthly $131 in [60, 200]
- Puppy/senior `routine_vet` > adult by ≥ 1.3×
- Frenchie healthRisk > generic small; Bulldog (1.70) > Frenchie (1.55)
- Manhattan (city multiplier 1.45) > TX by ≥ 1.15×
- Insurance:yes > insurance:no
- Lifetime $26,547 in [10k, 60k]; lifetime > 5× annual

### Local server smoke test
```
node local-server.js &
curl http://localhost:4173/                              # 200, 15551 bytes
curl http://localhost:4173/dog-cost-calculator/          # 200, 11373 bytes
curl http://localhost:4173/cat-cost-calculator/          # 200,  9790 bytes
curl http://localhost:4173/vet-bill-calculator/          # 200,  8704 bytes
curl http://localhost:4173/emergency-vet-cost-calculator/# 200,  8850 bytes
curl http://localhost:4173/pet-insurance-vs-savings/     # 200,  9027 bytes
curl http://localhost:4173/breeds/                       # 200,  7168 bytes
curl http://localhost:4173/breeds/labrador-retriever-cost/# 200,  7659 bytes
curl http://localhost:4173/states/                       # 200,  6458 bytes
curl http://localhost:4173/states/california-pet-cost/   # 200,  5649 bytes
curl http://localhost:4173/guides/                       # 200, 10794 bytes
curl http://localhost:4173/guides/puppy-first-year-cost/ # 200,  8162 bytes
curl http://localhost:4173/vet-costs/                    # 200,  7531 bytes
curl http://localhost:4173/about/                        # 200,  5368 bytes
curl http://localhost:4173/sources/                      # 200,  3824 bytes
curl http://localhost:4173/404.html                      # 200,  2698 bytes
curl http://localhost:4173/nonexistent-thing/            # 404
```

CSVs:
```
curl http://localhost:4173/assets/data/csv/base-costs.csv             # 200, text/csv
curl http://localhost:4173/assets/data/csv/breeds.csv                 # 200
curl http://localhost:4173/assets/data/csv/state-multipliers.csv      # 200
... (all 17 → 200)
```
✅ Pass.

### Browser-side mount
Did not exercise a real browser in this audit pass; the engine is fully
exercised by the Node test (which loads the same CSV files via the same
parser). The DOM mount path is unchanged from before the refactor —
only its trigger is now `PETCOST_DATA.ready().then(doMount)`.

**One remaining risk:** the loading state (§4 first item). Until the
skeleton is added, on a slow 3G first-load users see a blank
calculator container for ~300 ms. Worth fixing before launch but not
blocking.

---

## Prioritized punch list

### 🔴 Must-fix before next deploy

1. **Reconstruct or finish 27 truncated HTML files** (§6, §8). Hubs
   first: `breeds/`, `states/`, `guides/`, `vet-costs/`, `sources/`,
   `about/`. Then leaf breed/state/guide pages.
2. **Decide /vet-costs/ vs /guides/ IA** (§2). Currently the hub
   exists but has no children — homepage points at it, page itself
   is truncated. Either populate `/vet-costs/<proc>/` or redirect to
   `/guides/`.
3. **Move large PDFs out of the repo root** (§6). 75 MB of third-party
   PDFs being deployed.
4. **Calculator loading skeleton** (§4). Without it, browsers show an
   empty `[data-calculator]` div for 100–300 ms on cold cache.

### 🟠 High — fix this week

5. **Add `og:title` to all 116 missing pages** (§5). One-line sed
   based on the existing `<title>`.
6. **Add `<lastmod>` to `sitemap.xml`** (§5).
7. **Article schema on guide pages** — add to the 13 missing (§5).
8. **Source-link FAQ answers** that quote dollar numbers (§3).
9. **Update `about/index.html` cost-data instructions** to say CSV,
   not `/assets/data/*.js` (§9).
10. **Strip NUL-byte padding** from 93 HTML files (§6).
11. **Calculator failure UX**: show a "data load failed" notice if
    `PETCOST_DATA.ready()` rejects (§4).

### 🟡 Medium — soon

12. **Sort the breakdown table by `typical` desc** (§4).
13. **Add `puppy-cost-calculator` and `kitten-cost-calculator` landing
    pages** (§2).
14. **Add senior-cat / heartworm / flea-tick guide pages** (§2).
15. **Add reviewer credential or explicit "no clinical review" note**
    on every page (§3).
16. **`scripts/fetch-breed-images.js` should read from
    `assets/data/csv/breeds.csv`**, not the shim'd `breeds.js` (§6).
17. **Verify `.chip:focus-visible` outline in CSS** (§7).
18. **Print stylesheet** (§4).

### 🟢 Low / nice-to-have

19. Add American Shorthair, Vizsla, etc. breeds (§2).
20. Per-page OG images (§5).
21. Delete `serve.bat` / `serve.ps1` or repoint to `local-server.js`
    (§6).
22. Drop the `assets/data/*.js` shim files (§6) after the next deploy.
23. Add `Cornell Feline Health Center` and `OFA` source links inline
    on breed pages with disease claims (§3).
