/* ─────────────────────────────────────────────
   CONFIG — customize these before sharing!
   ───────────────────────────────────────────── */

// Your Spotify playlist ID or full playlist URL
const SPOTIFY_PLAYLIST_ID = 'https://open.spotify.com/playlist/6coME0MTfjyKBVz69rKCYt?si=685c526c7085452c&pt=571c6f8516fbdb3d1a5b492a03660ea2';

// Lock screen & avatar background
const COUPLE_PHOTO = 'images/couple.jpg';

// Slideshow — add as many photos as you like
const PHOTOS = [
  'images/photo1.jpg',
  'images/photo2.jpg',
  'images/photo3.jpg',
  'images/photo4.jpg',
  'images/photo5.jpg',
  'images/photo6.jpg',
  'images/photo7.jpg',
  'images/photo8.jpg',
  'images/photo9.jpg',
  'images/photo10.jpg',
  'images/photo11.jpg',
  'images/photo12.jpg',
  'images/photo13.jpg',
  'images/photo14.jpg',
  'images/photo15.jpg',
  'images/photo16.jpg',
  'images/photo17.jpg',
  'images/photo18.jpg',
  'images/photo19.jpg',
  'images/photo20.jpg',
  'images/photo21.jpg',
  'images/photo22.jpg',
  'images/photo23.jpg',
  'images/photo24.jpg',
  'images/photo25.jpg',
];

// Video slideshow — add your clips to the /videos folder
const VIDEOS = [
  { src: 'videos/clip1.mp4', caption: 'Our first photobooth together.' },
  { src: 'videos/clip2.mov', caption: 'First movie marathon together.' },
  { src: 'videos/clip3.mov', caption: 'Second date together.' },
];

/* ─────────────────────────────────────────────
   UNLOCK — accepted date formats
   May 1, 2026  →  05012026 / 050126 / etc.
   ───────────────────────────────────────────── */
function isValidDate(input) {
  const raw = input.toLowerCase().trim();
  const digits = raw.replace(/\D/g, '');

  const validDigits = [
    '05012026', '5012026', '01052026',
    '050126', '50126', '010526',
  ];
  if (validDigits.includes(digits)) return true;

  const parts = raw.split(/[\/\-\.,\s]+/).filter(Boolean);
  if (parts.length === 3) {
    const nums = parts.map((p) => parseInt(p.replace(/\D/g, ''), 10));
    const years = parts.map((p) => {
      const n = parseInt(p.replace(/\D/g, ''), 10);
      return p.replace(/\D/g, '').length <= 2 ? 2000 + n : n;
    });
    if (nums[0] === 5 && nums[1] === 1 && years[2] === 2026) return true;
    if (nums[0] === 1 && nums[1] === 5 && years[2] === 2026) return true;
  }

  if (/may/.test(raw) && /\b1(st)?\b/.test(raw) && /2026|26/.test(raw)) return true;

  return false;
}

/* ── Lock screen clock ── */
function updateClock() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const mins  = now.getMinutes().toString().padStart(2, '0');

  const timeEl = document.getElementById('lock-time');
  const dateEl = document.getElementById('lock-date');
  if (!timeEl || !dateEl) return;

  timeEl.textContent = `${hours}:${mins}`;

  const options = { weekday: 'long', month: 'long', day: 'numeric' };
  dateEl.textContent = now.toLocaleDateString('en-US', options);
}

/* ── Unlock flow ── */
function initLockscreen() {
  updateClock();
  setInterval(updateClock, 1000);

  const form      = document.getElementById('unlock-form');
  const input     = document.getElementById('password-input');
  const errorEl   = document.getElementById('unlock-error');
  const field     = document.getElementById('password-field');
  const lockscreen = document.getElementById('lockscreen');
  const mainPage  = document.getElementById('main-page');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const value = input.value;

    if (isValidDate(value)) {
      errorEl.hidden = true;
      showVinylPlayer();
      mainPage.classList.remove('hidden');
      initSpotifyPlayer(true);
      lockscreen.classList.add('unlocking');

      setTimeout(() => {
        lockscreen.classList.add('hidden');
        initSlideshow();
        initVideoSlideshow();
        initPetals();
        initBouquet();
      }, 800);
    } else {
      errorEl.hidden = false;
      field.classList.remove('shake');
      void field.offsetWidth; // reflow to restart animation
      field.classList.add('shake');
      input.value = '';
      input.focus();
    }
  });
}

