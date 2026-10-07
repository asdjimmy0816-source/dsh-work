# designer-desk 插件计划

> 本插件在 DSH 插件开发助手（dsh-plugin-studio）工作流中生成。
> 每阶段决策确定后勾选对应项，未通过不得进入下一阶段。

## 阶段 ①：需求捕获 ✅

- [x] 插件名：`designer-desk`（中文名：设计台）
- [x] 一句话目标：把室内设计师的客户项目全流程（量房→方案→报价→签约→选材→施工→验收）收进一条项目管线，今日待办自动置顶，效果图直连本机 ComfyUI 出图。
- [x] 使用者画像：室内设计师，单人使用，无账号体系
- [x] 目标 profile：web
- [x] 能力面清单：
  - [x] 工作区 / 仪表盘页面（今日 / 项目 / 效果图 三 Tab）→ `dashboard-workspace`
  - [x] 浏览器设置面板（ComfyUI 地址、节点 ID、归档目录、提醒开关）→ `settings-panel`
  - [x] 状态栏组件（今日 N 项 / 逾期 M 项徽标）→ `status-badge`
  - [x] HTTP 接口（项目 / 客户 / 待办 CRUD、ComfyUI 提交与轮询、备份导回）→ `http-api`
  - [x] 对外提供服务（`designerDesk`，供其他插件或上层直接取用）→ `service-provider`
  - [x] 事件订阅 + 定时任务（每日 08:30 摘要、每 30 分钟逾期巡检）→ `event-task`
  - [x] 命令 / 工具（`designer-desk.hello / .today / .add / .next / .render / .backup`）→ `command-tool`
  - [x] MCP 桥接 / HTTP 外呼（本机 ComfyUI 提交与轮询）→ `command-tool` + `http-api`
  - [x] 静态资源托管（效果图归档到 `~/.designer-desk/renders/`，经 `/render/image` 按需读取）
- [x] **规模闸门（铁律 7）**：需求折算模块数 **12 个**，超单期上限 → 已输出 5 期分期方案，本期只搭核心 3 模块

## 阶段 ②：形态与分发决策 ✅

- [x] 形态：`bundle-client`（含工作区页面与设置面板，必须带浏览器 client half）
- [x] 分发方式：git 源（构建产物 `lib/` 入库）
- [x] 包管理器：pnpm（版本 12.4.2 实测通过）

### 已确认决策

| # | 决策项 | 结论 |
|---|---|---|
| D1 | ComfyUI 部署位置 | **本机 Mac mini M4**，默认地址 `http://127.0.0.1:8188` |
| D2 | 第 1 期三模块 | **确认** M1 项目管线 + M2 今日作战台 + M3 效果图工坊 |
| D3 | 数据存储范围 | **本期纯本地**（资料库云端能力经检测不可用），Node half 直接读写本地 JSON |

## 阶段 ③：配方装配 ✅

- [x] `src/index.ts` 已生成（inject 并集 + `ctx.effect()` 统一注册 + 服务 provide + 启动自检）
- [x] `src/client/index.ts` 已生成（slots 注册 workspace / settings / status 三个插槽）
- [x] `inject` 已覆盖所有服务（node: `['webServer']`；client: `['slots']`）
- [x] 冒烟功能就绪
  - 命令 `designer-desk.hello <name>`
  - 路由 `GET /designer-desk/health`
  - 工作区页面（今日 / 项目 / 效果图）
  - 状态栏徽标
- [x] 示例数据就绪（5 客户 / 5 项目 / 6 待办，**含 1 条逾期 + 1 个沉默项目**）
- [x] 未手改 `lib/`（全部由 `pnpm run bundle` 产出）

### 实现文件清单

| 文件 | 职责 |
|---|---|
| `src/types.ts` | 11 张表类型 + 9 阶段模型 + 日期工具 |
| `src/store.ts` | 本地 JSON 存储、滚动备份、串行写入、示例数据 |
| `src/derive.ts` | 计算层：项目视图、四分区、统计、推进引擎 |
| `src/comfy.ts` | ComfyUI 提交 / 轮询 / 归档 / 图片读取 |
| `src/routes.ts` | 全部 HTTP 路由 |
| `src/commands.ts` | 命令与工具 |
| `src/schedule.ts` | 每日摘要 + 逾期巡检 |
| `src/index.ts` | Node half 入口 |
| `src/client/kit.tsx` | api 请求、主题 token、UI 原语、内联 SVG 图标 |
| `src/client/App.tsx` | 工作区（统一 `refreshAll()` 入口） |
| `src/client/Today.tsx` | 今日作战台 |
| `src/client/Projects.tsx` | 项目管线看板 |
| `src/client/Renders.tsx` | 效果图工坊 |
| `src/client/Settings.tsx` | 设置面板 |
| `src/client/Badge.tsx` | 状态栏徽标 |

