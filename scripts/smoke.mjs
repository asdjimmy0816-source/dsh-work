#!/usr/bin/env node
/**
 * designer-desk · 冒烟自检
 *
 * 用一个假的 ctx 把 lib/index.js 真正跑起来，验证：
 *   ① 插件能被装配、路由能被注册、启动自检不抛异常
 *   ② 首次打开会预置示例数据，且四分区里「逾期」不为空（铁律 6）
 *   ③ 命令 / 待办 / 推进 / 出图节点 的核心链路真能跑通
 *   ④ 跨月、跨年的日期边界计算正确（铁律 10）
 *
 * 全程写在临时目录里，不碰用户真实的 ~/.designer-desk。
 */
import { mkdtemp, rm } from 'node:fs/promises'
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
 * 假 ctx
 * ------------------------------------------------------------------ */

const routes = new Map()
const logs = []

const ctx = {
  name: 'designer-desk',
  logger: {
    info: (m) => logs.push(['info', m]),
    warn: (m) => logs.push(['warn', m]),
    error: (m) => logs.push(['error', m]),
  },
  effect(cb) {
    const dispose = cb()
    ctx.__dispose = dispose
    return dispose
  },
  setInterval() {
    return 1
  },
  setTimeout() {
    return 2
  },
  on() {
    return () => {}
  },
  emit() {},
  provide(name, value) {
    ctx.__provided = ctx.__provided ?? {}
    ctx.__provided[name] = value
  },
  command(name) {
    const chain = {
      alias() {
        return chain
      },
      option() {
        return chain
      },
      action(fn) {
        ctx.__commands = ctx.__commands ?? {}
        ctx.__commands[name] = fn
        return chain
      },
    }
    return chain
  },
  webServer: {
    register(cb) {
      cb({
        get(p, h) {
          routes.set(`GET ${p}`, h)
        },
        post(p, h) {
          routes.set(`POST ${p}`, h)
        },
      })
      return () => routes.clear()
    },
  },
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function makeReq(query = {}, body = {}) {
  return { query, url: '', json: async () => body }
}

async function hit(method, p, query, body) {
  const h = routes.get(`${method} ${p}`)
  if (!h) throw new Error(`路由未注册：${method} ${p}`)
  return await h(makeReq(query, body))
}

/* ------------------------------------------------------------------ *
 * 跑
 * ------------------------------------------------------------------ */

console.log(`\ndesigner-desk · 冒烟自检\n临时数据目录 ${tmp}\n${'─'.repeat(58)}`)

const mod = await import('../lib/index.js')

assert('导出 inject', Array.isArray(mod.inject), `实际：${JSON.stringify(mod.inject)}`)
assert('inject 含 webServer', mod.inject.includes('webServer'), JSON.stringify(mod.inject))
assert('导出 apply 函数', typeof mod.apply === 'function')

mod.apply(ctx)
await sleep(300) // 等启动自检（ensureDirs + 首次 seeding）跑完

// ---------- 路由注册 ----------
assert('健康路由已注册', routes.has('GET /designer-desk/health'))
assert('状态路由已注册', routes.has('GET /designer-desk/state'))
assert('出图提交路由已注册', routes.has('POST /designer-desk/comfy/render'))
assert('导入恢复路由已注册', routes.has('POST /designer-desk/import'))

// ---------- 第 2 期六条路由必须真的注册（M4/M5/M6 前端已接） ----------
for (const p of ['/designer-desk/site/save', '/designer-desk/site/delete', '/designer-desk/material/save', '/designer-desk/material/delete', '/designer-desk/refimage/save', '/designer-desk/refimage/delete']) {
  assert(`第 2 期路由已注册 ${p}`, routes.has(`POST ${p}`))
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

// ---------- 服务 provide ----------
assert('已 provide designerDesk 服务', Boolean(ctx.__provided?.designerDesk))
if (ctx.__provided?.designerDesk) {
  const svcState = await ctx.__provided.designerDesk.getState()
  assert('provide 的服务可调用', Array.isArray(svcState.projects))
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
  assert('client 只注入 slots', JSON.stringify(clientExports.inject) === '["slots"]', JSON.stringify(clientExports.inject))
  assert('client 导出 apply 函数', typeof clientExports?.apply === 'function')

  // 正常路径：注册三个插槽
  const registered = []
  clientExports.apply({
    name: 'designer-desk',
    logger: { warn: () => {}, error: () => {}, info: () => {} },
    slots: { register: (def) => registered.push(def.name) },
  })
  assert('注册了 3 个插槽', registered.length === 3, JSON.stringify(registered))
  assert('插槽名为 workspace / settings / status',
    ['workspace', 'settings', 'status'].every((n) => registered.includes(n)), JSON.stringify(registered))

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
