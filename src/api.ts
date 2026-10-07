/**
 * designer-desk · 接口层 —— Typert Remote 控制器
 *
 * ⚠️ 这个文件必须作为**独立 Loader entry** 挂载（见 cordis.patch.yml 第二条 insert），
 * 不能在业务插件的 apply() 里 `ctx.plugin()`。原因（DSH 官方multi-agent 插件踩过）：
 * 那样控制器落在业务插件的**子 fiber** 上，服务注册不上，客户端的 `$mount()`
 * 会永远停在 waiting —— 表现为「界面加载了但永远没数据，也不报错」。
 *
 * 职责边界（铁律 9 分层）：只做「收参数 → 调计算层/数据层 → 返回结果」，
 * 不含业务算法，不触发其它渲染逻辑。
 *
 * 为什么是 Remote 而不是 HTTP 路由：DSH rc.3 的通信层是 Typert Remote + WebSocket RPC，
 * 浏览器端通过 `ctx.remote.$mount(ns)` 挂载命名空间后直接调方法，没有「HTTP 路由」这回事。
 */
import { Remote, TypertRemoteService } from '@deepseek-ai/dsh-typert-protocol'
import {
  DATA_FILE,
  DESK_HOME,
  clearAll,
  loadConfig,
  loadDB,
  mutate,
  renderDirFor,
  replaceDB,
  saveConfig,
  seedDemo,
  storageInfo,
} from './store'
import {
  advanceProject,
  computeBuckets,
  computeStats,
  sortTasks,
  toProjectViews,
} from './derive'
import { RATIOS, comfyStatus, getJob, listJobs, readRenderImage, submitRender } from './comfy'
import type { RenderSink } from './comfy'
import { STAGES, addDaysStr, nowIso, stageDef, todayStr, uid, ymd } from './types'
import type {
  Customer,
  DB,
  Project,
  StatePayload,
  Task,
} from './types'

type Ctx = any

/** Remote 命名空间名 —— 客户端 `$mount()` 与 `ctx.inject(['remote.<ns>'])` 都要用它 */
export const REMOTE_NAMESPACE = 'designerDesk'

/**
 * 控制器的 **serviceKey** —— 必须是**另一个名字**，不能等于命名空间。
 *
 * TypertRemoteService 会用 serviceKey 把自己注册成 cordis 服务。若它等于
 * 命名空间（`super(ctx, 'designerDesk')`），控制器就会把业务插件 provide 的
 * `designerDesk` 服务**覆盖掉**—— 于是 `static inject = ['designerDesk']`
 * 读到的是控制器自己，`this.ctx.designerDesk.getState()` 变成 undefined。
 *
 * 官方 multi-agent 插件的写法：`super(ctx, 'multiAgentController', { namespace: 'multiAgent' })`
 * —— serviceKey 与 namespace 分离，本项目照抄这个模式。
 */
export const CONTROLLER_KEY = 'designerDeskController'

function fail(err: any): { ok: false; error: string } {
  return { ok: false, error: String(err?.message ?? err) }
}

/* ------------------------------------------------------------------ *
 * ComfyUI 状态缓存（避免每次 /state 都去打 ComfyUI）
 * ------------------------------------------------------------------ */

let comfyCache: { at: number; value: any } | null = null

async function comfyStatusCached(ctx: Ctx) {
  const ttl = 5000
  if (comfyCache && Date.now() - comfyCache.at < ttl) return comfyCache.value
  let value: any
  try {
    const cfg = await loadConfig()
    value = await comfyStatus(cfg)
  } catch (err: any) {
    value = { ok: false, host: '', message: String(err?.message ?? err), workflowReady: false }
  }
  comfyCache = { at: Date.now(), value }
  return value
}

export function invalidateComfyCache() {
  comfyCache = null
}

/* ------------------------------------------------------------------ *
 * 状态聚合
 * ------------------------------------------------------------------ */

