# CSV data files

Every numeric data table the calculators use lives here as plain CSV. These
are the **sole source of truth** for cost ranges, multipliers, breed profiles,
procedure prices, insurance assumptions, and image attribution. Edit them in
a spreadsheet (Excel, Numbers, Google Sheets), commit, refresh — no rebuild.

Why CSV
- One row = one record. No JS syntax to learn.
- Round-trips cleanly to Google Sheets for non-engineer collaborators.
- Diff-friendly in git.

How they are loaded
- The runtime fetches each CSV via `fetch()` from `/assets/data/csv/`.
- A tiny zero-dependency parser in `assets/data/_loader.js` turns rows into
  the in-memory shape the calculator engine expects (under `window.PETCOST_DATA`).
- The Node tests load each CSV with a `fs`-backed `fetch` stub — same parser,
  same shape, same rows.

Numeric coercion
- All numeric columns (`low`, `typical`, `high`, `multiplier`, `width`,
  `height`, etc.) are coerced to numbers. Empty cells become `null`.
- Decimal multipliers (e.g. `1.10`, `0.92`) preserve precision.

If you add a NEW row, you may need to do nothing else (most loaders are
schema-agnostic). If you add a NEW table, add a small adapter block in
`assets/data/_loader.js` that maps rows into the right slot on
`window.PETCOST_DATA`.

---

## Files

### `base-costs.csv`
Annual cost range per category, per species. Consumed by the dog/cat cost
calculators and propagated through size/age/state/lifestyle/breed multipliers.

| column | meaning | unit |
|---|---|---|
| species | `dog` or `cat` | — |
| category | line-item key (`food`, `grooming`, …) — see `humanCat()` in `assets/js/calculator.js` for human labels | — |
| low | low-end annual cost | USD |
| typical | typical annual cost | USD |
| high | high-end annual cost | USD |

Consumed by: `assets/data/_loader.js` → `window.PETCOST_DATA.baseCosts`

### `first-year-one-time.csv`
One-time year-one costs (adoption, spay/neuter, starter kit, microchip, etc.).
Same shape as `base-costs.csv`. Consumed by: `_loader.js` →
`window.PETCOST_DATA.firstYearOneTime`.

### `life-expectancy.csv`
Years of life used to project lifetime cost.

| column | meaning |
|---|---|
| species | `dog` or `cat` |
| group | size bucket (`toy`, `small`, …) for dogs, environment (`indoor`, `outdoor`) for cats |
| years | average years of life |

Consumed by: `_loader.js` → `window.PETCOST_DATA.lifeExpectancy`

### `emergency-fund.csv`
Suggested emergency-fund targets per species.

| column | meaning | unit |
|---|---|---|
| species | `dog` or `cat` | — |
| low / typical / high | emergency-fund target | USD |

Consumed by: `_loader.js` → `window.PETCOST_DATA.emergencyFund`

### `size-multipliers.csv`
Dog-size multiplier applied to size-sensitive categories.

| column | meaning |
|---|---|
| size | `toy` / `small` / `medium` / `large` / `giant` |
| multiplier | scalar factor (1.00 = neutral) |
| note | weight band (informational) |

Consumed by: `_loader.js` → `window.PETCOST_DATA.sizeMultipliers`

### `age-multipliers.csv`
Per-species, per-stage, per-category multiplier. Use `default` as the
category when the multiplier should apply to every category not otherwise
named. Stages: `puppy`/`kitten`, `adult`, `senior`.

Consumed by: `_loader.js` → `window.PETCOST_DATA.ageMultipliers`

### `lifestyle-multipliers.csv`
Per-lifestyle, per-category multiplier. Lifestyles: `basic`, `standard`,
`premium`. Use `default` to apply across all categories.

Consumed by: `_loader.js` → `window.PETCOST_DATA.lifestyleMultipliers`

### `state-multipliers.csv`
Cost-of-living proxy by U.S. state (and DC).

| column | meaning |
|---|---|
| state | 2-letter postal code |
| multiplier | scalar (1.00 = U.S. median) |

Consumed by: `_loader.js` → `window.PETCOST_DATA.stateMultipliers`

### `state-adjusted-categories.csv`
Whitelist of categories that are state-adjusted (others are mostly retail
SKUs that don't vary regionally).

Consumed by: `_loader.js` → `window.PETCOST_DATA.stateAdjusted` (a `Set`)

### `city-multipliers.csv`
Metro-level override that supersedes the state multiplier when chosen.

| column | meaning |
|---|---|
| slug | url-safe id (`new-york-ny`) |
| name | display name |
| state | 2-letter state code |
| multiplier | scalar |

Consumed by: `_loader.js` → `window.PETCOST_DATA.cityMultipliers`

### `breeds.csv`
Per-breed profile used to prefill calculators on `/breeds/<slug>/` pages.

| column | meaning |
|---|---|
| slug | url-safe id |
| species | `dog` or `cat` |
| name | display name |
| size | one of the five size buckets (dogs only — cats use `medium`/`large`) |
| grooming | grooming multiplier |
| health_risk | applied to vet/insurance/dental/preventatives |
| purchase_low / purchase_typical / purchase_high | breeder/adoption purchase price (USD) |
| avg_life | average lifespan in years |
| notes | freeform editorial paragraph |

Consumed by: `_loader.js` → `window.PETCOST_DATA.breeds`

### `procedures.csv`
Per-procedure cost ranges, used by the vet bill and emergency vet
calculators.

| column | meaning |
|---|---|
| key | id used by the engine (`spay_neuter`, `bloat_gdv`, …) |
| name | display label |
| low / typical / high | USD |
| species | `any` / `dog` / `cat` (filters which calculator surfaces it) |
| emergency_note | optional time-sensitive instruction shown in the emergency calculator |

Consumed by: `_loader.js` → `window.PETCOST_DATA.procedures`

### `emergency-keys.csv`
Subset of `procedures.csv` keys that the emergency-vet calculator surfaces.

Consumed by: `_loader.js` → `window.PETCOST_DATA.emergencyScenarios`

### `insurance-ranges.csv`
NAPHIA-baseline monthly premium ranges per species.

Consumed by: `_loader.js` → `window.PETCOST_DATA.insuranceRanges`

### `insurance-monthly-premium.csv`
Per-stage premium ranges used by the Insurance vs Savings calculator.

Consumed by: `_loader.js` →
`window.PETCOST_DATA.insurance.monthlyPremium[species][stage]`

### `insurance-defaults.csv`
Default deductible / reimbursement / annual limit assumed by the Insurance vs
Savings calculator.

Consumed by: `_loader.js` → `window.PETCOST_DATA.insurance.defaults`

### `breed-images.csv`
Image attribution and source URLs for each breed page hero. Updated by hand
or via `scripts/fetch-breed-images.js` / `scripts/fetch-images-wikipedia.js`.

Consumed by: `_loader.js` → `window.PETCOST_DATA.breedImages`
