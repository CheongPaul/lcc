import fs from 'node:fs';
import vm from 'node:vm';
import {createHash} from 'node:crypto';
const root = new URL('../', import.meta.url);
const translations = {window:{}};
vm.runInNewContext(fs.readFileSync(new URL('docs/korean-game-terms.js',root),'utf8'),translations,{timeout:1000});
export const digest = value => createHash('sha256').update(value).digest('hex');

// Execute only our checked-in browser code, never data fetched from Sheets.
// This preserves the website's exact validation and POM formula without maintaining a copy.
export function siteContext(records = []) {
  const context = {
    URL, URLSearchParams, console, rows:records,
    location:{href:'https://cheongpaul.github.io/lcc/?season=26-27',hash:'#overview'},
    history:{replaceState(){}}, document:{documentElement:{dataset:{}},addEventListener(){}},
    addEventListener(){}, stats(){},table(){},detail(){},overview(){}
  };
  context.window = context;
  vm.createContext(context);
  for (const file of ['seasons.js','live.js','power-ranking.js','pom.js']) {
    vm.runInContext(fs.readFileSync(new URL('docs/'+file, root),'utf8'), context, {filename:file,timeout:5000});
  }
  return context;
}
export function parseSheet(text) {
  const start = text.indexOf('{'), end = text.lastIndexOf('}');
  if (start < 0 || end < start) throw new Error('Invalid Sheets response');
  const data = JSON.parse(text.slice(start,end+1));
  if (data.status !== 'ok' || !data.table) throw new Error('Sheets response not ready');
  return data.table;
}
export async function loadLive(fetcher = fetch) {
  const site = siteContext();
  const sheetId = vm.runInContext('activeSeason.sheetId',site);
  const read = async name => {
    const query = new URLSearchParams({sheet:name,headers:'1',tqx:'out:json'});
    const response = await fetcher(`https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?${query}`,{signal:AbortSignal.timeout(25000)});
    if (!response.ok) throw new Error('Sheets request failed: '+response.status);
    return parseSheet(await response.text());
  };
  const main = await read('Main');
  const names = site.seasonRoster(main).map(r => String(r['Player ID'].v));
  if (names.length < 10) throw new Error('Expected at least ten player tabs');
  const tables = await Promise.all(names.map(read));
  return site.assembleLive(main,tables).rows;
}
export function matchEvents(records) {
  const site = siteContext(records), events = [];
  for (const [match,list] of Object.entries(Object.groupBy(records,r=>r.match)).sort()) {
    if (!/^\d{8}$/.test(match) || list.length !== 10 || new Set(list.map(r=>r.player)).size !== 10 || list.filter(r=>r.win===1).length !== 5) continue;
    const winner = site.pomWinnerForMatch(match);
    if (!winner) continue;
    const r = winner.record;
    events.push({match, fingerprint:digest(JSON.stringify([...list].sort((a,b)=>a.player.localeCompare(b.player)))),
      player:r.player,champion:r.champion,kills:r.kills,deaths:r.deaths,assists:r.assists});
  }
  return events;
}
export function advanceState(previous, events) {
  // No history burst on first activation. Backfilled games below this initial boundary are ignored.
  if (!previous) return {version:1,baseline:events.at(-1)?.match || '',seen:{},candidates:{},pending:{}};
  if (previous.version !== 1) throw new Error('Unknown notification state; refusing to reset baseline');
  const state = structuredClone(previous), available = new Set(events.map(e=>e.match));
  for (const id of Object.keys(state.candidates)) if (!available.has(id)) delete state.candidates[id];
  for (const event of events) {
    const id = event.match;
    if (id <= state.baseline || state.seen[id] || state.pending[id]) continue;
    if (state.candidates[id] === event.fingerprint) {
      state.pending[id] = {...event,targets:null,attempted:{}};
      delete state.candidates[id];
    } else state.candidates[id] = event.fingerprint;
  }
  return state;
}
export function notificationData(event, language) {
  const ko = language === 'ko', name = event.player.split('#')[0];
  const champion = ko ? translations.window.LCC_KO_TERMS[event.champion] || event.champion : event.champion;
  return {season:'26-27',match:event.match,
    title:ko ? '🏆 새로운 경기의 POM!' : '🏆 New match POM!',
    body:`${name} · ${champion} · ${event.kills} / ${event.deaths} / ${event.assists}`};
}
