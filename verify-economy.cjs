'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=async function verifyEconomy({simulations=64}={}){
 const files=['atlas.js','systems.js','journey.js','adventures.js','saves.js','game.js'];
 const source=files.map(f=>fs.readFileSync(path.join(__dirname,'tycoon',f),'utf8').split("$('#roll').onclick=")[0]).join('\n');
 let seed=1;const math=Object.create(Math);math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const el={hidden:true,classList:{add(){},remove(){}}};
 const ctx=vm.createContext({Math:math,console,setTimeout:()=>0,clearTimeout(){},document:{querySelector:()=>el}});
 vm.runInContext(source+'\nrender=()=>{};save=()=>{};scheduleAI=()=>{};toast=()=>{};beep=()=>{};showAssets=()=>{};showResults=()=>{};delay=async()=>{};',ctx);
 vm.runInContext("const v50MakeGame=makeGame;makeGame=(opts={})=>v50MakeGame({...opts,development:'portfolio',comfort:false})",ctx);
 let checks=0;const test=(name,code)=>{assert.equal(vm.runInContext('{'+code+'}',ctx),true,name);checks++;console.log('PASS '+name)};
 test('Default is 20 rounds, 10000 cash and fast movement',`state=makeGame();fastRules()&&state.limit===20&&current().cash===10000&&state.speed===25`);
 test('One isolated property can reach level one',`state.props[1].owner=0;build(1,false);state.props[1].level===1&&current().cash===9500`);
 test('One isolated property cannot reach level two and explains why',`!canBuild(current(),tiles[1])&&buildReason(current(),tiles[1]).includes('两块')`);
 test('Two out of three properties unlock level two without a monopoly',`state.props[2].owner=0;build(1,false);state.props[1].level===2&&!canBuild(current(),tiles[1])`);
 test('Partial color ownership with buildings survives save restore',`state=normalizeSave(state);activateMap(state.map,fastRules());state.props[1].level===2&&state.economy.v===5`);
 test('High levels still require balanced full ownership',`state.props[4].owner=0;const a=!canBuild(current(),tiles[1]);state.props[2].level=2;state.props[4].level=2;const b=canBuild(current(),tiles[1]);a&&b`);
 test('Invalid partial group level three is rejected',`state=makeGame();state.props[1]={owner:0,level:3,mortgage:false};let fail=false;try{normalizeSave(state)}catch(e){fail=true}fail`);
 test('Maturity increases rent at rounds six and twelve',`state=makeGame();state.props[1].owner=0;const a=rent(tiles[1]);state.round=6;const b=rent(tiles[1]);state.round=12;rent(tiles[1])>b&&b>a`);
 test('Upkeep only charges once on the scheduled round',`state=makeGame();state.props[1]={owner:0,level:1,mortgage:false};state.round=8;economyTurn(current());const cash=current().cash;economyTurn(current());cash===9800&&current().cash===cash`);
 test('Rich illiquid owner can enter debt from upkeep',`state=makeGame();[29,30,31].forEach(i=>state.props[i]={owner:0,level:4,mortgage:false});current().cash=100;state.round=8;economyTurn(current());current().cash<0&&auditFee(current())>500`);
 test('Low cash alone does not grant aid to wealthy owner',`!state.economy.relief[0]`);
 test('Eligible underdog receives aid once after save restore',`state=makeGame();state.round=6;current().cash=100;state.players[1].cash=20000;tryRelief(current());const a=current().cash===2100;state=normalizeSave(state);current().cash=100;tryRelief(current());a&&current().cash===100`);
 test('Aid unavailable before round six',`state=makeGame();current().cash=100;tryRelief(current());current().cash===100`);
 test('New auction steps are 500 after restoration',`state=makeGame({count:2,mode:'local'});startAuction(1);auctionBid(true);state=normalizeSave(state);state.auction.price===500&&state.auction.step===500`);
 test('Developed neighbor does not freeze safe undeveloped trades',`state=makeGame();state.props[1]={owner:1,level:1,mortgage:false};state.props[2].owner=1;tradeable(2,1)&&transferProperty(2,1500,0,1)`);
 test('Trade cannot leave ineligible level two with seller',`state=makeGame();state.props[1]={owner:1,level:2,mortgage:false};state.props[2].owner=1;!tradeable(2,1)`);
 test('Can liquidate own lower building despite higher opponent building',`state=makeGame({mode:'local'});state.props[1]={owner:0,level:1,mortgage:false};state.props[2]={owner:1,level:2,mortgage:false};state.props[4].owner=1;const cash=current().cash;sellBuilding(1);state.props[1].level===0&&current().cash>cash`);
 test('Maps have distinct nonascending price routes',`new Set(MAPS.map(m=>{state=makeGame({map:m.id});return tiles.filter(t=>t.type==='property').map(t=>t.price).join(',')})).size===8`);
 test('Old games retain cash pricing and building gate',`state=makeGame({economy:false});state.props[1].owner=0;!fastRules()&&current().cash===15000&&!canBuild(current(),tiles[1])&&startGrant()===2000`);
 test('Legacy saves never gain new economy',`state=normalizeSave(state);!fastRules()&&!state.economy`);
 const reports=[];
 for(const modern of [false,true]){
  const rows=[];
  for(let game=0;game<simulations;game++){
   seed=game+20261031;ctx.simOptions={map:['world','asia','europe','africa','north-america','south-america','oceania','antarctica'][game%8],economy:modern,limit:20,count:4};
   const result=await vm.runInContext(`(async()=>{state=makeGame(simOptions);state.players.forEach(p=>p.ai=true);let steps=0,firstBuild=0,leaderAt8=null,bottomAt8=null;while(!state.over&&steps++<6000){if(state.round===8&&leaderAt8===null){const order=[...state.players].filter(p=>!p.out).sort((a,b)=>worth(b)-worth(a));leaderAt8=order[0].id;bottomAt8=order[order.length-1].id}if(current().cash<0){liquidate(current());if(current().cash<0){bankrupt(current());continue}}if(state.phase==='roll')await roll();else if(state.phase==='auction')auctionAI();else if(state.phase==='trade')resolveOffer(false);else aiStep();if(!firstBuild&&state.props.some(r=>r.level>0))firstBuild=state.round;normalizeSave(state)}if(!state.over||steps>=6000)throw Error('Simulation did not finish '+JSON.stringify({simOptions,round:state.round,phase:state.phase,cash:current().cash,busy}));const rank=[...state.players].sort((a,b)=>(a.out-b.out)||worth(b)-worth(a));return {firstBuild:firstBuild||21,bankrupt:state.players.filter(p=>p.out).length,winner:rank[0].id,leaderAt8,bottomAt8,steps,relief:Object.keys(state.economy?.relief||{}).length}})()`,ctx);
   rows.push(result);
  }
  const mean=k=>Math.round(rows.reduce((n,r)=>n+r[k],0)/rows.length*100)/100;
  reports.push({economy:modern?'v5':'v4',games:rows.length,meanFirstBuildRound:mean('firstBuild'),meanSteps:mean('steps'),meanBankrupt:mean('bankrupt'),leadChangedAfterRound8:rows.filter(r=>r.leaderAt8!==r.winner).length,bottomAt8Won:rows.filter(r=>r.bottomAt8===r.winner).length,aidRecipients:rows.reduce((n,r)=>n+r.relief,0)});
 }
 assert.ok(reports[1].meanFirstBuildRound<reports[0].meanFirstBuildRound,'Construction must start earlier');checks++;
 assert.ok(reports[1].leadChangedAfterRound8>0,'Leadership must not be locked');checks++;
 const engine=require('./server/engine.cjs')();let s=engine.init({map:'world',development:'portfolio',comfort:false},['A','B']);s.props[1].owner=0;engine.restore(s,{migrate:false});await engine.act(0,'build',{tile:1});assert.equal(engine.snapshot().props[1].level,1);checks++;
 const restored=require('./server/engine.cjs')();restored.restore(engine.snapshot(),{migrate:false});await assert.rejects(()=>restored.act(1,'build',{tile:1}));checks++;
 console.log(JSON.stringify({checks,reports},null,2));return {checks,reports};
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1});
