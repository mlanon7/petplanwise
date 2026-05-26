# Lesson 10 — Finance figures go stale; date them and re-verify

**Date:** 2026-05-21 (commit `3a5b6b15`)
**Severity:** P0 — a wrong APR on a finance page is a trust/YMYL problem

## What happened

`/guides/pet-insurance-vs-carecredit/` stated CareCredit's post-promotional APR was "around 26.99% (verified May 2026)." CareCredit's actual FAQ said **32.99% for new accounts (as of 5/30/24).** The number was both wrong and confidently dated — worse than no number.

## Why it matters more than a normal cost

This is finance-adjacent (YMYL). A stale, specific percentage erodes trust and can mislead a purchase decision. Cost *ranges* ("$300–$800") age gracefully; a single hard APR/premium does not.

## The fix

- Updated to 32.99% with an explicit citation: "per CareCredit's FAQ (as of 5/30/24, checked May 2026)."
- Rule going forward: any page asserting a hard APR/premium/credit figure must show a **"checked YYYY-MM"** date next to it, and the source must be re-verified on a cadence.

## The drift-risk sources (re-check on the `/refresh-sources` cadence)

| Source | Figure | Risk |
|---|---|---|
| CareCredit FAQ | financing APR | changes without notice — **highest risk** |
| NAPHIA SOI | avg dog/cat premium | annual |
| BLS CPI vet services | inflation trend | monthly (trend, not level) |

## Detection rule

Grep for hard finance figures and confirm each has a recent "checked" date:
```bash
grep -rnoE "[0-9]+\.[0-9]+%|\$[0-9]+(\.[0-9]+)?/(mo|month|yr|year)" guides/ | head
```
If a percentage/premium has no nearby review date, it's a latent trust bug.

## Forward-looking rule

Prefer ranges over single hard numbers where honest. When a single figure is necessary (APR), date it and add the row to the `/refresh-sources` review list. Don't hardcode an exact APR in a meta description (it's invisible to update and ages badly).
