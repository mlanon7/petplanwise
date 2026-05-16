#!/usr/bin/env node
/* Audit P1 #28: add a visible "Last reviewed" stamp to the 150 breed-state
   pages that lack one. Inserts a small paragraph between the <h1> and
   the lede paragraph. Idempotent. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const STAMP =
  '\n    <p class="last-updated-stamp last-updated-static" style="font-size:13px;color:var(--muted,#6B7280);margin:6px 0 14px;">' +
  'Last reviewed: <strong>May 2026</strong> · <a href="/about/">Methodology</a> · <a href="/sources/">Sources</a>' +
  '</p>';

const dirs = fs.readdirSync(path.join(ROOT, "breeds")).filter(function (n) {
  return n.indexOf("-cost-in-") >= 0 && fs.statSync(path.join(ROOT, "breeds", n)).isDirectory();
});

let added = 0, skipped = 0;
for (const d of dirs) {
  const file = path.join(ROOT, "breeds", d, "index.html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  if (html.indexOf('class="last-updated-stamp') >= 0) { skipped++; continue; }

  /* Insert after the first <h1>...</h1> tag */
  const re = /(<h1>[^<]*<\/h1>)/;
  if (!re.test(html)) { skipped++; continue; }
  html = html.replace(re, "$1" + STAMP);
  fs.writeFileSync(file, html, "utf8");
  added++;
}
console.log("Added review stamp to " + added + " breed-state pages (skipped " + skipped + ")");
