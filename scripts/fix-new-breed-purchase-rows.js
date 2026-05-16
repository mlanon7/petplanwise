#!/usr/bin/env node
/* Fix the "Purchase / adoption" first-year row on the 16 new breed pages.
   The original template generated 70%/100%/130% of `purchase_typical`,
   ignoring `purchase_low` and `purchase_high` from breeds.csv. Replace
   the row's low/typical/high cells with the actual CSV values.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') inQ = false;
      else field += c;
    } else {
      if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") {
        if (field.length || row.length) { row.push(field); rows.push(row); row = []; field = ""; }
      } else field += c;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const header = rows[0];
  return rows.slice(1).map(function (r) {
    const o = {};
    header.forEach(function (h, i) { o[h] = (r[i] || "").trim(); });
    return o;
  });
}

function fmtMoney(n) {
  n = parseInt(n, 10);
  if (!isFinite(n)) return "$0";
  return "$" + n.toLocaleString("en-US");
}

const breeds = parseCSV(fs.readFileSync(path.join(ROOT, "assets/data/csv/breeds.csv"), "utf8"));
const NEW_BREEDS = [
  "abyssinian", "american-shorthair", "belgian-malinois", "bernedoodle",
  "cavapoo", "goldendoodle", "havanese", "labradoodle", "maltese",
  "munchkin", "norwegian-forest-cat", "russian-blue", "saint-bernard",
  "savannah-cat", "shiba-inu", "vizsla",
];
const bySlug = {};
breeds.forEach(function (b) { bySlug[b.slug] = b; });

let touched = 0;
for (const slug of NEW_BREEDS) {
  const row = bySlug[slug];
  if (!row) { console.log("CSV missing: " + slug); continue; }
  const lo = fmtMoney(row.purchase_low);
  const ty = fmtMoney(row.purchase_typical);
  const hi = fmtMoney(row.purchase_high);

  const file = path.join(ROOT, "breeds", slug + "-cost", "index.html");
  if (!fs.existsSync(file)) { console.log("HTML missing: " + slug); continue; }
  let html = fs.readFileSync(file, "utf8");
  // Match the Purchase / adoption row's three numeric cells and replace them.
  const re = /(<td>Purchase \/ adoption<\/td>)\s*<td class="num">\$[0-9,]+<\/td>\s*<td class="num">\$[0-9,]+<\/td>\s*<td class="num">\$[0-9,]+<\/td>/;
  if (!re.test(html)) { console.log("Row not found: " + slug); continue; }
  html = html.replace(re, "$1<td class=\"num\">" + lo + "</td><td class=\"num\">" + ty + "</td><td class=\"num\">" + hi + "</td>");
  fs.writeFileSync(file, html, "utf8");
  touched++;
  console.log("  " + slug + ": " + lo + " / " + ty + " / " + hi);
}
console.log("\nFixed Purchase row on " + touched + " of " + NEW_BREEDS.length + " pages");
