#!/usr/bin/env node
/* May-16 batch 2 — 5 high-value additions:
   - Rhodesian Ridgeback (RR)            AKC top 50, distinctive ridge + dermoid sinus
   - Soft Coated Wheaten Terrier (SCWT)  PLN/PLE = unique cost driver
   - Burmese                             very social cat, hypokalemic polymyopathy
   - Oriental Shorthair                  Siamese-build, 300+ colors, vocal
   - Birman                              "Sacred Cat of Burma", color-pointed semi-longhair

   For each:
   - Generates breeds/<slug>-cost/index.html from full template
   - Downloads close-up Pexels hero to hero.jpg + hero-original.jpg
   - Generates hero.webp via sharp (same optimization as the others)
   - Appends row to breeds.csv + breed-traits.csv (with source_url/last_reviewed)
   - Splices alphabetized card into breeds/index.html dog/cat groups
   - Updates ItemList JSON-LD, visible-count spans, filter-pill counts,
     find-my-breed CAT_SLUGS map, find-my-breed tile counts, breeds dropdown
     sub-label, homepage tile description */
"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const sharp = require("sharp");
const ROOT = path.resolve(__dirname, "..");
const CACHE_V = "20260516p";  // current site cache version
const REVIEWED = "2026-05";

/* ---------------- Breed configs ---------------- */
const BREEDS = [
  {
    slug: "rhodesian-ridgeback", species: "dog", name: "Rhodesian Ridgeback", aka: "RR",
    size: "large", grooming: 1.00, healthRisk: 1.05,
    purchase: { low: 1500, typical: 2500, high: 4000 },
    avgLife: 11,
    notes: "Distinctive ridge along the spine. Dermoid sinus (congenital), hip dysplasia, and bloat are the breed-specific costs to plan for.",
    yearRange: "$1,500–$3,500", yearOne: "$2,000–$5,000", lifetime: "$20,000–$42,000",
    costRows: {
      food: { low: 500, typ: 850, high: 1500 },
      vet: { low: 250, typ: 500, high: 1100 },
      prevention: { low: 160, typ: 320, high: 540 },
      grooming: { low: 0, typ: 60, high: 200 },
      insurance: { low: 380, typ: 700, high: 1150 }
    },
    drivers: [
      { name: "Dermoid sinus.", text: "Congenital tube-like defect along the ridge area; affected puppies typically need surgical correction ($800–$2,500). Reputable breeders screen at birth and surgically correct or remove affected pups from breeding lines." },
      { name: "Hip + elbow dysplasia.", text: "Mid-tier risk for the breed. Severe surgery $4,000–$8,000. OFA-screened parents lower the lifetime odds significantly." },
      { name: "Bloat (GDV).", text: "Deep-chested breed — bloat is a lifetime risk. Emergency surgery $5,000–$8,000; many owners do prophylactic gastropexy at spay/neuter ($300–$700)." },
      { name: "Hypothyroidism.", text: "Common in middle-aged Ridgebacks. Daily medication runs $20–$40/month for life once diagnosed; annual T4 testing is routine." }
    ],
    insurance: "Rhodesian Ridgeback premiums average $40–$70/month. Bloat + orthopedic coverage matters most — verify the policy doesn't sublimit emergency surgery.",
    saveTips: [
      "Confirm parents have OFA hip + elbow + thyroid clearances.",
      "Ask the breeder explicitly about dermoid sinus screening at birth.",
      "Prophylactic gastropexy at spay/neuter ($300–$700) — far cheaper than emergency bloat.",
      "Channel the breed's energy into structured exercise (lure coursing fits the breed beautifully); they were bred to run."
    ],
    faq: [
      { q: "How much does a Rhodesian Ridgeback cost per year?", a: "$1,500–$3,500 for most owners. Food and exercise gear are the biggest swing items." },
      { q: "Is the ridge always present?", a: "About 90% of Rhodesian Ridgeback puppies are born with the trademark ridge; the rest are 'ridgeless' but otherwise genetically the same dog." },
      { q: "Are Ridgebacks good with kids?", a: "Generally yes with respectful older kids. They're an active large breed, so supervise with toddlers." }
    ],
    sources: ["OFA registry — Rhodesian Ridgeback hip/elbow/thyroid data", "AKC breed standard", "NAPHIA 2024 State of the Industry"],
    traits: {
      weightM: "75-90", weightF: "70-80", height: "24-27",
      energy: 4, alone: "4-6", kid: "high", stranger: "medium", train: 4, shed: 3,
      grm: 15, exMin: "60-90",
      temperament: "Dignified even-tempered mischievous when young",
      goodAt: "lure coursing running partner family pet protection",
      topFacts: "The distinctive ridge of hair along the spine grows backwards from the rest of the coat|Originally bred in Southern Africa to track lions and hold them at bay until hunters arrived|Dermoid sinus is a breed-specific congenital risk — reputable breeders screen at birth|Naturally aloof with strangers but devoted to family — different temperament from most retrievers",
      affection: 8, child: 8, protective: 7, vocal: 3
    }
  },
  {
    slug: "soft-coated-wheaten-terrier", species: "dog", name: "Soft Coated Wheaten Terrier", aka: "Wheaten",
    size: "medium", grooming: 1.20, healthRisk: 1.20,
    purchase: { low: 1500, typical: 2500, high: 4000 },
    avgLife: 13,
    notes: "Low-shedding silky coat needs daily brushing. Protein-losing nephropathy (PLN) and protein-losing enteropathy (PLE) are documented breed-specific risks.",
    yearRange: "$1,800–$3,800", yearOne: "$2,400–$5,200", lifetime: "$24,000–$46,000",
    costRows: {
      food: { low: 320, typ: 560, high: 950 },
      vet: { low: 320, typ: 650, high: 1400 },
      prevention: { low: 140, typ: 280, high: 460 },
      grooming: { low: 420, typ: 720, high: 1100 },
      insurance: { low: 380, typ: 660, high: 1100 }
    },
    drivers: [
      { name: "Protein-losing nephropathy + enteropathy (PLN/PLE).", text: "Wheaten-specific kidney and intestinal protein loss. Annual urine protein/creatinine ratio + albumin testing from age 2+ ($150–$300/yr) catches it early. Treatment for affected dogs runs $100–$300/month for life." },
      { name: "Daily brushing + professional grooming.", text: "The signature silky coat mats within days if not brushed. Plan for 10–15 min/day at home + a professional groom every 6–8 weeks ($70–$110)." },
      { name: "Addison's disease.", text: "Reported at higher rates than the dog population average. Lifelong DOCP injections or oral fludrocortisone ($60–$200/month) once diagnosed." },
      { name: "Renal dysplasia (juvenile).", text: "Less common but documented; affected pups typically present by age 3 with progressive kidney failure." }
    ],
    insurance: "Wheaten premiums average $40–$70/month. Strong fit — PLN/PLE diagnostics + lifelong meds can easily exceed $3,000/yr in affected dogs. Insure young, before any protein-loss flags appear.",
    saveTips: [
      "Run a urine protein/creatinine ratio test annually from age 2 — catches PLN early when management is cheaper.",
      "Confirm breeder screens parents for PLN/PLE and Addison's.",
      "Learn to do at-home maintenance grooming between professional appointments.",
      "Adopt — Soft Coated Wheaten Terrier Club of America rescue handles surrenders regularly."
    ],
    faq: [
      { q: "How much does a Soft Coated Wheaten Terrier cost per year?", a: "$1,800–$3,800. Grooming + PLN/PLE monitoring drive most of the variance." },
      { q: "Are Wheatens hypoallergenic?", a: "Lower-shedding than most breeds and tolerated by many allergic humans, but no dog is truly hypoallergenic. Spend time with the breed before committing." },
      { q: "What is PLN in Wheatens?", a: "Protein-losing nephropathy — a Wheaten-specific kidney disease where protein leaks into urine. Annual screening from age 2 is the standard of care." }
    ],
    sources: ["Soft Coated Wheaten Terrier Club of America PLN/PLE protocols", "AAHA dermatology + renal guidelines", "AKC breed standard"],
    traits: {
      weightM: "35-40", weightF: "30-35", height: "17-19",
      energy: 4, alone: "4-6", kid: "high", stranger: "high", train: 3, shed: 1,
      grm: 70, exMin: "45-60",
      temperament: "Friendly energetic alert",
      goodAt: "family pet companion agility therapy work",
      topFacts: "Coat is silky-soft hair (not fur) — minimal shedding but needs daily brushing to prevent matting|Originally an Irish farm dog used for herding hunting and guarding|PLN and PLE are Wheaten-specific risks — annual protein/creatinine ratio test from age 2 is standard of care|Famous \"Wheaten greetin\" — the breed's enthusiastic jumping welcome",
      affection: 9, child: 9, protective: 4, vocal: 4
    }
  },
  {
    slug: "burmese", species: "cat", name: "Burmese",
    size: "small", grooming: 1.00, healthRisk: 1.15,
    purchase: { low: 1500, typical: 2200, high: 3500 },
    avgLife: 16,
    notes: "Highly social, dog-like cat. Hypokalemic polymyopathy (DNA testable), diabetes, and HCM are documented breed risks. Among the longest-lived cat breeds.",
    yearRange: "$900–$1,900", yearOne: "$2,300–$4,900", lifetime: "$15,000–$32,000",
    costRows: {
      food: { low: 200, typ: 350, high: 600 },
      vet: { low: 220, typ: 440, high: 950 },
      prevention: { low: 80, typ: 140, high: 240 },
      grooming: { low: 0, typ: 0, high: 80 },
      insurance: { low: 280, typ: 480, high: 800 }
    },
    drivers: [
      { name: "Diabetes mellitus.", text: "Burmese have ~3x the diabetes risk of the average cat. Insulin + monitoring runs $80–$200/month once diagnosed. Lean weight + low-carb diet are the best prevention." },
      { name: "Hypokalemic polymyopathy.", text: "Inherited muscle weakness from low potassium. DNA test ($100) at adoption identifies carriers; affected cats need potassium supplementation for life." },
      { name: "Hypertrophic cardiomyopathy (HCM).", text: "Documented in the breed. Annual echo screening at age 3+ ($300–$500/visit) catches early disease." },
      { name: "Brachycephalic-adjacent dental crowding.", text: "Burmese have a slightly shortened muzzle — dental cleanings every 1–2 years ($400–$800)." }
    ],
    insurance: "Burmese premiums average $25–$45/month. Diabetes + HCM cover earn their keep here. Insure young — diabetes is a frequent denial once diagnosed.",
    saveTips: [
      "Maintain lean body condition — biggest factor in diabetes prevention.",
      "Run hypokalemic polymyopathy DNA test at purchase.",
      "Get a second cat as a companion — Burmese hate being alone.",
      "Annual dental brushing at home meaningfully delays professional cleanings."
    ],
    faq: [
      { q: "How much does a Burmese cat cost per year?", a: "$900–$1,900 — typical pedigreed cat range. Diabetes management is the biggest swing item if it develops." },
      { q: "How long do Burmese cats live?", a: "16–18 years is common, with documented cases of 22+. Among the longest-lived cat breeds." },
      { q: "Are Burmese cats good for first-time owners?", a: "Yes — they're affectionate, sociable, and adaptable. Just plan for the high social needs (companion cat or daily check-ins)." }
    ],
    sources: ["Winn Feline Foundation — Burmese diabetes + HCM data", "International Cat Care — hypokalemic polymyopathy", "CFA breed standard"],
    traits: {
      weightM: "8-12", weightF: "7-10", height: "9-11",
      energy: 3, alone: "6-8", kid: "high", stranger: "high", train: 4, shed: 2,
      grm: 5, exMin: "30-45",
      temperament: "Affectionate sociable people-oriented",
      goodAt: "companion lap warmer family apartment living",
      topFacts: "Among the longest-lived cat breeds — 16-18 years is typical 22+ on record|Roughly 3x the diabetes risk of the average cat — lean weight + low-carb diet matter|Hypokalemic polymyopathy is a Burmese-specific risk — DNA test at purchase|Famously dog-like — greets at door follows owners and welcomes strangers",
      affection: 10, child: 9, protective: 2, vocal: 5
    }
  },
  {
    slug: "oriental-shorthair", species: "cat", name: "Oriental Shorthair",
    size: "small", grooming: 1.00, healthRisk: 1.15,
    purchase: { low: 1200, typical: 2000, high: 3500 },
    avgLife: 13,
    notes: "Siamese body type in 300+ colors. Extremely vocal and social. Amyloidosis (kidney/liver) and anesthesia sensitivity are breed-specific concerns.",
    yearRange: "$900–$2,000", yearOne: "$2,100–$4,800", lifetime: "$14,000–$30,000",
    costRows: {
      food: { low: 200, typ: 340, high: 580 },
      vet: { low: 220, typ: 440, high: 950 },
      prevention: { low: 80, typ: 140, high: 240 },
      grooming: { low: 0, typ: 0, high: 60 },
      insurance: { low: 280, typ: 480, high: 800 }
    },
    drivers: [
      { name: "Amyloidosis (kidney + liver).", text: "Inherited from Siamese line. Causes progressive organ failure typically by age 5–10. No cure; management runs $50–$150/month from diagnosis until end of life. Annual SDMA + liver panels from age 3 catch it early." },
      { name: "Anesthesia sensitivity.", text: "Like Siamese, Orientals are more sensitive to anesthesia. Flag this on every surgical pre-op; dental cleanings and spay/neuter need adjusted protocols." },
      { name: "Dental crowding.", text: "Narrow muzzle = crowded teeth. Professional cleanings every 1–2 years ($400–$800)." },
      { name: "Social-needs cost.", text: "Orientals are intensely social — they fail to thrive when left alone all day. Companion cat or daily middle-of-day visits ($15–$25) often needed." }
    ],
    insurance: "Oriental Shorthair premiums average $25–$45/month. Strong fit because amyloidosis is expensive to manage once diagnosed. Insure young, before any kidney flags.",
    saveTips: [
      "Run annual SDMA kidney screening from age 3+ — catches amyloidosis early.",
      "Always remind vets of the anesthesia sensitivity before any surgical procedure.",
      "Get a second cat or another Oriental — they're miserable alone.",
      "Brush teeth 2–3x/week at home to delay professional cleanings."
    ],
    faq: [
      { q: "How much does an Oriental Shorthair cost per year?", a: "$900–$2,000 — typical pedigreed cat range. Amyloidosis monitoring + treatment is the biggest swing item." },
      { q: "Oriental Shorthair vs Siamese — what's the difference?", a: "Same body type, same temperament, but Orientals come in 300+ color/pattern combinations vs Siamese's classic point pattern. Health risks are very similar." },
      { q: "Are Oriental Shorthairs loud?", a: "Yes — extremely vocal. They'll comment on everything. If you want a quiet cat, this isn't the breed." }
    ],
    sources: ["Winn Feline Foundation — Siamese/Oriental amyloidosis data", "CFA breed standard", "AAFP feline anesthesia guidelines"],
    traits: {
      weightM: "8-12", weightF: "6-10", height: "9-11",
      energy: 5, alone: "4-6", kid: "high", stranger: "high", train: 4, shed: 1,
      grm: 5, exMin: "45-60",
      temperament: "Vocal social intelligent active",
      goodAt: "companion lap warmer interactive play apartment living",
      topFacts: "Comes in 300+ color and pattern combinations — same body as Siamese but visually diverse|Among the most vocal cat breeds — will comment on weather food door etc|Amyloidosis (kidney and liver) is inherited from the Siamese line — annual SDMA screening from age 3 is standard|Sensitive to anesthesia like Siamese — flag this before any surgical procedure",
      affection: 9, child: 8, protective: 1, vocal: 9
    }
  },
  {
    slug: "birman", species: "cat", name: "Birman", aka: "Sacred Cat of Burma",
    size: "medium", grooming: 1.05, healthRisk: 1.10,
    purchase: { low: 1200, typical: 2200, high: 3500 },
    avgLife: 15,
    notes: "Color-pointed semi-longhair with distinctive white \"gloves\" on all four paws. HCM and congenital hypotrichosis are documented breed risks. Coat lacks undercoat — minimal matting.",
    yearRange: "$1,000–$2,200", yearOne: "$2,200–$5,200", lifetime: "$15,000–$32,000",
    costRows: {
      food: { low: 220, typ: 380, high: 650 },
      vet: { low: 220, typ: 440, high: 950 },
      prevention: { low: 80, typ: 140, high: 240 },
      grooming: { low: 0, typ: 80, high: 240 },
      insurance: { low: 280, typ: 480, high: 800 }
    },
    drivers: [
      { name: "Hypertrophic cardiomyopathy (HCM).", text: "Documented in the breed. Annual echo screening from age 3+ ($300–$500/visit) catches early disease; meds for affected cats $40–$100/month for life." },
      { name: "Congenital hypotrichosis (rare).", text: "Some Birmans are born partially bald or develop bald patches in kittenhood. Cosmetic only — no treatment needed but worth knowing about." },
      { name: "Dental disease.", text: "Common in pedigreed cats. Professional cleanings every 1–2 years ($400–$800)." },
      { name: "Coat upkeep is moderate.", text: "Semi-longhair without undercoat means less matting than Persian — weekly brushing is usually enough. No professional grooming required." }
    ],
    insurance: "Birman premiums average $25–$45/month. HCM cover earns its keep; otherwise the breed is reasonably healthy.",
    saveTips: [
      "Confirm HCM echo screening on both parents from breeder.",
      "Weekly brushing year-round is usually enough — semi-longhair coat doesn't mat as easily as Persian.",
      "Dental brushing at home meaningfully delays professional cleanings.",
      "Adopt — Birman Health Foundation rescue handles surrenders periodically."
    ],
    faq: [
      { q: "How much does a Birman cat cost per year?", a: "$1,000–$2,200 — moderate pedigreed cat range. HCM monitoring and dental care are the main swing items." },
      { q: "Do Birmans need a lot of grooming?", a: "No — semi-longhair without undercoat means minimal matting. Weekly brushing is usually enough; no professional grooming required." },
      { q: "Birman vs Ragdoll — what's the difference?", a: "Both are color-pointed semi-longhairs. Birmans are smaller (8–12 lb vs Ragdoll's 12–20 lb), have white-gloved paws (Ragdolls don't), and tend to be more active. Birmans live longer on average." }
    ],
    sources: ["Winn Feline Foundation — Birman HCM data", "CFA breed standard", "Birman Health Foundation"],
    traits: {
      weightM: "10-15", weightF: "8-12", height: "8-10",
      energy: 2, alone: "6-10", kid: "high", stranger: "medium", train: 3, shed: 3,
      grm: 20, exMin: "20-30",
      temperament: "Gentle quiet devoted",
      goodAt: "companion family lap warmer apartment living",
      topFacts: "All Birmans have white \"gloves\" on all four paws — distinctive breed marker|Semi-longhair without an undercoat — less matting than Persian|Legend says Birmans were temple cats of ancient Burma — \"Sacred Cat of Burma\"|HCM (heart disease) is documented in the breed — annual echo screening from age 3+ is standard",
      affection: 9, child: 9, protective: 1, vocal: 2
    }
  }
];

