'use strict';
// Presentation only. Keep original game controls and their authorization checks.
document.documentElement.classList.add('compact-ui');
const journeyPortal=document.createElement('button');journeyPortal.id='journeyPortal';journeyPortal.type='button';journeyPortal.textContent='旅程';
actions.insertBefore(journeyPortal,toolsToggle);
for(const id of ['atlas','rules','sound'])extraTools.append($('#'+id));
$('#atlas').textContent='更换地图 · 新局';$('#sound').className='menu-sound';
toolsToggle.textContent='菜单';
const compactToggle=toolsToggle.onclick;
toolsToggle.onclick=()=>{compactToggle();toolsToggle.textContent=actions.classList.contains('tools-open')?'收起':'菜单'};
function closeTools(){actions.classList.remove('tools-open');toolsToggle.textContent='菜单';toolsToggle.setAttribute('aria-expanded','false')}
extraTools.addEventListener('click',e=>{if(e.target.closest('button')&&!['sound','motionToggle'].includes(e.target.closest('button').id))closeTools()});
document.addEventListener('pointerdown',e=>{if(!actions.contains(e.target))closeTools()});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeTools()});
const mapMeta=document.createElement('div');mapMeta.className='map-meta';mapMeta.append($('.round'),$('#marketLabel'));$('#mapTitle').after(mapMeta);
const boardTools=document.createElement('div');boardTools.className='board-tools';boardTools.append($('#assets'),zoomButton);boardToolbar.append(boardTools);
$('#assets').textContent='管理资产';$('#assets').onclick=()=>showAssets();
const sidebar=$('aside');sidebar.prepend($('.action-panel'));
const feedDetails=document.createElement('details');feedDetails.className='feed-details';const feedSummary=document.createElement('summary');feedSummary.textContent='最近动态';$('.feed-panel').before(feedDetails);feedDetails.append(feedSummary,$('.feed-panel'));
function journeyOverviewHTML(){
 const mapInfo='<section class="journey-map"><b>'+escapeHTML(activeMap.name)+' · '+escapeHTML(mapRule().title)+'</b><p>'+escapeHTML(specialRules()?mapRule().text:'当前为兼容对局，保持原有经营规则。')+'</p></section>';
 if(!hasAdventure())return mapInfo+'<p>旅程任务、城市地标与新闻预告会在新的一局启用，当前对局保留原有规则。</p>';
 const news=WORLD_NEWS[state.adventure.news.current],next=WORLD_NEWS[state.adventure.news.next],round=state.adventure.news.round===1?5:state.adventure.news.round+5,p=adventureViewer();
 return '<section class="journey-news"><small>世界新闻</small><h3>'+news.title+'</h3><p>'+news.text+'</p><p>第 '+round+' 回合预告：'+next.title+' · 租金 ×'+next.factor+'</p></section>'+mapInfo+'<h3>'+escapeHTML(p.name)+' 的旅程任务</h3><div class="overview-missions">'+adventureCards(p)+'</div>'+landmarkHTML(p);
}
function showJourneyOverview(){modal('旅程与世界',journeyOverviewHTML());$('.modal').classList.add('journey-modal')}
journeyPortal.onclick=showJourneyOverview;
function updateCompactUI(){
 const lobby=onlineSession&&(!onlineRoom?.game||onlineRoom.status==='lobby');
 journeyPortal.disabled=!!lobby;
 const p=hasAdventure()?adventureViewer():null;
 journeyPortal.textContent=p?'旅程 '+(state.adventure.players[p.id]?.completed.length||0)+'/3':'旅程';
 journeyPortal.setAttribute('aria-label','旅程、世界新闻与地图规则'+(p?'，已完成 '+(state.adventure.players[p.id]?.completed.length||0)+' 项任务':''));
 $('#modeLabel').textContent=onlineSession?'联机 · '+(onlineRoom?.members.length||'–')+' 人':(state.mode==='local'?'本地轮流':'AI 对战')+' · '+state.players.length+' 人';
 $('#marketLabel').textContent='租金 ×'+(state.market?.factor||1);$('#marketLabel').title=state.market?.name||'平稳市场';
 $('#onlineButton').textContent=onlineSession?'房间':'联机';
 $('#onlinePanel').dataset.stage=onlineRoom?.status||'';
 if($('#copyInvite'))$('#copyInvite').textContent='邀请朋友';if($('#roomDetails'))$('#roomDetails').textContent='房间详情';
 $('#sound').textContent=muted?'音效 · 关闭':'音效 · 开启';
 if(!$('#modal').hidden&&$('.modal').classList.contains('journey-modal')){const body=$('#modalBody'),html=journeyOverviewHTML();if(body.innerHTML!==html)body.innerHTML=html}
}
const compactRender=render,compactAction=renderAction,compactOnlinePanel=renderOnlinePanel;
render=function(){compactRender();updateCompactUI()};
renderAction=function(){compactAction();updateCompactUI()};
renderOnlinePanel=function(){compactOnlinePanel();updateCompactUI()};
$('#sound').addEventListener('click',()=>{$('#sound').textContent=muted?'音效 · 关闭':'音效 · 开启'});
function selectedMapPreview(){
 const preview=$('#selectedMapPreview');if(!preview)return;
 const map=MAPS.find(m=>m.id===chosenMap),rule=MAP_RULES[chosenMap]||MAP_RULES.legacy;
 preview.textContent=(map?.desc||'保留最初的中国城市棋盘。')+' '+rule.title+'：'+rule.text;
 $('#mapPicker')?.querySelectorAll('[data-map]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.map===chosenMap)));
}
function polishSetup(){
 const body=$('#modalBody'),picker=$('#mapPicker'),start=$('#startGame');if(!picker||!start)return;
 $('.modal').classList.add('setup-modal');$('#modalTitle').textContent='开始新对局';$('#modeInput').options[0].textContent='AI 对战';$('#modeInput').options[1].textContent='同屏轮流';
 const intro=document.createElement('p');intro.className='setup-intro';intro.textContent='选择地图，即可出发。当前进度会自动备份。';
 const basic=document.createElement('div');basic.className='setup-basic';for(const id of ['nameInput','modeInput','countInput'])basic.append($('#'+id).closest('label'));
 const mapTitle=document.createElement('h3');mapTitle.textContent='选择地图 · 9 张';
 const preview=document.createElement('p');preview.id='selectedMapPreview';preview.className='selected-map-preview';
 const advanced=document.createElement('details');advanced.className='setup-advanced';const summary=document.createElement('summary');summary.textContent='更多设置 · AI、速度与时长';const advancedGrid=document.createElement('div');advancedGrid.className='setup-advanced-grid';for(const id of ['difficultyInput','speedInput','limitInput'])advancedGrid.append($('#'+id).closest('label'));advanced.append(summary,advancedGrid);
 const footer=document.createElement('div');footer.className='setup-footer';footer.append(start);start.textContent='开始游戏 →';
 body.replaceChildren(intro,basic,mapTitle,picker,preview,advanced,footer);
 picker.addEventListener('click',()=>selectedMapPreview());queueMicrotask(selectedMapPreview);
 $('#modeInput').addEventListener('change',()=>{$('#difficultyInput').closest('label').hidden=$('#modeInput').value==='local'});
}
function polishConnection(){
 if(!$('#onlineName')||!$('#createOnline')||!$('#joinOnline'))return;
 const body=$('#modalBody'),create=$('.online-create'),join=$('.online-join');$('.modal').classList.add('connection-modal');$('#modalTitle').textContent='和朋友联机';
 const intro=body.querySelector('p');if(intro)intro.textContent='2–4 人一起玩。选择创建房间，或输入朋友的房间码。';
 const switches=document.createElement('div');switches.className='connection-switch';switches.setAttribute('role','group');switches.setAttribute('aria-label','选择联机方式');
 const createTab=document.createElement('button'),joinTab=document.createElement('button');createTab.type=joinTab.type='button';createTab.textContent='创建房间';joinTab.textContent='加入房间';
 function select(joining){create.hidden=joining;join.hidden=!joining;createTab.setAttribute('aria-pressed',String(!joining));joinTab.setAttribute('aria-pressed',String(joining))}
 createTab.onclick=()=>select(false);joinTab.onclick=()=>select(true);switches.append(createTab,joinTab);create.before(switches);
 const seats=$('#recentSeats');if(seats){const details=document.createElement('details'),summary=document.createElement('summary');details.className='recent-details';summary.textContent='恢复已保存的座位';const heading=seats.previousElementSibling;if(heading?.tagName==='H3')heading.remove();seats.before(details);details.append(summary,seats)}
 select(!!$('#onlineCode').value);
}
function polishModal(){
 $('.modal').classList.remove('setup-modal','connection-modal','journey-modal');polishSetup();polishConnection();closeTools();
}
const compactModal=modal;
modal=function(...args){compactModal(...args);polishModal()};
function modalIsolation(){const open=!$('#modal').hidden;$('main').inert=open;$('header').inert=open;dock.inert=open;if(!open)$('.modal').classList.remove('setup-modal','connection-modal','journey-modal')}
new MutationObserver(modalIsolation).observe($('#modal'),{attributes:true,attributeFilter:['hidden']});
$('#closeModal').onclick=()=>closeModal();
if(!$('#modal').hidden)polishModal();
modalIsolation();updateCompactUI();
