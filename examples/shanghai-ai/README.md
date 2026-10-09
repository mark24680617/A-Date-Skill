# Shanghai, with image-model characters · 上海一日（图像模型生成的人物）

[English](#english) · [中文](#中文)

<img src="../../skills/one-day-date/references/example/from-sheet-to-site.jpg" alt="The walk sheet and the poses sheet from the image model, and three phone screenshots of the site using them" width="900">

## English

This is the real site this skill was generalised from: a one-day date in Shanghai, written in Chinese. It's shared as an example with its author's permission. It shows what the characters look like when you **go for an image model first**, which is what the skill asks the agent to do.

**How the characters were made**

1. One photo of each person.
2. The sprite-sheet prompt in [`references/characters.md`](../../skills/one-day-date/references/characters.md), with the outfits filled in:
   - him: a light-blue shirt, navy trousers and white sneakers;
   - her: a pink dress, white socks, red Mary Janes and a small tan crossbody bag;
   - key colour: green `#00FF00`.
3. OpenAI **gpt-image-2** (the default model of `scripts/make-characters.mjs`) on a 1536×1024 canvas, one image per sheet: the walk-cycle action gave `walk.webp`, the six poses gave `poses.webp`.
4. The two images saved in `assets/characters/`, and their paths set in `config.js`.

The site does the rest: it keys out the green, slices the 3 × 2 grid, lines the frames up, and plays the walk cycle in time with the ground. Each stop uses one pose (`idle.pose`), and tapping the couple switches pose. Sheets made the same way in ChatGPT, Gemini or 豆包 work just as well (when neither the agent's own tool nor an API key is available). The built-in cartoon couple is only the last resort.

The original photos are not in this repo.

**The sheets are not MIT.** `assets/characters/walk.webp` and `poses.webp` show the author and their partner as cartoons. They are not covered by the repository's MIT licence (all rights reserved; see [NOTICE.md](../../NOTICE.md)), and are included only as an example of image-model output. Please don't reuse them for your own site: make your own.

**Try it** (locally, to see it; don't publish it with these sheets). Run this from the repository root. It makes the site in `../shanghai-ai-try`, a folder next to the repository, so nothing lands inside it:

```bash
node skills/one-day-date/scripts/new-site.mjs ../shanghai-ai-try
cp examples/shanghai-ai/config.js ../shanghai-ai-try/js/config.js
cp examples/shanghai-ai/assets/characters/*.webp ../shanghai-ai-try/assets/characters/
node skills/one-day-date/scripts/validate.mjs ../shanghai-ai-try
node skills/one-day-date/scripts/serve.mjs ../shanghai-ai-try      # open the printed URL
```

The template's `index.html` already matches this config (Chinese, same title, a `transport` form field). Validate warns that the calendar dates have passed: they're the real ones from October 2026.

## 中文

这是这个技能最初来自的真实网站：一份中文的上海一日约会，经作者同意作为示例公开。它展示了**优先用图像模型**生成人物（也就是技能要求智能体首先做的）之后的效果。

**人物是怎么做出来的**

1. 两人各一张照片。
2. [`references/characters.md`](../../skills/one-day-date/references/characters.md) 里的精灵图提示词，填上衣服：
   - 他：浅蓝衬衫、藏青长裤、白色运动鞋；
   - 她：粉色连衣裙、白袜子、红色玛丽珍鞋、棕色小斜挎包；
   - 背景色：绿色 `#00FF00`。
3. OpenAI **gpt-image-2**（`scripts/make-characters.mjs` 的默认模型），1536×1024 画布，每张精灵图一张图：走路动作得到 `walk.webp`，六个定格动作得到 `poses.webp`。
4. 两张图放进 `assets/characters/`，在 `config.js` 里填上路径。

剩下的网站自己完成：抠掉绿色、切开 3 × 2 的格子、对齐每一帧，走路的节奏和地面滚动对上。每一站用一个动作（`idle.pose`），点小人会换一个。在 ChatGPT、Gemini 或豆包里用同样方法生成的精灵图也一样好用（适合智能体自己的工具和 API 密钥都用不上的时候）；内置卡通小人只是最后的备选。

原始照片不在这个仓库里。

**精灵图不在 MIT 许可范围内。** `assets/characters/walk.webp` 和 `poses.webp` 画的是作者本人和另一半（卡通版）。它们不在本仓库的 MIT 许可范围内（保留所有权利，见 [NOTICE.md](../../NOTICE.md)），只作为图像模型生成效果的示例收录。请不要用在你自己的网站上，生成你们自己的就好。

**试一试**（在本地看看就好，别带着这两张图发布）。在仓库根目录下运行。网站会建在仓库旁边的 `../shanghai-ai-try` 文件夹里，不会往仓库里放任何东西：

```bash
node skills/one-day-date/scripts/new-site.mjs ../shanghai-ai-try
cp examples/shanghai-ai/config.js ../shanghai-ai-try/js/config.js
cp examples/shanghai-ai/assets/characters/*.webp ../shanghai-ai-try/assets/characters/
node skills/one-day-date/scripts/validate.mjs ../shanghai-ai-try
node skills/one-day-date/scripts/serve.mjs ../shanghai-ai-try      # 打开显示的网址
```

模板的 `index.html` 已经和这份配置对应（中文、同样的标题、有 `transport` 表单字段）。validate 会提示日历上的日期已经过去：那是 2026 年 10 月的真实日期。
