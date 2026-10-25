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
  for (const [name, file] of Object.entries({ background: 'forside-lyd', stab: 'mus-stab', arp: 'arp' })) {
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
  navigationSound.src = 'assets/audio/click.wav';
  navigationSound.preload = 'auto';
  navigationSound.hidden = true;
  document.body.append(navigationSound);
  const workHoverSound = document.createElement('audio');
  workHoverSound.src = 'assets/audio/lyt-til-vaerkerne.wav';
  workHoverSound.preload = 'auto';
  workHoverSound.hidden = true;
  document.body.append(workHoverSound);
  const languageClickSound = document.createElement('audio');
  languageClickSound.src = 'assets/audio/nyt-click-dk-en.wav';
  languageClickSound.preload = 'auto';
  languageClickSound.hidden = true;
  document.body.append(languageClickSound);
  const backgroundAlternate = document.createElement('audio');
  backgroundAlternate.src = tracks.background.src;
  backgroundAlternate.preload = 'auto';
  backgroundAlternate.loop = true;
  backgroundAlternate.volume = 0;
  backgroundAlternate.hidden = true;
  document.body.append(backgroundAlternate);
  tracks.background.loop = true;
  let backgroundPrimary = tracks.background;
  let backgroundSecondary = backgroundAlternate;
  let backgroundLevel = .44;
  let backgroundCrossfadeStart = 0;
  let backgroundCrossfadeFrame = 0;
  let backgroundCrossfading = false;
  const backgroundCrossfadeDuration = 3.05;
  const backgroundEdgeFadeDuration = .05;
  tracks.background.volume = backgroundLevel;
  tracks.stab.volume = .0232470703125;
  tracks.arp.volume = 0;
  let enabled = false;
  let videoPlaying = false;
  let backgroundPausedForVideo = false;
  let hovering = false;
  let fadeFrame = 0;
  let backgroundFadeFrame = 0;
  let generation = 0;
  let failed = false;
  let navigationAudioContext = null;
  let navigationGain = null;
  const wave = document.querySelector('.wave');
  function updateBackgroundVolumes(progress = 0) {
    if (backgroundCrossfading) {
      const crossfadeProgress = Math.max(0, Math.min(1, progress));
      const angle = crossfadeProgress * Math.PI / 2;
      // A tiny edge envelope removes abrupt sample-boundary clicks while the
      // longer equal-power crossfade keeps the perceived level continuous.
      const edgeIn = Math.min(1, crossfadeProgress * backgroundCrossfadeDuration / backgroundEdgeFadeDuration);
      const edgeOut = Math.min(1, (1 - crossfadeProgress) * backgroundCrossfadeDuration / backgroundEdgeFadeDuration);
      backgroundPrimary.volume = backgroundLevel * Math.cos(angle) * edgeOut;
      backgroundSecondary.volume = backgroundLevel * Math.sin(angle) * edgeIn;
    } else {
      backgroundPrimary.volume = backgroundLevel;
      backgroundSecondary.volume = 0;
    }
  }
  function finishBackgroundCrossfade() {
    cancelAnimationFrame(backgroundCrossfadeFrame);
    const outgoing = backgroundPrimary;
    backgroundPrimary = backgroundSecondary;
    backgroundSecondary = outgoing;
    outgoing.pause();
    outgoing.currentTime = 0;
    backgroundCrossfading = false;
    updateBackgroundVolumes();
  }
  function animateBackgroundCrossfade() {
    cancelAnimationFrame(backgroundCrossfadeFrame);
    if (!backgroundCrossfading || backgroundPrimary.paused || backgroundSecondary.paused) return;
    // Drive progress from the incoming copy's own clock so a slightly late
    // timeupdate on the outgoing track cannot make its native loop jump the
    // crossfade backward at the seam.
    const progress = Math.max(0, Math.min(1, backgroundSecondary.currentTime / backgroundCrossfadeDuration));
    updateBackgroundVolumes(progress);
    if (progress >= 1) finishBackgroundCrossfade();
    else backgroundCrossfadeFrame = requestAnimationFrame(animateBackgroundCrossfade);
  }
  function maybeStartBackgroundCrossfade(event) {
    if (event && event.currentTarget !== backgroundPrimary) return;
    if (!enabled || videoPlaying || document.hidden || location.hash === '#vaerker' || backgroundCrossfading) return;
    if (!Number.isFinite(backgroundPrimary.duration) || backgroundPrimary.duration - backgroundPrimary.currentTime > backgroundCrossfadeDuration) return;
    if (backgroundSecondary.readyState < HTMLMediaElement.HAVE_CURRENT_DATA) return;
    const outgoing = backgroundPrimary;
    const incoming = backgroundSecondary;
    incoming.currentTime = 0;
    incoming.volume = 0;
    incoming.play().then(() => {
      if (backgroundPrimary !== outgoing || !enabled || videoPlaying || document.hidden || location.hash === '#vaerker') {
        incoming.pause();
        return;
      }
      backgroundCrossfading = true;
      // Begin with precisely the overlap remaining before the source's end.
      // The tiny edge envelope is nested inside this crossfade.
      backgroundCrossfadeStart = outgoing.currentTime;
      updateBackgroundVolumes(0);
      animateBackgroundCrossfade();
    }).catch(() => {});
  }
  tracks.background.addEventListener('timeupdate', maybeStartBackgroundCrossfade);
  tracks.background.addEventListener('canplay', maybeStartBackgroundCrossfade);
  backgroundAlternate.addEventListener('timeupdate', maybeStartBackgroundCrossfade);
  backgroundAlternate.addEventListener('canplay', maybeStartBackgroundCrossfade);
  function playBackground() {
    play(backgroundPrimary);
    if (backgroundCrossfading) {
      const incoming = backgroundSecondary;
      incoming.play().catch(() => {});
    }
    animateBackgroundCrossfade();
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
      failed = true;
      enabled = false;
      sync();
      label();
    });
  }
  function fadeArp(target) {
    cancelAnimationFrame(fadeFrame);
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
    function step(now) {
      const progress = Math.min(1, (now - started) / duration);
      backgroundLevel = startVolume + (target - startVolume) * progress;
      updateBackgroundVolumes(backgroundCrossfading && backgroundPrimary.duration > 0
        ? backgroundSecondary.currentTime / backgroundCrossfadeDuration
        : 0);
      if (progress < 1) backgroundFadeFrame = requestAnimationFrame(step);
      else if (pauseAtEnd && target === 0) {
        backgroundPrimary.pause();
        backgroundSecondary.pause();
      }
    }
    backgroundFadeFrame = requestAnimationFrame(step);
  }
  function resumeBackground() {
    if (!enabled || document.hidden || videoPlaying || location.hash === '#vaerker') return;
    cancelAnimationFrame(backgroundFadeFrame);
    backgroundLevel = 0;
    updateBackgroundVolumes();
    playBackground();
    fadeBackground(.44);
  }
  function sync() {
    const audible = enabled && !videoPlaying && !document.hidden;
    const backgroundAudible = audible && location.hash !== '#vaerker';
    if (backgroundAudible) {
      const resumeWithFade = backgroundPrimary.paused && backgroundLevel < .44;
      playBackground();
      const homeWaveActive = hovering && (!location.hash || location.hash === '#forside');
      const targetVolume = homeWaveActive ? .16 : .44;
      if (resumeWithFade || Math.abs(backgroundLevel - targetVolume) > .005) fadeBackground(targetVolume);
    } else if (enabled && !document.hidden) {
      fadeBackground(0, true);
    } else {
      cancelAnimationFrame(backgroundFadeFrame);
      backgroundPrimary.pause();
      backgroundSecondary.pause();
      backgroundLevel = .44;
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
    playCue(navigationSound, 1);
  }
  function playWorkHoverCue() {
    playCue(workHoverSound, .45);
  }
  function playLanguageCue() {
    playCue(languageClickSound, .486);
  }
  function playCue(audio, volume) {
    if (document.hidden) return;
    audio.pause();
    audio.currentTime = 0;
    audio.volume = volume;
    audio.playbackRate = 1;
    audio.play().catch(() => {});
  }
  toggle.addEventListener('click', () => {
    enabled = !enabled;
    failed = false;
    // Prime all elements during a user gesture for browsers with strict autoplay rules.
    if (enabled) {
      for (const audio of [tracks.stab, tracks.arp, navigationSound, workHoverSound, languageClickSound]) {
        audio.muted = true;
        const attempt = audio.play();
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
        attempt.catch(() => {});
      }
    }
    label();
    sync();
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
    setVideoPlaying(playing) {
      if (playing) backgroundPausedForVideo = true;
      videoPlaying = playing;
      sync();
      if (!playing && backgroundPausedForVideo) {
        resumeBackground();
        backgroundPausedForVideo = false;
      }
    },
    playNavigationCue,
    playWorkHoverCue,
    playLanguageCue
  };
})();
