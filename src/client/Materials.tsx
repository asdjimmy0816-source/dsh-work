/**
 * designer-desk · 材料进场（M5）
 *
 * 阶段 6 选材深化 / 7 施工的核心动作：主材从「待下单」到「已验收」的五个状态流转，
 * 按项目分组，随时看到还差什么、已经花了多少。
 *
 * 铁律 9：纯展示 + 本地表单状态，所有写操作通过 props 回调交给顶层（自身不发请求）。
 */
import { useMemo, useState } from 'react'
import { Btn, C, Empty, Field, Icon, Pill, R, cardStyle, inputStyle, money, useIsNarrow } from './kit'
import type { MaterialItem, MaterialStatus, ProjectView } from '../types'

export interface MaterialsProps {
  projects: ProjectView[]
  materials: MaterialItem[]
  onSave: (material: any) => void
  onDelete: (id: string) => void
}

/** 五个状态按进货顺序排列 */
const STATUSES: MaterialStatus[] = ['待下单', '已下单', '在途', '已到场', '已验收']

const STATUS_TONE: Record<MaterialStatus, 'neutral' | 'warn' | 'ok' | 'brand'> = {
  待下单: 'neutral',
  已下单: 'warn',
  在途: 'warn',
  已到场: 'brand',
  已验收: 'ok',
}

/** 推进链：待下单 → 已下单 → 在途 → 已到场 → 已验收 */
const NEXT_STATUS: Record<MaterialStatus, MaterialStatus | null> = {
  待下单: '已下单',
  已下单: '在途',
  在途: '已到场',
  已到场: '已验收',
  已验收: null,
}

const CATEGORIES = ['瓷砖', '地板', '橱柜', '涂料', '电器', '卫浴', '门窗', '灯具', '家具', '软装', '其他']

const BLANK = {
  projectId: '',
  name: '',
  category: '瓷砖',
  brand: '',
  spec: '',
  price: '',
  qty: '',
  unit: '',
  supplier: '',
  arriveAt: '',
  status: '待下单' as MaterialStatus,
  note: '',
}

