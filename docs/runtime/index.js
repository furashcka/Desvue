var e = class extends Error {
	name = "DocumentError";
}, t = class extends e {
	name = "InvalidPsdInputError";
	constructor(e = "Invalid PSD input") {
		super(e);
	}
}, n = class extends e {
	name = "LayerNotFoundError";
	constructor(e) {
		super(`Layer "${e}" was not found in this PSD`);
	}
}, r = class extends e {
	name = "DisposedResourceError";
	constructor(e) {
		super(`The ${e} has already been disposed`);
	}
}, i = class extends e {
	name = "InvalidConvertOptionsError";
	constructor(e = "Invalid conversion options") {
		super(e);
	}
}, a = class extends e {
	name = "InvalidRenderOptionsError";
	constructor(e = "Invalid render options") {
		super(e);
	}
}, o = class t {
	#e;
	#t = /* @__PURE__ */ new Map();
	#n = 1;
	#r = !1;
	constructor(e) {
		this.#e = e, e.addEventListener("message", this.#a), e.addEventListener("error", this.#o), e.addEventListener("messageerror", this.#s);
	}
	static async create() {
		if (typeof Worker > "u") throw new e("Desvue requires a browser with Web Worker support");
		let n = new Worker(new URL(
			/* @vite-ignore */
			"" + new URL("worker.js", import.meta.url).href,
			"" + import.meta.url
		), {
			name: "Desvue",
			type: "module"
		}), r = new t(n);
		try {
			return await r.#i({ action: "initialize" }), r;
		} catch (e) {
			throw await r.dispose(), e;
		}
	}
	async parse(e, t) {
		let n = e.buffer, r = await this.#i({
			action: "parse",
			bytes: n
		}, [n], t);
		return new s(this, r.handle, r.metadata);
	}
	inspect(e, t) {
		return this.#i({
			action: "inspect",
			handle: e,
			layerIndex: t
		});
	}
	setLayerVisibility(e, t, n) {
		return this.#i({
			action: "setLayerVisibility",
			handle: e,
			layerIndex: t,
			visible: n
		});
	}
	renderDocument(e, t, n) {
		let r = t ? {
			action: "renderDocumentRegion",
			handle: e,
			x: t.left,
			y: t.top,
			width: t.right - t.left,
			height: t.bottom - t.top
		} : {
			action: "renderDocument",
			handle: e
		};
		return this.#i(r, [], n);
	}
	convert(e, t, n, r) {
		return n.format === "svg" ? this.#i({
			action: "convertSvg",
			handle: e,
			layerIndex: t,
			isolate: n.isolate ?? !1
		}, [], r) : this.#i({
			action: "convertRaster",
			handle: e,
			layerIndex: t,
			format: n.format,
			scales: n.scales ?? [1],
			quality: n.quality,
			isolate: n.isolate ?? !1
		}, [], r);
	}
	disposeDocument(e) {
		return this.#i({
			action: "disposeDocument",
			handle: e
		});
	}
	async dispose() {
		this.#r || (this.#r = !0, this.#e.removeEventListener("message", this.#a), this.#e.removeEventListener("error", this.#o), this.#e.removeEventListener("messageerror", this.#s), this.#e.terminate(), this.#c(new r("engine")));
	}
	#i(e, t = [], n) {
		this.#l();
		let r = this.#n++;
		return new Promise((i, a) => {
			this.#t.set(r, {
				resolve: i,
				reject: a,
				onProgress: n
			}), this.#e.postMessage({
				...e,
				id: r
			}, t);
		});
	}
	#a = (t) => {
		let n = t.data, r = this.#t.get(n.id);
		if (r) {
			if (n.type === "progress") {
				r.onProgress?.(n.progress);
				return;
			}
			if (this.#t.delete(n.id), n.type === "error") {
				let t = new e(n.error.message);
				t.name = n.error.name, t.stack = n.error.stack || t.stack, r.reject(t);
				return;
			}
			r.resolve(n.value);
		}
	};
	#o = (t) => {
		let n = t.message || "The Desvue worker crashed";
		this.#c(new e(n));
	};
	#s = () => {
		this.#c(new e("The Desvue worker returned an unreadable message"));
	};
	#c(e) {
		this.#t.forEach(({ reject: t }) => t(e)), this.#t.clear();
	}
	#l() {
		if (this.#r) throw new r("engine");
	}
}, s = class {
	#e;
	#t;
	#n = !1;
	constructor(e, t, n) {
		this.#e = e, this.#t = t, this.metadata = n;
	}
	inspect(e) {
		return this.#r(), this.#e.inspect(this.#t, e);
	}
	setLayerVisibility(e, t) {
		return this.#r(), this.#e.setLayerVisibility(this.#t, e, t);
	}
	renderDocument(e, t) {
		return this.#r(), this.#e.renderDocument(this.#t, e, t);
	}
	convert(e, t, n) {
		return this.#r(), this.#e.convert(this.#t, e, t, n);
	}
	async dispose() {
		this.#n || (this.#n = !0, await this.#e.disposeDocument(this.#t));
	}
	#r() {
		if (this.#n) throw new r("PSD");
	}
};
function c(e) {
	if (!w(e)) return null;
	let t = u(e.runs), n = d(e.paragraphRuns ?? e.paragraph_runs), r = l(w(e.style) ? e.style : w(e.typography) ? e.typography : {}, t[0]?.style ?? {}, e), i = f(e.paragraphStyle, e.paragraph, n[0], e), a = p(e.transform);
	return Object.freeze({
		...e,
		...r.fontFamily ? { fontFamily: r.fontFamily } : {},
		...r.fontSize === void 0 ? {} : { fontSize: r.fontSize },
		...r.fontWeight === void 0 ? {} : { fontWeight: r.fontWeight },
		...r.fontStyle ? { fontStyle: r.fontStyle } : {},
		...r.leading === void 0 ? {} : { leading: r.leading },
		...r.tracking === void 0 ? {} : { tracking: r.tracking },
		...r.color ? { color: r.color } : {},
		...i.align ? { alignment: i.align } : {},
		...t.length ? { runs: Object.freeze(t) } : {},
		...n.length ? { paragraphRuns: Object.freeze(n) } : {},
		...a ? { transform: Object.freeze(a) } : {},
		style: Object.freeze(r),
		paragraphStyle: Object.freeze(i)
	});
}
function l(...e) {
	let t = g(...e.flatMap((e) => [
		e.fontFamily,
		e.family,
		e.fontName,
		e.fontPostScriptName,
		e.postScriptName,
		e.typeface,
		typeof e.font == "string" ? e.font : void 0,
		e.font?.family,
		e.font?.name,
		e.font?.postScriptName
	])), n = v(...e.flatMap((e) => [
		e.fontSize,
		e.textSize,
		e.size
	])), r = b(...e.flatMap((e) => [e.bold, e.fauxBold])), i = b(...e.flatMap((e) => [e.italic, e.fauxItalic])), a = g(...e.map((e) => e.fontStyle)), o = v(...e.flatMap((e) => [e.fontWeight, e.weight])), s = y(...e.flatMap((e) => [e.lineHeight, e.leading])), c = v(...e.flatMap((e) => [e.letterSpacing, e.tracking])), l = g(...e.flatMap((e) => [
		e.color,
		e.fill,
		e.fillColor
	])) ?? _(...e.flatMap((e) => [
		e.color,
		e.fill,
		e.fillColor
	])), u = v(...e.map((e) => e.horizontalScale)), d = v(...e.map((e) => e.verticalScale)), f = g(...e.flatMap((e) => [e.styleName, e.font?.style]));
	return {
		...t ? { fontFamily: t } : {},
		...n === void 0 ? {} : { fontSize: n },
		...o === void 0 ? r ? { fontWeight: 700 } : {} : { fontWeight: o },
		...a ? { fontStyle: a } : i ? { fontStyle: "italic" } : {},
		...r === void 0 ? {} : { bold: r },
		...i === void 0 ? {} : { italic: i },
		...s === void 0 ? {} : { leading: s },
		...c === void 0 ? {} : { tracking: c },
		...l ? { color: l } : {},
		...u === void 0 ? {} : { horizontalScale: u },
		...d === void 0 ? {} : { verticalScale: d },
		...f ? { styleName: f } : {}
	};
}
function u(e) {
	if (Array.isArray(e)) return e.filter(w).map((e) => Object.freeze({
		...e,
		style: Object.freeze(l(e.style ?? e))
	}));
	if (typeof e != "string") return [];
	let [t, ...n] = e.split(/\r?\n/), r = m(t);
	return r === null ? [] : n.flatMap((e) => {
		if (!e) return [];
		let t = e.split("	");
		if (t.length < 7) return [];
		let n = x(t[0]), i = x(t[1]), a = x(t[2]);
		if (n === void 0 || i === void 0 || a === void 0) return [];
		let o = C(t[3]), s = C(t[4]), c = r >= 2 ? S(t[7]) : void 0, u = r >= 3 ? x(t[8]) : void 0, d = r >= 3 ? x(t[9]) : void 0, f = r >= 3 ? x(t[10]) : void 0, p = r >= 4 ? C(t[11]) : void 0, m = r >= 5 ? h(t[12]) : void 0, g = r >= 6 ? C(t[13]) : void 0, _ = l({
			fontFamily: h(t[6]),
			fontSize: a,
			bold: o,
			italic: s,
			fauxBold: p,
			fauxItalic: g,
			leading: c,
			tracking: u,
			horizontalScale: d,
			verticalScale: f,
			styleName: m,
			color: t[5]
		});
		return [Object.freeze({
			start: n,
			length: i,
			style: Object.freeze(_)
		})];
	});
}
function d(e) {
	if (Array.isArray(e)) return e.filter(w).map((e) => Object.freeze(f(e)));
	if (typeof e != "string") return [];
	let [t, ...n] = e.split(/\r?\n/), r = m(t);
	return r === null ? [] : n.flatMap((e) => {
		if (!e) return [];
		let t = e.split("	");
		if (t.length < 3) return [];
		let n = x(t[0]), i = x(t[1]);
		return n === void 0 || i === void 0 ? [] : [Object.freeze({
			start: n,
			length: i,
			align: t[2],
			...r >= 2 ? {
				firstLineIndent: x(t[3]) ?? 0,
				startIndent: x(t[4]) ?? 0,
				endIndent: x(t[5]) ?? 0,
				spaceBefore: x(t[6]) ?? 0,
				spaceAfter: x(t[7]) ?? 0
			} : {},
			...r >= 3 ? { autoLeading: x(t[8]) ?? 1.2 } : {}
		})];
	});
}
function f(...e) {
	let t = e.find(w) ?? {}, n = g(...e.flatMap((e) => [
		e?.textAlign,
		e?.alignment,
		e?.align
	]));
	return {
		...t,
		...n ? { align: n } : {}
	};
}
function p(e) {
	let t = Array.isArray(e) ? e : typeof e == "string" ? e.trim().split(/[\s,]+/) : w(e) ? [
		e.a,
		e.b,
		e.c,
		e.d,
		e.tx ?? e.e,
		e.ty ?? e.f
	] : [];
	if (t.length !== 6) return null;
	let n = t.map(x);
	return n.every((e) => e !== void 0) ? n : null;
}
function m(e) {
	let t = /^v(\d+)$/.exec(String(e).trim());
	return t ? Number(t[1]) : null;
}
function h(e) {
	if (typeof e == "string" && e) try {
		return decodeURIComponent(e);
	} catch {
		return e;
	}
}
function g(...e) {
	return e.find((e) => typeof e == "string" && e.trim())?.trim();
}
function _(...e) {
	return e.find(w);
}
function v(...e) {
	return e.map(x).find((e) => e !== void 0);
}
function y(...e) {
	return e.map(S).find((e) => e !== void 0);
}
function b(...e) {
	return e.map(C).find((e) => e !== void 0);
}
function x(e) {
	if (typeof e == "number") return Number.isFinite(e) ? e : void 0;
	if (typeof e != "string" || !e.trim()) return;
	let t = Number(e);
	return Number.isFinite(t) ? t : void 0;
}
function S(e) {
	return e === "auto" || e === null ? e : x(e);
}
function C(e) {
	if (typeof e == "boolean") return e;
	if (e === "true" || e === "1") return !0;
	if (e === "false" || e === "0") return !1;
}
function w(e) {
	return !!e && typeof e == "object" && !Array.isArray(e);
}
var T = /* @__PURE__ */ new WeakMap(), E = /* @__PURE__ */ new WeakMap();
async function ee() {
	let e = await o.create(), t = Object.freeze({});
	return T.set(t, {
		runtime: e,
		documents: /* @__PURE__ */ new Set(),
		disposed: !1
	}), t;
}
async function te(e, t, { onProgress: n } = {}) {
	let r = ce(e), i = le(t), a = await r.runtime.parse(i, n), o = k(a.metadata), s = Object.freeze({
		width: a.metadata.width,
		height: a.metadata.height,
		layers: o.roots
	}), c = {
		engine: r,
		runtime: a,
		layersById: o.byId,
		layerIndexes: o.indexes,
		disposed: !1
	};
	return E.set(s, c), r.documents.add(c), s;
}
function ne(e, t) {
	let r = D(e).layersById.get(t);
	if (!r) throw new n(t);
	return r;
}
async function re(e, t) {
	let n = D(e), r = O(n, t);
	return ge(t, await n.runtime.inspect(r));
}
async function ie(t, n, r) {
	let i = D(t), a = O(i, n);
	if (!r || typeof r != "object" || Array.isArray(r)) throw new e("Layer changes must be an object");
	let o = Object.keys(r);
	if (o.length !== 1 || o[0] !== "visible") throw new e("Layer changes currently support only \"visible\"");
	if (typeof r.visible != "boolean") throw new e("Layer visibility must be a boolean");
	return de(await i.runtime.setLayerVisibility(a, r.visible));
}
async function ae(e, t = {}) {
	let n = D(e), r = ue(e, t);
	return pe(await n.runtime.renderDocument(r.region, r.onProgress), r.bounds);
}
async function oe(e, t, n) {
	let r = D(e), i = O(r, t), a = A(n);
	return (await r.runtime.convert(i, a, a.onProgress)).map((e) => me(t.name, e));
}
async function se(t) {
	let n = E.get(t);
	if (n) {
		if (n.disposed) return;
		n.disposed = !0, n.engine.documents.delete(n), await n.runtime.dispose();
		return;
	}
	let r = T.get(t);
	if (!r) throw new e("The value is not a Desvue resource");
	r.disposed || (r.disposed = !0, r.documents.forEach((e) => e.disposed = !0), r.documents.clear(), await r.runtime.dispose());
}
function ce(t) {
	let n = T.get(t);
	if (!n) throw new e("The value is not a Desvue engine");
	if (n.disposed) throw new r("engine");
	return n;
}
function D(t) {
	let n = E.get(t);
	if (!n) throw new e("The value is not a parsed Desvue document");
	if (n.disposed || n.engine.disposed) throw new r("PSD");
	return n;
}
function O(t, n) {
	let r = t.layerIndexes.get(n);
	if (r === void 0) throw new e("The layer does not belong to this PSD document");
	return r;
}
function le(e) {
	if (e instanceof ArrayBuffer) {
		if (e.byteLength === 0) throw new t("PSD input is empty");
		return new Uint8Array(e.slice(0));
	}
	if (e instanceof Uint8Array) {
		if (e.byteLength === 0) throw new t("PSD input is empty");
		return e.slice();
	}
	throw new t("PSD input must be an ArrayBuffer or Uint8Array");
}
function k(t) {
	let n = t.layers.map((e) => ({
		source: e,
		children: []
	})), r = [];
	n.forEach((t) => {
		let i = t.source.parentIndex;
		if (i === null) {
			r.push(t);
			return;
		}
		let a = n[i];
		if (!a) throw new e("The PSD contains an invalid layer hierarchy");
		a.children.push(t);
	});
	let i = /* @__PURE__ */ new Map(), a = /* @__PURE__ */ new WeakMap();
	function o(t) {
		let r = t.source, s = n[r.parentIndex], c = Object.freeze({
			id: r.id,
			sourceId: r.sourceId,
			parentId: s?.source.id ?? null,
			name: r.name,
			type: r.type,
			visible: r.visible,
			clipped: r.clipped,
			opacity: r.opacity,
			fillOpacity: r.fillOpacity,
			blendMode: r.blendMode,
			bounds: j(r.bounds),
			renderBounds: j(r.renderBounds),
			children: Object.freeze(t.children.map(o))
		});
		if (i.has(c.id)) throw new e(`Duplicate PSD layer ID: ${c.id}`);
		return i.set(c.id, c), a.set(c, r.index), c;
	}
	return {
		roots: Object.freeze(r.map(o)),
		byId: i,
		indexes: a
	};
}
function A(e) {
	if (!e || ![
		"png",
		"jpeg",
		"webp",
		"svg"
	].includes(e.format)) throw new i("Conversion format must be \"png\", \"jpeg\", \"webp\", or \"svg\"");
	if (e.isolate !== void 0 && typeof e.isolate != "boolean") throw new i("Convert isolate must be a boolean");
	let t = e.isolate ?? !1;
	if (e.format === "svg") return Object.freeze({
		format: "svg",
		isolate: t,
		onProgress: e.onProgress
	});
	let n = e.scales ?? [1], r = e.format === "webp" ? "WebP" : e.format.toUpperCase();
	if (!Array.isArray(n) || n.length === 0) throw new i(`${r} scales cannot be empty`);
	let a = [...new Set(n)];
	if (a.some((e) => !Number.isInteger(e) || e < 1 || e > 16)) throw new i(`Every ${r} scale must be an integer from 1 through 16`);
	let o = e.quality ?? 100;
	if (e.format !== "png" && (!Number.isInteger(o) || o < 1 || o > 100)) throw new i(`${r} quality must be an integer from 1 through 100`);
	return Object.freeze({
		format: e.format,
		scales: Object.freeze(a),
		...e.format === "png" ? {} : { quality: o },
		isolate: t,
		onProgress: e.onProgress
	});
}
function ue(e, t) {
	if (!t || typeof t != "object" || Array.isArray(t)) throw new a("Render options must be an object");
	if (t.onProgress !== void 0 && typeof t.onProgress != "function") throw new a("Render onProgress must be a function");
	if (t.bounds === void 0) return Object.freeze({
		bounds: j({
			left: 0,
			top: 0,
			right: e.width,
			bottom: e.height
		}),
		region: null,
		onProgress: t.onProgress
	});
	let n = t.bounds;
	if (!n || typeof n != "object" || Array.isArray(n)) throw new a("Render bounds must be an object");
	if (![
		n.left,
		n.top,
		n.right,
		n.bottom
	].every(Number.isSafeInteger)) throw new a("Render bounds must contain integer left, top, right, and bottom values");
	if (n.left < 0 || n.top < 0 || n.right > e.width || n.bottom > e.height || n.right <= n.left || n.bottom <= n.top) throw new a("Render bounds must be a non-empty rectangle inside the PSD document");
	let r = j(n);
	return Object.freeze({
		bounds: r,
		region: r,
		onProgress: t.onProgress
	});
}
function de(t) {
	if (!t || typeof t != "object" || typeof t.changed != "boolean" || !Number.isSafeInteger(t.revision) || t.revision < 0 || typeof t.fullRender != "boolean") throw new e("The engine returned invalid visibility metadata");
	if (t.dirtyBounds !== null && (!fe(t.dirtyBounds) || t.dirtyBounds.right <= t.dirtyBounds.left || t.dirtyBounds.bottom <= t.dirtyBounds.top)) throw new e("The engine returned invalid dirty bounds");
	let n = t.dirtyBounds ? j(t.dirtyBounds) : null;
	return Object.freeze({
		changed: t.changed,
		revision: t.revision,
		dirtyBounds: n,
		fullRender: t.fullRender
	});
}
function fe(e) {
	return e && typeof e == "object" && !Array.isArray(e) && [
		e.left,
		e.top,
		e.right,
		e.bottom
	].every(Number.isSafeInteger);
}
function pe(t, n) {
	let r = n.right - n.left, i = n.bottom - n.top, a = r * 4;
	if (!t || typeof t != "object" || t.format !== "rgba8" || t.width !== r || t.height !== i || !Number.isSafeInteger(t.stride) || t.stride < a || !Number.isSafeInteger(t.revision) || t.revision < 0 || !(t.data instanceof Uint8Array) || t.data.byteLength !== t.stride * i) throw new e("The engine returned an invalid RGBA frame");
	return Object.freeze({
		format: "rgba8",
		bounds: n,
		width: r,
		height: i,
		stride: t.stride,
		revision: t.revision,
		data: t.data
	});
}
function me(e, t) {
	let n = he(e);
	return t.format === "png" ? Object.freeze({
		name: `${n}${t.scale === 1 ? "" : `@${t.scale}x`}.png`,
		format: "png",
		mimeType: "image/png",
		width: t.width,
		height: t.height,
		scale: t.scale,
		bounds: j(t.bounds),
		data: t.data
	}) : t.format === "jpeg" ? Object.freeze({
		name: `${n}${t.scale === 1 ? "" : `@${t.scale}x`}.jpg`,
		format: "jpeg",
		mimeType: "image/jpeg",
		width: t.width,
		height: t.height,
		scale: t.scale,
		quality: t.quality,
		background: t.background,
		bounds: j(t.bounds),
		data: t.data
	}) : t.format === "webp" ? Object.freeze({
		name: `${n}${t.scale === 1 ? "" : `@${t.scale}x`}.webp`,
		format: "webp",
		mimeType: "image/webp",
		width: t.width,
		height: t.height,
		scale: t.scale,
		quality: t.quality,
		bounds: j(t.bounds),
		data: t.data
	}) : Object.freeze({
		name: `${n}.svg`,
		format: "svg",
		mimeType: "image/svg+xml",
		width: t.width,
		height: t.height,
		fidelity: t.fidelity,
		data: t.data
	});
}
function he(e) {
	return e.trim().replace(/[\\/:*?"<>|%]/g, "-").replace(/[. ]+$/g, "") || "Layer";
}
function ge(e, t) {
	return Object.freeze({
		...t,
		layer: e,
		geometry: Object.freeze({
			...t.geometry,
			bounds: j(t.geometry.bounds),
			renderBounds: j(t.geometry.renderBounds)
		}),
		text: c(t.text),
		effects: Object.freeze(t.effects.map((e) => Object.freeze({ ...e }))),
		vector: t.vector ? Object.freeze({ ...t.vector }) : null,
		dependencies: Object.freeze([...t.dependencies])
	});
}
function j(e) {
	return Object.freeze({
		left: e.left,
		top: e.top,
		right: e.right,
		bottom: e.bottom
	});
}
var _e = /* @__PURE__ */ new Set([
	"normal",
	"multiply",
	"screen",
	"overlay",
	"darken",
	"lighten",
	"color-dodge",
	"color-burn",
	"hard-light",
	"soft-light",
	"difference",
	"exclusion",
	"hue",
	"saturation",
	"color",
	"luminosity"
]), M = Object.freeze({
	passThrough: "normal",
	passthrough: "normal",
	linearDodge: "plus-lighter",
	linearDodgeAdd: "plus-lighter",
	darkerColor: "darken",
	lighterColor: "lighten"
}), N = Object.freeze([
	"font-family",
	"font-size",
	"font-weight",
	"font-style",
	"line-height",
	"letter-spacing",
	"text-align",
	"color"
]), P = new Set(N);
function F(t, n = {}) {
	if (!t || typeof t != "object" || Array.isArray(t)) throw new e("CSS generation requires a layer inspection object");
	if (!n || typeof n != "object" || Array.isArray(n)) throw new e("CSS generation options must be an object");
	let r = [], i = /* @__PURE__ */ new Map(), a = t.geometry ?? {}, o = a.bounds ?? t.layer?.bounds;
	if (n.position !== void 0 && n.position !== !1 && (typeof n.position != "string" || n.position.trim() === "")) throw new e("CSS position must be a non-empty string or false");
	n.position !== !1 && q(i, "position", n.position ?? "absolute"), ze(o) ? (n.position !== !1 && (q(i, "left", $(o.left)), q(i, "top", $(o.top))), q(i, "width", $(o.right - o.left)), q(i, "height", $(o.bottom - o.top))) : K(r, "missing-bounds", "Layer bounds are unavailable; position and dimensions were omitted.", "geometry.bounds");
	let s = J(a.opacity, t.opacity, t.layer?.opacity);
	s !== void 0 && G(s) !== 1 && q(i, "opacity", Q(G(s))), De(i, r, J(a.blendMode, t.blendMode, t.layer?.blendMode));
	let l = c(t.text), u = !!l, d = G(J(a.fillOpacity, t.fillOpacity, t.layer?.fillOpacity, 1)), f = [], p = [], m = [];
	l && I(i, r, l, d), t.vector ? Te(i, f, r, t.vector, d) : !t.text && d !== 1 && K(r, "fill-opacity", "Pixel-layer fill opacity cannot be separated from its layer effects in one CSS rule.", "geometry.fillOpacity");
	for (let e of t.effects ?? []) e && e.enabled !== !1 && Ee({
		declarations: i,
		backgroundImages: f,
		boxShadows: p,
		textShadows: m,
		warnings: r,
		effect: e,
		isText: u
	});
	f.length > 0 && q(i, "background-image", f.join(", ")), p.length > 0 && q(i, "box-shadow", p.join(", ")), m.length > 0 && q(i, "text-shadow", m.join(", ")), Oe(i, t), ke(r, t);
	let h = Fe(n.selector, t.layer?.name), g = ve(h, l, d, r), _ = Object.freeze(Object.fromEntries(i)), v = Object.freeze(r.map((e) => Object.freeze(e))), y = h ? Ce(h, i, g.rules) : we(i, g);
	return Object.freeze({
		selector: h,
		declarations: _,
		css: y,
		warnings: v,
		textRuns: g.runs
	});
}
function I(e, t, n, r) {
	let i = n.style ?? n.typography ?? n.runs?.[0]?.style ?? n.runs?.[0] ?? n, a = n.paragraphStyle ?? n.paragraph ?? {}, o = J(i.fontFamily, i.family, i.font?.family, i.font), s = J(i.fontSize, i.size), c = J(i.fontWeight, i.weight), l = J(i.fontStyle, i.style), u = J(i.lineHeight, i.leading, a.lineHeight, a.leading), d = J(i.letterSpacing, i.tracking), f = J(i.textAlign, i.alignment, i.align, a.textAlign, a.alignment, a.align), p = H(J(i.color, i.fill, n.color), r);
	o && q(e, "font-family", Ie(o)), Y(s) && q(e, "font-size", $(s)), c !== void 0 && q(e, "font-weight", String(c)), (i.bold === !0 || i.fauxBold === !0) && q(e, "font-weight", "700"), l && q(e, "font-style", String(l).toLowerCase()), (i.italic === !0 || i.fauxItalic === !0) && q(e, "font-style", "italic"), u === "auto" || u === null ? q(e, "line-height", "normal") : Y(u) && q(e, "line-height", $(u)), Y(d) && d !== 0 && q(e, "letter-spacing", i.letterSpacing === void 0 ? `${Q(d / 1e3)}em` : $(d));
	let m = f ? Le(f) : "";
	m && m !== "start" && q(e, "text-align", m), p && q(e, "color", p);
	let h = J(n.transform, i.transform);
	h && !Re(h) && K(t, "text-transform", "Photoshop text transforms are not emitted because they can change CSS layout.", "text.transform");
}
function ve(e, t, n, r) {
	if (!Array.isArray(t?.runs) || t.runs.length < 2) return {
		rules: [],
		runs: Object.freeze([]),
		common: null
	};
	let i = t.runs.map((r, i) => {
		let a = /* @__PURE__ */ new Map();
		I(a, [], { style: r.style ?? r }, n);
		let o = e ? `${e} .text-run-${i + 1}` : null, s = Number.isSafeInteger(r.start) ? r.start : null, c = Number.isSafeInteger(r.length) ? r.length : null;
		return {
			selector: o,
			declarations: a,
			signature: JSON.stringify([...a]),
			descriptor: Object.freeze({
				index: i + 1,
				selector: o,
				start: s,
				length: c,
				content: s !== null && c !== null ? String(t.content ?? "").slice(s, s + c) : "",
				declarations: Object.freeze(Object.fromEntries(a))
			})
		};
	});
	if (!e) return ye(i, r);
	let a = /* @__PURE__ */ new Map();
	for (let e of i) {
		let t = a.get(e.signature) ?? {
			entries: [],
			declarations: e.declarations
		};
		t.entries.push(e), a.set(e.signature, t);
	}
	return a.size < 2 ? {
		rules: [],
		runs: Object.freeze(i.map(({ descriptor: e }) => e)),
		common: null
	} : (K(r, "mixed-text-styles", `The text layer uses ${a.size} distinct styles. Separate .text-run-* selectors were generated for nested spans.`, "text.runs"), {
		rules: [...a.values()].map(({ entries: e, declarations: t }) => {
			let n = e.map(({ selector: e }) => e), r = [...t].map(([e, t]) => `  ${e}: ${t};`);
			return `${n.join(",\n")} {\n${r.join("\n")}\n}`;
		}),
		runs: Object.freeze(i.map(({ descriptor: e }) => e)),
		common: null
	});
}
function ye(e, t) {
	let n = e.filter(({ descriptor: e }) => /\S/u.test(e.content)), r = be(n.length > 0 ? n : e), i = /* @__PURE__ */ new Map();
	for (let e of r) {
		let t = JSON.stringify(L(e.declarations)), n = i.get(t) ?? {
			entries: [],
			declarations: e.declarations
		};
		n.entries.push(e), i.set(t, n);
	}
	i.size > 1 && K(t, "mixed-text-styles", `The text layer uses ${i.size} visible styles. Common properties and independent style blocks are listed with text comments.`, "text.runs");
	let a = xe(r);
	return {
		rules: i.size > 1 ? [...i.values()].map(({ entries: e, declarations: t }) => {
			let n = L(Se(t, a)).map(([e, t]) => `${e}: ${t};`);
			return `/* Text style: "${R(e)}" */\n${n.join("\n")}`;
		}) : [],
		runs: Object.freeze(e.map(({ descriptor: e }) => e)),
		common: a
	};
}
function be(e) {
	let t = e.some(({ declarations: e }) => e.has("font-weight")), n = e.some(({ declarations: e }) => e.has("font-style"));
	return e.map((e) => {
		let r = new Map(e.declarations);
		return t && !r.has("font-weight") && r.set("font-weight", "400"), n && !r.has("font-style") && r.set("font-style", "normal"), {
			...e,
			declarations: r
		};
	});
}
function xe(e) {
	let t = new Map(e[0]?.declarations ?? []);
	for (let [n, r] of [...t]) e.some(({ declarations: e }) => e.get(n) !== r) && t.delete(n);
	return new Map(L(t));
}
function Se(e, t) {
	return new Map(L(e).filter(([e, n]) => t.get(e) !== n));
}
function L(e) {
	return [...e].sort(([e], [t]) => N.indexOf(e) - N.indexOf(t));
}
function Ce(e, t, n) {
	return [`${e} {\n${[...t].map(([e, t]) => `  ${e}: ${t};`).join("\n")}\n}`, ...n].join("\n\n");
}
function we(e, t) {
	if (!t.common) return [[...e].map(([e, t]) => `${e}: ${t};`).join("\n"), ...t.rules].join("\n\n");
	let n = new Map([...e].filter(([e]) => !P.has(e))), r = new Map(t.common);
	e.has("text-align") && r.set("text-align", e.get("text-align"));
	let i = [...n].map(([e, t]) => `${e}: ${t};`), a = L(r).map(([e, t]) => `${e}: ${t};`), o = [];
	return i.length > 0 && o.push(`/* Layer properties */\n${i.join("\n")}`), a.length > 0 && o.push(`/* Common text properties */\n${a.join("\n")}`), o.push(...t.rules), o.join("\n\n");
}
function R(e) {
	let t = e.map(({ descriptor: e }) => e.content).map((e) => String(e ?? "").replace(/\s+/g, " ").trim()).find(Boolean), n = `characters ${e[0].descriptor.start ?? "?"}–${e[0].descriptor.start !== null && e[0].descriptor.length !== null ? e[0].descriptor.start + e[0].descriptor.length : "?"}`, r = t || n;
	return (r.length > 48 ? `${r.slice(0, 47).trimEnd()}…` : r).replaceAll("*/", "* /").replaceAll("\"", "\\\"");
}
function Te(e, t, n, r, i) {
	let a = r.fill ?? r.color, o = Ne(a) ?? r.gradient, s = W(a?.type ?? a), c = a?.color ?? r.color ?? (typeof a == "string" && ![
		"none",
		"solid",
		"gradient",
		"pattern"
	].includes(s) ? a : null), l = i === 0 && s !== "none" ? "transparent" : H(c, i);
	if (o) {
		let e = B(o, n, "vector.gradient", i);
		e && t.push(e);
	} else l && q(e, "background-color", l);
	let u = r.stroke;
	if (u && u.enabled !== !1) {
		let t = J(u.width, u.size), r = H(u.color ?? u.fill ?? u, i);
		Y(t) && r && q(e, "border", `${$(t)} ${u.style ?? "solid"} ${r}`);
		let a = String(u.alignment ?? u.position ?? "inside").toLowerCase();
		["inside", "inner"].includes(a) || K(n, "stroke-alignment", `A ${a} Photoshop stroke was approximated with a CSS border.`, "vector.stroke");
	}
}
function Ee(e) {
	let { declarations: t, backgroundImages: n, boxShadows: r, textShadows: i, warnings: a, effect: o, isText: s } = e, c = W(o.type ?? o.kind ?? o.name), l = H(o.color, o.opacity);
	if (o.blendMode && W(o.blendMode) !== "normal" && K(a, "effect-blend-mode", `The ${o.type ?? o.name ?? "layer"} effect blend mode “${o.blendMode}” cannot be isolated in one CSS rule.`, "effects.blendMode"), c === "dropshadow" || c === "innershadow") {
		let e = Ae(o, l, c === "innershadow");
		s && c === "dropshadow" ? i.push(e) : s ? K(a, "inner-text-shadow", "CSS cannot reproduce an inset shadow inside text glyphs.", "effects") : r.push(e);
		return;
	}
	if (c === "outerglow" || c === "innerglow") {
		let e = je(o, l, c === "innerglow");
		s && c === "outerglow" ? i.push(e) : s ? K(a, "inner-text-glow", "CSS cannot reproduce an inner glow inside text glyphs.", "effects") : r.push(e);
		return;
	}
	if (c === "coloroverlay" || c === "solidfill") {
		l && q(t, s ? "color" : "background-color", l);
		return;
	}
	if (c === "gradientoverlay" || c === "gradientfill") {
		let e = B(o.gradient ?? o, a, "effects.gradient", G(J(o.opacity, 1)));
		e && (s ? (n.push(e), q(t, "background-clip", "text"), q(t, "-webkit-background-clip", "text"), q(t, "color", "transparent")) : n.push(e));
		return;
	}
	if (c === "stroke") {
		let e = J(o.size, o.width);
		Y(e) && l && (s ? q(t, "-webkit-text-stroke", `${$(e)} ${l}`) : q(t, "border", `${$(e)} solid ${l}`));
		let n = String(o.position ?? "inside").toLowerCase();
		!s && !["inside", "inner"].includes(n) && K(a, "stroke-alignment", `A ${n} Photoshop stroke was approximated with a CSS border.`, "effects");
		return;
	}
	[
		"bevel",
		"bevelemboss",
		"satin",
		"patternoverlay"
	].includes(c) ? K(a, `unsupported-${c}`, `The Photoshop ${o.type ?? o.name} effect has no direct CSS equivalent.`, "effects") : K(a, "unsupported-effect", `The Photoshop effect “${o.type ?? o.name ?? "unknown"}” was not converted.`, "effects");
}
function De(e, t, n) {
	if (!n) return;
	let r = String(n), i = M[r.replace(/[-_ ]+(.)/g, (e, t) => t.toUpperCase())] ?? r.replace(/[ _]+/g, "-").toLowerCase();
	if (_e.has(i) || i === "plus-lighter") {
		i !== "normal" && q(e, "mix-blend-mode", i);
		return;
	}
	K(t, "unsupported-blend-mode", `The Photoshop blend mode “${r}” has no direct CSS equivalent.`, "geometry.blendMode");
}
function Oe(e, t) {
	let n = t.vector ?? {}, r = n.liveShape ?? t.liveShape ?? {}, i = Pe(J(r.cornerRadii, r.radii, n.cornerRadii, n.radii, n.radius, t.geometry?.cornerRadii, t.geometry?.radius));
	i && q(e, "border-radius", i);
}
function ke(e, t) {
	let n = W(t.layer?.type ?? t.type), r = /* @__PURE__ */ new Set([
		"brightnesscontrast",
		"colorbalance",
		"curves",
		"gradientmap",
		"huesaturation",
		"invert",
		"levels",
		"posterize",
		"selectivecolor",
		"threshold",
		"vibrance"
	]);
	(n.includes("adjustment") || r.has(n)) && K(e, "adjustment-layer", "Adjustment layers affect underlying pixels and cannot be represented by one CSS rule.", "layer.type"), (t.mask || t.masks || t.geometry?.masked) && K(e, "layer-mask", "Layer masks may require clip-path, mask-image, or a raster fallback.", "mask"), (t.layer?.clipped || t.clipped) && K(e, "clipping-mask", "Photoshop clipping masks depend on another layer and are not represented by this standalone rule.", "layer.clipped");
}
function Ae(e, t, n) {
	let r = X(e.distance, 0), i = X(e.angle, 120) * Math.PI / 180, a = -Math.cos(i) * r, o = Math.sin(i) * r, s = X(J(e.blur, e.size), 0), c = z(e, s);
	return `${n ? "inset " : ""}${$(a)} ${$(o)} ${$(s)} ${$(c)} ${t ?? "rgba(0, 0, 0, 0.5)"}`;
}
function je(e, t, n) {
	let r = X(J(e.blur, e.size), 0), i = z(e, r);
	return `${n ? "inset " : ""}0 0 ${$(r)} ${$(i)} ${t ?? "rgba(255, 255, 255, 0.5)"}`;
}
function z(e, t) {
	let n = J(e.spread, e.choke);
	return Y(n) ? Math.abs(n) <= 1 ? t * n : Math.abs(n) <= 100 ? t * n / 100 : n : 0;
}
function B(e, t, n, r = 1) {
	if (typeof e == "string") return e.includes("gradient(") ? e : null;
	if (!e || typeof e != "object") return null;
	let i = J(e.gradientType, e.type, "linear"), a = W(i), o = Me(e, r);
	return o.length === 0 ? null : a.includes("radial") ? `radial-gradient(${o.join(", ")})` : a.includes("linear") ? `linear-gradient(${Q(((90 - X(e.angle, 0)) % 360 + 360) % 360)}deg, ${o.join(", ")})` : (K(t, "approximate-gradient", `The Photoshop ${i} gradient was approximated with a linear CSS gradient.`, n), `linear-gradient(${o.join(", ")})`);
}
function Me(e, t) {
	let n = e.stops ?? e.colorStops ?? e.colors;
	return Array.isArray(n) ? n.flatMap((e, n) => {
		let r = H(e?.color ?? e, t);
		if (!r) return [];
		let i = J(e?.position, e?.location, e?.offset);
		return Y(i) ? [`${r} ${Q(Math.abs(i) <= 1 ? i * 100 : i > 100 ? i / 40.96 : i)}%`] : [r];
	}) : [];
}
function Ne(e) {
	return !e || typeof e != "object" ? null : e.gradient ? e.gradient : W(e.type).includes("gradient") ? e : null;
}
function V(e) {
	if (typeof e == "string") return e;
	if (!e || typeof e != "object") return null;
	if (e.color && e.color !== e) return V(e.color);
	let t = J(e.red, e.r), n = J(e.green, e.g), r = J(e.blue, e.b);
	if (![
		t,
		n,
		r
	].every(Y)) return null;
	let i = Math.max(Math.abs(t), Math.abs(n), Math.abs(r)) <= 1 ? 255 : 1, a = [
		t,
		n,
		r
	].map((e) => Math.round(Z(e * i, 0, 255))), o = G(J(e.alpha, e.a, 1));
	return o < 1 ? `rgba(${a.join(", ")}, ${Q(o)})` : `#${a.map((e) => e.toString(16).padStart(2, "0")).join("")}`;
}
function H(e, t) {
	let n = V(e);
	if (!n || t === void 0 || G(t) === 1) return n;
	let r = G(t);
	if (r === 0 || n === "transparent") return "transparent";
	let i = /^#([0-9a-f]{6})$/i.exec(n);
	if (i) {
		let e = Number.parseInt(i[1], 16);
		return `rgba(${e >> 16}, ${e >> 8 & 255}, ${e & 255}, ${Q(r)})`;
	}
	let a = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([\d.]+)\s*\)$/i.exec(n);
	return a ? `rgba(${a[1]}, ${a[2]}, ${a[3]}, ${Q(Number(a[4]) * r)})` : n;
}
function Pe(e) {
	if (Y(e)) return $(e);
	if (Array.isArray(e) && [
		1,
		2,
		3,
		4
	].includes(e.length) && e.every(Y)) return U(e).map($).join(" ");
	if (!e || typeof e != "object") return null;
	let t = [
		J(e.topLeft, e.topLeftRadius, e.rectangleCornerA),
		J(e.topRight, e.topRightRadius, e.rectangleCornerB),
		J(e.bottomRight, e.bottomRightRadius, e.rectangleCornerC),
		J(e.bottomLeft, e.bottomLeftRadius, e.rectangleCornerD)
	];
	return t.every(Y) ? U(t).map($).join(" ") : null;
}
function U(e) {
	return e.length === 4 ? e.every((t) => t === e[0]) ? [e[0]] : e[0] === e[2] && e[1] === e[3] ? e.slice(0, 2) : e[1] === e[3] ? e.slice(0, 3) : e : e;
}
function Fe(t, n) {
	if (t === !1) return null;
	if (t !== void 0) {
		if (typeof t != "string" || t.trim() === "") throw new e("CSS selector must be a non-empty string");
		return t.trim();
	}
	return `.${String(n ?? "layer").normalize("NFKD").replace(/[^\p{Letter}\p{Number}_-]+/gu, "-").replace(/^-+|-+$/g, "").toLowerCase() || "layer"}`;
}
function Ie(e) {
	return (Array.isArray(e) ? e : [e]).map((e) => {
		let t = String(e);
		return /^[a-z-]+$/i.test(t) ? t : `"${t.replaceAll("\"", "\\\"")}"`;
	}).join(", ");
}
function Le(e) {
	let t = String(e).toLowerCase();
	return t === "left" ? "start" : t === "right" ? "end" : t === "justifyall" ? "justify" : t;
}
function W(e) {
	return String(e ?? "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}
function G(e) {
	return Y(e) ? Z(e > 1 ? e / 255 : e, 0, 1) : 1;
}
function Re(e) {
	let t = Array.isArray(e) ? e : [
		e.a,
		e.b,
		e.c,
		e.d,
		e.tx ?? e.e,
		e.ty ?? e.f
	];
	return t.length === 6 && t.slice(0, 4).every((e, t) => Math.abs(e - [
		1,
		0,
		0,
		1
	][t]) < 1e-8);
}
function ze(e) {
	return e && [
		e.left,
		e.top,
		e.right,
		e.bottom
	].every(Y) && e.right >= e.left && e.bottom >= e.top;
}
function K(e, t, n, r) {
	e.push({
		code: t,
		message: n,
		path: r
	});
}
function q(e, t, n) {
	n != null && e.set(t, n);
}
function J(...e) {
	return e.find((e) => e !== void 0);
}
function Y(e) {
	return typeof e == "number" && Number.isFinite(e);
}
function X(e, t) {
	return Y(e) ? e : t;
}
function Z(e, t, n) {
	return Math.min(n, Math.max(t, e));
}
function Q(e) {
	return String(Number(e.toFixed(4)));
}
function $(e) {
	return `${Q(e)}px`;
}
export { r as DisposedResourceError, i as InvalidConvertOptionsError, t as InvalidPsdInputError, a as InvalidRenderOptionsError, n as LayerNotFoundError, e as DocumentError, oe as convert, ee as createEngine, se as dispose, F as generateCss, ne as getLayer, re as inspect, te as parse, ae as render, ie as setLayer };
