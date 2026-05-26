# Lesson 05 — CSV as single source of truth

**Date:** architectural decision since launch (not a single commit)
**Severity:** N/A — design pattern, not a bug

## The decision

Every numeric input lives in `assets/data/csv/*.csv` (19 files): breed multipliers, base costs, procedure ranges, state/city adjustments, insurance premiums, lifespans, breed traits. Never duplicated in JS.

## Why this pattern

- **Versionable** — every number change is a `git diff` on a CSV.
- **Auditable** — cost rows carry `source_url` + `last_reviewed`; lineage is in the format.
- **Editable by non-engineers** — `npm run push`/`sync` round-trips the CSVs to Google Sheets (`docs/google-sheets-setup.md`), so a researcher edits a row in Sheets, no code review.
- **Testable** — `tests/calculator.test.js` reads CSVs via `fs.readFileSync`; the runtime reads the SAME files via `csv-loader-<V>.js`. Single source, validated two ways.

## What NOT to do

- ❌ Hard-code a cost in `calculator-<V>.js` or a page. If you're typing a number into JS/HTML, stop — it belongs in a CSV. (Exception: UI default attributes like `data-stage="adult"`.)
- ❌ A database or headless CMS — loses the git audit trail + Sheets ergonomics, adds a runtime dependency for a site that has none.
- ❌ Mixing sources — some costs in CSV, others in JS. The split decays and updates miss a location.

## Two real traps this pattern has

1. **Non-numeric values silently zero out.** `breed-traits.csv` had "under 30" / "over 15" strings; `parseFloat` → `NaN`/`0` → Beagle weight rendered as 0 (commit `aa549902`). Use real numbers or `low-high` ranges. `scripts/audit-breed-traits.js` catches outliers.
2. **NUL-byte corruption.** `breed-images.csv` once had NUL bytes from a bad write (commit `f1fb9a56`). Detect with a real byte scan in Node — **NOT** `grep $'\x00'` (bash can't hold NUL, so the pattern is empty and matches every line, giving a false count).

## Forward-looking rules

- New cost CSV → mandatory `source_url` + `last_reviewed` columns.
- Bump `last_reviewed` whenever you change a value.
- Quote any field containing a comma (the parser is hand-rolled).
- `npm test` after any CSV change — both readers must agree.
