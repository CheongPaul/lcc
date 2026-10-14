import fs from 'node:fs';
import {pathToFileURL} from 'node:url';
import {loadLive,matchEvents,notificationData} from './pom-source.mjs';

export async function sendSingleDeviceTest({subscriptions,event,claim,send}) {
  const devices = new Map(subscriptions.map(s=>[s.token,s]));
  if (devices.size !== 1) throw new Error(`Test stopped: expected exactly one subscribed device, found ${devices.size}. No notification sent.`);
  if (!event) throw new Error('No completed match available. No notification sent.');
  if (!await claim(event.match)) return {alreadyAttempted:true};
  const subscriber = [...devices.values()][0];
  const data = notificationData(event,subscriber.language);
  data.title = subscriber.language === 'ko' ? '[테스트] 🏆 최근 경기 POM' : '[TEST] 🏆 Latest match POM';
  await send(subscriber.token,data);
  return {match:event.match,player:event.player};
}
async function main() {
  const token = process.env.GOOGLE_ACCESS_TOKEN;
  if (!token) throw new Error('Missing Google access token');
  const request = JSON.parse(fs.readFileSync(new URL('../firebase/pom-test-request.json',import.meta.url),'utf8'));
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(request.id) || request.audience !== 'single-subscriber') throw new Error('Invalid test request');
  const base = 'https://firestore.googleapis.com/v1/projects/lccstats/databases/(default)/documents';
  async function api(url,options={}) {
    const response=await fetch(url,{...options,headers:{Authorization:`Bearer ${token}`,'Content-Type':'application/json'},signal:AbortSignal.timeout(25000)});
    let data;try {data=await response.json();} catch {data={};}
    return {ok:response.ok,status:response.status,data};
  }
  const subscriptions=[];
  let pageToken='';
  do {
    const result=await api(base+'/pushSubscriptions?'+new URLSearchParams({pageSize:'300',...(pageToken?{pageToken}:{})}));
    if (!result.ok) throw new Error('Cannot read subscriptions: '+result.status);
    for (const doc of result.data.documents || []) {
      const deviceToken=doc.fields?.token?.stringValue;
      if (deviceToken) subscriptions.push({token:deviceToken,language:doc.fields.language?.stringValue || 'en'});
    }
    pageToken=result.data.nextPageToken || '';
  } while (pageToken);
  const event=matchEvents(await loadLive()).at(-1);
  const result=await sendSingleDeviceTest({subscriptions,event,
    claim:async match=>{
      const saved=await api(base+'/pushPrivate?documentId=pomTest-'+request.id,{method:'POST',body:JSON.stringify({fields:{match:{stringValue:match},attemptedAt:{timestampValue:new Date().toISOString()}}})});
      if (saved.status===409) return false;
      if (!saved.ok) throw new Error('Cannot claim one-time test: '+saved.status);
      return true;
    },
    send:async(deviceToken,data)=>{
      const sent=await api('https://fcm.googleapis.com/v1/projects/lccstats/messages:send',{method:'POST',body:JSON.stringify({message:{token:deviceToken,data,webpush:{headers:{TTL:'3600',Urgency:'high'}}}})});
      if (!sent.ok) throw new Error('FCM test request failed: HTTP '+sent.status+'. Not retried automatically.');
    }
  });
  if (result.alreadyAttempted) console.log('Test was already attempted; no repeat notification sent.');
  else console.log(`FCM accepted one test notification. Match ${result.match}; POM ${result.player}. Normal match history/state unchanged.`);
}
if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  main().catch(error=>{console.error(error.message);process.exitCode=1;});
}
