# Lesson 04 — Lifetime cost is phase-weighted, not stage-multiplied

**Date:** commit `8f1ec189` (P0 audit fix: lifetime math)
**Severity:** P0 — overstated lifetime cost by thousands for senior selections

## The bug

The original engine computed `lifetime = annual × averageLifespan + oneTime`, where `annual` was the cost for the **currently selected** life stage. So selecting **senior** projected senior-level annual costs across the dog/cat's **entire** average lifespan — e.g. a senior cat showing a ~$50K lifetime, a senior dog ~$30K, because the most expensive stage was multiplied across all 12–15 years. The label "Lifetime" implies the pet's whole life, so this materially misled users. (Flagged in both the GPT and Codex audits.)

## The fix

Lifetime is now **phase-weighted**: annual cost is computed separately for the puppy/kitten, adult, and senior phases and summed:

```
lifetime ≈ puppyAnnual × puppyYears
         + adultAnnual × adultYears
         + seniorAnnual × seniorYears
         + oneTimeCosts
```

Selecting a stage changes the *displayed annual* for that stage but does NOT change the lifetime projection (lifetime always spans all phases). This is the single biggest accuracy win in the engine.

## Regression guard

`tests/calculator.test.js` asserts a senior selection's lifetime stays within a sane band (not the old `annual × fullLifespan` inflation) — e.g. "senior lifetime within ~15% of adult lifetime" and "giant senior Manhattan lifetime in [30000,120000], not the old 74K–213K." **Do not weaken these tests.**

## Detection rule

If a calculator change makes a senior selection's lifetime jump toward `seniorAnnual × fullLifespan`, you regressed phase-weighting. The test catches it — run `npm test`.

## Forward-looking rule

Any new calculator (or a clone for a sibling site) must compute lifetime by summing life-stage phases, never by multiplying one stage across the full span. When porting to firstyearcost/parentcarecost, the same principle applies (cost varies by phase: infant vs toddler; independent vs assisted vs memory-care).
