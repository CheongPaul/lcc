(() => {
  const baseRoute = route;

  const leaderboardCategories = [
    {label:'Top KDA', key:'kda', format:p=>p.games?(p.deaths?n(p.kda,2):'Perfect'):'—'},
    {label:'Top Kills', key:'kills', format:p=>n(p.kills)},
    {label:'Top Assists', key:'assists', format:p=>n(p.assists)},
    {label:'Top Avg Damage', key:'damage', format:p=>n(p.damage)},
    {label:'Top Avg Gold', key:'gold', format:p=>n(p.gold)},
    {label:'Top CS', key:'cs', format:p=>n(p.cs,2)},
    {label:'Top Avg Kill Contribution', key:'kp', format:p=>n(p.kp,2)+'%'},
    {label:'Top Vision', key:'vision', format:p=>n(p.vision,2)},
    {label:'Top CC', key:'cc', format:p=>n(p.cc)}
  ];

  function rankedPlayers(key) {
    return [...players()].sort((a,b) => {
      const av = Number(a[key]);
      const bv = Number(b[key]);
      if (bv !== av) return bv - av;
      return a.name.localeCompare(b.name);
    }).slice(0,3);
  }

  function displayName(name) {
    return esc(String(name).split('#')[0]);
  }

  function leaderboardCard(category) {
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
      <div class="leaderboard-heading"><div><h1>Leaderboard</h1><p class="sub">Top three players across nine live season categories.</p></div></div>
      <div class="leaderboard-grid">${leaderboardCategories.map(leaderboardCard).join('')}</div>
      <div class="note">Updates from the same live match data as the rest of the site. Rankings refresh whenever Google Sheets refreshes.</div>`;
  }

  route = function() {
    const [page='overview'] = location.hash.slice(1).split('/');
    if (page !== 'leaderboard') return baseRoute();
    document.querySelectorAll('nav a').forEach(a=>a.classList.toggle('active',a.hash==='#leaderboard'));
    renderLeaderboard();
    window.scrollTo(0,0);
  };
})();
