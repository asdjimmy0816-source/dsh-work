/**
 * designer-desk · 类型与领域模型
 *
 * 设计要点：数据主键是「项目」，待办是项目的自动产物。
 * 9 阶段模型驱动「推一下就走」——推进一个阶段自动排出下一阶段的标准动作。
 */

/* ------------------------------------------------------------------ *
 * 日期工具（一律使用本地时区，避免 UTC 偏一天）
 * ------------------------------------------------------------------ */

/** 本地日期 → YYYY-MM-DD */
export function ymd(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

/** 本地时间 → HH:MM */
export function hm(d: Date = new Date()): string {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function todayStr(): string {
  return ymd(new Date())
}

/** 在 YYYY-MM-DD 基础上加减天数（跨月/跨年由 Date 自动处理） */
export function addDaysStr(base: string, days: number): string {
  const [y, m, d] = String(base).split('-').map(Number)
  const dt = new Date(y, (m || 1) - 1, d || 1)
  dt.setDate(dt.getDate() + days)
  return ymd(dt)
}

/** a - b 的天数差（正数表示 a 在 b 之后） */
export function diffDays(a: string, b: string): number {
  const pa = String(a).split('-').map(Number)
  const pb = String(b).split('-').map(Number)
  const da = new Date(pa[0], (pa[1] || 1) - 1, pa[2] || 1).getTime()
  const db = new Date(pb[0], (pb[1] || 1) - 1, pb[2] || 1).getTime()
  return Math.round((da - db) / 86400000)
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function uid(prefix = 'id'): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`
}

/* ------------------------------------------------------------------ *
 * 9 阶段模型
 * ------------------------------------------------------------------ */

export interface StageDef {
  /** 阶段序号 1-9 */
  n: number
  key: string
  name: string
  /** 该阶段的标准动作 */
  action: string
  /** 交付物 */
  deliver: string
  /** 完成后自动排出的下一个待办 */
  next: { title: string; type: string; inDays: number } | null
}

export const STAGES: StageDef[] = [
  {
    n: 1, key: 'lead', name: '线索',
    action: '记录客户资料 / 需求 / 预算', deliver: '客户档案',
    next: { title: '预约客户量房', type: '量房', inDays: 1 },
  },
  {
    n: 2, key: 'measure', name: '量房',
    action: '上门量尺 + 拍照 + 现场确认需求', deliver: '户型数据 + 现场照片',
    next: { title: '输出平面方案', type: '设计', inDays: 2 },
  },
  {
    n: 3, key: 'design', name: '方案设计',
    action: '平面 → 效果图 → 汇报 PPT', deliver: '方案 PPT + 效果图',
    next: { title: '输出报价单', type: '报价', inDays: 1 },
  },
  {
    n: 4, key: 'quote', name: '报价',
    action: '出报价单、发送、跟进', deliver: '报价单 v1',
    next: { title: '跟进回访', type: '回访', inDays: 2 },
  },
  {
    n: 5, key: 'sign', name: '签约',
    action: '合同 + 收款计划', deliver: '合同',
    next: { title: '预约客户到店选材', type: '到店', inDays: 1 },
  },
  {
    n: 6, key: 'pick', name: '选材深化',
    action: '陪同选材、确认主材', deliver: '选材清单',
    next: { title: '材料下单', type: '材料', inDays: 1 },
  },
  {
    n: 7, key: 'build', name: '施工',
    action: '节点巡检 水电 / 瓦 / 木 / 油 / 安装', deliver: '巡检记录 + 照片',
    next: { title: '下次工地巡检', type: '巡检', inDays: 3 },
  },
  {
    n: 8, key: 'accept', name: '安装验收',
    action: '安装、验收、整改', deliver: '验收单',
    next: { title: '办理结项', type: '结项', inDays: 2 },
  },
  {
    n: 9, key: 'close', name: '结项回访',
    action: '回访、要转介绍', deliver: '客户口碑 / 案例',
    next: null,
  },
]

export function stageDef(n: number): StageDef {
  return STAGES.find((s) => s.n === n) ?? STAGES[0]
}

export function stageName(n: number): string {
  return stageDef(n).name
}

/* ------------------------------------------------------------------ *
 * 表结构（11 张表一次性定义，后续期次直接复用，不再迁移）
 * ------------------------------------------------------------------ */

export interface Customer {
  id: string
  name: string
  phone?: string
  wechat?: string
  community?: string
  roomNo?: string
  layout?: string
  area?: number
  style?: string
  budget?: number
  family?: string
  taboo?: string
  note?: string
  createdAt: string
  updatedAt: string
}

export interface ProjectLog {
  at: string
  text: string
  stage?: number
}

export interface Project {
  id: string
  customerId: string
  /** 项目名，习惯用「小区-房号」，如 金地花园-1201 */
  name: string
  /** 1-9，见 STAGES */
  stage: number
  nextAction?: string
  nextActionAt?: string
  amount?: number
  signDate?: string
  archived?: boolean
  logs: ProjectLog[]
  createdAt: string
  updatedAt: string
}

export interface Task {
  id: string
  projectId?: string
  title: string
  type: string
  /** YYYY-MM-DD；留空表示「挂着但没定日子」 */
  dueAt?: string
  done: boolean
  doneAt?: string
  priority?: string
  postponedFrom?: string
  createdAt: string
}

export interface RenderItem {
  /** 已归档到 ~/.designer-desk/renders 的绝对路径；为空表示只存在于 ComfyUI output */
  file?: string
  /** ComfyUI output 中的文件名（兜底走 /view 代理） */
  filename: string
  subfolder: string
  type: string
}

export interface RenderRecord {
  id: string
  projectId?: string
  projectLabel?: string
  jobId?: string
  prompt: string
  negative?: string
  space?: string
  style?: string
  materials?: string
  ratio?: string
  width?: number
  height?: number
  count?: number
  seed?: number
  status: 'queued' | 'running' | 'done' | 'failed'
  items: RenderItem[]
  error?: string
  createdAt: string
}

/** 工地巡检节点（阶段 7 施工 / 8 安装验收的核心动作） */
export type InspectionNode = '水电' | '瓦工' | '木工' | '油漆' | '安装' | '验收'
export type InspectionStatus = '待巡检' | '进行中' | '通过' | '需整改'

export interface SiteInspection {
  id: string
  projectId: string
  node: InspectionNode
  status: InspectionStatus
  /** 计划巡检 / 约定完成日 */
  plannedAt?: string
  doneAt?: string
  note?: string
  /** 现场照片归档路径（留空表示还没上传） */
  photos: string[]
  createdAt: string
  updatedAt: string
}

export type MaterialStatus = '待下单' | '已下单' | '在途' | '已到场' | '已验收'

export interface MaterialItem {
  id: string
  projectId: string
  name: string
  category?: string
  brand?: string
  spec?: string
  price?: number
  qty?: number
  unit?: string
  supplier?: string
  /** 计划进场日；留空表示未排期 */
  arriveAt?: string
  status: MaterialStatus
  note?: string
  createdAt: string
  updatedAt: string
}

export interface RefImage {
  id: string
  title?: string
  /** 来源链接（外网参考图） */
  url?: string
  /** 缩略图链接或 dataUrl */
  thumb?: string
  tags: string[]
  /** 评分 1-5（5 最好） */
  score: number
  source?: string
  projectId?: string
  createdAt: string
}

/** 第 2 期起逐期填充；其余表继续占位保证结构稳定 */
export interface DB {
  version: number
  customers: Customer[]
  projects: Project[]
  tasks: Task[]
  renders: RenderRecord[]
  sites: SiteInspection[]
  materials: MaterialItem[]
  refimages: RefImage[]
  quotes: any[]
  contracts: any[]
  contents: any[]
  reading: any[]
}

/* ------------------------------------------------------------------ *
 * 配置
 * ------------------------------------------------------------------ */

export interface NodeSlot {
  /** ComfyUI 工作流中的节点 ID（标题栏数字） */
  node: string
  /** 该节点上的输入字段名 */
  input: string
}

export interface NodeMap {
  positive: NodeSlot
  negative?: NodeSlot
  seed?: NodeSlot
  width?: NodeSlot
  height?: NodeSlot
  batch?: NodeSlot
  image?: NodeSlot
}

export interface DeskConfig {
  /** ComfyUI 地址，默认本机 */
  comfyHost: string
  /** API 格式工作流 JSON 绝对路径 */
  workflowPath: string
  /** ComfyUI output 目录（用于把出图拷回归档） */
  comfyOutputDir: string
  /** 节点映射 */
  nodeMap: NodeMap
  /** 正向提示词模板，可用 {space} {style} {materials} {light} 占位 */
  promptTemplate: string
  /** 负向提示词 */
  negativePrompt: string
  /** 每日摘要开关 */
  summaryEnabled: boolean
  /** 每日摘要时间 HH:MM */
  summaryAt: string
  /** 沉默项目判定：阶段在 3-4 且多少天没动静 */
  silentDays: number
  /** 轮询间隔 / 超时 */
  pollIntervalMs: number
  pollTimeoutMs: number
}

export const DEFAULT_NODE_MAP: NodeMap = {
  positive: { node: '', input: 'text' },
  negative: { node: '', input: 'text' },
  seed: { node: '', input: 'seed' },
  width: { node: '', input: 'width' },
  height: { node: '', input: 'height' },
  batch: { node: '', input: 'batch_size' },
  image: { node: '', input: 'image' },
}

export const DEFAULT_PROMPT_TEMPLATE =
  'interior design, {space}, {style} style, {materials}, {light}, ' +
  'photorealistic, 8k, architectural photography, soft natural light, ' +
  'high detail, professional interior rendering, magazine quality'

export const DEFAULT_NEGATIVE_PROMPT =
  'lowres, blurry, watermark, text, deformed, extra furniture, distorted perspective, oversaturated'

export const DEFAULT_CONFIG: DeskConfig = {
  comfyHost: 'http://127.0.0.1:8188',
  workflowPath: '',
  comfyOutputDir: '',
  nodeMap: DEFAULT_NODE_MAP,
  promptTemplate: DEFAULT_PROMPT_TEMPLATE,
  negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  summaryEnabled: true,
  summaryAt: '08:30',
  silentDays: 5,
  pollIntervalMs: 2000,
  pollTimeoutMs: 600000,
}

/* ------------------------------------------------------------------ *
 * 派生视图
 * ------------------------------------------------------------------ */

export interface ProjectView extends Project {
  customerName: string
  community: string
  roomNo: string
  layout: string
  style: string
  area?: number
  stageName: string
  stageAction: string
  /** 距 nextActionAt 的天数：负数=逾期 */
  daysToNext: number | null
  overdue: boolean
}

export interface Buckets {
  overdue: Task[]
  today: Task[]
  soon: Task[]
  noDate: Task[]
  silent: ProjectView[]
}

export interface StatePayload {
  ok: boolean
  now: string
  nowTime: string
  config: DeskConfig
  stages: StageDef[]
  customers: Customer[]
  projects: ProjectView[]
  tasks: Task[]
  renders: RenderRecord[]
  sites: SiteInspection[]
  materials: MaterialItem[]
  refimages: RefImage[]
  buckets: Buckets
  stats: {
    projectCount: number
    activeCount: number
    byStage: Array<{ n: number; name: string; count: number }>
    todayCount: number
    overdueCount: number
    renderCount: number
  }
  comfy: { ok: boolean; host: string; message: string; workflowReady: boolean }
  storage: { home: string; dataFile: string; bytes: number; lastBackup: string }
}
