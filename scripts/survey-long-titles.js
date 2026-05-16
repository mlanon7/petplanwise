#!/usr/bin/env node
"use strict";
const fs = require("fs");
const path = require("path");
function walk(d, out) {
  for (const e of fs.readdirSync(d, {withFileTypes:true})) {
    if (e.isDirectory()) {
      if ([".git","node_modules",".vercel",".claude"].includes(e.name)) continue;
      walk(path.join(d, e.name), out);
    } else if (e.isFile() && e.name.endsWith(".html")) out.push(path.join(d, e.name));
  }
  return out;
}
const files = walk(path.resolve(__dirname, ".."), []);
const off = [];
for (const f of files) {
  const html = fs.readFileSync(f, "utf8");
  const m = html.match(/<title>([^<]+)<\/title>/);
  if (m && m[1].length > 65) off.push({ rel: path.relative(path.resolve(__dirname, ".."), f).replace(/\\/g, "/"), len: m[1].length, title: m[1] });
}
off.sort((a,b)=>b.len-a.len);
console.log("Total > 65 chars: " + off.length);
const groups = { bs: [], b: [], g: [], s: [], o: [] };
off.forEach(function (x) {
  if (x.rel.indexOf("-cost-in-") >= 0) groups.bs.push(x);
  else if (x.rel.indexOf("breeds/") === 0) groups.b.push(x);
  else if (x.rel.indexOf("guides/") === 0) groups.g.push(x);
  else if (x.rel.indexOf("states/") === 0) groups.s.push(x);
  else groups.o.push(x);
});
console.log("Breed-state: " + groups.bs.length + (groups.bs[0] ? " ex: " + groups.bs[0].len + " " + groups.bs[0].title : ""));
console.log("Breed:       " + groups.b.length + (groups.b[0] ? " ex: " + groups.b[0].len + " " + groups.b[0].title : ""));
console.log("Guide:       " + groups.g.length + (groups.g[0] ? " ex: " + groups.g[0].len + " " + groups.g[0].title : ""));
console.log("State:       " + groups.s.length + (groups.s[0] ? " ex: " + groups.s[0].len + " " + groups.s[0].title : ""));
console.log("Other:       " + groups.o.length);
groups.o.slice(0, 6).forEach(function (x) { console.log("  " + x.len + " " + x.title + "  [" + x.rel + "]"); });
groups.g.slice(0, 5).forEach(function (x) { console.log("  GUIDE " + x.len + " " + x.title); });
