# Prompt: Verify cost CSVs against current sources

Run periodically (quarterly, or when a finance/premium page gets traffic) to catch cost rows that have drifted from current industry data. The in-repo companion is `/refresh-sources`.

---

## The brief

```
You are verifying the numeric cost data on petplanwise.com against current
2026 U.S. sources. The data lives in assets/data/csv/*.csv. Goal: flag rows
whose values no longer match authoritative sources, with a citation for each.

For each file, spot-check the highest-traffic / highest-risk rows:

- insurance-monthly-premium.csv  → NAPHIA State of the Industry (latest).
  Confirm avg accident+illness premiums (dogs ~$60+/mo, cats ~$32+/mo as of
  the 2025 SOI; update if a newer SOI exists).
- procedures.csv                 → AVMA / AVDC / Banfield / vet-cost aggregators
  (vetcostcalc, vety). Confirm spay/neuter, dental, x-ray, bloodwork ranges.
- base-costs.csv                 → AVMA pet-ownership spend, APPA, Rover/Synchrony
  lifetime-cost studies. Confirm food/vet/grooming/preventive annual ranges.
- state-multipliers.csv / city-multipliers.csv → BLS regional cost-of-living /
  vet CPI. Confirm the relative ordering still holds (Manhattan > TX etc.).
- breeds.csv (purchase ranges)   → breeder/adoption market data per breed.

Also check finance figures in HTML (not CSV):
- guides/pet-insurance-vs-carecredit/ APR vs https://www.carecredit.com/faqs/
  (this drifts without notice — it was wrong once).

For each finding output: file, row/identifier, current value, source-supported
value, the source URL, and a confidence/severity (P0 ships a wrong number that
users act on; P1 materially off; P2 within ~10%; P3 fine).

Do NOT edit files — this is a verification pass. Output a punch list the
maintainer can apply via /update-data (which bumps last_reviewed per row).
```

---

## How to use

- **Verification only** — this prompt reports; apply fixes with `/update-data` so each changed row gets a fresh `last_reviewed`.
- Prioritize rows powering pages that get GSC impressions (financing, ear infection, breed price, vet procedures).
- After applying, `npm test` (the runtime and tests read the same CSVs) and `/ship`.
- **Sibling niches:** swap the source canon — for parentcarecost use Genworth/CareScout Cost of Care, KFF, SSA; for firstyearcost use USDA child-cost reports, BLS CEX, childcare market surveys.
