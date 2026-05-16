#!/usr/bin/env node
/* For each state page, inject a "Related cost guides" + "Popular breeds
   in <state>" section linking to all available breed×state variants for
   that state. Skips if marker already present.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const STATES_DIR = path.join(ROOT, "states");
const BREEDS_DIR = path.join(ROOT, "breeds");

const STATE_DISPLAY = {
  arizona: "Arizona", california: "California", colorado: "Colorado",
  florida: "Florida", georgia: "Georgia", illinois: "Illinois",
  indiana: "Indiana", maryland: "Maryland", massachusetts: "Massachusetts",
  michigan: "Michigan", minnesota: "Minnesota", missouri: "Missouri",
  nevada: "Nevada", "new-jersey": "New Jersey", "new-york": "New York",
  "north-carolina": "North Carolina", ohio: "Ohio", oklahoma: "Oklahoma",
  oregon: "Oregon", pennsylvania: "Pennsylvania", tennessee: "Tennessee",
  texas: "Texas", virginia: "Virginia", washington: "Washington",
  wisconsin: "Wisconsin",
};

const RELATED_GUIDES = [
  ["/guides/average-cost-of-owning-a-dog/", "Average cost of owning a dog"],
  ["/guides/average-cost-of-owning-a-cat/", "Average cost of owning a cat"],
  ["/guides/puppy-first-year-cost/", "Puppy first-year cost"],
  ["/guides/kitten-first-year-cost/", "Kitten first-year cost"],
  ["/guides/emergency-vet-visit-cost/", "Emergency vet visit cost"],
  ["/guides/pet-insurance-vs-savings/", "Pet insurance vs savings"],
  ["/guides/why-are-vet-bills-so-expensive-in-2026/", "Why are vet bills so expensive in 2026?"],
];

const MARKER = "<!-- state-cross-links -->";

function listDirs(dir) {
  return fs.readdirSync(dir).filter(function (n) {
    return fs.statSync(path.join(dir, n)).isDirectory();
  });
}

function breedDisplay(base) {
  return base.split("-").map(function (w) { return w[0].toUpperCase() + w.slice(1); }).join(" ");
}

const breedDirs = listDirs(BREEDS_DIR);

function variantsForState(state) {
  const re = new RegExp("^(.+?)-cost-in-" + state + "$");
  const out = [];
  for (const d of breedDirs) {
    const m = d.match(re);
    if (m) out.push({ base: m[1], dir: "/breeds/" + d + "/" });
  }
  return out;
}

const stateDirs = listDirs(STATES_DIR);
let touched = 0;
for (const sd of stateDirs) {
  const m = sd.match(/^(.+)-pet-cost$/);
  if (!m) continue;
  const stateSlug = m[1];
  const display = STATE_DISPLAY[stateSlug] || stateSlug;

  const file = path.join(STATES_DIR, sd, "index.html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  if (html.indexOf(MARKER) >= 0) continue;

  const variants = variantsForState(stateSlug);
  const breedItems = variants.map(function (v) {
    return '<li><a href="' + v.dir + '">' + breedDisplay(v.base) + " cost in " + display + "</a></li>";
  }).join("\n        ");

  const guideItems = RELATED_GUIDES.map(function (g) {
    return '<li><a href="' + g[0] + '">' + g[1] + "</a></li>";
  }).join("\n        ");

  let breedsBlock = "";
  if (variants.length > 0) {
    breedsBlock =
      '  <section><div class="container">\n' +
      '    <h2>Popular breeds in ' + display + "</h2>\n" +
      '    <p>Breed-specific cost pages localized to ' + display + ":</p>\n" +
      '    <ul class="link-grid" style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px 18px;">\n' +
      "        " + breedItems + "\n" +
      "    </ul>\n" +
      "  </div></section>\n";
  }

  const guidesBlock =
    '  <section><div class="container">\n' +
    "    <h2>Related cost guides</h2>\n" +
    '    <ul class="link-grid" style="list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:6px 18px;">\n' +
    "        " + guideItems + "\n" +
    "    </ul>\n" +
    "  </div></section>\n";

  const section = "\n  " + MARKER + "\n" + breedsBlock + guidesBlock;

  if (html.indexOf("</main>") >= 0) {
    html = html.replace("</main>", section + "</main>");
    fs.writeFileSync(file, html, "utf8");
    touched++;
  }
}
console.log("Injected cross-links in " + touched + " state pages");
