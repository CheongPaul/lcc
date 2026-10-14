// Local audio only. One player lives outside the page router.
(() => {
  const tracks = [
    'Warriors', 'Legends Never Die', 'RISE', 'Take Over', 'Burn It All Down',
    'STAR WALKIN', 'GODS', 'Heavy Is The Crown', 'Sacrifice', 'Know My Name'
  ].map((title, i) => ({title, src:`songs/${String(i + 1).padStart(2, '0')}.mp3`}));
  const audio = new Audio();
  audio.preload = 'none';
  let savedVolume;
  try { savedVolume = localStorage.getItem('lcc-music-volume'); } catch {}
  audio.volume = savedVolume !== null && savedVolume !== undefined && Number.isFinite(Number(savedVolume))
    ? Math.min(1, Math.max(0, Number(savedVolume))) : 0.3;
  let enabled = true, waitingForGesture = false, bag = [], current = -1, failures = 0, request = 0;
  try { enabled = localStorage.getItem('lcc-music-enabled') !== 'off'; } catch {}
  let section, toggle, slider, output, title, status, next;
  let message = 'off';
  const copy = {
    en:{label:'Background music',hint:'10 songs · shuffled playback',volume:'Volume',next:'Next song',
      off:'Turn on to play music.',loading:'Loading music…',playing:'Playing',paused:'Paused',
      blocked:'Music is ON. Tap anywhere to start playback.',error:'Music unavailable. Check your connection and try again.',
      ready:'Choose music ON to start.'},
    ko:{label:'배경음악',hint:'10곡 · 랜덤 재생',volume:'볼륨',next:'다음 곡',
      off:'음악을 켜면 재생됩니다.',loading:'음악 불러오는 중…',playing:'재생 중',paused:'일시정지',
      blocked:'음악이 켜져 있습니다. 화면을 터치하면 재생됩니다.',error:'음악을 불러오지 못했습니다. 연결을 확인하고 다시 시도해 주세요.',
      ready:'음악을 켜서 시작하세요.'}
  };
  function render() {
    if (!section) return;
    const ko = document.documentElement.lang === 'ko', c = copy[ko ? 'ko' : 'en'];
    section.querySelector('#music-label').textContent = c.label;
    section.querySelector('.music-hint').textContent = c.hint;
    section.querySelector('label').textContent = c.volume;
    toggle.textContent = enabled ? (ko ? '켜짐' : 'ON') : (ko ? '꺼짐' : 'OFF');
    toggle.setAttribute('aria-checked', String(enabled));
    next.textContent = c.next;
    next.disabled = !enabled;
    title.textContent = current < 0 ? c.ready : tracks[current].title;
    status.textContent = c[message];
    output.textContent = `${Math.round(audio.volume * 100)}%`;
  }
  function pick() {
    if (!bag.length) {
      bag = tracks.map((_, i) => i);
      for (let i = bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [bag[i], bag[j]] = [bag[j], bag[i]];
      }
      // Avoid repeating the last track across shuffle cycles.
      if (bag.at(-1) === current) [bag[0], bag[bag.length - 1]] = [bag.at(-1), bag[0]];
    }
    return bag.pop();
  }
  function stop(reason = 'off') {
    enabled = false; waitingForGesture = false; request++; audio.pause(); message = reason; render();
  }
  async function play(change = false) {
    const id = ++request;
    waitingForGesture = false;
    enabled = true;
    if (change || current < 0) { current = pick(); audio.src = tracks[current].src; }
    message = 'loading'; render();
    try {
      await audio.play();
      if (id !== request) return;
      failures = 0; message = 'playing'; render();
    } catch (error) {
      if (id !== request || !enabled) return;
      if (error.name === 'NotAllowedError') { waitingForGesture = true; message = 'blocked'; render(); }
      else if (error.name !== 'AbortError') failed();
    }
  }
  function failed() {
    if (!enabled) return;
    if (++failures >= tracks.length) return stop('error');
    play(true);
  }
  audio.addEventListener('ended', () => { if (enabled) play(true); });
  // Error event covers network failures after play() has already resolved.
  audio.addEventListener('error', failed);
  audio.addEventListener('playing', () => { if (enabled) {message = 'playing'; render();} });
  audio.addEventListener('pause', () => { if (enabled && !audio.ended) {message = 'paused'; render();} });
  function mount() {
    const dialog = document.getElementById('lcc-settings');
    if (!dialog) return false;
    section = document.createElement('section');
    section.className = 'music-settings';
    section.setAttribute('translate', 'no');
    section.innerHTML = `<div class="settings-row"><div><strong id="music-label"></strong><p class="music-hint"></p></div><button type="button" class="push-switch" role="switch" aria-checked="false" aria-labelledby="music-label" id="music-toggle"></button></div><div class="music-volume"><label for="music-volume"></label><input id="music-volume" type="range" min="0" max="100" step="1"><output for="music-volume"></output></div><p class="music-track"></p><div class="music-bottom"><p class="music-status" role="status"></p><button class="btn music-next" type="button"></button></div>`;
    dialog.insertBefore(section, dialog.querySelector('.settings-close'));
    toggle = section.querySelector('#music-toggle'); slider = section.querySelector('input');
    output = section.querySelector('output'); title = section.querySelector('.music-track');
    status = section.querySelector('.music-status'); next = section.querySelector('.music-next');
    slider.value = Math.round(audio.volume * 100);
    toggle.addEventListener('click', () => {
      if (enabled) stop(); else { failures = 0; play(); }
      try { localStorage.setItem('lcc-music-enabled', enabled ? 'on' : 'off'); } catch {}
    });
    next.addEventListener('click', () => { failures = 0; play(true); });
    slider.addEventListener('input', () => {
      audio.volume = Number(slider.value) / 100;
      try { localStorage.setItem('lcc-music-volume', String(audio.volume)); } catch {}
      render();
    });
    new MutationObserver(render).observe(document.documentElement, {attributes:true,attributeFilter:['lang']});
    render(); return true;
  }
  if (!mount()) {
    const observer = new MutationObserver(() => {if (mount()) observer.disconnect();});
    observer.observe(document.body, {childList:true});
  }
  function resumeAfterGesture(event) {
    if (!enabled || !waitingForGesture || event.target?.closest?.('.music-settings')) return;
    play();
  }
  document.addEventListener('click', resumeAfterGesture);
  document.addEventListener('keydown', resumeAfterGesture);
  if (enabled) play();
})();
