/**
 * designer-desk · 侧栏面板图标
 *
 * ⚠️ 侧栏插槽（`sidebar.panellist`）**必须传图标，不能传完整界面**。
 * 传整个 App 会导致六 Tab 工作台在主区和侧栏各渲染一次。
 * 形态抄 `dsh-studio-dashboard` 的 `DashIcon`：
 *   - 组件签名是 `({ size })` —— 宿主只给 size，不给别的 props
 *   - svg 必须带 `data-dsh-panel-entry={PANEL_ID}` —— 宿主靠这个属性把点击
 *     事件路由到对应的 main 面板，没有它侧栏点了没反应
 */

/** 与 main 插槽的 key 保持一致，宿主靠它配对 */
const PANEL_ID = 'designer-desk-main'

export function DeskIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      data-dsh-panel-entry={PANEL_ID}
      viewBox="0 0 16 16"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.3}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {/* 九宫格：象征 9 阶段项目管线 */}
      <path d="M2.5 2.5h11v11h-11zM2.5 6h11M2.5 10h11M6.5 2.5V13.5M10 2.5V13.5" />
      {/* 当前阶段高亮 */}
      <path d="M6.5 6h3.5v4H6.5z" fill="currentColor" stroke="none" />
    </svg>
  )
}