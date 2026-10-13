// Adds cached Riot profile icons and solo queue ranks to player links/cards/profile pages.
(() => {
  let icons = {};
  let ready = false;

  function playerFromHref(href) {
    if (!href || !href.startsWith('#player/')) return null;
    try { return decodeURIComponent(href.slice('#player/'.length)); }
    catch { return null; }
  }

  function imageFor(player) {
    const entry = icons[canonicalPlayer(player)];
    return entry?.image || null;
  }

  function soloRankFor(player) {
    const solo = icons[canonicalPlayer(player)]?.soloQueue;
    if (!solo?.tier || !solo?.rank) return 'Unranked';
    const tier = String(solo.tier).charAt(0) + String(solo.tier).slice(1).toLowerCase();
    const lp = Number.isFinite(Number(solo.leaguePoints)) ? ` · ${solo.leaguePoints} LP` : '';
    return `${tier} ${solo.rank}${lp}`;
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

    const content = document.querySelector('.profile-content');
    if (!content) return;

    const heading = content.querySelector('h1');
    if (heading && imageFor(player) && content.dataset.playerIconApplied !== '1') {
      const avatar = makeAvatar(player, 'player-avatar-profile');
      if (avatar) heading.insertAdjacentElement('beforebegin', avatar);
      content.dataset.playerIconApplied = '1';
    }

    const subtitle = content.querySelector('p');
    if (activeSeason.hasCC && subtitle && subtitle.dataset.soloRankApplied !== '1') {
      const role = (subtitle.textContent || '').split(' · ')[0].trim();
      subtitle.textContent = `${role} · Solo Queue: ${soloRankFor(player)}`;
      subtitle.dataset.soloRankApplied = '1';
    }
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
      console.warn('Player Riot data unavailable:', err);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
