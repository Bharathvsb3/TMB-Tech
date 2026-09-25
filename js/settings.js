/* ==========================================================================
   TMB Tech: settings loader.

   Reads settings.json (the one place for company name, contact details,
   links and the site address) and:
     1. replaces {{tokens}} in the page, in text and in attributes, with the
        values from settings.json, e.g. {{company.contact.email}};
     2. builds the structured data (JSON-LD) Google reads;
     3. exposes window.TMB for scripts that need a value (contact forms).

   Loaded from <head>. It hides the page for a moment (until the settings
   are in) so raw {{tokens}} are never seen. If settings.json cannot be
   loaded the page is shown anyway after 3.5 seconds.

   Token syntax:  {{path.to.value}}   or   {{path.to.value|digits}}
     digits  = keep only 0-9 and a leading +   (for tel: links)
   Extra values: {{year}}, {{company.copyrightYears}}, {{products.<key>.url}},
                 {{products.<key>.playStore.url}} (empty until the app is live)

   Show / hide:   data-tmb-if="path"   shows the element only if that value in
                  settings.json is true / non-empty (e.g. the Google Play badge
                  or a "free trial" line that appears once you switch it on).
   Free trial:    data-trial-request="<product>"   on a link or button scrolls to
                  the contact form and fills in that product's trial message.

   To load settings.json from another address (a product hosted on its own
   domain), add  data-settings="https://.../settings.json"  to the script tag.
   ========================================================================== */
