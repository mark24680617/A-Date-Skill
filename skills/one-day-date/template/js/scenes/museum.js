/*
 * 美术馆 — an art gallery: cream walls, a rose feature wall with the big swirly
 * painting right behind the couple, ceiling skylights, track spotlights, a
 * sculpture on a plinth, a long bench and velvet ropes.
 * Moods: 'day' (skylight daylight) | 'sunset' (golden light) | 'night' (museum night).
 * Labels: name (exhibition banner, hidden when empty), plaque (text on the big painting's label).
 */
(function () {
  'use strict';
  const { rng, lg, rg, glow, cloud, fx, label, css, esc, moodOf } = TripArt.h;

  const CSS = `
.museum-mote { opacity: 0; }
.is-here .museum-mote { animation: museum-mote 9s ease-in-out infinite; }
@keyframes museum-mote { 0%, 100% { opacity: 0; transform: translate(0, 0); } 30%, 70% { opacity: .9; } 50% { transform: translate(-60%, 150%); } }
.is-here .museum-cone { animation: museum-cone 8s ease-in-out infinite; }
@keyframes museum-cone { 0%, 40%, 100% { opacity: 1; } 44% { opacity: .78; } 46% { opacity: 1; } 48% { opacity: .86; } 50% { opacity: 1; } 70% { opacity: .92; } }
.is-here .museum-cloud { animation: museum-cloud 34s ease-in-out infinite alternate; }
@keyframes museum-cloud { from { transform: translateX(-50px); } to { transform: translateX(70px); } }
.is-here .museum-star { animation: museum-star 2.8s ease-in-out infinite; }
@keyframes museum-star { 0%, 100% { opacity: 1; } 50% { opacity: .25; } }
.is-here .museum-banner { animation: museum-banner 7s ease-in-out infinite; }
@keyframes museum-banner { 0%, 100% { transform: rotate(-.7deg); } 50% { transform: rotate(.7deg); } }
.is-here .museum-led { animation: museum-led 2.2s steps(1) infinite; }
@keyframes museum-led { 0%, 100% { opacity: 1; } 50% { opacity: .15; } }
@media (prefers-reduced-motion: reduce) {
  .museum-mote, .museum-cone, .museum-cloud, .museum-star, .museum-banner, .museum-led { animation: none !important; }
}`;

  // Centred hand-lettered text squeezed to fit maxW.
  function fitText(t, x, y, maxW, fs, fill) {
    const em = [...t].reduce((a, c) => a + (/[⺀-￿]/.test(c) ? 1 : 0.56), 0);
    const size = em * fs > maxW * 1.5 ? Math.round(fs * 0.8) : fs;
    const fit = em * size > maxW ? ` textLength="${maxW}" lengthAdjust="spacingAndGlyphs"` : '';
    return `<text x="${x}" y="${y}" text-anchor="middle" class="svg-hand" font-size="${size}" fill="${fill}"${fit}>${esc(t)}</text>`;
  }

  // Spiral of half-circle arcs starting at (cx, cy), growing by s each half turn.
  function spiral(cx, cy, s, n) {
    let d = `M${cx} ${cy}`, x = cx;
    for (let i = 1; i <= n; i++) {
      const nx = i % 2 ? cx + Math.ceil(i / 2) * s : cx - (i / 2) * s;
      const rad = Math.abs(nx - x) / 2;
      d += ` A${rad} ${rad} 0 0 1 ${nx} ${cy}`;
      x = nx;
    }
    return d;
  }

  function museum(u, sc = {}) {
    css('museum', CSS);
    const mood = moodOf(sc, 'day');
    const N = mood === 'night', S = mood === 'sunset';
    const k = (d, s, n) => (N ? n : S ? s : d);
    const r = rng(97);
    const P = {
      wall: k(['#FFF8EB', '#F0DBBE'], ['#FFE8D0', '#F2C69F'], ['#4A4472', '#34305A']),
      part: k(['#F4D4C5', '#E8BBA7'], ['#F2BDA3', '#DF997C'], ['#5E4270', '#46305A']),
      partSide: k('#FBE6DB', '#F9D3BD', '#735690'),
      ceil: k('#EEDCC1', '#F1CFAE', '#2A2648'),
      rim: k('#FFFDF8', '#FFF0DE', '#4E4878'),
      well: k('#FFFFFF', '#FFE7C8', '#3E3970'),
      sky: k([[0, '#5FAFEE'], [1, '#C6E7FB']], [[0, '#D5709F'], [0.55, '#FF9C78'], [1, '#FFD28A']], [[0, '#0A1236'], [1, '#2A3A82']]),
      shaft: k('#FFFFFF', '#FFC266', '#A8C0FF'), shaftOp: k(0.6, 0.55, 0.14), shaftDx: k(90, 250, 30),
      spot: k('#FFF1CC', '#FFE0A0', '#FFD58A'), coneOp: k(0.24, 0.26, 0.5), washOp: k(0.55, 0.5, 0.8),
      floor: k([[0, '#EDC899'], [1, '#CC925E']], [[0, '#E7AA72'], [1, '#B06C3C']], [[0, '#57405A'], [1, '#261C32']]),
      seam: k('#B47C4C', '#94552F', '#140F1E'),
      base: k('#FFFFFF', '#FFF0E0', '#5A5286'),
      track: k('#6A5D55', '#6C4F46', '#171430'),
      sh: k(0.13, 0.15, 0.32),
      plq: k('#FFFDF6', '#FFF6EA', '#E2DAEE'),
      marble: k(['#FFFFFF', '#DCD6E3'], ['#FFF4EA', '#E9CDBE'], ['#A49ECB', '#6C6596']),
      marbleD: k('#E6E1EC', '#EFD6C8', '#857EAE'),
      brass: k([[0, '#FFE7A6'], [0.5, '#D9A441'], [1, '#9C6A22']], [[0, '#FFE2A0'], [0.5, '#D99A3E'], [1, '#95601E']], [[0, '#E8C27A'], [0.5, '#A87A34'], [1, '#5E4020']]),
      wood: k(['#E9BE8A', '#C48850'], ['#E6B27C', '#B87A44'], ['#A8845E', '#6E5038']),
    };

    // ------------------------------------------------------------ far: wall, skylights, art
    const SKY = [240, 920, 1600], SW = 560;
    const ART = [ // spotlit things on the wall: [head x, cone bottom-left, cone bottom-right, cone bottom y, wash cx, cy, rx, ry]
      [550, 400, 700, 585, 550, 485, 200, 150],
      [820, 740, 900, 600, 820, 520, 120, 130],
      [1100, 960, 1270, 655, 1200, 490, 330, 250],
      [1300, 1130, 1440, 655, 1200, 490, 330, 250],
      [1640, 1540, 1740, 590, 1640, 474, 140, 160],
      [1970, 1850, 2090, 610, 1970, 485, 170, 170],
      [2220, 2140, 2300, 550, 2220, 480, 110, 110],
    ];
    let far = `<defs>
      ${lg(u + 'wall', [[0, P.wall[0]], [1, P.wall[1]]])}
      ${lg(u + 'part', [[0, P.part[0]], [1, P.part[1]]])}
      ${lg(u + 'topsh', [[0, '#8A5A2A', 0.1], [1, '#8A5A2A', 0]])}
      ${lg(u + 'psh', [[0, '#000', 0.12], [1, '#000', 0]], 0, 0, 1, 0)}
      ${lg(u + 'sky', P.sky)}
      ${lg(u + 'shaft', [[0, P.shaft, P.shaftOp], [0.75, P.shaft, P.shaftOp * 0.25], [1, P.shaft, 0]])}
      ${lg(u + 'cone', [[0, P.spot, P.coneOp], [1, P.spot, 0.02]])}
      ${rg(u + 'wash', [[0, P.spot, P.washOp], [0.6, P.spot, P.washOp * 0.35], [1, P.spot, 0]])}
      ${lg(u + 'gold', [[0, '#FFE8A8'], [0.45, '#E9B558'], [1, '#C4832F']], 0, 0, 1, 1)}
      ${lg(u + 'wood', P.wood.map((c, i) => [i, c]), 0, 0, 1, 1)}
      ${lg(u + 'swirl', [[0, '#465FBE'], [0.5, '#7890E2'], [0.78, '#BDC3F0'], [1, '#F7C9D4']])}
      ${lg(u + 'land', [[0, '#FFB3C4'], [1, '#FFE6C4']])}
      ${lg(u + 'door', k([[0, '#E9D3B5'], [1, '#DCC19C']], [[0, '#E8B58E'], [1, '#D49A70']], [[0, '#231F42'], [1, '#1A1733']]))}
      ${rg(u + 'oval', [[0, '#FFEDE6'], [1, '#F6BFC4']], 0.45, 0.4, 0.7)}
      ${glow(u + 'moon', '#FFF2C8')}
      ${glow(u + 'led', '#FF4A5A')}
      <clipPath id="${u}sk">${SKY.map(x => `<rect x="${x + 26}" y="-20" width="${SW - 52}" height="82" rx="10"/>`).join('')}</clipPath>
      <pattern id="${u}dots" x="2162.5" y="422.5" width="23" height="23" patternUnits="userSpaceOnUse"><circle cx="11.5" cy="11.5" r="4" fill="#FFC2D0"/></pattern>
      <clipPath id="${u}mc"><rect x="1012" y="348" width="376" height="282"/></clipPath>
      <clipPath id="${u}lc"><rect x="446" y="416" width="208" height="136"/></clipPath>
      <clipPath id="${u}oc"><ellipse cx="1640" cy="474" rx="66" ry="90"/></clipPath>
      <clipPath id="${u}dc"><path d="M84 780 V420 A116 116 0 0 1 316 420 V780 Z"/></clipPath>
    </defs>`;

    // wall + ceiling + cornice
    far += `<rect width="2400" height="790" fill="url(#${u}wall)"/>
      ${N ? '' : `<rect y="128" width="2400" height="520" fill="url(#${u}topsh)"/>`}
      <rect width="2400" height="128" fill="${P.ceil}"/><rect y="118" width="2400" height="10" fill="#000" opacity=".05"/>
      <rect y="120" width="2400" height="18" fill="${P.rim}"/><rect y="138" width="2400" height="8" fill="#000" opacity=".06"/>`;
    // skylights: wells, glass with sky, mullions
    far += SKY.map(x => `<rect x="${x}" y="-24" width="${SW}" height="114" rx="22" fill="${P.well}"/>
      <path d="M${x + 12} 90 L${x + 38} 62 H${x + SW - 38} L${x + SW - 12} 90 Z" fill="#000" opacity=".06"/>`).join('');
    far += `<g clip-path="url(#${u}sk)"><rect x="0" y="-20" width="2400" height="82" fill="url(#${u}sky)"/>`;
    if (N) {
      far += [...Array(36)].map((_, i) => {
        const x = SKY[i % 3] + 30 + r() * (SW - 60), y = -10 + r() * 66;
        return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1 + r() * 2.2).toFixed(1)}" fill="#fff"${i % 4 ? ` opacity="${(0.5 + r() * 0.5).toFixed(2)}"` : ` class="museum-star" style="animation-delay:${(-r() * 3).toFixed(1)}s"`}/>`;
      }).join('');
      far += `<circle cx="1330" cy="24" r="70" fill="url(#${u}moon)"/><circle cx="1330" cy="24" r="22" fill="#FFF4CF"/><circle cx="1322" cy="18" r="5" fill="#EDE0B8" opacity=".7"/><circle cx="1338" cy="32" r="3.5" fill="#EDE0B8" opacity=".6"/>`;
    } else {
      const cc = S ? '#FFD4DE' : '#FFFFFF';
      far += `<g class="museum-cloud">${[[300, 34, 0.42], [620, 18, 0.34], [990, 40, 0.46], [1300, 14, 0.3], [1680, 36, 0.4], [1980, 20, 0.36]].map(([x, y, s]) => cloud(x, y, s, cc, S ? 0.85 : 0.95)).join('')}</g>`;
      if (S) far += `<circle cx="1860" cy="58" r="60" fill="url(#${u}moon)" opacity=".7"/>`;
    }
    far += `</g>`;
    far += SKY.map(x => [1, 2, 3].map(i => `<rect x="${x + 22 + i * (SW - 52) / 4}" y="-20" width="8" height="82" fill="${P.well}"/>`).join('') +
      `<rect x="${x + 26}" y="24" width="${SW - 52}" height="6" fill="${P.well}"/>`).join('');

    // feature wall behind the couple (slightly proud of the main wall)
    far += `<rect x="1520" y="146" width="44" height="644" fill="url(#${u}psh)"/>
      <rect x="900" y="146" width="620" height="644" fill="url(#${u}part)"/>
      <rect x="886" y="146" width="14" height="644" fill="${P.partSide}"/>
      <rect x="886" y="138" width="634" height="8" fill="${P.rim}"/>`;

    // doorway to the next room (far left)
    far += `<path d="M66 790 V420 A134 134 0 0 1 334 420 V790 Z" fill="${P.rim}"/>
      <g clip-path="url(#${u}dc)">
        <rect x="80" y="280" width="240" height="510" fill="url(#${u}door)"/>
        <rect x="80" y="700" width="240" height="90" fill="${k('#C99A68', '#B47446', '#1C1428')}"/>
        <rect x="80" y="694" width="240" height="8" fill="${P.base}" opacity=".7"/>
        <ellipse cx="200" cy="520" rx="90" ry="80" fill="url(#${u}wash)" opacity=".7"/>
        <rect x="150" y="470" width="100" height="84" rx="4" fill="url(#${u}gold)"/><rect x="160" y="480" width="80" height="64" fill="#8CC7B6"/>
        <circle cx="216" cy="500" r="10" fill="#FFE08A"/><path d="M160 544 L190 510 L210 530 L226 516 L240 530 V544 Z" fill="#4F8F84"/>
        <rect x="120" y="640" width="160" height="16" rx="6" fill="${k('#8FB8B6', '#8FA9A4', '#3A4A66')}"/><rect x="132" y="656" width="10" height="40" fill="${P.wood[1]}"/><rect x="258" y="656" width="10" height="40" fill="${P.wood[1]}"/>
      </g>
      <path d="M84 790 V420 A116 116 0 0 1 316 420" fill="none" stroke="#000" stroke-width="6" opacity=".06"/>`;

    // light shafts from the skylights
    far += SKY.map(x => `<path d="M${x + 36} 90 H${x + SW - 36} L${x + SW - 36 + P.shaftDx} 780 H${x + 36 + P.shaftDx} Z" fill="url(#${u}shaft)"/>`).join('');

    // soft spotlight washes on the wall
    far += ART.filter((a, i) => i !== 3).map(a => `<ellipse cx="${a[4]}" cy="${a[5]}" rx="${a[6]}" ry="${a[7]}" fill="url(#${u}wash)"/>`).join('');
    // light cones (behind the art so the paintings stay crisp)
    far += `<g class="museum-cone">${ART.map(a => `<path d="M${a[0] - 9} 196 H${a[0] + 9} L${a[2]} ${a[3]} H${a[1]} Z" fill="url(#${u}cone)"/>`).join('')}</g>`;

    const shadowRect = (x, y, w, h, rx) => `<rect x="${x + 8}" y="${y + 12}" width="${w}" height="${h}" rx="${rx}" fill="#000" opacity="${P.sh}"/>`;
    const plaque = (x, y, w, h) => `<rect x="${x + 3}" y="${y + 4}" width="${w}" height="${h}" rx="4" fill="#000" opacity="${P.sh}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4" fill="${P.plq}"/>
      ${[0.3, 0.52, 0.72].map((f, i) => `<rect x="${x + 7}" y="${y + h * f}" width="${(w - 14) * (i === 2 ? 0.55 : i ? 0.8 : 1)}" height="3" rx="1.5" fill="#B9ADA6"/>`).join('')}`;

    // --- landscape with a sun (wood frame + mat)
    far += shadowRect(420, 390, 260, 190, 8) + `<rect x="420" y="390" width="260" height="190" rx="8" fill="url(#${u}wood)"/>
      <rect x="432" y="402" width="236" height="166" fill="#FFFDF6"/>
      <g clip-path="url(#${u}lc)">
        <rect x="446" y="416" width="208" height="136" fill="url(#${u}land)"/>
        <circle cx="592" cy="478" r="32" fill="#FF8C6E"/><circle cx="584" cy="470" r="15" fill="#FFB49E" opacity=".75"/>
        ${cloud(466, 450, 0.26, '#fff', 0.9)}
        <path d="M446 504 Q500 474 560 494 T654 486 V552 H446 Z" fill="#A2D9B2"/>
        <path d="M446 530 Q520 502 600 526 T654 520 V552 H446 Z" fill="#6EBC8C"/>
        <path d="M516 552 C540 536 598 540 600 522 C602 512 580 508 566 506 L572 503 C606 507 616 516 610 528 C600 548 566 548 552 552 Z" fill="#BFE6F7"/>
        <rect x="478" y="498" width="4" height="16" fill="#8A6A4A"/><circle cx="480" cy="494" r="11" fill="#4FA074"/>
        <rect x="628" y="502" width="4" height="14" fill="#8A6A4A"/><circle cx="630" cy="498" r="9" fill="#FF9DB0"/>
      </g>` + plaque(694, 522, 46, 30);

    // --- the big swirly-sky painting behind the couple (gold frame)
    const stars = [[1040, 372], [1252, 372], [1124, 470], [1372, 474], [1262, 450]];
    far += shadowRect(990, 326, 420, 326, 12) + `<rect x="990" y="326" width="420" height="326" rx="12" fill="url(#${u}gold)"/>
      <rect x="1000" y="336" width="400" height="306" rx="6" fill="#C58A36"/>
      <rect x="1006" y="342" width="388" height="294" rx="4" fill="#FFE3A0"/>
      <g clip-path="url(#${u}mc)">
        <rect x="1012" y="348" width="376" height="282" fill="url(#${u}swirl)"/>
        <path d="M1000 392 C1040 370 1080 402 1116 384" stroke="#9FB4EE" stroke-width="12" fill="none" stroke-linecap="round" opacity=".7"/>
        <path d="M1000 470 C1060 438 1110 492 1170 462 S1290 430 1400 474" stroke="#B4C6F6" stroke-width="16" fill="none" stroke-linecap="round" opacity=".6"/>
        <path d="M1000 512 C1070 490 1130 532 1200 508 S1320 484 1400 514" stroke="#E0CDF2" stroke-width="12" fill="none" stroke-linecap="round" opacity=".55"/>
        ${['#A9BCF2', '#3E56B0', '#E6EDFF'].map((c, j) => `<path d="${[...Array(6)].map((_, i) => `M${(1016 + r() * 360).toFixed(0)} ${(356 + r() * 180).toFixed(0)}l18 ${(i + j) % 2 ? -4 : 3}`).join('')}" stroke="${c}" stroke-width="5" stroke-linecap="round" opacity=".5"/>`).join('')}
        <path d="${spiral(1176, 404, 10, 6)}" stroke="#8EA6EC" stroke-width="22" fill="none" stroke-linecap="round" opacity=".5"/>
        <path d="${spiral(1176, 404, 10, 6)}" stroke="#E8EFFF" stroke-width="8" fill="none" stroke-linecap="round" opacity=".9"/>
        <path d="${spiral(1076, 418, 7, 5)}" stroke="#8EA6EC" stroke-width="15" fill="none" stroke-linecap="round" opacity=".45"/><path d="${spiral(1076, 418, 7, 5)}" stroke="#DCE5FF" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>
        <circle cx="1318" cy="404" r="62" fill="none" stroke="#FFE7A0" stroke-width="5" stroke-dasharray="7 13" opacity=".7"/>
        <circle cx="1318" cy="404" r="48" fill="none" stroke="#FFE08A" stroke-width="7" opacity=".45"/>
        <circle cx="1318" cy="404" r="30" fill="#FFD45E"/><circle cx="1310" cy="396" r="11" fill="#FFF3C4"/>
        ${stars.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="12" fill="none" stroke="#FFE9A0" stroke-width="4" opacity=".6"/><circle cx="${x}" cy="${y}" r="5" fill="#FFE27A"/>`).join('')}
        <path d="M1012 562 Q1100 524 1190 552 T1388 540 V630 H1012 Z" fill="#8FC9B0"/>
        <path d="M1012 600 Q1120 568 1230 596 T1388 586 V630 H1012 Z" fill="#5EA98C"/>
        ${[[1150, 574], [1178, 580], [1262, 566]].map(([x, y]) => `<rect x="${x}" y="${y}" width="22" height="18" fill="#FFF3E0"/><path d="M${x - 3} ${y} L${x + 11} ${y - 12} L${x + 25} ${y} Z" fill="#E8738A"/><rect x="${x + 8}" y="${y + 5}" width="6" height="7" fill="#FFCF5A"/>`).join('')}
        <rect x="1040" y="540" width="8" height="64" fill="#8A6246"/>
        <circle cx="1044" cy="530" r="24" fill="#FF9DB6"/><circle cx="1028" cy="544" r="15" fill="#FF86A6"/><circle cx="1060" cy="546" r="15" fill="#FFB3C6"/>
        <rect x="1360" y="548" width="6" height="44" fill="#8A6246"/><circle cx="1363" cy="540" r="18" fill="#4E9C7E"/>
        <path d="M1012 348 L1130 348 L1012 470 Z" fill="#fff" opacity=".07"/>
      </g>
      ${[[996, 332], [1404, 332], [996, 646], [1404, 646]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="9" fill="#FFE9B0"/><circle cx="${x}" cy="${y}" r="4" fill="#C58A36"/>`).join('')}
      <path d="M998 338 H1300" stroke="#FFF6D8" stroke-width="3" opacity=".7" stroke-linecap="round"/>`;
    const pq = label(sc, 'plaque', '', '');
    far += `<rect x="1443" y="570" width="72" height="50" rx="5" fill="#000" opacity="${P.sh}"/><rect x="1440" y="566" width="72" height="50" rx="5" fill="${P.plq}"/>
      ${pq ? fitText(pq, 1476, 590, 60, 17, '#5A4450') + `<rect x="1449" y="598" width="54" height="3" rx="1.5" fill="#C9BDB6"/><rect x="1449" y="605" width="34" height="3" rx="1.5" fill="#C9BDB6"/>`
        : [0, 1, 2].map(i => `<rect x="1449" y="${580 + i * 10}" width="${[54, 44, 30][i]}" height="3.5" rx="1.5" fill="#B9ADA6"/>`).join('')}`;

    // --- oval portrait silhouette
    far += `<ellipse cx="1648" cy="488" rx="92" ry="116" fill="#000" opacity="${P.sh}"/>
      <ellipse cx="1640" cy="474" rx="90" ry="114" fill="url(#${u}gold)"/>
      <ellipse cx="1640" cy="474" rx="80" ry="104" fill="#C58A36"/>
      <ellipse cx="1640" cy="474" rx="74" ry="98" fill="#FFE3A0"/>
      <ellipse cx="1640" cy="474" rx="85" ry="109" fill="none" stroke="#FFF2C6" stroke-width="7" stroke-linecap="round" stroke-dasharray="0 30.6"/>
      <path d="M1612 364 Q1640 340 1668 364 Q1640 356 1612 364 Z" fill="url(#${u}gold)"/><circle cx="1640" cy="352" r="9" fill="#F2C66D"/>
      <g clip-path="url(#${u}oc)">
        <ellipse cx="1640" cy="474" rx="66" ry="90" fill="url(#${u}oval)"/>
        <g transform="translate(1636 482)" fill="#5A2E52">
          <path d="M-66 94 Q-62 58 -18 52 L-14 28 C-42 18 -46 -22 -32 -42 C-18 -62 20 -60 32 -38 C36 -28 38 -20 40 -12 L48 -1 Q45 5 40 6 Q44 10 40 13 Q44 17 39 20 Q40 28 31 31 Q20 35 14 36 L16 52 Q62 58 66 94 Z"/>
          <circle cx="-34" cy="-46" r="17"/>
          <path d="M31 -20 q5 -4 9 0" stroke="#5A2E52" stroke-width="3" fill="none" stroke-linecap="round"/>
        </g>
        <g transform="translate(1612 422)"><path d="M0 0 L-16 -10 Q-20 0 -16 10 Z M0 0 L16 -10 Q20 0 16 10 Z" fill="#FF7A98"/><circle r="5" fill="#FF5C80"/></g>
        <path d="M1600 400 Q1612 386 1630 384" stroke="#fff" stroke-width="5" fill="none" stroke-linecap="round" opacity=".35"/>
      </g>` + plaque(1744, 540, 46, 30);

    // --- bold colour blocks
    far += shadowRect(1860, 360, 220, 250, 8) + `<rect x="1860" y="360" width="220" height="250" rx="8" fill="#FFFFFF"/>
      <rect x="1874" y="374" width="192" height="222" fill="#FFF6EA"/>
      <rect x="1874" y="374" width="192" height="6" fill="#000" opacity=".05"/>
      <rect x="1888" y="388" width="100" height="104" rx="12" fill="#FF8A7A"/><circle cx="1938" cy="440" r="24" fill="#FFF1D6"/>
      <rect x="2000" y="388" width="52" height="64" rx="12" fill="#FFC857"/>
      <rect x="2000" y="464" width="52" height="118" rx="12" fill="#4FB3A9"/>
      <rect x="1888" y="504" width="62" height="78" rx="12" fill="#3F4E8C"/>
      <rect x="1962" y="504" width="26" height="78" rx="10" fill="#F7A6BA"/>
      <circle cx="2026" cy="420" r="8" fill="#fff" opacity=".5"/>` + plaque(2092, 560, 42, 28);

    // --- pop-art heart
    far += shadowRect(2150, 410, 140, 140, 10) + `<rect x="2150" y="410" width="140" height="140" rx="10" fill="#9CC9F0"/>
      <rect x="2162" y="422" width="116" height="116" rx="4" fill="#FFE3EA"/>
      <rect x="2162" y="422" width="116" height="116" fill="url(#${u}dots)"/>
      <path d="M2220 514 C2178 488 2172 458 2194 450 C2208 445 2220 456 2220 468 C2220 456 2232 445 2246 450 C2268 458 2262 488 2220 514 Z" fill="#FF4F6E"/>
      <ellipse cx="2202" cy="464" rx="8" ry="5" fill="#fff" opacity=".6" transform="rotate(-30 2202 464)"/>` + plaque(2150, 566, 42, 28);

    // track, spot heads and their light cones
    far += `<rect x="0" y="148" width="2400" height="8" rx="4" fill="${P.track}"/>
      ${[200, 700, 1200, 1700, 2200].map(x => `<rect x="${x}" y="138" width="5" height="12" fill="${P.track}"/>`).join('')}`;
    far += ART.map(a => {
      const tx = (a[1] + a[2]) / 2, ang = (-Math.atan2(tx - a[0], a[3] - 170) * 180 / Math.PI).toFixed(1);
      return `<rect x="${a[0] - 3}" y="154" width="6" height="12" fill="${P.track}"/>
        <g transform="translate(${a[0]} 166) rotate(${ang})"><rect x="-12" y="-4" width="24" height="36" rx="10" fill="${k('#F5EFE6', '#F7E4D2', '#2E2A4E')}"/>
        <rect x="-12" y="-4" width="8" height="36" rx="4" fill="#fff" opacity=".45"/><ellipse cx="0" cy="31" rx="10" ry="4" fill="${P.spot}"/></g>`;
    }).join('');

    // security camera (blinks at night)
    far += `<g><rect x="2318" y="146" width="8" height="30" fill="${P.track}"/><rect x="2290" y="170" width="62" height="30" rx="12" fill="${k('#F4F0EA', '#F6E6D6', '#3A3660')}" transform="rotate(14 2322 185)"/>
      <circle cx="2300" cy="178" r="6" fill="#2B2735" transform="rotate(14 2322 185)"/>
      ${N ? `<circle cx="2336" cy="196" r="14" fill="url(#${u}led)" class="museum-led"/>` : ''}<circle cx="2336" cy="196" r="3.5" fill="#FF4A5A"${N ? ' class="museum-led"' : ' opacity=".6"'}/></g>`;

    // exhibition banner (only with a name)
    const name = label(sc, 'name', '', '');
    if (name) {
      const bx = 1640, bw = 280, by = 196, bh = 78;
      far += `<g class="museum-banner" style="transform-box:fill-box;transform-origin:50% 0%">
        <line x1="${bx - 110}" y1="154" x2="${bx - 110}" y2="${by}" stroke="${P.track}" stroke-width="3"/><line x1="${bx + 110}" y1="154" x2="${bx + 110}" y2="${by}" stroke="${P.track}" stroke-width="3"/>
        <rect x="${bx - bw / 2 + 8}" y="${by + 10}" width="${bw}" height="${bh}" rx="8" fill="#000" opacity="${P.sh}"/>
        <rect x="${bx - bw / 2}" y="${by}" width="${bw}" height="${bh}" rx="8" fill="${k('#2F7278', '#2F6E73', '#2A6A78')}"/>
        <rect x="${bx - bw / 2 + 8}" y="${by + 8}" width="${bw - 16}" height="${bh - 16}" rx="5" fill="none" stroke="#FFE3B0" stroke-width="2" opacity=".6"/>
        <rect x="${bx - bw / 2 - 8}" y="${by - 6}" width="${bw + 16}" height="10" rx="5" fill="url(#${u}gold)"/>
        ${fitText(name, bx, by + bh / 2 + 13, bw - 44, 38, '#FFF3DC')}
      </g>`;
    }

    // dust motes floating in the spotlight cones
    const extras = [[1060, 300], [1130, 420], [1250, 260], [1330, 380], [1180, 540], [1370, 560], [1590, 330], [1700, 420], [1930, 300], [520, 330]]
      .map(([x, y], i) => {
        const e = fx(x, y, 40, 40, 'museum-mote', `<circle cx="20" cy="20" r="${i % 3 ? 3.5 : 5}" fill="${N ? '#FFE3A6' : '#FFFBEA'}"/>`);
        e.style = `animation-delay:${(-i * 1.3).toFixed(1)}s`;
        return e;
      });

    // ------------------------------------------------------------ near: floor, bench, plinth, ropes
    let near = `<defs>
      ${lg(u + 'floor', P.floor)}
      ${lg(u + 'refl', [[0, '#F2C66D', 0.9], [0.12, '#8EA2E6', 0.8], [1, '#8EA2E6', 0]])}
      ${lg(u + 'reflG', [[0, '#FFE3A0', 0.9], [1, '#FFE3A0', 0]])}
      <filter id="${u}blur" x="-10%" y="-30%" width="120%" height="160%"><feGaussianBlur stdDeviation="9"/></filter>
      ${lg(u + 'patch', [[0, P.shaft, P.shaftOp * 0.7], [1, P.shaft, 0]])}
      ${rg(u + 'pool', [[0, P.spot, k(0.4, 0.45, 0.55)], [1, P.spot, 0]])}
      ${lg(u + 'plinth', [[0, P.marble[0]], [0.7, P.marble[0]], [1, P.marble[1]]], 0, 0, 1, 0)}
      ${lg(u + 'brass', P.brass, 0, 0, 1, 0)}
      ${lg(u + 'bench', k([[0, '#7AB0AA'], [1, '#4F8580']], [[0, '#7FA89E'], [1, '#4E7A72']], [[0, '#44607A'], [1, '#2C3F58']]))}
      ${lg(u + 'bwood', P.wood.map((c, i) => [i, c]))}
      ${rg(u + 'pink', [[0, '#FFD3DD'], [0.6, '#F59AB0'], [1, '#D8708C']], 0.35, 0.3, 0.8)}
      ${rg(u + 'blue', [[0, '#DDEEFF'], [0.6, '#96C0EE'], [1, '#6590C8']], 0.35, 0.3, 0.8)}
    </defs>
      <rect y="760" width="2400" height="240" fill="url(#${u}floor)"/>`;
    [786, 818, 858, 910, 972].forEach((y, i, a) => {
      near += `<line x1="0" y1="${y}" x2="2400" y2="${y}" stroke="${P.seam}" stroke-width="${1.5 + i * 0.6}" opacity=".35"/>`;
      const y0 = i ? a[i - 1] : 762, step = 200 + i * 60;
      let d = '';
      for (let x = (i * 131) % step; x < 2400; x += step) d += `M${x} ${y0}V${y}`;
      near += `<path d="${d}" stroke="${P.seam}" stroke-width="2" opacity=".28"/>`;
    });
    // glossy reflections of the art + light pools
    near += `<g filter="url(#${u}blur)" opacity="${k(0.32, 0.3, 0.42)}"><rect x="996" y="768" width="408" height="160" fill="url(#${u}refl)"/>
      <rect x="430" y="768" width="240" height="100" fill="url(#${u}reflG)"/>
      <rect x="1566" y="768" width="148" height="100" fill="url(#${u}reflG)"/>
      <rect x="1866" y="768" width="208" height="100" fill="url(#${u}reflG)" opacity=".8"/>
      <rect x="760" y="768" width="120" height="30" fill="#fff" opacity=".6"/></g>
      ${N ? '' : SKY.map(x => { const x0 = x + 36 + P.shaftDx, x1 = x + SW - 36 + P.shaftDx, d = P.shaftDx * 0.4 + 16; return `<path d="M${x0} 769 H${x1} L${x1 + d} 890 H${x0 + d} Z" fill="url(#${u}patch)"/>`; }).join('')}
      ${[[550, 170], [1200, 300], [1640, 140], [1970, 150], [2220, 100]].map(([x, w]) => `<ellipse cx="${x}" cy="${790}" rx="${w}" ry="30" fill="url(#${u}pool)"/>`).join('')}
      <ellipse cx="1200" cy="880" rx="900" ry="24" fill="#fff" opacity="${k(0.1, 0.08, 0.05)}"/>
      <rect y="748" width="2400" height="16" fill="${P.base}"/><rect y="748" width="2400" height="4" fill="#fff" opacity=".35"/><rect y="764" width="2400" height="5" fill="#000" opacity=".08"/>`;
    if (N) near += [120, 460, 700, 1000, 1400, 1740, 2060, 2320].map(x => `<ellipse cx="${x}" cy="770" rx="34" ry="10" fill="url(#${u}pool)"/><rect x="${x - 7}" y="753" width="14" height="5" rx="2.5" fill="#FFE3A6"/>`).join('');

    // sculpture on a plinth: two leaning pebbles with a little gold heart
    near += `<ellipse cx="822" cy="804" rx="96" ry="12" fill="#000" opacity="${P.sh + 0.03}"/>
      <rect x="756" y="610" width="132" height="192" rx="6" fill="url(#${u}plinth)"/>
      <rect x="748" y="598" width="148" height="18" rx="6" fill="${P.marble[0]}"/><rect x="748" y="612" width="148" height="5" fill="#000" opacity=".06"/>
      <rect x="784" y="584" width="76" height="16" rx="5" fill="${k('#7B6A62', '#7A5E52', '#3E3656')}"/>
      <ellipse cx="804" cy="512" rx="30" ry="74" transform="rotate(13 804 512)" fill="url(#${u}pink)"/>
      <ellipse cx="842" cy="522" rx="26" ry="64" transform="rotate(-15 842 522)" fill="url(#${u}blue)"/>
      <ellipse cx="796" cy="478" rx="8" ry="20" transform="rotate(13 796 478)" fill="#fff" opacity=".45"/>
      <ellipse cx="846" cy="492" rx="6" ry="16" transform="rotate(-15 846 492)" fill="#fff" opacity=".45"/>
      <path d="M824 440 C812 432 810 422 816 420 C820 418 824 422 824 425 C824 422 828 418 832 420 C838 422 836 432 824 440 Z" fill="#F2B84A"/>
      <rect x="806" y="690" width="32" height="20" rx="3" fill="${P.plq}" opacity=".85"/><rect x="811" y="697" width="22" height="2.5" fill="#B9ADA6"/><rect x="811" y="703" width="14" height="2.5" fill="#B9ADA6"/>`;

    // velvet rope in front of the big painting
    const post = (x) => `<ellipse cx="${x}" cy="803" rx="30" ry="7" fill="#000" opacity="${P.sh + 0.05}"/>
      <ellipse cx="${x}" cy="798" rx="22" ry="7" fill="url(#${u}brass)"/><rect x="${x - 5}" y="692" width="10" height="106" rx="4" fill="url(#${u}brass)"/>
      <circle cx="${x}" cy="686" r="11" fill="url(#${u}brass)"/><circle cx="${x - 3}" cy="682" r="4" fill="#FFF3C8" opacity=".8"/>`;
    near += `<path d="M978 700 Q1200 790 1422 700" stroke="#8E1A2E" stroke-width="13" fill="none" stroke-linecap="round"/>
      <path d="M980 697 Q1200 786 1420 697" stroke="#D2445C" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>` + post(972) + post(1428);

    // gallery bench
    near += `<ellipse cx="1780" cy="806" rx="230" ry="14" fill="#000" opacity="${P.sh}"/>
      <rect x="1604" y="712" width="18" height="90" rx="6" fill="url(#${u}bwood)"/><rect x="1938" y="712" width="18" height="90" rx="6" fill="url(#${u}bwood)"/>
      <rect x="1630" y="712" width="12" height="78" rx="5" fill="${P.wood[1]}" opacity=".8"/><rect x="1918" y="712" width="12" height="78" rx="5" fill="${P.wood[1]}" opacity=".8"/>
      <rect x="1590" y="706" width="380" height="18" rx="8" fill="url(#${u}bwood)"/>
      <rect x="1580" y="676" width="400" height="40" rx="18" fill="url(#${u}bench)"/>
      <rect x="1598" y="681" width="364" height="8" rx="4" fill="#fff" opacity=".25"/>
      ${[1640, 1700, 1760, 1820, 1880, 1920].map(x => `<circle cx="${x}" cy="698" r="3.5" fill="#000" opacity=".18"/>`).join('')}
      <g transform="rotate(-4 1880 668)"><rect x="1846" y="660" width="64" height="16" rx="3" fill="#FFF6E6"/><rect x="1846" y="660" width="20" height="16" rx="3" fill="#FF8A7A"/></g>`;

    // ------------------------------------------------------------ front: marble bust (left), ropes (right)
    let front = `<defs>
      ${lg(u + 'fplinth', [[0, P.marble[0]], [0.65, P.marble[0]], [1, P.marble[1]]], 0, 0, 1, 0)}
      ${rg(u + 'marble', [[0, '#FFFFFF'], [0.55, P.marble[0]], [1, P.marble[1]]], 0.38, 0.32, 0.8)}
      ${lg(u + 'fbrass', P.brass, 0, 0, 1, 0)}
    </defs>`;
    front += `<ellipse cx="220" cy="1000" rx="170" ry="20" fill="#000" opacity="${P.sh}"/>
      <rect x="110" y="744" width="220" height="280" rx="8" fill="url(#${u}fplinth)"/>
      <rect x="96" y="726" width="248" height="24" rx="8" fill="${P.marble[0]}"/><rect x="96" y="746" width="248" height="6" fill="#000" opacity=".07"/>
      <path d="M168 728 L180 696 H260 L272 728 Z" fill="${P.marbleD}"/>
      <path d="M124 684 C120 640 146 614 194 606 H246 C294 614 320 640 316 684 Q220 718 124 684 Z" fill="url(#${u}marble)"/>
      <path d="M156 624 Q210 650 244 700 M264 622 Q284 640 290 664" stroke="${P.marbleD}" stroke-width="7" fill="none" stroke-linecap="round"/>
      <rect x="196" y="566" width="48" height="56" rx="20" fill="${P.marbleD}"/>
      <ellipse cx="220" cy="524" rx="60" ry="64" fill="url(#${u}marble)"/>
      ${[[162, 506, 17], [168, 476, 19], [190, 456, 20], [218, 450, 21], [246, 458, 20], [268, 480, 18], [274, 508, 14]].map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="url(#${u}marble)"/>`).join('')}
      <path d="M190 530 q10 8 20 0 M230 530 q10 8 20 0" stroke="${k('#B4ABC2', '#C4A698', '#5E5788')}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="184" cy="552" rx="11" ry="6" fill="#FF9DB0" opacity=".35"/><ellipse cx="256" cy="552" rx="11" ry="6" fill="#FF9DB0" opacity=".35"/>
      <path d="M212 562 q8 6 16 0" stroke="${k('#B4ABC2', '#C4A698', '#5E5788')}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    const fpost = (x) => `<ellipse cx="${x}" cy="992" rx="46" ry="11" fill="#000" opacity="${P.sh + 0.05}"/>
      <ellipse cx="${x}" cy="985" rx="34" ry="11" fill="url(#${u}fbrass)"/><rect x="${x - 8}" y="818" width="16" height="168" rx="6" fill="url(#${u}fbrass)"/>
      <circle cx="${x}" cy="808" r="17" fill="url(#${u}fbrass)"/><circle cx="${x - 5}" cy="802" r="6" fill="#FFF3C8" opacity=".8"/>`;
    front += `<path d="M1900 830 Q2110 930 2320 830" stroke="#8E1A2E" stroke-width="18" fill="none" stroke-linecap="round"/>
      <path d="M1902 826 Q2110 924 2318 826" stroke="#D2445C" stroke-width="5" fill="none" stroke-linecap="round" opacity=".7"/>
      <path d="M2330 830 Q2370 870 2420 860" stroke="#8E1A2E" stroke-width="18" fill="none" stroke-linecap="round"/>` + fpost(1890) + fpost(2330);

    const tidy = (t) => t.replace(/>\s+</g, '><').replace(/\s*\n\s*/g, ' ');
    return {
      sky: `linear-gradient(${P.wall[0]}, ${P.wall[1]})`,
      layers: [
        { depth: 0.35, svg: tidy(far), extras },
        { depth: 1, svg: tidy(near) },
        { depth: 1.3, svg: tidy(front), front: true },
      ],
    };
  }

  TripArt.scenes.museum = museum;
})();
