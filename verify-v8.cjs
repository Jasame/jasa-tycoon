'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const createEngine=require('./server/engine.cjs'),{Rooms}=require('./server/server.cjs');
module.exports=async function(){let checks=0;const ok=(v,m)=>{assert.ok(v,m);checks++},denied=async(f,m)=>{await assert.rejects(f);checks++};
 const source=['atlas.js','systems.js','journey.js','adventures.js','expansion.js','experience.js','saves.js','game.js'].map(f=>fs.readFileSync(path.join(__dirname,'tycoon',f),'utf8').split("$('#roll').onclick=")[0]).join('\n'),ctx=vm.createContext({document:{querySelector:()=>({hidden:true,classList:{add(){},remove(){}}})},setTimeout:()=>0,clearTimeout(){}});vm.runInContext(source+'\nrender=()=>{};save=()=>{};toast=()=>{};scheduleAI=()=>{};showResults=()=>{}',ctx);const run=s=>vm.runInContext(s,ctx);
 ok(run('state=makeGame({experience:true,count:3,limit:12,pace:"quick"});state.experience.v===8&&state.limit===12&&state.experience.personalities.length===3'),'Quick game config');
 ok(run('normalizeSave(state).experience.pace==="quick"'),'V8 save roundtrip');
 ok(run('state=makeGame({});!state.experience&&maturityFactor()===1'),'Old rules stay opted out');
 for(const round of [20,30,40,60])ok(run('state=makeGame({experience:true});state.round='+round+';maturityFactor()<=2&&maturityFactor()>=1.5'),'Bounded late maturity '+round);
 ok(run('state=makeGame({experience:true});state.players[0].pos=0;state.props[1].owner=1;nearbyRisk(current()).tile===1&&nearbyRisk(current()).amount===rent(tiles[1])'),'Risk uses actual rent');
 ok(run('state.props[1].mortgage=true;nearbyRisk(current()).amount===0'),'Risk ignores mortgaged land');
 ok(run('state.props[1].owner=0;state.props[1].mortgage=false;nearbyRisk(current()).amount===0'),'Risk ignores own land');
 ok(run('state=makeGame({experience:true,map:"asia"});state.props[5].owner=0;state.props[19].owner=0;experienceProgress();state.players[0].cash===mapStartingCash("asia")+400'),'Asia objective');
 ok(run('state.expansion=makeExpansion(4);state.experience.awarded[0]=false;experienceProgress();normalizeSave(state).expansion.highlights.some(h=>h.type==="focus")'),'Map rewards survive a validated save');
 ok(run('state=makeGame({experience:true,expansion:true});state.props[1].owner=0;state.players[0].pos=1;state.phase="end";grantLandingUpgrade(current(),tiles[1]);globalThis.dialog="";modal=(title,html)=>{globalThis.dialog=html};showTile(1);dialog.includes("升级房屋")'),'Owned property dialog renders upgrade without undefined player');
 const paid=run('current().cash');run('experienceProgress();experienceProgress()');ok(run('current().cash')===paid,'Map objective pays once');
 ok(run('state=makeGame({experience:true,map:"antarctica"});adventurePlayer(state.players[0]).builds=6;experienceProgress();state.experience.awarded.every(Boolean)'),'Research shared among active players');
 ok(run('state=makeGame({experience:true,map:"europe"});state.props[5].owner=0;onPassStart(current());onPassStart(current());state.experience.rail[0]===2&&state.experience.awarded[0]'),'Rail objective counts real Start passes');
 ok(run('state=makeGame({experience:true});state.experience.personalities[0]="steady";aiReserve(current())>2000'),'Careful AI reserve');
 ok(run('state.difficulty="easy";aiReserve(current())>=3200'),'Casual difficulty reserve');
 for(const bad of ['state.experience.personalities[0]="hacker"','state.experience.rail[0]=-1','state.experience.awarded[0]=1']){run('state=makeGame({experience:true})');run(bad);assert.throws(()=>run('normalizeSave(state)'));checks++}
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'tycoon-v8-'));try{
 let rooms=new Rooms(dir),r=await rooms.handle('POST','create',{name:'Host',experience:true,limit:12,difficulty:'easy',personality:'traveler'},null,'v8'),host=r.token;
 const cmd=(route,arg={},token=host)=>rooms.handle('POST',route,{code:r.code,revision:r.revision,actionId:require('node:crypto').randomUUID(),...arg},token,'v8');
 r=await cmd('addBot');ok(r.options.limit===12&&r.options.difficulty==='easy','Room accepts quick difficulty');r=await cmd('start');ok(r.game.experience.personalities.every(x=>x==='traveler'),'AI personality persists');
 await denied(()=>cmd('rematch'),'Cannot rematch during play');
 let internal=rooms.rooms.get(r.code);internal.status='finished';internal.game.over=true;rooms.persist();r=await rooms.handle('POST','state',{code:r.code},host,'v8');const oldIds=r.members.map(x=>x.id),oldAvatars=r.members.map(x=>x.avatar);
 r=await cmd('rematch');ok(r.status==='lobby'&&!r.game,'Rematch returns to lobby');ok(JSON.stringify(r.members.map(x=>x.id))===JSON.stringify(oldIds)&&JSON.stringify(r.members.map(x=>x.avatar))===JSON.stringify(oldAvatars),'Rematch preserves players and avatars');
 rooms=new Rooms(dir);r=await rooms.handle('POST','state',{code:r.code},host,'v8');ok(r.status==='lobby','Rematch survives restart');r=await cmd('start');const actionId=require('node:crypto').randomUUID(),before=r.revision;
 r=await rooms.handle('POST','action',{code:r.code,revision:before,actionId,command:'roll'},host,'v8');const revision=r.revision,cash=r.game.players[0].cash;
 r=await rooms.handle('POST','action',{code:r.code,revision:before,actionId,command:'roll'},host,'v8');ok(r.revision===revision&&r.game.players[0].cash===cash,'Lost response retry is acknowledged without another roll');
 await denied(()=>rooms.handle('POST','action',{code:r.code,revision:before,actionId:require('node:crypto').randomUUID(),command:'roll'},host,'v8'),'Stale new actions rejected');
 // Add a human seat, finish then verify readiness consent and guest authorization.
 internal=rooms.rooms.get(r.code);internal.status='finished';internal.game.over=true;r=await rooms.handle('POST','state',{code:r.code},host,'v8');r=await cmd('rematch');const joined=await rooms.handle('POST','join',{code:r.code,name:'Guest'},null,'v8'),guest=joined.token;r=await rooms.handle('POST','state',{code:r.code},host,'v8');r=await cmd('ready',{ready:true},guest);r=await cmd('start');internal=rooms.rooms.get(r.code);internal.status='finished';internal.game.over=true;r=await rooms.handle('POST','state',{code:r.code},host,'v8');await denied(()=>cmd('rematch',{},guest),'Only host can rematch');r=await cmd('rematch');ok(!r.members.find(x=>x.name==='Guest').ready,'Guests must ready again after rematch');
 internal=rooms.rooms.get(r.code);const botEngine=createEngine();internal.game=botEngine.init({experience:true,expansion:true,count:3},internal.members);internal.game.turn=1;internal.game.phase='buy';internal.game.pending=1;internal.status='playing';internal.deadline=Date.now()+180000;rooms.engines.delete(r.code);await rooms.tick();r=await rooms.handle('POST','state',{code:r.code},host,'v8');ok(r.game.turn===2&&r.game.phase==='roll'&&r.game.players[2].pos===0,'Bot batching stops at the next human action');const stopped=r.revision;await rooms.tick();r=await rooms.handle('POST','state',{code:r.code},host,'v8');ok(r.revision===stopped,'Batching never auto-plays an online human');
 }finally{fs.rmSync(dir,{recursive:true,force:true})}
 // A delayed poll must not replace a newer snapshot, including after waking up.
 const online=fs.readFileSync(path.join(__dirname,'tycoon/online.js'),'utf8'),apply=online.slice(online.indexOf('function applyOnline('),online.indexOf('async function pollOnline(')),net=vm.createContext({onlineSession:{code:'ABC'},onlineRoom:{revision:9},onlineConnected:false,onlineOffset:0,Date});vm.runInContext(apply+'\napplyOnline({code:"ABC",revision:8});',net);ok(vm.runInContext('onlineRoom.revision===9',net),'Out-of-order poll cannot rewind state');
 ok(online.includes('onlinePolling=true')&&online.includes('onlinePolling=false'),'Polling overlap guard');
 const ui=fs.readFileSync(path.join(__dirname,'tycoon/experience-ui.js'),'utf8');ok(ui.includes("window.addEventListener('offline'")&&ui.includes("document.addEventListener('visibilitychange'"),'Offline and wake-up recovery');
 console.log(checks+' V8 checks passed');return checks;
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1});
