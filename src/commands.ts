/**
 * designer-desk · 命令与工具
 *
 * 命令名统一以包名做前缀（designer-desk.xxx），避免与其他插件冲突。
 * 所有注册都在 ctx.effect() 内完成，卸载时随 effect 一起清理。
 */
import { addDaysStr, nowIso, stageDef, todayStr, uid } from './types'
import type { Project, Task } from './types'
import { computeBuckets, advanceProject, toProjectViews } from './derive'
import { DESK_HOME, loadConfig, loadDB, mutate } from './store'
import { comfyStatus, submitRender } from './comfy'

type Ctx = any

function line(s = ''): string {
  return s
}

function fmtTask(t: Task, prefix: string): string {
  const due = t.dueAt ?? '未定日期'
  return `${prefix} ${t.title}  ·  ${due}${t.priority ? `  ·  ${t.priority}` : ''}`
}

/* ------------------------------------------------------------------ *
 * 今日摘要文本（命令与定时任务共用）
 * ------------------------------------------------------------------ */

export async function renderTodayText(): Promise<string> {
  const db = await loadDB()
  const cfg = await loadConfig()
  const b = computeBuckets(db, cfg.silentDays)
  const d = todayStr()

  const out: string[] = []
  out.push(`📋 设计台 · 今日待处理（${d}）`)
  out.push(line())
  out.push(`🔴 逾期 ${b.overdue.length} 项`)
  for (const t of b.overdue.slice(0, 8)) out.push(fmtTask(t, '   ·'))
  if (!b.overdue.length) out.push('   （无）')
  out.push(line())
  out.push(`🟠 今天 ${b.today.length} 项`)
  for (const t of b.today.slice(0, 8)) out.push(fmtTask(t, '   ·'))
  if (!b.today.length) out.push('   （无）')
  out.push(line())
  out.push(`🟡 三天内 ${b.soon.length} 项`)
  for (const t of b.soon.slice(0, 6)) out.push(fmtTask(t, '   ·'))
  if (!b.soon.length) out.push('   （无）')
  if (b.noDate.length) {
    out.push(line())
    out.push(`⚪ 挂着没定日期 ${b.noDate.length} 项`)
    for (const t of b.noDate.slice(0, 6)) out.push(fmtTask(t, '   ·'))
  }
  if (b.silent.length) {
    out.push(line())
    out.push(`💤 沉默项目 ${b.silent.length} 个（报价 / 方案阶段超过 ${cfg.silentDays} 天没动静）`)
    for (const p of b.silent.slice(0, 6)) out.push(`   · ${p.name} — ${p.stageName}，客户 ${p.customerName}`)
  }
  return out.join('\n')
}

/* ------------------------------------------------------------------ *
 * 命令注册
 * ------------------------------------------------------------------ */

