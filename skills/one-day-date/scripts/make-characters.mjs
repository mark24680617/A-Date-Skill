#!/usr/bin/env node
// Generate the couple's sprite sheets with an image model, using the user's own API key,
// and save them into a site's assets/characters/. Zero dependencies, Node 18+.
//
//   node scripts/make-characters.mjs --site <site-folder> --photo1 left.jpg --photo2 right.jpg \
//        --outfit1 "a cream sweater and jeans" --outfit2 "a pink dress"
//   node scripts/make-characters.mjs --site <site> --describe1 "short dark curly hair" --describe2 "long red hair"
//   node scripts/make-characters.mjs --site <site> ... --dry-run     # prompts + request, nothing sent
//
// Run with --help for every option. The prompts are the ones in references/characters.md; keep both in sync.
// Exit codes: 0 every sheet made · 1 something failed (✗ lines say what to do) · 2 no API key (prompts printed
// so the user can generate the sheets in ChatGPT / Gemini / 豆包 instead).
// A sheet takes 30 s – 4 min: run it with a long command timeout (~10 min) or in the background. Each ✓ line is
// printed as soon as that sheet is saved.
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync, accessSync, constants as fsc } from 'node:fs';
import { resolve, join, basename, dirname, relative, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));

// ---- prompt templates: identical wording to references/characters.md ---------------------------------
export const SHEETS = {
  walk: {
    cols: 3, rows: 2, frames: 6, loop: true,
    action: 'walking to the right in a three-quarter side view, holding hands between them, in one complete walk cycle — contact, down, passing, up for each leg — with their free arms swinging naturally and a slight up-and-down bob; frames 3 and 6 are the passing poses with the legs almost together',
  },
  poses: {
    cols: 3, rows: 2, frames: 6, loop: false,
    action: 'six different sweet still poses rather than an animation, in this order: standing holding hands; a hug with one of them lifting a foot; making a heart shape with their hands together; strolling hand in hand; one giving the other a piggyback ride with a V sign; squatting side by side with their chins resting on their hands',
  },
  idle: {
    cols: 2, rows: 2, frames: 4, loop: true,
    action: 'standing hand in hand, turned slightly toward the viewer, gently swaying and breathing, glancing at each other and smiling, with one blink',
  },
  cheers: {
    cols: 2, rows: 2, frames: 4, loop: true,
    action: 'standing side by side, each holding a drink, raising them and clinking gently, then smiling at each other',
  },
  dinner: {
    cols: 2, rows: 2, frames: 4, loop: true,
    action: 'seated side by side on low stools with no table, turned slightly toward the viewer; one feeds the other a bite with a fork/chopsticks and they lean in happily',
  },
};
export const KEYS = { green: '#00FF00', magenta: '#FF00FF', blue: '#0000FF' };
const STYLE = 'stylise them with slightly bigger heads (about 1:3 head-to-body), large expressive eyes, soft rounded shapes, smooth matte skin and warm, soft studio lighting';
const CLOTHES = /hoodie|shirt|dress|jeans|trousers|pants|skirt|sweater|jumper|jacket|coat|suit|shorts|sneakers|trainers|shoes|boots|blouse|cardigan|hat|cap|scarf|uniform|衣|裤|裙|鞋|帽/i;

// who = { photos: 0 | 1 | 2, describe1, describe2, outfit1, outfit2 }
export function buildPrompt(sheet, who, keyName) {
  const s = SHEETS[sheet];
  const hex = KEYS[keyName];
  const d1 = (who.describe1 || '').trim().replace(/[.;]+$/, '');
  const d2 = (who.describe2 || '').trim().replace(/[.;]+$/, '');
  let o1 = (who.outfit1 || '').trim().replace(/[.;]+$/, '');
  let o2 = (who.outfit2 || '').trim().replace(/[.;]+$/, '');
  let intro;
  if (who.photos === 2) {
    if (!o1) o1 = 'the outfit from photo 1';
    if (!o2) o2 = 'the outfit from photo 2';
    intro = `Using the two attached photos as reference (photo 1 is the person on the left, photo 2 is the person on the right), create a 3D animated-movie version of this couple in a Pixar-style cartoon look: keep their faces, hairstyles and hair colours recognisable, but ${STYLE}.`;
  } else if (who.photos === 1) {
    if (!o1) o1 = 'their outfit from the photo';
    if (!o2) o2 = 'their outfit from the photo';
    intro = `Using the attached photo of the two of them as reference (whoever is on the left in the photo stays on the left), create a 3D animated-movie version of this couple in a Pixar-style cartoon look: keep their faces, hairstyles and hair colours recognisable, but ${STYLE}.`;
  } else {
    if (!o1) o1 = CLOTHES.test(d1) ? 'the clothes described above' : 'a casual date outfit';
    if (!o2) o2 = CLOTHES.test(d2) ? 'the clothes described above' : 'a casual date outfit';
    intro = `Create a 3D animated-movie version of a couple in a Pixar-style cartoon look. The person on the left: ${d1}. The person on the right: ${d2}. ${STYLE[0].toUpperCase() + STYLE.slice(1)}.`;
  }
  const extra = who.photos && (d1 || d2)
    ? ` Extra details — ${[d1 && 'the person on the left: ' + d1, d2 && 'the person on the right: ' + d2].filter(Boolean).join('; ')}.`
    : '';
  const p1 = `${intro}${extra} The person on the left wears ${o1}; the person on the right wears ${o2} — nothing ${keyName} on either of them. Show both full-body at the same scale, ${s.action}. The characters, outfits, colours, proportions, lighting and camera angle must be identical in every frame, as if every frame were rendered from the same animation rig.`;
  const p2 = `Lay it out as a clean animation sprite sheet on a 1536×1024 landscape canvas: a grid of ${s.cols} columns × ${s.rows} rows equal cells holding ${s.frames} frames, read left-to-right then top-to-bottom, ${s.loop ? 'that loop seamlessly' : 'each a separate pose'}. Centre the couple in each cell with their feet on the same baseline near the bottom of the cell, filling about 80% of the cell height, and leave clear empty space between cells so nothing touches or crosses a cell edge. The background must be one flat, pure chroma-key ${keyName} (${hex}) everywhere — no floor, no cast shadows, no gradient, no grid lines, borders, frame numbers, text or watermark.`;
  return p1 + '\n\n' + p2;
}

// ---- providers ------------------------------------------------------------------------------------------
// Defaults, checked October 2026:
// · OpenAI: gpt-image-2 is the model behind the example sheets (references/example/). Only if this key can't use it
//   (no access, not found, organization not verified) does the script fall back to gpt-image-1.5. Newer models such
//   as gpt-image-2.5 variants are opt-in with --model: they may be early-access or premium on some accounts.
// · Gemini: per the Gemini API changelog (seen through search results; the page itself wasn't reachable when this was
//   checked), gemini-nano-banana-2.1 became generally available on 2026-10-06 and gemini-3.1-flash-image is deprecated
//   in its favour (gemini-3.1-flash-image reported shutdown 2026-10-29; after that it answers "not found" and the
//   script moves on to the next model); gemini-3.1-flash-image and gemini-3-pro-image have been GA since 2026-05-28.
//   2.1 is days old and may reach some accounts or regions later, hence the two GA fallbacks: a 404 / "not found"
//   for one model just moves on to the next.
// Without --model, a model this key can't use falls through to the next one. A rejected request field (size,
// quality, --param …) never does: the script stops and says which field was rejected, because switching models
// would hide the real problem behind a silent downgrade.
export const PROVIDERS = {
  openai: {
    label: 'OpenAI',
    env: ['OPENAI_API_KEY'],
    baseEnv: 'OPENAI_BASE_URL',
    base: 'https://api.openai.com/v1',
    models: ['gpt-image-2', 'gpt-image-1.5'],
    size: '1536x1024',
    keyPage: 'https://platform.openai.com/api-keys',
  },
  gemini: {
    label: 'Google Gemini',
    env: ['GEMINI_API_KEY', 'GOOGLE_API_KEY'],
    baseEnv: 'GEMINI_BASE_URL',
    base: 'https://generativelanguage.googleapis.com',
    models: ['gemini-nano-banana-2.1', 'gemini-3.1-flash-image', 'gemini-3-pro-image'],
    size: '2K',
    keyPage: 'https://aistudio.google.com/apikey',
  },
};
// Node's fetch gives up waiting for response headers after about 300 s, whatever the signal says
export const MAX_TIMEOUT_S = 290;
const GEMINI_PHOTO_BYTES = 14e6; // raw bytes; base64 adds a third, and a request may be at most ~20 MB

