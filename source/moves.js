/* ===================== Movement archetypes =====================
   Each returns {frames, props, labels, view, hl, t1, t2} for the Anim class. */
const ikArms = (t, pole, f = 'c', extra = {}) => ({ aL: { t, pole, f, ...extra }, aR: { t: mirrorX(t), pole: mirrorX(pole), f, ...extra } });
const symArms = a => ({ aL: a, aR: a });
const symLegs = a => ({ lL: a, lR: a });
const ikLegs = (t, pole, fd) => ({ lL: { t, pole, fd }, lR: { t: mirrorX(t), pole: mirrorX(pole), fd: fd && mirrorX(fd) } });
const LEGS_STAND = (w = .13, z = 0, toe = .18) => ikLegs([w, .08, z], [.3, 0, 1], [toe, 0, 1]);
const HANG = { el: 6, az: 90, bend: 10 };
function stand(o = {}) { return { root: [0, 1, 0], pel: [0, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...LEGS_STAND(), ...symArms(HANG), ...o }; }
function seated(o = {}) { return { root: [0, .57, 0], pel: [-6, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...ikLegs([.22, .08, .5], [.15, 1, .6], [.12, 0, 1]), ...symArms(HANG), ...o }; }
const V3 = (y, p) => ({ yaw: y, pitch: p });
const spine = p => [0, Math.cos(p * D2R), Math.sin(p * D2R)];
const front = p => [0, -Math.sin(p * D2R), Math.cos(p * D2R)];
const J0 = P => solvePose(P);
const S = (...fs) => fs; // static prop list helper
const seatBox = (z = .05, h = .46, len = .42) => box([0, h / 2, z], AX, [.17, h / 2, len / 2], 'pad', { bias: -1 });
const uprightBack = (lean = -6, y0 = .5, z0 = -.115) => { const u = spine(lean), n = front(lean); return padAlong([0, y0, z0], u, n, .72, .15, .04); };
const floorMat = () => { let cache = null; return J => cache || (cache = matFor(J)); };
const matFor = J => { const a = J.headC, b = mid(J.legL.toe, J.legR.toe); let d = [b[0] - a[0], 0, b[2] - a[2]]; const L = Math.max(.9, vlen(d) + .35); d = vlen(d) > .2 ? norm(d) : [0, 0, 1]; const c = [(a[0] + b[0]) / 2, .006, (a[2] + b[2]) / 2]; return [box(c, [cross([0, 1, 0], d), [0, 1, 0], d], [.32, .006, L / 2], 'mat', { bias: -3 })]; };

/* ---------- pressing ---------- */
function lieBench(incline = 0) {
  const p = -(90 - incline), root = [0, .56, 0], u = spine(p), n = front(p), back = mul(n, -1);
  const hip = madd(root, u, -.06);
  return { p, root, u, n, back, hip, legs: ikLegs([.3, .08, hip[2] + .42], [.25, 1, .5], [.2, 0, 1]) };
}
function benchProps(B, incline) {
  const out = [];
  if (Math.abs(incline) < 3) {
    out.push(padAlong([0, B.root[1] - .105, B.root[2] + .38], [0, 0, -1], [0, 1, 0], 1.3, .14, .045));
    out.push(cap([0, .4, B.root[2] + .2], [0, .03, B.root[2] + .2], .03, 'frame'), cap([0, .4, B.root[2] - .7], [0, .03, B.root[2] - .7], .03, 'frame'));
    out.push(cap([-.22, .02, B.root[2] + .2], [.22, .02, B.root[2] + .2], .025, 'frame'), cap([-.22, .02, B.root[2] - .7], [.22, .02, B.root[2] - .7], .025, 'frame'));
  } else if (incline > 0) {
    const p0 = add(madd(B.root, B.back, .105), mul(B.u, -.12));
    out.push(padAlong(p0, B.u, B.n, 1.02, .14, .045));
    out.push(padAlong([0, B.root[1] - .105, B.root[2] - .08], [0, 0, 1], [0, 1, 0], .42, .15, .045));
    const pc = madd(p0, B.u, .45);
    out.push(cap(add(pc, mul(B.back, .09)), [0, .03, pc[2] - .1], .03, 'frame'), cap([0, .38, B.root[2] + .1], [0, .03, B.root[2] + .1], .03, 'frame'), cap([0, .03, pc[2] - .25], [0, .03, B.root[2] + .3], .03, 'frame'));
  } else {
    const p0 = add(madd(B.root, B.back, .105), mul(B.u, -.45));
    out.push(padAlong(p0, B.u, B.n, 1.45, .14, .045));
    out.push(cap([0, .32, B.root[2] - .6], [0, .03, B.root[2] - .6], .03, 'frame'), cap([0, .55, B.root[2] + .38], [0, .03, B.root[2] + .38], .03, 'frame'));
  }
  return out;
}
function declineLegs(B) {
  return { lL: { t: [.12, .5, B.root[2] + .62], pole: [.1, 1, .3] }, lR: { t: [-.12, .5, B.root[2] + .62], pole: [-.1, 1, .3] } };
}
const M = {};
M.bench = ({ incline = 0, imp = 'bb', grip = .27, close = false, squeeze = false } = {}) => {
  const B = lieBench(incline);
  // press straight up against gravity whatever the bench angle: 'up' and 'down' expressed in the chest frame
  const a = incline * D2R, sa = Math.sin(a), ca = Math.cos(a), R = .6;
  const yT = -.045 + R * sa - .02, zT = R * ca, yB = -.17 + .085 * Math.max(-.6, Math.min(1, incline / 32));
  const base = { root: madd(B.root, B.n, .03), pel: [B.p, 0, 0], lum: [-7, 0, 0], tho: [-7, 0, 0], neck: incline > 15 ? 20 : 16, ...(incline < -5 ? declineLegs(B) : B.legs) };
  const g = close ? .15 : grip;
  let top, bot, props = [() => benchProps(B, incline)];
  if (imp === 'db') {
    // dumbbells finish over the shoulders (not touching), and come down beside the chest with forearms vertical
    top = { ...base, ...ikArms([squeeze ? .075 : .18, yT, zT], [1, -sa - .3, -ca]) };
    bot = { ...base, ...ikArms([squeeze ? .075 : .35, yB + .03, squeeze ? .23 : .13], squeeze ? [.5, -sa - .8, -ca] : [.75, -sa - .35, -ca]) };
    props.push(J => PROP.dbs(J, [1, 0, 0]));
  } else {
    top = { ...base, ...ikArms([g, yT, zT], close ? [.3, -sa - .6, -ca] : [.8, -sa - .45, -ca]) };
    bot = { ...base, ...ikArms([g, yB, .195], close ? [.3, -sa - .6, -ca] : [.8, -sa - .45, -ca]) };
    if (imp === 'smith') props.push(J => PROP.smithBar(J), () => { const z = J0(top).armL.grip[2]; return [...segCap([.7, 0, z], [.7, 1.9, z], .025, 'frame', 4), ...segCap([-.7, 0, z], [-.7, 1.9, z], .025, 'frame', 4)]; });
    else if (imp === 'machine') props.push(J => machineHandles(J, [0, 1, 0]));
    else props.push(J => PROP.barbell(J));
  }
  return { frames: [top, bot], props, labels: ['Lower to chest', 'Press up'], t1: 1.9, t2: 1.1, view: V3(56, 28) };
};
function machineHandles(J, axisC) {
  const out = [];
  for (const [A, s] of [[J.armL, 1], [J.armR, -1]]) {
    const ax = norm(dirW(J.C, axisC));
    out.push(cap(madd(A.grip, ax, -.08), madd(A.grip, ax, .08), .022, 'iron'));
  }
  return out;
}
M.floorPress = () => {
  const p = -90, root = [0, .12, 0];
  const base = { root, pel: [p, 0, 0], lum: [-2, 0, 0], tho: [0, 0, 0], neck: 4, ...ikLegs([.2, .08, .5], [.1, 1, .5], [.1, .3, 1]), snap: true };
  const top = { ...base, ...ikArms([.16, -.1, .52], [1, -.3, -.3]) };
  const bot = { ...base, ...ikArms([.3, -.14, .12], [1, -.5, -.9]) };
  return { frames: [top, bot], props: [floorMat(), J => PROP.dbs(J, [1, 0, 0])], labels: ['Lower until elbows touch', 'Press up'], t1: 1.7, t2: 1, view: V3(65, 18) };
};
M.machinePress = () => {
  const base = seated({ pel: [-8, 0, 0] });
  const J = J0(base);
  const y = J.shL[1] - .1;
  const bot = { ...base, ...ikArms([.25, y, J.shL[2] + .14], [1, -.6, -.6], 'w') };
  const top = { ...base, ...ikArms([.22, y, J.shL[2] + .58], [1, -.4, -.3], 'w') };
  return { frames: [bot, top], props: [() => S(seatBox(), uprightBack(-8)), J => machineHandles(J, [0, 1, 0]), J => [cap(J.armL.grip, [.42, J.armL.grip[1], -.1], .02, 'frame'), cap(J.armR.grip, [-.42, J.armR.grip[1], -.1], .02, 'frame')]], labels: ['Press forward', 'Return slowly'], t1: 1, t2: 1.8, view: V3(60, 10) };
};
M.landminePress = ({ single = false } = {}) => {
  // the bar pivots on the floor in front of the lifter and is pressed up and away in an arc
  const pivot = [0, .04, 1.65];
  const base = stand({ ...ikLegs([.15, .08, 0], [.3, 0, 1], [.15, 0, 1]), pel: [8, 0, 0], tho: [2, 0, 0] });
  const bot = { ...base, ...ikArms([.04, 1.36, .2], [.7, -1, -.1], 'w') };
  const top = { ...base, pel: [13, 0, 0], ...ikArms([.04, 1.72, .64], [.6, -.8, .2], 'w') };
  return { frames: [bot, top], props: [J => landmine(J, pivot)], labels: ['Press up and forward', 'Lower to your upper chest'], t1: 1, t2: 1.7, view: V3(62, 8) };
};
function landmine(J, pivot) {
  const g = mid(J.armL.grip, J.armR.grip); const dir = norm(sub(g, pivot)); const end = madd(g, dir, .07);
  return [...segCap(pivot, end, .022, 'steel', 4), disc(madd(g, dir, -.2), dir, .16, 'plate', { th: .045 }), cap(add(pivot, [-.1, -.03, 0]), add(pivot, [.1, -.03, 0]), .03, 'frame')];
}
M.svend = () => {
  const base = stand();
  const a = { ...base, ...ikArms([.02, -.12, .16], [1, -.4, .1]) };
  const b = { ...base, ...ikArms([.02, -.12, .55], [1, -.2, 0]) };
  return { frames: [a, b], props: [J => PROP.plate(J, [1, 0, 0], .17)], labels: ['Squeeze and press out', 'Bring back to chest'], t1: 1.2, t2: 1.4, view: V3(65, 8) };
};

/* ---------- flyes ---------- */
M.fly = ({ incline = 0 } = {}) => {
  const B = lieBench(incline);
  const base = { root: B.root, pel: [B.p, 0, 0], lum: [-4, 0, 0], tho: [-3, 0, 0], neck: incline > 15 ? 8 : 0, ...B.legs };
  const y = incline > 15 ? -.04 : -.12;
  const top = { ...base, ...ikArms([.12, y, .52], [1, .1, -.4]) };
  const bot = { ...base, ...ikArms([.72, y - .02, .03], [.1, -.4, -1]) };
  return { frames: [top, bot], props: [() => benchProps(B, incline), J => PROP.dbs(J, [0, 1, 0])], labels: ['Open wide, slight elbow bend', 'Hug back together'], t1: 1.8, t2: 1.3, view: V3(40, 26) };
};
M.cableFly = ({ dir = 'mid' } = {}) => {
  const ay = dir === 'high' ? 2.05 : dir === 'low' ? .2 : 1.45;
  const base = stand({ ...{ lL: { t: [.14, .08, .28], pole: [.3, 0, 1], fd: [.15, 0, 1] }, lR: { t: [-.14, .08, -.22], pole: [-.3, 0, 1], fd: [-.15, 0, 1] } }, pel: [12, 0, 0], root: [0, .98, .03] });
  const J = J0(base), sy = J.shL[1], sz = J.shL[2];
  let s0, s1;
  if (dir === 'high') { s0 = [.7, sy + .05, sz - .05]; s1 = [.07, sy - .42, sz + .42]; }
  else if (dir === 'low') { s0 = [.62, sy - .5, sz - .02]; s1 = [.07, sy + .02, sz + .45]; }
  else { s0 = [.74, sy - .05, sz - .06]; s1 = [.07, sy - .12, sz + .52]; }
  const a = { ...base, ...ikArms(s0, [1, -.3, -.6], 'w') };
  const b = { ...base, ...ikArms(s1, [1, -.5, -.3], 'w') };
  const anL = [.95, ay, -.35], anR = [-.95, ay, -.35];
  return {
    frames: [a, b], props: [() => S(...PROP.stack([.95, 0, -.45], 2.2), ...PROP.stack([-.95, 0, -.45], 2.2)), J => [...PROP.cable(J.armL.grip, anL), ...PROP.cable(J.armR.grip, anR)]],
    labels: [dir === 'high' ? 'Sweep down and together' : dir === 'low' ? 'Scoop up and together' : 'Bring hands together', 'Open under control'], t1: 1.2, t2: 1.7, view: V3(35, 14)
  };
};
M.pecDeck = ({ reverse = false } = {}) => {
  const base = seated({ pel: [reverse ? 10 : -8, 0, 0] });
  const J = J0(base), y = J.shL[1] - .05, z = J.shL[2];
  const open = { ...base, ...ikArms([.72, y, z - .04], [0, -1, 0], 'w') };
  const shut = { ...base, ...ikArms([.1, y, z + .5], [.3, -1, 0], 'w') };
  const fr = reverse ? [shut, open] : [open, shut];
  const props = [() => S(seatBox(), reverse ? padAlong([0, .62, .14], [0, 1, 0], [0, 0, -1], .6, .15, .04) : uprightBack(-8)), J => [...machineHandles(J, [0, 1, 0]), cap(J.armL.grip, [.15, y + .45, z + .25], .018, 'frame'), cap(J.armR.grip, [-.15, y + .45, z + .25], .018, 'frame')]];
  return { frames: fr, props, labels: reverse ? ['Sweep arms back', 'Return slowly'] : ['Bring handles together', 'Open slowly'], t1: 1.1, t2: 1.7, view: V3(25, 30) };
};
M.pullover = () => {
  const B = lieBench(0);
  const base = { root: B.root, pel: [B.p, 0, 0], lum: [-4, 0, 0], tho: [-2, 0, 0], neck: 0, ...B.legs };
  const a = { ...base, ...symArms({ el: 90, az: 6, bend: 18 }) };
  const b = { ...base, ...symArms({ el: 168, az: 6, bend: 22 }) };
  return { frames: [a, b], props: [() => benchProps(B, 0), J => PROP.db2(J)], labels: ['Lower behind your head', 'Pull back over chest'], t1: 1.8, t2: 1.3, view: V3(80, 12) };
};

/* ---------- push-ups & planks ---------- */
function plank(beta, ankle, legSpec = { el: 0, az: 3, bend: 2 }) {
  const b = beta * D2R, u = [0, Math.sin(b), Math.cos(b)];
  return { root: madd(ankle, u, .93), pel: [90 - beta, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...symLegs(legSpec) };
}
M.pushup = ({ v = 'std' } = {}) => {
  const ank = [0, .19, 0];
  let bT = 19, bB = 2, hy = .035, hw = .3, pole = [.7, .3, -.7], ankY = .19;
  if (v === 'decline') { bT = -2; bB = -16; ank[1] = .64; }
  if (v === 'incline') { bT = 40; bB = 28; hy = .5; }
  if (v === 'diamond') { hw = .07; pole = [.3, .4, -1]; }
  if (v === 'wide') { hw = .44; pole = [1, .2, -.4]; }
  const top0 = plank(bT, ank), Jt = J0(top0);
  const hz = Jt.shL[2] + (v === 'incline' ? .05 : .03);
  const hands = ikArms([hw, hy, hz], pole, 'w');
  const top = { ...top0, ...hands }, bot = { ...plank(bB, ank), ...hands };
  const props = [];
  if (v === 'decline') props.push(() => S(...benchAcross([0, -.05], 1, .44)));
  if (v === 'incline') props.push(() => S(...benchAcross([0, hz], 1.1, .46)));
  if (v === 'suspension') { }
  return { frames: [top, bot], props, labels: ['Lower chest to floor', 'Push the floor away'], t1: 1.6, t2: 1, view: V3(72, 12) };
};
M.pushupPlus = () => {
  const ank = [0, .19, 0], t0 = plank(19, ank), Jt = J0(t0), hz = Jt.shL[2] + .03;
  const hands = ikArms([.25, .035, hz], [.6, .3, -.7], 'w');
  const a = { ...t0, ...hands, pro: -.7, root: add(t0.root, [0, -.035, 0]) };
  const b = { ...t0, ...hands, pro: 1, root: add(t0.root, [0, .045, 0]) };
  return { frames: [a, b], props: [], labels: ['Push upper back to ceiling', 'Let chest sink slightly'], t1: 1, t2: 1.3, view: V3(70, 12) };
};
M.pike = () => {
  const hands = ikArms([.27, .035, .98], [.5, 0, -1], 'w');
  const legs = ikLegs([.13, .17, -.13], [.2, -.3, 1], [.1, -.6, .8]);
  const a = { root: [0, .86, .42], pel: [125, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...legs, ...hands };
  const b = { ...a, root: [0, .8, .5], pel: [148, 0, 0], neck: -12 };
  return { frames: [a, b], props: [], labels: ['Lower head toward floor', 'Press back up'], t1: 1.6, t2: 1, view: V3(80, 8) };
};
M.plank = ({ side = false } = {}) => {
  if (side) {
    const a = { root: [0, .35, 0], pel: [0, 0, -71], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...symLegs({ el: 0, az: 2, bend: 2 }), aR: { el: 70, az: 90, bend: 90 }, aL: { el: 10, az: 60, bend: 70 }, snap: true };
    const b = { ...a, pel: [0, 0, -73], lum: [0, 0, 1] };
    return { frames: [a, b], props: [() => S(box([0, .006, 0], AX, [1, .006, .3], 'mat', { bias: -3 }))], labels: ['Hold — hips high', 'Breathe and brace'], t1: 2, t2: 2, view: V3(0, 14) };
  }
  const ank = [0, .19, 0];
  const t = plank(6, ank);
  const a = { ...t, ...symArms({ el: 84, az: 4, bend: 90 }) };
  const b = { ...a, root: add(a.root, [0, .012, 0]) };
  return { frames: [a, b], props: [floorMat()], labels: ['Hold — straight line', 'Breathe and brace'], t1: 2, t2: 2, view: V3(70, 12) };
};
M.mountain = ({ susp = false } = {}) => {
  const ank = [0, .19, 0], t0 = plank(18, ank), Jt = J0(t0), hz = Jt.shL[2] + .03;
  const hands = ikArms([.28, .035, hz], [.6, .3, -.7], 'w');
  const back = (s) => ({ t: [s * .12, .19, .02], pole: [s * .1, -1, .3], fd: [0, -1, .25] });
  const fwd = (s) => ({ t: [s * .12, .34, .6], pole: [s * .1, -.25, 1], fd: [0, -.6, .8] });
  const a = { ...t0, ...hands, lL: fwd(1), lR: back(-1) };
  const b = { ...t0, ...hands, lL: back(1), lR: fwd(-1) };
  return { frames: [a, b], props: [], labels: ['Drive right knee', 'Drive left knee'], t1: .5, t2: .5, h1: .05, h2: .05, view: V3(72, 12) };
};
M.suspTuck = () => {
  const ank = [0, .45, 0], t0 = plank(8, ank), Jt = J0(t0), hz = Jt.shL[2] + .03;
  const hands = ikArms([.28, .035, hz], [.6, .3, -.7], 'w');
  const a = { ...t0, ...hands };
  const b = { ...a, root: add(a.root, [0, .08, 0]), ...ikLegs([.1, .42, .62], [.1, -1, .8], [0, -.5, .9]) };
  a.lL = { t: [.1, .45, 0], pole: [.1, -1, .2], fd: [0, -.9, .3] }; a.lR = { t: [-.1, .45, 0], pole: [-.1, -1, .2], fd: [0, -.9, .3] };
  const anchor = [0, 2.4, -.35];
  return { frames: [a, b], props: [J => [...PROP.band(J.legL.ankle, anchor, 'strap'), ...PROP.band(J.legR.ankle, anchor, 'strap')]], labels: ['Tuck knees to chest', 'Extend back to plank'], t1: 1, t2: 1.3, view: V3(75, 10) };
};

/* ---------- overhead / shoulders ---------- */
M.ohp = ({ imp = 'bb', sit = false } = {}) => {
  const base = sit ? seated({ pel: [-6, 0, 0] }) : stand({ pel: [-2, 0, 0], ...LEGS_STAND(.15) });
  let bot, top, props = [];
  if (imp === 'bb') {
    bot = { ...base, pel: [sit ? -6 : -5, 0, 0], neck: -8, ...ikArms([.24, .0, .1], [.45, -1, .15]) };
    top = { ...base, pel: [sit ? -6 : -1, 0, 0], neck: 4, ...ikArms([.24, .62, .02], [1, 0, -.1]) };
    props.push(J => PROP.barbell(J));
  } else if (imp === 'db' || imp === 'machine') {
    bot = { ...base, ...ikArms([.31, .02, .07], [1, -1, .1]) };
    top = { ...base, ...ikArms([.13, .62, .04], [1, 0, 0]) };
    props.push(imp === 'db' ? (J => PROP.dbs(J, [1, 0, 0])) : (J => [...machineHandles(J, [0, 0, 1]), cap(J.armL.grip, [.3, J.armL.grip[1] - .2, -.35], .02, 'frame'), cap(J.armR.grip, [-.3, J.armR.grip[1] - .2, -.35], .02, 'frame')]));
  } else if (imp === 'arnold') {
    bot = { ...base, ...ikArms([.11, -.02, .2], [.12, -1, .55]) };
    const midp = { ...base, ...ikArms([.32, .05, .07], [1, -1, 0]) };
    top = { ...base, ...ikArms([.13, .62, .04], [1, 0, 0]) };
    props.push(J => PROP.dbs(J, [1, 0, 0]));
    if (sit) props.push(() => S(seatBox(), uprightBack(-6)));
    return { frames: [bot, midp, top, midp], props, labels: ['Rotate and open', 'Press overhead', 'Lower and open', 'Rotate palms in'], durs: [.7, .8, .9, .8], view: V3(35, 8) };
  }
  if (sit) props.push(() => S(seatBox(), uprightBack(-6)));
  return { frames: [bot, top], props, labels: ['Press overhead', 'Lower to shoulders'], t1: 1.1, t2: 1.7, view: V3(55, 8) };
};
M.lateral = ({ imp = 'db', lean = false, sit = false } = {}) => {
  if (imp === 'cable') {
    const base = stand({ ...LEGS_STAND(.14), aR: { t: [-.55, 1.15, .02], pole: [-1, -.4, 0], f: 'w' } });
    const a = { ...base, aL: { el: 18, az: -28, bend: 12 } };
    const b = { ...base, aL: { el: 86, az: 80, bend: 14 } };
    const an = [-.62, .14, .05];
    return { frames: [a, b], props: [() => S(...PROP.stack([-.75, 0, -.02])), J => PROP.cable(J.armL.grip, an)], labels: ['Raise out to the side', 'Lower slowly'], hl: 'L', t1: 1.2, t2: 1.8, view: V3(10, 8) };
  }
  const base = sit ? seated({ pel: [2, 0, 0] }) : stand({ pel: [6, 0, 0], ...LEGS_STAND(.14) });
  const a = { ...base, ...symArms({ el: 14, az: 82, bend: 16 }) };
  const b = { ...base, ...symArms({ el: 88, az: 78, bend: 16 }) };
  const props = imp === 'band' ? [J => [...PROP.band(J.armL.grip, J.legR.ankle), ...PROP.band(J.armR.grip, J.legL.ankle)]] : [J => PROP.dbs(J, 'pf')];
  if (sit) props.push(() => S(seatBox()));
  return { frames: [a, b], props, labels: ['Raise to shoulder height', 'Lower slowly'], t1: 1.2, t2: 1.8, view: V3(18, 8) };
};
M.frontRaise = ({ imp = 'db' } = {}) => {
  const base = stand({ pel: [-2, 0, 0] });
  const a = { ...base, ...symArms({ el: 10, az: imp === 'plate' ? 0 : 8, bend: imp === 'plate' ? 14 : 6 }) };
  const b = { ...base, ...symArms({ el: 90, az: imp === 'plate' ? 0 : 8, bend: imp === 'plate' ? 14 : 6 }) };
  const props = imp === 'plate' ? [J => PROP.plate(J, dirW(J.C, [0, 0, 1]))] : imp === 'cable' ? [J => PROP.bar(J, { half: .2 }), () => S(...PROP.stack([0, 0, -.62])), J => PROP.cable(mid(J.armL.grip, J.armR.grip), [0, .14, -.5])] : [J => PROP.dbs(J, 'pn')];
  if (imp === 'cable') { a.aL = { ...a.aL, az: 4 }; a.aR = a.aL; b.aL = { ...b.aL, az: 4 }; b.aR = b.aL; }
  return { frames: [a, b], props, labels: ['Raise to eye level', 'Lower slowly'], t1: 1.2, t2: 1.7, view: V3(70, 8) };
};
M.reverseFly = ({ imp = 'db' } = {}) => {
  const base = stand({ root: [0, .88, -.22], pel: [64, 0, 0], lum: [10, 0, 0], neck: -22, ...LEGS_STAND(.15) });
  const a = { ...base, ...symArms({ el: 74, az: 6, bend: 22 }) };
  const b = { ...base, ...symArms({ el: 88, az: 86, bend: 22 }) };
  return { frames: [a, b], props: [J => PROP.dbs(J, 'pf')], labels: ['Sweep arms out wide', 'Lower slowly'], t1: 1.1, t2: 1.6, view: V3(30, 22) };
};
M.cableRevFly = () => {
  const base = stand({ ...LEGS_STAND(.15), pel: [4, 0, 0] });
  const J = J0(base), y = J.shL[1];
  const a = { ...base, ...ikArms([-.15, y, .55], [0, -1, 0], 'w') };
  const b = { ...base, ...ikArms([.75, y, .02], [0, -1, 0], 'w') };
  a.aR = { t: [.15, y, .55], pole: [0, -1, 0], f: 'w' };
  const anL = [-.95, y + .1, .7], anR = [.95, y + .1, .7];
  return { frames: [a, b], props: [() => S(...PROP.stack([-.95, 0, .8], 2.2), ...PROP.stack([.95, 0, .8], 2.2)), J => [...PROP.cable(J.armL.grip, anL), ...PROP.cable(J.armR.grip, anR)]], labels: ['Pull arms apart and back', 'Return slowly'], t1: 1.1, t2: 1.6, view: V3(25, 25) };
};
M.facePull = ({ band = false } = {}) => {
  const base = stand({ pel: [-6, 0, 0], ...LEGS_STAND(.15, -.05) });
  const J = J0(base), y = J.headC[1] - .06;
  const a = { ...base, ...ikArms([.07, y - .04, .62], [1, -.3, 0], 'w') };
  const b = { ...base, ...ikArms([.24, y, J.headC[2] - .02], [1, .7, -.55], 'w') };
  const an = [0, y + .05, 1.55];
  const props = band ? [J => [...PROP.band(J.armL.grip, an), ...PROP.band(J.armR.grip, an)]] : [() => S(...PROP.stack([0, 0, 1.68])), J => PROP.rope(J, an)];
  return { frames: [a, b], props, labels: ['Pull rope to your face', 'Extend arms slowly'], t1: 1.1, t2: 1.6, view: V3(45, 14) };
};
M.pullApart = () => {
  const base = stand();
  const a = { ...base, ...symArms({ el: 88, az: 4, bend: 2 }) };
  const b = { ...base, ...symArms({ el: 88, az: 86, bend: 2 }) };
  return { frames: [a, b], props: [J => PROP.band(J.armL.grip, J.armR.grip)], labels: ['Pull band apart', 'Return slowly'], t1: 1, t2: 1.4, view: V3(30, 18) };
};
M.uprightRow = ({ imp = 'bb' } = {}) => {
  const base = stand({ ...LEGS_STAND(.15) });
  const J = J0(base);
  const a = { ...base, ...ikArms([.13, .82, .14], [1, .2, -.2], 'w') };
  const b = { ...base, ...ikArms([.13, J.shL[1] - .1, .15], [1, .8, -.25], 'w') };
  let props = [J => PROP.barbell(J, { len: .62, plates: 1, pr: .15 })];
  if (imp === 'cable') props = [J => PROP.bar(J, { half: .26 }), () => S(...PROP.stack([0, 0, .55])), J => PROP.cable(mid(J.armL.grip, J.armR.grip), [0, .14, .45])];
  if (imp === 'db') props = [J => PROP.dbs(J, [1, 0, 0])];
  return { frames: [a, b], props, labels: ['Pull elbows high', 'Lower slowly'], t1: 1.1, t2: 1.6, view: V3(imp === 'cable' ? 82 : 40, 6) };
};
M.extRot = ({ imp = 'cable' } = {}) => {
  const base = stand({ ...LEGS_STAND(.15) });
  const a = { ...base, aL: { el: 8, az: 18, bend: 90, rot: -55 } };
  const b = { ...base, aL: { el: 8, az: 18, bend: 90, rot: 48 } };
  const an = [-.9, 1.05, .32];
  const props = imp === 'band' ? [J => PROP.band(J.armL.grip, an)] : [() => S(...PROP.stack([-1.02, 0, .32])), J => PROP.cable(J.armL.grip, an)];
  return { frames: [a, b], props, labels: ['Rotate forearm outward', 'Return slowly'], hl: 'L', t1: 1.1, t2: 1.6, view: V3(-10, 50) };
};

/* ---------- vertical pulls ---------- */
M.pullup = ({ grip = 'wide', assist = false, barY = 2.2 } = {}) => {
  const neutral = grip === 'neutral'; if (neutral) grip = 'mid';
  const dy = barY - 2.2;
  const gw = grip === 'wide' ? .38 : grip === 'chin' ? .17 : .27;
  const pole = grip === 'chin' ? [.2, -.4, 1] : [1, -.4, .15];
  const legs = symLegs({ el: 14, az: 3, bend: 60 });
  const hands = ikArms([gw, barY, 0], pole, 'w');
  const a = { root: [0, 1.16 + dy, -.02], pel: [-2, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...legs, ...hands };
  const b = { ...a, root: [0, 1.58 + dy, -.06], pel: [-14, 0, 0], tho: [-6, 0, 0], neck: -6 };
  const props = [() => S(...segCap([-.75, barY, 0], [.75, barY, 0], .018, 'steel', 5), cap([.75, barY, 0], [.75, barY, -.4], .025, 'frame'), cap([-.75, barY, 0], [-.75, barY, -.4], .025, 'frame'))];
  if (neutral) { props.length = 0; props.push(() => S(...segCap([.135, barY, -.16], [.135, barY, .16], .018, 'steel', 2), ...segCap([-.135, barY, -.16], [-.135, barY, .16], .018, 'steel', 2), cap([-.75, barY + .02, -.16], [.75, barY + .02, -.16], .025, 'frame'))); a.aL.t = [.135, barY, 0]; a.aR.t = [-.135, barY, 0]; }
  if (assist) props.push(J => [box(add(mid(J.legL.j1, J.legR.j1), [0, -.06, 0]), AX, [.22, .025, .16], 'pad', { bias: 0 }), cap([.3, .02, -.3], [.3, 1.2, -.3], .03, 'frame'), cap([-.3, .02, -.3], [-.3, 1.2, -.3], .03, 'frame')]);
  if (assist) { a.lL = a.lR = { el: 95, az: 4, bend: 100 }; b.lL = b.lR = { el: 95, az: 4, bend: 100 }; }
  return { frames: [a, b], props, labels: ['Pull chest to bar', 'Lower to full hang'], t1: 1.2, t2: 1.8, view: V3(55, 4) };
};
M.deadHang = () => {
  const r = M.pullup({ grip: 'mid', barY: 2.38 });
  const a = { ...r.frames[0], ...symLegs({ el: 4, az: 3, bend: 6 }) }, b = { ...a, root: add(a.root, [0, .015, 0]) };
  return { ...r, frames: [a, b], labels: ['Hang — shoulders active', 'Breathe, keep grip'], t1: 2, t2: 2 };
};
M.pulldown = ({ grip = 'wide' } = {}) => {
  const base = seated({ root: [0, .6, 0], pel: [-12, 0, 0], ...ikLegs([.17, .08, .5], [.1, 1, 1], [.1, 0, 1]) });
  const gw = grip === 'wide' ? .42 : .07;
  const a = { ...base, ...ikArms([gw, 1.66, .08], grip === 'wide' ? [1, -.4, .1] : [.4, -.6, .3], 'w') };
  const b = { ...base, ...ikArms([gw, 1.1, .17], grip === 'wide' ? [.5, -1, -.4] : [.25, -1, -.2], 'w') };
  const an = [0, 2.3, .1];
  return {
    frames: [a, b], props: [() => S(seatBox(.0), box([0, .79, .38], AX, [.26, .045, .07], 'pad'), box([0, 1.15, .78], AX, [.18, 1.15, .1], 'frame', { bias: -.6 }), cap([0, 2.3, .1], [0, 2.3, .78], .03, 'frame')),
    J => grip === 'wide' ? PROP.barbell(J, { len: .62, plates: 0 }) : PROP.bar(J, { half: .09 }), J => PROP.cable(mid(J.armL.grip, J.armR.grip), an)], labels: ['Pull bar to upper chest', 'Let it rise slowly'], t1: 1.1, t2: 1.7, view: V3(50, 4)
  };
};
M.straightArm = () => {
  const base = stand({ root: [0, .97, -.06], pel: [24, 0, 0], ...LEGS_STAND(.15) });
  const a = { ...base, ...symArms({ el: 138, az: 12, bend: 12 }) };
  const b = { ...base, ...symArms({ el: 24, az: 12, bend: 8 }) };
  const an = [0, 2.1, .9];
  return { frames: [a, b], props: [() => S(...PROP.stack([0, 0, 1.02], 2.25)), J => PROP.bar(J, { half: .28 }), J => PROP.cable(mid(J.armL.grip, J.armR.grip), an)], labels: ['Sweep bar to thighs', 'Let arms rise slowly'], t1: 1.2, t2: 1.7, view: V3(78, 6) };
};

/* ---------- rows ---------- */
M.bentRow = ({ imp = 'bb', tbar = false, pendlay = false } = {}) => {
  if (pendlay) {
    const base = stand({ root: [0, .8, -.24], pel: [80, 0, 0], neck: -30, ...LEGS_STAND(.15, .05) });
    const sh = J0(base).shL;
    const a = { ...base, ...ikArms([.25, .235, sh[2] + .02], [.5, .5, -1], 'w') };
    const b = { ...base, ...ikArms([.25, sh[1] - .2, sh[2] - .1], [.3, 1, -1], 'w') };
    return { frames: [a, b], props: [J => PROP.barbell(J)], labels: ['Pull explosively to your chest', 'Return the bar to the floor'], t1: .8, t2: 1.2, h2: .5, view: V3(72, 8) };
  }
  const base = stand({ root: [0, .88, -.25], pel: [52, 0, 0], neck: -26, ...LEGS_STAND(.15, .05) });
  const J = J0(base), sh = J.shL;
  const gw = tbar ? .06 : imp === 'db' ? .24 : .25;
  const a = { ...base, ...ikArms([gw, sh[1] - .58, sh[2] + .04], [.5, .5, -1], 'w') };
  const b = { ...base, ...ikArms(tbar ? [gw, sh[1] - .36, sh[2] - .02] : [gw, sh[1] - .27, sh[2] - .12], [.3, 1, -1], 'w') };
  let props = [J => PROP.barbell(J)];
  if (imp === 'db') props = [J => PROP.dbs(J, 'pf')];
  if (tbar) props = [J => landmine(J, [0, .04, -1.15])];
  return { frames: [a, b], props, labels: ['Row to your belly', 'Lower with control'], t1: 1, t2: 1.6, view: V3(70, 8) };
};
M.oneArmRow = () => {
  const legs = { lL: { t: [.2, .08, -.32], pole: [.3, 0, 1], fd: [.1, 0, 1] }, lR: { t: [-.17, .08, .12], pole: [-.3, 0, 1], fd: [-.1, 0, 1] } };
  const base = { root: [0, .86, -.2], pel: [68, 0, 0], lum: [4, 0, 0], tho: [0, 0, 0], neck: -18, ...legs };
  const J = J0(base), sh = J.shL;
  const aR = { t: [-.2, .5, sh[2] + .14], pole: [-.4, 0, -1], f: 'w' };
  const a = { ...base, aR, aL: { t: [.24, sh[1] - .58, sh[2] + .02], pole: [.3, .5, -1], f: 'w' } };
  const b = { ...base, aR, aL: { t: [.22, sh[1] - .2, sh[2] - .25], pole: [.15, 1, -1], f: 'w' } };
  return { frames: [a, b], props: [() => S(padAlong([-.2, .46, -.02], [0, 0, 1], [0, 1, 0], 1.1, .14, .04), cap([-.2, .4, .12], [-.2, .03, .12], .03, 'frame'), cap([-.2, .4, .9], [-.2, .03, .9], .03, 'frame')), J => PROP.dbs(J, [0, 0, 1], 'w', { only: 'L' })], labels: ['Row elbow to hip', 'Lower to a full stretch'], hl: 'L', t1: 1, t2: 1.6, view: V3(60, 10) };
};
M.chestSupRow = () => {
  const incl = 40, p = 90 - incl - 5; // torso leaning forward on pad
  const legs = ikLegs([.16, .08, -.8], [.3, 0, 1], [.1, 0, 1]);
  const base = { root: [0, .84, -.34], pel: [p, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: -14, ...legs };
  const J = J0(base), sh = J.shL;
  const a = { ...base, ...ikArms([.24, sh[1] - .58, sh[2] + .03], [.5, .5, -1], 'w') };
  const b = { ...base, ...ikArms([.24, sh[1] - .22, sh[2] - .2], [.3, 1, -1], 'w') };
  const u = spine(p), n = front(p);
  return { frames: [a, b], props: [() => S(padAlong(add(madd(base.root, n, .12), mul(u, -.25)), u, mul(n, -1), .95, .15, .04), cap(add(base.root, [0, -.2, .1]), [0, .03, base.root[2] + .1], .03, 'frame'), cap([0, .03, base.root[2] - .3], [0, .03, base.root[2] + .6], .03, 'frame')), J => PROP.dbs(J, 'pf')], labels: ['Row elbows back', 'Lower to a full stretch'], t1: 1, t2: 1.6, view: V3(62, 10) };
};
M.cableRow = ({ band = false } = {}) => {
  const legs = band ? symLegs({ el: 84, az: 4, bend: 10 }) : ikLegs([.14, .29, .74], [.1, 1, .2], [0, 1, .15]);
  const base = { root: [0, band ? .12 : .44, 0], pel: [16, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...legs, snap: band };
  const J = J0({ ...base, pel: [-4, 0, 0] });
  const y = J.shL[1] - .3;
  const a = { ...base, ...ikArms([.07, y + .02, .74], [.4, -.3, -.3], 'w') };
  const b = { ...base, pel: [-4, 0, 0], ...ikArms([.08, y, .2], [.35, 0, -1], 'w') };
  if (band) { a.aL.t = [.09, .2, .74]; a.aR.t = [-.09, .2, .74]; b.aL.t = [.12, .22, .2]; b.aR.t = [-.12, .22, .2]; a.aL.f = a.aR.f = b.aL.f = b.aR.f = 'w'; }
  const an = [0, .3, 1.02];
  const props = band ? [J => [...PROP.band(J.armL.grip, J.legL.toe), ...PROP.band(J.armR.grip, J.legR.toe)]] :
    [() => S(box([0, .17, .05], AX, [.15, .17, .5], 'pad'), box([0, .3, .86], AX, [.26, .16, .03], 'frame'), ...PROP.stack([0, 0, 1.15], 1.2)), J => PROP.bar(J, { half: .1 }), J => PROP.cable(mid(J.armL.grip, J.armR.grip), an)];
  return { frames: [a, b], props, labels: ['Row to your belly', 'Reach forward slowly'], t1: 1.1, t2: 1.6, view: V3(72, 8) };
};
M.machineRow = () => {
  const base = seated({ pel: [4, 0, 0] });
  const J = J0(base), y = J.shL[1] - .08;
  const a = { ...base, ...ikArms([.2, y, .64], [.6, -.6, -.2], 'w') };
  const b = { ...base, ...ikArms([.21, y - .02, .12], [.4, .3, -1], 'w') };
  return { frames: [a, b], props: [() => S(seatBox(), box([0, J.neckB[1] - .2, .3], AX, [.16, .17, .04], 'pad')), J => [...machineHandles(J, [0, 1, 0]), cap(J.armL.grip, [.3, J.armL.grip[1] + .4, .8], .02, 'frame'), cap(J.armR.grip, [-.3, J.armR.grip[1] + .4, .8], .02, 'frame')]], labels: ['Pull handles to ribs', 'Extend slowly'], t1: 1, t2: 1.6, view: V3(55, 10) };
};
M.invertedRow = ({ susp = false } = {}) => {
  const ank = [0, .08, 1.25];
  const sup = beta => { const b = beta * D2R, u = [0, Math.sin(b), -Math.cos(b)]; return { root: madd(ank, u, .93), pel: [-(90 - beta), 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 4, ...symLegs({ el: 0, az: 3, bend: 2 }) }; };
  const b0 = sup(24), Jb = J0(b0);
  const n = front(-(90 - 24));
  const bar = madd(Jb.shL, n, .6);
  const hands = ikArms([.3, bar[1], bar[2]], [.6, -.3, .3], 'w');
  if (susp) { hands.aL.t = [.12, bar[1], bar[2] - .02]; hands.aR.t = [-.12, bar[1], bar[2] - .02]; }
  const a = { ...b0, ...hands }, b = { ...sup(37), ...hands };
  const props = susp ? [J => [...PROP.band(J.armL.grip, [0, 2.4, bar[2] - .05], 'strap'), ...PROP.band(J.armR.grip, [0, 2.4, bar[2] - .05], 'strap')]] :
    [() => S(...segCap([-.8, bar[1] - .02, bar[2]], [.8, bar[1] - .02, bar[2]], .018, 'steel', 5), cap([.8, 0, bar[2]], [.8, 1.6, bar[2]], .03, 'frame'), cap([-.8, 0, bar[2]], [-.8, 1.6, bar[2]], .03, 'frame'))];
  return { frames: [a, b], props, labels: ['Pull chest to the bar', 'Lower to straight arms'], t1: 1.1, t2: 1.6, view: V3(70, 8) };
};
M.renegade = () => {
  const ank = [0, .19, 0], t0 = plank(22, ank, { el: 0, az: 8, bend: 2 }), Jt = J0(t0), hz = Jt.shL[2] + .03;
  const down = s => ({ t: [s * .25, .1, hz], pole: [s * .6, .3, -.7], f: 'w' });
  const up = s => ({ t: [s * .23, .4, hz - .18], pole: [s * .3, 1, -1], f: 'w' });
  const a = { ...t0, aL: down(1), aR: down(-1) };
  const b = { ...t0, aL: up(1), aR: down(-1), pel: [68, 0, -4] };
  const c = { ...t0, aL: down(1), aR: up(-1), pel: [68, 0, 4] };
  return { frames: [a, b, a, c], props: [J => PROP.dbs(J, [0, 0, 1], 'w', { r: .065 })], labels: ['Row left', 'Lower', 'Row right', 'Lower'], durs: [.9, .9, .9, .9], view: V3(55, 18) };
};
M.shrug = ({ imp = 'bb' } = {}) => {
  const arms = imp === 'bb' ? symArms({ el: 5, az: 14, bend: 4 }) : imp === 'trap' ? symArms({ el: 6, az: 22, bend: 4 }) : symArms({ el: 4, az: 20, bend: 6 });
  const a = stand({ ...arms, ...LEGS_STAND(.15) });
  const b = { ...a, shrug: 1 };
  const props = imp === 'bb' ? [J => PROP.barbell(J)] : imp === 'trap' ? [J => trapBar(J)] : [J => PROP.dbs(J, 'pf')];
  return { frames: [a, b], props, labels: ['Shrug shoulders to ears', 'Lower slowly'], t1: .9, t2: 1.4, h1: .6, view: V3(40, 6) };
};
function trapBar(J) {
  const L = J.armL.grip, R = J.armR.grip, c = mid(L, R), y = c[1], out = [];
  const pts = [[.18, -.32], [.36, -.18], [.36, .22], [.18, .36], [-.18, .36], [-.36, .22], [-.36, -.18], [-.18, -.32]].map(([x, z]) => [c[0] + x * 1.15, y, c[2] + z]);
  for (let i = 0; i < pts.length; i++) out.push(cap(pts[i], pts[(i + 1) % pts.length], .016, 'steel'));
  out.push(cap([c[0] + .41, y, c[2] + .02], [c[0] + .85, y, c[2] + .02], .02, 'steel'), cap([c[0] - .41, y, c[2] + .02], [c[0] - .85, y, c[2] + .02], .02, 'steel'));
  for (const s of [1, -1]) out.push(disc([c[0] + s * .62, y, c[2] + .02], [1, 0, 0], .225, 'plate', { th: .045 }));
  return out;
}
M.farmer = ({ imp = 'db', only = null } = {}) => {
  const step = (s) => ({ lL: { el: s > 0 ? 22 : 12, az: s > 0 ? 2 : 178, bend: s > 0 ? 18 : 28 }, lR: { el: s > 0 ? 12 : 22, az: s > 0 ? 178 : 2, bend: s > 0 ? 28 : 18 } });
  const arms = symArms(imp === 'kb' ? { el: 11, az: 86, bend: 5 } : { el: 4, az: 14, bend: 4 });
  const a = { root: [0, .97, 0], pel: [2, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...arms, ...step(1), snap: true };
  const b = { ...a, ...step(-1) };
  const props = imp === 'kb' ? [J => [...PROP.kb(J, 'down', 'L'), ...PROP.kb(J, 'down', 'R')]] : imp === 'trap' ? [J => trapBar(J)] : [J => PROP.dbs(J, 'pf', 'c', only ? { only } : undefined)];
  if (only) { a.aR = b.aR = { el: 8, az: 30, bend: 10 }; a.tho = b.tho = [0, 0, -3]; }
  return { frames: [a, b], props, labels: ['Step', 'Step'], hl: only || undefined, t1: .55, t2: .55, h1: .02, h2: .02, view: V3(70, 6) };
};

/* ---------- curls ---------- */
M.curl = ({ imp = 'bb', grip = 'sup', cable = false, band = false, zott = false } = {}) => {
  const base = stand({ ...LEGS_STAND(.15) });
  const az = imp === 'ez' ? 10 : 13;
  const a = { ...base, ...symArms({ el: 5, az, bend: 8 }) };
  const b = { ...base, ...symArms({ el: 16, az, bend: 140 }) };
  let props;
  if (imp === 'bb') props = [J => PROP.barbell(J, { len: .72, plates: 1, pr: .2 })];
  else if (imp === 'ez') props = [J => PROP.ezbar(J)];
  else if (imp === 'db') props = [J => PROP.dbs(J, grip === 'neu' ? 'pf' : 'pn')];
  else if (imp === 'cable' && grip === 'neu') props = [() => S(...PROP.stack([0, 0, .6])), J => PROP.rope(J, [0, .14, .5])];
  else if (imp === 'cable') props = [J => PROP.bar(J, { half: .26 }), () => S(...PROP.stack([0, 0, .6])), J => PROP.cable(mid(J.armL.grip, J.armR.grip), [0, .14, .5])];
  else if (imp === 'band') props = [J => [...PROP.band(J.armL.grip, J.legL.toe), ...PROP.band(J.armR.grip, J.legR.toe)]];
  if (zott) return { frames: [{ ...a, grip: 'sup' }, { ...b, grip: 'sup' }, { ...b, grip: 'pro' }, { ...a, grip: 'pro' }], props, labels: ['Curl up, palms up', 'Turn palms down at the top', 'Lower slowly, palms down', 'Turn palms up at the bottom'], durs: [1.1, .5, 1.8, .5], view: V3(40, 8) };
  return { frames: [a, b], props, labels: ['Curl up, elbows still', 'Lower all the way'], t1: 1.1, t2: 1.8, view: V3(imp === 'cable' ? 82 : 60, 8) };
};
M.inclineCurl = () => {
  const B = lieBench(55);
  const base = { root: B.root, pel: [B.p, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 14, ...B.legs };
  const a = { ...base, ...symArms({ el: 34, az: 172, bend: 6 }) };
  const b = { ...base, ...symArms({ el: 34, az: 172, bend: 128 }) };
  return { frames: [a, b], props: [() => benchProps(B, 55), J => PROP.dbs(J, 'pn')], labels: ['Curl up, arms stay back', 'Lower to full stretch'], t1: 1.1, t2: 1.8, view: V3(72, 6) };
};
M.preacher = ({ imp = 'ez' } = {}) => {
  const base = seated({ root: [0, .62, 0], pel: [8, 0, 0] });
  const a = { ...base, ...symArms({ el: 42, az: 9, bend: 14 }) };
  const b = { ...base, ...symArms({ el: 42, az: 9, bend: 122 }) };
  const props = [() => S(seatBox(-.02, .5)), J => {
    const d = J.armL.d;
    const nn = norm(cross(d, [1, 0, 0])); const out = mul(nn, nn[1] > 0 ? 1 : -1); // up-ish normal
    const c = add(mid(mid(J.shL, J.armL.j1), mid(J.shR, J.armR.j1)), mul(out, -.09));
    return [box(add(c, mul(out, -.02)), [[1, 0, 0], d, out], [.27, .21, .05], 'pad', { bias: -.5 }), cap(madd(c, out, -.06), [0, .03, c[2] - .05], .035, 'frame')];
  }, imp === 'db' ? (J => PROP.dbs(J, 'pn')) : (J => PROP.ezbar(J))];
  return { frames: [a, b], props, labels: ['Curl up', 'Lower to almost straight'], t1: 1.1, t2: 1.9, view: V3(65, 8) };
};
M.concentration = () => {
  const base = seated({ root: [0, .57, 0], pel: [20, 0, 0], lum: [14, 0, 0], neck: -8, ...ikLegs([.34, .08, .44], [.4, 1, .6], [.25, 0, 1]) });
  const J = J0(base);
  const aR = { t: [-.3, .62, .46], pole: [-1, 0, -.3], f: 'w' };
  const a = { ...base, aR, aL: { el: 36, az: -6, bend: 10 } };
  const b = { ...base, aR, aL: { el: 36, az: -6, bend: 128 } };
  return { frames: [a, b], props: [() => S(seatBox(-.02)), J => PROP.dbs(J, 'pn', 'c', { only: 'L' })], labels: ['Curl toward shoulder', 'Lower all the way'], hl: 'L', t1: 1.1, t2: 1.8, view: V3(25, 12) };
};
M.bayesian = () => {
  const legs = { lL: { t: [.14, .08, .3], pole: [.3, 0, 1], fd: [.15, 0, 1] }, lR: { t: [-.14, .08, -.25], pole: [-.3, 0, 1], fd: [-.15, 0, 1] } };
  const base = stand({ ...legs, root: [0, .98, .03], pel: [8, 0, 0] });
  const a = { ...base, aL: { el: 28, az: 172, bend: 8 } };
  const b = { ...base, aL: { el: 28, az: 172, bend: 125 } };
  const an = [.18, .9, -.85];
  return { frames: [a, b], props: [() => S(...PROP.stack([.18, 0, -.98])), J => [...PROP.cable(J.armL.grip, an), cap(madd(J.armL.grip, J.armL.pn, -.06), madd(J.armL.grip, J.armL.pn, .06), .02, 'iron')]], labels: ['Curl, upper arm stays back', 'Lower to full stretch'], hl: 'L', t1: 1.1, t2: 1.8, view: V3(80, 8) };
};
M.spider = () => {
  const p = 45;
  const base = { root: [0, .84, -.34], pel: [p, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: -10, ...ikLegs([.16, .08, -.8], [.3, 0, 1], [.1, 0, 1]) };
  const a = { ...base, ...symArms({ el: 45, az: 4, bend: 6 }) };
  const b = { ...base, ...symArms({ el: 45, az: 4, bend: 128 }) };
  const u = spine(p), n = front(p);
  return { frames: [a, b], props: [() => S(padAlong(add(madd(base.root, n, .12), mul(u, -.25)), u, mul(n, -1), .9, .15, .04), cap(add(base.root, [0, -.2, .1]), [0, .03, base.root[2] + .1], .03, 'frame'), cap([0, .03, base.root[2] - .3], [0, .03, base.root[2] + .6], .03, 'frame')), J => PROP.dbs(J, 'pn')], labels: ['Curl up and squeeze', 'Lower slowly'], t1: 1, t2: 1.8, view: V3(65, 8) };
};
M.wristCurl = ({ rev = false } = {}) => {
  const base = seated({ root: [0, .57, 0], pel: [28, 0, 0], lum: [8, 0, 0], neck: -10, ...ikLegs([.15, .08, .5], [.1, 1, .6], [.1, 0, 1]) });
  const J = J0(base);
  const k = J.legL.j1;
  const t = s => ({ t: [s * .13, k[1] + .1, k[2] + .05], pole: [s * .3, -1, -.3], f: 'w', tw: true });
  const a = { ...base, aL: { ...t(1), wr: rev ? 45 : -50 }, aR: { ...t(-1), wr: rev ? 45 : -50 } };
  const b = { ...base, aL: { ...t(1), wr: rev ? -45 : 50 }, aR: { ...t(-1), wr: rev ? -45 : 50 } };
  return { frames: [a, b], props: [() => S(seatBox(-.02)), J => PROP.dbs(J, 'pn', 'c', { half: .12, r: .06 })], labels: ['Curl wrists up', 'Lower to a stretch'], t1: .8, t2: 1.2, view: V3(55, 18) };
};

/* ---------- triceps ---------- */
M.pushdown = ({ rope = false, band = false } = {}) => {
  const base = stand({ pel: [8, 0, 0], ...LEGS_STAND(.15, -.05) });
  const a = { ...base, ...symArms({ el: 9, az: 9, bend: 98 }) };
  const b = { ...base, ...symArms({ el: 11, az: rope ? 20 : 9, bend: 4 }) };
  const an = [0, 2.05, .42];
  const props = band ? [J => [...PROP.band(J.armL.grip, [0, 2.0, .3]), ...PROP.band(J.armR.grip, [0, 2.0, .3])]] :
    rope ? [() => S(...PROP.stack([0, 0, .55], 2.2)), J => PROP.rope(J, an)] : [() => S(...PROP.stack([0, 0, .55], 2.2)), J => PROP.bar(J, { half: .2 }), J => PROP.cable(mid(J.armL.grip, J.armR.grip), an)];
  return { frames: [a, b], props, labels: ['Push down, elbows pinned', 'Let it rise to 90°'], t1: 1, t2: 1.6, view: V3(band ? 70 : 96, 6) };
};
M.ohExt = ({ imp = 'db' } = {}) => {
  if (imp === 'cable') {
    const legs = { lL: { t: [.14, .08, .32], pole: [.3, 0, 1], fd: [.15, 0, 1] }, lR: { t: [-.14, .08, -.25], pole: [-.3, 0, 1], fd: [-.15, 0, 1] } };
    const base = stand({ ...legs, root: [0, .97, .05], pel: [22, 0, 0], neck: -10 });
    const a = { ...base, ...symArms({ el: 150, az: 10, bend: 128 }) };
    const b = { ...base, ...symArms({ el: 152, az: 10, bend: 6 }) };
    const an = [0, 1.75, -.85];
    return { frames: [a, b], props: [() => S(...PROP.stack([0, 0, -.98], 2.1)), J => PROP.rope(J, an)], labels: ['Extend arms forward', 'Bend behind head'], t1: 1, t2: 1.7, view: V3(80, 6) };
  }
  const base = seated({});
  const a = { ...base, ...symArms({ el: 166, az: 12, bend: 138 }) };
  const b = { ...base, ...symArms({ el: 166, az: 12, bend: 8 }) };
  return { frames: [a, b], props: [() => S(seatBox(), uprightBack(-6)), J => PROP.db2(J)], labels: ['Extend overhead', 'Lower behind head'], t1: 1.1, t2: 1.8, view: V3(70, 6) };
};
M.skull = ({ imp = 'ez' } = {}) => {
  const B = lieBench(0);
  const base = { root: B.root, pel: [B.p, 0, 0], lum: [-3, 0, 0], tho: [-2, 0, 0], neck: 0, ...B.legs };
  const a = { ...base, ...symArms({ el: 100, az: 8, bend: 8 }) };
  const b = { ...base, ...symArms({ el: 104, az: 8, bend: 112 }) };
  if (imp === 'db') { a.aL = a.aR = { el: 100, az: 14, bend: 8 }; b.aL = b.aR = { el: 104, az: 14, bend: 112 }; }
  return { frames: [a, b], props: [() => benchProps(B, 0), imp === 'db' ? (J => PROP.dbs(J)) : (J => PROP.ezbar(J))], labels: [imp === 'db' ? 'Lower dumbbells beside your head' : 'Lower bar to forehead', 'Extend to lockout'], t1: 1.6, t2: 1.1, view: V3(80, 10) };
};
M.kickback = () => {
  const base = stand({ root: [0, .9, -.14], pel: [58, 0, 0], lum: [10, 0, 0], neck: -18, ...LEGS_STAND(.15) });
  const a = { ...base, ...symArms({ el: 18, az: 178, bend: 92 }) };
  const b = { ...base, ...symArms({ el: 20, az: 178, bend: 2 }) };
  return { frames: [a, b], props: [J => PROP.dbs(J, 'pf')], labels: ['Straighten arm back', 'Return to 90°'], t1: .9, t2: 1.4, h1: .5, view: V3(80, 8) };
};
M.benchDip = () => {
  const legs = ikLegs([.12, .08, .78], [.1, 1, .3], [.05, .4, 1]);
  const hands = ikArms([.2, .5, -.1], [.2, 0, -1], 'w', { flat: true, hd: [0, 0, 1] });
  const a = { root: [0, .62, .08], pel: [4, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...legs, ...hands };
  const b = { ...a, root: [0, .33, .11], pel: [7, 0, 0] };
  return { frames: [a, b], props: [() => S(...benchAcross([0, -.24], 1.1, .44))], labels: ['Lower until elbows are 90°', 'Press back up'], t1: 1.5, t2: 1, view: V3(72, 10) };
};
M.dip = ({ chest = false, machine = false } = {}) => {
  const lean = chest ? 24 : 4, u = spine(lean);
  const legs = symLegs({ el: chest ? 18 : 6, az: 3, bend: 85 });
  const hands = ikArms([.26, 1.28, 0], [.3, 0, -1], 'w');
  const top = { root: [0, 1.28 + .58 - .455 * u[1], -.455 * u[2]], pel: [lean, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...legs, ...hands };
  const bot = { ...top, root: add(top.root, [0, -.3, chest ? -.04 : -.02]), pel: [lean + (chest ? 6 : 4), 0, 0] };
  const props = [() => S(...segCap([.26, 1.25, -.35], [.26, 1.25, .45], .02, 'steel', 3), ...segCap([-.26, 1.25, -.35], [-.26, 1.25, .45], .02, 'steel', 3), cap([.26, 1.25, -.35], [.26, 0, -.35], .03, 'frame'), cap([-.26, 1.25, -.35], [-.26, 0, -.35], .03, 'frame'), cap([.26, 1.25, .45], [.26, 0, .45], .03, 'frame'), cap([-.26, 1.25, .45], [-.26, 0, .45], .03, 'frame'))];
  return { frames: [top, bot], props, labels: ['Lower until upper arms are level', 'Press back up'], t1: 1.6, t2: 1.1, view: V3(65, 6) };
};

/* ---------- squats & lunges ---------- */
M.squat = ({ imp = 'bb', front: fr = false, smith = false, bw = false, goblet = false, sumo = false, jump = false, box: boxS = false, side = false, pause = false } = {}) => {
  const w = sumo ? .34 : goblet ? .2 : .17, toe = sumo ? .55 : .3;
  const legs = ikLegs([w, .08, smith ? .12 : 0], [sumo ? .7 : .4, 0, 1], [toe, 0, 1]);
  let lean = fr ? 16 : goblet ? 24 : smith ? 22 : sumo ? 18 : bw ? 34 : 42;
  const top = stand({ ...legs, pel: [fr || goblet || sumo || smith ? 0 : 3, 0, 0] });
  let bot = { ...top, root: [0, sumo ? .58 : fr ? .5 : .52, fr ? -.2 : -(lean / 42) * .24 - (smith ? .02 : 0)], pel: [lean, 0, 0], neck: -14 };
  let arms;
  if (bw || jump) { top.aL = top.aR = { el: 20, az: 20, bend: 30 }; bot.aL = bot.aR = { el: 88, az: 6, bend: 4 }; }
  else if (fr) arms = ikArms([.22, .02, .17], [.15, .25, 1]);
  else if (goblet) arms = ikArms([.06, -.13, .25], [.4, -1, .3]);
  else if (sumo) arms = symArms({ el: 4, az: -6, bend: 4 });
  else if (side) arms = symArms({ el: 4, az: 12, bend: 4 });
  else arms = ikArms([.42, .01, -.075], [.4, -1, -.4]);
  if (arms) { Object.assign(top, arms); Object.assign(bot, arms); }
  if (sumo) { bot.root = [0, .62, -.08]; }
  if (side) { bot.root = [0, .56, -.12]; bot.pel = [28, 0, 0]; }
  if (boxS) { bot.root = [0, .6, -.26]; bot.pel = [36, 0, 0]; }
  const props = [];
  if (fr || imp === 'bb' && !bw && !goblet && !sumo && !jump && !side) props.push(J => PROP.barbell(J));
  if (side) props.push(J => PROP.dbs(J));
  if (boxS) props.push(() => S(box([0, .215, -.36], AX, [.2, .215, .18], 'pad', { bias: -1 })));
  if (smith) props.push(() => { const z = J0(top).armL.grip[2]; return [...segCap([.75, 0, z], [.75, 2, z], .025, 'frame', 4), ...segCap([-.75, 0, z], [-.75, 2, z], .025, 'frame', 4)]; });
  if (goblet) props.push(imp === 'kb' ? (J => PROP.kb(J, 'down')) : (J => PROP.db2(J, [0, 1, 0])));
  if (sumo) props.push(imp === 'kb' ? (J => PROP.kb(J, 'down')) : (J => PROP.db2(J, [0, 1, 0])));
  if (jump) {
    const air = { ...top, root: [0, 1.22, 0], ...ikLegs([.15, .3, 0], [.3, 0, 1], [.1, -1.2, 1]), aL: { el: 25, az: 160, bend: 10 }, aR: { el: 25, az: 160, bend: 10 } };
    return { frames: [top, bot, air, top], props, labels: ['Dip down', 'Explode up', 'Land softly', 'Reset'], durs: [.8, .35, .45, .6], view: V3(65, 6) };
  }
  if (boxS) return { frames: [top, bot], props, labels: ['Sit back to the box', 'Drive up without rocking'], t1: 1.8, t2: 1.1, h2: .6, view: V3(66, 6) };
  return { frames: [top, bot], props, labels: [pause ? 'Sit down and pause' : 'Sit down and back', 'Drive up through midfoot'], t1: 1.7, t2: 1.1, h2: pause ? 1.5 : undefined, view: V3(sumo ? 28 : 66, 6) };
};
M.legPress = () => {
  const p = -50, root = [0, .5, 0], u = spine(p), hip = madd(root, u, -.06);
  const r = [0, Math.SQRT1_2, Math.SQRT1_2], fdd = [0, Math.SQRT1_2, -Math.SQRT1_2];
  const ext = add(hip, mul(r, .8)), bend = add(add(hip, mul(r, .4)), mul(fdd, .08));
  const legsAt = c => ({ lL: { t: [.16, c[1], c[2]], pole: [.3, 1, 0], fd: fdd }, lR: { t: [-.16, c[1], c[2]], pole: [-.3, 1, 0], fd: fdd } });
  const base = { root, pel: [p, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 18, ...ikArms([.3, .48, .12], [1, 0, -.3], 'w') };
  const a = { ...base, ...legsAt(ext) }, b = { ...base, ...legsAt(bend) };
  const n = front(p);
  const props = [() => S(padAlong(add(madd(root, mul(n, -1), .105), mul(u, -.1)), u, n, .85, .17, .045), box([0, .36, .1], AX, [.18, .04, .2], 'pad'), cap([0, .3, -.1], [0, .03, -.15], .04, 'frame'),
    ...[.33, -.33].map(x => cap([x, .25, .45], [x, 1.15, 1.35], .03, 'frame')), cap([.33, .03, .2], [.33, .25, .45], .03, 'frame'), cap([-.33, .03, .2], [-.33, .25, .45], .03, 'frame')),
  J => { const c = add(add(mid(J.legL.ankle, J.legR.ankle), mul(r, .1)), mul(fdd, .07)); return [box(c, [[1, 0, 0], fdd, r], [.32, .26, .025], 'frame', { bias: .2 })]; }];
  return { frames: [a, b], props, labels: ['Lower sled to 90°', 'Press through heels'], t1: 1.7, t2: 1.1, view: V3(70, 10) };
};
M.hackSquat = () => {
  const p = -14, u = spine(p), n = front(p);
  const legs = ikLegs([.16, .1, .26], [.35, 0, 1], [.25, 0, 1]);
  const top = { root: [0, 1.0, 0], pel: [p, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...legs, ...ikArms([.28, .04, .06], [1, -1, 0]) };
  const bot = { ...top, root: [0, .56, -.18] };
  const props = [J => [padAlong(add(madd(J.root, mul(n, -1), .12), mul(u, -.2)), u, n, .85, .17, .045), cap(add(J.shL, [0, .08, -.06]), add(J.shL, [0, .08, .12]), .045, 'pad'), cap(add(J.shR, [0, .08, -.06]), add(J.shR, [0, .08, .12]), .045, 'pad')],
  () => S(box([0, .02, .3], AX, [.38, .02, .25], 'frame'))];
  return { frames: [top, bot], props, labels: ['Lower deep, back on pad', 'Drive up'], t1: 1.7, t2: 1.1, view: V3(65, 8) };
};
M.legExt = () => {
  const base = seated({ root: [0, .64, 0], pel: [-12, 0, 0], ...symArms({ el: 12, az: 30, bend: 30 }) });
  const a = { ...base, ...symLegs({ el: 86, az: 3, bend: 90 }) };
  const b = { ...base, ...symLegs({ el: 86, az: 3, bend: 6 }) };
  const props = [() => S(box([0, .26, .12], AX, [.2, .26, .25], 'pad', { bias: -1 }), uprightBack(-12, .56, -.115)), J => {
    const rc = mid(add(madd(J.legL.ankle, J.legL.c, -.06), mul(J.legL.pf, -.09)), add(madd(J.legR.ankle, J.legR.c, -.06), mul(J.legR.pf, -.09)));
    const pv = [.3, J.legL.j1[1], J.legL.j1[2]];
    return [cap(add(rc, [-.24, 0, 0]), add(rc, [.24, 0, 0]), .05, 'pad'), cap([.3, rc[1], rc[2]], pv, .022, 'frame')];
  }];
  return { frames: [a, b], props, labels: ['Straighten legs, squeeze', 'Lower slowly'], t1: 1, t2: 1.7, h1: .5, view: V3(62, 8) };
};
M.legCurl = ({ seat = false, ball = false, sliders = false } = {}) => {
  if (ball || sliders) {
    const sh = [0, .12, -.2];
    const pose = (ank, hipY) => {
      const r = [0, hipY, ank[2] - .5];
      const v = sub(sh, r); const p = Math.atan2(v[2], v[1]) / D2R; // spine dir from pelvis to shoulders
      const rr = madd(sh, norm(v), -.455);
      return { root: rr, pel: [p, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 18, ...ikLegs([.09, ank[1], ank[2]], [.1, 1, .2], [0, .9, .2]), ...floorArms(sh[2]) };
    };
    const a = pose([0, ball ? .66 : .08, 1.0], ball ? .46 : .38), b = pose([0, ball ? .66 : .08, .6], ball ? .62 : .55);
    for (const f of [a, b]) f.neck = -(90 + f.pel[0]) - 2;
    const props = ball ? [J => [sph([0, .28, mid(J.legL.heel, J.legR.heel)[2] + .02], .28, 'ball')]] : [J => [disc([J.legL.heel[0], .006, J.legL.heel[2]], [0, 1, 0], .08, 'ball2', { th: .01 }), disc([J.legR.heel[0], .006, J.legR.heel[2]], [0, 1, 0], .08, 'ball2', { th: .01 })]];
    props.unshift(floorMat());
    return { frames: [a, b], props, labels: ['Curl heels in, hips high', 'Extend slowly'], t1: 1.1, t2: 1.6, view: V3(70, 10) };
  }
  if (seat) {
    const base = seated({ root: [0, .64, 0], pel: [-14, 0, 0], ...symArms({ el: 12, az: 30, bend: 30 }) });
    const a = { ...base, ...symLegs({ el: 84, az: 3, bend: 6 }) };
    const b = { ...base, ...symLegs({ el: 84, az: 3, bend: 100 }) };
    const props = [() => S(box([0, .26, .12], AX, [.2, .26, .25], 'pad', { bias: -1 }), uprightBack(-14, .56, -.115), box([0, .78, .28], AX, [.24, .04, .1], 'pad')), J => { const rc = mid(add(madd(J.legL.ankle, J.legL.c, -.05), mul(J.legL.pf, .08)), add(madd(J.legR.ankle, J.legR.c, -.05), mul(J.legR.pf, .08))); return [cap(add(rc, [-.24, 0, 0]), add(rc, [.24, 0, 0]), .05, 'pad'), cap([.3, rc[1], rc[2]], [.3, .66, .4], .022, 'frame')]; }];
    return { frames: [a, b], props, labels: ['Curl heels under you', 'Extend slowly'], t1: 1, t2: 1.7, view: V3(62, 8) };
  }
  const base = { root: [0, .6, 0], pel: [84, 0, 0], lum: [0, 0, 0], tho: [-4, 0, 0], neck: -10, ...ikArms([.25, .42, 1.05], [.5, 0, -1], 'w') };
  const a = { ...base, ...symLegs({ el: 6, az: 2, bend: 4 }) };
  const b = { ...base, ...symLegs({ el: 6, az: 2, bend: 112 }) };
  const props = [() => S(padAlong([0, .5, -.75], [0, 0, 1], [0, 1, 0], 1.85, .15, .045), cap([0, .45, .5], [0, .03, .5], .03, 'frame'), cap([0, .45, -.5], [0, .03, -.5], .03, 'frame')), J => { const rc = mid(add(madd(J.legL.ankle, J.legL.c, -.03), mul(J.legL.pf, .08)), add(madd(J.legR.ankle, J.legR.c, -.03), mul(J.legR.pf, .08))); return [cap(add(rc, [-.24, 0, 0]), add(rc, [.24, 0, 0]), .05, 'pad')]; }];
  return { frames: [a, b], props, labels: ['Curl heels to glutes', 'Lower slowly'], t1: 1, t2: 1.7, view: V3(70, 12) };
};
M.lunge = ({ type = 'fwd', imp = 'db' } = {}) => {
  const arms = symArms({ el: 4, az: 14, bend: 6 });
  const top = stand({ ...arms, ...LEGS_STAND(.12) });
  const frontL = (s, z) => ({ t: [s * .12, .08, z], pole: [s * .2, 0, 1], fd: [s * .1, 0, 1] });
  const backL = (s, z) => ({ t: [s * .12, .14, z], pole: [s * .1, -1, .4], fd: [0, -.6, .8] });
  const props = imp === 'db' ? [J => PROP.dbs(J, 'pf')] : imp === 'bb' ? [J => PROP.barbell(J)] : [];
  if (imp === 'bb') { Object.assign(top, ikArms([.42, .01, -.075], [.4, -1, -.4])); }
  if (imp === 'bw') Object.assign(top, ikArms([.17, .03, .03], [1, .2, -.9], 'p', { hc: .25 }));
  const lungeL = type === 'rev' ? { ...top, root: [0, .52, -.1], pel: [6, 0, 0], lL: frontL(1, .02), lR: backL(-1, -.72) } : { ...top, root: [0, .52, .26], pel: [6, 0, 0], lL: frontL(1, .64), lR: backL(-1, -.06) };
  const lungeR = type === 'rev' ? { ...top, root: [0, .52, -.1], pel: [6, 0, 0], lR: frontL(-1, .02), lL: backL(1, -.72) } : { ...top, root: [0, .52, .26], pel: [6, 0, 0], lR: frontL(-1, .64), lL: backL(1, -.06) };
  if (type === 'split' || type === 'bulgarian') {
    const bul = type === 'bulgarian';
    const legs = { lL: frontL(1, bul ? .3 : .38), lR: bul ? { t: [-.12, .55, -.62], pole: [-.1, -1, .4], fd: [0, -.35, -.94] } : backL(-1, -.5) };
    const a = { ...top, ...legs, root: [0, bul ? .92 : .86, -.07] }, b = { ...a, root: [0, bul ? .54 : .52, -.08], pel: [bul ? 14 : 6, 0, 0] };
    if (bul) props.push(() => S(...benchAcross([0, -.72], 1, .44)));
    return { frames: [a, b], props, labels: ['Drop back knee down', 'Drive through front heel'], t1: 1.5, t2: 1.1, view: V3(72, 6) };
  }
  return { frames: [top, lungeL, top, lungeR], props, labels: ['Step and lower', 'Drive back up', 'Step and lower', 'Drive back up'], durs: [1.2, 1, 1.2, 1], view: V3(72, 6) };
};
M.stepUp = () => {
  const arms = symArms({ el: 4, az: 14, bend: 6 });
  const a = stand({ ...arms, root: [0, .98, -.02], pel: [10, 0, 0], lL: { t: [.13, .55, .34], pole: [.2, 0, 1], fd: [.1, 0, 1] }, lR: { t: [-.13, .08, -.1], pole: [-.2, 0, 1], fd: [-.1, 0, 1] } });
  const m = { ...a, root: [0, 1.3, .2], pel: [8, 0, 0], lR: { t: [-.13, .6, -.04], pole: [-.2, 0, 1], fd: [-.1, -.25, 1] } };
  const b = { ...a, root: [0, 1.45, .32], pel: [2, 0, 0], lR: { t: [-.13, .55, .3], pole: [-.2, 0, 1], fd: [-.1, 0, 1] } };
  return { frames: [a, m, b, m], props: [() => S(box([0, .235, .4], AX, [.3, .235, .22], 'pad')), J => PROP.dbs(J, 'pf')], labels: ['Drive up through the top foot', 'Bring the trailing foot onto the box', 'Step back down slowly', 'Lower under control'], durs: [.9, .6, .6, 1.1], view: V3(70, 6) };
};
M.wallSit = () => {
  const a = { root: [0, .5, -.02], pel: [-2, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...ikLegs([.15, .08, .46], [.3, 0, 1], [.15, 0, 1]), ...symArms({ el: 8, az: 30, bend: 70 }) };
  const b = { ...a, root: add(a.root, [0, .006, 0]) };
  return { frames: [a, b], props: [() => S(box([0, 1.1, -.2], AX, [.7, 1.1, .05], 'wall', { bias: -2 }))], labels: ['Hold — thighs level', 'Breathe, press back flat'], t1: 2, t2: 2, view: V3(72, 8) };
};
M.cossack = () => {
  const legs = (side) => ({
    lL: side > 0 ? { t: [.62, .08, 0], pole: [.4, 0, 1], fd: [.5, 0, 1] } : side < 0 ? { t: [.62, .1, 0], pole: [0, 0, 1], fd: [.2, .7, .7] } : { t: [.62, .08, 0], pole: [.4, 0, 1], fd: [.5, 0, 1] },
    lR: side < 0 ? { t: [-.62, .08, 0], pole: [-.4, 0, 1], fd: [-.5, 0, 1] } : side > 0 ? { t: [-.62, .1, 0], pole: [0, 0, 1], fd: [-.2, .7, .7] } : { t: [-.62, .08, 0], pole: [-.4, 0, 1], fd: [-.5, 0, 1] }
  });
  const arms = symArms({ el: 80, az: 8, bend: 40 });
  const c = { root: [0, .84, 0], pel: [10, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...legs(0), ...arms };
  const L = { ...c, root: [.36, .5, -.08], pel: [30, 0, 0], ...legs(1) }, R = { ...c, root: [-.36, .5, -.08], pel: [30, 0, 0], ...legs(-1) };
  return { frames: [c, L, c, R], props: [], labels: ['Shift and sit to the left', 'Return to centre', 'Shift and sit to the right', 'Return to centre'], durs: [1.3, 1, 1.3, 1], view: V3(10, 8) };
};

/* ---------- hinges ---------- */
M.deadlift = ({ imp = 'bb', sumo = false, rdl = false, single = false, rack = false } = {}) => {
  const w = sumo ? .38 : .14, toe = sumo ? .6 : .15;
  const legs = ikLegs([w, .08, -.04], [sumo ? .7 : .25, 0, 1], [toe, 0, 1]);
  const gw = sumo ? .16 : imp === 'trap' ? .28 : .24;
  const sides = imp === 'trap' ? 0 : .07;
  if (single) {
    const a = stand({ ...symArms({ el: 4, az: 10, bend: 4 }), lL: { t: [.11, .08, 0], pole: [.2, 0, 1], fd: [.1, 0, 1] }, lR: { el: 4, az: 2, bend: 4 } });
    const b = { ...a, root: [0, .9, -.12], pel: [78, 0, 0], neck: -14, lR: { el: 8, az: 2, bend: 6 }, ...symArms({ el: 78, az: 6, bend: 4 }) };
    return { frames: [a, b], props: [imp === 'kb' ? (J => PROP.kb(J, 'down', 'R')) : (J => PROP.dbs(J, 'pf', 'c', { only: 'R' }))], labels: ['Hinge, back leg rises', 'Squeeze glute to stand'], hl: 'L', t1: 1.6, t2: 1.2, view: V3(70, 6) };
  }
  if (rdl) {
    const top = stand({ ...legs, ...ikArms([gw, .82, .1], [.5, 0, -1], 'w') });
    const bot = { ...top, root: [0, .9, -.27], pel: [68, 0, 0], neck: -20, ...ikArms([gw, .4, .075], [.5, 0, -1], 'w') };
    if (imp === 'kb') { Object.assign(top, ikArms([.06, .86, .21], [.6, 0, -1], 'w')); Object.assign(bot, ikArms([.06, .44, .2], [.6, 0, -1], 'w')); }
    const props = imp === 'db' ? [J => PROP.dbs(J, 'pn')] : imp === 'kb' ? [J => PROP.kb(J, 'down')] : [J => PROP.barbell(J)];
    return { frames: [top, bot], props, labels: ['Push hips back, bar slides down', 'Squeeze glutes to stand'], t1: 1.8, t2: 1.2, view: V3(72, 6) };
  }
  const y0 = imp === 'trap' ? .24 : .235;
  const start = { root: [0, sumo ? .58 : .69, sumo ? -.18 : -.33], pel: [sumo ? 36 : 70, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: -18, ...legs, ...ikArms([gw, y0, sides], [.5, 0, -1], 'w') };
  const midp = { ...start, root: [0, sumo ? .74 : .85, sumo ? -.15 : -.28], pel: [sumo ? 26 : 44, 0, 0], ...ikArms([gw, .52, sides], [.5, 0, -1], 'w') };
  const end = { ...start, root: [0, 1, -.03], pel: [0, 0, 0], neck: 0, ...ikArms([gw, .83, sides + .02], [.5, 0, -1], 'w') };
  if (imp === 'trap') { start.root = [0, .58, -.12]; start.pel = [34, 0, 0]; midp.root = [0, .75, -.08]; midp.pel = [22, 0, 0]; }
  const props = imp === 'trap' ? [J => trapBar(J)] : [J => PROP.barbell(J)];
  if (rack) { const pinY = .5; props.push(() => S(cap([.42, pinY - .03, -.25], [.42, pinY - .03, .3], .02, 'frame'), cap([-.42, pinY - .03, -.25], [-.42, pinY - .03, .3], .02, 'frame'), cap([.42, 0, -.3], [.42, 1.9, -.3], .03, 'frame'), cap([-.42, 0, -.3], [-.42, 1.9, -.3], .03, 'frame'))); return { frames: [midp, end], props, labels: ['Drive hips through to lockout', 'Lower to the pins'], t1: 1, t2: 1.3, view: V3(70, 6) }; }
  return { frames: [start, midp, end, midp], props, labels: ['Push the floor away', 'Hips through to lockout', 'Hinge back down', 'Bar to the floor'], durs: [.8, .7, 1, .8], view: V3(70, 6) };
};
M.goodMorning = () => {
  const top = stand({ ...LEGS_STAND(.16), ...ikArms([.42, .01, -.075], [.4, -1, -.4]) });
  const bot = { ...top, root: [0, .93, -.2], pel: [72, 0, 0], neck: -18 };
  return { frames: [top, bot], props: [J => PROP.barbell(J)], labels: ['Hinge forward, soft knees', 'Drive hips forward'], t1: 1.8, t2: 1.2, view: V3(72, 6) };
};
M.backExt = () => {
  const legs = ikLegs([.11, .38, -.32], [.1, -1, .4], [0, -.3, 1]);
  const arms = ikArms([.14, -.1, .14], [1, -.5, .2]);
  const top = { root: [0, .96, .28], pel: [44, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: -6, ...legs, ...arms };
  const bot = { ...top, pel: [112, 0, 0], lum: [8, 0, 0], neck: 8 };
  const props = [() => S(box([0, .86, .42], [[1, 0, 0], norm([0, .7, -.7]), norm([0, .7, .7])], [.2, .1, .05], 'pad'), cap([.12, .3, -.34], [-.12, .3, -.34], .05, 'pad'), cap([.12, .45, -.31], [-.12, .45, -.31], .05, 'pad'), cap([0, .8, .35], [0, .03, -.4], .035, 'frame'), cap([0, .03, -.6], [0, .03, .5], .03, 'frame'))];
  return { frames: [top, bot], props, labels: ['Hinge down slowly', 'Raise to a straight line'], t1: 1.6, t2: 1.2, view: V3(70, 8) };
};
M.superman = () => {
  const base = { root: [0, .1, 0], pel: [90, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, snap: true };
  const a = { ...base, ...symLegs({ el: 2, az: 4, bend: 2, ank: 30 }), ...symArms({ el: 170, az: 14, bend: 6 }) };
  const b = { ...base, lum: [-12, 0, 0], tho: [-10, 0, 0], neck: -8, ...symLegs({ el: 14, az: 176, bend: 2, ank: 30 }), ...symArms({ el: 175, az: 160, bend: 6 }) };
  return { frames: [a, b], props: [floorMat()], labels: ['Lift arms, chest and legs', 'Lower slowly'], t1: 1.1, t2: 1.5, h1: .8, view: V3(70, 12) };
};
M.birdDog = () => {
  const P = 78, quad = { root: [0, .5, 0], pel: [P, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, anchor: { j: 'kneeR', at: [-.1, .05, -.02] } };
  const kneel = { el: 78, az: 2, bend: 92 };
  const base = { ...quad, lL: kneel, lR: kneel };
  const J = J0(base);
  const hand = s => ({ t: [s * .18, .035, (s > 0 ? J.shL : J.shR)[2] + .02], pole: [s * .2, .4, -1], f: 'w' });
  const a = { ...base, aL: hand(1), aR: hand(-1) };
  const reach = s => ({ t: [s * .2, (s > 0 ? J.shL : J.shR)[1] + .03, (s > 0 ? J.shL : J.shR)[2] + .53], pole: [s * .3, -1, 0], f: 'w', flat: true, hd: [0, 0, 1], hn: [0, -1, 0] });
  const kick = { el: -(90 - P) - 2, az: 2, bend: 3 };
  const b = { ...a, aL: reach(1), lR: kick };
  const c = { ...a, aR: reach(-1), lL: kick };
  // keep the supporting knee anchored
  for (const f of [a, b, c]) { f.root = J.root; delete f.anchor; }   // hips stay perfectly still: that is the whole point of the exercise
  return { frames: [a, b, a, c], props: [floorMat()], labels: ['Reach left arm, right leg', 'Return', 'Reach right arm, left leg', 'Return'], durs: [1.2, 1, 1.2, 1], view: V3(55, 18) };
};
M.kbSwing = ({ cable = false } = {}) => {
  const legs = ikLegs([.2, .08, 0], [.4, 0, 1], [.3, 0, 1]);
  const bot = { root: [0, .82, -.22], pel: [56, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: -18, ...legs, ...ikArms([.035, .58, -.14], [.4, .3, -1], 'w') };
  const top = { root: [0, 1, 0], pel: [-2, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...legs, ...ikArms([.035, 1.36, .6], [.4, -1, 0], 'w') };
  if (cable) {
    top.aL.t = [.06, .82, .18]; top.aR.t = [-.06, .82, .18];
    bot.aL.t = [.06, .45, -.12]; bot.aR.t = [-.06, .45, -.12];
    const an = [0, .15, -.9];
    return { frames: [bot, top], props: [() => S(...PROP.stack([0, 0, -1.02])), J => PROP.rope(J, an)], labels: ['Drive hips forward', 'Hinge back, rope between legs'], t1: 1, t2: 1.4, view: V3(72, 6) };
  }
  return { frames: [bot, top], props: [J => PROP.kb(J, 'arm')], labels: ['Snap hips — float the bell', 'Hike it back between legs'], t1: .6, t2: .7, h1: .1, h2: .05, view: V3(72, 6) };
};
M.nordic = () => {
  const base = { root: [0, .5, 0], pel: [0, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, anchor: { j: 'knees', at: [0, .05, 0] }, ...symArms({ el: 40, az: 14, bend: 90 }) };
  const a = { ...base, ...symLegs({ el: 0, az: 4, bend: 90 }) };
  const b = { ...base, pel: [62, 0, 0], ...symLegs({ el: 0, az: 4, bend: 28 }), ...symArms({ el: 110, az: 14, bend: 40 }) };
  return { frames: [a, b], props: [floorMat(), () => S(cap([.25, .14, -.42], [-.25, .14, -.42], .05, 'pad'))], labels: ['Lower as slowly as you can', 'Pull back up'], t1: 2.6, t2: 1.4, view: V3(75, 8) };
};

/* ---------- glutes ---------- */
M.hipThrust = ({ floor = false, single = false, imp = 'bb' } = {}) => {
  const banded = imp === 'band';
  const sh = floor ? [0, .12, -.36] : [0, .5, -.34];
  const feet = [.18, .08, .62];
  const mk = (rootY) => {
    const r0 = [0, rootY, floor ? .08 : .1];
    const v = sub(sh, r0), p = Math.atan2(v[2], v[1]) / D2R, root = madd(sh, norm(v), -.455);
    return { root, pel: [p, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: floor ? 10 : 22, ...ikLegs(feet, [.3, 1, .4], [.15, 0, 1]) };
  };
  const bot = mk(floor ? .14 : .27), top = mk(floor ? .44 : .52);
  if (floor) { bot.neck = -2; top.neck = -(90 + top.pel[0]) - 2; }
  let arms = imp === 'bb' ? ikArms([.3, .02, .16], [.4, 1, .4], 'p') : floor ? floorArms(sh[2]) : symArms({ el: 28, az: 34, bend: 4 });
  if (imp === 'db') arms = ikArms([.08, .02, .16], [.5, 1, .2], 'p');
  Object.assign(bot, arms); Object.assign(top, arms);
  if (single) { bot.lR = { el: 50, az: 2, bend: 6 }; top.lR = { el: 2, az: 2, bend: 6 }; }
  const props = [];
  if (!floor) props.push(() => S(...benchAcross([0, -.46], 1.1, .44)));
  else props.push(floorMat());
  if (imp === 'bb') props.push(J => PROP.barbell(J));
  if (imp === 'db') props.push(J => PROP.db2(J, [1, 0, 0]));
  if (banded) props.push(J => PROP.band(madd(J.legL.j1, J.legL.d, -.08), madd(J.legR.j1, J.legR.d, -.08)));
  return { frames: [bot, top], props, labels: ['Drive hips up, squeeze', 'Lower under control'], t1: 1, t2: 1.5, h1: .6, hl: single ? 'L' : undefined, view: V3(75, 8) };
};
M.kickback = M.kickback; // triceps one above
M.gluteKick = ({ quad = false } = {}) => {
  if (quad) {
    const P = 78, kneel = { el: 78, az: 2, bend: 92 };
    const base = { root: [0, .5, 0], pel: [P, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, lL: kneel, lR: kneel, anchor: { j: 'kneeR', at: [-.1, .05, 0] } };
    const J = J0(base);
    const hand = s => ({ t: [s * .18, .035, (s > 0 ? J.shL : J.shR)[2] + .02], pole: [s * .2, .4, -1], f: 'w' });
    const a = { ...base, aL: hand(1), aR: hand(-1) };
    const b = { ...a, lL: { el: -14, az: 2, bend: 90 } };
    return { frames: [a, b], props: [floorMat()], labels: ['Press heel to ceiling', 'Lower knee'], hl: 'L', t1: 1, t2: 1.3, h1: .5, view: V3(80, 10) };
  }
  const base = stand({ root: [0, 1, 0], pel: [14, 0, 0], lR: { t: [-.12, .08, .02], pole: [-.2, 0, 1], fd: [-.1, 0, 1] }, ...ikArms([.2, 1.15, .45], [1, -.3, 0], 'w') });
  const a = { ...base, lL: { el: 8, az: 4, bend: 10 } };
  const b = { ...base, lL: { el: 38, az: 178, bend: 8 } };
  const an = [.12, .12, .65];
  return { frames: [a, b], props: [() => S(...PROP.stack([.12, 0, .78])), J => PROP.cable(J.legL.ankle, an)], labels: ['Kick leg back, squeeze', 'Return slowly'], hl: 'L', t1: 1, t2: 1.4, h1: .4, view: V3(85, 6) };
};
function sideLying(o = {}) { return { root: [0, .12, 0], pel: [0, 0, -90], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, aR: { el: 170, az: 70, bend: 120 }, aL: { t: [.2, .035, .3], pole: [0, 1, 0], f: 'w' }, snap: true, ...o }; }
M.clamshell = () => {
  const bottom = { el: 45, az: 0, bend: 90 };
  const a = sideLying({ lR: bottom, lL: { t: [-.01, -.67, .0], pole: [0, 0, 1], f: 'p' } });
  const b = { ...a, lL: { t: [.02, -.66, .0], pole: [1, 0, .45], f: 'p' } };
  return { frames: [a, b], props: [() => S(box([0, .006, 0], AX, [1, .006, .35], 'mat', { bias: -3 })), J => PROP.band(mid(J.legL.j1, J.legL.base), mid(J.legR.j1, J.legR.base))], labels: ['Open top knee', 'Close slowly'], hl: 'L', t1: .9, t2: 1.3, h1: .5, view: V3(8, 24) };
};
M.sideLegRaise = ({ adduct = false } = {}) => {
  const a = sideLying({ lR: { el: 6, az: 0, bend: 8 }, lL: { el: 2, az: 90, bend: 2 } });
  const b = { ...a, lL: { el: 40, az: 90, bend: 2 } };
  return { frames: [a, b], props: [() => S(box([0, .006, 0], AX, [1, .006, .35], 'mat', { bias: -3 }))], labels: ['Lift top leg, toes forward', 'Lower slowly'], hl: 'L', t1: 1, t2: 1.4, view: V3(0, 30) };
};
M.fireHydrant = () => {
  const r = M.gluteKick({ quad: true });
  const a = r.frames[0], b = { ...a, lL: { el: 90, az: 62, bend: 90 } };
  return { ...r, frames: [a, b], labels: ['Lift knee out to the side', 'Lower slowly'], view: V3(205, 22) };
};
M.lateralWalk = () => {
  const legs = (l, r) => ({ lL: { t: [l, .08, 0], pole: [.4, 0, 1], fd: [.1, 0, 1] }, lR: { t: [r, .08, 0], pole: [-.4, 0, 1], fd: [-.1, 0, 1] } });
  const arms = symArms({ el: 40, az: 10, bend: 90 });
  const a = { root: [0, .82, -.06], pel: [22, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: -6, ...legs(.16, -.16), ...arms };
  const b = { ...a, root: [.12, .82, -.06], ...legs(.44, -.16) };
  const c = { ...a, root: [.24, .82, -.06], ...legs(.44, .12) };
  return { frames: [a, b, c, b], props: [J => PROP.band(J.legL.ankle, J.legR.ankle)], labels: ['Step out wide', 'Bring trail foot in', 'Step back', 'Return'], durs: [.8, .8, .8, .8], view: V3(15, 10) };
};
M.hipMachine = ({ abd = true } = {}) => {
  const base = seated({ root: [0, .64, 0], pel: [-12, 0, 0], ...symArms({ el: 15, az: 40, bend: 40 }) });
  const close = { ...base, ...symLegs({ el: 86, az: 4, bend: 86 }) };
  const open = { ...base, ...symLegs({ el: 86, az: 40, bend: 86 }) };
  return { frames: abd ? [close, open] : [open, close], props: [() => S(box([0, .26, .12], AX, [.2, .26, .25], 'pad', { bias: -1 }), uprightBack(-12, .56, -.115)), J => [J.legL, J.legR].map((G, i) => { const s = i ? -1 : 1; return box(add(mid(G.base, G.j1), [s * (abd ? .085 : -.085), 0, .08]), [[1, 0, 0], [0, 1, 0], [0, 0, 1]], [.025, .06, .16], 'pad', { bias: .1 }); })], labels: abd ? ['Push knees apart', 'Return slowly'] : ['Squeeze knees together', 'Open slowly'], t1: 1, t2: 1.5, view: V3(10, 42) };
};
M.cableHip = ({ abd = true } = {}) => {
  const base = stand({ lR: { t: [-.1, .08, 0], pole: [-.2, 0, 1], fd: [-.1, 0, 1] }, root: [-.03, 1, 0], aR: { t: [-.65, 1.15, .05], pole: [-1, -.4, 0], f: 'w' } });
  const a = { ...base, lL: abd ? { el: 3, az: 90, bend: 3 } : { el: 32, az: 90, bend: 3 } };
  const b = { ...base, lL: abd ? { el: 40, az: 90, bend: 3 } : { el: 12, az: -90, bend: 3 } };
  const an = abd ? [-.7, .12, 0] : [.9, .12, 0];
  return { frames: [a, b], props: [() => S(...PROP.stack([abd ? -.82 : 1.02, 0, 0])), J => PROP.cable(J.legL.ankle, an)], labels: abd ? ['Sweep leg out', 'Return slowly'] : ['Sweep leg across', 'Return slowly'], hl: 'L', t1: 1, t2: 1.4, view: V3(0, 8) };
};

/* ---------- calves & shins ---------- */
M.calfRaise = ({ step = false, single = false, machine = false, smith = false, seat = false, press = false } = {}) => {
  if (seat) {
    const legs = (y, f) => ikLegs([.12, y, .48], [.1, 1, .3], f);
    const base = seated({ root: [0, .6, 0], pel: [6, 0, 0], ...ikArms([.18, .82, .5], [1, -.3, -.3], 'w') });
    const a = { ...base, ...legs(.2, [0, .34, .94]) }, b = { ...base, ...legs(.28, [0, -.45, .9]) };
    return { frames: [a, b], props: [() => S(seatBox(), box([0, .07, .55], AX, [.25, .07, .1], 'frame')), J => [box(add(mid(J.legL.j1, J.legR.j1), [0, .085, .02]), AX, [.25, .03, .08], 'pad', { bias: .3 })]], labels: ['Raise heels high', 'Lower to a deep stretch'], t1: .9, t2: 1.4, h1: .5, view: V3(65, 8) };
  }
  if (press) {
    const r = M.legPress(); const ext = r.frames[0];
    const fd0 = ext.lL.fd;
    const pf = (t) => { const c = Math.cos(t * D2R), s = Math.sin(t * D2R); const R = [0, Math.SQRT1_2, Math.SQRT1_2]; return add(mul(fd0, c), mul(R, s)); };
    const a = { ...ext, lL: { ...ext.lL, fd: pf(-15) }, lR: { ...ext.lR, fd: pf(-15) } };
    const b = { ...ext, lL: { ...ext.lL, t: add(ext.lL.t, [0, .05, .05]), fd: pf(30) }, lR: { ...ext.lR, t: add(ext.lR.t, [0, .05, .05]), fd: pf(30) } };
    return { ...r, frames: [a, b], labels: ['Push through toes', 'Let heels come back'], t1: .8, t2: 1.3, h1: .4 };
  }
  const h = step ? .12 : 0;
  const leg = (s, ank) => ({ el: 0, az: 2, bend: 2, ank });
  const arms = machine ? ikArms([.3, .05, .05], [1, -1, 0]) : smith ? ikArms([.42, .01, -.075], [.4, -1, -.4]) : single ? { aL: { el: 6, az: 12, bend: 6 }, aR: { t: [-.4, 1.15, .25], pole: [-1, -.3, 0], f: 'w' } } : symArms(HANG);
  const lo = step ? -18 : 0, hi = 32;
  const rise = a => .16 * (Math.sin(a * D2R) - Math.sin(lo * D2R));
  const y0 = .98 + h + (step ? .16 * Math.sin(-lo * D2R) * 0 : 0);
  const a = { root: [0, y0 - (step ? .03 : 0), 0], pel: [0, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...arms, lL: leg(1, lo), lR: single ? { el: 12, az: 2, bend: 70 } : leg(-1, lo) };
  const b = { ...a, root: [0, a.root[1] + rise(hi), 0], lL: leg(1, hi), lR: single ? { el: 12, az: 2, bend: 70 } : leg(-1, hi) };
  const props = [];
  if (step) props.push(() => S(box([0, .06, .18], AX, [.3, .06, .1], 'frame')));
  if (machine) props.push(J => [cap(add(J.shL, [0, .09, -.05]), add(J.shL, [0, .09, .12]), .045, 'pad'), cap(add(J.shR, [0, .09, -.05]), add(J.shR, [0, .09, .12]), .045, 'pad'), box([0, .04, .2], AX, [.3, .04, .1], 'frame')]);
  if (smith) props.push(J => PROP.smithBar(J), J => { const z = J.armL.grip[2]; return [...segCap([.75, 0, z], [.75, 2, z], .025, 'frame', 4), ...segCap([-.75, 0, z], [-.75, 2, z], .025, 'frame', 4)]; });
  if (single) props.push(J => PROP.dbs(J, 'pf', 'c', { only: 'L' }));
  return { frames: [a, b], props, labels: ['Rise onto the balls of your feet', 'Lower heels slowly'], t1: .9, t2: 1.4, h1: .6, hl: single ? 'L' : undefined, view: V3(70, 6) };
};
M.tibRaise = () => {
  const base = { root: [0, .96, -.24], pel: [-10, 0, 0], lum: [0, 0, 0], tho: [-4, 0, 0], neck: 4, ...symArms({ el: 5, az: 14, bend: 6 }) };
  const a = { ...base, ...ikLegs([.12, .08, .3], [.2, 0, 1], [.1, 0, 1]) };
  const b = { ...base, ...ikLegs([.12, .08, .3], [.2, 0, 1], [.1, .62, .8]) };
  return { frames: [a, b], props: [() => S(box([0, 1.1, -.485], AX, [.7, 1.1, .05], 'wall', { bias: -2 }))], labels: ['Pull toes up hard', 'Lower slowly'], t1: .8, t2: 1.2, h1: .3, view: V3(75, 6) };
};

/* ---------- core ---------- */
function supine(o = {}) { return { root: [0, .11, 0], pel: [-90, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, snap: true, ...o }; }
const floorArms = (shZ = -.36, x = .3) => ikArms([x, .042, shZ + .5], [1, .12, 0], 'w', { flat: true, hd: [0, 0, 1] });
const kneesUp = ikLegs([.12, .08, .52], [.1, 1, .4], [.1, .2, 1]);
M.crunch = ({ bicycle = false, reverse = false, full = false } = {}) => {
  const hands = ikArms([.1, .2, -.02], [1, .2, .3]);
  if (bicycle) {
    const L = { el: 108, az: 4, bend: 112 }, R = { el: 28, az: 4, bend: 4 };
    const a = supine({ tho: [32, 22, 0], lum: [8, 0, 0], neck: 16, ...hands, lL: L, lR: R });
    const b = supine({ tho: [32, -22, 0], lum: [8, 0, 0], neck: 16, ...hands, lL: R, lR: L });
    return { frames: [a, b], props: [floorMat()], labels: ['Elbow to opposite knee', 'Switch sides'], t1: .8, t2: .8, h1: .15, h2: .15, view: V3(55, 30) };
  }
  if (reverse) {
    const arms = symArms({ el: 12, az: 30, bend: 2, flat: true, hd: [0, 0, 1] });
    const a = supine({ ...arms, ...symLegs({ el: 92, az: 4, bend: 92 }) });
    const b = supine({ ...arms, pel: [-120, 0, 0], lum: [22, 0, 0], tho: [-8, 0, 0], ...symLegs({ el: 120, az: 4, bend: 100 }) });
    return { frames: [a, b], props: [floorMat()], labels: ['Curl hips toward chest', 'Lower slowly'], t1: 1, t2: 1.5, view: V3(72, 14) };
  }
  const a = supine({ ...kneesUp, ...hands, neck: 8 });
  if (full) { const b2 = { ...a, root: [0, .14, .08], pel: [-28, 0, 0], lum: [14, 0, 0], tho: [10, 0, 0], neck: 6, snap: false }; return { frames: [a, b2], props: [floorMat()], labels: ['Sit all the way up', 'Lower one vertebra at a time'], t1: 1.3, t2: 1.7, view: V3(72, 12) }; }
  const b = supine({ ...kneesUp, ...hands, lum: [12, 0, 0], tho: [30, 0, 0], neck: 18 });
  return { frames: [a, b], props: [floorMat()], labels: ['Curl ribs toward hips', 'Lower slowly'], t1: 1, t2: 1.4, h1: .5, view: V3(72, 14) };
};
M.cableCrunch = ({ machine = false } = {}) => {
  if (machine) {
    const base = seated({ ...ikArms([.12, .06, .14], [1, -.5, .3]) });
    const b = { ...base, lum: [24, 0, 0], tho: [26, 0, 0], neck: 10 };
    return { frames: [base, b], props: [() => S(seatBox(), uprightBack(-6)), J => [cap(add(J.shL, [0, .05, .14]), add(J.shR, [0, .05, .14]), .045, 'pad')]], labels: ['Crunch down', 'Return slowly'], t1: 1, t2: 1.5, view: V3(65, 8) };
  }
  // kneel well back from the stack; hips stay still and the spine curls, elbows travelling toward the knees
  const kneel = { el: 2, az: 3, bend: 96 };
  const hands = ikArms([.1, .16, .12], [1, -.5, .4]);
  const base = { root: [0, .5, 0], pel: [14, 0, 0], lum: [4, 0, 0], tho: [4, 0, 0], neck: 4, lL: kneel, lR: kneel, anchor: { j: 'knees', at: [0, .05, 0] }, ...hands };
  const b = { ...base, pel: [22, 0, 0], lum: [38, 0, 0], tho: [34, 0, 0], neck: 14 };
  const an = [0, 2.0, 1.0];
  return { frames: [base, b], props: [() => S(...PROP.stack([0, 0, 1.15], 2.2)), J => PROP.rope(J, an)], labels: ['Curl your ribs toward your hips', 'Rise slowly, hips still'], t1: 1.1, t2: 1.6, h1: .5, view: V3(80, 6) };
};
M.declineSitup = () => {
  const B = lieBench(-18);
  const legs = declineLegs(B);
  const a = { root: B.root, pel: [B.p, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 8, ...legs, ...ikArms([.1, -.12, .14], [1, -.3, .3]) };
  const b = { ...a, pel: [-38, 0, 0], lum: [14, 0, 0], tho: [10, 0, 0] };
  return { frames: [a, b], props: [() => benchProps(B, -18)], labels: ['Curl up to sitting', 'Lower slowly'], t1: 1.2, t2: 1.6, view: V3(75, 8) };
};
M.legRaise = ({ hang = false, knees = false, chair = false, lying = false } = {}) => {
  if (lying) {
    const arms = symArms({ el: 12, az: 30, bend: 2, flat: true, hd: [0, 0, 1] });
    const a = supine({ ...arms, ...symLegs({ el: 8, az: 3, bend: 3 }) });
    const b = supine({ ...arms, ...symLegs({ el: 88, az: 3, bend: 3 }) });
    return { frames: [a, b], props: [floorMat()], labels: ['Raise legs to vertical', 'Lower without touching'], t1: 1.2, t2: 1.8, view: V3(72, 14) };
  }
  if (chair) {
    const base = { root: [0, 1.25, 0], pel: [0, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...symArms({ el: 5, az: 12, bend: 90 }) };
    const a = { ...base, ...symLegs({ el: 4, az: 3, bend: 6 }) };
    const b = { ...base, pel: [-12, 0, 0], ...symLegs({ el: 108, az: 3, bend: 100 }) };
    const props = [() => S(padAlong([0, 1.12, -.13], [0, 1, 0], [0, 0, 1], .55, .15, .04), box([.27, 1.18, .12], AX, [.06, .035, .2], 'pad'), box([-.27, 1.18, .12], AX, [.06, .035, .2], 'pad'), cap([.32, 0, -.2], [.32, 1.15, -.2], .03, 'frame'), cap([-.32, 0, -.2], [-.32, 1.15, -.2], .03, 'frame'))];
    return { frames: [a, b], props, labels: ['Lift knees to chest', 'Lower slowly'], t1: 1, t2: 1.5, view: V3(60, 6) };
  }
  const r = M.pullup({ grip: 'mid', barY: 2.4 });
  const a = { ...r.frames[0], ...symLegs({ el: 4, az: 3, bend: 4 }) };
  const b = { ...a, pel: [-16, 0, 0], ...symLegs(knees ? { el: 112, az: 3, bend: 108 } : { el: 94, az: 3, bend: 4 }) };
  return { frames: [a, b], props: r.props, labels: [knees ? 'Drive knees up, curl pelvis' : 'Lift straight legs to level', 'Lower without swinging'], t1: 1.2, t2: 1.7, view: V3(60, 4) };
};
M.deadBug = () => {
  const up = { el: 90, az: 4, bend: 2 }, over = { el: 172, az: 4, bend: 2 }, table = { el: 90, az: 4, bend: 90 }, ext = { el: 18, az: 3, bend: 4 };
  const a = supine({ aL: up, aR: up, lL: table, lR: table });
  const b = supine({ aL: over, aR: up, lL: table, lR: ext });
  const c = supine({ aL: up, aR: over, lL: ext, lR: table });
  return { frames: [a, b, a, c], props: [floorMat()], labels: ['Extend left arm, right leg', 'Return', 'Extend right arm, left leg', 'Return'], durs: [1.2, 1, 1.2, 1], view: V3(60, 30) };
};
M.hollow = () => {
  const a = supine({ tho: [16, 0, 0], neck: 10, ...symArms({ el: 172, az: 6, bend: 4 }), ...symLegs({ el: 22, az: 3, bend: 2, ank: 25 }) });
  const b = { ...a, tho: [18, 0, 0] };
  return { frames: [a, b], props: [floorMat()], labels: ['Hold — low back pressed down', 'Breathe and stay tight'], t1: 2, t2: 2, view: V3(72, 14) };
};
M.russian = () => {
  const legs = symLegs({ el: 76, az: 6, bend: 78 });
  const hands = ikArms([.04, -.2, .36], [1, -.6, .4]);
  const base = { root: [0, .11, 0], pel: [-42, 0, 0], lum: [4, 0, 0], neck: 4, snap: true, ...legs, ...hands };
  const a = { ...base, tho: [8, 36, 0], lum: [4, 10, 0] }, b = { ...base, tho: [8, -36, 0], lum: [4, -10, 0] };
  return { frames: [a, b], props: [floorMat(), J => PROP.medball(J, .1)], labels: ['Rotate to the right', 'Rotate to the left'], t1: .9, t2: .9, h1: .15, h2: .15, view: V3(30, 18) };
};
M.sideBend = () => {
  const base = stand({ aL: { el: 4, az: 12, bend: 4 }, aR: { t: [-.12, .12, .02], pole: [-1, 0, -.2], f: 'c' }, ...LEGS_STAND(.15) });
  const a = { ...base, lum: [0, 0, 12], tho: [0, 0, 8] }, b = { ...base, lum: [0, 0, -12], tho: [0, 0, -10] };
  return { frames: [a, b], props: [J => PROP.dbs(J, 'pf', 'c', { only: 'L' })], labels: ['Lean toward the weight', 'Pull up with the opposite side'], hl: 'R', t1: 1.1, t2: 1.1, view: V3(0, 6) };
};
M.woodchop = ({ low = false } = {}) => {
  const legs = ikLegs([.22, .08, 0], [.4, 0, 1], [.3, 0, 1]);
  const a = { root: [0, .96, 0], pel: [0, -16, 0], lum: [0, -6, 0], tho: [0, -34, 0], neck: 0, ...legs, ...ikArms([-.42, 1.66, .26], [0, -1, -.3], 'w') };
  a.aR = { t: [-.36, 1.66, .3], pole: [0, -1, -.3], f: 'w' };
  const b = { root: [0, .88, 0], pel: [14, 14, 0], lum: [0, 6, 0], tho: [8, 28, 0], neck: 0, ...legs, ...ikArms([.42, .76, .36], [1, 0, -.3], 'w') };
  b.aR = { t: [.36, .78, .4], pole: [1, 0, -.3], f: 'w' };
  if (low) { const an2 = [.85, .15, .08]; return { frames: [b, a], props: [() => S(...PROP.stack([.98, 0, .05], 2.2)), J => [...PROP.cable(mid(J.armL.grip, J.armR.grip), an2), cap(madd(mid(J.armL.grip, J.armR.grip), [1, 0, 0], -.05), madd(mid(J.armL.grip, J.armR.grip), [1, 0, 0], .05), .02, 'iron')]], labels: ['Lift up and across your body', 'Lower under control'], t1: 1, t2: 1.5, view: V3(-20, 10) }; }
  const an = [-.85, 2.0, .08];
  return { frames: [a, b], props: [() => S(...PROP.stack([-.98, 0, .05], 2.2)), J => [...PROP.cable(mid(J.armL.grip, J.armR.grip), an), cap(madd(mid(J.armL.grip, J.armR.grip), [1, 0, 0], -.05), madd(mid(J.armL.grip, J.armR.grip), [1, 0, 0], .05), .02, 'iron')]], labels: ['Chop down across your body', 'Return under control'], t1: 1, t2: 1.5, view: V3(20, 10) };
};
M.pallof = ({ band = false } = {}) => {
  const base = stand({ ...LEGS_STAND(.18) });
  const a = { ...base, ...ikArms([.03, 1.2, .14], [1, -1, 0], 'w') };
  a.aR = { t: [-.03, 1.2, .14], pole: [-1, -1, 0], f: 'w' };
  const b = { ...base, ...ikArms([.03, 1.22, .6], [1, -.5, 0], 'w') };
  b.aR = { t: [-.03, 1.22, .6], pole: [-1, -.5, 0], f: 'w' };
  const an = [-1.0, 1.2, .2];
  const props = band ? [J => PROP.band(mid(J.armL.grip, J.armR.grip), an)] : [() => S(...PROP.stack([-1.12, 0, .2])), J => PROP.cable(mid(J.armL.grip, J.armR.grip), an)];
  return { frames: [a, b], props, labels: ['Press out — resist the twist', 'Bring back to chest'], t1: 1, t2: 1.2, h1: 1.2, view: V3(30, 18) };
};
M.rollout = () => {
  const kneel = (el, bend) => ({ el, az: 3, bend });
  const a = { root: [0, .5, 0], pel: [64, 0, 0], lum: [8, 0, 0], tho: [0, 0, 0], neck: 0, lL: kneel(64, 92), lR: kneel(64, 92), anchor: { j: 'knees', at: [0, .05, 0] } };
  const Ja = J0(a); const wz = Ja.shL[2] + .06;
  Object.assign(a, ikArms([.07, .09, wz], [.2, .2, -1], 'w'));
  const b = { ...a, pel: [84, 0, 0], lum: [0, 0, 0], lL: kneel(40, 45), lR: kneel(40, 45) };
  const Jb = J0(b); Object.assign(b, ikArms([.07, .09, Jb.shL[2] + .5], [.2, -1, 0], 'w'));
  return { frames: [a, b], props: [floorMat(), J => { const c = mid(J.armL.grip, J.armR.grip); return [disc([0, .09, c[2]], [1, 0, 0], .09, 'iron', { th: .05 }), cap([.11, .09, c[2]], [-.11, .09, c[2]], .016, 'steel')]; }], labels: ['Roll out slowly', 'Pull back with your abs'], t1: 1.6, t2: 1.3, view: V3(72, 8) };
};
M.landmineRot = () => {
  const legs = ikLegs([.22, .08, 0], [.4, 0, 1], [.3, 0, 1]);
  const pivot = [0, .04, 1.55];
  const base = { root: [0, .97, 0], pel: [6, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...legs };
  const pose = (x, y, tw) => ({ ...base, tho: [6, tw, 0], lum: [0, tw / 3, 0], ...ikArms([x + .03, y, .45], [.8, -.6, 0], 'w'), aR: { t: [x - .03, y, .45], pole: [-.8, -.6, 0], f: 'w' } });
  const L = pose(.55, .95, 30), T = pose(0, 1.4, 0), R = pose(-.55, .95, -30);
  return { frames: [L, T, R, T], props: [J => landmine(J, pivot)], labels: ['Arc over the top', 'Lower to the right hip', 'Arc back over', 'Lower to the left hip'], durs: [.9, .9, .9, .9], view: V3(25, 14) };
};
M.slam = () => {
  const legs = ikLegs([.2, .08, 0], [.4, 0, 1], [.25, 0, 1]);
  const top = { root: [0, 1.03, 0], pel: [-6, 0, 0], lum: [0, 0, 0], tho: [-6, 0, 0], neck: -4, ...legs, ...ikArms([.12, .62, .02], [1, 0, 0]) };
  const bot = { root: [0, .66, -.18], pel: [52, 0, 0], lum: [10, 0, 0], tho: [0, 0, 0], neck: -12, ...legs, ...ikArms([.12, .14, .5], [1, 0, -.3], 'w') };
  return { frames: [top, bot], props: [J => PROP.medball(J, .13)], labels: ['Slam it down hard', 'Pick up and reach overhead'], t1: .45, t2: 1.1, h1: .25, h2: .3, view: V3(60, 8) };
};
M.serratusPunch = () => {
  const B = lieBench(0);
  const base = { root: B.root, pel: [B.p, 0, 0], lum: [-3, 0, 0], tho: [0, 0, 0], neck: 0, ...B.legs, ...symArms({ el: 90, az: 6, bend: 2 }) };
  const a = { ...base, pro: -.6 }, b = { ...base, pro: 1.1 };
  return { frames: [a, b], props: [() => benchProps(B, 0), J => PROP.dbs(J, [1, 0, 0])], labels: ['Punch up — shoulder blades apart', 'Let them settle back'], t1: .9, t2: 1.2, h1: .5, view: V3(30, 15) };
};
M.kneeDrive = () => {
  const base = stand({ lR: { t: [-.12, .08, .02], pole: [-.2, 0, 1], fd: [-.1, 0, 1] }, ...ikArms([.3, 1.12, -.1], [1, -.3, 0], 'w') });
  const a = { ...base, lL: { el: 12, az: 178, bend: 12 } };
  const b = { ...base, lL: { el: 102, az: 3, bend: 92 } };
  const an = [.12, .12, -.75];
  return { frames: [a, b], props: [() => S(...PROP.stack([.12, 0, -.88])), J => PROP.cable(J.legL.ankle, an)], labels: ['Drive knee up high', 'Lower slowly'], hl: 'L', t1: .9, t2: 1.3, view: V3(80, 6) };
};
M.bandPress = ({ cable = false } = {}) => {
  const legs = { lL: { t: [.14, .08, .25], pole: [.3, 0, 1], fd: [.15, 0, 1] }, lR: { t: [-.14, .08, -.22], pole: [-.3, 0, 1], fd: [-.15, 0, 1] } };
  const base = stand({ ...legs, root: [0, .98, .02], pel: [8, 0, 0] });
  const J = J0(base), y = J.shL[1] - .12;
  const a = { ...base, ...ikArms([.25, y, J.shL[2] + .12], [1, -.6, -.7], 'w') };
  const b = { ...base, ...ikArms([.2, y + .02, J.shL[2] + .6], [1, -.4, -.3], 'w') };
  const an = [0, 1.15, -.75];
  if (cable) return { frames: [a, b], props: [() => S(...PROP.stack([.95, 0, -.55], 2.2), ...PROP.stack([-.95, 0, -.55], 2.2)), J => [...PROP.cable(J.armL.grip, [.95, J.shL[1] - .05, -.45]), ...PROP.cable(J.armR.grip, [-.95, J.shL[1] - .05, -.45])]], labels: ['Press forward and together', 'Return slowly'], t1: 1, t2: 1.6, view: V3(40, 10) };
  return { frames: [a, b], props: [J => [...PROP.band(J.armL.grip, an), ...PROP.band(J.armR.grip, an)]], labels: ['Press forward', 'Return slowly'], t1: 1, t2: 1.6, view: V3(55, 10) };
};
M.suspPress = () => {
  const ank = [0, .19, 0], beta = 52, bB = 36;
  const t0 = plank(beta, ank), Jt = J0(t0);
  const n = front(90 - beta);
  const g = madd(Jt.shL, n, .58);
  const hands = ikArms([.2, g[1], g[2]], [1, -.3, -.6], 'w');
  const a = { ...t0, ...hands };
  const Jb = J0(plank(bB, ank));
  const b = { ...plank(bB, ank), ...ikArms([.32, Jb.shL[1] - .02, Jb.shL[2] + .1], [1, .2, -.6], 'w') };
  const an = [0, 2.5, .15];
  return { frames: [a, b], props: [J => [...PROP.band(J.armL.grip, an, 'strap'), ...PROP.band(J.armR.grip, an, 'strap')]], labels: ['Lower chest between hands', 'Push back up'], t1: 1.5, t2: 1, view: V3(72, 8) };
};


/* ---------- added movements ---------- */
M.kneePushup = () => {
  const knee = [0, .085, 0];
  const pk = beta => { const b = beta * D2R, u = [0, Math.sin(b), Math.cos(b)]; return { root: madd(knee, u, .5), pel: [90 - beta, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: 0, ...symLegs({ el: 0, az: 3, bend: 105 }) }; };
  const t0 = pk(30), Jt = J0(t0), hz = Jt.shL[2] + .03;
  const hands = ikArms([.28, .04, hz], [.7, .3, -.7], 'w');
  return { frames: [{ ...t0, ...hands }, { ...pk(8), ...hands }], props: [floorMat()], labels: ['Lower chest to floor', 'Push back up'], t1: 1.5, t2: 1, view: V3(72, 12) };
};
M.plankTap = () => {
  const ank = [0, .19, 0], t0 = plank(18, ank, { el: 0, az: 7, bend: 2 }), Jt = J0(t0), hz = Jt.shL[2] + .03;
  const down = s => ({ t: [s * .26, .04, hz], pole: [s * .6, .3, -.7], f: 'w' });
  const tap = s => ({ t: add(s > 0 ? Jt.shR : Jt.shL, [s * .02, -.03, .06]), pole: [s * .3, -1, -.3], f: 'w' });
  const a = { ...t0, aL: down(1), aR: down(-1) };
  const b = { ...t0, aL: tap(1), aR: down(-1), pel: [72, 0, -3] }, c = { ...t0, aL: down(1), aR: tap(-1), pel: [72, 0, 3] };
  return { frames: [a, b, a, c], props: [floorMat()], labels: ['Tap right shoulder', 'Hand down', 'Tap left shoulder', 'Hand down'], durs: [.7, .7, .7, .7], view: V3(55, 18) };
};
M.vUp = () => {
  const a = supine({ ...symArms({ el: 172, az: 8, bend: 4 }), ...symLegs({ el: 4, az: 3, bend: 3 }) });
  const b = supine({ pel: [-68, 0, 0], lum: [18, 0, 0], tho: [16, 0, 0], neck: 10, ...symArms({ el: 44, az: 8, bend: 4 }), ...symLegs({ el: 80, az: 3, bend: 4 }) });
  return { frames: [a, b], props: [floorMat()], labels: ['Fold up — reach for your toes', 'Lower slowly to a long body'], t1: 1, t2: 1.6, view: V3(72, 12) };
};
M.flutter = () => {
  const arms = symArms({ el: 12, az: 30, bend: 2, flat: true, hd: [0, 0, 1] });
  const a = supine({ ...arms, neck: 12, lL: { el: 14, az: 3, bend: 2 }, lR: { el: 34, az: 3, bend: 2 } });
  const b = { ...a, lL: { el: 34, az: 3, bend: 2 }, lR: { el: 14, az: 3, bend: 2 } };
  return { frames: [a, b], props: [floorMat()], labels: ['Kick — small and fast', 'Switch'], t1: .35, t2: .35, h1: .05, h2: .05, view: V3(65, 14) };
};
M.yRaise = () => {
  const incl = 40, p = 90 - incl - 5;
  const base = { root: [0, .84, -.34], pel: [p, 0, 0], lum: [0, 0, 0], tho: [0, 0, 0], neck: -10, ...ikLegs([.16, .08, -.8], [.3, 0, 1], [.1, 0, 1]) };
  const a = { ...base, ...symArms({ el: 44, az: 20, bend: 6 }) };
  const b = { ...base, ...symArms({ el: 150, az: 34, bend: 4 }) };
  const u = spine(p), n = front(p);
  return { frames: [a, b], props: [() => S(padAlong(add(madd(base.root, n, .12), mul(u, -.25)), u, mul(n, -1), .95, .15, .04), cap(add(base.root, [0, -.2, .1]), [0, .03, base.root[2] + .1], .03, 'frame'), cap([0, .03, base.root[2] - .3], [0, .03, base.root[2] + .6], .03, 'frame')), J => PROP.dbs(J, 'pf', 'c', { half: .1, r: .05 })], labels: ['Raise arms into a Y', 'Lower slowly'], t1: 1.1, t2: 1.6, h1: .4, view: V3(55, 12) };
};
M.sidePlankDip = () => {
  const r = M.plank({ side: true });
  const a = r.frames[0], b = { ...a, root: add(a.root, [0, -.12, 0]), pel: [0, 0, -78] };
  return { ...r, frames: [a, b], labels: ['Lift hips high', 'Dip hips toward the floor'], t1: 1, t2: 1, h1: .3, h2: .1 };
};

/* ===================== hands =====================
   How each movement holds its implement: 'over' (overhand on one bar), 'under' (underhand), 0 neutral (thumbs up / palms facing),
   'sup' / 'pro' (palm up / down for single handles), or a thumb direction in the chest frame. Hands on the floor are laid flat. */
const GRIPS = {
  bench: o => o.squeeze ? [0, 1, 0] : 'over', floorPress: () => 'over', machinePress: () => 'over', landminePress: () => [0, 1, -.8], svend: () => 0,
  fly: () => [0, 1, 0], cableFly: () => 0, pecDeck: () => 0, pullover: () => 'over',
  ohp: o => o.imp === 'machine' ? 'over' : 'over', lateral: () => 0, frontRaise: o => o.imp === 'plate' ? 0 : 'over',
  reverseFly: () => 0, cableRevFly: () => 0, facePull: () => 0, pullApart: () => 'over', uprightRow: () => 'over', extRot: () => 0,
  pullup: o => o.grip === 'chin' ? 'under' : o.grip === 'neutral' ? 0 : 'over', deadHang: () => 'over', pulldown: o => o.grip === 'wide' ? 'over' : 0, straightArm: () => 'over',
  bentRow: o => o.tbar || o.imp === 'db' ? 0 : 'over', oneArmRow: () => 0, chestSupRow: () => 0, cableRow: () => 0, machineRow: () => 0,
  invertedRow: o => o.susp ? 0 : 'over', renegade: () => 0, shrug: o => o.imp === 'bb' || !o.imp ? 'over' : 0, farmer: () => 0,
  curl: o => o.grip === 'pro' ? 'over' : o.grip === 'neu' ? 0 : (o.imp === 'db' || o.imp === 'band') ? 'sup' : 'under',
  inclineCurl: () => 'sup', preacher: o => o.imp === 'db' ? 'sup' : 'under', concentration: () => 'sup', bayesian: () => 'sup', spider: () => 'sup',
  wristCurl: o => o.rev ? 'pro' : 'sup', pushdown: o => o.rope || o.band ? 0 : 'over', ohExt: () => 0, skull: o => o.imp === 'db' ? 0 : 'over', kickback: () => 0,
  dip: () => [0, 0, 1], squat: o => o.bw || o.jump ? null : (o.goblet || o.sumo || o.side) ? 0 : 'over', legPress: () => 0, hackSquat: () => 0,
  legExt: () => 0, legCurl: o => o.ball || o.sliders ? null : 0, lunge: o => o.imp === 'bb' ? 'over' : o.imp === 'bw' ? null : 0, stepUp: () => 0,
  deadlift: o => o.imp === 'trap' || o.single || o.imp === 'kb' ? 0 : 'over', goodMorning: () => 'over', kbSwing: o => o.cable ? 0 : 'over',
  hipThrust: o => o.imp === 'bb' || !o.imp ? 'over' : o.imp === 'db' ? 0 : null, gluteKick: o => o.quad ? null : 0, cableHip: () => 0, kneeDrive: () => 0,
  calfRaise: o => o.smith ? 'over' : (o.machine || o.single || o.seat || o.press) ? 0 : null, cableCrunch: () => 0, legRaise: o => o.lying ? null : o.chair ? 0 : 'over',
  russian: () => 0, sideBend: () => 0, woodchop: () => 0, pallof: () => 0, rollout: () => 'over', landmineRot: () => 0, slam: () => 0,
  serratusPunch: () => 'over', bandPress: o => o.cable ? 'over' : 0, yRaise: () => 0, suspPress: () => 0, declineSitup: () => null,
};
const HAND_CURL = { squat: o => o.front ? .55 : o.goblet || o.sumo ? .7 : null, ohExt: o => o.imp === 'cable' ? null : .7, pullover: () => .7, svend: () => .25, slam: () => .3, russian: () => .45, legRaise: o => o.chair ? .8 : null };
const NO_FLAT = new Set(['renegade', 'rollout']);
for (const name of Object.keys(M)) {
  const f = M[name];
  M[name] = (o = {}) => {
    const r = f(o || {}); o = o || {};
    if (r.grip == null && GRIPS[name]) { const g = GRIPS[name](o); if (g != null) r.grip = g; }
    if (r.hands == null && HAND_CURL[name]) { const h = HAND_CURL[name](o); if (h != null) r.hands = h; }
    if (!NO_FLAT.has(name)) for (const fr of r.frames) for (const k of ['aL', 'aR']) {
      const a = fr[k]; if (!a || !a.t || a.f !== 'w' || a.t[1] > .12 || a.flat) continue;
      fr[k] = { ...a, flat: true, t: [a.t[0], .042, a.t[2]] };
    }
    return r;
  };
}
