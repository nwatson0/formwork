/* ===================== App (v2) ===================== */
(function () {
  const $ = s => document.querySelector(s);
  const el = (tag, attrs = {}, html) => { const e = document.createElement(tag); for (const k in attrs) { if (k === 'class') e.className = attrs[k]; else if (k.startsWith('on')) e.addEventListener(k.slice(2), attrs[k]); else e.setAttribute(k, attrs[k]); } if (html != null) e.innerHTML = html; return e; };
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const EXI = Object.fromEntries(EX.map(e => [e.id, e]));
  const SUB_ORDER = {}; let so = 0; GROUPS.forEach(g => g.subs.forEach(s => SUB_ORDER[s[0]] = so++));
  const HAS3D = typeof FW3 !== 'undefined' && !!FW3;
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- state ---------- */
  const KEY = 'formwork:v2';
  const DEFAULT = { eq: ALL_EQ.slice(), sel: ['upper-chest', 'mid-chest', 'lower-chest', 'triceps-long', 'triceps-lateral'], goal: 'muscle', time: 45, level: 'int', style: 'straight', units: 'kg', cur: null, hist: [], log: {}, prs: {}, routines: [], workout: null, example: true, libMine: true, libGroup: 'all', favs: [], done: {} };
  let st;
  try { const old = JSON.parse(localStorage.getItem(KEY) || localStorage.getItem('formwork:v1') || 'null'); st = { ...DEFAULT, ...(old || {}) }; } catch (e) { st = { ...DEFAULT }; }
  if (!st.done) st.done = {}; if (!st.favs) st.favs = []; if (!st.style) st.style = 'straight'; for (const [k, v] of [['hist', []], ['log', {}], ['prs', {}], ['routines', []]]) if (!st[k] || typeof st[k] !== 'object') st[k] = v; if (!st.units) st.units = 'kg';
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
  const eqSet = () => new Set(st.eq);

  /* ---------- generator ---------- */
  const MAXLVL = { beg: 1, int: 2, adv: 3 };
  const STAPLES = new Set(['bb-bench', 'db-bench', 'db-incline', 'bb-incline', 'pushup', 'ohp', 'db-shoulder-press', 'db-lateral', 'face-pull', 'pullup', 'chinup', 'lat-pulldown', 'bb-row', 'one-arm-row', 'cable-row', 'deadlift', 'rdl', 'db-rdl', 'back-squat', 'goblet-squat', 'leg-press', 'walking-lunge', 'bulgarian', 'hip-thrust', 'glute-bridge', 'lying-leg-curl', 'seated-leg-curl', 'leg-ext', 'bb-curl', 'db-curl', 'hammer-curl', 'pushdown', 'oh-db-ext', 'skull-crusher', 'standing-calf', 'plank', 'crunch', 'hanging-knee-raise', 'cable-crunch', 'dead-bug', 'side-plank', 'hip-abduction', 'tri-dip', 'chest-dip', 'inverted-row', 'db-bent-row']);
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function scoreFor(e, T, covered, pats, jit) {
    let s = 0, fresh = 0;
    for (const p of e.pri) if (T.has(p)) { if (covered.get(p)) s += 1.1; else { s += fresh ? 2 : 4; fresh++; } }
    for (const p of e.sec) if (T.has(p)) s += covered.get(p) ? .15 : .5;
    if (s <= 0) return -Infinity;
    if (pats.has(e.pat)) s -= 4.2; else if (pats.has('~' + e.pat.split('-')[0])) s -= 2.6;
    if (STAPLES.has(e.id)) s += st.goal === 'endurance' ? .6 : 1.5;
    s += e.comp ? (st.goal === 'endurance' ? .3 : st.goal === 'strength' ? 1.2 : .8) : 0;
    const ml = MAXLVL[st.level]; if (e.lvl > ml) s -= 2.2 * (e.lvl - ml);
    if (st.level === 'beg' && e.uni) s -= .3;
    if (e.pat === 'jump' && st.goal !== 'endurance') s -= 2.5;
    if (!e.eq.length && st.goal !== 'endurance' && st.eq.length > 2) s -= st.goal === 'strength' ? 1.2 : .5;
    if (REC) { for (const p of e.pri) for (const m of expandSub(p)) if (REC[m] < 60) s -= (T.has(p) ? .5 : 1.1) * (60 - REC[m]) / 60; for (const p of e.sec) for (const m of expandSub(p)) if (REC[m] < 45 && !T.has(p)) s -= .35; }
    return s + (jit ? jit(e) : 0);
  }
  let REC = null;
  function buildWorkout(seed) {
    REC = st.hist && st.hist.length ? recoveryMap() : null;
    const T = new Set(st.sel), set = eqSet(), avail = EX.filter(e => exAvailable(e, set));
    const r = rng(seed), Jt = new Map(avail.map(e => [e.id, r() * 1.6])), jit = e => Jt.get(e.id) || 0;
    const chosen = [], covered = new Map(), pats = new Set();
    while (chosen.length < 12) {
      let best = null, bs = -Infinity;
      for (const e of avail) { if (chosen.includes(e)) continue; const s = scoreFor(e, T, covered, pats, jit); if (s > bs) { bs = s; best = e; } }
      if (!best || bs < .6) break;
      if (chosen.length >= 3 && estMinutes(chosen.concat(best).map(x => x.id)) > st.time + 4) break;
      chosen.push(best); pats.add(best.pat); pats.add('~' + best.pat.split('-')[0]); best.pri.forEach(p => covered.set(p, (covered.get(p) || 0) + 1));
    }
    chosen.sort((a, b) => orderKey(a) - orderKey(b));
    return (st.style === 'superset' ? pairUp(chosen) : chosen).map(e => e.id);
  }
  const isCore = e => e.pri.every(p => SUB[p].group === 'core');
  const orderKey = e => (isCore(e) ? 1000 : 0) + (e.comp ? 0 : 100) + Math.min(...e.pri.map(p => SUB_ORDER[p]));
  const uncovered = ids => st.sel.filter(t => !ids.some(id => EXI[id].pri.includes(t) || EXI[id].sec.includes(t)));
  const missingTargets = () => { const set = eqSet(); return st.sel.filter(t => !EX.some(e => e.pri.includes(t) && exAvailable(e, set))); };
  function prescribe(e) {
    const bw = e.eq.length === 0, g = st.goal; let r;
    if (e.unit === 'sec') r = { sets: 3, reps: g === 'endurance' ? '45–60' : g === 'strength' ? '20–30' : '30–45', unit: 'sec', rest: 60 };
    else if (e.unit === 'steps') r = { sets: 3, reps: g === 'strength' ? '20' : '30–40', unit: 'm', rest: 90 };
    else if (g === 'strength') r = e.comp ? { sets: 3, reps: bw ? '6–10' : '4–6', rest: 150 } : { sets: 3, reps: '8–10', rest: 90 };
    else if (g === 'muscle') r = e.comp ? { sets: 3, reps: bw ? '10–15' : '8–10', rest: 120 } : { sets: 3, reps: '10–15', rest: 75 };
    else r = e.comp ? { sets: 3, reps: '15–20', rest: 60 } : { sets: 3, reps: '15–20', rest: 45 };
    r.unit = r.unit || 'reps'; if (e.uni) r.side = true; return r;
  }
  const restTxt = s => s === 150 ? '2–3 min' : s >= 120 ? `${s / 60} min` : `${s} s`;
  // workout format: straight sets, supersets (pairs back to back), or one circuit
  function groupsOf(ids) {
    if (st.style === 'superset') { const g = []; for (let i = 0; i < ids.length; i += 2) g.push(ids.slice(i, i + 2).map((_, k) => i + k)); return g; }
    if (st.style === 'circuit' && ids.length > 1) return [ids.map((_, i) => i)];
    return ids.map((_, i) => [i]);
  }
  function restAt(ids, i) {
    const r = prescribe(EXI[ids[i]]);
    if (st.style === 'straight') return r.rest;
    const g = groupsOf(ids).find(g => g.includes(i)); if (!g || g.length < 2) return r.rest;
    const last = g[g.length - 1] === i;
    return last ? (st.style === 'circuit' ? 90 : Math.max(60, r.rest)) : 15;
  }
  function estMinutes(ids) { let sec = 180; ids.forEach((id, i) => { const r = prescribe(EXI[id]); sec += r.sets * ((r.side ? 2 : 1) * 40 + restAt(ids, i)) + 45; }); return Math.round(sec / 60); }
  // supersets work best with opposing muscle groups: pair each move with the next one that trains something different
  function pairUp(list) {
    const out = [], left = list.slice();
    while (left.length) { const a = left.shift(); const ga = new Set(a.pri.map(p => SUB[p].group)); let j = left.findIndex(b => !b.pri.some(p => ga.has(SUB[p].group))); if (j < 0) j = 0; out.push(a); if (left.length) out.push(left.splice(j, 1)[0]); }
    return out;
  }
  const STYLE_HINT = { straight: '', superset: 'Two moves back to back, then rest. Saves time.', circuit: 'Every move once with short breaks, then repeat for 3 rounds.' };
  const SEGS = { goal: [['strength', 'Strength'], ['muscle', 'Muscle'], ['endurance', 'Endurance']], time: [[20, '20m'], [30, '30m'], [45, '45m'], [60, '60m']], level: [['beg', 'Beginner'], ['int', 'Intermediate'], ['adv', 'Advanced']], style: [['straight', 'Straight sets'], ['superset', 'Supersets'], ['circuit', 'Circuit']] };

  /* ---------- muscle → highlight levels ---------- */
  const expandSub = s => s === 'deep-core' ? ['upper-abs', 'lower-abs', 'obliques'] : [s];
  function levelsFor(e) { const lv = {}; for (const s of e.sec) for (const m of expandSub(s)) lv[m] = Math.max(lv[m] || 0, 1); for (const s of e.pri) for (const m of expandSub(s)) lv[m] = 2; return lv; }

  /* ---------- defs / anims cache ---------- */
  const defCache = new Map(), animCache = new Map();
  const getDef = e => { if (!defCache.has(e.id)) defCache.set(e.id, e.anim()); return defCache.get(e.id); };
  const getAnim = (e, mis) => { const k = e.id + (mis ? '|m' : ''); if (!animCache.has(k)) { const d = getDef(e); animCache.set(k, new Anim(mis ? FORM.applyMistake(d, mis) : d)); } return animCache.get(k); };

  /* ---------- 2D fallback helpers ---------- */
  let pal2 = null; const palette2 = () => pal2 || (pal2 = readPalette(document.documentElement));
  const TAGMAP = { 'upper-chest': ['chest'], 'mid-chest': ['chest'], 'lower-chest': ['chest'], 'front-delts': ['delts'], 'side-delts': ['delts'], 'rear-delts': ['delts'], 'rotator-cuff': ['delts'], lats: ['chest'], 'upper-back': ['chest', 'traps'], traps: ['traps', 'neck'], 'lower-back': ['abs'], 'biceps-long': ['uarm'], 'biceps-short': ['uarm'], brachialis: ['uarm', 'farm'], 'triceps-long': ['uarm'], 'triceps-lateral': ['uarm'], 'forearm-flexors': ['farm', 'hand'], 'forearm-extensors': ['farm'], 'upper-abs': ['abs'], 'lower-abs': ['abs'], obliques: ['abs'], 'deep-core': ['abs'], serratus: ['chest'], 'glute-max': ['pelvis'], 'glute-med': ['pelvis'], quads: ['thigh'], hamstrings: ['thigh'], adductors: ['thigh'], 'hip-flexors': ['thigh', 'pelvis'], gastrocnemius: ['shin'], soleus: ['shin'], tibialis: ['shin'] };
  function hl2(e) { const lv = {}; for (const s of e.sec) for (const t of TAGMAP[s] || []) lv[t] = Math.max(lv[t] || 0, 1); for (const s of e.pri) for (const t of TAGMAP[s] || []) lv[t] = 2; return (tag) => lv[tag] || 0; }

  /* ---------- thumbnails ---------- */
  const thumbCache = new Map(); let thumbStage = null; const thumbCv = document.createElement('canvas');
  function thumbFor(e) {
    if (thumbCache.has(e.id)) return thumbCache.get(e.id);
    const def = getDef(e), A = getAnim(e), pose = def.frames[1] || def.frames[0], J = solvePose(pose);
    let url;
    if (HAS3D) {
      if (!thumbStage) { thumbStage = new FW3.Stage(thumbCv, { shadowSize: 512, maxDpr: 1 }); thumbStage.resize(320, 320); }
      thumbStage.pose(J); thumbStage.props(A.propPrims(J, pose)); thumbStage.setHighlight(levelsFor(e)); thumbStage.aim(A.bounds(), def.view.yaw, def.view.pitch, 1.08); thumbStage.render(0.6);
      url = thumbCv.toDataURL('image/jpeg', 0.86);
    } else {
      thumbCv.width = thumbCv.height = 240; const ctx = thumbCv.getContext('2d'); const cam = new Camera(def.view.yaw, def.view.pitch);
      ctx.fillStyle = '#121316'; ctx.fillRect(0, 0, 240, 240);
      drawScene(ctx, 240, 240, bodyPrims(J).concat(A.propPrims(J, pose)), cam, fitFor(A.bounds(), 240, 240, cam), palette2(), hl2(e), { shadow: J.root });
      url = thumbCv.toDataURL('image/png');
    }
    thumbCache.set(e.id, url); return url;
  }
  const tq = []; let tBusy = false;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(ents => { for (const en of ents) if (en.isIntersecting) { io.unobserve(en.target); tq.push(en.target); pump(); } }, { rootMargin: '300px' }) : null;
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  function setThumb(img, e) { img.dataset.ex = e.id; if (!img.getAttribute('src')) img.src = BLANK; if (thumbCache.has(e.id)) { img.src = thumbCache.get(e.id); return; } if (io) io.observe(img); else { tq.push(img); pump(); } }
  function pump() {
    if (tBusy) return; tBusy = true;
    const step = () => { const t0 = performance.now(); while (tq.length && performance.now() - t0 < 14) { const img = tq.shift(); if (img.isConnected) img.src = thumbFor(EXI[img.dataset.ex]); } if (tq.length) requestAnimationFrame(step); else tBusy = false; };
    requestAnimationFrame(step);
  }

  /* ---------- body map (3D, with SVG fallback) ---------- */
  const mapCv = $('#mapCv'); let map = null;
  function initMap() {
    $('#mapLoading').remove();
    if (!HAS3D) { initSvgMap(); return; }
    const stage = new FW3.Stage(mapCv, { map: true, fov: 22 });
    const bindDef = { frames: [BODY_MESH.bind], view: { yaw: 0, pitch: 4 }, props: [] };
    const A = new Anim(bindDef), bounds = A.bounds();
    const J = solvePose(BODY_MESH.bind); stage.pose(J);
    const pick = new FW3.T.Mesh(FW3.bodyGeometry(), new FW3.T.MeshBasicMaterial());
    const ray = new FW3.T.Raycaster();
    map = { stage, bounds, pick, ray, t: 0, visible: true };
    const ro = 'ResizeObserver' in window ? new ResizeObserver(() => drawMap()) : null; ro && ro.observe(mapCv);
    mapCv.addEventListener('click', ev => {
      const r = mapCv.getBoundingClientRect(), x = ev.clientX - r.left, y = ev.clientY - r.top, half = x < r.width / 2 ? 0 : 1;
      const w = r.width / 2, cam = stage.camera;
      cam.aspect = w / r.height; cam.updateProjectionMatrix(); stage.aim(bounds, half ? 180 : 0, 3, 1.16);
      ray.setFromCamera({ x: ((x - half * w) / w) * 2 - 1, y: -(y / r.height) * 2 + 1 }, cam);
      const hit = ray.intersectObject(pick, false)[0]; if (!hit) return;
      const g = pick.geometry, mus = g.attributes.muscle, mw = g.attributes.musW; let best = -1, bw = 0;
      for (const vi of [hit.face.a, hit.face.b, hit.face.c]) if (mw.getX(vi) > bw && mus.getX(vi) > 0) { bw = mw.getX(vi); best = mus.getX(vi); }
      if (best < 0 || bw < .25) { toast('Tap directly on a muscle'); return; }
      const sub = BODY_MESH.muscles[best]; if (mapMode === 'rec') { const v = recoveryMap()[sub]; toast(`${subLabel(sub)}: ${v}% recovered${v < 50 ? ' — give it a rest' : v < 85 ? ' — light work is fine' : ' — ready to train'}`); return; } toggleSubs([sub]);
    });
    if ('IntersectionObserver' in window) new IntersectionObserver(es => { map.visible = es[0].isIntersecting; }).observe(mapCv);
    let fr = 0; const loop = t => { requestAnimationFrame(loop); if (!map.visible || sheetOpen || $('#v-train').hidden) return; if (reduceMotion && map.drawn) return; if ((fr++ & 1) && map.drawn) return; map.t = t / 1000; drawMap(); };
    requestAnimationFrame(loop);
  }
  function mapLevels() {
    if (mapMode === 'rec') { const R = recoveryMap(), lv = {}; for (const m in R) if (R[m] < 50) lv[m] = 2; else if (R[m] < 85) lv[m] = 1; return lv; } const lv = {}; for (const s of st.sel) for (const m of expandSub(s)) lv[m] = s === 'deep-core' && !st.sel.includes(m) ? Math.max(lv[m] || 0, 1) : 2; return lv; }
  function drawMap() {
    if (!map) return;
    const r = mapCv.getBoundingClientRect(); if (!r.width) return;
    const st3 = map.stage, R = st3.renderer, dpr = R.getPixelRatio();
    st3.resize(Math.round(r.width), Math.round(r.height));
    st3.setHighlight(mapLevels());
    const w = r.width / 2, h = r.height; R.setScissorTest(true);
    for (const half of [0, 1]) {
      R.setViewport(half * w, 0, w, h); R.setScissor(half * w, 0, w, h);
      st3.camera.aspect = w / h; st3.camera.updateProjectionMatrix(); st3.aim(map.bounds, half ? 180 : 0, 3, 1.16); st3.render(map.t);
    }
    R.setScissorTest(false); map.drawn = true;
  }
  // SVG fallback map (2D)
  function initSvgMap() {
    const host = $('#mapStage'); mapCv.remove();
    const smooth = pts => { const n = pts.length; let d = `M${pts[0][0]},${pts[0][1]}`; for (let i = 0; i < n; i++) { const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n]; d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`; } return d + 'Z'; };
    const mir = pts => pts.map(([x, y]) => [200 - x, y]).reverse();
    const FRONT = [['upper-chest', [[97, 74], [84, 73], [71, 77], [66, 85], [97, 88]]], ['mid-chest', [[97, 91], [67, 88], [64, 96], [69, 104], [97, 106]]], ['lower-chest', [[97, 109], [70, 107], [71, 114], [81, 120], [97, 120]]], ['front-delts', [[69, 72], [59, 76], [55, 87], [57, 100], [63, 97], [67, 86]]], ['biceps-long biceps-short brachialis', [[57, 105], [51, 109], [47, 126], [46, 141], [51, 146], [55, 128]]], ['upper-abs', [[97, 124], [84, 124], [82, 140], [83, 151], [97, 151]]], ['lower-abs', [[97, 155], [84, 155], [85, 178], [89, 199], [97, 209]]], ['obliques', [[69, 125], [67, 141], [71, 165], [75, 182], [81, 176], [80, 150], [78, 128]]], ['quads', [[73, 224], [69, 250], [71, 286], [77, 313], [87, 315], [93, 295], [92, 256], [87, 233]]], ['adductors', [[97, 238], [93, 241], [91, 262], [94, 280], [98, 266]]], ['forearm-flexors', [[48, 153], [43, 166], [38, 196], [41, 208], [46, 195], [51, 170], [52, 156]]], ['tibialis', [[75, 334], [73, 356], [76, 383], [81, 381], [81, 350]]]];
    const BACK = [['traps', [[100, 57], [90, 61], [71, 70], [85, 77], [100, 93]]], ['rear-delts', [[69, 72], [58, 76], [52, 88], [54, 102], [60, 100], [65, 86]]], ['upper-back', [[100, 97], [87, 81], [73, 85], [71, 100], [80, 117], [100, 125]]], ['lats', [[69, 104], [63, 113], [65, 138], [73, 163], [80, 174], [86, 150], [84, 128], [78, 114]]], ['lower-back', [[97, 130], [89, 132], [87, 160], [89, 189], [97, 195]]], ['triceps-long triceps-lateral', [[57, 104], [50, 108], [46, 126], [46, 143], [52, 148], [56, 130], [58, 112]]], ['glute-max', [[97, 206], [87, 209], [73, 218], [70, 236], [82, 249], [97, 247]]], ['glute-med', [[71, 196], [66, 206], [72, 214], [86, 208], [84, 198]]], ['hamstrings', [[72, 254], [70, 280], [74, 303], [84, 307], [93, 299], [95, 268], [90, 255]]], ['gastrocnemius', [[72, 320], [70, 338], [74, 355], [82, 357], [88, 343], [86, 322]]]];
    const torso = [[100, 58], [88, 61], [72, 67], [60, 73], [55, 84], [57, 100], [62, 120], [66, 148], [70, 174], [68, 196], [64, 214], [66, 234], [82, 245], [100, 241]];
    let body = `<path class="bm-body" d="${smooth(torso.concat(mir(torso).slice(1, -1)))}"/><ellipse class="bm-body" cx="100" cy="32" rx="17" ry="21"/>`;
    for (const sx of [1, -1]) { const X = x => sx > 0 ? x : 200 - x; const ln = (a, b, c, d, w) => `<line x1="${X(a)}" y1="${b}" x2="${X(c)}" y2="${d}" stroke="#2a2d33" stroke-width="${w}" stroke-linecap="round"/>`; body += ln(56, 86, 49, 147, 20) + ln(48, 151, 40, 212, 15) + ln(82, 236, 80, 318, 34) + ln(80, 324, 79, 392, 22); }
    for (const regs of [BACK, FRONT]) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 200 420');
      let s = body; for (const [subs, pts] of regs) for (const side of [pts, mir(pts)]) s += `<path class="bm-m" data-subs="${subs}" d="${smooth(side)}"/>`;
      svg.innerHTML = s; svg.addEventListener('click', ev => { const p = ev.target.closest('.bm-m'); if (p) toggleSubs(p.dataset.subs.split(' ')); });
      host.prepend(svg);
    }
    map = { svg: true }; paintSvgMap();
  }
  function paintSvgMap() { document.querySelectorAll('.bm-m').forEach(p => p.classList.toggle('on', p.dataset.subs.split(' ').some(x => st.sel.includes(x)))); }

  /* ---------- train view ---------- */
  function toggleSubs(subs) {
    const allOn = subs.every(x => st.sel.includes(x));
    st.sel = allOn ? st.sel.filter(x => !subs.includes(x)) : [...new Set(st.sel.concat(subs))];
    onSelChange();
    const names = subs.map(subLabel).join(', ');
    toast(allOn ? `Removed ${names}` : `Added ${names}`);
  }
  function renderPresets() {
    const box = $('#presetChips'); box.innerHTML = '';
    const sg = suggestSplit(); if (sg) box.appendChild(el('button', { class: 'chip sug', onclick: applySuggestion }, `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.2 6.3 6.3 2.2-6.3 2.2L12 19.5l-2.2-6.3L3.5 11l6.3-2.2z"/></svg>Suggested: ${esc(sg.name)}`));
    for (const [name, subs] of MUSCLE_PRESETS) { const on = subs.length === st.sel.length && subs.every(x => st.sel.includes(x)); box.appendChild(el('button', { class: 'chip', 'aria-pressed': on, onclick: () => { st.sel = subs.slice(); onSelChange(); } }, esc(name))); }
  }
  function renderGroups() {
    const box = $('#groups'); box.innerHTML = '';
    for (const g of GROUPS) {
      const row = el('div', { class: 'grp' }, `<div class="grp-name">${esc(g.name)}</div>`), chips = el('div', { class: 'chips' });
      for (const [id, name, hint] of g.subs) chips.appendChild(el('button', { class: 'chip m', 'aria-pressed': st.sel.includes(id), title: hint, onclick: () => { st.sel = st.sel.includes(id) ? st.sel.filter(x => x !== id) : st.sel.concat(id); onSelChange(); } }, esc(name)));
      row.appendChild(chips); box.appendChild(row);
    }
    $('#fineSum').textContent = `${st.sel.length} of ${Object.keys(SUB).length}`;
  }
  function renderSelFoot() {
    if (mapMode === 'rec') { const R = recoveryMap(), tired = Object.values(R).filter(v => v < 85).length; $('#selCount').textContent = tired; $('#selText').textContent = st.hist.length ? (tired ? 'muscles still recovering' : 'muscles all recovered') : 'Log a workout to see recovery'; $('#clearSel').textContent = 'Suggest'; return; }
    $('#clearSel').textContent = 'Clear';
    $('#selCount').textContent = st.sel.length;
    const names = st.sel.slice().sort((a, b) => SUB_ORDER[a] - SUB_ORDER[b]).map(subLabel);
    $('#selText').textContent = st.sel.length ? names.join(', ') : 'Tap a muscle on the body to start';
  }
  function onSelChange() { st.example = false; save(); renderPresets(); renderGroups(); renderSelFoot(); renderBuildBtn(); if (map && map.svg) paintSvgMap(); else drawMap(); }
  function renderSeg(id, key) {
    const box = $(id); box.innerHTML = '';
    for (const [v, label] of SEGS[key]) box.appendChild(el('button', { 'aria-pressed': st[key] === v, onclick: () => { st[key] = v; if (key === 'style' && st.workout) { st.workout = st.style === 'superset' ? pairUp(st.workout.map(x => EXI[x]).filter(Boolean)).map(e => e.id) : st.workout; } save(); renderSeg(id, key); renderBuildBtn(); renderWorkout(); } }, label));
    if (key === 'style') $('#styleHint').textContent = STYLE_HINT[st.style];
  }
  function renderBuildBtn() { const b = $('#buildBtn'); b.disabled = !st.sel.length; b.innerHTML = st.sel.length ? `Build workout <small>· about ${st.time} min</small>` : 'Pick a muscle first'; }
  function workoutTitle() {
    if (!st.sel.length) return 'Your workout';
    const preset = MUSCLE_PRESETS.find(([, subs]) => subs.length === st.sel.length && subs.every(x => st.sel.includes(x)));
    if (preset) return preset[0];
    const gs = [...new Set(st.sel.map(s => SUB[s].gname))]; return gs.length <= 3 ? gs.join(' & ') : 'Mixed session';
  }
  function renderWorkout() {
    const ids = (st.workout || []).filter(id => EXI[id]);
    $('#wkEyebrow').textContent = st.example ? 'Example — tap Build to make yours' : `${SEGS.goal.find(x => x[0] === st.goal)[1]} · ${SEGS.level.find(x => x[0] === st.level)[1]}${st.style !== 'straight' ? ' · ' + SEGS.style.find(x => x[0] === st.style)[1] : ''}`;
    $('#wkTitle').textContent = workoutTitle(); $('#wkCount').textContent = ids.length; $('#wkMin').textContent = ids.length ? estMinutes(ids) : 0;
    const miss = missingTargets(), note = $('#wkNote');
    if (miss.length) { note.className = 'note warn'; note.innerHTML = `<b>No exercises for ${esc(miss.map(subLabel).join(', '))}</b> with your gear. Add equipment in the Gear tab.`; }
    else if (uncovered(ids).length && !st.example) { note.className = 'note warn'; note.innerHTML = `<b>Not enough time to also cover ${esc(uncovered(ids).map(subLabel).join(', '))}.</b> Pick a longer session or fewer muscles.`; }
    else { note.className = 'note'; note.innerHTML = '<b>Warm up first:</b> 5 minutes of easy cardio, then 1–2 light sets of your first exercise. Leave 1–2 reps in the tank on each set.'; }
    $('#startBtn').hidden = !ids.length || !!st.cur; $('#wkActs').hidden = !ids.length; renderSess();
    const list = $('#wkList'); list.innerHTML = '';
    if (!ids.length) { list.appendChild(el('div', { class: 'empty' }, 'Pick some muscles and tap <b>Build workout</b>.')); return; }
    const mk = (id, i, badge) => {
      const e = EXI[id], r = prescribe(e), done = st.done[id] || 0;
      const card = el('div', { class: 'ex-card' });
      const img = el('img', { class: 'thumb', alt: '' }); setThumb(img, e);
      const main = el('button', { class: 'ex-main', style: 'text-align:left', 'aria-label': `Open ${e.name}` }, `<span class="ex-name">${badge ? `<span class="badge">${badge}</span>` : ''}${esc(e.name)}</span><span class="ex-sub">${esc(e.pri.map(subLabel).join(' · '))}</span><span class="rx"><b>${r.sets} × ${r.reps}</b>${r.unit === 'reps' ? '' : r.unit}${r.side ? ' / side' : ''}<span class="dots">${Array.from({ length: r.sets }, (_, k) => `<i class="${k < done ? 'on' : ''}"></i>`).join('')}</span></span>`);
      const open = () => openSheet(id, i); main.addEventListener('click', open); img.addEventListener('click', open); img.style.cursor = 'pointer';
      const acts = el('div', { class: 'ex-acts' });
      acts.appendChild(el('button', { class: 'icon-btn', 'aria-label': `Swap ${e.name}`, title: 'Swap', onclick: () => swapAt(i) }, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h13l-3-3M20 16H7l3 3"/></svg>'));
      acts.appendChild(el('button', { class: 'icon-btn', 'aria-label': `Remove ${e.name}`, title: 'Remove', onclick: () => { st.workout.splice(i, 1); save(); renderWorkout(); } }, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>'));
      card.append(img, main, acts); return card;
    };
    const groups = groupsOf(ids);
    groups.forEach((g, gi) => {
      if (g.length < 2) { list.appendChild(mk(ids[g[0]], g[0])); return; }
      const L = String.fromCharCode(65 + gi), box = el('div', { class: 'grp-box' });
      const rest = restTxt(restAt(ids, g[g.length - 1]));
      list.appendChild(el('div', { class: 'grp-head' }, st.style === 'circuit' ? `<b>Circuit · 3 rounds</b><span>15 s between moves · ${rest} between rounds</span>` : `<b>Superset ${L}</b><span>Back to back, then rest ${rest}</span>`));
      g.forEach((i, k) => box.appendChild(mk(ids[i], i, st.style === 'circuit' ? String(k + 1) : L + (k + 1))));
      list.appendChild(box);
    });
  }
  const swapIdx = {};
  function alternativesFor(e, exclude) {
    const set = eqSet(), T = new Set(e.pri);
    return EX.filter(x => x.id !== e.id && !exclude.includes(x.id) && exAvailable(x, set) && x.pri.some(p => T.has(p)))
      .map(x => ({ x, s: x.pri.filter(p => T.has(p)).length * 2 + (x.comp === e.comp ? 1 : 0) - (x.lvl > MAXLVL[st.level] ? 2 : 0) + (x.pat === e.pat ? .5 : 0) })).sort((a, b) => b.s - a.s).map(o => o.x);
  }
  function swapAt(i) {
    const alts = alternativesFor(EXI[st.workout[i]], st.workout);
    if (!alts.length) { toast('No other options for this muscle with your gear'); return; }
    swapIdx[i] = (swapIdx[i] ?? -1) + 1; st.workout[i] = alts[swapIdx[i] % alts.length].id; save(); renderWorkout(); toast(`Swapped in ${EXI[st.workout[i]].name}`);
  }
  let seedN = 1;
  $('#buildBtn').addEventListener('click', () => {
    seedN = (Date.now() & 0xffff) + seedN * 7; st.workout = buildWorkout(seedN); st.example = false; st.done = {}; save(); renderWorkout();
    $('#workoutSec').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    if (!st.workout.length) toast('Nothing fits that gear — try adding equipment');
  });
  $('#startBtn').addEventListener('click', () => { ensureSession(); const ids = st.workout || []; const i = Math.max(0, ids.findIndex(id => (st.done[id] || 0) < prescribe(EXI[id]).sets)); if (ids.length) openSheet(ids[i], i); });
  $('#clearSel').addEventListener('click', () => { if (mapMode === 'rec') { applySuggestion(); return; } st.sel = []; onSelChange(); });

  /* ---------- player ---------- */
  const cv = $('#cv'), ov = $('#ov'), octx = ov.getContext('2d');
  let sheetOpen = false;
  const V = { e: null, idx: -1, mode: 'form', yaw: 60, pitch: 10, yawT: null, pitchT: null, t: 0, playing: true, speed: 1, last: 0, raf: 0, stage: null, guideState: null, drag: null };
  function ensureStage() { if (V.stage || !HAS3D) return; V.stage = new FW3.Stage(cv, { shadowSize: 1024 }); }
  function size() {
    const r = $('#stage').getBoundingClientRect(), d = Math.min(2, window.devicePixelRatio || 1);
    V.w = r.width; V.h = r.height; ov.width = Math.round(r.width * d); ov.height = Math.round(r.height * d); V.dpr = d;
    if (V.stage) V.stage.resize(Math.round(r.width), Math.round(r.height)); else { cv.width = ov.width; cv.height = ov.height; }
  }
  function currentAnim() { return getAnim(V.e, V.mode === 'mistake' ? V.mistake : null); }
  function frame(now) {
    V.raf = requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - (V.last || now)) / 1000); V.last = now;
    if (V.playing) V.t += dt * V.speed;
    if (V.yawT != null && !V.drag) { const d = ((V.yawT - V.yaw + 540) % 360) - 180; V.yaw += d * Math.min(1, dt * 7); if (Math.abs(d) < .3) { V.yaw = V.yawT; V.yawT = null; } }
    if (V.pitchT != null && !V.drag) { V.pitch += (V.pitchT - V.pitch) * Math.min(1, dt * 7); if (Math.abs(V.pitchT - V.pitch) < .2) V.pitchT = null; }
    draw(now / 1000);
  }
  function draw(time) {
    const A = currentAnim(); const { pose, label, prog } = A.poseAt(V.t); const J = solvePose(pose);
    const bounds = A.bounds();
    if (V.stage) {
      V.stage.pose(J); V.stage.props(A.propPrims(J, pose)); V.stage.aim(bounds, V.yaw, V.pitch, 0.9, 0.1); V.stage.render(time);
    } else {
      const ctx = cv.getContext('2d'), cam = new Camera(V.yaw, V.pitch); ctx.setTransform(1, 0, 0, 1, 0, 0);
      V.cam2 = cam; V.fit2 = fitFor(bounds, cv.width, cv.height * .6, cam);
      drawScene(ctx, cv.width, cv.height, bodyPrims(J).concat(A.propPrims(J, pose)), cam, V.fit2, palette2(), hl2(V.e), { shadow: J.root, cy: .58 });
    }
    octx.clearRect(0, 0, ov.width, ov.height);
    if (V.mode !== 'clean') {
      const guides = FORM.guidesFor(V.e);
      if (guides.length) {
        const proj = V.stage ? (p => V.stage.project(p, ov.width, ov.height)) : proj2;
        V.guideState.anim = A; V.guideState.animKey = V.e.id + V.mode; V.guideState.mistake = V.mode === 'mistake' ? V.mistake : null;
        FORM.draw(octx, J, guides, proj, V.guideState);
      }
    }
    if (label != null && label !== V.lastLabel) { $('#phaseLabel').textContent = label || '—'; V.lastLabel = label; }
    $('#phaseBar').style.width = `${Math.round((label == null ? 1 : prog) * 100)}%`;
  }
  function proj2(p) { // 2D fallback projection
    const cam = V.cam2, fit = V.fit2; cam.setup(); const cc = cam.rot(fit.center), r = cam.rot(p);
    return [ov.width / 2 + (r[0] - cc[0]) * fit.scale, ov.height * .58 - (r[1] - cc[1]) * fit.scale];
  }
  function setMode(m) {
    V.mode = m; document.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m));
    const banner = $('#mistakeBanner');
    if (m === 'mistake' && V.mistake) { banner.hidden = false; banner.textContent = `✕ Don’t: ${V.mistake.label}`; V.yawT = V.mistake.view; V.pitchT = 8; setViewBtn(''); V.t = 0; }
    else { banner.hidden = true; if (V.yawT == null && m !== 'mistake') { } }
    if (V.stage) V.stage.setMistake(m === 'mistake');
  }
  document.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', () => { if (b.dataset.mode === 'mistake' && !V.mistake) return; setMode(b.dataset.mode); if (b.dataset.mode !== 'mistake') { V.yawT = getDef(V.e).view.yaw; V.pitchT = getDef(V.e).view.pitch; setViewBtn('auto'); } }));
  function setViewBtn(v) { document.querySelectorAll('[data-view]').forEach(b => b.setAttribute('aria-pressed', b.dataset.view === v)); }
  document.querySelectorAll('[data-view]').forEach(b => b.addEventListener('click', () => {
    const v = b.dataset.view, d = getDef(V.e); setViewBtn(v);
    if (v === 'auto') { V.yawT = d.view.yaw; V.pitchT = d.view.pitch; } if (v === 'side') { V.yawT = 90; V.pitchT = 4; } if (v === 'front') { V.yawT = 0; V.pitchT = 6; }
  }));
  cv.addEventListener('pointerdown', ev => { V.drag = { x: ev.clientX, y: ev.clientY, yaw: V.yaw, pitch: V.pitch }; cv.setPointerCapture(ev.pointerId); });
  cv.addEventListener('pointermove', ev => { if (!V.drag) return; V.yaw = V.drag.yaw - (ev.clientX - V.drag.x) * .5; V.pitch = Math.max(-4, Math.min(70, V.drag.pitch + (ev.clientY - V.drag.y) * .28)); V.yawT = V.pitchT = null; setViewBtn(''); });
  const endDrag = () => { V.drag = null; }; cv.addEventListener('pointerup', endDrag); cv.addEventListener('pointercancel', endDrag);
  function setPlaying(p) { V.playing = p; const b = $('#playBtn'); b.setAttribute('aria-label', p ? 'Pause' : 'Play'); b.innerHTML = p ? '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/></svg>' : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.5 5.2v13.6a.8.8 0 0 0 1.2.7l11-6.8a.8.8 0 0 0 0-1.4l-11-6.8a.8.8 0 0 0-1.2.7z"/></svg>'; }
  $('#playBtn').addEventListener('click', () => setPlaying(!V.playing));
  $('#speedBtn').addEventListener('click', () => { V.speed = V.speed === 1 ? .5 : V.speed === .5 ? .25 : 1; $('#speedBtn').textContent = V.speed === 1 ? '1×' : V.speed === .5 ? '½×' : '¼×'; });

  function openSheet(id, idx = -1) {
    const e = EXI[id]; if (!e) return;
    ensureStage();
    V.e = e; V.idx = idx; V.mistake = FORM.mistakeFor(e); V.guideState = { dpr: Math.min(2, window.devicePixelRatio || 1), cache: {}, anim: null };
    const d = getDef(e); V.yaw = d.view.yaw; V.pitch = d.view.pitch; V.yawT = V.pitchT = null; V.t = 0; V.lastLabel = undefined;
    if (V.stage) { V.stage.setHighlight(levelsFor(e)); V.stage.pool.clear(); }
    $('#mistakeBtn').disabled = !V.mistake; $('#mistakeBtn').style.opacity = V.mistake ? 1 : .35;
    setMode(V.mode === 'clean' ? 'clean' : 'form'); setViewBtn('auto');
    $('#exName').textContent = e.name; $('#exSub').textContent = idx >= 0 ? `Exercise ${idx + 1} of ${st.workout.length}` : eqText(e);
    $('#favBtn').setAttribute('aria-pressed', st.favs.includes(id));
    renderPlayerInfo();
    const sh = $('#sheet'); sh.classList.add('open'); sh.scrollTop = 0; sheetOpen = true; document.body.style.overflow = 'hidden';
    requestAnimationFrame(() => { size(); V.guideState.dpr = V.dpr; V.last = 0; cancelAnimationFrame(V.raf); V.raf = requestAnimationFrame(frame); });
    setPlaying(!reduceMotion); if (reduceMotion) V.t = getAnim(e).total * .3;
  }
  function closeSheet() { $('#sheet').classList.remove('open'); sheetOpen = false; document.body.style.overflow = ''; cancelAnimationFrame(V.raf); stopRest(); renderWorkout(); }
  $('#closeSheet').addEventListener('click', closeSheet);
  document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && sheetOpen) closeSheet(); });
  window.addEventListener('resize', () => { if (sheetOpen) size(); drawMap(); });
  $('#favBtn').addEventListener('click', () => { const id = V.e.id; st.favs = st.favs.includes(id) ? st.favs.filter(x => x !== id) : st.favs.concat(id); save(); $('#favBtn').setAttribute('aria-pressed', st.favs.includes(id)); toast(st.favs.includes(id) ? 'Saved to your library' : 'Removed from saved'); if (libRendered) renderLib(); });

  function renderPlayerInfo() {
    const e = V.e, r = prescribe(e);
    $('#exTitle').textContent = e.name;
    $('#exTags').innerHTML = e.pri.map(p => `<span class="tag p">${esc(subLabel(p))}</span>`).join('') + e.sec.map(p => `<span class="tag s">${esc(subLabel(p))}</span>`).join('');
    $('#setsRx').textContent = `${r.sets} × ${r.reps}`; $('#setsUnit').textContent = (r.unit === 'reps' ? 'reps' : r.unit === 'sec' ? 'seconds' : 'metres') + (r.side ? ' each side' : '');
    const rs = V.idx >= 0 && st.workout ? restAt(st.workout, V.idx) : r.rest;
    $('#setsRest').textContent = rs <= 15 ? 'Go straight to the next move' : `Rest ${restTxt(rs)}`;
    renderSets();
    // workout strip
    const strip = $('#strip'); strip.innerHTML = '';
    const ids = V.idx >= 0 ? st.workout : [];
    strip.hidden = !ids.length;
    ids.forEach((id, i) => { const x = EXI[id]; const b = el('button', { 'aria-current': i === V.idx, class: (st.done[id] || 0) >= prescribe(x).sets ? 'done' : '', 'aria-label': x.name }); const im = el('img', { alt: '' }); setThumb(im, x); b.append(im, document.createTextNode(String(i + 1).padStart(2, '0'))); b.addEventListener('click', () => openSheet(id, i)); strip.appendChild(b); });
    // detail
    const lvl = ['', 'Beginner-friendly', 'Intermediate', 'Advanced'][e.lvl];
    const alts = alternativesFor(e, []).slice(0, 4);
    $('#detail').innerHTML = `
      <div class="meta-list"><div><span>Type</span><b>${e.comp ? 'Compound — several joints' : 'Isolation — one joint'}</b></div><div><span>Level</span><b>${lvl}</b></div><div><span>Equipment</span><b>${esc(eqText(e))}</b></div></div>
      ${progressChart(e)}${historyFor(e)}
      <div class="sec"><h3>How to do it</h3><ol class="steps">${e.how.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ol></div>
      <div class="sec"><h3>Form cues</h3><ul class="cues">${e.cues.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ul></div>
      <div class="sec"><h3>Avoid</h3><ul class="cues bad">${e.avoid.map(s => `<li><span>${esc(s)}</span></li>`).join('')}</ul></div>
      ${alts.length ? '<div class="sec"><h3>Swap options with your gear</h3><div class="alts" id="altList"></div></div>' : ''}`;
    const al = $('#altList'); if (al) alts.forEach(x => al.appendChild(tile(x, true)));
  }
  let restEnd = 0, restTimer = 0;
  function startRest(sec) { restEnd = Date.now() + sec * 1000; clearInterval(restTimer); restTimer = setInterval(tickRest, 250); const p = $('#restPill'); if (p) p.classList.add('on'); tickRest(); }
  function stopRest() { restEnd = 0; clearInterval(restTimer); const p = $('#restPill'); if (p) p.classList.remove('on'); }
  function tickRest() { const t = $('#restT'); if (!t) return; const left = Math.max(0, Math.ceil((restEnd - Date.now()) / 1000)); t.textContent = `${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`; if (!left) { stopRest(); toast('Rest done — next set'); } }
  $('#nextBtn').addEventListener('click', () => { const ids = st.workout || []; if (V.idx < ids.length - 1) openSheet(ids[V.idx + 1], V.idx + 1); else finishWorkout(); });

  /* ---------- logging, records, recovery (ideas from Hevy, Strong and Fitbod) ---------- */
  const LOADABLE = new Set(['barbell', 'ezbar', 'dumbbells', 'kettlebell', 'trapbar', 'plates', 'landmine', 'smith', 'cable', 'crossover', 'latpull', 'cablerow', 'chestpress', 'pecdeck', 'shoulderpress', 'rowmachine', 'legpress', 'hacksquat', 'legext', 'legcurl', 'hipabd', 'calfstand', 'calfseat', 'abmachine', 'medball']);
  const eqFlat = e => e.eq.flatMap(r => Array.isArray(r) ? r : [r]);
  const needsW = e => eqFlat(e).some(x => LOADABLE.has(x));
  const LB = 2.20462;
  const unitW = () => st.units === 'lb' ? 'lb' : 'kg';
  const toD = kg => st.units === 'lb' ? kg * LB : kg;
  const fromD = v => st.units === 'lb' ? v / LB : v;
  const roundD = v => st.units === 'lb' ? Math.round(v * 2) / 2 : Math.round(v * 4) / 4;
  const fmtN = v => String(Math.round(v * 100) / 100);
  const fmtW = kg => fmtN(roundD(toD(kg)));
  const fmtBig = kg => Math.round(toD(kg)).toLocaleString();
  function incD(e) { const f = e.eq, lb = st.units === 'lb'; if (f.includes('kettlebell')) return lb ? 10 : 4; if (f.includes('dumbbells')) return lb ? 5 : 2; return lb ? 5 : 2.5; }
  const e1rm = (w, r) => w > 0 && r > 0 ? w * (1 + Math.min(r, 12) / 30) : 0;
  function repRange(e) { const r = prescribe(e), m = String(r.reps).match(/(\d+)\D+(\d+)/); return m ? [+m[1], +m[2]] : [+r.reps || 10, +r.reps || 10]; }
  const repWord = e => e.unit === 'sec' ? 'sec' : e.unit === 'steps' ? 'm' : 'reps';
  const lastLog = id => { const L = st.log[id]; return L && L.length ? L[L.length - 1] : null; };
  const setTxt = (s, W) => `${W && s.w ? fmtW(s.w) + '×' : ''}${s.r}`;
  // double progression: hit the top of the rep range on every set → add weight; otherwise add a rep
  function suggest(e) {
    const [lo, hi] = repRange(e), prev = lastLog(e.id), W = needsW(e), u = repWord(e);
    if (!prev) return { w: null, r: null, note: W ? `<b>First time?</b> Pick a weight you could lift about ${hi + 3} times, then log what you actually do.` : `<b>First time?</b> Log your ${u === 'reps' ? 'reps' : u === 'sec' ? 'time' : 'distance'} — next time you'll get a target to beat.` };
    const work = prev.sets.filter(s => s.r > 0); if (!work.length) return { w: null, r: null, note: '' };
    const top = Math.max(...work.map(s => s.w || 0)), atTop = work.filter(s => (s.w || 0) >= top - 1e-6), best = Math.max(...atTop.map(s => s.r));
    const allHit = atTop.length >= Math.min(prescribe(e).sets, work.length) && atTop.every(s => s.r >= hi);
    const last = `Last time: ${work.map(s => setTxt(s, W)).join(', ')}${W && top ? ' ' + unitW() : ''}.`;
    if (W && top > 0) {
      if (allHit && u === 'reps') { const nw = fromD(roundD(toD(top)) + incD(e)); return { w: nw, r: lo, note: `${last} You hit ${hi} on every set — <b>go up to ${fmtW(nw)} ${unitW()}</b>.` }; }
      const tr = Math.min(hi, Math.max(lo, best + (u === 'reps' ? 1 : 5))); return { w: top, r: tr, note: `${last} <b>Same weight, aim for ${tr} ${u}</b>.` };
    }
    if (allHit) return { w: null, r: hi, note: `${last} <b>You topped the range</b> — slow the lowering or try a harder version.` };
    const tr = Math.min(hi, best + (u === 'reps' ? 1 : 5)); return { w: null, r: tr, note: `${last} <b>Aim for ${tr} ${u}</b> on each set.` };
  }
  function bestOf(sets, W) { let b = null; for (const s of sets) { if (!(s.r > 0)) continue; const v = W ? e1rm(s.w || 0, s.r) : s.r; if (v > 0 && (!b || v > b.v)) b = { v, w: s.w || 0, r: s.r }; } return b; }
  const curSets = id => (st.cur && st.cur.sets[id]) || [];
  function ensureSession() { if (!st.cur) { st.cur = { t0: Date.now(), sets: {}, title: workoutTitle() }; renderWorkout(); } return st.cur; }
  const drafts = {};
  const CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  const barOf = e => e.eq.includes('landmine') ? null : e.eq.includes('trapbar') ? 'trapbar' : e.eq.includes('barbell') ? 'barbell' : e.eq.includes('ezbar') ? 'ezbar' : null;
  const BAR = { barbell: [20, 45], trapbar: [25, 55], ezbar: [10, 25] };
  function platesFor(totalD, barD) { const P = st.units === 'lb' ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25]; let side = (totalD - barD) / 2; if (side < -1e-6) return null; const out = []; for (const p of P) while (side >= p - 1e-6) { out.push(p); side -= p; } return { out, left: side }; }
  function toggleSet(e, k, v) {
    const r = prescribe(e), W = needsW(e);
    if (!v.r) { toast(`Enter your ${repWord(e) === 'reps' ? 'reps' : repWord(e) === 'sec' ? 'seconds' : 'distance'} first`); return; }
    const S = ensureSession(), arr = S.sets[e.id] || (S.sets[e.id] = []);
    while (arr.length <= k) arr.push({});
    const s = arr[k];
    if (s.done) { s.done = false; s.pr = false; stopRest(); }
    else {
      Object.assign(s, v, { done: true, t: Date.now() }); s.pr = false;
      const old = st.prs[e.id], val = W ? e1rm(v.w, v.r) : v.r;
      const sessBest = Math.max(0, ...arr.filter((x, i) => i !== k && x.done).map(x => W ? e1rm(x.w, x.r) : x.r));
      if (old && val > old.v + 1e-6 && val > sessBest) { s.pr = true; toast(`New record! ${setTxt(v, W)}${W ? ' ' + unitW() : ' ' + repWord(e)}`); }
      const doneN = arr.filter(x => x.done).length;
      if (doneN < r.sets) startRest(V.idx >= 0 && st.workout ? Math.max(15, restAt(st.workout, V.idx)) : r.rest);
      else { stopRest(); if (!s.pr) toast('Exercise complete'); }
    }
    st.done[e.id] = arr.filter(x => x.done).length; save(); renderSets();
  }
  function renderSets() {
    const e = V.e, r = prescribe(e), W = needsW(e), u = repWord(e), sg = suggest(e), prev = lastLog(e.id);
    const cur = curSets(e.id), dr = drafts[e.id] || (drafts[e.id] = []);
    const n = Math.max(r.sets, cur.length, dr.length);
    const sl = $('#sugLine'); sl.innerHTML = sg.note; sl.hidden = !sg.note;
    const tbl = $('#setTbl'); tbl.innerHTML = ''; tbl.className = 'set-tbl' + (W ? '' : ' now');
    tbl.appendChild(el('div', { class: 'set-h' }, `<span>Set</span><span>Previous</span>${W ? `<span>${unitW()}</span>` : ''}<span>${u === 'reps' ? 'Reps' : u === 'sec' ? 'Secs' : 'Metres'}</span><span></span>`));
    let openW = null;
    for (let k = 0; k < n; k++) {
      const s = cur[k] || {}, d = dr[k] || {}, done = !!s.done, p = prev && prev.sets[k];
      const wv = s.w ?? d.w ?? sg.w, rv = s.r ?? d.r ?? sg.r;
      if (!done && openW == null && wv) openW = wv;
      const row = el('div', { class: 'set-r' + (done ? ' done' : '') + (s.pr ? ' pr' : '') });
      row.appendChild(el('b', {}, s.pr ? '★' : String(k + 1)));
      row.appendChild(el('span', { class: 'prev' }, p ? setTxt(p, W) : '—'));
      let wi = null;
      if (W) { wi = el('input', { class: 'num', inputmode: 'decimal', enterkeyhint: 'next', 'aria-label': `Set ${k + 1} weight in ${unitW()}`, placeholder: unitW() }); if (wv) wi.value = fmtW(wv); row.appendChild(wi); }
      const ri = el('input', { class: 'num', inputmode: 'numeric', enterkeyhint: 'done', 'aria-label': `Set ${k + 1} ${u}`, placeholder: u }); if (rv) ri.value = rv; row.appendChild(ri);
      const read = () => { const wn = wi ? parseFloat((wi.value || '').replace(',', '.')) : 0; return { w: wn > 0 ? fromD(wn) : 0, r: parseInt(ri.value, 10) || 0 }; };
      const onEdit = () => { const v = read(); if (done) { Object.assign(cur[k], v); save(); } else dr[k] = v; if (!done) renderExtra(); };
      for (const i of wi ? [wi, ri] : [ri]) { i.addEventListener('change', onEdit); i.addEventListener('focus', () => i.select()); }
      const ck = el('button', { class: 'ck', 'aria-pressed': done, 'aria-label': done ? `Undo set ${k + 1}` : `Complete set ${k + 1}` }, CHECK);
      ck.addEventListener('click', () => toggleSet(e, k, read()));
      row.appendChild(ck); tbl.appendChild(row);
    }
    tbl.appendChild(el('button', { class: 'add-set', onclick: () => { dr[n] = {}; renderSets(); } }, '+ Add set'));
    renderExtra(openW);
    const row = $('#setRow'); row.innerHTML = '';
    const pill = el('div', { class: 'rest-pill', id: 'restPill' }, '<span>Rest</span><b id="restT">0:00</b><button id="restSkip">Skip</button>'); row.appendChild(pill);
    pill.querySelector('#restSkip').addEventListener('click', stopRest);
    if (restEnd) { pill.classList.add('on'); tickRest(); }
    const doneN = cur.filter(x => x.done).length, ids = st.workout || [], next = V.idx >= 0 && V.idx < ids.length - 1, last = V.idx >= 0 && V.idx === ids.length - 1;
    const nb = $('#nextBtn'); nb.classList.toggle('on', doneN >= r.sets && (next || (last && !!st.cur)));
    nb.firstChild.textContent = next ? 'Next exercise ' : 'Finish workout ';
  }
  // plate maths + warm-up ramp for the next working weight
  function renderExtra(wKg) {
    const e = V.e, box = $('#setExtra'); box.innerHTML = '';
    if (wKg === undefined) { const dr = drafts[e.id] || [], cur = curSets(e.id); for (let k = 0; k < Math.max(dr.length, cur.length, prescribe(e).sets); k++) { if (cur[k] && cur[k].done) continue; wKg = (dr[k] && dr[k].w) || suggest(e).w; break; } }
    if (!wKg || !needsW(e)) return;
    const wD = roundD(toD(wKg)), bar = barOf(e), u = unitW();
    if (bar) {
      const bD = BAR[bar][st.units === 'lb' ? 1 : 0], pl = platesFor(wD, bD);
      if (pl) box.appendChild(el('div', {}, `<b>Plates per side</b>${pl.out.length ? pl.out.map(x => `<i>${fmtN(x)}</i>`).join('') : '<span>just the bar</span>'}<span>on a ${bD} ${u} ${bar === 'trapbar' ? 'trap bar' : bar === 'ezbar' ? 'EZ bar' : 'bar'}${pl.left > .01 ? ` · ${fmtN(pl.left * 2)} ${u} short` : ''}</span>`));
    }
    const first = V.idx <= 0 || (st.workout && st.workout.slice(0, V.idx).every(id => !needsW(EXI[id])));
    if (e.comp && first && !curSets(e.id).some(s => s.done)) {
      const step = incD(e), start = bar ? BAR[bar][st.units === 'lb' ? 1 : 0] : 0;
      const ramp = [[.4, 8], [.6, 5], [.8, 3]].map(([f, r]) => [Math.max(start, Math.round(wD * f / step) * step), r]).filter(([w], i, a) => w < wD && (i === 0 || w > a[i - 1][0]));
      if (ramp.length) box.appendChild(el('div', {}, `<b>Warm-up</b>${ramp.map(([w, r]) => `<i>${fmtN(w)}×${r}</i>`).join('')}<span>${u}, short rests</span>`));
    }
  }
  function finishWorkout() {
    const S = st.cur; if (!S) return;
    const order = st.workout || [];
    const ex = Object.entries(S.sets).map(([id, sets]) => ({ id, sets: sets.filter(s => s.done).map(s => ({ w: s.w || 0, r: s.r })), prs: sets.some(s => s.done && s.pr) })).filter(x => x.sets.length && EXI[x.id])
      .sort((a, b) => (order.indexOf(a.id) + 1 || 99) - (order.indexOf(b.id) + 1 || 99));
    if (!ex.length) { st.cur = null; st.done = {}; save(); renderWorkout(); toast('Nothing logged, so nothing was saved'); return; }
    const t1 = Date.now(), prs = [];
    for (const x of ex) {
      const e = EXI[x.id], W = needsW(e), b = bestOf(x.sets, W);
      if (b && (!st.prs[x.id] || b.v > st.prs[x.id].v + 1e-6)) { if (st.prs[x.id]) prs.push({ id: x.id, ...b }); st.prs[x.id] = { ...b, t: t1 }; }
      (st.log[x.id] = st.log[x.id] || []).push({ t: S.t0, sets: x.sets }); if (st.log[x.id].length > 60) st.log[x.id].shift();
    }
    const vol = ex.reduce((a, x) => a + (needsW(EXI[x.id]) && EXI[x.id].unit === 'reps' ? x.sets.reduce((b, s) => b + s.w * s.r, 0) : 0), 0);
    const w = { t0: S.t0, t1, title: S.title || workoutTitle(), ex: ex.map(({ id, sets }) => ({ id, sets })), vol, n: ex.reduce((a, x) => a + x.sets.length, 0) };
    st.hist.push(w); if (st.hist.length > 500) st.hist.shift();
    st.cur = null; st.done = {}; for (const k in drafts) delete drafts[k]; save();
    if (sheetOpen) closeSheet(); renderWorkout(); renderPresets();
    showSummary(w, prs);
  }
  const DAY = 864e5;
  const dayStart = t => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };
  const weekStart = t => { const d = new Date(dayStart(t)); d.setDate(d.getDate() - (d.getDay() + 6) % 7); return d.getTime(); };
  function weekStreak() { const W = new Set(st.hist.map(w => weekStart(w.t0))); const d = new Date(weekStart(Date.now())); if (!W.has(d.getTime())) d.setDate(d.getDate() - 7); let n = 0; while (W.has(d.getTime())) { n++; d.setDate(d.getDate() - 7); } return n; }
  const fmtDur = ms => { const m = Math.round(ms / 6e4); return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`; };
  function weekDots() {
    const days = new Set(st.hist.map(w => dayStart(w.t0))), ws = new Date(weekStart(Date.now())), today = dayStart(Date.now());
    let h = ''; for (let i = 0; i < 7; i++) { const t = new Date(ws); t.setDate(ws.getDate() + i); const k = t.getTime(); h += `<span>${'MTWTFSS'[i]}</span>`; }
    for (let i = 0; i < 7; i++) { const t = new Date(ws); t.setDate(ws.getDate() + i); const k = t.getTime(); h += `<i class="${days.has(k) ? 'on' : ''} ${k === today ? 'today' : ''} ${k > today ? 'fut' : ''}"></i>`; }
    return `<div class="cal">${h}</div>`;
  }
  function showSummary(w, prs) {
    const card = $('#sumCard'), streak = weekStreak(), saved = st.routines.some(r => r.ids.join() === (st.workout || []).join());
    card.innerHTML = `<div class="big"><div class="eyebrow">Workout complete</div><h2 id="sumTitle">${esc(w.title)}</h2><span>Workout #${st.hist.length} · ${new Date(w.t0).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}</span></div>
      <div class="kpis"><div><b>${fmtDur(w.t1 - w.t0)}</b><span>Time</span></div><div><b>${w.n}</b><span>Sets</span></div><div><b>${w.vol ? fmtBig(w.vol) : '—'}</b><span>${w.vol ? unitW() + ' lifted' : 'Volume'}</span></div></div>
      ${prs.length ? `<div class="sec" style="gap:8px"><h3 style="font-size:16px">New personal records</h3>${prs.map(p => { const e = EXI[p.id], W = needsW(e); return `<div class="pr-item"><b>${esc(e.name)}</b><span>${setTxt(p, W)} ${W ? unitW() : repWord(e)}</span></div>`; }).join('')}</div>` : ''}
      <div class="sec" style="gap:8px"><div class="ttl-row"><h3 style="font-size:16px">This week</h3><span>${streak ? `${streak}-week streak` : ''}</span></div>${weekDots()}</div>
      <div class="row-acts" style="justify-content:center">${saved ? '' : '<button class="btn-s ghost" id="sumSave">Save as routine</button>'}<button class="btn-s" id="sumDone" style="min-width:110px">Done</button></div>`;
    $('#sumModal').hidden = false;
    $('#sumDone').addEventListener('click', () => { $('#sumModal').hidden = true; });
    const sv = $('#sumSave'); if (sv) sv.addEventListener('click', () => { saveRoutine(w.title); sv.remove(); });
  }
  $('#sumModal').addEventListener('click', ev => { if (ev.target.id === 'sumModal') $('#sumModal').hidden = true; });
  // recovery: every logged set adds fatigue to its muscles, fading over a few days
  function recoveryMap(now = Date.now()) {
    const F = {}, addF = (id, t, n) => { const e = EXI[id]; if (!e) return; const h = (now - t) / 36e5; if (h > 168 || h < -1) return; const k = n * Math.exp(-Math.max(0, h) / 40); for (const p of e.pri) for (const m of expandSub(p)) F[m] = (F[m] || 0) + k; for (const p of e.sec) for (const m of expandSub(p)) F[m] = (F[m] || 0) + .45 * k; };
    for (const w of st.hist) for (const x of w.ex) addF(x.id, w.t1 || w.t0, x.sets.length);
    if (st.cur) for (const id in st.cur.sets) addF(id, now, st.cur.sets[id].filter(s => s.done).length);
    const R = {}; for (const m of Object.keys(SUB)) R[m] = Math.max(0, Math.min(100, Math.round(100 - (F[m] || 0) * 11))); return R;
  }
  const recColor = v => v < 50 ? 'var(--red)' : v < 85 ? 'var(--amber)' : 'var(--green)';
  function suggestSplit() {
    if (!st.hist.length) return null;
    const R = recoveryMap(), cands = MUSCLE_PRESETS.filter(([n]) => !['Core', 'Arms', 'Full body'].includes(n));
    const lastUse = n => { for (let i = st.hist.length - 1; i >= 0; i--) if (st.hist[i].title === n) return st.hist[i].t0; return 0; };
    let best = null; for (const [name, subs] of cands) { const avg = subs.reduce((a, m) => a + R[m], 0) / subs.length, minR = Math.min(...subs.map(m => R[m])); const sc = avg + minR * .3 - (Date.now() - lastUse(name) < 2 * DAY ? 15 : 0); if (!best || sc > best.sc) best = { name, subs, avg, sc }; }
    return best;
  }
  function applySuggestion() { const s = suggestSplit(); if (!s) { toast('Log a workout first — then you\'ll get suggestions'); return; } st.sel = s.subs.slice(); setMapMode('sel'); onSelChange(); toast(`${s.name}: those muscles are ${Math.round(s.avg)}% recovered`); }
  // routines
  function saveRoutine(name) {
    const ids = (st.workout || []).filter(id => EXI[id]); if (!ids.length) { toast('Build a workout first'); return; }
    name = (name || '').trim() || workoutTitle();
    st.routines = st.routines.filter(r => r.name !== name).concat({ name, ids, style: st.style, sel: st.sel.slice(), t: Date.now() }); save(); renderRoutines(); toast(`Saved “${name}”`);
  }
  function loadRoutine(r) {
    const set = eqSet(), ids = r.ids.filter(id => EXI[id]), miss = ids.filter(id => !exAvailable(EXI[id], set)).length;
    st.workout = ids; st.style = r.style || 'straight'; st.sel = (r.sel || []).filter(x => SUB[x]); st.example = false; st.done = {}; save();
    renderSeg('#segStyle', 'style'); onSelChange(); st.example = false; renderWorkout();
    $('#workoutSec').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
    toast(miss ? `Loaded “${r.name}” — ${miss} move${miss > 1 ? 's need' : ' needs'} gear you've switched off` : `Loaded “${r.name}”`);
  }
  function renderRoutines() {
    const row = $('#routineRow'), box = $('#routineChips'); box.innerHTML = '';
    row.hidden = !st.routines.length;
    for (const r of st.routines.slice().reverse()) box.appendChild(el('button', { class: 'chip', onclick: () => loadRoutine(r) }, esc(r.name)));
  }
  $('#saveRoutineBtn').addEventListener('click', () => { const row = $('#saveRoutineRow'); row.hidden = !row.hidden; if (!row.hidden) { const i = $('#routineName'); i.value = workoutTitle(); i.focus(); i.select(); } });
  $('#saveRoutineOk').addEventListener('click', () => { saveRoutine($('#routineName').value); $('#saveRoutineRow').hidden = true; });
  $('#routineName').addEventListener('keydown', ev => { if (ev.key === 'Enter') $('#saveRoutineOk').click(); });
  // live session bar
  let discardArm = 0;
  function renderSess() {
    const bar = $('#sessBar'); bar.hidden = !st.cur; if (!st.cur) return;
    const s = Math.floor((Date.now() - st.cur.t0) / 1000); $('#sessT').textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }
  setInterval(renderSess, 1000);
  $('#finishBtn').addEventListener('click', finishWorkout);
  $('#discardBtn').addEventListener('click', () => {
    const b = $('#discardBtn');
    if (Date.now() - discardArm > 3000) { discardArm = Date.now(); b.textContent = 'Sure?'; setTimeout(() => { b.textContent = 'Discard'; }, 3000); return; }
    st.cur = null; st.done = {}; for (const k in drafts) delete drafts[k]; save(); b.textContent = 'Discard'; renderWorkout(); toast('Workout discarded');
  });
  // progress chart for one exercise (best estimated max, or best reps, per session)
  function progressChart(e) {
    const L = st.log[e.id] || [], W = needsW(e); if (L.length < 2) return '';
    const pts = L.slice(-12).map(x => { const b = bestOf(x.sets, W); return { t: x.t, v: b ? (W ? toD(b.v) : b.v) : 0 }; }).filter(p => p.v > 0); if (pts.length < 2) return '';
    const mn = Math.min(...pts.map(p => p.v)), mx = Math.max(...pts.map(p => p.v)), pad = (mx - mn) * .15 || 1, lo = mn - pad, hi = mx + pad, Wd = 320, H = 110;
    const xy = pts.map((p, i) => [12 + i * (Wd - 24) / (pts.length - 1), H - 14 - (p.v - lo) / (hi - lo) * (H - 28)]);
    const d = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
    const change = pts[pts.length - 1].v - pts[0].v;
    return `<div class="sec"><div class="ttl-row"><h3>Your progress</h3><span>${W ? 'Estimated 1-rep max' : 'Best set'} · ${change >= 0 ? '+' : ''}${fmtN(Math.round(change * 10) / 10)} ${W ? unitW() : repWord(e)}</span></div>
      <div class="lst" style="padding:10px 8px"><svg class="chart" viewBox="0 0 ${Wd} ${H}" preserveAspectRatio="none" role="img" aria-label="Progress over your last ${pts.length} sessions"><path d="${d}" fill="none" stroke="var(--red)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"/>${xy.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.5" fill="var(--red)"/>`).join('')}</svg>
      <div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--ink-3);padding:0 6px"><span>${new Date(pts[0].t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span><span>${fmtN(Math.round(pts[pts.length - 1].v))} ${W ? unitW() : repWord(e)}</span><span>${new Date(pts[pts.length - 1].t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></div></div></div>`;
  }
  function historyFor(e) {
    const L = (st.log[e.id] || []).slice(-3).reverse(), W = needsW(e), pr = st.prs[e.id];
    if (!L.length) return '';
    return `<div class="sec"><div class="ttl-row"><h3>Recent sets</h3>${pr ? `<span>Record: ${setTxt(pr, W)} ${W ? unitW() : repWord(e)}</span>` : ''}</div><div class="lst">${L.map(x => `<div><span class="grow"><b>${new Date(x.t).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</b></span><span class="val" style="font-weight:600">${x.sets.map(s => setTxt(s, W)).join(' · ')}</span></div>`).join('')}</div></div>`;
  }
  // progress tab
  let importArm = 0;
  function renderProgress() {
    const H = st.hist, now = Date.now(), ws = weekStart(now), wk = H.filter(w => w.t0 >= ws), body = $('#progBody');
    const R = recoveryMap(), sug = suggestSplit();
    const gRec = GROUPS.map(g => ({ g, v: Math.round(g.subs.reduce((a, [m]) => a + R[m], 0) / g.subs.length) }));
    const recs = Object.entries(st.prs).filter(([id]) => EXI[id]).sort((a, b) => b[1].t - a[1].t).slice(0, 10);
    // last 4 weeks calendar
    const days = new Set(H.map(w => dayStart(w.t0))), start = new Date(ws); start.setDate(start.getDate() - 21); const today = dayStart(now);
    let cal = ''; for (let i = 0; i < 7; i++) cal += `<span>${'MTWTFSS'[i]}</span>`;
    for (let i = 0; i < 28; i++) { const t = new Date(start); t.setDate(start.getDate() + i); const k = t.getTime(); cal += `<i class="${days.has(k) ? 'on' : ''} ${k === today ? 'today' : ''} ${k > today ? 'fut' : ''}" title="${t.toDateString()}"></i>`; }
    body.innerHTML = `
      <div class="kpis"><div><b>${wk.length}</b><span>This week</span></div><div><b>${weekStreak()}</b><span>Week streak</span></div><div><b>${H.length}</b><span>Workouts</span></div></div>
      <div class="sec"><div class="ttl-row"><h3>Last 4 weeks</h3><span>${wk.length ? fmtBig(wk.reduce((a, w) => a + w.vol, 0)) + ' ' + unitW() + ' this week' : ''}</span></div><div class="cal">${cal}</div></div>
      <div class="sec"><div class="ttl-row"><h3>Recovery</h3><span>${H.length ? 'Based on your logged sets' : 'Log a workout to see this'}</span></div>
        <div class="card"><div class="rec-list">${gRec.map(({ g, v }) => `<div class="rec"><span>${esc(g.name)}</span><span class="bar"><i style="width:${v}%;background:${recColor(v)}"></i></span><span>${v}%</span></div>`).join('')}</div>
        ${sug ? `<button class="cta" id="progSug" style="height:48px;font-size:15px">Suggested next: ${esc(sug.name)}</button>` : ''}</div></div>
      <div class="sec"><div class="ttl-row"><h3>Personal records</h3><span>${Object.keys(st.prs).length || ''}</span></div><div class="lst">${recs.length ? recs.map(([id, p]) => { const e = EXI[id], W = needsW(e); return `<div><span class="grow"><b>${esc(e.name)}</b><span>${new Date(p.t).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></span><span class="val">${setTxt(p, W)} ${W ? unitW() : repWord(e)}${W ? `<small>≈ ${fmtW(p.v)} ${unitW()} max</small>` : ''}</span></div>`; }).join('') : '<div class="empty-row">Finish a workout to start setting records.</div>'}</div></div>
      <div class="sec"><div class="ttl-row"><h3>History</h3><span>${H.length ? `${H.length} workout${H.length > 1 ? 's' : ''}` : ''}</span></div><div class="lst">${H.length ? H.slice(-25).reverse().map(w => `<details><summary><span class="grow"><b>${esc(w.title)}</b><span>${new Date(w.t0).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${fmtDur(w.t1 - w.t0)} · ${w.n} sets${w.vol ? ' · ' + fmtBig(w.vol) + ' ' + unitW() : ''}</span></span></summary><ul>${w.ex.map(x => { const e = EXI[x.id]; return e ? `<li><b>${esc(e.name)}</b> — ${x.sets.map(s => setTxt(s, needsW(e))).join(', ')}</li>` : ''; }).join('')}</ul></details>`).join('') : '<div class="empty-row">Your finished workouts will show up here.</div>'}</div></div>
      <div class="sec"><div class="ttl-row"><h3>My routines</h3><span>No limit — save as many as you like</span></div><div class="lst" id="progRoutines">${st.routines.length ? '' : '<div class="empty-row">Build a workout, then tap “Save as routine”.</div>'}</div></div>
      <div class="sec"><h3>Settings</h3><div class="card">
        <div class="field"><span>Weight units</span><div class="seg" id="segUnits"></div></div>
        <div class="field"><span>Backup</span><div class="row-acts"><button class="btn-s ghost" id="expBtn">Export data</button><label class="btn-s ghost" style="display:inline-flex;align-items:center;cursor:pointer">Import<input type="file" id="impFile" accept=".json,application/json" hidden></label></div><small class="hint" style="font-size:12.5px;color:var(--ink-2)">Your data lives only on this phone. Export a backup now and then.</small></div>
      </div></div>`;
    const rl = $('#progRoutines');
    st.routines.slice().reverse().forEach(r => { const row = el('div', {}, `<span class="grow"><b>${esc(r.name)}</b><span>${r.ids.length} exercises${r.style && r.style !== 'straight' ? ' · ' + r.style + 's' : ''}</span></span>`); row.appendChild(el('button', { class: 'btn-s ghost', onclick: () => { showTab('train'); loadRoutine(r); } }, 'Load')); row.appendChild(el('button', { class: 'btn-s warn', 'aria-label': `Delete ${r.name}`, onclick: () => { st.routines = st.routines.filter(x => x !== r); save(); renderRoutines(); renderProgress(); toast(`Deleted “${r.name}”`); } }, 'Delete')); rl.appendChild(row); });
    const su = $('#segUnits'); for (const [v, l] of [['kg', 'Kilograms (kg)'], ['lb', 'Pounds (lb)']]) su.appendChild(el('button', { 'aria-pressed': (st.units || 'kg') === v, onclick: () => { st.units = v; save(); renderProgress(); } }, l));
    const sb = $('#progSug'); if (sb) sb.addEventListener('click', () => { showTab('train'); applySuggestion(); });
    $('#expBtn').addEventListener('click', () => {
      const data = JSON.stringify({ app: 'formwork', v: 1, at: new Date().toISOString(), hist: st.hist, log: st.log, prs: st.prs, routines: st.routines, units: st.units, eq: st.eq, favs: st.favs });
      if (window.self !== window.top) { (navigator.clipboard ? navigator.clipboard.writeText(data) : Promise.reject()).then(() => toast('Backup copied — paste it into Notes to keep it'), () => toast('Open the home-screen app to export a backup')); return; }
      try { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([data], { type: 'application/json' })); a.download = `formwork-backup-${new Date().toISOString().slice(0, 10)}.json`; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); toast('Backup downloaded'); }
      catch (err) { navigator.clipboard && navigator.clipboard.writeText(data).then(() => toast('Backup copied to clipboard')); }
    });
    $('#impFile').addEventListener('change', ev => {
      const f = ev.target.files[0]; if (!f) return; const rd = new FileReader();
      rd.onload = () => { try { const d = JSON.parse(rd.result); if (d.app !== 'formwork') throw 0; for (const k of ['hist', 'log', 'prs', 'routines', 'units', 'eq', 'favs']) if (d[k] !== undefined) st[k] = d[k]; save(); renderRoutines(); renderGearCounts(); renderProgress(); toast(`Restored ${st.hist.length} workouts`); } catch (err) { toast('That file isn’t a Formwork backup'); } };
      rd.readAsText(f);
    });
  }
  // body map mode: pick muscles or see recovery
  let mapMode = 'sel';
  function setMapMode(m) { mapMode = m; document.querySelectorAll('#mapMode button').forEach(b => b.setAttribute('aria-pressed', b.dataset.mm === m)); renderSelFoot(); drawMap(); }
  document.querySelectorAll('#mapMode button').forEach(b => b.addEventListener('click', () => setMapMode(b.dataset.mm)));

  /* ---------- library ---------- */
  let libRendered = false;
  function tile(e, avail) {
    const b = el('div', { class: 'tile' });
    const img = el('img', { class: 'thumb', alt: '' }); setThumb(img, e);
    const btn = el('button', { style: 'display:grid;text-align:left', 'aria-label': `Open ${e.name}` });
    btn.append(img, el('span', { class: 'tile-meta' }, `<b>${esc(e.name)}</b><span>${esc(e.pri.map(subLabel).join(' · '))}</span>`));
    btn.addEventListener('click', () => openSheet(e.id));
    const fav = el('button', { class: 'fav', 'aria-label': 'Save', 'aria-pressed': st.favs.includes(e.id) }, '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>');
    fav.addEventListener('click', ev => { ev.stopPropagation(); st.favs = st.favs.includes(e.id) ? st.favs.filter(x => x !== e.id) : st.favs.concat(e.id); save(); fav.setAttribute('aria-pressed', st.favs.includes(e.id)); if (st.libGroup === 'saved') renderLib(); });
    b.append(btn, fav);
    if (!avail) b.appendChild(el('span', { class: 'lock' }, 'Needs gear'));
    return b;
  }
  function renderLibGroups() {
    const box = $('#libGroups'); box.innerHTML = '';
    const opts = [['all', 'All'], ['saved', '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 3.5h12v17l-6-4.5-6 4.5z"/></svg>Saved']].concat(GROUPS.map(g => [g.id, esc(g.name)]));
    for (const [id, name] of opts) box.appendChild(el('button', { class: 'chip', 'aria-pressed': st.libGroup === id, onclick: () => { st.libGroup = id; save(); renderLibGroups(); renderLib(); } }, name));
  }
  function renderLib() {
    libRendered = true;
    const q = $('#libSearch').value.trim().toLowerCase(), set = eqSet();
    $('#libMine').setAttribute('aria-checked', st.libMine);
    const list = $('#libList'); list.innerHTML = ''; let shown = 0;
    const match = e => (!q || (e.name + ' ' + e.pri.concat(e.sec).map(subLabel).join(' ') + ' ' + eqText(e)).toLowerCase().includes(q)) && (!st.libMine || exAvailable(e, set));
    const groups = st.libGroup === 'saved' ? [{ id: 'saved', name: 'Saved', items: EX.filter(e => st.favs.includes(e.id)) }] : GROUPS.filter(g => st.libGroup === 'all' || st.libGroup === g.id).map(g => ({ ...g, items: EX.filter(e => SUB[e.pri[0]].group === g.id) }));
    for (const g of groups) {
      const items = g.items.filter(match); if (!items.length) continue;
      list.appendChild(el('div', { class: 'lib-h' }, esc(g.name)));
      const grid = el('div', { class: 'grid2' }); items.forEach(e => { grid.appendChild(tile(e, exAvailable(e, set))); shown++; }); list.appendChild(grid);
    }
    if (!shown) list.appendChild(el('div', { class: 'empty' }, st.libGroup === 'saved' ? 'Tap the bookmark on any exercise to save it here.' : st.libMine ? 'Nothing matches with your gear. Turn off “My gear only” to see everything.' : 'No exercises match that search.'));
    $('#libCount').textContent = `${shown} exercises`;
  }
  $('#libSearch').addEventListener('input', renderLib);
  $('#libMine').addEventListener('click', () => { st.libMine = !st.libMine; save(); renderLib(); });

  /* ---------- gear ---------- */
  function renderGear() {
    const set = eqSet(), pre = $('#gearPresets'); pre.innerHTML = '';
    for (const [name, items] of GEAR_PRESETS) { const on = items.length === set.size && items.every(x => set.has(x)); pre.appendChild(el('button', { class: 'chip', 'aria-pressed': on, onclick: () => { st.eq = items.slice(); onGearChange(); } }, esc(name))); }
    const cats = $('#eqCats'); cats.innerHTML = '';
    for (const c of EQUIP) {
      const box = el('div', { class: 'eq-cat' }, `<h3>${esc(c.cat)}</h3>`), grid = el('div', { class: 'eq-grid' });
      for (const [id, name] of c.items) grid.appendChild(el('button', { class: 'eq', 'aria-pressed': set.has(id), onclick: () => { st.eq = set.has(id) ? st.eq.filter(x => x !== id) : st.eq.concat(id); onGearChange(); } }, `<span class="ck"></span>${esc(name)}`));
      box.appendChild(grid); cats.appendChild(box);
    }
    const n = EX.filter(e => exAvailable(e, set)).length; $('#unlockN').textContent = n; $('#unlockT').textContent = EX.length; $('#unlockBar').style.width = `${(n / EX.length * 100).toFixed(1)}%`;
  }
  function renderGearCounts() { const set = eqSet(), n = EX.filter(e => exAvailable(e, set)).length; $('#gearCount').textContent = st.eq.length; $('#gearLineN').textContent = st.eq.length; $('#availN').textContent = n; }
  function onGearChange() { save(); renderGear(); renderGearCounts(); renderWorkout(); if (libRendered) renderLib(); }

  /* ---------- tabs ---------- */
  function showTab(t) {
    document.querySelectorAll('.tab').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t));
    $('#v-train').hidden = t !== 'train'; $('#v-lib').hidden = t !== 'lib'; $('#v-gear').hidden = t !== 'gear'; $('#v-prog').hidden = t !== 'prog';
    if (t === 'prog') renderProgress();
    if (t === 'lib') { renderLibGroups(); renderLib(); } if (t === 'gear') renderGear(); if (t === 'train') requestAnimationFrame(drawMap);
    window.scrollTo(0, 0);
  }
  document.querySelectorAll('.tab').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));
  $('#gearPill').addEventListener('click', () => showTab('gear')); $('#gearLineBtn').addEventListener('click', () => showTab('gear'));
  let toastT; function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 1700); }

  /* ---------- boot ---------- */
  renderRoutines();
  renderPresets(); renderGroups(); renderSelFoot();
  renderSeg('#segGoal', 'goal'); renderSeg('#segTime', 'time'); renderSeg('#segLevel', 'level'); renderSeg('#segStyle', 'style');
  renderBuildBtn(); renderGearCounts();
  if (!st.workout) st.workout = buildWorkout(7);
  renderWorkout();
  requestAnimationFrame(() => { try { initMap(); } catch (err) { console.error(err); initSvgMap(); } requestAnimationFrame(drawMap); });
  const hash = location.hash.slice(1); if (hash === 'library') showTab('lib'); else if (hash === 'gear') showTab('gear'); else if (hash === 'progress') showTab('prog');
  window.__fw = { openSheet, showTab, st, setMode, V, finishWorkout, save, setMapMode, renderWorkout, renderPresets, renderRoutines };
})();
