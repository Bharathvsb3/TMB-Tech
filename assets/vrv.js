// V.R.V design document helpers: theme + language switch, brand logo, login sparkles
(function () {
  // [id, English name, Tamil name, swatch colours]
  var THEMES = [
    ['maroon', 'Maroon Classic', 'மெரூன் கிளாசிக்', '#7B0F1F', '#E9C46A'],
    ['gold', 'Light Gold', 'லைட் கோல்ட்', '#E2B95A', '#FFF6DA']
  ];
  function known(id) { return THEMES.some(function (t) { return t[0] === id; }); }
  window.VRV_THEMES = THEMES;

  function setTheme(id) {
    if (!known(id)) id = 'maroon';
    document.documentElement.setAttribute('data-theme', id);
    document.querySelectorAll('.themesw button').forEach(function (b) { b.classList.toggle('on', b.dataset.t === id); });
    try { localStorage.setItem('vrv-doc-theme', id); } catch (e) { }
  }
  window.VRV_setTheme = setTheme;

  // apply the saved theme immediately (script runs in <head>) so the page never flashes the default
  // ?theme=dark in the URL wins, so a link can open in a chosen theme
  var q = /[?&#]theme=(\w+)/.exec(location.search + location.hash);
  var t0 = q ? q[1] : null;
  try { if (!t0) t0 = localStorage.getItem('vrv-doc-theme'); } catch (e) { }
  if (t0 && known(t0)) document.documentElement.setAttribute('data-theme', t0);

  function buildThemeSwitcher() {
    var lang = document.querySelector('.topbar .langsw');
    if (!lang || document.querySelector('.themesw')) return;
    var box = document.createElement('div');
    box.className = 'themesw';
    box.innerHTML = '<span class="lbl">🎨</span>';
    THEMES.forEach(function (t) {
      var b = document.createElement('button');
      b.dataset.t = t[0];
      b.title = t[1] + ' · ' + t[2];
      b.setAttribute('aria-label', t[1]);
      b.style.background = 'linear-gradient(135deg,' + t[3] + ' 55%,' + t[4] + ' 55%)';
      b.addEventListener('click', function () { setTheme(t[0]); });
      box.appendChild(b);
    });
    lang.parentNode.insertBefore(box, lang);
    // theme preview cards in the documents switch the whole page when clicked
    document.querySelectorAll('[data-pick-theme]').forEach(function (c) {
      c.addEventListener('click', function () { setTheme(c.getAttribute('data-pick-theme')); });
    });
    setTheme(document.documentElement.getAttribute('data-theme') || 'maroon');
  }

  var LOGO =
    '<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<defs><linearGradient id="vg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".5" stop-color="#E9C46A"/><stop offset="1" stop-color="#B07D1E"/></linearGradient></defs>' +
    '<circle cx="50" cy="50" r="46" fill="#7B0F1F" stroke="url(#vg)" stroke-width="5"/>' +
    '<circle cx="50" cy="50" r="38" fill="none" stroke="#E9C46A" stroke-width="1" stroke-dasharray="2 3"/>' +
    '<text x="50" y="60" text-anchor="middle" font-family="Cinzel,Times New Roman,serif" font-weight="700" font-size="28" fill="url(#vg)">VRV</text>' +
    '</svg>';

  var RING =
    '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="none" stroke="#F1E2BF" stroke-width="4"/>' +
    '<g class="spin"><circle cx="50" cy="50" r="46" fill="none" stroke="#C8962E" stroke-width="4" stroke-linecap="round" stroke-dasharray="70 220"/>' +
    '<circle cx="50" cy="4" r="4" fill="#FFF1B8"/></g></svg>';

  // wide mockups scroll sideways on phones instead of stretching the page
  function wrapWide() {
    document.querySelectorAll('.dev.desk, .dev.tab').forEach(function (d) {
      if (d.parentElement.classList.contains('scrollx')) return;
      var w = document.createElement('div');
      w.className = 'scrollx';
      d.parentNode.insertBefore(w, d);
      w.appendChild(d);
    });
  }

  function fillLogos() {
    wrapWide();
    document.querySelectorAll('[data-logo]').forEach(function (el) { el.innerHTML = LOGO; });
    document.querySelectorAll('[data-loader]').forEach(function (el) {
      el.innerHTML = '<div class="ring">' + RING + '<svg class="logo" viewBox="-22 -22 144 144">' + LOGO.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') + '</svg></div>' +
        '<div class="txt">' + (el.getAttribute('data-loader') || 'LOADING') + '<span>.</span><span style="animation-delay:.2s">.</span><span style="animation-delay:.4s">.</span></div>';
    });
    document.querySelectorAll('.lg-bg').forEach(function (bg) {
      for (var i = 0; i < 26; i++) {
        var s = document.createElement('i');
        s.className = 'spark';
        s.style.left = (Math.random() * 100) + '%';
        s.style.animationDuration = (5 + Math.random() * 7) + 's';
        s.style.animationDelay = (-Math.random() * 10) + 's';
        var z = 3 + Math.random() * 6; s.style.width = s.style.height = z + 'px';
        bg.appendChild(s);
      }
    });
  }

  function setLang(mode) {
    document.body.classList.remove('only-ta', 'only-en');
    if (mode === 'ta') document.body.classList.add('only-ta');
    if (mode === 'en') document.body.classList.add('only-en');
    document.querySelectorAll('.langsw button').forEach(function (b) { b.classList.toggle('on', b.dataset.l === mode); });
    try { localStorage.setItem('vrv-doc-lang', mode); } catch (e) { }
  }

  document.addEventListener('DOMContentLoaded', function () {
    fillLogos();
    buildThemeSwitcher();
    document.querySelectorAll('.langsw button').forEach(function (b) {
      b.addEventListener('click', function () { setLang(b.dataset.l); });
    });
    var saved = 'both';
    try { saved = localStorage.getItem('vrv-doc-lang') || 'both'; } catch (e) { }
    if (!document.querySelector('.langsw button[data-l="' + saved + '"]')) saved = 'both';
    setLang(saved);
  });
})();
