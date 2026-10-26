// Homepage: hero, the test itself, and the explainer sections underneath.
const MODIFIED = '2026-10-26';

const FAQ = [
  [
    'What does the Stroop test measure?',
    `<p>Mostly one thing: how well you can stick to a rule ("name the ink") while a stronger habit ("read the word") pushes the other way. Psychologists call that inhibitory control or interference control. Your speed and accuracy also say something about general processing speed and how steady your attention was during the run.</p>`,
  ],
  [
    'How is the interference score worked out?',
    `<p>We take your median response time on clashing trials (RED in blue ink) and subtract your median on matching trials (RED in red ink). Only correct answers between 200 ms and 3 seconds go into those medians, so a lucky guess or a moment looking at your phone can't skew the result. We use the median rather than the average because one very slow answer barely moves it.</p>`,
  ],
  [
    'What is a good Stroop score?',
    `<p>High accuracy (90% or more) and a small gap between matching and clashing words. On a keyboard or touchscreen, a gap somewhere around 40 to 120 ms is common for adults. There is no official pass mark, though. The most useful comparison is with your own earlier results, taken under similar conditions. Our guide to <a href="/good-stroop-test-score/">what counts as a good Stroop score</a> goes into more detail.</p>`,
  ],
  [
    'How accurate is an online Stroop test?',
    `<p>The interference effect itself is very reliable, and browser timing (the <code>performance.now()</code> clock) is precise to well under a millisecond. The weak spots are your hardware and surroundings. Keyboards, touchscreens and displays add delays of their own, often 10 to 50 ms, and they differ between devices. Because the interference score is a difference between two kinds of trial on the same device, most of that delay cancels out. Raw response times are harder to compare between devices.</p>`,
  ],
  [
    'Can this test tell me if I have ADHD?',
    `<p>No. Groups of people with ADHD do tend to show a bit more interference on average, but the overlap with everyone else is large, and a 2005 meta-analysis found the Stroop task on its own doesn't separate the two groups well. ADHD is diagnosed by a clinician using your history, rating scales and agreed criteria. If attention problems are getting in the way of your life, that conversation is the right next step. We've written more about this in <a href="/stroop-test-and-adhd/">the Stroop test and ADHD</a>.</p>`,
  ],
  [
    'How long does it take?',
    `<p>The Standard test is 40 trials and usually takes under two minutes, plus about thirty seconds if you do the practice round. Easy is 20 trials. Hard is 60 trials with six colours and a 1.5-second limit on each answer, so it takes two or three minutes.</p>`,
  ],
  [
    'Why do I get slower with age?',
    `<p>Almost everyone's responses get a little slower from their thirties onwards, and the raw interference gap tends to grow with them. A well-known meta-analysis found that most of the age difference on the Stroop task is explained by this general slowing rather than a special loss of control. That is why we also show your interference as a percentage of your own baseline speed: it is a fairer number to compare across ages.</p>`,
  ],
  [
    'Is my data stored or sent anywhere?',
    `<p>Your answers and scores are worked out in your browser and never leave your device. If you allow it, we keep your last 30 results in your browser's own storage so you can see your history; clearing your browser data removes them. We only use Google Analytics, which counts page visits, if you click "Allow analytics". The <a href="/privacy-policy/">privacy policy</a> has the details.</p>`,
  ],
  [
    'Is it free?',
    `<p>Yes. There's no account, no email address to hand over and nothing to pay, and every part of the report is included.</p>`,
  ],
];

