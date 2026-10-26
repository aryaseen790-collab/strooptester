import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MODES,
  INKS,
  makeTrials,
  makePractice,
  mulberry32,
  score,
  median,
  typeCounts,
  classify,
  encodeShare,
  decodeShare,
  interferenceBand,
} from '../src/assets/js/stroop-core.js';

test('every trial in every mode can be answered with an available key', () => {
  for (const [name, mode] of Object.entries(MODES)) {
    const trials = makeTrials(mode.trials, mode.inks, mulberry32(7));
    assert.equal(trials.length, mode.trials, name);
    for (const t of trials) {
      assert.ok(mode.inks.includes(t.ink), `${name}: ink ${t.ink} has no button`);
      assert.ok(INKS[t.ink].key, `${name}: ink ${t.ink} has no key`);
    }
    for (const t of makePractice(mode.inks, mulberry32(3))) assert.ok(mode.inks.includes(t.ink));
  }
});

test('perfect answers score 100% accuracy (regression: neutral trials used to be unanswerable)', () => {
  const trials = makeTrials(40, MODES.standard.inks, mulberry32(1));
  const results = trials.map((t) => ({ ...t, response: t.ink, rt: 600 }));
  const s = score(results);
  assert.equal(s.accuracy, 100);
  assert.equal(s.correct, 40);
});

test('trial types follow the stated mix and congruency rules', () => {
  const counts = typeCounts(40);
  assert.deepEqual(counts, { congruent: 12, neutral: 12, incongruent: 16 });
  const trials = makeTrials(40, MODES.standard.inks, mulberry32(9));
  for (const t of trials) {
    if (t.type === 'congruent') assert.equal(t.word, t.ink);
    if (t.type === 'incongruent') assert.notEqual(t.word, t.ink);
    if (t.type === 'neutral') assert.ok(!(t.word in INKS));
  }
  for (let i = 1; i < trials.length; i++) {
    assert.ok(!(trials[i].word === trials[i - 1].word && trials[i].ink === trials[i - 1].ink));
  }
});

test('interference uses medians of correct, in-range trials', () => {
  const mk = (type, rt, ok = true) => ({ type, word: 'RED', ink: 'RED', response: ok ? 'RED' : 'BLUE', rt });
  const results = [
    mk('congruent', 500), mk('congruent', 520), mk('congruent', 540),
    mk('incongruent', 640), mk('incongruent', 660), mk('incongruent', 2900), mk('incongruent', 680),
    mk('incongruent', 300, false), // error: excluded from timing
    mk('incongruent', 150), // anticipation: excluded
    mk('neutral', 560), mk('neutral', 580),
  ];
  const s = score(results);
  assert.equal(s.byType.congruent.medianRT, 520);
  assert.equal(s.byType.incongruent.medianRT, 670);
  assert.equal(s.interference, 150);
  assert.equal(s.interferenceVsNeutral, 100);
  assert.equal(s.excluded.anticipations, 1);
});

test('classify handles misses, anticipations and lapses', () => {
  assert.equal(classify({ ink: 'RED', response: null, rt: null }), 'miss');
  assert.equal(classify({ ink: 'RED', response: 'RED', rt: 120 }), 'anticipation');
  assert.equal(classify({ ink: 'RED', response: 'RED', rt: 3500 }), 'slow');
  assert.equal(classify({ ink: 'RED', response: 'BLUE', rt: 600 }), 'error');
});

test('median', () => {
  assert.equal(median([]), null);
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 2, 3]), 2.5);
});

test('share links round-trip and reject junk', () => {
  const code = encodeShare({ accuracy: 97.5, medianRT: 612, interference: 88, interferenceRatio: 15.2 }, 'standard');
  assert.deepEqual(decodeShare(code), { mode: 'standard', accuracy: 97.5, medianRT: 612, interference: 88, interferenceRatio: 15.2 });
  assert.equal(decodeShare('!!!'), null);
  assert.equal(decodeShare(btoa('evil~1~2~3~4')), null);
});

test('bands', () => {
  assert.equal(interferenceBand(30).label, 'Very small');
  assert.equal(interferenceBand(90).label, 'Typical');
  assert.equal(interferenceBand(500).label, 'Large');
  assert.equal(interferenceBand(null), null);
});