## 阶段 ④：本地验证 ✅

- [x] `pnpm install` 通过（需 `pnpm-workspace.yaml` 放行 esbuild 构建脚本，见备注）
- [x] `pnpm run bundle` 通过 → `lib/index.js` 65.3 KB / `lib/client.js` 115.1 KB
- [x] `pnpm run typecheck` 通过（0 error）
- [x] `pnpm run gates` 通过（**14 / 14**）
- [x] `pnpm run smoke` 通过（**63 / 63**，用假 ctx 把两个 half 都真跑了一遍）
- [x] `python3 <skill>/scripts/verify_plugin.py .` 通过（**11 / 11**）
- [x] `npm pack --dry-run` 包内容正确（6 个文件 / 44.7 kB：lib 双 half + patch + README + LICENSE + package.json）

### 冒烟覆盖范围（铁律 10 逐条对应）

| 铁律 10 条目 | 对应验证 |
|---|---|
| ① 调用链无环路 | 分层为 数据层→计算层→渲染层；client 由 `App.refreshAll()` 统一调度，视图间零互调 |
| ② 初始化链路通畅 | 假 ctx 跑 `apply()`，路由 / 命令 / 定时 / 服务全部注册成功，无 error 日志 |
| ③ DOM 元素存在性 | client bundle 在 vm 沙箱中求值成功，`apply()` 注册 3 个插槽 |
| ④ 空数据不崩 | 清空数据后 `/state`、`/today`、今日命令均正常返回 |
| ⑤ 日期边界正确 | 跨月 / 跨年 / 闰年 / 回退 6 项断言全部通过 |
| ⑥ 事件绑定时机 | client 用 `useEffect` + cleanup 清理轮询定时器 |
| ⑦ 变量作用域 | typecheck 0 error |
| ⑧ 模块数与规模合规 | 本期 3 模块 ≤ 4；12 模块已分期 |

## 阶段 ⑤：安装与浏览器冒烟 ⏳ 待用户本机执行

- [ ] 安装成功（`dsh plugin --profile web add /path/to/designer-desk`）
- [ ] 启动日志无 `plugin tree failed to load`
- [ ] 浏览器无 `slot entry crashed`
- [ ] 冒烟功能可用（`/designer-desk.hello 哥哥` 有返回、工作区出现「设计台」、状态栏出现徽标）

## 阶段 ⑥：发布 ⏳ 待执行

- [ ] git 仓库与 remote 就绪
- [ ] README 使用真实安装 ref（当前为 `<owner>` 占位）
- [ ] 构建产物已入库
- [ ] 从目标 ref 重装验证通过

## 分期路线图

| 期次 | 新增模块 | 状态 |
|---|---|---|
| 第 1 期 | M1 项目管线 + M2 今日作战台 + M3 效果图工坊 | ✅ 已实现，本地验证通过 |
| 第 2 期 | M4 工地巡检 + M5 材料进场 + M6 灵感素材库 | ✅ 已实现，本地验证通过 |
| 第 3 期 | M7 报价与合同 + M8 选材库 | 待启动 |
| 第 4 期 | M9 汇报 PPT 助手 + M10 公众号日更台 | 待启动 |
| 第 5 期 | M11 小说写作台 + M12 数字生活角 | 待启动 |

> ⚠️ **第 1、2 期标注的是「本地验证通过」，不是「真机可用」。** 真机冒烟（2026-10-07）发现通信层设计不匹配，
> 见文末「真机安装验证」一节 —— Node half 的 31 条 HTTP 路由在真 DSH 下不会被调用，需重写为 Typert Remote。

> 数据表 11 张已在第 1 期一次性定义（`sites` / `materials` / `refimages` / `quotes` / `contracts` / `contents` / `reading` 先留空数组），
> 后续期次直接往表里填业务，**不需要数据迁移，也不会丢已有数据**。

