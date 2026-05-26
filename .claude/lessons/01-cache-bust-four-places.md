# Lesson 01 — The cache-bust has four places, and they must all agree

**Date:** recurring since launch (commits `0654d222`, `29d2af0d`, the `y→z` bumps)
**Severity:** P1 — "my change didn't deploy" / stale assets served for up to a year

## The trap

There is no build, so there are no content hashes. Cache invalidation is manual: assets are renamed to `layout-YYYYMMDD<letter>.js` and referenced via `?v=<VERSION>`. Vercel serves `/assets/*` with `Cache-Control: immutable, max-age=31536000`. **If the filename/version doesn't change, the browser and CDN keep the old file for a year.** We shipped "fixes" that never appeared live, multiple times, because the bump was skipped or half-done.

## Why half-done happens

`scripts/bump-cache-bust.js` encodes the version in **four** places:
1. `OLD_V`
2. `NEW_V`
3. the `RENAMES` array (3 file renames)
4. the `replacements` array (the `v=` swap + 3 filename swaps)

Update three of four and you get half-renamed files → 404s on `layout-<new>.js` while HTML still points at `<old>`, or vice-versa.

## The fix

Edit all four to agree, run `node scripts/bump-cache-bust.js`, confirm: 3 `Renamed:` lines + `Updated N of N HTML files`, then `grep -rl "<OLD>" --include=*.html .` is empty.

## Detection rule

- After ANY edit under `assets/css/` or `assets/js/`, a cache bump is **mandatory** before push.
- If a deployed change isn't visible: `curl -sL https://petplanwise.com/ | grep -o 'layout-[a-z0-9]*\.js'` — if it shows the OLD version, the bump didn't happen or didn't deploy.
- HTML/CSV/content-only changes do **not** need a bump (HTML redeploys fresh).

## Forward-looking rule

Treat the bump as part of the edit, not a separate chore. The `/bump-cache` command exists so this is one step. The regex sweep inside the script also fixes `hero.*?v=` URLs (including the JS-built ones in `/compare/` and `/find-my-breed/`) — don't hand-edit those.
