// selectors.js — Resilient DOM selector mapping for Spotify Web
// Each entry has primary (data-testid) + multiple fallback selectors.
// Auto-recovery logic retries when selectors break after Spotify updates.

export const SELECTORS = {
  // ── Playback Controls ────────────────────────────────────────────────
  playPauseButton: [
    '[data-testid="control-button-playpause"]',
    'button[aria-label="Play"]',
    'button[aria-label="Pause"]',
    '.player-controls__buttons button[aria-label*="Play"]',
    '.player-controls__buttons button[aria-label*="Pause"]',
    'button.spoticon-play-16',
    'button.spoticon-pause-16',
  ],

  nextButton: [
    '[data-testid="control-button-skip-forward"]',
    'button[aria-label="Next"]',
    'button[aria-label="Skip to next track"]',
    '.player-controls__buttons button[aria-label*="Next"]',
  ],

  prevButton: [
    '[data-testid="control-button-skip-back"]',
    'button[aria-label="Previous"]',
    'button[aria-label="Skip to previous track"]',
    '.player-controls__buttons button[aria-label*="Previous"]',
  ],

  shuffleButton: [
    '[data-testid="control-button-shuffle"]',
    'button[aria-label="Enable shuffle"]',
    'button[aria-label="Disable shuffle"]',
  ],

  repeatButton: [
    '[data-testid="control-button-repeat"]',
    'button[aria-label="Enable repeat"]',
    'button[aria-label="Enable repeat one"]',
    'button[aria-label="Disable repeat"]',
  ],

  // ── Progress / Seek ──────────────────────────────────────────────────
  progressBar: [
    '[data-testid="progress-bar"]',
    '[data-testid="playback-progressbar"]',
    '.playback-bar__progress-time-elapsed',
    'div[role="progressbar"]',
    '.progress-bar',
  ],

  progressBarInner: [
    '[data-testid="progress-bar"] [role="progressbar"]',
    '[data-testid="playback-progressbar"] div[style*="width"]',
    'div[data-testid="progress-bar"] > div > div',
  ],

  seekSlider: [
    '[data-testid="progress-bar"] input[type="range"]',
    'input[aria-label="Change progress"]',
    '.playback-bar input[type="range"]',
    '#progress-bar input',
  ],

  currentTime: [
    '[data-testid="playback-position"]',
    '.playback-bar__progress-time:first-child',
    'span[data-testid="playback-position"]',
    '.player-position',
  ],

  totalDuration: [
    '[data-testid="playback-duration"]',
    '.playback-bar__progress-time:last-child',
    'span[data-testid="playback-duration"]',
    '.player-duration',
  ],

  // ── Track Info ───────────────────────────────────────────────────────
  trackTitle: [
    '[data-testid="context-item-info-title"]',
    '[data-testid="now-playing-widget"] a[data-testid="context-item-link"]',
    '.now-playing-widget a[href*="track"]',
    '.track-info__name a',
    'a[aria-label*="Now playing:"]',
    '.now-playing .track-name',
    '[class*="track-name"]',
    '.player-track-info__name',
  ],

  artistName: [
    '[data-testid="context-item-info-artist"]',
    '[data-testid="context-item-info-subtitles"] a',
    '.now-playing-widget [data-testid="context-item-info-subtitles"]',
    '.track-info__artists a',
    '.now-playing .artist-name',
    '[class*="artist-name"]',
    '.player-track-info__artist',
  ],

  albumArt: [
    '[data-testid="coverart-image"]',
    '[data-testid="now-playing-widget"] img',
    '.now-playing-widget img[src*="i.scdn.co"]',
    '.cover-art img',
    '.now-playing img',
    'img[aria-label*="album art" i]',
    '.player-cover-art img',
  ],

  // ── Volume ───────────────────────────────────────────────────────────
  volumeSlider: [
    '[data-testid="volume-bar"] input[type="range"]',
    'input[aria-label*="volume" i]',
    '.volume-bar input[type="range"]',
  ],

  muteButton: [
    '[data-testid="volume-bar-toggle-mute-button"]',
    'button[aria-label*="Mute" i]',
    'button[aria-label*="Unmute" i]',
    '.volume-bar__icon-button',
  ],

  // ── Now Playing Widget (root) ────────────────────────────────────────
  nowPlayingWidget: [
    '[data-testid="now-playing-widget"]',
    '.now-playing-bar',
    '.player-controls',
    'footer[class*="now-playing"]',
  ],

  // ── Playback bar container ───────────────────────────────────────────
  playbackBar: [
    '[data-testid="playback-progressbar"]',
    '.playback-bar',
    '.player-controls__progress',
  ],
};

// ─── Selector Resolution Utilities ────────────────────────────────────────────

/**
 * Resolves the first matching element from a selector list.
 * Returns [element, selectorIndex] or [null, -1].
 */
export function resolveSelector(selectorList) {
  for (let i = 0; i < selectorList.length; i++) {
    try {
      const el = document.querySelector(selectorList[i]);
      if (el) return [el, i];
    } catch (_) {
      // invalid selector, skip
    }
  }
  return [null, -1];
}

/**
 * Resolves all matching elements from a selector list (uses the first list entry that has results).
 */
export function resolveAll(selectorList) {
  for (const sel of selectorList) {
    try {
      const els = document.querySelectorAll(sel);
      if (els.length > 0) return Array.from(els);
    } catch (_) {}
  }
  return [];
}

/**
 * Cached resolution with TTL to avoid re-querying DOM on every tick.
 */
const _cache = new Map();
const CACHE_TTL = 5000; // 5 seconds

export function cachedResolve(key) {
  const now = Date.now();
  const cached = _cache.get(key);
  if (cached && now - cached.ts < CACHE_TTL) return cached.el;

  const [el] = resolveSelector(SELECTORS[key] || []);
  _cache.set(key, { el, ts: now });
  return el;
}

export function invalidateCache(key) {
  if (key) _cache.delete(key);
  else _cache.clear();
}

/**
 * Click a resolved element safely.
 */
export function safeClick(key) {
  const el = cachedResolve(key);
  if (el) {
    el.click();
    return true;
  }
  return false;
}

/**
 * Read text content from a selector key.
 */
export function readText(key) {
  const el = cachedResolve(key);
  return el ? (el.textContent || el.innerText || '').trim() : null;
}

/**
 * Read an attribute from a resolved element.
 */
export function readAttr(key, attr) {
  const el = cachedResolve(key);
  return el ? el.getAttribute(attr) : null;
}
