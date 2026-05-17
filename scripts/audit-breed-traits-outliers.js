#!/usr/bin/env node
/* Second-pass sanity check: cross-reference traits with breeds.csv to
   catch outliers — e.g. a "small" breed with weight 100 lb, or a
   "giant" breed with weight 10 lb. Catches the kind of typo the
   structural validator won't flag (because "10-15" is technically
   valid but wrong for a Mastiff). */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function parseCSV(text) {
  var rows = [], row = [], field = "", inQ = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (inQ) { if (c === '"' && text[i+1] === '"') { field += '"'; i++; } else if (c === '"') inQ = false; else field += c; }
    else { if (c === '"') inQ = true;
      else if (c === ",") { row.push(field); field = ""; }
      else if (c === "\n" || c === "\r") { if (field.length || row.length) { row.push(field); rows.push(row); row = []; field = ""; } }
      else field += c; }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  var header = rows[0];
  return rows.slice(1).filter(function(r){return r[0];}).map(function(r){var o={};header.forEach(function(h,i){o[h]=r[i]||"";});return o;});
}

function parseMax(s) {
  var parts = String(s||"").split("-");
  return parseFloat(parts[parts.length-1]) || 0;
}
function parseMin(s) {
  var parts = String(s||"").split("-");
  return parseFloat(parts[0]) || 0;
}

/* Expected weight ranges by size category */
var SIZE_RANGES = {
  toy:    { min:  1, max:  12 },
  small:  { min:  8, max:  30 },
  medium: { min: 20, max:  60 },
  large:  { min: 50, max: 100 },
  giant:  { min: 90, max: 250 }
};

var breeds = parseCSV(fs.readFileSync(path.join(ROOT, "assets/data/csv/breeds.csv"), "utf8"));
var traits = parseCSV(fs.readFileSync(path.join(ROOT, "assets/data/csv/breed-traits.csv"), "utf8"));
var traitsBySlug = {};
traits.forEach(function (t) { traitsBySlug[t.slug] = t; });

var issues = [];
breeds.forEach(function (b) {
  var t = traitsBySlug[b.slug];
  if (!t) { issues.push(b.slug + ": no row in breed-traits.csv"); return; }

  /* Skip mixed-breed / domestic-shorthair — wide weight range by design */
  if (b.slug === "mixed-breed" || b.slug === "domestic-shorthair") return;

  /* Cats: skip size-vs-weight check (size in breeds.csv is always "small" for cats) */
  if (b.species === "cat") return;

  var size = (b.size || "").toLowerCase();
  var rng = SIZE_RANGES[size];
  if (!rng) { issues.push(b.slug + ": unknown size '" + b.size + "' in breeds.csv"); return; }

  var wMaleMin = parseMin(t.weight_male_lb);
  var wMaleMax = parseMax(t.weight_male_lb);

  /* Outlier check: male max should be in/near the expected range */
  if (wMaleMax < rng.min * 0.7) {
    issues.push(b.slug + ": " + b.size + " breed but weight_male_lb='" + t.weight_male_lb + "' too low (max=" + wMaleMax + ", expected " + rng.min + "-" + rng.max + ")");
  }
  if (wMaleMin > rng.max * 1.3) {
    issues.push(b.slug + ": " + b.size + " breed but weight_male_lb='" + t.weight_male_lb + "' too high (min=" + wMaleMin + ", expected " + rng.min + "-" + rng.max + ")");
  }

  /* Height sanity per size category (dogs only, rough) */
  var HEIGHT_RANGES = {
    toy:    { min:  5, max: 12 },
    small:  { min:  6, max: 16 },
    medium: { min: 12, max: 24 },
    large:  { min: 20, max: 32 },
    giant:  { min: 25, max: 36 }
  };
  var hRng = HEIGHT_RANGES[size];
  var hMin = parseMin(t.height_in);
  var hMax = parseMax(t.height_in);
  if (hMax < hRng.min * 0.7) {
    issues.push(b.slug + ": " + b.size + " breed but height_in='" + t.height_in + "' too short");
  }
});

if (issues.length === 0) {
  console.log("No outliers detected across " + breeds.length + " breeds");
} else {
  console.log("Outliers (" + issues.length + "):");
  issues.forEach(function (i) { console.log("  - " + i); });
}
