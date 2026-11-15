/* ===================== 3D stage (three.js) =====================
   Skinned anatomical mannequin driven by the pose solver, studio lighting,
   pooled equipment meshes. Falls back to the 2D renderer when WebGL is missing. */
const FW3 = (function () {
  const T = window.THREE;
  if (!T) return null;
  const test = document.createElement('canvas');
  try { if (!(test.getContext('webgl2') || test.getContext('webgl'))) return null; } catch (e) { return null; }

  /* ---------- body geometry ---------- */
  const b64 = (s, Type) => { const bin = atob(s), u8 = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i); return new Type(u8.buffer); };
  let GEO = null;
  function bodyGeometry() {
    if (GEO) return GEO;
    const M = BODY_MESH, n = M.n;
    const q = b64(M.pos, Uint16Array), pos = new Float32Array(n * 3);
    for (let i = 0; i < n * 3; i++) { const k = i % 3; pos[i] = M.mn[k] + q[i] / 65535 * (M.mx[k] - M.mn[k]); }
    const n8 = b64(M.nrm, Int8Array), nrm = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { const x = n8[i * 3] / 127, y = n8[i * 3 + 1] / 127, z = n8[i * 3 + 2] / 127, l = Math.hypot(x, y, z) || 1; nrm[i * 3] = x / l; nrm[i * 3 + 1] = y / l; nrm[i * 3 + 2] = z / l; }
    const att = b64(M.att, Uint8Array), col = new Float32Array(n * 3), mus = new Float32Array(n), musW = new Float32Array(n), clo = new Float32Array(n);
    for (let i = 0; i < n; i++) { const a = att[i * 4] / 255; col[i * 3] = col[i * 3 + 1] = col[i * 3 + 2] = a; mus[i] = att[i * 4 + 1]; clo[i] = att[i * 4 + 2] / 255; musW[i] = att[i * 4 + 3] / 255; }
    const si8 = b64(M.si, Uint8Array), sw8 = b64(M.sw, Uint8Array);
    const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n * 4; i++) { si[i] = si8[i]; sw[i] = sw8[i] / 255; }
    const g = new T.BufferGeometry();
    g.setAttribute('position', new T.BufferAttribute(pos, 3));
    g.setAttribute('normal', new T.BufferAttribute(nrm, 3));
    g.setAttribute('color', new T.BufferAttribute(col, 3));
    g.setAttribute('muscle', new T.BufferAttribute(mus, 1));
    g.setAttribute('cloth', new T.BufferAttribute(clo, 1));
    g.setAttribute('musW', new T.BufferAttribute(musW, 1));
    g.setAttribute('skinIndex', new T.Uint16BufferAttribute(si, 4));
    g.setAttribute('skinWeight', new T.BufferAttribute(sw, 4));
    g.setIndex(new T.BufferAttribute(M.i32 ? b64(M.idx, Uint32Array) : b64(M.idx, Uint16Array), 1));
    if (M.morph) { // gripping hands, one target per hand
      const mp = [], mnr = [];
      for (const S of ['L', 'R']) {
        const mo = M.morph[S], ix = b64(mo.idx, Uint16Array), dp = b64(mo.dp, Int16Array), dn = b64(mo.dn, Int8Array);
        const P = new Float32Array(n * 3), Nn = new Float32Array(n * 3);
        for (let k = 0; k < mo.n; k++) { const v = ix[k] * 3; for (let q = 0; q < 3; q++) { P[v + q] = dp[k * 3 + q] * M.morphScale; Nn[v + q] = dn[k * 3 + q] / 63; } }
        mp.push(new T.BufferAttribute(P, 3)); mnr.push(new T.BufferAttribute(Nn, 3));
      }
      g.morphAttributes.position = mp; g.morphAttributes.normal = mnr; g.morphTargetsRelative = true;
    }
    g.computeBoundingSphere();
    GEO = g; return g;
  }
  const MUSCLE_INDEX = Object.fromEntries(BODY_MESH.muscles.map((m, i) => [m, i]));

  /* ---------- bone frames from the solver ---------- */
  const fm = (o, x, y, z, m) => (m || new T.Matrix4()).set(x[0], y[0], z[0], o[0], x[1], y[1], z[1], o[1], x[2], y[2], z[2], o[2], 0, 0, 0, 1);
  const nz = v => norm(v);
  function limbFrames(A, isLeg) {
    const out = [];
    const y1 = A.d, z1 = isLeg ? mul(A.b, -1) : A.b;
    out.push([A.base, cross(y1, z1), y1, z1]);
    const y2 = A.c, z2 = isLeg ? mul(nz(A.pf), -1) : nz(A.pf);
    out.push([A.j1, cross(y2, z2), y2, z2]);
    return out;
  }
  // swing-only frame: carries the bind orientation along the shortest arc, so the shoulder / hip skin does not twist
  const SW = {};
  function swingFrame(key, P, d, o, F0) {
    let c = SW[key];
    if (!c) { if (!F0) return null; c = SW[key] = { d0: toLocal(F0.P, F0.d), ax: [F0.x, F0.y, F0.z].map(v => toLocal(F0.P, v)) }; }
    const dl = toLocal(P, d), ax = cross(c.d0, dl), sl = vlen(ax), ang = Math.atan2(sl, dot(c.d0, dl));
    const k = sl > 1e-6 ? mul(ax, 1 / sl) : null;
    const r = c.ax.map(v => dirW(P, k ? rotAxis(v, k, ang) : v));
    return [o, r[0], r[1], r[2]];
  }
  const FTW = 0.82;   // how much of the hand roll the far half of the forearm follows
  function rawFrames(J, bindInit) {
    const F = [];
    F.push([J.root, J.pel.x, J.pel.y, J.pel.z]);
    F.push([J.root, J.L.x, J.L.y, J.L.z]);
    F.push([J.waist, J.T.x, J.T.y, J.T.z]);
    const Nf = J.N || J.H;
    F.push([J.neckB, Nf.x, Nf.y, Nf.z]);
    F.push([J.neckTop, J.H.x, J.H.y, J.H.z]);
    F.push([J.shL, J.T.x, J.T.y, J.T.z]);
    F.push([J.shR, J.T.x, J.T.y, J.T.z]);
    const aL = limbFrames(J.armL, false), aR = limbFrames(J.armR, false);
    F.push(aL[0], aR[0], aL[1], aR[1]);
    for (const A of [J.armL, J.armR]) F.push([A.wrist, cross(A.h, A.t), A.h, A.t]);
    const lL = limbFrames(J.legL, true), lR = limbFrames(J.legR, true);
    F.push(lL[0], lR[0], lL[1], lR[1]);
    for (const G of [J.legL, J.legR]) { const y = G.fd, z = nz(sub(G.fu, mul(y, dot(G.fu, y)))); F.push([G.ankle, cross(y, z), y, z]); }
    // twist helpers
    const sw = (key, P, A, fr) => swingFrame(key, P, fr[2], fr[0], bindInit ? { P, d: fr[2], x: nz(fr[1]), y: fr[2], z: fr[3] } : null);
    F.push(sw('aL', J.C, J.armL, aL[0]), sw('aR', J.C, J.armR, aR[0]));
    [[J.armL, aL[1], 1], [J.armR, aR[1], -1]].forEach(([A, f, s]) => { const a = s * FTW * (A.tw || 0), x = nz(f[1]); F.push([f[0], rotAxis(x, f[2], a), f[2], rotAxis(f[3], f[2], a)]); });
    F.push(sw('lL', J.pel, J.legL, lL[0]), sw('lR', J.pel, J.legR, lR[0]));
    // toes hinge at the ball of the foot
    const tp = BODY_MESH.toePivot || [0, .13, -.06];
    [[J.legL, 17, 1], [J.legR, 18, -1]].forEach(([G, fi, s]) => { const f = F[fi], x = nz(f[1]), b = G.toeBend || 0; const o = add(add(madd(f[0], x, tp[0] * s), mul(f[2], tp[1])), mul(f[3], tp[2])); F.push([o, x, add(mul(f[2], Math.cos(b)), mul(f[3], Math.sin(b))), sub(mul(f[3], Math.cos(b)), mul(f[2], Math.sin(b)))]); });
    return F;
  }
  function boneFrames(J, mats, bindInit) {
    return rawFrames(J, bindInit).map((f, i) => fm(f[0], nz(f[1]), f[2], f[3], mats && mats[i]));
  }
  let BIND_INV = null;
  function bindInverses() {
    if (BIND_INV) return BIND_INV;
    BIND_INV = boneFrames(solvePose(BODY_MESH.bind), null, true).map(m => m.clone().invert());
    return BIND_INV;
  }

  /* ---------- materials ---------- */
  const C = h => new T.Color(h);
  function bodyMaterial(mode) {
    const mat = new T.MeshStandardMaterial({ color: mode === 'map' ? 0x24272c : 0x4a4f57, roughness: mode === 'map' ? 0.6 : 0.56, metalness: 0.0, vertexColors: true, envMapIntensity: mode === 'map' ? 0.22 : 0.3 });
    const u = {
      uHL: { value: new Float32Array(32) }, uWork: { value: C(0x9a1206) }, uAssist: { value: C(0x8a3a1c) }, uRim: { value: C(0x8fa2ff) },
      uTime: { value: 0 }, uCloth: { value: C(0x0d0e10) }, uMap: { value: mode === 'map' ? 1 : 0 }, uMistake: { value: 0 }, uDbg: { value: 0 }, uMuscleTone: { value: C(0x3a3e45) }
    };
    mat.userData.u = u;
    mat.onBeforeCompile = sh => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float muscle; attribute float musW; attribute float cloth; uniform float uHL[32]; varying float vHL; varying float vHA; varying float vCloth; varying float vMus; varying float vMid;')
        .replace('#include <begin_vertex>', '#include <begin_vertex>\nfloat lv = uHL[int(muscle + 0.5)]; vHL = step(1.5, lv) * musW; vHA = step(0.5, lv) * (1.0 - step(1.5, lv)) * musW; vCloth = cloth; vMus = muscle > 0.5 ? musW : 0.0; vMid = muscle; transformed += objectNormal * cloth * 0.0032;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying float vHL; varying float vHA; varying float vCloth; varying float vMus; varying float vMid; uniform float uDbg; uniform vec3 uWork; uniform vec3 uAssist; uniform vec3 uRim; uniform float uTime; uniform vec3 uCloth; uniform float uMap; uniform float uMistake; uniform vec3 uMuscleTone;')
        .replace('#include <color_fragment>', `#include <color_fragment>
          float aoV = vColor.r; float clothM = smoothstep(0.42, 0.58, vCloth);
          if (uMap > 0.5) diffuseColor.rgb = mix(diffuseColor.rgb, uMuscleTone * aoV, vMus * 0.85);
          diffuseColor.rgb = mix(diffuseColor.rgb, uCloth * (0.6 + 0.4 * aoV), clothM);
          if (uDbg > 0.5) { float id = floor(vMid + 0.5); diffuseColor.rgb = mix(vec3(0.05), 0.15 + 0.85 * abs(sin(vec3(id * 1.7, id * 2.9 + 1.0, id * 4.3 + 2.0))), vMus); }
          float hw = smoothstep(0.36, 0.56, vHL); float ha = smoothstep(0.36, 0.56, vHA) * (1.0 - hw); hw *= 1.0 - 0.45 * clothM; ha *= 1.0 - 0.45 * clothM;
          vec3 workC = mix(uWork, vec3(1.0, 0.12, 0.1), uMistake);
          diffuseColor.rgb = mix(diffuseColor.rgb, workC * (0.5 + 0.5 * aoV), hw * 0.95);
          diffuseColor.rgb = mix(diffuseColor.rgb, uAssist * (0.55 + 0.45 * aoV), ha * 0.55);`)
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.9, smoothstep(0.42, 0.58, vCloth));')
        .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
          float rimF = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 2.4);
          float pulse = 0.82 + 0.18 * sin(uTime * 3.2);
          totalEmissiveRadiance += uRim * rimF * (0.22 + uMap * 0.15) * (1.0 - smoothstep(0.42, 0.58, vCloth) * 0.7);
          totalEmissiveRadiance += vec3(0.85, 0.07, 0.02) * hw * 0.55 * pulse * (0.6 + 0.4 * aoV) + uAssist * ha * 0.1;
          totalEmissiveRadiance += vec3(0.55, 0.42, 1.0) * rimF * hw * 1.1 * pulse;`);
    };
    return mat;
  }
  const PROP_MAT = {};
  function propMat(key) {
    if (PROP_MAT[key]) return PROP_MAT[key];
    const S = (c, r, m, extra) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...extra });
    const table = {
      steel: S(0xd2d6dc, 0.22, 1.0), steelD: S(0x6a7079, 0.35, 0.9), iron: S(0x1d1f23, 0.55, 0.15), plate: S(0x16181b, 0.62, 0.05), plate2: S(0x1f2125, 0.6, 0.05),
      pad: S(0x0c0d0f, 0.6, 0.0, { envMapIntensity: 0.4 }), frame: S(0x22252a, 0.48, 0.6, { envMapIntensity: 0.6 }), cable: S(0x2b2e33, 0.5, 0.3), rope: S(0xb9a77e, 0.85, 0.0), band: S(0x22c46e, 0.55, 0.0),
      strap: S(0xf0b11d, 0.6, 0.0), ball: S(0x3a6fe0, 0.35, 0.0), ball2: S(0x8c5a2b, 0.75, 0.0), mat: S(0x0b0c0e, 0.95, 0.0, { envMapIntensity: 0.2 }), wall: S(0x15171b, 0.95, 0.0, { envMapIntensity: 0.3 }),
      plateStack: S(0x1a1c20, 0.55, 0.4), joint: S(0x888888, 0.5, 0), fig: S(0x888888, 0.5, 0),
    };
    PROP_MAT[key] = table[key] || table.frame;
    return PROP_MAT[key];
  }

  /* ---------- prop geometries ---------- */
  const GEO_CACHE = {};
  const geoC = (k, f) => GEO_CACHE[k] || (GEO_CACHE[k] = f());
  const cyl = (seg = 16) => geoC('cyl' + seg, () => new T.CylinderGeometry(1, 1, 1, seg, 1));
  const sphG = () => geoC('sph', () => new T.SphereGeometry(1, 28, 18));
  const plateG = () => geoC('plate', () => {
    const p = [[0.0, -0.5], [0.12, -0.5], [0.14, -0.38], [0.2, -0.36], [0.22, -0.5], [0.86, -0.5], [0.96, -0.46], [1.0, -0.3], [1.0, 0.3], [0.96, 0.46], [0.86, 0.5], [0.22, 0.5], [0.2, 0.36], [0.14, 0.38], [0.12, 0.5], [0.0, 0.5]].map(([x, y]) => new T.Vector2(x, y));
    const g = new T.LatheGeometry(p, 40); g.computeVertexNormals(); return g;
  });
  function roundedBox(w, h, d, r) {
    const key = `rb${w.toFixed(3)}_${h.toFixed(3)}_${d.toFixed(3)}`;
    return geoC(key, () => {
      const g = new T.BoxGeometry(w * 2, h * 2, d * 2, 6, 6, 6), p = g.attributes.position;
      const rr = Math.min(r, w * .95, h * .95, d * .95), inner = [w - rr, h - rr, d - rr];
      for (let i = 0; i < p.count; i++) {
        const v = [p.getX(i), p.getY(i), p.getZ(i)], c = v.map((x, k) => Math.max(-inner[k], Math.min(inner[k], x)));
        const dlt = [v[0] - c[0], v[1] - c[1], v[2] - c[2]], l = Math.hypot(...dlt) || 1;
        p.setXYZ(i, c[0] + dlt[0] / l * rr, c[1] + dlt[1] / l * rr, c[2] + dlt[2] / l * rr);
      }
      g.computeVertexNormals(); return g;
    });
  }
  const LINE_R = { cable: .0045, rope: .011, band: .008, strap: .012 };
  const Y = new T.Vector3(0, 1, 0), _v = new T.Vector3(), _q = new T.Quaternion(), _m = new T.Matrix4();
  class PropPool {
    constructor(group) { this.g = group; this.items = []; }
    make(pr) {
      let geo, mat = propMat(pr.c), kind = pr.k;
      if (kind === 'cap') { geo = pr.c === 'pad' && pr.r > 0.035 ? geoC('cap' + pr.r.toFixed(3) + '_' + vlen(sub(pr.a, pr.b)).toFixed(2), () => new T.CapsuleGeometry(pr.r, Math.max(.001, vlen(sub(pr.a, pr.b))), 6, 18)) : cyl(pr.r > .02 ? 18 : 12); }
      else if (kind === 'sph') geo = sphG();
      else if (kind === 'box') geo = roundedBox(pr.h[0], pr.h[1], pr.h[2], pr.c === 'pad' ? .02 : pr.c === 'mat' || pr.c === 'wall' ? .004 : .008);
      else if (kind === 'disc') geo = (pr.c === 'plate' || pr.c === 'plate2') && pr.r > .1 ? plateG() : pr.c === 'iron' ? cyl(6) : cyl(28);
      else if (kind === 'line') { geo = cyl(10); mat = propMat(pr.c === 'band' || pr.c === 'strap' || pr.c === 'rope' ? pr.c : 'cable'); }
      const m = new T.Mesh(geo, mat); m.castShadow = kind !== 'line' || pr.c !== 'cable'; m.receiveShadow = true; m.matrixAutoUpdate = false;
      if (kind === 'cap' && geo.type === 'CapsuleGeometry') m.userData.len0 = vlen(sub(pr.a, pr.b));
      this.g.add(m); return m;
    }
    update(prims) {
      for (let i = 0; i < prims.length; i++) {
        const pr = prims[i];
        const key = pr.k + '|' + pr.c + '|' + (pr.k === 'box' ? pr.h.map(x => x.toFixed(3)).join(',') : pr.k === 'disc' ? (pr.r > .1 ? 'L' : 'S') : pr.k === 'cap' ? (pr.c === 'pad' && pr.r > .035 ? 'C' + pr.r.toFixed(3) : pr.r > .02 ? 'T' : 't') : '');
        let it = this.items[i];
        if (!it || it.key !== key) { if (it) this.g.remove(it.m); it = this.items[i] = { key, m: this.make(pr) }; }
        const m = it.m; m.visible = true;
        if (pr.k === 'cap' || pr.k === 'line') {
          const a = pr.a, b = pr.b, d = sub(b, a), L = Math.max(1e-4, vlen(d)), r = pr.k === 'line' ? (LINE_R[pr.c] || .0045) : pr.r;
          _q.setFromUnitVectors(Y, _v.set(d[0] / L, d[1] / L, d[2] / L));
          const isCapsule = m.geometry.type === 'CapsuleGeometry';
          m.matrix.compose(_v.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), _q, isCapsule ? new T.Vector3(1, L / (m.userData.len0 || L), 1) : new T.Vector3(r, L, r));
        } else if (pr.k === 'sph') {
          m.matrix.compose(_v.set(...pr.p), _q.identity(), new T.Vector3(pr.r, pr.r, pr.r));
        } else if (pr.k === 'disc') {
          _q.setFromUnitVectors(Y, new T.Vector3(...pr.n));
          const th = pr.th || .02;
          m.matrix.compose(_v.set(...pr.p), _q, new T.Vector3(pr.r, th, pr.r));
        } else if (pr.k === 'box') {
          const [x, y, z] = pr.ax;
          _m.makeBasis(new T.Vector3(...x), new T.Vector3(...y), new T.Vector3(...z));
          _m.setPosition(pr.p[0], pr.p[1], pr.p[2]);
          m.matrix.copy(_m);
        }
        m.matrixWorldNeedsUpdate = true;
      }
      for (let i = prims.length; i < this.items.length; i++) this.items[i].m.visible = false;
    }
    clear() { for (const it of this.items) this.g.remove(it.m); this.items = []; }
  }

  /* ---------- environment ---------- */
  function envFor(renderer) {
    const pm = new T.PMREMGenerator(renderer);
    const sc = new T.Scene();
    const room = new T.Mesh(new T.BoxGeometry(10, 6, 10), new T.MeshBasicMaterial({ color: 0x0b0c0f, side: T.BackSide })); room.position.y = 2; sc.add(room);
    const panel = (w, h, c, p, r) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(...p); m.lookAt(0, 1, 0); sc.add(m); };
    panel(4, 1.2, 0x9a9da3, [-2.5, 4, 2.5]); panel(3, 2, 0x3c4290, [3.5, 2, -3]); panel(3, 2, 0x2f6f8f, [-3.5, 1.5, -3]); panel(6, .6, 0x70737a, [0, 4.9, 0]); panel(2, 3, 0x4a4f5a, [4.5, 1.5, 3]);
    const tex = pm.fromScene(sc, 0.035).texture; pm.dispose(); return tex;
  }
  function floorTex() {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d');
    const gr = g.createRadialGradient(128, 128, 0, 128, 128, 128); gr.addColorStop(0, '#fff'); gr.addColorStop(.45, '#bbb'); gr.addColorStop(1, '#000');
    g.fillStyle = gr; g.fillRect(0, 0, 256, 256); const t = new T.CanvasTexture(c); return t;
  }

  /* ---------- stage ---------- */
  class Stage {
    constructor(canvas, opts = {}) {
      this.opts = opts;
      this.canvas = canvas;
      const r = this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: !!opts.preserve, powerPreference: 'high-performance' });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.maxDpr || 2));
      r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = opts.map ? 0.95 : 0.92;
      r.shadowMap.enabled = !opts.map; r.shadowMap.type = T.PCFSoftShadowMap;
      r.setClearColor(0x000000, 0);
      const sc = this.scene = new T.Scene();
      sc.environment = envFor(r);
      this.camera = new T.PerspectiveCamera(opts.fov || 26, 1, 0.05, 60);
      // lights
      sc.add(new T.HemisphereLight(0xc9d2ff, 0x101114, opts.map ? 0.26 : 0.1));
      const key = this.key = new T.DirectionalLight(0xfff3e6, opts.map ? 1.15 : 1.5); key.position.set(-2.2, 4.2, 3.2);
      if (!opts.map) { key.castShadow = true; key.shadow.mapSize.set(opts.shadowSize || 1024, opts.shadowSize || 1024); const s = key.shadow.camera; s.left = s.bottom = -1.8; s.right = s.top = 1.8; s.near = 0.5; s.far = 12; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.025; }
      sc.add(key); sc.add(key.target);
      const fill = this.fill = new T.DirectionalLight(0xbfd0ff, 0.14); sc.add(fill); sc.add(fill.target);
      const rimA = this.rimA = new T.DirectionalLight(0x7a6cff, opts.map ? 0.9 : 1.05); sc.add(rimA); sc.add(rimA.target);
      const rimB = this.rimB = new T.DirectionalLight(0x4cc3ff, opts.map ? .55 : .6); sc.add(rimB); sc.add(rimB.target);
      // floor
      if (!opts.map) {
        const fl = this.floor = new T.Mesh(new T.CircleGeometry(3.2, 72), new T.MeshLambertMaterial({ color: 0x07080a, alphaMap: floorTex(), transparent: true, depthWrite: false }));
        fl.rotation.x = -Math.PI / 2; fl.receiveShadow = true; fl.renderOrder = -1; sc.add(fl);
        const ring = new T.Mesh(new T.RingGeometry(0.98, 1.0, 96), new T.MeshBasicMaterial({ color: 0x8a96ff, transparent: true, opacity: 0.18 }));
        ring.rotation.x = -Math.PI / 2; ring.position.y = 0.002; this.ring = ring; sc.add(ring);
      }
      // body
      const geo = bodyGeometry();
      this.bodyMat = bodyMaterial(opts.map ? 'map' : 'stage');
      const mesh = this.body = new T.SkinnedMesh(geo, this.bodyMat);
      mesh.castShadow = !opts.map; mesh.receiveShadow = !opts.map; mesh.frustumCulled = false;
      const boneRoot = new T.Group(); sc.add(boneRoot);
      this.bones = BODY_MESH.bones.map(() => { const b = new T.Bone(); b.matrixAutoUpdate = false; boneRoot.add(b); return b; });
      this.skeleton = new T.Skeleton(this.bones, bindInverses());
      mesh.bind(this.skeleton, new T.Matrix4());
      sc.add(mesh);
      this.mats = this.bones.map(() => new T.Matrix4());
      this.propGroup = new T.Group(); sc.add(this.propGroup);
      this.pool = new PropPool(this.propGroup);
      this.size = [0, 0];
    }
    setHighlight(levels) { const a = this.bodyMat.userData.u.uHL.value; a.fill(0); for (const k in levels) { const i = MUSCLE_INDEX[k]; if (i != null) a[i] = levels[k]; } }
    setMistake(on) { this.bodyMat.userData.u.uMistake.value = on ? 1 : 0; }
    pose(J) {
      boneFrames(J, this.mats);
      for (let i = 0; i < this.bones.length; i++) { this.bones[i].matrix.copy(this.mats[i]); this.bones[i].matrixWorldNeedsUpdate = true; }
      const mi = this.body.morphTargetInfluences;
      if (mi) { mi[0] = J.armL.curl ?? 1; mi[1] = J.armR.curl ?? 1; }
    }
    props(prims) { this.pool.update(prims); }
    resize(w, h) {
      if (w === this.size[0] && h === this.size[1]) return;
      this.size = [w, h]; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; this.camera.updateProjectionMatrix();
    }
    // yaw/pitch in degrees using the 2D convention: yaw 0 = facing camera, 90 = right side
    aim(bounds, yaw, pitch, zoom = 1, lift = 0) {
      const c = bounds.center, cam = this.camera;
      const y = yaw * D2R, p = pitch * D2R;
      const dir = [-Math.sin(y) * Math.cos(p), Math.sin(p), Math.cos(y) * Math.cos(p)];
      const vf = cam.fov * D2R / 2, hf = Math.atan(Math.tan(vf) * cam.aspect);
      const halfH = (bounds.ymax - bounds.ymin) / 2 * Math.cos(p) + bounds.rad * Math.abs(Math.sin(p));
      const dist = Math.max(halfH / Math.tan(vf), bounds.rad / Math.tan(hf)) * 0.98 / zoom + bounds.rad * 0.5;
      const tgt = [c[0], (bounds.ymin + bounds.ymax) / 2 + lift * (bounds.ymax - bounds.ymin), c[2]];
      cam.position.set(tgt[0] + dir[0] * dist, tgt[1] + dir[1] * dist, tgt[2] + dir[2] * dist);
      cam.lookAt(tgt[0], tgt[1], tgt[2]);
      cam.updateMatrixWorld();
      if (this.ring) { this.ring.position.x = c[0]; this.ring.position.z = c[2]; const s = Math.max(.75, bounds.rad * .9); this.ring.scale.set(s, s, s); }
      if (this.floor) { this.floor.position.x = c[0]; this.floor.position.z = c[2]; }
      // studio lights travel with the camera so every angle is lit like a product shot
      const fwd = new T.Vector3(-dir[0], 0, -dir[2]).normalize(), up = new T.Vector3(0, 1, 0), right = new T.Vector3().crossVectors(fwd, up).normalize();
      const place = (L, r, u, f, ty = 0.7) => { L.position.set(c[0] + right.x * r + fwd.x * f, u, c[2] + right.z * r + fwd.z * f); L.target.position.set(c[0], ty, c[2]); L.target.updateMatrixWorld(); };
      place(this.key, -1.8, 4.0, -3.0); place(this.fill, 2.4, 1.6, -2.2); place(this.rimA, 2.2, 2.6, 3.2); place(this.rimB, -2.6, 1.8, 3.0);
    }
    render(time = 0) { this.bodyMat.userData.u.uTime.value = time; this.renderer.render(this.scene, this.camera); }
    project(p, w, h) { const v = new T.Vector3(p[0], p[1], p[2]).project(this.camera); return [(v.x + 1) / 2 * w, (1 - v.y) / 2 * h, v.z]; }
  }
  return { Stage, bodyGeometry, MUSCLE_INDEX, T, boneFrames, bindInverses };
})();
