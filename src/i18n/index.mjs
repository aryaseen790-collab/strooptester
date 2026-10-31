// All site languages. English is the source; the others translate the homepage and the test.
// Order here is the order of the language menu.
import fs from 'node:fs';
import path from 'node:path';
import en from './en.mjs';

export const CODES = ['en', 'es', 'pt', 'fr', 'de', 'it', 'nl', 'pl', 'cs', 'hu', 'hr', 'sv', 'tr', 'ru', 'ar', 'fa', 'hi', 'id', 'ja', 'ko', 'zh'];

const dir = path.dirname(new URL(import.meta.url).pathname);
const available = CODES.filter((c) => c === 'en' || fs.existsSync(path.join(dir, `${c}.mjs`)));
const loaded = await Promise.all(available.map((c) => (c === 'en' ? en : import(`./${c}.mjs`).then((m) => m.default))));

// A translation only has to override what it translates; anything missing falls back to English
// (and is reported by `npm run check-i18n`).
function merge(base, over) {
  if (over === null) return null; // e.g. keys: null means "use number keys"
  if (Array.isArray(base) || typeof base !== 'object' || base === null) return over ?? base;
  const out = { ...base };
  for (const k of Object.keys(over || {})) out[k] = merge(base[k], over[k]);
  return out;
}

export const EN = en;
export const LOCALES = loaded.map((L) => (L.code === 'en' ? L : merge(en, L)));
