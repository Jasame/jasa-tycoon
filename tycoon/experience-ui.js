'use strict';
let coachStep=0,coachDismissed=false;
try{coachDismissed=localStorage.getItem('world-tycoon-coach-v8')==='done'}catch(e){}
const QUICK_GUIDE=[['先认准自己的棋子','方形外框和“我的棋子”标记属于你。点击定位按钮即可找到。'],['掷骰与买地','停在无主地产可买下；先看支付后的现金，再决定是否投资。'],['回到自己的房产再升级','再次停在自有未抵押房产，可付费升一级。路过或刚买下不触发。']];
function finishCoach(){coachDismissed=true;try{localStorage.setItem('world-tycoon-coach-v8','done')}catch(e){}$('#quickCoach')?.remove()}
showGuide=function(step=0){const g=QUICK_GUIDE[step]||QUICK_GUIDE[0];modal('三步上手 · '+(step+1)+'/3','<h3>'+g[0]+'</h3><p>'+g[1]+'</p><button id="quickGuideNext" class="primary">'+(step===2?'开始探索':'下一步')+'</button><button id="quickGuideSkip" class="wide">跳过引导</button>');$('#quickGuideNext').onclick=()=>step===2?(finishCoach(),closeModal()):showGuide(step+1);$('#quickGuideSkip').onclick=()=>{finishCoach();closeModal()}};
const experienceMake=makeGame;makeGame=function(opts={}){return experienceMake({...opts,experience:opts.experience??opts.economy!==false,pace:opts.pace||($('#limitInput')?.value==='12'?'quick':'standard'),personality:opts.personality||$('#personalityInput')?.value||'mixed'})};
const experienceModal=modal;modal=function(...args){experienceModal(...args);if($('#startGame')&&!$('#personalityInput')){
 const limit=$('#limitInput');if(![...limit.options].some(o=>o.value==='12'))limit.insertAdjacentHTML('afterbegin','<option value="12">轻快局 · 12 回合，约10–15分钟</option>');
 const select=$('#difficultyInput');select.options[0].textContent='休闲';select.options[1].textContent='标准';select.options[2].textContent='挑战';
 const label=document.createElement('label');label.innerHTML='AI 性格<select id="personalityInput">'+personalityOptions()+'</select>';$('.setup-advanced-grid').append(label);
 const intro=$('.setup-intro');if(intro)intro.textContent='先选地图即可开始 · 更多设置可选轻快局 · 当前进度自动备份';
 }};
function personalityOptions(){return '<option value="mixed">各有性格</option>'+Object.entries(AI_PERSONALITIES).map(([id,label])=>'<option value="'+id+'">'+label+'</option>').join('')}
const experienceOnline=showOnline;showOnline=function(){experienceOnline();if($('#onlineLimit')&&!$('#onlineDifficulty')){
 $('#onlineLimit').insertAdjacentHTML('afterbegin','<option value="12">轻快局 · 12 回合</option>');const settings=document.createElement('details');settings.className='hub-details';settings.innerHTML='<summary>人机与节奏</summary><label>AI 难度<select id="onlineDifficulty"><option value="easy">休闲</option><option value="normal" selected>标准</option><option value="expert">挑战</option></select></label><label>AI 性格<select id="onlinePersonality">'+personalityOptions()+'</select></label><label>人机动画<select id="onlinePace"><option value="standard">合并连续行动</option><option value="quick">轻快</option></select></label>';$('.online-create').append(settings);
 }};$('#onlineButton').onclick=()=>showOnline();
