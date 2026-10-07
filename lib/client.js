window.__ModuleLoader__.load({ id: "designer-desk", factory: (require) => {
var module = { exports: {} };
var exports = module.exports;

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client/index.ts
var index_exports = {};
__export(index_exports, {
  apply: () => apply,
  inject: () => inject
});
module.exports = __toCommonJS(index_exports);

// src/client/kit.tsx
var import_react = require("react");
var import_jsx_runtime = require("react/jsx-runtime");
var ctxRef = null;
function bindCtx(ctx) {
  ctxRef = ctx;
  installRemoteBridge(ctx);
}
var REMOTE_NAMESPACE = "designerDesk";
var remoteNs = null;
var mountState = "waiting";
var mountError = "";
var mountWaiters = [];
function notifyWaiters() {
  while (mountWaiters.length) {
    const fn = mountWaiters.pop();
    try {
      fn?.();
    } catch {
    }
  }
}
function ensureRemoteMounted() {
  if (mountState === "ready") return Promise.resolve();
  if (mountState === "failed" || mountState === "unsupported") {
    return Promise.reject(new Error(mountError || "Remote \u547D\u540D\u7A7A\u95F4\u4E0D\u53EF\u7528"));
  }
  return new Promise((resolve, reject) => {
    mountWaiters.push(() => {
      if (mountState === "ready") resolve();
      else reject(new Error(mountError || "Remote \u547D\u540D\u7A7A\u95F4\u4E0D\u53EF\u7528"));
    });
    void doMount();
  });
}
var mounting = false;
async function doMount() {
  if (mounting) return;
  mounting = true;
  try {
    const remote = ctxRef?.remote;
    if (!remote || typeof remote.$mount !== "function") {
      mountState = "unsupported";
      mountError = "\u5BBF\u4E3B\u672A\u63D0\u4F9B remote \u670D\u52A1\uFF08api-gateway \u5BA2\u6237\u7AEF\u63D2\u4EF6\u7F3A\u5931\uFF09";
      notifyWaiters();
      return;
    }
    await remote.$mount(REMOTE_NAMESPACE);
  } catch (err) {
    mountState = "failed";
    mountError = String(err?.message ?? err);
    notifyWaiters();
  } finally {
    mounting = false;
  }
}
function installRemoteBridge(ctx) {
  if (!ctx || typeof ctx.inject !== "function") return;
  try {
    ctx.inject([`remote.${REMOTE_NAMESPACE}`], (nsCtx) => {
      const ns = nsCtx?.remote?.[REMOTE_NAMESPACE];
      if (ns === void 0 || ns === null) return;
      remoteNs = ns;
      mountState = "ready";
      mountError = "";
      notifyWaiters();
    });
  } catch {
  }
}
function remoteStatus() {
  return { state: mountState, error: mountError };
}
var ENDPOINTS = {
  health: "health",
  state: "state",
  stages: "stages",
  config: "getConfig",
  "config:POST": "setConfig",
  "project/save": "projectSave",
  "project/advance": "projectAdvance",
  "project/delete": "projectDelete",
  "project/wake": "projectWake",
  "task/save": "taskSave",
  "task/toggle": "taskToggle",
  "task/postpone": "taskPostpone",
  "task/delete": "taskDelete",
  today: "today",
  tasks: "openTasks",
  export: "exportData",
  import: "importData",
  "seed/demo": "seedDemoData",
  "seed/clear": "seedClear",
  "comfy/status": "comfyStatus",
  "comfy/render": "renderSubmit",
  "comfy/job": "renderJob",
  "render/image": "renderImage",
  "render/delete": "renderDelete",
  "render-dir": "renderDir",
  "site/save": "siteSave",
  "site/delete": "siteDelete",
  "material/save": "materialSave",
  "material/delete": "materialDelete",
  "refimage/save": "refimageSave",
  "refimage/delete": "refimageDelete"
};
async function api(path, init) {
  const key = String(path).replace(/^\//, "");
  const isPost = (init?.method ?? "GET").toUpperCase() === "POST";
  const method = (isPost ? ENDPOINTS[`${key}:POST`] : void 0) ?? ENDPOINTS[key];
  if (!method) throw new Error(`\u672A\u6CE8\u518C\u7684\u7AEF\u70B9\uFF1A${path}${isPost ? "\uFF08POST\uFF09" : ""}`);
  await ensureRemoteMounted();
  if (!remoteNs) throw new Error(mountError || "Remote \u547D\u540D\u7A7A\u95F4\u672A\u5C31\u7EEA");
  const fn = remoteNs[method];
  if (typeof fn !== "function") throw new Error(`Remote \u65B9\u6CD5\u4E0D\u5B58\u5728\uFF1A${method}`);
  const args = isPost ? [init?.body ?? {}] : [];
  return await fn.apply(remoteNs, args);
}
var C = {
  bg: "#FAF8F5",
  card: "#FFFFFF",
  line: "#E8E3DC",
  lineSoft: "#F1EDE7",
  ink: "#1F1D1A",
  ink2: "#8A837A",
  ink3: "#B5AEA4",
  brand: "#B85C38",
  brandSoft: "#F5EAE4",
  danger: "#C0392B",
  dangerSoft: "#FBF0EE",
  warn: "#C0872B",
  warnSoft: "#FDF6E8",
  ok: "#4A6B57",
  okSoft: "#EFF5F1"
};
var FONT = '-apple-system, BlinkMacSystemFont, "PingFang SC", "Segoe UI", Roboto, "Helvetica Neue", sans-serif';
var R = { sm: 8, md: 10, lg: 12, pill: 999 };
var cardStyle = {
  background: C.card,
  border: `1px solid ${C.line}`,
  borderRadius: R.lg,
  padding: "16px 18px"
};
var inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "9px 11px",
  border: `1px solid ${C.line}`,
  borderRadius: R.sm,
  fontSize: 16,
  // ≥16px，避免 iOS 自动放大页面
  background: "#fff",
  color: C.ink,
  fontFamily: FONT,
  outline: "none"
};
var labelStyle = {
  display: "block",
  fontSize: 12,
  color: C.ink2,
  marginBottom: 5,
  fontWeight: 600,
  letterSpacing: ".02em"
};
var sectionTitle = {
  fontSize: 13,
  fontWeight: 700,
  color: C.ink,
  margin: "0 0 10px",
  display: "flex",
  alignItems: "center",
  gap: 8
};
function useIsNarrow(breakpoint = 768) {
  const [narrow, setNarrow] = (0, import_react.useState)(
    () => typeof window !== "undefined" && window.innerWidth < breakpoint
  );
  (0, import_react.useEffect)(() => {
    const onResize = () => setNarrow(window.innerWidth < breakpoint);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [breakpoint]);
  return narrow;
}
function Btn({
  children,
  onClick,
  kind = "ghost",
  disabled,
  title,
  narrowMin,
  style
}) {
  const palette = {
    primary: { background: C.brand, color: "#fff", border: `1px solid ${C.brand}` },
    ghost: { background: "#fff", color: C.ink, border: `1px solid ${C.line}` },
    quiet: { background: "transparent", color: C.ink2, border: "1px solid transparent" },
    danger: { background: "#fff", color: C.danger, border: `1px solid ${C.line}` }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "button",
    {
      type: "button",
      title,
      disabled,
      onClick: disabled ? void 0 : onClick,
      style: {
        ...palette[kind],
        minHeight: narrowMin === false ? void 0 : 34,
        minWidth: 44,
        padding: "6px 13px",
        borderRadius: R.sm,
        fontSize: 13,
        fontWeight: 600,
        fontFamily: FONT,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.45 : 1,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        lineHeight: 1.2,
        ...style
      },
      children
    }
  );
}
function Pill({
  children,
  tone = "neutral",
  style
}) {
  const tones = {
    neutral: { background: "#F4F0EA", color: C.ink2 },
    brand: { background: C.brandSoft, color: C.brand },
    ok: { background: C.okSoft, color: C.ok },
    warn: { background: C.warnSoft, color: C.warn },
    danger: { background: C.dangerSoft, color: C.danger }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "span",
    {
      style: {
        ...tones[tone],
        fontSize: 11.5,
        fontWeight: 700,
        padding: "2px 8px",
        borderRadius: R.pill,
        whiteSpace: "nowrap",
        ...style
      },
      children
    }
  );
}
function Field({
  label,
  children,
  hint,
  style
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { style: { marginBottom: 12, ...style }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { style: labelStyle, children: label }),
    children,
    hint ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { fontSize: 11.5, color: C.ink3, marginTop: 4, lineHeight: 1.6 }, children: hint }) : null
  ] });
}
function Empty({ text }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      style: {
        padding: "18px 14px",
        textAlign: "center",
        fontSize: 13,
        color: C.ink3,
        border: `1px dashed ${C.line}`,
        borderRadius: R.md,
        background: "#FCFBF9"
      },
      children: text
    }
  );
}
function Bar({ value, tone = C.brand }) {
  const pct = Math.max(0, Math.min(100, value));
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { style: { height: 5, background: C.lineSoft, borderRadius: R.pill, overflow: "hidden" }, children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "div",
    {
      style: {
        width: `${pct}%`,
        height: "100%",
        background: tone,
        borderRadius: R.pill,
        transition: "width .25s ease"
      }
    }
  ) });
}
var PATHS = {
  today: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "6.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 4.4V8l2.6 1.6" })
  ] }),
  board: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "1.8", y: "2.6", width: "4", height: "10.8", rx: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "6", y: "2.6", width: "4", height: "7", rx: "1" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "10.2", y: "2.6", width: "4", height: "9", rx: "1" })
  ] }),
  image: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "1.8", y: "3", width: "12.4", height: "10", rx: "1.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "5.8", cy: "6.6", r: "1.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.4 11.6l3.4-2.9 2.8 2.3 2.4-1.9 2.8 2.5" })
  ] }),
  settings: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "2.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 1.6v1.8M8 12.6v1.8M1.6 8h1.8M12.6 8h1.8M3.5 3.5l1.3 1.3M11.2 11.2l1.3 1.3M12.5 3.5l-1.3 1.3M4.8 11.2l-1.3 1.3" })
  ] }),
  plus: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 3.4v9.2M3.4 8h9.2" }),
  check: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 8.4l3.2 3.2L13 5.2" }),
  clock: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "6.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 4.6V8l2.4 1.5" })
  ] }),
  warn: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 1.8L15 14H1z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 6v3.4M8 11.4v.6" })
  ] }),
  close: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M4 4l8 8M12 4l-8 8" }),
  arrow: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3.5 8h8.6M8.6 4.4L12.2 8l-3.6 3.6" }),
  download: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 2.6v7.6M4.6 7.2L8 10.6l3.4-3.4M2.8 13.4h10.4" }),
  upload: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 10.6V3M4.6 6.4L8 3l3.4 3.4M2.8 13.4h10.4" }),
  refresh: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M13 8a5 5 0 11-1.6-3.7M13 2.6V5.4h-2.8" }),
  trash: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3 4.4h10M6.4 4.4V3.2h3.2v1.2M4.4 4.4l.7 8.4h5.8l.7-8.4" }),
  wake: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.4 12.6h11.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 2.4v6.4M5.4 6.2L8 8.8l2.6-2.6" })
  ] }),
  sync: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.8 8a5.2 5.2 0 018.9-3.7M13.2 8a5.2 5.2 0 01-8.9 3.7M11.9 1.9v2.6h-2.6M4.1 14.1v-2.6h2.6" }),
  offline: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "6.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M3.8 3.8l8.4 8.4" })
  ] }),
  online: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "8", cy: "8", r: "6.2" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5 8.3l2.1 2.1L11.2 6.3" })
  ] }),
  sparkle: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 2.2l1.5 4.1 4.1 1.5-4.1 1.5L8 13.4l-1.5-4.1L2.4 7.8l4.1-1.5z" }),
  build: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.4 13.6V6.2l4-2.6 4 2.6v7.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M10.4 9.4l3.2-2v6.2H6.4" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5 13.6v-3.4h2.8v3.4M5 7.6h2.8" })
  ] }),
  box: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 1.9l5.4 2.6v7L8 14.1l-5.4-2.6v-7z" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.6 4.5L8 7.1l5.4-2.6M8 7.1v7" })
  ] }),
  gallery: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "1.8", y: "3", width: "12.4", height: "10", rx: "1.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "5.6", cy: "6.5", r: "1.1" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M2.4 11.4l3.3-2.7 2.6 2.1 2.2-1.7 3.1 2.6" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M9.6 3.2l4.4 5.6" })
  ] })
};
function Icon({
  name,
  size = 15,
  color = C.ink2,
  strokeWidth = 1.5,
  style
}) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      width: size,
      height: size,
      viewBox: "0 0 16 16",
      fill: "none",
      style: { flex: "none", display: "block", ...style },
      "aria-hidden": "true",
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("g", { stroke: color, strokeWidth, strokeLinecap: "round", strokeLinejoin: "round", children: PATHS[name] })
    }
  );
}
function money(n) {
  if (n === void 0 || n === null || Number.isNaN(n) || !n) return "\u2014";
  if (n >= 1e4) return `\xA5${(n / 1e4).toFixed(1)} \u4E07`;
  return `\xA5${Math.round(n).toLocaleString("zh-CN")}`;
}
function bytesText(n) {
  if (!n) return "0 B";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
function dueText(days) {
  if (days === null) return { text: "\u672A\u6392\u671F", tone: "neutral" };
  if (days < 0) return { text: `\u903E\u671F ${Math.abs(days)} \u5929`, tone: "danger" };
  if (days === 0) return { text: "\u4ECA\u5929\u5230\u671F", tone: "warn" };
  if (days === 1) return { text: "\u660E\u5929", tone: "warn" };
  if (days <= 3) return { text: `${days} \u5929\u540E`, tone: "warn" };
  return { text: `${days} \u5929\u540E`, tone: "ok" };
}

// src/client/App.tsx
var import_react7 = require("react");

// src/client/Today.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
function Zone({ title, dot, count, hint, children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { ...cardStyle, marginBottom: 12, padding: "14px 16px" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: count ? 10 : 0,
          flexWrap: "wrap"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { width: 8, height: 8, borderRadius: 999, background: dot, flex: "none" } }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 13.5, fontWeight: 700 }, children: title }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Pill, { tone: "neutral", children: count }),
          hint ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { fontSize: 11.5, color: C.ink3 }, children: hint }) : null
        ]
      }
    ),
    count ? children : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 12.5, color: C.ink3 }, children: "\u6CA1\u6709\u5185\u5BB9\uFF0C\u633A\u597D" })
  ] });
}
function TaskRow({
  task,
  projectName,
  tone,
  narrow,
  onToggle,
  onPostpone,
  onDelete,
  onOpenProject
}) {
  const toneColor = tone === "danger" ? C.danger : tone === "warn" ? C.warn : C.ink2;
  const due = task.dueAt ?? "\u672A\u5B9A\u65E5\u671F";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
    "div",
    {
      style: {
        display: "flex",
        alignItems: narrow ? "flex-start" : "center",
        flexDirection: narrow ? "column" : "row",
        gap: narrow ? 8 : 10,
        padding: narrow ? "11px 0" : "9px 0",
        borderTop: `1px solid ${C.lineSoft}`
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0, width: narrow ? "100%" : "auto" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
            "button",
            {
              type: "button",
              onClick: onToggle,
              title: "\u6807\u8BB0\u5B8C\u6210",
              style: {
                width: 22,
                height: 22,
                flex: "none",
                borderRadius: 6,
                border: `1.5px solid ${C.line}`,
                background: "#fff",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              },
              children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "check", size: 13, color: "transparent" })
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { minWidth: 0, flex: 1 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
              "div",
              {
                style: {
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: C.ink,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: narrow ? "normal" : "nowrap"
                },
                children: task.title
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: 11.5, color: C.ink2, display: "flex", gap: 8, flexWrap: "wrap", marginTop: 3 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { style: { color: toneColor, fontWeight: 600 }, children: due }),
              task.type ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                "\xB7 ",
                task.type
              ] }) : null,
              projectName ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
                "span",
                {
                  onClick: onOpenProject,
                  style: { cursor: onOpenProject ? "pointer" : "default", textDecoration: onOpenProject ? "underline" : "none" },
                  children: [
                    "\xB7 ",
                    projectName
                  ]
                }
              ) : null,
              task.priority ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { children: [
                "\xB7 ",
                task.priority
              ] }) : null
            ] })
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", width: narrow ? "100%" : "auto" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Btn, { kind: "primary", onClick: onToggle, style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u5B8C\u6210" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Btn, { onClick: () => onPostpone(1), title: "\u987A\u5EF6\u5230\u660E\u5929", style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u660E\u5929" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Btn, { onClick: () => onPostpone(3), title: "\u987A\u5EF6\u4E09\u5929", style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u4E09\u5929\u540E" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Btn, { kind: "danger", onClick: onDelete, title: "\u5220\u9664", style: { padding: "5px 9px", fontSize: 12.5 }, children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "trash", size: 12.5, color: C.danger }) })
        ] })
      ]
    }
  );
}
function Today({
  buckets,
  projects,
  today,
  onToggle,
  onPostpone,
  onDelete,
  onWake,
  onOpenProject
}) {
  const narrow = useIsNarrow();
  const nameOf = (projectId) => projectId ? projects.find((p) => p.id === projectId)?.name : void 0;
  const total = buckets.overdue.length + buckets.today.length;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      "div",
      {
        style: {
          ...cardStyle,
          marginBottom: 14,
          background: total ? C.brandSoft : C.okSoft,
          border: `1px solid ${total ? "#EBD9CF" : "#D2E3D8"}`
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "today", size: 17, color: total ? C.brand : C.ok }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: 15, fontWeight: 700, color: total ? C.brand : C.ok }, children: [
            "\u4ECA\u5929\u8981\u5904\u7406 ",
            total,
            " \u9879"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { style: { fontSize: 12.5, color: C.ink2 }, children: [
            today,
            " \xB7 \u903E\u671F ",
            buckets.overdue.length,
            " \xB7 \u4ECA\u5929 ",
            buckets.today.length,
            " \xB7 \u4E09\u5929\u5185",
            " ",
            buckets.soon.length
          ] })
        ] })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Zone, { title: "\u903E\u671F", dot: C.danger, count: buckets.overdue.length, hint: "\u6628\u5929\u6CA1\u505A\u5B8C\u7684\u81EA\u52A8\u6EDA\u5230\u8FD9\u91CC\uFF0C\u4E0D\u4F1A\u6D88\u5931", children: buckets.overdue.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      TaskRow,
      {
        task: t,
        tone: "danger",
        narrow,
        projectName: nameOf(t.projectId),
        onToggle: () => onToggle(t.id, true),
        onPostpone: (d) => onPostpone(t.id, d),
        onDelete: () => onDelete(t.id),
        onOpenProject: t.projectId ? () => onOpenProject(t.projectId) : void 0
      },
      t.id
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Zone, { title: "\u4ECA\u5929", dot: C.warn, count: buckets.today.length, children: buckets.today.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      TaskRow,
      {
        task: t,
        tone: "warn",
        narrow,
        projectName: nameOf(t.projectId),
        onToggle: () => onToggle(t.id, true),
        onPostpone: (d) => onPostpone(t.id, d),
        onDelete: () => onDelete(t.id),
        onOpenProject: t.projectId ? () => onOpenProject(t.projectId) : void 0
      },
      t.id
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Zone, { title: "\u4E09\u5929\u5185", dot: C.ok, count: buckets.soon.length, hint: "\u63D0\u524D\u770B\u5230\uFF0C\u907F\u514D\u7A81\u7136\u7206\u96F7", children: buckets.soon.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      TaskRow,
      {
        task: t,
        tone: "neutral",
        narrow,
        projectName: nameOf(t.projectId),
        onToggle: () => onToggle(t.id, true),
        onPostpone: (d) => onPostpone(t.id, d),
        onDelete: () => onDelete(t.id),
        onOpenProject: t.projectId ? () => onOpenProject(t.projectId) : void 0
      },
      t.id
    )) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Zone, { title: "\u6C89\u9ED8\u9879\u76EE\u5524\u9192", dot: C.brand, count: buckets.silent.length, hint: "\u65B9\u6848 / \u62A5\u4EF7\u9636\u6BB5\u592A\u4E45\u6CA1\u52A8\u9759", children: buckets.silent.map((p) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: narrow ? "flex-start" : "center",
          flexDirection: narrow ? "column" : "row",
          gap: 9,
          padding: "9px 0",
          borderTop: `1px solid ${C.lineSoft}`
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 13.5, fontWeight: 600 }, children: p.name }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { fontSize: 11.5, color: C.ink2, marginTop: 3 }, children: [
              p.customerName,
              " \xB7 ",
              p.stageName,
              " \xB7 \u4E0A\u6B21\u52A8\u9759",
              " ",
              p.updatedAt ? p.updatedAt.slice(0, 10) : "\u2014"
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { style: { display: "flex", gap: 6 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(Btn, { kind: "primary", onClick: () => onWake(p.id), style: { padding: "5px 11px", fontSize: 12.5 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "wake", size: 12.5, color: "#fff" }),
              "\u751F\u6210\u8DDF\u8FDB\u5F85\u529E"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Btn, { onClick: () => onOpenProject(p.id), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u770B\u8BE6\u60C5" })
          ] })
        ]
      },
      p.id
    )) }),
    buckets.noDate.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Zone, { title: "\u6302\u7740\u4F46\u6CA1\u5B9A\u65E5\u671F", dot: C.ink3, count: buckets.noDate.length, hint: "\u5EFA\u8BAE\u7ED9\u4E2A\u65E5\u5B50\uFF0C\u5426\u5219\u5BB9\u6613\u88AB\u5FD8\u6389", children: buckets.noDate.map((t) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
      TaskRow,
      {
        task: t,
        tone: "neutral",
        narrow,
        projectName: nameOf(t.projectId),
        onToggle: () => onToggle(t.id, true),
        onPostpone: (d) => onPostpone(t.id, d),
        onDelete: () => onDelete(t.id),
        onOpenProject: t.projectId ? () => onOpenProject(t.projectId) : void 0
      },
      t.id
    )) }) : null,
    !projects.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Empty, { text: "\u8FD8\u6CA1\u6709\u9879\u76EE \u2014\u2014 \u53BB\u300C\u9879\u76EE\u300D\u9875\u70B9\u300C\u65B0\u5EFA\u9879\u76EE\u300D\u5EFA\u6863\uFF0C\u6216\u5230\u8BBE\u7F6E\u91CC\u91CD\u65B0\u8F7D\u5165\u793A\u4F8B\u6570\u636E" }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { style: { fontSize: 11.5, color: C.ink3, marginTop: 4, lineHeight: 1.8 }, children: "\u903E\u671F\u9879\u4E0E\u4ECA\u5929\u9879\u6BCF\u5929\u81EA\u52A8\u91CD\u7B97\uFF1B\u987A\u5EF6\u4F1A\u4FDD\u7559\u539F\u59CB\u65E5\u671F\uFF0C\u65B9\u4FBF\u56DE\u770B\u8FD9\u4E2A\u5BA2\u6237\u88AB\u63A8\u4E86\u51E0\u6B21\u3002" })
  ] });
}

