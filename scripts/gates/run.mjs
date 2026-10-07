#!/usr/bin/env node
/**
 * designer-desk 一致性门禁
 *
 * 纯 Node 实现，零依赖。校验 DSH 插件合同中的硬性约束，任何一条不过即 exit 1。
 *
 * 注意：本文件的 check() 只接受「同步」断言函数。
 * 所有需要读文件的断言都在前面一次性预读，避免 async 回调把异常抛出 try/catch 之外。
 * 真实的「路由能不能被调用」由 scripts/smoke.mjs 用假 ctx 实跑验证，比字符串匹配更强。
 */
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '../..')

const results = []

/** 只接受同步函数 */
function check(name, fn) {
  try {
    const detail = fn()
    if (detail && typeof detail.then === 'function') {
      results.push({ name, ok: false, detail: '断言函数必须是同步的（async 会被吞异常）' })
      return
    }
    results.push({ name, ok: true, detail: String(detail ?? '') })
  } catch (err) {
    results.push({ name, ok: false, detail: err?.message ?? String(err) })
  }
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg)
}

async function readOptional(rel) {
  try {
    return await readFile(path.join(root, rel), 'utf8')
  } catch {
    return null
  }
}

async function exists(rel) {
  try {
    await stat(path.join(root, rel))
    return true
  } catch {
    return false
  }
}

/* ------------------------------------------------------------------ *
 * 预读（全部同步断言之前完成）
 * ------------------------------------------------------------------ */

const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const NAME = pkg.name
const patch = await readFile(path.join(root, 'cordis.patch.yml'), 'utf8')
const libIndex = await readOptional('lib/index.js')
const libClient = await readOptional('lib/client.js')
const libApi = await readOptional('lib/api.js')

/* ------------------------------------------------------------------ *
 * 1. package.json 合同
 * ------------------------------------------------------------------ */

check('package.json: name 为小写连字符形式', () => {
  assert(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(NAME), `非法包名: ${NAME}`)
  return NAME
})

check('package.json: type=module 且 main=lib/index.js', () => {
  assert(pkg.type === 'module', `type 必须为 module，实际: ${pkg.type}`)
  assert(pkg.main === 'lib/index.js', `main 必须为 lib/index.js，实际: ${pkg.main}`)
  return `${pkg.type} / ${pkg.main}`
})

check('package.json: exports 必备四项', () => {
  const e = pkg.exports ?? {}
  for (const k of ['.', './client', './cordis.patch.yml', './package.json']) {
    assert(e[k], `exports 缺少 "${k}"`)
  }
  return Object.keys(e).join(' ')
})

check('package.json: dsh.bundle.patch + dsh.client.platform=web', () => {
  assert(pkg.dsh?.bundle?.patch === './cordis.patch.yml', 'dsh.bundle.patch 缺失或不等于 ./cordis.patch.yml')
  assert(pkg.dsh?.client?.platform === 'web', 'dsh.client.platform 必须为 web')
  return `${pkg.dsh.bundle.patch} / ${pkg.dsh.client.platform}`
})

check('package.json: client.inject 用全限定包名（不是短服务名）', () => {
  const inject = pkg.dsh?.client?.inject ?? []
  assert(Array.isArray(inject) && inject.length > 0, 'client.inject 为空 —— apply 不会被调用')
  // 写 ['slots'] 这类短服务名，宿主解析不到 → apply 静默不执行 → 界面永不渲染
  const short = inject.filter((n) => !String(n).startsWith('@'))
  assert(short.length === 0, `client.inject 含短服务名 ${short.join(', ')} —— 必须用全限定包名（如 @deepseek-ai/dsh-client-ui-slots）`)
  assert(inject.includes('@deepseek-ai/dsh-client-ui-slots'),
    'client.inject 缺 @deepseek-ai/dsh-client-ui-slots —— 拿不到 slots 服务就无法注册界面')
  return inject.length + ' 个'
})

check('禁止声明 @deepseek-ai/* 依赖', () => {
  const buckets = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']
  const bad = []
  for (const b of buckets) {
    for (const dep of Object.keys(pkg[b] ?? {})) {
      if (dep.startsWith('@deepseek-ai/')) bad.push(`${b}:${dep}`)
    }
  }
  assert(bad.length === 0, `发现禁用依赖 → ${bad.join(', ')}`)
  return '无'
})

check('package.json#files 覆盖发布产物', () => {
  const files = pkg.files ?? []
  for (const f of ['lib/index.js', 'lib/client.js', 'cordis.patch.yml', 'README.md']) {
    assert(files.includes(f), `files 缺少 "${f}"`)
  }
  return files.join(' ')
})

/* ------------------------------------------------------------------ *
 * 2. patch 合同
 * ------------------------------------------------------------------ */

