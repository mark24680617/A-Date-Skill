#!/usr/bin/env node
// Check a date website folder for mistakes before previewing or deploying.
// Usage: node scripts/validate.mjs <site-folder>
// Exit code 1 when there are errors (✗). Warnings (⚠) are worth a look but don't block.
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import vm from 'node:vm';

const site = resolve(process.argv[2] || '.');
const errors = [], warnings = [], notes = [];
const err = (m) => errors.push(m), warn = (m) => warnings.push(m), ok = (m) => notes.push(m);
const read = (p) => readFileSync(join(site, p), 'utf8');
const has = (p) => p && existsSync(join(site, p));
const HEX = /^#[0-9a-f]{3}([0-9a-f]{3})?$/i;
// rough display width on the card: CJK / emoji ≈ 1, Latin ≈ 0.58 (same formula as main.js)
const units = (t) => [...String(t || '')].reduce((n, c) => n + (/[\u2E80-\uFFEF]|\p{Extended_Pictographic}/u.test(c) ? 1 : 0.58), 0);
const IDLE = ['stand', 'sleep', 'sit', 'cheers'];
const RESERVED = ['form-name', 'bot-field', 'verdict', 'date', 'diet', 'next', 'feedback', 'summary', 'at', 'id'];

function finish() {
  console.log(`Checking ${site}\n`);
  notes.forEach((m) => console.log('✓ ' + m));
  warnings.forEach((m) => console.log('⚠ ' + m));
  errors.forEach((m) => console.log('✗ ' + m));
  console.log(`\n${errors.length ? '✗' : '✓'} ${errors.length} error(s), ${warnings.length} warning(s)`);
  process.exit(errors.length ? 1 : 0);
}

for (const f of ['index.html', 'js/config.js', 'js/main.js', 'js/art.js', 'js/couple.js', 'js/sprite.js', 'css/style.css']) {
  if (!has(f)) err(`missing file ${f} — copy the template again (scripts/new-site.mjs)`);
}
if (errors.length) finish();

// ---- load config + scene art in a sandbox --------------------------------------------------
const ctx = vm.createContext({ console: { log() {}, warn() {}, info() {}, error() {} }, setTimeout() {}, clearTimeout() {} });
ctx.window = ctx;
try {
  vm.runInContext(read('js/config.js'), ctx, { filename: 'js/config.js' });
} catch (e) {
  err(`js/config.js has a syntax error: ${e.message}\n    ${(e.stack || '').split('\n').find((l) => l.includes('config.js')) || ''}`);
  finish();
}
const C = ctx.TRIP_CONFIG;
if (!C || typeof C !== 'object') { err('js/config.js must set window.TRIP_CONFIG = { … }'); finish(); }

const html = read('index.html');
const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"/g)].map((m) => m[1]);
try {
  vm.runInContext(read('js/art.js'), ctx, { filename: 'js/art.js' });
  for (const src of scriptSrcs.filter((s) => s.startsWith('js/scenes/'))) {
    if (!has(src)) { err(`index.html loads ${src}, but that file doesn't exist`); continue; }
    vm.runInContext(read(src), ctx, { filename: src });
  }
} catch (e) { err(`scene code failed to load: ${e.message}`); finish(); }
const sceneFiles = existsSync(join(site, 'js/scenes')) ? readdirSync(join(site, 'js/scenes')).filter((f) => f.endsWith('.js')) : [];
for (const f of sceneFiles) if (!scriptSrcs.includes('js/scenes/' + f)) warn(`js/scenes/${f} exists but index.html has no <script src="js/scenes/${f}"> — that background can't be used`);
const ART = ctx.TripArt && ctx.TripArt.scenes || {};
const BGS = Object.keys(ART);

