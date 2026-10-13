// Adds cached Riot profile icons to player links/cards/profile pages.
(() => {
  let icons = {};
  let ready = false;

  function playerFromHref(href) {
    if (!href || !href.startsWith('#player/')) return null;
    try { return decodeURIComponent(href.slice('#player/'.length)); }
    catch { return null; }
  }

  function imageFor(player) {
    const entry = icons[player];
    return entry?.image || null;
  }

  function makeAvatar(player, className='player-avatar-inline') {
    const src = imageFor(player);
    if (!src) return null;
    const img = document.createElement('img');
    img.className = className;
    img.src = src;
    img.alt = `${player} profile icon`;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.onerror = () => img.remove();
    return img;
  }

  function decoratePlayerLinks(root=document) {
    if (!ready) return;
    root.querySelectorAll?.('a[href^="#player/"]').forEach(link => {
      if (link.dataset.playerIconApplied === '1') return;
      const player = playerFromHref(link.getAttribute('href'));
      if (!player || !imageFor(player)) return;

      if (link.classList.contains('card')) {
        const avatar = makeAvatar(player, 'player-avatar-card');
        if (avatar) link.insertBefore(avatar, link.firstChild);
      } else {
        const avatar = makeAvatar(player, 'player-avatar-inline');
        if (avatar) link.insertBefore(avatar, link.firstChild);
      }
      link.dataset.playerIconApplied = '1';
    });
  }

  function decorateProfile() {
    if (!ready) return;
    const hash = location.hash || '';
    if (!hash.startsWith('#player/')) return;
    let player;
    try { player = decodeURIComponent(hash.slice('#player/'.length)); }
    catch { return; }
    if (!imageFor(player)) return;

    const content = document.querySelector('.profile-content');
    if (!content || content.dataset.playerIconApplied === '1') return;
    const heading = content.querySelector('h1');
    if (!heading) return;

    const avatar = makeAvatar(player, 'player-avatar-profile');
    if (!avatar) return;
    heading.insertAdjacentElement('beforebegin', avatar);
    content.dataset.playerIconApplied = '1';
  }

  function decorate(root=document) {
    decoratePlayerLinks(root);
    decorateProfile();
  }

  const observer = new MutationObserver(mutations => {
    if (!ready) return;
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType === Node.ELEMENT_NODE) decorate(node);
      }
    }
    decorateProfile();
  });

  async function init() {
    try {
      const response = await fetch('player-icons.json', {cache:'no-store'});
      if (!response.ok) return;
      icons = await response.json();
      ready = true;
      decorate(document);
      observer.observe(document.body, {subtree:true, childList:true});
      addEventListener('hashchange', () => requestAnimationFrame(() => decorate(document)));
    } catch (err) {
      console.warn('Player profile icons unavailable:', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
