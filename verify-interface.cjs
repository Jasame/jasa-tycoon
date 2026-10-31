'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=function verifyInterface(){
 const source=fs.readFileSync(path.join(__dirname,'tycoon/responsive.js'),'utf8');
 const controls={roll:{hidden:false,disabled:false,textContent:'掷骰子'},end:{hidden:true,disabled:false,textContent:'结束回合'},choices:[]};
 const ctx=vm.createContext({state:{turn:0,phase:'roll',over:false,players:[{name:'You',cash:15000,ai:false,jail:0},{name:'Other',cash:15000,ai:false}]},busy:false,onlineSession:null,onlineRoom:null,onlineConnected:true,onlinePending:null,controls,$:s=>s==='#actionButtons'?{querySelectorAll:()=>controls.choices}:controls[s.slice(1)]});
 vm.runInContext('function current(){return state.players[state.turn]}\n'+source.slice(source.indexOf('function dockSource(){'),source.indexOf('function refreshDeviceControls(){')),ctx);
 let count=0;function test(name,code){assert.equal(vm.runInContext('{'+code+'}',ctx),true,name);count++;console.log('PASS '+name)}
 test('Normal turn mirrors the real roll button',`dockSource().button===controls.roll&&dockSource().secondaryLabel==='棋盘'`);
 test('Purchase exposes buy and skip instead of a scroll shortcut',`state.phase='buy';controls.choices=[{textContent:'购买',disabled:false},{textContent:'放弃',disabled:false}];const s=dockSource();s.button===controls.choices[0]&&s.secondaryButton===controls.choices[1]`);
 test('Debt management takes priority over ending the turn',`state.phase='end';current().cash=-100;controls.end.hidden=false;controls.choices=[{textContent:'管理资产',disabled:false},{textContent:'宣布破产',disabled:false}];dockSource().button===controls.choices[0]`);
 test('AI and movement cannot dispatch a mirrored action',`current().cash=15000;current().ai=true;const a=!dockSource().button;current().ai=false;busy=true;const b=!dockSource().button;busy=false;a&&b`);
 test('Opponent turn disables primary instead of duplicating asset buttons',`onlineSession={};onlineRoom={me:1};state.phase='buy';state.turn=0;const s=dockSource();!s.button&&s.label==='等待 You'`);
 test('Auction follows bidder rather than original turn owner',`state.phase='auction';state.auction={bidder:1};controls.choices=[{textContent:'出价',disabled:false},{textContent:'退出',disabled:false}];dockSource().button===controls.choices[0]&&dockSource().secondaryButton===controls.choices[1]`);
 test('Trade follows the seller who must answer',`state.phase='trade';state.offer={seller:1};controls.choices=[{textContent:'接受',disabled:false},{textContent:'拒绝',disabled:false}];dockSource().secondaryButton===controls.choices[1]`);
 test('Pending and disconnected rooms block primary commands',`onlinePending={};const a=!dockSource().button;onlinePending=null;onlineConnected=false;a&&!dockSource().button`);
 console.log(count+' interface checks passed');return count;
};
if(require.main===module)module.exports();
