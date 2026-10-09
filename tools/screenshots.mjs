#!/usr/bin/env node
// Regenerate the README images (needs Playwright).
//   node tools/screenshots.mjs
//
// Writes:
//   docs/screenshots/hero.jpg, hero-zh.jpg   the shanghai-ai example (characters from an image model)
//   docs/screenshots/fallback.jpg            the seaside-en example (the built-in cartoon couple)
//   docs/screenshots/scenes.jpg              every background scene
//   skills/one-day-date/references/example/from-sheet-to-site.jpg   the two sheets → the site
//   skills/one-day-date/references/scenes-overview.jpg, scenes-moods.jpg
//
// Every site screenshot is the skill's template with an example's config.js swapped in (page.route).
// The shanghai-ai sprite sheets are the real ones from examples/shanghai-ai/assets/characters/,
// published there with their author's permission. No other real person appears in these images.
import { createServer } from 'node:http';
import { readFile, stat, mkdir, mkdtemp, copyFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'docs/screenshots');
const REF = join(ROOT, 'skills/one-day-date/references');
const AI = join(ROOT, 'examples/shanghai-ai');
const TMP = await mkdtemp(join(tmpdir(), 'odd-shots-'));
await mkdir(OUT, { recursive: true });
await mkdir(join(REF, 'example'), { recursive: true });

