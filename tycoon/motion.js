'use strict';
// Presentation only: effects never delay a command, change a balance, or capture input.
const motionMedia=window.matchMedia('(prefers-reduced-motion: reduce)');
let motionPreference='standard',motionPrevious=null,motionRemoteRoom='',motionFrame=null;
try{motionPreference=localStorage.getItem('world-tycoon-motion')||'standard'}catch(e){}
const motionLayer=document.createElement('div');motionLayer.id='motionLayer';motionLayer.setAttribute('aria-hidden','true');document.body.append(motionLayer);
function motionEnabled(){return motionPreference!=='reduced'&&!motionMedia.matches&&document.visibilityState!=='hidden'}
function updateMotionPreference(){
 document.documentElement.dataset.motion=motionEnabled()?'standard':'reduced';
 $('#motionToggle').textContent=motionPreference==='reduced'||motionMedia.matches?'动效 · 精简':'动效 · 标准';
 $('#motionToggle').setAttribute('aria-pressed',String(motionPreference==='reduced'||motionMedia.matches));
 if(!motionEnabled())motionLayer.replaceChildren();
}
function effectNode(className,lifetime){
 if(!motionEnabled())return null;
 while(motionLayer.children.length>=24)motionLayer.firstElementChild.remove();
 const el=document.createElement('div');el.className=className;motionLayer.append(el);setTimeout(()=>el.remove(),lifetime);return el;
}
function ceremony(title,subtitle,kind='launch'){
 if(!motionEnabled())return;
 motionLayer.querySelector('.ceremony')?.remove();
 const el=effectNode('ceremony ceremony-'+kind,kind==='victory'?2100:1450);if(!el)return;
 const mark=document.createElement('span');mark.className='ceremony-mark';mark.textContent=kind==='victory'?'✦':'◎';
 const content=document.createElement('div'),eyebrow=document.createElement('small'),heading=document.createElement('strong'),detail=document.createElement('span');
 eyebrow.textContent=kind==='victory'?'A CITY TO REMEMBER':'YOUR WORLD · YOUR STORY';heading.textContent=title;detail.textContent=subtitle;
 content.append(eyebrow,heading,detail);el.append(mark,content);
}
function sparkBurst(rect,color){
 if(!motionEnabled()||rect.bottom<0||rect.top>innerHeight)return;
 const x=rect.left+rect.width/2,y=rect.top+rect.height/2;
 for(let i=0;i<10;i++){
  const el=effectNode('city-spark',900);if(!el)return;
  const a=Math.PI*2*i/10,d=30+(i%3)*14;
  el.style.cssText=`left:${x}px;top:${y}px;--sx:${Math.cos(a)*d}px;--sy:${Math.sin(a)*d-15}px;--spark:${color};--spin:${i*47}deg`;
 }
}
function moneyFeedback(id,delta){
 if(!delta||!motionEnabled())return;
 const player=$('#players').children[id];if(!player)return;const rect=player.getBoundingClientRect();if(rect.top>innerHeight||rect.bottom<0)return;
 const el=effectNode('cash-feedback '+(delta<0?'expense':'income'),1050);if(!el)return;el.textContent=(delta>0?'+':'−')+money(Math.abs(delta));el.style.left=(rect.right-18)+'px';el.style.top=(rect.top+8)+'px';
}
function captureMotion(){
 const roll=state.logs.find(x=>x.text.includes(' 掷出了 '));const chance=state.logs.find(x=>x.text.includes('抽到机遇：'));
 return {identity:state.adventure?.runId||state.logs.at(-1)?.text,map:state.map,upgrade:landingRules()?state.economy.upgrade:null,turn:state.turn,round:state.round,over:state.over,cash:state.players.map(p=>p.cash),owners:state.props.map(p=>p.owner),levels:state.props.map(p=>p.level),roll:roll?roll.round+':'+roll.text:'',chance:chance?chance.round+':'+chance.text:''};
}
const motionRender=render;
render=function(){
 const oldPositions=new Map();if(motionEnabled())document.querySelectorAll('.token[data-player]').forEach(t=>oldPositions.set(t.dataset.player,t.getBoundingClientRect()));
 motionRender();
 const next=captureMotion(),previous=motionPrevious;motionPrevious=next;
 if(!motionEnabled())return;
 document.querySelectorAll('.token[data-player]').forEach(t=>{const before=oldPositions.get(t.dataset.player);if(!before)return;const after=t.getBoundingClientRect(),dx=before.left-after.left,dy=before.top-after.top;if(Math.abs(dx)+Math.abs(dy)>3)t.animate([{transform:`translate(${dx}px,${dy}px) scale(1.25)`},{transform:'translate(0,0) scale(1)'}],{duration:busy?90:330,easing:'cubic-bezier(.16,1,.3,1)'})});
 const remoteKey=typeof onlineRoom!=='undefined'&&onlineRoom?.game?onlineRoom.code:'';
 if(remoteKey&&remoteKey!==motionRemoteRoom)ceremony(activeMap.name+' · 同行启程','朋友已就位，让世界见证你的下一步。');
 motionRemoteRoom=remoteKey;
 if(!previous||previous.identity!==next.identity||previous.map!==next.map||previous.cash.length!==next.cash.length)return;
 if(next.roll&&next.roll!==previous.roll){
  for(const id of ['#die1','#die2'])$(id).animate([{transform:'translateY(-12px) rotate(-12deg) scale(1.1)'},{transform:'translateY(3px) rotate(7deg) scale(.96)',offset:.6},{transform:'none'}],{duration:460,easing:'cubic-bezier(.2,.8,.2,1)'});
 }
 if(next.turn!==previous.turn||next.round!==previous.round){
  const player=$('#players').children[next.turn];player?.animate([{transform:'translateX(10px)',opacity:.6},{transform:'translateX(0)',opacity:1}],{duration:420,easing:'ease-out'});
  if(next.round!==previous.round){const el=effectNode('round-ribbon',1300);if(el)el.textContent='ROUND '+String(next.round).padStart(2,'0')+' · 新一轮机遇'}
 }
 const boardTiles=[...$('#board').querySelectorAll('.tile')];
 if(next.upgrade&&!next.upgrade.used&&JSON.stringify(next.upgrade)!==JSON.stringify(previous.upgrade))homeArrival(tiles[next.upgrade.tile],boardTiles[next.upgrade.tile]);
 next.owners.forEach((owner,i)=>{if(owner!==null&&owner!==previous.owners[i]){const t=boardTiles[i];if(t){t.animate([{filter:'brightness(1.25)',transform:'scale(1.08)'},{filter:'brightness(1)',transform:'scale(1)'}],{duration:650,easing:'ease-out'});sparkBurst(t.getBoundingClientRect(),COLORS[owner])}}else if(next.levels[i]>previous.levels[i]){const t=boardTiles[i];if(t){sparkBurst(t.getBoundingClientRect(),'#c8a452');upgradeRise(tiles[i],next.levels[i],t)}}});
 next.cash.forEach((cash,id)=>moneyFeedback(id,cash-previous.cash[id]));
 if(next.chance&&next.chance!==previous.chance){const el=effectNode('chance-reveal',1750);if(el){const icon=document.createElement('b'),text=document.createElement('span');icon.textContent='✦ 机遇已抵达';text.textContent=next.chance.split('抽到机遇：')[1]||'好运正在路上';el.append(icon,text)}}
 if(next.over&&!previous.over){const winner=[...state.players].filter(p=>!p.out).sort((a,b)=>worth(b)-worth(a))[0];if(winner)ceremony(winner.name+' · 城市大亨','每一步选择，都成为了你的世界。','victory')}
};
const motionMakeGame=makeGame;
makeGame=function(...args){const game=motionMakeGame(...args);queueMicrotask(()=>ceremony(activeMap.name+' · 旅程启航','掷出第一步，写下你的城市故事。'));return game};
$('#motionToggle').onclick=()=>{motionPreference=motionPreference==='reduced'?'standard':'reduced';try{localStorage.setItem('world-tycoon-motion',motionPreference)}catch(e){}updateMotionPreference();toast(motionEnabled()?'标准动效已开启':'已切换为精简动效')};
motionMedia.addEventListener?.('change',updateMotionPreference);
updateMotionPreference();motionPrevious=captureMotion();

