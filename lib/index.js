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

// ../../../.nvm/versions/node/v24.21.0/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/cosmokit/lib/index.js
function isNullable(value) {
  return value === null || value === void 0;
}
function defineProperty(object, key, value) {
  return Object.defineProperty(object, key, {
    writable: true,
    value,
    enumerable: false
  });
}
var write = Symbol.for("cosmokit.volatile.write");
function is(type, value) {
  if (arguments.length === 1) return (value2) => is(type, value2);
  return type in globalThis && value instanceof globalThis[type] || Object.prototype.toString.call(value).slice(8, -1) === type;
}
function isArrayBufferLike(value) {
  return is("ArrayBuffer", value) || is("SharedArrayBuffer", value);
}
function isArrayBufferSource(value) {
  return isArrayBufferLike(value) || ArrayBuffer.isView(value);
}
var Binary;
(function(Binary2) {
  Binary2.is = isArrayBufferLike;
  Binary2.isSource = isArrayBufferSource;
  function fromSource(source) {
    if (ArrayBuffer.isView(source)) return source.buffer.slice(source.byteOffset, source.byteOffset + source.byteLength);
    else return source;
  }
  Binary2.fromSource = fromSource;
  function toBase64(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("base64");
    let binary = "";
    const bytes = new Uint8Array(source);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }
  Binary2.toBase64 = toBase64;
  function fromBase64(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "base64"));
    return Uint8Array.from(atob(source), (c) => c.charCodeAt(0));
  }
  Binary2.fromBase64 = fromBase64;
  function toHex(source) {
    source = fromSource(source);
    if (typeof Buffer !== "undefined") return Buffer.from(source).toString("hex");
    return Array.from(new Uint8Array(source), (byte) => byte.toString(16).padStart(2, "0")).join("");
  }
  Binary2.toHex = toHex;
  function fromHex(source) {
    if (typeof Buffer !== "undefined") return fromSource(Buffer.from(source, "hex"));
    const hex = source.length % 2 === 0 ? source : source.slice(0, source.length - 1);
    const buffer = [];
    for (let i = 0; i < hex.length; i += 2) buffer.push(parseInt(`${hex[i]}${hex[i + 1]}`, 16));
    return Uint8Array.from(buffer).buffer;
  }
  Binary2.fromHex = fromHex;
})(Binary || (Binary = {}));
var base64ToArrayBuffer = Binary.fromBase64;
var arrayBufferToBase64 = Binary.toBase64;
var hexToArrayBuffer = Binary.fromHex;
var arrayBufferToHex = Binary.toHex;
function tokenize(source, delimiters, delimiter) {
  const output = [];
  let state = 0;
  for (let i = 0; i < source.length; i++) {
    const code = source.charCodeAt(i);
    if (code >= 65 && code <= 90) {
      if (state === 1) {
        const next = source.charCodeAt(i + 1);
        if (next >= 97 && next <= 122) output.push(delimiter);
        output.push(code + 32);
      } else {
        if (state !== 0) output.push(delimiter);
        output.push(code + 32);
      }
      state = 1;
    } else if (code >= 97 && code <= 122) {
      output.push(code);
      state = 2;
    } else if (delimiters.includes(code)) {
      if (state !== 0) output.push(delimiter);
      state = 0;
    } else output.push(code);
  }
  return String.fromCharCode(...output);
}
function paramCase(source) {
  return tokenize(source, [45, 95], 45);
}
var hyphenate = paramCase;
var Time;
(function(Time2) {
  Time2.millisecond = 1;
  Time2.second = 1e3;
  Time2.minute = Time2.second * 60;
  Time2.hour = Time2.minute * 60;
  Time2.day = Time2.hour * 24;
  Time2.week = Time2.day * 7;
  let timezoneOffset = (/* @__PURE__ */ new Date()).getTimezoneOffset();
  function setTimezoneOffset(offset) {
    timezoneOffset = offset;
  }
  Time2.setTimezoneOffset = setTimezoneOffset;
  function getTimezoneOffset() {
    return timezoneOffset;
  }
  Time2.getTimezoneOffset = getTimezoneOffset;
  function getDateNumber(date = /* @__PURE__ */ new Date(), offset) {
    if (typeof date === "number") date = new Date(date);
    if (offset === void 0) offset = timezoneOffset;
    return Math.floor((date.valueOf() / Time2.minute - offset) / 1440);
  }
  Time2.getDateNumber = getDateNumber;
  function fromDateNumber(value, offset) {
    const date = new Date(value * Time2.day);
    if (offset === void 0) offset = timezoneOffset;
    return new Date(+date + offset * Time2.minute);
  }
  Time2.fromDateNumber = fromDateNumber;
  const numeric = /\d+(?:\.\d+)?/.source;
  const timeRegExp = new RegExp(`^${[
    "w(?:eek(?:s)?)?",
    "d(?:ay(?:s)?)?",
    "h(?:our(?:s)?)?",
    "m(?:in(?:ute)?(?:s)?)?",
    "s(?:ec(?:ond)?(?:s)?)?"
  ].map((unit) => `(${numeric}${unit})?`).join("")}$`);
  function parseTime(source) {
    const capture = timeRegExp.exec(source);
    if (!capture) return 0;
    return (parseFloat(capture[1]) * Time2.week || 0) + (parseFloat(capture[2]) * Time2.day || 0) + (parseFloat(capture[3]) * Time2.hour || 0) + (parseFloat(capture[4]) * Time2.minute || 0) + (parseFloat(capture[5]) * Time2.second || 0);
  }
  Time2.parseTime = parseTime;
  function parseDate(date) {
    const parsed = parseTime(date);
    if (parsed) date = Date.now() + parsed;
    else if (/^\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).toLocaleDateString()}-${date}`;
    else if (/^\d{1,2}-\d{1,2}-\d{1,2}(:\d{1,2}){1,2}$/.test(date)) date = `${(/* @__PURE__ */ new Date()).getFullYear()}-${date}`;
    return date ? new Date(date) : /* @__PURE__ */ new Date();
  }
  Time2.parseDate = parseDate;
  function format(ms) {
    const abs = Math.abs(ms);
    if (abs >= Time2.day - Time2.hour / 2) return Math.round(ms / Time2.day) + "d";
    else if (abs >= Time2.hour - Time2.minute / 2) return Math.round(ms / Time2.hour) + "h";
    else if (abs >= Time2.minute - Time2.second / 2) return Math.round(ms / Time2.minute) + "m";
    else if (abs >= Time2.second) return Math.round(ms / Time2.second) + "s";
    return ms + "ms";
  }
  Time2.format = format;
  function toDigits(source, length = 2) {
    return source.toString().padStart(length, "0");
  }
  Time2.toDigits = toDigits;
  function template(template2, time = /* @__PURE__ */ new Date()) {
    return template2.replace("yyyy", time.getFullYear().toString()).replace("yy", time.getFullYear().toString().slice(2)).replace("MM", toDigits(time.getMonth() + 1)).replace("dd", toDigits(time.getDate())).replace("hh", toDigits(time.getHours())).replace("mm", toDigits(time.getMinutes())).replace("ss", toDigits(time.getSeconds())).replace("SSS", toDigits(time.getMilliseconds(), 3));
  }
  Time2.template = template;
})(Time || (Time = {}));

// ../../../.nvm/versions/node/v24.21.0/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/cordis/lib/index.js
var DisposableList = class {
  sn = 0;
  map = /* @__PURE__ */ new Map();
  weak = /* @__PURE__ */ new WeakMap();
  get length() {
    return this.map.size;
  }
  push(value) {
    const sn = ++this.sn;
    this.map.set(sn, value);
    this.weak.set(value, sn);
    return () => this.map.delete(sn);
  }
  delete(value) {
    const sn = this.weak.get(value);
    if (!sn) return false;
    return this.map.delete(sn);
  }
  clear() {
    const values = [...this.map.values()];
    this.map.clear();
    return values.reverse();
  }
  [Symbol.iterator]() {
    return this.map.values();
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return [...this];
  }
};
var symbols = {
  shadow: Symbol.for("cordis.shadow"),
  receiver: Symbol.for("cordis.receiver"),
  original: Symbol.for("cordis.original"),
  metadata: Symbol.for("cordis.metadata"),
  initHooks: Symbol.for("cordis.initHooks"),
  checkProto: Symbol.for("cordis.checkProto"),
  effect: Symbol.for("cordis.effect"),
  filter: Symbol.for("cordis.filter"),
  isolate: Symbol.for("cordis.isolate"),
  intercept: Symbol.for("cordis.intercept"),
  init: Symbol.for("cordis.init"),
  check: Symbol.for("cordis.check"),
  config: Symbol.for("cordis.config"),
  invoke: Symbol.for("cordis.invoke"),
  extend: Symbol.for("cordis.extend"),
  tracker: Symbol.for("cordis.tracker"),
  resolveConfig: Symbol.for("cordis.resolveConfig")
};
var GeneratorFunction = function* () {
}.constructor;
var AsyncGeneratorFunction = async function* () {
}.constructor;
function isConstructor(func) {
  if (!func.prototype) return false;
  if (func instanceof GeneratorFunction) return false;
  if (AsyncGeneratorFunction !== Function && func instanceof AsyncGeneratorFunction) return false;
  return true;
}
function joinPrototype(proto1, proto2) {
  if (proto1 === Object.prototype) return proto2;
  const result = Object.create(joinPrototype(Object.getPrototypeOf(proto1), proto2));
  for (const key of Reflect.ownKeys(proto1)) Object.defineProperty(result, key, Object.getOwnPropertyDescriptor(proto1, key));
  return result;
}
function isObject(value) {
  return value && (typeof value === "object" || typeof value === "function");
}
function getPropertyDescriptor(target, prop) {
  let proto = target;
  while (proto) {
    const desc = Reflect.getOwnPropertyDescriptor(proto, prop);
    if (desc) return desc;
    proto = Object.getPrototypeOf(proto);
  }
}
function getTraceable(ctx, value) {
  if (!isObject(value)) return value;
  if (Object.hasOwn(value, symbols.shadow)) return Object.getPrototypeOf(value);
  const tracker = value[symbols.tracker];
  if (!tracker) return value;
  return createTraceable(ctx, value, tracker);
}
function withProps(target, props) {
  if (!props) return target;
  return new Proxy(target, {
    get: (target2, prop, receiver) => {
      if (prop in props && prop !== "constructor") return Reflect.get(props, prop, receiver);
      return Reflect.get(target2, prop, receiver);
    },
    set: (target2, prop, value, receiver) => {
      if (prop in props && prop !== "constructor") return Reflect.set(props, prop, value, receiver);
      return Reflect.set(target2, prop, value, receiver);
    }
  });
}
function withProp(target, prop, value) {
  return withProps(target, Object.defineProperty(/* @__PURE__ */ Object.create(null), prop, {
    value,
    writable: false
  }));
}
function createShadow(ctx, target, property, receiver) {
  if (!property) return receiver;
  const origin = Reflect.getOwnPropertyDescriptor(target, property)?.value;
  if (!origin) return receiver;
  return withProp(receiver, property, ctx.extend({ [symbols.shadow]: origin }));
}
function createShadowMethod(ctx, value, outer, shadow) {
  return new Proxy(value, { apply: (target, thisArg, args) => {
    if (thisArg === outer) thisArg = shadow;
    return getTraceable(ctx, Reflect.apply(target, thisArg, args));
  } });
}
function createTraceable(ctx, value, tracker) {
  if (ctx[symbols.shadow] && !tracker.noShadow) ctx = Object.getPrototypeOf(ctx);
  const proxy = new Proxy(value, {
    get: (target, prop, receiver) => {
      if (prop === symbols.original) return target;
      if (prop === tracker.property) return ctx;
      if (typeof prop === "symbol") return Reflect.get(target, prop, receiver);
      if (tracker.associate && ctx.reflect.props[`${tracker.associate}.${prop}`]) return Reflect.get(ctx, `${tracker.associate}.${prop}`, withProp(ctx, symbols.receiver, receiver));
      let shadow, innerValue;
      const desc = getPropertyDescriptor(target, prop);
      if (desc && "value" in desc) innerValue = desc.value;
      else {
        shadow = createShadow(ctx, target, tracker.property, receiver);
        innerValue = Reflect.get(target, prop, shadow);
      }
      const innerTracker = innerValue?.[symbols.tracker];
      if (innerTracker) return createTraceable(ctx, innerValue, innerTracker);
      else if (!tracker.noShadow && typeof innerValue === "function") {
        shadow ??= createShadow(ctx, target, tracker.property, receiver);
        return createShadowMethod(ctx, innerValue, receiver, shadow);
      } else return innerValue;
    },
    set: (target, prop, value2, receiver) => {
      if (prop === symbols.original) return false;
      if (prop === tracker.property) return false;
      if (typeof prop === "symbol") return Reflect.set(target, prop, value2, receiver);
      if (tracker.associate && ctx.reflect.props[`${tracker.associate}.${prop}`]) return Reflect.set(ctx, `${tracker.associate}.${prop}`, value2, withProp(ctx, symbols.receiver, receiver));
      const shadow = createShadow(ctx, target, tracker.property, receiver);
      return Reflect.set(target, prop, value2, shadow);
    },
    apply: (target, thisArg, args) => {
      return applyTraceable(proxy, target, thisArg, args);
    }
  });
  return proxy;
}
function applyTraceable(proxy, value, thisArg, args) {
  if (!value[symbols.invoke]) return Reflect.apply(value, thisArg, args);
  return value[symbols.invoke].apply(proxy, args);
}
function createCallable(name, proto, tracker) {
  const self = function(...args) {
    return applyTraceable(createTraceable(self["ctx"], self, tracker), self, this, args);
  };
  defineProperty(self, "name", name);
  return Object.setPrototypeOf(self, proto);
}
function handleError(info, reason, getOuterStack) {
  const innerLines = info.error.stack.split("\n");
  if (typeof reason?.stack !== "string") {
    const outerError = new Error(reason);
    const lines2 = outerError.stack.split("\n");
    lines2.splice(1, Infinity, ...getOuterStack());
    outerError.stack = lines2.join("\n");
    throw outerError;
  }
  const lines = reason.stack.split("\n");
  let index = lines.indexOf(innerLines[2]);
  if (index === -1) throw reason;
  index -= info.offset;
  while (index > 0) {
    if (!lines[index - 1].endsWith(" (<anonymous>)")) break;
    index -= 1;
  }
  lines.splice(index, Infinity, ...getOuterStack());
  reason.stack = lines.join("\n");
  throw reason;
}
function composeError(callback, getOuterStack = buildOuterStack()) {
  const info = {
    offset: 1,
    error: /* @__PURE__ */ new Error()
  };
  try {
    const result = callback(info);
    if (isObject(result) && "then" in result) return result.then(void 0, (reason) => handleError(info, reason, getOuterStack));
    else return result;
  } catch (reason) {
    handleError(info, reason, getOuterStack);
  }
}
function buildOuterStack(offset = 0) {
  const outerError = /* @__PURE__ */ new Error();
  return () => outerError.stack.split("\n").slice(3 + offset);
}
function isBailed(value) {
  return value !== null && value !== false && value !== void 0;
}
var EventsService = class {
  ctx;
  _hooks = {};
  constructor(ctx) {
    this.ctx = ctx;
    defineProperty(this, symbols.tracker, {
      property: "ctx",
      noShadow: true
    });
    this.on("internal/listener", function(name, listener, options) {
      if (name === "internal/update" && !options.global) return (this.fiber._hooks["internal/update"] ??= new DisposableList())[options.prepend ? "unshift" : "push"](listener);
    });
    this.on("internal/update", function(config, noSave, next) {
      const cbs = [...this._hooks["internal/update"] || []];
      const _next = () => {
        return (cbs.shift() ?? next).call(this, config, noSave, _next);
      };
      return _next();
    }, {
      global: true,
      prepend: true
    });
  }
  /**
  * Resolve listeners for one dispatch and apply context filtering.
  *
  * @param type — the dispatch mode, reported on `internal/dispatch`.
  * @param args — the raw dispatch arguments; consumed up to the event name.
  * @returns the matching listener callbacks, bound to the dispatch `this`.
  */
  dispatch(type, args) {
    const thisArg = typeof args[0] === "object" || typeof args[0] === "function" ? args.shift() : null;
    const name = args.shift();
    if (!name.startsWith("internal/")) this.emit("internal/dispatch", type, name, args, thisArg);
    const filter = thisArg?.[Context.filter];
    return (this._hooks[name] || []).filter((hook) => hook.global || !filter || filter.call(thisArg, hook.ctx)).map((hook) => hook.callback.bind(thisArg));
  }
  /**
  * Run listeners concurrently and wait for all of them.
  *
  * @param args — optional `this`, the event name, then listener arguments.
  * @returns a promise resolving once every listener has settled.
  */
  async parallel(...args) {
    const errors = (await Promise.allSettled(this.dispatch("emit", args).map(async (cb) => cb(...args)))).filter((result) => result.status === "rejected");
    if (errors.length) throw new AggregateError(errors.map((error) => error.reason));
  }
  /**
  * Run listeners synchronously without waiting for returned promises.
  *
  * @param args — optional `this`, the event name, then listener arguments.
  */
  emit(...args) {
    this.dispatch("emit", args).map((cb) => cb(...args));
  }
  /**
  * Run listeners in order, awaiting each, until one returns a bail value.
  *
  * @param args — optional `this`, the event name, then listener arguments.
  * @returns the first bail value (see {@link isBailed}), if any.
  */
  async serial(...args) {
    for (const cb of this.dispatch("serial", args)) {
      const result = await cb(...args);
      if (isBailed(result)) return result;
    }
  }
  /**
  * Run listeners synchronously until one returns a bail value.
  *
  * @param args — optional `this`, the event name, then listener arguments.
  * @returns the first bail value (see {@link isBailed}), if any.
  */
  bail(...args) {
    for (const cb of this.dispatch("bail", args)) {
      const result = cb(...args);
      if (isBailed(result)) return result;
    }
  }
  /**
  * Compose listeners around the final `next` callback.
  *
  * The last dispatch argument is treated as the innermost `next`. Listeners
  * run outermost-first; a listener that does not call `next()` vetoes the
  * rest of the chain, including the built-in behavior.
  *
  * @param args — optional `this`, the event name, listener arguments, then `next`.
  * @returns the outermost listener's return value.
  */
  waterfall(...args) {
    const cbs = this.dispatch("waterfall", args);
    const inner = args.pop();
    const next = () => {
      return (cbs.shift() ?? inner)(...args);
    };
    args.push(next);
    return next();
  }
  /**
  * Store a listener record as an effect on the current fiber.
  *
  * @param label — effect label shown in fiber diagnostics.
  * @param hooks — the listener list for one event.
  * @param callback — the listener to store.
  * @param options — placement and filtering options.
  * @returns a disposer that unregisters the listener.
  */
  register(label, hooks, callback, options) {
    const method = options.prepend ? "unshift" : "push";
    return this.ctx.fiber.effect(() => {
      hooks[method]({
        ctx: this.ctx,
        callback,
        ...options
      });
      return () => this.unregister(hooks, callback);
    }, label);
  }
  /**
  * Remove a stored listener record.
  *
  * @param hooks — the listener list for one event.
  * @param callback — the listener to remove.
  * @returns `true` if the listener was found and removed.
  */
  unregister(hooks, callback) {
    const index = hooks.findIndex((hook) => hook.callback === callback);
    if (index >= 0) {
      hooks.splice(index, 1);
      return true;
    }
  }
  /**
  * Register an event listener owned by the current fiber.
  *
  * The listener is removed automatically when the fiber unloads. Throws
  * `CordisError('INACTIVE_EFFECT')` if the fiber is already disposed.
  *
  * @param name — the event name to listen for.
  * @param listener — called with the dispatch arguments.
  * @param options — listener options; a boolean is shorthand for `prepend`.
  * @returns a disposer removing the listener; `true` if it was still registered.
  */
  on(name, listener, options) {
    if (typeof options !== "object") options = { prepend: options };
    this.ctx.fiber.assertActive();
    listener = this.ctx.reflect.bind(listener);
    const result = this.bail(this.ctx, "internal/listener", name, listener, options);
    if (result) return result;
    const hooks = this._hooks[name] ||= [];
    const label = `ctx.on(${typeof name === "string" ? JSON.stringify(name) : name.toString()})`;
    return this.register(label, hooks, listener, options);
  }
  /**
  * Register an event listener that disposes itself after the first call.
  *
  * @param name — the event name to listen for.
  * @param listener — called at most once with the dispatch arguments.
  * @param options — listener options; a boolean is shorthand for `prepend`.
  * @returns a disposer removing the listener; `true` if it was still registered.
  */
  once(name, listener, options) {
    const dispose = this.on(name, function(...args) {
      dispose();
      return listener.apply(this, args);
    }, options);
    return dispose;
  }
};
var defaultFormatters = {
  s: (value) => String(value),
  d: (value) => Math.trunc(Number(value)),
  i: (value) => Math.trunc(Number(value)),
  f: (value) => Number(value),
  o: (value) => JSON.stringify(value),
  O: (value) => JSON.stringify(value),
  c: () => "",
  C: (value, exporter, message) => {
    return Logger.color(exporter, Logger.code(message.name, exporter.colors), value);
  }
};
function isAggregateError(error) {
  return error instanceof Error && Array.isArray(error["errors"]);
}
var Logger = class {
  service;
  static color(exporter, code, value, decoration = "") {
    if (!exporter.colors) return "" + value;
    return `\x1B[3${code < 8 ? code : "8;5;" + code}${exporter.colors >= 2 ? decoration : ""}m${value}\x1B[0m`;
  }
  static code(name, level) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash << 3) - hash + name.charCodeAt(i) + 13;
      hash |= 0;
    }
    const colors = !level ? [] : level >= 2 ? c256 : c16;
    return colors[Math.abs(hash) % colors.length];
  }
  static format(exporter, message) {
    const args = message.args.slice();
    if (args[0] instanceof Error) {
      args[0] = args[0].stack || args[0].message;
      args.unshift("%s");
    } else if (typeof args[0] !== "string") args.unshift("%o");
    let format = args.shift();
    format = format.replace(/%([a-zA-Z%])/g, (match, char) => {
      if (match === "%%") return "%";
      const formatter = exporter.formatters?.[char] ?? defaultFormatters[char];
      if (typeof formatter === "function") return formatter(args.shift(), exporter, message);
      return match;
    });
    const oFormatter = exporter.formatters?.o ?? defaultFormatters.o;
    for (let arg of args) {
      if (typeof arg === "object" && arg) arg = oFormatter(arg, exporter, message);
      format += " " + arg;
    }
    const { maxLength = 10240 } = exporter;
    return format.split(/\r?\n/g).map((line2) => {
      return line2.slice(0, maxLength) + (line2.length > maxLength ? "..." : "");
    }).join("\n");
  }
  constructor(options, service) {
    this.service = service;
    Object.assign(this, options);
    this.error = this._method("error", 0);
    this.info = this._method("info", 1);
    this.warn = this._method("warn", 2);
    this.debug = this._method("debug", 3);
  }
  _method(type, level) {
    return (...args) => {
      if (args.length === 1 && args[0] instanceof Error) {
        if (args[0].cause) this[type](args[0].cause);
        else if (isAggregateError(args[0])) {
          args[0].errors.forEach((error) => this[type](error));
          return;
        }
      }
      const sn = ++this.service._snMessage;
      const ts = Date.now();
      for (const exporter of this.service.exporters.values()) {
        if ((exporter.levels?.[this.name] ?? exporter.levels?.default ?? this.level ?? 1) < level) continue;
        const message = {
          sn,
          ts,
          type,
          level,
          name: this.name,
          ...this.meta,
          args
        };
        exporter.export(message);
      }
    };
  }
};
var c16 = [
  6,
  2,
  3,
  4,
  5,
  1
];
var c256 = [
  20,
  21,
  26,
  27,
  32,
  33,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  56,
  57,
  62,
  63,
  68,
  69,
  74,
  75,
  76,
  77,
  78,
  79,
  80,
  81,
  92,
  93,
  98,
  99,
  112,
  113,
  129,
  134,
  135,
  148,
  149,
  160,
  161,
  162,
  163,
  164,
  165,
  166,
  167,
  168,
  169,
  170,
  171,
  172,
  173,
  178,
  179,
  184,
  185,
  196,
  197,
  198,
  199,
  200,
  201,
  202,
  203,
  204,
  205,
  206,
  207,
  208,
  209,
  214,
  215,
  220,
  221
];
var LoggerService = class LoggerService2 {
  bufferSize = 1e3;
  buffer = [];
  ctx;
  _snMessage = 0;
  _snExporter = 0;
  exporters = /* @__PURE__ */ new Map();
  constructor(ctx) {
    const tracker = {
      property: "ctx",
      noShadow: true
    };
    const self = createCallable("logger", joinPrototype(Object.getPrototypeOf(this), Function.prototype), tracker);
    Object.assign(self, this);
    self.ctx = ctx;
    defineProperty(self, symbols.tracker, tracker);
    self.exporter({
      colors: 3,
      export: (message) => {
        self.buffer.push(message);
        if (self.buffer.length > self.bufferSize) self.buffer = self.buffer.slice(-self.bufferSize);
      }
    });
    return self;
  }
  /**
  * Register an exporter and dispose it with the current fiber.
  *
  * @param exporter — the sink that receives structured log messages.
  * @returns a disposer that removes the exporter.
  */
  exporter(exporter) {
    return this.ctx.effect(() => {
      this.exporters.set(++this._snExporter, exporter);
      return () => this.exporters.delete(this._snExporter);
    }, "ctx.logger.exporter()");
  }
  _resolveConfig() {
    let intercept = this.ctx[symbols.intercept];
    const configs = [];
    while ("logger" in intercept) {
      if (Object.hasOwn(intercept, "logger")) configs.unshift(intercept["logger"]);
      intercept = Object.getPrototypeOf(intercept);
    }
    return Object.assign({}, ...configs);
  }
  [symbols.invoke](name) {
    const config = this._resolveConfig();
    const fiber = (this.ctx[symbols.shadow] ?? this.ctx).fiber;
    name ??= config.name;
    name ??= hyphenate(fiber.name);
    return new Logger({
      name,
      level: config.level,
      meta: { fiber: new WeakRef(fiber) }
    }, this);
  }
  static {
    for (const type of [
      "error",
      "info",
      "warn",
      "debug"
    ]) LoggerService2.prototype[type] = function(...args) {
      return this()[type](...args);
    };
  }
};
function enhanceError(error) {
  const lines = error.stack.split("\n");
  lines.splice(0, 2, `Error: ${error.message}`);
  error.stack = lines.join("\n");
  return error;
}
var RESERVED_WORDS = ["prototype", "then"];
function isSpecialProperty(prop) {
  return typeof prop === "symbol" || RESERVED_WORDS.includes(prop) || parseInt(prop).toString() === prop || prop.startsWith("_");
}
var ReflectService = class {
  ctx;
  /** Proxy traps implementing service resolution for every context object. */
  static handler = {
    get: (target, prop, ctx) => {
      if (isSpecialProperty(prop)) return Reflect.get(target, prop, ctx);
      if (Reflect.has(target, prop)) return getTraceable(ctx, Reflect.get(target, prop, ctx));
      const error = /* @__PURE__ */ new Error(`cannot get property "${prop}" without inject`);
      try {
        const def = target.reflect.props[prop];
        if (def?.type === "accessor") return def.get.call(ctx, ctx[symbols.receiver], error);
        if (!ctx.fiber.runtime) return ctx.reflect.get(prop, false);
        return ctx.events.waterfall("internal/get", ctx, prop, error, () => {
          const key = target[symbols.isolate][prop];
          let fiber = (ctx[symbols.shadow] ?? ctx).fiber;
          while (true) {
            const impl = fiber.store?.[prop];
            if (impl) return getTraceable(ctx, impl.value);
            if (prop in fiber.inject) {
              error.message = `cannot get required service "${prop}" in inactive context`;
              throw error;
            }
            if (!fiber.runtime) throw error;
            if (fiber.parent[symbols.isolate][prop] !== key) throw error;
            fiber = fiber.parent.fiber;
          }
        });
      } catch (e) {
        throw e === error ? enhanceError(e) : e;
      }
    },
    set: (target, prop, value, ctx) => {
      if (isSpecialProperty(prop)) return Reflect.set(target, prop, value, ctx);
      const error = /* @__PURE__ */ new Error(`cannot set property "${prop}" without provide`);
      const def = target.reflect.props[prop];
      if (!def) {
        if (!ctx.fiber.runtime) return Reflect.set(target, prop, value, ctx);
        throw enhanceError(error);
      }
      try {
        if (def.type === "accessor") {
          if (!def.set) return false;
          return def.set.call(ctx, value, ctx[symbols.receiver], error);
        }
        return ctx.events.waterfall("internal/set", ctx, prop, value, error, () => {
          return ctx.reflect.set(prop, value, error);
        });
      } catch (e) {
        throw e === error ? enhanceError(e) : e;
      }
    },
    has: (target, prop) => {
      if (isSpecialProperty(prop)) return Reflect.has(target, prop);
      if (Reflect.has(target, prop)) return true;
      return !!target.reflect.props[prop];
    }
  };
  /** Service implementations, keyed by isolation label. */
  store = /* @__PURE__ */ Object.create(null);
  /** Declared context properties (services and accessors), by name. */
  props = /* @__PURE__ */ Object.create(null);
  constructor(ctx) {
    this.ctx = ctx;
    defineProperty(this, symbols.tracker, {
      property: "ctx",
      noShadow: true
    });
    this.mixin("reflect", [
      "get",
      "set",
      "provide",
      "accessor",
      "mixin"
    ]);
    this.mixin("fiber", ["runtime", "effect"]);
    this.mixin("registry", ["inject", "plugin"]);
    this.mixin("events", [
      "on",
      "once",
      "parallel",
      "emit",
      "serial",
      "bail",
      "waterfall"
    ]);
  }
  /**
  * Read a service from the store without the inject requirement.
  *
  * @param name — the service name.
  * @param strict — when `true`, only return implementations whose providing
  * fiber is currently active.
  * @returns the service value, or `undefined` when not (yet) provided.
  */
  get(name, strict = true) {
    return getTraceable(this.ctx, this._getImpl(name, strict)?.value);
  }
  _getImpl(name, strict = true) {
    const key = this.ctx[symbols.isolate][name];
    const impl = key && this.store[key];
    if (!impl) return;
    if (strict && impl.fiber.state !== 2) return;
    return impl;
  }
  /**
  * Overwrite a provided service's value.
  *
  * @param name — the service name.
  * @param value — the new service value.
  * @param error — carrier for the caller stack in diagnostics.
  * @returns `true` on success.
  * @throws when `name` was never provided, or was provided by another fiber.
  */
  set(name, value, error) {
    const key = this.ctx[symbols.isolate][name];
    const impl = this.store[key];
    if (!impl) throw new Error(`cannot set property "${name}" without provide`);
    if (impl.fiber !== this.ctx.fiber) throw new Error(`cannot set property "${name}" in multiple fibers`);
    impl.value = value;
    return true;
  }
  /**
  * Register a service implementation owned by the current fiber.
  *
  * See the `ctx.provide()` overload above for the full contract.
  *
  * @param name — the service name.
  * @param value — the service value.
  * @param check — optional availability predicate for dependents.
  * @returns a disposer that unregisters the service.
  */
  provide(name, value, check) {
    return this.ctx.fiber.effect(() => {
      if (!this.props[name]) this.props[name] ??= { type: "service" };
      else if (this.props[name].type !== "service") throw new Error(`property "${name}" is already declared as ${this.props[name].type}`);
      this.props[name] = { type: "service" };
      this.ctx.root[symbols.isolate][name] ??= Symbol(name);
      const key = this.ctx[symbols.isolate][name];
      const impl = {
        name,
        value,
        fiber: this.ctx.fiber,
        check
      };
      if (this.store[key]) throw new Error(`service "${name}" has been registered at <${this.store[key].fiber.name}>`);
      this.store[key] = impl;
      this.ctx.fiber.store[name] = impl;
      if (this.ctx.fiber.state === 2) this.notify([name]);
      return async () => {
        delete this.store[key];
        const fibers = this.notify([name]);
        await Promise.allSettled(fibers.map((fiber) => fiber.await()));
        delete this.ctx.fiber.store[name];
      };
    }, `ctx.provide(${JSON.stringify(name)})`);
  }
  /**
  * Re-evaluate every fiber that requires one of the given services.
  *
  * @param names — the service names that changed.
  * @param filter — restricts notification to matching isolation scopes.
  * @returns the fibers whose dependency state was refreshed.
  */
  notify(names, filter = (ctx, name) => ctx[symbols.isolate][name] === this.ctx[symbols.isolate][name]) {
    const fibers = [];
    for (const runtime of this.ctx.registry.values()) for (const fiber of runtime.fibers) {
      let hasUpdate = false;
      for (const name of names) {
        if (!(name in fiber.inject)) continue;
        if (!filter(fiber.ctx, name)) continue;
        hasUpdate = true;
        fiber._checkImpl(name);
      }
      if (!hasUpdate) continue;
      fiber._refresh();
      fibers.push(fiber);
    }
    for (const name of names) {
      const self = Object.create(this.ctx);
      self[symbols.filter] = (target) => filter(target, name);
      this.ctx.events.emit(self, "internal/service", name, this._getImpl(name, false)?.value);
    }
    return fibers;
  }
  /**
  * Define a computed context property backed by get/set hooks.
  *
  * @param name — the context property name.
  * @param options — the `get` hook and optional `set` hook.
  * @returns a disposer that removes the accessor.
  */
  accessor(name, options) {
    return this.ctx.fiber.effect(() => {
      if (name in this.props) throw new Error(`property "${name}" is already declared as ${this.props[name].type}`);
      this.props[name] = {
        type: "accessor",
        ...options
      };
      return () => delete this.props[name];
    }, `ctx.accessor(${JSON.stringify(name)})`);
  }
  /**
  * Expose selected members of a service directly on `ctx`.
  *
  * See the `ctx.mixin()` overload above for the full contract.
  *
  * @param source — a context property name or a source object.
  * @param mixins — keys to forward, or a source-key → ctx-key map.
  * @returns a disposer that removes all created accessors.
  */
  mixin(source, mixins) {
    const self = this;
    return this.ctx.fiber.effect(function* () {
      const entries = Array.isArray(mixins) ? mixins.map((key) => [key, key]) : Object.entries(mixins);
      const getTarget = (ctx, error) => {
        return ctx[source];
      };
      for (const [key, value] of entries) yield self.accessor(value, {
        get(receiver, error) {
          const service = getTarget(this, error);
          if (isNullable(service)) return service;
          const mixin = receiver ? withProps(receiver, service) : service;
          const value2 = Reflect.get(service, key, mixin);
          if (typeof value2 !== "function") return value2;
          return value2.bind(mixin ?? service);
        },
        set(value2, receiver, error) {
          const service = getTarget(this, error);
          const mixin = receiver ? withProps(receiver, service) : service;
          return Reflect.set(service, key, value2, mixin);
        }
      });
    }, `ctx.mixin(${JSON.stringify(source)})`);
  }
  /**
  * Attach this context's tracing wrapper to a value.
  *
  * @param value — the value to wrap.
  * @returns the traceable wrapper (or the value itself when not applicable).
  */
  trace(value) {
    return getTraceable(this.ctx, value);
  }
  /**
  * Wrap a callback so calls trace `this` and arguments to this context.
  *
  * @param callback — the function to wrap.
  * @returns a proxy delegating to `callback` with traced values.
  */
  bind(callback) {
    return new Proxy(callback, {
      apply: (target, thisArg, args) => {
        return Reflect.apply(target, this.trace(thisArg), args.map((arg) => this.trace(arg)));
      },
      construct: (target, args, newTarget) => {
        return Reflect.construct(target, args.map((arg) => this.trace(arg)), newTarget);
      }
    });
  }
};
var kValidationError = Symbol.for("ValidationError");
var ValidationError = class extends TypeError {
  name = "ValidationError";
  /**
  * Build the aggregated message from schema issues.
  *
  * @param issues — the standard-schema issues, one message line each.
  */
  constructor(issues) {
    super(`invalid config:
` + issues.map((issue) => {
      if (issue.path) return `  - ${issue.message} (at ${issue.path.join(".")})`;
      else return `  - ${issue.message}`;
    }).join("\n"));
  }
};
Object.defineProperty(ValidationError.prototype, kValidationError, { value: true });
function resolveConfig(runtime, config) {
  if (!runtime.Config) return config;
  const result = runtime.Config["~standard"].validate(config);
  if ("then" in result) throw new TypeError("Async config validation is not supported");
  if (result.issues) throw new ValidationError(result.issues);
  else return result.value;
}
var effectInertia = /* @__PURE__ */ new WeakMap();
function runDisposable(dispose) {
  const result = dispose();
  return effectInertia.get(dispose)?.() ?? result;
}
function emitPluginDisposed(context, fiber) {
  const args = ["internal/plugin", fiber];
  let callbacks;
  try {
    callbacks = context.events.dispatch("emit", args);
  } catch (error) {
    context.logger.error(error);
    return;
  }
  for (const callback of callbacks) try {
    const returned = callback(...args);
    Promise.resolve(returned).catch((error) => context.logger.error(error));
  } catch (error) {
    context.logger.error(error);
  }
}
var CordisError = class CordisError2 extends Error {
  code;
  /**
  * @param code — the stable error code; also the default message.
  * @param message — optional human-readable override.
  */
  constructor(code, message) {
    super(message ?? CordisError2.Code[code]);
    this.code = code;
  }
};
(function(CordisError3) {
  CordisError3.Code = { INACTIVE_EFFECT: "cannot create effect on inactive context" };
})(CordisError || (CordisError = {}));
var INACTIVE = "__INACTIVE__";
var Fiber = class {
  parent;
  inject;
  runtime;
  /** Unique id within the registry; 0 for the root fiber, `null` once disposed. */
  uid;
  /** The context this fiber's plugin runs in (extends the parent context). */
  ctx;
  /** The validated plugin config (updated by `update()`). */
  config;
  /** The raw plugin config, re-resolved before each activation. */
  _config;
  /** Current lifecycle state; transitions emit `internal/status`. */
  state = 0;
  /** Dispose this fiber: unload the plugin, then settle once cleanup finished. */
  dispose;
  /** Snapshot of required service implementations while loaded; `undefined` otherwise. */
  store;
  /** The in-flight load/unload transition, if one is currently running. */
  inertia;
  _hooks = /* @__PURE__ */ Object.create(null);
  _disposables = new DisposableList();
  context;
  _error;
  _runner;
  _store = /* @__PURE__ */ Object.create(null);
  /**
  * Create a fiber. Plugin authors normally obtain fibers from `ctx.plugin()`
  * rather than constructing them directly.
  *
  * @param parent — the context the plugin was loaded from.
  * @param config — raw config, validated against the runtime's schema.
  * @param inject — resolved dependency map (service name → intercept config).
  * @param runtime — the shared plugin runtime, or `null` for the root fiber.
  * @param getOuterStack — captures the caller stack for effect diagnostics.
  */
  constructor(parent, config, inject2, runtime, getOuterStack) {
    this.parent = parent;
    this.inject = inject2;
    this.runtime = runtime;
    this._config = config;
    const collect = (dispose) => {
      this._disposables.push(dispose);
    };
    if (runtime) {
      this.uid = parent.registry.counter;
      this.ctx = this.context = parent.extend({ fiber: this });
      const injectEntries = Object.entries(this.inject);
      if (injectEntries.length) {
        this.ctx[Context.intercept] = Object.create(parent[Context.intercept]);
        for (const [name, config2] of injectEntries) {
          if (isNullable(config2)) continue;
          this.ctx[Context.intercept][name] = config2;
        }
      }
      this._runner = {
        epoch: INACTIVE,
        getOuterStack,
        execute: function() {
          if (isConstructor(runtime.callback)) {
            const instance = new runtime.callback(this.ctx, this.config);
            for (const hook of instance?.[symbols.initHooks] ?? []) hook();
            return instance?.[symbols.init]?.();
          } else return runtime.callback(this.ctx, this.config);
        },
        collect
      };
      this.dispose = parent.fiber.effect(() => {
        const remove = runtime.fibers.push(this);
        return async () => {
          this.uid = null;
          emitPluginDisposed(this.context, this);
          if (this.ctx.registry.has(runtime.callback)) {
            remove();
            if (!runtime.fibers.length) this.ctx.registry.delete(runtime.callback);
          }
          this._setEpoch(INACTIVE);
          if (!this.inertia) this._updateState(() => {
            this.inertia = this._unload();
            return 5;
          });
          while (this.inertia) await this.inertia;
        };
      }, "ctx.plugin()");
      try {
        this.context.emit("internal/plugin", this);
      } catch (error) {
        Promise.resolve(this.dispose()).catch((reason) => this.ctx.logger.error(reason));
        throw error;
      }
      if (this.uid !== null && parent.fiber.state !== 5) {
        for (const name of Object.keys(this.inject)) this._checkImpl(name);
        this._refresh();
      }
    } else {
      this.uid = 0;
      this.ctx = this.context = parent;
      this.state = 2;
      this.store = /* @__PURE__ */ Object.create(null);
      this._runner = {
        epoch: "",
        getOuterStack,
        execute: () => {
        },
        collect
      };
      this.dispose = () => this.restart();
    }
  }
  /** The plugin's display name, inherited from the nearest named ancestor, else `'root'`. */
  get name() {
    let fiber = this;
    do {
      if (fiber.runtime?.name) return fiber.runtime.name;
      fiber = fiber.parent.fiber;
    } while (fiber !== fiber.parent.fiber);
    return "root";
  }
  /**
  * Throw if the fiber has already been disposed.
  *
  * @returns nothing when the fiber is still active.
  * @throws {CordisError} `INACTIVE_EFFECT` when the fiber's uid has been cleared.
  */
  assertActive() {
    if (this.uid !== null) return;
    throw new CordisError("INACTIVE_EFFECT");
  }
  _execute(runner) {
    const oldEpoch = runner.epoch;
    return composeError((info) => {
      const safeCollect = (dispose) => {
        if (typeof dispose === "function") runner.collect(dispose);
        else if (!isNullable(dispose)) throw new TypeError("Invalid effect");
      };
      const effect = runner.execute.call(this);
      if (typeof effect === "function") return runner.collect(effect);
      else if (isNullable(effect)) {
      } else if (!isObject(effect)) throw new TypeError("Invalid effect");
      else if ("then" in effect) return effect.then(safeCollect);
      else if (Symbol.iterator in effect) {
        info.error = /* @__PURE__ */ new Error();
        const iter = effect[Symbol.iterator]();
        while (true) {
          const result = iter.next();
          safeCollect(result.value);
          if (result.done) return;
        }
      } else if (Symbol.asyncIterator in effect) {
        const iter = effect[Symbol.asyncIterator]();
        return (async () => {
          await Promise.resolve();
          info.error = /* @__PURE__ */ new Error();
          while (true) {
            if (runner.epoch !== oldEpoch) return;
            const result = await iter.next();
            safeCollect(result.value);
            if (result.done) return;
          }
        })();
      } else throw new TypeError("Invalid effect");
    }, runner.getOuterStack);
  }
  effect(execute, label = "anonymous") {
    this.assertActive();
    if (this.state === 5) throw new CordisError("INACTIVE_EFFECT");
    const disposables = [];
    let disposing = false;
    let disposalTask;
    const dispose = () => {
      if (disposing) return disposalTask;
      disposing = true;
      let task2;
      for (const disposable of disposables.splice(0).reverse()) if (task2) task2 = task2.then(() => runDisposable(disposable));
      else {
        const result = runDisposable(disposable);
        if (isObject(result) && "then" in result) task2 = result;
      }
      return disposalTask = task2;
    };
    const meta = {
      label,
      children: []
    };
    const runner = {
      execute,
      epoch: true,
      collect: (dispose2) => {
        disposables.push(dispose2);
        this._disposables.delete(dispose2);
        if (dispose2[symbols.effect]) meta.children.push(dispose2[symbols.effect]);
      },
      getOuterStack: buildOuterStack()
    };
    let task;
    let executing = true;
    let resolveSetup;
    let rejectSetup;
    let setupBarrier;
    let setupFailed = false;
    let inFlight;
    let removeWrapper = () => false;
    const waitForSetup = () => {
      setupBarrier ??= new Promise((resolve, reject) => {
        resolveSetup = resolve;
        rejectSetup = reject;
      });
      return setupBarrier;
    };
    const disposeAfter = (setup) => {
      return Promise.resolve(setup).then(() => dispose(), async (reason) => {
        await dispose();
        throw reason;
      });
    };
    const finalizeDisposal = (callback) => {
      let result;
      try {
        result = callback();
      } catch (error) {
        removeWrapper();
        throw error;
      }
      if (isObject(result) && "then" in result) {
        const pending = Promise.resolve(result).finally(() => {
          removeWrapper();
          if (inFlight === pending) inFlight = void 0;
        });
        return inFlight = pending;
      }
      removeWrapper();
      return result;
    };
    const wrapper = defineProperty(() => {
      if (!runner.epoch) return setupFailed ? inFlight : void 0;
      runner.epoch = false;
      return finalizeDisposal(() => {
        if (executing) return disposeAfter(waitForSetup());
        return task ? disposeAfter(task) : dispose();
      });
    }, symbols.effect, meta);
    effectInertia.set(wrapper, () => inFlight);
    removeWrapper = this._disposables.push(wrapper);
    try {
      task = this._execute(runner);
    } catch (reason) {
      executing = false;
      setupFailed = true;
      runner.epoch = false;
      let cleanup;
      try {
        cleanup = finalizeDisposal(dispose);
      } finally {
        rejectSetup?.(reason);
      }
      if (isObject(cleanup) && "then" in cleanup) cleanup.catch((error) => this.ctx.logger.error(error));
      throw reason;
    }
    executing = false;
    if (setupBarrier) Promise.resolve(task).then(resolveSetup, rejectSetup);
    task?.catch(() => {
      if (!runner.epoch) return dispose();
      return finalizeDisposal(dispose);
    }).catch((error) => this.ctx.logger.error(error));
    const disposeAsync = () => {
      if (!runner.epoch) return;
      runner.epoch = false;
      return finalizeDisposal(dispose);
    };
    wrapper.then = async (onFulfilled, onRejected) => {
      return Promise.resolve(task).then(() => disposeAsync).then(onFulfilled, onRejected);
    };
    return wrapper;
  }
  /**
  * Return metadata for currently registered effects.
  *
  * @returns one {@link EffectMeta} tree per labeled live effect.
  */
  getEffects() {
    return [...this._disposables].map((dispose) => dispose[symbols.effect]).filter(Boolean);
  }
  _getState() {
    if (this.uid === null) return 4;
    if (this._error) return 3;
    if (this._runner.epoch !== INACTIVE) return 2;
    return 0;
  }
  _updateState(callback) {
    const oldState = this.state;
    this.state = callback() ?? this._getState();
    if (oldState === this.state) return;
    this.context.emit("internal/status", this, oldState);
    if (oldState !== 2 && this.state !== 2) return;
    for (const key of Reflect.ownKeys(this.ctx.reflect.store)) {
      const impl = this.ctx.reflect.store[key];
      if (impl.fiber !== this) continue;
      this.ctx.reflect.notify([impl.name]);
    }
  }
  _checkImpl(name) {
    const impl = this.ctx.reflect._getImpl(name, true);
    if (!impl) return delete this._store[name];
    try {
      if (impl.check && !impl.check.call(getTraceable(this.ctx, impl.value))) return delete this._store[name];
    } catch (error) {
      impl.fiber.ctx.logger.error(error);
      return delete this._store[name];
    }
    this._store[name] = impl;
  }
  _refresh() {
    let epoch = false;
    epoch = "";
    for (const name of Object.keys(this.inject)) {
      const impl = this._store[name];
      if (!impl) {
        epoch = INACTIVE;
        break;
      }
      epoch += ":" + impl.fiber.uid;
    }
    this._setEpoch(epoch);
  }
  _setEpoch(epoch) {
    const oldEpoch = this._runner.epoch;
    if (epoch === oldEpoch) return;
    this._runner.epoch = epoch;
    if (this.inertia) return;
    this._updateState(() => {
      if (epoch !== INACTIVE && oldEpoch === INACTIVE) {
        this.inertia = this._reload();
        return 1;
      } else {
        this.inertia = this._unload();
        return 5;
      }
    });
  }
  _resolveConfig(config) {
    config = this.context.waterfall(this, "internal/config", config, () => config);
    return this.runtime ? resolveConfig(this.runtime, config) : config;
  }
  async _reload() {
    this.store = { ...this._store };
    const oldEpoch = this._runner.epoch;
    try {
      await Promise.resolve();
      if (this._runner.epoch === oldEpoch) {
        this.config = this._resolveConfig(this._config);
        await this._execute(this._runner);
        this._error = void 0;
      }
    } catch (reason) {
      this.ctx.logger.error(reason);
      this._error = reason;
      this._runner.epoch = INACTIVE;
    }
    this._updateState(() => {
      if (this._runner.epoch === oldEpoch) this.inertia = void 0;
      else {
        this.inertia = this._unload();
        return 5;
      }
    });
  }
  async _unload() {
    await Promise.all(this._disposables.clear().map(async (dispose) => {
      try {
        await composeError(async (info) => {
          await Promise.resolve();
          info.error = /* @__PURE__ */ new Error();
          await runDisposable(dispose);
        }, this._runner.getOuterStack);
      } catch (reason) {
        this.ctx.logger.error(reason);
      }
    }));
    this.store = void 0;
    this._updateState(() => {
      if (this._runner.epoch === INACTIVE) this.inertia = void 0;
      else {
        this.inertia = this._reload();
        return 1;
      }
    });
  }
  /**
  * Wait for current lifecycle work and rethrow startup errors.
  *
  * @returns this fiber, once it has settled into a stable state.
  * @throws the config-validation or plugin-startup error, if any.
  */
  async await() {
    while (this.inertia) await this.inertia;
    if (this._error) throw this._error;
    return this;
  }
  /**
  * Dispose and immediately reload this plugin with its current config.
  *
  * @returns a promise resolving once the reload settled.
  * @throws {CordisError} `INACTIVE_EFFECT` when the fiber is already disposed.
  */
  async restart() {
    this.assertActive();
    this._setEpoch(INACTIVE);
    this._refresh();
    await this.await();
  }
  /**
  * Validate and apply new config, then restart the plugin.
  *
  * Runs the `internal/update` waterfall first, so update hooks (and HMR)
  * can veto or replace the restart.
  *
  * @param config — the new raw config; validated before anything restarts.
  * @param noSave — hint for persistence hooks not to write the change back.
  * @returns the update waterfall result; the default restart returns a promise.
  * @throws when validation, an update listener, or the restarted plugin fails.
  */
  update(config, noSave = false) {
    this.assertActive();
    this._config = config;
    if (this.state !== 2) {
      this._error = void 0;
      this._setEpoch(INACTIVE);
      this._refresh();
      return;
    }
    config = this._resolveConfig(config);
    return this.context.waterfall(this, "internal/update", config, noSave, () => {
      this.config = config;
      this._error = void 0;
      return this.restart();
    });
  }
};
function isApplicable(object) {
  return object && typeof object === "object" && typeof object.apply === "function";
}
function Inject(name, config) {
  return function(value, decorator) {
    if (decorator.kind === "class") {
      if (!Object.hasOwn(value, "inject")) {
        defineProperty(value, "inject", Object.create(Object.getPrototypeOf(value).inject ?? null));
        defineProperty(value.inject, symbols.checkProto, true);
      }
      value.inject[name] = config;
    } else if (decorator.kind === "method") {
      const inject2 = (value[symbols.metadata] ??= {}).inject ??= /* @__PURE__ */ Object.create(null);
      inject2[name] = config;
      decorator.addInitializer(function() {
        const property = this[symbols.tracker]?.property;
        (this[symbols.initHooks] ??= []).push(() => {
          this.ctx.inject(inject2, (ctx) => {
            return value.call(property ? withProps(this, { [property]: ctx }) : this);
          });
        });
      });
    } else throw new Error("@Inject() can only be used on class or class methods");
  };
}
(function(Inject2) {
  function resolve(inject2, result = /* @__PURE__ */ Object.create(null)) {
    if (!inject2) return result;
    if (Array.isArray(inject2)) for (const name of inject2) result[name] = null;
    else if (Reflect.has(inject2, symbols.checkProto)) {
      Object.assign(result, resolve(Object.getPrototypeOf(inject2)));
      for (const name of Object.keys(inject2)) result[name] = inject2[name] ?? null;
    } else for (const name of Object.keys(inject2)) result[name] = inject2[name] ?? null;
    return result;
  }
  Inject2.resolve = resolve;
})(Inject || (Inject = {}));
var RegistryService = class {
  ctx;
  _counter = 0;
  _internal = /* @__PURE__ */ new Map();
  constructor(ctx) {
    this.ctx = ctx;
    defineProperty(this, symbols.tracker, {
      property: "ctx",
      noShadow: true
    });
  }
  /** Allocate the next fiber uid (increments on every read). */
  get counter() {
    return ++this._counter;
  }
  /** Number of registered plugin runtimes. */
  get size() {
    return this._internal.size;
  }
  /**
  * Resolve a supported plugin shape to its executable callback.
  *
  * @param plugin — a function, class, or `{ apply }` object plugin.
  * @returns the callback identifying the plugin, or `undefined` if invalid.
  */
  resolve(plugin) {
    try {
      if (typeof plugin === "function") return plugin;
      if (isApplicable(plugin)) return plugin.apply;
    } catch {
    }
  }
  /**
  * Look up the runtime record for a plugin.
  *
  * @param plugin — any supported plugin shape.
  * @returns the runtime, or `undefined` when the plugin is not registered.
  */
  get(plugin) {
    const key = this.resolve(plugin);
    return key && this._internal.get(key);
  }
  /**
  * Check whether a plugin has a registered runtime.
  *
  * @param plugin — any supported plugin shape.
  * @returns `true` when at least one fiber of the plugin exists.
  */
  has(plugin) {
    const key = this.resolve(plugin);
    return !!key && this._internal.has(key);
  }
  /**
  * Dispose every running fiber for a plugin and remove its runtime record.
  *
  * @param plugin — any supported plugin shape.
  * @returns the removed runtime, or `undefined` when none was registered.
  */
  delete(plugin) {
    const key = this.resolve(plugin);
    const runtime = key && this._internal.get(key);
    if (!runtime) return;
    this._internal.delete(key);
    for (const fiber of runtime.fibers) fiber.dispose();
    return runtime;
  }
  /** Iterate the registered plugin callbacks. */
  keys() {
    return this._internal.keys();
  }
  /** Iterate the registered plugin runtimes. */
  values() {
    return this._internal.values();
  }
  /** Iterate `[callback, runtime]` pairs. */
  entries() {
    return this._internal.entries();
  }
  /**
  * Visit every registered runtime.
  *
  * @param callback — receives each runtime and its identifying callback.
  */
  forEach(callback) {
    return this._internal.forEach(callback);
  }
  /**
  * Start a callback once the requested dependencies are available.
  *
  * @param inject — required services, as an array or a name → config map.
  * @param callback — plugin body called with `(ctx, config)`.
  * @returns the fiber; awaiting it settles once loading finished.
  */
  inject(inject2, callback) {
    return this.plugin({
      inject: inject2,
      apply: callback,
      name: callback.name
    });
  }
  /**
  * Start a plugin in the current context and return its fiber.
  *
  * Creates (or reuses) the plugin's runtime record, then starts a new fiber
  * under the current context. Throws if `plugin` is not a supported shape or
  * if the current fiber is already disposed.
  *
  * @param plugin — a function, class, or `{ apply }` object plugin.
  * @param config — the plugin config, validated against its `Config` schema.
  * @param getOuterStack — captures the caller stack for effect diagnostics.
  * @returns the fiber; awaiting it settles once loading finished.
  */
  plugin(plugin, config, getOuterStack = buildOuterStack()) {
    const callback = this.resolve(plugin);
    if (!callback) throw new Error('invalid plugin, expect function or object with an "apply" method, received ' + typeof plugin);
    this.ctx.fiber.assertActive();
    let runtime = this._internal.get(callback);
    if (!runtime) {
      let name = plugin.name;
      if (name === "apply") name = void 0;
      runtime = {
        name,
        callback,
        fibers: new DisposableList(),
        Config: plugin.Config
      };
      this._internal.set(callback, runtime);
    }
    const fiber = new Fiber(this.ctx, config, Inject.resolve(plugin.inject), runtime, getOuterStack);
    const wrapped = Object.create(fiber);
    wrapped.then = (onFulfilled, onRejected) => {
      return fiber.await().then(onFulfilled, onRejected);
    };
    return wrapped;
  }
};
var Context = class Context2 {
  /** Symbol key under which a disposer exposes its {@link EffectMeta} diagnostics tree. */
  static effect = symbols.effect;
  /** Symbol key for a context's listener filter, consulted on every event dispatch. */
  static filter = symbols.filter;
  /** Symbol key of the isolation map (see the `Context[symbols.isolate]` property). */
  static isolate = symbols.isolate;
  /** Symbol key of the intercept map (see the `Context[symbols.intercept]` property). */
  static intercept = symbols.intercept;
  /**
  * Returns true for Cordis context proxies and context prototypes.
  *
  * Works across realms and across multiple copies of cordis, because the
  * brand is keyed by a global symbol rather than by `instanceof`.
  *
  * @param value — the value to test.
  * @returns `true` if `value` is a Cordis context, narrowing its type.
  */
  static is(value) {
    return !!value?.[Context2.is];
  }
  static {
    Context2.is[Symbol.toPrimitive] = () => Symbol.for("cordis.is");
    Context2.prototype[Context2.is] = true;
  }
  /** Create the root context and install the built-in services. */
  constructor() {
    this[symbols.isolate] = /* @__PURE__ */ Object.create(null);
    this[symbols.intercept] = /* @__PURE__ */ Object.create(null);
    const self = new Proxy(this, ReflectService.handler);
    this.root = self;
    this.baseUrl = void 0;
    this.fiber = new Fiber(self, {}, /* @__PURE__ */ Object.create(null), null, () => []);
    this.reflect = new ReflectService(self);
    this.registry = new RegistryService(self);
    this.events = new EventsService(self);
    this.logger = new LoggerService(self);
    this.fiber._disposables.clear();
    return self;
  }
  [Symbol.for("nodejs.util.inspect.custom")]() {
    return `Context <${this.fiber.name}>`;
  }
  /**
  * Create a child context with extra metadata on top of the current scope.
  *
  * The child prototypally inherits every property of this context; own
  * properties of `meta` shadow the inherited ones. The parent is not mutated.
  *
  * @param meta — own properties (including symbol keys) to define on the child.
  * @returns a child context inheriting from this one.
  */
  extend(meta = {}) {
    const shadow = Reflect.getOwnPropertyDescriptor(this, symbols.shadow)?.value;
    const self = Object.create(getTraceable(this, this));
    for (const prop of Reflect.ownKeys(meta)) Object.defineProperty(self, prop, Reflect.getOwnPropertyDescriptor(meta, prop));
    if (!shadow) return self;
    return Object.assign(Object.create(self), { [symbols.shadow]: shadow });
  }
  /**
  * Create a child context with an independent service scope for `name`.
  *
  * Below the returned context, reads and writes of the service `name`
  * resolve against the new label instead of the parent's, so a different
  * implementation can be provided without affecting the parent scope.
  * Passing the same `label` to two `isolate()` calls joins their scopes.
  *
  * @param name — the service name to isolate.
  * @param label — scope label to join; defaults to a fresh unique symbol.
  * @returns a child context whose `name` service resolves in the new scope.
  */
  isolate(name, label) {
    const shadow = Object.create(this[symbols.isolate]);
    shadow[name] = label ?? Symbol(name);
    return this.extend({ [symbols.isolate]: shadow });
  }
  intercept(name, config) {
    const intercept = Object.create(this[symbols.intercept]);
    intercept[name] = config;
    return this.extend({ [symbols.intercept]: intercept });
  }
};
var Service = class Service2 {
  ctx;
  /** Symbol key of an instance method run after construction (class plugins). */
  static init = symbols.init;
  /** Symbol key of the availability predicate passed to `ctx.provide()`. */
  static check = symbols.check;
  /** Symbol key of the phantom intercept-config type parameter. */
  static config = symbols.config;
  /** Symbol key of the call body making a service callable (e.g. `ctx.logger()`). */
  static invoke = symbols.invoke;
  /** Symbol key of the helper deriving an extended service instance. */
  static extend = symbols.extend;
  /** Symbol key of the tracker metadata used for context tracing. */
  static tracker = symbols.tracker;
  /** Symbol key of the intercept-config resolution helper below. */
  static resolveConfig = symbols.resolveConfig;
  /** The service name this instance is registered under. */
  name;
  /**
  * Register this instance as `name` in the current context.
  *
  * Calls `ctx.reflect.provide(name, this, this[Service.check])`, so the
  * service is unregistered automatically when the owning fiber unloads.
  * Services with a `[Service.invoke]` body return a callable instance.
  *
  * @param ctx — the context to register in (stored as `this.ctx`).
  * @param name — the service name; defaults to the static `provide` field.
  */
  constructor(ctx, name) {
    this.ctx = ctx;
    name ??= this.constructor["provide"];
    let self = this;
    const tracker = {
      associate: name,
      property: "ctx"
    };
    if (self[symbols.invoke]) self = createCallable(name, joinPrototype(Object.getPrototypeOf(this), Function.prototype), tracker);
    self.ctx = ctx;
    self.name = name;
    defineProperty(self, symbols.tracker, tracker);
    self.ctx.reflect.provide(name, self, this[symbols.check]);
    return self;
  }
  [symbols.filter](ctx) {
    return ctx[symbols.isolate][this.name] === this.ctx[symbols.isolate][this.name];
  }
  [symbols.extend](props) {
    let self;
    if (this[Service2.invoke]) self = createCallable(this.name, this, this[symbols.tracker]);
    else self = Object.create(this);
    return Object.assign(self, props);
  }
  /**
  * Merge intercept config from ancestors with optional base and head values.
  *
  * Entries added closer to the root apply first; `base` is prepended and
  * `head` appended. Uses `Config.merge` when the service declares one,
  * otherwise a shallow `Object.assign`.
  *
  * @param base — lowest-precedence config merged before all intercepts.
  * @param head — highest-precedence config merged after all intercepts.
  * @returns the merged config.
  */
  [symbols.resolveConfig](base, head) {
    let intercept = this.ctx[Context.intercept];
    const configs = [];
    while (this.name in intercept) {
      if (Object.hasOwn(intercept, this.name)) configs.unshift(intercept[this.name]);
      intercept = Object.getPrototypeOf(intercept);
    }
    if (base) configs.unshift(base);
    if (head) configs.push(head);
    if (this["Config"]?.merge) return this["Config"].merge(...configs);
    else return Object.assign({}, ...configs);
  }
  static [Symbol.hasInstance](instance) {
    if (!instance) return false;
    let constructor = instance.constructor;
    while (constructor) {
      constructor = constructor.prototype?.constructor;
      if (constructor === this) return true;
      constructor &&= Object.getPrototypeOf(constructor);
    }
    return false;
  }
};

// ../../../.nvm/versions/node/v24.21.0/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-typert-protocol/lib/index.js
var TYPERT_REMOTE_SEGMENT_PATTERN = /^[A-Za-z0-9_$.-]+$/;
function isTypertRemoteSegment(value) {
  return value !== "." && value !== ".." && TYPERT_REMOTE_SEGMENT_PATTERN.test(value);
}
var REMOTE_METHOD_DESCRIPTOR = "@deepseek-ai/dsh-typert-protocol/remote-methods";
function bindTypertRemote(service, serviceKey, options = {}) {
  validateName("service key", serviceKey);
  const namespace = options.namespace ?? serviceKey;
  validateName("namespace", namespace);
  return Object.freeze({
    service,
    serviceKey,
    namespace
  });
}
var TypertRemoteService = class extends Service {
  /** Visible binding consumed by the Gateway's source-mode discovery. */
  typertRemote;
  /**
  * Register the Service and bind the same key to Typert Gateway.
  * @param ctx - owning Cordis Context.
  * @param serviceKey - exact Cordis service key and default wire namespace.
  * @param options - optional distinct wire namespace.
  */
  constructor(ctx, serviceKey, options = {}) {
    super(ctx, serviceKey);
    this.typertRemote = bindTypertRemote(this, this.name, options);
  }
};
function Remote(methodExportOrOptions, context) {
  if (typeof methodExportOrOptions === "string") {
    validateName("Remote export name", methodExportOrOptions);
    return remoteDecorator({ kind: "direct" }, void 0, methodExportOrOptions);
  }
  if (typeof methodExportOrOptions === "object") {
    if (remoteOptionMode(methodExportOrOptions) !== "stream" || Reflect.ownKeys(methodExportOrOptions).length !== 1) throw new TypeError('typert-protocol: Remote options must contain exactly mode: "stream"');
    return remoteDecorator({ kind: "direct" }, "stream");
  }
  if (context === void 0) throw new TypeError("typert-protocol: Remote decorator context is missing");
  addMarkerInitializer(context, { kind: "direct" });
}
function remoteOptionMode(options) {
  return Reflect.get(options, "mode");
}
function remoteDecorator(invocation, mode, exportName) {
  return function(_method, context) {
    addMarkerInitializer(context, invocation, mode, exportName);
  };
}
function readRemoteMethodDescriptor(prototype) {
  const property = Object.getOwnPropertyDescriptor(prototype, REMOTE_METHOD_DESCRIPTOR);
  if (property === void 0) return void 0;
  const descriptor = property.value;
  if (descriptor === null || typeof descriptor !== "object") throw new TypeError("typert-protocol: Remote method descriptor must be an object");
  const version = Reflect.get(descriptor, "version");
  if (version !== 1) throw new TypeError(`typert-protocol: unsupported Remote method descriptor version ${String(version)}`);
  const methods = Reflect.get(descriptor, "methods");
  if (!Array.isArray(methods)) throw new TypeError("typert-protocol: Remote method descriptor methods must be an array");
  return descriptor;
}
function addMarkerInitializer(context, invocation, mode, exportName) {
  if (context.private || context.static || typeof context.name !== "string") throw new TypeError("typert-protocol: Remote decorators require a public instance method with a string name");
  const method = context.name;
  context.addInitializer(function() {
    const prototype = Object.getPrototypeOf(this);
    if (prototype === null) throw new TypeError(`typert-protocol: cannot mark Remote method "${method}" on an object without a prototype`);
    mark(prototype, method, invocation, mode, exportName);
  });
}
function mark(prototype, method, invocation, mode, exportName) {
  const descriptor = readRemoteMethodDescriptor(prototype);
  const marker = Object.freeze({
    method,
    ...exportName === void 0 || exportName === method ? {} : { exportName },
    ...mode === void 0 ? {} : { mode },
    invocation: Object.freeze(invocation)
  });
  const current = descriptor?.methods.find((candidate) => candidate.method === method);
  if (current !== void 0) {
    if (current.exportName === marker.exportName && current.mode === marker.mode && sameInvocation(current.invocation, invocation)) return;
    throw new Error(`typert-protocol: Remote method "${method}" has conflicting invocation markers`);
  }
  Object.defineProperty(prototype, REMOTE_METHOD_DESCRIPTOR, {
    configurable: true,
    value: Object.freeze({
      version: 1,
      methods: Object.freeze([...descriptor?.methods ?? [], marker])
    })
  });
}
function sameInvocation(left, right) {
  if (left.kind === "direct") return right.kind === "direct";
  if (right.kind === "direct") return false;
  return left.context === right.context;
}
function validateName(subject, value) {
  if (!isTypertRemoteSegment(value)) throw new TypeError(`typert-protocol: ${subject} must contain only RPC endpoint segment characters`);
}

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
          const mark2 = s.status === "\u901A\u8FC7" ? "\u2713" : s.status === "\u9700\u6574\u6539" ? "!" : s.status === "\u8FDB\u884C\u4E2D" ? "~" : "\xB7";
          lines.push(`    ${mark2} ${s.node} \u2014 ${s.status}${s.plannedAt ? `\uFF08${s.plannedAt}\uFF09` : ""}`);
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
var inject = [];
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
    version: "0.2.0",
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
    async submitRender(req) {
      const cfg = await loadConfig();
      const db = await loadDB();
      const prj = req?.projectId ? db.projects.find((p) => p.id === req.projectId) : void 0;
      return submitRender(
        cfg,
        { ...req, projectLabel: prj?.name || req?.projectLabel || "unassigned" },
        renderSink
      );
    },
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
