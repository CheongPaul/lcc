// Public, read-only Google Sheets feed. No credentials or API key in the client.
const LCC_SHEET_ID='1rmFSc8JZ4NT_7h14pc6CLkdG0Gi8GcSFLfRbh1nOSmM';
const LCC_SHEET_URL=`https://docs.google.com/spreadsheets/d/${LCC_SHEET_ID}/edit`;
let liveBusy=false,liveLastSuccess=null,liveSequence=0;
function readSheet(name){return new Promise((resolve,reject)=>{
 const callback=`lccSheet_${Date.now()}_${liveSequence++}`,script=document.createElement('script');
 const clean=()=>{clearTimeout(timer);script.remove();delete window[callback]};
 const timer=setTimeout(()=>{clean();reject(new Error('Google Sheets request timed out'))},25000);
 window[callback]=response=>{clean();if(response.status!=='ok'||!response.table)reject(new Error('Sheet not readable'));else resolve(response.table)};
 script.onerror=()=>{clean();reject(new Error('Google Sheets unavailable'))};
 const query=new URLSearchParams({sheet:name,headers:'1',tqx:`out:json;responseHandler:${callback}`});
 script.src=`https://docs.google.com/spreadsheets/d/${LCC_SHEET_ID}/gviz/tq?${query}`;
 document.head.appendChild(script);
})}
function sheetRecords(table){const labels=table.cols.map(c=>c.label.trim());return table.rows.map(row=>Object.fromEntries(labels.map((key,i)=>[key,row.c[i]??{v:null}])))}
function sheetSeconds(cell){
 const v=cell?.v;
 if(typeof v==='number')return v*86400;
 if(Array.isArray(v))return v[0]*3600+v[1]*60+v[2];
 const date=String(v??'').match(/^Date\(([^)]+)\)$/);
 if(date){const x=date[1].split(',').map(Number);return (x[3]||0)*3600+(x[4]||0)*60+(x[5]||0)}
 const parts=String(cell?.f??v??'').split(':').map(Number);
 return parts.length===3?parts[0]*3600+parts[1]*60+parts[2]:parts.length===2?parts[0]*60+parts[1]:NaN;
}
function parsePlayerSheet(table,player){
 const fields={kills:'Kills',deaths:'Deaths',assists:'Assists',damage:'Damage Dealt',cs:'CS',gold:'Gold',vision:'Vision',firstBlood:'First Blood',win:'Win',teamKills:'Total Kills of Game',cc:'CC'};
 const required=['Match ID','Game Time','Champion','Lane',...Object.values(fields)];
 if(required.some(k=>!table.cols.some(c=>c.label.trim()===k)))throw new Error('Player sheet columns changed');
 const result=[],pending=new Set();
 for(const cells of sheetRecords(table)){
  const id=cells['Match ID']?.v;if(id===null||id===undefined||id==='')continue;
  const match=String(id),seconds=sheetSeconds(cells['Game Time']);
  const row={player,match,seconds,champion:cells.Champion?.v,lane:cells.Lane?.v};
  for(const [key,label] of Object.entries(fields)){const value=cells[label]?.v;row[key]=value===null||value===undefined||value===''?NaN:Number(value)}
  if(!/^\d{8}$/.test(match)||!Number.isFinite(seconds)||seconds<=0||!row.champion||!row.lane||Object.keys(fields).some(k=>!Number.isFinite(row[k])||row[k]<0)||![0,1].includes(row.win)||![0,1].includes(row.firstBlood)){pending.add(match);continue}
  const minute=seconds/60;
  for(const [key,label,total] of [['cspm','Cs per Min','cs'],['gpm','Gold Per Min','gold'],['dpm','Damage Per Min','damage'],['vpm','Vision Per Min','vision']]){
   const cached=cells[label]?.v;row[key]=cached!==null&&cached!==undefined&&Number.isFinite(Number(cached))?Number(cached):row[total]/minute;
  }
  const kp=cells['Kill Contribution']?.v;row.kp=kp!==null&&kp!==undefined&&Number.isFinite(Number(kp))?Number(kp):row.teamKills?(row.kills+row.assists)/row.teamKills:0;
  result.push(row);
 }
 return {rows:result,pending};
}
function assembleLive(main,tables){
 const records=sheetRecords(main).filter(r=>r['Player ID']?.v),players=records.map(r=>String(r['Player ID'].v));
 if(players.length!==10||new Set(players).size!==10)throw new Error('Expected ten unique players in Main');
 const parsed=tables.map((table,i)=>parsePlayerSheet(table,players[i])),pending=new Set(parsed.flatMap(p=>[...p.pending]));
 const all=parsed.flatMap(p=>p.rows),byMatch=Object.groupBy(all,r=>r.match);let complete=[];
 for(const [id,match] of Object.entries(byMatch)){
  if(pending.has(id)||match.length!==10||new Set(match.map(r=>r.player)).size!==10||match.filter(r=>r.win===1).length!==5||new Set(match.map(r=>r.seconds)).size!==1){pending.add(id);continue}
  complete.push(...match);
 }
 if(!complete.length)throw new Error('No complete matches available');
 return {source:'Google Sheets',season:'2026–27',ratings:Object.fromEntries(records.map(r=>[String(r['Player ID'].v),r['Top Rating']?.v??'Unlisted'])),rows:complete.sort((a,b)=>a.match.localeCompare(b.match)||a.player.localeCompare(b.player)),pendingMatches:pending.size};
}
function liveStatus(message,state){const target=document.querySelector('#live-status');if(target){target.textContent=message;target.dataset.state=state}const button=document.querySelector('#refresh-live');if(button)button.disabled=liveBusy}
function liveTime(){return liveLastSuccess?.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
async function refreshLive(){
 if(liveBusy)return;liveBusy=true;liveStatus('Checking Google Sheets…','checking');
 try{
  const main=await readSheet('Main'),names=sheetRecords(main).filter(r=>r['Player ID']?.v).map(r=>String(r['Player ID'].v));
  if(names.length!==10)throw new Error('Expected ten player tabs');
  const tables=await Promise.all(names.map(readSheet)),fresh=assembleLive(main,tables);
  const changed=JSON.stringify(fresh.rows)!==JSON.stringify(rows)||JSON.stringify(fresh.ratings)!==JSON.stringify(data.ratings)||data.source!=='Google Sheets';
  data=fresh;rows=fresh.rows;liveLastSuccess=new Date();
  if(changed){const y=window.scrollY;const inputs={};for(const id of ['search','role','matchsearch','champsearch','champsort']){const input=document.getElementById(id);if(input)inputs[id]=input.value}route();for(const [id,value] of Object.entries(inputs)){const input=document.getElementById(id);if(input)input.value=value}for(const id of ['search','matchsearch','champsearch']){const input=document.getElementById(id);if(input?.oninput)input.oninput({target:input})}window.scrollTo(0,y)}
  liveStatus(`Google Sheets · Checked ${liveTime()}${fresh.pendingMatches?' · '+fresh.pendingMatches+' incomplete match(es) excluded':''}`,'live');
 }catch(error){liveStatus(liveLastSuccess?`Update unavailable · Showing last sync at ${liveTime()}`:'Google Sheets unavailable · Showing uploaded workbook snapshot','offline')}
 finally{liveBusy=false;const button=document.querySelector('#refresh-live');if(button)button.disabled=false}
}
function startLive(){document.querySelector('#refresh-live').onclick=refreshLive;refreshLive();setInterval(()=>{if(!document.hidden)refreshLive()},60000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshLive()})}
