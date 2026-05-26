# /refresh-sources — Periodic source review

Cost claims are YMYL-adjacent. Sources drift; a stale number is a trust bug. Run this quarterly (and any time a guide on a finance/premium figure gets traffic).

## Priority order (by drift risk)

1. **CareCredit APR** — `guides/pet-insurance-vs-carecredit/`. Changes without notice; we shipped a stale 26.99% when the real figure was 32.99%. **Web-verify against https://www.carecredit.com/faqs/ every review.** Any page asserting an APR must show a "checked YYYY-MM" date. See `.claude/lessons/10-finance-figures-go-stale.md`.
2. **NAPHIA State of the Industry** — `insurance-monthly-premium.csv`. New SOI annually; update average dog/cat premiums.
3. **BLS CPI veterinary services** — the inflation signal cited in `/guides/why-are-vet-bills-so-expensive-in-2026/`. Trend, not level — confirm the direction still holds.
4. **AAHA / AAFP** — vaccine schedules + life-stage bloodwork cadence cited in vaccine/bloodwork guides.
5. **AVDC / AVMA / Banfield** — procedure ranges in `procedures.csv`.

## Procedure

1. List rows whose `last_reviewed` is older than ~6 months:
   ```bash
   node -e 'const fs=require("fs");for(const f of fs.readdirSync("assets/data/csv")){const t=fs.readFileSync("assets/data/csv/"+f,"utf8");if(/last_reviewed/.test(t)){const old=t.split(/\r?\n/).filter(l=>/202[0-5]-/.test(l)).length;if(old)console.log(f,"has",old,"rows dated 2020-2025")}}'
   ```
2. For each stale source, web-verify the current value (cite the URL).
3. Update the CSV value + `source_url` + `last_reviewed` (use `/update-data`).
4. For finance figures in HTML (APR), update the number AND the "checked" date in body copy.
5. `npm test`, then `/ship`.

## Output

A short note of what changed: source, old value → new value, date checked, URL. Append to `audit/CHANGES.md`.
