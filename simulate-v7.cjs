'use strict';
const createEngine=require('./server/engine.cjs');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const maps=['world','asia','europe','africa','north-america','south-america','oceania','antarctica','legacy'];
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
module.exports=async function(){
 const base=path.join(__dirname,'tycoon'),core=['atlas.js','systems.js','journey.js','adventures.js','expansion.js','saves.js','game.js'].map(f=>fs.readFileSync(path.join(base,f),'utf8').split("$('#roll').onclick=")[0]).join('\n'),ctx=vm.createContext({document:{querySelector:()=>({hidden:true,classList:{add(){},remove(){}}})},setTimeout:()=>0,clearTimeout(){}});vm.runInContext(core,ctx);
 const reports=[];
 for(const expansion of [false,true]){let games=0,stepsTotal=0,outTotal=0,leaderChanges=0,comebacks=0,wealth=0,builds=0;const wins={architect:0,traveler:0,banker:0,merchant:0};
  for(const map of maps)for(let seed=1;seed<=8;seed++){
   const engine=createEngine({random:rng(seed*733+maps.indexOf(map)*1009)}),careers=Object.keys(wins);let s=engine.init({map,expansion,limit:20},careers.map((_,i)=>({name:'P'+i,bot:true,career:careers[(i+seed)%4]}))),steps=0,leaderAt8=null,bottomAt8=null;
   const net=p=>vm.runInContext('worth(state.players['+p.id+'])',ctx);
   while(!s.over&&steps++<2000){ctx.s=s;vm.runInContext('state=s;activateMap(state.map,true);normalizeSave(state)',ctx);if(s.round>=8&&leaderAt8===null){const ranked=s.players.filter(p=>!p.out).sort((a,b)=>net(b)-net(a));leaderAt8=ranked[0].id;bottomAt8=ranked.at(-1).id}await engine.botStep();s=engine.snapshot();}
   if(!s.over)throw Error('Simulation stalled: '+map+' '+seed);ctx.s=s;vm.runInContext('state=s;activateMap(state.map,true);normalizeSave(state)',ctx);const ranked=s.players.filter(p=>!p.out).sort((a,b)=>net(b)-net(a)),winner=ranked[0];if(leaderAt8!==null&&leaderAt8!==winner.id)leaderChanges++;if(bottomAt8===winner.id)comebacks++;if(expansion)wins[s.expansion.players[winner.id].career]++;games++;stepsTotal+=steps;outTotal+=s.players.filter(p=>p.out).length;wealth+=s.players.reduce((v,p)=>v+net(p),0);builds+=s.props.reduce((v,r)=>v+r.level,0);
  }
  reports.push({mode:expansion?'V7 strategy':'V6 classic',games,meanSteps:Math.round(stepsTotal/games),meanBankruptPlayers:+(outTotal/games).toFixed(2),leaderAt8DidNotWin:leaderChanges,bottomAt8Won:comebacks,meanFinalWealthPerPlayer:Math.round(wealth/games/4),meanBuildingLevels:+(builds/games).toFixed(2),...(expansion?{careerWins:wins}:{})});
 }
 return {games:144,maps:9,turnLimit:20,note:'Seeded rule-based AI games; useful for regressions, not a prediction of human win rates. Net worth ranking uses the shared engine valuation.',reports};
};
if(require.main===module)module.exports().then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
