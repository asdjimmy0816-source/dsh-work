# 设计台 · designer-desk

> 室内设计师个人工作台 —— DeepSeek Harness 插件
> 把客户项目全流程收进一条「项目管线」，今日待办自动置顶，效果图直连本机 ComfyUI。

---

## 这个插件解决什么

室内设计师所有的事都是**某个客户项目的派生物**：量房是「金地花园-1201」的量房，报价是它的报价。
所以本插件的数据主键是**项目**，待办是项目的自动产物 —— 「不漏跟进」从靠记性变成靠结构。

**第 1 期三个模块：**

| 模块 | 说明 |
|---|---|
| **M1 项目管线看板** | 9 阶段卡片墙（线索→量房→方案设计→报价→签约→选材深化→施工→安装验收→结项回访），每张卡片显示「客户 · 小区房号 · 下次行动 · 倒计时」，可一键推进，推进后自动排出下一阶段标准待办 |
| **M2 今日作战台** | 落地页置顶四分区：逾期 / 今天 / 三天内 / 沉默项目唤醒；逾期一键完成或顺延，昨天没做完的自动滚到今天 |
| **M3 效果图工坊** | 接本机 ComfyUI，项目上下文自动注入工作流，出图自动归档回项目，支持设为方案主图 |

**第 2 期三个模块：**

| 模块 | 说明 |
|---|---|
| **M4 工地巡检** | 按「水电→瓦工→木工→油漆→安装→验收」六节点跟进，只显示施工 / 安装验收阶段的项目；状态一键推进（待巡检→进行中→通过），逾期计划日标红，「需整改」数在Tab 上显示红点 |
| **M5 材料进场** | 主材五态流转（待下单→已下单→在途→已到场→已验收），按项目分组；自动汇总「已投入」金额，工地等料逾期标红 |
| **M6 灵感素材库** | 收藏参考图，按标签筛选（标签按使用频次排序）、按评分 / 最新排序，可挂到具体项目；图片挂了自动退化成占位块，不留破图 |

---

## ⚠️ 当前状态：本地逻辑验证通过，真机通信层待重写

第1、2 期六个模块的业务逻辑、界面、门禁、冒烟全部通过，插件也能装进 DSH 并加载成功（浏览器
`window.__DSH_BOOT__.entries` 里能看到 `designer-desk/client.js`）。

**但 Node half 的 31 条 HTTP 路由在真 DSH 下不会被调用。** DSH rc.3 的通信层是
**Typert Remote + WebSocket RPC**（`dsh-api-gateway` / `dsh-typert-protocol` / `dsh-client-connection`），
浏览器端通过 `Connection` 做一元调用，**没有「HTTP 路由」这个机制**。本项目目前用的是
`ctx.webServer.register(router => router.get(...))` + 前端 `fetch()`，与真实传输层不匹配。

影响：界面能加载出框架，但所有数据请求 404，**界面点不动**。

需要重写：`src/routes.ts`（→ Typert Remote 声明式接口）、`src/client/kit.ts#api()`（→ `Connection` 一元调用）、
`scripts/smoke.mjs`（→ mock Remote 而非假 router）。详见 [docs/plan.md](docs/plan.md) 的「真机安装验证」一节。

---

## 安装

### 方式一：本地目录（开发调试推荐）

```bash
# 1. 构建
cd /path/to/designer-desk
pnpm install
pnpm run bundle

# 2. 安装到 web profile
dsh plugin --profile web add /path/to/designer-desk

# 3. 启动（Node half 变更必须重启 web，ESM 缓存不热更）
dsh web
```

### 方式二：git 源

```bash
dsh plugin --profile web add "github:<owner>/designer-desk#main"
dsh web
```

> 改完 `src/` 后必须重新 `pnpm run bundle` 并**重启 web**，否则 Node half 的改动不生效。

---

## 数据存储

数据落在本地，不上传任何服务器：

```
~/.designer-desk/
├── data.json       主库（11 张表）
├── data.bak.json   滚动备份（每次写入前自动替换）
├── config.json     配置
└── renders/        效果图归档
    └── {项目}/{日期}/
```

可通过环境变量 `DESIGNER_DESK_HOME` 改变根目录。

- 首屏提供「导出 JSON 备份」「导入恢复」
- 清空数据需二次确认
- 数据积累到 30 条时顶部提示备份

---

## ComfyUI 配置（M3 效果图工坊）

### 前置

1. 本机启动 ComfyUI（默认 `http://127.0.0.1:8188`）
2. 在 ComfyUI 界面右上角导出**API 格式**工作流：
   `Workflow → Export (API)`
   > ⚠️ 必须是 API 格式。普通的 UI 格式 JSON 提交给 `/prompt` 会直接失败，这是接入时踩坑率最高的一点。

### 在插件设置面板填写

| 配置项 | 说明 | 示例 |
|---|---|---|
| ComfyUI 地址 | 主机与端口 | `http://127.0.0.1:8188` |
| 工作流文件路径 | API 格式 JSON 的绝对路径 | `/Users/you/comfy/workflows/interior_api.json` |
| ComfyUI 输出目录 | ComfyUI 的 `output/` 目录 | `/Users/you/comfy/ComfyUI/output` |
| 节点映射 | 正向提示词 / 负向 / 种子 / 宽 / 高 / 批量 / 输入图 的 `节点ID + 输入字段名` | `positive → 6 / text` |

**节点映射怎么填**：在 ComfyUI 界面点开对应节点，标题栏上的数字就是节点 ID（如 `KSampler #3` → 节点 ID 为 `3`）；输入字段名是该节点里那个输入口的名字，常见为 `text`、`seed`、`width`、`height`、`batch_size`、`image`。

### 出图

