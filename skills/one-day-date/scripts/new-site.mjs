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
console.log(`✓ Website template copied to ${dest}

Next:
  1. Edit ${join(dest, 'js', 'config.js')} (stops, text, dates, language)
  2. Put character images in ${join(dest, 'assets', 'characters')} (optional)
  3. node ${join(here, 'validate.mjs')} ${dest}
  4. node ${join(here, 'preview.mjs')} ${dest}  → screenshots + click-through in ${dest}-preview
  5. node ${join(here, 'serve.mjs')} ${dest}    → open the printed URL to click around yourself`);
