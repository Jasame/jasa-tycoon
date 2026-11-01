# 部署与运行 / Deployment

当前游戏版本 V12.0。以下区分本地试玩、首次安装和现有宝塔环境升级。项目已在 Node.js 20 环境验证；后端不需要 npm 依赖，前端不需要构建。第三方浏览器组件随源码本地托管，见 [许可说明](THIRD-PARTY-NOTICES.md)。

## 1. 目录与服务

| 路径 | 用途 |
|---|---|
| `tycoon/` | 完整静态前端及共享规则 |
| `server/server.cjs` | 房间服务，内置 HTTP 模块 |
| `server/engine.cjs` | 服务器权威规则执行器，加载相邻 `tycoon/` 中的共享规则 |
| `server/world-tycoon.service` | 当前宝塔机器使用的 systemd 示例 |
| `server/tycoon-online.conf` | `/tycoon/api/` 的 Nginx 代理片段 |
| `verify*.cjs` | 规则、联机、存档与界面逻辑验证 |
| `deploy-v12.sh` | 现有宝塔环境的 V12 升级脚本 |

运行后端时保留 `server/` 与 `tycoon/` 的相邻目录关系。只上传静态文件可以玩 AI／同屏模式，不能提供远程房间。

## 2. 本地试玩

在仓库根目录启动静态服务器，例如：

```sh
python3 -m http.server 8080
```

打开 `http://localhost:8080/tycoon/`。浏览器本地存档按网站来源隔离。

另一个终端运行后端：

```sh
PORT=8912 STATE_DIR=/absolute/private/path/tycoon-data node server/server.cjs
```

`STATE_DIR` 目录由服务创建并保存 `rooms.json`；不指定时默认使用 `server/data/`。不要将房间数据放进公开静态目录或提交到 GitHub。

后端固定绑定回环地址 `127.0.0.1`，`PORT` 默认 8912。远程联机客户端固定请求同源 `/tycoon/api/`；需要将该路径代理到后端。静态端口与后端端口分别运行，并不自动构成同源代理。

## 3. 自建服务器首次安装

1. 将 `tycoon/` 的内容作为网站 `/tycoon/` 静态目录；将一份完整的 `server/`、`tycoon/` 放在网站根目录之外供后端运行。
2. 创建由服务账户可写的私有持久化目录，配置 `STATE_DIR`。服务账户还需能读取后端及共享规则。
3. 按 `server/world-tycoon.service` 调整运行用户、Node 可执行文件、工作目录、端口和数据目录，然后启用服务。该模板中的 `www` 用户及 `/www/...` 路径属于当前宝塔环境。
4. 参考 `server/tycoon-online.conf`，将同源 `/tycoon/api/` 代理到回环后端，转发主机与真实来源信息。模板中的 HTTPS 重定向域名需要改为自己的域名。
5. 为生产网站启用 HTTPS，检查配置后重载 Nginx，验证下方健康接口及至少一次创建／加入／准备／开局流程。

```sh
curl -fsS http://127.0.0.1:8912/tycoon/api/health
curl -fsS https://YOUR_DOMAIN/tycoon/api/health
```

V12 正常响应为 `{"ok":true,"version":"12.0.0"}`。不要将回环服务直接暴露为公网端口。

游戏目前使用 `/tycoon/` 和 `/tycoon/api/` 固定路径。更改子路径还需同步修改客户端 API、邀请链接与代理配置，不能只移动静态文件。

## 4. 当前宝塔环境升级

`deploy-v12.sh` 依赖已存在的服务、生产目录与代理配置，**不是首次安装脚本**。先核对脚本路径：

| 项目 | 当前配置 |
|---|---|
| Node | `/www/server/nodejs/v20.9.0/bin/node` |
| 网站根目录 | `/www/wwwroot/jasa.hk` |
| 正式前端 | `/www/wwwroot/jasa.hk/tycoon` |
| 预览前端 | `/www/wwwroot/jasa.hk/tycoon-v120` |
| 正式后端 | `/www/tycoon-online/app-v4` |
| 暂存后端 | `/www/tycoon-online/app-v120` |
| 私有房间数据 | `/var/lib/tycoon-online` |
| 服务 | `world-tycoon.service` |
| 备份 | `/www/tycoon-online/backups` |

