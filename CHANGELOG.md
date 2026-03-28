# Changelog

All notable changes to **Spotify Float — Mini Player** are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [1.5.0] — 2026-03-28

### Added

- **Drag-to-seek** — Implemented `FloatUI.prototype._setupSeek` with `mousedown` → `mousemove` → `mouseup` listeners on `#pt` (progress track). Progress fill updates live during scrub; `seek` emits only once on `mouseup`. `e.stopPropagation()` on `mousedown` prevents the drag handle system activating simultaneously.
- **Glassmorphism floating player** — `#player` uses `backdrop-filter: blur(25px) saturate(150%)`, a translucent `rgba(13,13,18,0.65)` background, a `1px solid rgba(255,255,255,0.08)` border, and a `linear-gradient` highlight overlay via `#player::after`.
- **Real PNG icon generation** — `generate-icons.js` rewritten to produce true binary PNGs using only Node's built-in `zlib` (no `canvas` dependency). Encodes RGBA pixel data into valid PNG chunks (IHDR, IDAT, IEND) with correct CRC32 checksums. Icons now render in the Chrome toolbar.
- **Redesigned popup** — New `popup.html`: gradient logo with pulsing ring animation (`@keyframes ring-pulse`), gradient primary button with inner highlight sheen, `KEYBOARD SHORTCUTS` section label, shortcut rows with hover states, 3D `<kbd>` tags (`border-bottom-width: 2px`), blinking status dot (`@keyframes dot-blink`).

### Fixed

- **Duplicate seek emission** — Removed the original `addEventListener('click', ...)` on `#pt` inside `_bindAll` that coexisted with `_setupSeek`, causing every click to emit `seek` twice with different positions.
- **`updateProgress` blanking time labels during scrub** — Previous implementation called `updateProgress('', '', pct)` during drag, wiping the current/total time display. Fixed: `#pf` width updated directly during drag; `_emit('seek', pct)` called once on `mouseup` only.
- **PiP progress bar permanently invisible and unclickable** — CSS `:hover` does not fire in Document PiP windows (separate OS-level window context). `#pw` was stuck at `opacity: 0; pointer-events: none`. Fixed by replacing all `:hover` CSS with a `.pip-hovered` class toggled by JS `mouseenter`/`mouseleave` on the PiP `document` and `#player`.
- **PiP controls permanently hidden** — Same root cause as above. `#ctrl` was `opacity: 0; pointer-events: none` with no way to become interactive. Fixed with the `.pip-hovered` JS class approach.
- **Track title and artist invisible at small PiP sizes** — `#ti` had `padding-bottom: 60px` to reserve space for the controls overlay, pushing text offscreen at small window heights. Reduced to `12px`; controls overlay at their own `z-index` independently.
- **`@media (max-height: 180px)` too aggressive** — Was hiding `#ti` entirely at heights many users resize to. Replaced: artist hides and title shrinks at `160px`; full `#ti` hide only below `110px`.

### Changed

- **`_setupSeek` emit strategy** — Changed from emitting on `mousedown` to emitting only on `mouseup`, preventing double-seeking and giving accurate final position.
- **Progress fill transition** — `.pf` uses `transition: width 0.4s linear` for smooth visual tracking between sync ticks.
- **PiP style overrides** — All `#player:hover` selectors replaced with `#player.pip-hovered`. Class toggled via `mouseenter`/`mouseleave` on the PiP window's document.

---

## [1.4.2] — 2026-03-28

### Added

- **Document PiP window** — `openDocumentPiP()` using `window.documentPictureInPicture.requestWindow()`. A second `FloatUI` instance mounted into the PiP window's document. Album art fills the window (`100%` width/height, `object-fit: cover`). Controls and seek bar overlay on hover; track info shown by default with a gradient fade.
- **PiP hover detection via JS** — `mouseenter`/`mouseleave` on the PiP window document toggle `.pip-hovered` on `#player`, driving `opacity` transitions for `#ctrl`, `#pw`, `#ti`, and the `::after` dark overlay.
- **PiP sync** — `pipUI` receives all `updateTrack`, `updatePlayState`, `updateProgress`, `updateShuffle`, `updateRepeat`, `updateVolume` calls alongside the main `ui` instance in `syncNow()`.

### Fixed

- **SVG icons not showing in Chrome toolbar** — Chrome requires raster PNG for toolbar icons; SVG files were silently ignored. Introduced PNG generation (improved further in v1.5.0).
- **PiP control button sizes** — Normalised play/pause to `36px`, secondary controls to `28px` for consistent spacing.

---

## [1.4.1] — 2026-03-28

### Changed

