'use strict';
// Translate presentation nodes only. Names, room codes, inputs and game data stay intact.
const localizedNodes=new WeakMap(),localizedAttributes=new WeakMap();
let localeObserver=null,localizing=false;
const languageToggle=document.createElement('button');languageToggle.id='languageToggle';languageToggle.type='button';languageToggle.dataset.i18nSkip='';$('header nav').insertBefore(languageToggle,$('#newGame'));
const displayButton=document.createElement('button');displayButton.id='displaySettings';displayButton.type='button';displayButton.textContent='外观与语言';extraTools.prepend(displayButton);
function customPlayerNames(){return (state?.players||[]).map(p=>p.name).filter(name=>/[\u3400-\u9fff]/.test(name)&&!['你','小林','阿橘','老钱','旅人'].includes(name)&&!/^玩家\s*\d+$/.test(name))}
let toTraditional=null;
function traditionalText(value){if(typeof OpenCC==='undefined')return value;toTraditional=toTraditional||OpenCC.Converter({from:'cn',to:'hk'});const names=customPlayerNames(),parts=[];let text=String(value);for(const name of [...names].sort((a,b)=>b.length-a.length))if(text.includes(name)){const marker='\uE100'+parts.length+'\uE101';parts.push(name);text=text.split(name).join(marker)}text=toTraditional(text);return text.replace(/\uE100(\d+)\uE101/g,(_,i)=>parts[Number(i)])}
function localizedValue(value){return uiPreferences.language==='en'?englishText(value,customPlayerNames()):uiPreferences.language==='zh-Hant'?traditionalText(value):value}
function translateInterface(){
 if(localizing)return;localizing=true;localeObserver?.disconnect();
 try{
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let node;
  while((node=walker.nextNode())){
   if(!node.parentElement||node.parentElement.closest('script,style,textarea,input,[data-i18n-skip]'))continue;
   let item=localizedNodes.get(node);if(!item){item={source:node.nodeValue,rendered:node.nodeValue};localizedNodes.set(node,item)}else if(node.nodeValue!==item.rendered)item.source=node.nodeValue;
   const value=localizedValue(item.source);item.rendered=value;if(node.nodeValue!==value)node.nodeValue=value;
  }
  for(const el of document.body.querySelectorAll('[title],[aria-label],[placeholder],[aria-valuetext]')){
   if(el.closest('[data-i18n-skip]'))continue;
   let values=localizedAttributes.get(el);if(!values){values={};localizedAttributes.set(el,values)}
   for(const name of ['title','aria-label','placeholder','aria-valuetext'])if(el.hasAttribute(name)){const value=el.getAttribute(name);let item=values[name];if(!item)item=values[name]={source:value,rendered:value};else if(value!==item.rendered)item.source=value;const next=localizedValue(item.source);item.rendered=next;if(next!==value)el.setAttribute(name,next)}
  }
  const label=uiPreferences.language==='en'?'简 / 繁':uiPreferences.language==='zh-Hant'?'繁 / EN':'简 / EN';if(languageToggle.textContent!==label)languageToggle.textContent=label;
  languageToggle.setAttribute('aria-label',uiPreferences.language==='en'?'Switch to Simplified Chinese':uiPreferences.language==='zh-Hant'?'Switch to English':'Switch to Traditional Chinese');
  languageToggle.setAttribute('title','简体 / 繁體 / English');
  document.title=uiPreferences.language==='en'?'World Tycoon':localizedValue('环球大富翁 · WORLD TYCOON');
 }finally{localizing=false;localeObserver?.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['title','aria-label','placeholder','aria-valuetext']})}
}
function applyDisplayPreferences(){
 document.documentElement.lang=uiPreferences.language==='en'?'en':uiPreferences.language==='zh-Hant'?'zh-HK':'zh-CN';document.documentElement.dataset.theme=uiPreferences.theme;document.documentElement.dataset.layout=uiPreferences.layout;
 document.querySelector('meta[name="theme-color"]').content=uiPreferences.theme==='midnight'?'#0e1921':uiPreferences.theme==='ivory'?'#eee9df':'#173f36';
}
function saveDisplayPreferences(){try{localStorage.setItem(UI_PREFS_KEY,JSON.stringify(uiPreferences));return true}catch(e){toast('偏好保存失败，本次选择仍然有效。');return false}}
function setDisplayPreference(key,value){
 uiPreferences=normalizeUIPreferences({...uiPreferences,[key]:value});saveDisplayPreferences();applyDisplayPreferences();
 if(key==='language'){translateInterface();refreshDeviceControls();updateCompactUI();}
 syncDisplayControls();translateInterface();
}
function syncDisplayControls(){
 document.querySelectorAll('[data-ui-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.uiTheme===uiPreferences.theme)));
 document.querySelectorAll('[data-ui-layout]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.uiLayout===uiPreferences.layout)));
 if($('#uiLanguage'))$('#uiLanguage').value=uiPreferences.language;
 if($('#quietAuctions'))$('#quietAuctions').checked=!!state.comfort?.quietAuctions;
}
function showDisplaySettings(){
 modal('外观与语言',`<p class="prefs-intro">即时预览，自动记住你的选择。</p><label class="prefs-language">语言<select id="uiLanguage"><option value="zh" data-i18n-skip>简体中文</option><option value="zh-Hant" data-i18n-skip>繁體中文</option><option value="en" data-i18n-skip>English</option></select></label><h3>界面风格</h3><div class="theme-choices" role="group" aria-label="界面风格">${[['jade','翡翠'],['midnight','午夜'],['ivory','暖白']].map(([id,label])=>'<button type="button" data-ui-theme="'+id+'"><span class="theme-preview theme-preview-'+id+'" aria-hidden="true"><i></i><i></i><i></i></span><b>'+label+'</b><span class="theme-check" aria-hidden="true">✓</span></button>').join('')}</div><h3>布局</h3><div class="layout-choices" role="group" aria-label="布局"><button type="button" data-ui-layout="standard">标准布局</button><button type="button" data-ui-layout="focus">专注布局</button></div><p class="prefs-help">保留棋盘、资产与当前操作，收起次要动态。</p>${!onlineSession&&state.mode==='ai'?'<section class="prefs-quiet"><h3>拍卖免打扰</h3><label><input id="quietAuctions" type="checkbox">略过 AI 回合拍卖</label><p class="prefs-help">仅限 AI 对战；不会自动花钱。你的回合仍可参与拍卖。</p></section>':''}`);
 $('.modal').classList.add('display-modal');
 $('#uiLanguage').onchange=e=>setDisplayPreference('language',e.target.value);
 document.querySelectorAll('[data-ui-theme]').forEach(b=>b.onclick=()=>setDisplayPreference('theme',b.dataset.uiTheme));
 document.querySelectorAll('[data-ui-layout]').forEach(b=>b.onclick=()=>setDisplayPreference('layout',b.dataset.uiLayout));
 if($('#quietAuctions'))$('#quietAuctions').onchange=e=>{ensureComfort(state);state.comfort.quietAuctions=e.target.checked;save();syncDisplayControls();};
 syncDisplayControls();translateInterface();
}
displayButton.onclick=showDisplaySettings;
languageToggle.onclick=()=>{const langs=['zh','zh-Hant','en'];setDisplayPreference('language',langs[(langs.indexOf(uiPreferences.language)+1)%langs.length])};
const displayRender=render,displayAction=renderAction,displayModal=modal,displayToast=toast,displayOnlinePanel=renderOnlinePanel;
render=function(){displayRender();translateInterface()};
renderAction=function(){displayAction();translateInterface()};
renderOnlinePanel=function(){displayOnlinePanel();translateInterface()};
modal=function(...args){$('.modal').classList.remove('display-modal');displayModal(...args);translateInterface()};
toast=function(...args){displayToast(...args);translateInterface()};
localeObserver=new MutationObserver(()=>translateInterface());
applyDisplayPreferences();translateInterface();

const displayMakeGame=makeGame;makeGame=function(opts={}){return displayMakeGame({...opts,quietAuctions:opts.quietAuctions??!!state?.comfort?.quietAuctions})};
