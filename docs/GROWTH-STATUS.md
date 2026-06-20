# PetPlanWise — Growth & SEO Status

The single source of truth for where growth stands, **why** the key decisions
were made, and what to do next. Read this first when picking up growth/SEO work.

- **Snapshot date:** 2026-06-20 (domain launched May 2026 — ~6-week-old site)
- **Companion docs:** [`CONTENT-PLAN.md`](CONTENT-PLAN.md) (content roadmap) ·
  [`email-and-dns.md`](email-and-dns.md) (sending infra) ·
  [`../audit/CHANGES.md`](../audit/CHANGES.md) (changelog) ·
  `_research/outreach-playbook.md` (**gitignored, local** — contacts, templates,
  send logs; the *only* place prospect lists live, never the public repo)

---

## 1. The one-paragraph diagnosis

Technical health is **perfect** (Ahrefs Health 100, 0 errors). Growth is gated by
two things only: **(1) indexing** — Google has indexed 157 pages but is sitting on
~158 in "Discovered – currently not indexed", and **(2) authority** — Domain
Rating is 0, so the young domain earns little crawl budget and ranks for almost
nothing yet (6 organic keywords). Everything below serves those two levers. Do
**not** rathole on technical "issues" — they're cosmetic now; the game is getting
pages indexed and earning links.

---

## 2. Snapshot — the numbers (2026-06-20)

| Source | Metric | Value |
|---|---|---|
| Ahrefs Site Audit (Jun 17 crawl) | Health score | **100** (0 errors, 8 warnings, 114 notices) |
| Ahrefs | URLs crawled | ~400 internal |
| Ahrefs | Domain Rating | **0** |
| Ahrefs | Referring domains | 142 (low quality; DR still 0) |
| Ahrefs Web Analytics | Total visitors (28d) | **286 (+279 WoW)** |
| Ahrefs | Organic traffic / keywords | **11 / 6** (US) |
| Google Search Console | **Indexed** | **157** |
| GSC | Not indexed | 298 → **158 "Discovered – not indexed"** + 119 redirects + 20 canonical + 1 crawled-not-indexed |

The 119 "redirect" + 20 "canonical" not-indexed buckets are **normal and fine**
(www/http variants, legacy-cat redirects, canonicalized dupes). The number that
matters is **158 Discovered-not-indexed** — almost entirely the 150 programmatic
breed×state pages.

---

## 3. Strategy — the two levers

### Lever 1 — Indexing (get the 158 indexed / stop wasting crawl budget)
- **Prune thin programmatic pages** (done — see §4 P1c). This is the biggest move.
- **Keep the sitemap complete + clean** (done — §4 P1a).
- **Strengthen internal links** so important pages get crawled (done — §4 P1b).
- **Request indexing** in GSC for high-value pages (rate-limited ~10/day) — manual.
- Authority (Lever 2) also unlocks crawl budget over time.

### Lever 2 — Authority (DR 0 → earn quality followed links)
The only durable fix. All earned, never bought (paid links are off-limits — see the
no-funnel brand position). Channels, in leverage order:
1. **Embeddable calculator** (`/embed/`) — each embed bundles a real attribution
   backlink. Pitch to shelters/rescues + pet blogs. (15 drafts ready — §6.)
2. **Data asset** (`/guides/vet-costs-by-state/`) — citable 50-state table.
   Pitch to journalists/writers.
3. **Qwoted / Featured / SOS** — answer journalist requests → editorial backlinks.
4. **Original data studies** — mine the CSVs for a fresh angle, pitch to pet media.

Expected yield at this stage: a handful of followed referring domains/month. At
DR 0, even 5–10 quality ones visibly move rankings.

---

## 4. What shipped (2026-06 growth sprint)

| Commit | What |
|---|---|
| `3507a861` | Cost-range charts on 42 guides + "cost by life stage" chart on calculators |
| `8d98443b` | `martin@petplanwise.com` as the only public email + header CTA "Insurance vs. savings" |
| `42605ee6` | Interactive cost mind-map demo at `/mind-map-demo/` (noindex, unlinked) |
| `8a3a5045` | **SEO audit fixes** (the P1/P2 batch below) |

