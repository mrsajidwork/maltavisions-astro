/* Site behaviour, copied from the reference (source/js/main.js) minus the prototype contact form. */
(function () {
  'use strict';
  var reduced = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (i) { return (i < 9 ? '0' : '') + (i + 1); };

  /* ---------- Footer year ---------- */
  $$('.mv-fbottom p').forEach(function (p) { p.textContent = p.textContent.replace(/\d{4}/, String(new Date().getFullYear())); });

  /* ---------- Fullscreen menu ---------- */
  (function () {
    var btn = $('.mv-menu-btn'), menu = $('#mv-menu'), close = $('.mv-close');
    if (!btn || !menu) return;
    var savedY = 0, isOpen = false;
    function lock() {
      savedY = window.scrollY || window.pageYOffset || 0;
      var b = document.body.style; b.position = 'fixed'; b.top = (-savedY) + 'px'; b.left = '0'; b.right = '0'; b.width = '100%';
    }
    function unlock() {
      var b = document.body.style; b.position = ''; b.top = ''; b.left = ''; b.right = ''; b.width = '';
      window.scrollTo(0, savedY);
    }
    function open() {
      if (isOpen) return; isOpen = true;
      lock();
      menu.classList.add('is-open'); menu.setAttribute('aria-hidden', 'false'); btn.setAttribute('aria-expanded', 'true');
      close.focus({ preventScroll: true });
    }
    function shut(returnFocus) {
      if (!isOpen) return; isOpen = false;
      menu.classList.remove('is-open'); menu.setAttribute('aria-hidden', 'true'); btn.setAttribute('aria-expanded', 'false');
      unlock();
      if (returnFocus) btn.focus({ preventScroll: true });
    }
    btn.addEventListener('click', open);
    close.addEventListener('click', function () { shut(true); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { shut(false); }); });
    menu.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); shut(true); return; }
      if (e.key !== 'Tab') return;
      var f = $$('a[href], button', menu).filter(function (el) { return el.getClientRects().length > 0; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  })();

  /* ---------- Hero project showcase ---------- */
  (function () {
    var fallback = [{"title": "Fairwave", "kind": "Client project", "role": "Custom WordPress development · Client-supplied design", "href": "/portfolio/fair-wave/", "linkLabel": "View project", "tint": "#26221d", "glass": 0.66}, {"title": "Guardian Angel", "kind": "Client project", "role": "Custom WordPress theme with ACF flexible content and a kit builder · Client-supplied design", "href": "/portfolio/guardian-angel/", "linkLabel": "View project", "tint": "#241314", "glass": 0.8}, {"title": "New England Conservatory", "kind": "Client project", "role": "Custom WordPress features and blocks", "href": "https://necmusic.edu/", "linkLabel": "Visit the site", "tint": "#211b12", "glass": 0.72}];
    var data = null, dataEl = document.getElementById('mv-hero-data');
    if (dataEl) { try { data = JSON.parse(dataEl.textContent); } catch (err) { data = null; } }
    var P = (data && data.projects && data.projects.length) ? data.projects : fallback;
    var cur = (data && typeof data.start === 'number') ? data.start : 2, n = P.length, timer = 0;
    var btns = $$('.mv-sel button'), imgs = $$('.mv-img'), glows = $$('.mv-glow');
    var info = $('.mv-info'), cap = $('#mv-cap');
    if (!btns.length || !cap) return;
    function fillCaption(i) {
      var p = P[i];
      $('.mv-meta', cap).textContent = pad(i) + ' / ' + pad(n - 1) + ' · ' + p.kind;
      $('.mv-cap-title', cap).textContent = p.title;
      $('.mv-role', cap).textContent = p.role;
      var link = $('.mv-cap-link', cap);
      link.href = p.href;
      link.firstChild.nodeValue = p.linkLabel;
      $('.mv-sr', link).textContent = ': ' + p.title;
    }
    function pick(i, focus) {
      if (i === cur || i < 0 || i >= n) return;
      cur = i;
      btns.forEach(function (b, j) { b.setAttribute('aria-pressed', String(j === i)); });
      imgs.forEach(function (im, j) {
        var on = j === i; im.classList.toggle('is-active', on);
        im.setAttribute('aria-hidden', String(!on)); if (on) im.loading = 'eager';
      });
      glows.forEach(function (g, j) { g.classList.toggle('is-active', j === i); });
      info.style.setProperty('--mv-glass-a', String(P[i].glass));
      clearTimeout(timer);
      cap.classList.add('is-out');
      timer = setTimeout(function () { fillCaption(i); cap.classList.remove('is-out'); }, reduced() ? 0 : 234);
      if (focus) btns[i].focus();
    }
    btns.forEach(function (b, j) {
      b.addEventListener('click', function () { pick(j); });
      b.addEventListener('keydown', function (e) {
        var t = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') t = (j + 1) % n;
        else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') t = (j - 1 + n) % n;
        else if (e.key === 'Home') t = 0; else if (e.key === 'End') t = n - 1;
        if (t !== null) { e.preventDefault(); pick(t, true); }
      });
    });
  })();

  /* ---------- Services picker (tabs) ---------- */
  (function () {
    var tabs = $$('.cx-chip[role="tab"]');
    if (!tabs.length) return;
    function pick(i, focus) {
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', String(on)); t.setAttribute('tabindex', on ? '0' : '-1');
        var panel = document.getElementById(t.getAttribute('aria-controls'));
        if (panel) panel.classList.toggle('is-on', on);
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, j) {
      t.addEventListener('click', function () { pick(j); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (j + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (j - 1 + n) % n;
        else if (e.key === 'Home') k = 0; else if (e.key === 'End') k = n - 1;
        if (k !== null) { e.preventDefault(); pick(k, true); }
      });
    });
  })();

  /* ---------- AI case study steps ---------- */
  (function () {
    var steps = $$('.ai-step'), views = $$('.ai-view'), stage = $('#ai-stage'), title = $('.ai-stage-title');
    if (!steps.length) return;
    var titles = ['Lesson page with AI tutor', 'Submitting a solution', 'AI evaluation'];
    var labels = ['Illustration: a student asks the AI tutor a question on a lesson page and gets a simpler explanation.',
      'Illustration: a student submits a solution for evaluation.',
      'Illustration: the student solution and a reference solution hosted on AWS go to AI evaluation, which returns feedback to the student.'];
    steps.forEach(function (s, i) {
      s.addEventListener('click', function () {
        steps.forEach(function (x, j) { x.setAttribute('aria-pressed', String(j === i)); });
        views.forEach(function (v, j) { v.classList.toggle('is-on', j === i); });
        var stepTitle = s.getAttribute('data-title') || titles[i] || '';
        var stepLabel = s.getAttribute('data-label') || labels[i] || '';
        if (title && stepTitle) title.textContent = stepTitle;
        if (stage && stepLabel) stage.setAttribute('aria-label', stepLabel);
      });
    });
  })();

  /* ---------- Easy Social Feed feature tour ---------- */
  (function () {
    var feats = $$('.pd-feat'), img = $('#pd-shot img'), cap = $('.pd-caption span');
    if (!feats.length || !img) return;
    var F = [
      { title: 'One grid.', text: 'Posts from every connected network sit together in a single social wall.', origin: '24% 18%', zoom: 1.3 },
      { title: 'Filters.', text: 'Visitors can switch between All, Instagram, X, YouTube and TikTok.', origin: '5% 14%', zoom: 2.4 },
      { title: 'Live editing.', text: 'Change the layout and see the wall update right on the page.', origin: '100% 14%', zoom: 1.6 }
    ];
    var on = 0;
    function featAt(i) {
      var fb = F[i] || { title: '', text: '', origin: '50% 50%', zoom: 1 };
      var btn = feats[i];
      if (!btn) return fb;
      var zoom = parseFloat(btn.getAttribute('data-zoom'));
      var title = btn.getAttribute('data-title');
      var text = btn.getAttribute('data-text');
      var origin = btn.getAttribute('data-origin');
      return {
        title: title || fb.title,
        text: text || fb.text,
        origin: origin || fb.origin,
        zoom: isNaN(zoom) ? fb.zoom : zoom
      };
    }
    function apply() {
      var f = featAt(on), small = window.matchMedia('(max-width: 599px)').matches;
      img.style.transform = 'scale(' + (small ? Math.min(f.zoom, 1.6) : f.zoom) + ')';
      img.style.transformOrigin = f.origin;
      cap.innerHTML = '';
      var b = document.createElement('b'); b.textContent = f.title; cap.appendChild(b);
      cap.appendChild(document.createTextNode(' ' + f.text));
      feats.forEach(function (x, j) { x.setAttribute('aria-pressed', String(j === on)); });
    }
    feats.forEach(function (x, i) { x.addEventListener('click', function () { on = i; apply(); }); });
    window.addEventListener('resize', apply);
  })();

  /* ---------- FAQ ---------- */
  $$('.fq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.fq-item'), open = !item.classList.contains('is-open');
      item.classList.toggle('is-open', open); q.setAttribute('aria-expanded', String(open));
    });
  });

  /* Contact form: handled by Contact Form 7, see blocks/contact/view.js */
})();
