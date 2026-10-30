const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync(require('node:path').join(__dirname,'../docs/app.js'),'utf8');
const fn=source.split('\n').find(line=>line.startsWith('function matchLabel('));
const context=vm.createContext({rows:['26101504','26100301','26100901','26101103','26101501','26101504'].map(match=>({match}))});
vm.runInContext(fn,context);
assert.equal(vm.runInContext("matchLabel('26100301')",context),'Matchday 1 · Set 1');
assert.equal(vm.runInContext("matchLabel('26101504')",context),'Matchday 4 · Set 4');
assert.equal(vm.runInContext("matchLabel('26101103')",context),'Matchday 3 · Set 3');
context.rows=[{match:'25090102'}];
assert.equal(vm.runInContext("matchLabel('25090102')",context),'Matchday 1 · Set 2');
console.log('Matchday numbering, duplicate rows, set suffix and season reset passed');

context.rows=['26100301','26100901','26101101','26101501','26101701','26102401','26103001','26103002','26103101'].map(match=>({match}));
assert.equal(vm.runInContext("matchLabel('26103101')",context),'Matchday 7 · Set 3');
assert.equal(vm.runInContext("matchLabel('26103002')",context),'Matchday 7 · Set 2');
console.log('Midnight game stays in Matchday 7 as Set 3');
