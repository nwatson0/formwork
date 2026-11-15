// Paints the muscle atlas and the shorts mask onto the bind-pose mesh.
// Limbs use cylinder coordinates around each bone (t along the bone, phi around it: 0 front, 90 outer side, 180 back, -90 inner side);
// the torso uses height y and the angle theta around the body's vertical axis (0 front, 90 side, 180 back). Right side is mirrored.
module.exports = function paint(c) {
  const { N, posA, nrmA, WT, BI, J, MI, OPT } = c;
  const { sub, dot, cross, norm, vlen } = c.ENG, DIM = c.ENG.DIM;
  const mus = new Uint8Array(N), musW = new Float32Array(N), cloth = new Float32Array(N);
  const ss = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  // soft interval: ~0.8 at the nominal edge, 1 inside, 0 outside by w
  const rng = (x, lo, hi, w) => { w *= 1.5; return ss(lo - w, lo + w, x) * (1 - ss(hi - w, hi + w, x)); };
  const angd = (a, b) => { let d = ((a - b) % 360 + 540) % 360 - 180; return d; };
  const ang = (phi, lo, hi, w = 10) => { const mid = (lo + hi) / 2, half = (hi - lo) / 2, d = Math.abs(angd(phi, mid)); w *= 1.3; return 1 - ss(half - w, half + w, d); };
  // soft polygon: 1 inside, 0.5 on the outline, 0 outside by w (points are [u, v] pairs in metres)
  const poly = (P, u, v, w = 0.012) => {
    let d = 1e9, inside = false;
    for (let i = 0, j = P.length - 1; i < P.length; j = i++) {
      const ax = P[j][0], ay = P[j][1], bx = P[i][0], by = P[i][1], ex = bx - ax, ey = by - ay;
      const k = Math.max(0, Math.min(1, ((u - ax) * ex + (v - ay) * ey) / (ex * ex + ey * ey)));
      d = Math.min(d, Math.hypot(u - ax - ex * k, v - ay - ey * k));
      if ((ay > v) !== (by > v) && u < ax + (v - ay) * ex / ey) inside = !inside;
    }
    return 1 - ss(-w, w, inside ? -d : d);
  };
  const TH = 0.0028;   // metres of skin per degree around the hips
  const A = J.armL, Lg = J.legL;
  const mk = (o, y, z) => ({ o, y, z, x: cross(y, z) });
  const FU = mk(A.base, A.d, A.b), FF = mk(A.j1, A.c, norm(A.pf)), FT = mk(Lg.base, Lg.d, c.ENG.mul(Lg.b, -1)), FS = mk(Lg.j1, Lg.c, norm(c.ENG.mul(Lg.pf, -1)));
  const cyl = (F, p, L) => { const d = sub(p, F.o), lx = dot(d, F.x), ly = dot(d, F.y), lz = dot(d, F.z); return { t: ly / L, phi: Math.atan2(-lx, lz) * 180 / Math.PI, rho: Math.hypot(lx, lz) }; };
  const ZC = +(OPT.zc ?? 0.022);
  const W = (i, ...names) => { let s = 0; for (const n of names) s += WT[i][BI[n + 'L']] + WT[i][BI[n + 'R']]; return s; };
  const waistTop = +(OPT.waist ?? 1.045), hem = +(OPT.hem ?? 0.33);
  for (let i = 0; i < N; i++) {
    const p0 = posA[i], p = [Math.abs(p0[0]), p0[1], p0[2]], n0 = nrmA[i], n = [p0[0] < 0 ? -n0[0] : n0[0], n0[1], n0[2]];
    const wUA = W(i, 'uarm', 'uarmSw'), wCl = W(i, 'clav'), wFA = W(i, 'farm', 'farmTw'), wH = W(i, 'hand'), wTh = W(i, 'thigh', 'thighSw'), wSh = W(i, 'shin'), wFt = W(i, 'foot');
    const wTor = WT[i][BI.pelvis] + WT[i][BI.lumbar] + WT[i][BI.chest], wNk = WT[i][BI.neck] + WT[i][BI.head];
    let best = 0, bm = 0, second = 0;
    const put = (m, s) => { const id = MI[m]; if (id === bm) { if (s > best) best = s; return; } if (s > best) { second = best; best = s; bm = id; } else if (s > second) second = s; };
    const x = p[0], y = p[1], z = p[2];
    const theta = Math.atan2(x, z - ZC) * 180 / Math.PI;       // 0 front .. 180 back
    const front = ss(-0.25, 0.2, n[2]), back = ss(-0.25, 0.2, -n[2]);

    /* ---- upper arm + deltoid ---- */
    if (wUA + wCl > 0.04) {
      const { t, phi, rho } = cyl(FU, p, DIM.ua);
      const mem = ss(0.25, 0.7, wUA + wFA * .6);
      const lowFade = 1 - ss(0.86, 1.0, t);
      // deltoid: a cap over the shoulder that narrows to a point half-way down the outer arm
      const dOff = Math.min(1, Math.abs(angd(phi, 88)) / 100), dLow = 0.47 - 0.27 * Math.pow(dOff, 1.15);
      const capR = 0.105 - Math.max(0, t) * 0.07;
      const dm = ss(0.06, 0.3, wUA + wCl * .8) * rng(t, -0.3, dLow, 0.035) * (1 - ss(capR - 0.012, capR + 0.012, rho)) * (1 - ss(0.1, 0.135, vlen(sub(p, A.base)) - Math.max(0, t) * DIM.ua * .75));
      put('front-delts', dm * ang(phi, -42, 40, 9));
      put('side-delts', dm * ang(phi, 40, 130, 9));
      put('rear-delts', dm * ang(phi, 130, 218, 9));
      // arm muscles start where the deltoid ends
      const under = ss(dLow - 0.03, dLow + 0.05, t);
      const belly = (lo, hi) => rng(t, lo, hi, 0.07);
      put('biceps-long', mem * belly(0.2, 0.92) * ang(phi, -6, 46) * lowFade * Math.max(under, ang(phi, -60, 0, 6) * ss(0.16, 0.26, t)));
      put('biceps-short', mem * belly(0.2, 0.92) * ang(phi, -72, -6) * lowFade * ss(0.16, 0.26, t));
      put('brachialis', mem * rng(t, 0.58, 0.97, 0.06) * ang(phi, 46, 96, 8));
      put('triceps-lateral', mem * belly(0.3, 0.84) * ang(phi, 96, 176) * under);
      put('triceps-long', mem * belly(0.14, 0.86) * ang(phi, 176, 288) * Math.max(under, ang(phi, 200, 288, 6)));
    }
    /* ---- forearm ---- */
    if (wFA + wUA * .3 > 0.04) {
      const { t, phi } = cyl(FF, p, DIM.fa);
      const mem = ss(0.25, 0.7, wFA + wH * .5 + wUA * .35);
      const taper = 1 - ss(0.62, 0.9, t);
      put('forearm-flexors', mem * rng(t, -0.02, 0.9, 0.07) * ang(phi, -172, -8, 9) * taper);
      put('forearm-extensors', mem * rng(t, -0.06, 0.9, 0.07) * ang(phi, 8, 172, 9) * taper);
    }
    /* ---- thigh ---- */
    if (wTh + wSh > 0.04 || (wTor > 0 && y < 1.0)) {
      const { t, phi } = cyl(FT, p, DIM.th);
      const mem = ss(0.3, 0.75, wTh + wSh * .5);
      const knee = 1 - ss(0.93, 1.02, t);
      put('quads', mem * knee * Math.max(rng(t, 0.14, 1.0, 0.07) * ang(phi, -52, 98), rng(t, 0.62, 1.0, 0.06) * ang(phi, -88, -40, 8)));
      put('hamstrings', mem * rng(t, 0.2, 0.97, 0.07) * ang(phi, 112, 236));
      put('adductors', mem * rng(t, 0.0, 0.66, 0.08) * ang(phi, -124, -52));
    }
    /* ---- lower leg ---- */
    if (wSh + wFt > 0.04) {
      const { t, phi } = cyl(FS, p, DIM.sh);
      const mem = ss(0.3, 0.75, wSh + wTh * .3);
      put('tibialis', mem * rng(t, 0.08, 0.72, 0.06) * ang(phi, 6, 74, 8));
      put('gastrocnemius', mem * rng(t, 0.0, 0.47, 0.06) * ang(phi, 108, 252));
      put('soleus', mem * rng(t, 0.47, 0.8, 0.06) * ang(phi, 92, 268));
    }
    /* ---- torso ---- */
    if (wTor + wCl + wTh * .5 > 0.15) {
      const mem = ss(0.15, 0.55, wTor + wCl + wNk * .6);
      const memHip = ss(0.15, 0.55, wTor + wTh);
      const absX = 0.066 - 0.012 * ss(1.1, 0.96, y);
      // chest: a fan from the collar bone, breastbone and upper ribs that converges on the upper arm
      const PEC = [[0.004, 1.452], [0.05, 1.472], [0.112, 1.478], [0.152, 1.435], [0.188, 1.378], [0.172, 1.332], [0.128, 1.29], [0.07, 1.268], [0.02, 1.274], [0.004, 1.3]];
      const pec = mem * front * poly(PEC, x, y, 0.011) * (1 - ss(62, 80, theta));
      const fa = Math.atan2(y - 1.385, 0.2 - x) * 180 / Math.PI;      // fibre direction, measured from the arm attachment
      put('upper-chest', pec * ss(6.5, 11.5, fa));
      put('mid-chest', pec * ss(-13.5, -8.5, fa) * (1 - ss(6.5, 11.5, fa)));
      put('lower-chest', pec * (1 - ss(-13.5, -8.5, fa)));
      // abs: upper edge follows the arch of the ribs
      const arch = 1.283 - 0.35 * x;
      put('upper-abs', mem * front * rng(x, -1, absX, 0.012) * rng(y, 1.168, arch, 0.012));
      put('lower-abs', memHip * front * rng(x, -1, absX, 0.012) * rng(y, 0.93, 1.168, 0.012));
      // obliques run from the lower ribs down and forward to the hip bone; serratus are the "fingers" on the ribs under the armpit
      const obTop = 1.215 + 0.0011 * Math.max(0, theta - 25), obLow = 1.02 + 0.0006 * Math.max(0, theta - 25);
      put('obliques', mem * rng(theta, 24 + 10 * ss(1.1, 1.24, y), 142, 9) * rng(y, obLow, obTop, 0.016) * ss(absX - 0.006, absX + 0.014, x));
      const srT = 1.262 + 0.0016 * (theta - 50);
      put('serratus', mem * rng(theta, 46, 96, 8) * rng(y, srT - 0.03, srT + 0.07, 0.012) * (1 - Math.min(1, pec * 1.6)));
      // ---- back ----
      const bk = ss(88, 108, theta);
      // trapezius (upper part): neck to the point of the shoulder
      const TRAP = [[0, 1.6], [0.04, 1.585], [0.062, 1.53], [0.12, 1.497], [0.178, 1.478], [0.168, 1.452], [0.105, 1.44], [0.05, 1.428], [0, 1.418]];
      const trapTop = ss(-0.3, 0.3, n[1]);
      put('traps', ss(0.15, 0.5, wTor + wCl + wNk) * Math.max(back * poly(TRAP, x, y, 0.012), trapTop * rng(x, 0.035, 0.15, 0.014) * rng(y, 1.46, 1.56, 0.012) * ss(-0.03, 0.02, ZC + 0.01 - z)));
      // rhomboids and middle/lower trapezius: a kite between the shoulder blades that ends in a point at mid-back
      const KITE = [[0, 1.428], [0.05, 1.436], [0.105, 1.445], [0.102, 1.37], [0.066, 1.285], [0.024, 1.215], [0, 1.195]];
      put('upper-back', mem * back * poly(KITE, x, y, 0.012));
      // rotator cuff: the muscles lying on the shoulder blade
      const CUFF = [[0.105, 1.448], [0.168, 1.458], [0.2, 1.425], [0.19, 1.375], [0.145, 1.335], [0.104, 1.352]];
      put('rotator-cuff', mem * back * poly(CUFF, x, y, 0.012));
      // lats: a wing from the armpit sweeping down and in to the lower spine
      const LAT = [[0.26, 1.395], [0.19, 1.368], [0.145, 1.328], [0.104, 1.345], [0.068, 1.275], [0.03, 1.205], [0.024, 1.13], [0.05, 1.085], [0.12, 1.1], [0.17, 1.16], [0.21, 1.25], [0.26, 1.3]];
      const wrap = ss(88 + 44 * ss(1.24, 1.12, y), 104 + 44 * ss(1.24, 1.12, y), theta);
      put('lats', mem * wrap * poly(LAT, Math.max(x, theta < 125 ? 0.2 : 0), y, 0.014));
      // spinal erectors: two columns that widen over the lumbar area
      const ERE = [[0, 1.2], [0.022, 1.21], [0.026, 1.13], [0.05, 1.082], [0.105, 1.086], [0.1, 1.04], [0.06, 1.005], [0, 0.995]];
      put('lower-back', memHip * bk * poly(ERE, x, y, 0.012));
      // ---- hips (theta, y) ----
      const u = theta * TH;
      const GMAX = [[181, 1.02], [166, 1.03], [142, 1.008], [120, 0.965], [107, 0.905], [110, 0.855], [135, 0.836], [165, 0.84], [181, 0.852]].map(q => [q[0] * TH, q[1]]);
      const GMED = [[70, 1.05], [100, 1.076], [140, 1.066], [160, 1.042], [142, 1.008], [120, 0.965], [106, 0.915], [90, 0.922], [76, 0.98]].map(q => [q[0] * TH, q[1]]);
      put('glute-max', memHip * poly(GMAX, u, y, 0.014));
      put('glute-med', memHip * poly(GMED, u, y, 0.013));
      put('hip-flexors', memHip * front * rng(theta, 14, 56, 8) * rng(y, 0.9, 1.0, 0.014));
    }
    if (c.EYEV[i][0] > 0.5 || wNk > 0.85 || wH > 0.6 || wFt > 0.7) best = 0;
    if (best > 0.04) { mus[i] = bm; musW[i] = Math.max(0, Math.min(best, 0.5 + 2.2 * (best - second))); }
    // shorts: waistband down to mid-thigh
    if (wTor + wTh > 0.5) {
      const tt = dot(sub(p, FT.o), FT.y) / DIM.th;
      const top = waistTop - 0.012 * front + 0.006 * back;
      cloth[i] = (1 - ss(top - 0.014, top + 0.014, y)) * (1 - ss(hem - 0.035, hem + 0.035, tt));
    }
  }
  return { mus, musW, cloth };
};
