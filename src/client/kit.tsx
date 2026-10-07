/**
 * designer-desk · client 工具箱
 *
 * 只放三样东西：① 与 Node half 的 Remote 通信；② 内联主题 token；③ 通用 UI 原语与 hook。
 * 这里不放任何业务逻辑 —— 业务在 App / 各视图里。
 *
 * 注意：工作台渲染在 DSH Web 内部，宿主 CSS 可能覆盖 class，
 * 因此所有关键样式一律用内联 style，不依赖外部样式表。
 */
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/* ------------------------------------------------------------------ *
 * 与 Node half 通信（Typert Remote）
 * ------------------------------------------------------------------ */

/**
 * DSH rc.3 的通信层是 Typert Remote + WebSocket RPC，**没有「HTTP 路由」**。
 *
 * 流程（参照官方 multi-agent 插件）：
 *   1. `ctx.remote.$mount(ns)` 请求挂载命名空间，resolve 出dispose
 *   2. `ctx.inject(['remote.<ns>'], cb)` 拿到真正的命名空间对象
 *   3. 之后直接 `ns.method(args)`，返回 Promise
 *
 * ⚠️ 命名空间必须在**根层**注册（独立 Loader entry），否则 `$mount` 永远
 * 停在 waiting：界面加载了但没数据，也不报错。
 */

let ctxRef: any = null

export function bindCtx(ctx: any) {
  ctxRef = ctx
  installRemoteBridge(ctx)
}

export const REMOTE_NAMESPACE = 'designerDesk'

/** 挂载状态：waiting / ready / failed / unsupported */
type MountState = 'waiting' | 'ready' | 'failed' | 'unsupported'

/**
 * Remote contribution —— `$mount()` 的参数。
 *
 * ⚠️⚠️ 这是 rc.3 最隐蔽的一个坑：`remote.$mount()` **不接受字符串**。
 * 它要的是 `{ package, descriptors: [...] }`，descriptors 是**每个 RPC 方法一条**
 * 的调用契约清单（id / service / namespace / method / parameters / result）。
 * 传字符串会让 `validateContribution` 直接抛错，命名空间永远装不上，
 * 表现是「界面渲染正常、数据永远是 0」。
 *
 * 官方写法见 `@dsh-multi-agent/plugin` 的 `TYPERT_REMOTE` 常量。
 * 这里从 ENDPOINTS 表自动生成，避免两处漂移。
 */
function buildContribution(): { package: string; descriptors: any[] } {
  const methods = Object.values(ENDPOINTS)
  return {
    package: PLUGIN_NAME,
    descriptors: methods.map((method) => ({
      id: `${PLUGIN_NAME}#${REMOTE_NAMESPACE}/${method}`,
      // service 是**控制器注册的 cordis 服务键**，不是命名空间
      service: CONTROLLER_SERVICE_KEY,
      namespace: REMOTE_NAMESPACE,
      method,
      invocation: { kind: 'direct' },
      // 无参数端点（GET）给空 parameters，有参数端点（POST）给一个 json 参数
      parameters: NO_ARG_METHODS.has(method)
        ? []
        : [{ name: 'payload', wire: 'payload', source: 'json' }],
      result: { mode: 'strict' },
    })),
  }
}

let remoteNs: any = null
let mountState: MountState = 'waiting'
let mountError = ''
const mountWaiters: Array<() => void> = []

function notifyWaiters() {
  while (mountWaiters.length) {
    const fn = mountWaiters.pop()
    try {
      fn?.()
    } catch {
      /* 忽略单个等待者的异常 */
    }
  }
}

/**
 * 挂载 Remote 命名空间。幂等 —— 多次调用只挂一次。
 * 返回一个 Promise，在命名空间可用时 resolve。
 */
