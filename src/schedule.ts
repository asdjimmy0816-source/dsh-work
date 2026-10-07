/**
 * designer-desk · 定时任务与事件
 *
 * 不做浏览器通知 / 系统推送 —— 靠「打开就看见」的置顶区域与状态栏徽标等价于提醒。
 * 定时任务只做两件事：① 每日摘要落成一份可读文本；② 逾期巡检并广播事件。
 */
import { computeBuckets } from './derive'
import { loadConfig, loadDB } from './store'
import { hm, nowIso, todayStr } from './types'
import { renderTodayText } from './commands'

type Ctx = any

export const EVENT_BRIEF = 'designer-desk/brief'
export const EVENT_OVERDUE = 'designer-desk/overdue'

export interface BriefState {
  date: string
  at: string
  text: string
  overdueCount: number
  todayCount: number
}

let brief: BriefState | null = null

export function latestBrief(): BriefState | null {
  return brief
}

/** 每日摘要文本（供状态栏与工作区复用） */
export async function composeDailyBrief(): Promise<BriefState> {
  const db = await loadDB()
  const cfg = await loadConfig()
  const buckets = computeBuckets(db, cfg.silentDays)
  const text = await renderTodayText()
  const state: BriefState = {
    date: todayStr(),
    at: nowIso(),
    text,
    overdueCount: buckets.overdue.length,
    todayCount: buckets.today.length,
  }
  brief = state
  return state
}

export function registerSchedule(ctx: Ctx): () => void {
  if (typeof ctx.setInterval !== 'function') return () => {}

  let lastSummaryDate = ''
  let lastScanAt = 0

  const tick = async () => {
    try {
      const cfg = await loadConfig()
      const today = todayStr()
      const nowHm = hm()

      // ---- 每日摘要 ----
      if (cfg.summaryEnabled && nowHm === cfg.summaryAt && lastSummaryDate !== today) {
        lastSummaryDate = today
        const state = await composeDailyBrief()
        ctx.logger?.info?.(
          `[designer-desk] 每日摘要 ${today}：逾期 ${state.overdueCount} 项 / 今天 ${state.todayCount} 项`,
        )
        emit(ctx, EVENT_BRIEF, state)
      }

      // ---- 逾期巡检（每 30 分钟）----
      if (Date.now() - lastScanAt > 30 * 60 * 1000) {
        lastScanAt = Date.now()
        const db = await loadDB()
        const buckets = computeBuckets(db, cfg.silentDays)
        if (buckets.overdue.length) {
          ctx.logger?.warn?.(
            `[designer-desk] 有 ${buckets.overdue.length} 项待办已逾期：` +
              buckets.overdue.slice(0, 3).map((t) => t.title).join(' / '),
          )
        }
        if (!brief) await composeDailyBrief()
        emit(ctx, EVENT_OVERDUE, {
          count: buckets.overdue.length,
          today: buckets.today.length,
        })
      }
    } catch (err: any) {
      // 定时任务里的异常绝不允许冒泡打崩插件
      ctx.logger?.warn?.(`[designer-desk] 定时任务异常：${err?.message ?? err}`)
    }
  }

  const timer = ctx.setInterval(tick, 60_000)

  // 启动 15 秒后先跑一次，让状态栏立刻有数
  const first =
    typeof ctx.setTimeout === 'function'
      ? ctx.setTimeout(() => {
          void tick()
          void composeDailyBrief().catch(() => undefined)
        }, 15_000)
      : null

  return () => {
    try {
      clearInterval(timer)
    } catch {
      /* ignore */
    }
    if (first) {
      try {
        clearTimeout(first)
      } catch {
        /* ignore */
      }
    }
  }
}

function emit(ctx: Ctx, name: string, payload: unknown) {
  try {
    ctx.emit?.(name, payload)
  } catch {
    /* 事件总线不可用时静默降级 */
  }
}
