#!/usr/bin/env node
/* Sanity-check every row in assets/data/csv/breed-traits.csv. Flags:
   - weight / height not a numeric range like "65-80" or single number
   - energy_1to5 / trainability_1to5 / shedding_1to5 outside 1-5
   - alone_hours not formatted as a range (e.g. "4-6") or single number
   - kid_friendly / stranger_friendly not one of high/medium/low
   - grooming_minutes_per_week / exercise_minutes_per_day non-numeric
   - affection / child_tolerance / protective / vocality outside 1-10
   - any field that's empty when it shouldn't be */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function parseCSV(text) {
  var rows = [], row = [], field = "", inQ = false;
  for (var i = 0; i < text.length; i++) {
    var c = text[i];
    if (inQ) {
      if (c === '"' && text[i+1] === '"') { field += '"'; i++; }
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

/* Returns true if `s` is a numeric range like "65-80", a single number "30", or "30+" */
function isNumericRange(s) {
  s = String(s || "").trim();
  if (!s) return false;
  /* Single int / float */
  if (/^\d+(\.\d+)?$/.test(s)) return true;
  /* Range like "65-80" or "65.5-80" */
  if (/^\d+(\.\d+)?-\d+(\.\d+)?$/.test(s)) return true;
  /* "30+" (open upper bound) */
  if (/^\d+\+$/.test(s)) return true;
  return false;
}

function inRange(s, lo, hi) {
  var n = parseFloat(s);
  if (isNaN(n)) return false;
  return n >= lo && n <= hi;
}

var rows = parseCSV(fs.readFileSync(path.join(ROOT, "assets/data/csv/breed-traits.csv"), "utf8"));
var header = rows[0];
var idx = {};
header.forEach(function (h, i) { idx[h] = i; });

var issues = [];
for (var r = 1; r < rows.length; r++) {
  var row = rows[r];
  if (!row[0]) continue;
  var slug = row[0];
  var local = [];

  /* Weights */
  ["weight_male_lb", "weight_female_lb"].forEach(function (col) {
    var v = row[idx[col]];
    if (!isNumericRange(v)) local.push(col + "='" + v + "' (not a numeric range)");
  });
  /* Height */
  var h = row[idx["height_in"]];
  if (!isNumericRange(h)) local.push("height_in='" + h + "' (not numeric range)");

  /* Energy 1-5 */
  if (!inRange(row[idx["energy_1to5"]], 1, 5)) local.push("energy_1to5='" + row[idx["energy_1to5"]] + "' (must be 1-5)");
  /* Trainability 1-5 */
  if (!inRange(row[idx["trainability_1to5"]], 1, 5)) local.push("trainability_1to5='" + row[idx["trainability_1to5"]] + "' (must be 1-5)");
  /* Shedding 1-5 */
  if (!inRange(row[idx["shedding_1to5"]], 1, 5)) local.push("shedding_1to5='" + row[idx["shedding_1to5"]] + "' (must be 1-5)");

  /* Alone hours */
  var a = row[idx["alone_hours"]];
  if (!isNumericRange(a)) local.push("alone_hours='" + a + "' (not numeric range)");

  /* Categorical: kid/stranger friendly */
  ["kid_friendly", "stranger_friendly"].forEach(function (col) {
    var v = (row[idx[col]] || "").toLowerCase();
    if (!["high", "medium", "low"].includes(v)) local.push(col + "='" + row[idx[col]] + "' (must be high/medium/low)");
  });

  /* Grooming + exercise minutes */
  var gm = row[idx["grooming_minutes_per_week"]];
  if (!isNumericRange(gm)) local.push("grooming_minutes_per_week='" + gm + "' (not numeric)");
  var ex = row[idx["exercise_minutes_per_day"]];
  if (!isNumericRange(ex)) local.push("exercise_minutes_per_day='" + ex + "' (not numeric range)");

  /* 1-10 scales */
  ["affection_1to10", "child_tolerance_1to10", "protective_1to10", "vocality_1to10"].forEach(function (col) {
    if (!inRange(row[idx[col]], 1, 10)) local.push(col + "='" + row[idx[col]] + "' (must be 1-10)");
  });

  /* Empty descriptive fields */
  ["temperament", "good_at", "top_facts_pipe"].forEach(function (col) {
    if (!String(row[idx[col]] || "").trim()) local.push(col + " is empty");
  });

  if (local.length) {
    issues.push({ slug: slug, problems: local });
  }
}

console.log("Audited " + (rows.length - 1) + " breed rows");
console.log("Issues found: " + issues.length);
issues.forEach(function (i) {
  console.log("\n" + i.slug + ":");
  i.problems.forEach(function (p) { console.log("  - " + p); });
});
