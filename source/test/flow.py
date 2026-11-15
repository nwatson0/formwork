import sys, asyncio
from playwright.async_api import async_playwright
# usage: flow.py out.png "<js to run>" [wait_ms] [scrollY]
async def main():
    out, js = sys.argv[1], sys.argv[2]; wait = int(sys.argv[3]) if len(sys.argv) > 3 else 2500
    async with async_playwright() as p:
        b = await p.chromium.launch(args=['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'])
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, has_touch=True, is_mobile=True)
        pg = await ctx.new_page(); msgs=[]
        pg.on('pageerror', lambda e: msgs.append('PAGEERR '+str(e)))
        await pg.goto('http://127.0.0.1:8767/dist/preview.html'); await pg.wait_for_timeout(2500)
        await pg.evaluate(js); await pg.wait_for_timeout(wait)
        await pg.screenshot(path=out)
        for m in msgs[:10]: print(m)
        await b.close()
asyncio.run(main())
