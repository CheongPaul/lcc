// Choose one same-main-role matchup by the displayed season power-score gap.
function closestSeasonMatchup(roster=players(), rankings=powerRankings()) {
  const power=new Map(rankings.map(p=>[p.name,p]));
  const candidates=[];
  for(const lane of ['Top','Jungle','Mid','ADC','Support']){
    const pool=roster.filter(p=>p.lane===lane&&power.get(p.name)?.score!=null).sort((a,b)=>a.name.localeCompare(b.name));
    for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
      const a=pool[i],b=pool[j],pa=power.get(a.name),pb=power.get(b.name);
      const gap=Math.abs(Math.round(pa.score*10)-Math.round(pb.score*10))/10;
      candidates.push({lane,a,b,pa,pb,gap});
    }
  }
  return candidates.sort((x,y)=>x.gap-y.gap)[0]||null;
}
function matchupRelativeGap(a,b) {
  if(a==null||b==null||Number.isNaN(a)||Number.isNaN(b))return null;
  if(a===b)return 0;
  if(!Number.isFinite(a)||!Number.isFinite(b))return 1;
  return Math.abs(a-b)/Math.max(Math.abs(a),Math.abs(b));
}
function closestMatchupMetrics(a,b){
  return leaderboardCategories.map((category,index)=>({category,index,gap:matchupRelativeGap(a[category.key],b[category.key])}))
    .filter(x=>x.gap!=null).sort((x,y)=>x.gap-y.gap||x.index-y.index).slice(0,3);
}
function matchupPlayer(p,power){
  const main=mainChampion(p.list),id=main&&championArt[main.name];
  return `<div class="matchup-player"><a class="matchup-name" href="${link('player',p.name)}">${esc(p.name.split('#')[0])}</a><strong class="matchup-power">${n(power.score,1)}<small>/ 100</small></strong><span class="tag">${p.games} <span>Games played</span></span>${main?`<a class="matchup-champion" href="${link('champion',main.name)}">${id?`<img src="images/champion-icons/${encodeURIComponent(id)}.png" width="42" height="42" alt="" loading="lazy">`:''}<span><small>Most-played champion</small><b>${esc(main.name)}</b></span></a>`:''}</div>`;
}
function closestMatchupCard(){
  const match=closestSeasonMatchup();
  if(!match)return '<section class="note"><h2>Closest matchup</h2><p>Not enough same-role player records.</p></section>';
  const {lane,a,b,pa,pb,gap}=match,metrics=closestMatchupMetrics(a,b);
  const labels={kda:'KDA',kills:'Total kills',assists:'Total assists',damage:'Average damage',gold:'Average gold',cs:'Average CS',kp:'Kill participation',vision:'Average vision',cc:'Total CC'};
  return `<section class="matchup-section"><div class="sectionhead"><h2>Closest matchup <span>${esc(lane)}</span></h2><span class="pill">Season ${activeSeason.label}</span></div><div class="matchup-card"><div class="matchup-contenders">${matchupPlayer(a,pa)}<div class="matchup-center"><b>VS</b><span>Power score gap</span><strong>${n(gap,1)}</strong></div>${matchupPlayer(b,pb)}</div><div class="matchup-metrics"><h3>Three closest stats</h3>${metrics.map(({category})=>`<div class="matchup-metric"><strong>${category.format(a)}</strong><span>${labels[category.key]}</span><strong>${category.format(b)}</strong></div>`).join('')||'<p>No shared recorded statistics.</p>'}</div><div class="matchup-footer"><p>Same main role, closest power scores. Stats cover the full season; three categories are selected by relative difference. Totals depend on games played.</p><a class="btn" href="${esc(comparisonURL(a.name,b.name))}" target="_blank" rel="noopener noreferrer">Compare these players ↗</a></div></div></section>`;
}
