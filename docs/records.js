// Season single-game records.
(() => {
  function maxRecord(key) {
    const eligible = rows.filter(r => Number.isFinite(Number(r[key])));
    if (!eligible.length) return { value:null, rows:[] };
    const value = Math.max(...eligible.map(r => Number(r[key])));
    return { value, rows:eligible.filter(r => Number(r[key]) === value) };
  }

  function matchDurationRecord(mode='min') {
    const byMatch = new Map();
    for (const r of rows) {
      const seconds = Number(r.seconds);
      if (!r.match || !Number.isFinite(seconds) || seconds <= 0) continue;
      if (!byMatch.has(r.match)) byMatch.set(r.match, { id:r.match, seconds, rows:[] });
      byMatch.get(r.match).rows.push(r);
      byMatch.get(r.match).seconds = seconds;
    }
    const list = [...byMatch.values()];
    if (!list.length) return { value:null, matches:[] };
    const value = mode === 'max'
      ? Math.max(...list.map(m => m.seconds))
      : Math.min(...list.map(m => m.seconds));
    return { value, matches:list.filter(m => m.seconds === value) };
  }

  function recordHolder(r) {
    return `<div class="record-holder"><a class="record-player" href="${link('player',r.player)}">${parts(r.player)}</a><span class="record-meta"><a href="${link('champion',r.champion)}">${esc(r.champion)}</a> · <a href="${link('match',r.match)}">Match ${esc(r.match)} ↗</a></span></div>`;
  }

  function championBackground(record) {
    const champion = record.rows?.[0]?.champion;
    const id = champion && championArt[champion];
    if (!id) return '';

    const local = `images/champions/${encodeURIComponent(id)}.jpg`;
    const cdragonId = id.toLowerCase();
    const community = `https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/assets/characters/${encodeURIComponent(cdragonId)}/skins/skin0/images/${encodeURIComponent(cdragonId)}_splash_centered_0.jpg`;
    const riot = `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${encodeURIComponent(id)}_0.jpg`;

    return `<img class="record-bg" src="${local}" alt="" aria-hidden="true" data-community="${community}" data-riot="${riot}" onerror="if(!this.dataset.triedCommunity){this.dataset.triedCommunity='1';this.src=this.dataset.community}else if(!this.dataset.triedRiot){this.dataset.triedRiot='1';this.src=this.dataset.riot}else{this.onerror=null;this.style.display='none'}">`;
  }

  function playerRecordCard(title, eyebrow, record, formatter=n) {
    const body = record.rows.length
      ? record.rows.map(recordHolder).join('')
      : '<div class="record-empty">No recorded data.</div>';
    const bg = championBackground(record);
    return `<article class="record-card${bg?' has-champion-art':''}">${bg}<div class="record-card-content"><div class="record-eyebrow">${eyebrow}</div><h2>${title}</h2><strong class="record-value">${record.value==null?'—':formatter(record.value)}</strong>${body}</div></article>`;
  }

  function matchRecordCard(title, record) {
    const body = record.matches.length ? record.matches.map(m => {
      const players = m.rows.length;
      return `<div class="record-holder"><a class="record-player" href="${link('match',m.id)}">Match ${esc(m.id)} ↗</a><span class="record-meta">${date(m.id)} · ${players} players</span></div>`;
    }).join('') : '<div class="record-empty">No recorded data.</div>';
    return `<article class="record-card record-card-wide"><div class="record-card-content"><div class="record-eyebrow">MATCH RECORD</div><h2>${title}</h2><strong class="record-value">${record.value==null?'—':duration(record.value)}</strong>${body}</div></article>`;
  }

  function renderRecords() {
    const kills = maxRecord('kills');
    const deaths = maxRecord('deaths');
    const assists = maxRecord('assists');
    const damage = maxRecord('damage');
    const cs = maxRecord('cs');
    const cc = activeSeason.hasCC ? maxRecord('cc') : { value:null, rows:[] };
    const fastest = matchDurationRecord('min');
    const longest = matchDurationRecord('max');
    app.innerHTML = `<div class="eyebrow">Season records</div><h1>Record book</h1><p class="sub"><span>The biggest single-game performances and match-duration records.</span> · <span>Season ${activeSeason.label}</span></p><div class="records-grid">${playerRecordCard('Most kills in one game','COMBAT RECORD',kills)}${playerRecordCard('Most deaths in one game','DEATH RECORD',deaths)}${playerRecordCard('Most assists in one game','TEAMPLAY RECORD',assists)}${playerRecordCard('Most CC in one game','CONTROL RECORD',cc)}${playerRecordCard('Most damage in one game','DAMAGE RECORD',damage)}${playerRecordCard('Most CS in one game','FARM RECORD',cs)}${matchRecordCard('Fastest ended game',fastest)}${matchRecordCard('Longest game',longest)}</div>`;
  }

  const baseRoute = route;
  route = function() {
    const page = (location.hash.slice(1).split('/')[0] || 'overview');
    if (page !== 'records') return baseRoute();
    updateSeasonContext();
    document.querySelectorAll('nav a').forEach(a => a.classList.toggle('active', a.hash === '#records'));
    renderRecords();
    window.scrollTo(0,0);
  };
})();