/* ---------------- Hero photo picks ---------------- */
const HEROES = {
  "rhodesian-ridgeback":         { pexelsId: 1322735,  pageUrl: "https://www.pexels.com/photo/selective-focus-photograph-of-rhodesian-ridgeback-1322735/", desc: "Rhodesian Ridgeback close-up with expressive eyes" },
  "soft-coated-wheaten-terrier": { pexelsId: 9922532,  pageUrl: "https://www.pexels.com/photo/close-up-photo-of-a-gray-dog-9922532/", desc: "Close-up of a Soft Coated Wheaten Terrier" },
  "burmese":                     { pexelsId: 10347798, pageUrl: "https://www.pexels.com/photo/close-up-photo-of-cat-sitting-on-the-floor-10347798/", desc: "Dark brown Burmese cat sitting attentively indoors" },
  "oriental-shorthair":          { pexelsId: 11943120, pageUrl: "https://www.pexels.com/photo/close-up-shot-of-a-cat-11943120/", desc: "Close-up portrait of an Oriental Shorthair cat with green eyes" },
  "birman":                      { pexelsId: 8736766,  pageUrl: "https://www.pexels.com/photo/close-up-shot-of-a-birman-cat-8736766/", desc: "Close-up of a Birman cat with striking blue eyes" }
};

