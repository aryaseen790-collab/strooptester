// Static site build: src/ + static/ -> dist/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { marked } from 'marked';
import { layout, esc } from '../src/templates/layout.mjs';
import { homePage } from '../src/templates/home.mjs';
import { LOCALES, EN } from '../src/i18n/index.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(SRC, 'data/site.json'), 'utf8'));
// Set when the site is served from a sub-folder, e.g. "/strooptester" on username.github.io
// before the custom domain is connected. Empty for strooptester.com itself.
const BASE = (process.env.BASE_PATH || '').replace(/\/+$/, '');
const images = JSON.parse(fs.readFileSync(path.join(SRC, 'data/images.json'), 'utf8'));
const LANGS = LOCALES.map(({ code, lang, name }) => ({ code, lang, name }));
const homePath = (L) => (L.code === 'en' ? '/' : `/${L.code}/`);
const HOME_ALTERNATES = LOCALES.map((L) => ({ lang: L.lang, path: homePath(L), ogLocale: L.ogLocale }));
// Every page goes through here; English unless a locale is passed.
const page = (opts) => layout(site, { L: EN, languages: LANGS, ...opts });

marked.use({ gfm: true, mangle: false, headerIds: false });

// ---------- helpers ----------

const write = (rel, content) => {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
};
const copyDir = (from, to) => fs.cpSync(from, to, { recursive: true });
const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/<[^>]+>/g, '')
    .replace(/&[a-z]+;/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
const stripTags = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const decode = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

export function picture(src, alt, { sizes = '(max-width: 760px) 100vw, 720px', eager = false, cls = '' } = {}) {
  const info = images[src];
  if (!info) throw new Error(`Unknown image ${src} (add it to static/ and src/data/images.json)`);
  const set = [...info.variants.map((v) => `${v.src} ${v.w}w`), `${src} ${info.w}w`].join(', ');
  const fallback = info.variants.find((v) => v.w === 1024)?.src || src;
  return `<img${cls ? ` class="${cls}"` : ''} src="${fallback}" srcset="${set}" sizes="${sizes}" width="${info.w}" height="${info.h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
}

function frontMatter(raw, file) {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) throw new Error(`Missing front matter in ${file}`);
  const data = {};
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':');
    if (i > 0) data[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^"(.*)"$/, '$1');
  }
  return { data, body: m[2] };
}

const ctaBlock = (text = 'See your own interference score in about two minutes. Free, no sign-up, and your answers stay in your browser.') =>
  `<div class="cta-inline no-print"><p>${text}</p><a class="btn" href="/#test">Take the free Stroop test</a></div>`;

// Markdown -> HTML with figures, heading ids, CTA blocks and an extracted FAQ.
function renderMarkdown(md) {
  const ctas = [];
  md = md.replace(/^\{\{cta(?::\s*(.+?))?\}\}$/gm, (_, text) => {
    ctas.push(ctaBlock(text));
    return `\n\nCTA_${ctas.length - 1}\n\n`;
  });
  let html = marked.parse(md);
  html = html.replace(/<p>CTA_(\d+)<\/p>/g, (_, i) => ctas[+i]);
  html = html.replace(/<p><img src="([^"]+)" alt="([^"]*)"(?: title="([^"]*)")?><\/p>/g, (_, src, alt, cap) => {
    return `<figure>${picture(src, decode(alt))}${cap ? `<figcaption>${cap}</figcaption>` : ''}</figure>`;
  });
  const toc = [];
  html = html.replace(/<h([23])>(.*?)<\/h\1>/g, (_, level, inner) => {
    const id = slugify(inner);
    if (level === '2') toc.push({ id, text: stripTags(decode(inner)) });
    return `<h${level} id="${id}">${inner}</h${level}>`;
  });
  // External links open normally but don't leak referrers beyond the origin.
  html = html.replace(/<a href="(https?:\/\/(?!strooptester\.com)[^"]+)"/g, '<a href="$1" rel="noopener"');

  const faq = [];
  const faqStart = html.search(/<h2 id="[^"]*">Frequently asked questions<\/h2>/i);
  if (faqStart >= 0) {
    const tail = html.slice(faqStart);
    const end = tail.slice(5).search(/<h2 /);
    const block = end >= 0 ? tail.slice(0, end + 5) : tail;
    const items = [...block.matchAll(/<h3 id="[^"]*">(.*?)<\/h3>([\s\S]*?)(?=<h3 |$)/g)];
    const rendered = items
      .map(([, q, a]) => {
        faq.push({ q: stripTags(decode(q)), a: stripTags(decode(a)) });
        return `<details><summary>${q}</summary><div>${a.trim()}</div></details>`;
      })
      .join('\n');
    const heading = block.match(/^<h2[^>]*>.*?<\/h2>/)[0];
    html = html.slice(0, faqStart) + `${heading}<div class="faq">${rendered}</div>` + html.slice(faqStart + block.length);
  }
  return { html, toc, faq };
}

const words = (html) => stripTags(html).split(' ').length;

// ---------- schema ----------

const org = {
  '@type': 'Organization',
  '@id': `${site.url}/#org`,
  name: site.name,
  url: `${site.url}/`,
  logo: { '@type': 'ImageObject', url: site.url + site.logo, width: 1408, height: 768 },
  email: site.contactEmail,
};
const website = { '@type': 'WebSite', '@id': `${site.url}/#website`, name: site.name, url: `${site.url}/`, publisher: { '@id': `${site.url}/#org` }, inLanguage: 'en' };
const graph = (...nodes) => [{ '@context': 'https://schema.org', '@graph': [org, website, ...nodes] }];
const breadcrumbs = (items) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, p], i) => ({ '@type': 'ListItem', position: i + 1, name, item: site.url + p })),
});
const faqSchema = (faq) =>
  faq.length
    ? { '@type': 'FAQPage', mainEntity: faq.map(({ q, a }) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) }
    : null;

