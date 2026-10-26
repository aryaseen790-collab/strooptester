// Pure logic for the Stroop task: trial generation and scoring.
// No DOM access here, so the same file runs in the browser and in `node --test`.

export const INKS = {
  RED: { hex: '#EF4444', key: 'r' },
  BLUE: { hex: '#3B82F6', key: 'b' },
  GREEN: { hex: '#22C55E', key: 'g' },
  YELLOW: { hex: '#FACC15', key: 'y' },
  PURPLE: { hex: '#A855F7', key: 'p' },
  ORANGE: { hex: '#FB923C', key: 'o' },
  WHITE: { hex: '#F8FAFC', key: 'w' },
};

// Neutral trials show a non-colour word in a real ink, so every trial has a
// correct answer on the response pad.
export const NEUTRAL_WORDS = ['LAMP', 'DOOR', 'CHAIR', 'BOOK', 'PLATE', 'CLOCK'];

export const MODES = {
  easy: { label: 'Easy', trials: 20, inks: ['RED', 'BLUE', 'GREEN', 'YELLOW'], deadline: null },
  standard: { label: 'Standard', trials: 40, inks: ['RED', 'BLUE', 'GREEN', 'YELLOW'], deadline: null },
  hard: {
    label: 'Hard',
    trials: 60,
    inks: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'],
    deadline: 1500,
  },
  // Blue, yellow and white stay distinct for the common red-green colour vision types.
  cvd: { label: 'Colour-vision friendly', trials: 30, inks: ['BLUE', 'YELLOW', 'WHITE'], deadline: null },
};

export const MIX = { congruent: 0.3, neutral: 0.3, incongruent: 0.4 };

// Responses faster than this are anticipations, slower ones are lapses.
export const RT_MIN = 200;
export const RT_MAX = 3000;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle(arr, rand = Math.random) {
  const out = arr.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];

export function typeCounts(n) {
  const congruent = Math.round(n * MIX.congruent);
  const neutral = Math.round(n * MIX.neutral);
  return { congruent, neutral, incongruent: n - congruent - neutral };
}

function makeTrial(type, inks, rand) {
  const ink = pick(inks, rand);
  if (type === 'congruent') return { type, word: ink, ink };
  if (type === 'neutral') return { type, word: pick(NEUTRAL_WORDS, rand), ink };
  const word = pick(inks.filter((c) => c !== ink), rand);
  return { type, word, ink };
}

function sequenceOk(trials) {
  for (let i = 1; i < trials.length; i++) {
    const a = trials[i - 1];
    const b = trials[i];
    if (a.word === b.word && a.ink === b.ink) return false;
    if (i >= 3 && trials[i - 3].type === b.type && trials[i - 2].type === b.type && a.type === b.type) return false;
    if (i >= 2 && trials[i - 2].ink === b.ink && a.ink === b.ink) return false;
  }
  return true;
}

// Builds a balanced, shuffled list: no identical stimulus twice in a row,
// no more than three trials of one type or two of one ink in a row.
export function makeTrials(n, inks, rand = Math.random) {
  const counts = typeCounts(n);
  const types = [];
  for (const [type, count] of Object.entries(counts)) for (let i = 0; i < count; i++) types.push(type);
  let best = null;
  for (let attempt = 0; attempt < 400; attempt++) {
    const trials = shuffle(types, rand).map((t) => makeTrial(t, inks, rand));
    if (sequenceOk(trials)) return trials;
    best = trials;
  }
  return best;
}

export function makePractice(inks, rand = Math.random) {
  const trials = shuffle(['congruent', 'incongruent', 'neutral', 'incongruent', 'congruent', 'incongruent'], rand);
  return trials.map((t) => makeTrial(t, inks, rand));
}