// src/client/Projects.tsx
var import_react2 = require("react");
var import_jsx_runtime3 = require("react/jsx-runtime");
var BLANK_CUSTOMER = {
  name: "",
  phone: "",
  wechat: "",
  community: "",
  roomNo: "",
  layout: "",
  area: "",
  style: "",
  budget: "",
  family: "",
  taboo: "",
  note: ""
};
function CustomerFields({
  value,
  onChange,
  narrow
}) {
  const two = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: "0 14px"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: two, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u5BA2\u6237\u79F0\u547C *", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          style: inputStyle,
          value: value.name ?? "",
          placeholder: "\u5982 \u738B\u5973\u58EB",
          onChange: (e) => onChange({ name: e.target.value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u7535\u8BDD", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          style: inputStyle,
          value: value.phone ?? "",
          placeholder: "138****0000",
          onChange: (e) => onChange({ phone: e.target.value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u5FAE\u4FE1", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { style: inputStyle, value: value.wechat ?? "", onChange: (e) => onChange({ wechat: e.target.value }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u5C0F\u533A", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          style: inputStyle,
          value: value.community ?? "",
          placeholder: "\u5982 \u91D1\u5730\u82B1\u56ED",
          onChange: (e) => onChange({ community: e.target.value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u623F\u53F7", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          style: inputStyle,
          value: value.roomNo ?? "",
          placeholder: "\u5982 1201",
          onChange: (e) => onChange({ roomNo: e.target.value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u6237\u578B", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          style: inputStyle,
          value: value.layout ?? "",
          placeholder: "\u5982 \u4E09\u5BA4\u4E24\u5385",
          onChange: (e) => onChange({ layout: e.target.value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u9762\u79EF\uFF08\u33A1\uFF09", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          style: inputStyle,
          type: "number",
          inputMode: "decimal",
          value: value.area ?? "",
          onChange: (e) => onChange({ area: e.target.value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u98CE\u683C\u504F\u597D", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          style: inputStyle,
          value: value.style ?? "",
          placeholder: "\u5982 \u5976\u6CB9\u98CE / \u65B0\u4E2D\u5F0F",
          onChange: (e) => onChange({ style: e.target.value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u9884\u7B97\uFF08\u5143\uFF09", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          style: inputStyle,
          type: "number",
          inputMode: "numeric",
          value: value.budget ?? "",
          onChange: (e) => onChange({ budget: e.target.value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u5BB6\u5EAD\u6210\u5458", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        "input",
        {
          style: inputStyle,
          value: value.family ?? "",
          placeholder: "\u5982 \u592B\u59BB + 1 \u4E2A\u5C0F\u5B69",
          onChange: (e) => onChange({ family: e.target.value })
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u7981\u5FCC\u9879 / \u786C\u6027\u8981\u6C42", hint: "\u5982\u300C\u4E0D\u63A5\u53D7\u5F00\u653E\u5F0F\u53A8\u623F\u300D\u300C\u8001\u4EBA\u6015\u51B7\uFF0C\u5730\u6696\u5FC5\u7559\u300D", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { style: inputStyle, value: value.taboo ?? "", onChange: (e) => onChange({ taboo: e.target.value }) }) }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u5907\u6CE8", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "textarea",
      {
        style: { ...inputStyle, minHeight: 60, resize: "vertical", lineHeight: 1.7 },
        value: value.note ?? "",
        onChange: (e) => onChange({ note: e.target.value })
      }
    ) })
  ] });
}
function ProjectCard({
  p,
  onOpen,
  onAdvance,
  onRender
}) {
  const due = dueText(p.daysToNext);
  const dueTone = due.tone === "danger" ? C.danger : due.tone === "warn" ? C.warn : C.ink2;
  const isDone = p.stage >= 9;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      style: {
        ...cardStyle,
        padding: "12px 13px",
        marginBottom: 10,
        borderColor: p.overdue ? "#E6BCB2" : C.line,
        background: p.overdue ? "#FFFCFB" : C.card,
        cursor: "pointer"
      },
      onClick: onOpen,
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 14, fontWeight: 700, marginBottom: 4 }, children: p.name }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { fontSize: 11.5, color: C.ink2, marginBottom: 8 }, children: [
          p.customerName,
          p.style ? ` \xB7 ${p.style}` : "",
          p.area ? ` \xB7 ${p.area}\u33A1` : ""
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 9 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pill, { tone: "brand", children: p.stageName }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pill, { tone: due.tone === "danger" ? "danger" : due.tone === "warn" ? "warn" : "neutral", children: due.text }),
          p.amount ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pill, { tone: "ok", children: money(p.amount) }) : null
        ] }),
        p.nextAction ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { fontSize: 12, color: C.ink2, marginBottom: 9, lineHeight: 1.6 }, children: [
          "\u4E0B\u4E00\u6B65\uFF1A",
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { color: dueTone, fontWeight: 600 }, children: p.nextAction }),
          p.nextActionAt ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { style: { color: C.ink3 }, children: [
            " \xB7 ",
            p.nextActionAt
          ] }) : null
        ] }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 12, color: C.ok, marginBottom: 9 }, children: "\u5DF2\u7ED3\u9879" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, onClick: (e) => e.stopPropagation(), children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
            Btn,
            {
              kind: "primary",
              disabled: isDone,
              onClick: onAdvance,
              style: { padding: "5px 10px", fontSize: 12.5 },
              title: isDone ? "\u5DF2\u5230\u6700\u540E\u4E00\u4E2A\u9636\u6BB5" : "\u63A8\u8FDB\u5230\u4E0B\u4E00\u9636\u6BB5\uFF0C\u81EA\u52A8\u6392\u51FA\u4E0B\u4E00\u6B65",
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "arrow", size: 12.5, color: "#fff" }),
                "\u63A8\u8FDB"
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Btn, { onClick: onRender, style: { padding: "5px 10px", fontSize: 12.5 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "image", size: 12.5, color: C.ink2 }),
            "\u51FA\u6548\u679C\u56FE"
          ] })
        ] })
      ]
    }
  );
}
function Projects({
  projects,
  stages,
  focusProjectId,
  onClearFocus,
  onSave,
  onAdvance,
  onDelete,
  onRender
}) {
  const narrow = useIsNarrow();
  const [view, setView] = (0, import_react2.useState)(narrow ? "list" : "board");
  const [creating, setCreating] = (0, import_react2.useState)(false);
  const [draft, setDraft] = (0, import_react2.useState)({ ...BLANK_CUSTOMER });
  const [detailId, setDetailId] = (0, import_react2.useState)(null);
  const [advanceNote, setAdvanceNote] = (0, import_react2.useState)("");
  const focused = focusProjectId ? projects.find((p) => p.id === focusProjectId) : void 0;
  const activeId = focused?.id ?? detailId;
  const active = activeId ? projects.find((p) => p.id === activeId) : void 0;
  const grouped = (0, import_react2.useMemo)(() => {
    return stages.map((s) => ({ stage: s, items: projects.filter((p) => p.stage === s.n) }));
  }, [stages, projects]);
  const closeDetail = () => {
    setDetailId(null);
    setAdvanceNote("");
    onClearFocus();
  };
  const submitCreate = () => {
    if (!String(draft.name ?? "").trim() && !String(draft.community ?? "").trim()) return;
    onSave({ project: {}, customer: { ...draft } });
    setDraft({ ...BLANK_CUSTOMER });
    setCreating(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          flexWrap: "wrap"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(Btn, { kind: "primary", onClick: () => setCreating(true), children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "plus", size: 13, color: "#fff" }),
            "\u65B0\u5EFA\u9879\u76EE"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 4, marginLeft: narrow ? 0 : "auto" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
              Btn,
              {
                kind: view === "board" ? "primary" : "ghost",
                onClick: () => setView("board"),
                disabled: narrow,
                title: narrow ? "\u7A84\u5C4F\u5EFA\u8BAE\u7528\u5217\u8868\u89C6\u56FE" : "\u770B\u677F\u89C6\u56FE",
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "board", size: 13, color: view === "board" && !narrow ? "#fff" : C.ink2 }),
                  "\u770B\u677F"
                ]
              }
            ),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Btn, { kind: view === "list" ? "primary" : "ghost", onClick: () => setView("list"), children: "\u5217\u8868" })
          ] })
        ]
      }
    ),
    !projects.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Empty, { text: "\u8FD8\u6CA1\u6709\u9879\u76EE\u3002\u70B9\u300C\u65B0\u5EFA\u9879\u76EE\u300D\u5EFA\u6863\uFF0C\u7CFB\u7EDF\u4F1A\u81EA\u52A8\u751F\u6210\u7B2C\u4E00\u6761\u5F85\u529E\u300C\u9884\u7EA6\u5BA2\u6237\u91CF\u623F\u300D" }) : null,
    projects.length && view === "board" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "flex", gap: 12, overflowX: "auto", paddingBottom: 8 }, children: grouped.map((g) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { flex: "none", width: 236 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
        "div",
        {
          style: {
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 9,
            paddingBottom: 7,
            borderBottom: `2px solid ${g.items.length ? C.brand : C.line}`
          },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { style: { fontSize: 12.5, fontWeight: 700, color: g.items.length ? C.ink : C.ink3 }, children: [
              g.stage.n,
              ". ",
              g.stage.name
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pill, { tone: g.items.length ? "brand" : "neutral", children: g.items.length })
          ]
        }
      ),
      g.items.map((p) => /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
        ProjectCard,
        {
          p,
          onOpen: () => setDetailId(p.id),
          onAdvance: () => onAdvance(p.id),
          onRender: () => onRender(p.id)
        },
        p.id
      )),
      !g.items.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 11.5, color: C.ink3, padding: "6px 2px" }, children: "\u7A7A" }) : null
    ] }, g.stage.n)) }) : null,
    projects.length && view === "list" ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { display: "grid", gap: 10 }, children: projects.map((p) => {
      const due = dueText(p.daysToNext);
      return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { ...cardStyle, borderColor: p.overdue ? "#E6BCB2" : C.line }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
              alignItems: "flex-start"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { minWidth: 0, flex: 1 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 14.5, fontWeight: 700 }, children: p.name }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { fontSize: 12, color: C.ink2, marginTop: 4, lineHeight: 1.7 }, children: [
                  p.customerName,
                  p.community ? ` \xB7 ${p.community}${p.roomNo ? ` ${p.roomNo}` : ""}` : "",
                  p.layout ? ` \xB7 ${p.layout}` : "",
                  p.area ? ` \xB7 ${p.area}\u33A1` : ""
                ] }),
                p.nextAction ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { fontSize: 12, color: C.ink2, marginTop: 6 }, children: [
                  "\u4E0B\u4E00\u6B65\uFF1A",
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { style: { color: due.tone === "danger" ? C.danger : C.ink }, children: p.nextAction }),
                  p.nextActionAt ? ` \xB7 ${p.nextActionAt}` : ""
                ] }) : null
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pill, { tone: "brand", children: p.stageName }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pill, { tone: due.tone === "danger" ? "danger" : due.tone === "warn" ? "warn" : "neutral", children: due.text }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pill, { tone: "ok", children: money(p.amount) })
              ] })
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Btn, { kind: "primary", disabled: p.stage >= 9, onClick: () => onAdvance(p.id), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u63A8\u8FDB\u9636\u6BB5" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Btn, { onClick: () => setDetailId(p.id), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u8BE6\u60C5 / \u7F16\u8F91" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Btn, { onClick: () => onRender(p.id), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u51FA\u6548\u679C\u56FE" })
        ] })
      ] }, p.id);
    }) }) : null,
    creating ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(31,29,26,.35)",
          display: "flex",
          alignItems: narrow ? "flex-end" : "center",
          justifyContent: "center",
          zIndex: 60,
          padding: narrow ? 0 : 20
        },
        onClick: () => setCreating(false),
        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              background: C.bg,
              width: narrow ? "100%" : 620,
              maxHeight: narrow ? "92vh" : "86vh",
              overflowY: "auto",
              borderRadius: narrow ? "14px 14px 0 0" : R.lg,
              padding: narrow ? "18px 16px calc(18px + env(safe-area-inset-bottom))" : "22px 24px",
              boxShadow: "0 12px 40px rgba(0,0,0,.18)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", marginBottom: 16 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: 16, fontWeight: 700 }, children: "\u65B0\u5EFA\u9879\u76EE" }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Btn, { kind: "quiet", onClick: () => setCreating(false), style: { marginLeft: "auto", minWidth: 34 }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "close", size: 14, color: C.ink2 }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 12.5, color: C.ink2, marginBottom: 14, lineHeight: 1.7 }, children: "\u5EFA\u6863\u540E\u81EA\u52A8\u8FDB\u5165\u300C1. \u7EBF\u7D22\u300D\u9636\u6BB5\uFF0C\u5E76\u751F\u6210\u7B2C\u4E00\u6761\u5F85\u529E\u300C\u9884\u7EA6\u5BA2\u6237\u91CF\u623F\u300D\u3002" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(CustomerFields, { value: draft, onChange: (patch) => setDraft((d) => ({ ...d, ...patch })), narrow }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    marginTop: 8,
                    paddingTop: 14,
                    borderTop: `1px solid ${C.line}`
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Btn, { onClick: () => setCreating(false), children: "\u53D6\u6D88" }),
                    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Btn, { kind: "primary", onClick: submitCreate, children: "\u5EFA\u6863\u5E76\u751F\u6210\u5F85\u529E" })
                  ]
                }
              )
            ]
          }
        )
      }
    ) : null,
    active ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(31,29,26,.35)",
          display: "flex",
          alignItems: narrow ? "flex-end" : "center",
          justifyContent: "center",
          zIndex: 60,
          padding: narrow ? 0 : 20
        },
        onClick: closeDetail,
        children: /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              background: C.bg,
              width: narrow ? "100%" : 720,
              maxHeight: narrow ? "92vh" : "88vh",
              overflowY: "auto",
              borderRadius: narrow ? "14px 14px 0 0" : R.lg,
              padding: narrow ? "18px 16px calc(18px + env(safe-area-inset-bottom))" : "22px 24px",
              boxShadow: "0 12px 40px rgba(0,0,0,.18)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 9, marginBottom: 4, flexWrap: "wrap" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { style: { fontSize: 17, fontWeight: 700 }, children: active.name }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pill, { tone: "brand", children: active.stageName }),
                active.overdue ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Pill, { tone: "danger", children: "\u5DF2\u903E\u671F" }) : null,
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Btn, { kind: "quiet", onClick: closeDetail, style: { marginLeft: "auto", minWidth: 34 }, children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "close", size: 14, color: C.ink2 }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { fontSize: 12.5, color: C.ink2, marginBottom: 16, lineHeight: 1.7 }, children: [
                "\u5F53\u524D\u9636\u6BB5\u6807\u51C6\u52A8\u4F5C\uFF1A",
                active.stageAction,
                " \xB7 \u4EA4\u4ED8\u7269\uFF1A",
                stages.find((s) => s.n === active.stage)?.deliver ?? "\u2014"
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { ...cardStyle, marginBottom: 16, background: C.brandSoft, borderColor: "#EBD9CF" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { fontSize: 13, fontWeight: 700, marginBottom: 8, display: "flex", alignItems: "center", gap: 7 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Icon, { name: "arrow", size: 14, color: C.brand }),
                  "\u63A8\u8FDB\u5230\u4E0B\u4E00\u9636\u6BB5"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "input",
                  {
                    style: { ...inputStyle, marginBottom: 9 },
                    placeholder: "\u672C\u6B21\u63A8\u8FDB\u7684\u5907\u6CE8\uFF08\u53EF\u7559\u7A7A\uFF09\uFF0C\u5982\uFF1A\u91CF\u623F\u5B8C\u6210\uFF0C\u6237\u578B\u5DF2\u5F52\u6863",
                    value: advanceNote,
                    onChange: (e) => setAdvanceNote(e.target.value)
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    Btn,
                    {
                      kind: "primary",
                      disabled: active.stage >= 9,
                      onClick: () => {
                        onAdvance(active.id, advanceNote);
                        setAdvanceNote("");
                      },
                      children: active.stage >= 9 ? "\u5DF2\u7ED3\u9879" : `\u63A8\u8FDB\u5230\u300C${stages[Math.min(8, active.stage)]?.name}\u300D`
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Btn, { onClick: () => onRender(active.id), children: "\u51FA\u6548\u679C\u56FE" }),
                  /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                    Btn,
                    {
                      kind: "danger",
                      onClick: () => {
                        onDelete(active.id);
                        closeDetail();
                      },
                      children: "\u5220\u9664\u9879\u76EE"
                    }
                  )
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 13, fontWeight: 700, margin: "0 0 10px" }, children: "\u5BA2\u6237\u6863\u6848" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                CustomerFields,
                {
                  value: active,
                  onChange: (patch) => {
                    const customer = { id: active.customerId, ...patch };
                    onSave({ project: { id: active.id }, customer, silent: true });
                  },
                  narrow
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 13, fontWeight: 700, margin: "18px 0 10px" }, children: "\u9879\u76EE\u4FE1\u606F" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: "0 14px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u9879\u76EE\u540D", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    defaultValue: active.name,
                    onBlur: (e) => onSave({ project: { id: active.id, name: e.target.value }, silent: true })
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Field, { label: "\u5408\u540C\u91D1\u989D\uFF08\u5143\uFF09", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    type: "number",
                    defaultValue: active.amount ?? "",
                    onBlur: (e) => onSave({ project: { id: active.id, amount: Number(e.target.value) }, silent: true })
                  }
                ) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { fontSize: 13, fontWeight: 700, margin: "18px 0 10px" }, children: [
                "\u9879\u76EE\u6D41\u6C34 ",
                /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("span", { style: { fontWeight: 400, color: C.ink3, fontSize: 12 }, children: [
                  "\uFF08",
                  active.logs?.length ?? 0,
                  " \u6761\uFF09"
                ] })
              ] }),
              active.logs?.length ? /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { borderLeft: `2px solid ${C.line}`, paddingLeft: 14 }, children: [...active.logs].reverse().map((log, i) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { style: { marginBottom: 10 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 12.5, color: C.ink }, children: log.text }),
                /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 11, color: C.ink3, marginTop: 2 }, children: String(log.at).slice(0, 19).replace("T", " ") })
              ] }, i)) }) : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(Empty, { text: "\u8FD8\u6CA1\u6709\u6D41\u6C34\u8BB0\u5F55" }),
              /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { style: { fontSize: 11.5, color: C.ink3, marginTop: 14, lineHeight: 1.8, borderTop: `1px solid ${C.line}`, paddingTop: 12 }, children: "\u63D0\u793A\uFF1A\u5BA2\u6237\u6863\u6848\u4E0E\u9879\u76EE\u5B57\u6BB5\u7684\u6539\u52A8\u5728\u5931\u7126\u65F6\u81EA\u52A8\u4FDD\u5B58\uFF0C\u4E0D\u9700\u8981\u70B9\u4FDD\u5B58\u6309\u94AE\u3002" })
            ]
          }
        )
      }
    ) : null
  ] });
}

