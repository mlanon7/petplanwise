/* =============================================================
   Shared header + footer injection.
   ============================================================= */
(function () {
  "use strict";

  var HEADER = '\n  <header class="site-header">\n' +
    '    <div class="container">\n' +
    '      <a href="/" class="brand" aria-label="YourPetBill.com home">\n' +
    '        <img src="/logo/yourpetbill-lockup-horizontal.svg?v=20260510i" alt="YourPetBill.com" class="brand-logo" width="259" height="50" />\n' +
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
    '          <a href="/editorial-standards/">Editorial standards</a>\n' +
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
      "name": "YourPetBill.com",
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

    /* Last-updated stamp under H1 — only on long-form guides + standalone
       calculator pages, where freshness genuinely matters to a reader making
       a decision. Skip homepage, breeds, breed-state combos, states, hubs. */
    var path = window.location.pathname;
    var isGuide = /^\/guides\//.test(path);
    var isCalc = /^\/(dog-cost-calculator|cat-cost-calculator|vet-bill-calculator|emergency-vet-cost-calculator|pet-insurance-vs-savings)\//.test(path);
    if (isGuide || isCalc) {
      var h1 = document.querySelector("main h1");
      if (h1 && !document.querySelector(".last-updated-stamp") && !document.querySelector(".last-updated-static")) {
        var stamp = document.createElement("p");
        stamp.className = "last-updated-stamp";
        stamp.innerHTML = 'Last updated: <strong>May 2026</strong> · ' +
                          '<a href="/about/">Methodology</a> · ' +
                          '<a href="/sources/">Sources</a>';
        h1.parentNode.insertBefore(stamp, h1.nextSibling);
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

        data.files.forEach(function (file) {
          var fig = document.createElement("figure");
          fig.className = "breed-gallery-item";
          fig.style.cssText = "margin:0;background:#fff;border:1px solid #E8DFC7;border-radius:12px;overflow:hidden;aspect-ratio:1/1;position:relative;";

          var im = document.createElement("img");
          im.src = breedCostPath + "/gallery/" + file.file;
          im.alt = file.description || ((data.breed || "breed").replace(/-/g, " ") + " gallery photo");
          im.loading = "lazy";
          im.decoding = "async";
          im.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;border-radius:0;";
          fig.appendChild(im);

          if (file.source || file.artist || file.license) {
            var cap = document.createElement("figcaption");
            cap.style.cssText = "position:absolute;bottom:0;left:0;right:0;padding:6px 10px;background:linear-gradient(transparent,rgba(0,0,0,0.55));color:#fff;font-size:11px;line-height:1.4;";
            cap.textContent = file.source || (file.artist || "Source");
            fig.appendChild(cap);
          }

          grid.appendChild(fig);
        });

        var mn = document.querySelector("main");
        if (mn) mn.appendChild(section);
      }).catch(function () { /* gallery is optional */ });
    }
    renderBreedGallery();

    /* Affiliate microcopy near every CTA */
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
    });

    /* Cross-cluster Related-pages section.
       Auto-injected on breed / state / procedure / calculator pages with
       4-6 contextual cross-cluster links. Boosts internal link graph,
       which is the single highest-ROI on-page SEO action for a new site. */
    function renderRelatedSection() {
      if (document.querySelector(".related-cluster")) return;
      var p = window.location.pathname;
      var DD = window.PETCOST_DATA || {};

      // Heuristic: figure out what page type this is
      var isBreedPage = /^\/breeds\/[^/]+-cost\/?$/.test(p);
      var isBreedStatePage = /^\/breeds\/[^/]+-cost-in-[^/]+\/?$/.test(p);
      var isStatePage = /^\/states\/[^/]+-pet-cost\/?$/.test(p);
      var isCalcPage = /^\/(dog-cost-calculator|cat-cost-calculator|vet-bill-calculator|emergency-vet-cost-calculator|pet-insurance-vs-savings)\/?$/.test(p);
      var isGuidePage = /^\/guides\/[^/]+\/?$/.test(p);

      if (!isBreedPage && !isBreedStatePage && !isStatePage && !isCalcPage && !isGuidePage) return;

      // Build link list per page type
      var links = [];
      if (isBreedPage || isBreedStatePage) {
        // Breed → procedures + insurance + states
        links = [
          { href: "/pet-insurance-vs-savings/", text: "Should I get pet insurance? — interactive calculator" },
          { href: "/guides/dog-dental-cleaning-cost/", text: "Dog dental cleaning cost (procedure breakdown)" },
          { href: "/guides/emergency-vet-visit-cost/", text: "Emergency vet visit cost — what to expect" },
          { href: "/states/california-pet-cost/", text: "Pet costs by state: California" },
          { href: "/states/texas-pet-cost/", text: "Pet costs by state: Texas" },
          { href: "/vet-bill-calculator/", text: "Build a vet bill estimate (line-item)" }
        ];
      } else if (isStatePage) {
        // State → breeds + procedures + insurance
        links = [
          { href: "/breeds/labrador-retriever-cost/", text: "Labrador Retriever cost" },
          { href: "/breeds/french-bulldog-cost/", text: "French Bulldog cost (high-insurance-fit breed)" },
          { href: "/guides/emergency-vet-visit-cost/", text: "Emergency vet visit cost" },
          { href: "/guides/dog-spay-cost/", text: "Dog spay cost" },
          { href: "/pet-insurance-vs-savings/", text: "Insurance vs. savings — run the math" },
          { href: "/vet-bill-calculator/", text: "Build a vet bill estimate" }
        ];
      } else if (isCalcPage) {
        // Calculator → breed pages + guides + other calcs
        links = [
          { href: "/breeds/", text: "All breed cost pages" },
          { href: "/states/", text: "All state cost pages" },
          { href: "/guides/average-cost-of-owning-a-dog/", text: "Average cost of owning a dog (guide)" },
          { href: "/guides/average-cost-of-owning-a-cat/", text: "Average cost of owning a cat (guide)" },
          { href: "/guides/emergency-vet-visit-cost/", text: "Emergency vet visit cost" },
          { href: "/vet-costs/", text: "All veterinary procedure costs" }
        ];
      } else if (isGuidePage) {
        // Guide → calc + related guides + breeds
        links = [
          { href: "/dog-cost-calculator/", text: "Dog cost calculator" },
          { href: "/cat-cost-calculator/", text: "Cat cost calculator" },
          { href: "/pet-insurance-vs-savings/", text: "Insurance vs. savings calculator" },
          { href: "/breeds/", text: "Browse cost by breed" },
          { href: "/states/", text: "Browse cost by state" },
          { href: "/guides/", text: "All cost guides" }
        ];
      }
      if (!links.length) return;

      var section = document.createElement("section");
      section.className = "related-cluster";
      section.style.cssText = "padding:24px 0 32px;background:#FBF6E8;border-top:1px solid #E8DFC7;margin-top:32px;";

      var container = document.createElement("div");
      container.className = "container";
      section.appendChild(container);

      var h2 = document.createElement("h2");
      h2.textContent = "Related cost guides";
      h2.style.cssText = "font-size:1.4rem;font-weight:700;margin:0 0 6px;color:#1F2937;";
      container.appendChild(h2);

      var sub = document.createElement("p");
      sub.style.cssText = "font-size:14px;color:#6B7280;margin:0 0 18px;";
      sub.textContent = "Continue planning your pet budget with these related calculators and guides.";
      container.appendChild(sub);

      var ul = document.createElement("ul");
      ul.style.cssText = "list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px 24px;";
      links.forEach(function (lk) {
        // Skip self-links
        if (lk.href.replace(/\/$/, "") === p.replace(/\/$/, "")) return;
        var li = document.createElement("li");
        li.style.cssText = "padding:0;margin:0;";
        var a = document.createElement("a");
        a.href = lk.href;
        a.textContent = lk.text;
        a.style.cssText = "color:#0F766E;font-size:15px;line-height:1.5;text-decoration:none;border-bottom:1px solid transparent;transition:border-color .15s;";
        a.addEventListener("mouseover", function () { a.style.borderBottomColor = "#0F766E"; });
        a.addEventListener("mouseout", function () { a.style.borderBottomColor = "transparent"; });
        li.appendChild(a);
        ul.appendChild(li);
      });
      container.appendChild(ul);

      var mn = document.querySelector("main");
      if (mn) mn.appendChild(section);
    }
    renderRelatedSection();

    /* GA4 placeholder — swap MEASUREMENT_ID with your real ID when ready.
       Until then, gtag is a no-op that won't error or send data. */
    if (!window.gtag && !document.querySelector('script[data-ga4]')) {
      var GA4_ID = window.YPB_GA4_ID || "G-XXXXXXXXXX"; // Set window.YPB_GA4_ID = "G-..." before this loads to enable
      if (GA4_ID && GA4_ID !== "G-XXXXXXXXXX") {
        var gaScript = document.createElement("script");
        gaScript.async = true;
        gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
        gaScript.setAttribute("data-ga4", "true");
        document.head.appendChild(gaScript);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function () { window.dataLayer.push(arguments); };
        window.gtag("js", new Date());
        window.gtag("config", GA4_ID, { anonymize_ip: true });
      }
    }
  });
})();
