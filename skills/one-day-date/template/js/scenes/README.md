# Scene files

Each file here adds one hand-drawn background to `TripArt.scenes`. A stop uses it with `bg: '<name>'` in `js/config.js`. The six original scenes (`bedroom`, `street`, `riverside`, `yuyuan`, `restaurant`, `bar`) live in `js/art.js`. The newer, city-neutral ones live here.

To add a scene:
1. Copy one of these files and give the function a new name.
2. Add a `<script src="js/scenes/<name>.js">` tag to `index.html` (after `js/art.js`, before `js/main.js`) and to `tools/scenes.html`.
3. Open `tools/scenes.html?only=<name>&moods=1` through a local server to check it.

## Contract

```js
(function () {
  'use strict';
  const { rng, lg, rg, glow, cloud, fx, fxHTML, birds, label, css, esc, moodOf, skyline } = TripArt.h;

  function park(u, sc = {}) {
    // u  = unique prefix for every id="" (gradients, filters). A scene can appear twice on a page.
    // sc = the stop's config: sc.mood, sc.labels, sc.skyline…
    return {
      sky: 'linear-gradient(...)',     // CSS background behind all layers
      layers: [
        { depth: 0.05, svg: '', extras },            // sky decorations (clouds, birds)
        { depth: 0.2, svg: far },                    // far away
        { depth: 0.6, svg: mid },
        { depth: 1, svg: near },                     // the ground the couple walks on
        { depth: 1.35, svg: front, front: true },    // foreground, drawn OVER the couple
      ],
    };
  }
  TripArt.scenes.park = park;
})();
```

- **Canvas.** Every layer's `svg` is SVG markup for a 2400 × 1000 viewBox.
- **Ground line.** It is y = 820 (`GROUND_Y`). The couple's feet stand on it at x = 1200. They are about 370 units tall (y ≈ 450–820) and 280 wide.
- **Depth.** `depth` is the parallax factor. At 1 a layer moves with the ground. Smaller values are further away. Layers slide while the couple walks, so every layer that has ground or walls must cover the full 0–2400 width.
- **`front: true`.** These layers are drawn over the couple. Keep them to the edges (x < 700 or x > 1700) or very low (y > 900), so the couple is never hidden.
- **`prop: 'table'`.** Use this for a table in front of the couple: a front layer at depth 1, centred on x = 1200, with its top edge at y ≈ 724–750. Pair it with `idle: { type: 'sit' }` in config, which lowers the couple behind it. Prop layers stay visible even when the stop uses a generated `bgImage`; every other layer is hidden then.
- **Phones.** A portrait phone only sees about x = 970–1430. The info card covers the top (y < 330). Put the most recognisable thing about the place within x 700–1700, y 330–800, with at least part of it inside 970–1430.
- **`extras`.** These are small animated sprites positioned in art units. Make them with `fx(x, y, w, h, className, innerSVG, viewBox?)` or `fxHTML(x, y, w, h, className, html)`. Reusable animation classes from `css/style.css`:
  - `cloud-drift` (+ `slow`), `bird` (needs `birds()` inside; `b2` for a second one)
  - `boat`, `shimmer`, `kite`, `twinkle`, `sway`, `dust`, `note`, `steam`
- **Own animations.** Use `css('<scene>', '...')`, which injects a stylesheet once.
  - Prefix class names with the scene name (`.park-duck`).
  - Put continuous animations behind `.is-here` (`.is-here .park-duck { animation: ... }`), so they only run while that stop is on screen.
  - For SVG parts that rotate or scale, add `style="transform-box:fill-box;transform-origin:50% 50%"`.
- **Text.** Every painted word goes through `label(sc, key, zhDefault, enDefault)` and `esc()`.
  - A place name defaults to `''`, and an empty label hides its whole sign.
  - Users set `labels: { key: 'text' }` on the stop.
- **Mood.** `moodOf(sc, default)` returns `'day' | 'sunset' | 'night'`. Outdoor scenes change sky, light and colours. Indoor scenes change what is seen through windows and how warm the lighting is.
- **City skylines.** `skyline(sc, x, base, h, fill, opts)` draws a generic skyline, the Shanghai one, or nothing, depending on `skyline` in config.
- **Style.** Soft 3D-cartoon / clay look, matching `js/art.js`:
  - rounded shapes, gentle gradients (`lg`, `rg`), soft shadows (black ellipses at .12–.2 opacity), warm pastel palette;
  - no hard outlines; text uses `class="svg-hand"`;
  - no external images or fonts.
- **Size.** Keep each scene under about 40 KB of markup and about 1500 elements.