// paths in printed commands: quoted when they hold spaces or other shell characters
export function q(p) {
  const s = String(p);
  if ((process.platform === 'win32' ? /^[\w@%+=:,./\\-]+$/ : /^[\w@%+=:,./-]+$/).test(s)) return s;
  return '"' + (process.platform === 'win32' ? s : s.replace(/(["$`\\])/g, '\\$1')) + '"';
}

const USAGE = `Generate the couple's sprite sheets with an image model, using the user's API key.

  node ${q(fileURLToPath(import.meta.url))} --site <site-folder> [options]

Who they are (photos give the best likeness; descriptions alone still beat the built-in couple):
  --photo1 <file> --photo2 <file>   photo of the person on the left / on the right (jpg, png, webp; heic for gemini)
  --photo <file>                    or one photo showing both of them (left stays left)
  --describe1 "<text>"              the left person: hair, skin tone, glasses, build… (required without photos)
  --describe2 "<text>"              the right person
  --outfit1 "<text>" --outfit2 "<text>"   what they'll wear on the date (recommended)

What to make:
  --sheets walk,poses     any of: walk, poses, idle, cheers, dinner, all (default: walk,poses)
  --key-colour auto       green | magenta | blue. auto = green, or magenta when an outfit (or eye colour) is green

Image service:
  --provider openai|gemini  default: whichever key is set (OPENAI_API_KEY, else GEMINI_API_KEY / GOOGLE_API_KEY)
  --model <id>            default: openai ${PROVIDERS.openai.models[0]}, gemini ${PROVIDERS.gemini.models[0]}. Without --model, if the key
                          can't use it: openai ${PROVIDERS.openai.models.slice(1).join(', ')}; gemini ${PROVIDERS.gemini.models.slice(1).join(', ')}.
                          Newer models (e.g. gpt-image-2.5 variants) only with --model: they may be
                          early-access or premium
  --quality <q>           openai only: low | medium | high | auto (default high), or another level if your model
                          supports it; none = don't send it (for compatible services that reject it)
  --size <s>              openai: WIDTHxHEIGHT (default ${PROVIDERS.openai.size}) · gemini: 1K | 2K | 4K (default ${PROVIDERS.gemini.size})
  --param key=value       extra request field, repeatable (gemini: a path inside generationConfig,
                          e.g. --param imageConfig.imageSize=4K). Not model, prompt, image, contents, n,
                          stream or response_format. A rejected field stops the run (no model switch)
  --timeout <seconds>     per image, 1–${MAX_TIMEOUT_S} (default ${MAX_TIMEOUT_S}; Node can't wait longer). After a timeout the
                          remaining sheets are skipped: re-run with --sheets and the ones that are missing
  env OPENAI_BASE_URL / GEMINI_BASE_URL   a proxy or a compatible service (just the address: no user:password@, no ?query)
  env OPENAI_ORG_ID / OPENAI_PROJECT_ID   optional OpenAI headers

Other:
  --dry-run               print the prompts and the request (key hidden); send nothing, write nothing
  --overwrite             replace assets/characters/<sheet>.png (default: keep it, write <sheet>-2.png)

A sheet takes 30 s – 4 min. Run this with a long command timeout (~10 min) or in the background: each ✓ line
is printed as soon as that sheet is saved. For more than two sheets, run it in the background, or one --sheets at a time.
Exit codes: 0 all sheets made · 1 something failed · 2 no API key (prompts printed for an image app)`;

// ---- small helpers ----------------------------------------------------------------------------------------
const KB = (n) => (n >= 1e6 ? (n / 1e6).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1e3)) + ' KB');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let SECRETS = [];
const KEY_ENVS = [...new Set(Object.values(PROVIDERS).flatMap((P) => P.env))];
// every key in the environment, so redact() hides it even in errors printed before a provider is picked
const envSecrets = () => KEY_ENVS.flatMap((n) => [process.env[n] || '', (process.env[n] || '').trim()]).filter((k) => k.length >= 6);
// For HTTP / error text only (never the prompts printed for the user): hides the exact keys from the environment and
// tokens shaped like credentials (Bearer + 20 or more characters, sk-…, AIza…, a key in a URL query); nothing else.
export function redact(s) {
  let t = String(s);
  for (const k of [...new Set(SECRETS)].sort((a, b) => b.length - a.length)) if (k && k.length >= 6) t = t.split(k).join('***');
  return t
    .replace(/\bBearer\s+(?!<)\S{20,}/gi, 'Bearer ***')
    .replace(/\bsk-[A-Za-z0-9_\-*]{16,}/g, 'sk-***')
    .replace(/\bAIza[0-9A-Za-z_\-]{20,}/g, 'AIza***')
    .replace(/([?&](?:key|api[_-]?key|access_token)=)[^&\s"']+/gi, '$1***');
}
// whether to echo a value the user typed: stricter than redact(), since nothing is lost by not echoing it
const looksSecret = (v) => redact(v) !== v || /\bsk-[\w-]{6,}|\bAIza[\w-]{10,}|\bbearer\s/i.test(v) || /^[A-Za-z0-9_\-]{30,}$/.test(v);
// a user value inside a message: only short, plain ones; anything else is not echoed at all
const shown = (v) => (/^[\w .,:+\-#/]{1,40}$/.test(String(v)) && !looksSecret(String(v)) ? `"${v}"` : '(value not shown)');
const say = (...a) => console.log(a.join(' ')); // status lines and prompts: printed as they are
const sayErr = (...a) => console.log(redact(a.join(' '))); // ✗ lines carry API / error text
// paths in messages and commands: relative to where this runs when inside it, else absolute
export function pathFor(p) {
  const r = relative(process.cwd(), p);
  return r && !r.startsWith('..') && !isAbsolute(r) ? r : resolve(p);
}
const indent = (t, n = 4) => String(t).split('\n').map((l) => ' '.repeat(n) + l).join('\n');
// let stdout / stderr drain before exiting (pipes are asynchronous on macOS)
const exitWith = (code) => new Promise((r) => process.stdout.write('', () => process.stderr.write('', r))).then(() => process.exit(code));

// Detects PNG / JPEG / WebP / HEIC and reads the size where it can. Never throws: a short or broken buffer is null.
export function imageInfo(buf) {
  try {
    if (!buf || buf.length < 16) return null;
    if (buf.readUInt32BE(0) === 0x89504e47) {
      if (buf.length < 24) return null; // the IHDR width / height end at byte 24
      return { ext: 'png', mime: 'image/png', w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
    }
    if (buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) { i++; continue; }
        const m = buf[i + 1];
        if (m === 0xff || m === 0x01 || (m >= 0xd0 && m <= 0xd9)) { i += m === 0xff ? 1 : 2; continue; } // fill byte / markers without a length
        if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc) return { ext: 'jpg', mime: 'image/jpeg', h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
        i += 2 + buf.readUInt16BE(i + 2);
      }
      return { ext: 'jpg', mime: 'image/jpeg' };
    }
    if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') {
      const f = buf.toString('latin1', 12, 16), r = { ext: 'webp', mime: 'image/webp' };
      if (f === 'VP8X') return buf.length >= 30 ? { ...r, w: 1 + buf.readUIntLE(24, 3), h: 1 + buf.readUIntLE(27, 3) } : null;
      if (f === 'VP8L') { if (buf.length < 25) return null; const b = buf.readUInt32LE(21); return { ...r, w: (b & 0x3fff) + 1, h: ((b >>> 14) & 0x3fff) + 1 }; }
      if (f === 'VP8 ') return buf.length >= 30 ? { ...r, w: buf.readUInt16LE(26) & 0x3fff, h: buf.readUInt16LE(28) & 0x3fff } : null;
      return r;
    }
    const brand = buf.toString('latin1', 4, 12);
    if (/^ftyp(heic|heix|hevc|hevx|heim|heis)/.test(brand)) return { ext: 'heic', mime: 'image/heic' };
    if (/^ftyp(mif1|msf1|heif)/.test(brand)) return { ext: 'heic', mime: 'image/heif' };
    return null;
  } catch {
    return null;
  }
}

const BOOL_FLAGS = new Set(['dry-run', 'overwrite', 'help']);
const VALUE_OPTS = new Set(['site', 'provider', 'photo', 'photo1', 'photo2', 'describe1', 'describe2', 'outfit1', 'outfit2', 'sheets', 'key-colour', 'key-color', 'model', 'quality', 'size', 'param', 'timeout']);
export function parseArgs(argv) {
  const o = { params: [] };
  let prev = null; // the option just read, for a helpful message about a stray value after it
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-h') { o.help = true; prev = null; continue; }
    if (!a.startsWith('--') || a === '--') {
      // never echo the stray value: a pasted key ends up here as easily as a word of an unquoted description
      if (prev && BOOL_FLAGS.has(prev)) throw new Error(`--${prev} takes no value, but a value follows it (not shown). Write --${prev} on its own, or leave it out.`);
      if (prev) {
        const eg = /^outfit/.test(prev) ? 'a cream sweater and jeans' : /^describe/.test(prev) ? 'short dark curly hair, round glasses' : prev === 'site' ? 'our date site' : /^photo/.test(prev) ? 'My Photos/left person.jpg' : 'two words';
        throw new Error(`an extra value after --${prev} (not shown, in case it's a secret). A value with spaces needs quotes, e.g. --${prev} "${eg}".`);
      }
      throw new Error(`unexpected argument #${i + 1} (not shown, in case it's a secret): options start with --`);
    }
    const eq = a.indexOf('=');
    const k = eq > 2 ? a.slice(2, eq) : a.slice(2);
    let v = eq > 2 ? a.slice(eq + 1) : undefined;
    if (!BOOL_FLAGS.has(k) && !VALUE_OPTS.has(k)) {
      throw new Error(/^[a-z][a-z0-9-]{0,24}$/i.test(k) && !looksSecret(k) ? `unknown option --${k}` : 'unknown option (not shown, in case it\'s a secret)');
    }
    if (BOOL_FLAGS.has(k)) {
      if (v !== undefined) throw new Error(`--${k} takes no value (got --${k}=…). Write --${k} on its own, or leave it out.`);
      o[k] = true;
      prev = k;
      continue;
    }
    if (v === undefined) {
      v = argv[++i];
      if (v === undefined || (v.startsWith('--') && v.length > 2)) throw new Error(`--${k} needs a value`);
    }
    if (k === 'param') {
      const pk = (/^([^=]*)=/.exec(v) || [])[1];
      if (!pk || !/^[A-Za-z_][\w.\-[\]]*$/.test(pk)) throw new Error('--param needs key=value, e.g. --param imageConfig.imageSize=4K (gemini) or --param background=opaque (openai)');
      const base = pk.replace(/^generationConfig\./i, '');
      if (/^(model|prompt|image(\[\])?|contents)$/i.test(base)) throw new Error(`--param can't set ${base}: use --model, or the options for the photos and descriptions`);
      if (/^(n|stream|response_format|candidate_?count)$/i.test(base)) {
        throw new Error(`--param can't set ${base}: the script asks for one complete image per sheet and reads it from the answer (${/^(n|candidate_?count)$/i.test(base) ? 'one sheet per request, and extra images would be billed but unused' : /^stream$/i.test(base) ? 'no streaming' : 'GPT image models always return base64'})`);
      }
      o.params.push(v);
    } else o[k === 'key-color' ? 'key-colour' : k] = v;
    prev = k;
  }
  return o;
}

function setPath(obj, path, value) {
  const keys = path.split('.');
  let t = obj;
  for (const k of keys.slice(0, -1)) t = t[k] = t[k] && typeof t[k] === 'object' ? t[k] : {};
  t[keys[keys.length - 1]] = value;
}
const parseValue = (v) => (/^(true|false|null|-?\d+(\.\d+)?)$/.test(v) || /^[[{"]/.test(v) ? (() => { try { return JSON.parse(v); } catch { return v; } })() : v);

// --size: Gemini wants an upper-case K ("2K"), OpenAI a lower-case x ("1536x1024")
export function normalizeSize(size, provider) {
  const P = PROVIDERS[provider];
  if (size === undefined || size === null || String(size).trim() === '') return { size: P.size };
  const s = String(size).trim();
  const wh = /^(\d+)\s*[x×*]\s*(\d+)$/i.exec(s);
  if (provider === 'gemini') {
    const k = /^(\d+)\s*k$/i.exec(s), px = /^(\d+)\s*px$/i.exec(s);
    if (k) return { size: k[1] + 'K' };
    if (px) return { size: px[1] + 'px' };
    return { size: P.size, note: `· --size ${shown(s)} ${wh ? 'is an OpenAI size' : "isn't a Gemini size"}; Gemini takes 1K | 2K | 4K, so using ${P.size}` };
  }
  if (/^auto$/i.test(s)) return { size: 'auto' };
  if (wh) return { size: `${wh[1]}x${wh[2]}` };
  return { size: P.size, note: `· --size ${shown(s)} ${/^\d+\s*(k|px)$/i.test(s) ? 'is a Gemini size' : "isn't an OpenAI size"}; OpenAI takes WIDTHxHEIGHT, so using ${P.size}` };
}

// a key that can't be real: it would fail as a confusing "network" error (fetch rejects such header values)
export function keyProblem(key) {
  if (/[^\x21-\x7e]/.test(key)) return 'contains a space, a line break or a non-ASCII character (like … or •)';
  if (/\*{3,}|\.{3}/.test(key)) return 'looks shortened or masked (it contains *** or ...)';
  return '';
}
const keyMessage = (name, problem, P) => `${name} ${problem}, so it can't be the real key. Did you copy a masked key (the dashboard shows keys like sk-…abcd after creating them) or some text around it? Copy the whole key again from ${P.keyPage} (or create a new one), set ${name} again, and run this again.`;

// ---- base URLs: shown without user:password@ or ?query, and refused when they carry credentials --------------
function rawBase(provider) {
  const P = PROVIDERS[provider];
  return (process.env[P.baseEnv] || '').trim() || P.base;
}
function baseUrl(provider) { return rawBase(provider).replace(/\/+$/, ''); }
export function showUrl(u) {
  try { const x = new URL(u); return `${x.protocol}//${x.host}${x.pathname === '/' ? '' : x.pathname}`; } catch { return '(an invalid URL)'; }
}
const hostOf = (u) => { try { return new URL(u).host; } catch { return '(an invalid URL)'; } };
export function baseProblem(provider) {
  const P = PROVIDERS[provider];
  const raw = (process.env[P.baseEnv] || '').trim();
  if (!raw) return '';
  let u;
  try { u = new URL(raw); } catch { return `${P.baseEnv} isn't a valid URL (value not shown). Set it to just the address, like ${P.base}, or unset it.`; }
  if (!/^https?:$/.test(u.protocol)) return `${P.baseEnv} must start with https:// (or http:// for a local proxy); now ${u.protocol}//…`;
  if (u.username || u.password) return `${P.baseEnv} contains a user name or password (…://user:password@host). Remove them: the script never sends credentials in a URL, and the key belongs in ${P.env[0]}. Now: ${showUrl(raw)} with credentials.`;
  if (u.search || u.hash) return `${P.baseEnv} has a ?query or #fragment (not shown: it may hold a secret). Give just the address, like ${P.base}; the key belongs in ${P.env[0]}.`;
  return '';
}

// ---- errors -----------------------------------------------------------------------------------------------
class GenError extends Error {
  constructor(kind, message, { status = 0, hint = '', fatal = false, fallback = false, retryMs = 0, field = '' } = {}) {
    super(message);
    Object.assign(this, { kind, status, hint, fatal, fallback, retryMs, field });
  }
}

const UNDICI_TIMEOUTS = new Set(['UND_ERR_HEADERS_TIMEOUT', 'UND_ERR_BODY_TIMEOUT']);
// ctx = { provider, timeoutS, elapsedMs }
export function networkError(e, url, ctx = {}) {
  const c = (e && e.cause) || {};
  const host = hostOf(url);
  if (e && (e.name === 'TimeoutError' || e.name === 'AbortError' || UNDICI_TIMEOUTS.has(c.code) || UNDICI_TIMEOUTS.has(e.code))) {
    const secs = Math.round((ctx.elapsedMs || (ctx.timeoutS || MAX_TIMEOUT_S) * 1000) / 1000);
    return new GenError('timeout', `no answer from ${host} after ${secs} s`, {
      fatal: true, // the next sheet would most likely wait just as long
      hint: [
        'Image models can be slow, and this one did not answer in time.',
        ctx.timeoutS && ctx.timeoutS < MAX_TIMEOUT_S ? `Raise --timeout (up to ${MAX_TIMEOUT_S}), or run again later.` : 'Run again later (it is often a busy moment).',
        ctx.provider === 'openai' ? '--quality medium is faster.' : '',
        'A timed-out image may still be billed.',
      ].filter(Boolean).join(' '),
    });
  }
  // a header value fetch refuses (a key or OPENAI_ORG_ID with spaces / non-ASCII): not a network problem
  if (e instanceof TypeError && /header|ByteString/i.test(String(e.message))) {
    return new GenError('auth', `a request header was refused before sending: ${redact(e.message)}`, {
      fatal: true, hint: 'The API key (or OPENAI_ORG_ID / OPENAI_PROJECT_ID) contains spaces or non-ASCII characters. Copy it again in full.',
    });
  }
  const detail = (c.message && c.code && c.message.includes(c.code) ? c.message : [c.code, c.message].filter(Boolean).join(': ')) || (e && e.message) || 'network error';
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy;
  return new GenError('network', `couldn't reach ${host} (${redact(detail)})`, {
    fatal: true,
    hint: [
      'The network or a firewall blocks this service, or the computer is offline. OpenAI and Gemini are not reachable from mainland China without a VPN.',
      proxy && !process.env.NODE_USE_ENV_PROXY ? 'A proxy is set (HTTPS_PROXY): run again with NODE_USE_ENV_PROXY=1 in front (Node 22.21+ / 24+) so Node uses it.' : '',
      'Otherwise: hand the user the prompts (--dry-run prints them) for ChatGPT / Gemini / 豆包 / 即梦.',
    ].filter(Boolean).join(' '),
  });
}

const PARAM_CODES = new Set(['unsupported_parameter', 'invalid_value', 'unknown_parameter', 'invalid_parameter', 'unsupported_value', 'invalid_type']);
const MODEL_ACCESS = /not allowed to sample from (this|the) model|do(es)?n'?t have access to (the )?model|do(es)? not have access to (the )?model|must be verified to use (the )?model|model\b[^.]{0,120}\b(does not exist|doesn't exist|not found|is not supported for generateContent|is not available|no longer available|has been (deprecated|shut ?down|retired|discontinued))|\b(unknown|invalid|no such|unsupported) model\b|\bmodels\/\S+ is not found/i;
// Gemini errors name no field: a message about a size, an aspect ratio or another setting is a rejected field
const GEMINI_SETTING = /image[_ ]?size|aspect[_ ]?ratio|\bsize\b|resolution|param(eter)?s?\b|generation[_ ]?config|image[_ ]?config|response[_ ]?modalit|candidate[_ ]?count|thinking[_ ]?config|invalid value|unknown name|cannot find field|\bfield\b/i;
const GEMINI_MODEL_ACCESS = /no longer available|has been (deprecated|shut ?down|retired|discontinued)|not supported for generateContent|\bmodels?\b[^.]{0,120}\bnot found\b|\bnot found\b[^.]{0,60}\bmodel|do(es)?(n'?t| not) have (access|permission) to|permission to access|verif/i;

// Is this error "this key can't use this model" (fine to try an older model), and not a rejected parameter?
export function isModelAccess({ status, code = '', param = '', msg = '', model = '', provider = '' }) {
  if (![400, 403, 404, 422].includes(status)) return false;
  const p = param == null ? '' : String(param);
  if (p === 'model') return true;
  if (p) return false; // the API named another field: never a silent downgrade
  if (PARAM_CODES.has(String(code))) return false; // e.g. quality / size / input_fidelity
  if (String(code) === 'model_not_found') return true;
  if (provider === 'gemini') {
    // only "not found", "not supported for generateContent", no access or verification count; never a setting
    if (GEMINI_SETTING.test(msg)) return false;
    if (GEMINI_MODEL_ACCESS.test(msg)) return true;
    return status === 404 && ((model && msg.includes(model)) || /\bmodels?\b/i.test(msg));
  }
  // compatible services (OPENAI_BASE_URL) may name no param: a message about a setting isn't model access
  if (/\b(quality|size|background|output[_ ]?format|input[_ ]?fidelity|moderation|parameter)\b/i.test(msg) && !/\bmodel\b[^.]{0,40}\b(not found|does not exist|doesn't exist)\b/i.test(msg)) return false;
  if (MODEL_ACCESS.test(msg)) return true;
  return status === 404 && ((model && msg.includes(model)) || /\bmodel\b/i.test(msg));
}

// Which request field an error is about: the API's param, a field path or name in the message, or the value it
// quotes. sent = { field: { value, from } } for what was sent; '' when the answer doesn't say.
export function rejectedField(err, msg, sent = {}) {
  const norm = (f) => String(f).replace(/^generation_?config\./i, '').replace(/_/g, '').toLowerCase();
  const known = (f) => Object.keys(sent).find((k) => norm(k) === norm(f)) || String(f).replace(/^generation_?config\./i, '');
  if (err && err.param && err.param !== 'model') return known(err.param);
  let m = /Invalid value at '([^']+)'/i.exec(msg)
    || /(?:Unknown|Unsupported|Unrecognized|Invalid) (?:parameter|field|argument)s?:? '([^']+)'/i.exec(msg)
    || /Invalid type for '([^']+)'/i.exec(msg);
  if (m) return known(m[1]);
  m = /Unknown name "([^"]+)"(?: at '([^']+)')?/i.exec(msg);
  if (m) return known(m[2] ? `${m[2]}.${m[1]}` : m[1]);
  m = /Invalid value: '([^']*)'/i.exec(msg);
  if (m) { const k = Object.keys(sent).find((x) => !/^(model|prompt)$/.test(x) && String(sent[x].value) === m[1]); if (k) return k; }
  const named = Object.keys(sent).filter((k) => !/^(model|prompt|n)$/.test(k) && new RegExp(`\\b${k.split('.').pop().replace(/\W/g, '')}\\b`, 'i').test(msg));
  return named.length === 1 ? named[0] : '';
}

