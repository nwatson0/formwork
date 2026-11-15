import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':400,'height':400}); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto("http://127.0.0.1:8767/test/sheet3d.html?ids=pushup&w=200&h=200"); await pg.wait_for_function("document.title==='done'")
        r = await pg.evaluate("""() => { const bad=[]; const t0=performance.now(); for (const e of EX) { try { const d=e.anim(); const A=new Anim(d); for (let k=0;k<6;k++){ const {pose}=A.poseAt(k/6*A.total); const J=solvePose(pose); for (const v of [J.root,J.armL.grip,J.legR.ankle]) if (v.some(x=>!isFinite(x))) throw new Error('NaN'); st.pose(J); st.props(A.propPrims(J,pose)); } st.render(0); const g=FORM.guidesFor(e); if(!g.length) bad.push('noguide:'+e.id); const m=FORM.mistakeFor(e); if(m){ const A2=new Anim(FORM.applyMistake(d,m)); A2.bounds(); } } catch(x){ bad.push(e.id+':'+x.message) } } return {bad, ms: performance.now()-t0}; }""")
        print(r, errs[:5]); await b.close()
asyncio.run(main())
