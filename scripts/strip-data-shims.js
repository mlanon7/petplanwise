// Remove the 7 no-op data-shim <script> tags from every page.
//
// After the 2026-05 CSV refactor, these files became 9-line no-op shims kept
// only so legacy <script src="/assets/data/<name>.js"> tags didn't 404. The
// real loader is csv-loader-<date>.js. The shim tags are dead weight on every
// page (7 extra HTTP requests for empty JS).
//
// This script ONLY removes the shim <script> tags. It deliberately leaves the
// project's dated-filename cache-bust convention (calculator-<date>.js, etc.)
// untouched — that's maintained by scripts/bump-cache-bust.js and must not change.
//
// Run from project root: node scripts/strip-data-shims.js [--dry-run]

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const SHIMS = ['base-costs', 'multipliers', 'breeds', 'procedures', 'insurance', 'cities', 'breed-images'];

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    if (['node_modules', '.claude', '_research', '.git', 'breed_images'].includes(name)) continue;
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) walk(full, out);
    else if (name === 'index.html') out.push(full);
  }
  return out;
}

const root = process.cwd();
let changed = 0, tagsRemoved = 0;

for (const f of walk(root)) {
  let content = fs.readFileSync(f, 'utf-8');
  const before = content;
  for (const name of SHIMS) {
    // Match the whole line incl. leading whitespace + trailing newline.
    // Handles src-first or defer-first, defer / defer="" / defer="defer",
    // and an optional ?v=... querystring.
    const patterns = [
      new RegExp(`[ \\t]*<script\\s+src="/assets/data/${name}\\.js(?:\\?[^"]*)?"\\s+defer(?:=""|="defer")?\\s*></script>\\r?\\n?`, 'g'),
      new RegExp(`[ \\t]*<script\\s+defer(?:=""|="defer")?\\s+src="/assets/data/${name}\\.js(?:\\?[^"]*)?"\\s*></script>\\r?\\n?`, 'g'),
    ];
    for (const re of patterns) {
      const m = content.match(re);
      if (m) { tagsRemoved += m.length; content = content.replace(re, ''); }
    }
  }
  if (content !== before) {
    if (!DRY_RUN) fs.writeFileSync(f, content);
    changed++;
  }
}

console.log(`Pages with shim tags stripped: ${changed}${DRY_RUN ? ' (dry-run)' : ''}`);
console.log(`Total shim <script> tags removed: ${tagsRemoved}`);
