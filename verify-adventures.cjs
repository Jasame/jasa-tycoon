'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=async function verifyAdventures(){
 const files=['atlas.js','systems.js','journey.js','adventures.js','saves.js','game.js'],base=path.join(__dirname,'tycoon');
 const core=files.map(f=>fs.readFileSync(path.join(base,f),'utf8').split("$('#roll').onclick=")[0]).join('\n');
 const el={hidden:true,classList:{add(){},remove(){}}};
 const context=vm.createContext({console,setTimeout:()=>0,clearTimeout(){},document:{querySelector:()=>el},localStorage:{getItem:()=>null,setItem(){}}});
 vm.runInContext(core+'\nrender=()=>{};save=()=>{};scheduleAI=()=>{};toast=()=>{};beep=()=>{};showAssets=()=>{};showResults=()=>{};',context);
 vm.runInContext('const originalMakeGame=makeGame;makeGame=(opts={})=>originalMakeGame({...opts,economy:false})',context);
 let checks=0;
 function test(name,code){assert.equal(vm.runInContext('{'+code+'}',context),true,name);checks++;console.log('PASS '+name)}
 test('New games share exactly three unique missions for all seats',`state=makeGame();state.adventure.missions.length===3&&new Set(state.adventure.missions).size===3&&state.adventure.missions.includes('explorer')&&state.adventure.missions.includes('collector')`);
 test('Revisiting a city cannot farm mission progress',`state=makeGame();for(let i=0;i<10;i++)adventureLanding(current(),tiles[1]);missionProgress(current(),'explorer')===1&&current().cash===15000`);
 test('Four distinct property visits grant one exact reward',`[2,4,6].forEach(i=>adventureLanding(current(),tiles[i]));checkAdventures(current());current().cash===15600&&adventurePlayer(current()).completed.filter(x=>x==='explorer').length===1`);
 test('Save restore retains awarded missions without duplicate cash',`state=normalizeSave(state);checkAdventures(current());current().cash===15600&&adventurePlayer(current()).visited.length===4`);
 test('Fifth property purchase triggers collector mission',`state=makeGame();[1,2,4,5].forEach(i=>state.props[i].owner=0);state.phase='buy';state.pending=6;buy();state.players[0].cash===15000-tiles[6].price+600&&adventurePlayer(state.players[0]).completed.includes('collector')`);
 test('Auction winner receives collector credit independently of turn',`state=makeGame({count:2,mode:'local'});[1,2,4,6].forEach(i=>state.props[i].owner=1);startAuction(5);auctionBid(false);auctionBid(true);state.players[1].cash===15500&&adventurePlayer(state.players[1]).completed.includes('collector')`);
 test('Trade purchase triggers collector reward once',`state=makeGame();[1,2,4,6].forEach(i=>state.props[i].owner=0);state.props[5].owner=1;transferProperty(5,100,0,1)&&current().cash===15500&&adventurePlayer(current()).completed.includes('collector')`);
 test('Three valid upgrades complete builder mission',`state=makeGame();state.adventure.missions=['explorer','collector','builder'];[1,2,4].forEach(i=>state.props[i].owner=0);const cash=current().cash;[1,2,4].forEach(i=>build(i,false));adventurePlayer(current()).builds===3&&current().cash===cash-cost(tiles[1])-cost(tiles[2])-cost(tiles[4])+600`);
 test('Last second-level building unlocks exactly one landmark',`state=makeGame();[1,2,4].forEach(i=>state.props[i]={owner:0,level:2,mortgage:false});state.props[4].level=1;build(4,false);checkAdventures(current());state.adventure.landmarks.length===1&&landmarkActive(0,0)`);
 test('Landmark tourism pays only once per player per round',`const before=current().cash;adventureTurn(current());adventureTurn(current());current().cash===before+200`);
 test('Selling below level two suspends tourism without deleting honor',`state.round++;state.props[1].level=1;const before=current().cash;adventureTurn(current());current().cash===before&&state.adventure.landmarks.length===1&&!landmarkActive(0,0)`);
 test('Restoring construction resumes tourism on next turn',`state.round++;state.props[1].level=2;const before=current().cash;adventureTurn(current());current().cash===before+200&&landmarkActive(0,0)`);
 test('Completed landmark and income guard survive save restore',`state=normalizeSave(state);const before=current().cash;adventureTurn(current());current().cash===before&&state.adventure.landmarks.length===1`);
 test('News applies the previously announced factor at round five',`state=makeGame();const forecast=state.adventure.news.next;state.round=5;marketEvent();state.adventure.news.current===forecast&&state.market.factor===WORLD_NEWS[forecast].factor&&state.adventure.news.round===5`);
 test('News forecast survives save restore',`const next=state.adventure.news.next;state=normalizeSave(state);state.adventure.news.next===next`);
 test('Malformed mission names and forecast data are rejected',`state=makeGame();state.adventure.missions[2]='constructor';let a=false,b=false;try{normalizeSave(state)}catch(e){a=true}state=makeGame();state.adventure.news.next=99;try{normalizeSave(state)}catch(e){b=true}a&&b`);
 test('Old saves receive neither missions nor tourism changes',`state=makeGame({adventure:false});[1,2,4].forEach(i=>state.props[i]={owner:0,level:2,mortgage:false});const before=current().cash;checkAdventures(current());adventureTurn(current());state=normalizeSave(state);!hasAdventure()&&current().cash===before`);
 test('All maps complete games with missions news and validated saves',`MAPS.every(m=>{state=makeGame({map:m.id,count:4,limit:20});state.players.forEach(p=>p.ai=true);let steps=0;while(!state.over&&steps++<6000){if(state.phase==='roll'){const p=current(),move=7+(steps%5);for(let k=0;k<move;k++){p.pos=(p.pos+1)%32;if(p.pos===0){p.cash+=2000;onPassStart(p)}}land()}else if(state.phase==='auction')auctionAI();else if(state.phase==='trade')resolveOffer(false);else aiStep();normalizeSave(state)}return state.over&&steps<6000})`);
 const createEngine=require('./server/engine.cjs'),engine=createEngine();let game=engine.init({},['One','Two']);
 assert.equal(game.adventure.missions.length,3);game.adventure.players[0]={visited:[1,2,4],chance:0,builds:0,completed:[],tourismRound:0};game.players[0].pos=6;
 // Exercise the real server engine's roll and snapshot, rather than a UI callback.
 engine.restore(game);await engine.act(0,'roll');game=engine.snapshot();assert.ok(game.adventure&&game.adventure.players[0]);checks++;
 const restored=createEngine();restored.restore(game);assert.equal(JSON.stringify(restored.snapshot().adventure),JSON.stringify(game.adventure));checks++;
 console.log(checks+' adventure checks passed');return checks;
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1});
