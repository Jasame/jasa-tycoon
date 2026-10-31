'use strict';
const SLOT_STORE='world-tycoon-slots-v3',PREVIOUS_STORE='world-tycoon-previous-v3';
function validInt(n,min,max){return Number.isSafeInteger(n)&&n>=min&&n<=max}
function normalizeSave(input){
 if(!input||![1,2,3].includes(input.v)||!Array.isArray(input.players)||input.players.length<2||input.players.length>4||!Array.isArray(input.props)||input.props.length!==32)throw Error('不是有效的大富翁存档');
 const s=JSON.parse(JSON.stringify(input)),n=s.players.length;
 if(s.economy!=null&&(s.economy.v!==5||!s.economy.relief||!s.economy.fees))throw Error('经济规则数据无效');
 const map=s.map||(s.v===1?'legacy':'world');if(map!=='legacy'&&!MAPS.some(m=>m.id===map))throw Error('存档地图不受支持');
 const players=s.players.map((p,i)=>{
  if(!p||p.id!==i||!validInt(p.cash,-1e9,1e9)||!validInt(p.pos,0,31)||!validInt(p.jail,0,2)||typeof p.out!=='boolean'||typeof p.ai!=='boolean'||typeof p.name!=='string')throw Error('玩家数据不完整');
  return {id:i,name:p.name.slice(0,12)||'玩家 '+(i+1),ai:p.ai,avatar:AVATARS.some(a=>a.id===p.avatar)?p.avatar:AVATARS[i%AVATARS.length].id,cash:p.cash,pos:p.pos,jail:p.jail,out:p.out,lastOfferRound:validInt(p.lastOfferRound,0,100000)?p.lastOfferRound:0};
 });
 if(!players.some(p=>!p.out)||!validInt(s.turn,0,n-1)||(!s.over&&players[s.turn].out)||!validInt(s.round,1,100000)||!validInt(s.limit,0,100000)||!['roll','end','buy','auction','trade'].includes(s.phase)||typeof s.over!=='boolean'||!['ai','local'].includes(s.mode))throw Error('回合数据不完整');
 const props=s.props.map((p,i)=>{if(!p||(p.owner!==null&&!validInt(p.owner,0,n-1))||!validInt(p.level,0,4)||typeof p.mortgage!=='boolean'||(p.owner===null&&(p.level||p.mortgage))||(p.owner!==null&&players[p.owner].out)||((typeof raw[i][1]!=='number')&&p.level))throw Error('地产数据不完整');return {owner:p.owner,level:p.level,mortgage:p.mortgage}});
 for(let group=0;group<8;group++){
  const members=raw.map((t,i)=>({t,i})).filter(x=>x.t[1]===group),built=members.some(x=>props[x.i].level>0);
  if(built&&!s.comfort&&!s.economy&&(members.some(x=>props[x.i].mortgage||props[x.i].owner!==props[members[0].i].owner)||(s.rulesVersion===3&&Math.max(...members.map(x=>props[x.i].level))-Math.min(...members.map(x=>props[x.i].level))>1)))throw Error('同色地产建筑数据不一致');
 }
 if(!Array.isArray(s.dice)||s.dice.length!==2||s.dice.some(d=>!validInt(d,1,6)))throw Error('骰子数据不完整');
 const factor=s.market?.factor??1;if(![.8,1,1.15,1.25,1.35].includes(factor))throw Error('市场数据不完整');
 const out={v:3,rulesVersion:s.rulesVersion===3?3:2,map,difficulty:['easy','normal','expert'].includes(s.difficulty)?s.difficulty:'normal',speed:s.speed===25?25:95,market:{name:typeof s.market?.name==='string'?s.market.name.slice(0,30):'平稳市场',factor},players,props,turn:s.turn,round:s.round,limit:s.limit,phase:s.phase,pending:null,dice:s.dice,over:s.over,mode:s.mode,logs:Array.isArray(s.logs)?s.logs.slice(0,50).filter(x=>x&&typeof x.text==='string'&&validInt(x.round,1,100000)).map(x=>({text:x.text.slice(0,300),round:x.round})):[],passports:{}};
 if(s.economy){out.economy={v:5,relief:{},fees:{}};if(s.economy.development!==undefined&&s.economy.development!=='landing')throw Error('建造规则无效');if(s.economy.development==='landing'){out.economy.development='landing';out.economy.upgrade=null;const u=s.economy.upgrade;if(u!=null){if(!validInt(u.player,0,n-1)||!validInt(u.tile,0,31)||typeof raw[u.tile][1]!=='number'||u.player!==s.turn||u.round!==s.round||players[u.player].pos!==u.tile||props[u.tile].owner!==u.player||props[u.tile].mortgage||typeof u.used!=='boolean'||!['end','trade'].includes(s.phase))throw Error('到访升级机会无效');out.economy.upgrade={player:u.player,tile:u.tile,round:u.round,used:u.used};}}for(let i=0;i<n;i++){const relief=s.economy.relief[i],fee=s.economy.fees[i];if(relief!==undefined&&typeof relief!=='boolean'||fee!==undefined&&(!validInt(fee,8,s.round)||fee%4!==0))throw Error('经济进度无效');if(relief!==undefined)out.economy.relief[i]=relief;if(fee!==undefined)out.economy.fees[i]=fee;}for(let group=0;group<8;group++){const members=raw.map((t,i)=>({t,i})).filter(x=>x.t[1]===group);for(const x of members){const r=props[x.i],mine=members.filter(y=>props[y.i].owner===r.owner);if(r.level&&r.mortgage||!s.comfort&&s.economy.development!=='landing'&&(r.level===2&&mine.length<2||r.level>=3&&(mine.length!==members.length||members.some(y=>props[y.i].mortgage)||Math.max(...members.map(y=>props[y.i].level))-Math.min(...members.map(y=>props[y.i].level))>1)))throw Error('新规则建筑数据无效')}}}
 if(s.comfort){const c=s.comfort;if(c.v!==1||typeof c.aiOffers!=='boolean'||!c.offerRounds||typeof c.offerRounds!=='object'||!Array.isArray(c.rejected)||c.rejected.some(i=>!validInt(i,0,31))||new Set(c.rejected).size!==c.rejected.length)throw Error('体验设置无效');if(c.quietAuctions!==undefined&&typeof c.quietAuctions!=='boolean')throw Error('拍卖偏好无效');out.comfort={v:1,upgrade:null,aiOffers:c.aiOffers,offerRounds:{},rejected:[...c.rejected],quietAuctions:!!c.quietAuctions};for(let i=0;i<n;i++)if(c.offerRounds[i]!==undefined){if(!validInt(c.offerRounds[i],1,s.round))throw Error('邀约冷却无效');out.comfort.offerRounds[i]=c.offerRounds[i]}const u=c.upgrade;if(u!=null){if(!validInt(u.player,0,n-1)||!validInt(u.tile,0,31)||typeof raw[u.tile][1]!=='number'||u.player!==s.turn||u.round!==s.round||players[u.player].pos!==u.tile||props[u.tile].owner!==u.player||props[u.tile].mortgage||typeof u.used!=='boolean'||!['end','trade'].includes(s.phase))throw Error('到访升级机会无效');out.comfort.upgrade={player:u.player,tile:u.tile,round:u.round,used:u.used};}if(props.some(r=>r.level&&r.mortgage))throw Error('已抵押地产不能保留建筑');}
 const purchasable=i=>validInt(i,0,31)&&(typeof raw[i][1]==='number'||raw[i][1]==='station');
 if(s.phase==='buy'){if(!purchasable(s.pending)||props[s.pending].owner!==null)throw Error('购买状态无效');out.pending=s.pending}
 if(s.phase==='auction'){
  const a=s.auction;
  if(!a||!purchasable(a.tile)||props[a.tile].owner!==null||!validInt(a.price,0,1e9)||!validInt(a.bidder,0,n-1)||players[a.bidder].out||!Array.isArray(a.passed)||a.passed.some(i=>!validInt(i,0,n-1))||new Set(a.passed).size!==a.passed.length||(a.leader!==null&&(!validInt(a.leader,0,n-1)||players[a.leader].out||a.passed.includes(a.leader)||players[a.leader].cash<a.price))||a.bidder===a.leader||a.passed.includes(a.bidder))throw Error('拍卖状态无效');
  out.auction={tile:a.tile,price:a.price,leader:a.leader,bidder:a.bidder,passed:a.passed,step:s.economy?500:100};
 }
 if(s.phase==='trade'){
  const o=s.offer;if(!o||!purchasable(o.tile)||!validInt(o.buyer,0,n-1)||!validInt(o.seller,0,n-1)||o.buyer===o.seller||o.buyer!==s.turn||!players[o.buyer].ai||players[o.seller].ai||players[o.seller].out||props[o.tile].owner!==o.seller||props[o.tile].mortgage||!validInt(o.price,100,1e9)||players[o.buyer].cash<o.price)throw Error('交易邀约无效');
  out.offer={tile:o.tile,buyer:o.buyer,seller:o.seller,price:o.price};
 }
 for(const p of players){const pass=s.passports?.[p.id];if(pass&&Array.isArray(pass.groups)&&pass.groups.every(g=>validInt(g,0,7)))out.passports[p.id]={groups:[...new Set(pass.groups)],rewarded:!!pass.rewarded}}
 if(s.experience)out.experience=normalizeExperience(s.experience,n);
 if(s.expansion)out.expansion=normalizeExpansion(s.expansion,n,s.round);
 if(s.refinement)out.refinement=normalizeRefinement(s.refinement,n,s.round);
 if(s.community)out.community=normalizeCommunity(s.community,n,s.round);
 players.forEach((p,i)=>{if(s.players[i].cosmetics)p.cosmetics=safeCosmetics(s.players[i].cosmetics)});
 const adventure=normalizeAdventure(s.adventure,n,s.round);if(adventure){if(WORLD_NEWS[adventure.news.current].factor!==factor)throw Error('新闻与市场数据不一致');out.adventure=adventure;}
 return out;
}
function readSlots(){try{const data=JSON.parse(localStorage.getItem(SLOT_STORE)||'[]');return Array.isArray(data)?data.slice(0,5):[]}catch(e){return []}}
function previousEntry(){try{return JSON.parse(localStorage.getItem(PREVIOUS_STORE)||'null')}catch(e){return null}}
function snapshot(name){return {name:String(name).slice(0,30),date:new Date().toISOString(),game:normalizeSave(state)}}
function archiveCurrent(){
 if(busy){toast('请等待棋子移动完成。');return false}
 try{localStorage.setItem(PREVIOUS_STORE,JSON.stringify(snapshot('上一局自动备份')));return true}catch(e){toast('备份失败，请先导出当前存档。');return false}
}
function saveSlot(index,name){
 if(busy||!validInt(index,0,4))return false;
 try{const slots=readSlots();slots[index]=snapshot(name||'旅程 '+(index+1));localStorage.setItem(SLOT_STORE,JSON.stringify(slots));toast('手动存档已保存');return true}catch(e){toast('存档失败，浏览器存储空间可能不足。');return false}
}
function restoreGame(input){
 if(busy)return false;
 let restored;try{restored=normalizeSave(input)}catch(e){toast('无法读取：'+e.message);return false}
 if(!archiveCurrent())return false;
 clearTimeout(aiTimer);state=restored;activateMap(state.map,fastRules());ensureComfort(state);selected=-1;$('#modal').hidden=true;render();scheduleAI();toast('已恢复旅程，切换前的对局已备份。');return true;
}
function confirmRestore(entry){
 if(!entry?.game)return;
 modal('恢复这段旅程？',`<p>${escapeHTML(entry.name||'导入存档')} · 第 ${entry.game.round} 回合</p><p>当前对局会保留为“上一局自动备份”，然后恢复所选进度。</p><button class="primary" id="restoreConfirm">备份当前对局并恢复</button><button class="wide" id="restoreCancel">返回存档中心</button>`);
 $('#restoreConfirm').onclick=()=>restoreGame(entry.game);$('#restoreCancel').onclick=showSaveCenter;
}
function exportGame(){
 if(busy){toast('请等待棋子移动完成。');return}
 try{const data=JSON.stringify({format:'world-tycoon',exportedAt:new Date().toISOString(),game:normalizeSave(state)},null,2),url=URL.createObjectURL(new Blob([data],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='world-tycoon-'+state.map+'-round-'+state.round+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('存档文件已导出')}catch(e){toast('导出失败：'+e.message)}
}
function showSaveCenter(){
 if(busy){toast('请等待棋子移动完成。');return}clearTimeout(aiTimer);
 const slots=readSlots(),previous=previousEntry();
 modal('存档中心',`<p>当前：${activeMap.name} · 第 ${state.round} 回合。自动保存最近进度，另提供 5 个手动槽位。所有存档保存在此浏览器，可导出到文件备份。</p><div class="save-tools"><button id="exportSave">导出当前存档</button><label class="import-label">导入存档文件<input id="importSave" type="file" accept=".json,application/json"></label></div><div class="save-list">${Array.from({length:5},(_,i)=>{const entry=slots[i];return `<div class="save-card"><label>槽位 ${i+1}<input maxlength="30" id="slotName${i}" value="${escapeHTML(entry?.name||'旅程 '+(i+1))}"></label><small>${entry?escapeHTML((MAPS.find(m=>m.id===entry.game?.map)?.name||'城市经典')+' · 第 '+entry.game?.round+' 回合 · '+new Date(entry.date).toLocaleString()):'空槽位'}</small><div><button data-save="${i}">${entry?'覆盖保存':'保存当前对局'}</button>${entry?`<button data-load="${i}">恢复</button>`:''}</div></div>`}).join('')}</div>${previous?'<button class="wide" id="loadPrevious">恢复上一局自动备份</button>':''}<p class="save-note">新开一局或恢复存档前，会更新上一局备份。清除浏览器网站数据会删除本地存档。</p>`);
 $('#exportSave').onclick=exportGame;
 document.querySelectorAll('[data-save]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.save),name=$('#slotName'+i).value;if(slots[i]){modal('覆盖槽位 '+(i+1)+'？','<p>此操作仅替换这个手动槽位，当前对局不会改变。</p><button class="primary" id="overwriteSlot">确认覆盖保存</button><button class="wide" id="cancelOverwrite">返回</button>');$('#overwriteSlot').onclick=()=>{saveSlot(i,name);showSaveCenter()};$('#cancelOverwrite').onclick=showSaveCenter}else{saveSlot(i,name);showSaveCenter()}});
 document.querySelectorAll('[data-load]').forEach(b=>b.onclick=()=>confirmRestore(slots[Number(b.dataset.load)]));
 if($('#loadPrevious'))$('#loadPrevious').onclick=()=>confirmRestore(previous);
 $('#importSave').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;if(f.size>256000){toast('文件过大，请选择有效的大富翁 JSON 存档。');return}try{const rawData=JSON.parse(await f.text()),game=normalizeSave(rawData.game||rawData);confirmRestore({name:f.name,game})}catch(err){toast('导入失败：'+err.message)}};
}
function loadCurrentGame(){
 for(const key of [STORE,'city-tycoon-v2','city-tycoon-v1']){
  try{const rawData=localStorage.getItem(key);if(rawData){const restored=normalizeSave(JSON.parse(rawData));activateMap(restored.map,restored.economy?.v===5);ensureComfort(restored);return restored}}catch(e){}
 }
 return makeGame();
}
