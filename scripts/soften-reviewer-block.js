#!/usr/bin/env node
/* Replace the per-page "Reviewed by PetPlanWise Editorial" block
   with honest editorial-fact-checked copy (no clinical-review implication).
   Adds a link to /editorial-standards/.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");

const OLD = '<div class="who">Reviewed by PetPlanWise Editorial</div><div class="who-meta" style="font-size:12px;color:var(--muted, #6B7280);font-weight:400;margin-top:2px;">Cost methodology + breed-risk assumptions checked against AAHA, AVDC, AVMA, and Banfield published data</div>';

const NEW = '<div class="who">Fact-checked by PetPlanWise Editorial</div><div class="who-meta" style="font-size:12px;color:var(--muted, #6B7280);font-weight:400;margin-top:2px;">Cost methodology cross-referenced with published AAHA, AVDC, AVMA, NAPHIA, and Banfield data. <a href="/editorial-standards/">Read our editorial standards</a> — no individual veterinarian endorsement.</div>';

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git" || e.name === ".vercel") continue;
      walk(path.join(dir, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) {
      out.push(path.join(dir, e.name));
    }
  }
  return out;
}

const files = walk(ROOT, []);
let changed = 0;
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  if (html.indexOf(OLD) >= 0) {
    fs.writeFileSync(f, html.split(OLD).join(NEW), "utf8");
    changed++;
  }
}
console.log("Softened reviewer block in " + changed + " files");
