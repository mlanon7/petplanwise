#!/usr/bin/env node
/* v2: Heals the broken Purchase / adoption rows on the 16 new breed pages.
   v1 had a JS-replace dollar-sign backreference bug that corrupted the
   typical/high cells. This script uses a function callback (no backref
   interpretation) and tolerates either the corrupted or original markup.
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
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  // Match the whole <tr> for Purchase / adoption (greedy stops at </tr>).
  const re = /<tr>\s*<td>Purchase \/ adoption<\/td>[\s\S]*?<\/tr>/;
  if (!re.test(html)) { console.log("Row not found: " + slug); continue; }
  const fresh = "<tr><td>Purchase / adoption</td>" +
    "<td class=\"num\">" + lo + "</td>" +
    "<td class=\"num\">" + ty + "</td>" +
    "<td class=\"num\">" + hi + "</td>" +
    "</tr>";
  html = html.replace(re, function () { return fresh; });
  fs.writeFileSync(file, html, "utf8");
  touched++;
  console.log("  " + slug + ": " + lo + " / " + ty + " / " + hi);
}
console.log("\nHealed Purchase row on " + touched + " of " + NEW_BREEDS.length + " pages");
