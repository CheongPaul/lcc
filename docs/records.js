// Season single-game records.
(() => {
  function maxRecord(key) {
    const eligible = rows.filter(r => Number.isFinite(Number(r[key])));
    if (!eligible.length) return { value:null, rows:[] };
    const value = Math.max(...eligible.map(r => Number(r[key])));
    return { value, rows:eligible.filter(r => Number(r[key]) === value) };
  }

  function fastestMatchRecord() {
    const byMatch = new Map();
    for (const r of rows) {
      const seconds = Number(r.seconds);
      if (!r.match || !Number.isFinite(seconds) || seconds <= 0) continue;
      if (!byMatch.has(r.match)) byMatch.set(r.match, { id:r.match, seconds, rows:[] });
      byMatch.get(r.match).rows.push(r);
      if (seconds < byMatch.get(r.match).seconds) byMatch.get(r.match).seconds = seconds;
    }
    const list = [...byMatch.values()];
    if (!list.length) return { value:null, matches:[] };
    const value = Math.min(...list.map(m => m.seconds));
    return { value, matches:list.filter(m => m.seconds === value) };
  }

  function recordHolder(r) {
    return `<div class="record-holder"><a class="record-player" href="${link('player',r.player)}">${parts(r.player)}</a><span class="record-meta"><a href="${link('champion',r.champion)}">${esc(r.champion)}</a> · <a href="${link('match',r.match)}">Match ${esc(r.match)} ↗</a></span></div>`;
  }

  function championBackground(record) {
    const champion = record.rows?.[0]?.champion;
    const id = champion && championArt[champion];
    return id ? `<img class="record-bg" src="https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${encodeURIComponent(id)}_0.jpg" alt="" aria-hidden="true" loading="lazy">` : '';
  }

  function playerRecordCard(title, eyebrow, record, formatter=n) {
    const body = record.rows.length
      ? record.rows.map(recordHolder).join('')
      : '<div class="record-empty">No recorded data.</div>';
    const bg = championBackground(record);
    return `<article class="record-card${bg?' has-champion-art':''}">${bg}<div class="record-card-content"><div class="record-eyebrow">${eyebrow}</div><h2>${title}</h2><strong class="record-value">${record.value==null?'—':formatter(record.value)}</strong>${body}</div></article>`;
  }

  function fastestCard(record) {
    const body = record.matches.length ? record.matches.map(m => {
      const players = m.rows.length;
      return `<div class="record-holder"><a class="record-player" href="${link('match',m.id)}">Match ${esc(m.id)} ↗</a><span class="record-meta">${date(m.id)} · ${players} players</span></div>`;
    }).join('') : '<div class="record-empty">No recorded data.</div>';
    return `<article class="record-card record-card-wide"><div class="record-card-content"><div class="record-eyebrow">MATCH RECORD</div><h2>Fastest ended game</h2><strong class="record-value">${record.value==null?'—':duration(record.value)}</strong>${body}</div></article>`;
  }

  function renderRecords() {
    const kills = maxRecord('kills');
    const assists = maxRecord('assists');
    const damage = maxRecord('damage');
    const cs = maxRecord('cs');
    const fastest = fastestMatchRecord();
    app.innerHTML = `<div class="eyebrow">Season records</div><h1>Record book</h1><p class="sub"><span>The biggest single-game performances and fastest finish.</span> · <span>Season ${activeSeason.label}</span></p><div class="records-grid">${playerRecordCard('Most kills in one game','COMBAT RECORD',kills)}${playerRecordCard('Most assists in one game','TEAMPLAY RECORD',assists)}${playerRecordCard('Most damage in one game','DAMAGE RECORD',damage)}${playerRecordCard('Most CS in one game','FARM RECORD',cs)}${fastestCard(fastest)}</div>`;
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
