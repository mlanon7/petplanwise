#!/usr/bin/env node
/* Audit P0 #8: add row-level source metadata to cost CSVs.
   Adds source_url + last_reviewed columns to:
     breeds.csv                    (AKC / CFA / JAVMA)
     procedures.csv                (AAHA / AVDC / ACVR / ACVS / VECCS)
     insurance-monthly-premium.csv (NAPHIA 2024 State of the Industry)
   Idempotent: skips files that already have source_url. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const REVIEWED = "2026-05";

function csvEscape(s) {
  s = String(s == null ? "" : s);
  if (/[,"\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"';
  return s;
}
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

function breedSource(slug, species) {
  if (slug === "mixed-breed") return "https://avmajournals.avma.org/view/journals/javma/242/11/javma.242.11.1549.xml";
  if (slug === "domestic-shorthair") return "https://www.aspca.org/about-us/aspca-policy-and-position-statements";
  if (species === "cat") return "https://cfa.org/breeds/";
  return "https://www.akc.org/dog-breeds/";
}

function updateCsv(filename, getSource) {
  var file = path.join(ROOT, "assets/data/csv", filename);
  var rows = parseCSV(fs.readFileSync(file, "utf8"));
  var header = rows[0];
  if (header.indexOf("source_url") >= 0) {
    console.log(filename + ": already has source columns — skipping");
    return;
  }
  var newHeader = header.concat(["source_url", "last_reviewed"]);
  var out = [newHeader];
  for (var i = 1; i < rows.length; i++) {
    var r = rows[i];
    if (!r[0] || r[0].trim() === "") continue;  // skip pre-existing blank rows
    out.push(r.concat([getSource(r), REVIEWED]));
  }
  var text = out.map(function (r) { return r.map(csvEscape).join(","); }).join("\n") + "\n";
  fs.writeFileSync(file, text, "utf8");
  console.log(filename + ": " + (out.length - 1) + " rows, added source_url + last_reviewed");
}

/* ---- breeds.csv ---- */
updateCsv("breeds.csv", function (r) { return breedSource(r[0], r[1]); });

/* ---- procedures.csv ---- */
var PROC_SOURCES = {
  "physical_exam":         "https://www.aaha.org/aaha-guidelines/2019-aaha-canine-life-stage-guidelines/",
  "wellness_blood_panel":  "https://www.aaha.org/aaha-guidelines/2019-aaha-canine-life-stage-guidelines/",
  "rabies_vaccine":        "https://www.cdc.gov/rabies/",
  "core_dog_vaccines":     "https://www.aaha.org/resources/2022-aaha-canine-vaccination-guidelines/",
  "core_cat_vaccines":     "https://www.aaha.org/resources/2020-aahaaafp-feline-vaccination-guidelines/",
  "spay_neuter":           "https://www.aaha.org/your-pet/pet-owner-education/ask-aaha/spay-neuter/",
  "dental_cleaning":       "https://avdc.org/",
  "cruciate_surgery":      "https://www.acvs.org/small-animal/cranial-cruciate-ligament-disease/",
  "gdv_surgery":           "https://www.acvs.org/small-animal/gastric-dilatation-volvulus/",
  "ivdd_surgery":          "https://www.acvim.org/",
  "fb_surgery":            "https://www.acvs.org/",
  "hbc_treatment":         "https://www.carecredit.com/well-u/pet-care/emergency-vet-visit-cost-and-veterinary-financing/",
  "xray":                  "https://www.acvr.org/",
  "ultrasound":            "https://www.acvr.org/",
  "mri":                   "https://www.acvr.org/",
  "ct_scan":               "https://www.acvr.org/",
  "er_exam":               "https://veccs.org/",
  "hospitalization":       "https://veccs.org/",
  "iv_fluids":             "https://veccs.org/",
  "euthanasia":            "https://www.avma.org/resources-tools/avma-policies/avma-guidelines-euthanasia-animals",
  "cremation":             "https://www.iaopc.com/"
};
updateCsv("procedures.csv", function (r) {
  return PROC_SOURCES[r[0]] || "https://www.carecredit.com/vetmed/costs/";
});

/* ---- insurance-monthly-premium.csv ---- */
updateCsv("insurance-monthly-premium.csv", function (_r) {
  return "https://naphia.org/industry-data/";
});
