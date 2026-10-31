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
function mapRule(){const rule=MAP_RULES[state.map]||MAP_RULES.legacy;return fastRules()&&['africa','antarctica'].includes(state.map)?{...rule,text:rule.text.replace(/最高 ¥[58]00/,'最高 ¥300')}:fastRules()&&state.map==='oceania'?{...rule,text:'创业补给额外 +¥500，合计 ¥800／¥1,500；停在自有未抵押枢纽获得 ¥300。'}:rule}
function mapBuildCost(t){const base=Math.ceil(t.price*.5/100)*100;return specialRules()&&state.map==='north-america'?Math.ceil(base*.8/100)*100:base}
function activeStations(p){return owned(p.id).filter(t=>t.type==='station'&&!state.props[t.i].mortgage).length}
function mapRentFactor(t){return specialRules()&&state.map==='asia'&&t.type==='station'?1.5:1}
function onPassStart(p){if(specialRules()&&state.map==='europe'){const bonus=activeStations(p)*250;if(bonus){p.cash+=bonus;log(p.name+' 获得铁路通票奖励 '+money(bonus)+'。')}}}
function onTurnStart(p){
 if(!specialRules()||p.out)return;
 let bonus=0;
 if(state.map==='africa')bonus=Math.min(fastRules()?300:500,owned(p.id).filter(t=>t.type==='property'&&!state.props[t.i].level&&!state.props[t.i].mortgage).length*100);
 if(state.map==='antarctica')bonus=Math.min(fastRules()?300:800,owned(p.id).reduce((s,t)=>s+state.props[t.i].level*100,0));
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
 if(fastRules())return mapRule().text+' 创业竞速：成熟系数 ×'+maturityFactor()+'，第 '+nextUpkeepRound()+' 回合维护费预估 '+money(upkeepFee(current()))+'。';
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
 !(t.type==='property'&&(fastRules()?(r.level>0||!landingRules()&&tiles.some(x=>x.type==='property'&&x.group===t.group&&state.props[x.i].owner===sellerId&&(state.props[x.i].level>=3||state.props[x.i].level===2&&tiles.filter(y=>y.type==='property'&&y.group===t.group&&y.i!==i&&state.props[y.i].owner===sellerId).length<2))):tiles.some(x=>x.type==='property'&&x.group===t.group&&state.props[x.i].level>0)));
}
function transferProperty(i,price,buyerId,sellerId){
 const buyer=state.players[buyerId],seller=state.players[sellerId];
 if(!buyer||!seller||buyerId===sellerId||buyer.out||seller.out||!Number.isSafeInteger(price)||price<100||buyer.cash<price||!tradeable(i,sellerId))return false;
 buyer.cash-=price;seller.cash+=price;state.props[i].owner=buyerId;checkAdventures(buyer);
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
 let [title,text,target]=GUIDE[step];if(fastRules()&&step===1)text='默认 20 回合，快速移动；经过起点领取 ¥1,400。无主地产可购买或公开拍卖，每次加价 ¥500。';if(landingRules()&&step===2)text='再次停在已拥有的房产，每次到访可付费升一级，最高四级；不需要集齐同色。路过或刚买下时不触发。';else if(fastRules()&&step===2)text='单块可开发 1 级，同色两块解锁 2 级，整组解锁 3–4 级。第 8 回合起每 4 回合有维护费；逆风玩家有一次创业援助。';
 modal(title,`<div class="guide-progress">${GUIDE.map((_,i)=>`<span class="${i<=step?'done':''}"></span>`).join('')}</div><p class="guide-count">新手引导 ${step+1} / ${GUIDE.length}</p><p>${text}</p><div class="guide-target">在游戏中寻找：<strong>${target}</strong></div><button class="primary" id="guideNext">${step===GUIDE.length-1?'开始探索 →':'下一步 →'}</button>${step?'<button class="wide" id="guideBack">上一步</button>':''}`);
 $('#guideNext').onclick=()=>{if(step<GUIDE.length-1)showGuide(step+1);else{try{localStorage.setItem('world-tycoon-guide','seen')}catch(e){}closeModal()}};
 if($('#guideBack'))$('#guideBack').onclick=()=>showGuide(step-1);
}

