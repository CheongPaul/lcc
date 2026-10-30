// Player of Match (POM): highest raw per-game Power score on the winning team.
(() => {
  let cachedRows = null;
  let cachedAwards = null;

  function gamePowerScores(records = rows) {
    records = rankedRecords(records);
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

  window.gamePowerScores = gamePowerScores;

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

  function markPlayerPomHistory(name) {
    const heading = [...app.querySelectorAll('.sectionhead h2')].find(h => h.textContent.trim() === 'Match history');
    const history = heading?.closest('.sectionhead')?.nextElementSibling;
    if (!history) return;
    history.querySelectorAll('tbody tr').forEach(row => {
      const matchLink = row.querySelector('td:first-child a[href^="#match/"]');
      if (!matchLink) return;
      let match;
      try { match = decodeURIComponent(matchLink.getAttribute('href').slice('#match/'.length)); }
      catch { return; }
      const pom = pomWinnerForMatch(match);
      if (!pom || pom.player !== name) return;
      row.classList.add('profile-pom-row');
      const badge = document.createElement('span');
      badge.className = 'profile-pom-badge';
      badge.textContent = 'POM';
      badge.title = 'Player of Match';
      matchLink.insertAdjacentElement('afterend', badge);
    });
  }

  const baseDetail = detail;
  detail = function(type, name) {
    baseDetail(type, name);
    if (type !== 'player' || isProfileOnly(name)) return;
    const impact = app.querySelector('.impact-stats');
    if (impact) impact.insertAdjacentHTML('beforeend', stat('POM awards', pomAwardCount(name)));
    markPlayerPomHistory(name);
  };

  function latestPomCard() {
    const matchIds = [...new Set(rows.map(r => String(r.match || '')).filter(Boolean))].sort().reverse();
    const match = matchIds.find(id => pomWinnerForMatch(id));
    if (!match) return '';
    const pom = pomWinnerForMatch(match);
    const r = pom.record;
    const champId = championArt[r.champion];
    const local = champId ? `images/champions/${encodeURIComponent(champId)}.jpg` : '';
    const community = champId ? `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/${encodeURIComponent(champId.toLowerCase())}/skins/skin0/images/${encodeURIComponent(champId.toLowerCase())}_splash_centered_0.jpg` : '';
    const riot = champId ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${encodeURIComponent(champId)}_0.jpg` : '';
    const art = champId ? `<img class="latest-pom-bg" src="${local}" alt="" aria-hidden="true" data-community="${community}" data-riot="${riot}" onerror="if(!this.dataset.triedCommunity){this.dataset.triedCommunity='1';this.src=this.dataset.community}else if(!this.dataset.triedRiot){this.dataset.triedRiot='1';this.src=this.dataset.riot}else{this.onerror=null;this.style.display='none'}">` : '';
    const kp = Number.isFinite(Number(r.kp)) ? `${n(Number(r.kp)*100,1)}%` : 'N/A';
    return `<section class="latest-pom-section"><div class="sectionhead"><h2>Recent match POM</h2><span class="pill">${esc(matchLabel(match))}</span></div><article class="latest-pom-card">${art}<div class="latest-pom-shade"></div><div class="latest-pom-content"><div class="latest-pom-copy"><div class="eyebrow">PLAYER OF MATCH</div><h3><a href="${link('player',r.player)}">${esc(String(r.player).split('#')[0])}</a></h3><div class="latest-pom-champion"><a href="${link('champion',r.champion)}">${esc(r.champion)}</a><span>·</span><span>${esc(r.lane)}</span></div><a class="latest-pom-match" href="${link('match',match)}">Open match ↗</a></div><div class="latest-pom-stats"><div class="latest-pom-stat"><span>K / D / A</span><strong>${n(r.kills)} / ${n(r.deaths)} / ${n(r.assists)}</strong></div><div class="latest-pom-stat"><span>Kill participation</span><strong>${kp}</strong></div><div class="latest-pom-stat"><span>Damage</span><strong>${n(r.damage)}</strong></div><div class="latest-pom-stat"><span>CS</span><strong>${n(r.cs)}</strong></div><div class="latest-pom-stat power"><span>Game power</span><strong>${n(pom.score,1)}</strong></div></div></div></article></section>`;
  }

  const baseOverview = overview;
  overview = function() {
    baseOverview();
    const html = latestPomCard();
    if (!html) return;
    const anchor = app.querySelector('.matchup-section') || app.querySelector('.note');
    const bottom = app.querySelector('.bottomgrid');
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
    else if (bottom) bottom.insertAdjacentHTML('beforebegin', html);
    else app.insertAdjacentHTML('beforeend', html);
  };
})();
