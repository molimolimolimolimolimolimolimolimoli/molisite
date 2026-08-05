class CursorTrailEffect {
  constructor({ length = 18, size = 6, speed = 0.35 } = {}) {
    this.speed = speed;
    this.mouseX = window.innerWidth / 2;
    this.mouseY = window.innerHeight / 2;
    this.lastSparkTime = 0;
    this.particleCount = 0;
    this.maxParticles = 40;

    this.container = document.createElement('div');
    this.container.className = 'cursor-trail';
    document.body.appendChild(this.container);

    // this dot chain is now just a faint guide line - the star-pixel bursts are the real trail
    this.dots = Array.from({ length }, (_, i) => {
      const el = document.createElement('div');
      el.className = 'cursor-trail-dot';
      const s = size * (1 - (i / length) * 0.7);
      el.style.width = `${s}px`;
      el.style.height = `${s}px`;
      el.style.opacity = `${0.35 * (1 - i / length)}`;
      this.container.appendChild(el);
      const dotSpeed = Math.min(speed * (1 + i * 0.18), 0.95);
      return { el, x: this.mouseX, y: this.mouseY, speed: dotSpeed };
    });

    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    this.tick();
  }

  spawnBurst(x, y, count) {
    const room = this.maxParticles - this.particleCount;
    const n = Math.min(count, room);
    for (let i = 0; i < n; i++) {
      const spark = document.createElement('div');
      spark.className = 'cursor-spark';
      const angle = Math.random() * Math.PI * 2;
      const dist = 10 + Math.random() * 26;
      const duration = 0.45 + Math.random() * 0.35;
      const size = 2 + Math.random() * 2;
      spark.style.width = `${size}px`;
      spark.style.height = `${size}px`;
      spark.style.setProperty('--spark-dx', `${Math.cos(angle) * dist}px`);
      spark.style.setProperty('--spark-dy', `${Math.sin(angle) * dist}px`);
      spark.style.animationDuration = `${duration}s`;
      spark.style.left = `${x}px`;
      spark.style.top = `${y}px`;
      document.body.appendChild(spark);
      this.particleCount++;
      spark.addEventListener('animationend', () => {
        spark.remove();
        this.particleCount--;
      });
    }
  }

  tick() {
    let targetX = this.mouseX;
    let targetY = this.mouseY;
    for (const dot of this.dots) {
      const vx = targetX - dot.x;
      const vy = targetY - dot.y;
      dot.x += vx * dot.speed;
      dot.y += vy * dot.speed;

      const dist = Math.hypot(vx, vy);
      const stretch = Math.min(1 + dist * 0.06, 3.5);
      const angle = Math.atan2(vy, vx) * (180 / Math.PI);
      dot.el.style.transform =
        `translate3d(${dot.x}px, ${dot.y}px, 0) translate(-50%, -50%) rotate(${angle}deg) scaleX(${stretch})`;

      targetX = dot.x;
      targetY = dot.y;
    }

    const head = this.dots[0];
    const headSpeed = Math.hypot(this.mouseX - head.x, this.mouseY - head.y);
    const now = performance.now();
    if (headSpeed > 5 && now - this.lastSparkTime > 70) {
      this.lastSparkTime = now;
      // more movement = a couple more pixels this burst, capped tight for perf
      const burstCount = Math.min(1 + Math.floor(headSpeed / 12), 4);
      this.spawnBurst(this.mouseX, this.mouseY, burstCount);
    }

    requestAnimationFrame(() => this.tick());
  }
}

