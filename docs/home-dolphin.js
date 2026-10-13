(() => {
  function mountDolphin() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    const left = [...hero.children].find(el => !el.classList.contains('hero-video-layer') && !el.classList.contains('heroart'));
    if (!left || left.querySelector('.dolphin-mascot')) return;
    const img = document.createElement('img');
    img.className = 'dolphin-mascot';
    img.src = 'dolphin-logo.svg';
    img.alt = 'Chadwick dolphin mascot';
    img.decoding = 'async';
    left.appendChild(img);
  }

  const app = document.querySelector('#app');
  if (app) new MutationObserver(mountDolphin).observe(app, {childList:true, subtree:true});
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountDolphin, {once:true});
  else mountDolphin();
})();
