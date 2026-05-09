# Post-Revision Audit - Pet Cost & Vet Bill Calculator

Date: May 8, 2026  
Folder audited: `D:\MY WEBSITES\pet costs\petcost-bill`  
Focus: what changed after the prior audit, what was broken, what I fixed in this pass, and what remains.

## 1. What Was Revised Since The Prior Audit

The latest site revision made several real structural changes:

- Converted numeric calculator data from hardcoded JS objects into CSV files under `assets/data/csv/`.
- Added `assets/data/csv-loader.js` as the runtime loader that rebuilds `window.PETCOST_DATA`.
- Replaced legacy data modules such as `base-costs.js`, `breeds.js`, `procedures.js`, and `breed-images.js` with no-op shims.
- Added `local-server.js` so the static site can load CSV files correctly through `http://127.0.0.1:4173/`.
- Updated many HTML pages to include `csv-loader.js`.
- Updated tests so they wait for `PETCOST_DATA.ready()`.
- Added an `audit/` folder with `AUDIT.md` and `CHANGES.md`.
- Expanded the homepage file size and some calculator pages.

The CSV refactor is a good long-term direction because it makes cost data easier to edit in spreadsheets. The issue is that some page and image references broke during the migration.

## 2. Issues Found In This Pass

### Fixed: Breed Image CSV Pointed To The Wrong Folder

Problem:

- `assets/data/csv/breed-images.csv` pointed image URLs to `/assets/images/breeds/{slug}/hero.jpg`.
- The actual images are stored at `/breeds/{slug}/hero.jpg`.
- Result: individual breed pages could not show JavaScript-injected breed photos.

Fix applied:

- Updated all breed image CSV paths to `/breeds/{slug}/hero.jpg`.

Verification:

- Local HTTP check confirms `/assets/data/csv/breed-images.csv` now includes `/breeds/labrador-retriever-cost/hero.jpg`.
- Local HTTP check confirms `/breeds/labrador-retriever-cost/hero.jpg` returns `200 image/jpeg`.
- Static file check confirms all 38 CSV image paths resolve to real local files.

### Fixed: `/breeds/` Hub Page Was Truncated

Problem:

- `breeds/index.html` ended mid-JSON-LD around `"@type":`.
- Because the file was incomplete, the Breeds page could render as empty/broken or fail to show the breed grid.

Fix applied:

- Rebuilt `breeds/index.html` as a complete page.
- Added 38 breed cards.
- Added visible breed photos.
- Added a stronger hub hero, metric panel, and insight strip.
- Added complete BreadcrumbList, CollectionPage, and ItemList JSON-LD.

Verification:

- `/breeds/` returns HTTP 200.
- File closes with `</html>`.
- JSON-LD parses.
- H1 count: 1.
- Breed cards: 38.
- Broken internal links: 0.

### Fixed: `/states/` Hub Page Was Truncated

Problem:

- `states/index.html` ended mid-sentence at `methodology audited qu`.
- The page body was incomplete, which explains the weak/empty top ribbon and missing state content.

Fix applied:

- Rebuilt `states/index.html` as a complete page.
- Added 25 state cards.
- Added a stronger visual hero panel with state guide count, highest/lowest-cost state callouts, and city multiplier note.
- Added a top insight strip for high-cost states.
- Added complete BreadcrumbList, CollectionPage, and ItemList JSON-LD.

Verification:

- `/states/` returns HTTP 200.
- File closes with `</html>`.
- JSON-LD parses.
- H1 count: 1.
- State cards: 25.
- Broken internal links: 0.

### Fixed: Missing CSS For New Hub Visuals

Problem:

- The revised hub pages needed modern visual styling for metric panels, state cards, and insight strips.

Fix applied:

- Added CSS for:
  - `.hub-hero`
  - `.hub-hero-grid`
  - `.hub-visual-panel`
  - `.hub-metric`
  - `.insight-strip`
  - `.breed-card-cost`
  - `.state-grid`
  - `.state-card`

## 3. Verification Results After Fixes

Local checks:

- `/breeds/`: HTTP 200, 38 breed cards.
- `/states/`: HTTP 200, 25 state cards.
- `/breeds/labrador-retriever-cost/`: HTTP 200.
- `/breeds/labrador-retriever-cost/hero.jpg`: HTTP 200 image.
- Breed image CSV paths: 0 bad local paths.
- JSON-LD parse errors: 0.
- Broken internal links found by static scan: 0.
- Calculator tests: 21 passed, 0 failed.

Important usage note:

- This site should be tested through `http://127.0.0.1:4173/`, not by opening `index.html` directly from the file system.
- Direct `file://` opening will break CSV loading and absolute paths like `/breeds/` and `/assets/`.

## 4. What Is Still Left To Do

### High Priority

1. Make individual breed images static, not only JavaScript-injected.
   - Current breed detail pages rely on `layout.js` and CSV data to inject the image above the calculator.
   - Better SEO/no-JS implementation: add static `<figure>` or `<picture>` markup directly to every `breeds/*/index.html`.

2. Compress breed images.
   - Several hero images are still too large.
   - Convert to WebP and use `<picture>`.
   - Target 80-180 KB for hero images and 20-50 KB for hub thumbnails.

3. Deepen thin pages.
   - Current post-fix scan still finds 36 important pages under 300 words.
   - Worst remaining examples:
     - `vet-costs/index.html` - 91 words.
     - `breeds/australian-shepherd-cost/index.html` - 121 words.
     - `breeds/pitbull-cost/index.html` - 131 words.
     - `breeds/rottweiler-cost/index.html` - 131 words.
     - several state pages under 160 words.

4. Add more visible FAQs.
   - Many breed/state/procedure pages still have 0-1 FAQ.
   - Target 4-6 FAQs per breed page, 5-7 per state page, and 5-8 per vet procedure page.

5. Strengthen `vet-costs/index.html`.
   - It is still only 91 words and should be one of the best pages on the site.
   - Add a full procedure table, emergency vs routine explanation, links to procedure guides, FAQ, and embedded vet bill calculator.

6. Add visual warmth beyond breed pages.
   - Homepage still has no strong real dog/cat visual.
   - Calculator pages and guide pages could use calm, non-graphic pet/vet images where useful.

### Medium Priority

7. Fix title length and OG consistency.
   - 28 titles are still over 60 characters.
   - 11 pages still lack OG image tags by static scan.

8. Improve accessibility in generated calculator controls.
   - JS-generated labels are not always programmatically associated with inputs.
   - Chip/radio groups need stronger keyboard support.

9. Add image credits page or image credits section.
   - Some images use CC BY or CC BY-SA and require attribution.
   - Keep the existing `credit.json` files, but expose credits visibly before launch.

10. Move or remove large root PDFs.
   - The site still has large PDFs in the root folder.
   - If they are source references, move them to an intentional `/assets/sources/` folder and link them from `/sources/`.

11. Update README and methodology after CSV migration.
   - Some older text still refers to editing `/assets/data/*.js` directly.
   - The real source of truth is now `/assets/data/csv/*.csv`.

12. Add browser screenshot QA.
   - Playwright was not installed locally in this project, so I could not run automated screenshots in this pass.
   - Manual browser check should confirm image crop, mobile layout, nav, and state/breed hub visuals.

## 5. Current Status

The major user-facing breakages reported here are fixed:

- Breed hub no longer has truncated markup.
- State hub no longer has truncated markup.
- Breed image data now points to real image files.
- Breeds and States pages now have visible cards and stronger top sections.

The site is still not publish-ready because thin content, image optimization, FAQ depth, and static image markup still need a second quality pass.

