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
      put('biceps-long', mem * rng(t, 0.36, 0.93, 0.07) * ang(phi, -8, 52) * lowFade);
      put('biceps-short', mem * rng(t, 0.36, 0.93, 0.07) * ang(phi, -78, -8) * lowFade);
      put('brachialis', mem * rng(t, 0.6, 0.97, 0.06) * ang(phi, 52, 98, 8));
      put('triceps-lateral', mem * rng(t, 0.3, 0.9, 0.07) * ang(phi, 98, 172));
      put('triceps-long', mem * rng(t, 0.2, 0.92, 0.07) * ang(phi, 172, 282));
      // deltoid: a cap around the shoulder joint running down to its insertion on the outer arm
      const capR = 0.105 - Math.max(0, t) * 0.07;
      const dm = ss(0.06, 0.3, wUA + wCl * .8) * rng(t, -0.3, 0.4, 0.07) * (1 - ss(capR - 0.012, capR + 0.012, rho - Math.max(0, -t) * 0.0)) * (1 - ss(0.1, 0.135, vlen(sub(p, A.base)) - Math.max(0, t) * DIM.ua * .75));
      put('front-delts', dm * ang(phi, -38, 42, 9));
      put('side-delts', dm * ang(phi, 42, 128, 9));
      put('rear-delts', dm * ang(phi, 128, 212, 9));
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
      // chest: fan between collar bone and the lower pec line
      const lowLine = 1.268 + 0.55 * Math.max(0, x - 0.1) + 0.9 * Math.pow(Math.max(0, 0.06 - x), 1.5), topLine = 1.475 - 0.1 * x;
      const pec = mem * front * rng(x, 0.004, 0.2, 0.014) * rng(y, lowLine, topLine, 0.014) * (1 - ss(60, 78, theta));
      const u1 = 1.4 + 0.12 * x, u2 = 1.335 + 0.06 * x;   // split lines (rise toward the armpit like the fibres)
      put('upper-chest', pec * (1 - ss(-0.012, 0.006, u1 - y)));
      put('mid-chest', pec * rng(y, u2, u1, 0.008));
      put('lower-chest', pec * (1 - ss(-0.006, 0.012, y - u2)));
      // abs
      const absX = 0.066 - 0.012 * ss(1.1, 0.96, y);
      put('upper-abs', mem * front * rng(x, -1, absX, 0.012) * rng(y, 1.168, lowLine - 0.006, 0.012));
      put('lower-abs', memHip * front * rng(x, -1, absX, 0.012) * rng(y, 0.93, 1.168, 0.012));
      // obliques, serratus
      put('obliques', mem * rng(theta, 27 + 14 * ss(1.1, 1.24, y), 104 + 40 * ss(1.2, 1.08, y), 9) * rng(y, 1.035, 1.235 + 0.04 * ss(40, 90, theta), 0.016) * (1 - ss(absX - 0.01, absX + 0.012, 0.0) * 0) * ss(absX - 0.006, absX + 0.014, x));
      put('serratus', mem * rng(theta, 52, 100, 8) * rng(y, 1.245 + 0.03 * ss(40, 90, theta), 1.345, 0.012) * (1 - pec * 1.2 > 0 ? 1 : 0));
      // back
      const latTop = 1.4, spineEdge = 0.05 + 0.035 * ss(1.14, 1.34, y) - 0.02 * ss(1.34, 1.42, y);
      const sideLat = 0.5 + 0.5 * ss(1.2, 1.3, y);     // the lat only wraps to the side high up, under the armpit
      put('lats', mem * rng(theta, 92 + 50 * (1 - sideLat), 181, 8) * ss(spineEdge - 0.03, spineEdge + 0.03, x) * rng(y, 1.115, latTop, 0.022));
      put('lower-back', memHip * back * (1 - ss(spineEdge - 0.03, spineEdge + 0.03, x)) * rng(y, 1.0, 1.245, 0.014));
      put('upper-back', mem * back * (1 - ss(spineEdge - 0.03, spineEdge + 0.03, x)) * rng(y, 1.245, 1.43, 0.02));
      put('upper-back', mem * back * rng(x, 0.03, 0.095, 0.02) * rng(y, 1.4, 1.43, 0.018));
      put('rotator-cuff', mem * back * rng(x, 0.095, 0.185, 0.02) * rng(y, latTop, 1.45, 0.018));
      const trapTop = ss(-0.3, 0.3, n[1]);
      put('traps', ss(0.15, 0.5, wTor + wCl + wNk) * Math.max(back * rng(x, -1, 0.15, 0.02) * rng(y, 1.43, 1.56, 0.018), trapTop * rng(x, 0.035, 0.145, 0.014) * rng(y, 1.46, 1.56, 0.012) * ss(-0.03, 0.02, ZC + 0.01 - z)));
      // hips
      put('glute-max', memHip * rng(theta, 108, 200, 10) * rng(y, 0.85, 1.025, 0.016));
      put('glute-med', memHip * rng(theta, 60, 108, 9) * rng(y, 0.985, 1.075, 0.014));
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
