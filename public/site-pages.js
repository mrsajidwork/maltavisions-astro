/* Behaviour for the inner pages: shared parts (menu, FAQ, product tour, contact form prototype) from the landing page,
   then page-specific parts. Every block checks for its markup first, so one file serves all pages. */
(function () {
  'use strict';
  var reduced = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var pad = function (i) { return (i < 9 ? '0' : '') + (i + 1); };

  /* ---------- Footer year ---------- */
  $$('.mv-fbottom p, .sf-bottom p').forEach(function (p) { p.textContent = p.textContent.replace(/\d{4}/, String(new Date().getFullYear())); });

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
    var data = null, dataEl = document.getElementById('mv-hero-data');
    if (dataEl) { try { data = JSON.parse(dataEl.textContent); } catch (err) { data = null; } }
    var P = (data && data.projects && data.projects.length) ? data.projects : [];
    var cur = (data && typeof data.start === 'number') ? data.start : 0, n = P.length, timer = 0;
    var btns = $$('.mv-sel button'), imgs = $$('.mv-img'), glows = $$('.mv-glow');
    var info = $('.mv-info'), cap = $('#mv-cap');
    if (!btns.length || !cap || !n) return;
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

  /* ---------- Contact form (prototype: shows a thank-you, sends nothing) ---------- */
  /* Skip when CF7 bridge is active (real submit via WordPress REST). */
  (function () {
    var form = $('.ct-form'), done = $('.ct-done');
    if (!form || !done) return;
    if (form.classList.contains('wpcf7-form') || form.closest('.wpcf7') || window.__MV_CF7__) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var d = new FormData(form);
      $('[data-ct-who]', done).textContent = String(d.get('name') || '').trim().split(' ')[0] || 'there';
      $('[data-ct-email]', done).textContent = String(d.get('email') || '').trim();
      form.hidden = true; done.hidden = false;
      var h = $('h3', done); h.setAttribute('tabindex', '-1'); h.focus();
    });
    $('.ct-reset', done).addEventListener('click', function () {
      form.reset(); done.hidden = true; form.hidden = false;
      var first = $('input', form); if (first) first.focus();
    });
  })();


  /* ---------- Work: tabs filter the project grid ---------- */
  (function () {
    var tabs = $$('.wk-tab[data-filter]');
    if (!tabs.length) return;
    var grid = $('.wk-grid'), status = $('.wk .mv-sr[role="status"]');
    var countB = $('.wk-count b'), countS = $('.wk-count span');
    var pad = function (n) { return (n < 10 ? '0' : '') + n; };
    function cardClass(i, n) {
      var pair = Math.floor(i / 2), first = i % 2 === 0;
      if (i === n - 1 && first) return 'wk-card is-full';
      var wide = pair % 2 === 0 ? first : !first;
      return wide ? 'wk-card is-wide' : 'wk-card is-narrow';
    }
    function apply(filter, tabEl) {
      tabs.forEach(function (t) {
        var on = t.getAttribute('data-filter') === filter;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
      });
      if (grid) {
        var items = $$(':scope > li', grid);
        var vis = items.filter(function (li) { return filter === 'all' || li.getAttribute('data-group') === filter; });
        items.forEach(function (li) { li.hidden = vis.indexOf(li) < 0; });
        vis.forEach(function (li, i) {
          var num = $('.wk-num', li); if (num) num.textContent = pad(i + 1);
          li.className = cardClass(i, vis.length);
        });
        var shown = vis.length;
        if (countB) countB.textContent = pad(shown);
        if (countS) countS.textContent = shown === 1 ? 'project' : 'projects';
        if (status) status.textContent = shown + (shown === 1 ? ' project' : ' projects') + ' shown';
        if (tabEl && tabEl.id) grid.setAttribute('aria-labelledby', tabEl.id);
      }
    }
    var pop = document.getElementById('wk-pop');
    var popData = [];
    var popEl = document.getElementById('wk-pop-data');
    var popReturn = null;
    var popIndex = 0;
    var popTimer = 0;
    if (popEl) { try { popData = JSON.parse(popEl.textContent) || []; } catch (err) { popData = []; } }
    function sequence() {
      if (!grid) return popData.map(function (_, i) { return i; });
      return $$(':scope > li', grid).filter(function (li) { return !li.hidden; }).map(function (li) {
        var link = $('a[data-wk-pop]', li);
        return link ? parseInt(link.getAttribute('data-wk-pop'), 10) : -1;
      }).filter(function (i) { return i >= 0 && popData[i]; });
    }
    function fillPop(item) {
      var kind = $('.wk-pop-kind', pop);
      var title = $('.wk-pop-title', pop);
      var body = $('.wk-pop-content', pop);
      var media = $('.wk-pop-media', pop);
      var go = $('.wk-pop-link', pop);
      if (kind) kind.textContent = item.kind || '';
      if (title) title.textContent = item.title || '';
      if (body) {
        body.replaceChildren();
        if (item.content) body.innerHTML = item.content;
        else if (item.role) {
          var para = document.createElement('p');
          para.textContent = item.role;
          body.appendChild(para);
        }
      }
      if (media) {
        media.replaceChildren();
        media.hidden = !item.image;
        if (item.image) {
          var img = document.createElement('img');
          img.src = item.image;
          img.alt = item.alt || '';
          media.appendChild(img);
        }
      }
      if (go) {
        if (item.href) {
          go.href = item.href;
          go.hidden = false;
        } else {
          go.hidden = true;
          go.removeAttribute('href');
        }
      }
    }
    function showPop(i, dir) {
      var item = popData[i];
      var stage = $('.wk-pop-stage', pop);
      var scroller = $('.wk-pop-scroll', pop);
      var navs = $$('.wk-pop-nav', pop);
      if (!item) return;
      function paint() {
        fillPop(item);
        popIndex = i;
        if (scroller) scroller.scrollTop = 0;
        navs.forEach(function (btn) { btn.hidden = sequence().length < 2; });
      }
      clearTimeout(popTimer);
      if (!dir || reduced() || !stage) { paint(); return; }
      stage.classList.remove('is-leave-next', 'is-leave-prev', 'is-enter-next', 'is-enter-prev');
      stage.style.transform = '';
      stage.style.transition = '';
      stage.classList.add(dir > 0 ? 'is-leave-next' : 'is-leave-prev');
      popTimer = setTimeout(function () {
        paint();
        stage.classList.remove('is-leave-next', 'is-leave-prev');
        stage.classList.add(dir > 0 ? 'is-enter-next' : 'is-enter-prev');
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            stage.classList.remove('is-enter-next', 'is-enter-prev');
          });
        });
      }, 180);
    }
    function stepPop(dir) {
      var seq = sequence();
      if (seq.length < 2) return;
      var at = seq.indexOf(popIndex);
      if (at < 0) at = 0;
      showPop(seq[(at + dir + seq.length) % seq.length], dir);
    }
    function openPop(i, opener) {
      if (!pop || !popData[i] || typeof pop.showModal !== 'function') return false;
      showPop(i, 0);
      popReturn = opener || null;
      if (!pop.open) pop.showModal();
      var closeBtn = $('[data-wk-close]', pop);
      if (closeBtn) closeBtn.focus();
      return true;
    }
    if (pop) {
      var swipe = null;
      var scroller = $('.wk-pop-scroll', pop);
      pop.addEventListener('click', function (e) {
        if (e.target === pop || e.target.closest('[data-wk-close]')) pop.close();
        else if (e.target.closest('.wk-pop-next')) stepPop(1);
        else if (e.target.closest('.wk-pop-prev')) stepPop(-1);
      });
      pop.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); stepPop(1); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); stepPop(-1); }
      });
      pop.addEventListener('close', function () {
        if (popReturn) popReturn.focus();
      });
      if (scroller) {
        scroller.addEventListener('pointerdown', function (e) {
          if (e.button !== 0 || e.target.closest('a, button')) return;
          swipe = { id: e.pointerId, x: e.clientX, y: e.clientY, mode: 'maybe' };
        });
        scroller.addEventListener('pointermove', function (e) {
          if (!swipe || e.pointerId !== swipe.id) return;
          var dx = e.clientX - swipe.x, dy = e.clientY - swipe.y;
          var stage = $('.wk-pop-stage', pop);
          if (swipe.mode === 'maybe') {
            if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
            if (Math.abs(dy) > Math.abs(dx)) { swipe = null; return; }
            swipe.mode = 'x';
            scroller.setPointerCapture(e.pointerId);
          }
          if (stage) {
            stage.style.transition = 'none';
            stage.style.transform = 'translateX(' + dx + 'px)';
          }
          swipe.dx = dx;
        });
        function endSwipe(e) {
          if (!swipe || e.pointerId !== swipe.id || swipe.mode !== 'x') { swipe = null; return; }
          var dx = swipe.dx || 0;
          var stage = $('.wk-pop-stage', pop);
          swipe = null;
          if (stage) { stage.style.transition = ''; stage.style.transform = ''; }
          if (dx <= -56) stepPop(1);
          else if (dx >= 56) stepPop(-1);
        }
        scroller.addEventListener('pointerup', endSwipe);
        scroller.addEventListener('pointercancel', endSwipe);
      }
    }
    if (grid) {
      grid.addEventListener('click', function (e) {
        var link = e.target.closest('a[data-wk-pop]');
        if (!link || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        var i = parseInt(link.getAttribute('data-wk-pop'), 10);
        if (openPop(i, link)) e.preventDefault();
      });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { apply(t.getAttribute('data-filter'), t); });
      t.addEventListener('keydown', function (e) {
        var i = tabs.indexOf(t), next = -1;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') next = 0;
        else if (e.key === 'End') next = tabs.length - 1;
        if (next < 0) return;
        e.preventDefault();
        tabs[next].focus();
        apply(tabs[next].getAttribute('data-filter'), tabs[next]);
      });
    });
  })();

  /* ---------- Services: expanding pillars ---------- */
  (function () {
    var pills = $$('.sv-p');
    if (!pills.length) return;
    var tabs = $$('.sv-tab'), jumps = $$('.sv-jump a');
    var hoverLockUntil = 0;
    function pick(i, opts) {
      opts = opts || {};
      pills.forEach(function (p, j) { p.classList.toggle('is-on', i === j); });
      tabs.forEach(function (t, j) { t.setAttribute('aria-expanded', String(i === j)); });
      jumps.forEach(function (a, j) {
        if (j === i) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
      if (opts.lockHover) hoverLockUntil = Date.now() + 700;
      if (opts.scroll && pills[i]) {
        pills[i].scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'nearest' });
      }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { pick(i, { lockHover: true }); });
      t.addEventListener('mouseenter', function () {
        if (Date.now() < hoverLockUntil) return;
        pick(i);
      });
    });
    jumps.forEach(function (a, i) {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        pick(i, { lockHover: true, scroll: true });
        if (history && history.replaceState) {
          history.replaceState(null, '', a.getAttribute('href') || '#sv-pillars');
        }
      });
    });
  })();

  /* ---------- About: principles, one open at a time ---------- */
  (function () {
    var rules = $$('.ab-rule');
    if (!rules.length) return;
    rules.forEach(function (r) {
      var q = $('.ab-q', r);
      q.addEventListener('click', function () {
        var open = !r.classList.contains('is-open');
        rules.forEach(function (x) { x.classList.remove('is-open'); $('.ab-q', x).setAttribute('aria-expanded', 'false'); });
        if (open) { r.classList.add('is-open'); q.setAttribute('aria-expanded', 'true'); }
      });
    });
  })();

  /* ---------- Legal: Privacy / Terms switch (also opens Terms from #terms) ---------- */
  (function () {
    var docs = $$('section[data-doc]');
    if (!docs.length) return;
    var btns = $$('.lg-switch button'), h1 = $('#lg-title');
    var titles = { privacy: 'Privacy policy', terms: 'Terms of service' };
    function show(which) {
      docs.forEach(function (d) { d.hidden = d.getAttribute('data-doc') !== which; });
      btns.forEach(function (b, i) { b.setAttribute('aria-pressed', String((i === 0 ? 'privacy' : 'terms') === which)); });
      h1.textContent = titles[which];
      document.title = titles[which] + ' | MaltaVisions';
    }
    btns.forEach(function (b, i) { b.addEventListener('click', function () { show(i === 0 ? 'privacy' : 'terms'); }); });
    if (/^#terms/.test(location.hash)) show('terms');
  })();

})();
