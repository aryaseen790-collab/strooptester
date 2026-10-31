// Homepage in any language: hero, the test itself, and the explainer sections underneath.
// All wording comes from the locale (src/i18n/<code>.mjs); English is the source.
import { INKS } from '../assets/js/stroop-core.js';

const MODIFIED = '2026-10-31';
const fill = (s, vars) => String(s).replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? `{${k}}`);

const REFERENCES = `
<li>Stroop, J. R. (1935). Studies of interference in serial verbal reactions. <em>Journal of Experimental Psychology, 18</em>(6), 643–662. <a href="https://doi.org/10.1037/h0054651" rel="noopener">doi:10.1037/h0054651</a></li>
<li>MacLeod, C. M. (1991). Half a century of research on the Stroop effect: An integrative review. <em>Psychological Bulletin, 109</em>(2), 163–203. <a href="https://doi.org/10.1037/0033-2909.109.2.163" rel="noopener">doi:10.1037/0033-2909.109.2.163</a></li>
<li>Pardo, J. V., Pardo, P. J., Janer, K. W., &amp; Raichle, M. E. (1990). The anterior cingulate cortex mediates processing selection in the Stroop attentional conflict paradigm. <em>PNAS, 87</em>(1), 256–259. <a href="https://doi.org/10.1073/pnas.87.1.256" rel="noopener">doi:10.1073/pnas.87.1.256</a></li>
<li>Cohen, J. D., Dunbar, K., &amp; McClelland, J. L. (1990). On the control of automatic processes: A parallel distributed processing account of the Stroop effect. <em>Psychological Review, 97</em>(3), 332–361. <a href="https://doi.org/10.1037/0033-295X.97.3.332" rel="noopener">doi:10.1037/0033-295X.97.3.332</a></li>
<li>MacDonald, A. W., Cohen, J. D., Stenger, V. A., &amp; Carter, C. S. (2000). Dissociating the role of the dorsolateral prefrontal and anterior cingulate cortex in cognitive control. <em>Science, 288</em>(5472), 1835–1838. <a href="https://doi.org/10.1126/science.288.5472.1835" rel="noopener">doi:10.1126/science.288.5472.1835</a></li>
<li>Verhaeghen, P., &amp; De Meersman, L. (1998). Aging and the Stroop effect: A meta-analysis. <em>Psychology and Aging, 13</em>(1), 120–126. <a href="https://doi.org/10.1037/0882-7974.13.1.120" rel="noopener">doi:10.1037/0882-7974.13.1.120</a></li>
<li>Townsend, J. T., &amp; Ashby, F. G. (1983). <em>Stochastic Modeling of Elementary Psychological Processes.</em> Cambridge University Press.</li>
<li>Guiney, H., &amp; Machado, L. (2013). Benefits of regular aerobic exercise for executive functioning in healthy populations. <em>Psychonomic Bulletin &amp; Review, 20</em>(1), 73–86. <a href="https://doi.org/10.3758/s13423-012-0345-4" rel="noopener">doi:10.3758/s13423-012-0345-4</a></li>
<li>Scarpina, F., &amp; Tagini, S. (2017). The Stroop Color and Word Test. <em>Frontiers in Psychology, 8</em>, 557. <a href="https://doi.org/10.3389/fpsyg.2017.00557" rel="noopener">doi:10.3389/fpsyg.2017.00557</a></li>`;

const LEVEL_INKS = {
  easy: ['RED', 'BLUE', 'GREEN', 'YELLOW'],
  standard: ['RED', 'BLUE', 'GREEN', 'YELLOW'],
  hard: ['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE'],
  cvd: ['BLUE', 'YELLOW', 'WHITE'],
};

// Same rule as i18n.js in the browser: letter keys if the language has them, else 1, 2, 3...
const keyFor = (L, id, inks) => ((L.keys && L.keys[id]) || String(inks.indexOf(id) + 1)).toUpperCase();
const inkList = (L, inks) => inks.map((id) => `${L.colorNames[id]} (${keyFor(L, id, inks)})`).join(', ');

