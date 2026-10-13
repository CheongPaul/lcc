// Add previous-matchday power-rank movement to the 10-player stats table.
(() => {
  const movementMarkup = value => {
    if (value == null) return '<span class="leaderboard-rank-move new" title="No previous matchday">—</span>';
    if (value > 0) return `<span class="leaderboard-rank-move up" title="Up ${value} since previous matchday">▲${value}</span>`;
    if (value < 0) return `<span class="leaderboard-rank-move down" title="Down ${Math.abs(value)} since previous matchday">▼${Math.abs(value)}</span>`;
    return '<span class="leaderboard-rank-move same" title="No rank change">—</span>';
  };

  function decorateRankTable() {
    const table = document.querySelector('#ranktable table');
    if (!table || typeof powerRankings !== 'function' || typeof powerMatchdayComparison !== 'function') return;

    // Rank movement is specifically a power-ranking comparison, so only show it
    // while the table itself is sorted by Power score.
    if (typeof sortKey !== 'undefined' && sortKey !== 'power') {
      table.querySelectorAll('.leaderboard-rank-move').forEach(el => el.remove());
      return;
    }

    const currentByName = new Map(powerRankings().map(p => [p.name, p]));
    const comparison = powerMatchdayComparison();

    table.querySelectorAll('tbody tr').forEach(row => {
      const rankCell = row.querySelector('td.rank');
      const playerLink = row.querySelector('a[href^="#player/"]');
      if (!rankCell || !playerLink || rankCell.querySelector('.leaderboard-rank-move')) return;

      let name;
      try { name = decodeURIComponent(playerLink.getAttribute('href').slice('#player/'.length)); }
      catch { return; }

      const current = currentByName.get(name);
      const previous = comparison.previousByName.get(name);
      const delta = current && typeof rankChange === 'function' ? rankChange(current, previous) : null;
      rankCell.insertAdjacentHTML('beforeend', movementMarkup(delta));
    });
  }

  const observer = new MutationObserver(() => requestAnimationFrame(decorateRankTable));

  function init() {
    const app = document.querySelector('#app');
    if (app) observer.observe(app, {childList:true, subtree:true});
    decorateRankTable();
    addEventListener('hashchange', () => requestAnimationFrame(decorateRankTable));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, {once:true});
  else init();
})();
