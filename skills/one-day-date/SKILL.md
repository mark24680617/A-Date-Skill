---
name: one-day-date
description: Build a cute 3D-cartoon date-day website from a trip plan and photos of the two people. An image model turns their photos (or a description) into Pixar-style characters who walk hand in hand from stop to stop; the partner picks a date, makes choices and approves the plan, and their answers are sent back. Use this whenever someone wants a website, page or interactive invitation for a date, trip, anniversary, birthday surprise or "our day together" plan for a girlfriend, boyfriend or partner, including requests like "make a site for my girlfriend about our Kyoto day", "turn our photos into cartoon characters for our date", "约会网站", "给女朋友做个行程网页", "把我们俩的照片做成卡通小人", or "turn our itinerary into something cute", even if they never say "website". Works for complete beginners; the agent does the technical work, can draft the itinerary, and generates the characters itself or hands the user a ready prompt for ChatGPT, Gemini or 豆包.
---

# One-Day Date Website

You'll turn two inputs into a finished, deployed website:
- **a trip plan**: the user's, or one you draft with them;
- **photos of the two people**: strongly encouraged. An image model turns them into 3D-cartoon versions of the couple. Without photos, it can work from a description.

## What the finished site does

- **Cover.** "Ready?" with a **yes** button and a **no** button that runs away and can never be tapped.
- **Calendar.** Only the allowed dates can be picked.
- **Walking between stops.** The two of them, drawn by an image model, walk hand in hand from stop to stop over hand-drawn parallax backgrounds (home, street, riverside, park, café, museum, beach, amusement park, restaurant, bistro, bar…). The clock and the progress bar advance as they go.
- **Stop cards.** Each stop has a card with a short note and tickable mini-tasks. Tapping the couple makes them change pose and say something.
- **Optional questions** along the way: a **choice** (e.g. taxi / metro / bike) and a **"what don't you eat?"** picker.
- **Ending card.** "Where next time?" plus **Approve** or **Suggestions**. Everything they picked is submitted **once**, retried if they're offline.
- **Works everywhere.** Phones first, the WeChat browser, mainland China (no external requests), with background music.

The site is static HTML/CSS/JS with no build step. The template is in `template/`. You'll mostly edit one file: `js/config.js`.

## Working with the user

Assume the user is not technical, unless they show otherwise.
- **Speak their language.** Reply in the language they write in. The *website's* language is whatever their partner reads; ask if unclear.
- **Do the technical work yourself.** Ask only for what only they know: the plan, names, photos, preferences, how they can generate images, and account logins when deploying.
- **Batch your questions.** One friendly message with numbered questions and a default for each. Start building as soon as you have the must-haves.
- **Show, don't describe.** Share screenshots of the site as it takes shape (`scripts/preview.mjs`).
- **Privacy.**
  - Photos stay on their machine. They go only to an image service the user agreed to. Before you send real photos anywhere (your own image tool, an API), name the service and let the user say no. If you can't ask, use the description version of the prompt, or prepare the level-2 prompts for them (step 6).
  - API keys stay out of the chat when possible. They never go into the site folder (it gets published), into files you write, or into your output.
  - The site is public to anyone with the link. Keep addresses, phone numbers and full names out unless they insist.
  - Nothing personal goes into this skill's folder.
- **Keep the surprise.** The partner is the audience. Write everything *to* them, never about "the user".

## Workflow

`<skill>` below means the folder containing this SKILL.md. The scripts need Node.js 18+ (`node -v`). If Node is missing, you can still copy `template/` by hand, edit it, and preview it with `python3 -m http.server`. Suggest installing Node for validation and preview.

### 1. Gather inputs

See `references/interview.md` for the exact message and defaults.
- **Must-haves:** the site language, and a trip plan or at least a city.
- **Strongly encouraged:** one photo of each of them, and what they'll wear on the date. Without photos, a short description of each person (hair, skin tone, glasses, build).
- **How the images get made** (the ladder is in step 6).
  - If the user already chose a route (they set an API key, or prefer their own app), use it.
  - If your own image tool accepts reference images, or there are no photos anyway, you may not need to ask. Still name the service before sending any photos.
  - Otherwise ask whether they have an OpenAI or Google Gemini API key, or a ChatGPT, Gemini or 豆包 / 即梦 account. One is enough, and free app accounts work.
