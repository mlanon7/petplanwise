#!/usr/bin/env node
/* De-dog the 6 new cat breed pages:
   - Replace "Puppy vaccine series + initial vet" → "Kitten vaccine series + initial vet"
   - Replace "Starter kit (crate, bed, leash, bowls)" → "Starter kit (carrier, litter box, scratcher, bowls)"
   - Replace "Year-1 prevention (heartworm, flea/tick)" → "Year-1 prevention (flea/tick, intestinal worms)"
   - Replace "Spay/neuter" → keep as-is (term is correct for cats)
   - Fix Year-1 grooming row math: low=$0 typical=$60 high=$150 (was $75/$60/$120, low > typical)
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

const CAT_BREEDS = [
  "abyssinian", "american-shorthair", "munchkin",
  "norwegian-forest-cat", "russian-blue", "savannah-cat",
];

let touched = 0;
for (const slug of CAT_BREEDS) {
  const file = path.join(ROOT, "breeds", slug + "-cost", "index.html");
  if (!fs.existsSync(file)) continue;
  let html = fs.readFileSync(file, "utf8");
  const orig = html;

  // Row labels
  html = html.replace(
    /<td>Puppy vaccine series \+ initial vet<\/td>/g,
    "<td>Kitten vaccine series + initial vet</td>"
  );
  html = html.replace(
    /<td>Starter kit \(crate, bed, leash, bowls\)<\/td>/g,
    "<td>Starter kit (carrier, litter box, scratcher, bowls)</td>"
  );
  html = html.replace(
    /<td>Year-1 prevention \(heartworm, flea\/tick\)<\/td>/g,
    "<td>Year-1 prevention (flea/tick, intestinal worms)</td>"
  );

  // Grooming row math fix: tolerate the existing $75/$60/$120 OR variants.
  // Replace the whole <tr> for grooming with corrected values: $0 / $60 / $300
  // ($0 because most owners groom at home; high $300 reflects long-haired cats).
  html = html.replace(
    /<tr>\s*<td>Year-1 grooming<\/td>[\s\S]*?<\/tr>/,
    function () {
      // Long-haired cats need pro grooming; range up to $480/yr
      const longHaired = ["norwegian-forest-cat"];
      const isLongHaired = longHaired.indexOf(slug) >= 0;
      const hi = isLongHaired ? "$480" : "$300";
      return '<tr><td>Year-1 grooming</td><td class="num">$0</td><td class="num">$60</td><td class="num">' + hi + '</td></tr>';
    }
  );

  if (html !== orig) {
    fs.writeFileSync(file, html, "utf8");
    touched++;
    console.log("Fixed: " + slug);
  }
}
console.log("\nDe-dogged " + touched + " of " + CAT_BREEDS.length + " cat pages");
