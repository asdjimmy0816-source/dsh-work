/**
 * designer-desk · client 工具箱
 *
 * 只放三样东西：① 与 Node half 通信的 api；② 内联主题 token；③ 通用 UI 原语与 hook。
 * 这里不放任何业务逻辑 —— 业务在 App / 各视图里。
 *
 * 注意：工作台渲染在 DSH Web 内部，宿主 CSS 可能覆盖 class，
 * 因此所有关键样式一律用内联 style，不依赖外部样式表。
 */
import { useEffect, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'

/* ------------------------------------------------------------------ *
 * 与 Node half 通信
 * ------------------------------------------------------------------ */

let ctxRef: any = null

export function bindCtx(ctx: any) {
  ctxRef = ctx
}

function safeService(name: string) {
  try {
    return ctxRef?.[name]
  } catch {
    return undefined
  }
}

const BASE = '/designer-desk'

export interface ApiInit {
  method?: 'GET' | 'POST'
  body?: unknown
}

/**
 * 请求 Node half。
 * 优先走宿主提供的请求通道；不可用时回落到同源 fetch（两种都指向同一个 webServer）。
 */
export async function api<T = any>(path: string, init?: ApiInit): Promise<T> {
  const url = path.startsWith('http')
    ? path
    : `${BASE}${path.startsWith('/') ? path : `/${path}`}`
  const method = (init?.method ?? 'GET').toUpperCase()
  const payload = init?.body === undefined ? undefined : JSON.stringify(init.body)
  const headers = payload ? { 'content-type': 'application/json' } : undefined

  const ui = safeService('ui')
  if (ui && typeof ui.request === 'function') {
    try {
      const res = await ui.request(url, { method, body: payload, headers })
      if (res?.json) return (await res.json()) as T
      if (res && typeof res === 'object') {
        if ('ok' in res) return res as T
        if (typeof res.text === 'function') return JSON.parse(await res.text()) as T
      }
    } catch {
      /* 落到 fetch 兜底 */
    }
  }

  const res = await fetch(url, { method, body: payload, headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as T
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
