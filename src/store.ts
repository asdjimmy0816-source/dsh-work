/**
 * designer-desk · 数据层
 *
 * 职责边界（铁律 9 分层）：只负责读写与持久化，不做任何业务计算与 DOM 相关逻辑。
 * 数据落盘在 ~/.designer-desk/，写入前滚动备份，写入用「临时文件 + rename」保证原子性。
 */
import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {
  DEFAULT_CONFIG,
  DEFAULT_NODE_MAP,
  DEFAULT_NEGATIVE_PROMPT,
  DEFAULT_PROMPT_TEMPLATE,
  addDaysStr,
  nowIso,
  todayStr,
  uid,
} from './types'
import type { Customer, DB, DeskConfig, MaterialItem, Project, RefImage, SiteInspection, Task } from './types'

export const DESK_HOME = process.env.DESIGNER_DESK_HOME || path.join(os.homedir(), '.designer-desk')
export const DATA_FILE = path.join(DESK_HOME, 'data.json')
export const BAK_FILE = path.join(DESK_HOME, 'data.bak.json')
export const CONFIG_FILE = path.join(DESK_HOME, 'config.json')
export const RENDERS_DIR = path.join(DESK_HOME, 'renders')

export function emptyDB(): DB {
  return {
    version: 1,
    customers: [],
    projects: [],
    tasks: [],
    renders: [],
    sites: [],
    materials: [],
    refimages: [],
    quotes: [],
    contracts: [],
    contents: [],
    reading: [],
  }
}

/** 补齐缺失字段，保证老数据可读（向后兼容） */
function normalizeDB(raw: any): DB {
  const base = emptyDB()
  if (!raw || typeof raw !== 'object') return base
  for (const key of Object.keys(base)) {
    if (key === 'version') continue
    const v = (raw as any)[key]
    ;(base as any)[key] = Array.isArray(v) ? v : []
  }
  base.version = Number(raw.version) || 1
  return base
}

function normalizeConfig(raw: any): DeskConfig {
  const cfg: DeskConfig = { ...DEFAULT_CONFIG, ...(raw ?? {}) }
  cfg.nodeMap = { ...DEFAULT_NODE_MAP, ...(raw?.nodeMap ?? {}) }
  for (const k of Object.keys(DEFAULT_NODE_MAP) as Array<keyof typeof DEFAULT_NODE_MAP>) {
    const merged = { ...DEFAULT_NODE_MAP[k], ...(raw?.nodeMap?.[k] ?? {}) }
    ;(cfg.nodeMap as any)[k] = merged
  }
  if (!cfg.promptTemplate) cfg.promptTemplate = DEFAULT_PROMPT_TEMPLATE
  if (!cfg.negativePrompt) cfg.negativePrompt = DEFAULT_NEGATIVE_PROMPT
  if (!cfg.summaryAt) cfg.summaryAt = '08:30'
  return cfg
}

export async function ensureDirs(): Promise<void> {
  await fs.mkdir(DESK_HOME, { recursive: true })
  await fs.mkdir(RENDERS_DIR, { recursive: true })
}

/** 归档路径：~/.designer-desk/renders/{项目标识}/{YYYY-MM-DD}/ */
export function renderDirFor(projectLabel: string, date: string): string {
  const safe = String(projectLabel || 'unassigned').replace(/[\\/:*?"<>|]/g, '_').trim() || 'unassigned'
  return path.join(RENDERS_DIR, safe, date)
}

/* ------------------------------------------------------------------ *
 * 读
 * ------------------------------------------------------------------ */

let cache: DB | null = null

export async function loadDB(): Promise<DB> {
  if (cache) return cache
  await ensureDirs()
  let existed = true
  try {
    const text = await fs.readFile(DATA_FILE, 'utf8')
    cache = normalizeDB(JSON.parse(text))
  } catch {
    existed = false
    cache = emptyDB()
  }
  // 首次打开：预置示例数据（铁律 6 —— 严禁首屏空白）
  if (!existed) {
    cache = seedDemo(cache)
    await writeRaw(cache)
  }
  return cache
}

/* ------------------------------------------------------------------ *
 * 写
 * ------------------------------------------------------------------ */

async function writeRaw(db: DB): Promise<void> {
  await ensureDirs()
  const tmp = `${DATA_FILE}.tmp`
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), 'utf8')
  // 写前滚动备份
  try {
    await fs.copyFile(DATA_FILE, BAK_FILE)
  } catch {
    /* 首次写入没有可备份的旧文件，忽略 */
  }
  await fs.rename(tmp, DATA_FILE)
}

