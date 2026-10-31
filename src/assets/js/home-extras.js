// Homepage interactions: cycling example words and the race diagram replay.
import { INKS } from './stroop-core.js';
import { L, display } from './i18n.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const FOUR = ['RED', 'BLUE', 'GREEN', 'YELLOW'];
const pick = (a) => a[Math.floor(Math.random() * a.length)];

// ---------- example words in the three trial-type cards ----------
function cycleWords() {
  const els = [...document.querySelectorAll('[data-cycle]')];
  if (!els.length || reduce) return;
  setInterval(() => {
    if (document.hidden || document.querySelector('.app.is-running')) return;
    for (const el of els) {
      const ink = pick(FOUR);
      const type = el.dataset.cycle;
      const word = type === 'congruent' ? ink : type === 'neutral' ? pick(L.neutral) : pick(FOUR.filter((c) => c !== ink));
      el.classList.remove('is-swap');
      void el.offsetWidth;
      el.classList.add('is-swap');
      setTimeout(() => {
        el.textContent = display(word);
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

cycleWords();
