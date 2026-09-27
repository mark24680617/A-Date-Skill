# Examples

Finished `config.js` files you can learn from or start from.

| Folder | Language | Stops |
|---|---|---|
| (the template itself) `skills/one-day-date/template/js/config.js` | 中文 | Shanghai: bedroom → street (transport choice) → riverside → yuyuan → restaurant (diet) → bar |
| `seaside-en/` | English | bedroom → cafe (brunch choice) → beach → amusement (sunset) → bistro (diet) |

To try one:
1. Create a site: `node skills/one-day-date/scripts/new-site.mjs ./try-it`.
2. Copy the example over `try-it/js/config.js`.
3. Update the site's `index.html`:
   - `<title>`;
   - the hidden form's inputs: one per `choice.key`, e.g. `brunch`.
4. Check it with `node skills/one-day-date/scripts/validate.mjs ./try-it`.
5. Open it with `node skills/one-day-date/scripts/serve.mjs ./try-it`.
