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
   Extra values: {{year}}, {{company.copyrightYears}}, {{products.<key>.url}}

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

  // Hide the page until the tokens are filled in.
  root.classList.add("tmb-pending");
  var hide = document.createElement("style");
  hide.textContent = ".tmb-pending body{opacity:0}";
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

  function application(s, p, position) {
    var app = {
      "@type": "SoftwareApplication",
      name: p.name,
      description: position ? p.shortDescription : p.description,
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
    if (position) {
      app.position = position;
    } else {
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
        itemListElement: keys.map(function (k, i) { return application(s, s.products[k], i + 1); })
      });
    } else if (s.products && s.products[page]) {
      var p = s.products[page];
      var app = application(s, p, 0); app["@context"] = ctx; out.push(app);
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
      clearTimeout(failsafe);
      reveal();
      document.dispatchEvent(new CustomEvent("tmb:ready", { detail: s }));
      return s;
    })
    .catch(function (err) {
      if (window.console) console.error("[settings] " + err.message);
      // Show the page without the values rather than with raw {{tokens}}.
      return domReady.then(function () {
        fillPage(null);
        clearTimeout(failsafe);
        reveal();
      });
    });
})();