function ensureRemoteMounted(): Promise<void> {
  if (mountState === 'ready') return Promise.resolve()
  if (mountState === 'failed' || mountState === 'unsupported') {
    return Promise.reject(new Error(mountError || 'Remote 命名空间不可用'))
  }
  return new Promise<void>((resolve, reject) => {
    mountWaiters.push(() => {
      if (mountState === 'ready') resolve()
      else reject(new Error(mountError || 'Remote 命名空间不可用'))
    })
    void doMount()
  })
}

let mounting = false

async function doMount(): Promise<void> {
  if (mounting) return
  mounting = true
  try {
    const remote = ctxRef?.remote
    if (!remote || typeof remote.$mount !== 'function') {
      mountState = 'unsupported'
      mountError = '宿主未提供 remote 服务（api-gateway 客户端插件缺失）'
      notifyWaiters()
      return
    }
    await remote.$mount(buildContribution())
    // 命名空间由 ctx.inject 回调交付 —— 那边才是它真正出现的时刻
  } catch (err: any) {
    mountState = 'failed'
    mountError = String(err?.message ?? err)
    notifyWaiters()
  } finally {
    mounting = false
  }
}

function installRemoteBridge(ctx: any) {
  if (!ctx || typeof ctx.inject !== 'function') return
  try {
    ctx.inject([`remote.${REMOTE_NAMESPACE}`], (nsCtx: any) => {
      const ns = nsCtx?.remote?.[REMOTE_NAMESPACE]
      if (ns === undefined || ns === null) return
      remoteNs = ns
      mountState = 'ready'
      mountError = ''
      notifyWaiters()
    })
  } catch {
    /* inject 不可用时保持 waiting，调用方会拿到明确错误而不是静默空白 */
  }
}

/** 挂载是否已完成 —— 供 UI 显示「正在连接 / 数据通道不可用」 */
export function remoteStatus(): { state: MountState; error: string } {
  return { state: mountState, error: mountError }
}

/** 供测试用：重置挂载状态 */
export function __resetRemoteBridge() {
  remoteNs = null
  mountState = 'waiting'
  mountError = ''
  mountWaiters.length = 0
  mounting = false
}

/** 直接注入命名空间 —— 仅测试用 */
export function __setRemoteForTest(ns: any) {
  remoteNs = ns
  mountState = 'ready'
  notifyWaiters()
}

/* ------------------------------------------------------------------ *
 * 端点映射：客户端的路径名 → Remote 方法名
 * ------------------------------------------------------------------ */

/**
 * 视图层沿用路径风格的调用习惯（api('/state')），
 * 这里映射到 Remote 的方法名。想新增端点先加进这张表。
 *
 * ⚠️ 同一路径可能对应两个方法（GET / POST 不同语义），用 `'path:verb'` 覆盖。
 * 例如 `/config` 读用 getConfig、写用 setConfig —— 不写第二条的话，
 * POST /config 会打到 getConfig 上，静默读到旧配置。
 */
