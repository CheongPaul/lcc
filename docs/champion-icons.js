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

  // Shared history tables include both match scoreboards and player histories.
  const originalHistoryTable = historyTable;
  historyTable = function(list) {
    let html = originalHistoryTable(list);
    for (const name of new Set(list.map(r => r.champion))) {
      const original = `<a href="${link('champion',name)}">${esc(name)}</a>`;
      html = html.split(original).join(`<a class="match-champion" href="${link('champion',name)}">${iconHtml(name)}<span>${esc(name)}</span></a>`);
    }
    return html;
  };
  const originalMatchCard = matchCard;
  matchCard = function(entry) {
    const lanes = ['Top','Jungle','Mid','ADC','Support'];
    const team = win => entry[1].filter(r => r.win === win)
      .sort((a,b) => lanes.indexOf(a.lane) - lanes.indexOf(b.lane))
      .map(r => `<span class="match-pick" title="${esc(r.player+' · '+r.champion+' · '+r.lane)}" aria-label="${esc(r.champion)}">${iconHtml(r.champion)}</span>`).join('');
    const preview = `<div class="match-picks"><div class="match-picks-team win">${team(1)}</div><span class="match-picks-vs">VS</span><div class="match-picks-team loss">${team(0)}</div></div>`;
    return originalMatchCard(entry).replace(/<\/a>$/, preview+'</a>');
  };
})();
