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
if (problems.length) {
  console.error(problems.join('\n'));
  console.error(`\n${problems.length} translation problem(s)`);
  process.exit(1);
}
console.log(`OK: ${checked} translations complete`);
