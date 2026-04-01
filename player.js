/**
 * createPlayer(container, options)
 *
 * options:
 *   src          — video file path
 *   thumb        — thumbnail image path
 *   playInline   — true: plays in place | false: opens a modal (default: true)
 *   hoverContent — HTML string shown as overlay while video is playing
 */
export function createPlayer(container, { src, thumb, title = '', playInline = true, hoverContent = '' } = {}) {
  container.classList.add('lv-player-host');

  if (playInline) {
    _buildInlinePlayer(container, { src, thumb, title, hoverContent });
  } else {
    _buildModalTrigger(container, { src, thumb, hoverContent });
  }
}

/* ─── Shared controls HTML ───────────────────────────────────────────── */

function _controlsHTML() {
  return `
    <div class="lv-controls" data-role="controls">
      <button class="lv-btn" data-role="playpause" title="Play/Pause">
        <svg data-icon="pause" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <rect x="3" y="2" width="4" height="14" rx="1"/>
          <rect x="11" y="2" width="4" height="14" rx="1"/>
        </svg>
        <svg data-icon="play" width="18" height="18" viewBox="0 0 18 18" fill="currentColor" class="lv-hidden">
          <path d="M4 2.5l11 6.5-11 6.5z"/>
        </svg>
      </button>
      <button class="lv-btn" data-role="mute" title="Mute">
        <svg data-icon="vol" width="18" height="18" viewBox="0 0 18 18" fill="currentColor">
          <path d="M3 6.5h3l4-3.5v12l-4-3.5H3V6.5z"/>
          <path d="M12 6a4 4 0 0 1 0 6" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        </svg>
        <svg data-icon="mute" width="18" height="18" viewBox="0 0 18 18" fill="currentColor" class="lv-hidden">
          <path d="M3 6.5h3l4-3.5v12l-4-3.5H3V6.5z"/>
          <line x1="12" y1="6" x2="17" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="17" y1="6" x2="12" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
      </button>
      <span class="lv-time" data-role="elapsed">0:00</span>
      <div class="lv-progress" data-role="progress"><div class="lv-progress-fill" data-role="fill"></div></div>
      <span class="lv-time" data-role="duration">0:00</span>
      <button class="lv-btn lv-speed" data-role="speed" title="Speed">×1</button>
      <button class="lv-btn" data-role="fullscreen" title="Fullscreen">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="1,5 1,1 5,1"/>
          <polyline points="11,1 15,1 15,5"/>
          <polyline points="1,11 1,15 5,15"/>
          <polyline points="15,11 15,15 11,15"/>
        </svg>
      </button>
    </div>`;
}

/* ─── Inline player ──────────────────────────────────────────────────── */

function _buildInlinePlayer(container, { src, thumb, title, hoverContent }) {
  container.innerHTML = `
    <div class="lv-wrapper" tabindex="0">
      <div class="lv-overlay" data-role="overlay">
        <img class="lv-thumb" src="${thumb}" alt="">
        <div class="lv-play-btn">
          <div class="lv-circle"><div class="lv-triangle"></div></div>
        </div>
        ${title ? `<div class="lv-title">${title}</div>` : ''}
      </div>
      <video class="lv-video lv-hidden" src="${src}" playsinline></video>
      <div class="lv-content-overlay lv-hidden" data-role="content">${hoverContent}</div>
      ${_controlsHTML()}
    </div>`;

  const wrapper   = container.querySelector('.lv-wrapper');
  const overlay   = container.querySelector('[data-role=overlay]');
  const video     = container.querySelector('.lv-video');
  const controls  = container.querySelector('[data-role=controls]');
  const contentOv = container.querySelector('[data-role=content]');

  // Hidden until playback starts
  video.classList.add('lv-hidden');
  controls.classList.add('lv-hidden');
  contentOv.classList.add('lv-hidden');

  overlay.addEventListener('click', () => {
    overlay.classList.add('lv-hidden');
    video.classList.remove('lv-hidden');
    controls.classList.remove('lv-hidden');
    contentOv.classList.remove('lv-hidden');
    wrapper.focus({ preventScroll: true });
    video.play();
  });

  _wireControls(wrapper, video, controls);
}

/* ─── Modal trigger ──────────────────────────────────────────────────── */

function _buildModalTrigger(container, { src, thumb, hoverContent }) {
  container.innerHTML = `
    <div class="lv-modal-trigger">
      <img class="lv-modal-thumb" src="${thumb}" alt="">
      <div class="lv-play-btn lv-play-btn--sm">
        <div class="lv-circle"><div class="lv-triangle"></div></div>
      </div>
    </div>`;

  container.querySelector('.lv-modal-trigger')
    .addEventListener('click', () => _openModal({ src, hoverContent }));
}

