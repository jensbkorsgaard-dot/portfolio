const content = window.portfolioContent;
const sections = [...document.querySelectorAll('main > section')];
const navigation = [...document.querySelectorAll('nav a')];
const languageToggle = document.querySelector('.language-toggle');
const copy = {
  da: {
    title: 'Lyddesigner', navLabel: 'Hovednavigation', nav: { forside: 'Forside', bio: 'Bio', kontakt: 'Kontakt', vaerker: 'Værker' }, identity: 'LYDDESIGNER',
    homeEyebrow: 'LYDDESIGN / PORTFOLIO', homeTitle: ['Skru op.', 'Lyt efter.'], intro: 'Lyddesign til film, podcast, computerspil og musik.', heroLink: 'Lyt til værkerne ', footer: ['FILM · PODCAST · SPIL · MUSIK', 'LYT. MÆRK. OPLEV.'],
    worksEyebrow: 'UDVALGTE PRODUKTIONER', works: 'Værker', chooseWork: 'Vælg værk', seekVideo: 'Vælg tidspunkt i filmen', bioEyebrow: 'BAG LYDEN', bioTitle: 'Biografi', contactEyebrow: 'LAD OS FINDE LYDEN', contact: 'Kontakt', contactIntro: 'Har du et spørgsmål eller brug for lyddesign til en film, podcast, et computerspil eller musik? Fortæl mig om din produktion og dine ønsker i formularen.',
    fields: ['Fornavn', 'Efternavn', 'Nationalitet', 'Telefonnummer', 'E-mail', 'Din besked'], placeholder: 'Fortæl lidt om din produktion, og hvilken lyd du leder efter …', responseTime: 'Du kan typisk forvente svar inden for 3–5 dage.', emailNote: 'Når du har udfyldt formularen åbnes dit mailprogram. OBS. Formularen sendes ikke automatisk, men skal fuldføres i dit eksterne mailprogram.', send: 'Send besked ', thankYou: 'Tak for din henvendelse', more: 'Se mere om arbejdet', workLabel: 'LYDDESIGN', videoSlot: 'Plads til din YouTube-video', loading: 'Indlæser film', play: 'Afspil film', pause: 'Sæt video på pause', resume: 'Fortsæt', videoFallback: 'Her kommer en kort beskrivelse af arbejdet med lyden i denne produktion.'
  },
  en: {
    title: 'Sound Designer', navLabel: 'Main navigation', nav: { forside: 'Home', bio: 'Bio', kontakt: 'Contact', vaerker: 'Work' }, identity: 'SOUND DESIGNER',
    homeEyebrow: 'SOUND DESIGN / PORTFOLIO', homeTitle: ['Turn it up.', 'Listen closer.'], intro: 'Sound design for film, podcasts, video games, and music.', heroLink: 'Listen to the work ', footer: ['FILM · PODCAST · GAMES · MUSIC', 'LISTEN. NOTICE. EXPERIENCE.'],
    worksEyebrow: 'SELECTED PRODUCTIONS', works: 'Work', chooseWork: 'Choose a project', seekVideo: 'Choose a point in the film', bioEyebrow: 'BEHIND THE SOUND', bioTitle: 'Biography', contactEyebrow: 'LET’S FIND THE SOUND', contact: 'Contact', contactIntro: 'Have a question or need sound design for a film, podcast, video game, or music? Tell me about your production and what you need in the form.',
    fields: ['First name', 'Last name', 'Nationality', 'Phone number', 'Email', 'Your message'], placeholder: 'Tell me about your production and the sound you are looking for …', responseTime: 'You can usually expect a reply within 3–5 days.', emailNote: 'After completing the form, your email app will open. Note: The form is not sent automatically; you must finish and send it in your external email app.', send: 'Send message ', thankYou: 'Thank you for your message', more: 'Learn more about the work', workLabel: 'SOUND DESIGN', videoSlot: 'Space for your YouTube video', loading: 'Loading film', play: 'Play film', pause: 'Pause video', resume: 'Continue', videoFallback: 'A short description of the sound work for this production will appear here.'
  }
};
let language = 'da';
let activeWorkIndex = 0;
let youtubePlayer = null;
let youtubeReady = null;
let youtubeProgressTimer = null;
let pauseActiveVideo = null;
let videoPlayPending = false;
let videoPausePending = false;
function loadYouTubeAPI() {
  if (window.YT?.Player) return Promise.resolve();
  if (!youtubeReady) youtubeReady = new Promise((resolve, reject) => {
    window.onYouTubeIframeAPIReady = resolve;
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.onerror = () => { youtubeReady = null; reject(new Error('YouTube API unavailable')); };
    document.head.append(script);
  });
  return youtubeReady;
}
document.querySelector('.identity').firstChild.textContent = content.name;
document.title = `${content.name} — Lyddesigner`;
document.querySelector('.draft-note').hidden = Boolean(content.bio);
function navigate() {
  const target = sections.find(section => `#${section.id}` === location.hash) || sections[0];
  sections.forEach(section => { section.hidden = section !== target; });
  document.querySelector('.linkedin-link').hidden = target.id !== 'forside';
  document.querySelector('.cv-link').hidden = target.id !== 'forside';
  if (target.id !== 'vaerker') {
    youtubePlayer?.pauseVideo?.();
    videoPlayPending = false;
    videoPausePending = false;
    window.portfolioAudio.setVideoPlaying(false);
  }
  navigation.forEach(link => {
    if (link.hash === `#${target.id}`) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', navigate);
navigate();
function pauseVideoWhenClickingOutside(event) {
  if (!pauseActiveVideo || event.target.closest?.('.video-frame')) return;
  pauseActiveVideo();
}
document.addEventListener('pointerdown', pauseVideoWhenClickingOutside, true);
document.addEventListener('click', pauseVideoWhenClickingOutside, true);
navigation.forEach(link => {
  link.addEventListener('click', () => window.portfolioAudio.playNavigationCue());
});
document.querySelector('.hero-button').addEventListener('click', () => {
  window.portfolioAudio.stopHomepageWorkCue(true);
  window.portfolioAudio.playLanguageCue();
});
const homepageWorkButton = document.querySelector('.hero-button');
homepageWorkButton.addEventListener('pointerenter', event => {
  if (event.pointerType !== 'touch') window.portfolioAudio.playHomepageWorkCue();
});
homepageWorkButton.addEventListener('pointerleave', () => window.portfolioAudio.stopHomepageWorkCue());
const cvButton = document.querySelector('.cv-link');
cvButton.addEventListener('pointerenter', event => {
  if (event.pointerType !== 'touch') window.portfolioAudio.playCvCue();
});
cvButton.addEventListener('pointerleave', () => window.portfolioAudio.stopCvCue());
cvButton.addEventListener('click', () => {
  window.portfolioAudio.stopCvCue(true);
  window.portfolioAudio.playLanguageCue();
});
const linkedInButton = document.querySelector('.linkedin-link');
linkedInButton.addEventListener('pointerenter', event => {
  if (event.pointerType !== 'touch') window.portfolioAudio.playLinkedInCue();
});
linkedInButton.addEventListener('click', () => {
  window.portfolioAudio.stopLinkedInCue();
  window.portfolioAudio.playLanguageCue();
});
const wave = document.querySelector('.wave');
for (let index = 0; index < 75; index++) {
  const bar = document.createElement('i');
  bar.style.height = `${12 + Math.abs(Math.sin(index * .7) * Math.cos(index * .19)) * 85}%`;
  bar.style.animationDelay = `${index * -.13}s`;
  wave.append(bar);
}
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
wave.addEventListener('pointermove', event => {
  if (event.pointerType === 'touch' || reducedMotion.matches) return;
  const bounds = wave.getBoundingClientRect();
  const pointerX = event.clientX - bounds.left;
  const pointerY = (event.clientY - bounds.top - bounds.height / 2) / bounds.height;
  wave.classList.add('is-interacting');
  [...wave.children].forEach(bar => {
    const distance = (bar.offsetLeft + bar.offsetWidth / 2 - pointerX) / 85;
    const influence = Math.exp(-distance * distance);
    const scale = .55 + influence * (1.1 + Math.abs(pointerY) * .6);
    bar.style.transform = `translateY(${pointerY * 65 * influence}px) scaleY(${scale})`;
    bar.style.background = influence > .45 ? '#e3ffcf' : '';
  });
});
function resetWave() {
  wave.classList.remove('is-interacting');
  [...wave.children].forEach(bar => {
    bar.style.transform = '';
    bar.style.background = '';
  });
}
wave.addEventListener('pointerleave', resetWave);
reducedMotion.addEventListener('change', resetWave);
function videoId(raw) {
  try {
    const url = new URL(raw);
    const id = url.hostname === 'youtu.be' ? url.pathname.slice(1) : ['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname) ? url.searchParams.get('v') || url.pathname.split('/')[2] : null;
    return /^[\w-]{11}$/.test(id || '') ? id : null;
  } catch { return null; }
}
const tabs = document.querySelector('.work-tabs');
const panel = document.querySelector('#work-panel');
function showWork(index, focus = false) {
  activeWorkIndex = index;
  pauseActiveVideo = null;
  videoPlayPending = false;
  videoPausePending = false;
  const text = copy[language];
  if (youtubeProgressTimer) {
    clearInterval(youtubeProgressTimer);
    youtubeProgressTimer = null;
  }
  youtubePlayer?.destroy?.();
  youtubePlayer = null;
  window.portfolioAudio.setVideoPlaying(false);
  const work = content.works[index];
  const description = work.description?.[language] || work.description;
  [...tabs.children].forEach((tab, position) => {
    tab.setAttribute('aria-selected', String(position === index));
    tab.tabIndex = position === index ? 0 : -1;
  });
  panel.replaceChildren();
  panel.setAttribute('aria-labelledby', `work-tab-${index}`);
  const video = document.createElement('div');
  video.className = 'video-frame';
  const id = videoId(work.youtubeUrl);
  if (id) {
    video.classList.add('has-poster');
    const playerHost = document.createElement('div');
    playerHost.className = 'youtube-host';
    video.append(playerHost);
    const posterCover = document.createElement('div');
    posterCover.className = 'video-poster-cover';
    posterCover.setAttribute('aria-hidden', 'true');
    posterCover.style.setProperty('--thumbnail', `url("https://i.ytimg.com/vi/${id}/hqdefault.jpg")`);
    video.append(posterCover);
    const launch = document.createElement('button');
    launch.type = 'button';
    launch.className = 'video-launch';
    launch.style.setProperty('--thumbnail', `url("https://i.ytimg.com/vi/${id}/hqdefault.jpg")`);
    launch.textContent = text.loading;
    launch.disabled = true;
    video.append(launch);
    const timeline = document.createElement('div');
    timeline.className = 'video-timeline';
    const elapsed = document.createElement('time');
    elapsed.textContent = '0:00';
    const seek = document.createElement('input');
    seek.type = 'range';
    seek.min = '0';
    seek.max = '100';
    seek.step = '0.1';
    seek.value = '0';
    seek.disabled = true;
    seek.setAttribute('aria-label', text.seekVideo);
    const durationLabel = document.createElement('time');
    durationLabel.textContent = '0:00';
    timeline.append(elapsed, seek, durationLabel);
    video.append(timeline);
    let isSeeking = false;
    function formatVideoTime(value) {
      const seconds = Math.max(0, Math.floor(Number(value) || 0));
      return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
    }
    function updateTimeline(player) {
      const duration = Number(player.getDuration?.()) || 0;
      if (!duration) return;
      const current = Math.min(Number(player.getCurrentTime?.()) || 0, duration);
      seek.max = String(duration);
      seek.disabled = false;
      durationLabel.textContent = formatVideoTime(duration);
      if (!isSeeking) {
        seek.value = String(current);
        elapsed.textContent = formatVideoTime(current);
        seek.style.setProperty('--progress', `${current / duration * 100}%`);
      }
    }
    seek.addEventListener('input', () => {
      isSeeking = true;
      elapsed.textContent = formatVideoTime(seek.value);
      const progress = Number(seek.value) / Number(seek.max) * 100;
      seek.style.setProperty('--progress', `${progress}%`);
    });
    seek.addEventListener('change', () => {
      if (youtubePlayer?.seekTo && !seek.disabled) youtubePlayer.seekTo(Number(seek.value), true);
      isSeeking = false;
    });
    seek.addEventListener('blur', () => { isSeeking = false; });
    let isPlaying = false;
    let hasStarted = false;
    function setLaunchState(state) {
      isPlaying = state === 'playing';
      video.classList.toggle('has-poster', !isPlaying);
      if (state === 'playing' || state === 'paused') {
        videoPlayPending = false;
        videoPausePending = false;
      }
      if (isPlaying || state === 'paused') hasStarted = true;
      launch.classList.toggle('is-playing', hasStarted);
      launch.disabled = state === 'loading';
      launch.innerHTML = isPlaying
        ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 5h4v14H7zM15 5h4v14h-4z" fill="currentColor"/></svg>'
        : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z" fill="currentColor"/></svg>';
      launch.setAttribute('aria-label', isPlaying ? text.pause : state === 'paused' ? text.resume : text.play);
    }
    loadYouTubeAPI().then(() => {
      if (!playerHost.isConnected) return;
      const playerVars = { playsinline: 1, controls: 0, fs: 0, rel: 0, iv_load_policy: 3 };
      if (location.protocol !== 'file:') playerVars.origin = location.origin;
      youtubePlayer = new YT.Player(playerHost, {
        videoId: id,
        playerVars,
        events: {
          onReady(event) {
            event.target.setVolume(81);
            setLaunchState('ready');
            updateTimeline(event.target);
            youtubeProgressTimer = window.setInterval(() => updateTimeline(event.target), 250);
            pauseActiveVideo = () => {
              if ((!isPlaying && !videoPlayPending) || videoPausePending) return;
              videoPausePending = true;
              videoPlayPending = false;
              window.portfolioAudio.setVideoPlaying(false);
              event.target.pauseVideo();
              setLaunchState('paused');
            };
            launch.addEventListener('click', () => {
              if (isPlaying || videoPlayPending) {
                pauseActiveVideo();
              } else {
                videoPausePending = false;
                videoPlayPending = true;
                window.portfolioAudio.setVideoPlaying(true);
                event.target.playVideo();
                setLaunchState('playing');
              }
            });
          },
          onStateChange(event) {
            if (!playerHost.isConnected) return;
            if (event.data === YT.PlayerState.PLAYING) {
              if (document.querySelector('#vaerker').hidden) { event.target.pauseVideo(); return; }
              videoPlayPending = false;
              videoPausePending = false;
              window.portfolioAudio.setVideoPlaying(true);
              setLaunchState('playing');
            } else if ([YT.PlayerState.PAUSED, YT.PlayerState.ENDED, YT.PlayerState.CUED].includes(event.data)) {
              videoPlayPending = false;
              videoPausePending = false;
              window.portfolioAudio.setVideoPlaying(false);
              setLaunchState(event.data === YT.PlayerState.PAUSED ? 'paused' : 'ready');
            }
          },
          onError() {
            if (youtubeProgressTimer) { clearInterval(youtubeProgressTimer); youtubeProgressTimer = null; }
            videoPlayPending = false;
            videoPausePending = false;
            seek.disabled = true;
            window.portfolioAudio.setVideoPlaying(false);
            setLaunchState('ready');
          }
        }
      });
    }).catch(() => {
      // Hide the non-coordinated player instead of allowing competing audio.
      playerHost.remove();
      launch.remove();
      timeline.remove();
      const message = document.createElement('p');
      message.className = 'video-placeholder';
      message.textContent = 'Videoafspilleren kunne ikke indlæses. Genindlæs siden for at prøve igen.';
      video.append(message);
    });
  } else {
    const placeholder = document.createElement('div');
    placeholder.className = 'video-placeholder';
    const icon = document.createElement('b');
    icon.textContent = '▷';
    const text = document.createElement('span');
    text.textContent = copy[language].videoSlot;
    placeholder.append(icon, text);
    video.append(placeholder);
  }
  function detailSection(heading, body, className) {
    const detail = document.createElement('div');
    detail.className = `work-details ${className}`;
    const detailHeading = document.createElement('h3');
    detailHeading.textContent = heading;
    const description = document.createElement('p');
    description.textContent = body;
    detail.append(detailHeading, description);
    return detail;
  }
  const about = description?.about
    ? detailSection(description.aboutHeading, description.about, 'work-about')
    : detailSection('', description || text.videoFallback, 'work-about');
  const caption = document.createElement('div');
  caption.className = 'work-caption';
  const title = document.createElement('h2');
  title.textContent = work.title;
  const label = document.createElement('p');
  label.textContent = `${String(index + 1).padStart(2, '0')} / ${String(content.works.length).padStart(2, '0')} — ${text.workLabel}`;
  caption.append(title, label);
  const role = description?.role
    ? detailSection(description.roleHeading, description.role, 'work-role')
    : null;
  panel.append(caption, about, video);
  if (role) panel.append(role);
  if (focus) tabs.children[index].focus();
}
content.works.forEach((work, index) => {
  const tab = document.createElement('button');
  tab.type = 'button';
  tab.id = `work-tab-${index}`;
  tab.setAttribute('role', 'tab');
  tab.setAttribute('aria-controls', 'work-panel');
  tab.textContent = work.title;
  tab.setAttribute('aria-label', work.title);
  tab.addEventListener('click', () => { window.portfolioAudio.playWorkSelectCue(); showWork(index); });
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % content.works.length;
    if (event.key === 'ArrowLeft') next = (index + content.works.length - 1) % content.works.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = content.works.length - 1;
    if (next !== undefined) { event.preventDefault(); showWork(next, true); }
  });
  tabs.append(tab);
});
function setHeading(selector, value) {
  document.querySelector(selector).firstChild.textContent = value;
}
function applyLanguage() {
  const text = copy[language];
  document.querySelector('#bio-text').textContent = content.bio?.[language] || 'Her kommer din biografi.';
  document.documentElement.lang = language;
  document.title = `${content.name} — ${text.title}`;
  document.querySelector('.identity span').textContent = text.identity;
  document.querySelector('nav').setAttribute('aria-label', text.navLabel);
  navigation.forEach(link => { link.textContent = text.nav[link.hash.slice(1)]; });
  document.querySelector('#forside .eyebrow').textContent = text.homeEyebrow;
  document.querySelector('.intro').textContent = text.intro;
  document.querySelector('.hero-button').firstChild.textContent = text.heroLink;
  document.querySelectorAll('.home-footer span').forEach((item, index) => { item.textContent = text.footer[index]; });
  document.querySelector('#vaerker .eyebrow').textContent = text.worksEyebrow;
  setHeading('#works-title', text.works);
  tabs.setAttribute('aria-label', text.chooseWork);
  document.querySelector('#bio .eyebrow').textContent = text.bioEyebrow;
  setHeading('#bio-title', text.bioTitle);
  document.querySelector('#kontakt .eyebrow').textContent = text.contactEyebrow;
  setHeading('#contact-title', text.contact);
  document.querySelector('.contact-intro').textContent = text.contactIntro;
  ['firstName', 'lastName', 'nationality', 'phone', 'email', 'message'].forEach((name, index) => {
    document.querySelector(`[name="${name}"]`).parentElement.firstChild.textContent = text.fields[index];
  });
  document.querySelector('[name="message"]').placeholder = text.placeholder;
  document.querySelector('.response-time').textContent = text.responseTime;
  document.querySelector('#email-note').textContent = text.emailNote;
  document.querySelector('#contact-form .button').firstChild.textContent = text.send;
  cvButton.href = language === 'en'
    ? 'assets/files/Jens_Korsgaard_CV_EN.pdf'
    : 'assets/files/Jens_Korsgaard_CV.pdf';
  cvButton.setAttribute('aria-label', language === 'en' ? 'Open Jens Korsgaard’s CV as a PDF' : 'Åbn Jens Korsgaards CV som PDF');
  const form = document.querySelector('#contact-form');
  const submitButton = form.querySelector('[type="submit"]');
  submitButton.firstChild.textContent = form.dataset.sent === 'true' ? text.thankYou : text.send;
  languageToggle.textContent = language === 'da' ? 'EN' : 'DA';
  languageToggle.setAttribute('aria-label', language === 'da' ? 'Switch language to English' : 'Skift sprog til dansk');
  document.dispatchEvent(new CustomEvent('portfolio-languagechange'));
  showWork(activeWorkIndex);
}
showWork(0);
applyLanguage();
languageToggle.addEventListener('click', () => {
  window.portfolioAudio.playLanguageCue();
  language = language === 'da' ? 'en' : 'da';
  applyLanguage();
});
const contactForm = document.querySelector('#contact-form');
const contactSubmitButton = contactForm.querySelector('[type="submit"]');
contactSubmitButton.addEventListener('click', () => {
  if (!contactForm.checkValidity()) window.portfolioAudio.playWorkHoverCue();
});
contactForm.addEventListener('submit', event => {
  event.preventDefault();
  const form = event.currentTarget;
  if (!form.reportValidity()) {
    window.portfolioAudio.playWorkHoverCue();
    return;
  }
  window.portfolioAudio.playSentCue();
  const text = copy[language];
  const submitButton = form.querySelector('[type="submit"]');
  const values = new FormData(form);
  const fields = ['firstName', 'lastName', 'nationality', 'phone', 'email', 'message'];
  const body = fields.map((field, index) => `${text.fields[index]}: ${values.get(field)}`).join('\n\n');
  const subject = language === 'en' ? 'Sound design enquiry' : 'Forespørgsel om lyddesign';
  const mailto = new URL('mailto:jensbkorsgaard@gmail.com');
  mailto.searchParams.set('subject', subject);
  mailto.searchParams.set('body', body);
  window.location.assign(mailto.href.replace(/\+/g, '%20'));
  submitButton.firstChild.textContent = text.thankYou;
  submitButton.querySelector('span')?.remove();
  form.dataset.sent = 'true';
});
