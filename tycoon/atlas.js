'use strict';
// Each map uses the same balanced 32-space route. Antarctica is an expedition
// scenario: stations are fictional investment spaces, not land ownership claims.
const MAPS = [
 {id:'world',name:'世界环游',en:'WORLD',icon:'◎',color:'#173f36',desc:'从亚洲启程，穿越六大洲的城市与海港。',names:'曼谷,首尔,东京,新加坡,香港,开罗,开普敦,马拉喀什,伊斯坦布尔,罗马,巴黎,伦敦,阿姆斯特丹,纽约,多伦多,墨西哥城,里约热内卢,布宜诺斯艾利斯,悉尼,奥克兰',stations:['国际航空港','跨洋枢纽'],groups:['东亚门户','亚洲都会','非洲之旅','欧洲经典','大西洋岸','北美城市','南美风情','大洋洲航线']},
 {id:'asia',name:'亚洲漫游',en:'ASIA',icon:'◈',color:'#a55e38',desc:'古老商路与未来都市，连接亚洲的活力。',names:'河内,曼谷,吉隆坡,雅加达,马尼拉,加德满都,新德里,孟买,科伦坡,迪拜,多哈,利雅得,马斯喀特,北京,上海,首尔,釜山,大阪,东京,香港',stations:['丝路车站','亚洲航空港'],groups:['东南亚街区','海岛都会','南亚商路','海湾城市','东亚都市','韩国之旅','日本之旅','国际都会']},
 {id:'europe',name:'欧洲巡礼',en:'EUROPE',icon:'♜',color:'#625a8d',desc:'从地中海到北欧，经营你的欧洲城市网络。',names:'里斯本,波尔图,马德里,巴塞罗那,塞维利亚,雅典,罗马,米兰,威尼斯,维也纳,布拉格,布达佩斯,华沙,柏林,慕尼黑,巴黎,里昂,阿姆斯特丹,伦敦,斯德哥尔摩',stations:['欧洲之星','北欧枢纽'],groups:['伊比利亚','西班牙之旅','地中海','中欧古城','德国都会','法国之旅','运河城市','北境航线']},
 {id:'africa',name:'非洲探索',en:'AFRICA',icon:'☀',color:'#9b7431',desc:'海岸、绿洲与高原，发现非洲城市的多样性。',names:'卡萨布兰卡,拉巴特,马拉喀什,突尼斯,阿尔及尔,开罗,亚历山大,达喀尔,阿克拉,拉各斯,阿比让,雅温得,利伯维尔,内罗毕,亚的斯亚贝巴,基加利,达累斯萨拉姆,马普托,约翰内斯堡,开普敦',stations:['泛非航空港','海岸联运站'],groups:['摩洛哥街区','北非海岸','尼罗河畔','西非都会','中非之旅','东非高原','印度洋岸','南非都市']},
 {id:'north-america',name:'北美之旅',en:'N. AMERICA',icon:'▤',color:'#3d6e8c',desc:'横跨加拿大、美国、墨西哥与加勒比海。',names:'温哥华,维多利亚,西雅图,波特兰,旧金山,洛杉矶,圣迭戈,墨西哥城,瓜达拉哈拉,哈瓦那,圣多明各,巴拿马城,圣何塞,多伦多,蒙特利尔,芝加哥,波士顿,华盛顿,迈阿密,纽约',stations:['太平洋车站','大西洋航空港'],groups:['西北海岸','加州海岸','墨西哥风情','加勒比海','中美洲','加拿大都会','美国名城','东部都会']},
 {id:'south-america',name:'南美冒险',en:'S. AMERICA',icon:'▲',color:'#417b65',desc:'安第斯山脉到大西洋海岸的城市旅途。',names:'基多,瓜亚基尔,利马,库斯科,拉巴斯,波哥大,麦德林,加拉加斯,马拉开波,圣地亚哥,瓦尔帕莱索,门多萨,科尔多瓦,布宜诺斯艾利斯,蒙得维的亚,里约热内卢,萨尔瓦多,巴西利亚,贝洛奥里藏特,圣保罗',stations:['安第斯车站','南大西洋港'],groups:['赤道之旅','安第斯高地','哥伦比亚','北部海岸','南锥之旅','拉普拉塔河','巴西海岸','巴西都会']},
 {id:'oceania',name:'大洋洲假日',en:'OCEANIA',icon:'≈',color:'#2f8190',desc:'澳大利亚、新西兰与太平洋岛国的蓝色旅程。',names:'达尔文,凯恩斯,布里斯班,黄金海岸,纽卡斯尔,珀斯,阿德莱德,霍巴特,朗塞斯顿,堪培拉,悉尼,墨尔本,吉朗,奥克兰,惠灵顿,基督城,皇后镇,苏瓦,阿皮亚,努库阿洛法',stations:['南十字车站','太平洋航空港'],groups:['热带北岸','昆士兰','西澳南澳','塔斯马尼亚','澳洲都会','新西兰北岛','新西兰南岛','太平洋群岛']},
 {id:'antarctica',name:'南极科考',en:'ANTARCTICA',icon:'❄',color:'#537e95',desc:'架空科考经营：建设观测网络，探索冰雪大陆。',names:'冰湾营地,企鹅观测点,极光营地,蓝冰营地,雪原补给点,海冰观测点,冰架营地,南风观测点,极昼营地,冰穹营地,陨石观测点,极夜营地,深冰实验室,雪岭营地,冰川观测点,海洋实验室,风暴观测点,冰芯档案馆,天文观测点,极点科考中心',stations:['破冰船码头','极地航空站'],groups:['冰湾网络','雪原网络','海冰网络','极昼网络','冰穹网络','雪岭网络','海洋网络','极点网络']}
];
let activeMap=MAPS[0];
function activateMap(id){
 activeMap=MAPS.find(m=>m.id===id)||MAPS[0];
 if(id==='legacy'){activeMap={id:'legacy',name:'城市经典',en:'CITY',icon:'▥',color:'#173f36',desc:'原版中国城市地图',groups:['江南街巷','武林湖滨','钱江滨江','科技西溪','浦江风景','上海街区','成都街区','金融都会']};tiles=raw.map((r,i)=>({i,name:r[0],type:typeof r[1]==='number'?'property':r[1],group:typeof r[1]==='number'?r[1]:null,price:typeof r[2]==='number'?r[2]:0,symbol:typeof r[2]==='string'?r[2]:null}));return;}
 let n=0,s=0;const names=activeMap.names.split(',');
 tiles=raw.map((r,i)=>({i,name:typeof r[1]==='number'?names[n++]:r[1]==='station'?activeMap.stations[s++]:r[0],type:typeof r[1]==='number'?'property':r[1],group:typeof r[1]==='number'?r[1]:null,price:typeof r[2]==='number'?r[2]:0,symbol:typeof r[2]==='string'?r[2]:null}));
}