- **Monolithic bundle refactor** — `content.js` migrated from ES module `import` structure to a single self-contained IIFE. Resolved `Uncaught SyntaxError: Cannot use import statement outside a module` — Chrome MV3 content scripts do not reliably support ES module syntax without `"type": "module"` in the manifest, which has its own MV3 compatibility issues.
- **`FloatUI` ES6 class → ES5 prototype** — Rewrote from `class` syntax to `Function` + `.prototype` assignment for IIFE compatibility.
- **Event handler references** — `_onDragMove`, `_onDragEnd`, `_onResizeMove`, `_onResizeEnd` changed from arrow-function class fields to named function expressions stored on `this`, enabling correct `removeEventListener` in `unmount()`.
- **Mini mode (pill UI)** — `.mm` class on `#float-root` sets `#player` to `border-radius: 40px`. Hides `#dh`, `#ti`, `#pw`, `#vr`. Added `_setupMiniDrag` for dragging by the player body in mini mode. Double-click expands back to full mode.
- **CSS IDs shortened** for bundle compactness: mode classes `mode-full`/`mode-compact`/`mode-mini` → `''`/`mc`/`mm`; button IDs `ctrl-play` → `c-play`, `ctrl-prev` → `c-prev`, etc.; element IDs `drag-handle` → `dh`, `art-section` → `aw`, `track-info` → `ti`, `progress-section` → `pw`, `controls` → `ctrl`, `volume-row` → `vr`, `resize-handle` → `rsz`.
- **Selector cache** — Changed from `Map` with `[el, i]` tuple returns to plain `{}` with `{ el, ts }` entries. TTL reduced 5 s → 4 s. `resolveSelector()` returns element directly.

### Fixed

- **Double-injection on SPA navigation** — Added `window.__spotifyFloatLoaded` guard at IIFE top. Script exits immediately if flag already set.
- **Shuffle 3-state detection** — `aria-label` substrings: `"enable smart"` → mode 1, `"disable smart"` → mode 2, `"disable"` → mode 1. `shuf-badge` shows `★` for Smart Shuffle.
- **Repeat badge sequence** — `rep-badge` shows `1` only in Repeat One (mode 2). Sequence: Off → All → One.
- **MutationObserver stuck after SPA navigation** — `TAB_UPDATED` message from `background.js` now triggers 1 s delayed observer restart + `syncNow()`.

---

## [1.4.0] — 2026-03-28

### Added

- **`Space` → Play/Pause shortcut** — Registered in `registerHotkeys()`. Skipped when `INPUT`/`TEXTAREA`/`isContentEditable` has focus.
- **`nowPlayingWidget` selector fallbacks** — Added `[data-testid="now-playing-bar"]`, `footer[data-testid="now-playing-bar"]`, `footer`, `.Root__now-playing-bar`.
- **`albumArt` top-priority selector** — Added `[data-testid="coverSlot"] img`.

### Fixed

- **Non-linear volume calibration** — Replaced `parseInt(volEl.value)` with `Math.round((parseFloat(volEl.value) / vMax) * 100)` to correctly map Spotify's internal scale to 0–100.
- **Hi-res artwork** — Regex on album art `src` replaces `ab67616d00004851` and `ab67616d00001e02` with `ab67616d0000b273` to force 640×640 thumbnails.

---

## [1.1.0] — Initial Bundled Release

### Fixed

- **`Uncaught SyntaxError: Cannot use import statement outside a module`** — Removed all `import` statements from `content.js`. Inlined `selectors.js`, `ui.js`, and core logic into a single IIFE. Removed `"type": "module"` from `manifest.json` `background` entry.
- **Nested `icons/icons/` directory** — `cp -r` into a destination that already had `icons/` caused double-nesting. Fixed by copying files directly and removing the nested subdirectory.

### Changed

- `manifest.json` `background` — Removed `"type": "module"`.
- `manifest.json` `content_scripts` — Removed empty `"css": []` array.

---

## [1.0.0] — Initial Build

### Added

- `manifest.json` — Manifest V3, scoped to `https://open.spotify.com/*`, content script at `document_idle`.
- `background.js` — Service worker: message routing (`PING`, `GET_STORAGE`, `SET_STORAGE`, `TOGGLE_PLAYER`, `OPEN_PIP`), popup-to-content bridge, `TAB_UPDATED` on navigation.
- `content.js` — Core orchestrator (originally ES module): sync loop, MutationObserver, playback handlers, hotkeys, `chrome.storage.local` persistence, message handler.
- `selectors.js` — `SELECTORS` map with `data-testid` primary + CSS fallbacks. `cachedResolve()` (5 s TTL), `invalidateCache()`, `safeClick()`, `readText()`, `readAttr()`.
- `ui.js` — `FloatUI` ES6 class, Shadow DOM host, Full/Compact/Mini modes, drag, resize, album art crossfade, scrolling marquee, track change animation, volume slider, tooltips.
- `popup.html` / `popup.js` — Toolbar popup with toggle, status dot, "Open Spotify Web".
- `generate-icons.js` — SVG icon generator at 16/48/128 px.
- Playback controls via DOM simulation with 5× retry backoff: Play/Pause, Prev, Next, Seek, Volume, Mute, Shuffle, Repeat.
- `chrome.storage.local` persistence: `position`, `size`, `mode`, `visible` (debounced 500 ms).
- `waitForSpotify()` polling, `selectorRetryCount` observer restart, `TAB_UPDATED` SPA recovery.

---

> **Note:** Console messages of the form `Pathnames cannot have embedded double slashes — normalizing /local///TrackName/74` originate from Spotify's own `web-player.*.js` bundle and are unrelated to this extension.
