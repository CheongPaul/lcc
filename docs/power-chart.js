let powerGameCache = {records:null,snapshots:[]};
function gamePowerSnapshots(records = rows) {
  if (powerGameCache.records === records) return powerGameCache.snapshots;
  const ids = [...new Set(records.map(r=>String(r.match)))].sort();
  const snapshots = ids.map(match => ({match, byName:new Map(calculatePowerRankings(records.filter(r=>String(r.match)<=match)).map(p=>[p.name,p]))}));
  powerGameCache = {records,snapshots};
  return snapshots;
}
function playerGamePower(name, records = rows) {
  let previous;
  const played = new Set(records.filter(r=>r.player===name).map(r=>String(r.match)));
  return gamePowerSnapshots(records).flatMap(snapshot=>{
    const current = snapshot.byName.get(name);
    if (!current) return [];
    const point = {match:snapshot.match,current,played:played.has(snapshot.match),scoreDelta:powerChange(current,previous),rankDelta:rankChange(current,previous)};
    previous=current;
    return [point];
  });
}
function powerChartReadout(point) {
  return `<a href="${link('match',point.match)}">${esc(matchLabel(point.match))} ↗</a><span>${point.played?'Played':'Did not play'}</span><span><span>Power score</span> <b>${n(point.current.score,1)}</b> ${scoreChangeBadge(point.scoreDelta)}</span><span><span>Season rank</span> <b>${point.current.rank==null?'—':'#'+point.current.rank}</b> ${point.current.rank==null?'—':rankChangeBadge(point.rankDelta)}</span>`;
}
function powerGameChart(name) {
  const points = playerGamePower(name);
  if (!points.length) return '';
  const maxRank = Math.max(2,new Set(rankedRecords(rows).map(r=>r.player)).size);
  const width = Math.max(640,points.length*105+100), height=300, left=48,right=width-48,top=35,bottom=250;
  const x=i=>points.length===1?(left+right)/2:left+i*(right-left)/(points.length-1);
  const sy=value=>bottom-value/100*(bottom-top);
  const ry=rank=>top+(rank-1)/(maxRank-1)*(bottom-top);
  function path(key,y) {
    let open=false;
    return points.map((point,i)=>{
      const value=point.current[key];
      if (!Number.isFinite(value)) {open=false;return '';}
      const segment=`${open?'L':'M'}${x(i)},${y(value)}`;open=true;return segment;
    }).join(' ');
  }
  const grid=[0,25,50,75,100].map(v=>`<line x1="${left}" x2="${right}" y1="${sy(v)}" y2="${sy(v)}" class="power-chart-grid"/><text x="${left-12}" y="${sy(v)+4}" text-anchor="end" class="power-chart-score-label">${v}</text>`).join('');
  const ranks=[...new Set([1,Math.ceil(maxRank/2),maxRank])].map(v=>`<text x="${right+12}" y="${ry(v)+4}" class="power-chart-rank-label">#${v}</text>`).join('');
  const markers=points.map((p,i)=>`<g class="power-chart-point" data-power-point="${i}" tabindex="0" role="button" aria-label="${esc(matchLabel(p.match))}: ${n(p.current.score,1)} / 100, #${p.current.rank??'—'}"><rect x="${x(i)-18}" y="${top-8}" width="36" height="${bottom-top+16}" class="power-chart-hit"/>${p.current.score==null?'':`<circle cx="${x(i)}" cy="${sy(p.current.score)}" r="4" class="power-chart-score-dot"/>`}${p.current.rank==null?'':`<rect x="${x(i)-4}" y="${ry(p.current.rank)-4}" width="8" height="8" class="power-chart-rank-dot"/>`}<text x="${x(i)}" y="${bottom+25}" text-anchor="middle">${esc(matchLabel(p.match).split(" · ")[0])}</text><text x="${x(i)}" y="${bottom+43}" text-anchor="middle">${esc(matchLabel(p.match).split(" · ")[1])}</text></g>`).join('');
  return `<section class="power-chart" data-power-player="${esc(name)}"><div class="sectionhead"><h2>Power ranking journey</h2></div><div class="power-chart-legend"><span class="power-chart-score-label">● <span>Power score · left axis</span></span><span class="power-chart-rank-label">■ <span>Season rank · right axis</span></span></div><p class="power-daily-note">Cumulative standings after each league match, including matches you did not play. Rank 1 is at the top. The two axes use different scales.</p><div class="power-chart-scroll"><svg viewBox="0 0 ${width} ${height}" style="min-width:${width}px" aria-label="Power ranking journey"><text x="${left}" y="18" class="power-chart-score-label">0–100</text><text x="${right}" y="18" text-anchor="end" class="power-chart-rank-label">#1–${maxRank}</text>${grid}${ranks}<path d="${path('score',sy)}" class="power-chart-score-line"/><path d="${path('rank',ry)}" class="power-chart-rank-line"/>${markers}</svg></div><div class="power-chart-controls"><label><span>League match</span> <select class="power-chart-select">${points.map((p,i)=>`<option value="${i}"${i===points.length-1?' selected':''}>${esc(matchLabel(p.match))}</option>`).join('')}</select></label><span>Tap a point or choose a match. Scroll sideways to see all matches.</span></div><div class="power-chart-readout" aria-live="polite">${powerChartReadout(points.at(-1))}</div></section>`;
}
function selectPowerChartPoint(section,index) {
  const points=playerGamePower(section.dataset.powerPlayer), point=points[index];
  if(!point)return;
  section.querySelector('.power-chart-select').value=String(index);
  section.querySelector('.power-chart-readout').innerHTML=powerChartReadout(point);
  section.querySelectorAll('[data-power-point]').forEach(el=>el.classList.toggle('selected',Number(el.dataset.powerPoint)===index));
}
document.addEventListener('click',event=>{
  const target=event.target.closest?.('[data-power-point]');
  if(target)selectPowerChartPoint(target.closest('.power-chart'),Number(target.dataset.powerPoint));
});
document.addEventListener('keydown',event=>{
  const target=event.target.closest?.('[data-power-point]');
  if(target&&(event.key==='Enter'||event.key===' ')){event.preventDefault();selectPowerChartPoint(target.closest('.power-chart'),Number(target.dataset.powerPoint));}
});
document.addEventListener('change',event=>{
  if(event.target.matches?.('.power-chart-select'))selectPowerChartPoint(event.target.closest('.power-chart'),Number(event.target.value));
});
