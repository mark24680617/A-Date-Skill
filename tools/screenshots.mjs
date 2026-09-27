#!/usr/bin/env node
// Regenerate the README images in docs/screenshots/ (needs Playwright).
//   node tools/screenshots.mjs
// Uses the built-in cartoon couple only, so no real person appears in the repo.
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TPL = join(ROOT, 'skills/one-day-date/template');
const OUT = join(ROOT, 'docs/screenshots');
await mkdir(OUT, { recursive: true });

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
    if ((await stat(f)).isDirectory()) f = join(f, 'index.html');
    res.writeHead(200, { 'Content-Type': types[extname(f)] || 'application/octet-stream' });
    res.end(await readFile(f));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const BASE = `http://localhost:${server.address().port}`;
const SITE = BASE + '/skills/one-day-date/template/index.html';
const browser = await chromium.launch();

async function phone(config, steps) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  if (config) await page.route('**/js/config.js', (r) => r.fulfill({ contentType: 'text/javascript', body: config }));
  await page.addInitScript(() => { try { localStorage.clear(); localStorage.setItem('odd-music', '"off"'); } catch (e) {} });
  const shots = [];
  for (const [i, step] of steps.entries()) {
    await step(page);
    const file = join(OUT, `_tmp-${Date.now()}-${i}.png`);
    await page.screenshot({ path: file });
    shots.push(file);
  }
  await ctx.close();
  return shots;
}
const wait = (p, ms) => p.waitForTimeout(ms);
const goEnd = async (p, n, place) => {
  await p.goto(SITE + '?scene=' + n); await wait(p, 1600);
  await p.tap('#next-btn'); await wait(p, 4200);
  await p.fill('#next-place', place); await p.tap('#approve-btn'); await wait(p, 1700);
};

const en = await readFile(join(ROOT, 'examples/seaside-en/config.js'), 'utf8');
const enShots = await phone(en, [
  async (p) => { await p.goto(SITE); await wait(p, 1500); },
  async (p) => { await p.tap('#start-btn'); await wait(p, 900); await p.tap('.cal-day.ok >> nth=0', { force: true }); await wait(p, 700); },
  async (p) => { await p.goto(SITE + '?scene=3'); await wait(p, 1800); },
  async (p) => { await p.goto(SITE + '?scene=4'); await wait(p, 1800); },
  async (p) => { await goEnd(p, 5, 'Tokyo'); },
]);
const zhShots = await phone(null, [
  async (p) => { await p.goto(SITE); await wait(p, 1500); },
  async (p) => { await p.goto(SITE + '?scene=2'); await wait(p, 1500); await p.tap('.choice[data-id="taxi"]'); await wait(p, 2200); },
  async (p) => { await p.goto(SITE + '?scene=4'); await wait(p, 1800); },
  async (p) => { await p.goto(SITE + '?scene=6'); await wait(p, 1800); },
  async (p) => { await goEnd(p, 6, '杭州'); },
]);

