// Inject a "Compare with similar breeds" module at the bottom of every base
// breed page. Picks 4 same-species breeds by closest size, then closest
// health-risk score. Lifts internal PageRank on the ~76 base breed pages that
// otherwise have a single incoming link (only the /breeds/ hub links to them) —
// see Ahrefs Site Audit "page has only one dofollow incoming internal link".
//
// Fully self-contained: inline styles only, no site.css dependency, no
// cache-bust needed. Idempotent (replaces an existing module on re-run).
//
// Run from project root: node scripts/add-related-breeds.js [--dry-run]

const fs = require('fs');
const path = require('path');

const DRY_RUN = process.argv.includes('--dry-run');
const root = process.cwd();

function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
    else if (c !== '\r') field += c;
  }
  if (field || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows[0];
  return rows.slice(1).filter(r => r.some(c => c !== '')).map(r => {
    const o = {};
    headers.forEach((h, i) => o[h] = r[i] || '');
    return o;
  });
}

const breeds = parseCSV(fs.readFileSync('assets/data/csv/breeds.csv', 'utf-8'));
const sizeOrder = { toy: 0, small: 1, medium: 2, large: 3, giant: 4 };

// The 8 legacy cat breeds live at /breeds/<slug>-cat-cost/, everything else at
// /breeds/<slug>-cost/. Hardcoding "-cost" here was emitting 404 links (and
// skipping these pages entirely on disk). See CLAUDE.md "legacy cat breeds".
const CAT_LEGACY = new Set(['bengal', 'british-shorthair', 'maine-coon', 'persian', 'ragdoll', 'scottish-fold', 'siamese', 'sphynx']);
const breedDir = slug => `breeds/${slug}-${CAT_LEGACY.has(slug) ? 'cat-cost' : 'cost'}`;

function pickRelated(target, n = 4) {
  return breeds
    .filter(b => b.slug !== target.slug && b.species === target.species)
    .map(b => {
      const sizeDist = Math.abs((sizeOrder[b.size] ?? 99) - (sizeOrder[target.size] ?? 99));
      const riskDist = Math.abs((+b.health_risk || 1) - (+target.health_risk || 1));
      return { b, score: sizeDist * 10 + riskDist };
    })
    .sort((a, b) => a.score - b.score)
    .slice(0, n)
    .map(x => x.b);
}

const CARD = 'display:flex;flex-direction:column;gap:4px;padding:12px 14px;background:#fff;border:1px solid #E8DFC7;border-radius:10px;text-decoration:none;color:inherit;';
const NAME = 'font-weight:600;font-size:15px;color:#1F2937;';
const META = 'font-size:12px;color:#6B7280;text-transform:capitalize;';
const END_MARK = '</section><!-- /related-breeds -->';

let touched = 0, skipped = 0, missing = 0;

for (const breed of breeds) {
  const file = `${breedDir(breed.slug)}/index.html`;
  if (!fs.existsSync(file)) { missing++; continue; }

  const related = pickRelated(breed, 4);
  if (related.length < 2) { skipped++; continue; }

  const cards = related.map(r => {
    const name = (r.name || r.slug).replace(/&/g, '&amp;');
    const meta = (r.species === 'cat' ? 'Cat' : 'Dog') + ' · ' + (r.size || '');
    return `        <a href="/${breedDir(r.slug)}/" style="${CARD}">\n` +
           `          <span style="${NAME}">${name}</span>\n` +
           `          <span style="${META}">${meta}</span>\n` +
           `        </a>`;
  }).join('\n');

  const species = breed.species === 'cat' ? 'cats' : 'dogs';
  const block =
`  <section class="related-breeds" style="padding:32px 0;"><div class="container">
    <h2 style="font-size:1.25rem;margin:0 0 16px;">Compare with similar ${species}</h2>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;">
${cards}
    </div>
  </div>${END_MARK}
`;

  let content = fs.readFileSync(file, 'utf-8');
  let newContent;

  const startIdx = content.indexOf('<section class="related-breeds"');
  if (startIdx !== -1) {
    const endIdx = content.indexOf(END_MARK, startIdx);
    if (endIdx === -1) { console.log(`  WARN ${file}: start tag without end marker, skipping`); skipped++; continue; }
    const lineStart = content.lastIndexOf('\n', startIdx);
    newContent = content.slice(0, lineStart + 1) + block + content.slice(endIdx + END_MARK.length + 1);
  } else {
    const mainClose = content.lastIndexOf('</main>');
    if (mainClose === -1) { console.log(`  WARN ${file}: no </main>`); skipped++; continue; }
    newContent = content.slice(0, mainClose) + block + content.slice(mainClose);
  }

  if (newContent === content) { skipped++; continue; }
  if (!DRY_RUN) fs.writeFileSync(file, newContent);
  touched++;
}

console.log(`Breed pages with related-breeds module: ${touched}${DRY_RUN ? ' (dry-run)' : ''}`);
console.log(`Breeds with no page on disk (skipped):  ${missing}`);
console.log(`Other skips:                            ${skipped}`);
