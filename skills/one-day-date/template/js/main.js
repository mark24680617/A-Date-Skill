/*
 * 主程序：场景切换、视差、人物走路、卡片、进度条、输入。
 * Main app: camera + parallax, walking between scenes, poses, card, HUD, input.
 */
(function () {
  'use strict';

  var CFG = window.TRIP_CONFIG, Art = window.TripArt;
  var SCN = CFG.scenes, N = SCN.length;
  var $ = function (s) { return document.querySelector(s); };
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  var stage = $('#stage'), actor = $('#actor'), bubble = $('#bubble');
  var S = {
    p: 0, anim: null, started: false, awake: false, here: -1,
    W: 0, H: 0, scale: 1, baseline: 0, coupleH: 0, travel: 0, stepDur: 3.6,
    ptr: { x: 0, y: 0, tx: 0, ty: 0 }, lastP: 0, idleHeart: 0,
  };

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  // rough display width: CJK / emoji ≈ 1, Latin ≈ 0.58 (matches scripts/validate.mjs)
  function textUnits(t) { var n = 0; String(t || '').replace(/[\s\S]/g, function (c) { n += /[\u2E80-\uFFEF]|[\uD800-\uDBFF]/.test(c) ? 1 : 0.58; return c; }); return n; }

  // ------------------------------------------------------------------
  // Language: CFG.lang ('zh-CN', 'en', 'ja'…) picks the built-in wording; CFG.ui overrides any of it
  // ------------------------------------------------------------------
  var LANG = CFG.lang || 'zh-CN', ZH = /^zh/i.test(LANG), JA = /^ja/i.test(LANG);
  var LIST_SEP = ZH || JA ? '、' : ', ';
  function T(zh, en) { return ZH ? zh : en; }
  var UI = {
    next: T('下一站', 'Next'), go: T('出发', "Let's go"), finish: T('结束今天 ♥', 'End of our day ♥'),
    walkingTo: T('🚶 正在前往', '🚶 Heading to'), walkingBack: T('🚶 回到', '🚶 Back to'),
    prev: T('上一站', 'Previous stop'), home: T('回到封面', 'Back to the cover'), music: T('背景音乐', 'Music'), stage: T('旅程', 'Our day'),
    hintMouse: T('可以点按钮，或用键盘 ← → 前进后退', 'Click the buttons or use the ← → keys'),
    hintTouch: T('点按钮或左右滑动，就能往前走', 'Tap the buttons or swipe to move along'),
    snooze: T('Zzz… 再睡五分钟', 'Zzz… five more minutes'), morning: T('早安呀☀️', 'Good morning ☀️'),
    pickOne: T('先选一个嘛～', 'Pick one first~'), taskDone: T('打卡成功 ✓', 'Done ✓'),
    slowNet: T('网络有点慢，会自动补发的～', "Slow network — it'll resend by itself"), nextTime: T('下一次：', 'Next time: '),
    stamp: T('准', 'YES'), ready: T('准备好了吗？', 'Ready?'), yes: T('准备好啦！', "I'm ready!"), no: T('不去了', 'Nope'),
    approve: T('准了', 'Approved'), feedback: T('发表些建设性意见', 'I have suggestions'), replay: T('↺ 再走一遍', '↺ Once more'),
    send: T('提交', 'Send'), cancel: T('算了', 'Never mind'), approved: T('就这么定啦 ♥', "It's a date ♥"), thanks: T('意见已收到！', 'Got it, thank you!'),
    feedbackEmpty: T('写点什么嘛～', 'Write something~'), verdictFeedback: T('建设性意见', 'Suggestions'),
    dateTitle: T('哪天出发？', 'Which day?'), dateGo: T('就这天出发 →', 'This day →'), dateChosen: T('就这天！', "That's the day!"),
    dateSay: T('就 {d} 啦！', '{d} it is!'), dateOff: T('这天不行哦', "That day isn't available"), datePickFirst: T('先选一天嘛', 'Pick a day first'),
    unavailable: T('不可选', 'unavailable'), prevMonth: T('上个月', 'Previous month'), nextMonth: T('下个月', 'Next month'),
    dietOther: T('其他忌口', 'Other'), dietNone: T('都可以', 'Anything'), dietSend: T('就这些', "That's all"), dietCancel: T('再想想', 'Not now'), dietSummary: T('忌口：', 'Avoid: '),
  };
  // built-in Japanese (other languages: set every key in CFG.ui; references/config.md has the list)
  if (JA) {
    var JA_UI = {
      next: '次へ', go: '出発', finish: '今日はおしまい ♥', walkingTo: '🚶 {name}へ向かっています…', walkingBack: '🚶 {name}にもどっています…',
      prev: '前へ', home: '表紙にもどる', music: '音楽', stage: 'ふたりの一日',
      hintMouse: 'ボタンか、キーボードの ← → で進んでね', hintTouch: 'ボタンを押すか、左右にスワイプして進んでね',
      snooze: 'Zzz… あと5分だけ', morning: 'おはよう☀️', pickOne: '先にひとつ選んでね〜', taskDone: 'クリア ✓',
      slowNet: '電波が弱いみたい。あとで自動で送るね〜', nextTime: '次は：', stamp: '承認',
      ready: '準備はいい？', yes: '行く！', no: '行かない', approve: 'OK！', feedback: 'ちょっと提案がある', replay: '↺ もう一回',
      send: '送る', cancel: 'やっぱりいい', approved: '決まり ♥', thanks: '受け取ったよ、ありがとう！', feedbackEmpty: 'なにか書いてね〜', verdictFeedback: '提案あり',
      dateTitle: 'どの日にする？', dateGo: 'この日に決まり →', dateChosen: 'この日！', dateSay: '{d}に決まり！', dateOff: 'この日はダメなんだ',
      datePickFirst: '先に日にちを選んでね', unavailable: '選べません', prevMonth: '前の月', nextMonth: '次の月',
      dietOther: 'その他', dietNone: 'なんでもOK', dietSend: 'これで全部', dietCancel: 'あとで', dietSummary: '苦手：',
    };
    Object.keys(JA_UI).forEach(function (k) { UI[k] = JA_UI[k]; });
  }
  Object.keys(CFG.ui || {}).forEach(function (k) { UI[k] = CFG.ui[k]; });
  if (UI.hint == null) UI.hint = finePointer ? UI.hintMouse : UI.hintTouch;
  // "🚶 Heading to" + name, or a template with {name} for other word orders ("🚶 {name}へ…")
  function caption(tpl, name) { return /\{name\}/.test(tpl) ? tpl.replace('{name}', name) : tpl + ' ' + name + ' …'; }
  // localStorage keys; change CFG.storageKey if two sites share one domain
  var KEY = (CFG.storageKey || 'odd') + '-';
  function load(k, def) { try { var v = JSON.parse(localStorage.getItem(KEY + k)); return v == null ? def : v; } catch (e) { return def; } }
  function store(k, v) { try { localStorage.setItem(KEY + k, JSON.stringify(v)); } catch (e) { /* storage unavailable */ } }

  // Her answers for this run-through (date, choices…); kept locally, sent once at the end.
  var A = load('answers', {}) || {};
  function saveAnswers() { store('answers', A); }

  // Dates she can pick: datePick.dates ['2026-10-01', …], or from/to, or year+month+days
  var DP = CFG.datePick || null, DATES = [];
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function isoOf(dt) { return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate()); }
  function dateOf(iso) { var p = String(iso).split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); }
  if (DP) {
    if (DP.dates) DATES = DP.dates.map(function (d) { return isoOf(dateOf(d)); });
    else if (DP.from && DP.to) for (var dd = dateOf(DP.from); dd <= dateOf(DP.to) && DATES.length < 400; dd.setDate(dd.getDate() + 1)) DATES.push(isoOf(dd));
    else if (DP.year && DP.month && DP.days) DATES = DP.days.map(function (d) { return isoOf(new Date(DP.year, DP.month - 1, d)); });
    DATES.sort();
    if (!DATES.length) DP = null;
  }
  if (!DP || DATES.indexOf(A.day) < 0) delete A.day;
  function dayLabel(iso, short) {
    if (!DP || !iso) return '';
    var dt = dateOf(iso), m = dt.getMonth() + 1, d = dt.getDate();
    if (ZH) return short ? m + '/' + d : m + '月' + d + '日（周' + '日一二三四五六'[dt.getDay()] + '）';
    try { return dt.toLocaleDateString(LANG, short ? { month: 'numeric', day: 'numeric' } : { weekday: 'short', month: 'short', day: 'numeric' }); } catch (e) { return m + '/' + d; }
  }
  function choiceOf(i) { return SCN[i] && SCN[i].choice; }
  function missingChoice(i) { var c = choiceOf(i); return !!(c && !A[c.key]); }
  function optionFor(key) {
    for (var i = 0; i < N; i++) {
      var c = SCN[i].choice;
      if (c && c.key === key) for (var k = 0; k < c.options.length; k++) if (c.options[k].id === A[key]) return c.options[k];
    }
    return null;
  }
  function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ------------------------------------------------------------------
  // Build scenes
  // ------------------------------------------------------------------
  function extraHTML(e) {
    return '<div class="fx ' + e.cls + '" style="left:' + (e.x / 24) + '%;top:' + (e.y / 10) + '%;width:' + (e.w / 24) + '%;height:' + (e.h / 10) + '%;' + (e.style || '') + '">' + e.html + '</div>';
  }

  var scenes = SCN.map(function (sc, i) {
    if (!Art.scenes[sc.bg]) console.warn('[trip] unknown bg "' + sc.bg + '" at stop ' + (i + 1) + '; using "park". Built-in: ' + Object.keys(Art.scenes).join(', '));
    var art = (Art.scenes[sc.bg] || Art.scenes.park || Art.scenes.riverside)('s' + i + '-', sc);
    var back = document.createElement('div'), front = document.createElement('div');
    back.className = 'scene scene-back bg-' + sc.bg;
    front.className = 'scene scene-front bg-' + sc.bg;
    back.style.background = sc.sky || art.sky;
    var layers = art.layers.map(function (L) {
      var el = document.createElement('div');
      el.className = 'layer' + (L.prop ? ' prop' : '');
      el.innerHTML = (L.svg ? '<svg viewBox="0 0 2400 1000" preserveAspectRatio="none" aria-hidden="true">' + L.svg + '</svg>' : '') +
        (L.extras || []).map(extraHTML).join('');
      (L.front ? front : back).appendChild(el);
      return { el: el, depth: L.depth, prop: !!L.prop };
    });
    $('#scenes-back').appendChild(back);
    $('#scenes-front').appendChild(front);
    var obj = { cfg: sc, back: back, front: front, layers: layers, visible: true, special: null, hasImage: false };

    if (sc.bgImage) {
      var img = new Image();
      img.onload = function () {
        var el = document.createElement('div');
        el.className = 'layer image-layer';
        el.style.backgroundImage = 'url("' + sc.bgImage + '")';
        back.insertBefore(el, back.firstChild);
        layers.unshift({ el: el, depth: 0.25, image: true, ar: img.naturalWidth / img.naturalHeight, ground: sc.groundY || 0.82 });
        obj.hasImage = true;
        back.classList.add('has-image'); front.classList.add('has-image');
        layout();
      };
      img.src = sc.bgImage;
    }
    return obj;
  });

  // ------------------------------------------------------------------
  // Couple
  // ------------------------------------------------------------------
  var couple = new window.TripCouple.CoupleView($('#couple'));
  var coverCouple = new window.TripCouple.CoupleView($('#cover-couple'));
  coverCouple.setPose('stand');

  var chars = CFG.characters || {};
  var poseList = (chars.poses && chars.poses.list) || [];
  function poseIndex(name) {
    for (var k = 0; k < poseList.length; k++) if (poseList[k].name === name) return k;
    return null;
  }
  Promise.all([window.TripSprite.load(chars.walk), window.TripSprite.load(chars.idle), window.TripSprite.load(chars.poses)]).then(function (r) {
    if (!r[0]) return;
    couple.setSprites(r[0], r[1]);
    coverCouple.setSprites(r[0], r[1]);
    if (r[2]) {
      couple.setPoses(r[2]);
      coverCouple.setPoses(r[2]);
      coverCouple.showPose(poseIndex(chars.coverPose));
    }
    if (/debug/.test(location.search)) console.info('[sprite] walk', r[0].report, 'idle', r[1] && r[1].report, 'poses', r[2] && r[2].report);
    if (S.started) applyIdle(S.here);
    layout();
  });
  scenes.forEach(function (sc) {
    var sp = sc.cfg.idle && sc.cfg.idle.sprite;
    if (!sp) return;
    window.TripSprite.load(sp).then(function (res) {
      if (!res) return;
      sc.special = res;
      if (S.started && S.here === scenes.indexOf(sc) && !S.anim) applyIdle(S.here);
    });
  });

  // What the couple does while standing in scene i.
  function idleOf(i) {
    var sc = scenes[i], type = (sc.cfg.idle && sc.cfg.idle.type) || 'stand';
    if (type === 'sleep') {
      if (S.awake) return { pose: 'stand' };
      if (sc.special) return { pose: 'special' };
      if (sc.hasImage || couple.usesSprites()) return { pose: 'stand', drowsy: true };
      return { pose: 'hidden', sleeping: true };
    }
    if (sc.special) return { pose: 'special' };
    return { pose: type };
  }

  function applyIdle(i) {
    if (i < 0) return;
    var st = idleOf(i), sc = scenes[i], idle = sc.cfg.idle || {};
    couple.showPose(couple.usesSprites() ? poseIndex(idle.pose) : null);
    // how far to lower the couple behind a table (fraction of their height)
    S.lower = idle.lower != null ? idle.lower : (couple.poseIndex != null ? 0 : 0.13);
    couple.el.style.setProperty('--sit', (S.coupleH * S.lower) + 'px');
    sc.back.classList.toggle('sleeping', !!st.sleeping);
    // the drawn bed only holds the built-in pair; with any sprite, show it empty
    if (sc.cfg.idle && sc.cfg.idle.type === 'sleep') sc.back.classList.toggle('awake', !st.sleeping);
    [sc.back, sc.front].forEach(function (el) { el.classList.toggle('has-special', st.pose === 'special'); });
    if (st.pose === 'special') {
      var h = (sc.cfg.idle.sprite.height || CFG.characters.height || 0.34) * 1000 * S.scale;
      couple.setSpecial(sc.special, h);
      couple.setPose('special');
    } else {
      couple.setSpecial(null);
      couple.setPose(st.pose);
    }
    if (st.drowsy) say(UI.snooze, 2600);
  }

  // ------------------------------------------------------------------
  // Layout
  // ------------------------------------------------------------------
  function layout() {
    var W = stage.clientWidth, H = stage.clientHeight;
    S.W = W; S.H = H;
    var layerH = Math.max(H, W / 2.4), layerW = layerH * 2.4;
    S.scale = layerH / 1000;
    S.baseline = H - (1000 - Art.GROUND_Y) * S.scale;
    scenes.forEach(function (sc) {
      sc.layers.forEach(function (L) {
        var s = L.el.style;
        if (L.image) {
          // Generated background: cover the screen with a little parallax margin and put
          // the image's ground line (L.ground, fraction of its height) under the couple's feet.
          var hi = Math.max(H, 1.15 * W / L.ar, S.baseline / L.ground, (H - S.baseline) / (1 - L.ground));
          s.width = (hi * L.ar) + 'px'; s.height = hi + 'px';
          s.left = ((W - hi * L.ar) / 2) + 'px';
          s.top = (S.baseline - L.ground * hi) + 'px';
          s.bottom = 'auto';
          return;
        }
        s.width = layerW + 'px'; s.height = layerH + 'px';
        s.left = ((W - layerW) / 2) + 'px';
        s.fontSize = (S.scale * 100) + 'px';
      });
    });
    S.coupleH = (chars.height || 0.34) * 1000 * S.scale;
    couple.layout(S.coupleH);
    couple.el.style.setProperty('--sit', (S.coupleH * (S.lower || 0)) + 'px');
    couple.el.style.setProperty('--h', S.coupleH + 'px');
    actor.style.left = (W / 2) + 'px';
    actor.style.top = S.baseline + 'px';
    var cw = couple.width();
    $('#actor-shadow').style.width = (cw * 1.1) + 'px';
    $('#actor-shadow').style.height = (cw * 0.16) + 'px';
    bubble.style.bottom = (S.coupleH + 14) + 'px';
    // how far the ground scrolls for one scene; bounded so layers always cover the screen
    S.travel = Math.min((W + layerW) / 2, 1.1 * H, 1.25 * W + 200);
    var coverH = Math.min(window.innerHeight * 0.26, 240);
    coverCouple.layout(coverH);
    if (S.here >= 0 && couple.specialSprite) applyIdle(S.here);
    scenes.forEach(function (sc, i) { var c = choiceOf(i); if (c && A[c.key] && sc.back.querySelector('[data-drive]')) driveIn(sc, A[c.key]); });
    render();
  }

  // Ground speed (px/s) at which the feet don't slide.
  function footSpeed() {
    if (couple.usesSprites()) {
      var w = couple.walkSprite;
      return S.coupleH * (chars.walk.stride || 0.6) * w.fps / w.frames.length;
    }
    // built-in rig: leg 142u, ±24°, half stride = 0.36s, rig height 392u
    return 2 * 142 * Math.sin(24 * Math.PI / 180) / 0.36 * (S.coupleH / 392);
  }

  // ------------------------------------------------------------------
  // Movement
  // ------------------------------------------------------------------
  // velocity: accelerate 22%, cruise, decelerate 22%
  function ease(t) {
    var a = 0.22, v = 1 / (1 - a);
    if (t < a) return v * t * t / (2 * a);
    if (t > 1 - a) return 1 - v * (1 - t) * (1 - t) / (2 * a);
    return v * (t - a / 2);
  }

  function goTo(target) {
    target = clamp(target, 0, N - 1);
    for (var k = Math.max(0, Math.ceil(S.p)); k < target; k++) {
      if (missingChoice(k)) { target = k; S.nudgeOnArrive = true; break; }
    }
    if (target === S.p && !S.anim) { if (S.nudgeOnArrive) { S.nudgeOnArrive = false; nudgeChoice(); } return; }
    var dist = Math.abs(target - S.p);
    var base = clamp(S.travel / (0.94 * footSpeed()), 2.8, 5);
    if (reduceMotion) base = 1.4;
    var dur = base * (dist <= 1 ? Math.max(dist, 0.35) : 1 + (dist - 1) * 0.55);
    var dir = target > S.p ? 1 : -1;
    S.anim = { from: S.p, to: target, t0: performance.now(), dur: dur * 1000 };
    depart(dir, target);
  }

  function depart(dir, target) {
    var from = S.here;
    if (S.here >= 0) {
      scenes[S.here].back.classList.remove('is-here');
      scenes[S.here].front.classList.remove('is-here');
      scenes[S.here].back.classList.remove('sleeping');
    }
    S.here = -1;
    couple.setSpecial(null);
    couple.setPose('walk');
    couple.setFacing(dir);
    couple.setWalking(true);
    $('#card').classList.add('out');
    var note = $('#walking-note');
    var how = dir > 0 && from >= 0 && choiceOf(from) ? optionFor(choiceOf(from).key) : null;
    note.textContent = caption(how && how.travel ? how.travel : dir > 0 ? UI.walkingTo : UI.walkingBack, SCN[target].name || SCN[target].title);
    note.hidden = false;
    updateControls();
  }

  function arrive(i) {
    S.here = i;
    couple.setWalking(false);
    couple.setFacing(1);
    scenes[i].back.classList.add('is-here');
    scenes[i].front.classList.add('is-here');
    applyIdle(i);
    $('#walking-note').hidden = true;
    showCard(i);
    updateControls();
    S.idleHeart = performance.now() + 1800;
    if (S.nudgeOnArrive) {
      S.nudgeOnArrive = false;
      setTimeout(function () { if (S.here === i && !S.anim && missingChoice(i)) nudgeChoice(); }, 500);
    }
  }

  function next() {
    if (!S.started || S.anim) return;
    var i = S.here;
    if (i === 0 && !S.awake) return wake();
    if (missingChoice(i)) return nudgeChoice();
    if (i === N - 1) return showEnding();
    goTo(i + 1);
  }
  function prev() {
    if (!S.started || S.anim || S.here <= 0) return;
    goTo(S.here - 1);
  }

  function wake(then) {
    S.awake = true;
    var sc = scenes[0];
    sc.back.classList.remove('sleeping');
    sc.back.classList.add('awake');
    couple.setSpecial(null);
    couple.setPose('stand');
    couple.el.classList.remove('pop'); void couple.el.offsetWidth; couple.el.classList.add('pop');
    say(pick(SCN[0].lines) || UI.morning, 1400);
    hearts(4);
    var run = S.run;
    setTimeout(function () {
      if (S.run !== run || !S.started) return;           // went home / restarted meanwhile
      then ? then() : goTo(1);
    }, 1100);
  }

  // ------------------------------------------------------------------
  // Render loop
  // ------------------------------------------------------------------
  function render() {
    var p = S.p, lo = Math.floor(p), hi = Math.min(N - 1, Math.ceil(p));
    scenes.forEach(function (sc, i) {
      var vis = i === lo || i === hi;
      if (vis !== sc.visible) {
        sc.back.style.display = sc.front.style.display = vis ? '' : 'none';
        sc.visible = vis;
      }
      if (!vis) return;
      var rel = i - p;
      sc.layers.forEach(function (L) {
        var tx = rel * S.travel * L.depth + S.ptr.x * L.depth * 18;
        var ty = S.ptr.y * L.depth * 8;
        L.el.style.transform = 'translate3d(' + tx.toFixed(1) + 'px,' + ty.toFixed(1) + 'px,0)';
      });
      var m = '';
      if (i === hi && hi !== lo) {
        var edge = (hi - p) * S.W, F = S.W * 0.3;
        m = 'linear-gradient(90deg, transparent ' + (edge - F / 2).toFixed(1) + 'px, #000 ' + (edge + F / 2).toFixed(1) + 'px)';
      }
      if (sc.mask !== m) {
        sc.mask = m;
        [sc.back, sc.front].forEach(function (el) { el.style.webkitMaskImage = m; el.style.maskImage = m; });
      }
    });
    actor.style.transform = 'translate3d(' + (S.ptr.x * 18).toFixed(1) + 'px,' + (S.ptr.y * 8).toFixed(1) + 'px,0)';
    updateClock();
  }

  var lastT = performance.now();
  function tick(now) {
    var dt = clamp((now - lastT) / 1000, 0, 0.1);
    lastT = now;
    if (S.anim) {
      var a = S.anim, t = (now - a.t0) / a.dur;
      if (t >= 1) { S.p = a.to; S.anim = null; arrive(a.to); }
      else S.p = a.from + (a.to - a.from) * ease(t);
    }
    var speed = dt > 0 ? Math.abs(S.p - S.lastP) / dt : 0;
    S.lastP = S.p;
    if (S.anim) couple.setRate(clamp(speed * S.travel / footSpeed(), 0.55, 1.7));
    // soft pointer parallax
    S.ptr.x += (S.ptr.tx - S.ptr.x) * Math.min(1, dt * 4);
    S.ptr.y += (S.ptr.ty - S.ptr.y) * Math.min(1, dt * 4);
    render();
    couple.update(dt);
    if (!$('#cover').hidden) coverCouple.update(dt);
    if (S.started && !S.anim && S.here >= 0 && now > S.idleHeart && couple.pose !== 'hidden') {
      hearts(1);
      S.idleHeart = now + 3200 + Math.random() * 2500;
    }
    requestAnimationFrame(tick);
  }

  // ------------------------------------------------------------------
  // HUD / card / controls
  // ------------------------------------------------------------------
  function toMin(t) { var m = /(\d+):(\d+)/.exec(t || ''); return m ? +m[1] * 60 + +m[2] : 0; }
  function updateClock() {
    var lo = Math.floor(S.p), hi = Math.min(N - 1, lo + 1), f = S.p - lo;
    var m = Math.round(toMin(SCN[lo].time) + (toMin(SCN[hi].time) - toMin(SCN[lo].time)) * f);
    var txt = String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
    if (txt !== S.clock) {
      S.clock = txt;
      $('#clock-text').textContent = txt;
      var hr = Math.floor(m / 60);
      $('.clock-ico').textContent = hr < 12 ? '☀️' : hr < 17 ? '🌤️' : hr < 19 ? '🌇' : '🌙';
    }
    var pr = $('#stops-progress');
    if (pr) pr.style.width = (N > 1 ? S.p / (N - 1) * 100 : 0) + '%';
  }

  function buildHud() {
    var ol = $('#stops');
    ol.innerHTML = '<li class="track" aria-hidden="true"><i id="stops-progress"></i></li>' + SCN.map(function (sc, i) {
      return '<li><button class="stop" data-i="' + i + '" style="--accent:' + (sc.accent || '#FF7F9D') + '"><span class="stop-ico">' + sc.icon + '</span><span class="stop-name">' + esc(sc.name || sc.title) + '</span></button></li>';
    }).join('');
    ol.addEventListener('click', function (e) {
      var b = e.target.closest('.stop');
      if (!b || !S.started) return;
      var i = +b.dataset.i;
      if (i === S.here && !S.anim) return;
      if (!S.awake && S.here === 0 && !S.anim) return wake(function () { goTo(i); });
      S.awake = true;
      scenes[0].back.classList.add('awake');
      goTo(i);
    });
  }

  function choose(id) {
    if (S.here < 0) return;
    var c = choiceOf(S.here), sc = scenes[S.here], opt = null;
    if (!c) return;
    c.options.forEach(function (o) { if (o.id === id) opt = o; });
    if (!opt) return;
    A[c.key] = id;
    saveAnswers();
    document.querySelectorAll('#card-tasks .choice').forEach(function (b) {
      var on = b.dataset.id === id;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    });
    c.options.forEach(function (o) { sc.back.classList.remove('pick-' + o.id); });
    void sc.back.offsetWidth;
    sc.back.classList.add('pick-' + id);
    driveIn(sc, id);
    vehiclePop(opt.icon);
    if (id === 'bike') setTimeout(function () { sweat(); }, 500);
    say(opt.say, 2000);
    hearts(2);
  }
  function nudgeChoice() {
    var c = choiceOf(S.here), list = $('#card-tasks');
    if (!c) return;
    list.classList.remove('shake'); void list.offsetWidth; list.classList.add('shake');
    say(c.ask || UI.pickOne, 1800);
    toast(c.ask || UI.pickOne);
  }
  // The picked vehicle (taxi / bikes) pulls up next to the couple. On phones the street is
  // much wider than the screen, so without this they'd be parked off to the right, unseen.
  function driveIn(sc, id) {
    var left = (S.W - 2400 * S.scale) / 2;
    sc.back.querySelectorAll('[data-drive]').forEach(function (g) {
      var dx = 0;
      if (g.getAttribute('data-drive') === id) {
        var x = left + parseFloat(g.getAttribute('data-x')) * S.scale;
        dx = Math.min(0, S.W * 0.64 - x) / S.scale;
      }
      g.style.transform = dx ? 'translateX(' + dx.toFixed(1) + 'px)' : '';
    });
  }
  function vehiclePop(icon) {
    var el = document.createElement('span');
    el.className = 'vehicle';
    el.textContent = icon;
    el.style.left = (S.W / 2 + couple.width() * 0.62) + 'px';
    el.style.top = (S.baseline - S.coupleH * 0.28) + 'px';
    el.style.fontSize = Math.max(40, S.coupleH * 0.24) + 'px';
    $('#hearts').appendChild(el);
    setTimeout(function () { el.remove(); }, 2600);
  }
  function sweat() {
    for (var k = 0; k < 3; k++) {
      var h = document.createElement('span');
      h.className = 'heart';
      h.textContent = '💦';
      h.style.left = (S.W / 2 + (k - 1) * S.coupleH * 0.18) + 'px';
      h.style.top = (S.baseline - S.coupleH * 0.95) + 'px';
      h.style.setProperty('--dx', ((k - 1) * 30) + 'px');
      h.style.animationDelay = (k * 0.15) + 's';
      h.style.fontSize = Math.max(18, S.coupleH * 0.07) + 'px';
      $('#hearts').appendChild(h);
      setTimeout(h.remove.bind(h), 2800);
    }
  }

  function taskState() {
    return load('tasks', {}) || {};
  }
  function saveTasks(st) { store('tasks', st); }

  function showCard(i) {
    var sc = SCN[i], card = $('#card');
    document.documentElement.style.setProperty('--accent', sc.accent || '#FF7F9D');
    $('#card-time').textContent = sc.icon + ' ' + (A.day ? dayLabel(A.day, true) + ' ' : '') + sc.time;
    $('#card-place').textContent = sc.place || '';
    $('#card-title').textContent = sc.title;
    $('#card-title').classList.toggle('long', textUnits(sc.title) > 9.5);
    $('#card-text').textContent = sc.text || '';
    var done = taskState()[sc.id] || [];
    $('#card-tasks').innerHTML = (sc.tasks || []).map(function (t, k) {
      return '<li><button class="task' + (done[k] ? ' done' : '') + '" data-k="' + k + '"><span class="tick">' + (done[k] ? '✓' : '') + '</span>' + esc(t) + '</button></li>';
    }).join('') + (sc.diet ? '<li class="diet-li"><button class="diet-btn" id="diet-open"></button></li>' : '');
    if (sc.choice) {        // the choice comes first; any tasks follow it
      $('#card-tasks').insertAdjacentHTML('afterbegin', sc.choice.options.map(function (o) {
        var on = A[sc.choice.key] === o.id;
        return '<li><button class="choice' + (on ? ' on' : '') + '" data-id="' + esc(o.id) + '" aria-pressed="' + on + '"><span class="choice-ico">' + (o.icon || '') + '</span>' + esc(o.label) + '</button></li>';
      }).join(''));
    }
    if (sc.diet) renderDietRow();
    card.hidden = false;
    card.classList.remove('out', 'in'); void card.offsetWidth; card.classList.add('in');
    document.querySelectorAll('.stop').forEach(function (b, k) {
      b.classList.toggle('active', k === i);
      b.classList.toggle('visited', k < i);
    });
  }

  $('#card-tasks').addEventListener('click', function (e) {
    if (e.target.closest('.diet-btn')) return openDiet();
    var cb = e.target.closest('.choice');
    if (cb) return choose(cb.dataset.id);
    var b = e.target.closest('.task');
    if (!b || S.here < 0) return;
    var id = SCN[S.here].id, st = taskState(), k = +b.dataset.k;
    st[id] = st[id] || [];
    st[id][k] = !st[id][k];
    saveTasks(st);
    b.classList.toggle('done', st[id][k]);
    b.querySelector('.tick').textContent = st[id][k] ? '✓' : '';
    if (st[id][k]) { hearts(3); toast(UI.taskDone); }
  });

  function updateControls() {
    var i = S.here, nb = $('#next-btn'), pb = $('#prev-btn');
    pb.hidden = i <= 0;
    nb.disabled = i < 0;
    if (i < 0) return;
    var sc = SCN[i];
    if (i === 0 && !S.awake) nb.innerHTML = esc(sc.nextLabel || UI.go) + ' →';
    else if (i === N - 1) nb.innerHTML = esc(sc.nextLabel || UI.finish);
    else nb.innerHTML = '<span class="lbl">' + esc(UI.next) + '</span> ' + esc(SCN[i + 1].name || SCN[i + 1].title) + ' →';
  }

  // ------------------------------------------------------------------
  // Little effects
  // ------------------------------------------------------------------
  var bubbleTimer;
  function say(text, ms) {
    if (!text) return;
    bubble.textContent = text;
    bubble.style.bottom = (S.coupleH + 14) + 'px';
    var card = $('#card');
    if (!card.hidden && !card.classList.contains('out')) {       // short screens: don't hide under the card
      var over = card.getBoundingClientRect().bottom + 8 - bubble.getBoundingClientRect().top;
      if (over > 0) bubble.style.bottom = Math.max(S.coupleH * 0.35, S.coupleH + 14 - over) + 'px';
    }
    bubble.classList.remove('show'); void bubble.offsetWidth; bubble.classList.add('show');
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () { bubble.classList.remove('show'); }, ms || 1800);
  }
  function pick(arr) { return arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''; }

  function hearts(n) {
    var box = $('#hearts');
    var x = S.W / 2 + S.ptr.x * 18, y = S.baseline - S.coupleH * 0.55;
    for (var k = 0; k < n; k++) {
      var h = document.createElement('span');
      h.className = 'heart';
      h.textContent = ['💗', '💕', '❤️', '💖'][Math.floor(Math.random() * 4)];
      h.style.left = (x + (Math.random() - 0.5) * S.coupleH * 0.4) + 'px';
      h.style.top = y + 'px';
      h.style.setProperty('--dx', ((Math.random() - 0.5) * 80) + 'px');
      h.style.animationDelay = (k * 0.12) + 's';
      h.style.fontSize = (14 + Math.random() * 14) * clamp(S.scale * 1.4, 0.8, 1.6) + 'px';
      box.appendChild(h);
      setTimeout(h.remove.bind(h), 2600 + k * 120);
    }
  }

  var toastTimer;
  function toast(t) {
    var el = $('#toast');
    el.textContent = t; el.hidden = false;
    el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.hidden = true; }, 1600);
  }

  // ------------------------------------------------------------------
  // Cover & ending
  // ------------------------------------------------------------------
  function buildCover() {
    $('#cover-art').innerHTML = Art.cover('cv-');
    $('#cover-title').textContent = CFG.title;
    $('#cover-sub').textContent = CFG.subtitle || '';
    var n = CFG.names || {}, n1 = n.a || n.his, n2 = n.b || n.hers;
    $('#cover-date').textContent = [CFG.date, n1 && n2 ? n1 + ' ♥ ' + n2 : ''].filter(Boolean).join('  ·  ');
    document.title = CFG.title;
    document.documentElement.lang = LANG;
    var c = CFG.cover || {};
    $('#cover-q').textContent = c.question || UI.ready;
    $('#start-btn').textContent = c.yes || UI.yes;
    $('#nope-btn').innerHTML = '<span>' + esc(c.no || UI.no) + '</span>';
    $('#nope-btn').hidden = c.no === '';
    $('#cover-hint').textContent = c.hint != null ? c.hint : UI.hint;
    var e = CFG.ending || {};
    $('#ending-title').textContent = e.title || '';
    $('#ending-ask').textContent = e.question || '';
    $('#approve-btn').textContent = e.approve || UI.approve;
    $('#feedback-btn').textContent = e.feedback || UI.feedback;
    $('#replay-btn').textContent = e.replay || UI.replay;
    $('#feedback-title').textContent = e.feedbackTitle || '';
    $('#feedback-sub').textContent = e.feedbackHint || '';
    $('#feedback-send').textContent = e.send || UI.send;
    $('#feedback-cancel').textContent = e.cancel || UI.cancel;
    $('#stamp span').textContent = e.stamp || UI.stamp;
    $('#stamp').classList.toggle('wide', textUnits(e.stamp || UI.stamp) > 1.2);
    $('#stage').setAttribute('aria-label', UI.stage);
    $('#prev-btn').setAttribute('aria-label', UI.prev);
    $('#home-btn').setAttribute('aria-label', UI.home);
    $('#music-btn').setAttribute('aria-label', UI.music);
    $('#diet-other').setAttribute('aria-label', UI.dietOther);
  }

  function start(at) {
    at = clamp(at || 0, 0, N - 1);
    S.started = true;
    S.flowDone = null;
    S.run = (S.run || 0) + 1;
    S.runId = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6);
    S.awake = at > 0;
    scenes[0].back.classList.toggle('awake', S.awake);
    S.p = at; S.lastP = at; S.anim = null;
    var cover = $('#cover');
    cover.classList.add('leaving');
    setTimeout(function () { cover.hidden = true; cover.classList.remove('leaving'); }, 700);
    ['#hud', '#controls'].forEach(function (s) { $(s).hidden = false; });
    $('#ending').hidden = true;
    arrive(at);
    showMusicButton();
    playMusic();
  }

  function goHome() {
    S.started = false;
    S.run = (S.run || 0) + 1;
    S.anim = null;
    $('#ending').hidden = true;
    $('#feedback').hidden = true;
    $('#diet').hidden = true;
    $('#datepick').hidden = true;
    ['#hud', '#controls', '#card', '#walking-note'].forEach(function (s) { $(s).hidden = true; });
    $('#cover').hidden = false;
    couple.setWalking(false);
  }

  // Everything she picked along the way: the date, every stop's `choice`, and 忌口/diet.
  function choiceKeys() { var ks = []; SCN.forEach(function (sc) { if (sc.choice && ks.indexOf(sc.choice.key) < 0) ks.push(sc.choice.key); }); return ks; }
  function answerFields() {
    var d = dietSaved(), f = { date: dayLabel(A.day), diet: d ? dietText(d) : '' };
    choiceKeys().forEach(function (k) { var o = optionFor(k); f[k] = o ? o.label : ''; });
    return f;
  }
  function answerChips() {
    var f = answerFields(), parts = [f.date && '🗓️ ' + f.date];
    choiceKeys().forEach(function (k) { var o = optionFor(k); if (o) parts.push((o.icon ? o.icon + ' ' : '') + o.label); });
    parts.push(f.diet && dietIcon() + ' ' + (dietCfg.summary || UI.dietSummary) + f.diet);
    return parts.filter(Boolean);
  }
  function renderSummary() {
    var el = $('#ending-summary'), parts = answerChips();
    el.hidden = !parts.length || (CFG.ending || {}).summary === false;
    el.innerHTML = parts.map(function (p) { return '<span>' + esc(p) + '</span>'; }).join('');
  }
  function showEnding() {
    var el = $('#ending'), done = S.flowDone;
    renderSummary();
    $('#stamp').hidden = done !== 'approved';
    $('#stamp').classList.remove('slam');
    $('#ending-actions').hidden = !!done;
    $('#ending-actions').classList.remove('gone');
    $('#ending-note').hidden = !done;
    $('#replay-btn').hidden = !done;
    $('#next-place').readOnly = !!done;
    $('#next-wrap').classList.toggle('locked', !!done);
    el.hidden = false;
    el.classList.remove('in'); void el.offsetWidth; el.classList.add('in');
    $('#card').classList.add('out');
    for (var k = 0; k < 4; k++) setTimeout(hearts.bind(null, 4), k * 500);
  }

  // ------------------------------------------------------------------
  // Cover: "不去了" can never be clicked — it hops away from the pointer
  // ------------------------------------------------------------------
  var nope = $('#nope-btn'), nopeOff = { x: 0, y: 0 }, lastHop = 0;
  function overlaps(a, b, pad) {
    return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
  }
  function dodge(px, py) {
    var now = Date.now();
    if (now - lastHop < 220 || $('#cover').hidden) return;
    lastHop = now;
    var W = window.innerWidth, H = window.innerHeight;
    // layout position (ignores the transform, which may be mid-animation)
    var pr = nope.offsetParent.getBoundingClientRect();
    var baseX = pr.left + nope.offsetLeft, baseY = pr.top + nope.offsetTop;
    var r = { left: baseX + nopeOff.x, top: baseY + nopeOff.y, width: nope.offsetWidth, height: nope.offsetHeight };
    if (px == null) { px = r.left + r.width / 2; py = r.top + r.height / 2; }
    var avoid = [$('#start-btn').getBoundingClientRect(), $('#cover-title').getBoundingClientRect(), $('#cover-q').getBoundingClientRect()];
    var m = 28, top = 70, best = null, bestD = -1;
    for (var i = 0; i < 48; i++) {
      var x = m + Math.random() * Math.max(1, W - r.width - 2 * m);
      var y = top + Math.random() * Math.max(1, H - r.height - top - m - 20);
      var c = { left: x, top: y, right: x + r.width, bottom: y + r.height };
      if (avoid.some(function (a) { return overlaps(c, a, 14); })) continue;
      var d = Math.sqrt(Math.pow(x + r.width / 2 - px, 2) + Math.pow(y + r.height / 2 - py, 2));
      if (d > Math.min(W, H) * 0.35) { best = c; break; }
      if (d > bestD) { bestD = d; best = c; }
    }
    if (!best) return;
    nopeOff = { x: best.left - baseX, y: best.top - baseY };
    var tilt = ((Math.random() - 0.5) * 26).toFixed(1);
    nope.style.transform = 'translate(' + nopeOff.x.toFixed(0) + 'px,' + nopeOff.y.toFixed(0) + 'px) rotate(' + tilt + 'deg)';
    nope.classList.remove('hop'); void nope.offsetWidth; nope.classList.add('hop');
  }
  nope.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse') dodge(e.clientX, e.clientY); });
  nope.addEventListener('pointerdown', function (e) { e.preventDefault(); dodge(e.clientX, e.clientY); });
  nope.addEventListener('touchstart', function (e) { e.preventDefault(); var t = e.touches[0]; dodge(t.clientX, t.clientY); }, { passive: false });
  nope.addEventListener('click', function (e) { e.preventDefault(); lastHop = 0; dodge(); });
  $('#cover').addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var r = nope.getBoundingClientRect(), pad = 36;
    if (e.clientX > r.left - pad && e.clientX < r.right + pad && e.clientY > r.top - pad && e.clientY < r.bottom + pad) dodge(e.clientX, e.clientY);
  });
  window.addEventListener('resize', function () { nopeOff = { x: 0, y: 0 }; nope.style.transform = ''; });

  // ------------------------------------------------------------------
  // Animated inputs: cycling placeholder, focus glow, sparkles while typing
  // ------------------------------------------------------------------
  var measureCtx = document.createElement('canvas').getContext('2d');
  function fancyInput(wrap, placeholders) {
    var field = wrap.querySelector('input,textarea'), ph = wrap.querySelector('.fancy-ph'), k = 0, holdUntil = 0;
    placeholders = placeholders && placeholders.length ? placeholders : [''];
    function showPh(text) {
      ph.textContent = text || placeholders[k % placeholders.length];
      ph.classList.remove('ph-in'); void ph.offsetWidth; ph.classList.add('ph-in');
    }
    function sync() { wrap.classList.toggle('has-value', !!field.value); }
    showPh();
    setInterval(function () {
      if (Date.now() < holdUntil) return;           // let a "写点什么嘛" hint stay readable
      if (!field.value && wrap.offsetParent !== null && placeholders.length > 1) { k++; showPh(); }
    }, 2800);
    field.addEventListener('focus', function () { wrap.classList.add('focused'); });
    field.addEventListener('blur', function () { wrap.classList.remove('focused'); });
    field.addEventListener('input', function () {
      sync();
      sparkle(wrap, field);
      field.classList.remove('bump'); void field.offsetWidth; field.classList.add('bump');
    });
    return {
      field: field,
      shake: function (msg) {
        if (msg) { showPh(msg); holdUntil = Date.now() + 3500; }
        wrap.classList.remove('shake'); void wrap.offsetWidth; wrap.classList.add('shake');
      },
      clear: function () { field.value = ''; sync(); showPh(); },
      set: function (v) { field.value = v || ''; sync(); holdUntil = 0; showPh(); },
    };
  }
  function sparkle(wrap, field) {
    var cs = getComputedStyle(field), x, y;
    if (field.tagName === 'INPUT') {
      measureCtx.font = cs.fontSize + ' ' + cs.fontFamily;
      var w = measureCtx.measureText(field.value.slice(0, field.selectionStart || field.value.length)).width;
      x = field.offsetLeft + parseFloat(cs.paddingLeft) + Math.min(w - field.scrollLeft, field.clientWidth - 20);
      y = field.offsetTop + field.offsetHeight * 0.35;
    } else {
      x = field.offsetLeft + field.clientWidth * (0.25 + Math.random() * 0.6);
      y = field.offsetTop + Math.min(field.clientHeight - 20, 18 + Math.random() * field.clientHeight * 0.6);
    }
    var sp = document.createElement('span');
    sp.className = 'spark';
    sp.textContent = ['♥', '✦', '✧', '♡', '★'][Math.floor(Math.random() * 5)];
    sp.style.left = x + 'px';
    sp.style.top = y + 'px';
    sp.style.color = ['#FF7F9D', '#FFB547', '#9B6BE0', '#FF5C88'][Math.floor(Math.random() * 4)];
    sp.style.setProperty('--dx', ((Math.random() - 0.5) * 40).toFixed(0) + 'px');
    sp.style.setProperty('--rot', ((Math.random() - 0.5) * 60).toFixed(0) + 'deg');
    wrap.appendChild(sp);
    setTimeout(function () { sp.remove(); }, 950);
  }

  // Hearts that burst out of an element inside an overlay
  function burstFrom(el, n) {
    var box = el.closest('section') || document.body, br = box.getBoundingClientRect(), r = el.getBoundingClientRect();
    for (var k = 0; k < n; k++) {
      var h = document.createElement('span');
      h.className = 'heart';
      h.textContent = ['💗', '💕', '❤️', '💖', '✨'][Math.floor(Math.random() * 5)];
      h.style.left = (r.left - br.left + r.width * (0.2 + Math.random() * 0.6)) + 'px';
      h.style.top = (r.top - br.top + r.height * 0.3) + 'px';
      h.style.setProperty('--dx', ((Math.random() - 0.5) * 160) + 'px');
      h.style.animationDelay = (k * 0.06) + 's';
      h.style.fontSize = (16 + Math.random() * 16) + 'px';
      box.appendChild(h);
      setTimeout(h.remove.bind(h), 2700);
    }
  }

  // ------------------------------------------------------------------
  // Ending: 准了 / 建设性意见 — answers go to Netlify Forms (and a local copy)
  // ------------------------------------------------------------------
  var ED = CFG.ending || {};
  var nextIn = fancyInput($('#next-wrap'), ED.placeholders);
  var fbIn = fancyInput($('#feedback-wrap'), ED.feedbackPlaceholders);

  function sendReply(data) {
    try {
      var log = load('replies', []);
      log.push(Object.assign({ at: new Date().toISOString() }, data));
      store('replies', log);
    } catch (e) { /* storage unavailable */ }
    var fields = { 'form-name': 'trip-reply' };
    Object.keys(data).forEach(function (k) { fields[k] = data[k] == null ? '' : String(data[k]); });
    // one readable line with everything, so nothing is lost even if a field isn't in the form
    fields.summary = answerChips().concat(data.next ? [UI.nextTime + data.next] : [], data.feedback ? ['💬 ' + data.feedback] : []).join(' | ');
    try { fields.at = new Date().toLocaleString(LANG, { hour12: false }); } catch (e) { fields.at = new Date().toISOString(); }
    fields.id = S.runId || '';
    Object.keys(REPLY.extra || {}).forEach(function (k) { fields[k] = REPLY.extra[k]; });
    var body = new URLSearchParams(fields).toString();
    queueReply(body);                 // queued before sending, so closing the page mid-send can't lose it
    return deliver(body);             // resolves 'ok' | 'retry' | 'fail'
  }
  // Where her answers go: reply.to = 'netlify' (Netlify Forms, default), a form-service URL
  // (Formspree, FormSubmit, Getform… any endpoint that accepts a form POST), or 'none'.
  var REPLY = CFG.reply || {}, REPLY_TO = REPLY.to || 'netlify';
  // 'ok' | 'retry' (network or server error: try again later) | 'fail' (e.g. not on Netlify)
  function postForm(body) {
    if (REPLY_TO === 'none') return Promise.resolve('ok');
    var url = REPLY_TO === 'netlify' ? '/' : REPLY_TO, headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    if (url !== '/') headers.Accept = 'application/json';
    return fetch(url, { method: 'POST', keepalive: true, headers: headers, body: body })
      .then(function (r) { return r.ok ? 'ok' : r.status >= 500 ? 'retry' : 'fail'; })
      .catch(function () { return 'retry'; });
  }
  function readOutbox() { try { return JSON.parse(localStorage.getItem(KEY + 'outbox') || '[]'); } catch (e) { return memOutbox.slice(); } }
  function writeOutbox(q) { memOutbox = q.slice(); try { localStorage.setItem(KEY + 'outbox', JSON.stringify(q)); } catch (e) { /* storage unavailable: memory only */ } }
  function queueReply(body) { var q = readOutbox(); if (q.indexOf(body) < 0) { q.push(body); writeOutbox(q); } }
  var memOutbox = [], inflight = {}, retryTimer = null, retryTries = 0;
  function deliver(body) {
    if (inflight[body]) return inflight[body];
    inflight[body] = postForm(body).then(function (res) {
      delete inflight[body];
      if (res === 'retry') { scheduleRetry(); return res; }
      writeOutbox(readOutbox().filter(function (b) { return b !== body; }));
      retryTries = 0;
      return res;
    });
    return inflight[body];
  }
  function flushOutbox() { readOutbox().forEach(function (b) { if (!inflight[b]) deliver(b); }); }
  function scheduleRetry() {
    if (retryTimer) return;
    retryTimer = setTimeout(function () { retryTimer = null; flushOutbox(); }, Math.min(60000, 4000 * Math.pow(2, retryTries++)));
  }
  window.addEventListener('online', flushOutbox);
  window.addEventListener('pageshow', flushOutbox);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) flushOutbox(); });
  setTimeout(flushOutbox, 2500);
  function slowNetworkNote(res) { if (res === 'retry') toast(UI.slowNet); }

  function endingNote(text) {
    var n = $('#ending-note');
    n.textContent = text;
    n.hidden = false;
    n.classList.remove('in'); void n.offsetWidth; n.classList.add('in');
  }

  $('#next-place').addEventListener('keydown', function (e) { if (e.key === 'Enter') this.blur(); });

  $('#approve-btn').addEventListener('click', function () {
    if (S.flowDone) return;                                  // one submission per run-through
    S.flowDone = 'approved';
    var place = nextIn.field.value.trim();
    var f = answerFields();
    f.verdict = ED.approve || UI.approve; f.next = place;
    sendReply(f).then(slowNetworkNote);
    nextIn.field.readOnly = true;
    $('#next-wrap').classList.add('locked');
    var stamp = $('#stamp'), card = $('#ending-card');
    stamp.hidden = false;
    stamp.classList.remove('slam'); void stamp.offsetWidth; stamp.classList.add('slam');
    setTimeout(function () {
      card.classList.remove('thud'); void card.offsetWidth; card.classList.add('thud');
      burstFrom(stamp, 10);
    }, 420);
    $('#ending-actions').classList.add('gone');
    setTimeout(function () {
      $('#ending-actions').hidden = true;
      endingNote((ED.approved || UI.approved) + (place ? '\n' + UI.nextTime + place : ''));
      $('#replay-btn').hidden = false;
    }, 650);
  });

  function openModal(m, focusEl) {
    m._session = (m._session || 0) + 1;
    m.hidden = false;
    m.classList.remove('closing', 'in'); void m.offsetWidth; m.classList.add('in');
    if (focusEl) setTimeout(function () { focusEl.focus(); }, 380);
  }
  function closeModal(m) {
    if (m.hidden || m.classList.contains('closing')) return;
    m.classList.add('closing');
    setTimeout(function () { m.hidden = true; m.classList.remove('closing'); }, 280);
  }
  function modalOpen() { return !$('#feedback').hidden || !$('#diet').hidden || !$('#datepick').hidden; }
  function openFeedback() { if (!S.flowDone) openModal($('#feedback'), fbIn.field); }
  function closeFeedback() { closeModal($('#feedback')); }
  $('#feedback-btn').addEventListener('click', openFeedback);
  $('#feedback-cancel').addEventListener('click', closeFeedback);
  $('#feedback').addEventListener('click', function (e) { if (e.target === this) closeFeedback(); });
  $('#feedback-text').addEventListener('input', function () {
    var c = $('#feedback-count');
    c.textContent = this.value.length;
    c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
  });
  // ------------------------------------------------------------------
  // 选日期: shown over the bedroom right after 准备好啦; only DP.days can be picked
  // ------------------------------------------------------------------
  // months that contain pickable dates, as 'YYYY-MM'
  var calMonths = [], calAt = 0;
  DATES.forEach(function (d) { var m = d.slice(0, 7); if (calMonths.indexOf(m) < 0) calMonths.push(m); });
  function monthTitle(ym) {
    var dt = dateOf(ym + '-01');
    if (ZH) return dt.getFullYear() + '年' + (dt.getMonth() + 1) + '月';
    try { return dt.toLocaleDateString(LANG, { year: 'numeric', month: 'long' }); } catch (e) { return ym; }
  }
  function weekdayRow() {
    if (ZH) return '日一二三四五六'.split('');
    var out = [];
    for (var k = 0; k < 7; k++) { try { out.push(new Date(2023, 0, 1 + k).toLocaleDateString(LANG, { weekday: 'narrow' })); } catch (e) { out.push('SMTWTFS'[k]); } }
    return out;
  }
  function buildCalendar() {
    if (!DP) return;
    if (!$('#cal-grid').dataset.built) {
      $('#cal-grid').dataset.built = '1';
      $('#date-title').textContent = DP.title || UI.dateTitle;
      $('#date-sub').textContent = DP.hint || '';
      $('#date-go').textContent = DP.confirm || UI.dateGo;
      $('.cal-week').innerHTML = weekdayRow().map(function (w) { return '<span>' + esc(w) + '</span>'; }).join('');
      if (A.day) calAt = Math.max(0, calMonths.indexOf(A.day.slice(0, 7)));
    }
    var ym = calMonths[calAt], dt = dateOf(ym + '-01'), y = dt.getFullYear(), mo = dt.getMonth();
    var multi = calMonths.length > 1;
    $('#cal-head').innerHTML = (multi ? '<button type="button" class="cal-nav" data-dir="-1" aria-label="' + esc(UI.prevMonth) + '"' + (calAt ? '' : ' disabled') + '>‹</button>' : '') +
      '<span>' + esc(monthTitle(ym)) + '</span>' +
      (multi ? '<button type="button" class="cal-nav" data-dir="1" aria-label="' + esc(UI.nextMonth) + '"' + (calAt < calMonths.length - 1 ? '' : ' disabled') + '>›</button>' : '');
    var first = dt.getDay(), n = new Date(y, mo + 1, 0).getDate(), html = '', labels = DP.labels || {};
    for (var i = 0; i < first; i++) html += '<span class="cal-blank"></span>';
    for (var d = 1; d <= n; d++) {
      var iso = ym + '-' + pad(d), ok = DATES.indexOf(iso) >= 0, lab = labels[iso] != null ? labels[iso] : labels[d];
      html += '<button type="button" class="cal-day' + (ok ? ' ok' : '') + (iso === A.day ? ' on' : '') + '" data-d="' + iso + '"' + (ok ? ' aria-pressed="' + (iso === A.day) + '"' : ' aria-disabled="true"') +
        ' aria-label="' + esc(dayLabel(iso) || iso) + (ok ? '' : ' (' + esc(UI.unavailable) + ')') + '">' + d + (lab && ok ? '<small>' + esc(lab) + '</small>' : '') + '</button>';
    }
    $('#cal-grid').innerHTML = html;
  }
  function pickDay(d, pop) {
    A.day = d;
    document.querySelectorAll('#cal-grid .cal-day.ok').forEach(function (b) {
      var on = b.dataset.d === d;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on ? 'true' : 'false');
      if (on && pop) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
    });
    var p = $('#date-picked');
    p.textContent = '🗓️ ' + dayLabel(d) + ' · ' + UI.dateChosen;
    p.classList.remove('warn', 'in'); void p.offsetWidth; p.classList.add('in');
    $('#date-go').classList.add('ready');
  }
  function dateHint(text, btn) {
    var p = $('#date-picked');
    p.textContent = text;
    p.classList.remove('in', 'warn'); void p.offsetWidth; p.classList.add('warn');
    if (btn) { btn.classList.remove('nope'); void btn.offsetWidth; btn.classList.add('nope'); }
  }
  function openDatePick() {
    if (!DP) return;
    buildCalendar();
    $('#date-go').classList.remove('ready');
    $('#date-picked').textContent = '';
    if (A.day) pickDay(A.day, false);
    openModal($('#datepick'));
  }
  if (DP) {
    $('#cal-head').addEventListener('click', function (e) {
      var b = e.target.closest('.cal-nav');
      if (!b || b.disabled) return;
      calAt = clamp(calAt + (+b.dataset.dir), 0, calMonths.length - 1);
      buildCalendar();
    });
    $('#cal-grid').addEventListener('click', function (e) {
      var b = e.target.closest('.cal-day');
      if (!b) return;
      if (!b.classList.contains('ok')) return dateHint(DP.disabled || UI.dateOff, b);
      pickDay(b.dataset.d, true);
      var r = b.getBoundingClientRect(), cr = $('#date-card').getBoundingClientRect();
      for (var k = 0; k < 3; k++) {
        var sp = document.createElement('span');
        sp.className = 'spark';
        sp.textContent = ['♥', '✦', '✧'][k];
        sp.style.left = (r.left - cr.left + r.width * (0.2 + k * 0.3)) + 'px';
        sp.style.top = (r.top - cr.top) + 'px';
        sp.style.color = ['#FF7F9D', '#FFB547', '#9B6BE0'][k];
        sp.style.setProperty('--dx', ((k - 1) * 18) + 'px');
        sp.style.setProperty('--rot', ((k - 1) * 30) + 'deg');
        $('#date-card').appendChild(sp);
        setTimeout(sp.remove.bind(sp), 950);
      }
    });
    $('#date-go').addEventListener('click', function () {
      if (!A.day) return dateHint(DP.pickFirst || UI.datePickFirst, null);
      saveAnswers();
      showCard(S.here >= 0 ? S.here : 0);                      // card now shows the date
      closeModal($('#datepick'));
      hearts(4);
      say(UI.dateSay.replace('{d}', dayLabel(A.day, true)), 1600);
    });
  }

  // ------------------------------------------------------------------
  // 忌口 (dinner): tap chips, "都可以！", or type — saved to Netlify Forms
  // ------------------------------------------------------------------
  var dietCfg = null;
  SCN.forEach(function (sc) { if (sc.diet && !dietCfg) dietCfg = sc.diet; });
  var dietIn = null, noneChip = null, openDiet = function () {};
  function dietSaved() {
    if (A.diet) return A.diet;
    return load('diet', null);
  }
  function dietIcon() { return (dietCfg && dietCfg.icon) || (ZH || JA ? '🥢' : '🍴'); }
  function dietText(d) {
    if (!d) return '';
    if (d.none) return dietCfg.none || UI.dietNone;
    return (d.items || []).concat(d.other ? [d.other] : []).join(LIST_SEP);
  }
  function renderDietRow(animate) {
    var btn = $('#diet-open');
    if (!dietCfg || !btn) return;
    var d = dietSaved();
    btn.textContent = d ? dietIcon() + ' ' + (dietCfg.summary || UI.dietSummary) + dietText(d) : dietCfg.button;
    btn.title = btn.textContent;
    btn.classList.toggle('saved', !!d);
    if (animate) { btn.classList.remove('pop'); void btn.offsetWidth; btn.classList.add('pop'); }
  }
  function chipList() { return [].slice.call(document.querySelectorAll('#diet-chips .chip')); }
  function setChip(c, on, pop) {
    c.setAttribute('aria-pressed', on ? 'true' : 'false');
    c.classList.toggle('on', on);
    if (pop) { c.classList.remove('pop'); void c.offsetWidth; c.classList.add('pop'); }
  }
  if (dietCfg) {
    $('#diet-title').textContent = dietCfg.title || '';
    $('#diet .modal-emoji').textContent = dietIcon();
    $('#diet-sub').textContent = dietCfg.hint || '';
    $('#diet-send').textContent = dietCfg.send || UI.dietSend;
    $('#diet-cancel').textContent = dietCfg.cancel || UI.dietCancel;
    $('#diet-chips').innerHTML = (dietCfg.options || []).map(function (o) {
      return '<button type="button" class="chip" aria-pressed="false">' + esc(o) + '</button>';
    }).join('') + (dietCfg.none ? '<button type="button" class="chip chip-none" aria-pressed="false">' + esc(dietCfg.none) + '</button>' : '');
    noneChip = $('#diet-chips .chip-none');
    dietIn = fancyInput($('#diet-other-wrap'), dietCfg.otherPlaceholders);
    dietIn.field.addEventListener('input', function () { if (this.value && noneChip) setChip(noneChip, false); });
    dietIn.field.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); this.blur(); } });

    $('#diet-chips').addEventListener('click', function (e) {
      var c = e.target.closest('.chip');
      if (!c || $('#diet-form').classList.contains('sent')) return;
      var on = c.getAttribute('aria-pressed') !== 'true';
      setChip(c, on, true);
      if (on && c === noneChip) {
        chipList().forEach(function (x) { if (x !== c) setChip(x, false); });
        dietIn.clear();
      } else if (on && noneChip) {
        setChip(noneChip, false);
      }
      if (on) {
        var r = c.getBoundingClientRect(), fr = $('#diet-form').getBoundingClientRect();
        for (var k = 0; k < 3; k++) {
          var sp = document.createElement('span');
          sp.className = 'spark';
          sp.textContent = ['✦', '♥', '✧'][k];
          sp.style.left = (r.left - fr.left + r.width * (0.2 + k * 0.3)) + 'px';
          sp.style.top = (r.top - fr.top) + 'px';
          sp.style.color = ['#FFB547', '#FF7F9D', '#9B6BE0'][k];
          sp.style.setProperty('--dx', ((k - 1) * 18) + 'px');
          sp.style.setProperty('--rot', ((k - 1) * 30) + 'deg');
          $('#diet-form').appendChild(sp);
          setTimeout(sp.remove.bind(sp), 950);
        }
      }
    });

    openDiet = function () {
      var d = dietSaved() || { items: [], other: '', none: false };
      chipList().forEach(function (c) {
        c.classList.remove('fly');
        setChip(c, c === noneChip ? !!d.none : (d.items || []).indexOf(c.textContent) >= 0);
      });
      dietIn.set(d.other);
      $('#diet-form').classList.remove('sent');
      openModal($('#diet'));
    };
    $('#diet-cancel').addEventListener('click', function () { closeModal($('#diet')); });
    $('#diet').addEventListener('click', function (e) { if (e.target === this) closeModal($('#diet')); });

    $('#diet-form').addEventListener('submit', function (e) {
      e.preventDefault();
      if (this.classList.contains('sent')) return;          // already sending
      var form = this, modal = $('#diet'), session = modal._session, picked = chipList().filter(function (c) { return c.classList.contains('on'); });
      var items = picked.filter(function (c) { return c !== noneChip; }).map(function (c) { return c.textContent; });
      var other = dietIn.field.value.trim(), none = !!(noneChip && noneChip.classList.contains('on')) && !items.length && !other;
      if (!items.length && !other && !none) {
        var g = $('#diet-chips');
        g.classList.remove('shake'); void g.offsetWidth; g.classList.add('shake');
        dietIn.shake(dietCfg.empty);
        return;
      }
      var d = { items: items, other: other, none: none };
      A.diet = d;
      saveAnswers();
      store('diet', d);
      renderDietRow(true);
      // the picked chips hop into the chopsticks, which munch
      var bowl = form.querySelector('.modal-emoji').getBoundingClientRect();
      picked.forEach(function (c, k) {
        var r = c.getBoundingClientRect();
        c.style.setProperty('--fx', (bowl.left + bowl.width / 2 - (r.left + r.width / 2)) + 'px');
        c.style.setProperty('--fy', (bowl.top + bowl.height / 2 - (r.top + r.height / 2)) + 'px');
        c.style.setProperty('--d', (k * 0.07) + 's');
        c.classList.add('fly');
      });
      form.classList.add('sent');
      var em = form.querySelector('.modal-emoji');
      setTimeout(function () { em.classList.remove('munch'); void em.offsetWidth; em.classList.add('munch'); }, 450 + picked.length * 70);
      setTimeout(function () {
        if (modal._session === session) closeModal(modal);
        toast(none ? dietCfg.savedNone : dietCfg.saved);
        hearts(4);
      }, 1100 + picked.length * 70);
    });
  }

  $('#feedback-form').addEventListener('submit', function (e) {
    e.preventDefault();
    if (this.classList.contains('sent') || S.flowDone) return;   // one submission per run-through
    var text = fbIn.field.value.trim(), form = this, modal = $('#feedback'), session = modal._session;
    if (!text) { fbIn.shake(ED.feedbackEmpty || UI.feedbackEmpty); fbIn.field.focus(); return; }
    S.flowDone = 'feedback';
    var f = answerFields();
    f.verdict = UI.verdictFeedback; f.next = nextIn.field.value.trim(); f.feedback = text;
    sendReply(f).then(slowNetworkNote);
    nextIn.field.readOnly = true;
    $('#next-wrap').classList.add('locked');
    fbIn.field.blur();
    var plane = document.createElement('span');
    plane.className = 'plane';
    plane.textContent = '✈️';
    var sr = $('#feedback-send').getBoundingClientRect(), fr = form.getBoundingClientRect();
    plane.style.left = (sr.left - fr.left + sr.width / 2 - 17) + 'px';
    plane.style.top = (sr.top - fr.top - 10) + 'px';
    form.appendChild(plane);
    form.classList.add('sent');
    setTimeout(function () {
      if (modal._session === session) closeFeedback();
      setTimeout(function () {
        form.classList.remove('sent');
        plane.remove();
        if (modal._session === session) { fbIn.clear(); $('#feedback-count').textContent = '0'; }
        $('#ending-actions').classList.add('gone');
        setTimeout(function () { $('#ending-actions').hidden = true; $('#replay-btn').hidden = false; }, 400);
        endingNote(ED.thanks || UI.thanks);
        burstFrom($('#ending-note'), 6);
      }, 300);
    }, 1000);
  });

  // ------------------------------------------------------------------
  // Music (optional)
  // ------------------------------------------------------------------
  // iOS (and WeChat on iOS) won't load audio before a tap, so the music starts inside
  // the "准备好啦" click instead of waiting for metadata.
  var audio = $('#bgm'), musicBtn = $('#music-btn'), musicOn = true, fadeTimer;
  musicOn = load('music', 'on') !== 'off';
  if (CFG.music) {
    audio.preload = 'none';
    audio.src = CFG.music;
    audio.addEventListener('playing', function () { musicBtn.classList.add('playing'); });
    audio.addEventListener('pause', function () { musicBtn.classList.remove('playing'); });
    audio.addEventListener('error', function () { musicBtn.hidden = true; });
  }
  function showMusicButton() {
    if (!CFG.music || audio.error) return;
    musicBtn.hidden = false;
    musicBtn.classList.toggle('off', !musicOn);
    musicBtn.setAttribute('aria-pressed', musicOn ? 'true' : 'false');
  }
  function playMusic() {
    if (!CFG.music || !musicOn || !audio.paused) return;
    clearInterval(fadeTimer);
    var v = 0;
    audio.volume = 0;                       // ignored on iOS, where the track itself is mixed quietly
    fadeTimer = setInterval(function () {
      v = Math.min(0.85, v + 0.05);
      audio.volume = v;
      if (v >= 0.85) clearInterval(fadeTimer);
    }, 90);
    var pr = audio.play();
    if (pr && pr.catch) pr.catch(function () {});
  }
  musicBtn.addEventListener('click', function () {
    musicOn = !musicOn;
    store('music', musicOn ? 'on' : 'off');
    showMusicButton();
    if (musicOn) playMusic(); else audio.pause();
  });
  document.addEventListener('visibilitychange', function () {
    if (!CFG.music || !S.started) return;
    if (document.hidden) audio.pause();
    else playMusic();
  });

  // ------------------------------------------------------------------
  // Input
  // ------------------------------------------------------------------
  $('#start-btn').addEventListener('click', function () { start(0); openDatePick(); });
  $('#next-btn').addEventListener('click', next);
  $('#prev-btn').addEventListener('click', prev);
  $('#home-btn').addEventListener('click', goHome);
  $('#replay-btn').addEventListener('click', function () {
    $('#ending').hidden = true;
    scenes[0].back.classList.remove('awake');
    S.awake = false;
    S.here = -1;
    start(0);
    openDatePick();
  });

  // Tap the couple: hearts, a line, and (with the poses sheet) a new pose.
  function nextPose(view) {
    var sp = view.poseSprite;
    if (!sp || !view.usesSprites()) return null;
    var n = sp.frames.length, k;
    do { k = Math.floor(Math.random() * n); } while (n > 1 && k === view.poseIndex);
    view.showPose(k);
    view.el.classList.remove('pop'); void view.el.offsetWidth; view.el.classList.add('pop');
    return k;
  }
  $('#couple').addEventListener('click', function () {
    if (!S.started) return;
    hearts(6);
    var sc = S.here >= 0 ? SCN[S.here] : null;
    var pool = (CFG.lines || []).concat((sc && sc.lines) || []);
    if (S.here === 0 && !S.awake && couple.pose === 'hidden') return wake();
    var k = S.anim || S.here < 0 ? null : nextPose(couple);
    say((k != null && poseList[k] && poseList[k].say) || pick(pool));
  });
  $('#cover-couple').addEventListener('click', function () {
    if (nextPose(coverCouple) == null) { this.classList.remove('pop'); void this.offsetWidth; this.classList.add('pop'); }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { closeFeedback(); closeModal($('#diet')); }
    if (modalOpen()) return;
    if (e.target.closest && e.target.closest('input,textarea')) return;
    if (!S.started) {
      if (e.key === 'Enter' && !$('#cover').hidden && !(e.target.closest && e.target.closest('button'))) { start(0); openDatePick(); }
      return;
    }
    if (!$('#ending').hidden) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); }
  });

  var touch = null;
  stage.addEventListener('touchstart', function (e) { var t = e.touches[0]; touch = { x: t.clientX, y: t.clientY, t: Date.now() }; }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!touch) return;
    var t = e.changedTouches[0], dx = t.clientX - touch.x, dy = t.clientY - touch.y;
    touch = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.3) { if (dx < 0) next(); else prev(); }
  }, { passive: true });

  var wheelAcc = 0, wheelLock = 0;
  window.addEventListener('wheel', function (e) {
    if (!S.started || !$('#ending').hidden) return;
    var now = Date.now();
    if (S.anim || now < wheelLock) return;
    if (modalOpen()) return;
    wheelAcc += Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    if (Math.abs(wheelAcc) > 90) {
      if (wheelAcc > 0) next(); else prev();
      wheelAcc = 0; wheelLock = now + 900;
    }
  }, { passive: true });

  if (finePointer && !reduceMotion) {
    window.addEventListener('pointermove', function (e) {
      S.ptr.tx = (e.clientX / window.innerWidth - 0.5) * -2;
      S.ptr.ty = (e.clientY / window.innerHeight - 0.5) * -2;
    });
  }

  window.addEventListener('resize', layout);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);

  // ------------------------------------------------------------------
  // Boot
  // ------------------------------------------------------------------
  buildCover();
  buildHud();
  layout();
  requestAnimationFrame(tick);

  var q = /[?&]scene=(\d+)/.exec(location.search);
  if (q) start(+q[1] - 1);

  // expose for debugging / screenshots
  window.__trip = { S: S, goTo: goTo, next: next, prev: prev, start: start, couple: couple, scenes: scenes };
})();
