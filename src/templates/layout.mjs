// HTML shell shared by every page.
export const esc = (s = '') =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const NAV = [
  ['/#test', 'Take the test', 'test'],
  ['/#about', 'How it works', 'about'],
  ['/blog/', 'Blog', 'blog'],
  ['/about/', 'About', 'about-page'],
  ['/#faq', 'FAQs', 'faq'],
];

export function layout(site, page) {
  const url = site.url + page.path;
  const title = page.title === site.name ? site.name : `${page.title} | ${site.name}`;
  const image = site.url + (page.image || site.ogImage);
  const jsonld = (page.schema || []).map((s) => `<script type="application/ld+json">${JSON.stringify(s).replace(/</g, '\\u003c')}</script>`).join('\n');
  const nav = NAV.map(
    ([href, label, key]) => `<li><a href="${href}"${page.nav === key ? ' aria-current="page"' : ''}>${label}</a></li>`,
  ).join('');
  return `<!doctype html>
<html lang="${site.lang}" data-ga="${esc(site.gaId || '')}" data-base="${esc((process.env.BASE_PATH || '').replace(/\/+$/, ''))}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.description)}">
<link rel="canonical" href="${url}">
${page.noindex ? '<meta name="robots" content="noindex, follow">' : '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">'}
<meta name="referrer" content="strict-origin-when-cross-origin">
<meta name="theme-color" content="#ffffff">
<meta name="color-scheme" content="light">
${site.googleSiteVerification ? `<meta name="google-site-verification" content="${esc(site.googleSiteVerification)}">` : ''}
<meta property="og:locale" content="${site.locale}">
<meta property="og:type" content="${page.ogType || 'website'}">
<meta property="og:site_name" content="${esc(site.name)}">
<meta property="og:title" content="${esc(page.title)}">
<meta property="og:description" content="${esc(page.description)}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${image}">
${page.imageAlt ? `<meta property="og:image:alt" content="${esc(page.imageAlt)}">` : ''}
${page.published ? `<meta property="article:published_time" content="${page.published}">\n<meta property="article:modified_time" content="${page.modified}">` : ''}
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/wp-content/uploads/2026/05/cropped-strooptester-icon-32x32.webp" sizes="32x32">
<link rel="icon" href="/wp-content/uploads/2026/05/cropped-strooptester-icon-192x192.webp" sizes="192x192">
<link rel="apple-touch-icon" href="/wp-content/uploads/2026/05/cropped-strooptester-icon-180x180.webp">
<link rel="manifest" href="/site.webmanifest">
<link rel="alternate" type="application/rss+xml" title="${esc(site.name)} blog" href="/feed.xml">
<link rel="stylesheet" href="/assets/css/site.css?v=${page.version}">
${page.head || ''}
${jsonld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header class="site-header">
  <div class="wrap">
    <a class="brand" href="/" aria-label="${esc(site.name)} home">
      <img src="/wp-content/uploads/2026/05/cropped-strooptester-icon-192x192.webp" width="38" height="38" alt="">
      <span>strooptester.com</span>
    </a>
    <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav"><span class="visually-hidden">Menu</span><svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
    <nav class="site-nav" id="site-nav" aria-label="Main">
      <ul>${nav}<li><a class="btn" href="/#test">Start free test</a></li></ul>
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
        <p>${esc(site.tagline)} Built on research going back to J. R. Stroop's 1935 paper.</p>
        <p class="note">Educational use only. This site does not diagnose any condition. If you are worried about your attention, memory or thinking, talk to a qualified health professional.</p>
      </div>
      <div>
        <h2>Explore</h2>
        <ul>
          <li><a href="/#test">Stroop test online</a></li>
          <li><a href="/blog/">Blog</a></li>
          <li><a href="/what-is-the-stroop-test/">What is the Stroop test?</a></li>
          <li><a href="/good-stroop-test-score/">What is a good score?</a></li>
        </ul>
      </div>
      <div>
        <h2>Site</h2>
        <ul>
          <li><a href="/about/">About &amp; editorial standards</a></li>
          <li><a href="/contact/">Contact</a></li>
          <li><a href="/privacy-policy/">Privacy policy</a></li>
          <li><button class="linklike" type="button" data-consent-reset>Cookie settings</button></li>
        </ul>
      </div>
    </div>
    <p class="legal">© ${new Date().getFullYear()} Stroop Tester. Text and images on this site are the property of Stroop Tester unless noted otherwise.</p>
  </div>
</footer>
<div class="consent" id="consent" role="dialog" aria-live="polite" aria-label="Cookie choice" hidden>
  <p>We'd like to use Google Analytics to count visits and see which pages help people. It sets cookies, so it only runs if you say yes. Your test answers are never sent anywhere either way. <a href="/privacy-policy/">Privacy policy</a></p>
  <div class="actions"><button class="btn" data-consent="yes">Allow analytics</button><button class="btn btn--ghost" data-consent="no">No thanks</button></div>
</div>
<script src="/assets/js/site.js?v=${page.version}" defer></script>
<script src="/assets/js/motion.js?v=${page.version}" defer></script>
${page.scripts || ''}
</body>
</html>
`;
}
