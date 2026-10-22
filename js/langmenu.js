/* Selector d'idioma (<details>): es tanca amb Esc, clic fora o en perdre el focus. */
(function () {
  'use strict';
  function menus() { return document.querySelectorAll('details.lang-menu[open]'); }
  document.addEventListener('click', function (e) {
    menus().forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
  });
  document.addEventListener('focusin', function (e) {
    menus().forEach(function (d) { if (!d.contains(e.target)) d.open = false; });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    menus().forEach(function (d) { d.open = false; d.querySelector('summary').focus(); });
  });
})();
