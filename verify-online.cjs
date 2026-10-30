'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),http=require('node:http');
const {Rooms,makeServer}=require('./server/server.cjs');
module.exports=async function verifyOnline({skipHTTP=false}={}){
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'world-tycoon-test-'));let store=new Rooms(dir,{turnMs:50}),checks=0,seq=0;
 const ok=(value,label)=>{assert.ok(value,label);checks++;console.log('PASS '+label)};
 const deny=async(fn,label,status)=>{await assert.rejects(fn,e=>!status||e.status===status);checks++;console.log('PASS '+label)};
 const call=(route,data,token)=>store.handle('POST',route,data,token,'test-ip');
 const mutate=(route,room,token,extra={})=>call(route,{code:room.code,revision:room.revision,actionId:'test-action-'+(++seq),...extra},token);
 let server;
 try{
  let host=await call('create',{name:'Alice',map:'europe',capacity:2,limit:30});const h=host.token,code=host.code;
  ok(/^[A-F0-9]{8}$/.test(code)&&h.length===64,'Create invite code with separate private seat token');
  await deny(()=>call('state',{code},''),'Reject unauthenticated room reads',401);
  await deny(()=>call('join',{code,name:'Alice'}),'Reject duplicate player names');
  let guest=await call('join',{code,name:'Bob'}),g=guest.token;
  ok(guest.me===1&&guest.members.length===2,'Second player joins the same room');
  await deny(()=>call('join',{code,name:'Eve'}),'Room capacity is enforced');
  await deny(()=>mutate('start',guest,g),'Only the host can start',403);
  host=await call('state',{code},h);await deny(()=>mutate('start',host,h),'Cannot start until every player is ready');
  guest=await call('state',{code},g);guest=await mutate('ready',guest,g,{ready:true});host=await call('state',{code},h);host=await mutate('start',host,h);
  ok(host.status==='playing'&&host.game.players.length===2&&host.game.map==='europe','Host starts a ready remote game using the selected map');
  await deny(()=>call('join',{code,name:'Late'}),'Started games reserve seats for reconnects');
  guest=await call('state',{code},g);await deny(()=>mutate('action',guest,g,{command:'roll'}),'Other players cannot roll out of turn');
  await deny(()=>call('action',{code,revision:0,actionId:'conflict-test',command:'roll'},h),'Stale revisions are rejected',409);
  const data={code,revision:host.revision,actionId:'duplicate-roll-test',command:'roll'};
  const results=await Promise.all([call('action',data,h),call('action',data,h)]);host=results[1];
  ok(results[0].revision===results[1].revision&&host.game.dice.every(x=>x>=1&&x<=6),'Concurrent duplicate commands roll once with server dice');
  ok(host.ack.includes('duplicate-roll-test'),'Player receives an acknowledgement for reconnect-safe retries');
  const before=JSON.stringify(host.game);await deny(()=>mutate('action',host,h,{command:'setState',arg:{cash:9999999}}),'Client cannot submit a fabricated state');
  ok(JSON.stringify((await call('state',{code},h)).game)===before,'Rejected commands leave game state unchanged');
  // Controlled game fixture to verify remote transaction authorization.
  const room=store.rooms.get(code),engine=store.engine(room);let game=engine.snapshot();game.phase='end';game.turn=0;game.pending=null;game.props[1].owner=1;engine.restore(game);room.game=engine.snapshot();
  host=await call('state',{code},h);host=await mutate('action',host,h,{command:'offerTrade',arg:{tile:1,price:1500}});
  ok(host.game.phase==='trade'&&host.game.props[1].owner===1,'Purchase offer waits for the remote seller');
  await deny(()=>mutate('action',host,h,{command:'acceptTrade'}),'Buyer cannot accept on the seller behalf');
  guest=await call('state',{code},g);guest=await mutate('action',guest,g,{command:'acceptTrade'});
  ok(guest.game.phase==='end'&&guest.game.props[1].owner===0&&guest.game.players[0].cash+guest.game.players[1].cash===game.players[0].cash+game.players[1].cash,'Remote acceptance transfers land and conserves money');
  host=await call('state',{code},h);await deny(()=>mutate('action',host,h,{command:'offerTrade',arg:{tile:2,price:-500}}),'Negative and invalid trade offers are rejected');
  host=await mutate('action',host,h,{command:'end'});ok(host.game.turn===1,'End turn is synchronized to the next player');
  await deny(()=>mutate('action',host,h,{command:'mortgage',arg:{tile:1}}),'Out-of-turn asset changes are rejected');
  const saved=fs.readFileSync(path.join(dir,'rooms.json'),'utf8');ok(!saved.includes(h)&&!saved.includes(g),'Persisted data contains token hashes, not raw seat credentials');
  store=new Rooms(dir,{turnMs:50});const restored=await call('state',{code},g);
  ok(restored.game.turn===1&&restored.game.props[1].owner===0&&restored.me===1,'Service restart restores the game and the correct seat');
  const r=store.rooms.get(code);r.deadline=Date.now()-1;await store.tick();const afterTimeout=await call('state',{code},g);
  ok(afterTimeout.revision>restored.revision&&afterTimeout.game.logs.some(x=>x.text.includes('超时')),'Server advances a stalled turn after the deadline');
  const revision=afterTimeout.revision,persist=store.persist.bind(store);store.persist=()=>{throw Object.assign(Error('quota'),{code:'ENOSPC'})};
  const stalled=store.rooms.get(code);stalled.deadline=Date.now()-1;await deny(()=>store.tick(),'Failed persistence rolls back timed actions');store.persist=persist;
  ok(store.rooms.get(code).revision===revision,'No unacknowledged timeout mutation remains after storage failure');
  // Actual HTTP route checks on a local ephemeral port.
  if(!skipHTTP){server=makeServer(store);await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)});const port=server.address().port;
  const request=(method,url,body,headers={})=>new Promise((resolve,reject)=>{const req=http.request({host:'127.0.0.1',port,path:url,method,headers:{'Content-Type':'application/json',...headers}},res=>{let data='';res.on('data',c=>data+=c);res.on('end',()=>resolve({status:res.statusCode,body:JSON.parse(data)}))});req.on('error',reject);if(body)req.write(JSON.stringify(body));req.end()});
  ok((await request('GET','/tycoon/api/health')).body.ok,'HTTP health endpoint reports a running service');
  ok((await request('POST','/tycoon/api/state',{code},{Authorization:'Bearer '+g})).body.me===1,'HTTP reconnect authenticates the existing seat');
  ok((await request('POST','/tycoon/api/state',{code},{Origin:'https://evil.example',Authorization:'Bearer '+g})).status===403,'Cross-origin requests are rejected');
  ok((await request('POST','/tycoon/api/state',{code},{'Content-Type':'text/plain'})).status===415,'Non-JSON requests are rejected');
  ok((await request('GET','/tycoon/api/state')).status===404,'Unknown HTTP methods cannot mutate rooms');
  }
  console.log(checks+' online checks passed');return checks;
 }finally{if(server)await new Promise(resolve=>server.close(resolve));fs.rmSync(dir,{recursive:true,force:true})}
};
if(require.main===module)module.exports().catch(e=>{console.error(e);process.exitCode=1});
