// player.js — PiP popup window logic
// Syncs with the Spotify tab via the background service worker.

(function () {
  'use strict';

  // ── DOM refs ────────────────────────────────────────────────────────────
  const trackTitle  = document.getElementById('track-title');
  const trackArtist = document.getElementById('track-artist');
  const artImg      = document.getElementById('art');
  const timeCur     = document.getElementById('time-cur');
  const timeTot     = document.getElementById('time-tot');
  const progressFill = document.getElementById('progress-fill');
  const progressTrack = document.getElementById('progress-track');
  const playBtn     = document.getElementById('c-play');
  const iPlay       = document.getElementById('i-play');
  const iPause      = document.getElementById('i-pause');
  const shufBtn     = document.getElementById('c-shuf');
  const repBtn      = document.getElementById('c-rep');
  const volSlider   = document.getElementById('vol-slider');
  const volIcon     = document.getElementById('vol-icon');
  const noSpotify   = document.getElementById('no-spotify');
  const playerEl    = document.getElementById('player');
  const trackInfo   = document.getElementById('track-info');

  let lastTitle = '';
  let lastArtUrl = '';
  let syncInterval = null;
  let isConnected = false;

  // ── Sync loop ──────────────────────────────────────────────────────────
  function startSync() {
    if (syncInterval) clearInterval(syncInterval);
    requestState(); // immediate first call
    syncInterval = setInterval(requestState, 500);
  }

  function requestState() {
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
      if (syncInterval) clearInterval(syncInterval);
      window.close();
      return;
    }
    try {
      chrome.runtime.sendMessage({ type: 'GET_PLAYER_STATE' }, function (response) {
        if (chrome.runtime.lastError || !response) {
          if (isConnected) {
            isConnected = false;
            showNoSpotify();
          }
          return;
        }

        if (!isConnected) {
          isConnected = true;
          hideNoSpotify();
        }

        updateUI(response);
      });
    } catch (err) {
      if (syncInterval) clearInterval(syncInterval);
      window.close();
    }
  }

  function updateUI(state) {
    // Track info
    if (state.title && state.title !== lastTitle) {
      lastTitle = state.title;
      trackInfo.classList.remove('track-anim');
      void trackInfo.offsetWidth;
      trackInfo.classList.add('track-anim');
    }

    if (trackTitle) {
      if (state.title && state.title.length > 28) {
        const escaped = state.title.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        trackTitle.innerHTML = '<span class="scroll">' + escaped + '&nbsp;&nbsp;&nbsp;&nbsp;' + escaped + '</span>';
      } else {
        trackTitle.textContent = state.title || 'No track playing';
      }
    }

    if (trackArtist) {
      trackArtist.textContent = state.artist || '—';
    }

    // Album art
    if (artImg && state.artUrl && state.artUrl !== lastArtUrl) {
      lastArtUrl = state.artUrl;
      artImg.classList.add('fade');
      const newImg = new Image();
      newImg.onload = function () {
        artImg.src = state.artUrl;
        artImg.classList.remove('fade');
      };
      newImg.src = state.artUrl;
    }

    // Play state
    if (iPlay && iPause) {
      iPlay.style.display = state.playing ? 'none' : '';
      iPause.style.display = state.playing ? '' : 'none';
    }

    // Progress
    if (progressFill) {
      const pct = Math.max(0, Math.min(100, (state.progress || 0) * 100));
      progressFill.style.width = pct.toFixed(2) + '%';
    }
    if (timeCur) timeCur.textContent = state.currentTime || '0:00';
    if (timeTot) timeTot.textContent = state.totalDuration || '0:00';

    // Shuffle & Repeat
    if (shufBtn) shufBtn.classList.toggle('on', !!state.shuffle);
    if (repBtn) {
      repBtn.classList.toggle('on', (state.repeat || 0) > 0);
      const repBadge = document.getElementById('rep-badge');
      if (repBadge) {
        repBadge.textContent = state.repeat === 2 ? '1' : '';
        repBadge.style.display = state.repeat === 2 ? 'block' : '';
      }
    }

    // Volume
    if (volSlider && state.volume !== undefined && document.activeElement !== volSlider) {
      volSlider.value = state.volume;
    }
    if (volIcon && state.volume !== undefined) {
      volIcon.textContent = state.volume === 0 ? '🔇' : state.volume < 50 ? '🔉' : '🔊';
    }
  }

  function showNoSpotify() {
    noSpotify.style.display = 'flex';
    document.getElementById('art-wrap').style.display = 'none';
    trackInfo.style.display = 'none';
    document.getElementById('progress-wrap').style.display = 'none';
    document.getElementById('controls').style.display = 'none';
    document.getElementById('volume-wrap').style.display = 'none';
  }

  function hideNoSpotify() {
    noSpotify.style.display = 'none';
    document.getElementById('art-wrap').style.display = '';
    trackInfo.style.display = '';
    document.getElementById('progress-wrap').style.display = '';
    document.getElementById('controls').style.display = '';
    document.getElementById('volume-wrap').style.display = '';
  }

  // ── Send commands ──────────────────────────────────────────────────────
  function sendCmd(action, data) {
    if (!chrome || !chrome.runtime || !chrome.runtime.id) {
      if (syncInterval) clearInterval(syncInterval);
      window.close();
      return;
    }
    try {
      chrome.runtime.sendMessage({ type: 'PLAYER_CMD', action: action, data: data });
    } catch (err) {
      if (syncInterval) clearInterval(syncInterval);
      window.close();
    }
  }

  // ── Bind controls ─────────────────────────────────────────────────────
  playBtn.addEventListener('click', function () { sendCmd('play-pause'); });
  document.getElementById('c-prev').addEventListener('click', function () { sendCmd('prev'); });
  document.getElementById('c-next').addEventListener('click', function () { sendCmd('next'); });
  shufBtn.addEventListener('click', function () { sendCmd('shuffle'); });
  repBtn.addEventListener('click', function () { sendCmd('repeat'); });

  progressTrack.addEventListener('click', function (e) {
    const rect = progressTrack.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    sendCmd('seek', pct);
  });

  volSlider.addEventListener('input', function (e) {
    sendCmd('volume', parseInt(e.target.value, 10));
  });

  volIcon.addEventListener('click', function () { sendCmd('mute'); });

  // ── Keyboard shortcuts ────────────────────────────────────────────────
  document.addEventListener('keydown', function (e) {
    if (e.code === 'Space') { e.preventDefault(); sendCmd('play-pause'); }
    else if (e.ctrlKey && e.code === 'ArrowRight') { e.preventDefault(); sendCmd('next'); }
    else if (e.ctrlKey && e.code === 'ArrowLeft') { e.preventDefault(); sendCmd('prev'); }
  });

  // ── Start ─────────────────────────────────────────────────────────────
  startSync();

})();
