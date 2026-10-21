/* Gestió de consentiment i càrrega condicionada de Google Analytics.
   GA NO es carrega fins que l'usuari accepta. */
(function () {
  'use strict';
  var GA_ID = 'G-BSGMJPK87J';
  var KEY = 'babu-consent-v1';
  var MAX_AGE = 365 * 24 * 3600 * 1000; // 12 mesos
  var loaded = false;

  function read() {
    try {
      var d = JSON.parse(localStorage.getItem(KEY));
      if (d && (d.v === 'granted' || d.v === 'denied') && Date.now() - d.t < MAX_AGE) return d.v;
    } catch (e) {}
    return null;
  }
  function write(v) {
    try { localStorage.setItem(KEY, JSON.stringify({ v: v, t: Date.now() })); } catch (e) {}
  }
  function loadGA() {
    if (loaded) return;
    loaded = true;
    window['ga-disable-' + GA_ID] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);
  }
  function deleteCookies() {
    var host = location.hostname.split('.');
    var domains = [location.hostname, '.' + location.hostname];
    if (host.length > 2) domains.push('.' + host.slice(-2).join('.'));
    document.cookie.split(';').forEach(function (c) {
      var n = c.split('=')[0].trim();
      if (n === '_ga' || n.indexOf('_ga_') === 0 || n === '_gid' || n.indexOf('_gat') === 0) {
        domains.forEach(function (d) {
          document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=' + d;
        });
        document.cookie = n + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      }
    });
  }

  var banner = null, lastFocus = null;
  function close() {
    if (banner) { banner.remove(); banner = null; }
    if (lastFocus && document.contains(lastFocus)) { try { lastFocus.focus(); } catch (e) {} }
    lastFocus = null;
  }
  function decide(v) {
    write(v);
    if (v === 'granted') loadGA();
    else {
      window['ga-disable-' + GA_ID] = true;
      deleteCookies();
      if (loaded) location.reload(); // atura el GA ja carregat en aquesta pàgina
    }
    close();
  }
  function open() {
    if (banner) return;
    lastFocus = document.activeElement;
    banner = document.createElement('div');
    banner.className = 'cc-banner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-labelledby', 'cc-title');
    banner.setAttribute('aria-describedby', 'cc-text');
    banner.innerHTML =
      '<h2 id="cc-title">Cookies d\'analítica</h2>' +
      '<p id="cc-text">Faig servir cookies d\'analícia per saber, de manera agregada, com es fa servir aquesta web. ' +
      'Només s\'activa si ho acceptes. <a href="/cookies/">Més informació</a>.</p>' +
      '<div class="cc-actions"><button type="button" data-cc="denied">Rebutja</button>' +
      '<button type="button" data-cc="granted">Accepta</button></div>';
    banner.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cc]');
      if (b) decide(b.getAttribute('data-cc'));
    });
    banner.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    document.body.appendChild(banner);
    var first = banner.querySelector('button');
    if (lastFocus && lastFocus !== document.body) first.focus({ preventScroll: true });
  }

  window.BabuConsent = { open: open, state: read };

  function init() {
    var s = read();
    if (s === 'granted') loadGA();
    else if (s === null) open();
    else window['ga-disable-' + GA_ID] = true;
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-cc-open]')) { e.preventDefault(); open(); }
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
