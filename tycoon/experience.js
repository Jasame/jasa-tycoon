'use strict';
// V8 is enabled only for new opted-in games. No hidden money or dice bonuses.
const AI_PERSONALITIES={builder:'建设型',traveler:'旅行型',steady:'稳健型'};
const MAP_FOCUS={
 world:['环球探索','到访八处不同地产或枢纽',8],
 asia:['交通网络','持有两座未抵押枢纽',2],
 europe:['铁路经营','持有枢纽时经过起点两次',2],
 africa:['生态保护','持有三处未开发、未抵押地产',3],
 'north-america':['城市营造','完成三次建筑升级',3],
 'south-america':['奇遇之旅','抽取三次机遇卡',3],
 oceania:['海岛连线','到访两座不同枢纽',2],
 antarctica:['联合科考','全体玩家累计升级六次，共享成果',6],
 legacy:['街区经营','同时持有三处地产或枢纽',3]
};
function makeExperience(n,pace='standard',personality='mixed'){
 return {v:8,pace:pace==='quick'?'quick':'standard',personalities:Array.from({length:n},(_,i)=>Object.hasOwn(AI_PERSONALITIES,personality)?personality:Object.keys(AI_PERSONALITIES)[i%3]),rail:Array(n).fill(0),awarded:Array(n).fill(false)};
}
function focusProgress(p){
 const a=state.adventure?.players[p.id],visits=a?.visited||[];
 switch(state.map){
 case 'world':return visits.length;
 case 'asia':return activeStations(p);
 case 'europe':return state.experience.rail[p.id];
 case 'africa':return owned(p.id).filter(t=>t.type==='property'&&!state.props[t.i].level&&!state.props[t.i].mortgage).length;
 case 'north-america':return a?.builds||0;
 case 'south-america':return a?.chance||0;
 case 'oceania':return visits.filter(i=>tiles[i].type==='station').length;
 case 'antarctica':return state.players.reduce((n,x)=>n+(state.adventure?.players[x.id]?.builds||0),0);
 default:return owned(p.id).length;
 }
}
function experienceProgress(){
 if(!state.experience||state.over)return;
 const target=(MAP_FOCUS[state.map]||MAP_FOCUS.legacy)[2];
 for(const p of state.players)if(!p.out&&!state.experience.awarded[p.id]&&focusProgress(p)>=target){state.experience.awarded[p.id]=true;p.cash+=400;log(p.name+' 完成地图特色目标，获得 ¥400。');if(state.expansion)expansionNote('focus',p,400)}
}
function nearbyRisk(p){
 const list=Array.from({length:12},(_,i)=>tiles[(p.pos+i+1)%32]).filter(t=>state.props[t.i].owner!==null&&state.props[t.i].owner!==p.id&&!state.props[t.i].mortgage);
 return list.reduce((best,t)=>rent(t)>best.amount?{tile:t.i,amount:rent(t)}:best,{tile:null,amount:0});
}
function aiPersonality(p){return state.experience?.personalities[p.id]||'steady'}
function experienceReserve(p,baseline){
 if(!state.experience)return baseline;
 const style=aiPersonality(p),loan=state.expansion?.players[p.id]?.loan;
 return Math.ceil(Math.max(baseline*(style==='steady'?1.2:style==='builder'?.9:1),nearbyRisk(p).amount*1.25)+(fastRules()&&nextUpkeepRound(p)-state.round<=2?upkeepFee(p):0)+(loan&&loan.due-state.round<=1?loan.repay:0));
}
function experienceTitle(p){
 const a=state.adventure?.players[p.id],h=state.expansion?.history||[],first=h.find(x=>x.round>=6),last=h.at(-1);
 if(first&&last&&first.values[p.id]===Math.min(...first.values)&&last.values[p.id]===Math.max(...last.values))return '逆风领航者';
 if((a?.builds||0)>=3)return '天际线缔造者';
 if((a?.visited?.length||0)>=8)return '环球探索家';
 if(state.experience?.awarded[p.id])return '地图专家';
 return '城市合伙人';
}
function normalizeExperience(x,n){
 if(!x||x.v!==8||!['quick','standard'].includes(x.pace)||!Array.isArray(x.personalities)||x.personalities.length!==n||x.personalities.some(p=>!Object.hasOwn(AI_PERSONALITIES,p))||!Array.isArray(x.rail)||x.rail.length!==n||x.rail.some(v=>!validInt(v,0,1e6))||!Array.isArray(x.awarded)||x.awarded.length!==n||x.awarded.some(v=>typeof v!=='boolean'))throw Error('旅程体验数据无效');
 return {v:8,pace:x.pace,personalities:[...x.personalities],rail:[...x.rail],awarded:[...x.awarded]};
}
