#!/usr/bin/env node
/* Audit fix: some guide pages have malformed external <a> tags where
   the organization name leaked into the href:

     <a href='https://www.vin.com/ (Veterinary Information Network)'>
       https://www.vin.com/ (Veterinary Information Network)
     </a>

   That href is invalid (spaces + parentheses). Anchor text should be
   the human-readable name, href should be the clean URL.

   This sweep fixes any <a href='URL (Name)'>URL (Name)</a> pattern
   to <a href='URL' target="_blank" rel="noopener">Name</a>. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === ".git" || e.name === "node_modules" || e.name === ".vercel" || e.name === ".claude") continue;
      walk(path.join(dir, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}

/* Match <a href='URL (Name)'>...inner...</a> */
const re = /<a href='(https?:\/\/[^ ']+) \(([^)]+)\)'>([\s\S]*?)<\/a>/g;

const files = walk(ROOT, []);
let totalFixes = 0, filesTouched = 0;
for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  let fixesInFile = 0;
  html = html.replace(re, function (_match, url, name) {
    fixesInFile++;
    return '<a href="' + url + '" target="_blank" rel="noopener">' + name + '</a>';
  });
  if (fixesInFile) {
    fs.writeFileSync(f, html, "utf8");
    filesTouched++;
    totalFixes += fixesInFile;
    console.log("Fixed " + fixesInFile + " link(s) in " + path.relative(ROOT, f));
  }
}
console.log("\nTotal: " + totalFixes + " links fixed across " + filesTouched + " files");
