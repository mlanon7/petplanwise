# Prompt: Turn a GSC export into a content plan

Use this when a fresh Google Search Console export lands (Performance → Queries/Pages → Export). Produces a prioritized, data-driven content plan — the method behind `docs/CONTENT-PLAN.md`.

---

## The brief

```
You are analyzing a Google Search Console export for petplanwise.com, a young
(weeks-old) pet-cost site. Output a prioritized content plan, not a data dump.

Input: <path to the GSC CSV(s)> (queries + pages + positions + impressions/clicks)

Do this:

1. CLEAN. Drop bot/operator noise (queries with after:, site:, -site:, raw
   operators) and brand-collision noise (the established "Petplan" insurance
   company — searches for "petplan" leak in with wrong intent; don't optimize
   for them).

2. CLUSTER by intent:
   - Vet condition/procedure cost (ear infection, x-ray, bloodwork, sedation,
     surgery, etc.)
   - Breed price / cost (per breed)
   - Pet insurance (commercial intent)
   - Cost of ownership (broad)
   For each cluster: query count, total impressions, best/median position.

3. FIND THE PATTERN. The governing rule for a young domain: the MORE SPECIFIC
   the query, the BETTER it ranks. Identify clusters where we already rank
   page 1-2 (positions <=20) — those are the wins to lock in. Broad head terms
   ranking 70-99 are too competitive yet; note but don't invest.

4. GAP CHECK. Cross-reference winning clusters against existing pages
   (ls guides/, ls breeds/). Flag queries with impressions but no dedicated
   page = build targets. Flag thin pages ranking 5-40 = strengthen targets
   (use prompts/content-strengthen.md).

5. NOTE GEO INTENT. "in <state>", "near me", "at banfield/petsmart" recurring
   across procedures = a signal for state-page differentiation (a structural
   play), not individual pages.

6. PRIORITIZE into tiers:
   - Tier 1: easy wins (a sibling page already ranks; near-duplicate template)
   - Tier 2: high-intent condition costs (best insurance-affiliate fit)
   - Tier 3: specific procedures/surgeries (specific = winnable)
   - Defer: broad/competitive head terms; reputationally fraught topics

Output: a tiered target list with the query evidence (position + impressions)
per target, a one-line rationale each, and a recommended next batch of ~5.
Append to docs/CONTENT-PLAN.md with the export date.
```

---

## How to use

- Run on each new export (~every 2 weeks). Let real data re-steer; don't write pages on spec.
- Pair the output with `/keyword-research` (free autocomplete) to expand a winning cluster's long tail before building.
- Then execute with `/add-guide` (Tier 1-3) and `/add-breed` (breed-price gaps).
- **Honest gate:** if a cluster has no impressions and no autocomplete demand, don't build it — for a young domain, validated demand beats volume of pages.
