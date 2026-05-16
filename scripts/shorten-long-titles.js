#!/usr/bin/env node
/* Audit P1 #21: shorten the 125 pages whose <title> is over 65 chars.
   - Breed-state (101 pages): "{Breed} Cost in {State} (2026): Annual, First Year, Lifetime"
     -> "{Breed} Cost in {State} (2026) | PetPlanWise"
   - Breed (16 pages): "{Breed} Cost — Annual, First-Year & Lifetime Estimates"
     -> "{Breed} Cost (2026) | PetPlanWise"
   - Guide (6 pages): hand-shortened map below

   Also updates the matching og:title / twitter:title where the same
   long string appears. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function walk(d, out) {
  for (const e of fs.readdirSync(d, {withFileTypes:true})) {
    if (e.isDirectory()) {
      if ([".git","node_modules",".vercel",".claude"].includes(e.name)) continue;
      walk(path.join(d, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) out.push(path.join(d, e.name));
  }
  return out;
}

/* Hand-shortened map for guide pages too long to fix via regex */
const GUIDE_MAP = {
  "Hidden Pet Costs Most Articles Miss: 12 Real Line Items That Add $300-$1,500/year":
    "Hidden Pet Costs: 12 Real Line Items ($300–$1,500/yr) | PetPlanWise",
  "Why Are Vet Bills So Expensive in 2026? The Six Causes Behind the Price Increase":
    "Why Vet Bills Are So Expensive in 2026: 6 Causes | PetPlanWise",
  "Dog Spay Cost — What to Expect at General Practice vs Low-Cost Clinics":
    "Dog Spay Cost: GP vs Low-Cost Clinics (2026) | PetPlanWise",
  "Average Cost of Owning a Cat (2026): Real U.S. Numbers, Year by Year":
    "Average Cost of Owning a Cat (2026) | PetPlanWise",
  "Average Cost of Owning a Dog (2026): Real U.S. Numbers, Year by Year":
    "Average Cost of Owning a Dog (2026) | PetPlanWise"
};

/* Regex sweep for templated patterns */
const SWEEPS = [
  /* Breed-state: "<Breed> Cost in <State> (2026): Annual, First Year, Lifetime" */
  {
    re: /<title>([^<]+? Cost in [A-Z][^<]+?) \(2026\): Annual, First Year, Lifetime<\/title>/,
    replace: function (match, prefix) {
      return "<title>" + prefix + " (2026) | PetPlanWise</title>";
    },
    metaRe: />[^<]+? Cost in [A-Z][^<]+? \(2026\): Annual, First Year, Lifetime</g
  },
  /* Breed: "<Breed> Cost — Annual, First-Year & Lifetime Estimates" */
  {
    re: /<title>([^<]+?) Cost — Annual, First-Year (?:&amp;|&) Lifetime Estimates<\/title>/,
    replace: function (match, breed) {
      return "<title>" + breed + " Cost (2026) | PetPlanWise</title>";
    },
    metaRe: null
  }
];

const files = walk(ROOT, []);
let touched = 0, guideTouched = 0;

for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  const orig = html;

  /* Sweep templated patterns */
  for (const s of SWEEPS) {
    const m = html.match(s.re);
    if (m) {
      const newTitle = s.replace(...m);
      const newPlain = newTitle.replace(/^<title>/, "").replace(/<\/title>$/, "");
      const oldPlain = m[0].replace(/^<title>/, "").replace(/<\/title>$/, "");
      html = html.replace(s.re, newTitle);
      /* Also update og:title and twitter:title if they share the same string */
      html = html.replace(new RegExp('content="' + oldPlain.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + '"', "g"),
                          'content="' + newPlain + '"');
    }
  }

  /* Hand-shorten specific guides */
  for (const oldT of Object.keys(GUIDE_MAP)) {
    const newT = GUIDE_MAP[oldT];
    /* Title tag */
    if (html.indexOf("<title>" + oldT + "</title>") >= 0) {
      html = html.split("<title>" + oldT + "</title>").join("<title>" + newT + "</title>");
      guideTouched++;
    }
    /* og:title / twitter:title — match content="..." */
    html = html.split('content="' + oldT + '"').join('content="' + newT + '"');
  }

  if (html !== orig) {
    fs.writeFileSync(f, html, "utf8");
    touched++;
  }
}
console.log("Pages touched: " + touched);
console.log("Guide titles hand-shortened: " + guideTouched);
