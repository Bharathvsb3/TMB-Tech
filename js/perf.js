/* ==========================================================================
   Lite mode: keeps the sites smooth on a computer that struggles.

   While the visitor scrolls, this watches how long each frame takes. If a
   large share of frames is slow, it switches the page to "lite" (the class
   html.lite): no glass blur, no animated glow, no floating and tilting
   layers. The choice is remembered in this browser, so the next visit is
   smooth from the first frame.

   For testing:  add ?lite=1 to the address to force it, ?lite=0 to turn it
   off again (and forget the choice).
   ========================================================================== */
(function () {
  "use strict";
  var root = document.documentElement;
  var KEY = "tmb-lite";

  var forced = (location.search.match(/[?&]lite=(0|1)/) || [])[1];
  try {
    if (forced === "1") localStorage.setItem(KEY, "1");
    if (forced === "0") localStorage.removeItem(KEY);
    if (localStorage.getItem(KEY) === "1") root.classList.add("lite");
  } catch (e) { /* storage blocked: just no memory between visits */ }
  // Endless animations (floating devices, glows, marquee, sparkles...) only
  // run while their section is on screen. Anything scrolled far away is paused,
  // so the page is not animating hundreds of things nobody can see.
  var pause = document.createElement("style");
  pause.textContent = ".anim-off, .anim-off *, .anim-off *::before, .anim-off *::after { animation-play-state: paused !important; }";
  (document.head || root).appendChild(pause);
  function watchSections() {
    if (!("IntersectionObserver" in window)) return;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.target.classList.toggle("anim-off", !e.isIntersecting); });
    }, { rootMargin: "150px 0px" });
    document.querySelectorAll("section, footer, .marquee").forEach(function (el) { io.observe(el); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", watchSections);
  else watchSections();

  if (root.classList.contains("lite") || forced === "0") return;

  var SLOW_MS = 34;        // a frame slower than about 30 fps
  var NEEDED = 70;         // frames to look at before deciding
  var MAX_SHARE = 0.3;     // more than this share of slow frames = lite
  var skip = 8;            // ignore the first frames of a scroll (start-up cost)
  var frames = 0, slow = 0, last = 0, running = false, idle = 0, decided = false;

  function tick(t) {
    if (decided) return;
    if (last && !document.hidden) {
      if (skip > 0) { skip--; }
      else {
        frames++;
        if (t - last > SLOW_MS) slow++;
        if (frames >= NEEDED) { decide(); return; }
      }
    }
    last = t;
    if (running) requestAnimationFrame(tick);
  }

  function decide() {
    decided = true;
    running = false;
    window.removeEventListener("scroll", onScroll);
    if (slow / frames > MAX_SHARE) {
      root.classList.add("lite");
      try { localStorage.setItem(KEY, "1"); } catch (e) { /* ignore */ }
    }
  }

  function onScroll() {
    if (decided) return;
    if (!running) { running = true; last = 0; skip = 8; requestAnimationFrame(tick); }
    clearTimeout(idle);
    idle = setTimeout(function () { running = false; }, 160); // stop watching when the scrolling stops
  }

  window.addEventListener("scroll", onScroll, { passive: true });
})();
