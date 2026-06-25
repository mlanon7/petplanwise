#!/usr/bin/env node
/**
 * fix-duplicate-meta.js  (one-shot)
 * Removes duplicate <meta name="description"> tags site-wide, keeping exactly
 * one per page. Background: seo-meta-fixes.js detected descriptions only in the
 * standard `name="description" content=...` order, so on pages whose existing
 * tag used reversed order (`content=... name="description"`) it ADDED a second
 * one. Ahrefs flagged "Multiple meta description tags". This keeps the
 * standard-order tag and drops the reversed-order duplicate.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const skip = new Set(['.git', 'node_modules', '.vercel', '.claude', '_research', 'assets', 'pins', 'brand', 'audit', 'docs', 'scripts', 'tests']);

let files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (e.isDirectory()) { if (skip.has(e.name)) continue; walk(path.join(d, e.name)); }
    else if (e.name.endsWith('.html')) files.push(path.join(d, e.name));
  }
})(ROOT);

// matches a meta-description tag in EITHER attribute order (not og:/twitter:)
const ANY = /<meta(?=[^>]*\bname="description")(?=[^>]*\bcontent=)[^>]*>/gi;
const REVERSED = /<meta\s+content="[^"]*"\s+name="description"\s*\/?>/i;

let fixed = [], multi = 0;
for (const f of files) {
  let h = fs.readFileSync(f, 'utf8');
  const tags = h.match(ANY) || [];
  if (tags.length <= 1) continue;
  multi++;
  // remove reversed-order duplicate(s); if none reversed, drop all but the first standard one
  let before = h;
  h = h.replace(new RegExp('\\n?\\s*' + REVERSED.source, 'gi'), '');
  // safety: if still >1, keep only the first remaining description tag
  let remaining = h.match(ANY) || [];
  if (remaining.length > 1) {
    let seen = false;
    h = h.replace(ANY, m => { if (seen) return ''; seen = true; return m; });
  }
  if (h !== before) { fs.writeFileSync(f, h); fixed.push(path.relative(ROOT, f).replace(/\\/g, '/')); }
}
console.log('Pages with multiple description tags: ' + multi);
console.log('Pages fixed: ' + fixed.length);
fixed.forEach(p => console.log('  ' + p));
