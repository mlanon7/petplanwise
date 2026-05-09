#!/usr/bin/env node
/* =============================================================
   Replace the placeholder domain across the entire site.
   Usage:  node scripts/replace-domain.js https://yourdomain.com
   ============================================================= */
"use strict";
const fs = require("fs");
const path = require("path");

const PLACEHOLDER = "https://petcost-bill.example.com";
const PLACEHOLDER_BARE = "petcost-bill.example.com";

const target = (process.argv[2] || "").trim();
if (!target) {
  console.error("Usage: node scripts/replace-domain.js https://yourdomain.com");
  process.exit(1);
}
const cleanTarget = target.replace(/\/+$/, "");
const cleanTargetBare = cleanTarget.replace(/^https?:\/\//, "");

console.log("Replacing  " + PLACEHOLDER + "  →  " + cleanTarget);

const ROOT = path.resolve(__dirname, "..");
const SKIP_DIRS = new Set([".git","node_modules",".vercel",".next",".cache","scripts"]);
const ALLOW_EXT = new Set([".html",".xml",".txt",".json",".js",".md",".css"]);

let filesTouched = 0;
let occurrences = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".gitignore") continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    const ext = path.extname(entry.name).toLowerCase();
    if (!ALLOW_EXT.has(ext)) continue;
    const original = fs.readFileSync(full, "utf8");
    if (original.indexOf(PLACEHOLDER_BARE) === -1) continue;
    let updated = original.split(PLACEHOLDER).join(cleanTarget);
    updated = updated.split(PLACEHOLDER_BARE).join(cleanTargetBare);
    if (updated !== original) {
      const matches = (original.match(new RegExp(PLACEHOLDER_BARE.replace(/\./g,"\\."), "g")) || []).length;
      occurrences += matches;
      fs.writeFileSync(full, updated, "utf8");
      filesTouched++;
      console.log("  " + path.relative(ROOT, full) + "  (" + matches + " matches)");
    }
  }
}

walk(ROOT);

console.log("");
console.log("Updated " + filesTouched + " files, " + occurrences + " total occurrences.");
console.log("Don't forget:");
console.log("  - Update robots.txt sitemap line if you customized it");
console.log("  - Submit https://" + cleanTargetBare + "/sitemap.xml to Google Search Console");
console.log("  - Add the domain in Vercel project settings");
