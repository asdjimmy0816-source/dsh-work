/**
 * designer-desk · 状态栏徽标（注册到 status 插槽）
 *
 * 铁律 5 的轻量版：不做浏览器通知 / 系统推送，靠「抬眼就看见」等价于提醒。
 * 只读轻接口 /today，不触发 ComfyUI 探活，保持零负担。
 */
import { useEffect, useRef, useState } from 'react'
import { C, Icon, api } from './kit'

interface TodayLite {
  ok: boolean
  date?: string
  overdue?: any[]
  today?: any[]
}

export function Badge() {
  const [data, setData] = useState<TodayLite | null>(null)
  const [failed, setFailed] = useState(false)
  const timerRef = useRef<any>(null)

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      try {
        const res = await api<TodayLite>('/today')
        if (!cancelled) {
          setData(res)
          setFailed(false)
        }
      } catch {
        if (!cancelled) setFailed(true)
      }
    }

    void tick()
    timerRef.current = window.setInterval(tick, 60_000)

    return () => {
      cancelled = true
      if (timerRef.current) window.clearInterval(timerRef.current)
    }
  }, [])

  if (failed) {
    return (
      <span
        title="设计台：Node half 未响应"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 5,
          padding: '2px 9px',
          borderRadius: 999,
          fontSize: 11.5,
          fontWeight: 600,
          color: C.ink3,
          border: `1px solid ${C.line}`,
          whiteSpace: 'nowrap',
        }}
      >
        <Icon name="offline" size={11} color={C.ink3} />
        设计台 离线
      </span>
    )
  }

  const overdue = data?.overdue?.length ?? 0
  const today = data?.today?.length ?? 0
  const total = overdue + today
  const tone = overdue ? C.danger : total ? C.warn : C.ok
  const label = overdue ? `设计台 逾期 ${overdue}` : total ? `设计台 今日 ${total}` : '设计台 已清空'

  return (
    <span
      title={`逾期 ${overdue} 项 · 今天 ${today} 项${data?.date ? `（${data.date}）` : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '2px 9px',
        borderRadius: 999,
        fontSize: 11.5,
        fontWeight: 600,
        color: tone,
        border: `1px solid ${tone}`,
        whiteSpace: 'nowrap',
        cursor: 'default',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: 999, background: tone, flex: 'none' }} />
      {label}
    </span>
  )
}