// src/client/Renders.tsx
var import_react3 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
var SPACES = ["\u5BA2\u5385", "\u9910\u5385", "\u4E3B\u5367", "\u6B21\u5367", "\u513F\u7AE5\u623F", "\u4E66\u623F", "\u53A8\u623F", "\u536B\u751F\u95F4", "\u7384\u5173", "\u9633\u53F0", "\u5168\u5C4B"];
var STYLES = ["\u73B0\u4EE3\u7B80\u7EA6", "\u5976\u6CB9\u98CE", "\u65B0\u4E2D\u5F0F", "\u4F98\u5BC2\u98CE", "\u6CD5\u5F0F", "\u8F7B\u5962", "\u539F\u6728\u98CE", "\u5DE5\u4E1A\u98CE", "\u65E5\u5F0F", "\u7F8E\u5F0F"];
var LIGHTS = ["\u81EA\u7136\u5149", "\u6696\u5149", "\u51B7\u5149", "\u591C\u666F", "\u65E0\u4E3B\u706F"];
function Thumb({
  renderId,
  index,
  auto,
  onZoom
}) {
  const [url, setUrl] = (0, import_react3.useState)("");
  const [err, setErr] = (0, import_react3.useState)("");
  const [loading, setLoading] = (0, import_react3.useState)(false);
  const load = async () => {
    if (url || loading) return;
    setLoading(true);
    try {
      const res = await api(
        `/render/image?renderId=${encodeURIComponent(renderId)}&index=${index}`
      );
      if (res.ok && res.dataUrl) setUrl(res.dataUrl);
      else setErr(res.error ?? "\u8BFB\u53D6\u5931\u8D25");
    } catch (e) {
      setErr(e?.message ?? "\u8BFB\u53D6\u5931\u8D25");
    } finally {
      setLoading(false);
    }
  };
  (0, import_react3.useEffect)(() => {
    if (auto) void load();
  }, [auto, renderId, index]);
  if (url) {
    return /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "img",
      {
        src: url,
        alt: "\u6548\u679C\u56FE",
        onClick: () => onZoom(url),
        style: {
          width: "100%",
          display: "block",
          borderRadius: R.sm,
          cursor: "zoom-in",
          border: `1px solid ${C.line}`
        }
      }
    );
  }
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
    "div",
    {
      style: {
        aspectRatio: "4 / 3",
        borderRadius: R.sm,
        border: `1px dashed ${C.line}`,
        background: "#FCFBF9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        padding: 8
      },
      children: [
        err ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: 11, color: C.danger, textAlign: "center", lineHeight: 1.6 }, children: err }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Btn, { onClick: load, disabled: loading, style: { padding: "4px 10px", fontSize: 12 }, children: loading ? "\u8BFB\u53D6\u4E2D\u2026" : "\u70B9\u51FB\u9884\u89C8" }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: 10.5, color: C.ink3 }, children: loading ? "" : err ? "" : "\u56FE\u7247\u8F83\u5927\uFF0C\u6309\u9700\u52A0\u8F7D" })
      ]
    }
  );
}
function Renders({
  projects,
  renders,
  jobs,
  comfy,
  ratios,
  focusProjectId,
  onClearFocus,
  onSubmit,
  onDelete,
  onGotoSettings
}) {
  const narrow = useIsNarrow();
  const [zoom, setZoom] = (0, import_react3.useState)("");
  const [autoLoad, setAutoLoad] = (0, import_react3.useState)(false);
  const [form, setForm] = (0, import_react3.useState)({
    projectId: "",
    space: "\u5BA2\u5385",
    style: "",
    materials: "",
    light: "\u81EA\u7136\u5149",
    ratio: "16:9",
    count: 1,
    seed: "",
    promptOverride: ""
  });
  const [advanced, setAdvanced] = (0, import_react3.useState)(false);
  (0, import_react3.useEffect)(() => {
    if (!focusProjectId) return;
    const p = projects.find((x) => x.id === focusProjectId);
    if (!p) return;
    setForm((f) => ({ ...f, projectId: p.id, style: p.style || f.style }));
  }, [focusProjectId]);
  const running = jobs.filter((j) => j.status === "queued" || j.status === "running");
  const activeProject = projects.find((p) => p.id === form.projectId);
  const blocked = !comfy?.ok || !comfy?.workflowReady;
  const submit = () => {
    onSubmit({
      projectId: form.projectId || void 0,
      projectLabel: activeProject?.name,
      space: form.space,
      style: form.style || activeProject?.style,
      materials: form.materials,
      light: form.light,
      ratio: form.ratio,
      count: Number(form.count) || 1,
      seed: form.seed === "" ? void 0 : Number(form.seed),
      promptOverride: form.promptOverride.trim() || void 0
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      "div",
      {
        style: {
          ...cardStyle,
          marginBottom: 14,
          background: blocked ? C.warnSoft : C.okSoft,
          borderColor: blocked ? "#EFDFB8" : "#D2E3D8",
          display: "flex",
          alignItems: "center",
          gap: 10,
          flexWrap: "wrap"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { name: comfy?.ok ? "online" : "offline", size: 15, color: blocked ? C.warn : C.ok }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { flex: 1, minWidth: 220 }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { fontSize: 13, fontWeight: 700, color: blocked ? C.warn : C.ok }, children: [
              "ComfyUI ",
              comfy?.ok ? "\u5DF2\u8FDE\u63A5" : "\u672A\u8FDE\u63A5"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { fontSize: 11.5, color: C.ink2, marginTop: 3, lineHeight: 1.7 }, children: [
              comfy?.message ?? "\u5C1A\u672A\u63A2\u6D3B",
              " ",
              comfy?.host ? `\xB7 ${comfy.host}` : ""
            ] })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Btn, { onClick: onGotoSettings, children: [
            /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { name: "settings", size: 13, color: C.ink2 }),
            "\u53BB\u914D\u7F6E"
          ] })
        ]
      }
    ),
    blocked ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { ...cardStyle, marginBottom: 14, fontSize: 12.5, color: C.ink2, lineHeight: 1.9 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { style: { color: C.ink }, children: "\u63A5\u5165\u4E09\u6B65\uFF1A" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("br", {}),
      "1. \u672C\u673A\u542F\u52A8 ComfyUI\uFF0C\u9ED8\u8BA4\u5730\u5740 http://127.0.0.1:8188",
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("br", {}),
      "2. \u5728 ComfyUI \u754C\u9762\u53F3\u4E0A\u89D2\u7528 ",
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("code", { style: { background: "#F4F0EA", padding: "1px 6px", borderRadius: 5 }, children: "Workflow \u2192 Export (API)" }),
      " \u5BFC\u51FA",
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("b", { children: " API \u683C\u5F0F" }),
      "\u7684\u5DE5\u4F5C\u6D41 JSON\uFF08\u666E\u901A UI \u683C\u5F0F\u4F1A\u76F4\u63A5\u63D0\u4EA4\u5931\u8D25\uFF0C\u8FD9\u662F\u6700\u5E38\u89C1\u7684\u5751\uFF09",
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("br", {}),
      "3. \u5230\u300C\u8BBE\u7F6E\u300D\u586B\u5199\u5DE5\u4F5C\u6D41\u8DEF\u5F84 + \u8282\u70B9\u6620\u5C04\uFF08\u6B63\u5411\u63D0\u793A\u8BCD\u8282\u70B9 / \u79CD\u5B50\u8282\u70B9 \u7B49\uFF09",
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("br", {}),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { color: C.ink3 }, children: "\u672A\u914D\u7F6E\u65F6\u5176\u4F59\u6A21\u5757\u5B8C\u5168\u4E0D\u53D7\u5F71\u54CD\uFF0C\u53EF\u4EE5\u6B63\u5E38\u7528\u4ECA\u65E5\u4E0E\u9879\u76EE\u3002" })
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { ...cardStyle, marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { fontSize: 13.5, fontWeight: 700, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { name: "sparkle", size: 15, color: C.brand }),
        "\u65B0\u5EFA\u51FA\u56FE"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr 1fr", gap: "0 14px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: "\u5173\u8054\u9879\u76EE", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
          "select",
          {
            style: inputStyle,
            value: form.projectId,
            onChange: (e) => {
              const p = projects.find((x) => x.id === e.target.value);
              setForm((f) => ({ ...f, projectId: e.target.value, style: p?.style || f.style }));
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: "", children: "\uFF08\u4E0D\u5173\u8054\u9879\u76EE\uFF09" }),
              projects.map((p) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: p.id, children: p.name }, p.id))
            ]
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: "\u7A7A\u95F4", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("select", { style: inputStyle, value: form.space, onChange: (e) => setForm((f) => ({ ...f, space: e.target.value })), children: SPACES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { children: s }, s)) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Field, { label: "\u98CE\u683C", hint: activeProject?.style ? `\u5DF2\u5E26\u5165\u9879\u76EE\u504F\u597D\uFF1A${activeProject.style}` : void 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            "input",
            {
              style: inputStyle,
              list: "dd-styles",
              value: form.style,
              placeholder: "\u5982 \u5976\u6CB9\u98CE",
              onChange: (e) => setForm((f) => ({ ...f, style: e.target.value }))
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("datalist", { id: "dd-styles", children: STYLES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { value: s }, s)) })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: "\u5149\u7167", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("select", { style: inputStyle, value: form.light, onChange: (e) => setForm((f) => ({ ...f, light: e.target.value })), children: LIGHTS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("option", { children: s }, s)) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: "\u51FA\u56FE\u6BD4\u4F8B", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("select", { style: inputStyle, value: form.ratio, onChange: (e) => setForm((f) => ({ ...f, ratio: e.target.value })), children: Object.keys(ratios).map((k) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("option", { value: k, children: [
          k,
          " \xB7 ",
          ratios[k].width,
          "\xD7",
          ratios[k].height
        ] }, k)) }) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: "\u5F20\u6570", hint: "1-8\uFF0C\u5F20\u6570\u8D8A\u591A\u8D8A\u6162", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            style: inputStyle,
            type: "number",
            min: 1,
            max: 8,
            inputMode: "numeric",
            value: form.count,
            onChange: (e) => setForm((f) => ({ ...f, count: Number(e.target.value) }))
          }
        ) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: "\u6750\u8D28\u5173\u952E\u8BCD", hint: "\u9017\u53F7\u5206\u9694\uFF0C\u5982\uFF1A\u80E1\u6843\u6728\u3001\u5FAE\u6C34\u6CE5\u3001\u4E9A\u9EBB\u5E03\u827A", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        "input",
        {
          style: inputStyle,
          value: form.materials,
          placeholder: "\u80E1\u6843\u6728\u3001\u5FAE\u6C34\u6CE5\u3001\u4E9A\u9EBB\u5E03\u827A",
          onChange: (e) => setForm((f) => ({ ...f, materials: e.target.value }))
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Btn, { kind: "quiet", onClick: () => setAdvanced((v) => !v), style: { padding: "2px 6px", fontSize: 12 }, children: advanced ? "\u6536\u8D77\u9AD8\u7EA7\u9009\u9879" : "\u5C55\u5F00\u9AD8\u7EA7\u9009\u9879" }),
      advanced ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: "0 14px", marginTop: 10 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: "\u79CD\u5B50\uFF08\u7559\u7A7A=\u968F\u673A\uFF09", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            style: inputStyle,
            type: "number",
            inputMode: "numeric",
            value: form.seed,
            placeholder: "\u56FA\u5B9A\u79CD\u5B50\u53EF\u590D\u73B0\u540C\u4E00\u5F20\u56FE",
            onChange: (e) => setForm((f) => ({ ...f, seed: e.target.value }))
          }
        ) }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Field, { label: "\u8986\u76D6\u63D0\u793A\u8BCD\uFF08\u7559\u7A7A=\u7528\u6A21\u677F\u62FC\u88C5\uFF09", hint: "\u586B\u4E86\u5C31\u76F4\u63A5\u7528\u8FD9\u6BB5\uFF0C\u5FFD\u7565\u4E0A\u9762\u7684\u7A7A\u95F4/\u98CE\u683C/\u6750\u8D28", children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "input",
          {
            style: inputStyle,
            value: form.promptOverride,
            onChange: (e) => setForm((f) => ({ ...f, promptOverride: e.target.value }))
          }
        ) })
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", gap: 8, marginTop: 6, flexWrap: "wrap", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(Btn, { kind: "primary", disabled: blocked, onClick: submit, style: { padding: "8px 18px" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { name: "sparkle", size: 13, color: "#fff" }),
          "\u63D0\u4EA4\u51FA\u56FE"
        ] }),
        focusProjectId ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Btn, { kind: "quiet", onClick: onClearFocus, style: { fontSize: 12 }, children: "\u53D6\u6D88\u9879\u76EE\u5E26\u5165" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: 11.5, color: C.ink3, marginLeft: "auto" }, children: "\u51FA\u56FE\u662F\u957F\u4EFB\u52A1\uFF0C\u63D0\u4EA4\u540E\u53EF\u7EE7\u7EED\u5E72\u6D3B\uFF0C\u53F3\u4FA7\u4F1A\u663E\u793A\u8FDB\u5EA6" })
      ] })
    ] }),
    running.length ? /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { ...cardStyle, marginBottom: 16 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { fontSize: 13, fontWeight: 700, marginBottom: 12 }, children: [
        "\u8FDB\u884C\u4E2D ",
        running.length,
        " \u4E2A"
      ] }),
      running.map((j) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { marginBottom: 12 }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Pill, { tone: "brand", children: j.status === "queued" ? "\u6392\u961F\u4E2D" : "\u751F\u6210\u4E2D" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: 12.5, color: C.ink2 }, children: j.message }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { style: { fontSize: 12, color: C.ink3, marginLeft: "auto" }, children: [
            j.progress,
            "%"
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Bar, { value: j.progress })
      ] }, j.jobId))
    ] }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, marginBottom: 12, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { style: { fontSize: 13.5, fontWeight: 700 }, children: "\u7ED3\u679C\u5899" }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Pill, { tone: "neutral", children: renders.length }),
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
        Btn,
        {
          kind: "quiet",
          onClick: () => setAutoLoad((v) => !v),
          style: { fontSize: 12, marginLeft: narrow ? 0 : "auto" },
          title: "\u81EA\u52A8\u52A0\u8F7D\u4F1A\u4E00\u6B21\u6027\u62C9\u53D6\u5168\u90E8\u56FE\u7247\uFF0C\u6570\u636E\u91CF\u8F83\u5927",
          children: autoLoad ? "\u5173\u95ED\u81EA\u52A8\u9884\u89C8" : "\u5F00\u542F\u81EA\u52A8\u9884\u89C8"
        }
      )
    ] }),
    !renders.length ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Empty, { text: "\u8FD8\u6CA1\u6709\u51FA\u56FE\u8BB0\u5F55\u3002\u914D\u7F6E\u597D ComfyUI \u540E\uFF0C\u5728\u4E0A\u9762\u586B\u53C2\u6570\u70B9\u300C\u63D0\u4EA4\u51FA\u56FE\u300D" }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { display: "grid", gridTemplateColumns: narrow ? "1fr" : "repeat(3, 1fr)", gap: 12 }, children: renders.map((r) => {
      const proj = projects.find((p) => p.id === r.projectId);
      return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { ...cardStyle, padding: "12px 13px" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 6, marginBottom: 8, flexWrap: "wrap" }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            Pill,
            {
              tone: r.status === "done" ? "ok" : r.status === "failed" ? "danger" : "warn",
              children: r.status === "done" ? "\u5DF2\u5B8C\u6210" : r.status === "failed" ? "\u5931\u8D25" : "\u8FDB\u884C\u4E2D"
            }
          ),
          proj ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Pill, { tone: "brand", children: proj.name }) : /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Pill, { tone: "neutral", children: "\u672A\u5173\u8054\u9879\u76EE" }),
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            Btn,
            {
              kind: "quiet",
              onClick: () => onDelete(r.id),
              style: { marginLeft: "auto", minWidth: 30, padding: "2px 6px" },
              title: "\u5220\u9664\u8BB0\u5F55",
              children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Icon, { name: "trash", size: 12, color: C.ink3 })
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { style: { fontSize: 11.5, color: C.ink2, marginBottom: 9, lineHeight: 1.7 }, children: [
          r.space ?? "\u2014",
          " \xB7 ",
          r.style || "\u2014",
          " \xB7 ",
          r.ratio ?? "",
          " ",
          r.width ? `${r.width}\xD7${r.height}` : "",
          r.seed !== void 0 ? ` \xB7 seed ${r.seed}` : ""
        ] }),
        r.status === "failed" && r.error ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "div",
          {
            style: {
              fontSize: 11.5,
              color: C.danger,
              background: C.dangerSoft,
              padding: "7px 9px",
              borderRadius: R.sm,
              marginBottom: 9,
              lineHeight: 1.7,
              wordBreak: "break-word"
            },
            children: r.error
          }
        ) : null,
        r.items?.length ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "div",
          {
            style: {
              display: "grid",
              gridTemplateColumns: r.items.length > 1 ? "1fr 1fr" : "1fr",
              gap: 8
            },
            children: r.items.map((it, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(Thumb, { renderId: r.id, index: i, auto: autoLoad, onZoom: setZoom }, `${r.id}-${i}`))
          }
        ) : null,
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
          "div",
          {
            style: {
              fontSize: 10.5,
              color: C.ink3,
              marginTop: 9,
              lineHeight: 1.6,
              maxHeight: 44,
              overflow: "hidden"
            },
            title: r.prompt,
            children: r.prompt
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { fontSize: 10.5, color: C.ink3, marginTop: 4 }, children: String(r.createdAt).slice(0, 19).replace("T", " ") })
      ] }, r.id);
    }) }),
    zoom ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "div",
      {
        onClick: () => setZoom(""),
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(20,18,16,.86)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 80,
          padding: 20,
          cursor: "zoom-out"
        },
        children: /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("img", { src: zoom, alt: "\u6548\u679C\u56FE\u5927\u56FE", style: { maxWidth: "100%", maxHeight: "100%", borderRadius: R.md } })
      }
    ) : null
  ] });
}

