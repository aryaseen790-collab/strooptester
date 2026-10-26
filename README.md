# strooptester.com

Source for [strooptester.com](https://strooptester.com): a free online Stroop test and a small blog about attention and executive function.

This repository replaces the old WordPress site. It builds into plain static files, so it's fast and cheap to host, and there's nothing to patch or hack. Every URL from the WordPress site still works: posts, categories, `/blog/`, the sitemap and all the images under `/wp-content/uploads/`.

## Quick start

```bash
npm install
npm run build     # writes the site to dist/
npm run serve     # preview at http://localhost:4321
npm run ci        # unit tests + build + link/SEO checks (what GitHub runs)
```

You need Node 20 or newer.

## What's where

| Path | What it is |
| --- | --- |
| `src/content/posts/*.md` | Blog posts. The file name is the URL slug. |
| `src/content/pages/*.md` | About, Contact and Privacy pages. |
| `src/templates/home.mjs` | Homepage copy, FAQ and structured data. |
| `src/templates/layout.mjs` | Header, footer, meta tags and cookie banner shared by every page. |
| `src/assets/js/stroop-core.js` | The test engine: trial generation and scoring. No DOM, fully unit-tested. |
| `src/assets/js/stroop-app.js` | The test interface: timing, keys, results, charts, sharing, history. |
| `src/assets/js/site.js` | Mobile menu and consent-gated Google Analytics. |
| `src/data/site.json` | Site name, URL, analytics ID, contact email and category names. |
| `src/data/images.json` | Size information for every image (used for `srcset`, width and height). |
| `static/` | Copied into the site as-is: images, `CNAME`, `robots.txt`, `_headers`. |
| `scripts/` | Build, link checker and preview server. |
| `test/` | Unit tests for the scoring engine. |

## Writing a new post

Create `src/content/posts/your-slug.md`:

```markdown
---
title: Your Post Title
seoTitle: Optional, shorter title for search results
description: 70 to 170 characters for search results and social shares.
date: 2026-11-01
updated: 2026-11-01
category: scores-interpretation
image: /wp-content/uploads/2026/11/your-image.webp
imageAlt: Describe the image
excerpt: One or two sentences for the blog listing.
---

Your text in Markdown.

![Alt text](/wp-content/uploads/2026/11/another-image.webp "Optional caption")

{{cta: Optional custom text for a "take the test" box.}}

## Frequently asked questions

### A question?

The answer. Questions under this heading become an accordion and FAQ structured data automatically.
```

Categories are defined in `src/data/site.json`. For a new image, put it in `static/wp-content/uploads/...` and add its size to `src/data/images.json` (width, height and any smaller versions). `npm run ci` fails if a link, anchor or image is broken, if a page has a missing or duplicate title or description, or if a page doesn't have exactly one `<h1>`.

## Going live on strooptester.com

Pushing to `main` runs `.github/workflows/deploy.yml`, which tests, builds and publishes to GitHub Pages. Pull requests run the same checks without deploying.

The workflow asks Pages where the site is served from. Until the custom domain is connected, that's `https://aryaseen790-collab.github.io/strooptester/`, and every link is prefixed with `/strooptester` so the site works there. Once `strooptester.com` is set as the custom domain, the next deploy builds for the root again. To try a sub-folder build locally, run `BASE_PATH=/strooptester npm run build`.

1. **Merge this branch into `main`.**
2. **Turn on Pages:** repository *Settings → Pages → Build and deployment → Source: GitHub Actions*.
3. **Custom domain:** in the same screen, enter `strooptester.com` (the `static/CNAME` file sets this too). Also verify the domain under your GitHub account's *Settings → Pages → Verified domains*, so nobody else can claim it.
4. **DNS in Cloudflare** (where the domain is now). Replace the records that point at the WordPress host:
   - `A` records for `strooptester.com`: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - `AAAA` records for `strooptester.com`: `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`, `2606:50c0:8003::153`
   - `CNAME` for `www`: `aryaseen790-collab.github.io`

   Set the records to **DNS only** (grey cloud) at first, so GitHub can issue the HTTPS certificate. Once *Enforce HTTPS* is available in the Pages settings, tick it. You can then switch the records back to **Proxied** (orange cloud) with SSL/TLS mode **Full (strict)**.
5. **Security headers.** GitHub Pages can't send custom headers. With Cloudflare proxying, add them with *Rules → Transform Rules → Modify Response Header*, using the values in `static/_headers`. (If you'd rather host on Cloudflare Pages or Netlify, `_headers` is picked up automatically: build command `npm run build`, output directory `dist`.)
6. **Search Console.** The verification tag is already in the page head. Submit `https://strooptester.com/sitemap.xml`. The old `/sitemap_index.xml` is still served, so nothing breaks in the meantime.
7. **Email.** The site lists `contact@strooptester.com`. Make sure that mailbox exists, for example with Cloudflare Email Routing, or change `contactEmail` in `src/data/site.json`.
8. Keep a backup of the WordPress site, then shut it down.

## What changed from the WordPress version

**The test**
- Neutral trials used grey ink with no grey button, so every neutral trial was marked wrong and nobody could score above 85%. Neutral trials now use ordinary words (LAMP, DOOR) in a real ink colour.
- The levels now really differ. Hard adds two colours and a 1.5-second limit, and there's a colour-vision friendly level.
- Scoring uses medians of correct answers between 200 ms and 3 s, adds interference relative to your own baseline and inverse efficiency, and drops the made-up percentile tables and "age-matched norms" (the test never asked for an age).
- Timing starts on the frame that draws the word. The fixation pause is randomised, the test pauses if you switch tabs, and touch input uses `pointerdown` for lower latency.
- Share links now work, the CSV export is real, and the last 30 results are kept in your browser as a history. Charts are inline SVG, with no dependency on a CDN.

**Content and trust**
- Removed the "240,000+ users" and "4.9/5" claims, the self-awarded rating in the structured data, the unnamed "board-certified neuropsychologist" reviewer and the backdated "May 2025" dates.
- Fixed factual errors: Cohen, Dunbar and McClelland (1990) is a computer model, not an fMRI study; Jha et al. (2007) didn't use the Stroop task; the age norm table didn't come from the sources it cited.
- Rewrote all nine posts. This fixed broken links, left-over "[IMAGE 2…]" placeholders, call-to-action boxes pasted into the wrong posts, and images showing made-up data presented as real.
- Added About (with editorial standards), Contact and Privacy pages.

**Technical**
- One `<title>`, one set of social tags and one viewport tag per page (WordPress had duplicates from two plugins).
- Google Analytics only loads after consent, and there's a cookie banner and a privacy policy.
- No public WordPress user list, login page or plugins to attack.
- Responsive images with `srcset`, no web fonts, and under 50 KB of CSS and JS in total (before compression).

## Before you go live

- Add a real name, and credentials if you have them, to the About page. Named, accountable authors matter for health-related content.
- Check that the contact email works.
- Run `npm run ci` after any edit.
