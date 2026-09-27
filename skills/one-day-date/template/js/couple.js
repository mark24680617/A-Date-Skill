/*
 * 小人：内置的 SVG 卡通情侣（没有生成图片时使用），以及播放精灵图的 CoupleView。
 * The couple: a built-in SVG pair (fallback) and CoupleView, which plays either
 * the SVG rig or processed sprite-sheet frames.
 */
(function () {
  'use strict';

  var VB_W = 320, VB_H = 410, FOOT_Y = 404;
  var uidSeq = 0;

  var C = {
    skin: '#FFDCC2', skinShade: '#F2B596', skinHi: '#FFF1E6',
    hisHair: '#2E2521', hisHairHi: '#5A4840',
    shirt: '#8EC3EC', shirtShade: '#6AA3D3', shirtHi: '#BFE0F8',
    pants: '#3A4766', pantsShade: '#2B3552',
    herHair: '#5B3A2E', herHairHi: '#86594A',
    dress: '#F7A6BA', dressShade: '#E0839C', dressHi: '#FFD0DC',
    shoeHer: '#B94A48', eye: '#2A1D1A', blush: '#FF8FA3', mouth: '#9A3F37',
  };

  // Colours from config: characters.builtin = { a: { skin, hair, top, bottom }, b: { skin, hair, dress, shoes } }.
  // a = the one on the left (short hair, shirt + trousers), b = the right (long hair, dress).
  function shade(hex, k) {
    var m = /^#?([0-9a-f]{6})$/i.exec(String(hex || '').trim());
    if (!m) return hex;
    var n = parseInt(m[1], 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) {
      return Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k);
    });
    return '#' + c.map(function (v) { return (v < 16 ? '0' : '') + v.toString(16); }).join('');
  }
  (function applyConfigColours() {
    var B = ((window.TRIP_CONFIG || {}).characters || {}).builtin || {}, a = B.a || {}, b = B.b || {};
    if (a.skin) { C.skin = a.skin; C.skinShade = shade(a.skin, -0.1); C.skinHi = shade(a.skin, 0.5); }
    C.skinB = b.skin || C.skin; C.skinBShade = b.skin ? shade(b.skin, -0.1) : C.skinShade; C.skinBHi = b.skin ? shade(b.skin, 0.5) : C.skinHi;
    if (a.hair) { C.hisHair = a.hair; C.hisHairHi = shade(a.hair, 0.22); }
    if (a.top) { C.shirt = a.top; C.shirtShade = shade(a.top, -0.15); C.shirtHi = shade(a.top, 0.4); }
    C.pantsHi = a.bottom ? shade(a.bottom, 0.15) : '#4A5880';
    if (a.bottom) { C.pants = a.bottom; C.pantsShade = shade(a.bottom, -0.2); }
    if (b.hair) { C.herHair = b.hair; C.herHairHi = shade(b.hair, 0.22); }
    if (b.dress) { C.dress = b.dress; C.dressShade = shade(b.dress, -0.12); C.dressHi = shade(b.dress, 0.4); }
    if (b.shoes) C.shoeHer = b.shoes;
  })();

  function defs(u) {
    return '<defs>' +
      '<radialGradient id="' + u + 'skin" cx="38%" cy="32%" r="75%">' +
      '<stop offset="0" stop-color="' + C.skinHi + '"/><stop offset=".55" stop-color="' + C.skin + '"/><stop offset="1" stop-color="' + C.skinShade + '"/></radialGradient>' +
      '<radialGradient id="' + u + 'skinb" cx="38%" cy="32%" r="75%">' +
      '<stop offset="0" stop-color="' + C.skinBHi + '"/><stop offset=".55" stop-color="' + C.skinB + '"/><stop offset="1" stop-color="' + C.skinBShade + '"/></radialGradient>' +
      '<linearGradient id="' + u + 'shirt" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + C.shirtHi + '"/><stop offset=".45" stop-color="' + C.shirt + '"/><stop offset="1" stop-color="' + C.shirtShade + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'dress" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="' + C.dressHi + '"/><stop offset=".45" stop-color="' + C.dress + '"/><stop offset="1" stop-color="' + C.dressShade + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'hhair" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + C.hisHairHi + '"/><stop offset=".5" stop-color="' + C.hisHair + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'rhair" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="' + C.herHairHi + '"/><stop offset=".45" stop-color="' + C.herHair + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'pants" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="' + C.pantsHi + '"/><stop offset="1" stop-color="' + C.pants + '"/></linearGradient>' +
      '</defs>';
  }

  // ---------- heads (local coordinates, centred on 0,0) ----------
  function eyesOpen(big) {
    var ry = big ? 11 : 10.5, rx = big ? 8.5 : 8;
    var s = '<g class="eyes" style="transform-box:fill-box;transform-origin:50% 50%">' +
      '<ellipse cx="-21" cy="12" rx="' + rx + '" ry="' + ry + '" fill="' + C.eye + '"/>' +
      '<ellipse cx="22" cy="12" rx="' + rx + '" ry="' + ry + '" fill="' + C.eye + '"/>' +
      '<circle cx="-24" cy="7" r="3.4" fill="#fff"/><circle cx="19" cy="7" r="3.4" fill="#fff"/>' +
      '<circle cx="-18" cy="17" r="1.7" fill="#fff" opacity=".8"/><circle cx="25" cy="17" r="1.7" fill="#fff" opacity=".8"/>';
    if (big) {
      s += '<path d="M-29 5 l-6 -4 M-28 9 l-7 -1 M30 5 l6 -4 M29 9 l7 -1" stroke="' + C.eye + '" stroke-width="2.6" stroke-linecap="round"/>';
    }
    return s + '</g>';
  }
  function eyesClosed() {
    return '<path d="M-29 13 Q-21 20 -13 13 M14 13 Q22 20 30 13" fill="none" stroke="' + C.eye + '" stroke-width="3.4" stroke-linecap="round"/>';
  }
  function face(opts, her) {
    var s = '<g class="face">';
    s += opts.sleep ? eyesClosed() : eyesOpen(her);
    s += '<ellipse cx="-38" cy="31" rx="12" ry="7" fill="' + C.blush + '" opacity=".55"/>' +
         '<ellipse cx="39" cy="31" rx="12" ry="7" fill="' + C.blush + '" opacity=".55"/>' +
         '<ellipse cx="1" cy="24" rx="3" ry="2" fill="' + (her ? C.skinBShade : C.skinShade) + '"/>';
    if (opts.sleep) s += '<path d="M-3 37 Q1 40 5 37" fill="none" stroke="' + C.mouth + '" stroke-width="3" stroke-linecap="round"/>';
    else if (her) s += '<path d="M-7 34 Q1 44 10 34 Q1 38 -7 34 Z" fill="' + C.mouth + '" stroke="' + C.mouth + '" stroke-width="2" stroke-linejoin="round"/>';
    else s += '<path d="M-8 34 Q1 42 10 34" fill="none" stroke="' + C.mouth + '" stroke-width="3.4" stroke-linecap="round"/>';
    return s + '</g>';
  }

  function hisHead(u, opts) {
    opts = opts || {};
    return '<circle cx="-62" cy="10" r="13" fill="' + C.skin + '"/><circle cx="62" cy="10" r="13" fill="' + C.skinShade + '"/>' +
      '<circle r="64" fill="url(#' + u + 'skin)"/>' +
      face(opts, false) +
      '<path d="M-68 10 C-74 -44 -40 -80 0 -80 C44 -80 76 -46 68 8 C66 -10 58 -24 50 -28 Q42 -4 30 -24 Q20 -2 8 -26 Q-4 -4 -16 -26 Q-28 -4 -38 -24 Q-50 -6 -56 -20 Q-64 -8 -68 10 Z" fill="url(#' + u + 'hhair)"/>' +
      '<path d="M-40 -60 Q-20 -72 6 -70" fill="none" stroke="' + C.hisHairHi + '" stroke-width="6" stroke-linecap="round" opacity=".8"/>';
  }

  function herHeadBack(u) {
    return '<path d="M-72 0 C-82 -62 -40 -88 0 -88 C42 -88 82 -60 74 0 C72 50 80 100 84 128 Q60 142 30 132 L-30 132 Q-62 142 -82 128 C-76 100 -72 50 -72 0 Z" fill="' + C.herHair + '"/>';
  }
  function herHead(u, opts) {
    opts = opts || {};
    return '<circle r="62" fill="url(#' + u + 'skinb)"/>' +
      face(opts, true) +
      '<path d="M-66 16 C-74 -46 -38 -82 2 -82 C46 -82 74 -46 66 14 C60 -12 46 -26 32 -28 Q24 -6 8 -4 Q2 -18 -8 -22 Q-20 -2 -38 -4 Q-48 -16 -54 -16 Q-62 -4 -66 16 Z" fill="url(#' + u + 'rhair)"/>' +
      '<path d="M-66 8 C-76 40 -72 80 -60 104 C-54 80 -52 42 -52 12 Z M66 8 C76 40 72 80 60 104 C54 80 52 42 52 12 Z" fill="' + C.herHair + '"/>' +
      '<path d="M-36 -66 Q-14 -78 12 -74" fill="none" stroke="' + C.herHairHi + '" stroke-width="6" stroke-linecap="round" opacity=".8"/>' +
      // bow
      '<g transform="translate(40 -60) rotate(18)"><path d="M0 0 L-18 -12 Q-24 0 -18 12 Z M0 0 L18 -12 Q24 0 18 12 Z" fill="#FF7FA0"/><circle r="6" fill="#FF5C88"/></g>';
  }

  // ---------- full rig ----------
  function limb(x1, y1, x2, y2, w, color) {
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + color + '" stroke-width="' + w + '" stroke-linecap="round"/>';
  }
  function hisLeg(x, cls, pantsFill) {
    return '<g class="' + cls + '" style="transform-origin:' + x + 'px 262px">' +
      '<rect x="' + (x - 14) + '" y="250" width="28" height="124" rx="13" fill="' + pantsFill + '"/>' +
      '<rect x="' + (x - 16) + '" y="370" width="42" height="26" rx="12" fill="#FFFFFF"/>' +
      '<rect x="' + (x - 18) + '" y="394" width="46" height="10" rx="5" fill="#D6D8E2"/>' +
      '<path d="M' + (x - 6) + ' 380 h18" stroke="' + C.shirt + '" stroke-width="4" stroke-linecap="round"/>' +
      '</g>';
  }
  function herLeg(x, cls, skinFill) {
    return '<g class="' + cls + '" style="transform-origin:' + x + 'px 270px">' +
      '<rect x="' + (x - 10) + '" y="262" width="20" height="112" rx="10" fill="' + skinFill + '"/>' +
      '<rect x="' + (x - 11) + '" y="352" width="22" height="24" rx="6" fill="#FFFFFF"/>' +
      '<rect x="' + (x - 13) + '" y="372" width="34" height="26" rx="12" fill="' + C.shoeHer + '"/>' +
      '<rect x="' + (x - 14) + '" y="396" width="36" height="8" rx="4" fill="#6E2A2A"/>' +
      '<path d="M' + (x - 6) + ' 378 h16" stroke="#7E2E2E" stroke-width="3" stroke-linecap="round"/>' +
      '</g>';
  }

  function coupleSVG(u) {
    var s = '<svg class="couple-svg" viewBox="0 0 ' + VB_W + ' ' + VB_H + '" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + defs(u);

    // ---- him ----
    s += '<g class="him"><g class="bob him-bob">';
    s += '<g class="arm him-arm" style="transform-origin:66px 186px">' +
         limb(66, 188, 62, 222, 24, C.shirtShade) + limb(62, 220, 62, 250, 18, C.skinShade) +
         '<circle cx="62" cy="256" r="11" fill="' + C.skinShade + '"/></g>';
    s += hisLeg(92, 'leg him-leg-a', C.pantsShade);
    s += hisLeg(120, 'leg him-leg-b', 'url(#' + u + 'pants)');
    s += '<rect x="96" y="150" width="18" height="30" rx="6" fill="' + C.skinShade + '"/>';
    s += '<path d="M62 192 C62 178 74 170 88 170 L122 170 C136 170 148 178 148 192 L150 262 Q150 274 138 274 L72 274 Q60 274 60 262 Z" fill="url(#' + u + 'shirt)"/>' +
         '<path d="M92 170 L105 186 L118 170" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-linejoin="round"/>' +
         '<rect x="118" y="200" width="18" height="16" rx="4" fill="' + C.shirtShade + '" opacity=".6"/>' +
         '<path d="M105 188 V266" stroke="' + C.shirtShade + '" stroke-width="2" opacity=".5"/>' +
         '<rect x="60" y="256" width="90" height="12" rx="4" fill="#5B4636"/>';
    s += '<g class="arm-in">' + limb(144, 188, 150, 222, 24, C.shirt) + limb(150, 220, 158, 252, 18, C.skin) + '</g>';
    s += '<g class="head him-head" style="transform-box:fill-box;transform-origin:50% 88%"><g transform="translate(105 98)">' + hisHead(u) + '</g></g>';
    s += '</g></g>';

    // ---- her ----
    s += '<g class="her"><g class="bob her-bob">';
    s += '<g class="hairback" style="transform-box:fill-box;transform-origin:50% 0%"><g transform="translate(216 102)">' + herHeadBack(u) + '</g></g>';
    s += '<g class="arm her-arm" style="transform-origin:248px 188px">' +
         '<circle cx="248" cy="190" r="14" fill="' + C.dressShade + '"/>' +
         limb(250, 198, 254, 250, 17, C.skinBShade) + '<circle cx="255" cy="256" r="10" fill="' + C.skinBShade + '"/></g>';
    s += herLeg(202, 'leg her-leg-a', C.skinBShade);
    s += herLeg(228, 'leg her-leg-b', C.skinB);
    s += '<rect x="207" y="150" width="18" height="30" rx="6" fill="' + C.skinBShade + '"/>';
    s += '<g class="skirt" style="transform-box:fill-box;transform-origin:50% 0%">' +
         '<path d="M186 232 L246 232 C258 254 268 276 274 298 Q216 314 156 298 C164 276 174 254 186 232 Z" fill="url(#' + u + 'dress)"/>' +
         '<path d="M158 296 Q216 312 273 296" fill="none" stroke="#FFFFFF" stroke-width="4" opacity=".85"/></g>';
    s += '<path d="M186 184 C186 175 194 170 204 170 L228 170 C238 170 246 175 246 184 L244 238 L188 238 Z" fill="url(#' + u + 'dress)"/>' +
         '<path d="M200 170 L214 186 L204 190 Z M232 170 L218 186 L228 190 Z" fill="#FFFFFF"/>' +
         '<rect x="186" y="228" width="60" height="11" rx="5" fill="' + C.dressShade + '"/>' +
         '<path d="M192 174 L250 246" stroke="#8A5A44" stroke-width="4" stroke-linecap="round"/>' +
         '<rect x="238" y="238" width="28" height="26" rx="8" fill="#C9855F"/><path d="M238 246 H266" stroke="#A96A48" stroke-width="3"/>';
    s += '<g class="arm-in"><circle cx="186" cy="190" r="14" fill="' + C.dress + '"/>' + limb(184, 198, 174, 252, 17, C.skinB) + '</g>';
    s += '<g class="head her-head" style="transform-box:fill-box;transform-origin:50% 88%"><g transform="translate(216 102)">' + herHead(u) + '</g></g>';
    s += '</g></g>';

    // ---- joined hands (on top) ----
    s += '<g class="hands"><circle cx="160" cy="258" r="11.5" fill="' + C.skin + '"/><circle cx="171" cy="259" r="10.5" fill="' + C.skinB + '"/>' +
         '<path d="M156 252 Q166 248 176 254" fill="none" stroke="' + C.skinShade + '" stroke-width="2.5" stroke-linecap="round"/></g>';

    return s + '</svg>';
  }

  // Two heads asleep on a pillow, used by the bedroom scene.
  function sleepingHeads(u, x, y) {
    x = x || 0; y = y || 0;
    return defs(u) +
      '<g transform="translate(' + x + ' ' + y + ') rotate(-8)">' +
      '<g transform="translate(150 6) rotate(-6)">' + herHeadBack(u) + '</g>' +
      '<g transform="translate(40 0) rotate(8)">' + hisHead(u, { sleep: true }) + '</g>' +
      '<g transform="translate(150 6) rotate(-6)">' + herHead(u, { sleep: true }) + '</g>' +
      '</g>';
  }

  // ---------- CoupleView ----------
  function CoupleView(container) {
    this.el = container;
    this.uid = 'cp' + (++uidSeq) + '-';
    container.classList.add('couple');
    container.innerHTML =
      '<div class="couple-body">' +
        '<div class="couple-builtin">' + coupleSVG(this.uid) + '</div>' +
        '<canvas class="couple-sprite" hidden></canvas>' +
        '<canvas class="couple-special" hidden></canvas>' +
      '</div>';
    this.body = container.querySelector('.couple-body');
    this.builtin = container.querySelector('.couple-builtin');
    this.canvas = container.querySelector('.couple-sprite');
    this.special = container.querySelector('.couple-special');
    this.walkSprite = null;
    this.idleSprite = null;
    this.specialSprite = null;
    this.poseSprite = null;
    this.poseIndex = null;
    this.walking = false;
    this.stopping = false;
    this.rate = 1;
    this.framePos = 0;
    this.drawn = null;
    this.heightPx = 300;
    this.pose = 'stand';
  }

  CoupleView.prototype.usesSprites = function () { return !!this.walkSprite; };

  CoupleView.prototype.setSprites = function (walk, idle) {
    this.walkSprite = walk || null;
    this.idleSprite = idle || null;
    var on = !!walk;
    this.builtin.hidden = on;
    this.canvas.hidden = !on;
    this.el.classList.toggle('has-sprite', on);
    this.drawn = null;
    this.layout(this.heightPx);
  };

  // Still poses (one frame each, e.g. hug / heart hands). Shown while standing.
  CoupleView.prototype.setPoses = function (sprite) {
    this.poseSprite = sprite || null;
    this.drawn = null;
  };
  CoupleView.prototype.showPose = function (i) {
    this.poseIndex = this.poseSprite && i != null && i >= 0 && i < this.poseSprite.frames.length ? i : null;
    this.drawn = null;
  };

  // Special per-scene sprite (e.g. stretching after waking up). Replaces the couple while shown.
  CoupleView.prototype.setSpecial = function (sprite, heightPx) {
    this.specialSprite = sprite || null;
    this.specialHeight = heightPx || this.heightPx;
    this.special.hidden = !sprite;
    this.el.classList.toggle('show-special', !!sprite);
    this.drawn = null;
    this.layout(this.heightPx);
  };

  function sizeCanvas(cv, sp, contentPx) {
    if (!sp) return;
    var cssH = contentPx * (sp.displayScale || 1) * sp.frameH / sp.contentH;
    var cssW = cssH * sp.frameW / sp.frameH;
    if (cv.width !== sp.frameW) cv.width = sp.frameW;
    if (cv.height !== sp.frameH) cv.height = sp.frameH;
    cv.style.height = cssH + 'px';
    cv.style.width = cssW + 'px';
    cv.style.left = (-cssW / 2) + 'px';
    cv.style.bottom = (-(sp.padBottom / sp.frameH) * cssH) + 'px';
  }

  // heightPx: on-screen height of the couple from feet to top of head.
  CoupleView.prototype.layout = function (heightPx) {
    this.heightPx = heightPx;
    var svgH = heightPx * VB_H / (FOOT_Y - 12); // head top is ~y=12 in the rig
    this.builtin.style.height = svgH + 'px';
    this.builtin.style.width = (svgH * VB_W / VB_H) + 'px';
    this.builtin.style.bottom = (-(VB_H - FOOT_Y) / VB_H * svgH) + 'px';
    this.builtin.style.left = (-(svgH * VB_W / VB_H) / 2) + 'px';
    var cur = this.walkSprite;
    if (cur) sizeCanvas(this.canvas, cur, heightPx);
    if (this.specialSprite) sizeCanvas(this.special, this.specialSprite, this.specialHeight);
    this.drawn = null;
  };

  CoupleView.prototype.width = function () {
    if (this.walkSprite) {
      var sp = this.walkSprite;
      return this.heightPx * (sp.contentW || sp.frameW) / sp.contentH;
    }
    return this.heightPx * 0.72;
  };

  CoupleView.prototype.setWalking = function (on) {
    if (on) {
      this.stopping = false;
      if (!this.walking) {
        this.walking = true;
        this.rate = 1; // CSS animations restart at normal speed
        this.el.classList.add('walking');
        this.framePos = 0;
        this.drawn = null;
        if (this.walkSprite) sizeCanvas(this.canvas, this.walkSprite, this.heightPx);
      }
    } else if (this.walking) {
      this.stopping = true; // finish the step so the legs come to rest together
    }
  };

  CoupleView.prototype.setRate = function (r) {
    if (Math.abs(r - this.rate) < 0.03) return;
    this.rate = r;
    if (this.builtin.getAnimations) {
      this.builtin.getAnimations({ subtree: true }).forEach(function (a) {
        if (a.animationName && a.animationName.indexOf('w-') === 0) a.playbackRate = r;
      });
    }
  };

  CoupleView.prototype.setFacing = function (dir) {
    this.el.classList.toggle('face-left', dir < 0);
  };

  CoupleView.prototype.setPose = function (pose) {
    this.pose = pose;
    this.el.dataset.pose = pose;
  };

  CoupleView.prototype.finishStop = function () {
    this.walking = false;
    this.stopping = false;
    this.el.classList.remove('walking');
    this.framePos = 0;
    this.drawn = null;
  };

  CoupleView.prototype.draw = function (cv, sp, idx, key) {
    if (this.drawn === key) return;
    if (cv.width !== sp.frameW || cv.height !== sp.frameH || this.drawn === null) {
      sizeCanvas(cv, sp, cv === this.special ? this.specialHeight : this.heightPx);
    }
    var ctx = cv.getContext('2d');
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.drawImage(sp.frames[idx], 0, 0);
    this.drawn = key;
  };

  CoupleView.prototype.update = function (dt) {
    if (!(dt > 0)) dt = 0;
    if (this.specialSprite) {
      var ss = this.specialSprite;
      this.framePos += dt * ss.fps;
      var si = Math.floor(this.framePos) % ss.frames.length;
      this.draw(this.special, ss, si, 'x' + si);
      return;
    }

    if (!this.walkSprite) {
      // Built-in rig: CSS drives the limbs. When stopping, wait for the passing pose
      // (legs together) so the couple doesn't freeze mid-stride.
      if (this.stopping) {
        var bob = this.builtin.getAnimations ? this.builtin.getAnimations({ subtree: true }).filter(function (a) {
          return a.animationName === 'w-bob';
        })[0] : null;
        var prog = bob && bob.effect ? bob.effect.getComputedTiming().progress : 0.5;
        if (prog == null || (prog > 0.38 && prog < 0.62)) this.finishStop();
      }
      return;
    }

    var ws = this.walkSprite;
    if (this.walking && !this.stopping) {
      this.framePos += dt * ws.fps * this.rate;
      var i = Math.floor(this.framePos) % ws.frames.length;
      this.draw(this.canvas, ws, i, 'w' + i);
      return;
    }
    if (this.stopping) this.finishStop();

    if (this.poseSprite && this.poseIndex != null) {
      this.draw(this.canvas, this.poseSprite, this.poseIndex, 'p' + this.poseIndex);
    } else if (this.idleSprite) {
      this.framePos += dt * this.idleSprite.fps;
      var k = Math.floor(this.framePos) % this.idleSprite.frames.length;
      this.draw(this.canvas, this.idleSprite, k, 'i' + k);
    } else {
      var sf = Math.min(window.TRIP_CONFIG.characters.standFrame || 0, ws.frames.length - 1);
      this.draw(this.canvas, ws, sf, 's' + sf);
    }
  };

  window.TripCouple = {
    svg: coupleSVG,
    sleepingHeads: sleepingHeads,
    CoupleView: CoupleView,
    colors: C,
  };
})();
