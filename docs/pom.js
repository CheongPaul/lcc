// Player of Match (POM): highest raw per-game Power score on the winning team.
(() => {
  let cachedRows = null;
  let cachedAwards = null;

  function gamePowerScores(records = rows) {
    const rolePools = new Map();
    for (const r of records) {
      if (!['Top','Jungle','Mid','ADC','Support'].includes(r.lane)) continue;
      if (!rolePools.has(r.lane)) rolePools.set(r.lane, POWER_METRICS.map(() => []));
      POWER_METRICS.forEach((metric, i) => {
        const value = metric.value(r);
        if (Number.isFinite(value)) rolePools.get(r.lane)[i].push(value);
      });
    }
    for (const pools of rolePools.values()) for (const pool of pools) pool.sort((a,b) => a-b);

    return records.map(r => {
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
      return { record:r, score:weight > 0 ? score / weight : null };
    });
  }

  function tieBreakValue(record) {
    const kda = (Number(record.kills)||0) + (Number(record.assists)||0);
    const deaths = Math.max(Number(record.deaths)||0, 1);
    return {
      kda:kda/deaths,
      dpm:Number(record.dpm)||0,
      kills:Number(record.kills)||0,
      assists:Number(record.assists)||0
    };
  }

  function pomAwards() {
    if (cachedRows === rows && cachedAwards) return cachedAwards;
    const byMatch = new Map();
    for (const item of gamePowerScores(rows)) {
      const r = item.record;
      if (!r.match || !r.win || !Number.isFinite(item.score)) continue;
      if (!byMatch.has(r.match)) byMatch.set(r.match, []);
      byMatch.get(r.match).push(item);
    }

    const winners = new Map();
    const counts = new Map();
    for (const [match, candidates] of byMatch) {
      candidates.sort((a,b) => {
        if (b.score !== a.score) return b.score - a.score;
        const av = tieBreakValue(a.record), bv = tieBreakValue(b.record);
        if (bv.kda !== av.kda) return bv.kda - av.kda;
        if (bv.dpm !== av.dpm) return bv.dpm - av.dpm;
        if (bv.kills !== av.kills) return bv.kills - av.kills;
        if (bv.assists !== av.assists) return bv.assists - av.assists;
        return String(a.record.player).localeCompare(String(b.record.player));
      });
      const winner = candidates[0];
      if (!winner) continue;
      winners.set(match, { ...winner, player:winner.record.player });
      counts.set(winner.record.player, (counts.get(winner.record.player) || 0) + 1);
    }

    cachedRows = rows;
    cachedAwards = { winners, counts };
    return cachedAwards;
  }

  window.pomWinnerForMatch = match => pomAwards().winners.get(String(match)) || null;
  window.pomAwardCount = player => pomAwards().counts.get(player) || 0;

  const baseStats = stats;
  stats = function(list, name) {
    return { ...baseStats(list, name), pom:pomAwardCount(name) };
  };

  const baseTable = table;
  table = function(list) {
    const html = baseTable(list);
    const holder = document.createElement('div');
    holder.innerHTML = html;
    const powerButton = holder.querySelector('th button[data-sort="power"]');
    const powerHeader = powerButton?.closest('th');
    if (powerHeader) {
      const th = document.createElement('th');
      th.innerHTML = `<button data-sort="pom">POM${sortKey==='pom'?(sortDir<0?' ↓':' ↑'):''}</button>`;
      powerHeader.insertAdjacentElement('afterend', th);
    }
    holder.querySelectorAll('tbody tr').forEach(row => {
      const playerLink = row.querySelector('a[href^="#player/"]');
      if (!playerLink || row.children.length < 3) return;
      let name;
      try { name = decodeURIComponent(playerLink.getAttribute('href').slice('#player/'.length)); }
      catch { return; }
      const td = document.createElement('td');
      td.className = 'num pom-count';
      td.textContent = String(pomAwardCount(name));
      row.children[2].insertAdjacentElement('afterend', td);
    });
    return holder.innerHTML;
  };

  const baseDetail = detail;
  detail = function(type, name) {
    baseDetail(type, name);
    if (type !== 'player') return;
    const impact = app.querySelector('.impact-stats');
    if (impact) impact.insertAdjacentHTML('beforeend', stat('POM awards', pomAwardCount(name)));
  };
})();
