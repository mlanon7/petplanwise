/* =============================================================
   Pet Cost Calculator Engine — single source of truth.
   Vanilla JS, no deps. Mounts onto any element with data-calculator.
   Data is loaded async from /assets/data/csv/*.csv via csv-loader.js;
   we wait for window.PETCOST_DATA.ready() before mounting.
   ============================================================= */
(function () {
  "use strict";
  window.PetCostEngine = window.PetCostEngine || {};
  var D = window.PETCOST_DATA = window.PETCOST_DATA || {};

  var fmt = function (n) { return "$" + Math.round(n).toLocaleString("en-US"); };
  var fmtRange = function (lo, hi) { return fmt(lo) + " – " + fmt(hi); };

  /* ---------- multiplier helpers ---------- */
  function pickAge(species, stage, key) {
    var m = (D.ageMultipliers || {})[species] || {};
    var stageMap = m[stage] || m.adult || {};
    if (typeof stageMap === "number") return stageMap;
    return (stageMap[key] != null) ? stageMap[key] : (stageMap.default != null ? stageMap.default : 1);
  }
  function pickLifestyle(level, key) {
    var m = (D.lifestyleMultipliers || {})[level] || (D.lifestyleMultipliers || {}).standard || {};
    if (typeof m === "number") return m;
    return (m[key] != null) ? m[key] : (m.default != null ? m.default : 1);
  }
  function pickState(state, key) {
    var v = (D.stateMultipliers || {})[state];
    if (!v) return 1;
    return (D.stateAdjusted && D.stateAdjusted.has(key)) ? v : 1;
  }
  function pickCity(slug, key) {
    if (!slug) return 1;
    var c = (D.cityMultipliers || {})[slug];
    if (!c) return 1;
    return (D.stateAdjusted && D.stateAdjusted.has(key)) ? c.mult : 1;
  }
  function pickBreed(slug) { return (slug && D.breeds) ? D.breeds[slug] : null; }
  function breedMult(b, key) {
    if (!b) return 1;
    if (key === "grooming") return b.grooming || 1;
    if (["routine_vet","vaccines","preventatives","dental","insurance"].indexOf(key) >= 0) return b.healthRisk || 1;
    return 1;
  }
  function applyM(b, m) { return { low: b.low * m, typical: b.typical * m, high: b.high * m }; }
  function combine() {
    var acc = { low: 0, typical: 0, high: 0 };
    for (var i = 0; i < arguments.length; i++) {
      var x = arguments[i] || {};
      acc = { low: acc.low + (x.low || 0), typical: acc.typical + (x.typical || 0), high: acc.high + (x.high || 0) };
    }
    return acc;
  }

  function humanCat(k) {
    return ({
      food:"Food", treats:"Treats", litter:"Litter", routine_vet:"Routine vet care",
      vaccines:"Vaccines", preventatives:"Flea/tick & heartworm", grooming:"Grooming",
      training:"Training", boarding:"Boarding / daycare", supplies:"Supplies",
      license:"License/registration", dental:"Dental care", insurance:"Pet insurance"
    })[k] || k;
  }

  /* ---------- THE ENGINE ---------- */
  function computePet(species, opts) {
    opts = opts || {};
    var breed = pickBreed(opts.breed);
    var effectiveSize = (breed && breed.size) ? breed.size : (opts.size || "medium");
    var cats = (species === "dog")
      ? ["food","treats","routine_vet","vaccines","preventatives","grooming","training","boarding","supplies","license"]
      : ["food","treats","litter","routine_vet","vaccines","preventatives","dental","supplies","grooming"];

    var breakdown = [];
    var annual = { low: 0, typical: 0, high: 0 };

    cats.forEach(function (k) {
      var base = ((D.baseCosts || {})[species] || {})[k];
      if (!base) return;
      var sizeMult = (species === "dog") ? ((D.sizeMultipliers || {})[effectiveSize] || 1) : 1;
      var ageMult = pickAge(species, opts.stage, k);
      var lifeMult = pickLifestyle(opts.lifestyle, k);
      var locMult = opts.city ? pickCity(opts.city, k) : pickState(opts.state, k);
      var bMult = breedMult(breed, k);
      var isSizeKey = ["food","grooming","boarding","preventatives","supplies","insurance","vaccines","routine_vet"].indexOf(k) >= 0;
      var m = (isSizeKey ? sizeMult : 1) * ageMult * lifeMult * locMult * bMult;
      var cost = applyM(base, m);
      breakdown.push({ key: k, name: humanCat(k), cost: cost });
      annual = combine(annual, cost);
    });

    if (opts.insurance === "yes") {
      var ip = ((D.insurance || {}).monthlyPremium || {})[species];
      var stageKey = species === "cat" ? (opts.stage === "puppy" ? "kitten" : opts.stage) : (opts.stage === "kitten" ? "puppy" : opts.stage);
      var p = ip ? (ip[stageKey] || ip.adult) : null;
      if (p) {
        var ins = { low: p.low * 12, typical: p.typical * 12, high: p.high * 12 };
        breakdown.push({ key: "insurance", name: "Pet insurance", cost: ins });
        annual = combine(annual, ins);
      }
    }

    var oneBlock = ((D.firstYearOneTime || {})[species] || {});
    var oneTime = { low: 0, typical: 0, high: 0 };
    Object.keys(oneBlock).forEach(function (k) { oneTime = combine(oneTime, oneBlock[k]); });
    if (oneTime.typical === 0) {
      oneTime = { low: annual.low * 0.10, typical: annual.typical * 0.12, high: annual.high * 0.18 };
    }

    var years;
    if (breed && breed.avgLife) years = breed.avgLife;
    else if (species === "dog") years = ((D.lifeExpectancy || {}).dog || {})[effectiveSize] || 12;
    else if (species === "cat") years = ((D.lifeExpectancy || {}).cat || {})[opts.indoor === "outdoor" ? "outdoor" : "indoor"] || 14;
    else years = 12;

    var firstYear = combine(annual, oneTime);

    /* ---- Phase-weighted lifetime projection ----
       Don't multiply the *current* stage's annual cost by full lifespan
       (the old logic made a "senior in Manhattan, premium lifestyle"
       project to $213K because it modeled senior costs for every year).
       Instead, split the projection into puppy/kitten + adult + senior
       phases, re-compute the annual for each phase, then sum. */
    function annualForStage(stg) {
      var a = { low: 0, typical: 0, high: 0 };
      cats.forEach(function (k) {
        var base = ((D.baseCosts || {})[species] || {})[k];
        if (!base) return;
        var sizeMult = (species === "dog") ? ((D.sizeMultipliers || {})[effectiveSize] || 1) : 1;
        var ageMult = pickAge(species, stg, k);
        var lifeMult = pickLifestyle(opts.lifestyle, k);
        var locMult = opts.city ? pickCity(opts.city, k) : pickState(opts.state, k);
        var bMult = breedMult(breed, k);
        var isSizeKey = ["food","grooming","boarding","preventatives","supplies","insurance","vaccines","routine_vet"].indexOf(k) >= 0;
        var m = (isSizeKey ? sizeMult : 1) * ageMult * lifeMult * locMult * bMult;
        a = combine(a, applyM(base, m));
      });
      if (opts.insurance === "yes") {
        var ip = ((D.insurance || {}).monthlyPremium || {})[species];
        var stageKey = species === "cat" ? (stg === "puppy" ? "kitten" : stg) : (stg === "kitten" ? "puppy" : stg);
        var p = ip ? (ip[stageKey] || ip.adult) : null;
        if (p) a = combine(a, { low: p.low * 12, typical: p.typical * 12, high: p.high * 12 });
      }
      return a;
    }
    var puppyStage = species === "dog" ? "puppy" : "kitten";
    var puppyAnnual = annualForStage(puppyStage);
    var adultAnnual = annualForStage("adult");
    var seniorAnnual = annualForStage("senior");
    /* Year allocation: puppyhood ~1yr, senior ~20% of life (min 2, max 4),
       remainder is adult. One-time first-year costs apply once. */
    var seniorYears = Math.min(4, Math.max(2, Math.round(years * 0.20)));
    var puppyYears = 1;
    var adultYears = Math.max(1, years - puppyYears - seniorYears);
    var lifetime = {
      low:     puppyAnnual.low     * puppyYears + adultAnnual.low     * adultYears + seniorAnnual.low     * seniorYears + oneTime.low,
      typical: puppyAnnual.typical * puppyYears + adultAnnual.typical * adultYears + seniorAnnual.typical * seniorYears + oneTime.typical,
      high:    puppyAnnual.high    * puppyYears + adultAnnual.high    * adultYears + seniorAnnual.high    * seniorYears + oneTime.high
    };

    var monthly = { low: annual.low / 12, typical: annual.typical / 12, high: annual.high / 12 };
    var ef = (D.emergencyFund || {})[species] || { low: 1500, typical: 3000, high: 6000 };

    return {
      breakdown: breakdown, annual: annual, firstYear: firstYear, lifetime: lifetime,
      monthly: monthly, oneTime: oneTime, years: years, emergencyFund: ef
    };
  }

  window.PetCostEngine.computePet = computePet;
  window.PetCostEngine.fmt = fmt;
  window.PetCostEngine.fmtRange = fmtRange;

  /* ============================================================
     UI MOUNTING (browser only — guarded by document existence)
     ============================================================ */
  if (typeof document === "undefined" || !document.addEventListener) return;

  function el(tag, attrs, children) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === "class") e.className = attrs[k];
      else if (k === "html") e.innerHTML = attrs[k];
      else if (k.indexOf("on") === 0) e.addEventListener(k.slice(2), attrs[k]);
      else if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    }
    if (children) (Array.isArray(children) ? children : [children]).forEach(function (c) {
      if (c == null) return;
      e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
    });
    return e;
  }

  function lsKey(t) { return "petcost:" + t; }
  function loadOpts(t) { try { return JSON.parse(localStorage.getItem(lsKey(t))) || null; } catch (e) { return null; } }
  function saveOpts(t, o) { try { localStorage.setItem(lsKey(t), JSON.stringify(o)); } catch (e) {} }

  function track(name, props) {
    try {
      if (window.__petcostDebug) console.log("[track]", name, props);
    } catch (e) {}
  }
  function updateUrlState(opts) {
    if (!window.history || !window.history.replaceState) return;
    try {
      var qs = new URLSearchParams();
      ["species","size","stage","state","lifestyle","insurance","indoor","breed","city"].forEach(function (k) {
        if (opts[k] != null && opts[k] !== "") qs.set(k, opts[k]);
      });
      var url = window.location.pathname + (qs.toString() ? "?" + qs.toString() : "") + window.location.hash;
      window.history.replaceState(null, "", url);
    } catch (e) {}
  }
  function copyEstimateText(species, opts, r) {
    return [
      "Pet cost estimate (" + (opts.breed ? opts.breed.replace(/-/g," ") : species) + ")",
      "Monthly: " + fmt(r.monthly.typical),
      "Annual: " + fmt(r.annual.typical),
      "First year: " + fmt(r.firstYear.typical),
      "Lifetime (" + r.years + " yr): " + fmt(r.lifetime.typical),
      "Suggested emergency fund: " + fmt(r.emergencyFund.typical),
      "", "Inputs: " + JSON.stringify(opts), window.location.href
    ].join("\n");
  }

  function formField(label, control, hint) {
    var w = el("div", { class: "field" });
    w.appendChild(el("label", null, label));
    w.appendChild(control);
    if (hint) w.appendChild(el("div", { class: "hint" }, hint));
    return w;
  }
  function chips(items, selected, onChange) {
    var w = el("div", { class: "chips", role: "radiogroup" });
    items.forEach(function (pair) {
      var c = el("button", {
        type: "button", role: "radio",
        class: "chip" + (selected === pair[0] ? " is-active" : ""),
        "aria-checked": selected === pair[0] ? "true" : "false",
        onclick: function (e) {
          w.querySelectorAll(".chip").forEach(function (x) { x.classList.remove("is-active"); x.setAttribute("aria-checked","false"); });
          e.currentTarget.classList.add("is-active");
          e.currentTarget.setAttribute("aria-checked","true");
          onChange(pair[0]);
        }
      }, pair[1]);
      w.appendChild(c);
    });
    return w;
  }
  function stateSelect(selected, onChange) {
    var sel = el("select", { onchange: function (e) { onChange(e.target.value); } });
    Object.keys(D.stateMultipliers || {}).sort().forEach(function (code) {
      var o = el("option", { value: code }, code);
      if (code === selected) o.setAttribute("selected", "selected");
      sel.appendChild(o);
    });
    return sel;
  }
  function citySelect(selected, onChange) {
    var sel = el("select", { onchange: function (e) { onChange(e.target.value || null); } });
    sel.appendChild(el("option", { value: "" }, "— None / use state —"));
    var cities = D.cityMultipliers || {};
    Object.keys(cities).sort(function (a, b) { return cities[a].name.localeCompare(cities[b].name); }).forEach(function (slug) {
      var c = cities[slug];
      var o = el("option", { value: slug }, c.name + " (" + c.state + ")");
      if (slug === selected) o.setAttribute("selected", "selected");
      sel.appendChild(o);
    });
    return sel;
  }
  function numInput(initial, onChange, prefix) {
    var wrap = el("div", { style: "position:relative" });
    if (prefix) wrap.appendChild(el("span", {
      style: "position:absolute;left:10px;top:50%;transform:translateY(-50%);color:var(--muted);font-size:14px;pointer-events:none;"
    }, prefix));
    var i = el("input", {
      type: "number", value: initial, min: "0",
      style: prefix ? "padding-left:24px;" : "",
      oninput: function (e) { onChange(Number(e.target.value) || 0); }
    });
    wrap.appendChild(i);
    return wrap;
  }
  function stat(label, value) {
    return el("div", { class: "stat" }, [el("div", { class: "label" }, label), el("div", { class: "value" }, value)]);
  }
  function locationDisclaimer() {
    return el("div", { class: "loc-disclaimer" },
      "City and state multipliers are planning adjustments based on cost-of-living and BLS CPI veterinary services data — not real-time clinic quotes.");
  }

  function renderPetResults(host, species, opts, r) {
    var tabState = host.__tab || "first";
    var headlineMap = {
      first:    { val: r.firstYear },
      annual:   { val: r.annual },
      monthly:  { val: r.monthly },
      lifetime: { val: r.lifetime },
      emergency:{ val: r.emergencyFund }
    };
    var head = headlineMap[tabState] || headlineMap.first;

    host.innerHTML = "";
    host.appendChild(el("h2", null, "Your estimate"));
    host.appendChild(el("div", { class: "result-headline" }, [
      el("span", { class: "amount" }, fmt(head.val.typical)),
      el("span", { class: "range" }, "Range: " + fmtRange(head.val.low, head.val.high))
    ]));

    var tabs = el("div", { class: "result-tabs", role: "tablist" });
    [["first","First year"],["annual","Annual"],["monthly","Monthly"],["lifetime","Lifetime"],["emergency","Emergency fund"]].forEach(function (t) {
      var btn = el("button", {
        type: "button", role: "tab",
        class: "result-tab" + (tabState === t[0] ? " is-active" : ""),
        "aria-selected": tabState === t[0] ? "true" : "false",
        onclick: function () { host.__tab = t[0]; renderPetResults(host, species, opts, r); track("result_tab_changed", { tab: t[0] }); }
      }, t[1]);
      tabs.appendChild(btn);
    });
    host.appendChild(tabs);

    var summary = el("div", { class: "result-summary" });
    summary.appendChild(stat("Monthly", fmt(r.monthly.typical)));
    summary.appendChild(stat("Annual", fmt(r.annual.typical)));
    summary.appendChild(stat("Emergency fund", fmt(r.emergencyFund.typical)));
    host.appendChild(summary);

    var top3 = r.breakdown.slice().sort(function (a, b) { return b.cost.typical - a.cost.typical; }).slice(0, 3);
    if (top3.length) {
      var t3 = el("div", { class: "top3-drivers" });
      t3.appendChild(el("h3", null, "Top 3 cost drivers"));
      var t3row = el("div", { class: "top3-row" });
      top3.forEach(function (b) {
        var card = el("div", { class: "top3-card" });
        card.appendChild(el("div", { class: "top3-label" }, b.name));
        card.appendChild(el("div", { class: "top3-amount" }, fmt(b.cost.typical) + "/yr"));
        t3row.appendChild(card);
      });
      t3.appendChild(t3row);
      host.appendChild(t3);
    }

    /* Sort by typical desc so the biggest cost drivers surface first */
    var sortedBreakdown = r.breakdown.slice().sort(function (a, b) {
      return b.cost.typical - a.cost.typical;
    });
    var max = Math.max.apply(null, sortedBreakdown.map(function (b) { return b.cost.typical; }));
    var wrap = el("div", { class: "breakdown" });
    wrap.appendChild(el("h3", null, "Full annual breakdown"));
    var tbl = el("table");
    tbl.appendChild(el("thead", null, el("tr", null, [
      el("th", null, "Category"),
      el("th", { class: "num" }, "Low"),
      el("th", { class: "num" }, "Typical"),
      el("th", { class: "num" }, "High")
    ])));
    var tb = el("tbody");
    sortedBreakdown.forEach(function (b) {
      var w = max > 0 ? (b.cost.typical / max) * 100 : 0;
      tb.appendChild(el("tr", null, [
        el("td", null, [el("div", null, b.name), el("div", { class: "bar-track" }, el("div", { class: "bar-fill", style: "width:" + w + "%" }))]),
        el("td", { class: "num" }, fmt(b.cost.low)),
        el("td", { class: "num" }, fmt(b.cost.typical)),
        el("td", { class: "num" }, fmt(b.cost.high))
      ]));
    });
    tbl.appendChild(tb);
    wrap.appendChild(tbl);
    host.appendChild(wrap);

    host.appendChild(el("p", { class: "note mt-2" },
      "Sources: AVMA · NAPHIA 2024 · BLS CPI · AAHA. See full source list at /sources/."));

    var breed = pickBreed(opts.breed);
    if (breed) {
      var note = el("div", { class: "breed-risk-note" });
      note.innerHTML = "<strong>" + breed.name + " note:</strong> " + breed.notes;
      host.appendChild(note);
    }

    /* Action buttons */
    var actions = el("div", { class: "result-actions" });
    var copyBtn = el("button", {
      type: "button", class: "btn btn-ghost btn-sm",
      onclick: function () {
        var txt = copyEstimateText(species, opts, r);
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(txt).then(function () {
            copyBtn.textContent = "✓ Copied";
            track("estimate_copied", { type: species });
            setTimeout(function () { copyBtn.textContent = "Copy estimate"; }, 1800);
          }).catch(function () { copyBtn.textContent = "Copy failed"; });
        }
      }
    }, "Copy estimate");
    actions.appendChild(copyBtn);
    actions.appendChild(el("button", {
      type: "button", class: "btn btn-ghost btn-sm",
      onclick: function () { window.print(); }
    }, "Print"));
    host.appendChild(actions);
  }

  function mountPet(host, species, prefill) {
    var saved = loadOpts(species) || {};
    var opts = Object.assign({
      size: "medium", stage: "adult", state: "TX",
      lifestyle: "standard", insurance: "no", indoor: "indoor"
    }, saved, prefill || {});
    if (opts.breed && D.breeds && D.breeds[opts.breed] && !(prefill && prefill.size)) {
      opts.size = D.breeds[opts.breed].size;
    }

    var form = el("div", { class: "calc-form" });
    form.appendChild(el("h2", null, "Tell us about your " + species));

    if (species === "dog") {
      form.appendChild(formField("Size", chips([
        ["toy","Toy (<10 lb)"],["small","Small"],["medium","Medium"],["large","Large"],["giant","Giant (90+ lb)"]
      ], opts.size, function (v) { opts.size = v; sync(); })));
      form.appendChild(formField("Age stage", chips([
        ["puppy","Puppy"],["adult","Adult"],["senior","Senior"]
      ], opts.stage, function (v) { opts.stage = v; sync(); })));
    } else {
      form.appendChild(formField("Age stage", chips([
        ["kitten","Kitten"],["adult","Adult"],["senior","Senior"]
      ], opts.stage, function (v) { opts.stage = v; sync(); })));
      form.appendChild(formField("Indoor or outdoor", chips([
        ["indoor","Indoor"],["outdoor","Indoor + outdoor"]
      ], opts.indoor, function (v) { opts.indoor = v; sync(); })));
    }

    /* Capture the state and city <select> elements so we can keep them in
       sync — picking a metro should auto-update the state, picking a state
       that doesn't match the current metro should clear the metro. */
    var stateSel = stateSelect(opts.state, function (v) {
      opts.state = v;
      /* If the currently-selected metro belongs to a different state, drop it */
      if (opts.city && D.cityMultipliers && D.cityMultipliers[opts.city]
          && D.cityMultipliers[opts.city].state !== v) {
        opts.city = null;
        if (citySel) citySel.value = "";
      }
      sync();
    });
    var citySel = citySelect(opts.city, function (v) {
      opts.city = v;
      if (v && D.cityMultipliers && D.cityMultipliers[v]) {
        opts.state = D.cityMultipliers[v].state;
        /* Reflect the new state in the state dropdown UI */
        if (stateSel) stateSel.value = opts.state;
      }
      sync();
    });
    form.appendChild(formField("State", stateSel));
    form.appendChild(formField("Major metro (optional)", citySel,
      "Optional. Overrides the state with a metro-specific planning multiplier."));
    form.appendChild(locationDisclaimer());
    form.appendChild(formField("Lifestyle", chips([
      ["basic","Basic"],["standard","Standard"],["premium","Premium"]
    ], opts.lifestyle, function (v) { opts.lifestyle = v; sync(); })));
    form.appendChild(formField("Pet insurance", chips([
      ["no","No"],["yes","Yes"]
    ], opts.insurance, function (v) { opts.insurance = v; sync(); })));

    var results = el("div", { class: "calc-results", "aria-live": "polite", "aria-atomic": "false" });
    host.innerHTML = "";
    host.appendChild(form);
    host.appendChild(results);

    function sync() {
      var r = computePet(species, opts);
      renderPetResults(results, species, opts, r);
      updateUrlState(opts);
      saveOpts(species, opts);
    }
    sync();
  }

  function mountVetBill(host) {
    var procs = D.procedures || {};
    var state = { items: { physical_exam: 1, vaccines: 1 }, stateCode: "TX" };

    var form = el("div", { class: "calc-form" });
    form.appendChild(el("h2", null, "Build your estimate"));
    form.appendChild(formField("Your state", stateSelect(state.stateCode, function (v) { state.stateCode = v; sync(); })));
    form.appendChild(locationDisclaimer());
    var list = el("div");
    Object.keys(procs).forEach(function (key) {
      var p = procs[key];
      var row = el("div", { class: "field toggle-row", style: "border-bottom:1px solid var(--border);padding:8px 0;" });
      var cb = el("input", {
        type: "checkbox", id: "vb-" + key,
        onchange: function (e) { state.items[key] = e.target.checked ? 1 : 0; sync(); }
      });
      if (state.items[key]) cb.checked = true;
      var lbl = el("label", { for: "vb-" + key, style: "flex:1;font-weight:500;" }, p.name);
      var rng = el("span", { class: "muted text-sm" }, fmtRange(p.low, p.high));
      row.appendChild(cb); row.appendChild(lbl); row.appendChild(rng);
      list.appendChild(row);
    });
    form.appendChild(list);

    var results = el("div", { class: "calc-results", "aria-live": "polite" });
    host.innerHTML = "";
    host.appendChild(form);
    host.appendChild(results);

    function sync() {
      var sm = D.stateMultipliers[state.stateCode] || 1;
      var total = { low: 0, typical: 0, high: 0 };
      var rows = [];
      Object.keys(state.items).forEach(function (k) {
        if (!state.items[k]) return;
        var p = procs[k];
        var c = { low: p.low * sm, typical: p.typical * sm, high: p.high * sm };
        total = combine(total, c);
        rows.push({ name: p.name, c: c });
      });
      results.innerHTML = "";
      results.appendChild(el("h2", null, "Estimated bill"));
      results.appendChild(el("div", { class: "result-headline" }, [
        el("span", { class: "amount" }, fmt(total.typical)),
        el("span", { class: "range" }, "Range: " + fmtRange(total.low, total.high))
      ]));
      if (rows.length) {
        var wrap = el("div", { class: "breakdown" });
        var tbl = el("table");
        tbl.appendChild(el("thead", null, el("tr", null, [
          el("th", null, "Line item"),
          el("th", { class: "num" }, "Low"),
          el("th", { class: "num" }, "Typical"),
          el("th", { class: "num" }, "High")
        ])));
        var tb = el("tbody");
        rows.forEach(function (r) {
          tb.appendChild(el("tr", null, [
            el("td", null, r.name),
            el("td", { class: "num" }, fmt(r.c.low)),
            el("td", { class: "num" }, fmt(r.c.typical)),
            el("td", { class: "num" }, fmt(r.c.high))
          ]));
        });
        tbl.appendChild(tb);
        wrap.appendChild(tbl);
        results.appendChild(wrap);
      }
      results.appendChild(el("div", { class: "disclaimer" }, "Educational estimate only. Confirm with a written estimate from your veterinarian."));
    }
    sync();
  }

  function mountEmergency(host) {
    var scen = D.emergencyScenarios || {};
    var keys = Object.keys(scen);
    var state = { selected: keys[1] || keys[0], stateCode: "TX", insurance: "no" };

    var form = el("div", { class: "calc-form" });
    form.appendChild(el("h2", null, "Emergency scenario"));
    var opts = keys.map(function (k) { return [k, scen[k].name]; });
    form.appendChild(formField("Scenario", chips(opts, state.selected, function (v) { state.selected = v; sync(); })));
    form.appendChild(formField("State", stateSelect(state.stateCode, function (v) { state.stateCode = v; sync(); })));
    form.appendChild(formField("Pet insurance?", chips([
      ["no","No"],["yes","Yes — 80% reimbursement after $500 deductible"]
    ], state.insurance, function (v) { state.insurance = v; sync(); })));

    var results = el("div", { class: "calc-results", "aria-live": "polite" });
    host.innerHTML = "";
    host.appendChild(form);
    host.appendChild(results);

    function sync() {
      var p = scen[state.selected];
      var m = D.stateMultipliers[state.stateCode] || 1;
      var cost = { low: p.low * m, typical: p.typical * m, high: p.high * m };
      var oop = cost, savings = null;
      if (state.insurance === "yes") {
        var calcOOP = function (v) { return Math.max(0, v - 500) * 0.20 + Math.min(500, v); };
        oop = { low: calcOOP(cost.low), typical: calcOOP(cost.typical), high: calcOOP(cost.high) };
        savings = { typical: cost.typical - oop.typical };
      }
      results.innerHTML = "";
      results.appendChild(el("h2", null, p.name));
      if (p.emergency) {
        var w = el("div", { class: "emergency-warning" });
        w.innerHTML = "<div><strong>Time-sensitive — call your vet or ER now:</strong> " + p.emergency + "</div>";
        results.appendChild(w);
      }
      results.appendChild(el("div", { class: "result-headline" }, [
        el("span", { class: "amount" }, fmt(cost.typical)),
        el("span", { class: "range" }, "Likely range: " + fmtRange(cost.low, cost.high))
      ]));
      if (state.insurance === "yes") {
        results.appendChild(el("div", { class: "result-summary mt-2" }, [
          stat("Out-of-pocket (typical)", fmt(oop.typical)),
          stat("You save (typical)", fmt(savings.typical))
        ]));
      } else {
        results.appendChild(el("div", { class: "result-summary mt-2" }, [
          stat("Suggested emergency fund", fmt(Math.max(2500, cost.typical))),
          stat("Without insurance you pay", fmt(cost.typical)),
          stat("Worst-case", fmt(cost.high))
        ]));
      }
    }
    sync();
  }

  function mountInsurance(host) {
    var state = { species: "dog", stage: "adult", premium: 62, deductible: 500, reimbursement: 80, annualLimit: 10000, expectedClaim: 3500, years: 8 };

    function setDefaultPremium() {
      var stageKey = state.species === "cat" ? (state.stage === "puppy" ? "kitten" : state.stage) : (state.stage === "kitten" ? "puppy" : state.stage);
      var ip = ((D.insurance || {}).monthlyPremium || {})[state.species] || {};
      var p = ip[stageKey];
      if (p) state.premium = p.typical;
    }

    var form = el("div", { class: "calc-form" });
    form.appendChild(el("h2", null, "Run the numbers"));
    form.appendChild(formField("Pet", chips([["dog","Dog"],["cat","Cat"]], state.species, function (v) { state.species = v; setDefaultPremium(); rerender(); })));
    form.appendChild(formField("Age stage", chips([
      ["puppy","Puppy / Kitten"],["adult","Adult"],["senior","Senior"]
    ], state.stage, function (v) { state.stage = v; setDefaultPremium(); rerender(); })));

    var fieldsHost = el("div");
    form.appendChild(fieldsHost);

    var results = el("div", { class: "calc-results", "aria-live": "polite" });
    host.innerHTML = "";
    host.appendChild(form);
    host.appendChild(results);

    function rerender() {
      fieldsHost.innerHTML = "";
      fieldsHost.appendChild(formField("Monthly premium", numInput(state.premium, function (v) { state.premium = v; sync(); }, "$")));
      fieldsHost.appendChild(formField("Annual deductible", numInput(state.deductible, function (v) { state.deductible = v; sync(); }, "$")));
      fieldsHost.appendChild(formField("Reimbursement %", numInput(state.reimbursement, function (v) { state.reimbursement = v; sync(); }, "%")));
      fieldsHost.appendChild(formField("Annual limit", numInput(state.annualLimit, function (v) { state.annualLimit = v; sync(); }, "$")));
      fieldsHost.appendChild(formField("Years to model", numInput(state.years, function (v) { state.years = v; sync(); })));
      fieldsHost.appendChild(formField("Expected unexpected vet bill", numInput(state.expectedClaim, function (v) { state.expectedClaim = v; sync(); }, "$")));
      sync();
    }
    function sync() {
      var tp = state.premium * 12 * state.years;
      var reim = Math.min(state.annualLimit * state.years, Math.max(0, state.expectedClaim - state.deductible) * (state.reimbursement / 100));
      var oopWith = state.expectedClaim - reim + tp;
      var oopWithout = state.expectedClaim;
      var winner = oopWith < oopWithout ? "Insurance" : "Self-savings";

      results.innerHTML = "";
      results.appendChild(el("h2", null, "Result over " + state.years + " years"));
      results.appendChild(el("div", { class: "result-headline" }, [
        el("span", { class: "amount" }, winner + " comes out ahead"),
        el("span", { class: "range" }, "Difference: " + fmt(Math.abs(oopWith - oopWithout)))
      ]));
      results.appendChild(el("div", { class: "result-summary mt-2" }, [
        stat("Total premiums", fmt(tp)),
        stat("OOP with insurance", fmt(oopWith)),
        stat("OOP without", fmt(oopWithout))
      ]));
    }
    setDefaultPremium();
    rerender();
  }

  function mountGeneral(host, prefill) {
    var opts = Object.assign({ species: "dog", size: "medium", stage: "adult", state: "TX", lifestyle: "standard", insurance: "no", indoor: "indoor" }, prefill || {});
    var form = el("div", { class: "calc-form" });
    form.appendChild(el("h2", null, "Quick estimate"));
    form.appendChild(formField("Pet", chips([["dog","Dog"],["cat","Cat"]], opts.species, function (v) { opts.species = v; redraw(); sync(); })));
    var speciesArea = el("div");
    form.appendChild(speciesArea);
    form.appendChild(formField("Age stage", chips([
      ["puppy","Puppy / Kitten"],["adult","Adult"],["senior","Senior"]
    ], opts.stage === "kitten" ? "puppy" : opts.stage, function (v) {
      opts.stage = (opts.species === "cat" && v === "puppy") ? "kitten" : v; sync();
    })));
    form.appendChild(formField("State", stateSelect(opts.state, function (v) { opts.state = v; sync(); })));
    form.appendChild(formField("Lifestyle", chips([
      ["basic","Basic"],["standard","Standard"],["premium","Premium"]
    ], opts.lifestyle, function (v) { opts.lifestyle = v; sync(); })));
    form.appendChild(formField("Pet insurance", chips([
      ["no","No"],["yes","Yes"]
    ], opts.insurance, function (v) { opts.insurance = v; sync(); })));

    var results = el("div", { class: "calc-results", "aria-live": "polite" });
    host.innerHTML = "";
    host.appendChild(form);
    host.appendChild(results);

    function redraw() {
      speciesArea.innerHTML = "";
      if (opts.species === "dog") {
        speciesArea.appendChild(formField("Dog size", chips([
          ["toy","Toy"],["small","Small"],["medium","Medium"],["large","Large"],["giant","Giant"]
        ], opts.size, function (v) { opts.size = v; sync(); })));
      } else {
        speciesArea.appendChild(formField("Indoor or outdoor", chips([
          ["indoor","Indoor"],["outdoor","Indoor + outdoor"]
        ], opts.indoor, function (v) { opts.indoor = v; sync(); })));
        if (opts.stage === "puppy") opts.stage = "kitten";
      }
    }
    function sync() {
      var stage = opts.species === "cat" ? (opts.stage === "puppy" ? "kitten" : opts.stage) : (opts.stage === "kitten" ? "puppy" : opts.stage);
      var r = computePet(opts.species, Object.assign({}, opts, { stage: stage }));
      renderPetResults(results, opts.species, opts, r);
    }
    redraw();
    sync();
  }


  /* ---------- HOMEHERO — simplified hero calculator ---------- */
  function mountHomeHero(host, prefill) {
    var opts = Object.assign({
      species: "dog", size: "medium", stage: "adult",
      state: "TX", lifestyle: "standard", insurance: "no", indoor: "indoor"
    }, prefill || {});

    /* Result panel — stays separate from form, both rendered in two-col grid */
    var formCol = el("div", { class: "home-calc-form" });
    formCol.appendChild(el("h2", null, "Calculate Pet Ownership Costs"));

    /* Pet Type — big chips with SVG icons (no emoji — reliable cross-platform) */
    var ptLabel = el("label", null, "Pet Type");
    formCol.appendChild(ptLabel);
    var ptRow = el("div", { class: "pet-type-chips" });
    var petIcons = { dog: "<svg class=\"pet-ico\" width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M4.5 3.2c.5-1 1.7-1 2 0l1.4 4 .8-.2A6 6 0 0 1 10 7c.6 0 1.2.1 1.7.3.5-.2 1.1-.3 1.7-.3.5 0 .9.1 1.3.1l.7.2 1.4-4c.4-1 1.6-1 2-.1.4 1 .6 2.4.5 3.6-.1 1.6-.7 2.6-1.5 3.4l.6 1c.4.7.6 1.5.6 2.3v3.5c0 1.5-.5 3-1.4 4.1-.7.7-1.6 1.2-2.6 1.2H9c-1 0-1.9-.4-2.6-1.1A6.4 6.4 0 0 1 5 17.1v-3.5c0-.8.2-1.6.6-2.3l.6-1A4.7 4.7 0 0 1 4 7c0-1.2.2-2.6.5-3.6Zm5 11.3a1 1 0 0 0-.9.5L7.7 17a.6.6 0 0 0 .5.9h7.6a.6.6 0 0 0 .5-.9l-.9-2c-.2-.3-.5-.5-.9-.5h-5Zm.6-2.5a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6Zm4.8 0a.8.8 0 1 0 0-1.6.8.8 0 0 0 0 1.6ZM12 14a.6.6 0 0 0 .6-.6V13a.6.6 0 0 0-1.2 0v.4c0 .3.3.6.6.6Z\"/></svg>", cat: "<svg class=\"pet-ico\" width=\"28\" height=\"28\" viewBox=\"0 0 24 24\" fill=\"currentColor\" aria-hidden=\"true\"><path d=\"M5.5 2.4c.4-.4 1-.4 1.4 0l2.6 2.6a8 8 0 0 1 5 0l2.6-2.6c.4-.4 1-.4 1.4 0 .3.3.4.7.3 1.1L17.7 7l.4.6c.6 1.1 1 2.4 1 3.8v5.5c0 1.6-.6 3.1-1.6 4.2-.7.7-1.7 1.1-2.7 1.1H9.2c-1 0-2-.4-2.7-1.1A6 6 0 0 1 4.9 17v-5.5c0-1.4.3-2.7 1-3.8l.3-.6L5 3.5c-.1-.4 0-.8.5-1.1Zm4 9.6a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8Zm5 0a.9.9 0 1 0 0-1.8.9.9 0 0 0 0 1.8ZM12 14.4c-1.1 0-2 .5-2.5 1.3a.6.6 0 0 0 .5 1H14a.6.6 0 0 0 .5-1A3 3 0 0 0 12 14.4Z\"/></svg>" };
    [["dog","Dog"],["cat","Cat"]].forEach(function (p) {
      var btn = el("button", {
        type: "button",
        class: "pet-type-chip" + (opts.species === p[0] ? " is-active" : ""),
        "aria-pressed": opts.species === p[0] ? "true" : "false",
        onclick: function (e) {
          ptRow.querySelectorAll("button").forEach(function (x) { x.classList.remove("is-active"); x.setAttribute("aria-pressed","false"); });
          e.currentTarget.classList.add("is-active");
          e.currentTarget.setAttribute("aria-pressed","true");
          opts.species = p[0];
          if (opts.species === "cat" && opts.stage === "puppy") opts.stage = "kitten";
          if (opts.species === "dog" && opts.stage === "kitten") opts.stage = "puppy";
          sync();
        }
      });
      var iconSpan = document.createElement("span");
      iconSpan.className = "pet-ico-wrap";
      iconSpan.innerHTML = petIcons[p[0]];
      btn.appendChild(iconSpan);
      var lbl = document.createElement("span");
      lbl.className = "pet-ico-label";
      lbl.textContent = p[1];
      btn.appendChild(lbl);
      ptRow.appendChild(btn);
    });
    var ptField = el("div", { class: "field" });
    ptField.appendChild(ptRow);
    formCol.appendChild(ptField);

    /* Size — dropdown for dogs only; cats default medium */
    var sizeWrap = el("div", { class: "field" });
    sizeWrap.appendChild(el("label", null, "Size"));
    var sizeSelect = el("select", {
      onchange: function (e) { opts.size = e.target.value; sync(); }
    });
    [
      ["toy","Toy (under 10 lbs)"],
      ["small","Small (10–25 lbs)"],
      ["medium","Medium (25–60 lbs)"],
      ["large","Large (60–90 lbs)"],
      ["giant","Giant (90+ lbs)"]
    ].forEach(function (s) {
      var o = el("option", { value: s[0] }, s[1]);
      if (opts.size === s[0]) o.setAttribute("selected","selected");
      sizeSelect.appendChild(o);
    });
    sizeWrap.appendChild(sizeSelect);
    formCol.appendChild(sizeWrap);

    /* Age — dropdown */
    var ageWrap = el("div", { class: "field" });
    ageWrap.appendChild(el("label", null, "Age"));
    var ageSelect = el("select", {
      onchange: function (e) {
        var v = e.target.value;
        opts.stage = (opts.species === "cat" && v === "puppy") ? "kitten" : v;
        sync();
      }
    });
    [
      ["puppy","Puppy / Kitten (under 1 year)"],
      ["adult","Adult (1–7 years)"],
      ["senior","Senior (7+ years)"]
    ].forEach(function (a) {
      var o = el("option", { value: a[0] }, a[1]);
      var match = (opts.stage === a[0]) || (a[0] === "puppy" && opts.stage === "kitten");
      if (match) o.setAttribute("selected","selected");
      ageSelect.appendChild(o);
    });
    ageWrap.appendChild(ageSelect);
    formCol.appendChild(ageWrap);

    /* Insurance — single styled checkbox row */
    var insWrap = el("label", { class: "insurance-toggle" });
    var insIn = el("input", {
      type: "checkbox",
      onchange: function (e) { opts.insurance = e.target.checked ? "yes" : "no"; sync(); }
    });
    if (opts.insurance === "yes") insIn.checked = true;
    insWrap.appendChild(insIn);
    var insTxt = document.createElement("span");
    insTxt.className = "insurance-toggle-label";
    insTxt.textContent = "I have pet insurance";
    insWrap.appendChild(insTxt);
    formCol.appendChild(insWrap);

    /* Result column */
    var resultCol = el("div", { class: "home-result", "aria-live": "polite", "aria-atomic": "false" });

    /* Mount: replace host inner with two-col grid */
    host.innerHTML = "";
    host.classList.add("home-hero-mount");
    var grid = el("div", { class: "home-hero-grid" });
    grid.appendChild(formCol);
    grid.appendChild(resultCol);
    host.appendChild(grid);

    function sync() {
      var stage = opts.species === "cat" ? (opts.stage === "puppy" ? "kitten" : opts.stage) : (opts.stage === "kitten" ? "puppy" : opts.stage);
      var r = computePet(opts.species, Object.assign({}, opts, { stage: stage }));
      renderHomeHero(resultCol, opts, r);
    }
    sync();
  }

  function renderHomeHero(host, opts, r) {
    host.innerHTML = "";

    /* Headline card: $ Monthly */
    var head = el("div", { class: "home-result-headline" });
    var lbl = el("div", { class: "label" });
    lbl.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg> Monthly Cost Estimate';
    head.appendChild(lbl);
    var amount = el("span", { class: "amount" }, fmt(r.monthly.typical));
    var per = el("span", { class: "per" }, "/month");
    head.appendChild(amount);
    head.appendChild(per);
    var rng = el("div", { class: "range" }, [
      el("span", null, "Low: " + fmt(r.monthly.low)),
      el("span", null, "High: " + fmt(r.monthly.high))
    ]);
    head.appendChild(rng);
    host.appendChild(head);

    /* Two cards: Annual / Lifetime */
    var cards = el("div", { class: "home-result-cards" });
    var annualCard = el("div", { class: "home-card" });
    annualCard.appendChild(el("div", { class: "label" }, "Annual Cost"));
    annualCard.appendChild(el("div", { class: "val" }, fmt(r.annual.typical)));
    cards.appendChild(annualCard);
    var lifeCard = el("div", { class: "home-card" });
    lifeCard.appendChild(el("div", { class: "label" }, "Lifetime (" + r.years + " years)"));
    lifeCard.appendChild(el("div", { class: "val" }, fmt(r.lifetime.typical)));
    cards.appendChild(lifeCard);
    host.appendChild(cards);

    /* Top cost drivers — top 4 by typical desc */
    var drivers = el("div", { class: "home-drivers" });
    var dh = el("h3", null);
    dh.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> Top Cost Drivers';
    drivers.appendChild(dh);
    var top4 = r.breakdown.slice().sort(function (a, b) { return b.cost.typical - a.cost.typical; }).slice(0, 4);
    var ul = el("ul");
    top4.forEach(function (b) {
      var li = el("li");
      li.appendChild(el("span", { class: "name" }, b.name));
      li.appendChild(el("span", { class: "val" }, fmt(b.cost.typical / 12) + "/mo"));
      ul.appendChild(li);
    });
    drivers.appendChild(ul);
    host.appendChild(drivers);

    /* Disclaimer */
    var d = el("div", { class: "home-disclaimer" });
    d.appendChild(el("span", { class: "ico" }, "i"));
    d.appendChild(el("span", null, "Estimates based on U.S. averages. Actual costs vary by location, breed, and lifestyle."));
    host.appendChild(d);
  }

  /* ---------- AUTO MOUNT — show loading skeleton, wait for CSV, then mount ---------- */
  function showSkeleton(node) {
    node.classList.add("calculator", "calc-loading");
    node.innerHTML =
      '<div class="calc-skeleton" role="status" aria-live="polite">' +
        '<div class="calc-skeleton-row"></div>' +
        '<div class="calc-skeleton-row"></div>' +
        '<div class="calc-skeleton-row"></div>' +
        '<span class="calc-skeleton-text">Loading cost data…</span>' +
      '</div>';
  }
  function showError(node, err) {
    node.classList.remove("calc-loading");
    node.classList.add("calc-error");
    node.innerHTML =
      '<div class="calc-error-box" role="alert">' +
        '<strong>Calculator data failed to load.</strong> ' +
        'Please refresh the page. If the problem persists, the cost CSVs at ' +
        '<code>/assets/data/csv/</code> may be missing or unreachable.' +
      '</div>';
    try { console.error("petcost calculator data load failed:", err); } catch (_) {}
  }
  function doMount() {
    document.querySelectorAll("[data-calculator]").forEach(function (node) {
      var t = node.getAttribute("data-calculator");
      var prefill = {};
      ["size","stage","state","lifestyle","species","indoor","insurance","breed","city"].forEach(function (k) {
        if (node.dataset[k]) prefill[k] = node.dataset[k];
      });
      try {
        var qs = new URLSearchParams(window.location.search);
        ["size","stage","state","lifestyle","species","indoor","insurance","breed","city"].forEach(function (k) {
          var v = qs.get(k); if (v) prefill[k] = v;
        });
      } catch (e) {}
      node.classList.remove("calc-loading");
      node.classList.add("calculator");
      if      (t === "general")    mountGeneral(node, prefill);
      else if (t === "dog")        mountPet(node, "dog", prefill);
      else if (t === "cat")        mountPet(node, "cat", prefill);
      else if (t === "vet-bill")   mountVetBill(node);
      else if (t === "emergency")  mountEmergency(node);
      else if (t === "insurance")  mountInsurance(node);
      else if (t === "homehero")   mountHomeHero(node, prefill);
    });
  }
  document.addEventListener("DOMContentLoaded", function () {
    var nodes = document.querySelectorAll("[data-calculator]");
    nodes.forEach(showSkeleton);
    var ready = (D && typeof D.ready === "function") ? D.ready() : Promise.resolve();
    ready.then(function () {
      // Verify we actually got data; if every key is empty, treat as failure.
      var ok = !!(D && D.baseCosts && Object.keys(D.baseCosts.dog || {}).length);
      if (!ok) throw new Error("PETCOST_DATA empty after load");
      doMount();
    }).catch(function (e) {
      nodes.forEach(function (n) { showError(n, e); });
    });
  });
})();