`app-v4` 是沿用的安装目录名，不代表运行的游戏版本。

解压完整发布包，在包含 `deploy-v12.sh` 的目录执行：

```sh
bash deploy-v12.sh prepare
```

此步骤运行完整 562 项检查，建立前后端暂存目录，并给出 `/tycoon-v120/` 预览地址。预览前端的联机 API 仍指向当前正式后端；在切换前不要用依赖新版后端的新命令操作真实房间。本地 AI／同屏可先检查新版画面。

确认后执行：

```sh
bash deploy-v12.sh publish
```

脚本备份前端、后端与现有房间数据，停止服务后切换程序，再检查回环及公网健康接口。后端启动失败会恢复旧程序和原房间备份；静态目录切换失败也有恢复分支。服务器房间保留，浏览器旧进度不被部署脚本清除。

若暂存目录已经存在，`prepare` 会停止，避免混用未审阅的暂存内容。先检查已有目录并保留或移走，再重新准备；不要直接覆盖来源不明的暂存包。

## 5. 发布后验收与恢复

- 检查页面页脚版本和健康接口，刷新后确认资源加载成功。
- 验证本地进度保留；用测试昵称检查房间创建、加入、准备、人机、开局、刷新重连与标签页接管。
- 备份位于 `backups` 下带时间戳的 `tycoon-before-v120-*`、`app-before-v120-*` 和 `rooms-before-v120-*.json`。
- 人工回退应先停止服务并保留当前程序及数据，再恢复匹配的前后端。新版运行后已有新操作时，不要盲目恢复旧房间快照，以免丢失这些操作；先判断旧程序是否兼容当前数据。
- 发布说明和源码 ZIP 不应包含真实房间、座位令牌、私有目录备份或服务器凭证。

更新 README、版本文案等仓库说明无需重启游戏服务。历史 `deploy.sh` 及各旧版本脚本保留用于追溯，当前升级入口为 `deploy-v12.sh`。

## 6. 测试入口

完整命令见 [CONTRIBUTING.md](CONTRIBUTING.md)。HTTP 接口检查需要允许本地端口监听；只在受限开发环境可明确跳过 HTTP 子集，不能把跳过后的数量表述为完整发布验证。

---

**English overview:** Serve `tycoon/` at `/tycoon/`. Run `server/server.cjs` with its sibling `tycoon/` outside the public web root. The backend binds to loopback port 8912 and persists rooms in `STATE_DIR`; proxy `/tycoon/api/` on the same origin and use HTTPS in production. Adapt the supplied Nginx/systemd templates for a first install. `deploy-v12.sh prepare|publish` is an upgrade workflow for the existing BaoTa layout, with full checks, staging, backups and startup-failure recovery. Preserve current room data before any manual rollback.

## V11 private maintenance

The service checks once per minute for a UTC daily snapshot. The first snapshot of a day is stored under `STATE_DIR/backups/` and is not overwritten. Snapshots contain private room data. Manage retention and disk capacity as an administrator; there is no automatic deletion of old backups.

```sh
STATE_DIR=/var/lib/tycoon-online node server/maintenance.cjs status
STATE_DIR=/var/lib/tycoon-online node server/maintenance.cjs backup
node server/maintenance.cjs drill /PRIVATE_PATH/rooms-YYYY-MM-DD.json
```

The drill validates SHA-256 and room format, loads the snapshot and engines in a private temporary directory, then removes only that temporary copy. It does not replace production data and emits aggregate counts only. Daily snapshots are not a per-action history and cannot guarantee zero data loss. The primary registry still persists every successful mutation atomically.

`service-events.json` keeps up to 100 current-process events containing only time, category and a bounded error code. It excludes tokens, request bodies and raw error text. Readiness returns HTTP 503 after a persistence failure and recovers after the next successful save.

Before rolling back to an older program, evaluate V11 AI-management and recovery states and preserve current data. A version notice asks the player to refresh; it does not reload while a command is pending.
