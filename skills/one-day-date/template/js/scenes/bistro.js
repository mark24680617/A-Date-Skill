/*
 * Bistro — a romantic Western-style restaurant for a dinner (or lunch) date.
 * A tall arched window onto the city, string lights, sconces, a wine rack,
 * olive trees, a chalkboard menu, other diners' empty tables and the couple's
 * candle-lit table (a `prop: 'table'` layer; use it with idle: { type: 'sit' }).
 *
 * sc.mood: 'night' (default) | 'sunset' | 'day'. sc.table === false drops the table.
 * Labels: name (sign; '' = hidden), menuTitle, menu (array or "a, b, c", up to 4).
 */
(function () {
  'use strict';
  const H = TripArt.h;
  const { rng, lg, glow, cloud, fxHTML, label, css, esc, moodOf, skyline } = H;
  const listOf = H.listOf || ((v) => (Array.isArray(v) ? v : String(v == null ? '' : v).split(/\s*[,，、;；]\s*/))
    .map((t) => String(t).trim()).filter(Boolean));
  const f = (v) => Math.round(v * 10) / 10;
  const i0 = Math.round;
  // rough text width in em in the display font: CJK ≈ 1, Latin ≈ .66 (wide/narrow letters adjusted)
  const ems = (t) => [...String(t)].reduce((s, c) => s + (/[\u2E80-\uFFFF]/.test(c) ? 1.02 : /[mwMW]/.test(c) ? 0.95 : /[ il.,'!|:;]/.test(c) ? 0.32 : /[A-Z]/.test(c) ? 0.74 : 0.66), 0);
  const fit = (t, max, w) => f(Math.max(13, Math.min(max, w / Math.max(1, ems(t)))));
  // A line of painted text that never overflows width w (squeezed with textLength when it is that long).
  const txt = (t, x, y, max, w, attrs) => {
    const fs = fit(t, max, w), squeeze = ems(t) * fs > 0.9 * w ? ` textLength="${w}" lengthAdjust="spacingAndGlyphs"` : '';
    return `<text x="${x}" y="${y}" font-size="${fs}"${squeeze} class="svg-hand" ${attrs}>${esc(t)}</text>`;
  };

  const MOODS = {
    night: {
      wall: ['#EDC89C', '#D6A477'], stripe: '#B9814F', shade: 0.42, mold: '#F6DDB9',
      wains: ['#2F4E46', '#20362F'], floor: '#D5BB98', tile: '#6A4A3E',
      sky: [[0, '#0B1433'], [0.55, '#1D3066'], [0.85, '#3A4889'], [1, '#5B5496']],
      far: '#34427A', mid: '#26346A', city: '#1B2652', trees: '#121A38',
      win: '#FFD98A', pearl: '#FF7FC0', tower: '#FFD98A',
      cloth: [[0, '#FFF6E8'], [1, '#EAD9C8']], lit: true, candle: 1,
    },
    sunset: {
      wall: ['#F6D3AE', '#E7B48A'], stripe: '#C98A5C', shade: 0.18, mold: '#FBE4C8',
      wains: ['#37594E', '#27433A'], floor: '#E6CCAE', tile: '#86594A',
      sky: [[0, '#5E5AA8'], [0.42, '#E490AE'], [0.74, '#FFB482'], [1, '#FFD994']],
      far: '#B48DB4', mid: '#94709F', city: '#6E5089', trees: '#553E6B',
      win: '#FFE7A8', pearl: '#FF9CC8', tower: '#FFE7A8',
      cloth: [[0, '#FFF5EC'], [1, '#EFD8CF']], lit: true, candle: 0.8,
    },
    day: {
      wall: ['#FCF2E3', '#F2DDC2'], stripe: '#D9B38A', shade: 0, mold: '#FFF9EF',
      wains: ['#4F7C6B', '#3C6254'], floor: '#F3E8D8', tile: '#A9826C',
      sky: [[0, '#6DBDF3'], [0.7, '#B9E3FF'], [1, '#E8F7FF']],
      far: '#CADAEE', mid: '#AFC4E0', city: '#93ADD2', trees: '#79AC72',
      win: null, pearl: '#F59BC4', tower: null,
      cloth: [[0, '#FFFFFF'], [1, '#E7E6EF']], lit: false, candle: 0.55,
    },
  };

  const CSS = `
.is-here .bistro-flame { animation: bistro-flame .2s ease-in-out infinite alternate; }
@keyframes bistro-flame { from { transform: scale(1, 1) rotate(-3deg); } to { transform: scale(.84, 1.14) rotate(3deg); } }
.is-here .bistro-halo { animation: bistro-halo 2.6s ease-in-out infinite; }
@keyframes bistro-halo { 0%, 100% { opacity: .75; } 50% { opacity: 1; } }
.is-here .bistro-lights > use { animation: bistro-tw 3.2s ease-in-out infinite; }
.bistro-lights > use:nth-child(3n) { animation-delay: -1.1s; }
.bistro-lights > use:nth-child(3n+1) { animation-delay: -2.2s; }
@keyframes bistro-tw { 0%, 100% { opacity: 1; } 50% { opacity: .55; } }
.is-here .bistro-glass-l { animation: bistro-clink-l 4.4s ease-in-out infinite; }
.is-here .bistro-glass-r { animation: bistro-clink-r 4.4s ease-in-out infinite; }
@keyframes bistro-clink-l { 0%, 30%, 66%, 100% { transform: none; } 44%, 52% { transform: translate(7px, -6px) rotate(9deg); } }
@keyframes bistro-clink-r { 0%, 30%, 66%, 100% { transform: none; } 44%, 52% { transform: translate(-7px, -6px) rotate(-9deg); } }
.bistro-spark { font-size: .26em; color: #FFE7A0; text-shadow: 0 0 .3em #FFB84A; }
.bistro-spark b { position: absolute; opacity: 0; left: 42%; top: 40%; }
.bistro-spark b:nth-child(2) { left: 12%; top: 6%; font-size: .7em; }
.bistro-spark b:nth-child(3) { left: 72%; top: 0; font-size: .8em; }
.is-here .bistro-spark b { animation: bistro-spark 4.4s ease-out infinite; }
@keyframes bistro-spark { 0%, 45% { opacity: 0; transform: scale(.2); } 50% { opacity: 1; transform: scale(1.3); } 72%, 100% { opacity: 0; transform: scale(.6) translateY(-40%); } }
.has-special .bistro-glass-l, .has-special .bistro-glass-r, .has-special .bistro-spark { display: none; }
`;

  // The skyline helper paints every lit window as its own <rect>; merge them into two paths
  // (bright / dim) drawn where the last one was, which keeps the markup small.
  function packWindows(svg, color) {
    if (!color) return svg;
    const d = ['', ''];
    const out = svg.replace(/<rect x="([\d.]+)" y="([\d.]+)" width="([\d.]+)" height="([\d.]+)" fill="([^"]+)" opacity="([\d.]+)"\/>/g, (m, x, y, w, h, c, o) => {
      if (c !== color) return m;
      d[+o > 0.72 ? 0 : 1] += `M${i0(+x)} ${i0(+y)}h${w}v${h}h-${w}Z`;
      return '\u0000';
    });
    const k = out.lastIndexOf('\u0000');
    if (k < 0) return svg;
    const paths = `<path d="${d[0]}" fill="${color}"/><path d="${d[1]}" fill="${color}" opacity=".6"/>`;
    return (out.slice(0, k) + paths + out.slice(k + 1)).replace(/\u0000/g, '');
  }

  // A scalloped string of lights from x0 to x1 hanging from height y (bulbs are <use>s of #u+'bulb').
  function garland(u, x0, x1, y, sag, spans, per, on) {
    const w = (x1 - x0) / spans;
    let d = `M${i0(x0)} ${y}`, bulbs = '';
    for (let i = 0; i < spans; i++) {
      const a = x0 + i * w;
      d += `Q${i0(a + w / 2)} ${y + 2 * sag} ${i0(a + w)} ${y}`;
      for (let k = 1; k <= per; k++) {
        const t = k / (per + 1);
        bulbs += `<use href="#${u}bulb" x="${i0(a + w * t)}" y="${i0(y + 4 * sag * t * (1 - t))}"/>`;
      }
    }
    return `<path d="${d}" stroke="#4A3428" stroke-width="3" fill="none"/><g${on ? ' class="bistro-lights"' : ''}>${bulbs}</g>`;
  }

  // Wall sconce with a tulip shade, drawn around (0, 0) = the shade's base.
  function sconce(u, on) {
    const x = 0, y = 0;
    return `${on ? `<circle cx="${x}" cy="${y - 20}" r="150" fill="url(#${u}sglow)"/>` : ''}
      <rect x="${x - 13}" y="${y + 22}" width="26" height="54" rx="10" fill="#B8893E"/><rect x="${x - 9}" y="${y + 26}" width="6" height="44" rx="3" fill="#F0D593" opacity=".6"/>
      <path d="M${x} ${y + 40}C${x - 30} ${y + 36} ${x - 26} ${y + 8} ${x} ${y + 6}" stroke="#B8893E" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M${x - 30} ${y - 44}Q${x - 26} ${y + 6} ${x} ${y + 8}Q${x + 26} ${y + 6} ${x + 30} ${y - 44}Q${x + 15} ${y - 34} ${x} ${y - 48}Q${x - 15} ${y - 34} ${x - 30} ${y - 44}Z" fill="url(#${u}tulip)"/>
      <path d="M${x - 18} ${y - 30}Q${x - 16} ${y - 6} ${x - 4} ${y}" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/>`;
  }

  // Potted olive tree; gy = floor, s = scale.
  function oliveTree(u, x, gy, s) {
    const r = rng(x | 0);
    const P = (dx, dy) => `${i0(x + dx * s)} ${i0(gy + dy * s)}`;
    let t = `<ellipse cx="${x}" cy="${gy + 2}" rx="${i0(72 * s)}" ry="${i0(10 * s)}" fill="#000" opacity=".16"/>
      <path d="M${P(-6, -104)}C${P(-24, -170)} ${P(18, -210)} ${P(-6, -300)}" stroke="#8C7A66" stroke-width="${i0(13 * s)}" fill="none" stroke-linecap="round"/>
      <path d="M${P(6, -104)}C${P(22, -160)} ${P(-8, -220)} ${P(34, -280)}" stroke="#A58F78" stroke-width="${i0(9 * s)}" fill="none" stroke-linecap="round"/>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 100%">`;
    [[-66, -300, 64, '#7D9468'], [46, -318, 68, '#879E70'], [-8, -372, 72, '#8FA676'], [80, -262, 46, '#7D9468'], [-92, -248, 44, '#879E70'], [16, -256, 54, '#8FA676'], [-40, -214, 34, '#7D9468']]
      .forEach(([dx, dy, rr, c]) => { t += `<circle cx="${i0(x + dx * s)}" cy="${i0(gy + dy * s)}" r="${i0(rr * s)}" fill="${c}"/>`; });
    let leaves = '', olives = '';
    for (let i = 0; i < 16; i++) {
      const a = (-40 + r() * 80) * Math.PI / 180, dx = i0(Math.cos(a) * 10 * s), dy = i0(Math.sin(a) * 10 * s);
      leaves += `M${i0(x + (-105 + r() * 210) * s)} ${i0(gy + (-420 + r() * 200) * s)}l${dx} ${dy}`;
    }
    for (let i = 0; i < 5; i++) olives += `M${i0(x + (-80 + r() * 160) * s)} ${i0(gy + (-350 + r() * 120) * s)}v2`;
    t += `<path d="${leaves}" stroke="#A9BC8F" stroke-width="${i0(7 * s)}" stroke-linecap="round" opacity=".85"/><path d="${olives}" stroke="#5E4A6E" stroke-width="9" stroke-linecap="round" opacity=".8"/></g>
      <path d="M${P(-50, -104)}L${P(50, -104)}L${P(38, 0)}L${P(-38, 0)}Z" fill="url(#${u}pot)"/>
      <rect x="${i0(x - 58 * s)}" y="${i0(gy - 118 * s)}" width="${i0(116 * s)}" height="${i0(22 * s)}" rx="${i0(7 * s)}" fill="#DB8C5E"/>
      <path d="M${P(-44, -110)}H${P(4, -110).split(' ')[0]}M${P(-30, -84)}L${P(-24, -14)}" stroke="#F4B98E" stroke-width="${i0(5 * s)}" stroke-linecap="round" opacity=".6"/>`;
    return t;
  }

  // Bentwood bistro chair in side view, facing +x (flip: facing −x).
  const chair = (u, x, gy, flip) => `<use href="#${u}chair" transform="translate(${x} ${gy - 94})${flip ? 'scale(-1 1)' : ''}"/>`;
  function chairDef(u) {
    return `<g id="${u}chair" stroke="#5E3A2A" stroke-linecap="round" fill="none">
      <path d="M-28 2L-36 94M26 4L32 94" stroke-width="7"/><ellipse cy="56" rx="30" ry="5" stroke-width="4"/>
      <path d="M-30 0C-40 -50 -44 -104 -30 -124C-20 -138 -4 -132 -8 -114C-12 -84 -18 -40 -18 -2" stroke-width="7"/>
      <path d="M-27 -30C-31 -60 -31 -90 -24 -110" stroke-width="3" opacity=".6"/>
      <ellipse rx="38" ry="9" fill="#5E3A2A" stroke="none"/><ellipse cy="-2" rx="31" ry="5.5" fill="#D8AE78" stroke="none"/></g>`;
  }

  // A small marble bistro table for two, chairs empty, with a votive and a bud vase.
  function dinerTable(u, x, gy, on) {
    const top = gy - 150;
    return `<ellipse cx="${x}" cy="${gy + 2}" rx="215" ry="13" fill="#000" opacity=".14"/>
      ${chair(u, x - 150, gy, false)}${chair(u, x + 150, gy, true)}
      <rect x="${x - 6}" y="${top + 10}" width="12" height="${gy - top - 16}" fill="#3B302C"/><path d="M${x - 52} ${gy}Q${x} ${gy - 28} ${x + 52} ${gy}Z" fill="#3B302C"/>
      <ellipse cx="${x}" cy="${top + 8}" rx="100" ry="14" fill="#B9ADA2"/><ellipse cx="${x}" cy="${top}" rx="100" ry="15" fill="#F5F0EA"/>
      <path d="M${x - 64} ${top - 3}q30 7 58 -3M${x + 20} ${top + 6}q20 -6 44 -2" stroke="#DDD3C9" stroke-width="2" fill="none"/>
      ${on ? `<circle cx="${x - 14}" cy="${top - 24}" r="56" fill="url(#${u}cglow)" class="bistro-halo"/>` : ''}
      <rect x="${x - 27}" y="${top - 28}" width="26" height="28" rx="6" fill="${on ? '#FFD890' : '#F4ECE0'}" opacity=".75"/><rect x="${x - 21}" y="${top - 16}" width="14" height="14" rx="2" fill="#FFF8EC"/>
      ${on ? `<path class="bistro-flame" style="transform-box:fill-box;transform-origin:50% 100%" d="M${x - 14} ${top - 17}q-6 -7 0 -18q6 11 0 18Z" fill="#FFB84A"/>` : ''}
      <path d="M${x + 30} ${top}q-8 -10 -2 -22v-12h8v12q6 12 -2 22Z" fill="#CFE8F2" opacity=".8"/>
      <path d="M${x + 34} ${top - 32}q-2 -14 4 -24" stroke="#4E8A44" stroke-width="2.5" fill="none"/><circle cx="${x + 38}" cy="${top - 58}" r="7" fill="#F28AA0"/><circle cx="${x + 38}" cy="${top - 58}" r="3" fill="#FFD1DC"/>
      <path d="M${x - 70} ${top + 2}l28 -16l14 18Z" fill="#fff"/>`;
  }

  function wineGlass(x, cls) {
    const b = `M${x - 19} 650C${x - 21} 678 ${x - 12} 694 ${x} 694C${x + 12} 694 ${x + 21} 678 ${x + 19} 650`;
    return `<g class="${cls}" style="transform-box:fill-box;transform-origin:50% 100%">
      <ellipse cx="${x}" cy="738" rx="18" ry="4" fill="#000" opacity=".1"/><ellipse cx="${x}" cy="734" rx="15" ry="4" fill="#fff" opacity=".9"/>
      <rect x="${x - 2}" y="692" width="4" height="42" fill="#fff" opacity=".9"/><path d="${b}Z" fill="#fff" opacity=".3"/>
      <path d="M${x - 18.6} 667C${x - 18} 684 ${x - 10} 692 ${x} 692C${x + 10} 692 ${x + 18} 684 ${x + 18.6} 667Z" fill="#8E1B3A"/><ellipse cx="${x}" cy="667" rx="18.6" ry="3.5" fill="#B8324F"/>
      <path d="${b}" stroke="#fff" stroke-width="2.5" fill="none" opacity=".85"/><ellipse cx="${x}" cy="650" rx="19" ry="4" fill="none" stroke="#fff" stroke-width="2" opacity=".85"/>
      <path d="M${x - 12} 656q-3 16 3 28" stroke="#fff" stroke-width="3" fill="none" opacity=".75" stroke-linecap="round"/></g>`;
  }

  function bistro(u, sc = {}) {
    const mood = MOODS[moodOf(sc, 'night')] ? moodOf(sc, 'night') : 'night';
    const P = MOODS[mood], on = P.lit, r = rng(83);
    css('bistro', CSS);

    // ------------------------------------------------------------------
    // City seen through the window (moves slower than the wall)
    // ------------------------------------------------------------------
    let city = `<defs>${lg(u + 'sky', P.sky)}${glow(u + 'lamp', '#FFD27A')}${glow(u + 'orb', mood === 'night' ? '#FFF2C8' : '#FFE9A8')}</defs>
      <rect y="60" width="2400" height="570" fill="url(#${u}sky)"/>`;
    if (mood === 'night') {
      let stars = '';
      for (let i = 0; i < 20; i++) stars += `<circle cx="${i0(520 + r() * 1360)}" cy="${i0(80 + r() * 300)}" r="${f(0.9 + r() * 1.6)}"/>`;
      city += `<g fill="#fff" opacity=".8">${stars}</g><circle cx="1350" cy="236" r="120" fill="url(#${u}orb)"/><circle cx="1350" cy="236" r="34" fill="#FFF4CF"/><circle cx="1340" cy="228" r="8" fill="#EDE0B8" opacity=".7"/><circle cx="1360" cy="248" r="5" fill="#EDE0B8" opacity=".6"/>`;
    } else if (mood === 'sunset') {
      city += `<circle cx="1040" cy="380" r="230" fill="url(#${u}orb)"/><circle cx="1040" cy="380" r="58" fill="#FFE5A0"/><circle cx="1040" cy="380" r="45" fill="#FFF3CE"/>
        <g fill="#FFC6C4" opacity=".55">${[[700, 270, 240], [1240, 200, 300], [1500, 290, 220], [900, 180, 200]].map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="16" rx="8"/><rect x="${x + 40}" y="${y + 22}" width="${w * 0.6}" height="10" rx="5"/>`).join('')}</g>`;
    } else {
      city += `<circle cx="1420" cy="180" r="160" fill="url(#${u}orb)" opacity=".7"/>${cloud(960, 250, 0.7, '#fff', 0.95)}${cloud(1260, 190, 0.55, '#fff', 0.9)}${cloud(1600, 260, 0.6, '#fff', 0.9)}`;
    }
    // far low-rise band + mid towers (one path each) with columns of lit windows
    let farD = '', midD = '', winD = '';
    for (let x = 520; x < 1880;) {
      const w = i0(60 + r() * 80), h = i0(70 + r() * 110);
      farD += `M${x} 604V${600 - h}h${w}V604Z`;
      if (r() < 0.3) farD += `M${i0(x + w / 2 - 2)} ${600 - h}v-26h4v26Z`;
      x += w + i0(6 + r() * 20);
    }
    for (let x = 530; x < 1880;) {
      const w = i0(48 + r() * 50), h = i0(140 + r() * 150);
      midD += `M${x} 604V${600 - h}h${w}V604Z`;
      for (let cx = x + 10; cx < x + w - 8; cx += 13) if (r() < 0.5) winD += `M${cx} ${600 - h + 14}V590`;
      x += w + i0(40 + r() * 90);
    }
    city += `<path d="${farD}" fill="${P.far}"/><path d="${midD}" fill="${P.mid}"/>`;
    if (P.win) city += `<path d="${winD}" stroke="${P.win}" stroke-width="5" stroke-dasharray="6 9" opacity=".6"/>`;
    city += packWindows(skyline(sc, 1290, 604, 285, P.city, { filler: P.mid, fillerOp: 0.95, windows: P.win || undefined, seed: 9, pearl: P.pearl, glowColor: P.win ? u + 'pink' : undefined, towerLights: P.tower || undefined }), P.win)
      .replace(/(\d\d)\.\d+/g, '$1').replace(/(\d\.\d\d)\d+/g, '$1');
    // tree tops and street lamps along the avenue below
    let trees = '';
    for (let x = 520; x < 1890; x += i0(40 + r() * 16)) trees += `<circle cx="${x}" cy="${i0(598 + r() * 8)}" r="${i0(24 + r() * 16)}"/>`;
    city += `<g fill="${P.trees}">${trees}</g>`;
    if (on) {
      let halos = '', dots = '';
      for (let x = 570; x < 1880; x += 170) { halos += `<circle cx="${x}" cy="572" r="16"/>`; dots += `<circle cx="${x}" cy="572" r="3.5"/>`; }
      city += `<g fill="url(#${u}lamp)">${halos}</g><g fill="#FFE9B0">${dots}</g>`;
    }
    // the Shanghai skyline's pearl glow is only defined when it is drawn
    if (city.includes(`url(#${u}pink)`)) city = city.replace('</defs>', `${glow(u + 'pink', P.pearl)}</defs>`);

    // ------------------------------------------------------------------
    // Back wall with the arched window cut out
    // ------------------------------------------------------------------
    const hole = 'M910 580V410A290 290 0 0 1 1490 410V580Z';
    const wallD = `M0 0H2400V612H0Z${hole}`;
    let wall = `<defs>
      ${lg(u + 'wall', [[0, P.wall[0]], [1, P.wall[1]]])}${P.shade ? lg(u + 'shade', [[0, '#2A1830', P.shade], [0.55, '#2A1830', 0]]) : ''}
      ${lg(u + 'wains', [[0, P.wains[0]], [1, P.wains[1]]])}
      ${lg(u + 'curtain', [[0, '#7A1F36'], [0.35, '#B23C58'], [0.6, '#962D48'], [1, '#6E1A30']], 0, 0, 1, 0)}
      ${lg(u + 'wood', [[0, '#9A6440'], [1, '#6E4128']])}${lg(u + 'wpot', [[0, '#C9744A'], [1, '#A95A36']])}
      ${lg(u + 'gold', [[0, '#F3D58A'], [0.5, '#C99A4A'], [1, '#A77A34']], 0, 0, 1, 1)}${lg(u + 'mirror', [[0, '#E9E4EA'], [0.5, '#C9CAD8'], [1, '#F2D9C0']], 0, 0, 1, 1)}
      ${lg(u + 'tulip', on ? [[0, '#FFF6D8'], [1, '#FFD27A']] : [[0, '#FFFFFF'], [1, '#EFE6D6']])}
      ${glow(u + 'bglow', '#FFD27A')}${glow(u + 'sglow', '#FFE2A6')}
      <pattern id="${u}stripe" width="72" height="40" patternUnits="userSpaceOnUse"><rect width="26" height="40" fill="${P.stripe}" opacity=".12"/><rect x="34" width="3" height="40" fill="${P.stripe}" opacity=".18"/></pattern>
      <pattern id="${u}panel" y="596" width="150" height="170" patternUnits="userSpaceOnUse"><rect x="14" y="32" width="122" height="112" rx="8" fill="#000" opacity=".13"/><rect x="20" y="38" width="110" height="100" rx="5" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="3"/></pattern>
      <g id="${u}bulb">${on ? `<circle cy="12" r="24" fill="url(#${u}bglow)"/>` : ''}<rect x="-3.5" y="-1" width="7" height="7" rx="2" fill="#3A2A20"/><ellipse cy="13" rx="6.5" ry="8" fill="${on ? '#FFEBAE' : '#FFFDF6'}"/><ellipse cx="-2" cy="10" rx="2" ry="3" fill="#fff" opacity=".85"/></g>
    </defs>
      <path d="${wallD}" fill-rule="evenodd" fill="url(#${u}wall)"/><path d="${wallD}" fill-rule="evenodd" fill="url(#${u}stripe)"/>
      ${P.shade ? `<path d="${wallD}" fill-rule="evenodd" fill="url(#${u}shade)"/>` : ''}
      <rect width="2400" height="30" fill="${P.wall[1]}"/><rect y="30" width="2400" height="6" fill="#000" opacity=".08"/><rect y="24" width="2400" height="5" fill="${P.mold}" opacity=".8"/>
      <rect y="596" width="2400" height="170" fill="url(#${u}wains)"/><rect y="596" width="2400" height="170" fill="url(#${u}panel)"/>
      <rect y="588" width="2400" height="16" rx="4" fill="#C9A15A"/><rect y="588" width="2400" height="4" fill="#F0D593" opacity=".8"/><rect y="604" width="2400" height="7" fill="#000" opacity=".14"/>`;
    wall += `<g id="${u}sconce" transform="translate(760 300)">${sconce(u, on)}</g><use href="#${u}sconce" x="880"/>`;
    // window: moulding, keystone, frame and glazing bars (a fanlight on top)
    const bars = [30, 60, 90, 120, 150].map((a) => {
      const c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180);
      return `M${i0(1200 + 74 * c)} ${i0(410 - 74 * s)}L${i0(1200 + 290 * c)} ${i0(410 - 290 * s)}`;
    }).join('');
    wall += `<path d="M894 596V410A306 306 0 0 1 1506 410V596" fill="none" stroke="${P.mold}" stroke-width="32"/>
      <path d="M878 596V410A322 322 0 0 1 1522 410V596" fill="none" stroke="#000" stroke-width="3" opacity=".08"/>
      <path d="M1182 84H1218L1226 128H1174Z" fill="${P.mold}"/><path d="M1182 84H1218L1226 128H1174Z" fill="#000" opacity=".06"/>
      <g fill="none" stroke="${P.wains[0]}" stroke-linecap="round"><path d="${hole}" stroke-width="16"/><path d="${bars}M1126 410A74 74 0 0 1 1274 410" stroke-width="9"/><path d="M910 410H1490M1103 410V580M1297 410V580" stroke-width="12"/></g>
      <path d="M930 560L1000 420H1030L960 560ZM1124 560L1194 420H1210L1140 560ZM1318 560L1388 420H1420L1350 560Z" fill="#fff" opacity=".1"/>
      <path d="M950 330A250 250 0 0 1 1060 196" stroke="#fff" stroke-width="10" fill="none" opacity=".14" stroke-linecap="round"/>
      <rect x="884" y="566" width="632" height="24" rx="6" fill="${P.mold}"/><rect x="884" y="566" width="632" height="6" rx="3" fill="#fff" opacity=".5"/><rect x="890" y="590" width="620" height="8" fill="#000" opacity=".12"/>`;
    // herbs on the sill (seen beside the couple on phones): basil and lavender
    wall += `<path d="M982 566l-4 -30h44l-4 30ZM1382 566l-4 -30h44l-4 30Z" fill="url(#${u}wpot)"/><rect x="974" y="530" width="52" height="10" rx="4" fill="#DB8C5E"/><rect x="1374" y="530" width="52" height="10" rx="4" fill="#DB8C5E"/>
      <circle cx="988" cy="520" r="16" fill="#5E9E52"/><circle cx="1012" cy="516" r="18" fill="#6FB25E"/><circle cx="1000" cy="502" r="16" fill="#7BBE68"/><circle cx="1004" cy="508" r="5" fill="#A8DC8C" opacity=".8"/>
      <path d="M1386 530q-8 -30 -4 -50M1396 530q-2 -34 2 -58M1406 530q4 -30 12 -48M1414 530q8 -24 18 -34" stroke="#6F9A5C" stroke-width="3" fill="none"/>
      <g fill="#A68BD8">${[[1382, 482], [1398, 474], [1418, 484], [1432, 498], [1384, 494], [1400, 488], [1416, 496]].map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="4" ry="8"/>`).join('')}</g>`;
    // velvet curtains, tied back
    const drape = `<path d="M834 54H968C962 190 902 330 892 440C904 560 930 680 930 758H818C834 660 858 540 852 440C842 320 830 190 834 54Z" fill="url(#${u}curtain)"/>
      <path d="M870 60C868 200 872 330 872 436M900 60C896 220 884 330 880 436M872 450C866 560 856 660 846 754M884 452C894 560 904 660 904 754" stroke="#5E1428" stroke-width="5" fill="none" opacity=".35"/>
      <path d="M850 64C846 200 850 330 862 436M862 450C856 560 846 660 836 754" stroke="#E0708A" stroke-width="4" fill="none" opacity=".4"/>
      <ellipse cx="872" cy="442" rx="32" ry="9" fill="#D9B061"/><path d="M852 446q-6 20 2 40l8 -2q-4 -18 2 -36Z" fill="#C99A4A"/><circle cx="857" cy="490" r="6" fill="#E3BD6C"/>`;
    wall += `<rect x="802" y="46" width="796" height="10" rx="5" fill="#C9A15A"/><circle cx="802" cy="51" r="12" fill="#D9B061"/><circle cx="1598" cy="51" r="12" fill="#D9B061"/>
      <g id="${u}drape">${drape}</g><use href="#${u}drape" transform="matrix(-1 0 0 1 2400 0)"/>`;
    // string lights: across the window, and along the top of the walls
    wall += garland(u, 918, 1482, 350, 30, 2, 6, on) + garland(u, -30, 790, 40, 34, 3, 3, on) + garland(u, 1610, 2430, 40, 34, 3, 3, on);
    // wine rack (left): a shelf of bottles over a cubby rack
    wall += `<rect x="448" y="258" width="262" height="296" rx="8" fill="#000" opacity=".12"/>
      <rect x="430" y="326" width="272" height="14" rx="4" fill="url(#${u}wood)"/><path d="M450 340v18h12M682 340v18h-12" stroke="#6E4128" stroke-width="6" fill="none"/>`;
    [[466, '#2F5A3A', 72, '#5A2A22'], [516, '#6E1F2E', 80, '#5A2A22'], [566, '#E89AA6', 62, '#D9B061'], [616, '#3D6B45', 84, '#E3BD6C']].forEach(([x, c, h, cap]) => {
      wall += `<path d="M${x - 13} 326V${i0(333 - h * 0.62)}q0 -7 7 -7h2V${326 - h}h8V${i0(326 - h * 0.62)}h2q7 0 7 7V326Z" fill="${c}"/><rect x="${x - 6}" y="${326 - h - 4}" width="12" height="12" rx="2" fill="${cap}"/>
        <rect x="${x - 10}" y="${i0(326 - h * 0.44)}" width="20" height="16" rx="2" fill="#F6EEDC"/><rect x="${x - 9}" y="${i0(326 - h * 0.56)}" width="4" height="${i0(h * 0.1)}" rx="2" fill="#fff" opacity=".35"/>`;
    });
    let ends = '', corks = '';
    for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
      if ((i + j * 5) % 7 === 3) continue;
      const cx = i0(475 + i * 45.6), cy = 391 + j * 54;
      ends += `<circle cx="${cx}" cy="${cy}" r="17" fill="${['#2F5A3A', '#6E1F2E', '#3D6B45', '#4A1A28'][(i + j) % 4]}"/>`;
      corks += `<circle cx="${cx}" cy="${cy}" r="5"/>`;
    }
    wall += `<rect x="666" y="286" width="26" height="40" rx="4" fill="#fff" opacity=".35"/><path d="M660 282h38" stroke="#fff" stroke-width="3" opacity=".6"/>
      <rect x="440" y="352" width="252" height="186" rx="8" fill="url(#${u}wood)"/><rect x="452" y="364" width="228" height="162" rx="4" fill="#3A2418"/>
      ${ends}<g fill="#D8B27A">${corks}</g>
      <path d="M452 418H680M452 472H680M497 364V526M543 364V526M588 364V526M634 364V526" stroke="#6E4128" stroke-width="5"/>`;
    // poster (far left) and gilded mirror (far right)
    wall += `<rect x="156" y="196" width="190" height="250" rx="8" fill="#000" opacity=".12"/><rect x="146" y="186" width="190" height="250" rx="8" fill="#5A3A28"/><rect x="160" y="200" width="162" height="222" rx="3" fill="#F6E9D2"/>
      <circle cx="241" cy="290" r="62" fill="#F2B79C"/><path d="M212 400V322q0 -20 20 -28V250h16v44q20 8 20 28V400Z" fill="#355E47"/><rect x="230" y="240" width="20" height="14" rx="3" fill="#D9B061"/><rect x="218" y="336" width="44" height="34" rx="4" fill="#F6E9D2"/><path d="M226 350h28M230 358h20" stroke="#C2566E" stroke-width="3"/>
      <path d="M270 330q-4 34 24 34q28 0 24 -34Z" fill="#fff" opacity=".85"/><path d="M272 340q4 22 22 22q18 0 22 -22Z" fill="#9E2542"/><rect x="292" y="364" width="4" height="30" fill="#fff"/><ellipse cx="294" cy="396" rx="14" ry="4" fill="#fff"/>
      <g fill="#8C4F9A">${[[190, 226], [202, 240], [184, 244], [196, 254], [208, 226], [190, 266]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9"/>`).join('')}</g><path d="M196 216q6 -14 18 -14" stroke="#5E9E52" stroke-width="4" fill="none"/>
      <circle cx="2208" cy="330" r="118" fill="#000" opacity=".1"/><circle cx="2200" cy="320" r="118" fill="url(#${u}gold)"/><circle cx="2200" cy="320" r="100" fill="#A77A34" opacity=".5"/><circle cx="2200" cy="320" r="94" fill="url(#${u}mirror)"/>
      <path d="M2140 300L2210 230M2150 330L2240 240" stroke="#fff" stroke-width="12" opacity=".35" stroke-linecap="round"/>
      <path d="M2176 200q24 -26 48 0q-24 -8 -48 0Z" fill="url(#${u}gold)"/><circle cx="2200" cy="194" r="10" fill="url(#${u}gold)"/>`;
    // chalkboard menu (right) and the restaurant's name above it
    const title = String(label(sc, 'menuTitle', '今晚菜单', "Tonight's menu") || '').trim();
    const menu = listOf(label(sc, 'menu', ['奶油意面', '牛排', '蘑菇汤', '提拉米苏'], ['Pasta', 'Steak', 'Mushroom soup', 'Tiramisu'])).slice(0, 4);
    const heart = (x, y, c) => `<path d="M${x} ${y + 6}C${x - 11} ${y - 2} ${x - 6} ${y - 11} ${x} ${y - 5}C${x + 6} ${y - 11} ${x + 11} ${y - 2} ${x} ${y + 6}Z" fill="${c}"/>`;
    wall += `<rect x="1720" y="240" width="290" height="300" rx="14" fill="#000" opacity=".14"/><rect x="1708" y="228" width="290" height="300" rx="14" fill="url(#${u}wood)"/>
      <rect x="1722" y="242" width="262" height="272" rx="8" fill="#2E3A36"/><ellipse cx="1800" cy="440" rx="80" ry="30" fill="#fff" opacity=".04"/><ellipse cx="1900" cy="300" rx="60" ry="24" fill="#fff" opacity=".04"/>
      ${title ? `${txt(title, 1853, 292, 32, 232, 'text-anchor="middle" fill="#FFE08A"')}<path d="M1770 308q40 6 83 0t83 0" stroke="#FFE08A" stroke-width="2.5" fill="none" opacity=".7"/>` : ''}
      ${menu.map((t, i) => `${txt(t, 1742, 354 + i * 44, 26, 194, 'fill="#F4EFE6"')}${heart(1962, 346 + i * 44, ['#FF9DB0', '#FFE08A', '#9FE3C8', '#FF9DB0'][i])}`).join('')}
      <rect x="1740" y="518" width="44" height="8" rx="3" fill="#F4EFE6" opacity=".85"/><rect x="1796" y="519" width="18" height="7" rx="3" fill="#FFE08A" opacity=".85"/>`;
    const name = String(label(sc, 'name', '', '') || '').trim();
    if (name) {
      const fs = fit(name, 34, 204);
      wall += `<rect x="1726" y="142" width="262" height="68" rx="34" fill="#000" opacity=".12"/><rect x="1720" y="136" width="262" height="68" rx="34" fill="${P.wains[1]}" stroke="#D9B061" stroke-width="5"/>
        <rect x="1730" y="146" width="242" height="48" rx="24" fill="none" stroke="#D9B061" stroke-width="1.5" opacity=".6"/>
        ${txt(name, 1851, f(170 + fs * 0.36), 34, 204, 'text-anchor="middle" fill="#F3D58A"')}`;
    }

    // ------------------------------------------------------------------
    // Floor, olive trees and the other diners' tables
    // ------------------------------------------------------------------
    let near = `<defs>${lg(u + 'floorSh', [[0, '#3A2418', 0.28], [0.35, '#3A2418', 0.06], [1, '#3A2418', 0.22]])}${lg(u + 'pot', [[0, '#C9744A'], [1, '#A95A36']])}${glow(u + 'cglow', '#FFB84A')}${chairDef(u)}</defs>
      <rect y="760" width="2400" height="240" fill="${P.floor}"/>`;
    const rows = [760, 792, 832, 882, 940, 1000];
    const px = (x0, y) => i0(1200 + (x0 - 1200) * (1 + 0.4 * (y - 760) / 240));
    let tiles = '';
    for (let j = 0; j < rows.length - 1; j++) {
      const y0 = rows[j], y1 = rows[j + 1];
      for (let x0 = -140 + (j % 2) * 110; x0 < 2420; x0 += 220) tiles += `M${px(x0, y0)} ${y0}H${px(x0 + 110, y0)}L${px(x0 + 110, y1)} ${y1}H${px(x0, y1)}Z`;
    }
    near += `<path d="${tiles}" fill="${P.tile}" opacity=".85"/><rect y="760" width="2400" height="240" fill="url(#${u}floorSh)"/>
      <rect y="752" width="2400" height="14" fill="#3A2A20"/><rect y="752" width="2400" height="3" fill="#fff" opacity=".12"/>`;
    if (on) near += `<ellipse cx="1200" cy="850" rx="420" ry="70" fill="url(#${u}cglow)" opacity="${mood === 'night' ? 0.35 : 0.2}"/><ellipse cx="520" cy="812" rx="200" ry="26" fill="url(#${u}cglow)" opacity=".3"/><ellipse cx="1880" cy="812" rx="200" ry="26" fill="url(#${u}cglow)" opacity=".3"/>`;
    near += oliveTree(u, 800, 800, 0.9) + oliveTree(u, 1600, 800, 0.9);
    near += dinerTable(u, 520, 806, on) + dinerTable(u, 1880, 806, on);

    // ------------------------------------------------------------------
    // The couple's table (prop, drawn over them)
    // ------------------------------------------------------------------
    let prop = '';
    const propExtras = [];
    if (sc.table !== false) {
      let hem = '', lace = '';
      for (let x = 1460, i = 0; i < 8; i++, x -= 65) { hem += `Q${x - 32.5} 910 ${x - 65} 894`; lace += `Q${x - 32.5} 904 ${x - 65} 888`; }
      prop = `<defs>${lg(u + 'cloth', P.cloth)}${glow(u + 'tglow', '#FFB84A')}</defs>
        <ellipse cx="1200" cy="992" rx="300" ry="18" fill="#000" opacity=".16"/>
        <rect x="1016" y="886" width="26" height="104" rx="8" fill="#5A3A28"/><rect x="1358" y="886" width="26" height="104" rx="8" fill="#5A3A28"/>
        <path d="M948 742H1452L1460 894${hem}L940 894Z" fill="url(#${u}cloth)"/>
        <path d="${[1010, 1075, 1140, 1205, 1270, 1335, 1400].map((x) => `M${x} 756C${x - 5} 800 ${x + 5} 850 ${x} 896`).join('')}" stroke="#CFC2C4" stroke-width="7" fill="none" opacity=".45" stroke-linecap="round"/>
        <path d="M1460 888${lace}" stroke="#fff" stroke-width="4" stroke-dasharray="2 8" stroke-linecap="round" fill="none" opacity=".9"/>
        <rect x="940" y="722" width="520" height="28" rx="13" fill="${P.cloth[0][1]}"/><rect x="946" y="724" width="508" height="6" rx="3" fill="#fff" opacity=".8"/><rect x="944" y="746" width="512" height="6" fill="#000" opacity=".05"/>
        <ellipse cx="1150" cy="736" rx="260" ry="40" fill="url(#${u}tglow)" opacity="${f(0.35 * P.candle)}"/>`;
      // pasta
      prop += `<ellipse cx="1032" cy="738" rx="72" ry="12" fill="#000" opacity=".12"/><ellipse cx="1032" cy="731" rx="66" ry="14" fill="#fff"/><ellipse cx="1032" cy="730" rx="50" ry="9" fill="none" stroke="#DCE3EE" stroke-width="3"/>
        <path d="M994 729Q996 696 1032 692Q1068 696 1070 729Z" fill="#F3D27E"/>
        <path d="M1004 721Q1032 700 1060 721M1010 711Q1034 694 1056 711M1016 726Q1040 710 1064 727M1000 727Q1020 708 1044 715" stroke="#DDAF52" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M1014 706Q1030 697 1046 700" stroke="#FFF1C4" stroke-width="3" fill="none" stroke-linecap="round"/>
        <ellipse cx="1040" cy="697" rx="10" ry="5" transform="rotate(-25 1040 697)" fill="#4E9A4A"/><ellipse cx="1052" cy="700" rx="8" ry="4" transform="rotate(20 1052 700)" fill="#63AE56"/>
        <circle cx="1016" cy="718" r="7" fill="#E0483A"/><circle cx="1058" cy="720" r="6" fill="#E0483A"/><circle cx="1014" cy="716" r="2" fill="#fff" opacity=".7"/>
        <path d="M1026 706h.1M1044 712h.1M1034 718h.1" stroke="#FFF6DA" stroke-width="4" stroke-linecap="round"/>`;
      // steak with potatoes and rosemary
      prop += `<ellipse cx="1368" cy="738" rx="72" ry="12" fill="#000" opacity=".12"/><ellipse cx="1368" cy="731" rx="66" ry="14" fill="#fff"/><ellipse cx="1368" cy="730" rx="50" ry="9" fill="none" stroke="#DCE3EE" stroke-width="3"/>
        <ellipse cx="1352" cy="729" rx="26" ry="4" fill="#6A2A18" opacity=".7"/>
        <path d="M1326 726Q1322 702 1350 699Q1384 693 1398 709Q1408 723 1392 729Z" fill="#7A3A22"/><path d="M1330 717Q1331 703 1352 702Q1382 697 1394 710Q1384 717 1360 717Z" fill="#A5542F"/>
        <path d="M1342 704l10 12M1358 700l10 13M1374 700l10 13" stroke="#4A2012" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="1404" cy="724" r="9" fill="#E8B45A"/><circle cx="1414" cy="716" r="7" fill="#F0C46A"/><circle cx="1402" cy="721" r="3" fill="#FFE9B0"/>
        <path d="M1318 724q-4 -12 4 -22" stroke="#4E8A44" stroke-width="3" fill="none"/><path d="M1318 718l-7 -3M1319 712l-7 -3M1320 718l6 -4M1321 710l6 -4" stroke="#6FAE5E" stroke-width="2.5" stroke-linecap="round"/>`;
      // candle in a brass holder
      prop += `<ellipse cx="1112" cy="738" rx="22" ry="5" fill="#000" opacity=".14"/><ellipse cx="1112" cy="734" rx="20" ry="6" fill="#C9A15A"/>
        <path d="M1106 734Q1108 716 1104 708H1120Q1116 716 1118 734Z" fill="#D9B46A"/><ellipse cx="1112" cy="708" rx="16" ry="4" fill="#E7C57A"/>
        <rect x="1104" y="668" width="16" height="40" rx="3" fill="#FFF8EC"/><path d="M1106 672q3 8 0 14" stroke="#EFE2CC" stroke-width="3" fill="none" stroke-linecap="round"/><rect x="1115" y="670" width="3" height="34" rx="1.5" fill="#fff"/>
        <path d="M1112 668v-7" stroke="#3A2A20" stroke-width="2"/>
        <circle cx="1112" cy="650" r="${i0(40 + 26 * P.candle)}" fill="url(#${u}tglow)" class="bistro-halo"/>
        <g class="bistro-flame" style="transform-box:fill-box;transform-origin:50% 100%"><path d="M1112 665q-9 -10 0 -28q9 18 0 28Z" fill="#FFB84A"/><path d="M1112 663q-4 -5 0 -12q4 7 0 12Z" fill="#FFF3C4"/></g>`;
      // two glasses of red wine
      prop += wineGlass(1172, 'bistro-glass-l') + wineGlass(1228, 'bistro-glass-r');
      // a single rose in a bud vase
      prop += `<ellipse cx="1290" cy="738" rx="14" ry="3.5" fill="#000" opacity=".12"/>
        <path d="M1290 700Q1287 680 1291 660" stroke="#4E8A44" stroke-width="3.5" fill="none"/><path d="M1290 684q16 -12 22 -2q-10 10 -22 2Z" fill="#5FA356"/><path d="M1290 692q-14 -8 -18 0q8 8 18 0Z" fill="#6FB25E"/>
        <path d="M1282 736Q1272 724 1280 712Q1286 704 1286 692H1294Q1294 704 1300 712Q1308 724 1298 736Z" fill="#D6ECF4" opacity=".75"/><path d="M1280 728Q1276 720 1282 712" stroke="#fff" stroke-width="2.5" fill="none" opacity=".8"/>
        <path d="M1280 662q10 8 22 0l-2 6q-9 6 -18 0Z" fill="#4E8A44"/>
        <circle cx="1291" cy="652" r="13" fill="#D7314B"/><path d="M1279 650q12 -16 24 0q-12 -6 -24 0Z" fill="#E8506A"/>
        <path d="M1291 652m-5 0a5 5 0 1 1 5 5a8 8 0 1 1 -8 -8" stroke="#A61F37" stroke-width="2" fill="none"/><circle cx="1286" cy="646" r="2.5" fill="#FF9DB0" opacity=".8"/>`;
      propExtras.push(fxHTML(988, 614, 90, 88, 'steam', '<i></i><i></i><i></i>'), fxHTML(1330, 630, 72, 70, 'steam', '<i></i><i></i>'), fxHTML(1160, 596, 80, 60, 'bistro-spark', '<b>✦</b><b>✧</b><b>✦</b>'));
    }

    // ------------------------------------------------------------------
    // Foreground corners (drawn over the couple, so only at the edges)
    // ------------------------------------------------------------------
    let front = `<defs>${lg(u + 'fleaf', [[0, '#4E8A52'], [1, '#2E5E3A']])}${lg(u + 'fpot', [[0, '#B8664A'], [1, '#8A4630']])}${lg(u + 'bucket', [[0, '#E9ECF2'], [0.5, '#B9C0CC'], [1, '#8E96A6']], 0, 0, 1, 0)}</defs>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 100%">
      ${[[-70, -150, -30], [-30, -210, -12], [20, -230, 8], [70, -190, 26], [110, -130, 44], [-100, -90, -52]].map(([dx, dy, a]) => `<path d="M150 930Q${i0(150 + dx * 0.4)} ${i0(930 + dy * 0.6)} ${150 + dx} ${930 + dy}Q${i0(180 + dx * 0.8)} ${i0(930 + dy * 0.5)} 150 930Z" fill="url(#${u}fleaf)" transform="rotate(${f(a * 0.3)} 150 930)"/>`).join('')}</g>
      <path d="M70 920H230L214 1000H86Z" fill="url(#${u}fpot)"/><rect x="60" y="906" width="180" height="24" rx="8" fill="#C97A58"/>
      <path d="M2210 1000L2236 860M2290 1000L2264 860M2250 1000V860" stroke="#B8893E" stroke-width="8" stroke-linecap="round"/>
      <path d="M2262 820L2296 700" stroke="#1F3A2A" stroke-width="30" stroke-linecap="round"/><path d="M2296 700L2305 668" stroke="#D9B061" stroke-width="16" stroke-linecap="round"/>
      <rect x="2268" y="742" width="22" height="30" rx="3" transform="rotate(16 2279 757)" fill="#F6EEDC"/>
      <path d="M2196 780H2304L2292 868Q2250 880 2208 868Z" fill="url(#${u}bucket)"/><ellipse cx="2250" cy="780" rx="54" ry="10" fill="#DDE2EA"/><ellipse cx="2250" cy="781" rx="46" ry="7" fill="#9AA4B4"/>
      <circle cx="2226" cy="776" r="9" fill="#EAF6FF" opacity=".9"/><circle cx="2250" cy="773" r="8" fill="#EAF6FF" opacity=".9"/><path d="M2212 800q-4 30 4 56" stroke="#fff" stroke-width="6" fill="none" opacity=".6" stroke-linecap="round"/>
      <path d="M2284 786q24 16 14 64l-12 2q6 -40 -12 -60Z" fill="#fff"/>`;

    const tidy = (t) => t.replace(/>\s+</g, '><');
    return {
      sky: `linear-gradient(${P.wall[0]}, ${P.wall[1]})`,
      layers: [
        { depth: 0.12, svg: tidy(city) },
        { depth: 0.35, svg: tidy(wall) },
        { depth: 1, svg: tidy(near) },
        sc.table !== false && { depth: 1, svg: tidy(prop), front: true, prop: 'table', extras: propExtras },
        { depth: 1.35, svg: tidy(front), front: true },
      ].filter(Boolean),
    };
  }

  TripArt.scenes.bistro = bistro;
})();
