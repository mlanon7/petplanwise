#!/usr/bin/env node
/**
 * prune-breed-state.js
 *
 * Strategic prune of the 150 programmatic breed×state pages
 * (/breeds/<breed>-cost-in-<state>/). They are ~90% duplicate (same copy,
 * cost = breed base × a state multiplier), sit unindexed in GSC's
 * "Discovered – currently not indexed" bucket, and dilute a young domain's
 * site-wide quality signal. We take them OUT of the index race:
 *
 *   1. add <meta name="robots" content="noindex,follow"> to each page
 *      (keep them live + link-equity flowing; just don't index them)
 *   2. caller removes sitemap-breed-state.xml from the sitemap index
 *
 * Reversible: delete the inserted meta to re-index. Idempotent.
 */
const fs = require('fs');
const path = require('path');

const BREEDS = path.join(__dirname, '..', 'breeds');
const META = '<meta name="robots" content="noindex,follow" />';

const dirs = fs.readdirSync(BREEDS).filter(d => /-cost-in-/.test(d) &&
  fs.existsSync(path.join(BREEDS, d, 'index.html')));

let done = 0, skipped = 0;
for (const d of dirs) {
  const file = path.join(BREEDS, d, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  if (/name="robots"/i.test(html)) { skipped++; continue; }
  // insert right after the canonical link
  const m = html.match(/(<link rel="canonical"[^>]*>)/i);
  if (!m) { console.log('  !! no canonical, skipped: ' + d); skipped++; continue; }
  html = html.replace(m[1], m[1] + '\n' + META);
  fs.writeFileSync(file, html);
  done++;
}
console.log(`noindex,follow added to ${done} breed×state pages (${skipped} skipped/already-set).`);
