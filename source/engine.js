/* ===================== Mannequin engine =====================
   World: metres. y up, person faces +z, +x is the person's LEFT.
   Poses are solved with forward kinematics + two-bone IK, then
   drawn as shaded capsules on a canvas with painter's sorting.     */
const D2R = Math.PI / 180;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const madd = (a, b, s) => [a[0] + b[0] * s, a[1] + b[1] * s, a[2] + b[2] * s];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const vlen = a => Math.hypot(a[0], a[1], a[2]);
const norm = a => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
const mirrorX = v => [-v[0], v[1], v[2]];
function rotAxis(v, k, ang) {
  const c = Math.cos(ang), s = Math.sin(ang), kv = cross(k, v), kd = dot(k, v);
  return [v[0] * c + kv[0] * s + k[0] * kd * (1 - c), v[1] * c + kv[1] * s + k[1] * kd * (1 - c), v[2] * c + kv[2] * s + k[2] * kd * (1 - c)];
}
// frames {o,x,y,z}
const WORLD = { o: [0, 0, 0], x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
function fPitch(F, a) { const c = Math.cos(a), s = Math.sin(a); return { o: F.o, x: F.x, y: add(mul(F.y, c), mul(F.z, s)), z: add(mul(F.y, -s), mul(F.z, c)) }; }
function fTwist(F, a) { const c = Math.cos(a), s = Math.sin(a); return { o: F.o, y: F.y, z: add(mul(F.z, c), mul(F.x, s)), x: add(mul(F.x, c), mul(F.z, -s)) }; }
function fSide(F, a) { const c = Math.cos(a), s = Math.sin(a); return { o: F.o, z: F.z, y: add(mul(F.y, c), mul(F.x, s)), x: add(mul(F.x, c), mul(F.y, -s)) }; }
const dirW = (F, v) => [F.x[0] * v[0] + F.y[0] * v[1] + F.z[0] * v[2], F.x[1] * v[0] + F.y[1] * v[1] + F.z[1] * v[2], F.x[2] * v[0] + F.y[2] * v[1] + F.z[2] * v[2]];
const ptW = (F, v) => add(F.o, dirW(F, v));
const toLocal = (F, v) => [dot(v, F.x), dot(v, F.y), dot(v, F.z)];

const DIM = { lum: .22, tho: .28, neck: .08, head: .1, shW: .19, shDrop: .045, hipW: .1, hipDrop: .06, ua: .29, fa: .26, hand: .085, th: .44, sh: .43 };
const ARM2 = DIM.fa + DIM.hand;

function limbAngles(spec, F, base, s, kind) {
  const el = (spec.el ?? 0) * D2R, az = (spec.az ?? 0) * D2R, bend = (spec.bend ?? 0) * D2R, rot = (spec.rot ?? 0) * D2R;
  const dl = [s * Math.sin(el) * Math.sin(az), -Math.cos(el), Math.sin(el) * Math.cos(az)];
  let bl = kind === 'arm' ? [0, 0, 1] : [0, 0, -1];
  const A = cross([0, -1, 0], dl);
  if (vlen(A) > 1e-6) bl = rotAxis(bl, norm(A), el);
  else if (el > 1) bl = mul(bl, -1);
  if (rot) bl = rotAxis(bl, dl, s * rot);
  const d = norm(dirW(F, dl)), b = norm(dirW(F, bl));
  const L1 = kind === 'arm' ? DIM.ua : DIM.th, L2 = kind === 'arm' ? ARM2 : DIM.sh;
  const j1 = madd(base, d, L1);
  const c = add(mul(d, Math.cos(bend)), mul(b, Math.sin(bend)));
  return { base, j1, end: madd(j1, c, L2), d, b, c, th: bend };
}
function limbIK(spec, Fr, base, kind) {
  const L1 = kind === 'arm' ? DIM.ua : DIM.th, L2 = kind === 'arm' ? (spec.tw || spec.flat ? DIM.fa : ARM2) : DIM.sh;
  const T = spec.f === 'w' || !Fr ? spec.t : ptW(Fr, spec.t);
  const poleW = norm(spec.f === 'w' || !Fr ? spec.pole : dirW(Fr, spec.pole));
  const D = sub(T, base); let dist = vlen(D); const dh = norm(D);
  const maxR = L1 + L2 - 1e-3; const dd = Math.min(Math.max(dist, Math.abs(L1 - L2) + .01), maxR);
  const a = (L1 * L1 + dd * dd - L2 * L2) / (2 * dd), h = Math.sqrt(Math.max(0, L1 * L1 - a * a));
  let pp = sub(poleW, mul(dh, dot(poleW, dh)));
  if (vlen(pp) < 1e-5) pp = Math.abs(dh[1]) < .9 ? cross(dh, [0, 1, 0]) : cross(dh, [1, 0, 0]);
  pp = norm(pp);
  const j1 = add(madd(base, dh, a), mul(pp, h));
  const end = madd(base, dh, dd);
  const d = norm(sub(j1, base)), c = norm(sub(end, j1));
  let b = sub(c, mul(d, dot(c, d)));
  b = vlen(b) < 1e-4 ? mul(pp, -1) : norm(b);
  return { base, j1, end, d, b, c, th: Math.acos(Math.max(-1, Math.min(1, dot(d, c)))) };
}
const HAND_TILT = 14 * D2R;
function finishArm(A, spec, C) {
  // in-plane perpendicular and plane normal
  A.pn = norm(cross(A.d, A.b));
  A.pf = sub(mul(A.b, Math.cos(A.th)), mul(A.d, Math.sin(A.th)));
  const wr = (spec.wr ?? 0) * D2R;
  A.wrist = spec.tw || spec.flat ? A.end : madd(A.j1, A.c, DIM.fa);
  A.h = norm(add(mul(A.c, Math.cos(wr)), mul(A.pf, Math.sin(wr))));
  if (spec.flat) {
    // palm pressed on a surface: fingers along hd (default: toward the head), palm facing hn (default: down)
    const n = norm(spec.hn || [0, -1, 0]); let a = spec.hd || (C ? C.y : A.c); if (!spec.hd && vlen(sub(a, mul(n, dot(a, n)))) < .35) a = A.c; a = sub(a, mul(n, dot(a, n))); a = vlen(a) < 1e-3 ? [0, 0, 1] : norm(a);
    A.h = norm(add(mul(a, Math.cos(HAND_TILT)), mul(n, Math.sin(HAND_TILT)))); A.flatN = n;
  } else if (spec.hd) A.h = norm(spec.hd);
  A.grip = madd(A.wrist, A.h, DIM.hand);
  return A;
}
/* Hand roll. The thumb axis (line across the knuckles, pointing to the thumb side) decides how the palm faces.
   g: number = degrees of pronation from neutral (0 thumb toward the bend side, +90 palm down/back, -90 palm up),
      'over' / 'under' = both hands on one bar, [x,y,z] = thumb direction in the chest frame (x mirrored for the right). */
const GRIP_ANG = { neutral: 0, pro: 90, sup: -90, semi: -45, semipro: 45 };
function finishHand(A, s, g, C, other, spec) {
  let t;
  if (A.flatN || (spec && spec.hn)) { const n = A.flatN || norm(spec.hn); t = s > 0 ? cross(n, A.h) : cross(A.h, n); }
  else if (Array.isArray(g)) t = dirW(C, [g[0] * s, g[1], g[2]]);
  else if (g === 'over' || g === 'under') { t = mul(sub(other.grip, A.grip), g === 'over' ? 1 : -1); if (vlen(t) < .03) t = A.pf; }
  else { const a = (typeof g === 'number' ? g : GRIP_ANG[g] || 0) * D2R; t = add(mul(A.pf, Math.cos(a)), mul(A.pn, s * Math.sin(a))); }
  t = sub(t, mul(A.h, dot(t, A.h)));
  if (vlen(t) < 1e-3) { t = sub(A.pn, mul(A.h, dot(A.pn, A.h))); }
  A.t = norm(t);
  A.palm = s > 0 ? cross(A.h, A.t) : cross(A.t, A.h);
  // signed twist of the hand about the forearm, relative to neutral (drives the forearm twist bone)
  const tp = sub(A.t, mul(A.c, dot(A.t, A.c))), l = vlen(tp);
  A.tw = l < 1e-3 ? 0 : Math.atan2(dot(tp, A.pn) * s, dot(tp, A.pf));
  return A;
}
function finishLeg(G, spec, pel) {
  let fd;
  if (spec.fd) fd = norm(spec.fd);
  else if (spec.t) {
    let h = [pel.z[0], 0, pel.z[2]];
    fd = vlen(h) > .2 ? norm(h) : [0, 0, 1];
  } else {
    fd = norm(add(mul(G.b, -Math.cos(G.th)), mul(G.d, Math.sin(G.th))));
    const ank = (spec.ank ?? 0) * D2R;
    if (ank) fd = norm(add(mul(fd, Math.cos(ank)), mul(G.c, Math.sin(ank))));
  }
  const up = mul(G.c, -1);
  let fu = sub(up, mul(fd, dot(up, fd)));
  fu = vlen(fu) < 1e-4 ? [0, 1, 0] : norm(fu);
  G.ankle = G.end; G.fd = fd; G.fu = fu;
  G.pf = sub(mul(G.b, Math.cos(G.th)), mul(G.d, Math.sin(G.th)));
  G.heel = add(madd(G.ankle, fu, -.05), mul(fd, -.045));
  G.toe = add(madd(G.ankle, fu, -.058), mul(fd, .135));          // ball of the foot
  // toes stay flat on the ground when the heel lifts (auto near the floor, or forced with spec.toe in degrees)
  const down = Math.max(0, Math.min(1, -fd[1]));
  const near = 1 - Math.min(1, Math.max(0, (G.toe[1] - .05) / .08));
  G.toeBend = spec.toe != null ? spec.toe * D2R : Math.min(1.25, Math.asin(down)) * near;
  return G;
}
const ARM_DEF = { el: 6, az: 90, bend: 10 }, LEG_DEF = { el: 0, az: 2, bend: 3 };
function solveAt(P, root) {
  const deg = v => (v || 0) * D2R;
  const pe = P.pel || [0, 0, 0], lu = P.lum || [0, 0, 0], th = P.tho || [0, 0, 0];
  let F = { ...WORLD, o: root };
  F = fTwist(F, deg(pe[1])); F = fPitch(F, deg(pe[0])); F = fSide(F, deg(pe[2]));
  const pel = F;
  let L = fPitch(pel, deg(lu[0])); L = fSide(L, deg(lu[2])); L = fTwist(L, deg(lu[1]));
  const waist = madd(root, L.y, DIM.lum);
  let T = { ...L, o: waist }; T = fPitch(T, deg(th[0])); T = fSide(T, deg(th[2])); T = fTwist(T, deg(th[1]));
  const neckB = madd(waist, T.y, DIM.tho);
  const C = { ...T, o: neckB };
  const Hf = fPitch(C, deg(P.neck)); const neckTop = madd(neckB, Hf.y, DIM.neck);
  const headC = add(madd(neckTop, Hf.y, DIM.head), mul(Hf.z, .015));
  const shr = P.shrug || 0, pro = P.pro || 0;
  const sh = s => add(add(madd(neckB, C.x, s * DIM.shW), mul(C.y, -DIM.shDrop + .06 * shr)), mul(C.z, .05 * pro));
  const shL = sh(1), shR = sh(-1);
  const hip = s => add(madd(root, pel.x, s * DIM.hipW), mul(pel.y, -DIM.hipDrop));
  const hipL = hip(1), hipR = hip(-1);
  const frameFor = f => f === 'p' ? pel : f === 'w' ? null : C;
  const arm = (spec, base, s) => {
    spec = spec || ARM_DEF;
    const A = spec.t ? limbIK(spec, frameFor(spec.f), base, 'arm') : limbAngles(spec, C, base, s, 'arm');
    return finishArm(A, spec, C);
  };
  const leg = (spec, base, s) => {
    spec = spec || LEG_DEF;
    const G = spec.t ? limbIK({ ...spec, f: spec.f || 'w' }, frameFor(spec.f || 'w'), base, 'leg') : limbAngles(spec, pel, base, s, 'leg');
    return finishLeg(G, spec, pel);
  };
  const armL = arm(P.aL, shL, 1), armR = arm(P.aR, shR, -1);
  const gp = P.grip, gL = gp && typeof gp === 'object' && !Array.isArray(gp) ? gp.L : gp, gR = gp && typeof gp === 'object' && !Array.isArray(gp) ? gp.R : gp;
  finishHand(armL, 1, (P.aL && P.aL.g) ?? gL ?? 0, C, armR, P.aL); finishHand(armR, -1, (P.aR && P.aR.g) ?? gR ?? 0, C, armL, P.aR);
  const hd = P.hands, hOf = (spec, k) => (spec && spec.hc) ?? (hd && typeof hd === 'object' ? hd[k] : hd) ?? 1;
  armL.curl = P.aL && P.aL.flat ? (P.aL.hc ?? 0) : hOf(P.aL, 'L'); armR.curl = P.aR && P.aR.flat ? (P.aR.hc ?? 0) : hOf(P.aR, 'R');
  // half-way neck frame so the neck bends as a curve
  const Nf = fPitch(C, deg(P.neck) * .5);
  return {
    root, pel, L, T, C, H: Hf, N: Nf, waist, neckB, neckTop, headC, shL, shR, hipL, hipR,
    armL, armR, legL: leg(P.lL, hipL, 1), legR: leg(P.lR, hipR, -1)
  };
}
function jointPos(J, name) {
  switch (name) {
    case 'knees': return mid(J.legL.j1, J.legR.j1);
    case 'kneeL': return J.legL.j1; case 'kneeR': return J.legR.j1;
    case 'ankles': return mid(J.legL.ankle, J.legR.ankle);
    case 'ankleL': return J.legL.ankle; case 'ankleR': return J.legR.ankle;
    case 'toes': return mid(J.legL.toe, J.legR.toe);
    case 'grips': return mid(J.armL.grip, J.armR.grip);
    case 'shoulders': return mid(J.shL, J.shR);
    case 'elbowR': return J.armR.j1; case 'elbowL': return J.armL.j1;
    default: return J.root;
  }
}
function bodyMinY(J) {
  let m = Infinity;
  const lo = (p, r) => { m = Math.min(m, p[1] - r); };
  // torso sections: [centre, frame, front, back, side]
  const secs = [[madd(J.root, J.pel.y, -.07), J.pel, .12, .127, .16], [J.root, J.pel, .13, .11, .16], [J.waist, J.T, .125, .075, .14],
    [mid(J.waist, J.neckB), J.T, .16, .1, .19], [madd(J.neckB, J.T.y, -.06), J.T, .15, .1, .2], [J.neckB, J.T, .08, .085, .12]];
  for (const [c, F, f, b, sd] of secs) { lo(madd(c, F.z, f), 0); lo(madd(c, F.z, -b), 0); lo(madd(c, F.x, sd), 0); lo(madd(c, F.x, -sd), 0); lo(c, .07); }
  lo(J.headC, .1); lo(madd(J.headC, J.H.z, .1), 0);
  lo(J.shL, .07); lo(J.shR, .07);
  for (const A of [J.armL, J.armR]) { lo(A.j1, .042); lo(A.wrist, A.flatN ? .026 : .03); if (!A.flatN) lo(A.grip, .034); }
  for (const G of [J.legL, J.legR]) { lo(G.j1, .055); lo(G.heel, .03); lo(G.toe, .022); lo(mid(G.base, G.j1), .08); }
  return m;
}
function solvePose(P) {
  let root = P.root || [0, 1, 0];
  let J = solveAt(P, root);
  if (P.anchor) { root = add(root, sub(P.anchor.at, jointPos(J, P.anchor.j))); J = solveAt(P, root); }
  if (P.snap) { const m = bodyMinY(J); root = add(root, [0, -m + (P.snapGap || 0), 0]); J = solveAt(P, root); }
  return J;
}

/* ---------- interpolation ---------- */
function lerpPose(a, b, t) {
  if (typeof a === 'number' && typeof b === 'number') return a + (b - a) * t;
  if (Array.isArray(a)) return a.map((v, i) => lerpPose(v, b[i], t));
  if (a && typeof a === 'object') { const o = {}; for (const k in a) o[k] = (b && k in b) ? lerpPose(a[k], b[k], t) : a[k]; for (const k in b) if (!(k in o)) o[k] = b[k]; return o; }
  return t < .5 ? a : b;
}
const ease = t => .5 - .5 * Math.cos(Math.PI * t);

/* ---------- primitives ---------- */
// {k:'cap',a,b,r,c(colorKey),tag,side,bias} {k:'sph',p,r} {k:'box',p,ax:[3],h:[3]} {k:'disc',p,n,r} {k:'line',a,b,w}
const cap = (a, b, r, c, extra) => ({ k: 'cap', a, b, r, c, ...extra });
const sph = (p, r, c, extra) => ({ k: 'sph', p, r, c, ...extra });
const box = (p, ax, h, c, extra) => ({ k: 'box', p, ax, h, c, bias: -.25, ...extra });
const disc = (p, n, r, c, extra) => ({ k: 'disc', p, n: norm(n), r, c, ...extra });
const line = (a, b, w, c, extra) => ({ k: 'line', a, b, w, c, ...extra });
const AX = [[1, 0, 0], [0, 1, 0], [0, 0, 1]];
const segCap = (a, b, r, c, n, extra) => { const out = []; for (let i = 0; i < n; i++) out.push(cap(add(a, mul(sub(b, a), i / n)), add(a, mul(sub(b, a), (i + 1) / n)), r, c, extra)); return out; };

function bodyPrims(J) {
  const P = [];
  P.push(cap(J.hipL, J.hipR, .095, 'fig', { tag: 'pelvis' }));
  for (const s of [1, -1]) {
    const a = add(madd(J.root, J.L.x, s * .055), mul(J.L.y, .03));
    const b = madd(J.waist, J.T.x, s * .06);
    P.push(cap(a, b, .1, 'fig', { tag: 'abs' }));
    const c1 = add(madd(J.waist, J.T.x, s * .07), mul(J.T.y, .04));
    const c2 = add(madd(J.neckB, J.T.x, s * .085), mul(J.T.y, -.075));
    P.push(cap(c1, c2, .118, 'fig', { tag: 'chest' }));
  }
  P.push(cap(J.shL, J.shR, .052, 'fig', { tag: 'traps' }));
  P.push(cap(J.neckB, J.neckTop, .047, 'fig', { tag: 'neck' }));
  const H = J.H;
  P.push(cap(add(madd(J.headC, H.y, .03), mul(H.z, -.012)), add(madd(J.headC, H.y, -.035), mul(H.z, .028)), .097, 'fig', { tag: 'head' }));
  for (const [A, sh, side] of [[J.armL, J.shL, 'L'], [J.armR, J.shR, 'R']]) {
    P.push(sph(sh, .066, 'fig', { tag: 'delts', side }));
    P.push(cap(sh, A.j1, .046, 'fig', { tag: 'uarm', side }));
    P.push(sph(A.j1, .039, 'joint', { side }));
    P.push(cap(A.j1, A.wrist, .038, 'fig', { tag: 'farm', side }));
    P.push(cap(A.wrist, madd(A.grip, A.h, .012), .036, 'fig', { tag: 'hand', side }));
  }
  for (const [G, side] of [[J.legL, 'L'], [J.legR, 'R']]) {
    P.push(cap(G.base, G.j1, .072, 'fig', { tag: 'thigh', side }));
    P.push(sph(G.j1, .052, 'joint', { side }));
    P.push(cap(G.j1, G.ankle, .052, 'fig', { tag: 'shin', side }));
    P.push(cap(G.heel, G.toe, .036, 'fig', { tag: 'foot', side }));
  }
  return P;
}

/* ---------- common props (functions of joints) ---------- */
const PROP = {
  barbell(J, o = {}) {
    const a = J.armL.grip, b = J.armR.grip, c = mid(a, b), ax = norm(sub(a, b)), half = o.len ?? .95;
    const out = [];
    const L = madd(c, ax, half), R = madd(c, ax, -half);
    out.push(...segCap(R, L, o.r ?? .016, 'steel', 6));
    const plates = o.plates ?? 2, pr = o.pr ?? .225;
    for (const s of [1, -1]) {
      for (let i = 0; i < plates; i++) out.push(disc(madd(c, ax, s * (half - .3 + i * .055)), ax, pr - i * .0, i === 0 ? 'plate' : 'plate2', { th: .045 }));
      out.push(disc(madd(c, ax, s * (half - .34)), ax, .04, 'steelD', { th: .03 }));
    }
    return out;
  },
  ezbar(J) { return PROP.barbell(J, { len: .62, plates: 1, pr: .15 }); },
  smithBar(J) { return PROP.barbell(J, { len: .7, plates: 1, pr: .2 }); },
  bar(J, o = {}) { // simple handle bar between grips
    const a = J.armL.grip, b = J.armR.grip, c = mid(a, b), ax = norm(sub(a, b)), half = o.half ?? .3;
    return segCap(madd(c, ax, -half), madd(c, ax, half), .016, 'steel', 3);
  },
  db(A, axis, o = {}) {
    const hl = o.half ?? .16, r = o.r ?? .075;
    const out = [cap(madd(A.grip, axis, -hl), madd(A.grip, axis, hl), .017, 'steel')];
    for (const s of [1, -1]) out.push(disc(madd(A.grip, axis, s * (hl - .03)), axis, r, 'iron', { th: .06 }));
    return out;
  },
  dbs(J, grip, frame = 'c', o) { // the handle always runs across the knuckles (the hand's thumb axis)
    const out = [];
    for (const [A, s] of [[J.armL, 1], [J.armR, -1]]) {
      if (o && o.only && o.only !== (s > 0 ? 'L' : 'R')) continue;
      out.push(...PROP.db(A, A.t || A.pf, o));
    }
    return out;
  },
  db2(J, axis) { // one dumbbell held by both hands
    const c = mid(J.armL.grip, J.armR.grip);
    const ax = axis ? norm(axis) : norm(add(J.armL.c, J.armR.c));
    return [cap(madd(c, ax, -.13), madd(c, ax, .13), .02, 'steel'), disc(madd(c, ax, .12), ax, .095, 'iron', { th: .06 }), disc(madd(c, ax, -.12), ax, .095, 'iron', { th: .06 })];
  },
  kb(J, mode = 'down', which) {
    const g = which === 'L' ? J.armL.grip : which === 'R' ? J.armR.grip : mid(J.armL.grip, J.armR.grip);
    const dir = mode === 'arm' ? norm(add(J.armL.c, J.armR.c)) : [0, -1, 0];
    const c = madd(g, dir, .14);
    return [cap(g, madd(g, dir, .05), .02, 'iron'), sph(c, .1, 'iron')];
  },
  plate(J, nrm, r = .22) { const c = mid(J.armL.grip, J.armR.grip); return [disc(c, nrm, r, 'plate', { th: .04 }), disc(c, nrm, .05, 'plate2', { th: .045 })]; },
  medball(J, r = .12) { return [sph(mid(J.armL.grip, J.armR.grip), r, 'ball2')]; },
  cable(from, to, o = {}) {
    const out = [line(from, to, o.w ?? 1.6, o.c ?? 'cable', { bias: o.bias ?? 0 })];
    out.push(disc(to, o.pn ?? [1, 0, 0], .045, 'steelD', { th: .03 }));
    return out;
  },
  rope(J, to) {
    const a = J.armL.grip, b = J.armR.grip, m = mid(a, b);
    const knot = madd(m, norm(sub(to, m)), .14);
    return [line(a, knot, 4, 'rope'), line(b, knot, 4, 'rope'), ...PROP.cable(knot, to)];
  },
  band(a, b, c = 'band') { return [line(a, b, 3.2, c)]; },
  stack(p, h = 2.1) { // cable column
    return [box([p[0], h / 2, p[2]], AX, [.13, h / 2, .1], 'frame'), box([p[0], .45, p[2] + .0], AX, [.1, .3, .105], 'plateStack')];
  },
};
function benchFlat(c, len = 1.25, h = .44, opts = {}) { // c = [x,z] center of pad along z
  const [x, z] = c, out = [];
  out.push(box([x, h - .04, z], AX, [.14, .04, len / 2], 'pad'));
  for (const s of [1, -1]) out.push(cap([x, h - .08, z + s * (len / 2 - .12)], [x, .03, z + s * (len / 2 - .12)], .03, 'frame'), cap([x - .2, .02, z + s * (len / 2 - .12)], [x + .2, .02, z + s * (len / 2 - .12)], .025, 'frame'));
  return out;
}
function benchAcross(c, len = 1.1, h = .44) { // bench running along x
  const [x, z] = c, out = [];
  out.push(box([x, h - .04, z], AX, [len / 2, .04, .14], 'pad'));
  for (const s of [1, -1]) out.push(cap([x + s * (len / 2 - .12), h - .08, z], [x + s * (len / 2 - .12), .03, z], .03, 'frame'));
  return out;
}
function padAlong(p0, u, n, len, w = .14, t = .04, c = 'pad') { // pad whose length runs along u, surface normal n, starting at p0
  const ctr = add(madd(p0, u, len / 2), mul(n, -t));
  return box(ctr, [[1, 0, 0], u, n], [w, len / 2, t], c);
}

/* ---------- renderer ---------- */
function hexToRgb(h) { h = h.trim(); if (h.startsWith('rgb')) { const m = h.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]]; } if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; const n = parseInt(h.slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
const rgbStr = (c, a = 1) => `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
const mixC = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const shadeC = (c, f) => f >= 1 ? mixC(c, [255, 255, 255], Math.min(1, f - 1)) : mul(c, f);

const PALETTE_KEYS = { fig: '--fig', figLine: '--fig-line', joint: '--fig-joint', work: '--work', assist: '--assist', steel: '--steel', steelD: '--steel-d', iron: '--iron', plate: '--plate', plate2: '--plate-2', pad: '--pad', frame: '--frame', cable: '--cable', rope: '--rope', band: '--band', ball: '--ball', ball2: '--ball-2', floor: '--floor', floorLine: '--floor-line', stage: '--stage', plateStack: '--plate-stack', shadow: '--shadow', strap: '--strap', wall: '--wall', mat: '--mat' };
function readPalette(el) {
  const cs = getComputedStyle(el || document.documentElement), P = {};
  for (const k in PALETTE_KEYS) { const v = cs.getPropertyValue(PALETTE_KEYS[k]); P[k] = hexToRgb(v || '#888'); }
  return P;
}

class Camera {
  constructor(yaw = 60, pitch = 10) { this.yaw = yaw; this.pitch = pitch; }
  setup() { const y = this.yaw * D2R, p = this.pitch * D2R; this.cy = Math.cos(y); this.sy = Math.sin(y); this.cp = Math.cos(p); this.sp = Math.sin(p); }
  rot(v) { const x1 = v[0] * this.cy + v[2] * this.sy, z1 = -v[0] * this.sy + v[2] * this.cy; return [x1, v[1] * this.cp - z1 * this.sp, z1 * this.cp + v[1] * this.sp]; }
}

function drawScene(ctx, W, H, prims, cam, fit, pal, hl, opts = {}) {
  cam.setup();
  const scale = fit.scale, cc = cam.rot(fit.center);
  const P = v => { const r = cam.rot(v); return [W / 2 + (r[0] - cc[0]) * scale, H * (opts.cy ?? .5) - (r[1] - cc[1]) * scale, r[2]]; };
  ctx.clearRect(0, 0, W, H);
  // floor disc
  const fc = [fit.center[0], 0, fit.center[2]], R = fit.floorR;
  drawDisc3(ctx, P, fc, [0, 1, 0], R, cam, scale, rgbStr(pal.floor), rgbStr(pal.floorLine), 1);
  ctx.save(); ctx.strokeStyle = rgbStr(pal.floorLine, .55); ctx.lineWidth = 1;
  for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; const d = [Math.cos(a) * R, 0, Math.sin(a) * R]; const p1 = P(add(fc, d)), p2 = P(sub(fc, d)); ctx.beginPath(); ctx.moveTo(p1[0], p1[1]); ctx.lineTo(p2[0], p2[1]); ctx.stroke(); }
  drawDisc3(ctx, P, fc, [0, 1, 0], R * .55, cam, scale, null, rgbStr(pal.floorLine, .55), 1);
  ctx.restore();
  // shadow
  if (opts.shadow) {
    const s = opts.shadow; const sp = P([s[0], 0.002, s[2]]);
    const g = ctx.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], .5 * scale);
    g.addColorStop(0, rgbStr(pal.shadow, .28)); g.addColorStop(1, rgbStr(pal.shadow, 0));
    ctx.save(); ctx.translate(sp[0], sp[1]); ctx.scale(1, Math.max(.25, Math.abs(cam.sp)) + .05); ctx.translate(-sp[0], -sp[1]);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sp[0], sp[1], .5 * scale, 0, 7); ctx.fill(); ctx.restore();
  }
  // depth sort
  const items = prims.map(pr => {
    let z;
    if (pr.k === 'cap' || pr.k === 'line') z = (cam.rot(pr.a)[2] + cam.rot(pr.b)[2]) / 2;
    else z = cam.rot(pr.p)[2];
    return { pr, z: z + (pr.bias || 0) };
  }).sort((a, b) => a.z - b.z);
  let zmin = Infinity, zmax = -Infinity; for (const it of items) if (!it.pr.k.startsWith('l')) { zmin = Math.min(zmin, it.z); zmax = Math.max(zmax, it.z); }
  const zr = Math.max(.3, zmax - zmin);
  const outline = rgbStr(pal.figLine);
  for (const { pr, z } of items) {
    const depthF = 1 - .22 * (1 - (z - zmin) / zr);
    let base = pal[pr.c] || pal.fig;
    if (pr.tag && hl) {
      const lv = hl(pr.tag, pr.side);
      if (lv === 2) base = pal.work; else if (lv === 1) base = pal.assist;
    }
    const col = shadeC(base, depthF);
    if (pr.k === 'cap') {
      const a = P(pr.a), b = P(pr.b), w = pr.r * 2 * scale;
      ctx.lineCap = 'round';
      ctx.strokeStyle = outline; ctx.lineWidth = w + 2.2; seg(ctx, a, b);
      ctx.strokeStyle = rgbStr(col); ctx.lineWidth = w; seg(ctx, a, b);
      if (w > 5) {
        ctx.strokeStyle = rgbStr(shadeC(col, 1.38), .55); ctx.lineWidth = w * .38;
        const ox = -w * .16, oy = -w * .18; seg(ctx, [a[0] + ox, a[1] + oy], [b[0] + ox, b[1] + oy]);
      }
    } else if (pr.k === 'sph') {
      const p = P(pr.p), r = pr.r * scale;
      ctx.fillStyle = outline; ctx.beginPath(); ctx.arc(p[0], p[1], r + 1.1, 0, 7); ctx.fill();
      ctx.fillStyle = rgbStr(col); ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill();
      if (r > 3) { ctx.fillStyle = rgbStr(shadeC(col, 1.4), .5); ctx.beginPath(); ctx.arc(p[0] - r * .3, p[1] - r * .32, r * .38, 0, 7); ctx.fill(); }
    } else if (pr.k === 'line') {
      const a = P(pr.a), b = P(pr.b);
      ctx.lineCap = 'round'; ctx.strokeStyle = rgbStr(pal[pr.c] || pal.cable); ctx.lineWidth = pr.w; seg(ctx, a, b);
    } else if (pr.k === 'disc') {
      drawDisc3(ctx, P, pr.p, pr.n, pr.r, cam, scale, rgbStr(col), outline, 1.2, pr.th);
    } else if (pr.k === 'box') {
      drawBox(ctx, P, pr, cam, col, outline);
    }
  }
  return P;
}
function seg(ctx, a, b) { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0] + .01, b[1]); ctx.stroke(); }
function drawDisc3(ctx, P, c, n, r, cam, scale, fill, stroke, lw, th) {
  const nr = cam.rot(n); // camera-space normal
  const cp = P(c);
  const sx = nr[0], sy = -nr[1]; const sl = Math.hypot(sx, sy);
  const minor = Math.max(r * Math.abs(nr[2]), (th || 0) / 2 * sl) * scale, major = r * scale;
  const ang = sl < 1e-4 ? 0 : Math.atan2(sy, sx) + Math.PI / 2;
  ctx.save(); ctx.translate(cp[0], cp[1]); ctx.rotate(ang);
  ctx.beginPath(); ctx.ellipse(0, 0, major, Math.max(.6, minor), 0, 0, 7);
  if (fill) { ctx.fillStyle = fill; ctx.fill(); }
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); }
  ctx.restore();
}
function drawBox(ctx, P, b, cam, col, outline) {
  const [ax, ay, az] = b.ax, [hx, hy, hz] = b.h;
  const corner = (i, j, k) => add(add(add(b.p, mul(ax, i * hx)), mul(ay, j * hy)), mul(az, k * hz));
  const faces = [];
  const defs = [[ax, 0], [ay, 1], [az, 2]];
  for (const [n, idx] of defs) for (const s of [1, -1]) {
    const nn = mul(n, s), nr = cam.rot(nn);
    if (nr[2] <= 1e-3) continue;
    let pts;
    if (idx === 0) pts = [corner(s, -1, -1), corner(s, 1, -1), corner(s, 1, 1), corner(s, -1, 1)];
    else if (idx === 1) pts = [corner(-1, s, -1), corner(1, s, -1), corner(1, s, 1), corner(-1, s, 1)];
    else pts = [corner(-1, -1, s), corner(1, -1, s), corner(1, 1, s), corner(-1, 1, s)];
    const light = .62 + .38 * Math.max(0, nr[0] * -.35 + nr[1] * .8 + nr[2] * .45);
    faces.push({ pts, light });
  }
  ctx.lineJoin = 'round';
  for (const f of faces) {
    ctx.beginPath(); f.pts.forEach((p, i) => { const q = P(p); i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); }); ctx.closePath();
    ctx.fillStyle = rgbStr(shadeC(col, f.light)); ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = 1; ctx.stroke();
  }
}

/* ---------- animation driver ---------- */
class Anim {
  constructor(def) {
    if (def.hands == null) def.hands = def.grip != null ? 1 : .35;
    this.def = def; this.frames = def.frames.map(f => { const o = { ...f }; if (def.grip != null && o.grip == null) o.grip = def.grip; if (def.hands != null && o.hands == null) o.hands = def.hands; return o; });
    const n = this.frames.length;
    this.seq = def.seq || (n === 1 ? [{ to: 0, dur: 2, label: def.labels?.[0] || 'Hold' }] :
      n === 2 ? [{ to: 1, dur: def.t1 ?? 1.4, label: def.labels?.[0] }, { hold: def.h1 ?? .35 }, { to: 0, dur: def.t2 ?? 1.6, label: def.labels?.[1] }, { hold: def.h2 ?? .45 }] :
        this.frames.map((_, i) => ({ to: (i + 1) % n, dur: def.durs?.[i] ?? 1.1, label: def.labels?.[i] })));
    this.total = this.seq.reduce((s, x) => s + (x.dur || x.hold || 0), 0);
    this._cache = null;
  }
  poseAt(t) { // t seconds
    t = ((t % this.total) + this.total) % this.total;
    let cur = 0, acc = 0, label = '', prog = 0;
    for (const st of this.seq) {
      const d = st.dur || st.hold;
      if (t <= acc + d) {
        if (st.hold) { label = this._lastLabel || ''; return { pose: this.frames[cur], label: this._holdLabel(st), prog: 1 }; }
        const k = ease((t - acc) / d);
        label = st.label || ''; prog = (t - acc) / d; this._lastLabel = label;
        return { pose: lerpPose(this.frames[cur], this.frames[st.to], k), label, prog };
      }
      acc += d; if (!st.hold) cur = st.to;
    }
    return { pose: this.frames[cur], label: '', prog: 1 };
  }
  _holdLabel(st) { return st.label || null; }
  // bounding info for camera fit (sampled)
  bounds() {
    if (this._cache) return this._cache;
    let pts = [];
    const N = 14;
    for (let i = 0; i <= N; i++) {
      const { pose } = this.poseAt(i / N * this.total);
      const J = solvePose(pose);
      const prims = bodyPrims(J).concat(this.propPrims(J, pose, false));
      for (const p of prims) {
        if (p.k === 'cap' || p.k === 'line') { pts.push(p.a, p.b); }
        else if (p.k === 'box') { pts.push(add(p.p, add(mul(p.ax[0], p.h[0]), add(mul(p.ax[1], p.h[1]), mul(p.ax[2], p.h[2])))), sub(p.p, add(mul(p.ax[0], p.h[0]), add(mul(p.ax[1], p.h[1]), mul(p.ax[2], p.h[2]))))); }
        else if (!p.noFit) pts.push(p.p);
      }
    }
    let mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    for (const p of pts) for (let k = 0; k < 3; k++) { mn[k] = Math.min(mn[k], p[k]); mx[k] = Math.max(mx[k], p[k]); }
    mn[1] = Math.min(mn[1], 0);
    const center = [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2];
    let rad = 0; for (const p of pts) rad = Math.max(rad, Math.hypot(p[0] - center[0], p[2] - center[2]));
    this._cache = { center, rad: rad + .12, ymin: mn[1], ymax: mx[1] + .12 };
    return this._cache;
  }
  propPrims(J, pose, live = true) {
    const out = [];
    for (const f of (this.def.props || [])) { const r = f(J, pose); if (r) out.push(...r); }
    return out;
  }
}
function fitFor(b, W, H, cam) {
  const pitch = Math.abs(cam.pitch * D2R);
  const vert = (b.ymax - b.ymin) * Math.cos(pitch) + 2 * b.rad * Math.sin(pitch);
  const scale = Math.min(W / (2 * b.rad * 1.06), H / (vert * 1.12 + .1));
  return { scale, center: b.center, floorR: Math.max(.9, b.rad * .95) };
}
