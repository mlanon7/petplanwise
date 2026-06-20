#!/usr/bin/env node
/**
 * seo-meta-fixes.js  (one-shot)
 * Addresses Ahrefs/live-audit content issues:
 *  - trim 3 over-long / SERP-mismatched <title>s
 *  - trim 5 over-long meta descriptions (>160 chars)
 *  - add 6 missing meta descriptions
 * Idempotent-ish: title set is absolute; desc set replaces-or-inserts.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');

const TITLES = {
  'guides/dog-sedation-anesthesia-cost/index.html': 'How Much Does It Cost to Sedate a Dog? (2026)',
  'guides/cat-sedation-cost/index.html': 'How Much Does Cat Sedation Cost? (2026)',
  'breeds/pitbull-cost/index.html': 'Pit Bull Cost &amp; Price (2026) | PetPlanWise',
};

const DESCS = {
  // trims (were >160)
  'guides/pet-sedation-anesthesia-cost/index.html':
    'Pet sedation runs $40–$400 and general anesthesia $90–$700, plus pre-anesthetic bloodwork. Dog vs cat costs and what drives the bill.',
  'guides/pet-surgery-cost/index.html':
    'Pet surgery runs $150–$700 for a spay/neuter up to $2,000–$7,500 for ACL or bloat repair. Common dog & cat surgery prices and what drives the bill.',
  'guides/vet-costs-by-state/index.html':
    'Vet costs vary up to 50% by state. Compare routine, emergency, and annual vet costs across all 50 states + D.C. — sortable, sourced table.',
  'contact/index.html':
    'Reach the PetPlanWise editorial team for corrections, source pointers, calculator feedback, or partnership inquiries.',
  'embed/index.html':
    'Free embeddable pet cost calculator for blogs and pet sites. One snippet — no signup, no API key. Live U.S. dog & cat cost data from AVMA, NAPHIA, BLS.',
  // additions (were missing)
  'guides/cat-vaccine-cost/index.html':
    'Cat vaccine costs: core, FeLV, and rabies shots plus the typical yearly range. What kittens and adult cats need, and what each vaccine costs.',
  'guides/dog-vaccine-cost/index.html':
    'Dog vaccine costs: core and non-core shots, the puppy series, and the typical total yearly range. What each vaccine costs and when it is due.',
  'guides/emergency-vet-visit-cost/index.html':
    'How much an emergency vet visit costs: typical ER exam fees, common treatment ranges, and what drives the bill — plus how to plan ahead.',
  'guides/index.html':
    'PetPlanWise cost guides for dog and cat owners: vet bills, procedures, vaccines, surgery, insurance, and first-year costs — source-backed planning ranges.',
  'vet-costs/index.html':
    'Real U.S. vet cost ranges by procedure — exams, dental, bloodwork, surgery, and emergencies — with a free calculator. Source-backed planning estimates.',
  'guides/pet-insurance-vs-savings/index.html':
    'Is pet insurance worth it? Compare paying premiums vs. self-funding a savings buffer with an interactive break-even calculator. Source-backed, no funnel.',
};

let t = 0, d = 0, miss = 0;
for (const [rel, title] of Object.entries(TITLES)) {
  const f = path.join(ROOT, rel);
  let h = fs.readFileSync(f, 'utf8');
  const nh = h.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + title + '</title>');
  if (nh !== h) { fs.writeFileSync(f, nh); t++; console.log('  title  ✓ ' + rel + '  (' + title.replace(/&amp;/g, '&').length + ' chars)'); }
}
for (const [rel, desc] of Object.entries(DESCS)) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) { console.log('  !! missing file: ' + rel); continue; }
  let h = fs.readFileSync(f, 'utf8');
  const tag = '<meta name="description" content="' + desc + '" />';
  let nh;
  if (/<meta name="description"/i.test(h)) {
    nh = h.replace(/<meta name="description"[^>]*>/i, tag); d++;
  } else {
    nh = h.replace(/(<\/title>)/i, '$1\n' + tag); miss++;
  }
  if (nh !== h) { fs.writeFileSync(f, nh); console.log('  desc   ✓ ' + rel + '  (' + desc.length + ' chars)'); }
}
console.log(`\nTitles set: ${t} · descriptions replaced: ${d} · descriptions added: ${miss}`);
