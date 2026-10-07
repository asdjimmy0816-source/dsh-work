/**
 * designer-desk · 工作区主组件（bundle-client，注册到 workspace 插槽）
 *
 * 铁律 9：所有数据变更都走「改数据 → refreshAll()」这一条路。
 * 各视图之间绝不互相调用渲染函数，一律由本组件按固定顺序分发 props。
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Btn, C, FONT, Icon, Pill, R, api, bytesText, cardStyle, inputStyle, useIsNarrow } from './kit'
import { Today } from './Today'
import { Projects } from './Projects'
import { Renders } from './Renders'
import { Sites } from './Sites'
import { Materials } from './Materials'
import { RefImages } from './RefImages'
import type { StatePayload } from '../types'

type Tab = 'today' | 'projects' | 'renders' | 'sites' | 'materials' | 'refimages'

interface StateWithJobs extends StatePayload {
  jobs?: any[]
}

interface TabDef {
  key: Tab
  label: string
  icon: 'today' | 'board' | 'image' | 'build' | 'box' | 'gallery'
  /** 窄屏底部条只放得下 4 个，第 5、6 个进「更多」 */
  narrowSlot: boolean
}

const TABS: TabDef[] = [
  { key: 'today', label: '今日', icon: 'today', narrowSlot: true },
  { key: 'projects', label: '项目', icon: 'board', narrowSlot: true },
  { key: 'renders', label: '效果图', icon: 'image', narrowSlot: true },
  { key: 'sites', label: '巡检', icon: 'build', narrowSlot: false },
  { key: 'materials', label: '材料', icon: 'box', narrowSlot: false },
  { key: 'refimages', label: '灵感', icon: 'gallery', narrowSlot: false },
]

const MORE_TABS = TABS.filter((t) => !t.narrowSlot)