// src/client/Sites.tsx
var import_react4 = require("react");
var import_jsx_runtime5 = require("react/jsx-runtime");
var NODES = ["\u6C34\u7535", "\u74E6\u5DE5", "\u6728\u5DE5", "\u6CB9\u6F06", "\u5B89\u88C5", "\u9A8C\u6536"];
var STATUSES = ["\u5F85\u5DE1\u68C0", "\u8FDB\u884C\u4E2D", "\u901A\u8FC7", "\u9700\u6574\u6539"];
var STATUS_TONE = {
  \u5F85\u5DE1\u68C0: "neutral",
  \u8FDB\u884C\u4E2D: "warn",
  \u901A\u8FC7: "ok",
  \u9700\u6574\u6539: "danger"
};
var NEXT_STATUS = {
  \u5F85\u5DE1\u68C0: "\u8FDB\u884C\u4E2D",
  \u8FDB\u884C\u4E2D: "\u901A\u8FC7",
  \u901A\u8FC7: null,
  \u9700\u6574\u6539: "\u8FDB\u884C\u4E2D"
};
var BLANK = {
  projectId: "",
  node: "\u6C34\u7535",
  status: "\u5F85\u5DE1\u68C0",
  plannedAt: "",
  doneAt: "",
  note: ""
};
function todayYmd() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayDiff(a, b) {
  const pa = a.split("-").map(Number);
  const pb = b.split("-").map(Number);
  const da = new Date(pa[0], (pa[1] || 1) - 1, pa[2] || 1).getTime();
  const db = new Date(pb[0], (pb[1] || 1) - 1, pb[2] || 1).getTime();
  return Math.round((da - db) / 864e5);
}
function plannedText(plannedAt) {
  if (!plannedAt) return { text: "\u672A\u6392\u671F", tone: "neutral" };
  const d = dayDiff(plannedAt, todayYmd());
  if (d < 0) return { text: `\u903E\u671F ${Math.abs(d)} \u5929`, tone: "danger" };
  if (d === 0) return { text: "\u4ECA\u5929", tone: "warn" };
  return { text: `${d} \u5929\u540E`, tone: "neutral" };
}
function Sites({ projects, sites, onSave, onDelete }) {
  const narrow = useIsNarrow();
  const [projectFilter, setProjectFilter] = (0, import_react4.useState)("all");
  const [creating, setCreating] = (0, import_react4.useState)(false);
  const [draft, setDraft] = (0, import_react4.useState)({ ...BLANK });
  const [editingId, setEditingId] = (0, import_react4.useState)(null);
  const [noteDraft, setNoteDraft] = (0, import_react4.useState)({});
  const siteProjects = (0, import_react4.useMemo)(
    () => projects.filter((p) => p.stage === 7 || p.stage === 8),
    [projects]
  );
  const visible = (0, import_react4.useMemo)(() => {
    if (projectFilter === "all") return siteProjects;
    return siteProjects.filter((p) => p.id === projectFilter);
  }, [siteProjects, projectFilter]);
  const visibleHasRows = (0, import_react4.useMemo)(() => {
    const ids = new Set(visible.map((p) => p.id));
    return sites.some((s) => ids.has(s.projectId));
  }, [visible, sites]);
  const stats = (0, import_react4.useMemo)(() => {
    const all = sites;
    return {
      total: all.length,
      pending: all.filter((s) => s.status === "\u5F85\u5DE1\u68C0").length,
      doing: all.filter((s) => s.status === "\u8FDB\u884C\u4E2D").length,
      bad: all.filter((s) => s.status === "\u9700\u6574\u6539").length,
      overdue: all.filter((s) => s.status !== "\u901A\u8FC7" && s.plannedAt && dayDiff(s.plannedAt, todayYmd()) < 0).length
    };
  }, [sites]);
  const submitCreate = () => {
    if (!draft.projectId) return;
    onSave({
      projectId: draft.projectId,
      node: draft.node,
      status: draft.status,
      plannedAt: draft.plannedAt || void 0,
      doneAt: draft.status === "\u901A\u8FC7" ? todayYmd() : draft.doneAt || void 0,
      note: draft.note
    });
    setDraft({ ...BLANK });
    setCreating(false);
  };
  const cycle = (s) => {
    const next = NEXT_STATUS[s.status];
    if (!next) return;
    onSave({
      id: s.id,
      status: next,
      doneAt: next === "\u901A\u8FC7" ? todayYmd() : void 0,
      // 整改后回到进行中，把完成日清掉，等真正通过再写
      ...next === "\u8FDB\u884C\u4E2D" ? { doneAt: void 0 } : {}
    });
  };
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
      "div",
      {
        style: {
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 14,
          flexWrap: "wrap"
        },
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Btn, { kind: "primary", onClick: () => setCreating(true), disabled: !projects.length, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { name: "plus", size: 13, color: "#fff" }),
            "\u767B\u8BB0\u5DE1\u68C0"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
            "select",
            {
              value: projectFilter,
              onChange: (e) => setProjectFilter(e.target.value),
              style: {
                ...inputStyle,
                width: narrow ? "100%" : 220,
                fontSize: 13,
                padding: "7px 10px"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("option", { value: "all", children: [
                  "\u5168\u90E8\u65BD\u5DE5\u4E2D\u9879\u76EE\uFF08",
                  siteProjects.length,
                  "\uFF09"
                ] }),
                siteProjects.map((p) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: p.id, children: p.name }, p.id))
              ]
            }
          ),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", gap: 6, marginLeft: narrow ? 0 : "auto", flexWrap: "wrap" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Pill, { tone: "neutral", children: [
              "\u5171 ",
              stats.total,
              " \u8282\u70B9"
            ] }),
            stats.doing ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Pill, { tone: "warn", children: [
              "\u8FDB\u884C\u4E2D ",
              stats.doing
            ] }) : null,
            stats.pending ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Pill, { tone: "neutral", children: [
              "\u5F85\u5DE1\u68C0 ",
              stats.pending
            ] }) : null,
            stats.bad ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Pill, { tone: "danger", children: [
              "\u9700\u6574\u6539 ",
              stats.bad
            ] }) : null,
            stats.overdue ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Pill, { tone: "danger", children: [
              "\u903E\u671F ",
              stats.overdue
            ] }) : null
          ] })
        ]
      }
    ),
    !projects.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Empty, { text: "\u8FD8\u6CA1\u6709\u9879\u76EE \u2014\u2014 \u5148\u53BB\u300C\u9879\u76EE\u300D\u9875\u5EFA\u6863\uFF0C\u8FDB\u4E86\u65BD\u5DE5\u9636\u6BB5\u624D\u80FD\u767B\u8BB0\u5DE1\u68C0" }) : !siteProjects.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Empty, { text: "\u5F53\u524D\u6CA1\u6709\u5904\u4E8E\u65BD\u5DE5 / \u5B89\u88C5\u9A8C\u6536\u9636\u6BB5\u7684\u9879\u76EE\u3002\u5DE1\u68C0\u53EA\u5728\u8FD9\u4E24\u4E2A\u9636\u6BB5\u6709\u610F\u4E49\uFF0C\u6240\u4EE5\u8FD9\u91CC\u4E0D\u663E\u793A\u5176\u4ED6\u9879\u76EE" }) : !sites.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Empty, { text: "\u8FD8\u6CA1\u6709\u5DE1\u68C0\u8BB0\u5F55\u3002\u70B9\u300C\u767B\u8BB0\u5DE1\u68C0\u300D\uFF0C\u4ECE\u6C34\u7535\u8282\u70B9\u5F00\u59CB\u6309\u987A\u5E8F\u63A8\u8FDB" }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { display: "grid", gap: 12 }, children: visible.map((p) => {
      const mine = sites.filter((s) => s.projectId === p.id);
      const byNode = new Map(mine.map((s) => [s.node, s]));
      const passed = mine.filter((s) => s.status === "\u901A\u8FC7").length;
      const bad = mine.filter((s) => s.status === "\u9700\u6574\u6539").length;
      return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: cardStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: `1px solid ${C.lineSoft}`
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { name: "build", size: 15, color: C.brand }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 14.5, fontWeight: 700 }, children: p.name }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { fontSize: 11.5, color: C.ink2 }, children: [
                p.customerName,
                " \xB7 ",
                p.stageName
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap" }, children: [
                bad ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Pill, { tone: "danger", children: [
                  "\u9700\u6574\u6539 ",
                  bad
                ] }) : null,
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(Pill, { tone: passed === mine.length && mine.length ? "ok" : "neutral", children: [
                  passed,
                  "/",
                  mine.length || 0,
                  " \u5DF2\u901A\u8FC7"
                ] })
              ] })
            ]
          }
        ),
        !mine.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 12, color: C.ink3, padding: "8px 0" }, children: "\u8FD9\u4E2A\u9879\u76EE\u8FD8\u6CA1\u6709\u5DE1\u68C0\u8BB0\u5F55" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 4 }, children: NODES.map((node) => {
          const s = byNode.get(node);
          if (!s) {
            return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              "div",
              {
                style: {
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 10px",
                  borderRadius: R.sm,
                  border: `1px dashed ${C.line}`,
                  fontSize: 12,
                  color: C.ink3
                },
                children: node
              },
              node
            );
          }
          const plan = plannedText(s.plannedAt);
          const tone = STATUS_TONE[s.status];
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
            "div",
            {
              style: {
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 10px",
                borderRadius: R.sm,
                border: `1px solid ${tone === "danger" ? "#E6BCB2" : tone === "ok" ? "#CFE0D5" : tone === "warn" ? "#EBD9CF" : C.line}`,
                background: tone === "danger" ? C.dangerSoft : tone === "ok" ? C.okSoft : tone === "warn" ? C.warnSoft : "#fff"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 12, fontWeight: 700, color: C.ink }, children: node }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Pill, { tone, children: s.status }),
                s.status !== "\u901A\u8FC7" && s.plannedAt ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                  "span",
                  {
                    style: {
                      fontSize: 11,
                      fontWeight: 600,
                      color: plan.tone === "danger" ? C.danger : plan.tone === "warn" ? C.warn : C.ink3
                    },
                    children: plan.text
                  }
                ) : null
              ]
            },
            node
          );
        }) }),
        mine.map((s) => {
          const plan = plannedText(s.plannedAt);
          const isEditing = editingId === s.id;
          const noteValue = isEditing ? noteDraft[s.id] ?? s.note ?? "" : s.note ?? "";
          return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
            "div",
            {
              style: {
                padding: "11px 0",
                borderTop: `1px solid ${C.lineSoft}`,
                display: "flex",
                flexDirection: narrow ? "column" : "row",
                gap: narrow ? 8 : 12,
                alignItems: narrow ? "stretch" : "center"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { flex: 1, minWidth: 0 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 13, fontWeight: 700 }, children: s.node }),
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Pill, { tone: STATUS_TONE[s.status], children: s.status }),
                    s.status !== "\u901A\u8FC7" && s.plannedAt ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
                      "span",
                      {
                        style: {
                          fontSize: 11.5,
                          fontWeight: 600,
                          color: plan.tone === "danger" ? C.danger : plan.tone === "warn" ? C.warn : C.ink2
                        },
                        children: [
                          "\u8BA1\u5212 ",
                          s.plannedAt,
                          " \xB7 ",
                          plan.text
                        ]
                      }
                    ) : null,
                    s.doneAt ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { fontSize: 11.5, color: C.ok }, children: [
                      "\u5B8C\u6210 ",
                      s.doneAt
                    ] }) : null,
                    s.photos?.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("span", { style: { fontSize: 11.5, color: C.ink2 }, children: [
                      "\u7167\u7247 ",
                      s.photos.length
                    ] }) : null
                  ] }),
                  isEditing ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                    "textarea",
                    {
                      value: noteValue,
                      autoFocus: true,
                      placeholder: "\u5DE1\u68C0\u7ED3\u8BBA / \u6574\u6539\u8981\u6C42\uFF0C\u5982\uFF1A\u74F7\u7816\u7A7A\u9F13\u7387\u504F\u9AD8\uFF0C\u9700\u5C40\u90E8\u8FD4\u5DE5",
                      onChange: (e) => setNoteDraft((d) => ({ ...d, [s.id]: e.target.value })),
                      style: {
                        ...inputStyle,
                        marginTop: 8,
                        minHeight: 62,
                        fontSize: 13,
                        lineHeight: 1.6,
                        resize: "vertical"
                      }
                    }
                  ) : s.note ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 12, color: C.ink2, marginTop: 5, lineHeight: 1.7 }, children: s.note }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 12, color: C.ink3, marginTop: 4 }, children: "\u8FD8\u6CA1\u5199\u5DE1\u68C0\u7ED3\u8BBA" })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [
                  NEXT_STATUS[s.status] ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Btn, { kind: "primary", onClick: () => cycle(s), style: { padding: "5px 11px", fontSize: 12.5 }, children: s.status === "\u9700\u6574\u6539" ? "\u6574\u6539\u4E2D" : `\u6807\u4E3A${NEXT_STATUS[s.status]}` }) : null,
                  isEditing ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                      Btn,
                      {
                        kind: "primary",
                        onClick: () => {
                          onSave({ id: s.id, note: noteValue });
                          setEditingId(null);
                        },
                        style: { padding: "5px 11px", fontSize: 12.5 },
                        children: "\u4FDD\u5B58"
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Btn, { onClick: () => setEditingId(null), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u53D6\u6D88" })
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                    Btn,
                    {
                      onClick: () => {
                        setEditingId(s.id);
                        setNoteDraft((d) => ({ ...d, [s.id]: s.note ?? "" }));
                      },
                      style: { padding: "5px 11px", fontSize: 12.5 },
                      children: "\u8BB0\u7ED3\u8BBA"
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                    "select",
                    {
                      value: s.status,
                      onChange: (e) => {
                        const next = e.target.value;
                        onSave({
                          id: s.id,
                          status: next,
                          doneAt: next === "\u901A\u8FC7" ? todayYmd() : void 0
                        });
                      },
                      style: {
                        ...inputStyle,
                        width: "auto",
                        fontSize: 12,
                        padding: "5px 8px",
                        minHeight: 30
                      },
                      children: STATUSES.map((x) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: x, children: x }, x))
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Btn, { kind: "danger", onClick: () => onDelete(s.id), style: { padding: "5px 9px" }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { name: "trash", size: 12.5, color: C.danger }) })
                ] })
              ]
            },
            s.id
          );
        })
      ] }, p.id);
    }) }),
    !visibleHasRows ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Empty, { text: "\u8FD9\u4E9B\u9879\u76EE\u8FD8\u6CA1\u6709\u5DE1\u68C0\u8BB0\u5F55\u3002\u70B9\u300C\u767B\u8BB0\u5DE1\u68C0\u300D\uFF0C\u4ECE\u6C34\u7535\u8282\u70B9\u5F00\u59CB\u6309\u987A\u5E8F\u63A8\u8FDB" }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 11.5, color: C.ink3, marginTop: 12, lineHeight: 1.8 }, children: "\u516D\u4E2A\u8282\u70B9\u6309\u65BD\u5DE5\u987A\u5E8F\u6392\u5217\u3002\u5DE1\u68C0\u6CA1\u505A\u5B8C\u4E0D\u4F1A\u81EA\u52A8\u751F\u6210\u5F85\u529E \u2014\u2014 \u9700\u8981\u63D0\u9192\u7684\u8BDD\uFF0C\u628A\u300C\u4E0B\u6B21\u5DE5\u5730\u5DE1\u68C0\u300D\u90A3\u6761\u5F85\u529E\u7559\u7740\u522B\u5B8C\u6210\u3002" }),
    creating ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(31,29,26,.35)",
          display: "flex",
          alignItems: narrow ? "flex-end" : "center",
          justifyContent: "center",
          zIndex: 60,
          padding: narrow ? 0 : 20
        },
        onClick: () => setCreating(false),
        children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              background: C.bg,
              width: narrow ? "100%" : 520,
              maxHeight: narrow ? "92vh" : "86vh",
              overflowY: "auto",
              borderRadius: narrow ? "14px 14px 0 0" : R.lg,
              padding: narrow ? "18px 16px calc(18px + env(safe-area-inset-bottom))" : "22px 24px",
              boxShadow: "0 12px 40px rgba(0,0,0,.18)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "flex", alignItems: "center", marginBottom: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { style: { fontSize: 16, fontWeight: 700 }, children: "\u767B\u8BB0\u5DE1\u68C0" }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Btn, { kind: "quiet", onClick: () => setCreating(false), style: { marginLeft: "auto", minWidth: 34 }, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Icon, { name: "close", size: 14, color: C.ink2 }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { style: { fontSize: 12.5, color: C.ink2, marginBottom: 16, lineHeight: 1.7 }, children: "\u4E00\u6B21\u767B\u8BB0\u4E00\u4E2A\u8282\u70B9\u3002\u540C\u4E00\u4E2A\u9879\u76EE\u7684\u540C\u4E00\u4E2A\u8282\u70B9\u53EA\u4FDD\u7559\u4E00\u6761\u8BB0\u5F55\uFF0C\u91CD\u590D\u767B\u8BB0\u4F1A\u8986\u76D6\u3002" }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Field, { label: "\u6240\u5C5E\u9879\u76EE *", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
                "select",
                {
                  value: draft.projectId,
                  onChange: (e) => setDraft((d) => ({ ...d, projectId: e.target.value })),
                  style: inputStyle,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: "", children: "\u8BF7\u9009\u62E9\u9879\u76EE" }),
                    projects.map((p) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("option", { value: p.id, children: [
                      p.name,
                      "\uFF08",
                      p.stageName,
                      "\uFF09"
                    ] }, p.id))
                  ]
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { style: { display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: "0 14px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Field, { label: "\u5DE1\u68C0\u8282\u70B9", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                  "select",
                  {
                    value: draft.node,
                    onChange: (e) => setDraft((d) => ({ ...d, node: e.target.value })),
                    style: inputStyle,
                    children: NODES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: n, children: n }, n))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Field, { label: "\u521D\u59CB\u72B6\u6001", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                  "select",
                  {
                    value: draft.status,
                    onChange: (e) => setDraft((d) => ({ ...d, status: e.target.value })),
                    style: inputStyle,
                    children: STATUSES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("option", { value: s, children: s }, s))
                  }
                ) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Field, { label: "\u8BA1\u5212\u5DE1\u68C0\u65E5", hint: "\u7559\u7A7A\u8868\u793A\u672A\u6392\u671F\u3002\u6392\u4E86\u671F\u4E14\u903E\u671F\u4F1A\u6807\u7EA2\u63D0\u793A\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                "input",
                {
                  style: inputStyle,
                  type: "date",
                  value: draft.plannedAt,
                  onChange: (e) => setDraft((d) => ({ ...d, plannedAt: e.target.value }))
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Field, { label: "\u5DE1\u68C0\u7ED3\u8BBA", hint: "\u5982\uFF1A\u5F00\u69FD\u89C4\u8303\uFF0C\u6253\u538B\u6D4B\u8BD5\u5408\u683C", children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
                "textarea",
                {
                  style: { ...inputStyle, minHeight: 72, fontSize: 13, lineHeight: 1.6, resize: "vertical" },
                  value: draft.note,
                  onChange: (e) => setDraft((d) => ({ ...d, note: e.target.value }))
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    paddingTop: 14,
                    borderTop: `1px solid ${C.line}`
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Btn, { onClick: () => setCreating(false), children: "\u53D6\u6D88" }),
                    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Btn, { kind: "primary", onClick: submitCreate, disabled: !draft.projectId, children: "\u767B\u8BB0" })
                  ]
                }
              )
            ]
          }
        )
      }
    ) : null
  ] });
}

