// Loads the CC0 MakeHuman base mesh, applies shape targets, exposes rig joints + weights.
const fs = require('fs'), path = require('path');
const D = path.join(__dirname, 'mh');
const REPO = '/home/claude/mhrepo/makehuman/data/targets';
let INDEX = null;
function findTarget(name) {
  const local = path.join(D, name + '.target');
  if (fs.existsSync(local)) return local;
  if (!INDEX) { INDEX = {}; const walk = d => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else if (e.name.endsWith('.target')) INDEX[e.name.slice(0, -7)] = f; } }; if (fs.existsSync(REPO)) walk(REPO); }
  if (!INDEX[name]) throw new Error('target not found: ' + name);
  fs.copyFileSync(INDEX[name], local);   // keep a local copy of everything the build uses
  return local;
}
function load(targets) {
  const V = [], faces = []; let g = null;
  for (const l of fs.readFileSync(path.join(D, 'base.obj'), 'utf8').split('\n')) {
    if (l.startsWith('v ')) { const p = l.split(/\s+/); V.push([+p[1], +p[2], +p[3]]); }
    else if (l.startsWith('g ')) g = l.split(/\s+/)[1];
    else if (l.startsWith('f ')) faces.push({ g, v: l.trim().split(/\s+/).slice(1).map(s => parseInt(s) - 1) });
  }
  for (const [name, w] of targets) {
    if (!w) continue;
    for (const l of fs.readFileSync(findTarget(name), 'utf8').split('\n')) {
      if (!l || l[0] === '#') continue; const p = l.trim().split(/\s+/); if (p.length < 4) continue;
      const i = +p[0]; V[i][0] += w * +p[1]; V[i][1] += w * +p[2]; V[i][2] += w * +p[3];
    }
  }
  const sk = JSON.parse(fs.readFileSync(path.join(D, 'default.mhskel'), 'utf8'));
  const jp = {};
  for (const k in sk.joints) { const c = [0, 0, 0]; for (const i of sk.joints[k]) { c[0] += V[i][0]; c[1] += V[i][1]; c[2] += V[i][2]; } jp[k] = c.map(x => x / sk.joints[k].length); }
  const bones = {};
  for (const k in sk.bones) bones[k] = { head: jp[sk.bones[k].head], tail: jp[sk.bones[k].tail], parent: sk.bones[k].parent };
  const W = JSON.parse(fs.readFileSync(path.join(D, 'default_weights.mhw'), 'utf8')).weights;
  return { V, faces, bones, W };
}
module.exports = { load };