export function App() {
  const narrow = useIsNarrow()
  const [state, setState] = useState<StateWithJobs | null>(null)
  const [tab, setTab] = useState<Tab>('today')
  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [focusProjectId, setFocusProjectId] = useState<string | null>(null)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [showMore, setShowMore] = useState(false)

  const jobsRef = useRef<any[]>([])
  const lastPollRef = useRef<number>(Date.now())
  const toastTimer = useRef<any>(null)

  const flash = useCallback((kind: 'ok' | 'err', text: string) => {
    setToast({ kind, text })
    if (toastTimer.current) window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 3800)
  }, [])

  /* ------------------------------------------------------------------ *
   * 统一刷新入口 —— 全工作台唯一的读数据通道
   * ------------------------------------------------------------------ */
  const refreshAll = useCallback(
    async (silent = false) => {
      if (!silent) setBusy((b) => b || 'refresh')
      try {
        const res = await api<StateWithJobs>('/state')
        if ((res as any).ok === false) {
          flash('err', (res as any).error ?? '读取失败')
        } else {
          setState(res)
          jobsRef.current = res.jobs ?? []
        }
      } catch (e: any) {
        if (!silent) flash('err', `读取失败：${e?.message ?? e}`)
      } finally {
        if (!silent) setBusy((b) => (b === 'refresh' ? '' : b))
      }
    },
    [flash],
  )

  useEffect(() => {
    void refreshAll()
  }, [refreshAll])

  /** 出图中自动轮询更快，平时 60 秒一次 */
  useEffect(() => {
    const timer = window.setInterval(() => {
      const running = jobsRef.current.some((j) => j.status === 'queued' || j.status === 'running')
      const interval = running ? 3000 : 60000
      if (Date.now() - lastPollRef.current >= interval) {
        lastPollRef.current = Date.now()
        void refreshAll(true)
      }
    }, 1000)
    return () => window.clearInterval(timer)
  }, [refreshAll])

  /* ------------------------------------------------------------------ *
   * 动作：一律「请求 → refreshAll」
   * ------------------------------------------------------------------ */

  const post = useCallback(
    async (path: string, body: any, okText: string) => {
      try {
        const res = await api<{ ok: boolean; error?: string }>(path, { method: 'POST', body })
        if (!res?.ok) flash('err', res?.error ?? '操作失败')
        else if (okText) flash('ok', okText)
        await refreshAll(true)
        return res
      } catch (e: any) {
        flash('err', `操作失败：${e?.message ?? e}`)
        return { ok: false, error: String(e?.message ?? e) }
      }
    },
    [flash, refreshAll],
  )

  const onToggleTask = (id: string, done: boolean) => void post('/task/toggle', { id, done }, done ? '已完成' : '')
  const onPostpone = (id: string, days: number) => void post('/task/postpone', { id, days }, `已顺延 ${days} 天`)
  const onDeleteTask = (id: string) => {
    if (!window.confirm('删除这条待办？')) return
    void post('/task/delete', { id }, '已删除')
  }
  const onAdvance = (id: string, note?: string) => void post('/project/advance', { id, note }, '已推进到下一阶段，并自动排出下一步')
  const onWake = (id: string) => void post('/project/wake', { id }, '已生成跟进待办')
  const onDeleteProject = (id: string) => {
    if (!window.confirm('删除项目会同时删掉它的待办，确定？')) return
    void post('/project/delete', { id }, '已删除')
  }

  const onSaveProject = async (payload: { project: any; customer?: any; silent?: boolean }) => {
    try {
      const res = await api<{ ok: boolean; error?: string; project?: any; createdTask?: any }>('/project/save', {
        method: 'POST',
        body: payload,
      })
      if (!res?.ok) flash('err', res?.error ?? '保存失败')
      else if (!payload.silent) {
        flash('ok', res.createdTask ? `已建档，并生成待办「${res.createdTask.title}」` : '已保存')
      }
      await refreshAll(true)
    } catch (e: any) {
      flash('err', `保存失败：${e?.message ?? e}`)
    }
  }

  const onRender = async (params: any) => {
    setBusy('render')
    try {
      const res = await api<any>('/comfy/render', { method: 'POST', body: params })
      if (res?.ok) {
        flash('ok', `已提交出图 · ${res.width}×${res.height} · seed ${res.seed}`)
        lastPollRef.current = 0
      } else {
        flash('err', res?.error ?? '提交失败')
      }
      await refreshAll(true)
    } catch (e: any) {
      flash('err', `提交失败：${e?.message ?? e}`)
    } finally {
      setBusy('')
    }
  }

  const onDeleteRender = (renderId: string) => {
    if (!window.confirm('删除这条出图记录？（归档图片文件不会被删）')) return
    void post('/render/delete', { id: renderId }, '已删除记录')
  }

  /* ---------------- 第 2 期：工地巡检 / 材料进场 / 灵感素材库 ---------------- */

  const onSaveSite = (site: any) =>
    void post('/site/save', { site }, site?.id ? '已保存巡检记录' : '已登记巡检')

  const onDeleteSite = (id: string) => {
    if (!window.confirm('删除这条巡检记录？')) return
    void post('/site/delete', { id }, '已删除巡检记录')
  }

  const onSaveMaterial = (material: any) =>
    void post('/material/save', { material }, material?.id ? '已保存材料' : '已登记材料')

  const onDeleteMaterial = (id: string) => {
    if (!window.confirm('删除这条材料记录？')) return
    void post('/material/delete', { id }, '已删除材料')
  }

  const onSaveRefImage = (refimage: any) =>
    void post('/refimage/save', { refimage }, refimage?.id ? '已保存参考图' : '已收藏')

  const onDeleteRefImage = (id: string) => {
    if (!window.confirm('删除这张参考图？')) return
    void post('/refimage/delete', { id }, '已删除参考图')
  }

  const onExport = async () => {
    setBusy('export')
    try {
      const res = await api<{ ok: boolean; file?: string; payload?: any; error?: string }>('/export')
      if (!res.ok) return flash('err', res.error ?? '导出失败')
      try {
        const blob = new Blob([JSON.stringify(res.payload)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `designer-desk-${res.payload?.exportedAt?.slice(0, 10) ?? 'backup'}.json`
        a.click()
        URL.revokeObjectURL(a.href)
      } catch {
        /* 忽略浏览器下载异常 */
      }
      flash('ok', `已导出备份：${res.file}`)
    } catch (e: any) {
      flash('err', `导出失败：${e?.message ?? e}`)
    } finally {
      setBusy('')
    }
  }

  const onImport = async () => {
    if (!importText.trim()) return flash('err', '请先粘贴备份 JSON')
    if (!window.confirm('导入会覆盖当前全部数据，确定继续？')) return
    setBusy('import')
    try {
      const res = await api<{ ok: boolean; error?: string }>('/import', { method: 'POST', body: { text: importText } })
      if (res.ok) {
        setImportText('')
        setShowImport(false)
        flash('ok', '导入完成')
        await refreshAll(true)
      } else flash('err', res.error ?? '导入失败')
    } catch (e: any) {
      flash('err', `导入失败：${e?.message ?? e}`)
    } finally {
      setBusy('')
    }
  }

  /* ------------------------------------------------------------------ *
   * 跨 Tab 跳转（由 App 统一调度，视图之间不互相调用）
   * ------------------------------------------------------------------ */

  const openProject = (id: string) => {
    setFocusProjectId(id)
    setTab('projects')
  }
  const gotoRender = (projectId: string) => {
    setFocusProjectId(projectId)
    setTab('renders')
  }
  const gotoRenderNew = () => {
    setFocusProjectId(null)
    setTab('renders')
  }

  /** 窄屏「更多」弹层里切Tab */
  const pickMore = (key: Tab) => {
    setTab(key)
    setShowMore(false)
  }

  /* ------------------------------------------------------------------ *
   * 渲染
   * ------------------------------------------------------------------ */

  const stor = state?.storage
  const running = (state?.jobs ?? []).filter((j) => j.status === 'queued' || j.status === 'running').length
  const conn = state?.comfy

  return (
    <div
      style={{
        fontFamily: FONT,
        background: C.bg,
        color: C.ink,
        minHeight: '100%',
        paddingBottom: narrow ? 'calc(66px + env(safe-area-inset-bottom))' : 24,
        boxSizing: 'border-box',
      }}
    >
      {/* ---------------- 顶部 ---------------- */}
      <div
        style={{
          padding: narrow ? '14px 14px 10px' : '20px 24px 12px',
          borderBottom: `1px solid ${C.line}`,
          background: C.bg,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: narrow ? 17 : 19, fontWeight: 700, letterSpacing: '-.2px' }}>设计台</span>
          <span style={{ fontSize: 12, color: C.ink3 }}>
            {state?.now ?? ''} · 客户 {state?.stats?.projectCount ?? 0} 个项目
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginLeft: 'auto', flexWrap: 'wrap' }}>
            {/* 同步状态指示器（本地方案：本地存储 + 滚动备份） */}
            <span
              title={`数据目录 ${stor?.home ?? ''}${stor?.lastBackup ? ` · 上次备份 ${stor.lastBackup.slice(0, 19).replace('T', ' ')}` : ''}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11.5,
                fontWeight: 600,
                padding: '3px 9px',
                borderRadius: R.pill,
                background: C.okSoft,
                color: C.ok,
              }}
            >
              <Icon name="sync" size={11} color={C.ok} />
              本地存储 {stor ? bytesText(stor.bytes) : ''}
            </span>

            <Btn onClick={onExport} disabled={busy === 'export'} title="导出 JSON 备份">
              <Icon name="download" size={12.5} color={C.ink2} />
              导出
            </Btn>
            <Btn onClick={() => setShowImport(true)} title="导入恢复">
              <Icon name="upload" size={12.5} color={C.ink2} />
              导入
            </Btn>
            <Btn onClick={() => void refreshAll()} title="刷新">
              <Icon name="refresh" size={12.5} color={C.ink2} />
            </Btn>
          </div>
        </div>

        {/* PC 端：横向 Tab */}
        {!narrow ? (
          <div style={{ display: 'flex', gap: 6, marginTop: 14, alignItems: 'center' }}>
            {TABS.map((t) => {
              const activeTab = tab === t.key
              const badgeCount =
                t.key === 'today'
                  ? (state?.buckets?.overdue?.length ?? 0) + (state?.buckets?.today?.length ?? 0)
                  : t.key === 'sites'
                    ? (state?.sites ?? []).filter((s: any) => s.status === '需整改').length
                    : 0
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '7px 15px',
                    borderRadius: R.sm,
                    border: `1px solid ${activeTab ? C.brand : C.line}`,
                    background: activeTab ? C.brand : '#fff',
                    color: activeTab ? '#fff' : C.ink,
                    fontSize: 13.5,
                    fontWeight: 600,
                    fontFamily: FONT,
                    cursor: 'pointer',
                  }}
                >
                  <Icon name={t.icon} size={14} color={activeTab ? '#fff' : C.ink2} />
                  {t.label}
                  {badgeCount ? <Pill tone={activeTab ? 'neutral' : 'danger'}>{badgeCount}</Pill> : null}
                  {t.key === 'renders' && running ? <Pill tone={activeTab ? 'neutral' : 'warn'}>{running}</Pill> : null}
                </button>
              )
            })}

            <span style={{ marginLeft: 'auto', fontSize: 11.5, color: C.ink3, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span>
                逾期 <b style={{ color: state?.buckets?.overdue?.length ? C.danger : C.ink2 }}>{state?.buckets?.overdue?.length ?? 0}</b>
                {' · '}今天 <b style={{ color: C.ink }}>{state?.buckets?.today?.length ?? 0}</b>
                {' · '}三天内 <b style={{ color: C.ink2 }}>{state?.buckets?.soon?.length ?? 0}</b>
              </span>
              <span style={{ color: conn?.ok ? C.ok : C.warn }}>
                {conn?.ok ? (conn.workflowReady ? 'ComfyUI 就绪' : 'ComfyUI 已连·待配工作流') : 'ComfyUI 未连接'}
              </span>
            </span>
          </div>
        ) : null}
      </div>

      {/* ---------------- 内容 ---------------- */}
      <div style={{ padding: narrow ? '14px 14px' : '18px 24px', maxWidth: 1240, margin: '0 auto' }}>
        {!state ? (
          <div style={{ ...cardStyle, textAlign: 'center', color: C.ink2, fontSize: 13, padding: '40px 20px' }}>
            正在读取数据…
          </div>
        ) : null}

        {state && tab === 'today' ? (
          <Today
            buckets={state.buckets}
            projects={state.projects}
            today={state.now}
            onToggle={onToggleTask}
            onPostpone={onPostpone}
            onDelete={onDeleteTask}
            onWake={onWake}
            onOpenProject={openProject}
          />
        ) : null}

        {state && tab === 'projects' ? (
          <Projects
            projects={state.projects}
            customers={state.customers}
            stages={state.stages}
            focusProjectId={focusProjectId}
            onClearFocus={() => setFocusProjectId(null)}
            onSave={onSaveProject}
            onAdvance={onAdvance}
            onDelete={onDeleteProject}
            onRender={gotoRender}
          />
        ) : null}

        {state && tab === 'renders' ? (
          <Renders
            projects={state.projects}
            renders={state.renders}
            jobs={(state.jobs ?? []).filter((j: any) => j.status !== 'done')}
            comfy={state.comfy}
            ratios={(state as any).ratios ?? {
              '16:9': { width: 1344, height: 768, label: '16:9 横构图' },
              '4:3': { width: 1152, height: 896, label: '4:3 横构图' },
              '1:1': { width: 1024, height: 1024, label: '1:1 方图' },
              '9:16': { width: 768, height: 1344, label: '9:16 手机竖屏' },
            }}
            focusProjectId={focusProjectId}
            onClearFocus={() => setFocusProjectId(null)}
            onSubmit={onRender}
            onDelete={onDeleteRender}
            onGotoSettings={() => flash('ok', '设置入口在界面左下角的设置里，找到「设计台」一栏')}
          />
        ) : null}

        {state && tab === 'sites' ? (
          <Sites
            projects={state.projects}
            sites={state.sites ?? []}
            onSave={onSaveSite}
            onDelete={onDeleteSite}
          />
        ) : null}

        {state && tab === 'materials' ? (
          <Materials
            projects={state.projects}
            materials={state.materials ?? []}
            onSave={onSaveMaterial}
            onDelete={onDeleteMaterial}
          />
        ) : null}

        {state && tab === 'refimages' ? (
          <RefImages
            projects={state.projects}
            refimages={state.refimages ?? []}
            onSave={onSaveRefImage}
            onDelete={onDeleteRefImage}
          />
        ) : null}
      </div>

      {/* ---------------- 移动端底部 Tab ---------------- */}
      {narrow ? (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            background: '#fff',
            borderTop: `1px solid ${C.line}`,
            paddingBottom: 'env(safe-area-inset-bottom)',
            zIndex: 40,
          }}
        >
          {TABS.filter((t) => t.narrowSlot).map((t) => {
            const activeTab = tab === t.key
            const badgeCount =
              t.key === 'today' ? (state?.buckets?.overdue?.length ?? 0) + (state?.buckets?.today?.length ?? 0) : 0
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                style={{
                  flex: 1,
                  minHeight: 54,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  border: 'none',
                  background: 'transparent',
                  color: activeTab ? C.brand : C.ink2,
                  fontSize: 11.5,
                  fontWeight: 600,
                  fontFamily: FONT,
                  cursor: 'pointer',
                  position: 'relative',
                }}
              >
                <Icon name={t.icon} size={19} color={activeTab ? C.brand : C.ink2} />
                {t.label}
                {badgeCount ? (
                  <span
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: '50%',
                      marginRight: -26,
                      background: C.danger,
                      color: '#fff',
                      fontSize: 10,
                      fontWeight: 700,
                      borderRadius: 999,
                      padding: '1px 5px',
                      lineHeight: 1.3,
                    }}
                  >
                    {badgeCount}
                  </span>
                ) : null}
              </button>
            )
          })}

          {/* 第 2 期三个模块在窄屏收进「更多」—— 六个Tab 挤在底部条上点不准 */}
          <button
            type="button"
            onClick={() => setShowMore(true)}
            style={{
              flex: 1,
              minHeight: 54,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 3,
              border: 'none',
              background: 'transparent',
              color: MORE_TABS.some((t) => t.key === tab) ? C.brand : C.ink2,
              fontSize: 11.5,
              fontWeight: 600,
              fontFamily: FONT,
              cursor: 'pointer',
            }}
          >
            <Icon name="gallery" size={19} color={MORE_TABS.some((t) => t.key === tab) ? C.brand : C.ink2} />
            更多
          </button>
        </div>
      ) : null}

      {/* ---------------- 窄屏「更多」弹层 ---------------- */}
      {narrow && showMore ? (
        <div
          onClick={() => setShowMore(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(31,29,26,.42)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 60,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.bg,
              width: '100%',
              borderRadius: '14px 14px 0 0',
              padding: '16px 16px calc(16px + env(safe-area-inset-bottom))',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 700 }}>更多</span>
              <Btn kind="quiet" onClick={() => setShowMore(false)} style={{ marginLeft: 'auto', minWidth: 34 }}>
                <Icon name="close" size={14} color={C.ink2} />
              </Btn>
            </div>
            <div style={{ display: 'grid', gap: 8 }}>
              {MORE_TABS.map((t) => {
                const bad = t.key === 'sites' ? (state?.sites ?? []).filter((s: any) => s.status === '需整改').length : 0
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => pickMore(t.key)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '13px 14px',
                      borderRadius: R.sm,
                      border: `1px solid ${tab === t.key ? C.brand : C.line}`,
                      background: tab === t.key ? C.brandSoft : '#fff',
                      color: C.ink,
                      fontSize: 13.5,
                      fontWeight: 600,
                      fontFamily: FONT,
                      cursor: 'pointer',
                      textAlign: 'left',
                    }}
                  >
                    <Icon name={t.icon} size={16} color={tab === t.key ? C.brand : C.ink2} />
                    {t.label}
                    {bad ? <Pill tone="danger">{bad}</Pill> : null}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------------- 导入弹层 ---------------- */}
      {showImport ? (
        <div
          onClick={() => setShowImport(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(31,29,26,.42)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 70,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: C.bg, borderRadius: R.lg, padding: 20, width: '100%', maxWidth: 560 }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>导入恢复</span>
              <Btn kind="quiet" onClick={() => setShowImport(false)} style={{ marginLeft: 'auto', minWidth: 34 }}>
                <Icon name="close" size={14} color={C.ink2} />
              </Btn>
            </div>
            <div style={{ fontSize: 12, color: C.ink2, marginBottom: 10, lineHeight: 1.8 }}>
              把之前导出的 JSON 内容整段粘贴进来。导入会覆盖当前全部数据（导入前会自动留存 data.bak.json）。
            </div>
            <textarea
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder='{"kind":"designer-desk-backup", ...}'
              style={{ ...inputStyle, minHeight: 150, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12, lineHeight: 1.6 }}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 14 }}>
              <Btn onClick={() => setShowImport(false)}>取消</Btn>
              <Btn kind="primary" disabled={busy === 'import'} onClick={onImport}>
                {busy === 'import' ? '导入中…' : '确认导入'}
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------------- Toast ---------------- */}
      {toast ? (
        <div
          style={{
            position: 'fixed',
            left: '50%',
            bottom: narrow ? 'calc(80px + env(safe-area-inset-bottom))' : 28,
            transform: 'translateX(-50%)',
            background: toast.kind === 'ok' ? C.ink : C.danger,
            color: '#fff',
            fontSize: 12.5,
            fontWeight: 600,
            padding: '9px 16px',
            borderRadius: R.pill,
            zIndex: 90,
            maxWidth: '90vw',
            textAlign: 'center',
            lineHeight: 1.6,
            boxShadow: '0 6px 20px rgba(0,0,0,.18)',
          }}
        >
          {toast.text}
        </div>
      ) : null}
    </div>
  )
}
