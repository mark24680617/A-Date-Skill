# Troubleshooting

Run `node scripts/validate.mjs <site>` first. It catches most config mistakes, with exact fixes. Then run `node scripts/preview.mjs <site>` to see errors and screenshots.

| Symptom | Cause → fix |
|---|---|
| Blank page, or the cover never appears | A JavaScript error, usually a typo in `js/config.js` (missing comma or quote). Validate shows the line. |
| A stop shows the wrong background, or the "park" fallback | `bg` isn't one of the built-in names (see scenes.md). The console says `[trip] unknown bg`. |
| Chinese text shows in an English site, or the reverse | Leftover example text in config, or scene `labels` defaults. Search config for the other language. Set `labels` on the stop. Set `lang`. |
| Shanghai towers in another city | Set `skyline: 'generic'` (top level) or `'none'`. |
| The card covers the couple on small phones | `text` is too long, or there are too many `tasks`. Keep the title ≤ 12 Chinese / ≤ 20 Latin characters, text ≤ 60 Chinese / ≤ 105 Latin, and at most 5 short tasks. Validate warns about each. |
| Can't move past a stop | That stop has a `choice`: one option must be picked first. This is intended. |
| The calendar shows no pickable days | Every `datePick` date is in the past or malformed (`YYYY-MM-DD`). |
| Answers never arrive on Netlify | 1) Form detection isn't enabled (Forms → Enable), or the site wasn't redeployed after enabling. 2) The site isn't hosted on Netlify: use `reply.to` with a form service. 3) A new choice `key` is missing from the hidden form in `index.html` (validate checks this). |
| Answers arrive late | Your partner was offline. Answers queue on their phone and resend automatically when they're back online or reopen the page. |
| Music doesn't play | It starts only after the "yes" tap (browsers block autoplay). Check the iPhone silent switch. The 🎵 button toggles it. `music: ''` disables it. |
| The link won't open in WeChat | WeChat blocks many foreign domains. Use ··· → 在浏览器打开, or a host in China (deploy.md). |
| Your partner sees an old version | The browser cache. Pull to refresh, or open in a private window. Netlify serves new deploys immediately. |
| Testing again shows "already approved" | Each run-through submits once. "↺ once more" starts a new run. To wipe everything, clear the site's data, or use a private window. |
| The couple floats or sinks on a generated background | Adjust that stop's `groundY` (backgrounds.md). |
| The "No" button can be tapped | It can't. It dodges on hover, touch and focus. If the user wants it gone: `cover: { no: '' }`. |

## Characters and image generation

`scripts/make-characters.mjs` prints a ✗ line for each failed sheet, with a → line saying what to do. The rows below say the same in more detail. When an API route is stuck, don't spend long on it: the app route (characters.md, level 2) usually works, and the built-in couple keeps the site complete meanwhile.

