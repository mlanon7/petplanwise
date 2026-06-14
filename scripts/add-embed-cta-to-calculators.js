// Insert a compact "embed this calculator free" callout before </main> on the
// three calculator pages. Targets the exact audience who would embed the widget
// (people running pet sites), and gives the indexable /embed/ landing page the
// internal links it needs for discovery + crawl equity.
//
// Inline-styled, no site.css/cache-bust dependency. Idempotent.
// Run from project root: node scripts/add-embed-cta-to-calculators.js

const fs = require('fs');

const PAGES = ['dog-cost-calculator', 'cat-cost-calculator', 'vet-bill-calculator'];
const MARK = '<!-- embed-cta -->';

const block =
`  <section><div class="container">${MARK}
    <div style="border:1px solid var(--border,#E5E7EB);border-left:4px solid #0F766E;border-radius:10px;padding:16px 20px;background:rgba(15,118,110,0.04);max-width:var(--readw);">
      <strong>Run a pet blog, shelter, or rescue site?</strong>
      <p style="margin:6px 0 0;font-size:15px;">Put this calculator on your own pages for free — one copy-paste snippet, no signup, no API key. <a href="/embed/">Get the free embed code &rarr;</a></p>
    </div>
  </div></section>
`;

let done = 0;
for (const p of PAGES) {
  const file = `${p}/index.html`;
  if (!fs.existsSync(file)) { console.log(`  MISS ${file}`); continue; }
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(MARK)) { console.log(`  skip ${file} (already has CTA)`); continue; }
  const idx = html.lastIndexOf('</main>');
  if (idx === -1) { console.log(`  WARN ${file}: no </main>`); continue; }
  html = html.slice(0, idx) + block + html.slice(idx);
  fs.writeFileSync(file, html);
  console.log(`  added CTA -> ${file}`);
  done++;
}
console.log(`\nEmbed CTA added to ${done} calculator page(s).`);
