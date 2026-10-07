/**
 * designer-desk · 接口层
 *
 * 职责边界（铁律 9 分层）：只做「收请求 → 调计算层/数据层 → 返回 JSON」，
 * 不包含任何业务算法，也不触发其它渲染逻辑。
 *
 * 所有路由统一挂在 /designer-desk/ 前缀下，与包名一致。
 */
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
import {
  RATIOS,
  comfyStatus,
  getJob,
  listJobs,
  readRenderImage,
  submitRender,
} from './comfy'
import type { RenderSink } from './comfy'
import {
  STAGES,
  addDaysStr,
  nowIso,
  stageDef,
  todayStr,
  uid,
  ymd,
} from './types'
import type { Customer, DB, MaterialItem, Project, RefImage, RenderRecord, SiteInspection, StatePayload, Task } from './types'

type Ctx = any
type Req = any

const PREFIX = '/designer-desk'

/* ------------------------------------------------------------------ *
 * 请求取值工具（对 router 的实现差异做防御）
 * ------------------------------------------------------------------ */

function q(req: Req, key: string): string | undefined {
  const direct = req?.query?.[key] ?? req?.params?.[key]
  if (direct !== undefined && direct !== null) return String(direct)
  const url = typeof req?.url === 'string' ? req.url : req?.raw?.url
  if (typeof url === 'string') {
    const i = url.indexOf('?')
    if (i >= 0) {
      const v = new URLSearchParams(url.slice(i + 1)).get(key)
      if (v !== null) return v
    }
  }
  return undefined
}

async function readBody(req: Req): Promise<any> {
  try {
    if (typeof req?.json === 'function') {
      const v = await req.json()
      if (v !== undefined && v !== null) return v
    }
    if (req?.body && typeof req.body === 'object') return req.body
    if (typeof req?.body === 'string' && req.body.trim()) return JSON.parse(req.body)
    const raw = req?.raw?.body
    if (raw) return typeof raw === 'string' ? JSON.parse(raw) : raw
  } catch {
    /* fallthrough */
  }
  return {}
}

function fail(error: unknown) {
  return { ok: false, error: String((error as any)?.message ?? error) }
}

/* ------------------------------------------------------------------ *
 * ComfyUI 状态缓存（避免 /state 每次都去探活）
 * ------------------------------------------------------------------ */

let comfyCache: { at: number; value: any } | null = null

