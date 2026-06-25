#!/usr/bin/env node
/* Bump the cache-bust suffix on CSS + JS references site-wide.
   Old: ?v=20260510m  New: ?v=20260514a
   Also renames layout-20260510i.js → layout-20260514a.js (and same for
   calculator + csv-loader) so browsers fetch fresh files even when the
   query-string isn't honored.

   IMPORTANT: after renaming, this also copies each dated canonical file to
   its plain name (calculator-<date>.js -> calculator.js, etc.). The plain
   copies are what tests/calculator.test.js loads; without this sync they go
   stale and the suite silently validates a non-shipped engine (this bit us
   once — see the note at the top of tests/calculator.test.js).
*/
"use strict";
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const OLD_V = "20260625a";
const NEW_V = "20260625b";

const RENAMES = [
  ["assets/js/layout-20260625a.js", "assets/js/layout-20260625b.js"],
  ["assets/js/calculator-20260625a.js", "assets/js/calculator-20260625b.js"],
  ["assets/data/csv-loader-20260625a.js", "assets/data/csv-loader-20260625b.js"],
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

// 1b) Keep the plain copies in sync with the dated canonical files.
//     Tests load the plain names (calculator.js, csv-loader.js); pages load
//     the dated names. Copy dated -> plain so the two never drift.
for (const [, to] of RENAMES) {
  const dated = path.join(ROOT, to);
  const plain = path.join(ROOT, to.replace("-" + NEW_V, ""));
  if (fs.existsSync(dated)) {
    fs.copyFileSync(dated, plain);
    console.log("Synced:  " + to + " -> " + path.relative(ROOT, plain));
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
  ["layout-20260625a.js", "layout-20260625b.js"],
  ["calculator-20260625a.js", "calculator-20260625b.js"],
  ["csv-loader-20260625a.js", "csv-loader-20260625b.js"],
];

/* Force any hero.{jpg,svg,png,webp}?v=... to NEW_V — older breed pages
   may carry stale cache-bust strings from before this script existed,
   so a literal split-and-join won't catch them. This regex sweep does. */
const heroRe = /(hero\.(?:jpg|svg|png|webp))\?v=[a-z0-9]+/g;

for (const f of files) {
  let html = fs.readFileSync(f, "utf8");
  const orig = html;
  for (const [from, to] of replacements) html = html.split(from).join(to);
  html = html.replace(heroRe, '$1?v=' + NEW_V);
  if (html !== orig) {
    fs.writeFileSync(f, html, "utf8");
    changed++;
  }
}
console.log("Updated " + changed + " of " + files.length + " HTML files");
