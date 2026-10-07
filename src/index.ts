/**
 * designer-desk · Node half 入口
 *
 * 合并装配以下配方：command-tool + http-api + service-provider + event-task
 * 严格注入：通过 ctx 访问的每一个「服务」都必须列进 inject。
 */
import { invalidateComfyCache, registerRoutes } from './routes'
import { registerCommands, registerTools, renderTodayText } from './commands'
import { composeDailyBrief, latestBrief, registerSchedule } from './schedule'
import { DESK_HOME, ensureDirs, loadConfig, loadDB, mutate, replaceDB } from './store'
import { computeBuckets, toProjectViews } from './derive'
import { comfyStatus, submitRender } from './comfy'
import { todayStr } from './types'

type Ctx = any

/** webServer 是服务，使用前必须注入 */
export const inject = ['webServer']

/**
 * 测试出口：把纯函数暴露给 scripts/smoke.mjs 做边界自检。
 * 不参与运行时逻辑，也不影响插件树加载。
 */
export { addDaysStr, diffDays, stageDef, STAGES } from './types'
export { computeBuckets, toProjectViews, advanceProject } from './derive'
export { RATIOS } from './comfy'

export function apply(ctx: Ctx) {
  ctx.effect(() => {
    const disposers: Array<() => void> = []

    const safe = (label: string, fn: () => unknown) => {
      try {
        const d = fn()
        if (typeof d === 'function') disposers.push(d as () => void)
      } catch (err: any) {
        ctx.logger?.error?.(`[designer-desk] 装配「${label}」失败：${err?.message ?? err}`)
      }
    }

    // ---------- 启动自检（目录可写 + 首次预置示例数据）----------
    void (async () => {
      try {
        await ensureDirs()
        const db = await loadDB()
        await loadConfig()
        ctx.logger?.info?.(
          `[designer-desk] 就绪 · 数据目录 ${DESK_HOME} · 客户 ${db.customers.length} / 项目 ${db.projects.length} / 待办 ${db.tasks.length}`,
        )
      } catch (err: any) {
        ctx.logger?.error?.(
          `[designer-desk] 启动自检失败：${err?.message ?? err}（请检查 ${DESK_HOME} 是否可写，或用 DESIGNER_DESK_HOME 换目录）`,
        )
      }
    })()

    // ---------- 能力装配 ----------
    safe('http-api', () => registerRoutes(ctx))
    safe('command-tool', () => registerCommands(ctx))
    safe('tool', () => registerTools(ctx))
    safe('event-task', () => registerSchedule(ctx))
    safe('service-provider', () => provideService(ctx))

    return () => {
      for (const dispose of disposers.reverse()) {
        try {
          dispose()
        } catch {
          /* 卸载时静默 */
        }
      }
      invalidateComfyCache()
    }
  })
}

/* ------------------------------------------------------------------ *
 * 对外提供服务：其他插件或上层可以直接取用，不必走 HTTP
 * ------------------------------------------------------------------ */

function provideService(ctx: Ctx): () => void {
  if (typeof ctx.provide !== 'function') return () => {}

  const api = {
    version: '0.1.0',
    home: DESK_HOME,
    todayStr,

    async getState() {
      const db = await loadDB()
      const cfg = await loadConfig()
      const views = toProjectViews(db)
      return {
        projects: views,
        buckets: computeBuckets(db, cfg.silentDays),
        config: cfg,
        customers: db.customers,
        tasks: db.tasks,
        renders: db.renders,
      }
    },

    async getTodayText() {
      return renderTodayText()
    },

    async getBrief() {
      return latestBrief() ?? (await composeDailyBrief())
    },

    async getComfyStatus() {
      return comfyStatus(await loadConfig())
    },

    submitRender,

    async update(mutator: (db: any) => unknown) {
      const out = await mutate(mutator)
      return out.result
    },

    async replaceDb(next: any) {
      return replaceDB(next)
    },
  }

  ctx.provide('designerDesk', api)
  // 通过 ctx.provide 提供的服务在插件卸载时自动移除，无需手动清理
  return () => {}
}
