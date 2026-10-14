import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {matchEvents,advanceState,parseSheet,notificationData,siteContext} from '../scripts/pom-source.mjs';
const records = JSON.parse(fs.readFileSync(new URL('../docs/data.json',import.meta.url))).rows;
const events = matchEvents(records);
test('POM uses unchanged website implementation and winning team', () => {
  const site = siteContext(records);
  assert.equal(events.length,12);
  for(const event of events) {
    const winner=site.pomWinnerForMatch(event.match);
    assert.equal(event.player,winner.player);
    assert.equal(winner.record.win,1);
  }
});
test('nine-player and duplicate-player matches cannot trigger', () => {
  const match=records.filter(r=>r.match===events[0].match);
  assert.equal(matchEvents(match.slice(1)).length,0);
  assert.equal(matchEvents([...match.slice(1),match[1]]).length,0);
});
test('first activation baselines history without notifications', () => {
  const state=advanceState(null,events);
  assert.deepEqual(state.pending,{});
  assert.deepEqual(advanceState(state,events).pending,{});
});
test('requires two consecutive complete, stable observations', () => {
  const baseline=advanceState(null,events), fresh={...events.at(-1),match:'26101501'};
  const first=advanceState(baseline,[...events,fresh]);
  assert.deepEqual(first.pending,{});
  const second=advanceState(first,[...events,fresh]);
  assert.equal(second.pending[fresh.match].player,fresh.player);
  assert.equal(second.pending[fresh.match].targets,null);
  assert.deepEqual(advanceState(first,events).candidates,{});
  const edited={...fresh,fingerprint:'changed'};
  assert.deepEqual(advanceState(first,[...events,edited]).pending,{});
});
test('previously announced games and historical backfills stay silent', () => {
  const state=advanceState(null,events);
  state.seen['26101501']=true;
  const next=advanceState(state,[{...events[0],match:'25010101'},...events,{...events[0],match:'26101501'}]);
  assert.deepEqual(next.pending,{});
  assert.deepEqual(next.candidates,{});
});
test('bad state and failed/hostile sheet responses fail closed', () => {
  assert.throws(()=>advanceState({version:0},events));
  assert.throws(()=>parseSheet('/* access denied */'));
  assert.throws(()=>parseSheet('callback({"status":"error"})'));
  assert.deepEqual(parseSheet('/* comment */google.visualization.Query.setResponse({"status":"ok","table":{"rows":[]}});'),{rows:[]});
});
test('notification payload contains language, match and K/D/A', () => {
  const event=events.at(-1);
  assert.match(notificationData(event,'ko').title,/새로운/);
  assert.match(notificationData(event,'ko').body,/리 신/);
  assert.equal(notificationData(event,'en').match,event.match);
  assert.match(notificationData(event,'en').body,/19 \/ 3 \/ 6/);
});
test('service worker produces safe match links and displays only data notifications', async () => {
  const handlers={},shown=[];
  const context={URL,Promise,importScripts(){},firebase:{initializeApp(){},messaging:()=>({onBackgroundMessage:fn=>handlers.background=fn})},self:{registration:{scope:'https://cheongpaul.github.io/lcc/',showNotification:async (...args)=>shown.push(args)},addEventListener:(type,fn)=>handlers[type]=fn}};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(new URL('../docs/push-worker.js',import.meta.url),'utf8'),context);
  await handlers.background({data:{...notificationData(events[0],'ko'),url:'https://evil.example/'}});
  assert.equal(shown.length,1);
  assert.match(shown[0][1].data.url,/^https:\/\/cheongpaul.github.io\/lcc\/\?season=26-27#match\/\d{8}$/);
  assert.equal(shown[0][1].renotify,false);
  await handlers.background({data:{match:'../../evil',season:'26-27'}});
  assert.equal(shown.length,1);
});
test('sender integration: baseline, confirmation, unique tokens and no repeat sends', async () => {
  const originalFetch=global.fetch, oldToken=process.env.GOOGLE_ACCESS_TOKEN;
  process.env.GOOGLE_ACCESS_TOKEN='test-only';
  let current=records,stored=null,revision=0,sends=0,failSend=false;
  const names=[...new Set(records.map(r=>r.player))];
  const labels={'Match ID':'match','Game Time':'seconds',Champion:'champion',Lane:'lane',Kills:'kills',Deaths:'deaths',Assists:'assists','Damage Dealt':'damage',CS:'cs',Gold:'gold',Vision:'vision','First Blood':'firstBlood',Win:'win','Total Kills of Game':'teamKills',CC:'cc'};
  const json=(value,status=200)=>new Response(JSON.stringify(value),{status});
  global.fetch=async (url,options={})=>{
    url=String(url);
    if(url.includes('/gviz/tq?')) {
      const name=new URL(url).searchParams.get('sheet');
      const table=name==='Main'?{cols:[{label:'Player ID'}],rows:names.map(v=>({c:[{v}]}))}:{cols:Object.keys(labels).map(label=>({label})),rows:current.filter(r=>r.player===name).map(r=>({c:Object.entries(labels).map(([label,key])=>({v:key==='seconds'?r.seconds/86400:r[key]}))}))};
      return new Response('callback('+JSON.stringify({status:'ok',table})+');');
    }
    if(url.includes('/pushPrivate/pomState')) {
      if(options.method==='PATCH') {stored=JSON.parse(options.body);return json({...stored,updateTime:'revision-'+(++revision)});}
      return stored?json({...stored,updateTime:'revision-'+revision}):json({},404);
    }
    if(url.includes('/pushPublic/status'))return json({});
    if(url.includes('/pushSubscriptions?')) return json({documents:[1,2].map(i=>({name:'subscription/'+i,fields:{token:{stringValue:'same-device-token'},language:{stringValue:'ko'}}}))});
    if(url.includes('/messages:send')) {sends++;const message=JSON.parse(options.body).message;assert(!message.notification);if(failSend)throw new Error('Simulated ambiguous timeout');assert.equal(message.data.match,'26101501');return json({name:'accepted'});}
    throw new Error('Unexpected test request');
  };
  try {
    const run=async i=>import('../scripts/send-pom-notifications.mjs?test='+i);
    await run(1); assert.equal(sends,0);
    current=[...records,...records.filter(r=>r.match===events.at(-1).match).map(r=>({...r,match:'26101501'}))];
    await run(2); assert.equal(sends,0);
    await run(3); assert.equal(sends,1);
    await run(4); assert.equal(sends,1);
    assert.equal(JSON.parse(stored.fields.state.stringValue).seen['26101501'],true);
    current=[...current,...records.filter(r=>r.match===events.at(-1).match).map(r=>({...r,match:'26101502'}))];
    await run(5);failSend=true;await run(6);assert.equal(sends,2);
    process.exitCode=0;
    await run(7);assert.equal(sends,2); // Never retry an ambiguous send.
  } finally {global.fetch=originalFetch;if(oldToken===undefined)delete process.env.GOOGLE_ACCESS_TOKEN;else process.env.GOOGLE_ACCESS_TOKEN=oldToken;}
});