// Turn an HTTP error into what happened + what to do next. sent: see rejectedField().
export function apiError(provider, model, status, body, text, headers, sent = {}) {
  const err = (body && typeof body.error === 'object' && body.error) || {};
  const msg = redact(String(err.message || (typeof body?.error === 'string' ? body.error : '') || body?.message || text || '').replace(/\s+/g, ' ').trim().slice(0, 400)) || '(no message)';
  const code = String(err.code ?? '');
  const gstatus = String(err.status || '');
  const reasons = (Array.isArray(err.details) ? err.details : []).map((d) => d && d.reason).filter(Boolean);
  const P = PROVIDERS[provider];
  const where = `${status}${gstatus ? ' ' + gstatus : code && !/^\d+$/.test(code) ? ' ' + code : ''}`;
  const base = `${P.label} answered ${where}: ${msg}`;
  const all = msg + ' ' + code + ' ' + reasons.join(' ');
  const retry = (() => {
    const h = headers && headers.get && headers.get('retry-after');
    if (h && !isNaN(+h)) return +h * 1000;
    const d = (Array.isArray(err.details) ? err.details : []).find((x) => x && x.retryDelay);
    if (d) return parseFloat(d.retryDelay) * 1000;
    return 0;
  })();
  const quotaHint = provider === 'openai'
    ? 'No credit left on this OpenAI account, or its billing limit was reached: add billing credit or raise the limit at platform.openai.com/settings/organization/billing.'
    : 'Quota used up, or billing is off. Gemini image models need a billing-enabled project (aistudio.google.com) or the daily free quota to reset.';

  if (status === 401 || reasons.includes('API_KEY_INVALID') || code === 'invalid_api_key') {
    return new GenError('auth', base, { status, fatal: true, hint: `The API key was rejected. Check it is complete, active and a ${P.label} key (${P.keyPage}).` });
  }
  if (status === 413 || /payload size exceeds|request entity too large|request too large|exceeds the maximum (request|payload) size/i.test(all)) {
    return new GenError('toolarge', base, { status, fatal: true, hint: 'The request is too large: the photos are too big. Resize them to about 1600 px on the long side (macOS: sips -Z 1600 photo.jpg; Python PIL: img.thumbnail((1600,1600))).' });
  }
  if (status !== 429 && /billing|hard.?limit|insufficient_quota|exceeded your current quota|out of credit/i.test(all)) {
    return new GenError('quota', base, { status, fatal: true, hint: quotaHint });
  }
  if (gstatus === 'FAILED_PRECONDITION' || /location is not supported|region,? or territory not supported|not available in your (country|region)|unsupported_country/i.test(all)) {
    return new GenError('region', base, { status, fatal: true, hint: 'The service is not available from this location. Use the other provider, or let the user generate the sheets in an app (豆包 / 即梦 work in mainland China).' });
  }
  if (isModelAccess({ status, code, param: err.param, msg, model, provider })) {
    const verify = /verif/i.test(msg);
    return new GenError('model', base, {
      status, fallback: true,
      hint: verify
        ? `OpenAI needs a verified organization for ${model}: platform.openai.com/settings/organization/general → Verify Organization, then wait a few minutes. Or use --provider gemini.`
        : `This key can't use ${model} (or it doesn't make images). Pick another with --model (see --help), or check the account's model access.`,
    });
  }
  if (status === 404) {
    return new GenError('notfound', base, { status, fatal: true, hint: `Wrong address or model. Check --model and ${P.baseEnv} (now ${showUrl(baseUrl(provider))}).` });
  }
  if (status === 403) {
    const verify = /verif/i.test(msg);
    return new GenError('forbidden', base, {
      status, fatal: true,
      hint: verify
        ? 'OpenAI needs a verified organization for GPT Image models: platform.openai.com/settings/organization/general → Verify Organization, then wait a few minutes. Or use --provider gemini.'
        : `This key isn't allowed to do this (restricted key, API not enabled, or region). Create a fresh key at ${P.keyPage}.`,
    });
  }
  if ((status === 400 || status === 422) && (/moderation|safety|content.?polic|policy|prohibited|blocked/i.test(all))) {
    return new GenError('refused', base, { status, hint: 'The safety filter refused this sheet. Photos of real people and close poses (hug, piggyback) sometimes trip it: run again (it varies), soften the action, try the other provider, or let the user generate it in an app.' });
  }
  if (status === 429) {
    // "limit: 0" = this model has no free tier: waiting won't help, even when the API suggests a retry delay
    const quota = /limit: 0\b/.test(msg) || (/insufficient_quota|billing|hard.?limit|exceeded your current quota|credit/i.test(all) && !(retry && retry <= 60000));
    if (quota) return new GenError('quota', base, { status, fatal: true, hint: quotaHint });
    return new GenError('rate', base, { status, retryMs: retry || 15000, hint: 'Too many requests. Wait a minute and run again for the failed sheets (--sheets ...).' });
  }
  if (status >= 500) {
    return new GenError('server', base, { status, retryMs: retry || 3000, hint: 'The service had a problem. Run again in a minute (--sheets with just the failed ones).' });
  }
  // not JSON at all (an HTML error page): something between us and the API answered, not the API
  if (!body && status >= 400 && status < 500) {
    return new GenError('badresponse', base, {
      status, fatal: true,
      hint: `That answer isn't from the ${P.label} API (no JSON error). A proxy, firewall or captive portal answered instead: check ${provider === 'openai' ? 'OPENAI_BASE_URL' : 'GEMINI_BASE_URL'} (unset it to use the official endpoint) and the network.`,
    });
  }
  // a rejected field: every sheet would be rejected the same way, and another model would only hide it
  const field = rejectedField(err, msg, sent);
  const f = field && sent[field];
  const fieldName = field && /^[\w.\-[\]]{1,60}$/.test(field) ? field : field ? '(name not shown)' : '';
  const which = fieldName
    ? `${fieldName}${f ? ` (sent ${shown(Array.isArray(f.value) ? f.value.join(',') : f.value)}, ${f.from ? 'from ' + f.from : 'set by the script'})` : ''}`
    : "the answer doesn't name it (see the message)";
  const todo = f && f.from
    ? `Change or drop ${f.from}${f.from === '--quality' ? ' (--quality none sends no quality)' : ''}, or try another --model.`
    : f ? `The script sets it by default for ${model}: try ${field === 'quality' ? '--quality none (sends no quality), ' : /size/i.test(field) ? 'another --size, ' : ''}another --model or the other --provider.` : 'Try without --size / --quality / --param, or another --model.';
  return new GenError('request', base, {
    status, fatal: true, field: fieldName,
    hint: `A request field was rejected: ${which}. Not a model problem: the script stops here and never switches models for that. ${todo}`,
  });
}

