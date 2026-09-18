/* ==========================================================================
   TMB Tech — script.js
   Vanilla JS only. No dependencies.
   ========================================================================== */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------------------
   * Scroll progress bar
   * ------------------------------------------------------------------- */
  var scrollProgress = document.getElementById("scroll-progress");

  function updateScrollProgress() {
    if (!scrollProgress) return;
    var docEl = document.documentElement;
    var scrollable = docEl.scrollHeight - docEl.clientHeight;
    var pct = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0;
    scrollProgress.style.width = pct + "%";
  }
  updateScrollProgress();
  window.addEventListener("scroll", updateScrollProgress, { passive: true });
  window.addEventListener("resize", updateScrollProgress);

  /* ---------------------------------------------------------------------
   * Sticky header state
   * ------------------------------------------------------------------- */
  var header = document.getElementById("site-header");

  function updateHeaderState() {
    if (window.scrollY > 8) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

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
  }

  function closeNav() {
    mainNav.classList.remove("open");
    navBackdrop.classList.remove("visible");
    navToggle.setAttribute("aria-expanded", "false");
  }

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
    backToTop.classList.toggle("visible", window.scrollY > 480);
  }
  updateBackToTop();
  window.addEventListener("scroll", updateBackToTop, { passive: true });

  backToTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ---------------------------------------------------------------------
   * Hero parallax (scroll + subtle pointer movement)
   * ------------------------------------------------------------------- */
  var parallaxEls = document.querySelectorAll(".parallax-el");
  var heroSection = document.querySelector(".hero");
  var ticking = false;
  var pointerX = 0, pointerY = 0;

  function applyParallax() {
    if (!parallaxEls.length) return;
    var scrollY = window.scrollY;

    parallaxEls.forEach(function (el) {
      var speed = parseFloat(el.getAttribute("data-speed")) || 0.05;
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
    applyParallax();
  }

  /* ---------------------------------------------------------------------
   * Hero bar-chart grow-in (on load)
   * ------------------------------------------------------------------- */
  var heroGraphic = document.getElementById("hero-graphic");
  if (heroGraphic) {
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () {
        heroGraphic.classList.add("bars-in");
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
    ledgo: {
      title: "LedGo ERP",
      tagline: "All-in-One Business Management Software",
      description: "LedGo ERP is a business management platform designed to help retailers manage daily operations from a centralized system.",
      features: [
        "Sales Billing / POS", "Purchase Management", "Inventory Management",
        "Sales Returns", "Purchase Returns", "Multi-Location Management",
        "Customer Management", "Pricing Management", "Accounts",
        "Voice Ordering", "Invoice Import", "Storefronts", "Business Mobile Access"
      ],
      tech: ["Flutter", "ASP.NET Core", "SQL Server", "REST API"],
      url: "https://ledgoerp.runasp.net/website/index.html",
      logo: "assets/products/ledgo.png"
    },
    gasone: {
      title: "GasOne",
      tagline: "LPG Gas Agency Management System",
      description: "GasOne is designed to simplify daily LPG gas agency operations and collection management.",
      features: [
        "Customer Management", "Cylinder / Gas Delivery Management", "Collection Management",
        "Payment Tracking", "Customer Records", "Daily Business Operations",
        "Reports", "Tamil / English Support"
      ],
      tech: ["Flutter", "ASP.NET Core", "SQLite", "REST API"],
      url: "https://gasoneapp.runasp.net/GasOne_Guide.html",
      logo: "assets/products/gasone.png"
    },
    jbone: {
      title: "JB One",
      tagline: "Jewellery Business Management",
      description: "JB One is a jewellery business application designed to simplify jewellery-related business operations and management workflows.",
      features: [
        "Jewellery Tag Management", "Product Management", "Billing",
        "Inventory", "Customer Management", "Business Records"
      ],
      tech: ["Flutter", "ASP.NET Core", "SQL"],
      logo: "assets/products/jbone.png"
    },
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

    modalBody.innerHTML =
      logoHtml +
      '<h3 id="modal-title">' + data.title + "</h3>" +
      '<p class="modal-body-tagline">' + data.tagline + "</p>" +
      '<p class="modal-body-desc">' + data.description + "</p>" +
      featureListHtml +
      techHtml +
      visitHtml;
  }

  function openModal(key) {
    renderModal(key);
    lastFocusedEl = document.activeElement;
    modalOverlay.hidden = false;
    document.body.style.overflow = "hidden";
    modalClose.focus();
  }

  function closeModal() {
    modalOverlay.hidden = true;
    document.body.style.overflow = "";
    if (lastFocusedEl) lastFocusedEl.focus();
  }

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

  /* ---------------------------------------------------------------------
   * Contact placeholders — prevent silent no-op navigation confusion
   * ------------------------------------------------------------------- */
  document.querySelectorAll('[data-placeholder="true"]').forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
    });
  });
})();