- **界面**：项目卡片 →「出效果图」→ 填空间 / 风格 / 材质 / 比例 / 张数 → 提交
- **命令**：`/designer-desk 出图 金地花园-1201 客厅 奶油风`
- 出图是长任务，提交后异步轮询，界面显示进度；失败保留参数可重试

---

## 命令

| 命令 | 说明 |
|---|---|
| `/designer-desk hello <名字>` | 冒烟自检：验证插件链路通畅 |
| `/designer-desk 今日` | 输出今日待处理摘要 |
| `/designer-desk 加项目 <客户名> <小区房号>` | 快速建档，自动生成「预约量房」待办 |
| `/designer-desk 推进 <项目名>` | 推进到下一阶段，自动排出下一步 |
| `/designer-desk 出图 <项目名> <空间> <风格>` | 调 ComfyUI 出效果图 |
| `/designer-desk 备份` | 导出 JSON 备份并返回文件路径 |

---

## 开发

```bash
pnpm install         # 依赖（见下方 pnpm 12 注意事项）
pnpm run bundle      # 构建两个 half → lib/
pnpm run gates       # 一致性门禁：合同 / 名称 / React external / 冒烟齐备（14 项）
pnpm run smoke       # 冒烟自检：用假 ctx 真跑两个 half（87 项，含第 2 期六条路由）
pnpm run typecheck   # 类型检查
pnpm run verify      # bundle + gates + smoke 一条龙
```

> ⚠️ **pnpm 12 注意事项**：pnpm 10+ 默认不执行依赖的 postinstall，而 esbuild 需要它来落平台二进制，
> 否则 `pnpm install` 会以 `ERR_PNPM_IGNORED_BUILDS` 退出。项目内已提供 `pnpm-workspace.yaml` 放行：
> ```yaml
> allowBuilds:
>   esbuild: true
> ```

### 目录

```
designer-desk/
├── package.json            合同字段（name / exports / dsh）
├── tsconfig.json
├── cordis.patch.yml        insert id/name 必须等于包名
├── pnpm-workspace.yaml     放行 esbuild 构建脚本（pnpm 12 必需）
├── docs/
│   ├── plan.md             决策追踪 + 验证结果
│   └── 设计方案.md          完整设计方案
├── scripts/
│   ├── build.mjs           esbuild 双 half 打包 + ModuleLoader 包装
│   ├── gates/run.mjs       一致性门禁（14 项）
│   └── smoke.mjs           冒烟自检（87 项，含日期边界与第 2 期六条路由）
└── src/
        ├── index.ts            Node half 入口（inject 并集 + effect 统一注册）
        ├── types.ts            11 张表类型 + 9 阶段模型
        ├── store.ts            本地 JSON 存储 + 滚动备份 + 串行写入
        ├── derive.ts           计算层：项目视图 / 四分区 / 统计 / 推进引擎
        ├── comfy.ts            ComfyUI 客户端（提交 / 轮询 / 归档）
        ├── routes.ts           HTTP 路由（31 条）
        ├── commands.ts         命令与工具
        ├── schedule.ts         定时任务
        └── client/             浏览器 half
            ├── index.ts        slots 注册
            ├── kit.tsx         api 请求 + 主题 token + UI 原语 + 内联 SVG 图标
            ├── App.tsx         工作区（统一 refreshAll 入口 + 六 Tab 分发）
            ├── Today.tsx       今日作战台（M2）
            ├── Projects.tsx    项目管线看板（M1）
            ├── Renders.tsx     效果图工坊（M3）
            ├── Sites.tsx       工地巡检（M4）
            ├── Materials.tsx   材料进场（M5）
            ├── RefImages.tsx   灵感素材库（M6）
            ├── Settings.tsx    设置面板
            └── Badge.tsx       状态栏徽标
```

### 视图分层约定

- 六个 Tab 在 PC 端全部平铺；窄屏底部条只放「今日 / 项目 / 效果图」，第 2 期三个模块收进「更多」弹层 —— 六个挤在底部条上点不准。
- 每个视图都是纯展示 + 本地表单状态，**自身不发请求**（铁律 9）。所有写操作经 props 回调到`App.tsx` 的 `post()`，改完统一走 `refreshAll()`。
- 视图之间零互调。跨 Tab 跳转（如今日页点项目名跳到项目页）由 `App.tsx` 统一调度。

### 当前验证状态

| 检查 | 结果 |
|---|---|
| `pnpm run bundle` | ✅ lib/index.js 79.6 KB · lib/client.js 203.5 KB |
| `pnpm run typecheck` | ✅ 0 error |
| `pnpm run gates` | ✅ 14 / 14 |
| `pnpm run smoke` | ✅ 87 / 87 |

### 合同铁律

- `package.json#name` ＝ `cordis.patch.yml` insert id/name ＝ client ModuleLoader id ＝ `designer-desk`，三者必须一致
- 禁止声明 `@deepseek-ai/*` 依赖（DSH profile 已提供）
- React 四个包必须 external，否则报 `Cannot read properties of null (reading 'useState')`
- 一律改 `src/`，不要手改 `lib/`

---

## 后续期次

| 期次 | 模块 | 状态 |
|---|---|---|
| 第 1 期 | M1 项目管线 / M2 今日作战台 / M3 效果图工坊 | 本版本 |
| 第 2 期 | M4 工地巡检 / M5 材料进场 / M6 灵感素材库 | 本版本 |
| 第 3 期 | M7 报价与合同 / M8 选材库 | 规划中 |
| 第 4 期 | M9 汇报 PPT 助手 / M10 公众号日更台 | 规划中 |
| 第 5 期 | M11 小说写作台 / M12 数字生活角 | 规划中 |

详见 [docs/设计方案.md](docs/设计方案.md)。

---

## License

MIT
