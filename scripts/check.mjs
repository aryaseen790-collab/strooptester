// Post-build checks: broken internal links and anchors, missing images, basic SEO hygiene.
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../dist');
const pages = [];
const walk = (dir) => {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) walk(p);
    else if (f.name.endsWith('.html')) pages.push(p);
  }
};
walk(OUT);

const errors = [];
const titles = new Map();
const descs = new Map();
const idsCache = new Map();
const ids = (file) => {
  if (!idsCache.has(file)) idsCache.set(file, new Set([...fs.readFileSync(file, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(file);
};
const BASE = (process.env.BASE_PATH || '').replace(/\/+$/, '');
const resolve = (url) => {
  let clean = decodeURI(url.split('#')[0].split('?')[0]);
  if (BASE && clean.startsWith(BASE + '/')) clean = clean.slice(BASE.length);
  let p = path.join(OUT, clean);
  if (clean.endsWith('/')) p = path.join(p, 'index.html');
  return fs.existsSync(p) ? p : null;
};

for (const file of pages) {
  const rel = '/' + path.relative(OUT, file);
  const html = fs.readFileSync(file, 'utf8');
  const redirect = /http-equiv="refresh"/.test(html);
  for (const [, attr, url] of html.matchAll(/\s(href|src)="([^"]+)"/g)) {
    if (/^(https?:|mailto:|data:|tel:)/.test(url)) continue;
    if (url.startsWith('#')) {
      if (url.length > 1 && !ids(file).has(url.slice(1))) errors.push(`${rel}: missing anchor ${url}`);
      continue;
    }
    const target = resolve(url);
    if (!target) {
      errors.push(`${rel}: broken ${attr} ${url}`);
      continue;
    }
    const hash = url.split('#')[1];
    if (hash && target.endsWith('.html') && !ids(target).has(hash)) errors.push(`${rel}: missing anchor ${url}`);
  }
  for (const [, set] of html.matchAll(/srcset="([^"]+)"/g)) {
    for (const part of set.split(',')) {
      const u = part.trim().split(' ')[0];
      if (!resolve(u)) errors.push(`${rel}: broken srcset ${u}`);
    }
  }
  if (redirect || rel === '/404.html') continue;
  const h1 = (html.match(/<h1[\s>]/g) || []).length;
  if (h1 !== 1) errors.push(`${rel}: has ${h1} <h1> elements`);
  if ((html.match(/<title>/g) || []).length !== 1) errors.push(`${rel}: needs exactly one <title>`);
  const title = html.match(/<title>(.*?)<\/title>/)?.[1];
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] || '';
  // CJK characters take about two Latin characters of space in search results.
  const width = [...desc].reduce((n, ch) => n + (/[\u3000-\u9fff\uac00-\ud7af\uff00-\uffef]/.test(ch) ? 2 : 1), 0);
  if (width < 70 || width > 170) errors.push(`${rel}: description is ${width} chars wide`);
  // hreflang: every alternate must exist and link back to this page.
  const self = html.match(/<link rel="canonical" href="https:\/\/strooptester\.com([^"]*)"/)?.[1];
  for (const [, lang, href] of html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="https:\/\/strooptester\.com([^"]*)"/g)) {
    const target = resolve(href);
    if (!target) errors.push(`${rel}: hreflang ${lang} points to missing ${href}`);
    else if (lang !== 'x-default' && self && !fs.readFileSync(target, 'utf8').includes(`href="https://strooptester.com${self}"`)) errors.push(`${rel}: ${href} does not link back`);
  }
  const htmlLang = html.match(/<html lang="([^"]+)"/)?.[1];
  const own = html.match(new RegExp(`<link rel="alternate" hreflang="${htmlLang}" href="https://strooptester.com([^"]*)"`))?.[1];
  if (own && self && own !== self) errors.push(`${rel}: hreflang for its own language (${htmlLang}) is ${own}, canonical is ${self}`);
  if (titles.has(title)) errors.push(`${rel}: duplicate title with ${titles.get(title)}`);
  if (descs.has(desc)) errors.push(`${rel}: duplicate description with ${descs.get(desc)}`);
  titles.set(title, rel);
  descs.set(desc, rel);
  for (const [, tag] of html.matchAll(/(<img[^>]*>)/g)) if (!/\salt="/.test(tag)) errors.push(`${rel}: img without alt`);
  for (const [, json] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
    try {
      JSON.parse(json);
    } catch {
      errors.push(`${rel}: invalid JSON-LD`);
    }
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`\n${errors.length} problem(s) in ${pages.length} pages`);
  process.exit(1);
}
console.log(`OK: ${pages.length} pages, no broken links, anchors or images`);
