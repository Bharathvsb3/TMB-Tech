/* LedGo site extras: tabbed 3D device showcases for the Online Store section. */
(function () {
  "use strict";
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.querySelectorAll("[data-st]").forEach(function (show) {
    var tabs = Array.prototype.slice.call(show.querySelectorAll(".st-tab"));
    var shots = Array.prototype.slice.call(show.querySelectorAll(".st-shot"));
    var stage = show.querySelector(".st-stage");
    var inner = show.querySelector(".st-stage-in");
    var duration = parseInt(show.getAttribute("data-st-ms"), 10) || 5000;
    show.style.setProperty("--st-dur", duration + "ms");
    var index = 0, timer = 0, userStopped = false, visible = false;

    function activate(i) {
      index = (i + tabs.length) % tabs.length;
      var name = tabs[index].getAttribute("data-shot");
      tabs.forEach(function (t, n) {
        var on = n === index;
        t.classList.toggle("is-active", on);
        t.setAttribute("aria-selected", on ? "true" : "false");
      });
      shots.forEach(function (s) {
        var key = s.getAttribute("data-shot");
        s.classList.toggle("is-active", key === "*" || key === name);
      });
      // restart the progress bar
      show.classList.remove("is-playing");
      void show.offsetWidth;
      if (!userStopped && visible && !reduce) show.classList.add("is-playing");
    }

    function schedule() {
      clearTimeout(timer);
      if (userStopped || !visible || reduce) return;
      timer = setTimeout(function () { activate(index + 1); schedule(); }, duration);
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        userStopped = true;
        clearTimeout(timer);
        show.classList.remove("is-playing");
        activate(i);
      });
    });

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        visible = entries[0].isIntersecting;
        if (visible) { activate(index); schedule(); }
        else { clearTimeout(timer); show.classList.remove("is-playing"); }
      }, { threshold: 0.35 }).observe(show);
    } else {
      visible = true;
    }

    // theme switch on the storefront home screen (green / purple "Velocity")
    show.querySelectorAll(".st-theme button").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var target = show.querySelector(".st-shot[data-themed]");
        if (!target) return;
        show.querySelectorAll(".st-theme button").forEach(function (b) {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        target.src = target.getAttribute("data-src-" + btn.getAttribute("data-theme"));
        userStopped = true;
        clearTimeout(timer);
        show.classList.remove("is-playing");
        var homeIndex = tabs.findIndex(function (t) { return t.getAttribute("data-shot") === "home"; });
        if (homeIndex > -1) activate(homeIndex);
      });
    });

    // 3D tilt that follows the pointer
    if (fine && !reduce && stage && inner) {
      var raf = 0;
      stage.addEventListener("pointermove", function (e) {
        if (window.innerWidth <= 960) return;
        var r = stage.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5;
        var y = (e.clientY - r.top) / r.height - 0.5;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(function () {
          inner.style.transform = "rotateY(" + (-13 + x * 14) + "deg) rotateX(" + (5 - y * 9) + "deg)";
        });
      });
      stage.addEventListener("pointerleave", function () { inner.style.transform = ""; });
    }

    activate(0);
  });
})();
