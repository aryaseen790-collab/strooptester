// Lists strings a translation is missing (they would fall back to English) and
// placeholders like {ms} that a translation dropped or invented.
import fs from 'node:fs';
import path from 'node:path';
import en from '../src/i18n/en.mjs';
import { CODES } from '../src/i18n/index.mjs';

const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../src/i18n');
const problems = [];
const holes = (s) => [...String(s).matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');

function compare(base, other, where, code) {
  if (typeof base === 'string') {
    if (typeof other !== 'string') return problems.push(`${code}: missing ${where}`);
    if (holes(base) !== holes(other)) problems.push(`${code}: ${where} placeholders {${holes(other)}} should be {${holes(base)}}`);
    return;
  }
  if (Array.isArray(base) && where.endsWith('keywords')) {
    if (!Array.isArray(other) || !other.length) problems.push(`${code}: missing ${where}`);
    return;
  }
  if (Array.isArray(base)) {
    if (!Array.isArray(other) || other.length !== base.length) return problems.push(`${code}: ${where} should have ${base.length} items`);
    return base.forEach((b, i) => compare(b, other[i], `${where}[${i}]`, code));
  }
  if (base && typeof base === 'object') {
    if (!other || typeof other !== 'object') return problems.push(`${code}: missing ${where}`);
    for (const k of Object.keys(base)) if (k !== 'keys') compare(base[k], other[k], where ? `${where}.${k}` : k, code);
  }
}

let checked = 0;
for (const code of CODES.filter((c) => c !== 'en')) {
  const file = path.join(dir, `${code}.mjs`);
  if (!fs.existsSync(file)) {
    problems.push(`${code}: no translation file`);
    continue;
  }
  const L = (await import(file)).default;
  compare(en, L, '', code);
  if (L.neutral.some((w) => Object.values(L.colors).includes(w))) problems.push(`${code}: a neutral word is also a colour word`);
  checked++;
}
// Translated articles and pages (src/content/i18n/<code>/...): every English file needs a translation
// with the same images, the same internal links and the same number of call-to-action boxes.
const content = path.resolve(dir, '../content');
const fm = (raw) => {
  const m = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return null;
  const data = Object.fromEntries(m[1].split('\n').filter((l) => l.includes(':')).map((l) => [l.slice(0, l.indexOf(':')).trim(), l.slice(l.indexOf(':') + 1).trim()]));
  return { data, body: m[2] };
};
const shape = (body) => ({
  images: [...body.matchAll(/!\[[^\]]*\]\((\S+)/g)].map((m) => m[1]).join(' '),
  links: [...new Set([...body.matchAll(/\]\((\/[^)\s]*)\)/g)].map((m) => m[1]).filter((u) => !u.startsWith('/wp-content/')))].sort().join(' '),
  ctas: (body.match(/^\{\{cta/gm) || []).length,
  h2: (body.match(/^## /gm) || []).length,
});
let files = 0;
for (const kind of ['posts', 'pages']) {
  const need = kind === 'posts' ? ['title', 'seoTitle', 'description', 'imageAlt', 'excerpt', 'keywords', 'summary'] : ['title', 'description'];
  for (const f of fs.readdirSync(path.join(content, kind)).filter((f) => f.endsWith('.md'))) {
    const en = fm(fs.readFileSync(path.join(content, kind, f), 'utf8'));
    const want = shape(en.body);
    for (const code of CODES.filter((c) => c !== 'en')) {
      const file = path.join(content, 'i18n', code, kind, f);
      const where = `${code}/${kind}/${f}`;
      if (!fs.existsSync(file)) {
        problems.push(`${where}: not translated yet`);
        continue;
      }
      files++;
      const tr = fm(fs.readFileSync(file, 'utf8'));
      if (!tr) {
        problems.push(`${where}: bad front matter`);
        continue;
      }
      for (const k of need) if (!tr.data[k]) problems.push(`${where}: missing ${k}`);
      if (kind === 'posts' && tr.data.summary && tr.data.summary.split('|').length !== en.data.summary.split('|').length) problems.push(`${where}: summary should have ${en.data.summary.split('|').length} points`);
      const got = shape(tr.body);
      for (const k of Object.keys(want)) if (got[k] !== want[k]) problems.push(`${where}: ${k} differ from English\n    en: ${want[k]}\n    ${code}: ${got[k]}`);
    }
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} translation problem(s)`);
  process.exit(1);
}
console.log(`OK: ${checked} translations and ${files} translated articles and pages complete`);
