var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __knownSymbol = (name, symbol) => (symbol = Symbol[name]) ? symbol : Symbol.for("Symbol." + name);
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __decoratorStart = (base) => [, , , __create(base?.[__knownSymbol("metadata")] ?? null)];
var __decoratorStrings = ["class", "method", "getter", "setter", "accessor", "field", "value", "get", "set"];
var __expectFn = (fn) => fn !== void 0 && typeof fn !== "function" ? __typeError("Function expected") : fn;
var __decoratorContext = (kind, name, done, metadata, fns) => ({ kind: __decoratorStrings[kind], name, metadata, addInitializer: (fn) => done._ ? __typeError("Already initialized") : fns.push(__expectFn(fn || null)) });
var __decoratorMetadata = (array, target) => __defNormalProp(target, __knownSymbol("metadata"), array[3]);
var __runInitializers = (array, flags, self, value) => {
  for (var i = 0, fns = array[flags >> 1], n = fns && fns.length; i < n; i++) flags & 1 ? fns[i].call(self) : value = fns[i].call(self, value);
  return value;
};
var __decorateElement = (array, flags, name, decorators, target, extra) => {
  var fn, it, done, ctx, access, k = flags & 7, s = !!(flags & 8), p = !!(flags & 16);
  var j = k > 3 ? array.length + 1 : k ? s ? 1 : 2 : 0, key = __decoratorStrings[k + 5];
  var initializers = k > 3 && (array[j - 1] = []), extraInitializers = array[j] || (array[j] = []);
  var desc = k && (!p && !s && (target = target.prototype), k < 5 && (k > 3 || !p) && __getOwnPropDesc(k < 4 ? target : { get [name]() {
    return __privateGet(this, extra);
  }, set [name](x) {
    return __privateSet(this, extra, x);
  } }, name));
  k ? p && k < 4 && __name(extra, (k > 2 ? "set " : k > 1 ? "get " : "") + name) : __name(target, name);
  for (var i = decorators.length - 1; i >= 0; i--) {
    ctx = __decoratorContext(k, name, done = {}, array[3], extraInitializers);
    if (k) {
      ctx.static = s, ctx.private = p, access = ctx.access = { has: p ? (x) => __privateIn(target, x) : (x) => name in x };
      if (k ^ 3) access.get = p ? (x) => (k ^ 1 ? __privateGet : __privateMethod)(x, target, k ^ 4 ? extra : desc.get) : (x) => x[name];
      if (k > 2) access.set = p ? (x, y) => __privateSet(x, target, y, k ^ 4 ? extra : desc.set) : (x, y) => x[name] = y;
    }
    it = (0, decorators[i])(k ? k < 4 ? p ? extra : desc[key] : k > 4 ? void 0 : { get: desc.get, set: desc.set } : target, ctx), done._ = 1;
    if (k ^ 4 || it === void 0) __expectFn(it) && (k > 4 ? initializers.unshift(it) : k ? p ? extra = it : desc[key] = it : target = it);
    else if (typeof it !== "object" || it === null) __typeError("Object expected");
    else __expectFn(fn = it.get) && (desc.get = fn), __expectFn(fn = it.set) && (desc.set = fn), __expectFn(fn = it.init) && initializers.unshift(fn);
  }
  return k || __decoratorMetadata(array, target), desc && __defProp(target, name, desc), p ? k ^ 4 ? extra : desc : target;
};
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateIn = (member, obj) => Object(obj) !== obj ? __typeError('Cannot use the "in" operator on this value') : member.has(obj);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);

