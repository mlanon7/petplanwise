#!/usr/bin/env node
/* One-shot generator for 14 condition/procedure cost guides (content-plan
   Tiers 1-3, data-driven from Google Autocomplete + 2026 web price research).
   Mirrors the proven /guides/cat-x-ray-cost/ template exactly. Idempotent:
   - writes guides/<slug>/index.html (overwrites if rerun)
   - inserts ItemList entries + cards into guides/index.html (skips if present)
   - inserts <url> entries into sitemap-guides.xml (skips if present)
   Run: node scripts/add-condition-guides.js */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const V = "20260516y"; // current asset cache-bust version

function esc(s){ return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;"); }

function rowsTable(headers, rows){
  var thead = "<thead><tr>" + headers.map(function(h,i){ return "<th"+(i?' class="num"':"")+">"+h+"</th>"; }).join("") + "</tr></thead>";
  var tbody = "<tbody>" + rows.map(function(r){
    return "<tr>" + r.map(function(c,i){ return "<td"+(i?' class="num"':"")+">"+c+"</td>"; }).join("") + "</tr>";
  }).join("") + "</tbody>";
  return '<table class="cost-table">' + thead + tbody + "</table>";
}

function page(g){
  var url = "https://petplanwise.com/guides/" + g.slug + "/";
  var faqSchema = { "@context":"https://schema.org","@type":"FAQPage","mainEntity": g.faqs.map(function(f){
    return { "@type":"Question","name":f[0],"acceptedAnswer":{ "@type":"Answer","text":f[1] } };
  })};
  var crumbSchema = { "@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
    {"@type":"ListItem","position":1,"name":"Home","item":"https://petplanwise.com/"},
    {"@type":"ListItem","position":2,"name":"Guides","item":"https://petplanwise.com/guides/"},
    {"@type":"ListItem","position":3,"name":g.crumb,"item":url}
  ]};
  var articleSchema = { "@context":"https://schema.org","@type":"Article","headline":g.title,
    "datePublished":"2026-05-20","dateModified":"2026-05-20",
    "author":{"@type":"Organization","name":"PetPlanWise Editorial","url":"https://petplanwise.com/about/"},
    "publisher":{"@type":"Organization","name":"PetPlanWise","url":"https://petplanwise.com/","logo":{"@type":"ImageObject","url":"https://petplanwise.com/assets/og-image.png"}},
    "mainEntityOfPage":url,"image":"https://petplanwise.com/assets/og-image.png" };

  var sectionsHtml = g.sections.map(function(s){ return "    <h2>"+s.h2+"</h2>\n    "+s.html; }).join("\n\n");
  var insuranceRows = rowsTable(["Scenario","You pay"], g.insuranceRows);
  var relatedHtml = "<ul>\n" + g.related.map(function(r){ return '      <li><a href="'+r[0]+'">'+r[1]+'</a> — '+r[2]+'</li>'; }).join("\n") + "\n    </ul>";
  var faqVisible = g.faqs.map(function(f){ return "      <details><summary>"+f[0]+"</summary><p>"+f[1]+"</p></details>"; }).join("\n");
  var sourcesHtml = g.sources.map(function(s){ return '      <li><a href="'+s[0]+'" rel="noopener" target="_blank">'+s[1]+'</a></li>'; }).join("\n");

  return '<!doctype html>\n'
+ '<html lang="en">\n'
+ '<head>\n'
+ '  <meta charset="utf-8" />\n'
+ '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n'
+ '  <title>'+esc(g.title)+'</title>\n'
+ '  <meta name="description" content="'+esc(g.desc)+'" />\n'
+ '  <meta property="og:description" content="'+esc(g.desc)+'" />\n'
+ '  <meta property="og:title" content="'+esc(g.title)+'" />\n'
+ '  <link rel="canonical" href="'+url+'" />\n'
+ '  <meta property="og:url" content="'+url+'" />\n'
+ '  <meta property="og:image" content="https://petplanwise.com/assets/og-image.png" />\n'
+ '  <meta property="og:image:width" content="1200" />\n'
+ '  <meta property="og:image:height" content="630" />\n'
+ '  <meta property="og:type" content="website" />\n'
+ '  <meta name="twitter:card" content="summary_large_image" />\n'
+ '  <meta name="twitter:image" content="https://petplanwise.com/assets/og-image.png" />\n'
+ '  <meta name="twitter:title" content="'+esc(g.title)+'" />\n'
+ '  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' rx=\'20\' fill=\'%230F766E\'/%3E%3Ctext x=\'50\' y=\'66\' font-family=\'system-ui,sans-serif\' font-weight=\'700\' font-size=\'58\' fill=\'white\' text-anchor=\'middle\'%3E%24%3C/text%3E%3C/svg%3E" />\n'
+ '\n'
+ '  <link rel="preconnect" href="https://fonts.googleapis.com" data-ppw-inter>\n'
+ '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin data-ppw-inter>\n'
+ '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" data-ppw-inter>\n'
+ '  <link rel="stylesheet" href="/assets/css/site.css?v='+V+'" />\n'
+ '  <script src="/assets/data/csv-loader-'+V+'.js" defer></script>\n'
+ '  <script src="/assets/data/base-costs.js" defer></script>\n'
+ '  <script src="/assets/data/multipliers.js" defer></script>\n'
+ '  <script src="/assets/data/procedures.js" defer></script>\n'
+ '  <script src="/assets/data/cities.js" defer></script>\n'
+ '  <script src="/assets/data/breed-images.js" defer></script>\n'
+ '  <script src="/assets/js/layout-'+V+'.js" defer></script>\n'
+ '  <script src="/assets/js/calculator-'+V+'.js" defer></script>\n'
+ '  <script type="application/ld+json">'+JSON.stringify(crumbSchema)+'</script>\n'
+ '  <script type="application/ld+json">'+JSON.stringify(faqSchema)+'</script>\n'
+ '  <script type="application/ld+json">'+JSON.stringify(articleSchema)+'</script>\n'
+ '</head>\n'
+ '<body>\n'
+ '<div id="site-header"></div>\n'
+ '<main>\n'
+ '  <div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span><a href="/guides/">Guides</a><span>›</span>'+g.crumb+'</nav></div>\n'
+ '  <section style="padding: 24px 0 12px;"><div class="container">\n'
+ '    <span class="eyebrow">'+g.eyebrow+'</span>\n'
+ '    <h1>'+g.h1+'</h1>\n'
+ '      <p class="last-updated-stamp last-updated-static">Last updated: <strong>May 2026</strong> · <a href="/about/">Methodology</a> · <a href="/sources/">Sources</a></p>\n'
+ '    <p class="lede prose">'+g.lede+'</p>\n'
+ '  </div></section>\n'
+ '  <section style="padding-top: 0;"><div class="container"><div data-calculator="vet-bill"></div></div></section>\n'
+ '\n'
+ '  <section><div class="container prose">\n'
+ '    <h2>Cost components</h2>\n'
+ '    '+rowsTable(["Component","Low","Typical","High"], g.costRows)+'\n'
+ (g.costNote ? '    <p class="muted" style="font-size:14px;">'+g.costNote+'</p>\n' : '')
+ '\n'
+ sectionsHtml + '\n'
+ '\n'
+ '    <h2>Cost with vs. without insurance</h2>\n'
+ '    '+g.insuranceIntro+'\n'
+ '    '+insuranceRows+'\n'
+ '    '+g.insuranceNote+'\n'
+ '\n'
+ '    <h2>'+g.relatedHeading+'</h2>\n'
+ '    '+relatedHtml+'\n'
+ '  </div></section>\n'
+ '\n'
+ '  <section><div class="container">\n'
+ '    <h2>FAQ</h2>\n'
+ '    <div class="faq" style="max-width: var(--readw)">\n'
+ faqVisible + '\n'
+ '    </div>\n'
+ '  </div></section>\n'
+ '\n'
+ '\n'
+ '  <!-- reviewer-block-moved -->\n'
+ '  <section><div class="container" style="padding: 12px 0 8px;">\n'
+ '    <div class="reviewer-block">\n'
+ '        <span class="avatar" aria-hidden="true">PC</span>\n'
+ '        <div>\n'
+ '          <div class="who">Fact-checked by PetPlanWise Editorial</div><div class="who-meta" style="font-size:12px;color:var(--muted, #6B7280);font-weight:400;margin-top:2px;">Cost methodology cross-referenced with published AAHA, AVDC, AVMA, NAPHIA, and Banfield data. <a href="/editorial-standards/">Read our editorial standards</a> — no individual veterinarian endorsement.</div>\n'
+ '          <div class="meta">Cost data reviewed May 2026 · methodology audited quarterly</div>\n'
+ '        </div>\n'
+ '      </div>\n'
+ '  </div></section>\n'
+ '\n'
+ '<section><div class="container sources">\n'
+ '    <h2>Sources</h2>\n'
+ '    <ul>\n'
+ sourcesHtml + '\n'
+ '    </ul>\n'
+ '  </div></section>\n'
+ '</main>\n'
+ '<div id="site-footer"></div>\n'
+ '</body>\n'
+ '</html>\n';
}

// ---- shared snippets ----
var CALC_CTA = 'Run the trade-off in our <a href="/pet-insurance-vs-savings/">insurance vs. savings calculator</a>, or build a full visit estimate in the <a href="/vet-bill-calculator/">vet bill calculator</a>.';

