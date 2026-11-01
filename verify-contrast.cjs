'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
function luminance(hex){const rgb=hex.replace('#','').match(/../g).map(x=>parseInt(x,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722}
function ratio(a,b){const x=luminance(a),y=luminance(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
module.exports=function(){
 const css=fs.readFileSync(path.join(__dirname,'tycoon/studio.css'),'utf8'),tokens={};
 for(const block of css.matchAll(/html\.studio-ui\[data-theme=midnight\]\{([^}]+)\}/g))for(const pair of block[1].matchAll(/(--[a-z-]+):\s*(#[a-f0-9]{6})(?=;|$)/gi))tokens[pair[1]]=pair[2];
 const checks=[];function check(fg,bg,min){assert.ok(tokens[fg]&&tokens[bg],fg+' and '+bg+' defined');const value=ratio(tokens[fg],tokens[bg]);assert.ok(value>=min,fg+' / '+bg+' contrast '+value.toFixed(2)+' below '+min);checks.push({foreground:fg,background:bg,ratio:Number(value.toFixed(2)),minimum:min})}
 for(const bg of ['--paper','--surface','--tile-surface','--soft-surface','--board-surface','--dialog-surface','--field-surface'])for(const fg of ['--ink','--secondary-text'])check(fg,bg,4.5);
 check('--accent-text','--accent',4.5);check('--muted','--field-surface',4.5);
 for(const fg of ['--status-loss','--status-gain'])check(fg,'--soft-surface',4.5);
 for(const bg of ['--field-surface','--soft-surface','--dialog-surface'])check('--control-line',bg,3);
 console.log(checks.length+' dark-theme contrast pairs passed');return {checks:checks.length,pairs:checks};
};
if(require.main===module)console.log(JSON.stringify(module.exports()));
