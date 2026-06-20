#!/usr/bin/env node
/**
 * add-simulator-callout-to-breeds.js  (one-shot, idempotent)
 * Adds a contextual "see the full cost range" callout linking to the Pet Cost
 * Simulator on each standalone breed page (skips the noindexed -cost-in- pages).
 * Inserts before the Sources section; inline-styled, no CSS dependency.
 */
const fs = require('fs');
const path = require('path');
const BREEDS = path.join(__dirname, '..', 'breeds');

function breedName(html) {
  var m = html.match(/<h1>([\s\S]*?)<\/h1>/i);
  if (!m) return 'this breed';
  return m[1].replace(/<[^>]+>/g, '').replace(/\s*cost calculator.*$/i, '').replace(/\s*cost.*$/i, '').trim() || 'this breed';
}

function block(name) {
  return [
    '<!-- sim-callout -->',
    '    <section><div class="container">',
    '      <div style="background:#FBF7EC;border:1px solid #E8DFC7;border-radius:14px;padding:16px 18px;">',
    '        <strong style="font-size:15px;color:#1F2937;">One number hides the risk.</strong>',
    '        <p style="margin:6px 0 10px;font-size:14px;color:#374151;line-height:1.55;">A single average can’t show the rare, expensive years. The Pet Cost Simulator runs 10,000 lifetimes of a ' + name + ' to reveal the full range — the typical cost, the unlucky year, and the catastrophic tail.</p>',
    '        <a href="/pet-cost-simulator/" style="display:inline-block;font-weight:600;color:#0F766E;text-decoration:none;">See the full cost range →</a>',
    '      </div>',
    '    </div></section>',
    '<!-- /sim-callout -->'
  ].join('\n');
}

var dirs = fs.readdirSync(BREEDS).filter(function (d) {
  return !/-cost-in-/.test(d) && fs.existsSync(path.join(BREEDS, d, 'index.html'));
});
var done = 0, skip = 0;
dirs.forEach(function (d) {
  var file = path.join(BREEDS, d, 'index.html');
  var html = fs.readFileSync(file, 'utf8');
  html = html.replace(/\n?\s*<!-- sim-callout -->[\s\S]*?<!-- \/sim-callout -->/g, ''); // idempotent
  var b = block(breedName(html));
  var anchor = '<section><div class="container sources">';
  var idx = html.indexOf(anchor);
  if (idx === -1) idx = html.indexOf('</main>');
  if (idx === -1) { skip++; return; }
  html = html.slice(0, idx) + b + '\n' + html.slice(idx);
  fs.writeFileSync(file, html);
  done++;
});
console.log('Simulator callout added to ' + done + ' standalone breed pages (' + skip + ' skipped).');