check('cordis.patch.yml: insert id/name 等于包名', () => {
  const id = patch.match(/^\s*-?\s*id:\s*(\S+)\s*$/m)?.[1]
  const nameLine = patch.match(/^\s*-?\s*name:\s*(\S+)\s*$/m)?.[1]
  assert(id === NAME, `insert id=${id} ≠ 包名 ${NAME}`)
  assert(nameLine === NAME, `insert name=${nameLine} ≠ 包名 ${NAME}`)
  return `${id} / ${nameLine}`
})

/* ------------------------------------------------------------------ *
 * 3. 构建产物
 * ------------------------------------------------------------------ */

check('构建产物存在（lib/index.js + lib/client.js）', () => {
  assert(libIndex !== null, 'lib/index.js 不存在 —— 请先运行 pnpm run bundle')
  assert(libClient !== null, 'lib/client.js 不存在 —— 请先运行 pnpm run bundle')
  return 'both present'
})

check('lib/index.js: Node half 导出了 inject / apply', () => {
  const src = libIndex
  assert(/\bapply\b/.test(src) && /export\s*\{/.test(src), '未导出 apply')
  assert(/\binject\b/.test(src), '未导出 inject')
  return 'inject / apply'
})

check('lib/index.js: 冒烟功能齐备（hello 命令 + Remote 命名空间）', () => {
  const src = libIndex
  // 通信走 Typert Remote，没有 HTTP 路由前缀了 —— 校验命名空间常量与冒烟命令
  assert(src.includes('designerDesk'), '缺少 Remote 命名空间 designerDesk')
  assert(src.includes('health'), '缺少 health 冒烟端点')
  assert(src.includes('designer-desk.hello'), '缺少 designer-desk.hello 冒烟命令')
  assert(!/webServer/.test(src), 'Node half 仍依赖 webServer —— 通信应已改走 Typert Remote')
  return 'designer-desk.hello + Remote designerDesk'
})

check('lib/api.js: Remote 控制器已构建且 default 导出', () => {
  assert(libApi !== null, 'lib/api.js 不存在 —— 请先运行 pnpm run bundle')
  assert(/export\s*\{[^}]*DeskRemote[^}]*\}/.test(libApi) || /as DeskRemote/.test(libApi),
    'lib/api.js 未导出 DeskRemote')
  assert(/default/.test(libApi), 'lib/api.js 缺少 default 导出（Loader 只实例化 default）')
  return 'DeskRemote + default'
})

check('lib/api.js: Typert/cordis 保持 external（不能打进包）', () => {
  const src = libApi
  assert(src.includes('@deepseek-ai/dsh-typert-protocol'), '未引用 typert-protocol —— 检查 external 配置')
  const leaks = ['function Remote(', 'TypertRemoteService']
  const bundled = leaks.filter((k) => {
    // external 正确时，这些标识符会以 import 形式出现而非本地定义
    const defined = new RegExp(`(function|class)\\s+${k.replace(/[()]/g, '')}`).test(src)
    return defined
  })
  assert(bundled.length === 0, `typert 运行时被打包进来 → ${bundled.join(', ')}`)
  return 'external 正常'
})

check('cordis.patch.yml: 两条 entry（业务 + Remote 控制器）', () => {
  const entries = [...patch.matchAll(/^\s*-\s*id:\s*(\S+)\s*$/gm)].map((m) => m[1])
  assert(entries.length >= 2, `patch 只有 ${entries.length} 条 entry —— Remote 控制器必须单列一条`)
  assert(entries.includes(NAME), `缺少业务 entry ${NAME}`)
  assert(
    entries.some((e) => e.startsWith(`${NAME}-`)) || patch.includes(`${NAME}/api`),
    '缺少指向 <包名>/api 的 entry —— 控制器挂在子fiber 上会导致客户端 $mount 永远 waiting',
  )
  return entries.join(' + ')
})

check('package.json: 导出 ./api（控制器的独立入口）', () => {
  assert(pkg.exports?.['./api'], 'exports 缺少 "./api" —— Loader 无法加载 Remote 控制器')
  const files = pkg.files ?? []
  assert(files.includes('lib/api.js'), 'files 缺少 lib/api.js —— 发布后控制器不存在')
  return 'lib/api.js'
})

check('package.json: client.inject 含 api-gateway（remote 服务的提供方）', () => {
  const inject = pkg.dsh?.client?.inject ?? []
  // ctx.remote 由 @deepseek-ai/dsh-api-gateway 提供
  // （其 client.js 里 `super(ctx, "remote")`）。
  // 漏了它 → `cannot get property "remote" without inject`，
  // 界面渲染正常但所有数据请求失败。
  assert(inject.includes('@deepseek-ai/dsh-api-gateway'),
    'client.inject 缺 @deepseek-ai/dsh-api-gateway —— 拿不到 remote 服务，数据通道全断')
  return 'api-gateway 已注入'
})

