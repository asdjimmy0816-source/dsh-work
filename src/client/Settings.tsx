/**
 * designer-desk · 设置面板（注册到 settings 插槽）
 *
 * 这里是 ComfyUI 接入的“唯一配置入口”，也是数据备份的入口。
 * 关键样式全部内联 —— 宿主 CSS 可能覆盖 class。
 */
import { useEffect, useState } from 'react'
import { Btn, C, Field, Icon, Pill, R, api, bytesText, inputStyle, labelStyle, useIsNarrow } from './kit'
import type { DeskConfig } from '../types'

const NODE_LABELS: Record<string, { title: string; hint: string }> = {
  positive: { title: '正向提示词节点', hint: '必填。放你的 KSampler 的 positive 节点（通常是 CLIPTextEncode）' },
  negative: { title: '负向提示词节点', hint: '选填。留空则不改动工作流里的负面词' },
  seed: { title: '种子节点', hint: '选填。填了就每次随机换种子' },
  width: { title: '宽度节点', hint: '选填。不填会自动在节点里找 width 字段' },
  height: { title: '高度节点', hint: '选填。不填会自动在节点里找 height 字段' },
  batch: { title: '批量张数节点', hint: '选填。对应 batch_size' },
  image: { title: '输入图节点', hint: '选填。做图生图 / 参考图时填（暂未启用）' },
}