| Symptom | Cause → fix |
|---|---|
| Exit code 2, "No image API key found" | No `OPENAI_API_KEY`, `GEMINI_API_KEY` or `GOOGLE_API_KEY` where the command runs. If the user has a key, ask them to set it in the environment (characters.md, level 1b) rather than paste it into the chat. No key at all: the script printed the prompts, so use the app route. |
| "The API key was rejected" (401, or Gemini `API_KEY_INVALID`) | The key is incomplete, revoked, or for the other provider. Ask for a fresh one: platform.openai.com/api-keys or aistudio.google.com/apikey. |
| "Did you copy a masked key" | The key has spaces, `***`, `...` or other characters a real key doesn't. It was copied from a list that only shows part of it, or with text around it. Copy the whole key again (or create a new one) and set the variable again. Nothing was sent. |
| A 403, 400 or 404 about the **model** ("does not have access to model", "not allowed to sample from this model", `model_not_found`) | The key can't use that model. That's not a bad key: don't ask for a new one. Without `--model` the script already falls back (OpenAI `gpt-image-2` → `gpt-image-1.5`; Gemini through its defaults in `--help`). With `--model`, run again with the other one (`gpt-image-2` ↔ `gpt-image-1.5`; Gemini: another of its defaults), or drop `--model`. |
| OpenAI 403 that mentions verification ("must be verified") | GPT Image models need a verified organization: platform.openai.com → Settings → Organization → General → Verify Organization, then wait a few minutes. Without `--model`, the script already falls back to `gpt-image-1.5` before stopping (it usually needs verification too). Or use a Gemini key, or the app route. |
| "A request field was rejected" (400 about quality, size or a `--param`) | Not a model problem: the script stops there and never switches models for it. Run again without that `--size` / `--quality` / `--param`, or with another `--model`. |
| Other 403, "not available in your region", or Gemini `FAILED_PRECONDITION` that isn't about billing | A restricted key, an API that isn't enabled, or a service not offered where the user is. Try the other provider, or the app route (豆包 / 即梦 work in mainland China). |
| Quota or billing: a 429 about quota or "limit: 0", OpenAI `billing_hard_limit_reached` or `insufficient_quota`, Gemini "requires billing" | No credit left, a billing limit reached, or no free tier for that model. The user adds billing or raises the limit on the provider's site, or waits for the daily quota; or use the app route. Short rate limits are retried automatically. |
| The safety filter refused a sheet (OpenAI `moderation_blocked`, Gemini `IMAGE_SAFETY`) | Photos of real people and close poses (hug, piggyback) sometimes trip it. Run again once, since it varies. Then retry with a description instead of photos (`--describe1` / `--describe2`, no `--photo1` / `--photo2`), try the other provider, or use the app route, where the user uploads their own photos. Don't try to trick the filter. |
| "couldn't reach api.openai.com" or "…googleapis.com" (`ENOTFOUND`, `ECONNREFUSED`, cancelled) | The network blocks the service: a firewall, a sandbox, or mainland China without a VPN. If `HTTPS_PROXY` is set, run again with `NODE_USE_ENV_PROXY=1` in front (Node 22.21+ or 24+). Otherwise use the app route. |
| "no answer … after N s", then "skipping …: Re-run with --sheets …" | Image models can be slow. `--timeout` is at most 290 s, the default (Node's fetch can't wait longer for an answer). After one timeout the script skips the remaining sheets, because they'd most likely wait just as long. Run again later with the `--sheets` it printed, or with `--quality medium` on OpenAI, which is faster. A timed-out image may still be billed. |
| Your own command was cut off before the script finished | Your shell tool's timeout is shorter than the script needs (30 s – 4 min per sheet). Run it with a command timeout of about 10 minutes, or in the background. For more than two sheets, run it in the background, or one `--sheets` at a time. Sheets with a ✓ line are already saved: re-run with `--sheets` and only the missing ones. |
| A photo is HEIC (iPhone) | Gemini accepts HEIC. OpenAI needs JPEG, PNG or WebP: convert it (macOS: `sips -s format jpeg photo.heic --out photo.jpg`; the script prints the exact command), or run with `--provider gemini` if a Gemini key is set. |
| A photo is too large, or "request too large" / 413 | Resize to about 1600 px on the long side (macOS: `sips -Z 1600 photo.jpg`; Python PIL: `img.thumbnail((1600, 1600))`). Gemini takes about 14 MB of photos in all. |
| The generated sheet has the wrong grid (4 × 2, 2 × 3, 5 frames…) | Set `cols` / `rows` / `frames` to what it drew: `sprite-check.html` shows the frames it finds. Or regenerate. The script warns when an image isn't 3:2. |
| Inconsistent frames: a different face, outfit or size in one frame | Regenerate just that sheet (`--sheets walk`, or the same prompt again in the app). Consistency beats detail. |
| The characters flicker, wobble or slide | The sheet's frames are inconsistent. Check it in `<skill>/template/tools/sprite-check.html` (served with `serve.mjs`); regenerate it, or fix `cols` / `rows` / `frames`. |
| Patches of clothing are see-through | The clothes are close to the key colour. Regenerate with the other key (`--key-colour magenta` or `green`). |
| The characters are the built-in cartoon although images exist | `characters.walk.src` is `''` or the path is wrong (the extension must match the file: `walk.webp`, not `walk.png`). Poses and `characters.idle` are only used together with a walk sheet. Or the page was opened as a `file://…` URL, where browsers block the pixel processing: serve it with `node scripts/serve.mjs <site>`. |
| Validate warns that a sheet is over 1 MB | It loads slowly on phones. Run the Python PIL command validate prints (in the site folder), then set `src` to the new `.webp` file. |

## Handy URL parameters

- `?scene=3` starts directly at stop 3. It skips the cover and the calendar, which is useful for checking one stop.
- `?debug` logs sprite-processing details to the console.