function homeArrival(tile,node){
 if(!motionEnabled()||!node)return;node.classList.add('home-arrival');
 const rect=node.getBoundingClientRect();if(rect.top<0||rect.bottom>innerHeight)return;
 const ring=effectNode('home-ring',1150);if(ring)ring.style.cssText='left:'+(rect.left+rect.width/2)+'px;top:'+(rect.top+rect.height/2)+'px;--ring-size:'+Math.max(rect.width,rect.height)+'px';
 const badge=effectNode('home-badge',1300);if(badge){badge.textContent='⌂ 回到 '+tile.name+' · 可升级';badge.style.left=Math.min(innerWidth-170,Math.max(12,rect.left))+'px';badge.style.top=Math.max(75,rect.top-35)+'px'}
}
function upgradeRise(tile,level,node){
 if(!motionEnabled())return;
 const rect=node.getBoundingClientRect();
 if(rect.bottom>0&&rect.top<innerHeight){const beam=effectNode('upgrade-beam',1200);if(beam)beam.style.cssText='left:'+(rect.left+rect.width/2)+'px;top:'+(rect.top+rect.height/2)+'px;--beam-color:'+GROUPS[tile.group];node.classList.add('upgrade-glow');}
 motionLayer.querySelector('.skyline-rise')?.remove();const card=effectNode('skyline-rise',1500);if(!card)return;
 const skyline=document.createElement('span');skyline.className='rise-buildings';for(let i=0;i<4;i++){const tower=document.createElement('i');tower.style.setProperty('--tower-height',(18+(i<level?i*11+15:0))+'px');tower.style.setProperty('--tower-delay',(i*65)+'ms');skyline.append(tower)}
 const title=document.createElement('strong'),detail=document.createElement('small');title.textContent=tile.name+' · '+level+' 级';detail.textContent=level===4?'城市天际线 · 满级落成':'楼层升起 · 租金提升';card.append(skyline,title,detail);
}
