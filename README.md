# 🎵 Spotify Float — Mini Player Chrome Extension

A production-grade Chrome Extension (Manifest V3) that creates a floating, resizable mini-player UI for Spotify Web (`open.spotify.com`) using DOM interaction — no Spotify API, no Premium required.

---

## 📦 File Structure

```
spotify-miniplayer/
├── manifest.json          # MV3 manifest
├── background.js          # Service worker (message routing, tab lifecycle)
├── content.js             # Core logic (sync, controls, hotkeys, storage)
├── selectors.js           # Resilient DOM selector mapping system
├── ui.js                  # Shadow DOM UI (drag, resize, modes, animations)
├── popup.html             # Toolbar popup UI
├── popup.js               # Toolbar popup logic
├── generate-icons.js      # Icon generator utility
└── icons/
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg
```

---

## 🚀 Installation

### Step 1 — Download / Clone

Save all files into a folder called `spotify-miniplayer/` (preserving the structure above).

### Step 2 — Load in Chrome

1. Open Chrome and navigate to: `chrome://extensions`
2. Enable **Developer Mode** (toggle in the top-right corner)
3. Click **"Load unpacked"**
4. Select your `spotify-miniplayer/` folder
5. The extension installs — you'll see the 🎵 icon in your toolbar

### Step 3 — Use It

1. Open **[Spotify Web](https://open.spotify.com)** in Chrome
2. Start playing any song
3. Click the 🎵 extension icon in the toolbar
4. Click **"Show Mini Player"** — the floating player appears!

---

## 🎯 Features

### Playback Controls (via DOM click simulation)
| Control | Method |
|---------|--------|
| Play / Pause | Click `[data-testid="control-button-playpause"]` |
| Next Track | Click `[data-testid="control-button-skip-forward"]` |
| Previous Track | Click `[data-testid="control-button-skip-back"]` |
| Shuffle | Click `[data-testid="control-button-shuffle"]` |
| Repeat | Click `[data-testid="control-button-repeat"]` |
| Seek | Simulate range input on progress bar |
| Volume | Simulate range input on volume bar |

### UI Modes
| Mode | Description |
|------|-------------|
| **Full** | Album art + track info + progress bar + all controls |
| **Compact** | Track info + progress bar + controls (no art) |
| **Mini** | Controls only, pill-shaped, minimal footprint |

### Keyboard Shortcuts
| Shortcut | Action |
|----------|--------|
| `Space` | Play / Pause |
| `Ctrl + →` | Next Track |
| `Ctrl + ←` | Previous Track |

---

## 🏗️ Architecture

### `manifest.json`
- Manifest V3
- `host_permissions` limited to `https://open.spotify.com/*`
- Content script runs at `document_idle`
- Service worker as ES module

### `background.js`
- Service worker handles lifecycle, message routing
- Forwards popup commands to active Spotify tab
- Notifies content script on tab navigation (SPA re-attach)

### `selectors.js`
- Centralized selector map with `data-testid` (primary) + multiple CSS fallbacks
- `cachedResolve()` — 5s TTL cache to avoid redundant DOM queries
- `invalidateCache()` — full bust on track changes / DOM mutations
- `safeClick()`, `readText()`, `readAttr()` — safe wrapper utilities

### `content.js`
- **Sync loop**: 500ms when playing, 2000ms when paused (lazy)
- **MutationObserver**: watches `[data-testid="now-playing-widget"]`, debounced 200ms
- **Observer/Loop paused** when mini-player is hidden (performance optimization)
- **Retry logic**: up to 5 retries with exponential backoff for failed clicks
- **Auto-recovery**: full cache invalidation + observer restart if selectors break
- **Storage**: debounced `chrome.storage.local` saves for position/size/mode

### `ui.js`
- **Shadow DOM**: fully encapsulated from Spotify's styles
- **Draggable**: mousedown on drag handle, clamped to viewport bounds
- **Freely resizable**: SE corner handle, independent W/H (200–500px × 120–700px)
- **CSS animations**: fade-in on mount, slide animation on track change
- **Scrolling text**: auto-scrolls long track titles
- **Volume slider**: custom styled range input with mute toggle

---

## 🔄 Sync System

```
MutationObserver (DOM changes)
    ↓ debounce 200ms
    ↓
syncNow()
  ├── readText('trackTitle')    → updateTrack()
  ├── readText('artistName')   → updateTrack()
  ├── cachedResolve('albumArt') → updateTrack()
  ├── parseProgressPct()       → updateProgress()
  │     ├── Strategy 1: aria-valuenow/aria-valuemax on progressbar
  │     ├── Strategy 2: input[type=range] value/max
  │     └── Strategy 3: parse currentTime / totalDuration text
  ├── playBtn aria-label       → updatePlayState()
  ├── shuffleBtn aria-label    → updateShuffle()
  └── repeatBtn aria-label     → updateRepeat()

setInterval(syncNow, 500ms|2000ms)  ← only when UI visible
```

---

## ⚡ Performance

- Sync loop **completely stops** when mini-player is hidden
- MutationObserver **disconnected** when hidden
- Selector cache with **5s TTL** — avoids re-querying on every sync
- `debounce()` on MutationObserver callbacks (200ms) and storage writes (500ms)
- `requestAnimationFrame` not used for polling — only CSS transitions for animations
- No continuous background loops

---

## 🛡️ Resilience

| Failure Mode | Recovery |
|---|---|
| Selector returns null | Retry up to 5× with 1.5s backoff |
| DOM restructured by Spotify | Full cache invalidation on MutationObserver trigger |
| Persistent selector failure | `selectorRetryCount` threshold → observer restart + re-scan |
| SPA navigation | `TAB_UPDATED` message from background triggers re-attach |
| Player not found yet | `waitForSpotify()` polls until `nowPlayingWidget` appears |

---

## 💾 Persistence

Saved to `chrome.storage.local`:
```json
{
  "position": { "left": "20px", "top": "80px" },
  "size":     { "width": "280px", "height": "auto" },
  "mode":     "compact",
  "visible":  true
}
```

---

## ⚠️ Known Limitations

1. **Spotify DOM changes**: Spotify regularly updates their web app. The selector fallback system handles this, but a major redesign may temporarily break selectors until updated.
2. **No Lyrics/Queue**: This extension controls playback only; lyrics and queue management require the Spotify Web API.
3. **Seek precision**: Seek simulation works via range input events; some Spotify versions may handle this differently.
4. **CSP restrictions**: Spotify's Content Security Policy is strict — the Shadow DOM approach ensures the extension's UI is never affected by Spotify's styles.

---

## 🔧 Updating Selectors

If Spotify updates their DOM and controls stop working:

1. Open DevTools on `open.spotify.com`
2. Inspect the broken control element
3. Find its `data-testid` attribute or unique CSS class
4. Update the relevant entry in `selectors.js`
5. Reload the extension at `chrome://extensions`

---

## 📝 License

MIT — build freely, remix, extend.
