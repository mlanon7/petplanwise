#!/usr/bin/env node
/* fix-brand-and-og.js (one-shot, idempotent)
   1) Standardize the publishing entity name in JSON-LD to "PetPlanWise"
      (was a mix of "PetPlanWise.com" on 155 pages and "Pet Cost Calculator"
      on the homepage) — a consistent entity name is an E-E-A-T signal.
      Only touches JSON-LD `"name":` values, never visible copy/URLs/logo alt.
   2) Add <meta property="og:site_name" content="PetPlanWise"> where missing. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set([".git", "node_modules", ".vercel", ".claude"]);

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (SKIP.has(e.name)) continue; walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}

let brand = 0, homeName = 0, ogAdded = 0;
for (const f of walk(ROOT, [])) {
  const before = fs.readFileSync(f, "utf8");
  let html = before;

  // 1a) schema entity name: "PetPlanWise.com" -> "PetPlanWise" (JSON-LD only)
  html = html.split('"name":"PetPlanWise.com"').join('"name":"PetPlanWise"');
  html = html.split('"name": "PetPlanWise.com"').join('"name": "PetPlanWise"');
  // 1b) homepage WebSite + publisher used "Pet Cost Calculator"
  if (html.indexOf('"name": "Pet Cost Calculator"') !== -1) {
    html = html.split('"name": "Pet Cost Calculator"').join('"name": "PetPlanWise"');
    homeName++;
  }
  if (html !== before) brand++;

  // 2) og:site_name — insert after the canonical link if absent
  if (html.indexOf('property="og:site_name"') === -1) {
    const m = html.match(/<link rel="canonical"[^>]*>/);
    if (m) {
      html = html.replace(m[0], m[0] + '\n<meta property="og:site_name" content="PetPlanWise" />');
      ogAdded++;
    }
  }

  if (html !== before) fs.writeFileSync(f, html, "utf8");
}
console.log("pages with brand-name normalized: " + brand + " (incl. homepage 'Pet Cost Calculator' fixes: " + homeName + ")");
console.log("og:site_name added: " + ogAdded);
