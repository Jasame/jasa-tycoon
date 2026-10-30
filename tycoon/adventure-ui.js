'use strict';
const adventurePanel=document.createElement('section');adventurePanel.id='adventurePanel';adventurePanel.className='adventure-panel';
adventurePanel.innerHTML='<div class="world-news"><span class="news-seal" aria-hidden="true">◎</span><div><small>WORLD DISPATCH · 世界新闻</small><strong id="newsHeadline"></strong><p id="newsDescription"></p><p class="news-forecast" id="newsForecast"></p></div></div><details id="journeyDetails"><summary><span>旅程任务与城市地标</span><span id="journeyCount"></span></summary><div id="journeyContent"></div></details>';
$('.map-rule').after(adventurePanel);
let adventurePrevious=null;
function adventureViewer(){return onlineSession&&onlineRoom?.game?state.players[onlineRoom.me]:state.players[state.mode==='local'?state.turn:0]}
function adventureCards(p){
 const a=state.adventure.players[p.id];return state.adventure.missions.map(id=>{const m=JOURNEY_MISSIONS[id],done=a?.completed.includes(id),progress=Math.min(m.target,missionProgress(p,id));return '<article class="mission-card '+(done?'mission-complete':'')+'"><span class="mission-icon" aria-hidden="true">'+m.icon+'</span><div><b>'+m.title+'</b><p>'+m.text+'</p><div class="mission-track" role="progressbar" aria-label="'+m.title+'" aria-valuemin="0" aria-valuemax="'+m.target+'" aria-valuenow="'+(done?m.target:progress)+'"><i style="width:'+((done?m.target:progress)/m.target*100)+'%"></i></div><small>'+(done?'✓ 已完成 · ¥600 已到账':progress+' / '+m.target+' · 完成奖励 ¥600')+'</small></div></article>'}).join('');
}
function landmarkHTML(p){
 const unlocked=state.adventure.landmarks.filter(l=>l.owner===p.id);
 return '<div class="landmark-guide"><b>▥ 你的城市地标</b><p>同色街区全部升级至 2 级，自动落成专属地标。保持同组未抵押且至少 2 级，每次轮到你行动时获得 ¥200。售楼或抵押后收入暂停，恢复条件后继续。</p>'+ (unlocked.length?'<div class="landmark-list">'+unlocked.map(l=>'<span class="landmark-badge" style="--landmark-color:'+GROUPS[l.group]+'">✦ '+LANDMARK_NAMES[l.group]+'<small>'+(landmarkActive(p.id,l.group)?'观光营业 · ¥200 / 回合':'暂歇 · 保留落成荣誉')+'</small></span>').join('')+'</div>':'<p class="landmark-empty">第一座地标，正等待你的街区成长。</p>')+'</div>';
}
function renderAdventureUI(){
 const enabled=hasAdventure(),lobby=onlineSession&&(!onlineRoom?.game||onlineRoom.status==='lobby');adventurePanel.hidden=!enabled||!!lobby;
 if(!enabled||lobby){adventurePrevious=null;return}
 const p=adventureViewer(),a=state.adventure,record=a.players[p.id],currentNews=WORLD_NEWS[a.news.current],nextNews=WORLD_NEWS[a.news.next],nextRound=a.news.round===1?5:a.news.round+5;
 $('#newsHeadline').textContent=currentNews.title;$('#newsDescription').textContent=currentNews.text;$('#newsForecast').textContent='下期预告 · 第 '+nextRound+' 回合：'+nextNews.title+'（租金 ×'+nextNews.factor+'）';
 $('#journeyCount').textContent=p.name+' · '+(record?.completed.length||0)+' / 3';
 const content=adventureCards(p)+landmarkHTML(p);if($('#journeyContent').innerHTML!==content)$('#journeyContent').innerHTML=content;
 const boardTiles=[...$('#board').querySelectorAll('.tile')];
 for(const l of a.landmarks)if(landmarkActive(l.owner,l.group))for(const t of tiles.filter(t=>t.type==='property'&&t.group===l.group)){const el=boardTiles[t.i];if(!el)continue;el.classList.add('landmark-tile');el.style.setProperty('--landmark-color',GROUPS[l.group]);el.setAttribute('aria-label',el.getAttribute('aria-label')+' · '+LANDMARK_NAMES[l.group]+' · 观光营业');if(!el.querySelector('.landmark-star')){const star=document.createElement('span');star.className='landmark-star';star.textContent='✦';star.setAttribute('aria-hidden','true');el.append(star)}}
 const identity=(onlineSession?.code||'local')+':'+a.runId+':'+p.id;
 const next={identity,completed:[...(record?.completed||[])],visited:[...(record?.visited||[])],landmarks:a.landmarks.map(l=>l.owner+':'+l.group),newsRound:a.news.round};
 const previous=adventurePrevious;adventurePrevious=next;
 if(!previous||previous.identity!==identity||!motionEnabled())return;
 const newLandmark=a.landmarks.find(l=>!previous.landmarks.includes(l.owner+':'+l.group));
 const completed=next.completed.filter(id=>!previous.completed.includes(id));
 if(newLandmark){ceremony(state.players[newLandmark.owner].name+' · '+LANDMARK_NAMES[newLandmark.group],'街区点亮，每一层建设都有了回响。','landmark');for(const t of tiles.filter(t=>t.type==='property'&&t.group===newLandmark.group)){const el=boardTiles[t.i];el?.classList.add('landmark-arrival');if(el)sparkBurst(el.getBoundingClientRect(),'#d4b360')}}
 else if(completed.length)ceremony(completed.length>1?'完成 '+completed.length+' 项旅程任务':JOURNEY_MISSIONS[completed[0]].title+' · 达成','奖励 '+money(completed.length*600)+' 已到账，下一座城市见。','mission');
 else if(next.newsRound!==previous.newsRound){const el=effectNode('news-bulletin',1900);if(el){const small=document.createElement('small'),title=document.createElement('strong');small.textContent='WORLD DISPATCH · 市场更新';title.textContent=currentNews.title+' · 租金 ×'+currentNews.factor;el.append(small,title)}}
 else if(next.visited.length>previous.visited.length){const i=next.visited.find(i=>!previous.visited.includes(i)),tile=boardTiles[i];if(tile){const rect=tile.getBoundingClientRect();if(rect.top>=0&&rect.bottom<innerHeight){const el=effectNode('passport-stamp',1000);if(el){el.textContent='已到访';el.style.left=(Math.min(innerWidth-75,Math.max(10,rect.left)))+'px';el.style.top=Math.max(10,rect.top-16)+'px'}}}}
}
const adventureRender=render;
render=function(){adventureRender();renderAdventureUI()};
const adventureOnlinePanel=renderOnlinePanel;
renderOnlinePanel=function(){adventureOnlinePanel();if(onlineSession&&(!onlineRoom?.game||onlineRoom.status==='lobby'))adventurePanel.hidden=true};
const adventureShowTile=showTile;
showTile=function(i){adventureShowTile(i);if(hasAdventure()){const t=tiles[i],l=state.adventure.landmarks.find(l=>l.group===t.group&&l.owner===state.props[i].owner);if(l){const note=document.createElement('p');note.className='landmark-detail';note.textContent='✦ '+LANDMARK_NAMES[l.group]+' · '+(landmarkActive(l.owner,l.group)?'观光营业中：本组为业主每回合提供 ¥200。':'保留落成荣誉；同组全部至少 2 级且未抵押后恢复观光收入。');$('#modalBody').append(note)}}};
renderAdventureUI();
