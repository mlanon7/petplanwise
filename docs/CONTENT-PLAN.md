# PetPlanWise — Vet-Cost Content Plan (data-driven from GSC)

Generated from the first 28-day Google Search Console export
(`search-google-performance/search-google-05202026.csv`), day 8-9 of the
site being live. This is the prioritized next-content sprint.

---

## Progress (updated 2026-05-20)

- ✅ **P1 — Dog ear infection** — guide existed; strengthened (FAQ 2→5, insurance
  worked example, drop-ear-breed cross-links, dateModified bumped).
- ✅ **P2 — Cat X-ray** — strengthened (title, FAQ 1→5, insurance table, related
  cat-cost cross-links).
- ✅ **P3 — Cat bloodwork** — strengthened (title, FAQ 1→5, insurance table,
  "how often", related cross-links).
- ✅ **P4 — Sedation & anesthesia** — NEW guides shipped:
  `/guides/dog-sedation-anesthesia-cost/` + `/guides/cat-sedation-cost/`.
- ✅ **P5 — Vet visit without insurance** — NEW guide shipped:
  `/guides/vet-visit-cost-without-insurance/`. CTA points to the internal
  insurance-vs-savings calculator; swap in a real affiliate link once a
  program is approved.
- ⏳ **P6 — Geographic** — DEFERRED. Blocked on the state-page differentiation
  work (see GPT audit). Do P6 as part of that redesign, not standalone.

**Next data checkpoint:** re-pull GSC ~2026-06-03 (two weeks out) and
re-prioritize before writing more. Let the new guides start indexing first.

---

## The core finding

GSC shows **vet condition-cost queries are the biggest cluster AND already
rank well** — better than breed prices. Specific, low-competition condition
queries (ear infection, x-ray, bloodwork) rank page 1; broad competitive ones
(surgery, anesthesia) rank page 4-9. The play: build dedicated guides that own
the *specific* condition-cost queries we already rank for, then internally
link them to the insurance/savings calculator (these searchers are facing a
real bill = peak insurance intent).

**Pattern to exploit:** the more specific the query, the better we rank.
"how much does it cost to treat an ear infection in a dog" = position 4.
"pet surgery cost" = position 97. Go specific.

---

## Priority 1 — Ear infection cost (ALREADY WINNING, lock it in)

We rank **position 4-10** for a whole cluster here. This is the single
strongest signal. If a dedicated guide doesn't exist yet, build one. If it
does, expand it.

**Target page:** `/guides/dog-ear-infection-cost/` (+ a cat variant)

**Queries it should own (all currently ranking 4-24):**
- how much does it cost to treat an ear infection in a dog (pos 4)
- cost to treat dog ear infection (5)
- how much does it cost to treat a dog ear infection (5)
- how much is it to treat a dog ear infection (5)
- dog ear infection cost (6)
- how much does dog ear infection cost (9)
- how much does an ear infection cost at the vet (10)
- ear infection vet cost (24)

**Page must include:** cost range table (vet exam + cytology + meds +
recheck), chronic vs acute, the "this recurs in drop-ear breeds" angle
(link to Basset/Cocker/Beagle pages), an insurance CTA ("recurring ear
infections add up — see if insurance pencils out").

---

## Priority 2 — Cat x-ray / radiograph cost (big cluster, pos 7-37)

Tons of phrasing variations, all real demand, ranking 7-37. A focused guide
could consolidate and climb.

**Target page:** `/guides/cat-x-ray-cost/`

**Queries (currently 7-59):**
- how much is cat xray (7) · how much are cat x rays (12.5) · cat x ray cost (25.5)
- how much is a cat chest xray (12) · how much does a cat x ray cost (14)
- cost of cat xray (15) · how much do x rays for cats cost (15) · xray for cat cost (15)
- how much is a cat xray (33) · how much does a cat x-ray cost (37) · x ray for cats cost (59)

**Page must include:** single-view vs multi-view, with/without sedation
(sedation is a separate cost — cross-link), common reasons (vomiting,
limping, foreign body), ER vs GP pricing. Strong insurance CTA.

---

## Priority 3 — Cat bloodwork / senior blood panel cost (pos 9-36)

**Target page:** `/guides/cat-bloodwork-cost/`

**Queries:**
- cat senior blood panel cost (9) · senior cat blood panel cost (10)
- cost of blood work for cats (12) · cat bloodwork cost (36.5)

**Page must include:** CBC vs chemistry vs senior panel, why senior cats
need annual panels, thyroid/kidney screening, GP vs in-house lab pricing.

---

## Priority 4 — Sedation & anesthesia cost (pos 23-76, ranking poorly = opportunity)

We rank badly here (23-76) but demand is real and it's high insurance-intent.
A dedicated guide could climb from nothing.

**Target page:** `/guides/dog-sedation-anesthesia-cost/` (+ cat variant)

**Queries:**
- dog sedation cost (41) · cost to sedate a dog (77) · cost to sedate dog (56)
- pet anesthesia cost (67) · cost of sedation for dogs (65)
- cat sedation cost (23)

**Page must include:** sedation vs general anesthesia (different costs),
pre-anesthetic bloodwork requirement, why brachycephalic breeds cost more
(cross-link Frenchie/Bulldog/Pug), procedures that need it (dental, x-ray,
surgery).

---

## Priority 5 — "Vet visit cost / without insurance" 💰 (THE money page)

**Target page:** `/guides/vet-visit-cost-without-insurance/`

**Queries (high commercial intent):**
- how much is a vet visit for a dog without insurance (13) 💰
- average cost of vet visit for dog (11) · average cost of vet visit for cat near me (7)
- how much are vet bills (14) · how much does a vet cost (78)

This is the **strongest insurance-affiliate target** — someone explicitly
searching "without insurance" is weighing the decision. Build it AFTER you
have affiliate programs approved so the CTA can be a real partner link.

---

## Priority 6 — Geographic vet pricing (pos 12-14, ties to state pages)

**Queries:**
- vet prices michigan (14) · pet insurance wisconsin cost (12.6)
- dog vaccinations cost in every state (12)

These tie into the existing /states/ hub and the 150 breed-state pages.
When the state pages get differentiated (per the GPT audit), bake in
"typical vet exam / x-ray / dental ranges for THIS state."

---

## Lower priority / competitive (skip until authority grows)

These rank 70-99 — too competitive for a young site. Don't invest yet:
- pet surgery cost / cost of pet surgery / dog surgery costs (94-98)
- cat surgery cost / cost of surgery for cats (78-85)
- dog c-section cost (70-86)
- dog annual vaccination cost / cost to vaccinate a dog (84-95)

Revisit once domain authority builds (6+ months).

---

## Execution notes

- **Reuse the existing guide template** — match the structure of the
  guides that are already ranking (cost table + FAQ schema + sources block
  + last-reviewed stamp).
- **Every condition-cost guide cross-links** to: (1) the relevant breed
  pages where that condition is common, (2) the vet-bill calculator,
  (3) the insurance-vs-savings calculator.
- **FAQ schema** with the exact "how much…" question variations from GSC —
  these are how people phrase it.
- **Cadence:** 1-2 of these guides per week. Don't dump all at once.
- **Re-pull GSC every 2 weeks** and re-prioritize. The query list will
  grow from 120 to thousands; let real data keep steering.

---

## Brand-collision note

There's an established pet-insurance company literally named **"Petplan."**
Searches for `petplan`, `petplan pet insurance`, `petplan savings` leak onto
the site. Mostly the wrong-intent traffic (they want the other company), but
worth knowing when reading GSC — don't optimize for these.
