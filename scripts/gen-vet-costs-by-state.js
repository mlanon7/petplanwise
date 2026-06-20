// One-shot generator: /guides/vet-costs-by-state/ — the linkable 50-state
// vet-cost comparison table. Every dollar figure is computed from the CSVs
// (state-multipliers.csv x procedures.csv / base-costs.csv) so the page can
// never drift from the data layer. Re-run after a CSV change to refresh.
//
// Usage: node scripts/gen-vet-costs-by-state.js

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const CSV = f => fs.readFileSync(path.join(ROOT, 'assets/data/csv', f), 'utf8');

// --- parse the simple CSVs (no quoted commas in these files) ---
function rows(text) {
  return text.trim().split(/\r?\n/).map(l => l.split(','));
}

const multipliers = rows(CSV('state-multipliers.csv')).slice(1)
  .filter(r => r.length >= 2)
  .map(([abbr, m]) => ({ abbr, m: parseFloat(m) }));

const procs = rows(CSV('procedures.csv')).slice(1);
const proc = key => {
  const r = procs.find(p => p[0] === key);
  return { low: +r[2], typical: +r[3], high: +r[4] };
};
const exam = proc('physical_exam');        // 80 / 150 / 300
const er = proc('emergency_exam');         // 100 / 200 / 400
const dental = proc('dental_cleaning');    // 200 / 600 / 1200

const base = rows(CSV('base-costs.csv')).slice(1);
const dogRoutine = base.find(r => r[0] === 'dog' && r[1] === 'routine_vet'); // 150/300/600
const dogAnnual = { low: +dogRoutine[2], typical: +dogRoutine[3], high: +dogRoutine[4] };

const STATE_NAMES = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
  CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia',
  HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa',
  KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland',
  MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri',
  MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey',
  NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota', OH:'Ohio',
  OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island', SC:'South Carolina',
  SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah', VT:'Vermont',
  VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin', WY:'Wyoming',
  DC:'Washington, D.C.'
};

// State hub pages that exist today (states/<slug>-pet-cost/)
const STATE_HUBS = new Set([
  'arizona','california','colorado','florida','georgia','illinois','indiana',
  'maryland','massachusetts','michigan','minnesota','missouri','nevada',
  'new-jersey','new-york','north-carolina','ohio','oklahoma','oregon',
  'pennsylvania','tennessee','texas','virginia','washington','wisconsin'
]);

const slug = name => name.toLowerCase().replace(/[.,]/g, '').replace(/\s+/g, '-');
const r5 = n => Math.round(n / 5) * 5;                 // round to nearest $5
const fmt = n => '$' + r5(n).toLocaleString('en-US');

const states = multipliers.map(({ abbr, m }) => {
  const name = STATE_NAMES[abbr];
  return {
    abbr, name, m,
    examLow: r5(exam.low * m), examTyp: r5(exam.typical * m), examHigh: r5(exam.high * m),
    erTyp: r5(er.typical * m), erLow: r5(er.low * m), erHigh: r5(er.high * m),
    annualTyp: r5(dogAnnual.typical * m),
    dentalTyp: r5(dental.typical * m),
  };
}).sort((a, b) => a.name.localeCompare(b.name));

const sorted = [...states].sort((a, b) => b.m - a.m);
const top5 = sorted.slice(0, 5);
const bottom5 = sorted.slice(-5).reverse();

const stateCell = s => {
  const sl = slug(s.name);
  return STATE_HUBS.has(sl)
    ? `<a href="/states/${sl}-pet-cost/">${s.name}</a>`
    : s.name;
};

const tableRows = states.map(s =>
  `        <tr><td data-v="${s.name}">${stateCell(s)}</td>` +
  `<td class="num" data-v="${s.m}">${Math.round(s.m * 100)}</td>` +
  `<td class="num" data-v="${s.examTyp}">${fmt(s.examLow)}–${fmt(s.examHigh)}</td>` +
  `<td class="num" data-v="${s.erTyp}">${fmt(s.erLow)}–${fmt(s.erHigh)}</td>` +
  `<td class="num" data-v="${s.annualTyp}">${fmt(s.annualTyp)}</td></tr>`
).join('\n');

