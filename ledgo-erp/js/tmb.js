/* Online Store mockup: gentle 3D tilt that follows the pointer (desktop only). */
(function () {
  "use strict";
  var stage = document.getElementById("osStage");
  if (!stage) return;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!fine || reduce) return;

  var area = stage.parentElement;
  var raf = 0;
  area.addEventListener("pointermove", function (e) {
    var r = area.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;
    var y = (e.clientY - r.top) / r.height - 0.5;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () {
      if (window.innerWidth <= 960) return;
      stage.style.transform = "rotateY(" + (-10 + x * 16) + "deg) rotateX(" + (6 - y * 10) + "deg)";
    });
  });
  area.addEventListener("pointerleave", function () {
    stage.style.transform = "";
  });
})();