// src/client/Materials.tsx
var import_react5 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
var STATUSES2 = ["\u5F85\u4E0B\u5355", "\u5DF2\u4E0B\u5355", "\u5728\u9014", "\u5DF2\u5230\u573A", "\u5DF2\u9A8C\u6536"];
var STATUS_TONE2 = {
  \u5F85\u4E0B\u5355: "neutral",
  \u5DF2\u4E0B\u5355: "warn",
  \u5728\u9014: "warn",
  \u5DF2\u5230\u573A: "brand",
  \u5DF2\u9A8C\u6536: "ok"
};
var NEXT_STATUS2 = {
  \u5F85\u4E0B\u5355: "\u5DF2\u4E0B\u5355",
  \u5DF2\u4E0B\u5355: "\u5728\u9014",
  \u5728\u9014: "\u5DF2\u5230\u573A",
  \u5DF2\u5230\u573A: "\u5DF2\u9A8C\u6536",
  \u5DF2\u9A8C\u6536: null
};
var CATEGORIES = ["\u74F7\u7816", "\u5730\u677F", "\u6A71\u67DC", "\u6D82\u6599", "\u7535\u5668", "\u536B\u6D74", "\u95E8\u7A97", "\u706F\u5177", "\u5BB6\u5177", "\u8F6F\u88C5", "\u5176\u4ED6"];
var BLANK2 = {
  projectId: "",
  name: "",
  category: "\u74F7\u7816",
  brand: "",
  spec: "",
  price: "",
  qty: "",
  unit: "",
  supplier: "",
  arriveAt: "",
  status: "\u5F85\u4E0B\u5355",
  note: ""
};
function todayYmd2() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function dayDiff2(a, b) {
  const pa = a.split("-").map(Number);
  const pb = b.split("-").map(Number);
  const da = new Date(pa[0], (pa[1] || 1) - 1, pa[2] || 1).getTime();
  const db = new Date(pb[0], (pb[1] || 1) - 1, pb[2] || 1).getTime();
  return Math.round((da - db) / 864e5);
}
function arriveText(arriveAt) {
  if (!arriveAt) return { text: "\u672A\u6392\u671F", tone: "neutral" };
  const d = dayDiff2(arriveAt, todayYmd2());
  if (d < 0) return { text: `\u5DF2\u903E\u671F ${Math.abs(d)} \u5929`, tone: "danger" };
  if (d === 0) return { text: "\u4ECA\u5929\u8FDB\u573A", tone: "warn" };
  if (d <= 3) return { text: `${d} \u5929\u540E\u8FDB\u573A`, tone: "warn" };
  return { text: `${d} \u5929\u540E\u8FDB\u573A`, tone: "ok" };
}
function Materials({ projects, materials, onSave, onDelete }) {
  const narrow = useIsNarrow();
  const [projectFilter, setProjectFilter] = (0, import_react5.useState)("all");
  const [statusFilter, setStatusFilter] = (0, import_react5.useState)("all");
  const [creating, setCreating] = (0, import_react5.useState)(false);
  const [draft, setDraft] = (0, import_react5.useState)({ ...BLANK2 });
  const [editingId, setEditingId] = (0, import_react5.useState)(null);
  const [form, setForm] = (0, import_react5.useState)({});
  const tracked = (0, import_react5.useMemo)(
    () => projects.filter((p) => p.stage >= 5),
    [projects]
  );
  const visibleProjects = (0, import_react5.useMemo)(() => {
    if (projectFilter === "all") return tracked;
    return tracked.filter((p) => p.id === projectFilter);
  }, [tracked, projectFilter]);
  const rowsOf = (0, import_react5.useMemo)(() => {
    const map = /* @__PURE__ */ new Map();
    for (const p of visibleProjects) {
      let list = materials.filter((m) => m.projectId === p.id);
      if (statusFilter !== "all") list = list.filter((m) => m.status === statusFilter);
      map.set(p.id, list);
    }
    return map;
  }, [visibleProjects, materials, statusFilter]);
  const stats = (0, import_react5.useMemo)(() => {
    const byStatus = {};
    for (const s of STATUSES2) byStatus[s] = 0;
    let spend = 0;
    let urgent = 0;
    for (const m of materials) {
      byStatus[m.status] = (byStatus[m.status] ?? 0) + 1;
      if (m.status !== "\u5F85\u4E0B\u5355" && m.price) spend += m.price;
      if (m.status !== "\u5DF2\u9A8C\u6536" && m.arriveAt && dayDiff2(m.arriveAt, todayYmd2()) < 0) urgent += 1;
    }
    return { byStatus, spend, urgent, total: materials.length };
  }, [materials]);
  const startEdit = (m) => {
    setEditingId(m.id);
    setForm({
      name: m.name ?? "",
      category: m.category ?? "",
      brand: m.brand ?? "",
      spec: m.spec ?? "",
      price: m.price ?? "",
      qty: m.qty ?? "",
      unit: m.unit ?? "",
      supplier: m.supplier ?? "",
      arriveAt: m.arriveAt ?? "",
      note: m.note ?? ""
    });
  };
  const submitEdit = (m) => {
    const f = form[m.id] ?? {};
    onSave({
      id: m.id,
      name: String(f.name ?? "").trim() || m.name,
      category: f.category ?? "",
      brand: f.brand ?? "",
      spec: f.spec ?? "",
      price: f.price === "" ? void 0 : Number(f.price),
      qty: f.qty === "" ? void 0 : Number(f.qty),
      unit: f.unit ?? "",
      supplier: f.supplier ?? "",
      arriveAt: f.arriveAt || void 0,
      note: f.note ?? ""
    });
    setEditingId(null);
  };
  const submitCreate = () => {
    if (!draft.projectId || !draft.name.trim()) return;
    onSave({ ...draft, name: draft.name.trim(), arriveAt: draft.arriveAt || void 0 });
    setDraft({ ...BLANK2 });
    setCreating(false);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Btn, { kind: "primary", onClick: () => setCreating(true), disabled: !projects.length, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { name: "plus", size: 13, color: "#fff" }),
        "\u767B\u8BB0\u6750\u6599"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "select",
        {
          value: projectFilter,
          onChange: (e) => setProjectFilter(e.target.value),
          style: { ...inputStyle, width: narrow ? "100%" : 200, fontSize: 13, padding: "7px 10px" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("option", { value: "all", children: [
              "\u5168\u90E8\u5728\u7BA1\u9879\u76EE\uFF08",
              tracked.length,
              "\uFF09"
            ] }),
            tracked.map((p) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: p.id, children: p.name }, p.id))
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
        "select",
        {
          value: statusFilter,
          onChange: (e) => setStatusFilter(e.target.value),
          style: { ...inputStyle, width: narrow ? "100%" : 150, fontSize: 13, padding: "7px 10px" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: "all", children: "\u5168\u90E8\u72B6\u6001" }),
            STATUSES2.map((s) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("option", { value: s, children: [
              s,
              "\uFF08",
              stats.byStatus[s] ?? 0,
              "\uFF09"
            ] }, s))
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: 6, marginLeft: narrow ? 0 : "auto", flexWrap: "wrap", alignItems: "center" }, children: [
        stats.urgent ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Pill, { tone: "danger", children: [
          "\u8FDB\u573A\u903E\u671F ",
          stats.urgent
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { fontSize: 12, color: C.ink2 }, children: [
          "\u5DF2\u6295\u5165 ",
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("b", { style: { color: C.ink }, children: money(stats.spend) })
        ] })
      ] })
    ] }),
    !projects.length ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Empty, { text: "\u8FD8\u6CA1\u6709\u9879\u76EE \u2014\u2014 \u5148\u53BB\u300C\u9879\u76EE\u300D\u9875\u5EFA\u6863\uFF0C\u7B7E\u7EA6\u4E4B\u540E\u624D\u80FD\u6302\u6750\u6599" }) : !tracked.length ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Empty, { text: "\u5F53\u524D\u6CA1\u6709\u5904\u4E8E\u7B7E\u7EA6\u53CA\u4E4B\u540E\u9636\u6BB5\u7684\u9879\u76EE\u3002\u6750\u6599\u4ECE\u300C\u9009\u6750\u6DF1\u5316\u300D\u5F00\u59CB\u624D\u6709\u610F\u4E49\uFF0C\u6240\u4EE5\u8FD9\u91CC\u4E0D\u663E\u793A\u66F4\u65E9\u7684\u9879\u76EE" }) : null,
    tracked.length ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { display: "grid", gap: 12 }, children: visibleProjects.map((p) => {
      const rows = rowsOf.get(p.id) ?? [];
      const all = materials.filter((m) => m.projectId === p.id);
      const done = all.filter((m) => m.status === "\u5DF2\u9A8C\u6536").length;
      const urgent = rows.filter((m) => m.status !== "\u5DF2\u9A8C\u6536" && m.arriveAt && dayDiff2(m.arriveAt, todayYmd2()) < 0);
      const subtotal = all.reduce((sum, m) => sum + (m.price ?? 0), 0);
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: cardStyle, children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "div",
          {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 12,
              paddingBottom: 10,
              borderBottom: `1px solid ${C.lineSoft}`
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { name: "box", size: 15, color: C.brand }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 14.5, fontWeight: 700 }, children: p.name }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { style: { fontSize: 11.5, color: C.ink2 }, children: [
                p.customerName,
                " \xB7 ",
                p.stageName
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: 6, marginLeft: "auto", flexWrap: "wrap", alignItems: "center" }, children: [
                urgent.length ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Pill, { tone: "danger", children: [
                  "\u903E\u671F ",
                  urgent.length
                ] }) : null,
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(Pill, { tone: "ok", children: [
                  done,
                  "/",
                  all.length,
                  " \u5DF2\u9A8C\u6536"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 12, color: C.ink2 }, children: money(subtotal) })
              ] })
            ]
          }
        ),
        !rows.length ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 12, color: C.ink3, padding: "8px 0" }, children: statusFilter === "all" ? "\u8FD9\u4E2A\u9879\u76EE\u8FD8\u6CA1\u6709\u767B\u8BB0\u6750\u6599" : `\u6CA1\u6709\u72B6\u6001\u4E3A\u300C${statusFilter}\u300D\u7684\u6750\u6599` }) : null,
        rows.map((m) => {
          const isEditing = editingId === m.id;
          const f = isEditing ? form[m.id] ?? {} : null;
          const arr = arriveText(m.arriveAt);
          return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
            "div",
            {
              style: {
                padding: "11px 0",
                borderTop: `1px solid ${C.lineSoft}`,
                display: "flex",
                flexDirection: narrow ? "column" : "row",
                gap: narrow ? 10 : 12,
                alignItems: narrow ? "stretch" : "flex-start"
              },
              children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { flex: 1, minWidth: 0 }, children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "grid", gridTemplateColumns: narrow ? "1fr" : "2fr 1fr 1fr", gap: 10 }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u540D\u79F0 *", style: { marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "input",
                    {
                      style: inputStyle,
                      value: f.name ?? "",
                      onChange: (e) => setForm((s) => ({ ...s, [m.id]: { ...f, name: e.target.value } }))
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u5206\u7C7B", style: { marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "input",
                    {
                      style: inputStyle,
                      value: f.category ?? "",
                      onChange: (e) => setForm((s) => ({ ...s, [m.id]: { ...f, category: e.target.value } }))
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u54C1\u724C", style: { marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "input",
                    {
                      style: inputStyle,
                      value: f.brand ?? "",
                      onChange: (e) => setForm((s) => ({ ...s, [m.id]: { ...f, brand: e.target.value } }))
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u89C4\u683C", style: { marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "input",
                    {
                      style: inputStyle,
                      value: f.spec ?? "",
                      onChange: (e) => setForm((s) => ({ ...s, [m.id]: { ...f, spec: e.target.value } }))
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u91D1\u989D\uFF08\u5143\uFF09", style: { marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "input",
                    {
                      style: inputStyle,
                      type: "number",
                      value: f.price ?? "",
                      onChange: (e) => setForm((s) => ({ ...s, [m.id]: { ...f, price: e.target.value } }))
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u6570\u91CF", style: { marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "input",
                    {
                      style: inputStyle,
                      type: "number",
                      value: f.qty ?? "",
                      onChange: (e) => setForm((s) => ({ ...s, [m.id]: { ...f, qty: e.target.value } }))
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u5355\u4F4D", style: { marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "input",
                    {
                      style: inputStyle,
                      placeholder: "\u6279 / \u5957 / \u33A1",
                      value: f.unit ?? "",
                      onChange: (e) => setForm((s) => ({ ...s, [m.id]: { ...f, unit: e.target.value } }))
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u4F9B\u5E94\u5546", style: { marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "input",
                    {
                      style: inputStyle,
                      value: f.supplier ?? "",
                      onChange: (e) => setForm((s) => ({ ...s, [m.id]: { ...f, supplier: e.target.value } }))
                    }
                  ) }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u8BA1\u5212\u8FDB\u573A\u65E5", style: { marginBottom: 8 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    "input",
                    {
                      style: inputStyle,
                      type: "date",
                      value: f.arriveAt ?? "",
                      onChange: (e) => setForm((s) => ({ ...s, [m.id]: { ...f, arriveAt: e.target.value } }))
                    }
                  ) })
                ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: 7, alignItems: "center", flexWrap: "wrap" }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 13.5, fontWeight: 700 }, children: m.name }),
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Pill, { tone: STATUS_TONE2[m.status], children: m.status }),
                    m.category ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 11.5, color: C.ink2 }, children: m.category }) : null
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { fontSize: 11.5, color: C.ink2, marginTop: 5, lineHeight: 1.7 }, children: [
                    m.brand ? `${m.brand} \xB7 ` : "",
                    m.spec ?? "",
                    m.price ? ` \xB7 ${money(m.price)}` : "",
                    m.qty ? ` \xB7 ${m.qty}${m.unit ?? ""}` : "",
                    m.supplier ? ` \xB7 ${m.supplier}` : ""
                  ] }),
                  m.arriveAt ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
                    "div",
                    {
                      style: {
                        fontSize: 11.5,
                        fontWeight: 600,
                        marginTop: 4,
                        color: arr.tone === "danger" ? C.danger : arr.tone === "warn" ? C.warn : C.ink2
                      },
                      children: [
                        "\u8BA1\u5212 ",
                        m.arriveAt,
                        " \xB7 ",
                        arr.text
                      ]
                    }
                  ) : null,
                  m.note ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 11.5, color: C.ink3, marginTop: 4 }, children: m.note }) : null
                ] }) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap" }, children: [
                  NEXT_STATUS2[m.status] ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
                    Btn,
                    {
                      kind: "primary",
                      onClick: () => onSave({ id: m.id, status: NEXT_STATUS2[m.status] }),
                      style: { padding: "5px 11px", fontSize: 12.5 },
                      title: `\u63A8\u8FDB\u5230\u300C${NEXT_STATUS2[m.status]}\u300D`,
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { name: "arrow", size: 12.5, color: "#fff" }),
                        NEXT_STATUS2[m.status]
                      ]
                    }
                  ) : null,
                  isEditing ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Btn, { kind: "primary", onClick: () => submitEdit(m), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u4FDD\u5B58" }),
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Btn, { onClick: () => setEditingId(null), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u53D6\u6D88" })
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Btn, { onClick: () => startEdit(m), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u7F16\u8F91" }),
                  /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                    Btn,
                    {
                      kind: "danger",
                      onClick: () => onDelete(m.id),
                      style: { padding: "5px 9px" },
                      title: "\u5220\u9664\u8FD9\u6761\u6750\u6599",
                      children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { name: "trash", size: 12.5, color: C.danger })
                    }
                  )
                ] })
              ]
            },
            m.id
          );
        })
      ] }, p.id);
    }) }) : null,
    tracked.length && !materials.length ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Empty, { text: "\u8FD8\u6CA1\u6709\u767B\u8BB0\u4EFB\u4F55\u6750\u6599\u3002\u70B9\u300C\u767B\u8BB0\u6750\u6599\u300D\uFF0C\u4ECE\u74F7\u7816\u3001\u5730\u677F\u3001\u6A71\u67DC\u8FD9\u4E9B\u4E3B\u6750\u5F00\u59CB" }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 11.5, color: C.ink3, marginTop: 12, lineHeight: 1.8 }, children: "\u91D1\u989D\u5728\u300C\u5DF2\u4E0B\u5355\u300D\u4E4B\u540E\u8BA1\u5165\u5DF2\u6295\u5165\u3002\u8BA1\u5212\u8FDB\u573A\u65E5\u903E\u671F\u4F1A\u6807\u7EA2 \u2014\u2014 \u5DE5\u5730\u7B49\u6599\u662F\u6700\u5E38\u89C1\u7684\u5EF6\u671F\u539F\u56E0\u3002" }),
    creating ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(31,29,26,.35)",
          display: "flex",
          alignItems: narrow ? "flex-end" : "center",
          justifyContent: "center",
          zIndex: 60,
          padding: narrow ? 0 : 20
        },
        onClick: () => setCreating(false),
        children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              background: C.bg,
              width: narrow ? "100%" : 640,
              maxHeight: narrow ? "92vh" : "86vh",
              overflowY: "auto",
              borderRadius: narrow ? "14px 14px 0 0" : R.lg,
              padding: narrow ? "18px 16px calc(18px + env(safe-area-inset-bottom))" : "22px 24px",
              boxShadow: "0 12px 40px rgba(0,0,0,.18)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "flex", alignItems: "center", marginBottom: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { style: { fontSize: 16, fontWeight: 700 }, children: "\u767B\u8BB0\u6750\u6599" }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Btn, { kind: "quiet", onClick: () => setCreating(false), style: { marginLeft: "auto", minWidth: 34 }, children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { name: "close", size: 14, color: C.ink2 }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { style: { fontSize: 12.5, color: C.ink2, marginBottom: 16, lineHeight: 1.7 }, children: "\u767B\u8BB0\u540E\u7528\u300C\u63A8\u8FDB\u300D\u6309\u94AE\u4E00\u8DEF\u8D70\u5230\u5DF2\u9A8C\u6536\uFF0C\u4E0D\u7528\u56DE\u6765\u6539\u72B6\u6001\u3002" }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u6240\u5C5E\u9879\u76EE *", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
                "select",
                {
                  value: draft.projectId,
                  onChange: (e) => setDraft((d) => ({ ...d, projectId: e.target.value })),
                  style: inputStyle,
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: "", children: "\u8BF7\u9009\u62E9\u9879\u76EE" }),
                    projects.map((p) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("option", { value: p.id, children: [
                      p.name,
                      "\uFF08",
                      p.stageName,
                      "\uFF09"
                    ] }, p.id))
                  ]
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { style: { display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: "0 14px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u6750\u6599\u540D\u79F0 *", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    placeholder: "\u5982 \u5BA2\u5385\u5730\u7816",
                    value: draft.name,
                    onChange: (e) => setDraft((d) => ({ ...d, name: e.target.value }))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u5206\u7C7B", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "select",
                  {
                    value: draft.category,
                    onChange: (e) => setDraft((d) => ({ ...d, category: e.target.value })),
                    style: inputStyle,
                    children: CATEGORIES.map((c) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: c, children: c }, c))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u54C1\u724C", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    placeholder: "\u5982 \u9A6C\u53EF\u6CE2\u7F57",
                    value: draft.brand,
                    onChange: (e) => setDraft((d) => ({ ...d, brand: e.target.value }))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u89C4\u683C", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    placeholder: "\u5982 800\xD7800 \u67D4\u5149",
                    value: draft.spec,
                    onChange: (e) => setDraft((d) => ({ ...d, spec: e.target.value }))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u91D1\u989D\uFF08\u5143\uFF09", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    type: "number",
                    inputMode: "decimal",
                    value: draft.price,
                    onChange: (e) => setDraft((d) => ({ ...d, price: e.target.value }))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u6570\u91CF", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    type: "number",
                    inputMode: "decimal",
                    value: draft.qty,
                    onChange: (e) => setDraft((d) => ({ ...d, qty: e.target.value }))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u5355\u4F4D", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    placeholder: "\u6279 / \u5957 / \u33A1 / \u6A18",
                    value: draft.unit,
                    onChange: (e) => setDraft((d) => ({ ...d, unit: e.target.value }))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u4F9B\u5E94\u5546", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    placeholder: "\u5982 \u7EA2\u661F\u7F8E\u51EF\u9F99",
                    value: draft.supplier,
                    onChange: (e) => setDraft((d) => ({ ...d, supplier: e.target.value }))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u8BA1\u5212\u8FDB\u573A\u65E5", hint: "\u7559\u7A7A\u8868\u793A\u672A\u6392\u671F\u3002\u6392\u4E86\u671F\u4E14\u903E\u671F\u4F1A\u6807\u7EA2\u3002", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    type: "date",
                    value: draft.arriveAt,
                    onChange: (e) => setDraft((d) => ({ ...d, arriveAt: e.target.value }))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u521D\u59CB\u72B6\u6001", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                  "select",
                  {
                    value: draft.status,
                    onChange: (e) => setDraft((d) => ({ ...d, status: e.target.value })),
                    style: inputStyle,
                    children: STATUSES2.map((s) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("option", { value: s, children: s }, s))
                  }
                ) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Field, { label: "\u5907\u6CE8", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
                "input",
                {
                  style: inputStyle,
                  placeholder: "\u5982 \u9700\u73B0\u573A\u590D\u5C3A\uFF0C\u4E0B\u5355\u524D\u786E\u8BA4\u635F\u8017",
                  value: draft.note,
                  onChange: (e) => setDraft((d) => ({ ...d, note: e.target.value }))
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    paddingTop: 14,
                    borderTop: `1px solid ${C.line}`
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Btn, { onClick: () => setCreating(false), children: "\u53D6\u6D88" }),
                    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Btn, { kind: "primary", onClick: submitCreate, disabled: !draft.projectId || !draft.name.trim(), children: "\u767B\u8BB0" })
                  ]
                }
              )
            ]
          }
        )
      }
    ) : null
  ] });
}

