(() => {
  const VIDEO_IDS = ['0ctbiMWxtPU', 'Z3TqiIJMalA'];
  let player = null;
  let currentId = null;
  let queue = [];
  let apiRequested = false;

  function shuffle(ids) {
    const a = [...ids];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (currentId && a.length > 1 && a[0] === currentId) {
      [a[0], a[1]] = [a[1], a[0]];
    }
    return a;
  }

  function nextVideoId() {
    if (!queue.length) queue = shuffle(VIDEO_IDS);
    const next = queue.shift();
    currentId = next;
    return next;
  }

  function ensureApi() {
    if (window.YT && window.YT.Player) {
      mountPlayer();
      return;
    }
    if (apiRequested) return;
    apiRequested = true;
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (typeof previous === 'function') previous();
      mountPlayer();
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    document.head.appendChild(script);
  }

  function getMount() {
    return document.querySelector('.hero .hero-video-mount');
  }

  function hideInitialUiMask() {
    const mask = document.querySelector('.hero-video-ui-mask');
    if (!mask) return;
    setTimeout(() => {
      mask.classList.add('is-hidden');
      setTimeout(() => mask.remove(), 500);
    }, 5600);
  }

  function mountPlayer() {
    const mount = getMount();
    if (!mount || !(window.YT && window.YT.Player)) return;

    if (player && typeof player.destroy === 'function') {
      try { player.destroy(); } catch (_) {}
      player = null;
    }

    player = new YT.Player(mount, {
      videoId: nextVideoId(),
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        playsinline: 1,
        rel: 0,
        mute: 1
      },
      events: {
        onReady: (event) => {
          event.target.mute();
          event.target.playVideo();
          hideInitialUiMask();
        },
        onStateChange: (event) => {
          if (event.data === YT.PlayerState.ENDED) {
            event.target.loadVideoById(nextVideoId());
            event.target.mute();
          }
        },
        onError: (event) => {
          try {
            event.target.loadVideoById(nextVideoId());
            event.target.mute();
          } catch (_) {}
        }
      }
    });
  }

  function decorateHero() {
    const hero = document.querySelector('.hero');
    if (!hero || hero.dataset.videoPlaylistReady === '1') return;
    hero.dataset.videoPlaylistReady = '1';

    const layer = document.createElement('div');
    layer.className = 'hero-video-layer';
    layer.setAttribute('aria-hidden', 'true');

    const mount = document.createElement('div');
    mount.className = 'hero-video-mount';
    layer.appendChild(mount);

    const mask = document.createElement('div');
    mask.className = 'hero-video-ui-mask';
    layer.appendChild(mask);

    hero.prepend(layer);
    ensureApi();
  }

  const observer = new MutationObserver(() => decorateHero());
  const app = document.querySelector('#app');
  if (app) observer.observe(app, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', decorateHero, { once: true });
  } else {
    decorateHero();
  }
})();
