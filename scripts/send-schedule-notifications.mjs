import {loadSchedule,scheduleEvents,scheduleNotification} from './schedule-source.mjs';
import {digest} from './pom-source.mjs';
const token=process.env.GOOGLE_ACCESS_TOKEN;
if(!token)throw Error('Missing Google access token');
const base='https://firestore.googleapis.com/v1/projects/lccstats/databases/(default)/documents';
async function request(url,options={}) {
  const r=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(25000)});
  let data;try{data=await r.json();}catch{data={};}
  return {ok:r.ok,status:r.status,data};
}
const schedule=await loadSchedule();
const saved=await request(base+'/pushPrivate/scheduleState');
if(!saved.ok&&saved.status!==404)throw Error('Cannot read schedule state');
let revision=saved.data.updateTime;
const state=scheduleEvents(saved.ok?JSON.parse(saved.data.fields.state.stringValue):null,schedule);
async function save(){
  const condition=revision?'currentDocument.updateTime='+encodeURIComponent(revision):'currentDocument.exists=false';
  const r=await request(base+'/pushPrivate/scheduleState?'+condition,{method:'PATCH',body:JSON.stringify({fields:{state:{stringValue:JSON.stringify(state)}}})});
  if(!r.ok)throw Error('Cannot claim schedule event: '+r.status);
  revision=r.data.updateTime;
}
await save();
const events=Object.values(state.events).filter(e=>!e.done);
const subscribers=new Map();
if(events.length){let page='';do{
  const r=await request(base+'/pushSubscriptions?'+new URLSearchParams({pageSize:'300',...(page?{pageToken:page}:{})}));
  if(!r.ok)throw Error('Cannot load schedule subscribers');
  for(const doc of r.data.documents||[]){const f=doc.fields,t=f?.token?.stringValue;if(t&&f.scheduleEnabled?.booleanValue===true)subscribers.set(digest(t),{token:t,language:f.language?.stringValue||'en'});}
  page=r.data.nextPageToken||'';
}while(page);}
let sent=0,failed=0;
for(const event of events){
  if(event.targets===null){event.targets=[...subscribers.keys()];await save();}
  for(const key of event.targets){
    if(event.attempted[key])continue;
    const s=subscribers.get(key);
    event.attempted[key]=s?'claimed':'unsubscribed';await save();
    if(!s||Date.now()>=event.startsAt)continue;
    try{
      const ttl=Math.max(1,Math.min(86400,Math.floor((event.startsAt-Date.now())/1000)));
      const r=await request('https://fcm.googleapis.com/v1/projects/lccstats/messages:send',{method:'POST',body:JSON.stringify({message:{token:s.token,data:scheduleNotification(event,s.language),webpush:{headers:{TTL:String(ttl),Urgency:'normal'}}}})});
      event.attempted[key]=r.ok?'sent':'failed';if(r.ok)sent++;else failed++;
    }catch{event.attempted[key]='unknown';failed++;}
    await save();
  }
  event.done=true;await save();
}
console.log(`Schedule notifications accepted: ${sent}; failed/uncertain: ${failed}.`);
if(failed)process.exitCode=1;
