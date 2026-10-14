  const leaderboardCategories = [
    {label:'Top KDA', key:'kda', format:p=>p.games?(p.deaths?n(p.kda,2):'Perfect'):'—'},
    {label:'Top Kills', key:'kills', format:p=>n(p.kills)},
    {label:'Top Assists', key:'assists', format:p=>n(p.assists)},
    {label:'Top Avg Damage', key:'damage', format:p=>p.damage==null?'N/A':n(p.damage)+' / min'},
    {label:'Top Avg Gold', key:'gold', format:p=>p.gold==null?'N/A':n(p.gold)+' / min'},
    {label:'Top CS', key:'cs', format:p=>p.cs==null?'N/A':n(p.cs,2)+' / min'},
    {label:'Top Avg Kill Contribution', key:'kp', format:p=>percent(p.kp,2)},
    {label:'Top Vision', key:'vision', format:p=>p.vision==null?'N/A':n(p.vision,2)+' / min'},
    {label:'Top CC', key:'cc', format:p=>n(p.cc)},
    {label:'Most POM awards', key:'pom', format:p=>n(p.pom)}
  ];

  function rankedPlayers(key) {
    return players().filter(p=>p[key]!=null).sort((a,b) => {
      const av = Number(a[key]);
      const bv = Number(b[key]);
      if (bv !== av) return bv - av;
      return a.name.localeCompare(b.name);
    }).slice(0,3);
  }

  // Shuffle once per page load; live updates refresh winners without shuffling cards.
  const standoutOrder = [...leaderboardCategories];
  for (let i = standoutOrder.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [standoutOrder[i], standoutOrder[j]] = [standoutOrder[j], standoutOrder[i]];
  }
  function randomSeasonStandoutCards() {
    return standoutOrder
      .filter(category => !(category.key === 'cc' && !activeSeason.hasCC))
      .map(category => ({category, first:rankedPlayers(category.key)[0]}))
      .filter(item => item.first)
      .slice(0,3)
      .map(({category, first}) => `<a class="leader" href="${link('player',first.name)}"><small>${esc(category.label)} ↗</small><h3>${displayName(first.name)}</h3><strong>${category.format(first)}</strong></a>`)
      .join('');
  }

  function displayName(name) {
    return esc(String(name).split('#')[0]);
  }

  function leaderboardCard(category) {
    if(category.key==='cc'&&!activeSeason.hasCC)return `<section class="leaderboard-card"><div class="leaderboard-card-title">Top CC</div><div class="empty"><strong>N/A</strong><p>Not recorded this season</p></div></section>`;
    const top = rankedPlayers(category.key);
    if (!top.length) return '';
    const first = top[0];
    const others = top.slice(1);
    return `<section class="leaderboard-card">
      <div class="leaderboard-card-title">${esc(category.label)}</div>
      <div class="leaderboard-first">
        <span class="leaderboard-crown" aria-label="First place">♛</span>
        <a class="leaderboard-winner" href="${link('player',first.name)}">
          <div class="leaderboard-winner-copy">
            <span class="leaderboard-rank-label">1ST</span>
            <strong>${displayName(first.name)}</strong>
            <span class="leaderboard-value">${category.format(first)}</span>
          </div>
        </a>
      </div>
      <div class="leaderboard-places">
        ${others.map((p,i)=>`<div class="leaderboard-place"><span class="leaderboard-place-rank">${i+2}</span><span class="leaderboard-place-name">${displayName(p.name)}</span><strong>${category.format(p)}</strong></div>`).join('')}
      </div>
    </section>`;
  }

  function renderLeaderboard() {
    app.innerHTML = `<div class="eyebrow">League leaders</div>
      <div class="leaderboard-heading"><div><h1>Leaderboard</h1><p class="sub">Top three players across ten live season categories.</p></div></div>
      <div class="leaderboard-grid">${leaderboardCategories.map(leaderboardCard).join('')}</div>
      <div class="note">Updates from the same live match data as the rest of the site. Rankings refresh whenever Google Sheets refreshes.</div>`;
  }

  const leaderboardBaseRoute = route;
  route = function() {
    const [page='overview'] = location.hash.slice(1).split('/');
    if (page !== 'leaderboard') return leaderboardBaseRoute();
    document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.hash==='#leaderboard'));
    renderLeaderboard();
    window.scrollTo(0,0);
  };

// Random category cards are retained but paused.
function seasonStandoutCards(){return powerStandoutCards();}
