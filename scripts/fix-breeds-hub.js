#!/usr/bin/env node
/* One-shot repair for breeds/index.html after the May-16 batch splice
   triplicated card rows (CRLF mismatch in add-twelve-breeds.js splice).

   Approach: extract all <a class="card card-link breed-card"...> lines,
   dedupe by href, sort alphabetically by data-name within each species,
   re-emit the two breed-group sections in place.
*/
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const HUB = path.join(ROOT, "breeds", "index.html");

var html = fs.readFileSync(HUB, "utf8");

/* Pull every card line (regardless of where in the file). */
var cardRe = /<a class="card card-link breed-card" data-species="(dog|cat)" data-name="([^"]+)" data-blurb="[^"]*" href="([^"]+)"[^>]*>.*?<\/a>/g;
var seen = {};
var dogs = [], cats = [];
var m;
while ((m = cardRe.exec(html)) !== null) {
  var href = m[3];
  if (seen[href]) continue;
  seen[href] = 1;
  var card = m[0];
  if (m[1] === "dog") dogs.push({ name: m[2], card: card });
  else cats.push({ name: m[2], card: card });
}
dogs.sort(function (a, b) { return a.name.localeCompare(b.name); });
cats.sort(function (a, b) { return a.name.localeCompare(b.name); });

console.log("Unique dog cards: " + dogs.length);
console.log("Unique cat cards: " + cats.length);

/* Now we need to find the breed-group sections and replace them entirely.
   Original structure:
     <div class="breed-group" id="breed-group-dog">
       <div class="breed-group-heading">...</div>
       <div class="grid grid-3">
         <a ...>...</a>   (repeated)
       </div>
     </div>
     <div class="breed-group" id="breed-group-cat">
       ...same...
     </div>
*/

function rebuildGroup(html, species, cards, count) {
  /* Find the breed-group div. */
  var groupOpen = '<div class="breed-group" id="breed-group-' + species + '">';
  var groupStart = html.indexOf(groupOpen);
  if (groupStart < 0) throw new Error("Group not found: " + species);

  /* The closing </div></div> of the group section. We need to scan past the
     heading + grid + cards. The next <div class="breed-group" (for cats) or
     the next </main> (for cats) ends our region. */
  var nextGroup = html.indexOf('<div class="breed-group"', groupStart + groupOpen.length);
  var endHint = nextGroup > 0 ? nextGroup : html.indexOf('</main>', groupStart);
  /* Walk back to find the </div>\n  ...  </div>\n    that closes our group */
  var section = html.substring(groupStart, endHint);
  /* Count opening + closing divs to find our matching close */
  var nestDepth = 0;
  var idx = 0;
  var lastValidClose = -1;
  while (idx < section.length) {
    var openIdx = section.indexOf('<div', idx);
    var closeIdx = section.indexOf('</div>', idx);
    if (openIdx >= 0 && (closeIdx < 0 || openIdx < closeIdx)) {
      nestDepth++;
      idx = openIdx + 4;
    } else if (closeIdx >= 0) {
      nestDepth--;
      if (nestDepth === 0) { lastValidClose = closeIdx + 6; break; }
      idx = closeIdx + 6;
    } else break;
  }
  if (lastValidClose < 0) throw new Error("Could not find group close for " + species);
  var fullSectionEnd = groupStart + lastValidClose;

  /* Rebuild section */
  var newSection =
    '<div class="breed-group" id="breed-group-' + species + '">\n' +
    '      <div class="breed-group-heading">\n' +
    '        <h2>' + (species === "dog" ? "Dog" : "Cat") + ' breeds</h2>\n' +
    '        <span class="visible-count" id="visible-count-' + species + '">' + count + ' breeds</span>\n' +
    '      </div>\n' +
    '      <div class="grid grid-3">\n' +
    cards.map(function (c) { return '      ' + c.card; }).join("\n") + "\n" +
    '      </div>\n' +
    '    </div>';

  return html.substring(0, groupStart) + newSection + html.substring(fullSectionEnd);
}

html = rebuildGroup(html, "dog", dogs, dogs.length);
html = rebuildGroup(html, "cat", cats, cats.length);

fs.writeFileSync(HUB, html, "utf8");
console.log("Hub rebuilt. Total cards: " + (dogs.length + cats.length));