const list5 = arr => arr.map(s =>
  `${s.name} (index ${Math.round(s.m * 100)}, typical exam ~${fmt(s.examTyp)})`).join(', ');

const NATIONAL = `$${exam.typical} for a routine exam, $${er.typical} for an after-hours ER exam, and about $${dogAnnual.typical}/year in routine vet care for a dog`;

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Vet Costs by State (2026): All 50 States Compared | PetPlanWise</title>
  <meta name="description" content="Vet visit costs vary up to 50% by state. Compare routine exam, emergency, and annual vet costs across all 50 states + D.C. — sortable table, sourced data, free to cite." />
  <meta property="og:title" content="Vet Costs by State (2026): All 50 States Compared" />
  <meta property="og:description" content="Vet visit costs vary up to 50% by state. Compare routine exam, emergency, and annual vet costs across all 50 states + D.C. — sortable table, sourced data, free to cite." />
  <link rel="canonical" href="https://petplanwise.com/guides/vet-costs-by-state/" />
  <meta property="og:url" content="https://petplanwise.com/guides/vet-costs-by-state/" />
  <meta property="og:image" content="https://petplanwise.com/assets/og-image.png" />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta property="og:type" content="website" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="https://petplanwise.com/assets/og-image.png" />
  <meta name="twitter:title" content="Vet Costs by State (2026): All 50 States Compared" />
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%230F766E'/%3E%3Ctext x='50' y='66' font-family='system-ui,sans-serif' font-weight='700' font-size='58' fill='white' text-anchor='middle'%3E%24%3C/text%3E%3C/svg%3E" />

  <link rel="preconnect" href="https://fonts.googleapis.com" data-ppw-inter>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin data-ppw-inter>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" data-ppw-inter>
  <link rel="stylesheet" href="/assets/css/site.css?v=20260516z" />
  <script src="/assets/data/csv-loader-20260516z.js" defer></script>
  <script src="/assets/js/layout-20260516z.js" defer></script>
  <script src="/assets/js/calculator-20260516z.js" defer></script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://petplanwise.com/"},{"@type":"ListItem","position":2,"name":"Guides","item":"https://petplanwise.com/guides/"},{"@type":"ListItem","position":3,"name":"Vet costs by state","item":"https://petplanwise.com/guides/vet-costs-by-state/"}]}</script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Which state has the most expensive vet care?","acceptedAnswer":{"@type":"Answer","text":"Washington, D.C. has the highest veterinary costs in the U.S. (about 32% above the national average), followed by New York and Hawaii (~30% above), California (~28%), and Massachusetts (~22%). A routine exam that averages $${exam.typical} nationally runs ${fmt(top5[4].examTyp)}–${fmt(top5[0].examTyp)} typical in these markets."}},{"@type":"Question","name":"Which state has the cheapest vet care?","acceptedAnswer":{"@type":"Answer","text":"Mississippi has the lowest veterinary costs (about 12% below the national average), followed by Arkansas, Oklahoma, and West Virginia (~10% below). A routine exam in these states typically costs around ${fmt(bottom5[0].examTyp)}."}},{"@type":"Question","name":"How much does a vet visit cost in my state?","acceptedAnswer":{"@type":"Answer","text":"Nationally, a routine vet exam runs $${exam.low}–$${exam.high} ($${exam.typical} typical). Multiply by your state's cost index: in California (index 128) a typical exam is about ${fmt(exam.typical * 1.28)}, while in Mississippi (index 88) it is about ${fmt(exam.typical * 0.88)}. The full sortable table on this page lists all 50 states plus D.C."}},{"@type":"Question","name":"Why do vet costs vary so much by state?","acceptedAnswer":{"@type":"Answer","text":"Veterinary pricing tracks local cost of living: clinic rent, staff wages, and insurance overhead are all higher in coastal metros. Demand also matters — dense urban areas support more specialty and emergency hospitals, which price higher than rural general practices. The spread between the cheapest and most expensive states is roughly 50%."}},{"@type":"Question","name":"How were these numbers calculated?","acceptedAnswer":{"@type":"Answer","text":"Each state figure is a national benchmark cost (sourced from AAHA guidance, CareCredit published procedure ranges, and BLS CPI veterinary-services data) multiplied by a state cost index derived from regional cost-of-living differences. Figures are planning ranges, not quotes — individual clinics vary."}}]}</script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Dataset","name":"U.S. Veterinary Costs by State (2026)","description":"Comparison of routine vet exam, emergency exam, and annual routine veterinary care costs across all 50 U.S. states and Washington, D.C., indexed to the national average.","url":"https://petplanwise.com/guides/vet-costs-by-state/","keywords":["vet costs by state","veterinary prices","pet care costs","vet visit cost"],"license":"https://creativecommons.org/licenses/by/4.0/","creator":{"@type":"Organization","name":"PetPlanWise","url":"https://petplanwise.com/"},"temporalCoverage":"2026","spatialCoverage":{"@type":"Place","name":"United States"}}</script>
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Article","headline":"Vet Costs by State (2026): All 50 States Compared","datePublished":"2026-06-11","dateModified":"2026-06-11","author":{"@type":"Organization","name":"PetPlanWise Editorial","url":"https://petplanwise.com/about/"},"publisher":{"@type":"Organization","name":"PetPlanWise","url":"https://petplanwise.com/","logo":{"@type":"ImageObject","url":"https://petplanwise.com/assets/og-image.png"}},"mainEntityOfPage":"https://petplanwise.com/guides/vet-costs-by-state/","image":"https://petplanwise.com/assets/og-image.png"}</script>
</head>
<body>
<div id="site-header"></div>
<main>
  <div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/guides/">Guides</a><span>›</span>Vet costs by state</nav></div>
  <section style="padding: 24px 0 12px;"><div class="container">
    <span class="eyebrow">Data · All 50 states</span>
    <h1>Vet costs by state: all 50 states compared</h1>
    <p class="last-updated-stamp last-updated-static">Last updated: <strong>June 2026</strong> · <a href="/about/">Methodology</a> · <a href="/sources/">Sources</a></p>
    <p class="lede prose">Veterinary prices vary by roughly <strong>50%</strong> across the U.S. The national benchmarks are ${NATIONAL} — but the same visit costs <strong>${fmt(exam.typical * sorted[0].m)}</strong> typical in ${sorted[0].name} and <strong>${fmt(exam.typical * sorted[sorted.length - 1].m)}</strong> in ${sorted[sorted.length - 1].name}. The sortable table below compares every state, indexed to the national average (index 100).</p>
  </div></section>

  <section><div class="container prose">
    <h2>Vet cost comparison table (2026)</h2>
    <p>Click any column header to sort. The cost index expresses each state relative to the national average (100). Ranges are planning estimates — low to high for a typical clinic in that state, not quotes.</p>
    <div style="overflow-x:auto;">
    <table class="cost-table" id="state-cost-table">
      <thead><tr>
        <th data-sort role="button" tabindex="0" style="cursor:pointer;">State ↕</th>
        <th data-sort class="num" role="button" tabindex="0" style="cursor:pointer;">Cost index ↕</th>
        <th data-sort class="num" role="button" tabindex="0" style="cursor:pointer;">Routine exam ↕</th>
        <th data-sort class="num" role="button" tabindex="0" style="cursor:pointer;">ER exam ↕</th>
        <th data-sort class="num" role="button" tabindex="0" style="cursor:pointer;">Annual routine vet care (dog) ↕</th>
      </tr></thead>
      <tbody>
        <tr style="background:rgba(15,118,110,0.07);font-weight:600;"><td data-v="0">United States (average)</td><td class="num" data-v="1">100</td><td class="num" data-v="${exam.typical}">$${exam.low}–$${exam.high}</td><td class="num" data-v="${er.typical}">$${er.low}–$${er.high}</td><td class="num" data-v="${dogAnnual.typical}">$${dogAnnual.typical}</td></tr>
