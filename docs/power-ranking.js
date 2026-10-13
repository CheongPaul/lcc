// LCC Power v1: within-season, per-game role percentiles; no rank or win-rate input.
const POWER_METRICS = [
  {key:'kda',weight:.25,value:r=>[r.kills,r.assists,r.deaths].every(Number.isFinite)?(r.kills+r.assists)/Math.max(r.deaths,1):null},
  {key:'kp',weight:.25,value:r=>r.kp},
  {key:'damage',weight:.20,value:r=>r.dpm},
  {key:'gold',weight:.15,value:r=>r.gpm},
  {key:'vision',weight:.15,value:r=>r.vpm}
];
const LANE_ICON_URLS={
  Top:'https://raw.githubusercontent.com/cjc2040/LoL_DDragon/main/extras/lanes/top.png',
  Jungle:'https://raw.githubusercontent.com/cjc2040/LoL_DDragon/main/extras/lanes/jungle.png',
  Mid:'https://raw.githubusercontent.com/cjc2040/LoL_DDragon/main/extras/lanes/middle.png',
  ADC:'https://raw.githubusercontent.com/cjc2040/LoL_DDragon/main/extras/lanes/bottom.png',
  Support:'https://raw.githubusercontent.com/cjc2040/LoL_DDragon/main/extras/lanes/support.png'
};
function laneIcon(lane,className='lane-icon'){const src=LANE_ICON_URLS[lane];return src?`<img class="${className}" src="${src}" alt="${esc(lane)} lane" width="40" height="40" loading="lazy">`:'';}
function powerPercentile(value, sorted) {
  if(sorted.length<2)return 50;
  let lower=0,equal=0;
  for(const x of sorted){if(x<value)lower++;else if(x===value)equal++;else break;}
  return 100*(lower+(equal-1)/2)/(sorted.length-1);
}
function calculatePowerRankings(records) {
  const roles=new Map(),byPlayer=new Map();
  for(const r of records){
    if(!byPlayer.has(r.player))byPlayer.set(r.player,{name:r.player,games:0,scores:[],limited:false});
    byPlayer.get(r.player).games++;
    if(!['Top','Jungle','Mid','ADC','Support'].includes(r.lane))continue;
    if(!roles.has(r.lane))roles.set(r.lane,POWER_METRICS.map(()=>[]));
    POWER_METRICS.forEach((m,i)=>{const v=m.value(r);if(Number.isFinite(v))roles.get(r.lane)[i].push({v,player:r.player});});
  }
  for(const pools of roles.values())for(const pool of pools)pool.sort((a,b)=>a.v-b.v);
  for(const r of records){
    const player=byPlayer.get(r.player),pools=roles.get(r.lane);let score=0,weight=0;
    if(!pools){player.limited=true;continue;}
    POWER_METRICS.forEach((m,i)=>{
      const value=m.value(r),pool=pools[i];if(!Number.isFinite(value)||!pool.length)return;
      score+=m.weight*powerPercentile(value,pool.map(x=>x.v));weight+=m.weight;
      if(pool.length<5||new Set(pool.map(x=>x.player)).size<2)player.limited=true;
    });
    if(weight>0)player.scores.push(score/weight);
    if(weight<.8)player.limited=true;
  }
  const ranked=[...byPlayer.values()].map(p=>{
    const count=p.scores.length,mean=count?p.scores.reduce((a,b)=>a+b,0)/count:null;
    return {...p,scoredGames:count,score:count?Math.max(0,Math.min(100,50+1.5*((count*mean+5*50)/(count+5)-50))):null,provisional:count<5};
  }).sort((a,b)=>a.score==null?b.score==null?a.name.localeCompare(b.name):1:b.score==null?-1:b.score-a.score||a.name.localeCompare(b.name));
  // Identical displayed scores share a rank; names only order tied cards consistently.
  let last=null,rank=0;
  return ranked.map((p,i)=>{const displayed=p.score==null?null:p.score.toFixed(1);if(displayed!==last)rank=i+1;last=displayed;return {...p,rank:p.score==null?null:rank};});
}
function powerRankings(){return calculatePowerRankings(rows);}
function powerFlags(p){return `${p.provisional?'<span class="pill">Provisional</span>':''}${p.limited?'<span class="pill">Limited data</span>':''}`;}
function powerStandoutCards(){const roster=new Map(players().map(p=>[p.name,p]));return powerRankings().filter(p=>p.score!=null).slice(0,3).map(p=>{const lane=roster.get(p.name)?.lane;return `<a class="leader power-leader" href="${link('player',p.name)}"><span class="ghost">${String(p.rank).padStart(2,'0')}</span>${laneIcon(lane,'power-lane-icon')}<small>POWER RANKING ↗</small><h3>${esc(p.name.split('#')[0])}</h3><strong>${n(p.score,1)}<span>/ 100</span></strong><div class="power-flags">${powerFlags(p)}</div></a>`;}).join('');}
function powerRankingSummary(){return `<details class="power-details"><summary>All power rankings & scoring</summary><div class="tablewrap"><table><thead><tr><th>Rank</th><th>Player</th><th>Power score</th><th>Games played</th><th>Data status</th></tr></thead><tbody>${powerRankings().map(p=>`<tr><td>${p.rank??'—'}</td><td><a href="${link('player',p.name)}">${esc(p.name)}</a></td><td class="lime">${n(p.score,1)} / 100</td><td>${p.scoredGames} / ${p.games}</td><td>${powerFlags(p)||'—'}</td></tr>`).join('')}</tbody></table></div><p>Power v1: each game is compared with the same season and role. KDA 25%, kill participation 25%, damage/min 20%, gold/min 15%, vision/min 15%. Tied values share their average percentile; a single record scores 50. Zero-death KDA uses (kills + assists) / max(deaths, 1).</p><p>Base score = (scored games × average game score + 5 × 50) / (scored games + 5). Displayed score = 50 + 1.5 × (base score − 50), limited to 0–100. Missing metrics redistribute their weights; games with no usable metrics are excluded. Under 5 scored games is provisional. Limited data means a role metric has fewer than 5 records or 2 players, or a game has under 80% metric coverage. Equal scores to one decimal share a rank. Scores are relative to each season.</p></details>`;}

function powerProfileSummary(name){const p=powerRankings().find(p=>p.name===name);if(!p)return '';return `<section class="power-profile"><div><span class="eyebrow">Power ranking</span><strong>${n(p.score,1)} <small>/ 100</small></strong></div><div><span>Season rank</span><strong>${p.rank==null?'—':'#'+p.rank}</strong></div><div class="power-flags">${powerFlags(p)}</div></section>`;}
