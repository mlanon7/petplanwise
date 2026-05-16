#!/usr/bin/env node
/* Audit P1 #29: add a visible source-note block right under every
   breed cost table so users see where the numbers come from without
   having to click through to /sources/. Idempotent. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

function listBreedPages() {
  const dirs = fs.readdirSync(path.join(ROOT, "breeds")).filter(function (n) {
    if (n.indexOf("-cost-in-") >= 0) return false;
    if (!n.endsWith("-cost")) return false;
    return fs.statSync(path.join(ROOT, "breeds", n)).isDirectory();
  });
  return dirs.map(function (d) { return path.join(ROOT, "breeds", d, "index.html"); }).filter(fs.existsSync);
}

const SOURCE_BLOCK =
  '\n    <p class="cost-table-sources" style="margin: 6px 0 18px; padding: 10px 14px; background: rgba(15,118,110,0.04); border-left: 3px solid rgba(15,118,110,0.35); border-radius: 0 8px 8px 0; font-size: 13px; color: var(--ink-2, #4B5563); line-height: 1.5;">' +
  '<strong>Where these numbers come from:</strong> ' +
  'Purchase ranges from AKC / CFA breeder directories and adoption-fee averages. ' +
  'Annual food + grooming from AAHA pet care cost guidance scaled by breed size. ' +
  'Vet care + prevention from Banfield <em>State of Pet Health</em> + AAHA preventive care guidelines. ' +
  'Insurance from <a href="https://naphia.org/industry-data/" target="_blank" rel="noopener">NAPHIA 2024 State of the Industry</a>. ' +
  'Full bibliography: <a href="/sources/">/sources/</a>. ' +
  '<span class="muted">Last reviewed: May 2026.</span>' +
  '</p>';

const pages = listBreedPages();
let added = 0, skipped = 0;
for (const f of pages) {
  let html = fs.readFileSync(f, "utf8");
  if (html.indexOf("cost-table-sources") >= 0) { skipped++; continue; }
  /* Insert directly after the </table> that closes the cost-table */
  const re = /(<table class="cost-table">[\s\S]*?<\/table>)/;
  if (!re.test(html)) { skipped++; continue; }
  html = html.replace(re, "$1" + SOURCE_BLOCK);
  fs.writeFileSync(f, html, "utf8");
  added++;
}
console.log("Source-note block added to " + added + " breed pages (skipped: " + skipped + ")");
