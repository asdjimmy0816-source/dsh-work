/**
 * designer-desk · 项目管线看板
 *
 * 数据主键是「项目」，待办是项目的自动产物。
 * 点「推进」→ 阶段 +1 → 自动排出下一阶段标准待办（推一下就走）。
 * 纯展示 + 本地表单状态，所有写操作通过 props 回调交给顶层（铁律 9）。
 */
import { useMemo, useState } from 'react'
import { Btn, C, Empty, Field, Icon, Pill, R, cardStyle, dueText, inputStyle, labelStyle, money, useIsNarrow } from './kit'
import type { Customer, ProjectView, StageDef } from '../types'

export interface ProjectsProps {
  projects: ProjectView[]
  customers: Customer[]
  stages: StageDef[]
  focusProjectId: string | null
  onClearFocus: () => void
  onSave: (payload: { project: any; customer?: any; silent?: boolean }) => void
  onAdvance: (id: string, note?: string) => void
  onDelete: (id: string) => void
  onRender: (projectId: string) => void
}

type View = 'board' | 'list'

const BLANK_CUSTOMER = {
  name: '',
  phone: '',
  wechat: '',
  community: '',
  roomNo: '',
  layout: '',
  area: '',
  style: '',
  budget: '',
  family: '',
  taboo: '',
  note: '',
}

/* ------------------------------------------------------------------ *
 * 客户档案表单
 * ------------------------------------------------------------------ */

function CustomerFields({
  value,
  onChange,
  narrow,
}: {
  value: any
  onChange: (patch: any) => void
  narrow: boolean
}) {
  const two: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: narrow ? '1fr' : '1fr 1fr',
    gap: '0 14px',
  }
  return (
    <div>
      <div style={two}>
        <Field label="客户称呼 *">
          <input
            style={inputStyle}
            value={value.name ?? ''}
            placeholder="如 王女士"
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </Field>
        <Field label="电话">
          <input
            style={inputStyle}
            value={value.phone ?? ''}
            placeholder="138****0000"
            onChange={(e) => onChange({ phone: e.target.value })}
          />
        </Field>
        <Field label="微信">
          <input style={inputStyle} value={value.wechat ?? ''} onChange={(e) => onChange({ wechat: e.target.value })} />
        </Field>
        <Field label="小区">
          <input
            style={inputStyle}
            value={value.community ?? ''}
            placeholder="如 金地花园"
            onChange={(e) => onChange({ community: e.target.value })}
          />
        </Field>
        <Field label="房号">
          <input
            style={inputStyle}
            value={value.roomNo ?? ''}
            placeholder="如 1201"
            onChange={(e) => onChange({ roomNo: e.target.value })}
          />
        </Field>
        <Field label="户型">
          <input
            style={inputStyle}
            value={value.layout ?? ''}
            placeholder="如 三室两厅"
            onChange={(e) => onChange({ layout: e.target.value })}
          />
        </Field>
        <Field label="面积（㎡）">
          <input
            style={inputStyle}
            type="number"
            inputMode="decimal"
            value={value.area ?? ''}
            onChange={(e) => onChange({ area: e.target.value })}
          />
        </Field>
        <Field label="风格偏好">
          <input
            style={inputStyle}
            value={value.style ?? ''}
            placeholder="如 奶油风 / 新中式"
            onChange={(e) => onChange({ style: e.target.value })}
          />
        </Field>
        <Field label="预算（元）">
          <input
            style={inputStyle}
            type="number"
            inputMode="numeric"
            value={value.budget ?? ''}
            onChange={(e) => onChange({ budget: e.target.value })}
          />
        </Field>
        <Field label="家庭成员">
          <input
            style={inputStyle}
            value={value.family ?? ''}
            placeholder="如 夫妻 + 1 个小孩"
            onChange={(e) => onChange({ family: e.target.value })}
          />
        </Field>
      </div>
      <Field label="禁忌项 / 硬性要求" hint="如「不接受开放式厨房」「老人怕冷，地暖必留」">
        <input style={inputStyle} value={value.taboo ?? ''} onChange={(e) => onChange({ taboo: e.target.value })} />
      </Field>
      <Field label="备注">
        <textarea
          style={{ ...inputStyle, minHeight: 60, resize: 'vertical', lineHeight: 1.7 }}
          value={value.note ?? ''}
          onChange={(e) => onChange({ note: e.target.value })}
        />
      </Field>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * 项目卡片
 * ------------------------------------------------------------------ */

function ProjectCard({
  p,
  onOpen,
  onAdvance,
  onRender,
}: {
  p: ProjectView
  onOpen: () => void
  onAdvance: () => void
  onRender: () => void
}) {
  const due = dueText(p.daysToNext)
  const dueTone = due.tone === 'danger' ? C.danger : due.tone === 'warn' ? C.warn : C.ink2
  const isDone = p.stage >= 9

  return (
    <div
      style={{
        ...cardStyle,
        padding: '12px 13px',
        marginBottom: 10,
        borderColor: p.overdue ? '#E6BCB2' : C.line,
        background: p.overdue ? '#FFFCFB' : C.card,
        cursor: 'pointer',
      }}
      onClick={onOpen}
    >
      <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>{p.name}</div>
      <div style={{ fontSize: 11.5, color: C.ink2, marginBottom: 8 }}>
        {p.customerName}
        {p.style ? ` · ${p.style}` : ''}
        {p.area ? ` · ${p.area}㎡` : ''}
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 9 }}>
        <Pill tone="brand">{p.stageName}</Pill>
        <Pill tone={due.tone === 'danger' ? 'danger' : due.tone === 'warn' ? 'warn' : 'neutral'}>
          {due.text}
        </Pill>
        {p.amount ? <Pill tone="ok">{money(p.amount)}</Pill> : null}
      </div>

      {p.nextAction ? (
        <div style={{ fontSize: 12, color: C.ink2, marginBottom: 9, lineHeight: 1.6 }}>
          下一步：<span style={{ color: dueTone, fontWeight: 600 }}>{p.nextAction}</span>
          {p.nextActionAt ? <span style={{ color: C.ink3 }}> · {p.nextActionAt}</span> : null}
        </div>
      ) : (
        <div style={{ fontSize: 12, color: C.ok, marginBottom: 9 }}>已结项</div>
      )}

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }} onClick={(e) => e.stopPropagation()}>
        <Btn
          kind="primary"
          disabled={isDone}
          onClick={onAdvance}
          style={{ padding: '5px 10px', fontSize: 12.5 }}
          title={isDone ? '已到最后一个阶段' : '推进到下一阶段，自动排出下一步'}
        >
          <Icon name="arrow" size={12.5} color="#fff" />
          推进
        </Btn>
        <Btn onClick={onRender} style={{ padding: '5px 10px', fontSize: 12.5 }}>
          <Icon name="image" size={12.5} color={C.ink2} />
          出效果图
        </Btn>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * 主组件
 * ------------------------------------------------------------------ */

