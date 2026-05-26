# Lesson 06 — Canonical host must SERVE, not redirect (apex vs www)

**Date:** 2026-05-21 (Vercel domain flip + Ahrefs Site Audit)
**Severity:** P1 — 704 "canonical points to redirect" + "3XX in sitemap" audit errors

## What happened

Ahrefs Site Audit showed a Health Score of 17 with **704 errors**, dominated by "Canonical points to redirect" (396) and "3XX redirect in sitemap" (335). The site looked broken. It wasn't — the redirect topology was backwards.

## Root cause

- Every page's `<link rel="canonical">` and every sitemap URL points to the **apex** `petplanwise.com`.
- But Vercel was configured so the **apex 307-redirected to `www`**, and `www` served the site.
- So every canonical pointed at a URL that immediately redirected → "canonical points to redirect" on all 396 pages; sitemap URLs all 3XX'd.

## The fix (Vercel → Settings → Domains)

1. Set **`petplanwise.com` (apex) → "Connect to an environment" (Production)** so it **serves** directly (no redirect).
2. Set **`www.petplanwise.com` → "Redirect to Another Domain" → 308 Permanent → `petplanwise.com`.**
3. Point any other owned domains (e.g. `yourpetbill.com`) **directly at the apex**, not at www, to avoid a redirect chain.

Verify:
```bash
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" https://petplanwise.com/        # 200 (no redirect)
curl -sS -o /dev/null -w "%{http_code} %{redirect_url}\n" https://www.petplanwise.com/    # 308 -> apex
```

## Second trap — Ahrefs crawl scope

After the flip, the audit still churned because the Ahrefs project **Scope** was set to **"Subdomains,"** which crawls `www.*` too — and www now redirects, so every www URL got flagged. Fix: set Scope to **"Domain"** (apex only), then re-crawl.

## Detection rule

The canonical host must return **200**, never a 3XX. If an audit shows "canonical points to redirect" en masse, check which host actually serves vs redirects — the canonical and the serving host must be the same one. Use **308 (permanent)**, not 307 (temporary), for the redirect.

## Forward-looking rule

On every new site: pick the canonical host, make it SERVE, 308-redirect the other, and set the audit tool's scope to that single host. Decide this on day one.
