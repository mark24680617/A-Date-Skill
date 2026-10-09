# `js/config.js` reference

Everything personal lives in `window.TRIP_CONFIG` in `js/config.js`. The template ships a complete Chinese example (a day in Shanghai). **Replace every example text.** A leftover "上海" in a Paris date gives the game away.

After editing, run `node scripts/validate.mjs <site>`.

Contents: [Top level](#top-level) · [characters](#characters) · [scenes (stops)](#scenes-stops) · [choice](#choice-a-decision-your-partner-makes) · [diet](#diet-food-to-avoid) · [datePick](#datepick) · [cover](#cover) · [ending](#ending) · [reply](#reply) · [ui](#ui-wording)

## Top level

| Field | Example | Notes |
|---|---|---|
| `lang` | `'zh-CN'`, `'en'`, `'ja'` | Sets the built-in wording (Chinese, English or Japanese) and date formatting. For any other language, also set every `ui` string: validate lists the missing ones. |
| `title` | `'Lisbon & Us'` | Cover title and browser tab. ≤ 8 Chinese/Japanese or ≤ 14 Latin characters stays on one line (the cover font is big). Also update `<html lang>`, `<title>` and `<meta name="description">` in `index.html`: some chat apps show them in link previews (WeChat shows a plain link). |
| `subtitle` | `'One Day With You'` | Small uppercase line above the title. Keep it ≤ 26 characters, or it wraps on phones. |
| `date` | `'Autumn 2026'` | Free text under the title. |
| `names` | `{ a: 'Sam', b: 'Mia' }` | Shown as "Sam ♥ Mia" when both are set, on the **same line** as `date` ("Autumn 2026 · Sam ♥ Mia"). Keep the two together ≤ 20 Chinese / ≤ 36 Latin characters. |
| `skyline` | `'generic'` | City skyline behind the city scenes: `'generic'` (towers, for big cities), `'shanghai'` (Lujiazui towers) or `'none'` (small or historic towns). A scene can override it. |
| `music` | `'assets/audio/bgm.mp3'` | Starts when your partner taps "yes". `''` turns music off. The bundled track is original and free to use. |
| `reply` | `{ to: 'netlify' }` | Where the answers go. See [reply](#reply). |
| `lines` | `['Love you~', …]` | Speech bubbles when your partner taps the couple. |
| `storageKey` | `'odd'` | Prefix for what the browser remembers. Change it only if two of these sites share one domain. |
| `ui` | `{ next: 'Suivant' }` | Overrides for built-in wording. See [ui](#ui-wording). |

## characters

```js
characters: {
  // sheets from an image model (make-characters.mjs, or the user's app; see characters.md)
  walk:  { src: 'assets/characters/walk.webp',  cols: 3, rows: 2, frames: 6, fps: 9 },
  poses: { src: 'assets/characters/poses.webp', cols: 3, rows: 2, frames: 6, normalize: false,
           list: [{ name: 'hold', say: '…' }, …] },   // one entry per pose, left→right, top→bottom
  coverPose: 'heart',  // pose shown on the cover
  standFrame: 2,       // without poses: which walk frame (0-based) to stand in
  height: 0.37,        // character height as a fraction of scene height
  builtin: {           // the built-in cartoon couple: fallback and placeholder, used when walk.src is ''
    a: { skin: '#FFDCC2', hair: '#2E2521', top: '#8EC3EC', bottom: '#3A4766' },   // left: short hair, shirt, trousers (these are the defaults)
    b: { skin: '#FFDCC2', hair: '#5B3A2E', dress: '#F7A6BA', shoes: '#B94A48' },  // right: long hair, dress
  },
}
```

- **Where `walk.src` and `poses.src` come from.** Normally from an image model. `scripts/make-characters.mjs` saves the sheets in `assets/characters/` and prints the exact lines to paste here; sheets the user makes in an app, or that you make with your own image tool, go in the same folder. The extension in `src` must match the file (`.png`, `.jpg` or `.webp`). Validate warns about sheets over 1 MB and prints a WebP conversion command. See characters.md.
- **The built-in couple is the fallback.** Leave `walk.src: ''` to use it: when no image model was possible, or as the placeholder while the images are on their way. Colour it with `builtin` either way, since it also shows if a sheet fails to load. The `poses` block is ignored while its `src` is `''`.
- **Sprites need a walk sheet.** `poses` and `characters.idle` are used only when `walk.src` is set. (A stop's own `idle.sprite` works either way.)
- Pose names are free text. Each stop refers to one by `idle.pose`. The template's six are: `hold`, `hug`, `heart`, `stroll`, `piggyback`, `chin`.
- `idle: { src, cols, rows, frames, fps }` is optional: a looping standing animation, used when there are no poses.

## scenes (stops)

`scenes` is the list of stops, in order: 4–6 of them. With more than 6, the stop icons crowd the top bar on phones.

```js
{
  id: 'museum',            // unique, simple name
  bg: 'museum',            // background: see scenes.md
  mood: 'day',             // 'day' | 'sunset' | 'night' (scenes that support it)
  labels: { name: 'MoMA' },// text painted inside the background (scenes.md lists the keys); '' hides it
  skyline: 'generic',      // optional per-stop override
  sky: 'linear-gradient(#FFD6A5, #FDFFB6)',   // optional: override the scene's sky colour
  bgImage: '',             // optional generated background plate (backgrounds.md)
  groundY: 0.82,           // with bgImage: where their feet stand, as a fraction of image height
  icon: '🖼️',              // one emoji; add U+FE0F after old symbols like ☕ → '☕️' or they may render as flat black glyphs
  time: '14:00',
  title: 'The Museum',     // ≤ 12 Chinese / ≤ 20 Latin characters, or it wraps on phones
  name: 'Museum',          // optional short name: top bar, walking caption, next button (defaults to title)
  place: 'MoMA · Floor 5',
  text: 'One or two sentences to your partner.',
  tasks: ['Find your favourite painting', 'Copy a pose'],   // 2–5 tickable mini-missions, each ≤ 12 Chinese / ≤ 24 Latin characters
  accent: '#3FA7D6',       // card and button colour
  nextLabel: 'Off we go',  // optional custom text for the next button (first/last stop)
  lines: ['So pretty', 'Look at this!', 'I like that one'],
  idle: { type: 'stand', pose: 'heart' },
  pet: 'samoyed',          // bedroom only: a fluffy dog by the bed
  sign: 'Moon Bar', signIcon: 'glass',   // bar only: neon sign ('glass' | 'heart' | 'berry')
  table: false,            // cafe / bistro only: remove the table in front of the couple
  season: 'autumn',        // park only: 'spring' (pink blossom) | 'summer' | 'autumn'
  docks: false,            // riverside only: Shanghai oil tanks / crane / rails (default: on only with the Shanghai skyline)
  bridge: false,           // riverside only: leave out the big arch bridge
  choice: { … },           // optional, see below
  diet: { … },             // optional, see below (use on one meal stop)
}
```

**`idle.type`** is what the couple does while standing at the stop:
- `stand`: the default.
- `sleep`: first stop, bedroom only. The built-in couple sleeps in bed; sprite couples stand drowsily.
- `sit`: sits them lower behind a table. Use it with `restaurant`, `cafe` and `bistro`.
- `cheers`: for `bar`.

Optional extras on `idle`:
- `lower: 0.1` adjusts how low `sit` puts them.
- `sprite: { src, cols, rows, frames, fps, height }` plays a special animation at this stop only (e.g. a toast). Add it next to the stop's `type` and `pose`: `idle: { type: 'cheers', pose: 'hold', sprite: { … } }` (characters.md, Special animations).

## choice (a decision your partner makes)

A stop with `choice` shows the choice buttons first, then any `tasks`; keep tasks to 0–2 there so the card stays small. Your partner can't walk on until they pick one. The pick is recorded under `key` and sent at the end.

```js
choice: {
  key: 'transport',                 // answer field name; letters/numbers/_ only
  ask: 'Pick one first~',           // nudge if they try to skip
  options: [
    { id: 'taxi',  icon: '🚕', label: 'Taxi',          say: 'To the river, please!', travel: '🚕 Taking a taxi to' },
    { id: 'metro', icon: '🚇', label: 'Metro / bus',   say: 'Tap in, let’s go!',      travel: '🚇 Riding the metro to' },
    { id: 'bike',  icon: '🚲', label: 'Bike (tiring!)', say: 'Wind in our hair!',     travel: '🚲 Cycling to' },
  ],
}
```

- **`say`** is the speech bubble when they pick the option.
- **`travel`** replaces the walking caption to the next stop. It becomes `travel + ' ' + next stop name + ' …'`, or put `{name}` where the name goes (`'🚌 {name}までバスで…'`). Keep the whole caption ≤ 20 Chinese / ≤ 36 Latin characters.
- **Street animations.** On the `street` background, ids `taxi`, `metro` and `bike` animate the taxi, the metro and bus signs, and the bikes.
- **Other stops.** Choices work anywhere: dessert, film, activity…
- **Netlify form field (required).** With Netlify Forms, add `<input name="transport">` (your `key`) to the hidden `trip-reply` form in `index.html`. Netlify only stores fields it saw at deploy time. The validator checks this.
- **Reserved keys.** Don't use these as a `key`: `verdict`, `date`, `diet`, `next`, `feedback`, `summary`, `at`, `id`, `form-name`, `bot-field`.

## diet (food to avoid)

Put this on one meal stop. It adds a button to the card that opens a chip picker with a free-text field.

```js
diet: {
  icon: '🍴',              // shown on the button, the modal and the ending chip (default 🥢 in Chinese, 🍴 otherwise)
  button: '🍴 Anything you don’t eat?', title: 'Anything you don’t eat?', hint: 'Pick as many as you like',
  options: ['Spicy', 'Coriander', 'Seafood', 'Pork', 'Nuts', 'Dairy', 'Very sweet', 'Raw fish'],
  none: 'I eat everything!', otherPlaceholders: ['Anything else…', 'e.g. peanut allergy'],
  empty: 'Pick one, or tap “I eat everything!”', send: 'That’s all', cancel: 'Not now',
  saved: 'Noted ✓', savedNone: 'Great, anything goes!', summary: 'Avoid: ',
}
```

## datePick

A calendar appears right after your partner taps "yes". Only the listed dates can be picked. The choice is sent as `date`. Delete the block to skip the calendar.

```js
datePick: {
  title: 'Which day?', hint: 'Any of these weekends works for me',
  dates: ['2026-10-03', '2026-10-04', '2026-10-10', '2026-10-11'],  // or from: '2026-10-01', to: '2026-10-07'
  labels: { '2026-10-10': 'Payday' },       // tiny tag under a date (optional)
  confirm: 'This day →', pickFirst: 'Pick a day first', disabled: 'Only the highlighted days, sorry!',
}
```

- Dates can span several months; arrows appear.
- The old form `{ year: 2026, month: 10, days: [1, 2, 3] }` also works.

## cover

```js
cover: { question: 'Ready?', yes: "I'm ready!", no: 'Nope', hint: '' }
```

- The `no` button runs away and can never be tapped. `no: ''` hides it.
- `hint` replaces the controls hint; `''` hides it. The default adapts: tap/swipe on phones, keys on computers.

## ending

```js
ending: {
  title: 'A day is short,\nbut days with you are long.',   // \n = line break; each line ≤ 12 Chinese / ≤ 21 Latin characters
  question: 'Where should we go next time?',
  placeholders: ['Next time…', 'Kyoto?', 'The beach?'],      // animated placeholder texts
  approve: 'Approved', feedback: 'I have suggestions',       // the two buttons
  approved: 'Stamped and sealed ♥', stamp: 'YES',            // after approving; the stamp is 1 character or a short word (≤ 4 letters)
  summary: true,                                             // show their picks as chips
  feedbackTitle: 'Your suggestions', feedbackHint: 'What would make it even better?',
  feedbackPlaceholders: ['e.g. more dessert'], feedbackEmpty: 'Write something~',
  send: 'Send', cancel: 'Never mind', thanks: 'Got it! Changes coming 🫡', replay: '↺ Once more',
}
```

**One submission per run-through.** It happens when your partner taps approve or sends suggestions, and contains:
- `verdict`, `date`, each choice `key`, `diet`, `next`, `feedback`;
- `summary`: everything in one readable line;
- `at`: their local time;
- `id`: a per-run id.

If the network drops, the answer is queued on their phone and retried.

## reply

| `reply.to` | What happens |
|---|---|
| `'netlify'` (default) | Posts to Netlify Forms (form `trip-reply`). Only works when the site is hosted on Netlify with form detection enabled (deploy.md). |
| `'https://formspree.io/f/xxxx'`, `'https://formsubmit.co/ajax/you@example.com'`, … | Posts the same fields to any form service that accepts a form POST with CORS. Use this on GitHub Pages, Cloudflare, Vercel… |
| `'none'` | Nothing is sent. The answers only show on their screen. |

`reply.extra: { _subject: 'New answer!' }` adds fixed fields to every submission, e.g. an email subject for form services.

## ui (wording)

Built-in wording comes in Chinese (`lang: 'zh-…'`), Japanese (`'ja'`) and English (any other `lang`). Override any key with `ui: { key: 'text' }`. For any other language, override **all** of them; validate lists what's missing.

| key | zh | en |
|---|---|---|
| `next` | 下一站 | Next |
| `go` | 出发 | Let's go |
| `finish` | 结束今天 ♥ | End of our day ♥ |
| `walkingTo` / `walkingBack` | 🚶 正在前往 / 🚶 回到 | 🚶 Heading to / 🚶 Back to (+ the stop name; or use `{name}` for another word order: `'🚶 {name}へ…'`) |
| `prev` / `home` / `music` / `stage` | 上一站 / 回到封面 / 背景音乐 / 旅程 | screen-reader labels |
| `hintTouch` / `hintMouse` | 点按钮或左右滑动… / 可以点按钮，或用键盘 ← → … | Tap the buttons or swipe… / Click the buttons or use the ← → keys (phones / computers; `hint` sets one text for both) |
| `snooze` / `morning` | Zzz… 再睡五分钟 / 早安呀☀️ | Zzz… five more minutes / Good morning ☀️ |
| `pickOne` / `taskDone` | 先选一个嘛～ / 打卡成功 ✓ | Pick one first~ / Done ✓ |
| `slowNet` | 网络有点慢，会自动补发的～ | Slow network — it'll resend by itself |
| `nextTime` | 下一次： | Next time: |
| `stamp` | 准 | YES |
| `ready` / `yes` / `no` | 准备好了吗？/ 准备好啦！/ 不去了 | Ready? / I'm ready! / Nope |
| `approve` / `feedback` / `replay` | 准了 / 发表些建设性意见 / ↺ 再走一遍 | Approved / I have suggestions / ↺ Once more |
| `send` / `cancel` / `approved` / `thanks` / `feedbackEmpty` | 提交 / 算了 / 就这么定啦 ♥ / 意见已收到！/ 写点什么嘛～ | Send / Never mind / It's a date ♥ / Got it, thank you! / Write something~ |
| `verdictFeedback` | 建设性意见 | Suggestions (the `verdict` value sent with suggestions) |
| `dateTitle` / `dateGo` / `dateChosen` | 哪天出发？/ 就这天出发 → / 就这天！ | Which day? / This day → / That's the day! |
| `dateSay` | 就 {d} 啦！ | {d} it is! (`{d}` = the date) |
| `dateOff` / `datePickFirst` / `unavailable` | 这天不行哦 / 先选一天嘛 / 不可选 | That day isn't available / Pick a day first / unavailable |
| `prevMonth` / `nextMonth` | 上个月 / 下个月 | Previous month / Next month |
| `dietOther` / `dietNone` / `dietSend` / `dietCancel` / `dietSummary` | 其他忌口 / 都可以 / 就这些 / 再想想 / 忌口： | Other / Anything / That's all / Not now / Avoid: |

Most of these also have a per-section field (`cover.yes`, `ending.approve`, `datePick.confirm`, `diet.send`…). When both are set, the section field wins.