function _openModal({ src, hoverContent }) {
  const backdrop = document.createElement('div');
  backdrop.className = 'lv-modal-backdrop';
  backdrop.innerHTML = `
    <div class="lv-modal-box">
<div class="lv-wrapper lv-modal-player" tabindex="0">
        <video class="lv-video" src="${src}" playsinline></video>
        <div class="lv-content-overlay" data-role="content">${hoverContent}</div>
        ${_controlsHTML()}
      </div>
    </div>`;

  document.body.appendChild(backdrop);
  requestAnimationFrame(() => backdrop.classList.add('lv-modal-visible'));

  const wrapper  = backdrop.querySelector('.lv-wrapper');
  const video    = backdrop.querySelector('.lv-video');
  const controls = backdrop.querySelector('[data-role=controls]');

  // Start playing immediately — no thumbnail stage in modal
  wrapper.focus({ preventScroll: true });
  video.play();

  _wireControls(wrapper, video, controls);

  function close() {
    video.pause();
    backdrop.classList.remove('lv-modal-visible');
    backdrop.addEventListener('transitionend', () => backdrop.remove(), { once: true });
  }

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', function esc(e) {
    if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
  });
}

/* ─── Pause all other players ────────────────────────────────────────── */

function _pauseOthers(currentVideo) {
  document.querySelectorAll('.lv-video').forEach(v => {
    if (v !== currentVideo) v.pause();
  });
}

/* ─── Shared controls wiring ─────────────────────────────────────────── */

function _wireControls(wrapper, video, controls) {
  const elapsed  = controls.querySelector('[data-role=elapsed]');
  const duration = controls.querySelector('[data-role=duration]');
  const fill     = controls.querySelector('[data-role=fill]');
  const progress = controls.querySelector('[data-role=progress]');
  const ppBtn    = controls.querySelector('[data-role=playpause]');
  const muteBtn  = controls.querySelector('[data-role=mute]');
  const speedBtn = controls.querySelector('[data-role=speed]');
  const fsBtn    = controls.querySelector('[data-role=fullscreen]');

  function syncPP() {
    ppBtn.querySelector('[data-icon=play]').classList.toggle('lv-hidden', !video.paused);
    ppBtn.querySelector('[data-icon=pause]').classList.toggle('lv-hidden', video.paused);
    wrapper.classList.toggle('lv-paused', video.paused);
  }
  ppBtn.addEventListener('click', () => video.paused ? video.play() : video.pause());
  video.addEventListener('play', () => { _pauseOthers(video); syncPP(); });
  video.addEventListener('pause', syncPP);

  // Single click = play/pause, double-click = fullscreen
  let clickTimer = null;
  video.addEventListener('click', () => {
    if (clickTimer) {
      clearTimeout(clickTimer); clickTimer = null;
      document.fullscreenElement ? document.exitFullscreen() : wrapper.requestFullscreen();
    } else {
      clickTimer = setTimeout(() => {
        clickTimer = null;
        video.paused ? video.play() : video.pause();
      }, 250);
    }
  });

  // Spacebar — only when this wrapper has focus
  wrapper.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
      e.preventDefault();
      video.paused ? video.play() : video.pause();
    }
  });

  // Time + progress
  function fmt(s) {
    const m = Math.floor(s / 60), sec = Math.floor(s % 60).toString().padStart(2, '0');
    return `${m}:${sec}`;
  }
  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    fill.style.width = (video.currentTime / video.duration * 100) + '%';
    elapsed.textContent = fmt(video.currentTime);
    duration.textContent = fmt(video.duration);
  });
  progress.addEventListener('click', (e) => {
    const r = progress.getBoundingClientRect();
    video.currentTime = ((e.clientX - r.left) / r.width) * video.duration;
  });

  // Mute
  muteBtn.addEventListener('click', () => {
    video.muted = !video.muted;
    muteBtn.querySelector('[data-icon=vol]').classList.toggle('lv-hidden', video.muted);
    muteBtn.querySelector('[data-icon=mute]').classList.toggle('lv-hidden', !video.muted);
  });

  // Speed cycle
  const speeds = [1, 1.2, 1.5], labels = ['×1', '×1.2', '×1.5'];
  let si = 0;
  speedBtn.addEventListener('click', () => {
    si = (si + 1) % speeds.length;
    video.playbackRate = speeds[si];
    speedBtn.textContent = labels[si];
  });

  // Fullscreen
  fsBtn.addEventListener('click', () => {
    document.fullscreenElement ? document.exitFullscreen() : wrapper.requestFullscreen();
  });
}
