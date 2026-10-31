'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
module.exports=function(){
 const source=fs.readFileSync(path.join(__dirname,'tycoon/pawn-ui.js'),'utf8');
 const ctx=vm.createContext({});vm.runInContext(source.slice(0,source.indexOf('const pawnLocator=')),ctx);
 let count=0;function check(code,label){assert.ok(vm.runInContext(code,ctx),label);count++;console.log('PASS '+label)}
 vm.runInContext(`var g={mode:'ai',turn:2,players:[0,1,2,3].map(id=>({id,pos:0,out:false,name:'P'+id}))};var before=JSON.stringify(g);`,ctx);
 check('pawnIdentity(g,null,false).number===1','AI turns keep the human identity');
 check('pawnIdentity(g,{game:true,me:3},true).number===4','Remote identity uses own seat rather than acting player');
 check('pawnIdentity(g,{game:true,me:0},true).number===1','Remote seat zero remains valid');
 check('pawnIdentity(g,{game:null,me:2},true)===null','Lobby does not mislabel the offline piece');
 check('pawnIdentity(g,null,true)===null','Reconnecting without state does not guess a seat');
 check('pawnIdentity(g,{game:true,me:99},true)===null','Invalid seat safely has no identity');
 check(`g.mode='local';pawnIdentity(g,null,false).number===3`,'Hotseat follows the current player');
 check(`g.turn=3;pawnIdentity(g,null,false).number===4`,'Hotseat handoff updates the identity');
 check(`g.players[3].out=true;!pawnIdentity(g,null,false).available`,'Bankrupt pieces cannot be located');
 check(`g.players[3].out=false;g.players[3].pos=31;pawnIdentity(g,null,false).position===31`,'Location follows the latest board position');
 check(`g.mode='ai';g.turn=2;g.players[3].pos=0;JSON.stringify(g)===before`,'Identity reads do not change game progress');
 const loc=fs.readFileSync(path.join(__dirname,'tycoon/locales.js'),'utf8');vm.runInContext(loc,ctx);
 check(`englishText('定位我的棋子 1')==='Locate my piece 1'`,'Locator supports English without changing the number');
 console.log(count+' pawn checks passed');return count;
};
if(require.main===module)module.exports();
