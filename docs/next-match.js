(() => {
  if(seasonKey!=='26-27')return;
  const card=document.createElement('section');card.id='next-match';card.className='next-match-card';card.hidden=true;card.setAttribute('translate','no');
  document.getElementById('season-context').insertAdjacentElement('afterend',card);
  let schedule=null,lastCheck=null,failed=false,busy=false;
  function render(){
    if(!schedule){card.hidden=true;return;}
    const ko=document.documentElement.lang==='ko',left=schedule.startsAt-Date.now();
    if(left<=0){card.hidden=true;return;}
    const f=LCCNextMatch.format(schedule,ko),minutes=Math.ceil(left/60000),days=Math.floor(minutes/1440),hours=Math.floor(minutes%1440/60),mins=minutes%60;
    const countdown=ko?`${days?days+'일 ':''}${hours}시간 ${mins}분 남음`:`${days?days+'d ':''}${hours}h ${mins}m to go`;
    card.hidden=false;card.innerHTML=`<div><span class="eyebrow">${ko?'다음 경기':'NEXT MATCH'}</span><h2>${esc(f.date)}</h2><p>${esc(f.series)}</p></div><div class="next-match-right"><strong>${countdown}</strong><span>${ko?'설정 ⚙️에서 일정 알림을 켤 수 있어요.':'Enable schedule alerts in Settings ⚙️.'}</span>${failed?`<span>${ko?'일정 갱신 실패 · 마지막 확인':'Update unavailable · Last checked'} ${new Date(lastCheck).toLocaleTimeString(ko?'ko-KR':'en-US',{hour:'2-digit',minute:'2-digit'})}</span>`:''}</div>`;
  }
  async function refresh(){if(busy)return;busy=true;try{schedule=LCCNextMatch.parse(await readSheet('NextMatch'));lastCheck=Date.now();failed=false;}catch{failed=true;}finally{busy=false;render();}}
  refresh();setInterval(()=>{render();if(!document.hidden)refresh();},60000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
  document.getElementById('refresh-live').addEventListener('click',refresh);
  new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
})();
