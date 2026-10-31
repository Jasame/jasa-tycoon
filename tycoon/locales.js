'use strict';
// Presentation preferences are separate from saved games and room state.
const UI_PREFS_KEY='world-tycoon-display-v1';
function normalizeUIPreferences(value={}){if(!value||typeof value!=='object')value={};return {language:value.language==='en'?'en':'zh',theme:['jade','midnight','ivory'].includes(value.theme)?value.theme:'jade',layout:value.layout==='focus'?'focus':'standard'}}
let uiPreferences=normalizeUIPreferences();
try{uiPreferences=normalizeUIPreferences(JSON.parse(localStorage.getItem(UI_PREFS_KEY)||'{}'))}catch(e){}
const EN_TEXT=Object.fromEntries(`
环球大富翁|World Tycoon
世界与七大洲|World & seven continents
世界环游|World Tour
亚洲漫游|Asia
欧洲巡礼|Europe
非洲探索|Africa
北美之旅|North America
南美冒险|South America
大洋洲假日|Oceania
南极科考|Antarctica
城市经典|Classic Cities
外观与语言|Appearance & language
语言|Language
界面风格|Appearance
翡翠|Jade
午夜|Midnight
暖白|Ivory
布局|Layout
标准布局|Standard
专注布局|Focus
保留棋盘、资产与当前操作，收起次要动态。|Keep the board, assets and current decision; hide secondary activity.
即时预览，自动记住你的选择。|Preview instantly. Your preferences are saved automatically.
拍卖免打扰|Quiet auctions
略过 AI 回合拍卖|Skip auctions on AI turns
仅限 AI 对战；不会自动花钱。你的回合仍可参与拍卖。|AI games only. Never spends money automatically. Auctions on your own turn remain available.
偏好保存失败，本次选择仍然有效。|Preferences could not be saved; your selection still applies this session.
保存偏好|Save preferences
已保存显示偏好|Display preferences saved
新的一局|New game
游戏规则|Rules
城市合伙人手册|Game rules
新手引导|Guide
存档中心|Saves
我的资产|My assets
管理资产|Assets
管理我的地产|Manage properties
管理所有资产|All assets
查看我的资产|My assets
菜单|Menu
更多功能|More
收起功能|Less
收起|Less
旅程与世界|Journey & world
旅程任务与城市地标|Missions & landmarks
旅程、世界新闻与地图规则|Missions, news and map rules
旅程记录|Journal
旅程|Journey
地产交易中心|Property trading
地产交易|Trade
实时资产榜|Asset ranking
资产榜|Ranking
最近动态|Activity
城市动态|City activity
最近 50 条城市动态|Latest 50 events
联机进度已由服务器保存|Online progress saved on server
进度已自动保存|Progress saved
自动存档已开启|Auto-save enabled
本次进度未能保存|Progress could not be saved
音效已关闭|Sound off
音效已开启|Sound on
音效 · 关闭|Sound · off
音效 · 开启|Sound · on
开启音效|Enable sound
关闭音效|Disable sound
切换音效|Toggle sound
动效 · 标准|Motion · full
动效 · 精简|Motion · reduced
标准动效已开启|Full motion enabled
已切换为精简动效|Reduced motion enabled
AI 收购 · 开启|AI offers · on
AI 收购 · 关闭|AI offers · off
收购 · 开启|offers · on
收购 · 关闭|offers · off
已开启 AI 邀约：至少间隔 6 回合，拒绝的地产不再报价。|AI offers enabled: at least 6 rounds apart. Rejected properties will not be requested again.
AI 不再主动收购你的地产。你仍可主动发起交易。|AI will not ask to buy your land. You can still initiate trades.
已关闭 AI 主动收购，未处理的收购邀约已取消。|AI offers are off. Pending AI offers were cancelled without a sale.
体验更新：现有进度已支持到站升级；AI 主动收购默认关闭，可在菜单开启。|Your existing game now supports arrival upgrades. AI offers are off by default; enable them in the menu.
暂无出价|No bids yet
公开拍卖进行中|Auction in progress
地产拍卖进行中|Property auction in progress
公开拍卖|Auction
出价。当前|to bid. Current bid
竞价。当前报价|to bid. Current bid
退出后本次不能再竞价。|Passing is final for this auction.
退出竞价|Pass
当前报价|Current bid
领先者|Leader
进入公开拍卖，每次加价|enters an auction. Bid increment:
无人出价，继续由银行持有。|received no bids and remains with the bank.
现金不足，请退出竞价。|Not enough cash. Please pass.
拍下|won at auction:
出价|Bid
报价|offer
轮到你了|your turn
轮到|Waiting for
等待卖方答复|Waiting for the seller
等待交易答复|Trade response
正在竞价|Bidding now
当前回合|Current turn
当前预估|Current estimate
移动中…|Moving…
确认操作中…|Confirming…
操作确认中|Confirming action
正在确认操作|Confirming action
请等待同步完成。|Please wait for synchronization.
AI 行动中…|AI is playing…
行动中…|is playing…
正在行动|Playing
正在思考…|Thinking…
正在规划下一步|is planning a move
正在掷骰、考察街区和管理资产。稍等片刻，机遇即将来到你手中。|is rolling, exploring and managing property. Your turn is coming soon.
等待回合|Waiting for turn
等待操作|Waiting for action
结束回合|End turn
掷骰出狱|Roll for release
尝试掷双数出狱|Roll doubles to leave jail
掷骰子|Roll dice
掷出了|rolled
掷出双数，免费出狱。|rolled doubles and left jail for free.
已休息两轮，支付|served two rounds and paid
保释金出狱。|bail to leave jail.
在监狱休息一下|In jail
掷出双数即可免费出狱。最多尝试两轮，之后支付|Roll doubles to leave for free. After two attempts, pay
出狱。|to leave jail.
出狱|bail
监狱中|In jail
探访区。普通路过无需停留；服刑玩家最多在此休息两轮。|Visiting is free. Jailed players stay for at most two rounds.
立即前往探监区，不领取经过起点奖励。|Go directly to jail without collecting the start reward.
被送往监狱，最多休息两轮。|was sent to jail for up to two rounds.
起点|Start
前往监狱|Go to jail
探监|Visit
免费停车|Free parking
创业补给|Startup aid
创业机遇|Opportunity
机遇|Chance
资产审计|Asset audit
市政税|City tax
城市税|City tax
交通网络|Transit network
按资产计费|Asset-based charge
休息一下|Take a break
好运来袭|Opportunity awaits
已抵押|Mortgaged
处地产|properties
位合伙人|players
城市合伙人|Players
合伙人人数|Players
合伙人|player
本地玩家|Local player
玩家|Player
你|You
小林|Lin
阿橘|Citrus
老钱|Qian
AI 对战|AI game
对战|game
本地轮流|Local turns
同屏轮流|Pass & play
本地多人|Local multiplayer
经典模式|Classic
多人对局|Multiplayer game
本局已结束|Game finished
本局结束|Finished
赢得本局|wins
城市大亨 · 本局结算|Final ranking
城市大亨|City Tycoon
投资期结束，按总资产评选本局城市大亨。|The investment period is over. Highest net worth wins.
每一步投资，都成为了城市的一部分。|Every investment helped shape the city.
每一步选择，都成为了你的世界。|Every decision helped build your world.
查看排行榜|View ranking
再来一局|Play again
开启新的城市故事|Start another game
已破产|Bankrupt
资金周转遇到困难|Cash shortfall
还需筹集|Still needed:
可出售建筑、抵押地产，或宣布破产。|Sell buildings, mortgage property, or declare bankruptcy.
管理资产 · 筹集现金|Raise cash
宣布破产|Declare bankruptcy
确认宣布破产|Confirm bankruptcy
确认退出本局？|Declare bankruptcy?
确认宣布破产？|Declare bankruptcy?
宣布破产后，你的地产将归还银行。其他合伙人继续比赛，此操作不可撤销。|Your properties return to the bank and the other players continue. Bankruptcy cannot be undone.
你的地产将归还银行，你可继续观看朋友的对局。|Your properties return to the bank. You can keep watching.
资金耗尽，宣布破产。|ran out of funds and declared bankruptcy.
新街区，等你入主|A new investment
买下地产|Buy property
买下了|bought
暂不购买|Auction instead
售价|Price
购入价格|Purchase price
基础租金|Base rent
当前租金|Current rent
升级后租金|Rent after upgrade
抵押可得|Mortgage value
每级建造费|Cost per level
双站租金|Rent with two hubs
这处地产正在等待新的主人。|This property is available to buy.
业主：|Owner:
经营自己的|Your property:
可升至|Upgrade to level
升级房屋|Upgrade
暂不升级 · 结束回合|Skip & end turn
升级|Upgrade
本次到访已处理，下次回来可再升级|This visit is complete. Return again to upgrade.
再次停在这处自有房产后可升级|Land here again to upgrade.
再次停在自有房产，每次可付费升级一级，最高四级。|Land on your own property to buy one upgrade per visit, up to level 4.
再次停在自有未抵押房产可付费升一级，无需同色，每次到访限一次。|Land on your own unmortgaged property to buy one upgrade per visit. No color set is required.
再次停在已拥有的未抵押房产，可付费升一级；每次到访限一次，最高四级。|Land on an owned, unmortgaged property to buy one level per visit, up to level 4.
到站可付费升一级，无需同色组合。|Buy one level when you return; no color set required.
请等待你的回合；再次停在这处房产后可升级。|Wait for your turn and land here again to upgrade.
轮到你时可操作资产。|Manage assets on your turn.
轮到你行动，可管理地产。|Your turn: asset management is available.
等待你的回合后可管理地产。|Manage property when your turn begins.
请等待你的回合。|Please wait for your turn.
请等待你的回合|Please wait for your turn
请等待移动完成。|Please wait until movement finishes.
请等待棋子移动完成。|Please wait until movement finishes.
请等待棋子移动完成|Please wait until movement finishes
交通枢纽不能建房|Transit hubs cannot be upgraded.
仅业主可升级|Only the owner can upgrade.
请先赎回本地产|Redeem this property first.
已达最高 4 级|Maximum level 4 reached.
现金不足，还差|Not enough cash. Short by
现金不足，可以先抵押其他地产。|Not enough cash. You can mortgage other properties first.
现金不足，无法赎回。|Not enough cash to redeem.
现金不足以赎回|Not enough cash to redeem
请先出售本地产建筑|Sell this property's buildings first.
请先出售同色组全部建筑|Sell all buildings in the color set first.
抵押前请先出售本地产建筑（整组建设的旧局需清空同组）。|Sell this property's buildings before mortgaging it.
请先出售同色街区中等级最高的建筑。|Sell the highest building in the color set first.
请先升级同组等级较低的房产|Upgrade the lowest-level property in the color set first.
请先赎回持有的同色地产|Redeem your mortgaged properties in this color set first.
需集齐同色整组地产|Own the complete color set first.
升至 2 级需持有至少两块同色地产|Level 2 requires two properties in the same color.
升至 3–4 级需集齐同色整组地产|Levels 3–4 require the full color set.
出售|Sell
售楼|Sell level
赎回|Redeem
抵押|Mortgage
一层建筑。|one building level.
建筑筹集现金。|buildings to raise cash.
还没有地产。掷出骰子，买下你的第一处街区。|No property yet. Roll the dice to find your first investment.
还没有地产。|No property yet.
抵押的地产不收租。|Mortgaged property earns no rent.
可升级；本次费用|Upgrade available. Cost:
每次到访限一次|One upgrade per visit
单块可建 1 级；同色两块可建 2 级；集齐整组可均衡建至 4 级。|A single property supports level 1; two of a color support level 2; a full set supports balanced levels up to 4.
单块可建 1 级；同色两块解锁 2 级；集齐整组可均衡建至 4 级。升级有收益，也有维护成本。|One property unlocks level 1, two unlock level 2, and a full set unlocks balanced levels 3–4. Buildings also incur upkeep.
集齐同色街区后可均衡建造；抵押的地产不收租。|A complete color set allows balanced development. Mortgaged property earns no rent.
集齐同色地产后，空地租金翻倍。建筑 1–4 级租金分别为基础租金的 3 / 6 / 10 / 16 倍。|Unbuilt complete sets earn double rent. Building levels 1–4 multiply base rent by 3 / 6 / 10 / 16.
一座枢纽基础租金|One hub base rent:
持有一座车站租金|Rent with one station:
两座|two hubs:
受成熟系数与地图影响。|before maturity and map modifiers.
总资产|Net worth
现金|Cash
租金|Rent
建筑|building
级建筑|building levels
级|level
轮到你了，城市合伙人|Your turn, partner
好运，从这里出发|Your next move
这一站，收获如何？|Ready for the next turn?
再次停在自有房产可升级。升级越多|Return to your property to upgrade. More development means more
单块即可开发 1 级。升级越多|A single property can reach level 1. More development means more
租金与维护风险越高；请预留现金。|rent and upkeep risk. Keep a cash reserve.
你可以在结束回合前管理地产。集齐同色街区，即可升级建筑、提高租金。|Manage property before ending your turn. Complete color sets unlock construction.
掷出两枚骰子，经过起点领取|Roll two dice. Passing Start pays
经过起点，获得|passed Start and collected
到达了待售地产|landed on available property:
来到|arrived at
回到|returned to
获得本次到访的升级机会。|can buy one upgrade on this visit.
向|paid
缴纳|paid
支付|paid
获得|received
需要|Need
至|to
的资产|assets
管理|Manage
下次维护费预估|Next upkeep estimate:
回合维护费预估|upkeep estimate:
详情见管理资产|Details in Assets
维护 R|Upkeep R
回合）。|).
创业订单到账，获得|Startup order paid:
城市扶持订单，获得|City support order:
逆风玩家订单额外奖励）。|including a catch-up bonus).
突发建筑检修：基础|Emergency repairs: base fee
每级建筑|per building level
共支出|total cost
资产风险审查，支付|Asset risk audit cost:
资产与建筑越多，风险支出越高。|More assets and buildings mean greater exposure.
搭上创业快线，领取|Startup express pays
街区快闪活动，获得|Pop-up event earned
交通延误，进入探监区，最多停留一轮。|Transit delay: go to jail for at most one round.
小企业创新奖，获得|Small-business innovation award:
持有不足四处地产奖励更高。|Fewer than four properties earns a larger reward.
创业项目获奖，获得|Startup award:
房屋维护，支出|Property maintenance cost:
投资分红，获得|Investment dividend:
建筑检修，支出|Building repair cost:
搭上城市快线，回到起点并领取|City express: return to Start and collect
交通违规，被送往监狱。|Traffic violation: go to jail.
发现街角宝藏，获得|Street treasure found:
抽到机遇：|drew a card:
享受城市休闲补贴|received a city leisure grant
起点奖励。|Start reward.
经过或到达起点，领取|Pass or land on Start to collect
发展金。|development grant.
到达这里需缴纳|Landing here costs
随机抽取一张机遇卡，可能获得奖励、支付费用或前往其他位置。|Draw a random card for a reward, cost or movement effect.
放松一下，获得|Take a break and receive
休闲补贴。|leisure grant.
创业补给：持有不足 3 处地产可得|Startup aid: with fewer than 3 properties, receive
否则|otherwise
大洋洲额外|Oceania bonus:
按超出|Based on the amount above
的总资产 6% 加每级建筑|in net worth: 6%, plus per building level
计费，至少|with a minimum of
获得一次性逆风创业援助|received one-time catch-up aid:
每人全局限一次，不保证免于破产。|Once per player per game; bankruptcy remains possible.
支付资产维护费|paid upkeep:
建筑每级|per building level
超过|above
的地价总额 2%，向上取整至百元）。|in total land prices: 2%, rounded up to hundreds).
世界新闻|World news
市场更新|Market update
环球旅游季开幕|Tourism season
跨城旅行需求走高，所有地产与枢纽租金|Travel demand rises. All property and hub rents
城市博览会巡展|City expo tour
商圈迎来更多访客，所有地产与枢纽租金|More visitors. All property and hub rents
世界进入平稳经营期|Steady business
投资回归日常，所有地产与枢纽租金恢复|Business returns to normal. All property and hub rents
全球交通维护周|Transit maintenance week
客流暂时回落，所有地产与枢纽租金|Visitor traffic slows. All property and hub rents
全球招商大会举行|Global investment summit
商旅活动集中爆发，所有地产与枢纽租金|Business travel surges. All property and hub rents
平稳市场|Steady market
旅游旺季|Tourist season
城市复苏|City recovery
淡季调整|Low season
投资热潮|Investment boom
全球市场：|Global market:
所有地产租金|All property rents
持续到下一次市场更新。|until the next market update.
下期预告 · 第|Next update · round
回合预告：|preview:
持续至第|until round
回合市场更新。|market update.
城市发现家|City explorer
亲自到访 4 座不同地产城市|Visit 4 different property spaces
同时持有 5 处地产或交通枢纽|Own 5 properties or transit hubs at once
天际线建筑师|Skyline builder
累计完成 3 次建筑升级|Complete 3 building upgrades
机遇收藏家|Opportunity collector
亲自抽取 2 次机遇卡|Draw 2 chance cards
交通探险家|Transit explorer
亲自到访 2 座不同交通枢纽|Visit 2 different transit hubs
已完成|Completed
已到账|Paid
完成奖励|Reward
你的城市地标|Your landmarks
同色街区全部升级至 2 级，自动落成专属地标。保持同组未抵押且至少 2 级，每次轮到你行动时获得|A landmark opens when every property in a color set reaches level 2. Keep the set unmortgaged and at level 2+ to earn, each turn:
售楼或抵押后收入暂停，恢复条件后继续。|Income pauses when buildings are sold or land is mortgaged; restoring the conditions resumes it.
暂歇 · 保留落成荣誉|Paused · landmark retained
第一座地标，正等待你的街区成长。|Your first landmark awaits your growing neighborhood.
观光营业中：本组为业主每回合提供|Active landmark: this set earns its owner each round
保留落成荣誉；同组全部至少 2 级且未抵押后恢复观光收入。|Landmark retained. Income resumes when every property is unmortgaged and at level 2+.
观光营业|Tourism open
观光收入。|tourism income.
座地标的观光收入|landmarks earned tourism income:
建成地标「|opened landmark: 
完成旅程任务「|completed mission: 
保持同组建筑至少 2 级，每回合获得|Keep every building in the set at level 2+ to earn each round
的旅程任务|missions
项旅程任务|missions
项任务|missions
街区点亮，每一层建设都有了回响。|The neighborhood shines. Every floor made a difference.
已到账，下一座城市见。|paid. See you in the next city.
达成|Complete
已到访|Visited
完成|Completed
奖励|Reward
逆风援助：|Catch-up aid:
已领取|Claimed
符合条件时自动领取，全局一次|Automatic when eligible; once per game
当前为兼容对局，保持原有经营规则。|This game retains its original economy.
旅程任务、城市地标与新闻预告会在新的一局启用，当前对局保留原有规则。|Start a new game for missions, landmarks and news previews. This game retains its original economy.
环球护照|World passport
亲自到访 8 个颜色组的地产，领取一次|Visit properties in all 8 color groups for a one-time
环球奖励。|world-tour reward.
亚洲贸易网|Asian trade network
未抵押交通枢纽的租金提高 50%。|Unmortgaged transit hubs earn 50% more rent.
铁路通票|Rail pass
经过起点时，每持有一座未抵押交通枢纽，额外获得|Passing Start pays an extra amount for each unmortgaged hub:
生态经营|Eco enterprise
每次轮到你行动，每处未开发且未抵押的地产提供|Each turn, every undeveloped, unmortgaged property pays
生态补贴，最高|eco income, capped at
建设热潮|Construction boom
建筑造价降低 20%，按|Construction costs fall 20%, rounded up to
向上取整；售楼与资产估值使用实际造价。|. Resale and net worth use the actual cost.
冒险基金|Adventure fund
每次抽取机遇卡后，额外获得|Each chance card pays an extra
海岛假日|Island holiday
免费停车补贴提高至|Free parking reward increases to
停在自己的未抵押枢纽，获得|Land on your unmortgaged hub to receive
科研网络|Research network
每次轮到你行动，每级建筑提供|Each turn, every building level pays
科研拨款，最高|research income, capped at
原版规则，不附加地图经济效果。|Original rules without additional map economy effects.
经典经营|Classic economy
创业补给额外|Extra startup aid:
合计|total
停在自有未抵押枢纽获得|Landing on your unmortgaged hub pays
获得铁路通票奖励|received a rail-pass reward:
生态补贴|eco income
科研拨款|research income
集齐|collected
枚环球印章。|world passport stamps.
完成环球护照，获得|completed the world passport and earned
环球护照已集齐！|World passport complete!
额外获得|received an extra
海岛补贴，本次合计|island bonus, total
创业竞速：成熟系数|Startup race: maturity factor
兼容模式 · 保留本局原有经济规则；新局启用地图特色。|Original economy retained; new games enable map effects.
创业竞速|Startup race
新局生态补贴上限|New-game eco income cap:
新局科研拨款上限|New-game research income cap:
交易完成|Trade complete
交易条件已变化，请重新报价。|Trade conditions changed. Please submit a new offer.
请输入有效报价，且不能超过现金。|Enter a valid offer within your cash balance.
报价已失效|Offer expired
拒绝了收购邀约。|declined the purchase offer.
拒绝了报价。可以提高出价再试。|declined the offer. You may try a higher price.
接受报价|Accept
保留地产 · 拒绝|Keep property
拒绝报价|Decline
卖方接受交易|Seller accepts
接受后地产和现金立即转移。|Accepting transfers the property and payment immediately.
收购邀约 · 请交给|Purchase offer · ask
请交给|Ask
确认|to confirm
希望以|offers
收购你的|to buy your
收购|buy
原价|List price
由卖方决定，对局等待你的答复。|The seller decides; play waits for the response.
提出|made an offer of
收购报价。|to purchase this property.
向其他合伙人提出现金收购。交易接受未抵押且符合建筑资格的未开发地产。本地玩家需由卖方亲自确认。|Make a cash offer for eligible, undeveloped, unmortgaged property. The seller must confirm a local-player trade.
目前没有符合条件的地产。先探索棋盘，等其他合伙人持有地产后再来。|No eligible property yet. Explore the board and return after other players buy land.
选择收购地产|Choose property
出价（至少|Offer (minimum
提出收购|Make offer
收到地产收购邀约|Purchase offer received
是否接受？|Accept this offer?
正在考虑地产收购报价。|is considering the property offer.
向朋友提出收购|Make a purchase offer
选择未抵押、符合建筑资格的未开发的地产。卖方接受后由服务器结算；等待期间对局暂停至答复或超时。|Choose eligible undeveloped, unmortgaged land. The server settles an accepted offer. Play waits for a response or timeout.
收购地产|Property to buy
发送收购邀约|Send offer
目前没有可收购的地产。|No property is available for purchase.
选择地图|Choose map
更换地图 · 新局|Change map · new game
开始新对局|New game
下一座城市，等你开局。|Your next city awaits
你的名字|Your name
你的昵称|Nickname
游戏方式|Game mode
单人挑战 · 智能 AI 对手|Solo · AI opponents
本地多人 · 同屏轮流游玩|Local · pass & play
休闲 · 保守投资|Relaxed · cautious investing
标准 · 稳健经营|Standard · balanced investing
进阶 · 积极扩张|Expert · active expansion
移动速度|Movement speed
快速对局|Fast
悠闲漫游|Leisurely
游戏时长|Game length
长线经营 · 60 回合|Long game · 60 rounds
创业竞速 · 20 回合|Quick game · 20 rounds
策略经营 · 30 回合|Strategy game · 30 rounds
经典到底 · 直到只剩一位合伙人|Until one player remains
开始新局前会自动备份当前对局，也可先到存档中心手动保存。|Your current game is backed up before a new one starts. Manual saves are also available.
开启城市之旅|Start game
开始游戏|Start game
欢迎来到你的城市。祝你好运！|Welcome to your city. Good luck!
选择地图 · 9 张|Choose a map · 9 available
选择你的下一段旅程 · 8 张地图|Choose a journey · 8 maps
更多设置 · AI、速度与时长|More settings · AI, speed & length
新局 ¥10,000 起步 · 到站升级 · 当前进度自动备份。|Start with ¥10,000 · arrival upgrades · current game backed up.
一人对战 AI，或和朋友在同一台设备上轮流玩。新局包含 3 项旅程任务、城市地标与世界新闻预告。|Play against AI or share one device. New games include 3 missions, landmarks and news previews.
朋友到齐，就出发|Gather your friends
通过上方房间码邀请朋友，准备好后由房主开局。|Invite friends with the room code. The host starts after everyone is ready.
和朋友联机|Play online
联机|Online
房间详情|Room details
房间与重连|Room & reconnect
联机房间|Online room
邀请朋友，环球同行|Travel with friends
邀请朋友|Invite friends
复制邀请链接|Copy invite link
邀请链接已复制|Invite link copied
把以下链接发给朋友：|Share this link:
房间码：|Room code:
你的座位：|Your seat:
朋友的房间码|Friend's room code
位房间码|character room code
房间人数|Room capacity
对局回合|Rounds
竞速 · 20 回合|Quick · 20 rounds
经营 · 30 回合|Strategy · 30 rounds
最多 4 人|Up to 4 players
最多 3 人|Up to 3 players
直到最后一人|Until one player remains
创建房间|Create room
加入朋友的房间|Join friend's room
加入房间|Join room
选择联机方式|Choose online mode
恢复已保存的座位|Reconnect to saved seats
继续对局|Continue game
返回本地对局|Return to local game
返回本地对局？|Return to local game?
联机房间和座位会保留，可稍后重连；离线后超时操作仍由服务器托管。本地对局将从本地存档恢复。|Your online seat remains available for reconnecting. Timed actions continue while offline. Your local game will be restored.
本地手动存档与联机对局互相独立。|Local saves and online games are separate.
联机进度自动保存|Online progress saves automatically
本房间由服务器保存进度。刷新页面会恢复你的座位。可在“房间与重连”中返回已保存的房间。|The server saves this room. Refresh to reconnect to your seat, or use Room & reconnect.
朋友加入并准备后即可开始|Start after friends join and get ready.
等待开局|Waiting to start
等待房主开始…|Waiting for the host…
取消准备|Not ready
我已准备|Ready
开始联机对局|Start online game
已同步|Synced
正在重连服务器|Reconnecting
正在重连…|Reconnecting…
正在恢复连接|Restoring connection
正在恢复|Restoring
已进入联机房间|Joined online room
请使用 HTTPS 打开联机页面|Open the game over HTTPS for online play.
联机服务暂不可用|Online service is temporarily unavailable.
请求未成功|Request failed
操作结果待确认，正在重连。请勿重复操作。|Reconnecting to confirm the action. Please do not submit it again.
请稍候，确认最新对局状态后即可继续。|Please wait while the latest game state is confirmed.
你可以查看棋盘和自己的资产。服务器正在等待对方完成回合。|You can view the board and your assets while the other player finishes.
等待对局开始|Waiting for the game to start
分享房间码邀请朋友。至少两名玩家在线并准备后，由房主开始。最多|Share the code. The host can start when at least two players are online and ready. Capacity:
支持 2–4 人远程对局。创建房间分享邀请码，朋友加入并准备后即可开局。服务器统一结算，支持刷新重连。|Play online with 2–4 players. Share a room code, get ready, then let the host start. The server handles all actions; refreshing reconnects you.
人一起玩。选择创建房间，或输入朋友的房间码。|players. Create a room or enter a friend's code.
座位凭证保存在此浏览器，邀请链接只包含房间码。等待中的房间保留 24 小时，已开局进度在最后一次操作后保留 7 天。不同浏览器可通过邀请码加入。|Your seat credential stays in this browser; invite links contain only a room code. Waiting rooms last 24 hours; started rooms last 7 days after the last action. Friends join from another browser.
房间进度由服务器保存，刷新本页即可重连。|The server saves progress. Refresh to reconnect.
房间阶段超时为 180 秒。离开不会立刻移除已经开局的座位。|Each stage has a 180-second timeout. Leaving keeps your started-game seat.
骰子与资产由服务器结算。超时未操作将自动掷骰、放弃购买/竞价、拒绝交易或结束回合；离线席位保留，可随时重连。|The server rolls dice and settles assets. A timeout rolls, passes, declines a trade or ends a turn. Offline players can reconnect.
邀请朋友访问|Invite friends to
可返回本地对局后重新加入。|return to local play and join again.
本阶段剩余|Time left:
秒|seconds
已准备|Ready
未准备|Not ready
在线|Online
离线|Offline
对方|opponent
关闭|Close
恢复|Restore
上一局自动备份|Previous game backup
备份失败，请先导出当前存档。|Backup failed. Export your current game first.
手动存档已保存|Manual save stored
存档失败，浏览器存储空间可能不足。|Save failed. Browser storage may be full.
无法读取：|Could not read:
已恢复旅程，切换前的对局已备份。|Game restored. The previous game was backed up.
恢复这段旅程？|Restore this game?
导入存档|Import save
当前对局会保留为“上一局自动备份”，然后恢复所选进度。|Your current game becomes the previous-game backup before this save is restored.
备份当前对局并恢复|Back up & restore
返回存档中心|Back to saves
导出当前存档|Export current game
导入存档文件|Import save file
存档文件已导出|Save exported
导出失败：|Export failed:
导入失败：|Import failed:
当前：|Current:
回合。自动保存最近进度，另提供 5 个手动槽位。所有存档保存在此浏览器，可导出到文件备份。|round. The latest game is auto-saved, with 5 manual slots. Saves stay in this browser and can be exported.
槽位|Slot
空槽位|Empty slot
覆盖保存|Overwrite
保存当前对局|Save current game
恢复上一局自动备份|Restore previous game
新开一局或恢复存档前，会更新上一局备份。清除浏览器网站数据会删除本地存档。|Starting or restoring a game updates the previous-game backup. Clearing site data deletes local saves.
覆盖槽位|Overwrite slot
此操作仅替换这个手动槽位，当前对局不会改变。|Only this manual slot is replaced; the current game is unchanged.
确认覆盖保存|Confirm overwrite
返回|Back
文件过大，请选择有效的大富翁 JSON 存档。|The file is too large. Choose a valid game JSON save.
不是有效的大富翁存档|Not a valid game save
存档地图不受支持|Unsupported save map
经济规则数据无效|Invalid economy rules
玩家数据不完整|Incomplete player data
回合数据不完整|Incomplete turn data
地产数据不完整|Incomplete property data
同色地产建筑数据不一致|Inconsistent color-set buildings
骰子数据不完整|Incomplete dice data
市场数据不完整|Incomplete market data
建造规则无效|Invalid building rules
到访升级机会无效|Invalid arrival upgrade allowance
经济进度无效|Invalid economy progress
新规则建筑数据无效|Invalid building data
体验设置无效|Invalid experience settings
邀约冷却无效|Invalid offer cooldown
已抵押地产不能保留建筑|Mortgaged property cannot retain buildings
购买状态无效|Invalid purchase state
拍卖状态无效|Invalid auction state
交易邀约无效|Invalid trade offer
新闻与市场数据不一致|News and market data do not match
旅程任务数据无效|Invalid mission data
世界新闻数据无效|Invalid news data
旅程进度数据无效|Invalid journey progress
地标数据无效|Invalid landmark data
拍卖偏好无效|Invalid auction preference
欢迎成为城市合伙人|Welcome, city partner
掷骰，探索新的街区|Roll and explore
留现金，也要集齐颜色|Keep a cash reserve
交易与地图策略|Trading & map strategy
为每段旅程留一份存档|Save your journey
先选一张地图，再决定人数与 AI 风格。每张地图都有专属经营机制；旧存档保留旧规则。|Choose a map, player count and AI style. Each map has its own economy; existing games retain their economy values.
再次停在已拥有的房产，每次到访可付费升一级，最高四级；不需要集齐同色。路过或刚买下时不触发。|Land on an owned property to buy one level per visit, up to level 4. No color set is required. Passing or buying it does not count as returning.
默认 20 回合，快速移动；经过起点领取|The default is 20 rounds with fast movement. Passing Start pays
无主地产可购买或公开拍卖，每次加价|Buy available land or auction it with increments of
通过“地产交易”收购其他玩家的地产。AI 也会主动报价，收到邀约时由你接受或拒绝。地图特色显示在棋盘上方。|Use Trade to buy another player's property. AI offers are optional in the menu. View map effects in Journey.
新手引导|Guide
在游戏中寻找：|Look for:
开始探索|Start exploring
下一步|Next
上一步|Previous
保留最初的中国城市棋盘。|The original Chinese-city board.
原版中国城市地图|Original Chinese-city map
经典规则 · 兼容存档|Classic rules · existing save
环球竞速 · 低价门户与高价商圈交错|World race · affordable gateways and premium districts
贸易走廊 · 枢纽租金与中段建设|Trade corridor · transit income and development
古城复兴 · 廉价腹地与铁路回流|Historic revival · affordable land and rail income
绿洲创业 · 低价土地与生态现金流|Oasis enterprise · affordable land and eco income
建设竞赛 · 昂贵海岸与低价内陆|Construction race · premium coast and affordable inland cities
安第斯冒险 · 机遇与两端商圈|Andean adventure · chance cards and major districts
海岛经营 · 度假现金与高价都会|Island enterprise · holiday income and premium cities
科考网络 · 建设拨款与维护风险|Research network · building grants and upkeep risk
城市焕新 · 小街起步与金融风浪|City renewal · small streets and financial risk
从亚洲启程，穿越六大洲的城市与海港。|Travel from Asia through cities and ports around the world.
古老商路与未来都市，连接亚洲的活力。|Ancient trade routes connect Asia's future cities.
从地中海到北欧，经营你的欧洲城市网络。|Build a European network from the Mediterranean to the north.
海岸、绿洲与高原，发现非洲城市的多样性。|Explore Africa's coasts, oases and highland cities.
横跨加拿大、美国、墨西哥与加勒比海。|Travel across Canada, the US, Mexico and the Caribbean.
安第斯山脉到大西洋海岸的城市旅途。|A journey from the Andes to the Atlantic coast.
澳大利亚、新西兰与太平洋岛国的蓝色旅程。|Explore Australia, New Zealand and the Pacific islands.
架空科考经营：建设观测网络，探索冰雪大陆。|A fictional research enterprise on the ice continent.
游戏棋盘。放大后可左右滑动，点击地块查看完整名称和地价。|Game board. Zoom and scroll sideways; select a space for its full name and price.
点选地块，查看地价与租金|Select a space for price and rent
点击地块查看详情|Select a space for details
可左右滑动 · 点击地块查看详情|Scroll sideways · select a space
左右滑动 · 点选地块|Scroll sideways · select a space
放大棋盘|Zoom board
返回全景|Full board
手机快捷操作|Game actions
查看操作|View actions
棋盘|Board
无需注册 · 随时回来继续|No account needed · return anytime
同行启程|Journey together
朋友已就位，让世界见证你的下一步。|Your friends are ready. Make your next move.
新一轮机遇|A new round of opportunity
机遇已抵达|Opportunity arrives
好运正在路上|Opportunity is on its way
旅程启航|Journey begins
掷出第一步，写下你的城市故事。|Roll your first move and build your story.
可升级|Upgrade available
城市天际线 · 满级落成|Skyline complete · maximum level
楼层升起 · 租金提升|New floor · higher rent
城市投资计划|City investment plan
让好运，落在你的城市。|Let opportunity find your city.
房间|Room
地图|Map
回合|round
等待|Waiting for
行动|move
进阶|Expert
休闲|Relaxed
标准|Standard
风格|style
人|players
从|from
以|for
和|and
最高|maximum
首次|first
起步|starting cash
起点奖励|Start reward
部分|portion
至少|at least
每人|Each player
每回合|Each turn
本次|This visit
当前|Current
保留|retain
全局一次|once per game
无主地产|available property
倍|times
至第|until round
第|Round
的| 
已| 
到|to
在|at
与|and
后|after
前|before
可|can
每|per
次|time
于|at
将|will
为|as
并|and
来|return
请|Please
地价|land price
地产|property
游戏|game
经济|economy
规则|rules
城市|city
发展|development
资金|funds
结算|settlement
完成|complete
信息|information
数据|data
无效|invalid
不足|insufficient
无法|cannot
失败|failed
成功|successful
另|extra
提供|provides
全|all
新|new
旧|previous
不|not
无|no
是|is
可|can
有|has
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)]}));
const CITY_ZH=`曼谷,首尔,东京,新加坡,香港,开罗,开普敦,马拉喀什,伊斯坦布尔,罗马,巴黎,伦敦,阿姆斯特丹,纽约,多伦多,墨西哥城,里约热内卢,布宜诺斯艾利斯,悉尼,奥克兰,河内,吉隆坡,雅加达,马尼拉,加德满都,新德里,孟买,科伦坡,迪拜,多哈,利雅得,马斯喀特,北京,上海,釜山,大阪,里斯本,波尔图,马德里,巴塞罗那,塞维利亚,雅典,米兰,威尼斯,维也纳,布拉格,布达佩斯,华沙,柏林,慕尼黑,里昂,斯德哥尔摩,卡萨布兰卡,拉巴特,突尼斯,阿尔及尔,亚历山大,达喀尔,阿克拉,拉各斯,阿比让,雅温得,利伯维尔,内罗毕,亚的斯亚贝巴,基加利,达累斯萨拉姆,马普托,约翰内斯堡,温哥华,维多利亚,西雅图,波特兰,旧金山,洛杉矶,圣迭戈,瓜达拉哈拉,哈瓦那,圣多明各,巴拿马城,圣何塞,蒙特利尔,芝加哥,波士顿,华盛顿,迈阿密,基多,瓜亚基尔,利马,库斯科,拉巴斯,波哥大,麦德林,加拉加斯,马拉开波,圣地亚哥,瓦尔帕莱索,门多萨,科尔多瓦,蒙得维的亚,萨尔瓦多,巴西利亚,贝洛奥里藏特,圣保罗,达尔文,凯恩斯,布里斯班,黄金海岸,纽卡斯尔,珀斯,阿德莱德,霍巴特,朗塞斯顿,堪培拉,墨尔本,吉朗,惠灵顿,基督城,皇后镇,苏瓦,阿皮亚,努库阿洛法`;
const CITY_EN=`Bangkok,Seoul,Tokyo,Singapore,Hong Kong,Cairo,Cape Town,Marrakesh,Istanbul,Rome,Paris,London,Amsterdam,New York,Toronto,Mexico City,Rio de Janeiro,Buenos Aires,Sydney,Auckland,Hanoi,Kuala Lumpur,Jakarta,Manila,Kathmandu,New Delhi,Mumbai,Colombo,Dubai,Doha,Riyadh,Muscat,Beijing,Shanghai,Busan,Osaka,Lisbon,Porto,Madrid,Barcelona,Seville,Athens,Milan,Venice,Vienna,Prague,Budapest,Warsaw,Berlin,Munich,Lyon,Stockholm,Casablanca,Rabat,Tunis,Algiers,Alexandria,Dakar,Accra,Lagos,Abidjan,Yaounde,Libreville,Nairobi,Addis Ababa,Kigali,Dar es Salaam,Maputo,Johannesburg,Vancouver,Victoria,Seattle,Portland,San Francisco,Los Angeles,San Diego,Guadalajara,Havana,Santo Domingo,Panama City,San Jose,Montreal,Chicago,Boston,Washington,Miami,Quito,Guayaquil,Lima,Cusco,La Paz,Bogota,Medellin,Caracas,Maracaibo,Santiago,Valparaiso,Mendoza,Cordoba,Montevideo,Salvador,Brasilia,Belo Horizonte,Sao Paulo,Darwin,Cairns,Brisbane,Gold Coast,Newcastle,Perth,Adelaide,Hobart,Launceston,Canberra,Melbourne,Geelong,Wellington,Christchurch,Queenstown,Suva,Apia,Nuku'alofa`;
CITY_ZH.split(',').forEach((name,i)=>EN_TEXT[name]=CITY_EN.split(',')[i]);
Object.assign(EN_TEXT,Object.fromEntries(`
国际航空港|International Airport
跨洋枢纽|Ocean Hub
丝路车站|Silk Road Station
亚洲航空港|Asia Airport
欧洲之星|Eurostar
北欧枢纽|Nordic Hub
泛非航空港|Pan-African Airport
海岸联运站|Coastal Interchange
太平洋车站|Pacific Station
大西洋航空港|Atlantic Airport
安第斯车站|Andes Station
南大西洋港|South Atlantic Port
南十字车站|Southern Cross Station
太平洋航空港|Pacific Airport
破冰船码头|Icebreaker Port
极地航空站|Polar Airport
冰湾营地|Ice Bay Camp
企鹅观测点|Penguin Observatory
极光营地|Aurora Camp
蓝冰营地|Blue Ice Camp
雪原补给点|Snowfield Supply
海冰观测点|Sea Ice Observatory
冰架营地|Ice Shelf Camp
南风观测点|South Wind Observatory
极昼营地|Midnight Sun Camp
冰穹营地|Ice Dome Camp
陨石观测点|Meteorite Observatory
极夜营地|Polar Night Camp
深冰实验室|Deep Ice Laboratory
雪岭营地|Snow Ridge Camp
冰川观测点|Glacier Observatory
海洋实验室|Ocean Laboratory
风暴观测点|Storm Observatory
冰芯档案馆|Ice Core Archive
天文观测点|Astronomy Observatory
极点科考中心|South Pole Research
晨光之塔|Dawn Tower
海风剧院|Sea Breeze Theater
绿洲花园|Oasis Garden
星空博物馆|Starlight Museum
金色穹顶|Golden Dome
云端观景台|Cloud Observatory
晚霞艺术馆|Sunset Gallery
极光研究馆|Aurora Institute
西湖小筑|West Lake Lodge
河坊街|Hefang Street
南宋御街|Imperial Street
城际车站|Intercity Station
武林广场|Wulin Square
湖滨银泰|Lakeside Center
钱江新城|Qianjiang New City
滨江大道|Riverside Avenue
未来科技城|Future Tech City
文三数码街|Wensan Tech Street
西溪湿地|Xixi Wetlands
陆家嘴|Lujiazui
南京西路|West Nanjing Road
虹桥车站|Hongqiao Station
外滩|The Bund
安福路|Anfu Road
新天地|Xintiandi
太古里|Taikoo Li
春熙路|Chunxi Road
金融街|Financial Street
中环|Central
维多利亚港|Victoria Harbour
东亚门户|East Asian Gateways
亚洲都会|Asian Metropolises
非洲之旅|African Journey
欧洲经典|European Classics
大西洋岸|Atlantic Coast
北美城市|North American Cities
南美风情|South American Spirit
大洋洲航线|Oceania Routes
东南亚街区|Southeast Asia
海岛都会|Island Cities
南亚商路|South Asian Trade
海湾城市|Gulf Cities
东亚都市|East Asian Cities
韩国之旅|Korea Route
日本之旅|Japan Route
国际都会|Global Cities
伊比利亚|Iberia
西班牙之旅|Spain Route
地中海|Mediterranean
中欧古城|Central European Towns
德国都会|German Cities
法国之旅|France Route
运河城市|Canal Cities
北境航线|Northern Route
摩洛哥街区|Moroccan Cities
北非海岸|North African Coast
尼罗河畔|Nile Cities
西非都会|West African Cities
中非之旅|Central Africa
东非高原|East African Highlands
印度洋岸|Indian Ocean Coast
南非都市|Southern African Cities
西北海岸|Northwest Coast
加州海岸|California Coast
墨西哥风情|Mexico Route
加勒比海|Caribbean
中美洲|Central America
加拿大都会|Canadian Cities
美国名城|US Cities
东部都会|Eastern Cities
赤道之旅|Equatorial Route
安第斯高地|Andean Highlands
哥伦比亚|Colombia
北部海岸|Northern Coast
南锥之旅|Southern Cone
拉普拉塔河|River Plate
巴西海岸|Brazilian Coast
巴西都会|Brazilian Cities
热带北岸|Tropical North
昆士兰|Queensland
西澳南澳|Western & South Australia
塔斯马尼亚|Tasmania
澳洲都会|Australian Cities
新西兰北岛|New Zealand North Island
新西兰南岛|New Zealand South Island
太平洋群岛|Pacific Islands
冰湾网络|Ice Bay Network
雪原网络|Snowfield Network
海冰网络|Sea Ice Network
极昼网络|Midnight Sun Network
冰穹网络|Ice Dome Network
雪岭网络|Snow Ridge Network
海洋网络|Ocean Network
极点网络|Polar Network
江南街巷|Jiangnan Streets
武林湖滨|Wulin Lakeside
钱江滨江|Qianjiang Riverside
科技西溪|Xixi Technology
浦江风景|Huangpu Views
上海街区|Shanghai District
成都街区|Chengdu District
金融都会|Financial Cities
非洲海岸|African Coast
欧洲古城|Historic Europe
跨洋商圈|Transatlantic Districts
北美门户|North American Gateways
大洋洲都会|Oceania Cities
东南亚商圈|Southeast Asian Districts
南亚门户|South Asian Gateways
南亚至海湾|South Asia to the Gulf
海湾腹地|Gulf Heartland
东亚都会|East Asian Metropolises
韩日航线|Korea–Japan Route
伊比利亚门户|Iberian Gateways
西班牙南岸|Southern Spain
地中海古城|Historic Mediterranean
意大利至中欧|Italy to Central Europe
中东欧街区|Central & Eastern Europe
法国双城|French Cities
西非商圈|West African Districts
中非街区|Central African Districts
南非都会|Southern African Metropolises
加州门户|California Gateways
南加州至墨西哥|Southern California to Mexico
加勒比航线|Caribbean Route
中美洲商圈|Central American Districts
美国北部|Northern US
美国东岸|Eastern US
太平洋门户|Pacific Gateways
哥伦比亚双城|Colombian Cities
北岸至南锥|Northern Coast to Southern Cone
南锥腹地|Southern Heartland
东澳海岸|Eastern Australia
塔岛至首都|Tasmania to Canberra
蓝冰补给|Blue Ice Supply
深冰网络|Deep Ice Network
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)]})));
Object.assign(EN_TEXT,Object.fromEntries(`
起步 · 再次到访自有房产可升级。当前进度会自动备份。|starting cash · upgrade when you return · current game backed up.
不再主动收购你的地产。你仍可主动发起交易。|will no longer ask to buy your land. You can still initiate trades.
城市开放营业。每位合伙人获得|The city is open. Each player receives
启动资金。|starting cash.
创业竞速开启：每人|Startup race begins. Each player receives
再次停在自有房产，每次可付费升级一级。第 8 回合起每 4 回合结算维护费。|Buy one upgrade when returning to your property. Upkeep is charged every 4 rounds from round 8.
城市休闲补贴|city leisure grant
抵押了|mortgaged
目标是在约定回合结束时拥有最多总资产，或成为最后一位未破产的合伙人。|Win with the highest net worth at the round limit, or be the last solvent player.
每人初始现金|Each player starts with
每回合掷两枚骰子移动，经过起点领取|Roll two dice each turn. Passing Start pays
双数不额外行动。|Doubles do not grant an extra turn.
停在无主地产可按标价购买，也可跳过（放弃后进入公开轮流拍卖）。停在他人地产需立即支付租金。|Buy available property at list price or send it to auction. Pay rent immediately when landing on another player's property.
集齐同色街区后，空地租金翻倍。可均衡升级至 4 级，每次升级花费约地价的一半。1–4 级租金为基础租金的 3、6、10、16 倍。|Unbuilt complete sets earn double rent. Balanced development can reach level 4 at about half the land price per level. Rent multipliers are 3, 6, 10 and 16.
出售建筑获得建造费的一半，需先出售同组最高等级建筑。同色全部建筑售出后，才能抵押地产。抵押获得地价的 50%，赎回支付地价的 55%；抵押期间不收租。|Sell buildings for half their cost, starting with the highest level in the set. Clear the set's buildings before mortgaging. Mortgages pay 50% of land price; redemption costs 55%. Mortgaged land earns no rent.
现金不足时，先售楼或抵押；仍无法周转可宣布破产。地产归还银行，其他玩家继续。|Sell buildings or mortgage land to cover debt. If that is insufficient, declare bankruptcy; property returns to the bank and others continue.
进入监狱后，掷双数可免费出狱；也可支付|Roll doubles to leave jail for free, or pay
保释。两轮尝试后自动支付|bail. After two attempts, automatically pay
并继续移动。|and continue moving.
现金＋未抵押地产原价＋已抵押地产半价＋建筑建造原价。期满按总资产排名，平局按玩家顺序排列。|Cash + full value of unmortgaged land + half value of mortgaged land + building cost. Highest net worth wins at the limit; ties follow player order.
每 5 回合更新一次市场，租金乘数同时适用于所有玩家和车站。AI 风格只影响投资决策，不改变骰子概率。|The market changes every 5 rounds for all players and stations. AI style changes investment choices, never dice probabilities.
起，每次加价|starting bid, with increments of
退出后本次不可再出价，最高出价者获得地产。无人出价则地产留在银行。|Passing is final for the auction. The highest bidder wins; without bids, the bank retains the property.
地产交易可收购未抵押、同色组无建筑的地产；本地模式由卖方确认，AI 会按地产组合与现金风险评估报价，也会主动收购缺少的一块同色地产。|Trade eligible unmortgaged property. Human sellers confirm local trades; AI evaluates offers using its portfolio and cash risk.
地图只在开始新局时更换。自动保存最近一局；存档中心另提供 5 个手动槽位、上一局备份及 JSON 导入导出。旧版存档保留原有经济规则。|Maps change only with a new game. Auto-save keeps the latest game; Saves provides 5 manual slots, the previous-game backup and JSON import/export. Older games retain their economy.
地图专属机制仅在新版新局中启用，具体规则见棋盘上方“地图特色”。所有玩家遵守相同地图规则。|Map-specific economy effects apply to new games. All players follow the same map rules; details are in Journey.
进度自动保存在当前浏览器。AI 对战和本地轮流模式均可离开后继续；远程对战请点击“远程联机”，创建或加入朋友的房间；联机进度由服务器保存。|AI and local games save in this browser. Use Online to create or join a friend's room; the server saves online progress.
掷出你的下一座城市。支持 AI 对手与本地多人，买地、建造、经营你的地产帝国。|Roll into your next city. Buy land, build and grow against AI or local players.
每一步，都是新机遇|Every move is an opportunity
从全世界到七大洲，让每一次投资成为新的旅程。|Explore the world and all seven continents through every investment.
经典模式 · 你与 3 位 AI|Classic · you and 3 AI players
远程联机|Online play
经过起点领取发展金|Pass Start to collect a grant
点击街区查看详情|Select a district for details
你的棋子|Your token
点击地块可查看地产与租金|Select land for property and rent details
掷出骰子，开启你的城市投资之旅。先定一个小目标：买下第一块地！|Roll the dice and begin your city investment journey. Start with your first property.
点击棋盘中央的“掷骰子”。经过起点领取|Select Roll dice. Passing Start pays
停在无主地产可购买，放弃后会公开拍卖。|Buy available property or send it to auction.
停在对手地产要付租金。集齐同色组可均衡建造；缺现金时可售楼、抵押，抵押地产不收租。|Pay rent on opponents' land. Keep cash available, and sell buildings or mortgage land when necessary. Mortgaged land earns no rent.
存档中心”提供 5 个手动槽位和自动存档，可导出备份、导入恢复。新局开始前会自动留一份上一局备份。|Saves provides 5 manual slots, auto-save and JSON import/export. Starting a new game creates a backup of the previous game.
单块可开发 1 级，同色两块解锁 2 级，整组解锁 3–4 级。第 8 回合起每 4 回合有维护费；逆风玩家有一次创业援助。|One property unlocks level 1, two of a color unlock level 2, and a full set unlocks levels 3–4. Upkeep begins at round 8; eligible underdogs receive one-time aid.
本局保留原有现金、地价与租金，已支持到站升级。|This game retains its cash, prices and rents, with arrival upgrades enabled.
再次停在自有未抵押房产，每次可付费升一级，无需同色，最高四级。升级后不能在同次到访重复建造。|Land on your unmortgaged property to buy one level per visit, up to level 4. No color set is required; returning again is necessary for another upgrade.
主动收购默认关闭，可在菜单开启；拒绝后同一地产不再被主动收购。|Offers are off by default. Enable them in the menu; rejected properties will not be requested again.
资产管理需等待你的回合。地价、租金、建筑造价、起点奖励和结算期限均保留本局原值。|Manage assets on your turn. Land prices, rent, building costs, Start rewards and the round limit retain this game's original values.
到站建设 · 再次停在自己的房产，就有一次付费升级机会。|Arrival upgrades · return to your property for one paid upgrade.
无需集齐同色。必须停在已拥有、未抵押的房产，每次到访最多升一级；最高四级，建造费约为地价一半。刚买下需下次到访，单纯路过不会触发。|No color set is required. Land on an owned, unmortgaged property to buy one level per visit, up to level 4. Building costs are about half the land price. Buying or merely passing does not count as returning.
到站后选升级或暂不升级。机会本回合有效，未用完也不能留到下一轮；赎回抵押后仍需下次到访。|Choose Upgrade or Skip on arrival. The allowance expires at the end of the turn; redemption requires another arrival.
默认20回合。起点奖励|Default length: 20 rounds. Passing Start pays
基础租金为地价18%，四级倍率为2|Base rent is 18% of land price. Level 1–4 multipliers: 2
第6、12回合成熟系数为1|Maturity factors at rounds 6 and 12: 1
第8回合起，每4回合结算建筑维护费：每级|From round 8, pay upkeep every 4 rounds: per level
加地价总额超|plus the portion of total land prices above
部分2%，向上百元。资产审计与突发检修随规模收费，预留现金才能持续经营。|at 2%, rounded up to hundreds. Audits and emergency repairs increase with asset scale. Keep a cash reserve.
第6回合起，资产低于存活领先者65%、现金不足|From round 6, with net worth below 65% of the solvent leader and cash under
可获一次|receive one-time
援助。创业补给、小企业奖励和逆风订单提供追赶机会。|aid. Startup grants, small-business awards and underdog orders offer ways to catch up.
拍卖每次加价|Auction bid increment:
建筑可独立出售得造价一半；本地产无建筑可抵押得地价50%，赎回付55%。抵押期间不收租。到期按总资产排名，无法偿债可宣布破产。|Sell individual building levels for half their cost. Unbuilt property can be mortgaged for 50% of land price and redeemed for 55%; it earns no rent while mortgaged. Highest net worth wins at the limit. Insolvent players may declare bankruptcy.
已有进度也支持到站升级；原现金、地价、租金和回合保留。AI 主动收购默认关闭；可在菜单开启，拒绝后同一地产不再被主动收购。动画不影响操作与结算。|Existing games also support arrival upgrades while retaining cash, prices, rent and rounds. AI offers are off by default and can be enabled in the menu. Rejected land is not requested again. Animations never delay actions or settlement.
默认 20 回合，经过起点|Default: 20 rounds. Passing Start pays
所有玩家使用相同骰子与规则。|All players use the same dice and rules.
单块地产可建 1 级；持有至少两块同色地产可建至 2 级；集齐整组可均衡建至 4 级。基础租金为地价 18%，1–4 级为基础租金的 2|One property supports level 1; two of a color support level 2; a full set supports balanced levels up to 4. Base rent is 18% of land price. Level 1–4 multipliers: 2
倍。空地整组租金仍翻倍。|times. Unbuilt complete sets still earn double rent.
第 6 回合起租金成熟系数|Rent maturity factor from round 6:
第 12 回合起|from round 12:
与世界新闻及地图效果相乘。枢纽基础租金|multiplied by news and map effects. Hub base rent:
第 8 回合起，每 4 回合在各自回合开始结算：每级建筑|From round 8, every 4 rounds at the start of each player's turn: per building level
加地价总额超过|plus total land prices above
部分的 2%，向上取整至百元。抵押仍计维护规模；请预留现金。|at 2%, rounded up to hundreds. Mortgaged land still counts toward upkeep. Keep cash in reserve.
第 6 回合起，总资产低于存活领先者 65%、现金不足|From round 6, with net worth below 65% of the solvent leader and cash under
可自动获得一次|automatically receive one-time
逆风援助，每人全局一次。机遇中的小企业奖励与逆风订单也能带来追赶机会。|catch-up aid, once per player per game. Chance-card awards and underdog orders also offer ways to recover.
资产审计与突发检修按资产或建筑规模收费，扩张过快可能导致现金危机。普通市政税|Audits and emergency repairs scale with assets and buildings. Overexpansion risks a cash crisis. Ordinary city tax:
审计至少|Minimum audit charge:
按超过|based on the amount above
计算。|calculated.
出售建筑得造价一半，抵押得地价一半，赎回付 55%；现金不足先管理资产，无法偿债可破产。期限到按总资产排名。|Building resale pays half cost, mortgages pay half land price, and redemption costs 55%. Manage assets to cover debt or declare bankruptcy. Highest net worth wins at the limit.
旅人|Traveler
拒绝|Decline
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)]})));
const escapeRegex=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
Object.assign(EN_TEXT,Object.fromEntries(`
还没轮到你竞价|It is not your turn to bid.
你不是本次交易的卖方|You are not the seller in this trade.
交易条件已变化|Trade conditions have changed.
现在不能掷骰|You cannot roll right now.
不能购买或现金不足|Purchase unavailable or cash insufficient.
当前没有待购地产|There is no property awaiting purchase.
请先完成当前操作或处理欠款|Finish the current action or settle your debt first.
现在不能保释|Bail is unavailable right now.
仅欠款时可宣布破产|Bankruptcy is available only when in debt.
请选择有效地产|Select a valid property.
报价无效，或该地产暂不可交易|Invalid offer, or this property cannot currently be traded.
你不是这处地产的业主|You do not own this property.
请先出售同色组最高等级建筑|Sell the highest building in this color set first.
不支持的操作|Unsupported action
操作较频繁，请稍后再试|Too many actions. Please try again shortly.
请重新加入或恢复你的座位|Rejoin or restore your saved seat.
座位凭证已失效|Your seat credential has expired.
请输入玩家昵称|Enter a nickname.
房间已满，请稍后再试|Rooms are full. Please try again later.
请输入 8 位房间码|Enter an 8-character room code.
房间不存在或已过期|This room does not exist or has expired.
本局已开始，请使用已保存的座位重连|The game has started. Reconnect with a saved seat.
房间已满|This room is full.
昵称已被使用，请换一个昵称|That nickname is taken. Choose another.
请求编号无效|Invalid request identifier
对局已更新，请查看最新状态后重试|The game has changed. Check the latest state and try again.
对局已开始，座位将保留用于重连|The game has started. Your seat remains available for reconnecting.
对局已开始|The game has started.
只有房主可以开始对局|Only the host can start the game.
至少两名玩家在线并准备后才能开始|At least two players must be online and ready.
请等待房主开始|Wait for the host to start.
不支持的请求|Unsupported request
等待超时，服务器已执行默认操作。|The stage timed out; the server performed the default action.
接口不存在|Endpoint not found
不接受跨站请求|Cross-site requests are not accepted.
请求格式不正确|Invalid request format
请求内容过大|Request is too large.
服务器保存失败，请稍后再试|The server could not save. Please try again shortly.
服务暂时不可用|Service is temporarily unavailable.
`.trim().split('\n').map(line=>{const i=line.indexOf('|');return [line.slice(0,i),line.slice(i+1)]})));
Object.assign(EN_TEXT,{'新局':'New game','起步 · 到站升级 · 当前进度自动备份。':'starting cash · arrival upgrades · current game backed up.','中文':'Chinese','切换为中文':'Switch to Chinese','暂不升级':'Skip upgrade'});
Object.assign(EN_TEXT,{'定位本回合棋子':'Locate active piece','定位我的棋子':'Locate my piece','本回合棋子':'Active piece','我的棋子':'My piece','棋子':'Piece','本回合':'Active','定位':'Locate','我':'Me'});
delete EN_TEXT['第'];
let englishPattern;
function rebuildEnglishPattern(){englishPattern=new RegExp(Object.keys(EN_TEXT).filter(Boolean).sort((a,b)=>b.length-a.length).map(escapeRegex).join('|'),'g')}
rebuildEnglishPattern();
function englishText(text,protectedNames=[]){
 let value=String(text),names=[];
 for(const name of [...new Set(protectedNames)].filter(Boolean).sort((a,b)=>b.length-a.length))if(value.includes(name)){const token='\uE000'+names.length+'\uE001';names.push(name);value=value.split(name).join(token)}
 value=value.replace(englishPattern,match=>EN_TEXT[match]).replace(/第\s*(\d+)\s*round/g,'Round $1').replace(/round\s*(\d+)\s*round/gi,'round $1').replace(/第/g,'round ');
 value=value.replace(/，/g,', ').replace(/。/g,'. ').replace(/；/g,'; ').replace(/：/g,': ').replace(/（/g,'(').replace(/）/g,')').replace(/[「」“”]/g,'"').replace(/、/g,', ').replace(/！/g,'!').replace(/？/g,'?').replace(/[ \t]{2,}/g,' ');
 return value.replace(/\uE000(\d+)\uE001/g,(_,i)=>names[Number(i)]);
}
// Apply saved colors before the first game render to avoid a theme flash.
if(typeof document!=='undefined'&&document.documentElement){document.documentElement.lang=uiPreferences.language==='en'?'en':'zh-CN';document.documentElement.dataset.theme=uiPreferences.theme;document.documentElement.dataset.layout=uiPreferences.layout}
