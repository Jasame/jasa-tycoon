'use strict';
let onlineSession=null,onlineRoom=null,onlineTimer=null,onlineConnected=false,onlinePending=null,onlineSending=false,onlineOffset=0,onlineBusy=false,onlinePolling=false,onlineLastConfirmed='';
const ONLINE_SESSION='world-tycoon-online-session',ONLINE_RECENT='world-tycoon-online-seats';
const offline={render,renderAction,save,scheduleAI,canManage,roll,buy,skipBuy,endTurn,bail,build,sellBuilding,toggleMortgage,confirmBankrupt,auctionBid,showTrade,showAssets,setup,showSaveCenter};
function onlineStore(){
 try{if(onlineSession)sessionStorage.setItem(ONLINE_SESSION,JSON.stringify({...onlineSession,pending:onlinePending}));else sessionStorage.removeItem(ONLINE_SESSION)}catch(e){}
}
function rememberSeat(session,name){
 try{const list=JSON.parse(localStorage.getItem(ONLINE_RECENT)||'[]').filter(x=>x.code!==session.code||x.token!==session.token);list.unshift({...session,name,date:new Date().toISOString()});localStorage.setItem(ONLINE_RECENT,JSON.stringify(list.slice(0,6)))}catch(e){}
}
async function onlineAPI(route,data={},session=onlineSession){
 if(location.protocol!=='https:'&&!['localhost','127.0.0.1'].includes(location.hostname))throw Error('请使用 HTTPS 打开联机页面');
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
 try{const response=await fetch('/tycoon/api/'+route,{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json',...(session?{Authorization:'Bearer '+session.token}:{})},body:JSON.stringify({...data,...(session?{code:session.code}:{})}),signal:controller.signal});let result;try{result=await response.json()}catch(e){throw Error('联机服务暂不可用')};if(!response.ok)throw Object.assign(Error(result.error||'请求未成功'),{status:response.status});return result}finally{clearTimeout(timer)}
}
function renderOnlinePanel(){
 $('#onlineButton').textContent=onlineSession?'联机房间 · '+onlineSession.code:'远程联机';
 const panel=$('#onlinePanel');panel.hidden=!onlineSession;if(onlineSession){$('#roll').disabled=!canOnlineAct()||state.phase!=='roll';$('#end').disabled=!canOnlineAct()||state.phase!=='end';}if(!onlineSession||!onlineRoom)return;
 const r=onlineRoom;$('.layout').hidden=['lobby','countdown'].includes(r.status);$('.map-rule').hidden=['lobby','countdown'].includes(r.status);if(r.status==='lobby'){const map=MAPS.find(m=>m.id===r.options.map);$('#mapTitle').textContent=(map?.icon||'▥')+' '+(map?.name||'城市经典');$('#mapSubtitle').textContent='朋友加入并准备后即可开始';}const left=r.deadline?Math.max(0,Math.ceil((r.deadline-Date.now()-onlineOffset)/1000)):0;
 const focusedId=panel.contains(document.activeElement)?document.activeElement.id:null;panel.innerHTML=`<div class="online-heading"><div><small>ONLINE ROOM · ${r.status==='lobby'?'等待开局':r.status==='finished'?'本局结束':'多人对局'}</small><h2>房间 ${r.code}</h2><p>${onlineConnected?'● 已同步':'◌ 正在重连…'}${onlinePending?' · 操作确认中':''}${r.deadline?' · 本阶段剩余 '+left+' 秒':''}</p></div><div class="online-tools"><button id="copyInvite">复制邀请链接</button><button id="roomDetails">房间与重连</button><button id="returnLocal">返回本地对局</button></div></div><div class="online-members">${r.members.map((m,i)=>`<span class="${i===r.me?'self':''}">${escapeHTML(m.name)}${i===r.me?'（你）':''}<small>${m.bot?'AI':m.online?'在线':'离线'}${r.status==='lobby'?(m.ready?' · 已准备':' · 未准备'):''}</small></span>`).join('')}</div>${r.status==='lobby'?'<p>分享房间码邀请朋友。至少两个席位准备后，由房主开始。可用人机补足空位。初始资金 '+money(mapStartingCash(r.options.map))+' · 最多 '+r.options.capacity+' 人。</p><div class="online-tools"><button id="toggleReady">'+(r.members[r.me]?.ready?'取消准备':'我已准备')+'</button>'+(r.host?'<button id="startRoom">开始联机对局</button>':'<span>等待房主开始…</span>')+'</div>':'<p class="online-note">骰子与资产由服务器结算。超时未操作将自动掷骰、放弃购买/竞价、拒绝交易或结束回合；离线席位保留，可随时重连。</p>'}`;
 if(r.status==='lobby'&&r.host){const controls=document.createElement('div');controls.className='online-tools v6-bot-controls';controls.innerHTML=(r.members.length<r.options.capacity?'<button id="addBot">添加人机</button>':'')+r.members.filter(m=>m.bot).map(m=>'<button data-remove-bot="'+m.id+'">移除 '+escapeHTML(m.name)+'</button>').join('');panel.append(controls);if($('#addBot'))$('#addBot').onclick=()=>onlineLobbyCommand('addBot');controls.querySelectorAll('[data-remove-bot]').forEach(b=>b.onclick=()=>onlineLobbyCommand('removeBot',{memberId:b.dataset.removeBot}));}
 if(r.status==='countdown'){const countdown=document.createElement('div');countdown.className='countdown-note';countdown.textContent='准备出发 · '+left+' 秒';panel.append(countdown);if(r.host){const cancel=document.createElement('button');cancel.id='cancelRoomStart';cancel.textContent='取消倒计时';cancel.onclick=()=>onlineLobbyCommand('cancelStart');panel.append(cancel)}}
 $('#copyInvite').onclick=async()=>{const link=location.origin+'/tycoon/?room='+r.code;try{await navigator.clipboard.writeText(link);toast('邀请链接已复制')}catch(e){modal('邀请朋友',`<p>把以下链接发给朋友：</p><input readonly value="${escapeHTML(link)}"><p>房间码：${r.code}</p>`)}};
 $('#roomDetails').onclick=showOnline;
 $('#returnLocal').onclick=confirmGoLocal;
 if($('#toggleReady'))$('#toggleReady').onclick=()=>onlineLobbyCommand('ready',{ready:!r.members[r.me].ready});
 if($('#startRoom'))$('#startRoom').onclick=()=>onlineLobbyCommand('start',{countdown:true});
 panel.querySelectorAll('button').forEach(b=>{if(!['copyInvite','roomDetails','returnLocal'].includes(b.id))b.disabled=!onlineConnected||!!onlinePending||onlineBusy});
 if(focusedId&&$('#'+focusedId)&&!$('#'+focusedId).disabled)$('#'+focusedId).focus({preventScroll:true});
}
function applyOnline(result,force=false){
 if(!onlineSession||result.code!==onlineSession.code||onlineRoom&&result.revision<onlineRoom.revision)return;
 const changed=!onlineRoom||result.revision!==onlineRoom.revision;onlineRoom=result;onlineConnected=true;onlineOffset=result.serverTime-Date.now();
 if(onlinePending&&result.ack?.includes(onlinePending.actionId)){const keepSettings=onlinePending.route==='profile'&&!!$('#communityToolBody');onlinePending=null;onlineLastConfirmed='上次操作已确认';onlineStore();if(!keepSettings)$('#modal').hidden=true}
 const assetOpen=!$('#modal').hidden&&!!$('#onlineAssets'),oldScroll=$('.modal').scrollTop,assetFocus=document.activeElement?.dataset?.assetKey;
 if(result.game&&(changed||force)){clearTimeout(aiTimer);state=result.game;activateMap(state.map,fastRules());selected=-1;render();if(state.over)showResults();else if(assetOpen&&!$('#modal').hidden){showAssets();$('.modal').scrollTop=oldScroll;if(assetFocus){const next=$('#onlineAssets').querySelector('[data-asset-key="'+assetFocus+'"]');if(next&&!next.disabled)next.focus({preventScroll:true})}}}
 else{renderOnlinePanel();if(result.game)renderAction();else if(changed)renderAction()}
}
async function pollOnline(){
 clearTimeout(onlineTimer);if(!onlineSession||onlinePolling)return;onlinePolling=true;
 const session=onlineSession;
 try{const result=await onlineAPI('state',{},session);if(session!==onlineSession)return;applyOnline(result);if(onlinePending&&!onlineSending)await dispatchOnline()}
 catch(e){if(session!==onlineSession)return;onlineConnected=false;if(e.status===401||e.status===404){toast(e.message+'，可返回本地对局后重新加入。')}renderOnlinePanel();renderAction()}
 finally{onlinePolling=false;if(session===onlineSession)onlineTimer=setTimeout(pollOnline,onlineConnected?2000:5000)}
}
async function enterOnline(result,token){
 if(!onlineSession&&!archiveCurrent())return;
 clearTimeout(onlineTimer);clearTimeout(aiTimer);onlineSession={code:result.code,token};onlineRoom=null;onlinePending=null;onlineStore();rememberSeat(onlineSession,result.members[result.me]?.name||'玩家');$('#modal').hidden=true;applyOnline(result,true);pollOnline();toast('已进入联机房间');
}
async function dispatchOnline(){
 if(!onlinePending||!onlineSession||onlineSending)return;onlineSending=true;const pending=onlinePending,session=onlineSession;
 try{const result=await onlineAPI(pending.route,pending,session);if(session!==onlineSession)return;onlinePending=null;onlineLastConfirmed='上次操作已确认';onlineStore();if(!(pending.route==='profile'&&$('#communityToolBody')))$('#modal').hidden=true;applyOnline(result,true)}
 catch(e){if(session!==onlineSession)return;if(e.status){onlinePending=null;onlineStore();toast(e.message);if(e.status===409)await pollOnline()}else{onlineConnected=false;toast('操作结果待确认，正在重连。请勿重复操作。')}}
 finally{onlineSending=false;renderOnlinePanel();if(onlineSession)renderAction()}
}
function onlineCommand(command,arg){
 if(!onlineSession||!onlineRoom?.game||!onlineConnected||onlinePending){toast('请等待同步完成。');return}
 onlinePending={route:'action',command,arg,revision:onlineRoom.revision,actionId:crypto.randomUUID()};onlineStore();render();dispatchOnline();
}
function onlineLobbyCommand(route,args={}){
 if(!onlineConnected||onlinePending)return;onlinePending={...args,route,revision:onlineRoom.revision,actionId:crypto.randomUUID()};onlineStore();renderOnlinePanel();dispatchOnline();
}
function canOnlineAct(){return !!onlineSession&&onlineRoom?.status==='playing'&&onlineConnected&&!onlinePending&&state.turn===onlineRoom.me&&!state.over&&!['auction','trade'].includes(state.phase)}
render=function(){offline.render();if(onlineSession){$('#roll').disabled=!canOnlineAct()||state.phase!=='roll';$('#end').disabled=!canOnlineAct()||state.phase!=='end';$('#modeLabel').textContent='远程联机 · '+onlineRoom?.members.length+' 人 · '+activeMap.name;if(onlineRoom?.game&&!state.over&&state.turn!==onlineRoom.me&&!['auction','trade'].includes(state.phase))$('#turnText').textContent='等待 '+current().name+' 行动';$('#players').querySelectorAll('.player-name span').forEach(el=>el.remove());renderOnlinePanel()}};
save=function(){if(onlineSession){$('#saveStatus').textContent=onlineConnected?'● 联机进度已由服务器保存':'◌ 正在恢复连接';return}offline.save()};
scheduleAI=function(){if(onlineSession){clearTimeout(aiTimer);return}offline.scheduleAI()};
canManage=function(){return onlineSession?canOnlineAct():offline.canManage()};
renderAction=function(){
 if(!onlineSession)return offline.renderAction();
 if(onlineRoom?.status==='countdown'){action('准备出发','倒计时结束后自动开始。');return}
 if(!onlineRoom?.game){action('朋友到齐，就出发','通过上方房间码邀请朋友，准备好后由房主开局。');return}
 if(!onlineConnected||onlinePending){action(onlinePending?'正在确认操作':'正在重连服务器','请稍候，确认最新对局状态后即可继续。');return}
 if(state.over){offline.renderAction();return}
 const me=onlineRoom.me;
 if(state.phase==='auction'){
  if(state.auction.bidder===me)offline.renderAction();else action('公开拍卖 · '+tiles[state.auction.tile].name,'等待 '+state.players[state.auction.bidder].name+' 竞价。当前报价 '+money(state.auction.price)+'。');return;
 }
 if(state.phase==='trade'){
  const o=state.offer;if(o.seller===me)action('收到地产收购邀约',`${state.players[o.buyer].name} 希望以 ${money(o.price)} 收购 ${tiles[o.tile].name}。是否接受？`,[['接受报价',()=>onlineCommand('acceptTrade')],['拒绝报价',()=>onlineCommand('rejectTrade'),true]]);
  else action('等待卖方答复',state.players[o.seller].name+' 正在考虑地产收购报价。');return;
 }
 if(state.turn!==me){action('轮到 '+current().name+' 行动','你可以查看棋盘和自己的资产。服务器正在等待对方完成回合。',[['查看我的资产',showAssets]]);return}
 offline.renderAction();
};
for(const [name,command]of [['roll','roll'],['buy','buy'],['skipBuy','skip'],['endTurn','end'],['bail','bail']]){
 const wrapped=(...args)=>onlineSession?onlineCommand(command):offline[name](...args);
 if(name==='roll')roll=wrapped;else if(name==='buy')buy=wrapped;else if(name==='skipBuy')skipBuy=wrapped;else if(name==='endTurn')endTurn=wrapped;else bail=wrapped;
}
build=(i,ui=true)=>onlineSession?onlineCommand('build',{tile:i}):offline.build(i,ui);
sellBuilding=i=>onlineSession?onlineCommand('sell',{tile:i}):offline.sellBuilding(i);
toggleMortgage=i=>onlineSession?onlineCommand('mortgage',{tile:i}):offline.toggleMortgage(i);
auctionBid=bid=>onlineSession?onlineCommand(bid?'bid':'pass'):offline.auctionBid(bid);
confirmBankrupt=function(){if(!onlineSession)return offline.confirmBankrupt();if(!canOnlineAct()||current().cash>=0)return;modal('确认宣布破产？','<p>你的地产将归还银行，你可继续观看朋友的对局。</p><button class="primary" id="onlineBankrupt">确认宣布破产</button>');$('#onlineBankrupt').onclick=()=>onlineCommand('bankrupt')};
showAssets=function(){
 if(!onlineSession)return offline.showAssets();if(!onlineRoom?.game){toast('等待对局开始');return}const p=state.players[onlineRoom.me];
 modal(p.name+' 的资产',`<p>现金 ${money(p.cash)} · 总资产 ${money(worth(p))}。${fastRules()?'第 '+nextUpkeepRound(p)+' 回合维护费预估 '+money(upkeepFee(p))+'。':''}${canOnlineAct()?'轮到你行动，可管理地产。':'等待你的回合后可管理地产。'}</p><div id="onlineAssets"></div>`);
 const list=$('#onlineAssets');if(!owned(p.id).length)list.textContent='还没有地产。';
 for(const t of owned(p.id)){const r=state.props[t.i],row=document.createElement('div');row.className='prop-row';row.innerHTML=`<div>${escapeHTML(t.name)}<small>${r.mortgage?'已抵押':r.level+' 级 · 租金 '+money(rent(t))}</small></div>`;
  if(canOnlineAct()){const buttons=document.createElement('div');for(const [label,cmd]of [[r.mortgage?'赎回':'抵押','mortgage'],...(t.type==='property'?[['升级 '+money(paymentCost(p,t)),'build'],...(r.level?[['售楼','sell']]:[])]:[])]){const b=document.createElement('button');b.textContent=label;b.dataset.assetKey=cmd+'-'+t.i;if(cmd==='build'){b.disabled=!canBuild(p,t);b.title=buildReason(p,t);if(b.disabled){const why=document.createElement('small');why.textContent=buildReason(p,t);row.firstElementChild.append(why)}}if(cmd==='mortgage'){b.disabled=!!mortgageReason(p,t);b.title=mortgageReason(p,t)}b.onclick=()=>onlineCommand(cmd,{tile:t.i});buttons.append(b)}row.append(buttons)}list.append(row);
 }
};
showTrade=function(){
 if(!onlineSession)return offline.showTrade();if(!canOnlineAct()){toast('请等待你的回合');return}
 const available=tiles.filter(t=>state.props[t.i].owner!==null&&state.props[t.i].owner!==onlineRoom.me&&tradeable(t.i,state.props[t.i].owner));
 modal('向朋友提出收购',available.length?'<p>选择未抵押、符合建筑资格的未开发的地产。卖方接受后由服务器结算；等待期间对局暂停至答复或超时。</p><label>收购地产<select id="netTradeTile">'+available.map(t=>`<option value="${t.i}">${escapeHTML(t.name)} · ${escapeHTML(state.players[state.props[t.i].owner].name)}</option>`).join('')+'</select></label><label>出价<input id="netTradePrice" type="number" min="100" step="100" value="2000"></label><button class="primary" id="netTradeSend">发送收购邀约</button>':'<p>目前没有可收购的地产。</p>');
 if($('#netTradeSend'))$('#netTradeSend').onclick=()=>onlineCommand('offerTrade',{tile:Number($('#netTradeTile').value),price:Number($('#netTradePrice').value)});
};
setup=function(){return onlineSession?showOnline():offline.setup()};
showSaveCenter=function(){if(onlineSession){modal('联机进度自动保存','<p>本房间由服务器保存进度。刷新页面会恢复你的座位。可在“房间与重连”中返回已保存的房间。</p><p>本地手动存档与联机对局互相独立。</p>');return}offline.showSaveCenter()};
function confirmGoLocal(){
 modal('返回本地对局？','<p>联机房间和座位会保留，可稍后重连；离线后超时操作仍由服务器托管。本地对局将从本地存档恢复。</p><button class="primary" id="goLocal">返回本地对局</button>');
 $('#goLocal').onclick=()=>{const lobby=onlineRoom?.status==='lobby';if(lobby&&onlineConnected&&!onlinePending)onlineAPI('leave',{revision:onlineRoom.revision,actionId:crypto.randomUUID()}).catch(()=>{});clearTimeout(onlineTimer);onlineSession=null;onlineRoom=null;onlinePending=null;onlineConnected=false;onlineStore();try{const clean=new URL(location.href);clean.searchParams.delete('room');history.replaceState(null,'',clean.pathname+clean.search+clean.hash)}catch(e){}state=loadCurrentGame();activateMap(state.map,fastRules());$('#onlinePanel').hidden=true;renderOnlinePanel();$('.layout').hidden=false;$('.map-rule').hidden=false;$('#modal').hidden=true;render();scheduleAI()};
}
function showOnline(){
 if(location.protocol==='http:'&&!['localhost','127.0.0.1'].includes(location.hostname)){location.assign('https://jasa.hk/tycoon/'+location.search);return}
 if(busy){toast('请等待棋子移动完成');return}
 if(onlineSession){modal('联机房间 '+onlineSession.code,`<p>你的座位：${escapeHTML(onlineRoom?.members[onlineRoom.me]?.name||'正在恢复')}。房间进度由服务器保存，刷新本页即可重连。</p><p>邀请朋友访问 ${location.origin}/tycoon/?room=${onlineSession.code}</p><p>房间阶段超时为 180 秒。离开不会立刻移除已经开局的座位。</p><button class="primary" id="backRoom">继续对局</button><button class="wide" id="leaveRoom">返回本地对局</button>`);$('#backRoom').onclick=closeModal;$('#leaveRoom').onclick=confirmGoLocal;return}
 let recent=[];try{recent=JSON.parse(localStorage.getItem(ONLINE_RECENT)||'[]')}catch(e){}
 const invited=new URLSearchParams(location.search).get('room')||'';
 modal('邀请朋友，环球同行',`<p>支持 2–4 人远程对局。创建房间分享邀请码，朋友加入并准备后即可开局。服务器统一结算，支持刷新重连。</p><label>你的昵称<input id="onlineName" maxlength="12" value="旅人"></label><label>卡通头像<select id="onlineAvatar">${AVATARS.map(a=>'<option value="'+a.id+'"'+(a.id===state.players[0]?.avatar?' selected':'')+'>'+a.name+'</option>').join('')}</select></label><div class="online-create"><label>地图<select id="onlineMap">${MAPS.map(m=>`<option value="${m.id}">${m.name} · ${MAP_RULES[m.id].title}</option>`).join('')}</select></label><label>房间人数<select id="onlineCapacity"><option value="4">最多 4 人</option><option value="3">最多 3 人</option><option value="2">2 人</option></select></label><label>对局回合<select id="onlineLimit"><option value="20">竞速 · 20 回合</option><option value="30">经营 · 30 回合</option><option value="0">直到最后一人</option></select></label><button class="primary" id="createOnline">创建房间</button></div><div class="online-join"><label>朋友的房间码<input id="onlineCode" maxlength="8" value="${escapeHTML(invited.toUpperCase().replace(/[^A-F0-9]/g,'').slice(0,8))}" placeholder="8 位房间码"></label><button class="wide" id="joinOnline">加入朋友的房间</button></div>${recent.length?'<h3>恢复已保存的座位</h3><div id="recentSeats">'+recent.map((s,i)=>`<button class="wide" data-reconnect="${i}">${escapeHTML(s.name)} · ${escapeHTML(s.code)}</button>`).join('')+'</div>':''}<p class="save-note">座位凭证保存在此浏览器，邀请链接只包含房间码。等待中的房间保留 24 小时，已开局进度在最后一次操作后保留 7 天。不同浏览器可通过邀请码加入。</p>`);
 const join=async route=>{if(onlineBusy)return;onlineBusy=true;$('#createOnline').disabled=true;$('#joinOnline').disabled=true;try{const data={cosmetics:typeof ownCosmetics==='function'?ownCosmetics():undefined,community:true,experience:true,pace:$('#onlinePace')?.value||'standard',difficulty:$('#onlineDifficulty')?.value||'normal',personality:$('#onlinePersonality')?.value||'mixed',name:$('#onlineName').value,avatar:$('#onlineAvatar').value,career:$('#onlineCareer')?.value||'architect',expansion:$('#onlineRuleMode')?.value!=='classic',map:$('#onlineMap').value,capacity:Number($('#onlineCapacity').value),limit:Number($('#onlineLimit').value),code:$('#onlineCode').value.trim().toUpperCase()};const result=await onlineAPI(route,data,null);await enterOnline(result,result.token)}catch(e){toast(e.message)}finally{onlineBusy=false;if($('#createOnline'))$('#createOnline').disabled=false;if($('#joinOnline'))$('#joinOnline').disabled=false}};
 $('#createOnline').onclick=()=>join('create');$('#joinOnline').onclick=()=>join('join');
 document.querySelectorAll('[data-reconnect]').forEach(b=>b.onclick=async()=>{const seat=recent[Number(b.dataset.reconnect)];try{const result=await onlineAPI('state',{},seat);await enterOnline(result,seat.token)}catch(e){toast(e.message)}});
}
$('#onlineButton').onclick=showOnline;
// Initial game loading happens locally before the networking module is enabled.
try{const saved=JSON.parse(sessionStorage.getItem(ONLINE_SESSION)||'null');if(saved?.code&&saved?.token&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname))){onlineSession={code:saved.code,token:saved.token};onlinePending=saved.pending||null;clearTimeout(aiTimer);pollOnline()}}catch(e){}
if(!onlineSession&&new URLSearchParams(location.search).get('room'))showOnline();
renderOnlinePanel();
