/**
 * designer-desk · ComfyUI 客户端
 *
 * 定位：不重复造 ComfyUI，只做它不做的两件事 ——
 *   ① 把项目上下文注入工作流（按节点 ID 注入，用户无需改工作流）
 *   ② 把结果归档回项目
 *
 * 必须避开的坑：
 *   - 工作流必须是「API 格式」（ComfyUI 界面 Workflow → Export (API)），
 *     UI 格式 JSON 提交 /prompt 会直接失败。
 *   - 出图是长任务，提交后拿到 prompt_id 必须异步轮询 /history，不能同步阻塞。
 *   - 所有失败都要能降级，不能把主业务拖崩。
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { nowIso, uid } from './types'
import type { DeskConfig, NodeSlot, RenderItem, RenderRecord } from './types'
import { renderDirFor } from './store'

/* ------------------------------------------------------------------ *
 * 常用分辨率（64 的倍数，对 SDXL 友好）
 * ------------------------------------------------------------------ */

export const RATIOS: Record<string, { width: number; height: number; label: string }> = {
  '16:9': { width: 1344, height: 768, label: '16:9 横构图' },
  '3:2': { width: 1216, height: 832, label: '3:2 横构图' },
  '4:3': { width: 1152, height: 896, label: '4:3 横构图' },
  '1:1': { width: 1024, height: 1024, label: '1:1 方图' },
  '3:4': { width: 896, height: 1152, label: '3:4 竖构图' },
  '9:16': { width: 768, height: 1344, label: '9:16 手机竖屏' },
  '21:9': { width: 1536, height: 640, label: '21:9 全景' },
}

/* ------------------------------------------------------------------ *
 * Job 注册表（内存即可，进程重启后由 renders 表兜底展示）
 * ------------------------------------------------------------------ */

export interface JobState {
  jobId: string
  renderId: string
  projectId?: string
  status: 'queued' | 'running' | 'done' | 'failed'
  promptId?: string
  progress: number
  message: string
  items: RenderItem[]
  error?: string
  startedAt: string
  updatedAt: string
}

const jobs = new Map<string, JobState>()
const JOB_KEEP = 60

function rememberJob(job: JobState) {
  jobs.set(job.jobId, job)
  if (jobs.size > JOB_KEEP) {
    const oldest = [...jobs.values()].sort((a, b) => (a.startedAt < b.startedAt ? -1 : 1))[0]
    if (oldest) jobs.delete(oldest.jobId)
  }
}

export function getJob(jobId: string): JobState | undefined {
  return jobs.get(jobId)
}

export function listJobs(): JobState[] {
  return [...jobs.values()].sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
}

/* ------------------------------------------------------------------ *
 * 基础 HTTP
 * ------------------------------------------------------------------ */

function baseUrl(cfg: DeskConfig): string {
  const host = String(cfg.comfyHost || '').trim().replace(/\/+$/, '')
  return host || 'http://127.0.0.1:8188'
}

