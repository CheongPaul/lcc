// Shared by the browser and scheduled sender. All sheet times are Asia/Seoul.
globalThis.LCCNextMatch = {
  parse(table, now = Date.now()) {
    const labels=table.cols.map(c=>c.label.trim());
    for(const name of ['Date','Time','Best of'])if(!labels.includes(name))throw Error('NextMatch columns must be Date, Time, Best of');
    const upcoming=[];
    for(const row of table.rows) {
      const cell=name=>row.c[labels.indexOf(name)];
      const raw=String(cell('Date')?.v??'').trim();
      if(!raw)continue;
      let date=raw.match(/^(\d{2})(\d{2})(\d{2})$/);
      let y,m,d;
      if(date){y=2000+Number(date[1]);m=Number(date[2]);d=Number(date[3]);}
      else {date=raw.match(/^Date\((\d+),(\d+),(\d+)/);if(!date)throw Error('Invalid NextMatch date');y=+date[1];m=+date[2]+1;d=+date[3];}
      const time=cell('Time')?.v;
      let h,minute;
      if(Array.isArray(time)){[h,minute]=time;}
      else if(typeof time==='number'&&time>=0&&time<1){const total=Math.round(time*1440);h=Math.floor(total/60);minute=total%60;}
      else {const match=String(time??'').match(/^Date\(\d+,\d+,\d+,(\d+),(\d+)/)||String(time??'').match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);if(!match)throw Error('Invalid NextMatch time');h=+match[1];minute=+match[2];}
      const bestOf=Number(cell('Best of')?.v);
      const check=new Date(Date.UTC(y,m-1,d));
      if(!Number.isInteger(h)||!Number.isInteger(minute)||check.getUTCFullYear()!==y||check.getUTCMonth()!==m-1||check.getUTCDate()!==d||h<0||h>23||minute<0||minute>59||![3,5].includes(bestOf))throw Error('Invalid NextMatch schedule');
      const startsAt=Date.UTC(y,m-1,d,h-9,minute);
      if(startsAt>now)upcoming.push({startsAt,bestOf,key:`${startsAt}-${bestOf}`});
    }
    return upcoming.sort((a,b)=>a.startsAt-b.startsAt)[0]||null;
  },
  format(schedule,ko=false) {
    const date=new Intl.DateTimeFormat(ko?'ko-KR':'en-US',{timeZone:'Asia/Seoul',month:'long',day:'numeric',weekday:'short',hour:'numeric',minute:'2-digit'}).format(schedule.startsAt);
    return {date:date+' (KST)',series:ko?`${schedule.bestOf}판 ${Math.ceil(schedule.bestOf/2)}선승`:`Best of ${schedule.bestOf} · First to ${Math.ceil(schedule.bestOf/2)} wins`};
  }
};
