'use strict';
// Presentation only: a remote seat never follows the acting player.
function pawnViewer(game,remote,connected){
 if(connected)return remote?.game&&Number.isInteger(remote.me)?game.players.find(p=>p.id===remote.me)||null:null;
 return game.players.find(p=>p.id===(game.mode==='local'?game.turn:0))||null;
}
function pawnIdentity(game,remote,connected){
 const player=pawnViewer(game,remote,connected);
 return player?{player,number:player.id+1,position:player.pos,available:!player.out}:null;
}
const pawnLocator=document.createElement('button');pawnLocator.type='button';pawnLocator.id='pawnLocator';pawnLocator.className='pawn-locator';boardToolbar.before(pawnLocator);
function updatePawnIdentity(){
 const identity=pawnIdentity(state,onlineRoom,!!onlineSession),me=identity?.player;
 pawnLocator.hidden=!identity;pawnLocator.disabled=!identity?.available;
 if(identity){
  pawnLocator.style.setProperty('--pawn-color',COLORS[me.id]);
  pawnLocator.innerHTML='<span class="pawn-key" aria-hidden="true">'+identity.number+'</span><span><b>'+(state.mode==='local'&&!onlineSession?'本回合棋子':'我的棋子')+' · '+escapeHTML(me.name)+'</b><small>'+escapeHTML(me.out?'已破产':tiles[me.pos]?.name||'')+'</small></span><span class="pawn-locate-label">定位 ↗</span>';
  pawnLocator.setAttribute('aria-label',(state.mode==='local'&&!onlineSession?'定位本回合棋子':'定位我的棋子')+' '+identity.number+' · '+me.name+' · '+(me.out?'已破产':tiles[me.pos]?.name||''));
 }
 $('#board').querySelectorAll('.tile').forEach((tile,i)=>{
  const occupants=state.players.filter(p=>!p.out&&p.pos===i),mine=!!me&&!me.out&&me.pos===i;
  tile.classList.toggle('my-position',mine);tile.classList.toggle('crowded',occupants.length>2);
  if(mine)tile.style.setProperty('--pawn-color',COLORS[me.id]);
  if(occupants.length)tile.setAttribute('aria-label',tiles[i].name+' · '+occupants.map(p=>'棋子 '+(p.id+1)+' · '+p.name+(p.id===me?.id?' · 我的棋子':'')).join('；'));
  tile.querySelectorAll('.token').forEach(token=>{
   const p=state.players.find(p=>p.id===Number(token.dataset.player));if(!p)return;
   token.textContent=String(p.id+1);token.classList.toggle('my-token',p.id===me?.id);token.style.setProperty('--pawn-color',COLORS[p.id]);
   token.setAttribute('aria-hidden','true');token.title='棋子 '+(p.id+1)+' · '+p.name+(p.id===me?.id?' · 我的棋子':'');
  });
 });
 $('#players').querySelectorAll('.player').forEach((card,i)=>{
  const p=state.players[i];if(!p)return;card.classList.toggle('my-player',p.id===me?.id);
  const avatar=card.querySelector('.avatar');if(avatar){avatar.textContent=String(p.id+1);avatar.setAttribute('aria-hidden','true')}
  card.querySelectorAll('.pawn-me-label,.player-name>span').forEach(el=>el.remove());
  if(p.id===me?.id){const label=document.createElement('span');label.className='pawn-me-label';label.textContent=state.mode==='local'&&!onlineSession?'本回合':'我';card.querySelector('.player-name').append(label)}
 });
}
pawnLocator.onclick=()=>{
 const identity=pawnIdentity(state,onlineRoom,!!onlineSession);if(!identity?.available)return;
 const tile=$('#board').querySelectorAll('.tile')[identity.position];if(!tile)return;
 // Only an explicit locate action moves the viewport; polling and dice do not.
 tile.scrollIntoView({behavior:'instant',block:'center',inline:'center'});tile.focus({preventScroll:true});
 if(motionEnabled())tile.animate([{boxShadow:'inset 0 0 0 4px '+COLORS[identity.player.id]},{boxShadow:'inset 0 0 0 2px '+COLORS[identity.player.id]}],{duration:700});
};
const pawnRender=render,pawnOnlinePanel=renderOnlinePanel;
render=function(){pawnRender();updatePawnIdentity()};
renderOnlinePanel=function(){pawnOnlinePanel();updatePawnIdentity()};
updatePawnIdentity();
