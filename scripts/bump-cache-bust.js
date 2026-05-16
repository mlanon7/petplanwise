#!/usr/bin/env node
/* Bump the cache-bust suffix on CSS + JS references site-wide.
   Old: ?v=20260510m  New: ?v=20260514a
   Also renames layout-20260510i.js → layout-20260514a.js (and same for
   calculator + csv-loader) so browsers fetch fresh files even when the
   query-string isn't honored.
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OLD_V = "20260515j";
const NEW_V = "20260515k";

const RENAMES = [
  ["assets/js/layout-20260515j.js", "assets/js/layout-20260515k.js"],
  ["assets/js/calculator-20260515j.js", "assets/js/calculator-20260515k.js"],
  ["assets/data/csv-loader-20260515j.js", "assets/data/csv-loader-20260515k.js"],
];

// 1) Rename files on disk.
for (const [from, to] of RENAMES) {
  const src = path.join(ROOT, from);
  const dst = path.join(ROOT, to);
  if (fs.existsSync(src) && !fs.existsSync(dst)) {
    fs.renameSync(src, dst);
    console.log("Renamed: " + from + " -> " + to);
  }
}

// 2) Sweep HTML files and update references.
function walk(dir, out) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.isDirectory()) {
      if (e.name === ".git" || e.name === "node_modules" || e.name === ".vercel") continue;
      walk(path.join(dir, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}

const files = walk(ROOT, []);
let changed = 0;
const replacements = [
  ["v=" + OLD_V, "v=" + NEW_V],
  ["layout-20260515j.js", "layout-20260515k.js"],
  ["calculator-20260515j.js", "calculator-20260515k.js"],
  ["csv-loader-20260515j.js", "csv-loader-20260515k.js"],
];

for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  const orig = html;
  for (const [from, to] of replacements) html = html.split(from).join(to);
  if (html !== orig) {
    fs.writeFileSync(f, html, "utf8");
    changed++;
  }
}
console.log("Updated " + changed + " of " + files.length + " HTML files");
