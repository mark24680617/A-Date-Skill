/*
 * 游乐园 / funfair — a slowly turning Ferris wheel behind the couple, a carousel,
 * strings of bulbs, a ticket booth and a balloon / cotton-candy cart.
 * Moods: 'night' (default: everything glows) · 'sunset' (lights just coming on) · 'day'.
 * Labels: name (entrance sign) · tickets (booth sign). '' hides that sign.
 */
(function () {
  'use strict';
  const { rng, lg, rg, glow, cloud, fx, birds, label, css, esc, moodOf, skyline } = TripArt.h;

  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mix = (a, b, t) => { const B = hex(b); return '#' + hex(a).map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, '0')).join(''); };
  const f = Math.round;
  const pol = (cx, cy, rad, deg) => [f(cx + rad * Math.cos(deg * Math.PI / 180)), f(cy + rad * Math.sin(deg * Math.PI / 180))];
  // Catmull-Rom through pts, sampled into a polyline
  function spline(pts, step) {
    const out = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (let k = 0; k < step; k++) {
        const t = k / step, c = (a, b, q, d) => f(0.5 * (2 * b + (q - a) * t + (2 * a - 5 * b + 4 * q - d) * t * t + (3 * b - a - 3 * q + d) * t * t * t));
        out.push([c(p0[0], p1[0], p2[0], p3[0]), c(p0[1], p1[1], p2[1], p3[1])]);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  // rough painted width of a label, in font-size units
  const textW = (t) => [...String(t)].reduce((s, ch) => s + (/[⺀-￿]/.test(ch) ? 1 : ch === ' ' ? 0.3 : 0.6), 0);

  function amusement(u, sc = {}) {
    const mood = moodOf(sc, 'night');
    const NIGHT = mood === 'night', DAY = mood === 'day';
    const lit = NIGHT ? 1 : DAY ? 0 : 0.75;          // how strongly the lights glow
    const r = rng(83);
    // colour grading for painted things (lights are not graded)
    const T = (c) => NIGHT ? mix(c, '#2A2458', 0.4) : DAY ? c : mix(c, '#E9707F', 0.16);
    const C = { pink: '#FF8FB1', rose: '#FF6F91', cream: '#FFF4E6', mint: '#8EDDC6', sky: '#8FC8F5', lemon: '#FFD97A', lilac: '#B9A4F2', coral: '#FF9E80', gold: '#F4C152' };
    const WIN = lit ? '#FFE39A' : '#CDEBFF';
    const BULB = ['#FFE58A', '#FF9EC4', '#9FF0E0', '#FFC28A'];
    const BULB2 = ['#FFE58A', '#FFFFFF'];
    const glowOp = (k) => (lit ? (k * lit).toFixed(2) : 0);

    // A string of bulbs along path d: dots made with a dash pattern, one <use> per colour.
    let nb = 0;
    function bulbs(d, colors, gap, size, tw) {
      const id = `${u}bl${nb++}`, per = gap * colors.length;
      let s = `<defs><path id="${id}" d="${d}" fill="none"/></defs>`;
      colors.forEach((c, i) => {
        s += `<g class="${tw && lit ? 'amusement-tw t' + (i % 3) : ''}" stroke-dasharray="0 ${per}" stroke-dashoffset="${-i * gap}" stroke-linecap="round">` +
          (lit ? `<use href="#${id}" stroke="${c}" stroke-width="${f(size * 2.8)}" opacity="${glowOp(0.24)}"/>` : '') +
          `<use href="#${id}" stroke="${lit ? mix(c, '#FFFFFF', 0.55) : c}" stroke-width="${size}"/></g>`;
      });
      return s;
    }

    css('amusement', `
      .amusement-wheel, .amusement-cab { transform-box: view-box; }
      .is-here .amusement-wheel { animation: amusement-spin 90s linear infinite; }
      .is-here .amusement-cab { animation: amusement-spin 90s linear infinite reverse; }
      @keyframes amusement-spin { to { transform: rotate(360deg); } }
      .is-here .amusement-tw { animation: amusement-tw 1.8s ease-in-out infinite alternate; }
      .is-here .amusement-tw.t1 { animation-delay: -.6s; }
      .is-here .amusement-tw.t2 { animation-delay: -1.2s; }
      @keyframes amusement-tw { from { opacity: 1; } to { opacity: .3; } }
      .is-here .amusement-horse { animation: amusement-bob 1.6s ease-in-out infinite alternate; }
      @keyframes amusement-bob { from { transform: translateY(-16px); } to { transform: translateY(14px); } }
      .is-here .amusement-drop { animation: amusement-drop 10s ease-in-out infinite; }
      @keyframes amusement-drop { 0%, 12% { transform: none; } 55%, 64% { transform: translateY(-360px); } 69% { transform: none; animation-timing-function: ease-out; } 73% { transform: translateY(-26px); } 77%, 100% { transform: none; } }
      .amusement-bunch { transform-box: fill-box; transform-origin: 50% 100%; }
      .is-here .amusement-bunch { animation: amusement-sway 4.6s ease-in-out infinite alternate; }
      @keyframes amusement-sway { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
      .amusement-rise { opacity: 0; }
      .is-here .amusement-rise { animation: amusement-rise 17s linear infinite; }
      @keyframes amusement-rise { 0% { transform: none; opacity: 0; } 5% { opacity: 1; } 35% { transform: translate(55%, -190%) rotate(6deg); } 70% { transform: translate(-20%, -390%) rotate(-5deg); } 90% { opacity: 1; } 100% { transform: translate(30%, -560%); opacity: 0; } }
      .is-here .amusement-spark { animation: amusement-spark 2.6s ease-in-out infinite; }
      @keyframes amusement-spark { 0%, 100% { transform: scale(.3) rotate(0); opacity: .2; } 50% { transform: scale(1) rotate(45deg); opacity: 1; } }
      .amusement-fw { opacity: 0; }
      .is-here .amusement-fw { animation: amusement-fw 4.2s ease-out infinite; }
      @keyframes amusement-fw { 0% { transform: scale(.15); opacity: 0; } 8% { opacity: 1; } 55% { transform: scale(1); opacity: .9; } 80%, 100% { transform: scale(1.08) translateY(6%); opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .is-here [class*="amusement-"] { animation: none !important; } }
    `);

    // ------------------------------------------------------------------ sky
    let sky = `<defs>${rg(u + 'sun', DAY ? [[0, '#FFFBE0', 1], [0.3, '#FFF1B0', 0.6], [1, '#FFF1B0', 0]] : NIGHT ? [[0, '#FFF6D8', 0.9], [0.3, '#FFF6D8', 0.25], [1, '#FFF6D8', 0]] : [[0, '#FFF0C0', 1], [0.3, '#FFC07A', 0.65], [1, '#FF8A70', 0]])}</defs>`;
    if (NIGHT) sky += `<circle cx="1990" cy="150" r="170" fill="url(#${u}sun)"/><circle cx="1990" cy="150" r="46" fill="#FFF3CF"/><circle cx="1974" cy="140" r="10" fill="#EFE0B6" opacity=".7"/><circle cx="2004" cy="166" r="6" fill="#EFE0B6" opacity=".6"/>`;
    else if (DAY) sky += `<circle cx="660" cy="110" r="200" fill="url(#${u}sun)"/><circle cx="660" cy="110" r="58" fill="#FFF3B8"/>`;
    else sky += `<circle cx="1450" cy="600" r="440" fill="url(#${u}sun)"/><circle cx="1450" cy="600" r="96" fill="#FFE6A6"/>
      <path d="M60 470h460M780 340h420M140 300h260M1560 250h360M1900 420h300" stroke="#FFB59A" stroke-width="14" stroke-linecap="round" opacity=".55"/>`;
    if (!DAY) {
      const grp = ['', '', ''];
      for (let i = 0, n = NIGHT ? 54 : 14; i < n; i++) grp[i % 3] += `<circle cx="${f(r() * 2400)}" cy="${f(r() * (NIGHT ? 560 : 200))}" r="${(1.2 + r() * 2.6).toFixed(1)}"/>`;
      sky += grp.map((g, i) => `<g class="amusement-tw t${i}" fill="#FFF6DA" opacity="${NIGHT ? 1 : 0.6}">${g}</g>`).join('');
    }
    const sparkle = `<path d="M20 0Q23 17 40 20Q23 23 20 40Q17 23 0 20Q17 17 20 0Z" fill="${DAY ? '#FFFFFF' : '#FFF3C4'}"/>`;
    const skyExtras = [[870, 250], [1600, 120], [1520, 420], [930, 460], [1740, 300], [640, 170], [2150, 380]]
      .slice(0, DAY ? 3 : 7).map(([x, y], i) => Object.assign(fx(x, y, 40, 40, 'amusement-spark', sparkle), { style: `animation-delay:${-i * 0.9}s` }));
    if (NIGHT) {
      let d = '';
      for (let i = 0; i < 14; i++) { const a = i * 360 / 14, [x1, y1] = pol(80, 80, 20, a), [x2, y2] = pol(80, 80, 72, a); d += `M${x1} ${y1}L${x2} ${y2}`; }
      const burst = (c) => `<path d="${d}" stroke="${c}" stroke-width="6" stroke-linecap="round" stroke-dasharray="6 10" fill="none"/><circle cx="80" cy="80" r="7" fill="#FFF6DA"/>`;
      [[420, 90, 160, '#FF9EC4', -1], [1680, 40, 130, '#9FF0E0', -3.1], [700, 20, 110, '#FFE58A', -2.2]].forEach(([x, y, s, c, dl]) =>
        skyExtras.push(Object.assign(fx(x, y, s, s, 'amusement-fw', burst(c), '0 0 160 160'), { style: `animation-delay:${dl}s` })));
    } else {
      const cf = DAY ? '#FFFFFF' : '#FFD6D0';
      skyExtras.push(fx(140, 200, 280, 110, 'cloud-drift', cloud(20, 70, 1.5, cf, 0.95)),
        fx(1500, 150, 240, 90, 'cloud-drift slow', cloud(20, 60, 1.2, cf, 0.85)),
        fx(2000, 330, 200, 80, 'cloud-drift', cloud(20, 56, 0.9, cf, 0.8)));
      if (DAY) skyExtras.push(fx(700, 180, 64, 30, 'bird', birds()), fx(790, 220, 48, 24, 'bird b2', birds(), '0 0 64 30'));
    }

    // ------------------------------------------------------------------ far: roller coaster, skyline, hills
    const coast = DAY ? '#A9C4E6' : NIGHT ? '#5B4C96' : '#B76F9E';
    let far = skyline(sc, 2020, 760, 300, DAY ? '#C3D6EE' : NIGHT ? '#3C3474' : '#B97A9E', { seed: 21, filler: DAY ? '#CFDDF1' : NIGHT ? '#453C80' : '#C48AA8', towerLights: NIGHT ? '#FF7A8A' : null });
    const track = spline([[-60, 640], [90, 540], [230, 380], [380, 180], [510, 560], [640, 340], [770, 560], [900, 470], [1010, 620], [1120, 700]], 8);
    const legs = track.filter((p, i) => i % 3 === 1 && p[0] > -40 && p[0] < 1100);
    far += `<path d="${legs.map(([x, y]) => `M${x} ${y + 8}V770`).join('')}${legs.slice(0, -1).map(([x, y], i) => `M${x} ${f((y + 770) / 2)}L${legs[i + 1][0]} ${f((legs[i + 1][1] + 770) / 2 + 30)}`).join('')}" stroke="${coast}" stroke-width="6" opacity=".8"/>`;
    far += `<defs><path id="${u}trk" d="M${track.map((p) => p.join(' ')).join('L')}" fill="none"/></defs>
      <circle cx="706" cy="400" r="80" fill="none" stroke="${coast}" stroke-width="14"/>
      <use href="#${u}trk" stroke="${coast}" stroke-width="16" stroke-linejoin="round"/><use href="#${u}trk" stroke="${coast}" stroke-width="28" stroke-dasharray="4 18"/>`;
    if (lit) far += `<use href="#${u}trk" stroke="#FFE3A0" stroke-width="6" stroke-dasharray="0 46" stroke-linecap="round" opacity="${glowOp(0.8)}"/>`;
    // little train on the first drop
    const pk = track.reduce((b, p, i) => (p[1] < track[b][1] ? i : b), 0);
    [1, 2, 3].forEach((o, k) => {
      const [x, y] = track[pk + o], [x2, y2] = track[pk + o + 1];
      far += `<g transform="translate(${x} ${y - 12}) rotate(${f(Math.atan2(y2 - y, x2 - x) * 180 / Math.PI)})"><rect x="-17" y="-14" width="34" height="20" rx="8" fill="${T([C.rose, C.lemon, C.sky][k])}"/><circle cx="-4" cy="-18" r="7" fill="${T('#7A5A6A')}"/></g>`;
    });
    let hill = 'M-20 1000V720';
    for (let x = -20; x < 2440; x += 80) hill += `q40 ${-30 - (x % 3) * 12} 80 0`;
    far += `<path d="${hill}V1000Z" fill="${DAY ? '#A8D8A4' : NIGHT ? '#2F2A62' : '#A86A8C'}"/>`;

    // ------------------------------------------------------------------ mid: Ferris wheel, drop tower, big top, hedge
    const HX = 1280, HY = 380, R = 330, R2 = 294;
    const frame = T('#F7EEFF'), frameDk = T('#C7B3E6');
    let mid = `<defs>${glow(u + 'warm', '#FFC873')}${lg(u + 'cone', [[0, '#FFFFFF', 0.28], [0.45, '#FFFFFF', 0], [1, '#2A1840', 0.28]], 0, 0, 1, 0)}${lg(u + 'body', [[0, '#FFFFFF', 0.3], [0.5, '#FFFFFF', 0], [1, '#2A1840', 0.22]], 0, 0, 1, 1)}</defs>`;
    // big top tent
    {
      const X = 2110, ap = 450, ev = 630, W = 210;
      let a = '', b = '', st = '';
      for (let k = 0; k < 10; k++) {
        const p1 = pol(X, ev, W, 180 - k * 18), p2 = pol(X, ev, W, 162 - k * 18);
        p1[1] = f(ev + (p1[1] - ev) * 0.1); p2[1] = f(ev + (p2[1] - ev) * 0.1);
        if (k % 2) a += `M${X} ${ap}L${p1}L${p2}Z`; else b += `M${X} ${ap}L${p1}L${p2}Z`;
      }
      for (let x = X - 190; x < X + 190; x += 76) st += `M${x} 650h38v150h-38Z`;
      const edge = `M${X - W} ${ev}A${W} 21 0 0 0 ${X + W} ${ev}`;
      mid += `<rect x="${X - 190}" y="640" width="380" height="160" fill="${T(C.cream)}"/><path d="${st}" fill="${T(C.rose)}"/>
        <path d="M${X - 46} 800V720Q${X} 660 ${X + 46} 720V800Z" fill="${T('#5A2E5E')}"/>
        <path d="${a}" fill="${T(C.rose)}"/><path d="${b}" fill="${T(C.cream)}"/><path d="M${X} ${ap}L${X - W} ${ev}A${W} 21 0 0 0 ${X + W} ${ev}Z" fill="url(#${u}cone)"/>
        <path d="M${X} ${ap}V${ap - 60}" stroke="${T(C.gold)}" stroke-width="6"/><path d="M${X} ${ap - 60}l44 12l-44 12Z" fill="${T(C.lemon)}"/>`;
      if (lit) mid += bulbs(edge, BULB, 16, 9, true);
    }
    // drop tower
    mid += `<rect x="1728" y="170" width="30" height="630" rx="12" fill="${frameDk}"/><rect x="1734" y="180" width="8" height="610" rx="4" fill="#fff" opacity=".25"/>
      <rect x="1706" y="146" width="74" height="40" rx="16" fill="${T(C.lilac)}"/><circle cx="1743" cy="136" r="10" fill="${lit ? '#FF7A8A' : T(C.rose)}"/>`;
    if (lit) mid += `<circle cx="1743" cy="136" r="40" fill="url(#${u}warm)" opacity="${glowOp(1)}"/>` + bulbs('M1743 210V760', ['#FFE58A'], 28, 8);
    mid += `<g class="amusement-drop"><rect x="1682" y="628" width="122" height="44" rx="18" fill="${T(C.lemon)}"/><rect x="1682" y="656" width="122" height="16" rx="8" fill="${T(C.coral)}"/>
      ${['#6A4A5A', '#E0A060', '#3A2A30', '#B06A4A'].map((c, i) => `<circle cx="${1700 + i * 29}" cy="622" r="10" fill="${T(c)}"/>`).join('')}</g>`;
    // Ferris wheel: back legs + back rim (static)
    mid += `<path d="M${HX} ${HY}L${HX - 160} 800M${HX} ${HY}L${HX + 160} 800" stroke="${frameDk}" stroke-width="16" stroke-linecap="round"/>
      <circle cx="${HX + 12}" cy="${HY + 8}" r="${R}" fill="none" stroke="${T('#D97BA0')}" stroke-width="10" opacity=".6"/>`;
    // the turning face; cabins counter-rotate around their pivots so they hang upright
    let sp = '', zz = '';
    for (let i = 0; i < 24; i++) { const [x1, y1] = pol(HX, HY, 44, i * 15), [x2, y2] = pol(HX, HY, R2, i * 15); sp += `M${x1} ${y1}L${x2} ${y2}`; }
    for (let k = 0; k <= 72; k++) { const [x, y] = pol(HX, HY, k % 2 ? R2 : R, k * 5); zz += (k ? 'L' : 'M') + x + ' ' + y; }
    mid += `<defs><path id="${u}sp" d="${sp}"/><g id="${u}cab">${lit ? `<circle cy="48" r="64" fill="url(#${u}warm)" opacity="${glowOp(0.7)}"/>` : ''}
        <path d="M0 0v18" stroke="${frameDk}" stroke-width="5"/><path d="M-30 28Q0 2 30 28Z" fill="${T(C.cream)}"/>
        <rect x="-33" y="22" width="66" height="54" rx="19" fill="currentColor"/><rect x="-33" y="22" width="66" height="54" rx="19" fill="url(#${u}body)"/>
        <rect x="-23" y="32" width="46" height="24" rx="9" fill="${WIN}"/><path d="M-15 36l-6 16" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".45"/>
        <rect x="-33" y="62" width="66" height="7" rx="3.5" fill="#000" opacity=".14"/></g></defs>
      <g class="amusement-wheel" style="transform-origin:${HX}px ${HY}px">
      <circle cx="${HX}" cy="${HY}" r="160" fill="none" stroke="${frame}" stroke-width="5" opacity=".8"/>
      <use href="#${u}sp" stroke="${frame}" stroke-width="6"/>
      <path d="${zz}" stroke="${frame}" stroke-width="4" fill="none" stroke-linejoin="round"/>
      <circle cx="${HX}" cy="${HY}" r="${R2}" fill="none" stroke="${frame}" stroke-width="9"/>
      <circle cx="${HX}" cy="${HY}" r="${R}" fill="none" stroke="${T(C.pink)}" stroke-width="18"/>
      <circle cx="${HX - 3}" cy="${HY - 4}" r="${R}" fill="none" stroke="#fff" stroke-width="4" opacity=".35"/>`;
    if (lit) mid += `<use href="#${u}sp" stroke="#FFE7A6" stroke-width="7" stroke-dasharray="0 23" stroke-linecap="round" opacity="${glowOp(0.9)}"/>`;
    mid += bulbs(`M${HX - R} ${HY}a${R} ${R} 0 1 0 ${2 * R} 0a${R} ${R} 0 1 0 ${-2 * R} 0`, BULB2, (Math.PI * R / 36).toFixed(2), 11, true);
    mid += `<circle cx="${HX}" cy="${HY}" r="54" fill="${T(C.gold)}"/><circle cx="${HX}" cy="${HY}" r="38" fill="${T(C.rose)}"/>
      <circle cx="${HX}" cy="${HY}" r="46" fill="none" stroke="${T(C.cream)}" stroke-width="7" stroke-dasharray="0 24.1" stroke-linecap="round"/>`;
    const cabC = [C.pink, C.mint, C.lemon, C.sky, C.lilac, C.coral];
    for (let i = 0; i < 12; i++) {
      const [px, py] = pol(HX, HY, R, i * 30 + 15);
      mid += `<circle cx="${px}" cy="${py}" r="7" fill="${T(C.gold)}"/><g class="amusement-cab" style="transform-origin:${px}px ${py}px;color:${T(cabC[i % 6])}"><use href="#${u}cab" x="${px}" y="${py}"/></g>`;
    }
    mid += `</g>
      <path d="M${HX} ${HY}L${HX - 215} 800M${HX} ${HY}L${HX + 215} 800M${HX - 153} 670H${HX + 153}" stroke="${frame}" stroke-width="22" stroke-linecap="round"/>
      <path d="M${HX - 8} ${HY + 20}L${HX - 215} 790" stroke="#fff" stroke-width="5" opacity=".4" stroke-linecap="round"/>
      <circle cx="${HX}" cy="${HY}" r="20" fill="${T(C.gold)}"/><circle cx="${HX - 5}" cy="${HY - 5}" r="7" fill="#fff" opacity=".5"/>`;
    // hedge with little flowers
    let hedge = 'M-20 830V770';
    for (let x = -20; x < 2440; x += 70) hedge += `a35 ${24 + (x % 4) * 4} 0 0 1 70 0`;
    mid += `<path d="${hedge}V830Z" fill="${T('#6DBE78')}"/><rect y="786" width="2400" height="44" fill="${T('#58A865')}"/>
      ${[[762, 97, '#FFB3C8'], [778, 131, '#FFF1A8'], [794, 113, '#FFFFFF']].map(([y, g, c]) => `<path d="M0 ${y}H2400" stroke="${T(c)}" stroke-width="10" stroke-linecap="round" stroke-dasharray="0 ${g}"/>`).join('')}`;

    // ------------------------------------------------------------------ near: ground, carousel, cart, lamp posts, sign, booth
    let near = `<defs>${lg(u + 'ground', DAY ? [[0, '#F7DCC6'], [1, '#EABFA2']] : NIGHT ? [[0, '#46366E'], [1, '#261E42']] : [[0, '#E9B3A4'], [1, '#B98089']])}
      ${lg(u + 'sign', [[0, T('#FF8FB8')], [1, T('#E0558A')]])}${lg(u + 'booth', [[0, T('#A6E9D6')], [1, T('#6CC7B0')]])}</defs>
      <rect y="790" width="2400" height="210" fill="url(#${u}ground)"/><rect y="786" width="2400" height="10" fill="${T('#C98E86')}"/>`;
    let joints = '';
    [[830, 34, 150], [874, 44, 180], [930, 56, 220]].forEach(([y, h, step], k) => {
      joints += `M0 ${y}H2400`;
      for (let x = (k % 2) * step / 2; x < 2400; x += step) joints += `M${x} ${y}v${h}`;
    });
    near += `<path d="${joints}" stroke="${T('#C99486')}" stroke-width="3" opacity=".45"/>`;
    const conf = ['', '', '', ''];
    for (let i = 0; i < 44; i++) conf[i % 4] += `M${f(r() * 2400)} ${f(800 + r() * 190)}h${f(6 + r() * 5)}v5h-8Z`;
    near += conf.map((d, i) => `<path d="${d}" fill="${T([C.pink, C.lemon, C.mint, C.lilac][i])}" opacity=".85"/>`).join('');
    if (lit) [[520, 800, 360], [1930, 806, 220], [985, 812, 160], [1415, 812, 160]].forEach(([x, y, w]) => { near += `<ellipse cx="${x}" cy="${y}" rx="${w}" ry="${f(w * 0.14)}" fill="url(#${u}warm)" opacity="${glowOp(0.7)}"/>`; });

    // carousel
    {
      const X = 520, ap = 312, ev = 478, W = 262;
      near += `<ellipse cx="${X}" cy="814" rx="280" ry="18" fill="#000" opacity=".15"/>
        <ellipse cx="${X}" cy="798" rx="252" ry="26" fill="${T('#C9719A')}"/><ellipse cx="${X}" cy="786" rx="252" ry="24" fill="${T('#FFD1DF')}"/>
        <path d="M${X - 222} 500H${X + 222}V768Q${X} 796 ${X - 222} 768Z" fill="${T('#9C6FA8')}"/>
        ${lit ? `<ellipse cx="${X}" cy="640" rx="240" ry="150" fill="url(#${u}warm)" opacity="${glowOp(0.8)}"/>` : ''}
        <rect x="${X - 36}" y="500" width="72" height="276" fill="${T(C.gold)}"/>
        <path d="M${X - 24} 542v60q0 12 12 12h24q12 0 12 -12v-60q0 -12 -12 -12h-24q-12 0 -12 12Zm0 110v60q0 12 12 12h24q12 0 12 -12v-60q0 -12 -12 -12h-24q-12 0 -12 12Z" fill="${lit ? '#FFF1C4' : T('#FFF8EC')}" opacity=".9"/>
        <rect x="${X - 36}" y="500" width="72" height="276" fill="url(#${u}body)"/>
        <defs><g id="${u}horse">
          <path d="M-32 16l-18 28M-18 20l-4 34M26 16l14 30M38 10l26 20" stroke="currentColor" stroke-width="10" stroke-linecap="round"/>
          <path d="M44 -8q30 -4 34 30q-16 -12 -34 -16Z" fill="${T(C.rose)}"/>
          <ellipse rx="50" ry="27" fill="currentColor"/>
          <path d="M-26 -8Q-40 -44 -58 -54Q-80 -58 -84 -42Q-80 -30 -62 -28Q-52 -12 -34 14Z" fill="currentColor"/>
          <path d="M-56 -56q10 -10 22 6q10 16 8 36q-12 -20 -30 -30Z" fill="${T(C.rose)}"/>
          <path d="M-18 -24q18 -10 36 0v16q-18 8 -36 0Z" fill="${T(C.sky)}"/>
          <ellipse cx="-10" cy="-12" rx="26" ry="8" fill="#fff" opacity=".35"/><circle cx="-66" cy="-44" r="3.5" fill="#3A2A30"/>
        </g></defs>`;
      [[X - 160, '#FFF6EC', 0], [X + 20, '#CDEFE3', -0.8], [X + 176, '#E6DAFF', -0.4]].forEach(([x, col, d]) => {
        near += `<path d="M${x} 500V784" stroke="${T(C.gold)}" stroke-width="8"/><path d="M${x} 500V784" stroke="#fff" stroke-width="8" stroke-dasharray="6 12" opacity=".5"/>
          <g class="amusement-horse" style="color:${T(col)};animation-delay:${d}s"><use href="#${u}horse" x="${x}" y="650"/></g>`;
      });
      // striped canopy, scalloped valance, bulbs
      let a = '', b = '', s1 = '', s2 = '';
      const pts = [];
      for (let k = 0; k <= 14; k++) { const t = Math.PI * (1 - k / 14); pts.push([f(X + W * Math.cos(t)), f(ev + 28 * Math.sin(t))]); }
      for (let k = 0; k < 14; k++) {
        const [x1, y1] = pts[k], [x2, y2] = pts[k + 1], rr = f(Math.hypot(x2 - x1, y2 - y1) / 2);
        const seg = `M${X} ${ap}L${x1} ${y1}L${x2} ${y2}Z`, sc2 = `M${x1} ${y1 + 8}A${rr} ${rr} 0 0 0 ${x2} ${y2 + 8}Z`;
        if (k % 2) { a += seg; s1 += sc2; } else { b += seg; s2 += sc2; }
      }
      const edge = `M${pts[0]}A${W} 28 0 0 0 ${pts[14]}`;
      near += `<path d="${b}" fill="${T(C.cream)}"/><path d="${a}" fill="${T(C.pink)}"/><path d="M${X} ${ap}L${pts[0]}A${W} 28 0 0 0 ${pts[14]}Z" fill="url(#${u}cone)"/>
        <path d="${s1}" fill="${T(C.lemon)}"/><path d="${s2}" fill="${T(C.rose)}"/>
        <path d="${edge}" stroke="${T(C.gold)}" stroke-width="16" fill="none"/>
        <circle cx="${X}" cy="${ap}" r="16" fill="${T(C.gold)}"/><path d="M${X} ${ap - 10}V${ap - 64}" stroke="${T(C.gold)}" stroke-width="6"/><path d="M${X} ${ap - 64}l42 12l-42 12Z" fill="${T(C.rose)}"/>`;
      near += bulbs(edge, BULB, 17, 10, true) + bulbs(`M${X} ${ap + 14}L${pts[0]}M${X} ${ap + 14}L${pts[14]}`, ['#FFE58A'], 26, 8);
    }

    // balloon / cotton-candy cart
    {
      const X = 870;
      let st = '';
      for (let x = X - 80; x < X + 80; x += 32) st += `M${x} 700h16v70h-16Z`;
      near += `<ellipse cx="${X}" cy="812" rx="110" ry="10" fill="#000" opacity=".15"/>
        <path d="M${X + 76} 704l40 -12" stroke="${T('#8A6A5A')}" stroke-width="7" stroke-linecap="round"/>
        <rect x="${X - 84}" y="690" width="168" height="90" rx="16" fill="${T(C.sky)}"/><path d="${st}" fill="#fff" opacity=".45"/>
        <rect x="${X - 84}" y="690" width="168" height="90" rx="16" fill="url(#${u}body)"/><rect x="${X - 92}" y="680" width="184" height="16" rx="8" fill="${T(C.cream)}"/>
        ${[-46, 46].map((dx) => `<circle cx="${X + dx}" cy="786" r="22" fill="${T('#6A5A7A')}"/><circle cx="${X + dx}" cy="786" r="9" fill="${T(C.gold)}"/>`).join('')}
        <path d="M${X - 70} 680V560" stroke="${T('#EDE3FF')}" stroke-width="6"/>
        <path d="M${X - 170} 574Q${X - 70} 480 ${X + 30} 574Z" fill="${T(C.pink)}"/><path d="M${X - 104} 574Q${X - 70} 490 ${X - 36} 574Z" fill="${T(C.cream)}"/>`;
      [[X - 20, '#FFB3D1', 604], [X + 14, '#C9B8FF', 616], [X + 46, '#A8E6FF', 608]].forEach(([x, c, y]) => {
        near += `<path d="M${x} ${y + 20}V682" stroke="#F4E6D0" stroke-width="4"/><g fill="${T(c)}"><circle cx="${x - 10}" cy="${y + 4}" r="15"/><circle cx="${x + 9}" cy="${y + 2}" r="16"/><circle cx="${x}" cy="${y - 12}" r="16"/></g><circle cx="${x - 4}" cy="${y - 14}" r="6" fill="#fff" opacity=".5"/>`;
      });
      const bl = [[X - 10, 420, C.rose], [X + 44, 400, C.lemon], [X + 90, 440, C.mint], [X + 22, 460, C.sky], [X - 44, 470, C.lilac], [X + 70, 494, C.coral]];
      const bc = (c) => NIGHT ? mix(c, '#2A2458', 0.25) : T(c);   // balloons catch the light, so grade them less
      near += `<g class="amusement-bunch"><path d="${bl.map(([x, y]) => `M${X + 60} 684Q${f((x + X + 60) / 2 + 10)} ${f((y + 684) / 2)} ${x} ${y + 36}`).join('')}" stroke="#F4E6D0" stroke-width="2.5" fill="none"/>` +
        bl.map(([x, y, c]) => `<ellipse cx="${x}" cy="${y}" rx="28" ry="34" fill="${bc(c)}"/><path d="M${x - 5} ${y + 40}h10l-5 -8Z" fill="${bc(c)}"/><ellipse cx="${x - 9}" cy="${y - 12}" rx="7" ry="11" fill="#fff" opacity=".45"/>`).join('') + '</g>';
    }

    // lamp posts and the bulb strings between them (above the couple's heads)
    const post = (x) => `<rect x="${x - 7}" y="300" width="14" height="500" rx="6" fill="${T('#6E5A8E')}"/><rect x="${x - 16}" y="770" width="32" height="30" rx="8" fill="${T('#6E5A8E')}"/>
      ${lit ? `<circle cx="${x}" cy="292" r="56" fill="url(#${u}warm)" opacity="${glowOp(1)}"/>` : ''}<circle cx="${x}" cy="292" r="16" fill="${lit ? '#FFF1C4' : T('#FFFBF0')}"/><path d="M${x - 14} 280q14 -18 28 0Z" fill="${T('#6E5A8E')}"/>`;
    const str = (x1, y1, x2, y2, sag) => `M${x1} ${y1}Q${f((x1 + x2) / 2)} ${f((y1 + y2) / 2 + sag * 2)} ${x2} ${y2}`;
    const strings = str(520, 300, 985, 300, 60) + str(985, 300, 1415, 300, 128) + str(1415, 300, 1930, 470, 50);
    near += `<path d="${strings}" stroke="${T('#4A3A5E')}" stroke-width="3" fill="none"/>` + bulbs(strings, BULB, 22, 11, true) + post(985) + post(1415);

    // entrance sign
    const name = label(sc, 'name', '游乐园', 'Funland');
    if (name) {
      const X = 1640, fs = 58, fit = textW(name) * fs > 236 ? ' textLength="236" lengthAdjust="spacingAndGlyphs"' : '';
      const pp = `M${X - 118} 800V520M${X + 118} 800V520`;
      near += `<path d="${pp}" stroke="${T(C.cream)}" stroke-width="18" stroke-linecap="round"/><path d="${pp}" stroke="${T(C.rose)}" stroke-width="18" stroke-dasharray="12 14"/>
        <ellipse cx="${X}" cy="812" rx="170" ry="9" fill="#000" opacity=".12"/>
        <path d="M${X - 150} 548V468Q${X} 372 ${X + 150} 468V548Q${X} 564 ${X - 150} 548Z" fill="url(#${u}sign)"/><path d="M${X - 132} 540V474Q${X} 392 ${X + 132} 474V540Q${X} 552 ${X - 132} 540Z" fill="${T('#5A2A6A')}"/>`;
      near += bulbs(`M${X - 142} 546V470Q${X} 380 ${X + 142} 470V546`, BULB2, 16, 9, true);
      near += `<path d="M${X} 356l9 18l20 3l-15 14l4 20l-18 -10l-18 10l4 -20l-15 -14l20 -3Z" fill="${T(C.lemon)}"/>
        <text x="${X + 3}" y="534" text-anchor="middle" class="svg-hand" font-size="${fs}" fill="#2A1638" opacity=".5"${fit}>${esc(name)}</text>
        <text x="${X}" y="530" text-anchor="middle" class="svg-hand" font-size="${fs}" fill="${lit ? '#FFF0B8' : '#FFE9A8'}"${fit}>${esc(name)}</text>`;
    }

    // ticket booth
    {
      const X = 1930;
      let st = '';
      for (let x = X - 78; x < X + 78; x += 26) st += `M${x} 712h13v84h-13Z`;
      near += `<ellipse cx="${X}" cy="810" rx="120" ry="10" fill="#000" opacity=".15"/>
        <rect x="${X - 80}" y="596" width="160" height="204" rx="16" fill="url(#${u}booth)"/><path d="${st}" fill="${T(C.cream)}" opacity=".7"/>
        <rect x="${X - 58}" y="622" width="116" height="74" rx="14" fill="${WIN}"/>
        ${lit ? `<circle cx="${X}" cy="660" r="90" fill="url(#${u}warm)" opacity="${glowOp(1)}"/>` : `<path d="M${X - 40} 632l-12 40" stroke="#fff" stroke-width="8" opacity=".5" stroke-linecap="round"/>`}
        <circle cx="${X + 14}" cy="672" r="17" fill="#FFD6BE"/><path d="M${X - 4} 668q18 -24 36 0q-18 -8 -36 0Z" fill="#5A3A3A"/><circle cx="${X + 8}" cy="676" r="2.5" fill="#3A2A30"/>
        <rect x="${X - 70}" y="690" width="140" height="14" rx="7" fill="${T(C.gold)}"/>
        <path d="M${X - 104} 606Q${X - 40} 584 ${X} 480Q${X + 40} 584 ${X + 104} 606Z" fill="${T(C.rose)}"/><path d="M${X - 36} 606Q${X - 8} 572 ${X} 480Q${X + 8} 572 ${X + 36} 606Z" fill="${T(C.cream)}"/>
        <path d="M${X - 104} 600${'a17.3 14 0 0 0 34.6 0'.repeat(6)}Z" fill="${T(C.lemon)}"/>
        <path d="M${X} 482V440" stroke="${T(C.gold)}" stroke-width="5"/><path d="M${X} 440l34 10l-34 10Z" fill="${T(C.mint)}"/>`;
      const tk = label(sc, 'tickets', '售票', 'Tickets');
      if (tk) near += `<rect x="${X - 66}" y="546" width="132" height="44" rx="14" fill="${T('#5A2A6A')}"/><rect x="${X - 60}" y="551" width="120" height="34" rx="11" fill="none" stroke="${T(C.lemon)}" stroke-width="2.5" stroke-dasharray="5 6"/>
          <text x="${X}" y="578" text-anchor="middle" class="svg-hand" font-size="28" fill="${lit ? '#FFF0B8' : '#FFE9A8'}"${textW(tk) * 28 > 108 ? ' textLength="108" lengthAdjust="spacingAndGlyphs"' : ''}>${esc(tk)}</text>`;
    }

    // balloons that got away
    const nearExtras = [C.rose, C.lemon, C.sky].map((c, i) => Object.assign(
      fx(800 + i * 60, 520 + i * 20, 50, 96, 'amusement-rise', `<path d="M25 64q-6 14 3 32" stroke="#F4E6D0" stroke-width="2" fill="none"/><ellipse cx="25" cy="30" rx="22" ry="28" fill="${T(c)}"/><path d="M21 58h8l-4 -6Z" fill="${T(c)}"/><ellipse cx="17" cy="20" rx="6" ry="9" fill="#fff" opacity=".45"/>`),
      { style: `animation-delay:${-i * 5.7}s` }));

    // ------------------------------------------------------------------ front: low bushes at the edges
    const bush = (x, y, s) => `<g><ellipse cx="${x}" cy="${f(y + 50 * s)}" rx="${f(150 * s)}" ry="${f(16 * s)}" fill="#000" opacity=".15"/>
      <g fill="${T('#4FA066')}"><circle cx="${f(x - 70 * s)}" cy="${y}" r="${f(62 * s)}"/><circle cx="${f(x + 60 * s)}" cy="${f(y + 4 * s)}" r="${f(66 * s)}"/></g>
      <circle cx="${x}" cy="${f(y - 30 * s)}" r="${f(78 * s)}" fill="${T('#65B777')}"/><circle cx="${f(x - 20 * s)}" cy="${f(y - 60 * s)}" r="${f(24 * s)}" fill="#fff" opacity=".18"/>
      ${[[-60, -20], [10, -70], [70, -10], [-10, 10], [40, -40]].map(([dx, dy], i) => `<circle cx="${f(x + dx * s)}" cy="${f(y + dy * s)}" r="${f(8 * s)}" fill="${T(['#FFB3C8', '#FFF1A8', '#FFFFFF'][i % 3])}"/>`).join('')}</g>`;
    const front = bush(260, 950, 1.1) + bush(2160, 960, 1.2) + bush(560, 1000, 0.8) + bush(1880, 1004, 0.8);

    return {
      sky: NIGHT ? 'linear-gradient(180deg, #141A4A 0%, #272463 34%, #45307C 60%, #74407F 84%, #9E5584 100%)'
        : DAY ? 'linear-gradient(180deg, #62BDF0 0%, #97D3F6 42%, #CFEEFA 72%, #FFF4E0 100%)'
          : 'linear-gradient(180deg, #5A4C98 0%, #A95C98 30%, #EE8680 58%, #FFBE7C 82%, #FFE0A8 100%)',
      layers: [
        { depth: 0.05, svg: sky, extras: skyExtras },
        { depth: 0.15, svg: far },
        { depth: 0.4, svg: mid },
        { depth: 1, svg: near, extras: nearExtras },
        { depth: 1.35, svg: front, front: true },
      ],
    };
  }

  TripArt.scenes.amusement = amusement;
})();
