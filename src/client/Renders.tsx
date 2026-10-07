/**
 * designer-desk · 效果图工坊
 *
 * 不重复造 ComfyUI，只做它不做的两件事：
 *   ① 把项目上下文（风格偏好 / 户型）注入工作流
 *   ② 把出图结果归档回项目
 *
 * 图片按需加载（base64 体积大，不做一次性全量拉取）。
 */
import { useEffect, useState } from 'react'
import { Bar, Btn, C, Empty, Field, Icon, Pill, R, api, cardStyle, inputStyle, useIsNarrow } from './kit'
import type { ProjectView, RenderRecord } from '../types'

export interface RenderJob {
  jobId: string
  renderId: string
  status: 'queued' | 'running' | 'done' | 'failed'
  progress: number
  message: string
  error?: string
}

export interface RendersProps {
  projects: ProjectView[]
  renders: RenderRecord[]
  jobs: RenderJob[]
  comfy: { ok: boolean; host: string; message: string; workflowReady: boolean } | null
  ratios: Record<string, { width: number; height: number; label: string }>
  focusProjectId: string | null
  onClearFocus: () => void
  onSubmit: (params: any) => void
  onDelete: (renderId: string) => void
  onGotoSettings: () => void
}

const SPACES = ['客厅', '餐厅', '主卧', '次卧', '儿童房', '书房', '厨房', '卫生间', '玄关', '阳台', '全屋']
const STYLES = ['现代简约', '奶油风', '新中式', '侘寂风', '法式', '轻奢', '原木风', '工业风', '日式', '美式']
const LIGHTS = ['自然光', '暖光', '冷光', '夜景', '无主灯']

/* ------------------------------------------------------------------ *
 * 按需加载的缩略图
 * ------------------------------------------------------------------ */

