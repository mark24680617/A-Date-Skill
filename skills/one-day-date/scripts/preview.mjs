#!/usr/bin/env node
// See the site without a browser: screenshots of the cover and every stop, a full click-through
// (calendar → choices → diet → ending → approve) that prints exactly what would be submitted,
// and any JavaScript errors. Needs Playwright (npm i -D playwright, or a global install).
// Usage: node scripts/preview.mjs <site-folder> [--out <folder>] [--desktop] [--small] [--no-flow]
//   default output folder: <site-folder>-preview next to the site (not inside it, so it never gets deployed)
//   --desktop  also 1440×900 screenshots        --small  also 375×603 (small phone / WeChat with toolbar)
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { extname, join, normalize, resolve, basename, dirname } from 'node:path';

const args = process.argv.slice(2);
const site = resolve(args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--out') || '.');
const outArg = args.indexOf('--out');
const out = resolve(outArg >= 0 ? args[outArg + 1] : join(dirname(site), basename(site) + '-preview'));
const desktop = args.includes('--desktop');
const small = args.includes('--small');
const flow = !args.includes('--no-flow');

function findPlaywright() {
  const req = createRequire(join(site, 'package.json'));
  for (const name of ['playwright', 'playwright-core', '@playwright/test']) {
    try { return req(name); } catch {}
  }
  try {
    const root = execSync('npm root -g', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
    for (const name of ['playwright', 'playwright-core', '@playwright/test']) {
      if (existsSync(join(root, name))) return createRequire(join(root, name, 'x.js'))(join(root, name));
    }
  } catch {}
  return null;
}
const pw = findPlaywright();
if (!pw) {
  console.log(`Playwright isn't installed, so no screenshots.
Preview by hand instead:  node ${join(dirname(new URL(import.meta.url).pathname), 'serve.mjs')} ${site}
(or install it: npm i -g playwright && npx playwright install chromium)`);
  process.exit(0);
}

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const server = createServer(async (req, res) => {
  if (req.method === 'POST') { req.resume(); res.writeHead(200); return res.end('ok'); }
  try {
    let file = normalize(join(site, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!file.startsWith(site)) throw 0;
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    res.writeHead(200, { 'Content-Type': types[extname(file).toLowerCase()] || 'application/octet-stream' });
    res.end(await readFile(file));
  } catch { res.writeHead(404); res.end(); }
});
await new Promise((r) => server.listen(0, r));
const base = `http://localhost:${server.address().port}/`;
await mkdir(out, { recursive: true });

const browser = await (pw.chromium || pw.default.chromium).launch();
const problems = [];
const shots = [];
async function run(label, viewport, mobile) {
  const ctx = await browser.newContext({ viewport, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: mobile ? 2 : 1 });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => problems.push(`[${label}] ${e.message}`));
  page.on('console', (m) => { if (m.type() === 'error' || (m.type() === 'warning' && /\[trip\]|\[sprite\]/.test(m.text()))) problems.push(`[${label}] ${m.text()}`); });
  page.on('requestfailed', (r) => problems.push(`[${label}] failed to load ${r.url().replace(base, '')}`));
  page.on('response', (r) => { if (r.status() === 404) problems.push(`[${label}] 404 ${r.url().replace(base, '')}`); });
  await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto(base); await page.waitForTimeout(1500);
  const f0 = join(out, `${label}-0-cover.png`); await page.screenshot({ path: f0 }); shots.push(f0);
  const n = await page.evaluate(() => (window.TRIP_CONFIG.scenes || []).length);
  for (let i = 1; i <= n; i++) {
    await page.goto(base + '?scene=' + i); await page.waitForTimeout(1800);
    const f = join(out, `${label}-${i}.png`); await page.screenshot({ path: f }); shots.push(f);
  }
  await ctx.close();
}
await run('phone', { width: 390, height: 844 }, true);
if (small) await run('small', { width: 375, height: 603 }, true);
if (desktop) await run('desktop', { width: 1440, height: 900 }, false);

// ---- click through the whole thing like she would, and capture the submission ----
let submitted = null;
if (flow) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const posts = [];
  page.on('pageerror', (e) => problems.push(`[flow] ${e.message}`));
  page.on('request', (r) => { if (r.method() === 'POST') posts.push({ url: r.url(), body: r.postData() || '' }); });
  await page.addInitScript(() => { try { localStorage.clear(); } catch (e) {} });
  const shot = async (name) => { const f = join(out, `flow-${name}.png`); await page.screenshot({ path: f }); shots.push(f); };
  const visible = (sel) => page.evaluate((s) => { const el = document.querySelector(s); return !!el && !el.hidden && el.offsetParent !== null; }, sel);
  try {
    await page.goto(base); await page.waitForTimeout(1200);
    await page.tap('#start-btn'); await page.waitForTimeout(900);
    if (await visible('#datepick')) {
      await shot('1-calendar');
      await page.tap('#cal-grid .cal-day.ok', { force: true }); await page.waitForTimeout(300);
      await page.tap('#date-go'); await page.waitForTimeout(800);
    }
    const n = await page.evaluate(() => window.TRIP_CONFIG.scenes.length);
    for (let i = 0; i < n; i++) {
      if (await page.$('#card-tasks .choice')) {
        await page.tap('#card-tasks .choice'); await page.waitForTimeout(700);
        await shot(`2-stop${i + 1}-choice`);
      }
      if (await page.$('#diet-open')) {
        await page.tap('#diet-open'); await page.waitForTimeout(700);
        await shot(`3-stop${i + 1}-diet`);
        await page.tap('#diet-chips .chip'); await page.waitForTimeout(200);
        await page.tap('#diet-send'); await page.waitForTimeout(1600);
      }
      await page.tap('#next-btn');
      if (i < n - 1) { await page.waitForTimeout(1300); await shot(`2-walk-to-${i + 2}`); await page.waitForTimeout(2900); }
      else await page.waitForTimeout(2500);
    }
    if (await visible('#ending')) {
      await page.fill('#next-place', 'test');
      await shot('4-ending');
      await page.tap('#approve-btn'); await page.waitForTimeout(1800);
      await shot('5-approved');
    } else problems.push('[flow] never reached the ending card');
  } catch (e) { problems.push(`[flow] stopped early: ${e.message.split('\n')[0]}`); }
  submitted = posts;
  await ctx.close();
}
await browser.close();
server.close();
console.log(`Screenshots → ${out}\n  ${shots.map((s) => basename(s)).join('  ')}`);
if (submitted) {
  if (!submitted.length) console.log('\nClick-through: nothing was submitted (reply.to is "none", or the flow stopped early).');
  submitted.forEach((p) => {
    const f = Object.fromEntries(new URLSearchParams(p.body));
    console.log(`\nClick-through (simulated: first date, first option of each choice, first diet chip, next="test") submitted once to ${p.url.startsWith(base) ? '/ (Netlify Forms on the live site)' : p.url}:`);
    Object.entries(f).forEach(([k, v]) => { if (!['form-name', 'bot-field'].includes(k)) console.log(`  ${k.padEnd(10)} ${v}`); });
  });
  if (submitted.length > 1) problems.push(`[flow] submitted ${submitted.length} times — expected once`);
}
const uniq = [...new Set(problems)];
console.log(uniq.length ? `\nProblems (${uniq.length}):\n  ` + uniq.join('\n  ') : '\nNo JavaScript errors.');
process.exit(uniq.some((p) => !/404|failed to load/.test(p)) ? 1 : 0);
