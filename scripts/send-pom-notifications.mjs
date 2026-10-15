import {loadLive,matchEvents,advanceState,notificationData,digest} from './pom-source.mjs';
const project = 'lccstats';
const accessToken = process.env.GOOGLE_ACCESS_TOKEN;
if (!accessToken) throw new Error('Missing Google access token. Configure the GitHub OIDC provider first.');
const base = `https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
async function request(url, options = {}) {
  const response = await fetch(url,{...options,headers:{Authorization:`Bearer ${accessToken}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(25000)});
  let data; try {data = await response.json();} catch {data = {};}
  return {ok:response.ok,status:response.status,data};
}
const saved = await request(base+'/pushPrivate/pomState');
if (!saved.ok && saved.status !== 404) throw new Error('Cannot read private state: '+saved.status);
let revision = saved.data.updateTime;
const previous = saved.ok ? JSON.parse(saved.data.fields.state.stringValue) : null;
// Always require live Sheets. Never send based on a stale fallback snapshot or partial fetch.
const events = matchEvents(await loadLive());
if (!events.length) throw new Error('No complete live matches; state left unchanged.');
const state = advanceState(previous,events);
async function save() {
  const condition = revision ? `currentDocument.updateTime=${encodeURIComponent(revision)}` : 'currentDocument.exists=false';
  const result = await request(base+'/pushPrivate/pomState?'+condition,{method:'PATCH',body:JSON.stringify({fields:{state:{stringValue:JSON.stringify(state)}}})});
  if (!result.ok) throw new Error('State update failed; stopping to prevent duplicate sends: '+result.status);
  revision = result.data.updateTime;
}
await save();
if (!previous) console.log('Initial baseline saved. No historical notifications sent.');
const status = await request(base+'/pushPublic/status',{method:'PATCH',body:JSON.stringify({fields:{enabled:{booleanValue:true},checkedAt:{timestampValue:new Date().toISOString()}}})});
if (!status.ok) throw new Error('Cannot publish readiness: '+status.status);

const subscribers = new Map();
if (Object.keys(state.pending).length) {
  let pageToken = '';
  do {
    const result = await request(base+'/pushSubscriptions?'+new URLSearchParams({pageSize:'300',...(pageToken?{pageToken}:{})}));
    if (!result.ok) throw new Error('Cannot read subscriptions: '+result.status);
    for (const doc of result.data.documents || []) {
      const token = doc.fields?.token?.stringValue;
      if (token && doc.fields.pomEnabled?.booleanValue !== false) subscribers.set(digest(token), {token,language:doc.fields.language?.stringValue || 'en',name:doc.name,updateTime:doc.updateTime});
    }
    pageToken = result.data.nextPageToken || '';
  } while (pageToken);
}
let sent = 0, failed = 0;
for (const [id,event] of Object.entries(state.pending)) {
  if (event.targets === null) {event.targets=[...subscribers.keys()];await save();}
  for (const key of event.targets) {
    if (event.attempted[key]) continue;
    const subscriber = subscribers.get(key);
    // Durable claim BEFORE the request: at-most-once attempts, even after a timeout/crash.
    // An ambiguous delivery is deliberately not retried (FCM has no exactly-once guarantee).
    event.attempted[key] = subscriber ? 'claimed' : 'unsubscribed';
    await save();
    if (!subscriber) continue;
    try {
      const result = await request(`https://fcm.googleapis.com/v1/projects/${project}/messages:send`,{method:'POST',body:JSON.stringify({message:{token:subscriber.token,data:notificationData(event,subscriber.language),webpush:{headers:{TTL:'86400',Urgency:'normal'}}}})});
      event.attempted[key] = result.ok ? 'sent' : 'failed';
      if (result.ok) sent++; else {
        failed++;
        const expired = result.data.error?.details?.some(d=>d.errorCode==='UNREGISTERED');
        if (expired) await request(`https://firestore.googleapis.com/v1/${subscriber.name}?currentDocument.updateTime=${encodeURIComponent(subscriber.updateTime)}`,{method:'DELETE'});
        console.warn('Push request failed with HTTP status',result.status); // Never log device tokens or response bodies.
      }
    } catch {event.attempted[key]='unknown';failed++;console.warn('Push delivery uncertain; not retrying to avoid duplicates.');}
    await save();
  }
  state.seen[id] = true;
  delete state.pending[id];
  await save();
}
console.log(`Complete matches: ${events.length}; notifications accepted: ${sent}; failed/uncertain: ${failed}.`);
if (failed) process.exitCode = 1;