## 备注

### 存储方案降级说明

资料库（云端数据表 / 在线 page）能力经加载检测**不可用**：
`Error: Can not find skill: "资料库"`。
故按规则切换为本地方案 —— DSH 插件 Node half 直接读写本地 JSON（`~/.designer-desk/data.json`），
并提供 JSON 导出 / 导入备份、写入前滚动备份（`data.bak.json`）。
后续若资料库恢复可用，可叠加为二级云同步层，不影响本地主库。

### 环境踩坑记录（已解决）

**pnpm 12 拦截构建脚本**：`pnpm install` 会以 `ERR_PNPM_IGNORED_BUILDS` 退出，提示 `Ignored build scripts: esbuild@0.24.2`。
原因是 pnpm 10+ 默认不执行依赖的 postinstall 脚本，而 esbuild 需要它来落平台二进制。
pnpm 12 已把该设置从 `package.json#pnpm` 迁移到独立文件，因此项目内提供 `pnpm-workspace.yaml`：

```yaml
allowBuilds:
  esbuild: true
```

### 第 2 期前端补齐（2026-10-07）

第 1 期结束时 `sites` / `materials` / `refimages` 三张表已有种子数据与 6 条路由，但 `src/client/` 零引用 —— 典型的「后端备好、前端没做」半成品。本期补齐。

**新增**：`Sites.tsx`（六节点巡检）/ `Materials.tsx`（五态材料）/ `RefImages.tsx`（标签化参考图），`App.tsx` 从三Tab 扩到六 Tab。

**顺手修掉的既有缺陷**（都不是这期引入的）：

1. `kit.tsx` 的 `IconName` 声明了 `build` / `box` / `gallery` 但 `PATHS` 里没实现 —— `tsc --noEmit` 一直在报 `TS2739`，README 写的「typecheck 0 error」是错的。补上图标后归零。
2. `routes.ts` 三处更新分支缺新建分支的归一化：表单清空字段会把 `""` 写进库（`arriveAt` / `plannedAt` 尤其致命 —— 空串会被 `dayDiff` 算成 NaN）。抽出 `optional()` / `normalize()` 两侧共用。
3. 评分夹紧写成 `Number(v) || 3`，而 `0` 是 falsy —— 想填 0 分会被当成「没填」落成 3。改成先判 `undefined/null/''` 再 `Number.isNaN`。
4. `refimage/save` 更新时不重解析 `tags`（字符串直接覆盖数组）与不夹紧 `score`。

**测试教训（复用价值高）**：

- `/state` 返回的是**库内数组的引用**，不是副本。真机走 HTTP 序列化看不出来，但进程内直接调路由时，后续 `push` 会让之前拿到的「基线」一起变。写断言必须取长度快照，不能留数组引用。
- jsdom 挂载多个视图时**必须逐个 unmount**，否则 `document.body` 里叠着上一棵树的 DOM，`querySelectorAll('button')` 会命中前一个组件的按钮，表现为「筛选没生效」这类假 bug。
- 断言渲染结果**不要用 `textContent.includes`**：相邻的标签按钮 `侘寂风` + `卧室` 会拼出 `侘寂风卧室` 这个子串，造成假阳性。改用可计数的节点（如「编辑」按钮数 = 卡片数）。

**验证**：typecheck 0 error ｜ bundle lib/index.js 79.6 KB · lib/client.js 203.5 KB ｜ gates 14/14 ｜ smoke **87/87**（新增 24 项覆盖第 2 期六条路由）｜ 另用 jsdom + 真Node half 跑了 13 项渲染测试（三视图渲染 / 空态 / Tab 切换 / 标签筛选 / 删除真发 POST / 零 console.error），全绿。

**窄屏决策**：六个 Tab 全塞进底部条在手机上点不准，所以底部条只留「今日 / 项目 / 效果图」，第 2 期三个模块收进「更多」弹层；PC 端六 Tab 全平铺。

### 待办

- 用户在 Mac mini M4 上启动 ComfyUI 后，到设置面板填工作流路径与节点映射（必须是 **API 格式** JSON）
- 安装冒烟（阶段 ⑤）通过后，可初始化 git 仓库并发布


## 真机安装验证（2026-10-07 19:00）

插件已装进 `~/.dsh/profiles/web`，客户端 bundle 确认加载成功，但**Node half 的通信层需要重写**。

