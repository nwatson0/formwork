// Offline generator (v3): builds the mannequin from the CC0 MakeHuman base mesh.
//   1. loads the base mesh + shape targets (athletic male), rig joints and painted skin weights
//   2. warps it onto the app's own skeleton (bind pose from the pose solver)
//   3. bakes a gripping-hand morph, Catmull-Clark subdivides, paints the muscle map, shorts mask and cavity shading
//   4. writes body.js (quantised, base64) for the runtime in stage.js
// The MakeHuman assets (mesh, targets, rig, weights) are CC0 1.0 — see mh/LICENSE.md
const fs = require('fs');
const { load } = require('./mhlib.js');
const ENG = new Function(fs.readFileSync(__dirname + '/engine.js', 'utf8') + ';return {add, sub, mul, madd, dot, cross, norm, vlen, mid, solvePose, rotAxis, DIM, D2R};')();
const { add, sub, mul, madd, dot, cross, norm, vlen, mid, solvePose, rotAxis, DIM, D2R } = ENG;
const OPT = Object.fromEntries(process.argv.slice(2).map(a => a.split('=')));
const SUBDIV = +(OPT.sub ?? 1);
const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const mirV = v => [-v[0], v[1], v[2]];

/* ---------- 1. source mesh ---------- */
const MUSC = +(OPT.muscle ?? 1), PROP_T = +(OPT.prop ?? 0.3), DET = +(OPT.det ?? 1);
const LR = (n, w) => [['l-' + n, w], ['r-' + n, w]];
const M = load([
  ['universal-male-young-maxmuscle-averageweight', MUSC],
  ['caucasian-male-young', 1 / 3], ['african-male-young', 1 / 3], ['asian-male-young', 1 / 3],
  ['male-young-maxmuscle-averageweight-idealproportions', PROP_T],
  // sculpted detail: chest, lats, shoulders, arms, legs, midsection
  ['torso-muscle-pectoral-incr', +(OPT.pec ?? 1) * DET], ['torso-muscle-dorsi-incr', +(OPT.lat ?? 1) * DET], ['torso-vshape-incr', +(OPT.vee ?? .45) * DET],
  ...LR('upperarm-muscle-incr', +(OPT.uarm ?? 1) * DET), ...LR('upperarm-shoulder-muscle-incr', +(OPT.delt ?? 1) * DET), ...LR('lowerarm-muscle-incr', +(OPT.farm ?? .8) * DET),
  ...LR('upperleg-muscle-incr', +(OPT.thigh ?? 1) * DET), ...LR('lowerleg-muscle-incr', +(OPT.calf ?? 1) * DET),
  ['stomach-tone-incr', +(OPT.abs ?? 1) * DET], ['pelvis-tone-incr', +(OPT.pelv ?? .5) * DET], ['measure-neck-circ-incr', +(OPT.neck ?? .4) * DET],
  ['torso-scale-vert-incr', +(OPT.tall ?? 0)],
]);
const BIND = { root: [0, 1, 0], pel: [0, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, aL: { el: 40, az: 90, bend: 44 }, aR: { el: 40, az: 90, bend: 44 }, lL: { el: 6.5, az: 90, bend: 3 }, lR: { el: 6.5, az: 90, bend: 3 }, hands: 0 };
const J = solvePose(BIND);

// global similarity: hips and shoulders of the source land on the solver's hips and shoulders
const hb = n => M.bones[n];
const srcHip = hb('upperleg01.L').head, srcSh = hb('upperarm01.L').head;
const S0 = +(OPT.s ?? 1.03), ZOFF = +(OPT.zoff ?? 0.015);   // overall size of the source figure (limb lengths are then fitted bone by bone)
const hipS = srcHip[1] * .1, shS = srcSh[1] * .1;
const yMap = y => y < hipS ? J.hipL[1] + (y - hipS) * S0 : y < shS ? J.hipL[1] + (y - hipS) / (shS - hipS) * (J.shL[1] - J.hipL[1]) : J.shL[1] + (y - shS) * S0;
const G = p => [p[0] * 0.1 * S0, yMap(p[1] * .1), (p[2] - srcHip[2]) * 0.1 * S0 + J.hipL[2] - ZOFF];
const jh = n => G(hb(n).head), jt = n => G(hb(n).tail);
console.error('torso stretch', ((J.shL[1] - J.hipL[1]) / ((shS - hipS) * S0)).toFixed(3), 'src shoulder x', (srcSh[0] * .1 * S0).toFixed(3), 'hip x', (srcHip[0] * .1 * S0).toFixed(3));

/* ---------- 2. frames: source rig -> solver bind pose ---------- */
const fr = (o, y, zh) => { y = norm(y); const z = norm(sub(zh, mul(y, dot(zh, y)))); return { o, x: cross(y, z), y, z }; };
const HAND_TILT = 14 * D2R;      // the grip centre sits on the palm side of the wrist-to-knuckle line
const HAND_K = +(OPT.handk ?? 0.95);
function srcFrames(side) {
  const S = side, q = n => n + '.' + S;
  const sh = jh(q('upperarm01')), el = jh(q('lowerarm01')), wr = jh(q('wrist')), hip = jh(q('upperleg01')), kn = jh(q('lowerleg01')), an = jh(q('foot'));
  const mcp = [2, 3, 4, 5].map(f => jh(q('finger' + f + '-1')));
  const mc = mul(mcp.reduce(add), 1 / 4);
  const a = norm(sub(mc, wr)), tH = sub(mcp[0], mcp[3]); const t = norm(sub(tH, mul(a, dot(tH, a))));
  const n = S === 'L' ? cross(a, t) : cross(t, a);
  const h = add(mul(a, Math.cos(HAND_TILT)), mul(n, Math.sin(HAND_TILT)));
  const bHint = sub(wr, el);
  return {
    uarm: fr(sh, sub(el, sh), bHint), farm: fr(el, sub(wr, el), sub(bHint, mul(norm(sub(el, sh)), 0))), hand: fr(wr, h, t),
    thigh: fr(hip, sub(kn, hip), [0, 0, 1]), shin: fr(kn, sub(an, kn), [0, 0, 1]), foot: fr(an, [0, 0, 1], [0, 1, 0]),
    len: { uarm: vlen(sub(el, sh)), farm: vlen(sub(wr, el)), thigh: vlen(sub(kn, hip)), shin: vlen(sub(an, kn)) },
    pts: { sh, el, wr, hip, kn, an, mc, a, t, n }
  };
}
function dstFrames(A, Lg) {
  // forearm frame z: in-plane perpendicular on the flexion side
  return {
    uarm: fr(A.base, A.d, A.b), farm: fr(A.j1, A.c, A.pf), hand: fr(A.wrist, A.h, A.t),
    thigh: fr(Lg.base, Lg.d, mul(Lg.b, -1)), shin: fr(Lg.j1, Lg.c, mul(Lg.pf, -1)), foot: fr(Lg.ankle, Lg.fd, Lg.fu),
    len: { uarm: DIM.ua, farm: DIM.fa, thigh: DIM.th, shin: DIM.sh }
  };
}
// source forearm frame must use the same "flexion side" convention as the solver: b = forearm component perpendicular to the upper arm
function fixFarm(F) { const d = F.uarm.y, c = F.farm.y; let b = sub(c, mul(d, dot(c, d))); b = norm(b); F.uarm = fr(F.uarm.o, d, b); F.farm = fr(F.farm.o, c, b); return F; }
const SRC = { L: fixFarm(srcFrames('L')), R: fixFarm(srcFrames('R')) };
const DST = { L: dstFrames(J.armL, J.legL), R: dstFrames(J.armR, J.legR) };
const mapper = (A, B, sy = 1, k = 1) => p => { const d = sub(p, A.o); const lx = dot(d, A.x) * k, ly = dot(d, A.y) * sy * k, lz = dot(d, A.z) * k; return [B.o[0] + B.x[0] * lx + B.y[0] * ly + B.z[0] * lz, B.o[1] + B.x[1] * lx + B.y[1] * ly + B.z[1] * lz, B.o[2] + B.x[2] * lx + B.y[2] * ly + B.z[2] * lz]; };
const WARP = {};
for (const S of ['L', 'R']) {
  const a = SRC[S], b = DST[S];
  WARP['uarm' + S] = mapper(a.uarm, b.uarm, b.len.uarm / a.len.uarm); WARP['farm' + S] = mapper(a.farm, b.farm, b.len.farm / a.len.farm);
  WARP['hand' + S] = mapper(a.hand, b.hand, 1, HAND_K);
  WARP['thigh' + S] = mapper(a.thigh, b.thigh, b.len.thigh / a.len.thigh); WARP['shin' + S] = mapper(a.shin, b.shin, b.len.shin / a.len.shin);
  WARP['foot' + S] = mapper(a.foot, b.foot);
}
console.error('axial scales', ['uarm', 'farm', 'thigh', 'shin'].map(k => k + ' ' + (DST.L.len[k] / SRC.L.len[k]).toFixed(3)).join('  '));

// toe hinge (ball of the foot) in the solver's foot frame
const TOE_PIVOT = (() => { const m = mul([1, 2, 3, 4, 5].map(f => WARP.footL(jh('toe' + f + '-1.L'))).reduce(add), 1 / 5); const F = DST.L.foot, d = sub(m, F.o); return [dot(d, F.x), dot(d, F.y), dot(d, F.z)]; })();
console.error('toe pivot (foot frame)', TOE_PIVOT.map(v => v.toFixed(3)).join(' '));
/* ---------- runtime bones + how the source rig maps onto them ---------- */
const BONES = ['pelvis', 'lumbar', 'chest', 'neck', 'head', 'clavL', 'clavR', 'uarmL', 'uarmR', 'farmL', 'farmR', 'handL', 'handR', 'thighL', 'thighR', 'shinL', 'shinR', 'footL', 'footR', 'uarmSwL', 'uarmSwR', 'farmTwL', 'farmTwR', 'thighSwL', 'thighSwR', 'toeL', 'toeR'];
const BI = Object.fromEntries(BONES.map((b, i) => [b, i]));
function mapBone(name) {
  const m = name.match(/^(.*)\.([LR])$/); const base = m ? m[1] : name, S = m ? m[2] : '';
  const r = (rt, warp) => ({ rt, warp });
  if (base === 'root' || base === 'pelvis') return r({ pelvis: 1 });
  if (base === 'spine05') return r({ pelvis: .55, lumbar: .45 });
  if (base === 'spine04') return r({ lumbar: 1 });
  if (base === 'spine03') return r({ lumbar: .6, chest: .4 });
  if (base === 'spine02' || base === 'spine01' || base === 'breast') return r({ chest: 1 });
  if (base === 'neck01') return r({ chest: .45, neck: .55 });
  if (base === 'neck02') return r({ neck: 1 });
  if (base === 'neck03') return r({ neck: .45, head: .55 });
  if (base === 'clavicle') return r({ ['clav' + S]: 1 });
  if (base === 'shoulder01') return r({ ['clav' + S]: .5, ['uarmSw' + S]: .5 });
  if (base === 'upperarm01') return r({ ['uarmSw' + S]: 1 }, 'uarm' + S);
  if (base === 'upperarm02') return r({ ['uarm' + S]: 1 }, 'uarm' + S);
  if (base === 'lowerarm01') return r({ ['farm' + S]: 1 }, 'farm' + S);
  if (base === 'lowerarm02') return r({ ['farmTw' + S]: 1 }, 'farm' + S);
  if (base === 'wrist' || /^metacarpal|^finger/.test(base)) return r({ ['hand' + S]: 1 }, 'hand' + S);
  if (base === 'upperleg01') return r({ ['thighSw' + S]: 1 }, 'thigh' + S);
  if (base === 'upperleg02') return r({ ['thigh' + S]: 1 }, 'thigh' + S);
  if (/^lowerleg/.test(base)) return r({ ['shin' + S]: 1 }, 'shin' + S);
  if (base === 'foot') return r({ ['foot' + S]: 1 }, 'foot' + S);
  if (/^toe/.test(base)) return r({ ['toe' + S]: 1 }, 'foot' + S);
  return r({ head: 1 });   // head, jaw, eyes and all face bones
}

/* ---------- source vertices: weights, finger curl, warp ---------- */
const NV = M.V.length;
const vw = Array.from({ length: NV }, () => []);          // [boneName, w]
for (const b in M.W) for (const [i, w] of M.W[b]) if (w > 0) vw[i].push([b, w]);
const P0 = M.V.map(G);
// finger curl (grip) done in source space with the source rig
function curlXforms(S, amt) {
  const q = n => n + '.' + S, F = SRC[S], P = F.pts, X = {};
  const axisF = mul(P.t, -1);                     // flex toward the palm about the knuckle line
  const rotP = (p, o, ax, ang) => add(o, rotAxis(sub(p, o), ax, ang));
  const sgn = S === 'L' ? 1 : -1;
  // steps: per bone, list of [axis (rest space), angle]; axes ride along with the parent rotations
  const chain = (names, steps) => {
    let cur = { p: p => p, d: v => v };
    names.forEach((nm, i) => {
      const o0 = jh(nm), prev = cur, o = prev.p(o0), st = steps[i].map(([ax, ang, world]) => [world ? ax : prev.d(ax), ang]);
      const d = v => { let r = prev.d(v); for (const [ax, ang] of st) r = rotAxis(r, ax, ang); return r; };
      cur = { d, p: p => add(o, d(sub(p, o0))) }; X[nm] = cur.p;
    });
  };
  const fa = OPT.fing ? OPT.fing.split(',').map(Number) : [62, 86, 52];
  for (const f of [2, 3, 4, 5]) {
    const k = f === 5 ? 1.08 : f === 2 ? 0.96 : 1;
    chain([1, 2, 3].map(i => q('finger' + f + '-' + i)), fa.map(a => [[axisF, a * k * amt * D2R]]));
  }
  // thumb: swing under the palm to oppose the fingers, then flex across them
  const ta = OPT.thumb ? OPT.thumb.split(',').map(Number) : [62, 12, 30, 42];
  chain([1, 2, 3].map(i => q('finger1-' + i)), [
    [[P.a, sgn * ta[0] * amt * D2R], [P.t, ta[1] * amt * D2R, 1]],
    [[P.t, ta[2] * amt * D2R, 1]],
    [[P.t, ta[3] * amt * D2R, 1]]]);
  return X;
}
function lbs(P, X) { // blend source-rig transforms
  return P.map((p, i) => { let o = [0, 0, 0], tot = 0, any = false; for (const [b, w] of vw[i]) { const f = X[b]; if (f) any = true; const r = f ? f(p) : p; o[0] += r[0] * w; o[1] += r[1] * w; o[2] += r[2] * w; tot += w; } return any && tot > 0 ? mul(o, 1 / tot) : p; });
}
const XC = { ...curlXforms('L', 1), ...curlXforms('R', 1) };
const P1 = lbs(P0, XC);
const warpOf = {}, rtOf = {};
for (const b in M.bones) { const m = mapBone(b); warpOf[b] = m.warp ? WARP[m.warp] : null; rtOf[b] = m.rt; }
const warp = P => P.map((p, i) => { let o = [0, 0, 0], tot = 0; for (const [b, w] of vw[i]) { const f = warpOf[b]; const r = f ? f(p) : p; o[0] += r[0] * w; o[1] += r[1] * w; o[2] += r[2] * w; tot += w; } return tot > 0 ? mul(o, 1 / tot) : p; });
let posA = warp(P0), posB = warp(P1);
let WT = vw.map(l => { const a = new Float32Array(BONES.length); let tot = 0; for (const [b, w] of l) { const m = rtOf[b]; for (const k in m) { a[BI[k]] += w * m[k]; tot += w * m[k]; } } if (tot > 0) for (let i = 0; i < a.length; i++) a[i] /= tot; else a[BI.head] = 1; return a; });

/* ---------- faces (body + eyeballs), compacted ---------- */
const keep = new Set(['body', 'helper-l-eye', 'helper-r-eye']);
let quads = M.faces.filter(f => keep.has(f.g)).map(f => f.v);
const eyeV = new Set(); for (const f of M.faces) if (f.g && f.g.includes('eye') && keep.has(f.g)) f.v.forEach(i => eyeV.add(i));
{
  const used = new Map(); const np = [], npB = [], nw = [], isEye = [];
  const id = i => { if (!used.has(i)) { used.set(i, np.length); np.push(posA[i]); npB.push(posB[i]); nw.push(WT[i]); isEye.push(eyeV.has(i) ? 1 : 0); } return used.get(i); };
  quads = quads.map(f => f.map(id)); posA = np; posB = npB; WT = nw; var EYE = isEye;
}
console.error('source verts', posA.length, 'faces', quads.length, 'non-quads', quads.filter(f => f.length !== 4).length);

/* ---------- Catmull-Clark ---------- */
function subdivide(quads, attrs) {   // attrs: list of arrays of vectors (number[] / Float32Array)
  const n = attrs[0].length, ek = (a, b) => a < b ? a * 1048576 + b : b * 1048576 + a;
  const edges = new Map(); const vf = Array.from({ length: n }, () => []), ve = Array.from({ length: n }, () => []);
  quads.forEach((f, fi) => { for (let i = 0; i < f.length; i++) { const a = f[i], b = f[(i + 1) % f.length], k = ek(a, b); let e = edges.get(k); if (!e) { e = { a, b, f: [], id: 0 }; edges.set(k, e); ve[a].push(e); ve[b].push(e); } e.f.push(fi); vf[a].push(fi); } });
  let eid = 0; for (const e of edges.values()) e.id = eid++;
  const nf = quads.length, ne = edges.size;
  const comb = (arr, idxs, ws) => { const d = arr[0].length, o = new (arr[0].constructor === Float32Array ? Float32Array : Array)(d).fill(0); for (let j = 0; j < idxs.length; j++) { const v = arr[idxs[j]], w = ws[j]; for (let q = 0; q < d; q++) o[q] += v[q] * w; } return o; };
  const out = attrs.map(() => new Array(n + ne + nf));
  attrs.forEach((arr, ai) => {
    const fp = quads.map(f => comb(arr, f, f.map(() => 1 / f.length)));
    const ep = new Array(ne);
    for (const e of edges.values()) {
      if (e.f.length === 2) { const d = arr[0].length, o = comb(arr, [e.a, e.b], [.25, .25]); for (let q = 0; q < d; q++) o[q] += (fp[e.f[0]][q] + fp[e.f[1]][q]) * .25; ep[e.id] = o; }
      else ep[e.id] = comb(arr, [e.a, e.b], [.5, .5]);
    }
    for (let v = 0; v < n; v++) {
      const E = ve[v], Fs = vf[v], d = arr[0].length; const bnd = E.filter(e => e.f.length !== 2);
      let o;
      if (bnd.length >= 2) { o = comb(arr, [v], [.75]); for (const e of bnd.slice(0, 2)) { const u = e.a === v ? e.b : e.a; for (let q = 0; q < d; q++) o[q] += arr[u][q] * .125; } }
      else if (!E.length) o = comb(arr, [v], [1]);
      else {
        const k = E.length; o = comb(arr, [v], [(k - 2) / k]);
        for (const fi of Fs) for (let q = 0; q < d; q++) o[q] += fp[fi][q] / (k * Fs.length);
        for (const e of E) { const u = e.a === v ? e.b : e.a; for (let q = 0; q < d; q++) o[q] += (arr[v][q] + arr[u][q]) * .5 / (k * k); }
      }
      out[ai][v] = o;
    }
    for (const e of edges.values()) out[ai][n + e.id] = ep[e.id];
    for (let f = 0; f < nf; f++) out[ai][n + ne + f] = fp[f];
  });
  const nq = [];
  quads.forEach((f, fi) => { const m = f.length; for (let i = 0; i < m; i++) { const a = f[i], b = f[(i + 1) % m], p = f[(i + m - 1) % m]; nq.push([a, n + edges.get(ek(a, b)).id, n + ne + fi, n + edges.get(ek(p, a)).id]); } });
  return { quads: nq, attrs: out };
}
let EYEV = EYE.map(e => [e]);
for (let it = 0; it < SUBDIV; it++) { const r = subdivide(quads, [posA, posB, WT, EYEV]); quads = r.quads;[posA, posB, WT, EYEV] = r.attrs; }
const N = posA.length;
const tris = []; for (const f of quads) { tris.push(f[0], f[1], f[2], f[0], f[2], f[3]); }
console.error('final verts', N, 'tris', tris.length / 3);

/* ---------- smooth the chest to a plain mannequin surface ---------- */
{
  const nbq = Array.from({ length: N }, () => new Set());
  for (const f of quads) for (let i = 0; i < 4; i++) { nbq[f[i]].add(f[(i + 1) % 4]); nbq[f[(i + 1) % 4]].add(f[i]); }
  for (const sx of [1, -1]) {
    let tip = -1, bz = -9;
    for (let i = 0; i < N; i++) { const p = posA[i]; if (p[0] * sx > 0.07 && p[0] * sx < 0.15 && p[1] > 1.29 && p[1] < 1.38 && p[2] > bz) { bz = p[2]; tip = i; } }
    if (tip < 0) continue; const c = posA[tip], R = 0.03;
    const idx = []; for (let i = 0; i < N; i++) if (vlen(sub(posA[i], c)) < R) idx.push(i);
    for (let it = 0; it < 60; it++) { const np = idx.map(i => { const l = [...nbq[i]]; const o = [0, 0, 0]; for (const j of l) { o[0] += posA[j][0]; o[1] += posA[j][1]; o[2] += posA[j][2]; } const k = ss(R, R * .55, vlen(sub(posA[i], c))) * .6; return lerp(posA[i], mul(o, 1 / l.length), k); }); idx.forEach((i, q) => { const d = sub(np[q], posA[i]); posA[i] = np[q]; posB[i] = add(posB[i], d); }); }
  }
}
/* ---------- normals ---------- */
function normals(P) {
  const nr = Array.from({ length: N }, () => [0, 0, 0]);
  for (let i = 0; i < tris.length; i += 3) { const a = tris[i], b = tris[i + 1], c = tris[i + 2]; const n = cross(sub(P[b], P[a]), sub(P[c], P[a])); for (const v of [a, b, c]) { nr[v][0] += n[0]; nr[v][1] += n[1]; nr[v][2] += n[2]; } }
  return nr.map(norm);
}
const nrmA = normals(posA), nrmB = normals(posB);
// orientation sanity: normals should point away from the body centre line
{ let s = 0; for (let i = 0; i < N; i += 37) s += dot(nrmA[i], sub(posA[i], [0, posA[i][1], 0])); if (s < 0) { for (let i = 0; i < tris.length; i += 3) { const t = tris[i + 1]; tris[i + 1] = tris[i + 2]; tris[i + 2] = t; } nrmA.forEach(n => { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; }); nrmB.forEach(n => { n[0] = -n[0]; n[1] = -n[1]; n[2] = -n[2]; }); console.error('flipped winding'); } }

/* ---------- cavity shading (multi-scale concavity) ---------- */
const nb = Array.from({ length: N }, () => new Set());
for (const f of quads) for (let i = 0; i < 4; i++) { nb[f[i]].add(f[(i + 1) % 4]); nb[f[(i + 1) % 4]].add(f[i]); }
const NB = nb.map(s => [...s]);
function smoothField(F, it) { for (let k = 0; k < it; k++) { F = F.map((v, i) => { const l = NB[i]; if (!l.length) return v; const o = [0, 0, 0]; for (const j of l) { o[0] += F[j][0]; o[1] += F[j][1]; o[2] += F[j][2]; } return [(v[0] + o[0] / l.length) / 2, (v[1] + o[1] / l.length) / 2, (v[2] + o[2] / l.length) / 2]; }); } return F; }
const sm1 = smoothField(posA, 6), sm2 = smoothField(sm1, 24);
const cav = posA.map((p, i) => { const c1 = dot(nrmA[i], sub(sm1[i], p)), c2 = dot(nrmA[i], sub(sm2[i], p)); return Math.max(0, c1) / 0.0022 * .55 + Math.max(0, c2) / 0.0075 * .5 - Math.max(0, -c2) / 0.02 * .15; });
let AO = cav.map(c => Math.max(0.3, Math.min(1, 1 - 0.42 * Math.min(1.5, Math.max(-0.4, c)))));
{ // light blur so it reads as soft shading
  for (let k = 0; k < 2; k++) AO = AO.map((v, i) => { const l = NB[i]; if (!l.length) return v; let s = 0; for (const j of l) s += AO[j]; return (v + s / l.length) / 2; });
}

/* ---------- muscle map ---------- */
const MUSCLES = ['none', 'upper-chest', 'mid-chest', 'lower-chest', 'front-delts', 'side-delts', 'rear-delts', 'rotator-cuff', 'lats', 'upper-back', 'traps', 'lower-back', 'biceps-long', 'biceps-short', 'brachialis', 'triceps-long', 'triceps-lateral', 'forearm-flexors', 'forearm-extensors', 'upper-abs', 'lower-abs', 'obliques', 'serratus', 'glute-max', 'glute-med', 'quads', 'hamstrings', 'adductors', 'hip-flexors', 'gastrocnemius', 'soleus', 'tibialis'];
const MI = Object.fromEntries(MUSCLES.map((m, i) => [m, i]));
const paint = require('./muscle_map.js');
const { mus, musW, cloth } = paint({ N, posA, nrmA, WT, BI, J, EYEV, ENG, ss, MI, OPT });

/* ---------- skin weights: top 4 ---------- */
const SI = new Uint8Array(N * 4), SW = new Uint8Array(N * 4);
for (let i = 0; i < N; i++) {
  const a = [...WT[i]].map((w, b) => [b, w]).sort((x, y) => y[1] - x[1]).slice(0, 4); const tot = a.reduce((s, x) => s + x[1], 0) || 1;
  let r = 255; a.forEach(([b, w], q) => { const x = q === 3 ? r : Math.min(r, Math.round(w / tot * 255)); SI[i * 4 + q] = x > 0 ? b : 0; SW[i * 4 + q] = x; r -= x; });
  if (r > 0 && a.length) SW[i * 4] += r;
}

/* ---------- emit ---------- */
let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
for (const p of posA) for (let q = 0; q < 3; q++) { mn[q] = Math.min(mn[q], p[q]); mx[q] = Math.max(mx[q], p[q]); }
const Q = new Uint16Array(N * 3); posA.forEach((p, i) => { for (let q = 0; q < 3; q++) Q[i * 3 + q] = Math.round((p[q] - mn[q]) / (mx[q] - mn[q]) * 65535); });
const N8 = new Int8Array(N * 3); nrmA.forEach((n, i) => { for (let q = 0; q < 3; q++) N8[i * 3 + q] = Math.round(n[q] * 127); });
const A8 = new Uint8Array(N * 4); for (let i = 0; i < N; i++) { A8[i * 4] = Math.round(AO[i] * 255); A8[i * 4 + 1] = mus[i]; A8[i * 4 + 2] = Math.round(cloth[i] * 255); A8[i * 4 + 3] = Math.round(musW[i] * 255); }
// grip morph: sparse per hand
const MS = 0.12 / 32767;
function morphFor(S) {
  const hb = BI['hand' + S], idx = [], dp = [], dn = [];
  for (let i = 0; i < N; i++) { const d = sub(posB[i], posA[i]); if (vlen(d) < 1e-5 || WT[i][hb] < 0.02) continue; idx.push(i); for (let q = 0; q < 3; q++) { dp.push(Math.max(-32767, Math.min(32767, Math.round(d[q] / MS)))); dn.push(Math.round((nrmB[i][q] - nrmA[i][q]) * 63)); } }
  return { n: idx.length, idx: b64(new Uint16Array(idx)), dp: b64(new Int16Array(dp)), dn: b64(new Int8Array(dn)) };
}
function b64(a) { return Buffer.from(a.buffer, a.byteOffset, a.byteLength).toString('base64'); }
if (N >= 65536) throw new Error('too many vertices for 16-bit indices: ' + N);
const out = {
  v: 3, n: N, mn, mx, pos: b64(Q), nrm: b64(N8), att: b64(A8), si: b64(SI), sw: b64(SW), idx: b64(new Uint16Array(tris)), i32: false,
  bones: BONES, muscles: MUSCLES, bind: BIND, toePivot: TOE_PIVOT, morphScale: MS, morph: { L: morphFor('L'), R: morphFor('R') }
};
fs.writeFileSync(__dirname + '/body.json', JSON.stringify(out));
fs.writeFileSync(__dirname + '/body.js', 'const BODY_MESH=' + JSON.stringify(out) + ';\n');
console.error('bytes', JSON.stringify(out).length, 'muscle verts', mus.filter(x => x).length, 'cloth', cloth.filter(x => x > .5).length, 'morph', out.morph.L.n, out.morph.R.n);
