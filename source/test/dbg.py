import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        pg = await b.new_page(viewport={'width':800,'height':600})
        await pg.goto("http://127.0.0.1:8767/test/sheet3d.html?bind=1&cols=3&w=400&h=600&yaws=20")
        await pg.wait_for_function("document.title==='done'")
        r = await pg.evaluate("""() => { const s=st; const out={}; out.floor=s.floor.material.color.getHexString(); out.lights=s.scene.children.filter(c=>c.isLight).map(l=>l.type+':'+l.intensity); out.legacy=THREE.ColorManagement.legacyMode; out.pcl=s.renderer.physicallyCorrectLights;
          const gl=s.renderer.getContext(); const px=new Uint8Array(4); gl.readPixels(200,100,1,1,gl.RGBA,gl.UNSIGNED_BYTE,px); out.px=[...px]; return out; }""")
        print(r); await b.close()
asyncio.run(main())
