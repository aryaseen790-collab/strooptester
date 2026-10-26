// Motion and interaction layer shared by every page. Everything here is decoration:
// the page reads fine without it, and it all switches off for prefers-reduced-motion.
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const root = document.documentElement;

  // Header gains a shadow once the page scrolls.
  const header = document.querySelector('.site-header');
  const progress = document.querySelector('.read-progress span');
  const article = document.querySelector('.article__body');
  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      ticking = false;
      header?.classList.toggle('is-scrolled', scrollY > 8);
      if (progress && article) {
        const r = article.getBoundingClientRect();
        const pct = Math.min(1, Math.max(0, -r.top / Math.max(1, r.height - innerHeight)));
        progress.style.transform = `scaleX(${pct})`;
      }
    });
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Table of contents follows the section you're reading.
  const tocLinks = [...document.querySelectorAll('.toc a[href^="#"]')];
  if (tocLinks.length) {
    const byId = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
    const spy = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          tocLinks.forEach((a) => a.classList.remove('is-active'));
          byId.get(e.target.id)?.classList.add('is-active');
        }
      },
      { rootMargin: '-20% 0px -70% 0px' },
    );
    byId.forEach((_, id) => {
      const h = document.getElementById(id);
      if (h) spy.observe(h);
    });
  }

  // Generic "in view" hook used by the animated diagrams.
  const inview = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('in-view');
        e.target.dispatchEvent(new CustomEvent('inview'));
        inview.unobserve(e.target);
      }
    },
    { threshold: 0.35 },
  );
  document.querySelectorAll('[data-inview]').forEach((el) => inview.observe(el));

  if (reduce) {
    document.querySelectorAll('[data-inview]').forEach((el) => el.classList.add('in-view'));
    return;
  }

  // Scroll reveal. Only elements that start below the fold are hidden, so the first
  // screen is always complete, and anything missed by the observer still shows.
  const revealables = document.querySelectorAll(
    '.section__head, .card, .post-card, .stat, figure, .faq details, .table-scroll, .article__body > h2, .cta-inline, .chart, .metric, .refs li',
  );
  const reveal = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('is-in');
        reveal.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px' },
  );
  const groups = new Map();
  revealables.forEach((el) => {
    if (el.getBoundingClientRect().top < innerHeight * 0.92) return;
    // stagger siblings inside the same grid
    const parent = el.parentElement;
    const i = groups.get(parent) || 0;
    groups.set(parent, i + 1);
    el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`);
    el.classList.add('reveal');
    reveal.observe(el);
  });
  root.classList.add('motion');

  // Count-up numbers: <span data-count="1935">1935</span>
  const counter = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        counter.unobserve(e.target);
        const el = e.target;
        const to = parseFloat(el.dataset.count);
        const from = parseFloat(el.dataset.from || 0);
        const dur = 1400;
        const t0 = performance.now();
        const step = (t) => {
          const k = Math.min(1, (t - t0) / dur);
          const eased = 1 - Math.pow(1 - k, 4);
          el.textContent = Math.round(from + (to - from) * eased).toLocaleString('en-US', { useGrouping: to >= 10000 });
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    },
    { threshold: 0.6 },
  );
  document.querySelectorAll('[data-count]').forEach((el) => counter.observe(el));

  if (!fine) return;

  // 3D tilt with a moving highlight on cards.
  const tiltables = document.querySelectorAll('[data-tilt], .post-card, .stat');
  tiltables.forEach((el) => {
    el.classList.add('tilt');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--rx', `${(0.5 - py) * 7}deg`);
      el.style.setProperty('--ry', `${(px - 0.5) * 9}deg`);
      el.style.setProperty('--gx', `${px * 100}%`);
      el.style.setProperty('--gy', `${py * 100}%`);
    });
    el.addEventListener('pointerleave', () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    });
  });

  // Magnetic primary buttons.
  document.querySelectorAll('.btn--lg').forEach((b) => {
    b.addEventListener('pointermove', (e) => {
      const r = b.getBoundingClientRect();
      b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.18}px, ${(e.clientY - r.top - r.height / 2) * 0.25}px)`;
    });
    b.addEventListener('pointerleave', () => (b.style.transform = ''));
  });

  // Hero glow follows the cursor.
  const hero = document.querySelector('.hero');
  const bg = document.querySelector('.hero__bg');
  if (hero && bg) {
    hero.addEventListener('pointermove', (e) => {
      const r = hero.getBoundingClientRect();
      bg.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
      bg.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
    });
  }
})();
