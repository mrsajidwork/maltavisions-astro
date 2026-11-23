/* Contact block: swap the CF7 form for the reference thank-you state after a successful send. */
(function () {
  'use strict';
  function field(detail, name) {
    var hit = (detail && detail.inputs || []).filter(function (i) { return i.name === name; })[0];
    return hit ? String(hit.value || '').trim() : '';
  }
  document.addEventListener('wpcf7mailsent', function (e) {
    var wrap = e.target.closest('.wpcf7') || e.target;
    var card = wrap.closest('.ct-card');
    if (!card) return;
    var done = card.querySelector('.ct-done');
    if (!done) return;
    done.querySelector('[data-ct-who]').textContent = field(e.detail, 'your-name').split(' ')[0] || 'there';
    done.querySelector('[data-ct-email]').textContent = field(e.detail, 'your-email');
    wrap.hidden = true;
    done.hidden = false;
    var h = done.querySelector('h3');
    h.setAttribute('tabindex', '-1');
    h.focus();
  });
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.ct .ct-reset');
    if (!btn) return;
    var card = btn.closest('.ct-card');
    var wrap = card.querySelector('.wpcf7');
    card.querySelector('.ct-done').hidden = true;
    if (wrap) {
      wrap.hidden = false;
      var first = wrap.querySelector('.ct-input, textarea');
      if (first) first.focus();
    }
  });
})();
