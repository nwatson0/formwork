import sys, asyncio
from playwright.async_api import async_playwright
async def main():
    mode, out = sys.argv[1], sys.argv[2]
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); msgs=[]
        pg.on('console', lambda m: msgs.append(m.type+': '+m.text) if m.type in ('error','warning') else None); pg.on('pageerror', lambda e: msgs.append('PAGEERR '+str(e)))
        await pg.goto('http://127.0.0.1:8767/dist/preview.html'); await pg.wait_for_timeout(2500)
        if mode=='full': await pg.screenshot(path=out, full_page=True)
        elif mode=='top': await pg.screenshot(path=out)
        elif mode.startswith('scroll:'):
            await pg.evaluate(f'window.scrollTo(0,{mode[7:]})'); await pg.wait_for_timeout(2500); await pg.screenshot(path=out)
        elif mode.startswith('ex:'):
            parts=mode[3:].split(':'); await pg.evaluate(f"window.__fw.openSheet('{parts[0]}', {parts[2] if len(parts)>2 else -1})")
            if len(parts)>1 and parts[1]: await pg.evaluate(f"window.__fw.setMode('{parts[1]}')")
            await pg.wait_for_timeout(2600)
            for a in sys.argv:
                if a.startswith('scroll='): await pg.evaluate(f"document.getElementById('sheet').scrollTop={a[7:]}"); await pg.wait_for_timeout(800)
            await pg.screenshot(path=out)
        elif mode in ('lib','gear'):
            await pg.evaluate(f"window.__fw.showTab('{mode}')"); await pg.wait_for_timeout(3500); await pg.screenshot(path=out)
        for m in msgs[:15]: print(m)
        await b.close()
asyncio.run(main())