### The audit-fix batch (`8a3a5045`) — decisions + rationale

- **P1c — PRUNE the 150 breed×state pages** (`/breeds/<breed>-cost-in-<state>/`).
  - *Why:* verified ~90% duplicate (same copy; cost = breed base × a state
    multiplier — e.g. Lab in TX $924 vs OH $913); all unindexed; redundant with
    the calculator's own state dropdown; 150 thin pages on a ~290-page site is a
    scaled-content / quality-signal liability for a DR-0 domain.
  - *How:* `noindex,follow` on all 150 (`scripts/prune-breed-state.js`) +
    removed `sitemap-breed-state.xml` from the index and deleted it. **Reversible.**
  - *Future:* re-launch a **focused, differentiated** subset (top ~15–20 demand
    combos, with real per-state data) once DR > 0 and core pages rank. Not before.
- **P1a — Sitemap parity.** Added the 17 indexable standalone breeds that were in
  *no* sitemap (basset-hound, bichon-frise, birman, burmese, cockapoo, devon-rex,
  domestic-shorthair, exotic-shorthair, GSP, great-pyrenees, mixed-breed,
  oriental-shorthair, corgi, rhodesian-ridgeback, siberian-cat, wheaten-terrier,
  westie). `sitemap-breeds.xml` now 71 URLs.
- **P1b — Internal links.** Added a "Related cost guides" cross-link module (8
  topical clusters) to 30 guides (`scripts/add-related-guides.js`). The ~16
  weakly-linked guides went 1 → 3–5 inbound links, keyword-rich anchors.
- **P2 — On-page.** Fixed the Dataset schema error on `vet-costs-by-state`
  (`spatialCoverage` Text → `Place`); fixed a reversed FAQ-schema range
  (`$200–$195` → `$185–$200`, a generator bug — fixed in
  `gen-vet-costs-by-state.js` too); trimmed 3 long/SERP-mismatched titles + 5 long
  meta descriptions; added 6 missing meta descriptions (`scripts/seo-meta-fixes.js`).
  ("Slow page" was a non-indexable `/compare/?a=` param URL — no action.)

After deploy: IndexNow pinged (HTTP 200, 178 URLs).

---

## 5. Issue tracker (Ahrefs, reconciled 2026-06-20)

**Resolved** (gone since the stale Jun-10 crawl): 404 pages (6), links-to-broken-page
(13), orphan page (1), noindex-in-sitemap (1) — all cleared by the June fixes.

**Fixed this session:** indexable-not-in-sitemap (17), Dataset schema error (1),
title-too-long / SERP-mismatch (3), meta descriptions (long 5 + missing 6),
weak internal links (~16 guides).

**Open / monitoring (not "bugs" — the actual game):**
- **Discovered – not indexed (158)** → worked via §3 Lever 1. Re-check GSC monthly.
- **DR 0 / low organic** → worked via §3 Lever 2 (earned links). Slow, 2–3 month arc.
- The `3XX redirect` (1) + `HTTP→HTTPS` (1) Ahrefs notices are expected/benign.

---

## 6. Outreach state (detail + contacts in `_research/outreach-playbook.md`)

Two link-earning assets to pitch: the **data asset** (journalists/writers) and the
**embed widget** (shelters/blogs). Send ≤3–5 cold emails/day from
`martin@petplanwise.com` (young-domain deliverability). The §2/§3 formula:
credential → specific number from the 50-state data → one line of *why* → the link.