${tableRows}
      </tbody>
    </table>
    </div>
    <p class="muted" style="font-size:14px;">Annual routine vet care covers wellness exams, core vaccines, and routine bloodwork for a healthy adult dog — it excludes emergencies, dental cleanings, and chronic conditions. Cat routine care runs roughly 20% less. Estimate your own total in the <a href="/dog-cost-calculator/">dog</a> or <a href="/cat-cost-calculator/">cat cost calculator</a>.</p>

    <h2>The most and least expensive states for vet care</h2>
    <ul>
      <li><strong>Most expensive:</strong> ${list5(top5)}.</li>
      <li><strong>Least expensive:</strong> ${list5(bottom5)}.</li>
    </ul>
    <p>The spread is driven by clinic rent, veterinary staff wages, and the mix of practices: dense coastal metros support more 24-hour ER and specialty hospitals, which price above general practices. Within a state, cities run above the state index and rural areas below it — see the individual <a href="/states/">state cost pages</a> for city-level detail.</p>

    <h2>What this means for your budget</h2>
    <ul>
      <li><strong>Routine care scales with your state.</strong> Budget the national $${dogAnnual.low}–$${dogAnnual.high}/year for a dog's routine vet care, then adjust by your state's index.</li>
      <li><strong>Emergencies scale harder.</strong> An <a href="/guides/emergency-vet-visit-cost/">ER visit</a> starts at the exam fee above before any treatment — a <a href="/guides/pet-surgery-cost/">surgery</a> or hospitalization multiplies the state gap into thousands of dollars.</li>
      <li><strong>Insurance premiums follow the same geography.</strong> Insurers price by ZIP code, so high-index states also pay more per month — compare in the <a href="/pet-insurance-vs-savings/">insurance vs. savings calculator</a>.</li>
    </ul>

    <div style="border:1px solid var(--border, #E5E7EB); border-left:4px solid #0F766E; border-radius:8px; padding:16px 20px; margin:28px 0; background:rgba(15,118,110,0.04);">
      <strong>Cite or share this data</strong>
      <p style="margin:8px 0 6px; font-size:15px;">This table is free to reference, quote, or reproduce with attribution. Suggested citation:</p>
      <p style="margin:0; font-size:14px; font-style:italic;">PetPlanWise, &ldquo;Vet Costs by State (2026)&rdquo; — petplanwise.com/guides/vet-costs-by-state/</p>
    </div>

    <h2>Related cost guides</h2>
    <ul>
      <li><a href="/guides/vet-visit-cost-without-insurance/">Vet visit cost without insurance</a> — the full out-of-pocket picture.</li>
      <li><a href="/guides/emergency-vet-visit-cost/">Emergency vet visit cost</a> — what the ER exam fee leads to.</li>
      <li><a href="/guides/why-are-vet-bills-so-expensive-in-2026/">Why are vet bills so expensive?</a> — the inflation behind these numbers.</li>
      <li><a href="/vet-bill-calculator/">Vet bill calculator</a> — build a procedure-level estimate.</li>
    </ul>
  </div></section>

  <section><div class="container">
    <h2>FAQ</h2>
    <div class="faq" style="max-width: var(--readw)">
      <details><summary>Which state has the most expensive vet care?</summary><p>Washington, D.C. (about 32% above the national average), followed by New York, Hawaii, California, and Massachusetts. A routine exam in these markets typically runs ${fmt(top5[4].examTyp)}–${fmt(top5[0].examTyp)}.</p></details>
      <details><summary>Which state has the cheapest vet care?</summary><p>Mississippi (about 12% below the national average), followed by Arkansas, Oklahoma, and West Virginia. A typical routine exam there costs around ${fmt(bottom5[0].examTyp)}.</p></details>
      <details><summary>How much does a vet visit cost in my state?</summary><p>Find your state in the table above — the routine-exam column shows the low–high range for a standard wellness visit. Nationally it is $${exam.low}–$${exam.high}, with $${exam.typical} typical.</p></details>
      <details><summary>Why do vet costs vary so much by state?</summary><p>Clinic rent, staff wages, insurance overhead, and the local mix of specialty/ER hospitals all track regional cost of living. The cheapest-to-most-expensive spread is roughly 50%.</p></details>
      <details><summary>How were these numbers calculated?</summary><p>National benchmark costs (AAHA guidance, CareCredit published ranges, BLS CPI veterinary-services data) multiplied by a per-state cost index derived from regional cost-of-living differences. Planning ranges, not quotes.</p></details>
    </div>
  </div></section>

  <section><div class="container" style="padding: 12px 0 8px;">
    <div class="reviewer-block">
        <span class="avatar" aria-hidden="true">PC</span>
        <div>
          <div class="who">Fact-checked by PetPlanWise Editorial</div><div class="who-meta" style="font-size:12px;color:var(--muted, #6B7280);font-weight:400;margin-top:2px;">Cost methodology cross-referenced with published AAHA, AVMA, NAPHIA, and Banfield data. <a href="/editorial-standards/">Read our editorial standards</a> — no individual veterinarian endorsement.</div>
          <div class="meta">Cost data reviewed June 2026 · methodology audited quarterly</div>
        </div>
      </div>
  </div></section>

