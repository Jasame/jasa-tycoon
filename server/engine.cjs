'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const publicPath=fs.existsSync(path.join(__dirname,'core'))?path.join(__dirname,'core'):path.join(__dirname,'../tycoon');
const files=['atlas.js','systems.js','journey.js','adventures.js','expansion.js','experience.js','community.js','saves.js'];
const game=fs.readFileSync(path.join(publicPath,'game.js'),'utf8').split("$('#roll').onclick=")[0];
const bundle=files.map(f=>fs.readFileSync(path.join(publicPath,f),'utf8')).join('\n')+'\n'+game+`
render=()=>{};save=()=>{};scheduleAI=()=>{};toast=()=>{};beep=()=>{};showAssets=()=>{};showResults=()=>{};
delay=async()=>{};closeModal=()=>{};
globalThis.engine={
 init(options,names){state=makeGame({...options,count:names.length,mode:'local'});state.players.forEach((p,i)=>{const member=typeof names[i]==='string'?{name:names[i]}:names[i];p.name=member.name;p.ai=!!member.bot;if(state.expansion&&Object.hasOwn(CAREERS,member.career))state.expansion.players[i].career=member.career;if(member.cosmetics)p.cosmetics=safeCosmetics(member.cosmetics);p.avatar=AVATARS.some(a=>a.id===member.avatar)?member.avatar:AVATARS[i].id});if(state.expansion)expansionTurn(current());return this.snapshot()},
 restore(s,{migrate=true}={}){state=JSON.parse(JSON.stringify(s));activateMap(state.map,fastRules());if(migrate)ensureComfort(state)},
 snapshot(){if(state.community)recordCash();return JSON.parse(JSON.stringify(state))},
 noteAction(timeout=false){if(state.community){state.community.actions++;if(timeout)state.community.timeouts++;recordCash()}},
 async act(actor,command,arg){
  if(state.over)throw Error('本局已结束');
  const turn=state.turn===actor;
  if(command==='bid'||command==='pass'){if(state.phase!=='auction'||state.auction.bidder!==actor)throw Error('还没轮到你竞价');auctionBid(command==='bid');return}
  if(command==='acceptTrade'||command==='rejectTrade'){
   const o=state.offer;if(state.phase!=='trade'||!o||o.seller!==actor)throw Error('你不是本次交易的卖方');
   if(command==='acceptTrade'&&!transferProperty(o.tile,o.price,o.buyer,o.seller))throw Error('交易条件已变化');
   if(command==='rejectTrade')log(state.players[actor].name+' 拒绝了收购邀约。');
   state.phase=o.resume;state.offer=null;return;
  }
  if(!turn||state.phase==='auction'||state.phase==='trade')throw Error('请等待你的回合');
  const p=current();
  if(command==='card'){useStrategyCard(p,arg?.index,arg?.move);return}
  if(command==='travel'){takeBranch(p,arg?.destination);return}
  if(command==='project'){startRiskProject(p,arg?.stake);return}
  if(command==='roll'){if(state.phase!=='roll'||p.cash<0)throw Error('现在不能掷骰');await roll();return}
  if(command==='buy'){if(state.phase!=='buy'||p.cash<tiles[state.pending].price)throw Error('不能购买或现金不足');buy();return}
  if(command==='skip'){if(state.phase!=='buy')throw Error('当前没有待购地产');skipBuy();return}
  if(command==='end'){if(state.phase!=='end'||p.cash<0)throw Error('请先完成当前操作或处理欠款');endTurn();return}
  if(command==='bail'){if(state.phase!=='roll'||!p.jail||p.cash<500)throw Error('现在不能保释');bail();return}
  if(command==='bankrupt'){if(p.cash>=0)throw Error('仅欠款时可宣布破产');bankrupt(p);return}
  const i=arg?.tile;
  if(!Number.isInteger(i)||i<0||i>=32)throw Error('请选择有效地产');const t=tiles[i],r=state.props[i];
  if(command==='offerTrade'){
   const price=arg.price,seller=r.owner;
   if(p.cash<0||!Number.isSafeInteger(price)||price<100||price>p.cash||seller===null||seller===actor||!tradeable(i,seller))throw Error('报价无效，或该地产暂不可交易');
   state.offer={tile:i,price,buyer:actor,seller,resume:state.phase};state.phase='trade';log(p.name+' 向 '+state.players[seller].name+' 提出 '+t.name+' 收购报价。');return;
  }
  if(r.owner!==actor)throw Error('你不是这处地产的业主');
  if(command==='build'){if(!canBuild(p,t))throw Error(buildReason(p,t));build(i,false);return}
  if(command==='sell'){if(!r.level||!landingRules()&&tiles.some(x=>x.type==='property'&&x.group===t.group&&(!fastRules()||state.props[x.i].owner===actor)&&state.props[x.i].level>r.level))throw Error('请先出售同色组最高等级建筑');sellBuilding(i);return}
  if(command==='mortgage'){
   if(r.mortgage&&p.cash<Math.ceil(t.price*55/100))throw Error('现金不足以赎回');
   if(!r.mortgage&&t.type==='property'&&tiles.some(x=>x.type==='property'&&x.group===t.group&&(!landingRules()||x.i===i)&&(!fastRules()||state.props[x.i].owner===actor)&&state.props[x.i].level))throw Error('请先出售同色组全部建筑');toggleMortgage(i);return;
  }
  throw Error('不支持的操作');
 },
 botActor(){if(state.over)return null;const id=state.phase==='auction'?state.auction?.bidder:state.phase==='trade'?state.offer?.seller:state.turn;return state.players[id]?.ai?id:null},
 async botStep(){
  const id=this.botActor();if(id===null)return;const p=state.players[id];
  if(state.phase==='auction'){auctionAI();return}
  if(state.phase==='trade'){const o=state.offer,t=tiles[o.tile];await this.act(id,o.price>=Math.ceil(t.price*1.1/100)*100?'acceptTrade':'rejectTrade');return}
  if(state.expansion)expansionAI(p);
  if(p.cash<0){liquidate(p);if(p.cash<0){bankrupt(p);return}}
  if(state.phase==='roll')await this.act(id,'roll');else if(state.phase==='buy'){const t=tiles[state.pending];await this.act(id,p.cash-t.price>=aiReserve(p)&&t.price<=aiValue(p,t)?'buy':'skip')}else if(state.phase==='end'){aiManage(p);await this.act(id,'end')}
 },
 async timeout(){
  if(state.over)return;
  if(state.phase==='trade'){await this.act(state.offer.seller,'rejectTrade');return}
  if(state.phase==='auction'){await this.act(state.auction.bidder,'pass');return}
  const p=current();if(p.cash<0){liquidate(p);if(p.cash<0){bankrupt(p);return}}
  if(state.phase==='roll')await this.act(p.id,'roll');else if(state.phase==='buy')await this.act(p.id,'skip');else if(state.phase==='end')await this.act(p.id,'end');
 }
};`;
module.exports=function createEngine({random}={}){
 const element={hidden:true,classList:{add(){},remove(){}}};
 const math=Object.create(Math);math.random=random||(()=>crypto.randomInt(0,0x100000000)/0x100000000);
 const context=vm.createContext({Math:math,console,setTimeout:()=>0,clearTimeout(){},document:{querySelector:()=>element}});
 vm.runInContext(bundle,context,{timeout:1000});return context.engine;
};