// src/api.ts
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";

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
  db.customers = customers;
  db.projects = projects;
  db.tasks = tasks;
  db.sites = sites;
  db.materials = materials;
  db.refimages = refimages;
  return db;
}
function clearAll(db) {
  const keepVersion = db.version;
  const empty = emptyDB();
  empty.version = keepVersion;
  for (const key of Object.keys(empty)) {
    if (key === "version") continue;
    db[key] = empty[key];
  }
  db.version = keepVersion;
  return db;
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

// src/api.ts
var REMOTE_NAMESPACE = "designerDesk";
var CONTROLLER_KEY = "designerDeskController";
function fail(err) {
  return { ok: false, error: String(err?.message ?? err) };
}
var comfyCache = null;
async function comfyStatusCached(ctx) {
  const ttl = 5e3;
  if (comfyCache && Date.now() - comfyCache.at < ttl) return comfyCache.value;
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
var optional = (v) => v === "" || v === void 0 ? void 0 : v;
var optionalNum = (v) => v === "" || v === void 0 ? void 0 : Number(v);
var clampScore = (v) => {
  const n = v === "" || v === void 0 || v === null ? NaN : Number(v);
  if (Number.isNaN(n)) return 3;
  return Math.max(1, Math.min(5, Math.round(n)));
};
var parseTags = (v) => Array.isArray(v) ? v.map((t) => String(t).trim()).filter(Boolean) : String(v ?? "").split(/[,，\s]+/).map((t) => t.trim()).filter(Boolean);
var _refimageDelete_dec, _refimageSave_dec, _materialDelete_dec, _materialSave_dec, _siteDelete_dec, _siteSave_dec, _renderDir_dec, _renderDelete_dec, _renderImage_dec, _renderJob_dec, _renderSubmit_dec, _comfyStatus_dec, _seedClear_dec, _seedDemoData_dec, _importData_dec, _exportData_dec, _openTasks_dec, _today_dec, _taskDelete_dec, _taskPostpone_dec, _taskToggle_dec, _taskSave_dec, _projectWake_dec, _projectDelete_dec, _projectAdvance_dec, _projectSave_dec, _setConfig_dec, _getConfig_dec, _stages_dec, _state_dec, _health_dec, _a, _init;
var DeskRemote = class extends (_a = TypertRemoteService, _health_dec = [Remote], _state_dec = [Remote], _stages_dec = [Remote], _getConfig_dec = [Remote], _setConfig_dec = [Remote], _projectSave_dec = [Remote], _projectAdvance_dec = [Remote], _projectDelete_dec = [Remote], _projectWake_dec = [Remote], _taskSave_dec = [Remote], _taskToggle_dec = [Remote], _taskPostpone_dec = [Remote], _taskDelete_dec = [Remote], _today_dec = [Remote], _openTasks_dec = [Remote], _exportData_dec = [Remote], _importData_dec = [Remote], _seedDemoData_dec = [Remote], _seedClear_dec = [Remote], _comfyStatus_dec = [Remote], _renderSubmit_dec = [Remote], _renderJob_dec = [Remote], _renderImage_dec = [Remote], _renderDelete_dec = [Remote], _renderDir_dec = [Remote], _siteSave_dec = [Remote], _siteDelete_dec = [Remote], _materialSave_dec = [Remote], _materialDelete_dec = [Remote], _refimageSave_dec = [Remote], _refimageDelete_dec = [Remote], _a) {
  constructor(ctx) {
    super(ctx, CONTROLLER_KEY, { namespace: REMOTE_NAMESPACE });
    __runInitializers(_init, 5, this);
  }
  svc() {
    return this.ctx?.designerDesk;
  }
  async health() {
    return {
      ok: true,
      plugin: "designer-desk",
      namespace: REMOTE_NAMESPACE,
      version: "0.1.0",
      home: DESK_HOME,
      uptimeSec: Math.round(process.uptime())
    };
  }
  async state() {
    try {
      const s = await buildState(this.ctx);
      return { ...s, jobs: listJobs() };
    } catch (err) {
      return fail(err);
    }
  }
  async stages() {
    return { ok: true, stages: STAGES, ratios: RATIOS };
  }
  async getConfig() {
    try {
      return { ok: true, config: await loadConfig() };
    } catch (err) {
      return fail(err);
    }
  }
  async setConfig(patch) {
    try {
      const config = await saveConfig(patch ?? {});
      invalidateComfyCache();
      return { ok: true, config };
    } catch (err) {
      return fail(err);
    }
  }
  async projectSave(payload) {
    try {
      const body = payload ?? {};
      const out = await mutate((db) => {
        const input = body.project ?? {};
        let customer;
        if (body.customer && Object.keys(body.customer).length) {
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
        const c = customer ?? upsertCustomer(db, body.customer ?? {});
        const { project, task } = createProject(db, input, c);
        return { project, createdTask: task };
      });
      return { ok: true, ...out.result };
    } catch (err) {
      return fail(err);
    }
  }
  async projectAdvance(payload) {
    try {
      const out = await mutate((db) => {
        const prj = db.projects.find((p) => p.id === payload?.id);
        if (!prj) throw new Error("\u9879\u76EE\u4E0D\u5B58\u5728");
        const res = advanceProject(prj, payload?.note);
        if (res.createdTask) db.tasks.push(res.createdTask);
        return res;
      });
      return { ok: true, ...out.result };
    } catch (err) {
      return fail(err);
    }
  }
  async projectDelete(payload) {
    try {
      await mutate((db) => {
        db.projects = db.projects.filter((p) => p.id !== payload?.id);
        db.tasks = db.tasks.filter((t) => t.projectId !== payload?.id);
      });
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }
  async projectWake(payload) {
    try {
      const out = await mutate((db) => {
        const prj = db.projects.find((p) => p.id === payload?.id);
        if (!prj) throw new Error("\u9879\u76EE\u4E0D\u5B58\u5728");
        const title = `\u8DDF\u8FDB\u56DE\u8BBF\uFF08${prj.name}\uFF09`;
        const exists = db.tasks.some((t) => t.projectId === prj.id && !t.done && t.title === title);
        if (exists) return { created: false };
        db.tasks.push({
          id: uid("tsk"),
          projectId: prj.id,
          title,
          type: "\u56DE\u8BBF",
          dueAt: todayStr(),
          done: false,
          priority: "P0",
          createdAt: nowIso()
        });
        prj.updatedAt = nowIso();
        return { created: true };
      });
      return { ok: true, ...out.result };
    } catch (err) {
      return fail(err);
    }
  }
  async taskSave(payload) {
    try {
      const input = payload?.task ?? {};
      const out = await mutate((db) => {
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
  }
  async taskToggle(payload) {
    try {
      const out = await mutate((db) => {
        const task = db.tasks.find((t) => t.id === payload?.id);
        if (!task) throw new Error("\u5F85\u529E\u4E0D\u5B58\u5728");
        const wantDone = payload?.done === void 0 ? !task.done : Boolean(payload.done);
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
  }
  async taskPostpone(payload) {
    try {
      const days = Math.max(1, Number(payload?.days) || 1);
      const out = await mutate((db) => {
        const task = db.tasks.find((t) => t.id === payload?.id);
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
  }
  async taskDelete(payload) {
    try {
      await mutate((db) => {
        db.tasks = db.tasks.filter((t) => t.id !== payload?.id);
      });
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }
  async today() {
    try {
      const db = await loadDB();
      const cfg = await loadConfig();
      const views = toProjectViews(db);
      const buckets = computeBuckets(db, cfg.silentDays);
      return {
        ok: true,
        now: todayStr(),
        overdue: sortTasks(buckets.overdue),
        todayTasks: sortTasks(buckets.today),
        soon: sortTasks(buckets.soon),
        silent: buckets.silent,
        projects: views
      };
    } catch (err) {
      return fail(err);
    }
  }
  async openTasks() {
    try {
      const db = await loadDB();
      return { ok: true, tasks: sortTasks(db.tasks.filter((t) => !t.done)) };
    } catch (err) {
      return fail(err);
    }
  }
  async exportData() {
    try {
      const { db, config } = await (async () => {
        const d = await loadDB();
        const c = await loadConfig();
        return { db: d, config: c };
      })();
      const stamp = nowIso().replace(/[:.]/g, "-").slice(0, 19);
      return {
        ok: true,
        file: `${DESK_HOME}/backup-${stamp}.json`,
        payload: {
          kind: "designer-desk-backup",
          exportedAt: nowIso(),
          db,
          config
        }
      };
    } catch (err) {
      return fail(err);
    }
  }
  async importData(payload) {
    try {
      const next = payload?.db ?? payload?.payload?.db ?? payload;
      if (!next || typeof next !== "object") throw new Error("\u5907\u4EFD\u5185\u5BB9\u683C\u5F0F\u4E0D\u5BF9");
      await replaceDB(next);
      if (payload?.payload?.config) await saveConfig(payload.payload.config);
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }
  async seedDemoData() {
    try {
      await mutate((db) => {
        seedDemo(db);
      });
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }
  async seedClear() {
    try {
      await mutate((db) => {
        clearAll(db);
      });
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }
  async comfyStatus() {
    return await comfyStatusCached(this.ctx);
  }
  async renderSubmit(payload) {
    try {
      const cfg = await loadConfig();
      const db = await loadDB();
      const prj = payload?.projectId ? db.projects.find((p) => p.id === payload.projectId) : void 0;
      const label = prj?.name || payload?.projectLabel || "unassigned";
      return await submitRender(
        cfg,
        {
          projectId: payload?.projectId,
          projectLabel: label,
          space: payload?.space,
          style: payload?.style,
          materials: payload?.materials,
          light: payload?.light,
          ratio: payload?.ratio,
          count: payload?.count,
          seed: payload?.seed === "" || payload?.seed === void 0 ? void 0 : Number(payload.seed),
          promptOverride: payload?.promptOverride
        },
        renderSink
      );
    } catch (err) {
      return fail(err);
    }
  }
  async renderJob(payload) {
    try {
      if (!payload?.jobId) return { ok: false, error: "\u7F3A\u5C11 jobId" };
      const job = getJob(payload.jobId);
      if (!job) return { ok: false, error: "\u4EFB\u52A1\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F" };
      return { ok: true, job };
    } catch (err) {
      return fail(err);
    }
  }
  async renderImage(payload) {
    try {
      if (!payload?.renderId) return { ok: false, error: "\u7F3A\u5C11 renderId" };
      const index = Number(payload?.index ?? 0) || 0;
      const db = await loadDB();
      const rec = db.renders.find((r) => r.id === payload.renderId);
      if (!rec) return { ok: false, error: "\u8BB0\u5F55\u4E0D\u5B58\u5728" };
      const item = rec.items?.[index];
      if (!item) return { ok: false, error: "\u56FE\u7247\u4E0D\u5B58\u5728" };
      const cfg = await loadConfig();
      const { dataUrl, source } = await readRenderImage(cfg, item);
      return { ok: true, dataUrl, source, filename: item.filename };
    } catch (err) {
      return fail(err);
    }
  }
  async renderDelete(payload) {
    try {
      await mutate((db) => {
        db.renders = db.renders.filter((r) => r.id !== payload?.id);
      });
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }
  async renderDir(payload) {
    try {
      return { ok: true, dir: renderDirFor(payload?.projectLabel || "unassigned", ymd(/* @__PURE__ */ new Date())) };
    } catch (err) {
      return fail(err);
    }
  }
  async siteSave(payload) {
    try {
      const input = payload?.site ?? {};
      const out = await mutate((db) => {
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
  }
  async siteDelete(payload) {
    try {
      await mutate((db) => {
        db.sites = db.sites.filter((s) => s.id !== payload?.id);
      });
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }
  async materialSave(payload) {
    try {
      const input = payload?.material ?? {};
      const out = await mutate((db) => {
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
  }
  async materialDelete(payload) {
    try {
      await mutate((db) => {
        db.materials = db.materials.filter((m) => m.id !== payload?.id);
      });
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }
  async refimageSave(payload) {
    try {
      const input = payload?.refimage ?? {};
      const out = await mutate((db) => {
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
  }
  async refimageDelete(payload) {
    try {
      await mutate((db) => {
        db.refimages = db.refimages.filter((r) => r.id !== payload?.id);
      });
      return { ok: true };
    } catch (err) {
      return fail(err);
    }
  }
};
_init = __decoratorStart(_a);
__decorateElement(_init, 1, "health", _health_dec, DeskRemote);
__decorateElement(_init, 1, "state", _state_dec, DeskRemote);
__decorateElement(_init, 1, "stages", _stages_dec, DeskRemote);
__decorateElement(_init, 1, "getConfig", _getConfig_dec, DeskRemote);
__decorateElement(_init, 1, "setConfig", _setConfig_dec, DeskRemote);
__decorateElement(_init, 1, "projectSave", _projectSave_dec, DeskRemote);
__decorateElement(_init, 1, "projectAdvance", _projectAdvance_dec, DeskRemote);
__decorateElement(_init, 1, "projectDelete", _projectDelete_dec, DeskRemote);
__decorateElement(_init, 1, "projectWake", _projectWake_dec, DeskRemote);
__decorateElement(_init, 1, "taskSave", _taskSave_dec, DeskRemote);
__decorateElement(_init, 1, "taskToggle", _taskToggle_dec, DeskRemote);
__decorateElement(_init, 1, "taskPostpone", _taskPostpone_dec, DeskRemote);
__decorateElement(_init, 1, "taskDelete", _taskDelete_dec, DeskRemote);
__decorateElement(_init, 1, "today", _today_dec, DeskRemote);
__decorateElement(_init, 1, "openTasks", _openTasks_dec, DeskRemote);
__decorateElement(_init, 1, "exportData", _exportData_dec, DeskRemote);
__decorateElement(_init, 1, "importData", _importData_dec, DeskRemote);
__decorateElement(_init, 1, "seedDemoData", _seedDemoData_dec, DeskRemote);
__decorateElement(_init, 1, "seedClear", _seedClear_dec, DeskRemote);
__decorateElement(_init, 1, "comfyStatus", _comfyStatus_dec, DeskRemote);
__decorateElement(_init, 1, "renderSubmit", _renderSubmit_dec, DeskRemote);
__decorateElement(_init, 1, "renderJob", _renderJob_dec, DeskRemote);
__decorateElement(_init, 1, "renderImage", _renderImage_dec, DeskRemote);
__decorateElement(_init, 1, "renderDelete", _renderDelete_dec, DeskRemote);
__decorateElement(_init, 1, "renderDir", _renderDir_dec, DeskRemote);
__decorateElement(_init, 1, "siteSave", _siteSave_dec, DeskRemote);
__decorateElement(_init, 1, "siteDelete", _siteDelete_dec, DeskRemote);
__decorateElement(_init, 1, "materialSave", _materialSave_dec, DeskRemote);
__decorateElement(_init, 1, "materialDelete", _materialDelete_dec, DeskRemote);
__decorateElement(_init, 1, "refimageSave", _refimageSave_dec, DeskRemote);
__decorateElement(_init, 1, "refimageDelete", _refimageDelete_dec, DeskRemote);
__decoratorMetadata(_init, DeskRemote);
/**
 * 依赖业务插件提供的 `designerDesk` 服务。
 *
 * ⚠️ 必须静态声明：cordis 的 context 是注入容器，读没在 inject 里声明的服务会抛
 * `cannot get property "…" without inject`。控制器是独立 Loader entry，
 * 服务由另一条 entry（业务插件）提供，所以在这里等 —— 这是**正确**的激活闸门。
 *
 * 不得声明 `remote.*`：宿主侧不存在该服务，在客户端侧声明会自锁。
 */
__publicField(DeskRemote, "inject", ["designerDesk"]);
var api_default = DeskRemote;
export {
  CONTROLLER_KEY,
  DeskRemote,
  REMOTE_NAMESPACE,
  api_default as default,
  invalidateComfyCache,
  renderSink
};
