// The URL is authoritative: separate tabs and shared links never share season state.
const LCC_SEASONS = {
  '26-27': {label:'26/27', year:'2026–27', sheetId:'1rmFSc8JZ4NT_7h14pc6CLkdG0Gi8GcSFLfRbh1nOSmM', snapshot:'data.json', hasCC:true, completeMatches:true, excluded:[], profileOnly:['윤조한']},
  '25-26': {label:'25/26', year:'2025–26', sheetId:'1hke5Q6odlqK-UPdbPWLcFz-_1fVitSQGAuf6Sc_EElI', snapshot:'data-25-26.json', hasCC:false, completeMatches:false, excluded:['내꿈은 코르키#5877','절불이라능#KR1']}
};
const seasonURL = new URL(location.href);
const seasonKey = Object.hasOwn(LCC_SEASONS, seasonURL.searchParams.get('season')) ? seasonURL.searchParams.get('season') : '26-27';
const activeSeason = LCC_SEASONS[seasonKey];
// Apply before styles paint so archive links never flash the current season theme.
document.documentElement.dataset.season = seasonKey;
seasonURL.searchParams.set('season',seasonKey);
history.replaceState(null,'',seasonURL);
const LCC_PLAYER_ALIASES = {
  'Hip to be Square#Fore':'가 타 카#1997',
  'ŚANDIPEN#평 화':'이거진짜#KRI',
  '제육볶아온나#테토남':'더불어만진당구속#멸공멸공'
};
const canonicalPlayer = name => LCC_PLAYER_ALIASES[name] || name;
const previousPlayerNames = name => Object.keys(LCC_PLAYER_ALIASES).filter(old => LCC_PLAYER_ALIASES[old] === name);
// Guests retain scoreboards and personal history, but never enter season aggregates.
const isProfileOnly = name => (activeSeason.profileOnly || []).includes(canonicalPlayer(name));
const rankedRecords = records => records.filter(r => !isProfileOnly(r.player));
function normalizeSeasonData(value) {
  if(value.season !== activeSeason.year) throw new Error('Season data mismatch');
  return {...value, ratings:Object.fromEntries(Object.entries(value.ratings || {}).filter(([name])=>!activeSeason.excluded.includes(name)).map(([name,rank])=>[canonicalPlayer(name),rank])), rows:value.rows.filter(row=>!activeSeason.excluded.includes(row.player)).map(row=>({...row,player:canonicalPlayer(row.player),cc:activeSeason.hasCC?row.cc:null}))};
}
function updateSeasonContext() {
  const [page='overview', raw=''] = location.hash.slice(1).split('/');
  let name; try {name=decodeURIComponent(raw)} catch {name=raw}
  const pages={overview:'Overview',players:'Players',leaderboard:'Leaderboard',matches:'Match history',champions:'Champions',about:'League data',player:'Player',champion:'Champion',match:'Match'};
  document.title=`LCC · Season ${activeSeason.label} · ${pages[page] || 'Overview'}${name?' · '+canonicalPlayer(name):''}`;
  document.documentElement.dataset.season=seasonKey;
  const select=document.getElementById('season-select');
  if(select)select.value=seasonKey;
  const badge=document.getElementById('season-context');
  if(badge)badge.textContent=`Season ${activeSeason.label}`;
}
document.addEventListener('DOMContentLoaded',()=>{
  document.getElementById('season-select').addEventListener('change',event=>{
    const url=new URL(location.href);url.searchParams.set('season',event.target.value);
    // A match in one season is not the same match in another season.
    if(url.hash.startsWith('#match/'))url.hash='#matches';
    location.assign(url.href);
  });
  if(!activeSeason.completeMatches){const note=document.getElementById('season-data-note');note.hidden=false;note.textContent='25/26 archive: excluded players are omitted. Partial scoreboards contain recorded players only. Missing stats show N/A; averages and first-blood rates use recorded values only.';}
  document.getElementById('sidebar-season').textContent=`SEASON ${activeSeason.year}`;
  updateSeasonContext();
});
addEventListener('hashchange',updateSeasonContext);
