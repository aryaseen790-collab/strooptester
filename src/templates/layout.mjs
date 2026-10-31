// HTML shell shared by every page.
export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// page.L is the page's locale (English unless a translated page says otherwise).
// page.alternates lists the language versions of this page for hreflang.
// page.languages lists every locale, for the language menu.
export function layout(site, page) {
  const L = page.L;
  const T = L.layout;
  const home = L.code === 'en' ? '/' : `/${L.code}/`;
  const url = site.url + page.path;
  const title = page.fullTitle || page.title === site.name ? page.title : `${page.title} | ${site.name}`;
  const image = site.url + (page.image || site.ogImage);
  const jsonld = (page.schema || []).map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n');
  const NAV = [
    [`${home}#test`, T.nav.test, 'test'],
    [`${home}#about`, T.nav.how, 'about'],
    ['/blog/', T.nav.blog, 'blog'],
    ['/about/', T.nav.about, 'about-page'],
    [`${home}#faq`, T.nav.faq, 'faq'],
  ];
  const nav = NAV.map(([href, label, key]) => `<li><a href="${href}"${page.nav === key ? ' aria-current="page"' : ''}>${label}</a></li>`).join('');
  const alternates = page.alternates || [];
  const hreflang = alternates.length
    ? alternates.map((a) => `<link rel="alternate" hreflang="${a.lang}" href="${site.url}${a.path}">`).join('\n') +
      `\n<link rel="alternate" hreflang="x-default" href="${site.url}${alternates.find((a) => a.lang === 'en').path}">`
    : '';
  const ogAlt = alternates.filter((a) => a.lang !== L.lang).map((a) => `<meta property="og:locale:alternate" content="${a.ogLocale}">`).join('\n');
  const langs = page.languages || [];
  const langLinks = langs
    .map((x) => `<li><a href="${x.code === 'en' ? '/' : `/${x.code}/`}" hreflang="${x.lang}" lang="${x.lang}"${x.code === L.code ? ' aria-current="true"' : ''}>${x.name}</a></li>`)
    .join('');
  const keywords = page.keywords?.length ? `<meta name="keywords" content="${esc(page.keywords.join(', '))}">` : '';
  const tags = (page.tags || []).map((k) => `<meta property="article:tag" content="${esc(k)}">`).join('\n');

  return `<!doctype html>
<html lang="${L.lang}" dir="${L.dir}" data-ga="${esc(site.gaId || '')}" data-base="${esc((process.env.BASE_PATH || '').replace(/\/+$/, ''))}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
${keywords}
<link rel="canonical" href="${url}">
${hreflang}
${page.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">'}
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="theme-color" content="#ffffff">
<meta name="color-scheme" content="light">
${site.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(site.googleSiteVerification)}">` : ''}
<meta property="og:locale" content="${L.ogLocale}">
${ogAlt}
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
${page.imageAlt ? `<meta property="og:image:alt" content="${esc(page.imageAlt)}">` : ''}
${page.published ? `<meta property="article:published_time" content="${page.published}">\n<meta property="article:modified_time" content="${page.modified}">` : ''}
${tags}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(page.title)}">
<meta name="twitter:description" content="${esc(page.description)}">
<meta name="twitter:image" content="${image}">
<link rel="icon" href="/wp-content/uploads/2026/05/cropped-strooptester-icon-32x32.webp" sizes="32x32">
<link rel="icon" href="/wp-content/uploads/2026/05/cropped-strooptester-icon-192x192.webp" sizes="192x192">
<link rel="apple-touch-icon" href="/wp-content/uploads/2026/05/cropped-strooptester-icon-180x180.webp">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} blog" href="/feed.xml">
<link rel="alternate" type="text/plain" title="LLM-readable summary" href="/llms.txt">
<link rel="stylesheet" href="/assets/css/site.css?v=${page.version}">
${page.head || ''}
${jsonld}
</head>
<body>
<a class="skip" href="#main">${T.skip}</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="${home}" aria-label="${esc(site.name)}">
      <img src="/wp-content/uploads/2026/05/cropped-strooptester-icon-192x192.webp" width="38" height="38" alt="">
      <span>strooptester.com</span>
    </a>
    <details class="lang-menu">
      <summary aria-label="${esc(T.languages)}"><svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="M3 12h18M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" fill="none" stroke="currentColor" stroke-width="1.8"/></svg><span>${L.code.toUpperCase()}</span></summary>
      <ul>${langLinks}</ul>
    </details>
    <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav"><span class="visually-hidden">${T.menu}</span><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul>${nav}<li><a class="btn" href="${home}#test">${T.nav.start}</a></li></ul>
    </nav>
  </div>
</header>
<main id="main">
${page.body}
</main>
<footer class="site-footer">
  <div class="wrap">
    <div class="grid">
      <div>
        <h2>Stroop Tester</h2>
        <p>${T.tagline} ${T.research}</p>
        <p class="note">${T.disclaimer}</p>
      </div>
      <div>
        <h2>${T.explore}</h2>
        <ul>
          <li><a href="${home}#test">${T.exploreLinks.test}</a></li>
          <li><a href="/blog/">${T.exploreLinks.blog}</a></li>
          <li><a href="/what-is-the-stroop-test/">${T.exploreLinks.what}</a></li>
          <li><a href="/good-stroop-test-score/">${T.exploreLinks.score}</a></li>
        </ul>
      </div>
      <div>
        <h2>${T.site}</h2>
        <ul>
          <li><a href="/about/">${T.siteLinks.about}</a></li>
          <li><a href="/contact/">${T.siteLinks.contact}</a></li>
          <li><a href="/privacy-policy/">${T.siteLinks.privacy}</a></li>
          <li><button class="linklike" type="button" data-consent-reset>${T.siteLinks.cookies}</button></li>
        </ul>
      </div>
    </div>
    <nav class="footer-langs" aria-label="${esc(T.languages)}"><h2>${T.languages}</h2><ul>${langLinks}</ul></nav>
    <p class="legal">© ${new Date().getFullYear()} Stroop Tester. ${T.copyright}</p>
  </div>
</footer>
<div class="consent" id="consent" role="dialog" aria-live="polite" aria-label="Cookies" hidden>
  <p>${T.consent} <a href="/privacy-policy/">${T.privacyLink}</a></p>
  <div class="actions"><button class="btn" data-consent="yes">${T.allow}</button><button class="btn btn--ghost" data-consent="no">${T.deny}</button></div>
</div>
<script src="/assets/js/site.js?v=${page.version}" defer></script>
<script src="/assets/js/motion.js?v=${page.version}" defer></script>
${page.scripts || ''}
</body>
</html>
`;
}
