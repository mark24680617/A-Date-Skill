# Instructions for AI agents

This repository (A-Date-Skill) is an **agent skill**: it lets you build a 3D-cartoon date-day website for a couple from a trip plan and two photos, with the couple drawn by an image model.

**When a user wants a date, trip or anniversary website** (or asks you to "use this skill"), read [`skills/one-day-date/SKILL.md`](skills/one-day-date/SKILL.md) and follow it. The skill's scripts and template live next to it. Create the user's site in a **new folder outside this repository**, unless they ask otherwise, so their personal content never ends up in this repo.

## Working on the skill itself

- **Template.** `skills/one-day-date/template/` is a static site: plain ES5/ES2015 JS, no build step, no external requests (it must work in mainland China and in the WeChat browser).
- **Content.** Everything personal lives in `template/js/config.js`. Keep that file a complete, generic example.
- **Characters: image model first.** The skill tells agents to get the couple from an image model (their own image tool when it accepts reference images or there are no photos, `scripts/make-characters.mjs` with the user's key, or the user's app), and to use the built-in couple only as the fallback or placeholder. A route the user already chose wins, and agents name the service before sending real photos anywhere. Keep every doc consistent with that ladder, and with `make-characters.mjs --help` (model defaults, the 290 s timeout cap).
- **One prompt, two places.** The sprite-sheet prompt is in `references/characters.md` (the `text` block and the `[ACTION]` table) and in `scripts/make-characters.mjs` (`SHEETS`, `buildPrompt`). Keep them word for word identical: change both or neither.
- **Checks.** Before committing, run:
  - `node skills/one-day-date/scripts/validate.mjs skills/one-day-date/template` (must pass);
  - `node skills/one-day-date/scripts/preview.mjs skills/one-day-date/template --desktop` (no JS errors).
- **Testing `make-characters.mjs`.** Never call a real image API in tests. Point `OPENAI_BASE_URL` / `GEMINI_BASE_URL` at a local mock server and use fake keys. Never print, store or commit a real key.
- **New background scenes.** Follow `template/js/scenes/README.md`, register the scene in `template/index.html` and `template/tools/scenes.html`, and document it in `references/scenes.md` (all under `skills/one-day-date/`).
- **README images.** Regenerate them with `node tools/screenshots.mjs` after visual changes. It writes `docs/screenshots/` (hero and hero-zh from `examples/shanghai-ai`, fallback from `examples/seaside-en`, scenes) and `skills/one-day-date/references/example/from-sheet-to-site.jpg`. It also refreshes `skills/one-day-date/references/scenes-overview.jpg` and `scenes-moods.jpg`.
- **Claude.ai zip.** After changing anything under `skills/one-day-date/`, rebuild the upload zip with `python3 tools/package.py`, and commit `dist/one-day-date.zip`.
- **Privacy.** Never commit real people's photos or personal trip details to this repo. The one exception is the author's own Shanghai date, shared with permission as the image-model example: `examples/shanghai-ai/` and `skills/one-day-date/references/example/`. Don't add anything personal beyond it.
- **Likeness.** The example couple's images (those sprite sheets, and the hero screenshots made from them) show the author and their partner. They are not under the MIT licence: [`NOTICE.md`](NOTICE.md) says so, and so do `skills/one-day-date/references/example/NOTICE.md`, the README licence sections and `examples/shanghai-ai/README.md`. Keep these in step, never use those images in a user's site, and don't edit `LICENSE` itself.
