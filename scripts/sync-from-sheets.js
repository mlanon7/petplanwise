#!/usr/bin/env node
/* ============================================================
   Sync /assets/data/csv/*.csv from Google Sheets (build-time).
   Run: node scripts/sync-from-sheets.js
   Env: PETCOST_SHEET_ID — override the default sheet ID.
   ============================================================ */
"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");

const SHEET_ID = process.env.PETCOST_SHEET_ID
  || "1phcplKG7wqlSR9Pnkj2v672oBiDGtcZSbBncSEUvsFQ";

const CSV_DIR = path.join(__dirname, "..", "assets", "data", "csv");

function listLocalCsv() {
  return fs.readdirSync(CSV_DIR).filter(f => f.endsWith(".csv")).map(f => f.replace(/\.csv$/, ""));
}

function fetchSheetCsv(tabName) {
  return new Promise((resolve, reject) => {
    const url = "https://docs.google.com/spreadsheets/d/" + SHEET_ID
      + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tabName);
    https.get(url, { headers: { "User-Agent": "petcost-sync/1.0" } }, res => {
      let chunks = [];
      // Handle redirects
      if (res.statusCode === 301 || res.statusCode === 302) {
        return https.get(res.headers.location, r2 => {
          let c2 = [];
          r2.on("data", d => c2.push(d));
          r2.on("end", () => {
            const text = Buffer.concat(c2).toString("utf8");
            if (/^<!DOCTYPE|^<html/i.test(text.slice(0, 32))) return reject(new Error("auth"));
            resolve(text);
          });
        }).on("error", reject);
      }
      res.on("data", d => chunks.push(d));
      res.on("end", () => {
        const text = Buffer.concat(chunks).toString("utf8");
        if (res.statusCode >= 400) return reject(new Error("HTTP " + res.statusCode));
        if (/^<!DOCTYPE|^<html/i.test(text.slice(0, 32))) return reject(new Error("auth"));
        resolve(text);
      });
    }).on("error", reject);
  });
}

(async () => {
  console.log("Syncing CSVs from Google Sheet " + SHEET_ID);
  const tabs = listLocalCsv();
  let ok = 0, missed = 0, unchanged = 0;
  for (const tab of tabs) {
    try {
      const text = await fetchSheetCsv(tab);
      const target = path.join(CSV_DIR, tab + ".csv");
      const existing = fs.existsSync(target) ? fs.readFileSync(target, "utf8") : "";
      if (existing.trim() === text.trim()) { unchanged++; console.log("  =  " + tab); continue; }
      fs.writeFileSync(target, text);
      ok++;
      console.log("  OK " + tab + " (" + text.length + " bytes)");
    } catch (e) {
      missed++;
      console.warn("  -- " + tab + " (skipped: " + e.message + ")");
    }
  }
  console.log("Done. Updated: " + ok + ", unchanged: " + unchanged + ", skipped: " + missed);
  if (missed > 0) {
    console.warn("Skipped tabs may not yet exist in the sheet. Local file is unchanged.");
  }
})();
