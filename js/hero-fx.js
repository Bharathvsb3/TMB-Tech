/* ==========================================================================
   Hero background effects. One small engine, four different looks, chosen
   per site with  <canvas class="fx-canvas" data-fx="...">  inside the hero:

     stars   twinkling dust and sparkles that drift with the pointer   (JB One)
     embers  warm sparks rising from the bottom                        (GasOne)
     motes   big soft pollen-like glows drifting across, plus a soft
             spotlight that follows the cursor                         (LedGo ERP)
     net     a slowly moving constellation of joined points that
             reach out to the cursor                                   (company site)

   Colours come from the CSS custom properties --fx-1, --fx-2, --fx-3 on the
   canvas, so every site styles its own effect and the LedGo theme swatches
   recolour it. It draws about 30 times a second, only while the hero is on
   screen and the tab is visible, uses one canvas, and stays off in lite mode
   (see perf.js) and for people who prefer reduced motion (one still frame).
   ========================================================================== */
(function () {
  "use strict";
  var canvases = document.querySelectorAll(".fx-canvas");
  if (!canvases.length) return;
  var root = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var TAU = Math.PI * 2;

  function setup(canvas) {
    var mode = canvas.getAttribute("data-fx") || "stars";
    var host = canvas.parentElement;
    var ctx = canvas.getContext("2d");
    if (!ctx) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var W = 1, H = 1, parts = [], colors = ["#fff", "#fff", "#fff"], sprites = [];
    var pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    var spot = { x: 0, y: 0, tx: 0, ty: 0, on: 0, want: 0 }; // cursor position in pixels, and how strongly it is present
    var visible = true, raf = 0, last = 0, t0 = performance.now();

    function readColors() {
      var cs = getComputedStyle(canvas);
      colors = ["--fx-1", "--fx-2", "--fx-3"].map(function (name) {
        return (cs.getPropertyValue(name) || "").trim() || "#ffffff";
      });
      sprites = [];
      if (mode === "motes") {
        colors.forEach(function (c) {
          var s = document.createElement("canvas");
          s.width = s.height = 64;
          var g = s.getContext("2d");
          var grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
          grad.addColorStop(0, c);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          g.fillStyle = grad;
          g.fillRect(0, 0, 64, 64);
          sprites.push(s);
        });
      }
    }

    function count(perArea, max) {
      var n = Math.round((W * H) / perArea);
      if (W < 700) n = Math.round(n * 0.6);
      return Math.max(8, Math.min(max, n));
    }

    function seed() {
      parts = [];
      var i, n;
      if (mode === "stars") {
        n = count(16000, 90);
        for (i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, z: 0.3 + Math.random() * 0.7, r: 0.5 + Math.random() * 1.2, ph: Math.random() * TAU, sp: 0.6 + Math.random() * 1.6, big: Math.random() < 0.09, c: (Math.random() * 3) | 0 });
      } else if (mode === "embers") {
        n = count(17000, 84);
        for (i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, v: 14 + Math.random() * 34, sw: 0.4 + Math.random() * 1.4, ph: Math.random() * TAU, r: 1.4 + Math.random() * 2.4, c: Math.random() < 0.72 ? 0 : (Math.random() < 0.6 ? 1 : 2) });
      } else if (mode === "motes") {
        n = count(24000, 46);
        for (i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: 5 + Math.random() * 12, vy: -(2 + Math.random() * 6), s: 18 + Math.random() * 56, a: 0.05 + Math.random() * 0.1, ph: Math.random() * TAU, c: (Math.random() * 3) | 0, dot: Math.random() < 0.6 });
      } else {
        n = count(30000, 46);
        for (i = 0; i < n; i++) parts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 14 });
      }
    }

    function resize() {
      var r = host.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width));
      H = Math.max(1, Math.round(r.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
      draw(2);
    }

    function wrap(v, m) { return ((v % m) + m) % m; }

    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;
      spot.x += (spot.tx - spot.x) * 0.18;
      spot.y += (spot.ty - spot.y) * 0.18;
      spot.on += (spot.want - spot.on) * 0.08;
      var i, p, x, y, a, s;

      if (mode === "stars") {
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          x = wrap(p.x + pointer.x * 26 * p.z + t * p.z * 3, W);
          y = wrap(p.y + pointer.y * 16 * p.z - t * p.z * 2, H);
          a = (0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * p.sp + p.ph))) * p.z;
          ctx.globalAlpha = a;
          ctx.fillStyle = colors[p.c];
          if (p.big) {
            s = 5 + p.z * 5;
            ctx.beginPath();
            ctx.moveTo(x, y - s); ctx.quadraticCurveTo(x, y, x + s, y);
            ctx.quadraticCurveTo(x, y, x, y + s); ctx.quadraticCurveTo(x, y, x - s, y);
            ctx.quadraticCurveTo(x, y, x, y - s);
            ctx.fill();
            ctx.globalAlpha = a * 0.25;
            ctx.beginPath(); ctx.arc(x, y, s * 1.2, 0, TAU); ctx.fill();
          } else {
            ctx.beginPath(); ctx.arc(x, y, p.r * p.z + 0.3, 0, TAU); ctx.fill();
          }
        }
      } else if (mode === "embers") {
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          y = wrap(p.y - p.v * t, H);
          x = wrap(p.x + Math.sin(t * p.sw + p.ph) * 14 + pointer.x * 30, W);
          var k = y / H; // 1 at the bottom, 0 at the top
          a = Math.min(1, k * 1.5) * (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 3 + p.ph)));
          ctx.fillStyle = colors[p.c];
          ctx.globalAlpha = a * 0.28;
          ctx.beginPath(); ctx.arc(x, y, p.r * (0.6 + k * 0.8) * 2.6, 0, TAU); ctx.fill();
          ctx.globalAlpha = Math.min(1, a * 1.15);
          ctx.beginPath(); ctx.arc(x, y, p.r * (0.5 + k * 0.6), 0, TAU); ctx.fill();
        }
      } else if (mode === "motes") {
        if (spot.on > 0.02 && sprites[0]) {
          ctx.globalAlpha = 0.34 * spot.on;
          ctx.drawImage(sprites[0], spot.x - 230, spot.y - 230, 460, 460);
        }
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          x = wrap(p.x + p.vx * t + pointer.x * 40, W + p.s) - p.s / 2;
          y = wrap(p.y + p.vy * t + Math.sin(t * 0.3 + p.ph) * 22, H + p.s) - p.s / 2;
          ctx.globalAlpha = p.dot ? Math.min(0.8, (0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 1.4 + p.ph))) * p.a * 6) : p.a;
          if (p.dot) {
            ctx.fillStyle = colors[p.c];
            ctx.beginPath(); ctx.arc(x, y, 1.1 + p.a * 14, 0, TAU); ctx.fill();
          } else if (sprites[p.c]) {
            ctx.drawImage(sprites[p.c], x, y, p.s, p.s);
          }
        }
      } else {
        var D = Math.min(170, W * 0.15), j, q, dx, dy, d;
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          p.x += p.vx * 0.033; p.y += p.vy * 0.033;
          if (p.x < 0 || p.x > W) p.vx *= -1;
          if (p.y < 0 || p.y > H) p.vy *= -1;
        }
        ctx.lineWidth = 1;
        ctx.strokeStyle = colors[0];
        for (i = 0; i < parts.length; i++) {
          p = parts[i];
          for (j = i + 1; j < parts.length; j++) {
            q = parts[j]; dx = p.x - q.x; dy = p.y - q.y;
            if (dx > D || dx < -D || dy > D || dy < -D) continue;
            d = Math.sqrt(dx * dx + dy * dy);
            if (d < D) { ctx.globalAlpha = (1 - d / D) * 0.3; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke(); }
          }
        }
        if (spot.on > 0.02) {
          var R = D * 1.5;
          for (i = 0; i < parts.length; i++) {
            p = parts[i]; dx = p.x - spot.x; dy = p.y - spot.y; d = Math.sqrt(dx * dx + dy * dy);
            if (d < R) { ctx.globalAlpha = (1 - d / R) * 0.55 * spot.on; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(spot.x, spot.y); ctx.stroke(); }
          }
        }
        ctx.fillStyle = colors[1];
        ctx.globalAlpha = 0.7;
        for (i = 0; i < parts.length; i++) { p = parts[i]; ctx.beginPath(); ctx.arc(p.x, p.y, 1.7, 0, TAU); ctx.fill(); }
      }
      ctx.globalAlpha = 1;
    }

    function frame(now) {
      raf = 0;
      if (!visible || document.hidden || root.classList.contains("lite")) return;
      if (now - last >= 33) { last = now; draw((now - t0) / 1000); }
      raf = requestAnimationFrame(frame);
    }
    function kick() { if (!raf && visible && !reduce) raf = requestAnimationFrame(frame); }

    readColors();
    resize();
    if (reduce) return;

    if ("ResizeObserver" in window) new ResizeObserver(resize).observe(host);
    else window.addEventListener("resize", resize);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) { visible = e[0].isIntersecting; kick(); }, { rootMargin: "80px 0px" }).observe(host);
    }
    document.addEventListener("visibilitychange", kick);
    // a colour theme change (LedGo swatches) or leaving lite mode
    new MutationObserver(function () { readColors(); kick(); }).observe(root, { attributes: true, attributeFilter: ["data-theme", "data-mode", "class"] });
    if (fine) {
      host.addEventListener("pointermove", function (e) {
        var r = host.getBoundingClientRect();
        pointer.tx = (e.clientX - r.left) / r.width - 0.5;
        pointer.ty = (e.clientY - r.top) / r.height - 0.5;
        spot.tx = e.clientX - r.left; spot.ty = e.clientY - r.top; spot.want = 1;
      }, { passive: true });
      host.addEventListener("pointerleave", function () { pointer.tx = 0; pointer.ty = 0; spot.want = 0; });
    }
    kick();
  }

  Array.prototype.forEach.call(canvases, setup);
})();