export function homePage({ site, posts, postCard, picture }) {
  const faqHtml = FAQ.map(([q, a]) => `<details><summary>${q}</summary><div>${a}</div></details>`).join('\n');
  const strip = (s) => s.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

  const body = `
<section class="hero">
  <div class="wrap">
    <div>
      <span class="eyebrow">Free · No sign-up · Instant results</span>
      <h1>Free Online Stroop Test <span>See how well you ignore a distraction</span></h1>
      <p>Name the colour of the ink, not the word. It sounds easy until RED shows up in blue. This test times every answer and tells you how much the clashing words slowed you down. That number, the <strong>Stroop interference score</strong>, has been used to study attention since 1935.</p>
      <div class="hero__ctas">
        <a class="btn btn--lg" href="#test">Start the test</a>
        <a class="btn btn--ghost btn--lg" href="#about">How it works</a>
      </div>
      <ul class="hero__facts">
        <li>About 2 minutes</li>
        <li>Keyboard or touchscreen</li>
        <li>Answers stay on your device</li>
      </ul>
    </div>
    <div class="hero__art">${picture('/wp-content/uploads/2026/05/Online-Stroop-Tester-Image.webp', 'An eye reflecting the colour words red, green, blue and yellow', { sizes: '(max-width: 900px) 100vw, 520px', eager: true })}</div>
  </div>
</section>

<section class="section" id="test" aria-labelledby="test-heading">
  <div class="wrap">
    <div class="section__head">
      <span class="kicker">The test</span>
      <h2 id="test-heading">Take the free Stroop test</h2>
      <p>Pick a level, do the short practice round if it's your first time, then answer as quickly as you can without guessing.</p>
    </div>

    <div class="app" id="stroop-app">
      <div class="callout shared" id="shared" hidden><p data-shared></p></div>

      <div class="app__panel" data-phase="setup">
        <h3>Choose a level</h3>
        <div class="modes" role="group" aria-label="Difficulty">
          <button class="mode" type="button" data-mode="easy" aria-pressed="false"><strong>Easy</strong><span>20 trials · 4 colours</span></button>
          <button class="mode" type="button" data-mode="standard" aria-pressed="true"><strong>Standard</strong><span>40 trials · 4 colours</span></button>
          <button class="mode" type="button" data-mode="hard" aria-pressed="false"><strong>Hard</strong><span>60 trials · 6 colours · 1.5 s limit</span></button>
          <button class="mode" type="button" data-mode="cvd" aria-pressed="false"><strong>Colour-vision friendly</strong><span>30 trials · blue, yellow, white</span></button>
        </div>
        <h3>How to answer</h3>
        <ol class="steps">
          <li>A word appears after a small <strong>+</strong>. Look at the colour of its letters.</li>
          <li>Press the matching key (<kbd>R</kbd> red, <kbd>B</kbd> blue, <kbd>G</kbd> green, <kbd>Y</kbd> yellow) or tap the button. Ignore what the word says.</li>
          <li>Some words aren't colours at all, like LAMP or DOOR. Just answer with their ink colour too.</li>
        </ol>
        <label class="toggle"><input type="checkbox" id="practice-toggle" checked> Start with a 6-trial practice round (recommended)</label>
        <button class="btn btn--lg" id="btn-begin" type="button">Begin</button>
        <p class="note" style="margin-top:14px">Works best on a laptop with a real keyboard, in a quiet room. If you switch tabs, the test pauses.</p>
      </div>

      <div data-phase="test" hidden>
        <div class="arena" id="arena" tabindex="-1">
          <div class="arena__top"><span id="arena-label">Scored test</span><span id="progress-text" aria-live="off">1 / 40</span></div>
          <div class="progress"><span id="progress-fill"></span></div>
          <div class="stimulus" id="stimulus" aria-live="off"></div>
          <div class="feedback" id="feedback" aria-live="polite"></div>
          <div class="pad" id="response-pad"></div>
        </div>
      </div>

      <div class="app__panel" data-phase="paused" hidden>
        <h3>Paused</h3>
        <p>The test stopped because the page lost focus. The trial you were on will be shown again.</p>
        <button class="btn" id="btn-resume" type="button">Carry on</button>
      </div>

      <div class="app__panel" data-phase="practice-done" hidden>
        <h3>Practice done</h3>
        <p id="practice-summary"></p>
        <p>The real test works the same way, but you won't see feedback after each answer.</p>
        <button class="btn btn--lg" id="btn-real" type="button">Start the scored test</button>
      </div>

      <div class="app__panel" data-phase="results" id="results" tabindex="-1" hidden>
        <div class="results__head">
          <h3>Your results</h3>
          <span class="meta"><span id="r-mode"></span> · <span id="r-date"></span></span>
        </div>
        <div class="metrics">
          <div class="metric"><div class="metric__label">Interference</div><div class="metric__value" id="r-interference">–</div><span class="badge" id="b-interference"></span><small>Clashing minus matching words</small></div>
          <div class="metric"><div class="metric__label">Relative interference</div><div class="metric__value" id="r-ratio">–</div><small>Interference as % of your matching-word speed</small></div>
          <div class="metric"><div class="metric__label">Accuracy</div><div class="metric__value" id="r-accuracy">–</div><span class="badge" id="b-accuracy"></span><small>All trials</small></div>
          <div class="metric"><div class="metric__label">Typical response</div><div class="metric__value" id="r-rt">–</div><small>Median of correct answers</small></div>
          <div class="metric"><div class="metric__label">Speed + accuracy</div><div class="metric__value" id="r-ies">–</div><small>Inverse efficiency. Lower is better</small></div>
        </div>
        <div class="charts">
          <div class="chart"><h4>Median response by trial type</h4><div id="chart-types"></div></div>
          <div class="chart"><h4>Every trial</h4><div id="chart-trials"></div>
            <div class="legend"><span><i style="background:var(--c-congruent)"></i>Matching</span><span><i style="background:var(--c-neutral)"></i>Neutral</span><span><i style="background:var(--c-incongruent)"></i>Clashing</span><span>Hollow dot = wrong answer</span></div>
          </div>
        </div>
        <div class="narrative" id="narrative"></div>
        <div id="history" hidden>
          <h4>Your recent results (saved in this browser only)</h4>
          <div class="table-scroll"><table><thead><tr><th>Date</th><th>Level</th><th>Accuracy</th><th>Typical response</th><th>Interference</th></tr></thead><tbody id="history-rows"></tbody></table></div>
        </div>
        <p class="note">These bands are a rough guide for keyboard and touchscreen versions of the task, not clinical norms. One result is a snapshot: sleep, stress, caffeine and your device all move it around. This test can't diagnose anything.</p>
        <div class="actions">
          <button class="btn" id="btn-again" type="button">Take it again</button>
          <button class="btn btn--ghost" id="btn-share" type="button">Share result</button>
          <button class="btn btn--ghost" id="btn-print" type="button">Print or save as PDF</button>
          <button class="btn btn--ghost" id="btn-csv" type="button">Download raw data (CSV)</button>
          <span class="note" id="share-status" aria-live="polite"></span>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="section section--alt" id="about" aria-labelledby="about-heading">
  <div class="wrap grid grid--2" style="align-items:center">
    <div class="prose">
      <span class="kicker">The science</span>
      <h2 id="about-heading">What is the Stroop test?</h2>
      <p>In 1935 an American psychologist called John Ridley Stroop published a paper with a dry title, <em>Studies of Interference in Serial Verbal Reactions</em>. In one of its experiments, people named the ink colours of 100 printed words. When the words were colour names in a different ink (GREEN printed in red, say), naming the inks took about 74% longer than naming plain coloured squares.</p>
      <p>The reason is that reading is so practised it happens whether you want it to or not. The word arrives in your head first and has to be pushed aside before you can say the colour. That pushing aside takes time, and the time is what this test measures.</p>
      <p>Since then the task has become one of the most studied in psychology. Colin MacLeod's 1991 review already counted more than 700 papers on it. It turns up in research on attention, ageing, brain injury, ADHD and much more, mostly because it is simple, quick and works on nearly anyone who can read. If you'd like the long version, start with <a href="/what-is-the-stroop-test/">what the Stroop test is</a> or the story of <a href="/john-ridley-stroop/">John Ridley Stroop himself</a>.</p>
    </div>
    <div>${picture('/wp-content/uploads/2026/06/Stroop-Incongruent-Trial-and-Reaction-Time.webp', 'The word BLUE in green ink next to a reaction time of 312 milliseconds', { sizes: '(max-width: 760px) 100vw, 540px' })}</div>
  </div>
</section>

<section class="section section--dark" aria-labelledby="types-heading">
  <div class="wrap">
    <div class="section__head">
      <span class="kicker">Inside the test</span>
      <h2 id="types-heading">Three kinds of trial</h2>
      <p>Every word you see belongs to one of three groups. Comparing your speed across them is what turns a colour game into a measurement.</p>
    </div>
    <div class="grid grid--3">
      <div class="card"><div class="demo-word" style="color:#EF4444">RED</div><h3>Matching (congruent)</h3><p>The word and the ink agree. Reading actually helps you here, so these are your fastest answers. About 30% of trials.</p></div>
      <div class="card"><div class="demo-word" style="color:#3B82F6">LAMP</div><h3>Neutral</h3><p>An ordinary word in a coloured ink. There's nothing to fight, so this shows your plain colour-naming speed. About 30% of trials.</p></div>
      <div class="card"><div class="demo-word" style="color:#22C55E">YELLOW</div><h3>Clashing (incongruent)</h3><p>The word names a different colour from its ink. You have to hold back the word to answer, which costs time and causes most mistakes. About 40% of trials.</p></div>
    </div>
    <div class="card" style="margin-top:20px">
      <h3>How your interference score is calculated</h3>
      <p class="formula">Interference = median clashing time − median matching time</p>
      <p>Only correct answers between 200 ms and 3 seconds count, so guesses and lapses don't distort it. We also show the same gap as a percentage of your matching-word time, which takes your general speed out of the picture.</p>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="how-heading">
  <div class="wrap">
    <div class="section__head">
      <span class="kicker">How it works</span>
      <h2 id="how-heading">Four levels, one idea</h2>
      <p>Each level uses the same trial mix. They differ in length, the number of colours and whether there's a time limit.</p>
    </div>
    <div class="table-scroll">
      <table>
        <thead><tr><th>Level</th><th>Trials</th><th>Colours and keys</th><th>Time limit</th><th>Good for</th></tr></thead>
        <tbody>
          <tr><td>Easy</td><td>20</td><td>Red (R), blue (B), green (G), yellow (Y)</td><td>None</td><td>A quick first try</td></tr>
          <tr><td>Standard</td><td>40</td><td>Red, blue, green, yellow</td><td>None</td><td>The most reliable score and the one to track over time</td></tr>
          <tr><td>Hard</td><td>60</td><td>Adds purple (P) and orange (O)</td><td>1.5 seconds per word</td><td>A real challenge once you know the keys</td></tr>
          <tr><td>Colour-vision friendly</td><td>30</td><td>Blue (B), yellow (Y), white (W) on grey</td><td>None</td><td>People with red-green colour blindness</td></tr>
        </tbody>
      </table>
    </div>
    <p class="note" style="margin-top:12px">Before each word you'll see a small cross for a random 0.4 to 0.7 seconds, so you can't fall into a rhythm and guess when the next one is coming. The clock starts on the screen frame that draws the word and stops on your key press or tap.</p>
  </div>
</section>

<section class="section section--alt" id="scores" aria-labelledby="scores-heading">
  <div class="wrap">
    <div class="section__head">
      <span class="kicker">Your report</span>
      <h2 id="scores-heading">What the numbers mean</h2>
    </div>
    <div class="grid grid--2">
      <div class="card"><h3>Interference</h3><p class="formula">clashing − matching (ms)</p><p>The headline number: how much the clashing words slowed you down. Smaller means you pushed the word aside more easily. On keyboard and touch versions of the task, most adults land somewhere between about 40 and 120 ms.</p></div>
      <div class="card"><h3>Relative interference</h3><p class="formula">interference ÷ matching time × 100</p><p>The same gap as a percentage of your own baseline. Someone who is quick overall and someone who is slower overall can be compared fairly this way, and it changes much less with age than the raw gap does.</p></div>
      <div class="card"><h3>Accuracy</h3><p class="formula">correct answers ÷ all trials</p><p>Usually 90% or higher when people are paying attention. Mistakes cluster on clashing words. If your accuracy is low, your speed numbers mean less, because fast guesses look quick but aren't real decisions.</p></div>
      <div class="card"><h3>Typical response and inverse efficiency</h3><p class="formula">median correct time ÷ proportion correct</p><p>Your typical response is the median time of your correct answers. Inverse efficiency, a measure from Townsend and Ashby (1983), combines it with accuracy so that rushing doesn't make you look better than you were.</p></div>
    </div>
    <h3 style="margin-top:36px">A rough guide to interference on this test</h3>
    <div class="table-scroll">
      <table>
        <thead><tr><th>Interference</th><th>Label</th><th>What it usually means</th></tr></thead>
        <tbody>
          <tr><td>Under 40 ms</td><td>Very small</td><td>The word barely got in your way. Practised players and very focused runs land here.</td></tr>
          <tr><td>40 – 120 ms</td><td>Typical</td><td>The usual range for adults on a keyboard or touchscreen.</td></tr>
          <tr><td>120 – 200 ms</td><td>Larger than typical</td><td>Common when tired, distracted, new to the keys, or with age.</td></tr>
          <tr><td>200 ms or more</td><td>Large</td><td>Worth retesting when rested. One high score on its own doesn't mean anything is wrong.</td></tr>
        </tbody>
      </table>
    </div>
    <p class="note" style="margin-top:12px">These bands come from the range of results typically reported for computer and phone versions of the task. They are not a validated normative sample, and they aren't adjusted for age, education or device. The fairest comparison is always with your own earlier results.</p>
  </div>
</section>

<section class="section" id="research" aria-labelledby="research-heading">
  <div class="wrap grid grid--2">
    <div class="prose">
      <span class="kicker">The research</span>
      <h2 id="research-heading">What happens in the brain</h2>
      <p>Brain imaging points to two regions near the front of the brain. In 1990 a PET study by José Pardo and colleagues found the <strong>anterior cingulate cortex</strong> became more active when people named the ink of clashing words. A decade later Angus MacDonald and colleagues used fMRI to separate the roles: the cingulate seems to flag that there's a conflict, while the <strong>dorsolateral prefrontal cortex</strong> keeps attention on the rule you've been given.</p>
      <p>The same year as the PET study, Jonathan Cohen, Kevin Dunbar and James McClelland published a computer model of the effect. It explained the slowdown as two pathways of different strength (practised reading and less practised colour naming) competing for the same response. That idea of competing pathways still shapes how the task is understood.</p>
      <h3>Who uses it</h3>
      <p>Versions of the task appear in neuropsychological test batteries, in research on ageing, brain injury, depression and ADHD, and in studies of sleep loss and stress. Clinicians use standardised paper versions with their own norms, such as the Golden Stroop, and they read the score next to many other tests and a full history. A browser test like this one is for curiosity and self-tracking, not diagnosis.</p>
      <h3>What can change your score</h3>
      <p>Sleep, stress, alcohol the night before, a noisy room and an unfamiliar keyboard all move the numbers. Age matters too, mostly through general slowing (Verhaeghen and De Meersman, 1998). Regular aerobic exercise is one of the better-supported ways to help executive function in healthy adults (Guiney and Machado, 2013). To see a real trend, test at the same time of day on the same device and look at several results, not one.</p>
    </div>
    <div>
      ${picture('/wp-content/uploads/2026/06/Brain-Activation-During-Stroop-Interference.webp', 'Illustration of a brain with glowing connections across the frontal lobes', { sizes: '(max-width: 760px) 100vw, 540px' })}
      <h3>References</h3>
      <ol class="refs">
        <li>Stroop, J. R. (1935). Studies of interference in serial verbal reactions. <em>Journal of Experimental Psychology, 18</em>(6), 643–662. <a href="https://doi.org/10.1037/h0054651" rel="noopener">doi:10.1037/h0054651</a></li>
        <li>MacLeod, C. M. (1991). Half a century of research on the Stroop effect: An integrative review. <em>Psychological Bulletin, 109</em>(2), 163–203. <a href="https://doi.org/10.1037/0033-2909.109.2.163" rel="noopener">doi:10.1037/0033-2909.109.2.163</a></li>
        <li>Pardo, J. V., Pardo, P. J., Janer, K. W., &amp; Raichle, M. E. (1990). The anterior cingulate cortex mediates processing selection in the Stroop attentional conflict paradigm. <em>PNAS, 87</em>(1), 256–259. <a href="https://doi.org/10.1073/pnas.87.1.256" rel="noopener">doi:10.1073/pnas.87.1.256</a></li>
        <li>Cohen, J. D., Dunbar, K., &amp; McClelland, J. L. (1990). On the control of automatic processes: A parallel distributed processing account of the Stroop effect. <em>Psychological Review, 97</em>(3), 332–361. <a href="https://doi.org/10.1037/0033-295X.97.3.332" rel="noopener">doi:10.1037/0033-295X.97.3.332</a></li>
        <li>MacDonald, A. W., Cohen, J. D., Stenger, V. A., &amp; Carter, C. S. (2000). Dissociating the role of the dorsolateral prefrontal and anterior cingulate cortex in cognitive control. <em>Science, 288</em>(5472), 1835–1838. <a href="https://doi.org/10.1126/science.288.5472.1835" rel="noopener">doi:10.1126/science.288.5472.1835</a></li>
        <li>Verhaeghen, P., &amp; De Meersman, L. (1998). Aging and the Stroop effect: A meta-analysis. <em>Psychology and Aging, 13</em>(1), 120–126. <a href="https://doi.org/10.1037/0882-7974.13.1.120" rel="noopener">doi:10.1037/0882-7974.13.1.120</a></li>
        <li>Townsend, J. T., &amp; Ashby, F. G. (1983). <em>Stochastic Modeling of Elementary Psychological Processes.</em> Cambridge University Press.</li>
        <li>Guiney, H., &amp; Machado, L. (2013). Benefits of regular aerobic exercise for executive functioning in healthy populations. <em>Psychonomic Bulletin &amp; Review, 20</em>(1), 73–86. <a href="https://doi.org/10.3758/s13423-012-0345-4" rel="noopener">doi:10.3758/s13423-012-0345-4</a></li>
        <li>Scarpina, F., &amp; Tagini, S. (2017). The Stroop Color and Word Test. <em>Frontiers in Psychology, 8</em>, 557. <a href="https://doi.org/10.3389/fpsyg.2017.00557" rel="noopener">doi:10.3389/fpsyg.2017.00557</a></li>
      </ol>
    </div>
  </div>
</section>

<section class="section section--alt" id="faq" aria-labelledby="faq-heading">
  <div class="wrap">
    <div class="section__head"><span class="kicker">FAQ</span><h2 id="faq-heading">Questions people ask</h2></div>
    <div class="faq prose" style="max-width:860px">${faqHtml}</div>
  </div>
</section>

<section class="section" aria-labelledby="blog-heading">
  <div class="wrap">
    <div class="section__head"><span class="kicker">From the blog</span><h2 id="blog-heading">Latest articles</h2></div>
    <div class="post-grid">${posts.map((p) => postCard(p)).join('')}</div>
    <p style="margin-top:28px"><a class="btn btn--ghost" href="/blog/">See all articles</a></p>
  </div>
</section>

<section class="section section--dark">
  <div class="wrap" style="text-align:center">
    <h2>Two minutes, one number, no sign-up</h2>
    <p style="margin:0 auto 22px;max-width:56ch">Find out how much a clashing word slows you down, then come back next week and see if it changes.</p>
    <a class="btn btn--lg btn--light" href="#test">Take the Stroop test</a>
  </div>
</section>`;

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
        { '@type': 'WebSite', '@id': `${site.url}/#website`, name: site.name, url: `${site.url}/`, publisher: { '@id': `${site.url}/#org` }, inLanguage: 'en' },
        {
          '@type': 'WebApplication',
          name: 'Free Online Stroop Test',
          url: `${site.url}/#test`,
          applicationCategory: 'HealthApplication',
          operatingSystem: 'Any (web browser)',
          browserRequirements: 'Requires JavaScript',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          publisher: { '@id': `${site.url}/#org` },
          description: 'A timed colour-word Stroop task that reports accuracy, median response time and interference.',
        },
        {
          '@type': 'WebPage',
          '@id': `${site.url}/#webpage`,
          url: `${site.url}/`,
          name: 'Free Online Stroop Test',
          isPartOf: { '@id': `${site.url}/#website` },
          primaryImageOfPage: site.url + site.ogImage,
          dateModified: MODIFIED,
        },
        { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: strip(a) } })) },
      ],
    },
  ];

  return {
    path: '/',
    title: 'Free Online Stroop Test: Measure Your Attention in 2 Minutes',
    description:
      'Take a free online Stroop test in about two minutes. Get your interference score, accuracy and response times instantly. No sign-up, and your answers stay on your device.',
    imageAlt: 'An eye reflecting the colour words red, green, blue and yellow',
    nav: 'test',
    modified: MODIFIED,
    body,
    schema,
    scripts: '<script type="module" src="/assets/js/stroop-app.js"></script>',
  };
}