async function buildState(ctx: Ctx): Promise<StatePayload> {
  const db = await loadDB()
  const cfg = await loadConfig()
  const views = toProjectViews(db)
  const buckets = computeBuckets(db, cfg.silentDays)
  const stats = computeStats(db, views, buckets)
  const info = await storageInfo()
  const comfy = await comfyStatusCached(ctx)

  return {
    ok: true,
    now: todayStr(),
    nowTime: new Date().toTimeString().slice(0, 5),
    config: cfg,
    stages: STAGES,
    customers: db.customers,
    projects: views,
    tasks: db.tasks,
    renders: db.renders.slice(0, 60),
    sites: db.sites,
    materials: db.materials,
    refimages: db.refimages,
    buckets,
    stats,
    comfy,
    storage: {
      home: DESK_HOME,
      dataFile: DATA_FILE,
      bytes: info.bytes,
      lastBackup: info.lastBackup,
    },
  }
}

/* ------------------------------------------------------------------ *
 * 领域写操作
 * ------------------------------------------------------------------ */

function upsertCustomer(db: DB, input: any): Customer {
  const now = nowIso()
  const id = input?.id || uid('cus')
  const idx = db.customers.findIndex((c) => c.id === id)
  if (idx >= 0) {
    db.customers[idx] = { ...db.customers[idx], ...input, id, updatedAt: now }
    return db.customers[idx]
  }
  const created: Customer = {
    id,
    name: input?.name?.trim() || '未命名客户',
    phone: input?.phone ?? '',
    wechat: input?.wechat ?? '',
    community: input?.community ?? '',
    roomNo: input?.roomNo ?? '',
    layout: input?.layout ?? '',
    area: input?.area === '' || input?.area === undefined ? undefined : Number(input.area),
    style: input?.style ?? '',
    budget: input?.budget === '' || input?.budget === undefined ? undefined : Number(input.budget),
    family: input?.family ?? '',
    taboo: input?.taboo ?? '',
    note: input?.note ?? '',
    createdAt: now,
    updatedAt: now,
  }
  db.customers.push(created)
  return created
}

/** 新建项目：自动生成第 1 条待办，让用户立刻看到「下一步该干嘛」 */
function createProject(db: DB, input: any, customer: Customer): { project: Project; task: Task } {
  const now = nowIso()
  const today = todayStr()
  const stage1 = stageDef(1)
  const project: Project = {
    id: input?.id || uid('prj'),
    customerId: customer.id,
    name:
      input?.name?.trim() ||
      [customer.community, customer.roomNo].filter(Boolean).join('-') ||
      `${customer.name} 的项目`,
    stage: 1,
    nextAction: stage1.next?.title,
    nextActionAt: stage1.next ? addDaysStr(today, stage1.next.inDays) : undefined,
    amount: input?.amount ? Number(input.amount) : 0,
    logs: [{ at: now, text: `建档，来源：${input?.source?.trim() || '手动录入'}`, stage: 1 }],
    createdAt: now,
    updatedAt: now,
  }
  db.projects.push(project)

  const task: Task = {
    id: uid('tsk'),
    projectId: project.id,
    title: `${stage1.next?.title ?? '联系客户'}（${project.name}）`,
    type: stage1.next?.type ?? '其他',
    dueAt: project.nextActionAt,
    done: false,
    priority: 'P0',
    createdAt: now,
  }
  db.tasks.push(task)
  return { project, task }
}

function completeTaskAndSync(db: DB, task: Task) {
  task.done = true
  task.doneAt = nowIso()
  if (!task.projectId) return
  const prj = db.projects.find((p) => p.id === task.projectId)
  if (!prj) return
  // 若这条待办正是项目的「下次行动」，标记完成时间，但不擅自推进阶段
  if (prj.nextAction && task.title.includes(prj.nextAction)) {
    prj.updatedAt = nowIso()
  }
}

/* ------------------------------------------------------------------ *
 * 渲染结果持久化入口（注入给 comfy 模块，避免双向依赖）
 * ------------------------------------------------------------------ */

export const renderSink: RenderSink = {
  async persist(patch) {
    await mutate((db) => {
      const idx = db.renders.findIndex((r) => r.id === patch.id)
      if (idx >= 0) {
        db.renders[idx] = { ...db.renders[idx], ...(patch as any) }
      } else {
        db.renders.unshift({ items: [], ...(patch as any) } as any)
        if (db.renders.length > 300) db.renders.length = 300
      }
    })
  },
}

