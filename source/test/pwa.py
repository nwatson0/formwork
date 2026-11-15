import asyncio
from playwright.async_api import async_playwright
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); errs=[]
        pg.on('pageerror', lambda e: errs.append(str(e)))
        await pg.goto('http://127.0.0.1:8767/site/'); await pg.wait_for_timeout(3000)
        info = await pg.evaluate("""async () => { const r = await navigator.serviceWorker.getRegistration(); const m = await (await fetch('manifest.webmanifest')).json(); return { sw: !!r && !!(r.active||r.waiting||r.installing), manifest: m.display + ' / ' + m.name, has3d: typeof FW3 !== 'undefined' && !!FW3 }; }""")
        print('online', info)
        await pg.reload(); await pg.wait_for_timeout(1500)
        print('controlled', await pg.evaluate("!!navigator.serviceWorker.controller"))
        await ctx.set_offline(True)
        await pg.reload(); await pg.wait_for_timeout(3000)
        print('offline title', await pg.title(), 'has3d', await pg.evaluate("typeof FW3 !== 'undefined' && !!FW3"), 'cards', await pg.evaluate("document.querySelectorAll('#wkList .ex-card').length"))
        await pg.evaluate("window.__fw.openSheet('pullup')"); await pg.wait_for_timeout(2500)
        await pg.screenshot(path='/tmp/claude-0/offline.png')
        print('errors', errs); await b.close()
asyncio.run(main())
