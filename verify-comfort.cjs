'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict'),os=require('node:os');
module.exports=async function verifyComfort(){
 const source=['atlas.js','systems.js','journey.js','adventures.js','saves.js','game.js'].map(f=>fs.readFileSync(path.join(__dirname,'tycoon',f),'utf8').split("$('#roll').onclick=")[0]).join('\n');
 const el={hidden:true,classList:{add(){},remove(){}}},memory=new Map(),ctx=vm.createContext({console,setTimeout:()=>0,clearTimeout(){},document:{querySelector:()=>el},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v)}});
 vm.runInContext(source+'\nrender=()=>{};save=()=>{};scheduleAI=()=>{};toast=()=>{};beep=()=>{};showAssets=()=>{};showResults=()=>{};closeModal=()=>{};delay=async()=>{};',ctx);
 let checks=0;const test=(name,code)=>{assert.equal(vm.runInContext('{'+code+'}',ctx),true,name);checks++;console.log('PASS '+name)};
 test('New games disable unsolicited AI offers',`state=makeGame();state.comfort.v===1&&!state.comfort.aiOffers`);
 test('Loading real v5.0 shaped save upgrades building policy without reset',`state=makeGame({comfort:false,development:'portfolio',map:'world'});state.round=9;state.props[13]={owner:0,level:1,mortgage:false};state.players[0].cash=3500;const saved=JSON.stringify(state);localStorage.setItem(STORE,saved);state=loadCurrentGame();state.round===9&&state.players[0].cash===3500&&state.props[13].level===1&&landingRules()&&!state.comfort.aiOffers`);
 test('Old v5.0 isolated level one upgrades to two after real landing',`state.turn=0;current().pos=13;land();const cash=current().cash;build(13,false);state.props[13].level===2&&current().cash===cash-cost(tiles[13])`);
 test('Old v5.0 independently upgraded buildings save and reload',`state=normalizeSave(state);localStorage.setItem(STORE,JSON.stringify(state));state=loadCurrentGame();state.props[13].level===2&&upgradeRecord().upgrade.used`);
 test('Migration never resets a consumed visit on refresh',`const cash=current().cash;ensureComfort(state);build(13,false);current().cash===cash&&state.props[13].level===2`);
 test('Classic prices and economy survive building policy migration',`state=makeGame({economy:false,comfort:false});const price=tiles[13].price;ensureComfort(state);!fastRules()&&current().cash===15000&&tiles[13].price===price&&startGrant()===2000&&landingRules()`);
 test('Classic isolated property can upgrade without monopoly after migration',`state.props[1].owner=0;current().pos=1;land();build(1,false);state.props[1].level===1&&normalizeSave(state).props[1].level===1`);
 test('v5.1 used visit is transferred without refreshing allowance',`state=makeGame({comfort:false});state.props[1].owner=0;current().pos=1;land();build(1,false);ensureComfort(state);!canBuild(current(),tiles[1])&&state.comfort.upgrade.used&&state.economy.upgrade===null`);
 test('v5.1 unused visit remains usable after migration',`state=makeGame({comfort:false});state.props[1].owner=0;current().pos=1;land();ensureComfort(state);canBuild(current(),tiles[1])`);
 test('Old current owned arrival is repaired at first migration',`state=makeGame({comfort:false,development:'portfolio'});state.props[1].owner=0;current().pos=1;land();ensureComfort(state);canBuild(current(),tiles[1])`);
 test('Historical upgrade after arrival cannot be repeated by migration',`state=makeGame({comfort:false,development:'portfolio'});state.props[1].owner=0;current().pos=1;land();build(1,false);ensureComfort(state);!canBuild(current(),tiles[1])&&state.comfort.upgrade.used`);
 test('A just-purchased old property does not grant a free repeat allowance',`state=makeGame({comfort:false,development:'portfolio'});current().pos=1;state.phase='buy';state.pending=1;buy();ensureComfort(state);!canBuild(current(),tiles[1])`);
 test('Migration is idempotent and does not repeat its notice',`const before=JSON.stringify(state);!ensureComfort(state)&&JSON.stringify(state)===before`);
 test('My assets show human owner even on AI turn',`state=makeGame();state.turn=2;assetViewer().id===0`);
 test('Local hotseat asset viewer still follows current player',`state=makeGame({mode:'local'});state.turn=2;assetViewer().id===2`);
 test('Default AI cannot interrupt human with a trade',`state=makeGame({count:4});state.turn=1;state.phase='end';state.props[1].owner=1;state.props[2].owner=1;state.props[4].owner=0;!aiTryTrade(current())&&state.phase==='end'&&!state.offer`);
 test('Human can opt into one valid AI offer',`state.comfort.aiOffers=true;current().lastOfferRound=0;aiTryTrade(current())&&state.phase==='trade'&&state.offer.seller===0`);
 test('Refusing prevents every AI from re-offering the same lot',`resolveOffer(false);state.round=10;current().lastOfferRound=0;!aiTryTrade(current())&&state.comfort.rejected.includes(4)`);
 test('Cooldown applies across AI buyers for six rounds',`state=makeGame({count:4});state.comfort.aiOffers=true;state.turn=1;state.phase='end';state.round=4;state.props[1].owner=1;state.props[2].owner=1;state.props[4].owner=0;aiTryTrade(current());resolveOffer(false);state.turn=2;state.props[6].owner=2;state.props[7].owner=0;state.round=5;!aiTryTrade(current())&&state.phase==='end'`);
 test('Fresh eligible property can receive an offer after cooldown',`state.round=10;aiTryTrade(current())&&state.offer.tile===7`);
 test('Default migration cancels old pending AI offer without a sale',`state=makeGame({comfort:false,development:'portfolio'});state.turn=1;state.phase='end';state.props[1].owner=1;state.props[2].owner=1;state.props[4].owner=0;aiTryTrade(current());const cash=state.players.map(p=>p.cash).join(',');ensureComfort(state);state.phase==='end'&&!state.offer&&state.props[4].owner===0&&state.players.map(p=>p.cash).join(',')===cash`);
 test('AI can still buy from AI without bothering human',`state=makeGame();state.turn=1;state.phase='end';state.props[6].owner=1;state.props[7].owner=2;const before=state.players.map(p=>p.cash).reduce((a,b)=>a+b);!aiTryTrade(current())&&state.props[7].owner===1&&state.players.map(p=>p.cash).reduce((a,b)=>a+b)===before`);
 test('Offer settings and rejections survive save restore',`state.comfort.aiOffers=true;state.comfort.offerRounds[0]=state.round;state.comfort.rejected=[7];state=normalizeSave(state);state.comfort.aiOffers&&state.comfort.rejected[0]===7&&state.comfort.offerRounds[0]===state.round`);
 test('Pending human/manual multiplayer trade is preserved by migration',`state=makeGame({comfort:false,mode:'local'});state.phase='trade';state.offer={buyer:0,seller:1,tile:1,price:1000,resume:'roll'};ensureComfort(state);state.phase==='trade'&&state.offer.price===1000`);
 test('Cannot manage assets during a trade',`!canManage()`);
 test('Malformed comfort state is rejected',`state=makeGame();state.comfort.rejected=[100];let rejected=false;try{normalizeSave(state)}catch(e){rejected=true}rejected`);
 test('Built property explains why mortgage is unavailable',`state=makeGame();state.props[1]={owner:0,level:2,mortgage:false};mortgageReason(current(),tiles[1]).includes('出售本地产')`);
 test('Empty property may be mortgaged despite built neighbor',`state.props[2].owner=0;mortgageReason(current(),tiles[2])===''`);
 // Server restore migrates a historical room, builds, persists the consumed visit.
 const createEngine=require('./server/engine.cjs'),engine=createEngine();let s=engine.init({comfort:false,development:'portfolio'},['A','B']);s.props[1].owner=0;s.players[0].pos=1;s.phase='end';s.logs.unshift({text:'A 来到 曼谷。',round:1});engine.restore(s);assert.ok(engine.snapshot().comfort);checks++;
 await engine.act(0,'build',{tile:1});const after=engine.snapshot();assert.equal(after.props[1].level,1);checks++;
 const again=createEngine();again.restore(after);await assert.rejects(()=>again.act(0,'build',{tile:1}));checks++;
 // Load a historical room through the real storage constructor, not an injected browser state.
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tycoon-comfort-'));
 try{const room={code:'AABBCCDD',revision:8,status:'playing',members:[{seen:0}],game:s,updated:Date.now(),deadline:Date.now()+180000};fs.writeFileSync(path.join(dir,'rooms.json'),JSON.stringify({version:1,rooms:[room]}));const {Rooms}=require('./server/server.cjs'),rooms=new Rooms(dir),r=rooms.rooms.get(room.code);assert.ok(r.game.comfort&&r.revision===9);checks++;const persisted=JSON.parse(fs.readFileSync(path.join(dir,'rooms.json'),'utf8'));assert.ok(persisted.rooms[0].game.comfort);checks++;const restored=new Rooms(dir);assert.equal(restored.rooms.get(room.code).revision,9);checks++;}finally{fs.rmSync(dir,{recursive:true,force:true})}
 console.log(checks+' comfort checks passed');return checks;
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1});
