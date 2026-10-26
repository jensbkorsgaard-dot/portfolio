// Local audio works without a build step, including when opening index.html.
(() => {
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'sound-toggle';
  toggle.textContent = 'Slå lyd til ↗';
  toggle.setAttribute('aria-pressed', 'false');
  toggle.setAttribute('aria-label', 'Slå hjemmesidens lyd til');
  document.body.append(toggle);
  const tracks = {};
  for (const [name, file] of Object.entries({ background: 'master-seamless', stab: 'mus-stab', arp: 'arp' })) {
    const audio = document.createElement('audio');
    audio.src = `assets/audio/${file}.wav`;
    audio.preload = 'auto';
    audio.dataset.track = name;
    audio.loop = name === 'background' || name === 'arp';
    audio.hidden = true;
    document.body.append(audio);
    tracks[name] = audio;
  }
  const navigationSound = document.createElement('audio');
  navigationSound.src = 'assets/audio/overstclick.wav';
  navigationSound.preload = 'auto';
  navigationSound.hidden = true;
  document.body.append(navigationSound);
  const workHoverSound = document.createElement('audio');
  workHoverSound.src = 'assets/audio/lyt-til-vaerkerne.wav';
  workHoverSound.preload = 'auto';
  workHoverSound.hidden = true;
  document.body.append(workHoverSound);
  const sentSound = document.createElement('audio');
  sentSound.src = 'assets/audio/sendt.wav';
  sentSound.preload = 'auto';
  sentSound.hidden = true;
  document.body.append(sentSound);
  const videoStartSound = new Audio('assets/audio/sluk-go.wav');
  const videoPauseSound = new Audio('assets/audio/taend-go.wav');
  for (const audio of [videoStartSound, videoPauseSound]) {
    audio.preload = 'auto';
    audio.loop = false;
    audio.hidden = true;
    document.body.append(audio);
  }
  const languageClickSound = document.createElement('audio');
  languageClickSound.src = 'assets/audio/nyt-click-dk-en.wav';
  languageClickSound.preload = 'auto';
  languageClickSound.hidden = true;
  document.body.append(languageClickSound);
  const workSelectSound = new Audio('assets/audio/vaerkselect.wav');
  workSelectSound.preload = 'auto';
  workSelectSound.loop = false;
  workSelectSound.hidden = true;
  document.body.append(workSelectSound);
  const homepageWorkSound = new Audio('assets/audio/vaerkknappen.wav');
  const cvSound = new Audio('assets/audio/cver.wav');
  const linkedInSound = new Audio('assets/audio/linker.wav');
  linkedInSound.loop = false;
  for (const audio of [homepageWorkSound, cvSound, linkedInSound]) {
    audio.preload = 'auto';
    audio.loop = false;
    audio.hidden = true;
    document.body.append(audio);
  }
  // master.wav is a seamless loop: replay the same source directly at its
  // endpoint, without a crossfade, overlap, or fade at the loop boundary.
  tracks.background.loop = true;
  const backgroundPrimary = tracks.background;
  let backgroundLevel = .374;
  const otherSoundVolumeScale = .81;
  const stabVolumeScale = otherSoundVolumeScale * 1.1;
  tracks.background.volume = backgroundLevel;
  tracks.stab.volume = .0232470703125 * stabVolumeScale;
  tracks.arp.volume = 0;
  let enabled = false;
  let videoPlaying = false;
  let hovering = false;
  let fadeFrame = 0;
  let backgroundFadeFrame = 0;
  let generation = 0;
  let failed = false;
  let navigationAudioContext = null;
  let navigationGain = null;
  let backgroundAudioContext = null;
  let backgroundGain = null;
  let backgroundBuffer = null;
  let backgroundBufferPromise = null;
  let backgroundSource = null;
  let backgroundOffset = 0;
  let backgroundStartedAt = 0;
  const backgroundBytesPromise = fetch('assets/audio/master-seamless.wav')
    .then(response => {
      if (!response.ok) throw new Error('Background audio could not load');
      return response.arrayBuffer();
    })
    .catch(() => null);
  const wave = document.querySelector('.wave');
  function updateBackgroundVolumes() {
    if (backgroundGain && backgroundAudioContext) {
      backgroundGain.gain.setValueAtTime(backgroundLevel, backgroundAudioContext.currentTime);
    }
    backgroundPrimary.volume = backgroundLevel;
  }
  async function loadBackgroundBuffer() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return null;
    if (!backgroundAudioContext) {
      backgroundAudioContext = new AudioContext();
      backgroundGain = backgroundAudioContext.createGain();
      backgroundGain.gain.value = backgroundLevel;
      backgroundGain.connect(backgroundAudioContext.destination);
    }
    if (backgroundAudioContext.state === 'suspended') {
      backgroundAudioContext.resume().catch(() => {});
    }
    if (!backgroundBufferPromise) {
      backgroundBufferPromise = backgroundBytesPromise
        .then(bytes => bytes ? backgroundAudioContext.decodeAudioData(bytes.slice(0)) : null)
        .then(buffer => { backgroundBuffer = buffer; return buffer; })
        .catch(() => null);
    }
    return backgroundBuffer || backgroundBufferPromise;
  }
  async function startBackgroundPlayback() {
    if (backgroundSource) {
      if (backgroundAudioContext?.state === 'suspended') {
        await backgroundAudioContext.resume().catch(() => {});
      }
      return;
    }
    const buffer = await loadBackgroundBuffer();
    if (!enabled || document.hidden || videoPlaying) return;
    if (buffer && backgroundAudioContext && backgroundGain) {
      if (backgroundAudioContext.state === 'suspended') await backgroundAudioContext.resume().catch(() => {});
      if (!enabled || document.hidden || videoPlaying || backgroundSource) return;
      const source = backgroundAudioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      source.loopStart = 0;
      source.loopEnd = buffer.duration;
      source.connect(backgroundGain);
      backgroundStartedAt = backgroundAudioContext.currentTime;
      backgroundSource = source;
      source.start(0, backgroundOffset % buffer.duration);
      return;
    }
    if (backgroundPrimary.paused) {
      await backgroundPrimary.play().catch(() => {});
      if (!enabled || document.hidden || videoPlaying) backgroundPrimary.pause();
    }
  }
  function pauseBackgroundPlayback() {
    if (!backgroundSource || !backgroundBuffer || !backgroundAudioContext) {
      backgroundPrimary.pause();
      return;
    }
    const duration = backgroundBuffer.duration;
    backgroundOffset = (backgroundOffset + backgroundAudioContext.currentTime - backgroundStartedAt) % duration;
    const source = backgroundSource;
    backgroundSource = null;
    source.onended = null;
    source.stop();
    source.disconnect();
  }
  function label() {
    const english = document.documentElement.lang === 'en';
    toggle.textContent = failed ? (english ? 'Sound could not load · try again' : 'Lyd kunne ikke indlæses · prøv igen') : enabled ? (english ? 'Sound on · turn off' : 'Lyd til · slå fra') : (english ? 'Turn sound on ↗' : 'Slå lyd til ↗');
    toggle.setAttribute('aria-pressed', String(enabled));
    toggle.setAttribute('aria-label', enabled ? (english ? 'Turn the website sound off' : 'Slå hjemmesidens lyd fra') : (english ? 'Turn the website sound on' : 'Slå hjemmesidens lyd til'));
  }
  function play(audio) {
    if (!audio.paused) return;
    const version = generation;
    audio.play().then(() => {
      if (version !== generation || !enabled || document.hidden || videoPlaying) audio.pause();
    }).catch(error => {
      if (error.name === 'AbortError' || version !== generation) return;
      if (audio === backgroundPrimary) return;
      failed = true;
      enabled = false;
      sync();
      label();
    });
  }
  function fadeArp(target) {
    cancelAnimationFrame(fadeFrame);
    target *= otherSoundVolumeScale;
    const startVolume = tracks.arp.volume;
    const started = performance.now();
    const duration = target ? 180 : 500;
    function step(now) {
      const progress = Math.min(1, (now - started) / duration);
      tracks.arp.volume = startVolume + (target - startVolume) * progress;
      if (progress < 1) fadeFrame = requestAnimationFrame(step);
      else if (!target) { tracks.arp.pause(); tracks.arp.currentTime = 0; }
    }
    fadeFrame = requestAnimationFrame(step);
  }
  function fadeBackground(target, pauseAtEnd = false, duration = 500) {
    cancelAnimationFrame(backgroundFadeFrame);
    const startVolume = backgroundLevel;
    const started = performance.now();
    const automateGain = Boolean(backgroundSource && backgroundGain && backgroundAudioContext);
    if (automateGain) {
      const now = backgroundAudioContext.currentTime;
      backgroundGain.gain.cancelScheduledValues(now);
      backgroundGain.gain.setValueAtTime(startVolume, now);
      backgroundGain.gain.linearRampToValueAtTime(target, now + duration / 1000);
    }
    function step(now) {
      const progress = Math.min(1, (now - started) / duration);
      backgroundLevel = startVolume + (target - startVolume) * progress;
      if (!automateGain) updateBackgroundVolumes();
      if (progress < 1) backgroundFadeFrame = requestAnimationFrame(step);
      else if (pauseAtEnd && target === 0) {
        pauseBackgroundPlayback();
      }
    }
    backgroundFadeFrame = requestAnimationFrame(step);
  }
  function backgroundTargetVolume() {
    if (!location.hash || location.hash === '#forside') return .374;
    return location.hash === '#vaerker' ? .176 : .22;
  }
  function resumeBackgroundAfterVideo(duration = 1500) {
    if (!enabled || document.hidden || videoPlaying) return;
    startBackgroundPlayback()
      .then(() => {
        if (!enabled || document.hidden || videoPlaying) return;
        fadeBackground(backgroundTargetVolume(), false, duration);
      })
      .catch(() => {
        // A background-track resume failure must not change the user's sound-toggle state.
      });
  }
  function sync(backgroundTransitionDuration = 500) {
    const audible = enabled && !videoPlaying && !document.hidden;
    if (audible) {
      // Resume paused background tracks before fading their level back up.
      // This path is shared by video pause, navigation, and the sound toggle.
      resumeBackgroundAfterVideo(backgroundTransitionDuration);
    } else if (!document.hidden) {
      fadeBackground(0, true, backgroundTransitionDuration);
    } else {
      cancelAnimationFrame(backgroundFadeFrame);
      pauseBackgroundPlayback();
      backgroundLevel = .374;
      updateBackgroundVolumes();
    }
    if (!audible) {
      generation++;
      tracks.arp.pause();
      cancelAnimationFrame(fadeFrame);
      tracks.arp.volume = 0;
    }
    if (audible && hovering && (!location.hash || location.hash === '#forside')) {
      play(tracks.arp);
      fadeArp(.20625);
    } else if (audible) fadeArp(0);
  }
  function playNavigationCue() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!navigationGain && AudioContext) {
      navigationAudioContext = new AudioContext();
      const source = navigationAudioContext.createMediaElementSource(navigationSound);
      navigationGain = navigationAudioContext.createGain();
      navigationGain.gain.value = 1.17;
      source.connect(navigationGain).connect(navigationAudioContext.destination);
    }
    navigationAudioContext?.resume().catch(() => {});
    // Match the navigation click's measured RMS to the DA/EN click cue.
    playCue(navigationSound, .3718);
  }
  function playWorkHoverCue() {
    playCue(workHoverSound, .45);
  }
  function playSentCue() {
    playCue(sentSound, .45);
  }
  function playVideoStartCue() {
    if (location.hash === '#vaerker') playCue(videoStartSound, .45 * .65 * .9 * .9 * 1.13);
  }
  function playVideoPauseCue() {
    if (location.hash === '#vaerker') playCue(videoPauseSound, .45 * .65 * .9 * .9 * 1.13);
  }
  function playLanguageCue() {
    playCue(languageClickSound, .486);
  }
  const homepageWorkVolume = .495 * otherSoundVolumeScale;
  let homepageWorkFadeFrame = 0;
  function playHomepageWorkCue() {
    cancelAnimationFrame(homepageWorkFadeFrame);
    homepageWorkSound.pause();
    homepageWorkSound.currentTime = 0;
    homepageWorkSound.volume = homepageWorkVolume;
    homepageWorkSound.loop = false;
    homepageWorkSound.play().catch(() => {});
  }
  function stopHomepageWorkCue(immediate = false) {
    if (homepageWorkSound.paused) return;
    cancelAnimationFrame(homepageWorkFadeFrame);
    if (immediate) {
      homepageWorkSound.pause();
      homepageWorkSound.currentTime = 0;
      homepageWorkSound.volume = homepageWorkVolume;
      return;
    }
    const startVolume = homepageWorkSound.volume;
    const started = performance.now();
    function fade(now) {
      const progress = Math.min(1, (now - started) / 1500);
      homepageWorkSound.volume = startVolume * (1 - progress);
      if (progress < 1 && !homepageWorkSound.paused) homepageWorkFadeFrame = requestAnimationFrame(fade);
      else {
        homepageWorkSound.pause();
        homepageWorkSound.currentTime = 0;
        homepageWorkSound.volume = homepageWorkVolume;
      }
    }
    homepageWorkFadeFrame = requestAnimationFrame(fade);
  }
  const hoverCueVolume = .45 * otherSoundVolumeScale;
  const hoverCueStates = new Map();
  function playHoverLogoCue(audio, fadeInDuration = 0) {
    if (document.hidden) return;
    const state = hoverCueStates.get(audio) || { frame: 0 };
    cancelAnimationFrame(state.frame);
    audio.pause();
    audio.currentTime = 0;
    audio.volume = fadeInDuration ? 0 : hoverCueVolume;
    audio.playbackRate = 1;
    audio.loop = false;
    audio.play().catch(() => {});
    if (fadeInDuration) {
      const started = performance.now();
      function fadeIn(now) {
        const progress = Math.min(1, (now - started) / fadeInDuration);
        audio.volume = hoverCueVolume * progress;
        if (progress < 1 && !audio.paused) state.frame = requestAnimationFrame(fadeIn);
        else state.frame = 0;
      }
      state.frame = requestAnimationFrame(fadeIn);
    }
    hoverCueStates.set(audio, state);
  }
  function stopHoverLogoCue(audio, immediate = false) {
    const state = hoverCueStates.get(audio);
    if (!state) return;
    cancelAnimationFrame(state.frame);
    if (immediate) {
      audio.pause();
      audio.currentTime = 0;
      audio.volume = hoverCueVolume;
      state.frame = 0;
      return;
    }
    if (audio.paused) return;
    const startVolume = audio.volume;
    const started = performance.now();
    function fadeOut(now) {
      const progress = Math.min(1, (now - started) / 1000);
      audio.volume = startVolume * (1 - progress);
      if (progress < 1 && !audio.paused) state.frame = requestAnimationFrame(fadeOut);
      else {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = hoverCueVolume;
        state.frame = 0;
      }
    }
    state.frame = requestAnimationFrame(fadeOut);
  }
  function playCvCue() { playHoverLogoCue(cvSound); }
  function stopCvCue(immediate = false) { stopHoverLogoCue(cvSound, immediate); }
  const linkedInCueVolume = .9;
  function playLinkedInCue() { playCue(linkedInSound, linkedInCueVolume); }
  function playWorkSelectCue() { playCue(workSelectSound, .45 * .95); }
  function stopLinkedInCue() {
    linkedInSound.pause();
    linkedInSound.currentTime = 0;
    linkedInSound.volume = linkedInCueVolume;
  }
  function playCue(audio, volume) {
    if (document.hidden) return;
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume * (audio === tracks.stab ? stabVolumeScale : otherSoundVolumeScale);
    audio.playbackRate = 1;
    audio.play().catch(() => {});
  }
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    failed = false;
    // Prime all elements during a user gesture for browsers with strict autoplay rules.
    if (enabled) {
      for (const audio of [tracks.stab, tracks.arp, navigationSound, workHoverSound, sentSound, videoStartSound, videoPauseSound, languageClickSound, homepageWorkSound, cvSound, linkedInSound, workSelectSound]) {
        audio.muted = true;
        const attempt = audio.play();
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        attempt.catch(() => {});
      }
    }
    label();
    sync(1500);
  });
  wave.addEventListener('pointerenter', event => {
    if (event.pointerType === 'touch' || hovering) return;
    hovering = true;
    if (!videoPlaying && !document.hidden) playCue(tracks.stab, enabled ? .0232470703125 : .03022119140625);
    sync();
  });
  wave.addEventListener('pointerleave', () => { hovering = false; sync(); });
  window.addEventListener('hashchange', () => { hovering = false; tracks.stab.pause(); sync(); });
  document.addEventListener('visibilitychange', sync);
  document.addEventListener('portfolio-languagechange', label);
  window.portfolioAudio = {
    setVideoPlaying(playing, transitionCue) {
      if (videoPlaying === playing) {
        if (!playing) resumeBackgroundAfterVideo(1500);
        return;
      }
      videoPlaying = playing;
      if (transitionCue === 'play') playVideoStartCue();
      else if (transitionCue === 'pause') playVideoPauseCue();
      document.body.classList.toggle('video-playing', playing);
      sync(1500);
    },
    playNavigationCue,
    playWorkHoverCue,
    playSentCue,
    playLanguageCue,
    playHomepageWorkCue,
    stopHomepageWorkCue,
    playCvCue,
    stopCvCue,
    playLinkedInCue,
    stopLinkedInCue,
    playWorkSelectCue
  };
})();
