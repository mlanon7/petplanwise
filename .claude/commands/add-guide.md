# /add-guide — Add a condition / procedure cost guide

Cost guides (`/guides/<topic>-cost/`) are the highest-ROI content on the site. They rank because they're specific. Build them from a generator, not by hand, so they stay structurally uniform.

## Before writing — validate demand

Only build a guide a GSC query or autocomplete harvest says people search. Run `/keyword-research` and check `docs/CONTENT-PLAN.md`. The rule: **the more specific the query, the better a young domain ranks** ("dog ear infection cost" beats "vet cost").

## Research the numbers first

Web-verify a current 2026 US price range (low / typical / high) from 2-3 sources before writing. A guide with a made-up range is a trust bug. Capture the source URLs for the Sources block.

## Generate, don't hand-author

The canonical generator is `scripts/add-condition-guides.js`. To add guides, append a data object per guide to its `GUIDES` array:

```js
{
  slug:"dog-X-cost", crumb:"Dog X cost", eyebrow:"Guide · Treatment",
  title:"How Much Does Dog X Cost? (2026)",          // no & in titles (escaping headache); use "and"
  desc:"... <=160 chars, includes price range ...",
  h1:"How much does dog X cost?",
  lede:"... <strong>$low–$high</strong> ...",
  costRows:[["Component","$low","$typ","$high"], ...],
  costNote:"...",
  sections:[{h2:"...",html:"<ul>...</ul>"}, ...],
  insuranceIntro:"<p>... worked example ...</p>",
  insuranceRows:[["Scenario","$amount"], ...],
  insuranceNote:"<p>... "+CALC_CTA+"</p>",
  relatedHeading:"Related dog cost guides",
  related:[["/guides/...","Anchor","why"], ...],   // every target MUST exist
  faqs:[["Exact GSC question?","Answer."], ...],    // 5, mirrored in visible FAQ
  sources:[["https://...","Label"], ...]
}
```

Run `node scripts/add-condition-guides.js`. It writes the HTML, registers the guide in the hub (`guides/index.html` ItemList + card), and you then add it to `sitemap-guides.xml`.

## Mandatory structure (matches the ranking template)

Cost-component table · `data-calculator="vet-bill"` widget · condition sections · "Cost with vs. without insurance" worked example · "Related … guides" cross-links · 5-question **FAQ schema using exact query phrasings, mirrored in the visible FAQ** · reviewer block · Sources · last-updated stamp.

## Register + verify

1. Add the URL to `sitemap-guides.xml` (`<lastmod>` = today) and bump the `sitemap-guides.xml` `lastmod` in the `sitemap.xml` index.
2. Verify before shipping:
   - JSON-LD: 3 blocks parse (BreadcrumbList + FAQPage + Article).
   - visible-FAQ count == schema-FAQ count == 5.
   - every internal link resolves to a real file.
   - canonical matches the slug.
3. **No cache bump** — guides are HTML only.
4. Ship via `/ship`, then request indexing for the new URL in GSC.

## Honest gate

If GSC data doesn't show demand for the topic, push back. Adding pages before validating which ones rank is the standing anti-pattern (see CLAUDE.md "What NOT to add").
