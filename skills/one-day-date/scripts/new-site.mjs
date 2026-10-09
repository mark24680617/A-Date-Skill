#!/usr/bin/env node
// Copy the website template into a new folder.
// Usage: node scripts/new-site.mjs <target-folder> [--force]
import { cpSync, existsSync, readdirSync, mkdirSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const template = resolve(here, '..', 'template');
const args = process.argv.slice(2);
const force = args.includes('--force');
const target = args.find((a) => !a.startsWith('--'));

if (!target) {
  console.error('Usage: node scripts/new-site.mjs <target-folder> [--force]');
  process.exit(1);
}
const dest = resolve(target);
if (existsSync(dest) && readdirSync(dest).length && !force) {
  console.error(`✗ ${dest} is not empty. Pick a new folder, or add --force to copy over it.`);
  process.exit(1);
}
mkdirSync(dest, { recursive: true });
// tools/ and the scene-authoring README stay in the skill: they shouldn't go live with the site
const skip = new Set([join(template, 'tools'), join(template, 'js', 'scenes', 'README.md')]);
cpSync(template, dest, { recursive: true, filter: (src) => !skip.has(src) && !/\.gitkeep$|[\\/]\.preview([\\/]|$)/.test(src) });
// paths in the printed commands: quoted when they hold spaces or other shell characters
const q = (p) => ((process.platform === 'win32' ? /^[\w@%+=:,./\\-]+$/ : /^[\w@%+=:,./-]+$/).test(p) ? p : '"' + (process.platform === 'win32' ? p : p.replace(/(["$`\\])/g, '\\$1')) + '"');
console.log(`✓ Website template copied to ${dest}

Next:
  1. Edit ${join(dest, 'js', 'config.js')} (stops, text, dates, language)
  2. Characters: make the sprite sheets with an image model (references/characters.md, scripts/make-characters.mjs) — the built-in couple is only the placeholder
     They go in ${join(dest, 'assets', 'characters')}; make-characters.mjs saves them there and prints the config lines
  3. node ${q(join(here, 'validate.mjs'))} ${q(dest)}
  4. node ${q(join(here, 'preview.mjs'))} ${q(dest)}  → screenshots + click-through in ${dest}-preview
  5. node ${q(join(here, 'serve.mjs'))} ${q(dest)}    → open the printed URL to click around yourself`);
