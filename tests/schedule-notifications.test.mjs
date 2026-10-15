import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {loadSchedule,scheduleEvents,scheduleNotification} from '../scripts/schedule-source.mjs';
const table={cols:['Date','Time','Best of'].map(label=>({label})),rows:[{c:[{v:261015},{v:'Date(1899,11,30,22,0,0)'},{v:5}]}]};
const now=Date.parse('2026-10-15T02:00:00Z');
test('Sheet date/time parse uses KST, validates columns and format, ignores expired rows',()=>{
 const s=LCCNextMatch.parse(table,now);assert.equal(s.startsAt,Date.parse('2026-10-15T13:00:00Z'));assert.equal(s.bestOf,5);
 assert.equal(LCCNextMatch.parse(table,s.startsAt),null);
 assert.throws(()=>LCCNextMatch.parse({cols:[{label:'Player ID'}],rows:[]},now));
 for(const [index,value] of [[0,261332],[1,'25:10'],[2,4]]){const t=structuredClone(table);t.rows[0].c[index].v=value;assert.throws(()=>LCCNextMatch.parse(t,now));}
 const t=structuredClone(table);t.rows[0].c[1].v=[21,30,0];t.rows[0].c[2].v=3;assert.equal(LCCNextMatch.parse(t,now).startsAt,Date.parse('2026-10-15T12:30:00Z'));
});
test('Two stable reads; one update and one reminder; changes and cancellation',()=>{
 const s=LCCNextMatch.parse(table,now);let state=scheduleEvents(null,s,now);assert.equal(Object.keys(state.events).length,0);
 state=scheduleEvents(state,s,now);assert.equal(Object.keys(state.events).length,1);
 state.events[s.key+':updated'].done=true;
 state=scheduleEvents(state,s,s.startsAt-3500000);assert.equal(Object.keys(state.events).length,2);
 state.events[s.key+':hour'].done=true;assert.ok(Object.values(scheduleEvents(state,s,s.startsAt-1000).events).every(e=>e.done));
 const changed={...s,bestOf:3,key:s.startsAt+'-3'};const pending=scheduleEvents(state,changed,now);assert.equal(pending.candidate,changed.key);
 assert.ok(Object.values(scheduleEvents(pending,null,now).events).every(e=>e.done));
 const late=scheduleEvents(scheduleEvents(null,s,s.startsAt-10000),s,s.startsAt-10000);
 assert.equal(Object.values(late.events).filter(e=>!e.done).length,1);
});
test('Worker sends schedule clicks to overview and rejects invalid ids',()=>{
 const c={URL,self:{registration:{scope:'https://cheongpaul.github.io/lcc/'},addEventListener(){}},importScripts(){},firebase:{initializeApp(){},messaging:()=>({onBackgroundMessage(){}})}};
 vm.createContext(c);vm.runInContext(fs.readFileSync('docs/push-worker.js','utf8'),c);
 const data=scheduleNotification({...LCCNextMatch.parse(table,now),kind:'hour'},'ko');
 assert.ok(data.body.includes('5판 3선승'));assert.ok(c.pomNotification(data).options.data.url.endsWith('#overview'));
 assert.equal(c.pomNotification({...data,scheduleId:'https://evil.test'}),null);
});
test('sender targets only schedule opt-ins, deduplicates and never repeats',async()=>{
 const original=globalThis.fetch,old=process.env.GOOGLE_ACCESS_TOKEN;process.env.GOOGLE_ACCESS_TOKEN='test';
 // Use a far-future schedule so the real clock cannot invalidate this fixture.
 const fixture=structuredClone(table);fixture.rows[0].c[0].v=991015;
 let saved=null,revision=0,sends=0;
 globalThis.fetch=async(url,options={})=>{
  const reply=(data,status=200)=>({ok:status<400,status,json:async()=>data,text:async()=>JSON.stringify(data)});
  if(url.includes('/gviz/'))return reply({status:'ok',table:fixture});
  if(url.includes('/pushPrivate/scheduleState')){
   if(options.method==='PATCH'){saved=JSON.parse(options.body);return reply({...saved,updateTime:String(++revision)});}
   return saved?reply({...saved,updateTime:String(revision)}):reply({},404);
  }
  if(url.includes('/pushSubscriptions'))return reply({documents:[
   {fields:{token:{stringValue:'legacy-pom-only'}}},
   {fields:{token:{stringValue:'schedule-device'},scheduleEnabled:{booleanValue:true},language:{stringValue:'ko'}}},
   {fields:{token:{stringValue:'schedule-device'},scheduleEnabled:{booleanValue:true}}}
  ]});
  if(url.includes('messages:send')){sends++;const m=JSON.parse(options.body).message;assert.equal(m.token,'schedule-device');assert.equal(m.data.kind,'schedule');return reply({});}
  throw Error('Unexpected request');
 };
 try{for(let i=0;i<3;i++)await import('../scripts/send-schedule-notifications.mjs?case='+i);assert.equal(sends,1);}
 finally{globalThis.fetch=original;if(old===undefined)delete process.env.GOOGLE_ACCESS_TOKEN;else process.env.GOOGLE_ACCESS_TOKEN=old;}
});