export function Projects({
  projects,
  stages,
  focusProjectId,
  onClearFocus,
  onSave,
  onAdvance,
  onDelete,
  onRender,
}: ProjectsProps) {
  const narrow = useIsNarrow()
  const [view, setView] = useState<View>(narrow ? 'list' : 'board')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState<any>({ ...BLANK_CUSTOMER })
  const [detailId, setDetailId] = useState<string | null>(null)
  const [advanceNote, setAdvanceNote] = useState('')

  // 外部（今日页点击项目名）聚焦某项目 → 打开详情
  const focused = focusProjectId ? projects.find((p) => p.id === focusProjectId) : undefined
  const activeId = focused?.id ?? detailId
  const active = activeId ? projects.find((p) => p.id === activeId) : undefined

  const grouped = useMemo(() => {
    return stages.map((s) => ({ stage: s, items: projects.filter((p) => p.stage === s.n) }))
  }, [stages, projects])

  const closeDetail = () => {
    setDetailId(null)
    setAdvanceNote('')
    onClearFocus()
  }

  const submitCreate = () => {
    if (!String(draft.name ?? '').trim() && !String(draft.community ?? '').trim()) return
    onSave({ project: {}, customer: { ...draft } })
    setDraft({ ...BLANK_CUSTOMER })
    setCreating(false)
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
        <Btn kind="primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={13} color="#fff" />
          新建项目
        </Btn>
        <div style={{ display: 'flex', gap: 4, marginLeft: narrow ? 0 : 'auto' }}>
          <Btn
            kind={view === 'board' ? 'primary' : 'ghost'}
            onClick={() => setView('board')}
            disabled={narrow}
            title={narrow ? '窄屏建议用列表视图' : '看板视图'}
          >
            <Icon name="board" size={13} color={view === 'board' && !narrow ? '#fff' : C.ink2} />
            看板
          </Btn>
          <Btn kind={view === 'list' ? 'primary' : 'ghost'} onClick={() => setView('list')}>
            列表
          </Btn>
        </div>
      </div>

      {!projects.length ? (
        <Empty text="还没有项目。点「新建项目」建档，系统会自动生成第一条待办「预约客户量房」" />
      ) : null}

      {/* ---------- 看板视图 ---------- */}
      {projects.length && view === 'board' ? (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
          {grouped.map((g) => (
            <div key={g.stage.n} style={{ flex: 'none', width: 236 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  marginBottom: 9,
                  paddingBottom: 7,
                  borderBottom: `2px solid ${g.items.length ? C.brand : C.line}`,
                }}
              >
                <span style={{ fontSize: 12.5, fontWeight: 700, color: g.items.length ? C.ink : C.ink3 }}>
                  {g.stage.n}. {g.stage.name}
                </span>
                <Pill tone={g.items.length ? 'brand' : 'neutral'}>{g.items.length}</Pill>
              </div>
              {g.items.map((p) => (
                <ProjectCard
                  key={p.id}
                  p={p}
                  onOpen={() => setDetailId(p.id)}
                  onAdvance={() => onAdvance(p.id)}
                  onRender={() => onRender(p.id)}
                />
              ))}
              {!g.items.length ? (
                <div style={{ fontSize: 11.5, color: C.ink3, padding: '6px 2px' }}>空</div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* ---------- 列表视图 ---------- */}
      {projects.length && view === 'list' ? (
        <div style={{ display: 'grid', gap: 10 }}>
          {projects.map((p) => {
            const due = dueText(p.daysToNext)
            return (
              <div key={p.id} style={{ ...cardStyle, borderColor: p.overdue ? '#E6BCB2' : C.line }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: C.ink2, marginTop: 4, lineHeight: 1.7 }}>
                      {p.customerName}
                      {p.community ? ` · ${p.community}${p.roomNo ? ` ${p.roomNo}` : ''}` : ''}
                      {p.layout ? ` · ${p.layout}` : ''}
                      {p.area ? ` · ${p.area}㎡` : ''}
                    </div>
                    {p.nextAction ? (
                      <div style={{ fontSize: 12, color: C.ink2, marginTop: 6 }}>
                        下一步：<b style={{ color: due.tone === 'danger' ? C.danger : C.ink }}>{p.nextAction}</b>
                        {p.nextActionAt ? ` · ${p.nextActionAt}` : ''}
                      </div>
                    ) : null}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Pill tone="brand">{p.stageName}</Pill>
                    <Pill tone={due.tone === 'danger' ? 'danger' : due.tone === 'warn' ? 'warn' : 'neutral'}>
                      {due.text}
                    </Pill>
                    <Pill tone="ok">{money(p.amount)}</Pill>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
                  <Btn kind="primary" disabled={p.stage >= 9} onClick={() => onAdvance(p.id)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                    推进阶段
                  </Btn>
                  <Btn onClick={() => setDetailId(p.id)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                    详情 / 编辑
                  </Btn>
                  <Btn onClick={() => onRender(p.id)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                    出效果图
                  </Btn>
                </div>
              </div>
            )
          })}
        </div>
      ) : null}

      {/* ---------- 新建项目弹层 ---------- */}
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
              width: narrow ? '100%' : 620,
              maxHeight: narrow ? '92vh' : '86vh',
              overflowY: 'auto',
              borderRadius: narrow ? '14px 14px 0 0' : R.lg,
              padding: narrow ? '18px 16px calc(18px + env(safe-area-inset-bottom))' : '22px 24px',
              boxShadow: '0 12px 40px rgba(0,0,0,.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>新建项目</span>
              <Btn kind="quiet" onClick={() => setCreating(false)} style={{ marginLeft: 'auto', minWidth: 34 }}>
                <Icon name="close" size={14} color={C.ink2} />
              </Btn>
            </div>
            <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 14, lineHeight: 1.7 }}>
              建档后自动进入「1. 线索」阶段，并生成第一条待办「预约客户量房」。
            </div>
            <CustomerFields value={draft} onChange={(patch) => setDraft((d: any) => ({ ...d, ...patch }))} narrow={narrow} />
            <div
              style={{
                display: 'flex',
                gap: 8,
                justifyContent: 'flex-end',
                marginTop: 8,
                paddingTop: 14,
                borderTop: `1px solid ${C.line}`,
              }}
            >
              <Btn onClick={() => setCreating(false)}>取消</Btn>
              <Btn kind="primary" onClick={submitCreate}>
                建档并生成待办
              </Btn>
            </div>
          </div>
        </div>
      ) : null}

      {/* ---------- 详情抽屉 ---------- */}
      {active ? (
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
          onClick={closeDetail}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: C.bg,
              width: narrow ? '100%' : 720,
              maxHeight: narrow ? '92vh' : '88vh',
              overflowY: 'auto',
              borderRadius: narrow ? '14px 14px 0 0' : R.lg,
              padding: narrow ? '18px 16px calc(18px + env(safe-area-inset-bottom))' : '22px 24px',
              boxShadow: '0 12px 40px rgba(0,0,0,.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 4, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 17, fontWeight: 700 }}>{active.name}</span>
              <Pill tone="brand">{active.stageName}</Pill>
              {active.overdue ? <Pill tone="danger">已逾期</Pill> : null}
              <Btn kind="quiet" onClick={closeDetail} style={{ marginLeft: 'auto', minWidth: 34 }}>
                <Icon name="close" size={14} color={C.ink2} />
              </Btn>
            </div>
            <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 16, lineHeight: 1.7 }}>
              当前阶段标准动作：{active.stageAction} · 交付物：
              {stages.find((s) => s.n === active.stage)?.deliver ?? '—'}
            </div>

            {/* 推进区 */}
            <div style={{ ...cardStyle, marginBottom: 16, background: C.brandSoft, borderColor: '#EBD9CF' }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 7 }}>
                <Icon name="arrow" size={14} color={C.brand} />
                推进到下一阶段
              </div>
              <input
                style={{ ...inputStyle, marginBottom: 9 }}
                placeholder="本次推进的备注（可留空），如：量房完成，户型已归档"
                value={advanceNote}
                onChange={(e) => setAdvanceNote(e.target.value)}
              />
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Btn
                  kind="primary"
                  disabled={active.stage >= 9}
                  onClick={() => {
                    onAdvance(active.id, advanceNote)
                    setAdvanceNote('')
                  }}
                >
                  {active.stage >= 9 ? '已结项' : `推进到「${stages[Math.min(8, active.stage)]?.name}」`}
                </Btn>
                <Btn onClick={() => onRender(active.id)}>出效果图</Btn>
                <Btn
                  kind="danger"
                  onClick={() => {
                    onDelete(active.id)
                    closeDetail()
                  }}
                >
                  删除项目
                </Btn>
              </div>
            </div>

            {/* 客户档案 */}
            <div style={{ fontSize: 13, fontWeight: 700, margin: '0 0 10px' }}>客户档案</div>
            <CustomerFields
              value={active}
              onChange={(patch) => {
                const customer = { id: active.customerId, ...patch }
                onSave({ project: { id: active.id }, customer, silent: true })
              }}
              narrow={narrow}
            />

            {/* 项目字段 */}
            <div style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 10px' }}>项目信息</div>
            <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: '0 14px' }}>
              <Field label="项目名">
                <input
                  style={inputStyle}
                  defaultValue={active.name}
                  onBlur={(e) => onSave({ project: { id: active.id, name: e.target.value }, silent: true })}
                />
              </Field>
              <Field label="合同金额（元）">
                <input
                  style={inputStyle}
                  type="number"
                  defaultValue={active.amount ?? ''}
                  onBlur={(e) => onSave({ project: { id: active.id, amount: Number(e.target.value) }, silent: true })}
                />
              </Field>
            </div>

            {/* 流水 */}
            <div style={{ fontSize: 13, fontWeight: 700, margin: '18px 0 10px' }}>
              项目流水 <span style={{ fontWeight: 400, color: C.ink3, fontSize: 12 }}>（{active.logs?.length ?? 0} 条）</span>
            </div>
            {active.logs?.length ? (
              <div style={{ borderLeft: `2px solid ${C.line}`, paddingLeft: 14 }}>
                {[...active.logs].reverse().map((log, i) => (
                  <div key={i} style={{ marginBottom: 10 }}>
                    <div style={{ fontSize: 12.5, color: C.ink }}>{log.text}</div>
                    <div style={{ fontSize: 11, color: C.ink3, marginTop: 2 }}>{String(log.at).slice(0, 19).replace('T', ' ')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <Empty text="还没有流水记录" />
            )}

            <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 14, lineHeight: 1.8, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
              提示：客户档案与项目字段的改动在失焦时自动保存，不需要点保存按钮。
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
