# Blog writing and publishing guide

Two jobs use this guide:

1. **The scheduled draft run** (every 3 days). It drafts the next planned post and writes the image prompts, then stops and waits for images.
2. **The publish step.** It runs once the owner has supplied the images. It publishes the post in English and in every other site language.

The plan data is in `plan/blog-plan.json`, which comes from the owner's "New StroopTester Blog Plan" spreadsheet. Progress is tracked in `plan/STATUS.md`. Never skip ahead: always take the lowest week whose status is `planned`.

## 1. Draft run (every 3 days)

1. **Check the branch.** Work on `claude/brave-archimedes-h40qo9`. If that branch's pull request is already merged, restart the branch from `origin/main`, keeping any unmerged commits.
2. **Stop if a draft is already waiting.** If any post in `plan/STATUS.md` is `drafted`, do not draft another one. Remind the owner which post is waiting for images, and stop.
3. **Pick the post.** Take the lowest week with status `planned`, and read its entry in `plan/blog-plan.json`. Use these fields:
   - title
   - primary keyword
   - secondary keywords
   - word target
   - outline
   - FAQ list
   - internal links
4. **Write the draft** to `plan/drafts/<site-slug>/post.md`. The site slug is the plan slug without its leading slash, for example `selective-attention`. Follow section 3 for the format and section 4 for the voice.
5. **Write the image prompts** to `plan/drafts/<site-slug>/images.md` (section 5).
6. **Write the meta options** to `plan/drafts/<site-slug>/meta.md`:
   - three meta titles of 60 characters or fewer
   - three meta descriptions of 155 characters or fewer
   - mark the one you picked
7. **Update the status.** Set the post to `drafted` in `plan/STATUS.md`.
8. **Commit and push.** Run `npm run ci` first. The drafts live outside `src/`, so they are not built, but the run must stay green.
9. **Message the owner.** Give the post title, the three image prompts, and the file names and sizes you expect. Ask them to send the images.

## 2. Publish step (after the owner sends images)

1. **Convert the images to WebP.** Use `convert in.png -resize 1536x1024^ -gravity center -extent 1536x1024 -quality 82 out.webp`. Use an aspect ratio that fits the image: the featured image is 3:2 at 1536×1024, and inline images can be 3:2 or 4:3.
   - Save them in `static/wp-content/uploads/<YYYY>/<MM>/` for the publish month.
   - Use descriptive file names, for example `Selective-attention-spotlight.webp`.
2. **Create the English post.** Move the draft to `src/content/posts/<slug>.md`, with `date:` and `updated:` set to the publish date.
   - Set `category:` to the cluster's category (section 6).
   - Point `image:` at the featured image.
3. **Link to the post.** Find one or two published English posts where a link to the new post is natural, and add it. The plan's "IN links" are a guide.
4. **Translate it into all 20 languages:** es, pt, fr, de, it, nl, pl, cs, hu, hr, sv, tr, ru, ar, fa, hi, id, ja, ko, zh. The files go in `src/content/i18n/<code>/posts/<slug>.md`. Follow section 7.
5. **Run the checks.** `npm run ci` must pass. That includes check-i18n, which compares each translation with the English file, and the link checker.
6. **Update the status and open a PR.** Set the post to `published` and fill in its site URL in `plan/STATUS.md`. Delete `plan/drafts/<slug>/`, commit, push, and open a pull request. Merge only when the owner says so.

## 3. Post format (must match the existing posts)

```
---
title: <H1, contains the primary keyword>
seoTitle: <meta title, 60 characters or fewer>
description: <meta description, 155 characters or fewer; the site check fails above about 170>
date: YYYY-MM-DD
updated: YYYY-MM-DD
category: <category slug>
image: /wp-content/uploads/YYYY/MM/<featured>.webp
imageAlt: <7 or 8 words>
excerpt: <one or two sentences for the blog cards>
keywords: <primary keyword>, <secondary>, <secondary>, ...
summary: <point one>|<point two>|<point three>
---
```

