/**
 * designer-desk · 工地巡检（M4）
 *
 * 阶段 7 施工 / 8 安装验收的核心动作：按「水电 → 瓦工 → 木工 → 油漆 → 安装 → 验收」
 * 六个节点跟进，每个节点记录状态、计划日、整改备注与现场照片路径。
 *
 * 铁律 9：纯展示 + 本地表单状态，所有写操作通过 props 回调交给顶层（自身不发请求）。
 */
import { useMemo, useState } from 'react'
import { Btn, C, Empty, Field, Icon, Pill, R, cardStyle, inputStyle, useIsNarrow } from './kit'
import type { InspectionNode, InspectionStatus, ProjectView, SiteInspection } from '../types'

export interface SitesProps {
  projects: ProjectView[]
  sites: SiteInspection[]
  onSave: (site: any) => void
  onDelete: (id: string) => void
}

/** 六个巡检节点的固定顺序 —— 施工的先后顺序就是验收的先后顺序 */
const NODES: InspectionNode[] = ['水电', '瓦工', '木工', '油漆', '安装', '验收']

const STATUSES: InspectionStatus[] = ['待巡检', '进行中', '通过', '需整改']

const STATUS_TONE: Record<InspectionStatus, 'neutral' | 'warn' | 'ok' | 'danger'> = {
  待巡检: 'neutral',
  进行中: 'warn',
  通过: 'ok',
  需整改: 'danger',
}

/** 状态推进链：推进按钮一键走到下一档；已通过 / 需整改需人工改 */
const NEXT_STATUS: Record<InspectionStatus, InspectionStatus | null> = {
  待巡检: '进行中',
  进行中: '通过',
  通过: null,
  需整改: '进行中',
}

const BLANK = {
  projectId: '',
  node: '水电' as InspectionNode,
  status: '待巡检' as InspectionStatus,
  plannedAt: '',
  doneAt: '',
  note: '',
}

