// Season single-game records.
(() => {
  const recordsKo = () => localStorage.getItem('lcc-language') === 'ko';
  const rt = (en, ko) => recordsKo() ? ko : en;

  function maxRecord(key) {
    const eligible = rows.filter(r => r[key] != null && r[key] !== '' && Number.isFinite(Number(r[key])));
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
    return `<div class="record-holder"><a class="record-player" href="${link('player',r.player)}">${parts(r.player)}</a><span class="record-meta"><a href="${link('champion',r.champion)}">${esc(r.champion)}</a> · <a href="${link('match',r.match)}">${rt('Match','경기')} ${esc(r.match)} ↗</a></span></div>`;
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

  function playerRecordCard(titleEn, titleKo, eyebrowEn, eyebrowKo, record, formatter=n) {
    const body = record.rows.length
      ? record.rows.map(recordHolder).join('')
      : `<div class="record-empty">${rt('No recorded data.','기록된 데이터가 없습니다.')}</div>`;
    const bg = championBackground(record);
    return `<article class="record-card${bg?' has-champion-art':''}">${bg}<div class="record-card-content"><div class="record-eyebrow">${rt(eyebrowEn,eyebrowKo)}</div><h2>${rt(titleEn,titleKo)}</h2><strong class="record-value">${record.value==null?'—':formatter(record.value)}</strong>${body}</div></article>`;
  }

  function matchRecordCard(titleEn, titleKo, record) {
    const body = record.matches.length ? record.matches.map(m => {
      const players = m.rows.length;
      return `<div class="record-holder"><a class="record-player" href="${link('match',m.id)}">${rt('Match','경기')} ${esc(m.id)} ↗</a><span class="record-meta">${date(m.id)} · ${recordsKo()?`${players}명`:`${players} players`}</span></div>`;
    }).join('') : `<div class="record-empty">${rt('No recorded data.','기록된 데이터가 없습니다.')}</div>`;
    return `<article class="record-card record-card-wide"><div class="record-card-content"><div class="record-eyebrow">${rt('MATCH RECORD','경기 기록')}</div><h2>${rt(titleEn,titleKo)}</h2><strong class="record-value">${record.value==null?'—':duration(record.value)}</strong>${body}</div></article>`;
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

    app.innerHTML = `<div class="eyebrow">${rt('Season records','시즌 기록')}</div><h1>${rt('Record book','기록실')}</h1><p class="sub"><span>${rt('The biggest single-game performances and match-duration records.','한 경기 최고 기록과 경기 시간 기록을 확인하세요.')}</span> · <span>${recordsKo()?`시즌 ${activeSeason.label}`:`Season ${activeSeason.label}`}</span></p><div class="records-grid">${playerRecordCard('Most kills in one game','한 경기 최다 킬','COMBAT RECORD','전투 기록',kills)}${playerRecordCard('Most deaths in one game','한 경기 최다 데스','DEATH RECORD','데스 기록',deaths)}${playerRecordCard('Most assists in one game','한 경기 최다 어시스트','TEAMPLAY RECORD','팀플레이 기록',assists)}${playerRecordCard('Most CC in one game','한 경기 최다 CC','CONTROL RECORD','CC 기록',cc)}${playerRecordCard('Most damage in one game','한 경기 최다 데미지','DAMAGE RECORD','데미지 기록',damage)}${playerRecordCard('Most CS in one game','한 경기 최다 CS','FARM RECORD','파밍 기록',cs)}${matchRecordCard('Fastest ended game','최단 경기',fastest)}${matchRecordCard('Longest game','최장 경기',longest)}</div>`;
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

  // Re-render Records after the global language toggle updates localStorage.
  document.querySelector('#language-toggle')?.addEventListener('click', () => {
    setTimeout(() => {
      if ((location.hash.slice(1).split('/')[0] || 'overview') === 'records') route();
    }, 0);
  });
})();
