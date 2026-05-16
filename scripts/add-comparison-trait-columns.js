#!/usr/bin/env node
/* Append 4 new columns to breed-traits.csv for the /compare/ page:
   - affection_1to10        : C-BARQ-style attachment to family (10 = velcro)
   - child_tolerance_1to10  : breed tendency around kids (with size + prey-drive adjustment)
   - protective_1to10       : guarding/territorial instinct
   - vocality_1to10         : how often this breed barks/meows
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const FILE = path.join(ROOT, "assets/data/csv/breed-traits.csv");

const SCORES = {
  // [affection, child_tolerance, protective, vocality]
  "labrador-retriever": [10, 10, 3, 4],
  "french-bulldog":     [9, 8, 3, 3],
  "golden-retriever":   [10, 10, 3, 4],
  "german-shepherd":    [9, 8, 9, 6],
  "bulldog":            [9, 9, 4, 2],
  "maine-coon":         [9, 9, 1, 6],
  "persian":            [8, 6, 1, 3],
  "siamese":            [9, 7, 1, 10],
  "ragdoll":            [10, 10, 1, 4],
  "chihuahua":          [8, 4, 5, 8],
  "poodle":             [9, 9, 4, 5],
  "dachshund":          [8, 5, 6, 7],
  "rottweiler":         [8, 7, 9, 4],
  "australian-shepherd":[9, 8, 6, 5],
  "pitbull":            [10, 8, 5, 4],
  "beagle":             [8, 9, 3, 9],
  "boxer":              [10, 9, 7, 5],
  "yorkshire-terrier":  [8, 5, 4, 7],
  "siberian-husky":     [6, 7, 2, 9],
  "doberman":           [9, 7, 9, 5],
  "pug":                [9, 9, 3, 5],
  "shih-tzu":           [9, 7, 3, 5],
  "cavalier-king-charles":[10, 9, 2, 4],
  "boston-terrier":     [9, 9, 4, 5],
  "mastiff":            [9, 8, 8, 3],
  "great-dane":         [9, 8, 6, 4],
  "pomeranian":         [8, 4, 4, 8],
  "border-collie":      [9, 8, 5, 6],
  "bernese-mountain-dog":[10, 10, 5, 3],
  "cane-corso":         [8, 6, 10, 3],
  "miniature-schnauzer":[9, 8, 6, 7],
  "cocker-spaniel":     [9, 9, 3, 5],
  "australian-cattle-dog":[8, 6, 6, 5],
  "newfoundland":       [10, 10, 5, 3],
  "bengal":             [8, 6, 1, 7],
  "british-shorthair":  [7, 8, 1, 3],
  "sphynx":             [10, 8, 1, 6],
  "scottish-fold":      [9, 8, 1, 4],
  "goldendoodle":       [10, 9, 3, 5],
  "labradoodle":        [10, 9, 3, 5],
  "bernedoodle":        [10, 9, 4, 4],
  "cavapoo":            [10, 9, 2, 4],
  "shiba-inu":          [6, 5, 7, 7],
  "belgian-malinois":   [8, 6, 10, 6],
  "havanese":           [10, 8, 3, 6],
  "maltese":            [9, 5, 3, 7],
  "vizsla":             [10, 9, 4, 5],
  "saint-bernard":      [10, 10, 6, 3],
  "american-shorthair": [7, 9, 1, 4],
  "savannah-cat":       [7, 4, 1, 7],
  "russian-blue":       [8, 6, 1, 3],
  "norwegian-forest-cat":[8, 9, 1, 4],
  "abyssinian":         [8, 7, 1, 5],
  "munchkin":           [9, 8, 1, 5],
};

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
  return rows;
}

function quote(s) {
  if (/[,"\n]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}

const raw = fs.readFileSync(FILE, "utf8");
const rows = parseCSV(raw);
const header = rows[0];

// Detect if columns already added (idempotency)
const NEW_COLS = ["affection_1to10", "child_tolerance_1to10", "protective_1to10", "vocality_1to10"];
const alreadyAdded = NEW_COLS.every(function (c) { return header.indexOf(c) >= 0; });
if (alreadyAdded) {
  console.log("Columns already present — nothing to do.");
  process.exit(0);
}

// Append columns
const newHeader = header.concat(NEW_COLS);
const newRows = [newHeader];
let scored = 0, missing = 0;
for (let i = 1; i < rows.length; i++) {
  const row = rows[i];
  const slug = row[0];
  const scores = SCORES[slug];
  if (!scores) {
    console.log("NO SCORES for slug: " + slug);
    missing++;
    newRows.push(row.concat(["", "", "", ""]));
  } else {
    scored++;
    newRows.push(row.concat(scores.map(String)));
  }
}

const out = newRows.map(function (r) { return r.map(quote).join(","); }).join("\n") + "\n";
fs.writeFileSync(FILE, out, "utf8");
console.log("Added 4 columns. Scored " + scored + " breeds, " + missing + " missing scores.");
