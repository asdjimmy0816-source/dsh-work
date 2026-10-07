/**
 * designer-desk · 灵感素材库（M6）
 *
 * 收集小红书 / Pinterest / 好好住 / houzz 等来源的参考图，按标签和评分检索，
 * 可挂到具体项目上 —— 汇报 PPT 和选材沟通时直接翻这里。
 *
 * 铁律 9：纯展示 + 本地表单状态，所有写操作通过 props 回调交给顶层（自身不发请求）。
 */
import { useMemo, useState } from 'react'
import { Btn, C, Empty, Field, Icon, Pill, R, cardStyle, inputStyle, useIsNarrow } from './kit'
import type { ProjectView, RefImage } from '../types'

export interface RefImagesProps {
  projects: ProjectView[]
  refimages: RefImage[]
  onSave: (refimage: any) => void
  onDelete: (id: string) => void
}

const SOURCES = ['小红书', 'Pinterest', '好好住', 'houzz', '站酷', 'Google', '其他']

const BLANK = {
  title: '',
  url: '',
  thumb: '',
  tags: '',
  score: 4,
  source: '小红书',
  projectId: '',
}

type SortKey = 'new' | 'score' | 'title'

export function RefImages({ projects, refimages, onSave, onDelete }: RefImagesProps) {
  const narrow = useIsNarrow()
  const [tagFilter, setTagFilter] = useState<string>('all')
  const [sort, setSort] = useState<SortKey>('new')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ ...BLANK })
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<Record<string, any>>({})

  /** 所有出现过的标签，按出现次数降序 —— 常用标签排前面 */
  const allTags = useMemo(() => {
    const counter = new Map<string, number>()
    for (const r of refimages) {
      for (const t of r.tags ?? []) counter.set(t, (counter.get(t) ?? 0) + 1)
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t)
  }, [refimages])

  const nameOf = (pid?: string) => projects.find((p) => p.id === pid)?.name

  const visible = useMemo(() => {
    let list = tagFilter === 'all' ? [...refimages] : refimages.filter((r) => (r.tags ?? []).includes(tagFilter))
    if (sort === 'score') list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    else if (sort === 'title') list.sort((a, b) => String(a.title ?? '').localeCompare(String(b.title ?? ''), 'zh-CN'))
    else list.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')))
    return list
  }, [refimages, tagFilter, sort])

  const topRated = useMemo(() => refimages.filter((r) => (r.score ?? 0) >= 5).length, [refimages])

  const startEdit = (r: RefImage) => {
    setEditingId(r.id)
    setForm({
      title: r.title ?? '',
      url: r.url ?? '',
      thumb: r.thumb ?? '',
      tags: (r.tags ?? []).join('，'),
      score: r.score ?? 3,
      source: r.source ?? '',
      projectId: r.projectId ?? '',
    })
  }

  const submitEdit = (r: RefImage) => {
    const f = form[r.id] ?? {}
    onSave({
      id: r.id,
      title: f.title ?? '',
      url: f.url ?? '',
      thumb: f.thumb ?? '',
      // 逗号 / 空格分隔，后端会再 split 一次
      tags: String(f.tags ?? '')
        .split(/[,，\s]+/)
        .map((t: string) => t.trim())
        .filter(Boolean),
      score: Number(f.score) || 3,
      source: f.source ?? '',
      projectId: f.projectId || undefined,
    })
    setEditingId(null)
  }

  const submitCreate = () => {
    if (!draft.title.trim() && !draft.url.trim()) return
    onSave({
      title: draft.title.trim() || draft.url.trim(),
      url: draft.url.trim(),
      thumb: draft.thumb.trim(),
      tags: draft.tags,
      score: draft.score,
      source: draft.source,
      projectId: draft.projectId || undefined,
    })
    setDraft({ ...BLANK })
    setCreating(false)
  }

  /** 缩略图：有图用图，没图用来源首字占位 —— 永远不留破图 */
  const thumbOf = (r: RefImage): string => r.thumb || r.url || ''

  return (
    <div>
      {/* ---------- 工具条 ---------- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        <Btn kind="primary" onClick={() => setCreating(true)}>
          <Icon name="plus" size={13} color="#fff" />
          收藏参考图
        </Btn>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          style={{ ...inputStyle, width: narrow ? '100%' : 150, fontSize: 13, padding: '7px 10px' }}
        >
          <option value="new">最新收藏</option>
          <option value="score">评分优先</option>
          <option value="title">按标题</option>
        </select>

        <div style={{ display: 'flex', gap: 6, marginLeft: narrow ? 0 : 'auto', flexWrap: 'wrap', alignItems: 'center' }}>
          <Pill tone="neutral">共 {refimages.length} 张</Pill>
          {topRated ? <Pill tone="ok">5 星 {topRated}</Pill> : null}
        </div>
      </div>

      {/* ---------- 标签筛选 ---------- */}
      {allTags.length ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setTagFilter('all')}
            style={{
              padding: '4px 11px',
              borderRadius: R.pill,
              border: `1px solid ${tagFilter === 'all' ? C.brand : C.line}`,
              background: tagFilter === 'all' ? C.brand : '#fff',
              color: tagFilter === 'all' ? '#fff' : C.ink2,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            全部
          </button>
          {allTags.map((t) => {
            const active = tagFilter === t
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTagFilter(active ? 'all' : t)}
                style={{
                  padding: '4px 11px',
                  borderRadius: R.pill,
                  border: `1px solid ${active ? C.brand : C.line}`,
                  background: active ? C.brand : '#fff',
                  color: active ? '#fff' : C.ink2,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {t}
              </button>
            )
          })}
        </div>
      ) : null}

      {!refimages.length ? (
        <Empty text="还没有收藏参考图。看到喜欢的方案就存进来，标上标签和评分，汇报 PPT 时直接翻这里" />
      ) : !visible.length ? (
        <Empty text={`没有带「${tagFilter}」标签的图`} />
      ) : null}

      {/* ---------- 卡片网格 ---------- */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: narrow ? '1fr' : 'repeat(auto-fill, minmax(212px, 1fr))',
          gap: 12,
        }}
      >
        {visible.map((r) => {
          const isEditing = editingId === r.id
          const f = isEditing ? (form[r.id] ?? {}) : null
          const thumb = thumbOf(r)
          const projName = nameOf(r.projectId)
          return (
            <div
              key={r.id}
              style={{
                ...cardStyle,
                padding: 0,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* 缩略图区 */}
              {isEditing ? (
                <div style={{ padding: '12px 14px 0' }}>
                  <Field label="图片地址" hint="填了就直接当缩略图用；留空则显示占位块">
                    <input
                      style={inputStyle}
                      placeholder="https://…"
                      value={f.thumb ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, [r.id]: { ...f, thumb: e.target.value } }))}
                    />
                  </Field>
                </div>
              ) : thumb ? (
                <a href={r.url || thumb} target="_blank" rel="noreferrer" style={{ display: 'block' }}>
                  <img
                    src={thumb}
                    alt={r.title ?? '参考图'}
                    loading="lazy"
                    style={{ width: '100%', height: 138, objectFit: 'cover', display: 'block', background: '#F4F0EA' }}
                    onError={(e) => {
                      // 外链图挂了就退化成占位块，不留破图
                      ;(e.currentTarget as HTMLImageElement).style.display = 'none'
                    }}
                  />
                </a>
              ) : (
                <div
                  style={{
                    height: 92,
                    background: '#F1EDE7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon name="gallery" size={22} color={C.ink3} />
                </div>
              )}

              <div style={{ padding: '11px 14px 13px', display: 'flex', flexDirection: 'column', gap: 7, flex: 1 }}>
                {isEditing ? (
                  <>
                    <input
                      style={inputStyle}
                      placeholder="标题"
                      value={f.title ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, [r.id]: { ...f, title: e.target.value } }))}
                    />
                    <input
                      style={inputStyle}
                      placeholder="原图链接"
                      value={f.url ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, [r.id]: { ...f, url: e.target.value } }))}
                    />
                    <input
                      style={inputStyle}
                      placeholder="标签，逗号分隔"
                      value={f.tags ?? ''}
                      onChange={(e) => setForm((s) => ({ ...s, [r.id]: { ...f, tags: e.target.value } }))}
                    />
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <select
                        style={inputStyle}
                        value={f.source ?? ''}
                        onChange={(e) => setForm((s) => ({ ...s, [r.id]: { ...f, source: e.target.value } }))}
                      >
                        <option value="">来源</option>
                        {SOURCES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <select
                        style={inputStyle}
                        value={f.projectId ?? ''}
                        onChange={(e) => setForm((s) => ({ ...s, [r.id]: { ...f, projectId: e.target.value } }))}
                      >
                        <option value="">不挂项目</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 11.5, color: C.ink2, flex: 'none' }}>评分</span>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setForm((s) => ({ ...s, [r.id]: { ...f, score: n } }))}
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 5,
                            border: `1px solid ${C.line}`,
                            background: n <= (Number(f.score) || 0) ? C.brandSoft : '#fff',
                            color: n <= (Number(f.score) || 0) ? C.brand : C.ink3,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>{r.title || '未命名'}</div>

                    {/* 评分：实心方块，不用 emoji */}
                    <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span
                          key={n}
                          style={{
                            width: 11,
                            height: 11,
                            borderRadius: 3,
                            background: n <= (r.score ?? 0) ? C.brand : C.lineSoft,
                            border: `1px solid ${n <= (r.score ?? 0) ? C.brand : C.line}`,
                          }}
                        />
                      ))}
                      <span style={{ fontSize: 11, color: C.ink3, marginLeft: 3 }}>{r.score ?? 0} 分</span>
                    </div>

                    {(r.tags ?? []).length ? (
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                        {(r.tags ?? []).map((t) => (
                          <span
                            key={t}
                            onClick={() => setTagFilter(t)}
                            style={{
                              fontSize: 11,
                              color: C.ink2,
                              background: '#F4F0EA',
                              padding: '2px 7px',
                              borderRadius: R.pill,
                              cursor: 'pointer',
                            }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div style={{ fontSize: 11, color: C.ink3, lineHeight: 1.6 }}>
                      {r.source ? `${r.source} · ` : ''}
                      {String(r.createdAt ?? '').slice(0, 10)}
                    </div>

                    {projName ? (
                      <div style={{ fontSize: 11, color: C.brand, fontWeight: 600 }}>挂在 {projName}</div>
                    ) : null}
                  </>
                )}

                <div style={{ display: 'flex', gap: 6, marginTop: 'auto', paddingTop: 4 }}>
                  {isEditing ? (
                    <>
                      <Btn kind="primary" onClick={() => submitEdit(r)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                        保存
                      </Btn>
                      <Btn onClick={() => setEditingId(null)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                        取消
                      </Btn>
                    </>
                  ) : (
                    <>
                      <Btn onClick={() => startEdit(r)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                        编辑
                      </Btn>
                      {r.url ? (
                        <a href={r.url} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                          <Btn style={{ padding: '5px 11px', fontSize: 12.5 }} title="打开原图">
                            <Icon name="arrow" size={12.5} color={C.ink2} />
                            原图
                          </Btn>
                        </a>
                      ) : null}
                      <Btn kind="danger" onClick={() => onDelete(r.id)} style={{ padding: '5px 9px', marginLeft: 'auto' }}>
                        <Icon name="trash" size={12.5} color={C.danger} />
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 12, lineHeight: 1.8 }}>
        标签用逗号分隔。点标签按标签筛选，点卡片上的「原图」跳回来源页面。图片挂了就退化成占位块，不会留破图。
      </div>

      {/* ---------- 收藏弹层 ---------- */}
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
              width: narrow ? '100%' : 560,
              maxHeight: narrow ? '92vh' : '86vh',
              overflowY: 'auto',
              borderRadius: narrow ? '14px 14px 0 0' : R.lg,
              padding: narrow ? '18px 16px calc(18px + env(safe-area-inset-bottom))' : '22px 24px',
              boxShadow: '0 12px 40px rgba(0,0,0,.18)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 16, fontWeight: 700 }}>收藏参考图</span>
              <Btn kind="quiet" onClick={() => setCreating(false)} style={{ marginLeft: 'auto', minWidth: 34 }}>
                <Icon name="close" size={14} color={C.ink2} />
              </Btn>
            </div>
            <div style={{ fontSize: 12.5, color: C.ink2, marginBottom: 16, lineHeight: 1.7 }}>
              把小红书 / 好好住看到的图存进来。填了图片地址就能看到缩略图，只填链接则显示占位块。
            </div>

            <Field label="标题 *">
              <input
                style={inputStyle}
                placeholder="如 奶油风客厅 · 沙发背景墙"
                value={draft.title}
                onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              />
            </Field>

            <Field label="原图链接" hint="点击卡片上的「原图」按钮会跳到这里">
              <input
                style={inputStyle}
                placeholder="https://…"
                value={draft.url}
                onChange={(e) => setDraft((d) => ({ ...d, url: e.target.value }))}
              />
            </Field>

            <Field label="缩略图地址" hint="可留空。留空时若填了原图链接，会直接拿原图当缩略图">
              <input
                style={inputStyle}
                placeholder="https://…（可留空）"
                value={draft.thumb}
                onChange={(e) => setDraft((d) => ({ ...d, thumb: e.target.value }))}
              />
            </Field>

            <Field label="标签" hint="逗号分隔，如：奶油风, 客厅, 沙发背景墙">
              <input
                style={inputStyle}
                value={draft.tags}
                onChange={(e) => setDraft((d) => ({ ...d, tags: e.target.value }))}
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: '0 14px' }}>
              <Field label="来源">
                <select
                  value={draft.source}
                  onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
                  style={inputStyle}
                >
                  {SOURCES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="挂到项目" hint="汇报 PPT 时按项目筛参考图">
                <select
                  value={draft.projectId}
                  onChange={(e) => setDraft((d) => ({ ...d, projectId: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">不挂项目</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="评分" hint="5 分 = 值得照着做；3 分 = 一般">
              <div style={{ display: 'flex', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setDraft((d) => ({ ...d, score: n }))}
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: R.sm,
                      border: `1px solid ${n <= draft.score ? C.brand : C.line}`,
                      background: n <= draft.score ? C.brandSoft : '#fff',
                      color: n <= draft.score ? C.brand : C.ink3,
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
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
              <Btn kind="primary" onClick={submitCreate} disabled={!draft.title.trim() && !draft.url.trim()}>
                收藏
              </Btn>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}