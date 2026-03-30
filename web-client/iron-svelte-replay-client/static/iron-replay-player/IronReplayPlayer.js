var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var _t2, _e;
typeof window < "u" && (window.__svelte || (window.__svelte = { v: /* @__PURE__ */ new Set() })).v.add("5");
const Bn = 1, qn = 2, Hn = 16, Vn = 2, Jt = "[", bt = "[!", wt = "]", Fe = {}, V = Symbol(), Bt = false, te = 2, Qt = 4, xt = 8, $t = 16, fe = 32, Te = 64, ze = 128, J = 256, Ye = 512, j = 1024, ce = 2048, Se = 4096, le = 8192, nt = 16384, jn = 32768, kt = 65536, zn = 1 << 19, en = 1 << 20, we = Symbol("$state"), Yn = Symbol("legacy props"), Wn = Symbol("");
var Et = Array.isArray, Kn = Array.prototype.indexOf, Tt = Array.from, We = Object.keys, Ke = Object.defineProperty, xe = Object.getOwnPropertyDescriptor, tn = Object.getOwnPropertyDescriptors, Xn = Object.prototype, Gn = Array.prototype, St = Object.getPrototypeOf;
function nn(e) {
  for (var t = 0; t < e.length; t++)
    e[t]();
}
let Ce = [], dt = [];
function rn() {
  var e = Ce;
  Ce = [], nn(e);
}
function Zn() {
  var e = dt;
  dt = [], nn(e);
}
function sn(e) {
  Ce.length === 0 && queueMicrotask(rn), Ce.push(e);
}
function qt() {
  Ce.length > 0 && rn(), dt.length > 0 && Zn();
}
function an(e) {
  return e === this.v;
}
function ln(e, t) {
  return e != e ? t == t : e !== t || e !== null && typeof e == "object" || typeof e == "function";
}
function on(e) {
  return !ln(e, this.v);
}
function Jn(e) {
  throw new Error("https://svelte.dev/e/effect_in_teardown");
}
function Qn() {
  throw new Error("https://svelte.dev/e/effect_in_unowned_derived");
}
function er(e) {
  throw new Error("https://svelte.dev/e/effect_orphan");
}
function tr() {
  throw new Error("https://svelte.dev/e/effect_update_depth_exceeded");
}
function nr() {
  throw new Error("https://svelte.dev/e/hydration_failed");
}
function rr() {
  throw new Error("https://svelte.dev/e/state_descriptors_fixed");
}
function ir() {
  throw new Error("https://svelte.dev/e/state_prototype_fixed");
}
function sr() {
  throw new Error("https://svelte.dev/e/state_unsafe_local_read");
}
function ar() {
  throw new Error("https://svelte.dev/e/state_unsafe_mutation");
}
let lr = false;
function G(e, t) {
  var n = {
    f: 0,
    // TODO ideally we could skip this altogether, but it causes type errors
    v: e,
    reactions: null,
    equals: an,
    rv: 0,
    wv: 0
  };
  return n;
}
function K(e) {
  return /* @__PURE__ */ or(G(e));
}
// @__NO_SIDE_EFFECTS__
function Pt(e, t = false) {
  const n = G(e);
  return t || (n.equals = on), n;
}
// @__NO_SIDE_EFFECTS__
function or(e) {
  return T !== null && !ee && (T.f & te) !== 0 && (re === null ? hr([e]) : re.push(e)), e;
}
function _(e, t) {
  return T !== null && !ee && Sn() && (T.f & (te | $t)) !== 0 && // If the source was created locally within the current derived, then
  // we allow the mutation.
  (re === null || !re.includes(e)) && ar(), un(e, t);
}
function un(e, t) {
  return e.equals(t) || (e.v, e.v = t, e.wv = mn(), fn(e, ce), S !== null && (S.f & j) !== 0 && (S.f & (fe | Te)) === 0 && (se === null ? vr([e]) : se.push(e))), t;
}
function fn(e, t) {
  var n = e.reactions;
  if (n !== null)
    for (var r = n.length, i = 0; i < r; i++) {
      var s = n[i], a = s.f;
      (a & ce) === 0 && (oe(s, t), (a & (j | J)) !== 0 && ((a & te) !== 0 ? fn(
        /** @type {Derived} */
        s,
        Se
      ) : st(
        /** @type {Effect} */
        s
      )));
    }
}
// @__NO_SIDE_EFFECTS__
function ne(e) {
  var t = te | ce, n = T !== null && (T.f & te) !== 0 ? (
    /** @type {Derived} */
    T
  ) : null;
  return S === null || n !== null && (n.f & J) !== 0 ? t |= J : S.f |= en, {
    ctx: X,
    deps: null,
    effects: null,
    equals: an,
    f: t,
    fn: e,
    reactions: null,
    rv: 0,
    v: (
      /** @type {V} */
      null
    ),
    wv: 0,
    parent: n ?? S
  };
}
// @__NO_SIDE_EFFECTS__
function ur(e) {
  const t = /* @__PURE__ */ ne(e);
  return t.equals = on, t;
}
function cn(e) {
  var t = e.effects;
  if (t !== null) {
    e.effects = null;
    for (var n = 0; n < t.length; n += 1)
      ue(
        /** @type {Effect} */
        t[n]
      );
  }
}
function fr(e) {
  for (var t = e.parent; t !== null; ) {
    if ((t.f & te) === 0)
      return (
        /** @type {Effect} */
        t
      );
    t = t.parent;
  }
  return null;
}
function cr(e) {
  var t, n = S;
  Ee(fr(e));
  try {
    cn(e), t = bn(e);
  } finally {
    Ee(n);
  }
  return t;
}
function dn(e) {
  var t = cr(e), n = (ve || (e.f & J) !== 0) && e.deps !== null ? Se : j;
  oe(e, n), e.equals(t) || (e.v = t, e.wv = mn());
}
function Rt(e) {
  console.warn("https://svelte.dev/e/hydration_mismatch");
}
let A = false;
function ae(e) {
  A = e;
}
let R;
function ie(e) {
  if (e === null)
    throw Rt(), Fe;
  return R = e;
}
function rt() {
  return ie(
    /** @type {TemplateNode} */
    /* @__PURE__ */ pe(R)
  );
}
function L(e) {
  if (A) {
    if (/* @__PURE__ */ pe(R) !== null)
      throw Rt(), Fe;
    R = e;
  }
}
function ht() {
  for (var e = 0, t = R; ; ) {
    if (t.nodeType === 8) {
      var n = (
        /** @type {Comment} */
        t.data
      );
      if (n === wt) {
        if (e === 0) return t;
        e -= 1;
      } else (n === Jt || n === bt) && (e += 1);
    }
    var r = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ pe(t)
    );
    t.remove(), t = r;
  }
}
function y(e, t = null, n) {
  if (typeof e != "object" || e === null || we in e)
    return e;
  const r = St(e);
  if (r !== Xn && r !== Gn)
    return e;
  var i = /* @__PURE__ */ new Map(), s = Et(e), a = G(0);
  s && i.set("length", G(
    /** @type {any[]} */
    e.length
  ));
  var u;
  return new Proxy(
    /** @type {any} */
    e,
    {
      defineProperty(f, l, o) {
        (!("value" in o) || o.configurable === false || o.enumerable === false || o.writable === false) && rr();
        var d = i.get(l);
        return d === void 0 ? (d = G(o.value), i.set(l, d)) : _(d, y(o.value, u)), true;
      },
      deleteProperty(f, l) {
        var o = i.get(l);
        if (o === void 0)
          l in f && i.set(l, G(V));
        else {
          if (s && typeof l == "string") {
            var d = (
              /** @type {Source<number>} */
              i.get("length")
            ), c = Number(l);
            Number.isInteger(c) && c < d.v && _(d, c);
          }
          _(o, V), Ht(a);
        }
        return true;
      },
      get(f, l, o) {
        var _a;
        if (l === we)
          return e;
        var d = i.get(l), c = l in f;
        if (d === void 0 && (!c || ((_a = xe(f, l)) == null ? void 0 : _a.writable)) && (d = G(y(c ? f[l] : V, u)), i.set(l, d)), d !== void 0) {
          var v = h(d);
          return v === V ? void 0 : v;
        }
        return Reflect.get(f, l, o);
      },
      getOwnPropertyDescriptor(f, l) {
        var o = Reflect.getOwnPropertyDescriptor(f, l);
        if (o && "value" in o) {
          var d = i.get(l);
          d && (o.value = h(d));
        } else if (o === void 0) {
          var c = i.get(l), v = c == null ? void 0 : c.v;
          if (c !== void 0 && v !== V)
            return {
              enumerable: true,
              configurable: true,
              value: v,
              writable: true
            };
        }
        return o;
      },
      has(f, l) {
        var _a;
        if (l === we)
          return true;
        var o = i.get(l), d = o !== void 0 && o.v !== V || Reflect.has(f, l);
        if (o !== void 0 || S !== null && (!d || ((_a = xe(f, l)) == null ? void 0 : _a.writable))) {
          o === void 0 && (o = G(d ? y(f[l], u) : V), i.set(l, o));
          var c = h(o);
          if (c === V)
            return false;
        }
        return d;
      },
      set(f, l, o, d) {
        var _a;
        var c = i.get(l), v = l in f;
        if (s && l === "length")
          for (var p = o; p < /** @type {Source<number>} */
          c.v; p += 1) {
            var w = i.get(p + "");
            w !== void 0 ? _(w, V) : p in f && (w = G(V), i.set(p + "", w));
          }
        c === void 0 ? (!v || ((_a = xe(f, l)) == null ? void 0 : _a.writable)) && (c = G(void 0), _(c, y(o, u)), i.set(l, c)) : (v = c.v !== V, _(c, y(o, u)));
        var E = Reflect.getOwnPropertyDescriptor(f, l);
        if ((E == null ? void 0 : E.set) && E.set.call(d, o), !v) {
          if (s && typeof l == "string") {
            var b = (
              /** @type {Source<number>} */
              i.get("length")
            ), x = Number(l);
            Number.isInteger(x) && x >= b.v && _(b, x + 1);
          }
          Ht(a);
        }
        return true;
      },
      ownKeys(f) {
        h(a);
        var l = Reflect.ownKeys(f).filter((c) => {
          var v = i.get(c);
          return v === void 0 || v.v !== V;
        });
        for (var [o, d] of i)
          d.v !== V && !(o in f) && l.push(o);
        return l;
      },
      setPrototypeOf() {
        ir();
      }
    }
  );
}
function Ht(e, t = 1) {
  _(e, e.v + t);
}
var Vt, hn, vn, pn;
function vt() {
  if (Vt === void 0) {
    Vt = window, hn = /Firefox/.test(navigator.userAgent);
    var e = Element.prototype, t = Node.prototype;
    vn = xe(t, "firstChild").get, pn = xe(t, "nextSibling").get, e.__click = void 0, e.__className = void 0, e.__attributes = null, e.__styles = null, e.__e = void 0, Text.prototype.__t = void 0;
  }
}
function Ne(e = "") {
  return document.createTextNode(e);
}
// @__NO_SIDE_EFFECTS__
function Ie(e) {
  return vn.call(e);
}
// @__NO_SIDE_EFFECTS__
function pe(e) {
  return pn.call(e);
}
function M(e, t) {
  if (!A)
    return /* @__PURE__ */ Ie(e);
  var n = (
    /** @type {TemplateNode} */
    /* @__PURE__ */ Ie(R)
  );
  if (n === null)
    n = R.appendChild(Ne());
  else if (t && n.nodeType !== 3) {
    var r = Ne();
    return n == null ? void 0 : n.before(r), ie(r), r;
  }
  return ie(n), n;
}
function dr(e, t) {
  if (!A) {
    var n = (
      /** @type {DocumentFragment} */
      /* @__PURE__ */ Ie(
        /** @type {Node} */
        e
      )
    );
    return n instanceof Comment && n.data === "" ? /* @__PURE__ */ pe(n) : n;
  }
  return R;
}
function Z(e, t = 1, n = false) {
  let r = A ? R : e;
  for (var i; t--; )
    i = r, r = /** @type {TemplateNode} */
    /* @__PURE__ */ pe(r);
  if (!A)
    return r;
  var s = r == null ? void 0 : r.nodeType;
  if (n && s !== 3) {
    var a = Ne();
    return r === null ? i == null ? void 0 : i.after(a) : r.before(a), ie(a), a;
  }
  return ie(r), /** @type {TemplateNode} */
  r;
}
function _n(e) {
  e.textContent = "";
}
let He = false, Xe = false, Ge = null, Ve = false, At = false;
function jt(e) {
  At = e;
}
let Oe = [];
let T = null, ee = false;
function ke(e) {
  T = e;
}
let S = null;
function Ee(e) {
  S = e;
}
let re = null;
function hr(e) {
  re = e;
}
let q = null, W = 0, se = null;
function vr(e) {
  se = e;
}
let gn = 1, Ze = 0, ve = false;
function mn() {
  return ++gn;
}
function De(e) {
  var _a;
  var t = e.f;
  if ((t & ce) !== 0)
    return true;
  if ((t & Se) !== 0) {
    var n = e.deps, r = (t & J) !== 0;
    if (n !== null) {
      var i, s, a = (t & Ye) !== 0, u = r && S !== null && !ve, f = n.length;
      if (a || u) {
        var l = (
          /** @type {Derived} */
          e
        ), o = l.parent;
        for (i = 0; i < f; i++)
          s = n[i], (a || !((_a = s == null ? void 0 : s.reactions) == null ? void 0 : _a.includes(l))) && (s.reactions ?? (s.reactions = [])).push(l);
        a && (l.f ^= Ye), u && o !== null && (o.f & J) === 0 && (l.f ^= J);
      }
      for (i = 0; i < f; i++)
        if (s = n[i], De(
          /** @type {Derived} */
          s
        ) && dn(
          /** @type {Derived} */
          s
        ), s.wv > e.wv)
          return true;
    }
    (!r || S !== null && !ve) && oe(e, j);
  }
  return false;
}
function pr(e, t) {
  for (var n = t; n !== null; ) {
    if ((n.f & ze) !== 0)
      try {
        n.fn(e);
        return;
      } catch {
        n.f ^= ze;
      }
    n = n.parent;
  }
  throw He = false, e;
}
function _r(e) {
  return (e.f & nt) === 0 && (e.parent === null || (e.parent.f & ze) === 0);
}
function it(e, t, n, r) {
  if (He) {
    if (n === null && (He = false), _r(t))
      throw e;
    return;
  }
  n !== null && (He = true);
  {
    pr(e, t);
    return;
  }
}
function yn(e, t, n = true) {
  var r = e.reactions;
  if (r !== null)
    for (var i = 0; i < r.length; i++) {
      var s = r[i];
      (s.f & te) !== 0 ? yn(
        /** @type {Derived} */
        s,
        t,
        false
      ) : t === s && (n ? oe(s, ce) : (s.f & j) !== 0 && oe(s, Se), st(
        /** @type {Effect} */
        s
      ));
    }
}
function bn(e) {
  var _a;
  var t = q, n = W, r = se, i = T, s = ve, a = re, u = X, f = ee, l = e.f;
  q = /** @type {null | Value[]} */
  null, W = 0, se = null, ve = (l & J) !== 0 && (ee || !Ve || T === null), T = (l & (fe | Te)) === 0 ? e : null, re = null, zt(e.ctx), ee = false, Ze++;
  try {
    var o = (
      /** @type {Function} */
      (0, e.fn)()
    ), d = e.deps;
    if (q !== null) {
      var c;
      if (Je(e, W), d !== null && W > 0)
        for (d.length = W + q.length, c = 0; c < q.length; c++)
          d[W + c] = q[c];
      else
        e.deps = d = q;
      if (!ve)
        for (c = W; c < d.length; c++)
          ((_a = d[c]).reactions ?? (_a.reactions = [])).push(e);
    } else d !== null && W < d.length && (Je(e, W), d.length = W);
    if (Sn() && se !== null && !ee && d !== null && (e.f & (te | Se | ce)) === 0)
      for (c = 0; c < /** @type {Source[]} */
      se.length; c++)
        yn(
          se[c],
          /** @type {Effect} */
          e
        );
    return i !== null && Ze++, o;
  } finally {
    q = t, W = n, se = r, T = i, ve = s, re = a, zt(u), ee = f;
  }
}
function gr(e, t) {
  let n = t.reactions;
  if (n !== null) {
    var r = Kn.call(n, e);
    if (r !== -1) {
      var i = n.length - 1;
      i === 0 ? n = t.reactions = null : (n[r] = n[i], n.pop());
    }
  }
  n === null && (t.f & te) !== 0 && // Destroying a child effect while updating a parent effect can cause a dependency to appear
  // to be unused, when in fact it is used by the currently-updating parent. Checking `new_deps`
  // allows us to skip the expensive work of disconnecting and immediately reconnecting it
  (q === null || !q.includes(t)) && (oe(t, Se), (t.f & (J | Ye)) === 0 && (t.f ^= Ye), cn(
    /** @type {Derived} **/
    t
  ), Je(
    /** @type {Derived} **/
    t,
    0
  ));
}
function Je(e, t) {
  var n = e.deps;
  if (n !== null)
    for (var r = t; r < n.length; r++)
      gr(e, n[r]);
}
function Ft(e) {
  var t = e.f;
  if ((t & nt) === 0) {
    oe(e, j);
    var n = S, r = X, i = Ve;
    S = e, Ve = true;
    try {
      (t & $t) !== 0 ? Sr(e) : $n(e), xn(e);
      var s = bn(e);
      e.teardown = typeof s == "function" ? s : null, e.wv = gn;
      var a = e.deps, u;
      Bt && lr && e.f & ce;
    } catch (f) {
      it(f, e, n, r || e.ctx);
    } finally {
      Ve = i, S = n;
    }
  }
}
function mr() {
  try {
    tr();
  } catch (e) {
    if (Ge !== null)
      it(e, Ge, null);
    else
      throw e;
  }
}
function wn() {
  try {
    for (var e = 0; Oe.length > 0; ) {
      e++ > 1e3 && mr();
      var t = Oe, n = t.length;
      Oe = [];
      for (var r = 0; r < n; r++) {
        var i = t[r];
        (i.f & j) === 0 && (i.f ^= j);
        var s = br(i);
        yr(s);
      }
    }
  } finally {
    Xe = false, Ge = null;
  }
}
function yr(e) {
  var t = e.length;
  if (t !== 0)
    for (var n = 0; n < t; n++) {
      var r = e[n];
      if ((r.f & (nt | le)) === 0)
        try {
          De(r) && (Ft(r), r.deps === null && r.first === null && r.nodes_start === null && (r.teardown === null ? kn(r) : r.fn = null));
        } catch (i) {
          it(i, r, null, r.ctx);
        }
    }
}
function st(e) {
  Xe || (Xe = true, queueMicrotask(wn));
  for (var t = Ge = e; t.parent !== null; ) {
    t = t.parent;
    var n = t.f;
    if ((n & (Te | fe)) !== 0) {
      if ((n & j) === 0) return;
      t.f ^= j;
    }
  }
  Oe.push(t);
}
function br(e) {
  for (var t = [], n = e.first; n !== null; ) {
    var r = n.f, i = (r & fe) !== 0, s = i && (r & j) !== 0;
    if (!s && (r & le) === 0) {
      if ((r & Qt) !== 0)
        t.push(n);
      else if (i)
        n.f ^= j;
      else {
        var a = T;
        try {
          T = n, De(n) && Ft(n);
        } catch (l) {
          it(l, n, null, n.ctx);
        } finally {
          T = a;
        }
      }
      var u = n.first;
      if (u !== null) {
        n = u;
        continue;
      }
    }
    var f = n.parent;
    for (n = n.next; n === null && f !== null; )
      n = f.next, f = f.parent;
  }
  return t;
}
function C(e) {
  var t;
  for (qt(); Oe.length > 0; )
    Xe = true, wn(), qt();
  return (
    /** @type {T} */
    t
  );
}
function h(e) {
  var t = e.f, n = (t & te) !== 0;
  if (T !== null && !ee) {
    re !== null && re.includes(e) && sr();
    var r = T.deps;
    e.rv < Ze && (e.rv = Ze, q === null && r !== null && r[W] === e ? W++ : q === null ? q = [e] : (!ve || !q.includes(e)) && q.push(e));
  } else if (n && /** @type {Derived} */
  e.deps === null && /** @type {Derived} */
  e.effects === null) {
    var i = (
      /** @type {Derived} */
      e
    ), s = i.parent;
    s !== null && (s.f & J) === 0 && (i.f ^= J);
  }
  return n && (i = /** @type {Derived} */
  e, De(i) && dn(i)), e.v;
}
function Ot(e) {
  var t = ee;
  try {
    return ee = true, e();
  } finally {
    ee = t;
  }
}
const wr = -7169;
function oe(e, t) {
  e.f = e.f & wr | t;
}
function xr(e) {
  if (!(typeof e != "object" || !e || e instanceof EventTarget)) {
    if (we in e)
      pt(e);
    else if (!Array.isArray(e))
      for (let t in e) {
        const n = e[t];
        typeof n == "object" && n && we in n && pt(n);
      }
  }
}
function pt(e, t = /* @__PURE__ */ new Set()) {
  if (typeof e == "object" && e !== null && // We don't want to traverse DOM elements
  !(e instanceof EventTarget) && !t.has(e)) {
    t.add(e), e instanceof Date && e.getTime();
    for (let r in e)
      try {
        pt(e[r], t);
      } catch {
      }
    const n = St(e);
    if (n !== Object.prototype && n !== Array.prototype && n !== Map.prototype && n !== Set.prototype && n !== Date.prototype) {
      const r = tn(n);
      for (let i in r) {
        const s = r[i].get;
        if (s)
          try {
            s.call(e);
          } catch {
          }
      }
    }
  }
}
function $r(e) {
  S === null && T === null && er(), T !== null && (T.f & J) !== 0 && S === null && Qn(), At && Jn();
}
function kr(e, t) {
  var n = t.last;
  n === null ? t.last = t.first = e : (n.next = e, e.prev = n, t.last = e);
}
function Pe(e, t, n, r = true) {
  var i = (e & Te) !== 0, s = S, a = {
    ctx: X,
    deps: null,
    nodes_start: null,
    nodes_end: null,
    f: e | ce,
    first: null,
    fn: t,
    last: null,
    next: null,
    parent: i ? null : s,
    prev: null,
    teardown: null,
    transitions: null,
    wv: 0
  };
  if (n)
    try {
      Ft(a), a.f |= jn;
    } catch (l) {
      throw ue(a), l;
    }
  else t !== null && st(a);
  var u = n && a.deps === null && a.first === null && a.nodes_start === null && a.teardown === null && (a.f & (en | ze)) === 0;
  if (!u && !i && r && (s !== null && kr(a, s), T !== null && (T.f & te) !== 0)) {
    var f = (
      /** @type {Derived} */
      T
    );
    (f.effects ?? (f.effects = [])).push(a);
  }
  return a;
}
function ge(e) {
  $r();
  var t = S !== null && (S.f & fe) !== 0 && X !== null && !X.m;
  if (t) {
    var n = (
      /** @type {ComponentContext} */
      X
    );
    (n.e ?? (n.e = [])).push({
      fn: e,
      effect: S,
      reaction: T
    });
  } else {
    var r = at(e);
    return r;
  }
}
function Er(e) {
  const t = Pe(Te, e, true);
  return () => {
    ue(t);
  };
}
function Tr(e) {
  const t = Pe(Te, e, true);
  return (n = {}) => new Promise((r) => {
    n.outro ? Qe(t, () => {
      ue(t), r(void 0);
    }) : (ue(t), r(void 0));
  });
}
function at(e) {
  return Pe(Qt, e, false);
}
function Ct(e) {
  return Pe(xt, e, true);
}
function Ue(e, t = [], n = ne) {
  const r = t.map(n);
  return Nt(() => e(...r.map(h)));
}
function Nt(e, t = 0) {
  return Pe(xt | $t | t, e, true);
}
function Le(e, t = true) {
  return Pe(xt | fe, e, true, t);
}
function xn(e) {
  var t = e.teardown;
  if (t !== null) {
    const n = At, r = T;
    jt(true), ke(null);
    try {
      t.call(null);
    } finally {
      jt(n), ke(r);
    }
  }
}
function $n(e, t = false) {
  var n = e.first;
  for (e.first = e.last = null; n !== null; ) {
    var r = n.next;
    ue(n, t), n = r;
  }
}
function Sr(e) {
  for (var t = e.first; t !== null; ) {
    var n = t.next;
    (t.f & fe) === 0 && ue(t), t = n;
  }
}
function ue(e, t = true) {
  var n = false;
  if ((t || (e.f & zn) !== 0) && e.nodes_start !== null) {
    for (var r = e.nodes_start, i = e.nodes_end; r !== null; ) {
      var s = r === i ? null : (
        /** @type {TemplateNode} */
        /* @__PURE__ */ pe(r)
      );
      r.remove(), r = s;
    }
    n = true;
  }
  $n(e, t && !n), Je(e, 0), oe(e, nt);
  var a = e.transitions;
  if (a !== null)
    for (const f of a)
      f.stop();
  xn(e);
  var u = e.parent;
  u !== null && u.first !== null && kn(e), e.next = e.prev = e.teardown = e.ctx = e.deps = e.fn = e.nodes_start = e.nodes_end = null;
}
function kn(e) {
  var t = e.parent, n = e.prev, r = e.next;
  n !== null && (n.next = r), r !== null && (r.prev = n), t !== null && (t.first === e && (t.first = r), t.last === e && (t.last = n));
}
function Qe(e, t) {
  var n = [];
  It(e, n, true), En(n, () => {
    ue(e), t && t();
  });
}
function En(e, t) {
  var n = e.length;
  if (n > 0) {
    var r = () => --n || t();
    for (var i of e)
      i.out(r);
  } else
    t();
}
function It(e, t, n) {
  if ((e.f & le) === 0) {
    if (e.f ^= le, e.transitions !== null)
      for (const a of e.transitions)
        (a.is_global || n) && t.push(a);
    for (var r = e.first; r !== null; ) {
      var i = r.next, s = (r.f & kt) !== 0 || (r.f & fe) !== 0;
      It(r, t, s ? n : false), r = i;
    }
  }
}
function et(e) {
  Tn(e, true);
}
function Tn(e, t) {
  if ((e.f & le) !== 0) {
    e.f ^= le, (e.f & j) === 0 && (e.f ^= j), De(e) && (oe(e, ce), st(e));
    for (var n = e.first; n !== null; ) {
      var r = n.next, i = (n.f & kt) !== 0 || (n.f & fe) !== 0;
      Tn(n, i ? t : false), n = r;
    }
    if (e.transitions !== null)
      for (const s of e.transitions)
        (s.is_global || t) && s.in();
  }
}
let X = null;
function zt(e) {
  X = e;
}
function lt(e, t = false, n) {
  X = {
    p: X,
    c: null,
    e: null,
    m: false,
    s: e,
    x: null,
    l: null
  };
}
function ot(e) {
  const t = X;
  if (t !== null) {
    e !== void 0 && (t.x = e);
    const a = t.e;
    if (a !== null) {
      var n = S, r = T;
      t.e = null;
      try {
        for (var i = 0; i < a.length; i++) {
          var s = a[i];
          Ee(s.effect), ke(s.reaction), at(s.fn);
        }
      } finally {
        Ee(n), ke(r);
      }
    }
    X = t.p, t.m = true;
  }
  return e || /** @type {T} */
  {};
}
function Sn() {
  return true;
}
const Pr = ["touchstart", "touchmove"];
function Rr(e) {
  return Pr.includes(e);
}
const Pn = /* @__PURE__ */ new Set(), _t = /* @__PURE__ */ new Set();
function Ut(e) {
  for (var t = 0; t < e.length; t++)
    Pn.add(e[t]);
  for (var n of _t)
    n(e);
}
function qe(e) {
  var _a;
  var t = this, n = (
    /** @type {Node} */
    t.ownerDocument
  ), r = e.type, i = ((_a = e.composedPath) == null ? void 0 : _a.call(e)) || [], s = (
    /** @type {null | Element} */
    i[0] || e.target
  ), a = 0, u = e.__root;
  if (u) {
    var f = i.indexOf(u);
    if (f !== -1 && (t === document || t === /** @type {any} */
    window)) {
      e.__root = t;
      return;
    }
    var l = i.indexOf(t);
    if (l === -1)
      return;
    f <= l && (a = f);
  }
  if (s = /** @type {Element} */
  i[a] || e.target, s !== t) {
    Ke(e, "currentTarget", {
      configurable: true,
      get() {
        return s || n;
      }
    });
    var o = T, d = S;
    ke(null), Ee(null);
    try {
      for (var c, v = []; s !== null; ) {
        var p = s.assignedSlot || s.parentNode || /** @type {any} */
        s.host || null;
        try {
          var w = s["__" + r];
          if (w !== void 0 && (!/** @type {any} */
          s.disabled || // DOM could've been updated already by the time this is reached, so we check this as well
          // -> the target could not have been disabled because it emits the event in the first place
          e.target === s))
            if (Et(w)) {
              var [E, ...b] = w;
              E.apply(s, [e, ...b]);
            } else
              w.call(s, e);
        } catch (x) {
          c ? v.push(x) : c = x;
        }
        if (e.cancelBubble || p === t || p === null)
          break;
        s = p;
      }
      if (c) {
        for (let x of v)
          queueMicrotask(() => {
            throw x;
          });
        throw c;
      }
    } finally {
      e.__root = t, delete e.currentTarget, ke(o), Ee(d);
    }
  }
}
function Ar(e) {
  var t = document.createElement("template");
  return t.innerHTML = e, t.content;
}
function Me(e, t) {
  var n = (
    /** @type {Effect} */
    S
  );
  n.nodes_start === null && (n.nodes_start = e, n.nodes_end = t);
}
// @__NO_SIDE_EFFECTS__
function de(e, t) {
  var n = (t & Vn) !== 0, r, i = !e.startsWith("<!>");
  return () => {
    if (A)
      return Me(R, null), R;
    r === void 0 && (r = Ar(i ? e : "<!>" + e), r = /** @type {Node} */
    /* @__PURE__ */ Ie(r));
    var s = (
      /** @type {TemplateNode} */
      n || hn ? document.importNode(r, true) : r.cloneNode(true)
    );
    return Me(s, s), s;
  };
}
function Fr() {
  if (A)
    return Me(R, null), R;
  var e = document.createDocumentFragment(), t = document.createComment(""), n = Ne();
  return e.append(t, n), Me(t, n), e;
}
function Q(e, t) {
  if (A) {
    S.nodes_end = R, rt();
    return;
  }
  e !== null && e.before(
    /** @type {Node} */
    t
  );
}
function me(e, t) {
  var n = t == null ? "" : typeof t == "object" ? t + "" : t;
  n !== (e.__t ?? (e.__t = e.nodeValue)) && (e.__t = n, e.nodeValue = n + "");
}
function Rn(e, t) {
  return An(e, t);
}
function Or(e, t) {
  vt(), t.intro = t.intro ?? false;
  const n = t.target, r = A, i = R;
  try {
    for (var s = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ Ie(n)
    ); s && (s.nodeType !== 8 || /** @type {Comment} */
    s.data !== Jt); )
      s = /** @type {TemplateNode} */
      /* @__PURE__ */ pe(s);
    if (!s)
      throw Fe;
    ae(true), ie(
      /** @type {Comment} */
      s
    ), rt();
    const a = An(e, { ...t, anchor: s });
    if (R === null || R.nodeType !== 8 || /** @type {Comment} */
    R.data !== wt)
      throw Rt(), Fe;
    return ae(false), /**  @type {Exports} */
    a;
  } catch (a) {
    if (a === Fe)
      return t.recover === false && nr(), vt(), _n(n), ae(false), Rn(e, t);
    throw a;
  } finally {
    ae(r), ie(i);
  }
}
const be = /* @__PURE__ */ new Map();
function An(e, { target: t, anchor: n, props: r = {}, events: i, context: s, intro: a = true }) {
  vt();
  var u = /* @__PURE__ */ new Set(), f = (d) => {
    for (var c = 0; c < d.length; c++) {
      var v = d[c];
      if (!u.has(v)) {
        u.add(v);
        var p = Rr(v);
        t.addEventListener(v, qe, { passive: p });
        var w = be.get(v);
        w === void 0 ? (document.addEventListener(v, qe, { passive: p }), be.set(v, 1)) : be.set(v, w + 1);
      }
    }
  };
  f(Tt(Pn)), _t.add(f);
  var l = void 0, o = Tr(() => {
    var d = n ?? t.appendChild(Ne());
    return Le(() => {
      if (s) {
        lt({});
        var c = (
          /** @type {ComponentContext} */
          X
        );
        c.c = s;
      }
      i && (r.$$events = i), A && Me(
        /** @type {TemplateNode} */
        d,
        null
      ), l = e(d, r) || {}, A && (S.nodes_end = R), s && ot();
    }), () => {
      var _a;
      for (var c of u) {
        t.removeEventListener(c, qe);
        var v = (
          /** @type {number} */
          be.get(c)
        );
        --v === 0 ? (document.removeEventListener(c, qe), be.delete(c)) : be.set(c, v);
      }
      _t.delete(f), d !== n && ((_a = d.parentNode) == null ? void 0 : _a.removeChild(d));
    };
  });
  return gt.set(l, o), l;
}
let gt = /* @__PURE__ */ new WeakMap();
function Cr(e, t) {
  const n = gt.get(e);
  return n ? (gt.delete(e), n(t)) : Promise.resolve();
}
function Ae(e, t, n = false) {
  A && rt();
  var r = e, i = null, s = null, a = V, u = n ? kt : 0, f = false;
  const l = (d, c = true) => {
    f = true, o(c, d);
  }, o = (d, c) => {
    if (a === (a = d)) return;
    let v = false;
    if (A) {
      const p = (
        /** @type {Comment} */
        r.data === bt
      );
      !!a === p && (r = ht(), ie(r), ae(false), v = true);
    }
    a ? (i ? et(i) : c && (i = Le(() => c(r))), s && Qe(s, () => {
      s = null;
    })) : (s ? et(s) : c && (s = Le(() => c(r))), i && Qe(i, () => {
      i = null;
    })), v && ae(true);
  };
  Nt(() => {
    f = false, t(l), f || o(null, null);
  }, u), A && (r = R);
}
function Nr(e, t) {
  return t;
}
function Ir(e, t, n, r) {
  for (var i = [], s = t.length, a = 0; a < s; a++)
    It(t[a].e, i, true);
  var u = s > 0 && i.length === 0 && n !== null;
  if (u) {
    var f = (
      /** @type {Element} */
      /** @type {Element} */
      n.parentNode
    );
    _n(f), f.append(
      /** @type {Element} */
      n
    ), r.clear(), he(e, t[0].prev, t[s - 1].next);
  }
  En(i, () => {
    for (var l = 0; l < s; l++) {
      var o = t[l];
      u || (r.delete(o.k), he(e, o.prev, o.next)), ue(o.e, !u);
    }
  });
}
function Ur(e, t, n, r, i, s = null) {
  var a = e, u = { flags: t, items: /* @__PURE__ */ new Map(), first: null };
  A && rt();
  var f = null, l = false, o = /* @__PURE__ */ ur(() => {
    var d = n();
    return Et(d) ? d : d == null ? [] : Tt(d);
  });
  Nt(() => {
    var d = h(o), c = d.length;
    if (l && c === 0)
      return;
    l = c === 0;
    let v = false;
    if (A) {
      var p = (
        /** @type {Comment} */
        a.data === bt
      );
      p !== (c === 0) && (a = ht(), ie(a), ae(false), v = true);
    }
    if (A) {
      for (var w = null, E, b = 0; b < c; b++) {
        if (R.nodeType === 8 && /** @type {Comment} */
        R.data === wt) {
          a = /** @type {Comment} */
          R, v = true, ae(false);
          break;
        }
        var x = d[b], D = r(x, b);
        E = Fn(
          R,
          u,
          w,
          null,
          x,
          D,
          b,
          i,
          t,
          n
        ), u.items.set(D, E), w = E;
      }
      c > 0 && ie(ht());
    }
    A || Lr(d, u, a, i, t, r, n), s !== null && (c === 0 ? f ? et(f) : f = Le(() => s(a)) : f !== null && Qe(f, () => {
      f = null;
    })), v && ae(true), h(o);
  }), A && (a = R);
}
function Lr(e, t, n, r, i, s, a) {
  var u = e.length, f = t.items, l = t.first, o = l, d, c = null, v = [], p = [], w, E, b, x;
  for (x = 0; x < u; x += 1) {
    if (w = e[x], E = s(w, x), b = f.get(E), b === void 0) {
      var D = o ? (
        /** @type {TemplateNode} */
        o.e.nodes_start
      ) : n;
      c = Fn(
        D,
        t,
        c,
        c === null ? t.first : c.next,
        w,
        E,
        x,
        r,
        i,
        a
      ), f.set(E, c), v = [], p = [], o = c.next;
      continue;
    }
    if (Mr(b, w, x), (b.e.f & le) !== 0 && et(b.e), b !== o) {
      if (d !== void 0 && d.has(b)) {
        if (v.length < p.length) {
          var F = p[0], $;
          c = F.prev;
          var B = v[0], N = v[v.length - 1];
          for ($ = 0; $ < v.length; $ += 1)
            Yt(v[$], F, n);
          for ($ = 0; $ < p.length; $ += 1)
            d.delete(p[$]);
          he(t, B.prev, N.next), he(t, c, B), he(t, N, F), o = F, c = N, x -= 1, v = [], p = [];
        } else
          d.delete(b), Yt(b, o, n), he(t, b.prev, b.next), he(t, b, c === null ? t.first : c.next), he(t, c, b), c = b;
        continue;
      }
      for (v = [], p = []; o !== null && o.k !== E; )
        (o.e.f & le) === 0 && (d ?? (d = /* @__PURE__ */ new Set())).add(o), p.push(o), o = o.next;
      if (o === null)
        continue;
      b = o;
    }
    v.push(b), c = b, o = b.next;
  }
  if (o !== null || d !== void 0) {
    for (var k = d === void 0 ? [] : Tt(d); o !== null; )
      (o.e.f & le) === 0 && k.push(o), o = o.next;
    var I = k.length;
    if (I > 0) {
      var g = null;
      Ir(t, k, g, f);
    }
  }
  S.first = t.first && t.first.e, S.last = c && c.e;
}
function Mr(e, t, n, r) {
  un(e.v, t), e.i = n;
}
function Fn(e, t, n, r, i, s, a, u, f, l) {
  var o = (f & Bn) !== 0, d = (f & Hn) === 0, c = o ? d ? /* @__PURE__ */ Pt(i) : G(i) : i, v = (f & qn) === 0 ? a : G(a), p = {
    i: v,
    v: c,
    k: s,
    a: null,
    // @ts-expect-error
    e: null,
    prev: n,
    next: r
  };
  try {
    return p.e = Le(() => u(e, c, v, l), A), p.e.prev = n && n.e, p.e.next = r && r.e, n === null ? t.first = p : (n.next = p, n.e.next = p.e), r !== null && (r.prev = p, r.e.prev = p.e), p;
  } finally {
  }
}
function Yt(e, t, n) {
  for (var r = e.next ? (
    /** @type {TemplateNode} */
    e.next.e.nodes_start
  ) : n, i = t ? (
    /** @type {TemplateNode} */
    t.e.nodes_start
  ) : n, s = (
    /** @type {TemplateNode} */
    e.e.nodes_start
  ); s !== r; ) {
    var a = (
      /** @type {TemplateNode} */
      /* @__PURE__ */ pe(s)
    );
    i.before(s), s = a;
  }
}
function he(e, t, n) {
  t === null ? e.first = n : (t.next = n, t.e.next = n && n.e), n !== null && (n.prev = t, n.e.prev = t && t.e);
}
function Dr(e, t) {
  sn(() => {
    var n = e.getRootNode(), r = (
      /** @type {ShadowRoot} */
      n.host ? (
        /** @type {ShadowRoot} */
        n
      ) : (
        /** @type {Document} */
        n.head ?? /** @type {Document} */
        n.ownerDocument.head
      )
    );
    if (!r.querySelector("#" + t.hash)) {
      const i = document.createElement("style");
      i.id = t.hash, i.textContent = t.code, r.appendChild(i);
    }
  });
}
function Br(e, t, n) {
  at(() => {
    var r = Ot(() => t(e, n == null ? void 0 : n()) || {});
    if (n && (r == null ? void 0 : r.update)) {
      var i = false, s = (
        /** @type {any} */
        {}
      );
      Ct(() => {
        var a = n();
        xr(a), i && ln(s, a) && (s = a, r.update(a));
      }), i = true;
    }
    if (r == null ? void 0 : r.destroy)
      return () => (
        /** @type {Function} */
        r.destroy()
      );
  });
}
const Wt = [...` 	
\r\f\xA0\v\uFEFF`];
function qr(e, t, n) {
  var r = e == null ? "" : "" + e;
  if (n) {
    for (var i in n)
      if (n[i])
        r = r ? r + " " + i : i;
      else if (r.length)
        for (var s = i.length, a = 0; (a = r.indexOf(i, a)) >= 0; ) {
          var u = a + s;
          (a === 0 || Wt.includes(r[a - 1])) && (u === r.length || Wt.includes(r[u])) ? r = (a === 0 ? "" : r.substring(0, a)) + r.substring(u + 1) : a = u;
        }
  }
  return r === "" ? null : r;
}
function tt(e, t, n, r, i, s) {
  var a = e.__className;
  if (A || a !== n) {
    var u = qr(n, r, s);
    (!A || u !== e.getAttribute("class")) && (u == null ? e.removeAttribute("class") : e.className = u), e.__className = n;
  } else if (s)
    for (var f in s) {
      var l = !!s[f];
      (i == null || l !== !!i[f]) && e.classList.toggle(f, l);
    }
  return s;
}
function $e(e, t, n, r) {
  var i = e.__attributes ?? (e.__attributes = {});
  A && (i[t] = e.getAttribute(t), t === "src" || t === "srcset" || t === "href" && e.nodeName === "LINK") || i[t] !== (i[t] = n) && (t === "style" && "__styles" in e && (e.__styles = {}), t === "loading" && (e[Wn] = n), n == null ? e.removeAttribute(t) : typeof n != "string" && Hr(e).includes(t) ? e[t] = n : e.setAttribute(t, n));
}
var Kt = /* @__PURE__ */ new Map();
function Hr(e) {
  var t = Kt.get(e.nodeName);
  if (t) return t;
  Kt.set(e.nodeName, t = []);
  for (var n, r = e, i = Element.prototype; i !== r; ) {
    n = tn(r);
    for (var s in n)
      n[s].set && t.push(s);
    r = St(r);
  }
  return t;
}
function Xt(e, t) {
  return e === t || (e == null ? void 0 : e[we]) === t;
}
function mt(e = {}, t, n, r) {
  return at(() => {
    var i, s;
    return Ct(() => {
      i = s, s = [], Ot(() => {
        e !== n(...s) && (t(e, ...s), i && Xt(n(...i), e) && t(null, ...i));
      });
    }), () => {
      sn(() => {
        s && Xt(n(...s), e) && t(null, ...s);
      });
    };
  }), e;
}
function U(e, t, n, r) {
  var i;
  i = /** @type {V} */
  e[t];
  var s = (
    /** @type {V} */
    r
  ), a = true, u = false, f = () => (u = true, a && (a = false, s = /** @type {V} */
  r), s), l;
  l = () => {
    var v = (
      /** @type {V} */
      e[t]
    );
    return v === void 0 ? f() : (a = true, u = false, v);
  };
  var o = false, d = /* @__PURE__ */ Pt(i), c = /* @__PURE__ */ ne(() => {
    var v = l(), p = h(d);
    return o ? (o = false, p) : d.v = v;
  });
  return function(v, p) {
    if (arguments.length > 0) {
      const w = p ? h(c) : v;
      return c.equals(w) || (o = true, _(d, w), u && s !== void 0 && (s = w), Ot(() => h(c))), v;
    }
    return h(c);
  };
}
function Vr(e) {
  return new jr(e);
}
class jr {
  /**
   * @param {ComponentConstructorOptions & {
   *  component: any;
   * }} options
   */
  constructor(t) {
    /** @type {any} */
    __privateAdd(this, _t2);
    /** @type {Record<string, any>} */
    __privateAdd(this, _e);
    var _a;
    var n = /* @__PURE__ */ new Map(), r = (s, a) => {
      var u = /* @__PURE__ */ Pt(a);
      return n.set(s, u), u;
    };
    const i = new Proxy(
      { ...t.props || {}, $$events: {} },
      {
        get(s, a) {
          return h(n.get(a) ?? r(a, Reflect.get(s, a)));
        },
        has(s, a) {
          return a === Yn ? true : (h(n.get(a) ?? r(a, Reflect.get(s, a))), Reflect.has(s, a));
        },
        set(s, a, u) {
          return _(n.get(a) ?? r(a, u), u), Reflect.set(s, a, u);
        }
      }
    );
    __privateSet(this, _e, (t.hydrate ? Or : Rn)(t.component, {
      target: t.target,
      anchor: t.anchor,
      props: i,
      context: t.context,
      intro: t.intro ?? false,
      recover: t.recover
    })), (!((_a = t == null ? void 0 : t.props) == null ? void 0 : _a.$$host) || t.sync === false) && C(), __privateSet(this, _t2, i.$$events);
    for (const s of Object.keys(__privateGet(this, _e)))
      s === "$set" || s === "$destroy" || s === "$on" || Ke(this, s, {
        get() {
          return __privateGet(this, _e)[s];
        },
        /** @param {any} value */
        set(a) {
          __privateGet(this, _e)[s] = a;
        },
        enumerable: true
      });
    __privateGet(this, _e).$set = /** @param {Record<string, any>} next */
    (s) => {
      Object.assign(i, s);
    }, __privateGet(this, _e).$destroy = () => {
      Cr(__privateGet(this, _e));
    };
  }
  /** @param {Record<string, any>} props */
  $set(t) {
    __privateGet(this, _e).$set(t);
  }
  /**
   * @param {string} event
   * @param {(...args: any[]) => any} callback
   * @returns {any}
   */
  $on(t, n) {
    __privateGet(this, _t2)[t] = __privateGet(this, _t2)[t] || [];
    const r = (...i) => n.call(this, ...i);
    return __privateGet(this, _t2)[t].push(r), () => {
      __privateGet(this, _t2)[t] = __privateGet(this, _t2)[t].filter(
        /** @param {any} fn */
        (i) => i !== r
      );
    };
  }
  $destroy() {
    __privateGet(this, _e).$destroy();
  }
}
_t2 = new WeakMap();
_e = new WeakMap();
let On;
typeof HTMLElement == "function" && (On = class extends HTMLElement {
  /**
   * @param {*} $$componentCtor
   * @param {*} $$slots
   * @param {*} use_shadow_dom
   */
  constructor(e, t, n) {
    super();
    /** The Svelte component constructor */
    __publicField(this, "$$ctor");
    /** Slots */
    __publicField(this, "$$s");
    /** @type {any} The Svelte component instance */
    __publicField(this, "$$c");
    /** Whether or not the custom element is connected */
    __publicField(this, "$$cn", false);
    /** @type {Record<string, any>} Component props data */
    __publicField(this, "$$d", {});
    /** `true` if currently in the process of reflecting component props back to attributes */
    __publicField(this, "$$r", false);
    /** @type {Record<string, CustomElementPropDefinition>} Props definition (name, reflected, type etc) */
    __publicField(this, "$$p_d", {});
    /** @type {Record<string, EventListenerOrEventListenerObject[]>} Event listeners */
    __publicField(this, "$$l", {});
    /** @type {Map<EventListenerOrEventListenerObject, Function>} Event listener unsubscribe functions */
    __publicField(this, "$$l_u", /* @__PURE__ */ new Map());
    /** @type {any} The managed render effect for reflecting attributes */
    __publicField(this, "$$me");
    this.$$ctor = e, this.$$s = t, n && this.attachShadow({ mode: "open" });
  }
  /**
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} listener
   * @param {boolean | AddEventListenerOptions} [options]
   */
  addEventListener(e, t, n) {
    if (this.$$l[e] = this.$$l[e] || [], this.$$l[e].push(t), this.$$c) {
      const r = this.$$c.$on(e, t);
      this.$$l_u.set(t, r);
    }
    super.addEventListener(e, t, n);
  }
  /**
   * @param {string} type
   * @param {EventListenerOrEventListenerObject} listener
   * @param {boolean | AddEventListenerOptions} [options]
   */
  removeEventListener(e, t, n) {
    if (super.removeEventListener(e, t, n), this.$$c) {
      const r = this.$$l_u.get(t);
      r && (r(), this.$$l_u.delete(t));
    }
  }
  async connectedCallback() {
    if (this.$$cn = true, !this.$$c) {
      let e = function(r) {
        return (i) => {
          const s = document.createElement("slot");
          r !== "default" && (s.name = r), Q(i, s);
        };
      };
      if (await Promise.resolve(), !this.$$cn || this.$$c)
        return;
      const t = {}, n = zr(this);
      for (const r of this.$$s)
        r in n && (r === "default" && !this.$$d.children ? (this.$$d.children = e(r), t.default = true) : t[r] = e(r));
      for (const r of this.attributes) {
        const i = this.$$g_p(r.name);
        i in this.$$d || (this.$$d[i] = je(i, r.value, this.$$p_d, "toProp"));
      }
      for (const r in this.$$p_d)
        !(r in this.$$d) && this[r] !== void 0 && (this.$$d[r] = this[r], delete this[r]);
      this.$$c = Vr({
        component: this.$$ctor,
        target: this.shadowRoot || this,
        props: {
          ...this.$$d,
          $$slots: t,
          $$host: this
        }
      }), this.$$me = Er(() => {
        Ct(() => {
          var _a;
          this.$$r = true;
          for (const r of We(this.$$c)) {
            if (!((_a = this.$$p_d[r]) == null ? void 0 : _a.reflect)) continue;
            this.$$d[r] = this.$$c[r];
            const i = je(
              r,
              this.$$d[r],
              this.$$p_d,
              "toAttribute"
            );
            i == null ? this.removeAttribute(this.$$p_d[r].attribute || r) : this.setAttribute(this.$$p_d[r].attribute || r, i);
          }
          this.$$r = false;
        });
      });
      for (const r in this.$$l)
        for (const i of this.$$l[r]) {
          const s = this.$$c.$on(r, i);
          this.$$l_u.set(i, s);
        }
      this.$$l = {};
    }
  }
  // We don't need this when working within Svelte code, but for compatibility of people using this outside of Svelte
  // and setting attributes through setAttribute etc, this is helpful
  /**
   * @param {string} attr
   * @param {string} _oldValue
   * @param {string} newValue
   */
  attributeChangedCallback(e, t, n) {
    var _a;
    this.$$r || (e = this.$$g_p(e), this.$$d[e] = je(e, n, this.$$p_d, "toProp"), (_a = this.$$c) == null ? void 0 : _a.$set({ [e]: this.$$d[e] }));
  }
  disconnectedCallback() {
    this.$$cn = false, Promise.resolve().then(() => {
      !this.$$cn && this.$$c && (this.$$c.$destroy(), this.$$me(), this.$$c = void 0);
    });
  }
  /**
   * @param {string} attribute_name
   */
  $$g_p(e) {
    return We(this.$$p_d).find(
      (t) => this.$$p_d[t].attribute === e || !this.$$p_d[t].attribute && t.toLowerCase() === e
    ) || e;
  }
});
function je(e, t, n, r) {
  var _a;
  const i = (_a = n[e]) == null ? void 0 : _a.type;
  if (t = i === "Boolean" && typeof t != "boolean" ? t != null : t, !r || !n[e])
    return t;
  if (r === "toAttribute")
    switch (i) {
      case "Object":
      case "Array":
        return t == null ? null : JSON.stringify(t);
      case "Boolean":
        return t ? "" : null;
      case "Number":
        return t ?? null;
      default:
        return t;
    }
  else
    switch (i) {
      case "Object":
      case "Array":
        return t && JSON.parse(t);
      case "Boolean":
        return t;
      // conversion already handled above
      case "Number":
        return t != null ? +t : t;
      default:
        return t;
    }
}
function zr(e) {
  const t = {};
  return e.childNodes.forEach((n) => {
    t[
      /** @type {Element} node */
      n.slot || "default"
    ] = true;
  }), t;
}
function Lt(e, t, n, r, i, s) {
  let a = class extends On {
    constructor() {
      super(e, n, i), this.$$p_d = t;
    }
    static get observedAttributes() {
      return We(t).map(
        (u) => (t[u].attribute || u).toLowerCase()
      );
    }
  };
  return We(t).forEach((u) => {
    Ke(a.prototype, u, {
      get() {
        return this.$$c && u in this.$$c ? this.$$c[u] : this.$$d[u];
      },
      set(f) {
        var _a;
        f = je(u, f, t), this.$$d[u] = f;
        var l = this.$$c;
        if (l) {
          var o = (_a = xe(l, u)) == null ? void 0 : _a.get;
          o ? l[u] = f : l.$set({ [u]: f });
        }
      }
    });
  }), r.forEach((u) => {
    Ke(a.prototype, u, {
      get() {
        var _a;
        return (_a = this.$$c) == null ? void 0 : _a[u];
      }
    });
  }), e.element = /** @type {any} */
  a, a;
}
const yt = 20, Cn = 17, Gt = 1e6;
async function Mt(e, t, n) {
  const r = await fetch(e, {
    headers: { Range: `bytes=${t}-${n}` }
  });
  if (r.status !== 206 && r.status !== 200)
    throw new Error(`HTTP error status: ${r.status}`);
  if (t > 0 && r.status === 200)
    throw new Error(
      "Server returned full file (200) instead of requested byte range (expected 206). The recording server must support HTTP Range requests."
    );
  return r.arrayBuffer();
}
function Yr(e) {
  const t = new DataView(e), n = t.getUint32(0, false), r = Number(t.getBigUint64(4, false)), i = Number(t.getBigUint64(12, false));
  return { version: n, totalPdus: r, duration: i };
}
function Wr(e, t, n) {
  const r = new DataView(e), i = [];
  for (let s = 0; s < n; s++) {
    const a = t + s * Cn, u = r.getUint32(a, false), f = r.getUint32(a + 4, false), l = r.getBigUint64(a + 8, false), o = r.getUint8(a + 16);
    i.push({ timeOffset: u, pduLength: f, byteOffset: l, direction: o });
  }
  return i;
}
async function Kr(e) {
  const t = await Mt(e, 0, yt - 1);
  return Yr(t);
}
async function Xr(e, t) {
  if (t > Gt)
    throw new Error(
      `Recording claims ${t.toLocaleString()} PDUs; exceeds maximum of ${Gt.toLocaleString()}. The recording file may be corrupt.`
    );
  const n = yt + Cn * t - 1, r = await Mt(e, yt, n);
  return Wr(r, 0, t);
}
const Gr = 0, Zr = 1;
class Jr {
  constructor(t, n, r) {
    __publicField(this, "url");
    __publicField(this, "indexTable");
    __publicField(this, "wasmReplay");
    __publicField(this, "_nextFetchIndex", 0);
    __publicField(this, "_lastPushedTimestamp", 0);
    __publicField(this, "_fetchingPromise", null);
    __publicField(this, "_fetchVersion", 0);
    this.url = t, this.indexTable = n, this.wasmReplay = r;
  }
  /** True while a fetch is in-flight. */
  get isFetching() {
    return this._fetchingPromise !== null;
  }
  /** Timestamp (ms) of the last PDU pushed to WASM. Used for buffer health checks. */
  get lastPushedTimestamp() {
    return this._lastPushedTimestamp;
  }
  get nextUnfetchedTimestamp() {
    return this._nextFetchIndex >= this.indexTable.length ? 1 / 0 : this.indexTable[this._nextFetchIndex].timeOffset;
  }
  /**
   * Reset fetch position to the beginning of the recording.
   * Called before a backward seek — after wasmReplay.reset() has been called.
   * Increments _fetchVersion so any in-flight doFetch coroutine bails without
   * mutating shared state or pushing PDUs to the reset WASM instance.
   */
  reset() {
    this._fetchVersion++, this._nextFetchIndex = 0, this._lastPushedTimestamp = 0, this._fetchingPromise = null;
  }
  /**
   * Fetch all PDUs with timeOffset <= targetMs and push them to WASM.
   *
   * If a fetch is already in-flight, returns the existing promise so callers
   * can await actual completion (e.g. for buffering resume logic).
   *
   * Returns an already-resolved promise if:
   * - The buffer already covers targetMs
   * - All PDUs have been fetched
   * - No PDUs fall within the requested range
   *
   * On error, releases the guard and rejects with an error message.
   */
  async fetchUntilTime(t) {
    if (this._fetchingPromise !== null)
      return this._fetchingPromise;
    if (this._lastPushedTimestamp >= t || this._nextFetchIndex >= this.indexTable.length) return;
    const n = this.binarySearchTarget(t);
    if (n < this._nextFetchIndex) return;
    const r = this.doFetch(n);
    this._fetchingPromise = r;
    try {
      await r;
    } finally {
      this._fetchingPromise === r && (this._fetchingPromise = null);
    }
  }
  async doFetch(t) {
    const n = this._fetchVersion, r = this.indexTable[this._nextFetchIndex], i = this.indexTable[t], s = Number(r.byteOffset), a = Number(i.byteOffset) + i.pduLength - 1;
    let u;
    try {
      u = await Mt(this.url, s, a);
    } catch (l) {
      throw new Error(`Network error fetching bytes ${s}-${a}: ${l}`);
    }
    const f = new Uint8Array(u);
    for (let l = this._nextFetchIndex; l <= t; l++) {
      if (this._fetchVersion !== n) return;
      const o = this.indexTable[l], d = Number(o.byteOffset) - s, c = f.subarray(d, d + o.pduLength), v = o.direction === 0 ? Gr : Zr;
      try {
        this.wasmReplay.pushPdu(o.timeOffset, v, c);
      } catch (p) {
        throw new Error(`Wasm error pushing PDU index ${l}: ${p}`);
      }
      this._nextFetchIndex = l + 1, this._lastPushedTimestamp = o.timeOffset;
    }
  }
  /**
   * Binary search for the last index table entry with timeOffset <= targetMs.
   * Search starts from _nextFetchIndex (already-fetched entries are skipped).
   * Returns _nextFetchIndex - 1 if all remaining entries are after targetMs.
   */
  binarySearchTarget(t) {
    let n = this._nextFetchIndex, r = this.indexTable.length - 1, i = this._nextFetchIndex - 1;
    for (; n <= r; ) {
      const s = n + r >>> 1;
      this.indexTable[s].timeOffset <= t ? (i = s, n = s + 1) : r = s - 1;
    }
    return i;
  }
}
const ct = 15e3, Qr = 5e3, ei = 500;
function ti() {
  let e = K(y({ status: "idle" })), t = K(null), n = K(null), r = K(y({ paused: true, waiting: false, seeking: false })), i = K(0), s = K(1), a = K(0), u = null, f = null, l = null, o = null;
  const d = 5e3;
  let c = null;
  function v() {
    return new Promise((k) => setTimeout(k, 0));
  }
  async function p(k) {
    _(e, y({ status: "loading" })), _(t, null), _(n, null);
    try {
      _(t, y(await Kr(k))), _(n, y(await Xr(k, h(t).totalPdus))), h(t).duration === 0 && h(n).length > 0 && _(t, y({
        ...h(t),
        duration: h(n)[h(n).length - 1].timeOffset
      })), _(e, y({ status: "ready" }));
    } catch (I) {
      _(e, y({
        status: "error",
        message: I instanceof Error ? I.message : "Unknown error"
      }));
    }
  }
  function w(k) {
    _(e, y({ status: "error", message: k }));
  }
  function E(k, I) {
    h(n) && (o = k, l = new Jr(I, h(n), o));
  }
  async function b(k) {
    var _a;
    if (!l || !o) return;
    const I = ((_a = h(t)) == null ? void 0 : _a.duration) ?? 0;
    k = Math.max(0, Math.min(k, I)), c == null ? void 0 : c.abort();
    const g = new AbortController();
    c = g;
    const { signal: P } = g;
    u !== null && (cancelAnimationFrame(u), u = null), _(r, y({
      ...h(r),
      seeking: true,
      waiting: true
    }));
    let O = h(i);
    k < h(i) && (o.reset(), l.reset(), O = 0, _(a, 0)), _(i, y(k)), o.setUpdateCanvas(false);
    try {
      let z = O;
      for (; z < k; ) {
        if (P.aborted) return;
        const H = Math.min(z + d, k);
        if (await l.fetchUntilTime(H), P.aborted || (_(a, y(l.nextUnfetchedTimestamp)), o.renderTill(H), z = H, await v(), P.aborted)) return;
      }
      o.setUpdateCanvas(true), o.forceRedraw(), _(a, y(l.nextUnfetchedTimestamp));
    } catch (z) {
      if (P.aborted) return;
      _(e, y({
        status: "error",
        message: z instanceof Error ? z.message : "Seek failed"
      })), _(r, y({
        ...h(r),
        seeking: false,
        waiting: false,
        paused: true
      }));
      return;
    } finally {
      P.aborted || (o == null ? void 0 : o.setUpdateCanvas(true));
    }
    P.aborted || (_(r, y({
      ...h(r),
      seeking: false,
      waiting: false
    })), h(r).paused || (f = performance.now(), u = requestAnimationFrame(N)));
  }
  async function x() {
    if (!(!l || !o)) {
      _(r, y({
        ...h(r),
        paused: false,
        waiting: true
      }));
      try {
        await l.fetchUntilTime(h(i) + ct), _(a, y(l.nextUnfetchedTimestamp));
      } catch (k) {
        _(e, y({
          status: "error",
          message: k instanceof Error ? k.message : "Failed to fetch PDUs"
        })), _(r, y({
          ...h(r),
          paused: true,
          waiting: false
        }));
        return;
      }
      !h(r).paused && !h(r).seeking ? (_(r, y({ ...h(r), waiting: false })), f = performance.now(), u = requestAnimationFrame(N)) : h(r).seeking || _(r, y({ ...h(r), waiting: false }));
    }
  }
  function D() {
    u !== null && (cancelAnimationFrame(u), u = null), _(r, y({ ...h(r), paused: true }));
  }
  function F() {
    return o !== null && l !== null && !h(r).seeking;
  }
  function $() {
    F() && (h(r).paused ? x() : D());
  }
  function B(k) {
    _(s, y(k));
  }
  function N(k) {
    var _a;
    if (!l || !o || f === null) return;
    const I = ((_a = h(t)) == null ? void 0 : _a.duration) ?? 0, g = k - f;
    if (f = k, _(i, y(Math.min(h(i) + g * h(s), I))), o.renderTill(h(i)), h(i) >= I) {
      u !== null && (cancelAnimationFrame(u), u = null), _(r, y({ ...h(r), paused: true }));
      return;
    }
    const P = l.nextUnfetchedTimestamp - h(i);
    if (P <= ei) {
      u !== null && (cancelAnimationFrame(u), u = null), _(r, y({ ...h(r), waiting: true })), l.fetchUntilTime(h(i) + ct).then(() => {
        _(a, y(l.nextUnfetchedTimestamp)), !h(r).paused && !h(r).seeking ? (_(r, y({ ...h(r), waiting: false })), f = performance.now(), u = requestAnimationFrame(N)) : h(r).seeking || _(r, y({ ...h(r), waiting: false }));
      }).catch((O) => {
        _(e, y({
          status: "error",
          message: O instanceof Error ? O.message : "Failed to fetch PDUs"
        })), _(r, y({
          ...h(r),
          waiting: false,
          paused: true
        }));
      });
      return;
    }
    P < Qr && l.fetchUntilTime(h(i) + ct).then(() => {
      _(a, y(l.nextUnfetchedTimestamp));
    }), u = requestAnimationFrame(N);
  }
  return {
    get loadState() {
      return h(e);
    },
    get header() {
      return h(t);
    },
    get indexTable() {
      return h(n);
    },
    initialiseRecording: p,
    setLoadError: w,
    get playbackState() {
      return h(r);
    },
    get elapsed() {
      return h(i);
    },
    get speed() {
      return h(s);
    },
    get fetchedUntilMs() {
      return h(a);
    },
    // Playback controls
    canControlPlayback: F,
    play: x,
    pause: D,
    seek: b,
    togglePlayback: $,
    setSpeed: B,
    setWasmReplay: E
  };
}
function ni(e, t, n, r, i) {
  t() !== 0 && (_(n, true), _(r, y(i(e.clientX))));
}
var ri = /* @__PURE__ */ de('<div><div class="seekbar-track"><div class="seekbar-buffer"></div> <div class="seekbar-progress"></div> <div></div></div></div>');
function Nn(e, t) {
  lt(t, true);
  let n = U(t, "elapsed"), r = U(t, "duration"), i = U(t, "fetchedUntilMs"), s = U(t, "waiting"), a = U(t, "onseekend"), u = K(false), f = K(0), l;
  const o = /* @__PURE__ */ ne(() => h(u) ? h(f) : n()), d = /* @__PURE__ */ ne(() => r() > 0 ? Math.min(h(o) / r(), 1) * 100 : 0), c = /* @__PURE__ */ ne(() => r() > 0 ? Math.min(i() / r(), 1) * 100 : 0);
  function v($) {
    if (!l) return 0;
    const B = l.getBoundingClientRect();
    return Math.max(0, Math.min(($ - B.left) / B.width, 1)) * r();
  }
  ge(() => {
    if (!h(u)) return;
    function $(N) {
      _(f, y(v(N.clientX)));
    }
    function B(N) {
      _(u, false), a()(v(N.clientX));
    }
    return window.addEventListener("mousemove", $), window.addEventListener("mouseup", B), () => {
      window.removeEventListener("mousemove", $), window.removeEventListener("mouseup", B);
    };
  });
  var p = ri();
  let w;
  p.__mousedown = [
    ni,
    r,
    u,
    f,
    v
  ];
  var E = M(p), b = M(E), x = Z(b, 2), D = Z(x, 2);
  let F;
  return L(E), mt(E, ($) => l = $, () => l), L(p), Ue(() => {
    w = tt(p, 1, "seekbar", null, w, { interactive: r() > 0 }), $e(b, "style", `width: ${h(c) ?? ""}%`), $e(x, "style", `width: ${h(d) ?? ""}%`), F = tt(D, 1, "seekbar-head", null, F, { waiting: s() }), $e(D, "style", `left: ${h(d) ?? ""}%`);
  }), Q(e, p), ot({
    get elapsed() {
      return n();
    },
    set elapsed($) {
      n($), C();
    },
    get duration() {
      return r();
    },
    set duration($) {
      r($), C();
    },
    get fetchedUntilMs() {
      return i();
    },
    set fetchedUntilMs($) {
      i($), C();
    },
    get waiting() {
      return s();
    },
    set waiting($) {
      s($), C();
    },
    get onseekend() {
      return a();
    },
    set onseekend($) {
      a($), C();
    }
  });
}
Ut(["mousedown"]);
Lt(
  Nn,
  {
    elapsed: {},
    duration: {},
    fetchedUntilMs: {},
    waiting: {},
    onseekend: {}
  },
  [],
  [],
  true
);
function Zt(e) {
  const t = Math.floor(e / 1e3), n = Math.floor(t / 60), r = t % 60;
  return `${n}:${r.toString().padStart(2, "0")}`;
}
function ii(e, t, n, r) {
  t() ? n()() : r()();
}
var si = (e, t) => _(t, !h(t)), ai = (e, t, n) => t(h(n)), li = /* @__PURE__ */ de('<button role="menuitem"><span class="speed-popup-check"> </span> </button>'), oi = /* @__PURE__ */ de('<div class="speed-popup" role="menu"><div class="speed-popup-heading">Playback speed</div> <!></div>'), ui = /* @__PURE__ */ de('<div class="controls-bar"><div class="controls-left"><button class="play-btn"> </button> <span class="time-display"> </span></div> <div class="controls-right"><div class="speed-selector"><button class="speed-btn" aria-label="Playback speed"> </button> <!></div> <button class="fullscreen-btn"> </button></div></div>');
function In(e, t) {
  lt(t, true);
  const n = [3, 2, 1.75, 1.5, 1.25, 1];
  let r = U(t, "paused"), i = U(t, "waiting"), s = U(t, "canPlay"), a = U(t, "elapsed"), u = U(t, "duration"), f = U(t, "speed"), l = U(t, "isFullscreen"), o = U(t, "onplay"), d = U(t, "onpause"), c = U(t, "onspeedchange"), v = U(t, "onfullscreen"), p = K(false);
  function w(m) {
    c()(m), _(p, false);
  }
  function E(m) {
    return `${m}`;
  }
  function b(m, Y) {
    const ye = (ut) => {
      m.contains(ut.target) || Y();
    };
    return document.addEventListener("click", ye, true), {
      destroy() {
        document.removeEventListener("click", ye, true);
      }
    };
  }
  var x = ui(), D = M(x), F = M(D);
  F.__click = [ii, r, o, d];
  var $ = M(F, true);
  L(F);
  var B = Z(F, 2), N = M(B);
  L(B), L(D);
  var k = Z(D, 2), I = M(k), g = M(I);
  g.__click = [si, p];
  var P = M(g, true);
  L(g);
  var O = Z(g, 2);
  {
    var z = (m) => {
      var Y = oi(), ye = Z(M(Y), 2);
      Ur(ye, 17, () => n, Nr, (ut, Be) => {
        var Re = li();
        let Dt;
        Re.__click = [ai, w, Be];
        var ft = M(Re), Ln = M(ft, true);
        L(ft);
        var Mn = Z(ft);
        L(Re), Ue(
          (Dn) => {
            Dt = tt(Re, 1, "speed-popup-item", null, Dt, { active: h(Be) === f() }), me(Ln, h(Be) === f() ? "\u2713" : ""), me(Mn, ` ${Dn ?? ""}`);
          },
          [() => E(h(Be))]
        ), Q(ut, Re);
      }), L(Y), Q(m, Y);
    };
    Ae(O, (m) => {
      h(p) && m(z);
    });
  }
  L(I), Br(I, (m, Y) => b == null ? void 0 : b(m, Y), () => () => _(p, false));
  var H = Z(I, 2);
  H.__click = function(...m) {
    var _a;
    (_a = v()) == null ? void 0 : _a.apply(this, m);
  };
  var _e2 = M(H, true);
  return L(H), L(k), L(x), Ue(
    (m, Y, ye) => {
      F.disabled = !s(), $e(F, "aria-label", r() ? "Play" : "Pause"), me($, r() ? "\u25B6" : "\u23F8"), me(N, `${m ?? ""} / ${Y ?? ""}`), $e(g, "aria-expanded", h(p)), me(P, ye), $e(H, "aria-label", l() ? "Exit fullscreen" : "Enter fullscreen"), me(_e2, l() ? "\u2715" : "\u26F6");
    },
    [
      () => Zt(a()),
      () => Zt(u()),
      () => E(f())
    ]
  ), Q(e, x), ot({
    get paused() {
      return r();
    },
    set paused(m) {
      r(m), C();
    },
    get waiting() {
      return i();
    },
    set waiting(m) {
      i(m), C();
    },
    get canPlay() {
      return s();
    },
    set canPlay(m) {
      s(m), C();
    },
    get elapsed() {
      return a();
    },
    set elapsed(m) {
      a(m), C();
    },
    get duration() {
      return u();
    },
    set duration(m) {
      u(m), C();
    },
    get speed() {
      return f();
    },
    set speed(m) {
      f(m), C();
    },
    get isFullscreen() {
      return l();
    },
    set isFullscreen(m) {
      l(m), C();
    },
    get onplay() {
      return o();
    },
    set onplay(m) {
      o(m), C();
    },
    get onpause() {
      return d();
    },
    set onpause(m) {
      d(m), C();
    },
    get onspeedchange() {
      return c();
    },
    set onspeedchange(m) {
      c(m), C();
    },
    get onfullscreen() {
      return v();
    },
    set onfullscreen(m) {
      v(m), C();
    }
  });
}
Ut(["click"]);
Lt(
  In,
  {
    paused: {},
    waiting: {},
    canPlay: {},
    elapsed: {},
    duration: {},
    speed: {},
    isFullscreen: {},
    onplay: {},
    onpause: {},
    onspeedchange: {},
    onfullscreen: {}
  },
  [],
  [],
  true
);
var fi = /* @__PURE__ */ de('<p class="loading-text">Loading recording...</p>'), ci = /* @__PURE__ */ de('<p class="error"> </p>'), di = (e, t) => t.togglePlayback(), hi = /* @__PURE__ */ de('<div class="buffering-overlay"><span class="buffering-label">Buffering...</span></div>'), vi = (e) => e.stopPropagation(), pi = /* @__PURE__ */ de("<div><!> <!></div>"), _i = /* @__PURE__ */ de('<div class="replay-player"><!> <div class="canvas-container"><!> <canvas></canvas> <!></div></div>');
const gi = {
  hash: "svelte-1arxerz",
  code: `
    /* All styles are :global because:
       1. Sub-component classes (SeekBar, PlaybackControls) live in separate Svelte files
          and would be stripped by the scoping compiler if not marked global.
       2. shadow: 'none' means styles inject into document <head>, not a shadow root,
          so global rules reach child elements correctly. */.replay-player {background:#000;position:relative;font-family:system-ui, -apple-system, sans-serif;width:100%;height:100%;display:flex;flex-direction:column;}.loading-text {color:rgba(255, 255, 255, 0.5);padding:12px 16px;margin:0;font-size:14px;font-family:monospace;}.error {color:#f87171;padding:12px 16px;margin:0;font-size:14px;}.canvas-container {position:relative;flex:1;min-height:0;width:100%;background:#000;display:flex;align-items:center;justify-content:center;overflow:hidden;}.canvas-container canvas {display:block;max-width:100%;max-height:100%;width:auto;height:auto;}.buffering-overlay {position:absolute;inset:0;display:flex;align-items:center;justify-content:center;background:rgba(0, 0, 0, 0.5);z-index:3;}.buffering-label {color:#fff;font-size:18px;font-weight:500;}.controls-overlay {position:absolute;bottom:0;left:0;right:0;background:linear-gradient(to top, rgba(0, 0, 0, 0.88) 0%, transparent 100%);padding:32px 16px 12px;z-index:2;transition:opacity 0.3s ease;}.controls-overlay.hidden {opacity:0;pointer-events:none;}

    /* Seekbar */.seekbar {width:100%;padding:16px 0;cursor:default;box-sizing:border-box;}.seekbar-track {position:relative;width:100%;height:4px;background:rgba(255, 255, 255, 0.15);border-radius:2px;overflow:visible;transition:height 0.15s ease;}.seekbar.interactive {cursor:pointer;}.seekbar.interactive:hover .seekbar-track {height:6px;}.seekbar-buffer {position:absolute;left:0;top:0;height:100%;background:rgba(255, 255, 255, 0.3);border-radius:2px;pointer-events:none;}.seekbar-progress {position:absolute;left:0;top:0;height:100%;background:#4a9eff;border-radius:2px;pointer-events:none;}.seekbar-head {position:absolute;top:50%;width:12px;height:12px;background:#4a9eff;border-radius:50%;transform:translate(-50%, -50%);pointer-events:none;transition:opacity 0.15s ease, width 0.15s ease, height 0.15s ease;box-shadow:0 0 4px rgba(74, 158, 255, 0.6);}.seekbar.interactive:hover .seekbar-head {width:16px;height:16px;}.seekbar-head.waiting {opacity:0.5;}

    /* PlaybackControls */.controls-bar {display:flex;align-items:center;justify-content:space-between;padding:6px 0;}.controls-left {display:flex;align-items:center;gap:10px;}.controls-right {display:flex;align-items:center;gap:8px;}.play-btn {width:32px;height:32px;border-radius:50%;background:transparent;color:#fff;border:none;font-size:13px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:background 0.15s ease;}.play-btn:hover:not(:disabled) {background:rgba(255, 255, 255, 0.15);}.play-btn:disabled {opacity:0.4;cursor:not-allowed;}.time-display {font-size:13px;color:#ccc;white-space:nowrap;font-variant-numeric:tabular-nums;font-family:monospace;}.speed-selector {position:relative;}.speed-btn {font-size:12px;color:#ccc;background:transparent;border:1px solid rgba(255, 255, 255, 0.25);border-radius:4px;padding:3px 8px;cursor:pointer;white-space:nowrap;transition:border-color 0.15s ease, color 0.15s ease;}.speed-btn:hover {border-color:rgba(255, 255, 255, 0.5);color:#fff;}.speed-popup {position:absolute;bottom:calc(100% + 4px);right:0;background:#1c1c1c;border:1px solid rgba(255, 255, 255, 0.1);border-radius:8px;box-shadow:0 4px 16px rgba(0, 0, 0, 0.6);overflow:hidden;z-index:10;min-width:180px;}.speed-popup-heading {padding:12px 16px 10px;font-size:14px;font-weight:500;color:#fff;border-bottom:1px solid rgba(255, 255, 255, 0.1);white-space:nowrap;}.speed-popup-item {display:flex;align-items:center;width:100%;padding:10px 16px;font-size:14px;color:#ccc;background:transparent;border:none;cursor:pointer;white-space:nowrap;text-align:left;gap:10px;}.speed-popup-item:hover {background:rgba(255, 255, 255, 0.06);}.speed-popup-item.active {color:#fff;}.speed-popup-check {width:14px;font-size:13px;color:#fff;flex-shrink:0;}.fullscreen-btn {font-size:16px;background:transparent;border:none;color:#ccc;cursor:pointer;padding:4px 6px;border-radius:4px;line-height:1;transition:color 0.15s ease;}.fullscreen-btn:hover {color:#fff;}.replay-player:fullscreen,
    .replay-player:-webkit-full-screen {width:100vw;height:100vh;display:flex;flex-direction:column;}.replay-player:fullscreen .canvas-container,
    .replay-player:-webkit-full-screen .canvas-container {flex:1;height:100%;}.replay-player:fullscreen canvas,
    .replay-player:-webkit-full-screen canvas {max-width:100%;max-height:100%;width:auto;height:auto;}`
};
function Un(e, t) {
  lt(t, true), Dr(e, gi);
  let n = U(t, "url"), r = U(t, "module");
  const i = ti();
  let s, a, u = K(false), f = null, l = K(false), o = K(true), d = null;
  ge(() => () => {
    d && clearTimeout(d), f == null ? void 0 : f.free(), f = null;
  });
  function c() {
    _(o, true), d && clearTimeout(d), i.playbackState.paused || (d = setTimeout(
      () => {
        _(o, false);
      },
      3e3
    ));
  }
  ge(() => {
    n() && i.initialiseRecording(n());
  }), ge(() => {
    i.loadState.status === "loading" && (f == null ? void 0 : f.free(), f = null, _(u, false));
  }), ge(() => {
    if (i.loadState.status !== "ready" || !s || h(u)) return;
    let g;
    try {
      g = new (r()).Replay(s);
    } catch (O) {
      console.error("Failed to construct WASM Replay engine:", O), i.setLoadError(O instanceof Error ? O.message : "WASM init failed");
      return;
    }
    f = g, i.setWasmReplay(g, n()), _(u, true);
    const P = {
      load: (O) => i.initialiseRecording(O),
      togglePlayback: () => i.togglePlayback(),
      seek: (O) => i.seek(O),
      setSpeed: (O) => i.setSpeed(O),
      getElapsedMs: () => i.elapsed,
      getDurationMs: () => {
        var _a;
        return ((_a = i.header) == null ? void 0 : _a.duration) ?? 0;
      },
      isPaused: () => i.playbackState.paused
    };
    a.dispatchEvent(new CustomEvent("ready", {
      detail: { playerApi: P },
      bubbles: true,
      composed: true
    }));
  }), ge(() => {
    const g = () => {
      _(l, document.fullscreenElement === a);
    };
    return document.addEventListener("fullscreenchange", g), () => document.removeEventListener("fullscreenchange", g);
  }), ge(() => {
    i.playbackState.paused ? (d && (clearTimeout(d), d = null), _(o, true)) : c();
  });
  function v() {
    document.fullscreenElement ? document.exitFullscreen() : a.requestFullscreen();
  }
  const p = /* @__PURE__ */ ne(() => i.playbackState.waiting), w = /* @__PURE__ */ ne(() => i.canControlPlayback());
  var E = _i(), b = M(E);
  {
    var x = (g) => {
      var P = fi();
      Q(g, P);
    }, D = (g) => {
      var P = Fr(), O = dr(P);
      {
        var z = (H) => {
          var _e2 = ci(), m = M(_e2);
          L(_e2), Ue(() => me(m, `Error: ${i.loadState.message ?? ""}`)), Q(H, _e2);
        };
        Ae(
          O,
          (H) => {
            i.loadState.status === "error" && H(z);
          },
          true
        );
      }
      Q(g, P);
    };
    Ae(b, (g) => {
      i.loadState.status === "loading" || i.loadState.status === "ready" && !h(u) ? g(x) : g(D, false);
    });
  }
  var F = Z(b, 2);
  F.__mousemove = c, F.__click = [di, i];
  var $ = M(F);
  {
    var B = (g) => {
      var P = hi();
      Q(g, P);
    };
    Ae($, (g) => {
      h(p) && g(B);
    });
  }
  var N = Z($, 2);
  mt(N, (g) => s = g, () => s);
  var k = Z(N, 2);
  {
    var I = (g) => {
      var P = pi();
      let O;
      P.__click = [vi];
      var z = M(P);
      const H = /* @__PURE__ */ ne(() => {
        var _a;
        return ((_a = i.header) == null ? void 0 : _a.duration) ?? 0;
      });
      Nn(z, {
        get elapsed() {
          return i.elapsed;
        },
        get duration() {
          return h(H);
        },
        get fetchedUntilMs() {
          return i.fetchedUntilMs;
        },
        get waiting() {
          return i.playbackState.waiting;
        },
        onseekend: (Y) => i.seek(Y)
      });
      var _e2 = Z(z, 2);
      const m = /* @__PURE__ */ ne(() => {
        var _a;
        return ((_a = i.header) == null ? void 0 : _a.duration) ?? 0;
      });
      In(_e2, {
        get paused() {
          return i.playbackState.paused;
        },
        get waiting() {
          return i.playbackState.waiting;
        },
        get canPlay() {
          return h(w);
        },
        get elapsed() {
          return i.elapsed;
        },
        get duration() {
          return h(m);
        },
        get speed() {
          return i.speed;
        },
        get isFullscreen() {
          return h(l);
        },
        onplay: () => i.play(),
        onpause: () => i.pause(),
        onspeedchange: (Y) => i.setSpeed(Y),
        onfullscreen: v
      }), L(P), Ue(() => O = tt(P, 1, "controls-overlay", null, O, { hidden: !h(o) })), Q(g, P);
    };
    Ae(k, (g) => {
      i.loadState.status === "ready" && h(u) && g(I);
    });
  }
  return L(F), L(E), mt(E, (g) => a = g, () => a), Q(e, E), ot({
    get url() {
      return n();
    },
    set url(g) {
      n(g), C();
    },
    get module() {
      return r();
    },
    set module(g) {
      r(g), C();
    }
  });
}
Ut(["mousemove", "click"]);
customElements.define("iron-replay-player", Lt(Un, { url: {}, module: {} }, [], [], false));
const mi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Un
}, Symbol.toStringTag, { value: "Module" }));
export {
  mi as default,
  Kr as fetchHeader,
  Xr as fetchIndexTable
};