- **Nice to have:** names or nicknames, candidate dates, choices, a dietary question, a pet, the final question.

### 2. Settle the trip guide

- **If they have a plan,** convert it into 4–6 stops. Sanity-check it: opening days and hours, reservations, whether the dates they gave fall on the weekday they said. Mention anything doubtful in your hand-off rather than silently changing the plan.
- **If not,** draft one: research real places if you can browse, use realistic timings, and present it as a short table.
- **Get an OK** on the stop list before building. It's cheap to change now and tedious later.

### 3. Create the site

```bash
node <skill>/scripts/new-site.mjs <target-folder>       # e.g. ./our-day-in-kyoto
```

Put it wherever the user wants. The default is a new folder in the current directory named after the trip.

Once the folder exists and you have photos (or descriptions), start the characters (step 6) right away. Images take a few minutes, and on the app route the user makes them, so let that run while you do steps 4 and 5.

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

**Go for an image model first.** The couple is on every screen. When they look like the two real people, with their hair, glasses and date outfits, the site feels like *them*; that's what makes it personal. The built-in cartoon pair is generic and fixed in shape (short hair and a shirt on the left, long hair and a dress on the right), so treat it as the fallback and the placeholder, not the plan.

You need two sprite sheets from an image model: `walk` (a 6-frame walk cycle holding hands) and `poses` (six still poses). To see what good ones look like, open `references/example/from-sheet-to-site.jpg` and the two sheets next to it. They're from the real site this skill was made from, generated with gpt-image-2 from two photos. `references/example/` is everything you need locally; the complete example site is at https://github.com/mark24680617/A-Date-Skill/tree/main/examples/shanghai-ai. The example sheets show real people (the skill's author and partner): use them only to compare against, never in the user's site (`references/example/NOTICE.md`).

Work down this ladder and stop at the first step that works. If the user already chose a route (they set a key, or prefer their app), use that route. `references/characters.md` has the details, the exact prompt and the app instructions.
- **Level 1a: your own image tool**, when it accepts reference images (attach both photos and send the prompt from characters.md), or when there are no photos anyway (send the description version). One image per sheet. Save each as `walk.<ext>` / `poses.<ext>` with the extension of the format the tool returned, and set `src` to match; if the tool can only show images inline and can't save a file, 1a doesn't work: go to 1b or level 2. With photos and a text-only tool, try 1b or level 2 first, since they use the photos. Use the text-only tool with the description version only if neither works: it still beats the built-in couple.
- **Level 1b: the user's API key.** If they have an OpenAI or Google Gemini key, run `node <skill>/scripts/make-characters.mjs --site <site> --photo1 <left> --photo2 <right> --outfit1 "…" --outfit2 "…"`. Without photos, use `--describe1 "…" --describe2 "…"` (hair, skin tone, glasses, build) instead of `--photo1` / `--photo2`.
  - It reads the key from the environment (`OPENAI_API_KEY`, or `GEMINI_API_KEY` / `GOOGLE_API_KEY`). Ask the user to set it there rather than paste it in the chat.
  - It saves the sheets into `assets/characters/` and prints the config lines to paste.
  - Models: OpenAI `gpt-image-2` (the model behind the example sheets), falling back to `gpt-image-1.5` only if the key can't use it; Gemini `gemini-nano-banana-2.1`, then two older ones. Newer models only with `--model`: they may be early-access or premium.
  - A sheet takes 30 s – 4 min. Run the script with a command timeout of about 10 minutes, or in the background: each ✓ line is printed as soon as that sheet is saved. For more than two sheets, run it in the background, or one `--sheets` at a time.
  - Try `--dry-run` first: it shows the prompts and sends nothing.
- **Level 2: the user's app.** Otherwise, prepare the exact prompts and send them with short steps for ChatGPT, Gemini or 豆包 / 即梦. They upload the photos, paste the prompts, and send you back the saved images. The script prints the prompts with `--dry-run`, or when there's no key. It needs photo paths or descriptions: if the photos aren't on this machine, pass placeholder names (`--photo1 left.jpg --photo2 right.jpg`), since the prompt only needs to know there are two photos.
- **Level 3: the built-in couple, fallback only.** Use it when none of the above is possible, or the user declines (privacy, cost). Recolour it to match them (`characters.builtin`).

