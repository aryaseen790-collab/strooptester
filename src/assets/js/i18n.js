// Page language data. Every page embeds its locale as JSON in <script id="i18n">,
// so the same scripts run the test in English, Spanish, Japanese and so on.
const el = document.getElementById('i18n');
export const L = el ? JSON.parse(el.textContent) : { ui: {}, colors: {}, colorNames: {}, neutral: [], keys: null, lang: 'en' };

// t('key', { n: 3 }) fills {n}-style placeholders.
export const t = (key, vars = {}) => String(L.ui[key] ?? key).replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? `{${k}}`));

// What a trial word looks like on screen: colour ids become this language's colour word.
export const display = (word) => L.colors[word] ?? word;
// Colour name for use inside a sentence ("the ink was red").
export const colorName = (id) => L.colorNames[id] ?? id.toLowerCase();

// Letter keys where the language has a clean set (English R/B/G/Y), otherwise 1, 2, 3...
export function keyFor(id, inks) {
  return (L.keys && L.keys[id]) || String(inks.indexOf(id) + 1);
}
// Persian, Arabic and Hindi keyboard layouts type their own digits on the number row (۱, ١, १);
// treat them like 1–9 so the number keys work whatever layout is active.
const DIGIT_ZEROS = [0x660, 0x6f0, 0x966];
const toAsciiDigit = (k) =>
  k.replace(/[\u0660-\u0669\u06F0-\u06F9\u0966-\u096F]/g, (d) => {
    const c = d.charCodeAt(0);
    return String(c - DIGIT_ZEROS.find((z) => c >= z && c <= z + 9));
  });
export function idForKey(key, inks) {
  const k = toAsciiDigit(key.toLowerCase());
  const byNumber = /^[1-9]$/.test(k) ? inks[Number(k) - 1] : null;
  return byNumber || inks.find((id) => L.keys && L.keys[id] === k) || null;
}
