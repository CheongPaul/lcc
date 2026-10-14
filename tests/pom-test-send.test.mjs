import test from 'node:test';
import assert from 'node:assert/strict';
import {sendSingleDeviceTest} from '../scripts/send-pom-test.mjs';
const event={match:'26101103',player:'Example#KR1',champion:'Lee Sin',kills:19,deaths:3,assists:6};
test('test refuses zero or multiple devices before claiming or sending',async()=>{
  for(const subscriptions of [[],[{token:'a'},{token:'b'}]]) {
    await assert.rejects(sendSingleDeviceTest({subscriptions,event,claim:()=>assert.fail(),send:()=>assert.fail()}),/expected exactly one/);
  }
});
test('one deduplicated device receives clearly labelled Korean test after durable claim',async()=>{
  let claimed=false,sent=0;
  const result=await sendSingleDeviceTest({subscriptions:[{token:'a',language:'ko'},{token:'a',language:'ko'}],event,claim:async()=>{claimed=true;return true;},send:async(token,data)=>{assert(claimed);assert.equal(token,'a');assert.match(data.title,/테스트/);assert.match(data.body,/리 신/);sent++;}});
  assert.equal(sent,1);assert.equal(result.match,event.match);
});
test('rerunning a previously claimed test never resends',async()=>{
  const result=await sendSingleDeviceTest({subscriptions:[{token:'a'}],event,claim:async()=>false,send:()=>assert.fail()});
  assert.equal(result.alreadyAttempted,true);
});
