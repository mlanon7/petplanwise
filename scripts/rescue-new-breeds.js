#!/usr/bin/env node
/* Repoint the 16 new breed pages to the current asset versions.
   These pages were created from a pre-bump template and reference
   files that have since been renamed:
     layout-20260510i.js     -> layout-20260515b.js
     calculator-20260510.js  -> calculator-20260515b.js
     csv-loader-20260510.js  -> csv-loader-20260515b.js
     site.css?v=20260510m    -> site.css?v=20260515b
   Also strips NUL byte padding.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const NEW_BREEDS = [
  "abyssinian", "american-shorthair", "belgian-malinois", "bernedoodle",
  "cavapoo", "goldendoodle", "havanese", "labradoodle", "maltese",
  "munchkin", "norwegian-forest-cat", "russian-blue", "saint-bernard",
  "savannah-cat", "shiba-inu", "vizsla",
];

const REPLACEMENTS = [
  ["layout-20260510i.js", "layout-20260515b.js"],
  ["calculator-20260510.js", "calculator-20260515b.js"],
  ["csv-loader-20260510.js", "csv-loader-20260515b.js"],
  ["v=20260510m", "v=20260515b"],
];

function stripNulls(s) {
  let out = "";
  for (let i = 0; i < s.length; i++) {
    if (s.charCodeAt(i) !== 0) out += s[i];
  }
  return out;
}

let touched = 0;
for (const slug of NEW_BREEDS) {
  const file = path.join(ROOT, "breeds", slug + "-cost", "index.html");
  if (!fs.existsSync(file)) {
    console.log("MISSING: " + file);
    continue;
  }
  let html = fs.readFileSync(file, "utf8");
  const orig = html;
  html = stripNulls(html);
  for (const [from, to] of REPLACEMENTS) {
    html = html.split(from).join(to);
  }
  if (html !== orig) {
    fs.writeFileSync(file, html, "utf8");
    touched++;
  }
}
console.log("Rescued " + touched + " of " + NEW_BREEDS.length + " new breed pages");
