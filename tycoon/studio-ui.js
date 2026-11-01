'use strict';
// V12 presentation: reuse authoritative controls, never derive a second game action.
function studioDecision(game,viewer,connected,pending,moving){
 const actor=game.phase==='auction'?game.auction?.bidder:game.phase==='trade'?game.offer?.seller:game.turn;
 const player=game.players[actor];
 return {actor,waiting:!!moving||!!pending||!connected||!player||player.ai||actor!==viewer,
  key:[game.map,game.round,actor,game.phase,game.pending,player?.pos,!!game.over].join(':'),
  kind:game.over?'finished':game.phase==='buy'?'purchase':game.phase==='auction'?'auction':game.phase==='trade'?'trade':player?.cash<0?'debt':game.phase};
}
function studioMarkMirrors(buttons,source){for(const b of buttons)b.classList.toggle('studio-dock-mirrored',b===source.button||b===source.secondaryButton)}
document.documentElement.classList.add('studio-ui');
// Keep one instance of each original control so its event handlers survive relocation.
const studioGroups=[['本局',[journeyPortal,communityToolsButton,$('#trade'),$('#ranking'),$('#journal'),$('#rules'),$('#guide'),$('#newGame')]],['房间',[]],['外观',[displayButton,languageToggle,profileButton,$('#sound'),$('#motionToggle'),$('#aiOfferToggle')]],['存档',[$('#saveCenter'),$('#atlas')]]];
const studioMenuSections=new Map();
for(const [label,buttons] of studioGroups){const section=document.createElement('section');section.className='studio-menu-group';const title=document.createElement('h3');title.textContent=label;section.append(title);for(const b of buttons)if(b)section.append(b);extraTools.append(section);studioMenuSections.set(label,section)}
const studioRoomShortcut=document.createElement('button');studioRoomShortcut.type='button';studioRoomShortcut.textContent='邀请与房间设置';studioRoomShortcut.onclick=()=>onlineSession&&onlineRoom?showRoomManagement():showOnline();studioMenuSections.get('房间').append(studioRoomShortcut);
const studioTop=$('.atlas-bar');$('header').append(studioTop);$('header nav').hidden=true;
$('#saveStatus').removeAttribute('role');$('footer').append($('#saveStatus'));
$('#boardZoom').setAttribute('aria-label','放大或缩小棋盘');
const studioPhase=document.createElement('small');studioPhase.id='studioPhase';studioPhase.className='studio-phase';$('#actionTitle').before(studioPhase);
const studioTurnButton=document.createElement('button');studioTurnButton.id='studioTurnAction';studioTurnButton.type='button';studioTurnButton.className='studio-turn-action';$('#actionButtons').before(studioTurnButton);
function studioDispatch(source){if(source&&!source.disabled&&!busy)source.click()}
studioTurnButton.onclick=()=>{const source=dockSource();studioDispatch(source.button);refreshDeviceControls()};
let studioFrame=0,studioLastKey='',studioDetailsOpen=false;
function showStudioPlayer(id){
 const p=state.players.find(p=>p.id===id);if(!p)return;
 modal(p.name,'<div class="studio-player-detail">'+avatarImage(p.avatar)+'<b>'+escapeHTML(p.name)+'</b><span>棋子 '+(p.id+1)+'</span></div><div class="stat-grid"><div>现金<strong>'+money(p.cash)+'</strong></div><div>总资产<strong>'+money(worth(p))+'</strong></div><div>地产数量<strong>'+owned(p.id).length+'</strong></div><div>当前位置<strong>'+escapeHTML(tiles[p.pos]?.name||'')+'</strong></div></div><p>'+(p.out?'已破产':p.ai?'人机正在经营':'真人玩家')+'</p>');
}
function updateStudioUI(){
 studioFrame=0;
 const identity=pawnIdentity(state,onlineRoom,!!onlineSession),viewer=identity?.player?.id;
 const model=studioDecision(state,viewer,!onlineSession||onlineConnected,onlinePending,busy);
 const labels={finished:'本局结算',purchase:'待售地产',auction:'公开拍卖',trade:'交易答复',debt:'现金周转',roll:'准备出发',end:'到站结算'};
 studioPhase.textContent=model.waiting&&!state.over?'等待行动':labels[model.kind]||'当前决策';
 const source=dockSource();studioMarkMirrors($('#actionButtons').querySelectorAll('button'),source);
 const turnSource=source.button=== $('#roll')||source.button=== $('#end');
 $('.action-panel').classList.toggle('studio-has-turn',turnSource);studioTurnButton.hidden=!turnSource;studioTurnButton.disabled=!source.button||source.button.disabled||busy;studioTurnButton.textContent=source.label;
 const oldDetails=$('#studioDecisionDetails');if(oldDetails){studioDetailsOpen=oldDetails.open;oldDetails.remove()}
 const details=document.createElement('details');details.id='studioDecisionDetails';details.className='studio-decision-details';details.open=studioDetailsOpen;
 const summary=document.createElement('summary');summary.textContent='租金、风险与提示';details.append(summary);
 // Essential payment and remaining cash stay visible; extra context is optional.
 const cashLine=$('#decisionOutcome')?.children[1];if(cashLine&&compactScreen.matches)$('#dockStatus').textContent=cashLine.textContent;
 const rent=$('#decisionOutcome')?.children[2];if(rent)details.append(rent);
 for(const id of ['riskPreview','contextCoach','routeShortcut','cashReceipt','businessResult']){const el=$('#'+id);if(el)details.append(el)}
 if(details.children.length>1)$('.action-panel').append(details);
 $('#players').querySelectorAll('.player').forEach((card,i)=>{
  const p=state.players[i];if(!p)return;
  card.tabIndex=0;card.setAttribute('role','button');card.setAttribute('aria-label',p.name+' · '+money(p.cash)+' · '+(p.id===state.turn?'正在行动':'查看玩家详情'));
  card.onclick=()=>showStudioPlayer(p.id);card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showStudioPlayer(p.id)}};
 });
 $('#board').querySelectorAll('.tile').forEach((tile,i)=>{
  const r=state.props[i],t=tiles[i];tile.classList.toggle('studio-owned',r.owner===viewer);tile.classList.toggle('studio-mortgaged',!!r.mortgage);
  tile.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showTile(i)}};
  const owner=r.owner===null?'待售':state.players[r.owner]?.name;
  if(['property','station'].includes(t.type))tile.setAttribute('aria-label',t.name+' · '+state.players.filter(p=>!p.out&&p.pos===i).map(p=>'棋子 '+(p.id+1)+' · '+p.name+(p.id===viewer?' · 我的棋子':'')).join('；')+' · '+owner+' · '+money(t.price)+(r.mortgage?' · 已抵押':' · '+r.level+' 级建筑'));
 });
 // Unknown future menu controls remain reachable under the current-game group.
 for(const b of [...extraTools.children])if(b.tagName==='BUTTON')studioMenuSections.get('本局').append(b);
 if(studioLastKey&&studioLastKey!==model.key&&motionEnabled())$('.action-panel').animate([{opacity:.65,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'});
 studioLastKey=model.key;translateInterface();
}
function scheduleStudioUI(){if(!studioFrame)studioFrame=requestAnimationFrame(updateStudioUI)}
const studioRender=render,studioAction=renderAction,studioOnlinePanel=renderOnlinePanel;
render=function(){studioRender();scheduleStudioUI()};renderAction=function(){studioAction();scheduleStudioUI()};renderOnlinePanel=function(){studioOnlinePanel();scheduleStudioUI()};
// Closing the menu restores keyboard focus; group labels are not clickable actions.
const studioCloseTools=closeTools;closeTools=function(){const wasOpen=actions.classList.contains('tools-open');studioCloseTools();if(wasOpen&&extraTools.contains(document.activeElement))toolsToggle.focus({preventScroll:true})};
scheduleStudioUI();
