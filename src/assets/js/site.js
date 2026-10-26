// Shared behaviour for every page: mobile menu, FAQ accordions, cookie consent.
(() => {
  // A freshly opened page (not back/forward, no #section in the link) starts at the top.
  // Browsers do this already; embedded previews sometimes keep the old scroll position.
  const entry = performance.getEntriesByType('navigation')[0];
  if (!location.hash && (!entry || entry.type === 'navigate')) {
    window.scrollTo(0, 0);
    document.documentElement.scrollIntoView({ block: 'start' });
  }

  const toggle = document.querySelector('.nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('is-open', open);
    });
  }

  // Analytics only loads after an explicit "yes". The choice is remembered for a year.
  const GA_ID = document.documentElement.dataset.ga;
  const KEY = 'consent-v1';
  const read = () => {
    try {
      return localStorage.getItem(KEY);
    } catch {
      return null;
    }
  };
  const write = (v) => {
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* storage blocked: ask again next visit */
    }
  };

  function loadAnalytics() {
    if (!GA_ID || window.gtag) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', GA_ID, { anonymize_ip: true });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
    document.head.appendChild(s);
  }

  const banner = document.getElementById('consent');
  const choice = read();
  if (choice === 'yes') loadAnalytics();
  if (banner && GA_ID && !choice) banner.hidden = false;
  if (banner) {
    banner.addEventListener('click', (e) => {
      const v = e.target.closest('[data-consent]')?.dataset.consent;
      if (!v) return;
      write(v);
      banner.hidden = true;
      if (v === 'yes') loadAnalytics();
    });
  }
  document.querySelectorAll('[data-consent-reset]').forEach((b) =>
    b.addEventListener('click', () => {
      try {
        localStorage.removeItem(KEY);
      } catch {}
      if (banner) banner.hidden = false;
    }),
  );
})();
