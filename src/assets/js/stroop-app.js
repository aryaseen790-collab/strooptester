import {
  INKS,
  MODES,
  makeTrials,
  makePractice,
  score,
  interferenceBand,
  accuracyBand,
  encodeShare,
  decodeShare,
} from './stroop-core.js';

const $ = (id) => document.getElementById(id);
const root = $('stroop-app');
const HISTORY_KEY = 'stroop-history-v1';

const state = {
  mode: 'standard',
  phase: 'setup', // setup | practice | practice-done | test | paused | results
  trials: [],
  results: [],
  idx: 0,
  shownAt: 0,
  awaiting: false,
  timers: [],
  lastScores: null,
};

const later = (fn, ms) => state.timers.push(setTimeout(fn, ms));
const clearTimers = () => {
  state.timers.forEach(clearTimeout);
  state.timers = [];
};

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

function show(phase) {
  state.phase = phase;
  // Lets decorative animations elsewhere on the page pause while timing matters.
  document.dispatchEvent(new CustomEvent('stroop:running', { detail: phase === 'practice' || phase === 'test' }));
  root.querySelectorAll('[data-phase]').forEach((el) => {
    el.hidden = el.dataset.phase !== phase && !(phase === 'practice' && el.dataset.phase === 'test');
  });
  root.classList.toggle('is-running', phase === 'practice' || phase === 'test');
  $('arena-label').textContent = phase === 'practice' ? 'Practice round (not scored)' : 'Scored test';
}

function buildPad(inks) {
  const pad = $('response-pad');
  pad.innerHTML = '';
  pad.style.setProperty('--cols', inks.length > 4 ? 3 : inks.length);
  for (const name of inks) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'resp';
    b.dataset.color = name;
    b.innerHTML = `<span class="resp__dot" style="background:${INKS[name].hex}" aria-hidden="true"></span><span class="resp__name">${name}</span><kbd>${INKS[name].key.toUpperCase()}</kbd>`;
    b.setAttribute('aria-label', `${name.toLowerCase()} (key ${INKS[name].key.toUpperCase()})`);
    pad.appendChild(b);
  }
}

function start(practice) {
  const mode = MODES[state.mode];
  clearTimers();
  state.practice = practice;
  state.trials = practice ? makePractice(mode.inks) : makeTrials(mode.trials, mode.inks);
  state.results = [];
  state.idx = 0;
  buildPad(mode.inks);
  root.classList.toggle('is-cvd', state.mode === 'cvd');
  show(practice ? 'practice' : 'test');
  $('stimulus').textContent = '';
  updateProgress();
  countdown();
  $('arena').focus({ preventScroll: true });
  $('arena').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
}

// 3, 2, 1 before the first word. Only the countdown animates; trial words appear instantly.
function countdown() {
  const stim = $('stimulus');
  let n = 3;
  const tick = () => {
    if (n === 0) {
      stim.className = 'stimulus';
      stim.textContent = '';
      later(nextTrial, 150);
      return;
    }
    stim.textContent = String(n);
    stim.style.color = '';
    stim.className = 'stimulus';
    void stim.offsetWidth;
    stim.className = 'stimulus is-count';
    n--;
    later(tick, 600);
  };
  tick();
}

function updateProgress() {
  const total = state.trials.length;
  $('progress-fill').style.width = `${(state.idx / total) * 100}%`;
  $('progress-text').textContent = `${Math.min(state.idx + 1, total)} / ${total}`;
}

function nextTrial() {
  if (state.idx >= state.trials.length) return finish();
  updateProgress();
  const stim = $('stimulus');
  stim.textContent = '+';
  stim.className = 'stimulus is-fixation';
  stim.style.color = '';
  // Jittered fixation so the next word cannot be anticipated.
  later(() => {
    const t = state.trials[state.idx];
    stim.textContent = t.word;
    stim.className = 'stimulus';
    stim.style.color = INKS[t.ink].hex;
    // Start the clock on the frame that paints the word.
    requestAnimationFrame((ts) => {
      state.shownAt = ts;
      state.awaiting = true;
      const deadline = MODES[state.mode].deadline;
      if (deadline && !state.practice) later(() => respond(null, null), deadline);
    });
  }, 400 + Math.random() * 300);
}

