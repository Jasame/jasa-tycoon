# 贡献与问题反馈 / Contributing

欢迎改进规则、界面、三语言文案、设备适配和测试。先阅读 [当前功能](README.md)、[V10 规则与兼容范围](V10-RELEASE-NOTES.md) 及 [运行指南](DEPLOYMENT.md)。

## 提交问题

请在 [Issues](https://github.com/Jasame/jasa-tycoon/issues) 写明：

- 游戏版本、地图、模式（AI／同屏／远程）、回合和当时操作阶段。
- 复现步骤、期望结果与实际结果；是否可稳定重复。
- 浏览器、系统、屏幕方向及大致尺寸，是否开启自动掷骰、自动结束或精简动效。
- 脱敏截图或必要日志。不要公开座位令牌、认证信息、真实房间数据库或完整私人存档。

反馈“不能升级”时，请补充是否停在自有未抵押房产、是否本次已升级、现金和等级。建议规则改动时，请说明想解决的体验问题、受影响的玩家与可能的代价。

## 开发约定

1. 从当前主分支创建工作分支，保持修改聚焦，说明触发场景和修改后的行为。
2. 规则由浏览器与服务器共享；新增操作必须同时校验服务器权限、回合、金额和状态，不只禁用客户端按钮。
3. 新玩法明确限定到新局，或提供可验证的迁移；不要无提示重算旧玩家资产和规则。
4. 新增显示文案补充 `tycoon/locales.js` 的英文映射，检查繁体转换、动态金额、玩家名字保护及手机可读性。
5. 动画不阻挡输入，不等待动画结束才结算，遵守精简动效和后台暂停。
6. 仅在需要验证行为时添加有意义的检查，例如重复请求不重复扣款、失败保存不改变状态。不要用源码字符串存在测试替代行为验证。
7. 不提交线上数据、座位令牌、密码或本机环境文件。引入资源时记录来源、版本和许可。

## 完整验证

在已安装 Node.js 的环境、仓库根目录执行：

```sh
node verify.cjs
for suite in online adventures interface economy landing comfort display pawn v6 v7 v8 v9 v10 v11; do
  node "verify-$suite.cjs" || exit 1
done
```

当前 V11 发布共 **540 项检查**。其中 HTTP 子集需要能监听本地端口；受限环境可单独调用：

```sh
node -e "require('./verify-online.cjs')({skipHTTP:true}).catch(e=>{console.error(e);process.exitCode=1})"
```

此调用只执行联机套件中的 26 项，跳过 5 项 HTTP 检查，不能代替完整 31 项联机验证。V11套件另有6项HTTP检查，可通过 {skipHTTP:true} 跳过；总共跳过11项时合计529项，不能代替完整发布验证。

按修改范围实际试玩：新局与旧存档、可用及不可用的升级、资产筹措、多人房间及断线恢复、桌面与窄屏、简／繁／英。自动流程不等于真实设备和长期多人测试，请在 PR 中区分已验证和未验证项目。

## Pull Request 说明

说明要解决的问题、修改后的行为、兼容性影响和实际验证。改 UI 时附前后截图或说明关键布局；改经济时给出参数、适用范围和模拟结果，不把少量样本当作长期平衡结论。

项目按 [MIT](LICENSE) 开源，第三方组件保留原许可。新增依赖或素材请一并更新 [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md)。

---

**English:** Report reproducible steps, game version/map/mode, expected versus actual behavior, and browser/device details. Keep credentials and private room data out of public issues. Contributions should preserve old saves, validate actions on the server, cover all three UI languages and respect reduced motion. Run the suites above and state exactly what was tested. V11 has 540 checks; skipping five legacy and six new HTTP checks yields 529, not full release validation.
