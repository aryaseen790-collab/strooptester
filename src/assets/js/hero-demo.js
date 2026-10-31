// Hero card. While idle it plays a labelled example, alternating a matching and a clashing word,
// so the point of the test is visible at a glance. "Try 6 words" turns it into a tiny live
// version with a running stopwatch, then shows how much the clashing words slowed you down.
import { INKS, median, shuffle } from './stroop-core.js';
import { t, display, colorName, keyFor, idForKey } from './i18n.js';

const FOUR = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function mount(el) {
  const $ = (sel) => el.querySelector(sel);
  const word = $('[data-word]');
  const read = $('[data-read]');
  const ink = $('[data-ink]');
  const bar = $('[data-bar]');
  const ms = $('[data-ms]');
  const step = $('[data-step]');
  const chips = $('[data-chips]');
  const go = $('[data-go]');
  const msg = $('[data-msg]');
  const cm = $('[data-cm]');
  const cc = $('[data-cc]');
  const timers = [];
  const later = (fn, t) => timers.push(setTimeout(fn, t));
  const stopAll = () => {
    timers.forEach(clearTimeout);
    timers.length = 0;
    cancelAnimationFrame(raf);
    looping = false;
  };
  let raf = 0;
  let mode = 'idle';
  let paused = false;
  let visible = false;
  let looping = false;

  chips.innerHTML = FOUR.map(
    (c) => `<button type="button" class="chip-btn" data-c="${c}" aria-label="${colorName(c)}"><i style="background:${INKS[c].hex}"></i>${colorName(c)}<kbd>${keyFor(c, FOUR).toUpperCase()}</kbd></button>`,
  ).join('');

  const setWord = (w, c) => {
    word.textContent = display(w);
    word.style.color = INKS[c].hex;
    word.classList.remove('is-in');
    void word.offsetWidth;
    word.classList.add('is-in');
  };

  // Animate the stopwatch bar from 0 to `to` ms over the same real time.
  function runClock(to, done) {
    const t0 = performance.now();
    const tick = (t) => {
      const v = Math.min(to, t - t0);
      bar.style.width = `${Math.min(100, (v / 1000) * 100)}%`;
      ms.textContent = `${Math.round(v)} ms`;
      if (v < to) raf = requestAnimationFrame(tick);
      else done?.();
    };
    raf = requestAnimationFrame(tick);
  }

  // ---------- idle: labelled example loop ----------
  let clash = false;
  function idleStep() {
    if (mode !== 'idle' || paused) return;
    looping = true;
    clash = !clash;
    const c = pick(FOUR);
    const w = clash ? pick(FOUR.filter((x) => x !== c)) : c;
    el.classList.toggle('is-clash', clash);
    step.textContent = clash ? t('dExClashing') : t('dExMatching');
    setWord(w, c);
    read.innerHTML = t('dWordSays', { w: display(w) });
    ink.innerHTML = clash ? t('dInkClash', { c: colorName(c) }) : t('dInkMatch', { c: colorName(c) });
    read.classList.remove('is-on');
    ink.classList.remove('is-on');
    bar.style.width = '0%';
    ms.textContent = '0 ms';
    bar.parentElement.classList.toggle('is-clash', clash);
    const target = clash ? 600 + Math.round(Math.random() * 60) : 500 + Math.round(Math.random() * 40);
    if (reduce) {
      read.classList.add('is-on');
      ink.classList.add('is-on');
      bar.style.width = `${target / 10}%`;
      ms.textContent = `${target} ms`;
      later(idleStep, 4000);
      return;
    }
    later(() => read.classList.add('is-on'), 350);
    later(() => ink.classList.add('is-on'), clash ? 1100 : 700);
    later(
      () =>
        runClock(target, () => {
          (clash ? cc : cm).textContent = `~${target} ms`;
          (clash ? cc : cm).parentElement.classList.add('is-flash');
          later(() => (clash ? cc : cm).parentElement.classList.remove('is-flash'), 600);
          later(idleStep, 2000);
        }),
      300,
    );
  }

  // ---------- try it: 3 matching + 3 clashing, shuffled ----------
  let trials = [];
  let i = 0;
  let t0 = 0;
  let live = false;
  const results = [];

  function startTry() {
    stopAll();
    mode = 'try';
    el.classList.add('is-trying');
    el.classList.remove('is-done', 'is-clash');
    chips.hidden = false;
    go.hidden = true;
    msg.textContent = t('dAnswerFast');
    read.classList.remove('is-on');
    ink.classList.remove('is-on');
    const types = shuffle(['m', 'm', 'm', 'c', 'c', 'c']);
    trials = types.map((t) => {
      const c = pick(FOUR);
      return { clash: t === 'c', ink: c, word: t === 'c' ? pick(FOUR.filter((x) => x !== c)) : c };
    });
    i = 0;
    results.length = 0;
    next();
  }

  function next() {
    step.textContent = t('dWordN', { i: i + 1, n: trials.length });
    word.textContent = '+';
    word.style.color = '';
    word.classList.remove('is-in');
    bar.style.width = '0%';
    ms.textContent = '0 ms';
    later(() => {
      const trial = trials[i];
      // The word itself appears without animation so the timing is fair.
      word.textContent = display(trial.word);
      word.style.color = INKS[trial.ink].hex;
      requestAnimationFrame((ts) => {
        t0 = ts;
        live = true;
        const tick = (now) => {
          if (!live) return;
          const v = now - t0;
          bar.style.width = `${Math.min(100, v / 10)}%`;
          ms.textContent = `${Math.round(v)} ms`;
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      });
    }, 450 + Math.random() * 250);
  }

  function answer(c, when) {
    if (!live) return;
    live = false;
    cancelAnimationFrame(raf);
    const trial = trials[i];
    const rt = Math.round((when ?? performance.now()) - t0);
    const ok = c === trial.ink;
    ms.textContent = `${rt} ms`;
    results.push({ ...trial, rt, ok });
    el.classList.remove('is-good', 'is-bad');
    void el.offsetWidth;
    el.classList.add(ok ? 'is-good' : 'is-bad');
    msg.textContent = ok ? t(trial.clash ? 'dRightClashing' : 'dRightMatching') : t('dInkWas', { c: colorName(trial.ink) });
    i++;
    if (i < trials.length) later(next, 650);
    else later(finish, 650);
  }

  function finish() {
    mode = 'done';
    chips.hidden = true;
    el.classList.remove('is-trying');
    el.classList.add('is-done');
    const m = median(results.filter((r) => r.ok && !r.clash).map((r) => r.rt));
    const c = median(results.filter((r) => r.ok && r.clash).map((r) => r.rt));
    cm.textContent = m == null ? t('na') : `${Math.round(m)} ms`;
    cc.textContent = c == null ? t('na') : `${Math.round(c)} ms`;
    step.textContent = t('dYourResult');
    word.style.color = 'var(--teal)';
    if (m != null && c != null) {
      const gap = Math.round(c - m);
      word.textContent = gap > 0 ? `+${gap} ms` : `${gap} ms`;
      msg.innerHTML = gap > 0 ? t('dGap', { ms: gap }) : t('dNoGap');
    } else {
      word.textContent = t('dOops');
      msg.innerHTML = t('dSlips');
    }
    go.textContent = t('dTryAgain');
    go.hidden = false;
  }

  go.addEventListener('click', startTry);
  chips.addEventListener('pointerdown', (e) => {
    const b = e.target.closest('[data-c]');
    if (!b) return;
    e.preventDefault();
    answer(b.dataset.c, e.timeStamp);
  });
  chips.addEventListener('click', (e) => {
    const b = e.target.closest('[data-c]');
    if (b && e.detail === 0) answer(b.dataset.c, e.timeStamp);
  });
  document.addEventListener('keydown', (e) => {
    if (mode !== 'try' || !live || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    const c = idForKey(e.key, FOUR);
    if (!c) return;
    e.preventDefault();
    answer(c, e.timeStamp);
  });

  // Pause the example loop when it's off screen or the real test is running.
  let testRunning = false;
  const update = () => {
    paused = !visible || testRunning || document.hidden;
    if (mode !== 'idle') return;
    if (paused) stopAll();
    else if (!looping) idleStep();
  };
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    update();
  }).observe(el);
  document.addEventListener('stroop:running', (e) => {
    testRunning = !!e.detail;
    update();
  });
  document.addEventListener('visibilitychange', update);
}

document.querySelectorAll('[data-demo]').forEach(mount);