function todayYmd(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dayDiff(a: string, b: string): number {
  const pa = a.split('-').map(Number)
  const pb = b.split('-').map(Number)
  const da = new Date(pa[0], (pa[1] || 1) - 1, pa[2] || 1).getTime()
  const db = new Date(pb[0], (pb[1] || 1) - 1, pb[2] || 1).getTime()
  return Math.round((da - db) / 86400000)
}

/** 计划进场日文案 */
function arriveText(arriveAt?: string): { text: string; tone: 'danger' | 'warn' | 'ok' | 'neutral' } {
  if (!arriveAt) return { text: '未排期', tone: 'neutral' }
  const d = dayDiff(arriveAt, todayYmd())
  if (d < 0) return { text: `已逾期 ${Math.abs(d)} 天`, tone: 'danger' }
  if (d === 0) return { text: '今天进场', tone: 'warn' }
  if (d <= 3) return { text: `${d} 天后进场`, tone: 'warn' }
  return { text: `${d} 天后进场`, tone: 'ok' }
}

export function Materials({ projects, materials, onSave, onDelete }: MaterialsProps) {
  const narrow = useIsNarrow()
  const [projectFilter, setProjectFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<'all' | MaterialStatus>('all')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ ...BLANK })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  /** 材料从选材阶段开始挂项目；未挂项目的不进主视图，避免漏管 */
  const tracked = useMemo(
    () => projects.filter((p) => p.stage >= 5),
    [projects],
  )

  const visibleProjects = useMemo(() => {
    if (projectFilter === 'all') return tracked
    return tracked.filter((p) => p.id === projectFilter)
  }, [tracked, projectFilter])

  const rowsOf = useMemo(() => {
    const map = new Map<string, MaterialItem[]>()
    for (const p of visibleProjects) {
      let list = materials.filter((m) => m.projectId === p.id)
      if (statusFilter !== 'all') list = list.filter((m) => m.status === statusFilter)
      map.set(p.id, list)
    }
    return map
  }, [visibleProjects, materials, statusFilter])

  const stats = useMemo(() => {
    const byStatus = {} as Record<MaterialStatus, number>
    for (const s of STATUSES) byStatus[s] = 0
    let spend = 0
    let urgent = 0
    for (const m of materials) {
      byStatus[m.status] = (byStatus[m.status] ?? 0) + 1
      // 已下单之后就算钱花出去了
      if (m.status !== '待下单' && m.price) spend += m.price
      if (m.status !== '已验收' && m.arriveAt && dayDiff(m.arriveAt, todayYmd()) < 0) urgent += 1
    }
    return { byStatus, spend, urgent, total: materials.length }
  }, [materials])

  const startEdit = (m: MaterialItem) => {
    setEditingId(m.id)
    setForm({
      name: m.name ?? '',
      category: m.category ?? '',
      brand: m.brand ?? '',
      spec: m.spec ?? '',
      price: m.price ?? '',
      qty: m.qty ?? '',
      unit: m.unit ?? '',
      supplier: m.supplier ?? '',
      arriveAt: m.arriveAt ?? '',
      note: m.note ?? '',
    })
  }

  const submitEdit = (m: MaterialItem) => {
    const f = form[m.id] ?? {}
    onSave({
      id: m.id,
      name: String(f.name ?? '').trim() || m.name,
      category: f.category ?? '',
      brand: f.brand ?? '',
      spec: f.spec ?? '',
      price: f.price === '' ? undefined : Number(f.price),
      qty: f.qty === '' ? undefined : Number(f.qty),
      unit: f.unit ?? '',
      supplier: f.supplier ?? '',
      arriveAt: f.arriveAt || undefined,
      note: f.note ?? '',
    })
    setEditingId(null)
  }

  const submitCreate = () => {
    if (!draft.projectId || !draft.name.trim()) return
    onSave({ ...draft, name: draft.name.trim(), arriveAt: draft.arriveAt || undefined })
    setDraft({ ...BLANK })
    setCreating(false)
  }

  return (
    <div>
      {/* ---------- 工具条 ---------- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <Btn kind="primary" onClick={() => setCreating(true)} disabled={!projects.length}>
          <Icon name="plus" size={13} color="#fff" />
          登记材料
        </Btn>

        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          style={{ ...inputStyle, width: narrow ? '100%' : 200, fontSize: 13, padding: '7px 10px' }}
        >
          <option value="all">全部在管项目（{tracked.length}）</option>
          {tracked.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | MaterialStatus)}
          style={{ ...inputStyle, width: narrow ? '100%' : 150, fontSize: 13, padding: '7px 10px' }}
        >
          <option value="all">全部状态</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}（{stats.byStatus[s] ?? 0}）
            </option>
          ))}
        </select>

        <div style={{ display: 'flex', gap: 6, marginLeft: narrow ? 0 : 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
          {stats.urgent ? <Pill tone="danger">进场逾期 {stats.urgent}</Pill> : null}
          <span style={{ fontSize: 12, color: C.ink2 }}>
            已投入 <b style={{ color: C.ink }}>{money(stats.spend)}</b>
          </span>
        </div>
      </div>

      {!projects.length ? (
        <Empty text="还没有项目 —— 先去「项目」页建档，签约之后才能挂材料" />
      ) : !tracked.length ? (
        <Empty text="当前没有处于签约及之后阶段的项目。材料从「选材深化」开始才有意义，所以这里不显示更早的项目" />
      ) : null}

      {/* ---------- 按项目分组 ---------- */}
      {tracked.length ? (
        <div style={{ display: 'grid', gap: 12 }}>
          {visibleProjects.map((p) => {
            const rows = rowsOf.get(p.id) ?? []
            const all = materials.filter((m) => m.projectId === p.id)
            const done = all.filter((m) => m.status === '已验收').length
            const urgent = rows.filter((m) => m.status !== '已验收' && m.arriveAt && dayDiff(m.arriveAt, todayYmd()) < 0)
            const subtotal = all.reduce((sum, m) => sum + (m.price ?? 0), 0)
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
                  <Icon name="box" size={15} color={C.brand} />
                  <span style={{ fontSize: 14.5, fontWeight: 700 }}>{p.name}</span>
                  <span style={{ fontSize: 11.5, color: C.ink2 }}>
                    {p.customerName} · {p.stageName}
                  </span>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
                    {urgent.length ? <Pill tone="danger">逾期 {urgent.length}</Pill> : null}
                    <Pill tone="ok">
                      {done}/{all.length} 已验收
                    </Pill>
                    <span style={{ fontSize: 12, color: C.ink2 }}>{money(subtotal)}</span>
                  </div>
                </div>

                {!rows.length ? (
                  <div style={{ fontSize: 12, color: C.ink3, padding: '8px 0' }}>
                    {statusFilter === 'all' ? '这个项目还没有登记材料' : `没有状态为「${statusFilter}」的材料`}
                  </div>
                ) : null}

                {rows.map((m) => {
                  const isEditing = editingId === m.id
                  const f = isEditing ? (form[m.id] ?? {}) : null
                  const arr = arriveText(m.arriveAt)
                  return (
                    <div
                      key={m.id}
                      style={{
                        padding: '11px 0',
                        borderTop: `1px solid ${C.lineSoft}`,
                        display: 'flex',
                        flexDirection: narrow ? 'column' : 'row',
                        gap: narrow ? 10 : 12,
                        alignItems: narrow ? 'stretch' : 'flex-start',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {isEditing ? (
                          <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '2fr 1fr 1fr', gap: 10 }}>
                            <Field label="名称 *" style={{ marginBottom: 8 }}>
                              <input
                                style={inputStyle}
                                value={f.name ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, [m.id]: { ...f, name: e.target.value } }))}
                              />
                            </Field>
                            <Field label="分类" style={{ marginBottom: 8 }}>
                              <input
                                style={inputStyle}
                                value={f.category ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, [m.id]: { ...f, category: e.target.value } }))}
                              />
                            </Field>
                            <Field label="品牌" style={{ marginBottom: 8 }}>
                              <input
                                style={inputStyle}
                                value={f.brand ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, [m.id]: { ...f, brand: e.target.value } }))}
                              />
                            </Field>
                            <Field label="规格" style={{ marginBottom: 8 }}>
                              <input
                                style={inputStyle}
                                value={f.spec ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, [m.id]: { ...f, spec: e.target.value } }))}
                              />
                            </Field>
                            <Field label="金额（元）" style={{ marginBottom: 8 }}>
                              <input
                                style={inputStyle}
                                type="number"
                                value={f.price ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, [m.id]: { ...f, price: e.target.value } }))}
                              />
                            </Field>
                            <Field label="数量" style={{ marginBottom: 8 }}>
                              <input
                                style={inputStyle}
                                type="number"
                                value={f.qty ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, [m.id]: { ...f, qty: e.target.value } }))}
                              />
                            </Field>
                            <Field label="单位" style={{ marginBottom: 8 }}>
                              <input
                                style={inputStyle}
                                placeholder="批 / 套 / ㎡"
                                value={f.unit ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, [m.id]: { ...f, unit: e.target.value } }))}
                              />
                            </Field>
                            <Field label="供应商" style={{ marginBottom: 8 }}>
                              <input
                                style={inputStyle}
                                value={f.supplier ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, [m.id]: { ...f, supplier: e.target.value } }))}
                              />
                            </Field>
                            <Field label="计划进场日" style={{ marginBottom: 8 }}>
                              <input
                                style={inputStyle}
                                type="date"
                                value={f.arriveAt ?? ''}
                                onChange={(e) => setForm((s) => ({ ...s, [m.id]: { ...f, arriveAt: e.target.value } }))}
                              />
                            </Field>
                          </div>
                        ) : (
                          <>
                            <div style={{ display: 'flex', gap: 7, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 13.5, fontWeight: 700 }}>{m.name}</span>
                              <Pill tone={STATUS_TONE[m.status]}>{m.status}</Pill>
                              {m.category ? <span style={{ fontSize: 11.5, color: C.ink2 }}>{m.category}</span> : null}
                            </div>
                            <div style={{ fontSize: 11.5, color: C.ink2, marginTop: 5, lineHeight: 1.7 }}>
                              {m.brand ? `${m.brand} · ` : ''}
                              {m.spec ?? ''}
                              {m.price ? ` · ${money(m.price)}` : ''}
                              {m.qty ? ` · ${m.qty}${m.unit ?? ''}` : ''}
                              {m.supplier ? ` · ${m.supplier}` : ''}
                            </div>
                            {m.arriveAt ? (
                              <div
                                style={{
                                  fontSize: 11.5,
                                  fontWeight: 600,
                                  marginTop: 4,
                                  color: arr.tone === 'danger' ? C.danger : arr.tone === 'warn' ? C.warn : C.ink2,
                                }}
                              >
                                计划 {m.arriveAt} · {arr.text}
                              </div>
                            ) : null}
                            {m.note ? (
                              <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 4 }}>{m.note}</div>
                            ) : null}
                          </>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {NEXT_STATUS[m.status] ? (
                          <Btn
                            kind="primary"
                            onClick={() => onSave({ id: m.id, status: NEXT_STATUS[m.status] })}
                            style={{ padding: '5px 11px', fontSize: 12.5 }}
                            title={`推进到「${NEXT_STATUS[m.status]}」`}
                          >
                            <Icon name="arrow" size={12.5} color="#fff" />
                            {NEXT_STATUS[m.status]}
                          </Btn>
                        ) : null}

                        {isEditing ? (
                          <>
                            <Btn kind="primary" onClick={() => submitEdit(m)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                              保存
                            </Btn>
                            <Btn onClick={() => setEditingId(null)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                              取消
                            </Btn>
                          </>
                        ) : (
                          <Btn onClick={() => startEdit(m)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                            编辑
                          </Btn>
                        )}

                        <Btn
                          kind="danger"
                          onClick={() => onDelete(m.id)}
                          style={{ padding: '5px 9px' }}
                          title="删除这条材料"
                        >
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
      ) : null}

      {tracked.length && !materials.length ? (
        <Empty text="还没有登记任何材料。点「登记材料」，从瓷砖、地板、橱柜这些主材开始" />
      ) : null}

      <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 12, lineHeight: 1.8 }}>
        金额在「已下单」之后计入已投入。计划进场日逾期会标红 —— 工地等料是最常见的延期原因。
      </div>

      {/* ---------- 新建材料弹层 ---------- */}
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
              width: narrow ? '100%' : 640,
              maxHeight: narrow ? '92vh' : '86vh',
              overflowY: 'auto',
              borderRadius: narrow ? '14px 14px 0 0' : R.lg,
              padding: narrow ? '18px 16px calc(18px + env(safe-area-inset-bottom))' : '22px 24px',
              boxShadow: '0 12px 40px rgba(0,0,0,.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>登记材料</span>
              <Btn kind="quiet" onClick={() => setCreating(false)} style={{ marginLeft: 'auto', minWidth: 34 }}>
                <Icon name="close" size={14} color={C.ink2} />
              </Btn>
            </div>
            <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 16, lineHeight: 1.7 }}>
              登记后用「推进」按钮一路走到已验收，不用回来改状态。
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
              <Field label="材料名称 *">
                <input
                  style={inputStyle}
                  placeholder="如 客厅地砖"
                  value={draft.name}
                  onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                />
              </Field>
              <Field label="分类">
                <select
                  value={draft.category}
                  onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
                  style={inputStyle}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="品牌">
                <input
                  style={inputStyle}
                  placeholder="如 马可波罗"
                  value={draft.brand}
                  onChange={(e) => setDraft((d) => ({ ...d, brand: e.target.value }))}
                />
              </Field>
              <Field label="规格">
                <input
                  style={inputStyle}
                  placeholder="如 800×800 柔光"
                  value={draft.spec}
                  onChange={(e) => setDraft((d) => ({ ...d, spec: e.target.value }))}
                />
              </Field>
              <Field label="金额（元）">
                <input
                  style={inputStyle}
                  type="number"
                  inputMode="decimal"
                  value={draft.price}
                  onChange={(e) => setDraft((d) => ({ ...d, price: e.target.value }))}
                />
              </Field>
              <Field label="数量">
                <input
                  style={inputStyle}
                  type="number"
                  inputMode="decimal"
                  value={draft.qty}
                  onChange={(e) => setDraft((d) => ({ ...d, qty: e.target.value }))}
                />
              </Field>
              <Field label="单位">
                <input
                  style={inputStyle}
                  placeholder="批 / 套 / ㎡ / 樘"
                  value={draft.unit}
                  onChange={(e) => setDraft((d) => ({ ...d, unit: e.target.value }))}
                />
              </Field>
              <Field label="供应商">
                <input
                  style={inputStyle}
                  placeholder="如 红星美凯龙"
                  value={draft.supplier}
                  onChange={(e) => setDraft((d) => ({ ...d, supplier: e.target.value }))}
                />
              </Field>
              <Field label="计划进场日" hint="留空表示未排期。排了期且逾期会标红。">
                <input
                  style={inputStyle}
                  type="date"
                  value={draft.arriveAt}
                  onChange={(e) => setDraft((d) => ({ ...d, arriveAt: e.target.value }))}
                />
              </Field>
              <Field label="初始状态">
                <select
                  value={draft.status}
                  onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value as MaterialStatus }))}
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

            <Field label="备注">
              <input
                style={inputStyle}
                placeholder="如 需现场复尺，下单前确认损耗"
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
              <Btn kind="primary" onClick={submitCreate} disabled={!draft.projectId || !draft.name.trim()}>
                登记
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}