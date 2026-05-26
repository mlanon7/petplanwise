# /ship — Full ship workflow

When the user invokes `/ship`, follow this procedure exactly. PetPlanWise has **no build and no CI** — `git push origin HEAD:main` deploys live in ~30s. So the discipline below is the only safety net.

## 1. Did the change touch CSS or JS?

If you edited anything under `assets/css/` or `assets/js/` (or any referenced asset), you **must** cache-bust first — otherwise the CDN serves the old file for a year. Run the `/bump-cache` procedure (`.claude/commands/bump-cache.md`) before committing. If the change is HTML/CSV/content only, skip this step (HTML redeploys fresh).

## 2. Did the change touch the calculator or CSV data?

```bash
npm test          # 23 assertions in tests/calculator.test.js
```

**If any assertion fails, STOP.** Show the failure and ask for guidance. Never ship a red calculator.

## 3. Validate content changes (if you added/edited pages)

Quick local checks — JSON-LD parses, internal links resolve, FAQ schema count == visible FAQ count:

```bash
node -e 'const fs=require("fs");for(const f of process.argv.slice(1)){const h=fs.readFileSync(f,"utf8");[...h.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)].forEach(m=>{try{JSON.parse(m[1])}catch(e){console.log("BAD JSON-LD",f,e.message)}})}' guides/<new-page>/index.html
```

For a bigger change, run the `/audit-site` command instead.

## 4. Stage changes — never blanket-add

```bash
git status --short
git add <specific files>
```

**Avoid `git add -A` unless the change is a known bulk op** (a cache-bust touches ~328 HTML files — that's the one legitimate case). Before a blanket add, screen for stray files: `git status --short | grep -iE '\.env|secret|settings\.local'`. `.claude/settings.local.json` must NEVER be staged.

## 5. Commit — subject + WHY body

```
git commit -m "$(cat <<'EOF'
<Imperative subject under 70 chars>

<2-3 sentences on WHY, not what.>
<Note the cache bump if one happened.>

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

Don't skip hooks or bypass signing. If a hook fails, fix the cause and make a NEW commit (don't amend).

CRLF warnings on Windows (`LF will be replaced by CRLF`) are harmless — `core.autocrlf` stores LF in the repo. Ignore them.

## 6. Push

```bash
git push origin HEAD:main
```

We work in a worktree on branch `claude/...` and push its HEAD to `main`. Expected output: `<old>..<new>  HEAD -> main`.

## 7. Verify live (~30s after push)

```bash
curl -sL https://petplanwise.com/ -o /dev/null -w "%{http_code}\n"     # 200
curl -sL "https://petplanwise.com/" | grep -o 'layout-[a-z0-9]*\.js'    # current <V> if you bumped
```

## 8. Report back

- New commit SHA (7 chars) + one-line summary
- Vercel deploy ETA (~30s)
- Whether a cache bump happened (and the new `<V>`)
- Any follow-up: verify the live page, resubmit sitemap, request indexing in GSC

## When NOT to /ship

- The user hasn't asked to commit — default to showing the diff.
- Tests are failing — never ship red.
- Unrelated uncommitted changes — scope them into separate logical commits or ask.