const ENDPOINTS: Record<string, string> = {
  health: 'health',
  state: 'state',
  stages: 'stages',
  config: 'getConfig',
  'config:POST': 'setConfig',
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

/** 包名 —— contribution 的 package 字段，也是 cordis entry 的 id */
const PLUGIN_NAME = 'designer-desk'

/**
 * 控制器注册的 cordis 服务键 —— descriptor 的 `service` 字段。
 *
 * 必须与 src/api.ts 里 `super(ctx, CONTROLLER_KEY, ...)` 的第一个参数一致，
 * 且**不等于命名空间**（否则控制器会覆盖业务插件的同名服务）。
 */
const CONTROLLER_SERVICE_KEY = 'designerDeskController'

/**
 * 无参数端点 —— descriptor 的 `parameters` 给空数组。
 * 其余端点走 POST，带一个 json payload。
 * 与 ENDPOINTS 表的 GET 端点保持一致。
 */
const NO_ARG_METHODS = new Set(['health', 'state', 'stages', 'today', 'tasks', 'export', 'comfy/status', 'render-dir'])

export interface ApiInit {
  method?: 'GET' | 'POST'
  body?: unknown
}

/**
 * 调用 Node half 的 Remote 方法。
 *
 * 语义与原来的 HTTP 版一致：返回 `{ ok, ... }`，不抛异常（除挂载失败）。
 */
export async function api<T = any>(path: string, init?: ApiInit): Promise<T> {
  const key = String(path).replace(/^\//, '')
  const isPost = (init?.method ?? 'GET').toUpperCase() === 'POST'
  // 先找verb 专属映射，再退回通用映射
  const method = (isPost ? ENDPOINTS[`${key}:POST`] : undefined) ?? ENDPOINTS[key]
  if (!method) throw new Error(`未注册的端点：${path}${isPost ? '（POST）' : ''}`)

  await ensureRemoteMounted()
  if (!remoteNs) throw new Error(mountError || 'Remote 命名空间未就绪')

  const fn = remoteNs[method]
  if (typeof fn !== 'function') throw new Error(`Remote 方法不存在：${method}`)

  // GET 端点无参数；POST 端点把body 当唯一参数传入
  const args = isPost ? [init?.body ?? {}] : []
  return (await fn.apply(remoteNs, args)) as T
}

/** 导出端点名清单给 gates 校验，避免表与控制器漂移 */
export function endpointNames(): string[] {
  return Object.keys(ENDPOINTS).sort()
}

/* ------------------------------------------------------------------ *
 * 主题 token —— 米白底 + 墨黑字 + 赭橙点睛，克制有质感
 * ------------------------------------------------------------------ */

export const C = {
  bg: '#FAF8F5',
  card: '#FFFFFF',
  line: '#E8E3DC',
  lineSoft: '#F1EDE7',
  ink: '#1F1D1A',
  ink2: '#8A837A',
  ink3: '#B5AEA4',
  brand: '#B85C38',
  brandSoft: '#F5EAE4',
  danger: '#C0392B',
  dangerSoft: '#FBF0EE',
  warn: '#C0872B',
  warnSoft: '#FDF6E8',
  ok: '#4A6B57',
  okSoft: '#EFF5F1',
} as const

export const FONT =
  '-apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Roboto, "Helvetica Neue", sans-serif'
export const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

export const R = { sm: 8, md: 10, lg: 12, pill: 999 } as const

export const cardStyle: CSSProperties = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: R.lg,
  padding: '16px 18px',
}

export const inputStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '9px 11px',
  border: `1px solid ${C.line}`,
  borderRadius: R.sm,
  fontSize: 16, // ≥16px，避免 iOS 自动放大页面
  background: '#fff',
  color: C.ink,
  fontFamily: FONT,
  outline: 'none',
}

export const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: 12,
  color: C.ink2,
  marginBottom: 5,
  fontWeight: 600,
  letterSpacing: '.02em',
}

export const sectionTitle: CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: C.ink,
  margin: '0 0 10px',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
}

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */

/** 窄屏判定（移动端单列堆叠） */
export function useIsNarrow(breakpoint = 768): boolean {
  const [narrow, setNarrow] = useState<boolean>(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint,
  )
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < breakpoint)
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [breakpoint])
  return narrow
}

/* ------------------------------------------------------------------ *
 * UI 原语
 * ------------------------------------------------------------------ */

type BtnKind = 'primary' | 'ghost' | 'quiet' | 'danger'