function respond(color, eventTime) {
  if (!state.awaiting) return;
  state.awaiting = false;
  clearTimers();
  const t = state.trials[state.idx];
  const rt = color == null ? null : Math.round((eventTime ?? performance.now()) - state.shownAt);
  state.results.push({ ...t, response: color, rt });
  state.idx++;
  const stim = $('stimulus');
  if (state.practice) {
    const ok = color === t.ink;
    $('feedback').textContent = color == null ? 'Too slow' : ok ? `Correct · ${rt} ms` : `Not quite. The ink was ${t.ink.toLowerCase()}.`;
    $('feedback').className = `feedback ${ok ? 'is-good' : 'is-bad'}`;
    later(() => {
      $('feedback').textContent = '';
      nextTrial();
    }, 900);
  } else {
    if (color == null) $('feedback').textContent = 'Too slow';
    later(() => {
      $('feedback').textContent = '';
      nextTrial();
    }, color == null ? 500 : 250);
  }
  stim.textContent = '';
}

function finish() {
  clearTimers();
  if (state.practice) {
    const s = score(state.results);
    $('practice-summary').textContent = `You got ${s.correct} of ${s.total} right${s.medianRT ? `, with a typical response of ${s.medianRT} ms` : ''}.`;
    show('practice-done');
    return;
  }
  const s = score(state.results);
  state.lastScores = s;
  saveHistory(s);
  renderResults(s);
  show('results');
  $('results').focus({ preventScroll: true });
  $('results').scrollIntoView({ block: 'start' });
}

// ---------- results ----------

const fmt = (v, unit = '') => (v == null ? 'n/a' : `${v}${unit}`);

function badge(el, band) {
  el.textContent = band ? band.label : '';
  el.className = `badge ${band ? `badge--${band.tone}` : ''}`;
}

function renderResults(s) {
  $('r-date').textContent = new Date().toLocaleString(undefined, { dateStyle: 'long', timeStyle: 'short' });
  $('r-mode').textContent = MODES[state.mode].label;
  $('r-accuracy').textContent = fmt(s.accuracy, '%');
  $('r-rt').textContent = fmt(s.medianRT, ' ms');
  $('r-interference').textContent = s.interference == null ? 'n/a' : `${s.interference > 0 ? '+' : ''}${s.interference} ms`;
  $('r-ratio').textContent = s.interferenceRatio == null ? 'n/a' : `${s.interferenceRatio}%`;
  badge($('b-accuracy'), accuracyBand(s.accuracy));
  badge($('b-interference'), interferenceBand(s.interference));
  $('r-ies').textContent = fmt(s.inverseEfficiency, ' ms');
  renderTypeChart(s);
  renderTrialChart(state.results);
  animateNumbers();
  if (s.accuracy >= 95) confetti();
  renderNarrative(s);
  renderHistory();
}

function renderTypeChart(s) {
  const rows = [
    ['Matching', s.byType.congruent, 'var(--c-congruent)'],
    ['Neutral', s.byType.neutral, 'var(--c-neutral)'],
    ['Clashing', s.byType.incongruent, 'var(--c-incongruent)'],
  ];
  const max = Math.max(...rows.map(([, r]) => r.medianRT || 0), 1);
  $('chart-types').innerHTML = rows
    .map(
      ([label, r, color]) => `
      <div class="bar-row">
        <span class="bar-row__label">${label}</span>
        <span class="bar-row__track"><span class="bar-row__fill" style="width:${((r.medianRT || 0) / max) * 100}%;background:${color}"></span></span>
        <span class="bar-row__value">${fmt(r.medianRT, ' ms')}<small>${fmt(r.accuracy, '% right')}</small></span>
      </div>`,
    )
    .join('');
}

function renderTrialChart(results) {
  const W = 640;
  const H = 220;
  const pad = { l: 44, r: 10, t: 12, b: 28 };
  const rts = results.map((r) => r.rt).filter((v) => v != null);
  const yMax = Math.min(3000, Math.max(800, Math.ceil(Math.max(...rts, 0) / 200) * 200));
  const x = (i) => pad.l + (i / Math.max(results.length - 1, 1)) * (W - pad.l - pad.r);
  const y = (v) => pad.t + (1 - Math.min(v, yMax) / yMax) * (H - pad.t - pad.b);
  const colors = { congruent: 'var(--c-congruent)', neutral: 'var(--c-neutral)', incongruent: 'var(--c-incongruent)' };
  let grid = '';
  for (let v = 0; v <= yMax; v += yMax / 4) {
    grid += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(v)}" y2="${y(v)}" class="grid"/><text x="${pad.l - 6}" y="${y(v) + 4}" text-anchor="end">${Math.round(v)}</text>`;
  }
  const dots = results
    .map((r, i) => {
      if (r.rt == null) return `<text x="${x(i)}" y="${y(yMax) + 4}" text-anchor="middle" class="miss">×</text>`;
      const wrong = r.response !== r.ink;
      return `<circle class="dot" style="--i:${i}" cx="${x(i)}" cy="${y(r.rt)}" r="4" fill="${wrong ? 'none' : colors[r.type]}" stroke="${colors[r.type]}" stroke-width="${wrong ? 2 : 0}"><title>Trial ${i + 1}: ${r.type}, ${r.rt} ms${wrong ? ', wrong' : ''}</title></circle>`;
    })
    .join('');
  $('chart-trials').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Response time for each trial">${grid}<text x="${W / 2}" y="${H - 4}" text-anchor="middle">Trial</text>${dots}</svg>`;
}