/* ------------------------------------------------------------------ *
 * 可选字段归一：表单清空时落undefined 而不是空串
 * （空串会被 dayDiff 算成 NaN，date 类字段尤其致命）
 * ------------------------------------------------------------------ */

const optional = (v: any) => (v === '' || v === undefined ? undefined : v)
const optionalNum = (v: any) => (v === '' || v === undefined ? undefined : Number(v))

/** 评分夹到 1-5。注意 0 是 falsy，必须先判空再取默认，否则 0 会被当成「没填」 */
const clampScore = (v: any) => {
  const n = v === '' || v === undefined || v === null ? NaN : Number(v)
  if (Number.isNaN(n)) return 3
  return Math.max(1, Math.min(5, Math.round(n)))
}

/** 标签：数组直接用，字符串按逗号/空格/中文逗号拆开并去空 */
const parseTags = (v: any): string[] =>
  Array.isArray(v)
    ? v.map((t: any) => String(t).trim()).filter(Boolean)
    : String(v ?? '')
        .split(/[,，\s]+/)
        .map((t: string) => t.trim())
        .filter(Boolean)

/* ================================================================== *
 * 控制器
 * ================================================================== */

/**
 * Remote 命名空间 `designerDesk` 的宿主。
 *
 * 每个 `@Remote` 方法是一个 RPC 端点。客户端 `api('/state')` 会自动映射到
 * `remote.designerDesk.state()`（见 client/kit.ts 的 ENDPOINTS 表）。
 */
export class DeskRemote extends TypertRemoteService {
  /**
   * 依赖业务插件提供的 `designerDesk` 服务。
   *
   * ⚠️ 必须静态声明：cordis 的 context 是注入容器，读没在 inject 里声明的服务会抛
   * `cannot get property "…" without inject`。控制器是独立 Loader entry，
   * 服务由另一条 entry（业务插件）提供，所以在这里等 —— 这是**正确**的激活闸门。
   *
   * 不得声明 `remote.*`：宿主侧不存在该服务，在客户端侧声明会自锁。
   */
  static inject: string[] = ['designerDesk']

  constructor(ctx: Ctx) {
    super(ctx, CONTROLLER_KEY, { namespace: REMOTE_NAMESPACE })
  }

  private svc(): any {
    return (this as any).ctx?.designerDesk
  }

  /* ---------------- 冒烟 ---------------- */

  @Remote
  async health() {
    return {
      ok: true,
      plugin: 'designer-desk',
      namespace: REMOTE_NAMESPACE,
      version: '0.1.0',
      home: DESK_HOME,
      uptimeSec: Math.round(process.uptime()),
    }
  }

  /* ---------------- 状态与配置 ---------------- */