(function () {
  "use strict";

  var script = document.currentScript;
  var root = document.documentElement;
  var settingsUrl =
    (script && script.getAttribute("data-settings")) ||
    new URL("../settings.json", script.src).href;

  // Smoothness helper (js/perf.js): a browser that was found to scroll badly
  // starts in "lite" mode straight away; the detector script loads beside this one.
  try { if (localStorage.getItem("tmb-lite") === "1") root.classList.add("lite"); } catch (e) { /* ignore */ }
  var perf = document.createElement("script");
  perf.src = new URL("perf.js", script.src).href;
  perf.async = true;
  (document.head || root).appendChild(perf);

  // Hide the page until the tokens are filled in.
  root.classList.add("tmb-pending");
  var hide = document.createElement("style");
  hide.textContent =
    ".tmb-pending body{opacity:0}" +
    "html.tmb-pending{scroll-behavior:auto!important}" +
    // shown only once settings.json says so, so the layout is the same before and after loading
    "[data-tmb-if]:not([data-tmb-on]){display:none!important}";
  (document.head || root).appendChild(hide);
  var reveal = function () { root.classList.remove("tmb-pending"); };
  var failsafe = setTimeout(reveal, 3500);

  var TMB = (window.TMB = { settings: null, ready: null, get: null, mailto: null });

  /* ---------------- helpers ---------------- */
  function lookup(obj, path) {
    var parts = path.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (obj == null || typeof obj !== "object") return undefined;
      obj = obj[parts[i]];
    }
    return obj;
  }

  var FILTERS = {
    digits: function (v) { return String(v).replace(/[^\d+]/g, ""); }
  };

  var TOKEN = /\{\{\s*([A-Za-z0-9_.\-]+)((?:\|[a-z]+)*)\s*\}\}/g;

  function fill(text, settings) {
    return text.replace(TOKEN, function (whole, path, filters) {
      var value = lookup(settings, path);
      if (value === undefined || value === null || typeof value === "object") {
        if (settings.site && window.console) console.warn("settings.json has no value for {{" + path + "}}");
        return "";
      }
      value = String(value);
      if (filters) {
        filters.split("|").forEach(function (name) {
          if (name && FILTERS[name]) value = FILTERS[name](value);
        });
      }
      return value;
    });
  }

  /* Values that are worked out rather than typed in. Same rules as tools/render.py. */
  function normalize(s) {
    var year = new Date().getFullYear();
    s.year = String(year);

    var base = (s.site && s.site.baseUrl) || "";
    if (base && base.slice(-1) !== "/") base += "/";
    s.site.baseUrl = base;

    var start = s.company && s.company.copyrightStartYear;
    s.company.copyrightYears = start && start < year ? start + "–" + year : String(start || year);

    Object.keys(s.products || {}).forEach(function (key) {
      if (key.charAt(0) === "_") return;
      var p = s.products[key];
      var url = p.url || base + p.path;
      if (url.slice(-1) !== "/") url += "/";
      p.url = url;

      // Google Play link: only once the listing is public ("live": true).
      var listing = lookup(s, "stores.googlePlay.listingUrl") || "";
      var ps = (p.playStore = p.playStore || {});
      ps.url = ps.live && ps.packageId ? listing + ps.packageId : "";
      ps.showSoon = !!ps.comingSoon && !ps.live;
      ps.soonLabel = ps.soonText || lookup(s, "stores.googlePlay.soonText") || "";
      p.trial = p.trial || {};
    });

    // Text inside settings.json may itself use tokens, e.g. "{{company.name}} builds ..."
    resolveDeep(s, s);
    return s;
  }

  function resolveDeep(node, root) {
    Object.keys(node).forEach(function (key) {
      if (key.charAt(0) === "_") return; // notes for humans
      var v = node[key];
      if (typeof v === "string" && v.indexOf("{{") !== -1) node[key] = fill(v, root);
      else if (v && typeof v === "object" && key !== "pages") resolveDeep(v, root);
    });
  }

  function absolute(s, path) {
    return /^https?:\/\//.test(path) ? path : s.site.baseUrl + path;
  }

  /* ---------------- structured data ---------------- */
  function organization(s) {
    var c = s.company;
    return {
      "@type": "Organization",
      name: c.name,
      url: s.site.baseUrl,
      logo: absolute(s, s.site.logo),
      image: absolute(s, s.site.logo),
      email: c.contact.email,
      telephone: c.contact.phone,
      founder: { "@type": "Person", name: c.founder.name },
      sameAs: [c.social.github.url, c.social.linkedin.url],
      description: c.description
    };
  }

  function application(s, p, position, brief) {
    var app = {
      "@type": "SoftwareApplication",
      name: p.name,
      description: brief ? p.shortDescription : p.description,
      applicationCategory: p.applicationCategory,
      operatingSystem: p.operatingSystem,
      image: absolute(s, p.logo),
      url: p.url,
      author: {
        "@type": "Organization",
        name: s.company.name,
        url: s.site.baseUrl,
        email: s.company.contact.email,
        telephone: s.company.contact.phone,
        founder: { "@type": "Person", name: s.company.founder.name }
      }
    };
    if (p.playStore && p.playStore.url) app.installUrl = p.playStore.url;
    if (!brief) {
      if (p.alternateName) app.alternateName = p.alternateName;
      if (p.inLanguage) app.inLanguage = p.inLanguage;
      if (p.screenshot) app.screenshot = absolute(s, p.screenshot);
    }
    return app;
  }

  function structuredData(s, page) {
    var ctx = "https://schema.org";
    var out = [];
    if (page === "home") {
      out.push({
        "@context": ctx, "@type": "WebSite", name: s.company.name, url: s.site.baseUrl,
        inLanguage: s.site.language,
        publisher: { "@type": "Organization", name: s.company.name, logo: absolute(s, s.site.logo) }
      });
      var org = organization(s); org["@context"] = ctx; out.push(org);
      var keys = Object.keys(s.products).filter(function (k) { return k.charAt(0) !== "_"; });
      out.push({
        "@context": ctx, "@type": "ItemList",
        itemListElement: keys.map(function (k, i) {
          return { "@type": "ListItem", position: i + 1, item: application(s, s.products[k], 0, true) };
        })
      });
    } else if (s.products && s.products[page]) {
      var p = s.products[page];
      var app = application(s, p, 0, false); app["@context"] = ctx; out.push(app);
      out.push({
        "@context": ctx, "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: s.company.name, item: s.site.baseUrl },
          { "@type": "ListItem", position: 2, name: "Products", item: s.site.baseUrl + "#products" },
          { "@type": "ListItem", position: 3, name: p.name, item: p.url }
        ]
      });
    }
    return out;
  }

  function injectStructuredData(s) {
    var page = root.getAttribute("data-page");
    if (!page) return;
    structuredData(s, page).forEach(function (obj) {
      var tag = document.createElement("script");
      tag.type = "application/ld+json";
      tag.textContent = JSON.stringify(obj);
      document.head.appendChild(tag);
    });
  }

  /* ---------------- fill the page ---------------- */
  // s = the settings; pass null when they could not be loaded, and the
  // tokens are simply removed so no raw {{braces}} ever show on the page.
  function fillPage(s) {
    // text
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) {
      var tag = n.parentNode && n.parentNode.nodeName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") continue;
      if (n.nodeValue.indexOf("{{") !== -1) nodes.push(n);
    }
    nodes.forEach(function (node) { node.nodeValue = fill(node.nodeValue, s || {}); });

    // show / hide: data-tmb-if="products.jb-one.playStore.url"
    var conditional = document.querySelectorAll("[data-tmb-if]");
    for (var c = 0; c < conditional.length; c++) {
      var flag = s ? lookup(s, conditional[c].getAttribute("data-tmb-if")) : null;
      var on = flag === true || (typeof flag === "number" && flag !== 0) ||
        (typeof flag === "string" && flag !== "" && flag !== "false");
      if (on) { conditional[c].setAttribute("data-tmb-on", ""); conditional[c].removeAttribute("data-tmb-hidden"); }
      else { conditional[c].removeAttribute("data-tmb-on"); conditional[c].setAttribute("data-tmb-hidden", ""); }
    }

    // attributes (href, alt, aria-label, title, content ...)
    var all = document.body.getElementsByTagName("*");
    for (var i = 0; i < all.length; i++) {
      var el = all[i];
      if (el.nodeName === "SCRIPT" || el.nodeName === "STYLE") continue;
      var attrs = el.attributes;
      for (var j = 0; j < attrs.length; j++) {
        if (attrs[j].value.indexOf("{{") !== -1) el.setAttribute(attrs[j].name, fill(attrs[j].value, s || {}));
      }
    }
  }

  /* ---------------- free-trial buttons ---------------- */
  // <a href="#contact" data-trial-request="jb-one">: scroll to the contact
  // form and write that product's trial message into it. Without JavaScript
  // the link still just jumps to #contact.
  function bindTrialRequests(s) {
    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest && e.target.closest("[data-trial-request]");
      if (!trigger) return;
      var product = s.products[trigger.getAttribute("data-trial-request")];
      var form = document.querySelector("#contact-form, #contactForm");
      if (!product || !form) return;
      e.preventDefault();
      var box = form.querySelector("textarea");
      if (box) {
        box.value = (product.trial && product.trial.message) || "";
        box.dispatchEvent(new Event("input", { bubbles: true }));
      }
      // the form scripts use this as the email subject; it lasts only while the
      // message is still the trial message (change it and it is a normal enquiry)
      form.setAttribute("data-intent", (s.trial && s.trial.intent) || "Free trial request");
      if (box && !box.__trialWatch) {
        box.__trialWatch = true;
        box.addEventListener("input", function () {
          if (box.value !== box.__trialMessage) form.removeAttribute("data-intent");
        });
      }
      if (box) box.__trialMessage = box.value;
      form.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" });
      var first = form.querySelector("input");
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 450);
    });
  }

  /* ---------------- start ---------------- */
  var domReady = new Promise(function (resolve) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", resolve);
    else resolve();
  });

  var loaded = fetch(settingsUrl, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) throw new Error("settings.json returned " + r.status);
      return r.text();
    })
    .then(function (text) {
      try {
        return JSON.parse(text);
      } catch (e) {
        throw new Error("settings.json is not valid JSON: " + e.message);
      }
    })
    .then(normalize);

  TMB.ready = Promise.all([loaded, domReady])
    .then(function (results) {
      var s = results[0];
      TMB.settings = s;
      TMB.get = function (path) { return lookup(s, path); };
      TMB.mailto = function (subject, body) {
        return "mailto:" + s.company.contact.email +
          "?subject=" + encodeURIComponent(subject) +
          "&body=" + encodeURIComponent(body);
      };
      fillPage(s);
      injectStructuredData(s);
      bindTrialRequests(s);
      clearTimeout(failsafe);
      reveal();
      // filling the tokens changes the layout a little: go to #section again
      if (location.hash.length > 1) {
        var target = null;
        try { target = document.querySelector(location.hash); } catch (e) { /* not a selector */ }
        if (target) target.scrollIntoView({ behavior: "auto" });
      }
      document.dispatchEvent(new CustomEvent("tmb:ready", { detail: s }));
      return s;
    })
    .catch(function (err) {
      if (window.console) console.error("[settings] " + err.message);
      // Show the page without the values rather than with raw {{tokens}}.
      return domReady.then(function () {
        fillPage(null);
        // links that lost their address would just reload the page: hide them
        document.querySelectorAll('a[href=""], a[href="mailto:"], a[href="tel:"]').forEach(function (a) {
          a.setAttribute("data-tmb-hidden", "");
          a.style.display = "none";
        });
        clearTimeout(failsafe);
        reveal();
      });
    });
})();
