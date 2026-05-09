/* =============================================================
   Calculator scenario tests — pure Node, no framework.
   Run with: node tests/calculator.test.js
   ============================================================= */
"use strict";

/* Node 24+ marks some globals as non-writable. Use defineProperty with configurable. */
function defineGlobal(name, value) {
  Object.defineProperty(global, name, { value: value, writable: true, configurable: true });
}
defineGlobal("localStorage", { _s: {}, getItem(k){return this._s[k]||null;}, setItem(k,v){this._s[k]=String(v);}, removeItem(k){delete this._s[k];} });
defineGlobal("document", {
  addEventListener: () => {}, querySelectorAll: () => [], querySelector: () => null,
  head: { querySelector: () => null, appendChild: () => {} },
  createElement: () => ({ setAttribute: () => {}, appendChild: () => {} }),
  body: { insertBefore: () => {}, firstChild: null, appendChild: () => {} }
});
defineGlobal("window", {
  location: { origin: "x", pathname: "/", search: "", hash: "" },
  history: {}, addEventListener: () => {}
});
defineGlobal("navigator", {});
defineGlobal("URLSearchParams", class { constructor(){} get(){return null;} set(){} toString(){return "";}});
/* Minimal fetch stub for sync data load — tests load CSVs from disk via fs. */
defineGlobal("fetch", function (url) {
  const fs = require("fs");
  const path = require("path");
  const ROOT = path.join(__dirname, "..");
  const rel = String(url).replace(/^\//, "");
  const full = path.join(ROOT, rel);
  return Promise.resolve({
    ok: fs.existsSync(full),
    text: () => Promise.resolve(fs.existsSync(full) ? fs.readFileSync(full, "utf8") : "")
  });
});

const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const FILES = [
  "assets/data/csv-loader.js",
  "assets/data/base-costs.js",
  "assets/data/multipliers.js",
  "assets/data/breeds.js",
  "assets/data/procedures.js",
  "assets/data/insurance.js",
  "assets/data/cities.js",
  "assets/js/calculator.js"
];
for (const f of FILES) eval(fs.readFileSync(path.join(ROOT, f), "utf8"));

/* Wait for async CSV bootstrap to finish, then run synchronous assertions. */
(async function main() {
  if (window.PETCOST_DATA && typeof window.PETCOST_DATA.ready === "function") {
    await window.PETCOST_DATA.ready();
  }
  const E = window.PetCostEngine;
  let pass = 0, fail = 0;

  function assert(name, cond, detail) {
    if (cond) { pass++; console.log("  PASS  " + name); }
    else { fail++; console.log("  FAIL  " + name + (detail ? " — " + detail : "")); }
  }
  function inRange(name, val, lo, hi) {
    const ok = val >= lo && val <= hi;
    assert(name + " (" + Math.round(val) + " in [" + lo + ", " + hi + "])", ok);
  }

  console.log("\n--- Engine surface ---");
  assert("computePet exists", typeof E.computePet === "function");
  assert("PETCOST_DATA loaded", !!window.PETCOST_DATA);
  assert("breeds loaded", Object.keys(window.PETCOST_DATA.breeds || {}).length >= 12);
  assert("cities loaded", Object.keys(window.PETCOST_DATA.cityMultipliers || {}).length >= 18);
  assert("emergency scenarios loaded", Object.keys(window.PETCOST_DATA.emergencyScenarios || {}).length >= 10);
  assert("insurance compat shape", !!(window.PETCOST_DATA.insurance && window.PETCOST_DATA.insurance.monthlyPremium));

  console.log("\n--- Lifestyle multiplier (basic < standard < premium) ---");
  const lBase  = E.computePet("dog", { size: "medium", stage: "adult", state: "TX", lifestyle: "basic",    insurance: "no" });
  const lStand = E.computePet("dog", { size: "medium", stage: "adult", state: "TX", lifestyle: "standard", insurance: "no" });
  const lPrem  = E.computePet("dog", { size: "medium", stage: "adult", state: "TX", lifestyle: "premium",  insurance: "no" });
  console.log("  Basic    annual=$" + Math.round(lBase.annual.typical));
  console.log("  Standard annual=$" + Math.round(lStand.annual.typical));
  console.log("  Premium  annual=$" + Math.round(lPrem.annual.typical));
  assert("basic < standard", lBase.annual.typical < lStand.annual.typical);
  assert("standard < premium", lStand.annual.typical < lPrem.annual.typical);
  assert("premium > 1.4x basic", lPrem.annual.typical > lBase.annual.typical * 1.4);

  console.log("\n--- Dog scenarios ---");
  const r1 = E.computePet("dog", { size: "medium", stage: "adult", state: "TX", lifestyle: "standard", insurance: "no" });
  inRange("Medium adult TX standard monthly", r1.monthly.typical, 100, 300);
  inRange("Medium adult TX standard annual",  r1.annual.typical,  1200, 4000);

  const r2 = E.computePet("dog", { size: "giant", stage: "senior", state: "NY", lifestyle: "premium", insurance: "yes" });
  assert("Giant senior NY premium > medium adult standard", r2.monthly.typical > r1.monthly.typical * 2);

  console.log("\n--- Cat scenarios ---");
  const r4 = E.computePet("cat", { stage: "adult", state: "CA", lifestyle: "standard", insurance: "no", indoor: "indoor" });
  inRange("Cat adult CA indoor monthly", r4.monthly.typical, 60, 200);

  console.log("\n--- Age multiplier (puppy/senior routine_vet > adult) ---");
  const aPup = E.computePet("dog", { size: "medium", stage: "puppy",  state: "TX", lifestyle: "standard", insurance: "no" });
  const aAdt = E.computePet("dog", { size: "medium", stage: "adult",  state: "TX", lifestyle: "standard", insurance: "no" });
  const aSen = E.computePet("dog", { size: "medium", stage: "senior", state: "TX", lifestyle: "standard", insurance: "no" });
  const vPup = aPup.breakdown.find(b => b.key === "routine_vet").cost.typical;
  const vAdt = aAdt.breakdown.find(b => b.key === "routine_vet").cost.typical;
  const vSen = aSen.breakdown.find(b => b.key === "routine_vet").cost.typical;
  assert("puppy routine_vet > adult", vPup > vAdt * 1.3);
  assert("senior routine_vet > adult", vSen > vAdt * 1.3);

  console.log("\n--- Breed multiplier verification ---");
  const bGen   = E.computePet("dog", { size: "small", stage: "adult", state: "TX", lifestyle: "standard", insurance: "no" });
  const bFr    = E.computePet("dog", { breed: "french-bulldog", stage: "adult", state: "TX", lifestyle: "standard", insurance: "no" });
  const bBull  = E.computePet("dog", { breed: "bulldog", stage: "adult", state: "TX", lifestyle: "standard", insurance: "no" });
  assert("Frenchie healthRisk > generic small", bFr.annual.typical > bGen.annual.typical * 1.10);
  assert("Bulldog (1.70) > Frenchie (1.55)", bBull.annual.typical > bFr.annual.typical);

  console.log("\n--- City multiplier verification ---");
  const cTx  = E.computePet("dog", { size: "medium", stage: "adult", state: "TX", lifestyle: "standard", insurance: "no" });
  const cMan = E.computePet("dog", { size: "medium", stage: "adult", city: "manhattan-ny", lifestyle: "standard", insurance: "no" });
  assert("Manhattan > TX", cMan.annual.typical > cTx.annual.typical * 1.15);

  console.log("\n--- Insurance toggle ---");
  const iNo  = E.computePet("dog", { size: "medium", stage: "adult", state: "TX", lifestyle: "standard", insurance: "no"  });
  const iYes = E.computePet("dog", { size: "medium", stage: "adult", state: "TX", lifestyle: "standard", insurance: "yes" });
  assert("Insurance:yes > insurance:no", iYes.annual.typical > iNo.annual.typical);

  console.log("\n--- Lifetime sanity ---");
  inRange("Medium adult lifetime", r1.lifetime.typical, 10000, 60000);
  assert("Lifetime > annual × 5", r1.lifetime.typical > r1.annual.typical * 5);

  console.log("\n=========================================");
  console.log("RESULT: " + pass + " passed, " + fail + " failed");
  console.log("=========================================\n");
  process.exit(fail > 0 ? 1 : 0);
})().catch(function (e) { console.error(e); process.exit(1); });