async function fetchJson(url: string, timeoutMs = 8000): Promise<any> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ac.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function postJson(url: string, body: unknown, timeoutMs = 15000): Promise<any> {
  const ac = new AbortController()
  const timer = setTimeout(() => ac.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
      signal: ac.signal,
    })
    const text = await res.text()
    if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 300)}`)
    try {
      return JSON.parse(text)
    } catch {
      return text
    }
  } finally {
    clearTimeout(timer)
  }
}

export function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/* ------------------------------------------------------------------ *
 * 探活
 * ------------------------------------------------------------------ */

export interface ComfyStatus {
  ok: boolean
  host: string
  message: string
  workflowReady: boolean
  system?: any
}

export async function comfyStatus(cfg: DeskConfig): Promise<ComfyStatus> {
  const host = baseUrl(cfg)
  const workflowReady = Boolean(cfg.workflowPath) && Boolean(cfg.nodeMap?.positive?.node)
  try {
    const stats = await fetchJson(`${host}/system_stats`, 4000)
    return {
      ok: true,
      host,
      message: workflowReady ? '已连接，工作流就绪' : '已连接，但还没配置工作流（去设置面板填）',
      workflowReady,
      system: stats,
    }
  } catch (err: any) {
    return {
      ok: false,
      host,
      message: `未连接（${err?.message ?? '连接失败'}）—— 请确认 ComfyUI 已启动`,
      workflowReady,
    }
  }
}

/* ------------------------------------------------------------------ *
 * 工作流加载与注入
 * ------------------------------------------------------------------ */

interface WorkflowCache {
  file: string
  mtimeMs: number
  json: any
}
let wfCache: WorkflowCache | null = null

export async function loadWorkflow(cfg: DeskConfig, force = false): Promise<any> {
  const file = String(cfg.workflowPath || '').trim()
  if (!file) throw new Error('未配置工作流文件路径，请到设置面板填写（必须是 API 格式 JSON）')
  const stat = await fs.stat(file).catch(() => null)
  if (!stat) throw new Error(`工作流文件不存在：${file}`)
  if (!force && wfCache && wfCache.file === file && wfCache.mtimeMs === stat.mtimeMs) {
    return JSON.parse(JSON.stringify(wfCache.json))
  }
  const raw = await fs.readFile(file, 'utf8')
  let json: any
  try {
    json = JSON.parse(raw)
  } catch {
    throw new Error('工作流 JSON 解析失败 —— 请确认导出的是 API 格式')
  }
  // API 格式的特征：顶层是 { "节点ID": { class_type, inputs } }
  const keys = Object.keys(json ?? {})
  if (!keys.length) throw new Error('工作流为空')
  const first = json[keys[0]]
  if (!first || typeof first !== 'object' || !('class_type' in first) || !('inputs' in first)) {
    throw new Error(
      '这看起来不是 API 格式的工作流 —— 请在 ComfyUI 里用 Workflow → Export (API) 重新导出',
    )
  }
  wfCache = { file, mtimeMs: stat.mtimeMs, json }
  return JSON.parse(JSON.stringify(json))
}

function setInput(wf: any, slot: NodeSlot | undefined, value: unknown): boolean {
  if (!slot || !slot.node) return false
  const node = wf?.[slot.node]
  if (!node || typeof node !== 'object') return false
  if (!node.inputs || typeof node.inputs !== 'object') node.inputs = {}
  node.inputs[slot.input || 'text'] = value
  return true
}

function findNodeIdByInput(wf: any, key: string): string | undefined {
  for (const id of Object.keys(wf ?? {})) {
    const node = wf[id]
    if (node?.inputs && key in node.inputs) return id
  }
  return undefined
}

export interface InjectResult {
  workflow: any
  applied: string[]
  missing: string[]
  width: number
  height: number
  seed: number
}

export function injectWorkflow(
  wf: any,
  cfg: DeskConfig,
  opts: { prompt: string; negative: string; ratio: string; count: number; seed?: number },
): InjectResult {
  const ratio = RATIOS[opts.ratio] ?? RATIOS['16:9']
  const width = ratio.width
  const height = ratio.height
  const seed = Number.isFinite(opts.seed) && (opts.seed as number) >= 0
    ? Math.floor(opts.seed as number)
    : Math.floor(Math.random() * 1_000_000_000)

  const nm = cfg.nodeMap ?? ({} as any)
  const applied: string[] = []
  const missing: string[] = []

  const trySet = (label: string, slot: NodeSlot | undefined, value: unknown) => {
    if (!slot || !slot.node) return
    if (setInput(wf, slot, value)) applied.push(label)
    else missing.push(label)
  }

  trySet('正向提示词', nm.positive, opts.prompt)
  trySet('负向提示词', nm.negative, opts.negative)
  trySet('种子', nm.seed, seed)
  trySet('宽度', nm.width, width)
  trySet('高度', nm.height, height)
  trySet('批量张数', nm.batch, Math.max(1, Math.min(8, opts.count)))

  // 兜底：用户没填宽高节点时，尝试自动找
  if (!nm.width?.node) {
    const id = findNodeIdByInput(wf, 'width')
    if (id) {
      wf[id].inputs.width = width
      applied.push('宽度（自动识别）')
    }
  }
  if (!nm.height?.node) {
    const id = findNodeIdByInput(wf, 'height')
    if (id) {
      wf[id].inputs.height = height
      applied.push('高度（自动识别）')
    }
  }

  return { workflow: wf, applied, missing, width, height, seed }
}

/* ------------------------------------------------------------------ *
 * 提示词拼装
 * ------------------------------------------------------------------ */

const LIGHT_PRESETS: Record<string, string> = {
  '自然光': 'soft natural daylight from large windows',
  '暖光': 'warm cozy lighting, 3000K, ambient glow',
  '冷光': 'cool even lighting, 5000K, crisp',
  '夜景': 'evening ambience, layered artificial lighting, glowing accents',
  '无主灯': 'no main chandelier, layered lighting with recessed spots and cove light',
}

export function buildPrompt(
  cfg: DeskConfig,
  req: { promptOverride?: string; space?: string; style?: string; materials?: string; light?: string },
): string {
  if (req.promptOverride?.trim()) return req.promptOverride.trim()
  const template = cfg.promptTemplate || '{space}, {style} style, {materials}, {light}'
  const light = LIGHT_PRESETS[req.light ?? ''] ?? req.light ?? 'soft natural light'
  return template
    .replace(/\{space\}/g, req.space?.trim() || 'living room')
    .replace(/\{style\}/g, req.style?.trim() || 'modern minimal')
    .replace(/\{materials\}/g, req.materials?.trim() || 'wood, stone, linen textures')
    .replace(/\{light\}/g, light)
    .replace(/\s{2,}/g, ' ')
    .replace(/,\s*,/g, ',')
    .trim()
}

/* ------------------------------------------------------------------ *
 * 结果抽取与归档
 * ------------------------------------------------------------------ */

function extractItems(entry: any): RenderItem[] {
  const items: RenderItem[] = []
  const outputs = entry?.outputs ?? {}
  for (const nodeId of Object.keys(outputs)) {
    const out = outputs[nodeId] ?? {}
    for (const key of ['images', 'gifs', 'videos']) {
      const arr = out[key]
      if (!Array.isArray(arr)) continue
      for (const it of arr) {
        if (!it?.filename) continue
        if (it.type === 'temp') continue
        if (!/\.(png|jpe?g|webp|gif|mp4)$/i.test(it.filename)) continue
        items.push({
          filename: it.filename,
          subfolder: it.subfolder ?? '',
          type: it.type ?? 'output',
        })
      }
    }
  }
  return items
}

async function archiveItems(
  cfg: DeskConfig,
  items: RenderItem[],
  projectLabel: string,
  date: string,
): Promise<RenderItem[]> {
  const outDir = String(cfg.comfyOutputDir || '').trim()
  if (!outDir) return items // 未配置 output 目录 → 走 /view 代理兜底

  const target = renderDirFor(projectLabel, date)
  await fs.mkdir(target, { recursive: true })

  const archived: RenderItem[] = []
  for (const it of items) {
    const src = path.join(outDir, it.subfolder || '', it.filename)
    const dst = path.join(target, it.filename)
    try {
      await fs.copyFile(src, dst)
      archived.push({ ...it, file: dst })
    } catch {
      archived.push(it)
    }
  }
  return archived
}

/** 读取归档文件为 dataURL；未归档则用 ComfyUI /view 代理 */
export async function readRenderImage(
  cfg: DeskConfig,
  item: RenderItem,
): Promise<{ dataUrl: string; source: 'archive' | 'comfy-proxy' }> {
  if (item.file) {
    try {
      const buf = await fs.readFile(item.file)
      return { dataUrl: toDataUrl(buf, item.filename), source: 'archive' }
    } catch {
      /* 归档丢失 → 走代理 */
    }
  }
  const qs = new URLSearchParams({
    filename: item.filename,
    subfolder: item.subfolder || '',
    type: item.type || 'output',
  })
  const res = await fetch(`${baseUrl(cfg)}/view?${qs.toString()}`)
  if (!res.ok) throw new Error(`读取图片失败 HTTP ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  return { dataUrl: toDataUrl(buf, item.filename), source: 'comfy-proxy' }
}

