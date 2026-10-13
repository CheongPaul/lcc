const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const root=require('path').join(__dirname,'../docs/');
for(const season of ['25-26','26-27']){
 const nodes={};const node=id=>nodes[id]??=( {innerHTML:'',textContent:'',value:id==='champsort'?'games':'',dataset:{},querySelector(){return null},setAttribute(){},focus(){},addEventListener(){},classList:{toggle(){},remove(){}}});
 const document={querySelector:s=>node(s.slice(1)),getElementById:node,querySelectorAll:()=>[],documentElement:{dataset:{}},addEventListener(){}};
 const context=vm.createContext({document,URL,URLSearchParams,location:{href:`https://cheongpaul.github.io/lcc/?season=${season}`,hash:'#overview'},history:{replaceState(){}},addEventListener(){},window:{scrollTo(){}},fetch:()=>new Promise(()=>{}),console});
 for(const file of ['seasons.js','live.js','champion-art.js','app.js','power-ranking.js','leaderboard.js','about-simple.js','compare.js'])vm.runInContext(fs.readFileSync(root+file,'utf8'),context);
 context.fixture=JSON.parse(fs.readFileSync(root+(season==='25-26'?'data-25-26.json':'data.json')));
 vm.runInContext('data=normalizeSeasonData(fixture);rows=data.rows',context);
 const allRows=vm.runInContext('rows',context);
 assert.equal(new Set(allRows.map(r=>r.player)).size,10);
 if(season==='25-26'){assert.equal(allRows.length,299);assert.equal(new Set(allRows.map(r=>r.match)).size,33);assert(allRows.every(r=>r.cc===null&&!['내꿈은 코르키#5877','절불이라능#KR1'].includes(r.player)));}
 const power=vm.runInContext('powerRankings()',context);assert.equal(power.length,10);assert(power.every(p=>Number.isFinite(p.score)&&p.score>=0&&p.score<=100));
 const cards=vm.runInContext('seasonStandoutCards()',context);assert.equal((cards.match(/class="leader power-leader"/g)||[]).length,3);assert.equal((cards.match(/class="ghost"/g)||[]).length,3);assert.equal(cards,vm.runInContext('seasonStandoutCards()',context));
 for(const p of power.slice(0,3))assert(cards.includes('#player/'+encodeURIComponent(p.name)));
 const names=[...new Set(allRows.map(r=>r.player))];
 context.compareNames=names;
 const url=vm.runInContext('comparisonURL(compareNames[0],compareNames[1])',context);
 assert(new URL(url).searchParams.get('season')===season);
 assert.equal(decodeURIComponent(new URL(url).hash.split('/')[2]),names[1]);
 context.location.hash='#compare/'+encodeURIComponent(names[0])+'/'+encodeURIComponent(names[1]);
 vm.runInContext('route()',context);
 assert.match(nodes.app.innerHTML,/Player comparison/);assert.match(nodes.app.innerHTML,/Average damage/);assert.match(nodes.app.innerHTML,/ \/ min/);
 assert(document.title.includes(names[0])&&document.title.includes(names[1]));
 if(season==='25-26')assert.match(nodes.app.innerHTML,/Total CC<\/th><td>N\/A<\/td><td>N\/A/);
 node('compare-a').value=names[0];node('compare-b').value=names[0];nodes['compare-update'].onclick();assert.equal(nodes['compare-error'].hidden,false);
 context.location.hash='#compare/%ZZ/missing';vm.runInContext('route()',context);assert.match(nodes.app.innerHTML,/Choose two different players/);
 context.location.hash='#player/'+encodeURIComponent(names[0]);vm.runInContext('route()',context);assert.match(nodes.app.innerHTML,/target="_blank" rel="noopener noreferrer"/);assert.match(nodes.app.innerHTML,/Compare player/);assert.match(nodes.app.innerHTML,/Season rank/);
 const routes=['overview','players','leaderboard','matches','champions','about','player/'+encodeURIComponent('가 타 카#1997'),'player/'+encodeURIComponent('Hip to be Square#Fore'),'champion/Ahri','champion/Aatrox','match/'+context.fixture.rows[0].match];
 for(const route of routes){context.location.hash='#'+route;vm.runInContext('route();updateSeasonContext()',context);assert(nodes.app.innerHTML.length>10);assert(!/NaN|undefined|null|N\/A%/.test(nodes.app.innerHTML),route);assert(document.title.includes(season.replace('-','/')));if(season==='25-26')assert(!nodes.app.innerHTML.includes('26/27'),route)}
 if(season==='25-26'){
 context.location.hash='#leaderboard';vm.runInContext('route()',context);assert.match(nodes.app.innerHTML,/Top CC<\/div><div class="empty"><strong>N\/A/);
 context.location.hash='#players';vm.runInContext('route()',context);nodes.search.value='Hip to be Square';nodes.search.oninput();assert.match(nodes.ranktable.innerHTML,/가 타 카/);assert(!nodes.ranktable.innerHTML.includes('꼬우새연'));
 assert.equal(vm.runInContext("stats(rows.filter(r=>r.player==='가 타 카#1997'),'test').fbGames",context),12);
 }
 console.log(season,': all main/detail routes, browser titles, aliases, search and null-metric rendering passed');
}
