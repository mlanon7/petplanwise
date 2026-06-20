#!/usr/bin/env node
/**
 * add-related-guides.js  (one-shot, idempotent)
 * Adds a "Related cost guides" cross-link module to guide pages, grouped by
 * topical cluster. Each guide links to its cluster-mates, so every guide in a
 * cluster gains several inbound internal links (fixes Ahrefs "page has only
 * one dofollow incoming internal link" + improves crawl priority + UX).
 *
 * Inline-styled, no CSS dependency, no cache-bust. Anchor text = each target
 * guide's own <h1>. Re-run safely (replaces the marked block).
 */
const fs = require('fs');
const path = require('path');
const GUIDES = path.join(__dirname, '..', 'guides');

const CLUSTERS = [
  ['dog-dental-cleaning-cost', 'cat-dental-cleaning-cost', 'cat-dental-extraction-cost', 'diy-vs-vet-dental-cost'],
  ['dog-ear-infection-cost', 'cat-ear-infection-cost', 'dog-allergy-testing-cost', 'cat-abscess-cost'],
  ['dog-uti-cost', 'cat-urinary-blockage-cost', 'cat-kidney-disease-cost'],
  ['heartworm-treatment-cost', 'parvo-treatment-cost', 'dog-vaccine-cost', 'cat-vaccine-cost'],
  ['pet-er-vs-wait-decision-guide', 'emergency-vet-visit-cost', 'dog-bloat-gdv-surgery-cost', 'vet-visit-cost-without-insurance'],
  ['dog-boarding-cost', 'dog-grooming-cost', 'dog-training-cost', 'pet-microchip-cost', 'hidden-pet-costs'],
  ['lemonade-vs-embrace-pet-insurance', 'pet-insurance-vs-carecredit', 'pet-insurance-vs-savings'],
  ['dog-sedation-anesthesia-cost', 'cat-sedation-cost', 'pet-sedation-anesthesia-cost'],
];

const file = slug => path.join(GUIDES, slug, 'index.html');
const exists = slug => fs.existsSync(file(slug));
const h1 = slug => {
  const m = fs.readFileSync(file(slug), 'utf8').match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  return m ? m[1].replace(/<[^>]+>/g, '').trim() : slug;
};

// title cache
const titles = {};
function buildBlock(slug, mates) {
  const links = mates.map(s =>
    `        <a href="/guides/${s}/" style="display:inline-block;padding:8px 14px;border:1px solid #E8DFC7;border-radius:999px;background:#FBF7EC;color:#115E59;font-size:13.5px;font-weight:600;text-decoration:none;">${titles[s]}</a>`
  ).join('\n');
  return [
    '<!-- related-guides -->',
    '    <section><div class="container">',
    '      <h2 style="font-size:18px;margin:0 0 12px;">Related cost guides</h2>',
    '      <div style="display:flex;flex-wrap:wrap;gap:10px;">',
    links,
    '      </div>',
    '    </div></section>',
    '<!-- /related-guides -->'
  ].join('\n');
}

let done = 0, missing = [];
for (const cluster of CLUSTERS) {
  const live = cluster.filter(exists);
  cluster.filter(s => !exists(s)).forEach(s => missing.push(s));
  live.forEach(s => { if (!(s in titles)) titles[s] = h1(s); });
  for (const slug of live) {
    const f = file(slug);
    let html = fs.readFileSync(f, 'utf8');
    html = html.replace(/\n?\s*<!-- related-guides -->[\s\S]*?<!-- \/related-guides -->/g, '');
    const mates = live.filter(s => s !== slug);
    if (!mates.length) continue;
    const block = buildBlock(slug, mates);
    // insert before the Sources section if present, else before </main>
    let idx = html.indexOf('<section><div class="container sources">');
    if (idx === -1) idx = html.indexOf('</main>');
    if (idx === -1) { console.log('  !! no insert point: ' + slug); continue; }
    html = html.slice(0, idx) + block + '\n' + html.slice(idx);
    fs.writeFileSync(f, html);
    done++;
  }
}
console.log(`related-guides module added/updated on ${done} guide pages across ${CLUSTERS.length} clusters.`);
if (missing.length) console.log('  (slugs not found, skipped: ' + [...new Set(missing)].join(', ') + ')');
