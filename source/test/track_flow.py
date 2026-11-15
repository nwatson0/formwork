import sys, asyncio
from playwright.async_api import async_playwright
SEED = r"""
(() => { const fw = window.__fw, st = fw.st, now = Date.now(), D = 864e5;
  const mk = (daysAgo, title, ex) => { const t0 = now - daysAgo * D - 3600e3, t1 = t0 + 52 * 6e4; const exs = ex.map(([id, w, reps]) => ({ id, sets: reps.map(r => ({ w, r })) }));
    for (const x of exs) { (st.log[x.id] = st.log[x.id] || []).push({ t: t0, sets: x.sets }); const W = x.sets[0].w > 0; let b = null; for (const s of x.sets) { const v = W ? s.w * (1 + s.r / 30) : s.r; if (!b || v > b.v) b = { v, w: s.w, r: s.r }; } if (!st.prs[x.id] || b.v > st.prs[x.id].v) st.prs[x.id] = { ...b, t: t1 }; }
    st.hist.push({ t0, t1, title, ex: exs, vol: exs.reduce((a, x) => a + x.sets.reduce((b, s) => b + s.w * s.r, 0), 0), n: exs.reduce((a, x) => a + x.sets.length, 0) }); };
  st.hist = []; st.log = {}; st.prs = {};
  mk(19, 'Push day', [['bb-bench', 55, [10, 9, 8]], ['db-shoulder-press', 16, [10, 10, 9]], ['pushdown', 25, [12, 12, 11]]]);
  mk(17, 'Pull day', [['lat-pulldown', 50, [10, 10, 9]], ['bb-row', 50, [10, 9, 9]], ['db-curl', 12, [12, 11, 10]]]);
  mk(15, 'Leg day', [['back-squat', 70, [8, 8, 7]], ['rdl', 60, [10, 10, 10]], ['standing-calf', 40, [12, 12, 12]]]);
  mk(12, 'Push day', [['bb-bench', 57.5, [10, 10, 9]], ['db-shoulder-press', 16, [10, 10, 10]], ['pushdown', 27.5, [12, 11, 11]]]);
  mk(10, 'Pull day', [['lat-pulldown', 52.5, [10, 10, 10]], ['bb-row', 52.5, [10, 10, 9]], ['db-curl', 12, [12, 12, 11]]]);
  mk(8, 'Leg day', [['back-squat', 72.5, [8, 8, 8]], ['rdl', 62.5, [10, 10, 10]], ['standing-calf', 42.5, [12, 12, 12]]]);
  mk(5, 'Push day', [['bb-bench', 60, [10, 10, 10]], ['db-shoulder-press', 18, [10, 9, 9]], ['pushdown', 27.5, [12, 12, 12]]]);
  mk(1, 'Pull day', [['lat-pulldown', 55, [10, 10, 9]], ['bb-row', 55, [10, 10, 10]], ['db-curl', 14, [10, 10, 9]], ['pullup', 0, [8, 7, 6]]]);
  st.routines = [{ name: 'Push day', ids: ['bb-bench', 'db-shoulder-press', 'pushdown'], style: 'straight', sel: ['mid-chest', 'front-delts', 'triceps-lateral'], t: now }];
  fw.save(); fw.renderPresets(); fw.renderRoutines(); fw.renderWorkout(); })()
"""
async def main():
    out = sys.argv[1]; steps = sys.argv[2:]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); msgs=[]
        pg.on('pageerror', lambda e: msgs.append('PAGEERR '+str(e)))
        await pg.goto('http://127.0.0.1:8767/dist/preview.html'); await pg.wait_for_timeout(2500)
        await pg.evaluate(SEED); await pg.wait_for_timeout(300)
        n = 0
        for s in steps:
            if s.startswith('js:'): await pg.evaluate(s[3:]); await pg.wait_for_timeout(1200)
            elif s.startswith('wait:'): await pg.wait_for_timeout(int(s[5:]))
            elif s == 'shot': await pg.screenshot(path=f'{out}{n}.png', timeout=120000); n += 1
        for m in msgs[:10]: print(m)
        await b.close()
asyncio.run(main())
