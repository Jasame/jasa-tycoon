# V11 设备验收范围

## 已自动验证

平板布局逻辑：1194×834横屏、834×1194竖屏、1024×1366竖屏、1366×1024横屏、600×834及400×834分屏、手动启用／关闭、普通桌面不误启用。语言覆盖、规则与权限检查不依赖设备。

## 浏览器视觉验收

已使用Edge设备视口检查1194×834横屏双栏、834×1194竖屏和600×834分屏；棋盘、行动、触控按钮、工具弹窗滚动与旋转后进度保留正常。设置已恢复自动识别。浏览器模拟不包含真实系统键盘、来电或iPadOS Safari的完整行为。

## 需要真实硬件补验

| 场景 | iPadOS Safari | iPhone Safari | Android Chrome |
|---|---|---|---|
| 真实触控、长按与双指缩放 | 未验 | 未验 | 未验 |
| 软键盘与输入框滚动 | 未验 | 未验 | 未验 |
| 来电、锁屏及应用切换恢复 | 未验 | 未验 | 未验 |
| Wi-Fi／移动网络切换 | 未验 | 未验 | 未验 |
| 连续30分钟多人对局 | 未验 | 未验 | 未验 |
| iPad分屏及浮动窗口 | 未验 | 不适用 | 不适用 |

补验时记录设备型号、系统／浏览器版本、方向、游戏版本、复现步骤和结果。不要把座位令牌、恢复码或私人存档放进公开截图。

正式服已验证真人托管开关、托管完成整局、一次性恢复码在独立标签页恢复原座位及撤销旧凭证；私有备份校验与隔离恢复演练通过。独立标签页测试不代表真实跨设备硬件验收。


## V12 UI redesign · 2026-11-01

Edge InPrivate preview: 390×834 phone, 1194×834 tablet landscape, 834×1194 portrait and 600×834 split checked. Tablet modes used the manual override. Rotation retained the test game. Phone dock purchase paid ¥1,400 once (¥10,000 → ¥8,600); end-turn control remained available. Player and property dialogs, new strategy setup, three language switches and three themes checked; midnight primary contrast corrected. Tests used independent browser storage and did not advance the original user game.

562 full server checks passed, including 22 new controller/presentation checks. Browser viewport QA does not equal physical-device or Safari validation. Hardware frame-rate profiling, real keyboard/calls/network transitions and long human multiplayer sessions remain pending. See V12-TEST-REPORT.json.