/** 今天（本地时区）YYYY-MM-DD */
function todayYmd(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** a - b 天数差（正数= a 在 b 之后） */
function dayDiff(a: string, b: string): number {
  const pa = a.split('-').map(Number)
  const pb = b.split('-').map(Number)
  const da = new Date(pa[0], (pa[1] || 1) - 1, pa[2] || 1).getTime()
  const db = new Date(pb[0], (pb[1] || 1) - 1, pb[2] || 1).getTime()
  return Math.round((da - db) / 86400000)
}

/** 计划日文案：逾期红、当天黄、其余中性 */
function plannedText(plannedAt?: string): { text: string; tone: 'danger' | 'warn' | 'neutral' } {
  if (!plannedAt) return { text: '未排期', tone: 'neutral' }
  const d = dayDiff(plannedAt, todayYmd())
  if (d < 0) return { text: `逾期 ${Math.abs(d)} 天`, tone: 'danger' }
  if (d === 0) return { text: '今天', tone: 'warn' }
  return { text: `${d} 天后`, tone: 'neutral' }
}

export function Sites({ projects, sites, onSave, onDelete }: SitesProps) {
  const narrow = useIsNarrow()
  const [projectFilter, setProjectFilter] = useState<string>('all')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ ...BLANK })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})

  /** 只有进入施工/验收阶段的项目才需要巡检 —— 其余项目不占版面 */
  const siteProjects = useMemo(
    () => projects.filter((p) => p.stage === 7 || p.stage === 8),
    [projects],
  )

  const visible = useMemo(() => {
    if (projectFilter === 'all') return siteProjects
    return siteProjects.filter((p) => p.id === projectFilter)
  }, [siteProjects, projectFilter])

  /** 按项目过滤后的集合里是否一条巡检记录都没有 —— 用来决定要不要显示空态卡片 */
  const visibleHasRows = useMemo(() => {
    const ids = new Set(visible.map((p) => p.id))
    return sites.some((s) => ids.has(s.projectId))
  }, [visible, sites])

  const stats = useMemo(() => {
    const all = sites
    return {
      total: all.length,
      pending: all.filter((s) => s.status === '待巡检').length,
      doing: all.filter((s) => s.status === '进行中').length,
      bad: all.filter((s) => s.status === '需整改').length,
      overdue: all.filter((s) => s.status !== '通过' && s.plannedAt && dayDiff(s.plannedAt, todayYmd()) < 0).length,
    }
  }, [sites])

  const submitCreate = () => {
    if (!draft.projectId) return
    onSave({
      projectId: draft.projectId,
      node: draft.node,
      status: draft.status,
      plannedAt: draft.plannedAt || undefined,
      doneAt: draft.status === '通过' ? todayYmd() : draft.doneAt || undefined,
      note: draft.note,
    })
    setDraft({ ...BLANK })
    setCreating(false)
  }

  const cycle = (s: SiteInspection) => {
    const next = NEXT_STATUS[s.status]
    if (!next) return
    onSave({
      id: s.id,
      status: next,
      doneAt: next === '通过' ? todayYmd() : undefined,
      // 整改后回到进行中，把完成日清掉，等真正通过再写
      ...(next === '进行中' ? { doneAt: undefined } : {}),
    })
  }

  return (
    <div>
      {/* ---------- 工具条 ---------- */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 14,
          flexWrap: 'wrap',
        }}
      >
        <Btn kind="primary" onClick={() => setCreating(true)} disabled={!projects.length}>
          <Icon name="plus" size={13} color="#fff" />
          登记巡检
        </Btn>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          style={{
            ...inputStyle,
            width: narrow ? '100%' : 220,
            fontSize: 13,
            padding: '7px 10px',
          }}
        >
          <option value="all">全部施工中项目（{siteProjects.length}）</option>
          {siteProjects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 6, marginLeft: narrow ? 0 : 'auto', flexWrap: 'wrap' }}>
          <Pill tone="neutral">共 {stats.total} 节点</Pill>
          {stats.doing ? <Pill tone="warn">进行中 {stats.doing}</Pill> : null}
          {stats.pending ? <Pill tone="neutral">待巡检 {stats.pending}</Pill> : null}
          {stats.bad ? <Pill tone="danger">需整改 {stats.bad}</Pill> : null}
          {stats.overdue ? <Pill tone="danger">逾期 {stats.overdue}</Pill> : null}
        </div>
      </div>

      {!projects.length ? (
        <Empty text="还没有项目 —— 先去「项目」页建档，进了施工阶段才能登记巡检" />
      ) : !siteProjects.length ? (
        <Empty text="当前没有处于施工 / 安装验收阶段的项目。巡检只在这两个阶段有意义，所以这里不显示其他项目" />
      ) : !sites.length ? (
        <Empty text="还没有巡检记录。点「登记巡检」，从水电节点开始按顺序推进" />
      ) : null}

      {/* ---------- 按项目分组的巡检卡 ---------- */}
      <div style={{ display: 'grid', gap: 12 }}>
        {visible.map((p) => {
          const mine = sites.filter((s) => s.projectId === p.id)
          const byNode = new Map(mine.map((s) => [s.node, s]))
          const passed = mine.filter((s) => s.status === '通过').length
          const bad = mine.filter((s) => s.status === '需整改').length
          return (
            <div key={p.id} style={cardStyle}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  flexWrap: 'wrap',
                  marginBottom: 12,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${C.lineSoft}`,
                }}
              >
                <Icon name="build" size={15} color={C.brand} />
                <span style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</span>
                <span style={{ fontSize: 11.5, color: C.ink2 }}>
                  {p.customerName} · {p.stageName}
                </span>
                <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap' }}>
                  {bad ? <Pill tone="danger">需整改 {bad}</Pill> : null}
                  <Pill tone={passed === mine.length && mine.length ? 'ok' : 'neutral'}>
                    {passed}/{mine.length || 0} 已通过
                  </Pill>
                </div>
              </div>

              {!mine.length ? (
                <div style={{ fontSize: 12, color: C.ink3, padding: '8px 0' }}>
                  这个项目还没有巡检记录
                </div>
              ) : null}

              {/* 六节点流程条 */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                {NODES.map((node) => {
                  const s = byNode.get(node)
                  if (!s) {
                    return (
                      <div
                        key={node}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '5px 10px',
                          borderRadius: R.sm,
                          border: `1px dashed ${C.line}`,
                          fontSize: 12,
                          color: C.ink3,
                        }}
                      >
                        {node}
                      </div>
                    )
                  }
                  const plan = plannedText(s.plannedAt)
                  const tone = STATUS_TONE[s.status]
                  return (
                    <div
                      key={node}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '5px 10px',
                        borderRadius: R.sm,
                        border: `1px solid ${
                          tone === 'danger' ? '#E6BCB2' : tone === 'ok' ? '#CFE0D5' : tone === 'warn' ? '#EBD9CF' : C.line
                        }`,
                        background:
                          tone === 'danger' ? C.dangerSoft : tone === 'ok' ? C.okSoft : tone === 'warn' ? C.warnSoft : '#fff',
                      }}
                    >
                      <span style={{ fontSize: 12, fontWeight: 700, color: C.ink }}>{node}</span>
                      <Pill tone={tone}>{s.status}</Pill>
                      {s.status !== '通过' && s.plannedAt ? (
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: plan.tone === 'danger' ? C.danger : plan.tone === 'warn' ? C.warn : C.ink3,
                          }}
                        >
                          {plan.text}
                        </span>
                      ) : null}
                    </div>
                  )
                })}
              </div>

              {/* 明细行 */}
              {mine.map((s) => {
                const plan = plannedText(s.plannedAt)
                const isEditing = editingId === s.id
                const noteValue = isEditing ? (noteDraft[s.id] ?? s.note ?? '') : s.note ?? ''
                return (
                  <div
                    key={s.id}
                    style={{
                      padding: '11px 0',
                      borderTop: `1px solid ${C.lineSoft}`,
                      display: 'flex',
                      flexDirection: narrow ? 'column' : 'row',
                      gap: narrow ? 8 : 12,
                      alignItems: narrow ? 'stretch' : 'center',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 13, fontWeight: 700 }}>{s.node}</span>
                        <Pill tone={STATUS_TONE[s.status]}>{s.status}</Pill>
                        {s.status !== '通过' && s.plannedAt ? (
                          <span
                            style={{
                              fontSize: 11.5,
                              fontWeight: 600,
                              color: plan.tone === 'danger' ? C.danger : plan.tone === 'warn' ? C.warn : C.ink2,
                            }}
                          >
                            计划 {s.plannedAt} · {plan.text}
                          </span>
                        ) : null}
                        {s.doneAt ? <span style={{ fontSize: 11.5, color: C.ok }}>完成 {s.doneAt}</span> : null}
                        {s.photos?.length ? (
                          <span style={{ fontSize: 11.5, color: C.ink2 }}>照片 {s.photos.length}</span>
                        ) : null}
                      </div>

                      {isEditing ? (
                        <textarea
                          value={noteValue}
                          autoFocus
                          placeholder="巡检结论 / 整改要求，如：瓷砖空鼓率偏高，需局部返工"
                          onChange={(e) => setNoteDraft((d) => ({ ...d, [s.id]: e.target.value }))}
                          style={{
                            ...inputStyle,
                            marginTop: 8,
                            minHeight: 62,
                            fontSize: 13,
                            lineHeight: 1.6,
                            resize: 'vertical',
                          }}
                        />
                      ) : s.note ? (
                        <div style={{ fontSize: 12, color: C.ink2, marginTop: 5, lineHeight: 1.7 }}>{s.note}</div>
                      ) : (
                        <div style={{ fontSize: 12, color: C.ink3, marginTop: 4 }}>还没写巡检结论</div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {NEXT_STATUS[s.status] ? (
                        <Btn kind="primary" onClick={() => cycle(s)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                          {s.status === '需整改' ? '整改中' : `标为${NEXT_STATUS[s.status]}`}
                        </Btn>
                      ) : null}

                      {isEditing ? (
                        <>
                          <Btn
                            kind="primary"
                            onClick={() => {
                              onSave({ id: s.id, note: noteValue })
                              setEditingId(null)
                            }}
                            style={{ padding: '5px 11px', fontSize: 12.5 }}
                          >
                            保存
                          </Btn>
                          <Btn onClick={() => setEditingId(null)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                            取消
                          </Btn>
                        </>
                      ) : (
                        <Btn
                          onClick={() => {
                            setEditingId(s.id)
                            setNoteDraft((d) => ({ ...d, [s.id]: s.note ?? '' }))
                          }}
                          style={{ padding: '5px 11px', fontSize: 12.5 }}
                        >
                          记结论
                        </Btn>
                      )}

                      {/* 状态直改：推进链走不通时（比如直接判整改）在这里改 */}
                      <select
                        value={s.status}
                        onChange={(e) => {
                          const next = e.target.value as InspectionStatus
                          onSave({
                            id: s.id,
                            status: next,
                            doneAt: next === '通过' ? todayYmd() : undefined,
                          })
                        }}
                        style={{
                          ...inputStyle,
                          width: 'auto',
                          fontSize: 12,
                          padding: '5px 8px',
                          minHeight: 30,
                        }}
                      >
                        {STATUSES.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>

                      <Btn kind="danger" onClick={() => onDelete(s.id)} style={{ padding: '5px 9px' }}>
                        <Icon name="trash" size={12.5} color={C.danger} />
                      </Btn>
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>

      {!visibleHasRows ? (
        <Empty text="这些项目还没有巡检记录。点「登记巡检」，从水电节点开始按顺序推进" />
      ) : null}

      <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 12, lineHeight: 1.8 }}>
        六个节点按施工顺序排列。巡检没做完不会自动生成待办 —— 需要提醒的话，把「下次工地巡检」那条待办留着别完成。
      </div>

      {/* ---------- 新建巡检弹层 ---------- */}
      {creating ? (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(31,29,26,.35)',
            display: 'flex',
            alignItems: narrow ? 'flex-end' : 'center',
            justifyContent: 'center',
            zIndex: 60,
            padding: narrow ? 0 : 20,
          }}
          onClick={() => setCreating(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.bg,
              width: narrow ? '100%' : 520,
              maxHeight: narrow ? '92vh' : '86vh',
              overflowY: 'auto',
              borderRadius: narrow ? '14px 14px 0 0' : R.lg,
              padding: narrow ? '18px 16px calc(18px + env(safe-area-inset-bottom))' : '22px 24px',
              boxShadow: '0 12px 40px rgba(0,0,0,.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>登记巡检</span>
              <Btn kind="quiet" onClick={() => setCreating(false)} style={{ marginLeft: 'auto', minWidth: 34 }}>
                <Icon name="close" size={14} color={C.ink2} />
              </Btn>
            </div>
            <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 16, lineHeight: 1.7 }}>
              一次登记一个节点。同一个项目的同一个节点只保留一条记录，重复登记会覆盖。
            </div>

            <Field label="所属项目 *">
              <select
                value={draft.projectId}
                onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value }))}
                style={inputStyle}
              >
                <option value="">请选择项目</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}（{p.stageName}）
                  </option>
                ))}
              </select>
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: '0 14px' }}>
              <Field label="巡检节点">
                <select
                  value={draft.node}
                  onChange={(e) => setDraft((d) => ({ ...d, node: e.target.value as InspectionNode }))}
                  style={inputStyle}
                >
                  {NODES.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="初始状态">
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as InspectionStatus }))}
                  style={inputStyle}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="计划巡检日" hint="留空表示未排期。排了期且逾期会标红提示。">
              <input
                style={inputStyle}
                type="date"
                value={draft.plannedAt}
                onChange={(e) => setDraft((d) => ({ ...d, plannedAt: e.target.value }))}
              />
            </Field>

            <Field label="巡检结论" hint="如：开槽规范，打压测试合格">
              <textarea
                style={{ ...inputStyle, minHeight: 72, fontSize: 13, lineHeight: 1.6, resize: 'vertical' }}
                value={draft.note}
                onChange={(e) => setDraft((d) => ({ ...d, note: e.target.value }))}
              />
            </Field>

            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                paddingTop: 14,
                borderTop: `1px solid ${C.line}`,
              }}
            >
              <Btn onClick={() => setCreating(false)}>取消</Btn>
              <Btn kind="primary" onClick={submitCreate} disabled={!draft.projectId}>
                登记
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}