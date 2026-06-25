#!/usr/bin/env node
/* gen-breed-cards.js
   Generates a shareable "breed cost card" (1200x630 OG image) for each of the
   71 standalone breed pages: hero photo on the left, cream content panel on the
   right with the breed name, the per-year + lifetime cost ranges (parsed from
   the page lede), size/lifespan, and the brand. Output: breeds/<dir>/card.png.
   Wired as og:image/twitter:image by add-breed-card-og.js.

   Reuses the proven sharp + SVG + Arial pattern from gen-pinterest-pins.js so
   text renders reliably on this machine. */
"use strict";
const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const W = 1200, H = 630, PW = 560;           // card + photo-panel width
const CREAM = "#F7F1E1", INK = "#1F2937", TEAL = "#0F766E", TEAL7 = "#115E59",
      MUTED = "#6B7280", BORDER = "#E0D6BE";
const X = 604;                               // content left edge

/* ---- breeds.csv: slug -> {name,size,avgLife,species} (cols 1-10, no commas) ---- */
const csv = fs.readFileSync(path.join(ROOT, "assets/data/csv/breeds.csv"), "utf8").trim().split(/\r?\n/);
const BREEDS = {};
for (let i = 1; i < csv.length; i++) {
  const c = csv[i].split(",");
  BREEDS[c[0]] = { species: c[1], name: c[2], size: c[3], avgLife: c[9] };
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* parse the per-year + lifetime ranges from a breed page lede.
   Ledes use several phrasings ("$X/year", "$X per year", "Annual: $X",
   "$X–$Y over a N-year ...") so each value has a couple of fallbacks. */
function parseCosts(html) {
  const m = html.match(/<p class="lede[^>]*>([\s\S]*?)<\/p>/);
  if (!m) return null;
  const lede = m[1];
  let annual = null, life = null;
  let a = lede.match(/<strong>([^<]*?(?:\/year|per year)[^<]*?)<\/strong>/i)
       || lede.match(/(?:Annual cost:|Annual:)\s*<strong>([^<]+?)<\/strong>/i);
  if (a) annual = a[1].replace(/\s*(?:\/year|per year)\s*/i, "").trim();
  let l = lede.match(/Lifetime[^<]*?<strong>([^<]+?)<\/strong>/i)
       || lede.match(/<strong>(\$[^<]+?)<\/strong>\s*(?:over|across)\b/i);
  if (l) life = l[1].trim();
  return { annual, life };
}

/* balance a breed name onto <=2 lines */
function wrapName(name) {
  if (name.length <= 17) return [name];
  const w = name.split(" ");
  let best = null, bestDiff = 1e9;
  for (let i = 1; i < w.length; i++) {
    const a = w.slice(0, i).join(" "), b = w.slice(i).join(" ");
    const diff = Math.abs(a.length - b.length);
    if (Math.max(a.length, b.length) <= 22 && diff < bestDiff) { best = [a, b]; bestDiff = diff; }
  }
  return best || [name];
}

function cardSvg(d) {
  const nameLines = wrapName(d.name);
  const nameSize = nameLines.length > 1 ? 50 : (d.name.length > 12 ? 56 : 62);
  let ny = nameLines.length > 1 ? 196 : 214;
  const nameTspans = nameLines.map((ln) => {
    const t = `<text x="${X}" y="${ny}" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="${nameSize}" letter-spacing="-1.2" fill="${INK}">${esc(ln)}</text>`;
    ny += nameSize + 6;
    return t;
  }).join("");
  const speciesWord = d.species === "cat" ? "CAT" : "DOG";
  const lifespan = d.avgLife ? "~" + d.avgLife + "-year lifespan" : "";
  const meta = [d.size ? cap(d.size) + " " + (d.species === "cat" ? "cat" : "dog") : "", lifespan].filter(Boolean).join("  ·  ");
  return Buffer.from(
`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="${PW}" y="0" width="${W - PW}" height="${H}" fill="${CREAM}"/>
  <rect x="${PW}" y="0" width="8" height="${H}" fill="${TEAL}"/>
  <!-- brand -->
  <rect x="${X}" y="56" width="40" height="40" rx="11" fill="${TEAL}"/>
  <text x="${X + 20}" y="85" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="26" fill="#ffffff" text-anchor="middle">$</text>
  <text x="${X + 54}" y="84" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="25" fill="${INK}">PetPlanWise</text>
  <!-- eyebrow -->
  <text x="${X}" y="150" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="20" letter-spacing="2" fill="${TEAL7}">COST TO OWN A ${speciesWord}</text>
  ${nameTspans}
  <rect x="${X}" y="${nameLines.length > 1 ? 300 : 250}" width="64" height="5" rx="2.5" fill="${TEAL}"/>
  <!-- cost rows -->
  <text x="${X}" y="372" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="19" letter-spacing="1.5" fill="${MUTED}">PER YEAR</text>
  <text x="${X}" y="418" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="44" fill="${TEAL7}">${esc(d.annual || "—")}</text>
  <text x="${X}" y="476" font-family="Arial, Helvetica, sans-serif" font-weight="700" font-size="19" letter-spacing="1.5" fill="${MUTED}">LIFETIME</text>
  <text x="${X}" y="522" font-family="Arial, Helvetica, sans-serif" font-weight="800" font-size="44" fill="${TEAL7}">${esc(d.life || "—")}</text>
  <!-- meta + footer -->
  <text x="${X}" y="566" font-family="Arial, Helvetica, sans-serif" font-weight="500" font-size="21" fill="${MUTED}">${esc(meta)}</text>
  <text x="${X}" y="600" font-family="Arial, Helvetica, sans-serif" font-weight="600" font-size="18" fill="${TEAL7}">Source-cited planning ranges · petplanwise.com</text>
</svg>`);
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : s; }

(async () => {
  const dirs = fs.readdirSync(path.join(ROOT, "breeds"))
    .filter((n) => /-cost$/.test(n) && n.indexOf("-cost-in-") === -1)
    .filter((n) => fs.existsSync(path.join(ROOT, "breeds", n, "hero.jpg")));

  let ok = 0, skip = [];
  for (const dir of dirs) {
    /* dir -> slug: most are "<slug>-cost"; the 8 legacy cats are
       "<slug>-cat-cost" where slug has no "-cat". Try the plain strip first,
       then fall back to stripping a trailing "-cat" if that slug isn't in CSV. */
    let slug = dir.replace(/-cost$/, "");
    if (!BREEDS[slug] && /-cat$/.test(slug)) slug = slug.replace(/-cat$/, "");
    const b = BREEDS[slug];
    const html = fs.readFileSync(path.join(ROOT, "breeds", dir, "index.html"), "utf8");
    const costs = parseCosts(html);
    if (!b || !costs || !costs.annual || !costs.life) { skip.push(dir + (b ? " (lede)" : " (csv)")); continue; }
    const data = Object.assign({}, b, costs);
    const photo = await sharp(path.join(ROOT, "breeds", dir, "hero.jpg"))
      .resize(PW, H, { fit: "cover", position: "attention" }).toBuffer();
    const base = await sharp({ create: { width: W, height: H, channels: 3, background: CREAM } })
      .composite([{ input: photo, left: 0, top: 0 }, { input: cardSvg(data), left: 0, top: 0 }])
      .png({ quality: 90 }).toBuffer();
    fs.writeFileSync(path.join(ROOT, "breeds", dir, "card.png"), base);
    ok++;
  }
  console.log("breed cards written: " + ok);
  if (skip.length) console.log("skipped (" + skip.length + "): " + skip.join(", "));
})().catch((e) => { console.error(e); process.exit(1); });
