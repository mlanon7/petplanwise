#!/usr/bin/env node
/* For each base breed page that has state variants on disk, inject a
   "Cost in your state" section linking to all variants. Skips if the
   section already exists.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const BREEDS_DIR = path.join(ROOT, "breeds");

const STATE_NAMES = {
  arizona: "Arizona", california: "California", florida: "Florida",
  georgia: "Georgia", illinois: "Illinois", massachusetts: "Massachusetts",
  michigan: "Michigan", "new-jersey": "New Jersey", "new-york": "New York",
  "north-carolina": "North Carolina", ohio: "Ohio", pennsylvania: "Pennsylvania",
  texas: "Texas", virginia: "Virginia", washington: "Washington",
};

const SECTION_MARKER = "<!-- breed-state-cross-links -->";

function listDirs(dir) {
  return fs.readdirSync(dir).filter(function (n) {
    return fs.statSync(path.join(dir, n)).isDirectory();
  });
}

const allDirs = listDirs(BREEDS_DIR);
const baseBreeds = {};
for (const d of allDirs) {
  const m = d.match(/^(.+?)-cost-in-(.+)$/);
  if (m) {
    const base = m[1];
    const state = m[2];
    if (!baseBreeds[base]) baseBreeds[base] = [];
    baseBreeds[base].push(state);
  }
}

function breedTitleSlug(base) {
  return base.split("-").map(function (w) {
    return w[0].toUpperCase() + w.slice(1);
  }).join(" ");
}

let touched = 0;
/* Some base slugs differ from state-variant prefix (e.g. variants use
   "maine-coon-cost-in-*" but base page lives at "maine-coon-cat-cost").
   Try the obvious "-cost" first, then known "-cat-cost" fallback. */
function baseDirFor(base) {
  const candidates = [base + "-cost", base + "-cat-cost"];
  for (const c of candidates) {
    const d = path.join(BREEDS_DIR, c);
    if (fs.existsSync(d)) return d;
  }
  return null;
}

for (const base in baseBreeds) {
  const baseDir = baseDirFor(base);
  if (!baseDir) continue;
  const file = path.join(baseDir, "index.html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  if (html.indexOf(SECTION_MARKER) >= 0) continue;

  baseBreeds[base].sort();
  const items = baseBreeds[base].map(function (st) {
    const dir = "/breeds/" + base + "-cost-in-" + st + "/";
    return '<li><a href="' + dir + '">' + breedTitleSlug(base) + " cost in " + (STATE_NAMES[st] || st) + "</a></li>";
  }).join("\n        ");

  const section =
    "\n  " + SECTION_MARKER + "\n" +
    '  <section><div class="container">\n' +
    '    <h2>' + breedTitleSlug(base) + " cost in your state</h2>\n" +
    '    <p>Local vet labor rates, grooming, and boarding shift the ' + breedTitleSlug(base) + " bottom line by 10–35%. State-specific pages:</p>\n" +
    '    <ul class="link-grid" style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px 18px;">\n' +
    "        " + items + "\n" +
    "    </ul>\n" +
    "  </div></section>\n";

  // Insert before </main>
  if (html.indexOf("</main>") >= 0) {
    html = html.replace("</main>", section + "</main>");
    fs.writeFileSync(file, html, "utf8");
    touched++;
  }
}
console.log("Injected breed→state grid in " + touched + " base-breed pages");
