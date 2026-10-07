/**
 * designer-desk · 计算层
 *
 * 职责边界（铁律 9 分层）：纯函数，只做过滤/排序/聚合。
 * 绝不能触发任何渲染、网络或写盘行为 —— 保证调用关系是单向的。
 */
import { addDaysStr, diffDays, nowIso, stageDef, todayStr, uid, ymd } from './types'
import type { Buckets, Customer, DB, Project, ProjectView, Task } from './types'

const PRIORITY_WEIGHT: Record<string, number> = { P0: 0, P1: 1, P2: 2 }

export function compareTasks(a: Task, b: Task): number {
  const ad = a.dueAt ?? '9999-12-31'
  const bd = b.dueAt ?? '9999-12-31'
  if (ad !== bd) return ad < bd ? -1 : 1
  const ap = PRIORITY_WEIGHT[a.priority ?? 'P1'] ?? 1
  const bp = PRIORITY_WEIGHT[b.priority ?? 'P1'] ?? 1
  if (ap !== bp) return ap - bp
  return (a.createdAt ?? '') < (b.createdAt ?? '') ? -1 : 1
}

export function sortTasks(list: Task[]): Task[] {
  return [...list].sort(compareTasks)
}

export function findCustomer(customers: Customer[], id: string): Customer | undefined {
  return customers.find((c) => c.id === id)
}

/** 项目 + 客户信息 → 看板可消费的视图对象 */
export function toProjectView(p: Project, customers: Customer[]): ProjectView {
  const c = findCustomer(customers, p.customerId)
  const def = stageDef(p.stage)
  const today = todayStr()
  const daysToNext = p.nextActionAt ? diffDays(p.nextActionAt, today) : null
  return {
    ...p,
    customerName: c?.name ?? '未命名客户',
    community: c?.community ?? '',
    roomNo: c?.roomNo ?? '',
    layout: c?.layout ?? '',
    style: c?.style ?? '',
    area: c?.area,
    stageName: def.name,
    stageAction: def.action,
    daysToNext,
    overdue: daysToNext !== null && daysToNext < 0 && !p.archived,
  }
}

export function toProjectViews(db: DB): ProjectView[] {
  return db.projects
    .filter((p) => !p.archived)
    .map((p) => toProjectView(p, db.customers))
    .sort((a, b) => {
      if (a.stage !== b.stage) return b.stage - a.stage
      return (a.daysToNext ?? 999) - (b.daysToNext ?? 999)
    })
}

/**
 * 今日作战台四分区 + 沉默项目唤醒。
 * 昨天没做完的自动落在 overdue 区，绝不凭空消失（铁律 5）。
 */
export function computeBuckets(db: DB, silentDays: number): Buckets {
  const today = todayStr()
  const open = db.tasks.filter((t) => !t.done)

  const overdue: Task[] = []
  const dueToday: Task[] = []
  const soon: Task[] = []
  const noDate: Task[] = []

  for (const t of open) {
    if (!t.dueAt) {
      noDate.push(t)
      continue
    }
    const d = diffDays(t.dueAt, today)
    if (d < 0) overdue.push(t)
    else if (d === 0) dueToday.push(t)
    else if (d <= 3) soon.push(t)
  }

  const silent = toProjectViews(db).filter((p) => {
    if (p.stage !== 3 && p.stage !== 4) return false
    const last = p.updatedAt ? ymd(new Date(p.updatedAt)) : today
    return diffDays(today, last) >= Math.max(1, silentDays)
  })

  return {
    overdue: sortTasks(overdue),
    today: sortTasks(dueToday),
    soon: sortTasks(soon),
    noDate: sortTasks(noDate),
    silent,
  }
}

export function computeStats(db: DB, views: ProjectView[], buckets: Buckets) {
  const byStage = []
  for (let n = 1; n <= 9; n++) {
    byStage.push({
      n,
      name: stageDef(n).name,
      count: views.filter((v) => v.stage === n).length,
    })
  }
  return {
    projectCount: views.length,
    activeCount: views.filter((v) => v.stage <= 8).length,
    byStage,
    todayCount: buckets.today.length,
    overdueCount: buckets.overdue.length,
    renderCount: db.renders.filter((r) => r.status === 'done').length,
  }
}

/* ------------------------------------------------------------------ *
 * 写操作的领域规则：推一下就走
 * ------------------------------------------------------------------ */

export interface AdvanceResult {
  project: Project
  createdTask: Task | null
  finishedStage: string
  nextStageName: string
}

/**
 * 推进一个项目到下一阶段，并自动排出下一阶段的标准待办。
 * 这是整个工作台的引擎 —— 用户只点一下，不用自己想下一步干嘛。
 */
export function advanceProject(project: Project, note?: string): AdvanceResult {
  const today = todayStr()
  const from = stageDef(project.stage)
  const nextStage = Math.min(9, project.stage + 1)
  const to = stageDef(nextStage)

  project.logs = Array.isArray(project.logs) ? project.logs : []
  project.logs.push({
    at: nowIso(),
    stage: project.stage,
    text: note?.trim() ? `完成「${from.name}」：${note.trim()}` : `完成「${from.name}」→ 进入「${to.name}」`,
  })
  project.stage = nextStage

  let createdTask: Task | null = null
  if (to.next) {
    project.nextAction = to.next.title
    project.nextActionAt = addDaysStr(today, to.next.inDays)
    createdTask = {
      id: uid('tsk'),
      projectId: project.id,
      title: `${to.next.title}（${project.name}）`,
      type: to.next.type,
      dueAt: project.nextActionAt,
      done: false,
      priority: to.next.inDays <= 1 ? 'P0' : 'P1',
      createdAt: nowIso(),
    }
  } else {
    // 第 9 阶段没有下一步：项目收尾
    project.nextAction = undefined
    project.nextActionAt = undefined
    project.archived = true
  }
  project.updatedAt = nowIso()

  return {
    project,
    createdTask,
    finishedStage: from.name,
    nextStageName: to.name,
  }
}
