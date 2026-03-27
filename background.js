// background.js — Service Worker (Manifest V3)
// Handles extension lifecycle, message routing, tab management, and PiP window.

const SPOTIFY_ORIGIN = 'https://open.spotify.com';
let pipWindowId = null;

// ─── Install / Activate ───────────────────────────────────────────────────────
self.addEventListener('install', () => {
  console.log('[SpotifyFloat] Service worker installed.');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SpotifyFloat] Service worker activated.');
  event.waitUntil(self.clients.claim());
});

// ─── Message Router ───────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'PING':
      sendResponse({ status: 'alive' });
      break;

    case 'GET_STORAGE':
      chrome.storage.local.get(message.keys, (result) => {
        sendResponse({ data: result });
      });
      return true;

    case 'SET_STORAGE':
      chrome.storage.local.set(message.data, () => {
        sendResponse({ ok: true });
      });
      return true;

    case 'TOGGLE_PLAYER':
    case 'OPEN_PIP':
      forwardToSpotifyTab(message, sendResponse);
      return true;

    default:
      break;
  }
});

// ─── Popup → Content Script Bridge ────────────────────────────────────────────
async function forwardToSpotifyTab(message, sendResponse) {
  try {
    const tabs = await chrome.tabs.query({ url: `${SPOTIFY_ORIGIN}/*` });
    if (!tabs.length) {
      sendResponse({ error: 'No Spotify tab found' });
      return;
    }
    const tab = tabs[0];
    const response = await chrome.tabs.sendMessage(tab.id, message);
    sendResponse(response);
  } catch (err) {
    sendResponse({ error: err.message });
  }
}

// ─── Tab lifecycle: notify content script when Spotify tab navigates ──────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (
    changeInfo.status === 'complete' &&
    tab.url &&
    tab.url.startsWith(SPOTIFY_ORIGIN)
  ) {
    chrome.tabs.sendMessage(tabId, { type: 'TAB_UPDATED' }).catch(() => {});
  }
});
