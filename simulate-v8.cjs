'use strict';
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),createEngine=require('./server/engine.cjs');
const maps=['world','asia','europe','africa','north-america','south-america','oceania','antarctica','legacy'];
function rng(seed){return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
module.exports=async function({experience=true}={}){
 const core=['atlas.js','systems.js','journey.js','adventures.js','expansion.js','experience.js','saves.js','game.js'].map(f=>fs.readFileSync(path.join(__dirname,'tycoon',f),'utf8').split("$('#roll').onclick=")[0]).join('\n'),ctx=vm.createContext({document:{querySelector:()=>({hidden:true,classList:{add(){},remove(){}}})},setTimeout:()=>0,clearTimeout(){}});vm.runInContext(core,ctx);
 const reports=[];for(const limit of [12,30,60]){let games=0,stepsTotal=0,bankrupt=0,debtGames=0,leaderChanges=0,tailWins=0,wealth=0;const wins={builder:0,traveler:0,steady:0};
 for(const map of maps)for(const count of [2,3,4])for(const seed of [1,2]){
  const engine=createEngine({random:rng(seed*733+maps.indexOf(map)*1009+count*47)});let s=engine.init({experience,expansion:true,map,limit,difficulty:seed===1?'normal':'expert'},Array.from({length:count},(_,i)=>({name:'P'+i,bot:true,career:['architect','traveler','banker','merchant'][i]}))),steps=0,leaders=null,debt=false;
  const net=p=>vm.runInContext('worth(state.players['+p.id+'])',ctx);
  while(!s.over&&steps++<12000){ctx.sample=s;vm.runInContext('state=sample;activateMap(state.map,true);normalizeSave(state)',ctx);if(s.players.some(p=>p.cash<0))debt=true;if(s.round>=Math.min(8,Math.floor(limit/2))&&!leaders){const rank=s.players.filter(p=>!p.out).sort((a,b)=>net(b)-net(a));leaders=[rank[0].id,rank.at(-1).id]}await engine.botStep();s=engine.snapshot()}
  if(!s.over)throw Error('Stalled '+map+' '+count+' '+limit+' '+seed);ctx.sample=s;vm.runInContext('state=sample;activateMap(state.map,true);normalizeSave(state)',ctx);const winner=s.players.filter(p=>!p.out).sort((a,b)=>net(b)-net(a))[0];if(leaders&&leaders[0]!==winner.id)leaderChanges++;if(leaders&&leaders[1]===winner.id)tailWins++;if(experience)wins[s.experience.personalities[winner.id]]++;games++;stepsTotal+=steps;bankrupt+=s.players.filter(p=>p.out).length;if(debt)debtGames++;wealth+=s.players.reduce((n,p)=>n+net(p),0)/count;
 }
 reports.push({limit,games,meanSteps:Math.round(stepsTotal/games),bankruptPlayers:bankrupt,gamesWithDebt:debtGames,midgameLeaderDidNotWin:leaderChanges,midgameLastWon:tailWins,meanFinalNetWorth:Math.round(wealth/games),...(experience?{personalityWins:wins}:{})});}
 return {version:experience?'V8':'V7',games:162,maps:9,playerCounts:[2,3,4],limits:[12,30,60],reports,note:'Seeded AI regression games, not human win rates. Early wealth and late risk must be assessed separately. Quick-game minutes are an estimate, not measured by this simulation.'};
};
if(require.main===module)module.exports({experience:!process.argv.includes('--v7')}).then(r=>console.log(JSON.stringify(r,null,2))).catch(e=>{console.error(e);process.exitCode=1});
