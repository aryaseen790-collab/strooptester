// Static site build: src/ + static/ -> dist/
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { marked } from 'marked';
import { layout, esc } from '../src/templates/layout.mjs';
import { homePage } from '../src/templates/home.mjs';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(ROOT, 'src');
const OUT = path.join(ROOT, 'dist');
const site = JSON.parse(fs.readFileSync(path.join(SRC, 'data/site.json'), 'utf8'));
// Set when the site is served from a sub-folder, e.g. "/strooptester" on username.github.io
// before the custom domain is connected. Empty for strooptester.com itself.
const BASE = (process.env.BASE_PATH || '').replace(/\/+$/, '');
const images = JSON.parse(fs.readFileSync(path.join(SRC, 'data/images.json'), 'utf8'));

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
      return { ...data, slug, path: `/${slug}/`, ...rendered, words: words(rendered.html) };
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
    <article class="article__body">${p.html}
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
  };
  return layout(site, {
    path: p.path,
    title: p.seoTitle || p.title,
    description: p.description,
    image: p.image,
    imageAlt: p.imageAlt,
    ogType: 'article',
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
  return layout(site, {
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
    html: layout(site, {
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
  const add = (p, lastmod, priority = '0.6') => urls.push({ loc: site.url + p, lastmod, priority });

  // Home
  const home = homePage({ site, posts: posts.slice(0, 6), postCard, picture, version });
  write('index.html', layout(site, { ...home, version }));
  add('/', home.modified, '1.0');

  // Posts
  for (const p of posts) {
    write(`${p.slug}/index.html`, postPage(p, posts, version));
    add(p.path, p.updated || p.date, '0.8');
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
    add(`/category/${slug}/`, list[0].updated || list[0].date, '0.5');
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

  // 404
  write(
    '404.html',
    layout(site, {
      path: '/404.html',
      title: 'Page not found',
      description: 'This page does not exist.',
      noindex: true,
      version,
      body: `<div class="wrap" style="padding:72px 20px"><h1>That page isn't here</h1><p class="prose">The link may be old or mistyped. Try the <a href="/">free Stroop test</a>, browse the <a href="/blog/">blog</a>, or start from one of these:</p><div class="post-grid">${posts.slice(0, 3).map((p) => postCard(p)).join('')}</div></div>`,
    }),
  );

  // Sitemaps, feed, robots
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}<priority>${u.priority}</priority></url>`)
    .join('\n')}\n</urlset>\n`;
  write('sitemap.xml', sitemap);
  // Search Console was given /sitemap_index.xml by the old WordPress site.
  write('sitemap_index.xml', sitemap);

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

  console.log(`Built ${urls.length} pages and ${posts.length} posts into dist/ (assets v${version})`);
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
