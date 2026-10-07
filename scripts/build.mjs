#!/usr/bin/env node
/**
 * designer-desk 构建脚本
 *
 * 产出两个 half：
 *   1. lib/index.js  —— Node half，ESM，供 Cordis 插件树加载
 *   2. lib/client.js —— 浏览器 client half，CJS，外层包一层 window.__ModuleLoader__
 *
 * 铁律：
 *   - React 相关四个包必须 external（否则第二份 React 进包 → hooks 崩溃）
 *   - client 的 ModuleLoader id 必须等于包名
 */
import { build } from 'esbuild'
import { mkdir, rm, stat } from 'node:fs/promises'
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

  // ---------- 2) Client half ----------
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