function renderNarrative(s) {
  const parts = [];
  const band = interferenceBand(s.interference);
  if (s.interference != null) {
    const dir = s.interference >= 0 ? 'slower' : 'faster';
    parts.push(
      `On words that clashed with their ink you were <strong>${Math.abs(s.interference)} ms ${dir}</strong> than on words that matched. That gap is your Stroop interference${band ? `, and it falls in the <strong>${band.label.toLowerCase()}</strong> range for a keyboard or touchscreen test` : ''}.`,
    );
  }
  if (s.interference != null && s.interference < 0) {
    parts.push(
      'A negative gap is unusual. It mostly happens on short runs, when there are only a few trials of each type or a couple of slow answers on matching words. Try the Standard level again for a steadier number.',
    );
  } else if (s.interferenceRatio != null) {
    parts.push(
      `As a share of your own matching-word speed, the clash cost you about <strong>${s.interferenceRatio}%</strong>. This version of the number is fairer across ages, because it cancels out general speed.`,
    );
  }
  parts.push(`You answered <strong>${s.correct} of ${s.total}</strong> correctly (${s.accuracy}%).`);
  if (s.errorCost != null && s.errorCost > 8) {
    parts.push(`Most slips came on clashing words, where accuracy was ${s.errorCost} points lower than on matching words. That is the same pull showing up as errors instead of delay.`);
  }
  if (s.fatigue) {
    const c = s.fatigue.change;
    if (c > 60) parts.push(`You slowed by about ${c} ms in the second half, which usually just means attention dipped as the run went on.`);
    else if (c < -60) parts.push(`You sped up by about ${-c} ms in the second half, a normal warm-up effect.`);
  }
  const ex = s.excluded;
  const dropped = ex.anticipations + ex.slow + ex.misses;
  if (dropped) {
    parts.push(`${dropped} response${dropped > 1 ? 's were' : ' was'} left out of the timing (too fast to be a real decision, longer than 3 seconds, or past the time limit).`);
  }
  $('narrative').innerHTML = parts.map((p) => `<p>${p}</p>`).join('');
}

// Count the headline numbers up from zero.
function animateNumbers() {
  if (reduceMotion) return;
  root.querySelectorAll('.metric__value').forEach((el, k) => {
    const text = el.textContent;
    const m = text.match(/^([+-]?)(\d+(?:\.\d+)?)(.*)$/);
    if (!m) return;
    const [, sign, num, rest] = m;
    const to = parseFloat(num);
    const dp = num.includes('.') ? 1 : 0;
    const t0 = performance.now() + k * 90;
    const step = (t) => {
      const p = Math.max(0, Math.min(1, (t - t0) / 900));
      const v = to * (1 - Math.pow(1 - p, 3));
      el.textContent = `${sign}${v.toFixed(dp)}${rest}`;
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = text;
    };
    requestAnimationFrame(step);
  });
}

function confetti() {
  if (reduceMotion) return;
  const panel = $('results');
  const c = document.createElement('canvas');
  c.className = 'confetti';
  c.setAttribute('aria-hidden', 'true');
  panel.appendChild(c);
  const r = panel.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, 2);
  c.width = r.width * dpr;
  c.height = Math.min(r.height, 700) * dpr;
  const ctx = c.getContext('2d');
  ctx.scale(dpr, dpr);
  const colors = Object.values(INKS).slice(0, 6).map((v) => v.hex);
  const bits = Array.from({ length: 140 }, () => ({
    x: r.width / 2,
    y: 90,
    vx: (Math.random() - 0.5) * 14,
    vy: -Math.random() * 11 - 4,
    w: 6 + Math.random() * 6,
    h: 4 + Math.random() * 4,
    a: Math.random() * Math.PI,
    va: (Math.random() - 0.5) * 0.3,
    c: colors[Math.floor(Math.random() * colors.length)],
  }));
  const t0 = performance.now();
  const step = (t) => {
    const age = t - t0;
    ctx.clearRect(0, 0, c.width, c.height);
    for (const b of bits) {
      b.vy += 0.35;
      b.vx *= 0.99;
      b.x += b.vx;
      b.y += b.vy;
      b.a += b.va;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - age / 2200);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.a);
      ctx.fillStyle = b.c;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
    if (age < 2200) requestAnimationFrame(step);
    else c.remove();
  };
  requestAnimationFrame(step);
}

