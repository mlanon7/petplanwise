# .claude/ — Working Memory for AI Assistants

This directory captures everything an AI assistant (Claude Code, Cursor, Copilot) needs to be productive on PetPlanWise **and** to replicate the pattern on a future similar cost-calculator site (firstyearcost, parentcarecost, etc.).

Treat this directory as a **toolkit you can clone**: copy `.claude/` into a new static cost-calculator site, swap a handful of nouns (the niche, the data sources, the cache-bust version), and most of the workflow scaffolding is done.

> Sibling reference: this toolkit mirrors the structure of `Electrifycost/.claude/`. The big difference is architecture — ElectrifyCost is an Astro build; **PetPlanWise is pure static HTML/JS with a manual dated cache-bust.** The lessons and commands here reflect that.

---

## Structure

```
.claude/
├── README.md                — this file
├── launch.json              — dev-server config (gitignored; local only)
├── settings.local.json      — local settings + secrets (gitignored; NEVER commit)
├── commands/                — slash commands for routine workflows
│   ├── ship.md              — full ship workflow: test → cache-bust → commit → push → verify
│   ├── bump-cache.md        — the 4-place cache-bust procedure (the #1 gotcha)
│   ├── add-guide.md         — add a condition/procedure cost guide (generator pattern)
│   ├── add-breed.md         — add breed page(s) via a generator script
│   ├── update-data.md       — CSV edit procedure with last_reviewed bump + test
│   ├── refresh-sources.md   — periodic source-review playbook (CareCredit/NAPHIA/BLS)
│   ├── keyword-research.md  — free Google Autocomplete harvest → gap analysis
│   └── audit-site.md        — kick off a multi-stream local site audit
├── lessons/                 — postmortems on bugs we hit, so we don't repeat them
│   ├── 01-cache-bust-four-places.md
│   ├── 02-hero-original-revert-trap.md
│   ├── 03-string-replace-dollar-backreference.md
│   ├── 04-phase-weighted-lifetime.md
│   ├── 05-csv-as-single-source-of-truth.md
│   ├── 06-apex-www-canonical.md
│   ├── 07-backdrop-filter-stacking-context.md
│   ├── 08-queryselectorall-not-queryselector.md
│   ├── 09-audit-the-live-state.md
│   └── 10-finance-figures-go-stale.md
└── prompts/                 — drop-in prompts for any AI assistant (ChatGPT, Claude.ai, Manus)
    ├── full-site-audit.md   — comprehensive 3rd-party audit brief
    ├── content-strengthen.md— turn a thin cost guide into a ranking one
    ├── gsc-analysis.md      — analyze a GSC export into a content plan
    └── data-verification.md — re-verify cost CSVs against current sources
```

---

## Quickstart for a future similar project

1. **Clone this directory** into the new repo's `.claude/`.
2. **Edit `commands/*.md`** — swap project nouns (pets → babies/eldercare), URLs, the cache-bust version, the CSV names.
3. **Edit `lessons/*.md`** — keep the general anti-patterns (cache-bust, `$`-backreference, stacking context, stale-checkout audits, finance-figure drift); drop the pet-specific examples.
4. **Edit `prompts/*.md`** — highest-leverage reusable files. Replace the NAPHIA/BLS/AAHA source canon with the new niche's primary sources.
5. Keep the **CSV-first + dated cache-bust** architecture (lessons 01 + 05) — it's the backbone of the whole pattern.

---

## How to use slash commands

In Claude Code, type `/<command-name>` and the matching `commands/*.md` expands into context. Example: `/ship` runs the test → cache-bust → commit → push → verify procedure. Commands are written to be idempotent.

## How to use lessons

Each `lessons/NN-*.md` is a postmortem ending in a **Detection rule** / **Forward-looking rule**. Check `lessons/` BEFORE debugging — the bug may already be documented. They're numbered by the order we learned them, not by severity.

## How to use prompts

`prompts/*.md` are drop-in briefs for any AI tool. Run `data-verification.md` periodically against the CSVs; run `full-site-audit.md` before a big push; run `content-strengthen.md` on a specific thin page.

---

## What's NOT in here

- **No secrets.** `settings.local.json` and `launch.json` are gitignored. The `.gitignore` uses `.claude/*` + explicit `!` un-ignores so only README/commands/lessons/prompts are tracked.
- **No runtime config.** `vercel.json`, `package.json`, the CSVs live at the repo root / `assets/`.
- **No build/CI config.** There is no build and no CI — deploy is `git push origin HEAD:main`.

This directory is **workflow memory + AI working context**. The product is everywhere else.

---

## Last reviewed: 2026-05-21
