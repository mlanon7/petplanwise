#!/usr/bin/env node
/* fix-breed-intro-grammar.js (one-shot, idempotent)
   The generated breed intro reads "The X is a active curious playful cat." —
   wrong article ("a" before a vowel) and no commas between the adjectives.
   Fix to "The X is an active, curious, playful cat." Only the intro sentence
   (The … is <adj> <adj> <adj> cat|dog.) is touched; comma'd sentences no
   longer match, so re-runs are no-ops. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const dir = path.join(ROOT, "breeds");

let fixed = 0;
for (const name of fs.readdirSync(dir)) {
  if (name.indexOf("-cost-in-") !== -1) continue;
  const f = path.join(dir, name, "index.html");
  if (!fs.existsSync(f)) continue;
  const before = fs.readFileSync(f, "utf8");
  const html = before.replace(
    /(The [A-Za-z .'\-]+? is )an? ([a-z][a-z\-]+) ([a-z][a-z\-]+) ([a-z][a-z\-]+) (cat|dog)\./,
    (m, pre, w1, w2, w3, noun) => {
      const vowel = /^[aeiou]/.test(w1) && !/^(uni|use|euro|one)/.test(w1);
      return pre + (vowel ? "an" : "a") + " " + w1 + ", " + w2 + ", " + w3 + " " + noun + ".";
    }
  );
  if (html !== before) { fs.writeFileSync(f, html, "utf8"); fixed++; }
}
console.log("breed intros fixed: " + fixed);
