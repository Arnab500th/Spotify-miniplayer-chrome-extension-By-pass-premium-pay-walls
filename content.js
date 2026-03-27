// ============================================================
// Spotify Float — Bundled Content Script (No ES Modules)
// All code inlined: selectors + UI + core logic
// ============================================================
(function () {
  'use strict';

  // Prevent double-injection on SPA navigation
  if (window.__spotifyFloatLoaded) return;
  window.__spotifyFloatLoaded = true;

  // ============================================================
  // PART 1: SELECTORS
  // ============================================================

  var SELECTORS = {
    playPauseButton: [
      '[data-testid="control-button-playpause"]',
      'button[aria-label="Play"]',
      'button[aria-label="Pause"]',
      '.player-controls__buttons button[aria-label*="Play"]',
      '.player-controls__buttons button[aria-label*="Pause"]',
    ],
    nextButton: [
      '[data-testid="control-button-skip-forward"]',
      'button[aria-label="Next"]',
      'button[aria-label="Skip to next track"]',
    ],
    prevButton: [
      '[data-testid="control-button-skip-back"]',
      'button[aria-label="Previous"]',
      'button[aria-label="Skip to previous track"]',
    ],
    shuffleButton: [
      '[data-testid="control-button-shuffle"]',
      'button[aria-label="Enable shuffle"]',
      'button[aria-label="Disable shuffle"]',
      'button[aria-label*="shuffle" i]',
    ],
    repeatButton: [
      '[data-testid="control-button-repeat"]',
      'button[aria-label="Enable repeat"]',
      'button[aria-label="Enable repeat one"]',
      'button[aria-label="Disable repeat"]',
    ],
    progressBar: [
      '[data-testid="progress-bar"]',
      '[data-testid="playback-progressbar"]',
      'div[role="progressbar"]',
      '.playback-bar',
    ],
    seekSlider: [
      '[data-testid="progress-bar"] input[type="range"]',
      'input[aria-label="Change progress"]',
      '.playback-bar input[type="range"]',
      '#progress-bar input',
    ],
    currentTime: [
      '[data-testid="playback-position"]',
      'span[data-testid="playback-position"]',
      '.playback-bar__progress-time:first-child',
    ],
    totalDuration: [
      '[data-testid="playback-duration"]',
      'span[data-testid="playback-duration"]',
      '.playback-bar__progress-time:last-child',
    ],
    trackTitle: [
      '[data-testid="context-item-info-title"]',
      '[data-testid="now-playing-widget"] a[data-testid="context-item-link"]',
      '.now-playing-widget a[href*="track"]',
      '[data-testid="now-playing-widget"] div[dir="auto"]',
      '.track-info__name a',
    ],
    artistName: [
      '[data-testid="context-item-info-artist"]',
      '[data-testid="context-item-info-subtitles"] a',
      '[data-testid="now-playing-widget"] [data-testid="context-item-info-subtitles"]',
      '.track-info__artists a',
    ],
    albumArt: [
      '[data-testid="coverSlot"] img',
      '[data-testid="coverart-image"]',
      '[data-testid="now-playing-widget"] img',
      '.now-playing-widget img[src*="i.scdn.co"]',
      '.cover-art img',
    ],
    volumeSlider: [
      '[data-testid="volume-bar"] input[type="range"]',
      'input[aria-label*="volume" i]',
      '.volume-bar input[type="range"]',
    ],
    muteButton: [
      '[data-testid="volume-bar-toggle-mute-button"]',
      'button[aria-label*="Mute" i]',
      'button[aria-label*="Unmute" i]',
    ],
    nowPlayingWidget: [
      '[data-testid="now-playing-widget"]',
      '[data-testid="now-playing-bar"]',
      '.now-playing-bar',
      'footer[data-testid="now-playing-bar"]',
      'footer[class*="now-playing"]',
      'footer',
      '.player-controls',
      '.Root__now-playing-bar',
    ],
  };

  function resolveSelector(list) {
    for (var i = 0; i < list.length; i++) {
      try {
        var el = document.querySelector(list[i]);
        if (el) return el;
      } catch (_) { }
    }
    return null;
  }

  var _cache = {};
  var CACHE_TTL = 4000;

  function cachedResolve(key) {
    var now = Date.now();
    var c = _cache[key];
    if (c && (now - c.ts) < CACHE_TTL) return c.el;
    var el = resolveSelector(SELECTORS[key] || []);
    _cache[key] = { el: el, ts: now };
    return el;
  }

  function invalidateCache(key) {
    if (key) delete _cache[key];
    else _cache = {};
  }

  function safeClick(key) {
    var el = cachedResolve(key);
    if (el) { el.click(); return true; }
    return false;
  }

  function readText(key) {
    var el = cachedResolve(key);
    return el ? (el.textContent || el.innerText || '').trim() : null;
  }

  // ============================================================
  // PART 2: FLOATING UI (Shadow DOM)
  // ============================================================

  var MODES = { FULL: 'full', COMPACT: 'compact', MINI: 'mini' };

  var UI_CSS = [
    "@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');",
    "*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }",
    ":host { all: initial; font-family: 'DM Sans', system-ui, sans-serif; }",
    "#float-root {",
    "  --bg:#0d0d12; --bg2:#161620; --bg3:#1e1e2a; --bgh:#252533;",
    "  --ac:#1db954; --acd:rgba(29,185,84,0.15); --acg:rgba(29,185,84,0.3);",
    "  --t1:#fff; --t2:#9898b0; --t3:#55556a;",
    "  --br:rgba(255,255,255,0.07); --r:14px;",
    "  --ea:0.18s cubic-bezier(0.4,0,0.2,1);",
    "  --sh:0 20px 60px rgba(0,0,0,0.75),0 6px 20px rgba(0,0,0,0.5),0 0 0 1px rgba(255,255,255,0.06);",
    "  position:fixed; right:20px; bottom:100px; z-index:2147483647; user-select:none; -webkit-font-smoothing:antialiased; pointer-events:none;",
    "}",
    "#player {",
    "  pointer-events:all; background:var(--bg); border-radius:var(--r);",
    "  box-shadow:var(--sh); display:flex; flex-direction:column; overflow:hidden;",
    "  min-width:200px; width:270px; position:relative;",
    "  animation:floatIn 0.22s cubic-bezier(0.34,1.56,0.64,1) forwards;",
    "}",
    "#player::after { content:''; position:absolute; inset:0; border-radius:var(--r); pointer-events:none;",
    "  background:linear-gradient(135deg,rgba(255,255,255,0.04) 0%,transparent 60%); z-index:50; }",
    "@keyframes floatIn { from{opacity:0;transform:translateY(10px) scale(0.96)} to{opacity:1;transform:none} }",

    // drag handle
    "#dh { padding:9px 12px 5px; cursor:grab; display:flex; align-items:center; justify-content:space-between; flex-shrink:0; }",
    "#dh:active { cursor:grabbing; }",
    ".dots { display:grid; grid-template-columns:repeat(3,3px); grid-template-rows:repeat(2,3px); gap:3px; opacity:0.2; transition:opacity var(--ea); }",
    "#dh:hover .dots { opacity:0.5; }",
    ".dot { width:3px; height:3px; border-radius:50%; background:var(--t2); }",
    ".hbtns { display:flex; gap:3px; align-items:center; }",
    ".hb { border:none; cursor:pointer; border-radius:5px; display:flex; align-items:center; justify-content:center;",
    "  transition:background var(--ea),color var(--ea); background:transparent; color:var(--t3);",
    "  font-family:'DM Sans',sans-serif; font-size:9px; font-weight:600; letter-spacing:0.05em; padding:0 6px; height:18px; }",
    ".hb:hover { background:var(--bg3); color:var(--t2); }",
    ".hb.on { background:var(--acd); color:var(--ac); }",
    ".hb.x:hover { background:rgba(255,70,70,0.15); color:#ff7070; }",

    // art
    "#aw { padding:0 12px 10px; flex-shrink:0; overflow:hidden; }",
    ".ai { position:relative; width:100%; padding-top:100%; border-radius:10px; overflow:hidden; background:var(--bg3); box-shadow:0 6px 20px rgba(0,0,0,0.5); }",
    "#art { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; transition:opacity 0.3s ease; }",
    "#art.fade { opacity:0; }",
    ".ag { position:absolute; inset:0; background:linear-gradient(180deg,transparent 55%,rgba(0,0,0,0.55)); pointer-events:none; }",

    // track info
    "#ti { padding:0 12px 8px; flex-shrink:0; overflow:hidden; min-width:0; }",
    ".ttl { font-size:13px; font-weight:600; color:var(--t1); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.3; letter-spacing:-0.015em; }",
    ".art { font-size:11px; color:var(--t2); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:2px; }",
    ".scroll { display:inline-block; animation:mar 9s linear infinite; padding-right:40px; }",
    "@keyframes mar { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }",

    // progress
    "#pw { padding:0 12px 5px; flex-shrink:0; }",
    ".trow { display:flex; justify-content:space-between; margin-bottom:5px; }",
    ".tl { font-size:10px; color:var(--t3); font-variant-numeric:tabular-nums; }",
    ".pt { width:100%; height:3px; background:var(--bg3); border-radius:3px; position:relative; cursor:pointer; transition:height var(--ea); }",
    ".pt:hover { height:5px; }",
    ".pf { height:100%; background:var(--ac); border-radius:3px; pointer-events:none; position:relative; transition:width 0.4s linear; }",
    ".pf::after { content:''; position:absolute; right:-5px; top:50%; transform:translateY(-50%) scale(0);",
    "  width:11px; height:11px; border-radius:50%; background:#fff; box-shadow:0 0 8px var(--acg); transition:transform var(--ea); }",
    ".pt:hover .pf::after { transform:translateY(-50%) scale(1); }",

    // controls
    "#ctrl { padding:5px 12px 12px; display:flex; align-items:center; justify-content:center; gap:6px; flex-shrink:0; }",
    ".cb { border:none; background:transparent; cursor:pointer; border-radius:50%; display:flex; align-items:center; justify-content:center;",
    "  transition:transform var(--ea),background var(--ea),color var(--ea),box-shadow var(--ea); color:var(--t2); flex-shrink:0; position:relative; }",
    ".cb:hover { color:var(--t1); transform:scale(1.1); background:var(--bg3); }",
    ".cb:active { transform:scale(0.94); }",
    ".cb.sm { width:30px; height:30px; font-size:13px; }",
    ".cb.lg { width:40px; height:40px; font-size:16px; background:var(--ac); color:#000; box-shadow:0 4px 16px var(--acg); }",
    ".cb.lg:hover { background:#22d460; color:#000; transform:scale(1.08); box-shadow:0 6px 22px var(--acg); }",
    ".cb.on { color:var(--ac); }",
    ".tip { position:absolute; bottom:calc(100% + 7px); left:50%; transform:translateX(-50%);",
    "  background:var(--bg3); color:var(--t2); font-family:'DM Sans',sans-serif; font-size:10px;",
    "  padding:3px 8px; border-radius:5px; white-space:nowrap; pointer-events:none;",
    "  opacity:0; transition:opacity 0.12s ease; border:1px solid var(--br); z-index:200; }",
    ".cb:hover .tip { opacity:1; }",
    ".rep-badge { position:absolute; font-size:7px; font-weight:700; color:var(--ac); bottom:3px; right:3px; pointer-events:none; display:none; }",
    ".cb.on .rep-badge { display:block; }",

    // volume
    "#vr { padding:0 12px 11px; display:flex; align-items:center; gap:8px; flex-shrink:0; }",
    ".vi { font-size:12px; cursor:pointer; color:var(--t3); transition:color var(--ea); background:none; border:none; padding:0; }",
    ".vi:hover { color:var(--t2); }",
    ".vs { flex:1; -webkit-appearance:none; height:3px; background:var(--bg3); border-radius:3px; outline:none; cursor:pointer; }",
    ".vs::-webkit-slider-thumb { -webkit-appearance:none; width:11px; height:11px; border-radius:50%; background:var(--ac); cursor:pointer; }",

    // resize handle
    "#rsz { position:absolute; bottom:0; right:0; width:16px; height:16px; cursor:se-resize;",
    "  display:flex; align-items:flex-end; justify-content:flex-end; padding:3px;",
    "  opacity:0; transition:opacity var(--ea); z-index:99; }",
    "#player:hover #rsz { opacity:0.45; }",
    "#rsz:hover { opacity:1 !important; }",
    ".rl { display:flex; flex-direction:column; gap:2px; }",
    ".rl span { display:block; height:1.5px; background:var(--t2); border-radius:1px; }",
    ".rl span:nth-child(1){width:9px} .rl span:nth-child(2){width:6px} .rl span:nth-child(3){width:3px}",

    // compact
    ".mc #aw { display:none; }",
    ".mc #ti { padding:4px 12px 7px; }",
    ".mc .ttl { font-size:12px; }",
    ".mc #ctrl { padding:2px 10px 10px; gap:4px; }",
    ".mc .cb.lg { width:34px; height:34px; font-size:14px; }",
    ".mc .cb.sm { width:26px; height:26px; }",

    // mini
    ".mm #aw,.mm #ti,.mm #pw,.mm #vr,.mm #dh { display:none; }",
    ".mm #player { border-radius:40px !important; width:auto !important; height:auto !important; cursor:grab; }",
    ".mm #player:active { cursor:grabbing; }",
    ".mm #ctrl { padding:8px 12px; gap:4px; }",
    ".mm .cb.sm { width:28px; height:28px; font-size:12px; }",
    ".mm .cb.lg { width:36px; height:36px; font-size:14px; }",
    ".mm #rsz { display:none; }",
    "#c-expand { display:none; }",
    ".mm #c-expand { display:flex; }",

    // track change anim
    "@keyframes tca { 0%{opacity:1;transform:translateX(0)} 35%{opacity:0;transform:translateX(-10px)} 65%{opacity:0;transform:translateX(10px)} 100%{opacity:1;transform:none} }",
    ".tca { animation:tca 0.35s ease; }",
    "::-webkit-scrollbar { display:none; }",
  ].join('\n');

  var UI_HTML = '<div id="float-root">' +
    '<div id="player">' +
    '<div id="dh">' +
    '<div class="dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>' +
    '<div class="hbtns">' +
    '<button class="hb on" id="btn-full">FULL</button>' +
    '<button class="hb" id="btn-compact">CMP</button>' +
    '<button class="hb" id="btn-mini">MINI</button>' +
    '<button class="hb x" id="btn-close">&#x2715;</button>' +
    '</div>' +
    '</div>' +
    '<div id="aw"><div class="ai"><img id="art" src="" alt="" draggable="false"/><div class="ag"></div></div></div>' +
    '<div id="ti"><div class="ttl" id="ttl">Waiting for track\u2026</div><div class="art" id="art-name">\u2014</div></div>' +
    '<div id="pw"><div class="trow"><span class="tl" id="tc">0:00</span><span class="tl" id="td">0:00</span></div>' +
    '<div class="pt" id="pt"><div class="pf" id="pf" style="width:0%"></div></div></div>' +
    '<div id="ctrl">' +
    '<button class="cb sm" id="c-shuf" aria-label="Shuffle">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 3 21 3 21 8"/><polyline points="16 21 21 21 21 16"/><line x1="4" y1="20" x2="21" y2="3"/><line x1="21" y1="21" x2="14" y2="14"/><line x1="4" y1="4" x2="9" y2="9"/></svg>' +
    '<span class="tip">Shuffle</span></button>' +
    '<button class="cb sm" id="c-prev" aria-label="Previous">' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2.2"/></svg>' +
    '<span class="tip">Previous</span></button>' +
    '<button class="cb lg" id="c-play" aria-label="Play/Pause">' +
    '<svg id="i-play" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
    '<svg id="i-pause" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="display:none"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>' +
    '<span class="tip">Play / Pause</span></button>' +
    '<button class="cb sm" id="c-next" aria-label="Next">' +
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2.2"/></svg>' +
    '<span class="tip">Next</span></button>' +
    '<button class="cb sm" id="c-rep" aria-label="Repeat">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>' +
    '<span class="rep-badge" id="rep-badge"></span>' +
    '<span class="tip">Repeat</span></button>' +
    '<button class="cb sm" id="c-expand" aria-label="Expand">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>' +
    '<span class="tip">Full</span></button>' +
    '<button class="cb sm" id="pip-btn" aria-label="Picture in Picture">' +
    '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><rect x="12" y="11" width="8" height="6"/><polyline points="12 17 20 17 20 11"/></svg>' +
    '<span class="tip">PiP</span></button>' +
    '</div>' +
    '<div id="vr"><button class="vi" id="vi">&#x1F50A;</button><input type="range" class="vs" id="vs" min="0" max="100" value="100"/></div>' +
    '<div id="rsz"><div class="rl"><span></span><span></span><span></span></div></div>' +
    '</div>' +
    '</div>';

  // ── FloatUI ──────────────────────────────────────────────────────────────

  function FloatUI(hostEl) {
    this.host = hostEl || null;
    this.shadow = null;
    this.root = null;
    this.player = null;
    this.mode = MODES.FULL;
    this.isVisible = false;
    this._handlers = {};
    this._visListeners = [];
    this._drag = {};
    this._resize = {};
    this._lastTitle = '';
    this._lastArt = '';
  }

  FloatUI.prototype.mount = function () {
    if (!this.host) {
      this.host = document.createElement('div');
      this.host.id = 'spotify-float-host';
      document.documentElement.appendChild(this.host);
    }
    this.shadow = this.host.attachShadow({ mode: 'open' });
    var style = document.createElement('style');
    style.textContent = UI_CSS;
    this.shadow.appendChild(style);
    var wrap = document.createElement('div');
    wrap.innerHTML = UI_HTML;
    this.shadow.appendChild(wrap.firstElementChild);
    this.root = this.shadow.getElementById('float-root');
    this.player = this.shadow.getElementById('player');
    this._bindAll();
    this.isVisible = true;
    this._notifyVis(true);
  };

  FloatUI.prototype.unmount = function () {
    if (!this.host) return;
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
    document.removeEventListener('mousemove', this._onResizeMove);
    document.removeEventListener('mouseup', this._onResizeEnd);
    this.host.remove();
    this.host = this.shadow = this.root = this.player = null;
    this.isVisible = false;
    this._notifyVis(false);
  };

  FloatUI.prototype._bindAll = function () {
    var s = this.shadow, self = this;

    function bindBtn(id, eventName) {
      var btn = s.getElementById(id);
      if (btn) btn.addEventListener('click', function () { self._emit(eventName); });
    }

    s.getElementById('btn-full').addEventListener('click', function () { self.setMode(MODES.FULL); });
    s.getElementById('btn-compact').addEventListener('click', function () { self.setMode(MODES.COMPACT); });
    s.getElementById('btn-mini').addEventListener('click', function () { self.setMode(MODES.MINI); });
    s.getElementById('btn-close').addEventListener('click', function () {
      self.isVisible = false;
      self.host.style.display = 'none';
      self._notifyVis(false);
      self._emit('hide');
    });
    s.getElementById('c-play').addEventListener('click', function () { self._emit('play-pause'); });
    s.getElementById('c-prev').addEventListener('click', function () { self._emit('prev'); });
    s.getElementById('c-next').addEventListener('click', function () { self._emit('next'); });
    s.getElementById('c-shuf').addEventListener('click', function () { self._emit('shuffle'); });
    s.getElementById('c-rep').addEventListener('click', function () { self._emit('repeat'); });
    s.getElementById('pt').addEventListener('click', function (e) {
      var r = e.currentTarget.getBoundingClientRect();
      self._emit('seek', Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
    });
    s.getElementById('vs').addEventListener('input', function (e) { self._emit('volume', parseInt(e.target.value, 10)); });
    s.getElementById('vi').addEventListener('click', function () { self._emit('mute'); });
    s.getElementById('c-expand').addEventListener('click', function () { self.setMode(MODES.FULL); });
    bindBtn('pip-btn', 'open-pip');
    // Double-click player to expand from mini mode
    this._setupMiniDrag();
    this._setupDrag();
    this._setupResize();
  };

  FloatUI.prototype._emit = function (ev, data) { if (this._handlers[ev]) this._handlers[ev](data); };
  FloatUI.prototype.on = function (map) { this._handlers = map; };
  FloatUI.prototype.onVisibilityChange = function (fn) { this._visListeners.push(fn); };
  FloatUI.prototype._notifyVis = function (v) { this._visListeners.forEach(function (fn) { fn(v); }); };

  FloatUI.prototype._setupMiniDrag = function () {
    var self = this;
    this.player.addEventListener('dblclick', function () {
      if (self.mode === MODES.MINI) self.setMode(MODES.FULL);
    });
    this.player.addEventListener('mousedown', function (e) {
      if (self.mode !== MODES.MINI) return;
      if (e.target.closest('button')) return;
      e.preventDefault();
      var r = self.root.getBoundingClientRect();
      self._drag = { active: true, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
      document.addEventListener('mousemove', self._onDragMove);
      document.addEventListener('mouseup', self._onDragEnd);
    });
  };

  FloatUI.prototype._setupDrag = function () {
    var self = this;
    this._onDragMove = function (e) {
      if (!self._drag.active) return;
      self._setPos(self._drag.ox + (e.clientX - self._drag.sx), self._drag.oy + (e.clientY - self._drag.sy));
    };
    this._onDragEnd = function () {
      self._drag.active = false;
      document.removeEventListener('mousemove', self._onDragMove);
      document.removeEventListener('mouseup', self._onDragEnd);
      self._emit('pos', self._getPos());
    };
    this.shadow.getElementById('dh').addEventListener('mousedown', function (e) {
      if (e.target.closest('button')) return;
      e.preventDefault();
      var r = self.root.getBoundingClientRect();
      self._drag = { active: true, sx: e.clientX, sy: e.clientY, ox: r.left, oy: r.top };
      document.addEventListener('mousemove', self._onDragMove);
      document.addEventListener('mouseup', self._onDragEnd);
    });
  };

  FloatUI.prototype._setPos = function (x, y) {
    var pr = this.player.getBoundingClientRect();
    x = Math.max(0, Math.min(x, window.innerWidth - pr.width));
    y = Math.max(0, Math.min(y, window.innerHeight - pr.height));
    this.root.style.cssText = 'left:' + x + 'px;top:' + y + 'px;right:auto;bottom:auto;';
  };

  FloatUI.prototype._getPos = function () {
    return { left: this.root.style.left, top: this.root.style.top };
  };

  FloatUI.prototype.setPosition = function (pos) {
    if (!this.root) return;
    if (pos.left) { this.root.style.left = pos.left; this.root.style.right = 'auto'; }
    if (pos.top) { this.root.style.top = pos.top; this.root.style.bottom = 'auto'; }
    if (pos.right) { this.root.style.right = pos.right; this.root.style.left = 'auto'; }
    if (pos.bottom) { this.root.style.bottom = pos.bottom; this.root.style.top = 'auto'; }
  };

  FloatUI.prototype._setupResize = function () {
    var self = this;
    this._onResizeMove = function (e) {
      if (!self._resize.active) return;
      self.player.style.width = Math.max(200, Math.min(520, self._resize.ow + (e.clientX - self._resize.sx))) + 'px';
      self.player.style.height = Math.max(120, Math.min(700, self._resize.oh + (e.clientY - self._resize.sy))) + 'px';
    };
    this._onResizeEnd = function () {
      self._resize.active = false;
      document.removeEventListener('mousemove', self._onResizeMove);
      document.removeEventListener('mouseup', self._onResizeEnd);
      self._emit('size', { width: self.player.style.width, height: self.player.style.height });
    };
    this.shadow.getElementById('rsz').addEventListener('mousedown', function (e) {
      e.preventDefault(); e.stopPropagation();
      var r = self.player.getBoundingClientRect();
      self._resize = { active: true, sx: e.clientX, sy: e.clientY, ow: r.width, oh: r.height };
      document.addEventListener('mousemove', self._onResizeMove);
      document.addEventListener('mouseup', self._onResizeEnd);
    });
  };

  FloatUI.prototype.setSize = function (s) {
    if (!this.player) return;
    if (s.width) this.player.style.width = s.width;
    if (s.height) this.player.style.height = s.height;
  };

  FloatUI.prototype.setMode = function (mode) {
    if (!this.root) return;
    this.mode = mode;
    var cls = { full: '', compact: 'mc', mini: 'mm' };
    this.root.className = cls[mode] || '';
    // Reset player size to defaults for each mode
    if (this.player) {
      var sizes = { full: { w: '270px', h: '' }, compact: { w: '270px', h: '' }, mini: { w: '', h: '' } };
      var s = sizes[mode] || sizes.full;
      this.player.style.width = s.w;
      this.player.style.height = s.h;
    }
    var map = { full: 'btn-full', compact: 'btn-compact', mini: 'btn-mini' };
    var sh = this.shadow;
    Object.keys(map).forEach(function (m) {
      var b = sh.getElementById(map[m]);
      if (b) b.classList.toggle('on', m === mode);
    });
    this._emit('mode', mode);
  };

  FloatUI.prototype.show = function () {
    if (!this.host) this.mount();
    this.host.style.display = '';
    this.isVisible = true;
    this._notifyVis(true);
  };

  FloatUI.prototype.updateTrack = function (title, artist, artUrl) {
    if (!this.shadow) return;
    var changed = title !== this._lastTitle;
    this._lastTitle = title;
    if (changed) {
      var ti = this.shadow.getElementById('ti');
      if (ti) { ti.classList.remove('tca'); void ti.offsetWidth; ti.classList.add('tca'); }
    }
    var tel = this.shadow.getElementById('ttl');
    var ael = this.shadow.getElementById('art-name');
    var img = this.shadow.getElementById('art');
    if (tel) {
      if (title && title.length > 24) {
        var e = title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        tel.innerHTML = '<span class="scroll">' + e + '&nbsp;&nbsp;&nbsp;&nbsp;' + e + '</span>';
      } else {
        tel.textContent = title || 'No track playing';
      }
    }
    if (ael) ael.textContent = artist || '\u2014';
    if (img && artUrl && artUrl !== this._lastArt) {
      this._lastArt = artUrl;
      img.classList.add('fade');
      var newImg = new Image();
      newImg.onload = function () { img.src = artUrl; img.classList.remove('fade'); };
      newImg.src = artUrl;
    }
  };

  FloatUI.prototype.updatePlayState = function (playing) {
    if (!this.shadow) return;
    var ip = this.shadow.getElementById('i-play');
    var ipa = this.shadow.getElementById('i-pause');
    if (ip) ip.style.display = playing ? 'none' : '';
    if (ipa) ipa.style.display = playing ? '' : 'none';
  };

  FloatUI.prototype.updateProgress = function (cur, tot, pct) {
    if (!this.shadow) return;
    var pf = this.shadow.getElementById('pf');
    var tc = this.shadow.getElementById('tc');
    var td = this.shadow.getElementById('td');
    if (pf) pf.style.width = (Math.max(0, Math.min(100, pct * 100))).toFixed(2) + '%';
    if (tc) tc.textContent = cur || '0:00';
    if (td) td.textContent = tot || '0:00';
  };

  FloatUI.prototype.updateShuffle = function (on) {
    if (!this.shadow) return;
    var b = this.shadow.getElementById('c-shuf');
    if (b) b.classList.toggle('on', on);
  };

  FloatUI.prototype.updateRepeat = function (mode) {
    if (!this.shadow) return;
    var b = this.shadow.getElementById('c-rep');
    var badge = this.shadow.getElementById('rep-badge');
    if (b) b.classList.toggle('on', mode > 0);
    if (badge) {
      badge.textContent = mode === 2 ? '1' : '';
      badge.style.display = mode === 2 ? 'block' : '';
    }
  };

  FloatUI.prototype.updateVolume = function (val) {
    if (!this.shadow) return;
    var sl = this.shadow.getElementById('vs');
    var ic = this.shadow.getElementById('vi');
    if (sl) sl.value = val;
    if (ic) ic.textContent = val === 0 ? '\uD83D\uDD07' : val < 50 ? '\uD83D\uDD09' : '\uD83D\uDD0A';
  };

  // ============================================================
  // PART 3: CORE LOGIC
  // ============================================================

  var ui = new FloatUI();
  var syncTimer = null;
  var mutObs = null;
  var isVisible = false;
  var retryCount = 0;
  var lastTitle = null;
  var debTimers = {};
  var pipWindow = null;
  var pipUI = null;

  function waitForSpotify(cb) {
    var called = false;
    var fire = function () {
      if (called) return;
      called = true;
      clearInterval(t);
      clearTimeout(timeout);
      cb();
    };
    var t = setInterval(function () {
      if (resolveSelector(SELECTORS.nowPlayingWidget)) fire();
    }, 800);
    // Fallback: mount after 10s even if no widget found yet
    var timeout = setTimeout(fire, 10000);
  }

  function loadStorage(cb) {
    try {
      chrome.storage.local.get(['position', 'size', 'mode', 'visible'], function (r) { cb(r || {}); });
    } catch (_) { cb({}); }
  }

  function saveStorage(data) {
    deb(function () {
      try { chrome.storage.local.set(data); } catch (_) { }
    }, 600, 'save')();
  }

  function deb(fn, delay, key) {
    return function () {
      var a = arguments, c = this;
      clearTimeout(debTimers[key]);
      debTimers[key] = setTimeout(function () { fn.apply(c, a); }, delay);
    };
  }

  // ── Document PiP ──────────────────────────────────────────────────────────
  async function openDocumentPiP() {
    if (pipWindow) {
      pipWindow.focus();
      return;
    }
    if (!window.documentPictureInPicture) {
      alert("Your browser does not natively support the Document Picture-in-Picture API.");
      return;
    }
    try {
      pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 280,
        height: 420
      });
      
      var host = pipWindow.document.createElement('div');
      host.style.width = '100%';
      host.style.height = '100%';
      pipWindow.document.body.style.margin = '0';
      pipWindow.document.body.style.background = '#000';
      pipWindow.document.body.appendChild(host);

      pipUI = new FloatUI(host);
      pipUI.mount();

      // CSS overrides specifically for PiP
      var over = pipWindow.document.createElement('style');
      over.textContent = `
        #player { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; height: 100% !important; border-radius: 0 !important; box-shadow: none !important; border: none !important; cursor: default !important; }
        #dh { display: none !important; }
        #btn-full, #btn-compact, #btn-mini, #c-expand, #pip-btn { display: none !important; }
        #aw { flex: 1 1 auto; min-height: 0; padding: 0 14px 10px !important; display: flex; align-items: center; justify-content: center; }
        .ai { height: 100% !important; max-height: 100% !important; padding-top: 0 !important; position: static !important; display: flex; align-items: center; justify-content: center; background: transparent !important; }
        #art { width: auto !important; max-width: 100%; height: 100%; object-fit: contain; position: static !important; }
        #ti { padding: 0 14px 4px !important; overflow: hidden; min-width: 0; flex-shrink: 0; }
        #pw { padding: 0 14px 2px !important; flex-shrink: 0; }
        .trow { margin-bottom: 3px !important; }
        #ctrl { padding: 2px 14px 6px !important; flex-shrink: 0; }
        #vr { padding: 0 14px 10px !important; flex-shrink: 0; }
        @media (max-height: 250px) { #aw { display: none !important; } }
      `;
      pipUI.shadow.appendChild(over);

      pipUI.on({
        'play-pause': handlePlayPause,
        'prev': handlePrev,
        'next': handleNext,
        'shuffle': handleShuffle,
        'repeat': handleRepeat,
        'seek': handleSeek,
        'volume': handleVolume,
        'mute': function () { safeClick('muteButton'); }
      });

      pipWindow.addEventListener('pagehide', function () {
        pipWindow = null;
        pipUI = null;
        if (!isVisible) { stopSync(); stopObs(); }
      });

      if (!syncTimer) { startSync(); startObs(); }
      syncNow();
    } catch (err) {
      console.error("[SpotifyFloat PiP]", err);
      throw err;
    }
  }

  // ── Boot ─────────────────────────────────────────────────────────────────
  waitForSpotify(function () {
    loadStorage(function (stored) {
      ui.mount();
      if (stored.mode) ui.setMode(stored.mode);
      if (stored.position) ui.setPosition(stored.position);
      if (stored.size) ui.setSize(stored.size);
      if (stored.visible === false) { ui.isVisible = false; ui.host.style.display = 'none'; }

      isVisible = ui.isVisible;

      ui.on({
        'play-pause': handlePlayPause,
        'prev': handlePrev,
        'next': handleNext,
        'shuffle': handleShuffle,
        'repeat': handleRepeat,
        'seek': handleSeek,
        'volume': handleVolume,
        'mute': function () { safeClick('muteButton'); },
        'hide': function () { isVisible = false; if (!pipUI) { stopSync(); stopObs(); } },
        'mode': function (m) { saveStorage({ mode: m }); },
        'pos': function (p) { saveStorage({ position: p }); },
        'size': function (s) { saveStorage({ size: s }); },
        'open-pip': function () { openDocumentPiP().catch(function(){}); }
      });

      ui.onVisibilityChange(function (v) {
        isVisible = v;
        if (v || pipUI) { syncNow(); startSync(); startObs(); }
        else { stopSync(); stopObs(); }
        saveStorage({ visible: v });
      });

      syncNow();
      if (isVisible) { startSync(); startObs(); }
      registerHotkeys();
    });
  });

  // ── Sync ─────────────────────────────────────────────────────────────────
  function syncNow() {
    if ((!ui || !isVisible) && !pipUI) return;
    try {
      var title = readText('trackTitle');
      var artist = readText('artistName');
      var artEl = cachedResolve('albumArt');
      var artUrl = '';
      if (artEl && artEl.src) {
        artUrl = artEl.src.replace(/ab67616d00004851/g, 'ab67616d0000b273')
                          .replace(/ab67616d00001e02/g, 'ab67616d0000b273');
      }

      if (title && title !== lastTitle) { lastTitle = title; invalidateCache(); }

      var pb = cachedResolve('playPauseButton');
      var playing = pb ? (pb.getAttribute('aria-label') || '').toLowerCase().indexOf('pause') !== -1 : false;
      var shuf = cachedResolve('shuffleButton');
      var shuffleOn = shuf ? (shuf.getAttribute('aria-label') || '').toLowerCase().indexOf('disable') !== -1 : false;
      var rep = cachedResolve('repeatButton');
      var repeatMode = 0;
      if (rep) {
        var rl = (rep.getAttribute('aria-label') || '').toLowerCase();
        repeatMode = rl.indexOf('one') !== -1 ? 2 : rl.indexOf('disable') !== -1 ? 1 : 0;
      }
      var prog = calcProgress();
      var cTime = readText('currentTime');
      var tTime = readText('totalDuration');
      var volEl = resolveSelector(SELECTORS.volumeSlider);
      var vl = volEl ? parseInt(volEl.value, 10) : -1;

      if (ui && isVisible) {
        ui.updateTrack(title, artist, artUrl);
        ui.updatePlayState(playing);
        ui.updateProgress(cTime, tTime, prog);
        ui.updateShuffle(shuffleOn);
        ui.updateRepeat(repeatMode);
      }

      if (pipUI) {
        pipUI.updateTrack(title, artist, artUrl);
        pipUI.updatePlayState(playing);
        pipUI.updateProgress(cTime, tTime, prog);
        pipUI.updateShuffle(shuffleOn);
        pipUI.updateRepeat(repeatMode);
        if (vl !== -1 && pipUI.shadow.activeElement !== pipUI.shadow.querySelector('#vs')) {
          pipUI.updateVolume(vl);
        }
      }

      retryCount = 0;
    } catch (e) {
      if (++retryCount >= 5) {
        retryCount = 0; invalidateCache(); stopObs();
        setTimeout(function () { startObs(); syncNow(); }, 2000);
      }
    }
  }

  function calcProgress() {
    var s = resolveSelector(SELECTORS.seekSlider);
    if (s) { var v = parseFloat(s.value), m = parseFloat(s.max) || 100; if (!isNaN(v) && m > 0) return v / m; }
    var p = resolveSelector(SELECTORS.progressBar);
    if (p) {
      var inn = p.querySelector('[role="progressbar"]') || p;
      var n = parseFloat(inn.getAttribute('aria-valuenow')), mx = parseFloat(inn.getAttribute('aria-valuemax'));
      if (!isNaN(n) && !isNaN(mx) && mx > 0) return n / mx;
    }
    var cur = readText('currentTime'), tot = readText('totalDuration');
    if (cur && tot) { var cs = sec(cur), ts = sec(tot); if (ts > 0) return cs / ts; }
    return 0;
  }

  function sec(s) {
    if (!s) return 0;
    var p = s.split(':').map(Number);
    return p.length === 3 ? p[0] * 3600 + p[1] * 60 + p[2] : p.length === 2 ? p[0] * 60 + p[1] : 0;
  }

  function startSync() { stopSync(); syncTimer = setInterval(function () { if (isVisible || pipUI) syncNow(); }, 500); }
  function stopSync() { if (syncTimer) { clearInterval(syncTimer); syncTimer = null; } }

  function startObs() {
    if (mutObs) return;
    var target = resolveSelector(SELECTORS.nowPlayingWidget) || document.body;
    var handler = function () { invalidateCache(); if (isVisible || pipUI) syncNow(); };
    var debHandler = (function () {
      var t;
      return function () { clearTimeout(t); t = setTimeout(handler, 200); };
    })();
    mutObs = new MutationObserver(debHandler);
    mutObs.observe(target, { childList: true, subtree: true, attributes: true, attributeFilter: ['aria-label', 'src', 'style', 'class'] });
  }

  function stopObs() { if (mutObs) { mutObs.disconnect(); mutObs = null; } }

  // ── Controls ─────────────────────────────────────────────────────────────
  function handlePlayPause() { if (!safeClick('playPauseButton')) retry('playPauseButton'); setTimeout(syncNow, 120); }
  function handlePrev() { if (!safeClick('prevButton')) retry('prevButton'); setTimeout(syncNow, 350); }
  function handleNext() { if (!safeClick('nextButton')) retry('nextButton'); setTimeout(syncNow, 350); }
  function handleShuffle() { invalidateCache('shuffleButton'); if (!safeClick('shuffleButton')) retry('shuffleButton'); setTimeout(syncNow, 200); }
  function handleRepeat() { invalidateCache('repeatButton'); safeClick('repeatButton'); setTimeout(syncNow, 200); }

  function handleSeek(pct) {
    var sl = resolveSelector(SELECTORS.seekSlider);
    if (sl) {
      var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(sl, pct * parseFloat(sl.max || '100'));
      sl.dispatchEvent(new Event('input', { bubbles: true }));
      sl.dispatchEvent(new Event('change', { bubbles: true }));
      setTimeout(syncNow, 300); return;
    }
    var pb = resolveSelector(SELECTORS.progressBar);
    if (pb) {
      var r = pb.getBoundingClientRect(), cx = r.left + r.width * pct, cy = r.top + r.height / 2;
      ['mousedown', 'mouseup', 'click'].forEach(function (t) {
        pb.dispatchEvent(new MouseEvent(t, { bubbles: true, clientX: cx, clientY: cy, buttons: 1 }));
      });
      setTimeout(syncNow, 300);
    }
  }

  function handleVolume(val) {
    var sl = resolveSelector(SELECTORS.volumeSlider);
    if (!sl) return;
    var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(sl, val);
    sl.dispatchEvent(new Event('input', { bubbles: true }));
    sl.dispatchEvent(new Event('change', { bubbles: true }));
    ui.updateVolume(val);
  }

  function retry(key, n) {
    n = n || 0; if (n >= 5) return;
    setTimeout(function () { invalidateCache(key); if (!safeClick(key)) retry(key, n + 1); }, 1200 * (n + 1));
  }

  // ── Hotkeys ───────────────────────────────────────────────────────────────
  function registerHotkeys() {
    document.addEventListener('keydown', function (e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return;
      if (e.ctrlKey && e.code === 'ArrowRight') { e.preventDefault(); handleNext(); }
      else if (e.ctrlKey && e.code === 'ArrowLeft') { e.preventDefault(); handlePrev(); }
    });
  }

  // ── Messages ──────────────────────────────────────────────────────────────
  chrome.runtime.onMessage.addListener(function (msg, _s, reply) {
    if (msg.type === 'TOGGLE_PLAYER') {
      if (ui.isVisible) {
        ui.isVisible = false;
        if (ui.host) ui.host.style.display = 'none';
        isVisible = false; 
        if (!pipUI) { stopSync(); stopObs(); }
      } else {
        ui.show(); isVisible = true; syncNow(); startSync(); startObs();
      }
      reply({ ok: true, visible: ui.isVisible });

    } else if (msg.type === 'GET_STATUS') {
      reply({ visible: ui.isVisible, mode: ui.mode });

    } else if (msg.type === 'TAB_UPDATED') {
      setTimeout(function () { stopObs(); invalidateCache(); startObs(); syncNow(); }, 1000);

    } else if (msg.type === 'OPEN_PIP') {
      openDocumentPiP().then(function() { reply({ ok: true }); }).catch(function(e) { reply({ error: e.message }); });
      return true;
    }
  });

})();
