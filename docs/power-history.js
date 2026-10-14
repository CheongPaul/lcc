// Daily snapshots use the existing formula with only records available by that day.
// Rebuild when live data replaces the season's rows; never mix seasons or future data.
let powerDailyCache = {records:null, snapshots:[]};
function dailyPowerSnapshots(records = rows) {
  if (powerDailyCache.records === records) return powerDailyCache.snapshots;
  const days = [...new Set(records.map(matchdayKey).filter(Boolean))].sort();
  const snapshots = days.map(day => {
    const cumulative = records.filter(r => {const key = matchdayKey(r); return key && key <= day;});
    return {day, byName:new Map(calculatePowerRankings(cumulative).map(p => [p.name,p]))};
  });
  powerDailyCache = {records,snapshots};
  return snapshots;
}
function dailyPlayerPower(name, records = rows) {
  let previous;
  return dailyPowerSnapshots(records).flatMap(snapshot => {
    const current = snapshot.byName.get(name);
    if (!current) return [];
    const result = {day:snapshot.day, current, scoreDelta:powerChange(current,previous), rankDelta:rankChange(current,previous)};
    previous = current;
    return [result];
  });
}
const originalPowerProfileSummary = powerProfileSummary;
powerProfileSummary = function(name) {
  let summary = originalPowerProfileSummary(name);
  const history = dailyPlayerPower(name);
  if (!summary || !history.length) return summary;
  const latest = history.at(-1);
  const badges = [scoreChangeBadge(latest.scoreDelta), latest.current.score == null
    ? '<span class="rank-change same">—</span>' : rankChangeBadge(latest.rankDelta)];
  let metricIndex = 0;
  summary = summary.replace(/<\/strong>/g, closing => metricIndex < 2
    ? `<span class="power-profile-delta">${badges[metricIndex++]}</span>${closing}` : closing);
  const previousDay = history.at(-2)?.day;
  summary = summary.replace('</section>', `<p class="power-profile-day"><span>Daily power history</span> · ${formatMatchday(latest.day)}${previousDay ? ' ← '+formatMatchday(previousDay) : ''}</p></section>`);
  return summary + `<section class="power-daily"><div class="sectionhead"><h2>Daily power history</h2><span class="pill">${formatMatchday(latest.day)}</span></div><p class="power-daily-note">End-of-day cumulative standings, compared with the previous matchday. Days without league matches are omitted.</p><div class="tablewrap"><table><thead><tr><th>Date</th><th>Power score</th><th>Power change</th><th>Season rank</th><th>Rank change</th></tr></thead><tbody>${[...history].reverse().map(entry=>`<tr><td>${formatMatchday(entry.day)}</td><td class="lime">${n(entry.current.score,1)} <small>/ 100</small></td><td>${scoreChangeBadge(entry.scoreDelta)}</td><td>${entry.current.rank==null?'—':'#'+entry.current.rank}</td><td>${entry.current.score==null?'<span class="rank-change same">—</span>':rankChangeBadge(entry.rankDelta)}</td></tr>`).join('')}</tbody></table></div><p class="power-daily-note">Dates follow the match IDs. Today's standings may change as more games are added.</p></section>`;
};