function toDataUrl(buf: Buffer, filename: string): string {
  const ext = (filename.split('.').pop() ?? 'png').toLowerCase()
  const mime =
    ext === 'jpg' || ext === 'jpeg' ? 'image/jpeg'
    : ext === 'webp' ? 'image/webp'
    : ext === 'gif' ? 'image/gif'
    : ext === 'mp4' ? 'video/mp4'
    : 'image/png'
  return `data:${mime};base64,${buf.toString('base64')}`
}

/* ------------------------------------------------------------------ *
 * 提交出图（异步，立即返回 jobId）
 * ------------------------------------------------------------------ */

export interface RenderRequest {
  projectId?: string
  projectLabel?: string
  space?: string
  style?: string
  materials?: string
  light?: string
  ratio?: string
  count?: number
  seed?: number
  promptOverride?: string
}

export interface SubmitResult {
  ok: boolean
  jobId?: string
  renderId?: string
  prompt?: string
  width?: number
  height?: number
  seed?: number
  applied?: string[]
  missing?: string[]
  error?: string
}

export interface RenderSink {
  /** 由调用方注入持久化逻辑，避免 comfy 模块直接依赖 store */
  persist(patch: Partial<RenderRecord> & { id: string }): Promise<void>
}

export async function submitRender(
  cfg: DeskConfig,
  req: RenderRequest,
  sink: RenderSink,
): Promise<SubmitResult> {
  const status = await comfyStatus(cfg)
  if (!status.ok) return { ok: false, error: status.message }
  if (!status.workflowReady) {
    return { ok: false, error: '还没配置工作流：请到设置面板填写「工作流文件路径」和「正向提示词节点」' }
  }

  const prompt = buildPrompt(cfg, req)
  const negative = cfg.negativePrompt || ''
  const ratio = req.ratio || '16:9'
  const count = Math.max(1, Math.min(8, Number(req.count) || 1))

  let wf: any
  try {
    wf = await loadWorkflow(cfg)
  } catch (err: any) {
    return { ok: false, error: err?.message ?? '工作流加载失败' }
  }

  const inj = injectWorkflow(wf, cfg, { prompt, negative, ratio, count, seed: req.seed })
  if (!inj.applied.includes('正向提示词')) {
    return {
      ok: false,
      error: '节点映射有误：没能在指定节点上写入正向提示词，请检查设置面板里的节点 ID 与字段名',
    }
  }

  const renderId = uid('rnd')
  const jobId = uid('job')
  const createdAt = nowIso()
  const label = req.projectLabel || 'unassigned'

  await sink.persist({
    id: renderId,
    projectId: req.projectId,
    projectLabel: label,
    jobId,
    prompt,
    negative,
    space: req.space,
    style: req.style,
    materials: req.materials,
    ratio,
    width: inj.width,
    height: inj.height,
    count,
    seed: inj.seed,
    status: 'queued',
    items: [],
    createdAt,
  })

  const job: JobState = {
    jobId,
    renderId,
    projectId: req.projectId,
    status: 'queued',
    progress: 5,
    message: '已提交到 ComfyUI，排队中…',
    items: [],
    startedAt: createdAt,
    updatedAt: createdAt,
  }
  rememberJob(job)

  // 提交
  let promptId: string
  try {
    const res = await postJson(`${baseUrl(cfg)}/prompt`, {
      prompt: inj.workflow,
      client_id: 'designer-desk',
    })
    promptId = res?.prompt_id
    if (!promptId) {
      const detail = typeof res === 'string' ? res : JSON.stringify(res?.error ?? res ?? {})
      throw new Error(detail.slice(0, 400))
    }
  } catch (err: any) {
    job.status = 'failed'
    job.progress = 100
    job.error = String(err?.message ?? err)
    job.message = `提交失败：${job.error}`
    job.updatedAt = nowIso()
    await sink.persist({ id: renderId, status: 'failed', error: job.error })
    return { ok: false, error: job.message, renderId }
  }

  job.promptId = promptId
  job.status = 'running'
  job.progress = 15
  job.message = 'ComfyUI 正在生成…'
  job.updatedAt = nowIso()
  await sink.persist({ id: renderId, status: 'running' })

  // 后台轮询，不阻塞调用方
  void pollUntilDone(cfg, job, sink, label)

  return {
    ok: true,
    jobId,
    renderId,
    prompt,
    width: inj.width,
    height: inj.height,
    seed: inj.seed,
    applied: inj.applied,
    missing: inj.missing,
  }
}

