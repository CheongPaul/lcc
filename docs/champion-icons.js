// Champion list icon renderer. Uses repo-cached Riot Data Dragon icons.
(() => {
  const iconHtml = (name) => {
    const id = championArt[name];
    if (!id) return `<div class="champIcon champIcon-fallback">${esc(name.slice(0,2).toUpperCase())}</div>`;
    const src = `images/champion-icons/${encodeURIComponent(id)}.png`;
    return `<div class="champIcon"><img src="${src}" alt="" loading="lazy" decoding="async" onerror="this.parentElement.classList.add('champIcon-fallback');this.parentElement.textContent='${esc(name.slice(0,2).toUpperCase())}'"></div>`;
  };

  // Override the original text-initial champion row renderer after app.js loads.
  champRows = function champRows(list) {
    return list.map(p => `<a class="champRow" href="${link('champion',p.name)}">${iconHtml(p.name)}<div><b>${esc(p.name)}</b><small>${p.games ? p.games+' picks · '+kda(p)+' KDA' : 'Not played yet'}</small></div><span class="win">${p.games ? n(p.wr,0)+'%' : '—'} <small>win rate</small></span></a>`).join('');
  };
})();