// v5 rules are opt-in per game; existing saves and rooms retain their economy.
function fastRules(){return state?.economy?.v===5}
function startGrant(){return fastRules()?1400:2000}
function maturityFactor(){return !fastRules()||state.round<6?1:state.round<12?1.15:1.3}
function nextUpkeepRound(p=current()){return state.round>=8&&state.round%4===0&&state.economy?.fees[p.id]!==state.round?state.round:Math.max(8,Math.floor(state.round/4+1)*4)}
function upkeepFee(p){
 const portfolio=owned(p.id).reduce((n,t)=>n+t.price,0),levels=owned(p.id).reduce((n,t)=>n+state.props[t.i].level,0);
 return Math.ceil((levels*120+Math.max(0,portfolio-12000)*.02)/100)*100;
}
function auditFee(p){return Math.max(500,Math.ceil((Math.max(0,worth(p)-10000)*.06+owned(p.id).reduce((n,t)=>n+state.props[t.i].level*120,0))/100)*100)}
function isUnderdog(p){const leader=Math.max(...state.players.filter(x=>!x.out).map(worth));return state.round>=6&&worth(p)<leader*.65}
function tryRelief(p){
 if(!fastRules()||p.out||state.economy.relief[p.id]||p.cash>=2000||!isUnderdog(p))return;
 state.economy.relief[p.id]=true;p.cash+=2000;log(p.name+' 获得一次性逆风创业援助 ¥2,000。每人全局限一次，不保证免于破产。');
}
function economyTurn(p){
 if(!fastRules()||p.out)return;
 if(state.round>=8&&state.round%4===0&&state.economy.fees[p.id]!==state.round){state.economy.fees[p.id]=state.round;const fee=upkeepFee(p);p.cash-=fee;if(fee)log(p.name+' 支付资产维护费 '+money(fee)+'（建筑每级 ¥120 + 超过 ¥12,000 的地价总额 2%，向上取整至百元）。')}
 tryRelief(p);
}
function buildReason(p,t){
 const r=state.props[t.i];if(t.type!=='property')return '交通枢纽不能建房';
 if(landingRules()){if(r.owner!==p.id)return '仅业主可升级';if(r.mortgage)return '请先赎回本地产';if(r.level>=4)return '已达最高 4 级';const u=state.economy.upgrade;if(!u||u.player!==p.id||u.tile!==t.i||u.round!==state.round||p.pos!==t.i||state.phase!=='end')return '再次停在这处自有房产后可升级';if(u.used)return '本次到访已处理，下次回来可再升级';if(p.cash<cost(t))return '现金不足，还差 '+money(cost(t)-p.cash);return '';}
 if(r.owner!==p.id)return '仅业主可升级';if(r.mortgage)return '请先赎回本地产';if(r.level>=4)return '已达最高 4 级';
 const group=tiles.filter(x=>x.type==='property'&&x.group===t.group),mine=group.filter(x=>state.props[x.i].owner===p.id);
 if(!fastRules()&&!setOwned(p,t))return '需集齐同色整组地产';
 if(fastRules()&&r.level===1&&mine.length<2)return '升至 2 级需持有至少两块同色地产';
 if(fastRules()&&r.level>=2&&!setOwned(p,t))return '升至 3–4 级需集齐同色整组地产';
 if(mine.some(x=>state.props[x.i].mortgage))return '请先赎回持有的同色地产';
 if((!fastRules()||r.level>=2)&&r.level>Math.min(...group.map(x=>state.props[x.i].level)))return '请先升级同组等级较低的房产';
 if(p.cash<cost(t))return '现金不足，还差 '+money(cost(t)-p.cash);return '';
}
function fastChance(p){
 const cards=[
 ()=>{p.cash+=1400;return '创业订单到账，获得 ¥1,400。'},
 ()=>{const amount=isUnderdog(p)?2400:1000;p.cash+=amount;return '城市扶持订单，获得 '+money(amount)+'（逆风玩家订单额外奖励）。'},
 ()=>{const fee=600+owned(p.id).reduce((n,t)=>n+state.props[t.i].level*250,0);p.cash-=fee;return '突发建筑检修：基础 ¥600 + 每级建筑 ¥250，共支出 '+money(fee)+'。'},
 ()=>{const fee=auditFee(p);p.cash-=fee;return '资产风险审查，支付 '+money(fee)+'；资产与建筑越多，风险支出越高。'},
 ()=>{p.pos=0;p.cash+=startGrant();onPassStart(p);return '搭上创业快线，领取 '+money(startGrant())+' 起点奖励。'},
 ()=>{p.cash+=800;return '街区快闪活动，获得 ¥800。'},
 ()=>{p.pos=8;p.jail=1;return '交通延误，进入探监区，最多停留一轮。'},
 ()=>{const amount=owned(p.id).length<4?1800:600;p.cash+=amount;return '小企业创新奖，获得 '+money(amount)+'；持有不足四处地产奖励更高。'}
 ];
 const text=cards[Math.floor(Math.random()*cards.length)]();log(p.name+' 抽到机遇：'+text);toast(text);
}
function economyRulesHTML(){if(landingRules())return '<p>到站建设 · 再次停在自己的房产，就有一次付费升级机会。</p><ol><li>无需集齐同色。必须停在已拥有、未抵押的房产，每次到访最多升一级；最高四级，建造费约为地价一半。刚买下需下次到访，单纯路过不会触发。</li><li>到站后选升级或暂不升级。机会本回合有效，未用完也不能留到下一轮；赎回抵押后仍需下次到访。</li><li>每人 ¥10,000，默认20回合。起点奖励 ¥1,400；基础租金为地价18%，四级倍率为2.4/4.5/7/10。第6、12回合成熟系数为1.15、1.3。</li><li>第8回合起，每4回合结算建筑维护费：每级¥120，加地价总额超¥12,000部分2%，向上百元。资产审计与突发检修随规模收费，预留现金才能持续经营。</li><li>第6回合起，资产低于存活领先者65%、现金不足¥2,000，可获一次¥2,000援助。创业补给、小企业奖励和逆风订单提供追赶机会。</li><li>拍卖每次加价¥500。建筑可独立出售得造价一半；本地产无建筑可抵押得地价50%，赎回付55%。抵押期间不收租。到期按总资产排名，无法偿债可宣布破产。</li><li>新规则仅新开对局启用，旧存档和已开局房间保持原规则。动画不影响操作与结算。</li></ol>';return '<p>创业竞速 · 每人 ¥10,000，默认 20 回合，经过起点 +¥1,400。所有玩家使用相同骰子与规则。</p><ol><li>单块地产可建 1 级；持有至少两块同色地产可建至 2 级；集齐整组可均衡建至 4 级。基础租金为地价 18%，1–4 级为基础租金的 2.4 / 4.5 / 7 / 10 倍。空地整组租金仍翻倍。</li><li>第 6 回合起租金成熟系数 ×1.15，第 12 回合起 ×1.3，与世界新闻及地图效果相乘。枢纽基础租金 ¥450／¥900。</li><li>第 8 回合起，每 4 回合在各自回合开始结算：每级建筑 ¥120，加地价总额超过 ¥12,000 部分的 2%，向上取整至百元。抵押仍计维护规模；请预留现金。</li><li>第 6 回合起，总资产低于存活领先者 65%、现金不足 ¥2,000，可自动获得一次 ¥2,000 逆风援助，每人全局一次。机遇中的小企业奖励与逆风订单也能带来追赶机会。</li><li>资产审计与突发检修按资产或建筑规模收费，扩张过快可能导致现金危机。普通市政税 ¥500；审计至少 ¥500，按超过 ¥10,000 的总资产 6% 加每级建筑 ¥120 计算。</li><li>拍卖每次加价 ¥500。出售建筑得造价一半，抵押得地价一半，赎回付 55%；现金不足先管理资产，无法偿债可破产。期限到按总资产排名。</li></ol>'}

function landingRules(){return fastRules()&&state.economy.development==='landing'}
function grantLandingUpgrade(p,t){if(!landingRules())return;state.economy.upgrade=null;const r=state.props[t.i];if(t.type==='property'&&r.owner===p.id&&!r.mortgage&&r.level<4){state.economy.upgrade={player:p.id,tile:t.i,round:state.round,used:false};log(p.name+' 回到 '+t.name+'，获得本次到访的升级机会。')}}
function projectedBaseRent(t){const r=state.props[t.i],next=Math.min(4,r.level+1),base=Math.round(t.price*(fastRules()?.18:.12)/10)*10;return Math.round(base*(fastRules()?[1,2.4,4.5,7,10]:[1,3,6,10,16])[next]*(state.market?.factor||1)*mapRentFactor(t)*maturityFactor()/10)*10}