let chain: Promise<unknown> = Promise.resolve()

/**
 * 串行化的读改写。并发请求不会互相覆盖。
 */
export function mutate<T>(fn: (db: DB) => T): Promise<{ db: DB; result: T }> {
  const run = async () => {
    const db = await loadDB()
    const result = fn(db)
    await writeRaw(db)
    return { db, result }
  }
  const p = chain.then(run, run)
  chain = p.then(
    () => undefined,
    () => undefined,
  )
  return p
}

export async function replaceDB(next: DB): Promise<DB> {
  const normalized = normalizeDB(next)
  await writeRaw(normalized)
  cache = normalized
  return normalized
}

export async function exportSnapshot(): Promise<{ db: DB; config: DeskConfig }> {
  const db = await loadDB()
  const config = await loadConfig()
  return { db, config }
}

export async function storageInfo(): Promise<{ bytes: number; lastBackup: string; dataFile: string }> {
  let bytes = 0
  let lastBackup = ''
  try {
    bytes = (await fs.stat(DATA_FILE)).size
  } catch {
    /* ignore */
  }
  try {
    lastBackup = (await fs.stat(BAK_FILE)).mtime.toISOString()
  } catch {
    /* ignore */
  }
  return { bytes, lastBackup, dataFile: DATA_FILE }
}

/* ------------------------------------------------------------------ *
 * 配置
 * ------------------------------------------------------------------ */

let cfgCache: DeskConfig | null = null

