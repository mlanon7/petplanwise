# Lesson 02 — Hero swaps revert unless you write `hero-original.jpg` too

**Date:** commits `e3f6724d`, `336d48c0`, `eca77ea8` ("...heroes again")
**Severity:** P1 — a fixed photo silently reverts on the next optimize run

## What happened

We swapped bad breed hero photos (watermarked Boston Terrier, far-away Newfoundland, too-close Corgi), shipped them, and then they **came back as the original faulty photos** after a later deploy. The "...again" in several commit subjects is the scar tissue.

## Root cause

`scripts/optimize-breed-heroes.js` treats **`hero-original.jpg` as the source of truth.** It re-encodes `hero.jpg` (and `hero.webp`) FROM `hero-original.jpg`. If you replace `hero.jpg` but leave the old `hero-original.jpg` in place, the next optimize run regenerates `hero.jpg` from the stale original — reverting your swap.

## The fix

When swapping a hero photo, **overwrite BOTH `hero.jpg` AND `hero-original.jpg`** (and `hero.webp` + `credit.json`). Reference pattern: `scripts/swap-corgi-boston-heroes.js`. Then run `node scripts/optimize-breed-heroes.js` to produce consistent optimized variants.

## Secondary trap (CDN cache)

Even with both files written, the photo is `hero.jpg?v=<VERSION>` behind Vercel's 1-year immutable cache. The `bump-cache-bust.js` regex sweep force-updates `hero.*?v=` to the new version — so a cache bump is what actually flushes the old photo from the CDN. `/compare/` and `/find-my-breed/` build these URLs in JS; the sweep covers them too.

## Detection rule

After a hero swap: confirm both `hero.jpg` and `hero-original.jpg` changed (`git status` shows both), then bump cache. If a swapped photo reappears, you skipped `hero-original.jpg`.

## Forward-looking rule

Any breed-image script must write the original alongside the optimized file. Never edit `hero.jpg` alone.