  @Remote
  async state() {
    try {
      const s = await buildState(this.ctx)
      return { ...s, jobs: listJobs() }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async stages() {
    return { ok: true, stages: STAGES, ratios: RATIOS }
  }

  @Remote
  async getConfig() {
    try {
      return { ok: true, config: await loadConfig() }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async setConfig(patch: any) {
    try {
      const config = await saveConfig(patch ?? {})
      invalidateComfyCache()
      return { ok: true, config }
    } catch (err) {
      return fail(err)
    }
  }

  /* ---------------- 项目 ---------------- */

  @Remote
  async projectSave(payload: { project?: any; customer?: any }) {
    try {
      const body = payload ?? {}
      const out = await mutate((db) => {
        const input = body.project ?? {}
        let customer: Customer | undefined
        if (body.customer && Object.keys(body.customer).length) {
          customer = upsertCustomer(db, body.customer)
        }
        if (input?.id) {
          const idx = db.projects.findIndex((p) => p.id === input.id)
          if (idx < 0) throw new Error('项目不存在')
          const merged = { ...db.projects[idx], ...input, updatedAt: nowIso() }
          if (customer) merged.customerId = customer.id
          db.projects[idx] = merged
          return { project: merged, createdTask: null as Task | null }
        }
        const c = customer ?? upsertCustomer(db, body.customer ?? {})
        const { project, task } = createProject(db, input, c)
        return { project, createdTask: task }
      })
      return { ok: true, ...out.result }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async projectAdvance(payload: { id: string; note?: string }) {
    try {
      const out = await mutate((db) => {
        const prj = db.projects.find((p) => p.id === payload?.id)
        if (!prj) throw new Error('项目不存在')
        const res = advanceProject(prj, payload?.note)
        if (res.createdTask) db.tasks.push(res.createdTask)
        return res
      })
      return { ok: true, ...out.result }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async projectDelete(payload: { id: string }) {
    try {
      await mutate((db) => {
        db.projects = db.projects.filter((p) => p.id !== payload?.id)
        db.tasks = db.tasks.filter((t) => t.projectId !== payload?.id)
      })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }

  /** 沉默项目唤醒：一键为沉默项目生成跟进待办 */
  @Remote
  async projectWake(payload: { id: string }) {
    try {
      const out = await mutate((db) => {
        const prj = db.projects.find((p) => p.id === payload?.id)
        if (!prj) throw new Error('项目不存在')
        const title = `跟进回访（${prj.name}）`
        const exists = db.tasks.some((t) => t.projectId === prj.id && !t.done && t.title === title)
        if (exists) return { created: false }
        db.tasks.push({
          id: uid('tsk'),
          projectId: prj.id,
          title,
          type: '回访',
          dueAt: todayStr(),
          done: false,
          priority: 'P0',
          createdAt: nowIso(),
        })
        prj.updatedAt = nowIso()
        return { created: true }
      })
      return { ok: true, ...out.result }
    } catch (err) {
      return fail(err)
    }
  }

  /* ---------------- 待办 ---------------- */

  @Remote
  async taskSave(payload: { task?: any }) {
    try {
      const input = payload?.task ?? {}
      const out = await mutate((db) => {
        if (input?.id) {
          const idx = db.tasks.findIndex((t) => t.id === input.id)
          if (idx >= 0) {
            db.tasks[idx] = { ...db.tasks[idx], ...input }
            return db.tasks[idx]
          }
        }
        const created: Task = {
          id: uid('tsk'),
          projectId: input?.projectId,
          title: String(input?.title ?? '').trim() || '未命名待办',
          type: input?.type ?? '其他',
          dueAt: input?.dueAt || undefined,
          done: Boolean(input?.done),
          priority: input?.priority ?? 'P1',
          createdAt: nowIso(),
        }
        db.tasks.push(created)
        return created
      })
      return { ok: true, task: out.result }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async taskToggle(payload: { id: string; done?: boolean }) {
    try {
      const out = await mutate((db) => {
        const task = db.tasks.find((t) => t.id === payload?.id)
        if (!task) throw new Error('待办不存在')
        const wantDone = payload?.done === undefined ? !task.done : Boolean(payload.done)
        if (wantDone) completeTaskAndSync(db, task)
        else {
          task.done = false
          task.doneAt = undefined
        }
        return task
      })
      return { ok: true, task: out.result }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async taskPostpone(payload: { id: string; days?: number }) {
    try {
      const days = Math.max(1, Number(payload?.days) || 1)
      const out = await mutate((db) => {
        const task = db.tasks.find((t) => t.id === payload?.id)
        if (!task) throw new Error('待办不存在')
        const today = todayStr()
        const base = task.dueAt && task.dueAt > today ? task.dueAt : today
        task.postponedFrom = task.postponedFrom ?? task.dueAt
        task.dueAt = addDaysStr(base, days)
        return task
      })
      return { ok: true, task: out.result }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async taskDelete(payload: { id: string }) {
    try {
      await mutate((db) => {
        db.tasks = db.tasks.filter((t) => t.id !== payload?.id)
      })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async today() {
    try {
      const db = await loadDB()
      const cfg = await loadConfig()
      const views = toProjectViews(db)
      const buckets = computeBuckets(db, cfg.silentDays)
      return {
        ok: true,
        now: todayStr(),
        overdue: sortTasks(buckets.overdue),
        todayTasks: sortTasks(buckets.today),
        soon: sortTasks(buckets.soon),
        silent: buckets.silent,
        projects: views,
      }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async openTasks() {
    try {
      const db = await loadDB()
      return { ok: true, tasks: sortTasks(db.tasks.filter((t) => !t.done)) }
    } catch (err) {
      return fail(err)
    }
  }

  /* ---------------- 备份 / 导入 / 示例数据 ---------------- */

  @Remote
  async exportData() {
    try {
      const { db, config } = await (async () => {
        const d = await loadDB()
        const c = await loadConfig()
        return { db: d, config: c }
      })()
      const stamp = nowIso().replace(/[:.]/g, '-').slice(0, 19)
      return {
        ok: true,
        file: `${DESK_HOME}/backup-${stamp}.json`,
        payload: {
          kind: 'designer-desk-backup',
          exportedAt: nowIso(),
          db,
          config,
        },
      }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async importData(payload: any) {
    try {
      const next = payload?.db ?? payload?.payload?.db ?? payload
      if (!next || typeof next !== 'object') throw new Error('备份内容格式不对')
      await replaceDB(next)
      if (payload?.payload?.config) await saveConfig(payload.payload.config)
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async seedDemoData() {
    try {
      await mutate((db) => {
        seedDemo(db)
      })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async seedClear() {
    try {
      await mutate((db) => {
        clearAll(db)
      })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }

  /* ---------------- 效果图（M3） ---------------- */

  @Remote
  async comfyStatus() {
    return await comfyStatusCached(this.ctx)
  }

  @Remote
  async renderSubmit(payload: any) {
    try {
      const cfg = await loadConfig()
      const db = await loadDB()
      const prj = payload?.projectId ? db.projects.find((p) => p.id === payload.projectId) : undefined
      const label = prj?.name || payload?.projectLabel || 'unassigned'
      return await submitRender(
        cfg,
        {
          projectId: payload?.projectId,
          projectLabel: label,
          space: payload?.space,
          style: payload?.style,
          materials: payload?.materials,
          light: payload?.light,
          ratio: payload?.ratio,
          count: payload?.count,
          seed: payload?.seed === '' || payload?.seed === undefined ? undefined : Number(payload.seed),
          promptOverride: payload?.promptOverride,
        },
        renderSink,
      )
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async renderJob(payload: { jobId?: string }) {
    try {
      if (!payload?.jobId) return { ok: false, error: '缺少 jobId' }
      const job = getJob(payload.jobId)
      if (!job) return { ok: false, error: '任务不存在或已过期' }
      return { ok: true, job }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async renderImage(payload: { renderId?: string; index?: number }) {
    try {
      if (!payload?.renderId) return { ok: false, error: '缺少 renderId' }
      const index = Number(payload?.index ?? 0) || 0
      const db = await loadDB()
      const rec = db.renders.find((r) => r.id === payload.renderId)
      if (!rec) return { ok: false, error: '记录不存在' }
      const item = rec.items?.[index]
      if (!item) return { ok: false, error: '图片不存在' }
      const cfg = await loadConfig()
      const { dataUrl, source } = await readRenderImage(cfg, item)
      return { ok: true, dataUrl, source, filename: item.filename }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async renderDelete(payload: { id: string }) {
    try {
      await mutate((db) => {
        db.renders = db.renders.filter((r) => r.id !== payload?.id)
      })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async renderDir(payload: { projectLabel?: string }) {
    try {
      return { ok: true, dir: renderDirFor(payload?.projectLabel || 'unassigned', ymd(new Date())) }
    } catch (err) {
      return fail(err)
    }
  }

  /* ---------------- 工地巡检（M4） ---------------- */

  @Remote
  async siteSave(payload: { site?: any }) {
    try {
      const input = payload?.site ?? {}
      const out = await mutate((db) => {
        const normalize = (s: any) => ({
          ...s,
          plannedAt: optional(s.plannedAt),
          doneAt: optional(s.doneAt),
          note: s.note ?? '',
          photos: Array.isArray(s.photos) ? s.photos : [],
        })
        if (input?.id) {
          const idx = db.sites.findIndex((s) => s.id === input.id)
          if (idx >= 0) {
            db.sites[idx] = normalize({ ...db.sites[idx], ...input, updatedAt: nowIso() })
            return db.sites[idx]
          }
        }
        const created: any = normalize({
          id: uid('site'),
          projectId: String(input?.projectId ?? ''),
          node: input?.node ?? '水电',
          status: input?.status ?? '待巡检',
          plannedAt: optional(input?.plannedAt),
          doneAt: optional(input?.doneAt),
          note: input?.note ?? '',
          photos: Array.isArray(input?.photos) ? input.photos : [],
          createdAt: nowIso(),
          updatedAt: nowIso(),
        })
        db.sites.push(created)
        return created
      })
      return { ok: true, site: out.result }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async siteDelete(payload: { id: string }) {
    try {
      await mutate((db) => {
        db.sites = db.sites.filter((s) => s.id !== payload?.id)
      })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }

  /* ---------------- 材料进场（M5） ---------------- */

  @Remote
  async materialSave(payload: { material?: any }) {
    try {
      const input = payload?.material ?? {}
      const out = await mutate((db) => {
        const normalize = (m: any) => ({
          ...m,
          category: optional(m.category) ?? '',
          brand: optional(m.brand) ?? '',
          spec: optional(m.spec) ?? '',
          unit: optional(m.unit) ?? '',
          supplier: optional(m.supplier) ?? '',
          note: optional(m.note) ?? '',
          price: optionalNum(m.price),
          qty: optionalNum(m.qty),
          arriveAt: optional(m.arriveAt),
        })
        if (input?.id) {
          const idx = db.materials.findIndex((m) => m.id === input.id)
          if (idx >= 0) {
            db.materials[idx] = normalize({ ...db.materials[idx], ...input, updatedAt: nowIso() })
            return db.materials[idx]
          }
        }
        const created: any = normalize({
          id: uid('mat'),
          projectId: String(input?.projectId ?? ''),
          name: String(input?.name ?? '').trim() || '未命名材料',
          category: input?.category ?? '',
          brand: input?.brand ?? '',
          spec: input?.spec ?? '',
          price: optionalNum(input?.price),
          qty: optionalNum(input?.qty),
          unit: input?.unit ?? '',
          supplier: input?.supplier ?? '',
          arriveAt: optional(input?.arriveAt),
          status: input?.status ?? '待下单',
          note: input?.note ?? '',
          createdAt: nowIso(),
          updatedAt: nowIso(),
        })
        db.materials.push(created)
        return created
      })
      return { ok: true, material: out.result }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async materialDelete(payload: { id: string }) {
    try {
      await mutate((db) => {
        db.materials = db.materials.filter((m) => m.id !== payload?.id)
      })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }

  /* ---------------- 灵感素材库（M6） ---------------- */

  @Remote
  async refimageSave(payload: { refimage?: any }) {
    try {
      const input = payload?.refimage ?? {}
      const out = await mutate((db) => {
        const normalize = (r: any) => ({
          ...r,
          title: r.title ?? '',
          url: optional(r.url),
          thumb: optional(r.thumb),
          source: r.source ?? '',
          tags: parseTags(r.tags),
          score: clampScore(r.score),
          projectId: optional(r.projectId),
        })
        if (input?.id) {
          const idx = db.refimages.findIndex((r) => r.id === input.id)
          if (idx >= 0) {
            db.refimages[idx] = normalize({ ...db.refimages[idx], ...input })
            return db.refimages[idx]
          }
        }
        const created: any = normalize({
          id: uid('ref'),
          title: input?.title ?? '',
          url: input?.url ?? '',
          thumb: input?.thumb ?? '',
          tags: input?.tags,
          score: input?.score,
          source: input?.source ?? '',
          projectId: input?.projectId,
          createdAt: nowIso(),
        })
        db.refimages.push(created)
        return created
      })
      return { ok: true, refimage: out.result }
    } catch (err) {
      return fail(err)
    }
  }

  @Remote
  async refimageDelete(payload: { id: string }) {
    try {
      await mutate((db) => {
        db.refimages = db.refimages.filter((r) => r.id !== payload?.id)
      })
      return { ok: true }
    } catch (err) {
      return fail(err)
    }
  }
}

export default DeskRemote