// ---- top level -------------------------------------------------------------------------------
const lang = C.lang || 'zh-CN';
if (!C.title) err('title is empty');
const decode = (t) => String(t).replace(/&(amp|lt|gt|quot|#39|apos);/g, (m, e) => ({ amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'", apos: "'" })[e]);
const titleTag = (html.match(/<title>([^<]*)<\/title>/) || [])[1];
if (C.title && units(C.title) > 8.5) warn(`title "${C.title}" wraps onto two lines on the cover (big font) — fine if you like it; ≤ 8 Chinese/Japanese or ≤ 14 Latin characters keeps it on one`);
const coverLine = [C.date, (C.names || {}).a && (C.names || {}).b ? C.names.a + ' ♥ ' + C.names.b : ''].filter(Boolean).join('  ·  ');
if (units(coverLine) > 22) warn(`cover line "${coverLine}" (date · names) is long and wraps on phones — shorten date`);
((C.ending || {}).title || '').split('\n').forEach((l) => { if (units(l) > 12.5) warn(`ending.title line "${l}" is long — each line ≤ 12 Chinese/Japanese or ≤ 21 Latin characters; use \\n to break lines yourself`); });
if (C.title && titleTag !== undefined && decode(titleTag).trim() !== String(C.title).trim()) warn(`index.html <title> is "${titleTag}" but config title is "${C.title}" — update <title> and <meta name="description"> (they show in chat link previews)`);
const htmlLang = (html.match(/<html[^>]+lang="([^"]*)"/) || [])[1];
if (!htmlLang) warn('index.html <html> has no lang attribute');
else if (htmlLang.toLowerCase().split('-')[0] !== String(lang).toLowerCase().split('-')[0]) warn(`index.html has <html lang="${htmlLang}"> but config lang is '${lang}' — change it to <html lang="${lang}">`);
if (C.skyline && !['shanghai', 'generic', 'none'].includes(C.skyline)) err(`skyline must be 'shanghai', 'generic' or 'none' (got "${C.skyline}")`);
if (C.music && !has(C.music)) err(`music file not found: ${C.music} (use '' for no music)`);
else if (C.music && statSync(join(site, C.music)).size > 5e6) warn(`music file is ${(statSync(join(site, C.music)).size / 1e6).toFixed(1)} MB — large files load slowly on phones`);

// where answers go
const reply = (C.reply && C.reply.to) || 'netlify';
const formHTML = (html.match(/<form[^>]*name="trip-reply"[\s\S]*?<\/form>/) || [])[0] || '';
const formFields = [...formHTML.matchAll(/name="([^"]+)"/g)].map((m) => m[1]);
if (reply === 'netlify') {
  if (!/data-netlify="true"/.test(formHTML)) err('reply.to is "netlify" but index.html has no <form name="trip-reply" data-netlify="true"> — restore it from the template');
} else if (reply !== 'none' && !/^https?:\/\//.test(reply)) err(`reply.to must be 'netlify', 'none' or an https:// form endpoint (got "${reply}")`);

// characters
const ch = C.characters || {};
for (const k of ['walk', 'poses', 'idle']) {
  const s = ch[k];
  if (s && s.src) {
    if (!has(s.src)) err(`characters.${k}.src not found: ${s.src} (set src: '' to use the built-in couple)`);
    if (!(s.cols > 0 && s.rows > 0)) err(`characters.${k} needs cols and rows`);
    if (s.frames && s.cols * s.rows < s.frames) err(`characters.${k}: frames (${s.frames}) > cols × rows (${s.cols * s.rows})`);
  }
}
const poseNames = ch.poses && ch.poses.src ? (ch.poses.list || []).map((p) => p.name) : [];
if (ch.poses && ch.poses.src && ch.poses.frames && poseNames.length !== ch.poses.frames) warn(`characters.poses has ${ch.poses.frames} frames but ${poseNames.length} names in list`);
if (ch.coverPose && poseNames.length && !poseNames.includes(ch.coverPose)) err(`characters.coverPose "${ch.coverPose}" is not in poses.list`);
const bi = ch.builtin || {};
for (const who of ['a', 'b']) for (const [k, v] of Object.entries(bi[who] || {})) if (!HEX.test(v)) err(`characters.builtin.${who}.${k} should be a colour like '#AABBCC' (got "${v}")`);
if (ch.walk && ch.walk.src) ok(`characters: sprite sheets (${[ch.walk && ch.walk.src, ch.poses && ch.poses.src].filter(Boolean).join(', ')})`);
else ok('characters: built-in cartoon couple (no sprite sheets set)');

// ---- stops ---------------------------------------------------------------------------------
const S = Array.isArray(C.scenes) ? C.scenes : [];
if (!S.length) err('scenes is empty — add at least one stop');
if (S.length > 6) warn(`${S.length} stops — with more than 6, the top bar's stop icons crowd under the buttons on phones; merge some stops`);
const keys = new Set(), ids = new Set(), defaultSigns = [];
S.forEach((sc, i) => {
  const at = `stop ${i + 1}${sc.title ? ` (${sc.title})` : ''}`;
  if (!sc.title) err(`${at}: title is empty`);
  else if (units(sc.title) > 13) warn(`${at}: title is long for a phone (${String(sc.title).length} chars) — it wraps and pushes the card onto the couple; aim for ≤ 12 Chinese / ≤ 20 Latin characters`);
  if (sc.icon && /^[\u2600-\u27BF\u2B00-\u2BFF]$/.test(sc.icon)) warn(`${at}: icon '${sc.icon}' may render as a flat black glyph — add the emoji selector: '${sc.icon}\uFE0F'`);
  if (sc.id) { if (ids.has(sc.id)) err(`${at}: id "${sc.id}" is used twice`); ids.add(sc.id); }
  if (!sc.bg) err(`${at}: bg is missing. Built-in: ${BGS.join(', ')}`);
  else if (!ART[sc.bg]) err(`${at}: unknown bg "${sc.bg}". Built-in: ${BGS.join(', ')}`);
  if (sc.time && !/^\d{1,2}:\d{2}$/.test(sc.time)) warn(`${at}: time "${sc.time}" should look like 14:30`);
  if (sc.accent && !HEX.test(sc.accent)) err(`${at}: accent should be a colour like '#3FA7D6'`);
  if (sc.mood && !['day', 'sunset', 'night'].includes(sc.mood)) err(`${at}: mood must be 'day', 'sunset' or 'night'`);
  if (sc.bgImage && !has(sc.bgImage)) err(`${at}: bgImage not found: ${sc.bgImage}`);
  if (sc.tasks && !Array.isArray(sc.tasks)) err(`${at}: tasks must be a list ['…', '…']`);
  if (sc.tasks && sc.tasks.length > 6) warn(`${at}: ${sc.tasks.length} tasks — more than 5 crowds the card on phones`);
  if (sc.text && units(sc.text) > 62) warn(`${at}: text is long (${String(sc.text).length} chars) — on small phones the card covers the couple; aim for ≤ 60 Chinese / ≤ 105 Latin characters`);
  (sc.tasks || []).forEach((t) => { if (units(t) > 14) warn(`${at}: task "${t}" is long — each task should fit on half a row (≤ 12 Chinese / ≤ 24 Latin characters)`); });
  const idle = sc.idle || {};
  const type = idle.type || 'stand';
  if (!IDLE.includes(type)) err(`${at}: idle.type must be one of ${IDLE.join(', ')}`);
  if (type === 'sleep' && i !== 0) warn(`${at}: idle.type 'sleep' is meant for the first stop (bedroom)`);
  if (idle.pose && poseNames.length && !poseNames.includes(idle.pose)) err(`${at}: idle.pose "${idle.pose}" is not in characters.poses.list (${poseNames.join(', ')})`);
  if (idle.sprite && idle.sprite.src && !has(idle.sprite.src)) err(`${at}: idle.sprite.src not found: ${idle.sprite.src}`);
  // render the scene once to catch errors, learn whether it has a table, and see which default signs it paints
  if (ART[sc.bg]) {
    try {
      const log = ctx.TripArt.h.labelLog; if (log) log.length = 0;
      const art = ART[sc.bg](`v${i}-`, sc);
      if (log && log.length) {
        const seen = {};
        log.forEach((e) => { seen[e.key] = Array.isArray(e.value) ? e.value.join(', ') : e.value; });
        defaultSigns.push(`${at} · ${sc.bg}: ` + Object.entries(seen).map(([k, v]) => `${k}="${v}"`).join('  '));
      }
      const table = (art.layers || []).some((L) => L.prop === 'table');
      const wantsSit = ['restaurant', 'cafe', 'bistro'].includes(sc.bg);
      if (table && wantsSit && type !== 'sit') warn(`${at}: the "${sc.bg}" background has a table in front — use idle: { type: 'sit' } so the couple sits behind it`);
      if (!table && type === 'sit') warn(`${at}: idle.type 'sit' lowers the couple, but "${sc.bg}" has no table to hide their legs — use 'stand'`);
    } catch (e) { err(`${at}: the "${sc.bg}" background crashed with this config: ${e.message}`); }
  }
  if (sc.choice) {
    const c = sc.choice;
    if (!c.key || !/^[A-Za-z_][\w-]*$/.test(c.key)) err(`${at}: choice.key must be a simple name like 'transport'`);
    else {
      if (RESERVED.includes(c.key)) err(`${at}: choice.key "${c.key}" is reserved — pick another name`);
      if (keys.has(c.key)) warn(`${at}: choice.key "${c.key}" is used by two stops — the answers overwrite each other`);
      keys.add(c.key);
      if (reply === 'netlify' && !formFields.includes(c.key)) err(`${at}: add <input name="${c.key}"> to the hidden trip-reply form in index.html, or Netlify won't store this answer`);
    }
    const opts = c.options || [];
    if (opts.length < 2) err(`${at}: choice needs at least 2 options`);
    const oid = new Set();
    const nextName = S[i + 1] ? (S[i + 1].name || S[i + 1].title || '') : '';
    opts.forEach((o, k) => {
      if (!o.id || !o.label) err(`${at}: choice option ${k + 1} needs id and label`);
      if (o.travel) { const cap = /\{name\}/.test(o.travel) ? o.travel.replace('{name}', nextName) : o.travel + ' ' + nextName + ' …'; if (units(cap) > 21) warn(`${at}: walking caption "${cap}" is long for a phone — shorten option "${o.id}".travel or the next stop's name`); }
      if (oid.has(o.id)) err(`${at}: choice option id "${o.id}" is used twice`);
      oid.add(o.id);
    });
  }
  if (sc.diet && !Array.isArray(sc.diet.options)) err(`${at}: diet.options must be a list`);
});
ok(`${S.length} stops: ${S.map((s) => s.bg).join(' → ')}`);
if (defaultSigns.length) ok('signs painted with default text (set labels: { key: \'…\' } or \'\' to change/hide):\n    ' + defaultSigns.join('\n    '));

// leftover template text: the template is a Shanghai example
if ((C.skyline || 'generic') !== 'shanghai') {
  const src = read('js/config.js').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '');
  const hits = [...new Set((src.match(/上海|滨江|豫园|徐汇|黄浦|外滩|陆家嘴|城隍庙|本帮|Shanghai|West Bund/g) || []))];
  if (hits.length) warn(`config mentions ${hits.join(', ')} but skyline isn't 'shanghai' — leftover template text? (fine if the trip really is in Shanghai: then set skyline: 'shanghai')`);
}

// ---- wording for languages without built-in text ----
if (!/^(zh|en|ja)/i.test(lang)) {
  const mainSrc = read('js/main.js');
  const uiKeys = [...new Set([...(mainSrc.match(/var UI = \{([\s\S]*?)\n  \};/) || ['', ''])[1].matchAll(/(\w+): T\(/g)].map((m) => m[1]))];
  const missing = uiKeys.filter((k) => !(C.ui || {})[k]);
  if (missing.length) warn(`lang '${lang}' has no built-in wording, so these ui strings will show in English — set them in ui: { … }: ${missing.join(', ')}`);
}

// ---- date picker ----------------------------------------------------------------------------
const DP = C.datePick;
if (DP) {
  let dates = [];
  const iso = /^\d{4}-\d{2}-\d{2}$/;
  if (DP.dates) { dates = DP.dates; dates.forEach((d) => { if (!iso.test(d)) err(`datePick.dates: "${d}" should look like 2026-10-01`); }); }
  else if (DP.from || DP.to) { if (!iso.test(DP.from || '') || !iso.test(DP.to || '')) err('datePick.from / to should look like 2026-10-01'); else if (DP.from > DP.to) err('datePick.from is after datePick.to'); else dates = [DP.from, DP.to]; }
  else if (DP.year && DP.month && DP.days) dates = DP.days.map((d) => `${DP.year}-${String(DP.month).padStart(2, '0')}-${String(d).padStart(2, '0')}`);
  else err('datePick needs dates: [...], or from + to, or year + month + days — or delete datePick to skip the calendar');
  const today = new Date(); const t = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  if (dates.length && dates.every((d) => d < t)) warn('datePick: every date is in the past');
  const wd = (d) => { const [y, m, dd] = d.split('-').map(Number); return d + ' (' + ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(y, m - 1, dd).getDay()] + ')'; };
  if (dates.length) ok(`date picker: ${DP.from ? wd(DP.from) + ' → ' + wd(DP.to) : dates.map(wd).join(', ')} — check these weekdays match what the user said`);
} else ok('no date picker (datePick not set)');

// ---- privacy + leftovers ---------------------------------------------------------------------
const text = read('js/config.js');
if (/TODO|FIXME|\[\[|<<|>>/.test(text)) warn('js/config.js still contains TODO / placeholder markers');
if (/\b1[3-9]\d{9}\b|\+\d{8,}/.test(text)) warn('js/config.js seems to contain a phone number — the site is public, consider removing it');
if (/[\w.+-]+@[\w-]+\.[\w.]+/.test(text.replace(/formsubmit\.co\/[^'"]*|formspree\.io\/[^'"]*/g, ''))) warn('js/config.js contains an email address — the site is public');
const size = (function du(p) { const s = statSync(p); return s.isDirectory() ? readdirSync(p).reduce((a, f) => a + du(join(p, f)), 0) : s.size; })(site);
if (size > 20e6) warn(`the site folder is ${(size / 1e6).toFixed(1)} MB — compress images (webp) so it loads fast on phones`);
ok(`language: ${lang} · answers go to: ${reply}${reply === 'netlify' ? ' (Netlify Forms)' : ''} · size ${(size / 1e6).toFixed(1)} MB`);
finish();