// ---- requests ---------------------------------------------------------------------------------------------
function endpoint(provider, model, withPhotos) {
  const b = baseUrl(provider);
  if (provider === 'openai') return `${b}/images/${withPhotos ? 'edits' : 'generations'}`;
  const v = /\/v1(beta|alpha)?\d*$/.test(b) ? '' : '/v1beta';
  return `${b}${v}/models/${encodeURIComponent(model)}:generateContent`;
}
// input_fidelity: "high | low on gpt-image-1 and gpt-image-1.5 … For gpt-image-2, omit this parameter."
const wantsFidelity = (model) => /^gpt-image-1(\.5)?(-20\d\d-\d\d-\d\d)?$/.test(model);

function openaiRequest(o, model, prompt, photos) {
  const fields = { model, prompt, n: '1', size: o.size || PROVIDERS.openai.size, quality: o.quality || 'high' };
  if (o.quality === 'none') delete fields.quality;
  if (photos.length && wantsFidelity(model)) fields.input_fidelity = 'high';
  for (const p of o.params) { const [k, v] = p.split(/=(.*)/s); fields[k] = v; }
  return { fields, photos };
}
function geminiRequest(o, model, prompt, photos) {
  const generationConfig = { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '3:2', imageSize: o.size || PROVIDERS.gemini.size } };
  for (const p of o.params) { const [k, v] = p.split(/=(.*)/s); setPath(generationConfig, k.replace(/^generationConfig\./, ''), parseValue(v)); }
  const parts = [{ text: prompt }, ...photos.map((ph) => ({ inlineData: { mimeType: ph.mime, data: ph.buf.toString('base64') } }))];
  return { body: { contents: [{ role: 'user', parts }], generationConfig } };
}