/* ── Slideshow ── */
let slideIndex = 0;
let slideTimer = null;
const photoAspectRatios = [];

function initSlideshow() {
  const container = document.getElementById('slideshow');
  const dotsEl    = document.getElementById('slideshow-dots');

  if (!container || PHOTOS.length === 0) return;

  PHOTOS.forEach((src, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (i === 0 ? ' active' : '');
    slide.innerHTML = `
      <div class="slide-bg" style="background-image: url('${src}')"></div>
      <div class="slide-frame">
        <img src="${src}" alt="Photo ${i + 1}" loading="${i === 0 ? 'eager' : 'lazy'}">
      </div>`;
    container.appendChild(slide);

    const img = slide.querySelector('img');
    const onImgLoad = () => {
      photoAspectRatios[i] = img.naturalWidth / img.naturalHeight;
      if (i === slideIndex) fitPhotoWrapper(slideIndex);
    };
    img.addEventListener('load', onImgLoad);
    if (img.complete) onImgLoad();

    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to photo ${i + 1}`);
    dot.addEventListener('click', () => goToPhotoSlide(i));
    dotsEl.appendChild(dot);
  });

  fitPhotoWrapper(0);
  updatePhotoCounter();
  window.addEventListener('resize', () => fitPhotoWrapper(slideIndex));

  document.getElementById('photo-prev').addEventListener('click', () => {
    goToPhotoSlide((slideIndex - 1 + PHOTOS.length) % PHOTOS.length);
  });
  document.getElementById('photo-next').addEventListener('click', () => {
    goToPhotoSlide((slideIndex + 1) % PHOTOS.length);
  });

  if (PHOTOS.length > 10) {
    dotsEl.hidden = true;
  }

  slideTimer = setInterval(nextPhotoSlide, 5000);
}

function updatePhotoCounter() {
  const counter = document.getElementById('photo-counter');
  if (counter) counter.textContent = `${slideIndex + 1} / ${PHOTOS.length}`;
}

function fitPhotoWrapper(index) {
  const wrapper = document.getElementById('photo-slideshow-wrapper');
  if (!wrapper) return;

  const ratio = photoAspectRatios[index] || 4 / 3;
  const maxW = wrapper.parentElement?.clientWidth || 900;
  const maxH = Math.min(window.innerHeight * 0.78, 860);

  let height = maxW / ratio;
  if (height > maxH) height = maxH;

  wrapper.style.height = `${Math.max(height, 280)}px`;
}

function goToPhotoSlide(index) {
  const slides  = document.querySelectorAll('#slideshow .slide');
  const dots    = document.querySelectorAll('#slideshow-dots .dot');

  slides[slideIndex].classList.remove('active');
  dots[slideIndex].classList.remove('active');

  slideIndex = index;

  slides[slideIndex].classList.add('active');
  dots[slideIndex].classList.add('active');
  fitPhotoWrapper(slideIndex);
  updatePhotoCounter();

  clearInterval(slideTimer);
  slideTimer = setInterval(nextPhotoSlide, 5000);
}

function nextPhotoSlide() {
  goToPhotoSlide((slideIndex + 1) % PHOTOS.length);
}

/* ── Video Slideshow ── */
let videoIndex = 0;
let videoMuted = true;

function initVideoSlideshow() {
  const section   = document.getElementById('video-section');
  const container = document.getElementById('video-slideshow');
  const caption   = document.getElementById('video-caption');
  const dotsEl    = document.getElementById('video-dots');
  const muteBtn   = document.getElementById('video-mute-btn');
  const prevBtn   = document.getElementById('video-prev');
  const nextBtn   = document.getElementById('video-next');

  if (!container || VIDEOS.length === 0) {
    if (section) section.hidden = true;
    return;
  }

  VIDEOS.forEach((video, i) => {
    const slide = document.createElement('div');
    slide.className = 'slide' + (i === 0 ? ' active' : '');
    slide.innerHTML = `
      <video
        src="${video.src}"
        playsinline
        loop
        muted
        controls
        preload="${i === 0 ? 'auto' : 'metadata'}"
      ></video>`;
    container.appendChild(slide);

    const vid = slide.querySelector('video');
    vid.addEventListener('error', () => {
      slide.innerHTML = `<p class="video-error">Could not load video.<br>Check that <strong>${video.src}</strong> exists.</p>`;
    });

    const dot = document.createElement('button');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Go to video ${i + 1}`);
    dot.addEventListener('click', () => goToVideoSlide(i));
    dotsEl.appendChild(dot);
  });

  caption.textContent = VIDEOS[0].caption;
  playActiveVideo();

  prevBtn.addEventListener('click', () => {
    goToVideoSlide((videoIndex - 1 + VIDEOS.length) % VIDEOS.length);
  });
  nextBtn.addEventListener('click', () => {
    goToVideoSlide((videoIndex + 1) % VIDEOS.length);
  });

  muteBtn.addEventListener('click', () => {
    videoMuted = !videoMuted;
    muteBtn.textContent = videoMuted ? '🔇' : '🔊';
    muteBtn.setAttribute('aria-label', videoMuted ? 'Unmute video' : 'Mute video');
    document.querySelectorAll('#video-slideshow video').forEach((v) => {
      v.muted = videoMuted;
    });
  });
}