export function Btn({
  children,
  onClick,
  kind = 'ghost',
  disabled,
  title,
  narrowMin,
  style,
}: {
  children: ReactNode
  onClick?: () => void
  kind?: BtnKind
  disabled?: boolean
  title?: string
  /** 触屏最小点击区，默认 44px */
  narrowMin?: boolean
  style?: CSSProperties
}) {
  const palette: Record<BtnKind, CSSProperties> = {
    primary: { background: C.brand, color: '#fff', border: `1px solid ${C.brand}` },
    ghost: { background: '#fff', color: C.ink, border: `1px solid ${C.line}` },
    quiet: { background: 'transparent', color: C.ink2, border: '1px solid transparent' },
    danger: { background: '#fff', color: C.danger, border: `1px solid ${C.line}` },
  }
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={disabled ? undefined : onClick}
      style={{
        ...palette[kind],
        minHeight: narrowMin === false ? undefined : 34,
        minWidth: 44,
        padding: '6px 13px',
        borderRadius: R.sm,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: FONT,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.45 : 1,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        lineHeight: 1.2,
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Pill({
  children,
  tone = 'neutral',
  style,
}: {
  children: ReactNode
  tone?: 'neutral' | 'brand' | 'ok' | 'warn' | 'danger'
  style?: CSSProperties
}) {
  const tones: Record<string, CSSProperties> = {
    neutral: { background: '#F4F0EA', color: C.ink2 },
    brand: { background: C.brandSoft, color: C.brand },
    ok: { background: C.okSoft, color: C.ok },
    warn: { background: C.warnSoft, color: C.warn },
    danger: { background: C.dangerSoft, color: C.danger },
  }
  return (
    <span
      style={{
        ...tones[tone],
        fontSize: 11.5,
        fontWeight: 700,
        padding: '2px 8px',
        borderRadius: R.pill,
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  )
}

export function Field({
  label,
  children,
  hint,
  style,
}: {
  label: string
  children: ReactNode
  hint?: string
  style?: CSSProperties
}) {
  return (
    <div style={{ marginBottom: 12, ...style }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint ? <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 4, lineHeight: 1.6 }}>{hint}</div> : null}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '18px 14px',
        textAlign: 'center',
        fontSize: 13,
        color: C.ink3,
        border: `1px dashed ${C.line}`,
        borderRadius: R.md,
        background: '#FCFBF9',
      }}
    >
      {text}
    </div>
  )
}

export function Bar({ value, tone = C.brand }: { value: number; tone?: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div style={{ height: 5, background: C.lineSoft, borderRadius: R.pill, overflow: 'hidden' }}>
      <div
        style={{
          width: `${pct}%`,
          height: '100%',
          background: tone,
          borderRadius: R.pill,
          transition: 'width .25s ease',
        }}
      />
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * 图标（内联 SVG，绝不用 emoji）
 * ------------------------------------------------------------------ */

type IconName =
  | 'today' | 'board' | 'image' | 'settings' | 'plus' | 'check' | 'clock'
  | 'warn' | 'close' | 'arrow' | 'download' | 'upload' | 'refresh' | 'trash'
  | 'wake' | 'sync' | 'offline' | 'online' | 'sparkle'
  | 'build' | 'box' | 'gallery'

const PATHS: Record<IconName, ReactNode> = {
  today: (
    <>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.4V8l2.6 1.6" />
    </>
  ),
  board: (
    <>
      <rect x="1.8" y="2.6" width="4" height="10.8" rx="1" />
      <rect x="6" y="2.6" width="4" height="7" rx="1" />
      <rect x="10.2" y="2.6" width="4" height="9" rx="1" />
    </>
  ),
  image: (
    <>
      <rect x="1.8" y="3" width="12.4" height="10" rx="1.6" />
      <circle cx="5.8" cy="6.6" r="1.2" />
      <path d="M2.4 11.6l3.4-2.9 2.8 2.3 2.4-1.9 2.8 2.5" />
    </>
  ),
  settings: (
    <>
      <circle cx="8" cy="8" r="2.4" />
      <path d="M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3" />
    </>
  ),
  plus: <path d="M8 3.4v9.2M3.4 8h9.2" />,
  check: <path d="M3 8.4l3.2 3.2L13 5.2" />,
  clock: (
    <>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.6V8l2.4 1.5" />
    </>
  ),
  warn: (
    <>
      <path d="M8 1.8L15 14H1z" />
      <path d="M8 6v3.4M8 11.4v.6" />
    </>
  ),
  close: <path d="M4 4l8 8M12 4l-8 8" />,
  arrow: <path d="M3.5 8h8.6M8.6 4.4L12.2 8l-3.6 3.6" />,
  download: <path d="M8 2.6v7.6M4.6 7.2L8 10.6l3.4-3.4M2.8 13.4h10.4" />,
  upload: <path d="M8 10.6V3M4.6 6.4L8 3l3.4 3.4M2.8 13.4h10.4" />,
  refresh: <path d="M13 8a5 5 0 11-1.6-3.7M13 2.6V5.4h-2.8" />,
  trash: <path d="M3 4.4h10M6.4 4.4V3.2h3.2v1.2M4.4 4.4l.7 8.4h5.8l.7-8.4" />,
  wake: (
    <>
      <path d="M2.4 12.6h11.2" />
      <path d="M8 2.4v6.4M5.4 6.2L8 8.8l2.6-2.6" />
    </>
  ),
  sync: <path d="M2.8 8a5.2 5.2 0 018.9-3.7M13.2 8a5.2 5.2 0 01-8.9 3.7M11.9 1.9v2.6h-2.6M4.1 14.1v-2.6h2.6" />,
  offline: (
    <>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M3.8 3.8l8.4 8.4" />
    </>
  ),
  online: (
    <>
      <circle cx="8" cy="8" r="6.2" />
      <path d="M5 8.3l2.1 2.1L11.2 6.3" />
    </>
  ),
  sparkle: <path d="M8 2.2l1.5 4.1 4.1 1.5-4.1 1.5L8 13.4l-1.5-4.1L2.4 7.8l4.1-1.5z" />,
  build: (
    <>
      <path d="M2.4 13.6V6.2l4-2.6 4 2.6v7.4" />
      <path d="M10.4 9.4l3.2-2v6.2H6.4" />
      <path d="M5 13.6v-3.4h2.8v3.4M5 7.6h2.8" />
    </>
  ),
  box: (
    <>
      <path d="M8 1.9l5.4 2.6v7L8 14.1l-5.4-2.6v-7z" />
      <path d="M2.6 4.5L8 7.1l5.4-2.6M8 7.1v7" />
    </>
  ),
  gallery: (
    <>
      <rect x="1.8" y="3" width="12.4" height="10" rx="1.6" />
      <circle cx="5.6" cy="6.5" r="1.1" />
      <path d="M2.4 11.4l3.3-2.7 2.6 2.1 2.2-1.7 3.1 2.6" />
      <path d="M9.6 3.2l4.4 5.6" />
    </>
  ),
}

export function Icon({
  name,
  size = 15,
  color = C.ink2,
  strokeWidth = 1.5,
  style,
}: {
  name: IconName
  size?: number
  color?: string
  strokeWidth?: number
  style?: CSSProperties
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      style={{ flex: 'none', display: 'block', ...style }}
      aria-hidden="true"
    >
      <g stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
        {PATHS[name]}
      </g>
    </svg>
  )
}

/* ------------------------------------------------------------------ *
 * 展示辅助
 * ------------------------------------------------------------------ */

export function money(n?: number): string {
  if (n === undefined || n === null || Number.isNaN(n) || !n) return '—'
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)} 万`
  return `¥${Math.round(n).toLocaleString('zh-CN')}`
}

export function bytesText(n: number): string {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1024 / 1024).toFixed(2)} MB`
}

/** 倒计时文案：负数=逾期 */
export function dueText(days: number | null): { text: string; tone: 'danger' | 'warn' | 'ok' | 'neutral' } {
  if (days === null) return { text: '未排期', tone: 'neutral' }
  if (days < 0) return { text: `逾期 ${Math.abs(days)} 天`, tone: 'danger' }
  if (days === 0) return { text: '今天到期', tone: 'warn' }
  if (days === 1) return { text: '明天', tone: 'warn' }
  if (days <= 3) return { text: `${days} 天后`, tone: 'warn' }
  return { text: `${days} 天后`, tone: 'ok' }
}
