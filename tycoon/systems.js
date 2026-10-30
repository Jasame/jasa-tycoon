'use strict';
let chosenMap='world';
function drawMapPicker(){
 chosenMap=activeMap.id;
 const host=$('#mapPicker');
 host.innerHTML='<p class="eyebrow">选择你的下一段旅程 · 8 张地图</p><div class="map-grid">'+MAPS.map(m=>`<button type="button" class="map-card ${chosenMap===m.id?'chosen':''}" data-map="${m.id}" style="--map-color:${m.color}"><b>${m.icon} ${m.name}</b><small>${m.en}</small><span>${m.desc}</span><em>${MAP_RULES[m.id].title} · ${MAP_RULES[m.id].text}</em></button>`).join('')+'<button type="button" class="map-card '+(chosenMap==='legacy'?'chosen':'')+'" data-map="legacy"><b>▥ 城市经典</b><small>ORIGINAL</small><span>保留最初的中国城市棋盘。</span></button></div>';
 host.querySelectorAll('[data-map]').forEach(b=>b.onclick=()=>{chosenMap=b.dataset.map;host.querySelectorAll('[data-map]').forEach(x=>x.classList.toggle('chosen',x===b))});
}
function renderAtlas(){
 document.documentElement.style.setProperty('--map-accent',activeMap.color);
 $('#mapTitle').textContent=activeMap.icon+' '+activeMap.name;
 $('#mapSubtitle').textContent=activeMap.desc;
 $('#marketLabel').textContent=(state.market?.name||'平稳市场')+' · 租金 ×'+(state.market?.factor||1);
 $('#mapCenter').textContent=activeMap.en;
 $('.players-panel h2 span').textContent=String(state.players.length).padStart(2,'0');
 $('#trade').disabled=!canManage()||current().cash<0;
 $('#atlas').onclick=()=>{if(busy){toast('请等待移动完成。');return}setup()};
 $('#trade').onclick=showTrade;
 $('#journal').onclick=showJournal;
 $('#mapRuleTitle').textContent=specialRules()?mapRule().title:'经典规则 · 兼容存档';$('#mapRuleText').textContent=journeyStatus();$('#saveCenter').onclick=showSaveCenter;$('#guide').onclick=()=>showGuide();$('#ranking').onclick=()=>{modal('实时资产榜',rankingHTML());};
 if(state.phase==='auction')$('#turnText').textContent='地产拍卖进行中';
}
function marketEvent(){
 if(hasAdventure()){adventureNews();return}

 const events=[['旅游旺季',1.25],['城市复苏',1.15],['平稳市场',1],['淡季调整',.8],['投资热潮',1.35]];
 const [name,factor]=events[Math.floor(Math.random()*events.length)];state.market={name,factor};
 log('全球市场：'+name+'。所有地产租金 ×'+factor+'，持续到下一次市场更新。');
}
function startAuction(i){
 state.phase='auction';state.pending=null;
 state.auction={tile:i,price:0,leader:null,bidder:state.turn,passed:[],step:100};
 log(tiles[i].name+' 进入公开拍卖，起拍 ¥100，每次加价 ¥100。');render();scheduleAI();
}
function renderAuctionAction(){
 const a=state.auction,p=state.players[a.bidder],t=tiles[a.tile];
 action('公开拍卖 · '+t.name,`轮到 ${p.name} 出价。当前 ${money(a.price)}${a.leader===null?' · 暂无出价':' · 领先者 '+state.players[a.leader].name}。退出后本次不能再竞价。`,p.ai?[]:[['出价 '+money(a.price+100),()=>auctionBid(true)],['退出竞价',()=>auctionBid(false),true]]);
}
function auctionAI(){
 if(busy||state.over||state.phase!=='auction')return;
 const a=state.auction,p=state.players[a.bidder],t=tiles[a.tile];if(!p.ai)return;
 const others=tiles.filter(x=>x.type==='property'&&x.group===t.group&&x.i!==t.i);
 const completes=t.type==='property'&&others.every(x=>state.props[x.i].owner===p.id);
 const reserve=aiReserve(p);
 const ceiling=aiValue(p,t)*(state.difficulty==='easy'?.8:1);
 auctionBid(a.price+100<=Math.min(p.cash-reserve,ceiling));
}
function auctionBid(bid){
 if(busy||state.over||state.phase!=='auction')return;clearTimeout(aiTimer);
 const a=state.auction,p=state.players[a.bidder];
 if(bid){if(p.cash<a.price+100){toast('现金不足，请退出竞价。');return}a.price+=100;a.leader=p.id;log(p.name+' 报价 '+money(a.price)+'。')}
 else a.passed.push(p.id);
 const candidates=state.players.filter(x=>!x.out&&!a.passed.includes(x.id)&&x.id!==a.leader);
 if(!candidates.length){
  if(a.leader!==null){const winner=state.players[a.leader];winner.cash-=a.price;state.props[a.tile].owner=winner.id;log(winner.name+' 以 '+money(a.price)+' 拍下 '+tiles[a.tile].name+'。')}
  else log(tiles[a.tile].name+' 无人出价，继续由银行持有。');
  if(a.leader!==null)checkAdventures(state.players[a.leader]);state.auction=null;state.phase='end';render();scheduleAI();return;
 }
 do{a.bidder=(a.bidder+1)%state.players.length}while(!candidates.some(x=>x.id===a.bidder));
 render();scheduleAI();
}
function showTrade(){
 if(!canManage()||current().cash<0)return;
 const available=tiles.filter(t=>{const r=state.props[t.i];return r.owner!==null&&r.owner!==current().id&&!r.mortgage&&!tiles.some(x=>x.type==='property'&&x.group===t.group&&state.props[x.i].level>0)});
 modal('地产交易中心','<p>向其他合伙人提出现金收购。交易只接受未抵押、同组无建筑的地产。本地玩家需由卖方亲自确认。</p>'+(available.length?'<label>选择收购地产<select id="tradeTile">'+available.map(t=>`<option value="${t.i}">${t.name} · ${escapeHTML(state.players[state.props[t.i].owner].name)} · 原价 ${money(t.price)}</option>`).join('')+'</select></label><label>出价（至少 ¥100）<input id="tradePrice" type="number" min="100" step="100" value="2000"></label><button class="primary" id="offerTrade">提出收购</button>':'<p>目前没有符合条件的地产。先探索棋盘，等其他合伙人持有地产后再来。</p>'));
 if($('#offerTrade'))$('#offerTrade').onclick=()=>{
  const i=Number($('#tradeTile').value),amount=Number($('#tradePrice').value),buyer=current(),t=tiles[i],r=state.props[i],seller=state.players[r.owner];
  if(!canManage()||!Number.isSafeInteger(amount)||amount<100||amount>buyer.cash){toast('请输入有效报价，且不能超过现金。');return}
  if(seller.ai){const group=tiles.filter(x=>x.type==='property'&&x.group===t.group);const count=group.filter(x=>state.props[x.i].owner===seller.id).length;const threshold=aiSellingPrice(seller,t);if(amount<threshold){toast(seller.name+' 拒绝了报价。可以提高出价再试。');return}finishTrade(i,amount,buyer.id,seller.id)}
  else{clearTimeout(aiTimer);modal('请交给 '+seller.name+' 确认',`<p>${escapeHTML(buyer.name)} 希望以 ${money(amount)} 收购你的 ${t.name}。接受后地产和现金立即转移。</p><button class="primary" id="acceptTrade">卖方接受交易</button><button class="secondary wide" id="rejectTrade">拒绝</button>`);$('#acceptTrade').onclick=()=>finishTrade(i,amount,buyer.id,seller.id);$('#rejectTrade').onclick=closeModal;}
 };
}
function finishTrade(i,amount,buyerId,sellerId){if(!canManage()||current().id!==buyerId)return;if(!transferProperty(i,amount,buyerId,sellerId)){toast('交易条件已变化，请重新报价。');return}closeModal();render();toast('交易完成')}
function rankingHTML(){return [...state.players].sort((a,b)=>(a.out-b.out)||worth(b)-worth(a)).map((p,i)=>`<div class="prop-row"><div>${i===0?'🏆':i+1} ${escapeHTML(p.name)}<small>${owned(p.id).length} 处地产 · ${p.out?'已破产':'现金 '+money(p.cash)}</small></div><strong>${money(worth(p))}</strong></div>`).join('')}
function showJournal(){modal('旅程记录',`<p>${activeMap.name} · 第 ${state.round} 回合 · ${state.difficulty==='expert'?'进阶':state.difficulty==='easy'?'休闲':'标准'} AI</p>`+rankingHTML()+'<h3>最近 50 条城市动态</h3><div class="journal">'+state.logs.map(x=>`<p><small>第 ${x.round} 回合</small> ${escapeHTML(x.text)}</p>`).join('')+'</div>');}
