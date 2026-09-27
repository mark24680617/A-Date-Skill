/*
 * 公园 / 花园 — a city park for a picnic or a stroll.
 * A lawn with a winding gravel path (the couple stands on it), a duck pond behind them,
 * round trees and blossom trees, tulip beds, park lamps, a bench, a gazebo and a picnic
 * blanket to the couple's right. Moods: day (default) | sunset | night.
 * Label: `sign` — optional wooden park sign left of the couple ('' hides it).
 * Season: sc.season 'spring' (default, pink blossom) | 'summer' | 'autumn'.
 */
(function () {
  'use strict';
  const { rng, lg, rg, glow, cloud, fx, birds, label, css, esc, moodOf, skyline } = TripArt.h;
  const R = Math.round;

  // ---------- colours per mood ----------
  const PAL = {
    day: {
      sky: 'linear-gradient(180deg, #5DB8F0 0%, #8ECDF3 34%, #C4E7F7 58%, #E6F5EC 78%, #FFF2D6 100%)',
      hill: '#BCDCC6', city: '#B3C9DE', cityF: '#C4D6E7',
      tl: ['#8CC89B', '#72B886', '#B4E0B4'],
      meadow: ['#B8E291', '#9AD27B'],
      pond: ['#A8E2F3', '#6DC1E1', '#4AA3CF'], rim: '#EFE6D3', rimD: '#CDBFA2', wave: '#F4FCFF',
      lawn: ['#A9DD86', '#8BCB6D', '#72B95C'], tuft: '#5DA54E',
      path: ['#F5E8CB', '#E6D0A8'], pathE: '#CDB088', peb: '#D3BA92',
      leaf: ['#AEE08A', '#79C166', '#5AA553'], leafD: '#5FAE55', leafH: '#CBEFA6',
      blos: ['#FFE4EC', '#FFBCD1', '#F595B5'], blosD: '#EE9EBB', blosH: '#FFF4F7',
      trunk: '#A7805C', trunkH: '#C9A47C',
      wood: ['#D9A06B', '#B87D4B'], metal: '#4B5664', metalH: '#7F8B98',
      glass: '#EAF6FB', lampGlow: 0,
      roof: ['#96D8CC', '#5FB3A8'], white: '#FBF8F3', whiteD: '#DDD4C9',
      shadow: 0.13, sh: '#000',
      flowers: ['#FF8FA3', '#FFD166', '#FFFFFF', '#B8A1FF', '#FF6F91'],
      duck: ['#FFFFFF', '#E1E7F0'], duckling: ['#FFDA5C', '#F2B930'], beak: '#FFA23A', ripple: '#FFFFFF',
      ging: ['#FFF8F4', '#FF86A4'], soil: '#9E7253', wick: ['#E2B06A', '#B98242'],
      bush: ['#86C96C', '#62AE58'],
    },
    sunset: {
      sky: 'linear-gradient(180deg, #4F4E9A 0%, #9265A6 24%, #DA859C 46%, #FFAA86 64%, #FFD196 80%, #FFE6BA 100%)',
      hill: '#D7A2AC', city: '#B98AAE', cityF: '#C99CB9',
      tl: ['#9C849A', '#86738E', '#D6A6A8'],
      meadow: ['#D6C47E', '#B9AE66'],
      pond: ['#FFD0A8', '#F0A0A2', '#A87AA8'], rim: '#F6D6BE', rimD: '#D2A690', wave: '#FFF1DC',
      lawn: ['#CFD27C', '#ABBA5C', '#8CA052'], tuft: '#77904A',
      path: ['#F9DAB6', '#EBBE98'], pathE: '#CF9C80', peb: '#DCA98A',
      leaf: ['#D4D583', '#9EB25E', '#7A934E'], leafD: '#7F9A55', leafH: '#F6DC92',
      blos: ['#FFD6D6', '#F8AABB', '#DE7F9F'], blosD: '#DE8CA6', blosH: '#FFEBDD',
      trunk: '#8C6555', trunkH: '#BB8C6C',
      wood: ['#D99468', '#B3714B'], metal: '#4E4658', metalH: '#8A7D8E',
      glass: '#FFE7B8', lampGlow: 0.5,
      roof: ['#F4B2A2', '#D38C88'], white: '#FFF1E6', whiteD: '#E5C8BC',
      shadow: 0.14, sh: '#5A2F4E',
      flowers: ['#FF7F9A', '#FFC35C', '#FFF3E6', '#C79BF0', '#FF6F7F'],
      duck: ['#FFF3E8', '#F1D2C6'], duckling: ['#FFD27A', '#F0A94E'], beak: '#FF9440', ripple: '#FFE7CF',
      ging: ['#FFF1E8', '#F77F98'], soil: '#91604F', wick: ['#E4A560', '#B37440'],
      bush: ['#AEB866', '#879A54'],
    },
    night: {
      sky: 'linear-gradient(180deg, #0A1230 0%, #16225A 38%, #283A7A 68%, #45508E 88%, #5A5A92 100%)',
      hill: '#27366C', city: '#1D2A58', cityF: '#243266',
      tl: ['#1F3A56', '#1A3149', '#2D5068'],
      meadow: ['#2C5557', '#234748'],
      pond: ['#3C5B9A', '#2A4380', '#1C2C5C'], rim: '#6E7198', rimD: '#4F5378', wave: '#CFE0FF',
      lawn: ['#326058', '#29504B', '#21423F'], tuft: '#1B3834',
      path: ['#8387AC', '#666B92'], pathE: '#51567E', peb: '#72789E',
      leaf: ['#3F7768', '#2E5E56', '#244C47'], leafD: '#234842', leafH: '#5A9480',
      blos: ['#C69BC4', '#9F79A8', '#7A5F8C'], blosD: '#7D6090', blosH: '#E2C4DE',
      trunk: '#4C4054', trunkH: '#6C5C70',
      wood: ['#8C6A66', '#6C5052'], metal: '#262B40', metalH: '#4C5474',
      glass: '#FFEBA8', lampGlow: 0.95,
      roof: ['#4E7E92', '#36607A'], white: '#B9BCD6', whiteD: '#8E92B4',
      shadow: 0.2, sh: '#000',
      flowers: ['#E88AB0', '#E8C46A', '#D6DAF0', '#A28BE0', '#D86A94'],
      duck: ['#CCD2E6', '#A9B1CC'], duckling: ['#D8C46E', '#B89E4E'], beak: '#E08A3A', ripple: '#BFD0FF',
      ging: ['#C4C1DA', '#A85A80'], soil: '#4E3E48', wick: ['#9E7A58', '#7A5A42'],
      bush: ['#2F5E52', '#244B44'],
    },
  };

  // ---------- geometry helpers ----------
  // smooth curve through points (Catmull-Rom → cubic Bézier); `lead` = 'M' or 'L'
  function smooth(p, lead = 'M') {
    let d = `${lead}${p[0][0]} ${p[0][1]}`;
    for (let i = 0; i < p.length - 1; i++) {
      const a = p[i - 1] || p[i], b = p[i], c = p[i + 1], e = p[i + 2] || c;
      d += `C${R(b[0] + (c[0] - a[0]) / 6)} ${R(b[1] + (c[1] - a[1]) / 6)} ${R(c[0] - (e[0] - b[0]) / 6)} ${R(c[1] - (e[1] - b[1]) / 6)} ${c[0]} ${c[1]}`;
    }
    return d;
  }
  function yAt(p, x) {
    for (let i = 0; i < p.length - 1; i++) {
      if (x >= p[i][0] && x <= p[i + 1][0]) return p[i][1] + (x - p[i][0]) / (p[i + 1][0] - p[i][0]) * (p[i + 1][1] - p[i][1]);
    }
    return p[x < p[0][0] ? 0 : p.length - 1][1];
  }
  // The gravel path: under the couple it spans y 791–861 at x 1200, then dips towards
  // the viewer on the right so the picnic blanket (x 1450–1732) sits on the lawn.
  const TOP = [[-40, 812], [300, 807], [620, 800], [900, 794], [1200, 791], [1330, 801], [1470, 858], [1610, 880], [1770, 872], [1960, 828], [2160, 813], [2440, 816]];
  const BOT = [[-40, 886], [300, 880], [620, 872], [900, 865], [1200, 861], [1330, 875], [1470, 934], [1610, 958], [1770, 950], [1960, 902], [2160, 886], [2440, 890]];
  const between = (t) => TOP.map((p, i) => [p[0], R(p[1] + t * (BOT[i][1] - p[1]))]);

  // ---------- pieces ----------
  // Round cartoon tree. x = trunk centre, gy = ground, s = scale, kind 'leaf' | 'blos',
  // shade 'long' (sunset shadow) | 'round'.
  function tree(x, gy, s, C, gid, kind, shade, lean = 0) {
    const dk = kind === 'blos' ? C.blosD : C.leafD, hi = kind === 'blos' ? C.blosH : C.leafH;
    const X = (dx) => R(x + (dx + lean) * s), Y = (dy) => R(gy - dy * s), S = (v) => R(v * s);
    const c = (l) => l.map(([dx, dy, rr]) => `<circle cx="${X(dx)}" cy="${Y(dy)}" r="${S(rr)}"/>`).join('');
    let t = shade === 'long'
      ? `<path d="M${R(x - 10 * s)} ${gy}L${R(x - 460 * s)} ${R(gy + 30 * s)}Q${R(x - 520 * s)} ${R(gy + 44 * s)} ${R(x - 440 * s)} ${R(gy + 50 * s)}L${R(x + 40 * s)} ${R(gy + 6 * s)}Z" fill="${C.sh}" opacity=".12"/>`
      : `<ellipse cx="${R(x + 10 * s)}" cy="${R(gy + 4 * s)}" rx="${S(190)}" ry="${S(18)}" fill="${C.sh}" opacity="${C.shadow}"/>`;
    t += `<path d="M${R(x - 30 * s)} ${gy}C${R(x - 22 * s)} ${Y(120)} ${X(-24)} ${Y(220)} ${X(-12)} ${Y(300)}L${X(14)} ${Y(300)}C${X(22)} ${Y(220)} ${R(x + 22 * s)} ${Y(120)} ${R(x + 34 * s)} ${gy}Z" fill="${C.trunk}"/>
      <path d="M${R(x - 14 * s)} ${Y(20)}C${R(x - 10 * s)} ${Y(120)} ${X(-10)} ${Y(200)} ${X(-4)} ${Y(280)}" stroke="${C.trunkH}" stroke-width="${S(7)}" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M${X(0)} ${Y(240)}q${S(-50)} ${S(-30)} ${S(-100)} ${S(-36)}M${X(4)} ${Y(260)}q${S(46)} ${S(-40)} ${S(96)} ${S(-44)}" stroke="${C.trunk}" stroke-width="${S(12)}" fill="none" stroke-linecap="round"/>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 100%">
      <g fill="${dk}">${c([[-130, 330, 100], [130, 335, 104], [0, 310, 110]])}</g>
      <g fill="url(#${gid})">${c([[-150, 420, 100], [150, 425, 104], [-10, 470, 150], [-80, 560, 84], [80, 550, 90]])}</g>
      <g fill="${hi}" opacity=".5">${c([[-70, 585, 40], [60, 560, 26], [-180, 460, 28]])}</g>`;
    if (kind === 'blos') {
      const r = rng(R(x * 7 + gy)), dots = [];
      for (let i = 0; i < 14; i++) { const a = r() * 6.283, d = Math.sqrt(r()) * 190; dots.push([Math.cos(a) * d, 450 + Math.sin(a) * d * 0.75, 6 + r() * 6]); }
      t += `<g fill="${hi}" opacity=".85">${c(dots.slice(0, 9))}</g><g fill="${C.blos[2]}" opacity=".8">${c(dots.slice(9))}</g>`;
    }
    return t + `</g>`;
  }

  // Victorian park lamp drawn at the origin (ground y = 0); placed with <use>.
  function lampDef(u, C) {
    return `<g id="${u}lampG">
      <path d="M-22 0L-15 -44H15L22 0Z" fill="${C.metal}"/><rect x="-19" y="-52" width="38" height="10" rx="4" fill="${C.metalH}"/>
      <rect x="-7" y="-330" width="14" height="278" fill="url(#${u}pole)"/>
      <rect x="-11" y="-190" width="22" height="9" rx="4" fill="${C.metal}"/>
      <path d="M-14 -316Q0 -300 14 -316Z" fill="${C.metal}"/><rect x="-16" y="-328" width="32" height="12" rx="5" fill="${C.metal}"/>
      <path d="M-15 -330L-23 -376H23L15 -330Z" fill="${C.glass}"/>
      <path d="M0 -330V-376M-19 -354H19" stroke="${C.metal}" stroke-width="2.5" opacity=".75"/>
      <path d="M-15 -330L-23 -376M15 -330L23 -376" stroke="${C.metal}" stroke-width="4"/>
      <rect x="-30" y="-382" width="60" height="8" rx="4" fill="${C.metal}"/>
      <path d="M-26 -380Q-8 -392 0 -408Q8 -392 26 -380Z" fill="${C.metal}"/><circle cy="-412" r="6" fill="${C.metal}"/>
      <path d="M-16 -388Q-6 -394 -2 -402" stroke="${C.metalH}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/></g>`;
  }
  function lamp(u, x, gy, C, mood) {
    let s = mood === 'sunset'
      ? `<path d="M${x} ${gy - 2}L${x - 300} ${gy + 14}L${x - 296} ${gy + 22}L${x + 6} ${gy + 6}Z" fill="${C.sh}" opacity=".13"/>`
      : `<ellipse cx="${x}" cy="${gy + 2}" rx="36" ry="7" fill="${C.sh}" opacity="${C.shadow}"/>`;
    if (C.lampGlow) s += `<ellipse cx="${x}" cy="${gy + 6}" rx="170" ry="30" fill="url(#${u}pool)" opacity="${C.lampGlow}"/>`;
    s += `<use href="#${u}lampG" x="${x}" y="${gy}"/>`;
    if (C.lampGlow) s += `<circle class="park-glow" cx="${x}" cy="${gy - 354}" r="130" fill="url(#${u}lamp)" opacity="${C.lampGlow}"/><ellipse cx="${x}" cy="${gy - 352}" rx="10" ry="16" fill="#FFFBEA"/>`;
    return s;
  }
  // hanging flower basket on an arm to the right of a lamp (hy = lamp head y)
  function basket(x, hy, C) {
    let s = `<path d="M${x + 6} ${hy + 64}H${x + 68}M${x + 6} ${hy + 88}Q${x + 36} ${hy + 88} ${x + 50} ${hy + 66}" stroke="${C.metal}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <circle cx="${x + 70}" cy="${hy + 64}" r="5" fill="${C.metal}"/><path d="M${x + 64} ${hy + 66}L${x + 52} ${hy + 104}M${x + 64} ${hy + 66}L${x + 78} ${hy + 104}" stroke="${C.metal}" stroke-width="2"/>
      <path d="M${x + 38} ${hy + 104}C${x + 50} ${hy + 90} ${x + 82} ${hy + 90} ${x + 92} ${hy + 106}Z" fill="${C.leaf[1]}"/>
      <path d="M${x + 44} ${hy + 112}C${x + 40} ${hy + 130} ${x + 44} ${hy + 146} ${x + 40} ${hy + 160}M${x + 86} ${hy + 112}C${x + 92} ${hy + 126} ${x + 86} ${hy + 140} ${x + 90} ${hy + 150}" stroke="${C.leaf[2]}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M${x + 36} ${hy + 102}H${x + 94}Q${x + 92} ${hy + 132} ${x + 65} ${hy + 134}Q${x + 38} ${hy + 132} ${x + 36} ${hy + 102}Z" fill="${C.wick[1]}"/>
      <path d="M${x + 38} ${hy + 112}H${x + 92}M${x + 41} ${hy + 122}H${x + 89}" stroke="${C.wick[0]}" stroke-width="3" opacity=".8"/>`;
    for (let i = 0; i < 6; i++) s += `<circle cx="${R(x + 42 + i * 9.5)}" cy="${hy + 97 + (i % 2) * 5}" r="${7 + (i % 3)}" fill="${C.flowers[i % 5]}"/>`;
    return s;
  }

  function bench(x, gy, C, mood) {
    const L = x - 115, Rr = x + 115;
    let s = mood === 'sunset'
      ? `<path d="M${L + 10} ${gy}L${L - 240} ${gy + 16}L${Rr - 240} ${gy + 18}L${Rr} ${gy}Z" fill="${C.sh}" opacity=".12"/>`
      : `<ellipse cx="${x}" cy="${gy + 3}" rx="135" ry="10" fill="${C.sh}" opacity="${C.shadow}"/>`;
    return s + `<path d="M${L + 20} ${gy}V${gy - 106}M${Rr - 20} ${gy}V${gy - 106}" stroke="${C.metal}" stroke-width="8" stroke-linecap="round"/>
      <g fill="${C.wood[0]}"><rect x="${L}" y="${gy - 110}" width="230" height="16" rx="7"/><rect x="${L}" y="${gy - 88}" width="230" height="16" rx="7"/><rect x="${L - 10}" y="${gy - 52}" width="250" height="16" rx="7"/></g>
      <rect x="${L - 6}" y="${gy - 38}" width="242" height="7" rx="3" fill="${C.wood[1]}"/>
      <g fill="#fff" opacity=".22"><rect x="${L + 6}" y="${gy - 106}" width="218" height="4" rx="2"/><rect x="${L - 4}" y="${gy - 49}" width="238" height="4" rx="2"/></g>
      <path d="M${L + 4} ${gy - 54}q-12 -20 6 -30h26M${Rr - 4} ${gy - 54}q12 -20 -6 -30h-26M${L + 10} ${gy}q10 -12 10 -30M${Rr - 10} ${gy}q-10 -12 -10 -30" stroke="${C.metal}" stroke-width="6" fill="none" stroke-linecap="round"/>`;
  }

  // gazebo / bandstand on the far lawn
  function gazebo(u, x, gy, C, mood) {
    let s = `<ellipse cx="${x}" cy="${gy + 4}" rx="170" ry="16" fill="${C.sh}" opacity="${C.shadow}"/>
      <ellipse cx="${x}" cy="${gy - 6}" rx="150" ry="18" fill="${C.whiteD}"/><rect x="${x - 150}" y="${gy - 26}" width="300" height="20" fill="${C.whiteD}"/>
      <ellipse cx="${x}" cy="${gy - 26}" rx="150" ry="18" fill="${C.white}"/>`;
    if (mood !== 'day') s += `<ellipse cx="${x}" cy="${gy - 100}" rx="120" ry="80" fill="url(#${u}warm)" opacity="${mood === 'night' ? 0.9 : 0.5}"/>`;
    s += `<g fill="${C.white}">${[-126, -64, 0, 64, 126].map((dx) => `<rect x="${x + dx - 6}" y="${gy - 190}" width="12" height="166" rx="4"/>`).join('')}
      <rect x="${x - 160}" y="${gy - 202}" width="320" height="18" rx="9"/><circle cx="${x}" cy="${gy - 352}" r="8"/></g>
      <path d="M${x - 140} ${gy - 70}H${x + 140}" stroke="${C.white}" stroke-width="7" stroke-linecap="round"/>
      <path d="${[...Array(16)].map((_, i) => `M${x - 120 + i * 16} ${gy - 66}V${gy - 30}`).join('')}M${x} ${gy - 314}V${gy - 350}" stroke="${C.white}" stroke-width="4"/>
      <path d="M${x - 160} ${gy - 196}Q${x - 150} ${gy - 290} ${x} ${gy - 314}Q${x + 150} ${gy - 290} ${x + 160} ${gy - 196}Z" fill="url(#${u}roof)"/>
      <path d="M${x - 80} ${gy - 196}Q${x - 70} ${gy - 280} ${x} ${gy - 312}M${x + 80} ${gy - 196}Q${x + 70} ${gy - 280} ${x} ${gy - 312}M${x} ${gy - 196}V${gy - 312}" stroke="${C.roof[1]}" stroke-width="4" fill="none" opacity=".6"/>
      <path d="M${x - 128} ${gy - 220}Q${x - 116} ${gy - 280} ${x - 36} ${gy - 302}" stroke="#fff" stroke-width="6" fill="none" opacity=".3" stroke-linecap="round"/>
      <path d="${[...Array(9)].map((_, i) => `M${R(x - 150 + i * 37.5)} ${gy - 184}q18.75 16 37.5 0`).join('')}" fill="none" stroke="${C.white}" stroke-width="4"/>`;
    if (mood === 'night') for (let i = 0; i < 9; i++) s += `<circle class="twinkle" style="animation-delay:${-i * 0.3}s" cx="${R(x - 131 + i * 37.5)}" cy="${gy - 174}" r="5" fill="#FFE9A0"/>`;
    return s;
  }

  // A duck facing left (0 0 120 80), defined once and placed with <use fill color>:
  // `fill` paints the body and `color` the wing / belly shade.
  function duckDef(u, C) {
    return `<g id="${u}duck"><ellipse cx="64" cy="71" rx="54" ry="7" fill="${C.ripple}" opacity=".45"/>
      <path d="M24 56C24 44 40 42 54 44L86 44C96 44 104 40 110 32C115 46 112 58 104 64C96 70 84 72 70 72L44 72C32 72 24 66 24 56Z"/>
      <path d="M28 62C36 72 90 74 106 60C100 70 86 72 70 72L44 72C34 72 28 68 28 62ZM56 52C64 44 86 44 96 52C88 60 70 62 56 52Z" fill="currentColor"/>
      <ellipse cx="38" cy="42" rx="11" ry="12"/><circle cx="34" cy="26" r="16"/>
      <path d="M19 26Q7 25 4 31Q9 36 19 33Z" fill="${C.beak}"/>
      <ellipse cx="29" cy="18" rx="7" ry="4" fill="#fff" opacity=".55"/>
      <circle cx="29" cy="24" r="2.8" fill="#2B2323"/><circle cx="28.2" cy="23.1" r="1" fill="#fff"/>
      <ellipse cx="38" cy="31" rx="4" ry="2.4" fill="#FF8FA3" opacity=".5"/></g>`;
  }
  const duck = (u, col, flip) => {
    const d = `<use href="#${u}duck" fill="${col[0]}" color="${col[1]}" class="park-bob" style="transform-box:fill-box;transform-origin:50% 90%"/>`;
    return flip ? `<g transform="translate(120 0) scale(-1 1)">${d}</g>` : d;
  };
  // butterfly (0 0 40 30): `fill` = upper wings, `color` = lower wings
  function flyDef(u) {
    return `<g id="${u}fly"><path d="M20 15C12 1 1 3 3 12C4 17 12 17 20 15ZM20 15C28 1 39 3 37 12C36 17 28 17 20 15Z"/>
      <path d="M20 15C14 20 8 27 12 28C16 29 19 22 20 15ZM20 15C26 20 32 27 28 28C24 29 21 22 20 15Z" fill="currentColor"/>
      <ellipse cx="20" cy="16" rx="1.8" ry="6" fill="#5A3E4A"/><path d="M19 10q-2 -5 -6 -7M21 10q2 -5 6 -7" stroke="#5A3E4A" stroke-width="1.2" fill="none"/></g>`;
  }

  function tulips(x0, x1, gy, C, r) {
    const n = Math.round((x1 - x0) / 17);
    let stems = '', leaves = '', heads = '';
    for (let i = 0; i < n; i++) {
      const fx0 = R(x0 + 10 + i * ((x1 - x0 - 20) / (n - 1))), top = R(gy - 34 - r() * 16 - (i % 2) * 7), k = i % 2 ? 1 : -1;
      stems += `M${fx0} ${gy - 6}Q${fx0 + 2} ${R((gy + top) / 2)} ${fx0} ${top}`;
      leaves += `M${fx0} ${gy - 8}q${12 * k} -12 ${6 * k} -26q${-8 * k} 10 ${-6 * k} 26Z`;
      heads += `<path d="M${fx0 - 8} ${top + 1}Q${fx0 - 10} ${top - 12} ${fx0 - 5} ${top - 15}L${fx0} ${top - 9}L${fx0 + 5} ${top - 15}Q${fx0 + 10} ${top - 12} ${fx0 + 8} ${top + 1}Q${fx0} ${top + 8} ${fx0 - 8} ${top + 1}Z" fill="${C.flowers[[0, 1, 4, 3, 0, 1][i % 6]]}"/>`;
    }
    return `<ellipse cx="${(x0 + x1) / 2}" cy="${gy - 2}" rx="${(x1 - x0) / 2 + 8}" ry="14" fill="${C.rimD}"/>
      <ellipse cx="${(x0 + x1) / 2}" cy="${gy - 6}" rx="${(x1 - x0) / 2}" ry="11" fill="${C.soil}"/>
      <path d="${stems}" stroke="${C.leaf[2]}" stroke-width="4" fill="none"/><path d="${leaves}" fill="${C.leaf[1]}"/>${heads}`;
  }

  // round flowering shrub
  function shrub(x, gy, s, C, r) {
    let t = `<ellipse cx="${x}" cy="${gy + 2}" rx="${R(70 * s)}" ry="${R(8 * s)}" fill="${C.sh}" opacity="${C.shadow}"/>
      <g fill="${C.bush[1]}"><circle cx="${R(x - 34 * s)}" cy="${R(gy - 30 * s)}" r="${R(34 * s)}"/><circle cx="${R(x + 34 * s)}" cy="${R(gy - 28 * s)}" r="${R(32 * s)}"/></g>
      <circle cx="${x}" cy="${R(gy - 46 * s)}" r="${R(44 * s)}" fill="${C.bush[0]}"/>
      <circle cx="${R(x - 14 * s)}" cy="${R(gy - 66 * s)}" r="${R(16 * s)}" fill="${C.leafH}" opacity=".45"/>`;
    for (let i = 0; i < 6; i++) t += `<circle cx="${R(x + (r() - 0.5) * 110 * s)}" cy="${R(gy - 20 * s - r() * 60 * s)}" r="${R(6 * s)}" fill="${C.flowers[(i + 1) % 5]}"/>`;
    return t;
  }

  // Optional wooden park sign just left of the couple. Up to 6 CJK characters go on a
  // vertical plaque (x 988–1052) that phones can see whole; other text goes on a
  // horizontal board whose right edge is at x 1054.
  function signBoard(u, text, C) {
    const t = String(text || '').trim();
    if (!t) return '';
    const chars = [...t], cjk = /^[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF\u00B7\u30FB]+$/.test(t);
    if (cjk && chars.length <= 6) {
      const H = chars.length * 36 + 30, x = 1020, y0 = 756 - H;
      return `<g class="park-sign">
        <ellipse cx="${x}" cy="799" rx="30" ry="6" fill="${C.sh}" opacity="${C.shadow}"/>
        <rect x="${x - 8}" y="${y0}" width="16" height="${798 - y0}" rx="4" fill="${C.wood[1]}"/>
        <rect x="${x - 32}" y="${y0 + 4}" width="64" height="${H}" rx="10" fill="${C.wood[1]}"/>
        <rect x="${x - 32}" y="${y0}" width="64" height="${H}" rx="10" fill="url(#${u}wood)"/>
        <rect x="${x - 25}" y="${y0 + 7}" width="50" height="${H - 14}" rx="6" fill="none" stroke="#FFF6E4" stroke-width="2" opacity=".45"/>
        <path d="M${x - 44} ${y0 + 2}L${x} ${y0 - 22}L${x + 44} ${y0 + 2}Z" fill="${C.wood[1]}"/><circle cx="${x}" cy="${y0 - 24}" r="5" fill="${C.wood[1]}"/>
        <path d="M${x - 30} ${y0 - 4}L${x} ${y0 - 18}" stroke="#fff" stroke-width="3" opacity=".25" stroke-linecap="round"/>
        ${chars.map((ch, i) => `<text x="${x}" y="${y0 + 44 + i * 36}" text-anchor="middle" class="svg-hand" font-size="30" fill="#FFF6E4">${esc(ch)}</text>`).join('')}
      </g>`;
    }
    const est = chars.length * (/[\u2E80-\u9FFF\uF900-\uFAFF\uFF00-\uFFEF]/.test(t) ? 31 : 17), tw = Math.min(est, 250), w = tw + 50, Rx = 1054, x0 = Rx - w, y0 = 590, h = 64;
    const p1 = x0 + 26, p2 = Rx - 26;
    return `<g class="park-sign">
      <ellipse cx="${(p1 + p2) / 2}" cy="798" rx="${w / 2 + 10}" ry="6" fill="${C.sh}" opacity="${C.shadow}"/>
      <g fill="${C.wood[1]}"><rect x="${p1 - 7}" y="${y0 + 20}" width="14" height="${188 - 20}" rx="4"/><rect x="${p2 - 7}" y="${y0 + 20}" width="14" height="${188 - 20}" rx="4"/>
      <rect x="${x0}" y="${y0 + 4}" width="${w}" height="${h}" rx="14"/></g>
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="14" fill="url(#${u}wood)"/>
      <path d="M${x0 + 10} ${y0 + h / 2}H${Rx - 10}" stroke="${C.wood[1]}" stroke-width="2" opacity=".35"/>
      <rect x="${x0 + 8}" y="${y0 + 5}" width="${w - 16}" height="5" rx="2.5" fill="#fff" opacity=".25"/>
      <g fill="${C.wood[1]}"><circle cx="${x0 + 14}" cy="${y0 + 14}" r="3.5"/><circle cx="${Rx - 14}" cy="${y0 + 14}" r="3.5"/></g>
      <text x="${(x0 + Rx) / 2}" y="${y0 + 43}" text-anchor="middle" class="svg-hand" font-size="30" fill="#FFF6E4"${est > 250 ? ` textLength="${tw}" lengthAdjust="spacingAndGlyphs"` : ''}>${esc(t)}</text>
      <path d="M${p1} ${y0 + h + 6}q-14 30 4 56q-16 26 -2 56" stroke="${C.leaf[2]}" stroke-width="4" fill="none"/>
      <path d="M${p1 - 4} ${y0 + h + 30}q-16 -2 -18 -14q14 0 18 14ZM${p1 + 2} ${y0 + h + 60}q16 -4 18 -16q-14 2 -18 16ZM${p1 - 2} ${y0 + h + 94}q-16 -2 -18 -14q14 0 18 14Z" fill="${C.leaf[1]}"/>
    </g>`;
  }

  function picnic(u, C, mood) {
    let s = mood === 'sunset' ? `<path d="M1452 846L1210 858L1236 866L1730 848Z" fill="${C.sh}" opacity=".1"/>` : '';
    s += `<ellipse cx="1592" cy="850" rx="166" ry="12" fill="${C.sh}" opacity="${C.shadow}"/>
      <path d="M1482 798L1700 798L1732 844L1450 844Z" fill="url(#${u}ging)"/>
      <path d="M1450 844L1732 844L1731 851Q1591 856 1451 851Z" fill="${C.ging[1]}"/>
      <path d="M1482 799H1700M1450 844H1732" stroke="#fff" stroke-width="2" opacity=".45"/>
      <ellipse cx="1520" cy="824" rx="34" ry="9" fill="${C.whiteD}"/><ellipse cx="1520" cy="822" rx="32" ry="8" fill="${C.white}"/>
      <path d="M1500 822L1518 804L1522 822Z" fill="#F7E1B0"/><path d="M1503 820L1517 807" stroke="#8CCB6A" stroke-width="3"/>
      <path d="M1518 822L1536 806L1542 822Z" fill="#F2D49A"/><path d="M1522 820L1536 809" stroke="#FF8F8F" stroke-width="3"/>`;
    [[1566, 818, C.flowers[0]], [1590, 824, C.flowers[3]]].forEach(([cx, cy, c]) => {
      s += `<ellipse cx="${cx}" cy="${cy + 2}" rx="13" ry="4" fill="${C.sh}" opacity=".15"/><path d="M${cx - 10} ${cy - 22}H${cx + 10}L${cx + 8} ${cy}H${cx - 8}Z" fill="${c}"/>
        <ellipse cx="${cx}" cy="${cy - 22}" rx="10" ry="3.5" fill="#fff" opacity=".7"/><path d="M${cx + 9} ${cy - 17}q9 1 7 8q-2 4 -8 3" stroke="${c}" stroke-width="3" fill="none"/>`;
    });
    s += `<path d="M1630 796Q1664 740 1698 796" stroke="${C.wick[1]}" stroke-width="8" fill="none" stroke-linecap="round"/>
      <path d="M1630 796Q1664 744 1698 796" stroke="${C.wick[0]}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M1612 788L1660 776L1672 814L1622 822Z" fill="${C.ging[1]}"/><path d="M1618 790L1656 780" stroke="#fff" stroke-width="4" opacity=".8" stroke-dasharray="6 6"/>
      <g transform="rotate(-28 1690 790)"><rect x="1664" y="770" width="80" height="20" rx="10" fill="#E7B36A"/><path d="M1680 774l6 12M1698 774l6 12M1716 774l6 12" stroke="#C98E45" stroke-width="3" stroke-linecap="round"/></g>
      <path d="M1616 796H1712L1704 836Q1664 842 1624 836Z" fill="url(#${u}wick)"/>
      <path d="M1618 806H1710M1620 816H1708M1622 826H1706" stroke="${C.wick[1]}" stroke-width="2.5" opacity=".6"/>
      <path d="${[...Array(8)].map((_, i) => `M${1628 + i * 11} 798v36`).join('')}" stroke="${C.wick[1]}" stroke-width="2" opacity=".35"/>
      <rect x="1610" y="790" width="108" height="10" rx="5" fill="${C.wick[0]}"/><rect x="1614" y="791" width="100" height="3" rx="1.5" fill="#fff" opacity=".35"/>
      <circle cx="1470" cy="832" r="11" fill="#E8453C"/><circle cx="1466" cy="828" r="3.5" fill="#fff" opacity=".45"/><path d="M1470 821q2 -6 6 -7" stroke="#6B4A2A" stroke-width="2.5" fill="none"/>
      <circle cx="1612" cy="836" r="8" fill="#E8453C"/><circle cx="1624" cy="838" r="7" fill="#FF5F6D"/>`;
    return s;
  }

  const CSS = `
    .is-here .park-duck { animation: park-drift 11s ease-in-out infinite alternate; }
    .park-duck.d2 { animation-duration: 13s; animation-delay: -4s; }
    .is-here .park-bob { animation: park-bob 2.8s ease-in-out infinite; }
    @keyframes park-drift { from { transform: translateX(22%); } to { transform: translateX(-26%); } }
    @keyframes park-bob { 0%, 100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(3%) rotate(-3deg); } }
    .is-here .park-fly { animation: park-fly 13s ease-in-out infinite; }
    .is-here .park-wing { animation: park-flap .24s ease-in-out infinite alternate; }
    @keyframes park-fly { 0%, 100% { transform: translate(0, 0); } 25% { transform: translate(140%, -90%); } 50% { transform: translate(260%, 10%); } 75% { transform: translate(110%, 80%); } }
    @keyframes park-flap { from { transform: scaleX(1); } to { transform: scaleX(.25); } }
    .is-here .park-petal { animation: park-petal 10s linear infinite; }
    @keyframes park-petal { 0% { transform: translate(0, 0) rotate(0); opacity: 0; } 10% { opacity: 1; } 50% { transform: translate(520%, 1100%) rotate(300deg); } 88% { opacity: .9; } 100% { transform: translate(900%, 2200%) rotate(620deg); opacity: 0; } }
    .is-here .park-ff { animation: park-ff 5s ease-in-out infinite; }
    @keyframes park-ff { 0%, 100% { transform: translate(0, 0); opacity: .25; } 30% { opacity: 1; } 50% { transform: translate(120%, -90%); opacity: .9; } 70% { opacity: .2; } 85% { transform: translate(-60%, -40%); opacity: .8; } }
    .park-shoot { opacity: 0; }
    .is-here .park-shoot { animation: park-shoot 11s ease-in infinite; }
    @keyframes park-shoot { 0%, 86% { transform: translate(0, 0); opacity: 0; } 88% { opacity: 1; } 100% { transform: translate(-90%, 45%); opacity: 0; } }
    .is-here .park-glow { animation: park-glow 3.6s ease-in-out infinite alternate; }
    @keyframes park-glow { from { opacity: .75; } to { opacity: 1; } }
    @media (prefers-reduced-motion: reduce) { .park-duck, .park-bob, .park-fly, .park-wing, .park-petal, .park-ff, .park-shoot, .park-glow { animation: none !important; } }`;

  // ---------- the scene ----------
  function park(u, sc = {}) {
    const mood = moodOf(sc, 'day') in PAL ? moodOf(sc, 'day') : 'day';
    let C = PAL[mood];
    const r = rng(83);
    // season: 'spring' (default, pink blossom) | 'summer' (all green) | 'autumn' (orange and gold leaves)
    const SEASON = {
      summer: { day: ['#C8EBA6', '#94D07A', '#6DB35E'], sunset: ['#E2DB92', '#B8C06A', '#8FA257'], night: ['#4E8672', '#3A6B5E', '#2C564D'] },
      autumn: { day: ['#FFE0A3', '#F7B062', '#E07B3C'], sunset: ['#FFD39A', '#F09A5C', '#C9683F'], night: ['#B58A74', '#8E6A5E', '#6E5250'] },
    }[sc.season];
    if (SEASON) {
      const b = SEASON[mood] || SEASON.day;
      C = Object.assign({}, C, { blos: b, blosD: b[2], blosH: b[0] });
    }
    const night = mood === 'night', sunset = mood === 'sunset', shade = sunset ? 'long' : 'round';
    css('park', CSS);

    const leafDefs = rg(u + 'leaf', [[0, C.leaf[0]], [0.6, C.leaf[1]], [1, C.leaf[2]]], 0.4, 0.3, 0.7) +
      rg(u + 'blos', [[0, C.blos[0]], [0.6, C.blos[1]], [1, C.blos[2]]], 0.4, 0.3, 0.7);

    // ---- sky decorations (depth 0.05): stars at night ----
    let skySvg = '';
    if (night) {
      const g = ['', '', ''];
      for (let i = 0; i < 36; i++) g[i % 3] += `<circle cx="${R(r() * 2400)}" cy="${R(r() * 500)}" r="${(1.5 + r() * 2.4).toFixed(1)}"/>`;
      skySvg = g.map((c, i) => `<g class="twinkle" fill="#FFF6D8" style="animation-delay:${-i * 0.8}s">${c}</g>`).join('');
    }

    // ---- far (0.12): sun / moon, faint city, hazy hills ----
    let far = `<defs>${rg(u + 'sun', sunset ? [[0, '#FFF0C0', 1], [0.25, '#FFD08A', 0.75], [0.6, '#FF9F80', 0.25], [1, '#FF9F80', 0]] : [[0, '#FFF7CF', 1], [0.3, '#FFF1B0', 0.6], [1, '#FFF1B0', 0]])}${glow(u + 'moon', '#E8EEFF')}</defs>`;
    if (night) {
      far += `<circle cx="1700" cy="190" r="220" fill="url(#${u}moon)" opacity=".55"/><circle cx="1700" cy="190" r="54" fill="#FFF6DC"/>
        <g fill="#EDE3C4" opacity=".6"><circle cx="1684" cy="176" r="10"/><circle cx="1716" cy="206" r="7"/><circle cx="1712" cy="170" r="5"/></g>`;
    } else if (sunset) {
      far += `<circle cx="1770" cy="520" r="520" fill="url(#${u}sun)"/><circle cx="1770" cy="520" r="98" fill="#FFE3A8"/><circle cx="1770" cy="520" r="78" fill="#FFF0CC"/>
        <path d="M120 300h460M780 250h340M260 380h240M1320 330h260M2000 280h300M1880 400h200" stroke="#FFC2A0" stroke-width="14" stroke-linecap="round" opacity=".55"/>
        <path d="M500 190h280M1500 180h220M2100 220h180" stroke="#E7A0C0" stroke-width="10" stroke-linecap="round" opacity=".45"/>`;
    } else {
      far += `<circle cx="1950" cy="160" r="240" fill="url(#${u}sun)"/><circle cx="1950" cy="160" r="60" fill="#FFF8DC"/>`;
    }
    far += skyline(sc, 1270, 640, 250, C.city, { filler: C.cityF, fillerOp: 0.85, seed: 21, windows: night ? '#FFD98A' : undefined, towerLights: night ? '#FFB8D8' : undefined });
    far += `<path d="${smooth([[-40, 628], [300, 596], [620, 614], [900, 590], [1300, 606], [1700, 584], [2050, 604], [2440, 590]])}V760H-40Z" fill="${C.hill}"/>`;

    // ---- tree line (0.3) ----
    let back = '', frontRow = '', his = '';
    for (let x = -60; x < 2460; x += 90 + r() * 50) back += `<circle cx="${R(x)}" cy="${R(612 + r() * 26)}" r="${R(52 + r() * 40)}"/>`;
    for (let x = -40; x < 2460; x += 80 + r() * 40) {
      const rr = 40 + r() * 30, cy = 652 + r() * 16;
      frontRow += `<circle cx="${R(x)}" cy="${R(cy)}" r="${R(rr)}"/>`;
      his += `<circle cx="${R(x - rr * 0.3)}" cy="${R(cy - rr * 0.45)}" r="${R(rr * 0.35)}"/>`;
    }
    let line = `<rect y="640" width="2400" height="140" fill="${C.tl[1]}"/><g fill="${C.tl[0]}">${back}${[140, 690, 1880, 2280].map((x) => `<ellipse cx="${x}" cy="568" rx="36" ry="118"/>`).join('')}</g>
      <g fill="${C.tl[2]}" opacity=".35">${[140, 690, 1880, 2280].map((x) => `<ellipse cx="${x - 10}" cy="530" rx="14" ry="60"/>`).join('')}</g>
      <g fill="${C.tl[1]}">${frontRow}</g><g fill="${C.tl[2]}" opacity=".45">${his}</g>`;
    if (night) {
      let d = '';
      for (let i = 0; i < 12; i++) d += `<circle cx="${R(80 + i * 200 + r() * 80)}" cy="${R(664 + r() * 16)}" r="3"/>`;
      line += `<g fill="#FFE3A0" opacity=".85">${d}</g>`;
    }

    // ---- mid (0.6): meadow, gazebo, trees across the pond, willow, the pond ----
    let mid = `<defs>${lg(u + 'pond', [[0, C.pond[0]], [0.45, C.pond[1]], [1, C.pond[2]]])}${lg(u + 'meadow', [[0, C.meadow[0]], [1, C.meadow[1]]])}
      ${lg(u + 'roof', [[0, C.roof[0]], [1, C.roof[1]]])}${rg(u + 'warm', [[0, '#FFD98A', 0.8], [1, '#FFD98A', 0]])}${leafDefs}${duckDef(u, C)}</defs>`;
    mid += `<path d="${smooth([[-40, 668], [400, 656], [800, 664], [1200, 658], [1600, 664], [2000, 654], [2440, 662]])}V1000H-40Z" fill="url(#${u}meadow)"/>`;
    let hedge = '', hedgeH = '';
    for (let x = -20; x < 2440; x += 110) {
      if (x > 560 && x < 1840) continue;
      hedge += `<ellipse cx="${x}" cy="664" rx="64" ry="26"/>`;
      hedgeH += `<ellipse cx="${x - 12}" cy="656" rx="30" ry="12"/>`;
    }
    mid += `<g fill="${C.bush[1]}">${hedge}</g><g fill="${C.leafH}" opacity=".3">${hedgeH}</g>`;
    mid += gazebo(u, 440, 706, C, mood);
    mid += tree(905, 672, 0.58, C, u + 'leaf', 'leaf', 'round') + tree(1500, 672, 0.62, C, u + 'blos', 'blos', 'round', -6);
    let strands = ['', ''];
    for (let i = 0; i < 15; i++) { const x = 1880 + i * 16; strands[i % 2] += `M2010 528Q${x} 540 ${x - 12} ${622 + (i % 4) * 22}`; }
    mid += `<path d="M1980 700C1974 640 1984 580 2010 540" stroke="${C.trunk}" stroke-width="20" fill="none" stroke-linecap="round"/>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 0%" fill="none" stroke-width="7" stroke-linecap="round">
      <path d="${strands[0]}" stroke="${C.leaf[1]}"/><path d="${strands[1]}" stroke="${C.leaf[2]}"/>
      <ellipse cx="2000" cy="524" rx="110" ry="42" fill="${C.leaf[1]}" stroke="none"/><ellipse cx="1980" cy="512" rx="50" ry="16" fill="${C.leafH}" stroke="none" opacity=".4"/></g>`;
    const pond = 'M600 716C600 680 790 664 1000 666C1160 667 1260 661 1420 664C1620 668 1810 682 1810 718C1810 752 1610 770 1200 770C800 770 600 754 600 716Z';
    mid += `<path d="${pond}" fill="${C.rim}" stroke="${C.rim}" stroke-width="22" stroke-linejoin="round"/>
      <path d="${pond}" fill="${C.rimD}" transform="translate(0 4)"/><path d="${pond}" fill="url(#${u}pond)"/>
      <ellipse cx="905" cy="682" rx="100" ry="12" fill="${C.leafD}" opacity=".28"/><ellipse cx="1500" cy="684" rx="110" ry="12" fill="${C.blos[2]}" opacity=".3"/>`;
    if (sunset || night) {
      const cx = sunset ? 1770 : 1700;
      let d = '';
      for (let i = 0; i < 6; i++) d += `M${cx - 44 + i * 7} ${684 + i * 13}h${88 - i * 14}`;
      mid += `<path d="${d}" stroke="${sunset ? '#FFE7B0' : '#FFF6DC'}" stroke-width="5" stroke-linecap="round" opacity=".6"/>`;
    }
    let waves = '';
    for (let i = 0; i < 16; i++) waves += `M${R(660 + r() * 1100)} ${R(686 + r() * 70)}h${R(18 + r() * 40)}`;
    mid += `<path d="${waves}" stroke="${C.wave}" stroke-width="3.5" stroke-linecap="round" opacity=".45"/>`;
    // lily pads + lotus
    let pads = '', lotus = '';
    [[700, 744, 1], [760, 756, 0], [1560, 752, 1], [1650, 740, 0], [1720, 756, 1]].forEach(([x, y, fl]) => {
      pads += `M${x} ${y}L${x + 20} ${y - 5}A24 8 0 1 1 ${x + 22} ${y + 2}Z`;
      if (fl) lotus += `M${x - 8} ${y - 4}q-2 -12 4 -16q2 8 4 12q2 -4 4 -12q6 4 4 16Z`;
    });
    mid += `<path d="${pads}" fill="${C.leaf[1]}"/><path d="${lotus}" fill="${C.flowers[0]}"/>`;
    // reeds / cattails at both ends
    let reeds = '', heads = '';
    [[610, 740], [640, 750], [668, 758], [1760, 748], [1790, 736], [1812, 744]].forEach(([x, y], i) => {
      const hgt = 70 + (i % 3) * 12;
      reeds += `M${x} ${y}q${i % 2 ? 6 : -6} -40 ${i % 2 ? 2 : -4} -${hgt}M${x + 6} ${y}q10 -24 18 -40`;
      heads += `<rect x="${x + (i % 2 ? -2 : -8)}" y="${y - hgt}" width="9" height="24" rx="4.5"/>`;
    });
    mid += `<path d="${reeds}" stroke="${C.leaf[2]}" stroke-width="4" fill="none" stroke-linecap="round"/><g fill="#8A5A3C">${heads}</g>`;

    // ---- near (1): lawn, path, trees, lamps, bench, flower beds, picnic ----
    let near = `<defs>${lg(u + 'lawn', [[0, C.lawn[0]], [0.4, C.lawn[1]], [1, C.lawn[2]]])}${lg(u + 'path', [[0, C.path[0]], [1, C.path[1]]])}
      ${lg(u + 'pole', [[0, C.metal], [0.4, C.metalH], [1, C.metal]], 0, 0, 1, 0)}${lg(u + 'wick', [[0, C.wick[0]], [1, C.wick[1]]])}${lg(u + 'wood', [[0, C.wood[0]], [1, C.wood[1]]])}
      ${leafDefs}${glow(u + 'lamp', '#FFE6A0')}${rg(u + 'pool', [[0, '#FFE6A0', 0.55], [1, '#FFE6A0', 0]])}
      <pattern id="${u}ging" width="28" height="28" patternUnits="userSpaceOnUse"><rect width="28" height="28" fill="${C.ging[0]}"/><g fill="${C.ging[1]}" opacity=".5"><rect width="14" height="28"/><rect width="28" height="14"/></g></pattern>
      ${lampDef(u, C)}${night ? '' : flyDef(u)}</defs>`;
    const edge = [];
    for (let x = -40; x <= 2440; x += 160) edge.push([x, R(768 + r() * 8)]);
    near += `<path d="${smooth(edge)}V1000H-40Z" fill="url(#${u}lawn)"/>
      <path d="${[...Array(7)].map((_, i) => `M${i * 380 - 120} 1000L${i * 380 + 40} 780H${i * 380 + 200}L${i * 380 + 70} 1000Z`).join('')}" fill="#fff" opacity=".045"/>`;
    // the path, with gravel made from dashed strokes
    near += `<path d="${smooth(TOP)}${smooth(BOT.slice().reverse(), 'L')}Z" fill="url(#${u}path)"/>
      <path d="${smooth(BOT)}" stroke="${C.pathE}" stroke-width="5" fill="none" opacity=".7"/>
      <g fill="none" stroke="${C.peb}" stroke-linecap="round">
        <path d="${smooth(between(0.25))}" stroke-width="5" stroke-dasharray="0 47"/><path d="${smooth(between(0.5))}" stroke-width="7" stroke-dasharray="0 61" stroke-dashoffset="20"/>
        <path d="${smooth(between(0.75))}" stroke-width="6" stroke-dasharray="0 38" stroke-dashoffset="9"/></g>`;
    // grass tufts & daisies on the lawn (not on the path or the blanket)
    let tufts = '', daisy = '', eyes = '';
    for (let i = 0; i < 50; i++) {
      const x = R(r() * 2400), y = R(784 + r() * 212);
      if ((y > yAt(TOP, x) - 8 && y < yAt(BOT, x) + 12) || (x > 1440 && x < 1740 && y < 860)) continue;
      if (i % 3 === 0) { daisy += `<circle cx="${x}" cy="${y}" r="5"/>`; eyes += `<circle cx="${x}" cy="${y}" r="2"/>`; }
      else tufts += `M${x} ${y}q2 -10 -2 -16M${x + 5} ${y}q1 -8 6 -12M${x - 4} ${y}q-2 -6 -7 -9`;
    }
    near += `<path d="${tufts}" stroke="${C.tuft}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/><g fill="${C.flowers[2]}">${daisy}</g><g fill="${C.flowers[1]}">${eyes}</g>`;
    // big trees at the edges, shrubs, flower beds
    near += tree(200, 796, 1, C, u + 'blos', 'blos', shade) + tree(2200, 802, 1.02, C, u + 'leaf', 'leaf', shade, 4);
    near += shrub(420, 800, 0.9, C, r) + shrub(2010, 820, 0.8, C, r) + tulips(846, 1030, 794, C, r) + shrub(1402, 800, 0.62, C, r);
    near += bench(730, 798, C, mood);
    near += lamp(u, 580, 802, C, mood) + lamp(u, 1398, 800, C, mood) + basket(1398, 470, C) + lamp(u, 1880, 842, C, mood);
    near += signBoard(u, label(sc, 'sign', '', ''), C);
    near += picnic(u, C, mood);

    // ---- front (1.35, over the couple): bushes in the bottom corners, a blossom branch top-left ----
    let front = `<defs>${rg(u + 'fb', [[0, C.leaf[0]], [0.7, C.bush[0]], [1, C.bush[1]]], 0.4, 0.25, 0.7)}</defs>`;
    const blob = (l) => l.map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}"/>`).join('');
    front += `<g fill="${C.bush[1]}">${blob([[-20, 990, 80], [130, 1010, 70], [470, 1010, 64], [1920, 1012, 66], [2250, 1000, 74], [2440, 990, 70]])}</g>
      <g fill="url(#${u}fb)">${blob([[40, 960, 72], [220, 985, 64], [360, 1000, 56], [2020, 990, 58], [2170, 968, 70], [2350, 975, 62]])}</g>
      <g fill="${C.leafH}" opacity=".35">${blob([[20, 924, 22], [200, 954, 18], [2150, 934, 20], [2330, 944, 18]])}</g>`;
    let blades = '', fl = ['', '', '', '', ''];
    for (let i = 0; i < 14; i++) {
      const gx = R(i < 7 ? 20 + r() * 540 : 1880 + r() * 520);
      blades += `M${gx} 1000q${R(-8 + r() * 16)} -40 ${R(-10 + r() * 20)} -${R(60 + r() * 40)}`;
    }
    for (let i = 0; i < 16; i++) fl[i % 5] += `<circle cx="${R(i < 8 ? r() * 480 : 1920 + r() * 480)}" cy="${R(940 + r() * 50)}" r="${R(6 + r() * 4)}"/>`;
    front += `<path d="${blades}" stroke="${C.leaf[2]}" stroke-width="7" fill="none" stroke-linecap="round"/>${fl.map((c, i) => `<g fill="${C.flowers[i]}">${c}</g>`).join('')}`;
    const bl = [[40, 40, 34], [120, 70, 30], [200, 112, 26], [290, 104, 28], [360, 118, 22], [344, 50, 22], [230, 60, 20], [60, 0, 30], [170, 20, 22]];
    front += `<g class="sway" style="transform-box:fill-box;transform-origin:0% 0%">
      <path d="M-30 20Q160 40 360 110M150 52q40 30 60 70M260 84q50 -10 90 -40" stroke="${C.trunk}" stroke-width="10" fill="none" stroke-linecap="round"/>
      <g fill="${C.blos[0]}">${blob(bl.filter((_, i) => i % 2 === 0))}</g><g fill="${C.blos[1]}">${blob(bl.filter((_, i) => i % 2))}</g>
      <g fill="${C.blosH}" opacity=".7">${blob(bl.map(([x, y, rr]) => [R(x - rr * 0.3), R(y - rr * 0.35), R(rr * 0.3)]))}</g></g>`;

    // ---- extras ----
    const skyFx = [];
    if (night) {
      skyFx.push(fx(700, 120, 220, 90, 'cloud-drift slow', cloud(20, 60, 1.1, '#3A4A8A', 0.55)));
      skyFx.push(fx(1500, 90, 200, 70, 'park-shoot', `<path d="M196 4L70 50" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55"/><circle cx="196" cy="4" r="4" fill="#fff"/>`));
    } else {
      const cf = sunset ? '#FFD9CF' : '#fff', co = sunset ? 0.85 : 1;
      skyFx.push(fx(240, 170, 280, 120, 'cloud-drift', cloud(20, 70, 1.4, cf, co)),
        fx(1020, 100, 240, 100, 'cloud-drift slow', cloud(20, 62, 1.1, cf, co)),
        fx(1420, 250, 200, 80, 'cloud-drift', cloud(20, 56, 0.9, cf, co * 0.9)),
        fx(700, 190, 64, 30, 'bird', birds()), fx(790, 230, 48, 24, 'bird b2', birds(), '0 0 64 30'));
    }

    // ducks: a mother with two ducklings left of the couple, one more on the right
    const midFx = [
      fx(900, 674, 84, 56, 'park-duck', duck(u, C.duck), '0 0 120 80'),
      fx(986, 690, 42, 28, 'park-duck', duck(u, C.duckling), '0 0 120 80'),
      fx(1030, 694, 38, 26, 'park-duck', duck(u, C.duckling), '0 0 120 80'),
      fx(1350, 684, 80, 54, 'park-duck d2', duck(u, C.duck, true), '0 0 120 80'),
    ];
    midFx[1].style = 'animation-delay:-.5s';
    midFx[2].style = 'animation-delay:-1s';
    [[720, 700], [1100, 740], [1260, 690], [1460, 726], [1640, 700]].forEach(([x, y], i) => {
      const e = fx(x, y, 80, 12, 'shimmer', `<path d="M4 6h72" stroke="${C.wave}" stroke-width="4" stroke-linecap="round"/>`);
      e.style = `animation-delay:${-i * 0.7}s`;
      midFx.push(e);
    });

    const nearFx = [];
    if (night) {
      for (let i = 0; i < 14; i++) {
        const e = fx(R(i < 5 ? 960 + r() * 480 : 300 + r() * 1900), R(520 + r() * 300), 34, 34, 'park-ff', `<circle cx="17" cy="17" r="15" fill="#E9FF8A" opacity=".22"/><circle cx="17" cy="17" r="4" fill="#FFFDE0"/>`);
        e.style = `animation-delay:${(-r() * 5).toFixed(1)}s;animation-duration:${(4 + r() * 3).toFixed(1)}s`;
        nearFx.push(e);
      }
    } else {
      [[990, 560, '#FFB3D0', '#FF8FB8'], [1450, 640, '#FFE17A', '#FFC34A'], [560, 640, '#B8A1FF', '#9C82F0'], [2020, 600, '#8FD3FF', '#5FB6F0']].forEach(([x, y, c1, c2], i) => {
        const e = fx(x, y, 40, 30, 'park-fly', `<use href="#${u}fly" fill="${c1}" color="${c2}" class="park-wing" style="transform-box:fill-box;transform-origin:50% 50%"/>`);
        e.style = `animation-delay:${-i * 3.1}s`;
        nearFx.push(e);
      });
      for (let i = 0; i < 9; i++) {
        const e = fx(R(i < 5 ? 40 + r() * 460 : 700 + r() * 1100), R(i < 5 ? 150 + r() * 200 : 240 + r() * 160), 18, 18, 'park-petal',
          `<path d="M9 1C15 5 15 13 9 17C3 13 3 5 9 1Z" fill="${C.blos[i % 2]}"/>`);
        e.style = `animation-delay:${(-i * 1.07).toFixed(1)}s;animation-duration:${(9 + r() * 4).toFixed(1)}s`;
        nearFx.push(e);
      }
    }

    return {
      sky: C.sky,
      layers: [
        { depth: 0.05, svg: skySvg, extras: skyFx },
        { depth: 0.12, svg: far },
        { depth: 0.3, svg: line },
        { depth: 0.6, svg: mid, extras: midFx },
        { depth: 1, svg: near, extras: nearFx },
        { depth: 1.35, svg: front, front: true },
      ],
    };
  }

  TripArt.scenes.park = park;
})();