export async function loadConfig(): Promise<DeskConfig> {
  if (cfgCache) return cfgCache
  await ensureDirs()
  try {
    cfgCache = normalizeConfig(JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8')))
  } catch {
    cfgCache = { ...DEFAULT_CONFIG, nodeMap: { ...DEFAULT_NODE_MAP } }
    await fs.writeFile(CONFIG_FILE, JSON.stringify(cfgCache, null, 2), 'utf8')
  }
  return cfgCache
}

export async function saveConfig(patch: Partial<DeskConfig>): Promise<DeskConfig> {
  const cur = await loadConfig()
  cfgCache = normalizeConfig({ ...cur, ...(patch ?? {}) })
  await ensureDirs()
  await fs.writeFile(CONFIG_FILE, JSON.stringify(cfgCache, null, 2), 'utf8')
  return cfgCache
}

/* ------------------------------------------------------------------ *
 * 示例数据（含 1 条逾期 —— 铁律 6）
 * ------------------------------------------------------------------ */

export function seedDemo(db: DB): DB {
  const today = todayStr()
  const now = nowIso()
  const minus = (n: number) => addDaysStr(today, -n)
  const plus = (n: number) => addDaysStr(today, n)

  const customers: Customer[] = [
    { id: 'cus_wang', name: '王女士', phone: '138****2211', wechat: 'wangxs88', community: '金地花园', roomNo: '1201', layout: '三室两厅', area: 118, style: '奶油风', budget: 320000, family: '夫妻 + 1 个 5 岁女儿', taboo: '不接受开放式厨房', note: '朋友介绍，重点看储物', createdAt: now, updatedAt: now },
    { id: 'cus_li', name: '李先生', phone: '139****7788', wechat: 'lizh_2026', community: '融创壹号院', roomNo: '802', layout: '四室两厅', area: 156, style: '新中式', budget: 520000, family: '三代同堂', taboo: '老人怕冷，地暖必留', note: '在意风水，客卫门不冲沙发', createdAt: now, updatedAt: now },
    { id: 'cus_zhang', name: '张先生', phone: '137****3344', wechat: 'zhang_lei', community: '中海国际', roomNo: 'B1203', layout: '两室一厅', area: 89, style: '现代简约', budget: 210000, family: '单身', taboo: '无', note: '预算敏感，报价要拆细', createdAt: now, updatedAt: minus(8) },
    { id: 'cus_chen', name: '陈女士', phone: '135****9900', wechat: 'chenyy', community: '万科翡翠', roomNo: '506', layout: '三室一厅', area: 108, style: '侘寂风', budget: 280000, family: '夫妻 + 猫', taboo: '猫爬架要嵌入墙体', note: '已签约，施工中', createdAt: now, updatedAt: minus(1) },
    { id: 'cus_liu', name: '刘先生', phone: '136****1122', wechat: 'liu_bd', community: '保利天悦', roomNo: '1501', layout: '四室两厅', area: 172, style: '轻奢', budget: 650000, family: '夫妻 + 2 孩', taboo: '要独立书房', note: '抖音来的线索，还没量房', createdAt: now, updatedAt: now },
  ]

  const projects: Project[] = [
    { id: 'prj_wang', customerId: 'cus_wang', name: '金地花园-1201', stage: 2, nextAction: '预约客户量房', nextActionAt: minus(1), amount: 0, logs: [{ at: now, text: '建档，来源：朋友介绍', stage: 1 }], createdAt: now, updatedAt: now },
    { id: 'prj_li', customerId: 'cus_li', name: '融创壹号院-802', stage: 3, nextAction: '输出平面方案', nextActionAt: today, amount: 0, logs: [{ at: now, text: '现场量房完成，户型已归档', stage: 2 }], createdAt: now, updatedAt: now },
    { id: 'prj_zhang', customerId: 'cus_zhang', name: '中海国际-B1203', stage: 4, nextAction: '跟进回访', nextActionAt: plus(2), amount: 205000, logs: [{ at: now, text: '报价单 v1 已发送', stage: 4 }], createdAt: now, updatedAt: minus(8) },
    { id: 'prj_chen', customerId: 'cus_chen', name: '万科翡翠-506', stage: 7, nextAction: '下次工地巡检', nextActionAt: plus(3), amount: 276000, signDate: minus(20), logs: [{ at: now, text: '水电节点巡检通过', stage: 7 }], createdAt: now, updatedAt: minus(1) },
    { id: 'prj_liu', customerId: 'cus_liu', name: '保利天悦-1501', stage: 1, nextAction: '加微信确认需求', nextActionAt: undefined, amount: 0, logs: [{ at: now, text: '抖音线索建档', stage: 1 }], createdAt: now, updatedAt: now },
  ]

  const tasks: Task[] = [
    { id: 'tsk_1', projectId: 'prj_wang', title: '上门量房（金地花园-1201）', type: '量房', dueAt: minus(1), done: false, priority: 'P0', createdAt: now },
    { id: 'tsk_2', projectId: 'prj_li', title: '输出平面方案（融创壹号院-802）', type: '设计', dueAt: today, done: false, priority: 'P0', createdAt: now },
    { id: 'tsk_3', projectId: 'prj_zhang', title: '报价跟进回访（中海国际-B1203）', type: '回访', dueAt: plus(2), done: false, priority: 'P1', createdAt: now },
    { id: 'tsk_4', projectId: 'prj_chen', title: '水电节点巡检（万科翡翠-506）', type: '巡检', dueAt: plus(3), done: false, priority: 'P1', createdAt: now },
    { id: 'tsk_5', projectId: 'prj_liu', title: '加微信确认需求（保利天悦-1501）', type: '其他', dueAt: undefined, done: false, priority: 'P2', createdAt: now },
    { id: 'tsk_6', projectId: 'prj_chen', title: '整理方案汇报 PPT（万科翡翠-506）', type: '设计', dueAt: minus(2), done: true, doneAt: now, createdAt: now },
  ]

  const sites: SiteInspection[] = [
    { id: 'site_1', projectId: 'prj_chen', node: '水电', status: '通过', plannedAt: minus(20), doneAt: minus(20), note: '开槽规范，打压测试合格', photos: [], createdAt: now, updatedAt: now },
    { id: 'site_2', projectId: 'prj_chen', node: '瓦工', status: '通过', plannedAt: minus(8), doneAt: minus(8), note: '瓷砖空鼓率合格', photos: [], createdAt: now, updatedAt: now },
    { id: 'site_3', projectId: 'prj_chen', node: '木工', status: '进行中', plannedAt: today, note: '吊顶与柜体施工中', photos: [], createdAt: now, updatedAt: now },
    { id: 'site_4', projectId: 'prj_chen', node: '油漆', status: '待巡检', plannedAt: plus(5), note: '', photos: [], createdAt: now, updatedAt: now },
    { id: 'site_5', projectId: 'prj_chen', node: '安装', status: '待巡检', plannedAt: plus(12), note: '', photos: [], createdAt: now, updatedAt: now },
  ]

  const materials: MaterialItem[] = [
    { id: 'mat_1', projectId: 'prj_chen', name: '客厅地砖', category: '瓷砖', brand: '马可波罗', spec: '800×800 柔光', price: 18000, qty: 1, unit: '批', supplier: '红星美凯龙', arriveAt: minus(15), status: '已验收', createdAt: now, updatedAt: now },
    { id: 'mat_2', projectId: 'prj_chen', name: '实木复合地板', category: '地板', brand: '大自然', spec: '1220×200 橡木色', price: 22000, qty: 1, unit: '批', supplier: '建材市场 B 区', arriveAt: minus(3), status: '已到场', createdAt: now, updatedAt: now },
    { id: 'mat_3', projectId: 'prj_chen', name: '定制橱柜', category: '橱柜', brand: '欧派', spec: 'L 型 4.2m', price: 35000, qty: 1, unit: '套', supplier: '欧派门店', arriveAt: plus(2), status: '在途', createdAt: now, updatedAt: now },
    { id: 'mat_4', projectId: 'prj_chen', name: '乳胶漆', category: '涂料', brand: '都芳', spec: '5L×6 浅杏色', price: 4200, qty: 1, unit: '批', supplier: '天猫旗舰店', arriveAt: plus(4), status: '已下单', createdAt: now, updatedAt: now },
    { id: 'mat_5', projectId: 'prj_chen', name: '中央空调', category: '电器', brand: '大金', spec: '一拖四', price: 48000, qty: 1, unit: '套', supplier: '大金授权店', arriveAt: undefined, status: '待下单', createdAt: now, updatedAt: now },
  ]

  const refimages: RefImage[] = [
    { id: 'ref_1', title: '奶油风客厅参考', tags: ['奶油风', '客厅', '沙发背景墙'], score: 5, source: '小红书', projectId: 'prj_wang', createdAt: now },
    { id: 'ref_2', title: '新中式玄关', tags: ['新中式', '玄关', '端景'], score: 4, source: 'Pinterest', projectId: 'prj_li', createdAt: now },
    { id: 'ref_3', title: '侘寂风卧室', tags: ['侘寂风', '卧室', '微水泥'], score: 5, source: '好好住', projectId: 'prj_chen', createdAt: now },
    { id: 'ref_4', title: '现代简约开放厨房', tags: ['现代简约', '厨房', '开放式'], score: 4, source: 'houzz', createdAt: now },
    { id: 'ref_5', title: '轻奢主卧背景墙', tags: ['轻奢', '主卧', '金属线条'], score: 3, source: '站酷', projectId: 'prj_liu', createdAt: now },
    { id: 'ref_6', title: '原木儿童房', tags: ['原木', '儿童房', '收纳'], score: 4, source: '小红书', createdAt: now },
  ]

  return { ...db, customers, projects, tasks, sites, materials, refimages }
}

/** 清空示例数据（保留结构，清空内容） */
export function clearAll(db: DB): DB {
  const empty = emptyDB()
  empty.version = db.version
  return empty
}

export function makeId(prefix: string): string {
  return uid(prefix)
}
