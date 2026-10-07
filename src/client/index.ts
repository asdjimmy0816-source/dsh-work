/**
 * designer-desk · 浏览器 client half 入口
 *
 * 只注入 slots（严格注入）。宿主提供的 remote 服务由 kit.tsx 在 apply() 后
 * 动态 `$mount()`，不走 cordis 的静态 inject。
 *
 * ─────────────────────────────────────────────────────────────────
 *⚠️ rc.3 插槽契约（三条硬约束，全部踩过）
 * ─────────────────────────────────────────────────────────────────
 *
 * 1. **组件是 `slots.register()` 的第二个位置参数，不是 entry 的字段。**
 *    写成 `slots.register({ ..., component: App })` 会静默失效 ——
 *    标签能出现（宿主读 `label`），内容一片空白（宿主压根不看 `component`）。
 *    全仓验证：在所有 `dsh-client-ui-` 包的 client.js 里搜 `component:` —— **零命中**。
 *
 * 2. **`label` 必须是函数**，不是字符串：`label: () => '设计台'`。
 *
 * 3. **必须用 `slots.inject(name, cb)` 包一层。**
 *    裸 `slots.register({name})` 会报
 *    `slot "xxx" is not declared (a parent entry's children table must declare it)`。
 *
 * ─────────────────────────────────────────────────────────────────
 * ⚠️ 插槽选择：`main` 而非 `conversation.view`
 * ─────────────────────────────────────────────────────────────────
 *
 * `conversation.view` 看着最像「整页视图」，但它的真实契约是**会话消息流的
 * 声明式容器**：entry 提供 `children`（声明要渲染哪些节点槽）+ `inject(sessionId)`
 * （注入数据回调），宿主渲染的是它声明的子节点。传组件进去会被忽略。
 *
 * `main` 才是承载整块自定义界面的入口 —— 同 profile 里的 `dsh-studio-dashboard`
 * 就是用它渲染工作台的（`slots.inject("main", () => slots.register({name:"main",
 * key: PANEL_ID}, Workbench))`）。
 */
import { bindCtx } from './kit'
import { App } from './App'
import { Settings } from './Settings'
import { DeskIcon } from './DeskIcon'

type Ctx = any

/**
 * ⚠️这里是**运行时服务键名**，不是包名 —— 与 package.json 的
 * `dsh.client.inject`（那个是包名，决定宿主加载哪些 bundle）是**两回事**。
 *
 * cordis 的 Proxy 拦截未声明的服务访问：不在这里列出，读 `ctx.remote`
 * 会抛 `cannot get property "remote" without inject`。
 *
 * 实测（cordis 0.1.5-rc.3）：`inject: ['remote']` + 根上 `provide('remote', svc)`
 * → 能读到；换成包名则读不到。
 *
 * 词表参照官方 multi-agent 插件的 client bundle：`['slots','locale','remote']`。
 *
 * ⚠️ esbuild 会把没人引用的 `export const` 当副作用摇掉 ——
 * 这个数组必须在 bundle 里真实存在（`exports.inject=`），否则声明无效。
 * scripts/gates/run.mjs 有对应门禁守着。
 */
export const inject = ['slots', 'remote']

/**
 * esbuild 会把「没人引用的纯常量导出」当副作用摇掉（`exports.inject` 会消失）。
 * 挂到 apply 上作为静态属性就摇不掉 —— esbuild 不会动对象属性赋值。
 * cordis 读的正是 `module.exports.inject`，两者等价。
 */
;(apply as any).inject = inject

export function apply(ctx: Ctx) {
  bindCtx(ctx)

  const disposers: Array<() => void> = []

  /**
   * 注册一个插槽。
   *
   * @param slot  宿主消费的插槽名（`main` / `settings.section` / ...）
   * @param entry entry 元信息，**不含组件**
   * @param Comp  组件 —— 作为 `slots.register()` 的第二个参数传
   */
  const register = (slot: string, entry: any, Comp: any) => {
    try {
      if (!ctx?.slots || typeof ctx.slots.register !== 'function' || typeof ctx.slots.inject !== 'function') {
        ctx?.logger?.warn?.(`[designer-desk] slots 服务不可用，跳过插槽 ${slot}`)
        return
      }
      const dispose = ctx.slots.inject(slot, () => ctx.slots.register(entry, Comp))
      if (typeof dispose === 'function') disposers.push(dispose)
    } catch (err: any) {
      // 单个插槽注册失败不能拖垮整个插件树
      ctx?.logger?.error?.(`[designer-desk] 注册插槽 ${slot} 失败：${err?.message ?? err}`)
    }
  }

  /**
   * 主界面 —— 承载六个 Tab 的设计工作台。
   *
   * `main` 插槽的 entry 只需要 `name` + `key`（`key` 是工作台面板标识，
   * 参考 dsh-studio-dashboard 的 `PANEL_ID` 做法），组件走第二参数。
   */
  register(
    'main',
    {
      name: 'main',
      key: 'designer-desk-main',
      order: 20,
      label: () => '设计台',
    },
    App,
  )

  /** 设置面板：ComfyUI 接入 + 节点映射 + 提示词 + 备份 */
  register(
    'settings.section',
    {
      name: 'settings.section',
      id: 'designer-desk-settings',
      order: 20,
      label: () => '设计台',
    },
    Settings,
  )

  /**
   * 侧栏入口 —— 只放一个图标按钮，点开主工作台。
   *
   * ⚠️ 这里**绝不能传 App**：侧栏面板会完整渲染一遍组件，六 Tab 工作台
   * 会在主区和侧栏各画一次（界面上表现为「同一界面出现两份」）。
   * `dsh-studio-dashboard` 的做法是侧栏传图标组件（`DashIcon`），
   * 完整界面只挂在 `main` 上。
   */
  register(
    'sidebar.panellist',
    {
      name: 'sidebar.panellist',
      id: 'designer-desk-main',
      order: 21,
      label: () => '设计台',
    },
    DeskIcon,
  )

  // 插件卸载时注销全部插槽
  return () => {
    for (const dispose of disposers.reverse()) {
      try {
        dispose()
      } catch {
        /* 静默 */
      }
    }
  }
}