/* ===========================================================================
   Yi Hua Huang — Portfolio / 開場動畫
   依 Figma timeline（5.8s、loop）復刻：條紋由左而右依序點亮、太陽落下、
   海鷗依序滑入、三行文字逐字打出。時間常數集中在 T 物件，與設計稿一一對應。
   =========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var CYCLE = 5800;                       /* 設計稿 timeline 總長 */

  /* 5.8s timeline 上的百分比 → 毫秒 */
  function at(pct) { return Math.round(pct / 100 * CYCLE); }

  var T = {
    stripes: {
      a: { start: at(25.862), span: at(34.035), dur: at(3.104) },   /* Group 97 米色 */
      b: { start: at(25.862), span: at(34.035), dur: at(3.104) },   /* Group 98 近白 */
      c: { start: at(22.069), span: at(34.034), dur: at(2.759) }    /* Group 96 白色 */
    },
    typing: {
      name:    { start: at(27.931), step: at(0.948) },   /* 5:1201 */
      role:    { start: at(36.207), step: at(0.862) },   /* 5:1217 */
      tagline: { start: at(49.138), step: at(0.810) }    /* 5:1235 */
    }
  };

  /* ---- 1 設計稿單位：--u = 1 個設計稿 px（以 clientWidth 計，避開捲軸誤差） ---- */
  function setUnit() {
    /* 手機版用實際像素排版，--u 由 CSS 給（1px），JS 不可覆寫，
       否則行內樣式會蓋掉 media query，整個版面又縮回桌機比例。 */
    if (cssVar('--layout', 'desktop') === 'mobile') {
      root.style.removeProperty('--u');
      return parseFloat(cssVar('--u', '1')) || 1;
    }
    var w = root.clientWidth || window.innerWidth;
    var h = root.clientHeight || window.innerHeight;
    /* 桌機版：寬、高都納入，整張 1440x886 一定完整可見，不被裁切也不需捲動。
       條紋與海面仍以 100% 寬滿版延伸，只有版心內容隨 --u 置中。 */
    var u = Math.min(1, w / 1440, h / 886);
    root.style.setProperty('--u', u + 'px');
    return u;
  }

  /* ---- 2 條紋：設計稿每層 95 條，間距 15px；畫面寬於 1440 時往兩側續接 ---- */
  var LAST = 94;                              /* 設計稿條紋索引 0…94 */
  var LAYERS = [
    { sel: '.stripes--a', key: 'a', x0: 10 }, /* ink 起點：10 + 15k */
    { sel: '.stripes--b', key: 'b', x0: 10 },
    { sel: '.stripes--c', key: 'c', x0: 9 }   /* 海面那層左移 1px，與設計稿一致 */
  ];

  function cssVar(name, fallback) {
    var v = getComputedStyle(root).getPropertyValue(name).trim();
    return v === '' ? fallback : v;
  }

  function buildStripes() {
    var u = setUnit();
    var pitch = parseFloat(cssVar('--pitch', '15'));
    var mode = cssVar('--stripes', 'design');   /* design：維持設計稿 95 條；fill：填滿容器 */

    LAYERS.forEach(function (layer) {
      var host = document.querySelector(layer.sel);
      if (!host) return;

      var boxW = host.getBoundingClientRect().width;
      /* 對應 CSS 的 left: calc(50% - 720*--u + (x0 + i*pitch)*--u) */
      var first = boxW / 2 - 720 * u + layer.x0 * u;
      var step = pitch * u;

      var kMin = 0, kMax = LAST;
      if (mode === 'fill' || boxW > 1440 * u + 1) {
        kMin = Math.floor((0 - first) / step);
        kMax = Math.ceil((boxW - first) / step);
        if (mode !== 'fill') {                  /* 桌機版：至少涵蓋設計稿的 95 條 */
          kMin = Math.min(0, kMin);
          kMax = Math.max(LAST, kMax);
        }
      }

      var range = kMin + ':' + kMax + ':' + pitch;
      if (host.dataset.range === range) return; /* 條件沒變就不重建 */
      host.dataset.range = range;

      var t = T.stripes[layer.key];
      var span = Math.max(1, kMax - kMin);
      var frag = document.createDocumentFragment();
      host.textContent = '';
      for (var k = kMin; k <= kMax; k++) {
        var el = document.createElement('i');
        el.className = 'stripe';
        el.style.setProperty('--i', k);
        /* 由左而右的掃描總長固定：畫面多寬、條數多少，節奏都與設計稿一致 */
        el.style.setProperty('--delay', (t.start + ((k - kMin) / span) * t.span) + 'ms');
        el.style.setProperty('--dur', t.dur + 'ms');
        frag.appendChild(el);
      }
      host.appendChild(frag);
    });
  }

  /* ---- 3 逐字浮現：每個字包成 <span class="ch">，時序與 Figma 的逐字 keyframe 相同。
         用逐字顯示而非動畫容器寬度，手機版文字才能換行而不被裁掉。 ---- */
  var typeTargets = [
    { el: document.querySelector('.type--name'),    key: 'name' },
    { el: document.querySelector('.type--role'),    key: 'role' },
    { el: document.querySelector('.type--tagline'), key: 'tagline' }
  ].filter(function (t) { return t.el; });

  var charTimer = null;

  function splitChars(el) {
    var span = el.querySelector('.type__text');
    if (!span || span.dataset.split) return;
    var text = span.textContent;
    span.textContent = '';
    for (var i = 0; i < text.length; i++) {
      var ch = document.createElement('span');
      ch.className = 'ch';
      ch.textContent = text[i];
      span.appendChild(ch);
    }
    span.dataset.split = '1';
  }

  function resetChars() {
    typeTargets.forEach(function (t) {
      splitChars(t.el);
      var chars = t.el.querySelectorAll('.ch');
      for (var i = 0; i < chars.length; i++) chars[i].style.visibility = '';
    });
  }

  function playTyping(startedAt) {
    if (charTimer) cancelAnimationFrame(charTimer);
    resetChars();

    var lines = typeTargets.map(function (t) {
      return { chars: t.el.querySelectorAll('.ch'), cfg: T.typing[t.key], shown: 0 };
    });

    function tick() {
      var now = performance.now() - startedAt;
      var pending = false;
      for (var i = 0; i < lines.length; i++) {
        var L = lines[i];
        var target = Math.floor((now - L.cfg.start) / L.cfg.step) + 1;
        if (target < 0) target = 0;
        if (target > L.chars.length) target = L.chars.length;
        while (L.shown < target) { L.chars[L.shown].style.visibility = 'visible'; L.shown++; }
        if (L.shown < L.chars.length) pending = true;
      }
      if (pending) charTimer = requestAnimationFrame(tick);
    }
    charTimer = requestAnimationFrame(tick);
  }

  /* ---- 4 播放控制 ---- */
  var loopTimer = null;
  var wantsLoop = /[?&#]loop\b/.test(location.search + location.hash);

  function play() {
    root.classList.add('anim');
    root.classList.remove('is-playing');
    void root.offsetWidth;                          /* 強制回流，讓 CSS 動畫重新起跑 */
    root.classList.add('is-playing');
    window.__pfStart = performance.now();   /* 動畫時間基準（逐字浮現與截圖比對共用） */
    playTyping(window.__pfStart);

    if (loopTimer) clearTimeout(loopTimer);
    if (wantsLoop) loopTimer = setTimeout(play, CYCLE);   /* 與設計稿相同的無限循環 */
  }

  function finish() {                               /* 不播動畫：直接停在完成態 */
    if (charTimer) cancelAnimationFrame(charTimer);
    root.classList.remove('anim', 'is-playing');
    resetChars();                                   /* 移除 .anim 後即為全部可見 */
  }

  /* ---- 5 啟動 ---- */
  buildStripes();

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    setUnit();
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      var playing = root.classList.contains('is-playing');
      buildStripes();
      if (playing) { root.classList.add('is-playing'); }
    }, 180);
  });

  var replay = document.getElementById('replay');
  if (replay) replay.addEventListener('click', play);

  function start() {
    if (window.__pfSafety) clearTimeout(window.__pfSafety);
    if (root.classList.contains('anim')) play();    /* head 已判斷是否尊重 reduce-motion */
    else finish();
  }

  /* 等字型就緒再開演，避免打字中途換字型造成跳動；最多等 1.5s */
  if (document.fonts && document.fonts.ready) {
    var started = false;
    var go = function () { if (!started) { started = true; start(); } };
    document.fonts.ready.then(go);
    setTimeout(go, 1500);
  } else {
    start();
  }
})();
