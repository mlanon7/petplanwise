#!/usr/bin/env node
/* fix-broken-citations.js (one-shot)
   Replace the 16 dead external citation URLs (verified genuine 404s) with the
   current working page from the same authoritative source (each replacement
   curl-verified 200, or 403=bot-blocked-but-exists like AVMA/BLS). Sweeps
   published HTML + the cost CSVs whose source_url pointed at a dead page. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set([".git", "node_modules", ".vercel", ".claude"]);

const MAP = {
  "https://www.carecredit.com/well-u/pet-care/lifetime-of-care-study/": "https://www.carecredit.com/vetmed/costs/",
  "https://avdc.org/AVDC/Resources/POSITION-STATEMENTS/avdc.org": "https://avdc.org/",
  "https://www.aaha.org/aaha-guidelines/senior-care/senior-care-home/": "https://www.aaha.org/resources/",
  "https://www.aaha.org/aaha-guidelines/2019-aaha-canine-life-stage-guidelines/": "https://www.aaha.org/resources/",
  "https://www.aaha.org/aaha-guidelines/dental-care/dental-care-home/": "https://www.aaha.org/resources/",
  "https://www.aaha.org/aaha-guidelines/nutritional-assessment-configuration/home/": "https://www.aaha.org/resources/",
  "https://www.aaha.org/your-pet/pet-owner-education/aaha-guidelines-for-pet-owners/": "https://www.aaha.org/resources/",
  "https://www.aaha.org/your-pet/pet-owner-education/ask-aaha/spay-neuter/": "https://www.aaha.org/resources/",
  "https://www.acvs.org/small-animal/cesarean-section/": "https://www.acvs.org/small-animal/",
  "https://www.acvo.org/common-conditions-1/2018/3/5/cherry-eye": "https://www.acvo.org/common-conditions",
  "https://www.akc.org/expert-advice/dog-breeding/find-responsible-breeder/": "https://www.akc.org/expert-advice/dog-breeding/",
  "https://www.akc.org/expert-advice/health/giant-breeds-special-care/": "https://www.akc.org/expert-advice/",
  "https://www.ofa.org/diseases/breed-statistics/": "https://www.ofa.org/diseases/breed-statistics",
  "https://www.rvc.ac.uk/research/projects/cambridge-bas-research-group": "https://www.rvc.ac.uk/vetcompass",
  "https://www.embracepetinsurance.com/learning/wellness-rewards": "https://www.embracepetinsurance.com/",
  "https://www.americanpetproducts.org/research-insights/industry-trends-and-stats": "https://www.americanpetproducts.org/industry-trends-and-stats",
};

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (SKIP.has(e.name)) continue; walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith(".html") || e.name.endsWith(".csv")) out.push(path.join(dir, e.name));
  }
  return out;
}

const perUrl = {}; let filesChanged = 0;
for (const f of walk(ROOT, [])) {
  let html = fs.readFileSync(f, "utf8");
  const before = html;
  for (const [dead, live] of Object.entries(MAP)) {
    if (html.indexOf(dead) !== -1) {
      const n = html.split(dead).length - 1;
      html = html.split(dead).join(live);
      perUrl[dead] = (perUrl[dead] || 0) + n;
    }
  }
  if (html !== before) { fs.writeFileSync(f, html, "utf8"); filesChanged++; }
}
console.log("files changed: " + filesChanged);
for (const [dead, n] of Object.entries(perUrl)) console.log("  " + n + "x  " + dead.replace(/^https?:\/\//, ""));
const missed = Object.keys(MAP).filter((k) => !perUrl[k]);
if (missed.length) console.log("NOT FOUND (already fixed or absent): " + missed.length);
