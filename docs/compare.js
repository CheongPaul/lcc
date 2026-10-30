// Comparisons share the active season's records and the existing statistics formulas.
function comparisonURL(first, second) {
  const url = new URL(location.href);
  url.searchParams.set('season', seasonKey);
  url.hash = 'compare/' + encodeURIComponent(first) + '/' + encodeURIComponent(second);
  return url.href;
}
function comparisonOptions(selected, excluded='') {
  return players().filter(p=>p.name!==excluded).sort((a,b)=>a.name.localeCompare(b.name))
    .map(p=>`<option value="${esc(p.name)}"${p.name===selected?' selected':''}>${esc(p.name)}</option>`).join('');
}
const comparisonBaseDetail = detail;
detail = function(type, name) {
  comparisonBaseDetail(type, name);
  if(type!=='player'||isProfileOnly(name)||!rows.some(r=>r.player===name))return;
  const others=players().filter(p=>p.name!==name);
  app.innerHTML += `<section class="compare-launch"><button class="btn" id="compare-toggle" aria-expanded="false" aria-controls="compare-picker">Compare player</button><div id="compare-picker" hidden><label for="compare-opponent">Choose another player</label><select id="compare-opponent">${comparisonOptions('',name)}</select>${others.length?`<a class="btn compare-open" id="compare-open" target="_blank" rel="noopener noreferrer" href="${esc(comparisonURL(name,[...others].sort((a,b)=>a.name.localeCompare(b.name))[0].name))}">Open comparison ↗</a>`:'<p>No other players available.</p>'}<p class="sub">Opens in a new tab using this season’s data.</p></div></section>`;
  // Keep the action beside the profile rather than below the match history.
  const launch=app.querySelector('.compare-launch'),hero=app.querySelector('.profile-hero');
  if(hero&&launch)hero.after(launch);
  document.getElementById('compare-toggle').onclick=()=>{
    const picker=document.getElementById('compare-picker');picker.hidden=!picker.hidden;
    document.getElementById('compare-toggle').setAttribute('aria-expanded',String(!picker.hidden));
    if(!picker.hidden)document.getElementById('compare-opponent').focus();
  };
  document.getElementById('compare-opponent').onchange=e=>{
    const anchor=document.getElementById('compare-open');if(anchor)anchor.href=comparisonURL(name,e.target.value);
  };
};
function comparisonProfile(p) {
  const main=mainChampion(p.list);
  const pool=Object.entries(group(p.list,'champion')).map(([name,list])=>stats(list,name)).sort((a,b)=>b.games-a.games||b.wr-a.wr).slice(0,3);
  return `<article class="compare-profile">${main?splash(main.name):''}<div class="compare-profile-copy"><a href="${link('player',p.name)}"><h2>${esc(p.name)}</h2></a><p><span>${esc(p.lane||'—')}</span> · <span>Current solo rank</span>: <span data-current-rank="${esc(p.name)}">N/A</span></p><div class="compare-main"><span>Main champion</span>: <b>${esc(main?.name||'—')}</b></div><div class="compare-pool"><span>Top champions</span>: ${pool.map(c=>`<a href="${link('champion',c.name)}">${esc(c.name)} (${c.games})</a>`).join(' · ')}</div><div class="compare-form"><span>Last 5</span>${form(p.list)}</div></div></article>`;
}
function comparisonValue(value, other, formatted, lowerIsBetter=false) {
  if(value==null || other==null || !(lowerIsBetter ? value<other : value>other))return formatted;
  return `<span class="compare-higher">${formatted}<span class="compare-higher-arrow" aria-hidden="true">${lowerIsBetter?'↓':'↑'}</span></span>`;
}
function renderComparison(first,second) {
  const roster=players();const a=roster.find(p=>p.name===first),b=roster.find(p=>p.name===second);
  document.querySelectorAll('nav a').forEach(el=>el.classList.toggle('active',el.hash==='#players'));
  if(!a||!b||first===second){app.innerHTML='<h1>Player comparison</h1><p class="sub">Choose two different players available in this season.</p><a class="btn" href="#players">Players</a>';return;}
  document.title=`LCC · Season ${activeSeason.label} · ${first} vs ${second}`;
  const metrics=[
    ['Games played',p=>p.games,p=>n(p.games)],['Wins',p=>p.wins,p=>n(p.wins)],['Losses',p=>p.games-p.wins,p=>n(p.games-p.wins)],['Win rate',p=>p.wr,p=>percent(p.wr)],['KDA',p=>p.kda,p=>kda(p)],
    ['Total kills',p=>p.kills,p=>n(p.kills)],['Total deaths',p=>p.deaths,p=>n(p.deaths)],['Total assists',p=>p.assists,p=>n(p.assists)],
    ['First blood rate',p=>p.fb,p=>percent(p.fb)],['Total CC',p=>p.cc,p=>n(p.cc)],['Kill participation',p=>p.kp,p=>percent(p.kp)],
    ['Average damage',p=>p.damage,p=>p.damage==null?'N/A':n(p.damage)+' / min'],['Average gold',p=>p.gold,p=>p.gold==null?'N/A':n(p.gold)+' / min'],
    ['Average CS',p=>p.cs,p=>p.cs==null?'N/A':n(p.cs,2)+' / min'],['Average vision',p=>p.vision,p=>p.vision==null?'N/A':n(p.vision,2)+' / min']
  ];
  app.innerHTML=`<a class="back" href="#players">← <span>Players</span></a><div class="eyebrow compare-eyebrow">Season ${activeSeason.label}</div><h1>Player comparison</h1><div class="compare-controls"><label><span>Player A</span><select id="compare-a">${comparisonOptions(first)}</select></label><span class="compare-vs">VS</span><label><span>Player B</span><select id="compare-b">${comparisonOptions(second)}</select></label><button class="btn" id="compare-update">Compare</button></div><p id="compare-error" role="alert" class="loss" hidden>Choose two different players available in this season.</p><div class="compare-profiles">${comparisonProfile(a)}${comparisonProfile(b)}</div><p class="compare-legend"><span class="compare-higher">↑</span> <span>Higher values are highlighted; for deaths, lower is highlighted. Ties and missing values are not highlighted.</span></p><div class="tablewrap"><table class="compare-table"><thead><tr><th>Statistic</th><th>${esc(a.name)}</th><th>${esc(b.name)}</th></tr></thead><tbody>${metrics.map(([label,value,format])=>`<tr><th scope="row">${label}</th><td>${comparisonValue(value(a),value(b),format(a),label==='Total deaths')}</td><td>${comparisonValue(value(b),value(a),format(b),label==='Total deaths')}</td></tr>`).join('')}</tbody></table></div><p class="note">Season totals depend on games played. Per-minute averages use recorded games only. Missing statistics show N/A.</p>`;
  document.getElementById('compare-update').onclick=()=>{
    const x=document.getElementById('compare-a').value,y=document.getElementById('compare-b').value;
    if(x===y){document.getElementById('compare-error').hidden=false;return;}
    location.hash='compare/'+encodeURIComponent(x)+'/'+encodeURIComponent(y);
  };
}
const comparisonBaseRoute=route;
route=function(){
  const [page,rawA,rawB]=location.hash.slice(1).split('/');
  if(page!=='compare')return comparisonBaseRoute();
  updateSeasonContext();
  let a='',b='';try{a=canonicalPlayer(decodeURIComponent(rawA||''));b=canonicalPlayer(decodeURIComponent(rawB||''));}catch{}
  renderComparison(a,b);window.scrollTo(0,0);
};
