/**
 * designer-desk · 浏览器 client half 入口
 *
 * 只注入 slots（严格注入）。宿主提供的 remote 服务由 kit.tsx 在 apply() 后
 * 动态 `$mount()`，不走 cordis 的静态 inject。
 *
 * ⚠️ **插槽名必须按 dsh rc.3 实际提供的来 —— 旧文档里的 `workspace` 已不存在。**
 *
 * 真机验证踩过的坑：注册到 `workspace` 的组件永远不渲染。这一版宿主的
 * 客户端包里**没有任何代码消费 `workspace` 槽位**（从 dsh-client-ui-* 的
 * `slots.inject(...)` 全量提取后确认）。表现极具误导性 ——
 * bundle 能加载、apply 能跑、零控制台报错，但界面就是不出来。
 *
 * rc.3 实际的插槽词表：
 *   conversation.view会话主视图（带 label/order，成为可切换视图页）
 *   conversation.input.left / .overlay / .dock    会话输入区
 *   settings.section / settings.general.item     设置面板
 *   plugins.item                插件管理列表项
 *   sidebar.*                   侧栏（含 sidebar.footer.action）
 *
 * 六 Tab 工作区挂在 `conversation.view` —— 这一版唯一能承载整块自定义界面的入口。
 */
import { bindCtx } from './kit'
import { App } from './App'
import { Settings } from './Settings'

type Ctx = any

export const inject = ['slots']

export function apply(ctx: Ctx) {
  bindCtx(ctx)

  const disposers: Array<() => void> = []

  const register = (label: string, def: any) => {
    try {
      if (!ctx?.slots || typeof ctx.slots.register !== 'function' || typeof ctx.slots.inject !== 'function') {
        ctx?.logger?.warn?.(`[designer-desk] slots 服务不可用，跳过注册 ${label}`)
        return
      }
      // ⚠️ 必须用 `slots.inject(slotName, cb)` 包一层。
      // 直接 `slots.register({name})` 会报
      // `slot "xxx" is not declared (a parent entry's children table must declare it)` ——
      // 插槽必须先在父 entry 的 children 表里声明，inject() 就是那个声明动作。
      const dispose = ctx.slots.inject(def.name, () => ctx.slots.register(def))
      if (typeof dispose === 'function') disposers.push(dispose)
    } catch (err: any) {
      // 单个插槽注册失败不能拖垮整个插件树
      ctx?.logger?.error?.(`[designer-desk] 注册 ${label} 失败：${err?.message ?? err}`)
    }
  }

  /**
   * 会话主视图 —— 承载六个 Tab 的主界面。
   *
   * 字段含义参照 `dsh-client-ui-trajectory` 的注册方式：`name` 必须与消费方
   * `slots.inject()` 的参数一致；`id` 是本插件内唯一标识；`order` 决定排序；
   * `label` 是切换标签上的文案。
   */
  register('工作区视图', {
    name: 'conversation.view',
    id: 'designer-desk',
    order: 20,
    label: '设计台',
    component: App,
  })

  /** 设置面板：ComfyUI 接入 + 节点映射 + 提示词 + 备份 */
  register('设置面板', {
    name: 'settings.section',
    id: 'designer-desk',
    order: 20,
    label: '设计台',
    component: Settings,
  })

  // ⚠️ 侧栏徽标暂不注册：`sidebar.footer.action` 在 rc.3 的渲染路径上会抛
  // React #130（元素类型无效），错误边界只把该槽位换成空 div —— 净负收益。
  // 待宿主修好、或找到正确的 entry 形态后再加回来。
}
