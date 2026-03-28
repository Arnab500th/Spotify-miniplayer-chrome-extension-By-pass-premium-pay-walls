# Contributing to Spotify Float

Thanks for your interest in contributing! Here's how to get involved.

---

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/Spotify-miniplayer-chrome-extension-By-pass-premium-pay-walls.git
   cd Spotify-miniplayer-chrome-extension-By-pass-premium-pay-walls
   ```
3. **Generate icons** if needed:
   ```bash
   node generate-icons.js
   ```
4. **Load unpacked** in Chrome at `chrome://extensions` (Developer Mode on)

---

## What's Worth Contributing

- **Broken selectors** — If Spotify updated their DOM and a control stopped working, a `selectors.js` fix is the most impactful and quickest contribution. See [Updating Selectors](README.md#-updating-selectors) in the README.
- **Bug fixes** — Especially around sync accuracy, seek reliability, or PiP behaviour across different Chrome versions.
- **New features** — Open an issue first to discuss scope before building something large.
- **Documentation** — Corrections, clearer explanations, or better screenshots are always welcome.

---

## Code Style

- Vanilla JS only — no build step, no bundler, no TypeScript. The extension loads directly.
- `content.js` is a single self-contained IIFE (no ES modules) because content scripts can't use `import` directly.
- Keep functions small and named clearly. Prefer `var` in the IIFE (matches existing style) and `const`/`let` in module files.
- No external runtime dependencies.

---

## Submitting a Pull Request

1. Create a branch: `git checkout -b fix/selector-update` or `feature/my-thing`
2. Make your changes
3. Test by reloading the extension at `chrome://extensions` and verifying on `open.spotify.com`
4. Commit with a clear message: `git commit -m "fix: update seekSlider selector for Spotify DOM change"`
5. Push and open a PR against `main`

---

## Reporting Issues

Open a [GitHub Issue](../../issues/new) with:
- Chrome version
- What broke (with screenshots if possible)
- Console errors from the Spotify tab (F12 → Console)
- DevTools inspection of the broken element if it's a selector issue

---

## Disclaimer

This project is not affiliated with or endorsed by Spotify AB. It interacts with Spotify's web interface through DOM manipulation only.