/* ---------------- HTML template ---------------- */
function escapeHtml(s) {
  return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtMoney(n) { return "$" + Number(n).toLocaleString("en-US"); }

function renderPage(b) {
  const title = b.name + " Cost — Annual, First-Year &amp; Lifetime Estimates";
  const pageUrl = "https://petplanwise.com/breeds/" + b.slug + "-cost/";
  const lcLede = "Most " + b.name + " owners spend <strong>" + b.yearRange + " per year</strong>. Year-one cost runs <strong>" + b.yearOne + "</strong>. Lifetime cost is typically <strong>" + b.lifetime + "</strong> over " + Math.max(1, b.avgLife - 2) + "–" + (b.avgLife + 2) + " years.";

  const driversHtml = b.drivers.map(function (d) {
    return '      <li><strong>' + escapeHtml(d.name) + '</strong> ' + escapeHtml(d.text) + '</li>';
  }).join("\n");
  const savesHtml = b.saveTips.map(function (s) { return '      <li>' + escapeHtml(s) + '</li>'; }).join("\n");
  const faqHtml = b.faq.map(function (f) {
    return '      <details><summary>' + escapeHtml(f.q) + '</summary><p>' + escapeHtml(f.a) + '</p></details>';
  }).join("\n");
  const sourcesHtml = b.sources.map(function (s) { return '<li>' + escapeHtml(s) + '</li>'; }).join("");
  const faqJsonLd = JSON.stringify(b.faq.map(function (f) {
    return { "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } };
  }));
  const calculatorData = b.species === "cat" ? 'data-calculator="cat"' : 'data-calculator="dog"';
  const dataBreed = 'data-breed="' + b.slug + '"';
  const dataStage = 'data-stage="adult"';

  return '<!doctype html>\n<html lang="en">\n<head>\n' +
    '  <meta charset="utf-8" />\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1" />\n' +
    '  <title>' + title + '</title>\n' +
    '  <meta name="description" content="What does a ' + b.name + ' really cost? Adoption, food, vet, lifetime — full breakdown plus prefilled calculator." />\n' +
    '  <meta property="og:description" content="What does a ' + b.name + ' really cost? Adoption, food, vet, lifetime — full breakdown plus prefilled calculator." />\n' +
    '  <meta property="og:title" content="' + title + '" />\n' +
    '  <link rel="canonical" href="' + pageUrl + '" />\n' +
    '  <meta property="og:url" content="' + pageUrl + '" />\n' +
    '  <meta property="og:image" content="https://petplanwise.com/assets/og-image.png" />\n' +
    '  <meta property="og:image:width" content="1200" />\n' +
    '  <meta property="og:image:height" content="630" />\n' +
    '  <meta property="og:type" content="website" />\n' +
    '  <meta name="twitter:card" content="summary_large_image" />\n' +
    '  <meta name="twitter:image" content="https://petplanwise.com/assets/og-image.png" />\n' +
    '  <meta name="twitter:title" content="' + b.name + ' Cost — Annual, First-Year & Lifetime Estimates" />\n' +
    '  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Crect width=\'100\' height=\'100\' rx=\'20\' fill=\'%230F766E\'/%3E%3Ctext x=\'50\' y=\'66\' font-family=\'system-ui,sans-serif\' font-weight=\'700\' font-size=\'58\' fill=\'white\' text-anchor=\'middle\'%3E%24%3C/text%3E%3C/svg%3E" />\n' +
    '\n' +
    '  <link rel="preconnect" href="https://fonts.googleapis.com" data-ppw-inter>\n' +
    '  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin data-ppw-inter>\n' +
    '  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" data-ppw-inter>\n' +
    '  <link rel="stylesheet" href="/assets/css/site.css?v=' + CACHE_V + '" />\n' +
    '  <script src="/assets/data/csv-loader-' + CACHE_V + '.js" defer></script>\n' +
    '  <script src="/assets/data/base-costs.js" defer></script>\n' +
    '  <script src="/assets/data/multipliers.js" defer></script>\n' +
    '  <script src="/assets/data/breeds.js" defer></script>\n' +
    '  <script src="/assets/data/procedures.js" defer></script>\n' +
    '  <script src="/assets/data/insurance.js" defer></script>\n' +
    '  <script src="/assets/data/cities.js" defer></script>\n' +
    '  <script src="/assets/data/breed-images.js" defer></script>\n' +
    '  <script src="/assets/js/layout-' + CACHE_V + '.js" defer></script>\n' +
    '  <script src="/assets/js/calculator-' + CACHE_V + '.js" defer></script>\n' +
    '  <script type="application/ld+json">{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[{"@type":"ListItem","position":1,"name":"Home","item":"https://petplanwise.com/"},{"@type":"ListItem","position":2,"name":"' + b.name + ' cost","item":"' + pageUrl + '"}]}</script>\n' +
    '  <script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":' + faqJsonLd + '}</script>\n' +
    '</head>\n' +
    '<body>\n<div id="site-header"></div>\n<main>\n' +
    '  <div class="container"><nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Home</a><span>›</span>' + b.name + ' cost</nav></div>\n' +
    '  <section style="padding: 24px 0 12px;"><div class="container">\n' +
    '    <span class="eyebrow">' + b.name + '</span>\n' +
    '    <h1>' + b.name + ' cost calculator</h1>\n' +
    '    <figure class="breed-hero-static" style="margin:0 0 16px;border-radius:14px;overflow:hidden;">\n' +
    '      <picture><source type="image/webp" srcset="/breeds/' + b.slug + '-cost/hero.webp"><img src="/breeds/' + b.slug + '-cost/hero.jpg?v=' + CACHE_V + '" width="1600" height="1067" alt="' + b.name + '" loading="eager" fetchpriority="high" decoding="async"></picture>\n' +
    '    </figure>\n' +
    '    <p class="lede prose">' + lcLede + '</p>\n' +
    '  </div></section>\n' +
    renderSnapshotBlock(b) +
    '  <section style="padding-top: 0;"><div class="container"><div ' + calculatorData + ' ' + dataBreed + ' ' + dataStage + '></div></div></section>\n' +
    '\n' +
    '  <section><div class="container prose">\n' +
    '    <h2>Cost summary</h2>\n' +
    '    <table class="cost-table">\n' +
    '      <thead><tr><th>Category</th><th class="num">Low</th><th class="num">Typical</th><th class="num">High</th></tr></thead>\n' +
    '      <tbody>\n' +
    '        <tr><td>Purchase / adoption</td><td class="num">' + fmtMoney(b.purchase.low) + '</td><td class="num">' + fmtMoney(b.purchase.typical) + '</td><td class="num">' + fmtMoney(b.purchase.high) + '</td></tr>\n' +
    '        <tr><td>Annual food</td><td class="num">' + fmtMoney(b.costRows.food.low) + '</td><td class="num">' + fmtMoney(b.costRows.food.typ) + '</td><td class="num">' + fmtMoney(b.costRows.food.high) + '</td></tr>\n' +
    '        <tr><td>Annual vet care</td><td class="num">' + fmtMoney(b.costRows.vet.low) + '</td><td class="num">' + fmtMoney(b.costRows.vet.typ) + '</td><td class="num">' + fmtMoney(b.costRows.vet.high) + '</td></tr>\n' +
    '        <tr><td>Annual prevention</td><td class="num">' + fmtMoney(b.costRows.prevention.low) + '</td><td class="num">' + fmtMoney(b.costRows.prevention.typ) + '</td><td class="num">' + fmtMoney(b.costRows.prevention.high) + '</td></tr>\n' +
    '        <tr><td>Annual grooming</td><td class="num">' + fmtMoney(b.costRows.grooming.low) + '</td><td class="num">' + fmtMoney(b.costRows.grooming.typ) + '</td><td class="num">' + fmtMoney(b.costRows.grooming.high) + '</td></tr>\n' +
    '        <tr><td>Insurance (optional)</td><td class="num">' + fmtMoney(b.costRows.insurance.low) + '</td><td class="num">' + fmtMoney(b.costRows.insurance.typ) + '</td><td class="num">' + fmtMoney(b.costRows.insurance.high) + '</td></tr>\n' +
    '      </tbody>\n' +
    '    </table>\n' +
    '    <p class="cost-table-sources" style="margin: 6px 0 18px; padding: 10px 14px; background: rgba(15,118,110,0.04); border-left: 3px solid rgba(15,118,110,0.35); border-radius: 0 8px 8px 0; font-size: 13px; color: var(--ink-2, #4B5563); line-height: 1.5;"><strong>Where these numbers come from:</strong> Purchase ranges from AKC / CFA breeder directories and adoption-fee averages. Annual food + grooming from AAHA pet care cost guidance scaled by breed size. Vet care + prevention from Banfield <em>State of Pet Health</em> + AAHA preventive care guidelines. Insurance from <a href="https://naphia.org/industry-data/" target="_blank" rel="noopener">NAPHIA 2024 State of the Industry</a>. Full bibliography: <a href="/sources/">/sources/</a>. <span class="muted">Last reviewed: May 2026.</span></p>\n' +
    '\n' +
    '    <h2>' + b.name + '-specific cost drivers</h2>\n' +
    '    <ul>\n' + driversHtml + '\n    </ul>\n' +
    '\n' +
    '    <h2>Insurance for ' + (b.aka || b.name) + 's</h2>\n' +
    '    <p>' + escapeHtml(b.insurance) + '</p>\n' +
    '\n' +
    '    <h2>Ways to save</h2>\n' +
    '    <ul>\n' + savesHtml + '\n    </ul>\n' +
    '  </div></section>\n' +
    '\n' +
    '  <section><div class="container"><p class="affiliate-disclosure-above"><strong>Note:</strong> This is an editorial recommendation linking to our own analysis, not a paid placement. PetPlanWise has no current affiliate partnerships; future paid placements will be labeled "Sponsored" here. <a href="/affiliate-disclosure/">Policy</a>.</p><div class="affiliate">\n' +
    '    <div><span class="affiliate-tag">Editorial</span><h3>Compare insurance for ' + b.name + 's</h3><p>See real quotes from top-rated U.S. pet insurers.</p></div>\n' +
    '    <a class="btn" href="/pet-insurance-vs-savings/">Run the math</a>\n' +
    '  </div></div></section>\n' +
    '\n' +
    '  <section><div class="container">\n' +
    '    <h2>FAQ</h2>\n' +
    '    <div class="faq" style="max-width: var(--readw)">\n' + faqHtml + '\n    </div>\n' +
    '  </div></section>\n' +
    '\n' +
    '  <section><div class="container" style="padding: 12px 0 8px;">\n' +
    '    <div class="reviewer-block">\n' +
    '      <span class="avatar" aria-hidden="true">PC</span>\n' +
    '      <div>\n' +
    '        <div class="who">Fact-checked by PetPlanWise Editorial</div><div class="who-meta" style="font-size:12px;color:var(--muted, #6B7280);font-weight:400;margin-top:2px;">Cost methodology cross-referenced with published AAHA, AVDC, AVMA, NAPHIA, and Banfield data. <a href="/editorial-standards/">Read our editorial standards</a> — no individual veterinarian endorsement.</div>\n' +
    '        <div class="meta">Cost data reviewed May 2026 · methodology audited quarterly</div>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </div></section>\n' +
    '\n' +
    '  <section><div class="container sources">\n' +
    '    <h2>Sources</h2>\n' +
    '    <ul>' + sourcesHtml + '</ul>\n' +
    '  </div></section>\n' +
    '\n' +
    '  <section style="padding: 12px 0 4px;"><div class="container">\n' +
    '    <a href="/compare/?a=' + b.slug + '" class="cmp-deep-link" style="display:inline-flex;align-items:center;gap:8px;padding:10px 16px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.25);border-radius:999px;color:var(--primary-700,#115E59);text-decoration:none;font-size:14px;font-weight:600;">\n' +
    '      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>\n' +
    '      Compare this breed to another →\n' +
    '    </a>\n' +
    '  </div></section>\n' +
    '\n' + renderTraitsCard(b) +
    '</main>\n<div id="site-footer"></div>\n</body>\n</html>\n';
}

function renderSnapshotBlock(b) {
  const t = b.traits;
  const dots = "●".repeat(t.energy) + "○".repeat(5 - t.energy);
  const kid = t.kid === "high" ? "👶 Great with kids" : t.kid === "medium" ? "🧒 Best with respectful kids" : "👤 Adult-only home best";
  const weight = t.weightM + " lb";
  /* Build intro sentence */
  const firstFact = (t.topFacts || "").split("|")[0].trim();
  const temp = t.temperament.charAt(0).toLowerCase() + t.temperament.slice(1);
  const species = b.species === "cat" ? "cat" : "dog";
  const intro = "The " + b.name + " is a " + temp + " " + species + ". " + firstFact + ".";
  return '  \n  <section class="breed-snapshot" style="padding: 6px 0 18px;"><div class="container">\n' +
    '    <p class="breed-snapshot-intro" style="margin: 0 0 14px; color: var(--ink-2, #4B5563); font-size: 1.02rem; line-height: 1.55; max-width: 720px;">' + escapeHtml(intro) + '</p>\n' +
    '    <div class="breed-snapshot-chips" style="display:flex;flex-wrap:wrap;gap:8px;">\n' +
    '      <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.18);border-radius:999px;font-size:13px;font-weight:500;color:var(--primary-700,#115E59);">⚖️ ' + escapeHtml(weight) + '</span>\n' +
    '      <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.18);border-radius:999px;font-size:13px;font-weight:500;color:var(--primary-700,#115E59);">⚡ Energy <span style="font-family:monospace;letter-spacing:1px;">' + dots + '</span></span>\n' +
    '      <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.18);border-radius:999px;font-size:13px;font-weight:500;color:var(--primary-700,#115E59);">' + kid + '</span>\n' +
    '      <span style="display:inline-flex;align-items:center;gap:6px;padding:6px 12px;background:rgba(15,118,110,0.08);border:1px solid rgba(15,118,110,0.18);border-radius:999px;font-size:13px;font-weight:500;color:var(--primary-700,#115E59);">🕒 Alone ' + escapeHtml(t.alone) + ' hrs</span>\n' +
    '    </div>\n' +
    '  </div></section>\n';
}

function renderTraitsCard(b) {
  const t = b.traits;
  const energyDots = "●".repeat(t.energy) + "○".repeat(5 - t.energy);
  const trainDots = "●".repeat(t.train) + "○".repeat(5 - t.train);
  const shedDots = "●".repeat(t.shed) + "○".repeat(5 - t.shed);
  const goodKidsLine = t.kid === "high" ? "<strong>Great with kids;</strong>" : t.kid === "medium" ? "<strong>Generally OK with respectful kids;</strong>" : "<strong>Best in adult-only homes;</strong>";
  const strangerLine = t.stranger === "high" ? "Friendly with strangers." : t.stranger === "medium" ? "Reserved with strangers." : "Wary of strangers.";
  const topFactsList = t.topFacts.split("|").map(function (f) { return '<li>' + escapeHtml(f) + '</li>'; }).join("");
  return '  <section class="breed-traits"><div class="container">\n' +
    '    <h2 id="traits">Traits and temperament — ' + b.name + '</h2>\n' +
    '    <p class="lede prose">A quick read on what living with a ' + b.name + ' is actually like. Numbers are typical breed-standard ranges from AKC (dogs) and CFA / TICA (cats); individual ' + b.name + 's vary.</p>\n' +
    '    <div class="trait-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:14px 18px;margin:18px 0;">\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Weight</div><div style="font-weight:600;margin-top:4px;">' + t.weightM + ' lb (male) · ' + t.weightF + ' lb (female)</div></div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Height</div><div style="font-weight:600;margin-top:4px;">' + t.height + ' inches</div></div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Energy level</div><div style="font-weight:600;margin-top:4px;font-family:monospace;letter-spacing:2px;">' + energyDots + '</div><div style="font-size:12px;color:var(--muted,#6B7280);margin-top:2px;">' + t.exMin + ' min/day of exercise</div></div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Trainability</div><div style="font-weight:600;margin-top:4px;font-family:monospace;letter-spacing:2px;">' + trainDots + '</div></div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Shedding</div><div style="font-weight:600;margin-top:4px;font-family:monospace;letter-spacing:2px;">' + shedDots + '</div><div style="font-size:12px;color:var(--muted,#6B7280);margin-top:2px;">~' + t.grm + ' min/week grooming</div></div>\n' +
    '      <div class="trait-card" style="padding:12px 14px;border:1px solid var(--line,#E5E7EB);border-radius:10px;"><div style="font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--muted,#6B7280);">Time alone</div><div style="font-weight:600;margin-top:4px;">' + t.alone + ' hrs</div></div>\n' +
    '    </div>\n' +
    '    <p class="prose"><strong>Temperament:</strong> ' + t.temperament + '. ' + goodKidsLine + ' ' + strangerLine + '</p>\n' +
    '    <p class="prose"><strong>What they are good at:</strong> ' + t.goodAt + '.</p>\n' +
    '    <h3>Things ' + b.name + ' owners ask about</h3>\n' +
    '    <ul class="prose">' + topFactsList + '</ul>\n' +
    '    <p class="muted text-sm">Sources: AKC breed standards (dogs), CFA / TICA breed standards (cats), Stanley Coren &quot;The Intelligence of Dogs&quot; (trainability ranking), Banfield State of Pet Health (breed-typical conditions). Individual pets vary widely — these are typical, not guaranteed.</p>\n' +
    '  </div></section>\n';
}

/* ---------------- Photo download ---------------- */
function imageUrl(id) {
  return "https://images.pexels.com/photos/" + id + "/pexels-photo-" + id + ".jpeg?auto=compress&cs=tinysrgb&w=1600";
}
function download(url, dest) {
  return new Promise(function (resolve, reject) {
    const file = fs.createWriteStream(dest);
    function req(u) {
      https.get(u, function (res) {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close(); req(res.headers.location); return;
        }
        if (res.statusCode !== 200) {
          file.close(); try { fs.unlinkSync(dest); } catch (e) {}
          reject(new Error("HTTP " + res.statusCode)); return;
        }
        res.pipe(file);
        file.on("finish", function () { file.close(resolve); });
      }).on("error", function (err) {
        file.close(); try { fs.unlinkSync(dest); } catch (e) {}
        reject(err);
      });
    }
    req(url);
  });
}

async function fetchHero(b) {
  const dir = path.join(ROOT, "breeds", b.slug + "-cost");
  const hero = HEROES[b.slug];
  const heroPath = path.join(dir, "hero.jpg");
  const heroOriginal = path.join(dir, "hero-original.jpg");
  const heroWebp = path.join(dir, "hero.webp");
  await download(imageUrl(hero.pexelsId), heroOriginal);

  /* Optimize JPG + create WebP */
  const meta = await sharp(heroOriginal).metadata();
  const targetWidth = Math.min(1600, meta.width || 1600);
  await sharp(heroOriginal).resize(targetWidth, null, { withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true, progressive: true }).toFile(heroPath + ".tmp");
  fs.renameSync(heroPath + ".tmp", heroPath);
  await sharp(heroOriginal).resize(targetWidth, null, { withoutEnlargement: true })
    .webp({ quality: 78 }).toFile(heroWebp + ".tmp");
  fs.renameSync(heroWebp + ".tmp", heroWebp);

  const finalMeta = await sharp(heroPath).metadata();
  /* credit.json */
  fs.writeFileSync(path.join(dir, "credit.json"), JSON.stringify({
    slug: b.slug, source: "Pexels", artist: "Pexels Creator",
    license: "Pexels License (free for commercial use, attribution appreciated)",
    source_url: hero.pageUrl, description: hero.desc
  }, null, 2), "utf8");
  return { width: finalMeta.width, height: finalMeta.height };
}

/* ---------------- CSV updates ---------------- */
function csvEscape(s) {
  s = String(s == null ? "" : s);
  if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
function breedSource(slug, species) {
  return species === "cat" ? "https://cfa.org/breeds/" : "https://www.akc.org/dog-breeds/";
}
function appendBreedRows() {
  const breedsPath = path.join(ROOT, "assets/data/csv/breeds.csv");
  let existing = fs.readFileSync(breedsPath, "utf8");
  if (!existing.endsWith("\n")) existing += "\n";
  const newRows = BREEDS.map(function (b) {
    return [b.slug, b.species, b.name, b.size, b.grooming.toFixed(2), b.healthRisk.toFixed(2),
      b.purchase.low, b.purchase.typical, b.purchase.high, b.avgLife, b.notes,
      breedSource(b.slug, b.species), REVIEWED].map(csvEscape).join(",");
  }).join("\n");
  fs.writeFileSync(breedsPath, existing + newRows + "\n", "utf8");

  const traitsPath = path.join(ROOT, "assets/data/csv/breed-traits.csv");
  let existingT = fs.readFileSync(traitsPath, "utf8");
  if (!existingT.endsWith("\n")) existingT += "\n";
  const newTraitsRows = BREEDS.map(function (b) {
    const t = b.traits;
    return [b.slug, t.weightM, t.weightF, t.height, t.energy, t.alone, t.kid, t.stranger,
      t.train, t.shed, t.grm, t.exMin, t.temperament, t.goodAt, t.topFacts,
      t.affection, t.child, t.protective, t.vocal].map(csvEscape).join(",");
  }).join("\n");
  fs.writeFileSync(traitsPath, existingT + newTraitsRows + "\n", "utf8");
}

/* ---------------- Hub splicing ---------------- */
function hubCardLine(b) {
  const blurbShort = b.notes.split(".")[0] + ".";
  const blurbDisplay = blurbShort.replace(/^./, function (c) { return c.toUpperCase(); });
  return '      <a class="card card-link breed-card" data-species="' + b.species +
    '" data-name="' + b.name.toLowerCase() +
    '" data-blurb="' + escapeHtml(blurbShort.toLowerCase()) +
    '" href="/breeds/' + b.slug + '-cost/"><div class="breed-card-body"><h3>' +
    b.name + '</h3><p class="muted">' + escapeHtml(blurbDisplay) +
    '</p></div><span class="breed-card-thumb" aria-hidden="true"><img src="/breeds/' +
    b.slug + '-cost/hero.jpg?v=' + CACHE_V +
    '" alt="" loading="lazy" width="84" height="84" decoding="async"></span></a>';
}

function injectIntoHub() {
  const hubPath = path.join(ROOT, "breeds", "index.html");
  let html = fs.readFileSync(hubPath, "utf8");

  function spliceGroup(species, newBreeds) {
    if (!newBreeds.length) return;
    const groupAnchor = 'id="breed-group-' + species + '"';
    const anchorIdx = html.indexOf(groupAnchor);
    const gridOpen = html.indexOf('<div class="grid grid-3">', anchorIdx);
    const afterGrid = html.indexOf('>', gridOpen) + 1;
    const cardRe = /<a class="card card-link breed-card"[^>]*>[\s\S]*?<\/a>/g;
    cardRe.lastIndex = afterGrid;
    const existing = [];
    let lastEnd = afterGrid;
    let m;
    while ((m = cardRe.exec(html)) !== null) {
      const closingDivIdx = html.indexOf('</div>', lastEnd);
      if (m.index > closingDivIdx && closingDivIdx > 0) break;
      existing.push({
        name: (m[0].match(/data-name="([^"]+)"/) || [, ""])[1],
        raw: m[0],
        href: (m[0].match(/href="([^"]+)"/) || [, ""])[1]
      });
      lastEnd = cardRe.lastIndex;
    }
    const gridClose = html.indexOf('      </div>', lastEnd);

    const seen = {};
    const merged = [];
    existing.forEach(function (e) {
      if (seen[e.href]) return;
      seen[e.href] = 1;
      merged.push({ name: e.name, line: "      " + e.raw });
    });
    newBreeds.forEach(function (b) {
      const href = "/breeds/" + b.slug + "-cost/";
      if (seen[href]) return;
      seen[href] = 1;
      merged.push({ name: b.name.toLowerCase(), line: hubCardLine(b) });
    });
    merged.sort(function (a, b) { return a.name.localeCompare(b.name); });

    const newGridBody = merged.map(function (x) { return x.line; }).join("\n") + "\n      ";
    html = html.substring(0, afterGrid) + "\n" + newGridBody + html.substring(gridClose);
  }
  spliceGroup("dog", BREEDS.filter(function (b) { return b.species === "dog"; }));
  spliceGroup("cat", BREEDS.filter(function (b) { return b.species === "cat"; }));

  /* Counts: 48 -> 50 dogs, 18 -> 21 cats, total 66 -> 71 */
  html = html.replace('<span class="visible-count" id="visible-count-dog">48 breeds</span>',
                      '<span class="visible-count" id="visible-count-dog">50 breeds</span>');
  html = html.replace('<span class="visible-count" id="visible-count-cat">18 breeds</span>',
                      '<span class="visible-count" id="visible-count-cat">21 breeds</span>');
  html = html.replace('data-filter="all" class="is-active" role="tab">All<span class="pill-count">66</span>',
                      'data-filter="all" class="is-active" role="tab">All<span class="pill-count">71</span>');
  html = html.replace('data-filter="dog" role="tab">Dogs<span class="pill-count">48</span>',
                      'data-filter="dog" role="tab">Dogs<span class="pill-count">50</span>');
  html = html.replace('data-filter="cat" role="tab">Cats<span class="pill-count">18</span>',
                      'data-filter="cat" role="tab">Cats<span class="pill-count">21</span>');

  /* ItemList JSON-LD: append new entries */
  const ilMatch = html.match(/"@type":"ItemList","itemListElement":\[(.*?)\]\}/);
  if (ilMatch) {
    const posMatches = ilMatch[1].match(/"position":(\d+)/g) || [];
    let maxPos = 0;
    posMatches.forEach(function (m) {
      const n = parseInt(m.match(/\d+/)[0], 10);
      if (n > maxPos) maxPos = n;
    });
    const alreadyHas = BREEDS.every(function (b) {
      return ilMatch[1].indexOf("/breeds/" + b.slug + "-cost/") >= 0;
    });
    if (!alreadyHas) {
      const newItemsJson = BREEDS.map(function (b, i) {
        return ',{"@type":"ListItem","position":' + (maxPos + 1 + i) +
          ',"name":' + JSON.stringify(b.name) +
          ',"url":' + JSON.stringify("https://petplanwise.com/breeds/" + b.slug + "-cost/") + '}';
      }).join("");
      html = html.replace('"@type":"ItemList","itemListElement":[' + ilMatch[1] + ']}',
                          '"@type":"ItemList","itemListElement":[' + ilMatch[1] + newItemsJson + ']}');
    }
  }

  fs.writeFileSync(hubPath, html, "utf8");
}

/* ---------------- Update layout JS + find-my-breed + homepage counts ---------------- */
function updateRefsAcrossSite() {
  /* layout-*.js: 66 dogs & cats -> 71 */
  const layoutPath = path.join(ROOT, "assets/js/layout-" + CACHE_V + ".js");
  let layout = fs.readFileSync(layoutPath, "utf8");
  layout = layout.replace("66 dogs &amp; cats · photos · traits · costs",
                          "71 dogs &amp; cats · photos · traits · costs");
  fs.writeFileSync(layoutPath, layout, "utf8");

  /* find-my-breed/index.html: 48 -> 50, 18 -> 21, total 66 -> 71, CAT_SLUGS expansion */
  const fmbPath = path.join(ROOT, "find-my-breed/index.html");
  let fmb = fs.readFileSync(fmbPath, "utf8");
  fmb = fmb.replace("Real trait data from 66 breeds", "Real trait data from 71 breeds");
  fmb = fmb.replace('<span class="fmb-tile-sub">48 breeds</span>',
                    '<span class="fmb-tile-sub">50 breeds</span>');
  fmb = fmb.replace('<span class="fmb-tile-sub">18 breeds</span>',
                    '<span class="fmb-tile-sub">21 breeds</span>');
  /* Add new cat slugs to CAT_SLUGS map */
  if (fmb.indexOf('"birman":1') < 0) {
    fmb = fmb.replace(
      '"siamese":1, "siberian-cat":1, "sphynx":1',
      '"birman":1, "burmese":1, "oriental-shorthair":1, "siamese":1, "siberian-cat":1, "sphynx":1'
    );
  }
  fs.writeFileSync(fmbPath, fmb, "utf8");

  /* compare/index.html: 66 -> 71 */
  const cmpPath = path.join(ROOT, "compare/index.html");
  let cmp = fs.readFileSync(cmpPath, "utf8");
  cmp = cmp.replace("Pick any two of our 66 breeds.", "Pick any two of our 71 breeds.");
  fs.writeFileSync(cmpPath, cmp, "utf8");

  /* index.html homepage: 66 dog and cat breeds -> 71, 66 breeds → 71 breeds */
  const idxPath = path.join(ROOT, "index.html");
  let idx = fs.readFileSync(idxPath, "utf8");
  idx = idx.replace("Photos, traits, temperament, and costs for 66 dog and cat breeds.",
                    "Photos, traits, temperament, and costs for 71 dog and cat breeds.");
  idx = idx.replace('<span class="count">66 breeds →</span>', '<span class="count">71 breeds →</span>');
  fs.writeFileSync(idxPath, idx, "utf8");
}

/* ---------------- Main ---------------- */
async function main() {
  let pagesWritten = 0;
  for (const b of BREEDS) {
    const dir = path.join(ROOT, "breeds", b.slug + "-cost");
    if (fs.existsSync(dir)) {
      console.log("Skipping " + b.slug + " — already exists");
      continue;
    }
    fs.mkdirSync(dir, { recursive: true });
    /* Download photo first so we can read its dimensions for the page */
    try {
      const dims = await fetchHero(b);
      /* Render page with placeholder dims then patch */
      let html = renderPage(b);
      html = html.replace(/width="1600" height="1067"/,
                          'width="' + dims.width + '" height="' + dims.height + '"');
      fs.writeFileSync(path.join(dir, "index.html"), html, "utf8");
      pagesWritten++;
      console.log("✓ " + b.slug + " (" + dims.width + "x" + dims.height + ")");
    } catch (e) {
      console.error("✗ " + b.slug + " — " + e.message);
    }
  }
  if (pagesWritten) {
    appendBreedRows();
    injectIntoHub();
    updateRefsAcrossSite();
    console.log("\nAll done. " + pagesWritten + " new breed pages + CSVs + hub + counts updated");
  }
}

main().catch(function (e) { console.error(e); process.exit(1); });