| Channel | Status (2026-06-20) | Next action |
|---|---|---|
| **Data-asset emails** (FOX21, AZFamily, World Animal Foundation, FareVet + BusyPetParent form) | Sent Jun 12 (from gmail), **re-sent Jun 20 from martin@**. 0 replies. | Do **not** send a 3rd copy. If silent ~1 wk, send a *different* short follow-up. |
| **Embed/shelter batch** (15 personalized drafts in Gmail) | **All 15 unsent drafts.** | **Send 3–5/day from martin@** until done. Highest-leverage open item. |
| **Qwoted** (profile live: `app.qwoted.com/sources/martin-lash`) | Active; **session logs out** — must log in each visit. | Answer pet/vet-cost/insurance/budget source requests with the formula. |
| **Featured / Connectively** | Legacy profile exists on Connectively (HARO successor). | Pitch later; lower priority than Qwoted + shelter batch. |
| **SOS (Source of Sources), Featured.com** | Not signed up. | ~15 min one-time signup when ready. |

---

## 7. Dashboards — how to check (API is dead; use the Chrome extension)

The connected **Ahrefs MCP returns "Insufficient plan"** on every call (incl. the
free endpoint) — so all Ahrefs/GSC-via-Ahrefs tools are unusable. Read the
dashboards through the **Chrome extension** instead (the user's logged-in browser):

| Dashboard | URL | Notes |
|---|---|---|
| Ahrefs Site Audit | `app.ahrefs.com/site-audit/9858036/overview` and `/issues` | Project id **9858036**. "Run crawl" to refresh after fixes. |
| Ahrefs Dashboard | `app.ahrefs.com/dashboard` | DR, ref domains, Web Analytics visitors, organic kw — all projects. |
| Ahrefs GSC Insights | `app.ahrefs.com/gsc/project/9858036/overview` | **Locked** (paid plan) — use GSC directly instead. |
| Google Search Console | `search.google.com/search-console` → `sc-domain:petplanwise.com` → **Pages** | The real indexing report (indexed vs Discovered-not-indexed). |
| Qwoted | `app.qwoted.com/source_requests` | Requires login each session. |

Guardrail: **never enter passwords / log in on the user's behalf**, and **never
submit a public pitch/answer or post** without the user's explicit per-item OK.
Draft → user reviews → user submits.

---

## 8. Go-forward — prioritized

**Now (highest leverage):**
1. **Send the 15 shelter embed drafts** (3–5/day, from martin@). Each accepted = a `.org` backlink.
2. **GSC:** re-submit `sitemap.xml`; remove the old `sitemap-breed-state.xml` entry (now 404); "Validate fix" on the resolved issues.
3. **Ahrefs:** Run a fresh Site Audit crawl so the §4 fixes register.

**Soon:**
4. Work **Qwoted** requests weekly (answer pet/vet/insurance/budget ones).
5. Publish **one original data study** from the CSVs (e.g. "cheapest vs most
   expensive states to own a dog, 2026") and pitch to pet media.
6. Sign up **SOS + Featured.com**.

**Later / gated:**
7. Re-launch a **differentiated** breed×state subset (top ~15–20 combos) — only
   after DR > 0 and core pages rank.
8. Fill the **contact-page business-entity placeholders** (FTC, before scaling affiliate).
9. **Affiliate**: insurance affiliate first, on the highest-intent vet/condition
   pages — only once traffic warrants (no display ads until ~10K sessions/mo).

**Recurring (~15–30 min/week):** send shelter pitches until done · check Qwoted ·
watch martin@ for replies (log them) · monthly: re-check GSC Pages (indexed rising /
not-indexed falling), Ahrefs (DR, ref domains, organic kw), run a fresh crawl.

---

## 9. Success signals (what "working" looks like, in order)

1. **GSC Pages:** Not-indexed (Discovered) **falling**, Indexed **rising** — the
   first thing to move (weeks).
2. **Ahrefs:** referring domains from *quality* sites rising; **DR ticks off 0**.
3. **Ahrefs/GSC:** organic keywords climbing past single digits; first page-1 rankings.
4. **Web Analytics:** organic (not direct) share growing; Social > 0 (Pinterest converting).

Re-snapshot §2 monthly and date it.

---

Last reviewed: 2026-06-20.
