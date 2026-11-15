/* ===================== Form guides & common mistakes =====================
   Markers are drawn as an overlay on top of the 3D stage, anchored to joints. */
const FORM = (function () {
  const P = {
    root: J => J.root, waist: J => J.waist, neck: J => J.neckB, head: J => J.headC,
    shoulders: J => mid(J.shL, J.shR), shL: J => J.shL, shR: J => J.shR,
    elbowL: J => J.armL.j1, elbowR: J => J.armR.j1, wristL: J => J.armL.wrist, gripL: J => J.armL.grip, grips: J => mid(J.armL.grip, J.armR.grip),
    hipL: J => J.hipL, hips: J => mid(J.hipL, J.hipR), kneeL: J => J.legL.j1, kneeR: J => J.legR.j1, knees: J => mid(J.legL.j1, J.legR.j1),
    ankleL: J => J.legL.ankle, ankles: J => mid(J.legL.ankle, J.legR.ankle), toeL: J => J.legL.toe, heelL: J => J.legL.heel,
    midfoot: J => { const a = mid(J.legL.heel, J.legL.toe), b = mid(J.legR.heel, J.legR.toe); const m = mid(a, b); return [m[0], 0.005, m[2]]; },
    chest: J => add(add(J.neckB, mul(J.T.y, -0.14)), mul(J.T.z, 0.13)),
    belly: J => add(J.waist, mul(J.L.z, 0.11)),
    sacrum: J => add(add(J.root, mul(J.pel.z, -0.115)), mul(J.pel.y, 0.03)),
    lowback: J => add(J.waist, mul(J.L.z, -0.112)),
    midback: J => add(add(J.waist, mul(J.T.y, 0.15)), mul(J.T.z, -0.135)),
    upback: J => add(add(J.neckB, mul(J.T.y, -0.03)), mul(J.T.z, -0.1)),
    pelvisFront: J => add(J.root, mul(J.pel.z, 0.12)),
  };
  const pt = (J, k) => typeof k === 'function' ? k(J) : P[k](J);
  // ---------- per-movement guide sets ----------
  const G = {
    spine: (label = 'Flat back') => ({ t: 'spine', label }),
    line: (a, b, label, ext = .12) => ({ t: 'line', a, b, label, ext }),
    angle: (at, a, b, label) => ({ t: 'angle', at, a, b, label }),
    path: (p, label) => ({ t: 'path', p, label }),
    plumb: (p, label) => ({ t: 'plumb', p, label }),
    pin: (p, label) => ({ t: 'pin', p, label }),
    arrow: (p, dir, label, frame = 'w') => ({ t: 'arrow', p, dir, frame, label }),
    level: (p, label) => ({ t: 'level', p, label }),
  };
  const elbow = (label = 'Elbow angle') => G.angle('elbowL', 'shL', 'wristL', label);
  const knee = (label = 'Knee angle') => G.angle('kneeL', 'hipL', 'ankleL', label);
  const tuck = (label = 'Elbow tuck') => G.angle('shL', 'hipL', 'elbowL', label);
  const BY_PAT = {
    hpress: [G.path('grips', 'Bar path'), tuck()], ipress: [G.path('grips', 'Press over upper chest'), tuck()], dpress: [G.path('grips', 'Bar to lower chest'), tuck()],
    'hpress-bw': [G.line('ankles', 'head', 'Straight line'), tuck()], 'ipress-bw': [G.line('ankles', 'head', 'Straight line'), tuck()], 'dpress-bw': [G.line('ankles', 'head', 'Straight line'), tuck()],
    'hpress-cg': [G.path('grips', 'Bar path'), tuck('Elbows tucked')],
    fly: [elbow('Soft, fixed elbows'), G.path('grips', 'Wide arc')], 'fly-i': [elbow('Soft, fixed elbows'), G.path('grips', 'Wide arc')], 'fly-m': [elbow('Soft elbows')],
    'cfly-h': [elbow('Fixed elbow bend'), G.path('grips', 'High to low')], 'cfly-l': [elbow('Fixed elbow bend'), G.path('grips', 'Low to high')], 'cfly-m': [elbow('Fixed elbow bend'), G.path('grips', 'Arc together')],
    dip: [elbow('Stop at ~90°'), G.line('hips', 'neck', 'Slight forward lean', 0)], 'dip-b': [elbow('Stop at ~90°'), G.pin('hips', 'Hips close to bench')],
    pullover: [elbow('Elbows stay fixed'), G.pin('belly', 'Ribs down')], lpress: [G.path('grips', 'Up and forward')], svend: [G.pin('grips', 'Squeeze hard')],
    vpress: [G.path('grips', 'Straight up'), G.spine('Ribs down — no arch')], 'vpress-a': [G.path('grips', 'Rotate as you press')], 'vpress-bw': [G.pin('hips', 'Hips stay high'), elbow()],
    lat: [G.level('shoulders', 'Stop at shoulder height'), G.pin('elbowL', 'Lead with elbows')], front: [G.level('shoulders', 'Stop at shoulder height')],
    rfly: [G.spine(), elbow('Soft elbows')], facepull: [G.pin('elbowL', 'Elbows high'), G.path('grips', 'Pull to face')], urow: [G.pin('elbowL', 'Elbows lead'), G.level('shoulders', 'Elbows to shoulder height')],
    extrot: [G.pin('elbowL', 'Elbow pinned to side'), elbow('Keep 90°')],
    vpull: [G.arrow('elbowL', [0, -1, 0], 'Drive elbows down'), G.pin('chest', 'Chest to bar')], 'vpull-c': [G.arrow('elbowL', [0, -1, 0], 'Drive elbows down'), G.pin('chest', 'Chest up')],
    sapd: [elbow('Arms stay straight'), G.spine()],
    hrow: [G.spine(), G.path('grips', 'Row to belly')], 'hrow-u': [G.spine(), G.arrow('elbowL', [0, .6, -1], 'Elbow to hip')], 'hrow-bw': [G.line('ankles', 'neck', 'Body straight')],
    'hinge-dl': [G.spine(), G.plumb('grips', 'Bar over mid-foot')], hinge: [G.spine(), G.arrow('sacrum', [0, 0, -1], 'Hips back')], 'hinge-u': [G.spine(), G.pin('hips', 'Hips square')],
    backext: [G.spine('Neutral spine')], 'backext-bw': [G.pin('head', 'Neck neutral')], shrug: [G.arrow('shoulders', [0, 1, 0], 'Straight up')],
    renegade: [G.line('ankles', 'neck', 'Hips square')],
    curl: [G.pin('elbowL', 'Elbows still'), elbow('Full range')], hammer: [G.pin('elbowL', 'Elbows still'), elbow('Full range')], rcurl: [G.pin('elbowL', 'Elbows still'), elbow()],
    'curl-short': [G.pin('elbowL', 'Upper arm fixed'), elbow('Full range')], 'curl-long': [G.pin('elbowL', 'Arm stays back'), elbow('Full stretch')],
    pushdown: [G.pin('elbowL', 'Elbows pinned'), elbow('Lock out')], ohext: [G.pin('elbowL', 'Elbows in'), elbow('Deep stretch')], skull: [G.pin('elbowL', 'Upper arms fixed'), elbow()],
    kickback: [G.spine(), G.pin('elbowL', 'Upper arm fixed')], wrist: [G.pin('wristL', 'Only wrists move')], carry: [G.line('ankles', 'head', 'Stand tall', 0)], hang: [G.pin('shoulders', 'Active shoulders')],
    crunch: [G.pin('chest', 'Ribs to hips'), G.pin('head', 'Neck relaxed')], 'crunch-w': [G.pin('chest', 'Round the spine')], situp: [G.pin('chest', 'Curl up, don’t yank')],
    legraise: [G.pin('pelvisFront', 'Curl the pelvis'), G.path('ankles', 'No swinging')], 'legraise-bw': [G.pin('sacrum', 'Low back down')], rcrunch: [G.pin('sacrum', 'Lift the hips')],
    antiext: [G.pin('lowback', 'Low back pressed down')], 'antiext-w': [G.line('knees', 'neck', 'No sagging')], plank: [G.line('ankles', 'head', 'Straight line')], sideplank: [G.line('ankles', 'head', 'Hips high')],
    rotation: [G.arrow('shoulders', [1, 0, 0], 'Turn the shoulders')], 'rotation-c': [G.pin('elbowL', 'Elbow to opposite knee')], antirot: [G.path('grips', 'Press straight out'), G.pin('hips', 'Don’t rotate')],
    'antirot-bw': [G.line('hips', 'neck', 'Back stays level', 0)], climber: [G.line('ankles', 'head', 'Hips level')], sidebend: [G.pin('waist', 'Side to side only')], slam: [G.path('grips', 'Overhead to floor')],
    serratus: [G.arrow('shoulders', [0, 1, 0], 'Spread shoulder blades')],
    thrust: [G.line('knees', 'shoulders', 'Level at the top', 0), knee('Shins vertical')], 'thrust-u': [G.line('knees', 'shoulders', 'Hips level', 0)],
    'kickback-g': [G.spine('No arching')], 'abd-bw': [G.pin('hips', 'Hips stay stacked')], abd: [G.pin('knees', 'Push knees out')], add: [G.pin('knees', 'Squeeze knees in')], 'abd-walk': [G.pin('knees', 'Keep band tension')],
    swing: [G.spine(), G.path('grips', 'Hinge, don’t squat')],
    lunge: [G.plumb('kneeL', 'Front knee over foot'), G.line('hips', 'neck', 'Tall chest', 0)], 'lunge-s': [G.plumb('kneeL', 'Front knee over foot'), knee('~90° at bottom')], stepup: [G.pin('kneeL', 'Drive through top foot')],
    squat: [G.spine('Neutral back'), G.level('hips', 'Hips to knee height'), G.arrow('knees', [1, 0, 0.6], 'Knees track toes')], 'squat-bw': [G.spine('Chest up'), G.level('hips', 'Hips to knee height')],
    'squat-s': [G.arrow('knees', [1, 0, 0.4], 'Knees out'), G.spine('Chest up')], 'squat-m': [knee('~90° at bottom'), G.pin('sacrum', 'Back flat on pad')], jump: [knee('Land soft')],
    legext: [G.pin('kneeL', 'Knee lined up with pivot'), knee()], 'iso-q': [knee('Hold 90°')], 'lat-squat': [G.pin('heelL', 'Heel stays down')],
    legcurl: [G.pin('hips', 'Hips stay down'), knee('Full curl')], 'legcurl-bw': [G.line('knees', 'shoulders', 'Hips high', 0)], nordic: [G.line('knees', 'head', 'Straight line')],
    hipflex: [G.line('ankles', 'head', 'Stay tall', 0)], calf: [G.arrow('ankleL', [0, 1, 0], 'Rise all the way')], 'calf-s': [G.arrow('kneeL', [0, 1, 0], 'Full height')], tib: [G.arrow('toeL', [0, 1, 0], 'Toes up')],
  };
  // ---------- mistakes (pose modifiers) ----------
  const clone = o => JSON.parse(JSON.stringify(o));
  const v3 = (a, i, d) => { const r = (a || [0, 0, 0]).slice(); r[i] += d; return r; };
  const roundBack = p => ({ ...p, lum: v3(p.lum, 0, 15), tho: v3(p.tho, 0, 14), neck: (p.neck || 0) + 10 });
  const cave = p => { p = clone(p); if (p.lL && p.lL.t) { p.lL.pole = [-.55, 0, 1]; p.lR.pole = [.55, 0, 1]; } else if (p.lL) { p.lL.rot = -25; p.lR.rot = -25; } return p; };
  const caveFront = p => { p = clone(p); if (p.lL && p.lL.t && p.lL.pole[2] > .5) p.lL.pole = [-.7, 0, 1]; return p; };
  const flare = p => { p = clone(p); if (p.aL && p.aL.t) { const w = p.aL.f === 'w'; p.aL.pole = w ? [1, -.1, 0] : [1, .15, -.1]; p.aR.pole = w ? [-1, -.1, 0] : [-1, .15, -.1]; } return p; };
  const sag = p => ({ ...clone(p), root: v3(p.root, 1, -.07), lum: v3(p.lum, 0, -16) });
  const arch = p => ({ ...p, lum: v3(p.lum, 0, -18), tho: v3(p.tho, 0, -8) });
  const angArms = (p, f) => { p = clone(p); for (const k of ['aL', 'aR']) if (p[k] && !p[k].t) f(p[k]); return p; };
  const MISTAKES = {
    back: { label: 'Rounded back', mod: roundBack, view: 88 },
    cave: { label: 'Knees caving in', mod: cave, view: 15 },
    caveFront: { label: 'Front knee caving in', mod: caveFront, view: 20 },
    flare: { label: 'Elbows flared to 90°', mod: flare, view: 20 },
    sag: { label: 'Hips sagging', mod: sag, view: 88 },
    arch: { label: 'Arching the lower back', mod: arch, view: 88 },
    swing: { label: 'Swinging the weight up', mod: (p, i) => i === 1 ? angArms({ ...p, pel: v3(p.pel, 0, -14) }, a => { a.el = (a.el || 0) + 32; }) : p, view: 80 },
    shrug: { label: 'Shrugging the weight up', mod: (p, i) => i === 1 ? angArms({ ...p, shrug: 1 }, a => { a.el = (a.el || 0) + 10; }) : p, view: 15 },
    drift: { label: 'Elbows drifting forward', mod: (p, i) => i === 0 ? angArms(p, a => { a.el = (a.el || 0) + 42; }) : p, view: 85 },
    neck: { label: 'Yanking on the neck', mod: p => ({ ...p, neck: (p.neck || 0) + 38 }), view: 80 },
    overarch: { label: 'Over-arching at the top', mod: (p, i) => i === 1 ? { ...p, lum: v3(p.lum, 0, -18) } : p, view: 85 },
    half: { label: 'Half reps — not hanging fully', mod: (p, i) => i === 0 ? { ...p, root: v3(p.root, 1, .22) } : p, view: 60 },
    deep: { label: 'Dropping too deep', mod: (p, i) => i === 1 ? { ...p, root: v3(p.root, 1, -.13) } : p, view: 70 },
  };
  const MISTAKE_BY_PAT = {
    'hinge-dl': 'back', hinge: 'back', 'hinge-u': 'back', hrow: 'back', 'hrow-u': 'back', rfly: 'back', kickback: 'back', swing: 'back', backext: 'back',
    squat: 'cave', 'squat-bw': 'cave', 'squat-s': 'cave', 'squat-m': 'cave', jump: 'cave', lunge: 'caveFront', 'lunge-s': 'caveFront', stepup: 'caveFront',
    hpress: 'flare', ipress: 'flare', dpress: 'flare', 'hpress-bw': 'sag', 'ipress-bw': 'sag', 'dpress-bw': 'sag', plank: 'sag', climber: 'sag', renegade: 'sag',
    vpress: 'arch', curl: 'swing', hammer: 'swing', rcurl: 'swing', lat: 'shrug', front: 'shrug', pushdown: 'drift', crunch: 'neck', 'rotation-c': 'neck',
    thrust: 'overarch', 'thrust-u': 'overarch', vpull: 'half', 'vpull-c': 'half', dip: 'deep', 'dip-b': 'deep',
  };
  function mistakeFor(ex) { const k = MISTAKE_BY_PAT[ex.pat]; return k ? { key: k, ...MISTAKES[k] } : null; }
  function applyMistake(def, m) { return { ...def, frames: def.frames.map((f, i) => m.mod(clone(f), i)) }; }
  function guidesFor(ex) { if (ex.guides) return ex.guides; return BY_PAT[ex.pat] || BY_PAT[ex.pat.split('-')[0]] || []; }

  // ---------- drawing ----------
  const COL = { good: '#34d399', bad: '#ff453a', path: 'rgba(255,255,255,.75)' };
  function sampleRange(anim, key) {
    const out = [], N = 40;
    for (let i = 0; i <= N; i++) { const { pose } = anim.poseAt(i / N * anim.total); out.push(pt(solvePose(pose), key)); }
    return out;
  }
  function angleDeg(a, o, b) { const u = norm(sub(a, o)), v = norm(sub(b, o)); return Math.round(Math.acos(Math.max(-1, Math.min(1, dot(u, v)))) * 180 / Math.PI); }
  function pill(ctx, x, y, text, color, dpr, side) {
    ctx.font = `600 ${12 * dpr}px -apple-system, "SF Pro Text", "Geist", system-ui, sans-serif`;
    const w = ctx.measureText(text).width + 26 * dpr, h = 24 * dpr;
    let px = side > 0 ? x + 10 * dpr : x - w - 10 * dpr; px = Math.max(6 * dpr, Math.min(ctx.canvas.width - w - 6 * dpr, px));
    const py = y - h / 2;
    ctx.fillStyle = 'rgba(12,13,16,.78)'; ctx.strokeStyle = 'rgba(255,255,255,.14)'; ctx.lineWidth = 1 * dpr;
    ctx.beginPath(); ctx.roundRect ? ctx.roundRect(px, py, w, h, h / 2) : ctx.rect(px, py, w, h); ctx.fill(); ctx.stroke();
    ctx.fillStyle = color; ctx.beginPath(); ctx.arc(px + 11 * dpr, y, 3.5 * dpr, 0, 7); ctx.fill();
    ctx.fillStyle = '#f5f5f7'; ctx.textBaseline = 'middle'; ctx.fillText(text, px + 19 * dpr, y + .5 * dpr);
    return [px, py, w, h];
  }
  function dashLine(ctx, pts, color, w, dash) { ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = w; ctx.setLineDash(dash || []); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke(); ctx.restore(); }
  function glowLine(ctx, pts, color, dpr) { ctx.save(); ctx.shadowColor = color; ctx.shadowBlur = 10 * dpr; dashLine(ctx, pts, color, 3 * dpr); ctx.restore(); }
  function dot2(ctx, p, color, r) { ctx.fillStyle = color; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 7); ctx.fill(); }
  // draw all guides; proj: world -> [x,y] in canvas pixels
  function draw(ctx, J, guides, proj, state) {
    const dpr = state.dpr, labels = [];
    const P2 = p => proj(p);
    for (const g of guides) {
      const isMistake = state.mistake && ((g.t === 'spine' && state.mistake.key === 'back') || (g.t === 'line' && (state.mistake.key === 'sag' || state.mistake.key === 'arch')) || (g.t === 'angle' && (state.mistake.key === 'flare')) || (g.t === 'arrow' && state.mistake.key === 'cave'));
      const col = isMistake ? COL.bad : COL.good;
      const label = isMistake ? state.mistake.label : g.label;
      if (g.t === 'spine') {
        const pts = ['sacrum', 'lowback', 'midback', 'upback'].map(k => P2(pt(J, k)));
        glowLine(ctx, pts, col, dpr); pts.forEach(p => dot2(ctx, p, col, 3 * dpr));
        labels.push([pts[2], label, col]);
      } else if (g.t === 'line') {
        let a = pt(J, g.a), b = pt(J, g.b); const d = sub(b, a);
        if (g.ext) { a = madd(a, d, -g.ext); b = madd(b, d, g.ext); }
        const pa = P2(a), pb = P2(b); dashLine(ctx, [pa, pb], col, 2.5 * dpr, [7 * dpr, 6 * dpr]);
        labels.push([[(pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2], label, col]);
      } else if (g.t === 'angle') {
        const o = pt(J, g.at), a = pt(J, g.a), b = pt(J, g.b), deg = angleDeg(a, o, b);
        const po = P2(o), pa = P2(a), pb = P2(b);
        const a1 = Math.atan2(pa[1] - po[1], pa[0] - po[0]), a2 = Math.atan2(pb[1] - po[1], pb[0] - po[0]);
        let da = a2 - a1; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        const R = 22 * dpr;
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.5 * dpr; ctx.beginPath(); ctx.arc(po[0], po[1], R, a1, a1 + da, da < 0); ctx.stroke();
        ctx.fillStyle = isMistake ? 'rgba(255,69,58,.2)' : 'rgba(52,211,153,.2)'; ctx.beginPath(); ctx.moveTo(po[0], po[1]); ctx.arc(po[0], po[1], R, a1, a1 + da, da < 0); ctx.closePath(); ctx.fill(); ctx.restore();
        dot2(ctx, po, col, 3.5 * dpr);
        labels.push([po, `${label} · ${deg}°`, col]);
      } else if (g.t === 'path') {
        const key = g.p + '|' + state.animKey;
        if (!state.cache[key]) state.cache[key] = sampleRange(state.anim, g.p);
        const pts = state.cache[key].map(P2);
        dashLine(ctx, pts, 'rgba(255,255,255,.55)', 2 * dpr, [2 * dpr, 6 * dpr]);
        const cur = P2(pt(J, g.p)); ctx.save(); ctx.shadowColor = '#fff'; ctx.shadowBlur = 8 * dpr; dot2(ctx, cur, '#fff', 4 * dpr); ctx.restore();
        const top = pts.reduce((m, p) => p[1] < m[1] ? p : m, pts[0]);
        labels.push([top, label, '#f5f5f7']);
      } else if (g.t === 'plumb') {
        const p = pt(J, g.p), floor = [p[0], 0.005, p[2]];
        const pp = P2(p), pf = P2(floor), mf = P2(pt(J, 'midfoot'));
        dashLine(ctx, [pp, pf], col, 2 * dpr, [5 * dpr, 5 * dpr]); dot2(ctx, pp, col, 3.5 * dpr);
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2 * dpr; ctx.beginPath(); ctx.ellipse(mf[0], mf[1], 12 * dpr, 4 * dpr, 0, 0, 7); ctx.stroke(); ctx.restore();
        labels.push([[(pp[0] + pf[0]) / 2, (pp[1] + pf[1]) / 2], label, col]);
      } else if (g.t === 'pin') {
        const p = P2(pt(J, g.p));
        ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2 * dpr; ctx.beginPath(); ctx.arc(p[0], p[1], 9 * dpr, 0, 7); ctx.stroke(); ctx.restore(); dot2(ctx, p, col, 3 * dpr);
        labels.push([p, label, col]);
      } else if (g.t === 'arrow') {
        if (g.p === 'knees') { /* handled below */ }
        const p = pt(J, g.p), d = norm(g.dir);
        const tip = madd(p, d, .16), a = P2(p), b = P2(tip);
        const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        if (g.p !== 'knees') {
        ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 3 * dpr; ctx.lineCap = 'round'; ctx.shadowColor = col; ctx.shadowBlur = 8 * dpr;
        ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(b[0] + Math.cos(ang) * 4 * dpr, b[1] + Math.sin(ang) * 4 * dpr); ctx.lineTo(b[0] + Math.cos(ang + 2.5) * 10 * dpr, b[1] + Math.sin(ang + 2.5) * 10 * dpr); ctx.lineTo(b[0] + Math.cos(ang - 2.5) * 10 * dpr, b[1] + Math.sin(ang - 2.5) * 10 * dpr); ctx.closePath(); ctx.fill(); ctx.restore(); }
        if (g.p === 'knees') { // both knees
          for (const [kp, sx] of [[J.legL.j1, 1], [J.legR.j1, -1]]) { const dr = norm([sx * Math.abs(g.dir[0]), g.dir[1], g.dir[2]]); const a2 = P2(kp), b2 = P2(madd(kp, dr, .14)); ctx.save(); ctx.shadowColor = col; ctx.shadowBlur = 8 * dpr; dashLine(ctx, [a2, b2], col, 3 * dpr); const an = Math.atan2(b2[1] - a2[1], b2[0] - a2[0]); ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(b2[0] + Math.cos(an) * 4 * dpr, b2[1] + Math.sin(an) * 4 * dpr); ctx.lineTo(b2[0] + Math.cos(an + 2.5) * 9 * dpr, b2[1] + Math.sin(an + 2.5) * 9 * dpr); ctx.lineTo(b2[0] + Math.cos(an - 2.5) * 9 * dpr, b2[1] + Math.sin(an - 2.5) * 9 * dpr); ctx.closePath(); ctx.fill(); ctx.restore(); }
          labels.push([P2(madd(J.legL.j1, norm([Math.abs(g.dir[0]), g.dir[1], g.dir[2]]), .14)), label, col]); continue;
        }
        labels.push([b, label, col]);
      } else if (g.t === 'level') {
        const p = pt(J, g.p), right = J.T.x;
        const a = P2(madd(p, right, -.45)), b = P2(madd(p, right, .45));
        dashLine(ctx, [a, b], col, 2 * dpr, [8 * dpr, 6 * dpr]);
        labels.push([b, label, col]);
      }
    }
    // place labels, avoiding overlaps
    const W = ctx.canvas.width, placed = [];
    labels.sort((a, b) => a[0][1] - b[0][1]);
    for (const [p, text, col] of labels) {
      let y = p[1]; for (const r of placed) if (Math.abs(r - y) < 28 * dpr) y = r + 28 * dpr;
      y = Math.max(16 * dpr, Math.min(ctx.canvas.height - 64 * dpr, y));
      placed.push(y);
      const side = p[0] < W * .55 ? 1 : -1;
      if (Math.abs(y - p[1]) > 2 * dpr) dashLine(ctx, [p, [p[0] + side * 8 * dpr, y]], 'rgba(255,255,255,.35)', 1 * dpr);
      pill(ctx, p[0], y, text, col, dpr, side);
    }
  }
  return { guidesFor, mistakeFor, applyMistake, draw };
})();