// src/client/RefImages.tsx
var import_react6 = require("react");
var import_jsx_runtime7 = require("react/jsx-runtime");
var SOURCES = ["\u5C0F\u7EA2\u4E66", "Pinterest", "\u597D\u597D\u4F4F", "houzz", "\u7AD9\u9177", "Google", "\u5176\u4ED6"];
var BLANK3 = {
  title: "",
  url: "",
  thumb: "",
  tags: "",
  score: 4,
  source: "\u5C0F\u7EA2\u4E66",
  projectId: ""
};
function RefImages({ projects, refimages, onSave, onDelete }) {
  const narrow = useIsNarrow();
  const [tagFilter, setTagFilter] = (0, import_react6.useState)("all");
  const [sort, setSort] = (0, import_react6.useState)("new");
  const [creating, setCreating] = (0, import_react6.useState)(false);
  const [draft, setDraft] = (0, import_react6.useState)({ ...BLANK3 });
  const [editingId, setEditingId] = (0, import_react6.useState)(null);
  const [form, setForm] = (0, import_react6.useState)({});
  const allTags = (0, import_react6.useMemo)(() => {
    const counter = /* @__PURE__ */ new Map();
    for (const r of refimages) {
      for (const t of r.tags ?? []) counter.set(t, (counter.get(t) ?? 0) + 1);
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).map(([t]) => t);
  }, [refimages]);
  const nameOf = (pid) => projects.find((p) => p.id === pid)?.name;
  const visible = (0, import_react6.useMemo)(() => {
    let list = tagFilter === "all" ? [...refimages] : refimages.filter((r) => (r.tags ?? []).includes(tagFilter));
    if (sort === "score") list.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    else if (sort === "title") list.sort((a, b) => String(a.title ?? "").localeCompare(String(b.title ?? ""), "zh-CN"));
    else list.sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
    return list;
  }, [refimages, tagFilter, sort]);
  const topRated = (0, import_react6.useMemo)(() => refimages.filter((r) => (r.score ?? 0) >= 5).length, [refimages]);
  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({
      title: r.title ?? "",
      url: r.url ?? "",
      thumb: r.thumb ?? "",
      tags: (r.tags ?? []).join("\uFF0C"),
      score: r.score ?? 3,
      source: r.source ?? "",
      projectId: r.projectId ?? ""
    });
  };
  const submitEdit = (r) => {
    const f = form[r.id] ?? {};
    onSave({
      id: r.id,
      title: f.title ?? "",
      url: f.url ?? "",
      thumb: f.thumb ?? "",
      // 逗号 / 空格分隔，后端会再 split 一次
      tags: String(f.tags ?? "").split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean),
      score: Number(f.score) || 3,
      source: f.source ?? "",
      projectId: f.projectId || void 0
    });
    setEditingId(null);
  };
  const submitCreate = () => {
    if (!draft.title.trim() && !draft.url.trim()) return;
    onSave({
      title: draft.title.trim() || draft.url.trim(),
      url: draft.url.trim(),
      thumb: draft.thumb.trim(),
      tags: draft.tags,
      score: draft.score,
      source: draft.source,
      projectId: draft.projectId || void 0
    });
    setDraft({ ...BLANK3 });
    setCreating(false);
  };
  const thumbOf = (r) => r.thumb || r.url || "";
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Btn, { kind: "primary", onClick: () => setCreating(true), children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { name: "plus", size: 13, color: "#fff" }),
        "\u6536\u85CF\u53C2\u8003\u56FE"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
        "select",
        {
          value: sort,
          onChange: (e) => setSort(e.target.value),
          style: { ...inputStyle, width: narrow ? "100%" : 150, fontSize: 13, padding: "7px 10px" },
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "new", children: "\u6700\u65B0\u6536\u85CF" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "score", children: "\u8BC4\u5206\u4F18\u5148" }),
            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "title", children: "\u6309\u6807\u9898" })
          ]
        }
      ),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", gap: 6, marginLeft: narrow ? 0 : "auto", flexWrap: "wrap", alignItems: "center" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Pill, { tone: "neutral", children: [
          "\u5171 ",
          refimages.length,
          " \u5F20"
        ] }),
        topRated ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Pill, { tone: "ok", children: [
          "5 \u661F ",
          topRated
        ] }) : null
      ] })
    ] }),
    allTags.length ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
        "button",
        {
          type: "button",
          onClick: () => setTagFilter("all"),
          style: {
            padding: "4px 11px",
            borderRadius: R.pill,
            border: `1px solid ${tagFilter === "all" ? C.brand : C.line}`,
            background: tagFilter === "all" ? C.brand : "#fff",
            color: tagFilter === "all" ? "#fff" : C.ink2,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer"
          },
          children: "\u5168\u90E8"
        }
      ),
      allTags.map((t) => {
        const active = tagFilter === t;
        return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "button",
          {
            type: "button",
            onClick: () => setTagFilter(active ? "all" : t),
            style: {
              padding: "4px 11px",
              borderRadius: R.pill,
              border: `1px solid ${active ? C.brand : C.line}`,
              background: active ? C.brand : "#fff",
              color: active ? "#fff" : C.ink2,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer"
            },
            children: t
          },
          t
        );
      })
    ] }) : null,
    !refimages.length ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Empty, { text: "\u8FD8\u6CA1\u6709\u6536\u85CF\u53C2\u8003\u56FE\u3002\u770B\u5230\u559C\u6B22\u7684\u65B9\u6848\u5C31\u5B58\u8FDB\u6765\uFF0C\u6807\u4E0A\u6807\u7B7E\u548C\u8BC4\u5206\uFF0C\u6C47\u62A5 PPT \u65F6\u76F4\u63A5\u7FFB\u8FD9\u91CC" }) : !visible.length ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Empty, { text: `\u6CA1\u6709\u5E26\u300C${tagFilter}\u300D\u6807\u7B7E\u7684\u56FE` }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "div",
      {
        style: {
          display: "grid",
          gridTemplateColumns: narrow ? "1fr" : "repeat(auto-fill, minmax(212px, 1fr))",
          gap: 12
        },
        children: visible.map((r) => {
          const isEditing = editingId === r.id;
          const f = isEditing ? form[r.id] ?? {} : null;
          const thumb = thumbOf(r);
          const projName = nameOf(r.projectId);
          return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
            "div",
            {
              style: {
                ...cardStyle,
                padding: 0,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column"
              },
              children: [
                isEditing ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { padding: "12px 14px 0" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { label: "\u56FE\u7247\u5730\u5740", hint: "\u586B\u4E86\u5C31\u76F4\u63A5\u5F53\u7F29\u7565\u56FE\u7528\uFF1B\u7559\u7A7A\u5219\u663E\u793A\u5360\u4F4D\u5757", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "input",
                  {
                    style: inputStyle,
                    placeholder: "https://\u2026",
                    value: f.thumb ?? "",
                    onChange: (e) => setForm((s) => ({ ...s, [r.id]: { ...f, thumb: e.target.value } }))
                  }
                ) }) }) : thumb ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("a", { href: r.url || thumb, target: "_blank", rel: "noreferrer", style: { display: "block" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "img",
                  {
                    src: thumb,
                    alt: r.title ?? "\u53C2\u8003\u56FE",
                    loading: "lazy",
                    style: { width: "100%", height: 138, objectFit: "cover", display: "block", background: "#F4F0EA" },
                    onError: (e) => {
                      ;
                      e.currentTarget.style.display = "none";
                    }
                  }
                ) }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "div",
                  {
                    style: {
                      height: 92,
                      background: "#F1EDE7",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center"
                    },
                    children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { name: "gallery", size: 22, color: C.ink3 })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { padding: "11px 14px 13px", display: "flex", flexDirection: "column", gap: 7, flex: 1 }, children: [
                  isEditing ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "input",
                      {
                        style: inputStyle,
                        placeholder: "\u6807\u9898",
                        value: f.title ?? "",
                        onChange: (e) => setForm((s) => ({ ...s, [r.id]: { ...f, title: e.target.value } }))
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "input",
                      {
                        style: inputStyle,
                        placeholder: "\u539F\u56FE\u94FE\u63A5",
                        value: f.url ?? "",
                        onChange: (e) => setForm((s) => ({ ...s, [r.id]: { ...f, url: e.target.value } }))
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "input",
                      {
                        style: inputStyle,
                        placeholder: "\u6807\u7B7E\uFF0C\u9017\u53F7\u5206\u9694",
                        value: f.tags ?? "",
                        onChange: (e) => setForm((s) => ({ ...s, [r.id]: { ...f, tags: e.target.value } }))
                      }
                    ),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                        "select",
                        {
                          style: inputStyle,
                          value: f.source ?? "",
                          onChange: (e) => setForm((s) => ({ ...s, [r.id]: { ...f, source: e.target.value } })),
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "", children: "\u6765\u6E90" }),
                            SOURCES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: s, children: s }, s))
                          ]
                        }
                      ),
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                        "select",
                        {
                          style: inputStyle,
                          value: f.projectId ?? "",
                          onChange: (e) => setForm((s) => ({ ...s, [r.id]: { ...f, projectId: e.target.value } })),
                          children: [
                            /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "", children: "\u4E0D\u6302\u9879\u76EE" }),
                            projects.map((p) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: p.id, children: p.name }, p.id))
                          ]
                        }
                      )
                    ] }),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8 }, children: [
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { fontSize: 11.5, color: C.ink2, flex: "none" }, children: "\u8BC4\u5206" }),
                      [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                        "button",
                        {
                          type: "button",
                          onClick: () => setForm((s) => ({ ...s, [r.id]: { ...f, score: n } })),
                          style: {
                            width: 22,
                            height: 22,
                            borderRadius: 5,
                            border: `1px solid ${C.line}`,
                            background: n <= (Number(f.score) || 0) ? C.brandSoft : "#fff",
                            color: n <= (Number(f.score) || 0) ? C.brand : C.ink3,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: "pointer"
                          },
                          children: n
                        },
                        n
                      ))
                    ] })
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: 13, fontWeight: 700, lineHeight: 1.5 }, children: r.title || "\u672A\u547D\u540D" }),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", gap: 3, alignItems: "center" }, children: [
                      [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                        "span",
                        {
                          style: {
                            width: 11,
                            height: 11,
                            borderRadius: 3,
                            background: n <= (r.score ?? 0) ? C.brand : C.lineSoft,
                            border: `1px solid ${n <= (r.score ?? 0) ? C.brand : C.line}`
                          }
                        },
                        n
                      )),
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("span", { style: { fontSize: 11, color: C.ink3, marginLeft: 3 }, children: [
                        r.score ?? 0,
                        " \u5206"
                      ] })
                    ] }),
                    (r.tags ?? []).length ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { display: "flex", gap: 5, flexWrap: "wrap" }, children: (r.tags ?? []).map((t) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                      "span",
                      {
                        onClick: () => setTagFilter(t),
                        style: {
                          fontSize: 11,
                          color: C.ink2,
                          background: "#F4F0EA",
                          padding: "2px 7px",
                          borderRadius: R.pill,
                          cursor: "pointer"
                        },
                        children: t
                      },
                      t
                    )) }) : null,
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { fontSize: 11, color: C.ink3, lineHeight: 1.6 }, children: [
                      r.source ? `${r.source} \xB7 ` : "",
                      String(r.createdAt ?? "").slice(0, 10)
                    ] }),
                    projName ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { fontSize: 11, color: C.brand, fontWeight: 600 }, children: [
                      "\u6302\u5728 ",
                      projName
                    ] }) : null
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { display: "flex", gap: 6, marginTop: "auto", paddingTop: 4 }, children: isEditing ? /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Btn, { kind: "primary", onClick: () => submitEdit(r), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u4FDD\u5B58" }),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Btn, { onClick: () => setEditingId(null), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u53D6\u6D88" })
                  ] }) : /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(import_jsx_runtime7.Fragment, { children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Btn, { onClick: () => startEdit(r), style: { padding: "5px 11px", fontSize: 12.5 }, children: "\u7F16\u8F91" }),
                    r.url ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("a", { href: r.url, target: "_blank", rel: "noreferrer", style: { textDecoration: "none" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(Btn, { style: { padding: "5px 11px", fontSize: 12.5 }, title: "\u6253\u5F00\u539F\u56FE", children: [
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { name: "arrow", size: 12.5, color: C.ink2 }),
                      "\u539F\u56FE"
                    ] }) }) : null,
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Btn, { kind: "danger", onClick: () => onDelete(r.id), style: { padding: "5px 9px", marginLeft: "auto" }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { name: "trash", size: 12.5, color: C.danger }) })
                  ] }) })
                ] })
              ]
            },
            r.id
          );
        })
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: 11.5, color: C.ink3, marginTop: 12, lineHeight: 1.8 }, children: "\u6807\u7B7E\u7528\u9017\u53F7\u5206\u9694\u3002\u70B9\u6807\u7B7E\u6309\u6807\u7B7E\u7B5B\u9009\uFF0C\u70B9\u5361\u7247\u4E0A\u7684\u300C\u539F\u56FE\u300D\u8DF3\u56DE\u6765\u6E90\u9875\u9762\u3002\u56FE\u7247\u6302\u4E86\u5C31\u9000\u5316\u6210\u5360\u4F4D\u5757\uFF0C\u4E0D\u4F1A\u7559\u7834\u56FE\u3002" }),
    creating ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
      "div",
      {
        style: {
          position: "fixed",
          inset: 0,
          background: "rgba(31,29,26,.35)",
          display: "flex",
          alignItems: narrow ? "flex-end" : "center",
          justifyContent: "center",
          zIndex: 60,
          padding: narrow ? 0 : 20
        },
        onClick: () => setCreating(false),
        children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
          "div",
          {
            onClick: (e) => e.stopPropagation(),
            style: {
              background: C.bg,
              width: narrow ? "100%" : 560,
              maxHeight: narrow ? "92vh" : "86vh",
              overflowY: "auto",
              borderRadius: narrow ? "14px 14px 0 0" : R.lg,
              padding: narrow ? "18px 16px calc(18px + env(safe-area-inset-bottom))" : "22px 24px",
              boxShadow: "0 12px 40px rgba(0,0,0,.18)"
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "flex", alignItems: "center", marginBottom: 4 }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { style: { fontSize: 16, fontWeight: 700 }, children: "\u6536\u85CF\u53C2\u8003\u56FE" }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Btn, { kind: "quiet", onClick: () => setCreating(false), style: { marginLeft: "auto", minWidth: 34 }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { name: "close", size: 14, color: C.ink2 }) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { fontSize: 12.5, color: C.ink2, marginBottom: 16, lineHeight: 1.7 }, children: "\u628A\u5C0F\u7EA2\u4E66 / \u597D\u597D\u4F4F\u770B\u5230\u7684\u56FE\u5B58\u8FDB\u6765\u3002\u586B\u4E86\u56FE\u7247\u5730\u5740\u5C31\u80FD\u770B\u5230\u7F29\u7565\u56FE\uFF0C\u53EA\u586B\u94FE\u63A5\u5219\u663E\u793A\u5360\u4F4D\u5757\u3002" }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { label: "\u6807\u9898 *", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                "input",
                {
                  style: inputStyle,
                  placeholder: "\u5982 \u5976\u6CB9\u98CE\u5BA2\u5385 \xB7 \u6C99\u53D1\u80CC\u666F\u5899",
                  value: draft.title,
                  onChange: (e) => setDraft((d) => ({ ...d, title: e.target.value }))
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { label: "\u539F\u56FE\u94FE\u63A5", hint: "\u70B9\u51FB\u5361\u7247\u4E0A\u7684\u300C\u539F\u56FE\u300D\u6309\u94AE\u4F1A\u8DF3\u5230\u8FD9\u91CC", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                "input",
                {
                  style: inputStyle,
                  placeholder: "https://\u2026",
                  value: draft.url,
                  onChange: (e) => setDraft((d) => ({ ...d, url: e.target.value }))
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { label: "\u7F29\u7565\u56FE\u5730\u5740", hint: "\u53EF\u7559\u7A7A\u3002\u7559\u7A7A\u65F6\u82E5\u586B\u4E86\u539F\u56FE\u94FE\u63A5\uFF0C\u4F1A\u76F4\u63A5\u62FF\u539F\u56FE\u5F53\u7F29\u7565\u56FE", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                "input",
                {
                  style: inputStyle,
                  placeholder: "https://\u2026\uFF08\u53EF\u7559\u7A7A\uFF09",
                  value: draft.thumb,
                  onChange: (e) => setDraft((d) => ({ ...d, thumb: e.target.value }))
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { label: "\u6807\u7B7E", hint: "\u9017\u53F7\u5206\u9694\uFF0C\u5982\uFF1A\u5976\u6CB9\u98CE, \u5BA2\u5385, \u6C99\u53D1\u80CC\u666F\u5899", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                "input",
                {
                  style: inputStyle,
                  value: draft.tags,
                  onChange: (e) => setDraft((d) => ({ ...d, tags: e.target.value }))
                }
              ) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { style: { display: "grid", gridTemplateColumns: narrow ? "1fr" : "1fr 1fr", gap: "0 14px" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { label: "\u6765\u6E90", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                  "select",
                  {
                    value: draft.source,
                    onChange: (e) => setDraft((d) => ({ ...d, source: e.target.value })),
                    style: inputStyle,
                    children: SOURCES.map((s) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: s, children: s }, s))
                  }
                ) }),
                /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { label: "\u6302\u5230\u9879\u76EE", hint: "\u6C47\u62A5 PPT \u65F6\u6309\u9879\u76EE\u7B5B\u53C2\u8003\u56FE", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                  "select",
                  {
                    value: draft.projectId,
                    onChange: (e) => setDraft((d) => ({ ...d, projectId: e.target.value })),
                    style: inputStyle,
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: "", children: "\u4E0D\u6302\u9879\u76EE" }),
                      projects.map((p) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("option", { value: p.id, children: p.name }, p.id))
                    ]
                  }
                ) })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Field, { label: "\u8BC4\u5206", hint: "5 \u5206 = \u503C\u5F97\u7167\u7740\u505A\uFF1B3 \u5206 = \u4E00\u822C", children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { style: { display: "flex", gap: 6 }, children: [1, 2, 3, 4, 5].map((n) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
                "button",
                {
                  type: "button",
                  onClick: () => setDraft((d) => ({ ...d, score: n })),
                  style: {
                    width: 34,
                    height: 34,
                    borderRadius: R.sm,
                    border: `1px solid ${n <= draft.score ? C.brand : C.line}`,
                    background: n <= draft.score ? C.brandSoft : "#fff",
                    color: n <= draft.score ? C.brand : C.ink3,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: "pointer"
                  },
                  children: n
                },
                n
              )) }) }),
              /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
                "div",
                {
                  style: {
                    display: "flex",
                    gap: 8,
                    justifyContent: "flex-end",
                    paddingTop: 14,
                    borderTop: `1px solid ${C.line}`
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Btn, { onClick: () => setCreating(false), children: "\u53D6\u6D88" }),
                    /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Btn, { kind: "primary", onClick: submitCreate, disabled: !draft.title.trim() && !draft.url.trim(), children: "\u6536\u85CF" })
                  ]
                }
              )
            ]
          }
        )
      }
    ) : null
  ] });
}

