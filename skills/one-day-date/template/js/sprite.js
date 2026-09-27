/*
 * 精灵图处理：自动抠掉纯色背景（推荐 #00FF00 绿幕），按网格切帧，
 * 并把每一帧按“脚底 + 上半身中心”对齐，避免动画抖动。
 *
 * Sprite processing: keys out a flat background colour (chroma green recommended),
 * slices frames on the grid, and aligns every frame on the feet baseline and the
 * upper-body centre so the loop doesn't jitter.
 *
 * TripSprite.load(cfg) -> Promise<sprite|null>
 *   sprite = { frames: [canvas], frameW, frameH, contentH, contentW, padBottom, fps, report }
 */
(function () {
  'use strict';

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.decoding = 'async';
      img.onload = function () { resolve(img); };
      img.onerror = function () { reject(new Error('missing ' + src)); };
      img.src = src;
    });
  }

  function median(arr) {
    var a = arr.slice().sort(function (x, y) { return x - y; });
    return a.length ? a[a.length >> 1] : 0;
  }

  // ---------------- background keying ----------------
  function borderColor(d, W, H) {
    var rs = [], gs = [], bs = [], step = Math.max(1, Math.floor((W + H) / 400));
    function add(x, y) { var i = (y * W + x) * 4; rs.push(d[i]); gs.push(d[i + 1]); bs.push(d[i + 2]); }
    for (var x = 0; x < W; x += step) { add(x, 0); add(x, 1); add(x, H - 1); add(x, H - 2); }
    for (var y = 0; y < H; y += step) { add(0, y); add(1, y); add(W - 1, y); add(W - 2, y); }
    return [median(rs), median(gs), median(bs)];
  }

  function hasTransparency(d) {
    var n = 0, total = d.length / 4;
    for (var i = 3; i < d.length; i += 16) if (d[i] < 200) n++;
    return n / (total / 4) > 0.01;
  }

  // Chroma key: measures how much of the key colour's chroma is in each pixel.
  // Works for saturated backgrounds (green, blue, magenta) and tolerates lighting gradients.
  function chromaKey(d, key) {
    var kg = (key[0] + key[1] + key[2]) / 3;
    var kr = key[0] - kg, kgg = key[1] - kg, kb = key[2] - kg;
    var kk = kr * kr + kgg * kgg + kb * kb;
    for (var i = 0; i < d.length; i += 4) {
      var r = d[i], g = d[i + 1], b = d[i + 2];
      var m = (r + g + b) / 3;
      var s = ((r - m) * kr + (g - m) * kgg + (b - m) * kb) / kk; // 1 = pure key colour
      if (s <= 0.12) continue;
      var a = (0.9 - s) / 0.75; // s>=0.9 -> transparent, s<=0.15 -> opaque
      a = a < 0 ? 0 : a > 1 ? 1 : a;
      // despill: remove the key colour's tint from what remains
      var sp = Math.min(s, 1);
      d[i] = clamp(r - sp * kr); d[i + 1] = clamp(g - sp * kgg); d[i + 2] = clamp(b - sp * kb);
      d[i + 3] = Math.round(d[i + 3] * a);
    }
  }
  function clamp(v) { return v < 0 ? 0 : v > 255 ? 255 : v; }

  // Flood key for neutral (white / grey) backgrounds: only removes background connected
  // to the image border, so white clothing inside the figure survives.
  function floodKey(d, W, H, key) {
    var tol = 38, soft = 70;
    var seen = new Uint8Array(W * H), stack = new Int32Array(W * H), sp = 0;
    function dist(p) {
      var i = p * 4, dr = d[i] - key[0], dg = d[i + 1] - key[1], db = d[i + 2] - key[2];
      return Math.sqrt(dr * dr + dg * dg + db * db);
    }
    function push(p) { if (!seen[p] && dist(p) < tol) { seen[p] = 1; stack[sp++] = p; } }
    for (var x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
    for (var y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
    while (sp) {
      var p = stack[--sp], px = p % W;
      d[p * 4 + 3] = 0;
      if (px > 0) push(p - 1);
      if (px < W - 1) push(p + 1);
      if (p >= W) push(p - W);
      if (p < W * (H - 1)) push(p + W);
    }
    // soften the fringe
    for (var q = 0; q < W * H; q++) {
      if (seen[q]) continue;
      var qx = q % W;
      if ((qx > 0 && seen[q - 1]) || (qx < W - 1 && seen[q + 1]) || (q >= W && seen[q - W]) || (q < W * (H - 1) && seen[q + W])) {
        var dd = dist(q);
        if (dd < soft) d[q * 4 + 3] = Math.round(d[q * 4 + 3] * Math.max(0.15, (dd - tol) / (soft - tol)));
      }
    }
  }

  // ---------------- connected components ----------------
  function components(d, W, H) {
    var labels = new Int32Array(W * H), stack = new Int32Array(W * H), comps = [];
    for (var start = 0; start < W * H; start++) {
      if (labels[start] || d[start * 4 + 3] < 96) continue;
      var id = comps.length + 1, sp = 0, area = 0, sx = 0, sy = 0;
      var x0 = W, y0 = H, x1 = 0, y1 = 0;
      labels[start] = id; stack[sp++] = start;
      while (sp) {
        var p = stack[--sp], x = p % W, y = (p - x) / W;
        area++; sx += x; sy += y;
        if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
        var n;
        if (x > 0) { n = p - 1; if (!labels[n] && d[n * 4 + 3] >= 96) { labels[n] = id; stack[sp++] = n; } }
        if (x < W - 1) { n = p + 1; if (!labels[n] && d[n * 4 + 3] >= 96) { labels[n] = id; stack[sp++] = n; } }
        if (y > 0) { n = p - W; if (!labels[n] && d[n * 4 + 3] >= 96) { labels[n] = id; stack[sp++] = n; } }
        if (y < H - 1) { n = p + W; if (!labels[n] && d[n * 4 + 3] >= 96) { labels[n] = id; stack[sp++] = n; } }
      }
      comps.push({ id: id, area: area, cx: sx / area, cy: sy / area, x0: x0, y0: y0, x1: x1, y1: y1 });
    }
    return { labels: labels, comps: comps };
  }

  // Also pick up faint pixels (soft edges / hair wisps) that touch a kept component.
  function growMask(d, W, labels, keep, bb) {
    var mask = new Uint8Array((bb.x1 - bb.x0 + 1) * (bb.y1 - bb.y0 + 1));
    var bw = bb.x1 - bb.x0 + 1;
    for (var y = bb.y0; y <= bb.y1; y++) {
      for (var x = bb.x0; x <= bb.x1; x++) {
        var p = y * W + x, l = labels[p];
        if (l && keep[l]) mask[(y - bb.y0) * bw + (x - bb.x0)] = 1;
      }
    }
    // one dilation step for semi-transparent neighbours
    var out = mask.slice(), bh = bb.y1 - bb.y0 + 1;
    for (var j = 0; j < bh; j++) for (var i = 0; i < bw; i++) {
      var k = j * bw + i;
      if (mask[k]) continue;
      if ((i > 0 && mask[k - 1]) || (i < bw - 1 && mask[k + 1]) || (j > 0 && mask[k - bw]) || (j < bh - 1 && mask[k + bw])) {
        var a = d[((bb.y0 + j) * W + bb.x0 + i) * 4 + 3];
        if (a > 0) out[k] = 1;
      }
    }
    return out;
  }

  // ---------------- main ----------------
  function process(img, cfg) {
    cfg = cfg || {};
    var cols = cfg.cols || 1, rows = cfg.rows || 1;
    var nFrames = Math.min(cfg.frames || cols * rows, cols * rows);
    var W = img.naturalWidth || img.width, H = img.naturalHeight || img.height;
    var cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    var ctx = cv.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    var imgData;
    try {
      imgData = ctx.getImageData(0, 0, W, H);
    } catch (e) {
      // file:// pages can't read pixels. Fall back to plain slicing.
      console.warn('[sprite] 无法读取像素（请用本地服务器打开页面），将直接切图：', e.message);
      return sliceOnly(img, cfg, cols, rows, nFrames);
    }
    var d = imgData.data;
    var report = { width: W, height: H, key: 'none', warnings: [] };

    if (cfg.key !== 'none' && !hasTransparency(d)) {
      var key = borderColor(d, W, H);
      var mx = Math.max(key[0], key[1], key[2]), mn = Math.min(key[0], key[1], key[2]);
      var sat = mx ? (mx - mn) / mx : 0;
      report.bg = 'rgb(' + key.join(',') + ')';
      if (sat > 0.35) { chromaKey(d, key); report.key = 'chroma'; }
      else { floodKey(d, W, H, key); report.key = 'flood'; }
    }

    var cc = components(d, W, H);
    var comps = cc.comps;
    var biggest = comps.reduce(function (m, c) { return Math.max(m, c.area); }, 0);
    var minArea = Math.max(60, biggest * 0.015);
    var cellW = W / cols, cellH = H / rows;
    var groups = [];
    for (var f = 0; f < nFrames; f++) groups.push([]);
    comps.forEach(function (c) {
      if (c.area < minArea) return;
      var col = Math.min(cols - 1, Math.floor(c.cx / cellW));
      var row = Math.min(rows - 1, Math.floor(c.cy / cellH));
      var idx = row * cols + col;
      if (idx < nFrames) groups[idx].push(c);
    });

    var raw = [];
    groups.forEach(function (g, idx) {
      if (!g.length) { report.warnings.push('第 ' + (idx + 1) + ' 帧是空的'); return; }
      var bb = { x0: W, y0: H, x1: 0, y1: 0 }, keep = {};
      g.forEach(function (c) {
        keep[c.id] = 1;
        bb.x0 = Math.min(bb.x0, c.x0); bb.y0 = Math.min(bb.y0, c.y0);
        bb.x1 = Math.max(bb.x1, c.x1); bb.y1 = Math.max(bb.y1, c.y1);
      });
      bb.x0 = Math.max(0, bb.x0 - 1); bb.y0 = Math.max(0, bb.y0 - 1);
      bb.x1 = Math.min(W - 1, bb.x1 + 1); bb.y1 = Math.min(H - 1, bb.y1 + 1);
      var bw = bb.x1 - bb.x0 + 1, bh = bb.y1 - bb.y0 + 1;
      var mask = growMask(d, W, cc.labels, keep, bb);
      var fd = new ImageData(bw, bh), o = fd.data;
      // anchor x = alpha-weighted centre of the upper 55% (heads + torsos move least)
      var sx = 0, sw = 0, lim = bh * 0.55;
      for (var y = 0; y < bh; y++) {
        for (var x = 0; x < bw; x++) {
          var k = y * bw + x;
          if (!mask[k]) continue;
          var si = ((bb.y0 + y) * W + bb.x0 + x) * 4, di = k * 4;
          o[di] = d[si]; o[di + 1] = d[si + 1]; o[di + 2] = d[si + 2]; o[di + 3] = d[si + 3];
          if (y < lim) { sx += x * d[si + 3]; sw += d[si + 3]; }
        }
      }
      var fc = document.createElement('canvas');
      fc.width = bw; fc.height = bh;
      fc.getContext('2d').putImageData(fd, 0, 0);
      raw.push({ canvas: fc, w: bw, h: bh, anchor: sw ? sx / sw : bw / 2, bb: bb });
    });

    if (!raw.length) return null;
    if (raw.length < nFrames) report.warnings.push('只找到 ' + raw.length + ' / ' + nFrames + ' 帧');

    // Scale outliers (frames drawn noticeably bigger/smaller) to the median height.
    // Turn off with normalize:false for sheets of different poses (e.g. squatting).
    var medH = median(raw.map(function (r) { return r.h; }));
    raw.forEach(function (r) {
      var dev = Math.abs(r.h - medH) / medH;
      r.scale = cfg.normalize !== false && dev > 0.1 ? medH / r.h : 1;
      if (r.scale !== 1) report.warnings.push('有一帧大小差异 ' + Math.round(dev * 100) + '%，已自动缩放');
    });

    var halfW = 0, maxH = 0;
    raw.forEach(function (r) {
      halfW = Math.max(halfW, r.anchor * r.scale, (r.w - r.anchor) * r.scale);
      maxH = Math.max(maxH, r.h * r.scale);
    });
    var pad = Math.ceil(maxH * 0.02) + 2;
    var frameW = Math.ceil(halfW * 2) + pad * 2, frameH = Math.ceil(maxH) + pad * 2;
    var frames = raw.map(function (r) {
      var c = document.createElement('canvas');
      c.width = frameW; c.height = frameH;
      var g = c.getContext('2d');
      g.imageSmoothingQuality = 'high';
      var dw = r.w * r.scale, dh = r.h * r.scale;
      g.drawImage(r.canvas, frameW / 2 - r.anchor * r.scale, frameH - pad - dh, dw, dh);
      return c;
    });

    report.frames = frames.length;
    report.boxes = raw.map(function (r) { return r.bb; });
    // optional playback order, 1-based: order: [1, 2, 3, 4, 5, 6]
    if (cfg.order && cfg.order.length) {
      frames = cfg.order.map(function (n) { return frames[n - 1]; }).filter(Boolean);
    }
    return {
      frames: frames,
      frameW: frameW, frameH: frameH,
      contentH: medH, contentW: median(raw.map(function (r) { return r.w * r.scale; })),
      padBottom: pad,
      fps: cfg.fps || 8,
      displayScale: cfg.scale || 1,
      report: report,
    };
  }

  function sliceOnly(img, cfg, cols, rows, n) {
    var W = img.naturalWidth, H = img.naturalHeight, cw = Math.floor(W / cols), ch = Math.floor(H / rows);
    var frames = [];
    for (var i = 0; i < n; i++) {
      var c = document.createElement('canvas');
      c.width = cw; c.height = ch;
      c.getContext('2d').drawImage(img, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch, 0, 0, cw, ch);
      frames.push(c);
    }
    return { frames: frames, frameW: cw, frameH: ch, contentH: ch * 0.9, contentW: cw * 0.8, padBottom: ch * 0.05, fps: cfg.fps || 8, report: { key: 'unavailable', warnings: ['无法抠图：请用本地服务器打开'] } };
  }

  function load(cfg) {
    if (!cfg || !cfg.src) return Promise.resolve(null);
    return loadImage(cfg.src).then(function (img) {
      return process(img, cfg);
    }).catch(function () { return null; });
  }

  window.TripSprite = { load: load, process: process, loadImage: loadImage };
})();