### 已确认正常的部分

- `dsh plugin --profile web add <路径>` 会自动把插件写进 profile 的 `dependencies` **和** `bundles`，不用手动改
- profile 里是符号链接指向源码目录，`lib/` 产物跟着走，改源码后重新 bundle 即可
- 浏览器 `window.__DSH_BOOT__.entries` 里能看到 `designer-desk/client.js`，与官方插件并排 —— **插件树加载成功**
- 修好 dsh 全局安装后，启动日志里不再有 `plugin tree failed to load`

### 必须重写：通信层

**现象**：所有 `/api/designer-desk/*` 与 `/designer-desk/*` 全部 404，连官方服务的路径也 404。

**根因**：DSH rc.3 的通信层是 **Typert Remote + WebSocket RPC**（`dsh-api-gateway` / `dsh-typert-protocol` /
`dsh-client-connection`）—— 浏览器端通过 `Connection` 做一元调用，流式走 Gateway 的 WebSocket mux。
**没有「HTTP 路由」这个机制。**

现在的实现（`routes.ts` 31 条 `router.get/post` + `kit.tsx` 的 `fetch('/designer-desk/...')`）在这个宿主下一次都不会被调用。

相关细节：

- `webServer` 服务由 `@deepseek-ai/dsh-host-webserver` 提供，其类型定义注释写明「Electron 用 file:// + IPC，此包从不打印 URL」
- `inject: ['webServer']` 在某些宿主下可能满足不了 → `apply` 根本不执行。此时 `safe()` 只在日志留一行 error，
  极易被忽略（已用假 ctx 实测复现：`Cannot read properties of undefined (reading 'register')`）
- 所以**必须有一条「apply 到底跑没跑」的硬断言**，不能只看启动日志有没有报错

### 重写范围

| 文件 | 现状 | 需要 |
|---|---|---|
| `src/routes.ts` | 31 条 `router.get/post` | 改成 Typert Remote 声明式接口 |
| `src/client/kit.ts#api()` | `fetch('/designer-desk/...')` | 改走 `Connection` 一元调用 |
| `scripts/smoke.mjs` | 假 ctx + 假 router 验证 31 条路由 | 改成 mock Typert Remote，验证 remote 方法而非 HTTP 路径 |

**在重写完成前，本项目只能算「本地逻辑验证通过」，界面在真 DSH 里点不动。**

### dsh 全局安装的坑（已修）

真机冒烟前 `dsh` 根本起不来，报 `plugin tree failed to load: @deepseek-ai/dsh-sandbox-local`。
根因：CLI 是 `0.1.5-rc.2`，但 `dsh-base` / `dsh-web-app` 已被更新到 `0.1.5-rc.3`，而 rc.3 的 34 个依赖从未装上
（半途而废的更新）。与本插件无关 —— 把插件从 bundles 移除后同样报错。

修法：`npm i -g @deepseek-ai/dsh@0.1.5-rc.3` 对齐版本。

**注意**：不要试图在 dsh 安装目录里跑 `npm install` —— 它自己的 `package.json` 依赖一个从未发布到 registry 的包
（`@deepseek-ai/dsh-experimental-code-runtime-python`），任何 npm install 都会 404。

### 真机验证手段（可复用）

curl 打不通（认证是浏览器 303 跳转 + cookie 流程）。必须用真实浏览器：

```js
chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true })
await page.goto(`http://127.0.0.1:${PORT}/?token=${TOKEN}`)  // 浏览器自动跟 303 并落 cookie
```

**探测插件是否真加载：读 `window.__DSH_BOOT__.entries`，比看启动日志可靠得多。**

其他坑：

- 正确语法是 `dsh --profile web`，不是 `dsh web --profile web`（后者报 `unknown option '--profile'`）
- `~/.dsh/profiles/node_modules.lock` 会锁住整个 profiles 目录；命令超时被杀会留下陈旧锁（内含已死 PID），
  后续启动报 `atomic-write: timed out waiting for the writer lock`。删锁前务必确认锁里 PID 已死
- 后台常驻要用执行器的 run_in_background，`nohup` 会随命令结束被回收，macOS 无 `setsid`
- 桌面版（DeepSeek Harness.app）自带一套 dsh（在 `app.asar/dsh`），跑 `~/.dsh/profiles/desktop`，与全局 npm 那套是两套东西