const experienceMapPreview=selectedMapPreview;selectedMapPreview=function(){experienceMapPreview();const preview=$('#selectedMapPreview');if(preview&&MAP_FOCUS[chosenMap])preview.textContent='初始资金 '+money(mapStartingCash(chosenMap))+' · '+MAP_FOCUS[chosenMap][0]+'：'+MAP_FOCUS[chosenMap][1]+'。详情可在旅程查看。'};
const experienceGoals=goalHTML;goalHTML=function(p){const original=experienceGoals(p);if(!state.experience)return original;const f=MAP_FOCUS[state.map]||MAP_FOCUS.legacy;return original+'<details class="hub-details"><summary>本图特色 · '+f[0]+'</summary><p>'+f[1]+' · '+Math.min(f[2],focusProgress(p))+'/'+f[2]+'</p><p>'+mapRule().text+'</p><p>'+(state.experience.awarded[p.id]?'特色目标已完成':'完成一次奖励 ¥400；联合科考由所有未破产玩家共享')+'</p></details>'};
function riskHTML(p,spend=0){const risk=nearbyRisk(p);return '<span>支付后现金 '+money(p.cash-spend)+'</span><span>前方12格最高租金 '+money(risk.amount)+'</span>'}
function updateExperienceUI(){
 $('#riskPreview')?.remove();$('#quickCoach')?.remove();
 const p=strategyViewer(),ownTurn=p&&p.id===state.turn&&!p.ai&&!state.over&&(!onlineSession||canOnlineAct());
 if(ownTurn&&state.experience&&!busy){const t=tiles[p.pos],upgrade=state.phase==='end'&&t.type==='property'&&canBuild(p,t),spend=state.phase==='buy'?tiles[state.pending].price:upgrade?paymentCost(p,t):null;
  if(spend!==null){const line=document.createElement('div');line.id='riskPreview';line.className='risk-preview';line.innerHTML=riskHTML(p,spend);$('#actionText').after(line);if($('#dockStatus'))$('#dockStatus').textContent='支付后现金 '+money(p.cash-spend)+' · 前方租金最高 '+money(nearbyRisk(p).amount);if(p.cash<spend){const gap=document.createElement('small');gap.textContent='现金不足，还差 '+money(spend-p.cash);line.append(gap);$('#actionButtons button')?.setAttribute('disabled','')}}
  if(!coachDismissed){const coach=document.createElement('div');coach.id='quickCoach';coach.className='quick-coach';coach.innerHTML='<small>上手 '+(coachStep+1)+'/3</small><p>'+QUICK_GUIDE[coachStep][1]+'</p><div><button id="coachNext">'+(coachStep===2?'明白了':'下一步')+'</button><button id="coachSkip">跳过</button></div>';$('.action-panel').append(coach);$('#coachNext').onclick=()=>{if(coachStep===2)finishCoach();else coachStep++;updateExperienceUI()};$('#coachSkip').onclick=finishCoach}
 }
 const panel=$('#onlinePanel');if(onlineSession&&onlineRoom){if(onlineRoom.status==='lobby'){$('#round').textContent='等待开局'+(onlineRoom.options.limit?' · '+onlineRoom.options.limit+' 回合':'');$('#marketLabel').textContent='';$('#economyNote').hidden=true;}const status=panel.querySelector('.online-heading p');if(status){status.setAttribute('role','status');if(!onlineConnected)status.textContent=onlinePending?'操作结果待确认，正在重连，请勿重复操作。':'连接中断，正在恢复最新进度。';else if(onlineLastConfirmed&&!onlinePending&&!status.textContent.includes(onlineLastConfirmed))status.textContent+=' · '+onlineLastConfirmed;}
 if(!onlineConnected&&!$('#retryConnection')){const b=document.createElement('button');b.id='retryConnection';b.textContent='立即重连';b.onclick=()=>pollOnline();panel.querySelector('.online-tools')?.append(b)}
 if(onlineRoom.status==='finished'&&onlineRoom.host&&!$('#roomRematch')){const b=document.createElement('button');b.id='roomRematch';b.textContent='原班人马再战';b.disabled=!!onlinePending||!onlineConnected;b.onclick=()=>onlineLobbyCommand('rematch');panel.querySelector('.online-tools')?.append(b)}
 }
 if(state.experience)$('#players').querySelectorAll('.player').forEach((el,i)=>{const p=state.players[i];if(p.ai)el.title=AI_PERSONALITIES[aiPersonality(p)]+' · '+(state.difficulty==='easy'?'休闲':state.difficulty==='expert'?'挑战':'标准')});
}
function replayLocal(){
 if(onlineSession||!state.over||!archiveCurrent())return;const old=JSON.parse(JSON.stringify(state));
 state=makeGame({map:old.map,count:old.players.length,mode:old.mode,difficulty:old.difficulty,speed:old.speed,limit:old.limit,expansion:!!old.expansion,experience:!!old.experience,pace:old.experience?.pace,quietAuctions:old.comfort?.quietAuctions});
 state.players.forEach((p,i)=>{p.name=old.players[i].name;p.avatar=old.players[i].avatar;if(old.players[i].cosmetics)p.cosmetics=safeCosmetics(old.players[i].cosmetics);p.ai=old.players[i].ai;if(state.expansion)state.expansion.players[i].career=old.expansion.players[i].career});if(state.experience)state.experience.personalities=[...old.experience.personalities];selected=-1;closeModal();render();scheduleAI();
}
const experienceResults=showResults;showResults=function(){experienceResults();if(!state.experience)return;const summary=document.createElement('section');summary.className='result-highlights';const winner=[...state.players].sort((a,b)=>(a.out-b.out)||worth(b)-worth(a))[0],history=state.expansion?.history||[],turn=history.find(h=>h.values[winner.id]===Math.max(...h.values));summary.innerHTML='<h3>这一局值得记住</h3><p>'+escapeHTML(winner.name)+' · '+(turn?'第 '+turn.round+' 回合首次领跑':'最终资产领先')+'</p>'+state.players.map(p=>'<p>'+escapeHTML(p.name)+' · '+experienceTitle(p)+'</p>').join('');$('#modalBody').prepend(summary);const again=$('#again');if(again){again.textContent=onlineSession?(onlineRoom?.host?'原班人马再战':'等待房主发起再战'):'原班人马再来一局';again.disabled=!!onlineSession&&!onlineRoom?.host;again.onclick=()=>onlineSession?onlineLobbyCommand('rematch'):replayLocal()}};
const experienceRender=render,experienceAction=renderAction,experiencePanel=renderOnlinePanel;
render=function(){experienceRender();updateExperienceUI()};renderAction=function(){experienceAction();updateExperienceUI()};renderOnlinePanel=function(){experiencePanel();updateExperienceUI()};
window.addEventListener('online',()=>{if(onlineSession)pollOnline()});window.addEventListener('offline',()=>{if(onlineSession){onlineConnected=false;renderOnlinePanel();renderAction()}});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&onlineSession)pollOnline()});window.addEventListener('pageshow',()=>{if(onlineSession)pollOnline()});
$('#guide').onclick=()=>showGuide();updateExperienceUI();
