// src/store.ts
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";

// src/types.ts
function ymd(d = /* @__PURE__ */ new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
function hm(d = /* @__PURE__ */ new Date()) {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
function todayStr() {
  return ymd(/* @__PURE__ */ new Date());
}
function addDaysStr(base, days) {
  const [y, m, d] = String(base).split("-").map(Number);
  const dt = new Date(y, (m || 1) - 1, d || 1);
  dt.setDate(dt.getDate() + days);
  return ymd(dt);
}
function diffDays(a, b) {
  const pa = String(a).split("-").map(Number);
  const pb = String(b).split("-").map(Number);
  const da = new Date(pa[0], (pa[1] || 1) - 1, pa[2] || 1).getTime();
  const db = new Date(pb[0], (pb[1] || 1) - 1, pb[2] || 1).getTime();
  return Math.round((da - db) / 864e5);
}
function nowIso() {
  return (/* @__PURE__ */ new Date()).toISOString();
}
function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}
var STAGES = [
  {
    n: 1,
    key: "lead",
    name: "\u7EBF\u7D22",
    action: "\u8BB0\u5F55\u5BA2\u6237\u8D44\u6599 / \u9700\u6C42 / \u9884\u7B97",
    deliver: "\u5BA2\u6237\u6863\u6848",
    next: { title: "\u9884\u7EA6\u5BA2\u6237\u91CF\u623F", type: "\u91CF\u623F", inDays: 1 }
  },
  {
    n: 2,
    key: "measure",
    name: "\u91CF\u623F",
    action: "\u4E0A\u95E8\u91CF\u5C3A + \u62CD\u7167 + \u73B0\u573A\u786E\u8BA4\u9700\u6C42",
    deliver: "\u6237\u578B\u6570\u636E + \u73B0\u573A\u7167\u7247",
    next: { title: "\u8F93\u51FA\u5E73\u9762\u65B9\u6848", type: "\u8BBE\u8BA1", inDays: 2 }
  },
  {
    n: 3,
    key: "design",
    name: "\u65B9\u6848\u8BBE\u8BA1",
    action: "\u5E73\u9762 \u2192 \u6548\u679C\u56FE \u2192 \u6C47\u62A5 PPT",
    deliver: "\u65B9\u6848 PPT + \u6548\u679C\u56FE",
    next: { title: "\u8F93\u51FA\u62A5\u4EF7\u5355", type: "\u62A5\u4EF7", inDays: 1 }
  },
  {
    n: 4,
    key: "quote",
    name: "\u62A5\u4EF7",
    action: "\u51FA\u62A5\u4EF7\u5355\u3001\u53D1\u9001\u3001\u8DDF\u8FDB",
    deliver: "\u62A5\u4EF7\u5355 v1",
    next: { title: "\u8DDF\u8FDB\u56DE\u8BBF", type: "\u56DE\u8BBF", inDays: 2 }
  },
  {
    n: 5,
    key: "sign",
    name: "\u7B7E\u7EA6",
    action: "\u5408\u540C + \u6536\u6B3E\u8BA1\u5212",
    deliver: "\u5408\u540C",
    next: { title: "\u9884\u7EA6\u5BA2\u6237\u5230\u5E97\u9009\u6750", type: "\u5230\u5E97", inDays: 1 }
  },
  {
    n: 6,
    key: "pick",
    name: "\u9009\u6750\u6DF1\u5316",
    action: "\u966A\u540C\u9009\u6750\u3001\u786E\u8BA4\u4E3B\u6750",
    deliver: "\u9009\u6750\u6E05\u5355",
    next: { title: "\u6750\u6599\u4E0B\u5355", type: "\u6750\u6599", inDays: 1 }
  },
  {
    n: 7,
    key: "build",
    name: "\u65BD\u5DE5",
    action: "\u8282\u70B9\u5DE1\u68C0 \u6C34\u7535 / \u74E6 / \u6728 / \u6CB9 / \u5B89\u88C5",
    deliver: "\u5DE1\u68C0\u8BB0\u5F55 + \u7167\u7247",
    next: { title: "\u4E0B\u6B21\u5DE5\u5730\u5DE1\u68C0", type: "\u5DE1\u68C0", inDays: 3 }
  },
  {
    n: 8,
    key: "accept",
    name: "\u5B89\u88C5\u9A8C\u6536",
    action: "\u5B89\u88C5\u3001\u9A8C\u6536\u3001\u6574\u6539",
    deliver: "\u9A8C\u6536\u5355",
    next: { title: "\u529E\u7406\u7ED3\u9879", type: "\u7ED3\u9879", inDays: 2 }
  },
  {
    n: 9,
    key: "close",
    name: "\u7ED3\u9879\u56DE\u8BBF",
    action: "\u56DE\u8BBF\u3001\u8981\u8F6C\u4ECB\u7ECD",
    deliver: "\u5BA2\u6237\u53E3\u7891 / \u6848\u4F8B",
    next: null
  }
];
function stageDef(n) {
  return STAGES.find((s) => s.n === n) ?? STAGES[0];
}
var DEFAULT_NODE_MAP = {
  positive: { node: "", input: "text" },
  negative: { node: "", input: "text" },
  seed: { node: "", input: "seed" },
  width: { node: "", input: "width" },
  height: { node: "", input: "height" },
  batch: { node: "", input: "batch_size" },
  image: { node: "", input: "image" }
};
var DEFAULT_PROMPT_TEMPLATE = "interior design, {space}, {style} style, {materials}, {light}, photorealistic, 8k, architectural photography, soft natural light, high detail, professional interior rendering, magazine quality";
var DEFAULT_NEGATIVE_PROMPT = "lowres, blurry, watermark, text, deformed, extra furniture, distorted perspective, oversaturated";
var DEFAULT_CONFIG = {
  comfyHost: "http://127.0.0.1:8188",
  workflowPath: "",
  comfyOutputDir: "",
  nodeMap: DEFAULT_NODE_MAP,
  promptTemplate: DEFAULT_PROMPT_TEMPLATE,
  negativePrompt: DEFAULT_NEGATIVE_PROMPT,
  summaryEnabled: true,
  summaryAt: "08:30",
  silentDays: 5,
  pollIntervalMs: 2e3,
  pollTimeoutMs: 6e5
};

// src/store.ts
var DESK_HOME = process.env.DESIGNER_DESK_HOME || path.join(os.homedir(), ".designer-desk");
var DATA_FILE = path.join(DESK_HOME, "data.json");
var BAK_FILE = path.join(DESK_HOME, "data.bak.json");
var CONFIG_FILE = path.join(DESK_HOME, "config.json");
var RENDERS_DIR = path.join(DESK_HOME, "renders");
function emptyDB() {
  return {
    version: 1,
    customers: [],
    projects: [],
    tasks: [],
    renders: [],
    sites: [],
    materials: [],
    refimages: [],
    quotes: [],
    contracts: [],
    contents: [],
    reading: []
  };
}
function normalizeDB(raw) {
  const base = emptyDB();
  if (!raw || typeof raw !== "object") return base;
  for (const key of Object.keys(base)) {
    if (key === "version") continue;
    const v = raw[key];
    base[key] = Array.isArray(v) ? v : [];
  }
  base.version = Number(raw.version) || 1;
  return base;
}
function normalizeConfig(raw) {
  const cfg = { ...DEFAULT_CONFIG, ...raw ?? {} };
  cfg.nodeMap = { ...DEFAULT_NODE_MAP, ...raw?.nodeMap ?? {} };
  for (const k of Object.keys(DEFAULT_NODE_MAP)) {
    const merged = { ...DEFAULT_NODE_MAP[k], ...raw?.nodeMap?.[k] ?? {} };
    cfg.nodeMap[k] = merged;
  }
  if (!cfg.promptTemplate) cfg.promptTemplate = DEFAULT_PROMPT_TEMPLATE;
  if (!cfg.negativePrompt) cfg.negativePrompt = DEFAULT_NEGATIVE_PROMPT;
  if (!cfg.summaryAt) cfg.summaryAt = "08:30";
  return cfg;
}
async function ensureDirs() {
  await fs.mkdir(DESK_HOME, { recursive: true });
  await fs.mkdir(RENDERS_DIR, { recursive: true });
}
function renderDirFor(projectLabel, date) {
  const safe = String(projectLabel || "unassigned").replace(/[\\/:*?"<>|]/g, "_").trim() || "unassigned";
  return path.join(RENDERS_DIR, safe, date);
}
var cache = null;
async function loadDB() {
  if (cache) return cache;
  await ensureDirs();
  let existed = true;
  try {
    const text = await fs.readFile(DATA_FILE, "utf8");
    cache = normalizeDB(JSON.parse(text));
  } catch {
    existed = false;
    cache = emptyDB();
  }
  if (!existed) {
    cache = seedDemo(cache);
    await writeRaw(cache);
  }
  return cache;
}
async function writeRaw(db) {
  await ensureDirs();
  const tmp = `${DATA_FILE}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
  try {
    await fs.copyFile(DATA_FILE, BAK_FILE);
  } catch {
  }
  await fs.rename(tmp, DATA_FILE);
}
var chain = Promise.resolve();
function mutate(fn) {
  const run = async () => {
    const db = await loadDB();
    const result = fn(db);
    await writeRaw(db);
    return { db, result };
  };
  const p = chain.then(run, run);
  chain = p.then(
    () => void 0,
    () => void 0
  );
  return p;
}
async function replaceDB(next) {
  const normalized = normalizeDB(next);
  await writeRaw(normalized);
  cache = normalized;
  return normalized;
}
async function storageInfo() {
  let bytes = 0;
  let lastBackup = "";
  try {
    bytes = (await fs.stat(DATA_FILE)).size;
  } catch {
  }
  try {
    lastBackup = (await fs.stat(BAK_FILE)).mtime.toISOString();
  } catch {
  }
  return { bytes, lastBackup, dataFile: DATA_FILE };
}
var cfgCache = null;
async function loadConfig() {
  if (cfgCache) return cfgCache;
  await ensureDirs();
  try {
    cfgCache = normalizeConfig(JSON.parse(await fs.readFile(CONFIG_FILE, "utf8")));
  } catch {
    cfgCache = { ...DEFAULT_CONFIG, nodeMap: { ...DEFAULT_NODE_MAP } };
    await fs.writeFile(CONFIG_FILE, JSON.stringify(cfgCache, null, 2), "utf8");
  }
  return cfgCache;
}
async function saveConfig(patch) {
  const cur = await loadConfig();
  cfgCache = normalizeConfig({ ...cur, ...patch ?? {} });
  await ensureDirs();
  await fs.writeFile(CONFIG_FILE, JSON.stringify(cfgCache, null, 2), "utf8");
  return cfgCache;
}
function seedDemo(db) {
  const today = todayStr();
  const now = nowIso();
  const minus = (n) => addDaysStr(today, -n);
  const plus = (n) => addDaysStr(today, n);
  const customers = [
    { id: "cus_wang", name: "\u738B\u5973\u58EB", phone: "138****2211", wechat: "wangxs88", community: "\u91D1\u5730\u82B1\u56ED", roomNo: "1201", layout: "\u4E09\u5BA4\u4E24\u5385", area: 118, style: "\u5976\u6CB9\u98CE", budget: 32e4, family: "\u592B\u59BB + 1 \u4E2A 5 \u5C81\u5973\u513F", taboo: "\u4E0D\u63A5\u53D7\u5F00\u653E\u5F0F\u53A8\u623F", note: "\u670B\u53CB\u4ECB\u7ECD\uFF0C\u91CD\u70B9\u770B\u50A8\u7269", createdAt: now, updatedAt: now },
    { id: "cus_li", name: "\u674E\u5148\u751F", phone: "139****7788", wechat: "lizh_2026", community: "\u878D\u521B\u58F9\u53F7\u9662", roomNo: "802", layout: "\u56DB\u5BA4\u4E24\u5385", area: 156, style: "\u65B0\u4E2D\u5F0F", budget: 52e4, family: "\u4E09\u4EE3\u540C\u5802", taboo: "\u8001\u4EBA\u6015\u51B7\uFF0C\u5730\u6696\u5FC5\u7559", note: "\u5728\u610F\u98CE\u6C34\uFF0C\u5BA2\u536B\u95E8\u4E0D\u51B2\u6C99\u53D1", createdAt: now, updatedAt: now },
    { id: "cus_zhang", name: "\u5F20\u5148\u751F", phone: "137****3344", wechat: "zhang_lei", community: "\u4E2D\u6D77\u56FD\u9645", roomNo: "B1203", layout: "\u4E24\u5BA4\u4E00\u5385", area: 89, style: "\u73B0\u4EE3\u7B80\u7EA6", budget: 21e4, family: "\u5355\u8EAB", taboo: "\u65E0", note: "\u9884\u7B97\u654F\u611F\uFF0C\u62A5\u4EF7\u8981\u62C6\u7EC6", createdAt: now, updatedAt: minus(8) },
    { id: "cus_chen", name: "\u9648\u5973\u58EB", phone: "135****9900", wechat: "chenyy", community: "\u4E07\u79D1\u7FE1\u7FE0", roomNo: "506", layout: "\u4E09\u5BA4\u4E00\u5385", area: 108, style: "\u4F98\u5BC2\u98CE", budget: 28e4, family: "\u592B\u59BB + \u732B", taboo: "\u732B\u722C\u67B6\u8981\u5D4C\u5165\u5899\u4F53", note: "\u5DF2\u7B7E\u7EA6\uFF0C\u65BD\u5DE5\u4E2D", createdAt: now, updatedAt: minus(1) },
    { id: "cus_liu", name: "\u5218\u5148\u751F", phone: "136****1122", wechat: "liu_bd", community: "\u4FDD\u5229\u5929\u60A6", roomNo: "1501", layout: "\u56DB\u5BA4\u4E24\u5385", area: 172, style: "\u8F7B\u5962", budget: 65e4, family: "\u592B\u59BB + 2 \u5B69", taboo: "\u8981\u72EC\u7ACB\u4E66\u623F", note: "\u6296\u97F3\u6765\u7684\u7EBF\u7D22\uFF0C\u8FD8\u6CA1\u91CF\u623F", createdAt: now, updatedAt: now }
  ];
  const projects = [
    { id: "prj_wang", customerId: "cus_wang", name: "\u91D1\u5730\u82B1\u56ED-1201", stage: 2, nextAction: "\u9884\u7EA6\u5BA2\u6237\u91CF\u623F", nextActionAt: minus(1), amount: 0, logs: [{ at: now, text: "\u5EFA\u6863\uFF0C\u6765\u6E90\uFF1A\u670B\u53CB\u4ECB\u7ECD", stage: 1 }], createdAt: now, updatedAt: now },
    { id: "prj_li", customerId: "cus_li", name: "\u878D\u521B\u58F9\u53F7\u9662-802", stage: 3, nextAction: "\u8F93\u51FA\u5E73\u9762\u65B9\u6848", nextActionAt: today, amount: 0, logs: [{ at: now, text: "\u73B0\u573A\u91CF\u623F\u5B8C\u6210\uFF0C\u6237\u578B\u5DF2\u5F52\u6863", stage: 2 }], createdAt: now, updatedAt: now },
    { id: "prj_zhang", customerId: "cus_zhang", name: "\u4E2D\u6D77\u56FD\u9645-B1203", stage: 4, nextAction: "\u8DDF\u8FDB\u56DE\u8BBF", nextActionAt: plus(2), amount: 205e3, logs: [{ at: now, text: "\u62A5\u4EF7\u5355 v1 \u5DF2\u53D1\u9001", stage: 4 }], createdAt: now, updatedAt: minus(8) },
    { id: "prj_chen", customerId: "cus_chen", name: "\u4E07\u79D1\u7FE1\u7FE0-506", stage: 7, nextAction: "\u4E0B\u6B21\u5DE5\u5730\u5DE1\u68C0", nextActionAt: plus(3), amount: 276e3, signDate: minus(20), logs: [{ at: now, text: "\u6C34\u7535\u8282\u70B9\u5DE1\u68C0\u901A\u8FC7", stage: 7 }], createdAt: now, updatedAt: minus(1) },
    { id: "prj_liu", customerId: "cus_liu", name: "\u4FDD\u5229\u5929\u60A6-1501", stage: 1, nextAction: "\u52A0\u5FAE\u4FE1\u786E\u8BA4\u9700\u6C42", nextActionAt: void 0, amount: 0, logs: [{ at: now, text: "\u6296\u97F3\u7EBF\u7D22\u5EFA\u6863", stage: 1 }], createdAt: now, updatedAt: now }
  ];
  const tasks = [
    { id: "tsk_1", projectId: "prj_wang", title: "\u4E0A\u95E8\u91CF\u623F\uFF08\u91D1\u5730\u82B1\u56ED-1201\uFF09", type: "\u91CF\u623F", dueAt: minus(1), done: false, priority: "P0", createdAt: now },
    { id: "tsk_2", projectId: "prj_li", title: "\u8F93\u51FA\u5E73\u9762\u65B9\u6848\uFF08\u878D\u521B\u58F9\u53F7\u9662-802\uFF09", type: "\u8BBE\u8BA1", dueAt: today, done: false, priority: "P0", createdAt: now },
    { id: "tsk_3", projectId: "prj_zhang", title: "\u62A5\u4EF7\u8DDF\u8FDB\u56DE\u8BBF\uFF08\u4E2D\u6D77\u56FD\u9645-B1203\uFF09", type: "\u56DE\u8BBF", dueAt: plus(2), done: false, priority: "P1", createdAt: now },
    { id: "tsk_4", projectId: "prj_chen", title: "\u6C34\u7535\u8282\u70B9\u5DE1\u68C0\uFF08\u4E07\u79D1\u7FE1\u7FE0-506\uFF09", type: "\u5DE1\u68C0", dueAt: plus(3), done: false, priority: "P1", createdAt: now },
    { id: "tsk_5", projectId: "prj_liu", title: "\u52A0\u5FAE\u4FE1\u786E\u8BA4\u9700\u6C42\uFF08\u4FDD\u5229\u5929\u60A6-1501\uFF09", type: "\u5176\u4ED6", dueAt: void 0, done: false, priority: "P2", createdAt: now },
    { id: "tsk_6", projectId: "prj_chen", title: "\u6574\u7406\u65B9\u6848\u6C47\u62A5 PPT\uFF08\u4E07\u79D1\u7FE1\u7FE0-506\uFF09", type: "\u8BBE\u8BA1", dueAt: minus(2), done: true, doneAt: now, createdAt: now }
  ];
  const sites = [
    { id: "site_1", projectId: "prj_chen", node: "\u6C34\u7535", status: "\u901A\u8FC7", plannedAt: minus(20), doneAt: minus(20), note: "\u5F00\u69FD\u89C4\u8303\uFF0C\u6253\u538B\u6D4B\u8BD5\u5408\u683C", photos: [], createdAt: now, updatedAt: now },
    { id: "site_2", projectId: "prj_chen", node: "\u74E6\u5DE5", status: "\u901A\u8FC7", plannedAt: minus(8), doneAt: minus(8), note: "\u74F7\u7816\u7A7A\u9F13\u7387\u5408\u683C", photos: [], createdAt: now, updatedAt: now },
    { id: "site_3", projectId: "prj_chen", node: "\u6728\u5DE5", status: "\u8FDB\u884C\u4E2D", plannedAt: today, note: "\u540A\u9876\u4E0E\u67DC\u4F53\u65BD\u5DE5\u4E2D", photos: [], createdAt: now, updatedAt: now },
    { id: "site_4", projectId: "prj_chen", node: "\u6CB9\u6F06", status: "\u5F85\u5DE1\u68C0", plannedAt: plus(5), note: "", photos: [], createdAt: now, updatedAt: now },
    { id: "site_5", projectId: "prj_chen", node: "\u5B89\u88C5", status: "\u5F85\u5DE1\u68C0", plannedAt: plus(12), note: "", photos: [], createdAt: now, updatedAt: now }
  ];
  const materials = [
    { id: "mat_1", projectId: "prj_chen", name: "\u5BA2\u5385\u5730\u7816", category: "\u74F7\u7816", brand: "\u9A6C\u53EF\u6CE2\u7F57", spec: "800\xD7800 \u67D4\u5149", price: 18e3, qty: 1, unit: "\u6279", supplier: "\u7EA2\u661F\u7F8E\u51EF\u9F99", arriveAt: minus(15), status: "\u5DF2\u9A8C\u6536", createdAt: now, updatedAt: now },
    { id: "mat_2", projectId: "prj_chen", name: "\u5B9E\u6728\u590D\u5408\u5730\u677F", category: "\u5730\u677F", brand: "\u5927\u81EA\u7136", spec: "1220\xD7200 \u6A61\u6728\u8272", price: 22e3, qty: 1, unit: "\u6279", supplier: "\u5EFA\u6750\u5E02\u573A B \u533A", arriveAt: minus(3), status: "\u5DF2\u5230\u573A", createdAt: now, updatedAt: now },
    { id: "mat_3", projectId: "prj_chen", name: "\u5B9A\u5236\u6A71\u67DC", category: "\u6A71\u67DC", brand: "\u6B27\u6D3E", spec: "L \u578B 4.2m", price: 35e3, qty: 1, unit: "\u5957", supplier: "\u6B27\u6D3E\u95E8\u5E97", arriveAt: plus(2), status: "\u5728\u9014", createdAt: now, updatedAt: now },
    { id: "mat_4", projectId: "prj_chen", name: "\u4E73\u80F6\u6F06", category: "\u6D82\u6599", brand: "\u90FD\u82B3", spec: "5L\xD76 \u6D45\u674F\u8272", price: 4200, qty: 1, unit: "\u6279", supplier: "\u5929\u732B\u65D7\u8230\u5E97", arriveAt: plus(4), status: "\u5DF2\u4E0B\u5355", createdAt: now, updatedAt: now },
    { id: "mat_5", projectId: "prj_chen", name: "\u4E2D\u592E\u7A7A\u8C03", category: "\u7535\u5668", brand: "\u5927\u91D1", spec: "\u4E00\u62D6\u56DB", price: 48e3, qty: 1, unit: "\u5957", supplier: "\u5927\u91D1\u6388\u6743\u5E97", arriveAt: void 0, status: "\u5F85\u4E0B\u5355", createdAt: now, updatedAt: now }
  ];
  const refimages = [
    { id: "ref_1", title: "\u5976\u6CB9\u98CE\u5BA2\u5385\u53C2\u8003", tags: ["\u5976\u6CB9\u98CE", "\u5BA2\u5385", "\u6C99\u53D1\u80CC\u666F\u5899"], score: 5, source: "\u5C0F\u7EA2\u4E66", projectId: "prj_wang", createdAt: now },
    { id: "ref_2", title: "\u65B0\u4E2D\u5F0F\u7384\u5173", tags: ["\u65B0\u4E2D\u5F0F", "\u7384\u5173", "\u7AEF\u666F"], score: 4, source: "Pinterest", projectId: "prj_li", createdAt: now },
    { id: "ref_3", title: "\u4F98\u5BC2\u98CE\u5367\u5BA4", tags: ["\u4F98\u5BC2\u98CE", "\u5367\u5BA4", "\u5FAE\u6C34\u6CE5"], score: 5, source: "\u597D\u597D\u4F4F", projectId: "prj_chen", createdAt: now },
    { id: "ref_4", title: "\u73B0\u4EE3\u7B80\u7EA6\u5F00\u653E\u53A8\u623F", tags: ["\u73B0\u4EE3\u7B80\u7EA6", "\u53A8\u623F", "\u5F00\u653E\u5F0F"], score: 4, source: "houzz", createdAt: now },
    { id: "ref_5", title: "\u8F7B\u5962\u4E3B\u5367\u80CC\u666F\u5899", tags: ["\u8F7B\u5962", "\u4E3B\u5367", "\u91D1\u5C5E\u7EBF\u6761"], score: 3, source: "\u7AD9\u9177", projectId: "prj_liu", createdAt: now },
    { id: "ref_6", title: "\u539F\u6728\u513F\u7AE5\u623F", tags: ["\u539F\u6728", "\u513F\u7AE5\u623F", "\u6536\u7EB3"], score: 4, source: "\u5C0F\u7EA2\u4E66", createdAt: now }
  ];
  return { ...db, customers, projects, tasks, sites, materials, refimages };
}
function clearAll(db) {
  const empty = emptyDB();
  empty.version = db.version;
  return empty;
}

// src/derive.ts
var PRIORITY_WEIGHT = { P0: 0, P1: 1, P2: 2 };
function compareTasks(a, b) {
  const ad = a.dueAt ?? "9999-12-31";
  const bd = b.dueAt ?? "9999-12-31";
  if (ad !== bd) return ad < bd ? -1 : 1;
  const ap = PRIORITY_WEIGHT[a.priority ?? "P1"] ?? 1;
  const bp = PRIORITY_WEIGHT[b.priority ?? "P1"] ?? 1;
  if (ap !== bp) return ap - bp;
  return (a.createdAt ?? "") < (b.createdAt ?? "") ? -1 : 1;
}
function sortTasks(list) {
  return [...list].sort(compareTasks);
}
function findCustomer(customers, id) {
  return customers.find((c) => c.id === id);
}
function toProjectView(p, customers) {
  const c = findCustomer(customers, p.customerId);
  const def = stageDef(p.stage);
  const today = todayStr();
  const daysToNext = p.nextActionAt ? diffDays(p.nextActionAt, today) : null;
  return {
    ...p,
    customerName: c?.name ?? "\u672A\u547D\u540D\u5BA2\u6237",
    community: c?.community ?? "",
    roomNo: c?.roomNo ?? "",
    layout: c?.layout ?? "",
    style: c?.style ?? "",
    area: c?.area,
    stageName: def.name,
    stageAction: def.action,
    daysToNext,
    overdue: daysToNext !== null && daysToNext < 0 && !p.archived
  };
}
function toProjectViews(db) {
  return db.projects.filter((p) => !p.archived).map((p) => toProjectView(p, db.customers)).sort((a, b) => {
    if (a.stage !== b.stage) return b.stage - a.stage;
    return (a.daysToNext ?? 999) - (b.daysToNext ?? 999);
  });
}
function computeBuckets(db, silentDays) {
  const today = todayStr();
  const open = db.tasks.filter((t) => !t.done);
  const overdue = [];
  const dueToday = [];
  const soon = [];
  const noDate = [];
  for (const t of open) {
    if (!t.dueAt) {
      noDate.push(t);
      continue;
    }
    const d = diffDays(t.dueAt, today);
    if (d < 0) overdue.push(t);
    else if (d === 0) dueToday.push(t);
    else if (d <= 3) soon.push(t);
  }
  const silent = toProjectViews(db).filter((p) => {
    if (p.stage !== 3 && p.stage !== 4) return false;
    const last = p.updatedAt ? ymd(new Date(p.updatedAt)) : today;
    return diffDays(today, last) >= Math.max(1, silentDays);
  });
  return {
    overdue: sortTasks(overdue),
    today: sortTasks(dueToday),
    soon: sortTasks(soon),
    noDate: sortTasks(noDate),
    silent
  };
}
function computeStats(db, views, buckets) {
  const byStage = [];
  for (let n = 1; n <= 9; n++) {
    byStage.push({
      n,
      name: stageDef(n).name,
      count: views.filter((v) => v.stage === n).length
    });
  }
  return {
    projectCount: views.length,
    activeCount: views.filter((v) => v.stage <= 8).length,
    byStage,
    todayCount: buckets.today.length,
    overdueCount: buckets.overdue.length,
    renderCount: db.renders.filter((r) => r.status === "done").length
  };
}
function advanceProject(project, note) {
  const today = todayStr();
  const from = stageDef(project.stage);
  const nextStage = Math.min(9, project.stage + 1);
  const to = stageDef(nextStage);
  project.logs = Array.isArray(project.logs) ? project.logs : [];
  project.logs.push({
    at: nowIso(),
    stage: project.stage,
    text: note?.trim() ? `\u5B8C\u6210\u300C${from.name}\u300D\uFF1A${note.trim()}` : `\u5B8C\u6210\u300C${from.name}\u300D\u2192 \u8FDB\u5165\u300C${to.name}\u300D`
  });
  project.stage = nextStage;
  let createdTask = null;
  if (to.next) {
    project.nextAction = to.next.title;
    project.nextActionAt = addDaysStr(today, to.next.inDays);
    createdTask = {
      id: uid("tsk"),
      projectId: project.id,
      title: `${to.next.title}\uFF08${project.name}\uFF09`,
      type: to.next.type,
      dueAt: project.nextActionAt,
      done: false,
      priority: to.next.inDays <= 1 ? "P0" : "P1",
      createdAt: nowIso()
    };
  } else {
    project.nextAction = void 0;
    project.nextActionAt = void 0;
    project.archived = true;
  }
  project.updatedAt = nowIso();
  return {
    project,
    createdTask,
    finishedStage: from.name,
    nextStageName: to.name
  };
}

// src/comfy.ts
import { promises as fs2 } from "node:fs";
import path2 from "node:path";
var RATIOS = {
  "16:9": { width: 1344, height: 768, label: "16:9 \u6A2A\u6784\u56FE" },
  "3:2": { width: 1216, height: 832, label: "3:2 \u6A2A\u6784\u56FE" },
  "4:3": { width: 1152, height: 896, label: "4:3 \u6A2A\u6784\u56FE" },
  "1:1": { width: 1024, height: 1024, label: "1:1 \u65B9\u56FE" },
  "3:4": { width: 896, height: 1152, label: "3:4 \u7AD6\u6784\u56FE" },
  "9:16": { width: 768, height: 1344, label: "9:16 \u624B\u673A\u7AD6\u5C4F" },
  "21:9": { width: 1536, height: 640, label: "21:9 \u5168\u666F" }
};
var jobs = /* @__PURE__ */ new Map();
var JOB_KEEP = 60;
function rememberJob(job) {
  jobs.set(job.jobId, job);
  if (jobs.size > JOB_KEEP) {
    const oldest = [...jobs.values()].sort((a, b) => a.startedAt < b.startedAt ? -1 : 1)[0];
    if (oldest) jobs.delete(oldest.jobId);
  }
}
function getJob(jobId) {
  return jobs.get(jobId);
}
function listJobs() {
  return [...jobs.values()].sort((a, b) => a.startedAt < b.startedAt ? 1 : -1);
}
function baseUrl(cfg) {
  const host = String(cfg.comfyHost || "").trim().replace(/\/+$/, "");
  return host || "http://127.0.0.1:8188";
}
async function fetchJson(url, timeoutMs = 8e3) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: ac.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
async function postJson(url, body, timeoutMs = 15e3) {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      signal: ac.signal
    });
    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status} ${text.slice(0, 300)}`);
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } finally {
    clearTimeout(timer);
  }
}
function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
async function comfyStatus(cfg) {
  const host = baseUrl(cfg);
  const workflowReady = Boolean(cfg.workflowPath) && Boolean(cfg.nodeMap?.positive?.node);
  try {
    const stats = await fetchJson(`${host}/system_stats`, 4e3);
    return {
      ok: true,
      host,
      message: workflowReady ? "\u5DF2\u8FDE\u63A5\uFF0C\u5DE5\u4F5C\u6D41\u5C31\u7EEA" : "\u5DF2\u8FDE\u63A5\uFF0C\u4F46\u8FD8\u6CA1\u914D\u7F6E\u5DE5\u4F5C\u6D41\uFF08\u53BB\u8BBE\u7F6E\u9762\u677F\u586B\uFF09",
      workflowReady,
      system: stats
    };
  } catch (err) {
    return {
      ok: false,
      host,
      message: `\u672A\u8FDE\u63A5\uFF08${err?.message ?? "\u8FDE\u63A5\u5931\u8D25"}\uFF09\u2014\u2014 \u8BF7\u786E\u8BA4 ComfyUI \u5DF2\u542F\u52A8`,
      workflowReady
    };
  }
}
var wfCache = null;
async function loadWorkflow(cfg, force = false) {
  const file = String(cfg.workflowPath || "").trim();
  if (!file) throw new Error("\u672A\u914D\u7F6E\u5DE5\u4F5C\u6D41\u6587\u4EF6\u8DEF\u5F84\uFF0C\u8BF7\u5230\u8BBE\u7F6E\u9762\u677F\u586B\u5199\uFF08\u5FC5\u987B\u662F API \u683C\u5F0F JSON\uFF09");
  const stat = await fs2.stat(file).catch(() => null);
  if (!stat) throw new Error(`\u5DE5\u4F5C\u6D41\u6587\u4EF6\u4E0D\u5B58\u5728\uFF1A${file}`);
  if (!force && wfCache && wfCache.file === file && wfCache.mtimeMs === stat.mtimeMs) {
    return JSON.parse(JSON.stringify(wfCache.json));
  }
  const raw = await fs2.readFile(file, "utf8");
  let json;
  try {
    json = JSON.parse(raw);
  } catch {
    throw new Error("\u5DE5\u4F5C\u6D41 JSON \u89E3\u6790\u5931\u8D25 \u2014\u2014 \u8BF7\u786E\u8BA4\u5BFC\u51FA\u7684\u662F API \u683C\u5F0F");
  }
  const keys = Object.keys(json ?? {});
  if (!keys.length) throw new Error("\u5DE5\u4F5C\u6D41\u4E3A\u7A7A");
  const first = json[keys[0]];
  if (!first || typeof first !== "object" || !("class_type" in first) || !("inputs" in first)) {
    throw new Error(
      "\u8FD9\u770B\u8D77\u6765\u4E0D\u662F API \u683C\u5F0F\u7684\u5DE5\u4F5C\u6D41 \u2014\u2014 \u8BF7\u5728 ComfyUI \u91CC\u7528 Workflow \u2192 Export (API) \u91CD\u65B0\u5BFC\u51FA"
    );
  }
  wfCache = { file, mtimeMs: stat.mtimeMs, json };
  return JSON.parse(JSON.stringify(json));
}
function setInput(wf, slot, value) {
  if (!slot || !slot.node) return false;
  const node = wf?.[slot.node];
  if (!node || typeof node !== "object") return false;
  if (!node.inputs || typeof node.inputs !== "object") node.inputs = {};
  node.inputs[slot.input || "text"] = value;
  return true;
}
function findNodeIdByInput(wf, key) {
  for (const id of Object.keys(wf ?? {})) {
    const node = wf[id];
    if (node?.inputs && key in node.inputs) return id;
  }
  return void 0;
}
function injectWorkflow(wf, cfg, opts) {
  const ratio = RATIOS[opts.ratio] ?? RATIOS["16:9"];
  const width = ratio.width;
  const height = ratio.height;
  const seed = Number.isFinite(opts.seed) && opts.seed >= 0 ? Math.floor(opts.seed) : Math.floor(Math.random() * 1e9);
  const nm = cfg.nodeMap ?? {};
  const applied = [];
  const missing = [];
  const trySet = (label, slot, value) => {
    if (!slot || !slot.node) return;
    if (setInput(wf, slot, value)) applied.push(label);
    else missing.push(label);
  };
  trySet("\u6B63\u5411\u63D0\u793A\u8BCD", nm.positive, opts.prompt);
  trySet("\u8D1F\u5411\u63D0\u793A\u8BCD", nm.negative, opts.negative);
  trySet("\u79CD\u5B50", nm.seed, seed);
  trySet("\u5BBD\u5EA6", nm.width, width);
  trySet("\u9AD8\u5EA6", nm.height, height);
  trySet("\u6279\u91CF\u5F20\u6570", nm.batch, Math.max(1, Math.min(8, opts.count)));
  if (!nm.width?.node) {
    const id = findNodeIdByInput(wf, "width");
    if (id) {
      wf[id].inputs.width = width;
      applied.push("\u5BBD\u5EA6\uFF08\u81EA\u52A8\u8BC6\u522B\uFF09");
    }
  }
  if (!nm.height?.node) {
    const id = findNodeIdByInput(wf, "height");
    if (id) {
      wf[id].inputs.height = height;
      applied.push("\u9AD8\u5EA6\uFF08\u81EA\u52A8\u8BC6\u522B\uFF09");
    }
  }
  return { workflow: wf, applied, missing, width, height, seed };
}
var LIGHT_PRESETS = {
  "\u81EA\u7136\u5149": "soft natural daylight from large windows",
  "\u6696\u5149": "warm cozy lighting, 3000K, ambient glow",
  "\u51B7\u5149": "cool even lighting, 5000K, crisp",
  "\u591C\u666F": "evening ambience, layered artificial lighting, glowing accents",
  "\u65E0\u4E3B\u706F": "no main chandelier, layered lighting with recessed spots and cove light"
};
function buildPrompt(cfg, req) {
  if (req.promptOverride?.trim()) return req.promptOverride.trim();
  const template = cfg.promptTemplate || "{space}, {style} style, {materials}, {light}";
  const light = LIGHT_PRESETS[req.light ?? ""] ?? req.light ?? "soft natural light";
  return template.replace(/\{space\}/g, req.space?.trim() || "living room").replace(/\{style\}/g, req.style?.trim() || "modern minimal").replace(/\{materials\}/g, req.materials?.trim() || "wood, stone, linen textures").replace(/\{light\}/g, light).replace(/\s{2,}/g, " ").replace(/,\s*,/g, ",").trim();
}
function extractItems(entry) {
  const items = [];
  const outputs = entry?.outputs ?? {};
  for (const nodeId of Object.keys(outputs)) {
    const out = outputs[nodeId] ?? {};
    for (const key of ["images", "gifs", "videos"]) {
      const arr = out[key];
      if (!Array.isArray(arr)) continue;
      for (const it of arr) {
        if (!it?.filename) continue;
        if (it.type === "temp") continue;
        if (!/\.(png|jpe?g|webp|gif|mp4)$/i.test(it.filename)) continue;
        items.push({
          filename: it.filename,
          subfolder: it.subfolder ?? "",
          type: it.type ?? "output"
        });
      }
    }
  }
  return items;
}
async function archiveItems(cfg, items, projectLabel, date) {
  const outDir = String(cfg.comfyOutputDir || "").trim();
  if (!outDir) return items;
  const target = renderDirFor(projectLabel, date);
  await fs2.mkdir(target, { recursive: true });
  const archived = [];
  for (const it of items) {
    const src = path2.join(outDir, it.subfolder || "", it.filename);
    const dst = path2.join(target, it.filename);
    try {
      await fs2.copyFile(src, dst);
      archived.push({ ...it, file: dst });
    } catch {
      archived.push(it);
    }
  }
  return archived;
}
async function readRenderImage(cfg, item) {
  if (item.file) {
    try {
      const buf2 = await fs2.readFile(item.file);
      return { dataUrl: toDataUrl(buf2, item.filename), source: "archive" };
    } catch {
    }
  }
  const qs = new URLSearchParams({
    filename: item.filename,
    subfolder: item.subfolder || "",
    type: item.type || "output"
  });
  const res = await fetch(`${baseUrl(cfg)}/view?${qs.toString()}`);
  if (!res.ok) throw new Error(`\u8BFB\u53D6\u56FE\u7247\u5931\u8D25 HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  return { dataUrl: toDataUrl(buf, item.filename), source: "comfy-proxy" };
}
function toDataUrl(buf, filename) {
  const ext = (filename.split(".").pop() ?? "png").toLowerCase();
  const mime = ext === "jpg" || ext === "jpeg" ? "image/jpeg" : ext === "webp" ? "image/webp" : ext === "gif" ? "image/gif" : ext === "mp4" ? "video/mp4" : "image/png";
  return `data:${mime};base64,${buf.toString("base64")}`;
}
async function submitRender(cfg, req, sink) {
  const status = await comfyStatus(cfg);
  if (!status.ok) return { ok: false, error: status.message };
  if (!status.workflowReady) {
    return { ok: false, error: "\u8FD8\u6CA1\u914D\u7F6E\u5DE5\u4F5C\u6D41\uFF1A\u8BF7\u5230\u8BBE\u7F6E\u9762\u677F\u586B\u5199\u300C\u5DE5\u4F5C\u6D41\u6587\u4EF6\u8DEF\u5F84\u300D\u548C\u300C\u6B63\u5411\u63D0\u793A\u8BCD\u8282\u70B9\u300D" };
  }
  const prompt = buildPrompt(cfg, req);
  const negative = cfg.negativePrompt || "";
  const ratio = req.ratio || "16:9";
  const count = Math.max(1, Math.min(8, Number(req.count) || 1));
  let wf;
  try {
    wf = await loadWorkflow(cfg);
  } catch (err) {
    return { ok: false, error: err?.message ?? "\u5DE5\u4F5C\u6D41\u52A0\u8F7D\u5931\u8D25" };
  }
  const inj = injectWorkflow(wf, cfg, { prompt, negative, ratio, count, seed: req.seed });
  if (!inj.applied.includes("\u6B63\u5411\u63D0\u793A\u8BCD")) {
    return {
      ok: false,
      error: "\u8282\u70B9\u6620\u5C04\u6709\u8BEF\uFF1A\u6CA1\u80FD\u5728\u6307\u5B9A\u8282\u70B9\u4E0A\u5199\u5165\u6B63\u5411\u63D0\u793A\u8BCD\uFF0C\u8BF7\u68C0\u67E5\u8BBE\u7F6E\u9762\u677F\u91CC\u7684\u8282\u70B9 ID \u4E0E\u5B57\u6BB5\u540D"
    };
  }
  const renderId = uid("rnd");
  const jobId = uid("job");
  const createdAt = nowIso();
  const label = req.projectLabel || "unassigned";
  await sink.persist({
    id: renderId,
    projectId: req.projectId,
    projectLabel: label,
    jobId,
    prompt,
    negative,
    space: req.space,
    style: req.style,
    materials: req.materials,
    ratio,
    width: inj.width,
    height: inj.height,
    count,
    seed: inj.seed,
    status: "queued",
    items: [],
    createdAt
  });
  const job = {
    jobId,
    renderId,
    projectId: req.projectId,
    status: "queued",
    progress: 5,
    message: "\u5DF2\u63D0\u4EA4\u5230 ComfyUI\uFF0C\u6392\u961F\u4E2D\u2026",
    items: [],
    startedAt: createdAt,
    updatedAt: createdAt
  };
  rememberJob(job);
  let promptId;
  try {
    const res = await postJson(`${baseUrl(cfg)}/prompt`, {
      prompt: inj.workflow,
      client_id: "designer-desk"
    });
    promptId = res?.prompt_id;
    if (!promptId) {
      const detail = typeof res === "string" ? res : JSON.stringify(res?.error ?? res ?? {});
      throw new Error(detail.slice(0, 400));
    }
  } catch (err) {
    job.status = "failed";
    job.progress = 100;
    job.error = String(err?.message ?? err);
    job.message = `\u63D0\u4EA4\u5931\u8D25\uFF1A${job.error}`;
    job.updatedAt = nowIso();
    await sink.persist({ id: renderId, status: "failed", error: job.error });
    return { ok: false, error: job.message, renderId };
  }
  job.promptId = promptId;
  job.status = "running";
  job.progress = 15;
  job.message = "ComfyUI \u6B63\u5728\u751F\u6210\u2026";
  job.updatedAt = nowIso();
  await sink.persist({ id: renderId, status: "running" });
  void pollUntilDone(cfg, job, sink, label);
  return {
    ok: true,
    jobId,
    renderId,
    prompt,
    width: inj.width,
    height: inj.height,
    seed: inj.seed,
    applied: inj.applied,
    missing: inj.missing
  };
}
async function pollUntilDone(cfg, job, sink, label) {
  const deadline = Date.now() + (cfg.pollTimeoutMs || 6e5);
  const interval = Math.max(800, cfg.pollIntervalMs || 2e3);
  let tick = 0;
  while (Date.now() < deadline) {
    await sleep(interval);
    tick++;
    if (tick % 3 === 0) {
      job.progress = Math.min(90, job.progress + 4);
      job.updatedAt = nowIso();
    }
    try {
      const history = await fetchJson(`${baseUrl(cfg)}/history/${job.promptId}`, 6e3);
      const entry = history?.[job.promptId];
      if (!entry) continue;
      const statusStr = entry?.status?.status_str;
      if (statusStr === "error") {
        const msgs = entry?.status?.messages ?? [];
        const flat = JSON.stringify(msgs).slice(0, 400);
        throw new Error(`ComfyUI \u6267\u884C\u62A5\u9519\uFF1A${flat}`);
      }
      const items = extractItems(entry);
      if (!items.length) {
        if (statusStr === "success") throw new Error("\u6267\u884C\u5B8C\u6210\u4F46\u6CA1\u6709\u4EA7\u51FA\u56FE\u7247\uFF0C\u8BF7\u68C0\u67E5\u5DE5\u4F5C\u6D41\u7684\u8F93\u51FA\u8282\u70B9");
        continue;
      }
      const archived = await archiveItems(cfg, items, label, (/* @__PURE__ */ new Date()).toISOString().slice(0, 10));
      job.items = archived;
      job.status = "done";
      job.progress = 100;
      job.message = `\u5B8C\u6210\uFF0C\u5171 ${archived.length} \u5F20`;
      job.updatedAt = nowIso();
      await sink.persist({ id: job.renderId, status: "done", items: archived });
      return;
    } catch (err) {
      const msg = String(err?.message ?? err);
      if (msg.includes("\u6267\u884C\u62A5\u9519") || msg.includes("\u6CA1\u6709\u4EA7\u51FA\u56FE\u7247")) {
        job.status = "failed";
        job.progress = 100;
        job.error = msg;
        job.message = msg;
        job.updatedAt = nowIso();
        await sink.persist({ id: job.renderId, status: "failed", error: msg });
        return;
      }
    }
  }
  job.status = "failed";
  job.progress = 100;
  job.error = "\u51FA\u56FE\u8D85\u65F6";
  job.message = "\u51FA\u56FE\u8D85\u65F6 \u2014\u2014 \u8BF7\u68C0\u67E5 ComfyUI \u662F\u5426\u5361\u4F4F\uFF0C\u6216\u8C03\u5927\u8D85\u65F6\u65F6\u95F4";
  job.updatedAt = nowIso();
  await sink.persist({ id: job.renderId, status: "failed", error: job.error });
}

// src/routes.ts
var PREFIX = "/designer-desk";
function q(req, key) {
  const direct = req?.query?.[key] ?? req?.params?.[key];
  if (direct !== void 0 && direct !== null) return String(direct);
  const url = typeof req?.url === "string" ? req.url : req?.raw?.url;
  if (typeof url === "string") {
    const i = url.indexOf("?");
    if (i >= 0) {
      const v = new URLSearchParams(url.slice(i + 1)).get(key);
      if (v !== null) return v;
    }
  }
  return void 0;
}
async function readBody(req) {
  try {
    if (typeof req?.json === "function") {
      const v = await req.json();
      if (v !== void 0 && v !== null) return v;
    }
    if (req?.body && typeof req.body === "object") return req.body;
    if (typeof req?.body === "string" && req.body.trim()) return JSON.parse(req.body);
    const raw = req?.raw?.body;
    if (raw) return typeof raw === "string" ? JSON.parse(raw) : raw;
  } catch {
  }
  return {};
}
function fail(error) {
  return { ok: false, error: String(error?.message ?? error) };
}
var comfyCache = null;
async function comfyStatusCached(ctx, force = false) {
  const ttl = 15e3;
  if (!force && comfyCache && Date.now() - comfyCache.at < ttl) return comfyCache.value;
  let value;
  try {
    const cfg = await loadConfig();
    value = await comfyStatus(cfg);
  } catch (err) {
    value = { ok: false, host: "", message: String(err?.message ?? err), workflowReady: false };
  }
  comfyCache = { at: Date.now(), value };
  return value;
}
function invalidateComfyCache() {
  comfyCache = null;
}
async function buildState(ctx) {
  const db = await loadDB();
  const cfg = await loadConfig();
  const views = toProjectViews(db);
  const buckets = computeBuckets(db, cfg.silentDays);
  const stats = computeStats(db, views, buckets);
  const info = await storageInfo();
  const comfy = await comfyStatusCached(ctx);
  return {
    ok: true,
    now: todayStr(),
    nowTime: (/* @__PURE__ */ new Date()).toTimeString().slice(0, 5),
    config: cfg,
    stages: STAGES,
    customers: db.customers,
    projects: views,
    tasks: db.tasks,
    renders: db.renders.slice(0, 60),
    sites: db.sites,
    materials: db.materials,
    refimages: db.refimages,
    buckets,
    stats,
    comfy,
    storage: {
      home: DESK_HOME,
      dataFile: DATA_FILE,
      bytes: info.bytes,
      lastBackup: info.lastBackup
    }
  };
}
var renderSink = {
  async persist(patch) {
    await mutate((db) => {
      const idx = db.renders.findIndex((r) => r.id === patch.id);
      if (idx >= 0) {
        db.renders[idx] = { ...db.renders[idx], ...patch };
      } else {
        db.renders.unshift({ items: [], ...patch });
        if (db.renders.length > 300) db.renders.length = 300;
      }
    });
  }
};
function upsertCustomer(db, input) {
  const now = nowIso();
  const id = input?.id || uid("cus");
  const idx = db.customers.findIndex((c) => c.id === id);
  if (idx >= 0) {
    db.customers[idx] = { ...db.customers[idx], ...input, id, updatedAt: now };
    return db.customers[idx];
  }
  const created = {
    id,
    name: input?.name?.trim() || "\u672A\u547D\u540D\u5BA2\u6237",
    phone: input?.phone ?? "",
    wechat: input?.wechat ?? "",
    community: input?.community ?? "",
    roomNo: input?.roomNo ?? "",
    layout: input?.layout ?? "",
    area: input?.area === "" || input?.area === void 0 ? void 0 : Number(input.area),
    style: input?.style ?? "",
    budget: input?.budget === "" || input?.budget === void 0 ? void 0 : Number(input.budget),
    family: input?.family ?? "",
    taboo: input?.taboo ?? "",
    note: input?.note ?? "",
    createdAt: now,
    updatedAt: now
  };
  db.customers.push(created);
  return created;
}
function createProject(db, input, customer) {
  const now = nowIso();
  const today = todayStr();
  const stage1 = stageDef(1);
  const project = {
    id: input?.id || uid("prj"),
    customerId: customer.id,
    name: input?.name?.trim() || [customer.community, customer.roomNo].filter(Boolean).join("-") || `${customer.name} \u7684\u9879\u76EE`,
    stage: 1,
    nextAction: stage1.next?.title,
    nextActionAt: stage1.next ? addDaysStr(today, stage1.next.inDays) : void 0,
    amount: input?.amount ? Number(input.amount) : 0,
    logs: [{ at: now, text: `\u5EFA\u6863\uFF0C\u6765\u6E90\uFF1A${input?.source?.trim() || "\u624B\u52A8\u5F55\u5165"}`, stage: 1 }],
    createdAt: now,
    updatedAt: now
  };
  db.projects.push(project);
  const task = {
    id: uid("tsk"),
    projectId: project.id,
    title: `${stage1.next?.title ?? "\u8054\u7CFB\u5BA2\u6237"}\uFF08${project.name}\uFF09`,
    type: stage1.next?.type ?? "\u5176\u4ED6",
    dueAt: project.nextActionAt,
    done: false,
    priority: "P0",
    createdAt: now
  };
  db.tasks.push(task);
  return { project, task };
}
function completeTaskAndSync(db, task) {
  task.done = true;
  task.doneAt = nowIso();
  if (!task.projectId) return;
  const prj = db.projects.find((p) => p.id === task.projectId);
  if (!prj) return;
  if (prj.nextAction && task.title.includes(prj.nextAction)) {
    prj.updatedAt = nowIso();
  }
}
function registerRoutes(ctx) {
  const dispose = ctx.webServer.register((router) => {
    router.get(`${PREFIX}/health`, async () => ({
      ok: true,
      plugin: ctx.name ?? "designer-desk",
      version: "0.1.0",
      home: DESK_HOME,
      uptimeSec: Math.round(process.uptime())
    }));
    router.get(`${PREFIX}/state`, async () => {
      try {
        const state = await buildState(ctx);
        return { ...state, jobs: listJobs() };
      } catch (err) {
        return fail(err);
      }
    });
    router.get(`${PREFIX}/stages`, async () => ({ ok: true, stages: STAGES, ratios: RATIOS }));
    router.get(`${PREFIX}/config`, async () => {
      try {
        return { ok: true, config: await loadConfig() };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/config`, async (req) => {
      try {
        const body = await readBody(req);
        const config = await saveConfig(body?.patch ?? body ?? {});
        invalidateComfyCache();
        return { ok: true, config };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/project/save`, async (req) => {
      try {
        const body = await readBody(req);
        const out = await mutate((db) => {
          const input = body?.project ?? {};
          let customer;
          if (body?.customer && Object.keys(body.customer).length) {
            customer = upsertCustomer(db, body.customer);
          }
          if (input?.id) {
            const idx = db.projects.findIndex((p) => p.id === input.id);
            if (idx < 0) throw new Error("\u9879\u76EE\u4E0D\u5B58\u5728");
            const merged = { ...db.projects[idx], ...input, updatedAt: nowIso() };
            if (customer) merged.customerId = customer.id;
            db.projects[idx] = merged;
            return { project: merged, createdTask: null };
          }
          const c = customer ?? upsertCustomer(db, body?.customer ?? {});
          const { project, task } = createProject(db, input, c);
          return { project, createdTask: task };
        });
        return { ok: true, ...out.result };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/project/advance`, async (req) => {
      try {
        const body = await readBody(req);
        const out = await mutate((db) => {
          const prj = db.projects.find((p) => p.id === body?.id);
          if (!prj) throw new Error("\u9879\u76EE\u4E0D\u5B58\u5728");
          const res = advanceProject(prj, body?.note);
          if (res.createdTask) db.tasks.push(res.createdTask);
          return res;
        });
        return { ok: true, ...out.result };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/project/delete`, async (req) => {
      try {
        const body = await readBody(req);
        await mutate((db) => {
          db.projects = db.projects.filter((p) => p.id !== body?.id);
          db.tasks = db.tasks.filter((t) => t.projectId !== body?.id);
        });
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/task/save`, async (req) => {
      try {
        const body = await readBody(req);
        const out = await mutate((db) => {
          const input = body?.task ?? {};
          if (input?.id) {
            const idx = db.tasks.findIndex((t) => t.id === input.id);
            if (idx >= 0) {
              db.tasks[idx] = { ...db.tasks[idx], ...input };
              return db.tasks[idx];
            }
          }
          const created = {
            id: uid("tsk"),
            projectId: input?.projectId,
            title: String(input?.title ?? "").trim() || "\u672A\u547D\u540D\u5F85\u529E",
            type: input?.type ?? "\u5176\u4ED6",
            dueAt: input?.dueAt || void 0,
            done: Boolean(input?.done),
            priority: input?.priority ?? "P1",
            createdAt: nowIso()
          };
          db.tasks.push(created);
          return created;
        });
        return { ok: true, task: out.result };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/task/toggle`, async (req) => {
      try {
        const body = await readBody(req);
        const out = await mutate((db) => {
          const task = db.tasks.find((t) => t.id === body?.id);
          if (!task) throw new Error("\u5F85\u529E\u4E0D\u5B58\u5728");
          const wantDone = body?.done === void 0 ? !task.done : Boolean(body.done);
          if (wantDone) completeTaskAndSync(db, task);
          else {
            task.done = false;
            task.doneAt = void 0;
          }
          return task;
        });
        return { ok: true, task: out.result };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/task/postpone`, async (req) => {
      try {
        const body = await readBody(req);
        const days = Math.max(1, Number(body?.days) || 1);
        const out = await mutate((db) => {
          const task = db.tasks.find((t) => t.id === body?.id);
          if (!task) throw new Error("\u5F85\u529E\u4E0D\u5B58\u5728");
          const today = todayStr();
          const base = task.dueAt && task.dueAt > today ? task.dueAt : today;
          task.postponedFrom = task.postponedFrom ?? task.dueAt;
          task.dueAt = addDaysStr(base, days);
          return task;
        });
        return { ok: true, task: out.result };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/task/delete`, async (req) => {
      try {
        const body = await readBody(req);
        await mutate((db) => {
          db.tasks = db.tasks.filter((t) => t.id !== body?.id);
        });
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/project/wake`, async (req) => {
      try {
        const body = await readBody(req);
        const out = await mutate((db) => {
          const prj = db.projects.find((p) => p.id === body?.id);
          if (!prj) throw new Error("\u9879\u76EE\u4E0D\u5B58\u5728");
          const title = `\u8DDF\u8FDB\u56DE\u8BBF\uFF08${prj.name}\uFF09`;
          const exists = db.tasks.some((t) => t.projectId === prj.id && !t.done && t.title === title);
          if (exists) return { created: false };
          db.tasks.push({
            id: uid("tsk"),
            projectId: prj.id,
            title,
            type: "\u56DE\u8BBF",
            dueAt: addDaysStr(todayStr(), 1),
            done: false,
            priority: "P0",
            createdAt: nowIso()
          });
          prj.updatedAt = nowIso();
          prj.logs = Array.isArray(prj.logs) ? prj.logs : [];
          prj.logs.push({ at: nowIso(), text: "\u6C89\u9ED8\u9879\u76EE\u5524\u9192\uFF1A\u751F\u6210\u8DDF\u8FDB\u5F85\u529E", stage: prj.stage });
          return { created: true };
        });
        return { ok: true, ...out.result };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/seed/demo`, async () => {
      try {
        await mutate((db) => {
          const seeded = seedDemo(db);
          db.customers = seeded.customers;
          db.projects = seeded.projects;
          db.tasks = seeded.tasks;
        });
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/seed/clear`, async () => {
      try {
        await mutate((db) => {
          const empty = clearAll(db);
          db.customers = empty.customers;
          db.projects = empty.projects;
          db.tasks = empty.tasks;
          db.renders = empty.renders;
        });
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    });
    router.get(`${PREFIX}/export`, async () => {
      try {
        const db = await loadDB();
        const config = await loadConfig();
        const payload = { kind: "designer-desk-backup", version: 1, exportedAt: nowIso(), db, config };
        const file = `${DESK_HOME}/backup-${nowIso().replace(/[:.]/g, "-")}.json`;
        const fs3 = await import("node:fs/promises");
        await fs3.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
        return { ok: true, file, payload };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/import`, async (req) => {
      try {
        const body = await readBody(req);
        let payload = body?.payload;
        if (!payload && typeof body?.text === "string") payload = JSON.parse(body.text);
        if (typeof payload === "string") payload = JSON.parse(payload);
        if (!payload || typeof payload !== "object") throw new Error("\u5BFC\u5165\u5185\u5BB9\u4E3A\u7A7A\u6216\u683C\u5F0F\u4E0D\u6B63\u786E");
        const incoming = payload.db ?? payload;
        if (!Array.isArray(incoming?.customers) && !Array.isArray(incoming?.projects)) {
          throw new Error("\u5BFC\u5165\u5185\u5BB9\u91CC\u6CA1\u6709 customers / projects\uFF0C\u53EF\u80FD\u4E0D\u662F\u672C\u63D2\u4EF6\u5BFC\u51FA\u7684\u5907\u4EFD");
        }
        await replaceDB(incoming);
        if (payload.config) await saveConfig(payload.config);
        invalidateComfyCache();
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    });
    router.get(`${PREFIX}/comfy/status`, async (req) => {
      try {
        const force = q(req, "force") === "1";
        return { ok: true, comfy: await comfyStatusCached(ctx, force), ratios: RATIOS, jobs: listJobs() };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/comfy/render`, async (req) => {
      try {
        const body = await readBody(req);
        const cfg = await loadConfig();
        const db = await loadDB();
        const prj = body?.projectId ? db.projects.find((p) => p.id === body.projectId) : void 0;
        const label = prj?.name || body?.projectLabel || "unassigned";
        const res = await submitRender(
          cfg,
          {
            projectId: body?.projectId,
            projectLabel: label,
            space: body?.space,
            style: body?.style,
            materials: body?.materials,
            light: body?.light,
            ratio: body?.ratio,
            count: body?.count,
            seed: body?.seed === "" || body?.seed === void 0 ? void 0 : Number(body.seed),
            promptOverride: body?.promptOverride
          },
          renderSink
        );
        return res;
      } catch (err) {
        return fail(err);
      }
    });
    router.get(`${PREFIX}/comfy/job`, async (req) => {
      const jobId = q(req, "jobId");
      if (!jobId) return { ok: false, error: "\u7F3A\u5C11 jobId" };
      const job = getJob(jobId);
      if (!job) return { ok: false, error: "\u4EFB\u52A1\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F" };
      return { ok: true, job };
    });
    router.get(`${PREFIX}/render/image`, async (req) => {
      try {
        const renderId = q(req, "renderId");
        const index = Number(q(req, "index") ?? 0) || 0;
        if (!renderId) return { ok: false, error: "\u7F3A\u5C11 renderId" };
        const db = await loadDB();
        const rec = db.renders.find((r) => r.id === renderId);
        if (!rec) return { ok: false, error: "\u8BB0\u5F55\u4E0D\u5B58\u5728" };
        const item = rec.items?.[index];
        if (!item) return { ok: false, error: "\u56FE\u7247\u4E0D\u5B58\u5728" };
        const cfg = await loadConfig();
        const { dataUrl, source } = await readRenderImage(cfg, item);
        return { ok: true, dataUrl, source, filename: item.filename };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/render/delete`, async (req) => {
      try {
        const body = await readBody(req);
        await mutate((db) => {
          db.renders = db.renders.filter((r) => r.id !== body?.id);
        });
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    });
    router.get(`${PREFIX}/today`, async () => {
      try {
        const db = await loadDB();
        const cfg = await loadConfig();
        const buckets = computeBuckets(db, cfg.silentDays);
        return {
          ok: true,
          date: todayStr(),
          overdue: buckets.overdue,
          today: buckets.today,
          soon: buckets.soon,
          noDate: buckets.noDate,
          silent: buckets.silent
        };
      } catch (err) {
        return fail(err);
      }
    });
    router.get(`${PREFIX}/tasks`, async () => {
      try {
        const db = await loadDB();
        return { ok: true, tasks: sortTasks(db.tasks.filter((t) => !t.done)) };
      } catch (err) {
        return fail(err);
      }
    });
    router.get(`${PREFIX}/render-dir`, async (req) => {
      const label = q(req, "projectLabel") || "unassigned";
      return { ok: true, dir: renderDirFor(label, ymd(/* @__PURE__ */ new Date())) };
    });
    router.post(`${PREFIX}/site/save`, async (req) => {
      try {
        const body = await readBody(req);
        const out = await mutate((db) => {
          const input = body?.site ?? {};
          const optional = (v) => v === "" || v === void 0 ? void 0 : v;
          const normalize = (s) => ({
            ...s,
            plannedAt: optional(s.plannedAt),
            doneAt: optional(s.doneAt),
            note: s.note ?? "",
            photos: Array.isArray(s.photos) ? s.photos : []
          });
          if (input?.id) {
            const idx = db.sites.findIndex((s) => s.id === input.id);
            if (idx >= 0) {
              db.sites[idx] = normalize({ ...db.sites[idx], ...input, updatedAt: nowIso() });
              return db.sites[idx];
            }
          }
          const created = normalize({
            id: uid("site"),
            projectId: String(input?.projectId ?? ""),
            node: input?.node ?? "\u6C34\u7535",
            status: input?.status ?? "\u5F85\u5DE1\u68C0",
            plannedAt: optional(input?.plannedAt),
            doneAt: optional(input?.doneAt),
            note: input?.note ?? "",
            photos: Array.isArray(input?.photos) ? input.photos : [],
            createdAt: nowIso(),
            updatedAt: nowIso()
          });
          db.sites.push(created);
          return created;
        });
        return { ok: true, site: out.result };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/site/delete`, async (req) => {
      try {
        const body = await readBody(req);
        await mutate((db) => {
          db.sites = db.sites.filter((s) => s.id !== body?.id);
        });
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/material/save`, async (req) => {
      try {
        const body = await readBody(req);
        const out = await mutate((db) => {
          const input = body?.material ?? {};
          const optional = (v) => v === "" || v === void 0 ? void 0 : v;
          const optionalNum = (v) => v === "" || v === void 0 ? void 0 : Number(v);
          const normalize = (m) => ({
            ...m,
            category: optional(m.category) ?? "",
            brand: optional(m.brand) ?? "",
            spec: optional(m.spec) ?? "",
            unit: optional(m.unit) ?? "",
            supplier: optional(m.supplier) ?? "",
            note: optional(m.note) ?? "",
            price: optionalNum(m.price),
            qty: optionalNum(m.qty),
            arriveAt: optional(m.arriveAt)
          });
          if (input?.id) {
            const idx = db.materials.findIndex((m) => m.id === input.id);
            if (idx >= 0) {
              db.materials[idx] = normalize({ ...db.materials[idx], ...input, updatedAt: nowIso() });
              return db.materials[idx];
            }
          }
          const created = normalize({
            id: uid("mat"),
            projectId: String(input?.projectId ?? ""),
            name: String(input?.name ?? "").trim() || "\u672A\u547D\u540D\u6750\u6599",
            category: input?.category ?? "",
            brand: input?.brand ?? "",
            spec: input?.spec ?? "",
            price: optionalNum(input?.price),
            qty: optionalNum(input?.qty),
            unit: input?.unit ?? "",
            supplier: input?.supplier ?? "",
            arriveAt: optional(input?.arriveAt),
            status: input?.status ?? "\u5F85\u4E0B\u5355",
            note: input?.note ?? "",
            createdAt: nowIso(),
            updatedAt: nowIso()
          });
          db.materials.push(created);
          return created;
        });
        return { ok: true, material: out.result };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/material/delete`, async (req) => {
      try {
        const body = await readBody(req);
        await mutate((db) => {
          db.materials = db.materials.filter((m) => m.id !== body?.id);
        });
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/refimage/save`, async (req) => {
      try {
        const body = await readBody(req);
        const out = await mutate((db) => {
          const input = body?.refimage ?? {};
          const optional = (v) => v === "" || v === void 0 ? void 0 : v;
          const parseTags = (v) => Array.isArray(v) ? v.map((t) => String(t).trim()).filter(Boolean) : String(v ?? "").split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean);
          const clampScore = (v) => {
            const n = v === "" || v === void 0 || v === null ? NaN : Number(v);
            if (Number.isNaN(n)) return 3;
            return Math.max(1, Math.min(5, Math.round(n)));
          };
          const normalize = (r) => ({
            ...r,
            title: r.title ?? "",
            url: optional(r.url),
            thumb: optional(r.thumb),
            source: r.source ?? "",
            tags: parseTags(r.tags),
            score: clampScore(r.score),
            projectId: optional(r.projectId)
          });
          if (input?.id) {
            const idx = db.refimages.findIndex((r) => r.id === input.id);
            if (idx >= 0) {
              db.refimages[idx] = normalize({ ...db.refimages[idx], ...input });
              return db.refimages[idx];
            }
          }
          const created = normalize({
            id: uid("ref"),
            title: input?.title ?? "",
            url: input?.url ?? "",
            thumb: input?.thumb ?? "",
            tags: input?.tags,
            score: input?.score,
            source: input?.source ?? "",
            projectId: input?.projectId,
            createdAt: nowIso()
          });
          db.refimages.push(created);
          return created;
        });
        return { ok: true, refimage: out.result };
      } catch (err) {
        return fail(err);
      }
    });
    router.post(`${PREFIX}/refimage/delete`, async (req) => {
      try {
        const body = await readBody(req);
        await mutate((db) => {
          db.refimages = db.refimages.filter((r) => r.id !== body?.id);
        });
        return { ok: true };
      } catch (err) {
        return fail(err);
      }
    });
  });
  return () => {
    try {
      if (typeof dispose === "function") dispose();
    } catch {
    }
  };
}

// src/commands.ts
function line(s = "") {
  return s;
}
function fmtTask(t, prefix) {
  const due = t.dueAt ?? "\u672A\u5B9A\u65E5\u671F";
  return `${prefix} ${t.title}  \xB7  ${due}${t.priority ? `  \xB7  ${t.priority}` : ""}`;
}
async function renderTodayText() {
  const db = await loadDB();
  const cfg = await loadConfig();
  const b = computeBuckets(db, cfg.silentDays);
  const d = todayStr();
  const out = [];
  out.push(`\u{1F4CB} \u8BBE\u8BA1\u53F0 \xB7 \u4ECA\u65E5\u5F85\u5904\u7406\uFF08${d}\uFF09`);
  out.push(line());
  out.push(`\u{1F534} \u903E\u671F ${b.overdue.length} \u9879`);
  for (const t of b.overdue.slice(0, 8)) out.push(fmtTask(t, "   \xB7"));
  if (!b.overdue.length) out.push("   \uFF08\u65E0\uFF09");
  out.push(line());
  out.push(`\u{1F7E0} \u4ECA\u5929 ${b.today.length} \u9879`);
  for (const t of b.today.slice(0, 8)) out.push(fmtTask(t, "   \xB7"));
  if (!b.today.length) out.push("   \uFF08\u65E0\uFF09");
  out.push(line());
  out.push(`\u{1F7E1} \u4E09\u5929\u5185 ${b.soon.length} \u9879`);
  for (const t of b.soon.slice(0, 6)) out.push(fmtTask(t, "   \xB7"));
  if (!b.soon.length) out.push("   \uFF08\u65E0\uFF09");
  if (b.noDate.length) {
    out.push(line());
    out.push(`\u26AA \u6302\u7740\u6CA1\u5B9A\u65E5\u671F ${b.noDate.length} \u9879`);
    for (const t of b.noDate.slice(0, 6)) out.push(fmtTask(t, "   \xB7"));
  }
  if (b.silent.length) {
    out.push(line());
    out.push(`\u{1F4A4} \u6C89\u9ED8\u9879\u76EE ${b.silent.length} \u4E2A\uFF08\u62A5\u4EF7 / \u65B9\u6848\u9636\u6BB5\u8D85\u8FC7 ${cfg.silentDays} \u5929\u6CA1\u52A8\u9759\uFF09`);
    for (const p of b.silent.slice(0, 6)) out.push(`   \xB7 ${p.name} \u2014 ${p.stageName}\uFF0C\u5BA2\u6237 ${p.customerName}`);
  }
  return out.join("\n");
}
function registerCommands(ctx) {
  if (typeof ctx.command !== "function") return () => {
  };
  ctx.command("designer-desk.hello <name>", "\u8BBE\u8BA1\u53F0\u5192\u70DF\u81EA\u68C0\uFF1A\u5411\u6307\u5B9A\u540D\u5B57\u6253\u62DB\u547C\uFF0C\u7528\u4E8E\u786E\u8BA4\u63D2\u4EF6\u94FE\u8DEF\u901A\u7545").alias("dd-hello").action(({ options }, name) => {
    const who = name || "\u8BBE\u8BA1\u5E08";
    ctx.logger?.info?.(`[designer-desk] hello called with ${who}`);
    return `\u4F60\u597D\uFF0C${who}\uFF01\u6211\u662F\u300C\u8BBE\u8BA1\u53F0\u300D\u63D2\u4EF6\u3002
\u6570\u636E\u76EE\u5F55\uFF1A${DESK_HOME}
\u5DE5\u4F5C\u533A\u9875\u9762 / \u8BBE\u7F6E\u9762\u677F / \u72B6\u6001\u680F\u5747\u5DF2\u5C31\u7EEA\u3002`;
  });
  ctx.command("designer-desk.today", "\u8F93\u51FA\u4ECA\u65E5\u5F85\u5904\u7406\u6458\u8981\uFF1A\u903E\u671F / \u4ECA\u5929 / \u4E09\u5929\u5185 / \u6C89\u9ED8\u9879\u76EE").alias("dd-today").action(async () => {
    try {
      return await renderTodayText();
    } catch (err) {
      return `\u8BFB\u53D6\u5931\u8D25\uFF1A${err?.message ?? err}`;
    }
  });
  ctx.command("designer-desk.add <customer> <room>", "\u5FEB\u901F\u5EFA\u6863\uFF1A\u5BA2\u6237\u540D + \u5C0F\u533A\u623F\u53F7\uFF0C\u81EA\u52A8\u751F\u6210\u300C\u9884\u7EA6\u91CF\u623F\u300D\u5F85\u529E").alias("dd-add").option("community", "-c  \u6307\u5B9A\u5C0F\u533A\u540D\uFF08\u623F\u53F7\u5DF2\u542B\u5C0F\u533A\u65F6\u53EF\u7701\u7565\uFF09").action(async ({ options }, customer, room) => {
    try {
      const out = await mutate((db) => {
        const now = nowIso();
        const community = String(options?.community ?? "").trim();
        const roomNo = String(room ?? "").trim();
        const cus = {
          id: uid("cus"),
          name: String(customer ?? "").trim() || "\u672A\u547D\u540D\u5BA2\u6237",
          community,
          roomNo,
          createdAt: now,
          updatedAt: now
        };
        db.customers.push(cus);
        const s1 = stageDef(1);
        const prj = {
          id: uid("prj"),
          customerId: cus.id,
          name: [community, roomNo].filter(Boolean).join("-") || `${cus.name} \u7684\u9879\u76EE`,
          stage: 1,
          nextAction: s1.next?.title,
          nextActionAt: s1.next ? addDaysStr(todayStr(), s1.next.inDays) : void 0,
          amount: 0,
          logs: [{ at: now, text: "\u5EFA\u6863\uFF08\u547D\u4EE4\u521B\u5EFA\uFF09", stage: 1 }],
          createdAt: now,
          updatedAt: now
        };
        db.projects.push(prj);
        db.tasks.push({
          id: uid("tsk"),
          projectId: prj.id,
          title: `${s1.next?.title}\uFF08${prj.name}\uFF09`,
          type: s1.next?.type ?? "\u5176\u4ED6",
          dueAt: prj.nextActionAt,
          done: false,
          priority: "P0",
          createdAt: now
        });
        return prj;
      });
      const p = out.result;
      return `\u2705 \u5DF2\u5EFA\u6863\uFF1A${p.name}
\u9636\u6BB5\uFF1A${stageDef(p.stage).name}
\u4E0B\u4E00\u6B65\uFF1A${p.nextAction}\uFF08${p.nextActionAt}\uFF09`;
    } catch (err) {
      return `\u5EFA\u6863\u5931\u8D25\uFF1A${err?.message ?? err}`;
    }
  });
  ctx.command("designer-desk.next <project>", "\u63A8\u8FDB\u9879\u76EE\u5230\u4E0B\u4E00\u9636\u6BB5\uFF0C\u5E76\u81EA\u52A8\u6392\u51FA\u4E0B\u4E00\u9636\u6BB5\u7684\u6807\u51C6\u5F85\u529E").alias("dd-next").option("note", "-n  \u672C\u6B21\u63A8\u8FDB\u7684\u5907\u6CE8\uFF08\u4F1A\u5199\u5165\u9879\u76EE\u6D41\u6C34\uFF09").action(async ({ options }, project) => {
    try {
      const keyword = String(project ?? "").trim();
      if (!keyword) return "\u8BF7\u63D0\u4F9B\u9879\u76EE\u540D\uFF08\u652F\u6301\u6A21\u7CCA\u5339\u914D\uFF09\uFF0C\u4F8B\u5982\uFF1Adesigner-desk.next \u91D1\u5730\u82B1\u56ED";
      const out = await mutate((db) => {
        const views = toProjectViews(db);
        const hit = views.find((v) => v.name === keyword) ?? views.find((v) => v.name.includes(keyword)) ?? views.find((v) => v.customerName.includes(keyword));
        if (!hit) throw new Error(`\u6CA1\u627E\u5230\u9879\u76EE\u300C${keyword}\u300D`);
        const prj = db.projects.find((p) => p.id === hit.id);
        const res = advanceProject(prj, options?.note);
        if (res.createdTask) db.tasks.push(res.createdTask);
        return res;
      });
      const r = out.result;
      const lines = [
        `\u2705 ${r.project.name}\uFF1A${r.finishedStage} \u2192 ${r.nextStageName}`
      ];
      if (r.createdTask) {
        lines.push(`\u{1F4CC} \u5DF2\u81EA\u52A8\u6392\u51FA\u4E0B\u4E00\u6B65\uFF1A${r.createdTask.title}\uFF08${r.createdTask.dueAt}\uFF09`);
      } else {
        lines.push("\u{1F3C1} \u5DF2\u7ED3\u9879\uFF0C\u9879\u76EE\u5F52\u6863\u3002");
      }
      return lines.join("\n");
    } catch (err) {
      return `\u63A8\u8FDB\u5931\u8D25\uFF1A${err?.message ?? err}`;
    }
  });
  ctx.command("designer-desk.render <project> <space> [style]", "\u8C03\u672C\u673A ComfyUI \u51FA\u6548\u679C\u56FE\uFF1A\u9879\u76EE\u540D + \u7A7A\u95F4 + \u98CE\u683C").alias("dd-render").option("materials", "-m  \u6750\u8D28\u5173\u952E\u8BCD\uFF0C\u5982\u300C\u80E1\u6843\u6728\u3001\u5FAE\u6C34\u6CE5\u3001\u4E9A\u9EBB\u300D").option("ratio", "-r  \u51FA\u56FE\u6BD4\u4F8B 16:9 / 4:3 / 1:1 / 9:16").option("count", "-n  \u5F20\u6570\uFF081-8\uFF09").action(async ({ options }, project, space, style) => {
    try {
      const db = await loadDB();
      const views = toProjectViews(db);
      const hit = views.find((v) => v.name === project) ?? views.find((v) => v.name.includes(project)) ?? views.find((v) => v.customerName.includes(project));
      if (!hit) return `\u6CA1\u627E\u5230\u9879\u76EE\u300C${project}\u300D\uFF0C\u53EF\u5148\u7528 designer-desk.today \u67E5\u770B\u9879\u76EE\u5217\u8868`;
      const cfg = await loadConfig();
      const st = await comfyStatus(cfg);
      if (!st.ok) return `\u26A0\uFE0F ${st.message}`;
      if (!st.workflowReady) {
        return "\u26A0\uFE0F \u8FD8\u6CA1\u914D\u7F6E\u5DE5\u4F5C\u6D41\uFF1A\u8BF7\u5728\u300C\u8BBE\u8BA1\u53F0 \u2192 \u8BBE\u7F6E\u300D\u91CC\u586B\u5199 API \u683C\u5F0F\u5DE5\u4F5C\u6D41\u8DEF\u5F84\u4E0E\u8282\u70B9\u6620\u5C04";
      }
      const res = await submitRender(
        cfg,
        {
          projectId: hit.id,
          projectLabel: hit.name,
          space,
          style: style || hit.style,
          materials: options?.materials,
          ratio: options?.ratio || "16:9",
          count: Number(options?.count) || 1
        },
        {
          async persist(patch) {
            await mutate((db2) => {
              const idx = db2.renders.findIndex((r) => r.id === patch.id);
              if (idx >= 0) db2.renders[idx] = { ...db2.renders[idx], ...patch };
              else db2.renders.unshift({ items: [], ...patch });
            });
          }
        }
      );
      if (!res.ok) return `\u274C \u63D0\u4EA4\u5931\u8D25\uFF1A${res.error}`;
      const lines = [
        `\u{1F3A8} \u5DF2\u63D0\u4EA4\u51FA\u56FE\uFF1A${hit.name}`,
        `\u63D0\u793A\u8BCD\uFF1A${res.prompt}`,
        `\u5C3A\u5BF8\uFF1A${res.width}\xD7${res.height}  \u79CD\u5B50\uFF1A${res.seed}`
      ];
      if (res.missing?.length) {
        lines.push(`\u26A0\uFE0F \u4EE5\u4E0B\u8282\u70B9\u6620\u5C04\u672A\u751F\u6548\uFF08\u4E0D\u5F71\u54CD\u51FA\u56FE\uFF09\uFF1A${res.missing.join("\u3001")}`);
      }
      lines.push(`\u4EFB\u52A1\u53F7\uFF1A${res.jobId} \u2014\u2014 \u5230\u300C\u8BBE\u8BA1\u53F0 \u2192 \u6548\u679C\u56FE\u300D\u67E5\u770B\u8FDB\u5EA6`);
      return lines.join("\n");
    } catch (err) {
      return `\u51FA\u56FE\u5931\u8D25\uFF1A${err?.message ?? err}`;
    }
  });
  ctx.command("designer-desk.backup", "\u5BFC\u51FA JSON \u5907\u4EFD\u5E76\u8FD4\u56DE\u6587\u4EF6\u8DEF\u5F84").alias("dd-backup").action(async () => {
    try {
      const fs3 = await import("node:fs/promises");
      const db = await loadDB();
      const cfg = await loadConfig();
      const file = `${DESK_HOME}/backup-${nowIso().replace(/[:.]/g, "-")}.json`;
      await fs3.writeFile(
        file,
        JSON.stringify({ kind: "designer-desk-backup", version: 1, exportedAt: nowIso(), db, config: cfg }, null, 2),
        "utf8"
      );
      return `\u2705 \u5DF2\u5BFC\u51FA\u5907\u4EFD\uFF1A
${file}

\u5BA2\u6237 ${db.customers.length} \u6761 / \u9879\u76EE ${db.projects.length} \u6761 / \u5F85\u529E ${db.tasks.length} \u6761`;
    } catch (err) {
      return `\u5907\u4EFD\u5931\u8D25\uFF1A${err?.message ?? err}`;
    }
  });
  ctx.command("designer-desk.sites", "\u5DE5\u5730\u5DE1\u68C0\u6982\u89C8\uFF1A\u5217\u51FA\u5728\u65BD\u9879\u76EE\u7684\u5404\u8282\u70B9\u5DE1\u68C0\u72B6\u6001").alias("dd-sites").action(async () => {
    try {
      const db = await loadDB();
      const building = db.projects.filter((p) => p.stage >= 7 && p.stage <= 8 && !p.archived);
      if (!building.length) return "\u5F53\u524D\u6CA1\u6709\u5728\u65BD\u5DE5 / \u9A8C\u6536\u9636\u6BB5\u7684\u9879\u76EE\u3002";
      const lines = ["\u{1F3D7}\uFE0F \u8BBE\u8BA1\u53F0 \xB7 \u5DE5\u5730\u5DE1\u68C0\u6982\u89C8"];
      for (const p of building) {
        const ins = db.sites.filter((s) => s.projectId === p.id);
        const pass = ins.filter((s) => s.status === "\u901A\u8FC7").length;
        const doing = ins.filter((s) => s.status === "\u8FDB\u884C\u4E2D").length;
        const todo = ins.filter((s) => s.status === "\u5F85\u5DE1\u68C0").length;
        const fix = ins.filter((s) => s.status === "\u9700\u6574\u6539").length;
        lines.push(`
\xB7 ${p.name}\uFF08${stageDef(p.stage).name}\uFF09`);
        lines.push(`  \u901A\u8FC7 ${pass} \xB7 \u8FDB\u884C\u4E2D ${doing} \xB7 \u5F85\u5DE1\u68C0 ${todo}${fix ? ` \xB7 \u9700\u6574\u6539 ${fix}` : ""}`);
        for (const s of ins) {
          const mark = s.status === "\u901A\u8FC7" ? "\u2713" : s.status === "\u9700\u6574\u6539" ? "!" : s.status === "\u8FDB\u884C\u4E2D" ? "~" : "\xB7";
          lines.push(`    ${mark} ${s.node} \u2014 ${s.status}${s.plannedAt ? `\uFF08${s.plannedAt}\uFF09` : ""}`);
        }
      }
      return lines.join("\n");
    } catch (err) {
      return `\u8BFB\u53D6\u5931\u8D25\uFF1A${err?.message ?? err}`;
    }
  });
  ctx.command("designer-desk.materials", "\u6750\u6599\u8FDB\u573A\u770B\u677F\uFF1A\u5217\u51FA\u5DF2\u4E0B\u5355 / \u5728\u9014 / \u5F85\u8FDB\u573A\u6750\u6599\uFF0C\u6309\u8FDB\u573A\u65E5\u6392\u5E8F").alias("dd-materials").action(async () => {
    try {
      const db = await loadDB();
      const list = db.materials.filter((m) => m.status !== "\u5DF2\u9A8C\u6536").sort((a, b) => (a.arriveAt || "9999").localeCompare(b.arriveAt || "9999"));
      if (!list.length) return "\u6CA1\u6709\u5F85\u8FDB\u573A / \u5728\u9014\u7684\u6750\u6599\u3002";
      const today = todayStr();
      const lines = ["\u{1F4E6} \u8BBE\u8BA1\u53F0 \xB7 \u6750\u6599\u8FDB\u573A\u770B\u677F"];
      for (const m of list) {
        const late = m.arriveAt && m.arriveAt < today ? " \u26A0\uFE0F\u903E\u671F" : "";
        const prj = db.projects.find((p) => p.id === m.projectId);
        lines.push(
          `\xB7 ${m.name}${m.brand ? `\uFF08${m.brand}\uFF09` : ""} \u2014 ${m.status}${m.arriveAt ? ` \u8FDB\u573A ${m.arriveAt}` : " \u672A\u6392\u671F"}${late}`
        );
        if (prj) lines.push(`  \u9879\u76EE\uFF1A${prj.name}`);
      }
      return lines.join("\n");
    } catch (err) {
      return `\u8BFB\u53D6\u5931\u8D25\uFF1A${err?.message ?? err}`;
    }
  });
  ctx.command("designer-desk.refs", "\u7075\u611F\u7D20\u6750\u5E93\u6982\u89C8\uFF1A\u6309\u8BC4\u5206\u5217\u51FA\u6536\u85CF\u7684\u53C2\u8003\u56FE").alias("dd-refs").option("tag", "-t  \u6309\u6807\u7B7E\u7B5B\u9009\uFF0C\u5982\u300C\u5976\u6CB9\u98CE\u300D").action(async ({ options }) => {
    try {
      const db = await loadDB();
      const tag = String(options?.tag ?? "").trim();
      let list = db.refimages;
      if (tag) list = list.filter((r) => (r.tags || []).some((t) => t.includes(tag)));
      list = list.slice().sort((a, b) => b.score - a.score);
      if (!list.length) return tag ? `\u6CA1\u6709\u6807\u7B7E\u542B\u300C${tag}\u300D\u7684\u53C2\u8003\u56FE\u3002` : "\u7075\u611F\u7D20\u6750\u5E93\u8FD8\u662F\u7A7A\u7684\u3002";
      const lines = [`\u{1F5BC}\uFE0F \u8BBE\u8BA1\u53F0 \xB7 \u7075\u611F\u7D20\u6750\u5E93${tag ? `\uFF08\u6807\u7B7E\uFF1A${tag}\uFF09` : ""}`];
      for (const r of list.slice(0, 20)) {
        const stars = "\u2605".repeat(r.score) + "\u2606".repeat(5 - r.score);
        lines.push(`\xB7 ${r.title || "\u672A\u547D\u540D"} ${stars}${(r.tags || []).join("/")}${r.source ? ` \xB7 ${r.source}` : ""}`);
      }
      return lines.join("\n");
    } catch (err) {
      return `\u8BFB\u53D6\u5931\u8D25\uFF1A${err?.message ?? err}`;
    }
  });
  return () => {
  };
}
function registerTools(ctx) {
  const tool = ctx.tool;
  if (!tool || typeof tool.register !== "function") return () => {
  };
  try {
    tool.register({
      name: "designer_desk_today",
      description: "\u8BFB\u53D6\u8BBE\u8BA1\u53F0\u4ECA\u65E5\u5F85\u5904\u7406\u6E05\u5355\uFF08\u903E\u671F / \u4ECA\u5929 / \u4E09\u5929\u5185 / \u6C89\u9ED8\u9879\u76EE\uFF09",
      params: {},
      run: async () => ({ ok: true, text: await renderTodayText() })
    });
    return () => {
    };
  } catch {
    return () => {
    };
  }
}

// src/schedule.ts
var EVENT_BRIEF = "designer-desk/brief";
var EVENT_OVERDUE = "designer-desk/overdue";
var brief = null;
function latestBrief() {
  return brief;
}
async function composeDailyBrief() {
  const db = await loadDB();
  const cfg = await loadConfig();
  const buckets = computeBuckets(db, cfg.silentDays);
  const text = await renderTodayText();
  const state = {
    date: todayStr(),
    at: nowIso(),
    text,
    overdueCount: buckets.overdue.length,
    todayCount: buckets.today.length
  };
  brief = state;
  return state;
}
function registerSchedule(ctx) {
  if (typeof ctx.setInterval !== "function") return () => {
  };
  let lastSummaryDate = "";
  let lastScanAt = 0;
  const tick = async () => {
    try {
      const cfg = await loadConfig();
      const today = todayStr();
      const nowHm = hm();
      if (cfg.summaryEnabled && nowHm === cfg.summaryAt && lastSummaryDate !== today) {
        lastSummaryDate = today;
        const state = await composeDailyBrief();
        ctx.logger?.info?.(
          `[designer-desk] \u6BCF\u65E5\u6458\u8981 ${today}\uFF1A\u903E\u671F ${state.overdueCount} \u9879 / \u4ECA\u5929 ${state.todayCount} \u9879`
        );
        emit(ctx, EVENT_BRIEF, state);
      }
      if (Date.now() - lastScanAt > 30 * 60 * 1e3) {
        lastScanAt = Date.now();
        const db = await loadDB();
        const buckets = computeBuckets(db, cfg.silentDays);
        if (buckets.overdue.length) {
          ctx.logger?.warn?.(
            `[designer-desk] \u6709 ${buckets.overdue.length} \u9879\u5F85\u529E\u5DF2\u903E\u671F\uFF1A` + buckets.overdue.slice(0, 3).map((t) => t.title).join(" / ")
          );
        }
        if (!brief) await composeDailyBrief();
        emit(ctx, EVENT_OVERDUE, {
          count: buckets.overdue.length,
          today: buckets.today.length
        });
      }
    } catch (err) {
      ctx.logger?.warn?.(`[designer-desk] \u5B9A\u65F6\u4EFB\u52A1\u5F02\u5E38\uFF1A${err?.message ?? err}`);
    }
  };
  const timer = ctx.setInterval(tick, 6e4);
  const first = typeof ctx.setTimeout === "function" ? ctx.setTimeout(() => {
    void tick();
    void composeDailyBrief().catch(() => void 0);
  }, 15e3) : null;
  return () => {
    try {
      clearInterval(timer);
    } catch {
    }
    if (first) {
      try {
        clearTimeout(first);
      } catch {
      }
    }
  };
}
function emit(ctx, name, payload) {
  try {
    ctx.emit?.(name, payload);
  } catch {
  }
}

// src/index.ts
var inject = ["webServer"];
function apply(ctx) {
  ctx.effect(() => {
    const disposers = [];
    const safe = (label, fn) => {
      try {
        const d = fn();
        if (typeof d === "function") disposers.push(d);
      } catch (err) {
        ctx.logger?.error?.(`[designer-desk] \u88C5\u914D\u300C${label}\u300D\u5931\u8D25\uFF1A${err?.message ?? err}`);
      }
    };
    void (async () => {
      try {
        await ensureDirs();
        const db = await loadDB();
        await loadConfig();
        ctx.logger?.info?.(
          `[designer-desk] \u5C31\u7EEA \xB7 \u6570\u636E\u76EE\u5F55 ${DESK_HOME} \xB7 \u5BA2\u6237 ${db.customers.length} / \u9879\u76EE ${db.projects.length} / \u5F85\u529E ${db.tasks.length}`
        );
      } catch (err) {
        ctx.logger?.error?.(
          `[designer-desk] \u542F\u52A8\u81EA\u68C0\u5931\u8D25\uFF1A${err?.message ?? err}\uFF08\u8BF7\u68C0\u67E5 ${DESK_HOME} \u662F\u5426\u53EF\u5199\uFF0C\u6216\u7528 DESIGNER_DESK_HOME \u6362\u76EE\u5F55\uFF09`
        );
      }
    })();
    safe("http-api", () => registerRoutes(ctx));
    safe("command-tool", () => registerCommands(ctx));
    safe("tool", () => registerTools(ctx));
    safe("event-task", () => registerSchedule(ctx));
    safe("service-provider", () => provideService(ctx));
    return () => {
      for (const dispose of disposers.reverse()) {
        try {
          dispose();
        } catch {
        }
      }
      invalidateComfyCache();
    };
  });
}
function provideService(ctx) {
  if (typeof ctx.provide !== "function") return () => {
  };
  const api = {
    version: "0.1.0",
    home: DESK_HOME,
    todayStr,
    async getState() {
      const db = await loadDB();
      const cfg = await loadConfig();
      const views = toProjectViews(db);
      return {
        projects: views,
        buckets: computeBuckets(db, cfg.silentDays),
        config: cfg,
        customers: db.customers,
        tasks: db.tasks,
        renders: db.renders
      };
    },
    async getTodayText() {
      return renderTodayText();
    },
    async getBrief() {
      return latestBrief() ?? await composeDailyBrief();
    },
    async getComfyStatus() {
      return comfyStatus(await loadConfig());
    },
    submitRender,
    async update(mutator) {
      const out = await mutate(mutator);
      return out.result;
    },
    async replaceDb(next) {
      return replaceDB(next);
    }
  };
  ctx.provide("designerDesk", api);
  return () => {
  };
}
export {
  RATIOS,
  STAGES,
  addDaysStr,
  advanceProject,
  apply,
  computeBuckets,
  diffDays,
  inject,
  stageDef,
  toProjectViews
};