function describeRequest(provider, model, o, prompt, photos, keyEnv) {
  const url = endpoint(provider, model, photos.length > 0);
  const lines = [`POST ${showUrl(url)}`];
  if (provider === 'openai') {
    const { fields } = openaiRequest(o, model, prompt, photos);
    lines.push(`  Authorization: Bearer <${keyEnv}, hidden>`);
    lines.push(`  Content-Type: ${photos.length ? 'multipart/form-data' : 'application/json'}`);
    for (const [k, v] of Object.entries(fields)) lines.push(`  ${k}: ${k === 'prompt' ? `<prompt below, ${v.length} chars>` : v}`);
    for (const ph of photos) lines.push(`  image[]: @${basename(ph.path)} (${ph.missing ? 'not found here' : ph.mime + ', ' + KB(ph.buf.length)})`);
  } else {
    const { body } = geminiRequest(o, model, prompt, photos);
    lines.push(`  x-goog-api-key: <${keyEnv}, hidden>`, '  Content-Type: application/json');
    let i = 0;
    const shownBody = JSON.parse(JSON.stringify(body, (k, v) => {
      if (k === 'text' && typeof v === 'string') return `<prompt below, ${v.length} chars>`;
      if (k === 'data' && typeof v === 'string') { const ph = photos[i++]; return `<base64 of ${basename(ph.path)}, ${ph.missing ? 'not found here' : KB(ph.buf.length)}>`; }
      return v;
    }));
    lines.push(indent(JSON.stringify(shownBody, null, 2), 2));
  }
  return lines.join('\n');
}