async function comfyStatusCached(ctx: Ctx, force = false) {
  const ttl = 15000
  if (!force && comfyCache && Date.now() - comfyCache.at < ttl) return comfyCache.value
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
 * 渲染结果持久化入口（注入给 comfy 模块，避免双向依赖）
 * ------------------------------------------------------------------ */

const renderSink: RenderSink = {
  async persist(patch) {
    await mutate((db) => {
      const idx = db.renders.findIndex((r) => r.id === patch.id)
      if (idx >= 0) {
        db.renders[idx] = { ...db.renders[idx], ...(patch as any) }
      } else {
        db.renders.unshift({ items: [], ...(patch as any) } as RenderRecord)
        if (db.renders.length > 300) db.renders.length = 300
      }
    })
  },
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
 * 路由注册
 * ------------------------------------------------------------------ */

export function registerRoutes(ctx: Ctx): () => void {
  const dispose = ctx.webServer.register((router: any) => {
    /* ---------------- 冒烟 ---------------- */

    router.get(`${PREFIX}/health`, async () => ({
      ok: true,
      plugin: ctx.name ?? 'designer-desk',
      version: '0.1.0',
      home: DESK_HOME,
      uptimeSec: Math.round(process.uptime()),
    }))

    /* ---------------- 状态与配置 ---------------- */

    router.get(`${PREFIX}/state`, async () => {
      try {
        const state = await buildState(ctx)
        return { ...state, jobs: listJobs() }
      } catch (err) {
        return fail(err)
      }
    })

    router.get(`${PREFIX}/stages`, async () => ({ ok: true, stages: STAGES, ratios: RATIOS }))

    router.get(`${PREFIX}/config`, async () => {
      try {
        return { ok: true, config: await loadConfig() }
      } catch (err) {
        return fail(err)
      }
    })

    router.post(`${PREFIX}/config`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const config = await saveConfig(body?.patch ?? body ?? {})
        invalidateComfyCache()
        return { ok: true, config }
      } catch (err) {
        return fail(err)
      }
    })

    /* ---------------- 项目 ---------------- */

    router.post(`${PREFIX}/project/save`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const out = await mutate((db) => {
          const input = body?.project ?? {}
          let customer: Customer | undefined
          if (body?.customer && Object.keys(body.customer).length) {
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
          const c = customer ?? upsertCustomer(db, body?.customer ?? {})
          const { project, task } = createProject(db, input, c)
          return { project, createdTask: task }
        })
        return { ok: true, ...out.result }
      } catch (err) {
        return fail(err)
      }
    })

    router.post(`${PREFIX}/project/advance`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const out = await mutate((db) => {
          const prj = db.projects.find((p) => p.id === body?.id)
          if (!prj) throw new Error('项目不存在')
          const res = advanceProject(prj, body?.note)
          if (res.createdTask) db.tasks.push(res.createdTask)
          return res
        })
        return { ok: true, ...out.result }
      } catch (err) {
        return fail(err)
      }
    })

    router.post(`${PREFIX}/project/delete`, async (req: Req) => {
      try {
        const body = await readBody(req)
        await mutate((db) => {
          db.projects = db.projects.filter((p) => p.id !== body?.id)
          db.tasks = db.tasks.filter((t) => t.projectId !== body?.id)
        })
        return { ok: true }
      } catch (err) {
        return fail(err)
      }
    })

    /* ---------------- 待办 ---------------- */

    router.post(`${PREFIX}/task/save`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const out = await mutate((db) => {
          const input = body?.task ?? {}
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
    })

    router.post(`${PREFIX}/task/toggle`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const out = await mutate((db) => {
          const task = db.tasks.find((t) => t.id === body?.id)
          if (!task) throw new Error('待办不存在')
          const wantDone = body?.done === undefined ? !task.done : Boolean(body.done)
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
    })

    router.post(`${PREFIX}/task/postpone`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const days = Math.max(1, Number(body?.days) || 1)
        const out = await mutate((db) => {
          const task = db.tasks.find((t) => t.id === body?.id)
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
    })

    router.post(`${PREFIX}/task/delete`, async (req: Req) => {
      try {
        const body = await readBody(req)
        await mutate((db) => {
          db.tasks = db.tasks.filter((t) => t.id !== body?.id)
        })
        return { ok: true }
      } catch (err) {
        return fail(err)
      }
    })

    /** 沉默项目唤醒：一键为沉默项目生成跟进待办 */
    router.post(`${PREFIX}/project/wake`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const out = await mutate((db) => {
          const prj = db.projects.find((p) => p.id === body?.id)
          if (!prj) throw new Error('项目不存在')
          const title = `跟进回访（${prj.name}）`
          const exists = db.tasks.some((t) => t.projectId === prj.id && !t.done && t.title === title)
          if (exists) return { created: false }
          db.tasks.push({
            id: uid('tsk'),
            projectId: prj.id,
            title,
            type: '回访',
            dueAt: addDaysStr(todayStr(), 1),
            done: false,
            priority: 'P0',
            createdAt: nowIso(),
          })
          prj.updatedAt = nowIso()
          prj.logs = Array.isArray(prj.logs) ? prj.logs : []
          prj.logs.push({ at: nowIso(), text: '沉默项目唤醒：生成跟进待办', stage: prj.stage })
          return { created: true }
        })
        return { ok: true, ...out.result }
      } catch (err) {
        return fail(err)
      }
    })

    /* ---------------- 示例数据 ---------------- */

    router.post(`${PREFIX}/seed/demo`, async () => {
      try {
        await mutate((db) => {
          const seeded = seedDemo(db)
          db.customers = seeded.customers
          db.projects = seeded.projects
          db.tasks = seeded.tasks
        })
        return { ok: true }
      } catch (err) {
        return fail(err)
      }
    })

    router.post(`${PREFIX}/seed/clear`, async () => {
      try {
        await mutate((db) => {
          const empty = clearAll(db)
          db.customers = empty.customers
          db.projects = empty.projects
          db.tasks = empty.tasks
          db.renders = empty.renders
        })
        return { ok: true }
      } catch (err) {
        return fail(err)
      }
    })

    /* ---------------- 备份 ---------------- */

    router.get(`${PREFIX}/export`, async () => {
      try {
        const db = await loadDB()
        const config = await loadConfig()
        const payload = { kind: 'designer-desk-backup', version: 1, exportedAt: nowIso(), db, config }
        const file = `${DESK_HOME}/backup-${nowIso().replace(/[:.]/g, '-')}.json`
        const fs = await import('node:fs/promises')
        await fs.writeFile(file, JSON.stringify(payload, null, 2), 'utf8')
        return { ok: true, file, payload }
      } catch (err) {
        return fail(err)
      }
    })

    router.post(`${PREFIX}/import`, async (req: Req) => {
      try {
        const body = await readBody(req)
        let payload = body?.payload
        if (!payload && typeof body?.text === 'string') payload = JSON.parse(body.text)
        if (typeof payload === 'string') payload = JSON.parse(payload)
        if (!payload || typeof payload !== 'object') throw new Error('导入内容为空或格式不正确')
        const incoming = payload.db ?? payload
        if (!Array.isArray(incoming?.customers) && !Array.isArray(incoming?.projects)) {
          throw new Error('导入内容里没有 customers / projects，可能不是本插件导出的备份')
        }
        await replaceDB(incoming as DB)
        if (payload.config) await saveConfig(payload.config)
        invalidateComfyCache()
        return { ok: true }
      } catch (err) {
        return fail(err)
      }
    })

    /* ---------------- 效果图 ---------------- */

    router.get(`${PREFIX}/comfy/status`, async (req: Req) => {
      try {
        const force = q(req, 'force') === '1'
        return { ok: true, comfy: await comfyStatusCached(ctx, force), ratios: RATIOS, jobs: listJobs() }
      } catch (err) {
        return fail(err)
      }
    })

    router.post(`${PREFIX}/comfy/render`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const cfg = await loadConfig()
        const db = await loadDB()
        const prj = body?.projectId ? db.projects.find((p) => p.id === body.projectId) : undefined
        const label = prj?.name || body?.projectLabel || 'unassigned'
        const res = await submitRender(
          cfg,
          {
            projectId: body?.projectId,
            projectLabel: label,
            space: body?.space,
            style: body?.style,
            materials: body?.materials,
            light: body?.light,
            ratio: body?.ratio,
            count: body?.count,
            seed: body?.seed === '' || body?.seed === undefined ? undefined : Number(body.seed),
            promptOverride: body?.promptOverride,
          },
          renderSink,
        )
        return res
      } catch (err) {
        return fail(err)
      }
    })

    router.get(`${PREFIX}/comfy/job`, async (req: Req) => {
      const jobId = q(req, 'jobId')
      if (!jobId) return { ok: false, error: '缺少 jobId' }
      const job = getJob(jobId)
      if (!job) return { ok: false, error: '任务不存在或已过期' }
      return { ok: true, job }
    })

    router.get(`${PREFIX}/render/image`, async (req: Req) => {
      try {
        const renderId = q(req, 'renderId')
        const index = Number(q(req, 'index') ?? 0) || 0
        if (!renderId) return { ok: false, error: '缺少 renderId' }
        const db = await loadDB()
        const rec = db.renders.find((r) => r.id === renderId)
        if (!rec) return { ok: false, error: '记录不存在' }
        const item = rec.items?.[index]
        if (!item) return { ok: false, error: '图片不存在' }
        const cfg = await loadConfig()
        const { dataUrl, source } = await readRenderImage(cfg, item)
        return { ok: true, dataUrl, source, filename: item.filename }
      } catch (err) {
        return fail(err)
      }
    })

    router.post(`${PREFIX}/render/delete`, async (req: Req) => {
      try {
        const body = await readBody(req)
        await mutate((db) => {
          db.renders = db.renders.filter((r) => r.id !== body?.id)
        })
        return { ok: true }
      } catch (err) {
        return fail(err)
      }
    })

    /* ---------------- 供命令层复用的小工具路由 ---------------- */

    router.get(`${PREFIX}/today`, async () => {
      try {
        const db = await loadDB()
        const cfg = await loadConfig()
        const buckets = computeBuckets(db, cfg.silentDays)
        return {
          ok: true,
          date: todayStr(),
          overdue: buckets.overdue,
          today: buckets.today,
          soon: buckets.soon,
          noDate: buckets.noDate,
          silent: buckets.silent,
        }
      } catch (err) {
        return fail(err)
      }
    })

    router.get(`${PREFIX}/tasks`, async () => {
      try {
        const db = await loadDB()
        return { ok: true, tasks: sortTasks(db.tasks.filter((t) => !t.done)) }
      } catch (err) {
        return fail(err)
      }
    })

    router.get(`${PREFIX}/render-dir`, async (req: Req) => {
      const label = q(req, 'projectLabel') || 'unassigned'
      return { ok: true, dir: renderDirFor(label, ymd(new Date())) }
    })

    /* ---------------- 工地巡检（M4） ---------------- */

    router.post(`${PREFIX}/site/save`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const out = await mutate((db) => {
          const input = body?.site ?? {}
          const optional = (v: any) => (v === '' || v === undefined ? undefined : v)
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
          const created: SiteInspection = normalize({
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
    })

    router.post(`${PREFIX}/site/delete`, async (req: Req) => {
      try {
        const body = await readBody(req)
        await mutate((db) => {
          db.sites = db.sites.filter((s) => s.id !== body?.id)
        })
        return { ok: true }
      } catch (err) {
        return fail(err)
      }
    })

    /* ---------------- 材料进场（M5） ---------------- */

    router.post(`${PREFIX}/material/save`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const out = await mutate((db) => {
          const input = body?.material ?? {}
          // 表单里清空的可选字段一律归一成 undefined，避免库里留下 "" 与 undefined 混用
          const optional = (v: any) => (v === '' || v === undefined ? undefined : v)
          const optionalNum = (v: any) => (v === '' || v === undefined ? undefined : Number(v))
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
          const created: MaterialItem = normalize({
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
    })

    router.post(`${PREFIX}/material/delete`, async (req: Req) => {
      try {
        const body = await readBody(req)
        await mutate((db) => {
          db.materials = db.materials.filter((m) => m.id !== body?.id)
        })
        return { ok: true }
      } catch (err) {
        return fail(err)
      }
    })

    /* ---------------- 灵感素材库（M6） ---------------- */

    router.post(`${PREFIX}/refimage/save`, async (req: Req) => {
      try {
        const body = await readBody(req)
        const out = await mutate((db) => {
          const input = body?.refimage ?? {}
          const optional = (v: any) => (v === '' || v === undefined ? undefined : v)
          /** 标签：数组直接用，字符串按逗号/空格/中文逗号拆开并去空 */
          const parseTags = (v: any): string[] =>
            Array.isArray(v)
              ? v.map((t: any) => String(t).trim()).filter(Boolean)
              : String(v ?? '')
                  .split(/[,，\s]+/)
                  .map((t: string) => t.trim())
                  .filter(Boolean)
          /** 评分夹到 1-5。注意 0 是 falsy，必须先判 undefined/null 再取默认，否则 0 会被当成「没填」 */
          const clampScore = (v: any) => {
            const n = v === '' || v === undefined || v === null ? NaN : Number(v)
            if (Number.isNaN(n)) return 3
            return Math.max(1, Math.min(5, Math.round(n)))
          }
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
          const created: RefImage = normalize({
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
    })

    router.post(`${PREFIX}/refimage/delete`, async (req: Req) => {
      try {
        const body = await readBody(req)
        await mutate((db) => {
          db.refimages = db.refimages.filter((r) => r.id !== body?.id)
        })
        return { ok: true }
      } catch (err) {
        return fail(err)
      }
    })
  })

  return () => {
    try {
      if (typeof dispose === 'function') dispose()
    } catch {
      /* ignore */
    }
  }
}
