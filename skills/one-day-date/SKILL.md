---
name: one-day-date
description: Build a cute 3D-cartoon date-day website from a trip plan and (optionally) photos of the two people. The couple walks hand in hand from stop to stop, and the partner picks a date, makes choices, and approves the plan; their answers are sent back. Use this whenever someone wants a website, page or interactive invitation for a date, trip, anniversary, birthday surprise or "our day together" plan for a girlfriend, boyfriend or partner, including requests like "make a site for my girlfriend about our Kyoto day", "约会网站", "给女朋友做个行程网页", or "turn our itinerary into something cute", even if they never say "website". Works for complete beginners; the agent does the technical work and can also draft the itinerary.
---

# One-Day Date Website

You'll turn two inputs into a finished, deployed website:
- **a trip plan**: the user's, or one you draft with them;
- **photos of the two people**: optional.

## What the finished site does

- **Cover.** "Ready?" with a **yes** button and a **no** button that runs away and can never be tapped.
- **Calendar.** Only the allowed dates can be picked.
- **Walking between stops.** The two characters walk hand in hand from stop to stop over hand-drawn parallax backgrounds (home, street, riverside, park, café, museum, beach, amusement park, restaurant, bistro, bar…). The clock and the progress bar advance as they go.
- **Stop cards.** Each stop has a card with a short note and tickable mini-tasks. Tapping the couple makes them change pose and say something.
- **Optional questions** along the way: a **choice** (e.g. taxi / metro / bike) and a **"what don't you eat?"** picker.
- **Ending card.** "Where next time?" plus **Approve** or **Suggestions**. Everything they picked is submitted **once**, retried if they're offline.
- **Works everywhere.** Phones first, the WeChat browser, mainland China (no external requests), with background music.

The site is static HTML/CSS/JS with no build step. The template is in `template/`. You'll mostly edit one file: `js/config.js`.

## Working with the user

Assume the user is not technical, unless they show otherwise.
- **Speak their language.** Reply in the language they write in. The *website's* language is whatever their partner reads; ask if unclear.
- **Do the technical work yourself.** Ask only for what only they know: the plan, names, photos, preferences, and account logins when deploying.
- **Batch your questions.** One friendly message with numbered questions and a default for each. Start building as soon as you have the must-haves.
- **Show, don't describe.** Share screenshots of the site as it takes shape (`scripts/preview.mjs`).
- **Privacy.**
  - Photos stay on their machine. They go only to the image generator the user chooses.
  - The site is public to anyone with the link. Keep addresses, phone numbers and full names out unless they insist.
  - Nothing personal goes into this skill's folder.
- **Keep the surprise.** The partner is the audience. Write everything *to* them, never about "the user".

## Workflow

`<skill>` below means the folder containing this SKILL.md. The scripts need Node.js 18+ (`node -v`). If Node is missing, you can still copy `template/` by hand, edit it, and preview it with `python3 -m http.server`. Suggest installing Node for validation and preview.

### 1. Gather inputs

See `references/interview.md` for the exact message and defaults.
- **Must-haves:** the site language, and a trip plan or at least a city.
- **Nice to have:** names or nicknames, photos, candidate dates, choices, a dietary question, a pet, the final question.

### 2. Settle the trip guide

- **If they have a plan,** convert it into 4–6 stops. Sanity-check it: opening days and hours, reservations, whether the dates they gave fall on the weekday they said. Mention anything doubtful in your hand-off rather than silently changing the plan.
- **If not,** draft one: research real places if you can browse, use realistic timings, and present it as a short table.
- **Get an OK** on the stop list before building. It's cheap to change now and tedious later.

### 3. Create the site

```bash
node <skill>/scripts/new-site.mjs <target-folder>       # e.g. ./our-day-in-kyoto
```

Put it wherever the user wants. The default is a new folder in the current directory named after the trip.

### 4. Map every stop to a background

Look at `references/scenes-overview.jpg`, one picture of all 12 scenes (and `scenes-moods.jpg` for day/sunset/night), then read `references/scenes.md`, which says exactly what each scene shows. Some scenes are Shanghai-flavoured by default. For each stop, set:
- `bg`: the closest built-in scene;
- `mood`: day, sunset or night, to match the time;
- `labels`: the signs painted in the scene, e.g. the bridge name or the café name, or `''` to hide them.

City scenes draw a skyline:
- `skyline: 'generic'` (towers) for big cities;
- `'none'` for small or historic towns (Kyoto, Florence, a seaside village);
- `'shanghai'` only for Shanghai.

Signs painted in the scenes mostly sit outside a phone's view (scenes.md says which show), so relabel them so nothing is *wrong*, but don't spend long on them.

To see the scenes in every mood, serve the skill's template (`node <skill>/scripts/serve.mjs <skill>/template`) and open `/tools/scenes.html?moods=1`.

For a landmark no scene matches, see `references/backgrounds.md` (a generated plate). Otherwise pick the nearest scene and let the card text do the naming.

### 5. Write `js/config.js`

See `references/config.md` for every field. The template is a complete Chinese Shanghai example: **replace everything**, including `ending.placeholders`, `lines`, `datePick` and `labels`.

- **`lang`** matches the partner's language. Chinese, English and Japanese wording is built in. For any other language, set all `ui` strings; validate lists the missing ones.
- **Text.** Warm, personal, and short enough for a phone:
  - the cover `title` ≤ 8 Chinese/Japanese or ≤ 14 Latin characters to stay on one line (the cover font is big);
  - each stop's `title` ≤ 12 Chinese / 20 Latin characters;
  - card `text` ≤ 60 Chinese / 105 Latin characters;
  - 2–5 short `tasks`;
  - 3 `lines` per stop.

  Use details the user gave you. Don't invent shared memories.