Whatever happens, colour the built-in couple early. It's the **placeholder** while the images are on their way: the site is complete and previewable with it. Tell the user it's temporary, so they don't think that's the final look.

Notes:
- **No photos?** Image models also draw from a description (hair, skin tone, glasses, build, outfits). That's still much closer to them than the built-in couple, so don't skip to level 3.
- **Outfits** are drawn into every frame. If you default to what they wear in the photos, check that it suits the season and weather of the date, and say so in the hand-off.
- **Key colour.** The sheets use a flat green background, which the site removes. If either of them wears green (or has green eyes), use magenta instead, or those parts turn see-through. The script does this automatically.
- **Privacy and cost.** Photos go only to an image service the user agreed to: name it before sending real photos, and let them say no. API use costs a little per sheet, billed to their account, and retries cost again.
- **Check every sheet.** Run `preview.mjs` and look at the couple at each stop and in the walking frames, or drag the sheet into `<skill>/template/tools/sprite-check.html` (open it through `serve.mjs`). Compare with `references/example/`: same faces and outfits in every frame, the grid the config says, nothing cut off, a clean background. Regenerate a bad sheet; consistency beats detail.

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
- **The characters.**
  - Images still pending: say the cartoon couple is a placeholder, and include the prompts with where to paste them (ChatGPT, Gemini, 豆包), or offer to make them if they set an OpenAI or Gemini key in their terminal (not in the chat). deploy.md has the wording.
  - Outfits taken from the photos: say so, and whether they suit the date's season and weather.
  - Built-in couple by choice, or because no image route was possible: say so, say where it doesn't match them, e.g. short hair drawn as long, and that you can switch to an image model any time.
- **Answer language.** Answers arrive in the partner's language; add a short gloss if the user doesn't read it.

If you deployed yourself, run the test checklist yourself first.

## Quality checklist

Before calling it done, check:
- [ ] The couple comes from an image model. If not, the images are pending (and the hand-off says the cartoon is a placeholder), or the user chose the built-in couple, or no image route was possible (the hand-off says so and offers to switch later).
- [ ] The sprite sheets show the same faces and outfits in every frame, and the walk loops without a wobble. They're the couple's own sheets, never the example ones from `references/example/`.
- [ ] Every stop's background and mood fit the place and time. The skyline setting fits the city.
- [ ] No leftover template text: search config for 上海 / 滨江 / 豫园 unless it really is Shanghai.
- [ ] The whole site is in the partner's language, including `labels`, `ui`, diet options and the calendar.
- [ ] Validate passes and the preview shows no JavaScript errors.
- [ ] At phone size, the card doesn't cover the couple, and the title and tasks fit.
- [ ] The answer path works end-to-end on the live site.

## Beyond the config

- **New background scene:** `template/js/scenes/README.md` (the SVG scene contract), then preview it in `template/tools/scenes.html`.
- **Different music:** replace `assets/audio/bgm.mp3`. The site is public, so use music they have rights to. The bundled track is original and generated by `template/tools/make-music.py`.
- **Problems:** `references/troubleshooting.md`.

## Files

```
<skill>/
├── SKILL.md
├── scripts/
│   ├── new-site.mjs         copy the template to a new folder
│   ├── make-characters.mjs  generate the sprite sheets with the user's OpenAI / Gemini key (or print the prompts)
│   ├── validate.mjs         check config, assets, form fields, scenes
│   ├── preview.mjs          phone/desktop screenshots + JS errors (needs Playwright)
│   └── serve.mjs            zero-dependency local server
├── references/
│   ├── interview.md         questions to ask, drafting the trip guide, writing style
│   ├── scenes.md            every background: what it shows, moods, label keys, props
│   ├── config.md            every config field
│   ├── characters.md        the image-model ladder, the sprite prompt, app steps, checking sheets, the built-in fallback
│   ├── example/             real sheets from an image model (walk.webp, poses.webp), from-sheet-to-site.jpg; NOTICE.md: not for reuse
│   ├── backgrounds.md       optional generated background plates
│   ├── deploy.md            Netlify Drop / GitHub / CLI / others, answers, China
│   └── troubleshooting.md
└── template/                the website (index.html, css/, js/, assets/, tools/)
```