// ---------- history (stays in this browser only) ----------

function readHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
}

function saveHistory(s) {
  try {
    const h = readHistory();
    h.push({ at: Date.now(), mode: state.mode, accuracy: s.accuracy, medianRT: s.medianRT, interference: s.interference });
    localStorage.setItem(HISTORY_KEY, JSON.stringify(h.slice(-30)));
  } catch {
    /* private mode or storage disabled */
  }
}

function renderHistory() {
  const h = readHistory();
  const box = $('history');
  if (h.length < 2) {
    box.hidden = true;
    return;
  }
  box.hidden = false;
  $('history-rows').innerHTML = h
    .slice(-8)
    .reverse()
    .map(
      (r) => `<tr><td>${new Date(r.at).toLocaleDateString()}</td><td>${MODES[r.mode]?.label || r.mode}</td><td>${fmt(r.accuracy, '%')}</td><td>${fmt(r.medianRT, ' ms')}</td><td>${fmt(r.interference, ' ms')}</td></tr>`,
    )
    .join('');
}

// ---------- actions ----------

function downloadCSV() {
  const head = 'trial,type,word,ink,response,rt_ms,correct';
  const rows = state.results.map((r, i) => [i + 1, r.type, r.word, r.ink, r.response ?? '', r.rt ?? '', r.response === r.ink ? 1 : 0].join(','));
  const blob = new Blob([[head, ...rows].join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `stroop-results-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function share() {
  const s = state.lastScores;
  if (!s) return;
  const url = `${location.origin}/?r=${encodeShare(s, state.mode)}#test`;
  const text = `My Stroop result: ${s.accuracy}% correct, ${s.interference} ms interference.`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'My Stroop test result', text, url });
      return;
    }
    await navigator.clipboard.writeText(url);
    $('share-status').textContent = 'Link copied.';
  } catch {
    $('share-status').textContent = url;
  }
}

function showShared() {
  const code = new URLSearchParams(location.search).get('r');
  if (!code) return;
  const s = decodeShare(code);
  if (!s) return;
  const box = $('shared');
  box.hidden = false;
  box.querySelector('[data-shared]').innerHTML =
    `Someone shared a ${MODES[s.mode].label.toLowerCase()} result with you: <strong>${fmt(s.accuracy, '%')}</strong> correct, typical response <strong>${fmt(s.medianRT, ' ms')}</strong>, interference <strong>${fmt(s.interference, ' ms')}</strong>. How do you compare?`;
}

// ---------- wiring ----------

root.querySelectorAll('[data-mode]').forEach((btn) =>
  btn.addEventListener('click', () => {
    state.mode = btn.dataset.mode;
    root.querySelectorAll('[data-mode]').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)));
  }),
);

$('btn-begin').addEventListener('click', () => start($('practice-toggle').checked));
$('btn-real').addEventListener('click', () => start(false));
$('btn-again').addEventListener('click', () => {
  show('setup');
  $('test').scrollIntoView({ block: 'start' });
});
$('btn-csv').addEventListener('click', downloadCSV);
$('btn-print').addEventListener('click', () => {
  document.body.classList.add('printing-results');
  window.print();
});
window.addEventListener('afterprint', () => document.body.classList.remove('printing-results'));
$('btn-share').addEventListener('click', share);
$('btn-resume').addEventListener('click', () => {
  show(state.practice ? 'practice' : 'test');
  later(nextTrial, 600);
});

// pointerdown fires before click, which trims touch latency.
$('response-pad').addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.resp');
  if (!b) return;
  e.preventDefault();
  respond(b.dataset.color, e.timeStamp);
});
// Enter/Space on a focused button (screen readers, switch access) produces a click with detail 0.
$('response-pad').addEventListener('click', (e) => {
  const b = e.target.closest('.resp');
  if (b && e.detail === 0) respond(b.dataset.color, e.timeStamp);
});

document.addEventListener('keydown', (e) => {
  if (state.phase !== 'practice' && state.phase !== 'test') return;
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
  const name = MODES[state.mode].inks.find((n) => INKS[n].key === e.key.toLowerCase());
  if (!name) return;
  e.preventDefault();
  const b = root.querySelector(`.resp[data-color="${name}"]`);
  if (b) {
    b.classList.add('is-pressed');
    setTimeout(() => b.classList.remove('is-pressed'), 120);
  }
  respond(name, e.timeStamp);
});

// Switching tabs mid-trial would ruin the timing, so pause and redo that trial.
document.addEventListener('visibilitychange', () => {
  if (document.hidden && (state.phase === 'practice' || state.phase === 'test')) {
    clearTimers();
    state.awaiting = false;
    $('stimulus').textContent = '';
    show('paused');
  }
});

showShared();