check('lib/client.js: 侧栏插槽传图标而非完整界面（避免重复渲染）', () => {
  const src = libClient
  // 侧栏面板会完整渲染传入的组件。传App 会让工作台在主区和侧栏各画一遍。
  assert(!/sidebar\.panellist[\s\S]{0,200}?,\s*App\s*[,)]/.test(src),
    'sidebar.panellist 仍在传 App —— 侧栏会把整个工作台再渲染一遍')
  // 图标组件必须带 data-dsh-panel-entry，否则宿主点不动
  assert(src.includes('data-dsh-panel-entry') || src.includes('dsh-panel-entry'),
    'DeskIcon 缺 data-dsh-panel-entry —— 宿主靠它把点击路由到 main 面板')
  return '侧栏传图标'
})

check('lib/client.js: ModuleLoader id 等于包名', () => {
  const m = libClient.match(/__ModuleLoader__\.load\(\s*\{\s*id:\s*["']([^"']+)["']/)
  assert(m, '未找到 __ModuleLoader__.load 包装')
  assert(m[1] === NAME, `ModuleLoader id=${m[1]} ≠ 包名 ${NAME}`)
  return m[1]
})

check('lib/client.js: React 保持 external 未被重复打包', () => {
  const src = libClient
  assert(/require\(["']react["']\)/.test(src), '未以 require("react") 引用宿主 React —— 可能把 React 打进了包')
  const leaks = ['ReactCurrentDispatcher', 'react-dom.development', '__SECRET_INTERNALS_DO_NOT_USE']
  const hit = leaks.filter((k) => src.includes(k))
  assert(hit.length === 0, `检测到 React 内部实现被打包 → ${hit.join(', ')}`)
  return 'external 正常'
})

check('lib/client.js: 注册 rc.3 实际提供的插槽', () => {
  const src = libClient
  // ⚠️ 两个已失效的槽位（注册进去都不报错，但界面永不渲染）：
  //   workspace          —— rc.3 已移除该槽位
  //   conversation.view  —— 是「会话消息流的声明式容器」，entry 靠 children + inject
  //                        组视图树，传组件会被忽略
  // 整页自定义界面唯一正确的入口是 `main`（同 profile 的 dsh-studio-dashboard 就用它）。
  for (const slot of ['main', 'settings.section', 'sidebar.panellist']) {
    assert(src.includes(`"${slot}"`) || src.includes(`'${slot}'`), `未注册插槽 ${slot}`)
  }
  for (const dead of ['workspace', 'conversation.view']) {
    assert(!src.includes(`"${dead}"`) && !src.includes(`'${dead}'`),
      `仍在注册已失效的 ${dead} 槽位 —— 界面会静默不渲染`)
  }
  return 'main / settings.section / sidebar.panellist'
})

check('lib/client.js: 组件走 register() 第二参数（不是 entry.component）', () => {
  const src = libClient
  // ⚠️ rc.3 最隐蔽的坑：entry.component 会被宿主忽略 → 标签出现、内容空白、零报错。
  // 正确形态是 slots.register(entry, Component)，见 dsh-studio-dashboard。
  assert(!/component:\s*[A-Za-z]/.test(src),
    '仍把组件塞进 entry.component —— 宿主不读该字段，界面会空白且无报错')
  // register 的调用形态应带第二个参数
  assert(/register\([a-zA-Z_$][\w$]*,\s*[A-Za-z]/.test(src) || /slots\.inject/.test(src),
    '未见 slots.inject(...) 或 register(entry, Component) 形态')
  return 'register(entry, Component)'
})

check('lib/client.js: 插槽经 slots.inject 声明（不是裸 register）', () => {
  const src = libClient
  // 直接 slots.register({name}) 会被拒：
  // `slot "xxx" is not declared (a parent entry's children table must declare it)`
  assert(src.includes('.inject('), '未用 slots.inject 包裹注册 —— 插槽会被宿主拒绝')
  return 'inject 包裹'
})

check('lib/client.js: 未打包出第二份 React hooks 运行时', () => {
  const src = libClient
  assert(!src.includes('useState: '), '疑似把 React hooks 实现打进了包')
  return 'ok'
})

/* ------------------------------------------------------------------ *
 * 4. 打印
 * ------------------------------------------------------------------ */

let failed = 0
console.log('\ndesigner-desk · gates\n' + '─'.repeat(58))
for (const r of results) {
  if (!r.ok) failed++
  console.log(`${r.ok ? '  PASS ' : '  FAIL '} ${r.name}`)
  if (!r.ok) console.log(`         └─ ${r.detail}`)
  else if (r.detail) console.log(`         ·  ${r.detail}`)
}
console.log('─'.repeat(58))
console.log(`  合计 ${results.length} 项，通过 ${results.length - failed} 项，失败 ${failed} 项\n`)

if (failed > 0) {
  console.error('[gates] 未通过 —— 不得进入安装冒烟阶段')
  process.exit(1)
}
console.log('[gates] 全部通过')
