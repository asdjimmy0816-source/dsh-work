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

check('lib/index.js: 冒烟功能齐备（hello 命令 + 路由前缀 + health）', () => {
  const src = libIndex
  // 路由路径由 PREFIX 常量拼接，构建后不是单一字面量 —— 分别校验片段，
  // 真实可调用性由 scripts/smoke.mjs 实跑验证。
  assert(src.includes('/designer-desk'), '缺少路由前缀 /designer-desk')
  assert(src.includes('health'), '缺少 health 冒烟路由')
  assert(src.includes('designer-desk.hello'), '缺少 designer-desk.hello 冒烟命令')
  return 'designer-desk.hello + /designer-desk/health'
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

check('lib/client.js: 注册了 workspace / settings / status 三个插槽', () => {
  const src = libClient
  for (const slot of ['workspace', 'settings', 'status']) {
    assert(src.includes(`"${slot}"`) || src.includes(`'${slot}'`), `未注册插槽 ${slot}`)
  }
  return 'workspace / settings / status'
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
