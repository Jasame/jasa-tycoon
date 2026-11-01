# 环球大富翁 · World Tycoon V12.0

[立即游玩](https://jasa.hk/tycoon/) · [项目首页](https://github.com/Jasame/jasa-tycoon#readme)

本版重做整个游戏界面的视觉层级，采用暖白、深绿与少量金色，统一按钮、卡片、弹窗与动画。继续支持翡翠、午夜、暖白主题，简体／繁体／英文及手机、iPad布局。

## 界面改版

- 顶部合并地图与回合，只常驻联机和菜单；新局、语言、音效等收进菜单。
- 菜单按本局、房间、外观、存档分组；原有旅程、策略、账本、收购、规划与恢复功能继续可用。
- 当前决策卡突出行动、支付和剩余现金。预计租金、风险、前三回合提示和经营结果按需展开。
- 桌面行动区提供掷骰与结束按钮；手机底栏直接调用原按钮，移除已映射主操作的重复显示，保留付费出狱等额外选择。
- 玩家改为紧凑状态列表；点击或键盘打开现金、净资产、地产数量、位置。自己的编号与方框标记继续保留。
- 棋盘常驻只显示地点、业主与建筑，完整价格和租金点击查看。自己的地产加轮廓，抵押地产用虚线。
- 缩小地图插画、装饰标题和边框，扩大留白，统一圆角、字重与触控区域。三主题采用同一组件语言。

## 动效与设备

- 决策变化用220ms轻入场，同一状态轮询不重复播放；玩家轮转260ms、一般棋子移动240ms。
- 粒子并发上限从24降至16，单次火花从10降至6，购地反馈主要使用缩放。
- 所有装饰不阻挡输入、不等待动画才执行规则；遵守系统减少动态效果与游戏精简动效。
- 手机使用底栏，iPad横屏双栏、竖屏及分屏继续适配；弹窗保留键盘可视高度、滚动与焦点返回。

## 验证范围

22项新版检查覆盖本地／远程身份、拍卖竞买者、交易卖方、欠款、托管、断线、待确认与移动状态、动作代理、重复入场控制及语法。既有540项回归继续运行，发布完整检查合计562项（本地受限环境跳过11项HTTP时为551项）。实际浏览器验收记录见 DEVICE-QA.md 和 V12-TEST-REPORT.json。

本版只调整呈现，保留已有存档、联机房间与经济规则。没有宣称真机Safari验收或60fps硬件性能保证。

## 部署

完整源码包：jasa-tycoon-V12.0.zip。宝塔现有环境先执行 bash deploy-v12.sh prepare，全部验证通过后执行 bash deploy-v12.sh publish；脚本保留前后端与房间回退备份。首次自建请按 DEPLOYMENT.md 配置。继续MIT开源。

## English

V12 redesigns the game with warm white, deep green and restrained gold, a consolidated header, four menu groups, progressive decision details, compact clickable player rows and cleaner property tiles. Mobile mirrors authoritative actions without duplicating the main choices; extra choices remain available. Motion uses shorter transitions and fewer concurrent particles, honors reduced motion and never delays gameplay. Existing saves, multiplayer seats and economic rules remain compatible. Three languages, three themes and iPad layouts are retained. 562 release checks include 22 new presentation/controller checks. Physical-device Safari and hardware frame-rate validation remain pending.
