'use strict';
let autoRollEnabled=false,autoRollDue=0,autoRollKey='',autoRollSent='';
let preferredAvatar='fox';try{const stored=localStorage.getItem('world-tycoon-avatar');if(AVATARS.some(a=>a.id===stored))preferredAvatar=stored}catch(e){}
try{autoRollEnabled=localStorage.getItem('world-tycoon-auto-roll')==='true'}catch(e){}
const autoRollButton=document.createElement('button');autoRollButton.type='button';autoRollButton.id='autoRollToggle';autoRollButton.className='auto-roll-control';$('#turnText').before(autoRollButton);
function autoRollEligible(){return autoRollEnabled&&!busy&&!state.over&&state.phase==='roll'&&!document.hidden&&$('#modal').hidden&&current().cash>=0&&(onlineSession?canOnlineAct():!current().ai)}
function toggleAutoRoll(){autoRollEnabled=!autoRollEnabled;autoRollDue=0;try{localStorage.setItem('world-tycoon-auto-roll',String(autoRollEnabled))}catch(e){}updateV6UI();toast(autoRollEnabled?'自动掷骰已开启；买地、升级和交易仍由你决定。':'自动掷骰已关闭')}
autoRollButton.onclick=toggleAutoRoll;
setInterval(()=>{
 if(!autoRollEligible()){autoRollDue=0;return}
 const key=(state.adventure?.runId||state.logs.at(-1)?.text||state.map)+':'+state.round+':'+state.turn;
 if(key===autoRollSent)return;
 if(key!==autoRollKey||!autoRollDue){autoRollKey=key;autoRollDue=Date.now()+1600;return}
 if(Date.now()>=autoRollDue){autoRollSent=key;autoRollDue=0;roll()}
},300);
document.addEventListener('visibilitychange',()=>{autoRollDue=0});
const profileButton=document.createElement('button');profileButton.type='button';profileButton.textContent='头像与自动掷骰';extraTools.prepend(profileButton);
function avatarImage(id,alt=''){const safe=AVATARS.some(a=>a.id===id)?id:'fox';return '<img class="cartoon-avatar" src="assets/avatars/'+safe+'.svg" alt="'+escapeHTML(alt)+'" width="44" height="44">'}
function showPlayerSettings(){
 const players=onlineSession?(onlineRoom?state.players.filter(p=>p.id===onlineRoom.me):[]):state.players;
 const members=onlineSession&&onlineRoom?.status==='lobby'?[{id:onlineRoom.me,name:onlineRoom.members[onlineRoom.me].name,avatar:onlineRoom.members[onlineRoom.me].avatar}]:players;
 modal('头像与自动掷骰','<p>选择你的旅程伙伴。棋子编号保持不变。</p><div class="avatar-settings">'+members.map(p=>'<label>'+escapeHTML(p.name)+'<span class="avatar-choice-row">'+avatarImage(p.avatar)+'<select data-avatar-player="'+p.id+'">'+AVATARS.map(a=>'<option value="'+a.id+'"'+(a.id===p.avatar?' selected':'')+'>'+a.name+'</option>').join('')+'</select></span></label>').join('')+'</div><button class="primary" id="settingsAutoRoll">'+(autoRollEnabled?'关闭自动掷骰':'开启自动掷骰')+'</button><p>仅在你的掷骰阶段自动行动。买地、升级、交易与结束回合仍由你确认；弹窗和后台页面暂停自动掷骰。</p>');
 $('#settingsAutoRoll').onclick=()=>{toggleAutoRoll();$('#settingsAutoRoll').textContent=autoRollEnabled?'关闭自动掷骰':'开启自动掷骰'};
 document.querySelectorAll('[data-avatar-player]').forEach(select=>select.onchange=()=>{
  const avatar=select.value;if(onlineSession){onlineLobbyCommand('profile',{avatar});return}
  state.players[Number(select.dataset.avatarPlayer)].avatar=avatar;if(Number(select.dataset.avatarPlayer)===0){preferredAvatar=avatar;try{localStorage.setItem('world-tycoon-avatar',avatar)}catch(e){}}select.previousElementSibling.src='assets/avatars/'+avatar+'.svg';save();updateV6UI();
 });
}
profileButton.onclick=showPlayerSettings;
function updateV6UI(){
 const label=autoRollEnabled?'自动掷骰 · 开启':'自动掷骰 · 关闭';if(autoRollButton.textContent!==label)autoRollButton.textContent=label;autoRollButton.setAttribute('aria-pressed',String(autoRollEnabled));
 autoRollButton.hidden=!!onlineSession&&!onlineRoom?.game;
 $('#players').querySelectorAll('.player').forEach((card,i)=>{const p=state.players[i];if(!p)return;let img=card.querySelector('.cartoon-avatar');const id=AVATARS.some(a=>a.id===p.avatar)?p.avatar:AVATARS[i].id;if(!img){const host=document.createElement('span');host.innerHTML=avatarImage(id);img=host.firstChild;card.prepend(img)}else if(!img.src.endsWith('/'+id+'.svg'))img.src='assets/avatars/'+id+'.svg';});
 $('#onlinePanel').querySelectorAll('.online-members>span').forEach((el,i)=>{const m=onlineRoom?.members[i];if(m&&!el.querySelector('img')){const wrap=document.createElement('span');wrap.innerHTML=avatarImage(m.avatar);el.prepend(wrap.firstChild)}});
 let art=$('#mapPostcard');if(!art){art=document.createElement('img');art.id='mapPostcard';art.alt='';art.setAttribute('aria-hidden','true');art.width=320;art.height=120;$('.board-center').prepend(art)}const src='assets/maps/'+state.map+'.svg';if(!art.src.endsWith('/'+state.map+'.svg'))art.src=src;
}
const v6Render=render,v6OnlinePanel=renderOnlinePanel;
render=function(){v6Render();updateV6UI()};renderOnlinePanel=function(){v6OnlinePanel();updateV6UI()};
const v6ShowTile=showTile;showTile=function(i){v6ShowTile(i);const card=document.createElement('div');card.className='city-postcard';card.innerHTML='<img src="assets/maps/'+state.map+'.svg" alt="" width="480" height="180"><span>'+escapeHTML(tiles[i].name)+' · '+escapeHTML(activeMap.name)+'</span>';$('#modalBody').prepend(card)};
const v6DrawMaps=drawMapPicker;drawMapPicker=function(){v6DrawMaps();document.querySelectorAll('[data-map]').forEach(b=>{const img=document.createElement('img');img.src='assets/maps/'+b.dataset.map+'.svg';img.alt='';img.width=160;img.height=60;img.className='map-preview-art';b.prepend(img)})};
const v6Modal=modal;modal=function(...args){v6Modal(...args);if($('#startGame')&&!$('#localAvatar')){const label=document.createElement('label');label.innerHTML='卡通头像<select id="localAvatar">'+AVATARS.map(a=>'<option value="'+a.id+'"'+(a.id===preferredAvatar?' selected':'')+'>'+a.name+'</option>').join('')+'</select>';$('.setup-basic').append(label);$('#localAvatar').onchange=e=>{preferredAvatar=e.target.value;try{localStorage.setItem('world-tycoon-avatar',preferredAvatar)}catch(e){}}}};
const v6MakeGame=makeGame;makeGame=function(...args){const game=v6MakeGame(...args);game.players[0].avatar=preferredAvatar;return game};
updateV6UI();