// ---------- content ----------

function loadPosts() {
  const dir = path.join(SRC, 'content/posts');
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .map((f) => {
      const { data, body } = frontMatter(fs.readFileSync(path.join(dir, f), 'utf8'), f);
      const slug = f.replace(/\.md$/, '');
      if (!site.categories[data.category]) throw new Error(`${f}: unknown category ${data.category}`);
      const rendered = renderMarkdown(body);
      const keywordList = (data.keywords || '').split(',').map((k) => k.trim()).filter(Boolean);
      return { ...data, keywordList, slug, path: `/${slug}/`, ...rendered, words: words(rendered.html), source: body };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

function postCard(p, heading = 'h3') {
  const cat = site.categories[p.category];
  return `<article class="post-card">
  <a href="${p.path}" tabindex="-1" aria-hidden="true">${picture(p.image, p.imageAlt, { sizes: '(max-width: 760px) 100vw, 380px' })}</a>
  <div class="post-card__body">
    <a class="chip" href="/category/${p.category}/">${esc(cat.name)}</a>
    <${heading}><a href="${p.path}">${esc(p.title)}</a></${heading}>
    <p>${esc(p.excerpt)}</p>
    <span class="meta"><time datetime="${p.date}">${fmtDate(p.date)}</time> · ${Math.max(1, Math.round(p.words / 230))} min read</span>
  </div>
</article>`;
}

function postPage(p, posts, version) {
  const cat = site.categories[p.category];
  const related = posts.filter((x) => x.slug !== p.slug).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 3);
  const toc = p.toc.length > 2
    ? `<nav class="toc" aria-label="On this page"><h2>On this page</h2><ol>${p.toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('')}</ol>
       <div class="cta-box"><p><strong>Try it yourself.</strong> The free test takes about two minutes and gives you your interference score straight away.</p><a class="btn btn--light" href="/#test">Start the test</a></div></nav>`
    : '';
  const summary = p.summary
    ? `<aside class="keypoints"><p class="keypoints__title">In short</p><ul>${p.summary
        .split('|')
        .map((x) => `<li>${esc(x.trim())}</li>`)
        .join('')}</ul></aside>`
    : '';
  const body = `
<div class="read-progress" aria-hidden="true"><span></span></div>
<div class="wrap">
  <header class="article-head">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><ol><li><a href="/">Home</a></li><li><a href="/blog/">Blog</a></li><li><a href="/category/${p.category}/">${esc(cat.name)}</a></li></ol></nav>
    <h1>${esc(p.title)}</h1>
    <div class="byline">
      <span>By the <a href="/about/">Stroop Tester editorial team</a></span>
      <span>Published <time datetime="${p.date}">${fmtDate(p.date)}</time></span>
      ${p.updated && p.updated !== p.date ? `<span>Updated <time datetime="${p.updated}">${fmtDate(p.updated)}</time></span>` : ''}
      <span>${Math.max(1, Math.round(p.words / 230))} min read</span>
    </div>
  </header>
  <figure class="article__feature">${picture(p.image, p.imageAlt, { sizes: '(max-width: 1160px) 100vw, 1120px', eager: true })}</figure>
  <div class="article">
    <article class="article__body">${summary}${p.html}
      <p class="note"><em>This article is for general education. It is not medical advice, and an online test cannot diagnose any condition.</em></p>
    </article>
    <aside>${toc}</aside>
  </div>
</div>
<section class="related"><div class="wrap"><h2>Keep reading</h2><div class="post-grid">${related.map((r) => postCard(r)).join('')}</div></div></section>`;
  const posting = {
    '@type': 'BlogPosting',
    '@id': `${site.url}${p.path}#article`,
    headline: p.title,
    description: p.description,
    image: site.url + p.image,
    datePublished: p.date,
    dateModified: p.updated || p.date,
    author: { '@id': `${site.url}/#org` },
    publisher: { '@id': `${site.url}/#org` },
    mainEntityOfPage: site.url + p.path,
    articleSection: cat.name,
    wordCount: p.words,
    inLanguage: 'en',
    keywords: p.keywordList.join(', '),
    abstract: p.summary ? p.summary.split('|').map((x) => x.trim()).join(' ') : undefined,
  };
  return page({
    path: p.path,
    title: p.seoTitle || p.title,
    description: p.description,
    image: p.image,
    imageAlt: p.imageAlt,
    ogType: 'article',
    keywords: p.keywordList,
    tags: p.keywordList,
    published: p.date,
    modified: p.updated || p.date,
    nav: 'blog',
    version,
    body,
    schema: graph(posting, breadcrumbs([['Home', '/'], ['Blog', '/blog/'], [cat.name, `/category/${p.category}/`], [p.title, p.path]]), faqSchema(p.faq)).map((g) => ({
      ...g,
      '@graph': g['@graph'].filter(Boolean),
    })),
  });
}

function listingPage({ pathName, title, heading, intro, posts, version, crumbs, noindex }) {
  const body = `
<div class="wrap">
  <header class="article-head">
    ${crumbs ? `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${crumbs.map(([n, p]) => `<li><a href="${p}">${esc(n)}</a></li>`).join('')}</ol></nav>` : ''}
    <h1>${esc(heading)}</h1>
    <p class="prose">${esc(intro)}</p>
  </header>
  <div class="post-grid" style="margin-bottom:64px">${posts.map((p) => postCard(p, 'h2')).join('')}</div>
</div>`;
  return page({
    path: pathName,
    title,
    description: intro,
    nav: 'blog',
    version,
    body,
    noindex,
    schema: graph(
      { '@type': 'CollectionPage', name: heading, url: site.url + pathName, isPartOf: { '@id': `${site.url}/#website` } },
      crumbs ? breadcrumbs(crumbs) : null,
    ).map((g) => ({ ...g, '@graph': g['@graph'].filter(Boolean) })),
  });
}

function simplePage(file, version) {
  const { data, body } = frontMatter(fs.readFileSync(path.join(SRC, 'content/pages', file), 'utf8'), file);
  const { html } = renderMarkdown(body);
  const p = `/${file.replace(/\.md$/, '')}/`;
  return {
    path: p,
    data,
    html: page({
      path: p,
      title: data.title,
      description: data.description,
      nav: data.nav,
      version,
      body: `<div class="wrap"><header class="article-head"><h1>${esc(data.title)}</h1>${data.updated ? `<p class="meta">Last updated <time datetime="${data.updated}">${fmtDate(data.updated)}</time></p>` : ''}</header><div class="prose article__body" style="padding-bottom:64px">${html}</div></div>`,
      schema: graph({ '@type': data.schemaType || 'WebPage', name: data.title, url: site.url + p }),
    }),
  };
}

const redirectPage = (to) =>
  `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Moved</title><link rel="canonical" href="${site.url}${to}"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=${to}"></head><body><p>This page has moved to <a href="${to}">${to}</a>.</p></body></html>`;

// ---------- build ----------

function build() {
  fs.rmSync(OUT, { recursive: true, force: true });
  copyDir(path.join(ROOT, 'static'), OUT);
  copyDir(path.join(SRC, 'assets'), path.join(OUT, 'assets'));

  const hash = crypto.createHash('sha1');
  for (const f of fs.readdirSync(path.join(SRC, 'assets/js')).map((f) => `js/${f}`).concat('css/site.css')) hash.update(fs.readFileSync(path.join(SRC, 'assets', f)));
  const version = hash.digest('hex').slice(0, 8);

  // Version the module import too, so a cached old engine never pairs with a new UI.
  for (const f of ['stroop-app.js', 'hero-demo.js', 'home-extras.js']) {
    const file = path.join(OUT, 'assets/js', f);
    fs.writeFileSync(file, fs.readFileSync(file, 'utf8').replace("'./stroop-core.js'", `'./stroop-core.js?v=${version}'`));
  }

  const posts = loadPosts();
  const urls = [];
  const add = (p, lastmod, priority = '0.6', group = 'page', alts = null) => urls.push({ loc: site.url + p, lastmod, priority, group, alts });

  // Home
  // Home, once per language. Only the homepage (and the test on it) is translated.
  for (const L of LOCALES) {
    const p = homePath(L);
    const home = homePage({ site, L, posts: posts.slice(0, 6), postCard, picture, version, path: p, alternates: HOME_ALTERNATES });
    write(`${p.slice(1)}index.html`, page({ ...home, L, version, alternates: HOME_ALTERNATES }));
    add(p, home.modified, L.code === 'en' ? '1.0' : '0.9', 'page', HOME_ALTERNATES);
  }

  // Posts
  for (const p of posts) {
    write(`${p.slug}/index.html`, postPage(p, posts, version));
    add(p.path, p.updated || p.date, '0.8', 'post');
  }

  // Blog index
  write(
    'blog/index.html',
    listingPage({
      pathName: '/blog/',
      title: 'Blog: Stroop test guides and attention research',
      heading: 'Our blog',
      intro: 'Plain-English guides to the Stroop test, what your scores mean, and the research on attention and executive function behind them.',
      posts,
      version,
      crumbs: [['Home', '/'], ['Blog', '/blog/']],
    }),
  );
  add('/blog/', posts[0].updated || posts[0].date, '0.7');

  // Categories
  for (const [slug, cat] of Object.entries(site.categories)) {
    const list = posts.filter((p) => p.category === slug);
    if (!list.length) continue;
    write(
      `category/${slug}/index.html`,
      listingPage({
        pathName: `/category/${slug}/`,
        title: `${cat.name} articles`,
        heading: cat.name,
        intro: cat.description,
        posts: list,
        version,
        crumbs: [['Home', '/'], ['Blog', '/blog/'], [cat.name, `/category/${slug}/`]],
      }),
    );
    add(`/category/${slug}/`, list[0].updated || list[0].date, '0.5', 'category');
  }

  // Static pages
  for (const f of fs.readdirSync(path.join(SRC, 'content/pages'))) {
    const pg = simplePage(f, version);
    write(`${pg.path.slice(1)}index.html`, pg.html);
    add(pg.path, pg.data.updated, '0.3');
  }

  // Old WordPress URLs that should keep working
  write('page/2/index.html', redirectPage('/blog/'));
  write('blog/page/2/index.html', redirectPage('/blog/'));
  write('frontpage/index.html', redirectPage('/'));
  write('feed/index.html', redirectPage('/feed.xml'));
  // Addresses Search Console has seen (old links, typos, old internal links) that would otherwise 404.
  for (const [from, to] of Object.entries({
    'stroop-effect-test': '/',
    'stroop-test-adhd': '/stroop-test-and-adhd/',
    'the-stroop-test-and-adhd': '/stroop-test-and-adhd/',
    'the-complete-beginners-guide': '/what-is-the-stroop-test/',
    'good-squab-test-score': '/good-stroop-test-score/',
    'stroop-test': '/what-is-the-stroop-test/',
    'stroop-effect': '/stroop-effect-explained/',
    'what-causes-the-stroop-effect': '/stroop-effect-explained/',
    'stroop-test-examples': '/what-is-the-stroop-test/',
  }))
    write(`${from}/index.html`, redirectPage(to));

  // 404
  write(
    '404.html',
    page({
      path: '/404.html',
      title: 'Page not found',
      description: 'This page does not exist.',
      noindex: true,
      version,
      body: `<div class="wrap" style="padding:72px 20px"><h1>That page isn't here</h1><p class="prose">The link may be old or mistyped. Try the <a href="/">free Stroop test</a>, browse the <a href="/blog/">blog</a>, or start from one of these:</p><div class="post-grid">${posts.slice(0, 3).map((p) => postCard(p)).join('')}</div></div>`,
    }),
  );

  // Sitemaps, feed, robots
  const urlset = (list) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${list
      .map((u) => {
        const alts = u.alts
          ? u.alts.map((a) => `<xhtml:link rel="alternate" hreflang="${a.lang}" href="${site.url}${a.path}"/>`).join('') +
            `<xhtml:link rel="alternate" hreflang="x-default" href="${site.url}/"/>`
          : '';
        return `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority>${alts}</url>`;
      })
      .join('\n')}\n</urlset>\n`;
  write('sitemap.xml', urlset(urls));
  // Same layout as the old WordPress (Rank Math) sitemaps, which Search Console already knows:
  // /sitemap_index.xml pointing at post-, page- and category-sitemap.xml.
  const parts = ['post', 'page', 'category'].map((group) => {
    const list = urls.filter((u) => u.group === group);
    write(`${group}-sitemap.xml`, urlset(list));
    const lastmod = list.map((u) => u.lastmod).filter(Boolean).sort().pop();
    return `  <sitemap><loc>${site.url}/${group}-sitemap.xml</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}</sitemap>`;
  });
  write('sitemap_index.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${parts.join('\n')}\n</sitemapindex>\n`);

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel>
<title>${esc(site.name)}</title><link>${site.url}/</link><description>${esc(site.tagline)}</description><language>en</language>
<atom:link href="${site.url}/feed.xml" rel="self" type="application/rss+xml"/>
${posts
  .map(
    (p) =>
      `<item><title>${esc(p.title)}</title><link>${site.url}${p.path}</link><guid>${site.url}${p.path}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${esc(p.excerpt)}</description></item>`,
  )
  .join('\n')}
</channel></rss>\n`;
  write('feed.xml', rss);

  writeLlms(posts);

  console.log(`Built ${urls.length} pages and ${posts.length} posts into dist/ (assets v${version})`);
}

// llms.txt (https://llmstxt.org): a plain summary of the site for AI assistants and crawlers,
// plus llms-full.txt with the complete text of every article.
function writeLlms(posts) {
  const strip = (md) =>
    md
      .replace(/^\{\{cta(?::.*)?\}\}$/gm, '')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '')
      .replace(/\]\(\//g, `](${site.url}/`)
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  const byCat = Object.entries(site.categories)
    .map(([slug, cat]) => {
      const list = posts.filter((p) => p.category === slug);
      return list.length ? `### ${cat.name}\n\n${list.map((p) => `- [${p.title}](${site.url}${p.path}): ${p.description}`).join('\n')}` : '';
    })
    .filter(Boolean)
    .join('\n\n');
  const llms = `# Stroop Tester

> Stroop Tester (strooptester.com) is a free online Stroop test, also called the Stroop task or Stroop Color and Word Test, with plain-English guides to the Stroop effect, Stroop test scores and attention research. The test runs in the browser in ${LOCALES.length} languages, needs no sign-up, and keeps answers on the user's device.

Key facts about the test:

- Trials: matching (RED in red), neutral (an ordinary word such as LAMP in a colour) and clashing (RED in blue) words, in a 30/30/40 mix.
- Levels: Easy (20 trials, 4 colours), Standard (40 trials, 4 colours), Hard (60 trials, 6 colours, 1.5 s limit), and a colour-vision friendly level (30 trials; blue, yellow, white).
- Main score: Stroop interference = median correct response time on clashing words minus median on matching words. Responses under 200 ms or over 3 s are excluded from timing.
- Also reported: relative interference (interference as a % of matching-word time), accuracy, median response time and inverse efficiency (median correct time / proportion correct).
- Rough interference bands for keyboard/touch versions: under 40 ms very small, 40-120 ms typical, 120-200 ms larger than typical, 200 ms or more large. These are guides, not clinical norms.
- The test is educational. It does not diagnose ADHD, dementia or any other condition.

## Take the test

- [Free Stroop test online (English)](${site.url}/): the test, how scoring works, the research and FAQs.
${LOCALES.filter((L) => L.code !== 'en')
  .map((L) => `- [${L.name}](${site.url}/${L.code}/): ${L.seo.title}`)
  .join('\n')}

## Guides

${byCat}

## About

- [About and editorial standards](${site.url}/about/): who runs the site, how the test works and what it does not claim.
- [Privacy policy](${site.url}/privacy-policy/): test answers never leave the device; analytics only with consent.
- [Contact](${site.url}/contact/)

## Optional

- [Full text of every article](${site.url}/llms-full.txt)
- [Sitemap](${site.url}/sitemap_index.xml)
`;
  write('llms.txt', llms);
  const full = `# Stroop Tester: full article text\n\nSource: ${site.url}/ · Licence: all rights reserved, quoting with a link is welcome.\n\n${posts
    .map((p) => `---\n\n# ${p.title}\n\nURL: ${site.url}${p.path}\nPublished: ${p.date} · Updated: ${p.updated || p.date}\n\n${p.summary ? p.summary.split('|').map((x) => `- ${x.trim()}`).join('\n') + '\n\n' : ''}${strip(p.source)}`)
    .join('\n\n')}\n`;
  write('llms-full.txt', full);
}

// Prefix every root-relative link with BASE so the same build works in a sub-folder.
function applyBase() {
  if (!BASE) return;
  const fix = (u) => (u.startsWith('/') && !u.startsWith('//') ? BASE + u : u);
  const walk = (dir) => {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith('.html')) {
        let s = fs.readFileSync(p, 'utf8');
        s = s.replace(/(\s(?:href|src))="([^"]*)"/g, (_, a, u) => `${a}="${fix(u)}"`);
        s = s.replace(/\ssrcset="([^"]*)"/g, (_, set) => ` srcset="${set.split(', ').map((part) => fix(part)).join(', ')}"`);
        s = s.replace(/url=(\/[^"]*)"/g, (_, u) => `url=${fix(u)}"`);
        fs.writeFileSync(p, s);
      } else if (f.name === 'site.webmanifest') {
        fs.writeFileSync(p, fs.readFileSync(p, 'utf8').replace(/"(\/[^"]*)"/g, (_, u) => `"${fix(u)}"`));
      }
    }
  };
  walk(OUT);
  console.log(`Links prefixed with ${BASE}`);
}

build();
applyBase();
