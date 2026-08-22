(function () {
  'use strict';

  var STORAGE_KEY = 'daowen-color-theme';
  var THEMES = ['day', 'noon', 'night'];
  var transitionTimer = 0;

  function validTheme(value) {
    return THEMES.indexOf(value) >= 0 ? value : 'night';
  }

  function updateButtons(theme) {
    document.querySelectorAll('[data-dw-theme-choice]').forEach(function (button) {
      button.setAttribute('aria-pressed', button.getAttribute('data-dw-theme-choice') === theme ? 'true' : 'false');
    });
  }

  function applyTheme(theme, persist, animate) {
    theme = validTheme(theme);
    if (animate) {
      document.documentElement.classList.add('dw-theme-transition');
      clearTimeout(transitionTimer);
      transitionTimer = setTimeout(function () {
        document.documentElement.classList.remove('dw-theme-transition');
      }, 540);
    }
    document.documentElement.setAttribute('data-dw-theme', theme);
    updateButtons(theme);
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, theme); } catch (error) {}
    }
    document.dispatchEvent(new CustomEvent('daowen:themechange', { detail: { theme: theme } }));
  }

  function init() {
    var initial = validTheme(document.documentElement.getAttribute('data-dw-theme'));
    applyTheme(initial, false, false);
    document.querySelectorAll('[data-dw-theme-choice]').forEach(function (button) {
      button.addEventListener('click', function () {
        applyTheme(button.getAttribute('data-dw-theme-choice'), true, true);
      });
    });
  }

  window.DaoWenTheme = { set: function (theme) { applyTheme(theme, true, true); }, get: function () { return validTheme(document.documentElement.getAttribute('data-dw-theme')); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