export function Settings() {
  const narrow = useIsNarrow()
  const [cfg, setCfg] = useState<DeskConfig | null>(null)
  const [storage, setStorage] = useState<{ home: string; bytes: number } | null>(null)
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null)
  const [busy, setBusy] = useState(false)
  const [importText, setImportText] = useState('')

  const flash = (kind: 'ok' | 'err', text: string) => {
    setMsg({ kind, text })
    window.setTimeout(() => setMsg(null), 4000)
  }

  const load = async () => {
    try {
      const res = await api<{ ok: boolean; config: DeskConfig; error?: string }>('/config')
      if (res.ok) setCfg(res.config)
      else flash('err', res.error ?? '读取配置失败')
      const st = await api<any>('/state')
      if (st?.storage) setStorage({ home: st.storage.home, bytes: st.storage.bytes })
    } catch (e: any) {
      flash('err', `读取失败：${e?.message ?? e}`)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const patch = (p: Partial<DeskConfig>) => setCfg((c) => (c ? { ...c, ...p } : c))
  const patchNode = (key: string, field: 'node' | 'input', value: string) =>
    setCfg((c) => {
      if (!c) return c
      const nodeMap: any = { ...c.nodeMap }
      nodeMap[key] = { ...(nodeMap[key] ?? {}), [field]: value }
      return { ...c, nodeMap }
    })

  const save = async () => {
    if (!cfg) return
    setBusy(true)
    try {
      const res = await api<{ ok: boolean; error?: string }>('/config', { method: 'POST', body: { patch: cfg } })
      if (res.ok) flash('ok', '已保存，配置立即生效')
      else flash('err', res.error ?? '保存失败')
    } catch (e: any) {
      flash('err', `保存失败：${e?.message ?? e}`)
    } finally {
      setBusy(false)
    }
  }

  const exportBackup = async () => {
    try {
      const res = await api<{ ok: boolean; file?: string; payload?: any; error?: string }>('/export')
      if (!res.ok) return flash('err', res.error ?? '导出失败')
      // 顺带在浏览器侧也下载一份，双保险
      try {
        const blob = new Blob([JSON.stringify(res.payload)], { type: 'application/json' })
        const a = document.createElement('a')
        a.href = URL.createObjectURL(blob)
        a.download = `designer-desk-backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(a.href)
      } catch {
        /* 浏览器下载失败不影响本地文件 */
      }
      flash('ok', `已导出：${res.file}`)
    } catch (e: any) {
      flash('err', `导出失败：${e?.message ?? e}`)
    }
  }

  const importBackup = async () => {
    if (!importText.trim()) return flash('err', '请先粘贴备份 JSON 内容')
    if (!window.confirm('导入会覆盖当前全部数据，确定继续？')) return
    setBusy(true)
    try {
      const res = await api<{ ok: boolean; error?: string }>('/import', { method: 'POST', body: { text: importText } })
      if (res.ok) {
        setImportText('')
        flash('ok', '导入完成')
        await load()
      } else flash('err', res.error ?? '导入失败')
    } catch (e: any) {
      flash('err', `导入失败：${e?.message ?? e}`)
    } finally {
      setBusy(false)
    }
  }

  const clearDemo = async () => {
    if (!window.confirm('这会清空全部客户 / 项目 / 待办 / 出图记录，且不可撤销。建议先导出备份。确定继续？')) return
    if (!window.confirm('二次确认：真的要清空吗？')) return
    setBusy(true)
    try {
      const res = await api<{ ok: boolean }>('/seed/clear', { method: 'POST', body: {} })
      if (res.ok) flash('ok', '已清空')
      else flash('err', '清空失败')
    } finally {
      setBusy(false)
    }
  }

  const reseed = async () => {
    setBusy(true)
    try {
      const res = await api<{ ok: boolean }>('/seed/demo', { method: 'POST', body: {} })
      if (res.ok) flash('ok', '已载入示例数据（5 个客户 / 5 个项目 / 6 条待办，含 1 条逾期）')
    } finally {
      setBusy(false)
    }
  }

  if (!cfg) {
    return <div style={{ padding: 14, fontSize: 13, color: C.ink2 }}>读取配置中…</div>
  }

  const grid2: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: narrow ? '1fr' : '1fr 1fr',
    gap: '0 14px',
  }

  return (
    <div style={{ padding: '4px 2px', fontFamily: 'inherit' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
        <Icon name="settings" size={16} color={C.brand} />
        <span style={{ fontSize: 15, fontWeight: 700 }}>设计台</span>
        <Pill tone="neutral">v0.1.0</Pill>
        <Btn kind="primary" disabled={busy} onClick={save} style={{ marginLeft: 'auto' }}>
          {busy ? '处理中…' : '保存配置'}
        </Btn>
      </div>

      {msg ? (
        <div
          style={{
            marginBottom: 14,
            padding: '9px 12px',
            borderRadius: R.sm,
            fontSize: 12.5,
            background: msg.kind === 'ok' ? C.okSoft : C.dangerSoft,
            color: msg.kind === 'ok' ? C.ok : C.danger,
            border: `1px solid ${msg.kind === 'ok' ? '#D2E3D8' : '#EFCFC8'}`,
            wordBreak: 'break-word',
            lineHeight: 1.7,
          }}
        >
          {msg.text}
        </div>
      ) : null}

      {/* ---------- ComfyUI ---------- */}
      <div style={labelStyle}>ComfyUI 接入</div>
      <div style={grid2}>
        <Field label="ComfyUI 地址">
          <input style={inputStyle} value={cfg.comfyHost} onChange={(e) => patch({ comfyHost: e.target.value })} />
        </Field>
        <Field label="ComfyUI 输出目录" hint="ComfyUI 的 output 目录，用于把出图拷回归档；留空则直接走 /view 代理显示">
          <input
            style={inputStyle}
            value={cfg.comfyOutputDir}
            placeholder="/Users/you/ComfyUI/output"
            onChange={(e) => patch({ comfyOutputDir: e.target.value })}
          />
        </Field>
      </div>
      <Field
        label="工作流文件路径（必须是 API 格式 JSON）"
        hint="ComfyUI 界面右上角 Workflow → Export (API) 导出。普通 UI 格式会直接提交失败。"
      >
        <input
          style={inputStyle}
          value={cfg.workflowPath}
          placeholder="/Users/you/ComfyUI/user/default/workflows/interior_api.json"
          onChange={(e) => patch({ workflowPath: e.target.value })}
        />
      </Field>

      {/* ---------- 节点映射 ---------- */}
      <div style={{ ...labelStyle, marginTop: 18 }}>节点映射</div>
      <div style={{ fontSize: 11.5, color: C.ink3, marginBottom: 10, lineHeight: 1.8 }}>
        「节点 ID」是 ComfyUI 里节点标题栏上的数字（如 <code style={{ background: '#F4F0EA', padding: '1px 5px', borderRadius: 4 }}>KSampler #3</code> → 填 3）；「输入字段」是该节点上输入口的名字，常见为 text / seed / width / height / batch_size。
      </div>
      <div style={{ display: 'grid', gap: 10 }}>
        {Object.keys(NODE_LABELS).map((key) => {
          const slot = (cfg.nodeMap as any)?.[key] ?? { node: '', input: '' }
          return (
            <div key={key} style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: '1 1 170px', minWidth: 150 }}>
                <label style={labelStyle}>{NODE_LABELS[key].title}</label>
                <input
                  style={inputStyle}
                  value={slot.node ?? ''}
                  placeholder="节点 ID"
                  onChange={(e) => patchNode(key, 'node', e.target.value)}
                />
              </div>
              <div style={{ flex: '1 1 130px', minWidth: 110 }}>
                <label style={labelStyle}>输入字段</label>
                <input
                  style={inputStyle}
                  value={slot.input ?? ''}
                  placeholder="如 text"
                  onChange={(e) => patchNode(key, 'input', e.target.value)}
                />
              </div>
              <div style={{ flex: '2 1 220px', fontSize: 11.5, color: C.ink3, paddingBottom: 10, lineHeight: 1.6 }}>
                {NODE_LABELS[key].hint}
              </div>
            </div>
          )
        })}
      </div>

      {/* ---------- 提示词 ---------- */}
      <div style={{ ...labelStyle, marginTop: 18 }}>提示词模板</div>
      <Field
        label="正向模板"
        hint="可用占位符：{space} 空间、{style} 风格、{materials} 材质、{light} 光照。出图时自动替换。"
      >
        <textarea
          style={{ ...inputStyle, minHeight: 76, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5, lineHeight: 1.7 }}
          value={cfg.promptTemplate}
          onChange={(e) => patch({ promptTemplate: e.target.value })}
        />
      </Field>
      <Field label="负向提示词">
        <textarea
          style={{ ...inputStyle, minHeight: 56, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12.5, lineHeight: 1.7 }}
          value={cfg.negativePrompt}
          onChange={(e) => patch({ negativePrompt: e.target.value })}
        />
      </Field>

      {/* ---------- 提醒 ---------- */}
      <div style={{ ...labelStyle, marginTop: 18 }}>提醒与巡检</div>
      <div style={grid2}>
        <Field label="每日摘要时间" hint="到点会把「今日待处理」写进日志与状态栏，靠「打开就看见」等价于提醒">
          <input
            style={inputStyle}
            type="time"
            value={cfg.summaryAt}
            onChange={(e) => patch({ summaryAt: e.target.value })}
          />
        </Field>
        <Field label="沉默项目判定天数" hint="报价 / 方案设计阶段超过这么多天没动静，就在今日页提示唤醒">
          <input
            style={inputStyle}
            type="number"
            min={1}
            inputMode="numeric"
            value={cfg.silentDays}
            onChange={(e) => patch({ silentDays: Number(e.target.value) || 5 })}
          />
        </Field>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, marginBottom: 6, cursor: 'pointer', minHeight: 44 }}>
        <input type="checkbox" checked={cfg.summaryEnabled} onChange={(e) => patch({ summaryEnabled: e.target.checked })} />
        启用每日摘要
      </label>

      {/* ---------- 数据 ---------- */}
      <div style={{ ...labelStyle, marginTop: 18 }}>数据与备份</div>
      <div style={{ fontSize: 11.5, color: C.ink2, marginBottom: 10, lineHeight: 1.8 }}>
        数据全部存在本机，不上传任何服务器。每次写入前会自动滚动备份到 data.bak.json。
        <br />
        目录：<code style={{ background: '#F4F0EA', padding: '1px 5px', borderRadius: 4 }}>{storage?.home ?? '—'}</code>
        {storage ? ` · 当前 ${bytesText(storage.bytes)}` : ''}
        <br />
        想换目录：设置环境变量 <code style={{ background: '#F4F0EA', padding: '1px 5px', borderRadius: 4 }}>DESIGNER_DESK_HOME</code> 后重启。
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Btn onClick={exportBackup}>
          <Icon name="download" size={13} color={C.ink2} />
          导出 JSON 备份
        </Btn>
        <Btn onClick={reseed} disabled={busy}>
          载入示例数据
        </Btn>
        <Btn kind="danger" onClick={clearDemo} disabled={busy}>
          清空全部数据
        </Btn>
      </div>

      <Field label="导入恢复（粘贴备份 JSON）" hint="会覆盖当前全部数据，需二次确认">
        <textarea
          style={{ ...inputStyle, minHeight: 60, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 12 }}
          value={importText}
          placeholder='{"kind":"designer-desk-backup", ...}'
          onChange={(e) => setImportText(e.target.value)}
        />
      </Field>
      <Btn onClick={importBackup} disabled={busy || !importText.trim()}>
        <Icon name="upload" size={13} color={C.ink2} />
        导入恢复
      </Btn>

      <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 16, lineHeight: 1.8, borderTop: `1px solid ${C.line}`, paddingTop: 12 }}>
        关于第 2-5 期模块（工地巡检 / 材料进场 / 灵感素材库 / 报价与合同 / 选材库 / PPT 助手 / 公众号日更 / 小说台 / 数字生活角），
        数据表结构已经预留，后续按「每期 ≤3 个模块」逐步加，不会丢现有数据。
      </div>
    </div>
  )
}
