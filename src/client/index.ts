/**
 * designer-desk · 浏览器 client half 入口
 *
 * 只注入 slots（严格注入）。宿主若提供 ui / request 服务，api() 会优先使用；
 * 不可用时自动回落到同源 fetch —— 保证在任何版本上都能加载，不会因注入失败被踢出插件树。
 */
import { bindCtx } from './kit'
import { App } from './App'
import { Settings } from './Settings'
import { Badge } from './Badge'

type Ctx = any

export const inject = ['slots']

export function apply(ctx: Ctx) {
  bindCtx(ctx)

  const register = (label: string, name: string, component: any) => {
    try {
      if (!ctx?.slots || typeof ctx.slots.register !== 'function') {
        ctx?.logger?.warn?.(`[designer-desk] slots 服务不可用，跳过注册 ${label}`)
        return
      }
      ctx.slots.register({ name, component })
    } catch (err: any) {
      // 单个插槽注册失败不能拖垮整个插件树
      ctx?.logger?.error?.(`[designer-desk] 注册 ${label} 失败：${err?.message ?? err}`)
    }
  }

  /** 工作区页面：今日 / 项目 / 效果图 三 Tab */
  register('工作区页面', 'workspace', App)

  /** 设置面板：ComfyUI 接入 + 节点映射 + 提示词 + 备份 */
  register('设置面板', 'settings', Settings)

  /** 状态栏徽标：今日 N 项 / 逾期 M 项 */
  register('状态栏徽标', 'status', Badge)
}
