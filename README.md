# 城市大富翁 · City Tycoon

纯 HTML、CSS 和 JavaScript 编写的城市地产棋盘游戏，支持 AI 对手与本地多人。

在线游玩：https://jasa.hk/tycoon/

## 使用与部署

直接打开 `tycoon/index.html`，或通过任意静态网站服务器托管。无需构建、数据库或第三方依赖。

宝塔部署：将 `tycoon` 文件夹上传至网站根目录，即可通过 `/tycoon/` 访问。如已有同名目录，请先备份。

存档保存在浏览器 localStorage，仅属于当前浏览器与域名。

## 文件

- `tycoon/index.html`：页面结构
- `tycoon/style.css`：界面与响应式布局
- `tycoon/game.js`：游戏逻辑、AI 与本地存档

## 许可证

MIT License，见 LICENSE。
