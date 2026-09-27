#!/usr/bin/env python3
"""Build dist/one-day-date.zip for uploading to Claude.ai (Customize → Skills).
The zip holds the skill folder at its root: one-day-date/SKILL.md, scripts/, references/, template/.
Run after changing anything under skills/one-day-date/:  python3 tools/package.py
"""
import os
import zipfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SKILL = os.path.join(ROOT, 'skills', 'one-day-date')
OUT = os.path.join(ROOT, 'dist', 'one-day-date.zip')
SKIP_DIRS = {'node_modules', '__pycache__', '.git'}
SKIP_FILES = {'.DS_Store', 'Thumbs.db'}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
count = 0
with zipfile.ZipFile(OUT, 'w', zipfile.ZIP_DEFLATED) as z:
    for dirpath, dirnames, filenames in os.walk(SKILL):
        dirnames[:] = sorted(d for d in dirnames if d not in SKIP_DIRS and not d.endswith('-preview'))
        for name in sorted(filenames):
            if name in SKIP_FILES:
                continue
            full = os.path.join(dirpath, name)
            arc = os.path.join('one-day-date', os.path.relpath(full, SKILL))
            info = zipfile.ZipInfo(arc, date_time=(2026, 1, 1, 0, 0, 0))   # stable zip: same input → same bytes
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            with open(full, 'rb') as f:
                z.writestr(info, f.read())
            count += 1
print(f'{OUT}: {count} files, {os.path.getsize(OUT) / 1e6:.1f} MB')
