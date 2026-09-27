# Troubleshooting

Run `node scripts/validate.mjs <site>` first. It catches most config mistakes, with exact fixes. Then run `node scripts/preview.mjs <site>` to see errors and screenshots.

| Symptom | Cause → fix |
|---|---|
| Blank page, or the cover never appears | A JavaScript error, usually a typo in `js/config.js` (missing comma or quote). Validate shows the line. |
| The characters are the built-in cartoon although images exist | `characters.walk.src` is `''` or the path is wrong. Or the page was opened as a `file://…` URL, where browsers block the pixel processing: serve it with `node scripts/serve.mjs <site>`. |
| The characters flicker, wobble or slide | The sheet's frames are inconsistent. Check it in `<skill>/template/tools/sprite-check.html` (served with `serve.mjs`); regenerate bad frames; fix `cols` / `rows` / `frames`. |
| A stop shows the wrong background, or the "park" fallback | `bg` isn't one of the built-in names (see scenes.md). The console says `[trip] unknown bg`. |
| Chinese text shows in an English site, or the reverse | Leftover example text in config, or scene `labels` defaults. Search config for the other language. Set `labels` on the stop. Set `lang`. |
| Shanghai towers in another city | Set `skyline: 'generic'` (top level) or `'none'`. |
| The card covers the couple on small phones | `text` is too long, or there are too many `tasks`. Keep the title ≤ 12 Chinese / ≤ 20 Latin characters, text ≤ 60 Chinese / ≤ 105 Latin, and at most 5 short tasks. Validate warns about each. |
| Can't move past a stop | That stop has a `choice`: one option must be picked first. This is intended. |
| The calendar shows no pickable days | Every `datePick` date is in the past or malformed (`YYYY-MM-DD`). |
| Answers never arrive on Netlify | 1) Form detection isn't enabled (Forms → Enable), or the site wasn't redeployed after enabling. 2) The site isn't hosted on Netlify: use `reply.to` with a form service. 3) A new choice `key` is missing from the hidden form in `index.html` (validate checks this). |
| Answers arrive late | Your partner was offline. Answers queue on their phone and resend automatically when they're back online or reopens the page. |
| Music doesn't play | It starts only after the "yes" tap (browsers block autoplay). Check the iPhone silent switch. The 🎵 button toggles it. `music: ''` disables it. |
| The link won't open in WeChat | WeChat blocks many foreign domains. Use ··· → 在浏览器打开, or a host in China (deploy.md). |
| Your partner sees an old version | The browser cache. Pull to refresh, or open in a private window. Netlify serves new deploys immediately. |
| Testing again shows "already approved" | Each run-through submits once. "↺ once more" starts a new run. To wipe everything, clear the site's data, or use a private window. |
| The couple floats or sinks on a generated background | Adjust that stop's `groundY` (backgrounds.md). |
| The "No" button can be tapped | It can't. It dodges on hover, touch and focus. If the user wants it gone: `cover: { no: '' }`. |

## Handy URL parameters

- `?scene=3` starts directly at stop 3. It skips the cover and the calendar, which is useful for checking one stop.
- `?debug` logs sprite-processing details to the console.