function playActiveVideo() {
  document.querySelectorAll('#video-slideshow video').forEach((v, i) => {
    if (i === videoIndex) {
      v.muted = videoMuted;
      v.currentTime = 0;
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  });
}

function goToVideoSlide(index) {
  const slides  = document.querySelectorAll('#video-slideshow .slide');
  const dots    = document.querySelectorAll('#video-dots .dot');
  const caption = document.getElementById('video-caption');

  slides[videoIndex].classList.remove('active');
  dots[videoIndex].classList.remove('active');

  videoIndex = index;

  slides[videoIndex].classList.add('active');
  dots[videoIndex].classList.add('active');
  caption.textContent = VIDEOS[videoIndex].caption;

  playActiveVideo();
}

/* ── Floating petals ── */
function initPetals() {
  const container = document.querySelector('.petals');
  const symbols = ['🌸', '💕', '✨', '🌷', '♥'];

  for (let i = 0; i < 18; i++) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.textContent = symbols[i % symbols.length];
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.animationDuration = `${8 + Math.random() * 12}s`;
    petal.style.animationDelay = `${Math.random() * 10}s`;
    petal.style.fontSize = `${0.7 + Math.random() * 0.8}rem`;
    container.appendChild(petal);
  }
}

/* ── Bouquet interaction ── */
function initBouquet() {
  const scene = document.getElementById('bouquet-scene');
  const petalsContainer = document.getElementById('bouquet-petals');
  if (!scene || !petalsContainer) return;

  scene.addEventListener('click', () => {
    const colors = ['#e8a0b4', '#f9c0d0', '#c76b8a', '#f5b0c4', '#ffd8e4'];
    const rect = scene.getBoundingClientRect();

    for (let i = 0; i < 14; i++) {
      const petal = document.createElement('span');
      petal.className = 'bouquet-petal';
      petal.style.left = `${40 + Math.random() * 20}%`;
      petal.style.top = `${25 + Math.random() * 20}%`;
      petal.style.background = colors[i % colors.length];
      petal.style.setProperty('--dx', `${(Math.random() - 0.5) * 120}px`);
      petal.style.setProperty('--dy', `${60 + Math.random() * 100}px`);
      petal.style.animationDuration = `${1.8 + Math.random() * 1.5}s`;
      petalsContainer.appendChild(petal);
      setTimeout(() => petal.remove(), 3500);
    }
  });
}

/* ── Spotify + vinyl player ── */
let spotifyController = null;
let spotifyPlaying = false;
let spotifyPlayPending = false;
let spotifyPlayback = { duration: 0, position: 0, isPaused: true };
let spotifyCreating = false;

function getSpotifyPlaylistId(input) {
  if (!input || input === 'PLAYLIST_ID') return null;
  const match = String(input).match(/playlist\/([a-zA-Z0-9]+)/);
  return match ? match[1] : input;
}

function initSpotify() {
  renderVisibleSpotifyEmbed();
  initVinylControls();
  document.addEventListener('spotify-api-ready', () => createSpotifyController());
  if (window.__spotifyIFrameAPI) createSpotifyController();
}

function renderVisibleSpotifyEmbed() {
  const el = document.getElementById('spotify-embed-visible');
  const playlistId = getSpotifyPlaylistId(SPOTIFY_PLAYLIST_ID);
  if (!el || !playlistId || el.querySelector('iframe')) return;

  el.innerHTML = `
    <iframe
      src="https://open.spotify.com/embed/playlist/${playlistId}?utm_source=generator&theme=0"
      width="100%"
      height="352"
      frameBorder="0"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      loading="lazy"
      title="Our Spotify playlist"
    ></iframe>`;
}

