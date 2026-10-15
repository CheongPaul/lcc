// Six comparable axes: within-season roster percentiles, not power-ranking weights.
const RADAR_METRICS = [
  {key:'kda',axis:'KDA',label:'KDA',digits:2,value:p=>p.kda},
  {key:'damage',axis:'DMG',label:'Damage / minute',digits:0,value:p=>p.damage},
  {key:'vision',axis:'VISION',label:'Vision / minute',digits:2,value:p=>p.vision},
  {key:'cs',axis:'CS',label:'CS / minute',digits:2,value:p=>p.cs},
  {key:'kp',axis:'KP',label:'Kill participation',digits:1,suffix:'%',value:p=>p.kp},
  {key:'cc',axis:'CC',label:'CC per game',digits:1,value:p=>activeSeason.hasCC?avg(p.list,'cc'):null}
];
function radarValueValid(value) { return typeof value==='number' && !Number.isNaN(value) && value!==-Infinity; }
function radarPercentile(value, values) {
  if (!radarValueValid(value)) return null;
  const known=values.filter(radarValueValid);
  if(known.length<2)return 50;
  const lower=known.filter(v=>v<value).length, equal=known.filter(v=>v===value).length;
  return 100*(lower+(equal-1)/2)/(known.length-1);
}
function playerRadarMetrics(name, roster=players()) {
  const player=roster.find(p=>p.name===name);
  if(!player)return [];
  return RADAR_METRICS.map(metric=>{
    const value=metric.value(player);
    return {...metric,value,percentile:radarPercentile(value,roster.map(metric.value))};
  });
}
function playerRadar(name) {
  const metrics=playerRadarMetrics(name);
  if(!metrics.length)return '';
  const center=180,radius=112;
  const coord=(i,ratio=1)=>{const angle=(-90+i*60)*Math.PI/180;return [center+Math.cos(angle)*radius*ratio,center+Math.sin(angle)*radius*ratio];};
  const coords=ratio=>metrics.map((_,i)=>coord(i,ratio).join(',')).join(' ');
  const formatted=m=>m.value===Infinity?'Perfect':!radarValueValid(m.value)?'N/A':n(m.value,m.digits)+(m.suffix||'');
  const rings=[.25,.5,.75,1].map(r=>`<polygon points="${coords(r)}" class="radar-grid"/><text x="185" y="${center-radius*r+12}" class="radar-tick">${r*100}</text>`).join('');
  const axes=metrics.map((m,i)=>{const [x,y]=coord(i),[lx,ly]=coord(i,1.28);return `<line x1="180" y1="180" x2="${x}" y2="${y}" class="radar-grid${m.percentile==null?' radar-missing':''}"/><text x="${lx}" y="${ly+4}" text-anchor="middle" class="radar-axis">${m.axis}${m.percentile==null?' · N/A':''}</text>`;}).join('');
  const complete=metrics.every(m=>m.percentile!==null);
  let shape='';
  if(complete)shape=`<polygon points="${metrics.map((m,i)=>coord(i,m.percentile/100).join(',')).join(' ')}" class="radar-area"/>`;
  else shape=metrics.map((m,i)=>{const next=(i+1)%6;if(m.percentile===null||metrics[next].percentile===null)return '';const [x1,y1]=coord(i,m.percentile/100),[x2,y2]=coord(next,metrics[next].percentile/100);return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="radar-edge"/>`;}).join('');
  const dots=metrics.map((m,i)=>{if(m.percentile===null)return '';const [x,y]=coord(i,m.percentile/100);return `<circle cx="${x}" cy="${y}" r="4" class="radar-dot"><title>${m.axis}: ${formatted(m)} · ${n(m.percentile,0)} / 100</title></circle>`;}).join('');
  return `<section class="player-radar"><div class="sectionhead"><h2>Player stat profile</h2><span class="pill">6 STATS</span></div><p class="radar-note">Season roster percentiles: farther out means higher. These axes compare all positions, not power-ranking scores. Ties share a percentile.</p><div class="radar-layout"><svg viewBox="0 0 360 360" role="img" aria-label="Six-axis player statistics"><title>Player stat profile</title>${rings}${axes}${shape}${dots}</svg><div class="radar-values"><div class="radar-values-head"><span>Statistic</span><span>Value</span><span>Percentile</span></div>${metrics.map(m=>`<div class="radar-value"><span>${m.label}</span><strong>${formatted(m)}</strong><span>${m.percentile===null?'N/A':n(m.percentile,0)+' / 100'}</span></div>`).join('')}</div></div><p class="radar-note">DMG, VISION and CS are per-minute averages. KP is kill participation. CC is the average per recorded game. Missing statistics are not plotted.</p></section>`;
}
