# /add-breed — Add breed page(s)

Breed pages (`/breeds/<slug>-cost/`) are programmatic. Never hand-author more than one. Templates: `scripts/add-twelve-breeds.js`, `scripts/add-five-more-breeds.js`.

## 1. Add the data rows first (CSV-first)

A breed needs rows across several CSVs in `assets/data/csv/`:
- `breeds.csv` — name, species, size, grooming/health multipliers, purchase range (`purchase_low/typical/high`), lifespan, `source_url`, `last_reviewed`
- `breed-traits.csv` — weight, height, energy, alone-hours, kid/stranger friendliness, trainability, shedding, top facts (pipe-delimited), temperament scores
- `breed-images.csv` — hero src + alt + credit + license + dimensions

**Validate the trait numbers** — run `node scripts/audit-breed-traits.js`. Watch for non-numeric junk ("under 30", "over 15") that `parseFloat` turns into `0`/`NaN` (this caused the Beagle-weight-0 bug). Use ranges like `20-30`.

## 2. Slug convention

Most breeds: `<slug>-cost/`. The **8 legacy cats** (bengal, british-shorthair, maine-coon, persian, ragdoll, scottish-fold, siamese, sphynx) use `<slug>-cat-cost/`. New cats use plain `<slug>-cost/`. If you add a cat, update the `CAT_LEGACY`/`CAT_SLUGS` maps in `scripts/`, `/compare/index.html`, and `/find-my-breed/index.html`.

## 3. Hero photo — write BOTH files

Source a real close-up, front-facing photo (Pexels/Unsplash/Pixabay). Write **both** `hero.jpg` AND `hero-original.jpg` (plus `hero.webp` + `credit.json`). The optimize script re-encodes `hero.jpg` from `hero-original.jpg`, so a swap that skips `hero-original.jpg` silently reverts. See `.claude/lessons/02-hero-original-revert-trap.md`. Then `node scripts/optimize-breed-heroes.js`.

## 4. Generate the page(s)

Adapt a generator script (don't hand-write). It should emit the full breed-page structure: head + JSON-LD (BreadcrumbList + FAQPage) · hero `<picture>` (WebP + JPG) · breed-snapshot (1-sentence intro + trait chips incl. the `💵 Price` chip) · calculator widget · cost summary + source notes · cost drivers · insurance · ways to save · affiliate disclosure · FAQ (mirrored in JSON-LD) · reviewer · sources · compare CTA · full traits card.

## 5. Register + verify + ship

- Insert into the breeds hub grid (`breeds/index.html`) — use a careful insert script; the hub splice has bitten us on CRLF (`\n` vs `\r\n`) before, causing triplication. Verify the hub renders once.
- Add URLs to `sitemap-breeds.xml` (+ breed-state if you generated those) and bump the index `lastmod`.
- If you added breed-STATE pages, that's `<slug>-cost-in-<state>/` × the state set.
- **No cache bump** unless you touched CSS/JS.
- `npm test` (breed multipliers feed the calculator), then `/ship`.

## Honest gate

Per CLAUDE.md, don't add breeds without GSC demand. "More breeds" is a standing anti-pattern for a young domain — validate first.