function playwright() {
  try { return createRequire(import.meta.url)('playwright'); } catch {}
  const g = execSync('npm root -g').toString().trim();
  return createRequire(join(g, 'playwright', 'x.js'))(join(g, 'playwright'));
}
const { chromium } = playwright();

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml' };
const server = createServer(async (req, res) => {
  if (req.method === 'POST') { req.resume(); res.writeHead(200); return res.end('ok'); }
  try {
    let f = normalize(join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!f.startsWith(ROOT)) throw 0;
    if ((await stat(f)).isDirectory()) f = join(f, 'index.html');
    res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;
const SITE = BASE + '/skills/one-day-date/template/index.html';
const browser = await chromium.launch();
const problems = [];
let shotN = 0;

// Phone screenshots of the template with `example.config` as js/config.js and, if given,
// `example.characters` (a folder) answering the requests for assets/characters/*.
async function phone(example, steps) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push('pageerror: ' + e.message));
  page.on('response', (r) => { if (r.status() >= 400) problems.push(`${r.status()} ${r.url().replace(BASE, '')}`); });
  await page.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: example.config }));
  if (example.characters) {
    await page.route('**/assets/characters/*', (r) => {
      const f = join(example.characters, basename(new URL(r.request().url()).pathname));
      return existsSync(f) ? r.fulfill({ path: f }) : r.fulfill({ status: 404 });
    });
  }
  await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('odd-music', '"off"'); } catch (e) {} });
  const shots = [];
  for (const step of steps) {
    await step(page);
    const file = join(TMP, `phone-${++shotN}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
  }
  await ctx.close();
  return shots;
}
const wait = (p, ms) => p.waitForTimeout(ms);
// With sprite sheets, wait until they're keyed and showing (a big sheet takes a moment to process).
const sprites = (p, where) => p.waitForSelector(`${where} .couple-sprite:not([hidden])`, { state: 'attached', timeout: 15000 });
// Stop n (0 = the cover), then wait ms.
const open = async (p, n, ms, ai) => {
  await p.goto(SITE + (n ? '?scene=' + n : ''));
  if (ai) await sprites(p, n ? '#couple' : '#cover-couple');
  await wait(p, ms);
};
// From the last stop to the ending card, then approve it.
const goEnd = async (p, n, place, ai) => {
  await open(p, n, 1600, ai);
  await p.tap('#next-btn'); await wait(p, 4200);
  await p.fill('#next-place', place); await p.tap('#approve-btn'); await wait(p, 1700);
};
// The little hearts that float up every few seconds can land on a face: clear them for a stop shot.
const calm = (p) => p.evaluate(() => document.querySelectorAll('#hearts .heart').forEach((h) => h.remove()));
// Walk on from stop `from`, then pause the page's animation loop on a wide-stride frame of the walk
// sheet (feet spanning ≥ 85% of the frame), so the shot shows a real step, early in the walk while
// the background is still mostly the stop they're leaving.
const walking = async (p, from) => {
  await open(p, from, 1600, true);
  await p.tap('#next-btn');
  await p.evaluate(() => new Promise((done) => {
    const c = document.querySelector('#couple .couple-sprite'), g = c.getContext('2d', { willReadFrequently: true });
    const spread = () => {
      const h = Math.floor(c.height * 0.25), d = g.getImageData(0, c.height - h, c.width, h).data;
      let lo = c.width, hi = -1;
      for (let y = 0; y < h; y++) for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 128) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
      return (hi - lo) / c.width;
    };
    const raf = window.requestAnimationFrame.bind(window), t0 = performance.now();
    let frozen = false;
    window.requestAnimationFrame = (cb) => raf((ts) => {
      if (frozen) return;
      cb(ts);
      const t = performance.now() - t0;
      if ((t > 350 && spread() >= 0.85) || t > 2500) { frozen = true; done(); }
    });
  }));
  await calm(p);
};
const dataUrl = async (f) => `data:image/${extname(f).slice(1)};base64,` + (await readFile(f)).toString('base64');

// Render an HTML snippet whose content is in #wrap, cropped to #wrap, as a JPEG.
async function render(html, out, width, quality) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  await page.setContent(`<html><body style="margin:0;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">${html}</body></html>`);
  await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
  await page.waitForTimeout(200);
  const h = await page.evaluate(() => Math.ceil(document.getElementById('wrap').getBoundingClientRect().height));
  await page.setViewportSize({ width, height: h });
  await page.screenshot({ path: out, type: 'jpeg', quality });
  await ctx.close();
}
const BG = 'linear-gradient(135deg,#FFE3EC,#FFF4E0 55%,#E4F1FF)';
const PHONE = 'border-radius:34px;box-shadow:0 18px 40px rgba(90,40,70,.22),0 0 0 8px #fff';

// A row of phones with a caption underneath.
async function strip(files, out, caption, { width = 1800, phoneW = 320, gap = 26, size = 20 } = {}) {
  const imgs = await Promise.all(files.map(dataUrl));
  await render(`<div id="wrap" style="background:${BG}">
    <div style="display:flex;gap:${gap}px;justify-content:center;align-items:center;padding:${Math.round(phoneW / 8)}px 30px ${Math.round(phoneW / 13)}px">
      ${imgs.map((s) => `<img src="${s}" style="width:${phoneW}px;${PHONE}">`).join('')}
    </div><div style="text-align:center;color:#8C5A6E;font-size:${size}px;font-weight:700;padding:0 30px ${Math.round(size * 1.4)}px">${caption}</div></div>`, join(OUT, out), width, 86);
}

// ---- 1. the real site: characters from an image model (examples/shanghai-ai) ----
const ai = { config: await readFile(join(AI, 'config.js'), 'utf8'), characters: join(AI, 'assets/characters') };
const heroShots = await phone(ai, [
  async (p) => { await open(p, 0, 1400, true); },                                                                          // cover: "heart"
  async (p) => { await open(p, 2, 1200, true); await p.tap('.choice[data-id="taxi"]'); await wait(p, 1300); await calm(p); }, // transport choice: "stroll"
  async (p) => { await open(p, 4, 1800, true); await calm(p); },                                                           // Yu Garden: "piggyback"
  async (p) => { await open(p, 5, 1800, true); await calm(p); },                                                           // dinner: "chin"
  async (p) => { await goEnd(p, 6, '杭州', true); },                                                                       // stamped ending
]);
await strip(heroShots, 'hero.jpg', 'A real date site made with this skill — characters generated by an image model from two photos');
await strip(heroShots, 'hero-zh.jpg', '用这个技能做的真实约会网站 —— 人物由图像模型根据两张照片生成');

// ---- 2. from the two sheets to the site (references/example/from-sheet-to-site.jpg) ----
const [walkShot, poseShot, endShot] = await phone(ai, [
  async (p) => { await walking(p, 3); },                       // leaving the riverside for Yu Garden
  async (p) => { await open(p, 1, 1800, true); await calm(p); }, // bedroom: "hug"
  async (p) => { await goEnd(p, 6, '杭州', true); },
]);
const CAP = 'font-size:21px;font-weight:800;color:#6B4A5A;margin:0 0 10px 4px';
const sheet = (src, label) => `<figure style="margin:0"><figcaption style="${CAP}">${label}</figcaption>
  <img src="${src}" style="display:block;width:100%;border-radius:12px;box-shadow:0 8px 22px rgba(80,40,60,.18)"></figure>`;
const shot = (src, label) => `<figure style="margin:0;text-align:center"><img src="${src}" style="display:block;width:330px;${PHONE}">
  <figcaption style="margin-top:16px;font-size:16px;font-weight:700;color:#8C5A6E">${label}</figcaption></figure>`;
await render(`<div id="wrap" style="background:${BG};display:flex;gap:26px;padding:30px 36px 28px;align-items:stretch">
    <div style="width:540px;display:flex;flex-direction:column;justify-content:center;gap:22px">
      ${sheet(await dataUrl(join(AI, 'assets/characters/walk.webp')), '1. walk.webp from the image model')}
      ${sheet(await dataUrl(join(AI, 'assets/characters/poses.webp')), '2. poses.webp')}
    </div>
    <div style="align-self:center;font-size:54px;font-weight:900;color:#E86A92;padding:0 4px">→</div>
    <div>
      <div style="${CAP}">3. in the site</div>
      <div style="display:flex;gap:30px;padding:8px 8px 0">
        ${shot(await dataUrl(walkShot), 'walking: the walk cycle')}
        ${shot(await dataUrl(poseShot), 'at a stop: one of the poses')}
        ${shot(await dataUrl(endShot), 'the ending')}
      </div>
    </div>
  </div>`, join(REF, 'example/from-sheet-to-site.jpg'), 1800, 85);

// ---- 3. no image model: the built-in cartoon couple (examples/seaside-en) ----
const en = { config: await readFile(join(ROOT, 'examples/seaside-en/config.js'), 'utf8') };
const fbShots = await phone(en, [
  async (p) => { await open(p, 1, 1800); await calm(p); },                                                       // asleep in bed
  async (p) => { await open(p, 2, 1200); await p.tap('#card-tasks .choice'); await wait(p, 1000); await calm(p); }, // brunch choice
  async (p) => { await open(p, 3, 1800); await calm(p); },                                                       // beach
  async (p) => { await open(p, 4, 1800); await calm(p); },                                                       // pier fair at sunset
]);
await strip(fbShots, 'fallback.jpg', 'No image model available? A built-in cartoon couple fills in.', { width: 1200, phoneW: 250, gap: 22, size: 18 });

// ---- 4. scene gallery grid (docs/screenshots/scenes.jpg = references/scenes-overview.jpg) ----
const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
const scene = async (q, ms) => {
  await page.goto(BASE + '/skills/one-day-date/template/tools/scenes.html?guides=0&lang=en' + q);
  await page.waitForTimeout(ms);
  const f = join(TMP, `scene-${++shotN}.png`);
  await page.locator('.g-box').first().screenshot({ path: f });
  return dataUrl(f);
};
await page.goto(BASE + '/skills/one-day-date/template/tools/scenes.html?guides=0&lang=en');
await page.waitForTimeout(1200);
const names = await page.evaluate(() => Object.keys(window.TripArt.scenes));
const moodsFor = { park: 'day', cafe: 'day', museum: 'day', beach: 'sunset', amusement: 'night', bistro: 'night' };
const tiles = [];
for (const n of names) tiles.push([n, await scene(`&only=${n}${moodsFor[n] ? '&mood=' + moodsFor[n] : ''}`, 900)]);
// the six scenes that have moods, in day / sunset / night (references/scenes-moods.jpg)
const moodTiles = [];
for (const n of ['park', 'cafe', 'museum', 'beach', 'amusement', 'bistro']) {
  for (const m of ['day', 'sunset', 'night']) moodTiles.push([`${n} · ${m}`, await scene(`&only=${n}&mood=${m}`, 700)]);
}
await ctx.close();
await render(`<div id="wrap" style="background:#FFF7F2;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:26px">
  ${tiles.map(([n, s]) => `<figure style="margin:0"><img src="${s}" style="width:100%;border-radius:14px;box-shadow:0 6px 18px rgba(80,40,60,.16)"><figcaption style="text-align:center;font-weight:800;color:#6B4A5A;margin-top:6px;font-size:18px">${n}</figcaption></figure>`).join('')}
  </div>`, join(OUT, 'scenes.jpg'), 1500, 86);
await copyFile(join(OUT, 'scenes.jpg'), join(REF, 'scenes-overview.jpg'));
await render(`<div id="wrap" style="background:#FFF7F2;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:20px">
  ${moodTiles.map(([n, s]) => `<figure style="margin:0"><img src="${s}" style="width:100%;border-radius:10px"><figcaption style="text-align:center;font-weight:800;color:#6B4A5A;margin-top:4px;font-size:16px">${n}</figcaption></figure>`).join('')}
  </div>`, join(REF, 'scenes-moods.jpg'), 1500, 80);

await browser.close();
server.close();
await rm(TMP, { recursive: true, force: true });
const uniq = [...new Set(problems)];
if (uniq.length) console.error('Problems while taking screenshots:\n  ' + uniq.join('\n  '));
console.log(`✓ docs/screenshots/hero.jpg, hero-zh.jpg, fallback.jpg, scenes.jpg
✓ skills/one-day-date/references/example/from-sheet-to-site.jpg, scenes-overview.jpg, scenes-moods.jpg`);
process.exit(uniq.length ? 1 : 0);
