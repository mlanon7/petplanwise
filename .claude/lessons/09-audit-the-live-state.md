# Lesson 09 — Audit the live/worktree state, not a stale local checkout

**Date:** 2026-05-21 (Codex `CODEX_FULL_SITE_AUDIT_2026-05-21.md`)
**Severity:** process — wasted effort chasing already-fixed "issues"

## What happened

A thorough Codex audit landed with scary P0/P1 findings: senior lifetime uses `annual×years`, `breed-images.csv` has NUL corruption, 3 MB hero images, 21 tests, 54 breeds, 293 pages, CSVs missing source columns. On verification, **most were already fixed and deployed.** The audit had run against the **stale local checkout** (`D:\claude projects\petcost-bill\`), not the worktree (which is what's live on `main`).

## How we knew it was stale

The numbers didn't match reality: it reported **54 breeds** (live: 71), **293 pages** (live: 328), **21 tests** (live: 23), the **old lifetime math** (live: phase-weighted), and "missing CSV source columns" (it literally noted "the hidden worktree had richer source columns"). Every mismatch pointed at an old snapshot.

## Why this repo is prone to it

Work happens in a git **worktree** (`.claude/worktrees/<id>/`) and is pushed to `main` via `git push origin HEAD:main`. The top-level checkout (`D:\claude projects\petcost-bill\`) is a separate working copy that is often **behind** until someone `git pull`s it. An auditor (or a fresh agent) pointed at the top-level folder sees old files.

## What was actually real

Only 2 of the audit's items were live: the **CareCredit APR** (26.99% → 32.99%, fixed) and **40 tracked junk files** (`hero-old.jpg` etc., removed). Everything else was a stale-snapshot artifact.

## Detection rule

Before acting on ANY audit, sanity-check its reported counts (breeds, pages, tests) against `git rev-list --count HEAD` + a quick `find . -name '*.html' | wc -l` in the worktree. If they disagree, the audit is stale — re-verify each finding against the worktree before fixing.

## Forward-looking rule

When commissioning an external audit, point it at the **live URL** (`petplanwise.com`) or tell it to `git pull` the main checkout first. When triaging audit findings, verify-then-fix; never bulk-apply.
