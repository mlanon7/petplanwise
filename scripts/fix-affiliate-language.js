#!/usr/bin/env node
/* Audit fix: affiliate disclosure blocks said "affiliate partner" and
   showed a "Sponsored" tag, but the CTA links to internal pages like
   /pet-insurance-vs-savings/. That misleads readers about what's a
   paid recommendation vs editorial guidance.

   This sweep:
   - Rewrites the disclosure copy to make clear the link is internal/
     editorial, not a paid placement
   - Replaces the "Sponsored" tag with "Editorial"

   When real affiliate partnerships are added later, the disclosure
   block on those pages should be flipped back to the original
   "affiliate partner" wording. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const OLD_DISCLOSURE = '<p class="affiliate-disclosure-above"><strong>Disclosure:</strong> The link below is an affiliate partner. We may earn a commission at no extra cost to you. This does not affect our cost estimates. <a href="/affiliate-disclosure/">Learn more.</a></p>';
const NEW_DISCLOSURE = '<p class="affiliate-disclosure-above"><strong>Note:</strong> This is an editorial recommendation linking to our own analysis, not a paid placement. PetPlanWise has no current affiliate partnerships; future paid placements will be labeled "Sponsored" here. <a href="/affiliate-disclosure/">Policy</a>.</p>';

const OLD_TAG = '<span class="affiliate-tag">Sponsored</span>';
const NEW_TAG = '<span class="affiliate-tag">Editorial</span>';

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === ".git" || e.name === "node_modules" || e.name === ".vercel" || e.name === ".claude") continue;
      walk(path.join(dir, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}

const files = walk(ROOT, []);
let touched = 0;
for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  const orig = html;
  html = html.split(OLD_DISCLOSURE).join(NEW_DISCLOSURE);
  html = html.split(OLD_TAG).join(NEW_TAG);
  if (html !== orig) {
    fs.writeFileSync(f, html, "utf8");
    touched++;
  }
}
console.log("Updated " + touched + " HTML files (replaced misleading affiliate disclosure + Sponsored tag with editorial language)");