- **`datePick`** holds the dates the partner may choose from.
  - One fixed date, or no date: delete the block and put the date on the cover.
  - A backup day decided by the weather: see interview.md.
- **Every `choice.key`** needs a matching `<input name="…">` in the hidden `trip-reply` form in `index.html`.
- **Update `<html lang>`, `<title>` and `<meta name="description">`** in `index.html`. Everything else in `index.html` is filled in from the config.

### 6. Characters

See `references/characters.md`.
1. **Built-in couple, always first.** Colour it from the photos, or from what the user tells you (`characters.builtin`). The site is complete at this point.
2. **Offer the AI version.** Two sprite sheets generated from their photos make the characters look like *them*.
   - If you can generate images with reference photos, do it.
   - Otherwise, give the user the filled-in prompt and a two-line how-to for ChatGPT, Gemini or 豆包, and wait for the images.
3. Save the sheets to `assets/characters/`, set `walk.src` / `poses.src`, and check them. Use preview, or `<skill>/template/tools/sprite-check.html` through `serve.mjs`: drag the sheet in.

### 7. Validate and look at it

```bash
node <skill>/scripts/validate.mjs <site>          # fix every ✗; read the ⚠ and the default-sign list
node <skill>/scripts/preview.mjs <site> --desktop # screenshots + full click-through + what gets submitted (--out <dir> to choose where)
```

`validate` lists every sign still painted with default text (menus, neon, banners). Make sure each one fits the place, or set `labels`. `preview` writes to `<site>-preview/`, a sibling folder, so it never gets deployed:
- the cover and every stop;
- `flow-*.png`, from clicking through the calendar, choices, walking captions, diet question and ending;
- the exact fields that would be submitted.

Add `--small` for a small phone or WeChat-sized screen (375×603). This matters when the partner will open the site in WeChat.

Open the PNGs and check each stop:
- the background fits the place;
- the card doesn't hide the couple;
- nothing overflows;
- no example text is left over;
- no title or line ends with one lonely word.

Fix and repeat. For the user to click around themselves: `node <skill>/scripts/serve.mjs <site>`, then open the URL. If Playwright is missing, `preview.mjs` says so. Use `serve.mjs` and ask the user to look, or install Playwright if they agree.

### 8. Deploy

Read `references/deploy.md`.
- **Default:** Netlify Drop. Drag the folder in, then enable form detection so the answers arrive.
- **If the partner is in mainland China,** read that section: host choice and the WeChat "open in browser" tip.
- **You can't click in their browser.** Give numbered click-by-click steps, or deploy with the Netlify CLI after they log in.
- Publishing makes the site public: confirm before you deploy anything yourself.

### 9. Test and hand off

Usually the *user* deploys (Netlify Drop), so your hand-off comes before the live test. Use the hand-off template in deploy.md. It covers:
- a short summary of the stops, with 2–3 screenshots;
- numbered deploy steps;
- turning on answers;
- a test checklist for the live site (submit a test answer, confirm it arrives, delete it);
- tips for sending the link (WeChat);
- how to change things later: ask you, then redeploy the same way.

Also include:
- **Anything you couldn't verify:** opening hours, event dates not yet announced, reservations.
- **Where the built-in cartoon doesn't match them,** e.g. short hair drawn as long, and the AI-character prompt for when they send photos.
- **Answer language.** Answers arrive in the partner's language; add a short gloss if the user doesn't read it.

If you deployed yourself, run the test checklist yourself first.

## Quality checklist

Before calling it done, check:
- [ ] Every stop's background and mood fit the place and time. The skyline setting fits the city.
- [ ] No leftover template text: search config for 上海 / 滨江 / 豫园 unless it really is Shanghai.
- [ ] The whole site is in the partner's language, including `labels`, `ui`, diet options and the calendar.
- [ ] Validate passes and the preview shows no JavaScript errors.
- [ ] At phone size, the card doesn't cover the couple, and the title and tasks fit.
- [ ] The answer path works end-to-end on the live site.

## Beyond the config

- **New background scene:** `template/js/scenes/README.md` (the SVG scene contract), then preview it in `tools/scenes.html`.
- **Different music:** replace `assets/audio/bgm.mp3`. The site is public, so use music they have rights to. The bundled track is original and generated by `tools/make-music.py`.
- **Problems:** `references/troubleshooting.md`.

## Files

```
<skill>/
├── SKILL.md
├── scripts/
│   ├── new-site.mjs      copy the template to a new folder
│   ├── validate.mjs      check config, assets, form fields, scenes
│   ├── preview.mjs       phone/desktop screenshots + JS errors (needs Playwright)
│   └── serve.mjs         zero-dependency local server
├── references/
│   ├── interview.md      questions to ask, drafting the trip guide, writing style
│   ├── scenes.md         every background: what it shows, moods, label keys, props
│   ├── config.md         every config field
│   ├── characters.md     built-in colours, AI sprite prompts, checking sheets
│   ├── backgrounds.md    optional generated background plates
│   ├── deploy.md         Netlify Drop / GitHub / CLI / others, answers, China
│   └── troubleshooting.md
└── template/             the website (index.html, css/, js/, assets/, tools/)
```
