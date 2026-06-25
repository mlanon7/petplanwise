#!/usr/bin/env node
/* add-theme-init.js (one-shot, idempotent)
   Inserts a tiny synchronous <head> script that resolves the effective theme
   (stored choice, else system preference) and sets <html data-theme> BEFORE
   first paint — so dark mode never flashes light. Runs once per page; the
   data-theme-init marker keeps re-runs from double-inserting. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const SKIP = new Set([".git", "node_modules", ".vercel", ".claude"]);

const SNIPPET =
  '<script data-theme-init>(function(){try{var m=localStorage.getItem("ppw-theme");' +
  'var d=m?m==="dark":(window.matchMedia&&window.matchMedia("(prefers-color-scheme:dark)").matches);' +
  'document.documentElement.setAttribute("data-theme",d?"dark":"light");}catch(e){}})();</script>';

function walk(dir, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.isDirectory()) { if (SKIP.has(e.name)) continue; walk(path.join(dir, e.name), out); }
    else if (e.name.endsWith(".html")) out.push(path.join(dir, e.name));
  }
  return out;
}

let added = 0, skipped = 0, nohead = 0;
for (const f of walk(ROOT, [])) {
  let html = fs.readFileSync(f, "utf8");
  if (html.indexOf("data-theme-init") !== -1) { skipped++; continue; }
  const idx = html.indexOf("<head>");
  if (idx === -1) { nohead++; continue; }
  const at = idx + "<head>".length;
  html = html.slice(0, at) + "\n" + SNIPPET + html.slice(at);
  fs.writeFileSync(f, html, "utf8");
  added++;
}
console.log("theme-init added: " + added + ", already had it: " + skipped + ", no <head>: " + nohead);
