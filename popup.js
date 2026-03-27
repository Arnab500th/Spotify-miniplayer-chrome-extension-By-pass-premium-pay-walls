// popup.js — Toolbar popup logic

const SPOTIFY_URL = 'https://open.spotify.com';

const toggleBtn  = document.getElementById('toggle-btn');
const statusDot  = document.getElementById('status-dot');
const statusText = document.getElementById('status-text');
const noSpotify  = document.getElementById('no-spotify');
const openBtn    = document.getElementById('open-spotify');

let currentTabId = null;
let isSpotifyTab = false;

async function init() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs[0];

  if (!tab) return;

  isSpotifyTab = tab.url && tab.url.startsWith(SPOTIFY_URL);
  currentTabId = tab.id;

  if (!isSpotifyTab) {
    // Check if any Spotify tab exists
    const spotifyTabs = await chrome.tabs.query({ url: `${SPOTIFY_URL}/*` });
    if (spotifyTabs.length > 0) {
      currentTabId = spotifyTabs[0].id;
      isSpotifyTab = true;
    } else {
      noSpotify.style.display = 'block';
      toggleBtn.disabled = true;
      toggleBtn.style.opacity = '0.5';
      return;
    }
  }

  // Get current status
  try {
    const response = await chrome.tabs.sendMessage(currentTabId, { type: 'GET_STATUS' });
    updateUI(response?.visible ?? false);
  } catch {
    updateUI(false);
    statusText.textContent = 'Please refresh the Spotify tab';
    toggleBtn.disabled = true;
    toggleBtn.style.opacity = '0.5';
  }
}

function updateUI(visible) {
  if (visible) {
    toggleBtn.textContent = 'Hide Mini Player';
    toggleBtn.classList.add('hide-mode');
    statusDot.classList.add('active');
    statusText.textContent = 'Player is active';
  } else {
    toggleBtn.textContent = 'Show Mini Player';
    toggleBtn.classList.remove('hide-mode');
    statusDot.classList.remove('active');
    statusText.textContent = 'Player is hidden';
  }
}

toggleBtn.addEventListener('click', async () => {
  if (!isSpotifyTab || !currentTabId) return;

  try {
    const response = await chrome.tabs.sendMessage(currentTabId, { type: 'TOGGLE_PLAYER' });
    if (response?.ok) {
      updateUI(response.visible);
    }
  } catch (err) {
    statusText.textContent = 'Please refresh the Spotify tab';
  }
});

openBtn.addEventListener('click', async () => {
  const tabs = await chrome.tabs.query({ url: `${SPOTIFY_URL}/*` });
  if (tabs.length > 0) {
    chrome.tabs.update(tabs[0].id, { active: true });
    chrome.windows.update(tabs[0].windowId, { focused: true });
  } else {
    chrome.tabs.create({ url: SPOTIFY_URL });
  }
  window.close();
});

// PiP Player button
const pipBtn = document.getElementById('pip-btn');
pipBtn.addEventListener('click', async () => {
  if (!isSpotifyTab || !currentTabId) {
    statusText.textContent = 'No active Spotify tab found';
    return;
  }
  try {
    const response = await chrome.tabs.sendMessage(currentTabId, { type: 'OPEN_PIP' });
    if (response?.ok) {
      window.close();
    } else {
      statusText.textContent = response?.error || 'Failed to open PiP player';
    }
  } catch (err) {
    statusText.textContent = 'Could not open PiP. Please refresh the Spotify tab.';
  }
});

init();
