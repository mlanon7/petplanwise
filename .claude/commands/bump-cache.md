# /bump-cache — Cache-bust after a CSS/JS change

The single most important operational procedure in this repo. Vercel caches `/assets/*` as `immutable, max-age=31536000`. Without a new filename + `?v=`, browsers and the CDN keep the old asset for **a year**. Run this after editing ANY file under `assets/css/` or `assets/js/`.

## Procedure

1. Open `scripts/bump-cache-bust.js`. Find the current version (e.g. `NEW_V = "20260516z"`).

2. Compute the next version. Format is `YYYYMMDD<letter>`. Increment the letter within a day (`z` → next day's `a`, or just roll the date). Update **all four places — they must agree:**
   - `OLD_V` → the current version
   - `NEW_V` → the next version
   - the **`RENAMES`** array (3 entries: `layout`, `calculator`, `csv-loader`)
   - the **`replacements`** array (4 entries: the `v=` swap + the 3 filename swaps)

3. Run it:
   ```bash
   node scripts/bump-cache-bust.js
   ```
   Expected output: 3 `Renamed:` lines + `Updated N of N HTML files` (N ≈ 328).

4. What it does automatically:
   - Renames `layout-<OLD>.js`, `calculator-<OLD>.js`, `csv-loader-<OLD>.js` → `<NEW>`.
   - Rewrites every `?v=<OLD>` → `?v=<NEW>` across all HTML.
   - Regex-sweeps any `hero.{jpg,svg,png,webp}?v=*` to `<NEW>` (so swapped photos bust CDN cache, including the JS-built URLs in `/compare/` and `/find-my-breed/`).

## Verify

```bash
node --check assets/js/layout-<NEW>.js        # syntax OK after rename
npm test                                       # if calculator/csv-loader changed
grep -rl "<OLD>" --include=*.html . | head     # should be EMPTY (no stale refs left)
```

## Common failure

**Only updating some of the four places.** If `OLD_V`/`NEW_V`/`RENAMES`/`replacements` disagree, you get half-renamed files and 404s on assets. All four must match. See `.claude/lessons/01-cache-bust-four-places.md`.

## Then ship

A cache-bust legitimately touches ~328 HTML files — this is the one case where `git add -A` is acceptable. Commit with a message noting the `<OLD> → <NEW>` bump, then push. Continue with `/ship` from step 5.
