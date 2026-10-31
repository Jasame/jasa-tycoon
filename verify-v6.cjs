'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os'),vm=require('node:vm');
const {Rooms}=require('./server/server.cjs'),createEngine=require('./server/engine.cjs');
module.exports=async function(){
 let checks=0,seq=0;const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS '+label)};
 const deny=async(fn,label)=>{await assert.rejects(fn);checks++;console.log('PASS '+label)};
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tycoon-v6-'));let rooms=new Rooms(dir);const call=(route,body={},token)=>rooms.handle('POST',route,body,token,'v6-test');
 const command=(route,r,token,data={})=>call(route,{code:r.code,revision:r.revision,actionId:'v6-command-'+(++seq),...data},token);
 try{
  let h=await call('create',{name:'Host',map:'africa',capacity:4,avatar:'rabbit'}),ht=h.token;const code=h.code;
  ok(h.members[0].avatar==='rabbit','Create retains selected cartoon avatar');
  let g=await call('join',{code,name:'Guest',avatar:'cat'}),gt=g.token;
  await deny(()=>command('addBot',g,gt),'Guest cannot add AI players');
  h=await call('state',{code},ht);const add={code,revision:h.revision,actionId:'duplicate-add-bot'};
  h=await call('addBot',add,ht);const again=await call('addBot',add,ht);
  ok(h.members.length===3&&again.members.length===3,'Repeated add request creates exactly one AI seat');
  ok(h.members[2].bot&&h.members[2].ready&&h.members[2].online,'AI seat is visibly ready without a browser connection');
  await deny(()=>command('removeBot',h,gt,{memberId:h.members[2].id}),'Guest cannot remove AI seats');
  await deny(()=>command('removeBot',h,ht,{memberId:h.members[1].id}),'AI removal cannot remove a human seat');
  h=await command('removeBot',h,ht,{memberId:h.members[2].id});ok(h.members.length===2,'Host can remove an AI seat before starting');
  h=await command('addBot',h,ht);h=await command('addBot',h,ht);await deny(()=>command('addBot',h,ht),'AI seats respect room capacity');
  g=await call('state',{code},gt);g=await command('ready',g,gt,{ready:true});h=await call('state',{code},ht);h=await command('start',h,ht);
  ok(h.game.players[2].ai&&h.game.players[3].ai&&!h.game.players[0].ai,'Only server AI seats are marked as AI');
  ok(h.game.players.every(p=>p.cash===8500),'Africa starts all seats with the same map budget');
  await deny(()=>command('removeBot',h,ht,{memberId:h.members[2].id}),'Started games cannot lose an AI seat');
  h=await command('profile',h,ht,{avatar:'penguin'});ok(h.game.players[0].avatar==='penguin','Changing avatar updates only own game seat');
  h=await command('profile',h,ht,{avatar:'../../secret'});ok(h.game.players[0].avatar==='fox','Untrusted avatar paths are rejected by allowlist');
  rooms=new Rooms(dir);h=await call('state',{code},ht);ok(h.members.filter(m=>m.bot).length===2&&h.game.players[2].ai,'AI seats and flags survive a service restart');
  const r=rooms.rooms.get(code);r.game.turn=2;r.game.phase='roll';r.game.pending=null;r.game.offer=null;r.game.auction=null;rooms.engines.delete(code);const round=r.game.round;
  await rooms.tick();h=await call('state',{code},ht);ok(h.game.phase!=='roll'||h.game.turn!==2,'Server advances an AI turn before the human timeout');
  for(let i=0;i<30&&rooms.engine(r).botActor()!==null;i++)await rooms.tick();h=await call('state',{code},ht);
  ok(rooms.engine(r).botActor()===null||h.game.over,'AI phases eventually return control to a human');
  const stable=JSON.stringify(h.game);await rooms.tick();ok(JSON.stringify((await call('state',{code},ht)).game)===stable,'AI scheduler does not act for a waiting human');
  const solo=await call('create',{name:'Solo',capacity:2});let one=await command('addBot',solo,solo.token);one=await command('start',one,solo.token);ok(one.status==='playing'&&one.members[1].bot,'One human can start a room with one AI');
  const engine=createEngine();for(const [map,cash]of Object.entries({world:10000,asia:9500,europe:11000,africa:8500,'north-america':12000,'south-america':9000,oceania:10500,antarctica:9000,legacy:10000})){const s=engine.init({map},[{name:'A'},{name:'B',bot:true}]);ok(s.players.every(p=>p.cash===cash),'Map budget applies consistently: '+map);}
  const old=engine.snapshot();old.players[0].cash=1234;engine.restore(old);ok(engine.snapshot().players[0].cash===1234,'Restoring old progress never recalculates cash');
  const ctx=vm.createContext({localStorage:{getItem:()=>null}});vm.runInContext(fs.readFileSync(path.join(__dirname,'tycoon/vendor/opencc-cn2t.js'),'utf8')+'\n'+fs.readFileSync(path.join(__dirname,'tycoon/locales.js'),'utf8'),ctx);
  ok(vm.runInContext(`normalizeUIPreferences({language:'zh-Hant'}).language==='zh-Hant'`,ctx),'Traditional Chinese is a valid persisted language');
  ok(vm.runInContext(`OpenCC.Converter({from:'cn',to:'hk'})('环球大富翁，房产升级')==='環球大富翁，房產升級'`,ctx),'Self-hosted dictionary converts gameplay phrases');
  const ui=fs.readFileSync(path.join(__dirname,'tycoon/display-ui.js'),'utf8');vm.runInContext(`var state={players:[{name:'银河房产'}]};`+ui.slice(ui.indexOf('function customPlayerNames(){'),ui.indexOf('function translateInterface(){')),ctx);
  ok(vm.runInContext(`traditionalText('银河房产 · 房产升级')==='银河房产 · 房產升級'`,ctx),'Traditional conversion preserves custom player names');
  const v6=fs.readFileSync(path.join(__dirname,'tycoon/v6-ui.js'),'utf8'),control={hidden:true};const ac=vm.createContext({autoRollEnabled:false,busy:false,state:{over:false,phase:'roll'},document:{hidden:false},$:()=>control,current:()=>({cash:100,ai:false}),onlineSession:null,canOnlineAct:()=>true});
  vm.runInContext(v6.slice(v6.indexOf('function autoRollEligible(){'),v6.indexOf('function toggleAutoRoll(){')),ac);
  ok(!vm.runInContext('autoRollEligible()',ac),'Auto-roll is opt-in');vm.runInContext('autoRollEnabled=true',ac);ok(vm.runInContext('autoRollEligible()',ac),'Enabled auto-roll is available on own roll phase');
  for(const code of [`state.phase='buy'`,`state.phase='end'`,`state.phase='trade'`,`state.phase='auction'`,`state.phase='roll';busy=true`,`busy=false;document.hidden=true`,`document.hidden=false;control.hidden=false`]){ac.control=control;vm.runInContext(code,ac);ok(!vm.runInContext('autoRollEligible()',ac),'Auto-roll pauses outside eligible play: '+code)}
  const switched=vm.createContext({uiPreferences:{language:'zh-Hant',theme:'jade',layout:'standard'},normalizeUIPreferences:v=>v,saveDisplayPreferences(){},applyDisplayPreferences(){},translated:'zh-Hant',updateCompactUI(){},syncDisplayControls(){}});vm.runInContext('function translateInterface(){translated=uiPreferences.language}function refreshDeviceControls(){if(translated!==uiPreferences.language)throw Error("stale language mirror")}',switched);vm.runInContext(ui.slice(ui.indexOf('function setDisplayPreference('),ui.indexOf('function syncDisplayControls(')),switched);vm.runInContext("setDisplayPreference('language','en');setDisplayPreference('language','zh');setDisplayPreference('language','zh-Hant')",switched);ok(true,'Language changes translate source actions before rebuilding mobile mirrors');
  console.log(checks+' V6 checks passed');return checks;
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1});
