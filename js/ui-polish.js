(function () {
  'use strict';

  function enhanceToolCard(card) {
    var name = card.querySelector('.tc-name');
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    if (name && !card.getAttribute('aria-label')) card.setAttribute('aria-label', '打开' + name.textContent.trim());
    card.addEventListener('pointermove', function (event) {
      if (event.pointerType && event.pointerType !== 'mouse') return;
      var rect = card.getBoundingClientRect();
      card.style.setProperty('--glow-x', (event.clientX - rect.left) + 'px');
      card.style.setProperty('--glow-y', (event.clientY - rect.top) + 'px');
    });
    card.addEventListener('pointerleave', function () {
      card.style.removeProperty('--glow-x');
      card.style.removeProperty('--glow-y');
    });
  }

  function enhanceOverlays() {
    document.querySelectorAll('.tool-overlay').forEach(function (overlay) {
      if (!overlay.hasAttribute('role')) overlay.setAttribute('role', 'dialog');
      if (!overlay.hasAttribute('aria-modal')) overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-hidden', overlay.classList.contains('active') ? 'false' : 'true');
      new MutationObserver(function () {
        overlay.setAttribute('aria-hidden', overlay.classList.contains('active') ? 'false' : 'true');
      }).observe(overlay, { attributes: true, attributeFilter: ['class'] });
    });
  }

  function init() {
    document.documentElement.classList.add('dw-ui-polished');
    document.querySelectorAll('.tool-card').forEach(enhanceToolCard);
    enhanceOverlays();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
