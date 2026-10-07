/**
 * designer-desk · 今日作战台
 *
 * 铁律 5：置顶「今天要处理」。逾期标红 + 一键处理；昨天没做完的自动滚到今天。
 * 纯展示组件 —— 所有动作通过 props 回调交给顶层，自身不发请求（铁律 9）。
 */
import { Btn, C, Empty, Icon, Pill, R, cardStyle, useIsNarrow } from './kit'
import type { Buckets, ProjectView, Task } from '../types'

export interface TodayProps {
  buckets: Buckets
  projects: ProjectView[]
  today: string
  onToggle: (id: string, done: boolean) => void
  onPostpone: (id: string, days: number) => void
  onDelete: (id: string) => void
  onWake: (projectId: string) => void
  onOpenProject: (projectId: string) => void
}

interface ZoneProps {
  title: string
  dot: string
  count: number
  hint?: string
  children: React.ReactNode
}

function Zone({ title, dot, count, hint, children }: ZoneProps) {
  return (
    <div style={{ ...cardStyle, marginBottom: 12, padding: '14px 16px' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: count ? 10 : 0,
          flexWrap: 'wrap',
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: 999, background: dot, flex: 'none' }} />
        <span style={{ fontSize: 13.5, fontWeight: 700 }}>{title}</span>
        <Pill tone="neutral">{count}</Pill>
        {hint ? <span style={{ fontSize: 11.5, color: C.ink3 }}>{hint}</span> : null}
      </div>
      {count ? children : <div style={{ fontSize: 12.5, color: C.ink3 }}>没有内容，挺好</div>}
    </div>
  )
}

