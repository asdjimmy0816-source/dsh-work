#!/usr/bin/env node
/**
 * designer-desk · 冒烟自检
 *
 * 用真实的 cordis Context 把两个 half 真正跑起来，验证：
 *   ① 插件能被装配、Remote 控制器能挂载、启动自检不抛异常
 *   ② 首次打开会预置示例数据，且四分区里「逾期」不为空（铁律 6）
 *   ③ 命令 / 待办 / 推进 / 出图节点 的核心链路真能跑通
 *   ④ 跨月、跨年的日期边界计算正确（铁律 10）
 *
 * ⚠️ 通信走 Typert Remote（lib/api.js 的 DeskRemote），**不是 HTTP 路由**。
 * 测试里保留 `hit('GET', '/designer-desk/xxx')` 这种路径写法只是为了可读性，
 * `hit()` 内部已经把路径翻译成 Remote 方法名了 —— 与 client/kit.tsx 的
 * ENDPOINTS 表同源，两边任一漂移都会被下面的「端点不漂移」断言抓住。
 *
 * 全程写在临时目录里，不碰用户真实的 ~/.designer-desk。
 */
import { mkdtemp, rm } from 'node:fs/promises'
import { Context } from '@deepseek-ai/cordis'
import os from 'node:os'
import path from 'node:path'

const tmp = await mkdtemp(path.join(os.tmpdir(), 'designer-desk-smoke-'))
process.env.DESIGNER_DESK_HOME = tmp

const results = []
function check(name, cond, detail = '') {
  results.push({ name, ok: Boolean(cond), detail })
}
function assert(name, cond, detail = '') {
  check(name, cond, detail)
  if (!cond) throw new Error(`${name} — ${detail}`)
}

/* ------------------------------------------------------------------ *
 * 宿主 ctx —— 用真实的 cordis Context，不用手搓的假对象
 * ------------------------------------------------------------------ *
 * 为什么必须用真的：cordis 的 Service 构造时会读 `ctx.reflect` /
 * `ctx[symbols.isolate]`。手搓的假对象缺这些字段，控制器在构造那一刻就抛
 * `Cannot read properties of undefined (reading 'provide')` ——
 * 也就是说拿假 ctx 测 Remote 控制器，等于什么都没测。
 */

const logs = []

/*
 * cordis 的额外服务用 `app.provide()` 注册，业务插件通过 `inject` 声明后拿到。
 *
 * ⚠️ 两个必须知道的 cordis 行为（都踩过）：
 *  1. `app.plugin()` 返回的是**惰性 fiber**，必须 `await` 它才会真正加载；
 *     未 await 前读 fiber 上的服务全是 undefined。
 *  2. 业务插件的 `apply(ctx)` 由 cordis 调用，ctx 参数就是注入了服务的 fiber ——
 *     不要自己造 ctx 对象传进去，cordis 的 Proxy 会拦掉未注册的键。
 *  3. `on` / `emit` / `provide` / `effect` 是 cordis 自带的，不要重复 provide（会报
 *     `already declared as accessor`）。
 */
const app = new Context({})
const commands = {}

app.provide('logger', {
  info: (m) => logs.push(['info', m]),
  warn: (m) => logs.push(['warn', m]),
  error: (m) => logs.push(['error', m]),
})
app.provide('command', (name) => {
  const chain = {
    alias() { return chain },
    option() { return chain },
    description() { return chain },
    action(fn) { commands[name] = fn; return chain },
  }
  return chain
})
app.provide('setInterval', () => 1)
app.provide('clearInterval', () => {})
app.provide('setTimeout', (f) => setTimeout(f, 0))
app.provide('clearTimeout', (t) => clearTimeout(t))

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

/**
 * Remote 宿主：模拟 DSH 在根层实例化 lib/api.js 的 default 导出。
 *
 * ⚠️ 必须用**根层 app** 构造，不能用子 fiber：cordis 的 Service 构造会读
 * `ctx.reflect` / `ctx[symbols.isolate]`，这两个字段只有根 Context 有。
 * 子 fiber 上直接抛 `Cannot read properties of undefined (reading 'provide')`。
 * 这与 DSH 的硬约束同源 —— 控制器必须作为独立 Loader entry 在根层挂载
 * （cordis.patch.yml 第二条 `designer-desk/api`）。
 */
