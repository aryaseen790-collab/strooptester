// Number keys must work on Persian, Arabic and Hindi keyboard layouts, which type their own digits.
import test from 'node:test';
import assert from 'node:assert/strict';

globalThis.document = { getElementById: () => ({ textContent: JSON.stringify({ code: 'fa', keys: null }) }) };
const { idForKey, keyFor } = await import('../src/assets/js/i18n.js');
const inks = ['RED', 'BLUE', 'GREEN', 'YELLOW'];

test('ASCII number keys pick the matching ink', () => {
  assert.equal(idForKey('1', inks), 'RED');
  assert.equal(idForKey('4', inks), 'YELLOW');
  assert.equal(keyFor('GREEN', inks), '3');
});

test('Persian, Arabic-Indic and Devanagari digits work too', () => {
  assert.equal(idForKey('۲', inks), 'BLUE');
  assert.equal(idForKey('٣', inks), 'GREEN');
  assert.equal(idForKey('४', inks), 'YELLOW');
  assert.equal(idForKey('x', inks), null);
});