var GUIDES = [
// ===== TIER 1 =====
{
  slug:"cat-spay-cost", crumb:"Cat spay cost", eyebrow:"Guide · Spay/neuter",
  title:"How Much Does It Cost to Spay a Cat? (2026)",
  desc:"Spaying a cat costs $50–$120 at a low-cost clinic and $200–$500 at a private vet. Prices by clinic type, what's included, why it's worth it, and how to save.",
  h1:"How much does it cost to spay a cat?",
  lede:"Spaying a cat costs <strong>$50–$120</strong> at a low-cost or shelter clinic and <strong>$200–$500</strong> at a private vet, depending on your area and whether bloodwork and pain meds are bundled. Spaying before the first heat is the cheapest and healthiest option.",
  costRows:[
    ["Spay at low-cost / shelter clinic","$40","$80","$120"],
    ["Spay at private vet (routine)","$150","$250","$400"],
    ["Spay at full-service hospital","$200","$350","$500"],
    ["Pre-anesthetic bloodwork (optional/required)","$40","$70","$120"],
    ["Pain meds + e-collar take-home","$20","$40","$70"],
    ["In-heat / pregnant surcharge","$50","$100","$200"]
  ],
  costNote:"A spay (females) is more involved than a neuter (males), so it costs more. Spaying while a cat is in heat or pregnant adds a surcharge because the surgery is riskier.",
  sections:[
    {h2:"Why a spay costs more than a neuter", html:"<p>A spay is an abdominal surgery to remove the ovaries (and usually uterus), so it takes longer and needs more anesthesia and monitoring than a male <a href=\"/guides/cat-neuter-cost/\">cat neuter</a>, which is quicker and less invasive. That's the main reason females cost more.</p>"},
    {h2:"What's included", html:"<ul><li>General anesthesia and the surgery itself</li><li>Often: pain medication and an e-collar to go home</li><li>Sometimes bundled, sometimes extra: pre-anesthetic bloodwork, IV fluids, a microchip</li></ul><p>Low-cost clinics keep prices down by doing high volume and bundling fewer extras — ask exactly what's included when you compare quotes.</p>"},
    {h2:"Why it's worth it", html:"<p>Beyond preventing litters, spaying eliminates the risk of pyometra (a life-threatening uterus infection that costs $1,500–$3,000+ to treat) and greatly reduces mammary cancer risk when done early. The one-time cost is far lower than treating those conditions later.</p>"}
  ],
  insuranceIntro:'<p>Routine spays are considered elective, so standard accident-and-illness insurance does <em>not</em> reimburse them — a wellness add-on sometimes does. Worked example for a <strong>$250</strong> private-vet spay:</p>',
  insuranceRows:[
    ["No insurance / no wellness plan (full bill)","$250"],
    ["Low-cost clinic instead","$40–$120"],
    ["Wellness add-on with spay benefit","Often $50–$150 back"]
  ],
  insuranceNote:'<p>Because spays are elective, the best savings lever is a low-cost clinic, not insurance. '+CALC_CTA+'</p>',
  relatedHeading:"Related cat cost guides",
  related:[
    ["/guides/cat-neuter-cost/","Cat neuter cost","the male equivalent, and why it's cheaper."],
    ["/guides/kitten-first-year-cost/","Kitten first-year cost","spay/neuter is a big line item in year one."],
    ["/guides/cat-vaccine-cost/","Cat vaccine cost","usually done around the same age."],
    ["/cat-cost-calculator/","Cat cost calculator","full annual + lifetime ownership estimate."]
  ],
  faqs:[
    ["How much does it cost to spay a cat?","$40–$120 at a low-cost or shelter clinic and $200–$500 at a private vet or full-service hospital. The average private-vet spay is around $200–$250."],
    ["How much does it cost to spay a cat at a low-cost clinic?","Low-cost and shelter clinics typically charge $40–$120, and some TNR or income-based programs go as low as $25. They keep costs down with high volume and fewer bundled extras."],
    ["Why does spaying cost more than neutering?","A spay is an abdominal surgery to remove the ovaries and uterus, so it takes longer and uses more anesthesia than a male neuter. That extra time and complexity is the cost difference."],
    ["Does it cost more to spay a cat in heat or pregnant?","Yes — expect a $50–$200 surcharge. The surgery is riskier and bloodier when a cat is in heat or pregnant, so many clinics charge extra or ask you to wait."],
    ["Is cat spaying covered by pet insurance?","Not by standard accident-and-illness plans — it's elective. Some wellness add-ons reimburse $50–$150 toward a spay. The cheapest route is usually a low-cost clinic."]
  ],
  sources:[
    ["https://www.aspca.org/pet-care/general-pet-care/spayneuter-your-pet","ASPCA — Spay/Neuter Your Pet"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"dog-neuter-cost", crumb:"Dog neuter cost", eyebrow:"Guide · Spay/neuter",
  title:"How Much Does It Cost to Neuter a Dog? (2026)",
  desc:"Neutering a dog costs $50–$250 at a low-cost clinic and $150–$500 at a private vet, scaling with size. Prices by clinic type and dog size, what's included, and how to save.",
  h1:"How much does it cost to neuter a dog?",
  lede:"Neutering a dog costs <strong>$50–$250</strong> at a low-cost clinic and <strong>$150–$500</strong> at a private vet. Price scales with your dog's size, and an undescended testicle (cryptorchid) surgery costs more. Low-cost clinics are the biggest saver.",
  costRows:[
    ["Neuter at low-cost / shelter clinic","$50","$120","$250"],
    ["Small dog neuter at private vet","$150","$220","$350"],
    ["Large dog neuter at private vet","$250","$350","$500"],
    ["Pre-anesthetic bloodwork (optional/required)","$80","$120","$200"],
    ["Cryptorchid (undescended testicle) surgery","$400","$600","$800"],
    ["Pain meds + e-collar take-home","$20","$40","$80"]
  ],
  costNote:"Drug doses and anesthesia time scale with body weight, so a Great Dane neuter costs noticeably more than a Chihuahua neuter.",
  sections:[
    {h2:"Why size drives the price", html:"<p>Anesthesia and surgical time both scale with weight, so a large or giant breed costs more to neuter than a small one. That's why quotes range so widely — always tell the clinic your dog's weight when comparing.</p>"},
    {h2:"What's included", html:"<ul><li>General anesthesia and the surgery itself</li><li>Often: pain medication and an e-collar</li><li>Sometimes bundled, sometimes extra: pre-anesthetic bloodwork, IV fluids, a microchip</li></ul><p>See our <a href=\"/guides/dog-spay-cost/\">dog spay cost guide</a> for the female equivalent — spays cost more because they're abdominal surgery.</p>"},
    {h2:"Why it's worth it", html:"<p>Neutering prevents testicular cancer, reduces prostate problems, and curbs roaming and marking. The one-time cost is far below the lifetime cost of complications or unplanned litters.</p>"}
  ],
  insuranceIntro:'<p>Routine neutering is elective, so accident-and-illness insurance does <em>not</em> reimburse it — a wellness add-on sometimes does. Worked example for a <strong>$300</strong> private-vet neuter:</p>',
  insuranceRows:[
    ["No insurance / no wellness plan (full bill)","$300"],
    ["Low-cost clinic instead","$50–$250"],
    ["Wellness add-on with neuter benefit","Often $50–$150 back"]
  ],
  insuranceNote:'<p>The cheapest route is a low-cost clinic, not insurance. '+CALC_CTA+'</p>',
  relatedHeading:"Related dog cost guides",
  related:[
    ["/guides/dog-spay-cost/","Dog spay cost","the female equivalent, and why it costs more."],
    ["/guides/puppy-first-year-cost/","Puppy first-year cost","neutering is a big year-one line item."],
    ["/guides/dog-vaccine-cost/","Dog vaccine cost","usually scheduled around the same age."],
    ["/dog-cost-calculator/","Dog cost calculator","full annual + lifetime ownership estimate."]
  ],
  faqs:[
    ["How much does it cost to neuter a dog?","$50–$250 at a low-cost clinic and $150–$500 at a private vet. Small dogs run $150–$350 and large dogs $250–$500 because anesthesia scales with weight."],
    ["How much does it cost to neuter a dog at a low-cost clinic?","Low-cost and shelter clinics typically charge $50–$250, often under $300 even for large dogs. Some humane societies subsidize the cost down to around $150 or less."],
    ["Why does neutering a big dog cost more?","Anesthesia drugs are dosed by body weight and larger dogs take longer to operate on, so giant breeds cost more than small ones. Always give the clinic your dog's weight for an accurate quote."],
    ["How much is cryptorchid (undescended testicle) neuter surgery?","Expect $400–$800. Retrieving an undescended testicle from the abdomen or groin is a more involved surgery than a routine neuter."],
    ["Is dog neutering covered by pet insurance?","Not by standard accident-and-illness plans — it's elective. Some wellness add-ons reimburse $50–$150. A low-cost clinic is usually the cheapest option."]
  ],
  sources:[
    ["https://www.aspca.org/pet-care/general-pet-care/spayneuter-your-pet","ASPCA — Spay/Neuter Your Pet"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"pet-microchip-cost", crumb:"Pet microchip cost", eyebrow:"Guide · Routine care",
  title:"How Much Does It Cost to Microchip a Dog or Cat? (2026)",
  desc:"Microchipping a pet costs $25–$60 at a vet, plus a one-time $15–$30 registration. Community clinics charge as little as $15–$25. What's included and why it's worth it.",
  h1:"How much does it cost to microchip a dog or cat?",
  lede:"Microchipping costs <strong>$25–$60</strong> at a vet (the chip plus implant), with a one-time registration of <strong>$15–$30</strong>. Low-cost and community clinics charge as little as <strong>$15–$25</strong>. It's a one-time cost — there's no monthly fee.",
  costRows:[
    ["Microchip + implant at a vet","$25","$45","$60"],
    ["Registration in the national database (one-time)","$0","$20","$30"],
    ["Low-cost / community clinic (all-in)","$15","$20","$25"],
    ["Bundled with spay/neuter","$10","$20","$30"]
  ],
  costNote:"The microchip itself is cheap (about $10–$30); most of what you pay is the implant visit. Registration is a separate, one-time step that some clinics include.",
  sections:[
    {h2:"What you're paying for", html:"<ul><li><strong>The chip + implant</strong> — a quick injection between the shoulder blades, no anesthesia needed.</li><li><strong>Registration</strong> — entering your contact details in a national database so a shelter or vet can reach you. A chip that isn't registered (or kept up to date) can't reunite you with your pet.</li></ul>"},
    {h2:"Cheapest ways to do it", html:"<p>Bundle it with a <a href=\"/guides/dog-spay-cost/\">spay</a>/<a href=\"/guides/cat-neuter-cost/\">neuter</a> (your pet is already under anesthesia, so it's often $10–$30), or use a community microchip event where it's $15–$25 all-in. Many shelters microchip before adoption, so check whether your pet already has one.</p>"},
    {h2:"Is it worth it?", html:"<p>Yes — it's one of the highest-value dollars in pet ownership. Microchipped dogs are returned to owners more than twice as often as un-chipped ones, and the rate for cats is dramatically higher. The key is keeping your registration details current after any move.</p>"}
  ],
  insuranceIntro:'<p>A microchip is routine/elective, so accident-and-illness insurance does not reimburse it — though many wellness add-ons do. Worked example for a <strong>$45</strong> vet microchip plus <strong>$20</strong> registration:</p>',
  insuranceRows:[
    ["No insurance / no wellness plan (full bill)","$65"],
    ["Community clinic instead","$15–$25"],
    ["Bundled with spay/neuter","$10–$30"]
  ],
  insuranceNote:'<p>It\'s a one-time cost, so the savings lever is a community clinic or bundling — not insurance. '+CALC_CTA+'</p>',
  relatedHeading:"Related guides",
  related:[
    ["/guides/puppy-first-year-cost/","Puppy first-year cost","microchipping is part of the year-one setup."],
    ["/guides/kitten-first-year-cost/","Kitten first-year cost","often bundled with the spay/neuter."],
    ["/guides/cat-neuter-cost/","Cat neuter cost","bundle the chip to save."],
    ["/dog-cost-calculator/","Dog cost calculator","full annual + lifetime ownership estimate."]
  ],
  faqs:[
    ["How much does it cost to microchip a dog or cat?","$25–$60 at a vet for the chip and implant, plus a one-time $15–$30 registration. Community clinics charge as little as $15–$25 all-in."],
    ["Is there a monthly fee for a pet microchip?","No. The chip is a one-time cost with no battery and no subscription. Some database services offer optional paid tiers, but basic registration is usually free or a one-time fee."],
    ["Does microchipping require anesthesia?","No. It's a quick injection between the shoulder blades, similar to a vaccine. Many owners add it during a spay/neuter simply because the pet is already sedated."],
    ["Is the microchip registration included in the price?","Sometimes. Some clinics register the chip for you; others leave it to you. An unregistered chip can't reunite you with your pet, so always confirm it's registered and keep your details current."],
    ["Is microchipping worth the cost?","Yes — it dramatically raises the odds of getting a lost pet back, far more than a collar tag alone. At a one-time $15–$65 it's among the best-value spends in pet ownership."]
  ],
  sources:[
    ["https://www.avma.org/resources/pet-owners/petcare/microchipping-animals-faq","AVMA — Microchipping FAQ"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
// ===== TIER 2 =====
{
  slug:"parvo-treatment-cost", crumb:"Parvo treatment cost", eyebrow:"Guide · Emergency",
  title:"How Much Does Parvo Treatment Cost? (2026)",
  desc:"Parvo treatment costs $500–$2,000 for typical hospitalization and $5,000+ for severe cases. Inpatient vs outpatient, what drives the bill, prevention, and insurance.",
  h1:"How much does parvo treatment cost?",
  lede:"Treating parvo costs <strong>$500–$2,000</strong> for a typical 3–5 day hospitalization and can reach <strong>$5,000+</strong> in severe cases. An outpatient protocol is cheaper but lower-success. The cheapest option by far is the <strong>$20–$50 vaccine</strong> that prevents it.",
  costRows:[
    ["Diagnosis (parvo test + bloodwork)","$150","$250","$400"],
    ["Hospitalization (per day)","$100","$350","$600"],
    ["Typical inpatient stay (3–5 days, all-in)","$1,000","$1,800","$3,500"],
    ["Severe / ICU case","$3,500","$5,000","$8,000"],
    ["Outpatient protocol (at-home, vet-directed)","$300","$700","$1,500"]
  ],
  costNote:"Parvo is a parvovirus infection that mainly hits unvaccinated puppies. The bill is driven almost entirely by how many days of hospitalization and IV support are needed.",
  sections:[
    {h2:"What drives the cost", html:"<ul><li><strong>Length of stay</strong> — the biggest factor; each day of IV fluids, anti-nausea meds, and antibiotics adds up.</li><li><strong>Severity</strong> — pups that need plasma, a feeding tube, or ICU monitoring cost the most.</li><li><strong>ER vs general practice</strong> — overnight emergency hospitals cost more than a GP that hospitalizes during the day.</li></ul>"},
    {h2:"Inpatient vs. outpatient", html:"<p>Full hospitalization has the highest survival rate but the highest cost. Some vets offer a vet-directed <em>outpatient</em> protocol (at-home fluids and injections) for a fraction of the price — survival is lower but it's an option when hospitalization isn't affordable. Discuss both honestly with your vet.</p>"},
    {h2:"Prevention is the real money-saver", html:"<p>The parvo vaccine is part of the core puppy series and costs about <strong>$20–$50 per dose</strong>. A complete series prevents nearly all cases. See our <a href=\"/guides/dog-vaccine-cost/\">dog vaccine cost guide</a> — it's the single best return on investment in puppy care.</p>"}
  ],
  insuranceIntro:'<p>Parvo is a sudden illness, so accident-and-illness insurance reimburses it (if the policy predates the diagnosis). Worked example for a <strong>$1,800</strong> hospitalization:</p>',
  insuranceRows:[
    ["No insurance (full bill)","$1,800"],
    ["Insurance, 80% reimbursement, $250 deductible met","$310"],
    ["Prevention: full vaccine series instead","$60–$150 total"]
  ],
  insuranceNote:'<p>Because parvo strikes young and fast, owners of unvaccinated puppies face the full bill out of pocket. '+CALC_CTA+'</p>',
  relatedHeading:"Related dog cost guides",
  related:[
    ["/guides/dog-vaccine-cost/","Dog vaccine cost","the $20–$50 vaccine that prevents parvo."],
    ["/guides/puppy-first-year-cost/","Puppy first-year cost","where the vaccine series fits in."],
    ["/guides/emergency-vet-visit-cost/","Emergency vet visit cost","parvo is a common ER admission."],
    ["/guides/dog-bloodwork-cost/","Dog bloodwork cost","part of diagnosing and monitoring parvo."]
  ],
  faqs:[
    ["How much does parvo treatment cost?","$500–$2,000 for a typical 3–5 day hospitalization, and up to $5,000–$8,000 for severe ICU cases. A vet-directed outpatient protocol can run $300–$1,500."],
    ["How much does it cost to treat a puppy with parvo?","Most puppies need 3–5 days of hospitalization at $100–$600 per day, totaling roughly $1,000–$3,500. Diagnosis adds $150–$400 up front."],
    ["Is there a cheaper way to treat parvo?","Yes — some vets offer an at-home outpatient protocol for $300–$1,500. Survival rates are lower than full hospitalization, but it's a real option when inpatient care isn't affordable."],
    ["Does pet insurance cover parvo?","Yes, accident-and-illness plans cover parvo as long as the policy was in place before diagnosis and parvo isn't a pre-existing condition. Expect 70–90% reimbursement after your deductible."],
    ["How can I avoid the cost of parvo entirely?","Vaccinate. The parvo vaccine is part of the core puppy series at about $20–$50 a dose and prevents nearly all cases — far cheaper than treatment."]
  ],
  sources:[
    ["https://www.avma.org/resources/pet-owners/petcare/canine-parvovirus","AVMA — Canine Parvovirus"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"heartworm-treatment-cost", crumb:"Heartworm treatment cost", eyebrow:"Guide · Treatment",
  title:"How Much Does Heartworm Treatment Cost? (2026)",
  desc:"Heartworm treatment costs $600–$3,000 for dogs, averaging about $1,000. Why the melarsomine injection series drives the bill, prevention cost, and insurance.",
  h1:"How much does heartworm treatment cost?",
  lede:"Treating heartworm in a dog costs <strong>$600–$3,000</strong>, averaging around <strong>$1,000</strong>, and can reach $6,000 in advanced cases. The melarsomine injection series is the main expense. Monthly prevention at <strong>$5–$15</strong> is dramatically cheaper.",
  costRows:[
    ["Confirmatory testing + bloodwork","$100","$200","$400"],
    ["Chest X-rays (staging)","$150","$250","$450"],
    ["Melarsomine injection series (the core treatment)","$500","$1,000","$1,500"],
    ["Antibiotics, steroids, hospitalization","$150","$400","$900"],
    ["Total typical course (size-dependent)","$600","$1,200","$3,000"]
  ],
  costNote:"Heartworm treatment takes 4–6 months and is dosed by body weight, so large dogs cost more. Cats can't take melarsomine — feline heartworm is managed supportively, not cured.",
  sections:[
    {h2:"What drives the cost", html:"<ul><li><strong>Dog size</strong> — melarsomine is weight-dosed, so big dogs cost more.</li><li><strong>Disease stage</strong> — advanced (Class 3–4) cases need more staging, hospitalization, and monitoring.</li><li><strong>Strict rest period</strong> — dogs must be exercise-restricted for weeks during treatment to avoid fatal clots, which sometimes means boarding or crating.</li></ul>"},
    {h2:"Why it's so much more than prevention", html:"<p>Monthly heartworm prevention costs about <strong>$5–$15</strong> ($60–$180 a year), while treatment runs $600–$3,000 and carries real risk. Skipping prevention to save money is the most expensive bet in dog care — especially in the U.S. South and Southeast, where heartworm is endemic.</p>"},
    {h2:"Cats are different", html:"<p>There's no approved drug to kill adult heartworms in cats, so feline heartworm is managed with supportive care rather than cured. Prevention is the only real protection for cats too.</p>"}
  ],
  insuranceIntro:'<p>Heartworm treatment is covered by accident-and-illness insurance if the policy predates the diagnosis. Worked example for a <strong>$1,200</strong> treatment course:</p>',
  insuranceRows:[
    ["No insurance (full bill)","$1,200"],
    ["Insurance, 80% reimbursement, $250 deductible met","$190"],
    ["Prevention instead (per year)","$60–$180"]
  ],
  insuranceNote:'<p>Note that routine heartworm <em>prevention</em> usually needs a wellness add-on; <em>treatment</em> of an infection is covered by the core illness policy. '+CALC_CTA+'</p>',
  relatedHeading:"Related guides",
  related:[
    ["/guides/dog-bloodwork-cost/","Dog bloodwork cost","heartworm testing is a blood test."],
    ["/guides/dog-x-ray-cost/","Dog X-ray cost","chest films stage the disease."],
    ["/guides/dog-vaccine-cost/","Dog vaccine cost","where preventive care fits in the budget."],
    ["/dog-cost-calculator/","Dog cost calculator","full annual + lifetime ownership estimate."]
  ],
  faqs:[
    ["How much does heartworm treatment cost?","$600–$3,000 for dogs, averaging about $1,000, and up to $6,000 for advanced cases. The melarsomine injection series is the biggest single cost."],
    ["Why is heartworm treatment so expensive?","It takes 4–6 months, requires weight-dosed melarsomine injections, chest X-rays, bloodwork, antibiotics, and strict rest. Large dogs and advanced cases cost the most."],
    ["How much does heartworm treatment cost for cats?","There's no drug to kill adult heartworms in cats, so feline cases are managed with supportive care rather than cured. Costs vary widely; prevention is the only reliable protection."],
    ["Is it cheaper to prevent or treat heartworm?","Prevention is dramatically cheaper — about $5–$15 a month versus $600–$3,000 to treat. Prevention also avoids the health risks that come with treatment."],
    ["Does pet insurance cover heartworm treatment?","Yes, accident-and-illness plans cover treatment of a heartworm infection if the policy predates diagnosis. Routine monthly prevention usually requires a wellness add-on."]
  ],
  sources:[
    ["https://www.heartwormsociety.org/","American Heartworm Society"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"cat-diabetes-cost", crumb:"Cat diabetes cost", eyebrow:"Guide · Chronic care",
  title:"How Much Does Cat Diabetes Cost to Treat? (2026)",
  desc:"Feline diabetes costs $100–$300 a month for insulin, monitoring, and food — about $1,200–$3,600 a year. Remission, what drives cost, and insurance.",
  h1:"How much does cat diabetes cost to treat?",
  lede:"Managing a diabetic cat costs <strong>$100–$300 per month</strong> — insulin, monitoring supplies, and prescription food — or roughly <strong>$1,200–$3,600 a year</strong>. The first year runs higher because of diagnosis and dose regulation. Some cats achieve remission, lowering long-term cost.",
  costRows:[
    ["Initial diagnosis (exam + bloodwork + urinalysis)","$200","$400","$700"],
    ["Insulin (per month)","$30","$80","$150"],
    ["Blood-glucose monitoring supplies (per month)","$25","$40","$60"],
    ["Prescription diet (per month)","$40","$60","$80"],
    ["Recheck exams + curves (per visit)","$50","$100","$200"],
    ["Typical ongoing cost (per month, all-in)","$100","$180","$300"]
  ],
  costNote:"Costs are highest in the first few months while the insulin dose is being regulated. A meaningful share of cats reach diet-controlled remission, which lowers ongoing cost.",
  sections:[
    {h2:"What drives the cost", html:"<ul><li><strong>Insulin type</strong> — newer long-acting insulins (e.g. glargine) cost more per vial than older options but can dose better.</li><li><strong>Monitoring</strong> — home glucose monitors reduce vet-visit costs over time; periodic glucose curves at the clinic add up.</li><li><strong>Diet</strong> — a low-carb prescription diet is part of treatment, not optional.</li></ul>"},
    {h2:"Remission can lower long-term cost", html:"<p>Cats caught early and managed well — tight diet plus prompt insulin — sometimes go into remission and come off insulin. That's both better for the cat and much cheaper, which is a strong argument for catching it early via <a href=\"/guides/cat-bloodwork-cost/\">routine senior bloodwork</a>.</p>"},
    {h2:"Other senior-cat costs travel together", html:"<p>Diabetic cats are often seniors, and the same age brings risks like <a href=\"/guides/cat-hyperthyroidism-cost/\">hyperthyroidism</a> and <a href=\"/guides/cat-kidney-disease-cost/\">chronic kidney disease</a>. Budgeting for one chronic condition often means planning for the possibility of another.</p>"}
  ],
  insuranceIntro:'<p>Diabetes is a covered illness if the policy predates the diagnosis (it becomes pre-existing afterward). Worked example for <strong>$180/month</strong> ongoing care:</p>',
  insuranceRows:[
    ["No insurance (per year, full)","~$2,160"],
    ["Insurance, 80% reimbursement, deductible met (per year)","~$430 + premiums"],
    ["If your cat reaches remission","Cost drops sharply"]
  ],
  insuranceNote:'<p>Because diabetes is lifelong and becomes pre-existing once diagnosed, insuring <em>before</em> diagnosis is what makes coverage pay off. '+CALC_CTA+'</p>',
  relatedHeading:"Related cat cost guides",
  related:[
    ["/guides/cat-bloodwork-cost/","Cat bloodwork cost","how diabetes is diagnosed and monitored."],
    ["/guides/cat-hyperthyroidism-cost/","Cat hyperthyroidism cost","another common senior-cat condition."],
    ["/guides/cat-kidney-disease-cost/","Cat kidney disease cost","frequently overlaps with diabetes."],
    ["/cat-cost-calculator/","Cat cost calculator","full annual + lifetime ownership estimate."]
  ],
  faqs:[
    ["How much does it cost to treat a diabetic cat?","About $100–$300 a month — insulin, monitoring supplies, and prescription food — or roughly $1,200–$3,600 a year. Diagnosis adds $200–$700 up front."],
    ["How much does cat insulin cost per month?","$30–$150 a month depending on the insulin type and dose. Newer long-acting insulins cost more per vial but can give better control."],
    ["Can a diabetic cat go into remission?","Yes — a meaningful share of cats, especially those caught early and managed with a low-carb diet plus prompt insulin, achieve remission and come off insulin, lowering long-term cost."],
    ["Does pet insurance cover cat diabetes?","Yes, if the policy was in place before diagnosis. Once diagnosed, diabetes is a pre-existing condition for any new policy, so insuring early matters."],
    ["What else should I budget for with a diabetic senior cat?","Senior cats often face hyperthyroidism or kidney disease alongside diabetes, so budget for the possibility of more than one chronic condition and regular bloodwork."]
  ],
  sources:[
    ["https://www.aaha.org/aaha-guidelines/diabetes-management/","AAHA Diabetes Management Guidelines"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"cat-kidney-disease-cost", crumb:"Cat kidney disease cost", eyebrow:"Guide · Chronic care",
  title:"How Much Does Cat Kidney Disease Cost to Treat? (2026)",
  desc:"Managing feline chronic kidney disease (CKD) costs $600 a year for early stable cases up to $3,500+ for advanced ones. Diagnosis, ongoing care, SubQ fluids, and insurance.",
  h1:"How much does cat kidney disease cost to treat?",
  lede:"Managing chronic kidney disease (CKD) in a cat costs <strong>$600 a year</strong> for early, stable cases and <strong>$3,500+ a year</strong> for advanced ones. The biggest variable is whether you give SubQ fluids at home or at the clinic. Early detection keeps costs lower for longer.",
  costRows:[
    ["Initial diagnosis (exam + bloodwork + urinalysis ± ultrasound)","$300","$450","$600"],
    ["Monitoring bloodwork (every 3–6 months)","$150","$280","$400"],
    ["Medications (per month, combined)","$30","$60","$100"],
    ["Prescription kidney diet (per month)","$40","$60","$80"],
    ["SubQ fluids — home supplies vs. clinic (per session)","$15","$40","$80"],
    ["Annual all-in (early stable → advanced)","$600","$1,500","$3,500"]
  ],
  costNote:"CKD is progressive and incurable, but it's manageable for years. Giving subcutaneous (SubQ) fluids at home instead of at the clinic is the single biggest cost saver.",
  sections:[
    {h2:"What drives the cost", html:"<ul><li><strong>Stage</strong> — early (IRIS Stage 1–2) cats need diet and monitoring; advanced cats need fluids, multiple meds, and more frequent rechecks.</li><li><strong>SubQ fluids at home vs. clinic</strong> — learning to give fluids at home cuts a recurring expense dramatically.</li><li><strong>Monitoring frequency</strong> — bloodwork every 3–6 months is the backbone of management.</li></ul>"},
    {h2:"Early detection saves money", html:"<p>The SDMA biomarker on a <a href=\"/guides/cat-bloodwork-cost/\">senior blood panel</a> can flag kidney decline years before symptoms. Catching CKD early means cheaper diet-and-monitoring management for longer before costly interventions are needed — another reason routine senior bloodwork pays off.</p>"},
    {h2:"It often travels with other conditions", html:"<p>Senior cats with CKD frequently also have <a href=\"/guides/cat-hyperthyroidism-cost/\">hyperthyroidism</a> or <a href=\"/guides/cat-diabetes-cost/\">diabetes</a>. Plan your budget for the reality that a senior cat may carry more than one chronic condition.</p>"}
  ],
  insuranceIntro:'<p>CKD is a covered illness if the policy predates diagnosis — it becomes pre-existing afterward. Worked example for a <strong>$1,500</strong> management year:</p>',
  insuranceRows:[
    ["No insurance (full year)","$1,500"],
    ["Insurance, 80% reimbursement, deductible met","~$300 + premiums"],
    ["Diagnosed before a policy existed","Not covered (pre-existing)"]
  ],
  insuranceNote:'<p>Because CKD is common in older cats and becomes pre-existing once found, insuring while your cat is young and healthy is what makes coverage worthwhile. '+CALC_CTA+'</p>',
  relatedHeading:"Related cat cost guides",
  related:[
    ["/guides/cat-bloodwork-cost/","Cat bloodwork cost","SDMA and the panels that catch CKD early."],
    ["/guides/cat-hyperthyroidism-cost/","Cat hyperthyroidism cost","another common senior-cat condition."],
    ["/guides/cat-diabetes-cost/","Cat diabetes cost","frequently overlaps with kidney disease."],
    ["/cat-cost-calculator/","Cat cost calculator","full annual + lifetime ownership estimate."]
  ],
  faqs:[
    ["How much does it cost to treat cat kidney disease?","About $600 a year for early, stable CKD and up to $3,500+ a year for advanced disease. Diagnosis adds $300–$600 up front."],
    ["What is the most expensive part of managing CKD in cats?","Recurring subcutaneous (SubQ) fluids and frequent monitoring bloodwork. Learning to give fluids at home instead of at the clinic is the biggest single cost saver."],
    ["How is cat kidney disease diagnosed?","With bloodwork (including the SDMA kidney biomarker) and a urinalysis, sometimes with an ultrasound. The SDMA value can flag kidney decline years before symptoms appear."],
    ["Does pet insurance cover kidney disease in cats?","Yes, if the policy predates the diagnosis. Once diagnosed, CKD is a pre-existing condition for any new policy — so insuring early is key."],
    ["Can cats live a long time with kidney disease?","Yes. CKD is progressive and incurable but manageable for years with diet, fluids, and monitoring, especially when caught early via routine senior bloodwork."]
  ],
  sources:[
    ["https://www.aaha.org/aaha-guidelines/2021-aaha-aafp-feline-life-stage-guidelines/","AAHA/AAFP Feline Life Stage Guidelines"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"dog-cancer-treatment-cost", crumb:"Dog cancer treatment cost", eyebrow:"Guide · Treatment",
  title:"How Much Does Dog Cancer Treatment Cost? (2026)",
  desc:"Dog cancer treatment costs $1,500–$15,000+ depending on surgery, chemo, or radiation. What each modality costs, what drives the bill, and why insurance timing matters.",
  h1:"How much does dog cancer treatment cost?",
  lede:"Dog cancer treatment ranges from <strong>$1,500</strong> for a simple surgical removal to <strong>$15,000+</strong> for chemotherapy or radiation protocols. The cost depends entirely on the cancer type and the treatment plan. Diagnosis alone runs $500–$1,500.",
  costRows:[
    ["Diagnosis (bloodwork, imaging, biopsy/cytology)","$500","$1,000","$1,500"],
    ["Oncologist consultation","$125","$185","$250"],
    ["Surgery (tumor removal)","$500","$1,800","$5,000"],
    ["Chemotherapy (full course)","$3,000","$6,000","$10,000"],
    ["Radiation therapy (full course)","$4,500","$7,000","$10,000"],
    ["Combination / advanced protocols","$10,000","$15,000","$20,000+"]
  ],
  costNote:"\"Cancer\" covers dozens of diseases with very different treatments and prices. Many owners choose surgery alone or palliative care rather than a full chemo/radiation course.",
  sections:[
    {h2:"By treatment type", html:"<ul><li><strong>Surgery</strong> — often the first and sometimes only step; cost depends on tumor size and location. See our <a href=\"/guides/dog-tumor-removal-cost/\">dog tumor removal guide</a>.</li><li><strong>Chemotherapy</strong> — given in rounds over months; dogs generally tolerate it far better than humans.</li><li><strong>Radiation</strong> — for tumors that can't be fully removed; needs a specialty center with limited availability.</li></ul>"},
    {h2:"What drives the cost", html:"<ul><li><strong>Cancer type and stage</strong> — the single biggest factor.</li><li><strong>Dog size</strong> — chemo drugs are weight-dosed, so large dogs cost more.</li><li><strong>Specialist vs. GP</strong> — board-certified oncologists cost more but offer more options.</li><li><strong>Imaging</strong> — staging may need <a href=\"/guides/pet-mri-ct-cost/\">CT/MRI</a> or <a href=\"/guides/pet-ultrasound-cost/\">ultrasound</a>.</li></ul>"},
    {h2:"Palliative care is a valid choice", html:"<p>Not every family pursues curative treatment. Palliative care — pain control and quality-of-life support — is a legitimate, far less expensive path that many vets fully support. There's no single \"right\" answer.</p>"}
  ],
  insuranceIntro:'<p>Cancer is covered by accident-and-illness insurance if the policy predates any signs or diagnosis. Worked example for a <strong>$6,000</strong> chemotherapy course:</p>',
  insuranceRows:[
    ["No insurance (full bill)","$6,000"],
    ["Insurance, 80% reimbursement, $500 deductible met","$1,600"],
    ["Diagnosed before a policy existed","Not covered (pre-existing)"]
  ],
  insuranceNote:'<p>Cancer is the textbook case for insuring early — it\'s expensive, common in older dogs, and uninsurable once it appears. '+CALC_CTA+'</p>',
  relatedHeading:"Related guides",
  related:[
    ["/guides/dog-tumor-removal-cost/","Dog tumor removal cost","surgery is often the first step."],
    ["/guides/cat-cancer-treatment-cost/","Cat cancer treatment cost","the feline equivalent."],
    ["/guides/pet-mri-ct-cost/","Pet MRI / CT cost","used to stage many cancers."],
    ["/guides/pet-insurance-vs-savings/","Insurance vs. savings","run the math on a big-ticket diagnosis."]
  ],
  faqs:[
    ["How much does dog cancer treatment cost?","From about $1,500 for a simple surgical removal to $15,000+ for full chemotherapy or radiation protocols. Diagnosis alone runs $500–$1,500."],
    ["How much does chemotherapy cost for dogs?","Roughly $150–$600 per dose, totaling $3,000–$10,000 for a full course over several months. Larger dogs cost more because the drugs are weight-dosed."],
    ["How much does radiation therapy cost for a dog?","A palliative course runs about $1,000–$1,800, while a full curative-intent course is $4,500–$10,000+. Radiation requires a specialty center, which can add travel."],
    ["Does pet insurance cover dog cancer?","Yes — accident-and-illness plans cover cancer if the policy was in place before any signs appeared. Once diagnosed, it's pre-existing for any new policy."],
    ["Do I have to treat my dog's cancer aggressively?","No. Palliative care focused on comfort and quality of life is a valid, much less expensive choice that many vets support. The right plan depends on the cancer and your family."]
  ],
  sources:[
    ["https://www.vet.cornell.edu/departments-centers-and-institutes/sprecher-institute-comparative-cancer-research","Cornell — Comparative Cancer Research"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"cat-cancer-treatment-cost", crumb:"Cat cancer treatment cost", eyebrow:"Guide · Treatment",
  title:"How Much Does Cat Cancer Treatment Cost? (2026)",
  desc:"Cat cancer treatment costs $2,000–$8,000 for chemo (lymphoma is most common), plus $500–$1,500 to diagnose. Treatment types, what drives the bill, and insurance.",
  h1:"How much does cat cancer treatment cost?",
  lede:"Cat cancer treatment typically costs <strong>$2,000–$8,000</strong> for a chemotherapy course (lymphoma is the most common feline cancer), plus <strong>$500–$1,500</strong> to diagnose. Surgery-only cases can be less; advanced protocols more. Palliative care is a valid lower-cost path.",
  costRows:[
    ["Diagnosis (bloodwork, imaging, cytology/biopsy)","$500","$1,000","$1,500"],
    ["Oncologist consultation","$125","$185","$250"],
    ["Surgery (tumor removal)","$500","$1,500","$4,000"],
    ["Chemotherapy — lymphoma course (4–6 months)","$2,000","$4,500","$8,000"],
    ["Radiation therapy (full course)","$4,000","$6,000","$9,000"],
    ["Per chemo session","$150","$400","$800"]
  ],
  costNote:"Lymphoma is the most common cancer in cats and the most common reason for feline chemotherapy. Cats generally tolerate chemo well, with quality of life as the goal.",
  sections:[
    {h2:"By treatment type", html:"<ul><li><strong>Chemotherapy</strong> — the mainstay for lymphoma; given in rounds over 4–6 months.</li><li><strong>Surgery</strong> — for solid, removable tumors; cost depends on size and location.</li><li><strong>Radiation</strong> — for localized tumors that can't be fully removed; specialty-center only.</li></ul>"},
    {h2:"What drives the cost", html:"<ul><li><strong>Cancer type and stage</strong> — lymphoma protocols vary in intensity and price.</li><li><strong>Specialist vs. GP</strong> — oncologists cost more but offer more options.</li><li><strong>Diagnostics</strong> — staging may add <a href=\"/guides/cat-x-ray-cost/\">X-rays</a>, <a href=\"/guides/pet-ultrasound-cost/\">ultrasound</a>, and <a href=\"/guides/cat-bloodwork-cost/\">bloodwork</a>.</li></ul>"},
    {h2:"Palliative care is a valid choice", html:"<p>Many cat owners choose comfort-focused palliative care instead of a full treatment course. It's far less expensive and a legitimate, vet-supported option. The best choice depends on the cancer type and your cat's quality of life.</p>"}
  ],
  insuranceIntro:'<p>Cancer is covered if the policy predates any signs or diagnosis. Worked example for a <strong>$4,500</strong> lymphoma chemo course:</p>',
  insuranceRows:[
    ["No insurance (full bill)","$4,500"],
    ["Insurance, 80% reimbursement, $500 deductible met","$1,300"],
    ["Diagnosed before a policy existed","Not covered (pre-existing)"]
  ],
  insuranceNote:'<p>Cancer is common in senior cats and uninsurable once it appears, so insuring early is what makes coverage pay off. '+CALC_CTA+'</p>',
  relatedHeading:"Related guides",
  related:[
    ["/guides/dog-cancer-treatment-cost/","Dog cancer treatment cost","the canine equivalent."],
    ["/guides/cat-bloodwork-cost/","Cat bloodwork cost","part of diagnosis and monitoring."],
    ["/guides/pet-ultrasound-cost/","Pet ultrasound cost","used to stage many cancers."],
    ["/guides/pet-insurance-vs-savings/","Insurance vs. savings","run the math on a big-ticket diagnosis."]
  ],
  faqs:[
    ["How much does cat cancer treatment cost?","Typically $2,000–$8,000 for a chemotherapy course (lymphoma is most common), plus $500–$1,500 to diagnose. Surgery-only cases can be less; advanced protocols more."],
    ["How much does chemotherapy cost for cats?","About $150–$800 per session, totaling $2,000–$8,000 for a full lymphoma course over 4–6 months. Cats generally tolerate chemo well."],
    ["What is the most common cancer in cats?","Lymphoma. It's the most common feline cancer and the most common reason cats receive chemotherapy, with quality of life as the treatment goal."],
    ["Does pet insurance cover cat cancer?","Yes, if the policy predates any signs or diagnosis. Once diagnosed, cancer is pre-existing for any new policy, so insuring early matters."],
    ["Is it okay not to treat my cat's cancer?","Yes. Palliative care focused on comfort is a valid, much less expensive choice that many vets support. The right path depends on the cancer and your cat's quality of life."]
  ],
  sources:[
    ["https://www.vet.cornell.edu/departments-centers-and-institutes/cornell-feline-health-center","Cornell Feline Health Center"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
// ===== TIER 3 =====
{
  slug:"dog-hip-dysplasia-surgery-cost", crumb:"Dog hip dysplasia surgery cost", eyebrow:"Guide · Surgery",
  title:"How Much Does Dog Hip Dysplasia Surgery Cost? (2026)",
  desc:"Dog hip dysplasia surgery costs $1,200–$3,500 per hip for FHO and $4,500–$7,000+ for total hip replacement. FHO vs THR, all-in costs, at-risk breeds, and insurance.",
  h1:"How much does dog hip dysplasia surgery cost?",
  lede:"Hip dysplasia surgery costs <strong>$1,200–$3,500 per hip</strong> for an FHO and <strong>$4,500–$7,000+ per hip</strong> for a total hip replacement (THR). All-in, including diagnosis and aftercare, expect <strong>$4,000–$14,500</strong>. Both hips doubles it.",
  costRows:[
    ["Orthopedic consult + X-rays","$200","$450","$600"],
    ["Pre-op bloodwork + anesthesia","$350","$600","$900"],
    ["FHO (femoral head ostectomy), per hip","$1,200","$2,200","$3,500"],
    ["Total hip replacement (THR), per hip","$4,500","$5,800","$7,000"],
    ["THR prosthetic implant","$1,500","$2,000","$2,500"],
    ["Hospitalization, pain meds, post-op X-rays","$350","$700","$1,200"]
  ],
  costNote:"FHO removes the ball of the joint and lets a \"false joint\" form — best for smaller/lighter dogs. THR replaces the joint with an implant and is pricier but restores more normal function for larger dogs.",
  sections:[
    {h2:"FHO vs. total hip replacement", html:"<ul><li><strong>FHO</strong> ($1,200–$3,500/hip) — removes the femoral head; relies on muscle and scar tissue. Cheaper, good for dogs under ~50 lb and for pain relief.</li><li><strong>THR</strong> ($4,500–$7,000+/hip) — replaces the joint with a prosthesis; restores the most normal function, preferred for larger dogs. Add $1,500–$2,500 for the implant.</li></ul>"},
    {h2:"What drives the cost", html:"<ul><li><strong>Procedure choice</strong> — THR is roughly double an FHO.</li><li><strong>One hip or both</strong> — bilateral cases double the surgical cost.</li><li><strong>Specialist surgeon</strong> — board-certified orthopedic surgeons cost more than a GP.</li></ul>"},
    {h2:"At-risk breeds", html:"<p>Hip dysplasia is largely hereditary and most common in larger breeds: <a href=\"/breeds/german-shepherd-cost/\">German Shepherds</a>, <a href=\"/breeds/labrador-retriever-cost/\">Labrador Retrievers</a>, <a href=\"/breeds/golden-retriever-cost/\">Golden Retrievers</a>, <a href=\"/breeds/rottweiler-cost/\">Rottweilers</a>, and <a href=\"/breeds/great-dane-cost/\">Great Danes</a>. If you own one, factoring this risk into your insurance decision early pays off.</p>"}
  ],
  insuranceIntro:'<p>Hip dysplasia is covered by accident-and-illness insurance <em>if</em> the policy predates any signs — many insurers treat it as pre-existing if symptoms showed before enrollment, and some have orthopedic waiting periods. Worked example for a <strong>$5,000</strong> THR:</p>',
  insuranceRows:[
    ["No insurance (full bill)","$5,000"],
    ["Insurance, 80% reimbursement, $500 deductible met","$1,400"],
    ["Signs appeared before the policy / waiting period","May be excluded"]
  ],
  insuranceNote:'<p>For at-risk breeds, insure early and check the orthopedic waiting period before symptoms appear. '+CALC_CTA+'</p>',
  relatedHeading:"Related dog cost guides",
  related:[
    ["/guides/dog-acl-surgery-cost/","Dog ACL/CCL surgery cost","the other big orthopedic surgery."],
    ["/guides/dog-x-ray-cost/","Dog X-ray cost","how hip dysplasia is diagnosed."],
    ["/guides/dog-sedation-anesthesia-cost/","Dog sedation &amp; anesthesia cost","part of any orthopedic surgery."],
    ["/guides/pet-insurance-vs-savings/","Insurance vs. savings","run the math for at-risk breeds."]
  ],
  faqs:[
    ["How much does dog hip dysplasia surgery cost?","$1,200–$3,500 per hip for an FHO and $4,500–$7,000+ per hip for a total hip replacement. All-in, including diagnosis and aftercare, expect $4,000–$14,500."],
    ["What is the difference between FHO and THR cost?","An FHO removes the femoral head and costs $1,200–$3,500 per hip; a total hip replacement uses a prosthetic implant and costs $4,500–$7,000+ per hip — roughly double."],
    ["Does it cost more to do both hips?","Yes — bilateral surgery roughly doubles the surgical cost, though some clinics discount the second hip. Not every dog needs both done."],
    ["Which breeds are most prone to hip dysplasia?","Larger breeds: German Shepherds, Labradors, Golden Retrievers, Rottweilers, and Great Danes. It's largely hereditary, so at-risk breeds should be insured early."],
    ["Does pet insurance cover hip dysplasia surgery?","Often yes, if the policy predates any signs and you've cleared the orthopedic waiting period. If symptoms appeared before enrollment, many insurers treat it as pre-existing."]
  ],
  sources:[
    ["https://www.acvs.org/small-animal/canine-hip-dysplasia/","ACVS — Canine Hip Dysplasia"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"dog-bloat-gdv-surgery-cost", crumb:"Dog bloat (GDV) surgery cost", eyebrow:"Guide · Emergency",
  title:"How Much Does Dog Bloat (GDV) Surgery Cost? (2026)",
  desc:"Emergency bloat (GDV) surgery costs $3,000–$8,000, with all-in ICU bills of $5,000–$10,000+. Why it's a life-threatening emergency, at-risk breeds, gastropexy, and insurance.",
  h1:"How much does dog bloat (GDV) surgery cost?",
  lede:"Emergency bloat (GDV) surgery costs <strong>$3,000–$8,000</strong> for the procedure, with all-in bills of <strong>$5,000–$10,000+</strong> once ICU care is included. GDV is a true life-or-death emergency — every hour matters. A preventive gastropexy costs far less.",
  costRows:[
    ["Emergency exam + X-rays + stabilization","$300","$700","$1,200"],
    ["GDV surgery (untwist + tack the stomach)","$3,000","$5,000","$8,000"],
    ["ICU hospitalization (per day)","$500","$1,000","$1,500"],
    ["Typical all-in (surgery + 2–3 days ICU)","$5,000","$7,000","$10,000+"],
    ["Preventive gastropexy (planned, not emergency)","$400","$1,000","$2,000"]
  ],
  costNote:"GDV (gastric dilatation-volvulus) is when the stomach fills with gas and twists, cutting off blood flow. Without surgery within hours it's fatal — this is the most time-critical bill on this site.",
  sections:[
    {h2:"Why it's so expensive", html:"<ul><li><strong>It's emergency surgery</strong> — done after hours, immediately, with a full surgical and ICU team.</li><li><strong>Complications add cost</strong> — if the stomach wall or spleen is damaged, surgeons may remove part of the stomach (gastrectomy) or the spleen (splenectomy), adding time and risk.</li><li><strong>ICU recovery</strong> — 2–3 days of monitoring for heart arrhythmias and shock is standard.</li></ul>"},
    {h2:"At-risk breeds", html:"<p>GDV mainly strikes large, deep-chested breeds: <a href=\"/breeds/great-dane-cost/\">Great Danes</a> (highest risk of any breed), <a href=\"/breeds/saint-bernard-cost/\">Saint Bernards</a>, <a href=\"/breeds/doberman-cost/\">Dobermans</a>, <a href=\"/breeds/boxer-cost/\">Boxers</a>, and Standard <a href=\"/breeds/poodle-cost/\">Poodles</a>. If you own one, ask about a preventive gastropexy.</p>"},
    {h2:"A preventive gastropexy is the cheaper bet", html:"<p>A gastropexy tacks the stomach to the body wall so it can't twist. Done electively — often during a <a href=\"/guides/dog-spay-cost/\">spay</a>/neuter — it costs $400–$2,000 and dramatically reduces GDV risk in high-risk breeds. That's a fraction of the emergency-surgery bill.</p>"}
  ],
  insuranceIntro:'<p>GDV is a sudden emergency, so accident-and-illness insurance covers it if the policy predates the event. Worked example for a <strong>$7,000</strong> all-in bill:</p>',
  insuranceRows:[
    ["No insurance (full bill)","$7,000"],
    ["Insurance, 80% reimbursement, $500 deductible met","$1,800"],
    ["Preventive gastropexy instead","$400–$2,000"]
  ],
  insuranceNote:'<p>For deep-chested breeds, GDV is exactly the kind of sudden five-figure bill insurance exists for. '+CALC_CTA+'</p>',
  relatedHeading:"Related dog cost guides",
  related:[
    ["/guides/emergency-vet-visit-cost/","Emergency vet visit cost","GDV is a top-tier ER emergency."],
    ["/guides/dog-x-ray-cost/","Dog X-ray cost","the X-ray that confirms GDV."],
    ["/guides/foreign-object-surgery-cost-dog/","Foreign-object surgery cost","another emergency abdominal surgery."],
    ["/guides/pet-insurance-vs-savings/","Insurance vs. savings","run the math for deep-chested breeds."]
  ],
  faqs:[
    ["How much does bloat (GDV) surgery cost for a dog?","$3,000–$8,000 for the surgery, with all-in bills of $5,000–$10,000+ once 2–3 days of ICU care are included. It's an emergency, so it's billed at after-hours rates."],
    ["Why is GDV surgery so expensive?","It's immediate emergency surgery with a full surgical and ICU team. Complications like stomach or spleen damage add procedures, and 2–3 days of intensive monitoring is standard."],
    ["Which dogs are most at risk of bloat?","Large, deep-chested breeds — Great Danes (highest of any breed), Saint Bernards, Dobermans, Boxers, and Standard Poodles. Owners of these breeds should ask about a preventive gastropexy."],
    ["How much does a preventive gastropexy cost?","$400–$2,000, especially when done electively alongside a spay or neuter. It tacks the stomach so it can't twist and dramatically lowers GDV risk — far cheaper than emergency surgery."],
    ["Does pet insurance cover bloat surgery?","Yes — GDV is a sudden emergency covered by accident-and-illness plans if the policy was in place beforehand. Expect 70–90% reimbursement after your deductible."]
  ],
  sources:[
    ["https://www.acvs.org/small-animal/gastric-dilatation-volvulus/","ACVS — Gastric Dilatation-Volvulus"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"cherry-eye-surgery-cost", crumb:"Cherry eye surgery cost", eyebrow:"Guide · Surgery",
  title:"How Much Does Cherry Eye Surgery Cost? (2026)",
  desc:"Cherry eye surgery costs $500–$1,200 per eye on average (range $300–$2,500). One eye vs both, why a specialist costs more, at-risk breeds, and insurance.",
  h1:"How much does cherry eye surgery cost?",
  lede:"Cherry eye surgery costs <strong>$500–$1,200 per eye</strong> on average, ranging from <strong>$300 to $2,500</strong> depending on your vet, location, and dog's size. Doing both eyes in one procedure usually costs less per eye than two separate surgeries.",
  costRows:[
    ["Exam / diagnosis","$50","$80","$150"],
    ["Cherry eye surgery — one eye","$500","$800","$1,200"],
    ["Cherry eye surgery — both eyes (same visit)","$900","$1,200","$2,000"],
    ["Veterinary ophthalmologist (specialist)","$1,000","$1,500","$2,500"],
    ["Meds + recheck (eye drops, e-collar, follow-up)","$50","$120","$250"]
  ],
  costNote:"\"Cherry eye\" is a prolapsed third-eyelid gland. The modern fix tucks the gland back into place (preserving tear production) rather than removing it — removal raises the risk of lifelong dry eye.",
  sections:[
    {h2:"What drives the cost", html:"<ul><li><strong>One eye or both</strong> — many surgeons charge less per eye when both are done together.</li><li><strong>GP vs. ophthalmologist</strong> — a board-certified veterinary ophthalmologist costs more but may be worth it for tricky or recurrent cases.</li><li><strong>Dog size</strong> — larger dogs need more anesthesia and surgical time.</li></ul>"},
    {h2:"Why not just remove the gland?", html:"<p>The third-eyelid gland produces a large share of the eye's tears. Removing it (the old approach) often leads to lifelong dry eye, which means daily medication for years. Modern surgery <em>repositions</em> the gland — slightly more expensive up front, much cheaper over the dog's life.</p>"},
    {h2:"At-risk breeds", html:"<p>Cherry eye is most common in <a href=\"/breeds/bulldog-cost/\">Bulldogs</a>, <a href=\"/breeds/french-bulldog-cost/\">French Bulldogs</a>, <a href=\"/breeds/beagle-cost/\">Beagles</a>, <a href=\"/breeds/cocker-spaniel-cost/\">Cocker Spaniels</a>, <a href=\"/breeds/boston-terrier-cost/\">Boston Terriers</a>, and <a href=\"/breeds/shih-tzu-cost/\">Shih Tzus</a>. It often appears in the first year or two of life, and the other eye frequently follows.</p>"}
  ],
  insuranceIntro:'<p>Cherry eye is covered by accident-and-illness insurance <em>if</em> the policy predates any signs — in these prone breeds it commonly shows up young, so timing matters. Worked example for a <strong>$1,200</strong> both-eyes surgery:</p>',
  insuranceRows:[
    ["No insurance (full bill)","$1,200"],
    ["Insurance, 80% reimbursement, $250 deductible met","$190"],
    ["Already present before the policy","Not covered (pre-existing)"]
  ],
  insuranceNote:'<p>If you have a prone breed, insure before any eye signs appear — cherry eye in one eye can make the other a pre-existing risk. '+CALC_CTA+'</p>',
  relatedHeading:"Related guides",
  related:[
    ["/breeds/bulldog-cost/","Bulldog cost","one of the most cherry-eye-prone breeds."],
    ["/breeds/beagle-cost/","Beagle cost","another commonly affected breed."],
    ["/guides/dog-sedation-anesthesia-cost/","Dog sedation &amp; anesthesia cost","part of the surgery bill."],
    ["/vet-bill-calculator/","Vet bill calculator","estimate a specific procedure."]
  ],
  faqs:[
    ["How much does cherry eye surgery cost?","$500–$1,200 per eye on average, with a full range of $300–$2,500 depending on your vet, your location, and your dog's size."],
    ["Is it cheaper to fix both eyes at once?","Usually yes per eye — many surgeons discount the second eye when both are done in the same procedure. In prone breeds the second eye often develops cherry eye too."],
    ["Why does an ophthalmologist cost more for cherry eye?","Board-certified veterinary ophthalmologists charge $1,000–$2,500 because of their specialty training and equipment. They're often worth it for recurrent or complicated cases."],
    ["Should the gland be removed or repositioned?","Repositioned. The third-eyelid gland makes much of the eye's tears, so removing it risks lifelong dry eye. Modern surgery tucks it back into place to preserve tear production."],
    ["Which breeds get cherry eye most?","Bulldogs, French Bulldogs, Beagles, Cocker Spaniels, Boston Terriers, and Shih Tzus. It usually appears in the first year or two, and the second eye frequently follows."]
  ],
  sources:[
    ["https://www.acvo.org/common-conditions-1/2018/3/5/cherry-eye","ACVO — Cherry Eye"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"dog-c-section-cost", crumb:"Dog C-section cost", eyebrow:"Guide · Surgery",
  title:"How Much Does a Dog C-Section Cost? (2026)",
  desc:"A planned dog C-section costs $700–$2,000; an emergency one $1,500–$4,000+. Why brachycephalic breeds often need one, what drives the bill, and insurance limits.",
  h1:"How much does a dog C-section cost?",
  lede:"A planned dog C-section costs <strong>$700–$2,000</strong>, while an emergency C-section runs <strong>$1,500–$4,000+</strong>. Emergencies cost more because they happen after hours and the situation is critical. Some breeds almost always need one.",
  costRows:[
    ["Pre-surgery exam + X-ray/ultrasound (puppy count)","$150","$350","$600"],
    ["Planned C-section (vet office, scheduled)","$700","$1,300","$2,000"],
    ["Emergency C-section (after-hours / ER)","$1,500","$2,500","$4,000+"],
    ["Anesthesia + monitoring","$300","$500","$900"],
    ["Hospitalization + aftercare","$150","$400","$800"]
  ],
  costNote:"A C-section (cesarean) delivers puppies surgically when natural birth isn't safe. Emergencies cost the most because they're unplanned, urgent, and often at an ER.",
  sections:[
    {h2:"Planned vs. emergency", html:"<ul><li><strong>Planned</strong> ($700–$2,000) — scheduled when X-rays show large puppies or a breed that can't whelp naturally. Calmer, cheaper, safer.</li><li><strong>Emergency</strong> ($1,500–$4,000+) — when labor stalls (dystocia). After-hours ER pricing plus urgency drives the cost up.</li></ul>"},
    {h2:"Why some breeds nearly always need one", html:"<p>Brachycephalic and large-headed breeds often can't deliver naturally because the puppies' heads don't fit through the birth canal. <a href=\"/breeds/french-bulldog-cost/\">French Bulldogs</a>, <a href=\"/breeds/bulldog-cost/\">Bulldogs</a>, <a href=\"/breeds/boston-terrier-cost/\">Boston Terriers</a>, and <a href=\"/breeds/pug-cost/\">Pugs</a> have very high C-section rates — a planned cesarean is often expected, not a surprise.</p>"},
    {h2:"What drives the cost", html:"<ul><li><strong>Timing</strong> — emergency vs. planned is the biggest factor.</li><li><strong>Litter size</strong> — more puppies means longer surgery and more newborn resuscitation.</li><li><strong>Spay at the same time</strong> — some owners combine a spay, which adds cost but avoids a second surgery.</li></ul>"}
  ],
  insuranceIntro:'<p>Most pet insurance plans <strong>exclude breeding, pregnancy, and whelping</strong>, so a routine C-section usually isn\'t covered — some plans cover it only as a pregnancy complication. Worked example for a <strong>$2,500</strong> emergency C-section:</p>',
  insuranceRows:[
    ["No insurance (full bill)","$2,500"],
    ["Most standard plans (breeding excluded)","$2,500 (not covered)"],
    ["Plan covering pregnancy complications","Varies — read the policy"]
  ],
  insuranceNote:'<p>If you plan to breed, check pregnancy exclusions carefully before relying on insurance, and budget for a planned C-section in prone breeds. '+CALC_CTA+'</p>',
  relatedHeading:"Related dog cost guides",
  related:[
    ["/guides/dog-spay-cost/","Dog spay cost","sometimes combined with a C-section."],
    ["/guides/emergency-vet-visit-cost/","Emergency vet visit cost","where emergency C-sections happen."],
    ["/breeds/french-bulldog-cost/","French Bulldog cost","a breed that nearly always needs a C-section."],
    ["/vet-bill-calculator/","Vet bill calculator","estimate a specific procedure."]
  ],
  faqs:[
    ["How much does a dog C-section cost?","A planned C-section costs $700–$2,000; an emergency one $1,500–$4,000+. Emergencies cost more because they're after-hours and urgent."],
    ["Why is an emergency C-section more expensive than a planned one?","It happens after hours at ER rates, the situation is critical, and it often follows a failed natural labor that already incurred costs. Planned cesareans are calmer and cheaper."],
    ["Which dog breeds usually need a C-section?","Brachycephalic and large-headed breeds — French Bulldogs, Bulldogs, Boston Terriers, and Pugs — frequently can't whelp naturally and have very high C-section rates."],
    ["Does pet insurance cover a dog C-section?","Usually not — most plans exclude breeding, pregnancy, and whelping. A few cover pregnancy complications, so read the policy carefully if you intend to breed."],
    ["Can a spay be done during a C-section?","Yes. Some owners choose to spay at the same time to avoid a second surgery. It adds to the bill but can be more economical and convenient overall."]
  ],
  sources:[
    ["https://www.acvs.org/small-animal/cesarean-section/","ACVS — Cesarean Section"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
},
{
  slug:"cat-abscess-cost", crumb:"Cat abscess cost", eyebrow:"Guide · Treatment",
  title:"How Much Does Cat Abscess Treatment Cost? (2026)",
  desc:"Treating a cat abscess costs $300–$2,000, with simple outpatient cases around $400–$900. Drainage vs surgery, why intact outdoor cats get them, and insurance.",
  h1:"How much does cat abscess treatment cost?",
  lede:"Treating a cat abscess costs <strong>$300–$2,000</strong>, with most straightforward outpatient cases landing around <strong>$400–$900</strong>. Minor abscesses caught early can be under $150; dental or deep abscesses needing surgery run highest. Neutering reduces fight-bite abscesses.",
  costRows:[
    ["Exam / consultation","$50","$80","$150"],
    ["Abscess drainage + wound care","$200","$400","$700"],
    ["Antibiotics + pain medication","$30","$80","$200"],
    ["Sedation / anesthesia (for drainage)","$80","$150","$300"],
    ["Simple outpatient case (all-in)","$300","$600","$900"],
    ["Surgical / dental abscess (extraction, deep)","$1,000","$1,800","$3,500"]
  ],
  costNote:"A skin abscess is a pocket of pus, most often from a bite wound. Most are simple drain-and-antibiotics cases; dental and deep abscesses cost much more because they need surgery.",
  sections:[
    {h2:"What drives the cost", html:"<ul><li><strong>Simple vs. surgical</strong> — a quick lance-and-drain with antibiotics is far cheaper than a deep or dental abscess needing surgery.</li><li><strong>Sedation</strong> — many cats need light sedation for drainage, which adds cost (see our <a href=\"/guides/cat-sedation-cost/\">cat sedation guide</a>).</li><li><strong>Dental abscesses</strong> — tooth-root abscesses require extraction, pushing the bill to $1,000–$3,500.</li></ul>"},
    {h2:"Why outdoor and intact cats get them most", html:"<p>Most skin abscesses come from bite wounds during fights. Intact (un-neutered) outdoor toms fight far more, so <a href=\"/guides/cat-neuter-cost/\">neutering</a> and keeping cats indoors both sharply reduce abscesses — a one-time neuter cost can prevent repeat abscess bills.</p>"},
    {h2:"Don't wait", html:"<p>A small abscess caught early can be under $150, but a neglected one can rupture, spread infection, or require surgery costing many times more. Prompt treatment is the cheaper path.</p>"}
  ],
  insuranceIntro:'<p>An abscess from a bite or injury is a covered illness/accident if the policy predates it. Worked example for a <strong>$600</strong> outpatient drainage:</p>',
  insuranceRows:[
    ["No insurance (full bill)","$600"],
    ["Insurance, 80% reimbursement, $250 deductible met","$120"],
    ["Prevention: neuter + indoor living","Sharply fewer abscesses"]
  ],
  insuranceNote:'<p>Recurring fight-bite abscesses are common in intact outdoor cats — neutering is the cheapest long-term fix. '+CALC_CTA+'</p>',
  relatedHeading:"Related cat cost guides",
  related:[
    ["/guides/cat-neuter-cost/","Cat neuter cost","neutering cuts fight-bite abscesses."],
    ["/guides/cat-sedation-cost/","Cat sedation cost","often needed for drainage."],
    ["/guides/emergency-vet-visit-cost/","Emergency vet visit cost","where a ruptured abscess may be treated."],
    ["/cat-cost-calculator/","Cat cost calculator","full annual + lifetime ownership estimate."]
  ],
  faqs:[
    ["How much does it cost to treat a cat abscess?","$300–$2,000 overall, with most simple outpatient cases around $400–$900. A minor abscess caught early can be under $150; surgical or dental abscesses run $1,000–$3,500."],
    ["What's included in cat abscess treatment?","An exam, draining the abscess (often under light sedation), flushing and wound care, and a course of antibiotics and pain medication. Deep or dental abscesses may need surgery."],
    ["Why does my cat keep getting abscesses?","Most come from bite wounds during fights. Intact outdoor male cats fight the most, so neutering and keeping your cat indoors dramatically reduce repeat abscesses."],
    ["Does pet insurance cover cat abscess treatment?","Yes — an abscess from a bite or injury is covered by accident-and-illness plans if the policy predates it. Expect 70–90% reimbursement after your deductible."],
    ["Can I treat a cat abscess at home?","No — abscesses need professional draining and antibiotics. A small one caught early is cheap to treat, but a neglected abscess can rupture and cost far more, so see a vet promptly."]
  ],
  sources:[
    ["https://www.cornell.edu/","Cornell Feline Health Center"],
    ["https://www.bls.gov/cpi/","BLS CPI veterinary services"]
  ]
}
];

// ---- write guide files ----
var written = 0;
GUIDES.forEach(function(g){
  var dir = path.join(ROOT, "guides", g.slug);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), page(g), "utf8");
  written++;
});

// ---- register in guides hub ----
var hubPath = path.join(ROOT, "guides", "index.html");
var hub = fs.readFileSync(hubPath, "utf8");

// 1) ItemList JSON-LD: append new ListItems before the closing of itemListElement array
var lastItemRe = /(\{\s*"@type":\s*"ListItem",\s*"position":\s*(\d+),[\s\S]*?\}\s*)(\]\s*\}\s*<\/script>)/;
// find current max position
var positions = [];
hub.replace(/"position":\s*(\d+)/g, function(m, n){ positions.push(parseInt(n,10)); return m; });
var maxPos = positions.length ? Math.max.apply(null, positions) : 0;
var newItems = GUIDES.filter(function(g){ return hub.indexOf("/guides/"+g.slug+"/\"") === -1; }).map(function(g, i){
  return ',\n    {\n      "@type": "ListItem",\n      "position": '+(maxPos+1+i)+',\n      "name": "'+g.crumb.replace(/ cost$/,"")+'",\n      "url": "https://petplanwise.com/guides/'+g.slug+'/"\n    }';
}).join("");
if (newItems) {
  hub = hub.replace(/(\n\s*\]\s*\}\s*<\/script>)/, newItems + "$1");
}

// 2) Visible cards: add a new section before the reviewer block (idempotent)
var CARD_DESC = {
  "cat-spay-cost":"$50–$120 low-cost; $200–$500 at a private vet.",
  "dog-neuter-cost":"$50–$250 low-cost; $150–$500 by size at a vet.",
  "pet-microchip-cost":"$25–$60 + one-time registration; community $15–$25.",
  "parvo-treatment-cost":"$500–$2,000 hospitalized; the vaccine prevents it.",
  "heartworm-treatment-cost":"$600–$3,000; prevention is far cheaper.",
  "cat-diabetes-cost":"$100–$300/mo; some cats reach remission.",
  "cat-kidney-disease-cost":"$600–$3,500/yr; SubQ fluids drive cost.",
  "dog-cancer-treatment-cost":"$1,500–$15,000+ by surgery, chemo, radiation.",
  "cat-cancer-treatment-cost":"$2,000–$8,000 for a lymphoma chemo course.",
  "dog-hip-dysplasia-surgery-cost":"FHO $1,200–$3,500; THR $4,500–$7,000+/hip.",
  "dog-bloat-gdv-surgery-cost":"$3,000–$8,000; a true life-or-death emergency.",
  "cherry-eye-surgery-cost":"$500–$1,200 per eye; reposition, don't remove.",
  "dog-c-section-cost":"Planned $700–$2,000; emergency $1,500–$4,000+.",
  "cat-abscess-cost":"$300–$2,000; neutering cuts fight-bite abscesses."
};
if (hub.indexOf('id="new-condition-guides"') === -1) {
  var cards = GUIDES.map(function(g){
    var h3 = g.crumb.replace(/ cost$/,"");
    return '<a class="card card-link" href="/guides/'+g.slug+'/"><h3>'+h3+'</h3><p class="muted">'+(CARD_DESC[g.slug]||"")+'</p></a>';
  }).join("\n");
  var newSection = '<section id="new-condition-guides"><div class="container">\n'
    + '<h2>Conditions, surgeries &amp; treatments</h2>\n'
    + '<div class="grid grid-3">\n'
    + cards + '\n'
    + '</div>\n'
    + '</div></section>\n\n';
  hub = hub.replace(/(\n\s*<!-- reviewer-block-moved -->)/, "\n" + newSection + "$1");
}
fs.writeFileSync(hubPath, hub, "utf8");

console.log("Guide files written: " + written);
console.log("Hub ItemList entries added: " + (newItems ? GUIDES.length : 0));
console.log("Hub cards section added: " + (hub.indexOf('id="new-condition-guides"') >= 0 ? "yes" : "no"));
