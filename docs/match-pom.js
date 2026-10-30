// Decorate match detail scoreboards with per-game Power scores and POM highlight.
(() => {
  function matchGamePowerScores(matchId) {
    const rolePools = new Map();
    for (const r of rankedRecords(rows)) {
      if (!['Top','Jungle','Mid','ADC','Support'].includes(r.lane)) continue;
      if (!rolePools.has(r.lane)) rolePools.set(r.lane, POWER_METRICS.map(() => []));
      POWER_METRICS.forEach((metric, i) => {
        const value = metric.value(r);
        if (Number.isFinite(value)) rolePools.get(r.lane)[i].push(value);
      });
    }
    for (const pools of rolePools.values()) for (const pool of pools) pool.sort((a,b)=>a-b);

    const scores = new Map();
    for (const r of rankedRecords(rows)) {
      if (String(r.match) !== String(matchId)) continue;
      const pools = rolePools.get(r.lane);
      let score = 0, weight = 0;
      if (pools) {
        POWER_METRICS.forEach((metric, i) => {
          const value = metric.value(r), pool = pools[i];
          if (!Number.isFinite(value) || !pool.length) return;
          score += metric.weight * powerPercentile(value, pool);
          weight += metric.weight;
        });
      }
      scores.set(r.player, weight > 0 ? score / weight : null);
    }
    return scores;
  }

  function decorateMatchPage(matchId) {
    const scoreByPlayer = matchGamePowerScores(matchId);
    const pom = typeof pomWinnerForMatch === 'function' ? pomWinnerForMatch(matchId) : null;
    const pomPlayer = pom?.player || pom?.record?.player || null;

    app.querySelectorAll('.tablewrap table').forEach(table => {
      if (table.dataset.matchPowerDecorated === '1') return;
      table.dataset.matchPowerDecorated = '1';
      const headerRow = table.querySelector('thead tr');
      if (!headerRow) return;
      const headers = [...headerRow.children];
      const kdaIndex = headers.findIndex(th => th.textContent.trim() === 'K / D / A');
      const insertAfter = kdaIndex >= 0 ? headers[kdaIndex] : headers[headers.length - 1];
      const th = document.createElement('th');
      th.className = 'match-power-head';
      th.textContent = 'Game power';
      insertAfter.insertAdjacentElement('afterend', th);

      table.querySelectorAll('tbody tr').forEach(row => {
        const playerLink = row.querySelector('a[href^="#player/"]');
        if (!playerLink) return;
        let player;
        try { player = decodeURIComponent(playerLink.getAttribute('href').slice('#player/'.length)); }
        catch { return; }
        const score = scoreByPlayer.get(player);
        const cells = [...row.children];
        const kdaCell = kdaIndex >= 0 ? cells[kdaIndex] : cells[cells.length - 1];
        const td = document.createElement('td');
        td.className = 'match-power-cell num';
        td.innerHTML = Number.isFinite(score) ? `<strong>${n(score,1)}</strong><span>/ 100</span>` : 'N/A';
        kdaCell.insertAdjacentElement('afterend', td);

        if (pomPlayer && player === pomPlayer) {
          row.classList.add('match-pom-row');
          const playerCell = playerLink.closest('td');
          if (playerCell && !playerCell.querySelector('.match-pom-badge')) {
            playerCell.insertAdjacentHTML('beforeend', '<span class="match-pom-badge" title="Player of Match">POM</span>');
          }
        }
      });
    });
  }

  const baseRoute = route;
  route = function() {
    baseRoute();
    const [page='overview', raw=''] = location.hash.slice(1).split('/');
    if (page !== 'match') return;
    let matchId;
    try { matchId = decodeURIComponent(raw); } catch { matchId = raw; }
    if (matchId) decorateMatchPage(matchId);
  };
})();