async function pollUntilDone(cfg: DeskConfig, job: JobState, sink: RenderSink, label: string) {
  const deadline = Date.now() + (cfg.pollTimeoutMs || 600000)
  const interval = Math.max(800, cfg.pollIntervalMs || 2000)
  let tick = 0

  while (Date.now() < deadline) {
    await sleep(interval)
    tick++
    if (tick % 3 === 0) {
      job.progress = Math.min(90, job.progress + 4)
      job.updatedAt = nowIso()
    }
    try {
      const history = await fetchJson(`${baseUrl(cfg)}/history/${job.promptId}`, 6000)
      const entry = history?.[job.promptId as string]
      if (!entry) continue

      const statusStr = entry?.status?.status_str
      if (statusStr === 'error') {
        const msgs = entry?.status?.messages ?? []
        const flat = JSON.stringify(msgs).slice(0, 400)
        throw new Error(`ComfyUI 执行报错：${flat}`)
      }

      const items = extractItems(entry)
      if (!items.length) {
        if (statusStr === 'success') throw new Error('执行完成但没有产出图片，请检查工作流的输出节点')
        continue
      }

      const archived = await archiveItems(cfg, items, label, new Date().toISOString().slice(0, 10))
      job.items = archived
      job.status = 'done'
      job.progress = 100
      job.message = `完成，共 ${archived.length} 张`
      job.updatedAt = nowIso()
      await sink.persist({ id: job.renderId, status: 'done', items: archived })
      return
    } catch (err: any) {
      const msg = String(err?.message ?? err)
      // 只有真正的执行错误才终止；网络抖动继续重试
      if (msg.includes('执行报错') || msg.includes('没有产出图片')) {
        job.status = 'failed'
        job.progress = 100
        job.error = msg
        job.message = msg
        job.updatedAt = nowIso()
        await sink.persist({ id: job.renderId, status: 'failed', error: msg })
        return
      }
    }
  }

  job.status = 'failed'
  job.progress = 100
  job.error = '出图超时'
  job.message = '出图超时 —— 请检查 ComfyUI 是否卡住，或调大超时时间'
  job.updatedAt = nowIso()
  await sink.persist({ id: job.renderId, status: 'failed', error: job.error })
}
