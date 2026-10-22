// Genera les pàgines multilingüe a partir de src/templates i src/i18n.
//   ca → /            es → /es/            en → /en/
// Ús: node build.mjs   (o: npm run build)
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://www.babu.cat';
const ROOT = path.dirname(new URL(import.meta.url).pathname);

const LANGS = {
  ca: { prefix: '', locale: 'ca_ES', code: 'CA', name: 'Català' },
  es: { prefix: '/es', locale: 'es_ES', code: 'ES', name: 'Español' },
  en: { prefix: '/en', locale: 'en_US', code: 'EN', name: 'English' },
};
const DEFAULT_LANG = 'ca';
const PAGES = {
  index: { template: 'index.html', path: '/' },
  cookies: { template: 'cookies.html', path: '/cookies/' },
};

const dict = {};
for (const l of Object.keys(LANGS)) {
  dict[l] = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/i18n', `${l}.json`), 'utf8'));
}
// Totes les llengües han de tenir les mateixes claus
const base = Object.keys(dict[DEFAULT_LANG]).sort().join('\n');
for (const l of Object.keys(LANGS)) {
  const keys = Object.keys(dict[l]);
  const missing = Object.keys(dict[DEFAULT_LANG]).filter((k) => !keys.includes(k));
  const extra = keys.filter((k) => !(k in dict[DEFAULT_LANG]));
  if (missing.length || extra.length) {
    throw new Error(`[${l}] claus que falten: ${missing.join(', ') || '-'} · claus de més: ${extra.join(', ') || '-'}`);
  }
}

const urlOf = (lang, page) => LANGS[lang].prefix + PAGES[page].path;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function hreflangLinks(page) {
  const lines = Object.keys(LANGS).map(
    (l) => `<link rel="alternate" hreflang="${l}" href="${SITE}${urlOf(l, page)}">`
  );
  lines.push(`<link rel="alternate" hreflang="x-default" href="${SITE}${urlOf(DEFAULT_LANG, page)}">`);
  return lines.join('\n\t');
}

// Selector compacte: idioma actual + desplegable (<details>) amb les altres llengües
function langSwitcher(lang, page) {
  const links = Object.keys(LANGS)
    .filter((l) => l !== lang)
    .map((l) => {
      const { code, name } = LANGS[l];
      return `<a href="${urlOf(l, page)}" hreflang="${l}" lang="${l}" aria-label="${name}" title="${name}" class="block px-3 py-2 text-center text-gray-300 hover:text-orange-400 hover:bg-gray-800/70">${code}</a>`;
    });
  const label = esc(dict[lang].lang_nav_label);
  const { code, name } = LANGS[lang];
  return `<nav aria-label="${label}" class="relative font-mono text-xs"><details class="lang-menu group">` +
    `<summary aria-label="${label}: ${name}" class="flex items-center gap-1 px-2 py-1.5 rounded-md text-gray-300 hover:text-orange-400 cursor-pointer list-none [&::-webkit-details-marker]:hidden">` +
    `<span lang="${lang}">${code}</span>` +
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="transition-transform group-open:rotate-180" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></summary>` +
    `<div class="absolute right-0 top-full mt-1 z-50 min-w-[3.5rem] py-1 rounded-lg border border-gray-700 bg-[#0c101a] shadow-xl">${links.join('')}</div>` +
    `</details></nav>`;
}

function render(tpl, lang, page) {
  const d = dict[lang];
  const derived = {
    lang,
    url: SITE + urlOf(lang, page),
    home: LANGS[lang].prefix + '/',
    cookies_url: urlOf(lang, 'cookies'),
    og_locale: LANGS[lang].locale,
    hreflang_links: hreflangLinks(page),
    lang_switcher: langSwitcher(lang, page),
  };
  const vars = { ...d, ...derived };
  const used = new Set();
  let out = tpl;
  // Es resol en diverses passades perquè un valor pot contenir {{home}}, etc.
  for (let pass = 0; pass < 3 && /\{\{/.test(out); pass++) {
    out = out.replace(/\{\{(js:)?([a-z0-9_]+)\}\}/g, (m, js, key) => {
      if (!(key in vars)) throw new Error(`[${lang}/${page}] falta la clau "${key}"`);
      used.add(key);
      const v = String(vars[key]);
      // Dins d'un literal JS: s'escapa i es protegeix de </script>
      return js ? JSON.stringify(v).slice(1, -1).replace(/</g, '\\u003c') : v;
    });
  }
  if (/\{\{/.test(out)) throw new Error(`[${lang}/${page}] queden marcadors sense resoldre`);
  return { out, used };
}

const usedAll = new Set();
for (const [page, def] of Object.entries(PAGES)) {
  const tpl = fs.readFileSync(path.join(ROOT, 'src/templates', def.template), 'utf8');
  for (const lang of Object.keys(LANGS)) {
    const { out, used } = render(tpl, lang, page);
    used.forEach((k) => usedAll.add(k));
    const dir = path.join(ROOT, LANGS[lang].prefix, def.path);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'index.html'), out);
    console.log('·', path.relative(ROOT, path.join(dir, 'index.html')));
  }
}
usedAll.add('lang_nav_label'); // s'usa dins langSwitcher()
const unused = Object.keys(dict[DEFAULT_LANG]).filter((k) => !usedAll.has(k));
if (unused.length) console.warn('Avís: claus sense ús:', unused.join(', '));
