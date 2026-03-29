<div align="center">

<img src="icons/icon128.png" alt="Spotify Float Icon" width="80" height="80" />

# Spotify Float — Mini Player

**A floating, resizable Picture-in-Picture mini-player for Spotify Web.**
Bypasses Spotify's Premium paywall on the mini-player. No API. No login. Just open the tab and play.

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-4285F4?style=flat-square&logo=googlechrome&logoColor=white)](https://github.com/Arnab500th/Spotify-miniplayer-chrome-extension-By-pass-premium-pay-walls)
[![Manifest V3](https://img.shields.io/badge/Manifest-V3-1db954?style=flat-square)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.5.0-blue?style=flat-square)](manifest.json)
[![GitHub Release](https://img.shields.io/github/v/release/Arnab500th/Spotify-miniplayer-chrome-extension-By-pass-premium-pay-walls?style=flat-square&color=1db954)](https://github.com/Arnab500th/Spotify-miniplayer-chrome-extension-By-pass-premium-pay-walls/releases/latest)

<br/>

![Demo Screenshot](https://i.ibb.co/4nPJcxVm/Screenshot-2026-03-28-232255.png)

<br/>

[**⬇️ Download Latest Release**](https://github.com/Arnab500th/Spotify-miniplayer-chrome-extension-By-pass-premium-pay-walls/releases/latest) &nbsp;·&nbsp; [**📋 Changelog**](CHANGELOG.md) &nbsp;·&nbsp; [**🤝 Contributing**](CONTRIBUTING.md)

</div>

---

## ✨ What It Does

Spotify Float injects a **floating mini-player** directly onto the Spotify Web page. The player sits above everything else, is fully draggable and resizable, and gives you complete playback control without switching tabs. It also supports a true **Document Picture-in-Picture** mode — a separate always-on-top window showing album art and controls.

Spotify's native mini-player is locked behind a **Premium paywall** — free tier users are blocked from resizing or minimising the player. This extension **bypasses that restriction entirely** by building its own independent UI layer on top of the page, giving free users the same compact, always-visible playback experience without paying for Premium.

Works on the **free tier** of Spotify Web. No authentication, no API keys, no data collection.

---

## 🎯 Features

| Feature | Details |
|---|---|
| 🎵 Playback Controls | Play/pause, next, previous, shuffle, repeat |
| 🔊 Volume Control | Slider + mute toggle |
| ⏩ Drag-to-Seek | Click or scrub the progress bar to any position |
| 🖼️ Picture-in-Picture | Always-on-top OS window with album art overlay |
| 🎨 Three UI Modes | Full (art + info + controls), Compact, Mini pill |
| 📌 Draggable & Resizable | Freely position and resize, persisted across sessions |
| 💾 State Persistence | Position, size, mode and visibility saved via `chrome.storage` |
| ⌨️ Keyboard Shortcuts | `Space`, `Ctrl+→`, `Ctrl+←` |
| 🛡️ Shadow DOM | Fully isolated from Spotify's own styles and scripts |
| ⚡ Performance | Sync loop pauses when player is hidden; no background polling |
| 🆓 Free Tier | Works without Spotify Premium — bypasses the paywall restriction |

---

## 📦 File Structure

```
spotify-miniplayer/
├── manifest.json          ← MV3 manifest (permissions, scripts, icons)
├── background.js          ← Service worker: message routing + tab lifecycle
├── content.js             ← Bundled content script: UI + sync + controls
├── popup.html             ← Toolbar popup interface
├── popup.js               ← Toolbar popup logic
├── generate-icons.js      ← Node.js icon generator (no dependencies)
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

> `selectors.js` and `ui.js` are development reference files. Their logic is already bundled inside `content.js` — Chrome does not need them at runtime.

---

## 🚀 Installation

### Option A — Download ZIP *(recommended, no git required)*

1. Go to the [**latest release**](https://github.com/Arnab500th/Spotify-miniplayer-chrome-extension-By-pass-premium-pay-walls/releases/latest)
2. Download `spotify-float-v1.5.0.zip` under **Assets**
3. Unzip the folder anywhere on your computer
4. Open Chrome → `chrome://extensions`
5. Enable **Developer Mode** (toggle, top-right)
6. Click **Load unpacked** → select the unzipped folder
7. The 🎵 icon appears in your toolbar

### Option B — Clone the repo

```bash
git clone https://github.com/Arnab500th/Spotify-miniplayer-chrome-extension-By-pass-premium-pay-walls.git
cd Spotify-miniplayer-chrome-extension-By-pass-premium-pay-walls

# Generate icons if the icons/ folder is missing PNGs
node generate-icons.js
```

Then follow steps 4–7 from Option A, selecting the cloned folder.

### First use

1. Open [open.spotify.com](https://open.spotify.com) and start playing a song
2. Click the 🎵 icon in the Chrome toolbar
3. Click **Show Mini Player** — the floating player appears on the page

---

## 🎮 Usage

### Mini Player Modes

Switch between modes using the buttons in the player header:

| Mode | What's shown |
|---|---|
| **FULL** | Album art + track info + progress bar + all controls |
| **CMP** (Compact) | Track info + progress bar + controls, no art |
| **MINI** | Controls-only pill, minimal footprint |

### Picture-in-Picture

Click **Open Picture-in-Picture** in the toolbar popup (or the PiP button inside the player). This opens a separate always-on-top OS window. Move your mouse over it to reveal controls and the seek bar; the album art shows by default.

> Requires Chrome 116 or later.

### Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Space` | Play / Pause |
| `Ctrl + →` | Next Track |
| `Ctrl + ←` | Previous Track |

*Shortcuts only fire when focus is not inside a text input on the page.*

### Drag-to-Seek

Click anywhere on the progress bar to jump to that position. Click and drag left/right to scrub — the bar updates live and Spotify seeks on mouse release.

---

## 🏗️ Architecture

### How it works

Spotify Float does **not** use the Spotify Web API. Instead it reads and controls the player by interacting directly with Spotify's DOM — reading `data-testid` attributes, `aria-label` values, and input element states, then simulating the same events a real click would trigger.

```
chrome toolbar popup
        │  TOGGLE_PLAYER / OPEN_PIP message
        ▼
background.js (service worker)
        │  chrome.tabs.sendMessage → Spotify tab
        ▼
content.js (injected into open.spotify.com)
        │
        ├── FloatUI (Shadow DOM player)
        │     ├── Drag system
        │     ├── Resize system
        │     └── Seek system (mousedown → mousemove → mouseup)
        │
        ├── syncNow()  ──────────────────────────────────────────┐
        │     ├── readText('trackTitle')                          │
        │     ├── readText('artistName')                          │ 500ms interval
        │     ├── cachedResolve('albumArt')                       │ (2000ms when paused)
        │     ├── calcProgress() — 3-strategy fallback            │
        │     └── play/shuffle/repeat state from aria-label       │
        │                                                          │
        └── MutationObserver on now-playing-widget ───────────────┘
              debounced 200ms → invalidateCache() → syncNow()
```

### Selector resilience

`selectors.js` defines a priority-ordered fallback list for every DOM element. The primary selector uses `data-testid` (most stable). If Spotify restructures their DOM, the system automatically falls through to CSS class fallbacks before giving up. Cache TTL is 4 seconds to avoid redundant DOM queries on every sync tick.

### PiP window

Uses the [Document Picture-in-Picture API](https://developer.chrome.com/docs/web-platform/document-picture-in-picture/) (`window.documentPictureInPicture`). A second `FloatUI` instance is mounted into the PiP window's document. Hover detection uses JS `mouseenter`/`mouseleave` events — CSS `:hover` does not fire across Document PiP window boundaries.

---

## 🔧 Updating Selectors

If Spotify updates their web app and controls stop responding:

1. Open Chrome DevTools on `open.spotify.com`
2. Inspect the broken button or element
3. Find its `data-testid` attribute or unique CSS class
4. Update the relevant entry in `selectors.js`
5. Go to `chrome://extensions` → click the **reload** icon on the extension card

---

## ⚠️ Known Limitations

- **Spotify DOM changes** — Spotify updates their web app regularly. The fallback selector system handles minor changes, but a major redesign may require a `selectors.js` update.
- **Document PiP API** — Requires Chrome 116+. Not available in Firefox, Safari, or other browsers.
- **Seek simulation** — Seek works by simulating native range input events. Behaviour may vary slightly across Spotify web player versions.
- **No lyrics / queue** — Playback control only. Lyrics and queue management require the official Spotify Web API.

---

## 🤝 Contributing

Pull requests are welcome. For significant changes, please open an issue first to discuss scope.

1. Fork the repo
2. Create a feature branch: `git checkout -b fix/selector-update`
3. Commit your changes: `git commit -m 'fix: update seekSlider selector'`
4. Push: `git push origin fix/selector-update`
5. Open a Pull Request against `main`

See [CONTRIBUTING.md](CONTRIBUTING.md) for full guidelines.

---

## 📄 License

[MIT](LICENSE) © 2026 [Arnab500th](https://github.com/Arnab500th)

---

<div align="center">
<sub>Built with ♥ by Arnab &nbsp;·&nbsp; Not affiliated with or endorsed by Spotify AB</sub>
</div>
