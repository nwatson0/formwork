// Measures key technique invariants on the solved poses (numbers, not eyeballing).
const fs = require('fs');
const R = new Function(['engine.js', 'moves.js', 'data.js'].map(f => fs.readFileSync(__dirname + '/../' + f, 'utf8')).join('\n') + ';return {EX, Anim, solvePose, mid, sub, dot, norm, vlen, toLocal}')();
const { EX, Anim, solvePose, mid, sub, norm } = R, D = 180 / Math.PI;
const ids = process.argv.slice(2);
for (const id of ids) {
  const e = EX.find(x => x.id === id); if (!e) { console.log(id, 'missing'); continue; }
  const A = new Anim(e.anim());
  A.frames.forEach((f, i) => {
    const J = solvePose(f), g = mid(J.armL.grip, J.armR.grip), mf = mid(mid(J.legL.heel, J.legL.toe), mid(J.legR.heel, J.legR.toe));
    const fa = norm(sub(J.armL.wrist, J.armL.j1)), sh = norm(sub(J.legL.ankle, J.legL.j1)), tor = norm(sub(J.neckB, J.root));
    const ua = norm(sub(J.armL.j1, J.shL)), tdown = norm(sub(J.root, J.neckB));
    const tuck = Math.acos(Math.max(-1, Math.min(1, ua[0] * tdown[0] + ua[1] * tdown[1] + ua[2] * tdown[2]))) * D;
    const kneeAng = Math.acos(R.dot(norm(sub(J.legL.base, J.legL.j1)), norm(sub(J.legL.ankle, J.legL.j1)))) * D;
    console.log(id.padEnd(14), 'f' + i, 'grip-midfoot z', ((g[2] - mf[2]) * 100).toFixed(0).padStart(4), 'cm | grip y', g[1].toFixed(2), '| sh-grip z', ((J.shL[2] - g[2]) * 100).toFixed(0).padStart(4), '| forearm from vertical', (Math.acos(Math.abs(fa[1])) * D).toFixed(0).padStart(3) + '°', '| torso from vertical', (Math.acos(tor[1]) * D).toFixed(0).padStart(3) + '°', '| shin fwd', (Math.asin(-sh[2]) * D * -1).toFixed(0).padStart(4) + '°', '| knee', kneeAng.toFixed(0) + '°', '| hip y', J.hipL[1].toFixed(2), 'knee y', J.legL.j1[1].toFixed(2), '| arm-torso', tuck.toFixed(0) + '°', '| knee z-toe z', ((J.legL.j1[2] - J.legL.toe[2]) * 100).toFixed(0));
  });
}