function TaskRow({
  task,
  projectName,
  tone,
  narrow,
  onToggle,
  onPostpone,
  onDelete,
  onOpenProject,
}: {
  task: Task
  projectName?: string
  tone: 'danger' | 'warn' | 'neutral'
  narrow: boolean
  onToggle: () => void
  onPostpone: (days: number) => void
  onDelete: () => void
  onOpenProject?: () => void
}) {
  const toneColor = tone === 'danger' ? C.danger : tone === 'warn' ? C.warn : C.ink2
  const due = task.dueAt ?? '未定日期'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: narrow ? 'flex-start' : 'center',
        flexDirection: narrow ? 'column' : 'row',
        gap: narrow ? 8 : 10,
        padding: narrow ? '11px 0' : '9px 0',
        borderTop: `1px solid ${C.lineSoft}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, width: narrow ? '100%' : 'auto' }}>
        <button
          type="button"
          onClick={onToggle}
          title="标记完成"
          style={{
            width: 22,
            height: 22,
            flex: 'none',
            borderRadius: 6,
            border: `1.5px solid ${C.line}`,
            background: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="check" size={13} color="transparent" />
        </button>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              color: C.ink,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: narrow ? 'normal' : 'nowrap',
            }}
          >
            {task.title}
          </div>
          <div style={{ fontSize: 11.5, color: C.ink2, display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 3 }}>
            <span style={{ color: toneColor, fontWeight: 600 }}>{due}</span>
            {task.type ? <span>· {task.type}</span> : null}
            {projectName ? (
              <span
                onClick={onOpenProject}
                style={{ cursor: onOpenProject ? 'pointer' : 'default', textDecoration: onOpenProject ? 'underline' : 'none' }}
              >
                · {projectName}
              </span>
            ) : null}
            {task.priority ? <span>· {task.priority}</span> : null}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', width: narrow ? '100%' : 'auto' }}>
        <Btn kind="primary" onClick={onToggle} style={{ padding: '5px 11px', fontSize: 12.5 }}>
          完成
        </Btn>
        <Btn onClick={() => onPostpone(1)} title="顺延到明天" style={{ padding: '5px 11px', fontSize: 12.5 }}>
          明天
        </Btn>
        <Btn onClick={() => onPostpone(3)} title="顺延三天" style={{ padding: '5px 11px', fontSize: 12.5 }}>
          三天后
        </Btn>
        <Btn kind="danger" onClick={onDelete} title="删除" style={{ padding: '5px 9px', fontSize: 12.5 }}>
          <Icon name="trash" size={12.5} color={C.danger} />
        </Btn>
      </div>
    </div>
  )
}

export function Today({
  buckets,
  projects,
  today,
  onToggle,
  onPostpone,
  onDelete,
  onWake,
  onOpenProject,
}: TodayProps) {
  const narrow = useIsNarrow()
  const nameOf = (projectId?: string) =>
    projectId ? projects.find((p) => p.id === projectId)?.name : undefined

  const total = buckets.overdue.length + buckets.today.length

  return (
    <div>
      <div
        style={{
          ...cardStyle,
          marginBottom: 14,
          background: total ? C.brandSoft : C.okSoft,
          border: `1px solid ${total ? '#EBD9CF' : '#D2E3D8'}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
          <Icon name="today" size={17} color={total ? C.brand : C.ok} />
          <span style={{ fontSize: 15, fontWeight: 700, color: total ? C.brand : C.ok }}>
            今天要处理 {total} 项
          </span>
          <span style={{ fontSize: 12.5, color: C.ink2 }}>
            {today} · 逾期 {buckets.overdue.length} · 今天 {buckets.today.length} · 三天内{' '}
            {buckets.soon.length}
          </span>
        </div>
      </div>

      <Zone title="逾期" dot={C.danger} count={buckets.overdue.length} hint="昨天没做完的自动滚到这里，不会消失">
        {buckets.overdue.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            tone="danger"
            narrow={narrow}
            projectName={nameOf(t.projectId)}
            onToggle={() => onToggle(t.id, true)}
            onPostpone={(d) => onPostpone(t.id, d)}
            onDelete={() => onDelete(t.id)}
            onOpenProject={t.projectId ? () => onOpenProject(t.projectId!) : undefined}
          />
        ))}
      </Zone>

      <Zone title="今天" dot={C.warn} count={buckets.today.length}>
        {buckets.today.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            tone="warn"
            narrow={narrow}
            projectName={nameOf(t.projectId)}
            onToggle={() => onToggle(t.id, true)}
            onPostpone={(d) => onPostpone(t.id, d)}
            onDelete={() => onDelete(t.id)}
            onOpenProject={t.projectId ? () => onOpenProject(t.projectId!) : undefined}
          />
        ))}
      </Zone>

      <Zone title="三天内" dot={C.ok} count={buckets.soon.length} hint="提前看到，避免突然爆雷">
        {buckets.soon.map((t) => (
          <TaskRow
            key={t.id}
            task={t}
            tone="neutral"
            narrow={narrow}
            projectName={nameOf(t.projectId)}
            onToggle={() => onToggle(t.id, true)}
            onPostpone={(d) => onPostpone(t.id, d)}
            onDelete={() => onDelete(t.id)}
            onOpenProject={t.projectId ? () => onOpenProject(t.projectId!) : undefined}
          />
        ))}
      </Zone>

      <Zone title="沉默项目唤醒" dot={C.brand} count={buckets.silent.length} hint="方案 / 报价阶段太久没动静">
        {buckets.silent.map((p) => (
          <div
            key={p.id}
            style={{
              display: 'flex',
              alignItems: narrow ? 'flex-start' : 'center',
              flexDirection: narrow ? 'column' : 'row',
              gap: 9,
              padding: '9px 0',
              borderTop: `1px solid ${C.lineSoft}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: C.ink2, marginTop: 3 }}>
                {p.customerName} · {p.stageName} · 上次动静{' '}
                {p.updatedAt ? p.updatedAt.slice(0, 10) : '—'}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn kind="primary" onClick={() => onWake(p.id)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                <Icon name="wake" size={12.5} color="#fff" />
                生成跟进待办
              </Btn>
              <Btn onClick={() => onOpenProject(p.id)} style={{ padding: '5px 11px', fontSize: 12.5 }}>
                看详情
              </Btn>
            </div>
          </div>
        ))}
      </Zone>

      {buckets.noDate.length ? (
        <Zone title="挂着但没定日期" dot={C.ink3} count={buckets.noDate.length} hint="建议给个日子，否则容易被忘掉">
          {buckets.noDate.map((t) => (
            <TaskRow
              key={t.id}
              task={t}
              tone="neutral"
              narrow={narrow}
              projectName={nameOf(t.projectId)}
              onToggle={() => onToggle(t.id, true)}
              onPostpone={(d) => onPostpone(t.id, d)}
              onDelete={() => onDelete(t.id)}
              onOpenProject={t.projectId ? () => onOpenProject(t.projectId!) : undefined}
            />
          ))}
        </Zone>
      ) : null}

      {!projects.length ? (
        <Empty text="还没有项目 —— 去「项目」页点「新建项目」建档，或到设置里重新载入示例数据" />
      ) : null}

      <div style={{ fontSize: 11.5, color: C.ink3, marginTop: 4, lineHeight: 1.8 }}>
        逾期项与今天项每天自动重算；顺延会保留原始日期，方便回看这个客户被推了几次。
      </div>
    </div>
  )
}