async function send(url, init, ctx) {
  const t0 = Date.now();
  let res;
  try {
    res = await fetch(url, { ...init, signal: AbortSignal.timeout(ctx.timeoutS * 1000) });
  } catch (e) {
    throw networkError(e, url, { ...ctx, elapsedMs: Date.now() - t0 });
  }
  let raw;
  try { raw = Buffer.from(await res.arrayBuffer()); } catch (e) { throw networkError(e, url, { ...ctx, elapsedMs: Date.now() - t0 }); }
  const type = res.headers.get('content-type') || '';
  let body = null;
  if (/json/.test(type) || /^\s*[{[]/.test(raw.toString('utf8', 0, 20))) { try { body = JSON.parse(raw.toString('utf8')); } catch { /* not JSON */ } }
  return { res, raw, type, body, text: body ? '' : raw.toString('utf8', 0, 300) };
}

// what a request sends, field by field, and which option set each one: to say which field an error is about
function sentFields(provider, o, fields) {
  const paramKeys = new Set(o.params.map((p) => p.split('=')[0].replace(/^generationConfig\./i, '')));
  const flat = (obj, pre = '') => Object.entries(obj).flatMap(([k, v]) => (v && typeof v === 'object' && !Array.isArray(v) ? flat(v, pre + k + '.') : [[pre + k, v]]));
  const out = {};
  for (const [k, value] of flat(fields)) {
    const from = paramKeys.has(k) ? `--param ${k}`
      : k === 'model' ? (o.model ? '--model' : '')
      : k === 'quality' ? (o.quality !== undefined ? '--quality' : '')
      : (k === 'size' || k === 'imageConfig.imageSize') ? (o.size !== undefined ? '--size' : '') : '';
    out[k] = { value, from };
  }
  return out;
}

async function callOnce(provider, model, o, prompt, photos, key) {
  const url = endpoint(provider, model, photos.length > 0);
  const ctx = { provider, timeoutS: o.timeoutS };
  let init, sent;
  if (provider === 'openai') {
    const { fields } = openaiRequest(o, model, prompt, photos);
    sent = sentFields(provider, o, fields);
    const headers = { Authorization: `Bearer ${key}` };
    if (process.env.OPENAI_ORG_ID) headers['OpenAI-Organization'] = process.env.OPENAI_ORG_ID.trim();
    if (process.env.OPENAI_PROJECT_ID) headers['OpenAI-Project'] = process.env.OPENAI_PROJECT_ID.trim();
    if (photos.length) {
      const form = new FormData();
      for (const [k, v] of Object.entries(fields)) form.append(k, v);
      for (const ph of photos) form.append('image[]', new Blob([ph.buf], { type: ph.mime }), basename(ph.path));
      init = { method: 'POST', headers, body: form };
    } else {
      const json = { ...fields, n: 1 };
      for (const p of o.params) { const [k, v] = p.split(/=(.*)/s); json[k] = parseValue(v); }
      init = { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify(json) };
    }
  } else {
    const { body } = geminiRequest(o, model, prompt, photos);
    sent = sentFields(provider, o, body.generationConfig);
    init = { method: 'POST', headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
  }

  const r = await send(url, init, ctx);
  if (!r.res.ok) throw apiError(provider, model, r.res.status, r.body, r.text, r.res.headers, sent);
  if (/^image\//.test(r.type) && imageInfo(r.raw)) return r.raw; // some proxies answer with the image itself
  if (!r.body) {
    throw new GenError('badresponse', `${PROVIDERS[provider].label} answered ${r.res.status} with ${r.type || 'no content type'}, not JSON: ${redact(r.text.replace(/\s+/g, ' ').slice(0, 160))}`, {
      hint: `Something between you and the API answered instead (a proxy or captive portal?). Check ${PROVIDERS[provider].baseEnv}.`,
    });
  }
  if (provider === 'openai') {
    const d = (Array.isArray(r.body.data) && r.body.data[0]) || {};
    if (d.b64_json) return Buffer.from(d.b64_json, 'base64');
    if (d.url) {
      const img = await send(d.url, { method: 'GET' }, ctx);
      if (img.res.ok && imageInfo(img.raw)) return img.raw;
      throw new GenError('badresponse', `couldn't download the image URL the API returned (${img.res.status})`, { hint: 'Run again.' });
    }
    throw new GenError('noimage', `OpenAI answered 200 without an image: ${redact(JSON.stringify(r.body).slice(0, 240))}`, { hint: 'Run again; if it repeats, try another --model.' });
  }
  // Gemini: the image is an inlineData part; skip "thought" drafts and take the last real one
  const cand = (Array.isArray(r.body.candidates) && r.body.candidates[0]) || {};
  const parts = (cand.content && Array.isArray(cand.content.parts) && cand.content.parts) || [];
  const imgs = parts.filter((p) => p && !p.thought && (p.inlineData || p.inline_data) && (p.inlineData || p.inline_data).data);
  if (imgs.length) {
    const p = imgs[imgs.length - 1];
    return Buffer.from((p.inlineData || p.inline_data).data, 'base64');
  }
  const said = parts.filter((p) => p && p.text && !p.thought).map((p) => p.text).join(' ').replace(/\s+/g, ' ').trim();
  const finish = cand.finishReason || '';
  const block = (r.body.promptFeedback && r.body.promptFeedback.blockReason) || '';
  const safety = /SAFETY|PROHIBITED|BLOCK|RECITATION|SPII/.test(finish + block);
  throw new GenError(safety ? 'refused' : 'noimage', `Gemini answered without an image${finish ? ' (finishReason ' + finish + ')' : ''}${block ? ' (blocked: ' + block + ')' : ''}${said ? ': "' + redact(said.slice(0, 200)) + '"' : ''}`, {
    hint: safety
      ? 'The safety filter refused this sheet. Run again (it varies), soften the action, try --provider openai, or let the user generate it in an app.'
      : 'Run again; if it keeps answering in text only, try another --model.',
  });
}

// one sheet, with retries for rate limits / server hiccups and model fallback
async function generate(provider, state, o, prompt, photos, key) {
  for (;;) {
    const model = state.models[state.mi];
    let tries = 0;
    for (;;) {
      try {
        const buf = await callOnce(provider, model, o, prompt, photos, key);
        return { buf, model };
      } catch (e) {
        if (!(e instanceof GenError)) throw e;
        if (e.fallback && state.mi + 1 < state.models.length) {
          const why = /verif/i.test(e.message) ? 'needs a verified organization' : "isn't available to this key";
          say(`  · ${model} ${why} (${e.status}); trying ${state.models[state.mi + 1]}`);
          state.mi++;
          break;
        }
        if (e.retryMs && tries < 2 && e.retryMs <= 60000) {
          tries++;
          say(`  · ${e.kind === 'rate' ? 'rate limited' : 'server error ' + e.status}; retrying in ${Math.ceil(e.retryMs / 1000)} s`);
          await sleep(e.retryMs);
          continue;
        }
        e.model = model;
        if (e.fallback) e.fatal = true; // no other model to try: the next sheets would fail the same way
        throw e;
      }
    }
  }
}

// ---- main -------------------------------------------------------------------------------------------------
// lenient (dry run / no key): the prompt is for an image app, so the files may live on the user's phone instead,
// and limits that only matter for a real request become notes instead of errors.
function loadPhoto(p, { provider, lenient, dry, geminiKey, notes }) {
  const path = resolve(p);
  const sp = pathFor(path); // as printed
  if (!existsSync(path) || !statSync(path).isFile()) {
    if (lenient) return { path, buf: Buffer.alloc(0), mime: /\.png$/i.test(p) ? 'image/png' : /\.webp$/i.test(p) ? 'image/webp' : /\.hei[cf]$/i.test(p) ? 'image/heic' : 'image/jpeg', missing: true };
    throw new Error(`photo not found: ${sp}`);
  }
  const buf = readFileSync(path);
  const info = imageInfo(buf);
  if (!info) throw new Error(`${sp} is not a JPEG, PNG, WebP or HEIC image (or the file is cut short)`);
  if (info.ext === 'heic' && provider === 'openai') {
    const convert = `Convert it to JPEG first (macOS: sips -s format jpeg ${q(sp)} --out ${q(sp.replace(/\.[^./\\]+$/, '') + '.jpg')})`;
    const gem = geminiKey ? `, or run with --provider gemini (${geminiKey} is set, and Gemini accepts HEIC)` : '';
    if (lenient) { if (dry) notes.push(`⚠ ${basename(p)} is HEIC, which OpenAI doesn't accept: a real run with OpenAI would stop here. ${convert}${gem}.`); }
    else throw new Error(`${sp} is HEIC, which OpenAI doesn't accept. ${convert}${gem}.`);
  }
  if (buf.length > 20e6) {
    const m = `${sp} is ${KB(buf.length)}. Resize it to about 1600 px on the long side first (macOS: sips -Z 1600 ${q(sp)})`;
    if (lenient) { if (dry) notes.push(`⚠ ${m}: a real run would stop here.`); }
    else throw new Error(m);
  }
  return { path, buf, mime: info.mime, w: info.w, h: info.h };
}

function pickKey(provider) {
  for (const name of PROVIDERS[provider].env) if ((process.env[name] || '').trim()) return { name, key: process.env[name].trim() };
  return null;
}

function nextFreePath(dir, sheet, ext, overwrite) {
  const first = join(dir, `${sheet}.${ext}`);
  if (overwrite || !existsSync(first)) return first;
  for (let n = 2; ; n++) { const p = join(dir, `${sheet}-${n}.${ext}`); if (!existsSync(p)) return p; }
}

export function configLines(made) {
  const out = [];
  const src = (s) => made[s] && made[s].rel;
  const sprite = (s) => `sprite: { src: '${src(s)}', cols: 2, rows: 2, frames: 4, fps: 4, height: 0.34 }`;
  if (src('walk')) out.push(`In characters: { … } replace the walk line with:`, `    walk: { src: '${src('walk')}', cols: 3, rows: 2, frames: 6, fps: 9 },`);
  if (src('poses')) out.push(`In characters.poses: { … } set the src line (keep its list of names and say lines):`, `      src: '${src('poses')}', cols: 3, rows: 2, frames: 6, normalize: false,`);
  if (src('idle')) out.push(`In characters: { … } add (a standing loop, used when there are no poses):`, `    idle: { src: '${src('idle')}', cols: 2, rows: 2, frames: 4, fps: 4 },`);
  if (src('cheers')) out.push(`On the bar stop (idle type 'cheers'), add sprite: {…} inside that stop's idle (keep its type and pose):`, `      ${sprite('cheers')}`, `    so it reads idle: { type: 'cheers', pose: '…', sprite: { … } },`);
  if (src('dinner')) out.push(`On a restaurant / café / bistro stop (idle type 'sit'), add sprite: {…} inside that stop's idle (keep its type and pose):`, `      ${sprite('dinner')}`, `    so it reads idle: { type: 'sit', pose: '…', sprite: { … } },`);
  return out;
}

// green clothes vanish on a green key, pink / red / purple ones on magenta (references/characters.md → Key colour).
// Green eyes are small but would lose their colour on a green key: they count too, unless that would put pink
// or red clothes at risk instead (then the key stays green and a note says to check the eyes).
const GREEN = /green|teal|mint|lime|olive|emerald|jade|sage|turquoise|绿|青/i;
const PINK = /pink|magenta|fuchsia|purple|violet|lilac|lavender|\brose\b|\bred\b|burgundy|maroon|粉|紫|玫|红/i;
const EYES = /([\w-]+(?:[ -][\w-]+)?)[ -](eyes?|eyed)\b|(绿|翠|碧)色?的?(眼|瞳)/gi;
export function autoKey(o) {
  // each option on its own, so a phrase never runs from one into the next ("… green scarf" + "eyes …")
  let greenEyes = false, greenClothes = false, pinkish = false;
  for (const field of [o.outfit1, o.outfit2, o.describe1, o.describe2].filter(Boolean).map(String)) {
    if ([...field.matchAll(EYES)].some((m) => /green|emerald|jade|hazel|绿|翠|碧/i.test(m[0]))) greenEyes = true;
    const clothes = field
      .replace(EYES, '') // eye colours are handled above
      .replace(/[\w-]+[- ](skin(ned)?|complexion)\b/gi, ''); // "olive skin" isn't clothes
    if (GREEN.test(clothes)) greenClothes = true;
    if (PINK.test(clothes)) pinkish = true;
  }
  if (greenClothes) return { key: 'magenta', clash: pinkish, greenEyes };
  if (greenEyes && !pinkish) return { key: 'magenta', clash: false, greenEyes, eyesDecided: true };
  return { key: 'green', clash: false, greenEyes };
}

async function main() {
  SECRETS = envSecrets();
  let o;
  try { o = parseArgs(process.argv.slice(2)); } catch (e) { console.error(`✗ ${redact(e.message)}\n\n${USAGE}`); return exitWith(1); }
  if (o.help || !process.argv.slice(2).length) { console.log(USAGE); return exitWith(0); }

  const fail = (m) => { console.error(redact(`✗ ${m}`)); process.exit(1); };
  // which sheets
  const sheets = String(o.sheets === undefined ? 'walk,poses' : o.sheets).split(',').map((s) => s.trim().toLowerCase().replace(/\.(png|webp|jpe?g)$/, '')).filter(Boolean);
  const list = sheets.includes('all') ? Object.keys(SHEETS) : [...new Set(sheets)];
  if (!list.length) fail(`--sheets names no sheet. Give one or more of ${Object.keys(SHEETS).join(', ')} separated by commas, or all (e.g. --sheets walk,poses); leave --sheets out for walk,poses.`);
  for (const s of list) if (!SHEETS[s]) fail(`unknown sheet ${shown(s)} — use any of ${Object.keys(SHEETS).join(', ')}, all`);
  // the model id is printed on status lines: a key pasted there is refused instead
  if (o.model && (redact(String(o.model)) !== String(o.model) || /\bsk-[\w-]{6,}|\bAIza[\w-]{10,}/.test(String(o.model)))) {
    fail('--model looks like an API key (not shown). Give a model id such as gpt-image-2; the key belongs in OPENAI_API_KEY / GEMINI_API_KEY.');
  }
  // paths are printed too (no-key and dry-run notes): a key pasted as a path is refused the same way
  for (const k of ['site', 'photo', 'photo1', 'photo2']) {
    const v = o[k] == null ? '' : String(o[k]);
    if (v && (redact(v) !== v || /(^|[\/\s])(sk-[\w-]{16,}|AIza[\w-]{20,})/.test(v))) {
      fail(`--${k} looks like an API key (not shown). Give a file or folder path; the key belongs in OPENAI_API_KEY / GEMINI_API_KEY.`);
    }
  }

  // timeout: Node's fetch can't wait longer than ~300 s for the response headers
  o.timeoutS = MAX_TIMEOUT_S;
  if (o.timeout !== undefined) {
    const t = Number(String(o.timeout).trim().replace(/s$/i, ''));
    if (!(t >= 1 && t <= MAX_TIMEOUT_S)) fail(`--timeout must be 1–${MAX_TIMEOUT_S} seconds (got ${shown(o.timeout)}). Node's fetch stops waiting for an answer after about 300 s, so longer can't work.`);
    o.timeoutS = t;
  }

  // which provider and key
  if (o.provider) o.provider = String(o.provider).trim().toLowerCase();
  if (o.provider && !PROVIDERS[o.provider]) fail(`--provider must be openai or gemini (got ${shown(o.provider)})`);
  let provider = o.provider;
  let found = provider ? pickKey(provider) : null;
  if (!provider) {
    for (const p of Object.keys(PROVIDERS)) { const k = pickKey(p); if (k) { provider = p; found = k; break; } }
  }
  const noKey = !found;
  provider = provider || 'openai';
  const P = PROVIDERS[provider];
  const dry = !!o['dry-run'];
  const lenient = dry || noKey;
  const notes = [];

  // who
  if ((o.photo1 && !o.photo2) || (o.photo2 && !o.photo1)) fail('give both --photo1 (left person) and --photo2 (right person), or one photo of both with --photo');
  if (o.photo && o.photo1) fail('use either --photo (one photo of both) or --photo1 + --photo2, not both');
  const geminiKey = (pickKey('gemini') || {}).name;
  let photos = [];
  try { photos = (o.photo ? [o.photo] : [o.photo1, o.photo2].filter(Boolean)).map((p) => loadPhoto(p, { provider, lenient, dry, geminiKey, notes })); } catch (e) { fail(e.message); }
  const missing = photos.filter((p) => p.missing);
  if (!photos.length && !(o.describe1 && o.describe2)) {
    fail('describe the two people: give --photo1 and --photo2 (best), or --describe1 "…" and --describe2 "…" (hair, skin tone, glasses, build, clothes)');
  }
  const totalPhotoBytes = photos.reduce((n, p) => n + p.buf.length, 0);
  if (provider === 'gemini' && totalPhotoBytes > GEMINI_PHOTO_BYTES) {
    const m = `the photos add up to ${KB(totalPhotoBytes)}; a Gemini request takes about 20 MB, which is about ${KB(GEMINI_PHOTO_BYTES)} of photos once encoded. Resize them to ~1600 px on the long side first (macOS: sips -Z 1600 photo.jpg)`;
    if (!lenient) fail(m + '.');
    else if (dry) notes.push(`⚠ ${m}: a real run would stop here.`);
  }
  const who = { photos: photos.length, describe1: o.describe1, describe2: o.describe2, outfit1: o.outfit1, outfit2: o.outfit2 };

  // key colour
  let keyName = String(o['key-colour'] || 'auto').trim().toLowerCase();
  const keyAuto = keyName === 'auto'; // --key-colour auto behaves exactly like leaving it out
  const auto = autoKey(o);
  if (keyAuto) keyName = auto.key;
  if (!KEYS[keyName]) fail(`--key-colour must be green, magenta, blue or auto (got ${shown(o['key-colour'])})`);

  // site: a folder this can write into, checked before anything is sent (and paid for)
  let site = null, outDir = null;
  if (o.site) {
    site = resolve(String(o.site));
    const problem = (m) => (lenient ? notes.unshift('⚠ ' + m + (dry ? ' (A real run would stop here.)' : '')) : fail(m));
    let st = null, statErr = null;
    try { st = statSync(site); } catch (e) { statErr = e; }
    if (!st && (!statErr || statErr.code === 'ENOENT' || statErr.code === 'ENOTDIR')) {
      problem(`site folder not found: ${pathFor(site)} — create it first with node ${q(pathFor(join(here, 'new-site.mjs')))} ${q(pathFor(site))}`);
      outDir = join(site, 'assets', 'characters');
    } else if (!st) {
      problem(`can't open the site folder ${pathFor(site)} (${statErr.code || statErr.message}). Check its permissions, or pass another folder with --site.`);
    } else if (!st.isDirectory()) {
      problem(`--site must be the site folder (the one with index.html and js/config.js), but ${pathFor(site)} is a file. ${existsSync(join(dirname(site), 'js', 'config.js')) ? `Pass its folder instead: --site ${q(pathFor(dirname(site)))}` : 'Pass the site folder instead (new-site.mjs makes one).'}`);
    } else {
      if (!existsSync(join(site, 'js', 'config.js'))) say(`⚠ ${pathFor(site)} has no js/config.js — is it a site made with new-site.mjs?`);
      outDir = join(site, 'assets', 'characters');
    }
  } else if (!lenient) {
    fail('--site <site-folder> is required (the sheets are saved to <site>/assets/characters/)');
  }

  const models = o.model ? [String(o.model).trim()] : P.models;
  const keyEnv = found ? found.name : P.env[0];
  if (auto.clash && keyAuto) notes.push(`⚠ the outfits have both green and pink/purple: ${keyName} may eat part of one. Set --key-colour (blue is the third option), or change an outfit colour.`);
  if (auto.greenEyes && keyName === 'green') notes.push('⚠ green eyes on a green key can lose their colour when the site removes the background: check the eyes in the sheets. If they look hollow, run again with --key-colour magenta (or blue when someone wears pink or red).');
  else if (auto.eyesDecided && keyAuto) notes.push('· key colour magenta because of the green eyes (they would lose their colour on a green key)');
  if (!o.outfit1 || !o.outfit2) notes.push('· tip: say what they will wear with --outfit1 / --outfit2 (e.g. "a cream knit sweater, light-blue jeans and white sneakers")');
  if (provider === 'gemini' && o.quality) notes.push('· --quality is OpenAI-only; for Gemini use --size 1K | 2K | 4K');
  const sz = normalizeSize(o.size, provider);
  if (o.size !== undefined) { o.size = sz.size; if (sz.note) notes.push(sz.note); }
  if (missing.length) notes.push(`⚠ not found here: ${missing.map((p) => basename(p.path)).join(', ')}. The prompts still assume attached photos (fine when the user attaches them in an app); a real run needs the files.`);

  // ---- no key: the user generates in an app (step 2 of the ladder) ----
  if (noKey && !dry) {
    const which = o.provider ? P.env.join(' or ') : 'OPENAI_API_KEY, GEMINI_API_KEY or GOOGLE_API_KEY';
    say(`✗ No image API key found (${which}), so nothing was generated.

Next (references/characters.md → "Who generates the images"):
  1. If the user has an OpenAI or Google AI Studio key, ask them to set it as an environment variable where
     you run (e.g. export OPENAI_API_KEY=… in their terminal), not to paste it in chat. Then run this again.
  2. Otherwise ask them to make the sheets in an image app, with the prompts below:
     · ChatGPT or Google Gemini: ${photos.length === 2 ? 'upload both photos (photo 1 = left person, photo 2 = right person), ' : photos.length ? 'upload the photo, ' : ''}paste the prompt, send.
     · 豆包 Doubao / 即梦 Jimeng: the easiest from mainland China; same steps.
     · One prompt per image. Save the original image (download button), not a screenshot, and send it back.
     Save what they send as ${outDir ? join(pathFor(outDir), '<sheet>.<ext>') : '<site>/assets/characters/<sheet>.<ext>'}
     (keep the extension of the file they send: .png, .jpg or .webp) and set src to match in js/config.js.
  3. Meanwhile the built-in couple (characters.builtin colours) is the placeholder; tell the user it will be
     replaced when the images arrive.`);
    // the prompts are printed exactly as built: never redacted or otherwise changed
    for (const s of list) say(`\n──── prompt for ${s} (${SHEETS[s].cols}×${SHEETS[s].rows}, ${SHEETS[s].frames} frames) ────\n${buildPrompt(s, who, keyName)}`);
    notes.forEach((n) => say(n));
    return exitWith(2);
  }

  // ---- the key and the address must be usable before anything is sent ----
  const kp = found ? keyProblem(found.key) : '';
  const bp = baseProblem(provider);
  for (const h of ['OPENAI_ORG_ID', 'OPENAI_PROJECT_ID']) {
    if (provider === 'openai' && process.env[h] && keyProblem(process.env[h].trim())) notes.push(`⚠ ${h} contains spaces or non-ASCII characters: copy it again (or unset it).`);
  }

  // ---- dry run ----
  if (dry) {
    if (kp) notes.unshift(`⚠ ${keyMessage(found.name, kp, P)} (A real run would stop here.)`);
    if (bp) notes.unshift(`⚠ ${bp} (A real run would stop here.)`);
    say(`Dry run: nothing is sent or written.
Provider: ${P.label}${found ? ` (key from ${found.name}, hidden)` : ` (no key set: ${P.env.join(' / ')})`}${o.provider ? '' : found ? ', picked from the environment' : ', default'}
Model:    ${models[0]}${models.length > 1 ? ` (if this key can't use it: ${models.slice(1).join(', ')})` : ''}
Key colour: ${keyName} (${KEYS[keyName]})
Photos:   ${photos.length ? photos.map((p) => `${basename(p.path)} (${p.missing ? 'not found here' : `${p.w || '?'}×${p.h || '?'}, ${KB(p.buf.length)}`})`).join(', ') : 'none: described from --describe1 / --describe2'}
Output:   ${outDir ? `${list.map((s) => s + '.png').join(', ')} in ${pathFor(outDir)} (the extension follows the image the API returns)` : o.site ? '(--site is not a usable folder: see the ⚠ note at the end)' : '(no --site given)'}
Timeout:  ${o.timeoutS} s per sheet`);
    for (const s of list) {
      const prompt = buildPrompt(s, who, keyName);
      // the request description is HTTP text (it can show --param values): redacted; the prompt is printed as built
      say(`\n════ ${s} (${SHEETS[s].cols}×${SHEETS[s].rows}, ${SHEETS[s].frames} frames) ════\n${redact(describeRequest(provider, models[0], o, prompt, photos, keyEnv))}\n\n  prompt:\n${indent(prompt, 4)}`);
    }
    notes.forEach((n) => say(n));
    return exitWith(0);
  }

  if (kp) fail(keyMessage(found.name, kp, P));
  if (bp) fail(bp);

  // ---- generate ----
  try {
    mkdirSync(outDir, { recursive: true });
    accessSync(outDir, fsc.W_OK);
  } catch (e) {
    const code = e.code || e.message;
    fail(`can't write the sheets to ${pathFor(outDir)} (${code}): ${/ENOTDIR|EEXIST/.test(code)
      ? 'part of that path (assets or assets/characters) is a file, not a folder. Rename or remove that file, then run again.'
      : 'the folder is not writable. Check its permissions (or the disk), or copy the site somewhere writable and pass that with --site.'} Nothing was sent.`);
  }
  say(`Making ${list.join(', ')} with ${P.label} (${models[0]}, key from ${found.name}); key colour ${keyName}.`);
  say(photos.length ? `Sending ${photos.length} photo${photos.length > 1 ? 's' : ''} to ${P.label} only (${hostOf(baseUrl(provider))}).` : 'No photos: the characters are drawn from the descriptions.');
  notes.forEach((n) => say(n));
  say(`Each sheet takes about 30 s to 4 min (gives up after ${o.timeoutS} s) and is billed to the account of this key.\n`);

  const state = { models, mi: 0 };
  const made = {}, failed = {}; // failed[sheet] = { err, skipped }
  let stop = null;
  const notMade = () => list.filter((x) => !made[x]); // what a re-run still has to make
  for (let i = 0; i < list.length; i++) {
    const s = list[i];
    if (stop) {
      failed[s] = { err: stop, skipped: true };
      say(`✗ ${s}: skipped, ${stop.kind === 'timeout' ? 'after the timeout above' : stop.kind === 'request' ? 'after the rejected field above' : 'same problem as above'}`);
      continue;
    }
    const t0 = Date.now();
    say(`… ${s}`);
    try {
      const { buf, model } = await generate(provider, state, o, buildPrompt(s, who, keyName), photos, found.key);
      const info = imageInfo(buf);
      if (!info || info.ext === 'heic') throw new GenError('badimage', `the API returned ${buf.length} bytes that aren't a complete PNG, JPEG or WebP image`, { hint: 'Run again.' });
      let file = nextFreePath(outDir, s, info.ext, o.overwrite);
      try {
        writeFileSync(file, buf);
      } catch (we) {
        // don't lose an image that was already paid for
        const spare = join(tmpdir(), `${s}-${Date.now()}.${info.ext}`);
        try { writeFileSync(spare, buf); } catch { throw new GenError('save', `couldn't save ${pathFor(file)} (${we.code || we.message}), nor a copy in ${pathFor(tmpdir())}`, { hint: 'Check the folder is writable and the disk has space, then run again with --sheets ' + s + '.' }); }
        throw new GenError('save', `couldn't save ${pathFor(file)} (${we.code || we.message}); the image is kept at ${pathFor(spare)}`, { hint: `Move it to ${pathFor(outDir)} yourself (check that folder is writable), then set the src.` });
      }
      const rel = relative(site, file).split('\\').join('/');
      made[s] = { rel, file, bytes: buf.length };
      const ratio = info.w && info.h ? info.w / info.h : 1.5;
      say(`✓ ${s} → ${pathFor(file)} (${info.w || '?'}×${info.h || '?'}, ${KB(buf.length)}, ${model}, ${Math.round((Date.now() - t0) / 1000)} s)`);
      if (Math.abs(ratio - 1.5) > 0.12) say(`  ⚠ the image is ${info.w}×${info.h}, not 3:2 — the model may have drawn a different grid; check it and set cols / rows / frames to what it drew`);
      if (file !== join(outDir, `${s}.${info.ext}`)) say(`  (${s}.${info.ext} already existed, so this one is ${basename(file)}; --overwrite replaces it instead)`);
    } catch (e) {
      // anything unexpected is reported for this sheet; the other sheets still get their turn
      const g = e instanceof GenError ? e : new GenError('unexpected', `unexpected error: ${(e && e.message) || e}`, { hint: `Run again with --sheets ${s}; if it repeats, give the user the prompt (same command with --dry-run prints it).` });
      failed[s] = { err: g, skipped: false };
      sayErr(`✗ ${s}: ${g.message}${g.hint ? '\n  → ' + g.hint : ''}`);
      if (g.fatal) {
        stop = g;
        if (i + 1 < list.length) {
          const why = g.kind === 'timeout' ? 'after a timeout the next sheet would most likely wait just as long'
            : g.kind === 'request' ? `the same field${g.field ? ' (' + g.field + ')' : ''} would be rejected for every sheet`
            : 'the next sheets would fail the same way';
          sayErr(`  → skipping ${list.slice(i + 1).join(', ')}: ${why}. Re-run with --sheets ${notMade().join(',')}${g.kind === 'timeout' ? '' : ' once that is fixed'}`);
        }
      }
    }
  }

  // ---- summary: the same groups as the ✗ lines above, and one re-run line with every sheet still to make ----
  const todo = notMade();
  const nMade = list.length - todo.length;
  const KIND = { request: 'rejected field', auth: 'key rejected', model: 'model not available', notfound: 'not found', toolarge: 'request too large', rate: 'rate limited', server: 'server error', badresponse: 'not an image answer', noimage: 'no image', badimage: 'broken image', save: 'not saved', unexpected: 'unexpected error' };
  const label = (g) => KIND[g.kind] || g.kind;
  const groups = [
    ['failed', todo.filter((s) => !failed[s].skipped && failed[s].err.kind !== 'timeout').map((s) => `${s} (${label(failed[s].err)})`)],
    ['timed out or skipped', todo.filter((s) => failed[s].err.kind === 'timeout')],
    ['skipped', todo.filter((s) => failed[s].skipped && failed[s].err.kind !== 'timeout')],
  ].filter(([, names]) => names.length);
  say(`\n${todo.length ? '✗' : '✓'} ${nMade} made, ${todo.length} ${todo.length ? 'not made — ' + groups.map(([k, names]) => `${k}: ${names.join(', ')}`).join(' · ') : 'failed.'}`);
  if (nMade) {
    say(`\nPaste into ${pathFor(join(site, 'js', 'config.js'))}:`);
    configLines(made).forEach((l) => say('  ' + l));
    if (!made.walk && !existsSync(join(outDir, 'walk.png')) && !existsSync(join(outDir, 'walk.webp')) && !existsSync(join(outDir, 'walk.jpg'))) {
      say('  ⚠ the site only uses poses / idle sprites together with a walk sheet: keep their src \'\' until walk is made.');
    }
    // the same rule and command as validate.mjs: PNG / JPEG → .webp at quality 85; a WebP already → -small.webp at 70
    const big = list.filter((s) => made[s] && made[s].bytes > 1e6).map((s) => {
      const { rel, bytes } = made[s];
      const isWebp = /\.webp$/i.test(rel);
      const out = rel.replace(/\.[^./]+$/, '') + (isWebp ? '-small.webp' : '.webp');
      return `  ${s} (${KB(bytes)}${isWebp ? ', re-save smaller' : ', convert to WebP'}): python3 -c "from PIL import Image; Image.open('${rel}').save('${out}', quality=${isWebp ? 70 : 85})" and set src: '${out}'`;
    });
    say(`
Then look at them:
  node ${q(pathFor(join(here, 'validate.mjs')))} ${q(pathFor(site))}
  node ${q(pathFor(join(here, 'preview.mjs')))} ${q(pathFor(site))}     → check the couple in the screenshots: same faces and outfits in every frame, no wobble
  or node ${q(pathFor(join(here, 'serve.mjs')))} ${q(pathFor(resolve(here, '..', 'template')))} → open /tools/sprite-check.html and drag a sheet in
If the model drew another grid, set cols / rows / frames to what it drew. If a frame has a different face or outfit,
run this again with --sheets <that sheet>.${big.length ? `
Sprite sheets over ~1 MB load slowly on phones. Run ${big.length > 1 ? 'one command per sheet' : 'this'} in the site folder (cd ${q(pathFor(site))}):
${big.join('\n')}` : ''}`);
  }
  if (todo.length) {
    say(`
Still to make: ${todo.join(', ')}. Once the → lines above are dealt with, re-run with --sheets ${todo.join(',')}
(the sheets already made are kept), or give the user the prompts (same command with --dry-run prints them)
to generate in ChatGPT / Gemini / 豆包.
Until then the site keeps the built-in couple${made.walk ? ' for anything without a sheet' : ''}.`);
  }
  return exitWith(todo.length ? 1 : 0);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch((e) => { console.error('✗ ' + redact((e && e.stack) || e)); process.exit(1); });
}
