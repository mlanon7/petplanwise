/* ============================================================
   CSV LOADER — sole source of truth for the calculator engine.
   Loads every numeric data table from /assets/data/csv/*.csv and
   reshapes it into the legacy window.PETCOST_DATA.* keys that the
   calculator engine reads. NO numbers are duplicated in JS.

   In Node tests, a tiny fs-backed fetch stub provides the same
   interface (see tests/calculator.test.js).
   ============================================================ */
(function () {
  "use strict";
  var D = window.PETCOST_DATA = window.PETCOST_DATA || {};

  /* ---------- tiny CSV parser (RFC-4180-ish) ---------- */
  function parseCSV(text) {
    if (text == null) return [];
    var rows = [], row = [], field = "", inQuotes = false;
    for (var i = 0; i < text.length; i++) {
      var c = text.charAt(i);
      if (inQuotes) {
        if (c === '"') {
          if (text.charAt(i + 1) === '"') { field += '"'; i++; }
          else inQuotes = false;
        } else field += c;
      } else {
        if (c === '"') inQuotes = true;
        else if (c === ',') { row.push(field); field = ""; }
        else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ""; }
        else if (c === '\r') { /* skip */ }
        else field += c;
      }
    }
    if (field !== "" || row.length) { row.push(field); rows.push(row); }
    if (!rows.length) return [];
    var headers = rows[0];
    var out = [];
    for (var r = 1; r < rows.length; r++) {
      var rr = rows[r];
      // skip fully-empty rows
      var allEmpty = true;
      for (var k = 0; k < rr.length; k++) if (rr[k] !== "" && rr[k] != null) { allEmpty = false; break; }
      if (allEmpty) continue;
      var o = {};
      for (var h = 0; h < headers.length; h++) o[headers[h]] = rr[h] != null ? rr[h] : "";
      out.push(o);
    }
    return out;
  }
  function num(v) {
    if (v == null || v === "") return null;
    var n = Number(v);
    return isNaN(n) ? null : n;
  }

  /* ---------- fetch CSV (Google Sheets live, with local fallback) ----------
     Strategy:
       1) Try Google Sheets gviz CSV endpoint by tab name (latest data).
       2) On failure, fall back to bundled /assets/data/csv/<file>.csv.
     The Sheet ID is configurable via window.PETCOST_SHEET_ID; the default is the
     production YourPetBill sheet. To disable live fetch and only use bundled
     CSVs, set window.PETCOST_USE_SHEET = false BEFORE this file runs. */
  var SHEET_ID = (typeof window !== "undefined" && window.PETCOST_SHEET_ID)
    || "1phcplKG7wqlSR9Pnkj2v672oBiDGtcZSbBncSEUvsFQ";
  var USE_SHEET = (typeof window !== "undefined" && window.PETCOST_USE_SHEET === true);

  function sheetURL(tabName) {
    return "https://docs.google.com/spreadsheets/d/" + SHEET_ID
      + "/gviz/tq?tqx=out:csv&sheet=" + encodeURIComponent(tabName);
  }

  function fetchCSV(url) {
    var localPath = url;
    var tabName = url.replace(/^.*\/csv\//, "").replace(/\.csv$/, "");
    function fromLocal() {
      return fetch(localPath).then(function (r) {
        if (!r || !r.ok) throw new Error("CSV fetch failed: " + url);
        return r.text();
      }).then(parseCSV);
    }
    if (!USE_SHEET || !SHEET_ID) return fromLocal();
    return fetch(sheetURL(tabName), { cache: "no-store" }).then(function (r) {
      if (!r || !r.ok) throw new Error("sheet fetch failed: " + tabName);
      return r.text();
    }).then(function (text) {
      // gviz returns HTML on auth error; detect & fallback
      if (/^<!DOCTYPE|^<html/i.test(text.slice(0, 32))) throw new Error("gviz auth error");
      return parseCSV(text);
    }).catch(function () { return fromLocal(); });
  }

  /* ---------- adapters: rows → PETCOST_DATA.<slot> ---------- */
  function loadBaseCosts() {
    return fetchCSV("/assets/data/csv/base-costs.csv").then(function (rows) {
      var out = { dog: {}, cat: {} };
      rows.forEach(function (r) {
        if (!out[r.species]) out[r.species] = {};
        out[r.species][r.category] = { low: num(r.low), typical: num(r.typical), high: num(r.high) };
      });
      D.baseCosts = out;
    });
  }
  function loadFirstYearOneTime() {
    return fetchCSV("/assets/data/csv/first-year-one-time.csv").then(function (rows) {
      var out = { dog: {}, cat: {} };
      rows.forEach(function (r) {
        if (!out[r.species]) out[r.species] = {};
        out[r.species][r.category] = { low: num(r.low), typical: num(r.typical), high: num(r.high) };
      });
      D.firstYearOneTime = out;
    });
  }
  function loadLifeExpectancy() {
    return fetchCSV("/assets/data/csv/life-expectancy.csv").then(function (rows) {
      var out = { dog: {}, cat: {} };
      rows.forEach(function (r) {
        if (!out[r.species]) out[r.species] = {};
        out[r.species][r.group] = num(r.years);
      });
      D.lifeExpectancy = out;
    });
  }
  function loadEmergencyFund() {
    return fetchCSV("/assets/data/csv/emergency-fund.csv").then(function (rows) {
      var out = {};
      rows.forEach(function (r) {
        out[r.species] = { low: num(r.low), typical: num(r.typical), high: num(r.high) };
      });
      D.emergencyFund = out;
    });
  }
  function loadSizeMultipliers() {
    return fetchCSV("/assets/data/csv/size-multipliers.csv").then(function (rows) {
      var out = {};
      rows.forEach(function (r) { out[r.size] = num(r.multiplier); });
      D.sizeMultipliers = out;
    });
  }
  function loadAgeMultipliers() {
    return fetchCSV("/assets/data/csv/age-multipliers.csv").then(function (rows) {
      var out = {};
      rows.forEach(function (r) {
        if (!out[r.species]) out[r.species] = {};
        if (!out[r.species][r.stage]) out[r.species][r.stage] = {};
        out[r.species][r.stage][r.category] = num(r.multiplier);
      });
      D.ageMultipliers = out;
    });
  }
  function loadLifestyleMultipliers() {
    return fetchCSV("/assets/data/csv/lifestyle-multipliers.csv").then(function (rows) {
      var out = {};
      rows.forEach(function (r) {
        if (!out[r.lifestyle]) out[r.lifestyle] = {};
        out[r.lifestyle][r.category] = num(r.multiplier);
      });
      D.lifestyleMultipliers = out;
    });
  }
  function loadStateMultipliers() {
    return fetchCSV("/assets/data/csv/state-multipliers.csv").then(function (rows) {
      var out = {};
      rows.forEach(function (r) { out[r.state] = num(r.multiplier); });
      D.stateMultipliers = out;
    });
  }
  function loadStateAdjustedCategories() {
    return fetchCSV("/assets/data/csv/state-adjusted-categories.csv").then(function (rows) {
      var s = new Set();
      rows.forEach(function (r) { if (r.category) s.add(r.category); });
      D.stateAdjusted = s;
    });
  }
  function loadCityMultipliers() {
    return fetchCSV("/assets/data/csv/city-multipliers.csv").then(function (rows) {
      var out = {};
      rows.forEach(function (r) {
        out[r.slug] = { name: r.name, state: r.state, mult: num(r.multiplier) };
      });
      D.cityMultipliers = out;
    });
  }
  function loadBreeds() {
    return fetchCSV("/assets/data/csv/breeds.csv").then(function (rows) {
      var out = {};
      rows.forEach(function (r) {
        out[r.slug] = {
          species: r.species,
          name: r.name,
          size: r.size,
          grooming: num(r.grooming),
          healthRisk: num(r.health_risk),
          notes: r.notes,
          purchase: { low: num(r.purchase_low), typical: num(r.purchase_typical), high: num(r.purchase_high) },
          avgLife: num(r.avg_life)
        };
      });
      D.breeds = out;
    });
  }
  function loadProcedures() {
    return Promise.all([
      fetchCSV("/assets/data/csv/procedures.csv"),
      fetchCSV("/assets/data/csv/emergency-keys.csv")
    ]).then(function (parts) {
      var procRows = parts[0], emergencyRows = parts[1];
      var procs = {};
      procRows.forEach(function (r) {
        var entry = {
          name: r.name,
          low: num(r.low),
          typical: num(r.typical),
          high: num(r.high),
          species: r.species || "any"
        };
        if (r.emergency_note) entry.emergency = r.emergency_note;
        procs[r.key] = entry;
      });
      D.procedures = procs;
      var em = {};
      emergencyRows.forEach(function (r) {
        if (procs[r.key]) em[r.key] = procs[r.key];
      });
      D.emergencyScenarios = em;
      D.emergencyByPet = function (species) {
        var all = D.emergencyScenarios || {}, out = {};
        Object.keys(all).forEach(function (k) {
          var s = all[k].species || "any";
          if (species === "any" || s === "any" || s === species) out[k] = all[k];
        });
        return out;
      };
    });
  }
  function loadInsurance() {
    return Promise.all([
      fetchCSV("/assets/data/csv/insurance-ranges.csv"),
      fetchCSV("/assets/data/csv/insurance-monthly-premium.csv"),
      fetchCSV("/assets/data/csv/insurance-defaults.csv")
    ]).then(function (parts) {
      var rangesRows = parts[0], premiumRows = parts[1], defaultsRows = parts[2];

      var ranges = {};
      rangesRows.forEach(function (r) {
        if (!ranges[r.species]) ranges[r.species] = {};
        ranges[r.species][r.level] = { monthlyPremium: num(r.monthly_premium), description: r.description };
      });
      D.insuranceRanges = ranges;

      var premium = {};
      premiumRows.forEach(function (r) {
        if (!premium[r.species]) premium[r.species] = {};
        premium[r.species][r.stage] = { low: num(r.low), typical: num(r.typical), high: num(r.high) };
      });
      var def = defaultsRows[0] || {};
      D.insurance = {
        monthlyPremium: premium,
        defaults: {
          deductible: num(def.deductible),
          reimbursement: num(def.reimbursement),
          annualLimit: num(def.annual_limit)
        }
      };
      D.insurancePlanTemplate = {
        name: "Standard Accident & Illness",
        species: "any",
        ageMin: 0,
        ageMax: 10,
        deductible: D.insurance.defaults.deductible,
        reimbursement: D.insurance.defaults.reimbursement,
        annualLimit: D.insurance.defaults.annualLimit
      };
    });
  }
  function loadBreedImages() {
    return fetchCSV("/assets/data/csv/breed-images.csv").then(function (rows) {
      var out = {};
      rows.forEach(function (r) {
        out[r.slug] = {
          src: r.src,
          alt: r.alt,
          credit: r.credit,
          creditUrl: r.credit_url,
          license: r.license,
          licenseUrl: r.license_url,
          width: num(r.width),
          height: num(r.height)
        };
      });
      D.breedImages = out;
    });
  }


  function loadReviewer() {
    return fetchCSV("/assets/data/csv/reviewer.csv").then(function (rows) {
      var R = {};
      rows.forEach(function (r) { R[r.field] = r.value; });
      D.reviewer = R;
    }).catch(function () { /* optional file — silent */ });
  }

  /* ---------- bootstrap: kick off every loader, expose ready() ---------- */
  var allLoaders = [
    loadBaseCosts(),
    loadFirstYearOneTime(),
    loadLifeExpectancy(),
    loadEmergencyFund(),
    loadSizeMultipliers(),
    loadAgeMultipliers(),
    loadLifestyleMultipliers(),
    loadStateMultipliers(),
    loadStateAdjustedCategories(),
    loadCityMultipliers(),
    loadBreeds(),
    loadProcedures(),
    loadInsurance(),
    loadBreedImages(),
    loadReviewer()
  ];
  var readyPromise = Promise.all(allLoaders).then(function () { return D; });
  D._readyPromise = readyPromise;
  D.ready = function () { return readyPromise; };
  D._parseCSV = parseCSV;
})();
