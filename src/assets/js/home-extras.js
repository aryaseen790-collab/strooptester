// Homepage interactions: the 10-second taster, cycling example words and the race diagram.
import { INKS, NEUTRAL_WORDS, median, shuffle } from './stroop-core.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOUR = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- taster: 5 matching words, then 5 clashing ones ----------
function mountTaster(el) {
  const card = el.querySelector('.flip');
  const faces = [el.querySelector('.flip__front'), el.querySelector('.flip__back')];
  const status = el.querySelector('[data-status]');
  const startBtn = el.querySelector('[data-start]');
  const chips = el.querySelector('.taster__chips');
  const result = el.querySelector('[data-result]');
  let trials = [];
  let i = 0;
  let face = 0;
  let t0 = 0;
  let live = false;
  let rts = [];

  chips.innerHTML = FOUR.map(
    (c) => `<button type="button" class="chip-btn" data-c="${c}"><i style="background:${INKS[c].hex}"></i>${c.toLowerCase()}<kbd>${INKS[c].key.toUpperCase()}</kbd></button>`,
  ).join('');

  function build() {
    const matching = shuffle(FOUR).concat(pick(FOUR)).map((c) => ({ type: 'matching', word: c, ink: c }));
    const clashing = Array.from({ length: 5 }, () => {
      const ink = pick(FOUR);
      return { type: 'clashing', word: pick(FOUR.filter((c) => c !== ink)), ink };
    });
    return [...matching, ...clashing];
  }

  function show() {
    const t = trials[i];
    status.textContent = `${t.type === 'matching' ? 'Round 1 · matching words' : 'Round 2 · clashing words'}  (${(i % 5) + 1}/5)`;
    face = 1 - face;
    const f = faces[face];
    f.textContent = t.word;
    f.style.color = INKS[t.ink].hex;
    card.classList.toggle('is-flipped', face === 1);
    // Time from the end of the flip, when the word is fully readable.
    setTimeout(() => {
      t0 = performance.now();
      live = true;
    }, reduce ? 0 : 420);
  }

  function answer(c) {
    if (!live) return;
    live = false;
    const t = trials[i];
    const rt = performance.now() - t0;
    const ok = c === t.ink;
    el.classList.remove('is-good', 'is-bad');
    void el.offsetWidth;
    el.classList.add(ok ? 'is-good' : 'is-bad');
    if (ok) rts.push({ type: t.type, rt });
    i++;
    if (i < trials.length) setTimeout(show, 250);
    else finish();
  }

  function finish() {
    const m = median(rts.filter((r) => r.type === 'matching').map((r) => r.rt));
    const c = median(rts.filter((r) => r.type === 'clashing').map((r) => r.rt));
    status.textContent = 'Done!';
    faces[0].textContent = faces[1].textContent = '✓';
    faces[0].style.color = faces[1].style.color = 'var(--teal)';
    if (m == null || c == null) {
      result.innerHTML = `<p>Too many slips to measure. Have another go.</p>`;
    } else {
      const gap = Math.round(c - m);
      const max = Math.max(m, c);
      result.innerHTML = `
        <div class="gapbars in-view">
          <div><span>Matching</span><b style="--w:${(m / max) * 100}%;--c:var(--c-congruent)"></b><em>${Math.round(m)} ms</em></div>
          <div><span>Clashing</span><b style="--w:${(c / max) * 100}%;--c:var(--c-incongruent)"></b><em>${Math.round(c)} ms</em></div>
        </div>
        <p class="taster__verdict">${gap > 0 ? `The clash cost you about <strong>${gap} ms</strong> per word. That's the Stroop effect.` : `No slowdown this time. With only 10 words it's noisy, so the full test gives a fairer number.`} <a href="#test">Get your real score</a></p>`;
    }
    result.hidden = false;
    startBtn.textContent = 'Try again';
    startBtn.hidden = false;
  }

  startBtn.addEventListener('click', () => {
    trials = build();
    i = 0;
    rts = [];
    result.hidden = true;
    startBtn.hidden = true;
    show();
  });
  chips.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-c]');
    if (b) {
      e.preventDefault();
      answer(b.dataset.c);
    }
  });
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]');
    if (b && e.detail === 0) answer(b.dataset.c);
  });
  document.addEventListener('keydown', (e) => {
    if (!live || e.repeat || document.querySelector('.app.is-running')) return;
    const c = FOUR.find((n) => INKS[n].key === e.key.toLowerCase());
    if (c) {
      e.preventDefault();
      answer(c);
    }
  });
}

// ---------- example words in the three trial-type cards ----------
function cycleWords() {
  const els = [...document.querySelectorAll('[data-cycle]')];
  if (!els.length || reduce) return;
  setInterval(() => {
    if (document.hidden || document.querySelector('.app.is-running')) return;
    for (const el of els) {
      const ink = pick(FOUR);
      const type = el.dataset.cycle;
      const word = type === 'congruent' ? ink : type === 'neutral' ? pick(NEUTRAL_WORDS) : pick(FOUR.filter((c) => c !== ink));
      el.classList.remove('is-swap');
      void el.offsetWidth;
      el.classList.add('is-swap');
      setTimeout(() => {
        el.textContent = word;
        el.style.color = INKS[ink].hex;
      }, 180);
    }
  }, 2400);
}

// ---------- race diagram replay ----------
document.querySelectorAll('[data-race]').forEach((race) => {
  race.querySelector('[data-replay]')?.addEventListener('click', () => {
    race.classList.remove('in-view');
    void race.offsetWidth;
    race.classList.add('in-view');
  });
});

document.querySelectorAll('[data-taster]').forEach(mountTaster);
cycleWords();