function createSpotifyController(onReady) {
  if (spotifyController || spotifyCreating) return;
  const IFrameAPI = window.__spotifyIFrameAPI;
  const host = document.getElementById('spotify-embed-host');
  const playlistId = getSpotifyPlaylistId(SPOTIFY_PLAYLIST_ID);
  if (!IFrameAPI || !host || !playlistId) return;

  spotifyCreating = true;

  IFrameAPI.createController(host, {
    uri: `spotify:playlist:${playlistId}`,
    width: '300',
    height: '80',
  }, (controller) => {
    spotifyController = controller;
    spotifyCreating = false;

    controller.addListener('ready', () => {
      if (spotifyPlayPending) startSpotifyPlayback();
      onReady?.();
    });

    controller.addListener('playback_update', (e) => {
      spotifyPlayback = e.data;
      updateVinylUI();
    });

    controller.addListener('playback_started', () => {
      spotifyPlaying = true;
      updateVinylUI();
    });
  });
}

function initSpotifyPlayer(autoplay) {
  if (autoplay) spotifyPlayPending = true;
  if (spotifyController) {
    if (autoplay) startSpotifyPlayback();
    return;
  }
  createSpotifyController(() => {
    if (autoplay) startSpotifyPlayback();
  });
}

function initVinylControls() {
  const toggle = () => {
    if (!spotifyController) {
      initSpotifyPlayer(true);
      return;
    }
    spotifyController.togglePlay();
  };

  document.getElementById('spotify-play')?.addEventListener('click', toggle);
  document.getElementById('vinyl-disc-btn')?.addEventListener('click', toggle);

  document.getElementById('spotify-next')?.addEventListener('click', () => {
    initSpotifyPlayer(false);
    if (!spotifyController) return;
    const totalSec = Math.floor(spotifyPlayback.duration / 1000);
    if (totalSec > 3) {
      spotifyController.seek(totalSec - 1);
    } else {
      spotifyController.resume();
    }
  });

  document.getElementById('spotify-prev')?.addEventListener('click', () => {
    initSpotifyPlayer(false);
    if (!spotifyController) return;
    if (spotifyPlayback.position > 3000) {
      spotifyController.seek(0);
    } else {
      spotifyController.restart();
    }
  });
}

function startSpotifyPlayback() {
  if (!spotifyController) {
    spotifyPlayPending = true;
    return;
  }

  spotifyPlayPending = false;
  spotifyController.resume();
  updateVinylUI();
}

function showVinylPlayer() {
  document.getElementById('vinyl-player')?.classList.remove('hidden');
}

function updateVinylUI() {
  const disc = document.getElementById('vinyl-disc');
  const playBtn = document.getElementById('spotify-play');
  const trackEl = document.getElementById('vinyl-track');
  const isPaused = spotifyPlayback.isPaused ?? !spotifyPlaying;

  spotifyPlaying = !isPaused;
  disc?.classList.toggle('spinning', spotifyPlaying);
  if (playBtn) {
    playBtn.textContent = spotifyPlaying ? '⏸' : '▶';
    playBtn.setAttribute('aria-label', spotifyPlaying ? 'Pause' : 'Play');
  }

  if (trackEl && spotifyPlaying) {
    trackEl.textContent = 'Now playing our playlist ♥';
  } else if (trackEl) {
    trackEl.textContent = 'Our soundtrack awaits ♪';
  }
}

/* ── Apply couple photo from config ── */
function applyCouplePhoto() {
  const avatar = document.getElementById('avatar-img');
  const bg = document.getElementById('lockscreen-bg');
  if (avatar) {
    avatar.src = COUPLE_PHOTO;
    avatar.onerror = () => {
      avatar.removeAttribute('src');
    };
  }
  if (bg) {
    bg.style.backgroundImage = `url("${COUPLE_PHOTO}")`;
    bg.style.backgroundSize = 'cover';
    bg.style.backgroundPosition = 'center';
  }
}

/* ── Boot ── */
document.addEventListener('DOMContentLoaded', () => {
  applyCouplePhoto();
  initSpotify();
  initLockscreen();
});
