<div align="center">

# 💕 One-Day Date · 一日约会网站

**An AI-agent skill that turns your trip plan (and two photos) into a cute 3D-cartoon date website.**<br>
**一个 AI 智能体技能：把你们的行程（和两张照片）变成一个可爱的 3D 卡通约会网站。**

[English](#english) · [中文](#中文)

<img src="docs/screenshots/hero.jpg" alt="Phone screenshots: cover, a stop, the calendar and the ending" width="900">

</div>

---

## English

### What is this?

You give an AI agent (Claude Code, Codex, Cursor…) **your date plan**, plus **one photo of each of you** if you like. The agent builds and publishes a little website for your partner:

- **The cover** asks *"Ready?"*. The **"No"** button runs away and can never be tapped 🙃
- **Pick a date.** Your partner chooses the day on a calendar that only offers the dates you allow.
- **You two walk hand in hand** from stop to stop through hand-drawn scenes (home, city street, riverside, park, café, museum, beach, amusement park, restaurant, bistro, bar…). The clock and the progress bar advance as you go.
- **Every stop has a card**, with a sweet note and tiny missions to tick off. Tap the couple and they change pose and say something.
- **Questions along the way:** *how shall we get there?* (taxi / metro / bike), *anything you don't eat?*
- **The ending:** *"Where should we go next time?"*, then **Approve** ✅ or **I have suggestions** 💬. Their answers (date, choices, food, suggestions) arrive in your inbox or dashboard **once per run-through**.
- **It works everywhere:**
  - phone-first, background music, and the WeChat browser;
  - reachable from mainland China, because it uses no external fonts or CDNs;
  - all text in their language: Chinese and English built in, and any other language through the config.

**You don't need to know how to code.** The agent interviews you, drafts the itinerary if you don't have one, writes the site, checks it, and walks you through putting it online. That takes about 3 minutes with Netlify Drop, for free.

### What you need

| | |
|---|---|
| 🗺️ **A trip plan** | Paste your itinerary, or just say *"a day in Kyoto, we love food and temples"*, and the agent drafts one with you. |
| 📸 **Photos (optional)** | One clear photo of each of you, used to generate 3D-cartoon versions of you two (via ChatGPT, Gemini, Doubao… or the agent's own image tool). Without photos, a built-in cartoon couple is recoloured to match you. |
| 🤖 **An AI agent that can run commands** | Claude Code, OpenAI Codex, Cursor, Gemini CLI, Windsurf, Cline… Node.js 18+ is used for the checks and previews. |
| 🌐 **A free Netlify account** | To publish the site and receive the answers. Other hosts work too. |

### Quick start

**1. Install the skill.** Choose the option for your agent:

<details open>
<summary><b>Claude Code</b> (terminal, desktop app, or claude.ai/code)</summary>

```text
/plugin marketplace add mark24680617/one-day-date-skill
/plugin install one-day-date@one-day-date-skill
```

Or copy the folder by hand:

```bash
git clone https://github.com/mark24680617/one-day-date-skill
mkdir -p ~/.claude/skills && cp -r one-day-date-skill/skills/one-day-date ~/.claude/skills/
```
</details>

<details>
<summary><b>Claude.ai / Claude desktop app</b> (Skills)</summary>

1. Download [`one-day-date.zip`](https://github.com/mark24680617/one-day-date-skill/raw/main/dist/one-day-date.zip). It holds the `one-day-date` folder.
2. In **Settings → Capabilities**, turn on **Code execution and file creation**.
3. Open **Customize → Skills** and upload the zip.

In the web app, the site is built inside Claude's sandbox. You'll download the finished folder and drag it into Netlify Drop.
</details>

<details>
<summary><b>Codex, Cursor, Gemini CLI, Windsurf, Cline… (any agent)</b></summary>

```bash
git clone https://github.com/mark24680617/one-day-date-skill
cd one-day-date-skill
```

Open that folder with your agent and say *"Read skills/one-day-date/SKILL.md and follow it."* The repo's `AGENTS.md` points agents there automatically.
</details>

**2. Ask for your site.** For example:

> Use the one-day-date skill to make a date website for my girlfriend Mia. We're spending Saturday in Lisbon: pastéis for breakfast, the tram to Alfama, the LX Factory, sunset at Miradouro da Senhora do Monte, dinner in Bairro Alto. She reads English. Photos attached.

or simply:

> 帮我给女朋友做一个约会网站，下周六在杭州，你帮我安排行程。

**3. Answer the agent's few questions, look at the screenshots it shows you, and publish.** The agent tells you exactly where to click.

### How the answers reach you

By default the site uses **Netlify Forms**: turn on *form detection* once, and each submission appears under **Forms → trip-reply** (with optional email notifications). Hosting somewhere else? Point `reply.to` at Formspree or FormSubmit, or turn answers off. See [deploy.md](skills/one-day-date/references/deploy.md).

### Scenes

<img src="docs/screenshots/scenes.jpg" alt="The built-in background scenes" width="900">

Twelve hand-drawn parallax scenes. Most have **day / sunset / night** moods, and signs you can relabel (café name, menu, bridge name…). For a famous landmark, the agent can generate a background image instead. See [scenes.md](skills/one-day-date/references/scenes.md).

### Privacy

- **Your photos** stay on your computer. They only go to the image generator you choose.
- **The published site is public** to anyone with the link, and hidden from search engines (`noindex`). Keep addresses and phone numbers out of it.
- **Nothing is collected** except the one answer your partner submits, and it goes only to where you point it.

### For developers

```
skills/one-day-date/
├── SKILL.md                 ← the agent's instructions
├── scripts/                 new-site · validate · preview · serve  (Node 18+, no dependencies; preview uses Playwright if installed)
├── references/              interview, scenes, config, characters, backgrounds, deploy, troubleshooting
└── template/                the website: index.html, css/, js/ (main, art, couple, sprite, scenes/), assets/, tools/
examples/                    finished config.js examples (English seaside day, …)
tools/                       package.py (builds dist/one-day-date.zip) · screenshots.mjs (README images)
```

```bash
node skills/one-day-date/scripts/serve.mjs skills/one-day-date/template       # run the example site
node skills/one-day-date/scripts/validate.mjs skills/one-day-date/template    # check it
open http://localhost:8080/tools/scenes.html?moods=1                          # scene gallery
```

- **Plain JS.** No build step and no framework: ES5-friendly JavaScript and SVG.
- **Characters.** `js/sprite.js` keys out the green screen from AI sprite sheets, then aligns the frames on the feet and upper body.
- **Built-in couple.** `js/couple.js` draws it with a CSS walk cycle whose speed follows the ground.
- **Adding a scene.** See [`template/js/scenes/README.md`](skills/one-day-date/template/js/scenes/README.md). Contributions of new scenes are very welcome 💕

### License

[MIT](LICENSE). The bundled background music is an original piece generated by `tools/make-music.py`, and is free to use.

---

## 中文

<div align="center"><img src="docs/screenshots/hero-zh.jpg" alt="手机截图：封面、选交通方式、豫园、清吧、结尾盖章" width="900"></div>

### 这是什么？

把**你们的约会行程**，再加上**你们俩各一张照片**（可选），交给一个 AI 智能体（Claude Code、Codex、Cursor……），它会为你的另一半做好并发布一个小网站：

- **封面**问她「准备好了吗？」，**「不去了」**按钮会满屏乱跑，永远点不到 🙃
- **选日期**：日历上只有你允许的那几天能选。
- **你们俩牵着手**，一站一站走过手绘场景（家、街口、江边、公园、咖啡馆、美术馆、海边、游乐园、饭馆、西餐厅、清吧……），时钟和进度条会跟着走。
- **每一站一张卡片**，有写给她的话和可以打卡的小任务。点一下小人会换动作、冒一句话。
- **一路上的小问题**：「怎么去？」（打车 / 地铁 / 骑行），「有什么忌口？」
- **结尾**：「下一次我们去哪里？」，然后是**「准了」✅** 或 **「发表些建设性意见」💬**。她的所有回答（日期、选择、忌口、意见）**每走一遍只提交一次**，发到你的后台或邮箱。
- **哪里都能用**：
  - 手机优先，有背景音乐，微信内置浏览器也能打开；
  - 不依赖任何外网字体或 CDN，国内能打开；
  - 中英文内置，其他语言也可以。

**完全不需要会写代码。** 智能体会先问你几个问题；没有行程的话，它会帮你一起排。然后它写好网站、自己检查，再一步步教你发布上线（Netlify Drop 拖一下就好，免费，约 3 分钟）。

### 你需要准备

| | |
|---|---|
| 🗺️ **行程** | 直接贴你的攻略；或者只说「周六在杭州，她喜欢吃和拍照」，智能体会和你一起排。 |
| 📸 **照片（可选）** | 你们俩各一张清晰照片，用来生成 3D 卡通版的你们（用 ChatGPT、Gemini、豆包/即梦，或者智能体自带的生图工具）。没有照片也行：内置卡通小人会按你们的发色、衣服重新上色。 |
| 🤖 **一个能运行命令的 AI 智能体** | Claude Code、OpenAI Codex、Cursor、Gemini CLI、Windsurf、Cline……（检查和预览需要 Node.js 18+） |
| 🌐 **一个免费的 Netlify 账号** | 用来发布网站、接收她的回答。其他托管也可以。 |

### 快速开始

**1. 安装技能**，按你用的智能体选一种：

<details open>
<summary><b>Claude Code</b>（终端、桌面版或 claude.ai/code）</summary>

```text
/plugin marketplace add mark24680617/one-day-date-skill
/plugin install one-day-date@one-day-date-skill
```

或者手动复制：

```bash
git clone https://github.com/mark24680617/one-day-date-skill
mkdir -p ~/.claude/skills && cp -r one-day-date-skill/skills/one-day-date ~/.claude/skills/
```
</details>

<details>
<summary><b>Claude.ai / Claude 桌面版</b>（Skills）</summary>

1. 下载 [`one-day-date.zip`](https://github.com/mark24680617/one-day-date-skill/raw/main/dist/one-day-date.zip)（里面是 `one-day-date` 文件夹）。
2. 在 **设置 → Capabilities** 里开启 **Code execution and file creation**（代码执行）。
3. 打开 **Customize → Skills**，上传这个 zip。

网页版会在 Claude 的沙盒里做网站，做好后下载文件夹，再拖进 Netlify Drop 发布。
</details>

<details>
<summary><b>Codex、Cursor、Gemini CLI、Windsurf、Cline……（任何智能体）</b></summary>

```bash
git clone https://github.com/mark24680617/one-day-date-skill
cd one-day-date-skill
```

用智能体打开这个文件夹，对它说：「读一下 skills/one-day-date/SKILL.md，照着做。」（仓库里的 `AGENTS.md` 也会自动告诉它。）
</details>

**2. 告诉它你想要什么**，比如：

> 用 one-day-date 技能给我女朋友做一个约会网站。下周六我们在上海：睡个懒觉 → 徐汇滨江 → 傍晚去豫园 → 吃本帮菜 → 找个清吧。她看中文。照片附上。

或者更简单：

> 帮我给女朋友做一个约会网站，下周六在杭州，你帮我安排行程。

**3. 回答它的几个问题，看它发给你的截图，然后发布。** 在哪里点什么，它都会告诉你。

### 她的回答怎么到你手里？

默认用 **Netlify Forms**：在 Netlify 后台开一次「表单检测」（form detection），之后每条回答都会出现在 **Forms → trip-reply**，也可以设置邮件提醒。用别的托管？把 `reply.to` 改成 Formspree / FormSubmit 的地址，或者干脆关掉。详见 [deploy.md](skills/one-day-date/references/deploy.md)。

**她在国内的话：**
- Netlify 一般能打开（偶尔慢），Vercel / Cloudflare Pages 经常打不开；最稳的是腾讯云 CloudBase 静态托管（需要实名）。
- 微信常常拦截国外域名的链接：让她点右上角 **··· → 在浏览器打开**。

### 场景

<img src="docs/screenshots/scenes.jpg" alt="内置场景一览" width="900">

一共 12 个手绘视差场景。大多支持 **白天 / 傍晚 / 夜晚** 三种氛围，场景里的招牌文字也能改（咖啡馆名字、菜单、桥名……）。想要著名地标，可以让智能体生成一张背景图。详见 [scenes.md](skills/one-day-date/references/scenes.md)。

### 隐私

- **照片**只留在你的电脑上，只会发给你自己选的生图工具。
- **发布的网站**任何拿到链接的人都能打开（已设置不被搜索引擎收录）。别在里面写地址、电话。
- **除了她最后提交的那一条回答**，网站不收集任何东西，那一条也只发到你指定的地方。

### 开发者

目录结构见上面英文部分。模板是纯 HTML/CSS/JS，没有构建步骤。
- 新场景的写法见 [`template/js/scenes/README.md`](skills/one-day-date/template/js/scenes/README.md)。
- 提交前请跑一遍 `scripts/validate.mjs` 和 `scripts/preview.mjs`。
- 欢迎贡献新场景 💕

### 许可

[MIT](LICENSE)。自带的背景音乐是用 `tools/make-music.py` 生成的原创曲子，可以自由使用。