function Thumb({
  renderId,
  index,
  auto,
  onZoom,
}: {
  renderId: string
  index: number
  auto: boolean
  onZoom: (url: string) => void
}) {
  const [url, setUrl] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async () => {
    if (url || loading) return
    setLoading(true)
    try {
      const res = await api<{ ok: boolean; dataUrl?: string; error?: string }>(
        `/render/image?renderId=${encodeURIComponent(renderId)}&index=${index}`,
      )
      if (res.ok && res.dataUrl) setUrl(res.dataUrl)
      else setErr(res.error ?? '读取失败')
    } catch (e: any) {
      setErr(e?.message ?? '读取失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (auto) void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, renderId, index])

  if (url) {
    return (
      <img
        src={url}
        alt="效果图"
        onClick={() => onZoom(url)}
        style={{
          width: '100%',
          display: 'block',
          borderRadius: R.sm,
          cursor: 'zoom-in',
          border: `1px solid ${C.line}`,
        }}
      />
    )
  }

  return (
    <div
      style={{
        aspectRatio: '4 / 3',
        borderRadius: R.sm,
        border: `1px dashed ${C.line}`,
        background: '#FCFBF9',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 7,
        padding: 8,
      }}
    >
      {err ? (
        <span style={{ fontSize: 11, color: C.danger, textAlign: 'center', lineHeight: 1.6 }}>{err}</span>
      ) : (
        <Btn onClick={load} disabled={loading} style={{ padding: '4px 10px', fontSize: 12 }}>
          {loading ? '读取中…' : '点击预览'}
        </Btn>
      )}
      <span style={{ fontSize: 10.5, color: C.ink3 }}>{loading ? '' : err ? '' : '图片较大，按需加载'}</span>
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * 主组件
 * ------------------------------------------------------------------ */

export function Renders({
  projects,
  renders,
  jobs,
  comfy,
  ratios,
  focusProjectId,
  onClearFocus,
  onSubmit,
  onDelete,
  onGotoSettings,
}: RendersProps) {
  const narrow = useIsNarrow()
  const [zoom, setZoom] = useState('')
  const [autoLoad, setAutoLoad] = useState(false)

  const [form, setForm] = useState({
    projectId: '',
    space: '客厅',
    style: '',
    materials: '',
    light: '自然光',
    ratio: '16:9',
    count: 1,
    seed: '',
    promptOverride: '',
  })
  const [advanced, setAdvanced] = useState(false)

  // 从项目卡片跳进来时自动带入项目与其风格偏好
  useEffect(() => {
    if (!focusProjectId) return
    const p = projects.find((x) => x.id === focusProjectId)
    if (!p) return
    setForm((f) => ({ ...f, projectId: p.id, style: p.style || f.style }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusProjectId])

  const running = jobs.filter((j) => j.status === 'queued' || j.status === 'running')
  const activeProject = projects.find((p) => p.id === form.projectId)
  const blocked = !comfy?.ok || !comfy?.workflowReady

  const submit = () => {
    onSubmit({
      projectId: form.projectId || undefined,
      projectLabel: activeProject?.name,
      space: form.space,
      style: form.style || activeProject?.style,
      materials: form.materials,
      light: form.light,
      ratio: form.ratio,
      count: Number(form.count) || 1,
      seed: form.seed === '' ? undefined : Number(form.seed),
      promptOverride: form.promptOverride.trim() || undefined,
    })
  }

  return (
    <div>
      {/* ---------- ComfyUI 状态条 ---------- */}
      <div
        style={{
          ...cardStyle,
          marginBottom: 14,
          background: blocked ? C.warnSoft : C.okSoft,
          borderColor: blocked ? '#EFDFB8' : '#D2E3D8',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <Icon name={comfy?.ok ? 'online' : 'offline'} size={15} color={blocked ? C.warn : C.ok} />
        <div style={{ flex: 1, minWidth: 220 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: blocked ? C.warn : C.ok }}>
            ComfyUI {comfy?.ok ? '已连接' : '未连接'}
          </div>
          <div style={{ fontSize: 11.5, color: C.ink2, marginTop: 3, lineHeight: 1.7 }}>
            {comfy?.message ?? '尚未探活'} {comfy?.host ? `· ${comfy.host}` : ''}
          </div>
        </div>
        <Btn onClick={onGotoSettings}>
          <Icon name="settings" size={13} color={C.ink2} />
          去配置
        </Btn>
      </div>

      {blocked ? (
        <div style={{ ...cardStyle, marginBottom: 14, fontSize: 12.5, color: C.ink2, lineHeight: 1.9 }}>
          <b style={{ color: C.ink }}>接入三步：</b>
          <br />
          1. 本机启动 ComfyUI，默认地址 http://127.0.0.1:8188
          <br />
          2. 在 ComfyUI 界面右上角用 <code style={{ background: '#F4F0EA', padding: '1px 6px', borderRadius: 5 }}>Workflow → Export (API)</code> 导出
          <b> API 格式</b>的工作流 JSON（普通 UI 格式会直接提交失败，这是最常见的坑）
          <br />
          3. 到「设置」填写工作流路径 + 节点映射（正向提示词节点 / 种子节点 等）
          <br />
          <span style={{ color: C.ink3 }}>未配置时其余模块完全不受影响，可以正常用今日与项目。</span>
        </div>
      ) : null}

      {/* ---------- 出图参数 ---------- */}
      <div style={{ ...cardStyle, marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="sparkle" size={15} color={C.brand} />
          新建出图
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr 1fr', gap: '0 14px' }}>
          <Field label="关联项目">
            <select
              style={inputStyle}
              value={form.projectId}
              onChange={(e) => {
                const p = projects.find((x) => x.id === e.target.value)
                setForm((f) => ({ ...f, projectId: e.target.value, style: p?.style || f.style }))
              }}
            >
              <option value="">（不关联项目）</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="空间">
            <select style={inputStyle} value={form.space} onChange={(e) => setForm((f) => ({ ...f, space: e.target.value }))}>
              {SPACES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="风格" hint={activeProject?.style ? `已带入项目偏好：${activeProject.style}` : undefined}>
            <input
              style={inputStyle}
              list="dd-styles"
              value={form.style}
              placeholder="如 奶油风"
              onChange={(e) => setForm((f) => ({ ...f, style: e.target.value }))}
            />
            <datalist id="dd-styles">
              {STYLES.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </Field>
          <Field label="光照">
            <select style={inputStyle} value={form.light} onChange={(e) => setForm((f) => ({ ...f, light: e.target.value }))}>
              {LIGHTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="出图比例">
            <select style={inputStyle} value={form.ratio} onChange={(e) => setForm((f) => ({ ...f, ratio: e.target.value }))}>
              {Object.keys(ratios).map((k) => (
                <option key={k} value={k}>
                  {k} · {ratios[k].width}×{ratios[k].height}
                </option>
              ))}
            </select>
          </Field>
          <Field label="张数" hint="1-8，张数越多越慢">
            <input
              style={inputStyle}
              type="number"
              min={1}
              max={8}
              inputMode="numeric"
              value={form.count}
              onChange={(e) => setForm((f) => ({ ...f, count: Number(e.target.value) }))}
            />
          </Field>
        </div>

        <Field label="材质关键词" hint="逗号分隔，如：胡桃木、微水泥、亚麻布艺">
          <input
            style={inputStyle}
            value={form.materials}
            placeholder="胡桃木、微水泥、亚麻布艺"
            onChange={(e) => setForm((f) => ({ ...f, materials: e.target.value }))}
          />
        </Field>

        <Btn kind="quiet" onClick={() => setAdvanced((v) => !v)} style={{ padding: '2px 6px', fontSize: 12 }}>
          {advanced ? '收起高级选项' : '展开高级选项'}
        </Btn>

        {advanced ? (
          <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : '1fr 1fr', gap: '0 14px', marginTop: 10 }}>
            <Field label="种子（留空=随机）">
              <input
                style={inputStyle}
                type="number"
                inputMode="numeric"
                value={form.seed}
                placeholder="固定种子可复现同一张图"
                onChange={(e) => setForm((f) => ({ ...f, seed: e.target.value }))}
              />
            </Field>
            <Field label="覆盖提示词（留空=用模板拼装）" hint="填了就直接用这段，忽略上面的空间/风格/材质">
              <input
                style={inputStyle}
                value={form.promptOverride}
                onChange={(e) => setForm((f) => ({ ...f, promptOverride: e.target.value }))}
              />
            </Field>
          </div>
        ) : null}

        <div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          <Btn kind="primary" disabled={blocked} onClick={submit} style={{ padding: '8px 18px' }}>
            <Icon name="sparkle" size={13} color="#fff" />
            提交出图
          </Btn>
          {focusProjectId ? (
            <Btn kind="quiet" onClick={onClearFocus} style={{ fontSize: 12 }}>
              取消项目带入
            </Btn>
          ) : null}
          <span style={{ fontSize: 11.5, color: C.ink3, marginLeft: 'auto' }}>
            出图是长任务，提交后可继续干活，右侧会显示进度
          </span>
        </div>
      </div>

      {/* ---------- 进行中 ---------- */}
      {running.length ? (
        <div style={{ ...cardStyle, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>进行中 {running.length} 个</div>
          {running.map((j) => (
            <div key={j.jobId} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                <Pill tone="brand">{j.status === 'queued' ? '排队中' : '生成中'}</Pill>
                <span style={{ fontSize: 12.5, color: C.ink2 }}>{j.message}</span>
                <span style={{ fontSize: 12, color: C.ink3, marginLeft: 'auto' }}>{j.progress}%</span>
              </div>
              <Bar value={j.progress} />
            </div>
          ))}
        </div>
      ) : null}

      {/* ---------- 结果墙 ---------- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>结果墙</span>
        <Pill tone="neutral">{renders.length}</Pill>
        <Btn
          kind="quiet"
          onClick={() => setAutoLoad((v) => !v)}
          style={{ fontSize: 12, marginLeft: narrow ? 0 : 'auto' }}
          title="自动加载会一次性拉取全部图片，数据量较大"
        >
          {autoLoad ? '关闭自动预览' : '开启自动预览'}
        </Btn>
      </div>

      {!renders.length ? (
        <Empty text="还没有出图记录。配置好 ComfyUI 后，在上面填参数点「提交出图」" />
      ) : null}

      <div style={{ display: 'grid', gridTemplateColumns: narrow ? '1fr' : 'repeat(3, 1fr)', gap: 12 }}>
        {renders.map((r) => {
          const proj = projects.find((p) => p.id === r.projectId)
          return (
            <div key={r.id} style={{ ...cardStyle, padding: '12px 13px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
                <Pill
                  tone={
                    r.status === 'done' ? 'ok' : r.status === 'failed' ? 'danger' : 'warn'
                  }
                >
                  {r.status === 'done' ? '已完成' : r.status === 'failed' ? '失败' : '进行中'}
                </Pill>
                {proj ? <Pill tone="brand">{proj.name}</Pill> : <Pill tone="neutral">未关联项目</Pill>}
                <Btn
                  kind="quiet"
                  onClick={() => onDelete(r.id)}
                  style={{ marginLeft: 'auto', minWidth: 30, padding: '2px 6px' }}
                  title="删除记录"
                >
                  <Icon name="trash" size={12} color={C.ink3} />
                </Btn>
              </div>

              <div style={{ fontSize: 11.5, color: C.ink2, marginBottom: 9, lineHeight: 1.7 }}>
                {r.space ?? '—'} · {r.style || '—'} · {r.ratio ?? ''} {r.width ? `${r.width}×${r.height}` : ''}
                {r.seed !== undefined ? ` · seed ${r.seed}` : ''}
              </div>

              {r.status === 'failed' && r.error ? (
                <div
                  style={{
                    fontSize: 11.5,
                    color: C.danger,
                    background: C.dangerSoft,
                    padding: '7px 9px',
                    borderRadius: R.sm,
                    marginBottom: 9,
                    lineHeight: 1.7,
                    wordBreak: 'break-word',
                  }}
                >
                  {r.error}
                </div>
              ) : null}

              {r.items?.length ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: r.items.length > 1 ? '1fr 1fr' : '1fr',
                    gap: 8,
                  }}
                >
                  {r.items.map((it, i) => (
                    <Thumb key={`${r.id}-${i}`} renderId={r.id} index={i} auto={autoLoad} onZoom={setZoom} />
                  ))}
                </div>
              ) : null}

              <div
                style={{
                  fontSize: 10.5,
                  color: C.ink3,
                  marginTop: 9,
                  lineHeight: 1.6,
                  maxHeight: 44,
                  overflow: 'hidden',
                }}
                title={r.prompt}
              >
                {r.prompt}
              </div>
              <div style={{ fontSize: 10.5, color: C.ink3, marginTop: 4 }}>
                {String(r.createdAt).slice(0, 19).replace('T', ' ')}
              </div>
            </div>
          )
        })}
      </div>

      {/* ---------- 大图 ---------- */}
      {zoom ? (
        <div
          onClick={() => setZoom('')}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(20,18,16,.86)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 80,
            padding: 20,
            cursor: 'zoom-out',
          }}
        >
          <img src={zoom} alt="效果图大图" style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: R.md }} />
        </div>
      ) : null}
    </div>
  )
}
