/* ==========================================================================
   TMB Tech product site template: header, nav, reveal, 3D parallax, card
   tilt, language flip and the mailto contact form. Vanilla JS, no deps.
   ========================================================================== */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;

  /* ---------- Scroll-linked UI (one rAF per frame) ---------- */
  var header = document.querySelector(".hdr");
  var progress = document.querySelector(".progress");
  var ticking = false;

  function onScrollFrame() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 10);
    if (progress) {
      var max = root.scrollHeight - root.clientHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? y / max : 0) + ")";
    }
    applyParallax();
    ticking = false;
  }
  function requestFrame() {
    if (!ticking) { ticking = true; window.requestAnimationFrame(onScrollFrame); }
  }
  window.addEventListener("scroll", requestFrame, { passive: true });
  window.addEventListener("resize", requestFrame);

  /* ---------- Mobile nav ---------- */
  var navBtn = document.querySelector(".nav-btn");
  var nav = document.querySelector(".nav");
  function closeNav() {
    document.body.classList.remove("nav-open");
    if (navBtn) navBtn.setAttribute("aria-expanded", "false");
  }
  if (navBtn && nav) {
    navBtn.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      navBtn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) { if (e.target.closest("a")) closeNav(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeNav(); });
  }

  /* ---------- Active nav link ---------- */
  var navLinks = nav ? Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]')) : [];
  if ("IntersectionObserver" in window && navLinks.length) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id);
        });
      });
    }, { rootMargin: "-45% 0px -50% 0px" });
    navLinks.forEach(function (a) {
      var target = document.querySelector(a.getAttribute("href"));
      if (target) sectionObserver.observe(target);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var siblings = el.parentElement ? el.parentElement.querySelectorAll(":scope > .reveal") : [];
        var index = Array.prototype.indexOf.call(siblings, el);
        el.style.transitionDelay = Math.max(0, index) * 70 + "ms";
        el.classList.add("in");
        revealObserver.unobserve(el);
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------- 3D stages + parallax ---------- */
  var stages = Array.prototype.slice.call(document.querySelectorAll("[data-stage]"));
  var depthEls = Array.prototype.slice.call(document.querySelectorAll("[data-depth]"));
  var pointer = { x: 0, y: 0 };

  function applyParallax() {
    if (reduce) return;
    var vh = window.innerHeight;
    var mobile = window.innerWidth <= 960;

    depthEls.forEach(function (el) {
      var depth = parseFloat(el.getAttribute("data-depth")) || 0;
      var r = el.getBoundingClientRect();
      var centre = (r.top + r.height / 2 - vh / 2) / vh;
      var scale = mobile ? 0.4 : 1;
      var ty = centre * depth * -120 * scale + pointer.y * depth * 30 * scale;
      var tx = pointer.x * depth * 40 * scale;
      el.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0)";
    });

    stages.forEach(function (stage) {
      var base = (stage.getAttribute("data-stage") || "-14,8").split(",");
      var by = parseFloat(base[0]), bx = parseFloat(base[1]);
      var r = stage.getBoundingClientRect();
      var progressY = Math.max(-1, Math.min(1, (r.top + r.height / 2 - vh / 2) / vh));
      if (mobile) {
        // Phones: the stage settles flat as it scrolls into the middle.
        stage.style.transform = "rotateX(" + (progressY * 18).toFixed(2) + "deg)";
      } else {
        var ry = by + pointer.x * 10;
        var rx = bx - pointer.y * 8 + progressY * 6;
        stage.style.transform = "rotateY(" + ry.toFixed(2) + "deg) rotateX(" + rx.toFixed(2) + "deg)";
      }
    });
  }

  if (!reduce) {
    if (finePointer) {
      window.addEventListener("pointermove", function (e) {
        pointer.x = e.clientX / window.innerWidth - 0.5;
        pointer.y = e.clientY / window.innerHeight - 0.5;
        requestFrame();
      }, { passive: true });
    }
    applyParallax();
  }

  /* ---------- Card tilt (fine pointers only) ---------- */
  if (finePointer && !reduce) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        card.style.transform = "perspective(900px) rotateX(" + (-py * 9).toFixed(2) + "deg) rotateY(" + (px * 11).toFixed(2) + "deg) translateY(-4px)";
      });
      card.addEventListener("pointerleave", function () { card.style.transform = ""; });
    });
  }

  /* ---------- Language flip (English / Tamil screen) ---------- */
  document.querySelectorAll("[data-flip]").forEach(function (group) {
    var flipper = document.getElementById(group.getAttribute("data-flip"));
    if (!flipper) return;
    group.querySelectorAll("button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        group.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", b === btn ? "true" : "false"); });
        flipper.classList.toggle("flipped", btn.getAttribute("data-side") === "back");
      });
    });
  });

  /* ---------- Contact form → visitor's mail app ---------- */
  var form = document.getElementById("contact-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var get = function (name) { return (form.elements[name] && form.elements[name].value || "").trim(); };
      var fields = { name: get("name"), email: get("email"), phone: get("phone"), message: get("message") };
      var ok = true;
      function setErr(name, msg) {
        var el = form.querySelector('[data-err="' + name + '"]');
        if (el) el.textContent = msg;
        if (msg) ok = false;
      }
      setErr("name", fields.name ? "" : "Please enter your name.");
      setErr("email", /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email) ? "" : "Please enter a valid email.");
      setErr("message", fields.message ? "" : "Please add a short message.");
      if (!ok) return;

      var product = form.getAttribute("data-product") || "Product";
      var body =
        "Name: " + fields.name + "\n" +
        "Email: " + fields.email + "\n" +
        (fields.phone ? "Phone: " + fields.phone + "\n" : "") +
        "\n" + fields.message + "\n";
      var note = form.querySelector(".form-note");
      // The address comes from settings.json (loaded by js/settings.js).
      if (!(window.TMB && window.TMB.mailto && window.TMB.settings)) {
        if (note) note.textContent = "Contact details are still loading. Please try again in a moment.";
        return;
      }
      window.location.href = window.TMB.mailto(product + " enquiry from " + fields.name, body);
      if (note) note.textContent = "Your email app should open with the message ready. Just press Send.";
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  onScrollFrame();
})();
