#!/usr/bin/env node
/**
 * designer-desk 构建脚本
 *
 * 产出三个产物：
 *   1. lib/index.js  —— Node half，ESM，供 Cordis 插件树加载（业务插件）
 *   2. lib/api.js    —— Remote 控制器，ESM，独立 Loader entry（default 导出控制器类）
 *   3. lib/client.js —— 浏览器 client half，CJS，外层包一层 window.__ModuleLoader__
 *
 * 铁律：
 *   - React 相关四个包必须 external（否则第二份 React 进包 → hooks 崩溃）
 *   - client 的 ModuleLoader id 必须等于包名
 *   - lib/api.js 必须 default 导出控制器类：Loader 在根层实例化每条 entry 的 default
 */
import { build } from 'esbuild'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, '..')
const outdir = path.join(root, 'lib')

const pkg = JSON.parse(
  await (await import('node:fs/promises')).readFile(path.join(root, 'package.json'), 'utf8'),
)
const PLUGIN_NAME = pkg.name

/** 浏览器 client 必须保持 external —— 由 DSH 宿主提供 */
const REACT_EXTERNAL = ['react', 'react/jsx-runtime', 'react-dom', 'react-dom/client']

/** DSH profile 已提供的包，禁止打包（gates 会校验） */
const DSH_EXTERNAL = ['@deepseek-ai/dsh-typert-protocol', '@deepseek-ai/cordis']

const MODULE_LOADER_HEAD = `window.__ModuleLoader__.load({ id: ${JSON.stringify(PLUGIN_NAME)}, factory: (require) => {
var module = { exports: {} };
var exports = module.exports;
`

const MODULE_LOADER_TAIL = `
return module.exports;
} });
`

async function sizeOf(file) {
  try {
    const s = await stat(file)
    return `${(s.size / 1024).toFixed(1)} KB`
  } catch {
    return '??'
  }
}

async function main() {
  await rm(outdir, { recursive: true, force: true })
  await mkdir(outdir, { recursive: true })

  // ---------- 1) Node half ----------
  await build({
    entryPoints: [path.join(root, 'src/index.ts')],
    outfile: path.join(outdir, 'index.js'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: ['node18'],
    sourcemap: false,
    legalComments: 'none',
    logLevel: 'warning',
  })
  console.log(`[bundle] lib/index.js   ${await sizeOf(path.join(outdir, 'index.js'))}`)

  // ---------- 2) Remote 控制器（独立 Loader entry）----------
  // DSH 的包由 profile 提供，必须 external —— 否则会把 typert 运行时打进包，
  // 导致控制器注册到另一套 Service 实例上，客户端 $mount 永远 waiting。
  await build({
    entryPoints: [path.join(root, 'src/api.ts')],
    outfile: path.join(outdir, 'api.js'),
    bundle: true,
    format: 'esm',
    platform: 'node',
    target: ['node18'],
    sourcemap: false,
    legalComments: 'none',
    external: DSH_EXTERNAL,
    logLevel: 'warning',
  })
  // 手写 .d.ts：声明 default 导出是控制器类，Loader 靠这个类型挂载
  await writeFile(
    path.join(outdir, 'api.d.ts'),
    `import type { DeskRemote } from '../src/api'\nexport { DeskRemote }\nexport default DeskRemote\n`,
    'utf8',
  )
  console.log(`[bundle] lib/api.js     ${await sizeOf(path.join(outdir, 'api.js'))}`)

  // ---------- 3) Client half ----------
  await build({
    entryPoints: [path.join(root, 'src/client/index.ts')],
    outfile: path.join(outdir, 'client.js'),
    bundle: true,
    format: 'cjs',
    platform: 'browser',
    target: ['es2020'],
    jsx: 'automatic',
    sourcemap: false,
    legalComments: 'none',
    external: REACT_EXTERNAL,
    define: { 'process.env.NODE_ENV': '"production"' },
    // treeShaking 保持开启。实测 esbuild 会把 inject 收进
    // `__export(index_exports, { apply, inject })` 并写进 module.exports，
    // 导出链完整（用 ModuleLoader 的 `factory(require) → exports` 契约验证过）。
    // 曾误判它被摇掉，那是 grep 模式没匹配上，实际没摇。
    banner: { js: MODULE_LOADER_HEAD },
    footer: { js: MODULE_LOADER_TAIL },
    logLevel: 'warning',
  })
  console.log(`[bundle] lib/client.js  ${await sizeOf(path.join(outdir, 'client.js'))}`)

  console.log(`[bundle] done · plugin=${PLUGIN_NAME}`)
}

main().catch((err) => {
  console.error('[bundle] FAILED')
  console.error(err)
  process.exit(1)
})