export function median(values) {
  if (!values.length) return null;
  const s = values.slice().sort((a, b) => a - b);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

// A response is { ...trial, response: 'RED' | null, rt: ms | null }.
// response null means the deadline passed (hard mode only).
export function classify(r) {
  if (r.response == null) return 'miss';
  if (r.rt < RT_MIN) return 'anticipation';
  if (r.response !== r.ink) return 'error';
  if (r.rt > RT_MAX) return 'slow';
  return 'correct';
}

const round = (v, dp = 0) => (v == null ? null : Math.round(v * 10 ** dp) / 10 ** dp);

export function score(results) {
  if (!results.length) return null;
  const tagged = results.map((r) => ({ ...r, status: classify(r) }));
  // "slow" answers were right, so they count for accuracy but not for timing.
  const isRight = (r) => r.status === 'correct' || r.status === 'slow';
  const timed = (list) => list.filter((r) => r.status === 'correct').map((r) => r.rt);
  const byType = {};
  for (const type of ['congruent', 'neutral', 'incongruent']) {
    const list = tagged.filter((r) => r.type === type);
    byType[type] = {
      n: list.length,
      accuracy: list.length ? round((list.filter(isRight).length / list.length) * 100, 1) : null,
      medianRT: round(median(timed(list))),
    };
  }
  const right = tagged.filter(isRight).length;
  const accuracy = (right / tagged.length) * 100;
  const medianRT = median(timed(tagged));
  const c = byType.congruent.medianRT;
  const n = byType.neutral.medianRT;
  const i = byType.incongruent.medianRT;
  const interference = c != null && i != null ? i - c : null;
  const errorCost =
    byType.incongruent.accuracy != null && byType.congruent.accuracy != null
      ? byType.congruent.accuracy - byType.incongruent.accuracy
      : null;
  return {
    total: tagged.length,
    correct: right,
    accuracy: round(accuracy, 1),
    medianRT: round(medianRT),
    byType,
    interference: round(interference),
    // Interference relative to the neutral baseline (pure cost of a clashing word).
    interferenceVsNeutral: c != null && n != null && i != null ? round(i - n) : null,
    // Interference as a share of the congruent baseline. Largely removes general speed,
    // which is most of what changes with age (Verhaeghen & De Meersman, 1998).
    interferenceRatio: interference != null && c ? round((interference / c) * 100, 1) : null,
    errorCost: round(errorCost, 1),
    // Inverse efficiency (Townsend & Ashby, 1983): median correct RT divided by proportion correct.
    inverseEfficiency: medianRT != null && right ? round(medianRT / (right / tagged.length)) : null,
    excluded: {
      anticipations: tagged.filter((r) => r.status === 'anticipation').length,
      slow: tagged.filter((r) => r.status === 'slow').length,
      misses: tagged.filter((r) => r.status === 'miss').length,
    },
    fatigue: fatigue(tagged),
  };
}

function fatigue(tagged) {
  if (tagged.length < 20) return null;
  const half = tagged.length >> 1;
  const first = median(tagged.slice(0, half).filter((r) => r.status === 'correct').map((r) => r.rt));
  const second = median(tagged.slice(half).filter((r) => r.status === 'correct').map((r) => r.rt));
  if (first == null || second == null) return null;
  return { first: round(first), second: round(second), change: round(second - first) };
}

// Plain-language bands for the interference cost on a keyboard or touch task.
// These are rough guides, not clinical norms.
export const INTERFERENCE_BANDS = [
  { max: 40, label: 'Very small', tone: 'good' },
  { max: 120, label: 'Typical', tone: 'ok' },
  { max: 200, label: 'Larger than typical', tone: 'warn' },
  { max: Infinity, label: 'Large', tone: 'warn' },
];

export function interferenceBand(ms) {
  if (ms == null) return null;
  return INTERFERENCE_BANDS.find((b) => ms < b.max);
}

export function accuracyBand(pct) {
  if (pct == null) return null;
  if (pct >= 95) return { label: 'Very high', tone: 'good' };
  if (pct >= 88) return { label: 'Typical', tone: 'ok' };
  if (pct >= 75) return { label: 'A little low', tone: 'warn' };
  return { label: 'Low', tone: 'warn' };
}

// Compact encoding for share links: only summary numbers, never trial data.
export function encodeShare(s, mode) {
  const payload = [mode, s.accuracy, s.medianRT, s.interference, s.interferenceRatio].join('~');
  return btoa(payload).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeShare(code) {
  try {
    const raw = atob(code.replace(/-/g, '+').replace(/_/g, '/'));
    const [mode, accuracy, medianRT, interference, interferenceRatio] = raw.split('~');
    if (!MODES[mode]) return null;
    const num = (v) => (v === '' || v == null || isNaN(+v) ? null : +v);
    return { mode, accuracy: num(accuracy), medianRT: num(medianRT), interference: num(interference), interferenceRatio: num(interferenceRatio) };
  } catch {
    return null;
  }
}
