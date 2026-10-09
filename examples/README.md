# Examples

Finished `config.js` files you can learn from or start from.

| Folder | Language | Characters | Stops |
|---|---|---|---|
| `shanghai-ai/` | 中文 | **Image model** (gpt-image-2, from two photos), sprite sheets in `assets/characters/`. The author's own date, shared with permission. | Shanghai: bedroom → street (transport choice) → riverside → yuyuan → restaurant (diet) → bar |
| (the template itself) `skills/one-day-date/template/js/config.js` | 中文 | Built-in couple until `walk.src` is set | Shanghai: the same stops, as a generic example to replace |
| `seaside-en/` | English | Built-in fallback couple | bedroom → cafe (brunch choice) → beach → amusement (sunset) → bistro (diet) |

`shanghai-ai/` is what the skill aims for: the couple drawn by an image model. Its [README](shanghai-ai/README.md) shows how the sheets were made and how to run it. `seaside-en/` shows the fallback, for when no image model is available.

To try one (from the repository root; the site goes in `../try-it`, next to the repository, so nothing lands inside it):
1. Create a site: `node skills/one-day-date/scripts/new-site.mjs ../try-it`.
2. Copy the example over `../try-it/js/config.js`. For `shanghai-ai`, also copy `examples/shanghai-ai/assets/characters/*.webp` into `../try-it/assets/characters/`.
3. Update the site's `index.html` (`shanghai-ai` needs no changes):
   - `<html lang>` and `<title>`;
   - the hidden form's inputs: one per `choice.key`, e.g. `brunch`.
4. Check it with `node skills/one-day-date/scripts/validate.mjs ../try-it`.
5. Open it with `node skills/one-day-date/scripts/serve.mjs ../try-it`.

The `shanghai-ai` sprite sheets show the author and their partner as cartoons. They aren't covered by the repository's MIT licence (all rights reserved, see [NOTICE.md](../NOTICE.md)): they're here only as an example of image-model output. Try the example locally, but don't reuse the sheets for your own site: make your own.
