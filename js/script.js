/* ==========================================================================
   TMB Tech — script.js
   Vanilla JS only. No dependencies.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
   * Body scroll lock (used by mobile nav + modal; ref-counted so both
   * can be open at once without one closing unlocking the other)
   * ------------------------------------------------------------------- */
  var scrollLockCount = 0;

  function lockScroll() {
    scrollLockCount++;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function unlockScroll() {
    scrollLockCount = Math.max(0, scrollLockCount - 1);
    if (scrollLockCount === 0) {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    }
  }

  /* ---------------------------------------------------------------------
   * Scroll progress bar
   * ------------------------------------------------------------------- */
  var scrollProgress = document.getElementById("scroll-progress");

  function updateScrollProgress() {
    if (!scrollProgress) return;
    var docEl = document.documentElement;
    var scrollable = docEl.scrollHeight - docEl.clientHeight;
    var ratio = scrollable > 0 ? window.scrollY / scrollable : 0;
    scrollProgress.style.transform = "scaleX(" + ratio + ")";
  }
  updateScrollProgress();
  window.addEventListener("resize", updateScrollProgress);

  /* ---------------------------------------------------------------------
   * Sticky header state
   * ------------------------------------------------------------------- */
  var header = document.getElementById("site-header");

  function updateHeaderState() {
    if (!header) return;
    if (window.scrollY > 8) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  updateHeaderState();

  /* ---------------------------------------------------------------------
   * Mobile navigation
   * ------------------------------------------------------------------- */
  var navToggle = document.getElementById("nav-toggle");
  var mainNav = document.getElementById("main-nav");
  var navBackdrop = document.getElementById("nav-backdrop");
  var navLinks = document.querySelectorAll(".nav-link");

  function openNav() {
    mainNav.classList.add("open");
    navBackdrop.classList.add("visible");
    navToggle.setAttribute("aria-expanded", "true");
    lockScroll();
  }

  function closeNav() {
    if (!mainNav.classList.contains("open")) return;
    mainNav.classList.remove("open");
    navBackdrop.classList.remove("visible");
    navToggle.setAttribute("aria-expanded", "false");
    unlockScroll();
  }

  if (navToggle && mainNav && navBackdrop) {
    navToggle.addEventListener("click", function () {
      var isOpen = mainNav.classList.contains("open");
      if (isOpen) { closeNav(); } else { openNav(); }
    });

    navBackdrop.addEventListener("click", closeNav);

    navLinks.forEach(function (link) {
      link.addEventListener("click", closeNav);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && mainNav.classList.contains("open")) {
        closeNav();
        navToggle.focus();
      }
    });
  }

  /* ---------------------------------------------------------------------
   * Sliding active-nav indicator
   * ------------------------------------------------------------------- */
  var navIndicator = document.getElementById("nav-indicator");

  function updateNavIndicator() {
    var activeLink = document.querySelector(".nav-link.active");
    if (!activeLink || !navIndicator) return;
    navIndicator.style.left = activeLink.offsetLeft + "px";
    navIndicator.style.top = activeLink.offsetTop + "px";
    navIndicator.style.width = activeLink.offsetWidth + "px";
    navIndicator.style.height = activeLink.offsetHeight + "px";
    navIndicator.classList.add("visible");
  }

  window.addEventListener("resize", function () {
    window.requestAnimationFrame(updateNavIndicator);
  });

  /* ---------------------------------------------------------------------
   * Active navigation section (IntersectionObserver)
   * ------------------------------------------------------------------- */
  var sections = document.querySelectorAll("main section[id]");

  if ("IntersectionObserver" in window && sections.length) {
    var navObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var id = entry.target.getAttribute("id");
          navLinks.forEach(function (link) {
            link.classList.toggle("active", link.getAttribute("href") === "#" + id);
          });
          updateNavIndicator();
        });
      },
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach(function (s) { navObserver.observe(s); });
  }

  updateNavIndicator();
  window.addEventListener("load", updateNavIndicator);

  /* ---------------------------------------------------------------------
   * Scroll reveal animations
   * ------------------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");

  var revealGroups = new Map();
  revealEls.forEach(function (el) {
    var parent = el.parentElement;
    var index = revealGroups.has(parent) ? revealGroups.get(parent) : 0;
    if (index > 0) {
      el.style.transitionDelay = Math.min(index * 70, 280) + "ms";
    }
    revealGroups.set(parent, index + 1);
  });

  if ("IntersectionObserver" in window && revealEls.length) {
    var revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach(function (el) { revealObserver.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  }

  /* ---------------------------------------------------------------------
   * Back to top button
   * ------------------------------------------------------------------- */
  var backToTop = document.getElementById("back-to-top");

  function updateBackToTop() {
    if (!backToTop) return;
    backToTop.classList.toggle("visible", window.scrollY > 480);
  }
  updateBackToTop();

  // One rAF-batched scroll handler for the cheap per-scroll UI updates.
  var uiTicking = false;
  window.addEventListener("scroll", function () {
    if (uiTicking) return;
    uiTicking = true;
    window.requestAnimationFrame(function () {
      updateScrollProgress();
      updateHeaderState();
      updateBackToTop();
      uiTicking = false;
    });
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  /* ---------------------------------------------------------------------
   * Hero parallax (scroll + subtle pointer movement)
   * ------------------------------------------------------------------- */
  var parallaxEls = document.querySelectorAll(".parallax-el");
  var heroSection = document.querySelector(".hero");
  var heroStage = document.getElementById("hero-stage");
  var ticking = false;
  var pointerX = 0, pointerY = 0;
  var gyroX = 0, gyroY = 0;

  function applyParallax() {
    if (!parallaxEls.length) return;
    var scrollY = window.scrollY;

    var isMobile = window.innerWidth < 768;

    if (heroStage) {
      if (isMobile) {
        // Mobile: the card tilts back while below the viewport centre and
        // settles flat as it scrolls in; phone tilt adds a little extra.
        var rect = heroStage.getBoundingClientRect();
        var vh = window.innerHeight;
        var progress = (rect.top + rect.height / 2 - vh / 2) / vh;
        progress = Math.max(-1, Math.min(1, progress));
        var mRotX = progress * 24 + gyroY * 6;
        var mRotY = gyroX * 10;
        heroStage.style.transform = "rotateX(" + mRotX + "deg) rotateY(" + mRotY + "deg)";
      } else {
        var rotY = -12 + pointerX * 14;
        var rotX = 6 - pointerY * 10 + Math.min(scrollY * 0.02, 10);
        heroStage.style.transform = "rotateY(" + rotY + "deg) rotateX(" + rotX + "deg)";
      }
    }

    var parallaxScale = isMobile ? 0.25 : 1;

    parallaxEls.forEach(function (el) {
      var speed = (parseFloat(el.getAttribute("data-speed")) || 0.05) * parallaxScale;
      var scrollOffset = scrollY * speed;
      var pointerOffsetX = pointerX * speed * 40;
      var pointerOffsetY = pointerY * speed * 40;
      el.style.transform =
        "translate3d(" + pointerOffsetX + "px, " + (scrollOffset * -1 + pointerOffsetY) + "px, 0)";
    });
    ticking = false;
  }

  function requestParallax() {
    if (!ticking) {
      window.requestAnimationFrame(applyParallax);
      ticking = true;
    }
  }

  if (parallaxEls.length && !reduceMotion) {
    window.addEventListener("scroll", requestParallax, { passive: true });

    if (heroSection) {
      heroSection.addEventListener("pointermove", function (e) {
        var rect = heroSection.getBoundingClientRect();
        pointerX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        pointerY = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        requestParallax();
      });
      heroSection.addEventListener("pointerleave", function () {
        pointerX = 0;
        pointerY = 0;
        requestParallax();
      });
    }
    window.addEventListener("resize", requestParallax);

    // Phone tilt (fires without a permission prompt on Android; iOS stays still).
    if ("DeviceOrientationEvent" in window && window.matchMedia("(pointer: coarse)").matches) {
      window.addEventListener("deviceorientation", function (e) {
        if (e.gamma == null || e.beta == null) return;
        var targetX = Math.max(-1, Math.min(1, e.gamma / 25));
        var targetY = Math.max(-1, Math.min(1, (e.beta - 45) / 25));
        gyroX += (targetX - gyroX) * 0.15;
        gyroY += (targetY - gyroY) * 0.15;
        requestParallax();
      });
    }

    applyParallax();
  }

  /* ---------------------------------------------------------------------
   * Hero 3D point sphere (canvas, perspective-projected)
   * ------------------------------------------------------------------- */
  var sphereCanvas = document.getElementById("hero-sphere");

  if (sphereCanvas && sphereCanvas.getContext) {
    var sctx = sphereCanvas.getContext("2d");
    var POINTS = 260;
    var sPoints = [];
    var golden = Math.PI * (3 - Math.sqrt(5));

    for (var si = 0; si < POINTS; si++) {
      var sy = 1 - (si / (POINTS - 1)) * 2;
      var sr = Math.sqrt(1 - sy * sy);
      var theta = golden * si;
      sPoints.push([Math.cos(theta) * sr, sy, Math.sin(theta) * sr]);
    }

    // The sphere is rigid, so neighbour links only need computing once.
    var sPairs = [];
    for (var a = 0; a < POINTS; a++) {
      for (var b = a + 1; b < POINTS; b++) {
        var dx = sPoints[a][0] - sPoints[b][0];
        var dy = sPoints[a][1] - sPoints[b][1];
        var dz = sPoints[a][2] - sPoints[b][2];
        if (dx * dx + dy * dy + dz * dz < 0.058) sPairs.push(a, b);
      }
    }

    var sSize = 0, sDpr = 1, sAngle = 0, sRunning = false, sVisible = true;
    var projected = new Float32Array(POINTS * 3);
    var LINE_BUCKETS = 6, DOT_BUCKETS = 8;

    function resizeSphere() {
      sDpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 768 ? 1.5 : 2);
      sSize = sphereCanvas.clientWidth;
      sphereCanvas.width = Math.round(sSize * sDpr);
      sphereCanvas.height = Math.round(sSize * sDpr);
    }

    function drawSphere() {
      if (!sSize) return;
      sctx.setTransform(sDpr, 0, 0, sDpr, 0, 0);
      sctx.clearRect(0, 0, sSize, sSize);

      var tiltX = 0.35 + pointerY * 0.25;
      var rotY = sAngle + pointerX * 0.4;
      var cosY = Math.cos(rotY), sinY = Math.sin(rotY);
      var cosX = Math.cos(tiltX), sinX = Math.sin(tiltX);
      var radius = sSize * 0.38;
      var cx = sSize / 2, cy = sSize / 2;
      var persp = 3;

      for (var i = 0; i < POINTS; i++) {
        var p = sPoints[i];
        var x1 = p[0] * cosY + p[2] * sinY;
        var z1 = -p[0] * sinY + p[2] * cosY;
        var y2 = p[1] * cosX - z1 * sinX;
        var z2 = p[1] * sinX + z1 * cosX;
        var f = persp / (persp - z2);
        projected[i * 3] = cx + x1 * f * radius;
        projected[i * 3 + 1] = cy + y2 * f * radius;
        projected[i * 3 + 2] = (z2 + 1) / 2;
      }

      // Batch by alpha level: a handful of strokes/fills per frame instead
      // of one per line and dot keeps this cheap on phones.
      sctx.lineWidth = 1;
      for (var lb = 0; lb < LINE_BUCKETS; lb++) {
        sctx.beginPath();
        var lMin = lb / LINE_BUCKETS, lMax = (lb + 1) / LINE_BUCKETS;
        for (var k = 0; k < sPairs.length; k += 2) {
          var i1 = sPairs[k] * 3, i2 = sPairs[k + 1] * 3;
          var depth = (projected[i1 + 2] + projected[i2 + 2]) / 2;
          if (depth < lMin || (depth >= lMax && lb < LINE_BUCKETS - 1)) continue;
          sctx.moveTo(projected[i1], projected[i1 + 1]);
          sctx.lineTo(projected[i2], projected[i2 + 1]);
        }
        sctx.strokeStyle = "rgba(37, 99, 235, " + (0.04 + (lMin + lMax) / 2 * 0.22).toFixed(3) + ")";
        sctx.stroke();
      }

      for (var db = 0; db < DOT_BUCKETS; db++) {
        sctx.beginPath();
        var dMin = db / DOT_BUCKETS, dMax = (db + 1) / DOT_BUCKETS, dMid = (dMin + dMax) / 2;
        for (var j = 0; j < POINTS; j++) {
          var d = projected[j * 3 + 2];
          if (d < dMin || (d >= dMax && db < DOT_BUCKETS - 1)) continue;
          var px = projected[j * 3], py = projected[j * 3 + 1], pr = 0.8 + d * 2;
          sctx.moveTo(px + pr, py);
          sctx.arc(px, py, pr, 0, Math.PI * 2);
        }
        sctx.fillStyle = dMid > 0.5
          ? "rgba(37, 99, 235, " + (0.35 + dMid * 0.65).toFixed(3) + ")"
          : "rgba(129, 140, 248, " + (0.15 + dMid * 0.5).toFixed(3) + ")";
        sctx.fill();
      }
    }

    // On phones the sphere runs at ~30fps and holds still while the page is
    // being scrolled, so scrolling gets the main thread to itself.
    var lastScrollAt = 0, lastDrawAt = 0;
    window.addEventListener("scroll", function () { lastScrollAt = performance.now(); }, { passive: true });

    function sphereLoop(now) {
      if (!sVisible || document.hidden) { sRunning = false; return; }
      var isMobile = window.innerWidth < 768;
      var scrolling = now - lastScrollAt < 180;
      var frameGap = isMobile ? 32 : 0;
      if (!(isMobile && scrolling) && now - lastDrawAt >= frameGap) {
        sAngle += 0.0035 * (lastDrawAt ? Math.min((now - lastDrawAt) / 16.7, 3) : 1);
        lastDrawAt = now;
        drawSphere();
      }
      window.requestAnimationFrame(sphereLoop);
    }

    function startSphere() {
      if (reduceMotion || sRunning) return;
      sRunning = true;
      window.requestAnimationFrame(sphereLoop);
    }

    resizeSphere();
    drawSphere();

    // Mobile browsers fire resize as the address bar shows/hides while
    // scrolling; only rebuild the canvas when its width actually changes.
    window.addEventListener("resize", function () {
      if (sphereCanvas.clientWidth === sSize) return;
      resizeSphere();
      drawSphere();
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        sVisible = entries[0].isIntersecting;
        if (sVisible) startSphere();
      }).observe(sphereCanvas);
    } else {
      startSphere();
    }

    document.addEventListener("visibilitychange", function () {
      if (!document.hidden) startSphere();
    });
  }

  /* ---------------------------------------------------------------------
   * 3D tilt on cards (mouse / trackpad only)
   * ------------------------------------------------------------------- */
  var canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (canHover && !reduceMotion) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var tiltFrame = null;

      card.addEventListener("pointerenter", function () {
        card.style.transitionDelay = "0ms";
        card.style.transition = "transform 120ms ease-out, opacity 700ms ease, box-shadow 250ms ease, border-color 250ms ease";
      });

      card.addEventListener("pointermove", function (e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width - 0.5;
        var py = (e.clientY - rect.top) / rect.height - 0.5;
        if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
        tiltFrame = window.requestAnimationFrame(function () {
          card.style.transform =
            "perspective(900px) rotateX(" + (-py * 10).toFixed(2) + "deg) rotateY(" + (px * 12).toFixed(2) + "deg) translateY(-4px)";
        });
      });

      card.addEventListener("pointerleave", function () {
        if (tiltFrame) window.cancelAnimationFrame(tiltFrame);
        card.style.transition = "transform 500ms cubic-bezier(.2,.7,.2,1), opacity 700ms ease, box-shadow 250ms ease, border-color 250ms ease";
        card.style.transform = "";
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Stats count-up
   * ------------------------------------------------------------------- */
  var statNums = document.querySelectorAll(".stat-num[data-count]");

  if (statNums.length && "IntersectionObserver" in window && !reduceMotion) {
    var countObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        observer.unobserve(entry.target);
        var el = entry.target;
        var target = parseInt(el.getAttribute("data-count"), 10);
        var startTime = null;
        el.textContent = "0";
        function step(ts) {
          if (!startTime) startTime = ts;
          var progress = Math.min((ts - startTime) / 1200, 1);
          el.textContent = Math.round(target * (1 - Math.pow(1 - progress, 3)));
          if (progress < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
      });
    }, { threshold: 0.6 });

    statNums.forEach(function (el) { countObserver.observe(el); });
  }

  /* ---------------------------------------------------------------------
   * Hero product panel slide-in (on load)
   * ------------------------------------------------------------------- */
  var heroGraphic = document.getElementById("hero-graphic");
  if (heroGraphic) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        heroGraphic.classList.add("panel-in");
      });
    });
  }

  /* ---------------------------------------------------------------------
   * Timeline connecting line draw-in
   * ------------------------------------------------------------------- */
  var timeline = document.querySelector(".timeline");
  if (timeline && "IntersectionObserver" in window) {
    var timelineObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("line-drawn");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.3 }
    );
    timelineObserver.observe(timeline);
  } else if (timeline) {
    timeline.classList.add("line-drawn");
  }

  /* ---------------------------------------------------------------------
   * Product / Project detail modal
   * ------------------------------------------------------------------- */
  var modalOverlay = document.getElementById("detail-modal");
  var modalBody = document.getElementById("modal-body");
  var modalClose = document.getElementById("modal-close");
  var lastFocusedEl = null;

  var detailContent = {
    "gro-shipper": {
      title: "Gro Shipper",
      tagline: "Online truck booking marketplace",
      description: "A marketplace platform connecting shippers with truck operators for transportation and booking workflows.",
      features: ["Truck Booking", "Shipper Management", "Marketplace Workflow", "Transportation Operations"],
      tech: ["Flutter", ".NET", "REST API"]
    },
    "gro-fleet": {
      title: "Gro Fleet",
      tagline: "Fleet management and vehicle interaction platform",
      description: "A fleet operations platform for monitoring and managing vehicles.",
      features: ["Vehicle Management", "Speed Limit", "Geofencing", "Fleet Operations"],
      tech: ["Flutter", ".NET", "REST API"]
    },
    timekeeper: {
      title: "Timekeeper Console",
      tagline: "Sports management application for ice hockey operations",
      description: "A sports management application built to support ice hockey operations.",
      features: [],
      tech: ["Application", "Backend", "Database"]
    },
    stellar: {
      title: "Stellar",
      tagline: "Fleet / freight customer onboarding and employee attendance management",
      description: "An application supporting fleet and freight customer onboarding alongside employee attendance management.",
      features: ["Customer Onboarding", "Fleet / Freight Operations", "Employee Attendance"],
      tech: ["Mobile Application", "Backend API", "Database"]
    }
  };

  function renderModal(key) {
    var data = detailContent[key];
    if (!data) return;

    var featureListHtml = "";
    if (data.features.length) {
      featureListHtml =
        '<h4>Features</h4><ul class="modal-feature-list">' +
        data.features.map(function (f) { return "<li>" + f + "</li>"; }).join("") +
        "</ul>";
    }

    var techHtml =
      '<h4>Technology</h4><ul class="tech-tags">' +
      data.tech.map(function (t) { return "<li>" + t + "</li>"; }).join("") +
      "</ul>";

    var visitHtml = data.url
      ? '<a class="btn btn-primary modal-visit-link" href="' + data.url + '" target="_blank" rel="noopener noreferrer">Visit Website</a>'
      : "";

    var logoHtml = data.logo
      ? '<div class="modal-logo"><img src="' + data.logo + '" alt="" width="56" height="56"></div>'
      : "";

    var trialHtml = data.trial
      ? '<span class="trial-badge">Free Trial Available</span>'
      : "";

    modalBody.innerHTML =
      logoHtml +
      '<h3 id="modal-title">' + data.title + "</h3>" +
      '<p class="modal-body-tagline">' + data.tagline + "</p>" +
      trialHtml +
      '<p class="modal-body-desc">' + data.description + "</p>" +
      featureListHtml +
      techHtml +
      visitHtml;
  }

  function openModal(key) {
    renderModal(key);
    lastFocusedEl = document.activeElement;
    modalOverlay.hidden = false;
    lockScroll();
    modalClose.focus();
  }

  function closeModal() {
    if (modalOverlay.hidden) return;
    modalOverlay.hidden = true;
    unlockScroll();
    if (lastFocusedEl) lastFocusedEl.focus();
  }

  if (modalOverlay && modalBody && modalClose) {
    document.querySelectorAll("[data-modal-open]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        openModal(btn.getAttribute("data-modal-open"));
      });
    });

    modalClose.addEventListener("click", closeModal);

    modalOverlay.addEventListener("click", function (e) {
      if (e.target === modalOverlay) closeModal();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !modalOverlay.hidden) closeModal();
    });
  }

  /* ---------------------------------------------------------------------
   * Contact placeholders — prevent silent no-op navigation confusion
   * ------------------------------------------------------------------- */
  document.querySelectorAll('[data-placeholder="true"]').forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });

  /* ---------------------------------------------------------------------
   * Contact form — validates, then hands off to the visitor's email app
   * ------------------------------------------------------------------- */
  var contactForm = document.getElementById("contact-form");

  // The address the form sends to lives in settings.json (loaded by js/settings.js).
  function contactEmail() {
    return window.TMB && window.TMB.settings ? window.TMB.settings.company.contact.email : "";
  }

  if (contactForm) {
    var cfName = document.getElementById("cf-name");
    var cfEmail = document.getElementById("cf-email");
    var cfPhone = document.getElementById("cf-phone");
    var cfMessage = document.getElementById("cf-message");
    var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    function setFieldError(input, message) {
      var field = input.closest(".form-field");
      var error = document.getElementById(input.id + "-error");
      if (message) {
        field.classList.add("invalid");
        if (error) error.textContent = message;
        return false;
      }
      field.classList.remove("invalid");
      if (error) error.textContent = "";
      return true;
    }

    function validateContactForm() {
      var valid = true;

      if (!cfName.value.trim()) {
        setFieldError(cfName, "Please enter your name.");
        valid = false;
      } else {
        setFieldError(cfName, "");
      }

      if (!cfEmail.value.trim()) {
        setFieldError(cfEmail, "Please enter your email.");
        valid = false;
      } else if (!emailPattern.test(cfEmail.value.trim())) {
        setFieldError(cfEmail, "Please enter a valid email address.");
        valid = false;
      } else {
        setFieldError(cfEmail, "");
      }

      if (!cfPhone.value.trim()) {
        setFieldError(cfPhone, "Please enter your phone number.");
        valid = false;
      } else {
        setFieldError(cfPhone, "");
      }

      if (!cfMessage.value.trim()) {
        setFieldError(cfMessage, "Please describe what you need.");
        valid = false;
      } else {
        setFieldError(cfMessage, "");
      }

      return valid;
    }

    [cfName, cfEmail, cfPhone, cfMessage].forEach(function (input) {
      input.addEventListener("blur", validateContactForm);
    });

    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!validateContactForm()) return;

      var name = cfName.value.trim();
      var email = cfEmail.value.trim();
      var phone = cfPhone.value.trim();
      var message = cfMessage.value.trim();

      var subject = "New enquiry from " + name;
      var body =
        "Name: " + name + "\n" +
        "Email: " + email + "\n" +
        "Phone: " + phone + "\n\n" +
        message;

      var to = contactEmail();
      if (!to) {
        var note = contactForm.querySelector(".form-note");
        if (note) note.textContent = "Contact details are still loading. Please try again in a moment.";
        return;
      }

      var mailtoLink =
        "mailto:" + to +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(body);

      window.location.href = mailtoLink;
    });
  }
})();
