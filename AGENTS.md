# Instructions for AI agents

This repository is an **agent skill**: it lets you build a 3D-cartoon date-day website for a couple from a trip plan and, optionally, two photos.

**When a user wants a date, trip or anniversary website** (or asks you to "use this skill"), read [`skills/one-day-date/SKILL.md`](skills/one-day-date/SKILL.md) and follow it. The skill's scripts and template live next to it. Create the user's site in a **new folder outside this repository**, unless they ask otherwise, so their personal content never ends up in this repo.

## Working on the skill itself

- **Template.** `skills/one-day-date/template/` is a static site: plain ES5/ES2015 JS, no build step, no external requests (it must work in mainland China and in the WeChat browser).
- **Content.** Everything personal lives in `template/js/config.js`. Keep that file a complete, generic example.
- **Checks.** Before committing, run:
  - `node skills/one-day-date/scripts/validate.mjs skills/one-day-date/template` (must pass);
  - `node skills/one-day-date/scripts/preview.mjs skills/one-day-date/template --desktop` (no JS errors).
- **New background scenes.** Follow `template/js/scenes/README.md`, register the scene in `index.html` and `tools/scenes.html`, and document it in `references/scenes.md`.
- **README images.** Regenerate them with `node tools/screenshots.mjs` after visual changes. It also refreshes `references/scenes-overview.jpg` and `scenes-moods.jpg`.
- **Claude.ai zip.** After changing anything under `skills/one-day-date/`, rebuild the upload zip with `python3 tools/package.py`, and commit `dist/one-day-date.zip`.
- **Privacy.** Never commit real people's photos or personal trip details to this repo.
