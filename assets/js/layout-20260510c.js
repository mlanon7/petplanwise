/* =============================================================
   Shared header + footer injection.
   ============================================================= */
(function () {
  "use strict";

  var HEADER = '\n  <header class="site-header">\n' +
    '    <div class="container">\n' +
    '      <a href="/" class="brand" aria-label="YourPetBill.com home">\n' +
    '        <img src="/logo/yourpetbill-lockup-stacked.svg?v=20260510f" alt="YourPetBill.com" class="brand-logo" width="69" height="60" />\n' +
    '      </a>\n' +
    '      <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">\n' +
    '        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>\n' +
    '      </button>\n' +
    '      <nav class="nav" aria-label="Primary">\n' +
    '        <a href="/breeds/">Breeds</a>\n' +
    '        <a href="/states/">States</a>\n' +
    '        <a href="/vet-costs/">Vet Costs</a>\n' +
    '        <a href="/guides/">Guides</a>\n' +
    '      </nav>\n' +
    '    </div>\n' +
    '  </header>';

  var FOOTER = '\n  <footer class="site-footer">\n' +
    '    <div class="container">\n' +
    '      <div class="footer-grid">\n' +
    '        <div>\n' +
    '          <h4>Calculators</h4>\n' +
    '          <a href="/dog-cost-calculator/">Dog Cost</a>\n' +
    '          <a href="/cat-cost-calculator/">Cat Cost</a>\n' +
    '          <a href="/vet-bill-calculator/">Vet Bills</a>\n' +
    '          <a href="/emergency-vet-cost-calculator/">Emergency Vet</a>\n' +
    '        </div>\n' +
    '        <div>\n' +
    '          <h4>Browse</h4>\n' +
    '          <a href="/breeds/">All Breeds</a>\n' +
    '          <a href="/states/">By State</a>\n' +
    '          <a href="/vet-costs/">Vet Procedures</a>\n' +
    '          <a href="/guides/">Guides</a>\n' +
    '        </div>\n' +
    '        <div>\n' +
    '          <h4>Resources</h4>\n' +
    '          <a href="/about/">About</a>\n' +
    '          <a href="/sources/">Sources</a>\n' +
    '          <a href="/pet-insurance-vs-savings/">Insurance Guide</a>\n' +
    '          <a href="/contact/">Contact</a>\n' +
    '        </div>\n' +
    '        <div>\n' +
    '          <h4>Legal</h4>\n' +
    '          <a href="/privacy/">Privacy</a>\n' +
    '          <a href="/terms/">Terms</a>\n' +
    '          <a href="/affiliate-disclosure/">Affiliates</a>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="footer-bottom">\n' +
    '        <span>© <span id="yr"></span> YourPetBill.com. Educational estimates only — not veterinary or financial advice.</span>\n' +
    '        <span>Cost data last reviewed: <strong>May 2026</strong></span>\n' +
    '      </div>\n' +
    '    </div>\n' +
    '  </footer>';

  /* Organization schema injected once per page (E-E-A-T signal) */
  (function () {
    if (document.head.querySelector('script[data-schema="organization"]')) return;
    var s = document.createElement("script");
    s.type = "application/ld+json";
    s.setAttribute("data-schema", "organization");
    s.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "Pet Cost & Vet Bill Calculator",
      "url": "https://yourpetbill.com/",
      "logo": "https://yourpetbill.com/assets/og-image.png",
      "sameAs": [],
      "description": "Calculator-first, source-backed cost estimates for U.S. dog and cat owners. Independent of insurance carriers and retailers.",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Editorial",
        "url": "https://yourpetbill.com/contact/"
      }
    });
    document.head.appendChild(s);
  })();

  document.addEventListener("DOMContentLoaded", function () {
    var h = document.getElementById("site-header");
    if (h) h.outerHTML = HEADER;
    var f = document.getElementById("site-footer");
    if (f) f.outerHTML = FOOTER;
    var y = document.getElementById("yr");
    if (y) y.textContent = new Date().getFullYear();

    /* Nav toggle */
    var tog = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");
    if (tog && nav) tog.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      tog.setAttribute("aria-expanded", open ? "true" : "false");
    });

    /* Last-updated stamp under H1 — only inject if no static stamp already exists */
    var path = window.location.pathname;
    var isLegal = /\/(privacy|terms|affiliate-disclosure|contact|about|sources)\//.test(path);
    if (!isLegal) {
      var h1 = document.querySelector("main h1");
      if (h1 && !document.querySelector(".last-updated-stamp") && !document.querySelector(".last-updated-static")) {
        var s = document.createElement("p");
        s.className = "last-updated-stamp";
        s.innerHTML = 'Last updated: <strong>May 2026</strong> · ' +
                      '<a href="/about/">Methodology</a> · ' +
                      '<a href="/sources/">Sources</a>';
        h1.parentNode.insertBefore(s, h1.nextSibling);
      }
    }

    /* Skip-to-content link */
    if (!document.querySelector(".skip-link")) {
      var skip = document.createElement("a");
      skip.className = "skip-link";
      skip.href = "#main";
      skip.textContent = "Skip to main content";
      document.body.insertBefore(skip, document.body.firstChild);
    }
    var main = document.querySelector("main");
    if (main && !main.id) main.id = "main";

    /* Trust badges row above every calculator */
    document.querySelectorAll("[data-calculator]").forEach(function (node) {
      if (node.previousElementSibling && node.previousElementSibling.classList.contains("trust-badges")) return;
      var row = document.createElement("div");
      row.className = "trust-badges";
      row.innerHTML =
        '<span class="trust-badge">No email required</span>' +
        '<span class="trust-badge">Runs in your browser</span>' +
        '<span class="trust-badge">Source-backed ranges</span>' +
        '<span class="trust-badge">Updated 2026</span>';
      node.parentNode.insertBefore(row, node);
    });

    /* Searchable filter on hub pages */
    var hubPaths = ["/guides/", "/breeds/", "/states/", "/vet-costs/"];
    if (hubPaths.indexOf(path) >= 0) {
      var firstGrid = document.querySelector("main .grid.grid-3, main .grid.grid-4");
      if (firstGrid && !document.querySelector(".hub-search")) {
        var wrap = document.createElement("div");
        wrap.className = "hub-search";
        wrap.innerHTML = '<input type="search" placeholder="Search this hub…" aria-label="Filter cards" autocomplete="off" />';
        firstGrid.parentNode.insertBefore(wrap, firstGrid);
        var input = wrap.querySelector("input");
        var cards = document.querySelectorAll("main a.card-link");
        input.addEventListener("input", function () {
          var q = input.value.trim().toLowerCase();
          cards.forEach(function (c) {
            var hit = q === "" || c.textContent.toLowerCase().indexOf(q) >= 0;
            c.classList.toggle("hub-card-hidden", !hit);
          });
        });
      }
    }

    /* Auto-render a breed hero image if one is configured + image file exists */
    function renderBreedHero() {
      document.querySelectorAll("[data-calculator='dog'][data-breed], [data-calculator='cat'][data-breed]").forEach(function (node) {
        var slug = node.getAttribute("data-breed");
        var DD = window.PETCOST_DATA || {};
        var img = (DD.breedImages || {})[slug];
        if (!img || !img.src) return;
        if (node.previousElementSibling && node.previousElementSibling.classList.contains("breed-hero-image")) return;
        // Skip if a static hero is already on the page (added directly in the HTML)
        if (document.querySelector(".breed-hero-static")) return;
        var w = document.createElement("figure");
        w.className = "breed-hero-image";
        var i = document.createElement("img");
        i.src = img.src;
        i.alt = img.alt || (slug.replace(/-/g, " ") + " photo");
        i.loading = "lazy";
        i.decoding = "async";
        i.width = img.width || 1200;
        i.height = img.height || 700;
        w.appendChild(i);

        /* Attribution — credit photographer, link to source, link license. Always shown. */
        var cap = document.createElement("figcaption");
        var parts = [];
        if (img.credit) {
          var creditHtml = img.creditUrl
            ? '<a href="' + img.creditUrl + '" rel="noopener nofollow" target="_blank">' + img.credit + '</a>'
            : img.credit;
          parts.push("Photo: " + creditHtml);
        }
        if (img.license) {
          var licHtml = img.licenseUrl
            ? '<a href="' + img.licenseUrl + '" rel="noopener nofollow" target="_blank">' + img.license + '</a>'
            : img.license;
          parts.push(licHtml);
        }
        if (parts.length) {
          cap.innerHTML = parts.join(" · ");
          w.appendChild(cap);
        }
        node.parentNode.insertBefore(w, node);
      });
    }
    /* Wait for CSV-loaded breedImages before rendering hero */
    if (window.PETCOST_DATA && typeof window.PETCOST_DATA.ready === "function") {
      window.PETCOST_DATA.ready().then(renderBreedHero).catch(renderBreedHero);
    } else {
      renderBreedHero();
    }



    /* Render an inline gallery of additional breed photos.
       Styles applied INLINE on each element so external CSS can't override. */
    function renderBreedGallery() {
      var node = document.querySelector("[data-calculator][data-breed]");
      if (!node) return;
      var breedCostPath = window.location.pathname.replace(/\/$/, "");
      if (!/\/breeds\/[^/]+-cost$/.test(breedCostPath)) return;
      var attribUrl = breedCostPath + "/gallery/attribution.json";
      fetch(attribUrl).then(function (r) {
        if (!r.ok) return null;
        return r.json();
      }).then(function (data) {
        if (!data || !data.files || !data.files.length) return;
        if (document.querySelector(".breed-gallery")) return;

        var section = document.createElement("section");
        section.className = "breed-gallery";
        section.style.cssText = "padding:24px 0 32px;background:#FBF6E8;border-top:1px solid #E8DFC7;margin-top:32px;";

        var container = document.createElement("div");
        container.className = "container";
        section.appendChild(container);

        var h2 = document.createElement("h2");
        h2.textContent = "More photos of the " + (data.breed || "breed").replace(/-/g, " ");
        h2.style.cssText = "font-size:1.5rem;font-weight:700;margin:0 0 16px;color:#1F2937;";
        container.appendChild(h2);

        var grid = document.createElement("div");
        grid.className = "breed-gallery-grid";
        grid.style.cssText = "display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;";
        container.appendChild(grid);

        data.files.forEach(function (f) {
          var fig = document.createElement("figure");
          fig.className = "breed-gallery-item";
          fig.style.cssText = "margin:0;background:#fff;border:1px solid #E8DFC7;border-radius:12px;overflow:hidden;aspect-ratio:1/1;position:relative;";

          var img = document.createElement("img");
          img.src = breedCostPath + "/gallery/" + f.file;
          img.alt = f.description || ((data.breed || "breed").replace(/-/g, " ") + " gallery photo");
          img.loading = "lazy";
          img.decoding = "async";
          img.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;border-radius:0;";
          fig.appendChild(img);

          if (f.source || f.artist || f.license) {
            var cap = document.createElement("figcaption");
            cap.style.cssText = "position:absolute;bottom:0;left:0;right:0;padding:6px 10px;background:linear-gradient(transparent,rgba(0,0,0,0.55));color:#fff;font-size:11px;line-height:1.4;";
            cap.textContent = f.source || (f.artist || "Source");
            fig.appendChild(cap);
          }

          grid.appendChild(fig);
        });

        var main = document.querySelector("main");
        if (main) main.appendChild(section);
      }).catch(function () { /* gallery is optional */ });
    }
    renderBreedGallery();

    /* Affiliate microcopy near every CTA in an affiliate block (FTC) — only if no static disclosure exists */
    document.querySelectorAll(".affiliate").forEach(function (block) {
      if (block.querySelector(".affiliate-microcopy") || block.querySelector(".affiliate-disclosure-inline")) return;
      var cta = block.querySelector(".btn");
      if (!cta) return;
      var micro = document.createElement("span");
      micro.className = "affiliate-microcopy";
      micro.textContent = "Affiliate partner — we may earn a commission, at no extra cost to you. ";
      var link = document.createElement("a");
      link.href = "/affiliate-disclosure/";
      link.textContent = "Learn more.";
      link.style.cssText = "color:rgba(255,255,255,0.85);text-decoration:underline;";
      micro.appendChild(link);
      cta.parentNode.appendChild(micro);