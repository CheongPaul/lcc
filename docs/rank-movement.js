// Add previous-matchday power-rank movement directly to the 10-player stats table.
(() => {
  const movementMarkup = value => {
    if (value == null) return '<span class="leaderboard-rank-move new" title="No previous matchday">—</span>';
    if (value > 0) return `<span class="leaderboard-rank-move up" title="Up ${value} since previous matchday">▲${value}</span>`;
    if (value < 0) return `<span class="leaderboard-rank-move down" title="Down ${Math.abs(value)} since previous matchday">▼${Math.abs(value)}</span>`;
    return '<span class="leaderboard-rank-move same" title="No rank change">—</span>';
  };

  if (typeof table !== 'function') return;
  const baseTable = table;

  table = function(list) {
    const html = baseTable(list);
    if (typeof sortKey !== 'undefined' && sortKey !== 'power') return html;
    if (typeof powerRankings !== 'function' || typeof powerMatchdayComparison !== 'function' || typeof rankChange !== 'function') return html;

    const holder = document.createElement('div');
    holder.innerHTML = html;
    const currentByName = new Map(powerRankings().map(p => [p.name, p]));
    const comparison = powerMatchdayComparison();

    holder.querySelectorAll('tbody tr').forEach(row => {
      const rankCell = row.querySelector('td.rank');
      const playerLink = row.querySelector('a[href^="#player/"]');
      if (!rankCell || !playerLink) return;

      let name;
      try { name = decodeURIComponent(playerLink.getAttribute('href').slice('#player/'.length)); }
      catch { return; }

      const current = currentByName.get(name);
      const previous = comparison.previousByName.get(name);
      const delta = current ? rankChange(current, previous) : null;
      rankCell.insertAdjacentHTML('beforeend', movementMarkup(delta));
    });

    return holder.innerHTML;
  };
})();
