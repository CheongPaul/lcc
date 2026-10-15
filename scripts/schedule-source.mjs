import '../docs/next-match-data.js';
import {parseSheet} from './pom-source.mjs';
export async function loadSchedule(fetcher=fetch,now=Date.now()) {
  const url='https://docs.google.com/spreadsheets/d/1rmFSc8JZ4NT_7h14pc6CLkdG0Gi8GcSFLfRbh1nOSmM/gviz/tq?sheet=NextMatch&headers=1&tqx=out:json';
  const response=await fetcher(url,{signal:AbortSignal.timeout(25000)});
  if(!response.ok)throw Error('NextMatch unavailable: '+response.status);
  return LCCNextMatch.parse(parseSheet(await response.text()),now);
}
export function scheduleEvents(previous,schedule,now=Date.now()) {
  const state=previous?structuredClone(previous):{version:1,candidate:null,events:{}};
  if(state.version!==1)throw Error('Unknown schedule state');
  // Drop cancelled/replaced/expired pending events. Retain recent claims to prevent repeats.
  for(const [key,event] of Object.entries(state.events)) {
    if(event.startsAt<now-7*86400000)delete state.events[key];
    else if(!schedule||event.key!==schedule.key||event.startsAt<=now)event.done=true;
  }
  if(!schedule){state.candidate=null;return state;}
  if(state.candidate!==schedule.key){state.candidate=schedule.key;return state;}
  const announce=schedule.key+':updated';
  const kinds=schedule.startsAt-now<=3600000?['hour']:['updated'];
  for(const kind of kinds){const id=schedule.key+':'+kind;if(!state.events[id])state.events[id]={...schedule,kind,targets:null,attempted:{},done:false};}
  // A new schedule entered shortly before start produces a single reminder, not two alerts.
  if(kinds[0]==='hour'&&!state.events[announce])state.events[announce]={...schedule,kind:'updated',done:true};
  return state;
}
export function scheduleNotification(event,language) {
  const ko=language==='ko',f=LCCNextMatch.format(event,ko);
  return {kind:'schedule',season:'26-27',scheduleId:event.key,
    title:event.kind==='hour'?(ko?'⏰ LCC 경기 시작까지 1시간 이내':'⏰ LCC starts within an hour'):(ko?'📅 LCC 다음 경기 일정':'📅 LCC next match schedule'),
    body:`${f.date} · ${f.series}`};
}