**Body:**
- **Opening.** Put the primary keyword in the first 100 words. The intro has 2 or 3 short paragraphs, and one of them links to the free test with `[free Stroop test](/#test)` or similar wording.
- **Headings.** Use `##` for H2 and `###` for H3. Never use `#`, because the title is already the H1. One H2 contains the primary keyword.
- **Images.** Use `![alt text](/wp-content/uploads/YYYY/MM/File.webp "Caption")`. The two inline images go in the body. The featured image comes only from front matter, so do not repeat it in the body.
- **Call to action.** Exactly one call-to-action line, near the end and before the FAQ: `{{cta: One short sentence inviting the reader to take the test.}}`
- **FAQ.** The last H2 is exactly `## Frequently asked questions`, followed by at least 8 `###` questions, each with a 1 to 3 sentence answer. The site turns this into an accordion with FAQ schema.
- **Internal links.** Use 3 to 6, and link **only to pages that already exist**. Use the site URLs from `plan/STATUS.md`, never the plan slugs of unpublished posts, because the link checker fails on missing pages. Always include `/#test` and the cluster's pillar if it is published. Vary the anchor wording.
- **External links.** Use at least 3, to authoritative sources: journals via doi.org or PubMed, NIH, NIMH, CDC, NHS, the APA, or university sites. Check that each one loads before you use it. Cite real studies only: real authors, real years, findings stated accurately.
- **Length.** Meet the plan's word target, with at least 800 words.
- **Clinical topics.** Include a short, plain "this is not a diagnosis" note.

## 4. Voice: how the post should read

The owner wants text that reads as written by a person, not generated. The persona is an expert analyst who is a fairly ordinary writer: someone who knows the research well but writes plainly, without polish or flourishes. Their English is good (around C1) but not literary.

- **No dashes** of any kind as punctuation: no em dash, en dash, or spaced hyphen. Use commas, full stops, brackets or colons. Hyphens inside words such as "self-report" are fine.
- **Vary sentence length a lot.** Some sentences are 4 words, and some run to 30. Paragraphs are uneven too.
- **Write plainly.** Prefer "use", "show" and "help". Avoid the words generated text overuses:
  - delve, crucial, pivotal, landscape, realm, tapestry, intricate, foster, leverage, robust, seamless
  - navigate (in a metaphorical sense), unlock, embark, testament, multifaceted, nuanced
  - "in today's fast-paced world", "it's important to note", "in conclusion", "whether you're…"
- **Break the patterns.** No groups of three adjectives, no "not only… but also", no rhetorical question to open every section, and no closing paragraph that sums up everything.
- **Sound like an analyst.** Say exactly what a study found, with numbers. Admit the limits of a study. Give an opinion now and then ("I'd treat that number with care"). Use the odd aside in brackets.
- **Use contractions** where a person would ("it's", "don't", "you'll"). Address the reader as "you".
- **Keep it concrete.** Use everyday examples (traffic lights, a phone buzzing during a meeting, reading a menu in a noisy café) rather than abstract claims.
- **Don't over-format.** Use bullet lists only where the content really is a list, at most two per post. Mostly write paragraphs.
- **Read it aloud once before you finish.** Rewrite any line that sounds like a brochure.

No tool can promise a particular score on an AI detector. The aim is genuinely natural, specific writing, and that is also what readers and Google reward.

## 5. Image prompts (`images.md`)

Write at least 3 images:
- **Image 1:** the featured image (front matter, 1536×1024, 3:2).
- **Image 2:** an inline image near the first third of the post.
- **Image 3:** an inline image in the second half.

