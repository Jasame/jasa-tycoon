'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const createEngine=require('./engine.cjs');
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fail=(message,status=400)=>Object.assign(new Error(message),{status});
const now=()=>Date.now(),DAY=86400000;
class Rooms{
 constructor(dir,{turnMs=180000}={}){
  this.dir=dir;this.turnMs=turnMs;this.rooms=new Map();this.engines=new Map();this.buckets=new Map();this.queue=Promise.resolve();fs.mkdirSync(dir,{recursive:true,mode:0o700});
  const file=path.join(dir,'rooms.json');
  if(fs.existsSync(file)){
   const saved=JSON.parse(fs.readFileSync(file,'utf8'));if(saved.version!==1||!Array.isArray(saved.rooms))throw Error('Unsupported room data');
   let migrated=false;for(const r of saved.rooms){if(r.updated>now()-7*DAY){r.members.forEach(m=>m.seen=0);if(r.game&&!r.game.comfort){const engine=createEngine();engine.restore(r.game);r.game=engine.snapshot();r.revision++;migrated=true;}this.rooms.set(r.code,r)}}if(migrated)this.persist();
  }
 }
 transaction(fn){const next=this.queue.then(fn);this.queue=next.catch(()=>{});return next}
 persist(){const file=path.join(this.dir,'rooms.json'),tmp=file+'.tmp';fs.writeFileSync(tmp,JSON.stringify({version:1,rooms:[...this.rooms.values()]}),{mode:0o600});fs.renameSync(tmp,file)}
 engine(room){if(!this.engines.has(room.code)){const engine=createEngine();engine.restore(room.game);this.engines.set(room.code,engine)}return this.engines.get(room.code)}
 limit(ip,kind){const key=ip+':'+kind,time=now(),bucket=this.buckets.get(key)||{start:time,count:0};if(time-bucket.start>60000){bucket.start=time;bucket.count=0}bucket.count++;this.buckets.set(key,bucket);if(bucket.count>(kind==='create'?8:kind==='join'?30:kind==='poll'?600:180))throw fail('操作较频繁，请稍后再试',429);if(this.buckets.size>10000)for(const [k,b]of this.buckets)if(time-b.start>60000)this.buckets.delete(k)}
 member(room,token){if(typeof token!=='string'||token.length<32||token.length>128)throw fail('请重新加入或恢复你的座位',401);const h=hash(token),m=room.members.find(x=>!x.bot&&x.hash===h);if(!m)throw fail('座位凭证已失效',401);m.seen=now();return m}
 view(room,m){return {code:room.code,revision:room.revision,status:room.status,me:room.members.indexOf(m),host:room.host===m.id,options:room.options,allReady:room.members.length>=2&&room.members.every(x=>x.ready&&(x.bot||now()-x.seen<20000)),social:(room.social||[]).filter(x=>now()-x.at<12000),members:room.members.map(x=>({id:x.id,name:x.name,host:x.id===room.host,cosmetics:this.cosmetics(x.cosmetics),ready:x.ready,bot:!!x.bot,avatar:x.avatar||'fox',career:x.career||'architect',online:!!x.bot||now()-x.seen<20000})),deadline:room.deadline,serverTime:now(),game:room.game||null,ack:m.actions.slice(-100)}}
 avatar(value){return ['fox','cat','panda','rabbit','bear','frog','owl','penguin','dog','koala','tiger','raccoon'].includes(value)?value:'fox'}
 cosmetics(x){return {pawn:['classic','gem','star'].includes(x?.pawn)?x.pawn:'classic',dice:['classic','mint','ink'].includes(x?.dice)?x.dice:'classic',frame:['none','laurel','orbit'].includes(x?.frame)?x.frame:'none'}}
 botMember(room){const i=[1,2,3,4].find(i=>!room.members.some(x=>x.name==='AI '+i));return {id:crypto.randomUUID(),name:'AI '+i,avatar:['panda','cat','rabbit','bear'][i-1],career:['architect','traveler','banker','merchant'][i-1],bot:true,ready:true,seen:now(),actions:[]}}
 career(value){return ['architect','traveler','banker','merchant'].includes(value)?value:'architect'}
 name(value){const name=String(value||'').trim().replace(/[\u0000-\u001f]/g,'').slice(0,12);if(!name)throw fail('请输入玩家昵称');return name}
 options(input){const maps=['world','asia','europe','africa','north-america','south-america','oceania','antarctica','legacy'];return {community:input?.community===true,experience:input?.experience===true,pace:input?.pace==='quick'?'quick':'standard',personality:['builder','traveler','steady'].includes(input?.personality)?input.personality:'mixed',difficulty:['easy','normal','expert'].includes(input?.difficulty)?input.difficulty:'normal',expansion:input?.expansion===true,map:maps.includes(input?.map)?input.map:'world',capacity:[2,3,4].includes(Number(input?.capacity))?Number(input.capacity):4,limit:[0,12,20,30,60].includes(Number(input?.limit))?Number(input.limit):20}}
 async handle(method,route,body,token,ip){return this.transaction(async()=>{
  this.limit(ip,route==='create'?'create':route==='join'?'join':route==='state'?'poll':'action');
  if(route==='create'){
   this.expire();if(this.rooms.size>=100)throw fail('房间已满，请稍后再试',503);
   let code;do{code=crypto.randomBytes(5).toString('hex').slice(0,8).toUpperCase()}while(this.rooms.has(code));
   const secret=crypto.randomBytes(32).toString('hex'),m={id:crypto.randomUUID(),name:this.name(body.name),avatar:this.avatar(body.avatar),career:this.career(body.career),cosmetics:this.cosmetics(body.cosmetics),hash:hash(secret),ready:true,seen:now(),actions:[]};
   const room={code,status:'lobby',revision:1,host:m.id,options:this.options(body),members:[m],game:null,created:now(),updated:now(),deadline:0};this.rooms.set(code,room);try{this.persist()}catch(e){this.rooms.delete(code);throw e}return {...this.view(room,m),token:secret};
  }
  const code=String(body.code||'').toUpperCase();if(!/^[A-F0-9]{8}$/.test(code))throw fail('请输入 8 位房间码');const room=this.rooms.get(code);if(!room)throw fail('房间不存在或已过期',404);
  if(route==='join'){
   if(room.status!=='lobby')throw fail('本局已开始，请使用已保存的座位重连');if(room.members.length>=room.options.capacity)throw fail('房间已满');const name=this.name(body.name);if(room.members.some(m=>m.name===name))throw fail('昵称已被使用，请换一个昵称');
   const secret=crypto.randomBytes(32).toString('hex'),m={id:crypto.randomUUID(),name,avatar:this.avatar(body.avatar),career:this.career(body.career),cosmetics:this.cosmetics(body.cosmetics),hash:hash(secret),ready:false,seen:now(),actions:[]};const previous=JSON.stringify(room);room.members.push(m);room.revision++;room.updated=now();try{this.persist()}catch(e){this.rooms.set(code,JSON.parse(previous));throw e}return {...this.view(room,m),token:secret};
  }
  const m=this.member(room,token);if(route==='state')return this.view(room,m);
  if(typeof body.actionId!=='string'||!/^[a-zA-Z0-9-]{8,80}$/.test(body.actionId))throw fail('请求编号无效');
  if(m.actions.includes(body.actionId))return this.view(room,m);
  if(route==='emote'){if(!['👋','👏','🤝','🎲'].includes(body.emoji))throw fail('请选择有效表情');if(m.lastEmote&&now()-m.lastEmote<5000)throw fail('每五秒可发送一次表情',429);const old=JSON.stringify(room);m.lastEmote=now();room.social=[...(room.social||[]),{seat:room.members.indexOf(m),emoji:body.emoji,at:now()}].slice(-8);m.actions.push(body.actionId);m.actions=m.actions.slice(-100);room.updated=now();try{this.persist()}catch(e){this.rooms.set(code,JSON.parse(old));throw e}return this.view(room,m)}
  if(body.revision!==room.revision)throw fail('对局已更新，请查看最新状态后重试',409);
  const previous=JSON.stringify(room);
  try{
   if(route==='transferHost'){if(room.host!==m.id||room.status==='countdown')throw fail('当前仅房主可转让房间',403);const target=room.members.find(x=>x.id===body.memberId&&!x.bot&&x.id!==m.id&&now()-x.seen<20000);if(!target)throw fail('请选择另一位在线真人玩家');room.host=target.id;
   }else if(route==='fillBots'){if(room.status!=='lobby'||room.host!==m.id)throw fail('只有房主可在等待房间管理人机',403);while(room.members.length<room.options.capacity)room.members.push(this.botMember(room));
   }else if(route==='rematch'){if(room.status!=='finished'||room.host!==m.id)throw fail('只有房主可在结算后发起再战',403);room.status='lobby';room.game=null;room.deadline=0;room.social=[];room.members.forEach(x=>x.ready=!!x.bot||x.id===room.host);this.engines.delete(code);
   }else if(route==='cancelStart'){if(room.status!=='countdown'||room.host!==m.id)throw fail('只有房主可取消准备倒计时',403);room.status='lobby';room.game=null;room.deadline=0;this.engines.delete(code);
   }else if(route==='addBot'){
    if(room.status!=='lobby'||room.host!==m.id)throw fail('只有房主可在等待房间管理人机',403);if(room.members.length>=room.options.capacity)throw fail('房间已满');const i=[1,2,3,4].find(i=>!room.members.some(x=>x.name==='AI '+i));room.members.push({id:crypto.randomUUID(),name:'AI '+i,avatar:['panda','cat','rabbit','bear'][i-1],career:['architect','traveler','banker','merchant'][i-1],bot:true,ready:true,seen:now(),actions:[]});
   }else if(route==='removeBot'){
    if(room.status!=='lobby'||room.host!==m.id)throw fail('只有房主可在等待房间管理人机',403);const bot=room.members.find(x=>x.id===body.memberId&&x.bot);if(!bot)throw fail('请选择等待中的人机座位');room.members=room.members.filter(x=>x.id!==bot.id);
   }else if(route==='profile'){if(body.career!==undefined){if(room.status!=='lobby')throw fail('职业仅可在开局前选择');m.career=this.career(body.career)}if(body.avatar!==undefined)m.avatar=this.avatar(body.avatar);if(body.cosmetics!==undefined)m.cosmetics=this.cosmetics(body.cosmetics);if(room.game){const p=room.game.players[room.members.indexOf(m)];p.avatar=m.avatar;if(m.cosmetics)p.cosmetics=m.cosmetics;}this.engines.delete(code);
   }else if(route==='ready'){if(room.status!=='lobby')throw fail('对局已开始');m.ready=!!body.ready}
   else if(route==='leave'){
    if(room.status!=='lobby')throw fail('对局已开始，座位将保留用于重连');room.members=room.members.filter(x=>x.id!==m.id);if(room.host===m.id)room.host=room.members.find(x=>!x.bot)?.id||'';
   }
   else if(route==='start'){
    if(room.status!=='lobby'||room.host!==m.id)throw fail('只有房主可以开始对局',403);
    if(room.members.length<2||room.members.some(x=>!x.ready||!x.bot&&now()-x.seen>20000))throw fail('至少两名玩家在线并准备后才能开始');
    const engine=createEngine();room.game=engine.init(room.options,room.members.map(x=>({name:x.name,bot:!!x.bot,avatar:x.avatar,career:x.career,cosmetics:x.cosmetics})));room.status=body.countdown?'countdown':'playing';room.deadline=now()+(body.countdown?3000:this.turnMs);this.engines.set(code,engine);
   }
   else if(route==='action'){
    if(room.status!=='playing')throw fail('请等待房主开始');
    const allowed=['roll','buy','skip','end','bail','bankrupt','build','sell','mortgage','bid','pass','offerTrade','acceptTrade','rejectTrade','card','travel','project'];if(!allowed.includes(body.command))throw fail('不支持的操作');
    const before=room.game,key=g=>g.turn+':'+g.phase+':'+(g.auction?.bidder??'')+':'+(g.offer?.seller??'');
    const engine=this.engine(room);await engine.act(room.members.indexOf(m),body.command,body.arg);engine.noteAction();room.game=engine.snapshot();
    // Asset management does not let a player extend the turn indefinitely.
    if(key(before)!==key(room.game)||['roll','bid','pass','acceptTrade','rejectTrade'].includes(body.command))room.deadline=now()+this.turnMs;
    if(room.game.over){room.status='finished';room.deadline=0}
   }else throw fail('不支持的请求',404);
   m.actions.push(body.actionId);m.actions=m.actions.slice(-100);room.revision++;room.updated=now();this.persist();return this.view(room,m);
  }catch(e){const old=JSON.parse(previous);this.rooms.set(code,old);this.engines.delete(code);throw e}
 })}
 expire(){for(const [code,r] of this.rooms){if(r.updated<now()-(r.status==='lobby'?DAY:7*DAY)){this.rooms.delete(code);this.engines.delete(code)}}}
 async tick(){return this.transaction(async()=>{
  let changed=false;const previousRooms=JSON.stringify([...this.rooms.values()]);
  for(const r of this.rooms.values()){if(r.status==='countdown'&&r.deadline<=now()){if(r.members.some(m=>!m.bot&&now()-m.seen>20000)){r.status='lobby';r.game=null;r.deadline=0;this.engines.delete(r.code)}else{r.status='playing';r.deadline=now()+this.turnMs}r.revision++;r.updated=now();changed=true;continue}if(r.status==='playing'&&r.deadline&&(r.deadline<=now()||this.engine(r).botActor()!==null)){
   const previous=JSON.stringify(r);try{const engine=this.engine(r);const isBot=engine.botActor()!==null;if(isBot){for(let step=0;step<(r.game.experience?(r.game.experience.pace==='quick'?6:3):1)&&engine.botActor()!==null;step++){await engine.botStep();engine.noteAction()}}else {await engine.timeout();engine.noteAction(true)}r.game=engine.snapshot();if(!isBot)r.game.logs.unshift({text:'等待超时，服务器已执行默认操作。',round:r.game.round});r.game.logs=r.game.logs.slice(0,50);engine.restore(r.game);r.revision++;r.updated=now();r.deadline=r.game.over?0:now()+this.turnMs;if(r.game.over)r.status='finished';changed=true}catch(e){this.rooms.set(r.code,JSON.parse(previous));this.engines.delete(r.code);throw e}
  }
  }
  if(changed)try{this.persist()}catch(e){this.rooms=new Map(JSON.parse(previousRooms).map(r=>[r.code,r]));this.engines.clear();throw e}
 })}
}
function makeServer(rooms){return http.createServer(async(req,res)=>{
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'};
 function send(status,data){res.writeHead(status,headers);res.end(JSON.stringify(data))}
 try{
  const url=new URL(req.url,'http://localhost');
  if(req.method==='GET'&&url.pathname==='/tycoon/api/health'){send(200,{ok:true,version:'9.0.0'});return}
  const match=url.pathname.match(/^\/tycoon\/api\/(create|join|state|ready|leave|start|action|addBot|removeBot|profile|emote|cancelStart|rematch|transferHost|fillBots)$/);if(!match||req.method!=='POST')throw fail('接口不存在',404);
  // Nginx forwards the actual Origin; do not accept cross-site JSON requests.
  const origin=req.headers.origin,host=req.headers['x-forwarded-host']||req.headers.host;
  if(origin&&new URL(origin).host!==host)throw fail('不接受跨站请求',403);
  if(!String(req.headers['content-type']||'').startsWith('application/json'))throw fail('请求格式不正确',415);
  let raw='',bytes=0;for await(const chunk of req){bytes+=chunk.length;if(bytes>8192)throw fail('请求内容过大',413);raw+=chunk}let body;try{body=JSON.parse(raw||'{}')}catch(e){throw fail('请求格式不正确')}
  if(!body||typeof body!=='object'||Array.isArray(body))throw fail('请求格式不正确');
  const token=String(req.headers.authorization||'').replace(/^Bearer /,'');const ip=String(req.headers['x-real-ip']||req.socket.remoteAddress);
  const result=await rooms.handle(req.method,match[1],body,token,ip);send(200,result);
 }catch(e){const status=e.status||400;if(!e.status&&/ENOSPC|EACCES|EROFS/.test(String(e.code))){send(503,{error:'服务器保存失败，请稍后再试'});return}send(status,{error:e.status||!e.code?e.message:'服务暂时不可用'})}
 })}
if(require.main===module){
 const rooms=new Rooms(process.env.STATE_DIR||path.join(__dirname,'data')),server=makeServer(rooms);
 server.requestTimeout=10000;server.headersTimeout=10000;
 const timer=setInterval(()=>rooms.tick().catch(e=>console.error('Room tick failed:',e.message)),1000);timer.unref();
 server.listen(Number(process.env.PORT||8912),'127.0.0.1',()=>console.log('World Tycoon online ready on loopback'));
 process.on('SIGTERM',()=>server.close(()=>process.exit(0)));
}
module.exports={Rooms,makeServer};
