# /audit-site — Multi-stream local site audit

A fast, in-session structural audit (no external services). For a deep 3rd-party audit, use `.claude/prompts/full-site-audit.md` instead. **Always audit the worktree/live state, never a stale local checkout** (see `.claude/lessons/09-audit-the-live-state.md`).

## Stream 1 — JSON-LD validity (all pages)

```bash
node -e 'const fs=require("fs"),p=require("path");function w(d,o){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()){if([".git","node_modules",".vercel"].includes(e.name))continue;w(p.join(d,e.name),o)}else if(e.name.endsWith(".html"))o.push(p.join(d,e.name))}return o}let bad=0;for(const f of w(".",[])){const h=fs.readFileSync(f,"utf8");for(const m of h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)){try{JSON.parse(m[1])}catch(e){bad++;console.log("BAD",f,e.message)}}}console.log(bad?bad+" bad":"all JSON-LD parses")'
```

## Stream 2 — broken internal links

Resolve every `href="/..."` to a file on disk. Flag misses. (See the resolver used in past audits — map `/x/` → `x/index.html`.)

## Stream 3 — SEO hygiene

- Titles >65 chars (note: `&amp;` inflates the count by 4 — measure RENDERED length).
- Meta descriptions >160 chars.
- Duplicate titles/descriptions across pages.
- Exactly one `<h1>` per page; canonical matches slug.

```bash
# title length distribution
node -e 'const fs=require("fs"),p=require("path");function w(d,o){for(const e of fs.readdirSync(d,{withFileTypes:true})){if(e.isDirectory()){if([".git","node_modules",".vercel"].includes(e.name))continue;w(p.join(d,e.name),o)}else if(e.name.endsWith(".html"))o.push(p.join(d,e.name))}return o}let n=0;for(const f of w(".",[])){const m=fs.readFileSync(f,"utf8").match(/<title>([^<]*)<\/title>/);if(m){const L=m[1].replace(/&amp;/g,"&").length;if(L>65){n++;console.log(L,f)}}}console.log(n+" titles >65 rendered chars")'
```

## Stream 4 — sitemap parity

Every URL in the child sitemaps maps to a real file; no dupes; index `lastmod` for each child >= the child's newest `lastmod`; `<urlset>` well-formed.

## Stream 5 — data hygiene

- CSV NUL bytes (use a real byte check, NOT `grep $'\x00'` — that pattern is empty in bash and matches every line):
  ```bash
  node -e 'const fs=require("fs");for(const f of fs.readdirSync("assets/data/csv")){const b=fs.readFileSync("assets/data/csv/"+f);let n=0;for(const x of b)if(x===0)n++;if(n)console.log(f,n,"NUL bytes")}'
  ```
- `npm test` (23 calculator assertions).
- Breed-trait outliers: `node scripts/audit-breed-traits.js`.

## Stream 6 — deployable junk

```bash
git ls-files | grep -E 'hero-old\.jpg$|\.tmp$|\.clean$|hero-prev\.jpg$'   # should be empty
```

## Stream 7 — backed-by-source check

Cost-bearing CSV rows have `source_url` + `last_reviewed`; finance figures (APR) in HTML show a "checked" date. See `/refresh-sources`.

## Report

Per stream: a short verdict + a table of findings (Finding | Severity | File | Fix). Triage P0 (ships a wrong number / broken) → P3 (cosmetic). Fix the code-fixable ones, then `/ship`.