export function registerCommands(ctx: Ctx): () => void {
  if (typeof ctx.command !== 'function') return () => {}

  /* ---- 冒烟：验证插件链路是否通畅 ---- */
  ctx
    .command('designer-desk.hello <name>', '设计台冒烟自检：向指定名字打招呼，用于确认插件链路通畅')
    .alias('dd-hello')
    .action(({ options }: any, name: string) => {
      const who = name || '设计师'
      ctx.logger?.info?.(`[designer-desk] hello called with ${who}`)
      return `你好，${who}！我是「设计台」插件。\n数据目录：${DESK_HOME}\n工作区页面 / 设置面板 / 状态栏均已就绪。`
    })

  /* ---- 今日待处理 ---- */
  ctx
    .command('designer-desk.today', '输出今日待处理摘要：逾期 / 今天 / 三天内 / 沉默项目')
    .alias('dd-today')
    .action(async () => {
      try {
        return await renderTodayText()
      } catch (err: any) {
        return `读取失败：${err?.message ?? err}`
      }
    })

  /* ---- 快速建档 ---- */
  ctx
    .command('designer-desk.add <customer> <room>', '快速建档：客户名 + 小区房号，自动生成「预约量房」待办')
    .alias('dd-add')
    .option('community', '-c  指定小区名（房号已含小区时可省略）')
    .action(async ({ options }: any, customer: string, room: string) => {
      try {
        const out = await mutate((db) => {
          const now = nowIso()
          const community = String(options?.community ?? '').trim()
          const roomNo = String(room ?? '').trim()
          const cus = {
            id: uid('cus'),
            name: String(customer ?? '').trim() || '未命名客户',
            community,
            roomNo,
            createdAt: now,
            updatedAt: now,
          }
          db.customers.push(cus as any)
          const s1 = stageDef(1)
          const prj: Project = {
            id: uid('prj'),
            customerId: cus.id,
            name: [community, roomNo].filter(Boolean).join('-') || `${cus.name} 的项目`,
            stage: 1,
            nextAction: s1.next?.title,
            nextActionAt: s1.next ? addDaysStr(todayStr(), s1.next.inDays) : undefined,
            amount: 0,
            logs: [{ at: now, text: '建档（命令创建）', stage: 1 }],
            createdAt: now,
            updatedAt: now,
          }
          db.projects.push(prj)
          db.tasks.push({
            id: uid('tsk'),
            projectId: prj.id,
            title: `${s1.next?.title}（${prj.name}）`,
            type: s1.next?.type ?? '其他',
            dueAt: prj.nextActionAt,
            done: false,
            priority: 'P0',
            createdAt: now,
          } as Task)
          return prj
        })
        const p = out.result
        return `✅ 已建档：${p.name}\n阶段：${stageDef(p.stage).name}\n下一步：${p.nextAction}（${p.nextActionAt}）`
      } catch (err: any) {
        return `建档失败：${err?.message ?? err}`
      }
    })

  /* ---- 推进阶段（推一下就走） ---- */
  ctx
    .command('designer-desk.next <project>', '推进项目到下一阶段，并自动排出下一阶段的标准待办')
    .alias('dd-next')
    .option('note', '-n  本次推进的备注（会写入项目流水）')
    .action(async ({ options }: any, project: string) => {
      try {
        const keyword = String(project ?? '').trim()
        if (!keyword) return '请提供项目名（支持模糊匹配），例如：designer-desk.next 金地花园'
        const out = await mutate((db) => {
          const views = toProjectViews(db)
          const hit =
            views.find((v) => v.name === keyword) ??
            views.find((v) => v.name.includes(keyword)) ??
            views.find((v) => v.customerName.includes(keyword))
          if (!hit) throw new Error(`没找到项目「${keyword}」`)
          const prj = db.projects.find((p) => p.id === hit.id)!
          const res = advanceProject(prj, options?.note)
          if (res.createdTask) db.tasks.push(res.createdTask)
          return res
        })
        const r = out.result
        const lines = [
          `✅ ${r.project.name}：${r.finishedStage} → ${r.nextStageName}`,
        ]
        if (r.createdTask) {
          lines.push(`📌 已自动排出下一步：${r.createdTask.title}（${r.createdTask.dueAt}）`)
        } else {
          lines.push('🏁 已结项，项目归档。')
        }
        return lines.join('\n')
      } catch (err: any) {
        return `推进失败：${err?.message ?? err}`
      }
    })

  /* ---- 出效果图 ---- */
  ctx
    .command('designer-desk.render <project> <space> [style]', '调本机 ComfyUI 出效果图：项目名 + 空间 + 风格')
    .alias('dd-render')
    .option('materials', '-m  材质关键词，如「胡桃木、微水泥、亚麻」')
    .option('ratio', '-r  出图比例 16:9 / 4:3 / 1:1 / 9:16')
    .option('count', '-n  张数（1-8）')
    .action(async ({ options }: any, project: string, space: string, style?: string) => {
      try {
        const db = await loadDB()
        const views = toProjectViews(db)
        const hit =
          views.find((v) => v.name === project) ??
          views.find((v) => v.name.includes(project)) ??
          views.find((v) => v.customerName.includes(project))
        if (!hit) return `没找到项目「${project}」，可先用 designer-desk.today 查看项目列表`

        const cfg = await loadConfig()
        const st = await comfyStatus(cfg)
        if (!st.ok) return `⚠️ ${st.message}`
        if (!st.workflowReady) {
          return '⚠️ 还没配置工作流：请在「设计台 → 设置」里填写 API 格式工作流路径与节点映射'
        }

        const res = await submitRender(
          cfg,
          {
            projectId: hit.id,
            projectLabel: hit.name,
            space,
            style: style || hit.style,
            materials: options?.materials,
            ratio: options?.ratio || '16:9',
            count: Number(options?.count) || 1,
          },
          {
            async persist(patch) {
              await mutate((db2) => {
                const idx = db2.renders.findIndex((r) => r.id === patch.id)
                if (idx >= 0) db2.renders[idx] = { ...db2.renders[idx], ...(patch as any) }
                else db2.renders.unshift({ items: [], ...(patch as any) } as any)
              })
            },
          },
        )
        if (!res.ok) return `❌ 提交失败：${res.error}`

        const lines = [
          `🎨 已提交出图：${hit.name}`,
          `提示词：${res.prompt}`,
          `尺寸：${res.width}×${res.height}  种子：${res.seed}`,
        ]
        if (res.missing?.length) {
          lines.push(`⚠️ 以下节点映射未生效（不影响出图）：${res.missing.join('、')}`)
        }
        lines.push(`任务号：${res.jobId} —— 到「设计台 → 效果图」查看进度`)
        return lines.join('\n')
      } catch (err: any) {
        return `出图失败：${err?.message ?? err}`
      }
    })

  /* ---- 备份 ---- */
  ctx
    .command('designer-desk.backup', '导出 JSON 备份并返回文件路径')
    .alias('dd-backup')
    .action(async () => {
      try {
        const fs = await import('node:fs/promises')
        const db = await loadDB()
        const cfg = await loadConfig()
        const file = `${DESK_HOME}/backup-${nowIso().replace(/[:.]/g, '-')}.json`
        await fs.writeFile(
          file,
          JSON.stringify({ kind: 'designer-desk-backup', version: 1, exportedAt: nowIso(), db, config: cfg }, null, 2),
          'utf8',
        )
        return `✅ 已导出备份：\n${file}\n\n客户 ${db.customers.length} 条 / 项目 ${db.projects.length} 条 / 待办 ${db.tasks.length} 条`
      } catch (err: any) {
        return `备份失败：${err?.message ?? err}`
      }
    })

  /* ---- 工地巡检概览（M4） ---- */
  ctx
    .command('designer-desk.sites', '工地巡检概览：列出在施项目的各节点巡检状态')
    .alias('dd-sites')
    .action(async () => {
      try {
        const db = await loadDB()
        const building = db.projects.filter((p) => p.stage >= 7 && p.stage <= 8 && !p.archived)
        if (!building.length) return '当前没有在施工 / 验收阶段的项目。'
        const lines: string[] = ['🏗️ 设计台 · 工地巡检概览']
        for (const p of building) {
          const ins = db.sites.filter((s) => s.projectId === p.id)
          const pass = ins.filter((s) => s.status === '通过').length
          const doing = ins.filter((s) => s.status === '进行中').length
          const todo = ins.filter((s) => s.status === '待巡检').length
          const fix = ins.filter((s) => s.status === '需整改').length
          lines.push(`\n· ${p.name}（${stageDef(p.stage).name}）`)
          lines.push(`  通过 ${pass} · 进行中 ${doing} · 待巡检 ${todo}${fix ? ` · 需整改 ${fix}` : ''}`)
          for (const s of ins) {
            const mark = s.status === '通过' ? '✓' : s.status === '需整改' ? '!' : s.status === '进行中' ? '~' : '·'
            lines.push(`    ${mark} ${s.node} — ${s.status}${s.plannedAt ? `（${s.plannedAt}）` : ''}`)
          }
        }
        return lines.join('\n')
      } catch (err: any) {
        return `读取失败：${err?.message ?? err}`
      }
    })

  /* ---- 材料进场看板（M5） ---- */
  ctx
    .command('designer-desk.materials', '材料进场看板：列出已下单 / 在途 / 待进场材料，按进场日排序')
    .alias('dd-materials')
    .action(async () => {
      try {
        const db = await loadDB()
        const list = db.materials
          .filter((m) => m.status !== '已验收')
          .sort((a, b) => (a.arriveAt || '9999').localeCompare(b.arriveAt || '9999'))
        if (!list.length) return '没有待进场 / 在途的材料。'
        const today = todayStr()
        const lines: string[] = ['📦 设计台 · 材料进场看板']
        for (const m of list) {
          const late = m.arriveAt && m.arriveAt < today ? ' ⚠️逾期' : ''
          const prj = db.projects.find((p) => p.id === m.projectId)
          lines.push(
            `· ${m.name}${m.brand ? `（${m.brand}）` : ''} — ${m.status}${m.arriveAt ? ` 进场 ${m.arriveAt}` : ' 未排期'}${late}`,
          )
          if (prj) lines.push(`  项目：${prj.name}`)
        }
        return lines.join('\n')
      } catch (err: any) {
        return `读取失败：${err?.message ?? err}`
      }
    })

  /* ---- 灵感素材库概览（M6） ---- */
  ctx
    .command('designer-desk.refs', '灵感素材库概览：按评分列出收藏的参考图')
    .alias('dd-refs')
    .option('tag', '-t  按标签筛选，如「奶油风」')
    .action(async ({ options }: any) => {
      try {
        const db = await loadDB()
        const tag = String(options?.tag ?? '').trim()
        let list = db.refimages
        if (tag) list = list.filter((r) => (r.tags || []).some((t) => t.includes(tag)))
        list = list.slice().sort((a, b) => b.score - a.score)
        if (!list.length) return tag ? `没有标签含「${tag}」的参考图。` : '灵感素材库还是空的。'
        const lines: string[] = [`🖼️ 设计台 · 灵感素材库${tag ? `（标签：${tag}）` : ''}`]
        for (const r of list.slice(0, 20)) {
          const stars = '★'.repeat(r.score) + '☆'.repeat(5 - r.score)
          lines.push(`· ${r.title || '未命名'} ${stars}${(r.tags || []).join('/')}${r.source ? ` · ${r.source}` : ''}`)
        }
        return lines.join('\n')
      } catch (err: any) {
        return `读取失败：${err?.message ?? err}`
      }
    })

  return () => {
    /* 命令随 effect 卸载；如需手动清理可在此实现 */
  }
}

/* ------------------------------------------------------------------ *
 * 工具（供 LLM 直接调用）
 * ------------------------------------------------------------------ */

export function registerTools(ctx: Ctx): () => void {
  const tool = ctx.tool
  if (!tool || typeof tool.register !== 'function') return () => {}
  try {
    tool.register({
      name: 'designer_desk_today',
      description: '读取设计台今日待处理清单（逾期 / 今天 / 三天内 / 沉默项目）',
      params: {},
      run: async () => ({ ok: true, text: await renderTodayText() }),
    })
    return () => {}
  } catch {
    return () => {}
  }
}
