# Prompt: Strengthen a thin cost guide into a ranking one

Use this when a guide already gets impressions (GSC position ~5–40) but is thin. This is the exact pass that lifted the dog-ear-infection, cat-x-ray, and cat-bloodwork guides. Run it in-session or paste into any assistant.

---

## The brief

```
You are strengthening ONE existing cost guide on petplanwise.com so it ranks
for the exact queries it already shows impressions for. Keep the site's voice:
plain English, direct, no AI-slop, source-cited, planning-ranges-not-quotes.

Target page: /guides/<slug>/
GSC queries it should own (from the export): <paste the cluster + positions>

Do all of the following, preserving the existing template structure:

1. TITLE: retitle to the leading query intent + freshness, e.g.
   "How Much Does <X> Cost? (2026)". Sync og:title + twitter:title.
   Keep it <=65 RENDERED chars (note &amp; counts as 1 when rendered).

2. META DESCRIPTION: rewrite to <=160 chars, include the price range and the
   "with vs without insurance" angle. Sync og:description.

3. FAQ SCHEMA: expand to 5 questions using the EXACT phrasings from the GSC
   cluster (how much / without insurance / how often / why ER more / etc.).
   Mirror all 5 in the visible <details> FAQ. The schema count and visible
   count MUST match.

4. WORKED INSURANCE EXAMPLE: add a "Cost with vs. without insurance" section
   with a small table: full bill vs. 80%-reimbursed-after-deductible vs. an
   edge case. Link to /pet-insurance-vs-savings/ and /vet-bill-calculator/.

5. CROSS-LINKS: add a "Related <species> cost guides" list (3-4 links). Every
   target MUST exist on disk — verify before linking.

6. LEDE: enrich the opening paragraph with the bolded low/typical/high range.

7. FRESHNESS: set Article dateModified to today; bump the sitemap-guides.xml
   lastmod for this URL + the index lastmod.

Verify before finishing: 3 JSON-LD blocks parse; visible-FAQ == schema-FAQ == 5;
all internal links resolve; canonical matches the slug. No cache bump (HTML only).
Output the diff and the verification results.
```

---

## How to use

- **In Claude Code:** paste, fill `<slug>` and the GSC cluster, let it edit the file, then `/ship`.
- **Numbers:** if you change any dollar figure, web-verify it first (2026 US). A made-up range is a trust bug.
- **Batch carefully:** strengthen 1-2 related guides at a time, commit together, request indexing. Don't rewrite the whole library at once — let GSC confirm the lift before scaling.
- **Sibling niches:** swap the insurance angle for the niche's equivalent decision (e.g. for parentcarecost: "cost with vs. without long-term-care insurance / Medicaid").