const deskApi = await import('../lib/api.js')
const controller = new deskApi.default(app)

/**
 * 路径 → Remote 方法名。与 client/kit.tsx 的 ENDPOINTS 表同源。
 * 保留路径写法是为了让断言读起来跟界面调用一致。
 */
const PATH_TO_METHOD = {
  health: 'health',
  state: 'state',
  stages: 'stages',
  config: 'getConfig',
  'project/save': 'projectSave',
  'project/advance': 'projectAdvance',
  'project/delete': 'projectDelete',
  'project/wake': 'projectWake',
  'task/save': 'taskSave',
  'task/toggle': 'taskToggle',
  'task/postpone': 'taskPostpone',
  'task/delete': 'taskDelete',
  today: 'today',
  tasks: 'openTasks',
  export: 'exportData',
  import: 'importData',
  'seed/demo': 'seedDemoData',
  'seed/clear': 'seedClear',
  'comfy/status': 'comfyStatus',
  'comfy/render': 'renderSubmit',
  'comfy/job': 'renderJob',
  'render/image': 'renderImage',
  'render/delete': 'renderDelete',
  'render-dir': 'renderDir',
  'site/save': 'siteSave',
  'site/delete': 'siteDelete',
  'material/save': 'materialSave',
  'material/delete': 'materialDelete',
  'refimage/save': 'refimageSave',
  'refimage/delete': 'refimageDelete',
}

