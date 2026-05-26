# /update-data — Change a cost / multiplier / premium

All numbers live in `assets/data/csv/*.csv`. Never hard-code a cost in JS. Procedure:

## 1. Edit the CSV row

Find the right file:

| Change | File |
|---|---|
| Per-breed multiplier / purchase range / lifespan | `breeds.csv` |
| Annual base cost per category | `base-costs.csv` |
| Procedure cost range | `procedures.csv` |
| State / city cost adjustment | `state-multipliers.csv` / `city-multipliers.csv` |
| Insurance premium | `insurance-monthly-premium.csv` |
| Default lifespan | `life-expectancy.csv` |
| Breed traits / quantified numbers | `breed-traits.csv` |

## 2. Bump `last_reviewed`, keep `source_url`

Every cost-bearing row has `source_url` + `last_reviewed`. When you change a value, set `last_reviewed` to today and confirm the `source_url` still supports the new number. Don't drop these columns.

## 3. Watch the parse traps

- Numeric columns must parse cleanly. Strings like "under 30" / "over 15" become `0`/`NaN` and render as 0 (the Beagle-weight bug). Use real numbers or `low-high` ranges.
- The CSV parser is hand-rolled in `csv-loader-<V>.js` and re-implemented in `tests/calculator.test.js`. Quote any field containing a comma.

## 4. Test — both readers must agree

```bash
npm test     # 23 assertions; the runtime and the tests read the SAME CSVs
```

The runtime reads via `csv-loader-<V>.js`; the tests via `fs.readFileSync`. If they diverge, you broke the format.

## 5. Cache-bust ONLY if the loader changed

Editing a `.csv` does **not** require a cache bump (CSVs aren't the versioned `?v=` asset — wait, they are loaded by the versioned `csv-loader`). The CSV files themselves are fetched by the loader at runtime; if the data isn't refreshing on the live site, it's the loader/CDN. Safest: if a data change isn't showing, bump cache (`/bump-cache`) so the `csv-loader-<V>.js` filename changes and re-fetches. For routine single-value edits that show in local dev, a bump is usually unnecessary — but verify on the live site.

## 6. Optional: round-trip via Google Sheets

For bulk edits by a non-engineer: `npm run push` (CSVs → Sheet), edit in Sheets, `npm run sync` (Sheet → CSVs). See `docs/google-sheets-setup.md`. Always `npm test` after a sync.

## 7. Ship

`/ship`. If you bumped cache, note the version in the commit.