async function strip(files, out, caption) {
  const ctx = await browser.newContext({ viewport: { width: 1800, height: 900 }, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const imgs = await Promise.all(files.map(async (f) => 'data:image/png;base64,' + (await readFile(f)).toString('base64')));
  await page.setContent(`<html><body style="margin:0;font-family:system-ui"><div id="wrap" style="background:linear-gradient(135deg,#FFE3EC,#FFF4E0 55%,#E4F1FF)">
    <div style="display:flex;gap:26px;justify-content:center;align-items:center;padding:40px 30px 24px">
      ${imgs.map((s) => `<img src="${s}" style="width:320px;border-radius:34px;box-shadow:0 18px 40px rgba(90,40,70,.22),0 0 0 8px #fff">`).join('')}
    </div><div style="text-align:center;color:#8C5A6E;font-size:20px;font-weight:700;padding-bottom:28px">${caption}</div></div></body></html>`);
  await page.waitForTimeout(300);
  const h = await page.evaluate(() => Math.ceil(document.getElementById('wrap').getBoundingClientRect().height));
  await page.setViewportSize({ width: 1800, height: h });
  await page.screenshot({ path: join(OUT, out), type: 'jpeg', quality: 86 });
  await ctx.close();
}
await strip(enShots, 'hero.jpg', 'Cover with a runaway “Nope” · pick a date · walk from stop to stop · approve at the end');
await strip(zhShots, 'hero-zh.jpg', '封面（“不去了”点不到）· 选交通方式 · 一站一站走 · 最后盖章“准了”');

// scene gallery grid
const ctx = await browser.newContext({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(BASE + '/skills/one-day-date/template/tools/scenes.html?guides=0&lang=en');
await page.waitForTimeout(1200);
const names = await page.evaluate(() => Object.keys(window.TripArt.scenes));
const moodsFor = { park: 'day', cafe: 'day', museum: 'day', beach: 'sunset', amusement: 'night', bistro: 'night' };
const tiles = [];
for (const n of names) {
  await page.goto(BASE + `/skills/one-day-date/template/tools/scenes.html?guides=0&lang=en&only=${n}${moodsFor[n] ? '&mood=' + moodsFor[n] : ''}`);
  await page.waitForTimeout(900);
  const f = join(OUT, `_tmp-scene-${n}.png`);
  await page.locator('.g-box').first().screenshot({ path: f });
  tiles.push([n, 'data:image/png;base64,' + (await readFile(f)).toString('base64')]);
}
await page.setContent(`<html><body style="margin:0;font-family:system-ui">
  <div id="wrap" style="background:#FFF7F2;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;padding:26px">
  ${tiles.map(([n, s]) => `<figure style="margin:0"><img src="${s}" style="width:100%;border-radius:14px;box-shadow:0 6px 18px rgba(80,40,60,.16)"><figcaption style="text-align:center;font-weight:800;color:#6B4A5A;margin-top:6px;font-size:18px">${n}</figcaption></figure>`).join('')}
  </div></body></html>`);
await page.waitForTimeout(300);
const h = await page.evaluate(() => Math.ceil(document.getElementById('wrap').getBoundingClientRect().height));
await page.setViewportSize({ width: 1500, height: h });
await page.screenshot({ path: join(OUT, 'scenes.jpg'), type: 'jpeg', quality: 86 });
// the six scenes that have moods, in day / sunset / night (for references/scenes-moods.jpg)
const moodTiles = [];
for (const n of ['park', 'cafe', 'museum', 'beach', 'amusement', 'bistro']) {
  for (const m of ['day', 'sunset', 'night']) {
    await page.setViewportSize({ width: 1500, height: 900 });
    await page.goto(BASE + `/skills/one-day-date/template/tools/scenes.html?guides=0&lang=en&only=${n}&mood=${m}`);
    await page.waitForTimeout(700);
    const f = join(OUT, `_tmp-mood-${n}-${m}.png`);
    await page.locator('.g-box').first().screenshot({ path: f });
    moodTiles.push([`${n} · ${m}`, 'data:image/png;base64,' + (await readFile(f)).toString('base64')]);
  }
}
await page.setContent(`<html><body style="margin:0;font-family:system-ui">
  <div id="wrap" style="background:#FFF7F2;display:grid;grid-template-columns:repeat(3,1fr);gap:14px;padding:20px">
  ${moodTiles.map(([n, s]) => `<figure style="margin:0"><img src="${s}" style="width:100%;border-radius:10px"><figcaption style="text-align:center;font-weight:800;color:#6B4A5A;margin-top:4px;font-size:16px">${n}</figcaption></figure>`).join('')}
  </div></body></html>`);
await page.waitForTimeout(300);
const h2 = await page.evaluate(() => Math.ceil(document.getElementById('wrap').getBoundingClientRect().height));
await page.setViewportSize({ width: 1500, height: h2 });
const REF = join(ROOT, 'skills/one-day-date/references');
await page.screenshot({ path: join(REF, 'scenes-moods.jpg'), type: 'jpeg', quality: 80 });
execSync(`cp ${join(OUT, 'scenes.jpg')} ${join(REF, 'scenes-overview.jpg')}`);
await ctx.close();
await browser.close();
server.close();
execSync(`rm -f ${join(OUT, '_tmp-')}*`);
console.log('✓ docs/screenshots/hero.jpg, hero-zh.jpg, scenes.jpg + references/scenes-overview.jpg, scenes-moods.jpg');