/** 等价于 client/kit.ts 里的 api()：把路径翻成 Remote 方法再调 */
async function hit(method, p, query, body) {
  const key = String(p).replace(/^\/designer-desk\//, '')
  const verb = method.toUpperCase()
  const name = verb === 'POST' && key === 'config' ? 'setConfig' : PATH_TO_METHOD[key]
  if (!name) throw new Error(`未映射的端点：${verb} ${p}`)
  const fn = controller[name]
  if (typeof fn !== 'function') throw new Error(`Remote 方法不存在：${name}`)
  return verb === 'GET' ? await fn.call(controller) : await fn.call(controller, body ?? {})
}

/* ------------------------------------------------------------------ *
 * 跑
 * ------------------------------------------------------------------ */

console.log(`\ndesigner-desk · 冒烟自检\n临时数据目录 ${tmp}\n${'─'.repeat(58)}`)

const mod = await import('../lib/index.js')

// 业务插件 fiber（cordis 在 await 时调它的 apply(ctx)）
const fiber = app.plugin({ ...mod, inject: mod.inject })
// 业务插件的 fiber 就是它的 ctx —— cordis 会用这个当 apply(ctx) 的参数
const ctx = fiber
// 命令表挂上去，后续断言用 ctx.__commands
Object.defineProperty(fiber, '__commands', { get: () => commands })


assert('导出 inject', Array.isArray(mod.inject), `实际：${JSON.stringify(mod.inject)}`)
assert('inject 不含 webServer（通信已改走 Remote）', !mod.inject.includes('webServer'), JSON.stringify(mod.inject))
assert('导出 apply 函数', typeof mod.apply === 'function')

// ---------- Remote 控制器契约（loader 挂载的硬约束）----------
assert('lib/api.js 有 default 导出（Loader 只实例化 default）', typeof deskApi.default === 'function',
  `实际：${typeof deskApi.default}`)
assert('default 导出就是控制器类', deskApi.default.name === 'DeskRemote', deskApi.default.name)
assert('控制器命名空间是 designerDesk', deskApi.REMOTE_NAMESPACE === 'designerDesk',
  String(deskApi.REMOTE_NAMESPACE))
assert('控制器静态 inject 声明 designerDesk 服务',
  Array.isArray(deskApi.default.inject) && deskApi.default.inject.includes('designerDesk'),
  JSON.stringify(deskApi.default.inject))
assert('控制器不声明 remote.*（宿主侧不存在，会自锁）',
  !deskApi.default.inject.some((k) => String(k).startsWith('remote.')),
  JSON.stringify(deskApi.default.inject))
// 回归：serviceKey 必须与命名空间分开。
// TypertRemoteService 用 serviceKey 注册 cordis 服务；若它等于命名空间，
// 控制器会覆盖业务插件 provide 的同名服务，`this.ctx.designerDesk` 变成控制器自己。
assert('控制器 serviceKey 与命名空间分离（否则覆盖业务服务）',
  deskApi.CONTROLLER_KEY !== deskApi.REMOTE_NAMESPACE,
  `serviceKey=${deskApi.CONTROLLER_KEY} namespace=${deskApi.REMOTE_NAMESPACE}`)

// 控制器方法齐全 —— 每个 @Remote 都应有同名方法
const REQUIRED = [
  'health', 'state', 'stages', 'getConfig', 'setConfig',
  'projectSave', 'projectAdvance', 'projectDelete', 'projectWake',
  'taskSave', 'taskToggle', 'taskPostpone', 'taskDelete',
  'today', 'openTasks', 'exportData', 'importData', 'seedDemoData', 'seedClear',
  'comfyStatus', 'renderSubmit', 'renderJob', 'renderImage', 'renderDelete', 'renderDir',
  'siteSave', 'siteDelete', 'materialSave', 'materialDelete',
  'refimageSave', 'refimageDelete',
]
const missingMethods = REQUIRED.filter((m) => typeof controller[m] !== 'function')
assert(`控制器具备全部 ${REQUIRED.length} 个 Remote 方法`, missingMethods.length === 0,
  `缺：${missingMethods.join(', ')}`)

// 第 2 期六个方法必须真的存在（M4/M5/M6 前端已接）
for (const m of ['siteSave', 'siteDelete', 'materialSave', 'materialDelete', 'refimageSave', 'refimageDelete']) {
  assert(`第 2 期 Remote 方法已就绪 ${m}`, typeof controller[m] === 'function')
}

// cordis 会在 fiber 就绪时自己调 apply(ctx) —— 这里只需等它跑完
await fiber
await sleep(300) // 等启动自检（ensureDirs + 首次 seeding）跑完

// ---------- 端点映射表与控制器方法不漂移 ----------
{
  const { readFile } = await import('node:fs/promises')
  const kitSrc = await readFile(new URL('../src/client/kit.tsx', import.meta.url), 'utf8')
  const tbl = kitSrc.slice(kitSrc.indexOf('const ENDPOINTS'), kitSrc.indexOf('export interface ApiInit'))
  const mapped = [...tbl.matchAll(/:\s*'([A-Za-z]+)'/g)].map((m) => m[1])
  const drift = mapped.filter((m) => !REQUIRED.includes(m))
  assert(`客户端映射表（${mapped.length} 条）全部指向真实 Remote 方法`, drift.length === 0,
    `漂移：${drift.join(', ')}`)

  // 反向：本测试的 PATH_TO_METHOD 也不能指向不存在的方法
  const badMap = Object.entries(PATH_TO_METHOD).filter(([, m]) => !REQUIRED.includes(m))
  assert('测试的路径→方法映射无悬空条目', badMap.length === 0, JSON.stringify(badMap))
}

// ---------- 冒烟：health ----------
const health = await hit('GET', '/designer-desk/health')
assert('GET /designer-desk/health 返回 ok', health?.ok === true, JSON.stringify(health).slice(0, 160))
assert('health 报告插件名', health?.plugin === 'designer-desk', String(health?.plugin))

// ---------- 冒烟：command ----------
const hello = await ctx.__commands['designer-desk.hello <name>']({ options: {} }, '哥哥')
assert('命令 designer-desk.hello 有返回', typeof hello === 'string' && hello.includes('哥哥'), String(hello).slice(0, 80))

// ---------- 首次打开必须有示例数据且含逾期 ----------
const st = await hit('GET', '/designer-desk/state')
assert('state.ok', st?.ok === true, JSON.stringify(st).slice(0, 200))
assert('首次打开已预置客户（非空白首屏）', st.customers?.length >= 3, `客户数 ${st.customers?.length}`)
assert('首次打开已预置项目', st.projects?.length >= 3, `项目数 ${st.projects?.length}`)
assert('示例数据里有且仅有的逾期项存在', st.buckets?.overdue?.length >= 1, `逾期 ${st.buckets?.overdue?.length}`)
assert('今天分区有内容', st.buckets?.today?.length >= 1, `今天 ${st.buckets?.today?.length}`)
assert('沉默项目唤醒能识别出项目', st.buckets?.silent?.length >= 1, `沉默 ${st.buckets?.silent?.length}`)
assert('阶段模型 9 段', st.stages?.length === 9, `实际 ${st.stages?.length}`)
assert('ComfyUI 未启动时不崩、有可读提示', st.comfy?.ok === false && typeof st.comfy?.message === 'string', JSON.stringify(st.comfy))

// ---------- 待办：完成 ----------
const overdueTask = st.buckets.overdue[0]
const doneRes = await hit('POST', '/designer-desk/task/toggle', {}, { id: overdueTask.id, done: true })
assert('完成逾期待办', doneRes?.ok === true && doneRes.task?.done === true)
const st2 = await hit('GET', '/designer-desk/state')
assert('完成后逾期数下降', st2.buckets.overdue.length === st.buckets.overdue.length - 1,
  `${st.buckets.overdue.length} → ${st2.buckets.overdue.length}`)

// ---------- 待办：顺延 ----------
const todayTask = st2.buckets.today[0]
const before = todayTask.dueAt
const post2 = await hit('POST', '/designer-desk/task/postpone', {}, { id: todayTask.id, days: 3 })
assert('顺延待办成功', post2?.ok === true, JSON.stringify(post2).slice(0, 160))
assert('顺延保留了原始日期', post2.task?.postponedFrom === before, `${post2.task?.postponedFrom} vs ${before}`)
assert('顺延后日期靠后', post2.task?.dueAt > before, `${before} → ${post2.task?.dueAt}`)

// ---------- 推一下就走：推进阶段 ----------
const target = st2.projects.find((p) => p.stage < 9)
const adv = await hit('POST', '/designer-desk/project/advance', {}, { id: target.id, note: '量房完成，户型已归档' })
assert('推进阶段返回 ok', adv?.ok === true, JSON.stringify(adv).slice(0, 200))
assert('阶段 +1', adv.project?.stage === target.stage + 1, `${target.stage} → ${adv.project?.stage}`)
assert('自动排出了下一步待办', Boolean(adv.createdTask?.id && adv.createdTask?.dueAt),
  JSON.stringify(adv.createdTask ?? null).slice(0, 200))
assert('新待办绑定了本项目', adv.createdTask?.projectId === target.id)
assert('流水写入了备注', JSON.stringify(adv.project?.logs ?? []).includes('量房完成'), '')

// 新待办应能在 state 里被看到
const st3 = await hit('GET', '/designer-desk/state')
assert('新待办已进入总待办列表', st3.tasks.some((t) => t.id === adv.createdTask.id))

// ---------- 新建项目：自动生成首条待办 ----------
const created = await hit('POST', '/designer-desk/project/save', {}, {
  project: {},
  customer: { name: '测试客户', community: '测试小区', roomNo: '101', style: '奶油风' },
})
assert('新建项目 ok', created?.ok === true, JSON.stringify(created).slice(0, 200))
assert('新建项目从第 1 阶段开始', created.project?.stage === 1)
assert('新建即生成首条待办', Boolean(created.createdTask?.id), JSON.stringify(created.createdTask ?? null).slice(0, 160))
assert('项目名按 小区-房号 生成', created.project?.name === '测试小区-101', String(created.project?.name))

// ---------- 沉默项目唤醒 ----------
const silent = (await hit('GET', '/designer-desk/state')).buckets.silent[0]
const woke = await hit('POST', '/designer-desk/project/wake', {}, { id: silent.id })
assert('沉默项目唤醒 ok', woke?.ok === true && woke.created === true, JSON.stringify(woke))
const woke2 = await hit('POST', '/designer-desk/project/wake', {}, { id: silent.id })
assert('唤醒去重（不重复生成）', woke2?.ok === true && woke2.created === false, JSON.stringify(woke2))

// ---------- 出图：未配置工作流时必须优雅失败，不能抛 ----------
const render = await hit('POST', '/designer-desk/comfy/render', {}, {
  projectId: created.project.id, space: '客厅', style: '奶油风', ratio: '16:9', count: 1,
})
assert('未启动 ComfyUI 时出图优雅失败', render?.ok === false && typeof render.error === 'string',
  JSON.stringify(render).slice(0, 200))

// ---------- 第 2 期：工地巡检 / 材料进场 / 灵感素材库（前端已接，必须真跑） ----------
{
  const stP2 = await hit('GET', '/designer-desk/state')
  assert('state 回读含 sites / materials / refimages 三表',
    Array.isArray(stP2.sites) && Array.isArray(stP2.materials) && Array.isArray(stP2.refimages))
  assert('三表种子数据已预置（第 2 期不再是悬空数据）',
    stP2.sites.length >= 5 && stP2.materials.length >= 5 && stP2.refimages.length >= 5,
    `sites ${stP2.sites.length} / materials ${stP2.materials.length} / refimages ${stP2.refimages.length}`)

  // 注意：/state 返回的是库内数组的引用（真机走 HTTP 序列化，看不出问题），
  // 所以基线必须取长度快照，不能留着数组引用后面再比。
  const baseSites = stP2.sites.length
  const baseMaterials = stP2.materials.length
  const baseRefimages = stP2.refimages.length

  const siteProject = stP2.projects.find((p) => p.stage === 7) ?? stP2.projects[0]

  // 巡检：新建 → 改状态 → 删除
  const s1 = await hit('POST', '/designer-desk/site/save', {}, {
    site: { projectId: siteProject.id, node: '木工', status: '待巡检', plannedAt: '2026-01-05', note: '集成吊顶' },
  })
  assert('site/save 新建 ok', s1?.ok === true && Boolean(s1.site?.id), JSON.stringify(s1).slice(0, 200))
  const s2 = await hit('POST', '/designer-desk/site/save', {}, {
    site: { ...s1.site, status: '需整改', note: '龙骨间距超标' },
  })
  assert('site/save 带 id 时是更新而非新建', s2?.ok === true && s2.site?.id === s1.site.id, `${s1.site?.id} vs ${s2.site?.id}`)
  assert('巡检状态与备注已更新', s2.site?.status === '需整改' && s2.site?.note === '龙骨间距超标', JSON.stringify(s2.site).slice(0, 160))
  const s2b = await hit('POST', '/designer-desk/site/save', {}, { site: { ...s2.site, plannedAt: '' } })
  assert('清空巡检计划日落成 undefined 而非空串', s2b.site?.plannedAt === undefined, JSON.stringify(s2b.site?.plannedAt))
  const sDel = await hit('POST', '/designer-desk/site/delete', {}, { id: s1.site.id })
  assert('site/delete ok', sDel?.ok === true, JSON.stringify(sDel))

  // 材料：价格必须转成数字，空进场日必须落成 undefined
  const m1 = await hit('POST', '/designer-desk/material/save', {}, {
    material: { projectId: siteProject.id, name: '岩板餐桌', category: '家具', price: '8600', qty: '1', unit: '套', arriveAt: '2026-12-20' },
  })
  assert('material/save 新建 ok', m1?.ok === true && m1.material?.name === '岩板餐桌', JSON.stringify(m1).slice(0, 200))
  assert('材料价格已转数字（不落字符串）', m1.material?.price === 8600 && typeof m1.material.price === 'number',
    `${typeof m1.material?.price} ${m1.material?.price}`)
  const m2 = await hit('POST', '/designer-desk/material/save', {}, { material: { ...m1.material, status: '在途', arriveAt: '' } })
  assert('材料状态可更新', m2?.material?.status === '在途', String(m2?.material?.status))
  assert('清空进场日落成 undefined 而非空串', m2.material?.arriveAt === undefined, JSON.stringify(m2.material?.arriveAt))
  const mDel = await hit('POST', '/designer-desk/material/delete', {}, { id: m1.material.id })
  assert('material/delete ok', mDel?.ok === true, JSON.stringify(mDel))

  // 参考图：标签归一 + 评分夹紧
  const r1 = await hit('POST', '/designer-desk/refimage/save', {}, {
    refimage: { title: '侘寂客厅', url: 'https://example.com/a.jpg', tags: '侘寂风, 客厅', score: 5, source: '好好住' },
  })
  assert('refimage/save 新建 ok', r1?.ok === true && r1.refimage?.title === '侘寂客厅', JSON.stringify(r1).slice(0, 200))
  assert('标签已归一成数组', Array.isArray(r1.refimage?.tags) && r1.refimage.tags.length === 2, JSON.stringify(r1.refimage?.tags))
  const r2 = await hit('POST', '/designer-desk/refimage/save', {}, { refimage: { ...r1.refimage, score: 99 } })
  assert('评分上限夹到 5', r2.refimage?.score === 5, String(r2.refimage?.score))
  const r3 = await hit('POST', '/designer-desk/refimage/save', {}, {
    refimage: { title: '标签拆分测试', tags: 'a,,b  c，d', score: 0 },
  })
  assert('标签按逗号/空格/中文逗号拆分并去空', JSON.stringify(r3.refimage?.tags) === JSON.stringify(['a', 'b', 'c', 'd']),
    JSON.stringify(r3.refimage?.tags))
  assert('评分下限夹到 1', r3.refimage?.score === 1, String(r3.refimage?.score))
  await hit('POST', '/designer-desk/refimage/delete', {}, { id: r1.refimage.id })
  await hit('POST', '/designer-desk/refimage/delete', {}, { id: r3.refimage.id })

  // 删除只影响自己，种子数据不能被误删
  const stP2b = await hit('GET', '/designer-desk/state')
  assert('删除新建项后种子数据完好',
    stP2b.sites.length === baseSites && stP2b.materials.length === baseMaterials && stP2b.refimages.length === baseRefimages,
    `sites ${stP2b.sites.length}/${baseSites} · materials ${stP2b.materials.length}/${baseMaterials} · refimages ${stP2b.refimages.length}/${baseRefimages}`)
}

// ---------- 备份 / 导入 ----------
const exp = await hit('GET', '/designer-desk/export')
assert('导出备份 ok 且有文件路径', exp?.ok === true && String(exp.file).includes('backup-'), String(exp.file))
const imp = await hit('POST', '/designer-desk/import', {}, { payload: exp.payload })
assert('导入恢复 ok（幂等回灌）', imp?.ok === true, JSON.stringify(imp))

// ---------- 清空 + 空数据不崩（铁律 10 第 4 条）----------
const cleared = await hit('POST', '/designer-desk/seed/clear', {}, {})
assert('清空数据 ok', cleared?.ok === true)
const stEmpty = await hit('GET', '/designer-desk/state')
assert('清空后不崩、返回空集合', stEmpty?.ok === true && stEmpty.projects.length === 0 && stEmpty.buckets.overdue.length === 0)
const todayEmpty = await hit('GET', '/designer-desk/today')
assert('空数据下 /today 正常', todayEmpty?.ok === true)
const cmdToday = await ctx.__commands['designer-desk.today']({ options: {} })
assert('空数据下今日命令有可读输出', typeof cmdToday === 'string' && cmdToday.includes('今日待处理'), String(cmdToday).slice(0, 80))

// ---------- 服务 provide（cordis 用 app.provide，服务注册在根上）----------
assert('业务插件已 provide designerDesk 服务', Boolean(app.designerDesk),
  `根上可见的服务：${Object.keys(app).filter((k) => typeof app[k] !== 'function').slice(0, 8).join(', ')}`)
if (app.designerDesk) {
  const svcState = await app.designerDesk.getState()
  assert('provide 的服务可调用', Array.isArray(svcState.projects))
  assert('服务能读到项目视图', svcState.projects.length >= 3, `项目 ${svcState.projects?.length}`)
  // 控制器正是通过 static inject=['designerDesk'] 拿到这个服务的
  assert('控制器能通过 inject 拿到该服务', Boolean(controller.ctx?.designerDesk),
    '控制器 ctx 上读不到 designerDesk —— static inject 可能没生效')
}

// ---------- 日期边界（铁律 10 第 5 条）：跨月 / 跨年 —— 测真实实现，不是复制品 ----------
const { addDaysStr, diffDays, stageDef, STAGES } = mod
assert('导出 addDaysStr 供自检', typeof addDaysStr === 'function')
assert('跨月：1月31日 +1 天 = 2月1日', addDaysStr('2026-01-31', 1) === '2026-02-01', addDaysStr('2026-01-31', 1))
assert('跨年：12月31日 +1 天 = 次年 1月1日', addDaysStr('2025-12-31', 1) === '2026-01-01', addDaysStr('2025-12-31', 1))
assert('闰年：2月28日 +1 天 = 2月29日', addDaysStr('2024-02-28', 1) === '2024-02-29', addDaysStr('2024-02-28', 1))
assert('跨月回退：3月1日 -1 天 = 2月28日', addDaysStr('2026-03-01', -1) === '2026-02-28', addDaysStr('2026-03-01', -1))
assert('日期差：2月1日 − 1月31日 = 1 天', diffDays('2026-02-01', '2026-01-31') === 1, String(diffDays('2026-02-01', '2026-01-31')))
assert('日期差跨年：1月1日 − 12月31日 = 1 天', diffDays('2026-01-01', '2025-12-31') === 1, String(diffDays('2026-01-01', '2025-12-31')))
assert('阶段模型 9 段且每段有标准动作', STAGES.length === 9 && STAGES.every((s) => s.action && s.deliver))
assert('第 9 阶段没有下一步（结项收尾）', stageDef(9).next === null)

// ---------- client half：把 lib/client.js 真正求值，验证 ModuleLoader 包装与插槽注册 ----------
{
  const { readFile } = await import('node:fs/promises')
  const vm = await import('node:vm')
  const clientSrc = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')

  // 宿主 React 的最小替身（apply 阶段只会注册组件，不会渲染，所以不需要真的 hooks）
  const reactStub = {
    useState: (v) => [v, () => {}],
    useEffect: () => {},
    useCallback: (f) => f,
    useMemo: (f) => f(),
    useRef: (v) => ({ current: v }),
    createElement: () => null,
  }
  const jsxStub = { jsx: () => null, jsxs: () => null, Fragment: {} }

  let loaded = null
  const sandbox = {
    window: {
      __ModuleLoader__: {
        load: (def) => {
          loaded = def
        },
      },
      innerWidth: 1440,
      addEventListener: () => {},
      removeEventListener: () => {},
      setInterval: () => 0,
      clearInterval: () => {},
      setTimeout: () => 0,
      clearTimeout: () => {},
    },
    document: { createElement: () => ({ click: () => {} }) },
    console,
  }
  sandbox.globalThis = sandbox
  sandbox.self = sandbox

  assert('lib/client.js 能被求值（语法合法）', typeof clientSrc === 'string' && clientSrc.length > 1000, `${clientSrc.length} 字符`)

  vm.runInNewContext(clientSrc, sandbox, { filename: 'lib/client.js' })

  assert('__ModuleLoader__.load 被调用', Boolean(loaded), 'factory 未被注册')
  assert('ModuleLoader id 等于包名', loaded?.id === 'designer-desk', String(loaded?.id))

  const clientExports = loaded.factory((name) => {
    if (name === 'react') return reactStub
    if (name === 'react/jsx-runtime') return jsxStub
    if (name === 'react-dom' || name === 'react-dom/client') return {}
    throw new Error(`client bundle 引用了未声明为 external 的模块：${name}`)
  })

  assert('client 导出 inject', Array.isArray(clientExports?.inject), JSON.stringify(clientExports?.inject))
  // ⚠️ 这里是**服务键名**，不是包名 —— 与 package.json 的 dsh.client.inject
  //（包名，决定宿主加载哪些 bundle）是两套东西。
  // cordis 严格注入：漏了 'remote' →读 ctx.remote 抛
  // `cannot get property "remote" without inject`，界面渲染正常但数据全断。
  assert('client inject 含 slots 与 remote 两个服务键',
    clientExports.inject.includes('slots') && clientExports.inject.includes('remote'),
    `实际：${JSON.stringify(clientExports.inject)}`)
  assert('client inject 不含包名（全限定@ 开头的是包名，不该出现在这里）',
    !clientExports.inject.some((n) => String(n).startsWith('@')),
    `混入了包名：${JSON.stringify(clientExports.inject)}`)
  assert('client 导出 apply 函数', typeof clientExports?.apply === 'function')

  // 正常路径：注册三个插槽
  // ⚠️ 假 slots 必须实现 inject() / register()，且 register 的**第二参数**是组件。
  // 真实契约：`slots.inject(slot, () => slots.register(entry, Component))`
  // —— 组件不是 entry 的字段。这一点错的话，宿主会渲染出空白但零报错。
  const registered = []
  const injected = []
  const rendered = []
  const labelIssues = []
  const seenIds = new Set()
  const makeSlots = () => ({
    inject: (name, cb) => {
      injected.push(name)
      const dispose = cb()
      return typeof dispose === 'function' ? dispose : () => {}
    },
    register: (entry, Comp) => {
      // 若把组件塞进 entry.component，说明用的是旧（错误）契约
      if (entry && entry.component) rendered.push(`BAD:${entry.component.name ?? 'anon'}`)
      rendered.push(`${entry.name}:${Comp ? (Comp.name ?? 'anon') : 'NO_COMPONENT'}`)
      // label 是字符串而非函数 → 宿主渲染不出文字，也是一种静默失效
      if (entry && typeof entry.label !== 'function') labelIssues.push(`${entry.name} 不是函数`)
      if (entry && entry.id && seenIds.has(entry.id)) labelIssues.push(`id 冲突: ${entry.id}`)
      if (entry && entry.id) seenIds.add(entry.id)
      registered.push(entry.name)
      return () => {}
    },
  })
  clientExports.apply({
    name: 'designer-desk',
    logger: { warn: () => {}, error: () => {}, info: () => {} },
    slots: makeSlots(),
  })

  assert('插槽都经由 slots.inject 声明（不是裸register）',
    injected.length === registered.length && injected.every((n) => registered.includes(n)),
    `inject=${injected.join(',')} register=${registered.join(',')}`)

  // 回归：组件必须走第二参数。传成 entry.component 是 rc.3 最隐蔽的坑 ——
  // 标签正常显示但内容空白，零控制台报错。
  assert('组件作为 register() 第二参数传入（不是 entry.component 字段）',
    !rendered.some((r) => r.startsWith('BAD:')) && rendered.every((r) => !r.endsWith(':NO_COMPONENT')),
    rendered.join(' | '))

  assert('注册了 3 个插槽', registered.length === 3, JSON.stringify(registered))

  assert('主界面挂在 main 插槽（整页容器）',
    registered.includes('main'),
    `实际：${registered.join(',')}`)
  assert('不再注册 conversation.view（会话消息流容器，传组件会被忽略）',
    !registered.includes('conversation.view'),
    `仍注册了：${registered.join(',')}`)
  assert('不再注册 rc.3 已移除的 workspace 槽位', !registered.includes('workspace'),
    `仍注册了：${registered.join(',')}`)

  // label 是字符串而非函数 → 宿主渲染不出文字；id 冲突 → 后注册的覆盖先注册的
  assert('所有 entry 的 label 都是函数（字符串在 rc.3 不生效）',
    labelIssues.filter((x) => x.includes('不是函数')).length === 0,
    labelIssues.join(', '))
  assert('entry id 全局唯一（冲突会静默覆盖）',
    labelIssues.filter((x) => x.startsWith('id 冲突')).length === 0,
    labelIssues.join(', '))

  // 降级路径：宿主没有 slots 服务时不能抛异常
  let degradedOk = true
  try {
    clientExports.apply({ name: 'designer-desk', logger: { warn: () => {}, error: () => {} } })
  } catch {
    degradedOk = false
  }
  assert('宿主无 slots 服务时优雅降级不抛异常', degradedOk)
}

// ---------- 日志里不该有 error ----------
const errs = logs.filter(([lvl]) => lvl === 'error')
assert('装配过程无 error 级日志', errs.length === 0, JSON.stringify(errs).slice(0, 300))

/* ------------------------------------------------------------------ *
 * 输出
 * ------------------------------------------------------------------ */

let failed = 0
console.log('')
for (const r of results) {
  if (!r.ok) failed++
  console.log(`${r.ok ? '  PASS ' : '  FAIL '} ${r.name}`)
  if (!r.ok && r.detail) console.log(`         └─ ${r.detail}`)
}
console.log(`${'─'.repeat(58)}`)
console.log(`  合计 ${results.length} 项，通过 ${results.length - failed} 项，失败 ${failed} 项\n`)

// 卸载插件：清理定时器，避免冒烟脚本被 15s/60s 定时器挂住进程
try {
  ctx.__dispose?.()
} catch {
  /* ignore */
}

await rm(tmp, { recursive: true, force: true })

if (failed > 0) {
  console.error('[smoke] 冒烟未通过')
  process.exit(1)
}
console.log('[smoke] 全部通过 · Node half 链路可用')