// src/client/App.tsx
var import_jsx_runtime8 = require("react/jsx-runtime");
var TABS = [
  { key: "today", label: "\u4ECA\u65E5", icon: "today", narrowSlot: true },
  { key: "projects", label: "\u9879\u76EE", icon: "board", narrowSlot: true },
  { key: "renders", label: "\u6548\u679C\u56FE", icon: "image", narrowSlot: true },
  { key: "sites", label: "\u5DE1\u68C0", icon: "build", narrowSlot: false },
  { key: "materials", label: "\u6750\u6599", icon: "box", narrowSlot: false },
  { key: "refimages", label: "\u7075\u611F", icon: "gallery", narrowSlot: false }
];
var MORE_TABS = TABS.filter((t) => !t.narrowSlot);
function App() {
  const narrow = useIsNarrow();
  const [state, setState] = (0, import_react7.useState)(null);
  const [tab, setTab] = (0, import_react7.useState)("today");
  const [busy, setBusy] = (0, import_react7.useState)("");
  const [toast, setToast] = (0, import_react7.useState)(null);
  const [focusProjectId, setFocusProjectId] = (0, import_react7.useState)(null);
  const [showImport, setShowImport] = (0, import_react7.useState)(false);
  const [importText, setImportText] = (0, import_react7.useState)("");
  const [showMore, setShowMore] = (0, import_react7.useState)(false);
  const [linkError, setLinkError] = (0, import_react7.useState)("");
  const jobsRef = (0, import_react7.useRef)([]);
  const lastPollRef = (0, import_react7.useRef)(Date.now());
  const toastTimer = (0, import_react7.useRef)(null);
  const flash = (0, import_react7.useCallback)((kind, text) => {
    setToast({ kind, text });
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 3800);
  }, []);
  const refreshAll = (0, import_react7.useCallback)(
    async (silent = false) => {
      if (!silent) setBusy((b) => b || "refresh");
      try {
        const res = await api("/state");
        if (res.ok === false) {
          flash("err", res.error ?? "\u8BFB\u53D6\u5931\u8D25");
        } else {
          setState(res);
          jobsRef.current = res.jobs ?? [];
        }
        setLinkError("");
      } catch (e) {
        const msg = String(e?.message ?? e);
        setLinkError(msg);
        if (!silent) flash("err", `\u8BFB\u53D6\u5931\u8D25\uFF1A${msg}`);
      } finally {
        if (!silent) setBusy((b) => b === "refresh" ? "" : b);
      }
    },
    [flash]
  );
  (0, import_react7.useEffect)(() => {
    void refreshAll();
  }, [refreshAll]);
  (0, import_react7.useEffect)(() => {
    const timer = window.setInterval(() => {
      const running2 = jobsRef.current.some((j) => j.status === "queued" || j.status === "running");
      const interval = running2 ? 3e3 : 6e4;
      if (Date.now() - lastPollRef.current >= interval) {
        lastPollRef.current = Date.now();
        void refreshAll(true);
      }
    }, 1e3);
    return () => window.clearInterval(timer);
  }, [refreshAll]);
  const post = (0, import_react7.useCallback)(
    async (path, body, okText) => {
      try {
        const res = await api(path, { method: "POST", body });
        if (!res?.ok) flash("err", res?.error ?? "\u64CD\u4F5C\u5931\u8D25");
        else if (okText) flash("ok", okText);
        await refreshAll(true);
        return res;
      } catch (e) {
        flash("err", `\u64CD\u4F5C\u5931\u8D25\uFF1A${e?.message ?? e}`);
        return { ok: false, error: String(e?.message ?? e) };
      }
    },
    [flash, refreshAll]
  );
  const onToggleTask = (id, done) => void post("/task/toggle", { id, done }, done ? "\u5DF2\u5B8C\u6210" : "");
  const onPostpone = (id, days) => void post("/task/postpone", { id, days }, `\u5DF2\u987A\u5EF6 ${days} \u5929`);
  const onDeleteTask = (id) => {
    if (!window.confirm("\u5220\u9664\u8FD9\u6761\u5F85\u529E\uFF1F")) return;
    void post("/task/delete", { id }, "\u5DF2\u5220\u9664");
  };
  const onAdvance = (id, note) => void post("/project/advance", { id, note }, "\u5DF2\u63A8\u8FDB\u5230\u4E0B\u4E00\u9636\u6BB5\uFF0C\u5E76\u81EA\u52A8\u6392\u51FA\u4E0B\u4E00\u6B65");
  const onWake = (id) => void post("/project/wake", { id }, "\u5DF2\u751F\u6210\u8DDF\u8FDB\u5F85\u529E");
  const onDeleteProject = (id) => {
    if (!window.confirm("\u5220\u9664\u9879\u76EE\u4F1A\u540C\u65F6\u5220\u6389\u5B83\u7684\u5F85\u529E\uFF0C\u786E\u5B9A\uFF1F")) return;
    void post("/project/delete", { id }, "\u5DF2\u5220\u9664");
  };
  const onSaveProject = async (payload) => {
    try {
      const res = await api("/project/save", {
        method: "POST",
        body: payload
      });
      if (!res?.ok) flash("err", res?.error ?? "\u4FDD\u5B58\u5931\u8D25");
      else if (!payload.silent) {
        flash("ok", res.createdTask ? `\u5DF2\u5EFA\u6863\uFF0C\u5E76\u751F\u6210\u5F85\u529E\u300C${res.createdTask.title}\u300D` : "\u5DF2\u4FDD\u5B58");
      }
      await refreshAll(true);
    } catch (e) {
      flash("err", `\u4FDD\u5B58\u5931\u8D25\uFF1A${e?.message ?? e}`);
    }
  };
  const onRender = async (params) => {
    setBusy("render");
    try {
      const res = await api("/comfy/render", { method: "POST", body: params });
      if (res?.ok) {
        flash("ok", `\u5DF2\u63D0\u4EA4\u51FA\u56FE \xB7 ${res.width}\xD7${res.height} \xB7 seed ${res.seed}`);
        lastPollRef.current = 0;
      } else {
        flash("err", res?.error ?? "\u63D0\u4EA4\u5931\u8D25");
      }
      await refreshAll(true);
    } catch (e) {
      flash("err", `\u63D0\u4EA4\u5931\u8D25\uFF1A${e?.message ?? e}`);
    } finally {
      setBusy("");
    }
  };
  const onDeleteRender = (renderId) => {
    if (!window.confirm("\u5220\u9664\u8FD9\u6761\u51FA\u56FE\u8BB0\u5F55\uFF1F\uFF08\u5F52\u6863\u56FE\u7247\u6587\u4EF6\u4E0D\u4F1A\u88AB\u5220\uFF09")) return;
    void post("/render/delete", { id: renderId }, "\u5DF2\u5220\u9664\u8BB0\u5F55");
  };
  const onSaveSite = (site) => void post("/site/save", { site }, site?.id ? "\u5DF2\u4FDD\u5B58\u5DE1\u68C0\u8BB0\u5F55" : "\u5DF2\u767B\u8BB0\u5DE1\u68C0");
  const onDeleteSite = (id) => {
    if (!window.confirm("\u5220\u9664\u8FD9\u6761\u5DE1\u68C0\u8BB0\u5F55\uFF1F")) return;
    void post("/site/delete", { id }, "\u5DF2\u5220\u9664\u5DE1\u68C0\u8BB0\u5F55");
  };
  const onSaveMaterial = (material) => void post("/material/save", { material }, material?.id ? "\u5DF2\u4FDD\u5B58\u6750\u6599" : "\u5DF2\u767B\u8BB0\u6750\u6599");
  const onDeleteMaterial = (id) => {
    if (!window.confirm("\u5220\u9664\u8FD9\u6761\u6750\u6599\u8BB0\u5F55\uFF1F")) return;
    void post("/material/delete", { id }, "\u5DF2\u5220\u9664\u6750\u6599");
  };
  const onSaveRefImage = (refimage) => void post("/refimage/save", { refimage }, refimage?.id ? "\u5DF2\u4FDD\u5B58\u53C2\u8003\u56FE" : "\u5DF2\u6536\u85CF");
  const onDeleteRefImage = (id) => {
    if (!window.confirm("\u5220\u9664\u8FD9\u5F20\u53C2\u8003\u56FE\uFF1F")) return;
    void post("/refimage/delete", { id }, "\u5DF2\u5220\u9664\u53C2\u8003\u56FE");
  };
  const onExport = async () => {
    setBusy("export");
    try {
      const res = await api("/export");
      if (!res.ok) return flash("err", res.error ?? "\u5BFC\u51FA\u5931\u8D25");
      try {
        const blob = new Blob([JSON.stringify(res.payload)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `designer-desk-${res.payload?.exportedAt?.slice(0, 10) ?? "backup"}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {
      }
      flash("ok", `\u5DF2\u5BFC\u51FA\u5907\u4EFD\uFF1A${res.file}`);
    } catch (e) {
      flash("err", `\u5BFC\u51FA\u5931\u8D25\uFF1A${e?.message ?? e}`);
    } finally {
      setBusy("");
    }
  };
  const onImport = async () => {
    if (!importText.trim()) return flash("err", "\u8BF7\u5148\u7C98\u8D34\u5907\u4EFD JSON");
    if (!window.confirm("\u5BFC\u5165\u4F1A\u8986\u76D6\u5F53\u524D\u5168\u90E8\u6570\u636E\uFF0C\u786E\u5B9A\u7EE7\u7EED\uFF1F")) return;
    setBusy("import");
    try {
      const res = await api("/import", { method: "POST", body: { text: importText } });
      if (res.ok) {
        setImportText("");
        setShowImport(false);
        flash("ok", "\u5BFC\u5165\u5B8C\u6210");
        await refreshAll(true);
      } else flash("err", res.error ?? "\u5BFC\u5165\u5931\u8D25");
    } catch (e) {
      flash("err", `\u5BFC\u5165\u5931\u8D25\uFF1A${e?.message ?? e}`);
    } finally {
      setBusy("");
    }
  };
  const openProject = (id) => {
    setFocusProjectId(id);
    setTab("projects");
  };
  const gotoRender = (projectId) => {
    setFocusProjectId(projectId);
    setTab("renders");
  };
  const gotoRenderNew = () => {
    setFocusProjectId(null);
    setTab("renders");
  };
  const pickMore = (key) => {
    setTab(key);
    setShowMore(false);
  };
  const stor = state?.storage;
  const running = (state?.jobs ?? []).filter((j) => j.status === "queued" || j.status === "running").length;
  const conn = state?.comfy;
  const link = remoteStatus();
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
    "div",
    {
      style: {
        fontFamily: FONT,
        background: C.bg,
        color: C.ink,
        minHeight: "100%",
        paddingBottom: narrow ? "calc(66px + env(safe-area-inset-bottom))" : 24,
        boxSizing: "border-box"
      },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "div",
          {
            style: {
              padding: narrow ? "14px 14px 10px" : "20px 24px 12px",
              borderBottom: `1px solid ${C.line}`,
              background: C.bg
            },
            children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }, children: [
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontSize: narrow ? 17 : 19, fontWeight: 700, letterSpacing: "-.2px" }, children: "\u8BBE\u8BA1\u53F0" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { style: { fontSize: 12, color: C.ink3 }, children: [
                  state?.now ?? "",
                  " \xB7 \u5BA2\u6237 ",
                  state?.stats?.projectCount ?? 0,
                  " \u4E2A\u9879\u76EE"
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 7, marginLeft: "auto", flexWrap: "wrap" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
                    "span",
                    {
                      title: link.state === "ready" ? `Remote \u547D\u540D\u7A7A\u95F4 designerDesk \u5DF2\u6302\u8F7D \xB7 \u6570\u636E\u76EE\u5F55 ${stor?.home ?? ""}` : `\u6570\u636E\u901A\u9053\uFF1A${link.state}${link.error ? ` \xB7 ${link.error}` : ""}`,
                      style: {
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontSize: 11.5,
                        fontWeight: 600,
                        padding: "3px 9px",
                        borderRadius: R.pill,
                        background: link.state === "ready" ? C.okSoft : C.dangerSoft,
                        color: link.state === "ready" ? C.ok : C.danger
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: link.state === "ready" ? "sync" : "warn", size: 11, color: link.state === "ready" ? C.ok : C.danger }),
                        link.state === "ready" ? `\u672C\u5730\u5B58\u50A8 ${stor ? bytesText(stor.bytes) : ""}` : "\u6570\u636E\u901A\u9053\u672A\u5C31\u7EEA"
                      ]
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Btn, { onClick: onExport, disabled: busy === "export", title: "\u5BFC\u51FA JSON \u5907\u4EFD", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: "download", size: 12.5, color: C.ink2 }),
                    "\u5BFC\u51FA"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Btn, { onClick: () => setShowImport(true), title: "\u5BFC\u5165\u6062\u590D", children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: "upload", size: 12.5, color: C.ink2 }),
                    "\u5BFC\u5165"
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Btn, { onClick: () => void refreshAll(), title: "\u5237\u65B0", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: "refresh", size: 12.5, color: C.ink2 }) })
                ] })
              ] }),
              !narrow ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", gap: 6, marginTop: 14, alignItems: "center" }, children: [
                TABS.map((t) => {
                  const activeTab = tab === t.key;
                  const badgeCount = t.key === "today" ? (state?.buckets?.overdue?.length ?? 0) + (state?.buckets?.today?.length ?? 0) : t.key === "sites" ? (state?.sites ?? []).filter((s) => s.status === "\u9700\u6574\u6539").length : 0;
                  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
                    "button",
                    {
                      type: "button",
                      onClick: () => setTab(t.key),
                      style: {
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 7,
                        padding: "7px 15px",
                        borderRadius: R.sm,
                        border: `1px solid ${activeTab ? C.brand : C.line}`,
                        background: activeTab ? C.brand : "#fff",
                        color: activeTab ? "#fff" : C.ink,
                        fontSize: 13.5,
                        fontWeight: 600,
                        fontFamily: FONT,
                        cursor: "pointer"
                      },
                      children: [
                        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: t.icon, size: 14, color: activeTab ? "#fff" : C.ink2 }),
                        t.label,
                        badgeCount ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Pill, { tone: activeTab ? "neutral" : "danger", children: badgeCount }) : null,
                        t.key === "renders" && running ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Pill, { tone: activeTab ? "neutral" : "warn", children: running }) : null
                      ]
                    },
                    t.key
                  );
                }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { style: { marginLeft: "auto", fontSize: 11.5, color: C.ink3, display: "flex", gap: 12, alignItems: "center" }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { children: [
                    "\u903E\u671F ",
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("b", { style: { color: state?.buckets?.overdue?.length ? C.danger : C.ink2 }, children: state?.buckets?.overdue?.length ?? 0 }),
                    " \xB7 ",
                    "\u4ECA\u5929 ",
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("b", { style: { color: C.ink }, children: state?.buckets?.today?.length ?? 0 }),
                    " \xB7 ",
                    "\u4E09\u5929\u5185 ",
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("b", { style: { color: C.ink2 }, children: state?.buckets?.soon?.length ?? 0 })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { color: conn?.ok ? C.ok : C.warn }, children: conn?.ok ? conn.workflowReady ? "ComfyUI \u5C31\u7EEA" : "ComfyUI \u5DF2\u8FDE\xB7\u5F85\u914D\u5DE5\u4F5C\u6D41" : "ComfyUI \u672A\u8FDE\u63A5" })
                ] })
              ] }) : null
            ]
          }
        ),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { padding: narrow ? "14px 14px" : "18px 24px", maxWidth: 1240, margin: "0 auto" }, children: [
          !state ? linkError ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { ...cardStyle, borderColor: "#E6BCB2", background: C.dangerSoft, padding: "26px 22px" }, children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }, children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: "warn", size: 17, color: C.danger }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontSize: 15, fontWeight: 700, color: C.danger }, children: "\u6570\u636E\u901A\u9053\u4E0D\u53EF\u7528" })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { fontSize: 12.5, color: C.ink2, lineHeight: 1.8, marginBottom: 12 }, children: [
              linkError,
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("br", {}),
              "\u8FD9\u4E00\u6B65\u5931\u8D25\u901A\u5E38\u610F\u5473\u7740 Remote \u547D\u540D\u7A7A\u95F4\u6CA1\u6302\u4E0A \u2014\u2014 \u63A7\u5236\u5668",
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("code", { style: { fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11.5 }, children: [
                " ",
                "designer-desk/api"
              ] }),
              " ",
              "\u6CA1\u6709\u5728\u6839\u5C42\u6CE8\u518C\u3002\u8BF7\u786E\u8BA4 cordis.patch.yml \u91CC\u6709\u7B2C\u4E8C\u6761 entry\uFF0C\u4E14 package.json \u5BFC\u51FA\u4E86",
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("code", { style: { fontFamily: "ui-monospace, Menlo, monospace", fontSize: 11.5 }, children: " ./api" }),
              "\u3002"
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(Btn, { onClick: () => void refreshAll(), children: [
              /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: "refresh", size: 12.5, color: C.ink2 }),
              "\u91CD\u8BD5"
            ] })
          ] }) : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { ...cardStyle, textAlign: "center", color: C.ink2, fontSize: 13, padding: "40px 20px" }, children: "\u6B63\u5728\u8FDE\u63A5\u6570\u636E\u901A\u9053\u2026" }) : null,
          state && tab === "today" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            Today,
            {
              buckets: state.buckets,
              projects: state.projects,
              today: state.now,
              onToggle: onToggleTask,
              onPostpone,
              onDelete: onDeleteTask,
              onWake,
              onOpenProject: openProject
            }
          ) : null,
          state && tab === "projects" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            Projects,
            {
              projects: state.projects,
              customers: state.customers,
              stages: state.stages,
              focusProjectId,
              onClearFocus: () => setFocusProjectId(null),
              onSave: onSaveProject,
              onAdvance,
              onDelete: onDeleteProject,
              onRender: gotoRender
            }
          ) : null,
          state && tab === "renders" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            Renders,
            {
              projects: state.projects,
              renders: state.renders,
              jobs: (state.jobs ?? []).filter((j) => j.status !== "done"),
              comfy: state.comfy,
              ratios: state.ratios ?? {
                "16:9": { width: 1344, height: 768, label: "16:9 \u6A2A\u6784\u56FE" },
                "4:3": { width: 1152, height: 896, label: "4:3 \u6A2A\u6784\u56FE" },
                "1:1": { width: 1024, height: 1024, label: "1:1 \u65B9\u56FE" },
                "9:16": { width: 768, height: 1344, label: "9:16 \u624B\u673A\u7AD6\u5C4F" }
              },
              focusProjectId,
              onClearFocus: () => setFocusProjectId(null),
              onSubmit: onRender,
              onDelete: onDeleteRender,
              onGotoSettings: () => flash("ok", "\u8BBE\u7F6E\u5165\u53E3\u5728\u754C\u9762\u5DE6\u4E0B\u89D2\u7684\u8BBE\u7F6E\u91CC\uFF0C\u627E\u5230\u300C\u8BBE\u8BA1\u53F0\u300D\u4E00\u680F")
            }
          ) : null,
          state && tab === "sites" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            Sites,
            {
              projects: state.projects,
              sites: state.sites ?? [],
              onSave: onSaveSite,
              onDelete: onDeleteSite
            }
          ) : null,
          state && tab === "materials" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            Materials,
            {
              projects: state.projects,
              materials: state.materials ?? [],
              onSave: onSaveMaterial,
              onDelete: onDeleteMaterial
            }
          ) : null,
          state && tab === "refimages" ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            RefImages,
            {
              projects: state.projects,
              refimages: state.refimages ?? [],
              onSave: onSaveRefImage,
              onDelete: onDeleteRefImage
            }
          ) : null
        ] }),
        narrow ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
          "div",
          {
            style: {
              position: "fixed",
              left: 0,
              right: 0,
              bottom: 0,
              display: "flex",
              background: "#fff",
              borderTop: `1px solid ${C.line}`,
              paddingBottom: "env(safe-area-inset-bottom)",
              zIndex: 40
            },
            children: [
              TABS.filter((t) => t.narrowSlot).map((t) => {
                const activeTab = tab === t.key;
                const badgeCount = t.key === "today" ? (state?.buckets?.overdue?.length ?? 0) + (state?.buckets?.today?.length ?? 0) : 0;
                return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
                  "button",
                  {
                    type: "button",
                    onClick: () => setTab(t.key),
                    style: {
                      flex: 1,
                      minHeight: 54,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 3,
                      border: "none",
                      background: "transparent",
                      color: activeTab ? C.brand : C.ink2,
                      fontSize: 11.5,
                      fontWeight: 600,
                      fontFamily: FONT,
                      cursor: "pointer",
                      position: "relative"
                    },
                    children: [
                      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: t.icon, size: 19, color: activeTab ? C.brand : C.ink2 }),
                      t.label,
                      badgeCount ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                        "span",
                        {
                          style: {
                            position: "absolute",
                            top: 6,
                            right: "50%",
                            marginRight: -26,
                            background: C.danger,
                            color: "#fff",
                            fontSize: 10,
                            fontWeight: 700,
                            borderRadius: 999,
                            padding: "1px 5px",
                            lineHeight: 1.3
                          },
                          children: badgeCount
                        }
                      ) : null
                    ]
                  },
                  t.key
                );
              }),
              /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
                "button",
                {
                  type: "button",
                  onClick: () => setShowMore(true),
                  style: {
                    flex: 1,
                    minHeight: 54,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 3,
                    border: "none",
                    background: "transparent",
                    color: MORE_TABS.some((t) => t.key === tab) ? C.brand : C.ink2,
                    fontSize: 11.5,
                    fontWeight: 600,
                    fontFamily: FONT,
                    cursor: "pointer"
                  },
                  children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: "gallery", size: 19, color: MORE_TABS.some((t) => t.key === tab) ? C.brand : C.ink2 }),
                    "\u66F4\u591A"
                  ]
                }
              )
            ]
          }
        ) : null,
        narrow && showMore ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "div",
          {
            onClick: () => setShowMore(false),
            style: {
              position: "fixed",
              inset: 0,
              background: "rgba(31,29,26,.42)",
              display: "flex",
              alignItems: "flex-end",
              zIndex: 60
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
              "div",
              {
                onClick: (e) => e.stopPropagation(),
                style: {
                  background: C.bg,
                  width: "100%",
                  borderRadius: "14px 14px 0 0",
                  padding: "16px 16px calc(16px + env(safe-area-inset-bottom))"
                },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", marginBottom: 12 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontSize: 14, fontWeight: 700 }, children: "\u66F4\u591A" }),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Btn, { kind: "quiet", onClick: () => setShowMore(false), style: { marginLeft: "auto", minWidth: 34 }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: "close", size: 14, color: C.ink2 }) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { display: "grid", gap: 8 }, children: MORE_TABS.map((t) => {
                    const bad = t.key === "sites" ? (state?.sites ?? []).filter((s) => s.status === "\u9700\u6574\u6539").length : 0;
                    return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
                      "button",
                      {
                        type: "button",
                        onClick: () => pickMore(t.key),
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "13px 14px",
                          borderRadius: R.sm,
                          border: `1px solid ${tab === t.key ? C.brand : C.line}`,
                          background: tab === t.key ? C.brandSoft : "#fff",
                          color: C.ink,
                          fontSize: 13.5,
                          fontWeight: 600,
                          fontFamily: FONT,
                          cursor: "pointer",
                          textAlign: "left"
                        },
                        children: [
                          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: t.icon, size: 16, color: tab === t.key ? C.brand : C.ink2 }),
                          t.label,
                          bad ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Pill, { tone: "danger", children: bad }) : null
                        ]
                      },
                      t.key
                    );
                  }) })
                ]
              }
            )
          }
        ) : null,
        showImport ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "div",
          {
            onClick: () => setShowImport(false),
            style: {
              position: "fixed",
              inset: 0,
              background: "rgba(31,29,26,.42)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 70,
              padding: 16
            },
            children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
              "div",
              {
                onClick: (e) => e.stopPropagation(),
                style: { background: C.bg, borderRadius: R.lg, padding: 20, width: "100%", maxWidth: 560 },
                children: [
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", alignItems: "center", marginBottom: 10 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { style: { fontSize: 15, fontWeight: 700 }, children: "\u5BFC\u5165\u6062\u590D" }),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Btn, { kind: "quiet", onClick: () => setShowImport(false), style: { marginLeft: "auto", minWidth: 34 }, children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Icon, { name: "close", size: 14, color: C.ink2 }) })
                  ] }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { style: { fontSize: 12, color: C.ink2, marginBottom: 10, lineHeight: 1.8 }, children: "\u628A\u4E4B\u524D\u5BFC\u51FA\u7684 JSON \u5185\u5BB9\u6574\u6BB5\u7C98\u8D34\u8FDB\u6765\u3002\u5BFC\u5165\u4F1A\u8986\u76D6\u5F53\u524D\u5168\u90E8\u6570\u636E\uFF08\u5BFC\u5165\u524D\u4F1A\u81EA\u52A8\u7559\u5B58 data.bak.json\uFF09\u3002" }),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
                    "textarea",
                    {
                      value: importText,
                      onChange: (e) => setImportText(e.target.value),
                      placeholder: '{"kind":"designer-desk-backup", ...}',
                      style: { ...inputStyle, minHeight: 150, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12, lineHeight: 1.6 }
                    }
                  ),
                  /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { style: { display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 14 }, children: [
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Btn, { onClick: () => setShowImport(false), children: "\u53D6\u6D88" }),
                    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(Btn, { kind: "primary", disabled: busy === "import", onClick: onImport, children: busy === "import" ? "\u5BFC\u5165\u4E2D\u2026" : "\u786E\u8BA4\u5BFC\u5165" })
                  ] })
                ]
              }
            )
          }
        ) : null,
        toast ? /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
          "div",
          {
            style: {
              position: "fixed",
              left: "50%",
              bottom: narrow ? "calc(80px + env(safe-area-inset-bottom))" : 28,
              transform: "translateX(-50%)",
              background: toast.kind === "ok" ? C.ink : C.danger,
              color: "#fff",
              fontSize: 12.5,
              fontWeight: 600,
              padding: "9px 16px",
              borderRadius: R.pill,
              zIndex: 90,
              maxWidth: "90vw",
              textAlign: "center",
              lineHeight: 1.6,
              boxShadow: "0 6px 20px rgba(0,0,0,.18)"
            },
            children: toast.text
          }
        ) : null
      ]
    }
  );
}

// src/client/Settings.tsx
var import_react8 = require("react");
var import_jsx_runtime9 = require("react/jsx-runtime");
var NODE_LABELS = {
  positive: { title: "\u6B63\u5411\u63D0\u793A\u8BCD\u8282\u70B9", hint: "\u5FC5\u586B\u3002\u653E\u4F60\u7684 KSampler \u7684 positive \u8282\u70B9\uFF08\u901A\u5E38\u662F CLIPTextEncode\uFF09" },
  negative: { title: "\u8D1F\u5411\u63D0\u793A\u8BCD\u8282\u70B9", hint: "\u9009\u586B\u3002\u7559\u7A7A\u5219\u4E0D\u6539\u52A8\u5DE5\u4F5C\u6D41\u91CC\u7684\u8D1F\u9762\u8BCD" },
  seed: { title: "\u79CD\u5B50\u8282\u70B9", hint: "\u9009\u586B\u3002\u586B\u4E86\u5C31\u6BCF\u6B21\u968F\u673A\u6362\u79CD\u5B50" },
  width: { title: "\u5BBD\u5EA6\u8282\u70B9", hint: "\u9009\u586B\u3002\u4E0D\u586B\u4F1A\u81EA\u52A8\u5728\u8282\u70B9\u91CC\u627E width \u5B57\u6BB5" },
  height: { title: "\u9AD8\u5EA6\u8282\u70B9", hint: "\u9009\u586B\u3002\u4E0D\u586B\u4F1A\u81EA\u52A8\u5728\u8282\u70B9\u91CC\u627E height \u5B57\u6BB5" },
  batch: { title: "\u6279\u91CF\u5F20\u6570\u8282\u70B9", hint: "\u9009\u586B\u3002\u5BF9\u5E94 batch_size" },
  image: { title: "\u8F93\u5165\u56FE\u8282\u70B9", hint: "\u9009\u586B\u3002\u505A\u56FE\u751F\u56FE / \u53C2\u8003\u56FE\u65F6\u586B\uFF08\u6682\u672A\u542F\u7528\uFF09" }
};
function Settings() {
  const narrow = useIsNarrow();
  const [cfg, setCfg] = (0, import_react8.useState)(null);
  const [storage, setStorage] = (0, import_react8.useState)(null);
  const [msg, setMsg] = (0, import_react8.useState)(null);
  const [busy, setBusy] = (0, import_react8.useState)(false);
  const [importText, setImportText] = (0, import_react8.useState)("");
  const flash = (kind, text) => {
    setMsg({ kind, text });
    window.setTimeout(() => setMsg(null), 4e3);
  };
  const load = async () => {
    try {
      const res = await api("/config");
      if (res.ok) setCfg(res.config);
      else flash("err", res.error ?? "\u8BFB\u53D6\u914D\u7F6E\u5931\u8D25");
      const st = await api("/state");
      if (st?.storage) setStorage({ home: st.storage.home, bytes: st.storage.bytes });
    } catch (e) {
      flash("err", `\u8BFB\u53D6\u5931\u8D25\uFF1A${e?.message ?? e}`);
    }
  };
  (0, import_react8.useEffect)(() => {
    void load();
  }, []);
  const patch = (p) => setCfg((c) => c ? { ...c, ...p } : c);
  const patchNode = (key, field, value) => setCfg((c) => {
    if (!c) return c;
    const nodeMap = { ...c.nodeMap };
    nodeMap[key] = { ...nodeMap[key] ?? {}, [field]: value };
    return { ...c, nodeMap };
  });
  const save = async () => {
    if (!cfg) return;
    setBusy(true);
    try {
      const res = await api("/config", { method: "POST", body: { patch: cfg } });
      if (res.ok) flash("ok", "\u5DF2\u4FDD\u5B58\uFF0C\u914D\u7F6E\u7ACB\u5373\u751F\u6548");
      else flash("err", res.error ?? "\u4FDD\u5B58\u5931\u8D25");
    } catch (e) {
      flash("err", `\u4FDD\u5B58\u5931\u8D25\uFF1A${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };
  const exportBackup = async () => {
    try {
      const res = await api("/export");
      if (!res.ok) return flash("err", res.error ?? "\u5BFC\u51FA\u5931\u8D25");
      try {
        const blob = new Blob([JSON.stringify(res.payload)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `designer-desk-backup-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
      } catch {
      }
      flash("ok", `\u5DF2\u5BFC\u51FA\uFF1A${res.file}`);
    } catch (e) {
      flash("err", `\u5BFC\u51FA\u5931\u8D25\uFF1A${e?.message ?? e}`);
    }
  };
  const importBackup = async () => {
    if (!importText.trim()) return flash("err", "\u8BF7\u5148\u7C98\u8D34\u5907\u4EFD JSON \u5185\u5BB9");
    if (!window.confirm("\u5BFC\u5165\u4F1A\u8986\u76D6\u5F53\u524D\u5168\u90E8\u6570\u636E\uFF0C\u786E\u5B9A\u7EE7\u7EED\uFF1F")) return;
    setBusy(true);
    try {
      const res = await api("/import", { method: "POST", body: { text: importText } });
      if (res.ok) {
        setImportText("");
        flash("ok", "\u5BFC\u5165\u5B8C\u6210");
        await load();
      } else flash("err", res.error ?? "\u5BFC\u5165\u5931\u8D25");
    } catch (e) {
      flash("err", `\u5BFC\u5165\u5931\u8D25\uFF1A${e?.message ?? e}`);
    } finally {
      setBusy(false);
    }
  };
  const clearDemo = async () => {
    if (!window.confirm("\u8FD9\u4F1A\u6E05\u7A7A\u5168\u90E8\u5BA2\u6237 / \u9879\u76EE / \u5F85\u529E / \u51FA\u56FE\u8BB0\u5F55\uFF0C\u4E14\u4E0D\u53EF\u64A4\u9500\u3002\u5EFA\u8BAE\u5148\u5BFC\u51FA\u5907\u4EFD\u3002\u786E\u5B9A\u7EE7\u7EED\uFF1F")) return;
    if (!window.confirm("\u4E8C\u6B21\u786E\u8BA4\uFF1A\u771F\u7684\u8981\u6E05\u7A7A\u5417\uFF1F")) return;
    setBusy(true);
    try {
      const res = await api("/seed/clear", { method: "POST", body: {} });
      if (res.ok) flash("ok", "\u5DF2\u6E05\u7A7A");
      else flash("err", "\u6E05\u7A7A\u5931\u8D25");
    } finally {
      setBusy(false);
    }
  };
  const reseed = async () => {
    setBusy(true);
    try {
      const res = await api("/seed/demo", { method: "POST", body: {} });
      if (res.ok) flash("ok", "\u5DF2\u8F7D\u5165\u793A\u4F8B\u6570\u636E\uFF085 \u4E2A\u5BA2\u6237 / 5 \u4E2A\u9879\u76EE / 6 \u6761\u5F85\u529E\uFF0C\u542B 1 \u6761\u903E\u671F\uFF09");
    } finally {
      setBusy(false);
    }
  };
  if (!cfg) {
    return /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { padding: 14, fontSize: 13, color: C.ink2 }, children: "\u8BFB\u53D6\u914D\u7F6E\u4E2D\u2026" });
  }
  const grid2 = {
    display: "grid",
    gridTemplateColumns: narrow ? "1fr" : "1fr 1fr",
    gap: "0 14px"
  };
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { padding: "4px 2px", fontFamily: "inherit" }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "settings", size: 16, color: C.brand }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { style: { fontSize: 15, fontWeight: 700 }, children: "\u8BBE\u8BA1\u53F0" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Pill, { tone: "neutral", children: "v0.1.0" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Btn, { kind: "primary", disabled: busy, onClick: save, style: { marginLeft: "auto" }, children: busy ? "\u5904\u7406\u4E2D\u2026" : "\u4FDD\u5B58\u914D\u7F6E" })
    ] }),
    msg ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "div",
      {
        style: {
          marginBottom: 14,
          padding: "9px 12px",
          borderRadius: R.sm,
          fontSize: 12.5,
          background: msg.kind === "ok" ? C.okSoft : C.dangerSoft,
          color: msg.kind === "ok" ? C.ok : C.danger,
          border: `1px solid ${msg.kind === "ok" ? "#D2E3D8" : "#EFCFC8"}`,
          wordBreak: "break-word",
          lineHeight: 1.7
        },
        children: msg.text
      }
    ) : null,
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: labelStyle, children: "ComfyUI \u63A5\u5165" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: grid2, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "ComfyUI \u5730\u5740", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { style: inputStyle, value: cfg.comfyHost, onChange: (e) => patch({ comfyHost: e.target.value }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "ComfyUI \u8F93\u51FA\u76EE\u5F55", hint: "ComfyUI \u7684 output \u76EE\u5F55\uFF0C\u7528\u4E8E\u628A\u51FA\u56FE\u62F7\u56DE\u5F52\u6863\uFF1B\u7559\u7A7A\u5219\u76F4\u63A5\u8D70 /view \u4EE3\u7406\u663E\u793A", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "input",
        {
          style: inputStyle,
          value: cfg.comfyOutputDir,
          placeholder: "/Users/you/ComfyUI/output",
          onChange: (e) => patch({ comfyOutputDir: e.target.value })
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Field,
      {
        label: "\u5DE5\u4F5C\u6D41\u6587\u4EF6\u8DEF\u5F84\uFF08\u5FC5\u987B\u662F API \u683C\u5F0F JSON\uFF09",
        hint: "ComfyUI \u754C\u9762\u53F3\u4E0A\u89D2 Workflow \u2192 Export (API) \u5BFC\u51FA\u3002\u666E\u901A UI \u683C\u5F0F\u4F1A\u76F4\u63A5\u63D0\u4EA4\u5931\u8D25\u3002",
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "input",
          {
            style: inputStyle,
            value: cfg.workflowPath,
            placeholder: "/Users/you/ComfyUI/user/default/workflows/interior_api.json",
            onChange: (e) => patch({ workflowPath: e.target.value })
          }
        )
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { ...labelStyle, marginTop: 18 }, children: "\u8282\u70B9\u6620\u5C04" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { fontSize: 11.5, color: C.ink3, marginBottom: 10, lineHeight: 1.8 }, children: [
      "\u300C\u8282\u70B9 ID\u300D\u662F ComfyUI \u91CC\u8282\u70B9\u6807\u9898\u680F\u4E0A\u7684\u6570\u5B57\uFF08\u5982 ",
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { style: { background: "#F4F0EA", padding: "1px 5px", borderRadius: 4 }, children: "KSampler #3" }),
      " \u2192 \u586B 3\uFF09\uFF1B\u300C\u8F93\u5165\u5B57\u6BB5\u300D\u662F\u8BE5\u8282\u70B9\u4E0A\u8F93\u5165\u53E3\u7684\u540D\u5B57\uFF0C\u5E38\u89C1\u4E3A text / seed / width / height / batch_size\u3002"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { display: "grid", gap: 10 }, children: Object.keys(NODE_LABELS).map((key) => {
      const slot = cfg.nodeMap?.[key] ?? { node: "", input: "" };
      return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { flex: "1 1 170px", minWidth: 150 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { style: labelStyle, children: NODE_LABELS[key].title }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "input",
            {
              style: inputStyle,
              value: slot.node ?? "",
              placeholder: "\u8282\u70B9 ID",
              onChange: (e) => patchNode(key, "node", e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { flex: "1 1 130px", minWidth: 110 }, children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("label", { style: labelStyle, children: "\u8F93\u5165\u5B57\u6BB5" }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
            "input",
            {
              style: inputStyle,
              value: slot.input ?? "",
              placeholder: "\u5982 text",
              onChange: (e) => patchNode(key, "input", e.target.value)
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { flex: "2 1 220px", fontSize: 11.5, color: C.ink3, paddingBottom: 10, lineHeight: 1.6 }, children: NODE_LABELS[key].hint })
      ] }, key);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { ...labelStyle, marginTop: 18 }, children: "\u63D0\u793A\u8BCD\u6A21\u677F" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      Field,
      {
        label: "\u6B63\u5411\u6A21\u677F",
        hint: "\u53EF\u7528\u5360\u4F4D\u7B26\uFF1A{space} \u7A7A\u95F4\u3001{style} \u98CE\u683C\u3001{materials} \u6750\u8D28\u3001{light} \u5149\u7167\u3002\u51FA\u56FE\u65F6\u81EA\u52A8\u66FF\u6362\u3002",
        children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
          "textarea",
          {
            style: { ...inputStyle, minHeight: 76, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, lineHeight: 1.7 },
            value: cfg.promptTemplate,
            onChange: (e) => patch({ promptTemplate: e.target.value })
          }
        )
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "\u8D1F\u5411\u63D0\u793A\u8BCD", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "textarea",
      {
        style: { ...inputStyle, minHeight: 56, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12.5, lineHeight: 1.7 },
        value: cfg.negativePrompt,
        onChange: (e) => patch({ negativePrompt: e.target.value })
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { ...labelStyle, marginTop: 18 }, children: "\u63D0\u9192\u4E0E\u5DE1\u68C0" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: grid2, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "\u6BCF\u65E5\u6458\u8981\u65F6\u95F4", hint: "\u5230\u70B9\u4F1A\u628A\u300C\u4ECA\u65E5\u5F85\u5904\u7406\u300D\u5199\u8FDB\u65E5\u5FD7\u4E0E\u72B6\u6001\u680F\uFF0C\u9760\u300C\u6253\u5F00\u5C31\u770B\u89C1\u300D\u7B49\u4EF7\u4E8E\u63D0\u9192", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "input",
        {
          style: inputStyle,
          type: "time",
          value: cfg.summaryAt,
          onChange: (e) => patch({ summaryAt: e.target.value })
        }
      ) }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "\u6C89\u9ED8\u9879\u76EE\u5224\u5B9A\u5929\u6570", hint: "\u62A5\u4EF7 / \u65B9\u6848\u8BBE\u8BA1\u9636\u6BB5\u8D85\u8FC7\u8FD9\u4E48\u591A\u5929\u6CA1\u52A8\u9759\uFF0C\u5C31\u5728\u4ECA\u65E5\u9875\u63D0\u793A\u5524\u9192", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
        "input",
        {
          style: inputStyle,
          type: "number",
          min: 1,
          inputMode: "numeric",
          value: cfg.silentDays,
          onChange: (e) => patch({ silentDays: Number(e.target.value) || 5 })
        }
      ) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("label", { style: { display: "flex", alignItems: "center", gap: 9, fontSize: 13, marginBottom: 6, cursor: "pointer", minHeight: 44 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("input", { type: "checkbox", checked: cfg.summaryEnabled, onChange: (e) => patch({ summaryEnabled: e.target.checked }) }),
      "\u542F\u7528\u6BCF\u65E5\u6458\u8981"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { ...labelStyle, marginTop: 18 }, children: "\u6570\u636E\u4E0E\u5907\u4EFD" }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { fontSize: 11.5, color: C.ink2, marginBottom: 10, lineHeight: 1.8 }, children: [
      "\u6570\u636E\u5168\u90E8\u5B58\u5728\u672C\u673A\uFF0C\u4E0D\u4E0A\u4F20\u4EFB\u4F55\u670D\u52A1\u5668\u3002\u6BCF\u6B21\u5199\u5165\u524D\u4F1A\u81EA\u52A8\u6EDA\u52A8\u5907\u4EFD\u5230 data.bak.json\u3002",
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("br", {}),
      "\u76EE\u5F55\uFF1A",
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { style: { background: "#F4F0EA", padding: "1px 5px", borderRadius: 4 }, children: storage?.home ?? "\u2014" }),
      storage ? ` \xB7 \u5F53\u524D ${bytesText(storage.bytes)}` : "",
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("br", {}),
      "\u60F3\u6362\u76EE\u5F55\uFF1A\u8BBE\u7F6E\u73AF\u5883\u53D8\u91CF ",
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("code", { style: { background: "#F4F0EA", padding: "1px 5px", borderRadius: 4 }, children: "DESIGNER_DESK_HOME" }),
      " \u540E\u91CD\u542F\u3002"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { style: { display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }, children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Btn, { onClick: exportBackup, children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "download", size: 13, color: C.ink2 }),
        "\u5BFC\u51FA JSON \u5907\u4EFD"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Btn, { onClick: reseed, disabled: busy, children: "\u8F7D\u5165\u793A\u4F8B\u6570\u636E" }),
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Btn, { kind: "danger", onClick: clearDemo, disabled: busy, children: "\u6E05\u7A7A\u5168\u90E8\u6570\u636E" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Field, { label: "\u5BFC\u5165\u6062\u590D\uFF08\u7C98\u8D34\u5907\u4EFD JSON\uFF09", hint: "\u4F1A\u8986\u76D6\u5F53\u524D\u5168\u90E8\u6570\u636E\uFF0C\u9700\u4E8C\u6B21\u786E\u8BA4", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
      "textarea",
      {
        style: { ...inputStyle, minHeight: 60, fontFamily: "ui-monospace, Menlo, monospace", fontSize: 12 },
        value: importText,
        placeholder: '{"kind":"designer-desk-backup", ...}',
        onChange: (e) => setImportText(e.target.value)
      }
    ) }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(Btn, { onClick: importBackup, disabled: busy || !importText.trim(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { name: "upload", size: 13, color: C.ink2 }),
      "\u5BFC\u5165\u6062\u590D"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { style: { fontSize: 11.5, color: C.ink3, marginTop: 16, lineHeight: 1.8, borderTop: `1px solid ${C.line}`, paddingTop: 12 }, children: "\u5173\u4E8E\u7B2C 2-5 \u671F\u6A21\u5757\uFF08\u5DE5\u5730\u5DE1\u68C0 / \u6750\u6599\u8FDB\u573A / \u7075\u611F\u7D20\u6750\u5E93 / \u62A5\u4EF7\u4E0E\u5408\u540C / \u9009\u6750\u5E93 / PPT \u52A9\u624B / \u516C\u4F17\u53F7\u65E5\u66F4 / \u5C0F\u8BF4\u53F0 / \u6570\u5B57\u751F\u6D3B\u89D2\uFF09\uFF0C \u6570\u636E\u8868\u7ED3\u6784\u5DF2\u7ECF\u9884\u7559\uFF0C\u540E\u7EED\u6309\u300C\u6BCF\u671F \u22643 \u4E2A\u6A21\u5757\u300D\u9010\u6B65\u52A0\uFF0C\u4E0D\u4F1A\u4E22\u73B0\u6709\u6570\u636E\u3002" })
  ] });
}

// src/client/DeskIcon.tsx
var import_jsx_runtime10 = require("react/jsx-runtime");
var PANEL_ID = "designer-desk-main";
function DeskIcon({ size = 16 }) {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(
    "svg",
    {
      "data-dsh-panel-entry": PANEL_ID,
      viewBox: "0 0 16 16",
      width: size,
      height: size,
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 1.3,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M2.5 2.5h11v11h-11zM2.5 6h11M2.5 10h11M6.5 2.5V13.5M10 2.5V13.5" }),
        /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M6.5 6h3.5v4H6.5z", fill: "currentColor", stroke: "none" })
      ]
    }
  );
}

// src/client/index.ts
var inject = ["slots"];
function apply(ctx) {
  bindCtx(ctx);
  const disposers = [];
  const register = (slot, entry, Comp) => {
    try {
      if (!ctx?.slots || typeof ctx.slots.register !== "function" || typeof ctx.slots.inject !== "function") {
        ctx?.logger?.warn?.(`[designer-desk] slots \u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u8DF3\u8FC7\u63D2\u69FD ${slot}`);
        return;
      }
      const dispose = ctx.slots.inject(slot, () => ctx.slots.register(entry, Comp));
      if (typeof dispose === "function") disposers.push(dispose);
    } catch (err) {
      ctx?.logger?.error?.(`[designer-desk] \u6CE8\u518C\u63D2\u69FD ${slot} \u5931\u8D25\uFF1A${err?.message ?? err}`);
    }
  };
  register(
    "main",
    {
      name: "main",
      key: "designer-desk-main",
      order: 20,
      label: () => "\u8BBE\u8BA1\u53F0"
    },
    App
  );
  register(
    "settings.section",
    {
      name: "settings.section",
      id: "designer-desk-settings",
      order: 20,
      label: () => "\u8BBE\u8BA1\u53F0"
    },
    Settings
  );
  register(
    "sidebar.panellist",
    {
      name: "sidebar.panellist",
      id: "designer-desk-main",
      order: 21,
      label: () => "\u8BBE\u8BA1\u53F0"
    },
    DeskIcon
  );
  return () => {
    for (const dispose of disposers.reverse()) {
      try {
        dispose();
      } catch {
      }
    }
  };
}

return module.exports;
} });

