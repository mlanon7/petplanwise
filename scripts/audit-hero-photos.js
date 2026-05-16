#!/usr/bin/env node
/* Audit each breed's hero credit.json: flag descriptions that hint at
   far-away, side-profile, or non-frontal compositions. Output a
   punch list of breeds whose hero should be re-sourced. */
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");

/* Phrases that suggest the photo is NOT a close-up frontal portrait. */
const RED_FLAGS = [
  "running", "field", "walking", "playing", "in motion", "from behind",
  "side view", "side profile", "profile", "lying", "sleeping", "with a toy",
  "from above", "high angle", "low angle", "back of", "rear view",
  "looking away", "off camera", "in the distance", "far", "long shot",
  "in nature", "outdoors in a", "on a leash", "with owner", "with person",
  "with another", "kissing", "sniffing", "training", "show ring", "jumping",
  "swimming", "snow", "beach run", "trail"
];
/* Phrases that suggest the photo IS a close-up frontal portrait. */
const GREEN_FLAGS = [
  "close-up", "close up", "closeup", "portrait", "head shot", "headshot",
  "facing camera", "looking at camera", "eyes", "face", "studio"
];

function scan(text) {
  text = (text || "").toLowerCase();
  var reds = RED_FLAGS.filter(function (r) { return text.indexOf(r) >= 0; });
  var greens = GREEN_FLAGS.filter(function (g) { return text.indexOf(g) >= 0; });
  return { reds: reds, greens: greens };
}

var breedDirs = fs.readdirSync(path.join(ROOT, "breeds"))
  .filter(function (n) { return n.indexOf("-cost-in-") < 0 && n.endsWith("-cost"); })
  .sort();

var problematic = [], good = [], missing = [];
breedDirs.forEach(function (d) {
  var creditPath = path.join(ROOT, "breeds", d, "credit.json");
  var heroJpg = path.join(ROOT, "breeds", d, "hero.jpg");
  if (!fs.existsSync(creditPath) || !fs.existsSync(heroJpg)) {
    missing.push(d);
    return;
  }
  var credit = JSON.parse(fs.readFileSync(creditPath, "utf8"));
  /* Try multiple description fields */
  var desc = credit.description || credit.alt || credit.caption || "";
  var sourceUrl = credit.source_url || credit.url || "";
  /* If url has slug-like part, parse it for hints */
  var fromUrl = sourceUrl.split("/").pop().replace(/-/g, " ").replace(/\d+/g, "");
  var combined = desc + " " + fromUrl;
  var flags = scan(combined);

  if (flags.reds.length > flags.greens.length) {
    problematic.push({
      slug: d.replace(/-cost$/, "").replace(/-cat$/, ""),
      dir: d,
      desc: desc,
      sourceUrl: sourceUrl,
      reds: flags.reds,
      greens: flags.greens
    });
  } else {
    good.push(d);
  }
});

console.log("=== AUDIT RESULTS ===");
console.log("Total breeds checked: " + breedDirs.length);
console.log("Missing credit.json or hero.jpg: " + missing.length);
console.log("Likely OK (close-up/portrait): " + good.length);
console.log("Flagged for review: " + problematic.length);

if (missing.length) {
  console.log("\n--- Missing credit/hero ---");
  missing.forEach(function (m) { console.log("  " + m); });
}

if (problematic.length) {
  console.log("\n--- Flagged photos (description suggests far-away/non-frontal) ---");
  problematic.forEach(function (p) {
    console.log("\n" + p.dir);
    console.log("  reds: " + p.reds.join(", "));
    if (p.greens.length) console.log("  greens: " + p.greens.join(", "));
    console.log("  desc: " + (p.desc || "(none)"));
    if (p.sourceUrl) console.log("  url:  " + p.sourceUrl);
  });
}

/* Write JSON output for downstream re-sourcing */
fs.writeFileSync(path.join(ROOT, "scripts", "audit-hero-photos-output.json"),
  JSON.stringify({ problematic: problematic, missing: missing, good: good }, null, 2));
console.log("\nFull output: scripts/audit-hero-photos-output.json");
