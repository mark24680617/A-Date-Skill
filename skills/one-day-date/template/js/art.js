/*
 * 内置场景插画（SVG）。每个场景由多层组成，按 depth 做视差滚动。
 * Built-in scene illustrations. Each scene is a stack of layers; `depth` is the
 * parallax factor (1 = moves with the ground the couple walks on).
 *
 * All layers share a 2400 × 1000 canvas; the couple's feet stand on y = GROUND_Y
 * at x = 1200 (screen centre) when the scene is in focus.
 */
(function () {
  'use strict';

  const GROUND_Y = 820;

  // ---------- helpers ----------
  function rng(seed) {
    let s = seed >>> 0 || 1;
    return () => { s = (Math.imul(s, 1664525) + 1013904223) >>> 0; return s / 4294967296; };
  }
  const stops = (list) => list.map(([o, c, a]) =>
    `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
  const lg = (id, list, x1 = 0, y1 = 0, x2 = 0, y2 = 1) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(list)}</linearGradient>`;
  const rg = (id, list, cx = 0.5, cy = 0.5, r = 0.5) =>
    `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(list)}</radialGradient>`;
  const glow = (id, color) => rg(id, [[0, color, 0.9], [0.4, color, 0.35], [1, color, 0]]);

  const CFG = (typeof window !== 'undefined' && window.TRIP_CONFIG) || {};
  const ZH = /^zh/i.test(CFG.lang || 'zh-CN');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  // Text painted inside a scene (shop signs, menus, neon…). A scene's `labels` in config.js
  // overrides it; '' hides it. Otherwise the default follows CFG.lang (Chinese or English).
  const labelLog = [];   // defaults actually painted (read by scripts/validate.mjs)
  function label(sc, key, zh, en) {
    const l = sc && sc.labels;
    if (l && l[key] != null) return l[key];
    const v = ZH ? zh : (en === undefined ? zh : en);
    if (v && (!Array.isArray(v) || v.length) && labelLog.length < 500) labelLog.push({ key, value: v });
    return v;
  }
  // Inject a scene's own CSS once (for animations that only that scene uses).
  function css(id, text) {
    if (typeof document === 'undefined' || document.getElementById('scene-css-' + id)) return;
    const el = document.createElement('style');
    el.id = 'scene-css-' + id;
    el.textContent = text;
    document.head.appendChild(el);
  }
  // Squeeze text that would overflow its sign: returns textLength attributes when it's too wide.
  function fitText(v, maxW, size) {
    let w = 0;
    for (const c of String(v || '')) w += (/[\u2E80-\uFFEF]/.test(c) ? 1 : 0.56) * size;
    return w > maxW ? ` textLength="${maxW}" lengthAdjust="spacingAndGlyphs"` : '';
  }
  // A label that holds a list: an array, or a string split on commas / 、 / ，
  const listOf = (v) => Array.isArray(v) ? v : String(v || '').split(/\s*[,，、]\s*/).filter(Boolean);
  // The scene's lighting mood: 'day' | 'sunset' | 'night' (scenes that support it).
  const moodOf = (sc, def = 'day') => (sc && sc.mood) || def;

  function cloud(x, y, s, fill = '#fff', op = 1) {
    return `<g opacity="${op}" fill="${fill}">
      <circle cx="${x}" cy="${y}" r="${38 * s}"/><circle cx="${x + 46 * s}" cy="${y - 26 * s}" r="${50 * s}"/>
      <circle cx="${x + 104 * s}" cy="${y - 10 * s}" r="${42 * s}"/><circle cx="${x + 140 * s}" cy="${y + 6 * s}" r="${30 * s}"/>
      <rect x="${x}" y="${y}" width="${140 * s}" height="${36 * s}" rx="${18 * s}"/>
      <ellipse cx="${x + 70 * s}" cy="${y + 30 * s}" rx="${76 * s}" ry="${8 * s}" fill="#000" opacity=".05"/></g>`;
  }

  // Lujiazui skyline: Oriental Pearl, Jin Mao, SWFC and Shanghai Tower.
  // x = centre of Shanghai Tower, base = ground line, h = Shanghai Tower height.
  function lujiazui(x, base, h, fill, o = {}) {
    const r = rng(o.seed || 7);
    let s = `<g>`;
    // filler towers
    for (let i = 0; i < 16; i++) {
      const bx = x - 0.95 * h + r() * 1.35 * h, bw = (0.05 + r() * 0.06) * h, bh = (0.12 + r() * 0.3) * h;
      s += `<rect x="${bx}" y="${base - bh}" width="${bw}" height="${bh}" fill="${o.filler || fill}" opacity="${o.fillerOp || 0.8}"/>`;
      if (o.windows) {
        for (let wy = base - bh + 8; wy < base - 6; wy += 11) for (let wx = bx + 5; wx < bx + bw - 5; wx += 10) {
          if (r() < 0.45) s += `<rect x="${wx}" y="${wy}" width="4" height="5" fill="${o.windows}" opacity="${0.5 + r() * 0.5}"/>`;
        }
      }
    }
    s += `<g fill="${fill}">`;
    // Jin Mao
    const xj = x - 0.34 * h, hj = 0.66 * h;
    const tiers = [[0.05, 0], [0.047, 0.2], [0.042, 0.34], [0.036, 0.44], [0.03, 0.52], [0.024, 0.58], [0.016, 0.62]];
    let pts = [];
    tiers.forEach(([w, y], i) => { const y2 = i + 1 < tiers.length ? tiers[i + 1][1] : 0.63; pts.push([xj - w * h, base - y * h], [xj - w * h, base - y2 * h]); });
    let right = pts.map(([px, py]) => [2 * xj - px, py]).reverse();
    s += `<polygon points="${pts.concat(right).map(p => p.join(',')).join(' ')}"/>`;
    s += `<rect x="${xj - 0.004 * h}" y="${base - hj}" width="${0.008 * h}" height="${0.05 * h}"/>`;
    // SWFC (bottle opener)
    const xs = x - 0.19 * h, hs = 0.78 * h;
    s += `<path fill-rule="evenodd" d="M${xs - 0.06 * h} ${base} L${xs - 0.03 * h} ${base - hs} L${xs + 0.03 * h} ${base - hs} L${xs + 0.06 * h} ${base} Z
      M${xs - 0.02 * h} ${base - hs + 0.025 * h} L${xs + 0.02 * h} ${base - hs + 0.025 * h} L${xs + 0.013 * h} ${base - hs + 0.08 * h} L${xs - 0.013 * h} ${base - hs + 0.08 * h} Z"/>`;
    // Shanghai Tower
    s += `<path d="M${x - 0.07 * h} ${base} C${x - 0.068 * h} ${base - 0.45 * h} ${x - 0.05 * h} ${base - 0.8 * h} ${x - 0.03 * h} ${base - h}
      L${x + 0.032 * h} ${base - 0.955 * h} C${x + 0.05 * h} ${base - 0.75 * h} ${x + 0.07 * h} ${base - 0.42 * h} ${x + 0.075 * h} ${base} Z"/>`;
    s += `</g>`;
    // Oriental Pearl Tower
    const xo = x - 0.66 * h, lw = 0.013 * h;
    const sphere = o.pearl || fill;
    s += `<g stroke="${fill}" stroke-linecap="round" fill="none">
      <line x1="${xo - 0.065 * h}" y1="${base}" x2="${xo - 0.018 * h}" y2="${base - 0.17 * h}" stroke-width="${lw}"/>
      <line x1="${xo + 0.065 * h}" y1="${base}" x2="${xo + 0.018 * h}" y2="${base - 0.17 * h}" stroke-width="${lw}"/>
      <line x1="${xo}" y1="${base}" x2="${xo}" y2="${base - 0.2 * h}" stroke-width="${lw}"/>
      <line x1="${xo - 0.016 * h}" y1="${base - 0.2 * h}" x2="${xo - 0.016 * h}" y2="${base - 0.52 * h}" stroke-width="${lw * 0.8}"/>
      <line x1="${xo + 0.016 * h}" y1="${base - 0.2 * h}" x2="${xo + 0.016 * h}" y2="${base - 0.52 * h}" stroke-width="${lw * 0.8}"/>
      <line x1="${xo}" y1="${base - 0.2 * h}" x2="${xo}" y2="${base - 0.52 * h}" stroke-width="${lw * 0.8}"/>
      <line x1="${xo}" y1="${base - 0.52 * h}" x2="${xo}" y2="${base - 0.68 * h}" stroke-width="${lw}"/>
      <line x1="${xo}" y1="${base - 0.68 * h}" x2="${xo}" y2="${base - 0.76 * h}" stroke-width="${lw * 0.45}"/></g>`;
    s += `<circle cx="${xo}" cy="${base - 0.2 * h}" r="${0.058 * h}" fill="${sphere}"/>
      <circle cx="${xo}" cy="${base - 0.52 * h}" r="${0.044 * h}" fill="${sphere}"/>
      <circle cx="${xo}" cy="${base - 0.36 * h}" r="${0.012 * h}" fill="${sphere}"/>
      <circle cx="${xo}" cy="${base - 0.665 * h}" r="${0.018 * h}" fill="${sphere}"/>`;
    if (o.glowColor) {
      s += `<circle cx="${xo}" cy="${base - 0.2 * h}" r="${0.14 * h}" fill="url(#${o.glowColor})"/>
        <circle cx="${xo}" cy="${base - 0.52 * h}" r="${0.11 * h}" fill="url(#${o.glowColor})"/>`;
    }
    if (o.towerLights) {
      s += `<circle cx="${x - 0.028 * h}" cy="${base - 0.99 * h}" r="${0.008 * h}" fill="${o.towerLights}"/>
        <line x1="${x}" y1="${base - 0.9 * h}" x2="${x}" y2="${base - 0.05 * h}" stroke="${o.towerLights}" stroke-width="2" stroke-dasharray="3 9" opacity=".7"/>
        <line x1="${xs}" y1="${base - hs + 0.1 * h}" x2="${xs}" y2="${base - 0.05 * h}" stroke="${o.towerLights}" stroke-width="2" stroke-dasharray="3 12" opacity=".6"/>`;
    }
    return s + `</g>`;
  }

  // A generic city skyline (no specific landmarks). x = centre, base = ground line,
  // h = tallest tower, w = total width. o: { seed, filler, fillerOp, windows, lights }
  function genericSkyline(x, base, h, fill, o = {}) {
    const r = rng(o.seed || 5), w = o.width || 2.2 * h;
    let s = `<g>`;
    for (let i = 0; i < 18; i++) {
      const bx = x - w / 2 + r() * w * 0.95, bw = (0.06 + r() * 0.07) * h, bh = (0.14 + r() * 0.32) * h;
      s += `<rect x="${bx}" y="${base - bh}" width="${bw}" height="${bh}" fill="${o.filler || fill}" opacity="${o.fillerOp || 0.8}"/>`;
    }
    const towers = [[-0.34, 0.72, 0.1, 'step'], [-0.12, 1, 0.09, 'spire'], [0.08, 0.84, 0.12, 'flat'], [0.3, 0.62, 0.1, 'dome'], [0.48, 0.5, 0.08, 'flat'], [-0.52, 0.46, 0.09, 'slant']];
    towers.forEach(([dx, th, tw, kind]) => {
      const cx = x + dx * w * 0.9, H = th * h, W = tw * h, top = base - H;
      s += `<g fill="${fill}">`;
      if (kind === 'step') s += `<rect x="${cx - W / 2}" y="${top + 0.18 * H}" width="${W}" height="${0.82 * H}"/><rect x="${cx - W * 0.35}" y="${top + 0.06 * H}" width="${W * 0.7}" height="${0.14 * H}"/><rect x="${cx - W * 0.18}" y="${top}" width="${W * 0.36}" height="${0.08 * H}"/>`;
      if (kind === 'spire') s += `<path d="M${cx - W / 2} ${base} L${cx - W * 0.4} ${top + 0.12 * H} L${cx} ${top} L${cx + W * 0.4} ${top + 0.12 * H} L${cx + W / 2} ${base} Z"/><rect x="${cx - 2}" y="${top - 0.08 * H}" width="4" height="${0.1 * H}"/>`;
      if (kind === 'flat') s += `<rect x="${cx - W / 2}" y="${top}" width="${W}" height="${H}" rx="${W * 0.06}"/>`;
      if (kind === 'dome') s += `<rect x="${cx - W / 2}" y="${top + W / 2}" width="${W}" height="${H - W / 2}"/><path d="M${cx - W / 2} ${top + W / 2} A${W / 2} ${W / 2} 0 0 1 ${cx + W / 2} ${top + W / 2} Z"/>`;
      if (kind === 'slant') s += `<path d="M${cx - W / 2} ${base} V${top + 0.2 * H} L${cx + W / 2} ${top} V${base} Z"/>`;
      s += `</g>`;
      if (o.windows) {
        for (let wy = top + 0.22 * H; wy < base - 8; wy += 14) for (let wx = cx - W / 2 + 6; wx < cx + W / 2 - 6; wx += 12) {
          if (r() < 0.4) s += `<rect x="${wx}" y="${wy}" width="5" height="6" fill="${o.windows}" opacity="${0.45 + r() * 0.5}"/>`;
        }
      }
    });
    if (o.lights) s += `<circle cx="${x - 0.12 * w * 0.9}" cy="${base - 1.08 * h}" r="4" fill="${o.lights}"/>`;
    return s + `</g>`;
  }
  // Skyline for scene sc: `skyline` in the scene (or top-level config) picks
  // 'shanghai' (Lujiazui towers), 'generic' (default) or 'none'.
  function skyline(sc, x, base, h, fill, o = {}) {
    const kind = (sc && sc.skyline) || CFG.skyline || 'generic';
    if (kind === 'none') return '';
    if (kind === 'shanghai') return lujiazui(x, base, h, fill, o);
    return genericSkyline(x - 0.3 * h, base, h * 0.92, fill, { seed: o.seed, filler: o.filler, fillerOp: o.fillerOp, windows: o.windows, lights: o.towerLights });
  }

  // Chinese roof with upturned eaves (飞檐). x = centre, yb = eave line, w = width, h = height.
  function roof(x, yb, w, h, fill, ridge, lift = 0.35) {
    const t = h * lift;
    return `<path d="M${x - w / 2} ${yb - t} Q${x - w * 0.25} ${yb + h * 0.08} ${x} ${yb + h * 0.06} Q${x + w * 0.25} ${yb + h * 0.08} ${x + w / 2} ${yb - t}
        Q${x + w * 0.37} ${yb - h * 0.25} ${x + w * 0.3} ${yb - h} L${x - w * 0.3} ${yb - h} Q${x - w * 0.37} ${yb - h * 0.25} ${x - w / 2} ${yb - t} Z" fill="${fill}"/>
      <path d="M${x - w * 0.33} ${yb - h - 4} L${x + w * 0.33} ${yb - h - 4}" stroke="${ridge}" stroke-width="${Math.max(4, h * 0.1)}" stroke-linecap="round"/>
      <path d="M${x - w * 0.33} ${yb - h - 4} q-8 -18 6 -26 M${x + w * 0.33} ${yb - h - 4} q8 -18 -6 -26" stroke="${ridge}" stroke-width="${Math.max(3, h * 0.07)}" fill="none" stroke-linecap="round"/>
      <path d="M${x - w / 2} ${yb - t} Q${x - w * 0.25} ${yb + h * 0.08} ${x} ${yb + h * 0.06} Q${x + w * 0.25} ${yb + h * 0.08} ${x + w / 2} ${yb - t}" stroke="${ridge}" stroke-width="3" fill="none" opacity=".7"/>`;
  }

  function lantern(x, y, s = 1, cls = 'lantern') {
    return `<g class="${cls}" style="transform-box:fill-box;transform-origin:50% 0%">
      <line x1="${x}" y1="${y - 16 * s}" x2="${x}" y2="${y}" stroke="#3A2A20" stroke-width="${2 * s}"/>
      <circle cx="${x}" cy="${y + 26 * s}" r="${46 * s}" fill="url(#lanternGlow)"/>
      <rect x="${x - 12 * s}" y="${y}" width="${24 * s}" height="${6 * s}" rx="${2 * s}" fill="#E8B04A"/>
      <ellipse cx="${x}" cy="${y + 26 * s}" rx="${24 * s}" ry="${21 * s}" fill="#E23B2E"/>
      <ellipse cx="${x - 7 * s}" cy="${y + 20 * s}" rx="${8 * s}" ry="${11 * s}" fill="#FF7A5C" opacity=".7"/>
      <path d="M${x - 12 * s} ${y + 8 * s} Q${x - 20 * s} ${y + 26 * s} ${x - 12 * s} ${y + 44 * s} M${x + 12 * s} ${y + 8 * s} Q${x + 20 * s} ${y + 26 * s} ${x + 12 * s} ${y + 44 * s} M${x} ${y + 5 * s} V${y + 47 * s}" stroke="#B42A20" stroke-width="${1.6 * s}" fill="none"/>
      <rect x="${x - 12 * s}" y="${y + 44 * s}" width="${24 * s}" height="${6 * s}" rx="${2 * s}" fill="#E8B04A"/>
      <path d="M${x} ${y + 50 * s} v${16 * s}" stroke="#E8B04A" stroke-width="${3 * s}"/></g>`;
  }

  function planeTree(x, gy, s, id) {
    return `<g>
      <path d="M${x - 22 * s} ${gy} C${x - 18 * s} ${gy - 160 * s} ${x - 16 * s} ${gy - 260 * s} ${x - 6 * s} ${gy - 360 * s} L${x + 12 * s} ${gy - 360 * s} C${x + 18 * s} ${gy - 260 * s} ${x + 20 * s} ${gy - 160 * s} ${x + 26 * s} ${gy} Z" fill="#B8A07C"/>
      <path d="M${x - 10 * s} ${gy - 80 * s} q10 -14 18 -4 q-4 16 -18 4 Z M${x + 6 * s} ${gy - 170 * s} q10 -12 14 2 q-8 12 -14 -2 Z M${x - 12 * s} ${gy - 250 * s} q8 -10 14 0 q-6 10 -14 0 Z" fill="#DCCCAE"/>
      <path d="M${x} ${gy - 300 * s} q-60 -40 -110 -40 M${x + 4} ${gy - 320 * s} q50 -60 110 -60" stroke="#A48C68" stroke-width="${10 * s}" fill="none" stroke-linecap="round"/>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 100%">
        <circle cx="${x - 120 * s}" cy="${gy - 400 * s}" r="${110 * s}" fill="#5FAE55"/>
        <circle cx="${x + 110 * s}" cy="${gy - 410 * s}" r="${115 * s}" fill="#5FAE55"/>
        <circle cx="${x - 10 * s}" cy="${gy - 500 * s}" r="${140 * s}" fill="url(#${id})"/>
        <circle cx="${x - 150 * s}" cy="${gy - 470 * s}" r="${80 * s}" fill="url(#${id})"/>
        <circle cx="${x + 150 * s}" cy="${gy - 480 * s}" r="${85 * s}" fill="url(#${id})"/>
        <circle cx="${x - 40 * s}" cy="${gy - 560 * s}" r="${46 * s}" fill="#B5E48F" opacity=".55"/>
        <circle cx="${x + 70 * s}" cy="${gy - 520 * s}" r="${30 * s}" fill="#B5E48F" opacity=".45"/>
      </g></g>`;
  }

  // Scalloped ellipse outline, for fur.
  function fluff(cx, cy, rx, ry, n) {
    let d = '', px, py;
    for (let i = 0; i <= n; i++) {
      const a = (i / n) * Math.PI * 2, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      if (i === 0) d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
      else {
        const r = (Math.hypot(x - px, y - py) * 0.62).toFixed(1);
        d += ` A${r} ${r} 0 0 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
      }
      px = x; py = y;
    }
    return d + 'Z';
  }

  // A Samoyed lying down, facing left. (x, y) = top-left of its 240 × 170 box.
  function samoyed(u, x, y, s = 1) {
    return `<defs>
        ${rg(u + 'fur', [[0, '#FFFFFF'], [0.6, '#F7F8FB'], [1, '#DDE2EC']], 0.35, 0.3, 0.8)}
        ${rg(u + 'furH', [[0, '#FFFFFF'], [0.65, '#F8F9FC'], [1, '#E2E6EF']], 0.4, 0.3, 0.75)}
      </defs>
      <g transform="translate(${x} ${y}) scale(${s})">
        <ellipse cx="128" cy="154" rx="128" ry="13" fill="#6B4A3A" opacity=".16"/>
        <g class="dogtail" style="transform-box:fill-box;transform-origin:18% 88%">
          <path d="${fluff(206, 62, 40, 30, 12)}" fill="url(#${u}fur)" stroke="#E3E7EF" stroke-width="2"/>
          <path d="${fluff(214, 48, 24, 18, 9)}" fill="#FFFFFF"/>
        </g>
        <path d="${fluff(138, 106, 96, 44, 22)}" fill="url(#${u}fur)" stroke="#E3E7EF" stroke-width="2"/>
        <path d="${fluff(204, 124, 34, 24, 10)}" fill="url(#${u}fur)" stroke="#E3E7EF" stroke-width="2"/>
        <path d="${fluff(56, 142, 30, 12, 9)}" fill="#FFFFFF" stroke="#E3E7EF" stroke-width="2"/>
        <path d="${fluff(94, 146, 30, 11, 9)}" fill="#FFFFFF" stroke="#E3E7EF" stroke-width="2"/>
        <path d="M36 146 v6 M46 147 v6 M76 150 v6 M86 151 v6" stroke="#D5DAE4" stroke-width="2.5" stroke-linecap="round"/>
        <path d="${fluff(74, 98, 48, 48, 16)}" fill="url(#${u}fur)" stroke="#E3E7EF" stroke-width="2"/>
        <g class="doghead" style="transform-box:fill-box;transform-origin:60% 90%">
          <path d="M46 26 L34 -22 Q46 -26 66 8 Z" fill="#FFFFFF" stroke="#E3E7EF" stroke-width="2" stroke-linejoin="round"/>
          <path d="M47 16 L41 -10 Q48 -12 58 8 Z" fill="#FFC9D3"/>
          <path d="M84 8 L100 -32 Q112 -26 108 14 Z" fill="#F4F6FA" stroke="#E3E7EF" stroke-width="2" stroke-linejoin="round"/>
          <path d="M90 6 L100 -18 Q106 -14 104 8 Z" fill="#FFC9D3"/>
          <path d="${fluff(72, 34, 46, 40, 16)}" fill="url(#${u}furH)" stroke="#E3E7EF" stroke-width="2"/>
          <ellipse cx="58" cy="52" rx="24" ry="16" fill="#FFFFFF"/>
          <ellipse cx="40" cy="42" rx="11" ry="6" fill="#FF9DB0" opacity=".45"/>
          <ellipse cx="96" cy="40" rx="11" ry="6" fill="#FF9DB0" opacity=".45"/>
          <ellipse cx="52" cy="28" rx="5.5" ry="6.5" fill="#2B2323"/><circle cx="50" cy="26" r="2" fill="#fff"/>
          <ellipse cx="84" cy="26" rx="5.5" ry="6.5" fill="#2B2323"/><circle cx="82" cy="24" r="2" fill="#fff"/>
          <ellipse cx="48" cy="44" rx="7.5" ry="5.5" fill="#2B2323"/><ellipse cx="46" cy="42.5" rx="2.4" ry="1.5" fill="#fff" opacity=".8"/>
          <path d="M40 56 Q56 70 74 58" fill="#9A3F4A"/>
          <ellipse cx="57" cy="66" rx="7" ry="8" fill="#FF8FA3"/><path d="M57 60 v8" stroke="#E8707F" stroke-width="1.5"/>
          <path d="M40 56 Q56 70 74 58" fill="none" stroke="#2B2323" stroke-width="2.6" stroke-linecap="round"/>
        </g>
      </g>`;
  }

  // Positioned animated element (extras) helper
  const fx = (x, y, w, h, cls, inner, vb) => ({ x, y, w, h, cls, html: `<svg viewBox="${vb || `0 0 ${w} ${h}`}" preserveAspectRatio="xMidYMid meet">${inner}</svg>` });
  const fxHTML = (x, y, w, h, cls, html) => ({ x, y, w, h, cls, html });

  function birds() {
    return `<path class="wing" d="M4 20 Q18 4 32 18 Q46 4 60 20" fill="none" stroke="#3E5A74" stroke-width="5" stroke-linecap="round"/>`;
  }

  // ======================================================================
  // 1. Bedroom — late morning
  // ======================================================================
  function bedroom(u, sc = {}) {
    const r = rng(11);
    const defs = `<defs>
      ${lg(u + 'wall', [[0, '#FFF6EA'], [1, '#F7DFC4']])}
      ${lg(u + 'glass', [[0, '#8ED0FF'], [0.6, '#CDEBFF'], [1, '#FFF1D6']])}
      ${lg(u + 'floor', [[0, '#EBC293'], [1, '#D39A66']])}
      ${lg(u + 'curtain', [[0, '#FFD3D3'], [0.5, '#FFC0C6'], [1, '#FFD9D9']], 0, 0, 1, 0)}
      ${lg(u + 'beam', [[0, '#FFFBEA', 0.55], [1, '#FFFBEA', 0]])}
      ${lg(u + 'duvet', [[0, '#FFEBB0'], [1, '#FFD27A']])}
      ${lg(u + 'head', [[0, '#A8CCF0'], [1, '#79A7D8']])}
      ${lg(u + 'wood', [[0, '#EAC398'], [1, '#C98F5B']])}
      ${rg(u + 'sun', [[0, '#FFF6C4', 1], [1, '#FFF6C4', 0]])}
      ${rg(u + 'lamp', [[0, '#FFE7A3', 0.8], [1, '#FFE7A3', 0]])}
      ${glow(u + 'bulb', '#FFD66B')}
      <clipPath id="${u}win"><rect x="1334" y="134" width="452" height="422" rx="14"/></clipPath>
      <pattern id="${u}stripes" width="64" height="64" patternUnits="userSpaceOnUse"><rect width="32" height="64" fill="#F4D7B8" opacity=".35"/></pattern>
    </defs>`;

    // --- far: wall, window, door, decor ---
    let far = defs + `<rect width="2400" height="770" fill="url(#${u}wall)"/><rect width="2400" height="770" fill="url(#${u}stripes)"/>
      <rect width="2400" height="24" fill="#fff" opacity=".7"/>`;
    // window
    far += `<rect x="1310" y="120" width="500" height="470" rx="26" fill="#000" opacity=".06"/>
      <rect x="1310" y="110" width="500" height="470" rx="26" fill="#FFFFFF"/>
      <g clip-path="url(#${u}win)">
        <rect x="1334" y="134" width="452" height="422" fill="url(#${u}glass)"/>
        <circle cx="1700" cy="210" r="150" fill="url(#${u}sun)"/><circle cx="1700" cy="210" r="42" fill="#FFF8D8"/>
        ${cloud(1380, 250, 0.7)}${cloud(1580, 330, 0.5, '#fff', 0.9)}
        ${skyline(sc, 1640, 556, 250, '#A6C4E4', { filler: '#B9D2EC', seed: 3 })}
      </g>
      <rect x="1554" y="134" width="12" height="422" fill="#fff"/><rect x="1334" y="338" width="452" height="12" fill="#fff"/>
      <rect x="1290" y="566" width="540" height="26" rx="10" fill="#fff"/><rect x="1296" y="590" width="528" height="10" rx="5" fill="#000" opacity=".06"/>
      <path d="M1366 566 l6 -34 h38 l6 34 Z" fill="#E7875B"/><circle cx="1379" cy="522" r="14" fill="#7CC36B"/><circle cx="1398" cy="514" r="16" fill="#8BD27A"/><circle cx="1392" cy="530" r="12" fill="#64AE58"/>`;
    // curtains + rod
    far += `<rect x="1206" y="86" width="708" height="14" rx="7" fill="#D9A45B"/><circle cx="1206" cy="93" r="13" fill="#E5B56E"/><circle cx="1914" cy="93" r="13" fill="#E5B56E"/>
      <path d="M1222 100 H1372 C1360 260 1330 360 1300 430 C1330 500 1350 560 1360 660 H1222 Z" fill="url(#${u}curtain)" opacity=".92"/>
      <path d="M1898 100 H1748 C1760 260 1790 360 1820 430 C1790 500 1770 560 1760 660 H1898 Z" fill="url(#${u}curtain)" opacity=".92"/>
      <path d="M1250 110 V650 M1290 110 C1285 250 1270 360 1262 430 M1870 110 V650 M1830 110 C1835 250 1850 360 1858 430" stroke="#F4A9B2" stroke-width="5" opacity=".6" fill="none"/>
      <rect x="1282" y="420" width="46" height="18" rx="9" fill="#F48A9B"/><rect x="1792" y="420" width="46" height="18" rx="9" fill="#F48A9B"/>`;
    // wall clock (10:30)
    far += `<circle cx="520" cy="236" r="70" fill="#000" opacity=".06"/><circle cx="516" cy="228" r="70" fill="#FF9F80"/><circle cx="516" cy="228" r="56" fill="#FFF9F0"/>
      ${[...Array(12)].map((_, i) => { const a = i * Math.PI / 6; return `<circle cx="${516 + Math.sin(a) * 46}" cy="${228 - Math.cos(a) * 46}" r="${i % 3 ? 3 : 5}" fill="#E07A5F"/>`; }).join('')}
      <line x1="516" y1="228" x2="${516 + Math.sin(Math.PI * 2 * 10.5 / 12) * 28}" y2="${228 - Math.cos(Math.PI * 2 * 10.5 / 12) * 28}" stroke="#4A3A34" stroke-width="7" stroke-linecap="round"/>
      <line x1="516" y1="228" x2="516" y2="268" stroke="#4A3A34" stroke-width="5" stroke-linecap="round"/><circle cx="516" cy="228" r="7" fill="#E07A5F"/>`;
    // fairy lights
    let fl = `<path d="M640 150 Q900 250 1180 150" stroke="#8D7A6A" stroke-width="3" fill="none"/>`;
    for (let i = 1; i < 12; i++) {
      const t = i / 12, bx = 640 + 540 * t, by = 150 + 4 * 100 * t * (1 - t) * 1.0 + 6;
      fl += `<circle cx="${bx}" cy="${by + 8}" r="24" fill="url(#${u}bulb)" class="twinkle" style="animation-delay:${(i * 0.37) % 2}s"/><circle cx="${bx}" cy="${by + 8}" r="7" fill="#FFE08A"/>`;
    }
    far += fl;
    // frames
    far += `<g transform="rotate(-4 930 320)"><rect x="866" y="244" width="130" height="150" rx="8" fill="#fff"/><rect x="878" y="256" width="106" height="104" fill="#FFE1E8"/>
        <path d="M931 336 C900 314 896 290 914 284 C924 281 931 290 931 296 C931 290 938 281 948 284 C966 290 962 314 931 336 Z" fill="#FF6B8B"/>
        <text x="931" y="384" text-anchor="middle" class="svg-hand" font-size="16" fill="#C2566E"${fitText(label(sc, 'frame', '我们', 'us'), 100, 16)}>${esc(label(sc, 'frame', '我们', 'us'))}</text></g>
      <g transform="rotate(4 1060 330)"><rect x="1010" y="270" width="104" height="124" rx="8" fill="#fff"/><rect x="1020" y="280" width="84" height="84" fill="#DDF0FF"/>
        ${skyline(sc, 1080, 360, 70, '#7FA8D6', { seed: 2, filler: '#A9C8EA' })}</g>`;
    // door
    far += `<rect x="2070" y="236" width="244" height="534" rx="14" fill="#fff"/><rect x="2088" y="254" width="208" height="516" rx="8" fill="url(#${u}wood)"/>
      <rect x="2110" y="282" width="164" height="190" rx="10" fill="#000" opacity=".06"/><rect x="2110" y="498" width="164" height="236" rx="10" fill="#000" opacity=".06"/>
      <circle cx="2268" cy="520" r="12" fill="#E7B458"/>
      <path d="M2192 300 l-40 40" stroke="#B0845A" stroke-width="3"/><path d="M2192 300 l40 40" stroke="#B0845A" stroke-width="3"/>
      <rect x="2132" y="338" width="120" height="54" rx="12" fill="#FFF6E6"/><text x="2192" y="374" text-anchor="middle" class="svg-hand" font-size="24" fill="#E07A5F"${fitText(label(sc, 'door', '今天放假', 'Day off'), 110, 24)}>${esc(label(sc, 'door', '今天放假', 'Day off'))}</text>`;
    // wall shelf
    far += `<rect x="170" y="330" width="260" height="14" rx="6" fill="#D9A774"/>
      <path d="M200 330 l8 -40 h40 l8 40 Z" fill="#FFFFFF"/><circle cx="228" cy="280" r="22" fill="#86C979"/>
      <rect x="290" y="270" width="24" height="60" rx="4" fill="#F6A6B2"/><rect x="318" y="282" width="20" height="48" rx="4" fill="#9CC9F0"/><rect x="342" y="276" width="22" height="54" rx="4" fill="#FFD27A"/>`;

    // --- near: floor + furniture + bed ---
    let near = defs + `<rect y="742" width="2400" height="258" fill="url(#${u}floor)"/>`;
    [790, 848, 920].forEach((y, i) => {
      near += `<line x1="0" y1="${y}" x2="2400" y2="${y}" stroke="#B87D4B" stroke-width="${2 + i}" opacity=".35"/>`;
      for (let x = (i * 137) % 260; x < 2400; x += 260 + (i * 40)) near += `<line x1="${x}" y1="${[742, 790, 848][i]}" x2="${x}" y2="${y}" stroke="#B87D4B" stroke-width="2" opacity=".3"/>`;
    });
    near += `<rect y="728" width="2400" height="22" fill="#FFFFFF"/><rect y="748" width="2400" height="6" fill="#000" opacity=".06"/>`;
    // rug
    near += `<ellipse cx="1360" cy="880" rx="560" ry="74" fill="#F4B6C2"/><ellipse cx="1360" cy="876" rx="500" ry="56" fill="none" stroke="#FFE3EA" stroke-width="6" stroke-dasharray="4 14" stroke-linecap="round"/>`;
    // dresser
    near += `<ellipse cx="490" cy="770" rx="180" ry="14" fill="#000" opacity=".08"/>
      <rect x="330" y="560" width="320" height="206" rx="16" fill="url(#${u}wood)"/>
      ${[590, 650, 710].map(y => `<rect x="352" y="${y}" width="276" height="48" rx="10" fill="#F2D2AC"/><circle cx="490" cy="${y + 24}" r="7" fill="#B07A48"/>`).join('')}
      <rect x="360" y="518" width="80" height="14" rx="4" fill="#9CC9F0"/><rect x="366" y="504" width="70" height="14" rx="4" fill="#F7A6BA"/><rect x="362" y="532" width="84" height="28" rx="4" fill="#FFD27A"/>
      <path d="M560 560 q-12 -30 0 -60 h40 q12 30 0 60 Z" fill="#CDE8F7" opacity=".9"/>
      <path d="M580 500 q-6 -40 -20 -60 M580 500 q2 -44 14 -64 M580 500 q10 -30 32 -46" stroke="#6BAF5F" stroke-width="5" fill="none"/>
      <circle cx="560" cy="440" r="14" fill="#FF7F9D"/><circle cx="594" cy="436" r="14" fill="#FFB347"/><circle cx="612" cy="454" r="13" fill="#FF7F9D"/>`;
    // monstera
    near += `<ellipse cx="800" cy="770" rx="80" ry="12" fill="#000" opacity=".08"/>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 100%">
      <path d="M800 650 C760 560 700 520 660 520 C660 580 720 640 800 660 Z" fill="#4E9E5A"/>
      <path d="M800 650 C840 540 900 500 950 500 C950 580 880 640 800 660 Z" fill="#5DB36A"/>
      <path d="M800 650 C790 540 800 460 830 420 C860 480 840 580 800 660 Z" fill="#6CC079"/>
      <path d="M800 650 C760 600 700 610 670 640 C720 670 770 670 800 660 Z" fill="#3F8A4C"/>
      <path d="M680 540 L760 620 M930 520 L850 620 M826 450 L806 600" stroke="#8AD694" stroke-width="4" opacity=".7"/></g>
      <path d="M740 650 h120 l-14 118 h-92 Z" fill="#FFFFFF"/><path d="M740 650 h120 l-3 22 h-114 Z" fill="#E8E2DA"/>`;
    // nightstand + lamp + alarm clock
    near += `<ellipse cx="1066" cy="770" rx="96" ry="12" fill="#000" opacity=".08"/>
      <rect x="990" y="610" width="152" height="150" rx="14" fill="url(#${u}wood)"/><rect x="1006" y="632" width="120" height="50" rx="8" fill="#F2D2AC"/><circle cx="1066" cy="657" r="6" fill="#B07A48"/>
      <circle cx="1020" cy="520" r="120" fill="url(#${u}lamp)"/>
      <rect x="1014" y="560" width="12" height="50" fill="#D9A45B"/><ellipse cx="1020" cy="608" rx="30" ry="7" fill="#D9A45B"/>
      <path d="M986 562 L1054 562 L1040 500 L1000 500 Z" fill="#FFE6A8"/>
      <g class="ring" style="transform-box:fill-box;transform-origin:50% 100%">
        <circle cx="1090" cy="572" r="11" fill="#FF6B6B"/><circle cx="1122" cy="572" r="11" fill="#FF6B6B"/>
        <circle cx="1106" cy="590" r="24" fill="#FF6B6B"/><circle cx="1106" cy="590" r="18" fill="#fff"/>
        <text x="1106" y="596" text-anchor="middle" font-size="12" font-weight="700" fill="#E0533D">10:30</text></g>`;
    // bed
    near += `<ellipse cx="1520" cy="800" rx="400" ry="18" fill="#000" opacity=".1"/>
      <rect x="1150" y="470" width="70" height="310" rx="30" fill="url(#${u}head)"/>
      ${[520, 590, 660].map(y => `<circle cx="1185" cy="${y}" r="5" fill="#6A96C8"/>`).join('')}
      <rect x="1176" y="772" width="20" height="30" rx="6" fill="#B07A48"/><rect x="1850" y="772" width="20" height="30" rx="6" fill="#B07A48"/>
      <rect x="1170" y="684" width="720" height="98" rx="20" fill="url(#${u}wood)"/>
      <rect x="1180" y="650" width="700" height="48" rx="20" fill="#FFFFFF"/>
      <rect x="1848" y="600" width="50" height="186" rx="22" fill="url(#${u}wood)"/>`;
    // sleeping state: heads on pillows + duvet with two lumps
    near += `<g class="bed-sleep">
        <path d="M1206 606 q-6 -44 40 -46 h110 q34 0 30 44 q0 30 -40 30 h-110 q-30 0 -30 -28 Z" fill="#FFFFFF"/>
        <g transform="translate(1238 560) scale(.62)">${window.TripCouple ? window.TripCouple.sleepingHeads(u + 'sh') : ''}</g>
        <path class="breathe" style="transform-box:fill-box;transform-origin:50% 100%" d="M1292 660 C1300 610 1350 596 1420 606 C1470 580 1540 590 1580 620 C1680 610 1780 620 1860 640 L1862 748 Q1560 770 1260 748 Q1256 700 1292 660 Z" fill="url(#${u}duvet)"/>
        <path d="M1300 700 Q1560 720 1856 690" stroke="#FFF4CF" stroke-width="6" fill="none" opacity=".8"/>
        ${[...Array(7)].map((_, i) => `<path transform="translate(${1370 + i * 70} ${672 + (i % 2) * 22}) scale(.5)" d="M0 10 C-14 0 -14 -12 -6 -14 C-2 -15 0 -12 0 -9 C0 -12 2 -15 6 -14 C14 -12 14 0 0 10 Z" fill="#FF9DB0" opacity=".8"/>`).join('')}
      </g>
      <g class="bed-awake">
        <path d="M1204 610 q-4 -40 40 -42 h112 q30 0 28 40 q-2 28 -36 28 h-112 q-30 0 -32 -26 Z" fill="#FFFFFF"/><path d="M1260 604 q40 12 80 0" stroke="#E8E8F0" stroke-width="5" fill="none"/>
        <rect x="1390" y="640" width="440" height="30" rx="14" fill="#DDEBFA"/>
        <path d="M1560 700 C1570 630 1640 610 1720 616 C1790 612 1860 630 1862 660 L1862 748 Q1700 768 1540 748 Q1530 720 1560 700 Z" fill="url(#${u}duvet)"/>
        <path d="M1566 668 Q1700 650 1856 664" stroke="#FFF4CF" stroke-width="6" fill="none"/>
      </g>`;
    // cat at the foot of the bed
    near += `<g transform="translate(1720 610)">
        <ellipse cx="44" cy="30" rx="62" ry="32" fill="#F4A259"/><path d="M92 36 q34 -4 22 -36" stroke="#F4A259" stroke-width="14" fill="none" stroke-linecap="round" class="tail" style="transform-box:fill-box;transform-origin:0% 100%"/>
        <path d="M10 22 q30 -12 70 0" stroke="#E08A3E" stroke-width="6" fill="none"/><path d="M20 40 q30 -8 60 2" stroke="#E08A3E" stroke-width="6" fill="none"/>
        <circle cx="0" cy="20" r="28" fill="#F6B06A"/><path d="M-22 4 l-4 -30 l22 16 Z M14 2 l10 -28 l8 30 Z" fill="#F6B06A"/>
        <path d="M-14 22 q6 5 12 0 M8 22 q6 5 12 0" stroke="#5A3A2A" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="3" cy="30" r="3" fill="#E07A7A"/></g>`;
    // slippers
    near += `<g><ellipse cx="1300" cy="912" rx="34" ry="14" fill="#9CC9F0"/><ellipse cx="1350" cy="920" rx="34" ry="14" fill="#9CC9F0"/><path d="M1280 906 q20 -14 40 0 M1330 914 q20 -14 40 0" stroke="#fff" stroke-width="8" fill="none" stroke-linecap="round"/>
      <ellipse cx="1430" cy="920" rx="30" ry="12" fill="#F7A6BA"/><ellipse cx="1474" cy="912" rx="30" ry="12" fill="#F7A6BA"/><circle cx="1422" cy="912" r="6" fill="#fff"/><circle cx="1466" cy="904" r="6" fill="#fff"/></g>`;
    // light beams
    near += `<g class="beam"><path d="M1340 590 L1560 590 L1300 1000 L880 1000 Z" fill="url(#${u}beam)"/><path d="M1600 590 L1780 590 L1650 1000 L1340 1000 Z" fill="url(#${u}beam)" opacity=".8"/></g>`;

    // --- front ---
    let front = defs + `<ellipse cx="190" cy="990" rx="150" ry="18" fill="#000" opacity=".12"/>
      <path d="M110 1000 l20 -120 h120 l20 120 Z" fill="#F2F2F2"/>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 100%">
        <path d="M190 880 C120 760 40 740 0 760 C30 840 120 880 190 890 Z" fill="#3C8A4A"/>
        <path d="M190 880 C230 740 320 700 380 720 C360 820 260 880 190 890 Z" fill="#4DA05A"/>
        <path d="M190 880 C170 740 190 640 230 600 C270 680 240 800 190 890 Z" fill="#5BB068"/></g>
      <g transform="translate(2060 860)"><ellipse cx="60" cy="130" rx="110" ry="16" fill="#000" opacity=".12"/>
        <path d="M-10 40 h150 l-14 90 h-122 Z" fill="#E9C28F"/><path d="M-10 40 h150" stroke="#C99A64" stroke-width="10"/>
        <circle cx="40" cy="10" r="34" fill="#C58B5C"/><circle cx="16" cy="-18" r="12" fill="#C58B5C"/><circle cx="64" cy="-18" r="12" fill="#C58B5C"/>
        <circle cx="28" cy="6" r="4" fill="#3A2A20"/><circle cx="52" cy="6" r="4" fill="#3A2A20"/><ellipse cx="40" cy="20" rx="10" ry="7" fill="#F2D2AC"/>
        <circle cx="100" cy="20" r="30" fill="#9CC9F0"/><circle cx="100" cy="20" r="18" fill="#fff" opacity=".4"/></g>`;

    const extras = [
      fxHTML(1290, 330, 200, 240, 'zzz only-sleep', '<span>Z</span><span>z</span><span>z</span>'),
      ...[...Array(7)].map(() => fx(1000 + r() * 700, 620 + r() * 300, 14, 14, 'dust', `<circle cx="7" cy="7" r="5" fill="#FFF7D6"/>`)),
    ];
    extras.forEach((e, i) => { if (e.cls === 'dust') e.style = `animation-delay:${-i * 0.9}s`; });

    return {
      sky: 'linear-gradient(#FFF6EA, #F7DFC4)',
      layers: [
        { depth: 0.35, svg: far },
        { depth: 1, svg: near, extras },
        ...(sc.pet === 'samoyed' || sc.pet === 'dog' ? [{ depth: 1, svg: samoyed(u + 'dog', 1330, 792), front: true, prop: 'pet' }] : []),
        { depth: 1.3, svg: front, front: true },
      ],
    };
  }

  // ======================================================================
  // 1b. 楼下路口 — Shanghai street corner at noon (choose how to travel)
  // ======================================================================
  function bike(x, y, color, s = 1) {
    return `<g transform="translate(${x} ${y}) scale(${s})">
      <ellipse cx="110" cy="158" rx="130" ry="10" fill="#000" opacity=".12"/>
      <circle cx="30" cy="110" r="46" fill="none" stroke="#333" stroke-width="10"/><circle cx="190" cy="110" r="46" fill="none" stroke="#333" stroke-width="10"/>
      <circle cx="30" cy="110" r="8" fill="#999"/><circle cx="190" cy="110" r="8" fill="#999"/>
      <path d="M30 110 L90 40 L160 40 L190 110 M90 40 L110 110 L160 40 M110 110 L30 110" stroke="${color}" stroke-width="12" fill="none" stroke-linejoin="round"/>
      <path d="M80 30 h36" stroke="#333" stroke-width="12" stroke-linecap="round"/><path d="M160 40 L150 0 h30" stroke="${color}" stroke-width="10" fill="none" stroke-linecap="round"/>
      <rect x="170" y="-8" width="54" height="36" rx="6" fill="${color}"/><rect x="176" y="-2" width="42" height="24" rx="4" fill="#fff" opacity=".35"/></g>`;
  }

  function shikumen(x, w, u, r) {
    const top = 330, base = 770, doorW = 150, dx = x + w / 2 - doorW / 2;
    let s = `<g>
      <rect x="${x}" y="${top}" width="${w}" height="${base - top}" fill="url(#${u}brick)"/>
      ${[...Array(12)].map((_, i) => `<line x1="${x}" y1="${top + 30 + i * 36}" x2="${x + w}" y2="${top + 30 + i * 36}" stroke="#6F7680" stroke-width="2" opacity=".35"/>`).join('')}
      <path d="M${x - 24} ${top + 6} L${x + w / 2} ${top - 70} L${x + w + 24} ${top + 6} Z" fill="#3E3A40"/>
      <path d="M${x - 24} ${top + 6} H${x + w + 24}" stroke="#2A272C" stroke-width="10" stroke-linecap="round"/>`;
    // upstairs windows with shutters + laundry pole
    [x + 50, x + w - 140].forEach((wx) => {
      s += `<rect x="${wx}" y="${top + 50}" width="90" height="100" rx="6" fill="#F2E6CF"/><rect x="${wx + 8}" y="${top + 58}" width="74" height="84" fill="url(#${u}glass)"/>
        <rect x="${wx - 26}" y="${top + 50}" width="26" height="100" rx="3" fill="#7A4B32"/><rect x="${wx + 90}" y="${top + 50}" width="26" height="100" rx="3" fill="#7A4B32"/>`;
    });
    s += `<line x1="${x + 20}" y1="${top + 175}" x2="${x + w - 20}" y2="${top + 168}" stroke="#B89A6A" stroke-width="5"/>`;
    for (let k = 0; k < 4; k++) {
      const cx = x + 60 + k * (w - 120) / 3, c = ['#FF8FA3', '#8EC3EC', '#FFD166', '#FFFFFF'][Math.floor(r() * 4)];
      s += `<path class="laundry" style="transform-box:fill-box;transform-origin:50% 0%;animation-delay:${-k * 0.7}s" d="M${cx - 22} ${top + 172} h44 l6 54 h-56 Z" fill="${c}"/>`;
    }
    // 石库门 stone gate with black lacquer doors
    s += `<rect x="${dx - 26}" y="${base - 250}" width="${doorW + 52}" height="250" fill="#D9D2C4"/>
      <path d="M${dx - 40} ${base - 250} Q${dx + doorW / 2} ${base - 330} ${dx + doorW + 40} ${base - 250} Z" fill="#CFC6B6"/>
      <rect x="${dx - 40}" y="${base - 262}" width="${doorW + 80}" height="16" rx="4" fill="#BFB5A3"/>
      <rect x="${dx}" y="${base - 210}" width="${doorW}" height="210" fill="#2B2523"/>
      <line x1="${dx + doorW / 2}" y1="${base - 210}" x2="${dx + doorW / 2}" y2="${base}" stroke="#46403D" stroke-width="4"/>
      <circle cx="${dx + doorW / 2 - 16}" cy="${base - 110}" r="8" fill="none" stroke="#D9A45B" stroke-width="4"/><circle cx="${dx + doorW / 2 + 16}" cy="${base - 110}" r="8" fill="none" stroke="#D9A45B" stroke-width="4"/>
    </g>`;
    return s;
  }

  function street(u, sc = {}) {
    const r = rng(61);
    const defs = `<defs>
      ${lg(u + 'brick', [[0, '#A4AAB2'], [1, '#858C96']])}
      ${lg(u + 'walk', [[0, '#E8E2DA'], [1, '#D2CABF']])}
      ${lg(u + 'road', [[0, '#62676F'], [1, '#474B52']])}
      ${lg(u + 'taxi', [[0, '#5AD8C9'], [1, '#1F9E8F']])}
      ${lg(u + 'glass', [[0, '#DDF3FF'], [1, '#98CDE8']])}
      ${lg(u + 'lane', [[0, '#EFE7DA'], [1, '#D8CDBB']])}
      ${rg(u + 'leaf', [[0, '#A6DB84'], [0.6, '#76BF63'], [1, '#5AA553']], 0.4, 0.3, 0.7)}
      ${rg(u + 'sun', [[0, '#FFF7CF', 1], [0.3, '#FFF1B0', 0.6], [1, '#FFF1B0', 0]])}
      ${glow(u + 'lamp', '#FFE9A0')}
    </defs>`;

    let far = defs + `<circle cx="1950" cy="150" r="230" fill="url(#${u}sun)"/><circle cx="1950" cy="150" r="58" fill="#FFF8DC"/>`;
    far += skyline(sc, 900, 560, 300, '#B7CCE0', { filler: '#C6D7E8', seed: 17 });
    far += skyline(sc, 2250, 560, 220, '#C2D4E6', { filler: '#CFDDEC', seed: 18 });

    // lane houses + the 幸福里 arch the couple stands in front of
    let mid = defs + shikumen(40, 440, u, r) + shikumen(560, 430, u, r) + shikumen(1460, 430, u, r) + shikumen(1970, 440, u, r);
    mid += `<g>
      <rect x="1010" y="440" width="370" height="330" fill="url(#${u}lane)"/>
      <rect x="1120" y="470" width="150" height="300" fill="#CDBFA8"/>
      <path d="M1120 470 L1195 400 L1270 470 Z" fill="#5A5156"/>
      ${[0, 1, 2].map((k) => `<rect x="${1136 + k * 44}" y="${500 + (k % 2) * 30}" width="30" height="40" rx="4" fill="#F7EEDC"/>`).join('')}
      <rect x="990" y="400" width="60" height="370" fill="#8F857C"/><rect x="1340" y="400" width="60" height="370" fill="#8F857C"/>
      ${[...Array(9)].map((_, i) => `<line x1="990" y1="${420 + i * 40}" x2="1050" y2="${420 + i * 40}" stroke="#766D65" stroke-width="2"/><line x1="1340" y1="${420 + i * 40}" x2="1400" y2="${420 + i * 40}" stroke="#766D65" stroke-width="2"/>`).join('')}
      <rect x="970" y="366" width="450" height="46" rx="6" fill="#7E746B"/>
      <rect x="1110" y="372" width="170" height="34" rx="4" fill="#2B2523"/><rect x="1115" y="377" width="160" height="24" rx="3" fill="none" stroke="#E8B04A" stroke-width="2"/>
      <text x="1195" y="398" text-anchor="middle" class="svg-hand" font-size="24" fill="#F2C766"${fitText(label(sc, 'arch', '', ''), 150, 24)}>${esc(label(sc, 'arch', '', ''))}</text>
    </g>`;

    let near = defs + `<rect y="760" width="2400" height="120" fill="url(#${u}walk)"/>`;
    for (let x = 0; x < 2400; x += 80) near += `<line x1="${x}" y1="760" x2="${x - 20}" y2="872" stroke="#BDB3A6" stroke-width="2" opacity=".6"/>`;
    near += `<line x1="0" y1="812" x2="2400" y2="812" stroke="#BDB3A6" stroke-width="2" opacity=".5"/>
      <rect y="868" width="2400" height="14" fill="#B8AFA2"/><rect y="880" width="2400" height="120" fill="url(#${u}road)"/>
      ${[...Array(16)].map((_, i) => `<rect x="${i * 160 + 30}" y="946" width="90" height="8" rx="4" fill="#F2F2F2" opacity=".8"/>`).join('')}`;
    near += planeTree(360, 800, 0.95, u + 'leaf') + planeTree(2120, 800, 1.0, u + 'leaf');
    // metro entrance + sign
    near += `<g>
      <path d="M640 780 h260 l-20 -40 h-220 Z" fill="#6B737C"/>
      <rect x="650" y="600" width="240" height="140" rx="8" fill="url(#${u}glass)" opacity=".55"/>
      <path d="M640 600 h260" stroke="#5C6670" stroke-width="10" stroke-linecap="round"/>
      <rect x="664" y="700" width="212" height="72" fill="#2E3238"/>
      ${[0, 1, 2, 3].map((k) => `<rect x="${676 + k * 10}" y="${708 + k * 16}" width="${188 - k * 20}" height="6" fill="#565C64"/>`).join('')}
    </g>
    <g class="metro-sign" style="transform-box:fill-box;transform-origin:50% 100%">
      <rect x="1006" y="570" width="12" height="250" rx="5" fill="#5C6670"/>
      <rect x="956" y="500" width="112" height="84" rx="12" fill="#1E5AA8"/><rect x="962" y="506" width="100" height="72" rx="9" fill="none" stroke="#fff" stroke-width="2" opacity=".6"/>
      <text x="1012" y="542" text-anchor="middle" class="svg-hand" font-size="30" fill="#fff"${fitText(label(sc, 'metro', '地铁', 'Metro'), 96, 30)}>${esc(label(sc, 'metro', '地铁', 'Metro'))}</text>
      <text x="1012" y="568" text-anchor="middle" font-size="16" font-weight="700" fill="#CFE3FF"${fitText(label(sc, 'metroSub', 'Metro ↓', 'Subway ↓'), 96, 16)}>${esc(label(sc, 'metroSub', 'Metro ↓', 'Subway ↓'))}</text>
    </g>
    <g class="bus-sign" style="transform-box:fill-box;transform-origin:50% 100%">
      <rect x="1384" y="560" width="12" height="260" rx="5" fill="#5C6670"/>
      <rect x="1340" y="500" width="100" height="92" rx="10" fill="#FAFAFA"/><rect x="1340" y="500" width="100" height="26" rx="10" fill="#E0533D"/><rect x="1340" y="514" width="100" height="12" fill="#E0533D"/>
      <text x="1390" y="520" text-anchor="middle" font-size="16" font-weight="800" fill="#fff"${fitText(label(sc, 'busHead', 'BUS', 'BUS'), 90, 16)}>${esc(label(sc, 'busHead', 'BUS', 'BUS'))}</text>
      <text x="1390" y="556" text-anchor="middle" class="svg-hand" font-size="26" fill="#E0533D"${fitText(label(sc, 'bus', '公交', ''), 90, 26)}>${esc(label(sc, 'bus', '公交', ''))}</text>
      <text x="1390" y="580" text-anchor="middle" font-size="14" font-weight="700" fill="#7C6470"${fitText(label(sc, 'busTo', '', ''), 90, 14)}>${esc(label(sc, 'busTo', '', ''))}</text>
    </g>`;
    // taxi waiting at the curb (faces left, towards the couple)
    // data-drive/data-x: when she picks this option the whole group drives into view (main.js driveIn); x = its left edge
    near += `<g class="drive" data-drive="taxi" data-x="1518"><g class="taxi" style="transform-box:fill-box;transform-origin:50% 100%"><g transform="translate(1500 824)">
      <ellipse cx="190" cy="150" rx="186" ry="12" fill="#000" opacity=".22"/>
      <path d="M20 112 Q18 72 62 66 L112 62 L152 20 Q162 12 182 12 L272 12 Q292 12 302 22 L340 64 Q372 68 374 102 L374 120 Q374 130 362 130 L30 130 Q18 130 20 112 Z" fill="url(#${u}taxi)"/>
      <path d="M162 28 L138 62 L222 62 L222 28 Z" fill="url(#${u}glass)"/><path d="M234 28 L234 62 L322 64 L296 30 Z" fill="url(#${u}glass)"/>
      <path d="M228 26 V126" stroke="#17877A" stroke-width="3"/>
      <rect x="24" y="88" width="348" height="10" fill="#fff" opacity=".85"/>
      <rect x="198" y="-6" width="62" height="20" rx="6" fill="#FFD84A"/><text x="229" y="9" text-anchor="middle" font-size="13" font-weight="900" fill="#2B2523"${fitText(label(sc, 'taxi', 'TAXI', 'TAXI'), 56, 13)}>${esc(label(sc, 'taxi', 'TAXI', 'TAXI'))}</text>
      <ellipse class="headlight" cx="28" cy="100" rx="9" ry="7" fill="#FFF6C4"/><rect x="362" y="94" width="10" height="14" rx="3" fill="#E0533D"/>
      <circle cx="92" cy="130" r="30" fill="#2B2523"/><circle cx="92" cy="130" r="13" fill="#CFCFD6"/>
      <circle cx="298" cy="130" r="30" fill="#2B2523"/><circle cx="298" cy="130" r="13" fill="#CFCFD6"/>
    </g></g></g>`;
    near += `<g class="drive" data-drive="bike" data-x="1880"><g class="bikes" style="transform-box:fill-box;transform-origin:50% 100%">${bike(1900, 668, '#FFB21E', 0.9)}${bike(2090, 672, '#3FA7D6', 0.9)}</g></g>`;

    let front = defs + `<g><rect x="184" y="520" width="16" height="480" rx="6" fill="#4A525B"/>
      <rect x="160" y="440" width="64" height="150" rx="14" fill="#2F353C"/>
      <circle cx="192" cy="472" r="18" fill="#5A2222"/><circle cx="192" cy="515" r="18" fill="#5A4A22"/><circle cx="192" cy="558" r="18" fill="#3BE07A"/>
      <circle cx="192" cy="558" r="40" fill="url(#${u}lamp)" opacity=".5"/></g>`;

    const extras = [
      fx(300, 170, 260, 110, 'cloud-drift', cloud(20, 70, 1.3)),
      fx(1250, 120, 220, 90, 'cloud-drift slow', cloud(20, 60, 1.0)),
      fx(600, 220, 64, 30, 'bird', birds()),
    ];

    return {
      sky: 'linear-gradient(180deg, #6CC0F2 0%, #A5D8F6 50%, #E2F3FB 80%, #FFF4DE 100%)',
      layers: [
        { depth: 0.05, svg: '', extras },
        { depth: 0.15, svg: far },
        { depth: 0.75, svg: mid },
        { depth: 1, svg: near },
        { depth: 1.35, svg: front, front: true },
      ],
    };
  }

  // ======================================================================
  // 2. 徐汇滨江 — riverside afternoon
  // ======================================================================
  function riverside(u, sc = {}) {
    const r = rng(23);
    const defs = `<defs>
      ${lg(u + 'river', [[0, '#7CC5DE'], [0.5, '#4FA3C9'], [1, '#3B8DB8']])}
      ${lg(u + 'bank', [[0, '#9FD17F'], [1, '#79B864']])}
      ${lg(u + 'walk', [[0, '#EFDFC5'], [1, '#DCC4A0']])}
      ${lg(u + 'tank', [[0, '#FFFFFF'], [0.6, '#E6E9EC'], [1, '#C9CED4']], 0, 0, 1, 0)}
      ${lg(u + 'arch', [[0, '#F4F7FA'], [1, '#C9D4DE']])}
      ${rg(u + 'leaf', [[0, '#A6DB84'], [0.6, '#76BF63'], [1, '#5AA553']], 0.4, 0.3, 0.7)}
      ${rg(u + 'sun', [[0, '#FFF7CF', 1], [0.3, '#FFF1B0', 0.6], [1, '#FFF1B0', 0]])}
    </defs>`;

    let far = defs + `<circle cx="1900" cy="190" r="240" fill="url(#${u}sun)"/><circle cx="1900" cy="190" r="62" fill="#FFF8DC"/>`;
    far += skyline(sc, 2200, 596, 330, '#A9C2D9', { filler: '#B9CFE2', seed: 5 });
    far += `<path d="M0 600 Q300 586 600 594 T1200 590 T1800 596 T2400 590 V620 H0 Z" fill="#A7C4B4"/>`;
    for (let i = 0; i < 26; i++) { const bx = i * 95 + r() * 40, bh = 20 + r() * 40; far += `<rect x="${bx}" y="${596 - bh}" width="${50 + r() * 30}" height="${bh}" fill="#B6CADB" opacity=".8"/>`; }
    // Lupu Bridge (卢浦大桥); `bridge: false` on the stop leaves it out
    if (sc.bridge !== false) far += `<g>
      <rect x="0" y="512" width="1760" height="18" fill="#D4DEE7"/><rect x="0" y="528" width="1760" height="8" fill="#AFBFCC"/>
      ${[...Array(19)].map((_, i) => { const x = 440 + i * 50; const t = (x - 380) / 960; const y = 598 - 4 * 300 * t * (1 - t); return y < 512 ? `<line x1="${x}" y1="${y}" x2="${x}" y2="512" stroke="#C3D0DB" stroke-width="4"/>` : ''; }).join('')}
      <path d="M380 600 Q860 0 1340 600" fill="none" stroke="url(#${u}arch)" stroke-width="30"/>
      <path d="M380 600 Q860 0 1340 600" fill="none" stroke="#B4C3D0" stroke-width="30" stroke-dasharray="4 40" opacity=".7"/>
      <path d="M410 600 Q860 40 1310 600" fill="none" stroke="#fff" stroke-width="5" opacity=".7"/>
      ${[120, 520, 1200, 1600].map(x => `<rect x="${x - 14}" y="530" width="28" height="70" fill="#B9C7D3"/>`).join('')}
      <text x="860" y="490" text-anchor="middle" class="svg-hand" font-size="26" fill="#9FB3C6" opacity=".9"${fitText(label(sc, 'bridge', '', ''), 420, 26)}>${esc(label(sc, 'bridge', '', ''))}</text></g>`;

    // mid: river + crane + tanks + bank
    let mid = defs + `<rect y="600" width="2400" height="160" fill="url(#${u}river)"/>`;
    for (let i = 0; i < 30; i++) mid += `<path d="M${r() * 2400} ${620 + r() * 70} h${30 + r() * 60}" stroke="#E6F7FF" stroke-width="4" stroke-linecap="round" opacity="${0.35 + r() * 0.4}"/>`;
    mid += `<path d="M0 700 Q600 684 1200 694 T2400 690 V770 H0 Z" fill="url(#${u}bank)"/>`;
    // Shanghai West Bund details (oil tanks, dock crane, old railway): on by default only with the
    // Shanghai skyline; `docks: true | false` on the stop overrides.
    const docks = sc.docks != null ? !!sc.docks : ((sc.skyline || CFG.skyline) === 'shanghai');
    // oil tanks (油罐艺术公园)
    if (docks) mid += `<g transform="translate(230 0)">
      <ellipse cx="400" cy="704" rx="240" ry="16" fill="#000" opacity=".08"/>
      <rect x="250" y="520" width="170" height="184" fill="url(#${u}tank)"/><ellipse cx="335" cy="520" rx="85" ry="22" fill="#F4F6F8"/><path d="M250 520 Q335 470 420 520" fill="#FFFFFF"/>
      <rect x="440" y="560" width="140" height="144" fill="url(#${u}tank)"/><ellipse cx="510" cy="560" rx="70" ry="18" fill="#F4F6F8"/><path d="M440 560 Q510 520 580 560" fill="#FFFFFF"/>
      <path d="M250 600 H420 M440 630 H580" stroke="#D5DADF" stroke-width="4"/>
</g>`;
    // gantry crane (塔吊)
    if (docks) mid += `<g>
      <path d="M1560 700 L1610 470 M1760 700 L1710 470 M1580 600 H1740 M1596 530 H1724" stroke="#D9543C" stroke-width="16" stroke-linecap="round"/>
      <path d="M1600 600 L1720 530 M1600 530 L1720 600" stroke="#B8432F" stroke-width="7"/>
      <rect x="1590" y="420" width="140" height="60" rx="8" fill="#E36B4F"/><rect x="1604" y="432" width="36" height="26" rx="4" fill="#CDEBFA"/>
      <path d="M1700 430 L2060 210 L2072 228 L1720 460 Z" fill="#D9543C"/>
      ${[...Array(8)].map((_, i) => { const x = 1720 + i * 42; const y = 450 - i * 26; return `<path d="M${x} ${y} l34 -30" stroke="#A63A28" stroke-width="4"/>`; }).join('')}
      <path d="M1620 420 L1680 330 L1700 420" fill="none" stroke="#D9543C" stroke-width="10"/><path d="M1680 330 L2060 214" stroke="#A63A28" stroke-width="3"/>
      <rect x="1560" y="440" width="40" height="40" rx="4" fill="#8C3324"/>
      <path d="M2040 226 V330" stroke="#555" stroke-width="3"/><path d="M2030 330 h20 v14 q-10 10 -20 0 Z" fill="#444"/></g>`;
    for (let i = 0; i < 9; i++) { const bx = 700 + i * 110 + r() * 40; mid += `<circle cx="${bx}" cy="${690}" r="${26 + r() * 18}" fill="#6DB35E"/><circle cx="${bx + 20}" cy="${682}" r="${18 + r() * 10}" fill="#86C874"/>`; }

    // near: promenade, rails, trees, bench, lamp, sign
    let near = defs + `<rect y="760" width="2400" height="240" fill="url(#${u}walk)"/>
      <rect y="760" width="2400" height="10" fill="#C9B18C"/>`;
    // railing
    near += `<g>${[...Array(31)].map((_, i) => `<rect x="${i * 80}" y="690" width="10" height="74" rx="4" fill="#F4F7F9"/>`).join('')}
      <rect y="690" width="2400" height="10" rx="5" fill="#FFFFFF"/><rect y="724" width="2400" height="6" fill="#E3E8EC"/></g>`;
    // railway (旧铁轨)
    if (docks) near += `<g>${[...Array(53)].map((_, i) => `<rect x="${i * 46}" y="866" width="22" height="50" rx="3" fill="#9A7658"/>`).join('')}
      <rect y="872" width="2400" height="8" fill="#7C8894"/><rect y="870" width="2400" height="3" fill="#D6DEE5"/>
      <rect y="900" width="2400" height="9" fill="#7C8894"/><rect y="898" width="2400" height="3" fill="#D6DEE5"/></g>`;
    for (let i = 0; i < 60; i++) near += `<circle cx="${r() * 2400}" cy="${930 + r() * 60}" r="${2 + r() * 3}" fill="#CBB18E" opacity=".7"/>`;
    // flowers along the railing base
    for (let i = 0; i < 40; i++) {
      const fx0 = r() * 2400;
      near += `<path d="M${fx0} 772 q4 -20 10 -26" stroke="#6DB35E" stroke-width="4" fill="none"/><circle cx="${fx0 + 10}" cy="745" r="6" fill="${['#FF8FA3', '#FFD166', '#FFFFFF', '#B8A1FF'][i % 4]}"/>`;
    }
    near += planeTree(250, 800, 1, u + 'leaf') + planeTree(2160, 800, 1.05, u + 'leaf');
    // bench
    near += `<g><ellipse cx="1560" cy="846" rx="130" ry="10" fill="#000" opacity=".1"/>
      <rect x="1440" y="752" width="240" height="16" rx="6" fill="#C98F5B"/><rect x="1440" y="774" width="240" height="16" rx="6" fill="#B87D4B"/>
      <rect x="1430" y="800" width="260" height="18" rx="6" fill="#D9A06B"/>
      <path d="M1460 816 v30 M1660 816 v30 M1460 760 v44 M1660 760 v44" stroke="#5C6670" stroke-width="8" stroke-linecap="round"/></g>`;
    // street lamp
    near += `<g><rect x="1790" y="380" width="14" height="440" rx="6" fill="#5C6670"/><path d="M1797 390 q0 -40 50 -40 h20" stroke="#5C6670" stroke-width="10" fill="none"/>
      <path d="M1850 344 h50 l-8 26 h-34 Z" fill="#48525C"/><ellipse cx="1875" cy="372" rx="16" ry="6" fill="#FFF3C4"/>
      <ellipse cx="1797" cy="822" rx="30" ry="6" fill="#000" opacity=".12"/></g>`;
    // wayfinding sign
    const wayName = label(sc, 'sign', '', ''), waySub = label(sc, 'signSub', '', '');
    if (wayName || waySub) near += `<g><rect x="680" y="610" width="12" height="210" fill="#5C6670"/><rect x="590" y="600" width="196" height="96" rx="14" fill="#2F6F8F"/>
      <text x="688" y="${waySub ? 640 : 657}" text-anchor="middle" class="svg-hand" font-size="26" fill="#fff"${fitText(wayName, 180, 26)}>${esc(wayName)}</text>
      <text x="688" y="676" text-anchor="middle" font-size="18" fill="#CDEBFA"${fitText(waySub, 180, 18)}>${esc(waySub)}</text></g>`;

    // front: shared bike + grass
    let front = defs + `<g transform="translate(420 800)">
      <ellipse cx="110" cy="158" rx="140" ry="12" fill="#000" opacity=".12"/>
      <circle cx="30" cy="110" r="46" fill="none" stroke="#333" stroke-width="10"/><circle cx="190" cy="110" r="46" fill="none" stroke="#333" stroke-width="10"/>
      <circle cx="30" cy="110" r="8" fill="#999"/><circle cx="190" cy="110" r="8" fill="#999"/>
      <path d="M30 110 L90 40 L160 40 L190 110 M90 40 L110 110 L160 40 M110 110 L30 110" stroke="#FFB21E" stroke-width="12" fill="none" stroke-linejoin="round"/>
      <path d="M80 30 h36" stroke="#333" stroke-width="12" stroke-linecap="round"/><path d="M160 40 L150 0 h30" stroke="#FFB21E" stroke-width="10" fill="none" stroke-linecap="round"/>
      <rect x="170" y="-8" width="54" height="36" rx="6" fill="#FFB21E"/><rect x="176" y="-2" width="42" height="24" rx="4" fill="#FFD36B"/></g>`;
    for (let i = 0; i < 22; i++) {
      const gx = 1860 + r() * 360;
      front += `<path d="M${gx} 1000 q${-8 + r() * 16} -60 ${-10 + r() * 20} -${60 + r() * 60}" stroke="${r() > 0.5 ? '#5FA84F' : '#78BF62'}" stroke-width="8" fill="none" stroke-linecap="round"/>`;
    }
    front += `<circle cx="1950" cy="900" r="16" fill="#fff" opacity=".9"/><circle cx="2080" cy="920" r="12" fill="#FFD166"/><circle cx="2140" cy="890" r="14" fill="#fff" opacity=".9"/>`;

    const extras = [
      fx(260, 200, 260, 110, 'cloud-drift', cloud(20, 70, 1.4)),
      fx(1000, 110, 220, 90, 'cloud-drift slow', cloud(20, 60, 1.1)),
      fx(1420, 250, 200, 80, 'cloud-drift', cloud(20, 56, 0.9, '#fff', 0.9)),
      fx(700, 170, 64, 30, 'bird', birds()), fx(790, 210, 48, 24, 'bird b2', birds(), '0 0 64 30'),
      fx(1250, 140, 90, 150, 'kite', `<path d="M45 4 L80 46 L45 96 L10 46 Z" fill="#FF6B8B"/><path d="M45 4 V96 M10 46 H80" stroke="#fff" stroke-width="3"/><path d="M45 96 q-12 16 4 30 q14 12 -2 22" stroke="#FF6B8B" stroke-width="3" fill="none"/>`),
    ];
    const midExtras = [
      fx(900, 610, 220, 90, 'boat', `<path d="M10 50 H210 L190 80 H30 Z" fill="#FFFFFF"/><rect x="10" y="60" width="200" height="6" fill="#3FA7D6"/><rect x="50" y="22" width="120" height="30" rx="8" fill="#FFFFFF"/>${[0, 1, 2, 3].map(i => `<rect x="${62 + i * 26}" y="30" width="16" height="12" rx="3" fill="#8EC3EC"/>`).join('')}<rect x="120" y="4" width="12" height="20" fill="#E0533D"/>`),
      ...[...Array(6)].map((_, i) => fx(120 + i * 390, 630 + (i % 3) * 22, 80, 12, 'shimmer', `<path d="M4 6 h72" stroke="#fff" stroke-width="5" stroke-linecap="round"/>`)),
    ];
    midExtras.forEach((e, i) => { if (e.cls === 'shimmer') e.style = `animation-delay:${-i * 0.6}s`; });

    return {
      sky: 'linear-gradient(180deg, #5DB6F0 0%, #97D1F5 42%, #D6EEF9 68%, #FFF1DA 100%)',
      layers: [
        { depth: 0.05, svg: '', extras },
        { depth: 0.15, svg: far },
        { depth: 0.45, svg: mid, extras: midExtras },
        { depth: 1, svg: near },
        { depth: 1.35, svg: front, front: true },
      ],
    };
  }

  // ======================================================================
  // 3. 城隍庙 / 豫园 — dusk
  // ======================================================================
  function yuyuan(u, sc = {}) {
    const r = rng(37);
    const defs = `<defs>
      ${lg(u + 'pond', [[0, '#7A5A96'], [0.5, '#5A4580'], [1, '#3A3060']])}
      ${lg(u + 'plaza', [[0, '#9A7E96'], [1, '#5E4A68']])}
      ${lg(u + 'wall', [[0, '#8A3A2E'], [1, '#6E2C24']])}
      ${lg(u + 'bridge', [[0, '#D9CBD6'], [1, '#A994AA']])}
      ${rg(u + 'sun', [[0, '#FFE3A1', 1], [0.35, '#FFB870', 0.7], [1, '#FF8A5C', 0]])}
      ${glow('lanternGlow', '#FFB050')}
      ${glow(u + 'win', '#FFC66B')}
    </defs>`;
    const roofC = '#3A3552', ridgeC = '#C99A4A';

    let far = defs + `<circle cx="700" cy="560" r="330" fill="url(#${u}sun)"/><circle cx="700" cy="560" r="96" fill="#FFD68A"/>
      <path d="M200 380 h500 M900 320 h380 M300 450 h260" stroke="#FFB38A" stroke-width="14" stroke-linecap="round" opacity=".6"/>
      <path d="M1400 240 h300 M1900 300 h260" stroke="#E98AA8" stroke-width="12" stroke-linecap="round" opacity=".45"/>`;
    far += skyline(sc, 2000, 640, 460, '#4B3B74', { filler: '#55437E', windows: '#FFD98A', seed: 9, pearl: '#FF8BC2', glowColor: 'lanternGlow', towerLights: '#FFD98A' });

    // traditional roofs row
    let row = defs;
    const bld = [[150, 250], [470, 200], [760, 230], [1650, 210], [1950, 250], [2260, 220]];
    bld.forEach(([x, h], i) => {
      const w = 300 + (i % 2) * 60, yb = 650 - h + 60;
      row += `<rect x="${x - w * 0.4}" y="${yb}" width="${w * 0.8}" height="${650 - yb}" fill="#43334F"/>`;
      for (let k = 0; k < 3; k++) row += `<rect x="${x - w * 0.3 + k * w * 0.22}" y="${yb + 30}" width="${w * 0.12}" height="40" rx="4" fill="#FFC66B" opacity="${0.6 + r() * 0.4}"/>`;
      row += roof(x, yb + 4, w, 70, roofC, ridgeC);
    });

    // pond, pavilion (湖心亭), zigzag bridge (九曲桥)
    let mid = defs + `<rect y="660" width="2400" height="140" fill="url(#${u}pond)"/>`;
    for (let i = 0; i < 26; i++) mid += `<path d="M${r() * 2400} ${690 + r() * 90} h${20 + r() * 50}" stroke="#FFC98A" stroke-width="4" stroke-linecap="round" opacity="${0.25 + r() * 0.35}"/>`;
    // reflection
    mid += `<g opacity=".22" transform="translate(0 1400) scale(1 -1)"><rect x="1080" y="600" width="300" height="100" fill="#FFC66B"/></g>`;
    const px = 1230;
    mid += `<g>
      <rect x="${px - 230}" y="690" width="460" height="22" rx="6" fill="#8E8196"/>
      <rect x="${px - 190}" y="560" width="380" height="132" fill="#6E2C24"/>
      ${[...Array(5)].map((_, i) => `<rect x="${px - 170 + i * 72}" y="578" width="54" height="94" rx="6" fill="#FFC66B"/><path d="M${px - 170 + i * 72} 610 h54 M${px - 143 + i * 72} 578 v94" stroke="#B5552F" stroke-width="3"/>`).join('')}
      ${[...Array(6)].map((_, i) => `<rect x="${px - 190 + i * 72}" y="560" width="12" height="132" fill="#8E2F2A"/>`).join('')}
      <circle cx="${px}" cy="630" r="200" fill="url(#${u}win)" opacity=".5"/>
      ${roof(px, 570, 520, 70, roofC, ridgeC, 0.5)}
      <rect x="${px - 120}" y="452" width="240" height="72" fill="#6E2C24"/>
      ${[...Array(3)].map((_, i) => `<rect x="${px - 100 + i * 72}" y="464" width="56" height="48" rx="5" fill="#FFC66B"/>`).join('')}
      ${roof(px, 458, 380, 100, roofC, ridgeC, 0.5)}
      <path d="M${px} 350 v-26" stroke="${ridgeC}" stroke-width="8"/><circle cx="${px}" cy="318" r="12" fill="${ridgeC}"/>
      <rect x="${px - 60}" y="530" width="120" height="30" rx="4" fill="#1F1A2A"/><text x="${px}" y="552" text-anchor="middle" class="svg-hand" font-size="22" fill="#F2C766"${fitText(label(sc, 'pavilion', '', ''), 110, 22)}>${esc(label(sc, 'pavilion', '', ''))}</text>
    </g>`;
    mid += lantern(px - 250, 548, 0.6) + lantern(px + 250, 548, 0.6) + lantern(px - 180, 440, 0.5) + lantern(px + 180, 440, 0.5);
    // zigzag bridge: segments alternate depth
    let bridge = '';
    const segs = [[0, 360, 0], [360, 700, 14], [700, 1000, 0], [1500, 1800, 14], [1800, 2120, 0], [2120, 2400, 14]];
    segs.forEach(([a, b, dy]) => {
      bridge += `<rect x="${a}" y="${722 + dy}" width="${b - a}" height="22" fill="url(#${u}bridge)"/><rect x="${a}" y="${742 + dy}" width="${b - a}" height="10" fill="#7F6C86"/>
        <rect x="${a}" y="${690 + dy}" width="${b - a}" height="8" rx="4" fill="#E6DAE3"/>`;
      for (let x = a + 10; x < b; x += 46) bridge += `<rect x="${x}" y="${690 + dy}" width="10" height="34" rx="3" fill="#D9CBD6"/>`;
    });
    mid += bridge;
    // willow
    mid += `<g><path d="M300 700 C290 600 300 520 330 460" stroke="#4A3A38" stroke-width="22" fill="none"/>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 0%">
      ${[...Array(16)].map((_, i) => { const x = 180 + i * 18; return `<path d="M330 450 Q${x} ${470} ${x - 10} ${560 + (i % 4) * 30}" stroke="${i % 2 ? '#4E7A4A' : '#5E8F55'}" stroke-width="7" fill="none" stroke-linecap="round"/>`; }).join('')}
      <ellipse cx="310" cy="450" rx="120" ry="50" fill="#5E8F55"/></g></g>`;

    // near: plaza, shops, 糖葫芦 stand
    let near = defs + `<rect y="790" width="2400" height="210" fill="url(#${u}plaza)"/>`;
    for (let y = 820, k = 0; y < 1000; y += 40 + k * 8, k++) {
      near += `<line x1="0" y1="${y}" x2="2400" y2="${y}" stroke="#4E3D58" stroke-width="3" opacity=".45"/>`;
      for (let x = (k % 2) * 60; x < 2400; x += 120 + k * 10) near += `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 40 + k * 8}" stroke="#4E3D58" stroke-width="3" opacity=".35"/>`;
    }
    near += `<rect y="786" width="2400" height="10" fill="#6A5872"/>`;
    // shopfront right
    near += `<g>
      <rect x="1880" y="420" width="560" height="380" fill="url(#${u}wall)"/>
      <rect x="1930" y="520" width="440" height="220" rx="8" fill="#FFCF7A"/><rect x="1930" y="520" width="440" height="220" rx="8" fill="url(#${u}win)"/>
      ${[...Array(5)].map((_, i) => `<rect x="${1900 + i * 120}" y="440" width="18" height="360" fill="#8E2F2A"/>`).join('')}
      ${roof(2160, 440, 620, 90, roofC, ridgeC, 0.45)}
      <rect x="2010" y="452" width="240" height="56" rx="6" fill="#1F1A2A"/><rect x="2016" y="458" width="228" height="44" rx="4" fill="none" stroke="#E8B04A" stroke-width="3"/>
      <text x="2130" y="492" text-anchor="middle" class="svg-hand" font-size="32" fill="#F2C766"${fitText(label(sc, 'gate', '', ''), 220, 32)}>${esc(label(sc, 'gate', '', ''))}</text>
      <rect x="1968" y="560" width="46" height="170" rx="4" fill="#F6EEDC"/>
      ${[...String(label(sc, 'banner', '小笼包', ''))].slice(0, 3).map((c, i) => `<text x="1991" y="${600 + i * 42}" text-anchor="middle" class="svg-hand" font-size="30" fill="#B42A20">${esc(c)}</text>`).join('')}
      <rect x="2060" y="700" width="300" height="100" fill="#6E2C24"/><rect x="2050" y="690" width="320" height="16" rx="4" fill="#9A4A35"/>
      <g transform="translate(2140 620)">${[0, 1, 2].map(i => `<rect x="0" y="${i * 24}" width="120" height="24" rx="6" fill="#E3C28A" stroke="#C49A5A" stroke-width="3"/>`).join('')}<ellipse cx="60" cy="0" rx="60" ry="10" fill="#EFD6A6"/></g>
    </g>`;
    // tanghulu stand
    near += `<g><ellipse cx="300" cy="812" rx="90" ry="10" fill="#000" opacity=".15"/>
      <rect x="292" y="560" width="16" height="250" fill="#8A5A3C"/>
      <ellipse cx="300" cy="560" rx="60" ry="80" fill="#E7C66E"/><ellipse cx="300" cy="560" rx="60" ry="80" fill="none" stroke="#C9A24E" stroke-width="4" stroke-dasharray="6 10"/>
      ${[...Array(10)].map((_, i) => { const a = -1.4 + i * 0.31, x2 = 300 + Math.sin(a) * 110, y2 = 560 - Math.cos(a) * 110; return `<line x1="300" y1="560" x2="${x2}" y2="${y2}" stroke="#D9B98A" stroke-width="3"/>${[0, 1, 2, 3].map(k => `<circle cx="${300 + Math.sin(a) * (70 + k * 14)}" cy="${560 - Math.cos(a) * (70 + k * 14)}" r="9" fill="#E0332A"/><circle cx="${297 + Math.sin(a) * (70 + k * 14)}" cy="${557 - Math.cos(a) * (70 + k * 14)}" r="3" fill="#FFB1A0"/>`).join('')}`; }).join('')}
      <rect x="240" y="690" width="120" height="44" rx="8" fill="#B42A20"/><text x="300" y="721" text-anchor="middle" class="svg-hand" font-size="24" fill="#FFE9B0"${fitText(label(sc, 'snack', '糖葫芦', 'Candy'), 110, 24)}>${esc(label(sc, 'snack', '糖葫芦', 'Candy'))}</text></g>`;

    // front: lantern strings
    let front = defs;
    [[-80, 2480, 60, 170], [-80, 2480, 0, 90]].forEach(([a, b, y0, sag], si) => {
      front += `<path d="M${a} ${y0} Q1200 ${y0 + sag * 2} ${b} ${y0}" stroke="#3A2A20" stroke-width="3" fill="none"/>`;
      for (let x = 60 + si * 80; x < 2400; x += 170) {
        const t = (x - a) / (b - a), y = y0 + 2 * t * (1 - t) * sag * 2;
        front += lantern(x, y + 14, si ? 0.9 : 1.1, 'lantern swing');
      }
    });

    const extras = [...Array(24)].map((_, i) => fx(r() * 2400, r() * 280, 10, 10, 'star', `<circle cx="5" cy="5" r="${2 + r() * 2}" fill="#FFF3C9"/>`));
    extras.forEach((e, i) => { e.style = `animation-delay:${-i * 0.37}s`; });
    const nearExtras = [fxHTML(2130, 520, 140, 110, 'steam', '<i></i><i></i><i></i>')];

    return {
      sky: 'linear-gradient(180deg, #2A285C 0%, #573D86 28%, #B25A86 52%, #EE8A63 72%, #FFC57C 100%)',
      layers: [
        { depth: 0.05, svg: '', extras },
        { depth: 0.12, svg: far },
        { depth: 0.3, svg: row },
        { depth: 0.5, svg: mid },
        { depth: 1, svg: near, extras: nearExtras },
        { depth: 1.3, svg: front, front: true },
      ],
    };
  }

  // ======================================================================
  // 4. 晚饭 — cosy Shanghainese restaurant
  // ======================================================================
  function restaurant(u, sc = {}) {
    const r = rng(41);
    const defs = `<defs>
      ${lg(u + 'wall', [[0, '#F6E2C4'], [1, '#EBCB9F']])}
      ${lg(u + 'panel', [[0, '#94603F'], [1, '#6E4128']])}
      ${lg(u + 'night', [[0, '#16224A'], [1, '#3C4E86']])}
      ${lg(u + 'floor', [[0, '#B8744C'], [1, '#8A4E30']])}
      ${lg(u + 'table', [[0, '#9A5A34'], [1, '#6E3B20']])}
      ${lg(u + 'cloth', [[0, '#D8493F'], [1, '#B3352D']])}
      ${lg(u + 'cone', [[0, '#FFE2A0', 0.5], [1, '#FFE2A0', 0]])}
      ${glow(u + 'bulb', '#FFD27A')}
      ${glow(u + 'pink', '#FF7FC0')}
      <clipPath id="${u}moon"><circle cx="1200" cy="330" r="150"/></clipPath>
    </defs>`;

    let far = defs + `<rect width="2400" height="770" fill="url(#${u}wall)"/>
      <rect y="520" width="2400" height="250" fill="url(#${u}panel)"/>
      ${[...Array(16)].map((_, i) => `<rect x="${i * 150 + 16}" y="546" width="118" height="196" rx="8" fill="#000" opacity=".1"/>`).join('')}
      <rect y="512" width="2400" height="14" fill="#5A321E"/>`;
    // moon window
    far += `<circle cx="1200" cy="330" r="174" fill="#5A321E"/><circle cx="1200" cy="330" r="152" fill="url(#${u}night)"/>
      <g clip-path="url(#${u}moon)">
        ${[...Array(30)].map(() => `<circle cx="${1050 + r() * 300}" cy="${190 + r() * 150}" r="${1 + r() * 2}" fill="#fff" opacity="${0.4 + r() * 0.6}"/>`).join('')}
        ${skyline(sc, 1300, 480, 250, '#243463', { filler: '#2A3C70', windows: '#FFD98A', seed: 4, pearl: '#FF7FC0', glowColor: u + 'pink', towerLights: '#FFD98A' })}
      </g>
      <circle cx="1200" cy="330" r="152" fill="none" stroke="#7A4A2C" stroke-width="10"/>
      <path d="M1040 200 Q1140 250 1210 230 Q1280 212 1360 260" stroke="#4A2E22" stroke-width="10" fill="none" stroke-linecap="round"/>
      ${[[1090, 222], [1150, 244], [1230, 226], [1300, 234], [1340, 252], [1180, 238]].map(([x, y]) => `<g transform="translate(${x} ${y})">${[0, 1, 2, 3, 4].map(k => `<circle cx="${Math.cos(k * 1.256) * 8}" cy="${Math.sin(k * 1.256) * 8}" r="7" fill="#FFB7C9"/>`).join('')}<circle r="4" fill="#FFE08A"/></g>`).join('')}`;
    // scroll 好好吃饭
    far += `<g transform="translate(850 0)"><rect x="600" y="140" width="120" height="14" rx="7" fill="#6B4028"/><rect x="610" y="152" width="100" height="320" fill="#F6EEDC"/><rect x="600" y="470" width="120" height="14" rx="7" fill="#6B4028"/>
      ${[...String(label(sc, 'scroll', '好好吃饭', ''))].slice(0, 4).map((c, i) => `<text x="660" y="${222 + i * 66}" text-anchor="middle" class="svg-hand" font-size="50" fill="#3A2A20">${esc(c)}</text>`).join('')}
      <rect x="690" y="420" width="16" height="16" fill="#C8463D"/></g>
      <g transform="translate(560 200)"><rect width="160" height="210" rx="10" fill="#FFF6E6"/><rect x="12" y="12" width="136" height="136" fill="#FFE1E8"/>
        <circle cx="80" cy="80" r="44" fill="#fff"/><circle cx="64" cy="70" r="16" fill="#FFF8EE" stroke="#E6D6C0" stroke-width="3"/><circle cx="96" cy="70" r="16" fill="#FFF8EE" stroke="#E6D6C0" stroke-width="3"/><circle cx="80" cy="96" r="16" fill="#FFF8EE" stroke="#E6D6C0" stroke-width="3"/>
        <text x="80" y="186" text-anchor="middle" class="svg-hand" font-size="24" fill="#C2566E"${fitText(label(sc, 'cuisine', '', ''), 130, 24)}>${esc(label(sc, 'cuisine', '', ''))}</text></g>`;
    // menu board
    far += `<g><rect x="1630" y="150" width="340" height="300" rx="16" fill="#8A5A3C"/><rect x="1646" y="166" width="308" height="268" rx="10" fill="#2F2A26"/>
      <text x="1800" y="214" text-anchor="middle" class="svg-hand" font-size="34" fill="#FFE08A"${fitText(label(sc, 'menuTitle', '今日推荐', "Today's menu"), 290, 34)}>${esc(label(sc, 'menuTitle', '今日推荐', "Today's menu"))}</text>
      ${listOf(label(sc, 'menu', ['小笼包', '红烧肉', '糖醋小排', '腌笃鲜'], ['Dumplings', 'Noodles', 'Spring rolls', 'Hot soup'])).slice(0, 4).map((t, i) => `<text x="1680" y="${266 + i * 44}" class="svg-hand" font-size="28" fill="#F6EEDC"${fitText(t, 220, 28)}>${esc(t)}</text><text x="1920" y="${266 + i * 44}" text-anchor="end" font-size="22" fill="#FF9DB0">♥</text>`).join('')}</g>`;
    // wine jars
    far += `<rect x="2080" y="360" width="300" height="12" fill="#5A321E"/>
      ${[2120, 2210, 2300].map(x => `<path d="M${x - 34} 356 q-10 -60 20 -80 h28 q30 20 20 80 Z" fill="#8A5A3C"/><rect x="${x - 16}" y="262" width="32" height="18" rx="4" fill="#C8463D"/><rect x="${x - 14}" y="300" width="28" height="30" fill="#E8B04A"/><text x="${x}" y="323" text-anchor="middle" class="svg-hand" font-size="20" fill="#8E2F2A">${esc(label(sc, 'jar', '酒', ''))}</text>`).join('')}`;

    let near = defs + `<rect y="760" width="2400" height="240" fill="url(#${u}floor)"/>`;
    for (let x = -60, k = 0; x < 2460; x += 120, k++) near += `<path d="M${x} 760 L${x - 60 + (x - 1200) * 0.12} 1000" stroke="#7A4028" stroke-width="3" opacity=".4"/>`;
    [810, 880, 960].forEach(y => { near += `<line x1="0" y1="${y}" x2="2400" y2="${y}" stroke="#7A4028" stroke-width="3" opacity=".35"/>`; });
    near += `<rect y="752" width="2400" height="12" fill="#4A2A18"/>`;
    // side tables
    [[380, 0], [2020, 1]].forEach(([x, k]) => {
      near += `<g><ellipse cx="${x}" cy="824" rx="200" ry="14" fill="#000" opacity=".15"/>
        <rect x="${x - 190}" y="612" width="40" height="190" rx="10" fill="#6E3B20"/><rect x="${x - 196}" y="690" width="60" height="12" fill="#6E3B20"/>
        <rect x="${x + 150}" y="612" width="40" height="190" rx="10" fill="#6E3B20"/><rect x="${x + 136}" y="690" width="60" height="12" fill="#6E3B20"/>
        <rect x="${x - 150}" y="680" width="300" height="22" rx="6" fill="url(#${u}table)"/><rect x="${x - 136}" y="700" width="20" height="116" fill="#6E3B20"/><rect x="${x + 116}" y="700" width="20" height="116" fill="#6E3B20"/>
        <path d="M${x - 30} 680 q-4 -40 30 -44 q34 4 30 44 Z" fill="${k ? '#9CC9F0' : '#FFFFFF'}"/><path d="M${x + 26} 656 q24 -6 20 16" stroke="${k ? '#9CC9F0' : '#FFFFFF'}" stroke-width="6" fill="none"/>
        <rect x="${x + 50}" y="664" width="26" height="16" rx="4" fill="#fff"/><rect x="${x - 90}" y="664" width="26" height="16" rx="4" fill="#fff"/></g>`;
    });
    // pendant lamps
    [700, 1200, 1700].forEach(x => {
      near += `<line x1="${x}" y1="0" x2="${x}" y2="130" stroke="#3A2A20" stroke-width="4"/>
        <path d="M${x - 300} 760 L${x - 60} 170 L${x + 60} 170 L${x + 300} 760 Z" fill="url(#${u}cone)" class="cone"/>
        <circle cx="${x}" cy="176" r="90" fill="url(#${u}bulb)"/>
        <path d="M${x - 64} 176 Q${x - 60} 120 ${x} 120 Q${x + 60} 120 ${x + 64} 176 Z" fill="#E4B062"/><path d="M${x - 64} 176 H${x + 64}" stroke="#C48A3A" stroke-width="6"/>
        ${[-40, -20, 0, 20, 40].map(d => `<path d="M${x + d * 0.6} 124 L${x + d * 1.4} 174" stroke="#C48A3A" stroke-width="3"/>`).join('')}
        <ellipse cx="${x}" cy="180" rx="22" ry="10" fill="#FFF3C4"/>`;
    });

    // front: the couple's table (stays centred on the couple)
    let front = defs + `<ellipse cx="1200" cy="990" rx="280" ry="18" fill="#000" opacity=".15"/>
      <rect x="1030" y="880" width="30" height="110" rx="8" fill="#6E3B20"/><rect x="1340" y="880" width="30" height="110" rx="8" fill="#6E3B20"/>
      <path d="M990 744 H1410 V872 Q1360 900 1310 878 Q1255 902 1200 880 Q1145 902 1090 878 Q1040 900 990 872 Z" fill="url(#${u}cloth)"/>
      <path d="M990 860 Q1040 888 1090 866 Q1145 890 1200 868 Q1255 890 1310 866 Q1360 888 1410 860" stroke="#F2C766" stroke-width="5" fill="none"/>
      <rect x="976" y="724" width="448" height="26" rx="10" fill="url(#${u}table)"/><rect x="976" y="724" width="448" height="8" rx="4" fill="#B67448"/>`;
    // steamer with xiaolongbao
    front += `<g><ellipse cx="1080" cy="726" rx="70" ry="10" fill="#000" opacity=".15"/>
      <rect x="1014" y="680" width="132" height="44" rx="8" fill="#E3C28A"/><path d="M1014 694 h132 M1014 708 h132" stroke="#C49A5A" stroke-width="3"/>
      ${[1040, 1080, 1120].map((x, i) => `<path d="M${x - 22} 684 Q${x - 20} ${654 - (i % 2) * 6} ${x} ${650 - (i % 2) * 6} Q${x + 20} ${654 - (i % 2) * 6} ${x + 22} 684 Z" fill="#FFF8EE"/><path d="M${x} ${652 - (i % 2) * 6} l-8 14 M${x} ${652 - (i % 2) * 6} l8 14 M${x} ${652 - (i % 2) * 6} v14" stroke="#E6D6C0" stroke-width="2"/>`).join('')}</g>`;
    // rice bowls + chopsticks
    front += `<g><path d="M1160 700 q0 26 30 26 q30 0 30 -26 Z" fill="#fff"/><path d="M1160 700 h60" stroke="#6FA6D6" stroke-width="4"/><ellipse cx="1190" cy="700" rx="30" ry="8" fill="#FFFDF6"/>
      <path d="M1232 700 q0 26 30 26 q30 0 30 -26 Z" fill="#fff"/><path d="M1232 700 h60" stroke="#F4A9B2" stroke-width="4"/><ellipse cx="1262" cy="700" rx="30" ry="8" fill="#FFFDF6"/>
      <path d="M1170 694 l40 -30 M1178 696 l40 -30" stroke="#8A4F2E" stroke-width="4" stroke-linecap="round" class="chop" style="transform-box:fill-box;transform-origin:0% 100%"/></g>`;
    // hong shao rou
    front += `<g><ellipse cx="1350" cy="722" rx="64" ry="12" fill="#fff"/><ellipse cx="1350" cy="720" rx="54" ry="9" fill="none" stroke="#6FA6D6" stroke-width="3"/>
      ${[[1322, 704], [1350, 700], [1378, 706], [1336, 690], [1364, 688]].map(([x, y]) => `<rect x="${x - 15}" y="${y - 12}" width="30" height="24" rx="7" fill="#8E2F1E"/><rect x="${x - 11}" y="${y - 10}" width="12" height="6" rx="3" fill="#D86A4A" opacity=".8"/>`).join('')}
      <circle cx="1392" cy="690" r="6" fill="#6DB35E"/><circle cx="1312" cy="694" r="5" fill="#6DB35E"/></g>`;

    const frontExtras = [fxHTML(1030, 560, 110, 110, 'steam', '<i></i><i></i><i></i>'), fxHTML(1310, 600, 90, 90, 'steam small', '<i></i><i></i>')];

    return {
      sky: 'linear-gradient(#F6E2C4, #EBCB9F)',
      layers: [
        { depth: 0.35, svg: far },
        { depth: 1, svg: near },
        { depth: 1, svg: front, front: true, prop: 'table', extras: frontExtras },
      ],
    };
  }

  // Neon sign for the bar's name (scene config `sign`): a small square plate on the
  // wall right of the couple, below where the phone card reaches. "The Moon" → two lines.
  // `signIcon`: 'glass' (default) | 'heart' | 'berry'.
  function neonSign(u, rawName, icon) {
    const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
    const words = String(rawName).trim().split(/\s+/);
    const small = words.length > 1 ? words.slice(0, -1).join(' ') : '';
    const big = words[words.length - 1];
    const x0 = 1318, y0 = 500, w = 110, h = 112, cx = x0 + w / 2;
    const bigW = Math.min(92, Math.max(40, big.length * 17));
    const glowText = (t, y, size, tw) => `
      <text x="${cx}" y="${y}" text-anchor="middle" ${tw ? `textLength="${tw}" lengthAdjust="spacingAndGlyphs"` : ''} class="svg-hand" font-size="${size}" fill="none" stroke="#FF4FC0" stroke-width="${size / 5}" filter="url(#${u}neon)" opacity=".85">${esc(t)}</text>
      <text x="${cx}" y="${y}" text-anchor="middle" ${tw ? `textLength="${tw}" lengthAdjust="spacingAndGlyphs"` : ''} class="svg-hand" font-size="${size}" fill="#FFE8F6" stroke="#FF8AD8" stroke-width="1.2">${esc(t)}</text>`;
    return `<g class="neon-sign">
      <line x1="${x0 + 18}" y1="${y0 - 40}" x2="${x0 + 18}" y2="${y0}" stroke="#0F0B18" stroke-width="3"/>
      <line x1="${x0 + w - 18}" y1="${y0 - 40}" x2="${x0 + w - 18}" y2="${y0}" stroke="#0F0B18" stroke-width="3"/>
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="18" fill="#15112A" stroke="#3B3060" stroke-width="4"/>
      <rect x="${x0 + 6}" y="${y0 + 6}" width="${w - 12}" height="${h - 12}" rx="13" fill="none" stroke="#FF6FD0" stroke-width="2" opacity=".55" filter="url(#${u}neon)"/>
      <g transform="translate(${cx} ${y0 + 30})">
        <circle r="26" fill="url(#${u}pink)" opacity=".6"/>
        ${icon === 'berry' ? `<path d="M2 -14 q-1 -8 7 -12" stroke="#6FD08C" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M3 -13 q11 -9 17 -3 q-8 8 -17 3 Z" fill="#5FC27E"/>
        <circle cx="-7" cy="4" r="8.5" fill="#FF3F73"/><circle cx="7" cy="4" r="8.5" fill="#FF4F80"/><circle cx="0" cy="-6" r="8.5" fill="#FF5C8A"/>
        <circle cx="-9" cy="1" r="2.3" fill="#FFC2D2"/><circle cx="-3" cy="-9" r="2.3" fill="#FFC2D2"/>` : icon === 'heart' ? `<path d="M0 12 C-16 0 -16 -14 -7 -15 C-3 -15 0 -12 0 -9 C0 -12 3 -15 7 -15 C16 -14 16 0 0 12 Z" fill="#FF5C8A"/>` : `<path d="M-15 -14 H15 L0 3 Z" fill="#9FE3FF" opacity=".9"/><path d="M-15 -14 H15 L0 3 Z M0 3 V15 M-8 16 H8" stroke="#FFE8F6" stroke-width="2.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><circle cx="7" cy="-15" r="4" fill="#FF5C8A"/>`}
      </g>
      ${small ? glowText(small, y0 + 70, 17) : ''}
      ${glowText(big, y0 + (small ? 96 : 88), small ? 26 : 30, bigW)}
    </g>`;
  }

  // ======================================================================
  // 5. 清吧 — night bar
  // ======================================================================
  function bar(u, sc = {}) {
    const r = rng(53);
    const neonText = label(sc, 'neon', '今晚月色真美', 'Cheers to us');
    const defs = `<defs>
      ${lg(u + 'wall', [[0, '#2B2450'], [1, '#1B1632']])}
      ${lg(u + 'night', [[0, '#0B1433'], [0.7, '#22386E'], [1, '#3B3F7A']])}
      ${lg(u + 'floor', [[0, '#3C2B44'], [1, '#1E1726']])}
      ${lg(u + 'counter', [[0, '#5A3446'], [1, '#3A2030']])}
      ${lg(u + 'shelf', [[0, '#FFB866', 0.45], [1, '#FF8A3D', 0.1]])}
      ${lg(u + 'river', [[0, '#2B3E7A'], [1, '#161F44']])}
      ${glow(u + 'bulb', '#FFC873')}
      ${glow(u + 'pink', '#FF6FD0')}
      ${glow(u + 'moon', '#FFF2C8')}
      <filter id="${u}neon" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
      <clipPath id="${u}win"><rect x="1440" y="150" width="680" height="420" rx="10"/></clipPath>
      <pattern id="${u}brick" width="120" height="60" patternUnits="userSpaceOnUse"><path d="M0 0 H120 M0 30 H120 M60 0 V30 M0 30 V60 M120 30 V60" stroke="#3A3166" stroke-width="3" fill="none" opacity=".5"/></pattern>
    </defs>`;

    let far = defs + `<rect width="2400" height="770" fill="url(#${u}wall)"/><rect width="2400" height="770" fill="url(#${u}brick)"/>`;
    // window with night skyline
    far += `<rect x="1420" y="130" width="720" height="460" rx="18" fill="#110E20"/>
      <g clip-path="url(#${u}win)">
        <rect x="1440" y="150" width="680" height="420" fill="url(#${u}night)"/>
        <circle cx="2010" cy="230" r="120" fill="url(#${u}moon)"/><circle cx="2010" cy="230" r="36" fill="#FFF4CF"/><circle cx="1998" cy="222" r="8" fill="#EDE0B8" opacity=".7"/>
        ${[...Array(40)].map(() => `<circle cx="${1440 + r() * 680}" cy="${150 + r() * 200}" r="${0.8 + r() * 1.8}" fill="#fff" opacity="${0.4 + r() * 0.6}"/>`).join('')}
        ${skyline(sc, 1880, 540, 330, '#1B2447', { filler: '#222C55', windows: '#FFD98A', seed: 8, pearl: '#FF6FD0', glowColor: u + 'pink', towerLights: '#9FE3FF' })}
        <rect x="1440" y="536" width="680" height="40" fill="url(#${u}river)"/>
        ${[...Array(14)].map(() => `<path d="M${1450 + r() * 660} ${546 + r() * 24} h${10 + r() * 30}" stroke="${['#FF6FD0', '#FFD98A', '#9FE3FF'][Math.floor(r() * 3)]}" stroke-width="3" opacity=".7"/>`).join('')}
      </g>
      <rect x="1666" y="150" width="12" height="420" fill="#110E20"/><rect x="1892" y="150" width="12" height="420" fill="#110E20"/>`;
    // neon
    far += `<g class="neon"><text x="1010" y="236" text-anchor="middle" class="svg-hand" font-size="74" fill="none" stroke="#FF4FC0" stroke-width="10" filter="url(#${u}neon)" opacity=".9"${fitText(neonText, 760, 74)}>${esc(neonText)}</text>
      <text x="1010" y="236" text-anchor="middle" class="svg-hand" font-size="74" fill="#FFE1F5" stroke="#FF8AD8" stroke-width="2"${fitText(neonText, 760, 74)}>${esc(neonText)}</text></g>
      <path class="neon-heart" d="M1370 250 C1330 220 1326 186 1350 180 C1362 177 1370 188 1370 196 C1370 188 1378 177 1390 180 C1414 186 1410 220 1370 250 Z" fill="none" stroke="#FFE1F5" stroke-width="5"/>`;
    // back bar shelves
    far += `<rect x="280" y="300" width="860" height="330" rx="10" fill="url(#${u}shelf)"/>`;
    [410, 530].forEach((y) => {
      far += `<rect x="280" y="${y}" width="860" height="8" fill="#E7B872" opacity=".8"/>`;
      for (let x = 300; x < 1120; x += 34 + r() * 18) {
        const h = 50 + r() * 50, c = ['#4FAF6B', '#E6A23C', '#D9F2FF', '#3F7FD6', '#C0504D', '#F2D06B'][Math.floor(r() * 6)];
        far += `<rect x="${x}" y="${y - h}" width="22" height="${h}" rx="6" fill="${c}" opacity=".85"/><rect x="${x + 6}" y="${y - h - 16}" width="10" height="18" rx="3" fill="${c}" opacity=".85"/><rect x="${x + 4}" y="${y - h * 0.6}" width="14" height="${h * 0.3}" fill="#fff" opacity=".35"/>`;
      }
    });

    if (sc.sign && String(sc.sign).trim()) far += neonSign(u, sc.sign, sc.signIcon);

    let near = defs + `<rect y="760" width="2400" height="240" fill="url(#${u}floor)"/>
      ${[...Array(9)].map((_, i) => `<rect x="${i * 280 + 40}" y="${790 + (i % 3) * 50}" width="${120 + (i % 2) * 60}" height="6" rx="3" fill="#FFC873" opacity=".12"/>`).join('')}
      <rect y="752" width="2400" height="12" fill="#120D1C"/>`;
    // bar counter
    near += `<rect x="200" y="620" width="1000" height="140" fill="url(#${u}counter)"/>
      ${[...Array(12)].map((_, i) => `<rect x="${220 + i * 82}" y="640" width="6" height="110" fill="#000" opacity=".2"/>`).join('')}
      <rect x="190" y="600" width="1020" height="26" rx="10" fill="#8A5A3C"/><rect x="190" y="600" width="1020" height="8" rx="4" fill="#B98A5E"/>
      <rect x="210" y="738" width="980" height="8" rx="4" fill="#D9AE62"/>`;
    [380, 640, 900].forEach(x => {
      near += `<ellipse cx="${x}" cy="836" rx="60" ry="8" fill="#000" opacity=".3"/><rect x="${x - 5}" y="720" width="10" height="110" fill="#C9C9D6"/><ellipse cx="${x}" cy="830" rx="40" ry="8" fill="#C9C9D6"/>
        <ellipse cx="${x}" cy="716" rx="46" ry="14" fill="#A33A5A"/><ellipse cx="${x}" cy="712" rx="46" ry="12" fill="#C44D72"/>`;
    });
    // pendant lights
    [[520, 170], [860, 230], [1560, 110], [1790, 160], [2030, 120]].forEach(([x, y]) => {
      near += `<line x1="${x}" y1="0" x2="${x}" y2="${y}" stroke="#0F0B18" stroke-width="3"/><circle cx="${x}" cy="${y + 20}" r="110" fill="url(#${u}bulb)" opacity=".7"/>
        <circle cx="${x}" cy="${y + 20}" r="22" fill="#FFE3A3"/><rect x="${x - 8}" y="${y - 4}" width="16" height="10" fill="#C9A06A"/>`;
    });
    // record player
    near += `<g><rect x="2180" y="640" width="200" height="130" rx="12" fill="#5A3446"/><rect x="2192" y="652" width="176" height="44" rx="8" fill="#3A2030"/>
      <rect x="2170" y="610" width="220" height="34" rx="10" fill="#7A4A5E"/></g>
      <path d="M2350 598 l-40 -10" stroke="#C9C9D6" stroke-width="6" stroke-linecap="round"/>
      <g><rect x="2250" y="380" width="120" height="160" rx="6" fill="#E8C35A"/><text x="2310" y="440" text-anchor="middle" class="svg-hand" font-size="30" fill="#2B2450"${fitText(label(sc, 'poster', 'JAZZ', 'JAZZ'), 108, 30)}>${esc(label(sc, 'poster', 'JAZZ', 'JAZZ'))}</text>
      <circle cx="2310" cy="490" r="26" fill="#2B2450"/><circle cx="2310" cy="490" r="8" fill="#E8C35A"/></g>`;
    // plant silhouette
    near += `<g transform="translate(190 0)"><g class="sway" style="transform-box:fill-box;transform-origin:50% 100%"><path d="M1380 760 C1340 640 1290 600 1250 600 C1250 680 1320 740 1380 770 Z M1380 760 C1420 620 1480 590 1520 596 C1510 680 1440 740 1380 770 Z M1380 760 C1370 640 1390 560 1420 530 C1440 600 1410 700 1380 770 Z" fill="#1E3A34"/></g>
      <path d="M1340 760 h80 l-10 60 h-60 Z" fill="#3A2A44"/></g>`;

    // front: high table with cocktails
    let front = defs + `<ellipse cx="1200" cy="992" rx="170" ry="16" fill="#000" opacity=".35"/>
      <rect x="1188" y="752" width="24" height="230" fill="#C9A06A"/><rect x="1192" y="752" width="6" height="230" fill="#F2D39A" opacity=".6"/>
      <ellipse cx="1200" cy="984" rx="90" ry="12" fill="#C9A06A"/>
      <ellipse cx="1200" cy="748" rx="210" ry="30" fill="#6E5A7E"/><ellipse cx="1200" cy="740" rx="210" ry="28" fill="#EDE6F5"/>
      <ellipse cx="1150" cy="734" rx="110" ry="10" fill="#fff" opacity=".6"/>
      <g class="candle"><rect x="1260" y="704" width="30" height="34" rx="6" fill="#fff" opacity=".35"/><rect x="1266" y="712" width="18" height="24" rx="3" fill="#FFF6E0"/>
        <circle cx="1275" cy="690" r="40" fill="url(#${u}bulb)"/><path class="flame" style="transform-box:fill-box;transform-origin:50% 100%" d="M1275 708 q-8 -10 0 -24 q8 14 0 24 Z" fill="#FFB84A"/></g>
      <g transform="translate(1180 732) scale(.72) translate(-1180 -732)"><g class="glass-l" style="transform-box:fill-box;transform-origin:50% 100%">
        <path d="M1100 660 Q1130 700 1160 660 Z" fill="#FF8FB8"/><path d="M1096 656 H1164 Q1130 712 1096 656 Z" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>
        <line x1="1130" y1="690" x2="1130" y2="730" stroke="#fff" stroke-width="4" opacity=".85"/><ellipse cx="1130" cy="732" rx="20" ry="5" fill="#fff" opacity=".85"/>
        <circle cx="1150" cy="652" r="8" fill="#D6283F"/><path d="M1150 646 q4 -14 12 -16" stroke="#3A7A3A" stroke-width="2" fill="none"/></g>
      <g class="glass-r" style="transform-box:fill-box;transform-origin:50% 100%">
        <rect x="1196" y="650" width="42" height="82" rx="6" fill="#7FD3F2" opacity=".85"/><rect x="1192" y="646" width="50" height="88" rx="8" fill="none" stroke="#fff" stroke-width="3" opacity=".8"/>
        <rect x="1204" y="668" width="14" height="14" rx="3" fill="#fff" opacity=".7"/><rect x="1220" y="690" width="12" height="12" rx="3" fill="#fff" opacity=".6"/>
        <circle cx="1236" cy="648" r="14" fill="#B8E36B"/><circle cx="1236" cy="648" r="9" fill="#DDF5A6"/>
        <line x1="1212" y1="620" x2="1222" y2="700" stroke="#FF6FA0" stroke-width="4"/></g></g>`;
    const frontExtras = [fxHTML(1135, 625, 90, 70, 'clink-spark', '<b>✦</b><b>✧</b><b>✦</b>')];
    const extras = [fx(2195, 590, 150, 36, 'vinyl', `<ellipse cx="75" cy="18" rx="70" ry="14" fill="#111"/><ellipse cx="75" cy="18" rx="44" ry="9" fill="none" stroke="#333" stroke-width="2"/><ellipse cx="75" cy="18" rx="16" ry="4" fill="#E0533D"/>`)];
    const notes = [...Array(3)].map((_, i) => fxHTML(2190 + i * 40, 520, 40, 50, 'note', i % 2 ? '♪' : '♫'));
    notes.forEach((e, i) => { e.style = `animation-delay:${-i * 1.1}s`; });

    return {
      sky: 'linear-gradient(#2B2450, #1B1632)',
      layers: [
        { depth: 0.35, svg: far },
        { depth: 1, svg: near, extras: extras.concat(notes) },
        { depth: 1, svg: front, front: true, prop: 'table', extras: frontExtras },
      ],
    };
  }

  // ======================================================================
  // Cover art
  // ======================================================================
  function cover(u) {
    const r = rng(71);
    return `<svg viewBox="0 0 2400 1000" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs>
      ${lg(u + 'river', [[0, '#9BD0EC'], [1, '#6FB2DA']])}
      ${glow(u + 'pink', '#FF9CCB')}
      ${lg(u + 'hill', [[0, '#FFD9E4'], [1, '#FBC1D3']])}
    </defs>
      ${cloud(180, 260, 1.4, '#fff', 0.9)}${cloud(1900, 200, 1.2, '#fff', 0.85)}${cloud(1100, 140, 0.8, '#fff', 0.7)}${cloud(620, 420, 0.7, '#fff', 0.6)}
      ${skyline({}, 1460, 800, 520, '#C8B6F0', { filler: '#D7C9F6', seed: 12, pearl: '#FFA9CF', glowColor: u + 'pink', fillerOp: 0.9 })}
      ${skyline({}, 2250, 800, 300, '#D9CCF8', { filler: '#E4DAFB', seed: 13, fillerOp: 0.9 })}
      <path d="M0 800 Q400 760 800 790 T1600 780 T2400 790 V860 H0 Z" fill="#E7D9FA"/>
      <rect y="820" width="2400" height="180" fill="url(#${u}river)"/>
      ${[...Array(24)].map(() => `<path d="M${r() * 2400} ${850 + r() * 130} h${30 + r() * 60}" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="${0.3 + r() * 0.5}"/>`).join('')}
      <path d="M0 1000 Q600 900 1200 950 T2400 930 V1000 Z" fill="url(#${u}hill)"/>
    </svg>`;
  }

  window.TripArt = {
    GROUND_Y,
    VB_W: 2400,
    VB_H: 1000,
    scenes: { bedroom, street, riverside, yuyuan, restaurant, bar },
    cover,
    cloud,
    lujiazui,
    // helpers for scene files in js/scenes/ (see js/scenes/README.md)
    h: { rng, lg, rg, glow, cloud, fx, fxHTML, birds, planeTree, lantern, roof, bike, samoyed, lujiazui, genericSkyline, skyline, label, listOf, fitText, css, esc, moodOf, ZH, GROUND_Y, labelLog },
  };
})();