export function homePage({ site, L, posts, postCard, picture, version, path, alternates }) {
  const H = L.home;
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  const faqHtml = H.faq.map(([q, a]) => `<details><summary>${q}</summary><div>${a}</div></details>`).join('\n');
  const four = LEVEL_INKS.standard;
  const keysHtml = four.map((id) => `<kbd>${keyFor(L, id, four)}</kbd> ${L.colorNames[id]}`).join(', ');
  const word = (id, ink) => `<strong style="color:${INKS[ink].hex}">${L.colors[id]}</strong>`;
  const levels = ['easy', 'standard', 'hard', 'cvd'];
  const howRows = levels
    .map((m) => {
      const inks = LEVEL_INKS[m];
      const colours = m === 'hard' ? `+ ${inkList(L, ['PURPLE', 'ORANGE']).replace(/\((\d)\)/g, (_, d) => `(${Number(d) + 4})`)}` : inkList(L, inks) + (m === 'cvd' ? `, ${H.howOnGrey}` : '');
      return `<tr><td>${L.ui[`mode_${m}`]}</td><td>${{ easy: 20, standard: 40, hard: 60, cvd: 30 }[m]}</td><td>${colours}</td><td>${m === 'hard' ? H.howLimit : H.howNone}</td><td>${H.howGood[m]}</td></tr>`;
    })
    .join('');
  const bands = ['verySmall', 'typical', 'larger', 'large'];

  const body = `
<script type="application/json" id="i18n">${JSON.stringify({ lang: L.lang, colors: L.colors, colorNames: L.colorNames, neutral: L.neutral, keys: L.keys, ui: L.ui }).replace(/</g, '\\u003c')}</script>
<section class="hero">
  <div class="hero__bg" aria-hidden="true"></div>
  <div class="wrap">
    <div>
      <span class="eyebrow">${H.eyebrow}</span>
      <h1>${H.h1} <span>${H.h1sub}</span></h1>
      <p>${H.heroP}</p>
      <div class="hero__ctas">
        <a class="btn btn--lg" href="#test">${H.ctaStart}</a>
        <a class="btn btn--ghost btn--lg" href="#about">${H.ctaHow}</a>
      </div>
      <ul class="hero__facts">${H.facts.map((f) => `<li>${f}</li>`).join('')}</ul>
    </div>
    <div class="demo" data-demo aria-labelledby="demo-title">
      <div class="demo__top">
        <span class="demo__title" id="demo-title">${H.demoTitle}</span>
        <span class="demo__step" data-step>${H.demoStep}</span>
      </div>
      <div class="demo__stage">
        <div class="demo__word" data-word style="color:${INKS.RED.hex}">${L.colors.BLUE}</div>
        <div class="demo__notes" aria-live="polite">
          <span class="demo__note demo__note--read" data-read>${fill(L.ui.dWordSays, { w: L.colors.BLUE })}</span>
          <span class="demo__note demo__note--ink" data-ink>${fill(L.ui.dInkClash, { c: L.colorNames.RED })}</span>
        </div>
      </div>
      <div class="demo__timer" aria-hidden="true">
        <div class="demo__bar"><span data-bar></span></div>
        <span class="demo__ms" data-ms>0 ms</span>
      </div>
      <div class="demo__compare" data-compare>
        <div><i style="background:var(--c-congruent)"></i>${H.demoMatching} <b data-cm>~520 ms</b></div>
        <div><i style="background:var(--c-incongruent)"></i>${H.demoClashing} <b data-cc>~620 ms</b></div>
      </div>
      <div class="demo__chips" data-chips hidden></div>
      <div class="demo__foot">
        <button class="btn" type="button" data-go>${H.demoGo}</button>
        <span class="note" data-msg>${H.demoMsg}</span>
      </div>
    </div>
  </div>
</section>

<section class="section" id="test" aria-labelledby="test-heading">
  <div class="wrap">
    <div class="section__head">
      <span class="kicker">${H.testKicker}</span>
      <h2 id="test-heading">${H.testH2}</h2>
      <p>${H.testP}</p>
    </div>

    <div class="app" id="stroop-app">
      <div class="callout shared" id="shared" hidden><p data-shared></p></div>

      <div class="app__panel" data-phase="setup">
        <h3>${H.chooseLevel}</h3>
        <div class="modes" role="group" aria-label="${H.chooseLevel}">
          ${levels.map((m) => `<button class="mode" type="button" data-mode="${m}" aria-pressed="${m === 'standard'}"><strong>${L.ui[`mode_${m}`]}</strong><span>${H.modeDesc[m]}</span></button>`).join('\n          ')}
        </div>
        <h3>${H.howAnswer}</h3>
        <ol class="steps">
          <li>${H.step1}</li>
          <li>${fill(H.step2, { keys: keysHtml })}</li>
          <li>${fill(H.step3, { n1: L.neutral[0], n2: L.neutral[1] })}</li>
        </ol>
        <label class="toggle"><input type="checkbox" id="practice-toggle" checked> ${H.practiceToggle}</label>
        <button class="btn btn--lg" id="btn-begin" type="button">${H.begin}</button>
        <p class="note" style="margin-top:14px">${H.worksBest}</p>
      </div>

      <div data-phase="test" hidden>
        <div class="arena" id="arena" tabindex="-1">
          <div class="arena__top"><span id="arena-label">${L.ui.arenaScored}</span><span id="progress-text" aria-live="off">1 / 40</span></div>
          <div class="progress"><span id="progress-fill"></span></div>
          <div class="stimulus" id="stimulus" aria-live="off"></div>
          <div class="feedback" id="feedback" aria-live="polite"></div>
          <div class="pad" id="response-pad"></div>
        </div>
      </div>

      <div class="app__panel" data-phase="paused" hidden>
        <h3>${H.paused}</h3>
        <p>${H.pausedP}</p>
        <button class="btn" id="btn-resume" type="button">${H.resume}</button>
      </div>

      <div class="app__panel" data-phase="practice-done" hidden>
        <h3>${H.practiceDone}</h3>
        <p id="practice-summary"></p>
        <p>${H.practiceDoneP}</p>
        <button class="btn btn--lg" id="btn-real" type="button">${H.startScored}</button>
      </div>

      <div class="app__panel results-anim" data-phase="results" id="results" tabindex="-1" hidden>
        <div class="results__head">
          <h3>${H.results}</h3>
          <span class="meta"><span id="r-mode"></span> · <span id="r-date"></span></span>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric__label">${H.mInterference}</div><div class="metric__value" id="r-interference">–</div><span class="badge" id="b-interference"></span><small>${H.mInterferenceS}</small></div>
          <div class="metric"><div class="metric__label">${H.mRatio}</div><div class="metric__value" id="r-ratio">–</div><small>${H.mRatioS}</small></div>
          <div class="metric"><div class="metric__label">${H.mAccuracy}</div><div class="metric__value" id="r-accuracy">–</div><span class="badge" id="b-accuracy"></span><small>${H.mAccuracyS}</small></div>
          <div class="metric"><div class="metric__label">${H.mRt}</div><div class="metric__value" id="r-rt">–</div><small>${H.mRtS}</small></div>
          <div class="metric"><div class="metric__label">${H.mIes}</div><div class="metric__value" id="r-ies">–</div><small>${H.mIesS}</small></div>
        </div>
        <div class="charts">
          <div class="chart"><h4>${H.chartTypes}</h4><div id="chart-types"></div></div>
          <div class="chart"><h4>${H.chartEvery}</h4><div id="chart-trials" dir="ltr"></div>
            <div class="legend"><span><i style="background:var(--c-congruent)"></i>${L.ui.typeMatching}</span><span><i style="background:var(--c-neutral)"></i>${L.ui.typeNeutral}</span><span><i style="background:var(--c-incongruent)"></i>${L.ui.typeClashing}</span><span>${H.hollow}</span></div>
          </div>
        </div>
        <div class="narrative" id="narrative"></div>
        <div id="history" hidden>
          <h4>${H.historyH}</h4>
          <div class="table-scroll"><table><thead><tr>${H.histCols.map((c) => `<th>${c}</th>`).join('')}</tr></thead><tbody id="history-rows"></tbody></table></div>
        </div>
        <p class="note">${H.resultsNote}</p>
        <div class="actions">
          <button class="btn" id="btn-again" type="button">${H.btnAgain}</button>
          <button class="btn btn--ghost" id="btn-share" type="button">${H.btnShare}</button>
          <button class="btn btn--ghost" id="btn-print" type="button">${H.btnPrint}</button>
          <button class="btn btn--ghost" id="btn-csv" type="button">${H.btnCsv}</button>
          <span class="note" id="share-status" aria-live="polite"></span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section--alt" id="about" aria-labelledby="about-heading">
  <div class="wrap grid grid--2" style="align-items:center">
    <div class="prose">
      <span class="kicker">${H.aboutKicker}</span>
      <h2 id="about-heading">${H.aboutH2}</h2>
      ${H.aboutP.map((p) => `<p>${p}</p>`).join('\n      ')}
    </div>
    <div>
      <div class="race card" data-race data-inview dir="ltr">
        <div class="race__head"><span class="kicker">${H.raceKicker}</span><button type="button" class="linkbtn" data-replay>${H.raceReplay}</button></div>
        <p class="note" dir="${L.dir}">${fill(H.raceNote, { w: word('BLUE', 'RED'), c: L.colorNames.RED })}</p>
        <div class="race__lane"><span class="race__label" dir="${L.dir}">${fill(H.raceRead, { w: L.colors.BLUE })}</span><div class="race__track"><i class="race__runner race__runner--read"></i><span class="race__flag">${H.raceFlag1}</span></div></div>
        <div class="race__lane"><span class="race__label" dir="${L.dir}">${H.raceInk}</span><div class="race__track"><i class="race__runner race__runner--ink"></i><span class="race__flag race__flag--ok">${fill(H.raceFlag2, { c: L.colorNames.RED })}</span></div></div>
        <div class="race__brake">${H.raceBrake}</div>
      </div>
    </div>
  </div>
  <div class="wrap stats" style="margin-top:40px">
    <div class="stat"><div class="stat__num"><span data-count="1935" data-from="1900">1935</span></div><p>${H.stats[0]}</p></div>
    <div class="stat"><div class="stat__num"><span data-count="700">700</span>+</div><p>${H.stats[1]}</p></div>
    <div class="stat"><div class="stat__num"><span data-count="74">74</span>%</div><p>${H.stats[2]}</p></div>
    <div class="stat"><div class="stat__num">~<span data-count="2">2</span> ${H.statMin}</div><p>${H.stats[3]}</p></div>
  </div>
</section>

<section class="section section--dark" aria-labelledby="types-heading">
  <div class="wrap">
    <div class="section__head">
      <span class="kicker">${H.typesKicker}</span>
      <h2 id="types-heading">${H.typesH2}</h2>
      <p>${H.typesP}</p>
    </div>
    <div class="grid grid--3">
      <div class="card card--lift"><div class="demo-word" data-cycle="congruent" style="color:${INKS.RED.hex}">${L.colors.RED}</div><h3>${H.cards[0][0]}</h3><p>${H.cards[0][1]}</p></div>
      <div class="card card--lift"><div class="demo-word" data-cycle="neutral" style="color:${INKS.BLUE.hex}">${L.neutral[0]}</div><h3>${H.cards[1][0]}</h3><p>${H.cards[1][1]}</p></div>
      <div class="card card--lift"><div class="demo-word" data-cycle="incongruent" style="color:${INKS.GREEN.hex}">${L.colors.YELLOW}</div><h3>${H.cards[2][0]}</h3><p>${H.cards[2][1]}</p></div>
    </div>
    <div class="card" style="margin-top:20px">
      <h3>${H.calcH3}</h3>
      <p class="formula">${H.formula}</p>
      <div class="gapbars" data-inview aria-label="${H.gapAria}">
        <div><span>${L.ui.typeMatching}</span><b style="--w:86%;--c:var(--c-congruent)"></b><em>560 ms</em></div>
        <div><span>${L.ui.typeClashing}</span><b style="--w:100%;--c:var(--c-incongruent)"></b><em>650 ms</em></div>
        <div class="gapbars__gap"><span>${H.gapInterference}</span><b style="--w:14%;--c:var(--violet);margin-inline-start:86%"></b><em>+90 ms</em></div>
      </div>
      <p>${H.calcP}</p>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="how-heading">
  <div class="wrap">
    <div class="section__head">
      <span class="kicker">${H.howKicker}</span>
      <h2 id="how-heading">${H.howH2}</h2>
      <p>${H.howP}</p>
    </div>
    <div class="table-scroll">
      <table>
        <thead><tr>${H.howHead.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${howRows}</tbody>
      </table>
    </div>
    <p class="note" style="margin-top:12px">${H.howNote}</p>
  </div>
</section>

<section class="section section--alt" id="scores" aria-labelledby="scores-heading">
  <div class="wrap">
    <div class="section__head">
      <span class="kicker">${H.scoresKicker}</span>
      <h2 id="scores-heading">${H.scoresH2}</h2>
    </div>
    <div class="grid grid--2">
      ${H.scoreCards.map(([h, f, p]) => `<div class="card"><h3>${h}</h3><p class="formula">${f}</p><p>${p}</p></div>`).join('\n      ')}
    </div>
    <h3 style="margin-top:36px">${H.guideH3}</h3>
    <div class="table-scroll">
      <table>
        <thead><tr>${H.guideHead.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${H.guideRows.map(([range, text], i) => `<tr><td>${range}</td><td>${L.ui[`band_${bands[i]}`]}</td><td>${text}</td></tr>`).join('')}</tbody>
      </table>
    </div>
    <p class="note" style="margin-top:12px">${H.guideNote}</p>
  </div>
</section>

<section class="section" id="research" aria-labelledby="research-heading">
  <div class="wrap grid grid--2">
    <div class="prose">
      <span class="kicker">${H.researchKicker}</span>
      <h2 id="research-heading">${H.researchH2}</h2>
      ${H.researchP.map((p) => `<p>${p}</p>`).join('\n      ')}
      <h3>${H.whoH3}</h3>
      <p>${H.whoP}</p>
      <h3>${H.changeH3}</h3>
      <p>${H.changeP}</p>
    </div>
    <div>
      ${picture('/wp-content/uploads/2026/06/Two-pathways-racing-in-your-brain.webp', H.picAlt, { sizes: '(max-width: 760px) 100vw, 540px' })}
      <h3>${H.refsH3}</h3>
      <ol class="refs" dir="ltr" lang="en">${REFERENCES}</ol>
    </div>
  </div>
</section>

<section class="section section--alt" id="faq" aria-labelledby="faq-heading">
  <div class="wrap">
    <div class="section__head"><span class="kicker">${H.faqKicker}</span><h2 id="faq-heading">${H.faqH2}</h2></div>
    <div class="faq prose" style="max-width:860px">${faqHtml}</div>
  </div>
</section>

<section class="section" aria-labelledby="blog-heading">
  <div class="wrap">
    <div class="section__head"><span class="kicker">${H.blogKicker}</span><h2 id="blog-heading">${H.blogH2}</h2></div>
    <div class="post-grid">${posts.map((p) => postCard(p, L)).join('')}</div>
    <p style="margin-top:28px"><a class="btn btn--ghost" href="/blog/">${H.blogAll}</a></p>
  </div>
</section>

<section class="section section--dark">
  <div class="wrap" style="text-align:center">
    <h2>${H.ctaH2}</h2>
    <p style="margin:0 auto 22px;max-width:56ch">${H.ctaP}</p>
    <a class="btn btn--lg btn--light" href="#test">${H.ctaBtn}</a>
  </div>
</section>`;

  const url = site.url + path;
  const schema = [
    {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${site.url}/#org`,
          name: site.name,
          url: `${site.url}/`,
          logo: { '@type': 'ImageObject', url: site.url + site.logo, width: 1408, height: 768 },
          email: site.contactEmail,
        },
        { '@type': 'WebSite', '@id': `${site.url}/#website`, name: site.name, url: `${site.url}/`, publisher: { '@id': `${site.url}/#org` }, inLanguage: alternates.map((a) => a.lang) },
        {
          '@type': 'WebApplication',
          name: L.seo.appName,
          url: `${url}#test`,
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any (web browser)',
          browserRequirements: 'Requires JavaScript',
          isAccessibleForFree: true,
          inLanguage: L.lang,
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          publisher: { '@id': `${site.url}/#org` },
          description: L.seo.appDescription,
        },
        {
          '@type': 'WebPage',
          '@id': `${url}#webpage`,
          url,
          name: L.seo.title,
          description: L.seo.description,
          inLanguage: L.lang,
          isPartOf: { '@id': `${site.url}/#website` },
          primaryImageOfPage: site.url + site.ogImage,
          dateModified: MODIFIED,
          keywords: L.seo.keywords.join(', '),
        },
        { '@type': 'FAQPage', inLanguage: L.lang, mainEntity: H.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) },
      ],
    },
  ];

  return {
    path,
    title: L.seo.title,
    fullTitle: true,
    description: L.seo.description,
    keywords: L.seo.keywords,
    imageAlt: L.seo.imageAlt,
    nav: 'test',
    modified: MODIFIED,
    body,
    schema,
    scripts: ['stroop-app', 'hero-demo', 'home-extras'].map((f) => `<script type="module" src="/assets/js/${f}.js?v=${version}"></script>`).join('\n'),
  };
}
