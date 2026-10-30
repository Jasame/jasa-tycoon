'use strict';
// Layout helpers mirror existing controls; the game and server remain authoritative.
const compactScreen=window.matchMedia('(max-width: 700px), (max-width: 1000px) and (max-height: 500px) and (pointer: coarse)');
const boardShell=$('.board-shell'),boardViewport=document.createElement('div');
boardViewport.className='board-viewport';boardViewport.tabIndex=0;boardViewport.setAttribute('role','region');boardViewport.setAttribute('aria-label','游戏棋盘。放大后可左右滑动，点击地块查看完整名称和地价。');
$('#board').before(boardViewport);boardViewport.append($('#board'));
const boardToolbar=document.createElement('div');boardToolbar.className='board-toolbar';
const boardHint=document.createElement('span');boardHint.textContent='点选地块，查看地价与租金';
const zoomButton=document.createElement('button');zoomButton.id='boardZoom';zoomButton.type='button';zoomButton.textContent='放大棋盘';zoomButton.setAttribute('aria-pressed','false');
boardToolbar.append(boardHint,zoomButton);boardViewport.before(boardToolbar);
zoomButton.onclick=()=>{
 const zoom=boardShell.dataset.zoom!=='in';boardShell.dataset.zoom=zoom?'in':'out';zoomButton.textContent=zoom?'返回全景':'放大棋盘';zoomButton.setAttribute('aria-pressed',String(zoom));
 if(zoom)requestAnimationFrame(()=>{
  const me=typeof onlineRoom!=='undefined'&&onlineRoom?.game?onlineRoom.me:state.turn;
  const tile=$('#board').querySelectorAll('.tile')[state.players[me]?.pos||0];if(tile){const rect=tile.getBoundingClientRect(),view=boardViewport.getBoundingClientRect();boardViewport.scrollLeft+=rect.left-view.left+rect.width/2-view.width/2}
 });else boardViewport.scrollLeft=0;
};
const actions=$('.atlas-actions'),extraTools=document.createElement('div');extraTools.id='extraTools';extraTools.className='extra-tools';
for(const id of ['trade','ranking','journal','saveCenter','guide','motionToggle'])extraTools.append($('#'+id));
const toolsToggle=document.createElement('button');toolsToggle.id='toolsToggle';toolsToggle.type='button';toolsToggle.textContent='更多功能';toolsToggle.setAttribute('aria-expanded','false');toolsToggle.setAttribute('aria-controls','extraTools');
actions.append(toolsToggle,extraTools);
toolsToggle.onclick=()=>{const open=actions.classList.toggle('tools-open');toolsToggle.textContent=open?'收起功能':'更多功能';toolsToggle.setAttribute('aria-expanded',String(open))};
const dock=document.createElement('nav');dock.id='mobileDock';dock.className='mobile-dock';dock.setAttribute('aria-label','手机快捷操作');
dock.innerHTML='<div class="dock-status" id="dockStatus"></div><div class="dock-buttons"><button id="dockPrimary" class="dock-primary"></button><button id="dockAction">查看操作</button><button id="dockAssets">我的资产</button></div>';
document.body.append(dock);
function dockSource(){
 if(!$('#roll').hidden)return {button:$('#roll'),label:$('#roll').disabled?'等待回合':current().jail?'掷骰出狱':'掷骰子'};
 if(!$('#end').hidden)return {button:$('#end'),label:'结束回合'};
 const button=[...$('#actionButtons').querySelectorAll('button')].find(b=>!b.disabled);
 return button?{button,label:button.textContent}:{button:null,label:'等待操作'};
}
function refreshDeviceControls(){
 const inLobby=typeof onlineSession!=='undefined'&&onlineSession&&(!onlineRoom||onlineRoom.status==='lobby');
 dock.hidden=!compactScreen.matches||!!inLobby;
 document.documentElement.classList.toggle('has-mobile-dock',!dock.hidden);
 const source=dockSource();$('#dockPrimary').textContent=source.label;$('#dockPrimary').disabled=!source.button||source.button.disabled||busy;
 const me=typeof onlineRoom!=='undefined'&&onlineRoom?.game?onlineRoom.me:state.turn;
 $('#dockStatus').textContent=state.over?'本局已结束':(typeof onlineSession!=='undefined'&&onlineSession?'联机 · ':'')+current().name+' 的回合 · 第 '+state.round+' 回合';
 $('#dockAssets').disabled=!!inLobby||!state.players[me];
 boardHint.textContent=boardShell.dataset.zoom==='in'?'可左右滑动 · 点击地块查看详情':'点选地块，查看地价与租金';
}
$('#dockPrimary').onclick=()=>{const source=dockSource();if(source.button&&!source.button.disabled&&!busy)source.button.click();refreshDeviceControls()};
$('#dockAction').onclick=()=>$('.action-panel').scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'center'});
$('#dockAssets').onclick=()=>showAssets();
const deviceRender=render,deviceAction=renderAction;
render=function(){deviceRender();refreshDeviceControls()};
renderAction=function(){deviceAction();refreshDeviceControls()};
// Keyboard-aware modal height and focus return, without changing the game state.
function updateViewport(){boardShell.style.setProperty('--board-width',boardViewport.clientWidth+'px');document.documentElement.style.setProperty('--visual-height',(window.visualViewport?.height||window.innerHeight)+'px');refreshDeviceControls()}
window.visualViewport?.addEventListener('resize',updateViewport,{passive:true});window.addEventListener('resize',updateViewport,{passive:true});compactScreen.addEventListener?.('change',refreshDeviceControls);
let modalTrigger=null;
const deviceModal=modal,deviceCloseModal=closeModal;
modal=function(...args){if($('#modal').hidden)modalTrigger=document.activeElement;deviceModal(...args);document.documentElement.classList.add('modal-open')};
closeModal=function(){deviceCloseModal();document.documentElement.classList.remove('modal-open');if(modalTrigger?.isConnected&&!modalTrigger.disabled)modalTrigger.focus({preventScroll:true})};
new MutationObserver(()=>document.documentElement.classList.toggle('modal-open',!$('#modal').hidden)).observe($('#modal'),{attributes:true,attributeFilter:['hidden']});
$('#modal').addEventListener('keydown',e=>{
 if(e.key!=='Tab')return;
 const focusable=[...$('#modal').querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
 const first=focusable[0],last=focusable[focusable.length-1];
 if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus()}
});
document.documentElement.classList.toggle('modal-open',!$('#modal').hidden);
updateViewport();
