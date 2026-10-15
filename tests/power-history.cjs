const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const c={console,rows:[],document:{addEventListener(){}},link:(t,id)=>'#'+t+'/'+id,n:(x,d)=>x==null?'N/A':x.toFixed(d),esc:String};
vm.createContext(c);
vm.runInContext(fs.readFileSync('docs/app.js','utf8').split('\n').find(line=>line.startsWith('function matchLabel(')),c);
for(const file of ['power-ranking.js','power-chart.js','power-history.js']) vm.runInContext(fs.readFileSync('docs/'+file,'utf8'),c);
const base={lane:'Top',kills:5,deaths:2,assists:4,kp:.6,dpm:400,gpm:350,vpm:1};
const records=[
 {...base,player:'A',match:'26100101'}, {...base,player:'B',match:'26100101',kills:2},
 {...base,player:'A',match:'26100102',kills:7}, {...base,player:'B',match:'26100102'},
 {...base,player:'B',match:'26100301',kills:12}, {...base,player:'C',match:'26100301'}
];
const h=c.dailyPlayerPower('A',records);
assert.equal(h.length,2);assert.equal(h[0].day,'261001');assert.equal(h[1].day,'261003');
assert.equal(h[0].current.games,2);assert.equal(h[0].rankDelta,null);
const expected=c.calculatePowerRankings(records.slice(0,4)).find(p=>p.name==='A');
assert.equal(h[0].current.score,expected.score);assert.equal(h[0].current.rank,expected.rank);
assert.equal(h[1].current.score,c.calculatePowerRankings(records).find(p=>p.name==='A').score);
assert.equal(c.dailyPlayerPower('C',records)[0].rankDelta,null);
assert.equal(c.dailyPlayerPower('Unknown',records).length,0);
assert.equal(c.dailyPlayerPower('A',[]).length,0);
c.rows=records;const html=c.powerProfileSummary('A');
assert.ok(html.includes('Daily power history'));assert.ok(html.includes('<svg'));assert.ok(!html.includes('<tbody>'));
const header=html.split('<section class="power-chart"')[0];
assert.equal((header.match(/class="power-profile-delta"/g)||[]).length,2);
assert.ok(header.includes(c.scoreChangeBadge(h[1].scoreDelta)));
assert.ok(header.includes(c.rankChangeBadge(h[1].rankDelta)));
assert.ok(header.includes('2026.10.03 ← 2026.10.01'));
const games=c.playerGamePower('A',records);
assert.equal(games.length,3);assert.equal(games[2].played,false);
assert.equal(games[0].current.score,c.calculatePowerRankings(records.slice(0,2)).find(p=>p.name==='A').score);
assert.equal(games.at(-1).current.score,h.at(-1).current.score);
assert.equal((html.match(/data-power-point=/g)||[]).length,3);
assert.ok(html.includes('stroke')===false); // styling is provided separately
assert.equal(c.playerGamePower('C',records).length,1);
assert.equal(c.playerGamePower('Unknown',records).length,0);
const selected={},readout={};
const section={dataset:{powerPlayer:'A'},querySelector:s=>s==='.power-chart-select'?selected:readout,querySelectorAll:()=>[]};
c.selectPowerChartPoint(section,0);assert.equal(selected.value,'0');assert.ok(readout.innerHTML.includes('26100101'));
c.selectPowerChartPoint(section,2);assert.equal(selected.value,'2');assert.ok(readout.innerHTML.includes('Did not play'));
for(const file of ['data.json','data-25-26.json']) {
 const records=JSON.parse(fs.readFileSync('docs/'+file,'utf8')).rows;
 const snapshots=c.dailyPowerSnapshots(records),last=snapshots.at(-1);
 const ranks=c.calculatePowerRankings(records);
 for(const p of ranks){assert.equal(last.byName.get(p.name).score,p.score);assert.equal(last.byName.get(p.name).rank,p.rank);}
 const games=c.gamePowerSnapshots(records);
 for(const p of ranks){assert.equal(games.at(-1).byName.get(p.name).score,p.score);assert.equal(games.at(-1).byName.get(p.name).rank,p.rank);}
}
console.log('PASS daily grouping, no future leakage, inactive players, new players, empty data, both seasons and current-score parity');
