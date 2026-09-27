/*
 * 咖啡馆 — a cosy coffee shop for brunch, coffee or dessert.
 * Counter with an espresso machine and a pastry case, a chalkboard menu, two big windows
 * onto the street (mood: day / sunset / night), hanging plants, pendant lamps and a cat.
 * By default a small round café table stands in front of the couple (use idle type 'sit');
 * set `table: false` on the stop to leave it out so the couple can stand.
 *
 * labels: name (shop sign, '' hides it), menuTitle, menu (array or "a, b, c"; up to 4)
 */
(function () {
  'use strict';
  const H = TripArt.h;
  const { rng, lg, glow, cloud, fx, fxHTML, birds, label, css, esc, moodOf } = H;
  const listOf = H.listOf || ((v) => (Array.isArray(v) ? v : String(v == null ? '' : v).split(/\s*[,，、]\s*/).filter(Boolean)));
  // rough text width, to squeeze long labels into their board
  const textW = (t, fs) => [...String(t)].reduce((a, c) => a + (/[⺀-￿]/.test(c) ? 1 : 0.56), 0) * fs;
  const fit = (t, fs, max) => (textW(t, fs) > max ? ` textLength="${max}" lengthAdjust="spacingAndGlyphs"` : '');
  const min = (s) => s.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').replace(/ x1="0" y1="0"/g, '');
  const use = (u, id, x, y, c, extra = '') => `<use href="#${u}${id}" x="${x}" y="${y}"${c ? ` color="${c}"` : ''}${extra}/>`;

  // the two big windows: x, y, w, h
  const WINS = [[80, 160, 520, 440], [1800, 160, 520, 440]];
  const winPath = (x, y, w, h, r = 44) => `M${x} ${y + h}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h}Z`;
  const wallPath = `M0 0H2400V770H0Z${WINS.map((w) => winPath(...w)).join('')}`;

  const MOODS = {
    day: {
      sky: 'linear-gradient(#86CBF5, #BFE6FF 45%, #FFF4DE 72%)',
      bld: ['#FFD6C2', '#FFE8A8', '#CFE3F6', '#F8C8D6', '#CDEBD8', '#FFDDBE'],
      trim: '#FFFFFF', win: '#9CCBEE', lit: '#9CCBEE', shop: '#9CCBEE', walk: '#EDE4D8',
      tree: ['#5FAE62', '#8DD17C'], trunk: '#A98E6A', aw: ['#FF8FA3', '#6CC3A8', '#FFC34D'], awBg: '#FFFDF6',
      glass: 0.22, lamp: 0.28, patch: '#FFF6D2', bulb: '#FFF6E0',
    },
    sunset: {
      sky: 'linear-gradient(#8C7FD2, #F59AA6 40%, #FFC27E 66%, #FFE3AE)',
      bld: ['#F2B49C', '#F6C68E', '#D8B0D2', '#EFA5B2', '#E8BE9C', '#F7CFA4'],
      trim: '#FFE8D4', win: '#F7C6A8', lit: '#FFD98A', shop: '#FFDDA0', walk: '#E9C5AE',
      tree: ['#8FA35F', '#B8BD72'], trunk: '#8E6E58', aw: ['#F2708A', '#58AE93', '#F5AE3C'], awBg: '#FFF1E2',
      glass: 0.18, lamp: 0.6, patch: '#FFC27A', bulb: '#FFE9A8', tint: '#FF8A3D', tintOp: 0.07,
    },
    night: {
      sky: 'linear-gradient(#0D1636, #22346A 60%, #3D4A86)',
      bld: ['#3A4474', '#434D7F', '#373E6A', '#48487B', '#3E4977', '#454F7D'],
      trim: '#56608F', win: '#2C355F', lit: '#FFD98A', shop: '#FFD98A', walk: '#454B70',
      tree: ['#2C4652', '#385A5E'], trunk: '#34344A', aw: ['#9A5A78', '#3F7A74', '#A08050'], awBg: '#6E6A8E',
      glass: 0.1, lamp: 1, patch: '', bulb: '#FFE9A8', tint: '#4A2C2A', tintOp: 0.22,
    },
  };

  // ---------- reusable bits (<g> in <defs>, placed with <use>; colour via `color`) ----------
  const MUG = `<path d="M13 -24q12 0 12 10q0 10 -12 10" stroke="currentColor" stroke-width="5" fill="none"/><rect x="-15" y="-32" width="30" height="32" rx="7" fill="currentColor"/><rect x="-11" y="-28" width="6" height="20" rx="3" fill="#fff" opacity=".4"/>`;
  const JAR = `<rect x="-18" y="-50" width="36" height="50" rx="9" fill="#EAF6FB" opacity=".75"/><rect x="-14" y="-34" width="28" height="30" rx="6" fill="currentColor"/><rect x="-16" y="-58" width="32" height="10" rx="4" fill="#C98F5B"/><rect x="-10" y="-26" width="20" height="12" rx="3" fill="#FFF6E6"/><rect x="-12" y="-46" width="5" height="36" rx="2.5" fill="#fff" opacity=".6"/>`;
  const POT = `<path d="M-8 -30q-14 -20 -4 -34q10 10 4 34M8 -30q16 -16 6 -32q-12 8 -6 32M0 -30q-2 -26 4 -40q8 18 -4 40" fill="#62B566"/><path d="M-20 -30H20L15 0H-15Z" fill="currentColor"/><rect x="-22" y="-34" width="44" height="8" rx="4" fill="currentColor"/><rect x="-22" y="-34" width="44" height="3" fill="#fff" opacity=".35"/>`;
  const CRO = `<path d="M-28 -2Q-24 -24 0 -26Q24 -24 28 -2Q16 -8 0 -6Q-16 -8 -28 -2Z" fill="#E9A149"/><path d="M-16 -22q4 8 2 16M0 -26v20M16 -22q-4 8 -2 16" stroke="#C07A2E" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-14 -20q10 -6 22 -2" stroke="#FFD58A" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>`;
  const CUPCAKE = `<path d="M-14 -19H14L10 0H-10Z" fill="#F7B4C4"/><path d="M-6 -19l-1 19M0 -19V0M6 -19l1 19" stroke="#E68CA4" stroke-width="2"/><ellipse cy="-21" rx="17" ry="7" fill="currentColor"/><ellipse cy="-28" rx="12" ry="6" fill="currentColor"/><ellipse cy="-33" rx="7" ry="4" fill="currentColor"/><circle cx="2" cy="-40" r="4.5" fill="#E8344E"/>`;
  // strawberry shortcake slice, base at 0
  const CAKE = `<rect x="-30" y="-38" width="60" height="36" rx="6" fill="#FFE2A6"/><rect x="-30" y="-25" width="60" height="9" fill="#FFFDF8"/><path d="M-22 -20h12M-4 -20h12M14 -20h10" stroke="#FF7C93" stroke-width="7" stroke-linecap="round"/><path d="M-32 -34Q-30 -48 -16 -46Q-8 -54 0 -46Q10 -54 18 -46Q32 -48 32 -34Z" fill="#FFFDF8"/><path d="M-2 -46q-10 -4 -8 -16q9 -6 17 0q2 12 -9 16Z" fill="#FF4F6E"/><path d="M-6 -60l4 -6l4 6" stroke="#5FB35A" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="-26" y="-34" width="6" height="28" rx="3" fill="#fff" opacity=".35"/>`;
  // latte on a saucer, handle on the right (mirror with scale(-1 1))
  const LATTE = `<ellipse rx="42" ry="9" fill="#fff"/><ellipse cy="-1" rx="28" ry="5" fill="#000" opacity=".07"/><path d="M27 -28q17 -2 16 10q-1 10 -19 8" stroke="currentColor" stroke-width="6" fill="none"/><path d="M-30 -34H30Q28 -5 0 -4Q-28 -5 -30 -34Z" fill="currentColor"/><ellipse cy="-34" rx="30" ry="8" fill="#FFF9F0"/><ellipse cy="-33" rx="25" ry="6" fill="#C98552"/><path d="M0 -29C-12 -33 -12 -37 -6 -37.5C-2 -38 0 -36.5 0 -35.5C0 -36.5 2 -38 6 -37.5C12 -37 12 -33 0 -29Z" fill="#FFF1DE"/><path d="M-22 -26q2 12 10 18" stroke="#fff" stroke-width="4" opacity=".45" fill="none" stroke-linecap="round"/>`;
  const BEAN = `<ellipse rx="10" ry="13" fill="#6B3F26"/><path d="M0 -11Q-5 0 0 11" stroke="#C9935E" stroke-width="3" fill="none"/>`;
  const bean = (u, x, y, a, s = 1) => `<use href="#${u}bean" transform="translate(${x} ${y}) rotate(${a}) scale(${s})"/>`;

  function awning(u, x, w, i) {
    return `<rect x="${x + 12}" y="432" width="${w - 24}" height="34" fill="url(#${u}aw${i})"/><rect x="${x + 12}" y="466" width="${w - 24}" height="11" fill="url(#${u}sc${i})"/><rect x="${x + 12}" y="432" width="${w - 24}" height="5" fill="#000" opacity=".08"/>`;
  }

  function cafe(u, sc = {}) {
    const mood = moodOf(sc, 'day');
    const P = MOODS[mood] || MOODS.day;
    const night = mood === 'night', sunset = mood === 'sunset';
    const r = rng(83);

    // ================= street outside, seen through the windows (slow parallax) =================
    let street = `<defs>${glow(u + 'orb', night ? '#FFF2C8' : sunset ? '#FFB46A' : '#FFF6C4')}${night ? glow(u + 'sl', '#FFD98A') : ''}
      ${P.aw.map((c, i) => `<pattern id="${u}aw${i}" width="40" height="10" patternUnits="userSpaceOnUse"><rect width="40" height="10" fill="${P.awBg}"/><rect width="20" height="10" fill="${c}"/></pattern>
        <pattern id="${u}sc${i}" width="40" height="11" patternUnits="userSpaceOnUse"><circle cx="10" r="10" fill="${c}"/><circle cx="30" r="10" fill="${P.awBg}"/></pattern>`).join('')}
      <pattern id="${u}wn" x="-150" y="246" width="270" height="92" patternUnits="userSpaceOnUse">${[0, 1, 2].map((k) => `<rect x="${24 + k * 90}" width="42" height="56" rx="6" fill="${k === 1 || (night && k === 2) ? P.lit : P.win}"/><rect x="${30 + k * 90}" y="6" width="8" height="30" rx="4" fill="#fff" opacity=".3"/><rect x="${20 + k * 90}" y="54" width="50" height="8" rx="3" fill="${night ? '#6A4E6E' : '#E88FA0'}" opacity="${k === 0 ? 1 : 0}"/>`).join('')}</pattern>
    </defs>`;
    if (night) {
      street += [...Array(12)].map((_, i) => `<circle cx="${((i % 2 ? 1700 : -100) + r() * 800).toFixed(0)}" cy="${(40 + r() * 190).toFixed(0)}" r="${(1 + r() * 2).toFixed(1)}" fill="#fff" opacity="${(0.4 + r() * 0.6).toFixed(2)}"/>`).join('');
      street += `<circle cx="2110" cy="236" r="130" fill="url(#${u}orb)"/><circle cx="2110" cy="236" r="36" fill="#FFF4CF"/>`;
    } else if (sunset) {
      street += `<circle cx="2110" cy="262" r="210" fill="url(#${u}orb)"/><circle cx="2110" cy="262" r="54" fill="#FFE7A8"/>${cloud(150, 250, 0.75, '#FFD2C2', 0.85)}${cloud(1830, 214, 0.5, '#FFE0C8', 0.8)}`;
    } else {
      street += `<circle cx="2120" cy="232" r="150" fill="url(#${u}orb)"/><circle cx="2120" cy="232" r="42" fill="#FFF8D8"/>${cloud(130, 250, 0.75)}${cloud(1830, 214, 0.5, '#fff', 0.9)}`;
    }
    // a row of little shops across the street (tall ones get a second row of windows)
    [[360, 0], [270, 1], [360, 0], [360, 1], [360, 0], [360, 1], [360, 0], [360, 1]].reduce((x, [w, tall], i) => {
      const top = tall ? 214 : 306, c = P.bld[i % P.bld.length];
      street += `<rect x="${x}" y="${top}" width="${w}" height="${552 - top}" fill="${c}"/><rect x="${x - 6}" y="${top - 10}" width="${w + 12}" height="18" rx="6" fill="${P.trim}"/>
        <rect x="${x}" y="${tall ? 246 : 338}" width="${w}" height="${tall ? 158 : 66}" fill="url(#${u}wn)"/><rect x="${x + 22}" y="478" width="${w - 44}" height="74" rx="6" fill="${P.shop}"/>${awning(u, x, w, i % 3)}`;
      return x + w;
    }, -150);
    street += `<rect y="552" width="2400" height="60" fill="${P.walk}"/><rect y="552" width="2400" height="5" fill="#000" opacity=".08"/>`;
    [470, 1930].forEach((x) => {
      street += `<g transform="translate(${x} 580) scale(.9)"><path d="M-14 0C-12 -90 -10 -150 -4 -210H6C12 -150 14 -90 16 0Z" fill="${P.trunk}"/>
        <g class="sway" style="transform-box:fill-box;transform-origin:50% 100%"><circle cx="-80" cy="-240" r="80" fill="${P.tree[0]}"/><circle cx="80" cy="-250" r="84" fill="${P.tree[0]}"/>
        <circle cy="-310" r="100" fill="${P.tree[1]}"/><circle cx="-100" cy="-300" r="56" fill="${P.tree[1]}"/><circle cx="104" cy="-306" r="60" fill="${P.tree[1]}"/><circle cx="-30" cy="-360" r="34" fill="#fff" opacity=".14"/></g></g>`;
    });
    [180, 2240].forEach((x) => {
      street += `<rect x="${x - 5}" y="360" width="10" height="230" rx="5" fill="#3F4658"/><path d="M${x} 364q0 -26 26 -26" stroke="#3F4658" stroke-width="8" fill="none"/>
        ${night ? `<circle cx="${x + 30}" cy="354" r="90" fill="url(#${u}sl)"/>` : ''}<path d="M${x + 14} 340h32l-6 22h-20Z" fill="#3F4658"/><ellipse cx="${x + 30}" cy="364" rx="10" ry="6" fill="${night ? '#FFF1B8' : '#F4F0E6'}"/>`;
    });
    const streetExtras = night ? [] : [fx(140, 250, 64, 24, 'bird', birds(), '0 0 64 24'), fx(1850, 290, 48, 18, 'bird b2', birds(), '0 0 64 24')];

    // ================= back wall: windows, shelves, menu, counter =================
    let far = `<defs>
      ${lg(u + 'wall', [[0, '#FFF5E6'], [1, '#F7DEC2']])}${lg(u + 'wain', [[0, '#BCD3B0'], [1, '#9DBD92']])}
      ${lg(u + 'wood', [[0, '#DDA570'], [1, '#B27546']])}${lg(u + 'dwood', [[0, '#9A6440'], [1, '#76482C']])}
      ${lg(u + 'marble', [[0, '#FFFFFF'], [1, '#E9E0D6']])}${lg(u + 'mint', [[0, '#B8EADC'], [1, '#7EC6B2']])}
      ${lg(u + 'chrome', [[0, '#F6F9FB'], [0.5, '#C4CDD6'], [1, '#EEF2F5']], 0, 0, 1, 0)}${lg(u + 'board', [[0, '#3C4B42'], [1, '#2B3630']])}
      <clipPath id="${u}wclip"><path d="${WINS.map((w) => winPath(...w)).join('')}"/></clipPath>
      <pattern id="${u}tile" width="64" height="32" patternUnits="userSpaceOnUse"><rect width="64" height="32" fill="#FFFCF6"/><path d="M0 1H64M0 17H64M1 1V17M33 17V33" stroke="#EDE2D4" stroke-width="2.5"/></pattern>
      <pattern id="${u}slat" width="36" height="10" patternUnits="userSpaceOnUse"><rect width="36" height="10" fill="url(#${u}wood)"/><rect width="5" height="10" fill="#8A5433" opacity=".35"/><rect x="5" width="4" height="10" fill="#fff" opacity=".12"/></pattern>
      <pattern id="${u}pan" x="22" y="628" width="150" height="120" patternUnits="userSpaceOnUse"><rect width="106" height="116" rx="10" fill="#000" opacity=".07"/><rect width="106" height="4" rx="2" fill="#fff" opacity=".25"/></pattern>
      <g id="${u}mug">${MUG}</g><g id="${u}jar">${JAR}</g><g id="${u}pot">${POT}</g><g id="${u}cro">${CRO}</g><g id="${u}cc">${CUPCAKE}</g><g id="${u}cake">${CAKE}</g><g id="${u}bean">${BEAN}</g>
    </defs>`;
    far += `<path d="${wallPath}" fill="url(#${u}wall)" fill-rule="evenodd"/>
      <rect width="2400" height="26" fill="#FFFCF6"/><rect y="26" width="2400" height="7" fill="#000" opacity=".05"/>
      <rect y="600" width="2400" height="170" fill="url(#${u}wain)"/><rect y="628" width="2400" height="116" fill="url(#${u}pan)"/>
      <rect y="592" width="2400" height="14" rx="4" fill="#F7EFE3"/><rect y="606" width="2400" height="5" fill="#000" opacity=".06"/><rect y="752" width="2400" height="18" fill="#F7EFE3"/>`;
    // windows: glass sheen, green frames, sills
    const frame = '#6F9477';
    far += `<g clip-path="url(#${u}wclip)"><rect width="2400" height="600" fill="${night ? '#FFB86A' : '#fff'}" opacity="${night ? 0.06 : 0.12}"/>
      <path d="${WINS.map(([x, y, w, h]) => `M${x + 70} ${y + h}L${x + 230} ${y}H${x + 300}L${x + 140} ${y + h}ZM${x + 330} ${y + h}L${x + 420} ${y}H${x + 446}L${x + 356} ${y + h}Z`).join('')}" fill="#fff" opacity="${P.glass}"/></g>`;
    far += `<path d="${WINS.map((w) => winPath(...w)).join('')}" fill="none" stroke="${frame}" stroke-width="24"/>`;
    WINS.forEach(([x, y, w, h]) => {
      far += `
        <path d="M${x + w / 2 - 7} ${y}h14v${h}h-14ZM${x} ${y + 118}h${w}v14h${-w}ZM${x + w / 4 - 4} ${y}h8v118h-8ZM${x + (3 * w) / 4 - 4} ${y}h8v118h-8Z" fill="${frame}"/>
        <rect x="${x - 28}" y="${y + h - 12}" width="${w + 56}" height="26" rx="9" fill="#FFF9F0"/><rect x="${x - 22}" y="${y + h + 14}" width="${w + 44}" height="8" rx="4" fill="#000" opacity=".07"/>`;
    });
    // left sill: books, succulent, a sleepy cat; right sill: plants
    far += `<rect x="130" y="566" width="80" height="16" rx="4" fill="#9CC9F0"/><rect x="136" y="552" width="70" height="14" rx="4" fill="#F7A6BA"/><rect x="132" y="538" width="76" height="14" rx="4" fill="#FFD27A"/>
      ${use(u, 'pot', 270, 588, '#E7875B')}${use(u, 'pot', 1880, 588, '#F4A9B2')}${use(u, 'pot', 1944, 588, '#FFFFFF')}
      <g transform="translate(470 590)"><ellipse rx="56" ry="6" fill="#000" opacity=".1"/>
        <path class="cafe-tail" style="transform-box:fill-box;transform-origin:0% 100%" d="M26 -8q34 2 36 -24q1 -14 -10 -16" stroke="#9BA3B8" stroke-width="11" fill="none" stroke-linecap="round"/>
        <ellipse cy="-30" rx="36" ry="32" fill="#B7BED0"/><ellipse cy="-22" rx="20" ry="20" fill="#E9ECF3"/><ellipse cx="-14" cy="-3" rx="11" ry="7" fill="#E9ECF3"/><ellipse cx="14" cy="-3" rx="11" ry="7" fill="#E9ECF3"/>
        <g class="cafe-head" style="transform-box:fill-box;transform-origin:50% 100%">
          <path d="M-26 -84l-4 -30l24 14ZM26 -84l4 -30l-24 14Z" fill="#B7BED0"/><path d="M-22 -90l-2 -14l10 7ZM22 -90l2 -14l-10 7Z" fill="#FFB9C8"/>
          <ellipse cy="-76" rx="32" ry="27" fill="#C3C9D8"/><path d="M-6 -102q6 6 12 0M-2 -98v6" stroke="#9BA3B8" stroke-width="3" fill="none" stroke-linecap="round"/>
          <path d="M-18 -78q6 5 12 0M6 -78q6 5 12 0" stroke="#3E3440" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M-3 -69h6l-3 3Z" fill="#E88A9A"/>
          <ellipse cx="-20" cy="-68" rx="6" ry="3.5" fill="#FF9DB0" opacity=".55"/><ellipse cx="20" cy="-68" rx="6" ry="3.5" fill="#FF9DB0" opacity=".55"/>
          <path d="M-12 -66h-18M-12 -63l-16 5M12 -66h18M12 -63l16 5" stroke="#fff" stroke-width="1.6" opacity=".8"/></g></g>
      <g transform="translate(2220 588)"><path d="M-18 -30H18L14 0H-14Z" fill="#9CC9F0"/><path d="M0 -30v-44" stroke="#5DAE66" stroke-width="4"/>
        <circle cy="-80" r="12" fill="#FF9DB0" stroke="#FFB9CB" stroke-width="7" stroke-dasharray="6 3"/><circle cy="-80" r="5" fill="#FFE08A"/></g>`;
    // tiled backsplash behind the counter
    far += `<rect x="744" y="186" width="912" height="410" fill="url(#${u}tile)"/><rect x="736" y="176" width="928" height="14" rx="5" fill="url(#${u}wood)"/><rect x="744" y="190" width="912" height="10" fill="#000" opacity=".05"/>`;
    // shop-name board
    const name = String(label(sc, 'name', '咖啡馆', 'Café') || '').trim();
    if (name) {
      const bw = Math.min(textW(name, 42), 440) + 140, bx = 1200 - bw / 2;
      far += `<path d="M${bx + 46} 26L${bx + 62} 94M${bx + bw - 46} 26L${bx + bw - 62} 94" stroke="#8A5A3C" stroke-width="4"/>
        <rect x="${bx}" y="98" width="${bw}" height="68" rx="34" fill="#000" opacity=".08"/><rect x="${bx}" y="90" width="${bw}" height="68" rx="34" fill="url(#${u}dwood)"/>
        <rect x="${bx + 10}" y="98" width="${bw - 20}" height="52" rx="26" fill="none" stroke="#FFE3B8" stroke-width="3" stroke-dasharray="1 9" stroke-linecap="round" opacity=".7"/>
        <text x="1200" y="139" text-anchor="middle" class="svg-hand" font-size="42" fill="#FFF3DC"${fit(name, 42, 440)}>${esc(name)}</text>${bean(u, bx + 38, 124, -25)}${bean(u, bx + bw - 38, 124, 25)}`;
    }
    // chalkboard menu
    const title = String(label(sc, 'menuTitle', '今日咖啡', 'Coffee') || '').trim();
    const items = listOf(label(sc, 'menu', ['拿铁', '美式', '抹茶拿铁', '可颂'], ['Latte', 'Americano', 'Matcha latte', 'Croissant'])).map((t) => String(t).trim()).filter(Boolean).slice(0, 4);
    far += `<rect x="1016" y="206" width="368" height="238" rx="16" fill="#000" opacity=".1"/><rect x="1016" y="198" width="368" height="238" rx="16" fill="url(#${u}dwood)"/>
      <rect x="1030" y="212" width="340" height="210" rx="10" fill="url(#${u}board)"/><ellipse cx="1120" cy="300" rx="80" ry="40" fill="#fff" opacity=".04"/><ellipse cx="1300" cy="380" rx="60" ry="26" fill="#fff" opacity=".04"/>
      ${title ? `<text x="1200" y="252" text-anchor="middle" class="svg-hand" font-size="32" fill="#FFE08A"${fit(title, 32, 240)}>${esc(title)}</text>` : ''}
      <path d="M1100 266q12 -6 25 0t25 0t25 0t25 0t25 0t25 0t25 0t25 0" stroke="#F6EEDC" stroke-width="2.5" fill="none" opacity=".55"/>
      <path d="M1044 236h24l-3 16h-18ZM1068 240q8 0 6 7q-2 5 -8 4M1052 230q-3 -5 1 -9M1060 230q-3 -5 1 -9" stroke="#F6EEDC" stroke-width="2.5" fill="none" opacity=".7" stroke-linecap="round"/>
      ${items.map((t, i) => { const y = 300 + i * 36; return `<circle cx="1056" cy="${y - 8}" r="4.5" fill="${['#FFB3C6', '#9FE3C9', '#FFE08A', '#B8C8FF'][i]}"/><text x="1070" y="${y}" class="svg-hand" font-size="25" fill="#F6EEDC"${fit(t, 25, 230)}>${esc(t)}</text><path d="M1320 ${y - 14}q8 -6 16 0q-2 10 -8 12q-6 -2 -8 -12Z" fill="#FF9DB0" opacity=".85"/>`; }).join('')}`;
    // shelves with mugs, jars and a trailing plant
    far += `<path d="${[786, 1404].map((x) => [300, 392].map((y) => `M${x + 22} ${y + 12}v18l18 -18ZM${x + 188} ${y + 12}v18l-18 -18Z`).join('')).join('')}" fill="#A86C40"/>
      ${[786, 1404].map((x) => [300, 392].map((y) => `<rect x="${x}" y="${y}" width="210" height="12" rx="5" fill="url(#${u}wood)"/>`).join('')).join('')}
      ${[[812, 300, '#F7A6BA'], [856, 300, '#FFD27A'], [900, 300, '#9CC9F0'], [924, 392, '#FFFFFF'], [924, 360, '#BFE6C9'], [968, 392, '#F7A6BA'], [1430, 300, '#BFE6C9'], [1474, 300, '#FFFFFF'], [1518, 300, '#F7A6BA'], [1496, 392, '#FFD27A'], [1540, 392, '#9CC9F0']].map(([x, y, c]) => use(u, 'mug', x, y, c)).join('')}
      ${use(u, 'jar', 818, 392, '#7A4A2C')}${use(u, 'jar', 866, 392, '#A2683E')}${use(u, 'jar', 1580, 300, '#A2683E')}${use(u, 'jar', 1440, 392, '#7A4A2C')}${use(u, 'pot', 958, 300, '#FFFFFF')}
      <g class="sway cafe-top"><path d="M1586 392q10 40 -4 90M1598 392q14 30 10 64" stroke="#5DAE66" stroke-width="3" fill="none"/><path d="M1586 400q10 40 -4 90M1598 400q14 30 10 64" stroke="#6CB96A" stroke-width="11" fill="none" stroke-linecap="round" stroke-dasharray="1 16"/></g>
      ${use(u, 'pot', 1596, 392, '#E7875B')}`;
    // framed print + wall clock beside the counter
    const hand = night ? [[1716, 468], [1728, 454]] : sunset ? [[1718, 488], [1728, 502]] : [[1738, 466], [1710, 474]];
    far += `<g transform="rotate(-3 672 486)"><rect x="628" y="430" width="88" height="112" rx="6" fill="#fff"/><rect x="638" y="440" width="68" height="76" fill="#FFE8D6"/>
        <path d="M672 500C650 484 648 466 660 462C666 460 672 466 672 470C672 466 678 460 684 462C696 466 694 484 672 500Z" fill="#FF8FA8"/><rect x="646" y="524" width="52" height="6" rx="3" fill="#E8C9B0"/></g>
      <circle cx="1728" cy="484" r="44" fill="#000" opacity=".07"/><circle cx="1728" cy="478" r="44" fill="#E7875B"/><circle cx="1728" cy="478" r="34" fill="#FFF9F0"/>
      <circle cx="1728" cy="478" r="27" fill="none" stroke="#C98F5B" stroke-width="5" stroke-dasharray="2.5 11.64"/>
      <path d="M1728 478L${hand[0].join(' ')}M1728 478L${hand[1].join(' ')}" stroke="#4A3A34" stroke-width="4" stroke-linecap="round"/><circle cx="1728" cy="478" r="4" fill="#E7875B"/>`;
    // counter
    far += `<rect x="748" y="606" width="904" height="146" fill="url(#${u}slat)"/><rect x="748" y="740" width="904" height="30" fill="#7A4A2C"/>
      <rect x="760" y="716" width="880" height="7" rx="3.5" fill="#E2B866"/><path d="M800 716v26M1200 716v26M1600 716v26" stroke="#C99A48" stroke-width="8"/>
      <rect x="732" y="584" width="936" height="26" rx="9" fill="url(#${u}marble)"/><path d="M780 592q60 8 120 0t110 4M1300 598q70 -8 140 0t120 -4" stroke="#D8CCBF" stroke-width="2" fill="none" opacity=".7"/>
      <rect x="736" y="608" width="928" height="7" fill="#000" opacity=".08"/>`;
    // cake stand (mostly behind the couple)
    far += `<ellipse cx="1200" cy="552" rx="50" ry="8" fill="#fff"/><path d="M1194 552h12v32h-12Z" fill="#fff"/><ellipse cx="1200" cy="584" rx="26" ry="5" fill="#EDE4DA"/><g transform="translate(1200 550) scale(.8)"><use href="#${u}cake"/></g>`;
    // pastry case
    const caseD = 'M800 552V482Q800 462 820 462H1052Q1072 462 1072 482V552Z';
    far += `<rect x="796" y="552" width="280" height="34" rx="6" fill="url(#${u}dwood)"/><path d="${caseD}" fill="#FFF7EC"/>
      ${use(u, 'cro', 846, 548)}${use(u, 'cro', 906, 546)}${use(u, 'cro', 966, 548)}${use(u, 'cro', 1028, 548)}<rect x="806" y="504" width="260" height="5" rx="2" fill="#E9DCCB"/>
      ${use(u, 'cc', 834, 504, '#FFD1DC')}${use(u, 'cc', 874, 504, '#FFF3D6')}${use(u, 'cc', 914, 504, '#C9E9D9')}
      ${['#F9B8C8', '#BFE6C9', '#FFE39A'].map((c, i) => `<path d="M${944 + i * 4} ${498 - i * 14}h26M${944 + i * 4} ${488 - i * 14}h26" stroke="${c}" stroke-width="8" stroke-linecap="round"/><path d="M${946 + i * 4} ${493 - i * 14}h22" stroke="#FFF6E6" stroke-width="3"/>`).join('')}
      <g transform="translate(1024 504) scale(.75)"><use href="#${u}cake"/></g>
      <path d="${caseD}" fill="#DDF1FF" opacity=".28" stroke="#fff" stroke-width="4"/><path d="M830 548L880 466H904L854 548Z" fill="#fff" opacity=".35"/>
      <rect x="792" y="456" width="288" height="10" rx="5" fill="url(#${u}dwood)"/>`;
    // espresso machine + grinder
    far += `<path d="M1336 578h14v8h-14ZM1530 578h14v8h-14Z" fill="#6A7480"/><rect x="1330" y="566" width="220" height="14" rx="5" fill="url(#${u}chrome)"/><path d="M1342 571H1540" stroke="#8C97A3" stroke-width="4" stroke-dasharray="10 10" opacity=".6"/>
      <rect x="1326" y="448" width="228" height="96" rx="24" fill="url(#${u}mint)"/><rect x="1344" y="456" width="192" height="9" rx="4.5" fill="#fff" opacity=".4"/><rect x="1320" y="436" width="240" height="16" rx="7" fill="url(#${u}chrome)"/>
      <path d="M1340 436l2 -16h20l2 16ZM1404 436l2 -16h20l2 16Z" fill="#fff"/><path d="M1372 436l2 -16h20l2 16Z" fill="#F7A6BA"/>
      <circle cx="1440" cy="486" r="19" fill="#F6F9FB" stroke="#C4CDD6" stroke-width="5"/><path d="M1440 486l10 -9" stroke="#E0533D" stroke-width="3" stroke-linecap="round"/>
      <circle cx="1378" cy="486" r="8" fill="#FFF3E2"/><circle cx="1502" cy="486" r="8" fill="#FFF3E2"/><circle cx="1378" cy="486" r="3.5" fill="#E0533D"/><circle cx="1502" cy="486" r="3.5" fill="#5DAE66"/>
      ${[1384, 1496].map((gx) => `<rect x="${gx - 20}" y="538" width="40" height="14" rx="5" fill="url(#${u}chrome)"/><rect x="${gx - 17}" y="550" width="34" height="7" rx="3" fill="#9AA5B0"/>
        <rect x="${gx + 12}" y="549" width="44" height="9" rx="4.5" fill="#3A2A20" transform="rotate(10 ${gx + 12} 553)"/><path d="M${gx - 12} 566l2 -12h20l2 12Z" fill="#fff"/>`).join('')}
      <path d="M1550 500q22 0 22 22V560" stroke="#B8C2CC" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="1598" y="528" width="48" height="58" rx="9" fill="url(#${u}mint)"/><rect x="1614" y="560" width="16" height="10" rx="3" fill="#9AA5B0"/>
      <path d="M1590 470H1654L1640 528H1604Z" fill="#EAF6FB" opacity=".8"/><path d="M1594 488H1650L1640 528H1604Z" fill="#6B3F26"/><rect x="1588" y="462" width="68" height="11" rx="5.5" fill="#3A2A20"/>`;
    if (P.tint) far += `<path d="${wallPath}" fill="${P.tint}" fill-rule="evenodd" opacity="${P.tintOp}"/>`;
    const farExtras = [fxHTML(1352, 474, 64, 86, 'steam', '<i></i><i></i><i></i>')];

    // ================= floor, side tables, hanging plants, lamps =================
    let near = `<defs>
      ${lg(u + 'floor', [[0, night ? '#D9C3AA' : '#F4E4CC'], [1, night ? '#C4A88C' : '#E6CCAA']])}${lg(u + 'fshade', [[0, '#000', 0.14], [1, '#000', 0]])}
      ${lg(u + 'mtop', [[0, '#FFFFFF'], [1, '#E3D9CE']])}${lg(u + 'cone', [[0, '#FFE2A0', 0.42], [1, '#FFE2A0', 0]])}${lg(u + 'terra', [[0, '#EE9A6A'], [1, '#CF7446']])}
      ${P.patch ? lg(u + 'beam', [[0, P.patch, 0.34], [1, P.patch, 0]]) + lg(u + 'patch', [[0, P.patch, 0.62], [1, P.patch, 0.12]]) : ''}${glow(u + 'bulb', '#FFD27A')}
      <g id="${u}chair"><path d="M-30 800L-24 704M30 800L24 704M-14 796L-10 710M16 796L12 710" stroke="#6E4128" stroke-width="7" stroke-linecap="round"/>
        <path d="M-26 700C-40 640 -36 596 0 594C34 596 38 640 26 700" stroke="#6E4128" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M-12 690C-18 650 -14 622 0 620C14 622 18 650 12 690" stroke="#6E4128" stroke-width="5" fill="none"/>
        <ellipse cy="704" rx="42" ry="11" fill="#8A5433"/><ellipse cy="700" rx="40" ry="9" fill="#F4A9B2"/></g>
      <g id="${u}latte">${LATTE}</g><g id="${u}cro">${CRO}</g>
      <g id="${u}hang"><path d="M0 20L-30 250M0 20L30 250M0 20V250M-30 250q30 10 60 0" stroke="#E8D5B8" stroke-width="3" fill="none"/>
        <path d="M-50 262C-70 320 -60 380 -44 430M44 262C66 320 60 360 48 410M-10 290C-16 330 -6 360 -12 390" stroke="#4F9A5A" stroke-width="3" fill="none"/>
        <path d="M-52 280C-70 330 -60 380 -44 430M46 280C66 320 60 360 48 410M-10 300C-16 330 -6 360 -12 390" stroke="#6CB96A" stroke-width="13" fill="none" stroke-linecap="round" stroke-dasharray="1 19"/>
        <path d="M-58 292C-72 340 -60 390 -50 420M52 290C68 330 58 370 52 400" stroke="#8BD27A" stroke-width="9" fill="none" stroke-linecap="round" stroke-dasharray="1 23"/>
        <path d="M-44 244q-10 -24 10 -30q10 -20 34 -10q24 -10 34 10q20 6 10 30Z" fill="#5DAE66"/><path d="M-22 226q14 -14 30 -6" stroke="#9EDB8C" stroke-width="5" fill="none" stroke-linecap="round"/>
        <path d="M-40 246H40L30 292H-30Z" fill="url(#${u}terra)"/><rect x="-44" y="240" width="88" height="12" rx="6" fill="#E08A5A"/></g>
      <g id="${u}shade"><path d="M-58 44Q-54 0 0 0Q54 0 58 44Z" fill="currentColor"/><path d="M-40 14q14 -10 30 -12" stroke="#fff" stroke-width="5" fill="none" opacity=".4" stroke-linecap="round"/><ellipse cy="44" rx="58" ry="8" fill="#FFF3D6"/><circle cy="50" r="13" fill="${P.bulb}"/></g>
    </defs>`;
    near += `<rect y="768" width="2400" height="232" fill="url(#${u}floor)"/>`;
    // checkered tiles in perspective
    const rows = [768, 802, 844, 896, 960, 1040], vy = 330, px = (x0, y) => Math.round(1200 + ((x0 - 1200) * (y - vy)) / (768 - vy));
    let tiles = '';
    for (let i = 0; i < rows.length - 1; i++) {
      for (let x0 = -560 + (i % 2) * 110; x0 < 2900; x0 += 220) {
        const a = rows[i], b = rows[i + 1];
        if (Math.max(px(x0 + 110, a), px(x0 + 110, b)) > 0 && Math.min(px(x0, a), px(x0, b)) < 2400) tiles += `M${px(x0, a)} ${a}H${px(x0 + 110, a)}L${px(x0 + 110, b)} ${b}H${px(x0, b)}Z`;
      }
    }
    near += `<path d="${tiles}" fill="${night ? '#B08A70' : '#DDA984'}" opacity=".55"/><rect y="768" width="2400" height="26" fill="url(#${u}fshade)"/>`;
    if (night) near += `<rect y="768" width="2400" height="232" fill="${P.tint}" opacity=".14"/>`;
    // sunlight through the window panes onto the floor
    if (P.patch) {
      const sk = sunset ? 1.7 : 1;
      near += `<g class="beam">${WINS.map(([x, , w]) => [[x + 16, x + w / 2 - 10], [x + w / 2 + 10, x + w - 16]].map(([a, b]) => `<path d="M${a} 604H${b}L${b + 190 * sk} 960H${a + 110 * sk}Z" fill="url(#${u}beam)"/><path d="M${a + 60 * sk} 800H${b + 70 * sk}L${b + 170 * sk} 950H${a + 150 * sk}Z" fill="url(#${u}patch)" opacity=".75"/>`).join('')).join('')}</g>`;
    }
    // side tables with bentwood chairs
    [[340, 0], [2060, 1]].forEach(([x, k]) => {
      near += `<ellipse cx="${x}" cy="812" rx="220" ry="16" fill="#000" opacity=".12"/>${use(u, 'chair', x - 150, 0)}<use href="#${u}chair" transform="translate(${x + 150} 0) scale(-1 1)"/>
        <rect x="${x - 7}" y="668" width="14" height="128" fill="#4A3A34"/><ellipse cx="${x}" cy="798" rx="54" ry="10" fill="#4A3A34"/>
        <ellipse cx="${x}" cy="668" rx="112" ry="16" fill="#C9BCAE"/><ellipse cx="${x}" cy="662" rx="112" ry="15" fill="url(#${u}mtop)"/>
        ${k ? `<use href="#${u}latte" transform="translate(${x - 36} 664) scale(-1 1)" color="#FFD27A"/><rect x="${x + 18}" y="648" width="52" height="12" rx="3" fill="#9CC9F0"/><rect x="${x + 22}" y="638" width="46" height="11" rx="3" fill="#F7A6BA"/>`
          : use(u, 'latte', x + 34, 664, '#9CC9F0') + `<g transform="translate(${x - 40} 662) scale(.8)"><use href="#${u}cro"/></g>`}`;
    });
    // hanging plants
    near += `<g class="sway cafe-top">${use(u, 'hang', 676, 0)}</g><g class="sway cafe-top" style="animation-delay:-2.5s">${use(u, 'hang', 1724, 0)}</g>`;
    // pendant lamps: light cones at night, a glow that grows toward evening
    const lamps = [[880, 150, 1, '#8FCFBD'], [1520, 150, 1, '#F4A9B2'], [340, 86, 0.72, '#F4A9B2'], [2060, 86, 0.72, '#8FCFBD']];
    if (night) near += `<path d="${lamps.map(([x, y, s]) => `M${x - 50 * s} ${y + 40 * s}L${x - 320 * s} ${s < 1 ? 700 : 600}H${x + 320 * s}L${x + 50 * s} ${y + 40 * s}Z`).join('')}" fill="url(#${u}cone)" class="cone"/>`;
    lamps.forEach(([x, y, s, c], i) => {
      near += `<g class="cafe-lamp cafe-top" style="animation-delay:${-i * 1.3}s"><path d="M${x} 0V${y}" stroke="#4A3A34" stroke-width="3"/>
        <circle cx="${x}" cy="${y + 44 * s}" r="${110 * s}" fill="url(#${u}bulb)" opacity="${P.lamp}"/><use href="#${u}shade" transform="translate(${x} ${y}) scale(${s})" color="${c}"/></g>`;
    });
    const nearExtras = night ? [] : [...Array(8)].map((_, i) => {
      const e = fx((i % 2 ? 1860 : 140) + r() * 420, 440 + r() * 300, 14, 14, 'dust', '<circle cx="7" cy="7" r="5" fill="#FFF7D6"/>');
      e.style = `animation-delay:${-i * 0.9}s`;
      return e;
    });

    // ================= foreground corners (big plant, sack of beans) =================
    const front = `<defs>${lg(u + 'fpot', [[0, '#F4F0E8'], [1, '#D9D1C4']])}${lg(u + 'sack', [[0, '#D8BE94'], [1, '#B89868']])}<g id="${u}fbean">${BEAN}</g></defs>
      <ellipse cx="150" cy="992" rx="170" ry="18" fill="#000" opacity=".13"/>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 100%"><path d="M150 900C120 820 60 780 0 770C10 840 80 890 150 905Z" fill="#3F8A4C"/>
        <path d="M150 900C170 800 240 740 320 730C310 820 230 880 150 905Z" fill="#4E9E5A"/><path d="M150 900C120 800 110 700 140 640C190 700 190 820 150 905Z" fill="#5DB36A"/>
        <path d="M150 900C200 830 280 820 330 850C290 900 210 910 150 905Z" fill="#3A7F46"/><path d="M40 800L140 890M290 760L170 880M140 670L150 870" stroke="#8AD694" stroke-width="4" opacity=".6"/></g>
      <path d="M70 890H230L212 1000H88Z" fill="url(#${u}fpot)"/><rect x="62" y="880" width="176" height="22" rx="10" fill="#EFE9DF"/><path d="M80 940H222" stroke="#8FCFBD" stroke-width="8"/>
      <g transform="translate(2270 1000)"><ellipse cy="-6" rx="130" ry="14" fill="#000" opacity=".13"/>
        <path d="M-96 -4Q-110 -80 -84 -118Q-60 -130 -40 -122Q0 -136 40 -122Q64 -132 86 -116Q110 -80 96 -4Z" fill="url(#${u}sack)"/>
        <path d="M-84 -116Q0 -96 86 -116" stroke="#9E7E52" stroke-width="5" fill="none"/><ellipse cy="-114" rx="80" ry="16" fill="#6B3F26"/>
        ${[[-40, -118], [-6, -122], [30, -116], [-128, -12], [-110, -6], [118, -10]].map(([x, y], i) => `<use href="#${u}fbean" transform="translate(${x} ${y}) rotate(${i * 40}) scale(.75)"/>`).join('')}
        <path d="M-22 -72h30l-4 22h-22ZM8 -66q10 0 8 8q-2 6 -10 5M-12 -80q-3 -6 1 -11M-2 -80q-3 -6 1 -11" stroke="#8A6A44" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/></g>`;

    // ================= the couple's table (prop) =================
    const cloth = 'M994 744Q990 820 980 888Q1036 906 1090 890Q1145 908 1200 892Q1255 908 1310 890Q1364 906 1420 888Q1410 820 1406 744Z';
    let table = `<defs>
      <pattern id="${u}ging" width="36" height="36" patternUnits="userSpaceOnUse"><rect width="36" height="36" fill="#FFFBF4"/><rect width="18" height="36" fill="#BFE0D2" opacity=".6"/><rect width="36" height="18" fill="#BFE0D2" opacity=".6"/></pattern>
      ${lg(u + 'cshade', [[0, '#000', 0.16], [0.25, '#000', 0], [0.75, '#000', 0], [1, '#000', 0.16]], 0, 0, 1, 0)}${lg(u + 'ctop', [[0, '#FFFFFF'], [1, '#F1ECE4']])}
      <g id="${u}tl">${LATTE}</g><g id="${u}tb">${BEAN}</g>${night ? glow(u + 'cg', '#FFC873') : ''}
    </defs>
      <ellipse cx="1200" cy="990" rx="250" ry="16" fill="#000" opacity=".15"/>
      <rect x="1188" y="880" width="24" height="100" fill="#4A3A34"/><ellipse cx="1200" cy="982" rx="84" ry="12" fill="#4A3A34"/><ellipse cx="1200" cy="978" rx="70" ry="8" fill="#6A5A54"/>
      <path d="${cloth}" fill="url(#${u}ging)"/><path d="${cloth}" fill="url(#${u}cshade)"/><path d="M1090 760Q1092 830 1090 888M1310 760Q1308 830 1310 888M1200 764V890" stroke="#000" stroke-width="3" opacity=".05"/>
      <path d="M980 888Q1036 906 1090 890Q1145 908 1200 892Q1255 908 1310 890Q1364 906 1420 888" stroke="#fff" stroke-width="6" fill="none" stroke-dasharray="2 10" stroke-linecap="round" opacity=".9"/>
      <ellipse cx="1200" cy="744" rx="208" ry="20" fill="url(#${u}ctop)" stroke="#E6DED2" stroke-width="3"/><ellipse cx="1150" cy="738" rx="120" ry="8" fill="#fff" opacity=".7"/>
      <use href="#${u}tl" transform="translate(1100 748) scale(-1 1)" color="#F7A6BA"/>${use(u, 'tl', 1300, 748, '#9FD8C6')}
      <ellipse cx="1200" cy="750" rx="54" ry="10" fill="#fff"/><ellipse cx="1200" cy="748" rx="42" ry="6" fill="none" stroke="#F4A9B2" stroke-width="2.5"/>
      <g transform="translate(1194 748) scale(.9)">${CAKE}</g>
      <path d="M1230 748L1252 732" stroke="#B8C2CC" stroke-width="4" stroke-linecap="round"/><path d="M1250 734l6 -6M1254 737l6 -6" stroke="#B8C2CC" stroke-width="2" stroke-linecap="round"/>
      <g transform="translate(1372 750)"><path d="M-9 0q-4 -16 3 -26h12q7 10 3 26Z" fill="#CFE8F7" opacity=".95"/><path d="M0 -26q-2 -16 2 -28" stroke="#5DAE66" stroke-width="3" fill="none"/>
        <path d="M-7 -54q0 -14 7 -14q7 0 7 14q-7 6 -14 0Z" fill="#FF7F9D"/><path d="M0 -68v12" stroke="#E0607F" stroke-width="2"/></g>
      ${night ? `<circle cx="1036" cy="716" r="46" fill="url(#${u}cg)"/><rect x="1022" y="720" width="28" height="30" rx="7" fill="#FFD9A0" opacity=".55"/><rect x="1027" y="730" width="18" height="18" rx="3" fill="#FFF6E0"/>
        <path class="flame" style="transform-box:fill-box;transform-origin:50% 100%" d="M1036 730q-7 -9 0 -21q7 12 0 21Z" fill="#FFB84A"/>`
        : `<use href="#${u}tb" transform="translate(1030 744) rotate(30) scale(.7)"/><use href="#${u}tb" transform="translate(1046 750) rotate(-20) scale(.6)"/>`}`;
    const tableExtras = [fxHTML(1060, 610, 80, 104, 'steam', '<i></i><i></i><i></i>'), fxHTML(1260, 612, 80, 100, 'steam', '<i></i><i></i><i></i>')];

    css('cafe', `
      .cafe-top { transform-box: fill-box; transform-origin: 50% 0; }
      .is-here .cafe-lamp { animation: cafe-swing 5.5s ease-in-out infinite; }
      @keyframes cafe-swing { 0%, 100% { transform: rotate(-1.4deg); } 50% { transform: rotate(1.4deg); } }
      .is-here .cafe-tail { animation: cafe-tail 2.8s ease-in-out infinite; }
      @keyframes cafe-tail { 0%, 100% { transform: rotate(0); } 50% { transform: rotate(-16deg); } }
      .is-here .cafe-head { animation: cafe-head 7s ease-in-out infinite; }
      @keyframes cafe-head { 0%, 60%, 100% { transform: none; } 70%, 88% { transform: rotate(-8deg); } }
      @media (prefers-reduced-motion: reduce) { .cafe-lamp, .cafe-tail, .cafe-head { animation: none !important; } }
    `);

    const layers = [
      { depth: 0.2, svg: min(street), extras: streetExtras },
      { depth: 0.35, svg: min(far), extras: farExtras },
      { depth: 1, svg: min(near), extras: nearExtras },
      { depth: 1.35, svg: min(front), front: true },
    ];
    if (sc.table !== false) layers.push({ depth: 1, svg: min(table), front: true, prop: 'table', extras: tableExtras });
    return { sky: P.sky, layers };
  }

  TripArt.scenes.cafe = cafe;
})();
