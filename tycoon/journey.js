'use strict';
const MAP_RULES={
 world:{title:'环球护照',text:'亲自到访 8 个颜色组的地产，领取一次 ¥2,000 环球奖励。'},
 asia:{title:'亚洲贸易网',text:'未抵押交通枢纽的租金提高 50%。'},
 europe:{title:'铁路通票',text:'经过起点时，每持有一座未抵押交通枢纽，额外获得 ¥250。'},
 africa:{title:'生态经营',text:'每次轮到你行动，每处未开发且未抵押的地产提供 ¥100 生态补贴，最高 ¥500。'},
 'north-america':{title:'建设热潮',text:'建筑造价降低 20%，按 ¥100 向上取整；售楼与资产估值使用实际造价。'},
 'south-america':{title:'冒险基金',text:'每次抽取机遇卡后，额外获得 ¥500 冒险基金。'},
 oceania:{title:'海岛假日',text:'免费停车补贴提高至 ¥800；停在自己的未抵押枢纽，获得 ¥300 观光收入。'},
 antarctica:{title:'科研网络',text:'每次轮到你行动，每级建筑提供 ¥100 科研拨款，最高 ¥800。'},
 legacy:{title:'经典经营',text:'原版规则，不附加地图经济效果。'}
};
function specialRules(){return state.rulesVersion>=3}
function mapRule(){return MAP_RULES[state.map]||MAP_RULES.legacy}
function mapBuildCost(t){const base=Math.ceil(t.price*.5/100)*100;return specialRules()&&state.map==='north-america'?Math.ceil(base*.8/100)*100:base}
function activeStations(p){return owned(p.id).filter(t=>t.type==='station'&&!state.props[t.i].mortgage).length}
function mapRentFactor(t){return specialRules()&&state.map==='asia'&&t.type==='station'?1.5:1}
function onPassStart(p){if(specialRules()&&state.map==='europe'){const bonus=activeStations(p)*250;if(bonus){p.cash+=bonus;log(p.name+' 获得铁路通票奖励 '+money(bonus)+'。')}}}
function onTurnStart(p){
 if(!specialRules()||p.out)return;
 let bonus=0;
 if(state.map==='africa')bonus=Math.min(500,owned(p.id).filter(t=>t.type==='property'&&!state.props[t.i].level&&!state.props[t.i].mortgage).length*100);
 if(state.map==='antarctica')bonus=Math.min(800,owned(p.id).reduce((s,t)=>s+state.props[t.i].level*100,0));
 if(bonus){p.cash+=bonus;log(p.name+' 获得'+(state.map==='africa'?'生态补贴 ':'科研拨款 ')+money(bonus)+'。')}
}
function onMapLanding(p,t){
 if(!specialRules())return;
 if(state.map==='world'&&t.type==='property'){
  state.passports||={};const passport=state.passports[p.id]||{groups:[],rewarded:false};state.passports[p.id]=passport;
  if(!passport.groups.includes(t.group)){passport.groups.push(t.group);log(p.name+' 集齐 '+passport.groups.length+'/8 枚环球印章。')}
  if(passport.groups.length===8&&!passport.rewarded){passport.rewarded=true;p.cash+=2000;log(p.name+' 完成环球护照，获得 ¥2,000！');toast('环球护照已集齐！')}
 }
 if(state.map==='south-america'&&t.type==='chance'){p.cash+=500;log(p.name+' 获得 ¥500 冒险基金。')}
 if(state.map==='oceania'){
  if(t.type==='park'){p.cash+=500;log(p.name+' 额外获得 ¥500 海岛补贴，本次合计 ¥800。')}
  if(t.type==='station'&&state.props[t.i].owner===p.id&&!state.props[t.i].mortgage){p.cash+=300;log(p.name+' 获得 ¥300 观光收入。')}
 }
}
function journeyStatus(){
 if(!specialRules())return '兼容模式 · 保留本局原有经济规则；新局启用地图特色。';
 const p=current();
 if(state.map==='world')return '环球护照 '+(state.passports?.[p.id]?.groups.length||0)+'/8 · '+mapRule().text;
 return mapRule().text;
}
// AI uses the same cash, dice and prices as human players.
function aiReserve(p){
 const baseline=state.difficulty==='easy'?3200:state.difficulty==='expert'?1100:2000;
 const rents=tiles.filter(t=>state.props[t.i].owner!==null&&state.props[t.i].owner!==p.id).map(t=>rent(t)).sort((a,b)=>b-a);
 return Math.max(baseline,Math.min(6500,(rents[0]||0)*1.4+(rents[1]||0)*.4));
}
function aiValue(p,t){
 if(t.type==='station')return Math.round(t.price*(1+activeStations(p)*.3)*(state.map==='asia'&&specialRules()?1.15:1));
 const group=tiles.filter(x=>x.type==='property'&&x.group===t.group),others=group.filter(x=>x.i!==t.i);
 const mine=others.filter(x=>state.props[x.i].owner===p.id).length;
 const blocks=state.players.some(x=>x.id!==p.id&&!x.out&&others.every(t=>state.props[t.i].owner===x.id));
 return Math.round(t.price*(1+mine/group.length*.6+(mine===others.length?.55:0)+(blocks?.12:0)));
}
function aiSellingPrice(p,t){
 if(t.type==='station')return Math.round(t.price*(activeStations(p)>1?1.8:1.25));
 const group=tiles.filter(x=>x.type==='property'&&x.group===t.group),count=group.filter(x=>state.props[x.i].owner===p.id).length;
 return Math.round(t.price*(count===group.length?2.2:count>1?1.6:1.25));
}
function tradeable(i,sellerId){
 const t=tiles[i],r=state.props[i];return t&&r&&r.owner===sellerId&&!r.mortgage&&!state.players[sellerId]?.out&&
 !(t.type==='property'&&tiles.some(x=>x.type==='property'&&x.group===t.group&&state.props[x.i].level>0));
}
function transferProperty(i,price,buyerId,sellerId){
 const buyer=state.players[buyerId],seller=state.players[sellerId];
 if(!buyer||!seller||buyerId===sellerId||buyer.out||seller.out||!Number.isSafeInteger(price)||price<100||buyer.cash<price||!tradeable(i,sellerId))return false;
 buyer.cash-=price;seller.cash+=price;state.props[i].owner=buyerId;
 log(buyer.name+' 以 '+money(price)+' 从 '+seller.name+' 收购 '+tiles[i].name+'。');return true;
}
function aiTryTrade(p){
 if(state.difficulty==='easy'||p.lastOfferRound===state.round)return false;
 p.lastOfferRound=state.round;
 const candidates=tiles.filter(t=>t.type==='property'&&state.props[t.i].owner!==null&&state.props[t.i].owner!==p.id&&tradeable(t.i,state.props[t.i].owner)&&tiles.filter(x=>x.type==='property'&&x.group===t.group&&x.i!==t.i).every(x=>state.props[x.i].owner===p.id));
 for(const t of candidates){
  const seller=state.players[state.props[t.i].owner],price=Math.ceil(t.price*1.4/100)*100;
  if(p.cash-price<aiReserve(p))continue;
  if(seller.ai){if(price<aiSellingPrice(seller,t))continue;if(transferProperty(t.i,price,p.id,seller.id)){render();return false}}
  else{state.offer={tile:t.i,price,buyer:p.id,seller:seller.id};state.phase='trade';log(p.name+' 向 '+seller.name+' 提出 '+t.name+' 收购报价。');render();return true}
 }
 return false;
}
function renderOffer(){
 const o=state.offer;if(!o){state.phase='end';render();scheduleAI();return}
 action('收购邀约 · 请交给 '+state.players[o.seller].name,`${state.players[o.buyer].name} 希望以 ${money(o.price)} 收购 ${tiles[o.tile].name}（原价 ${money(tiles[o.tile].price)}）。由卖方决定，对局等待你的答复。`,[['接受报价',()=>resolveOffer(true)],['保留地产 · 拒绝',()=>resolveOffer(false),true]]);
}
function resolveOffer(accept){
 if(busy||state.over||state.phase!=='trade'||!state.offer)return;
 const o=state.offer;if(accept&&!transferProperty(o.tile,o.price,o.buyer,o.seller)){toast('报价已失效');return}
 if(!accept)log(state.players[o.seller].name+' 拒绝了收购邀约。');state.offer=null;state.phase='end';render();scheduleAI();
}
function aiManage(p){
 const reserve=aiReserve(p);
 const mortgaged=owned(p.id).filter(t=>state.props[t.i].mortgage).sort((a,b)=>aiValue(p,b)-aiValue(p,a));
 for(const t of mortgaged){const fee=Math.ceil(t.price*55/100);if(p.cash-fee>=reserve){p.cash-=fee;state.props[t.i].mortgage=false;log(p.name+' 赎回 '+t.name+'。');break}}
 const possible=owned(p.id).filter(t=>canBuild(p,t)&&p.cash-cost(t)>=reserve).sort((a,b)=>b.price/cost(b)-a.price/cost(a));
 if(possible.length&&state.difficulty!=='easy')build(possible[0].i,false);
}
const GUIDE=[
 ['欢迎成为城市合伙人','先选一张地图，再决定人数与 AI 风格。每张地图都有专属经营机制；旧存档保留旧规则。','选择地图'],
 ['掷骰，探索新的街区','点击棋盘中央的“掷骰子”。经过起点领取 ¥2,000；停在无主地产可购买，放弃后会公开拍卖。','掷骰子'],
 ['留现金，也要集齐颜色','停在对手地产要付租金。集齐同色组可均衡建造；缺现金时可售楼、抵押，抵押地产不收租。','我的资产'],
 ['交易与地图策略','通过“地产交易”收购其他玩家的地产。AI 也会主动报价，收到邀约时由你接受或拒绝。地图特色显示在棋盘上方。','地产交易'],
 ['为每段旅程留一份存档','“存档中心”提供 5 个手动槽位和自动存档，可导出备份、导入恢复。新局开始前会自动留一份上一局备份。','存档中心']
];
function showGuide(step=0){
 if(busy){toast('请等待棋子移动完成。');return}clearTimeout(aiTimer);
 const [title,text,target]=GUIDE[step];
 modal(title,`<div class="guide-progress">${GUIDE.map((_,i)=>`<span class="${i<=step?'done':''}"></span>`).join('')}</div><p class="guide-count">新手引导 ${step+1} / ${GUIDE.length}</p><p>${text}</p><div class="guide-target">在游戏中寻找：<strong>${target}</strong></div><button class="primary" id="guideNext">${step===GUIDE.length-1?'开始探索 →':'下一步 →'}</button>${step?'<button class="wide" id="guideBack">上一步</button>':''}`);
 $('#guideNext').onclick=()=>{if(step<GUIDE.length-1)showGuide(step+1);else{try{localStorage.setItem('world-tycoon-guide','seen')}catch(e){}closeModal()}};
 if($('#guideBack'))$('#guideBack').onclick=()=>showGuide(step-1);
}
