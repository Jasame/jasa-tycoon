'use strict';
// Shared rules: browser and room engine call the same bounded operations.
const CAREERS={
 architect:{title:'建筑师',text:'建造费减少15%，租金减少5%。'},
 traveler:{title:'旅行家',text:'经过起点额外获得250，租金减少7%。'},
 banker:{title:'银行家',text:'第二回合起每回合获得60，融资归还1700，建造费增加10%。'},
 merchant:{title:'商人',text:'租金增加15%，经过起点奖励减少150。'}
};
const PERSONAL_GOALS={explore:{title:'探索六站',text:'到访六处不同地产或枢纽',target:6},build:{title:'双层计划',text:'累计升级两次',target:2},collect:{title:'街区组合',text:'同时持有四处地产或枢纽',target:4}};
const STRATEGY_CARDS={shield:{title:'租金保险',text:'下次付租抵扣最多800，业主仍收原租。'},compass:{title:'定向移动',text:'下次移动选择3、5或7格，替代随机骰子。'},coupon:{title:'建设券',text:'下次升级减免最多400，最低支付100。'},loan:{title:'紧急融资',text:'借入1500，三个回合后归还1800，银行家归还1700；全局最多两次。'}};
const CONTESTS={explore:'探索竞赛',build:'建设竞赛',collect:'拓展竞赛'};
const REGION_EVENTS={
 world:[['环球平稳期',1,1,0],['城市博览会',1.12,1,0],['商圈维护周',.95,1,180]],
 asia:[['商路平稳期',1,1,0],['贸易博览会',1.12,1,0],['物流维护周',.95,.9,150]],
 europe:[['古城平稳期',1,1,0],['古城文化节',1.1,1,0],['古城修缮周',.95,.9,150]],
 africa:[['生态平稳期',1,1,0],['生态项目展',1.1,.9,0],['雨季养护周',.9,1,100]],
 'north-america':[['都市平稳期',1,1,0],['创新博览会',1.12,1,0],['设施检修周',.95,.9,200]],
 'south-america':[['山海平稳期',1,1,0],['山海艺术节',1.15,1,0],['山路维护周',.9,.9,150]],
 oceania:[['海岛平稳期',1,1,0],['海岛旅游季',1.15,1,0],['港湾养护周',.9,.9,150]],
 antarctica:[['科考平稳期',1,1,0],['科考成果展',1.1,.9,0],['极地设备检修',.9,1,100]],
 legacy:[['街区平稳期',1,1,0],['街区文化节',1.12,1,0],['街区养护周',.95,.9,150]]
};
function makeExpansion(count,career){const seed=Math.floor(Math.random()*1e9);return {v:7,seed,cycle:0,event:0,nextEvent:1+seed%2,metric:['explore','build','collect'][seed%3],starts:Array(count).fill(0),lastSettled:-1,finished:false,players:Array.from({length:count},(_,i)=>({career:i===0&&Object.hasOwn(CAREERS,career)?career:Object.keys(CAREERS)[i%4],goal:Object.keys(PERSONAL_GOALS)[(seed+i)%3],goalDone:false,visited:[],builds:0,trades:0,hand:['shield','compass'],insurance:0,coupon:0,fixedMove:0,cardRound:0,lastTurn:0,drawRound:0,loan:null,loanUses:0,project:null,projectUses:0,recovery:null,recoveryUsed:false})),history:[],highlights:[]}}
function expansionPlayer(p){return state.expansion?.players[p.id]}
function expansionEvent(){return (REGION_EVENTS[state.map]||REGION_EVENTS.world)[state.expansion?.event||0]}
function expansionLockedCapital(p){const a=expansionPlayer(p);return a?(a.project?.stake||0)-(a.loan?.repay||0):0}
function expansionRentFactor(t){if(!state.expansion)return 1;const a=state.expansion.players[state.props[t.i].owner];return expansionEvent()[1]*(a?.career==='architect'?.95:a?.career==='traveler'?.93:a?.career==='merchant'?1.15:1)}
function buildPayment(p,t){const base=cost(t),a=expansionPlayer(p);if(!a)return base;const role=a.career==='architect'?.85:a.career==='banker'?1.1:1;return Math.max(100,Math.ceil((base*role*expansionEvent()[2]-a.coupon)/10)*10)}
function expansionNote(type,p,value=0){const e=state.expansion;if(!e)return;e.highlights.push({type,player:p.id,round:state.round,value});e.highlights=e.highlights.slice(-32)}
function expansionRecord(){const e=state.expansion;if(!e)return;const point={round:state.round,values:state.players.map(p=>Math.max(-1e9,Math.min(1e9,Math.round(worth(p))))),cash:state.players.map(p=>p.cash)};if(e.history.at(-1)?.round===state.round)e.history[e.history.length-1]=point;else e.history.push(point);e.history=e.history.slice(-61)}
function expansionScore(p,metric){const a=expansionPlayer(p);return metric==='explore'?a.visited.length:metric==='build'?a.builds:owned(p.id).length}
function expansionProgress(p){const a=expansionPlayer(p);if(!a||p.out)return;const g=PERSONAL_GOALS[a.goal];if(!a.goalDone&&expansionScore(p,a.goal)>=g.target){a.goalDone=true;p.cash+=800;log(p.name+' 完成个人目标，获得 ¥800。');expansionNote('goal',p,800)}const r=a.recovery;if(r&&!r.done&&!r.expired){if(state.round>r.deadline)r.expired=true;else if(a.visited.length-r.start>=2){r.done=true;p.cash+=1200;log(p.name+' 完成复兴任务，获得 ¥1,200。');expansionNote('recovery',p,1200)}}}
function settleExpansionContest(){const e=state.expansion;if(!e||e.lastSettled===e.cycle)return;e.lastSettled=e.cycle;const live=state.players.filter(p=>!p.out),scores=live.map(p=>Math.max(0,expansionScore(p,e.metric)-e.starts[p.id])),best=Math.max(0,...scores);if(!best)return;const winners=live.filter((p,i)=>scores[i]===best),prize=Math.floor(900/winners.length/10)*10;for(const p of winners){p.cash+=prize;expansionNote('contest',p,prize);log(p.name+' 赢得公开竞赛，获得 '+money(prize)+'。')}}
function expansionTurn(p){const e=state.expansion,a=expansionPlayer(p);if(!a||p.out)return;const cycle=Math.floor((state.round-1)/4);if(cycle>e.cycle){settleExpansionContest();e.cycle=cycle;e.event=e.nextEvent;e.nextEvent=(e.event+1+Math.floor(Math.random()*2))%3;e.metric=['explore','build','collect'][(e.seed+cycle)%3];e.starts=state.players.map(x=>expansionScore(x,e.metric));log('地图事件：'+expansionEvent()[0]+'。详情和预告见旅程。')}
 if(a.lastTurn===state.round)return;a.lastTurn=state.round;
 if(a.loan&&state.round>=a.loan.due){p.cash-=a.loan.repay;expansionNote('repay',p,-a.loan.repay);log(p.name+' 归还紧急融资 '+money(a.loan.repay)+'。');a.loan=null}
 if(a.project&&state.round>=a.project.due){const win=Math.random()<.55,payout=Math.round(a.project.stake*(win?1.6:.4));p.cash+=payout;expansionNote('project',p,payout-a.project.stake);log(p.name+' 风险项目结算，收回 '+money(payout)+'。');a.project=null}
 if(a.career==='banker'&&state.round>1)p.cash+=60;
 const fee=Math.min(400,expansionEvent()[3]*Math.min(2,owned(p.id).filter(t=>state.props[t.i].level>0).length));if(fee){p.cash-=fee;log(p.name+' 支付地图养护费 '+money(fee)+'。')}
 if(state.round%4===0)drawStrategyCard(p);
 if(!a.recoveryUsed&&state.round>=6&&isUnderdog(p)&&p.cash<3000){a.recoveryUsed=true;a.recovery={start:a.visited.length,deadline:state.round+3,done:false,expired:false};log(p.name+' 获得复兴任务：四回合内探索两处新地点。')}
 expansionProgress(p);expansionRecord();
}
function drawStrategyCard(p){const a=expansionPlayer(p);if(!a||a.drawRound===state.round)return;a.drawRound=state.round;if(a.hand.length<3)a.hand.push(Object.keys(STRATEGY_CARDS)[Math.floor(Math.random()*4)])}
function expansionPassStart(p){const a=expansionPlayer(p);if(!a)return;const bonus=a.career==='traveler'?250:a.career==='merchant'?-150:0;p.cash+=bonus;drawStrategyCard(p)}
function expansionLanding(p,t){const a=expansionPlayer(p);if(!a)return;if(['property','station'].includes(t.type)&&!a.visited.includes(t.i))a.visited.push(t.i);expansionProgress(p)}
function expansionBuilt(p){const a=expansionPlayer(p);if(!a)return;a.coupon=0;a.builds++;expansionNote('build',p);expansionProgress(p)}
function expansionRentDue(p,amount){const a=expansionPlayer(p);if(!a||!a.insurance||amount<=0)return amount;const rebate=Math.min(amount,a.insurance);a.insurance=0;log(p.name+' 使用租金保险抵扣 '+money(rebate)+'。');return amount-rebate}
function expansionGuard(p,phases=['roll','end']){if(!state.expansion||busy||state.over||p.out||p.id!==state.turn||!phases.includes(state.phase))throw Error('此时无法使用策略，请等待你的回合')}
function useStrategyCard(p,index,arg){expansionGuard(p,['roll','buy','end']);const a=expansionPlayer(p);if(!Number.isInteger(index)||index<0||index>=a.hand.length)throw Error('请选择有效手牌');if(a.cardRound===state.round)throw Error('每回合最多使用一张策略卡');const id=a.hand[index];
 if(id==='compass'){if(state.phase!=='roll'||p.jail||a.fixedMove||![3,5,7].includes(arg))throw Error('定向移动需在未入狱的掷骰阶段选择3、5或7格');a.fixedMove=arg}
 if(id==='shield'){if(a.insurance)throw Error('已有待生效的租金保险');a.insurance=800}
 if(id==='coupon'){if(a.coupon)throw Error('已有待生效的建设券');a.coupon=400}
 if(id==='loan'){if(a.loan||a.loanUses>=2)throw Error('融资尚未归还或次数已用尽');p.cash+=1500;a.loan={due:state.round+3,repay:a.career==='banker'?1700:1800};a.loanUses++;expansionNote('loan',p,1500)}
 a.hand.splice(index,1);a.cardRound=state.round;log(p.name+' 使用策略卡「'+STRATEGY_CARDS[id].title+'」。');
}
function strategyDice(p,a,b){const x=expansionPlayer(p);if(!x?.fixedMove)return [a,b];const move=x.fixedMove;x.fixedMove=0;return [move-1,1]}
function branchDestinations(p){return !p.jail&&[0,8,16,24].includes(p.pos)?[p.pos+4,p.pos+7].map(i=>i%32):[]}
function takeBranch(p,destination){expansionGuard(p,['roll']);const a=expansionPlayer(p);if(p.cash<300||a.fixedMove||!branchDestinations(p).includes(destination))throw Error('支线仅在路口开放，需300且未使用定向移动');p.cash-=300;p.pos=destination;log(p.name+' 搭乘支线前往 '+tiles[destination].name+'，支付 ¥300，不领取起点奖励。');land()}
function startRiskProject(p,stake){expansionGuard(p,['end']);const a=expansionPlayer(p);if(a.project||a.projectUses>=2||![2000,4000].includes(stake)||p.cash<stake+2000)throw Error('项目需保留2000现金，且全局最多两次');p.cash-=stake;a.project={stake,due:state.round+3};a.projectUses++;expansionNote('invest',p,-stake);log(p.name+' 投入风险项目 '+money(stake)+'，三回合后结算。')}
function expansionTrade(buyer,seller,price,t){if(!state.expansion)return;if(price>=t.price*.6)for(const p of [buyer,seller]){expansionPlayer(p).trades++;expansionNote('trade',p,p.id===buyer.id?-price:price);expansionProgress(p)}}
function expansionFinish(){const e=state.expansion;if(!e||e.finished)return;e.finished=true;settleExpansionContest();for(const p of state.players){const a=expansionPlayer(p);if(p.out)continue;if(a.project){p.cash+=a.project.stake;a.project=null}if(a.loan){p.cash-=a.loan.repay;a.loan=null}expansionProgress(p)}expansionRecord()}
function expansionBankrupt(p){const a=expansionPlayer(p);if(a){a.loan=null;a.project=null;a.hand=[]}}
function expansionAI(p){const a=expansionPlayer(p);if(!a||p.out)return;const use=(id,arg)=>{const i=a.hand.indexOf(id);if(i<0||a.cardRound===state.round)return false;try{useStrategyCard(p,i,arg);return true}catch(e){return false}};
 if(p.cash<1200&&!a.loan)use('loan');
 if(state.phase==='roll'){if(!a.insurance&&p.cash<4000)use('shield');if(!p.jail&&!a.fixedMove){const own=[3,5,7].find(d=>{const r=state.props[(p.pos+d)%32];return r.owner===p.id&&!r.mortgage&&r.level<4});if(own)use('compass',own)}if(!a.fixedMove&&p.cash>3000){const exit=branchDestinations(p).find(i=>state.props[i].owner===p.id&&!state.props[i].mortgage);if(exit!==undefined)takeBranch(p,exit)}}
 if(state.phase==='end'){const t=tiles[p.pos];if(state.props[p.pos].owner===p.id&&t.type==='property'&&!a.coupon)use('coupon');if(!a.project&&a.projectUses<2&&owned(p.id).length>=3&&p.cash>=9000&&Math.random()<.12)startRiskProject(p,2000)}
}
function normalizeExpansion(input,n,round){if(input==null)return undefined;const e=JSON.parse(JSON.stringify(input)),integer=(v,min=0,max=1e9)=>Number.isSafeInteger(v)&&v>=min&&v<=max,enumKey=(obj,key)=>typeof key==='string'&&Object.hasOwn(obj,key),uniqueList=(v,max)=>Array.isArray(v)&&v.length<=max&&new Set(v).size===v.length;
 if(e.v!==7||!integer(e.seed)||!integer(e.cycle,0,Math.floor((round-1)/4))||!integer(e.event,0,2)||!integer(e.nextEvent,0,2)||!enumKey(CONTESTS,e.metric)||!Array.isArray(e.starts)||e.starts.length!==n||e.starts.some(x=>!integer(x))||!integer(e.lastSettled,-1,e.cycle)||typeof e.finished!=='boolean'||!Array.isArray(e.players)||e.players.length!==n||!Array.isArray(e.history)||e.history.length>61||!Array.isArray(e.highlights)||e.highlights.length>32)throw Error('策略旅程数据无效');
 const out={v:7,seed:e.seed,cycle:e.cycle,event:e.event,nextEvent:e.nextEvent,metric:e.metric,starts:[...e.starts],lastSettled:e.lastSettled,finished:e.finished,players:[],history:[],highlights:[]};
 for(const a of e.players){if(!a||!enumKey(CAREERS,a.career)||!enumKey(PERSONAL_GOALS,a.goal)||typeof a.goalDone!=='boolean'||!uniqueList(a.visited,32)||a.visited.some(i=>!integer(i,0,31)||!(typeof raw[i][1]==='number'||raw[i][1]==='station'))||!integer(a.builds)||!integer(a.trades)||!Array.isArray(a.hand)||a.hand.length>3||a.hand.some(id=>!enumKey(STRATEGY_CARDS,id))||![0,800].includes(a.insurance)||![0,400].includes(a.coupon)||![0,3,5,7].includes(a.fixedMove)||![a.cardRound,a.lastTurn,a.drawRound].every(v=>integer(v,0,round))||!integer(a.loanUses,0,2)||!integer(a.projectUses,0,2)||typeof a.recoveryUsed!=='boolean')throw Error('策略玩家数据无效');
  const clean={career:a.career,goal:a.goal,goalDone:a.goalDone,visited:[...a.visited],builds:a.builds,trades:a.trades,hand:[...a.hand],insurance:a.insurance,coupon:a.coupon,fixedMove:a.fixedMove,cardRound:a.cardRound,lastTurn:a.lastTurn,drawRound:a.drawRound,loan:null,loanUses:a.loanUses,project:null,projectUses:a.projectUses,recovery:null,recoveryUsed:a.recoveryUsed};
  if(a.loan){if(!integer(a.loan.due,1,round+3)||a.loan.repay!==(a.career==='banker'?1700:1800)||!a.loanUses)throw Error('融资数据无效');clean.loan={due:a.loan.due,repay:a.loan.repay}}
  if(a.project){if(!integer(a.project.due,1,round+3)||![2000,4000].includes(a.project.stake)||!a.projectUses)throw Error('项目数据无效');clean.project={due:a.project.due,stake:a.project.stake}}
  if(a.recovery){const r=a.recovery;if(!a.recoveryUsed||!integer(r.start,0,32)||!integer(r.deadline,1,round+4)||typeof r.done!=='boolean'||typeof r.expired!=='boolean')throw Error('复兴任务数据无效');clean.recovery={start:r.start,deadline:r.deadline,done:r.done,expired:r.expired}}
  out.players.push(clean);
 }
 let last=0;for(const h of e.history){if(!integer(h.round,1,round)||h.round<last||!Array.isArray(h.values)||!Array.isArray(h.cash)||h.values.length!==n||h.cash.length!==n||[...h.values,...h.cash].some(v=>!integer(v,-1e9,1e9)))throw Error('回顾数据无效');last=h.round;out.history.push({round:h.round,values:[...h.values],cash:[...h.cash]})}
 for(const h of e.highlights){if(!['goal','contest','project','repay','loan','invest','trade','build','recovery'].includes(h.type)||!integer(h.player,0,n-1)||!integer(h.round,1,round)||!integer(h.value,-1e9,1e9))throw Error('关键时刻数据无效');out.highlights.push({type:h.type,player:h.player,round:h.round,value:h.value})}return out;
}