function initMedia() {
  const backgroundVideo = document.getElementById('background');
  if (!backgroundVideo) return;
  backgroundVideo.muted = true;
  backgroundVideo.play().catch(err => {
    console.error("Failed to play background video:", err);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const startScreen = document.getElementById('start-screen');
  const startText = document.getElementById('start-text');
  const profileName = document.getElementById('profile-name');
  const profileBio = document.getElementById('profile-bio');
  const visitorCount = document.getElementById('visitor-count');
  const volumeIcon = document.getElementById('volume-icon');
  const volumeSlider = document.getElementById('volume-slider');
  const profileCard = document.getElementById('profile-card');
  const audioPlayerCard = document.getElementById('audio-player-card');
  const cursor = document.querySelector('.custom-cursor');

  const audioEl = document.getElementById('audio-player-el');
  const trackTitle = document.getElementById('track-title');
  const playPauseBtn = document.getElementById('play-pause');
  const playPauseIcon = document.getElementById('play-pause-icon');
  const nowPlayingBars = document.getElementById('now-playing-bars');
  const prevBtn = document.getElementById('prev-track');
  const nextBtn = document.getElementById('next-track');
  const audioProgress = document.getElementById('audio-progress');
  const audioProgressFill = document.getElementById('audio-progress-fill');
  const timeCurrentEl = document.getElementById('time-current');
  const timeTotalEl = document.getElementById('time-total');

  const PLAY_ICON_PATH = '<path d="M8 5v14l11-7z"></path>';
  const PAUSE_ICON_PATH = '<path d="M6 5h4v14H6zM14 5h4v14h-4z"></path>';

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
  let cursorTrail = null;
  let cursorScale = 1;

  if (!isTouchDevice) {
    [profileCard, audioPlayerCard].forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mx', `${e.clientX - rect.left}px`);
        card.style.setProperty('--my', `${e.clientY - rect.top}px`);
      });
    });
  }

  function setCursorTransform(x, y) {
    cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${cursorScale})`;
  }

  if (isTouchDevice) {
    document.body.classList.add('touch-device');
    document.addEventListener('touchstart', (e) => {
      const touch = e.touches[0];
      setCursorTransform(touch.clientX, touch.clientY);
      cursor.style.display = 'block';
    });
    document.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      setCursorTransform(touch.clientX, touch.clientY);
      cursor.style.display = 'block';
    });
    document.addEventListener('touchend', () => {
      cursor.style.display = 'none';
    });
  } else {
    document.addEventListener('mousemove', (e) => {
      setCursorTransform(e.clientX, e.clientY);
      cursor.style.display = 'block';
    });
    document.addEventListener('mousedown', (e) => {
      cursorScale = 0.8;
      setCursorTransform(e.clientX, e.clientY);
    });
    document.addEventListener('mouseup', (e) => {
      cursorScale = 1;
      setCursorTransform(e.clientX, e.clientY);
    });
  }

  startText.textContent = "molisaurus";

  function initializeVisitorCounter() {
    const cachedCount = parseInt(localStorage.getItem('lastKnownViewCount'), 10);
    visitorCount.textContent = Number.isFinite(cachedCount) ? cachedCount.toLocaleString() : '0';

    fetch('https://views.molimolimolimolimolimolimolimolimolimolimolimolimolimolimoli.lol/up')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.count === 'number') {
          visitorCount.textContent = data.count.toLocaleString();
          localStorage.setItem('lastKnownViewCount', data.count);
        }
      })
      .catch((err) => console.error('Failed to update view counter:', err));
  }

  initializeVisitorCounter();

  const playlist = [
    { src: 'assets/ArtistLando - lost my touch.m4a', title: 'ArtistLando - lost my touch' },
    { src: 'assets/comehelpmae - 23.m4a', title: 'comehelpmae - 23' },
    { src: 'assets/tourniquet, MPPO - Nesting.m4a', title: 'tourniquet, MPPO - Nesting' }
  ];
  let currentTrackIndex = 0;
  let isPlayingAudio = false;
  let isMuted = false;

  function updatePlayPauseIcon() {
    playPauseIcon.innerHTML = isPlayingAudio ? PAUSE_ICON_PATH : PLAY_ICON_PATH;
    nowPlayingBars.classList.toggle('hidden', !isPlayingAudio);
  }

  function loadTrack(index, autoplay) {
    currentTrackIndex = (index + playlist.length) % playlist.length;
    const track = playlist[currentTrackIndex];
    audioEl.src = encodeURI(track.src);
    trackTitle.textContent = track.title;
    audioEl.volume = volumeSlider.value;
    audioEl.muted = isMuted;
    audioProgressFill.style.width = '0%';
    timeCurrentEl.textContent = '0:00';
    timeTotalEl.textContent = '0:00';
    if (autoplay) {
      audioEl.play().catch(err => console.error("Failed to play track:", err));
      isPlayingAudio = true;
    } else {
      isPlayingAudio = false;
    }
    updatePlayPauseIcon();
  }

  playPauseBtn.addEventListener('click', () => {
    if (isPlayingAudio) {
      audioEl.pause();
      isPlayingAudio = false;
    } else {
      audioEl.play().catch(err => console.error("Failed to resume track:", err));
      isPlayingAudio = true;
    }
    updatePlayPauseIcon();
  });

  prevBtn.addEventListener('click', () => loadTrack(currentTrackIndex - 1, true));
  nextBtn.addEventListener('click', () => loadTrack(currentTrackIndex + 1, true));

  audioEl.addEventListener('ended', () => loadTrack(currentTrackIndex + 1, true));

  audioEl.addEventListener('loadedmetadata', () => {
    timeTotalEl.textContent = formatTime(audioEl.duration);
  });

  audioEl.addEventListener('timeupdate', () => {
    if (audioEl.duration) {
      audioProgressFill.style.width = `${(audioEl.currentTime / audioEl.duration) * 100}%`;
    }
    timeCurrentEl.textContent = formatTime(audioEl.currentTime);
  });

  audioProgress.addEventListener('click', (e) => {
    const rect = audioProgress.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    if (audioEl.duration) audioEl.currentTime = ratio * audioEl.duration;
  });

  volumeIcon.addEventListener('click', () => {
    isMuted = !isMuted;
    audioEl.muted = isMuted;
    volumeIcon.innerHTML = isMuted
      ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>`
      : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
  });

  volumeIcon.addEventListener('touchstart', (e) => {
    e.preventDefault();
    isMuted = !isMuted;
    audioEl.muted = isMuted;
    volumeIcon.innerHTML = isMuted
      ? `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>`
      : `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
  });

  volumeSlider.addEventListener('input', () => {
    audioEl.volume = volumeSlider.value;
    isMuted = false;
    audioEl.muted = false;
    volumeIcon.innerHTML = `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>`;
  });

  // cava-style visualizer: real FFT off the actual playing track, laid out like cava's stereo
  // mirror mode - bass sits in the middle of the screen and treble spreads out to both edges
  // (left half is the spectrum in reverse, right half is the same spectrum forwards).
  let vizStarted = false;
  function initVisualizer() {
    if (vizStarted) return;
    vizStarted = true;

    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;

    const audioCtx = new AudioCtx();
    const source = audioCtx.createMediaElementSource(audioEl);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const barsContainer = document.getElementById('cava-bars');
    const bars = [];
    const barsPerSide = 80;
    const barCount = barsPerSide * 2;
    const barValues = new Float32Array(barCount);
    const targets = new Float32Array(barCount);

    for (let i = 0; i < barCount; i++) {
      const bar = document.createElement('div');
      bar.className = 'cava-bar';
      barsContainer.appendChild(bar);
      bars.push(bar);
    }

    // DOM bar i's underlying frequency band - left half runs treble->bass toward center,
    // right half runs bass->treble away from center, so bass meets in the middle.
    const bandForBar = new Int16Array(barCount);
    for (let i = 0; i < barsPerSide; i++) {
      bandForBar[i] = barsPerSide - 1 - i;
      bandForBar[barsPerSide + i] = i;
    }

    // precompute log-spaced [startBin, endBin) ranges per band. Cap well below Nyquist -
    // real music has essentially nothing above ~15kHz, so mapping bands all the way to
    // Nyquist wastes the outermost bars on dead air and makes the edges look cut off.
    const nyquist = audioCtx.sampleRate / 2;
    const minFreq = 40;
    const maxFreq = Math.min(nyquist, 15000);
    const bandBinRanges = [];
    for (let i = 0; i < barsPerSide; i++) {
      const loHz = minFreq * Math.pow(maxFreq / minFreq, i / barsPerSide);
      const hiHz = minFreq * Math.pow(maxFreq / minFreq, (i + 1) / barsPerSide);
      const loBin = Math.max(1, Math.floor((loHz / nyquist) * analyser.frequencyBinCount));
      const hiBin = Math.max(loBin + 1, Math.ceil((hiHz / nyquist) * analyser.frequencyBinCount));
      bandBinRanges.push([loBin, Math.min(hiBin, analyser.frequencyBinCount)]);
    }

    const fallSpeed = 2.8;
    const attackEase = 0.4;
    const noiseFloor = 0.08;
    const monstercat = 2; // cava's [smoothing] monstercat=1 - spreads peaks onto neighboring bars, but not so far that valleys never hit bottom
    function draw() {
      analyser.getByteFrequencyData(freqData);
      for (let i = 0; i < barCount; i++) {
        const band = bandForBar[i];
        const [loBin, hiBin] = bandBinRanges[band];
        let sum = 0;
        for (let b = loBin; b < hiBin; b++) sum += freqData[b];
        let raw = sum / (hiBin - loBin) / 255;
        if (raw < noiseFloor) raw = 0; // gate out FFT noise floor so quiet parts actually hit 0

        // gentle high-frequency boost, roughly matching the [eq] curve in ~/.config/cava/config
        const gain = 1.15 + (band / barsPerSide) * 1.1;
        targets[i] = Math.min(200, raw * 100 * gain);
      }

      // monstercat smoothing: cascade each bar's target onto its neighbors, decaying with
      // distance, so the spectrum flows instead of looking like independent jagged bars
      for (let i = 1; i < barCount; i++) {
        targets[i] = Math.max(targets[i], targets[i - 1] / monstercat);
      }
      for (let i = barCount - 2; i >= 0; i--) {
        targets[i] = Math.max(targets[i], targets[i + 1] / monstercat);
      }

      for (let i = 0; i < barCount; i++) {
        if (targets[i] > barValues[i]) {
          barValues[i] += (targets[i] - barValues[i]) * attackEase;
        } else {
          barValues[i] = Math.max(targets[i], barValues[i] - fallSpeed);
        }
        bars[i].style.height = `${Math.max(0, barValues[i])}%`;
      }
      requestAnimationFrame(draw);
    }
    draw();
  }

  function enterSite() {
    startScreen.classList.add('hidden');

    loadTrack(Math.floor(Math.random() * playlist.length), true);
    initVisualizer();

    profileCard.classList.remove('hidden');
    audioPlayerCard.classList.remove('hidden');
    gsap.fromTo(profileCard,
      { scale: 0.3 },
      { scale: 1, duration: 0.7, ease: 'back.out(1.8)', force3D: false }
    );
    gsap.fromTo(audioPlayerCard,
      { scale: 0.3 },
      { scale: 1, duration: 0.7, delay: 0.15, ease: 'back.out(1.8)', force3D: false }
    );

    if (!isTouchDevice && !cursorTrail) {
      cursorTrail = new CursorTrailEffect({ length: 18, size: 6, speed: 0.35 });
    }

    profileName.textContent = "moli";
    typeWriterBio();
  }

  startScreen.addEventListener('click', enterSite);
  startScreen.addEventListener('touchstart', (e) => {
    e.preventDefault();
    enterSite();
  });

  const bioMessages = [
    "this my description yo",
    "i eat hats for lunch",
    "molisaurus rawwrr :3",
    "i stole mjs hat lmao",
    "discord.gg/brush aa plis joinjoinjoinjoin plisplis"
  ];
  let bioText = '';
  let bioIndex = 0;
  let bioMessageIndex = 0;
  let isBioDeleting = false;
  let bioCursorVisible = true;

  function typeWriterBio() {
    if (!isBioDeleting && bioIndex < bioMessages[bioMessageIndex].length) {
      bioText = bioMessages[bioMessageIndex].slice(0, bioIndex + 1);
      bioIndex++;
    } else if (isBioDeleting && bioIndex > 0) {
      bioText = bioMessages[bioMessageIndex].slice(0, bioIndex - 1);
      bioIndex--;
    } else if (bioIndex === bioMessages[bioMessageIndex].length) {
      isBioDeleting = true;
      setTimeout(typeWriterBio, 2000);
      return;
    } else if (bioIndex === 0 && isBioDeleting) {
      isBioDeleting = false;
      bioMessageIndex = (bioMessageIndex + 1) % bioMessages.length;
    }
    profileBio.textContent = bioText + (bioCursorVisible ? '|' : ' ');
    setTimeout(typeWriterBio, isBioDeleting ? 75 : 150);
  }

  setInterval(() => {
    bioCursorVisible = !bioCursorVisible;
    profileBio.textContent = bioText + (bioCursorVisible ? '|' : ' ');
  }, 500);

  const AFK_MS = 60000;
  const afkOverlay = document.getElementById('afk-overlay');
  const afkClock = document.getElementById('afk-clock');
  let lastActivity = Date.now();
  let afkActive = false;
  let clockInterval = null;

  function updateAfkClock() {
    afkClock.textContent = new Date().toLocaleTimeString([], { hour12: false });
  }

  function showAfk() {
    afkActive = true;
    updateAfkClock();
    clockInterval = setInterval(updateAfkClock, 1000);
    afkOverlay.classList.add('active');
  }

  function hideAfk() {
    afkActive = false;
    afkOverlay.classList.remove('active');
    clearInterval(clockInterval);
  }

  function markActivity() {
    lastActivity = Date.now();
    if (afkActive) hideAfk();
  }

  ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll'].forEach((evt) => {
    document.addEventListener(evt, markActivity, { passive: true });
  });

  setInterval(() => {
    if (!afkActive && Date.now() - lastActivity >= AFK_MS) {
      showAfk();
    }
  }, 1000);

  const afkTriggerWord = 'moli';
  let afkTypedBuffer = '';
  document.addEventListener('keydown', (e) => {
    if (e.key.length !== 1) return;
    afkTypedBuffer = (afkTypedBuffer + e.key.toLowerCase()).slice(-afkTriggerWord.length);
    if (afkTypedBuffer === afkTriggerWord) {
      showAfk();
    }
  });

});