Each image entry includes:
- **Placement:** for example "featured" or "after the H2 *How the brain filters input*".
- **File name** and **size or aspect ratio**.
- **Prompt:** 120 to 200 words, written for an image model such as Midjourney, DALL·E, Ideogram or Firefly. Cover:
  - **Subject and scene:** who or what, doing what, where.
  - **Composition:** camera angle, framing, where empty space sits for the layout, and the focal point.
  - **Style:** editorial photo, flat vector illustration, or clean 3D. Keep it consistent with the site's existing images, which are clean, modern and evidence-led, with soft light and no clutter.
  - **Colour palette:** the site uses teal and indigo accents on light, neutral backgrounds. The Stroop ink colours (red, blue, green, yellow) can appear as accents.
  - **Lighting and mood.**
  - **Text in the image:** say "no text" unless it is a diagram. For a diagram, give the exact labels (keep them short and in English).
  - **A negative line:** no logos, no watermarks, no distorted hands, no medical imagery that looks alarming.
- **ALT text:** 7 or 8 words, containing the keyword where it is natural.
- **Title:** short.
- **Caption:** one sentence, used as the Markdown image title.
- **Description:** one or two sentences.

## 6. Category for each cluster

| Cluster | Category slug |
|---|---|
| A Stroop Test Fundamentals | `stroop-test-basics` |
| B The Stroop Effect (Science) | `the-stroop-effect` |
| C Scores & Interpretation | `scores-interpretation` |
| D ADHD & Clinical Uses | `adhd-and-clinical-uses` |
| E Core Cognitive Abilities | `core-cognitive-abilities` |
| F Brain Health & Improvement | `brain-health` (new) |
| G Aging & Cognitive Decline | `aging-cognition` (new) |
| H Stroop Variants & Related Tasks | `stroop-variants` (new) |
| I Applications & Audiences | `stroop-test-uses` (new) |

A new category has to be added to `src/data/site.json` (name and description) and to `blog.categories` in all 21 files in `src/i18n/` before its first post is published.

## 7. Translations

**Front matter:**
- Translate the text fields only: title, seoTitle, description, imageAlt, excerpt, keywords, summary.
- Leave out date, updated, category and image. They come from the English file.
- Keep the same number of summary points.

**Body:**
- Keep the same images in the same order, with translated alt text and captions.
- Keep the same internal links (the English paths; the build rewrites them per language) and the same number of `##` headings.
- Keep exactly one `{{cta: …}}` line.

**Writing:**
- Write the way a native speaker of that language would, not a word-for-word translation, and keep the same plain, analyst voice.
- Use the target language's own keyword phrasing, for example "test de Stroop", "Stroop-Test", ストループテスト or "тест Струпа".

**FAQ heading.** It must be exactly the locale's `blog.faqHeading` (see `src/i18n/<code>.mjs`), for example:
- es: Preguntas frecuentes
- de: Häufige Fragen
- ja: よくある質問

**Length limits:**
- The meta description must stay within about 150 characters.
- For CJK languages (ja, ko, zh), 35 to 80 characters, because the check counts each CJK character twice.
- Titles must be unique across the whole site.

**Answer keys.** Non-English answer keys are digits: 1 red, 2 blue, 3 green, 4 yellow. If a post mentions keys, say R/B/G/Y in English and 1–4 in the other languages.

## 8. Published posts and their site URLs

The plan's slugs differ from some of the live URLs. Always link to the live URL:

| Plan slug | Site URL |
|---|---|
| /stroop-test | /what-is-the-stroop-test/ |
| /stroop-effect | /stroop-effect-explained/ |
| /good-stroop-test-score | /good-stroop-test-score/ |
| /stroop-test-adhd | /stroop-test-and-adhd/ |
| /executive-function | /what-is-executive-function/ |
| /stroop-test-instructions | /how-to-take-the-stroop-test-instructions/ |
| /john-ridley-stroop | /john-ridley-stroop/ |
| /stroop-interference-score | /stroop-interference-score/ |
| /adhd-attention-test-online | /online-adhd-attention-test/ |

New posts use the plan slug with a trailing slash, for example `/selective-attention/`. Add each one to the Site URL column in `plan/STATUS.md` when it is published.
