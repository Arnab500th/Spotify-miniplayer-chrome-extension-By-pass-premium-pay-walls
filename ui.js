// ui.js — Floating Mini-Player UI Module
// Shadow DOM encapsulated, draggable, resizable, multi-mode.

export const MODES = { FULL: 'full', COMPACT: 'compact', MINI: 'mini' };

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

  :host {
    all: initial;
    font-family: 'DM Sans', system-ui, -apple-system, sans-serif;
  }

  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
  }

  /* ── CSS Custom Properties ───────────────────────────────────────────── */
  #float-root {
    --bg-primary:    #0a0a0f;
    --bg-secondary:  #13131a;
    --bg-tertiary:   #1c1c26;
    --bg-hover:      #242430;
    --accent:        #1db954;
    --accent-dim:    rgba(29, 185, 84, 0.18);
    --accent-glow:   rgba(29, 185, 84, 0.35);
    --text-primary:  #ffffff;
    --text-secondary:#a0a0b8;
    --text-muted:    #56566a;
    --border:        rgba(255,255,255,0.07);
    --border-focus:  rgba(29, 185, 84, 0.5);
    --shadow-lg:     0 24px 60px rgba(0,0,0,0.7), 0 8px 20px rgba(0,0,0,0.5);
    --shadow-glow:   0 0 30px rgba(29,185,84,0.15);
    --radius:        16px;
    --radius-sm:     10px;
    --transition:    0.2s cubic-bezier(0.4, 0, 0.2, 1);

    position: fixed;
    z-index: 2147483647;
    user-select: none;
    -webkit-font-smoothing: antialiased;
    pointer-events: none;
  }

  /* ── Player Container ────────────────────────────────────────────────── */
  #player {
    pointer-events: all;
    position: relative;
    background: var(--bg-primary);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    box-shadow: var(--shadow-lg), var(--shadow-glow);
    overflow: hidden;
    transition: width var(--transition), height var(--transition), border-radius var(--transition);
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
  }

  /* Subtle noise texture overlay */
  #player::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.03'/%3E%3C/svg%3E");
    border-radius: var(--radius);
    pointer-events: none;
    z-index: 100;
    opacity: 0.4;
  }

  /* ── Drag Handle / Header ─────────────────────────────────────────────── */
  #drag-handle {
    padding: 10px 14px 6px;
    cursor: grab;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }

  #drag-handle:active { cursor: grabbing; }

  .drag-dots {
    display: flex;
    gap: 3px;
    align-items: center;
    opacity: 0.25;
    transition: opacity var(--transition);
  }
  #drag-handle:hover .drag-dots { opacity: 0.6; }

  .drag-dot {
    width: 3px;
    height: 3px;
    border-radius: 50%;
    background: var(--text-secondary);
  }

  .header-controls {
    display: flex;
    gap: 4px;
    align-items: center;
  }

  .hbtn {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    transition: background var(--transition), transform var(--transition);
    background: transparent;
    color: var(--text-muted);
  }
  .hbtn:hover {
    background: var(--bg-hover);
    color: var(--text-secondary);
    transform: scale(1.1);
  }

  .mode-btn {
    background: var(--bg-tertiary);
    font-size: 8px;
    font-weight: 600;
    letter-spacing: 0.04em;
    padding: 0 6px;
    width: auto;
    height: 18px;
    border-radius: 4px;
    color: var(--text-secondary);
    text-transform: uppercase;
  }
  .mode-btn.active {
    background: var(--accent-dim);
    color: var(--accent);
  }

  .close-btn {
    color: var(--text-muted);
  }
  .close-btn:hover {
    background: rgba(255,60,60,0.15);
    color: #ff6060;
  }

  /* ── Art Section ─────────────────────────────────────────────────────── */
  #art-section {
    padding: 0 14px 12px;
    flex-shrink: 0;
    overflow: hidden;
    transition: all var(--transition);
  }

  .art-wrapper {
    position: relative;
    width: 100%;
    padding-top: 100%;
    border-radius: 12px;
    overflow: hidden;
    background: var(--bg-tertiary);
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  }

  #album-art {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.4s ease, opacity 0.3s ease;
  }

  #album-art.loading { opacity: 0; }
  #album-art:not(.loading) { opacity: 1; }

  .art-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg, transparent 50%, rgba(0,0,0,0.5) 100%);
    pointer-events: none;
  }

  /* ── Track Info ──────────────────────────────────────────────────────── */
  #track-info {
    padding: 0 14px 10px;
    flex-shrink: 0;
    overflow: hidden;
    min-width: 0;
  }

  .track-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.3;
    letter-spacing: -0.01em;
  }

  .track-artist {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    margin-top: 2px;
  }

  /* Scroll animation for long titles */
  .scrolling-text {
    display: inline-block;
    animation: scroll-text 8s linear infinite;
    padding-right: 30px;
    white-space: nowrap;
  }
  @keyframes scroll-text {
    0%   { transform: translateX(0); }
    100% { transform: translateX(-50%); }
  }

  /* ── Progress Bar ────────────────────────────────────────────────────── */
  #progress-section {
    padding: 0 14px 6px;
    flex-shrink: 0;
  }

  .time-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 5px;
  }

  .time-label {
    font-size: 10px;
    color: var(--text-muted);
    font-variant-numeric: tabular-nums;
    letter-spacing: 0.02em;
  }

  .progress-track {
    width: 100%;
    height: 3px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    position: relative;
    cursor: pointer;
    transition: height var(--transition);
  }

  .progress-track:hover {
    height: 5px;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--accent), #1ed760);
    border-radius: 3px;
    position: relative;
    transition: width 0.5s linear;
    pointer-events: none;
  }

  .progress-fill::after {
    content: '';
    position: absolute;
    right: -4px;
    top: 50%;
    transform: translateY(-50%) scale(0);
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--accent);
    box-shadow: 0 0 8px var(--accent-glow);
    transition: transform var(--transition);
  }

  .progress-track:hover .progress-fill::after {
    transform: translateY(-50%) scale(1);
  }

  /* ── Playback Controls ───────────────────────────────────────────────── */
  #controls {
    padding: 6px 14px 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .ctrl-btn {
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform var(--transition), background var(--transition), color var(--transition);
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .ctrl-btn:hover {
    color: var(--text-primary);
    transform: scale(1.1);
    background: var(--bg-tertiary);
  }

  .ctrl-btn:active {
    transform: scale(0.95);
  }

  .ctrl-btn.secondary {
    width: 30px;
    height: 30px;
    font-size: 14px;
  }

  .ctrl-btn.primary {
    width: 42px;
    height: 42px;
    background: var(--accent);
    color: #000;
    font-size: 16px;
    box-shadow: 0 4px 14px var(--accent-glow);
  }

  .ctrl-btn.primary:hover {
    background: #1ed760;
    color: #000;
    transform: scale(1.08);
    box-shadow: 0 6px 20px var(--accent-glow);
  }

  .ctrl-btn.active-tint {
    color: var(--accent);
  }

  /* ── Compact Mode ─────────────────────────────────────────────────────── */
  #float-root.mode-compact #art-section {
    display: none;
  }
  #float-root.mode-compact #track-info {
    padding: 4px 14px 8px;
  }
  #float-root.mode-compact .track-title {
    font-size: 12px;
  }
  #float-root.mode-compact .track-artist {
    font-size: 11px;
  }
  #float-root.mode-compact #controls {
    padding: 2px 10px 10px;
    gap: 4px;
  }
  #float-root.mode-compact .ctrl-btn.primary {
    width: 34px;
    height: 34px;
    font-size: 14px;
  }
  #float-root.mode-compact .ctrl-btn.secondary {
    width: 26px;
    height: 26px;
    font-size: 12px;
  }

  /* ── Mini Mode ────────────────────────────────────────────────────────── */
  #float-root.mode-mini #art-section,
  #float-root.mode-mini #track-info,
  #float-root.mode-mini #progress-section {
    display: none;
  }
  #float-root.mode-mini #controls {
    padding: 8px 10px;
    gap: 2px;
  }
  #float-root.mode-mini #player {
    border-radius: 40px;
  }
  #float-root.mode-mini .ctrl-btn.secondary {
    width: 28px;
    height: 28px;
    font-size: 12px;
  }
  #float-root.mode-mini .ctrl-btn.primary {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
  #float-root.mode-mini #drag-handle {
    display: none;
  }

  /* ── Resize Handle ────────────────────────────────────────────────────── */
  #resize-handle {
    position: absolute;
    bottom: 0;
    right: 0;
    width: 18px;
    height: 18px;
    cursor: se-resize;
    display: flex;
    align-items: flex-end;
    justify-content: flex-end;
    padding: 4px;
    z-index: 10;
    opacity: 0.3;
    transition: opacity var(--transition);
  }

  #player:hover #resize-handle {
    opacity: 0.7;
  }

  .resize-icon {
    display: flex;
    flex-direction: column;
    gap: 2px;
    transform: rotate(0deg);
  }
  .resize-icon span {
    display: block;
    height: 1.5px;
    background: var(--text-secondary);
    border-radius: 1px;
  }
  .resize-icon span:nth-child(1) { width: 10px; }
  .resize-icon span:nth-child(2) { width: 7px; }
  .resize-icon span:nth-child(3) { width: 4px; }

  /* ── Volume Slider (hidden, shown on hover in compact) ────────────────── */
  #volume-row {
    padding: 0 14px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .vol-icon {
    color: var(--text-muted);
    font-size: 12px;
    flex-shrink: 0;
    cursor: pointer;
    transition: color var(--transition);
  }
  .vol-icon:hover { color: var(--text-secondary); }

  .vol-slider {
    flex: 1;
    -webkit-appearance: none;
    height: 3px;
    background: var(--bg-tertiary);
    border-radius: 3px;
    outline: none;
    cursor: pointer;
    transition: height var(--transition);
  }
  .vol-slider:hover { height: 4px; }

  .vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--accent);
    cursor: pointer;
    box-shadow: 0 0 6px var(--accent-glow);
  }

  #float-root.mode-mini #volume-row { display: none; }

  /* ── Tooltip ─────────────────────────────────────────────────────────── */
  .tooltip {
    position: absolute;
    bottom: calc(100% + 8px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--bg-tertiary);
    color: var(--text-secondary);
    font-size: 10px;
    padding: 4px 8px;
    border-radius: 6px;
    white-space: nowrap;
    pointer-events: none;
    opacity: 0;
    transition: opacity 0.15s ease;
    border: 1px solid var(--border);
    z-index: 200;
  }
  .ctrl-btn:hover .tooltip { opacity: 1; }

  /* ── No Track State ──────────────────────────────────────────────────── */
  #no-track {
    padding: 18px 14px;
    text-align: center;
    color: var(--text-muted);
    font-size: 12px;
    line-height: 1.5;
  }

  .no-track-icon {
    font-size: 28px;
    margin-bottom: 8px;
    opacity: 0.3;
  }

  /* ── Loading Pulse ───────────────────────────────────────────────────── */
  @keyframes pulse {
    0%, 100% { opacity: 0.4; }
    50% { opacity: 0.9; }
  }
  .pulse { animation: pulse 1.5s ease infinite; }

  /* ── Animations ──────────────────────────────────────────────────────── */
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(8px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  #player { animation: fadeIn 0.25s ease forwards; }

  @keyframes trackChange {
    0%  { opacity: 1; transform: translateX(0); }
    40% { opacity: 0; transform: translateX(-12px); }
    60% { opacity: 0; transform: translateX(12px); }
    100%{ opacity: 1; transform: translateX(0); }
  }

  .track-change { animation: trackChange 0.4s ease; }

  /* ── Scrollbar hide ──────────────────────────────────────────────────── */
  ::-webkit-scrollbar { display: none; }
`;

const HTML = `
<div id="float-root">
  <div id="player">
    <!-- Drag Handle -->
    <div id="drag-handle">
      <div class="drag-dots">
        <span class="drag-dot"></span><span class="drag-dot"></span>
        <span class="drag-dot"></span><span class="drag-dot"></span>
        <span class="drag-dot"></span><span class="drag-dot"></span>
      </div>
      <div class="header-controls">
        <button class="hbtn mode-btn" id="btn-full"   title="Full mode">FULL</button>
        <button class="hbtn mode-btn" id="btn-compact" title="Compact mode">CMP</button>
        <button class="hbtn mode-btn" id="btn-mini"    title="Mini mode">MIN</button>
        <button class="hbtn close-btn" id="btn-close"  title="Close">✕</button>
      </div>
    </div>

    <!-- Art -->
    <div id="art-section">
      <div class="art-wrapper">
        <img id="album-art" src="" alt="Album art" draggable="false" />
        <div class="art-overlay"></div>
      </div>
    </div>

    <!-- Track Info -->
    <div id="track-info">
      <div class="track-title" id="track-title">No track playing</div>
      <div class="track-artist" id="track-artist">—</div>
    </div>

    <!-- Progress -->
    <div id="progress-section">
      <div class="time-row">
        <span class="time-label" id="time-current">0:00</span>
        <span class="time-label" id="time-total">0:00</span>
      </div>
      <div class="progress-track" id="progress-track">
        <div class="progress-fill" id="progress-fill"></div>
      </div>
    </div>

    <!-- Controls -->
    <div id="controls">
      <button class="ctrl-btn secondary" id="ctrl-shuffle" aria-label="Shuffle">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="16 3 21 3 21 8"/><polyline points="16 21 21 21 21 16"/>
          <line x1="4" y1="20" x2="21" y2="3"/><line x1="21" y1="21" x2="14" y2="14"/>
          <line x1="4" y1="4" x2="9" y2="9"/>
        </svg>
        <span class="tooltip">Shuffle</span>
      </button>

      <button class="ctrl-btn secondary" id="ctrl-prev" aria-label="Previous">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="19 20 9 12 19 4 19 20"/><line x1="5" y1="19" x2="5" y2="5" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span class="tooltip">Previous</span>
      </button>

      <button class="ctrl-btn primary" id="ctrl-play" aria-label="Play/Pause">
        <svg id="icon-play" width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        <svg id="icon-pause" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style="display:none">
          <rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/>
        </svg>
        <span class="tooltip">Play / Pause</span>
      </button>

      <button class="ctrl-btn secondary" id="ctrl-next" aria-label="Next">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19" stroke="currentColor" stroke-width="2"/>
        </svg>
        <span class="tooltip">Next</span>
      </button>

      <button class="ctrl-btn secondary" id="ctrl-repeat" aria-label="Repeat">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/>
          <polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
        </svg>
        <span class="tooltip">Repeat</span>
      </button>
    </div>

    <!-- Volume -->
    <div id="volume-row">
      <span class="vol-icon" id="vol-icon">🔊</span>
      <input type="range" class="vol-slider" id="vol-slider" min="0" max="100" value="100" />
    </div>

    <!-- Resize Handle -->
    <div id="resize-handle" aria-label="Resize">
      <div class="resize-icon">
        <span></span><span></span><span></span>
      </div>
    </div>
  </div>
</div>
`;

// ─── UI Controller Class ───────────────────────────────────────────────────────
export class FloatUI {
  constructor() {
    this.host = null;
    this.shadow = null;
    this.root = null;
    this.player = null;
    this.mode = MODES.FULL;
    this.isVisible = false;
    this._visibilityListeners = [];
    this._state = {
      title: null,
      artist: null,
      artUrl: null,
      isPlaying: false,
      progress: 0,
      currentTime: '0:00',
      totalDuration: '0:00',
      isShuffle: false,
      repeatMode: 0, // 0=off, 1=all, 2=one
      volume: 100,
    };

    // Drag state
    this._drag = { active: false, startX: 0, startY: 0, origLeft: 0, origTop: 0 };
    // Resize state
    this._resize = { active: false, startX: 0, startY: 0, origW: 0, origH: 0 };
  }

  // ── Build & Mount ──────────────────────────────────────────────────────
  mount() {
    if (this.host) return;

    this.host = document.createElement('div');
    this.host.id = 'spotify-float-host';
    document.documentElement.appendChild(this.host);

    this.shadow = this.host.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = CSS;
    this.shadow.appendChild(style);

    const template = document.createElement('div');
    template.innerHTML = HTML;
    this.shadow.appendChild(template.firstElementChild);

    this.root = this.shadow.getElementById('float-root');
    this.player = this.shadow.getElementById('player');

    this._bindEvents();
    this.isVisible = true;
    this._notifyVisibility(true);
  }

  unmount() {
    if (!this.host) return;
    this.host.remove();
    this.host = null;
    this.shadow = null;
    this.root = null;
    this.player = null;
    this.isVisible = false;
    this._notifyVisibility(false);
  }

  // ── Event Binding ─────────────────────────────────────────────────────
  _bindEvents() {
    const s = this.shadow;

    // Mode buttons
    s.getElementById('btn-full').addEventListener('click', () => this.setMode(MODES.FULL));
    s.getElementById('btn-compact').addEventListener('click', () => this.setMode(MODES.COMPACT));
    s.getElementById('btn-mini').addEventListener('click', () => this.setMode(MODES.MINI));
    s.getElementById('btn-close').addEventListener('click', () => {
      this.isVisible = false;
      this.host.style.display = 'none';
      this._notifyVisibility(false);
      this._emit('hide');
    });

    // Playback controls — emit events, handled by content.js
    s.getElementById('ctrl-play').addEventListener('click', () => this._emit('play-pause'));
    s.getElementById('ctrl-prev').addEventListener('click', () => this._emit('prev'));
    s.getElementById('ctrl-next').addEventListener('click', () => this._emit('next'));
    s.getElementById('ctrl-shuffle').addEventListener('click', () => this._emit('shuffle'));
    s.getElementById('ctrl-repeat').addEventListener('click', () => this._emit('repeat'));

    // Volume slider
    const volSlider = s.getElementById('vol-slider');
    volSlider.addEventListener('input', (e) => {
      this._emit('volume', parseInt(e.target.value));
    });
    s.getElementById('vol-icon').addEventListener('click', () => this._emit('mute'));

    // Progress bar click to seek
    s.getElementById('progress-track').addEventListener('click', (e) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      this._emit('seek', pct);
    });

    // Drag
    this._setupDrag();

    // Resize
    this._setupResize();
  }

  _emit(event, data) {
    if (!this._handlers) return;
    const fn = this._handlers[event];
    if (fn) fn(data);
  }

  on(handlers) {
    this._handlers = handlers;
  }

  onVisibilityChange(fn) {
    this._visibilityListeners.push(fn);
  }

  _notifyVisibility(visible) {
    this._visibilityListeners.forEach((fn) => fn(visible));
  }

  // ── Drag System ────────────────────────────────────────────────────────
  _setupDrag() {
    const handle = this.shadow.getElementById('drag-handle');

    handle.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      e.preventDefault();
      const rect = this.root.getBoundingClientRect();
      this._drag = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        origLeft: rect.left,
        origTop: rect.top,
      };
      document.addEventListener('mousemove', this._onDragMove);
      document.addEventListener('mouseup', this._onDragEnd);
    });

    // Touch drag
    handle.addEventListener('touchstart', (e) => {
      if (e.target.closest('button')) return;
      const t = e.touches[0];
      const rect = this.root.getBoundingClientRect();
      this._drag = {
        active: true,
        startX: t.clientX,
        startY: t.clientY,
        origLeft: rect.left,
        origTop: rect.top,
      };
      document.addEventListener('touchmove', this._onTouchDragMove, { passive: false });
      document.addEventListener('touchend', this._onDragEnd);
    }, { passive: true });
  }

  _onDragMove = (e) => {
    if (!this._drag.active) return;
    const dx = e.clientX - this._drag.startX;
    const dy = e.clientY - this._drag.startY;
    this._setPosition(this._drag.origLeft + dx, this._drag.origTop + dy);
  };

  _onTouchDragMove = (e) => {
    e.preventDefault();
    const t = e.touches[0];
    const dx = t.clientX - this._drag.startX;
    const dy = t.clientY - this._drag.startY;
    this._setPosition(this._drag.origLeft + dx, this._drag.origTop + dy);
  };

  _onDragEnd = () => {
    this._drag.active = false;
    document.removeEventListener('mousemove', this._onDragMove);
    document.removeEventListener('mouseup', this._onDragEnd);
    document.removeEventListener('touchmove', this._onTouchDragMove);
    document.removeEventListener('touchend', this._onDragEnd);
    this._emit('position-changed', this._getPosition());
  };

  _setPosition(x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const pr = this.player.getBoundingClientRect();
    x = Math.max(0, Math.min(x, vw - pr.width));
    y = Math.max(0, Math.min(y, vh - pr.height));
    this.root.style.left = x + 'px';
    this.root.style.top = y + 'px';
    this.root.style.right = 'auto';
    this.root.style.bottom = 'auto';
  }

  _getPosition() {
    return { left: this.root.style.left, top: this.root.style.top };
  }

  setPosition(pos) {
    if (!this.root) return;
    if (pos.left !== undefined) this.root.style.left = pos.left;
    if (pos.top !== undefined) this.root.style.top = pos.top;
    if (pos.right !== undefined) this.root.style.right = pos.right;
    if (pos.bottom !== undefined) this.root.style.bottom = pos.bottom;
  }

  // ── Resize System ──────────────────────────────────────────────────────
  _setupResize() {
    const handle = this.shadow.getElementById('resize-handle');

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const rect = this.player.getBoundingClientRect();
      this._resize = {
        active: true,
        startX: e.clientX,
        startY: e.clientY,
        origW: rect.width,
        origH: rect.height,
      };
      document.addEventListener('mousemove', this._onResizeMove);
      document.addEventListener('mouseup', this._onResizeEnd);
    });
  }

  _onResizeMove = (e) => {
    if (!this._resize.active) return;
    const dw = e.clientX - this._resize.startX;
    const dh = e.clientY - this._resize.startY;
    const newW = Math.max(200, Math.min(500, this._resize.origW + dw));
    const newH = Math.max(120, Math.min(700, this._resize.origH + dh));
    this.player.style.width = newW + 'px';
    this.player.style.height = newH + 'px';
  };

  _onResizeEnd = () => {
    this._resize.active = false;
    document.removeEventListener('mousemove', this._onResizeMove);
    document.removeEventListener('mouseup', this._onResizeEnd);
    this._emit('size-changed', {
      width: this.player.style.width,
      height: this.player.style.height,
    });
  };

  setSize(size) {
    if (!this.player) return;
    if (size.width) this.player.style.width = size.width;
    if (size.height) this.player.style.height = size.height;
  }

  // ── Mode ───────────────────────────────────────────────────────────────
  setMode(mode) {
    if (!Object.values(MODES).includes(mode)) return;
    this.mode = mode;
    if (!this.root) return;

    this.root.classList.remove('mode-full', 'mode-compact', 'mode-mini');
    this.root.classList.add(`mode-${mode}`);

    // Update active button
    const ids = { full: 'btn-full', compact: 'btn-compact', mini: 'btn-mini' };
    Object.entries(ids).forEach(([m, id]) => {
      const btn = this.shadow.getElementById(id);
      if (btn) btn.classList.toggle('active', m === mode);
    });

    // Resize handle visibility
    const rh = this.shadow.getElementById('resize-handle');
    if (rh) rh.style.display = mode === MODES.MINI ? 'none' : '';

    this._emit('mode-changed', mode);
  }

  show() {
    if (!this.host) this.mount();
    this.host.style.display = '';
    this.isVisible = true;
    this._notifyVisibility(true);
  }

  // ── State Updates ─────────────────────────────────────────────────────
  updateTrack({ title, artist, artUrl }) {
    if (!this.shadow) return;
    const changed = title !== this._state.title || artist !== this._state.artist;

    if (changed) {
      const ti = this.shadow.getElementById('track-info');
      if (ti) {
        ti.classList.remove('track-change');
        void ti.offsetWidth; // reflow
        ti.classList.add('track-change');
      }
    }

    this._state.title = title;
    this._state.artist = artist;
    this._state.artUrl = artUrl;

    const titleEl = this.shadow.getElementById('track-title');
    const artistEl = this.shadow.getElementById('track-artist');
    const artEl = this.shadow.getElementById('album-art');

    if (titleEl && title) {
      titleEl.textContent = title;
      // Scroll if overflowing
      if (title.length > 22) {
        titleEl.innerHTML = `<span class="scrolling-text">${title}&nbsp;&nbsp;&nbsp;${title}</span>`;
      }
    }
    if (artistEl && artist) artistEl.textContent = artist;
    if (artEl && artUrl && artUrl !== artEl.src) {
      artEl.classList.add('loading');
      artEl.onload = () => artEl.classList.remove('loading');
      artEl.src = artUrl;
    }
  }

  updatePlayState(isPlaying) {
    if (!this.shadow) return;
    this._state.isPlaying = isPlaying;
    const playIcon = this.shadow.getElementById('icon-play');
    const pauseIcon = this.shadow.getElementById('icon-pause');
    if (playIcon) playIcon.style.display = isPlaying ? 'none' : '';
    if (pauseIcon) pauseIcon.style.display = isPlaying ? '' : 'none';
  }

  updateProgress(currentTime, totalDuration, progressPct) {
    if (!this.shadow) return;
    const fill = this.shadow.getElementById('progress-fill');
    const cur = this.shadow.getElementById('time-current');
    const tot = this.shadow.getElementById('time-total');
    if (fill) fill.style.width = `${Math.max(0, Math.min(100, progressPct * 100))}%`;
    if (cur) cur.textContent = currentTime || '0:00';
    if (tot) tot.textContent = totalDuration || '0:00';
  }

  updateShuffle(active) {
    if (!this.shadow) return;
    this._state.isShuffle = active;
    const btn = this.shadow.getElementById('ctrl-shuffle');
    if (btn) btn.classList.toggle('active-tint', active);
  }

  updateRepeat(mode) {
    if (!this.shadow) return;
    this._state.repeatMode = mode;
    const btn = this.shadow.getElementById('ctrl-repeat');
    if (btn) btn.classList.toggle('active-tint', mode > 0);
  }

  updateVolume(val) {
    if (!this.shadow) return;
    const slider = this.shadow.getElementById('vol-slider');
    if (slider) slider.value = val;
    const icon = this.shadow.getElementById('vol-icon');
    if (icon) {
      icon.textContent = val === 0 ? '🔇' : val < 50 ? '🔉' : '🔊';
    }
  }
}
