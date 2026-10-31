'use strict';
// Shared by the browser and authoritative room engine. Opt-in per new game.
const JOURNEY_MISSIONS={
 explorer:{title:'城市发现家',text:'亲自到访 4 座不同地产城市',target:4,icon:'◎'},
 collector:{title:'城市合伙人',text:'同时持有 5 处地产或交通枢纽',target:5,icon:'▥'},
 builder:{title:'天际线建筑师',text:'累计完成 3 次建筑升级',target:3,icon:'▰'},
 lucky:{title:'机遇收藏家',text:'亲自抽取 2 次机遇卡',target:2,icon:'✦'},
 transit:{title:'交通探险家',text:'亲自到访 2 座不同交通枢纽',target:2,icon:'↗'}
};
const WORLD_NEWS=[
 {title:'环球旅游季开幕',text:'跨城旅行需求走高，所有地产与枢纽租金 ×1.25。',factor:1.25,icon:'☀'},
 {title:'城市博览会巡展',text:'商圈迎来更多访客，所有地产与枢纽租金 ×1.15。',factor:1.15,icon:'✦'},
 {title:'世界进入平稳经营期',text:'投资回归日常，所有地产与枢纽租金恢复 ×1。',factor:1,icon:'◎'},
 {title:'全球交通维护周',text:'客流暂时回落，所有地产与枢纽租金 ×0.8。',factor:.8,icon:'↗'},
 {title:'全球招商大会举行',text:'商旅活动集中爆发，所有地产与枢纽租金 ×1.35。',factor:1.35,icon:'▥'}
];
const LANDMARK_NAMES=['晨光之塔','海风剧院','绿洲花园','星空博物馆','金色穹顶','云端观景台','晚霞艺术馆','极光研究馆'];
function makeAdventure(){return {v:1,runId:Math.floor(Math.random()*1e9),missions:['explorer','collector',['builder','lucky','transit'][Math.floor(Math.random()*3)]],players:{},landmarks:[],news:{current:2,next:Math.floor(Math.random()*WORLD_NEWS.length),round:1}}}
function hasAdventure(){return state.adventure?.v===1}
function adventurePlayer(p){return state.adventure.players[p.id]||=( {visited:[],chance:0,builds:0,completed:[],tourismRound:0} )}
function missionProgress(p,id){
 const a=state.adventure?.players[p.id];if(!a)return id==='collector'?owned(p.id).length:0;
 if(id==='explorer')return a.visited.filter(i=>tiles[i].type==='property').length;
 if(id==='collector')return owned(p.id).length;
 if(id==='builder')return a.builds;
 if(id==='lucky')return a.chance;
 return a.visited.filter(i=>tiles[i].type==='station').length;
}
function landmarkActive(owner,group){const members=tiles.filter(t=>t.type==='property'&&t.group===group);return members.length>0&&members.every(t=>{const r=state.props[t.i];return r.owner===owner&&!r.mortgage&&r.level>=2})}
function checkAdventures(p){
 if(state.experience)experienceProgress();
 if(!hasAdventure()||p.out)return;
 const a=adventurePlayer(p);
 for(const id of state.adventure.missions)if(!a.completed.includes(id)&&missionProgress(p,id)>=JOURNEY_MISSIONS[id].target){a.completed.push(id);p.cash+=600;log(p.name+' 完成旅程任务「'+JOURNEY_MISSIONS[id].title+'」，获得 ¥600。')}
 for(let group=0;group<8;group++)if(landmarkActive(p.id,group)&&!state.adventure.landmarks.some(l=>l.owner===p.id&&l.group===group)){state.adventure.landmarks.push({owner:p.id,group});log(p.name+' 建成地标「'+LANDMARK_NAMES[group]+'」！保持同组建筑至少 2 级，每回合获得 ¥200 观光收入。')}
}
function adventureLanding(p,t){
 if(!hasAdventure()||p.out)return;
 const a=adventurePlayer(p);
 if(['property','station'].includes(t.type)&&!a.visited.includes(t.i))a.visited.push(t.i);
 if(t.type==='chance')a.chance++;
 checkAdventures(p);
}
function adventureBuild(p){if(hasAdventure()){adventurePlayer(p).builds++;checkAdventures(p)}}
function adventureTurn(p){
 if(!hasAdventure()||p.out)return;
 checkAdventures(p);const a=adventurePlayer(p);
 if(a.tourismRound===state.round)return;
 a.tourismRound=state.round;
 const count=state.adventure.landmarks.filter(l=>l.owner===p.id&&landmarkActive(p.id,l.group)).length;
 if(count){p.cash+=count*200;log(p.name+' 获得 '+count+' 座地标的观光收入 '+money(count*200)+'。')}
}
function adventureNews(){
 const a=state.adventure,news=WORLD_NEWS[a.news.next];a.news={current:a.news.next,next:Math.floor(Math.random()*WORLD_NEWS.length),round:state.round};
 state.market={name:news.title,factor:news.factor};log('世界新闻：'+news.title+'。'+news.text+' 持续至第 '+(state.round+5)+' 回合市场更新。');
}
function normalizeAdventure(input,n,round){
 if(input==null)return undefined;
 if(input.v!==1||!validInt(input.runId,0,1e9)||!Array.isArray(input.missions)||input.missions.length!==3||new Set(input.missions).size!==3||input.missions.some(id=>!Object.hasOwn(JOURNEY_MISSIONS,id))||!input.players||typeof input.players!=='object'||!Array.isArray(input.landmarks)||input.landmarks.length>n*8)throw Error('旅程任务数据无效');
 const news=input.news;if(!news||!validInt(news.current,0,4)||!validInt(news.next,0,4)||(!validInt(news.round,1,round)||(news.round!==1&&news.round%5!==0)))throw Error('世界新闻数据无效');
 const out={v:1,runId:input.runId,missions:[...input.missions],players:{},landmarks:[],news:{current:news.current,next:news.next,round:news.round}};
 for(let i=0;i<n;i++){
  const a=input.players[i];if(!a)continue;
  if(!Array.isArray(a.visited)||a.visited.some(t=>!validInt(t,0,31)||!['property','station'].includes(typeof raw[t][1]==='number'?'property':raw[t][1]))||new Set(a.visited).size!==a.visited.length||!validInt(a.chance,0,1e6)||!validInt(a.builds,0,1e6)||!validInt(a.tourismRound,0,round)||!Array.isArray(a.completed)||new Set(a.completed).size!==a.completed.length||a.completed.some(id=>!input.missions.includes(id)))throw Error('旅程进度数据无效');
  out.players[i]={visited:[...a.visited],chance:a.chance,builds:a.builds,completed:[...a.completed],tourismRound:a.tourismRound};
 }
 const seen=new Set();for(const l of input.landmarks){const key=l?.owner+':'+l?.group;if(!l||!validInt(l.owner,0,n-1)||!validInt(l.group,0,7)||seen.has(key))throw Error('地标数据无效');seen.add(key);out.landmarks.push({owner:l.owner,group:l.group})}
 return out;
}
