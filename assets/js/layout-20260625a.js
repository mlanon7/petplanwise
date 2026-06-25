/* =============================================================
   Shared header + footer injection.

   GA4 ANALYTICS SETUP (one-time, ~30 seconds):
     1. In Google Analytics, create a "Web" property and copy the
        Measurement ID (format: G-XXXXXXXXXX)
     2. Replace the empty string on the next line with that ID
     3. Push the change — tracking starts immediately for new visitors
        who Accept on the cookie banner

   Until you set an ID below, NO tracking script loads (verified
   in loadGA4() further down). The consent banner won't appear
   either, since there's nothing to consent to.
   ============================================================= */
window.YPB_GA4_ID = window.YPB_GA4_ID || "G-SDLMQMD34D"; // PetPlanWise Web stream
window.YPB_AHREFS_KEY = window.YPB_AHREFS_KEY || "wY6hk1lMVpXnaKH97NnNgg"; // Ahrefs Web Analytics (cookieless, GDPR-safe)

(function () {
  "use strict";

  var HEADER = '\n  <header class="site-header">\n' +
    '    <div class="container">\n' +
    '      <a href="/" class="brand" aria-label="PetPlanWise.com home">\n' +
    '        <img src="/logo/petplanwise-logo.png?v=20260515m" alt="PetPlanWise — smart planning for a lifetime of care" class="brand-logo" width="157" height="58" />\n' +
    '      </a>\n' +
    '      <button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false">\n' +
    '        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>\n' +
    '      </button>\n' +
    '      <nav class="nav" aria-label="Primary">\n' +
    '        <div class="nav-item nav-has-dropdown">\n' +
    '          <button type="button" class="nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true" data-nav-section="calculators">\n' +
    '            <svg class="nav-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>\n' +
    '            Calculators\n' +
    '            <svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>\n' +
    '          </button>\n' +
    '          <div class="nav-dropdown" role="menu">\n' +
    '            <a href="/pet-cost-simulator/" role="menuitem"><span class="nav-dd-title">Pet Cost Simulator</span><span class="nav-dd-sub">The full range — 10,000 lifetimes</span></a>\n' +
    '            <a href="/dog-cost-calculator/" role="menuitem"><span class="nav-dd-title">Dog Cost</span><span class="nav-dd-sub">Monthly · annual · lifetime</span></a>\n' +
    '            <a href="/cat-cost-calculator/" role="menuitem"><span class="nav-dd-title">Cat Cost</span><span class="nav-dd-sub">Monthly · annual · lifetime</span></a>\n' +
    '            <a href="/vet-bill-calculator/" role="menuitem"><span class="nav-dd-title">Vet Bill Builder</span><span class="nav-dd-sub">Line-item procedure costs</span></a>\n' +
    '            <a href="/emergency-vet-cost-calculator/" role="menuitem"><span class="nav-dd-title">Emergency Vet</span><span class="nav-dd-sub">ER scenario ranges</span></a>\n' +
    '            <a href="/pet-insurance-vs-savings/" role="menuitem"><span class="nav-dd-title">Insurance vs Savings</span><span class="nav-dd-sub">Break-even calculator</span></a>\n' +
    '            <div class="nav-dd-divider" role="separator" aria-hidden="true"></div>\n' +
    '            <a href="/states/" role="menuitem" data-nav-section="states"><span class="nav-dd-title">By State</span><span class="nav-dd-sub">25 state-prefilled calculators</span></a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <div class="nav-item nav-has-dropdown">\n' +
    '          <button type="button" class="nav-dropdown-toggle" aria-expanded="false" aria-haspopup="true" data-nav-section="breeds">\n' +
    '            <svg class="nav-ico" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><circle cx="6" cy="9" r="2.4"/><circle cx="18" cy="9" r="2.4"/><circle cx="9" cy="5" r="2"/><circle cx="15" cy="5" r="2"/><path d="M6.8 16.5c0-3.4 2.3-5.5 5.2-5.5s5.2 2.1 5.2 5.5c0 3-2.3 4.5-5.2 4.5s-5.2-1.5-5.2-4.5z"/></svg>\n' +
    '            Breeds\n' +
    '            <svg class="chev" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>\n' +
    '          </button>\n' +
    '          <div class="nav-dropdown" role="menu">\n' +
    '            <a href="/breeds/" role="menuitem"><span class="nav-dd-title">All Breeds</span><span class="nav-dd-sub">71 dogs &amp; cats · photos · traits · costs</span></a>\n' +
    '            <a href="/breeds/labrador-retriever-cost/" role="menuitem"><span class="nav-dd-title">Labrador Retriever</span><span class="nav-dd-sub">Most popular U.S. dog</span></a>\n' +
    '            <a href="/breeds/french-bulldog-cost/" role="menuitem"><span class="nav-dd-title">French Bulldog</span><span class="nav-dd-sub">Currently #1 per AKC</span></a>\n' +
    '            <a href="/breeds/maine-coon-cat-cost/" role="menuitem"><span class="nav-dd-title">Maine Coon</span><span class="nav-dd-sub">Most popular U.S. cat</span></a>\n' +
    '            <a href="/compare/" role="menuitem"><span class="nav-dd-title">Compare two breeds</span><span class="nav-dd-sub">Side-by-side trait bars</span></a>\n' +
    '          </div>\n' +
    '        </div>\n' +
    '        <a href="/find-my-breed/" data-nav-section="find-my-breed">\n' +
    '          <svg class="nav-ico" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true"><path d="M12 2.5l1.9 5.6 5.6 1.9-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9L12 2.5z"/><circle cx="19" cy="19" r="2"/><circle cx="5" cy="19" r="1.5"/></svg>\n' +
    '          Find My Breed\n' +
    '        </a>\n' +
    '        <a href="/compare/" data-nav-section="compare">\n' +
    '          <svg class="nav-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>\n' +
    '          Compare\n' +
    '        </a>\n' +
    '        <a href="/guides/" data-nav-section="guides">\n' +
    '          <svg class="nav-ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>\n' +
    '          Guides\n' +
    '        </a>\n' +
    '        <a href="/pet-insurance-vs-savings/" class="nav-cta" data-nav-section="insurance">\n' +
    '          <svg class="nav-ico" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>\n' +
    '          Insurance vs. savings\n' +
    '        </a>\n' +
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
    '          <a href="/find-my-breed/">Find My Breed</a>\n' +
    '          <a href="/compare/">Compare Breeds</a>\n' +
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
    '          <a href="#" data-ppw-cookie-prefs>Cookie preferences</a>\n' +
    '        </div>\n' +
    '      </div>\n' +
    '      <div class="footer-bottom">\n' +
    '        <span>© <span id="yr"></span> PetPlanWise.com. Educational estimates only — not veterinary or financial advice.</span>\n' +
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
      "name": "PetPlanWise.com",
      "url": "https://petplanwise.com/",
      "logo": "https://petplanwise.com/assets/og-image.png",
      "sameAs": [],
      "description": "Calculator-first, source-backed cost estimates for U.S. dog and cat owners. Independent of insurance carriers and retailers.",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "Editorial",
        "url": "https://petplanwise.com/contact/"
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

    /* Nav toggle (mobile hamburger) — slide-in panel with backdrop, scroll-lock */
    var tog = document.querySelector(".nav-toggle");
    var nav = document.querySelector(".nav");
    if (tog && nav) {
      /* Insert backdrop element once (no need to ship it in markup) */
      var backdrop = document.createElement("div");
      backdrop.className = "nav-backdrop";
      backdrop.setAttribute("aria-hidden", "true");
      document.body.appendChild(backdrop);

      /* Insert a close (X) button at the top of the menu panel */
      var closeBtn = document.createElement("button");
      closeBtn.type = "button";
      closeBtn.className = "nav-close";
      closeBtn.setAttribute("aria-label", "Close menu");
      closeBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>';
      nav.insertBefore(closeBtn, nav.firstChild);

      /* Remember the nav's original parent so we can put it back on close.
         The header has backdrop-filter which creates a stacking context
         that traps z-index — moving the nav to body (root context) lets
         the panel + backdrop layer correctly. */
      var navOriginalParent = nav.parentNode;
      var navOriginalNextSibling = nav.nextSibling;

      function openMobileNav() {
        /* Lift the panel out of the header's stacking context so the
           backdrop doesn't end up on top of the nav */
        if (nav.parentNode !== document.body) document.body.appendChild(nav);
        /* Force-reflow before adding .open so the transform transition plays */
        void nav.offsetWidth;
        nav.classList.add("open");
        backdrop.classList.add("is-active");
        document.body.classList.add("nav-locked");
        tog.setAttribute("aria-expanded", "true");
      }
      function closeMobileNav() {
        nav.classList.remove("open");
        backdrop.classList.remove("is-active");
        document.body.classList.remove("nav-locked");
        tog.setAttribute("aria-expanded", "false");
        /* Also collapse any expanded dropdowns inside the panel so the
           next open starts clean */
        nav.querySelectorAll(".nav-has-dropdown.open").forEach(function (item) {
          item.classList.remove("open");
          var t = item.querySelector(".nav-dropdown-toggle");
          if (t) t.setAttribute("aria-expanded", "false");
        });
        /* Restore the nav to its original DOM location AFTER the slide-out
           transition completes (250ms), so the close animation is visible.
           Guarded against rapid re-open: if user toggled back open before
           the timeout, leave the nav in body. */
        setTimeout(function () {
          if (!nav.classList.contains("open") && nav.parentNode === document.body && navOriginalParent) {
            navOriginalParent.insertBefore(nav, navOriginalNextSibling);
          }
        }, 260);
      }

      tog.addEventListener("click", function () {
        if (nav.classList.contains("open")) closeMobileNav();
        else openMobileNav();
      });
      backdrop.addEventListener("click", closeMobileNav);
      closeBtn.addEventListener("click", closeMobileNav);
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape" && nav.classList.contains("open")) closeMobileNav();
      });

      /* If user taps a leaf link inside the menu, close it (so they don't
         have to back-out manually after navigating) */
      nav.addEventListener("click", function (e) {
        var a = e.target.closest && e.target.closest("a[href]");
        if (a && a.getAttribute("href") && a.getAttribute("href").indexOf("#") !== 0) {
          if (window.matchMedia && window.matchMedia("(max-width: 820px)").matches) {
            /* Allow the click to navigate, but close the panel */
            closeMobileNav();
          }
        }
      });

      /* If viewport grows back above 820px while menu is open, reset state +
         move nav back to header so desktop flex layout renders correctly. */
      window.addEventListener("resize", function () {
        if (window.innerWidth > 820) {
          if (nav.classList.contains("open")) closeMobileNav();
          if (nav.parentNode === document.body && navOriginalParent) {
            navOriginalParent.insertBefore(nav, navOriginalNextSibling);
          }
        }
      });
    }

    /* Dropdown submenus (Calculators, Breeds, ...) — click to open, click
       outside or Escape to close. Hover also opens on pointer-fine devices
       via CSS. Wires up every .nav-has-dropdown independently. */
    var allDropdowns = document.querySelectorAll(".nav-has-dropdown");
    var ddInstances = [];
    Array.prototype.forEach.call(allDropdowns, function (item) {
      var toggle = item.querySelector(".nav-dropdown-toggle");
      var menu = item.querySelector(".nav-dropdown");
      if (!toggle || !menu) return;
      function close() {
        item.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
      function open() {
        // Close any other open dropdown first.
        ddInstances.forEach(function (d) { if (d.item !== item) d.close(); });
        item.classList.add("open");
        toggle.setAttribute("aria-expanded", "true");
      }
      toggle.addEventListener("click", function (e) {
        e.stopPropagation();
        if (toggle.getAttribute("aria-expanded") === "true") close();
        else open();
      });
      toggle.addEventListener("keydown", function (e) {
        if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
          var first = menu.querySelector("a");
          if (first) first.focus();
        }
      });
      menu.addEventListener("keydown", function (e) {
        var items = menu.querySelectorAll("a");
        var idx = Array.prototype.indexOf.call(items, document.activeElement);
        if (e.key === "ArrowDown" && idx < items.length - 1) { e.preventDefault(); items[idx + 1].focus(); }
        else if (e.key === "ArrowUp" && idx > 0) { e.preventDefault(); items[idx - 1].focus(); }
        else if (e.key === "Escape") { e.preventDefault(); close(); toggle.focus(); }
      });
      ddInstances.push({ item: item, close: close });
    });
    if (ddInstances.length) {
      document.addEventListener("click", function (e) {
        ddInstances.forEach(function (d) {
          if (!d.item.contains(e.target)) d.close();
        });
      });
      document.addEventListener("keydown", function (e) {
        if (e.key === "Escape") ddInstances.forEach(function (d) { d.close(); });
      });
    }

    /* Active-section indicator: mark the nav item that matches the current URL. */
    (function () {
      var p = window.location.pathname;
      var section = null;
      if (/^\/compare\//.test(p)) section = "compare";
      else if (/^\/(dog-cost-calculator|cat-cost-calculator|vet-bill-calculator|emergency-vet-cost-calculator)\//.test(p)) section = "calculators";
      else if (/^\/find-my-breed\//.test(p)) section = "find-my-breed";
      else if (/^\/pet-insurance-vs-savings\//.test(p)) section = "insurance";
      else if (/^\/breeds\//.test(p)) section = "breeds";
      else if (/^\/states\//.test(p)) section = "states";
      else if (/^\/guides\//.test(p) || /^\/vet-costs\//.test(p)) section = "guides";
      if (!section) return;
      var marks = document.querySelectorAll('[data-nav-section="' + section + '"]');
      marks.forEach(function (m) { m.setAttribute("aria-current", "page"); });
    })();

    /* Last-updated stamp under H1 — only on guides + standalone calc pages */
    var path = window.location.pathname;
    var isGuide = /^\/guides\//.test(path);
    var isCalc = /^\/(dog-cost-calculator|cat-cost-calculator|vet-bill-calculator|emergency-vet-cost-calculator|pet-insurance-vs-savings)\//.test(path);
    if (isGuide || isCalc) {
      var h1 = document.querySelector("main h1");
      if (h1 && !document.querySelector(".last-updated-stamp") && !document.querySelector(".last-updated-static")) {
        var stamp = document.createElement("p");
        stamp.className = "last-updated-stamp";
        stamp.innerHTML = 'Last updated: <strong>May 2026</strong> · <a href="/about/">Methodology</a> · <a href="/sources/">Sources</a>';
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

    /* Searchable filter on hub pages.
       /breeds/ is excluded — it has its own search + species-filter UI. */
    var hubPaths = ["/guides/", "/states/", "/vet-costs/"];
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

    /* Auto-render a breed hero image if one is configured */
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

    /* Render an inline gallery of additional breed photos */
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

        var galleryItems = []; // collect for lightbox
        data.files.forEach(function (file, idx) {
          var fullSrc = breedCostPath + "/gallery/" + file.file;
          var altText = file.description || ((data.breed || "breed").replace(/-/g, " ") + " gallery photo");
          galleryItems.push({
            src: fullSrc,
            alt: altText,
            caption: file.description || "",
            credit: file.source || file.artist || ""
          });

          var btn = document.createElement("button");
          btn.type = "button";
          btn.className = "breed-gallery-item";
          btn.setAttribute("aria-label", "Open photo: " + altText);
          btn.setAttribute("data-gallery-index", String(idx));
          btn.style.cssText = "margin:0;padding:0;background:#fff;border:1px solid #E8DFC7;border-radius:12px;overflow:hidden;aspect-ratio:1/1;position:relative;cursor:zoom-in;display:block;width:100%;font:inherit;color:inherit;transition:transform 180ms cubic-bezier(.2,.8,.2,1),box-shadow 180ms cubic-bezier(.2,.8,.2,1),border-color 180ms cubic-bezier(.2,.8,.2,1);";
          var im = document.createElement("img");
          im.src = fullSrc;
          im.alt = altText;
          im.loading = "lazy";
          im.decoding = "async";
          im.style.cssText = "position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block;border-radius:0;transition:transform 220ms cubic-bezier(.2,.8,.2,1);";
          btn.appendChild(im);
          if (file.source || file.artist || file.license) {
            var cap2 = document.createElement("figcaption");
            cap2.style.cssText = "position:absolute;bottom:0;left:0;right:0;padding:6px 10px;background:linear-gradient(transparent,rgba(0,0,0,0.55));color:#fff;font-size:11px;line-height:1.4;text-align:left;pointer-events:none;";
            cap2.textContent = file.source || (file.artist || "Source");
            btn.appendChild(cap2);
          }
          btn.addEventListener("click", function () { openLightbox(galleryItems, idx); });
          grid.appendChild(btn);
        });

        var mn = document.querySelector("main");
        if (mn) mn.appendChild(section);
      }).catch(function () { /* gallery is optional */ });
    }
    renderBreedGallery();

    /* ---------- Lightbox ---------- */
    function openLightbox(items, startIdx) {
      var current = startIdx || 0;
      var overlay = document.createElement("div");
      overlay.className = "ppw-lightbox";
      overlay.setAttribute("role", "dialog");
      overlay.setAttribute("aria-modal", "true");
      overlay.setAttribute("aria-label", "Photo viewer");
      overlay.innerHTML =
        '<button type="button" class="ppw-lb-close" aria-label="Close (Esc)">&times;</button>' +
        '<button type="button" class="ppw-lb-prev" aria-label="Previous photo">&#8249;</button>' +
        '<button type="button" class="ppw-lb-next" aria-label="Next photo">&#8250;</button>' +
        '<figure class="ppw-lb-figure">' +
          '<img class="ppw-lb-img" alt="">' +
          '<figcaption class="ppw-lb-caption"></figcaption>' +
        '</figure>' +
        '<div class="ppw-lb-counter" aria-live="polite"></div>';

      var img = overlay.querySelector(".ppw-lb-img");
      var cap = overlay.querySelector(".ppw-lb-caption");
      var counter = overlay.querySelector(".ppw-lb-counter");
      var btnPrev = overlay.querySelector(".ppw-lb-prev");
      var btnNext = overlay.querySelector(".ppw-lb-next");
      var btnClose = overlay.querySelector(".ppw-lb-close");

      function render() {
        var it = items[current];
        img.src = it.src;
        img.alt = it.alt || "";
        var line = [];
        if (it.caption) line.push(it.caption);
        if (it.credit) line.push("Source: " + it.credit);
        cap.textContent = line.join(" · ");
        cap.style.display = line.length ? "block" : "none";
        counter.textContent = (current + 1) + " / " + items.length;
        btnPrev.style.visibility = items.length > 1 ? "visible" : "hidden";
        btnNext.style.visibility = items.length > 1 ? "visible" : "hidden";
      }
      function close() {
        document.removeEventListener("keydown", onKey);
        document.body.style.overflow = "";
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }
      function prev() { current = (current - 1 + items.length) % items.length; render(); }
      function next() { current = (current + 1) % items.length; render(); }
      function onKey(e) {
        if (e.key === "Escape") close();
        else if (e.key === "ArrowLeft") prev();
        else if (e.key === "ArrowRight") next();
      }

      btnClose.addEventListener("click", close);
      btnPrev.addEventListener("click", prev);
      btnNext.addEventListener("click", next);
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay || e.target === img.parentNode) close();
      });
      document.addEventListener("keydown", onKey);
      document.body.style.overflow = "hidden";
      document.body.appendChild(overlay);
      render();
      btnClose.focus();
    }

    /* Affiliate microcopy near every CTA */
    document.querySelectorAll(".affiliate").forEach(function (block) {
      if (block.querySelector(".affiliate-microcopy") || block.querySelector(".affiliate-disclosure-inline")) return;
      var cta = block.querySelector(".btn");
      if (!cta) return;
      var micro = document.createElement("span");
      micro.className = "affiliate-microcopy";
      micro.textContent = "Affiliate partner — we may earn a commission, at no extra cost to you. ";
      var lnk = document.createElement("a");
      lnk.href = "/affiliate-disclosure/";
      lnk.textContent = "Learn more.";
      lnk.style.cssText = "color:rgba(255,255,255,0.85);text-decoration:underline;";
      micro.appendChild(lnk);
      cta.parentNode.appendChild(micro);
    });

    /* Cross-cluster Related-pages section. Auto-injected on breed / state /
       procedure / calculator / guide pages with 4-6 contextual cross-cluster
       links. Single highest-ROI on-page SEO action for a new site. */
    function renderRelatedSection() {
      if (document.querySelector(".related-cluster")) return;
      var p = window.location.pathname;
      var isBreedPage = /^\/breeds\/[^/]+-cost\/?$/.test(p);
      var isBreedStatePage = /^\/breeds\/[^/]+-cost-in-[^/]+\/?$/.test(p);
      var isStatePage = /^\/states\/[^/]+-pet-cost\/?$/.test(p);
      var isCalcPage = /^\/(dog-cost-calculator|cat-cost-calculator|vet-bill-calculator|emergency-vet-cost-calculator|pet-insurance-vs-savings)\/?$/.test(p);
      var isGuidePage = /^\/guides\/[^/]+\/?$/.test(p);
      if (!isBreedPage && !isBreedStatePage && !isStatePage && !isCalcPage && !isGuidePage) return;

      var links = [];
      if (isBreedPage || isBreedStatePage) {
        links = [
          { href: "/pet-insurance-vs-savings/", text: "Should I get pet insurance? — interactive calculator" },
          { href: "/guides/dog-dental-cleaning-cost/", text: "Dog dental cleaning cost (procedure breakdown)" },
          { href: "/guides/emergency-vet-visit-cost/", text: "Emergency vet visit cost — what to expect" },
          { href: "/states/california-pet-cost/", text: "Pet costs by state: California" },
          { href: "/states/texas-pet-cost/", text: "Pet costs by state: Texas" },
          { href: "/vet-bill-calculator/", text: "Build a vet bill estimate (line-item)" }
        ];
      } else if (isStatePage) {
        links = [
          { href: "/breeds/labrador-retriever-cost/", text: "Labrador Retriever cost" },
          { href: "/breeds/french-bulldog-cost/", text: "French Bulldog cost (high-insurance-fit breed)" },
          { href: "/guides/emergency-vet-visit-cost/", text: "Emergency vet visit cost" },
          { href: "/guides/dog-spay-cost/", text: "Dog spay cost" },
          { href: "/pet-insurance-vs-savings/", text: "Insurance vs. savings — run the math" },
          { href: "/vet-bill-calculator/", text: "Build a vet bill estimate" }
        ];
      } else if (isCalcPage) {
        links = [
          { href: "/breeds/", text: "All breed cost pages" },
          { href: "/states/", text: "All state cost pages" },
          { href: "/guides/average-cost-of-owning-a-dog/", text: "Average cost of owning a dog" },
          { href: "/guides/average-cost-of-owning-a-cat/", text: "Average cost of owning a cat" },
          { href: "/guides/emergency-vet-visit-cost/", text: "Emergency vet visit cost" },
          { href: "/vet-costs/", text: "All veterinary procedure costs" }
        ];
      } else if (isGuidePage) {
        links = [
          { href: "/dog-cost-calculator/", text: "Dog cost calculator" },
          { href: "/cat-cost-calculator/", text: "Cat cost calculator" },
          { href: "/pet-insurance-vs-savings/", text: "Insurance vs. savings calculator" },
          { href: "/breeds/", text: "Browse pet by breed" },
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
      var h2x = document.createElement("h2");
      h2x.textContent = "Related cost guides";
      h2x.style.cssText = "font-size:1.4rem;font-weight:700;margin:0 0 6px;color:#1F2937;";
      container.appendChild(h2x);
      var sub = document.createElement("p");
      sub.style.cssText = "font-size:14px;color:#6B7280;margin:0 0 18px;";
      sub.textContent = "Continue planning your pet budget with these related calculators and guides.";
      container.appendChild(sub);
      var ul = document.createElement("ul");
      ul.style.cssText = "list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px 24px;";
      links.forEach(function (lk) {
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
      var mn2 = document.querySelector("main");
      if (mn2) mn2.appendChild(section);
    }
    renderRelatedSection();

    /* ----------------------------------------------------------------
       Cookie consent banner (ePrivacy / GDPR / CCPA-friendly)
       - Default state: non-essential cookies BLOCKED.
       - GA4 only loads after consent === "granted".
       - "Decline" sets consent === "denied" and never loads GA4.
       - window.PPW_resetConsent() clears the choice (used by /privacy/).
       ---------------------------------------------------------------- */
    function getConsent() {
      try { return localStorage.getItem("ppw_consent") || ""; } catch (e) { return ""; }
    }
    function setConsent(v) {
      try { localStorage.setItem("ppw_consent", v); } catch (e) {}
    }
    window.PPW_resetConsent = function () {
      try { localStorage.removeItem("ppw_consent"); } catch (e) {}
      try {
        document.cookie.split(";").forEach(function (c) {
          var name = c.split("=")[0].trim();
          if (/^_ga|^_gid|^_gat/.test(name)) {
            document.cookie = name + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
          }
        });
      } catch (e) {}
      location.reload();
    };

    function loadGA4() {
      if (window.gtag || document.querySelector('script[data-ga4]')) return;
      var GA4_ID = window.YPB_GA4_ID || "";
      if (!GA4_ID || !/^G-/.test(GA4_ID)) return;
      var gaScript = document.createElement("script");
      gaScript.async = true;
      gaScript.src = "https://www.googletagmanager.com/gtag/js?id=" + GA4_ID;
      gaScript.setAttribute("data-ga4", "true");
      document.head.appendChild(gaScript);
      window.dataLayer = window.dataLayer || [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      window.gtag("js", new Date());
      window.gtag("config", GA4_ID, { anonymize_ip: true, allow_google_signals: false, allow_ad_personalization_signals: false });
    }

    /* Ahrefs Web Analytics — cookieless and GDPR-compliant, so it loads
       for ALL visitors without the consent gate (no cookies, no personal
       data). Independent of GA4. No-ops if the key is blank. */
    function loadAhrefs() {
      var KEY = window.YPB_AHREFS_KEY || "";
      if (!KEY) return;
      if (document.querySelector('script[data-ahrefs]')) return;
      var s = document.createElement("script");
      s.async = true;
      s.src = "https://analytics.ahrefs.com/analytics.js";
      s.setAttribute("data-key", KEY);
      s.setAttribute("data-ahrefs", "true");
      document.head.appendChild(s);
    }
    loadAhrefs();

    function renderBanner() {
      if (document.getElementById("ppw-cookie-banner")) return;
      var bar = document.createElement("div");
      bar.id = "ppw-cookie-banner";
      bar.setAttribute("role", "dialog");
      bar.setAttribute("aria-label", "Cookie preferences");
      bar.innerHTML = '<div class="ppw-cookie-inner">' +
        '<div class="ppw-cookie-msg">We use a single analytics cookie (Google Analytics 4, IP-anonymized) to understand which pages are useful. We do not sell or share personal information. ' +
        '<a href="/privacy/">Read our privacy policy</a>.</div>' +
        '<div class="ppw-cookie-actions">' +
          '<button type="button" class="btn-cookie btn-cookie-decline" data-ppw-consent="denied">Decline</button>' +
          '<button type="button" class="btn-cookie btn-cookie-accept" data-ppw-consent="granted">Accept</button>' +
        '</div></div>';
      document.body.appendChild(bar);
      bar.addEventListener("click", function (e) {
        var t = e.target;
        if (t && t.getAttribute && t.getAttribute("data-ppw-consent")) {
          var choice = t.getAttribute("data-ppw-consent");
          setConsent(choice);
          bar.parentNode.removeChild(bar);
          if (choice === "granted") loadGA4();
        }
      });
    }

    /* Only show the consent banner if there's actually a GA4 ID
       configured — otherwise there's nothing to consent to. */
    if (window.YPB_GA4_ID && /^G-/.test(window.YPB_GA4_ID)) {
      var c = getConsent();
      if (c === "granted") loadGA4();
      else if (c !== "denied") renderBanner();
    }

    /* Footer "Cookie preferences" link reopens the banner. */
    document.addEventListener("click", function (e) {
      var t = e.target;
      if (t && t.matches && (t.matches('[data-ppw-cookie-prefs]') || t.matches('[data-ppw-cookie-prefs] *'))) {
        e.preventDefault();
        try { localStorage.removeItem("ppw_consent"); } catch (er) {}
        renderBanner();
      }
    });
  });
})();
