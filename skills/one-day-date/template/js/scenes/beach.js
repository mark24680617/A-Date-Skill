/*
 * 海边 · Beach day. Ocean to the horizon, a sandy beach with a wet-sand shoreline and foam,
 * a lighthouse on a far headland, a drifting sailboat, a striped umbrella with towels,
 * a sandcastle and a palm tree. Moods: day (default) · sunset · night.
 * Label: sign (a wooden sign by the lifebuoy post; '' hides it).
 */
(function () {
  'use strict';
  const { rng, lg, rg, glow, cloud, fx, birds, label, css, esc, moodOf } = TripArt.h;

  const HZ = 600;                                   // horizon line
  const f1 = (v) => Math.round(v * 10) / 10;
  const rgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => '#' + rgb(a).map((v, i) => Math.round(v + (rgb(b)[i] - v) * t).toString(16).padStart(2, '0')).join('');

  const MOODS = {
    day: {
      sky: 'linear-gradient(180deg, #3FA4EA 0%, #78C6F2 28%, #B4E2F7 47%, #E2F5F6 60%, #E2F5F6 100%)',
      sea: [[0, '#A8DDEA'], [0.06, '#4FB2D4'], [0.35, '#2EACC8'], [0.72, '#3FC6C6'], [1, '#86E0CF']],
      haze: '#EEF9F8', wave: '#F1FCFF', glint: '#FFFFFF', crest: '#A6F0E4',
      body: [1322, 400, 56], disc: [[0, '#FFFFFF'], [0.7, '#FFF7D6'], [1, '#FFEBA6']], glowC: '#FFF4C8', glowR: 250,
      hill: ['#A6DA8C', '#72B86A'], rock: ['#DCCAA9', '#B9A283'], far: '#8DC3C4',
      dry: ['#FDE9C4', '#F2CE95'], wet: ['#BFE0DC', '#DABF92', '#CDA979'], grain: '#D2AB74',
      foam: '#FFFFFF', tint: '#FFFFFF', amt: 0,
      cloud: '#FFFFFF', cloudOp: 0.95,
      boat: ['#FFFFFF', '#FFE8E8', '#FFFFFF', '#E0533D'],
    },
    sunset: {
      sky: 'linear-gradient(180deg, #43397F 0%, #7B4A96 17%, #C45D93 33%, #F2857C 46%, #FFB36A 55%, #FFD48A 60%, #FFD48A 100%)',
      sea: [[0, '#FFC98A'], [0.07, '#EE9D90'], [0.3, '#A472A8'], [0.72, '#78609F'], [1, '#A77FB2']],
      haze: '#FFD9A0', wave: '#FFE3C6', glint: '#FFEBB0', crest: '#E7A8C0',
      body: [1200, 548, 128], disc: [[0, '#FFF8D8'], [0.55, '#FFD27A'], [1, '#FF9A5C']], glowC: '#FFC56E', glowR: 560,
      hill: ['#B36C9C', '#7D4F86'], rock: ['#A0628E', '#6E4A7E'], far: '#C98AA6',
      dry: ['#FFD6AE', '#EBAE86'], wet: ['#F4B89C', '#DDA08A', '#C98C80'], grain: '#C9876E',
      foam: '#FFF3E8', tint: '#FF8A6A', amt: 0.14,
      cloud: '#FFC7BE', cloudOp: 0.9, lit: true,
      boat: ['#FFE3C8', '#FFD0B0', '#6A4A7A', '#FF8A6A'],
    },
    night: {
      sky: 'linear-gradient(180deg, #060C26 0%, #0F1C4A 34%, #1F3372 52%, #34498A 60%, #34498A 100%)',
      sea: [[0, '#3A5090'], [0.06, '#23397A'], [0.4, '#172A62'], [1, '#22427A']],
      haze: '#5A6FAE', wave: '#8FA8E0', glint: '#FFF6D8', crest: '#4F6CB0',
      body: [1326, 404, 44], moon: true, glowC: '#FFF2C8', glowR: 230,
      hill: ['#2F4274', '#22315E'], rock: ['#34406E', '#262F58'], far: '#2B3A6A',
      dry: ['#9793BE', '#716E9C'], wet: ['#5F72AA', '#6A6A9C', '#5A5A8C'], grain: '#5E5A8A',
      foam: '#DDE6FF', tint: '#1E2A62', amt: 0.5,
      cloud: '#34487F', cloudOp: 0.55, lit: true,
      boat: ['#9AA6D0', '#8894C0', '#26305A', '#FFD98A'],
    },
  };

  // Smooth curve through points (quadratic through midpoints). start: 'M' or 'L'.
  function smooth(pts, start = 'M') {
    let d = `${start}${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const [x, y] = pts[i], [nx, ny] = pts[i + 1];
      d += `Q${x} ${y} ${Math.round((x + nx) / 2)} ${Math.round((y + ny) / 2)}`;
    }
    const L = pts[pts.length - 1];
    return d + `L${L[0]} ${L[1]}`;
  }

  // A palm frond from (cx, cy) in direction ang (radians), bending down by droop. Returns [outline, rib].
  function frond(cx, cy, ang, len, droop) {
    const dx = Math.cos(ang), dy = Math.sin(ang), N = 8, up = [[cx, cy]], lo = [];
    const P = (t) => [cx + dx * len * t, cy + dy * len * t + droop * len * t * t];
    for (let i = 1; i < N; i++) {
      const t = i / N, [px, py] = P(t);
      let tx = dx, ty = dy + 2 * droop * t; const m = Math.hypot(tx, ty); tx /= m; ty /= m;
      let nx = -ty, ny = tx; if (ny < 0) { nx = -nx; ny = -ny; }
      const w = Math.sin(Math.PI * Math.min(1, t * 1.05)) * len * 0.15 + 3, k = i % 2 ? 1 : 0.45;
      up.push([Math.round(px - nx * w * k * 0.7 + tx * w * 0.4 * k), Math.round(py - ny * w * k * 0.7 + ty * w * 0.4 * k)]);
      lo.push([Math.round(px + nx * w * k + tx * w * 0.5 * k), Math.round(py + ny * w * k + ty * w * 0.5 * k)]);
    }
    const [ex, ey] = P(1).map(Math.round);
    return [smooth(up.concat([[ex, ey]], lo.reverse(), [[cx, cy]])) + 'Z', `M${cx} ${cy}Q${Math.round(cx + dx * len / 2)} ${Math.round(cy + dy * len / 2)} ${ex} ${ey}`];
  }
  const fronds = (list, x, y, fill, rib) => {
    const f = list.map(([a, l, dr]) => frond(x, y, a * Math.PI / 180, l, dr));
    return `<path d="${f.map((v) => v[0]).join('')}" fill="${fill}" stroke="${fill}" stroke-width="4" stroke-linejoin="round"/><path d="${f.map((v) => v[1]).join('')}" stroke="${rib}" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".6"/>`;
  };

  function palm(u, bx, by, tx, ty, T) {
    const cx = bx + 24, cy = by - 320;
    const B = (t) => [(1 - t) * (1 - t) * bx + 2 * (1 - t) * t * cx + t * t * tx, (1 - t) * (1 - t) * by + 2 * (1 - t) * t * cy + t * t * ty];
    let s = `<ellipse cx="${bx - 30}" cy="${by + 4}" rx="130" ry="11" fill="#000" opacity=".12"/>`;
    const N = 11; let rings = '';
    for (let i = 0; i < N; i++) {
      const [x0, y0] = B(i / N), [x1, y1] = B((i + 1) / N);
      const a = Math.atan2(y1 - y0, x1 - x0), nx = -Math.sin(a), ny = Math.cos(a);
      const w0 = (32 - 12 * i / N) * 0.44, w1 = (32 - 12 * (i + 1) / N) * 0.6;
      const p = (x, y, w) => `${Math.round(x + nx * w)} ${Math.round(y + ny * w)}`;
      s += `<path d="M${p(x0, y0, -w0)}L${p(x1, y1, -w1)}L${p(x1, y1, w1)}L${p(x0, y0, w0)}Z" fill="url(#${u}trunk)"/>`;
      rings += `M${p(x1, y1, -w1)}L${p(x1, y1, w1)}`;
    }
    s += `<path d="${rings}" stroke="${T('#9A6C40')}" stroke-width="3" stroke-linecap="round"/>
      <g class="sway" style="transform-box:fill-box;transform-origin:50% 40%">`
      + fronds([[-152, 200, 0.5], [-28, 205, 0.5], [-118, 160, 0.3], [-62, 165, 0.3]], tx, ty, T('#3C8E57'), T('#86C872'))
      + `<circle cx="${tx - 12}" cy="${ty + 16}" r="14" fill="${T('#7A5236')}"/><circle cx="${tx + 12}" cy="${ty + 18}" r="14" fill="${T('#6A4630')}"/><circle cx="${tx}" cy="${ty + 30}" r="13" fill="${T('#805838')}"/>`
      + fronds([[174, 235, 0.6], [6, 225, 0.6], [140, 185, 0.75], [40, 185, 0.75], [-95, 120, 0.9]], tx, ty, T('#5CB765'), T('#A5E08A'))
      + `<circle cx="${tx}" cy="${ty}" r="15" fill="${T('#5CB765')}"/></g>`;
    return s;
  }

  // Striped beach umbrella canopy: apex (cx, top), rim at top + ry, width 2·rx.
  function umbrella(u, cx, top, rx, ry, c1, c2) {
    const n = 6, rim = top + ry, B = [], C = [];
    for (let i = 0; i <= n; i++) {
      const x = cx - rx + (2 * rx * i) / n;
      B.push([Math.round(x), Math.round(rim + Math.sin(Math.PI * i / n) * 12)]);
      C.push([Math.round(x + (x - cx) * 0.06), Math.round(top + ry * 0.04)]);
    }
    let s = '', outline = `M${cx} ${top}Q${C[0]} ${B[0]}`;
    for (let i = 0; i < n; i++) {
      const mx = Math.round((B[i][0] + B[i + 1][0]) / 2), my = Math.round((B[i][1] + B[i + 1][1]) / 2 - 11);
      s += `<path d="M${cx} ${top}Q${C[i]} ${B[i]}Q${mx} ${my} ${B[i + 1]}Q${C[i + 1]} ${cx} ${top}Z" fill="${i % 2 ? c2 : c1}"/>`;
      outline += `Q${mx} ${my} ${B[i + 1]}`;
    }
    return s + `<path d="${outline}Q${C[n]} ${cx} ${top}Z" fill="url(#${u}shade)"/>`;
  }

  // Towel lying on the sand: corners bottom-left, bottom-right, top-right, top-left.
  function towel(p, base, stripe, n) {
    const L = (a, b, t) => [f1(a[0] + (b[0] - a[0]) * t), f1(a[1] + (b[1] - a[1]) * t)];
    let s = `<path d="M${p[0]}L${p[1]}L${p[1][0]} ${p[1][1] + 5}L${p[0][0]} ${p[0][1] + 5}Z" fill="#000" opacity=".14"/><path d="M${p.join('L')}Z" fill="${base}"/>`;
    for (let k = 0; k < n; k++) {
      const a = (k + 0.5) / (n + 0.5) - 0.06, b = a + 0.5 / (n + 0.5);
      s += `<path d="M${L(p[0], p[1], a)}L${L(p[0], p[1], b)}L${L(p[3], p[2], b)}L${L(p[3], p[2], a)}Z" fill="${stripe}"/>`;
    }
    return s;
  }

  function starfish(x, y, R, rot, fill) {
    let d = '', dots = '';
    for (let i = 0; i < 5; i++) {
      const a = rot + i * 1.2566, b = a + 0.6283;
      d += `${i ? '' : 'M'}${Math.round(x + Math.cos(a) * R)} ${Math.round(y + Math.sin(a) * R * 0.6)}Q${Math.round(x + Math.cos(b) * R * 0.2)} ${Math.round(y + Math.sin(b) * R * 0.12)} `;
      dots += `M${Math.round(x + Math.cos(a) * R * 0.55)} ${Math.round(y + Math.sin(a) * R * 0.33)}h0`;
    }
    d += `${Math.round(x + Math.cos(rot) * R)} ${Math.round(y + Math.sin(rot) * R * 0.6)}Z`;
    return `<ellipse cx="${x + 2}" cy="${y + 4}" rx="${R * 1.05}" ry="${R * 0.4}" fill="#000" opacity=".1"/><path d="${d}" fill="${fill}" stroke="${fill}" stroke-width="${f1(R * 0.22)}" stroke-linejoin="round"/><path d="${dots}" stroke="#fff" stroke-width="${f1(R * 0.15)}" stroke-linecap="round" opacity=".55"/>`;
  }

  function shell(x, y, s, fill) {
    return `<g transform="translate(${x} ${y}) scale(${s} ${f1(s * 0.8)})"><ellipse cx="0" cy="2" rx="16" ry="4" fill="#000" opacity=".1"/><path d="M0 0L-14-11Q-15-25 0-27Q15-25 14-11Z" fill="${fill}"/>
      <path d="M0 0L-8-23M0 0V-26M0 0L8-23" stroke="#fff" stroke-width="1.8" opacity=".6"/><rect x="-6" y="-3" width="12" height="6" rx="2.5" fill="${fill}"/></g>`;
  }

  // Pac-man shaped claw
  function claw(cx, cy, r, a, open, fill) {
    const p = (t) => `${f1(cx + r * Math.cos(t))} ${f1(cy + r * Math.sin(t))}`;
    return `<path d="M${cx} ${cy}L${p(a + open)}A${r} ${r} 0 1 1 ${p(a - open)}Z" fill="${fill}"/>`;
  }

  function crab(x, y, c) {
    return `<g class="beach-crab"><g transform="translate(${x} ${y})">
      <ellipse cx="0" cy="17" rx="30" ry="5" fill="#000" opacity=".13"/>
      <path d="M-15 6l-13 9M-12 10l-10 9M15 6l13 9M12 10l10 9M-11-4l-12-12M11-4l12-12" stroke="${c}" stroke-width="4.5" stroke-linecap="round"/>
      ${claw(-26, -20, 9, -1.2, 0.45, c)}${claw(26, -20, 9, -1.94, 0.45, c)}
      <path d="M-6-8v-12M6-8v-12" stroke="${c}" stroke-width="3.4"/>
      <ellipse cx="0" cy="3" rx="20" ry="13" fill="${c}"/><ellipse cx="-6" cy="-3" rx="8" ry="4" fill="#fff" opacity=".3"/>
      <circle cx="-6" cy="-22" r="5.5" fill="#fff"/><circle cx="6" cy="-22" r="5.5" fill="#fff"/>
      <circle cx="-5" cy="-21" r="2.6" fill="#2B2323"/><circle cx="7" cy="-21" r="2.6" fill="#2B2323"/>
      <path d="M-5 6q5 4 10 0" stroke="#7A2626" stroke-width="2" fill="none" stroke-linecap="round"/>
      <ellipse cx="-12" cy="5" rx="4" ry="2.4" fill="#FFB0C0" opacity=".7"/><ellipse cx="12" cy="5" rx="4" ry="2.4" fill="#FFB0C0" opacity=".7"/></g></g>`;
  }

  function sandcastle(u, cx, by, T) {
    const tw = (x, w0, w1, y0, y1) => `M${x - w0} ${y1}L${x - w1} ${y0}L${x + w1} ${y0}L${x + w0} ${y1}Z`;
    const cren = (x, w, y) => { const m = (w * 2) / 5; return [0, 2, 4].map((k) => `<rect x="${f1(x - w + k * m)}" y="${y - 11}" width="${f1(m)}" height="13" rx="3"/>`).join(''); };
    const light = T('#FFE7BC'), dark = T('#D9A866'), door = T('#B5844C');
    const towers = [[cx - 62, 26, 21, by - 80, by - 22], [cx + 64, 24, 19, by - 66, by - 22], [cx, 40, 33, by - 114, by - 24]];
    let s = `<ellipse cx="${cx + 8}" cy="${by + 2}" rx="124" ry="12" fill="#000" opacity=".13"/>
      <path d="M${cx - 116} ${by}Q${cx - 104} ${by - 34} ${cx - 60} ${by - 36}H${cx + 62}Q${cx + 106} ${by - 32} ${cx + 116} ${by}Z" fill="${dark}"/>
      <path d="M${cx - 100} ${by - 14}Q${cx - 80} ${by - 32} ${cx - 50} ${by - 32}" stroke="${light}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
      <line x1="${cx}" y1="${by - 124}" x2="${cx}" y2="${by - 166}" stroke="${T('#8A6A4A')}" stroke-width="3"/>
      <path class="beach-flag" style="transform-box:fill-box;transform-origin:0% 50%" d="M${cx + 1} ${by - 166}l34 9l-34 10Z" fill="${T('#FF6F91')}"/>`;
    towers.forEach(([x, w0, w1, y0, y1]) => {
      s += `<path d="${tw(x, w0, w1, y0, y1)}" fill="url(#${u}castle)"/><g fill="url(#${u}castle)">${cren(x, w1, y0)}</g>
        <path d="M${x - w1 - 2} ${y0 + 18}H${x + w1 + 2}M${x - w0 + 3} ${y1 - 16}H${x + w0 - 3}" stroke="${light}" stroke-width="3" opacity=".6"/>
        <rect x="${x - 4}" y="${y0 + 26}" width="8" height="14" rx="4" fill="${door}"/>`;
    });
    s += `<path d="M${cx - 12} ${by - 24}v-18a12 12 0 0 1 24 0v18Z" fill="${door}"/>
      ${shell(cx + 22, by - 50, 0.4, T('#FF9DB4'))}${shell(cx - 70, by - 40, 0.34, T('#FFFFFF'))}
      <circle cx="${cx - 30}" cy="${by - 30}" r="4" fill="${T('#8FD3E8')}"/><circle cx="${cx + 42}" cy="${by - 28}" r="3.4" fill="${T('#FFFFFF')}"/>`;
    return s;
  }

  function lighthouse(u, x, by, T, mood, lit) {
    const H = 132, h0 = 25, h1 = 17, top = by - H, ly = top - 18;
    const hw = (y) => h1 + (h0 - h1) * (y - top) / H;
    const band = (a, b) => `M${f1(x - hw(a))} ${a}L${f1(x + hw(a))} ${a}L${f1(x + hw(b))} ${b}L${f1(x - hw(b))} ${b}Z`;
    let s = '';
    if (mood === 'night') {
      s += `<g class="beach-beam" style="transform-origin:${x}px ${ly}px"><path d="M${x} ${ly - 4}L${x + 900} ${ly - 95}L${x + 900} ${ly + 70}L${x} ${ly + 4}Z" fill="url(#${u}beam)"/></g>`;
    }
    s += `<path d="M${x + 16} ${by + 2}V${by - 28}H${x + 74}V${by + 4}Z" fill="${T('#FFFFFF')}"/><path d="M${x + 10} ${by - 26}L${x + 45} ${by - 50}L${x + 80} ${by - 26}Z" fill="${T('#D9473D')}"/>
      <rect x="${x + 50}" y="${by - 20}" width="12" height="12" rx="2" fill="${lit ? '#FFD98A' : T('#8FC6E8')}"/>
      <path d="${band(top, by)}" fill="${T('#FFFFFF')}"/><path d="${band(top + 28, top + 50)}${band(top + 80, top + 104)}" fill="${T('#E85A4F')}"/>
      <path d="M${x} ${top}L${x + h1} ${top}L${x + h0} ${by}L${x} ${by}Z" fill="#1A2440" opacity=".12"/>
      <path d="M${x - 7} ${by}v-16a7 7 0 0 1 14 0v16Z" fill="${T('#6A4A3A')}"/>
      <rect x="${x - 25}" y="${top - 6}" width="50" height="8" rx="3" fill="${T('#3F4A5A')}"/>
      <rect x="${x - 13}" y="${top - 30}" width="26" height="25" rx="3" fill="${lit ? '#FFE7A0' : T('#CDEBFF')}"/>
      <path d="M${x - 5} ${top - 30}v25M${x + 5} ${top - 30}v25" stroke="${T('#3F4A5A')}" stroke-width="2"/>
      <path d="M${x - 19} ${top - 29}Q${x} ${top - 60} ${x + 19} ${top - 29}Z" fill="${T('#D9473D')}"/><circle cx="${x}" cy="${top - 51}" r="4" fill="${T('#D9473D')}"/>`;
    if (lit) s += `<circle class="${mood === 'night' ? 'beach-flash' : 'beach-lamp'}" cx="${x}" cy="${ly}" r="${mood === 'night' ? 80 : 56}" fill="url(#${u}lamp)"/>`;
    return s;
  }

  // Twinkling reflection dashes inside a trapezoid below (x, y0), batched into 4 paths
  // (one per stroke width) so each batch twinkles with its own phase.
  function glints(x, y0, y1, w0, w1, n, seed, maxLen) {
    const q = rng(seed), d = ['', '', '', ''];
    for (let i = 0; i < n; i++) {
      const t = Math.pow(q(), 0.85), y = y0 + t * (y1 - y0), hw = w0 + t * (w1 - w0);
      const cx = x + (q() * 2 - 1) * hw * (0.3 + 0.7 * q()), len = (8 + t * maxLen) * (0.45 + q() * 0.8);
      d[Math.min(3, Math.floor(t * 4))] += `M${Math.round(cx - len / 2)} ${Math.round(y)}h${Math.round(len)}`;
    }
    return d.map((v, i) => `<path d="${v}" stroke-width="${2 + i * 1.3}"/>`).join('');
  }

  function beach(u, sc = {}) {
    const mood = MOODS[moodOf(sc, 'day')] ? moodOf(sc, 'day') : 'day';
    const M = MOODS[mood], T = (c) => (M.amt ? mix(c, M.tint, M.amt) : c);
    const r = rng(61);
    const [bx, by, br] = M.body;

    css('beach', `
.is-here .beach-roll{animation:beach-roll 7s ease-in-out infinite alternate}
.is-here .beach-roll.r2{animation-duration:9s;animation-delay:-4s}
.is-here .beach-roll.r3{animation-duration:5.5s;animation-delay:-2s}
@keyframes beach-roll{from{transform:translateX(-26px)}to{transform:translateX(26px)}}
.is-here .beach-swash{animation:beach-swash 6.5s ease-in-out infinite}
.is-here .beach-swash.s2{animation-name:beach-swash2}
@keyframes beach-swash{0%,100%{transform:translateY(-3px)}50%{transform:translateY(9px)}}
@keyframes beach-swash2{0%,100%{transform:translateY(0);opacity:.75}50%{transform:translateY(15px);opacity:.15}}
.beach-gl>*{opacity:.7}
.is-here .beach-gl>*{animation:beach-glint 2.6s ease-in-out infinite}
.is-here .beach-gl>:nth-child(2){animation-duration:3.2s;animation-delay:-1.1s}
.is-here .beach-gl>:nth-child(3){animation-duration:2.1s;animation-delay:-1.7s}
.is-here .beach-gl>:nth-child(4){animation-duration:2.8s;animation-delay:-.5s}
@keyframes beach-glint{0%,100%{opacity:.2}50%{opacity:1}}
.is-here .beach-gl.b2>*{animation-delay:-1.4s}
.is-here .beach-gl.b2>:nth-child(2n){animation-delay:-.3s}
.is-here .beach-tw>*{animation:twinkle 2.4s ease-in-out infinite}
.is-here .beach-tw>:nth-child(2n){animation-duration:3.3s;animation-delay:-1.2s}
.is-here .beach-tw>:nth-child(3n){animation-duration:4.1s;animation-delay:-2.3s}
.is-here .beach-beam{animation:beach-beam 9s linear infinite}
@keyframes beach-beam{0%{transform:scaleX(1)}50%{transform:scaleX(-1)}100%{transform:scaleX(1)}}
.is-here .beach-flash{animation:beach-flash 9s linear infinite}
@keyframes beach-flash{0%,50%,100%{opacity:.45}25%,75%{opacity:1}}
.is-here .beach-lamp{animation:beach-lamp 3s ease-in-out infinite}
@keyframes beach-lamp{50%{opacity:.65}}
.is-here .beach-flag{animation:beach-flag 1.3s ease-in-out infinite alternate}
@keyframes beach-flag{from{transform:skewY(-9deg)}to{transform:skewY(7deg) scaleX(.86)}}
.is-here .beach-crab{animation:beach-crab 11s ease-in-out infinite}
@keyframes beach-crab{0%,100%{transform:translateX(0)}18%,34%{transform:translateX(-50px)}58%,76%{transform:translateX(36px)}}
.is-here .beach-shoot{animation:beach-shoot 12s ease-in infinite}
@keyframes beach-shoot{0%,84%{opacity:0;transform:translate(0,0)}86%{opacity:1}95%{opacity:0;transform:translate(-300px,150px)}100%{opacity:0}}
.is-here .beach-bob{animation:beach-bob 4s ease-in-out infinite}
@keyframes beach-bob{50%{transform:translateY(3px) rotate(1.5deg)}}
`);

    // ---------- sky (depth 0.05): stars, sunset streaks; clouds + gulls as extras ----------
    let sky = '';
    if (mood === 'night') {
      const st = ['', '', '', '', ''];
      for (let i = 0; i < 80; i++) st[i % 5] += `M${Math.round(r() * 2400)} ${Math.round(18 + Math.pow(r(), 1.25) * 520)}h0`;
      const dots = (a, b) => st.slice(a, b).map((d, i) => `<path d="${d}" stroke-width="${2 + ((a + i) % 3) * 1.4}"/>`).join('');
      sky += `<defs>${lg(u + 'shoot', [[0, '#FFFFFF', 1], [1, '#FFFFFF', 0]], 0, 0, 1, 0)}</defs>
        <g stroke="#fff" stroke-linecap="round" opacity=".75">${dots(0, 3)}</g><g class="beach-tw" stroke="#FFF6D8" stroke-linecap="round">${dots(3, 5)}</g>
        <g class="beach-tw" fill="#FFF3C8">${[[520, 140], [880, 250], [1640, 120], [2010, 300], [300, 380], [1830, 430]].map(([x, y], i) => `<path transform="translate(${x} ${y}) scale(${i % 2 ? 1.4 : 1})" d="M0-9Q1-1 9 0Q1 1 0 9Q-1 1-9 0Q-1-1 0-9Z"/>`).join('')}</g>
        <g class="beach-shoot"><path d="M1760 120l110-48" stroke="url(#${u}shoot)" stroke-width="3.5" stroke-linecap="round"/></g>`;
    } else if (mood === 'sunset') {
      sky += `<g opacity=".75">
        <rect x="140" y="238" width="620" height="20" rx="10" fill="#A56BAA"/><rect x="300" y="268" width="380" height="12" rx="6" fill="#A56BAA" opacity=".7"/>
        <rect x="1560" y="180" width="660" height="22" rx="11" fill="#9E62A6"/><rect x="1720" y="212" width="420" height="12" rx="6" fill="#9E62A6" opacity=".7"/>
        <rect x="180" y="480" width="520" height="16" rx="8" fill="#FFB27E"/><rect x="330" y="506" width="300" height="10" rx="5" fill="#FFC48E"/>
        <rect x="1640" y="452" width="600" height="16" rx="8" fill="#FF9E86"/><rect x="1780" y="478" width="340" height="10" rx="5" fill="#FFB98E"/></g>`;
    }
    const cl = (x, y, w, h, cls, s) => fx(x, y, w, h, cls, cloud(20, h * 0.66, s, M.cloud, M.cloudOp));
    const skyEx = [cl(210, 140, 280, 120, 'cloud-drift', 1.5), cl(1560, 70, 230, 96, 'cloud-drift slow', 1.15), cl(620, 320, 190, 80, 'cloud-drift', 0.8)];
    if (mood !== 'night') {
      skyEx.push(fx(820, 250, 64, 30, 'bird', birds()), fx(930, 392, 46, 22, 'bird b2', birds(), '0 0 64 30'), fx(1540, 230, 54, 26, 'bird', birds(), '0 0 64 30'));
      skyEx[skyEx.length - 1].style = 'animation-delay:-9s';
    }

    // ---------- far (depth 0.12): sun/moon, sea, headland + lighthouse, islet ----------
    let far = `<defs>
      ${lg(u + 'sea', M.sea)}
      ${mood === 'sunset' ? '' : lg(u + 'hz', [[0, M.haze, 0], [0.5, M.haze, 0.9], [1, M.haze, 0]])}
      ${M.disc ? rg(u + 'disc', M.disc, 0.45, 0.4, 0.6) : ''}
      ${glow(u + 'glow', M.glowC)}
      ${lg(u + 'path', [[0, M.glint, 0], [0.5, M.glint, 0.6], [1, M.glint, 0]], 0, 0, 1, 0)}
      ${lg(u + 'hill', [[0, M.hill[0]], [1, M.hill[1]]])}
      ${lg(u + 'rock', [[0, M.rock[0]], [1, M.rock[1]]])}
      ${M.lit ? glow(u + 'lamp', '#FFE9A8') : ''}
      ${mood === 'night' ? lg(u + 'beam', [[0, '#FFF6D2', 0.85], [0.5, '#FFF3C4', 0.35], [1, '#FFF3C4', 0]], 0, 0, 1, 0) : ''}
      ${mood === 'sunset' ? rg(u + 'hzg', [[0, '#FFF3C8', 0.95], [0.5, '#FFE2A4', 0.45], [1, '#FFD89A', 0]]) : ''}
      <filter id="${u}blur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="16"/></filter>
    </defs>`;
    far += `<circle cx="${bx}" cy="${by}" r="${M.glowR}" fill="url(#${u}glow)"/>`;
    if (M.moon) {
      far += `<circle cx="${bx}" cy="${by}" r="${br}" fill="#FFF6DA"/><circle cx="${bx - 14}" cy="${by - 10}" r="10" fill="#EDE2BF" opacity=".7"/>
        <circle cx="${bx + 14}" cy="${by + 12}" r="7" fill="#EDE2BF" opacity=".6"/><circle cx="${bx + 8}" cy="${by - 20}" r="4.5" fill="#EDE2BF" opacity=".6"/>`;
    } else {
      far += `<circle cx="${bx}" cy="${by}" r="${br}" fill="url(#${u}disc)"/>`;
      if (mood === 'day') far += `<circle cx="${bx - 18}" cy="${by - 18}" r="${br * 0.35}" fill="#fff" opacity=".6"/>`;
    }
    far += `<rect x="-60" y="${HZ}" width="2520" height="250" fill="url(#${u}sea)"/>`;
    if (mood === 'sunset') far += `<ellipse cx="${bx}" cy="${HZ}" rx="1100" ry="46" fill="url(#${u}hzg)"/>`;
    else far += `<rect x="-60" y="${HZ - 16}" width="2520" height="30" fill="url(#${u}hz)"/>`;
    // islet with a tiny palm (left, far)
    far += `<path d="M250 ${HZ + 3}Q280 586 320 580Q362 566 402 575Q446 584 480 ${HZ + 3}Z" fill="${M.far}"/>
      <path d="M370 576q-3-24 8-42" stroke="${M.far}" stroke-width="5" fill="none"/><path d="M378 534q-18-6-30 6M378 534q16-8 28 4M378 534q-6-12-18-14M378 534q8-12 20-10" stroke="${M.far}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    // headland with the lighthouse (right; clear of the desktop info card, top-left)
    const hill = `M1330 ${HZ + 4}C1370 596 1400 574 1450 540C1500 506 1550 486 1620 478C1700 470 1800 468 1900 476C2050 488 2200 480 2480 462V${HZ + 4}Z`;
    far += `<path d="${hill}" transform="matrix(1 0 0 -.28 0 ${HZ * 1.28})" fill="${M.rock[1]}" opacity=".3"/>
      <path d="${hill}" fill="url(#${u}rock)"/>
      <path d="M1520 536q60-8 120 6M1700 528q70-10 150 4M1940 532q60 2 110 20M1560 574q90-12 190 0M2020 578q70 0 130 14M2240 540q60-6 120 4" stroke="${M.rock[1]}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".45"/>
      <path d="M1340 598C1370 590 1400 574 1450 540C1500 506 1550 486 1620 478C1700 470 1800 468 1900 476C2050 488 2200 480 2480 462V498Q2420 508 2360 502Q2300 512 2240 506Q2180 516 2120 508Q2060 518 2000 510Q1940 520 1880 512Q1820 522 1760 514Q1700 524 1650 516Q1600 526 1560 526Q1520 540 1490 552Q1450 574 1410 588Q1380 598 1340 598Z" fill="url(#${u}hill)"/>
      ${[[1398, 592, 32, 15], [1350, 598, 22, 9], [1446, 598, 20, 8], [1302, 601, 14, 5]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${M.rock[1]}"/><ellipse cx="${x - 4}" cy="${y - ry * 0.4}" rx="${rx * 0.6}" ry="${ry * 0.45}" fill="${M.rock[0]}" opacity=".6"/>`).join('')}
      <path d="M1280 ${HZ + 5}h50M1336 ${HZ + 6}h90M1430 ${HZ + 5}h40" stroke="${M.foam}" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
    far += lighthouse(u, 1600, 482, T, mood, !!M.lit);
    // sea texture
    const tex = ['', '', ''];
    for (let i = 0; i < 42; i++) {
      const t = Math.pow(r(), 1.5), y = HZ + 8 + t * 150, len = (14 + t * 80) * (0.5 + r());
      tex[Math.min(2, Math.floor(t * 3))] += `M${Math.round(r() * 2400)} ${Math.round(y)}h${Math.round(len)}`;
    }
    far += `<g stroke="${M.wave}" stroke-linecap="round">${tex.map((d, i) => `<path d="${d}" stroke-width="${1.6 + i * 1.4}" opacity="${0.4 + i * 0.1}"/>`).join('')}</g>`;
    // reflection path under the sun / moon
    if (mood === 'sunset') {
      far += `<path d="M${bx - 120} ${HZ}L${bx + 120} ${HZ}L${bx + 250} 760L${bx - 250} 760Z" fill="url(#${u}path)" filter="url(#${u}blur)" opacity=".8"/>
        <g fill="#FFF1C0">${[0, 1, 2, 3, 4, 5].map((k) => { const y = HZ + 4 + k * (8 + k * 3), w = 116 - k * 15; return `<rect x="${bx - w}" y="${y}" width="${w * 2}" height="${f1(4 + k * 0.9)}" rx="3" opacity="${f1(0.95 - k * 0.1)}"/>`; }).join('')}</g>
        <g class="beach-gl" stroke="${M.glint}" stroke-linecap="round">${glints(bx, HZ + 30, 760, 70, 240, 30, 7, 50)}</g><g class="beach-gl b2" stroke="${M.glint}" stroke-linecap="round">${glints(bx, HZ + 30, 760, 70, 240, 26, 17, 44)}</g>`;
    } else {
      far += `<path d="M${bx - 30} ${HZ}L${bx + 30} ${HZ}L${bx + 140} 760L${bx - 140} 760Z" fill="url(#${u}path)" filter="url(#${u}blur)" opacity="${mood === 'night' ? 0.5 : 0.35}"/>
        <g class="beach-gl" stroke="${M.glint}" stroke-linecap="round">${glints(bx, HZ + 6, 760, 22, 130, mood === 'night' ? 20 : 14, 9, 36)}</g><g class="beach-gl b2" stroke="${M.glint}" stroke-linecap="round">${glints(bx, HZ + 6, 760, 22, 130, mood === 'night' ? 18 : 12, 19, 32)}</g>`;
    }
    const [sail, sail2, hull, flag] = M.boat;
    const boat = fx(1150, 514, 100, 92, 'boat', `<g class="beach-bob" style="transform-box:fill-box;transform-origin:50% 90%">
      <path d="M52 8V78" stroke="${hull}" stroke-width="3"/><path d="M54 10Q80 40 92 74H54Z" fill="${sail}"/><path d="M50 18Q34 46 20 74H50Z" fill="${sail2}"/>
      <path d="M54 44H83" stroke="${flag}" stroke-width="4" opacity=".8"/><path d="M52 8l12 4l-12 4Z" fill="${flag}"/>
      <path d="M8 76H96L84 90H20Z" fill="${hull}"/><path d="M10 78H94" stroke="${flag}" stroke-width="3" opacity=".8"/>
      ${mood === 'night' ? `<circle cx="52" cy="70" r="3" fill="#FFD98A"/><circle cx="52" cy="70" r="10" fill="#FFD98A" opacity=".3"/>` : ''}</g>
      <path d="M22 94h60M32 99h40" stroke="${M.wave}" stroke-width="2.5" stroke-linecap="round" opacity=".6"/>`, '0 0 100 100');

    // ---------- mid (depth 0.4): rolling wave rows + shimmer ----------
    let mid = '';
    [[652, 3, 64, 10, 2.4, 0.45, ''], [690, 5, 98, 15, 3.4, 0.55, ' r2'], [726, 7, 132, 20, 4.4, 0.7, ' r3']].forEach(([y, a, p, band, sw, op, cls], i) => {
      let d = `M-240 ${y}`;
      for (let x = -240; x < 2640; x += p) d += `q${p / 4} ${-a} ${p / 2} 0t${p / 2} 0`;
      mid += `<g class="beach-roll${cls}" fill="none" stroke-linecap="round"><use href="#${u}w${i}" transform="translate(0 ${band * 0.45})" stroke="${M.crest}" stroke-width="${band}" opacity=".32"/><path id="${u}w${i}" d="${d}" stroke="${M.wave}" stroke-width="${sw}" opacity="${op}"/></g>`;
    });
    const midEx = [...Array(mood === 'night' ? 4 : 6)].map((_, i) => {
      const e = fx(130 + i * 400 + (i % 2) * 90, 616 + (i % 3) * 34, 72, 12, 'shimmer', `<path d="M4 6h64" stroke="${M.glint}" stroke-width="4" stroke-linecap="round"/>`);
      e.style = `animation-delay:${-i * 0.7}s`;
      return e;
    });

    // ---------- near (depth 1): beach ----------
    let near = `<defs>
      ${lg(u + 'wet', [[0, M.wet[0]], [0.14, M.wet[1]], [1, M.wet[2]]])}
      ${lg(u + 'dry', [[0, M.dry[0]], [1, M.dry[1]]])}
      ${lg(u + 'path', [[0, M.glint, 0], [0.5, M.glint, 0.55], [1, M.glint, 0]], 0, 0, 1, 0)}
      ${lg(u + 'shade', [[0, '#FFFFFF', 0.3], [0.45, '#FFFFFF', 0], [1, '#3A1A30', 0.22]], 0, 0, 1, 0)}
      ${lg(u + 'castle', [[0, T('#FFE2AE')], [1, T('#E0B06C')]], 0, 0, 1, 0)}
      ${lg(u + 'trunk', [[0, T('#E6BD84')], [1, T('#A97B4D')]], 0, 0, 1, 0)}
      ${lg(u + 'board', [[0, T('#6FD3DF')], [1, T('#3BAFC4')]], 0, 0, 1, 0)}
      ${lg(u + 'wood', [[0, T('#D9A06B')], [1, T('#B77D4C')]])}
      ${M.lit ? glow(u + 'lan', '#FFD27A') : ''}
      <filter id="${u}nblur" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="14"/></filter>
    </defs>`;
    const xs = []; for (let x = -80; x <= 2480; x += 80) xs.push(x);
    const R0 = Math.round;
    const sY = (x) => 750 + 5 * Math.sin(x / 230 + 0.6) + 3 * Math.sin(x / 83 + 2);
    const dY = (x) => 806 + 4 * Math.sin(x / 170) + 42 * Math.exp(-Math.pow((x - 1200) / 270, 2));
    near += `<path d="${smooth(xs.map((x) => [x, R0(sY(x) - 6)]))}V1000H-80Z" fill="url(#${u}wet)"/>`;
    // reflection of the sun / moon on the wet sand + shine streaks
    near += `<path d="M${bx - (mood === 'sunset' ? 230 : 120)} 752L${bx + (mood === 'sunset' ? 230 : 120)} 752L${bx + 60} 850L${bx - 60} 850Z" fill="url(#${u}path)" filter="url(#${u}nblur)" opacity="${mood === 'day' ? 0.35 : 0.6}"/>
      <g stroke="${M.glint}" stroke-linecap="round" opacity=".35">${[...Array(12)].map(() => `<path d="M${f1(r() * 2400)} ${f1(772 + r() * 34)}h${f1(30 + r() * 80)}" stroke-width="${f1(2 + r() * 2)}"/>`).join('')}</g>`;
    // foam swash (animated) at the water's edge
    const foamUp = xs.map((x) => [x, R0(sY(x) - 10)]);
    const foamLo = []; for (let x = 2480; x >= -80; x -= 40) foamLo.push([x, R0(sY(x) + 6 + (x % 80 ? 7 : 0))]);
    near += `<g class="beach-swash"><path d="${smooth(foamUp)}${smooth(foamLo, 'L')}Z" fill="${M.foam}" opacity=".92"/>
      <path d="${[...Array(22)].map(() => { const x = r() * 2400; return `M${R0(x)} ${R0(sY(x) + 12 + r() * 8)}h0`; }).join('')}" stroke="${M.foam}" stroke-width="6" stroke-linecap="round" opacity=".75"/></g>
      <g class="beach-swash s2"><path d="${smooth(xs.map((x) => [x, R0(sY(x) + 26 + 3 * Math.sin(x / 50))]))}" stroke="${M.foam}" stroke-width="3" fill="none" stroke-dasharray="46 12 10 12" stroke-linecap="round"/></g>`;
    // dry sand
    const dryTop = smooth(xs.map((x) => [x, R0(dY(x))]));
    near += `<path d="${dryTop}V1000H-80Z" fill="url(#${u}dry)"/><path id="${u}dt" d="${dryTop}" stroke="${M.wet[2]}" stroke-width="8" fill="none" opacity=".3"/>
      <use href="#${u}dt" transform="translate(0 7)" stroke="#fff" stroke-width="3" opacity=".8"/>`;
    const grain = ['', ''];
    for (let i = 0; i < 40; i++) { const x = r() * 2400; grain[i % 2] += `M${R0(x)} ${R0(Math.max(dY(x) + 14, 830 + r() * 165))}h0`; }
    near += `<g stroke="${M.grain}" stroke-linecap="round" opacity=".45"><path d="${grain[0]}" stroke-width="3.4"/><path d="${grain[1]}" stroke-width="6"/></g>
      <g stroke="${M.grain}" stroke-width="3" fill="none" stroke-linecap="round" opacity=".28">${[[140, 930], [620, 975], [1540, 960], [2130, 925], [1780, 990], [900, 960]].map(([x, y]) => `<path d="M${x} ${y}q30-8 60 0t60 0M${x + 24} ${y + 14}q26-7 52 0"/>`).join('')}</g>`;
    // footprints leading to the couple
    let steps = '';
    for (let k = 0; k < 6; k++) {
      const x = 872 + k * 34, y = 840 - k * 1.5 + (k % 2 ? 9 : 0);
      steps += `<ellipse cx="${x}" cy="${f1(y)}" rx="9" ry="3.6"/><ellipse cx="${x + 13}" cy="${f1(y)}" rx="3.6" ry="2.4"/>`;
    }
    near += `<g fill="${T('#B98E5E')}" opacity=".35">${steps}</g>`;
    // surfboard stuck in the sand
    near += `<g transform="rotate(-9 440 874)"><ellipse cx="450" cy="878" rx="70" ry="9" fill="#000" opacity=".12"/>
      <path d="M440 596C470 620 478 740 470 874H410C402 740 410 620 440 596Z" fill="url(#${u}board)"/>
      <path d="M440 604C444 680 444 780 440 872" stroke="${T('#FF8A5B')}" stroke-width="10" fill="none"/><path d="M426 640C422 700 420 780 422 868" stroke="${T('#FFD166')}" stroke-width="5" fill="none"/>
      <ellipse cx="428" cy="660" rx="6" ry="40" fill="#fff" opacity=".35"/></g>
      <path d="M392 878Q430 856 478 874Z" fill="${M.dry[1]}"/>`;
    // towels + umbrella
    near += towel([[520, 896], [706, 896], [742, 852], [566, 852]], T('#FF9FB4'), T('#FFFFFF'), 4)
      + towel([[736, 910], [914, 910], [936, 862], [764, 862]], T('#5CC6D6'), T('#FFE08A'), 3)
      + `<ellipse cx="640" cy="864" rx="42" ry="11" fill="${T('#E9C98A')}"/><ellipse cx="640" cy="858" rx="22" ry="12" fill="${T('#F4DCA4')}"/><path d="M618 862q22 6 44 0" stroke="${T('#FF7A8A')}" stroke-width="5" fill="none"/>
      <g fill="${T('#2E3440')}"><ellipse cx="818" cy="888" rx="13" ry="7"/><ellipse cx="846" cy="888" rx="13" ry="7"/></g><path d="M831 886h2" stroke="${T('#2E3440')}" stroke-width="3"/>
      <ellipse cx="790" cy="902" rx="150" ry="10" fill="#000" opacity=".1"/>
      <g transform="rotate(-7 742 886)"><path d="M742 540V886" stroke="${T('#F4F1EA')}" stroke-width="8" stroke-linecap="round"/><path d="M745 560V884" stroke="${T('#D8D2C4')}" stroke-width="2.5"/>
      ${umbrella(u, 742, 516, 196, 82, T('#FF6F7D'), T('#FFF5E6'))}<circle cx="742" cy="512" r="9" fill="${T('#FFD166')}"/></g>
      <path d="M728 888q14-10 30 0Z" fill="${M.dry[1]}"/>`;
    if (M.lit) near += `<circle cx="896" cy="858" r="70" fill="url(#${u}lan)"/><rect x="884" y="846" width="24" height="30" rx="6" fill="#FFF3D6" opacity=".55"/><rect x="889" y="852" width="14" height="20" rx="3" fill="#FFE3A0"/><path d="M886 846q10-14 20 0" stroke="#8A6A4A" stroke-width="2.5" fill="none"/>`;
    // beach ball
    const X = 962, Y = 880, R = 30;
    near += `<ellipse cx="${X + 6}" cy="${Y + R - 2}" rx="${R * 1.1}" ry="7" fill="#000" opacity=".14"/><circle cx="${X}" cy="${Y}" r="${R}" fill="${T('#FFFFFF')}"/>
      <path d="M${X} ${Y - R}Q${X - 2 * R} ${Y} ${X} ${Y + R}Q${X - 1.1 * R} ${Y} ${X} ${Y - R}Z" fill="${T('#FF5E6C')}"/>
      <path d="M${X} ${Y - R}Q${X - 0.35 * R} ${Y} ${X} ${Y + R}Q${X + 0.35 * R} ${Y} ${X} ${Y - R}Z" fill="${T('#FFD166')}"/>
      <path d="M${X} ${Y - R}Q${X + 2 * R} ${Y} ${X} ${Y + R}Q${X + 1.1 * R} ${Y} ${X} ${Y - R}Z" fill="${T('#3FA7F0')}"/>
      <circle cx="${X}" cy="${Y}" r="${R}" fill="url(#${u}shade)"/><ellipse cx="${X - 10}" cy="${Y - 14}" rx="8" ry="5" fill="#fff" opacity=".6"/>`;
    // shells, starfish, crab
    near += starfish(1016, 918, 22, -1.2, T('#FF9A5A')) + starfish(1392, 948, 17, -0.6, T('#FF7F7F'))
      + shell(1290, 936, 0.9, T('#FFB3C6')) + shell(1106, 978, 0.75, T('#FFFFFF')) + shell(1600, 950, 0.8, T('#FFD3A6')) + shell(300, 948, 0.8, T('#FFB3C6'))
      + crab(1180, 956, T('#FF6B5B'));
    // sandcastle + bucket & spade
    near += sandcastle(u, 1462, 868, T) + `<g><ellipse cx="1612" cy="878" rx="36" ry="7" fill="#000" opacity=".12"/>
      <path d="M1588 840H1636L1630 878H1594Z" fill="${T('#FF8A5B')}"/><rect x="1584" y="836" width="56" height="10" rx="5" fill="${T('#FFA77E')}"/>
      <path d="M1590 842q22-40 44 0" stroke="${T('#3F4A5A')}" stroke-width="3" fill="none"/><path d="M1600 852v18" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".4"/>
      <path d="M1650 872L1672 792" stroke="${T('#3F8FE0')}" stroke-width="7" stroke-linecap="round"/><path d="M1664 790h18" stroke="${T('#3F8FE0')}" stroke-width="8" stroke-linecap="round"/>
      <path d="M1640 878Q1640 852 1654 850Q1664 856 1660 880Z" fill="${T('#3F8FE0')}"/></g>`;
    // lifebuoy post + optional wooden sign
    const txt = label(sc, 'sign', '', '');
    const hasSign = !!(txt && String(txt).trim());
    const px = 1780, ptop = hasSign ? 596 : 668;
    near += `<ellipse cx="${px + 4}" cy="846" rx="34" ry="6" fill="#000" opacity=".12"/><rect x="${px - 8}" y="${ptop}" width="16" height="${846 - ptop}" rx="5" fill="url(#${u}wood)"/>`;
    if (hasSign) {
      const t = String(txt).trim(), em = [...t].reduce((a, c) => a + (/[\u2E80-\uFFFF]/.test(c) ? 1 : 0.58), 0);
      const fs = Math.min(32, 380 / em), tw = Math.max(150, em * fs + 60);
      near += `<g><rect x="${px - tw / 2 + 4}" y="${ptop + 16}" width="${f1(tw)}" height="62" rx="12" fill="#000" opacity=".12"/>
        <path d="M${f1(px - tw / 2)} ${ptop + 8}H${f1(px + tw / 2 - 14)}L${f1(px + tw / 2 + 12)} ${ptop + 39}L${f1(px + tw / 2 - 14)} ${ptop + 70}H${f1(px - tw / 2)}Q${f1(px - tw / 2 - 8)} ${ptop + 39} ${f1(px - tw / 2)} ${ptop + 8}Z" fill="url(#${u}wood)"/>
        <path d="M${f1(px - tw / 2 + 14)} ${ptop + 22}H${f1(px + tw / 2 - 30)}M${f1(px - tw / 2 + 24)} ${ptop + 58}H${f1(px + tw / 2 - 40)}" stroke="${T('#A56E40')}" stroke-width="2" opacity=".5"/>
        <text x="${px - 2}" y="${ptop + 50}" text-anchor="middle" class="svg-hand" font-size="${f1(fs)}" fill="${T('#FFF6E6')}">${esc(t)}</text></g>`;
    }
    near += `<g transform="translate(${px} 742)"><circle r="36" fill="none" stroke="#000" stroke-width="17" opacity=".1" transform="translate(4 5)"/>
      <circle r="36" fill="none" stroke="${T('#FFFFFF')}" stroke-width="17"/><circle r="36" fill="none" stroke="${T('#FF5E5E')}" stroke-width="17" stroke-dasharray="28.3 28.3" transform="rotate(-22)"/>
      <path d="M-26-24a36 36 0 0 1 30-12" stroke="#fff" stroke-width="4" fill="none" opacity=".6" stroke-linecap="round"/></g>`;
    // palm tree (right edge)
    near += palm(u, 2086, 862, 1964, 330, T);

    // ---------- front (depth 1.35): dune grass at the corners, flip-flops ----------
    let front = '';
    const tuft = (x, y, h, n) => {
      let s = '';
      for (let i = 0; i < n; i++) {
        const dx = (r() - 0.5) * 70, hh = h * (0.6 + r() * 0.5), bend = (r() - 0.5) * 60;
        s += `<path d="M${R0(x + dx * 0.3)} ${y}q${R0(bend * 0.3)} ${-R0(hh * 0.6)} ${R0(dx + bend)} ${-R0(hh)}" stroke="${i % 2 ? T('#7DBF6A') : T('#A9CF73')}" stroke-width="${R0(5 + r() * 4)}"/>`;
      }
      return s;
    };
    front += `<path d="M-60 1000Q-40 912 110 906Q250 902 330 1000Z" fill="${M.dry[1]}"/><path d="M2080 1000Q2170 910 2300 906Q2420 904 2460 1000Z" fill="${M.dry[1]}"/>`
      + `<g fill="none" stroke-linecap="round">${tuft(50, 1000, 130, 7) + tuft(190, 1000, 100, 5) + tuft(2230, 1000, 130, 7) + tuft(2370, 1000, 100, 5)}</g>`
      + `<circle cx="120" cy="930" r="9" fill="${T('#FF8FB8')}"/><circle cx="2300" cy="940" r="8" fill="${T('#FFFFFF')}"/><circle cx="2192" cy="952" r="7" fill="${T('#FFD166')}"/>
      <g><ellipse cx="520" cy="986" rx="50" ry="8" fill="#000" opacity=".1"/>
        <ellipse cx="496" cy="970" rx="18" ry="30" transform="rotate(62 496 970)" fill="${T('#FF7FA6')}"/><ellipse cx="548" cy="978" rx="18" ry="30" transform="rotate(74 548 978)" fill="${T('#FF7FA6')}"/>
        <path d="M488 962l14 6l-4-14M540 970l14 6l-4-14" stroke="${T('#FFFFFF')}" stroke-width="4" fill="none" stroke-linecap="round"/></g>`;

    const mn = (t) => t.replace(/>\s+</g, '><').replace(/\s*\n\s*/g, ' ');
    return {
      sky: M.sky,
      layers: [
        { depth: 0.05, svg: mn(sky), extras: skyEx },
        { depth: 0.12, svg: mn(far), extras: [boat] },
        { depth: 0.4, svg: mn(mid), extras: midEx },
        { depth: 1, svg: mn(near) },
        { depth: 1.35, svg: mn(front), front: true },
      ],
    };
  }

  TripArt.scenes.beach = beach;
})();