<section><div class="container sources">
    <h2>Sources</h2>
    <ul>
      <li><a href="https://www.bls.gov/cpi/" rel="noopener" target="_blank">BLS CPI — veterinary services</a></li>
      <li><a href="https://www.carecredit.com/vetmed/costs/" rel="noopener" target="_blank">CareCredit — published veterinary procedure cost ranges</a></li>
      <li><a href="https://www.aaha.org/aaha-guidelines/2019-aaha-canine-life-stage-guidelines/" rel="noopener" target="_blank">AAHA Canine Life Stage Guidelines</a></li>
      <li><a href="https://www.avma.org/resources-tools/pet-owners/petcare" rel="noopener" target="_blank">AVMA — Pet care &amp; veterinary services</a></li>
    </ul>
  </div></section>
</main>
<div id="site-footer"></div>
<script>
(function () {
  var table = document.getElementById('state-cost-table');
  if (!table) return;
  var tbody = table.tBodies[0];
  var dirs = {};
  table.querySelectorAll('th[data-sort]').forEach(function (th, idx) {
    function sortBy() {
      var dir = dirs[idx] = -(dirs[idx] || -1);
      var rows = Array.prototype.slice.call(tbody.rows, 1); // keep US-average row pinned
      rows.sort(function (a, b) {
        var av = a.cells[idx].getAttribute('data-v'), bv = b.cells[idx].getAttribute('data-v');
        var an = parseFloat(av), bn = parseFloat(bv);
        if (!isNaN(an) && !isNaN(bn)) return (an - bn) * dir;
        return av.localeCompare(bv) * dir;
      });
      rows.forEach(function (r) { tbody.appendChild(r); });
    }
    th.addEventListener('click', sortBy);
    th.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); sortBy(); } });
  });
})();
</script>
</body>
</html>
`;

const outDir = path.join(ROOT, 'guides', 'vet-costs-by-state');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), html);
console.log('Wrote guides/vet-costs-by-state/index.html');
console.log('Top 5:', list5(top5));
console.log('Bottom 5:', list5(bottom5));
console.log('States in table:', states.length);
